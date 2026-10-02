import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { evaluateBaziCompatibility } from '@/lib/bazi-love/engine';
import type { BaziLovePersonInput } from '@/lib/bazi-love/types';
import { createStreamingResponse } from '@/lib/ai/response-generator';
import { resolveTargetIndicators, formatIndicatorsForPrompt } from '@/lib/numerology/indicator-resolver';
import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '@/lib/spiritual-agent/prompt-validator';
import { getChatResponseBudget, normalizeChatReply } from '@/lib/spiritual-agent/response-length';
import { findVietMapPlaces, formatPlaceReply, type VietMapSearchContext } from '@/lib/places/vietmap-deepseek';
import { getKnowledgeByIndicator } from '@/lib/supabaseClient';
import { getTarotSpread } from '@/lib/tarot/spreads';
import { buildAgentSystemPrompt, buildAgentUserPrompt } from '@/lib/spiritual-agent/agent-prompts';
import { filterPersonalityIndicatorKeys } from '@/lib/spiritual-agent/personality-indicators';
import { createCurrentTimeContext } from '@/lib/spiritual-agent/time-context';
import { generateResonanceContext, selectRequestedIndicators } from '@/lib/resonance';
import type { TarotSelection } from '@/lib/resonance/types';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

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

async function generateLlmText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  indicatorSelection: {
    requestedKeys: string[];
    suppliedKeys: string[];
    selectedKeys: string[];
    knowledgeMatchedKeys: string[];
  }
): Promise<string> {
  const generationOptions = {
    // Leave room for a complete, longer structured reply.  Keeping provider
    // reasoning off prevents it from consuming the completion budget.
    maxTokens: Math.max(2400, maxTokens * 2),
    temperature: 0.7,
    reasoningEffort: 'low' as const,
    includeReasoning: false,
  };
  await saveChatPromptSnapshot(systemPrompt, userPrompt, generationOptions, indicatorSelection);

  const stream = createStreamingResponse(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    undefined,
    generationOptions
  );
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';
  let completed = false;
  let streamError: string | undefined;

  const consumeLine = (line: string) => {
    if (!line.startsWith('data: ')) return;
    const data = line.slice(6).trim();
    if (!data || data === '[DONE]') return;
    const event = JSON.parse(data) as { content?: unknown; done?: unknown; error?: unknown };
    if (typeof event.error === 'string') streamError = event.error;
    if (event.done === true) completed = true;
    if (typeof event.content === 'string' && !streamError) fullText += event.content;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        consumeLine(line);
      }
    }
    buffer += decoder.decode();
    if (buffer.trim()) consumeLine(buffer);
  } finally {
    reader.releaseLock();
  }
  if (streamError) throw new Error(streamError);
  if (!completed) throw new Error('LLM stream ended without completion event');
  return fullText.trim();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
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
      }, { headers: corsHeaders });
    }

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
    const knowledgeDocs = await Promise.all(selectedIndicators.map(async (indicator) => ({
      indicator,
      record: await getKnowledgeByIndicator(indicator.key, indicator.value)
    })));
    const retrievedKnowledge = knowledgeDocs.filter(({ record }) => Boolean(record?.content?.trim()));
    const numerologyKnowledgeContext = isCouple
      ? ''
      : retrievedKnowledge.length
      ? retrievedKnowledge.map(({ indicator, record }) =>
        `[TƯ LIỆU THẦN SỐ HỌC: ${indicator.name} (${indicator.key} = ${indicator.value}) | ${record!.title}]\n${record!.content}`
      ).join('\n\n')
      : 'Không tìm thấy tài liệu gốc khớp với các chỉ số đã chọn. Không tự diễn giải Thần số học chỉ từ tên hoặc giá trị số; hãy tập trung vào Tarot và các dữ liệu khác được cung cấp.';

    const resonance = !isCouple && decision?.needsTarot && cards.length > 0 && selectedIndicators.length > 0
      ? generateResonanceContext(cards as TarotSelection[], selectedIndicators)
      : null;
    const resonanceContext = resonance?.matchedTarotCount && resonance.matchedNumerologyCount
      ? resonance.formattedAiPromptForm
      : '';
    if (resonance?.diagnostics.length) {
      const diagnosticCounts = resonance.diagnostics.reduce<Record<string, number>>((counts, item) => {
        counts[item.reason] = (counts[item.reason] ?? 0) + 1;
        return counts;
      }, {});
      console.warn('[Chat Agent Route] Resonance label lookup diagnostics:', {
        tarotMatches: resonance.matchedTarotCount,
        numerologyMatches: resonance.matchedNumerologyCount,
        diagnosticCounts
      });
    }

    let replyText = '';
    let baziScore = 85;
    let baziSummary = '';
    let placeRecommendations: PlaceRecommendations | null = null;
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

      replyText = [
        `✦ KẾT LUẬN NHANH:\n${p1.fullName} và ${p2.fullName} đạt khoảng ${baziScore}% tương hợp. Điểm quan trọng là giữ giao tiếp rõ ràng khi hai người khác nhịp sống.`,
        `\n✦ VÌ SAO:\n• Cung Phu Thê và ngũ hành cho thấy hai bạn có cả điểm bổ trợ lẫn bài học cân bằng.\n• Kết quả này là gợi ý để hiểu nhau, không thay cho lựa chọn thực tế của hai người.`,
        `\n✦ NÊN LÀM GÌ:\n• Nói rõ mong đợi và ranh giới ngay từ đầu.\n• Chọn một mục tiêu chung nhỏ để cùng thực hiện trong tháng này.`
      ].join('\n');
    }
    // 2. Hai lựa chọn (A vs B)
    else if (decision?.intent === 'two_choices') {
      replyText = [
        `✦ KẾT LUẬN NHANH:\nHãy đối chiếu hai lựa chọn với các lá bài ở từng vị trí và ưu tiên thực tế của bạn trước khi quyết định.`,
        `\n✦ VÌ SAO:\n• Trải bài Hai lựa chọn chỉ ra tiến trình và thách thức riêng của mỗi hướng.\n• Các lá bài gợi xu hướng để cân nhắc, không phải xác suất hay bảo đảm kết quả.`,
        `\n✦ NÊN LÀM GÌ:\n• Ghi lại lợi ích và chi phí thực tế của từng phương án.\n• Chọn một bước thử nhỏ để kiểm chứng hướng phù hợp hơn.`
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
          `\n✦ NÊN LÀM GÌ:\n• Bật quyền vị trí và thử lại.\n• Giữ khoảng cách tìm kiếm rộng hơn nếu khu vực có ít địa điểm.`
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
        `\n✦ NÊN LÀM GÌ:\n• Kiểm tra tên và giá trị các chỉ số trong hồ sơ.\n• Đặt lại câu hỏi sau khi có tư liệu tương ứng.`
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
          `✦ KẾT LUẬN NHANH:\nHôm nay hợp với một bữa nhẹ, tươi và dễ tiêu như phở, bún hoặc salad.`,
          `\n✦ VÌ SAO:\n${cardSignals || `• Lá ${c1?.card?.nameVi || 'Tarot'} là một gợi ý để suy ngẫm.`}\n• Hãy đối chiếu thông điệp với hoàn cảnh thực tế của bạn.`,
          `\n✦ NÊN LÀM GÌ:\n• Chọn món có rau và đạm vừa phải.\n• Ăn chậm, uống đủ nước.`
        ].join('\n');
      } else {
        replyText = [
          `✦ KẾT LUẬN NHANH:\nThông điệp hiện tại là giữ vững hướng đi và đừng vội phản ứng theo cảm xúc.`,
          `\n✦ VÌ SAO:\n${cardSignals || `• Lá ${c1?.card?.nameVi || 'Tarot'} gợi một điểm cần chú ý.`}\n• Cần đọc từng lá theo đúng vai trò vị trí trong trải bài.`,
          `\n✦ NÊN LÀM GÌ:\n• Chọn một việc quan trọng nhất hôm nay.\n• Hoàn thành nó trước khi nhận thêm cam kết.`
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
      return NextResponse.json({
        ok: true,
        data: { replyText, cardPayload }
      }, { headers: corsHeaders });
    }

    // 5. KÍCH HOẠT AI LLM THẬT (Google Gemini / Groq / OpenRouter) ĐỂ SINH LỜI THOẠI CÁ NHÂN HÓA NGẮN GỌN
    try {
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
        resonanceContext,
        selectedIndicators,
        retrievedKnowledgeKeys,
        resolvedP2,
        baziSummary,
        baziScore,
        placeRecommendations,
        colorGuidance: decision?.intent === 'color_guidance' && colorGuidance ? colorGuidance : undefined,
      });

      const aiText = await generateLlmText(systemPrompt, userPrompt, Math.max(800, responseBudget.maxTokens), {
        requestedKeys,
        suppliedKeys: suppliedP1Indicators.map((indicator) => indicator.key),
        selectedKeys: selectedIndicators.map((indicator) => indicator.key),
        knowledgeMatchedKeys: retrievedKnowledge.map(({ indicator }) => indicator.key)
      });
      // Do not gate a useful answer behind a rigid display format. The client
      // may receive any complete text the model produces; fallback stays for
      // empty output and request/provider failures only.
      replyText = aiText.trim() || fallbackReply;
      console.log('[Chat Agent Route] Generated reply successfully, using AI text:', Boolean(aiText.trim()));
    } catch (llmError) {
      console.warn('[Chat Agent Route] LLM fallback to template:', llmError);
      replyText = fallbackReply;
    }

    return NextResponse.json({
      ok: true,
      data: {
        replyText,
        cardPayload
      }
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[API /api/chat/agent] Error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
