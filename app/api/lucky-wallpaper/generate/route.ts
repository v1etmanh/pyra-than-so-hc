import { NextRequest, NextResponse } from 'next/server';
import { synthesizeSacredWallpaperPrompt } from '@/lib/lucky-wallpaper/ai-prompt-synthesizer';
import { generateWallpaperImage } from '@/lib/lucky-wallpaper/image-service';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
    } = body;

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

    // 2. Render the artwork with the configured image engine.
    // Chat models above only create the visual direction; they do not render pixels.
    const imageResult = await generateWallpaperImage({
      prompt: plan.visualPrompt,
      width: plan.width,
      height: plan.height,
      seed,
      saveToDisk,
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
    });

  } catch (error: any) {
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
