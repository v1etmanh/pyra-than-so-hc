// -*- coding: utf-8 -*-
import {
  NUMEROLOGY_AESTHETICS_MAP,
  WALLPAPER_STYLES,
  INTENTION_OPTIONS,
  DEVICE_ASPECT_RATIOS,
} from './constants.ts';
import type {
  NumberAesthetics,
  StylePreset,
  IntentionOption,
  DeviceAspectRatio,
} from './constants.ts';

export interface PromptBuilderInput {
  lifePathNumber: number;
  personalDay?: number;
  personalYear?: number;
  intentionId?: string;
  styleId?: string;
  deviceType?: string;
  fullName?: string;
  customWish?: string;
}

export interface GeneratedWallpaperPlan {
  prompt: string;
  negativePrompt: string;
  explanation_vi: string;
  explanation_en: string;
  affirmation_vi: string;
  affirmation_en: string;
  luckyColors_vi: string[];
  luckyColors_en: string[];
  lifePathNumber: number;
  personalDay: number;
  style: StylePreset;
  intention: IntentionOption;
  device: DeviceAspectRatio;
  width: number;
  height: number;
}

const STYLE_SEARCH_TERMS: Record<string, string> = {
  sacred_geometry: 'sacred geometry cosmic abstract',
  luxury_gold_3d: 'gold luxury abstract texture',
  ethereal_minimalist: 'minimal zen calm nature',
  cyberpunk_neon: 'neon futuristic abstract',
  watercolor_nature: 'watercolor botanical nature',
  tarot_editorial: 'mystical celestial vintage',
};

const INTENTION_SEARCH_TERMS: Record<string, string> = {
  wealth: 'gold abundance prosperity',
  love: 'romantic rose flowers',
  career: 'mountain sunrise success',
  peace: 'tranquil lake lotus',
  creativity: 'colorful abstract art',
  protection: 'forest mountains light',
};

const NUMBER_SEARCH_TERMS: Record<number, string> = {
  1: 'sunrise golden light',
  2: 'moon reflective lake',
  3: 'colorful blooming flowers',
  4: 'stone architecture mountain',
  5: 'aurora open sky',
  6: 'rose garden soft light',
  7: 'night sky lotus',
  8: 'gold luxury dark',
  9: 'sunset radiant horizon',
  11: 'celestial stars light',
  22: 'grand architecture city',
  33: 'lotus tree nature',
};

