const { isTrashOrMeaninglessPrompt } = require('../lib/spiritual-agent/prompt-validator');

const testCases = [
  { input: "a,.", expected: true },
  { input: "ta", expected: true },
  { input: "121", expected: true },
  { input: "asdfgh", expected: true },
  { input: "???", expected: true },
  { input: "...", expected: true },
  { input: "alo", expected: true },
  { input: "test", expected: true },
  { input: "abc", expected: true },
  { input: "zzzz", expected: true },
  { input: "tôi muốn biết năm 2026 sự nghiệp có khởi sắc không", expected: false },
  { input: "nên học IT hay kinh tế", expected: false },
  { input: "tính cách tôi thế nào", expected: false },
  { input: "hôm nay ăn gì", expected: false },
  { input: "sinh 12/05/1995 vận mệnh ra sao", expected: false },
  { input: "tôi nên chọn A hay B", expected: false }
];

let allPassed = true;
for (const tc of testCases) {
  const res = isTrashOrMeaninglessPrompt(tc.input);
  const passed = res.isTrash === tc.expected;
  console.log(`${passed ? '✅' : '❌'} [${tc.input}] -> isTrash: ${res.isTrash} (${res.reason || 'OK'}) | Expected: ${tc.expected}`);
  if (!passed) allPassed = false;
}

if (allPassed) {
  console.log("\n🎉 ALL TESTS PASSED!");
} else {
  console.error("\n❌ SOME TESTS FAILED!");
  process.exit(1);
}
