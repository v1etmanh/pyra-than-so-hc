import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_RESPONSE_BUDGETS,
  getChatResponseBudget,
  normalizeChatReply
} from '../lib/spiritual-agent/response-length.ts';

const standardFallback = [
  '✦ KẾT LUẬN NHANH:',
  'Hãy đi từng bước nhỏ và ưu tiên điều rõ ràng nhất trước mắt.',
  '',
  '✦ VÌ SAO:',
  '• Bạn đang có đủ dữ kiện để bắt đầu, nhưng cần tránh ôm quá nhiều việc cùng lúc.',
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

function assertCompleteThreePartReply(reply: string, maxChars: number) {
  assert.ok(reply.length <= maxChars, `expected ${reply.length} characters to fit ${maxChars}`);
  assert.match(reply, /✦ KẾT LUẬN NHANH:/);
  assert.match(reply, /✦ VÌ SAO:/);
  assert.match(reply, /✦ NÊN LÀM GÌ:/);
}

test('chat response budgets keep normal requests concise and reserve more space for spreads or couples', () => {
  assert.equal(CHAT_RESPONSE_BUDGETS.standard.maxTokens, 400);
  assert.equal(CHAT_RESPONSE_BUDGETS.standard.maxChars, 900);
  assert.equal(CHAT_RESPONSE_BUDGETS.complex.maxTokens, 600);
  assert.equal(CHAT_RESPONSE_BUDGETS.complex.maxChars, 1400);

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
  assertCompleteThreePartReply(standardReply, CHAT_RESPONSE_BUDGETS.standard.maxChars);
  assertCompleteThreePartReply(complexReply, CHAT_RESPONSE_BUDGETS.complex.maxChars);
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
  assertCompleteThreePartReply(reply, CHAT_RESPONSE_BUDGETS.standard.maxChars);
});

test('uses the supplied short fallback instead of cutting an overlong LLM reply mid-sentence', () => {
  const overlongCandidate = [
    '✦ KẾT LUẬN NHANH:',
    'Bạn đang có một hướng đi tích cực nếu giữ nhịp tiến độ ổn định.',
    '',
    '✦ VÌ SAO:',
    `• ${'Luận điểm này được lặp lại để mô phỏng phản hồi dài vượt ngân sách. '.repeat(30)}`,
    '',
    '✦ NÊN LÀM GÌ:',
    '• Chọn một việc cụ thể để hoàn thành trong hôm nay.'
  ].join('\n');

  assert.ok(overlongCandidate.length > CHAT_RESPONSE_BUDGETS.complex.maxChars);

  const reply = normalizeChatReply(overlongCandidate, complexFallback, 'complex');

  assert.equal(reply, complexFallback);
  assertCompleteThreePartReply(reply, CHAT_RESPONSE_BUDGETS.complex.maxChars);
});
