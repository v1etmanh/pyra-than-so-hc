import { NextRequest, NextResponse } from 'next/server';
import { generateTextResponse } from '@/lib/ai/response-generator';
import { getProviderCascade } from '@/lib/ai/provider-cascade';
import type { UserProviderConfig } from '@/lib/ai/types';
import {
  buildClassificationSystemPrompt,
  buildClassificationUserPrompt,
} from '@/lib/prompts/chat-classification';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';
import { personalityIndicatorFallbacks } from '@/lib/spiritual-agent/personality-indicators';
import { classifyFallbackIntent } from '@/lib/spiritual-agent/intent-classifier';
import {
  applyClassificationRouteOverrides,
  type AgentDecision,
  extractClassificationJson,
  intentSpreadDefaults,
  normalizeClassificationDecision,
  spreadCardCount,
} from '@/lib/spiritual-agent/classification-contract';
import { getRequestAccess, releaseRequestAccess, type RequestAccess } from '@/lib/billing/access';
import { apiCorsHeaders } from '@/lib/security/cors';
import { calculateAiCostUsd } from '@/lib/usage/ai-cost';
import { recordActualAiUsage } from '@/lib/usage/quota-service';

export const runtime = 'nodejs';

/**
 * Classification is deliberately pinned to the model evaluated for this task.
 * The main cascade remains available only if Groq credentials are absent.
 */
