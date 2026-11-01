import assert from 'node:assert/strict';
import test from 'node:test';

import { buildFollowUpSystemPrompt } from './follow-up-prompt.ts';
import { createCurrentTimeContext } from '../spiritual-agent/time-context.ts';

test('couple follow-up uses profile names instead of assuming who is self', () => {
  const prompt = buildFollowUpSystemPrompt({
    intent: 'love_match',
    profileName: 'Minh Anh',
    birthDate: '1996-04-12',
    isCouple: true,
    partnerProfile: { fullName: 'Gia Huy', birthDate: '1994-09-08' },
  }, 2, createCurrentTimeContext('Asia/Bangkok', new Date('2026-10-24T12:00:00.000Z')));

  assert.match(prompt, /Đây là bài đọc của hai hồ sơ: Minh Anh và Gia Huy/);
  assert.match(prompt, /không dùng “bạn”, “người ấy”, “hai bạn”/i);
  assert.doesNotMatch(prompt, /gọi người dùng là “bạn”/i);
});

test('follow-up appends an English-only output override for the English locale', () => {
  const timeContext = createCurrentTimeContext('Asia/Bangkok', new Date('2026-10-24T12:00:00.000Z'));
  const englishPrompt = buildFollowUpSystemPrompt({}, 2, timeContext, 'en');
  const vietnamesePrompt = buildFollowUpSystemPrompt({}, 2, timeContext, 'vi');

  assert.match(englishPrompt, /OUTPUT LANGUAGE OVERRIDE:/);
  assert.match(englishPrompt, /Respond entirely in English/);
  assert.doesNotMatch(vietnamesePrompt, /OUTPUT LANGUAGE OVERRIDE:/);
});
