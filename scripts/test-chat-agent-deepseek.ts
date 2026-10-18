import { createStreamingResponse, type UserProviderConfig } from '../lib/ai/response-generator.ts';

async function testDeepSeekChatAgent() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY is missing in .env');
    process.exit(1);
  }

  const model = process.env.DEEPSEEK_CHAT_AGENT_MODEL?.trim() || process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';
  const baseUrl = (process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/+$/, '');

  const config: UserProviderConfig = {
    type: 'DeepSeek',
    baseUrl,
    model,
    apiKeys: [apiKey],
  };

  console.log(`[Test Chat Agent DeepSeek] Connecting to ${config.type} (${config.model}) at ${config.baseUrl}...`);

  const systemPrompt = `Bạn là một chuyên gia Thần số học và Tarot thấu cảm, đưa ra lời khuyên chân thành và sâu sắc bằng tiếng Việt.`;
  const userPrompt = `Tôi cảm thấy dạo này năng lượng hơi chùng xuống, hãy cho tôi một lời khuyên ngắn gọn tiếp thêm động lực.`;

  const stream = createStreamingResponse(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    config,
    { maxTokens: 400, temperature: 0.7 }
  );

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const event = JSON.parse(data) as { content?: string; done?: boolean; error?: string };
        if (event.content) fullText += event.content;
      } catch {}
    }
  }

  console.log('\n[DeepSeek Chat Agent Response]:\n' + fullText.trim() + '\n');
  console.log('✅ DeepSeek Chat Agent test PASSED successfully!');
}

testDeepSeekChatAgent().catch((err) => {
  console.error('❌ DeepSeek Chat Agent test FAILED:', err);
  process.exit(1);
});
