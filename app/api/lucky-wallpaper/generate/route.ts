import { NextRequest, NextResponse } from 'next/server';
import { buildLuckyWallpaperPrompt } from '@/lib/lucky-wallpaper/prompt-builder';
import { findWallpaperWithAiKeywords } from '@/lib/lucky-wallpaper/wallpaper-workflow';
import { NUMEROLOGY_AESTHETICS_MAP } from '@/lib/lucky-wallpaper/constants';
import { commitRequestAccess, getRequestAccess, releaseRequestAccess, type RequestAccess } from '@/lib/billing/access';
import { readJsonBody, requestLimitResponse } from '@/lib/security/request';
import { wallpaperRequestSchema, type WallpaperRequest } from '@/lib/security/schemas';
import { apiCorsHeaders } from '@/lib/security/cors';
import { calculateAiCostUsd } from '@/lib/usage/ai-cost';
import { recordActualAiUsage } from '@/lib/usage/quota-service';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

// Expo Web runs on a different origin while developing, so it sends a
// preflight request before the JSON POST. Native clients do not need this,
// but responding here keeps the shared endpoint usable on every app target.
export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: apiCorsHeaders(request) });
}

export async function POST(req: NextRequest) {
  let access: RequestAccess | null = null;
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
      count: requestedCount,
    } = body;

    const reservation = await getRequestAccess(req, 'wallpaper', body.requestId);
    if (reservation instanceof Response) return reservation;
    access = reservation;

    const targetCount = requestedCount !== undefined
      ? Math.max(1, Math.min(8, Number(requestedCount) || 4))
      : 4;

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
      count: targetCount,
      deadlineAt: Date.now() + 40_000,
    });
    const images = workflow.images && workflow.images.length > 0
      ? workflow.images
      : (workflow.image ? [workflow.image] : []);
    const primaryImage = images[0] || workflow.image;

    const committed = await commitRequestAccess(access, {
      route: '/api/lucky-wallpaper/generate',
      provider: workflow.aiProvider ? `${workflow.aiProvider} + ${primaryImage.provider}` : `rules + ${primaryImage.provider}`,
      imageCount: images.length,
    });
    if (workflow.aiUsage.length) {
      const inputTokens = workflow.aiUsage.reduce((total, event) => total + (event.inputTokens || 0), 0) || undefined;
      const outputTokens = workflow.aiUsage.reduce((total, event) => total + (event.outputTokens || 0), 0) || undefined;
      const costUsd = workflow.aiUsage.reduce((total, event) => total + (calculateAiCostUsd(event) || 0), 0) || undefined;
      await recordActualAiUsage({
        reservation: access,
        route: '/api/lucky-wallpaper/generate',
        provider: Array.from(new Set(workflow.aiUsage.map((event) => event.provider))).join('+'),
        model: Array.from(new Set(workflow.aiUsage.map((event) => event.model))).join('+'),
        inputTokens,
        outputTokens,
        costUsd,
      });
    }

    const aesthetics = NUMEROLOGY_AESTHETICS_MAP[plan.lifePathNumber] || NUMEROLOGY_AESTHETICS_MAP[1];

    return NextResponse.json({
      success: true,
      imageUrl: primaryImage.imageUrl,
      imageUrls: images.map((img) => img.imageUrl),
      images: images.map((img) => ({
        imageUrl: img.imageUrl,
        seed: img.seed,
        provider: img.provider,
        model: img.model,
        sourceId: img.sourceId,
        query: img.query,
        attribution: img.attribution,
      })),
      seed: primaryImage.seed,
      provider: primaryImage.provider,
      model: primaryImage.model,
      prompt: primaryImage.query,
      searchQuery: primaryImage.query,
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
      isAIGenerated: primaryImage.provider === 'cloudflare',
      keywordSource: workflow.keywordSource,
      keywordRound: workflow.keywordRound,
      aiProvider: workflow.aiProvider,
      aiModel: workflow.aiModel,
      imageProvider: primaryImage.provider,
      imageModel: primaryImage.model,
      sourceId: primaryImage.sourceId,
      attribution: primaryImage.attribution,
      plan: access.plan,
      remaining: committed.remaining,
    }, { headers: apiCorsHeaders(req) });

  } catch (error: any) {
    if (access) await releaseRequestAccess(access, 'wallpaper_generation_failed');
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
      { status: 500, headers: apiCorsHeaders(req) }
    );
  }
}
