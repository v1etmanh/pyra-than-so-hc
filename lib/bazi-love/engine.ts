/**
 * Bazi Love Compatibility Engine (TypeScript)
 *
 * Adapted from XiaoChu-1208/bazi-life-curves (MIT License).
 * Portions Copyright (c) 2026 XiaoChu-1208.
 * Portions Copyright (c) 2026 NUMELYRA / Pyra Than So Hoc.
 *
 * This engine calculates Four Pillars (Bazi), Five Elements distribution,
 * Day Master strength, Climate profile, Useful God (Yongshen),
 * Luck Cycles (Dayun), and multi-layer synastry compatibility.
 */

import { Solar, Lunar } from 'lunar-typescript';
import type {
  BaziCompatibilityResult,
  BaziLovePersonInput,
  BaziPillar,
  BaziPublicChart,
  CalculationSex,
  CompatibilityLayer,
  CompatibilityLayerId,
  CompatibilityNote,
  ConfidenceLevel,
  FiveElement,
  LocalizedText
} from './types.ts';

// ---------------------------------------------------------------------------
// 1. Core Tables & Constants
// ---------------------------------------------------------------------------

export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export type Gan = (typeof GAN)[number];

export const ZHI = [
  '子', '丑', '寅', '卯', '辰', '巳',
  '午', '未', '申', '酉', '戌', '亥'
] as const;
export type Zhi = (typeof ZHI)[number];

export const FIVE_ELEMENTS: FiveElement[] = ['wood', 'fire', 'earth', 'metal', 'water'];

export const CHINESE_TO_ELEMENT: Record<string, FiveElement> = {
  木: 'wood',
  火: 'fire',
  土: 'earth',
  金: 'metal',
  水: 'water'
};

export const ELEMENT_TO_CHINESE: Record<FiveElement, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水'
};

export const GAN_WUXING_ZH: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水'
};

export const GAN_YIN_YANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 乙: '阴',
  丙: '阳', 丁: '阴',
  戊: '阳', 己: '阴',
  庚: '阳', 辛: '阴',
  壬: '阳', 癸: '阴'
};

export const ZHI_WUXING_ZH: Record<string, string> = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
  申: '金', 酉: '金',
  子: '水', 亥: '水'
};

export const ZHI_HIDDEN_GAN: Record<string, string[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲']
};

export const WUXING_SHENG_ZH: Record<string, string> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木'
};

export const WUXING_KE_ZH: Record<string, string> = {
  木: '土', 火: '金', 土: '水', 金: '木', 水: '火'
};

export const WUXING_BEI_SHENG_ZH: Record<string, string> = {
  火: '木', 土: '火', 金: '土', 水: '金', 木: '水'
};

// Sino-Vietnamese and English transliterations
export const GAN_NAMES: Record<string, { vi: string; en: string }> = {
  甲: { vi: 'Giáp', en: 'Jia' },
  乙: { vi: 'Ất', en: 'Yi' },
  丙: { vi: 'Bính', en: 'Bing' },
  丁: { vi: 'Đinh', en: 'Ding' },
  戊: { vi: 'Mậu', en: 'Wu' },
  己: { vi: 'Kỷ', en: 'Ji' },
  庚: { vi: 'Canh', en: 'Geng' },
  辛: { vi: 'Tân', en: 'Xin' },
  壬: { vi: 'Nhâm', en: 'Ren' },
  癸: { vi: 'Quý', en: 'Gui' }
};

export const ZHI_NAMES: Record<string, { vi: string; en: string }> = {
  子: { vi: 'Tý', en: 'Zi' },
  丑: { vi: 'Sửu', en: 'Chou' },
  寅: { vi: 'Dần', en: 'Yin' },
  卯: { vi: 'Mão', en: 'Mao' },
  辰: { vi: 'Thìn', en: 'Chen' },
  巳: { vi: 'Tỵ', en: 'Si' },
  午: { vi: 'Ngọ', en: 'Wu' },
  未: { vi: 'Mùi', en: 'Wei' },
  申: { vi: 'Thân', en: 'Shen' },
  酉: { vi: 'Dậu', en: 'You' },
  戌: { vi: 'Tuất', en: 'Xu' },
  亥: { vi: 'Hợi', en: 'Hai' }
};

export const WUXING_NAMES: Record<string, { vi: string; en: string }> = {
  木: { vi: 'Mộc', en: 'Wood' },
  火: { vi: 'Hỏa', en: 'Fire' },
  土: { vi: 'Thổ', en: 'Earth' },
  金: { vi: 'Kim', en: 'Metal' },
  水: { vi: 'Thủy', en: 'Water' }
};

export const SHISHEN_NAMES: Record<string, { vi: string; en: string }> = {
  比肩: { vi: 'Tỷ Kiên', en: 'Friend (Bi Jian)' },
  劫财: { vi: 'Kiếp Tài', en: 'Rob Wealth (Jie Cai)' },
  食神: { vi: 'Thực Thần', en: 'Eating God (Shi Shen)' },
  伤官: { vi: 'Thương Quan', en: 'Hurting Officer (Shang Guan)' },
  偏财: { vi: 'Thiên Tài', en: 'Indirect Wealth (Pian Cai)' },
  正财: { vi: 'Chính Tài', en: 'Direct Wealth (Zheng Cai)' },
  七杀: { vi: 'Thất Sát', en: 'Seven Killings (Qi Sha)' },
  正官: { vi: 'Chính Quan', en: 'Direct Officer (Zheng Guan)' },
  偏印: { vi: 'Thiên Ấn', en: 'Indirect Resource (Pian Yin)' },
  正印: { vi: 'Chính Ấn', en: 'Direct Resource (Zheng Yin)' }
};

// Heavenly Stem Combinations (Tian Gan Wu He)
export const GAN_HE_MAP: Record<string, { hua: string; vi: string; en: string }> = {
  '甲_己': { hua: '土', vi: 'Giáp Kỷ hợp hóa Thổ (Trung Chính chi hợp)', en: 'Jia-Ji combines to Earth (Integrity Combination)' },
  '乙_庚': { hua: '金', vi: 'Ất Canh hợp hóa Kim (Nhân Nghĩa chi hợp)', en: 'Yi-Geng combines to Metal (Righteousness Combination)' },
  '丙_辛': { hua: '水', vi: 'Bính Tân hợp hóa Thủy (Uy Chế chi hợp)', en: 'Bing-Xin combines to Water (Authority Combination)' },
  '丁_壬': { hua: '木', vi: 'Đinh Nhâm hợp hóa Mộc (Nhân Thọ chi hợp)', en: 'Ding-Ren combines to Wood (Benevolence Combination)' },
  '戊_癸': { hua: '火', vi: 'Mậu Quý hợp hóa Hỏa (Vô Tình chi hợp)', en: 'Wu-Gui combines to Fire (Intensity Combination)' }
};

