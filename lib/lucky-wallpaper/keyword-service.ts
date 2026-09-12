import {
  classifyProviderError,
  getOrderedModelCandidates,
  getProviderCascade,
  markCredentialFailure,
  markModelFailure,
  markProviderFailure,
  requestChatCompletion,
} from '../ai/provider-cascade.ts';
import {
  DEVICE_ASPECT_RATIOS,
  INTENTION_OPTIONS,
  NUMEROLOGY_AESTHETICS_MAP,
  WALLPAPER_STYLES,
} from './constants.ts';
import type { PromptBuilderInput } from './prompt-builder.ts';

export interface WallpaperKeywordBatch {
  queries: string[];
  source: 'ai';
  round: 1 | 2;
  aiProvider: string;
  aiModel: string;
}

const MAX_QUERIES = 6;
const MIN_WORDS = 3;
const MAX_WORDS = 7;
const BLOCKED_QUERY_TERMS = new Set([
  'adidas', 'apple', 'coca', 'cola', 'disney', 'erotic', 'gore', 'marvel',
  'netflix', 'nike', 'nude', 'nudity', 'pixar', 'pokemon', 'samsung',
  'sexy', 'starbucks', 'violence', 'weapon',
]);

function extractJsonObject(text: string): unknown {
  let content = text.trim();
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) content = fenced[1].trim();

  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start >= 0 && end > start) content = content.slice(start, end + 1);

  try {
    return JSON.parse(content.replace(/,\s*([}\]])/g, '$1'));
  } catch {
    return null;
  }
}

function normalizeQuery(query: unknown): string | null {
  if (typeof query !== 'string') return null;
  const ascii = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!ascii) return null;

  const words = ascii.split(' ').filter(Boolean).slice(0, MAX_WORDS);
  if (words.length < MIN_WORDS) return null;
  return words.join(' ').slice(0, 100);
}

export function normalizeWallpaperQueries(
  value: unknown,
  excludedQueries: string[] = [],
  extraBlockedTerms: string[] = []
): string[] {
  const rawQueries = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { queries?: unknown }).queries)
      ? (value as { queries: unknown[] }).queries
      : [];
  const excluded = new Set(excludedQueries.map((query) => normalizeQuery(query)).filter(Boolean));
  const blocked = new Set([
    ...Array.from(BLOCKED_QUERY_TERMS),
    ...extraBlockedTerms
      .map((term) => term.toLowerCase().replace(/[^a-z0-9-]/g, ''))
      .filter(Boolean),
  ]);
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawQuery of rawQueries) {
    const query = normalizeQuery(rawQuery);
    if (!query || excluded.has(query) || seen.has(query)) continue;
    if (query.split(' ').some((word) => blocked.has(word))) continue;
    seen.add(query);
    normalized.push(query);
    if (normalized.length === MAX_QUERIES) break;
  }

  return normalized;
}

