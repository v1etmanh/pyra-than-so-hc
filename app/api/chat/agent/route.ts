import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { evaluateBaziCompatibility } from '@/lib/bazi-love/engine';
import type { BaziLovePersonInput } from '@/lib/bazi-love/types';
import { generateTextResponse, type UserProviderConfig } from '@/lib/ai/response-generator';
import { resolveTargetIndicators, formatIndicatorsForPrompt } from '@/lib/numerology/indicator-resolver';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';
import { getChatResponseBudget, normalizeChatReply, normalizeChatReplyWithDiagnostics } from '@/lib/spiritual-agent/response-length';
import { buildChatReplyRepairInstruction, validateChatReplyQuality } from '@/lib/spiritual-agent/response-quality';
import { findVietMapPlaces, formatPlaceReply, type VietMapSearchContext } from '@/lib/places/vietmap-deepseek';
import { getKnowledgeByIndicator } from '@/lib/supabaseClient';
import { getChatIndicatorConciseRecord } from '@/lib/spiritual-agent/chat-numerology-context';
import { getTarotSpread } from '@/lib/tarot/spreads';
import { buildAgentSystemPrompt, buildAgentUserPrompt } from '@/lib/spiritual-agent/agent-prompts';
import {
  buildCompactLoveRetrySystemPrompt,
  buildCompactLoveRetryUserPrompt,
  buildDirectionalLoveFallback,
} from '@/lib/prompts/love-match';
import { filterPersonalityIndicatorKeys } from '@/lib/spiritual-agent/personality-indicators';
import { createCurrentTimeContext } from '@/lib/spiritual-agent/time-context';
import { selectRequestedIndicators } from '@/lib/resonance';
import { getRequestAuth } from '@/lib/supabase/request-auth';
import { commitRequestAccess, getRequestAccess, releaseRequestAccess, type RequestAccess } from '@/lib/billing/access';
import { apiCorsHeaders } from '@/lib/security/cors';
import { recordActualAiUsage } from '@/lib/usage/quota-service';
import { calculateAiCostUsd } from '@/lib/usage/ai-cost';

export const runtime = 'nodejs';

type PlaceRecommendations = {
  areaLabel: string;
  attribution: 'VietMap';
  searchQuery: string;
  summary: string;
  nextStep: string;
  places: Array<{
    placeId: string;
    name: string;
    address: string;
    distanceKm: number | null;
    categories: string[];
    whySelected: string;
  }>;
};

type PersistedInitialReading = {
  sessionId: string;
  userMessageId: string;
  assistantMessageId: string;
};

function buildInitialReadingContext(body: any, replyText: string) {
  const primary = Array.isArray(body.profiles) ? body.profiles[0] : undefined;
  const partner = Array.isArray(body.profiles) ? body.profiles[1] : undefined;
  const cards = Array.isArray(body.tarotCards) ? body.tarotCards : [];
  const suppliedIndicators = Array.isArray(body.indicators?.profile1) ? body.indicators.profile1 : [];
  return {
    intent: typeof body.decision?.intent === 'string' ? body.decision.intent : 'general',
    profileName: typeof primary?.fullName === 'string' ? primary.fullName : '',
    birthDate: typeof primary?.birthDate === 'string' ? primary.birthDate : '',
    gender: typeof primary?.gender === 'string' ? primary.gender : undefined,
    isCouple: Boolean(partner),
    partnerProfile: partner ? {
      fullName: typeof partner.fullName === 'string' ? partner.fullName : '',
      birthDate: typeof partner.birthDate === 'string' ? partner.birthDate : '',
      gender: typeof partner.gender === 'string' ? partner.gender : undefined,
    } : undefined,
    drawnCards: cards.slice(0, 10).map((item: any) => ({
      nameVi: typeof item?.card?.nameVi === 'string' ? item.card.nameVi : '',
      positionTitle: typeof item?.position?.nameVi === 'string' ? item.position.nameVi : undefined,
      isReversed: Boolean(item?.isReversed),
    })),
    selectedIndicators: suppliedIndicators.slice(0, 12).map((item: any) => ({
      name: typeof item?.nameVi === 'string' ? item.nameVi : (typeof item?.name === 'string' ? item.name : item?.key),
      value: typeof item?.value === 'number' || typeof item?.value === 'string' ? item.value : '',
    })),
    initialQuestion: typeof body.message === 'string' ? body.message.slice(0, 2_000) : '',
    initialReadingSummary: replyText.slice(0, 8_000),
  };
}

