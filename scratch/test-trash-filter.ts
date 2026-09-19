import { isTrashOrMeaninglessPrompt, TRASH_PROMPT_GUIDANCE } from '../lib/spiritual-agent/prompt-validator';

console.log("Testing isTrashOrMeaninglessPrompt...");

const testInputs = [
  "a,.",
  "ta",
  "121",
  "asdfgh",
  "???",
  "alo",
  "test",
  "tôi muốn biết năm 2026 sự nghiệp có khởi sắc không",
  "chọn phương án A hay B"
];

for (const input of testInputs) {
  const res = isTrashOrMeaninglessPrompt(input);
  console.log(`Prompt: "${input}" => isTrash: ${res.isTrash} (${res.reason || 'VALID'})`);
}
