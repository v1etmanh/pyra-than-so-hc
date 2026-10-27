import assert from 'node:assert/strict';
import test from 'node:test';

import { validateChatReplyQuality } from './response-quality.ts';

const reply = (conclusion: string, guidance = '• Điều đáng giữ lại lúc này là khoảng lặng giúp bạn trở về với nhịp của chính mình.') => `✦ KẾT LUẬN NHANH:\n${conclusion}\n\n✦ VÌ SAO:\n• Một tín hiệu cụ thể bảo vệ kết luận.\n• Một tín hiệu khác nêu đúng rủi ro.\n\n✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:\n${guidance}`;

test('two choices can use natural wording instead of a fixed opening', () => {
  assert.equal(validateChatReplyQuality(reply('Chọn đi ngủ sớm. Tối nay mục tiêu không phải cố thêm vài trang mà là lấy lại độ tỉnh để buổi học sau thực sự có chất lượng.'), {
    intent: 'two_choices',
    userMessage: 'Nên học tiếp hay đi ngủ?',
  }).valid, true);

  assert.equal(validateChatReplyQuality(reply('Cả hai đều có ưu và nhược điểm, nhưng đi ngủ sớm phù hợp hơn với trạng thái hiện tại.'), {
    intent: 'two_choices',
    userMessage: 'Nên học tiếp hay đi ngủ?',
  }).valid, true);
});

test('relationship replies cannot infer private intent', () => {
  const result = validateChatReplyQuality(reply('Chưa nhắn và quan sát.', '• Nếu họ thật sự muốn quay lại, họ sẽ nhắn trước.'), {
    intent: 'relationship',
    userMessage: 'Tôi có nên nhắn người cũ không?',
  });
  assert.equal(result.reason, 'relationship_mind_reading');
});

test('timing replies do not require fixed labels', () => {
  const result = validateChatReplyQuality(reply('Công việc đang chững lại, nhưng thời gian tới có thể cải thiện khi bạn chọn một hướng cụ thể.'), {
    intent: 'timing_trajectory',
    userMessage: 'Ba tháng tới công việc thế nào?',
  });
  assert.equal(result.valid, true);
});

test('practical writing guidance is not rejected by a keyword list', () => {
  const detailedConclusion = 'Hôm nay hãy hoàn thành một việc đang dang dở trước khi nhận thêm việc mới. Ưu tiên này giúp bạn giữ sự tập trung thay vì đổi hướng liên tục.';
  const generic = validateChatReplyQuality(reply(detailedConclusion, '• Ghi ra giấy ba ưu tiên rồi chọn một việc.'), {
    intent: 'daily_guidance',
    userMessage: 'Hôm nay nên tập trung gì?',
  });
  assert.equal(generic.valid, true);

  const explicit = validateChatReplyQuality(reply(detailedConclusion, '• Ghi ra giấy ba ưu tiên rồi chọn một việc.'), {
    intent: 'daily_guidance',
    userMessage: 'Tôi nên ghi chép và lập kế hoạch hôm nay thế nào?',
  });
  assert.equal(explicit.valid, true);
});

test('accepts a concise conclusion when the normalized reply is complete', () => {
  const result = validateChatReplyQuality([
    '✦ KẾT LUẬN NHANH:',
    'Hôm nay hãy xử lý một việc đang né.',
    '',
    '✦ VÌ SAO:',
    '• Lá bài gợi một điểm cần được làm rõ.',
    '• Trì hoãn sẽ khiến việc này tiếp tục chiếm sự chú ý.',
    '',
    '✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:',
    '• Thực hiện bước xử lý trực tiếp đầu tiên ngay hôm nay.',
  ].join('\n'), { intent: 'daily_guidance', userMessage: 'Hôm nay nên tập trung gì?' });

  assert.deepEqual(result, { valid: true });
});

test('love match does not require names in every formulation', () => {
  const namedReply = reply(
    'Minh Anh và Gia Huy có động lực tương đối nâng đỡ, nhưng khác biệt trong nhịp giao tiếp cần được nói rõ trước khi trở thành một điểm ma sát lặp lại.',
    '• Minh Anh và Gia Huy thống nhất một cách báo trước khi cần thêm không gian.',
  );
  assert.equal(validateChatReplyQuality(namedReply, {
    intent: 'love_match',
    userMessage: 'Hai người có hợp nhau không?',
    coupleProfileNames: ['Minh Anh', 'Gia Huy'],
  }).valid, true);

  const ambiguousReply = namedReply.replaceAll('Minh Anh và Gia Huy', 'hai bạn');
  assert.equal(validateChatReplyQuality(ambiguousReply, {
    intent: 'love_match',
    userMessage: 'Hai người có hợp nhau không?',
    coupleProfileNames: ['Minh Anh', 'Gia Huy'],
  }).valid, true);
});

test('love match may use cautious language', () => {
  const reply = [
    '✦ KẾT LUẬN NHANH:',
    'Mình không thể biết chắc Việt Nam nghĩ gì về Mỹ Duyên.',
    '',
    '✦ VÌ SAO:',
    '• Việt Nam và Mỹ Duyên có tín hiệu bổ trợ.',
    '',
    '✦ ĐỊNH HƯỚNG VÀ CHIÊM NGHIỆM:',
    '• Mỹ Duyên hãy quan sát Việt Nam thêm.',
  ].join('\n');

  assert.equal(validateChatReplyQuality(reply, {
    intent: 'love_match',
    userMessage: 'Bạn nam nghĩ gì về bạn nữ?',
    coupleProfileNames: ['Mỹ Duyên', 'Việt Nam'],
  }).valid, true);
});

test('internal instruction leaks are still rejected', () => {
  const result = validateChatReplyQuality(reply('Theo quy tắc được cung cấp, mình phải chọn một kết luận.'), {
    intent: 'general',
    userMessage: 'Tôi nên làm gì?',
  });
  assert.equal(result.reason, 'instruction_leak');
});
