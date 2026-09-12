import { NextRequest, NextResponse } from 'next/server';
import { buildLuckyWallpaperPrompt } from '@/lib/lucky-wallpaper/prompt-builder';
import { findWallpaperWithAiKeywords } from '@/lib/lucky-wallpaper/wallpaper-workflow';
import { NUMEROLOGY_AESTHETICS_MAP } from '@/lib/lucky-wallpaper/constants';
import { getRequestAccess } from '@/lib/billing/access';
import { recordAiUsage } from '@/lib/usage/usage-meter';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import { wallpaperRequestSchema, type WallpaperRequest } from '@/lib/security/schemas';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = wallpaperRequestSchema.parse(await readJsonBody<WallpaperRequest>(req, 64 * 1024));
    const {
      lifePathNumber = 1,
      destinyNumber,
      soulUrgeNumber,
      personalityNumber,
      personalDay = 1,
      personalYear,
      birthDate = '',
      intentionId = 'wealth',
      styleId = 'sacred_geometry',
      deviceType = 'mobile',
      fullName = '',
      customWish = '',
      seed: customSeed,
      engine = 'auto',
    } = body;

    const access = await getRequestAccess(req, 'wallpaper');
    if (access instanceof Response) return access;

    // Build stable numerology copy, then let AI generate concise stock-search queries.
    const input = {
      lifePathNumber: Number(lifePathNumber) || 1,
      destinyNumber,
      soulUrgeNumber,
      personalityNumber,
      personalDay: Number(personalDay) || 1,
      personalYear: personalYear ? Number(personalYear) : undefined,
      birthDate,
      intentionId,
      styleId,
      deviceType,
      fullName,
      customWish,
    };
    const plan = buildLuckyWallpaperPrompt(input);

    const seed = customSeed ? Number(customSeed) : Math.floor(Math.random() * 10000000);

    const workflow = await findWallpaperWithAiKeywords({
      input,
      width: plan.width,
      height: plan.height,
      seed,
      engine,
      deadlineAt: Date.now() + 40_000,
    });
    const imageResult = workflow.image;
    recordAiUsage({
      identity: access.identity,
      plan: access.plan,
      feature: 'wallpaper',
      route: '/api/lucky-wallpaper/generate',
      provider: workflow.aiProvider
        ? `${workflow.aiProvider} + ${imageResult.provider}`
        : `rules + ${imageResult.provider}`,
      estimatedCostUsd: Number(
        process.env.NUMINA_ESTIMATED_WALLPAPER_COST_USD ||
        process.env.NUMINA_ESTIMATED_IMAGE_COST_USD ||
        0
      )
    });

    const aesthetics = NUMEROLOGY_AESTHETICS_MAP[plan.lifePathNumber] || NUMEROLOGY_AESTHETICS_MAP[1];

    return NextResponse.json({
      success: true,
      imageUrl: imageResult.imageUrl,
      seed: imageResult.seed,
      provider: imageResult.provider,
      model: imageResult.model,
      prompt: imageResult.query,
      searchQuery: imageResult.query,
      negativePrompt: plan.negativePrompt,
      explanation_vi: plan.explanation_vi,
      explanation_en: plan.explanation_en,
      affirmation_vi: plan.affirmation_vi,
      affirmation_en: plan.affirmation_en,
      luckyColors_vi: plan.luckyColors_vi,
      luckyColors_en: plan.luckyColors_en,
      sacredSymbols: [aesthetics.sacredSymbol_en, aesthetics.sacredSymbol_vi],
      style: plan.style,
      intention: plan.intention,
      device: plan.device,
      lifePathNumber: plan.lifePathNumber,
      personalDay: plan.personalDay,
      isAIGenerated: false,
      keywordSource: workflow.keywordSource,
      keywordRound: workflow.keywordRound,
      aiProvider: workflow.aiProvider,
      aiModel: workflow.aiModel,
      imageProvider: imageResult.provider,
      imageModel: imageResult.model,
      sourceId: imageResult.sourceId,
      attribution: imageResult.attribution,
      plan: access.plan,
      remaining: access.remaining,
    });

  } catch (error: any) {
    const limited = requestLimitResponse(error);
    if (limited) return limited;
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Invalid wallpaper request.' }, { status: 400 });
    }
    console.error('[API Lucky Wallpaper Generate Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to generate lucky wallpaper',
      },
      { status: 500 }
    );
  }
}
