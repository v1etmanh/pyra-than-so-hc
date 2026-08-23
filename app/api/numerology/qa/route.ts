import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext, type RetrievalResult } from '@/app/api/chat/lib/retrieval-service';
import { createStreamingResponse, type UserProviderConfig } from '@/app/api/chat/lib/response-generator';
import { buildNumerologyQASystemPrompt } from '@/lib/numerology-qa-prompt';
import { searchSupabaseForProfile } from '@/lib/profile-knowledge';
import { buildMockAnswer, getMockIndicator } from '@/utils/numerology-qa';
import { normalizeNumerologyProfile, type NumerologyProfile24 } from '@/mocks/numerology-profile';

export const dynamic = 'force-dynamic';

type QARequest = {
  question?: unknown;
  indicatorKey?: unknown;
  indicatorValue?: unknown;
  locale?: unknown;
  profile?: unknown;
  mode?: unknown;
  providerConfig?: UserProviderConfig;
};

const EMPTY_RETRIEVAL: RetrievalResult = {
  context: '',
  sources: [],
  detectedLanguage: 'Vietnamese'
};

function profileSourceSummary(profile: NumerologyProfile24, hits: Awaited<ReturnType<typeof searchSupabaseForProfile>>) {
  return hits.map((hit) => ({
    title: `${hit.record.indicator_name || hit.indicatorKey} = ${hit.value}`,
    refLink: hit.record.title,
    collection: 'summary' as const,
    score: 1,
    metadata: { indicatorKey: hit.indicatorKey, value: String(profile[hit.indicatorKey] ?? hit.value), source: 'supabase' }
  }));
}

export async function POST(request: NextRequest) {
  let body: QARequest;
  try {
    body = (await request.json()) as QARequest;
  } catch {
    return NextResponse.json({ error: 'Body JSON không hợp lệ.' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (question.length < 3) {
    return NextResponse.json({ error: 'Câu hỏi phải có ít nhất 3 ký tự.' }, { status: 400 });
  }

  const indicatorKey = typeof body.indicatorKey === 'string' ? body.indicatorKey : undefined;
  const indicator = indicatorKey ? getMockIndicator(indicatorKey) : undefined;
  if (indicatorKey && !indicator) {
    return NextResponse.json({ error: 'Chỉ số không tồn tại trong mock catalog.' }, { status: 404 });
  }

  const locale = typeof body.locale === 'string' ? body.locale : 'vi';
  const mode = body.mode === 'inspect' || body.mode === 'mock' ? body.mode : 'stream';
  const normalizedProfile = normalizeNumerologyProfile(body.profile);

  let chromaResult = EMPTY_RETRIEVAL;
  try {
    chromaResult = await retrieveContext(
      question,
      '',
      [],
      body.providerConfig,
      { skipExpansion: true, language: locale }
    );
  } catch (error) {
    console.warn('[Numerology Q&A] ChromaDB search failed:', error);
  }

  const profileHits = await searchSupabaseForProfile(normalizedProfile.profile);
  const supabaseSources = profileSourceSummary(normalizedProfile.profile, profileHits);

  if (mode === 'inspect') {
    return NextResponse.json({
      mockProfile: normalizedProfile.usedMock,
      profile: normalizedProfile.profile,
      pipeline: {
        chroma: { sourceCount: chromaResult.sources.length, detectedLanguage: chromaResult.detectedLanguage },
        supabase: { hitCount: profileHits.length }
      },
      chromaSources: chromaResult.sources,
      supabaseSources
    });
  }

  if (mode === 'mock') {
    try {
      const mockAnswer = buildMockAnswer({
        question,
        indicator,
        indicatorValue:
          typeof body.indicatorValue === 'string' || typeof body.indicatorValue === 'number'
            ? body.indicatorValue
            : indicator
              ? normalizedProfile.profile[indicator.key]
              : undefined,
        locale
      });
      return NextResponse.json({
        ...mockAnswer,
        mockProfile: normalizedProfile.usedMock,
        pipeline: {
          chromaSources: chromaResult.sources.length,
          supabaseProfileHits: profileHits.length
        },
        sources: [...chromaResult.sources, ...supabaseSources]
      });
    } catch {
      return NextResponse.json(
        { error: 'Chưa tìm thấy chỉ số phù hợp. Hãy thử “Đường đời”, “Linh hồn” hoặc “Năm cá nhân”.' },
        { status: 404 }
      );
    }
  }

  const systemPrompt = buildNumerologyQASystemPrompt(
    question,
    normalizedProfile.profile,
    chromaResult,
    profileHits,
    chromaResult.detectedLanguage || locale
  );
  const llmStream = createStreamingResponse(
    systemPrompt,
    [{ role: 'user', content: question }],
    body.providerConfig
  );
  const encoder = new TextEncoder();
  const sources = [...chromaResult.sources, ...supabaseSources].map((source) => ({
    title: source.title,
    refLink: source.refLink,
    collection: source.collection,
    score: Math.round(source.score * 100) / 100
  }));

  const outputStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources, mockProfile: normalizedProfile.usedMock })}\n\n`));
      const reader = llmStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    }
  });

  return new Response(outputStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