function classificationProvider(): UserProviderConfig | undefined {
  const groq = getProviderCascade().find((provider) => provider.name === 'Groq');
  if (!groq) return undefined;

  return {
    type: 'Groq',
    baseUrl: groq.baseUrl,
    apiKeys: groq.apiKeys,
    model: 'openai/gpt-oss-20b'
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: apiCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  let messageForFallback = '';
  let usageAccess: RequestAccess | null = null;
  try {
    const body = await request.json();
    const { message, profiles, requestId } = body;
    messageForFallback = typeof message === 'string' ? message.toLowerCase() : '';

    const isCouple = profiles?.length >= 2;
    const p1 = profiles?.[0]?.fullName || 'Người hỏi';
    const p2 = profiles?.[1]?.fullName;

    // 0. BỘ LỌC TỐC HÀNH: Phát hiện ngay câu hỏi rác / vô nghĩa / gõ phím ngẫu nhiên (<0.1ms, 0 token)
    const trashCheck = isTrashOrMeaninglessPrompt(message);
    if (trashCheck.isTrash) {
      const trashDecision: AgentDecision = {
        mode: 'single',
        intent: 'trash',
        needsTarot: false,
        spreadId: null,
        cardCount: 0,
        targetIndicators: [],
        thoughtProcess: `Phát hiện câu hỏi không có chủ đề hoặc mục đích rõ ràng (${trashCheck.reason}). Cần hướng dẫn người dùng đặt câu hỏi cụ thể.`,
        replyText: TRASH_PROMPT_GUIDANCE
      };
      return NextResponse.json({ ok: true, data: trashDecision }, { headers: apiCorsHeaders(request) });
    }

    const access = await getRequestAccess(request, 'ai_response', requestId);
    if (access instanceof Response) {
      for (const [key, value] of Object.entries(apiCorsHeaders(request))) access.headers.set(key, value);
      return access;
    }
    usageAccess = access;

    // 1. Trường hợp 2 hồ sơ: TỰ ĐỘNG KÍCH HOẠT THUẦN TỬ VI ĐẨU SỐ & BÁT TỰ TỨ TRỤ (KHÔNG CẦN TAROT)
    if (isCouple && p2) {
      const coupleDecision = {
        mode: 'compatibility',
        intent: 'love_match',
        needsTarot: false,
        spreadId: null,
        cardCount: 0,
        targetIndicators: ['walksOfLife', 'soul', 'tuvi_bazi'],
        thoughtProcess: `Tiểu Linh Miêu kết nối lá số Tử Vi Đẩu Số & Bát Tự Tứ Trụ của ${p1} & ${p2}: Luận giải chuyên sâu Thiên Can, Địa Chi, Cung Phu Thê, Ngũ Hành Nạp Âm và Quái Mệnh Bát Trạch (Thuần Tử Vi Bát Tự toàn diện, không cần rút bài Tarot).`
      };

      return NextResponse.json({ ok: true, data: coupleDecision, requestId }, { headers: apiCorsHeaders(request) });
    }

    // 2. Trường hợp 1 hồ sơ: DÙNG AI LLM TỰ ĐỘNG PHÂN TÍCH VÀ PHÂN LOẠI
    const systemPrompt = buildClassificationSystemPrompt();
    const userPrompt = buildClassificationUserPrompt(message, p1);

    const groqProvider = classificationProvider();
    if (groqProvider) {
      console.info('[API /api/chat/classify] Primary model: Groq/openai/gpt-oss-20b');
    }

    const completion = await generateTextResponse(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      groqProvider,
      {
        maxTokens: 500,
        temperature: 0.1,
        reasoningEffort: 'low',
        responseFormat: 'json_object',
        includeReasoning: false
      }
    );
    await recordActualAiUsage({
      reservation: usageAccess,
      route: '/api/chat/classify',
      provider: completion.provider,
      model: completion.actualModel || completion.model,
      inputTokens: completion.usage?.inputTokens,
      outputTokens: completion.usage?.outputTokens,
      costUsd: calculateAiCostUsd({
        provider: completion.provider,
        model: completion.actualModel || completion.model,
        inputTokens: completion.usage?.inputTokens,
        outputTokens: completion.usage?.outputTokens,
      }),
    });
    const parsedDecision = extractClassificationJson(completion.text);

    // LLM vẫn có thể nhận ra một câu không có chủ đề. Chuẩn hoá quyết định đó
    // để mobile có thể trả lời ngay, không tính chỉ số hay rút bài.
    const correctedDecision = applyClassificationRouteOverrides(parsedDecision, messageForFallback);
    const normalized = normalizeClassificationDecision(correctedDecision);
    if (normalized.intent === 'trash') {
      normalized.replyText = TRASH_PROMPT_GUIDANCE;
      await releaseRequestAccess(usageAccess, 'classified_as_trash');
      usageAccess = null;
    }

    return NextResponse.json({
      ok: true,
      data: normalized,
      requestId,
    }, { headers: apiCorsHeaders(request) });

  } catch (error: any) {
    console.warn('[API /api/chat/classify] Fallback activated:', error.message);
    
    // Fallback follows the same intent-to-spread mapping as normal classification.
    const intent = classifyFallbackIntent(messageForFallback);
    const needsDeepTimeline = ['gốc rễ', 'nguyên nhân sâu', 'hành động nào', 'đào sâu'].some((term) => messageForFallback.includes(term));
    const spreadId = intent === 'timing_trajectory' && needsDeepTimeline ? 'timeline' : intentSpreadDefaults[intent];
    const fallbackDecision: AgentDecision = {
      mode: 'single',
      intent: intent as AgentDecision['intent'],
      needsTarot: Boolean(spreadId),
      spreadId: spreadId as AgentDecision['spreadId'],
      cardCount: spreadCardCount(spreadId),
      targetIndicators: intent === 'core_personality' && messageForFallback.includes('sứ mệnh')
        ? ['mission', 'walksOfLife', 'soul']
        : personalityIndicatorFallbacks[intent] || [],
      thoughtProcess: intent === 'where_to_go'
        ? 'Tiểu Linh Miêu sẽ lọc địa điểm theo nhu cầu thực tế trước, rồi rút một lá Tarot để chọn vibe phù hợp.'
        : 'Tiểu Linh Miêu chọn trải bài phù hợp với chủ đề câu hỏi.'
    };

    return NextResponse.json({
      ok: true,
      data: fallbackDecision
    }, { headers: apiCorsHeaders(request) });
  }
}
