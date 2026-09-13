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
  cosmic_celestial: 'deep space nebula galaxy stars',
  minimalist_clean: 'clean minimal abstract background',
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

const VIETNAMESE_WISH_DICTIONARY: [string, string][] = [
  ['siêu nhân', 'superhero warrior armor'],
  ['sieu nhan', 'superhero warrior armor'],
  ['anime', 'anime style illustration'],
  ['hoạt hình', 'cartoon animation character'],
  ['hoat hinh', 'cartoon animation character'],
  ['người máy', 'futuristic cyborg robot'],
  ['nguoi may', 'futuristic cyborg robot'],
  ['robot', 'futuristic robot'],
  ['chiến binh', 'epic warrior hero'],
  ['chien binh', 'epic warrior hero'],
  ['rồng', 'mythical dragon fantasy'],
  ['rong', 'mythical dragon fantasy'],
  ['phượng hoàng', 'phoenix fire bird fantasy'],
  ['phuong hoang', 'phoenix fire bird fantasy'],
  ['hoa sen', 'sacred lotus flower'],
  ['hoa hồng', 'romantic blooming roses'],
  ['hoa hong', 'romantic blooming roses'],
  ['mèo', 'cute aesthetic cat'],
  ['meo', 'cute aesthetic cat'],
  ['chó', 'faithful dog pet'],
  ['cho', 'faithful dog pet'],
  ['sư tử', 'majestic golden lion'],
  ['su tu', 'majestic golden lion'],
  ['hổ', 'powerful majestic tiger'],
  ['ho', 'powerful majestic tiger'],
  ['đại bàng', 'soaring majestic eagle'],
  ['dai bang', 'soaring majestic eagle'],
  ['sói', 'mystical lone wolf'],
  ['soi', 'mystical lone wolf'],
  ['xe hơi', 'modern luxury supercar'],
  ['xe hoi', 'modern luxury supercar'],
  ['siêu xe', 'futuristic supercar'],
  ['sieu xe', 'futuristic supercar'],
  ['ô tô', 'modern sports car'],
  ['o to', 'modern sports car'],
  ['vũ trụ', 'deep cosmic galaxy stars'],
  ['vu tru', 'deep cosmic galaxy stars'],
  ['thiên hà', 'cosmic nebula galaxy'],
  ['thien ha', 'cosmic nebula galaxy'],
  ['mặt trời', 'radiant golden sun sunrise'],
  ['mat troi', 'radiant golden sun sunrise'],
  ['mặt trăng', 'mystical luminous moon'],
  ['mat trang', 'mystical luminous moon'],
  ['biển', 'tropical blue ocean waves'],
  ['bien', 'tropical blue ocean waves'],
  ['núi', 'majestic mountain peak nature'],
  ['nui', 'majestic mountain peak nature'],
  ['thác nước', 'tranquil waterfall landscape'],
  ['thac nuoc', 'tranquil waterfall landscape'],
  ['tiền', 'gold coins wealth abundance'],
  ['tien', 'gold coins wealth abundance'],
  ['vàng', 'golden luxury treasure'],
  ['vang', 'golden luxury treasure'],
  ['tài lộc', 'prosperity wealth abundance'],
  ['tai loc', 'prosperity wealth abundance'],
  ['bình an', 'zen tranquil meditation peace'],
  ['binh an', 'zen tranquil meditation peace'],
  ['tình yêu', 'romantic gentle love hearts'],
  ['tinh yeu', 'romantic gentle love hearts'],
];

