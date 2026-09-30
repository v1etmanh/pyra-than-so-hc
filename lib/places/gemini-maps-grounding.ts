export type PlaceBudget = 'low' | 'medium' | 'flexible';
export type PlaceCompanion = 'solo' | 'date' | 'friends' | 'family';

export interface GeminiMapsContext {
  latitude: number;
  longitude: number;
  maxDistanceKm: number;
  budget: PlaceBudget;
  companion: PlaceCompanion;
  openNow: boolean;
}

export interface GeminiMapsPlace {
  placeId: string;
  name: string;
  mapsUrl: string;
}

type JsonRecord = Record<string, unknown>;

const INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isLatitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;
}

function normalizeContext(context: GeminiMapsContext): GeminiMapsContext {
  if (!isLatitude(context.latitude) || !isLongitude(context.longitude)) {
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

function configuredKeys(): string[] {
  // Maps Grounding has a dedicated key pool. Never fall back to the ordinary
  // Gemini chat keys, so Maps usage, quotas, and billing remain isolated.
  return Array.from(new Set(
    (process.env.GEMINI_MAPS_API_KEYS || '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean)
  ));
}

function categoryFor(message: string): string {
  const normalized = message.toLowerCase();
  if (/(cà phê|cafe|coffee|trà sữa)/i.test(normalized)) return 'cafes';
  if (/(ăn|quán|nhà hàng|món|food|restaurant)/i.test(normalized)) return 'restaurants';
  if (/(biển|beach)/i.test(normalized)) return 'beaches and scenic places';
  if (/(công viên|park)/i.test(normalized)) return 'parks and outdoor places';
  if (/(bar|pub|nhậu)/i.test(normalized)) return 'bars and nightlife venues';
  return 'places to visit';
}

function buildEnglishPrompt(message: string, context: GeminiMapsContext): string {
  const companion = {
    solo: 'one person',
    date: 'a date',
    friends: 'a group of friends',
    family: 'a family outing',
  }[context.companion];
  const budget = {
    low: 'budget-friendly',
    medium: 'moderately priced',
    flexible: 'any price level',
  }[context.budget];

  // Maps Grounding currently supports English prompts. We derive the category
  // locally from the Vietnamese request rather than asking the tool to process
  // a Vietnamese prompt.
  return [
    `Recommend up to five real ${categoryFor(message)} near the supplied location.`,
    `They should be suitable for ${companion}, within roughly ${context.maxDistanceKm} km, and ${budget}.`,
    context.openNow ? 'Prioritize places that are open now.' : '',
    'Use Google Maps sources. Return concise recommendations with citations.',
  ].filter(Boolean).join(' ');
}

function citationsFromResponse(payload: unknown): GeminiMapsPlace[] {
  if (!isRecord(payload) || !Array.isArray(payload.steps)) return [];
  const places: GeminiMapsPlace[] = [];
  const seen = new Set<string>();

  for (const step of payload.steps) {
    if (!isRecord(step) || step.type !== 'model_output' || !Array.isArray(step.content)) continue;
    for (const content of step.content) {
      if (!isRecord(content) || !Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations) {
        if (!isRecord(annotation) || annotation.type !== 'place_citation') continue;
        const name = stringValue(annotation.name);
        const mapsUrl = stringValue(annotation.url);
        if (!name || !mapsUrl || seen.has(mapsUrl)) continue;
        seen.add(mapsUrl);
        places.push({ placeId: mapsUrl, name, mapsUrl });
        if (places.length === 5) return places;
      }
    }
  }
  return places;
}

/**
 * Emits only structural metadata to help diagnose missing citations. It must
 * never include the user's coordinates, request text, place names, or URLs.
 */
function responseDiagnostics(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.steps)) {
    return { hasSteps: false, stepTypes: [], modelOutputTextBlocks: 0, textCharacters: 0, annotations: {} };
  }

  const annotationTypes: Record<string, number> = {};
  let modelOutputTextBlocks = 0;
  let textCharacters = 0;

  for (const step of payload.steps) {
    if (!isRecord(step) || step.type !== 'model_output' || !Array.isArray(step.content)) continue;
    for (const content of step.content) {
      if (!isRecord(content)) continue;
      if (content.type === 'text') {
        modelOutputTextBlocks += 1;
        if (typeof content.text === 'string') textCharacters += content.text.length;
      }
      if (!Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations) {
        if (!isRecord(annotation)) continue;
        const type = stringValue(annotation.type) || 'unknown';
        annotationTypes[type] = (annotationTypes[type] || 0) + 1;
      }
    }
  }

  return {
    hasSteps: true,
    stepTypes: payload.steps.map((step) => (isRecord(step) ? stringValue(step.type) || 'unknown' : 'invalid')),
    mapsToolCalled: payload.steps.some((step) => isRecord(step) && step.type === 'google_maps_call'),
    mapsToolReturnedResults: payload.steps.some((step) => isRecord(step) && step.type === 'google_maps_result'),
    modelOutputTextBlocks,
    textCharacters,
    annotations: annotationTypes,
  };
}

function errorMessage(payload: unknown, status: number): string {
  const message = isRecord(payload) && isRecord(payload.error)
    ? stringValue(payload.error.message).replace(/[\r\n]+/g, ' ').slice(0, 240)
    : '';
  return `Gemini Maps grounding failed (${status})${message ? `: ${message}` : ''}.`;
}

/**
 * Uses Google Maps Grounding only for where_to_go. Place names and links are
 * accepted exclusively from Google's place_citation annotations.
 */
export async function findGeminiMapsPlaces(input: {
  message: string;
  context: GeminiMapsContext;
}): Promise<GeminiMapsPlace[]> {
  const context = normalizeContext(input.context);
  const keys = configuredKeys();
  if (keys.length === 0) throw new Error('Gemini Maps Grounding is not configured.');

  const model = process.env.GEMINI_MAPS_MODEL?.trim() || 'gemini-2.5-flash';
  let lastError: Error | null = null;

  for (let index = 0; index < keys.length; index += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(INTERACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': keys[index],
        },
        body: JSON.stringify({
          model,
          input: buildEnglishPrompt(input.message, context),
          tools: [{ type: 'google_maps', latitude: context.latitude, longitude: context.longitude }],
        }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        lastError = new Error(errorMessage(payload, response.status));
        if (response.status === 429 || response.status === 401 || response.status === 403 || response.status >= 500) {
          console.warn(`[Gemini Maps grounding] key ${index + 1}/${keys.length} unavailable (${response.status}); trying next key.`);
          continue;
        }
        throw lastError;
      }

      const places = citationsFromResponse(payload);
      console.info('[Gemini Maps grounding] response diagnostics:', {
        status: response.status,
        ...responseDiagnostics(payload),
        citedPlaces: places.length,
      });
      console.info(`[Gemini Maps grounding] received ${places.length} cited places.`);
      return places;
    } catch (error) {
      if (controller.signal.aborted) {
        lastError = new Error('Gemini Maps grounding timed out.');
      } else if (error instanceof Error) {
        lastError = error;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('Gemini Maps grounding failed.');
}
