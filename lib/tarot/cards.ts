import type { LocalizedText, TarotCard, TarotSuit } from './types.ts';

const text = (vi: string, en: string): LocalizedText => ({ vi, en });
const words = (vi: string, en: string): LocalizedText[] => {
  const viWords = vi.split(',').map((value) => value.trim());
  const enWords = en.split(',').map((value) => value.trim());
  const size = Math.max(viWords.length, enWords.length);
  return Array.from({ length: size }, (_, index) => text(viWords[index] ?? viWords.at(-1)!, enWords[index] ?? enWords.at(-1)!));
};

interface MajorSeed {
  en: string;
  vi: string;
  slug: string;
  uprightVi: string;
  uprightEn: string;
  reversedVi: string;
  reversedEn: string;
  meaningVi: string;
  meaningEn: string;
  reversedMeaningVi: string;
  reversedMeaningEn: string;
}

const majorSeeds: MajorSeed[] = [
  { en: 'The Fool', vi: 'Kẻ Khờ', slug: 'fool', uprightVi: 'khởi đầu, tự do, niềm tin', uprightEn: 'beginnings, freedom, trust', reversedVi: 'bốc đồng, thiếu chuẩn bị, sợ bước đi', reversedEn: 'recklessness, poor preparation, fear of moving', meaningVi: 'Một hành trình mới đang mở ra; hãy tiến bước với sự cởi mở nhưng vẫn giữ nhận thức.', meaningEn: 'A new journey is opening; move with openness while staying aware.', reversedMeaningVi: 'Sự do dự hoặc liều lĩnh đang che khuất cơ hội; hãy kiểm tra lại nền tảng trước khi bước tiếp.', reversedMeaningEn: 'Hesitation or recklessness may obscure the opportunity; check your footing before moving.' },
  { en: 'The Magician', vi: 'Nhà Ảo Thuật', slug: 'magician', uprightVi: 'ý chí, năng lực, hành động', uprightEn: 'willpower, capability, action', reversedVi: 'thao túng, phân tán, tiềm năng lãng phí', reversedEn: 'manipulation, scattered focus, wasted potential', meaningVi: 'Bạn đã có những nguồn lực cần thiết để biến ý tưởng thành hành động có chủ đích.', meaningEn: 'You already hold the resources needed to turn intention into deliberate action.', reversedMeaningVi: 'Năng lực đang bị phân tán hoặc dùng sai hướng; cần làm rõ động cơ và ưu tiên.', reversedMeaningEn: 'Ability is scattered or misdirected; clarify motives and priorities.' },
  { en: 'The High Priestess', vi: 'Nữ Tư Tế', slug: 'high-priestess', uprightVi: 'trực giác, bí ẩn, trí tuệ nội tâm', uprightEn: 'intuition, mystery, inner wisdom', reversedVi: 'phớt lờ trực giác, bí mật, nhiễu loạn', reversedEn: 'ignored intuition, secrets, inner noise', meaningVi: 'Câu trả lời cần sự tĩnh lặng và lắng nghe điều bạn đã biết ở tầng sâu.', meaningEn: 'The answer asks for stillness and trust in what you already know beneath the surface.', reversedMeaningVi: 'Tiếng ồn hoặc điều chưa được nói ra đang cản trở trực giác; đừng vội kết luận.', reversedMeaningEn: 'Noise or what remains unsaid is blocking intuition; avoid rushing to conclusions.' },
  { en: 'The Empress', vi: 'Hoàng Hậu', slug: 'empress', uprightVi: 'nuôi dưỡng, phong phú, sáng tạo', uprightEn: 'nurture, abundance, creativity', reversedVi: 'cạn kiệt, phụ thuộc, bỏ quên bản thân', reversedEn: 'depletion, dependence, self-neglect', meaningVi: 'Điều đang hình thành cần được nuôi dưỡng bằng sự kiên nhẫn, cảm nhận và chăm sóc.', meaningEn: 'What is growing needs patience, embodiment and steady care.', reversedMeaningVi: 'Bạn có thể đang trao quá nhiều hoặc xa rời nhu cầu của mình; hãy phục hồi trước khi tiếp tục.', reversedMeaningEn: 'You may be overgiving or disconnected from your needs; restore yourself before continuing.' },
  { en: 'The Emperor', vi: 'Hoàng Đế', slug: 'emperor', uprightVi: 'cấu trúc, ổn định, lãnh đạo', uprightEn: 'structure, stability, leadership', reversedVi: 'kiểm soát, cứng nhắc, thiếu kỷ luật', reversedEn: 'control, rigidity, lack of discipline', meaningVi: 'Tiến triển đến từ ranh giới rõ ràng, trách nhiệm và một kế hoạch có cấu trúc.', meaningEn: 'Progress comes through clear boundaries, responsibility and a sound structure.', reversedMeaningVi: 'Kiểm soát quá mức hoặc thiếu nền nếp đang tạo lực cản; cần cân bằng quyền lực với linh hoạt.', reversedMeaningEn: 'Too much control or too little discipline creates resistance; balance authority with flexibility.' },
  { en: 'The Hierophant', vi: 'Giáo Hoàng', slug: 'hierophant', uprightVi: 'truyền thống, học hỏi, chỉ dẫn', uprightEn: 'tradition, learning, guidance', reversedVi: 'phá khuôn, giáo điều, niềm tin cá nhân', reversedEn: 'nonconformity, dogma, personal belief', meaningVi: 'Một hệ thống đáng tin, người hướng dẫn hoặc giá trị lâu bền có thể giúp bạn tiến lên.', meaningEn: 'A trusted framework, mentor or enduring value can help you move forward.', reversedMeaningVi: 'Đã đến lúc xem lại điều bạn làm chỉ vì thói quen và chọn niềm tin thực sự thuộc về mình.', reversedMeaningEn: 'Question what you follow from habit and choose beliefs that are genuinely yours.' },
  { en: 'The Lovers', vi: 'Tình Nhân', slug: 'lovers', uprightVi: 'kết nối, lựa chọn, hòa hợp', uprightEn: 'connection, choice, alignment', reversedVi: 'lệch giá trị, bất hòa, lựa chọn khó', reversedEn: 'misaligned values, discord, difficult choice', meaningVi: 'Sự hòa hợp chỉ bền khi lựa chọn phản ánh đúng giá trị và sự thành thật của bạn.', meaningEn: 'Harmony lasts when your choice reflects your values and honesty.', reversedMeaningVi: 'Sự hấp dẫn không che được khác biệt cốt lõi; cần đối thoại về giá trị và trách nhiệm.', reversedMeaningEn: 'Attraction cannot hide a core mismatch; discuss values and responsibility honestly.' },
  { en: 'The Chariot', vi: 'Cỗ Xe', slug: 'chariot', uprightVi: 'quyết tâm, tiến lên, tự chủ', uprightEn: 'determination, progress, self-command', reversedVi: 'mất hướng, cưỡng ép, thiếu kiểm soát', reversedEn: 'loss of direction, force, poor control', meaningVi: 'Bạn có thể tiến nhanh khi thống nhất mục tiêu và điều khiển những lực kéo trái chiều.', meaningEn: 'You can move quickly once conflicting forces are brought under one clear direction.', reversedMeaningVi: 'Ý chí đang bị kéo theo nhiều hướng; giảm tốc và xác định điều thực sự cần đạt.', reversedMeaningEn: 'Your will is being pulled in different directions; slow down and define the real aim.' },
  { en: 'Strength', vi: 'Sức Mạnh', slug: 'strength', uprightVi: 'dũng khí, dịu dàng, nội lực', uprightEn: 'courage, gentleness, inner strength', reversedVi: 'tự nghi ngờ, kiệt sức, phản ứng mạnh', reversedEn: 'self-doubt, depletion, reactivity', meaningVi: 'Sức mạnh hiệu quả nhất lúc này là bình tĩnh, kiên nhẫn và làm chủ phản ứng.', meaningEn: 'The most effective strength now is calm courage, patience and self-command.', reversedMeaningVi: 'Tự nghi ngờ hoặc cạn năng lượng đang phóng đại khó khăn; hãy đối xử tử tế với chính mình.', reversedMeaningEn: 'Self-doubt or depletion is magnifying the challenge; meet yourself with compassion.' },
  { en: 'The Hermit', vi: 'Ẩn Sĩ', slug: 'hermit', uprightVi: 'chiêm nghiệm, đơn độc, tìm kiếm', uprightEn: 'reflection, solitude, seeking', reversedVi: 'cô lập, trốn tránh, mất kết nối', reversedEn: 'isolation, avoidance, disconnection', meaningVi: 'Lùi lại khỏi tiếng ồn sẽ giúp bạn nhận ra câu trả lời dựa trên trải nghiệm thật.', meaningEn: 'Stepping away from noise can reveal an answer grounded in lived wisdom.', reversedMeaningVi: 'Khoảng lặng đã trở thành cô lập; hãy tìm một điểm tựa đáng tin thay vì tự gánh mọi thứ.', reversedMeaningEn: 'Solitude has become isolation; seek trusted support instead of carrying everything alone.' },
  { en: 'Wheel of Fortune', vi: 'Bánh Xe Số Phận', slug: 'wheel-of-fortune', uprightVi: 'chu kỳ, thay đổi, cơ hội', uprightEn: 'cycles, change, opportunity', reversedVi: 'chậm trễ, chống thay đổi, lặp lại', reversedEn: 'delay, resistance, repetition', meaningVi: 'Một chu kỳ đang chuyển; khả năng thích nghi sẽ quyết định cách bạn đón cơ hội.', meaningEn: 'A cycle is turning; adaptability will shape how you meet the opportunity.', reversedMeaningVi: 'Mẫu cũ có thể đang lặp lại vì bạn chống lại thay đổi cần thiết.', reversedMeaningEn: 'An old pattern may be repeating because a necessary change is being resisted.' },
  { en: 'Justice', vi: 'Công Lý', slug: 'justice', uprightVi: 'sự thật, cân bằng, trách nhiệm', uprightEn: 'truth, balance, accountability', reversedVi: 'thiên lệch, né tránh, bất công', reversedEn: 'bias, avoidance, unfairness', meaningVi: 'Hãy nhìn dữ kiện rõ ràng và nhận trách nhiệm cho phần bạn có thể kiểm soát.', meaningEn: 'Look clearly at the facts and take responsibility for what is yours to influence.', reversedMeaningVi: 'Thiên lệch hoặc né tránh hậu quả đang làm tình hình mất cân bằng.', reversedMeaningEn: 'Bias or avoidance of consequences is keeping the situation out of balance.' },
  { en: 'The Hanged Man', vi: 'Người Treo Ngược', slug: 'hanged-man', uprightVi: 'tạm dừng, buông bỏ, góc nhìn mới', uprightEn: 'pause, surrender, new perspective', reversedVi: 'trì hoãn, mắc kẹt, hy sinh vô ích', reversedEn: 'delay, stagnation, needless sacrifice', meaningVi: 'Tạm dừng không phải thất bại; một góc nhìn khác có thể mở nút thắt.', meaningEn: 'A pause is not failure; a different perspective can release the knot.', reversedMeaningVi: 'Sự chờ đợi không còn tạo ra hiểu biết; cần thay đổi cách tiếp cận hoặc đặt giới hạn.', reversedMeaningEn: 'Waiting is no longer producing insight; change the approach or set a boundary.' },
  { en: 'Death', vi: 'Cái Chết', slug: 'death', uprightVi: 'kết thúc, chuyển hóa, tái sinh', uprightEn: 'ending, transformation, renewal', reversedVi: 'bám giữ, trì trệ, sợ thay đổi', reversedEn: 'clinging, stagnation, fear of change', meaningVi: 'Một giai đoạn cần khép lại để tạo chỗ cho điều mới; đây là chuyển hóa, không phải cái chết theo nghĩa đen.', meaningEn: 'A chapter needs to close so another can begin; this is transformation, not literal death.', reversedMeaningVi: 'Việc bám vào điều đã hết vai trò đang kéo dài sự trì trệ.', reversedMeaningEn: 'Holding onto what has finished is prolonging stagnation.' },
  { en: 'Temperance', vi: 'Tiết Chế', slug: 'temperance', uprightVi: 'điều hòa, kiên nhẫn, cân bằng', uprightEn: 'integration, patience, balance', reversedVi: 'quá mức, xung đột, mất nhịp', reversedEn: 'excess, conflict, imbalance', meaningVi: 'Giải pháp nằm ở sự điều chỉnh từ tốn và kết hợp các phần tưởng như đối lập.', meaningEn: 'The solution lies in patient adjustment and integrating seemingly opposite parts.', reversedMeaningVi: 'Quá mức hoặc thiếu nhất quán đang làm hao hụt năng lượng; hãy đưa mọi thứ về nhịp bền vững.', reversedMeaningEn: 'Excess or inconsistency is draining energy; return to a sustainable rhythm.' },
  { en: 'The Devil', vi: 'Ác Quỷ', slug: 'devil', uprightVi: 'ràng buộc, cám dỗ, bóng tối', uprightEn: 'attachment, temptation, shadow', reversedVi: 'giải phóng, nhận thức, phá vòng lặp', reversedEn: 'release, awareness, breaking patterns', meaningVi: 'Hãy gọi tên điều đang trói buộc bạn; nhận thức là bước đầu để lấy lại quyền lựa chọn.', meaningEn: 'Name what has a hold on you; awareness is the first step toward reclaiming choice.', reversedMeaningVi: 'Bạn đang nhìn thấy vòng lặp và có khả năng thoát khỏi nó bằng hành động cụ thể.', reversedMeaningEn: 'You are seeing the pattern and can begin releasing it through concrete action.' },
  { en: 'The Tower', vi: 'Tòa Tháp', slug: 'tower', uprightVi: 'đột biến, thức tỉnh, cấu trúc sụp đổ', uprightEn: 'upheaval, revelation, collapse', reversedVi: 'né khủng hoảng, trì hoãn, thay đổi bên trong', reversedEn: 'avoided crisis, delay, inner upheaval', meaningVi: 'Một cấu trúc không còn đúng có thể thay đổi đột ngột, buộc sự thật phải được nhìn thấy.', meaningEn: 'An unstable structure may change suddenly, forcing truth into view.', reversedMeaningVi: 'Bạn đang cố trì hoãn thay đổi hoặc trải qua một cuộc tái cấu trúc âm thầm bên trong.', reversedMeaningEn: 'You may be postponing change or moving through a quieter internal restructuring.' },
  { en: 'The Star', vi: 'Ngôi Sao', slug: 'star', uprightVi: 'hy vọng, chữa lành, cảm hứng', uprightEn: 'hope, healing, inspiration', reversedVi: 'mất niềm tin, nản lòng, xa bản thân', reversedEn: 'discouragement, lost faith, disconnection', meaningVi: 'Sau khó khăn, sự sáng rõ và khả năng chữa lành đang trở lại từng bước.', meaningEn: 'After difficulty, clarity and the capacity to heal are returning step by step.', reversedMeaningVi: 'Hy vọng đang bị che mờ; hãy bắt đầu từ một hành động nhỏ có thể kiểm chứng.', reversedMeaningEn: 'Hope feels obscured; begin with one small, verifiable act of renewal.' },
  { en: 'The Moon', vi: 'Mặt Trăng', slug: 'moon', uprightVi: 'mơ hồ, tiềm thức, trực giác', uprightEn: 'uncertainty, subconscious, intuition', reversedVi: 'sự thật lộ ra, nhầm lẫn giảm, sợ hãi', reversedEn: 'truth emerging, clearing confusion, fear', meaningVi: 'Không phải mọi thứ đều rõ; hãy phân biệt trực giác với nỗi sợ và chờ thêm dữ kiện.', meaningEn: 'Not everything is clear; separate intuition from fear and allow more facts to emerge.', reversedMeaningVi: 'Màn sương đang tan nhưng cảm xúc cũ vẫn có thể bóp méo cách bạn nhìn sự việc.', reversedMeaningEn: 'The fog is lifting, though old fears may still distort perception.' },
  { en: 'The Sun', vi: 'Mặt Trời', slug: 'sun', uprightVi: 'niềm vui, rõ ràng, sinh lực', uprightEn: 'joy, clarity, vitality', reversedVi: 'niềm vui bị trì hoãn, quá tự tin, mệt mỏi', reversedEn: 'delayed joy, overconfidence, fatigue', meaningVi: 'Sự rõ ràng và sức sống hỗ trợ một kết quả tích cực khi bạn xuất hiện chân thật.', meaningEn: 'Clarity and vitality support a positive outcome when you show up authentically.', reversedMeaningVi: 'Điều tốt vẫn hiện diện nhưng kỳ vọng hoặc kiệt sức khiến bạn khó cảm nhận trọn vẹn.', reversedMeaningEn: 'Goodness remains present, but expectations or fatigue make it harder to feel.' },
  { en: 'Judgement', vi: 'Phán Xét', slug: 'judgement', uprightVi: 'thức tỉnh, tổng kết, tiếng gọi', uprightEn: 'awakening, reckoning, calling', reversedVi: 'tự phán xét, chần chừ, không nghe lời gọi', reversedEn: 'self-judgement, hesitation, ignored call', meaningVi: 'Đã đến lúc tổng kết bài học và trả lời một tiếng gọi trưởng thành hơn.', meaningEn: 'It is time to integrate the lesson and answer a more mature calling.', reversedMeaningVi: 'Sự tự phán xét hoặc chần chừ đang giữ bạn khỏi quyết định đã khá rõ.', reversedMeaningEn: 'Self-judgement or hesitation is keeping you from a decision that is becoming clear.' },
  { en: 'The World', vi: 'Thế Giới', slug: 'world', uprightVi: 'hoàn thành, hội nhập, thành tựu', uprightEn: 'completion, integration, achievement', reversedVi: 'dở dang, chậm hoàn tất, thiếu khép lại', reversedEn: 'unfinished business, delay, lack of closure', meaningVi: 'Một chu kỳ đạt độ chín; hãy ghi nhận thành quả và chuẩn bị bước sang vòng mới.', meaningEn: 'A cycle has matured; acknowledge the achievement and prepare for the next one.', reversedMeaningVi: 'Một chi tiết hoặc bài học chưa hoàn tất đang ngăn cảm giác khép lại.', reversedMeaningEn: 'One unfinished detail or lesson is preventing a true sense of closure.' }
];

