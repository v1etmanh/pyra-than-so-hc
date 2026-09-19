import test from 'node:test';
import assert from 'node:assert/strict';
import { isTrashOrMeaninglessPrompt } from '../lib/spiritual-agent/prompt-validator.ts';

test('prompt validator rejects empty, random, and no-topic messages', () => {
  for (const prompt of [undefined, 121, 'a,.', 'ta', '121', 'asdfgh', '???', 'alo alo', 'không biết hỏi gì']) {
    assert.equal(isTrashOrMeaninglessPrompt(prompt).isTrash, true, `expected ${String(prompt)} to be trash`);
  }
});

test('prompt validator preserves short meaningful Vietnamese questions', () => {
  for (const prompt of [
    'tình duyên',
    'hôm nay ăn gì',
    'sinh 12/05/1995 vận mệnh ra sao',
    'alo, tôi muốn hỏi sự nghiệp sắp tới'
  ]) {
    assert.equal(isTrashOrMeaninglessPrompt(prompt).isTrash, false, `expected ${prompt} to be valid`);
  }
});
