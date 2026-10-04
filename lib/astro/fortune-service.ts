import { z } from 'zod';

export interface AstroFortuneInput {
  caDaoSample: string;
  caDaoCategory?: string;
  astroSummary?: string;
  metadata?: {
    tensionScore?: number;
    harmonyScore?: number;
    conjunctionScore?: number;
    dominantElements?: string[];
    highlights?: string[];
  };
  userContext?: string;
}

export interface AstroFortuneOutput {
  title?: string;
  verse: string;
  mirror: string;
  advice: string;
}

export const astroFortuneResponseSchema = z.object({
  title: z.string().optional(),
  verse: z.string().min(1, 'Verse cannot be empty'),
  mirror: z.string().min(1, 'Mirror cannot be empty'),
  advice: z.string().min(1, 'Advice cannot be empty'),
});

export const astroFortuneRequestSchema = z.object({
  caDaoSample: z.string().min(5, 'Ca dao sample must be at least 5 characters'),
  caDaoCategory: z.string().optional(),
  astroSummary: z.string().optional(),
  metadata: z
    .object({
      tensionScore: z.number().min(0).max(1).optional(),
      harmonyScore: z.number().min(0).max(1).optional(),
      conjunctionScore: z.number().min(0).max(1).optional(),
      dominantElements: z.array(z.string()).optional(),
      highlights: z.array(z.string()).optional(),
    })
    .optional(),
  userContext: z.string().max(500).optional(),
});

function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY?.trim()) keys.push(process.env.GEMINI_API_KEY.trim());
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]?.trim();
    if (k && !keys.includes(k)) keys.push(k);
  }
  return keys;
}

function getGeminiModel(): string {
  return (
    process.env.GEMINI_ASTRO_MODEL?.trim() ||
    process.env.GEMINI_CHAT_MODELS?.split(',')[0]?.trim() ||
    'gemini-3.6-flash'
  );
}

function getDeepSeekApiKey(): string {
  return process.env.DEEPSEEK_API_KEY?.trim() || '';
}

function getDeepSeekBaseUrl(): string {
  return (process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/+$/, '');
}

function getDeepSeekModel(): string {
  return process.env.DEEPSEEK_ASTRO_MODEL?.trim() || 'deepseek-chat';
}

export function buildAstroFortunePrompt(input: AstroFortuneInput): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `Bạn là một "Thầy bói Chiêm tinh Dân gian Việt Nam" — am hiểu sâu sắc chiêm tinh học phương Tây (các góc chiếu, hành tinh, độ căng thẳng/hòa hợp giữa Transit và Natal) nhưng lại truyền tải thông điệp bằng linh hồn ca dao, tục ngữ, đồng dao thôn quê Việt Nam mộc mạc, hóm hỉnh và sắc sảo.

NHIỆM VỤ:
Sáng tác "Lá Thăm Chiêm Tinh Dân Gian" gồm đúng 3 tầng nội dung theo cấu trúc sau:

1. "title" (Tên quẻ dân gian 4 chữ):
   - Đặt một cái tên quẻ dân dã, ấn tượng (Ví dụ: "Hỏa Thiêu Nồi Cơm", "Cá Chép Vướng Rong", "Gió Đổi Chiều Đò").

2. "verse" (Tầng 1: Đồng dao thế sự - BẮT BUỘC SÁNG TÁC 4 CÂU THƠ MỚI):
   - ĐẶC BIỆT LƯU Ý: Bài ca dao mẫu bên dưới CHỈ ĐỂ BẠN HỌC THỂ THƠ VÀ CÁCH GIEO VẦN/NGẮT NHỊP (như lục bát 6/8, vè 4 chữ, song thất...). TUYỆT ĐỐI KHÔNG ĐƯỢC CHÉP LẠI CÂU CHỮ CỦA BÀI MẪU!
   - BẠN PHẢI TỰ SÁNG TÁC 4 CÂU THƠ MỚI HOÀN TOÀN để họa lại tình thế chiêm tinh / tâm trạng lúc này.
   - Sử dụng chất liệu hình ảnh dân dã làng quê Việt Nam (bếp lửa, ngọn cỏ, dòng sông, con trâu, hạt thóc, cái cày, mưa dầm, nắng gắt, cá lội, chim bay, vung nồi...) làm ẩn dụ.
   - Thơ phải chuẩn vần điệu dân gian, dí dỏm, châm biếm nhẹ hoặc ý nhị sâu cay.
   - TUYỆT ĐỐI CẤM: Chép lại bài mẫu; cấm các từ ngữ Hán Việt nặng nề; cấm ngôn từ "chữa lành" mạng xã hội (như "vũ trụ gửi tín hiệu", "tần số rung động", "bản giao hưởng", "ngọn hải đăng", "năng lượng tích cực"...).

3. "mirror" (Tầng 2: Gương soi tâm trí - Đúng 1 câu duy nhất):
   - Đọc vị thẳng thắn, sắc sảo trạng thái nội tâm từ các góc chiếu chiêm tinh (Căng thẳng vs Hòa hợp, Hỏa tinh xung động nôn nóng, Thổ tinh đè nén cản trở, v.v.).
   - Đóng vai người bạn tri kỷ chỉ điểm trúng phóc cái gai hoặc nỗi băn khoăn đang cấn trong lòng người xem lúc này. Không đạo lý, không phán xét số phận.

4. "advice" (Tầng 3: Kế sách bỏ túi - Đúng 1 câu duy nhất):
   - Dặn dò hành động cụ thể, thực tế, có thể làm ngay trong sinh hoạt đời thường hôm nay (ăn uống, chi tiêu, lời ăn tiếng nói, cách giữ mình).
   - Tuyệt đối không khuyên chung chung ("hãy bình tĩnh", "hãy tự tin"). Cần dặn dò việc làm thiết thực đời thường.

BẮT BUỘC TRẢ VỀ DUY NHẤT MỘT JSON OBJECT HỢP LỆ:
{
  "title": "Tên quẻ 4 chữ",
  "verse": "Dòng 1\\nDòng 2\\nDòng 3\\nDòng 4",
  "mirror": "Câu đọc vị tâm trí ngắn gọn",
  "advice": "Câu kế sách bỏ túi thực tế"
}`;

  const tensionText =
    typeof input.metadata?.tensionScore === 'number'
      ? `Độ Căng thẳng (Tension): ${(input.metadata.tensionScore * 100).toFixed(0)}%`
      : '';
  const harmonyText =
    typeof input.metadata?.harmonyScore === 'number'
      ? `Độ Hòa hợp (Harmony): ${(input.metadata.harmonyScore * 100).toFixed(0)}%`
      : '';
  const elementsText = input.metadata?.dominantElements?.length
    ? `Nguyên tố chi phối: ${input.metadata.dominantElements.join(', ')}`
    : '';
  const highlightsText = input.metadata?.highlights?.length
    ? `Các góc chiếu tâm điểm:\n- ${input.metadata.highlights.join('\n- ')}`
    : '';

  const userPrompt = [
    '[BÀI CA DAO MẪU ĐỂ LẤY KHUÔN NHỊP ĐIỆU (KHÔNG ĐƯỢC CHÉP LẠI CÂU CHỮ)]:',
    '"""',
    input.caDaoSample,
    '"""',
    input.caDaoCategory ? ('Chủ đề dân gian mẫu: ' + input.caDaoCategory) : '',
    '',
    '[TÌNH THẾ CHIÊM TINH HÔM NAY (HÃY DÙNG LÀM Ý ĐỂ SÁNG TÁC 4 CÂU THƠ MỚI)]:',
    input.astroSummary ? ('Tóm tắt thế sự: ' + input.astroSummary) : '',
    [tensionText, harmonyText, elementsText].filter(Boolean).join(' | '),
    highlightsText,
    input.userContext ? ('Lời nhắn thêm từ người bốc: ' + input.userContext) : '',
    '',
    'Hãy sáng tác 4 câu thơ mới hoàn toàn theo nhịp bài mẫu và xuất ra Lá Thăm Chiêm Tinh Dân Gian bằng JSON chuẩn (title, verse, mirror, advice).'
  ].filter(Boolean).join('\n');

  return { systemPrompt, userPrompt };
}

