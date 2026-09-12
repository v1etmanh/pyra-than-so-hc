import {
  generateWallpaperKeywordBatch,
  type WallpaperKeywordBatch,
} from './keyword-service.ts';
import {
  searchWallpaperImage,
  type GenerateImageOptions,
  type ImageGenerationResult,
  type WallpaperImageProvider,
  type WallpaperImageSearchOutcome,
} from './image-service.ts';
import {
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
}

const defaultDependencies: WallpaperWorkflowDependencies = {
  generateKeywords: generateWallpaperKeywordBatch,
  searchImages: searchWallpaperImage,
  fallbackQueries: buildWallpaperSearchQueries,
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

  const firstBatch = await dependencies.generateKeywords(options.input, 1, [], deadlineAt);
  if (!firstBatch) {
    const fallbackImage = await search(dependencies.fallbackQueries(options.input));
    if (fallbackImage) {
      return { image: fallbackImage, keywordSource: 'fallback', keywordRound: 0 };
    }
    if (!anySuccessfulStockResponse) {
      throw new Error('Các nguồn ảnh hiện không phản hồi. Vui lòng thử lại sau.');
    }
    throw new Error('Không tìm thấy ảnh phù hợp lúc này. Vui lòng thử lại với phong cách khác.');
  }

  const firstImage = await search(firstBatch.queries);
  if (firstImage) return resultFromAi(firstImage, firstBatch);
  if (!anySuccessfulStockResponse) {
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