// Heavenly Stem Clashes (Tian Gan Xiang Chong)
export const GAN_CHONG_SET = new Set([
  '甲_庚', '庚_甲',
  '乙_辛', '辛_乙',
  '丙_壬', '壬_丙',
  '丁_癸', '癸_丁',
  '戊_甲', '甲_戊',
  '己_乙', '乙_己'
]);

// Earthly Branch Six Combinations (Zhi Liu He)
export const ZHI_LIU_HE_MAP: Record<string, { hua: string; vi: string; en: string }> = {
  '子_丑': { hua: '土', vi: 'Tý Sửu lục hợp hóa Thổ', en: 'Zi-Chou combination to Earth' },
  '寅_亥': { hua: '木', vi: 'Dần Hợi lục hợp hóa Mộc', en: 'Yin-Hai combination to Wood' },
  '卯_戌': { hua: '火', vi: 'Mão Tuất lục hợp hóa Hỏa', en: 'Mao-Xu combination to Fire' },
  '辰_酉': { hua: '金', vi: 'Thìn Dậu lục hợp hóa Kim', en: 'Chen-You combination to Metal' },
  '巳_申': { hua: '水', vi: 'Tỵ Thân lục hợp hóa Thủy', en: 'Si-Shen combination to Water' },
  '午_未': { hua: '土', vi: 'Ngọ Mùi lục hợp hóa Thổ', en: 'Wu-Wei combination to Earth' }
};

// Earthly Branch Clashes (Zhi Liu Chong)
export const ZHI_CHONG_MAP: Record<string, { vi: string; en: string }> = {
  '子_午': { vi: 'Tý Ngọ tương xung (Thủy Hỏa tương kích)', en: 'Zi-Wu clash (Water-Fire collision)' },
  '丑_未': { vi: 'Sửu Mùi tương xung (Thổ Thổ tương phá)', en: 'Chou-Wei clash (Earth-Earth friction)' },
  '寅_申': { vi: 'Dần Thân tương xung (Kim Mộc tương chiến)', en: 'Yin-Shen clash (Metal-Wood struggle)' },
  '卯_酉': { vi: 'Mão Dậu tương xung (Kim Mộc tương chiến)', en: 'Mao-You clash (Metal-Wood struggle)' },
  '辰_戌': { vi: 'Thìn Tuất tương xung (Thổ Thổ xung đột)', en: 'Chen-Xu clash (Earth-Earth turbulence)' },
  '巳_亥': { vi: 'Tỵ Hợi tương xung (Thủy Hỏa tương kích)', en: 'Si-Hai clash (Water-Fire collision)' }
};

// Earthly Branch Harm / Pierce (Zhi Xiang Hai / Chuan)
export const ZHI_HAI_SET = new Set([
  '子_未', '未_子',
  '丑_午', '午_丑',
  '寅_巳', '巳_寅',
  '卯_辰', '辰_卯',
  '申_亥', '亥_申',
  '酉_戌', '戌_酉'
]);

// Earthly Branch San He Groups
export const SAN_HE_GROUPS: Array<{ branches: string[]; hua: string; name: { vi: string; en: string } }> = [
  { branches: ['申', '子', '辰'], hua: '水', name: { vi: 'Thân Tý Thìn hợp Thủy cục', en: 'Shen-Zi-Chen Water frame' } },
  { branches: ['亥', '卯', '未'], hua: '木', name: { vi: 'Hợi Mão Mùi hợp Mộc cục', en: 'Hai-Mao-Wei Wood frame' } },
  { branches: ['寅', '午', '戌'], hua: '火', name: { vi: 'Dần Ngọ Tuất hợp Hỏa cục', en: 'Yin-Wu-Xu Fire frame' } },
  { branches: ['巳', '酉', '丑'], hua: '金', name: { vi: 'Tỵ Dậu Sửu hợp Kim cục', en: 'Si-You-Chou Metal frame' } }
];

// Peach Blossom (Tao Hua by Day Branch)
export const TAOHUA_BY_RIZHI: Record<string, string> = {
  申: '酉', 子: '酉', 辰: '酉',
  亥: '子', 卯: '子', 未: '子',
  寅: '卯', 午: '卯', 戌: '卯',
  巳: '午', 酉: '午', 丑: '午'
};

// Tian Yi Gui Ren (Nobleman by Day Stem)
export const TIANYI_BY_RIGAN: Record<string, string[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['卯', '巳'], 癸: ['卯', '巳'],
  辛: ['寅', '午']
};

export const PILLAR_NAMES = [
  { vi: 'Trụ năm', en: 'Year Pillar' },
  { vi: 'Trụ tháng', en: 'Month Pillar' },
  { vi: 'Trụ ngày', en: 'Day Pillar' },
  { vi: 'Trụ giờ', en: 'Hour Pillar' }
];

// Representative civil times for all 12 Chinese double-hours. Zi spans the
// Gregorian day boundary, so both 00:30 and 23:30 are evaluated.
export const SAMPLE_HOURS = [
  '00:30', '02:30', '04:30', '06:30', '08:30', '10:30',
  '12:30', '14:30', '16:30', '18:30', '20:30', '22:30', '23:30'
];

// ---------------------------------------------------------------------------
// 2. Ten Gods & Strength Helpers
// ---------------------------------------------------------------------------

export function calcShishen(dayGan: string, otherGan: string): string {
  const dWx = GAN_WUXING_ZH[dayGan];
  const oWx = GAN_WUXING_ZH[otherGan];
  const dYy = GAN_YIN_YANG[dayGan];
  const oYy = GAN_YIN_YANG[otherGan];
  const sameYy = dYy === oYy;

  if (dWx === oWx) return sameYy ? '比肩' : '劫财';
  if (WUXING_SHENG_ZH[dWx] === oWx) return sameYy ? '食神' : '伤官';
  if (WUXING_KE_ZH[dWx] === oWx) return sameYy ? '偏财' : '正财';
  if (WUXING_KE_ZH[oWx] === dWx) return sameYy ? '七杀' : '正官';
  if (WUXING_SHENG_ZH[oWx] === dWx) return sameYy ? '偏印' : '正印';
  return '比肩';
}

export function calcZhiShishen(dayGan: string, zhi: string): string {
  const mainGan = ZHI_HIDDEN_GAN[zhi]?.[0] || '癸';
  return calcShishen(dayGan, mainGan);
}

export interface InternalBaziChart {
  pillars: [BaziPillar, BaziPillar, BaziPillar, BaziPillar];
  dayMaster: string;
  dayMasterElement: FiveElement;
  gender: CalculationSex;
  birthYear: number;
  wuxingScores: Record<string, number>;
  wuxingRatios: Record<string, number>;
  strengthScore: number;
  strengthLabel: '强' | '弱' | '中和';
  yongshenZh: string;
  jishenZh: string;
  usefulElement: FiveElement;
  challengingElement: FiveElement;
  qiyunAge: number;
  dayunSequence: Array<{
    index: number;
    gan: string;
    zhi: string;
    startYear: number;
    endYear: number;
  }>;
  timeKnown: boolean;
}

