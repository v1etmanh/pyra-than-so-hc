/**
 * Utility mapping for Numerology indicator illustrations from /public/images/numerology/
 */

export interface NumerologyImageInfo {
  src: string;
  alt: string;
  category: string;
}

/**
 * Normalizes an indicator key or category name
 */
function normalizeKey(key: string): string {
  const clean = (key || '').toLowerCase().trim();
  if (clean.includes('lifepath') || clean.includes('đường đời') || clean === 'walksoflife') return 'lifepath';
  if (clean.includes('mission') || clean.includes('sứ mệnh') || clean.includes('destiny')) return 'mission';
  if (clean.includes('soul') || clean.includes('linh hồn')) return 'soul';
  if (clean.includes('personality') || clean.includes('nhân cách')) return 'personality';
  if (clean.includes('birthday') || clean.includes('ngày sinh') || clean === 'dateofbirth') return 'birthday';
  if (clean.includes('mature') || clean.includes('trưởng thành')) return 'maturity';
  if (clean.includes('balance') || clean.includes('cân bằng')) return 'balance';
  if (clean.includes('rational') || clean.includes('lý trí')) return 'rational';
  if (clean.includes('subconscious') || clean.includes('tiềm thức')) return 'subconscious';
  if (clean.includes('passion') || clean.includes('đam mê')) return 'passion';
  if (clean.includes('attitude') || clean.includes('thái độ')) return 'attitude';
  if (clean.includes('karmic') || clean.includes('nợ nghiệp')) return 'karmic';
  if (clean.includes('missing') || clean.includes('số thiếu')) return 'missing';
  if (clean.includes('bridge') || clean.includes('cầu nối')) return 'bridge';
  if (clean.includes('year') || clean.includes('năm')) return 'year';
  if (clean.includes('month') || clean.includes('tháng')) return 'month';
  if (clean.includes('day') || clean.includes('ngày cá nhân')) return 'day';
  if (clean.includes('pinnacle') || clean.includes('đỉnh cao') || clean === 'way') return 'pinnacle';
  if (clean.includes('challenge') || clean.includes('thách thức')) return 'challenge';
  if (clean.includes('arrow') || clean.includes('mũi tên')) return 'arrow';
  if (clean.includes('isolated') || clean.includes('cô lập')) return 'isolated';
  if (clean.includes('matrix') || clean.includes('biểu đồ')) return 'matrix';
  return clean;
}

/**
 * Resolves the primary illustration image path for an indicator
 */
