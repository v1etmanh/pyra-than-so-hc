import { removeAccents } from '../../functions/removeAccents.ts';

/**
 * Pythagorean alphabet to single digit mapping:
 * 1: A, J, S
 * 2: B, K, T
 * 3: C, L, U
 * 4: D, M, V
 * 5: E, N, W
 * 6: F, O, X
 * 7: G, P, Y
 * 8: H, Q, Z
 * 9: I, R
 */
export const PYTHAGOREAN_TABLE: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9
};

export const STANDARD_VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Normalizes full name:
 * 1. Removes Vietnamese accents
 * 2. Removes non-alphabetic characters (dashes, numbers, apostrophes, etc.)
 * 3. Normalizes whitespace and uppercases
 */
export function normalizeName(rawName: string): string {
  if (!rawName) return '';
  const withoutAccents = removeAccents(rawName);
  const onlyLettersAndSpaces = withoutAccents.replace(/[^a-zA-Z\s]/g, ' ');
  return onlyLettersAndSpaces.replace(/\s+/g, ' ').trim().toUpperCase();
}

/**
 * Analyzes whether a character at a given position within a word is a vowel or consonant.
 * Rule for 'Y':
 * - In a word with NO other standard vowels (A, E, I, O, U), 'Y' functions as a VOWEL.
 * - In a word that HAS at least one other standard vowel, 'Y' functions as a CONSONANT.
 */
export function isVowel(char: string, word: string): boolean {
  const upperChar = char.toUpperCase();
  if (STANDARD_VOWELS.has(upperChar)) return true;
  if (upperChar !== 'Y') return false;

  // Evaluate Y based on the rest of the word
  const upperWord = word.toUpperCase();
  const hasStandardVowel = upperWord.split('').some((c) => STANDARD_VOWELS.has(c));
  // If no standard vowel exists, Y must be the vowel of the syllable/word
  return !hasStandardVowel;
}

/**
 * Reduces a number by repeatedly adding its digits.
 * - If keepMaster is true, stops reduction at 11, 22, 33.
 * - 10 always reduces to 1 (1 + 0 = 1).
 */
export function reduceDigits(
  num: number,
  keepMaster: boolean = true
): { result: number; history: number[] } {
  let current = Math.abs(Math.floor(num));
  const history: number[] = [current];

  while (current > 9) {
    if (keepMaster && (current === 11 || current === 22 || current === 33)) {
      break;
    }
    // Sum digits
    const digits = String(current)
      .split('')
      .map((d) => parseInt(d, 10));
    current = digits.reduce((sum, d) => sum + d, 0);
    history.push(current);
  }

  return { result: current, history };
}

export interface CalculationResult {
  value: number;
  isMaster: boolean;
  stepsVi: string[];
  stepsEn: string[];
}

/**
 * 1. Life Path Number Calculator
 * Method: Reduce Month, Day, and Year separately, then sum and reduce.
 * Preserves 11, 22, 33. Rút gọn 10 -> 1.
 */
export function calculateLifePath(day: number, month: number, year: number): CalculationResult {
  const rMonth = reduceDigits(month, false).result;
  const rDay = reduceDigits(day, false).result;
  const rYear = reduceDigits(year, false).result;
  const total = rMonth + rDay + rYear;
  const { result, history } = reduceDigits(total, true);

  const isMaster = result === 11 || result === 22 || result === 33;

  const stepsVi = [
    `Rút gọn Tháng sinh: ${month} → ${rMonth}`,
    `Rút gọn Ngày sinh: ${day} → ${rDay}`,
    `Rút gọn Năm sinh: ${year} → ${rYear}`,
    `Cộng 3 thành phần: ${rMonth} + ${rDay} + ${rYear} = ${total}`,
    total !== result
      ? `Rút gọn tổng: ${history.join(' → ')}${isMaster ? ' (Giữ số bậc thầy Master Number)' : ''}`
      : `Số chủ đạo hoàn tất: ${result}${isMaster ? ' (Master Number)' : ''}`
  ];

  const stepsEn = [
    `Reduce Birth Month: ${month} → ${rMonth}`,
    `Reduce Birth Day: ${day} → ${rDay}`,
    `Reduce Birth Year: ${year} → ${rYear}`,
    `Sum components: ${rMonth} + ${rDay} + ${rYear} = ${total}`,
    total !== result
      ? `Reduce total: ${history.join(' → ')}${isMaster ? ' (Preserve Master Number)' : ''}`
      : `Final Life Path: ${result}${isMaster ? ' (Master Number)' : ''}`
  ];

  return { value: result, isMaster, stepsVi, stepsEn };
}

