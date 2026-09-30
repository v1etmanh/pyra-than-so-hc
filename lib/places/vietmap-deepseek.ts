export type PlaceBudget = 'low' | 'medium' | 'flexible';
export type PlaceCompanion = 'solo' | 'date' | 'friends' | 'family';

export interface VietMapSearchContext {
  latitude: number;
  longitude: number;
  maxDistanceKm: number;
  budget: PlaceBudget;
  companion: PlaceCompanion;
  openNow: boolean;
}

export interface VietMapPlace {
  placeId: string;
  name: string;
  address: string;
  distanceKm: number | null;
  categories: string[];
}

/**
 * Reflection-only context from the current chat turn. Deliberately excludes
 * profile names, birth dates, and the user's coordinates.
 */
export interface SpiritualPlaceContext {
  tarotCards: Array<{
    name: string;
    orientation: 'upright' | 'reversed';
    position: string;
    meaning: string;
  }>;
  indicators: Array<{
    key: string;
    name: string;
    value: number | string;
    summary: string;
  }>;
}

type JsonRecord = Record<string, unknown>;

const VIETMAP_AUTOCOMPLETE_URL = 'https://maps.vietmap.vn/api/autocomplete/v4';

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function validLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function validLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

function normalizeContext(context: VietMapSearchContext): VietMapSearchContext {
  if (!validLatitude(context.latitude) || !validLongitude(context.longitude)) {
    throw new Error('Current location is required for place recommendations.');
  }

  return {
    latitude: context.latitude,
    longitude: context.longitude,
    maxDistanceKm: Math.min(30, Math.max(1, Math.round(Number(context.maxDistanceKm) || 5))),
    budget: context.budget === 'low' || context.budget === 'flexible' ? context.budget : 'medium',
    companion: context.companion === 'date' || context.companion === 'friends' || context.companion === 'family'
      ? context.companion
      : 'solo',
    openNow: context.openNow === true,
  };
}

function configuredVietMapKey(): string {
  return process.env.VIETMAP_API_KEY?.trim() || '';
}

function configuredDeepSeekKey(): string {
  return process.env.DEEPSEEK_API_KEY?.trim() || '';
}

function deepSeekUrl(): string {
  return `${(process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/+$/, '')}/chat/completions`;
}

function deepSeekModel(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash';
}