function buildKeywordPrompt(
  input: PromptBuilderInput,
  round: 1 | 2,
  previousQueries: string[]
): Array<{ role: string; content: string }> {
  const lifePath = Number(input.lifePathNumber) || 1;
  const personalDay = Number(input.personalDay) || 1;
  const lifePathAesthetics = NUMEROLOGY_AESTHETICS_MAP[lifePath] || NUMEROLOGY_AESTHETICS_MAP[1];
  const dayAesthetics = NUMEROLOGY_AESTHETICS_MAP[personalDay] || NUMEROLOGY_AESTHETICS_MAP[1];
  const style = WALLPAPER_STYLES.find((item) => item.id === input.styleId) || WALLPAPER_STYLES[0];
  const intention = INTENTION_OPTIONS.find((item) => item.id === input.intentionId) || INTENTION_OPTIONS[0];
  const device = DEVICE_ASPECT_RATIOS.find((item) => item.id === input.deviceType) || DEVICE_ASPECT_RATIOS[0];

  const system = `You create concise English search queries for Pixabay and Pexels stock image libraries to find stunning mobile/desktop wallpapers.
Return only valid JSON with exactly this shape: {"queries":["query one","query two","query three","query four","query five","query six"]}.
Every query must contain 3 to 7 simple English words and be no longer than 100 characters.

CORE RULES:
1. USER'S VISUAL WISH (HIGHEST PRIORITY):
   - When the user specifies a custom subject, character, or artistic genre (e.g. in Vietnamese or English: "siêu nhân", "anime", "hoạt hình", "robot", "hoa sen", "rồng", "chiến binh", "superhero"), you MUST make that exact subject the CENTRAL THEME of queries 1 through 4.
   - Accurately translate Vietnamese concepts into popular English stock tags (e.g. "siêu nhân" -> "superhero warrior armor", "anime" -> "anime style illustration", "hoạt hình" -> "cartoon animation art", "rồng" -> "mythical dragon fantasy").
   - Harmonize the subject with the user's requested style, lucky colors, or glowing atmosphere.
   - Queries 5 and 6 can offer broader alternatives or scenic interpretations.
2. WHEN NO SPECIFIC WISH IS GIVEN:
   - Ground the queries in the Life Path sacred symbols, style preset, intention, and lucky colors.
3. STOCK SEARCH HYGIENE:
   - Order queries from most specific to broadest.
   - Use concrete visible subjects, environments, lighting, and art styles (e.g. illustration, digital art, vector, 3D render).
   - Avoid trademarked franchise names (e.g. use generic descriptors like "superhero armored warrior" instead of "Iron Man", "anime warrior" instead of "Goku").
   - Do NOT include personal names, sensitive content, or instructions to render text.
   - All six queries must be completely distinct.`;

  const retryContext = round === 2
    ? `This is the second and final attempt. These searches had no usable result and MUST NOT be repeated or lightly reordered: ${previousQueries.join(' | ')}. Use different subjects and broader visual synonyms.`
    : 'This is the first attempt.';

  const rawWish = input.customWish?.replace(/[\r\n]+/g, ' ').trim().slice(0, 200) || '';
  const hasWish = Boolean(rawWish && rawWish.toLowerCase() !== 'none' && rawWish.toLowerCase() !== 'null');
  const luckyColors = Array.from(new Set([...lifePathAesthetics.primaryColors_en, ...dayAesthetics.primaryColors_en])).slice(0, 5).join(', ');

  const wishContext = hasWish
    ? `- User's explicit visual subject / theme (PRIORITY): "${rawWish}"
  * User strongly desires this specific subject/style! Translate any Vietnamese terms into English stock search keywords and feature this subject in queries 1-4, combined with lucky colors (${luckyColors}) and style (${style.name_en}).`
    : `- User's custom wish: None (focus on numerology symbols, intention and aesthetic).`;

  const user = `Create six stock-image search queries for a personalized numerology wallpaper.
${wishContext}
- Life Path ${lifePath}: ${lifePathAesthetics.name_en}; symbols: ${lifePathAesthetics.sacredSymbol_en}
- Personal Day ${personalDay}: ${dayAesthetics.name_en}; motifs: ${dayAesthetics.keywords_en.join(', ')}
- Lucky colors: ${luckyColors}
- Style: ${style.name_en}
- Intention: ${intention.name_en}; visual direction: ${intention.prompt_keywords}
- Target: ${device.label_en}, ${device.ratio}
${retryContext}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export async function generateWallpaperKeywordBatch(
  input: PromptBuilderInput,
  round: 1 | 2,
  previousQueries: string[] = [],
  deadlineAt: number = Date.now() + 7_000
): Promise<WallpaperKeywordBatch | null> {
  const providers = getProviderCascade();
  if (providers.length === 0) return null;

  const candidates = getOrderedModelCandidates(providers, {
    maxModelsPerProvider: 2,
    maxKeysPerProvider: 2,
  });
  const failedProviders = new Set<(typeof providers)[number]>();
  const messages = buildKeywordPrompt(input, round, previousQueries);
  const roundDeadline = Math.min(deadlineAt, Date.now() + 15_000);

  for (const candidate of candidates) {
    const { provider, model, apiKey } = candidate;
    if (failedProviders.has(provider)) continue;
    const remainingMs = roundDeadline - Date.now();
    if (remainingMs < 1_000) return null;

    try {
      const response = await requestChatCompletion(provider, model, messages, apiKey, {
        temperature: round === 1 ? 0.45 : 0.7,
        maxTokens: 600,
        reasoningEffort: 'low',
        timeoutMs: Math.min(8_000, remainingMs),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const scope = classifyProviderError(response.status, errorText);
        if (scope === 'credential') markCredentialFailure(candidate);
        if (scope === 'model') markModelFailure(candidate);
        if (scope === 'provider') {
          markProviderFailure(candidate);
          failedProviders.add(provider);
        }
        if (scope === 'request') return null;
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = typeof content === 'string' ? extractJsonObject(content) : null;
      const personalNameTerms = (input.fullName || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter((term) => term.length >= 3);
      const queries = normalizeWallpaperQueries(parsed, previousQueries, personalNameTerms);
      if (queries.length !== MAX_QUERIES) {
        markModelFailure(candidate);
        continue;
      }

      return {
        queries,
        source: 'ai',
        round,
        aiProvider: provider.name,
        aiModel: model,
      };
    } catch {
      markProviderFailure(candidate);
      failedProviders.add(provider);
    }
  }

  return null;
}
