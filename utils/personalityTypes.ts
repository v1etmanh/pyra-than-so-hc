/**
 * Personality Assessment (Mini-IPIP 20-item Big Five)
 * Types, Question Dataset, Scoring Algorithm & Tone Directive Generator.
 */

export type PersonalityTrait =
  | 'extraversion'
  | 'agreeableness'
  | 'conscientiousness'
  | 'emotionality'
  | 'openness';

export interface PersonalityQuestion {
  id: number;
  trait: PersonalityTrait;
  text: string;
  textEn: string;
  reverse: boolean;
}

export interface PersonalityScores {
  extraversion: number; // 0 - 100%
  agreeableness: number;
  conscientiousness: number;
  emotionality: number;
  openness: number;
}

export interface PersonalityProfile {
  scores: PersonalityScores;
  dominantTraits: string[];
  communicationStyle: string;
  toneDirective: string;
  completedAt: number;
}

export const MINI_IPIP_QUESTIONS: PersonalityQuestion[] = [
  // 1. Extraversion (4 items)
  { id: 1, trait: 'extraversion', text: 'Tôi là người sôi nổi và cởi mở trong các cuộc trò chuyện.', textEn: 'I am the life of the party.', reverse: false },
  { id: 2, trait: 'extraversion', text: 'Tôi dễ dàng làm quen và trò chuyện với nhiều người khác nhau.', textEn: 'I talk to a lot of different people at parties.', reverse: false },
  { id: 3, trait: 'extraversion', text: 'Tôi thường ít khi chủ động mở lời trước đám đông.', textEn: "I don't talk a lot.", reverse: true },
  { id: 4, trait: 'extraversion', text: 'Tôi thích sự yên tĩnh và giữ mình phía sau hơn là nổi bật.', textEn: 'I keep in the background.', reverse: true },

  // 2. Agreeableness (4 items)
  { id: 5, trait: 'agreeableness', text: 'Tôi luôn đồng cảm và thấu hiểu sâu sắc cảm xúc của người khác.', textEn: "I sympathize with others' feelings.", reverse: false },
  { id: 6, trait: 'agreeableness', text: 'Tôi dễ cảm động và luôn sẵn sàng hỗ trợ người xung quanh.', textEn: "I feel others' emotions.", reverse: false },
  { id: 7, trait: 'agreeableness', text: 'Tôi thường tập trung vào mục tiêu của mình hơn là bận tâm chuyện người khác.', textEn: "I am not really interested in others.", reverse: true },
  { id: 8, trait: 'agreeableness', text: 'Tôi hiếm khi để vấn đề của người khác làm ảnh hưởng đến mình.', textEn: "I am not interested in other people's problems.", reverse: true },

  // 3. Conscientiousness (4 items)
  { id: 9, trait: 'conscientiousness', text: 'Tôi luôn bắt tay vào hoàn thành nhiệm vụ ngay khi có kế hoạch.', textEn: 'I get chores done right away.', reverse: false },
  { id: 10, trait: 'conscientiousness', text: 'Tôi thích sự ngăn nắp, kỷ luật và có trật tự rõ ràng.', textEn: 'I like order.', reverse: false },
  { id: 11, trait: 'conscientiousness', text: 'Tôi thỉnh thoảng hay quên hoặc để đồ đạc không đúng chỗ.', textEn: 'I often forget to put things back in their proper place.', reverse: true },
  { id: 12, trait: 'conscientiousness', text: 'Tôi làm việc theo cảm hứng và đôi khi hơi lộn xộn.', textEn: 'I make a mess of things.', reverse: true },

  // 4. Emotionality / Neuroticism (4 items)
  { id: 13, trait: 'emotionality', text: 'Tâm trạng của tôi khá nhạy cảm và dễ thay đổi theo hoàn cảnh.', textEn: 'I have frequent mood swings.', reverse: false },
  { id: 14, trait: 'emotionality', text: 'Tôi dễ cảm thấy lo âu hoặc bồn chồn trước các áp lực.', textEn: 'I get upset easily.', reverse: false },
  { id: 15, trait: 'emotionality', text: 'Hầu hết thời gian tôi cảm thấy thư giãn, bình thản và điềm tĩnh.', textEn: 'I am relaxed most of the time.', reverse: true },
  { id: 16, trait: 'emotionality', text: 'Tôi rất hiếm khi cảm thấy buồn bực hay suy sụp kéo dài.', textEn: 'I seldom feel blue.', reverse: true },

  // 5. Openness (4 items)
  { id: 17, trait: 'openness', text: 'Tôi có trí tưởng tượng phong phú và thích khám phá ý tưởng mới.', textEn: 'I have a vivid imagination.', reverse: false },
  { id: 18, trait: 'openness', text: 'Tôi thường thích những gì thực tế hơn là những khái niệm trừu tượng.', textEn: 'I have difficulty understanding abstract ideas.', reverse: true },
  { id: 19, trait: 'openness', text: 'Tôi không thực sự hứng thú với các chủ đề triết học hay nghệ thuật trừu tượng.', textEn: 'I am not interested in abstract ideas.', reverse: true },
  { id: 20, trait: 'openness', text: 'Tôi tin vào những điều đã được kiểm chứng hơn là trực giác.', textEn: 'I do not have a good imagination.', reverse: true },
];