/**
 * Gọi Google Gemini Native API (Ưu tiên số 1)
 */
async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<AstroFortuneOutput | null> {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return null;

  const model = getGeminiModel();

  for (const apiKey of keys) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(new Error('Gemini request timed out after 25s')), 25_000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`[Gemini ${model}] Key ...${apiKey.slice(-6)} failed with status ${response.status}`);
        continue; // Try next key
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) continue;

      const parsed = JSON.parse(content);
      const validated = astroFortuneResponseSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    } catch (err) {
      console.warn(`[Gemini ${model}] Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

/**
 * Gọi DeepSeek API (Phương án Fallback dự phòng)
 */
async function generateWithDeepSeek(
  systemPrompt: string,
  userPrompt: string
): Promise<AstroFortuneOutput> {
  const apiKey = getDeepSeekApiKey();
  if (!apiKey) {
    throw new Error('Both Gemini and DeepSeek are unavailable. Please configure API keys.');
  }

  const url = `${getDeepSeekBaseUrl()}/chat/completions`;
  const model = getDeepSeekModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('DeepSeek request timed out after 30s')), 30_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 1000,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`DeepSeek API failed (${response.status}): ${errText.slice(0, 200)}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('DeepSeek returned an empty completion.');

    const parsed = JSON.parse(content);
    const validated = astroFortuneResponseSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`DeepSeek validation failed: ${validated.error.issues.map((i) => i.message).join(', ')}`);
    }

    return validated.data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Hàm chính tạo Lá Thăm Chiêm Tinh Dân Gian
 * Ưu tiên: Gemini 3.6/3.8 Flash (Văn thơ cực mượt) -> Tự động Fallback sang DeepSeek nếu lỗi
 */
export async function generateAstroFortune(input: AstroFortuneInput): Promise<AstroFortuneOutput> {
  const { systemPrompt, userPrompt } = buildAstroFortunePrompt(input);

  // 1. Thử gọi Gemini trước (chất thơ đỉnh nhất)
  const geminiResult = await generateWithGemini(systemPrompt, userPrompt);
  if (geminiResult) {
    return geminiResult;
  }

  console.warn('[Astro Fortune] Gemini is unavailable or rate-limited. Falling back to DeepSeek...');

  // 2. Fallback sang DeepSeek nếu Gemini gặp sự cố
  return await generateWithDeepSeek(systemPrompt, userPrompt);
}
