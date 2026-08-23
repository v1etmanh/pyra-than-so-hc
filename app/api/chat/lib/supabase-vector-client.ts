/**
 * Supabase pgvector client for Numerology Knowledge RAG.
 * Direct cloud vector search using `match_numerology_chunks` RPC.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface VectorMatch {
  id: string;
  document: string;
  metadata: Record<string, string | number | boolean>;
  score: number;
}

export interface SupabaseVectorQueryPayload {
  query_embedding: number[];
  top_k?: number;
  threshold?: number;
  filter_category?: string;
  filter_decision_category?: string;
  filter_personal_day?: string;
}

interface RpcChunkResult {
  id: string;
  doc_id?: string;
  category?: string;
  decision_category?: string;
  personal_day?: string;
  question_id?: string;
  title?: string;
  content?: string;
  keywords?: string;
  metadata?: Record<string, any>;
  similarity?: number;
}

let cachedSupabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase URL or Key is not configured for vector search.');
  }

  cachedSupabase = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { 'x-application-name': 'numerology-rag' } }
  });

  return cachedSupabase;
}

export async function querySupabaseVector(
  payload: SupabaseVectorQueryPayload
): Promise<VectorMatch[]> {
  const supabase = getSupabaseClient();
  const topK = payload.top_k ?? 10;
  const matchThreshold = payload.threshold ?? 0.15;

  const { data, error } = await supabase.rpc('match_numerology_chunks', {
    query_embedding: payload.query_embedding,
    match_threshold: matchThreshold,
    match_count: topK,
    filter_category: payload.filter_category || null,
    filter_decision_category: payload.filter_decision_category || null,
    filter_personal_day: payload.filter_personal_day || null
  });

  if (error) {
    throw new Error(`Supabase pgvector RPC error: ${error.message} (${error.code})`);
  }

  const rows = (data || []) as RpcChunkResult[];

  return rows.map((row) => {
    const rawMeta = row.metadata || {};
    const metadata: Record<string, string | number | boolean> = {
      doc_id: row.doc_id || row.id,
      title: row.title || rawMeta.title || 'Numerology Knowledge',
      category: row.category || rawMeta.category || 'daily_decision',
      question_id: row.question_id || rawMeta.question_id || '',
      decision_category: row.decision_category || rawMeta.decision_category || '',
      personal_day: row.personal_day || rawMeta.personal_day || '',
      keywords: row.keywords || rawMeta.keywords || '',
      source_file: rawMeta.source_file || `${row.doc_id || row.id}.md`,
      ...rawMeta
    };

    return {
      id: row.id,
      document: row.content || '',
      metadata,
      score: typeof row.similarity === 'number' ? row.similarity : 0
    };
  });
}