export const TRAIT_DETAILS: Record<
  PersonalityTrait,
  { label: string; labelEn: string; highDesc: string; lowDesc: string; color: string }
> = {
  extraversion: {
    label: 'Hướng Ngoại',
    labelEn: 'Extraversion',
    highDesc: 'Năng động, sôi nổi, thích kết nối xã hội và truyền cảm hứng',
    lowDesc: 'Điềm đạm, sâu sắc, nạp năng lượng từ sự tĩnh lặng và nội tâm',
    color: '#FFD166'
  },
  agreeableness: {
    label: 'Thấu Cảm & Dễ Chịu',
    labelEn: 'Agreeableness',
    highDesc: 'Ấm áp, biết lắng nghe, giàu lòng trắc ẩn và tinh thần hợp tác',
    lowDesc: 'Thẳng thắn, lý tính, đề cao sự thật và ranh giới cá nhân',
    color: '#FF6B8B'
  },
  conscientiousness: {
    label: 'Tận Tâm & Kỷ Luật',
    labelEn: 'Conscientiousness',
    highDesc: 'Ngăn nắp, kiên định, kỷ luật tự giác cao và định hướng mục tiêu',
    lowDesc: 'Linh hoạt, ngẫu hứng, thích nghi nhanh và không thích gò bó',
    color: '#38BDF8'
  },
  emotionality: {
    label: 'Nhạy Cảm Cảm Xúc',
    labelEn: 'Emotional Sensitivity',
    highDesc: 'Chiều sâu cảm xúc cao, trực giác nhạy bén nhưng dễ chịu áp lực',
    lowDesc: 'Điềm tĩnh, vững vàng tâm lý, khả năng phục hồi cảm xúc tốt',
    color: '#C084FC'
  },
  openness: {
    label: 'Cởi Mở & Sáng Tạo',
    labelEn: 'Openness to Experience',
    highDesc: 'Tư duy trừu tượng tốt, giàu sức sáng tạo và đam mê triết lý',
    lowDesc: 'Thực tế, thực dụng, coi trọng kết quả cụ thể và kinh nghiệm',
    color: '#34D399'
  }
};

/**
 * Calculates standardized 0-100% scores for the 5 personality dimensions.
 * Answers is a dictionary of questionId (1-20) -> rating (1-5).
 */
export function calculatePersonalityScores(answers: Record<number, number>): PersonalityScores {
  const traitSums: Record<PersonalityTrait, number> = {
    extraversion: 0,
    agreeableness: 0,
    conscientiousness: 0,
    emotionality: 0,
    openness: 0
  };

  const traitCounts: Record<PersonalityTrait, number> = {
    extraversion: 0,
    agreeableness: 0,
    conscientiousness: 0,
    emotionality: 0,
    openness: 0
  };

  for (const q of MINI_IPIP_QUESTIONS) {
    const rawVal = answers[q.id] ?? 3;
    // Reverse scoring: 1->5, 2->4, 3->3, 4->2, 5->1
    const finalVal = q.reverse ? 6 - rawVal : rawVal;

    traitSums[q.trait] += finalVal;
    traitCounts[q.trait] += 1;
  }

  // Convert sum (range 4 to 20 for 4 items) to percentage 0% - 100%
  const calculatePct = (trait: PersonalityTrait): number => {
    const sum = traitSums[trait];
    const minPossible = 4;
    const maxPossible = 20;
    const pct = Math.round(((sum - minPossible) / (maxPossible - minPossible)) * 100);
    return Math.max(0, Math.min(100, pct));
  };

  return {
    extraversion: calculatePct('extraversion'),
    agreeableness: calculatePct('agreeableness'),
    conscientiousness: calculatePct('conscientiousness'),
    emotionality: calculatePct('emotionality'),
    openness: calculatePct('openness')
  };
}

