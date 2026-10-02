import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentUserPrompt } from '../../lib/spiritual-agent/agent-prompts.ts';

test('chat agent prompt adds supplied resonance context alongside chosen indicators and drawn cards', () => {
  const prompt = buildAgentUserPrompt({
    message: 'Nên nhận công việc mới không?',
    p1: { fullName: 'Người thử', birthDate: '1990-01-01' },
    isCouple: false,
    spreadContext: 'Trải bài một lá',
    cards: [{ card: { nameVi: 'Kẻ Khờ' }, isReversed: true, position: { nameVi: 'Hiện tại' } }],
    selectedIndicators: [{ key: 'walksOfLife', name: 'Đường đời', value: 1 }],
    resonanceContext: 'Synergy đã tính: Kẻ Khờ × Đường đời; bằng chứng “khởi đầu”.'
  });
  assert.match(prompt, /Kẻ Khờ/);
  assert.match(prompt, /Đường đời/);
  assert.match(prompt, /Synergy đã tính/);
  assert.match(prompt, /khởi đầu/);
});

test('chat agent prompt omits resonance block for couple readings', () => {
  const prompt = buildAgentUserPrompt({
    message: 'Hai người hợp nhau không?',
    p1: { fullName: 'A', birthDate: '1990-01-01' },
    p2: { fullName: 'B', birthDate: '1991-01-01' },
    isCouple: true,
    resonanceContext: 'Không được đưa vào prompt ghép đôi.'
  });
  assert.doesNotMatch(prompt, /Không được đưa vào prompt ghép đôi/);
});