const TRANSIENT_NETWORK_ERROR = /fetch failed|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|socket hang up|UND_ERR|network/i;

function isTransientNetworkError(error: unknown): boolean {
  if (!error) return false;
  const record = error as { message?: unknown; details?: unknown; cause?: unknown };
  const text = [record.message, record.details, (record.cause as { code?: unknown } | undefined)?.code]
    .filter((part) => typeof part === 'string')
    .join(' ');
  return TRANSIENT_NETWORK_ERROR.test(text || String(error));
}

/**
 * Runs an idempotent Supabase insert, retrying when the TLS socket is reset.
 * A unique-violation (23505) on a retry means the earlier attempt was stored
 * before the connection dropped, so it counts as success.
 */
async function insertWithRetry(
  run: () => PromiseLike<{ error: { code?: string; message?: string } | null }>,
  attempts = 3,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const { error } = await run();
      if (!error) return;
      if (attempt > 0 && error.code === '23505') return;
      lastError = error;
      if (!isTransientNetworkError(error)) break;
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error)) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
  }
  throw lastError;
}

async function persistInitialReading(
  request: NextRequest,
  body: any,
  replyText: string,
  cardPayload: unknown
): Promise<PersistedInitialReading | null> {
  try {
    const { supabase, user } = await getRequestAuth(request);
    if (!user) return null;

    const sessionId = randomUUID();
    const userMessageId = randomUUID();
    const assistantMessageId = randomUUID();
    const now = new Date().toISOString();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const contextData = buildInitialReadingContext(body, replyText);
    await insertWithRetry(() => supabase.from('chat_sessions').insert({
      id: sessionId,
      user_id: user.id,
      title: message.slice(0, 80) || 'Phiên chiêm nghiệm',
      intent: typeof body.decision?.intent === 'string' ? body.decision.intent : 'general',
      mode: body.decision?.mode === 'compatibility' ? 'compatibility' : 'single',
      context_data: contextData,
      question_count: 0,
      max_questions: 10,
      status: 'active',
      created_at: now,
      updated_at: now,
    }));

    const assistantCreatedAt = new Date(Date.now() + 1).toISOString();
    try {
      await insertWithRetry(() => supabase.from('chat_messages').insert([
      {
        id: userMessageId,
        session_id: sessionId,
        turn_index: 0,
        sender: 'user',
        text: message,
        card_payload: null,
        created_at: now,
      },
      {
        id: assistantMessageId,
        session_id: sessionId,
        turn_index: 0,
        sender: 'mascot',
        text: replyText,
        card_payload: cardPayload,
        created_at: assistantCreatedAt,
      },
      ]));
    } catch (messagesError) {
      await supabase.from('chat_sessions').delete().eq('id', sessionId).eq('user_id', user.id);
      throw messagesError;
    }
    return { sessionId, userMessageId, assistantMessageId };
  } catch (error) {
    console.warn('[Chat Agent Route] Could not persist continuation session:', error);
    return null;
  }
}

async function agentSuccessResponse(
  request: NextRequest,
  body: any,
  replyText: string,
  cardPayload: unknown
) {
  const persisted = await persistInitialReading(request, body, replyText, cardPayload);
  return NextResponse.json({
    ok: true,
    data: {
      sessionId: persisted?.sessionId ?? null,
      questionCount: 0,
      maxQuestions: 10,
      canContinue: Boolean(persisted),
      replyText,
      cardPayload,
    },
  }, { headers: apiCorsHeaders(request) });
}

