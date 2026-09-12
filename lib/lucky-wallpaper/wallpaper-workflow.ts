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
  const attemptedQueries: string[] = [];
  const failedProviders = new Set<WallpaperImageProvider>();
  let anySuccessfulStockResponse = false;

  const search = async (queries: string[]): Promise<ImageGenerationResult | null> => {
    if (queries.length === 0 || Date.now() >= deadlineAt) return null;
    const outcome = await dependencies.searchImages({
      queries,
      width: options.width,
      height: options.height,
      seed: options.seed,
      engine: options.engine,
      excludedProviders: Array.from(failedProviders),
      deadlineAt,
    });
    attemptedQueries.push(...outcome.attemptedQueries);
    mergeProviders(failedProviders, outcome.failedProviders);
    anySuccessfulStockResponse ||= outcome.hadSuccessfulResponse;
    return outcome.result;
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
    const fallbackImage = await search(dependencies.fallbackQueries(options.input));
    if (fallbackImage) {
      return { image: fallbackImage, keywordSource: 'fallback', keywordRound: 0 };
    }
    const cfFallback = await tryCloudflareFallback();
    if (cfFallback) return cfFallback;

    if (!anySuccessfulStockResponse) {
      throw new Error('Các nguồn ảnh hiện không phản hồi. Vui lòng thử lại sau.');
    }
    throw new Error('Không tìm thấy ảnh phù hợp lúc này. Vui lòng thử lại với phong cách khác.');
  }

  const firstImage = await search(firstBatch.queries);
  if (firstImage) return resultFromAi(firstImage, firstBatch);
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
    const secondImage = await search(secondBatch.queries);
    if (secondImage) return resultFromAi(secondImage, secondBatch);
  }

  const fallback = unseenQueries(dependencies.fallbackQueries(options.input), attemptedQueries);
  const fallbackImage = await search(fallback);
  if (fallbackImage) {
    return { image: fallbackImage, keywordSource: 'fallback', keywordRound: 0 };
  }

  const cfFallback = await tryCloudflareFallback();
  if (cfFallback) return cfFallback;

  if (!anySuccessfulStockResponse) {
    throw new Error('Các nguồn ảnh hiện không phản hồi. Vui lòng thử lại sau.');
  }
  throw new Error('AI đã thử nhiều nhóm từ khóa nhưng chưa tìm được ảnh phù hợp. Vui lòng đổi phong cách hoặc mong muốn.');
}

function resultFromAi(
  image: ImageGenerationResult,
  batch: WallpaperKeywordBatch
): WallpaperWorkflowResult {
  return {
    image,
    keywordSource: 'ai',
    keywordRound: batch.round,
    aiProvider: batch.aiProvider,
    aiModel: batch.aiModel,
  };
}
