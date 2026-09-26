import { createHmac, timingSafeEqual } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type WallpaperImageProvider = 'pixabay' | 'pexels' | 'cloudflare';

export interface GenerateImageOptions {
  queries: string[];
  width?: number;
  height?: number;
  seed?: number;
  engine?: 'auto' | WallpaperImageProvider;
  excludedProviders?: WallpaperImageProvider[];
  fetchImpl?: typeof fetch;
  deadlineAt?: number;
  count?: number;
}

export interface WallpaperAttribution {
  provider: 'Pixabay' | 'Pexels' | 'Cloudflare AI';
  creator: string;
  creatorUrl?: string;
  sourcePageUrl: string;
  providerUrl: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  seed: number;
  provider: WallpaperImageProvider;
  model: 'stock-photo' | 'flux-1-schnell' | string;
  width: number;
  height: number;
  sourceId: string;
  query: string;
  attribution: WallpaperAttribution;
}

export interface WallpaperImageSearchOutcome {
  result: ImageGenerationResult | null;
  results?: ImageGenerationResult[];
  attemptedQueries: string[];
  failedProviders: WallpaperImageProvider[];
  hadSuccessfulResponse: boolean;
}

interface StockPhotoCandidate {
  id: string;
  remoteUrl: string;
  width: number;
  height: number;
  attribution: WallpaperAttribution;
}

const PROVIDER_URLS: Record<WallpaperImageProvider, string> = {
  pixabay: 'https://pixabay.com',
  pexels: 'https://www.pexels.com',
  cloudflare: 'https://cloudflare.com',
};