async function saveChatPromptSnapshot(
  systemPrompt: string,
  userPrompt: string,
  generationOptions: { maxTokens: number; temperature: number },
  indicatorSelection: {
    requestedKeys: string[];
    suppliedKeys: string[];
    selectedKeys: string[];
    knowledgeMatchedKeys: string[];
  }
): Promise<void> {
  const disabled = ['0', 'false', 'off'].includes(
    (process.env.CHAT_AGENT_PROMPT_SNAPSHOT || '').trim().toLowerCase()
  );
  if (process.env.NODE_ENV === 'production' || disabled) return;

  const snapshotPath = join(process.cwd(), 'scratch', 'chat-agent-prompt.json');
  const temporaryPath = `${snapshotPath}.${randomUUID()}.tmp`;
  const snapshot = {
    capturedAt: new Date().toISOString(),
    endpoint: '/api/chat/agent',
    indicatorSelection,
    llmRequest: {
      systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      generationOptions,
    },
  };

  await mkdir(dirname(snapshotPath), { recursive: true });
  try {
    await writeFile(temporaryPath, JSON.stringify(snapshot, null, 2), {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporaryPath, snapshotPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

const supportedIndicatorKeys = new Set([
  'walksOfLife', 'mission', 'soul', 'personality', 'dateOfBirth', 'mature', 'balance',
  'rationalThinking', 'subconsciousPower', 'passion', 'attitude', 'karmicDebts', 'missingNumbers',
  'bridgeLifeMission', 'bridgeSoulPersonality', 'bridgeMaturityPassion', 'yearIndividual',
  'monthIndividual', 'dayIndividual', 'way', 'challenges', 'arrows', 'nameChart', 'birthChart'
]);

type SuppliedIndicator = { key: string; name: string; value: string | number };

function normalizeSuppliedIndicators(value: unknown): SuppliedIndicator[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SuppliedIndicator => Boolean(
    item && typeof item === 'object' &&
    typeof item.key === 'string' && supportedIndicatorKeys.has(item.key) &&
    typeof item.name === 'string' && (typeof item.value === 'string' || typeof item.value === 'number')
  ));
}

/**
 * Lets us diagnose whether the client sent a usable location without writing
 * precise coordinates to server logs.
 */
function summarizePlaceContext(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { placeContextProvided: false };
  }

  const context = value as Record<string, unknown>;
  const latitude = context.latitude;
  const longitude = context.longitude;
  const latitudeValid = typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
  const longitudeValid = typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;

  return {
    placeContextProvided: true,
    latitudeProvided: latitude !== undefined && latitude !== null,
    longitudeProvided: longitude !== undefined && longitude !== null,
    latitudeType: typeof latitude,
    longitudeType: typeof longitude,
    validCoordinates: latitudeValid && longitudeValid,
  };
}

function getDeepSeekAgentProviderConfig(): UserProviderConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured for Chat Agent.');
  }
  const baseUrl = (process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = process.env.DEEPSEEK_MODEL?.trim() || process.env.DEEPSEEK_CHAT_AGENT_MODEL?.trim() || 'deepseek-flash';

  return {
    type: 'DeepSeek',
    baseUrl,
    model,
    apiKeys: [apiKey],
  };
}

type IndicatorSelection = {
  requestedKeys: string[];
  suppliedKeys: string[];
  selectedKeys: string[];
  knowledgeMatchedKeys: string[];
};

function isLengthError(value: string | undefined): boolean {
  return Boolean(value && /finish_reason\s*=\s*length|maximum context|max(?:imum)? tokens?/i.test(value));
}

async function generateLlmText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  indicatorSelection: IndicatorSelection,
) {
  const generationOptions = {
    maxTokens,
    temperature: 0.3,
    reasoningEffort: 'low' as const,
    includeReasoning: false,
  };
  await saveChatPromptSnapshot(systemPrompt, userPrompt, generationOptions, indicatorSelection);
  const result = await generateTextResponse(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    getDeepSeekAgentProviderConfig(),
    generationOptions,
  );
  if (result.finishReason && result.finishReason !== 'stop') {
    throw new Error(`LLM completion ended with finish_reason=${result.finishReason}`);
  }
  return { ...result, text: result.text.trim() };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: apiCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  let usageAccess: RequestAccess | null = null;
  try {
    const body = await request.json();
    const { message, decision, profiles, indicators, tarotCards, placeContext, colorGuidance } = body;
    const timeContext = createCurrentTimeContext(body.timeZone);

    // 0. BỘ LỌC TỐC HÀNH: Phát hiện câu hỏi rác / vô nghĩa / gõ phím ngẫu nhiên (0 token LLM, phản hồi < 0.1ms)
    const trashCheck = isTrashOrMeaninglessPrompt(message);
    if (decision?.intent === 'trash' || trashCheck.isTrash) {
      return NextResponse.json({
        ok: true,
        data: {
          sessionId: null,
          questionCount: 0,
          maxQuestions: 10,
          canContinue: false,
          replyText: TRASH_PROMPT_GUIDANCE,
          cardPayload: {
            type: 'agent_synthesis',
            decision: {
              mode: 'single',
              intent: 'trash',
              needsTarot: false,
              spreadId: null,
              cardCount: 0,
              targetIndicators: [],
              thoughtProcess: `Phát hiện câu hỏi không có chủ đề hoặc mục đích rõ ràng (${trashCheck.reason || 'Ký tự vô nghĩa'}). Gửi phản hồi định hướng để người dùng đặt câu hỏi có ý nghĩa.`
            },
            profiles,
            indicators1: [],
            indicators2: [],
            drawnCards: [],
            isTrashPrompt: true
          }
        }
      }, { headers: apiCorsHeaders(request) });
    }

    const access = await getRequestAccess(request, 'ai_response', body.requestId);
    if (access instanceof Response) {
      for (const [key, value] of Object.entries(apiCorsHeaders(request))) access.headers.set(key, value);
      return access;
    }
    usageAccess = access;

    const p1 = profiles?.[0] || { fullName: 'Người A', birthDate: '2000-01-01', gender: 'female' };
    const p2 = profiles?.[1];
    const isCouple = profiles?.length >= 2;

    const p1Indicators = indicators?.profile1 || [];
    const p2Indicators = indicators?.profile2 || [];
    const cards = tarotCards || [];

    // Giải mã chuyên sâu tối đa 5 chỉ số Thần số học theo quyết định của AI
    const requestedKeys: string[] = Array.isArray(decision?.targetIndicators) && decision.targetIndicators.length > 0
      ? decision.targetIndicators.filter((key: unknown): key is string => typeof key === 'string')
      : p1Indicators.map((i: any) => i.key).filter((key: unknown): key is string => typeof key === 'string');

    const resolvedP1 = resolveTargetIndicators(p1.fullName, p1.birthDate, requestedKeys);
    const resolvedP2 = (isCouple && p2) ? resolveTargetIndicators(p2.fullName, p2.birthDate, requestedKeys) : [];
    const suppliedP1Indicators = normalizeSuppliedIndicators(p1Indicators);
    const suppliedP2Indicators = normalizeSuppliedIndicators(p2Indicators);
    const selectedKeys = filterPersonalityIndicatorKeys(decision?.targetIndicators);
    const selectedIndicators = isCouple
      ? []
      : selectRequestedIndicators(suppliedP1Indicators, selectedKeys);
    if (!isCouple && selectedKeys.some((key) => !selectedIndicators.some((indicator) => indicator.key === key))) {
      console.warn('[Chat Agent Route] Mobile indicator selection mismatch:', {
        requestedKeys,
        suppliedKeys: suppliedP1Indicators.map((indicator) => indicator.key),
        missingKeys: selectedKeys.filter((key) => !selectedIndicators.some((indicator) => indicator.key === key))
      });
    }
    const knowledgeDocs = await Promise.all(selectedIndicators.map(async (indicator) => {
      const conciseRecord = getChatIndicatorConciseRecord(indicator.key, indicator.value, indicator.name);
      if (conciseRecord) {
        return {
          indicator,
          record: conciseRecord
        };
      }
      return {
        indicator,
        record: await getKnowledgeByIndicator(indicator.key, indicator.value)
      };
    }));
    const retrievedKnowledge = knowledgeDocs.filter(({ record }) => Boolean(record?.content?.trim()));
    const numerologyKnowledgeContext = isCouple
      ? ''
      : retrievedKnowledge.length
      ? retrievedKnowledge.map(({ indicator, record }) =>
        `[TƯ LIỆU THẦN SỐ HỌC: ${indicator.name} (${indicator.key} = ${indicator.value}) | ${record!.title}]\n${record!.content}`
      ).join('\n\n')
      : 'Không tìm thấy tài liệu gốc khớp với các chỉ số đã chọn. Không tự diễn giải Thần số học chỉ từ tên hoặc giá trị số; hãy tập trung vào Tarot và các dữ liệu khác được cung cấp.';

    let replyText = '';
    let baziScore = 85;
    let baziSummary = '';
    let placeRecommendations: PlaceRecommendations | null = null;
    let placeAiUsage: { provider: string; model: string; inputTokens: number; outputTokens: number; retryCount: number } | null = null;
    let placeSearchUnavailable = false;
    let cardPayload: any = {
      type: 'agent_synthesis',
      decision: decision || {
        mode: isCouple ? 'compatibility' : 'single',
        intent: isCouple ? 'love_match' : 'general',
        needsTarot: cards.length > 0,
        spreadId: isCouple ? 'relationship' : 'single',
        cardCount: cards.length,
        targetIndicators: requestedKeys,
        thoughtProcess: 'Tiểu Linh Miêu kết hợp Tử Vi Đẩu Số (Bát Tự) và 5 Lá Tarot Mối Quan Hệ.'
      },
      profiles,
      indicators1: suppliedP1Indicators,
      indicators2: suppliedP2Indicators,
      drawnCards: cards,
      ...(decision?.intent === 'color_guidance' && colorGuidance ? { colorGuidance } : {})
    };
    let chargeableAiResponse = false;
    let generationUsage: { provider?: string; model?: string; inputTokens?: number; outputTokens?: number } = {};
    let retryCount = 0;

    // DeepSeek builds the query and ranks results; VietMap remains the sole
    // factual source for place names and addresses.
    if (decision?.intent === 'where_to_go') {
      console.info('[Chat Agent Route] VietMap location context:', summarizePlaceContext(placeContext));
      if (!placeContext || typeof placeContext !== 'object') {
        placeSearchUnavailable = true;
      } else {
        try {
          const vietMapResult = await findVietMapPlaces({
            timeContext,
            message: typeof message === 'string' ? message : '',
            context: placeContext as VietMapSearchContext,
            spiritualContext: {
              tarotCards: cards.slice(0, 5).map((card: any) => ({
                name: typeof card?.card?.nameVi === 'string' ? card.card.nameVi : '',
                orientation: card?.isReversed ? 'reversed' as const : 'upright' as const,
                position: typeof card?.position?.nameVi === 'string' ? card.position.nameVi : '',
                meaning: typeof (card?.isReversed ? card?.card?.meaningReversed : card?.card?.meaningUpright) === 'string'
                  ? (card.isReversed ? card.card.meaningReversed : card.card.meaningUpright)
                  : '',
              })),
              indicators: resolvedP1.slice(0, 5).map((indicator) => ({
                key: indicator.key,
                name: indicator.nameVi,
                value: indicator.value,
                summary: indicator.summaryLine,
              })),
            },
          });
          placeAiUsage = vietMapResult.aiUsage;
          if (vietMapResult.places.length === 0) throw new Error('VietMap returned no matching places.');
          placeRecommendations = {
            areaLabel: 'Vị trí hiện tại',
            attribution: 'VietMap',
            searchQuery: vietMapResult.searchQuery,
            summary: vietMapResult.summary,
            nextStep: vietMapResult.nextStep,
            places: vietMapResult.places.map(({ placeId, name, address, distanceKm, categories }) => ({
              placeId,
              name,
              address,
              distanceKm,
              categories,
              whySelected: vietMapResult.placeReasons.find((reason) => reason.placeId === placeId)?.reason
                || 'Được DeepSeek xếp hạng từ các kết quả đã xác thực của VietMap.',
            })),
          };
          cardPayload.placeSuggestions = placeRecommendations;
        } catch (placeError) {
          // Do not log the request context because it contains precise coordinates.
          console.warn('[Chat Agent Route] VietMap / DeepSeek place search unavailable:', placeError instanceof Error ? placeError.message : 'unknown error');
          placeSearchUnavailable = true;
        }
      }
    }

    // 1. Tương hợp 2 người (THUẦN TỬ VI ĐẨU SỐ & BÁT TỰ TỨ TRỤ - KHÔNG CẦN TAROT)
    if (isCouple && p2) {
      const personAInput: BaziLovePersonInput = {
        name: p1.fullName,
        birthDate: p1.birthDate,
        timezone: 'Asia/Ho_Chi_Minh',
        calculationSex: p1.gender === 'male' ? 'male' : 'female'
      };
      const personBInput: BaziLovePersonInput = {
        name: p2.fullName,
        birthDate: p2.birthDate,
        timezone: 'Asia/Ho_Chi_Minh',
        calculationSex: p2.gender === 'male' ? 'male' : 'female'
      };

      try {
        const baziResult = evaluateBaziCompatibility(personAInput, personBInput);
        cardPayload.baziResult = baziResult;
        const rawDelta = baziResult.layers.reduce((acc, l) => acc + l.score, 0);
        baziScore = Math.max(50, Math.min(96, Math.round(65 + rawDelta * 1.5)));
        baziSummary = baziResult.layers.map(l => `• ${l.label.vi}: ${l.notes.slice(0, 3).map(n => n.text.vi).join('; ')}`).join('\n');
      } catch (err) {
        console.warn('Bazi calculation fallback:', err);
      }

      cardPayload.compatibilityScore = baziScore;
      cardPayload.drawnCards = []; // KHÔNG DÙNG BÀI TAROT

      replyText = buildDirectionalLoveFallback(message || '', p1, p2, baziScore);
    }
    // 2. Hai lựa chọn (A vs B)
    else if (decision?.intent === 'two_choices') {
      replyText = [
        `✦ KẾT LUẬN NHANH:\nMình chưa thể hoàn tất lượt đọc này đủ rõ để chọn thay bạn một hướng đáng tin.`,
        `\n✦ VÌ SAO:\n• Phản hồi vừa nhận chưa so sánh đủ tiến trình và kết quả của cả hai phương án.\n• Mình sẽ không lấp chỗ trống bằng một kết luận chung chung hoặc nước đôi.`,
        `\n✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:\n• Bạn có thể gửi lại câu hỏi khi muốn bắt đầu một lượt đọc mới; sự rõ ràng đáng tin luôn quan trọng hơn một câu trả lời được ghép vội.`
      ].join('\n');
    }
    // 3. Địa điểm thực tế: VietMap is the factual source; DeepSeek only plans and ranks.
    else if (decision?.intent === 'where_to_go') {
      if (placeRecommendations) {
        replyText = formatPlaceReply({
          searchQuery: placeRecommendations.searchQuery,
          summary: placeRecommendations.summary,
          nextStep: placeRecommendations.nextStep,
          places: placeRecommendations.places,
          placeReasons: placeRecommendations.places.map((place) => ({
            placeId: place.placeId,
            reason: place.whySelected,
          })),
        });
      } else {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nTiểu Linh Miêu chưa có đủ kết quả VietMap đáng tin cậy để gợi ý một địa điểm cụ thể.`,
          `\n✦ VÌ SAO:\n• ${placeSearchUnavailable ? 'VietMap hoặc DeepSeek chưa trả về đủ dữ liệu địa điểm.' : 'Bạn cần cấp vị trí hiện tại trước khi tìm.'}\n• Vì không có nguồn xác thực, Tiểu Linh Miêu sẽ không đoán tên quán, giờ mở cửa hay đánh giá.`,
          `\n✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:\n• Nếu vẫn muốn tìm một nơi phù hợp, bạn có thể cho phép truy cập vị trí rồi mở rộng phạm vi tìm kiếm; đôi khi lựa chọn hợp lòng nằm xa hơn một vòng tròn quen thuộc.`
        ].join('\n');
      }
    }
    // 4. Thuần 24 chỉ số Thần số học (0 lá Tarot)
    else if (!decision?.needsTarot || decision?.intent === 'core_personality') {
      const documentedIndicators = selectedIndicators.filter((indicator) =>
        retrievedKnowledge.some(({ indicator: found }) => found.key === indicator.key)
      );
      const indicatorSummary = documentedIndicators.length
        ? documentedIndicators.slice(0, 3).map((indicator) => `• ${indicator.name} = ${indicator.value}; đã đối chiếu với tư liệu gốc tương ứng.`).join('\n')
        : '• Chưa tìm thấy tư liệu gốc khớp với chỉ số đã chọn nên chưa thể đưa ra luận giải Thần số học đáng tin cậy.\n• Hãy thử lại sau khi hồ sơ và kho kiến thức được đồng bộ.';
      replyText = [
        `✦ KẾT LUẬN NHANH:\n${documentedIndicators.length ? `Các tư liệu Thần số học đã tra cứu cho ${p1.fullName} có thể giúp bạn soi chiếu câu hỏi.` : 'Hiện chưa có đủ tư liệu Thần số học để luận giải câu hỏi này.'}`,
        `\n✦ VÌ SAO:\n${indicatorSummary}`,
        `\n✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:\n• Bạn có thể nhìn lại tên và giá trị các chỉ số trong hồ sơ trước khi hỏi lại; một nền dữ liệu sáng rõ sẽ giúp lời luận không phải lấp đầy khoảng trống bằng suy đoán.`
      ].join('\n');
    }
    // 5. Mặc định / 1 lá / 3 lá
    else {
      const c1 = cards[0];
      const cardsForFallback = cards.slice(0, 10);
      const groupSize = Math.max(1, Math.ceil(cardsForFallback.length / 3));
      const cardGroups = Array.from({ length: Math.ceil(cardsForFallback.length / groupSize) }, (_, groupIndex) =>
        cardsForFallback.slice(groupIndex * groupSize, (groupIndex + 1) * groupSize)
      );
      const cardSignals = cardGroups.map((group, groupIndex) => `• ${group.map((card: any, index: number) =>
        `${card.position?.nameVi || `Vị trí ${groupIndex * groupSize + index + 1}`} — ${card.card?.nameVi || 'Tarot'} (${card.isReversed ? 'ngược' : 'xuôi'})`
      ).join('; ')}.`).join('\n');
      const lowerQ = (message || '').toLowerCase();
      const isFood = /ăn|món|thực đơn|uống|nấu|bữa|sáng|trưa|tối|đói/i.test(lowerQ);

      if (isFood) {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nMình chưa thể hoàn tất lượt đọc này đủ rõ để gợi ý một món phù hợp với bạn.`,
          `\n✦ VÌ SAO:\n${cardSignals || `• Lượt đọc có lá ${c1?.card?.nameVi || 'Tarot'} nhưng chưa tạo được câu trả lời hoàn chỉnh.`}\n• Mình sẽ không tự đoán khẩu vị, sức khỏe hoặc hoàn cảnh ăn uống của bạn.`,
          `\n✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:\n• Bạn có thể hỏi lại cùng món đang cân nhắc hoặc điều kiện ăn uống quan trọng; càng gọi đúng điều mình cần, lựa chọn càng bớt mơ hồ.`
        ].join('\n');
      } else {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nMình chưa thể hoàn tất lượt đọc này đủ rõ để đưa ra lời khuyên đáng tin.`,
          `\n✦ VÌ SAO:\n${cardSignals || `• Lượt đọc có lá ${c1?.card?.nameVi || 'Tarot'} nhưng chưa tạo được câu trả lời hoàn chỉnh.`}\n• Mình sẽ không biến dữ liệu còn thiếu thành một lời khuyên chung chung.`,
          `\n✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:\n• Bạn có thể gửi lại câu hỏi khi muốn bắt đầu một lượt đọc mới; không cần giữ lấy một câu trả lời khi nó chưa đủ sáng rõ để đồng hành cùng mình.`
        ].join('\n');
      }
    }

    const responseBudget = getChatResponseBudget({
      intent: decision?.intent,
      cardCount: Math.max(cards.length, Number(decision?.cardCount) || 0),
      isCouple,
    });
    const fallbackReply = normalizeChatReply('', replyText, responseBudget.complexity);

    // Place replies always stay deterministic. Names and addresses come only
    // from VietMap, never from the normal chat model output.
    if (decision?.intent === 'where_to_go') {
      chargeableAiResponse = Boolean(placeRecommendations);
      if (chargeableAiResponse) {
        await commitRequestAccess(usageAccess, { route: '/api/chat/agent', intent: decision?.intent });
        if (placeAiUsage) {
          await recordActualAiUsage({
            reservation: usageAccess,
            route: '/api/chat/agent/place',
            ...placeAiUsage,
            costUsd: calculateAiCostUsd(placeAiUsage),
          });
        }
      } else {
        await releaseRequestAccess(usageAccess, 'incomplete_place_response');
      }
      usageAccess = null;
      return agentSuccessResponse(request, body, replyText, cardPayload);
    }

    // 5. Generate the complete answer before returning JSON so the mobile love
    // loading sequence can finish. A length/quality failure retries once.
    const spread = getTarotSpread(decision?.spreadId);
    const spreadContext = spread
      ? `Trải bài được chọn: ${spread.name.vi} (${spread.id}), ${spread.positions.length} lá.\n${spread.positions.map((position, index) => `${index + 1}. ${position.name.vi}: ${position.description.vi}`).join('\n')}`
      : 'Không có trải bài Tarot trong chế độ này.';
    const retrievedKnowledgeKeys = new Set(retrievedKnowledge.map(({ indicator: found }) => found.key));
    const systemPrompt = buildAgentSystemPrompt({
      intent: decision?.intent,
      isCouple,
      complexity: responseBudget.complexity,
      needsTarot: decision?.needsTarot,
    });
    const userPrompt = buildAgentUserPrompt({
      timeContext,
      message,
      p1,
      p2,
      isCouple,
      spreadContext,
      cards,
      numerologyKnowledgeContext,
      selectedIndicators,
      retrievedKnowledgeKeys,
      resolvedP2,
      baziSummary,
      baziScore,
      placeRecommendations,
      colorGuidance: decision?.intent === 'color_guidance' && colorGuidance ? colorGuidance : undefined,
    });
    const indicatorSelection = {
      requestedKeys,
      suppliedKeys: suppliedP1Indicators.map((indicator) => indicator.key),
      selectedKeys: selectedIndicators.map((indicator) => indicator.key),
      knowledgeMatchedKeys: retrievedKnowledge.map(({ indicator }) => indicator.key),
    };
    const isLoveMatch = decision?.intent === 'love_match' || isCouple;
    // DeepSeek Flash may spend part of the completion budget before emitting
    // the final answer. Keep the visible reply limits in response-length.ts,
    // but give generation enough headroom to finish instead of stopping at
    // finish_reason=length.
    const maxTokens = isLoveMatch
      ? 4_096
      : Math.max(2_400, responseBudget.maxTokens * 2);
    const retryMaxTokens = isLoveMatch
      ? 4_096
      : Math.max(3_200, responseBudget.maxTokens * 2);

    try {
      let aiText = '';
      let firstError: string | undefined;
      try {
        const generated = await generateLlmText(systemPrompt, userPrompt, maxTokens, indicatorSelection);
        aiText = generated.text;
        generationUsage = {
          provider: generated.provider,
          model: generated.actualModel || generated.model,
          inputTokens: generated.usage?.inputTokens,
          outputTokens: generated.usage?.outputTokens,
        };
      } catch (error) {
        firstError = error instanceof Error ? error.message : String(error);
      }

      let normalized = normalizeChatReplyWithDiagnostics(
        firstError ? '' : aiText,
        fallbackReply,
        responseBudget.complexity,
      );
      let quality = normalized.usedAI
        ? validateChatReplyQuality(normalized.replyText, {
            intent: decision?.intent,
            userMessage: message,
            coupleProfileNames: isCouple && p2 ? [p1.fullName, p2.fullName] : undefined,
          })
        : { valid: false, reason: firstError || normalized.rejectionReason };

      // Retry at most once. A length stop gets the compact love prompt; other
      // quality failures get a targeted repair instruction.
      if (firstError || !normalized.usedAI || !quality.valid) {
        retryCount = 1;
        const retryForLength = isLengthError(firstError);
        const repairInstruction = retryForLength
          ? 'Lượt trước bị cắt vì quá dài. Viết ngắn hơn, hoàn tất đủ ba phần trong giới hạn.'
          : buildChatReplyRepairInstruction(quality.reason);
        const retrySystemPrompt = retryForLength && isLoveMatch && p2
          ? `${buildCompactLoveRetrySystemPrompt(p1.fullName, p2.fullName)}\n${repairInstruction}`
          : `${systemPrompt}\n\n${repairInstruction}`;
        const retryUserPrompt = retryForLength && isLoveMatch && p2
          ? buildCompactLoveRetryUserPrompt({
              message,
              first: p1,
              second: p2,
              baziScore,
              baziSummary,
            })
          : userPrompt;

        console.warn('[Chat Agent Route] Retrying non-stream answer:', {
          reason: firstError || quality.reason,
          compactPrompt: retryForLength && isLoveMatch,
        });
        const generated = await generateLlmText(
          retrySystemPrompt,
          retryUserPrompt,
          retryMaxTokens,
          indicatorSelection,
        );
        aiText = generated.text;
        generationUsage = {
          provider: generated.provider,
          model: generated.actualModel || generated.model,
          inputTokens: generated.usage?.inputTokens,
          outputTokens: generated.usage?.outputTokens,
        };
        normalized = normalizeChatReplyWithDiagnostics(aiText, fallbackReply, responseBudget.complexity);
        quality = normalized.usedAI
          ? validateChatReplyQuality(normalized.replyText, {
              intent: decision?.intent,
              userMessage: message,
              coupleProfileNames: isCouple && p2 ? [p1.fullName, p2.fullName] : undefined,
            })
          : { valid: false, reason: normalized.rejectionReason };
      }

      replyText = normalized.usedAI && quality.valid ? normalized.replyText : fallbackReply;
      chargeableAiResponse = normalized.usedAI && quality.valid;
      console.log('[Chat Agent Route] Generated non-stream reply quality:', {
        usedAI: normalized.usedAI && quality.valid,
        rejectionReason: quality.valid ? undefined : quality.reason,
      });
    } catch (llmError) {
      console.warn('[Chat Agent Route] LLM fallback to directional template:', llmError);
      replyText = fallbackReply;
    }

    if (chargeableAiResponse) {
      await commitRequestAccess(usageAccess, { route: '/api/chat/agent', intent: decision?.intent, retryCount });
      await recordActualAiUsage({
        reservation: usageAccess,
        route: '/api/chat/agent',
        provider: generationUsage.provider,
        model: generationUsage.model,
        inputTokens: generationUsage.inputTokens,
        outputTokens: generationUsage.outputTokens,
        costUsd: calculateAiCostUsd(generationUsage),
        retryCount,
      });
    } else {
      await releaseRequestAccess(usageAccess, 'provider_or_quality_failure');
    }
    usageAccess = null;
    return agentSuccessResponse(request, body, replyText, cardPayload);
  } catch (error: any) {
    if (usageAccess) await releaseRequestAccess(usageAccess, 'route_error');
    console.error('[API /api/chat/agent] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: apiCorsHeaders(request) });
  }
}