function translateWishToSearchTerms(wish: string): string {
  let result = wish.toLowerCase().trim();

  for (const [vi, en] of VIETNAMESE_WISH_DICTIONARY) {
    if (result.includes(vi)) {
      result = result.replace(new RegExp(vi, 'g'), ` ${en} `);
    }
  }

  return result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildWallpaperSearchQueries(input: PromptBuilderInput): string[] {
  const intention = INTENTION_SEARCH_TERMS[input.intentionId || 'wealth'] || INTENTION_SEARCH_TERMS.wealth;
  const style = STYLE_SEARCH_TERMS[input.styleId || 'sacred_geometry'] || STYLE_SEARCH_TERMS.sacred_geometry;
  const number = NUMBER_SEARCH_TERMS[Number(input.lifePathNumber) || 1] || NUMBER_SEARCH_TERMS[1];

  const rawWish = input.customWish?.trim() || '';
  const translatedWish = rawWish ? translateWishToSearchTerms(rawWish) : '';

  const queries: string[] = [];
  if (translatedWish) {
    const wishWords = translatedWish.split(' ').filter(Boolean).slice(0, 4).join(' ');
    if (wishWords) {
      queries.push(`${wishWords} wallpaper background`);
      queries.push(`${wishWords} ${style.split(' ').slice(0, 2).join(' ')}`);
      queries.push(`${wishWords} illustration art`);
      queries.push(`${wishWords} character art`);
      queries.push(`${wishWords} ${intention.split(' ').slice(0, 2).join(' ')}`);
      queries.push(`${wishWords} poster`);
    }
  } else {
    queries.push(`${intention} ${style} ${number}`);
    queries.push(`${intention} ${number}`);
    queries.push(`${style} ${number}`);
    queries.push(`${intention} ${style}`);
    queries.push(`${number} nature background`);
    queries.push(`${style} abstract background`);
  }

  return Array.from(new Set(queries.map((q) => q.replace(/\s+/g, ' ').trim()))).filter(Boolean).slice(0, 6);
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

  // Custom wish touch - elevated to primary subject when present
  const rawWish = input.customWish?.trim() || '';
  const translatedWish = rawWish ? translateWishToSearchTerms(rawWish) : '';

  let centralSubjectDescription = `Sacred numerological energy manifestation of Number ${lpNum} and Day ${dayNum}, featuring ${symbols_en}`;
  if (rawWish) {
    const wishSubject = translatedWish || rawWish;
    centralSubjectDescription = `${wishSubject} (${rawWish}), harmonized with sacred numerological energy of Number ${lpNum} and Day ${dayNum}, featuring ${symbols_en}`;
  }

  // Prompt Construction for FLUX / SD
  const prompt = [
    `Masterpiece digital wallpaper artwork, ${style.name_en} aesthetic.`,
    `Central subject: ${centralSubjectDescription}.`,
    `Intention and aura: ${intention.prompt_keywords}.`,
    `Color palette: Harmonized radiant ${colorString_en}, luminous volumetric glow, ethereal rim lighting.`,
    `Atmosphere and details: ${style.prompt_modifiers}, deep contrast, crystalline reflections, subtle cosmic stardust, majestic flow of energy.`,
    `Clean centered composition, 8k resolution, ultra-detailed, artistic perfection, wallpaper quality, no text, no watermark, no human face distort.`
  ].join(' ');

  const negativePrompt =
    'blurry, low quality, distorted, deformed, text, watermark, signature, ugly, grain, lowres, oversaturated, pixelated, bad proportions, bad anatomy, cropped';

  // Numerological Explanations
  const customWishNoticeVi = input.customWish?.trim()
    ? ` Hình ảnh được kết tinh theo tâm nguyện: "${input.customWish.trim()}", hòa quyện hài hòa cùng thần thái phong cách ${style.name_vi}.`
    : '';
  const explanation_vi = `Hình nền này được kiến tạo riêng cho bạn bằng cách hội tụ năng lượng Số chủ đạo ${lpNum} (${lpAesthetics.name_vi}) cùng nhịp điệu Ngày cá nhân ${dayNum} (${dayAesthetics.name_vi}). Với sắc màu may mắn chủ đạo là ${combinedColors_vi.slice(0, 3).join(', ')}, bức tranh kích hoạt trường năng lượng "${intention.name_vi}", hỗ trợ bạn duy trì sự vững tâm, thu hút phước lành và bứt phá mục tiêu hôm nay.${customWishNoticeVi}`;

  const customWishNoticeEn = input.customWish?.trim()
    ? ` Visual theme resonates with your personal wish: "${input.customWish.trim()}", seamlessly harmonized with the ${style.name_en} aesthetic.`
    : '';
  const explanation_en = `This lucky wallpaper is personalized by aligning your Life Path Number ${lpNum} (${lpAesthetics.name_en}) with Personal Day ${dayNum} (${dayAesthetics.name_en}). Radiating in your lucky palette of ${combinedColors_en.slice(0, 3).join(', ')}, it activates the energetic vibration of "${intention.name_en}", protecting your mindset and inviting positive breakthroughs today.${customWishNoticeEn}`;

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
