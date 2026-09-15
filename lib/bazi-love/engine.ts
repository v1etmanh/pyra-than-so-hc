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
  BaziPillarPosition,
  BaziPillar,
  BaziPublicChart,
  CalculationSex,
  CompatibilityLayer,
  CompatibilityLayerId,
  CompatibilityNote,
  ConfidenceLevel,
  FiveElement,
  LocalizedText,
  RelationDimension,
  RelationDirection,
  RelationEvidenceSource,
  RelationPolarity,
  YearlyPillarDynamic
} from './types.ts';
import {
  aggregateRelationEvidence,
  buildBranchInteractionMatrix,
  buildDirectionalRelationProfile,
  buildRelationDimensionProfiles,
  type ScenarioRelationEvidence
} from './relation-intelligence.ts';

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

const RELATION_PILLARS: BaziPillarPosition[] = ['year', 'month', 'day', 'hour'];

function stableSymbolPair(left: string, right: string, order: readonly string[]): string {
  return order.indexOf(left) <= order.indexOf(right) ? `${left}_${right}` : `${right}_${left}`;
}

function makeScenarioEvidence(input: {
  id: string;
  source: RelationEvidenceSource;
  subtype: string;
  direction: RelationDirection;
  dimensions: RelationDimension[];
  polarity: RelationPolarity;
  weight: number;
  hourSensitive: boolean;
  facts: ScenarioRelationEvidence['facts'];
  text: LocalizedText;
}): ScenarioRelationEvidence {
  return input;
}

function tenGodSemantics(role: string): {
  dimensions: RelationDimension[];
  polarity: RelationPolarity;
  weight: number;
} {
  switch (role) {
    case '正印':
      return { dimensions: ['perception', 'emotional_safety', 'support', 'dependency'], polarity: 'supportive', weight: 8 };
    case '偏印':
      return { dimensions: ['perception', 'emotional_connection', 'support', 'independence'], polarity: 'mixed', weight: 6 };
    case '食神':
      return { dimensions: ['perception', 'expression', 'communication', 'emotional_connection'], polarity: 'supportive', weight: 7 };
    case '伤官':
      return { dimensions: ['perception', 'expression', 'communication', 'conflict', 'pressure'], polarity: 'mixed', weight: 7 };
    case '正财':
      return { dimensions: ['perception', 'attraction', 'initiative', 'commitment', 'support'], polarity: 'supportive', weight: 8 };
    case '偏财':
      return { dimensions: ['perception', 'attraction', 'initiative', 'independence'], polarity: 'mixed', weight: 6 };
    case '正官':
      return { dimensions: ['perception', 'attraction', 'commitment', 'power_balance', 'trust'], polarity: 'supportive', weight: 8 };
    case '七杀':
      return { dimensions: ['perception', 'attraction', 'initiative', 'power_balance', 'pressure'], polarity: 'challenging', weight: 7 };
    case '劫财':
      return { dimensions: ['perception', 'independence', 'power_balance', 'conflict'], polarity: 'challenging', weight: 6 };
    default:
      return { dimensions: ['perception', 'closeness', 'independence', 'values'], polarity: 'mixed', weight: 5 };
  }
}

/**
 * Converts one already-solved chart pair into semantic relationship facts.
 * It deliberately does not modify or replace any v1 compatibility score.
 */