export function calcWuxingCount(pillars: BaziPillar[]): Record<string, number> {
  const counts: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (let i = 0; i < pillars.length; i++) {
    const p = pillars[i];
    counts[GAN_WUXING_ZH[p.gan]] = (counts[GAN_WUXING_ZH[p.gan]] || 0) + 1.0;
    const posWeight = i === 1 ? 3.0 : 2.0;
    const hidden = ZHI_HIDDEN_GAN[p.zhi] || [];
    for (let j = 0; j < hidden.length; j++) {
      const hg = hidden[j];
      const tierWeight = j === 0 ? 1.0 : 0.3;
      counts[GAN_WUXING_ZH[hg]] = (counts[GAN_WUXING_ZH[hg]] || 0) + posWeight * tierWeight;
    }
  }
  return counts;
}

export function calcDayMasterStrength(pillars: BaziPillar[]): {
  score: number;
  label: '强' | '弱' | '中和';
  same: number;
  sheng: number;
} {
  const dayGan = pillars[2].gan;
  const dWx = GAN_WUXING_ZH[dayGan];

  let same = 0;
  let sheng = 0;
  let xie = 0;
  let ke = 0;
  let kewo = 0;

  const countElement = (wx: string, weight: number) => {
    if (wx === dWx) same += weight;
    else if (WUXING_SHENG_ZH[wx] === dWx) sheng += weight;
    else if (WUXING_SHENG_ZH[dWx] === wx) xie += weight;
    else if (WUXING_KE_ZH[dWx] === wx) ke += weight;
    else if (WUXING_KE_ZH[wx] === dWx) kewo += weight;
  };

  for (let i = 0; i < pillars.length; i++) {
    if (i !== 2) countElement(GAN_WUXING_ZH[pillars[i].gan], 1.0);
  }

  const rootTierWeights = [1.0, 0.5, 0.2];
  for (let i = 0; i < pillars.length; i++) {
    const posWeight = i === 1 ? 1.5 : 1.0;
    const hidden = ZHI_HIDDEN_GAN[pillars[i].zhi] || [];
    for (let j = 0; j < hidden.length; j++) {
      const tierW = (rootTierWeights[j] ?? 0.0) * 2.0;
      countElement(GAN_WUXING_ZH[hidden[j]], posWeight * tierW);
    }
  }

  const monthZhi = pillars[1].zhi;
  const monthMainWx = GAN_WUXING_ZH[ZHI_HIDDEN_GAN[monthZhi][0]];
  const inSeason = monthMainWx === dWx || WUXING_SHENG_ZH[monthMainWx] === dWx;
  const seasonBonus = inSeason ? 15 : -10;

  const support = same + sheng;
  const consume = xie + ke + kewo;
  let score = (support - consume) * 5 + seasonBonus;
  score = Math.max(-100, Math.min(100, score));

  let label: '强' | '弱' | '中和';
  if (score > 15) label = '强';
  else if (score < -15) label = '弱';
  else label = '中和';

  return { score: Math.round(score * 10) / 10, label, same, sheng };
}

export function calcClimateProfile(pillars: BaziPillar[]): { label: string; total: number } {
  const DRY_GAN = new Set(['丙', '丁', '戊', '己', '庚', '辛']);
  const WET_GAN = new Set(['壬', '癸']);
  const DRY_ZHI = new Set(['巳', '午', '未', '戌']);
  const WET_ZHI = new Set(['亥', '子', '丑', '辰']);

  let gScore = 0;
  for (let i = 0; i < pillars.length; i++) {
    const w = i === 1 || i === 2 ? 2.0 : 1.5;
    const g = pillars[i].gan;
    if (DRY_GAN.has(g)) {
      const pt = g === '丙' || g === '丁' ? 2 : 1;
      gScore += pt * w;
    } else if (WET_GAN.has(g)) {
      gScore -= 2 * w;
    }
  }

  let zScore = 0;
  for (let i = 0; i < pillars.length; i++) {
    const w = i === 1 ? 2.0 : 1.5;
    const z = pillars[i].zhi;
    if (DRY_ZHI.has(z)) {
      const pt = z === '午' || z === '未' ? 2 : 1;
      zScore += pt * w;
    } else if (WET_ZHI.has(z)) {
      const pt = z === '子' || z === '丑' ? 2 : 1;
      zScore -= pt * w;
    }
  }

  const total = Math.round((0.6 * gScore + 0.4 * zScore) * 10) / 10;
  const extremeDry = gScore >= 6 && zScore < -2;
  const extremeWet = gScore <= -6 && zScore > 2;

  let label = '中和';
  if (extremeDry) label = '外燥内湿';
  else if (extremeWet) label = '外湿内燥';
  else if (total >= 4) label = '燥实';
  else if (total >= 1.5) label = '偏燥';
  else if (total > -1.5) label = '中和';
  else if (total > -4) label = '偏湿';
  else label = '寒湿';

  return { label, total };
}

export function selectYongshen(
  pillars: BaziPillar[],
  strength: { score: number; label: '强' | '弱' | '中和' }
): { yongshen: string; jishen: string } {
  const climate = calcClimateProfile(pillars);
  const dayGan = pillars[2].gan;
  const dWx = GAN_WUXING_ZH[dayGan];

  if (climate.label === '燥实' || climate.label === '外燥内湿') {
    return { yongshen: '水', jishen: '火' };
  }
  if (climate.label === '寒湿' || climate.label === '外湿内燥') {
    return { yongshen: '火', jishen: '水' };
  }

  const wxOrder = ['木', '火', '土', '金', '水'];
  const counts = calcWuxingCount(pillars);

  let yongshen = '水';
  let jishen = '火';

  if (strength.label === '强') {
    const candidates: string[] = [];
    for (const wx of wxOrder) {
      if (WUXING_KE_ZH[wx] === dWx) candidates.push(wx); // Guan / Sha
      else if (WUXING_KE_ZH[dWx] === wx) candidates.push(wx); // Cai
      else if (WUXING_SHENG_ZH[dWx] === wx) candidates.push(wx); // Shi / Shang
    }
    candidates.sort((x, y) => (counts[x] || 0) - (counts[y] || 0));
    yongshen = candidates[0] || '水';
    for (const wx of wxOrder) {
      if (wx === dWx || WUXING_SHENG_ZH[wx] === dWx) {
        jishen = wx;
        break;
      }
    }
  } else if (strength.label === '弱') {
    const candidates: string[] = [];
    for (const wx of wxOrder) {
      if (WUXING_SHENG_ZH[wx] === dWx) candidates.push(wx); // Yin
      else if (wx === dWx) candidates.push(wx); // Bi
    }
    candidates.sort((x, y) => (counts[x] || 0) - (counts[y] || 0));
    yongshen = candidates[0] || '木';
    for (const wx of wxOrder) {
      if (WUXING_KE_ZH[wx] === dWx) {
        jishen = wx;
        break;
      }
    }
  } else {
    // Zhong he
    const monthZhi = pillars[1].zhi;
    const seasonMap: Record<string, string> = {
      寅: '春', 卯: '春', 辰: '春',
      巳: '夏', 午: '夏', 未: '夏',
      申: '秋', 酉: '秋', 戌: '秋',
      亥: '冬', 子: '冬', 丑: '冬'
    };
    const s = seasonMap[monthZhi] || '春';
    const climateMap: Record<string, string> = { 春: '金', 夏: '水', 秋: '木', 冬: '火' };
    const antiClimate: Record<string, string> = { 春: '土', 夏: '火', 秋: '金', 冬: '水' };
    yongshen = climateMap[s] || '水';
    jishen = antiClimate[s] || '火';
  }

  if (climate.label === '偏燥' && (jishen === '木' || jishen === '土' || jishen === '金')) {
    jishen = '火';
  } else if (climate.label === '偏湿' && (jishen === '木' || jishen === '土' || jishen === '金')) {
    jishen = '水';
  }

  return { yongshen, jishen };
}

