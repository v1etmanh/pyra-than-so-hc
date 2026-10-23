import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_FOLLOW_UP_QUESTIONS,
  MAX_SESSION_QUESTIONS,
  canAskSessionFollowUp,
  countUserMessages,
  getRemainingSessionQuestions,
  getSessionQuestionCount,
  hasReachedSessionQuestionLimit
} from '../lib/chat/session-limits.ts';

test('a root reading starts with ten follow-up questions remaining', () => {
  assert.equal(MAX_SESSION_QUESTIONS, 10);
  assert.equal(MAX_FOLLOW_UP_QUESTIONS, 10);
  assert.equal(getSessionQuestionCount(0), 0);
  assert.equal(getRemainingSessionQuestions(0), 10);
  assert.equal(canAskSessionFollowUp(0), true);
});

test('a session stops after ten follow-up questions', () => {
  assert.equal(getSessionQuestionCount(10), 10);
  assert.equal(getRemainingSessionQuestions(10), 0);
  assert.equal(canAskSessionFollowUp(10), false);
  assert.equal(hasReachedSessionQuestionLimit(9), false);
  assert.equal(hasReachedSessionQuestionLimit(10), true);
});

test('user message counting ignores assistant messages', () => {
  assert.equal(countUserMessages([
    { role: 'user' },
    { role: 'assistant' },
    { role: 'user' },
    { role: 'assistant' }
  ]), 2);
});

test('question progress is clamped for malformed historical values', () => {
  assert.equal(getSessionQuestionCount(-3), 0);
  assert.equal(getSessionQuestionCount(99), 10);
  assert.equal(getRemainingSessionQuestions(99), 0);
});
