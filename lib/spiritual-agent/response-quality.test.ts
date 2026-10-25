import assert from 'node:assert/strict';
import test from 'node:test';

import { validateChatReplyQuality } from './response-quality.ts';

const reply = (conclusion: string, actions = '• Đóng máy và bắt đầu nghỉ ngay.') => `✦ KẾT LUẬN NHANH:\n${conclusion}\n\n✦ VÌ SAO:\n• Một tín hiệu cụ thể bảo vệ kết luận.\n• Một tín hiệu khác nêu đúng rủi ro.\n\n✦ NÊN LÀM GÌ:\n${actions}`;

test('two choices must start by choosing one option', () => {
  assert.equal(validateChatReplyQuality(reply('Chọn đi ngủ sớm. Tối nay mục tiêu không phải cố thêm vài trang mà là lấy lại độ tỉnh để buổi học sau thực sự có chất lượng.'), {
    intent: 'two_choices',
    userMessage: 'Nên học tiếp hay đi ngủ?',
  }).valid, true);

  assert.equal(validateChatReplyQuality(reply('Cả hai đều có ưu và nhược điểm.'), {
    intent: 'two_choices',
    userMessage: 'Nên học tiếp hay đi ngủ?',
  }).reason, 'fence_sitting_conclusion');
});

test('relationship replies cannot infer private intent', () => {
  const result = validateChatReplyQuality(reply('Chưa nhắn và quan sát.', '• Nếu họ thật sự muốn quay lại, họ sẽ nhắn trước.'), {
    intent: 'relationship',
    userMessage: 'Tôi có nên nhắn người cũ không?',
  });
  assert.equal(result.reason, 'relationship_mind_reading');
});

test('timing replies separate current state and conditional trend', () => {
  const result = validateChatReplyQuality(reply('Hiện tại: Công việc đang chững lại. Xu hướng thời gian tới: Tình hình có thể cải thiện khi bạn chọn một hướng cụ thể.'), {
    intent: 'timing_trajectory',
    userMessage: 'Ba tháng tới công việc thế nào?',
  });
  assert.equal(result.valid, true);
});

test('generic writing actions are rejected unless explicitly requested', () => {
  const detailedConclusion = 'Hôm nay hãy hoàn thành một việc đang dang dở trước khi nhận thêm việc mới. Ưu tiên này giúp bạn giữ sự tập trung thay vì đổi hướng liên tục.';
  const generic = validateChatReplyQuality(reply(detailedConclusion, '• Ghi ra giấy ba ưu tiên rồi chọn một việc.'), {
    intent: 'daily_guidance',
    userMessage: 'Hôm nay nên tập trung gì?',
  });
  assert.equal(generic.reason, 'generic_writing_action');

  const explicit = validateChatReplyQuality(reply(detailedConclusion, '• Ghi ra giấy ba ưu tiên rồi chọn một việc.'), {
    intent: 'daily_guidance',
    userMessage: 'Tôi nên ghi chép và lập kế hoạch hôm nay thế nào?',
  });
  assert.equal(explicit.valid, true);
});

test('rejects a conclusion that is decisive but too thin to explain itself', () => {
  const result = validateChatReplyQuality([
    '✦ KẾT LUẬN NHANH:',
    'Hôm nay hãy xử lý một việc đang né.',
    '',
    '✦ VÌ SAO:',
    '• Lá bài gợi một điểm cần được làm rõ.',
    '• Trì hoãn sẽ khiến việc này tiếp tục chiếm sự chú ý.',
    '',
    '✦ NÊN LÀM GÌ:',
    '• Thực hiện bước xử lý trực tiếp đầu tiên ngay hôm nay.',
  ].join('\n'), { intent: 'daily_guidance', userMessage: 'Hôm nay nên tập trung gì?' });

  assert.deepEqual(result, { valid: false, reason: 'conclusion_too_thin' });
});

test('love match requires both names and rejects ambiguous second-person labels', () => {
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
  }).reason, 'love_match_ambiguous_address');
});

test('love match must choose a viewpoint instead of refusing to infer', () => {
  const reply = [
    '✦ KẾT LUẬN NHANH:',
    'Mình không thể biết chắc Việt Nam nghĩ gì về Mỹ Duyên.',
    '',
    '✦ VÌ SAO:',
    '• Việt Nam và Mỹ Duyên có tín hiệu bổ trợ.',
    '',
    '✦ NÊN LÀM GÌ:',
    '• Mỹ Duyên hãy quan sát Việt Nam thêm.',
  ].join('\n');

  assert.equal(validateChatReplyQuality(reply, {
    intent: 'love_match',
    userMessage: 'Bạn nam nghĩ gì về bạn nữ?',
    coupleProfileNames: ['Mỹ Duyên', 'Việt Nam'],
  }).reason, 'love_match_missing_viewpoint');
});
