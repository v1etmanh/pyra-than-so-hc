import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeName,
  isVowel,
  reduceDigits,
  calculateLifePath,
  calculateExpression,
  calculateSoulUrge,
  calculatePersonality,
  calculatePersonalYear,
  calculateBirthdayNumber,
  calculateMaturity,
  PYTHAGOREAN_TABLE
} from '../lib/numerology/calculator-engine.ts';

test('normalizeName correctly strips Vietnamese accents, numbers, and special symbols', () => {
  assert.equal(normalizeName('Nguyễn Thị Thúy Hằng'), 'NGUYEN THI THUY HANG');
  assert.equal(normalizeName('Trần-Văn An 123!@#'), 'TRAN VAN AN');
  assert.equal(normalizeName('   Lê    Văn   Sỹ   '), 'LE VAN SY');
  assert.equal(normalizeName('Mary-Jane O\'Connor'), 'MARY JANE O CONNOR');
});

test('isVowel correctly applies the Pythagorean Y-rule', () => {
  // Y in words with NO other vowels is a VOWEL
  assert.equal(isVowel('Y', 'MY'), true);
  assert.equal(isVowel('Y', 'LY'), true);
  assert.equal(isVowel('Y', 'THY'), true);
  assert.equal(isVowel('Y', 'SY'), true);
  assert.equal(isVowel('Y', 'LYNN'), true);

  // Y in words WITH other vowels is a CONSONANT
  assert.equal(isVowel('Y', 'NGUYEN'), false);
  assert.equal(isVowel('Y', 'YEN'), false);
  assert.equal(isVowel('Y', 'BRYAN'), false);
  assert.equal(isVowel('Y', 'MAY'), false);
  assert.equal(isVowel('Y', 'ROYAL'), false);

  // Standard vowels are always vowels
  assert.equal(isVowel('A', 'CAT'), true);
  assert.equal(isVowel('E', 'BED'), true);
  assert.equal(isVowel('I', 'SIT'), true);
  assert.equal(isVowel('O', 'HOT'), true);
  assert.equal(isVowel('U', 'SUN'), true);

  // Standard consonants are always consonants
  assert.equal(isVowel('B', 'BED'), false);
  assert.equal(isVowel('T', 'CAT'), false);
});

test('reduceDigits reduces numbers and preserves Master numbers 11, 22, 33', () => {
  // 10 must always reduce to 1 (spec requirement: bỏ trường hợp đặc biệt 10)
  assert.equal(reduceDigits(10, true).result, 1);
  assert.equal(reduceDigits(10, false).result, 1);

  // Master numbers
  assert.equal(reduceDigits(11, true).result, 11);
  assert.equal(reduceDigits(22, true).result, 22);
  assert.equal(reduceDigits(33, true).result, 33);

  // Non-master numbers
  assert.equal(reduceDigits(28, true).result, 1); // 28 -> 10 -> 1
  assert.equal(reduceDigits(44, true).result, 8); // 44 -> 8

  // When keepMaster is false
  assert.equal(reduceDigits(11, false).result, 2);
  assert.equal(reduceDigits(22, false).result, 4);
  assert.equal(reduceDigits(33, false).result, 6);
});

test('calculateLifePath correctly computes Life Path and step breakdowns', () => {
  // Test date producing 11: 17/11/1990 (Month 11->2, Day 17->8, Year 1990->1) -> 2 + 8 + 1 = 11
  const res11 = calculateLifePath(17, 11, 1990);
  assert.equal(res11.value, 11);
  assert.equal(res11.isMaster, true);
  assert.ok(res11.stepsVi.length >= 4);
  assert.ok(res11.stepsEn.length >= 4);

  // Test date reducing 10 -> 1: e.g. 1/1/1988 (1 + 1 + 8 = 10 -> 1)
  const res1 = calculateLifePath(1, 1, 1988);
  assert.equal(res1.value, 1);
  assert.equal(res1.isMaster, false);
});

test('calculateExpression correctly computes Destiny number from full name', () => {
  // "AN" -> A(1) + N(5) = 6
  const resAn = calculateExpression('An');
  assert.equal(resAn.value, 6);
  assert.equal(resAn.isMaster, false);

  // Test name with accents and whitespace
  const resNguyen = calculateExpression('  Nguyễn An  ');
  // NGUYEN: N(5)+G(7)+U(3)+Y(7)+E(5)+N(5) = 32
  // AN: A(1)+N(5) = 6
  // Total: 38 -> 3+8 = 11 (Master 11!)
  assert.equal(resNguyen.value, 11);
  assert.equal(resNguyen.isMaster, true);
});

test('calculateSoulUrge and calculatePersonality correctly partition vowels and consonants', () => {
  const name = 'Nguyen An';
  // Vowels in "NGUYEN AN":
  // In NGUYEN: U(3), E(5) (Y is consonant here!) -> 8
  // In AN: A(1) -> 1
  // Total vowels: 8 + 1 = 9
  const soul = calculateSoulUrge(name);
  assert.equal(soul.value, 9);

  // Consonants in "NGUYEN AN":
  // In NGUYEN: N(5), G(7), Y(7), N(5) -> 24
  // In AN: N(5) -> 5
  // Total consonants: 24 + 5 = 29 -> 2 + 9 = 11 (Master 11!)
  const personality = calculatePersonality(name);
  assert.equal(personality.value, 11);
  assert.equal(personality.isMaster, true);
});

test('calculatePersonalYear is strictly restricted to 1-9 cycle', () => {
  // Day 11, Month 11, Year 2026:
  // rDay = 2, rMonth = 2, rYear = 2+0+2+6 = 10 -> 1
  // Total = 2 + 2 + 1 = 5
  const py = calculatePersonalYear(11, 11, 2026);
  assert.equal(py.value, 5);
  assert.equal(py.isMaster, false);

  // Check that a sum that would be 11 reduces to 2
  // Day 4, Month 5, Year 2027 (2+0+2+7=11->2): 4 + 5 + 2 = 11 -> 2
  const py11 = calculatePersonalYear(4, 5, 2027);
  assert.equal(py11.value, 2);
  assert.equal(py11.isMaster, false);
});

test('calculateBirthdayNumber retains 11 and 22, reduces others', () => {
  assert.equal(calculateBirthdayNumber(11).value, 11);
  assert.equal(calculateBirthdayNumber(11).isMaster, true);

  assert.equal(calculateBirthdayNumber(22).value, 22);
  assert.equal(calculateBirthdayNumber(22).isMaster, true);

  assert.equal(calculateBirthdayNumber(10).value, 1); // 10 -> 1
  assert.equal(calculateBirthdayNumber(25).value, 7); // 2 + 5 = 7
  assert.equal(calculateBirthdayNumber(29).value, 2); // 2 + 9 = 11 -> reduced to 2 (only 11th and 22nd stay master)
});

test('calculateMaturity sums Life Path and Expression', () => {
  // An born 1/1/1988:
  // LP = 1
  // Exp for "An" = 6
  // Maturity = 1 + 6 = 7
  const mat = calculateMaturity(1, 1, 1988, 'An');
  assert.equal(mat.value, 7);
  assert.equal(mat.isMaster, false);
});
