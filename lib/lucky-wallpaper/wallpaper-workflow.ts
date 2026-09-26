import {
  generateWallpaperKeywordBatch,
  type WallpaperKeywordBatch,
} from './keyword-service.ts';
import {
  generateViaCloudflare,
  searchWallpaperImage,
  type GenerateImageOptions,
  type ImageGenerationResult,
  type WallpaperImageProvider,
  type WallpaperImageSearchOutcome,
} from './image-service.ts';
import {
  buildLuckyWallpaperPrompt,
  buildWallpaperSearchQueries,
  type PromptBuilderInput,
} from './prompt-builder.ts';

export interface WallpaperWorkflowResult {
  image: ImageGenerationResult;
  images: ImageGenerationResult[];
  keywordSource: 'ai' | 'fallback';
  keywordRound: 0 | 1 | 2;
  aiProvider?: string;
  aiModel?: string;
}

export interface WallpaperWorkflowOptions {
  input: PromptBuilderInput;
  width: number;
  height: number;
  seed: number;
  engine?: GenerateImageOptions['engine'];
  deadlineAt?: number;
  count?: number;
}

export interface WallpaperWorkflowDependencies {
  generateKeywords: typeof generateWallpaperKeywordBatch;
  searchImages: (options: GenerateImageOptions) => Promise<WallpaperImageSearchOutcome>;
  fallbackQueries: typeof buildWallpaperSearchQueries;
  drawWithCloudflare?: typeof generateViaCloudflare;
}

const defaultDependencies: WallpaperWorkflowDependencies = {
  generateKeywords: generateWallpaperKeywordBatch,
  searchImages: searchWallpaperImage,
  fallbackQueries: buildWallpaperSearchQueries,
  drawWithCloudflare: generateViaCloudflare,
};

function mergeProviders(
  target: Set<WallpaperImageProvider>,
  providers: WallpaperImageProvider[]
): void {
  for (const provider of providers) target.add(provider);
}

function unseenQueries(queries: string[], attempted: string[]): string[] {
  const seen = new Set(attempted.map((query) => query.toLowerCase()));
  return queries.filter((query) => !seen.has(query.toLowerCase()));
}

export async function findWallpaperWithAiKeywords(
  options: WallpaperWorkflowOptions,
  dependencies: WallpaperWorkflowDependencies = defaultDependencies
): Promise<WallpaperWorkflowResult> {
  const deadlineAt = options.deadlineAt ?? Date.now() + 40_000;
  const targetCount = Math.max(1, Math.min(8, options.count ?? 4));
  const attemptedQueries: string[] = [];
  const failedProviders = new Set<WallpaperImageProvider>();
  let anySuccessfulStockResponse = false;

  const search = async (queries: string[]): Promise<ImageGenerationResult[]> => {
    if (queries.length === 0 || Date.now() >= deadlineAt) return [];
    const outcome = await dependencies.searchImages({
      queries,
      width: options.width,
      height: options.height,
      seed: options.seed,
      engine: options.engine,
      count: targetCount,
      excludedProviders: Array.from(failedProviders),
      deadlineAt,
    });
    attemptedQueries.push(...outcome.attemptedQueries);
    mergeProviders(failedProviders, outcome.failedProviders);
    anySuccessfulStockResponse ||= outcome.hadSuccessfulResponse;
    const list = outcome.results && outcome.results.length > 0
      ? outcome.results
      : (outcome.result ? [outcome.result] : []);
    return list;
  };

  const tryCloudflareFallback = async (): Promise<WallpaperWorkflowResult | null> => {
    if (!dependencies.drawWithCloudflare) return null;
    try {
      const plan = buildLuckyWallpaperPrompt(options.input);
      const drawnImage = await dependencies.drawWithCloudflare(
        plan.prompt,
        options.width,
        options.height,
        options.seed
      );
      if (drawnImage) {
        return {
          image: drawnImage,
          images: [drawnImage],
          keywordSource: 'ai',
          keywordRound: 0,
          aiProvider: 'Cloudflare Workers AI',
          aiModel: drawnImage.model,
        };
      }
    } catch (drawErr) {
      console.warn('[Wallpaper Workflow] Cloudflare drawing fallback failed:', drawErr);
    }
    return null;
  };

  const firstBatch = await dependencies.generateKeywords(options.input, 1, [], deadlineAt);
  if (!firstBatch) {
    const fallbackImages = await search(dependencies.fallbackQueries(options.input));
    if (fallbackImages.length > 0) {
      return { image: fallbackImages[0], images: fallbackImages, keywordSource: 'fallback', keywordRound: 0 };
    }
    const cfFallback = await tryCloudflareFallback();
    if (cfFallback) return cfFallback;

    if (!anySuccessfulStockResponse) {
      throw new Error('Các nguồn ảnh hiện không phản hồi. Vui lòng thử lại sau.');
    }
    throw new Error('Không tìm thấy ảnh phù hợp lúc này. Vui lòng thử lại với phong cách khác.');
  }

  const firstImages = await search(firstBatch.queries);
  if (firstImages.length > 0) return resultFromAi(firstImages, firstBatch);
  if (!anySuccessfulStockResponse) {
    const cfFallback = await tryCloudflareFallback();
    if (cfFallback) return cfFallback;

    throw new Error('Các nguồn ảnh hiện không phản hồi. Vui lòng thử lại sau.');
  }

  const secondBatch = await dependencies.generateKeywords(
    options.input,
    2,
    attemptedQueries,
    deadlineAt
  );
  if (secondBatch) {
    const secondImages = await search(secondBatch.queries);
    if (secondImages.length > 0) return resultFromAi(secondImages, secondBatch);
  }

  const fallback = unseenQueries(dependencies.fallbackQueries(options.input), attemptedQueries);
  const fallbackImages = await search(fallback);
  if (fallbackImages.length > 0) {
    return { image: fallbackImages[0], images: fallbackImages, keywordSource: 'fallback', keywordRound: 0 };
  }

  const cfFallback = await tryCloudflareFallback();
  if (cfFallback) return cfFallback;

  if (!anySuccessfulStockResponse) {
    throw new Error('Các nguồn ảnh hiện không phản hồi. Vui lòng thử lại sau.');
  }
  throw new Error('AI đã thử nhiều nhóm từ khóa nhưng chưa tìm được ảnh phù hợp. Vui lòng đổi phong cách hoặc mong muốn.');
}

function resultFromAi(
  images: ImageGenerationResult[],
  batch: WallpaperKeywordBatch
): WallpaperWorkflowResult {
  return {
    image: images[0],
    images,
    keywordSource: 'ai',
    keywordRound: batch.round,
    aiProvider: batch.aiProvider,
    aiModel: batch.aiModel,
  };
}
