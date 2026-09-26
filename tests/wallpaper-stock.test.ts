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
import { buildWallpaperSearchQueries } from '../lib/lucky-wallpaper/prompt-builder.ts';

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

test('search tries Pixabay then Pexels and takes a candidate that passes quality checks', async () => {
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

test('buildWallpaperSearchQueries translates Vietnamese custom wish into top queries', () => {
  const queries = buildWallpaperSearchQueries({
    lifePathNumber: 7,
    intentionId: 'wealth',
    styleId: 'luxury_gold_3d',
    customWish: 'hình ảnh anime siêu nhân',
  });

  assert.ok(queries.length >= 3);
  const firstQuery = queries[0];
  assert.match(firstQuery, /anime|superhero|warrior/i);
  assert.match(queries[1], /anime|superhero|gold/i);
});

test('cosmic wallpaper fallback searches for space imagery without tarot cards', () => {
  const queries = buildWallpaperSearchQueries({
    lifePathNumber: 7,
    intentionId: 'peace',
    styleId: 'cosmic_celestial',
  });

  assert.ok(queries.some((query) => /space|nebula|galaxy|stars/i.test(query)));
  assert.equal(queries.some((query) => /tarot|\bcards?\b|deck/i.test(query)), false);
});

test('stock selection uses the seed to vary among suitable candidates', async () => {
  configureStockTestEnv();
  const candidates = [1, 2, 3].map((id) => ({
    id,
    width: 1200,
    height: 1800,
    url: `https://www.pexels.com/photo/cosmic-${id}/`,
    photographer: `Artist ${id}`,
    src: { original: `https://images.pexels.com/photos/${id}/cosmic.jpeg` },
  }));
  const fetchImpl: typeof fetch = async () => pexelsResponse(candidates);

  const first = await searchWallpaperImage({
    queries: ['deep space nebula galaxy'],
    width: 720,
    height: 1280,
    seed: 0,
    engine: 'pexels',
    fetchImpl,
  });
  const second = await searchWallpaperImage({
    queries: ['deep space nebula galaxy'],
    width: 720,
    height: 1280,
    seed: 1,
    engine: 'pexels',
    fetchImpl,
  });

  assert.equal(first.result?.sourceId, '1');
  assert.equal(second.result?.sourceId, '2');
});

test('Pixabay uses illustration image_type when query contains anime/superhero keywords', async () => {
  configureStockTestEnv();
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(url.toString());
    assert.equal(url.searchParams.get('image_type'), 'illustration');
    return pixabayResponse([{
      id: 999,
      imageWidth: 1080,
      imageHeight: 1920,
      pageURL: 'https://pixabay.com/illustrations/anime-superhero-999/',
      largeImageURL: 'https://cdn.pixabay.com/photo/anime-superhero-999.jpg',
      user: 'AnimeArtist',
    }]);
  };

  const outcome = await searchWallpaperImage({
    queries: ['anime superhero warrior'],
    width: 720,
    height: 1280,
    seed: 99,
    fetchImpl,
  });

  assert.equal(outcome.result?.sourceId, '999');
  assert.equal(outcome.result?.provider, 'pixabay');
  assert.equal(calls.length, 1);
});

test('workflow falls back to Cloudflare drawing when stock photo providers return no suitable images', async () => {
  let drawCalled = false;
  let receivedPrompt = '';

  const result = await findWallpaperWithAiKeywords({
    input: {
      lifePathNumber: 7,
      personalDay: 1,
      styleId: 'luxury_gold_3d',
      intentionId: 'wealth',
      customWish: 'hình ảnh anime siêu nhân',
    },
    width: 720,
    height: 1280,
    seed: 77,
  }, {
    generateKeywords: async () => ({
      queries: ['anime superhero warrior'],
      source: 'ai',
      round: 1,
      aiProvider: 'Groq',
      aiModel: 'gpt-oss-20b',
    }),
    searchImages: async (options) => ({
      result: null,
      attemptedQueries: options.queries,
      failedProviders: [],
      hadSuccessfulResponse: true,
    }),
    fallbackQueries: () => ['superhero anime wallpaper'],
    drawWithCloudflare: async (prompt, width = 720, height = 1280, seed = 77) => {
      drawCalled = true;
      receivedPrompt = prompt;
      return {
        imageUrl: `/images/lucky-wallpapers/lucky_cf_${seed}_${width}x${height}.jpg`,
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
    },
  });

  assert.equal(drawCalled, true);
  assert.match(receivedPrompt, /anime/i);
  assert.match(receivedPrompt, /superhero/i);
  assert.equal(result.image.provider, 'cloudflare');
  assert.equal(result.image.model, 'flux-1-schnell');
  assert.equal(result.aiProvider, 'Cloudflare Workers AI');
});

test('workflow falls back to Cloudflare drawing when stock photo providers fail completely', async () => {
  let drawCalled = false;

  const result = await findWallpaperWithAiKeywords({
    input: {
      lifePathNumber: 8,
      intentionId: 'wealth',
    },
    width: 720,
    height: 1280,
    seed: 88,
  }, {
    generateKeywords: async () => ({
      queries: ['gold prosperity abstract'],
      source: 'ai',
      round: 1,
      aiProvider: 'Groq',
      aiModel: 'gpt-oss-20b',
    }),
    searchImages: async (options) => ({
      result: null,
      attemptedQueries: options.queries,
      failedProviders: ['pixabay', 'pexels'],
      hadSuccessfulResponse: false,
    }),
    fallbackQueries: () => ['gold prosperity abstract'],
    drawWithCloudflare: async (_prompt, width = 720, height = 1280, seed = 88) => {
      drawCalled = true;
      return {
        imageUrl: `/images/lucky-wallpapers/lucky_cf_${seed}_${width}x${height}.jpg`,
        seed,
        provider: 'cloudflare',
        model: 'flux-1-schnell',
        width,
        height,
        sourceId: `cf-${seed}`,
        query: 'gold prosperity',
        attribution: {
          provider: 'Cloudflare AI',
          creator: 'Flux-1-schnell',
          sourcePageUrl: 'https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/',
          providerUrl: 'https://cloudflare.com',
        },
      };
    },
  });

  assert.equal(drawCalled, true);
  assert.equal(result.image.provider, 'cloudflare');
  assert.equal(result.aiProvider, 'Cloudflare Workers AI');
});

test('searchWallpaperImage returns 4 distinct suitable candidates when count: 4 is requested', async () => {
  configureStockTestEnv();
  const candidates = Array.from({ length: 12 }, (_, i) => ({
    id: 100 + i,
    width: 1080,
    height: 1920,
    url: `https://www.pexels.com/photo/candidate-${i}/`,
    photographer: `Photographer ${i}`,
    src: { original: `https://images.pexels.com/photos/${i}/original.jpeg` },
  }));

  const outcome = await searchWallpaperImage({
    queries: ['sacred geometry pattern'],
    width: 720,
    height: 1280,
    seed: 5,
    count: 4,
    engine: 'pexels',
    fetchImpl: async () => pexelsResponse(candidates),
  });

  assert.ok(outcome.results);
  assert.equal(outcome.results.length, 4);
  assert.equal(outcome.result?.imageUrl, outcome.results[0].imageUrl);

  // All 4 sourceIds must be distinct
  const uniqueIds = new Set(outcome.results.map((r) => r.sourceId));
  assert.equal(uniqueIds.size, 4);

  // All 4 imageUrls must be valid proxy URLs
  for (const item of outcome.results) {
    assert.match(item.imageUrl, /^\/api\/lucky-wallpaper\/image\?token=/);
  }
});

test('searchWallpaperImage uses stride to space out candidate selections from a single query', async () => {
  configureStockTestEnv();
  const candidates = Array.from({ length: 20 }, (_, i) => ({
    id: 200 + i,
    width: 1080,
    height: 1920,
    url: `https://www.pexels.com/photo/stride-${i}/`,
    photographer: `Photographer ${i}`,
    src: { original: `https://images.pexels.com/photos/${i}/original.jpeg` },
  }));

  const outcome = await searchWallpaperImage({
    queries: ['galaxy stars nebula'],
    width: 720,
    height: 1280,
    seed: 0,
    count: 4,
    engine: 'pexels',
    fetchImpl: async () => pexelsResponse(candidates),
  });

  assert.equal(outcome.results?.length, 4);
  const ids = outcome.results.map((r) => Number(r.sourceId));
  // stride = Math.floor(20 / 4) = 5 -> indices: 0, 5, 10, 15
  assert.deepEqual(ids, [200, 205, 210, 215]);
});

test('workflow returns list of 4 images in both images array and primary image', async () => {
  const fakeCandidates = Array.from({ length: 4 }, (_, i) => ({
    ...fakeImage(`query-${i}`),
    imageUrl: `/api/lucky-wallpaper/image?token=test_${i}`,
    sourceId: `source_${i}`,
  }));

  const result = await findWallpaperWithAiKeywords({
    input: { lifePathNumber: 7 },
    width: 720,
    height: 1280,
    seed: 42,
    count: 4,
  }, {
    generateKeywords: async () => ({
      queries: ['mystical mountain horizon'],
      source: 'ai',
      round: 1,
      aiProvider: 'Test AI',
      aiModel: 'test-model',
    }),
    searchImages: async () => ({
      result: fakeCandidates[0],
      results: fakeCandidates,
      attemptedQueries: ['mystical mountain horizon'],
      failedProviders: [],
      hadSuccessfulResponse: true,
    }),
    fallbackQueries: () => ['fallback queries'],
  });

  assert.equal(result.images.length, 4);
  assert.equal(result.image.imageUrl, fakeCandidates[0].imageUrl);
  assert.equal(result.images[0].imageUrl, fakeCandidates[0].imageUrl);
  assert.equal(result.images[3].imageUrl, fakeCandidates[3].imageUrl);
});

