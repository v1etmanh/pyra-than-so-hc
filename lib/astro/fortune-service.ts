import { z } from 'zod';

export interface AstroFortuneInput {
  caDaoSample: string;
  caDaoCategory?: string;
  astroSummary?: string;
  metadata?: {
    tensionScore?: number;
    harmonyScore?: number;
    conjunctionScore?: number;
    dominantSignal?: 'tension' | 'harmony' | 'conjunction' | 'balanced';
    dominantElements?: string[];
    highlights?: string[];
    birthDataPrecision?: 'dateOnly' | 'timeWithoutLocation' | 'complete';
    houseSystem?: 'porphyry';
    ascendantSign?: string;
    midheavenSign?: string;
    planetHouses?: Record<string, number>;
    activatedHouses?: Array<{
      house: number;
      score: number;
      topicVi: string;
    }>;
    angleHighlights?: string[];
  };
  recentAdvice?: string[];
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
      dominantSignal: z.enum(['tension', 'harmony', 'conjunction', 'balanced']).optional(),
      dominantElements: z.array(z.string()).optional(),
      highlights: z.array(z.string()).optional(),
      birthDataPrecision: z.enum(['dateOnly', 'timeWithoutLocation', 'complete']).optional(),
      houseSystem: z.literal('porphyry').optional(),
      ascendantSign: z.string().min(1).max(40).optional(),
      midheavenSign: z.string().min(1).max(40).optional(),
      planetHouses: z.record(z.string().max(40), z.number().int().min(1).max(12)).optional(),
      activatedHouses: z.array(z.object({
        house: z.number().int().min(1).max(12),
        score: z.number().min(0).max(1),
        topicVi: z.string().min(1).max(100),
      })).max(3).optional(),
      angleHighlights: z.array(z.string().min(1).max(160)).max(3).optional(),
    })
    .optional(),
  recentAdvice: z.array(z.string().min(1).max(500)).max(7).optional(),
  userContext: z.string().max(500).optional(),
});

function getGeminiMainApiKey(): string {
  return (
    process.env.GEMINI_API_KEY_MAIN?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    ''
  );
}