const majorArcana: TarotCard[] = majorSeeds.map((seed, number) => ({
  id: `major-${number.toString().padStart(2, '0')}`,
  name: text(seed.vi, seed.en),
  type: 'major',
  number,
  image: `/tarot/cards/major/${number.toString().padStart(2, '0')}-${seed.slug}.jpg`,
  keywords: {
    upright: words(seed.uprightVi, seed.uprightEn),
    reversed: words(seed.reversedVi, seed.reversedEn)
  },
  meaning: {
    upright: text(seed.meaningVi, seed.meaningEn),
    reversed: text(seed.reversedMeaningVi, seed.reversedMeaningEn)
  }
}));

interface MinorKeywordSeed {
  upVi: string;
  upEn: string;
  revVi: string;
  revEn: string;
}

const k = (upVi: string, upEn: string, revVi: string, revEn: string): MinorKeywordSeed => ({ upVi, upEn, revVi, revEn });

const minorKeywords: Record<TarotSuit, MinorKeywordSeed[]> = {
  wands: [
    k('cảm hứng, khởi động, tiềm năng', 'inspiration, initiative, potential', 'trì hoãn, thiếu động lực, lỡ nhịp', 'delay, low motivation, missed timing'),
    k('kế hoạch, tầm nhìn, lựa chọn', 'planning, vision, choice', 'do dự, sợ thay đổi, hạn chế', 'hesitation, fear of change, limitation'),
    k('mở rộng, tiến triển, hợp tác', 'expansion, progress, cooperation', 'trở ngại, chậm trễ, thất vọng', 'obstacles, delays, frustration'),
    k('ổn định, ăn mừng, thuộc về', 'stability, celebration, belonging', 'bất ổn, thiếu hỗ trợ, căng thẳng', 'instability, poor support, tension'),
    k('cạnh tranh, va chạm, thử thách', 'competition, friction, challenge', 'né xung đột, hòa giải, dồn nén', 'avoidance, reconciliation, suppression'),
    k('chiến thắng, công nhận, tự tin', 'victory, recognition, confidence', 'kiêu hãnh, thiếu công nhận, thất bại', 'pride, lack of recognition, setback'),
    k('kiên định, bảo vệ, dũng khí', 'conviction, defence, courage', 'quá tải, bỏ cuộc, phòng thủ quá mức', 'overwhelm, giving up, defensiveness'),
    k('tốc độ, tin tức, chuyển động', 'speed, news, movement', 'trì hoãn, hỗn loạn, vội vàng', 'delay, disorder, rushing'),
    k('bền bỉ, cảnh giác, ranh giới', 'resilience, vigilance, boundaries', 'kiệt sức, nghi ngờ, cứng nhắc', 'exhaustion, doubt, rigidity'),
    k('gánh nặng, trách nhiệm, hoàn tất', 'burden, responsibility, completion', 'sụp sức, ôm đồm, buông gánh', 'burnout, overcommitment, release'),
    k('khám phá, tin vui, tò mò', 'exploration, news, curiosity', 'thiếu hướng, nóng vội, xao nhãng', 'lack of direction, impatience, distraction'),
    k('hành động, phiêu lưu, nhiệt huyết', 'action, adventure, passion', 'bốc đồng, giận dữ, bất ổn', 'impulsiveness, anger, instability'),
    k('tự tin, hấp dẫn, độc lập', 'confidence, charisma, independence', 'ghen tuông, bất an, ích kỷ', 'jealousy, insecurity, selfishness'),
    k('lãnh đạo, tầm nhìn, quyết đoán', 'leadership, vision, decisiveness', 'độc đoán, hấp tấp, phi thực tế', 'domination, haste, unrealistic plans')
  ],
  cups: [
    k('tình cảm mới, trực giác, mở lòng', 'new feeling, intuition, openness', 'cảm xúc nghẽn, trống rỗng, thu mình', 'blocked emotion, emptiness, withdrawal'),
    k('kết nối, hòa hợp, tương hỗ', 'connection, harmony, reciprocity', 'mất cân bằng, xa cách, căng thẳng', 'imbalance, distance, tension'),
    k('bạn bè, niềm vui, cộng đồng', 'friendship, joy, community', 'quá đà, lời đồn, cô lập', 'excess, gossip, isolation'),
    k('chiêm nghiệm, thờ ơ, đánh giá lại', 'reflection, apathy, reassessment', 'thức tỉnh, cơ hội mới, tiếp nhận', 'awakening, new opportunity, acceptance'),
    k('mất mát, tiếc nuối, buồn đau', 'loss, regret, grief', 'chấp nhận, hồi phục, bước tiếp', 'acceptance, recovery, moving on'),
    k('hoài niệm, ngây thơ, ký ức', 'nostalgia, innocence, memory', 'kẹt trong quá khứ, trưởng thành, độc lập', 'stuck in past, maturity, independence'),
    k('nhiều lựa chọn, tưởng tượng, cám dỗ', 'many choices, imagination, temptation', 'ảo tưởng tan, rõ chọn lựa, thực tế', 'illusion clearing, decision, realism'),
    k('rời đi, tìm kiếm, vỡ mộng', 'departure, seeking, disillusionment', 'sợ rời bỏ, né tránh, mắc kẹt', 'fear of leaving, avoidance, stagnation'),
    k('mãn nguyện, ước muốn, đủ đầy', 'satisfaction, wish, fulfilment', 'tham cầu, chưa đủ, trống rỗng', 'greed, dissatisfaction, emptiness'),
    k('hạnh phúc, gia đình, hòa hợp', 'happiness, family, harmony', 'rạn nứt, kỳ vọng vỡ, bất hòa', 'fracture, broken expectations, discord'),
    k('nhạy cảm, trực giác, thông điệp', 'sensitivity, intuition, message', 'non nớt, thất thường, bất an', 'immaturity, moodiness, insecurity'),
    k('lãng mạn, đề nghị, theo trái tim', 'romance, proposal, following the heart', 'ảo tưởng, thất vọng, thay đổi thất thường', 'fantasy, disappointment, inconsistency'),
    k('thấu cảm, chăm sóc, trưởng thành', 'empathy, care, maturity', 'phụ thuộc, quá nhạy, thiếu ranh giới', 'dependence, oversensitivity, weak boundaries'),
    k('cân bằng cảm xúc, khôn ngoan, điềm tĩnh', 'emotional balance, wisdom, calm', 'kìm nén, thao túng, lạnh nhạt', 'repression, manipulation, coldness')
  ],
  swords: [
    k('đột phá, sự thật, sáng rõ', 'breakthrough, truth, clarity', 'nhầm lẫn, lời sắc, thiếu rõ ràng', 'confusion, harsh words, clouded judgement'),
    k('bế tắc, cân nhắc, quyết định khó', 'stalemate, deliberation, difficult choice', 'né quyết định, thiếu tin, quá tải', 'avoidance, missing information, overwhelm'),
    k('đau lòng, chia ly, sự thật đau', 'heartbreak, separation, painful truth', 'chữa lành, tha thứ, hồi phục', 'healing, forgiveness, recovery'),
    k('nghỉ ngơi, hồi phục, tĩnh tâm', 'rest, recovery, contemplation', 'bồn chồn, kiệt sức, áp lực', 'restlessness, burnout, pressure'),
    k('xung đột, thắng bằng mọi giá, tổn thất', 'conflict, hollow victory, loss', 'hối tiếc, hòa giải, sửa chữa', 'regret, reconciliation, repair'),
    k('chuyển tiếp, rời khó khăn, chữa lành', 'transition, leaving difficulty, healing', 'kẹt lại, hành lý cũ, chống chuyển đổi', 'stagnation, old baggage, resistance'),
    k('chiến lược, bí mật, né tránh', 'strategy, secrecy, avoidance', 'thú nhận, bị lộ, sửa sai', 'confession, exposure, making amends'),
    k('tự giới hạn, sợ hãi, mắc kẹt', 'self-limitation, fear, restriction', 'giải phóng, góc nhìn mới, tự do', 'release, new perspective, freedom'),
    k('lo âu, ác mộng, suy diễn', 'anxiety, nightmares, rumination', 'hy vọng, tìm hỗ trợ, hồi phục', 'hope, seeking help, recovery'),
    k('kết thúc đau, thất bại, chạm đáy', 'painful ending, defeat, rock bottom', 'sống lại, qua cơn, bắt đầu phục hồi', 'survival, turning point, recovery'),
    k('tò mò, cảnh giác, học hỏi', 'curiosity, vigilance, learning', 'lời đồn, hấp tấp, thiếu chín chắn', 'gossip, haste, immaturity'),
    k('quyết liệt, tham vọng, tốc độ', 'decisiveness, ambition, speed', 'liều lĩnh, công kích, mất hướng', 'recklessness, aggression, poor direction'),
    k('độc lập, ranh giới, thành thật', 'independence, boundaries, honesty', 'lạnh lùng, cay nghiệt, oán giận', 'coldness, bitterness, resentment'),
    k('lý trí, quyền uy, công bằng', 'reason, authority, fairness', 'độc đoán, tàn nhẫn, lạm quyền', 'tyranny, cruelty, abuse of power')
  ],
  pentacles: [
    k('cơ hội thực tế, thịnh vượng, khởi đầu', 'practical opportunity, prosperity, beginning', 'lỡ cơ hội, đầu tư kém, trì hoãn', 'missed chance, poor investment, delay'),
    k('cân bằng, thích nghi, ưu tiên', 'balance, adaptability, priorities', 'quá tải, hỗn loạn, mất cân bằng', 'overload, disorder, imbalance'),
    k('hợp tác, kỹ năng, xây dựng', 'teamwork, skill, building', 'thiếu hợp tác, chất lượng kém, xung đột', 'poor teamwork, low quality, conflict'),
    k('an toàn, tiết kiệm, kiểm soát', 'security, saving, control', 'tham giữ, sợ mất, cứng nhắc', 'possessiveness, fear of loss, rigidity'),
    k('thiếu thốn, khó khăn, bất an', 'hardship, scarcity, insecurity', 'hồi phục, nhận giúp đỡ, cải thiện', 'recovery, accepting help, improvement'),
    k('cho nhận, hào phóng, công bằng', 'giving, generosity, fairness', 'điều kiện, nợ nần, mất quyền', 'strings attached, debt, power imbalance'),
    k('kiên nhẫn, đánh giá, đầu tư dài hạn', 'patience, assessment, long-term investment', 'nóng vội, ít kết quả, lãng phí', 'impatience, poor return, waste'),
    k('chăm chỉ, rèn nghề, tiến bộ', 'diligence, craft, improvement', 'cẩu thả, thiếu động lực, lặp lại vô thức', 'carelessness, low motivation, mindless repetition'),
    k('độc lập, thành quả, tự chủ', 'independence, reward, self-reliance', 'bất ổn tài chính, cô lập, lệ thuộc hình ảnh', 'financial instability, isolation, image dependence'),
    k('di sản, gia đình, ổn định lâu dài', 'legacy, family, long-term stability', 'bất ổn, mất mát, xung đột gia đình', 'instability, loss, family conflict'),
    k('học nghề, cơ hội, thực tế', 'study, opportunity, practicality', 'lười biếng, thiếu cam kết, bỏ học', 'laziness, low commitment, poor follow-through'),
    k('bền bỉ, trách nhiệm, tiến chậm', 'persistence, responsibility, slow progress', 'trì trệ, cứng đầu, nhàm chán', 'stagnation, stubbornness, boredom'),
    k('thực tế, chăm sóc, sung túc', 'practicality, care, abundance', 'ích kỷ, ghen tị, vật chất hóa', 'selfishness, jealousy, materialism'),
    k('thành công, tin cậy, quản trị', 'success, reliability, stewardship', 'tham lam, bảo thủ, tha hóa', 'greed, conservatism, corruption')
  ]
};

