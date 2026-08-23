import { buildSystemPrompt } from '@/app/api/chat/prompt';
import { buildProfileKnowledgeContext, type ProfileKnowledgeHit } from './profile-knowledge';
import type { NumerologyProfile24 } from '@/mocks/numerology-profile';
import type { RetrievalResult } from '@/app/api/chat/lib/retrieval-service';

export function buildNumerologyQASystemPrompt(
  question: string,
  profile: NumerologyProfile24,
  retrieval: RetrievalResult,
  profileHits: ProfileKnowledgeHit[],
  language = 'Vietnamese'
): string {
  const profileText = Object.entries(profile)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
  const profileKnowledge = buildProfileKnowledgeContext(profileHits);
  const chromaContext = retrieval.context || '(ChromaDB không tìm thấy đoạn kiến thức phù hợp.)';

  const taskPrompt = `
### USER QUESTION
${question}

### USER PROFILE: 24 NUMEROLOGY INDICATORS
${profileText}

### CHROMADB SEARCH CONTEXT
${chromaContext}

### SUPABASE PROFILE KNOWLEDGE
${profileKnowledge || '(Supabase chưa trả về bản ghi phù hợp.)'}

### ANSWERING RULES
- Trả lời dựa trên hai nguồn context ở trên; không tự bịa giá trị chỉ số.
- Ưu tiên kiến thức Supabase khi diễn giải đúng con số trong profile.
- Dùng ChromaDB để hiểu ý định/câu hỏi và chủ đề liên quan.
- Nếu hai nguồn không đủ dữ liệu, nói rõ giới hạn thay vì đoán.
- Đây là nội dung tham khảo/giải trí, không phải tư vấn y tế, tài chính, pháp lý hay dự đoán chắc chắn.
- Trả lời hoàn toàn bằng ${language}.
`;

  return buildSystemPrompt(taskPrompt, language);
}
