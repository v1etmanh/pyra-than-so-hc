import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_RESPONSE_BUDGETS,
  getChatResponseBudget,
  normalizeChatReply,
  normalizeChatReplyWithDiagnostics
} from '../lib/spiritual-agent/response-length.ts';
import { TRASH_PROMPT_GUIDANCE } from '../lib/spiritual-agent/prompt-validator.ts';

const standardFallback = [
  '✦ KẾT LUẬN NHANH:',
  'Hãy đi từng bước nhỏ và ưu tiên điều rõ ràng nhất trước mắt.',
  '',
  '✦ VÌ SAO:',
  '• Bạn đang có đủ dữ kiện để bắt đầu, nhưng cần tránh ôm quá nhiều việc cùng lúc.',
  '• Một nhịp làm việc đơn giản sẽ giúp bạn giữ được sự tập trung.',
  '',
  '✦ NÊN LÀM GÌ:',
  '• Chọn một việc quan trọng nhất và hoàn thành nó trong hôm nay.'
].join('\n');

const complexFallback = [
  '✦ KẾT LUẬN NHANH:',
  'Mối quan hệ có nền tảng tích cực nếu cả hai chủ động nói rõ nhu cầu của mình.',
  '',
  '✦ VÌ SAO:',
  '• Hai người bổ sung cho nhau, nhưng nhịp quyết định khác nhau có thể tạo ra hiểu lầm.',
  '• Sự nhất quán trong giao tiếp sẽ giúp chuyển khác biệt thành điểm tựa chung.',
  '',
  '✦ NÊN LÀM GÌ:',
  '• Hẹn một buổi trao đổi ngắn về kỳ vọng chung trong tuần này.',
  '• Thống nhất một cách xử lý khi cả hai chưa đồng ý.'
].join('\n');

function assertCompleteThreePartReply(reply: string, budget: typeof CHAT_RESPONSE_BUDGETS.standard) {
  const conclusionMarker = '✦ KẾT LUẬN NHANH:';
  const reasoningMarker = '✦ VÌ SAO:';
  const actionsMarker = '✦ NÊN LÀM GÌ:';
  const conclusionStart = reply.indexOf(conclusionMarker);
  const reasoningStart = reply.indexOf(reasoningMarker);
  const actionsStart = reply.indexOf(actionsMarker);

  assert.ok(reply.length <= budget.maxChars, `expected ${reply.length} characters to fit ${budget.maxChars}`);
  assert.ok(reply.trim().split(/\s+/).length <= budget.maxWords);
  assert.ok(conclusionStart === 0 && conclusionStart < reasoningStart && reasoningStart < actionsStart);

  const conclusion = reply.slice(conclusionStart + conclusionMarker.length, reasoningStart).trim();
  const reasoning = reply.slice(reasoningStart + reasoningMarker.length, actionsStart).trim().split('\n');
  const actions = reply.slice(actionsStart + actionsMarker.length).trim().split('\n');
  assert.ok((conclusion.match(/[.!?…]+/g)?.length || 0) <= 2);
  assert.ok(reasoning.length >= 2 && reasoning.length <= 4);
  assert.ok(actions.length >= 1 && actions.length <= 2);
  assert.ok(reasoning.every((line) => /^• .+[.!?…]$/.test(line)));
  assert.ok(actions.every((line) => /^• .+[.!?…]$/.test(line)));
}

test('chat response budgets keep normal requests concise and reserve more space for spreads or couples', () => {
  assert.equal(CHAT_RESPONSE_BUDGETS.standard.maxTokens, 800);
  assert.equal(CHAT_RESPONSE_BUDGETS.standard.maxChars, 2200);
  assert.equal(CHAT_RESPONSE_BUDGETS.complex.maxTokens, 1200);
  assert.equal(CHAT_RESPONSE_BUDGETS.complex.maxChars, 3000);

  assert.equal(getChatResponseBudget().complexity, 'standard');
  assert.equal(getChatResponseBudget({ cardCount: 1 }).complexity, 'standard');
  assert.equal(getChatResponseBudget({ cardCount: 3 }).complexity, 'complex');
  assert.equal(getChatResponseBudget({ cardCount: 5 }).complexity, 'complex');
  assert.equal(getChatResponseBudget({ isCouple: true }).complexity, 'complex');
});

