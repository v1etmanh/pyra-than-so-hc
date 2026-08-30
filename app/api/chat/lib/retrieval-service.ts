/**
 * RAG retrieval service supporting Supabase pgvector (Primary Cloud)
 * and ChromaDB (Local fallback).
 *
 * Flow: expand query -> route metadata filters -> query vector store (Supabase pgvector)
 * -> rerank with Jina when configured -> assemble context.
 */
import { getJinaEmbedding, jinaRerank } from './jina-service';
import { expandQueryForRetrieval } from './query-expansion';
import { querySupabaseVector, type VectorMatch } from './supabase-vector-client';
import { queryChroma, type ChromaMatch } from './chroma-client';
import type { UserProviderConfig } from './response-generator';

export interface RetrievalSource {
  title: string;
  content: string;
  refLink?: string;
  collection: 'chunk' | 'summary' | 'qa';
  score: number;
  language?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface RetrievalResult {
  context: string;
  sources: RetrievalSource[];
  detectedLanguage: string;
}

const TOP_K = 10;
const FINAL_SOURCE_COUNT = 3;
const MAX_CONTEXT_CHARS = 64_000;

const DECISION_CATEGORY_KEYWORDS: Array<[string[], string]> = [
  [['uống', 'cà phê', 'cafe', 'coffee', 'trà', 'trà sữa', 'nước ép', 'detox', 'đồ uống', 'drink', 'juice'], 'drink'],
  [['ăn', 'món ăn', 'bữa sáng', 'bữa trưa', 'bữa tối', 'ăn vặt', 'tráng miệng', 'cay', 'thanh đạm', 'food', 'breakfast', 'lunch', 'dinner', 'snack', 'cuisine'], 'food'],
  [['mặc', 'trang phục', 'quần áo', 'áo', 'quần', 'túi xách', 'giày', 'nước hoa', 'màu may mắn', 'phối đồ', 'fashion', 'outfit', 'style', 'bag', 'shoes', 'perfume'], 'fashion'],
  [['lối sống', 'dọn dẹp', 'ví tiền', 'bàn làm việc', 'lộ trình', 'phương tiện', 'đi xe', 'đi bộ', 'lifestyle', 'declutter', 'wallet', 'workspace', 'transport'], 'lifestyle'],
  [['mối quan hệ', 'hẹn hò', 'người yêu', 'giao tiếp', 'tình cảm', 'lắng nghe', 'chia sẻ', 'việc tốt', 'relationship', 'date', 'check_in', 'affirmation'], 'relationship'],
  [['thư giãn', 'nghe nhạc', 'đọc sách', 'xem phim', 'podcast', 'playlist', 'ngắm trời', 'thiền', 'relax', 'book', 'film', 'music', 'meditation'], 'relax'],
  [['sức khỏe', 'giấc ngủ', 'đi ngủ', 'tập thể dục', 'ngâm chân', 'giãn cơ', 'tắm', 'skincare', 'dưỡng da', 'thực phẩm chức năng', 'wellness', 'exercise', 'sleep', 'bedtime', 'shower'], 'wellness'],
  [['công việc', 'ưu tiên', 'đàm phán', 'ý tưởng mới', 'dự án', 'pomodoro', 'deep work', 'inbox', 'đồng ý hay từ chối', 'work', 'priority', 'negotiation', 'project'], 'work']
];

interface RoutedFilter {
  personalDay?: string;
  decisionCategory?: string;
  indicatorKey?: string;
  numberValue?: string;
}

function routeMetadata(query: string): RoutedFilter {
  const normalized = query.toLowerCase();

  // Extract Personal Day (1-9)
  const dayMatch = normalized.match(
    /(?:ngày\s*(?:cá\s*nhân)?|personal\s*day|day)\s*(\d{1,2})/i
  );
  let personalDay = dayMatch?.[1];
  if (personalDay && (parseInt(personalDay, 10) < 1 || parseInt(personalDay, 10) > 9)) {
    personalDay = undefined;
  }

  // Extract Decision Category
  let decisionCategory: string | undefined;
  for (const [keywords, cat] of DECISION_CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      decisionCategory = cat;
      break;
    }
  }

  // Extract General Number value
  const numMatch = normalized.match(
    /(?:số|number|no\.?|đường đời|life path|master)\s*(\d{1,2}(?:\s*\/\s*\d)?)/i
  );
  const numberValue = numMatch?.[1]?.replace(/\s+/g, '');

  return {
    personalDay,
    decisionCategory,
    numberValue
  };
}

function mapMatchToSource(match: VectorMatch | ChromaMatch): RetrievalSource {
  const metadata = match.metadata ?? {};
  const title = String(metadata.title || metadata.source_file || 'Numerology knowledge');
  const score = typeof match.score === 'number' ? Math.max(0, match.score) : 0;

  return {
    title,
    content: match.document,
    refLink: String(metadata.source_file || ''),
    collection: 'chunk',
    score,
    language: String(metadata.language || 'vi'),
    metadata
  };
}