/**
 * Generates an LLM Persona Directive from calculated personality scores.
 */
export function generatePersonalityProfile(answers: Record<number, number>): PersonalityProfile {
  const scores = calculatePersonalityScores(answers);
  const dominantTraits: string[] = [];

  if (scores.conscientiousness >= 60) dominantTraits.push('Kỷ luật & Tận tâm');
  else if (scores.conscientiousness <= 40) dominantTraits.push('Linh hoạt & Tự do');

  if (scores.openness >= 60) dominantTraits.push('Cởi mở & Sáng tạo');
  else if (scores.openness <= 40) dominantTraits.push('Thực tế & Thực chứng');

  if (scores.agreeableness >= 60) dominantTraits.push('Thấu cảm & Gắn kết');
  else if (scores.agreeableness <= 40) dominantTraits.push('Thẳng thắn & Độc lập');

  if (scores.emotionality >= 60) dominantTraits.push('Chiều sâu cảm xúc cao');
  else if (scores.emotionality <= 40) dominantTraits.push('Điềm tĩnh & Vững vàng');

  if (scores.extraversion >= 60) dominantTraits.push('Hướng ngoại & Năng động');
  else if (scores.extraversion <= 40) dominantTraits.push('Hướng nội & Trầm tĩnh');

  // Communication style summary
  let style = 'Cân bằng, thấu đáo và tôn trọng.';
  if (scores.conscientiousness >= 65 && scores.openness >= 65) {
    style = 'Cấu trúc gãy gọn, giàu tính chiến lược, có chiều sâu triết lý và tính thực thi cao.';
  } else if (scores.emotionality >= 65) {
    style = 'Ngôn từ ấm áp, thấu cảm, xoa dịu lo âu, nhấn mạnh sự an yên và lộ trình chữa lành.';
  } else if (scores.conscientiousness >= 65) {
    style = 'Đề mục rõ ràng, luận điểm logic, tập trung vào hành động thực tế và hiệu quả.';
  } else if (scores.openness >= 65) {
    style = 'Giàu hình tượng, triết lý sâu sắc, gợi mở trực giác và bản thể tâm hồn.';
  }

  // LLM Prompt Directive
  const toneDirectives: string[] = [];
  if (scores.conscientiousness >= 60) {
    toneDirectives.push('- Trình bày mạch lạc, đề mục rõ ràng, các bước hành động cụ thể (Actionable Steps).');
  }
  if (scores.emotionality >= 60) {
    toneDirectives.push('- Sử dụng ngôn từ giàu sự thấu cảm, nhẹ nhàng, xoa dịu bất an và hướng đến bình an nội tâm.');
  }
  if (scores.openness >= 60) {
    toneDirectives.push('- Lồng ghép các góc nhìn triết học sâu sắc, mở rộng ý nghĩa biểu tượng của con số.');
  }
  if (scores.agreeableness >= 60) {
    toneDirectives.push('- Nhấn mạnh vào tình yêu thương, sự hòa hợp trong mối quan hệ và đóng góp cho cộng đồng.');
  }

  const toneDirective = `Đương số có hồ sơ tâm lý: ${dominantTraits.join(', ')}. ${style}
Hướng dẫn cách diễn đạt:
${toneDirectives.join('\n') || '- Giữ văn phong khách quan, tôn trọng, truyền cảm hứng và sâu sắc.'}`;

  return {
    scores,
    dominantTraits: dominantTraits.slice(0, 3),
    communicationStyle: style,
    toneDirective,
    completedAt: Date.now()
  };
}