/**
 * 2. Expression / Destiny Number Calculator
 * Sum of all letters in the full birth name using Pythagorean table.
 * Preserves 11, 22, 33.
 */
export function calculateExpression(fullName: string): CalculationResult {
  const norm = normalizeName(fullName);
  const words = norm.split(' ').filter(Boolean);

  let totalSum = 0;
  const wordBreakdownsVi: string[] = [];
  const wordBreakdownsEn: string[] = [];

  for (const w of words) {
    const letters = w.split('');
    const vals = letters.map((l) => PYTHAGOREAN_TABLE[l] || 0);
    const wordSum = vals.reduce((a, b) => a + b, 0);
    totalSum += wordSum;
    const mathStr = letters.map((l, i) => `${l}(${vals[i]})`).join(' + ');
    wordBreakdownsVi.push(`${w}: ${mathStr} = ${wordSum}`);
    wordBreakdownsEn.push(`${w}: ${mathStr} = ${wordSum}`);
  }

  const { result, history } = reduceDigits(totalSum, true);
  const isMaster = result === 11 || result === 22 || result === 33;

  const stepsVi = [
    `Chuẩn hóa họ tên: "${norm}"`,
    ...wordBreakdownsVi,
    `Tổng điểm toàn bộ chữ cái: ${totalSum}`,
    totalSum !== result
      ? `Rút gọn tổng: ${history.join(' → ')}${isMaster ? ' (Giữ số bậc thầy Master Number)' : ''}`
      : `Số Sứ Mệnh hoàn tất: ${result}`
  ];

  const stepsEn = [
    `Normalized full name: "${norm}"`,
    ...wordBreakdownsEn,
    `Total sum of all letters: ${totalSum}`,
    totalSum !== result
      ? `Reduce total: ${history.join(' → ')}${isMaster ? ' (Preserve Master Number)' : ''}`
      : `Final Expression Number: ${result}`
  ];

  return { value: result, isMaster, stepsVi, stepsEn };
}

/**
 * 3. Soul Urge / Heart's Desire Number Calculator
 * Sum of all VOWELS in the full birth name (applying 'Y' rule).
 * Preserves 11, 22, 33.
 */
export function calculateSoulUrge(fullName: string): CalculationResult {
  const norm = normalizeName(fullName);
  const words = norm.split(' ').filter(Boolean);

  let totalSum = 0;
  const vowelListVi: string[] = [];
  const vowelListEn: string[] = [];

  for (const w of words) {
    const letters = w.split('');
    const vowelsInWord = letters.filter((l) => isVowel(l, w));
    const vals = vowelsInWord.map((l) => PYTHAGOREAN_TABLE[l] || 0);
    const wSum = vals.reduce((a, b) => a + b, 0);
    totalSum += wSum;

    if (vowelsInWord.length > 0) {
      const mathStr = vowelsInWord.map((l, i) => `${l}(${vals[i]})`).join(' + ');
      vowelListVi.push(`${w}: [${vowelsInWord.join(', ')}] → ${mathStr} = ${wSum}`);
      vowelListEn.push(`${w}: [${vowelsInWord.join(', ')}] → ${mathStr} = ${wSum}`);
    } else {
      vowelListVi.push(`${w}: Không có nguyên âm → 0`);
      vowelListEn.push(`${w}: No vowels → 0`);
    }
  }

  const { result, history } = reduceDigits(totalSum, true);
  const isMaster = result === 11 || result === 22 || result === 33;

  const stepsVi = [
    `Chuẩn hóa họ tên: "${norm}"`,
    `Tách nguyên âm theo quy tắc Pythagoras (Y là nguyên âm khi từ không có A,E,I,O,U):`,
    ...vowelListVi,
    `Tổng điểm các nguyên âm: ${totalSum}`,
    totalSum !== result
      ? `Rút gọn: ${history.join(' → ')}${isMaster ? ' (Giữ số bậc thầy Master Number)' : ''}`
      : `Số Linh Hồn hoàn tất: ${result}`
  ];

  const stepsEn = [
    `Normalized full name: "${norm}"`,
    `Extract vowels per Pythagorean convention (Y is vowel if no A,E,I,O,U in word):`,
    ...vowelListEn,
    `Total sum of vowels: ${totalSum}`,
    totalSum !== result
      ? `Reduce total: ${history.join(' → ')}${isMaster ? ' (Preserve Master Number)' : ''}`
      : `Final Soul Urge Number: ${result}`
  ];

  return { value: result, isMaster, stepsVi, stepsEn };
}