function clampQuery(query: string): string {
  return query.replace(/[^a-zA-Z0-9À-ỹ\s-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

function orientationForPexels(width: number, height: number): 'portrait' | 'landscape' | 'square' {
  if (width === height) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

function orientationForPixabay(width: number, height: number): 'horizontal' | 'vertical' | 'all' {
  if (width === height) return 'all';
  return width > height ? 'horizontal' : 'vertical';
}

function getPexelsKey(): string {
  return (process.env.PEXELS_API_KEY || process.env.PEXEL_API_KEY || '').trim();
}

function getPixabayKey(): string {
  return (process.env.PIXABAY_API_KEY || '').trim();
}

function getProxySecret(): string {
  return (
    process.env.WALLPAPER_ASSET_SIGNING_SECRET?.trim() ||
    getPixabayKey() ||
    getPexelsKey() ||
    ''
  );
}

function signAssetToken(token: string): string {
  const secret = getProxySecret();
  if (!secret) throw new Error('Wallpaper image providers are not configured.');
  return createHmac('sha256', secret).update(token).digest('base64url');
}

function buildProxyUrl(remoteUrl: string, provider: WallpaperImageProvider): string {
  const token = Buffer.from(JSON.stringify({ url: remoteUrl, provider }), 'utf8').toString('base64url');
  const signature = signAssetToken(token);
  return `/api/lucky-wallpaper/image?token=${encodeURIComponent(token)}&signature=${encodeURIComponent(signature)}`;
}

export function verifyWallpaperAssetToken(token: string, signature: string): {
  url: string;
  provider: 'pixabay' | 'pexels';
} | null {
  try {
    const expected = Buffer.from(signAssetToken(token));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
      url?: unknown;
      provider?: unknown;
    };
    if (payload.provider !== 'pixabay' && payload.provider !== 'pexels') return null;
    if (typeof payload.url !== 'string') return null;

    const url = new URL(payload.url);
    const validHost =
      payload.provider === 'pexels'
        ? url.protocol === 'https:' && url.hostname === 'images.pexels.com'
        : url.protocol === 'https:' && (url.hostname === 'cdn.pixabay.com' || url.hostname === 'pixabay.com');
    if (!validHost) return null;

    return { url: url.toString(), provider: payload.provider };
  } catch {
    return null;
  }
}

const ARTISTIC_QUERY_TERMS = new Set([
  'anime', 'manga', 'illustration', 'cartoon', 'comic',
  'drawing', 'vector', 'clipart', 'superhero', 'character',
  'painting', 'artwork',
]);

function isArtisticQuery(query: string): boolean {
  const words = query.toLowerCase().split(/[\s-]+/);
  return words.some((word) => ARTISTIC_QUERY_TERMS.has(word));
}

async function searchPixabay(
  query: string,
  width: number,
  height: number,
  signal: AbortSignal,
  fetchImpl: typeof fetch
): Promise<StockPhotoCandidate[]> {
  const apiKey = getPixabayKey();
  if (!apiKey) return [];

  const clamped = clampQuery(query);
  const preferredImageType = isArtisticQuery(clamped) ? 'illustration' : 'all';

  const requestPixabay = async (imageType: 'all' | 'illustration' | 'photo' | 'vector') => {
    const params = new URLSearchParams({
      key: apiKey,
      q: clamped,
      lang: 'en',
      image_type: imageType,
      orientation: orientationForPixabay(width, height),
      min_width: String(Math.min(width, 1920)),
      min_height: String(Math.min(height, 1920)),
      safesearch: 'true',
      order: 'popular',
      per_page: '50',
    });
    const response = await fetchImpl(`https://pixabay.com/api/?${params}`, { signal });
    if (!response.ok) throw new Error(`Pixabay returned HTTP ${response.status}.`);

    const data = (await response.json()) as { hits?: Array<Record<string, unknown>> };
    return data.hits || [];
  };

  let hits = await requestPixabay(preferredImageType);
  if (hits.length === 0 && preferredImageType !== 'all') {
    hits = await requestPixabay('all');
  }

  return hits.flatMap((hit) => {
    const remoteUrl = String(hit.fullHDURL || hit.largeImageURL || hit.webformatURL || '');
    const sourcePageUrl = String(hit.pageURL || '');
    if (!remoteUrl || !sourcePageUrl) return [];
    return [{
      id: String(hit.id || ''),
      remoteUrl,
      width: Number(hit.imageWidth || hit.webformatWidth || width),
      height: Number(hit.imageHeight || hit.webformatHeight || height),
      attribution: {
        provider: 'Pixabay' as const,
        creator: String(hit.user || 'Pixabay contributor'),
        sourcePageUrl,
        providerUrl: PROVIDER_URLS.pixabay,
      },
    }];
  });
}

async function searchPexels(
  query: string,
  width: number,
  height: number,
  signal: AbortSignal,
  fetchImpl: typeof fetch
): Promise<StockPhotoCandidate[]> {
  const apiKey = getPexelsKey();
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query: clampQuery(query),
    orientation: orientationForPexels(width, height),
    size: 'large',
    locale: 'en-US',
    per_page: '50',
  });
  const response = await fetchImpl(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: apiKey },
    signal,
  });
  if (!response.ok) throw new Error(`Pexels returned HTTP ${response.status}.`);

  const data = (await response.json()) as { photos?: Array<Record<string, unknown>> };
  return (data.photos || []).flatMap((photo) => {
    const src = (photo.src || {}) as Record<string, unknown>;
    const remoteUrl = String(src.original || src.large2x || src.large || '');
    const sourcePageUrl = String(photo.url || '');
    if (!remoteUrl || !sourcePageUrl) return [];
    return [{
      id: String(photo.id || ''),
      remoteUrl,
      width: Number(photo.width || width),
      height: Number(photo.height || height),
      attribution: {
        provider: 'Pexels' as const,
        creator: String(photo.photographer || 'Pexels contributor'),
        creatorUrl: typeof photo.photographer_url === 'string' ? photo.photographer_url : undefined,
        sourcePageUrl,
        providerUrl: PROVIDER_URLS.pexels,
      },
    }];
  });
}

function configuredProviders(engine: GenerateImageOptions['engine']): WallpaperImageProvider[] {
  if (engine === 'pixabay' || engine === 'pexels') return [engine];

  const requested = (process.env.WALLPAPER_IMAGE_PROVIDER_ORDER || 'pixabay,pexels')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is WallpaperImageProvider => value === 'pixabay' || value === 'pexels');
  return requested.length > 0 ? Array.from(new Set(requested)) : ['pixabay', 'pexels'];
}