async function deepSeekJson<T>(system: string, user: string, maxTokens: number): Promise<T> {
  const apiKey = configuredDeepSeekKey();
  if (!apiKey) throw new Error('DeepSeek is not configured.');

  let invalidResponseError = 'DeepSeek returned an empty JSON response.';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(deepSeekUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: deepSeekModel(),
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          // Query generation and ranking are short structured tasks. Turning
          // off thinking keeps the token budget for the required JSON output.
          thinking: { type: 'disabled' },
          reasoning_effort: 'none',
          temperature: 0.1,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = isRecord(payload) && isRecord(payload.error)
          ? stringValue(payload.error.message).replace(/[\r\n]+/g, ' ').slice(0, 240)
          : '';
        throw new Error(`DeepSeek failed (${response.status})${message ? `: ${message}` : ''}.`);
      }

      const content = isRecord(payload) && Array.isArray(payload.choices) && isRecord(payload.choices[0]) && isRecord(payload.choices[0].message)
        ? stringValue(payload.choices[0].message.content)
        : '';
      if (content) {
        try {
          return JSON.parse(content) as T;
        } catch {
          invalidResponseError = 'DeepSeek returned invalid JSON.';
        }
      } else {
        invalidResponseError = 'DeepSeek returned an empty JSON response.';
      }

      if (attempt === 0) {
        console.warn('[VietMap + DeepSeek] Empty or invalid JSON; retrying once.');
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(invalidResponseError);
}

function normalizeSearchQuery(value: unknown): string {
  const query = stringValue(value).replace(/\s+/g, ' ').slice(0, 120);
  if (query.length < 2) throw new Error('DeepSeek did not produce a usable VietMap search query.');
  if (/\b(tarot|thần số học|numerology|lá bài)\b/i.test(query)) {
    throw new Error('DeepSeek produced a non-practical VietMap search query.');
  }
  return query;
}

function safeSpiritualContext(context: SpiritualPlaceContext | undefined) {
  return {
    tarotCards: (context?.tarotCards || []).slice(0, 5).map((card) => ({
      name: stringValue(card.name).slice(0, 100),
      orientation: card.orientation === 'reversed' ? 'reversed' as const : 'upright' as const,
      position: stringValue(card.position).slice(0, 100),
      meaning: stringValue(card.meaning).slice(0, 500),
    })).filter((card) => card.name && card.meaning),
    indicators: (context?.indicators || []).slice(0, 5).map((indicator) => ({
      key: stringValue(indicator.key).slice(0, 80),
      name: stringValue(indicator.name).slice(0, 120),
      value: typeof indicator.value === 'number' || typeof indicator.value === 'string' ? indicator.value : '',
      summary: stringValue(indicator.summary).slice(0, 600),
    })).filter((indicator) => indicator.key && indicator.name && indicator.summary),
  };
}

async function createVietMapQuery(
  message: string,
  context: VietMapSearchContext,
  spiritualContext: SpiritualPlaceContext | undefined
): Promise<string> {
  const plan = await deepSeekJson<{ searchQuery?: unknown }>(
    `Bạn tạo truy vấn tìm POI cho VietMap. Chỉ trả về JSON hợp lệ theo mẫu {"searchQuery":"..."}.\n` +
      `Dùng yêu cầu thực tế là ưu tiên; Tarot và Thần số học chỉ giúp suy ra không khí hoặc loại trải nghiệm phù hợp. searchQuery phải là cụm từ tiếng Việt ngắn (2-120 ký tự) mô tả POI thực tế, ví dụ "quán cà phê yên tĩnh" hoặc "công viên đi dạo". Không nêu tên doanh nghiệp, không dùng các từ Tarot, lá bài, Thần số học hoặc numerology, không trả lời cho người dùng, không thêm trường khác.`,
    JSON.stringify({
      userRequest: message,
      preferences: {
        maxDistanceKm: context.maxDistanceKm,
        budget: context.budget,
        companion: context.companion,
        openNow: context.openNow,
      },
      spiritualContext: safeSpiritualContext(spiritualContext),
    }),
    100
  );
  return normalizeSearchQuery(plan.searchQuery);
}

function parseVietMapResults(payload: unknown, maxDistanceKm: number): VietMapPlace[] {
  const rows = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.data)
      ? payload.data
      : isRecord(payload) && Array.isArray(payload.results)
        ? payload.results
        : [];
  const unique = new Set<string>();
  const places: VietMapPlace[] = [];

  for (const item of rows) {
    if (!isRecord(item)) continue;
    const placeId = stringValue(item.ref_id);
    const name = stringValue(item.name);
    const address = stringValue(item.address) || stringValue(item.display);
    const distance = numberValue(item.distance);
    const categories = Array.isArray(item.categories)
      ? item.categories.map(stringValue).filter(Boolean).slice(0, 5)
      : [];
    if (!placeId || !name || unique.has(placeId)) continue;
    if (distance !== null && distance > maxDistanceKm) continue;
    unique.add(placeId);
    places.push({ placeId, name, address, distanceKm: distance, categories });
    if (places.length === 10) break;
  }

  return places;
}

function vietMapResponseDiagnostics(payload: unknown) {
  const record = isRecord(payload) ? payload : null;
  const listKey = Array.isArray(payload)
    ? 'root'
    : record && Array.isArray(record.data)
      ? 'data'
      : record && Array.isArray(record.results)
        ? 'results'
        : null;
  const list = listKey === 'root'
    ? payload
    : listKey && record
      ? record[listKey]
      : null;

  return {
    payloadKind: Array.isArray(payload) ? 'array' : record ? 'object' : typeof payload,
    topLevelKeys: record ? Object.keys(record).slice(0, 10) : [],
    candidateListKey: listKey,
    candidateCount: Array.isArray(list) ? list.length : 0,
  };
}

async function searchVietMap(query: string, context: VietMapSearchContext): Promise<VietMapPlace[]> {
  const apiKey = configuredVietMapKey();
  if (!apiKey) throw new Error('VietMap is not configured.');

  const url = new URL(VIETMAP_AUTOCOMPLETE_URL);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('text', query);
  url.searchParams.set('focus', `${context.latitude},${context.longitude}`);
  // `focus` only changes ranking. Constrain VietMap itself to the requested
  // radius so the first ten autocomplete rows are actually nearby POIs.
  url.searchParams.set('circle_center', `${context.latitude},${context.longitude}`);
  url.searchParams.set('circle_radius', String(context.maxDistanceKm * 1_000));
  url.searchParams.set('layers', 'POI');
  url.searchParams.set('display_type', '1');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = isRecord(payload)
        ? stringValue(payload.message || payload.error).replace(/[\r\n]+/g, ' ').slice(0, 240)
        : '';
      throw new Error(`VietMap search failed (${response.status})${message ? `: ${message}` : ''}.`);
    }
    const places = parseVietMapResults(payload, context.maxDistanceKm);
    console.info('[VietMap search] response diagnostics:', {
      status: response.status,
      ...vietMapResponseDiagnostics(payload),
      usablePlaces: places.length,
    });
    return places;
  } finally {
    clearTimeout(timeout);
  }
}

function safeExplanation(value: unknown, maxLength = 220): string {
  return stringValue(value).replace(/\s+/g, ' ').slice(0, maxLength);
}