export function buildWallpaperSearchQueries(input: PromptBuilderInput): string[] {
  const intention = INTENTION_SEARCH_TERMS[input.intentionId || 'wealth'] || INTENTION_SEARCH_TERMS.wealth;
  const style = STYLE_SEARCH_TERMS[input.styleId || 'sacred_geometry'] || STYLE_SEARCH_TERMS.sacred_geometry;
  const number = NUMBER_SEARCH_TERMS[Number(input.lifePathNumber) || 1] || NUMBER_SEARCH_TERMS[1];
  const customWish = input.customWish?.replace(/[^a-zA-Z0-9À-ỹ\s-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 48);

  const queries = [
    customWish ? `${customWish} ${intention} ${style}` : '',
    `${intention} ${style} ${number}`,
    `${intention} ${number}`,
    `${style} ${number}`,
    `${intention} ${style}`,
    `${number} nature background`,
    `${style} abstract background`,
  ].filter(Boolean);

  return Array.from(new Set(queries)).slice(0, 6);
}

export function buildLuckyWallpaperPrompt(input: PromptBuilderInput): GeneratedWallpaperPlan {
  const lpNum = input.lifePathNumber || 1;
  const dayNum = input.personalDay || 1;

  // 1. Get Number Aesthetics
  const lpAesthetics: NumberAesthetics =
    NUMEROLOGY_AESTHETICS_MAP[lpNum] || NUMEROLOGY_AESTHETICS_MAP[1];
  const dayAesthetics: NumberAesthetics =
    NUMEROLOGY_AESTHETICS_MAP[dayNum] || NUMEROLOGY_AESTHETICS_MAP[1];

  // 2. Get Style Preset
  const style =
    WALLPAPER_STYLES.find((s) => s.id === input.styleId) || WALLPAPER_STYLES[0];

  // 3. Get Intention
  const intention =
    INTENTION_OPTIONS.find((i) => i.id === input.intentionId) || INTENTION_OPTIONS[0];

  // 4. Get Device Aspect Ratio
  const device =
    DEVICE_ASPECT_RATIOS.find((d) => d.id === input.deviceType) || DEVICE_ASPECT_RATIOS[0];

  // Combine Lucky Colors
  const combinedColors_en = Array.from(
    new Set([...dayAesthetics.primaryColors_en, ...lpAesthetics.primaryColors_en])
  );
  const combinedColors_vi = Array.from(
    new Set([...dayAesthetics.primaryColors_vi, ...lpAesthetics.primaryColors_vi])
  );
  const colorString_en = combinedColors_en.join(', ');

  // Symbols and motifs
  const symbols_en = `${lpAesthetics.sacredSymbol_en}, ${dayAesthetics.keywords_en.join(', ')}`;

  // Custom wish touch
  const customWishPart = input.customWish?.trim()
    ? `, infused with ${input.customWish.trim()}`
    : '';

  // Prompt Construction for FLUX / SD
  const prompt = [
    `Masterpiece digital wallpaper artwork, ${style.name_en} aesthetic.`,
    `Central subject: Sacred numerological energy manifestation of Number ${lpNum} and Day ${dayNum}, featuring ${symbols_en}${customWishPart}.`,
    `Intention and aura: ${intention.prompt_keywords}.`,
    `Color palette: Harmonized radiant ${colorString_en}, luminous volumetric glow, ethereal rim lighting.`,
    `Atmosphere and details: ${style.prompt_modifiers}, deep contrast, crystalline reflections, subtle cosmic stardust, majestic flow of energy.`,
    `Clean centered composition, 8k resolution, ultra-detailed, artistic perfection, wallpaper quality, no text, no watermark, no human face distort.`
  ].join(' ');

  const negativePrompt =
    'blurry, low quality, distorted, deformed, text, watermark, signature, ugly, grain, lowres, oversaturated, pixelated, bad proportions, bad anatomy, cropped';

  // Numerological Explanations
  const explanation_vi = `Hình nền này được kiến tạo riêng cho bạn bằng cách hội tụ năng lượng Số chủ đạo ${lpNum} (${lpAesthetics.name_vi}) cùng nhịp điệu Ngày cá nhân ${dayNum} (${dayAesthetics.name_vi}). Với sắc màu may mắn chủ đạo là ${combinedColors_vi.slice(0, 3).join(', ')}, bức tranh kích hoạt trường năng lượng "${intention.name_vi}", hỗ trợ bạn duy trì sự vững tâm, thu hút phước lành và bứt phá mục tiêu hôm nay.`;

  const explanation_en = `This lucky wallpaper is personalized by aligning your Life Path Number ${lpNum} (${lpAesthetics.name_en}) with Personal Day ${dayNum} (${dayAesthetics.name_en}). Radiating in your lucky palette of ${combinedColors_en.slice(0, 3).join(', ')}, it activates the energetic vibration of "${intention.name_en}", protecting your mindset and inviting positive breakthroughs today.`;

  return {
    prompt,
    negativePrompt,
    explanation_vi,
    explanation_en,
    affirmation_vi: intention.affirmation_vi,
    affirmation_en: intention.affirmation_en,
    luckyColors_vi: combinedColors_vi,
    luckyColors_en: combinedColors_en,
    lifePathNumber: lpNum,
    personalDay: dayNum,
    style,
    intention,
    device,
    width: device.width,
    height: device.height,
  };
}
