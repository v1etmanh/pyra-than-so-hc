import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMarkdownForMobile } from '../lib/markdown/presentation.ts';

test('normalizeMarkdownForMobile converts GFM tables into readable lists', () => {
  const input = [
    '# Bát Tự Tương Hợp',
    '',
    '| Khía cạnh | Điểm | Ghi chú |',
    '| :--- | :---: | ---: |',
    '| Ngũ hành | +8.5 | Tương sinh |',
    '| Can chi | +12.0 | Tam hợp |',
    '',
    'Lời khuyên tiếp theo.'
  ].join('\n');

  const result = normalizeMarkdownForMobile(input);

  assert.ok(!result.includes('| Khía cạnh |'));
  assert.ok(!result.includes('| :--- |'));
  assert.ok(result.includes('- **Khía cạnh:** Ngũ hành; **Điểm:** +8.5; **Ghi chú:** Tương sinh'));
  assert.ok(result.includes('- **Khía cạnh:** Can chi; **Điểm:** +12.0; **Ghi chú:** Tam hợp'));
  assert.ok(result.includes('Lời khuyên tiếp theo.'));
});

test('normalizeMarkdownForMobile preserves text containing pipe characters without table syntax', () => {
  const input = 'Người A mang mệnh Hỏa | Người B mang mệnh Mộc.';
  assert.equal(normalizeMarkdownForMobile(input), input);
});

test('normalizeMarkdownForMobile preserves text without any pipe characters', () => {
  const input = 'Hai người có nhiều điểm tương đồng trong tính cách.';
  assert.equal(normalizeMarkdownForMobile(input), input);
});