export interface VietMapSearchResult {
  searchQuery: string;
  places: VietMapPlace[];
  placeReasons: Array<{ placeId: string; reason: string }>;
  summary: string;
  nextStep: string;
}

/** Builds the user-visible response from DeepSeek wording and verified POI names only. */
export function formatPlaceReply(result: VietMapSearchResult): string {
  const reasonsByPlaceId = new Map(result.placeReasons.map((item) => [item.placeId, item.reason]));
  const reasonLines = result.places.map((place) =>
    `• ${place.name}: ${reasonsByPlaceId.get(place.placeId) || 'Được DeepSeek xếp hạng từ các kết quả đã xác thực của VietMap.'}`
  ).join('\n');

  return [
    `✦ KẾT LUẬN NHANH:\n${result.summary || 'DeepSeek đã chọn các địa điểm phù hợp từ những POI gần bạn do VietMap xác thực.'}`,
    `\n✦ VÌ SAO:\n${reasonLines}`,
    `\n✦ NÊN LÀM GÌ:\n• ${result.nextStep || 'Xem địa chỉ và khoảng cách của từng nơi trước khi xuất phát.'}`,
  ].join('\n');
}

/**
 * Deterministic data flow for where_to_go:
 * DeepSeek makes a search phrase, VietMap returns actual POIs, then DeepSeek
 * may rank only those POIs. It never receives the user's exact coordinates.
 */
export async function findVietMapPlaces(input: {
  message: string;
  context: VietMapSearchContext;
  spiritualContext?: SpiritualPlaceContext;
}): Promise<VietMapSearchResult> {
  const context = normalizeContext(input.context);
  const spiritualContext = safeSpiritualContext(input.spiritualContext);
  const searchQuery = await createVietMapQuery(input.message, context, spiritualContext);
  const candidates = await searchVietMap(searchQuery, context);
  if (candidates.length === 0) {
    return { searchQuery, places: [], placeReasons: [], summary: '', nextStep: '' };
  }

  let ranking: {
    selectedIndexes?: unknown;
    placeReasons?: unknown;
    summary?: unknown;
    nextStep?: unknown;
  } = {};
  try {
    ranking = await deepSeekJson<typeof ranking>(
      `Bạn xếp hạng địa điểm dựa duy nhất trên danh sách VietMap được cung cấp. Chỉ trả về JSON hợp lệ theo mẫu {"selectedIndexes":[0,1,2],"placeReasons":[{"index":0,"reason":"..."}],"summary":"...","nextStep":"..."}.\n` +
        `selectedIndexes phải chứa 1-3 chỉ số nguyên, không lặp, chỉ nằm trong danh sách. placeReasons chỉ dùng index trong selectedIndexes và có một reason tiếng Việt ngắn cho từng nơi. summary liên hệ nhu cầu hiện tại với Tarot/chỉ số đã cung cấp như một gợi ý chiêm nghiệm, không khẳng định chắc chắn. nextStep là một hành động thực tế ngắn. Không bịa rating, giờ mở cửa, giá, tiện nghi, khoảng cách, địa chỉ hoặc tên địa điểm; không lặp tên địa điểm trong reason.`,
      JSON.stringify({
        userRequest: input.message,
        preferences: { budget: context.budget, companion: context.companion, openNow: context.openNow },
        spiritualContext,
        vietMapCandidates: candidates.map((place, index) => ({
          index,
          name: place.name,
          address: place.address,
          distanceKm: place.distanceKm,
          categories: place.categories,
        })),
      }),
      360
    );
  } catch (error) {
    console.warn('[VietMap + DeepSeek] Ranking unavailable; returning verified VietMap candidates.', error instanceof Error ? error.message : 'unknown error');
  }

  const selectedIndexes = Array.isArray(ranking.selectedIndexes)
    ? Array.from(new Set(ranking.selectedIndexes.filter((index): index is number =>
      typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < candidates.length
    ))).slice(0, 3)
    : [];
  const places = (selectedIndexes.length > 0 ? selectedIndexes : candidates.slice(0, 3).map((_, index) => index))
    .map((index) => candidates[index]);

  const validPlaceIds = new Set(places.map((place) => place.placeId));
  const placeReasons = Array.isArray(ranking.placeReasons)
    ? ranking.placeReasons.flatMap((item) => {
      if (!isRecord(item) || typeof item.index !== 'number' || !Number.isInteger(item.index)) return [];
      const place = candidates[item.index];
      const reason = safeExplanation(item.reason);
      return place && validPlaceIds.has(place.placeId) && reason ? [{ placeId: place.placeId, reason }] : [];
    })
    : [];

  return {
    searchQuery,
    places,
    placeReasons,
    summary: safeExplanation(ranking.summary, 360),
    nextStep: safeExplanation(ranking.nextStep, 220),
  };
}