export function getNumerologyImagePath(
  indicatorKey?: string,
  value?: unknown,
  title?: string
): string | null {
  const category = normalizeKey(indicatorKey || title || "");
  const valStr = String(value ?? "").trim();

  // Extract first number if present
  const numMatch = valStr.match(/\b\d+\b/);
  const num = numMatch ? parseInt(numMatch[0], 10) : null;

  switch (category) {
    case 'lifepath': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 22, 33];
        if (valid.includes(num)) return `/images/numerology/lifepath/lifepath_${num}.png`;
      }
      return `/images/numerology/lifepath/lifepath_1.png`;
    }

    case 'mission': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
        if (valid.includes(num)) return `/images/numerology/mission/mission_${num}.png`;
      }
      return `/images/numerology/mission/mission_1.png`;
    }

    case 'soul': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22];
        if (valid.includes(num)) return `/images/numerology/soul/soul_${num}.png`;
      }
      return `/images/numerology/soul/soul_1.png`;
    }

    case 'personality': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22];
        if (valid.includes(num)) return `/images/numerology/personality/personality_${num}.png`;
      }
      return `/images/numerology/personality/personality_1.png`;
    }

    case 'birthday': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 22];
        if (valid.includes(num)) return `/images/numerology/birthday/birthday_${num}.png`;
      }
      return `/images/numerology/birthday/birthday_1.png`;
    }

    case 'maturity': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22];
        if (valid.includes(num)) return `/images/numerology/maturity/maturity_${num}.png`;
      }
      return `/images/numerology/maturity/maturity_1.png`;
    }

    case 'balance': {
      if (num !== null && num >= 1 && num <= 9) {
        return `/images/numerology/balance/balance_${num}.png`;
      }
      return `/images/numerology/balance/balance_1.png`;
    }

    case 'rational': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22];
        if (valid.includes(num)) return `/images/numerology/rational/rational_${num}.png`;
      }
      return `/images/numerology/rational/rational_1.png`;
    }

    case 'subconscious': {
      if (num !== null && num >= 3 && num <= 9) {
        return `/images/numerology/subconscious/subconscious_${num}.png`;
      }
      return `/images/numerology/subconscious/subconscious_6.png`;
    }

    case 'passion': {
      if (num !== null && num >= 1 && num <= 9) {
        return `/images/numerology/passion/passion_${num}.png`;
      }
      return `/images/numerology/passion/passion_1.png`;
    }

    case 'attitude': {
      if (num !== null && num >= 1 && num <= 9) {
        return `/images/numerology/attitude/attitude_${num}.png`;
      }
      return `/images/numerology/attitude/attitude_1.png`;
    }

    case 'karmic': {
      if (valStr.includes('13') || valStr.includes('13/4')) return `/images/numerology/karmic/karmic_13_4.png`;
      if (valStr.includes('14') || valStr.includes('14/5')) return `/images/numerology/karmic/karmic_14_5.png`;
      if (valStr.includes('16') || valStr.includes('16/7')) return `/images/numerology/karmic/karmic_16_7.png`;
      if (valStr.includes('19') || valStr.includes('19/1')) return `/images/numerology/karmic/karmic_19_1.png`;
      return `/images/numerology/karmic/karmic_13_4.png`;
    }

    case 'missing': {
      if (num !== null && num >= 1 && num <= 9) {
        return `/images/numerology/missing/missing_${num}.png`;
      }
      return `/images/numerology/missing/missing_1.png`;
    }

    case 'bridge': {
      if (num !== null && num >= 0 && num <= 8) {
        return `/images/numerology/bridge/bridge_${num}.png`;
      }
      return `/images/numerology/bridge/bridge_0.png`;
    }

    case 'year': {
      if (num !== null && num >= 1 && num <= 9) {
        return `/images/numerology/year/year_${num}.png`;
      }
      return `/images/numerology/year/year_1.png`;
    }

    case 'month': {
      if (num !== null && num >= 1 && num <= 9) {
        return `/images/numerology/month/month_${num}.png`;
      }
      return `/images/numerology/month/month_1.png`;
    }

    case 'day': {
      if (num !== null && num >= 1 && num <= 9) {
        return `/images/numerology/day/day_${num}.png`;
      }
      return `/images/numerology/day/day_1.png`;
    }

    case 'pinnacle': {
      if (num !== null) {
        const valid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        if (valid.includes(num)) return `/images/numerology/pinnacle/pinnacle_${num}.png`;
      }
      return `/images/numerology/pinnacle/pinnacle_1.png`;
    }

    case 'challenge': {
      if (num !== null && num >= 0 && num <= 8) {
        return `/images/numerology/challenge/challenge_${num}.png`;
      }
      return `/images/numerology/challenge/challenge_0.png`;
    }

    case 'arrow': {
      if (valStr.includes('1_2_3') || valStr.includes('1-2-3')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_1_2_3_emp.png' : '/images/numerology/arrow/arrow_1_2_3_str.png';
      }
      if (valStr.includes('1_4_7') || valStr.includes('1-4-7')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_1_4_7_emp.png' : '/images/numerology/arrow/arrow_1_4_7_str.png';
      }
      if (valStr.includes('1_5_9') || valStr.includes('1-5-9')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_1_5_9_emp.png' : '/images/numerology/arrow/arrow_1_5_9_str.png';
      }
      if (valStr.includes('2_5_8') || valStr.includes('2-5-8')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_2_5_8_emp.png' : '/images/numerology/arrow/arrow_2_5_8_str.png';
      }
      if (valStr.includes('3_5_7') || valStr.includes('3-5-7')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_3_5_7_emp.png' : '/images/numerology/arrow/arrow_3_5_7_str.png';
      }
      if (valStr.includes('3_6_9') || valStr.includes('3-6-9')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_3_6_9_emp.png' : '/images/numerology/arrow/arrow_3_6_9_str.png';
      }
      if (valStr.includes('4_5_6') || valStr.includes('4-5-6')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_4_5_6_emp.png' : '/images/numerology/arrow/arrow_4_5_6_str.png';
      }
      if (valStr.includes('7_8_9') || valStr.includes('7-8-9')) {
        return valStr.includes('emp') || valStr.includes('Trống') ? '/images/numerology/arrow/arrow_7_8_9_emp.png' : '/images/numerology/arrow/arrow_7_8_9_str.png';
      }
      return '/images/numerology/arrow/arrow_1_5_9_str.png';
    }

    case 'matrix':
      return `/images/numerology/matrix/name_chart_matrix.png`;

    default:
      return null;
  }
}