const suits: Record<TarotSuit, LocalizedText> = {
  wands: text('Gậy', 'Wands'),
  cups: text('Cốc', 'Cups'),
  swords: text('Kiếm', 'Swords'),
  pentacles: text('Tiền', 'Pentacles')
};

const ranks: Record<number, LocalizedText> = {
  1: text('Át', 'Ace'),
  11: text('Tiểu Đồng', 'Page'),
  12: text('Kỵ Sĩ', 'Knight'),
  13: text('Nữ Hoàng', 'Queen'),
  14: text('Nhà Vua', 'King')
};

function minorName(suit: TarotSuit, number: number): LocalizedText {
  const rank = ranks[number];
  return rank
    ? text(`${rank.vi} ${suits[suit].vi}`, `${rank.en} of ${suits[suit].en}`)
    : text(`${number} ${suits[suit].vi}`, `${number} of ${suits[suit].en}`);
}

function createMinorArcana(suit: TarotSuit): TarotCard[] {
  return minorKeywords[suit].map((seed, index) => {
    const number = index + 1;
    const name = minorName(suit, number);
    return {
      id: `${suit}-${number.toString().padStart(2, '0')}`,
      name,
      type: 'minor',
      suit,
      number,
      image: `/tarot/cards/minor/${suit}/${number.toString().padStart(2, '0')}.jpg`,
      keywords: {
        upright: words(seed.upVi, seed.upEn),
        reversed: words(seed.revVi, seed.revEn)
      },
      meaning: {
        upright: text(
          `${name.vi} xuôi nhấn mạnh ${seed.upVi}; hãy liên hệ năng lượng này với vị trí của lá trong trải bài.`,
          `The upright ${name.en} highlights ${seed.upEn}; read this energy through the card's spread position.`
        ),
        reversed: text(
          `${name.vi} ngược gợi ý ${seed.revVi}; đây là điểm cần nhìn lại thay vì một kết luận cố định.`,
          `The reversed ${name.en} suggests ${seed.revEn}; treat it as an area for reflection, not a fixed verdict.`
        )
      }
    };
  });
}

const minorArcana = (Object.keys(suits) as TarotSuit[]).flatMap(createMinorArcana);

export const allTarotCards: TarotCard[] = [...majorArcana, ...minorArcana];
export const majorArcanaCards = majorArcana;
export const minorArcanaCards = minorArcana;

const cardMap = new Map(allTarotCards.map((card) => [card.id, card]));

export function getTarotCard(id: string): TarotCard | undefined {
  return cardMap.get(id);
}

export function getTarotCardsBySuit(suit: TarotSuit): TarotCard[] {
  return minorArcana.filter((card) => card.suit === suit);
}