export function isSuitableWallpaperCandidate(
  candidate: Pick<StockPhotoCandidate, 'width' | 'height'>,
  targetWidth: number,
  targetHeight: number
): boolean {
  if (!Number.isFinite(candidate.width) || !Number.isFinite(candidate.height)) return false;
  if (candidate.width < targetWidth || candidate.height < targetHeight) return false;

  const ratio = candidate.width / candidate.height;
  if (targetWidth === targetHeight) return ratio >= 0.8 && ratio <= 1.25;
  return targetWidth > targetHeight ? ratio >= 1.25 : ratio <= 0.8;
}

/**
 * Finds a high-quality stock photo using deterministic search terms. The API
 * returns a signed, same-origin proxy URL so the client can safely add the
 * numerology layer to the downloaded wallpaper with Canvas.
 */
export async function searchWallpaperImage(options: GenerateImageOptions): Promise<WallpaperImageSearchOutcome> {
  const width = options.width || 720;
  const height = options.height || 1280;
  const seed = options.seed ?? Math.floor(Math.random() * 10_000_000);
  const targetCount = options.count !== undefined ? Math.max(1, Math.min(8, options.count)) : 1;
  const queries = Array.from(new Set(options.queries.map(clampQuery).filter(Boolean)));

  if (queries.length === 0) throw new Error('No wallpaper search terms were provided.');

  const excludedProviders = new Set(options.excludedProviders || []);
  const providers = configuredProviders(options.engine).filter((provider) => !excludedProviders.has(provider));
  const availableProviders = providers.filter((provider) =>
    provider === 'pixabay' ? Boolean(getPixabayKey()) : Boolean(getPexelsKey())
  );
  if (availableProviders.length === 0) {
    if (excludedProviders.size > 0) {
      return {
        result: null,
        results: [],
        attemptedQueries: [],
        failedProviders: [],
        hadSuccessfulResponse: false,
      };
    }
    throw new Error('No enabled wallpaper provider has an API key. Configure PIXABAY_API_KEY or enable another keyed provider.');
  }

  const failedProviders = new Set<WallpaperImageProvider>();
  const attemptedQueries: string[] = [];
  const collectedResults: ImageGenerationResult[] = [];
  const seenIds = new Set<string>();
  let hadSuccessfulResponse = false;
  const fetchImpl = options.fetchImpl || fetch;

  for (const query of queries) {
    attemptedQueries.push(query);
    for (const provider of availableProviders) {
      if (failedProviders.has(provider)) continue;
      const remainingMs = (options.deadlineAt ?? Date.now() + 4_500) - Date.now();
      if (remainingMs < 250) {
        return {
          result: collectedResults[0] ?? null,
          results: collectedResults,
          attemptedQueries,
          failedProviders: Array.from(failedProviders),
          hadSuccessfulResponse,
        };
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(4_500, remainingMs));
      try {
        const candidates = provider === 'pixabay'
          ? await searchPixabay(query, width, height, controller.signal, fetchImpl)
          : await searchPexels(query, width, height, controller.signal, fetchImpl);
        hadSuccessfulResponse = true;
        const suitableCandidates = candidates.filter((candidate) =>
          isSuitableWallpaperCandidate(candidate, width, height) &&
          !seenIds.has(`${provider}:${candidate.id}`)
        );

        if (suitableCandidates.length > 0) {
          const needed = targetCount - collectedResults.length;
          const countToTake = Math.min(needed, suitableCandidates.length);
          const totalSuitable = suitableCandidates.length;
          const startIndex = Math.abs(Math.trunc(seed)) % totalSuitable;
          const stride = Math.max(1, Math.floor(totalSuitable / countToTake));

          for (let i = 0; i < countToTake; i++) {
            const pickedIndex = (startIndex + i * stride) % totalSuitable;
            let chosen = suitableCandidates[pickedIndex];
            if (seenIds.has(`${provider}:${chosen.id}`)) {
              const alternative = suitableCandidates.find(c => !seenIds.has(`${provider}:${c.id}`));
              if (!alternative) break;
              chosen = alternative;
            }

            seenIds.add(`${provider}:${chosen.id}`);
            collectedResults.push({
              imageUrl: buildProxyUrl(chosen.remoteUrl, provider),
              seed: seed + collectedResults.length,
              provider,
              model: 'stock-photo',
              width,
              height,
              sourceId: chosen.id,
              query,
              attribution: chosen.attribution,
            });
          }

          if (collectedResults.length >= targetCount) {
            clearTimeout(timeoutId);
            return {
              result: collectedResults[0] ?? null,
              results: collectedResults,
              attemptedQueries,
              failedProviders: Array.from(failedProviders),
              hadSuccessfulResponse,
            };
          }
        }
      } catch {
        // Authentication, rate-limit, timeout and network errors are provider
        // failures. Do not retry that provider with a different keyword.
        failedProviders.add(provider);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  return {
    result: collectedResults[0] ?? null,
    results: collectedResults,
    attemptedQueries,
    failedProviders: Array.from(failedProviders),
    hadSuccessfulResponse,
  };
}

export async function generateViaCloudflare(
  prompt: string,
  width: number = 720,
  height: number = 1280,
  seed: number = Math.floor(Math.random() * 10_000_000),
  fetchImpl: typeof fetch = fetch
): Promise<ImageGenerationResult | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const targetModel = process.env.CLOUDFLARE_IMAGE_MODEL?.trim() || '@cf/black-forest-labs/flux-1-schnell';

  if (!accountId || !apiToken) {
    console.warn('[Cloudflare AI] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in environment');
    return null;
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${targetModel}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25_000);

    const body: Record<string, unknown> = {
      prompt: prompt.trim(),
    };

    if (targetModel.includes('flux-1-schnell')) {
      body.steps = 4;
    }

    const resp = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.warn(`[Cloudflare AI] HTTP ${resp.status}:`, errText);
      return null;
    }

    const data = (await resp.json()) as {
      result?: { image?: string };
      image?: string;
    };
    const base64Data: string | undefined = data?.result?.image || data?.image;

    if (!base64Data) {
      console.warn('[Cloudflare AI] No image data returned in response');
      return null;
    }

    let imageUrl = `data:image/jpeg;base64,${base64Data}`;

    // Save image to public directory for fast, clean URL serving
    try {
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const publicDir = path.resolve(process.cwd(), 'public', 'images', 'lucky-wallpapers');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      const filename = `lucky_cf_${seed}_${width}x${height}.jpg`;
      const filePath = path.join(publicDir, filename);
      fs.writeFileSync(filePath, imageBuffer);
      imageUrl = `/images/lucky-wallpapers/${filename}`;
    } catch (saveErr) {
      console.warn('[Cloudflare AI] Could not write file to disk, using data URL fallback:', saveErr);
    }

    return {
      imageUrl,
      seed,
      provider: 'cloudflare',
      model: 'flux-1-schnell',
      width,
      height,
      sourceId: `cf-${seed}`,
      query: prompt,
      attribution: {
        provider: 'Cloudflare AI',
        creator: 'Flux-1-schnell',
        sourcePageUrl: 'https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/',
        providerUrl: 'https://cloudflare.com',
      },
    };
  } catch (err) {
    console.warn('[Cloudflare AI] Generation request failed:', err);
    return null;
  }
}

export async function generateWallpaperImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
  const outcome = await searchWallpaperImage(options);
  if (outcome.result) return outcome.result;
  if (!outcome.hadSuccessfulResponse) {
    throw new Error('Các nguồn ảnh hiện không phản hồi. Vui lòng thử lại sau.');
  }
  throw new Error('Không tìm thấy ảnh phù hợp lúc này. Vui lòng thử lại với phong cách khác.');
}