test('normalizes valid standard and complex replies without losing the three required sections', () => {
  const standardCandidate = [
    'KẾT LUẬN:',
    'Đây là lúc phù hợp để bạn tiến lên một bước nhỏ nhưng dứt khoát.',
    '',
    'VÌ SAO (góc nhìn hiện tại):',
    '• Năng lượng hiện tại ủng hộ sự chủ động có chuẩn bị.',
    '• Một kế hoạch đơn giản sẽ giúp bạn giữ được sự tập trung.',
    '',
    'NÊN LÀM GÌ (ngay bây giờ):',
    '• Chọn một ưu tiên và dành 30 phút đầu ngày để thực hiện.',
    '• Ghi lại kết quả để điều chỉnh vào ngày mai.'
  ].join('\n');
  const complexCandidate = [
    '✦ KẾT LUẬN NHANH:',
    'Sự kết nối này có tiềm năng bền vững khi cả hai cùng tôn trọng nhịp phát triển riêng.',
    '',
    '✦ VÌ SAO:',
    '• Điểm mạnh của một người bổ sung cho sự thận trọng của người còn lại.',
    '• Khác biệt về cách bày tỏ cảm xúc cần được nói rõ thay vì suy đoán.',
    '• Những cam kết nhỏ, nhất quán sẽ tạo cảm giác an toàn cho cả hai.',
    '',
    '✦ NÊN LÀM GÌ:',
    '• Dành thời gian trao đổi về một mục tiêu chung trong tuần này.',
    '• Thống nhất cách tạm dừng và lắng nghe khi cuộc nói chuyện căng thẳng.'
  ].join('\n');

  const standardReply = normalizeChatReply(standardCandidate, standardFallback, 'standard');
  const complexReply = normalizeChatReply(complexCandidate, complexFallback, 'complex');

  assert.notEqual(standardReply, standardFallback);
  assert.notEqual(complexReply, complexFallback);
  assertCompleteThreePartReply(standardReply, CHAT_RESPONSE_BUDGETS.standard);
  assertCompleteThreePartReply(complexReply, CHAT_RESPONSE_BUDGETS.complex);
});

test('uses the supplied short fallback when the LLM omits a required section', () => {
  const malformedCandidate = [
    '✦ KẾT LUẬN NHANH:',
    'Bạn nên bắt đầu từ việc quan trọng nhất.',
    '',
    '✦ VÌ SAO:',
    '• Bạn đã có đủ cơ sở để hành động.'
  ].join('\n');

  const reply = normalizeChatReply(malformedCandidate, standardFallback, 'standard');

  assert.equal(reply, standardFallback);
  assertCompleteThreePartReply(reply, CHAT_RESPONSE_BUDGETS.standard);
});

test('uses the supplied short fallback instead of cutting an overlong LLM reply mid-sentence', () => {
  const overlongCandidate = [
    '✦ KẾT LUẬN NHANH:',
    'Bạn đang có một hướng đi tích cực nếu giữ nhịp tiến độ ổn định.',
    '',
    '✦ VÌ SAO:',
    `• ${'Luận điểm này được lặp lại để mô phỏng phản hồi dài vượt ngân sách. '.repeat(35)}`,
    `• ${'Một dấu hiệu khác cũng được lặp lại để mô phỏng phản hồi dài vượt ngân sách. '.repeat(35)}`,
    '',
    '✦ NÊN LÀM GÌ:',
    '• Chọn một việc cụ thể để hoàn thành trong hôm nay.'
  ].join('\n');

  assert.ok(overlongCandidate.length > CHAT_RESPONSE_BUDGETS.complex.maxChars);

  const reply = normalizeChatReply(overlongCandidate, complexFallback, 'complex');

  assert.equal(reply, complexFallback);
  assertCompleteThreePartReply(reply, CHAT_RESPONSE_BUDGETS.complex);
});