/**
 * 4. Personality Number Calculator
 * Sum of all CONSONANTS in the full birth name (applying 'Y' rule).
 * Preserves 11, 22, 33.
 */
export function calculatePersonality(fullName: string): CalculationResult {
  const norm = normalizeName(fullName);
  const words = norm.split(' ').filter(Boolean);

  let totalSum = 0;
  const consListVi: string[] = [];
  const consListEn: string[] = [];

  for (const w of words) {
    const letters = w.split('');
    const consonantsInWord = letters.filter((l) => !isVowel(l, w));
    const vals = consonantsInWord.map((l) => PYTHAGOREAN_TABLE[l] || 0);
    const wSum = vals.reduce((a, b) => a + b, 0);
    totalSum += wSum;

    if (consonantsInWord.length > 0) {
      const mathStr = consonantsInWord.map((l, i) => `${l}(${vals[i]})`).join(' + ');
      consListVi.push(`${w}: [${consonantsInWord.join(', ')}] → ${mathStr} = ${wSum}`);
      consListEn.push(`${w}: [${consonantsInWord.join(', ')}] → ${mathStr} = ${wSum}`);
    } else {
      consListVi.push(`${w}: Không có phụ âm → 0`);
      consListEn.push(`${w}: No consonants → 0`);
    }
  }

  const { result, history } = reduceDigits(totalSum, true);
  const isMaster = result === 11 || result === 22 || result === 33;

  const stepsVi = [
    `Chuẩn hóa họ tên: "${norm}"`,
    `Tách phụ âm theo quy tắc Pythagoras (Y là phụ âm khi từ đã có A,E,I,O,U):`,
    ...consListVi,
    `Tổng điểm các phụ âm: ${totalSum}`,
    totalSum !== result
      ? `Rút gọn: ${history.join(' → ')}${isMaster ? ' (Giữ số bậc thầy Master Number)' : ''}`
      : `Số Nhân Cách hoàn tất: ${result}`
  ];

  const stepsEn = [
    `Normalized full name: "${norm}"`,
    `Extract consonants per Pythagorean convention (Y is consonant if A,E,I,O,U present):`,
    ...consListEn,
    `Total sum of consonants: ${totalSum}`,
    totalSum !== result
      ? `Reduce total: ${history.join(' → ')}${isMaster ? ' (Preserve Master Number)' : ''}`
      : `Final Personality Number: ${result}`
  ];

  return { value: result, isMaster, stepsVi, stepsEn };
}

/**
 * 5. Personal Year Number Calculator
 * Formula: Reduced Birth Day + Reduced Birth Month + Reduced Target Year.
 * Personal Year is STRICTLY 1 to 9 (Never keeps Master numbers).
 */
