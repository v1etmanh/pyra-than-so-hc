import test from 'node:test';
import assert from 'node:assert/strict';
import { baziLoveReadingRequestSchema } from '../lib/bazi-love/schemas.ts';
import { evaluateBaziCompatibility } from '../lib/bazi-love/engine.ts';
import {
  buildBaziLoveInitialPrompt,
  buildBaziLoveSystemPrompt,
  buildBaziLoveFollowUpPrompt,
  redactBaziLoveUserText
} from '../lib/bazi-love/prompts.ts';

test('baziLoveReadingRequestSchema accepts valid initial request', () => {
  const payload = {
    mode: 'initial',
    people: [
      {
        name: 'Alex Rivera',
        birthDate: '1993-04-15',
        birthTime: '08:30',
        timezone: 'Asia/Ho_Chi_Minh',
        calculationSex: 'male'
      },
      {
        name: 'Jordan Lee',
        birthDate: '1995-11-20',
        timezone: 'Asia/Ho_Chi_Minh',
        calculationSex: 'female'
      }
    ],
    language: 'vi',
    question: 'Chúng tôi nên lưu ý điều gì khi chuyển về sống chung?'
  };

  const parsed = baziLoveReadingRequestSchema.parse(payload);
  assert.equal(parsed.mode, 'initial');
  assert.equal(parsed.people[0].name, 'Alex Rivera');
});

test('baziLoveReadingRequestSchema accepts valid follow-up and regenerate requests', () => {
  const people = [
    { name: 'Alex', birthDate: '1993-04-15', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'male' as const },
    { name: 'Jordan', birthDate: '1995-11-20', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'female' as const }
  ] as const;

  const followUp = baziLoveReadingRequestSchema.parse({
    mode: 'follow-up',
    people,
    language: 'en',
    question: 'How do we deal with financial decisions?',
    history: [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]
  });
  assert.equal(followUp.mode, 'follow-up');

  const regenerate = baziLoveReadingRequestSchema.parse({
    mode: 'regenerate',
    people,
    language: 'vi'
  });
  assert.equal(regenerate.mode, 'regenerate');
});

test('baziLoveReadingRequestSchema rejects invalid dates, missing names, or malformed time', () => {
  // Invalid date
  assert.throws(() => {
    baziLoveReadingRequestSchema.parse({
      mode: 'initial',
      people: [
        { name: 'A', birthDate: '15-04-1993', timezone: 'UTC', calculationSex: 'male' },
        { name: 'B', birthDate: '1995-11-20', timezone: 'UTC', calculationSex: 'female' }
      ]
    });
  });

  for (const invalidBirthDate of ['2025-02-29', '2025-02-31', '2026-99-99']) {
    assert.throws(() => {
      baziLoveReadingRequestSchema.parse({
        mode: 'initial',
        people: [
          { name: 'A', birthDate: invalidBirthDate, timezone: 'UTC', calculationSex: 'male' },
          { name: 'B', birthDate: '1995-11-20', timezone: 'UTC', calculationSex: 'female' }
        ]
      });
    });
  }

  for (const invalidBirthTime of ['24:00', '12:60', '25:99']) {
    assert.throws(() => {
      baziLoveReadingRequestSchema.parse({
        mode: 'initial',
        people: [
          { name: 'A', birthDate: '1993-04-15', birthTime: invalidBirthTime, timezone: 'UTC', calculationSex: 'male' },
          { name: 'B', birthDate: '1995-11-20', timezone: 'UTC', calculationSex: 'female' }
        ]
      });
    });
  }

  assert.throws(() => {
    baziLoveReadingRequestSchema.parse({
      mode: 'initial',
      people: [
        { name: 'A', birthDate: '1993-04-15', timezone: 'Mars/Olympus', calculationSex: 'male' },
        { name: 'B', birthDate: '1995-11-20', timezone: 'UTC', calculationSex: 'female' }
      ]
    });
  });

  // Empty name
  assert.throws(() => {
    baziLoveReadingRequestSchema.parse({
      mode: 'initial',
      people: [
        { name: '', birthDate: '1993-04-15', timezone: 'UTC', calculationSex: 'male' },
        { name: 'B', birthDate: '1995-11-20', timezone: 'UTC', calculationSex: 'female' }
      ]
    });
  });

  // Invalid calculationSex
  assert.throws(() => {
    baziLoveReadingRequestSchema.parse({
      mode: 'initial',
      people: [
        { name: 'A', birthDate: '1993-04-15', timezone: 'UTC', calculationSex: 'other' },
        { name: 'B', birthDate: '1995-11-20', timezone: 'UTC', calculationSex: 'female' }
      ]
    });
  });
});

