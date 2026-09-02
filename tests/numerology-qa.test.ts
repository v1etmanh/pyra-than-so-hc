import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MOCK_NUMEROLOGY_INDICATORS } from '../mocks/numerology-indicators.ts';
import { MOCK_USER_PROFILE_24, normalizeNumerologyProfile } from '../mocks/numerology-profile.ts';
import { buildMockAnswer, searchMockIndicators } from '../utils/numerology-qa.ts';

test('mock catalog contains exactly 24 unique indicators', () => {
  assert.equal(MOCK_NUMEROLOGY_INDICATORS.length, 24);
  assert.equal(new Set(MOCK_NUMEROLOGY_INDICATORS.map((item) => item.key)).size, 24);
});

test('default profile supplies all 24 indicator values', () => {
  const normalized = normalizeNumerologyProfile(undefined);
  assert.equal(normalized.usedMock, true);
  assert.equal(Object.keys(normalized.profile).length, 24);
  assert.deepEqual(normalized.profile, MOCK_USER_PROFILE_24);
});

test('partial real profile is completed with mock values', () => {
  const normalized = normalizeNumerologyProfile({ walksOfLife: 9, soul: '5' });
  assert.equal(normalized.usedMock, false);
  assert.equal(normalized.profile.walksOfLife, 9);
  assert.equal(normalized.profile.soul, '5');
  assert.equal(normalized.profile.mission, MOCK_USER_PROFILE_24.mission);
  assert.equal(Object.keys(normalized.profile).length, 24);
});

test('search matches Vietnamese names without diacritics', () => {
  const results = searchMockIndicators('duong doi');
  assert.equal(results[0]?.key, 'walksOfLife');
});

test('search matches English aliases', () => {
  const results = searchMockIndicators('personal year');
  assert.equal(results[0]?.key, 'yearIndividual');
});

test('search respects result limit', () => {
  assert.equal(searchMockIndicators('number', 3).length <= 3, true);
});

test('mock answer uses selected indicator and value', () => {
  const answer = buildMockAnswer({
    question: 'Linh hồn của tôi có ý nghĩa gì?',
    indicator: MOCK_NUMEROLOGY_INDICATORS.find((item) => item.key === 'soul'),
    indicatorValue: 9,
    locale: 'vi'
  });
  assert.equal(answer.mock, true);
  assert.equal(answer.source, 'mock-24-indicators');
  assert.equal(answer.indicator.key, 'soul');
  assert.match(answer.answer, /Linh hồn/);
  assert.match(answer.answer, /\(9\)/);
});

test('unmatched questions fail clearly', () => {
  assert.throws(
    () => buildMockAnswer({ question: 'Câu hỏi không thuộc catalog này' }),
    /Không tìm thấy chỉ số/
  );
});