export function buildScenarioRelationEvidence(
  a: InternalBaziChart,
  b: InternalBaziChart,
  focusYears: number[]
): ScenarioRelationEvidence[] {
  const evidence: ScenarioRelationEvidence[] = [];
  const aTotal = Object.values(a.wuxingScores).reduce((sum, value) => sum + value, 0) || 1;
  const bTotal = Object.values(b.wuxingScores).reduce((sum, value) => sum + value, 0) || 1;

  const recordElement = (
    elementZh: string,
    sourceScores: Record<string, number>,
    sourceTotal: number,
    direction: 'A_TO_B' | 'B_TO_A',
    target: 'A' | 'B',
    kind: 'useful' | 'challenging'
  ) => {
    const ratio = (sourceScores[elementZh] || 0) / sourceTotal;
    const pct = Math.round(ratio * 100);
    const element = CHINESE_TO_ELEMENT[elementZh] || 'wood';
    const elementName = WUXING_NAMES[elementZh] || { vi: elementZh, en: elementZh };
    const provider = direction === 'A_TO_B' ? 'A' : 'B';

    if (kind === 'useful' && (ratio >= 0.18 || ratio < 0.05)) {
      const strong = ratio >= 0.18;
      const weight = strong ? Math.round(ratio * 30 * 10) / 10 : 3;
      evidence.push(makeScenarioEvidence({
        id: `USEFUL_ELEMENT:${direction}:${element}:${strong ? 'PRESENT' : 'ABSENT'}`,
        source: 'useful_element',
        subtype: strong ? 'useful_element_present' : 'useful_element_absent',
        direction,
        dimensions: strong
          ? ['support', 'emotional_safety', 'growth', 'closeness']
          : ['support', 'emotional_safety', 'growth'],
        polarity: strong ? 'supportive' : 'challenging',
        weight,
        hourSensitive: true,
        facts: { element, elementZh, ratio, percent: pct, provider, recipient: target },
        text: strong
          ? {
              vi: `Người ${provider} mang mạnh Dụng thần ${elementName.vi} của Người ${target}, tạo xu hướng nâng đỡ và bổ khuyết.`,
              en: `Person ${provider} strongly supplies Person ${target}'s useful ${elementName.en} element, supporting nourishment and growth.`
            }
          : {
              vi: `Dụng thần ${elementName.vi} của Người ${target} gần như vắng ở Người ${provider}, nên nguồn bổ khuyết theo chiều này còn hạn chế.`,
              en: `Person ${target}'s useful ${elementName.en} element is nearly absent in Person ${provider}, limiting nourishment in this direction.`
            }
      }));
    }

    if (kind === 'challenging' && ratio >= 0.25) {
      evidence.push(makeScenarioEvidence({
        id: `CHALLENGING_ELEMENT:${direction}:${element}:STRONG`,
        source: 'challenging_element',
        subtype: 'challenging_element_strong',
        direction,
        dimensions: ['pressure', 'conflict', 'emotional_safety', 'growth'],
        polarity: 'challenging',
        weight: Math.round(ratio * 24 * 10) / 10,
        hourSensitive: true,
        facts: { element, elementZh, ratio, percent: pct, provider, recipient: target },
        text: {
          vi: `Người ${provider} mang mạnh Kỵ thần ${elementName.vi} của Người ${target}, có thể kích hoạt áp lực cần được điều tiết có ý thức.`,
          en: `Person ${provider} strongly supplies Person ${target}'s challenging ${elementName.en} element, which may activate pressure requiring conscious regulation.`
        }
      }));
    }
  };

  recordElement(a.yongshenZh, b.wuxingScores, bTotal, 'B_TO_A', 'A', 'useful');
  recordElement(b.yongshenZh, a.wuxingScores, aTotal, 'A_TO_B', 'B', 'useful');
  recordElement(a.jishenZh, b.wuxingScores, bTotal, 'B_TO_A', 'A', 'challenging');
  recordElement(b.jishenZh, a.wuxingScores, aTotal, 'A_TO_B', 'B', 'challenging');

  const recordTenGod = (
    role: string,
    direction: 'A_TO_B' | 'B_TO_A',
    sourceGan: string,
    targetGan: string
  ) => {
    const semantics = tenGodSemantics(role);
    const source = direction === 'A_TO_B' ? 'A' : 'B';
    const target = direction === 'A_TO_B' ? 'B' : 'A';
    const roleName = SHISHEN_NAMES[role] || { vi: role, en: role };
    evidence.push(makeScenarioEvidence({
      id: `TEN_GOD:${direction}:${role}`,
      source: 'ten_god',
      subtype: role,
      direction,
      dimensions: semantics.dimensions,
      polarity: semantics.polarity,
      weight: semantics.weight,
      hourSensitive: false,
      facts: { role, source, target, sourceDayMaster: sourceGan, targetDayMaster: targetGan },
      text: {
        vi: `Nhật chủ Người ${source} kích hoạt mẫu Thập Thần 「${roleName.vi}」 trong cách Người ${target} trải nghiệm mối quan hệ.`,
        en: `Person ${source}'s Day Master activates the "${roleName.en}" Ten Gods pattern in how Person ${target} experiences the relationship.`
      }
    }));
  };

  recordTenGod(calcShishen(b.dayMaster, a.dayMaster), 'A_TO_B', a.dayMaster, b.dayMaster);
  recordTenGod(calcShishen(a.dayMaster, b.dayMaster), 'B_TO_A', b.dayMaster, a.dayMaster);

  const pillarWeights = [0.6, 0.9, 1, 0.7];
  for (let i = 0; i < a.pillars.length; i++) {
    for (let j = 0; j < b.pillars.length; j++) {
      const aPillar = RELATION_PILLARS[i];
      const bPillar = RELATION_PILLARS[j];
      const spousePalace = i === 2 && j === 2;
      const hourSensitive = i === 3 || j === 3;
      const importance = spousePalace ? 'highest' : (i === 2 || j === 2 ? 'high' : 'medium');
      const positionalFacts = { aPillar, bPillar, spousePalace, importance };
      const w = (pillarWeights[i] + pillarWeights[j]) / 2;
      const ga = a.pillars[i].gan;
      const gb = b.pillars[j].gan;
      const ganPair = stableSymbolPair(ga, gb, GAN);
      const stemCombination = GAN_HE_MAP[`${ga}_${gb}`] || GAN_HE_MAP[`${gb}_${ga}`];

      if (stemCombination) {
        evidence.push(makeScenarioEvidence({
          id: `STEM:${aPillar.toUpperCase()}_${bPillar.toUpperCase()}:合:${ganPair}`,
          source: 'stem_relation',
          subtype: '合',
          direction: 'MUTUAL',
          dimensions: ['attraction', 'communication', 'expression', 'conflict_repair'],
          polarity: 'supportive',
          weight: Math.round(6 * w * 10) / 10,
          hourSensitive,
          facts: { ...positionalFacts, aStem: ga, bStem: gb, transformedElement: stemCombination.hua },
          text: {
            vi: `Thiên can A.${PILLAR_NAMES[i].vi} và B.${PILLAR_NAMES[j].vi} tương hợp: ${stemCombination.vi}.`,
            en: `The stems at A.${PILLAR_NAMES[i].en} and B.${PILLAR_NAMES[j].en} combine: ${stemCombination.en}.`
          }
        }));
      } else if (GAN_CHONG_SET.has(`${ga}_${gb}`)) {
        evidence.push(makeScenarioEvidence({
          id: `STEM:${aPillar.toUpperCase()}_${bPillar.toUpperCase()}:冲:${ganPair}`,
          source: 'stem_relation',
          subtype: '冲',
          direction: 'MUTUAL',
          dimensions: ['communication', 'expression', 'conflict', 'pressure'],
          polarity: 'challenging',
          weight: Math.round(4 * w * 10) / 10,
          hourSensitive,
          facts: { ...positionalFacts, aStem: ga, bStem: gb },
          text: {
            vi: `Thiên can A.${PILLAR_NAMES[i].vi} và B.${PILLAR_NAMES[j].vi} tương xung, dễ tạo khác biệt trong biểu đạt.`,
            en: `The stems at A.${PILLAR_NAMES[i].en} and B.${PILLAR_NAMES[j].en} clash, indicating differences in expression.`
          }
        }));
      }

      const za = a.pillars[i].zhi;
      const zb = b.pillars[j].zhi;
      const zhiPair = stableSymbolPair(za, zb, ZHI);
      const relationSource: RelationEvidenceSource = spousePalace ? 'spouse_palace' : 'branch_relation';
      const addBranchEvidence = (
        subtype: string,
        polarity: RelationPolarity,
        dimensions: RelationDimension[],
        weight: number,
        detail: LocalizedText,
        transformedElement: string | null = null
      ) => evidence.push(makeScenarioEvidence({
        id: `BRANCH:${aPillar.toUpperCase()}_${bPillar.toUpperCase()}:${subtype}:${zhiPair}`,
        source: relationSource,
        subtype,
        direction: 'MUTUAL',
        dimensions,
        polarity,
        weight,
        hourSensitive,
        facts: { ...positionalFacts, aBranch: za, bBranch: zb, transformedElement },
        text: detail
      }));

      if (za === zb) {
        addBranchEvidence(
          '同支',
          'mixed',
          ['closeness', 'emotional_connection', 'values', 'dependency'],
          spousePalace ? 5 : Math.round(2 * w * 10) / 10,
          {
            vi: `Địa chi A.${PILLAR_NAMES[i].vi} và B.${PILLAR_NAMES[j].vi} đồng chi, tạo nhịp quen thuộc nhưng có thể lặp lại cùng một mẫu.`,
            en: `The branches at A.${PILLAR_NAMES[i].en} and B.${PILLAR_NAMES[j].en} are identical, creating familiarity while potentially repeating a shared pattern.`
          }
        );
      } else {
        const liuHe = ZHI_LIU_HE_MAP[`${za}_${zb}`] || ZHI_LIU_HE_MAP[`${zb}_${za}`];
        const liuChong = ZHI_CHONG_MAP[`${za}_${zb}`] || ZHI_CHONG_MAP[`${zb}_${za}`];
        if (liuHe) {
          addBranchEvidence(
            '六合',
            'supportive',
            ['attraction', 'closeness', 'commitment', 'conflict_repair', 'marriage'],
            Math.round((7 * w + (spousePalace ? 5 : 0)) * 10) / 10,
            { vi: `${liuHe.vi}${spousePalace ? ' tại Cung Phu Thê.' : '.'}`, en: `${liuHe.en}${spousePalace ? ' at the Spouse Palaces.' : '.'}` },
            liuHe.hua
          );
        } else if (liuChong) {
          addBranchEvidence(
            '冲',
            'challenging',
            ['attraction', 'conflict', 'instability', 'daily_life', 'long_term', 'pressure'],
            Math.round((6 * w + (spousePalace ? 4 : 0)) * 10) / 10,
            { vi: `${liuChong.vi}${spousePalace ? ' tại Cung Phu Thê.' : '.'}`, en: `${liuChong.en}${spousePalace ? ' at the Spouse Palaces.' : '.'}` }
          );
        } else if (ZHI_HAI_SET.has(`${za}_${zb}`)) {
          addBranchEvidence(
            '害',
            'challenging',
            ['emotional_safety', 'trust', 'communication', 'conflict'],
            Math.round(3 * w * 10) / 10,
            { vi: 'Hai địa chi tương hại, dễ tạo hiểu lầm kín đáo cần được nói rõ.', en: 'The branches form a harm relation, pointing to subtle misunderstandings that benefit from being named.' }
          );
        }

        const sanHe = SAN_HE_GROUPS.find((group) => group.branches.includes(za) && group.branches.includes(zb));
        if (sanHe) {
          addBranchEvidence(
            '半合',
            'supportive',
            ['support', 'values', 'growth', 'daily_life', 'closeness'],
            4,
            { vi: `${sanHe.name.vi} tạo thế bán hợp giữa hai vị trí.`, en: `${sanHe.name.en} creates a semi-combination between the two positions.` },
            sanHe.hua
          );
        }
      }
    }
  }

  const aBranches = a.pillars.map((pillar) => pillar.zhi);
  const bBranches = b.pillars.map((pillar) => pillar.zhi);
  const recordMarker = (
    subtype: '桃花' | '天乙贵人',
    branch: string,
    direction: 'A_TO_B' | 'B_TO_A',
    source: RelationEvidenceSource,
    hourSensitive: boolean
  ) => {
    const provider = direction === 'A_TO_B' ? 'A' : 'B';
    const recipient = direction === 'A_TO_B' ? 'B' : 'A';
    const markerName = subtype === '桃花'
      ? { vi: 'Đào Hoa', en: 'Peach Blossom' }
      : { vi: 'Thiên Ất Quý Nhân', en: 'Nobleman' };
    evidence.push(makeScenarioEvidence({
      id: `${subtype === '桃花' ? 'PEACH_BLOSSOM' : 'NOBLEMAN'}:${direction}:${branch}`,
      source,
      subtype,
      direction,
      dimensions: subtype === '桃花'
        ? ['attraction', 'emotional_connection', 'initiative', 'closeness']
        : ['support', 'emotional_safety', 'trust', 'growth'],
      polarity: 'supportive',
      weight: subtype === '桃花' ? 4 : 5,
      hourSensitive,
      facts: { branch, provider, recipient },
      text: {
        vi: `${markerName.vi} của Người ${recipient} hiện diện ở Người ${provider}.`,
        en: `Person ${recipient}'s ${markerName.en} marker appears in Person ${provider}'s chart.`
      }
    }));
  };

  const aPeach = TAOHUA_BY_RIZHI[a.pillars[2].zhi];
  const bPeach = TAOHUA_BY_RIZHI[b.pillars[2].zhi];
  if (aPeach && bBranches.includes(aPeach)) {
    recordMarker('桃花', aPeach, 'B_TO_A', 'spouse_palace', !bBranches.slice(0, 3).includes(aPeach));
  }
  if (bPeach && aBranches.includes(bPeach)) {
    recordMarker('桃花', bPeach, 'A_TO_B', 'spouse_palace', !aBranches.slice(0, 3).includes(bPeach));
  }
  for (const branch of (TIANYI_BY_RIGAN[a.dayMaster] || []).filter((zhi) => bBranches.includes(zhi))) {
    recordMarker('天乙贵人', branch, 'B_TO_A', 'nobleman', !bBranches.slice(0, 3).includes(branch));
  }
  for (const branch of (TIANYI_BY_RIGAN[b.dayMaster] || []).filter((zhi) => aBranches.includes(zhi))) {
    recordMarker('天乙贵人', branch, 'A_TO_B', 'nobleman', !aBranches.slice(0, 3).includes(branch));
  }

  const cycle = scoreDayunSync(a, b, focusYears);
  const cycleScore = cycle.score;
  evidence.push(makeScenarioEvidence({
    id: `DAYUN:TIMING_MUTUAL:${focusYears[0]}_${focusYears[focusYears.length - 1]}`,
    source: 'dayun',
    subtype: 'luck_cycle_synchrony',
    direction: 'TIMING_MUTUAL',
    dimensions: ['timing', 'growth', 'long_term', 'support'],
    polarity: cycleScore > 0 ? 'supportive' : cycleScore < 0 ? 'challenging' : 'neutral',
    weight: Math.abs(cycleScore),
    hourSensitive: false,
    facts: { startYear: focusYears[0], endYear: focusYears[focusYears.length - 1], score: cycleScore },
    text: cycle.notes[0]?.text || { vi: 'Nhịp Đại Vận chung đã được tính.', en: 'Shared Luck Cycle rhythm was calculated.' }
  }));

  for (const year of focusYears) {
    const gan = GAN[((year - 4) % 10 + 10) % 10];
    const zhi = ZHI[((year - 4) % 12 + 12) % 12];
    const yearName = `${GAN_NAMES[gan]?.vi || gan} ${ZHI_NAMES[zhi]?.vi || zhi}`;
    const targets = [
      { label: 'A' as const, direction: 'TIMING_A' as const, chart: a },
      { label: 'B' as const, direction: 'TIMING_B' as const, chart: b }
    ];
    for (const target of targets) {
      const dayBranch = target.chart.pillars[2].zhi;
      const dayStem = target.chart.pillars[2].gan;
      const branchPair = stableSymbolPair(zhi, dayBranch, ZHI);
      const baseFacts = { year, yearStem: gan, yearBranch: zhi, target: target.label, spousePalaceBranch: dayBranch };
      const liuHe = ZHI_LIU_HE_MAP[`${zhi}_${dayBranch}`] || ZHI_LIU_HE_MAP[`${dayBranch}_${zhi}`];
      const chong = ZHI_CHONG_MAP[`${zhi}_${dayBranch}`] || ZHI_CHONG_MAP[`${dayBranch}_${zhi}`];
      const banHe = SAN_HE_GROUPS.find((group) => group.branches.includes(zhi) && group.branches.includes(dayBranch) && zhi !== dayBranch);
      const stemHe = GAN_HE_MAP[`${gan}_${dayStem}`] || GAN_HE_MAP[`${dayStem}_${gan}`];

      if (liuHe) {
        evidence.push(makeScenarioEvidence({
          id: `LIUNIAN:${target.direction}:${year}:六合:${branchPair}`,
          source: 'liunian', subtype: '六合', direction: target.direction,
          dimensions: ['timing', 'commitment', 'marriage', 'closeness'], polarity: 'supportive', weight: 9,
          hourSensitive: false, facts: { ...baseFacts, relation: '六合' },
          text: { vi: `Năm ${year} (${yearName}) lục hợp Cung Phu Thê Người ${target.label}.`, en: `Year ${year} forms a Six Combination with Person ${target.label}'s Spouse Palace.` }
        }));
      }
      if (banHe) {
        evidence.push(makeScenarioEvidence({
          id: `LIUNIAN:${target.direction}:${year}:半合:${branchPair}`,
          source: 'liunian', subtype: '半合', direction: target.direction,
          dimensions: ['timing', 'commitment', 'marriage', 'family_context', 'growth'], polarity: 'supportive', weight: 6,
          hourSensitive: false, facts: { ...baseFacts, relation: '半合', transformedElement: banHe.hua },
          text: { vi: `Năm ${year} (${yearName}) tạo thế bán hợp với Cung Phu Thê Người ${target.label}.`, en: `Year ${year} forms a semi-combination with Person ${target.label}'s Spouse Palace.` }
        }));
      }
      if (chong) {
        evidence.push(makeScenarioEvidence({
          id: `LIUNIAN:${target.direction}:${year}:冲:${branchPair}`,
          source: 'liunian', subtype: '冲', direction: target.direction,
          dimensions: ['timing', 'conflict', 'instability', 'marriage', 'long_term'], polarity: 'challenging', weight: 8,
          hourSensitive: false, facts: { ...baseFacts, relation: '冲' },
          text: { vi: `Năm ${year} (${yearName}) tương xung Cung Phu Thê Người ${target.label}.`, en: `Year ${year} clashes with Person ${target.label}'s Spouse Palace.` }
        }));
      }
      if (stemHe) {
        evidence.push(makeScenarioEvidence({
          id: `LIUNIAN:${target.direction}:${year}:STEM_合:${stableSymbolPair(gan, dayStem, GAN)}`,
          source: 'liunian', subtype: 'stem_combination', direction: target.direction,
          dimensions: ['timing', 'attraction', 'emotional_connection'], polarity: 'supportive', weight: 5,
          hourSensitive: false, facts: { ...baseFacts, targetDayMaster: dayStem, transformedElement: stemHe.hua },
          text: { vi: `Thiên can năm ${year} tương hợp Nhật chủ Người ${target.label}.`, en: `The stem of year ${year} combines with Person ${target.label}'s Day Master.` }
        }));
      }
      if ((TIANYI_BY_RIGAN[dayStem] || []).includes(zhi)) {
        evidence.push(makeScenarioEvidence({
          id: `LIUNIAN:${target.direction}:${year}:NOBLEMAN:${zhi}`,
          source: 'liunian', subtype: 'nobleman', direction: target.direction,
          dimensions: ['timing', 'support', 'growth'], polarity: 'supportive', weight: 5,
          hourSensitive: false, facts: { ...baseFacts, marker: 'nobleman' },
          text: { vi: `Năm ${year} kích hoạt Thiên Ất Quý Nhân của Người ${target.label}.`, en: `Year ${year} activates Person ${target.label}'s Nobleman marker.` }
        }));
      }
      if (TAOHUA_BY_RIZHI[dayBranch] === zhi) {
        evidence.push(makeScenarioEvidence({
          id: `LIUNIAN:${target.direction}:${year}:PEACH_BLOSSOM:${zhi}`,
          source: 'liunian', subtype: 'peach_blossom', direction: target.direction,
          dimensions: ['timing', 'attraction', 'reconnection', 'commitment'], polarity: 'supportive', weight: 5,
          hourSensitive: false, facts: { ...baseFacts, marker: 'peach_blossom' },
          text: { vi: `Năm ${year} kích hoạt Đào Hoa của Người ${target.label}.`, en: `Year ${year} activates Person ${target.label}'s Peach Blossom marker.` }
        }));
      }
    }
  }

  return evidence;
}