export function calcDayunSequence(
  pillars: BaziPillar[],
  gender: CalculationSex,
  birthYear: number,
  qiyunAge = 8,
  nYun = 8
): Array<{ index: number; gan: string; zhi: string; startYear: number; endYear: number }> {
  const yearGan = pillars[0].gan;
  const monthGan = pillars[1].gan;
  const monthZhi = pillars[1].zhi;

  const yang = GAN_YIN_YANG[yearGan] === '阳';
  const male = gender === 'male';
  const forward = (yang && male) || (!yang && !male);

  const gIdx = GAN.indexOf(monthGan as Gan);
  const zIdx = ZHI.indexOf(monthZhi as Zhi);

  const seq = [];
  for (let i = 0; i < nYun; i++) {
    const step = i + 1;
    let ng: string;
    let nz: string;
    if (forward) {
      ng = GAN[(gIdx + step) % 10];
      nz = ZHI[(zIdx + step) % 12];
    } else {
      ng = GAN[(gIdx - step + 100) % 10];
      nz = ZHI[(zIdx - step + 120) % 12];
    }
    const startAge = qiyunAge + i * 10;
    const startYear = birthYear + startAge;
    seq.push({
      index: i,
      gan: ng,
      zhi: nz,
      startYear,
      endYear: startYear + 9
    });
  }
  return seq;
}

// ---------------------------------------------------------------------------
// 3. Solving a Single Chart from Solar Date
// ---------------------------------------------------------------------------

