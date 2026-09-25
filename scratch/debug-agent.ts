import { readFileSync } from 'node:fs';
import path from 'node:path';

function loadEnvFile(filePath: string) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  } catch {}
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

import { createStreamingResponse } from '../lib/ai/response-generator.ts';
import { getChatResponseBudget, normalizeChatReply } from '../lib/spiritual-agent/response-length.ts';

async function generateLlmText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const stream = createStreamingResponse(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    undefined,
    { maxTokens, temperature: 0.7, reasoningEffort: 'low' }
  );
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const event = JSON.parse(data) as { content?: unknown };
          if (typeof event.content === 'string') {
            fullText += event.content;
          }
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }
  return fullText.trim();
}

async function debugAgent() {
  const responseBudget = getChatResponseBudget({ intent: 'general', cardCount: 1 });
  console.log('responseBudget:', responseBudget);

  const fallbackReply = `✦ KẾT LUẬN NHANH:\nThông điệp hiện tại là giữ vững hướng đi và đừng vội phản ứng theo cảm xúc.\n\n✦ VÌ SAO:\n• Lá Nhà Ảo Thuật nhấn mạnh bài học nhìn lại và điều chỉnh.\n• Một lựa chọn bình tĩnh sẽ giúp bạn thấy rõ bước tiếp theo.\n\n✦ NÊN LÀM GÌ:\n• Chọn một việc quan trọng nhất hôm nay.\n• Hoàn thành nó trước khi nhận thêm cam kết.`;

  const systemPrompt = `Bạn là Tiểu Linh Miêu — linh miêu hộ mệnh thông thái, tinh tế và ấm áp của NUMELYRA.
Bạn tư vấn dựa trên dữ liệu Thần số học Pythagoras, Tarot Rider-Waite và Tử Vi Đẩu Số đã được cung cấp.

QUY TẮC BẮT BUỘC:
1. Với ghép đôi hai người: chỉ dùng Tử Vi Đẩu Số và Bát Tự Tứ Trụ; tuyệt đối không nhắc Tarot.
2. Với một người: chỉ dùng các lá Tarot và chỉ số đã cung cấp; không tự bịa thêm dữ kiện.
3. Với hai lựa chọn: nêu rõ phương án nghiêng về và tỷ lệ phần trăm.
4. Dùng đúng ba tiêu đề sau, theo đúng thứ tự, không thêm mở bài hoặc kết luận lặp lại:
✦ KẾT LUẬN NHANH:
[Tối đa 2 câu ngắn, trả lời thẳng vào câu hỏi]

✦ VÌ SAO:
[Tối đa ${responseBudget.complexity === 'complex' ? '4' : '3'} bullet; mỗi bullet chỉ một câu ngắn và kết thúc bằng dấu chấm. Với trải bài nhiều lá, gộp các lá cùng ý thay vì diễn giải từng lá thành đoạn dài.]

✦ NÊN LÀM GÌ:
[1-2 bullet là hành động cụ thể, làm được ngay; mỗi bullet kết thúc bằng dấu chấm]

5. Giọng điệu thân thiện, thông thái, ấm áp. Tổng câu trả lời không vượt quá ${responseBudget.maxWords} từ tiếng Việt hoặc ${responseBudget.maxChars} ký tự. Kết thúc ngay sau phần “NÊN LÀM GÌ”.`;

  const userPrompt = `Câu hỏi của người dùng: "Hôm nay tôi cảm thấy hơi mệt, lá bài nói lên điều gì?"
Hồ sơ người hỏi: Nguyễn Văn A (Ngày sinh: 1995-10-24)
Các lá bài Tarot đã rút:
• Vị trí 1 [Thông điệp Trực Giác]: Nhà Ảo Thuật (Lá Ngược) - Ý nghĩa: Năng lực đang bị phân tán hoặc sử dụng chưa đúng mục đích.

DỮ LIỆU THẦN SỐ HỌC PYTHAGORAS BẢN MỆNH (Nguyễn Văn A):
• Số Đường Đời (Life Path) = 4`;

  console.log('--- Calling generateLlmText with maxTokens:', responseBudget.maxTokens, '---');
  try {
    const aiText = await generateLlmText(systemPrompt, userPrompt, responseBudget.maxTokens);
    console.log('AI RAW OUTPUT:');
    console.log(JSON.stringify(aiText));
    console.log('\nAI RAW LENGTH:', aiText.length, 'chars');

    const normalized = normalizeChatReply(aiText, fallbackReply, responseBudget.complexity);
    console.log('\nNORMALIZED RESULT:');
    console.log(normalized);

    console.log('\nIS SAME AS FALLBACK?', normalized.includes('giữ vững hướng đi'));
  } catch (e) {
    console.error('generateLlmText error:', e);
  }
}

debugAgent();
