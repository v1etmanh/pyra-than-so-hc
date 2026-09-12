import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isSuitableWallpaperCandidate,
  searchWallpaperImage,
  verifyWallpaperAssetToken,
  type ImageGenerationResult,
} from '../lib/lucky-wallpaper/image-service.ts';
import { normalizeWallpaperQueries } from '../lib/lucky-wallpaper/keyword-service.ts';
import { findWallpaperWithAiKeywords } from '../lib/lucky-wallpaper/wallpaper-workflow.ts';

const originalEnv = {
  pixabay: process.env.PIXABAY_API_KEY,
  pexels: process.env.PEXELS_API_KEY,
  order: process.env.WALLPAPER_IMAGE_PROVIDER_ORDER,
  secret: process.env.WALLPAPER_ASSET_SIGNING_SECRET,
};

test.after(() => {
  setOrDeleteEnv('PIXABAY_API_KEY', originalEnv.pixabay);
  setOrDeleteEnv('PEXELS_API_KEY', originalEnv.pexels);
  setOrDeleteEnv('WALLPAPER_IMAGE_PROVIDER_ORDER', originalEnv.order);
  setOrDeleteEnv('WALLPAPER_ASSET_SIGNING_SECRET', originalEnv.secret);
});

function setOrDeleteEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function configureStockTestEnv(): void {
  process.env.PIXABAY_API_KEY = 'pixabay-test';
  process.env.PEXELS_API_KEY = 'pexels-test';
  process.env.WALLPAPER_IMAGE_PROVIDER_ORDER = 'pixabay,pexels';
  process.env.WALLPAPER_ASSET_SIGNING_SECRET = 'stable-test-secret';
}

function pexelsResponse(photos: unknown[]): Response {
  return Response.json({ photos });
}

function pixabayResponse(hits: unknown[]): Response {
  return Response.json({ hits });
}

function fakeImage(query = 'moonlit lotus lake'): ImageGenerationResult {
  return {
    imageUrl: '/api/lucky-wallpaper/image?test=1',
    seed: 42,
    provider: 'pixabay',
    model: 'stock-photo',
    width: 720,
    height: 1280,
    sourceId: '123',
    query,
    attribution: {
      provider: 'Pixabay',
      creator: 'Artist',
      sourcePageUrl: 'https://pixabay.com/photos/example-123/',
      providerUrl: 'https://pixabay.com',
    },
  };
}

test('keyword JSON is normalized, deduplicated and excludes prior searches', () => {
  const queries = normalizeWallpaperQueries({
    queries: [
      'Moonlit Lotus Lake Meditation',
      'moonlit lotus lake meditation',
      'two words',
      'Nike golden cosmic wallpaper',
      'Nguyen peaceful portrait background',
      'Golden   Sacred Geometry Background!!!',
      'Calm Blue Water Reflection',
      'Mystical Violet Night Landscape',
      'Peaceful Mountain Sunrise Horizon',
      'Soft Botanical Zen Illustration',
      'Extra query should be capped',
    ],
  }, ['calm blue water reflection'], ['nguyen']);

  assert.deepEqual(queries, [
    'moonlit lotus lake meditation',
    'golden sacred geometry background',
    'mystical violet night landscape',
    'peaceful mountain sunrise horizon',
    'soft botanical zen illustration',
    'extra query should be capped',
  ]);
});

test('candidate quality gate covers portrait, landscape and square targets', () => {
  assert.equal(isSuitableWallpaperCandidate({ width: 900, height: 1600 }, 720, 1280), true);
  assert.equal(isSuitableWallpaperCandidate({ width: 1600, height: 900 }, 1280, 720), true);
  assert.equal(isSuitableWallpaperCandidate({ width: 1200, height: 1100 }, 1024, 1024), true);
  assert.equal(isSuitableWallpaperCandidate({ width: 640, height: 1280 }, 720, 1280), false);
  assert.equal(isSuitableWallpaperCandidate({ width: 1200, height: 1200 }, 720, 1280), false);
});

test('search tries Pixabay then Pexels and takes the first candidate that passes quality checks', async () => {
  configureStockTestEnv();
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.startsWith('https://pixabay.com/api/')) return pixabayResponse([]);
    return pexelsResponse([
      {
        id: 1,
        width: 500,
        height: 700,
        url: 'https://www.pexels.com/photo/too-small-1/',
        photographer: 'Small Artist',
        photographer_url: 'https://www.pexels.com/@small',
        src: { original: 'https://images.pexels.com/photos/1/small.jpeg' },
      },
      {
        id: 2,
        width: 1200,
        height: 1800,
        url: 'https://www.pexels.com/photo/good-2/',
        photographer: 'Good Artist',
        photographer_url: 'https://www.pexels.com/@good',
        src: { original: 'https://images.pexels.com/photos/2/good.jpeg' },
      },
    ]);
  };

  const outcome = await searchWallpaperImage({
    queries: ['moonlit lotus lake', 'second unused query'],
    width: 720,
    height: 1280,
    seed: 42,
    fetchImpl,
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0], /^https:\/\/pixabay\.com\/api\//);
  assert.match(calls[1], /^https:\/\/api\.pexels\.com\/v1\/search/);
  assert.equal(outcome.result?.sourceId, '2');
  assert.equal(outcome.result?.query, 'moonlit lotus lake');
});

