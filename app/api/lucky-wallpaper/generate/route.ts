import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSacredWallpaperPrompt } from '@/lib/lucky-wallpaper/ai-prompt-synthesizer';
import { generateWallpaperImage } from '@/lib/lucky-wallpaper/image-service';
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
      saveToDisk = false,
      engine = 'auto',
    } = body;

    const access = await getRequestAccess(req, 'wallpaper');
    if (access instanceof Response) return access;

    // 1. AI Art Director synthesizes prompt, energy explanation, and affirmation
    const plan = await synthesizeSacredWallpaperPrompt({
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
    });

    const seed = customSeed ? Number(customSeed) : Math.floor(Math.random() * 10000000);

    // 2. Render the artwork with the configured image engine (Cloudflare Workers AI -> Fallback Pollinations.ai)
    const imageResult = await generateWallpaperImage({
      prompt: plan.visualPrompt,
      width: plan.width,
      height: plan.height,
      seed,
      engine,
      saveToDisk,
    });
    recordAiUsage({
      identity: access.identity,
      plan: access.plan,
      feature: 'wallpaper',
      route: '/api/lucky-wallpaper/generate',
      provider: imageResult.provider,
      estimatedCostUsd: Number(process.env.NUMINA_ESTIMATED_IMAGE_COST_USD || 0)
    });

    return NextResponse.json({
      success: true,
      imageUrl: imageResult.imageUrl,
      seed: imageResult.seed,
      provider: imageResult.provider,
      model: imageResult.model,
      prompt: plan.visualPrompt,
      negativePrompt: plan.negativePrompt,
      explanation_vi: plan.explanation_vi,
      explanation_en: plan.explanation_en,
      affirmation_vi: plan.affirmation_vi,
      affirmation_en: plan.affirmation_en,
      luckyColors_vi: plan.luckyColors_vi,
      luckyColors_en: plan.luckyColors_en,
      sacredSymbols: plan.sacredSymbols,
      style: plan.style,
      intention: plan.intention,
      device: plan.device,
      lifePathNumber: plan.lifePathNumber,
      personalDay: plan.personalDay,
      isAIGenerated: plan.isAIGenerated,
      aiProvider: plan.aiProvider,
      aiModel: plan.aiModel,
      imageProvider: imageResult.provider,
      imageModel: imageResult.model,
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