export function solveSingleChart(
  person: BaziLovePersonInput,
  overrideHour?: string
): InternalBaziChart {
  const parts = person.birthDate.split('-').map(Number);
  const y = parts[0];
  const mo = parts[1];
  const da = parts[2];

  const timeStr = overrideHour || person.birthTime || '12:00';
  const timeParts = timeStr.split(':').map(Number);
  const hh = Number.isFinite(timeParts[0]) ? timeParts[0] : 12;
  const mm = Number.isFinite(timeParts[1]) ? timeParts[1] : 0;

  const solar = Solar.fromYmdHms(y, mo, da, hh, mm, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const pillars: [BaziPillar, BaziPillar, BaziPillar, BaziPillar] = [
    { gan: ec.getYearGan(), zhi: ec.getYearZhi() },
    { gan: ec.getMonthGan(), zhi: ec.getMonthZhi() },
    { gan: ec.getDayGan(), zhi: ec.getDayZhi() },
    { gan: ec.getTimeGan(), zhi: ec.getTimeZhi() }
  ];

  const dayMaster = pillars[2].gan;
  const dayMasterElement = CHINESE_TO_ELEMENT[GAN_WUXING_ZH[dayMaster]];

  let qiyunAge = 8;
  try {
    const genderInt = person.calculationSex === 'male' ? 1 : 0;
    const yun = ec.getYun(genderInt);
    qiyunAge = yun.getStartYear() || 8;
  } catch {
    qiyunAge = 8;
  }

  const strength = calcDayMasterStrength(pillars);
  const { yongshen, jishen } = selectYongshen(pillars, strength);
  const usefulElement = CHINESE_TO_ELEMENT[yongshen] || 'water';
  const challengingElement = CHINESE_TO_ELEMENT[jishen] || 'fire';

  const wuxingCounts = calcWuxingCount(pillars);
  const totalWx = Object.values(wuxingCounts).reduce((a, b) => a + b, 0) || 1.0;
  const wuxingRatios: Record<string, number> = {};
  for (const k of Object.keys(wuxingCounts)) {
    wuxingRatios[k] = Math.round((wuxingCounts[k] / totalWx) * 1000) / 1000;
  }

  const dayunSequence = calcDayunSequence(pillars, person.calculationSex, y, qiyunAge, 8);

  return {
    pillars,
    dayMaster,
    dayMasterElement,
    gender: person.calculationSex,
    birthYear: y,
    wuxingScores: wuxingCounts,
    wuxingRatios,
    strengthScore: strength.score,
    strengthLabel: strength.label,
    yongshenZh: yongshen,
    jishenZh: jishen,
    usefulElement,
    challengingElement,
    qiyunAge,
    dayunSequence,
    timeKnown: Boolean(person.birthTime && !overrideHour)
  };
}

// ---------------------------------------------------------------------------
// 4. Four Compatibility Layers Scoring (Ported from he_pan.py)
// ---------------------------------------------------------------------------

export function scoreWuxingComplement(a: InternalBaziChart, b: InternalBaziChart): {
  score: number;
  notes: CompatibilityNote[];
} {
  const notes: CompatibilityNote[] = [];
  let score = 0.0;

  const aYong = a.yongshenZh;
  const aJi = a.jishenZh;
  const bYong = b.yongshenZh;
  const bJi = b.jishenZh;

  const aWx = a.wuxingScores;
  const bWx = b.wuxingScores;
  const aTotal = Object.values(aWx).reduce((x, y) => x + y, 0) || 1.0;
  const bTotal = Object.values(bWx).reduce((x, y) => x + y, 0) || 1.0;

  // A's useful god in B
  if (aYong) {
    const ratio = (bWx[aYong] || 0) / bTotal;
    const pct = Math.round(ratio * 100);
    const elemName = WUXING_NAMES[aYong] || { vi: aYong, en: aYong };
    if (ratio >= 0.18) {
      const pts = Math.round(ratio * 30 * 10) / 10;
      score += pts;
      notes.push({
        kind: 'positive',
        value: pts,
        text: {
          vi: `Dụng thần 「${elemName.vi}」 của Người A chiếm ${pct}% ở Người B (rất vượng) → Người B bồi dưỡng năng lượng tốt cho Người A`,
          en: `Person A's favorable element (${elemName.en}) is ${pct}% in Person B (strong) → Person B nourishes Person A's energy`
        }
      });
    } else if (ratio < 0.05) {
      score -= 3;
      notes.push({
        kind: 'negative',
        value: -3,
        text: {
          vi: `Dụng thần 「${elemName.vi}」 của Người A gần như vắng bóng ở Người B → Người B ít hỗ trợ bổ khuyết ngũ hành cho Người A`,
          en: `Person A's favorable element (${elemName.en}) is nearly absent in Person B → Person B offers little elemental nourishment for Person A`
        }
      });
    }
  }

  // B's useful god in A
  if (bYong) {
    const ratio = (aWx[bYong] || 0) / aTotal;
    const pct = Math.round(ratio * 100);
    const elemName = WUXING_NAMES[bYong] || { vi: bYong, en: bYong };
    if (ratio >= 0.18) {
      const pts = Math.round(ratio * 30 * 10) / 10;
      score += pts;
      notes.push({
        kind: 'positive',
        value: pts,
        text: {
          vi: `Dụng thần 「${elemName.vi}」 của Người B chiếm ${pct}% ở Người A (rất vượng) → Người A bồi dưỡng năng lượng tốt cho Người B`,
          en: `Person B's favorable element (${elemName.en}) is ${pct}% in Person A (strong) → Person A nourishes Person B's energy`
        }
      });
    } else if (ratio < 0.05) {
      score -= 3;
      notes.push({
        kind: 'negative',
        value: -3,
        text: {
          vi: `Dụng thần 「${elemName.vi}」 của Người B gần như vắng bóng ở Người A → Người A ít hỗ trợ bổ khuyết ngũ hành cho Người B`,
          en: `Person B's favorable element (${elemName.en}) is nearly absent in Person A → Person A offers little elemental nourishment for Person B`
        }
      });
    }
  }

  // A's challenging god in B
  if (aJi) {
    const ratio = (bWx[aJi] || 0) / bTotal;
    const pct = Math.round(ratio * 100);
    const elemName = WUXING_NAMES[aJi] || { vi: aJi, en: aJi };
    if (ratio >= 0.25) {
      const pts = Math.round(ratio * 24 * 10) / 10;
      score -= pts;
      notes.push({
        kind: 'negative',
        value: -pts,
        text: {
          vi: `Kỵ thần 「${elemName.vi}」 của Người A chiếm ${pct}% ở Người B → Người B dễ vô tình kích hoạt điểm căng thẳng của Người A`,
          en: `Person A's challenging element (${elemName.en}) is ${pct}% in Person B → Person B may trigger Person A's stress points`
        }
      });
    }
  }

  // B's challenging god in A
  if (bJi) {
    const ratio = (aWx[bJi] || 0) / aTotal;
    const pct = Math.round(ratio * 100);
    const elemName = WUXING_NAMES[bJi] || { vi: bJi, en: bJi };
    if (ratio >= 0.25) {
      const pts = Math.round(ratio * 24 * 10) / 10;
      score -= pts;
      notes.push({
        kind: 'negative',
        value: -pts,
        text: {
          vi: `Kỵ thần 「${elemName.vi}」 của Người B chiếm ${pct}% ở Người A → Người A dễ vô tình kích hoạt điểm căng thẳng của Người B`,
          en: `Person B's challenging element (${elemName.en}) is ${pct}% in Person A → Person A may trigger Person B's stress points`
        }
      });
    }
  }

  return { score: Math.round(score * 10) / 10, notes };
}

export function scoreGanzhiInteractions(a: InternalBaziChart, b: InternalBaziChart): {
  score: number;
  notes: CompatibilityNote[];
} {
  const aGans = a.pillars.map((p) => p.gan);
  const aZhis = a.pillars.map((p) => p.zhi);
  const bGans = b.pillars.map((p) => p.gan);
  const bZhis = b.pillars.map((p) => p.zhi);

  const pillarWeights = [0.6, 0.9, 1.0, 0.7];
  const notes: CompatibilityNote[] = [];
  let score = 0.0;

  // 1. Stem interactions (He / Chong)
  for (let i = 0; i < aGans.length; i++) {
    for (let j = 0; j < bGans.length; j++) {
      const ga = aGans[i];
      const gb = bGans[j];
      const w = (pillarWeights[i] + pillarWeights[j]) / 2;

      const heKey1 = `${ga}_${gb}`;
      const heKey2 = `${gb}_${ga}`;
      const heMatch = GAN_HE_MAP[heKey1] || GAN_HE_MAP[heKey2];

      const pNameA = PILLAR_NAMES[i];
      const pNameB = PILLAR_NAMES[j];
      const nameGa = GAN_NAMES[ga]?.vi || ga;
      const nameGb = GAN_NAMES[gb]?.vi || gb;
      const nameGaEn = GAN_NAMES[ga]?.en || ga;
      const nameGbEn = GAN_NAMES[gb]?.en || gb;

      if (heMatch) {
        const pts = Math.round(6 * w * 10) / 10;
        score += pts;
        notes.push({
          kind: 'positive',
          value: pts,
          text: {
            vi: `A.${pNameA.vi} (${nameGa}) + B.${pNameB.vi} (${nameGb}): ${heMatch.vi} → Lực hút và khả năng dung hòa tự nhiên`,
            en: `A.${pNameA.en} (${nameGaEn}) + B.${pNameB.en} (${nameGbEn}): ${heMatch.en} → Natural affinity and harmonious attraction`
          }
        });
      } else if (GAN_CHONG_SET.has(heKey1)) {
        const pts = Math.round(4 * w * 10) / 10;
        score -= pts;
        notes.push({
          kind: 'negative',
          value: -pts,
          text: {
            vi: `A.${pNameA.vi} (${nameGa}) + B.${pNameB.vi} (${nameGb}): Thiên can tương xung → Bộc trực, dễ nảy sinh quan điểm đối lập`,
            en: `A.${pNameA.en} (${nameGaEn}) + B.${pNameB.en} (${nameGbEn}): Stem clash → Direct differences in expression and viewpoints`
          }
        });
      }
    }
  }

  // 2. Branch interactions
  for (let i = 0; i < aZhis.length; i++) {
    for (let j = 0; j < bZhis.length; j++) {
      const za = aZhis[i];
      const zb = bZhis[j];
      const w = (pillarWeights[i] + pillarWeights[j]) / 2;

      const pNameA = PILLAR_NAMES[i];
      const pNameB = PILLAR_NAMES[j];
      const nameZa = ZHI_NAMES[za]?.vi || za;
      const nameZb = ZHI_NAMES[zb]?.vi || zb;
      const nameZaEn = ZHI_NAMES[za]?.en || za;
      const nameZbEn = ZHI_NAMES[zb]?.en || zb;

      if (za === zb) {
        notes.push({
          kind: 'neutral',
          value: 0,
          text: {
            vi: `A.${pNameA.vi} (${nameZa}) = B.${pNameB.vi} (${nameZb}): Đồng chi (Phục ngâm) → Cùng tần số năng lượng, vừa thấu hiểu vừa dễ lặp lại thói quen cũ`,
            en: `A.${pNameA.en} (${nameZaEn}) = B.${pNameB.en} (${nameZbEn}): Same branch → Shared rhythm, intuitive empathy with identical patterns`
          }
        });
      } else {
        const k1 = `${za}_${zb}`;
        const k2 = `${zb}_${za}`;

        const liuHe = ZHI_LIU_HE_MAP[k1] || ZHI_LIU_HE_MAP[k2];
        const liuChong = ZHI_CHONG_MAP[k1] || ZHI_CHONG_MAP[k2];
        const isHai = ZHI_HAI_SET.has(k1);

        if (liuHe) {
          let pts = Math.round(7 * w * 10) / 10;
          const isSpousePalace = i === 2 && j === 2;
          if (isSpousePalace) pts += 5;
          score += pts;
          notes.push({
            kind: 'positive',
            value: pts,
            text: {
              vi: `A.${pNameA.vi} (${nameZa}) + B.${pNameB.vi} (${nameZb}): ${liuHe.vi} → Duyên nợ gắn kết sâu sắc${isSpousePalace ? ' (Hợp Cung Phu Thê - nền tảng hôn phối rất đẹp)' : ''}`,
              en: `A.${pNameA.en} (${nameZaEn}) + B.${pNameB.en} (${nameZbEn}): ${liuHe.en} → Strong bond and attraction${isSpousePalace ? ' (Spouse Palace combination - key matrimonial anchor)' : ''}`
            }
          });
        } else if (liuChong) {
          let pts = Math.round(6 * w * 10) / 10;
          const isSpousePalace = i === 2 && j === 2;
          if (isSpousePalace) pts += 4;
          score -= pts;
          notes.push({
            kind: 'negative',
            value: -pts,
            text: {
              vi: `A.${pNameA.vi} (${nameZa}) + B.${pNameB.vi} (${nameZb}): ${liuChong.vi}${isSpousePalace ? ' (Xung Cung Phu Thê - cần ý thức nhường nhịn khi bất đồng)' : ''} → Trực tiếp va chạm`,
              en: `A.${pNameA.en} (${nameZaEn}) + B.${pNameB.en} (${nameZbEn}): ${liuChong.en}${isSpousePalace ? ' (Spouse Palace clash - mindful communication required during friction)' : ''} → Direct energetic clash`
            }
          });
        } else if (isHai) {
          const pts = Math.round(3 * w * 10) / 10;
          score -= pts;
          notes.push({
            kind: 'negative',
            value: -pts,
            text: {
              vi: `A.${pNameA.vi} (${nameZa}) + B.${pNameB.vi} (${nameZb}): Tương hại (Lục Xuyên) → Dễ có những nỗi niềm khó tỏ cùng nhau`,
              en: `A.${pNameA.en} (${nameZaEn}) + B.${pNameB.en} (${nameZbEn}): Branch harm (Chuan) → Subtle misunderstandings beneath the surface`
            }
          });
        }
      }
    }
  }

  // 3. San He / Ban He combinations
  const seenBanHe = new Set<string>();
  for (const group of SAN_HE_GROUPS) {
    for (const sa of aZhis) {
      for (const sb of bZhis) {
        if (group.branches.includes(sa) && group.branches.includes(sb) && sa !== sb) {
          const pairKey = [sa, sb].sort().join('_') + group.hua;
          if (!seenBanHe.has(pairKey)) {
            seenBanHe.add(pairKey);
            const pts = 4.0;
            score += pts;
            const nameSa = ZHI_NAMES[sa]?.vi || sa;
            const nameSb = ZHI_NAMES[sb]?.vi || sb;
            const elemName = WUXING_NAMES[group.hua]?.vi || group.hua;
            notes.push({
              kind: 'positive',
              value: pts,
              text: {
                vi: `A có 「${nameSa}」 + B có 「${nameSb}」 → Bán hợp hóa ${elemName} (${group.name.vi}) → Cùng tạo động lực xây đắp chung`,
                en: `A has "${ZHI_NAMES[sa]?.en || sa}" + B has "${ZHI_NAMES[sb]?.en || sb}" → Semi-combination to ${WUXING_NAMES[group.hua]?.en || group.hua} → Collaborative synergy`
              }
            });
          }
        }
      }
    }
  }

  // 4. Peach Blossom (Tao Hua)
  const aRizhi = aZhis[2];
  const bRizhi = bZhis[2];
  const aTaohua = TAOHUA_BY_RIZHI[aRizhi];
  const bTaohua = TAOHUA_BY_RIZHI[bRizhi];

  if (aTaohua && bZhis.includes(aTaohua)) {
    score += 4;
    notes.push({
      kind: 'positive',
      value: 4,
      text: {
        vi: `Đào hoa của Người A nằm tại 「${ZHI_NAMES[aTaohua]?.vi || aTaohua}」, xuất hiện trong Bát Tự Người B → Sức hút tình cảm lãng mạn rõ nét`,
        en: `Person A's Peach Blossom branch "${ZHI_NAMES[aTaohua]?.en || aTaohua}" appears in Person B → Strong romantic charm and allure`
      }
    });
  }
  if (bTaohua && aZhis.includes(bTaohua)) {
    score += 4;
    notes.push({
      kind: 'positive',
      value: 4,
      text: {
        vi: `Đào hoa của Người B nằm tại 「${ZHI_NAMES[bTaohua]?.vi || bTaohua}」, xuất hiện trong Bát Tự Người A → Sức hút tình cảm lãng mạn rõ nét`,
        en: `Person B's Peach Blossom branch "${ZHI_NAMES[bTaohua]?.en || bTaohua}" appears in Person A → Strong romantic charm and allure`
      }
    });
  }

  // 5. Tian Yi Gui Ren (Nobleman)
  const aTianyi = TIANYI_BY_RIGAN[a.dayMaster] || [];
  const bTianyi = TIANYI_BY_RIGAN[b.dayMaster] || [];
  const aMeet = aTianyi.filter((z) => bZhis.includes(z));
  const bMeet = bTianyi.filter((z) => aZhis.includes(z));

  if (aMeet.length > 0) {
    score += 5;
    const branchNames = aMeet.map((z) => ZHI_NAMES[z]?.vi || z).join(', ');
    notes.push({
      kind: 'positive',
      value: 5,
      text: {
        vi: `Thiên Ất Quý Nhân của Người A (chi 「${branchNames}」) hiện diện ở Người B → Người B là quý nhân trợ lực quan trọng cho Người A`,
        en: `Person A's Nobleman branch (${branchNames}) appears in Person B's chart → Person B is a supportive guiding anchor for Person A`
      }
    });
  }
  if (bMeet.length > 0) {
    score += 5;
    const branchNames = bMeet.map((z) => ZHI_NAMES[z]?.vi || z).join(', ');
    notes.push({
      kind: 'positive',
      value: 5,
      text: {
        vi: `Thiên Ất Quý Nhân của Người B (chi 「${branchNames}」) hiện diện ở Người A → Người A là quý nhân trợ lực quan trọng cho Người B`,
        en: `Person B's Nobleman branch (${branchNames}) appears in Person A's chart → Person A is a supportive guiding anchor for Person B`
      }
    });
  }

  return { score: Math.round(score * 10) / 10, notes };
}

export function scoreShishenMatch(a: InternalBaziChart, b: InternalBaziChart): {
  score: number;
  notes: CompatibilityNote[];
} {
  const notes: CompatibilityNote[] = [];
  let score = 0.0;

  const aDm = a.dayMaster;
  const bDm = b.dayMaster;
  const roleBInA = calcShishen(aDm, bDm);
  const roleAInB = calcShishen(bDm, aDm);

  const nameBInA = SHISHEN_NAMES[roleBInA] || { vi: roleBInA, en: roleBInA };
  const nameAInB = SHISHEN_NAMES[roleAInB] || { vi: roleAInB, en: roleAInB };

  notes.push({
    kind: 'neutral',
    value: 0,
    text: {
      vi: `Nhật can Người B (${GAN_NAMES[bDm]?.vi || bDm}) đối với Người A là 「${nameBInA.vi}」; Nhật can Người A (${GAN_NAMES[aDm]?.vi || aDm}) đối với Người B là 「${nameAInB.vi}」`,
      en: `Person B's Day Master (${GAN_NAMES[bDm]?.en || bDm}) relative to Person A is "${nameBInA.en}"; Person A's Day Master relative to Person B is "${nameAInB.en}"`
    }
  });

  // Preserve the source algorithm's traditional calculation convention while
  // keeping model-facing text neutral about identity and sexual orientation.
  const scorePerspective = (
    subject: 'A' | 'B',
    role: string,
    name: { vi: string; en: string },
    calculationSex: CalculationSex,
    includeReversePenalty: boolean
  ) => {
    const primaryRoles = calculationSex === 'male' ? ['正财', '偏财'] : ['正官', '七杀'];
    const reverseRoles = calculationSex === 'male' ? ['正官', '七杀'] : ['正财', '偏财'];

    if (primaryRoles.includes(role)) {
      const pts = role === '正财' || role === '正官' ? 12 : 8;
      score += pts;
      notes.push({
        kind: 'positive',
        value: pts,
        text: {
          vi: `Theo quy ước tính Thập Thần truyền thống, góc nhìn của Người ${subject} gặp vai trò 「${name.vi}」 phù hợp với trục gắn kết và trách nhiệm. Đây chỉ là ký hiệu kỹ thuật, không mô tả vai trò giới hay xu hướng tình cảm.`,
          en: `Under the traditional Ten Gods calculation convention, Person ${subject}'s perspective meets the "${name.en}" pattern associated with bonding and responsibility. This is a technical marker, not a gender role or an inference about sexual orientation.`
        }
      });
    } else if (includeReversePenalty && reverseRoles.includes(role)) {
      score -= 6;
      notes.push({
        kind: 'negative',
        value: -6,
        text: {
          vi: `Theo quy ước tính Thập Thần truyền thống, góc nhìn của Người ${subject} gặp vai trò 「${name.vi}」 theo chiều ít quen thuộc hơn; hai người nên làm rõ kỳ vọng và quyền chủ động. Điều này không hàm ý vai trò giới hay xu hướng tình cảm.`,
          en: `Under the traditional Ten Gods calculation convention, Person ${subject}'s perspective meets the "${name.en}" pattern in a less conventional direction; expectations and initiative benefit from clarification. This does not imply a gender role or sexual orientation.`
        }
      });
    }
  };

  scorePerspective('A', roleBInA, nameBInA, a.gender, true);
  scorePerspective('B', roleAInB, nameAInB, b.gender, false);

  return { score: Math.round(score * 10) / 10, notes };
}

export function scoreDayunSync(
  a: InternalBaziChart,
  b: InternalBaziChart,
  focusYears: number[]
): {
  score: number;
  notes: CompatibilityNote[];
} {
  if (!focusYears.length) {
    return { score: 0.0, notes: [] };
  }

  const aYong = a.yongshenZh;
  const bYong = b.yongshenZh;

  const dayunPolarity = (
    year: number,
    dayuns: InternalBaziChart['dayunSequence'],
    yong: string
  ): number => {
    for (const d of dayuns) {
      if (d.startYear <= year && year <= d.endYear) {
        const ganWx = GAN_WUXING_ZH[d.gan];
        if (ganWx === yong || WUXING_SHENG_ZH[ganWx] === yong) return 1;
        if (WUXING_KE_ZH[ganWx] === yong || yong === WUXING_KE_ZH[ganWx]) return -1;
        return 0;
      }
    }
    return 0;
  };

  let same = 0;
  let diff = 0;
  for (const y of focusYears) {
    const pa = dayunPolarity(y, a.dayunSequence, aYong);
    const pb = dayunPolarity(y, b.dayunSequence, bYong);
    if (pa !== 0 && pb !== 0) {
      if (pa === pb) same++;
      else diff++;
    }
  }

  const total = same + diff;
  const ratio = total > 0 ? same / total : 0.5;
  const pts = Math.round((ratio - 0.5) * 20 * 10) / 10;
  const pct = Math.round(ratio * 100);

  const notes: CompatibilityNote[] = [
    {
      kind: pts > 0 ? 'positive' : pts < 0 ? 'negative' : 'neutral',
      value: pts,
      text: {
        vi: `Trong 5 năm trọng tâm (${focusYears[0]}–${focusYears[focusYears.length - 1]}), có ${same} năm vận thế cùng pha (cùng vượng/cùng thử thách), ${diff} năm ngược pha → Độ đồng bộ đại vận đạt ${pct}%`,
        en: `In the 5-year focus period (${focusYears[0]}–${focusYears[focusYears.length - 1]}), ${same} years are in lucky synchrony, ${diff} years diverge → Luck cycle synchrony is ${pct}%`
      }
    }
  ];

  return { score: pts, notes };
}

// ---------------------------------------------------------------------------
// 5. Complete Dual Evaluation with Unknown Hour Range Scanning
// ---------------------------------------------------------------------------

export function evaluateBaziCompatibility(
  personA: BaziLovePersonInput,
  personB: BaziLovePersonInput,
  currentYear = new Date().getFullYear()
): BaziCompatibilityResult {
  const focusYears = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const aHasTime = Boolean(personA.birthTime && personA.birthTime.trim());
  const bHasTime = Boolean(personB.birthTime && personB.birthTime.trim());

  let confidence: ConfidenceLevel = 'high';
  if (!aHasTime && !bHasTime) confidence = 'low';
  else if (!aHasTime || !bHasTime) confidence = 'medium';

  const aCandidates: InternalBaziChart[] = aHasTime
    ? [solveSingleChart(personA)]
    : SAMPLE_HOURS.map((hour) => solveSingleChart(personA, hour));

  const bCandidates: InternalBaziChart[] = bHasTime
    ? [solveSingleChart(personB)]
    : SAMPLE_HOURS.map((hour) => solveSingleChart(personB, hour));

  const layerResults: Record<CompatibilityLayerId, {
    scores: number[];
    notesMap: Map<string, { note: CompatibilityNote; count: number }>;
  }> = {
    elements: { scores: [], notesMap: new Map() },
    interactions: { scores: [], notesMap: new Map() },
    roles: { scores: [], notesMap: new Map() },
    cycles: { scores: [], notesMap: new Map() }
  };

  for (const ca of aCandidates) {
    for (const cb of bCandidates) {
      const e = scoreWuxingComplement(ca, cb);
      const inter = scoreGanzhiInteractions(ca, cb);
      const r = scoreShishenMatch(ca, cb);
      const c = scoreDayunSync(ca, cb, focusYears);

      layerResults.elements.scores.push(e.score);
      layerResults.interactions.scores.push(inter.score);
      layerResults.roles.scores.push(r.score);
      layerResults.cycles.scores.push(c.score);

      const recordScenarioNotes = (id: CompatibilityLayerId, notes: CompatibilityNote[]) => {
        const uniqueNotes = new Map(notes.map((note) => [note.text.vi, note]));
        uniqueNotes.forEach((note, key) => {
          const previous = layerResults[id].notesMap.get(key);
          layerResults[id].notesMap.set(key, {
            note,
            count: (previous?.count || 0) + 1
          });
        });
      };

      recordScenarioNotes('elements', e.notes);
      recordScenarioNotes('interactions', inter.notes);
      recordScenarioNotes('roles', r.notes);
      recordScenarioNotes('cycles', c.notes);
    }
  }

  const buildLayer = (
    id: CompatibilityLayerId,
    label: LocalizedText
  ): CompatibilityLayer => {
    const data = layerResults[id];
    const scores = data.scores;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((x, y) => x + y, 0) / scores.length;
    const score = Math.round(avgScore * 10) / 10;
    const uncertain = minScore !== maxScore;

    const notes = Array.from(data.notesMap.values())
      .map(({ note, count }) => ({
        ...note,
        occurrenceRate: Math.round((count / scores.length) * 1000) / 1000
      }))
      // Suppress rare hour-only signals while preserving plausible variants.
      .filter((note) => scores.length === 1 || (note.occurrenceRate || 0) >= 0.25);
    notes.sort((x, y) => {
      const xWeight = Math.abs(x.value) * (x.occurrenceRate || 1);
      const yWeight = Math.abs(y.value) * (y.occurrenceRate || 1);
      return yWeight - xWeight;
    });

    return {
      id,
      label,
      score,
      minScore: Math.round(minScore * 10) / 10,
      maxScore: Math.round(maxScore * 10) / 10,
      uncertain,
      notes: notes.slice(0, 8)
    };
  };

  const layers: CompatibilityLayer[] = [
    buildLayer('elements', {
      vi: 'Ngũ hành bổ trợ',
      en: 'Five Elements Complementarity'
    }),
    buildLayer('interactions', {
      vi: 'Tương tác Can Chi & Cung Phu Thê',
      en: 'Stem-Branch Interactions & Spouse Palace'
    }),
    buildLayer('roles', {
      vi: 'Thập Thần trong quan hệ',
      en: 'Ten Gods Relational Dynamics'
    }),
    buildLayer('cycles', {
      vi: 'Đồng bộ đại vận (5 năm tới)',
      en: 'Major Luck Cycle Synchronicity (Next 5 Years)'
    })
  ];

  // Consolidate top strengths and frictions across all layers
  const allNotes = layers.flatMap((l) => l.notes);
  const strengths = allNotes
    .filter((n) => n.kind === 'positive')
    .sort((x, y) => y.value * (y.occurrenceRate || 1) - x.value * (x.occurrenceRate || 1))
    .slice(0, 6);

  const frictions = allNotes
    .filter((n) => n.kind === 'negative')
    .sort((x, y) => x.value * (x.occurrenceRate || 1) - y.value * (y.occurrenceRate || 1))
    .slice(0, 6);

  // Representative public charts
  const repChartA = aCandidates[0];
  const repChartB = bCandidates[0];

  const toPublicChart = (chart: InternalBaziChart, label: 'A' | 'B', timeKnown: boolean): BaziPublicChart => ({
    label,
    pillars: [
      chart.pillars[0],
      chart.pillars[1],
      chart.pillars[2],
      timeKnown ? chart.pillars[3] : null
    ],
    dayMaster: chart.dayMaster,
    dayMasterElement: chart.dayMasterElement,
    usefulElement: chart.usefulElement,
    challengingElement: chart.challengingElement,
    timeKnown
  });

  const assumptions: LocalizedText[] = [];
  if (!aHasTime && !bHasTime) {
    assumptions.push({
      vi: 'Cả hai người đều chưa rõ giờ sinh; hệ thống đã quét các mốc đại diện của toàn bộ 12 canh giờ, gồm cả hai phía ranh giới giờ Tý, để tính khoảng dao động.',
      en: 'Both birth hours are unspecified; the engine evaluated representative times for all 12 double-hours, including both sides of the Zi-hour boundary, to derive score intervals.'
    });
  } else if (!aHasTime) {
    assumptions.push({
      vi: 'Người A chưa rõ giờ sinh; kết quả trụ giờ được tính theo khoảng biên độ của toàn bộ các khung giờ khả dĩ trong ngày.',
      en: 'Person A has an unknown birth hour; hour-dependent indicators are computed as range estimates over candidate hours.'
    });
  } else if (!bHasTime) {
    assumptions.push({
      vi: 'Người B chưa rõ giờ sinh; kết quả trụ giờ được tính theo khoảng biên độ của toàn bộ các khung giờ khả dĩ trong ngày.',
      en: 'Person B has an unknown birth hour; hour-dependent indicators are computed as range estimates over candidate hours.'
    });
  }

  return {
    engineVersion: 'bazi-love-ts-v1',
    confidence,
    focusYears,
    charts: [
      toPublicChart(repChartA, 'A', aHasTime),
      toPublicChart(repChartB, 'B', bHasTime)
    ],
    layers,
    strengths,
    frictions,
    assumptions
  };
}