export function calculateYearlyTimeline(
  chartA: InternalBaziChart,
  chartB: InternalBaziChart,
  focusYears: number[]
): YearlyPillarDynamic[] {
  const rzA = chartA.pillars[2].zhi;
  const rgA = chartA.pillars[2].gan;
  const rzB = chartB.pillars[2].zhi;
  const rgB = chartB.pillars[2].gan;
  const monthZhiA = chartA.pillars[1].zhi;

  return focusYears.map((year) => {
    const ganIndex = ((year - 4) % 10 + 10) % 10;
    const zhiIndex = ((year - 4) % 12 + 12) % 12;
    const gan = GAN[ganIndex];
    const zhi = ZHI[zhiIndex];
    const ganName = GAN_NAMES[gan] || { vi: gan, en: gan };
    const zhiName = ZHI_NAMES[zhi] || { vi: zhi, en: zhi };
    const elementZh = GAN_WUXING_ZH[gan] || '木';
    const element = CHINESE_TO_ELEMENT[elementZh] || 'wood';
    const elementName = WUXING_NAMES[elementZh] || { vi: elementZh, en: elementZh };

    const checkBranchInteractions = (
      targetZhi: string,
      targetGan: string,
      personLabel: { vi: string; en: string }
    ): LocalizedText[] => {
      const notes: LocalizedText[] = [];
      const heKey1 = `${zhi}_${targetZhi}`;
      const heKey2 = `${targetZhi}_${zhi}`;

      // 1. Liu He with spouse palace
      const liuHe = ZHI_LIU_HE_MAP[heKey1] || ZHI_LIU_HE_MAP[heKey2];
      if (liuHe) {
        notes.push({
          vi: `Lưu niên ${zhiName.vi} lục hợp với Cung Phu Thê (${ZHI_NAMES[targetZhi]?.vi || targetZhi}): ${liuHe.vi} → Kích hoạt duyên lành, hỷ sự và sự gắn bó khăng khít`,
          en: `Yearly branch ${zhiName.en} forms Six Combinations with Spouse Palace (${ZHI_NAMES[targetZhi]?.en || targetZhi}) → Harmonious marital bond and commitment affinity`
        });
      }

      // 2. San He / Ban He with spouse palace
      for (const group of SAN_HE_GROUPS) {
        if (group.branches.includes(zhi) && group.branches.includes(targetZhi) && zhi !== targetZhi) {
          notes.push({
            vi: `Lưu niên ${zhiName.vi} cùng Cung Phu Thê (${ZHI_NAMES[targetZhi]?.vi || targetZhi}) tạo thế bán hợp / tam hợp (${group.name.vi}) → Thuận lợi kết giao, xây dựng gia đạo`,
            en: `Yearly branch ${zhiName.en} and Spouse Palace form combination frame (${group.name.en}) → Favorable for deep commitment and family foundation`
          });
        }
      }

      // 3. Chong (clash) with spouse palace
      const chong = ZHI_CHONG_MAP[heKey1] || ZHI_CHONG_MAP[heKey2];
      if (chong) {
        notes.push({
          vi: `Lưu niên ${zhiName.vi} tương xung Cung Phu Thê (${ZHI_NAMES[targetZhi]?.vi || targetZhi}): ${chong.vi} → Biến động tâm lý hoặc ngoại cảnh, cần lắng nghe và nhường nhịn`,
          en: `Yearly branch ${zhiName.en} clashes with Spouse Palace (${ZHI_NAMES[targetZhi]?.en || targetZhi}) → Dynamics change, requires patience and calm communication`
        });
      }

      // 4. Stem combination with day master
      const ganHe = GAN_HE_MAP[`${gan}_${targetGan}`] || GAN_HE_MAP[`${targetGan}_${gan}`];
      if (ganHe) {
        notes.push({
          vi: `Lưu niên Can ${ganName.vi} thiên hợp Nhật chủ (${GAN_NAMES[targetGan]?.vi || targetGan}): ${ganHe.vi} → Tăng cường lực hút tình cảm và tinh thần đồng điệu`,
          en: `Yearly stem ${ganName.en} combines with Day Master (${GAN_NAMES[targetGan]?.en || targetGan}) → Deepens emotional attraction and alignment`
        });
      }

      // 5. Nobleman (Tian Yi Gui Ren)
      if (TIANYI_BY_RIGAN[targetGan]?.includes(zhi)) {
        notes.push({
          vi: `Lưu niên ngộ Thiên Ất Quý Nhân của ${personLabel.vi} → Gặp nhiều trợ lực cát lành, biến hung thành cát`,
          en: `Yearly branch is Nobleman for ${personLabel.en} → Supportive guidance and favorable blessings`
        });
      }

      // 6. Peach Blossom (Tao Hua)
      if (TAOHUA_BY_RIZHI[targetZhi] === zhi) {
        notes.push({
          vi: `Lưu niên ngộ Đào Hoa của Cung Phu Thê ${personLabel.vi} → Tình cảm khởi sắc nồng thắm, thuận lợi cho hỷ sự`,
          en: `Yearly branch is Peach Blossom for ${personLabel.en}'s spouse palace → Romantic vitality and wedding auspiciousness`
        });
      }

      return notes;
    };

    const interactionsA = checkBranchInteractions(rzA, rgA, { vi: 'Người A', en: 'Person A' });
    const interactionsB = checkBranchInteractions(rzB, rgB, { vi: 'Người B', en: 'Person B' });

    // Marriage signal assessment
    let favorable = false;
    const reasonsVi: string[] = [];
    const reasonsEn: string[] = [];

    const hasLiuHeA = Boolean(ZHI_LIU_HE_MAP[`${zhi}_${rzA}`] || ZHI_LIU_HE_MAP[`${rzA}_${zhi}`]);
    const hasLiuHeB = Boolean(ZHI_LIU_HE_MAP[`${zhi}_${rzB}`] || ZHI_LIU_HE_MAP[`${rzB}_${zhi}`]);
    const hasBanHeA = SAN_HE_GROUPS.some((g) => g.branches.includes(zhi) && g.branches.includes(rzA) && zhi !== rzA);
    const hasBanHeB = SAN_HE_GROUPS.some((g) => g.branches.includes(zhi) && g.branches.includes(rzB) && zhi !== rzB);
    const resolvesCrossClash = monthZhiA === '午' && rzB === '子' && (zhi === '未' || zhi === '丑' || zhi === '辰' || zhi === '申');

    if (hasLiuHeA || hasBanHeA) {
      favorable = true;
      reasonsVi.push(`Chi năm hợp Cung Phu Thê Người A (${ZHI_NAMES[rzA]?.vi || rzA})`);
      reasonsEn.push(`Year branch harmonizes with Person A's spouse palace`);
    }
    if (hasLiuHeB || hasBanHeB) {
      favorable = true;
      reasonsVi.push(`Chi năm hợp Cung Phu Thê Người B (${ZHI_NAMES[rzB]?.vi || rzB})`);
      reasonsEn.push(`Year branch harmonizes with Person B's spouse palace`);
    }
    if (resolvesCrossClash) {
      favorable = true;
      reasonsVi.push(`Hóa giải xung đột trục Tý - Ngọ giữa hai người`);
      reasonsEn.push(`Harmonizes the Zi-Wu axis clash between the two charts`);
    }

    const hasChongA = Boolean(ZHI_CHONG_MAP[`${zhi}_${rzA}`] || ZHI_CHONG_MAP[`${rzA}_${zhi}`]);
    const hasChongB = Boolean(ZHI_CHONG_MAP[`${zhi}_${rzB}`] || ZHI_CHONG_MAP[`${rzB}_${zhi}`]);
    if (hasChongA || hasChongB) {
      favorable = false;
      reasonsVi.push(`Có tương xung với Cung Phu Thê, nên ưu tiên thấu hiểu và vững tâm lý`);
      reasonsEn.push(`Clashes with spouse palace; warrants steady communication`);
    }

    const note: LocalizedText = favorable
      ? {
          vi: `Năm mang năng lượng thuận hòa (${reasonsVi.join('; ')}), rất thuận lợi để tính chuyện gắn kết dài lâu, đính hôn hoặc cưới hỏi.`,
          en: `Year bears auspicious relational harmony (${reasonsEn.join('; ')}), highly favorable for commitment, engagement, or wedding plans.`
        }
      : {
          vi:
            reasonsVi.length > 0
              ? `Năm cần bình tâm và linh hoạt (${reasonsVi.join('; ')}), nên vun đắp sự thấu hiểu trước khi quyết định các bước ngoặt lớn.`
              : `Năm mang tính bình hòa, thích hợp bồi đắp nền tảng công việc, tài chính và sự gắn kết thường nhật.`,
          en:
            reasonsEn.length > 0
              ? `Year calls for mutual patience (${reasonsEn.join('; ')}), ideal for deepening understanding before major milestones.`
              : `Year is stable and neutral, well-suited for building everyday connection, financial stability, and emotional trust.`
        };

    return {
      year,
      gan,
      zhi,
      ganName,
      zhiName,
      element,
      elementName,
      interactionsA,
      interactionsB,
      marriageSignal: {
        favorable,
        note
      }
    };
  });
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
  const relationScenarios: ScenarioRelationEvidence[][] = [];

  for (const ca of aCandidates) {
    for (const cb of bCandidates) {
      const e = scoreWuxingComplement(ca, cb);
      const inter = scoreGanzhiInteractions(ca, cb);
      const r = scoreShishenMatch(ca, cb);
      const c = scoreDayunSync(ca, cb, focusYears);
      relationScenarios.push(buildScenarioRelationEvidence(ca, cb, focusYears));

      layerResults.elements.scores.push(e.score);
      layerResults.interactions.scores.push(inter.score);
      layerResults.roles.scores.push(r.score);
      layerResults.cycles.scores.push(c.score);

      const recordScenarioNotes = (id: CompatibilityLayerId, notes: CompatibilityNote[]) => {
        // Legacy v1 prose aggregation is retained only for the capped UI summary.
        // Relation Intelligence v2 aggregates semantic facts separately by stable ID.
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

  const toPublicChart = (
    chart: InternalBaziChart,
    label: 'A' | 'B',
    timeKnown: boolean,
    birthDate: string
  ): BaziPublicChart => {
    const birthYear = parseInt(birthDate.split('-')[0], 10) || undefined;
    const currentAge = birthYear ? currentYear - birthYear : undefined;

    return {
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
      timeKnown,
      birthYear,
      currentAge
    };
  };

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

  const relationEvidence = aggregateRelationEvidence(relationScenarios);
  const dimensionProfiles = buildRelationDimensionProfiles(relationEvidence, relationScenarios);
  const directionalProfile = buildDirectionalRelationProfile(relationEvidence, relationScenarios);
  const branchInteractionMatrix = buildBranchInteractionMatrix(relationEvidence);

  return {
    engineVersion: 'bazi-love-ts-v1',
    relationEngineVersion: 'relation-intelligence-v2',
    confidence,
    evaluatedScenarios: aCandidates.length * bCandidates.length,
    focusYears,
    charts: [
      toPublicChart(repChartA, 'A', aHasTime, personA.birthDate),
      toPublicChart(repChartB, 'B', bHasTime, personB.birthDate)
    ],
    layers,
    strengths,
    frictions,
    assumptions,
    yearlyTimeline: calculateYearlyTimeline(repChartA, repChartB, focusYears),
    relationEvidence,
    dimensionProfiles,
    directionalProfile,
    branchInteractionMatrix
  };
}
