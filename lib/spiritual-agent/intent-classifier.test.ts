import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyFallbackIntent } from './intent-classifier.ts';

test('recognizes a bare action choice without requiring “nên”', () => {
  assert.equal(classifyFallbackIntent('Học tiếp hay ngủ sớm'), 'two_choices');
  assert.equal(classifyFallbackIntent('Tôi nhắn lại hay chờ thêm?'), 'two_choices');
});

test('does not mistake habitual “hay” statements for choices', () => {
  assert.equal(classifyFallbackIntent('Tôi hay lo và suy nghĩ quá nhiều'), 'general');
  assert.equal(classifyFallbackIntent('Mình hay bị mất ngủ'), 'general');
});

test('keeps non-choice intent precedence', () => {
  assert.equal(classifyFallbackIntent('Hôm nay tôi nên mặc màu gì?'), 'color_guidance');
  assert.equal(classifyFallbackIntent('Ba tháng tới công việc ra sao?'), 'timing_trajectory');
});