export function calculatePersonalYear(
  day: number,
  month: number,
  targetYear: number
): CalculationResult {
  const rDay = reduceDigits(day, false).result;
  const rMonth = reduceDigits(month, false).result;
  const rYear = reduceDigits(targetYear, false).result;

  const total = rDay + rMonth + rYear;
  const { result, history } = reduceDigits(total, false); // strictly 1-9

  const stepsVi = [
    `Rút gọn Ngày sinh: ${day} → ${rDay}`,
    `Rút gọn Tháng sinh: ${month} → ${rMonth}`,
    `Rút gọn Năm xem vận hạn: ${targetYear} → ${rYear}`,
    `Cộng 3 chỉ số: ${rDay} + ${rMonth} + ${rYear} = ${total}`,
    total !== result
      ? `Rút gọn về chu kỳ 1–9: ${history.join(' → ')}`
      : `Năm cá nhân của bạn là: ${result} (Chu kỳ 1–9)`
  ];

  const stepsEn = [
    `Reduce Birth Day: ${day} → ${rDay}`,
    `Reduce Birth Month: ${month} → ${rMonth}`,
    `Reduce Target Year: ${targetYear} → ${rYear}`,
    `Sum components: ${rDay} + ${rMonth} + ${rYear} = ${total}`,
    total !== result
      ? `Reduce to 1–9 cycle: ${history.join(' → ')}`
      : `Your Personal Year is: ${result} (1–9 cycle)`
  ];

  return { value: result, isMaster: false, stepsVi, stepsEn };
}

/**
 * 6. Birthday Number Calculator
 * Formula: Day of birth (1–31).
 * If day is 11 or 22, it remains a Master number.
 * Otherwise reduced to single digit 1–9.
 */
export function calculateBirthdayNumber(day: number): CalculationResult {
  if (day === 11 || day === 22) {
    return {
      value: day,
      isMaster: true,
      stepsVi: [`Ngày sinh của bạn là ngày ${day} (Số bậc thầy Master Number được giữ nguyên).`],
      stepsEn: [`Your day of birth is ${day} (Preserved as a sacred Master Number).`]
    };
  }

  const { result, history } = reduceDigits(day, false);
  const stepsVi = [
    `Ngày sinh: ${day}`,
    day > 9 ? `Rút gọn ngày sinh: ${history.join(' → ')}` : `Số ngày sinh hoàn tất: ${result}`
  ];

  const stepsEn = [
    `Birth Day: ${day}`,
    day > 9 ? `Reduce birth day: ${history.join(' → ')}` : `Final Birthday Number: ${result}`
  ];

  return { value: result, isMaster: false, stepsVi, stepsEn };
}

/**
 * 7. Maturity / Realization Number Calculator
 * Formula: Life Path Number + Expression Number.
 * Preserves 11, 22, 33.
 */
export function calculateMaturity(
  day: number,
  month: number,
  year: number,
  fullName: string
): CalculationResult {
  const lp = calculateLifePath(day, month, year);
  const exp = calculateExpression(fullName);
  const total = lp.value + exp.value;
  const { result, history } = reduceDigits(total, true);
  const isMaster = result === 11 || result === 22 || result === 33;

  const stepsVi = [
    `Số Đường Đời (Life Path): ${lp.value}`,
    `Số Sứ Mệnh (Expression): ${exp.value}`,
    `Cộng 2 chỉ số cốt lõi: ${lp.value} + ${exp.value} = ${total}`,
    total !== result
      ? `Rút gọn: ${history.join(' → ')}${isMaster ? ' (Giữ số bậc thầy Master Number)' : ''}`
      : `Số Trưởng Thành hoàn tất: ${result}${isMaster ? ' (Master Number)' : ''}`
  ];

  const stepsEn = [
    `Life Path Number: ${lp.value}`,
    `Expression Number: ${exp.value}`,
    `Sum core indicators: ${lp.value} + ${exp.value} = ${total}`,
    total !== result
      ? `Reduce total: ${history.join(' → ')}${isMaster ? ' (Preserve Master Number)' : ''}`
      : `Final Maturity Number: ${result}${isMaster ? ' (Master Number)' : ''}`
  ];

  return { value: result, isMaster, stepsVi, stepsEn };
}