function deduplicateSources(sources: RetrievalSource[]): RetrievalSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.title.toLowerCase()}|${source.content.slice(0, 120)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function rerankSources(
  query: string,
  sources: RetrievalSource[]
): Promise<RetrievalSource[]> {
  if (sources.length <= FINAL_SOURCE_COUNT) return sources;

  if ((process.env.JINA_MODE || 'api').toLowerCase() !== 'hash') {
    try {
      const rerankResponse = await jinaRerank(
        query,
        sources.map((source) => `${source.title}\n${source.content}`),
        FINAL_SOURCE_COUNT
      );
      const ranked = Array.isArray(rerankResponse?.results)
        ? rerankResponse.results
            .filter((item: { index?: unknown }) => typeof item.index === 'number')
            .map((item: { index: number; relevance_score?: number }) => {
              const source = sources[item.index];
              if (!source) return null;
              return {
                source,
                score:
                  typeof item.relevance_score === 'number'
                    ? item.relevance_score
                    : source.score
              };
            })
            .filter(
              (item: any): item is { source: RetrievalSource; score: number } =>
                item !== null
            )
        : [];

      if (ranked.length > 0) {
        return ranked.slice(0, FINAL_SOURCE_COUNT).map((item: any) => ({
          ...item.source,
          score: item.score
        }));
      }
    } catch (error) {
      console.warn('[RAG] Jina rerank failed; using vector scores:', error);
    }
  }

  return [...sources]
    .sort((a, b) => b.score - a.score)
    .slice(0, FINAL_SOURCE_COUNT);
}

function buildContextString(sources: RetrievalSource[]): string {
  let currentLength = 0;
  const sections: string[] = [];

  for (const source of sources) {
    const section = `# ${source.title}\n${source.content.trim()}`;
    if (currentLength + section.length > MAX_CONTEXT_CHARS) break;
    sections.push(section);
    currentLength += section.length;
  }

  return sections.length
    ? `### NUMEROLOGY KNOWLEDGE CONTEXT (SUPABASE PGVECTOR)\n${sections.join('\n\n---\n\n')}`
    : '';
}

export async function retrieveContext(
  query: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userProviderConfig?: UserProviderConfig,
  options?: { skipExpansion?: boolean; language?: string }
): Promise<RetrievalResult> {
  let searchQuery = query;
  let detectedLanguage = options?.language || 'Vietnamese';

  if (!options?.skipExpansion) {
    const expansion = await expandQueryForRetrieval(
      {
        originalQuery: query,
        systemPrompt,
        recentHistory: conversationHistory
      },
      userProviderConfig
    );
    searchQuery = expansion.expandedQuery;
    // An explicit UI locale takes precedence over heuristic detection so the
    // language selector also controls the language of the AI response.
    detectedLanguage = options?.language || expansion.detectedLanguage;
  }

  let queryEmbedding: number[] | undefined;
  if ((process.env.JINA_MODE || 'api').toLowerCase() !== 'hash') {
    try {
      queryEmbedding = await getJinaEmbedding(searchQuery, 'retrieval.query');
    } catch (error) {
      console.warn('[RAG] Jina embedding failed:', error);
    }
  }

  const routed = routeMetadata(searchQuery);
  const vectorStore = (process.env.VECTOR_STORE || 'supabase').toLowerCase();
  let matches: Array<VectorMatch | ChromaMatch> = [];

  if (vectorStore === 'supabase' && queryEmbedding) {
    try {
      // 1. First attempt: filtered query with personal_day and decision_category
      if (routed.personalDay || routed.decisionCategory) {
        matches = await querySupabaseVector({
          query_embedding: queryEmbedding,
          top_k: TOP_K,
          filter_personal_day: routed.personalDay,
          filter_decision_category: routed.decisionCategory
        });
      }

      // 2. Second attempt / Unfiltered fallback if filtered returned 0
      if (matches.length === 0) {
        matches = await querySupabaseVector({
          query_embedding: queryEmbedding,
          top_k: TOP_K
        });
      }
      console.log(`[Supabase Vector] Retrieved ${matches.length} chunks via pgvector`);
    } catch (supabaseError) {
      console.warn('[Supabase Vector] Search failed, attempting ChromaDB fallback:', supabaseError);
    }
  }

  // Fallback to ChromaDB if Supabase is disabled or failed
  if (matches.length === 0) {
    try {
      const chromaWhere: Record<string, unknown>[] = [];
      if (routed.personalDay) chromaWhere.push({ personal_day: routed.personalDay });
      if (routed.decisionCategory) chromaWhere.push({ decision_category: routed.decisionCategory });

      const wherePayload =
        chromaWhere.length === 0
          ? undefined
          : chromaWhere.length === 1
            ? chromaWhere[0]
            : { $and: chromaWhere };

      matches = await queryChroma({
        query: searchQuery,
        query_embedding: queryEmbedding,
        top_k: TOP_K,
        where: wherePayload
      });

      if (matches.length === 0 && wherePayload) {
        matches = await queryChroma({
          query: searchQuery,
          query_embedding: queryEmbedding,
          top_k: TOP_K
        });
      }
    } catch (chromaError) {
      console.warn('[ChromaDB Fallback] Search failed:', chromaError);
    }
  }

  const sources = await rerankSources(
    searchQuery,
    deduplicateSources(matches.map(mapMatchToSource))
  );

  return {
    context: buildContextString(sources),
    sources,
    detectedLanguage
  };
}
