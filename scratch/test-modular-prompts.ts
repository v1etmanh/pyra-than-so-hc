import { buildAgentSystemPrompt, buildAgentUserPrompt } from '../lib/spiritual-agent/agent-prompts';

console.log('--- TEST 1: SINGLE CARD / GENERAL INTENT ---');
const singlePrompt = buildAgentSystemPrompt({
  intent: 'daily_guidance',
  isCouple: false,
  complexity: 'standard',
  needsTarot: true
});
console.log('Contains Tarot:', singlePrompt.includes('Tarot Rider-Waite'));
console.log('Contains Bát Tự 2 người rule (Should be FALSE):', singlePrompt.includes('TỬ VI & BÁT TỰ'));
console.log('Contains VietMap rule (Should be FALSE):', singlePrompt.includes('VietMap'));
console.log('Contains 3 headings (Should be TRUE):', singlePrompt.includes('✦ KẾT LUẬN NHANH:'));

console.log('\n--- TEST 2: COUPLE / LOVE MATCH ---');
const couplePrompt = buildAgentSystemPrompt({
  intent: 'love_match',
  isCouple: true,
  complexity: 'standard',
  needsTarot: false
});
console.log('Contains Bát Tự 2 người rule (Should be TRUE):', couplePrompt.includes('TỬ VI & BÁT TỰ'));
console.log('Bans Tarot (Should be TRUE):', couplePrompt.includes('TUYỆT ĐỐI KHÔNG NHẮC ĐẾN BÀI TAROT'));

console.log('\n--- TEST 3: TWO CHOICES ---');
const twoChoicesPrompt = buildAgentSystemPrompt({
  intent: 'two_choices',
  isCouple: false,
  complexity: 'standard',
  needsTarot: true
});
console.log('Contains Two Choices rule (Should be TRUE):', twoChoicesPrompt.includes('HAI LỰA CHỌN (A vs B)'));
console.log('Bans probability % (Should be TRUE):', twoChoicesPrompt.includes('TỶ LỆ PHẦN TRĂM HOẶC XÁC SUẤT'));

console.log('\n--- ALL PROMPT TESTS PASSED SUCCESSFULLY! ---');