function getGeminiModel(): string {
  return (
    process.env.GEMINI_ASTRO_MODEL?.trim() ||
    process.env.GEMINI_CHAT_MODELS?.split(',')[0]?.trim() ||
    'gemini-2.5-flash'
  );
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
   - KÍCH THÍCH LIÊN TƯỞNG ẨN DỤ ĐỜI SỐNG (Metaphorical Association): Hãy liên tưởng tự do đến những lát cắt rất sống động và bình dị: con mèo lười sưởi nắng bên hiên, nồi cá kho liu riu, ấm trà nguội, chiếc lá đa rụng bờ ao, con đò neo đợi con nước, khói bếp lam chiều, tiếng chổi quét sân... Dùng những hình tượng này để đọc vị tâm trạng thay vì dùng lý lẽ đao to búa lớn.
   - Thơ phải chuẩn vần điệu dân gian, dí dỏm, châm biếm nhẹ hoặc ý nhị sâu cay.
   - TUYỆT ĐỐI CẤM: Chép lại bài mẫu; cấm các từ ngữ Hán Việt nặng nề; cấm ngôn từ "chữa lành" mạng xã hội (như "vũ trụ gửi tín hiệu", "tần số rung động", "bản giao hưởng", "ngọn hải đăng", "năng lượng tích cực"...).

3. "mirror" (Tầng 2: Gương soi tâm trí - Đúng 1 câu duy nhất):
   - MỞ RỘNG BIÊN ĐỘ CẢM XÚC (BẢNG MÀU TÂM TRẠNG - Không phải ngày nào cũng là ngày ra trận):
     + Ngày thảnh thơi / buông xả: Cho phép lười biếng một cách thông thái, "nằm thở cũng là một dạng tu dưỡng", ngắm mây, uống trà.
     + Ngày trào phúng / tự trào: Nhìn sự đời nhẹ tênh, tự cười những toan tính vụn vặt của chính mình ("lo bò trắng răng", "chuyện cỏn con mà tưởng cháy nhà").
     + Ngày đời thường / ấm cúng: Chăm chút một bữa ăn ngon, ngủ một giấc sâu, tưới cái cây thay vì mơ chuyện đại sự.
     + Ngày quan sát: Chỉ đứng nhìn dòng đời trôi, như người câu cá ngồi ngắm phao nhấp nháy, không việc gì phải vội.
   - Đọc vị tự nhiên, hóm hỉnh hoặc dung dị từ tương quan các góc chiếu. Không mặc định người xem đang lo sợ hay muốn bứt phá làm giàu. Không đạo lý, không phán xét số phận.

4. "advice" (Tầng 3: Kế sách bỏ túi - Đúng 1 câu duy nhất):
   - Dặn dò hành động cụ thể, dung dị, có thể làm ngay trong sinh hoạt đời thường hôm nay (ăn uống, chi tiêu, lời ăn tiếng nói, cách giữ mình, nghỉ ngơi, chăm sóc bản thân).
   - Không dùng lời khuyên khuôn mẫu chỉ yêu cầu người xem chậm lại, trấn tĩnh hoặc tự tin; phải thay bằng một việc làm có đối tượng và thời điểm rõ ràng.
   - Tùy theo tâm thế ngày mà đưa kế sách phù hợp: Ngày thuận lợi (Hòa hợp) có thể thong thả tận hưởng hoặc kết nối ấm áp; ngày căng thẳng thì giảm bớt ôm đồm, tránh hơn thua; ngày tĩnh lặng thì cho phép mình nghỉ ngơi trọn vẹn; không ép buộc ngày nào cũng phải "nỗ lực bứt phá".
   - Không lặp động từ chính hoặc chủ đề hành động của các kế sách gần đây được cung cấp.

LUẬT CẤM KỴ BẮT BUỘC (ANTI-REPETITION RULE):
- TUYỆT ĐỐI CẤM: Không ngày nào cũng rao giảng về "khát vọng", "vươn lên", "bứt phá", "nỗ lực thành công" hay "chứng tỏ bản thân". Mỗi ngày là một tâm thế độc bản: có ngày tiến, có ngày lùi, có ngày chỉ nên đứng yên ngắm cảnh.

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
  const dominantSignalText = input.metadata?.dominantSignal
    ? `Tín hiệu chủ đạo đã tính toán: ${input.metadata.dominantSignal}`
    : '';
  const birthPrecisionText = input.metadata?.birthDataPrecision
    ? `Độ đầy đủ dữ liệu sinh: ${input.metadata.birthDataPrecision}`
    : '';
  const anglesText = input.metadata?.birthDataPrecision === 'complete'
    ? [
        input.metadata.ascendantSign ? `Cung Mọc (ASC): ${input.metadata.ascendantSign}` : '',
        input.metadata.midheavenSign ? `Thiên Đỉnh (MC): ${input.metadata.midheavenSign}` : '',
        input.metadata.houseSystem ? 'Hệ nhà: Porphyry' : '',
      ].filter(Boolean).join(' | ')
    : '';
  const planetHousesText = input.metadata?.birthDataPrecision === 'complete'
    && input.metadata.planetHouses
    ? `Vị trí hành tinh theo nhà bản mệnh:\n- ${Object.entries(input.metadata.planetHouses)
        .map(([planet, house]) => `${planet}: Nhà ${house}`)
        .join('\n- ')}`
    : '';
  const activatedHousesText = input.metadata?.activatedHouses?.length
    ? `Các nhà nổi bật hôm nay:\n- ${input.metadata.activatedHouses
        .map((item) => `Nhà ${item.house} – ${item.topicVi} (${Math.round(item.score * 100)}%)`)
        .join('\n- ')}`
    : '';
  const angleHighlightsText = input.metadata?.angleHighlights?.length
    ? `Góc chiếu tới ASC/MC:\n- ${input.metadata.angleHighlights.join('\n- ')}`
    : '';
  const recentAdviceText = input.recentAdvice?.length
    ? `Các kế sách gần đây — bắt buộc đổi cả động từ chính lẫn chủ đề:\n- ${input.recentAdvice.slice(0, 7).join('\n- ')}`
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
    dominantSignalText,
    highlightsText,
    birthPrecisionText,
    anglesText,
    planetHousesText,
    activatedHousesText,
    angleHighlightsText,
    recentAdviceText,
    input.userContext ? ('Lời nhắn thêm từ người bốc: ' + input.userContext) : '',
    '',
    'Hãy sáng tác 4 câu thơ mới hoàn toàn theo nhịp bài mẫu và xuất ra Lá Thăm Chiêm Tinh Dân Gian bằng JSON chuẩn (title, verse, mirror, advice).'
  ].filter(Boolean).join('\n');

  return { systemPrompt, userPrompt };
}

/**
 * Gọi Google Gemini Native API bằng duy nhất 1 key _MAIN
 */
async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<AstroFortuneOutput> {
  const apiKey = getGeminiMainApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key (_MAIN) is not configured in environment variables.');
  }

  const model = getGeminiModel();
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
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API error (${response.status}): ${errText.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Gemini returned an empty completion.');
    }

    const parsed = JSON.parse(content);
    const validated = astroFortuneResponseSchema.safeParse(parsed);
    if (!validated.success) {
      throw new Error(`Gemini fortune validation failed: ${validated.error.issues.map((i) => i.message).join(', ')}`);
    }

    return validated.data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Hàm chính tạo Lá Thăm Chiêm Tinh Dân Gian
 * Xử lý duy nhất bằng Google Gemini với 1 key _MAIN duy nhất (không fallback DeepSeek để giữ trọn vần điệu dân tộc).
 */
export async function generateAstroFortune(input: AstroFortuneInput): Promise<AstroFortuneOutput> {
  const { systemPrompt, userPrompt } = buildAstroFortunePrompt(input);
  return await generateWithGemini(systemPrompt, userPrompt);
}