test('rejects a truncated sentence or a reply that breaks the three-part structure limits', () => {
  const validStart = [
    '✦ KẾT LUẬN NHANH:',
    'Bạn nên tiến từng bước rõ ràng.',
    '',
    '✦ VÌ SAO:',
    '• Bạn đã có đủ dữ kiện để bắt đầu.',
    '• Một kế hoạch ngắn giúp bạn giữ tập trung.',
    '',
    '✦ NÊN LÀM GÌ:',
  ];
  const invalidCandidates = [
    [...validStart, '• Chọn việc quan trọng nhưng'].join('\n'),
    [
      '✦ KẾT LUẬN NHANH:',
      'Câu một. Câu hai. Câu ba.',
      '',
      '✦ VÌ SAO:',
      '• Bạn đã có đủ dữ kiện để bắt đầu.',
      '• Một kế hoạch ngắn giúp bạn giữ tập trung.',
      '',
      '✦ NÊN LÀM GÌ:',
      '• Chọn việc quan trọng nhất hôm nay.',
    ].join('\n'),
    [
      '✦ KẾT LUẬN NHANH:',
      'Bạn nên tiến từng bước rõ ràng.',
      '',
      '✦ VÌ SAO:',
      'Bạn đã có đủ dữ kiện để bắt đầu.',
      'Một kế hoạch ngắn giúp bạn giữ tập trung.',
      '',
      '✦ NÊN LÀM GÌ:',
      '• Chọn việc quan trọng nhất hôm nay.',
    ].join('\n'),
    [
      '✦ KẾT LUẬN NHANH:',
      'Bạn nên tiến từng bước rõ ràng.',
      '',
      '✦ VÌ SAO:',
      '• Lý do một.', '• Lý do hai.', '• Lý do ba.', '• Lý do bốn.', '• Lý do năm.',
      '',
      '✦ NÊN LÀM GÌ:',
      '• Chọn việc quan trọng nhất hôm nay.',
    ].join('\n'),
    [
      '✦ KẾT LUẬN NHANH:',
      'Bạn nên tiến từng bước rõ ràng.',
      '',
      '✦ VÌ SAO:',
      '• Bạn đã có đủ dữ kiện để bắt đầu.',
      '• Một kế hoạch ngắn giúp bạn giữ tập trung.',
      '',
      '✦ NÊN LÀM GÌ:',
      '• Việc một.', '• Việc hai.', '• Việc ba.',
    ].join('\n'),
  ];

  for (const candidate of invalidCandidates) {
    assert.equal(normalizeChatReply(candidate, standardFallback, 'standard'), standardFallback);
  }
});

test('rejects a long partial answer that stops during the reasoning section', () => {
  const partial = [
    '✦ KẾT LUẬN NHANH:',
    'Bạn nên bắt đầu từ một việc vừa sức.',
    '',
    '✦ VÌ SAO:',
    `• ${'Lá bài gợi bạn nhìn lại nhịp hiện tại. '.repeat(8)}`,
    '• Chỉ số của bạn gợi ý nên bắt đầu nhưng'
  ].join('\n');

  assert.ok(partial.length > 60);
  assert.equal(normalizeChatReply(partial, standardFallback, 'standard'), standardFallback);
});

test('replaces an unsafe fallback with a bounded three-part fallback, including trash guidance', () => {
  const unsafeFallback = `${standardFallback}\n${'Tên hoặc dữ liệu không giới hạn. '.repeat(100)}`;
  const safeReply = normalizeChatReply('', unsafeFallback, 'standard');
  const trashReply = normalizeChatReply('', TRASH_PROMPT_GUIDANCE, 'standard');

  assert.notEqual(safeReply, unsafeFallback);
  assertCompleteThreePartReply(safeReply, CHAT_RESPONSE_BUDGETS.standard);
  assert.equal(trashReply, TRASH_PROMPT_GUIDANCE);
  assertCompleteThreePartReply(trashReply, CHAT_RESPONSE_BUDGETS.standard);
});