test('search advances to the next query only after both providers are empty', async () => {
  configureStockTestEnv();
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(`${url.hostname}:${url.searchParams.get('q') || url.searchParams.get('query')}`);
    const query = url.searchParams.get('q') || url.searchParams.get('query');
    if (query === 'first empty query') {
      return url.hostname === 'pixabay.com' ? pixabayResponse([]) : pexelsResponse([]);
    }
    return pixabayResponse([{
      id: 9,
      imageWidth: 1000,
      imageHeight: 1600,
      pageURL: 'https://pixabay.com/photos/result-9/',
      largeImageURL: 'https://cdn.pixabay.com/photo/result-9.jpg',
      user: 'Pixabay Artist',
    }]);
  };

  const outcome = await searchWallpaperImage({
    queries: ['first empty query', 'second successful query'],
    width: 720,
    height: 1280,
    seed: 9,
    fetchImpl,
  });

  assert.deepEqual(calls, [
    'pixabay.com:first empty query',
    'api.pexels.com:first empty query',
    'pixabay.com:second successful query',
  ]);
  assert.equal(outcome.result?.provider, 'pixabay');
});

test('workflow requests a second AI batch only after the first batch has no usable image', async () => {
  let keywordCalls = 0;
  const searchedBatches: string[][] = [];
  const result = await findWallpaperWithAiKeywords({
    input: { lifePathNumber: 7 },
    width: 720,
    height: 1280,
    seed: 42,
  }, {
    generateKeywords: async (_input, round, previous) => {
      keywordCalls += 1;
      if (round === 2) assert.equal(previous?.length, 6);
      return {
        queries: Array.from({ length: 6 }, (_, index) => `round ${round} query ${index}`),
        source: 'ai',
        round,
        aiProvider: 'Test AI',
        aiModel: 'test-model',
      };
    },
    searchImages: async (options) => {
      searchedBatches.push(options.queries);
      return searchedBatches.length === 1
        ? { result: null, attemptedQueries: options.queries, failedProviders: [], hadSuccessfulResponse: true }
        : { result: fakeImage(options.queries[0]), attemptedQueries: [options.queries[0]], failedProviders: [], hadSuccessfulResponse: true };
    },
    fallbackQueries: () => ['fallback nature background'],
  });

  assert.equal(keywordCalls, 2);
  assert.equal(searchedBatches.length, 2);
  assert.equal(result.keywordSource, 'ai');
  assert.equal(result.keywordRound, 2);
});

test('workflow uses deterministic queries when AI keyword generation fails', async () => {
  const result = await findWallpaperWithAiKeywords({
    input: { lifePathNumber: 8 },
    width: 720,
    height: 1280,
    seed: 8,
  }, {
    generateKeywords: async () => null,
    searchImages: async (options) => ({
      result: fakeImage(options.queries[0]),
      attemptedQueries: [options.queries[0]],
      failedProviders: [],
      hadSuccessfulResponse: true,
    }),
    fallbackQueries: () => ['gold prosperity abstract'],
  });

  assert.equal(result.keywordSource, 'fallback');
  assert.equal(result.keywordRound, 0);
});

test('provider outage does not trigger a second AI keyword batch', async () => {
  let keywordCalls = 0;
  await assert.rejects(() => findWallpaperWithAiKeywords({
    input: { lifePathNumber: 1 },
    width: 720,
    height: 1280,
    seed: 1,
  }, {
    generateKeywords: async (_input, round) => {
      keywordCalls += 1;
      return {
        queries: Array.from({ length: 6 }, (_, index) => `round ${round} query ${index}`),
        source: 'ai',
        round,
        aiProvider: 'Test AI',
        aiModel: 'test-model',
      };
    },
    searchImages: async (options) => ({
      result: null,
      attemptedQueries: options.queries,
      failedProviders: ['pixabay', 'pexels'],
      hadSuccessfulResponse: false,
    }),
    fallbackQueries: () => ['fallback nature background'],
  }), /không phản hồi/);
  assert.equal(keywordCalls, 1);
});

test('wallpaper asset token verification rejects invalid proxies', () => {
  assert.equal(verifyWallpaperAssetToken('invalid-token', 'invalid-sig'), null);
});