test('Prompt generator blinds real names and raw birth timestamps', () => {
  const personA = {
    name: 'SecretNameA',
    birthDate: '1990-05-12',
    birthTime: '14:30',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'male' as const
  };
  const personB = {
    name: 'SecretNameB',
    birthDate: '1992-08-20',
    birthTime: '09:15',
    timezone: 'Asia/Ho_Chi_Minh',
    calculationSex: 'female' as const
  };

  const compat = evaluateBaziCompatibility(personA, personB, 2026);
  const promptVi = buildBaziLoveInitialPrompt(compat, 'vi', 'Một câu hỏi riêng tư');
  const promptEn = buildBaziLoveInitialPrompt(compat, 'en', 'A private question');

  // Real names must NOT be in prompt
  assert.ok(!promptVi.includes('SecretNameA'));
  assert.ok(!promptVi.includes('SecretNameB'));
  assert.ok(!promptEn.includes('SecretNameA'));
  assert.ok(!promptEn.includes('SecretNameB'));

  // Raw birth dates must NOT be in prompt
  assert.ok(!promptVi.includes('1990-05-12'));
  assert.ok(!promptVi.includes('1992-08-20'));
  assert.ok(!promptEn.includes('1990-05-12'));
  assert.ok(!promptEn.includes('1992-08-20'));

  // Blind labels must be used
  assert.ok(promptVi.includes('Người A'));
  assert.ok(promptVi.includes('Người B'));
  assert.ok(promptEn.includes('Person A'));
  assert.ok(promptEn.includes('Person B'));

  const rawQuestion = 'SecretNameA sinh 1990-05-12 lúc 14:30 có hợp SecretNameB sinh 20/08/1992 không?';
  const redacted = redactBaziLoveUserText(rawQuestion, [personA, personB], 'vi');
  assert.ok(!redacted.includes('SecretNameA'));
  assert.ok(!redacted.includes('SecretNameB'));
  assert.ok(!redacted.includes('1990-05-12'));
  assert.ok(!redacted.includes('20/08/1992'));
  assert.ok(!redacted.includes('14:30'));
  assert.match(redacted, /Người A/);
  assert.match(redacted, /Người B/);
});

test('System prompt explicitly enforces no Markdown tables and no fatalistic predictions', () => {
  const sysVi = buildBaziLoveSystemPrompt('vi');
  const sysEn = buildBaziLoveSystemPrompt('en');

  // Vi checks
  assert.match(sysVi, /không dùng bảng Markdown/i);
  assert.match(sysVi, /không phán định mệnh/i);
  assert.match(sysVi, /không suy diễn suy nghĩ/i);
  assert.match(sysVi, /nội dung không đáng tin/i);

  // En checks
  assert.match(sysEn, /Never use Markdown tables/i);
  assert.match(sysEn, /Never make fatalistic/i);
  assert.match(sysEn, /Never claim to know either person’s thoughts/i);
  assert.match(sysEn, /untrusted content/i);
});

test('English prompts use localized evidence and follow-ups retain deterministic context', () => {
  const people = [
    { name: 'Alex', birthDate: '1993-04-15', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'male' as const },
    { name: 'Jordan', birthDate: '1995-11-20', timezone: 'Asia/Ho_Chi_Minh', calculationSex: 'female' as const }
  ] as const;
  const compatibility = evaluateBaziCompatibility(people[0], people[1], 2026);
  const initial = buildBaziLoveInitialPrompt(compatibility, 'en');
  const followUp = buildBaziLoveFollowUpPrompt(compatibility, 'How should we communicate?', 'en');

  assert.ok(!initial.includes('Người A'));
  assert.ok(!initial.includes('Độ tin cậy'));
  assert.match(initial, /Four calculated dimensions/);
  assert.match(followUp, /Four calculated dimensions/);
  assert.match(followUp, /Data confidence/);
  assert.match(followUp, /representative value|Five Elements Complementarity/);
});