test('preserves AI answers with Markdown headings and bold sentence endings', () => {
  const candidate = standardFallback
    .replace('✦ KẾT LUẬN NHANH:', '### **✦ KẾT LUẬN NHANH:**')
    .replace('✦ VÌ SAO:', '**✦ VÌ SAO:**')
    .replace('✦ NÊN LÀM GÌ:', '**✦ NÊN LÀM GÌ:**')
    .replace('Hãy đi từng bước nhỏ và ưu tiên điều rõ ràng nhất trước mắt.', '**Hãy nghỉ 5 phút rồi quay lại việc trước mắt.**');
  const result = normalizeChatReplyWithDiagnostics(candidate, standardFallback, 'standard');
  assert.equal(result.usedAI, true);
  assert.equal(result.rejectionReason, undefined);
  assert.match(result.replyText, /Hãy nghỉ 5 phút/);
  assertCompleteThreePartReply(result.replyText, CHAT_RESPONSE_BUDGETS.standard);
});

test('preserves complete bullets that wrap onto another line', () => {
  const candidate = standardFallback.replace(
    '• Bạn đang có đủ dữ kiện để bắt đầu, nhưng cần tránh ôm quá nhiều việc cùng lúc.',
    '- Lá bài gợi bạn kiểm tra thông tin\ntrước khi nhận thêm một cam kết mới.'
  );
  const result = normalizeChatReplyWithDiagnostics(candidate, standardFallback, 'standard');
  assert.equal(result.usedAI, true);
  assert.match(result.replyText, /• Lá bài gợi bạn kiểm tra thông tin trước khi nhận thêm một cam kết mới\./);
});

test('complex replies accept four reasoning bullets as allowed by the prompt', () => {
  const candidate = complexFallback.replace(
    '• Sự nhất quán trong giao tiếp sẽ giúp chuyển khác biệt thành điểm tựa chung.',
    '• Sự nhất quán trong giao tiếp sẽ giúp chuyển khác biệt thành điểm tựa chung.\n• Hai người cần một mục tiêu chung rõ ràng.\n• Một nhịp trao đổi đều đặn giúp tránh hiểu lầm.'
  );
  assert.equal(normalizeChatReplyWithDiagnostics(candidate, complexFallback, 'complex').usedAI, true);
  assert.equal(normalizeChatReplyWithDiagnostics(candidate, standardFallback, 'standard').usedAI, false);
});

test('rejected replies report the reason and never accept incomplete answers', () => {
  assert.equal(normalizeChatReplyWithDiagnostics('', standardFallback, 'standard').rejectionReason, 'empty_or_too_short');
  const missingActions = standardFallback.split('✦ NÊN LÀM GÌ:')[0];
  assert.equal(normalizeChatReplyWithDiagnostics(missingActions, standardFallback, 'standard').rejectionReason, 'missing_or_unordered_sections');
  const truncated = standardFallback.replace('• Chọn một việc quan trọng nhất và hoàn thành nó trong hôm nay.', '• Chọn một việc quan trọng nhưng');
  const result = normalizeChatReplyWithDiagnostics(truncated, standardFallback, 'standard');
  assert.equal(result.rejectionReason, 'incomplete_sentence_or_invalid_bullets');
  assert.equal(result.replyText, standardFallback);
  const overBudget = standardFallback.replace('• Chọn một việc quan trọng nhất và hoàn thành nó trong hôm nay.', `• ${'Làm một việc nhỏ. '.repeat(60)}`);
  assert.equal(normalizeChatReplyWithDiagnostics(overBudget, standardFallback, 'standard').rejectionReason, 'response_budget_exceeded');
});
