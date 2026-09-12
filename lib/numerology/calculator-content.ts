export type CalculatorType =
  | 'life-path-number-calculator'
  | 'expression-number-calculator'
  | 'soul-urge-number-calculator'
  | 'personal-year-number-calculator'
  | 'personality-number-calculator'
  | 'birthday-number-calculator'
  | 'maturity-number-calculator';

export interface NumberMeaning {
  titleVi: string;
  titleEn: string;
  archetypeVi: string;
  archetypeEn: string;
  strengthsVi: string[];
  strengthsEn: string[];
  challengesVi: string[];
  challengesEn: string[];
  adviceVi: string;
  adviceEn: string;
}

export interface CalculatorPageData {
  slug: CalculatorType;
  nameVi: string;
  nameEn: string;
  h1Vi: string;
  h1En: string;
  kickerVi: string;
  kickerEn: string;
  introVi: string;
  introEn: string;
  inputType: 'date' | 'name' | 'name-date' | 'date-year';
  manualFormulaVi: string;
  manualFormulaEn: string;
  manualStepsVi: string[];
  manualStepsEn: string[];
  meanings: Record<number, NumberMeaning>;
  faqs: Array<{ qVi: string; qEn: string; aVi: string; aEn: string }>;
  relatedSlugs: Array<{ slug: string; nameVi: string; nameEn: string; descVi: string; descEn: string }>;
}

// 1–9 & 11, 22, 33 Base Meanings
const CORE_ARCHETYPES: Record<number, { vi: { title: string; archetype: string; str: string[]; cha: string[]; adv: string }; en: { title: string; archetype: string; str: string[]; cha: string[]; adv: string } }> = {
  1: {
    vi: {
      title: 'Nhà Lãnh Đạo Tiên Phong',
      archetype: 'The Pioneer & Leader',
      str: ['Độc lập, ý chí kiên định', 'Khả năng khởi xướng vượt trội', 'Tư duy đổi mới, quyết đoán'],
      cha: ['Dễ rơi vào độc đoán hoặc thiếu kiên nhẫn', 'Khó thỏa hiệp hoặc lắng nghe ý kiến người khác'],
      adv: 'Hãy rèn luyện sự khiêm nhường và học cách dẫn dắt bằng cảm hứng thay vì áp đặt quyền uy.'
    },
    en: {
      title: 'The Pioneer & Leader',
      archetype: 'The Independent Trailblazer',
      str: ['Strong independence and initiative', 'Courage to start new paths', 'Original and decisive vision'],
      cha: ['Can be domineering or impatient', 'Struggles to compromise or delegate'],
      adv: 'Lead with inspiration rather than command; balance your fierce autonomy with collaborative grace.'
    }
  },
  2: {
    vi: {
      title: 'Sứ Giả Hòa Bình & Trực Giác',
      archetype: 'The Diplomat & Peacemaker',
      str: ['Trực giác nhạy bén, đồng cảm sâu sắc', 'Năng khiếu ngoại giao, hòa giải', 'Biết cách lắng nghe và gắn kết'],
      cha: ['Dễ nhạy cảm thái quá, sợ xung đột', 'Có xu hướng phụ thuộc cảm xúc vào người khác'],
      adv: 'Thiết lập ranh giới cảm xúc lành mạnh và tin tưởng vào tiếng nói nội tâm của chính bạn.'
    },
    en: {
      title: 'The Diplomat & Peacemaker',
      archetype: 'The Intuitive Connector',
      str: ['Deep intuition and empathy', 'Gift of peaceful reconciliation', 'Exceptional listening and patience'],
      cha: ['Overly sensitive to criticism', 'Tendency to avoid confrontation at personal expense'],
      adv: 'Hold firm personal boundaries while offering your calming presence to the world.'
    }
  },
  3: {
    vi: {
      title: 'Nghệ Sĩ Biểu Đạt & Sáng Tạo',
      archetype: 'The Creative Communicator',
      str: ['Năng lượng lạc quan, truyền cảm hứng', 'Khả năng ngôn từ và nghệ thuật vượt trội', 'Tâm hồn phong phú, hòa đồng'],
      cha: ['Dễ phân tán năng lượng, thiếu kiên trì', 'Đôi khi trốn tránh cảm xúc thật bằng sự vui vẻ bề ngoài'],
      adv: 'Tập trung năng lượng sáng tạo vào mục tiêu dài hạn và học cách đối diện với chiều sâu nội tâm.'
    },
    en: {
      title: 'The Creative Communicator',
      archetype: 'The Joyful Expressionist',
      str: ['Inspirational optimism and charm', 'Gifted verbal and artistic expression', 'Social warmth and creative imagination'],
      cha: ['Scattered energy and procrastination', 'Superficial defense mechanisms against sadness'],
      adv: 'Anchor your luminous creative impulses into consistent discipline and meaningful work.'
    }
  },
  4: {
    vi: {
      title: 'Người Xây Dựng & Kỷ Luật',
      archetype: 'The Master Builder & Strategist',
      str: ['Kỷ luật vững vàng, tỉ mỉ, đáng tin cậy', 'Tư duy logic, tổ chức hệ thống', 'Kiên định, trách nhiệm cao'],
      cha: ['Cứng nhắc, khó thích ứng với thay đổi', 'Đôi khi quá bảo thủ hoặc làm việc kiệt sức'],
      adv: 'Học cách đón nhận những điều bất ngờ và cho phép bản thân linh hoạt trước dòng chảy cuộc sống.'
    },
    en: {
      title: 'The Master Builder & Strategist',
      archetype: 'The Pillar of Stability',
      str: ['Rock-solid discipline and reliability', 'Systematic, methodical thinking', 'Unwavering loyalty and endurance'],
      cha: ['Rigid resistance to spontaneous change', 'Workaholism and perfectionism'],
      adv: 'Allow flexibility to soften your structure; remember that adaptability is also strength.'
    }
  },
  5: {
    vi: {
      title: 'Nhà Thám Hiểm Tự Do',
      archetype: 'The Freedom Seeker & Catalyst',
      str: ['Thích ứng phi thường, đa tài', 'Khát khao phiêu lưu, khám phá thế giới', 'Khả năng lan tỏa năng lượng đổi mới'],
      cha: ['Dễ bồn chồn, thiếu kiên nhẫn', 'Sợ sự ràng buộc, dễ sa đà vào phóng túng'],
      adv: 'Tự do đích thực đến từ sự làm chủ bản thân; hãy tìm kiếm tự do trong mục đích thay vì chỉ trốn chạy cam kết.'
    },
    en: {
      title: 'The Freedom Seeker & Catalyst',
      archetype: 'The Dynamic Explorer',
      str: ['Resourceful adaptability and charisma', 'Thirst for broad horizons and travel', 'Catalyst for progressive evolution'],
      cha: ['Restlessness and fear of confinement', 'Impulsive indulgence and scattered commitments'],
      adv: 'True freedom requires an inner compass; channel your dynamism into purposeful evolution.'
    }
  },
  6: {
    vi: {
      title: 'Người Nuôi Dưỡng & Trách Nhiệm',
      archetype: 'The Nurturer & Healer',
      str: ['Tình yêu thương vô điều kiện, hướng về gia đình', 'Trách nhiệm cao, gu thẩm mỹ tinh tế', 'Khả năng chữa lành và che chở'],
      cha: ['Dễ kiểm soát, can thiệp quá sâu vào người khác', 'Hay hy sinh quên mình dẫn đến oán trách ngầm'],
      adv: 'Hãy nhớ rằng chăm sóc bản thân là điều kiện tiên quyết để có thể yêu thương và chăm sóc người khác trọn vẹn.'
    },
    en: {
      title: 'The Nurturer & Healer',
      archetype: 'The Loving Protector',
      str: ['Heart-centered compassion and empathy', 'Devotion to family, community, and harmony', 'Refined aesthetic grace'],
      cha: ['Control disguised as helpfulness', 'Martyrdom and resentment from over-giving'],
      adv: 'You cannot pour from an empty cup; honor yourself with the same tender devotion you give others.'
    }
  },
  7: {
    vi: {
      title: 'Nhà Hiền Triết & Khai Phóng Tri Thức',
      archetype: 'The Seeker & Philosopher',
      str: ['Tư duy phân tích sắc bén, trực giác tâm linh', 'Khát khao tìm kiếm chân lý tối thượng', 'Độc lập, sâu sắc, tinh tế'],
      cha: ['Khép kín, hoài nghi, khó mở lòng', 'Dễ cảm thấy cô đơn hoặc xa cách với thực tại'],
      adv: 'Kết hợp tri thức trí tuệ với sự kết nối con người; đừng để sự tìm tòi chân lý biến thành ốc đảo cô độc.'
    },
    en: {
      title: 'The Seeker & Philosopher',
      archetype: 'The Mystic Mind',
      str: ['Profound analytical and spiritual acumen', 'Unyielding search for fundamental truth', 'Introspective wisdom and depth'],
      cha: ['Detachment and intellectual cynicism', 'Isolation and difficulty trusting emotional vulnerability'],
      adv: 'Bridge your solitude with compassionate human connection; wisdom blooms when shared.'
    }
  },
  8: {
    vi: {
      title: 'Nhà Kiến Tạo Thịnh Vượng & Quyền Lực',
      archetype: 'The Visionary Executive',
      str: ['Tầm nhìn chiến lược, khả năng điều hành lớn', 'Lực hút thịnh vượng và năng lượng dồi dào', 'Công bằng, kiên cường vượt nghịch cảnh'],
      cha: ['Dễ bị cuốn vào chủ nghĩa vật chất', 'Khắc nghiệt với bản thân và người dưới quyền'],
      adv: 'Sức mạnh thật sự là công cụ phụng sự; hãy biến tài chính và ảnh hưởng thành phương tiện xây dựng giá trị bền vững.'
    },
    en: {
      title: 'The Visionary Executive',
      archetype: 'The Material Master',
      str: ['Exceptional executive leadership', 'Magnetic command over material abundance', 'Unyielding resilience under pressure'],
      cha: ['Fixation on prestige and control', 'Emotional bluntness or harsh evaluation of others'],
      adv: 'Align worldly achievement with spiritual purpose; let power serve human flourishing.'
    }
  },
  9: {
    vi: {
      title: 'Nhà Nhân Đạo Bác Ái & Trí Huệ Toàn Cầu',
      archetype: 'The Humanitarian & Visionary',
      str: ['Tấm lòng vị tha, bao dung toàn nhân loại', 'Tầm nhìn rộng mở, trực giác tâm linh trưởng thành', 'Khả năng buông bỏ và thấu hiểu'],
      cha: ['Dễ thất vọng trước thực tế trần tục', 'Khó buông bỏ quá khứ hoặc những mất mát'],
      adv: 'Cống hiến với tâm thế bình an; chấp nhận sự không hoàn hảo của thế giới như một phần của hành trình tiến hóa.'
    },
    en: {
      title: 'The Humanitarian & Visionary',
      archetype: 'The Compassionate Sage',
      str: ['Boundless universal compassion', 'Global vision and artistic soul', 'Grace in completion and letting go'],
      cha: ['Disillusionment with mortal shortcomings', 'Martyr syndrome and attachment to past grief'],
      adv: 'Serve with equanimity; allow endings to clear holy ground for new beginnings.'
    }
  },
  11: {
    vi: {
      title: 'Bậc Thầy Trực Giác & Soi Sáng (Master 11)',
      archetype: 'The Intuitive Luminary (Master 11)',
      str: ['Trực giác thần bí phi thường, tần số tâm linh cao', 'Khả năng truyền cảm hứng thức tỉnh người khác', 'Tầm nhìn đi trước thời đại'],
      cha: ['Năng lượng quá tải gây căng thẳng thần kinh', 'Dao động giữa nghi ngờ bản thân và sứ mệnh lớn'],
      adv: 'Học cách giữ thăng bằng thân-tâm-trí; bạn là chiếc cầu nối giữa ánh sáng vũ trụ và thế giới thực tại.'
    },
    en: {
      title: 'The Intuitive Luminary (Master 11)',
      archetype: 'The Spiritual Messenger',
      str: ['Transcendent intuitive sensitivity', 'Ability to illuminate and inspire collective consciousness', 'Visionary insight beyond conventional boundaries'],
      cha: ['Nervous system overstimulation', 'Oscillating between self-doubt and cosmic responsibility'],
      adv: 'Ground your celestial antenna through simple physical routines; trust your inner light.'
    }
  },
  22: {
    vi: {
      title: 'Bậc Thầy Kiến Thiết Thế Giới (Master 22)',
      archetype: 'The Master Architect (Master 22)',
      str: ['Biến lý tưởng vĩ đại thành hiện thực cụ thể', 'Tầm nhìn không giới hạn kết hợp kỷ luật phi thường', 'Năng lực lãnh đạo các dự án mang tính di sản'],
      cha: ['Áp lực cực lớn từ kỳ vọng bản thân', 'Sợ thất bại khi gánh vác trách nhiệm khổng lồ'],
      adv: 'Xây dựng từng viên gạch với sự nhẫn nại; di sản vĩ đại nhất được tạo nên từ sự kiên định mỗi ngày.'
    },
    en: {
      title: 'The Master Architect (Master 22)',
      archetype: 'The Practical Visionary',
      str: ['Translates grand ideals into tangible physical reality', 'Limitless systemic imagination paired with iron discipline', 'Architect of enduring societal foundations'],
      cha: ['Crushing weight of monumental expectations', 'Fear of underdelivering on cosmic potential'],
      adv: 'Build brick by methodical brick; even the grandest cathedral honors the foundation stone.'
    }
  },
  33: {
    vi: {
      title: 'Bậc Thầy Nâng Đỡ & Tình Yêu Phổ Quát (Master 33)',
      archetype: 'The Master Teacher & Healer (Master 33)',
      str: ['Tình yêu thương vô điều kiện ở tầng thứ cao nhất', 'Khả năng chữa lành và nâng đỡ tâm hồn nhân loại', 'Hiện thân của sự tận tụy và từ bi'],
      cha: ['Gánh nặng cảm xúc của tha nhân', 'Dễ kiệt quệ nếu không biết tự bảo vệ năng lượng'],
      adv: 'Hãy soi sáng bằng chính sự an lạc nội tại của bạn; đừng gánh thay số phận của người khác.'
    },
    en: {
      title: 'The Master Teacher & Healer (Master 33)',
      archetype: 'The Universal Avatar of Compassion',
      str: ['Highest vibrational love and selfless devotion', 'Profound spiritual healing and soul mentorship', 'Pure embodiment of compassionate service'],
      cha: ['Absorbing collective suffering into the subtle body', 'Burnout from attempting to save all beings simultaneously'],
      adv: 'Be an anchor of steady peace rather than an absorbent sponge for world sorrow.'
    }
  }
};

function generateMeanings(): Record<number, NumberMeaning> {
  const result: Record<number, NumberMeaning> = {};
  for (const [key, data] of Object.entries(CORE_ARCHETYPES)) {
    const num = parseInt(key, 10);
    result[num] = {
      titleVi: data.vi.title,
      titleEn: data.en.title,
      archetypeVi: data.vi.archetype,
      archetypeEn: data.en.archetype,
      strengthsVi: data.vi.str,
      strengthsEn: data.en.str,
      challengesVi: data.vi.cha,
      challengesEn: data.en.cha,
      adviceVi: data.vi.adv,
      adviceEn: data.en.adv
    };
  }
  return result;
}

const COMMON_MEANINGS = generateMeanings();

export const CALCULATOR_PAGES: Record<CalculatorType, CalculatorPageData> = {
  // 1. LIFE PATH
  'life-path-number-calculator': {
    slug: 'life-path-number-calculator',
    nameVi: 'Số Đường Đời (Life Path Number)',
    nameEn: 'Life Path Number',
    h1Vi: 'Công cụ tính Số Đường Đời miễn phí chuẩn Pythagoras',
    h1En: 'Free Life Path Number Calculator',
    kickerVi: '✦ CHỈ SỐ CỐT LÕI QUAN TRỌNG NHẤT ✦',
    kickerEn: '✦ YOUR PRIMARY COSMIC BLUEPRINT ✦',
    introVi: 'Số Đường Đời (Life Path Number) là chỉ số quan trọng nhất trong Thần số học Pythagoras. Được tính từ ngày, tháng, năm sinh đầy đủ, con số này tiết lộ bản thiết kế linh hồn, bài học số mệnh, tài năng bẩm sinh và con đường đưa bạn đến sự viên mãn đích thực.',
    introEn: 'Your Life Path Number is the central pillar of Pythagorean numerology. Derived from your complete date of birth, it unveils your soul blueprint, core lessons, innate talents, and the authentic highway toward personal fulfillment.',
    inputType: 'date',
    manualFormulaVi: 'Rút gọn Ngày, Tháng, Năm sinh thành 3 số đơn (hoặc Master Number), sau đó cộng lại và rút gọn tiếp.',
    manualFormulaEn: 'Reduce Day, Month, and Year to three single digits (or Master Numbers), then sum them together and reduce.',
    manualStepsVi: [
      'Bước 1: Rút gọn tháng sinh về một chữ số (VD: Tháng 12 → 1 + 2 = 3).',
      'Bước 2: Rút gọn ngày sinh về một chữ số (VD: Ngày 25 → 2 + 5 = 7).',
      'Bước 3: Rút gọn năm sinh về một chữ số (VD: Năm 1990 → 1 + 9 + 9 + 0 = 19 → 1 + 9 = 10 → 1).',
      'Bước 4: Cộng 3 số thành phần (3 + 7 + 1 = 11). Nếu tổng là 11, 22, hoặc 33, giữ nguyên đó là Master Number. Nếu không, tiếp tục cộng các chữ số cho đến khi còn từ 1 đến 9.'
    ],
    manualStepsEn: [
      'Step 1: Reduce your birth month to a single digit (e.g., Dec 12 → 1 + 2 = 3).',
      'Step 2: Reduce your birth day to a single digit (e.g., 25 → 2 + 5 = 7).',
      'Step 3: Reduce your birth year to a single digit (e.g., 1990 → 1 + 9 + 9 + 0 = 19 → 1 + 9 = 10 → 1).',
      'Step 4: Add the three reduced numbers (3 + 7 + 1 = 11). If the sum is 11, 22, or 33, preserve it as a Master Number. Otherwise, reduce to 1–9.'
    ],
    meanings: COMMON_MEANINGS,
    faqs: [
      {
        qVi: 'Số Đường Đời (Life Path) cho tôi biết điều gì?',
        qEn: 'What does my Life Path Number reveal?',
        aVi: 'Số Đường Đời phản ánh con đường bạn đi qua trong cuộc đời, các cơ hội tự nhiên, thử thách cốt lõi và bài học lớn nhất mà linh hồn bạn đến trần thế để học hỏi và hoàn thiện.',
        aEn: 'Your Life Path Number outlines your main life trajectory, natural strengths, recurring lessons, and the environment where your greatest growth occurs.'
      },
      {
        qVi: 'Số 10 có phải là số chủ đạo riêng biệt không?',
        qEn: 'Is number 10 a distinct Life Path number?',
        aVi: 'Trong hệ thống Thần số học Pythagoras chuẩn quốc tế, số 10 luôn được rút gọn thành 1 (1 + 0 = 1). Số 1 mang năng lượng khởi nguyên, độc lập và lãnh đạo.',
        aEn: 'In classical Pythagorean numerology, 10 is reduced to 1 (1 + 0 = 1). It embodies independent leadership and pioneering energy.'
      },
      {
        qVi: 'Số Bậc Thầy (Master Numbers 11, 22, 33) có ý nghĩa gì?',
        qEn: 'What do Master Numbers (11, 22, 33) signify?',
        aVi: 'Master Numbers mang điện thế tâm linh và trách nhiệm phục vụ cộng đồng cao hơn bình thường. Chúng đòi hỏi nhiều nỗ lực tôi luyện nhưng mở ra tiềm năng cống hiến vượt bậc.',
        aEn: 'Master Numbers carry higher vibrational frequencies and profound societal purpose. They demand self-mastery but offer extraordinary potential for global service.'
      },
      {
        qVi: 'Công cụ tính này có gửi thông tin ngày sinh của tôi lên server không?',
        qEn: 'Does this calculator store or transmit my birth date?',
        aVi: 'Hoàn toàn không. Công cụ chạy 100% bằng JavaScript trong trình duyệt của bạn. Không có bất kỳ dữ liệu cá nhân nào được lưu trữ hay gửi qua mạng.',
        aEn: 'Never. The calculation runs 100% client-side in your web browser. Zero personal data is recorded or transmitted across the internet.'
      }
    ],
    relatedSlugs: [
      { slug: 'expression-number-calculator', nameVi: 'Số Sứ Mệnh', nameEn: 'Expression Number', descVi: 'Khám phá mục tiêu và cách bạn hành động trong đời.', descEn: 'Discover your life purpose and expression.' },
      { slug: 'soul-urge-number-calculator', nameVi: 'Số Linh Hồn', nameEn: 'Soul Urge Number', descVi: 'Khám phá mong muốn thầm kín nhất trong trái tim.', descEn: 'Understand your hidden heart’s desires.' },
      { slug: 'personal-year-number-calculator', nameVi: 'Năm Cá Nhân', nameEn: 'Personal Year', descVi: 'Xem nhịp thời gian và vận hạn của năm nay.', descEn: 'Align with your personal year vibrations.' }
    ]
  },

  // 2. EXPRESSION
  'expression-number-calculator': {
    slug: 'expression-number-calculator',
    nameVi: 'Số Sứ Mệnh (Expression / Destiny Number)',
    nameEn: 'Expression Number',
    h1Vi: 'Công cụ tính Số Sứ Mệnh miễn phí chuẩn Pythagoras',
    h1En: 'Free Expression Number Calculator',
    kickerVi: '✦ TÀI NĂNG BẨM SINH & MỤC TIÊU CUỘC ĐỜI ✦',
    kickerEn: '✦ INNATE GIFTS & DESTINED CALLING ✦',
    introVi: 'Số Sứ Mệnh (còn gọi là Số Vận Mệnh - Expression / Destiny Number) được tính từ toàn bộ các chữ cái trong họ tên khai sinh của bạn. Con số này đại diện cho chiếc ba lô công cụ bạn mang theo: tài năng bẩm sinh, cách bạn tương tác với thế giới và những thành tựu bạn hướng tới.',
    introEn: 'Your Expression Number (also known as the Destiny Number) is calculated from the full birth name. It describes the natural tools, talents, and vocational abilities you were gifted to achieve your life’s mission.',
    inputType: 'name',
    manualFormulaVi: 'Chuyển toàn bộ chữ cái trong họ tên thành số theo bảng Pythagoras (A=1, B=2...), sau đó cộng tổng và rút gọn về 1–9 hoặc Master 11/22/33.',
    manualFormulaEn: 'Convert every letter in your birth name to numbers via the Pythagorean table (A=1, B=2...), sum them all, and reduce to 1–9 or 11/22/33.',
    manualStepsVi: [
      'Bước 1: Viết họ tên khai sinh đầy đủ, loại bỏ dấu tiếng Việt (VD: "NGUYEN AN").',
      'Bước 2: Quy đổi từng chữ cái ra số theo bảng Pythagoras (N=5, G=7, U=3, Y=7, E=5, N=5, A=1, N=5).',
      'Bước 3: Cộng tổng tất cả các chữ số (5+7+3+7+5+5 + 1+5 = 38).',
      'Bước 4: Rút gọn tổng: 3 + 8 = 11 (Số bậc thầy Master Number 11 được giữ nguyên).'
    ],
    manualStepsEn: [
      'Step 1: Write your full birth certificate name, removing accents.',
      'Step 2: Assign numbers to each letter using the Pythagorean table (A=1, B=2...).',
      'Step 3: Sum the numeric values of every single letter.',
      'Step 4: Reduce the sum repeatedly until you reach a single digit 1–9, or Master Number 11, 22, 33.'
    ],
    meanings: COMMON_MEANINGS,
    faqs: [
      {
        qVi: 'Nên dùng tên khai sinh hay tên thường gọi/biệt danh?',
        qEn: 'Should I use my birth certificate name or my nickname?',
        aVi: 'Theo chuẩn Thần số học Pythagoras, Số Sứ Mệnh luôn được tính dựa trên HỌ VÀ TÊN KHAI SINH ĐẦY ĐỦ trên giấy khai sinh, vì đây là rung động gốc gắn liền với vận mệnh của bạn.',
        aEn: 'Pythagorean numerology mandates using your FULL BIRTH CERTIFICATE NAME, as it represents the original vibrational contract of your soul.'
      },
      {
        qVi: 'Đổi tên sau khi kết hôn có làm đổi Số Sứ Mệnh không?',
        qEn: 'Does changing my name after marriage change my Expression Number?',
        aVi: 'Tên khai sinh vẫn là nền tảng cốt lõi không đổi. Tên mới sau kết hôn sẽ tạo thêm một tần số năng lượng bổ sung (ảnh hưởng đến cách người khác nhìn nhận bạn).',
        aEn: 'Your birth name remains your permanent core foundation. An adoptive or married name adds an auxiliary vibrational layer without erasing the core.'
      }
    ],
    relatedSlugs: [
      { slug: 'soul-urge-number-calculator', nameVi: 'Số Linh Hồn', nameEn: 'Soul Urge', descVi: 'Xem động lực nội tâm bên dưới số sứ mệnh.', descEn: 'Your inner emotional motor.' },
      { slug: 'personality-number-calculator', nameVi: 'Số Nhân Cách', nameEn: 'Personality', descVi: 'Mặt nạ xã hội và cách người khác nhìn bạn.', descEn: 'How the outer world sees you.' },
      { slug: 'maturity-number-calculator', nameVi: 'Số Trưởng Thành', nameEn: 'Maturity Number', descVi: 'Sự kết hợp giữa Đường Đời và Sứ Mệnh sau tuổi 35.', descEn: 'The synthesis of Life Path and Expression.' }
    ]
  },

  // 3. SOUL URGE
  'soul-urge-number-calculator': {
    slug: 'soul-urge-number-calculator',
    nameVi: 'Số Linh Hồn (Soul Urge / Heart\'s Desire)',
    nameEn: 'Soul Urge Number',
    h1Vi: 'Công cụ tính Số Linh Hồn miễn phí (Khát khao nội tâm)',
    h1En: 'Free Soul Urge Number Calculator',
    kickerVi: '✦ TIẾNG NÓI THẦM KÍN CỦA TRÁI TIM ✦',
    kickerEn: '✦ THE SECRET CRAVING OF YOUR HEART ✦',
    introVi: 'Số Linh Hồn (Soul Urge hay Heart\'s Desire Number) được tính từ các NGUYÊN ÂM trong họ tên của bạn. Con số này tiết lộ khao khát sâu thẳm nhất, động lực thúc đẩy bạn từ bên trong và những gì thực sự khiến tâm hồn bạn cảm thấy được thỏa nguyện và an yên.',
    introEn: 'Your Soul Urge Number (Heart’s Desire) is extracted from the VOWELS of your full birth name. It uncovers your hidden motivations, emotional longings, and what your soul truly craves behind outer ambitions.',
    inputType: 'name',
    manualFormulaVi: 'Lọc tất cả các nguyên âm trong họ tên (A, E, I, O, U và Y theo ngữ cảnh), cộng giá trị theo bảng Pythagoras và rút gọn về 1–9 hoặc 11/22/33.',
    manualFormulaEn: 'Extract all vowels from your birth name (A, E, I, O, U, plus contextual Y), sum their values, and reduce to 1–9 or 11/22/33.',
    manualStepsVi: [
      'Bước 1: Viết họ tên khai sinh và gạch chân các nguyên âm (A, E, I, O, U).',
      'Bước 2: Áp dụng quy tắc chữ Y: Y là nguyên âm nếu từ đó không có nguyên âm nào khác (VD: "MY", "LY" → Y là nguyên âm; "NGUYEN" → Y là phụ âm).',
      'Bước 3: Tra giá trị các nguyên âm theo bảng Pythagoras và cộng lại.',
      'Bước 4: Rút gọn tổng về 1–9 (hoặc giữ lại Master Number 11, 22, 33).'
    ],
    manualStepsEn: [
      'Step 1: Write down your full birth name and isolate the vowels (A, E, I, O, U).',
      'Step 2: Apply the Y rule: Y counts as a vowel only if the syllable contains no other vowels (e.g., "LYNN" → Y is a vowel; "MARY" → Y is a consonant).',
      'Step 3: Sum the numerical values of these vowels.',
      'Step 4: Reduce to 1–9, preserving Master Numbers 11, 22, 33.'
    ],
    meanings: COMMON_MEANINGS,
    faqs: [
      {
        qVi: 'Chữ Y được tính là nguyên âm hay phụ âm?',
        qEn: 'Is the letter Y a vowel or consonant?',
        aVi: 'Trong Thần số học Pythagoras chuẩn: Chữ Y được tính là NGUYÊN ÂM khi trong từ đó không có bất kỳ nguyên âm nào khác (như Ly, My, Thy). Nếu trong từ đã có A, E, I, O, hoặc U (như Nguyen, Yen, Bryan), Y sẽ tính là PHỤ ÂM.',
        aEn: 'Under strict Pythagorean rules: Y is a VOWEL when the word has no other vowels (e.g., Lynn, My). If the word already contains A, E, I, O, or U (e.g., Wayne, Nguyen), Y functions as a CONSONANT.'
      },
      {
        qVi: 'Số Linh Hồn khác gì với Số Đường Đời?',
        qEn: 'How does Soul Urge differ from Life Path?',
        aVi: 'Số Đường Đời là con đường bạn đi (hành động, thử thách, bài học bên ngoài). Số Linh Hồn là động cơ bên trong (cảm xúc, ước muốn thầm kín mà đôi khi bạn không bộc lộ ra ngoài).',
        aEn: 'Life Path dictates your outward journey and experiential lessons; Soul Urge illuminates your private emotional engine and unspoken yearnings.'
      }
    ],
    relatedSlugs: [
      { slug: 'personality-number-calculator', nameVi: 'Số Nhân Cách', nameEn: 'Personality Number', descVi: 'Đối trọng bên ngoài của số linh hồn (phụ âm).', descEn: 'The outer consonant counterpart.' },
      { slug: 'expression-number-calculator', nameVi: 'Số Sứ Mệnh', nameEn: 'Expression Number', descVi: 'Tổng hòa giữa linh hồn và nhân cách.', descEn: 'The synthesis of vowels and consonants.' },
      { slug: 'life-path-number-calculator', nameVi: 'Số Đường Đời', nameEn: 'Life Path Number', descVi: 'Khung đường định mệnh của bạn.', descEn: 'Your master life blueprint.' }
    ]
  },

  // 4. PERSONAL YEAR
  'personal-year-number-calculator': {
    slug: 'personal-year-number-calculator',
    nameVi: 'Số Năm Cá Nhân (Personal Year Number)',
    nameEn: 'Personal Year Number',
    h1Vi: 'Công cụ tính Năm Cá Nhân Thần số học miễn phí (Chu kỳ 9 năm)',
    h1En: 'Free Personal Year Number Calculator',
    kickerVi: '✦ DỰ BÁO VẬN HẠN & NHỊP ĐIỆU NĂNG LƯỢNG ✦',
    kickerEn: '✦ YOUR 9-YEAR CYCLICAL ENERGY FORECAST ✦',
    introVi: 'Năm Cá Nhân (Personal Year Number) chỉ ra giai đoạn bạn đang đứng trong chu kỳ tiến hóa 9 năm của cuộc đời. Biết được rung động của năm giúp bạn chọn đúng thời điểm để gieo hạt, bứt phá, tái cấu trúc hay tích lũy nội lực.',
    introEn: 'Your Personal Year Number reveals exactly where you stand within the 9-year universal life cycle. Understanding this rhythm helps you recognize when to initiate bold endeavors, nurture partnerships, pivot, or harvest.',
    inputType: 'date-year',
    manualFormulaVi: 'Ngày sinh rút gọn + Tháng sinh rút gọn + Năm cần xem rút gọn. Rút gọn kết quả về chu kỳ 1–9.',
    manualFormulaEn: 'Reduced Birth Day + Reduced Birth Month + Reduced Target Calendar Year. Always reduced to single digit 1–9.',
    manualStepsVi: [
      'Bước 1: Rút gọn ngày sinh về 1 chữ số (VD: 19 → 1 + 9 = 10 → 1).',
      'Bước 2: Rút gọn tháng sinh về 1 chữ số (VD: Tháng 11 → 1 + 1 = 2).',
      'Bước 3: Rút gọn năm cần xem (VD: Năm 2026 → 2 + 0 + 2 + 6 = 10 → 1).',
      'Bước 4: Cộng 3 thành phần: 1 + 2 + 1 = 4. Năm cá nhân luôn là một con số từ 1 đến 9.'
    ],
    manualStepsEn: [
      'Step 1: Reduce your birth day to a single digit (e.g., 19 → 1 + 9 = 10 → 1).',
      'Step 2: Reduce your birth month to a single digit (e.g., Nov 11 → 1 + 1 = 2).',
      'Step 3: Reduce the target calendar year (e.g., 2026 → 2 + 0 + 2 + 6 = 10 → 1).',
      'Step 4: Add them: 1 + 2 + 1 = 4. Personal Year is always reduced strictly to a 1–9 single digit.'
    ],
    meanings: {
      1: {
        titleVi: 'Năm 1: Khởi Đầu Mới & Gieo Hạt',
        titleEn: 'Year 1: New Beginnings & Seeding',
        archetypeVi: 'Gieo hạt mầm 9 năm mới',
        archetypeEn: 'Planting the 9-year cycle seeds',
        strengthsVi: ['Năng lượng tràn đầy, sự chủ động cao', 'Cơ hội bắt đầu công việc, dự án mới', 'Sự tự tin và độc lập'],
        strengthsEn: ['Abundant drive and initiative', 'Fresh career and project beginnings', 'Self-reliance and pioneering vision'],
        challengesVi: ['Áp lực bước ra khỏi vùng an toàn', 'Dễ nôn nóng muốn thấy kết quả ngay'],
        challengesEn: ['Fear of leaving familiar comfort zones', 'Impatience for immediate fruit'],
        adviceVi: 'Hãy dũng cảm hành động độc lập, gieo những hạt mầm táo bạo nhất cho chu kỳ 9 năm tới.',
        adviceEn: 'Plant bold seeds with unswerving confidence; this year sets the trajectory for your next nine years.'
      },
      2: {
        titleVi: 'Năm 2: Kết Nối, Kiên Nhẫn & Lắng Nghe',
        titleEn: 'Year 2: Patience, Cooperation & Receptivity',
        archetypeVi: 'Nuôi dưỡng hạt mầm trong hòa hợp',
        archetypeEn: 'Tending the shoots with cooperative grace',
        strengthsVi: ['Khả năng ngoại giao và hợp tác', 'Trực giác phát triển mạnh mẽ', 'Mối quan hệ được củng cố'],
        strengthsEn: ['Diplomatic finesse and partnership alignment', 'Heightened intuitive sensitivity', 'Solidification of emotional bonds'],
        challengesVi: ['Tiến độ có vẻ chậm chạp', 'Dễ nhạy cảm hoặc bất an cảm xúc'],
        challengesEn: ['Feeling that progress is sluggish', 'Over-sensitivity and self-doubt'],
        adviceVi: 'Đừng đốt cháy giai đoạn. Hãy học cách chờ đợi trong kiên nhẫn và nuôi dưỡng những mối liên kết chất lượng.',
        adviceEn: 'Cultivate patience and let partnerships mature organically; gentle diplomacy succeeds where force fails.'
      },
      3: {
        titleVi: 'Năm 3: Mở Rộng, Sáng Tạo & Tự Thể Hiện',
        titleEn: 'Year 3: Creative Expansion & Self-Expression',
        archetypeVi: 'Cây nảy mầm và trổ hoa rực rỡ',
        archetypeEn: 'Vibrant blossoming of ideas and social ties',
        strengthsVi: ['Ý tưởng sáng tạo bùng nổ', 'Mở rộng giao lưu xã hội, truyền cảm hứng', 'Tâm trạng tươi vui, lạc quan'],
        strengthsEn: ['Burst of innovative creative ideas', 'Social magnetism and inspirational communication', 'Uplifting optimism'],
        challengesVi: ['Dễ phân tán nguồn lực, thiếu tập trung', 'Bội chi tài chính'],
        challengesEn: ['Scattered resources and procrastination', 'Impulsive spending and superficial distractions'],
        adviceVi: 'Chia sẻ thông điệp của bạn với thế giới nhưng hãy giữ kỷ luật để biến ý tưởng thành sản phẩm thực tế.',
        adviceEn: 'Express your joyful truth freely, but anchor creative inspiration in daily discipline.'
      },
      4: {
        titleVi: 'Năm 4: Kỷ Luật, Nền Tảng & Lao Động Chăm Chỉ',
        titleEn: 'Year 4: Foundation, Structure & Hard Work',
        archetypeVi: 'Xây móng nhà vững chãi trước bão táp',
        archetypeEn: 'Laying deep foundations and operational rigor',
        strengthsVi: ['Khả năng tổ chức, quản trị xuất sắc', 'Sự kiên định, thực tế và bền bỉ', 'Thiết lập trật tự cuộc sống'],
        strengthsEn: ['Methodical organization and management', 'Steadfast persistence and pragmatism', 'Establishing enduring lifestyle order'],
        challengesVi: ['Cảm giác nặng nề, khối lượng công việc lớn', 'Ít cơ hội vui chơi giải trí'],
        challengesEn: ['Weight of relentless routine', 'Restricted leisure and risk of exhaustion'],
        adviceVi: 'Tập trung củng cố sức khỏe, tài chính và quy trình. Đây là năm củng cố gốc rễ bền vững.',
        adviceEn: 'Reinforce your financial, physical, and operational foundations with meticulous care.'
      },
      5: {
        titleVi: 'Năm 5: Chuyển Dịch, Tự Do & Đột Phá',
        titleEn: 'Year 5: Freedom, Transition & Dynamic Change',
        archetypeVi: 'Gió đổi chiều tại điểm giữa chu kỳ',
        archetypeEn: 'Mid-cycle pivot and winds of liberation',
        strengthsVi: ['Sự giải phóng khỏi khuôn mẫu cũ', 'Cơ hội du lịch, đổi hướng, khám phá mới', 'Linh hoạt thích ứng cao'],
        strengthsEn: ['Breaking free from outworn patterns', 'Thrilling travel, career pivots, and adventure', 'Agile adaptability under change'],
        challengesVi: ['Bất ổn, khó dự đoán tương lai', 'Dễ bốc đồng đưa ra quyết định vội vàng'],
        challengesEn: ['Unsettling unpredictability', 'Impulsive recklessness or burnout from over-stimulation'],
        adviceVi: 'Sẵn sàng đón nhận thay đổi; hãy linh hoạt buông bỏ những gì đã cũ kỹ để đón luồng gió mới.',
        adviceEn: 'Ride the winds of change gracefully; discard what stifles you and explore uncharted horizons.'
      },
      6: {
        titleVi: 'Năm 6: Gia Đình, Trách Nhiệm & Chữa Lành',
        titleEn: 'Year 6: Domestic Harmony, Healing & Duty',
        archetypeVi: 'Mái ấm gia đình và bổn phận yêu thương',
        archetypeEn: 'Sanctuary of home, caregiving, and community',
        strengthsVi: ['Hòa thuận gia đình, hàn gắn tình cảm', 'Không gian sống được làm đẹp', 'Trách nhiệm phụng sự được ghi nhận'],
        strengthsEn: ['Reconciliation and deepened family harmony', 'Beautification of living space', 'Honored service and caregiving leadership'],
        challengesVi: ['Gánh nặng lo toan cho người thân', 'Dễ rơi vào tranh cãi gia đình nếu quá áp đặt'],
        challengesEn: ['Domestic emotional friction', 'Martyrdom and taking on others’ burdens'],
        adviceVi: 'Đặt trọng tâm vào mái ấm và những người thân yêu, đồng thời học cách tha thứ và chữa lành vết thương cũ.',
        adviceEn: 'Nurture your loved ones and home sanctuary, while keeping personal emotional boundaries whole.'
      },
      7: {
        titleVi: 'Năm 7: Chiêm Nghiệm, Học Hỏi & Phát Triển Tâm Thức',
        titleEn: 'Year 7: Introspection, Study & Spiritual Awakening',
        archetypeVi: 'Khoảng lặng thiền định của tâm hồn',
        archetypeEn: 'Sabbatical of the soul and intellectual mastery',
        strengthsVi: ['Sự thấu thị sâu sắc, trí tuệ phát triển', 'Nghiên cứu, học tập chuyên môn tiến bộ vượt bậc', 'Bình an nội tại'],
        strengthsEn: ['Profound clarity and analytical brilliance', 'Accelerated mastery in studies or research', 'Soulful inner serenity'],
        challengesVi: ['Cảm giác cô đơn, tách biệt xã hội', 'Không thuận lợi cho việc đầu tư kinh doanh mạo hiểm'],
        challengesEn: ['Feelings of aloofness or isolation', 'Unfavorable timing for aggressive speculative ventures'],
        adviceVi: 'Dành thời gian cho bản thân, học thêm kiến thức mới và lắng nghe tiếng nói tâm linh bên trong.',
        adviceEn: 'Take reflective solitude, immerse yourself in deeper wisdom, and honor your inner sacred voice.'
      },
      8: {
        titleVi: 'Năm 8: Quyền Lực, Thu Hoạch Tài Chính & Thành Tựu',
        titleEn: 'Year 8: Harvest, Material Mastery & Executive Power',
        archetypeVi: 'Mùa gặt hái quả ngọt và khẳng định vị thế',
        archetypeEn: 'Bountiful harvest and authoritative leadership',
        strengthsVi: ['Thu hút tiền tài, địa vị và thăng tiến', 'Tầm nhìn kinh doanh sắc bén', 'Khẳng định uy tín cá nhân'],
        strengthsEn: ['Financial empowerment and career elevation', 'Strategic commercial discernment', 'Recognized leadership and authority'],
        challengesVi: ['Áp lực tiền bạc, kiện tụng hoặc tranh chấp', 'Quy luật nhân quả vận hành cực kỳ nhanh'],
        challengesEn: ['Fiscal stress or contractual tensions', 'Immediate karmic accountability for actions'],
        adviceVi: 'Hành động chính trực, quản trị dòng tiền thông minh và chia sẻ sự thịnh vượng với cộng đồng.',
        adviceEn: 'Act with sterling integrity, deploy executive leverage wisely, and reinvest in collective good.'
      },
      9: {
        titleVi: 'Năm 9: Hoàn Tất, Buông Bỏ & Dọn Đường Tương Lai',
        titleEn: 'Year 9: Completion, Release & Universal Compassion',
        archetypeVi: 'Dọn dẹp mảnh vườn đón chu kỳ mới',
        archetypeEn: 'Closing the cosmic chapter with graceful forgiveness',
        strengthsVi: ['Khả năng tha thứ, buông bỏ quá khứ', 'Lòng trắc ẩn và tầm nhìn rộng mở', 'Hoàn thành các dự án dài hạn'],
        strengthsEn: ['Liberation through forgiveness and closure', 'Universal humanitarian empathy', 'Culmination of multi-year endeavors'],
        challengesVi: ['Cảm giác mất mát khi phải chia tay những điều cũ', 'Xáo trộn cảm xúc trước ngưỡng cửa mới'],
        challengesEn: ['Melancholy over necessary farewells', 'Resistance to inevitable endings'],
        adviceVi: 'Thanh lọc những thói quen, mối quan hệ độc hại; dọn dẹp sạch sẽ để sẵn sàng cho Năm 1 sắp tới.',
        adviceEn: 'Let go of what has served its time; clear sacred ground so new abundance may enter next year.'
      }
    },
    faqs: [
      {
        qVi: 'Năm Cá Nhân tính theo năm dương lịch hay sinh nhật?',
        qEn: 'Does Personal Year start on January 1st or my birthday?',
        aVi: 'Trong Thần số học Pythagoras chuẩn, Năm Cá Nhân bắt đầu từ ngày 1 tháng 1 của năm dương lịch đó và đạt đỉnh năng lượng rõ nét nhất quanh thời điểm sinh nhật của bạn.',
        aEn: 'In mainstream Pythagorean practice, the Personal Year begins on January 1st of the calendar year, reaching its peak resonance around your actual birth date.'
      },
      {
        qVi: 'Năm Cá Nhân có số Master 11, 22 không?',
        qEn: 'Can a Personal Year be a Master Number (11, 22)?',
        aVi: 'Không. Năm Cá Nhân luôn được rút gọn thành một số đơn từ 1 đến 9 đại diện cho chu kỳ sinh học 9 năm hoàn chỉnh của con người.',
        aEn: 'No. Personal Years are strictly governed by the single-digit 1–9 cycle representing the universal nine-phase rhythm of growth.'
      }
    ],
    relatedSlugs: [
      { slug: 'life-path-number-calculator', nameVi: 'Số Đường Đời', nameEn: 'Life Path Number', descVi: 'Nền tảng định mệnh cả đời của bạn.', descEn: 'Your master life blueprint.' },
      { slug: 'birthday-number-calculator', nameVi: 'Số Ngày Sinh', nameEn: 'Birthday Number', descVi: 'Món quà tài năng bẩm sinh hỗ trợ bạn.', descEn: 'Your innate special gift.' },
      { slug: 'maturity-number-calculator', nameVi: 'Số Trưởng Thành', nameEn: 'Maturity Number', descVi: 'Đích đến sau những chu kỳ 9 năm.', descEn: 'Your ultimate evolutionary peak.' }
    ]
  },

  // 5. PERSONALITY
  'personality-number-calculator': {
    slug: 'personality-number-calculator',
    nameVi: 'Số Nhân Cách (Personality Number)',
    nameEn: 'Personality Number',
    h1Vi: 'Công cụ tính Số Nhân Cách Thần số học miễn phí',
    h1En: 'Free Personality Number Calculator',
    kickerVi: '✦ ẤN TƯỢNG BAN ĐẦU & PHONG THÁI XÃ HỘI ✦',
    kickerEn: '✦ FIRST IMPRESSIONS & SOCIAL AURA ✦',
    introVi: 'Số Nhân Cách (Personality Number) được tính từ các PHỤ ÂM trong tên khai sinh của bạn. Đây là "mặt nạ xã hội", là ấn tượng đầu tiên bạn tạo ra cho người xung quanh, phong cách ứng xử và chiếc áo giáp bảo vệ thế giới nội tâm của bạn.',
    introEn: 'Your Personality Number is derived from the CONSONANTS in your full name. It reflects your outward persona, first impressions, social styling, and the psychological armor you present to the outer world.',
    inputType: 'name',
    manualFormulaVi: 'Tách toàn bộ các phụ âm trong họ tên (Y là phụ âm khi từ đã có nguyên âm khác), cộng giá trị theo bảng Pythagoras và rút gọn về 1–9 hoặc 11/22/33.',
    manualFormulaEn: 'Extract all consonants from your birth name (applying Y rule), sum their values via Pythagoras table, and reduce to 1–9 or 11/22/33.',
    manualStepsVi: [
      'Bước 1: Viết họ tên khai sinh và loại bỏ các nguyên âm (A, E, I, O, U).',
      'Bước 2: Xác định chữ Y: nếu từ đã có nguyên âm khác, Y là phụ âm (VD: "YEN" → Y là phụ âm; "LY" → Y là nguyên âm nên bỏ qua).',
      'Bước 3: Tra điểm các phụ âm theo bảng Pythagoras và cộng lại.',
      'Bước 4: Rút gọn tổng về 1–9 hoặc giữ lại Master Number 11, 22, 33.'
    ],
    manualStepsEn: [
      'Step 1: Write down your name and remove vowels.',
      'Step 2: Check Y: Y acts as consonant if other vowels exist in that syllable.',
      'Step 3: Sum consonant values using Pythagorean table.',
      'Step 4: Reduce to 1–9, preserving 11, 22, 33.'
    ],
    meanings: COMMON_MEANINGS,
    faqs: [
      {
        qVi: 'Số Nhân Cách có phải là con người thật của tôi không?',
        qEn: 'Is my Personality Number who I really am?',
        aVi: 'Số Nhân Cách giống như cánh cổng ngoài của ngôi nhà. Nó là cách người khác cảm nhận về bạn trong những lần gặp đầu tiên, không đại diện cho toàn bộ chiều sâu nội tâm (vốn thuộc về Số Linh Hồn).',
        aEn: 'Your Personality Number is like your front door. It shapes initial social impressions and outer presentation, whereas your Soul Urge represents your private sanctuary.'
      }
    ],
    relatedSlugs: [
      { slug: 'soul-urge-number-calculator', nameVi: 'Số Linh Hồn', nameEn: 'Soul Urge Number', descVi: 'Mảnh ghép nội tâm đối xứng với nhân cách.', descEn: 'The inner emotional counterpart.' },
      { slug: 'expression-number-calculator', nameVi: 'Số Sứ Mệnh', nameEn: 'Expression Number', descVi: 'Sự hợp nhất của Linh Hồn và Nhân Cách.', descEn: 'The synthesis of vowels & consonants.' },
      { slug: 'life-path-number-calculator', nameVi: 'Số Đường Đời', nameEn: 'Life Path Number', descVi: 'Bài học số mệnh lớn nhất của bạn.', descEn: 'Your core cosmic highway.' }
    ]
  },

  // 6. BIRTHDAY NUMBER
  'birthday-number-calculator': {
    slug: 'birthday-number-calculator',
    nameVi: 'Số Ngày Sinh (Birthday Number)',
    nameEn: 'Birthday Number',
    h1Vi: 'Công cụ tính Số Ngày Sinh Thần số học miễn phí',
    h1En: 'Free Birthday Number Calculator',
    kickerVi: '✦ TÀI NĂNG ĐẶC BIỆT & CÔNG CỤ HỖ TRỢ ✦',
    kickerEn: '✦ INNATE GIFTS & SPECIALIZED TALENTS ✦',
    introVi: 'Số Ngày Sinh (Birthday Number) được tính trực tiếp từ ngày bạn cất tiếng khóc chào đời (1 đến 31). Con số này tượng trưng cho món quà bẩm sinh đặc biệt mà vũ trụ ban tặng để hỗ trợ bạn hoàn thành Số Đường Đời dễ dàng hơn.',
    introEn: 'Your Birthday Number is derived directly from the exact day of the month you were born (1 to 31). It pinpoints a distinct talent or personal specialty bestowed upon you to assist in walking your Life Path.',
    inputType: 'date',
    manualFormulaVi: 'Lấy ngày sinh trong tháng (1–31). Nếu sinh ngày 11 hoặc 22 thì giữ nguyên. Các ngày khác rút gọn về 1–9.',
    manualFormulaEn: 'Take the day of the month (1–31). If born on the 11th or 22nd, preserve as Master Number. Otherwise reduce to 1–9.',
    manualStepsVi: [
      'Bước 1: Lấy số ngày sinh (VD: Sinh ngày 14).',
      'Bước 2: Nếu là ngày 11 hoặc 22, đây là Master Number được giữ nguyên.',
      'Bước 3: Nếu lớn hơn 9, cộng các chữ số lại (VD: 14 → 1 + 4 = 5; 29 → 2 + 9 = 11 → 2).'
    ],
    manualStepsEn: [
      'Step 1: Take your day of birth (e.g., born on the 14th).',
      'Step 2: If you were born on the 11th or 22nd, keep it as a Master Number.',
      'Step 3: Otherwise, reduce multi-digit days to 1–9 (e.g., 14 → 1 + 4 = 5).'
    ],
    meanings: COMMON_MEANINGS,
    faqs: [
      {
        qVi: 'Số Ngày Sinh có vai trò gì bên cạnh Số Đường Đời?',
        qEn: 'What role does the Birthday Number play alongside Life Path?',
        aVi: 'Nếu Số Đường Đời là bản đồ hành trình, thì Số Ngày Sinh là bộ công cụ thực tế bạn có sẵn trong tay ngay từ khi sinh ra để vượt qua các khúc quanh trên con đường đó.',
        aEn: 'While your Life Path is the grand journey, your Birthday Number is the specialized toolset placed directly in your hands on day one.'
      }
    ],
    relatedSlugs: [
      { slug: 'life-path-number-calculator', nameVi: 'Số Đường Đời', nameEn: 'Life Path Number', descVi: 'Mục tiêu chính mà tài năng ngày sinh phụng sự.', descEn: 'The primary journey your gift serves.' },
      { slug: 'personal-year-number-calculator', nameVi: 'Năm Cá Nhân', nameEn: 'Personal Year', descVi: 'Thời điểm thích hợp để phát huy tài năng.', descEn: 'Optimal timing for your gifts.' },
      { slug: 'expression-number-calculator', nameVi: 'Số Sứ Mệnh', nameEn: 'Expression Number', descVi: 'Cách bạn vận dụng tài năng vào sự nghiệp.', descEn: 'How you channel talent into vocational calling.' }
    ]
  },

  // 7. MATURITY NUMBER
  'maturity-number-calculator': {
    slug: 'maturity-number-calculator',
    nameVi: 'Số Trưởng Thành (Maturity / Realization Number)',
    nameEn: 'Maturity Number',
    h1Vi: 'Công cụ tính Số Trưởng Thành Thần số học miễn phí',
    h1En: 'Free Maturity Number Calculator',
    kickerVi: '✦ ĐỈNH CAO TIẾN HÓA SAU TUỔI 35 ✦',
    kickerEn: '✦ YOUR MID-LIFE EVOLUTIONARY PINNACLE ✦',
    introVi: 'Số Trưởng Thành (Maturity Number hay Realization Number) là sự hợp nhất giữa Số Đường Đời và Số Sứ Mệnh. Con số này bắt đầu bộc lộ sức ảnh hưởng mạnh mẽ từ tuổi 35–40 trở đi, chỉ ra phiên bản chân thật, sâu sắc và viên mãn nhất của bạn trong nửa sau cuộc đời.',
    introEn: 'Your Maturity Number (Realization Number) is the profound convergence of your Life Path and Expression numbers. Typically emerging into prominence around ages 35–40, it reveals your ultimate evolutionary self in the mature seasons of life.',
    inputType: 'name-date',
    manualFormulaVi: 'Số Đường Đời (Life Path) + Số Sứ Mệnh (Expression). Rút gọn tổng về 1–9 hoặc giữ Master 11/22/33.',
    manualFormulaEn: 'Life Path Number + Expression Number. Sum them together and reduce to 1–9, preserving Master Numbers 11, 22, 33.',
    manualStepsVi: [
      'Bước 1: Tính Số Đường Đời từ ngày tháng năm sinh (VD: 7).',
      'Bước 2: Tính Số Sứ Mệnh từ họ tên đầy đủ (VD: 5).',
      'Bước 3: Cộng 2 chỉ số lại: 7 + 5 = 12.',
      'Bước 4: Rút gọn: 1 + 2 = 3 (Số Trưởng Thành là 3; nếu tổng là 11, 22, 33 thì giữ nguyên).'
    ],
    manualStepsEn: [
      'Step 1: Calculate your Life Path number from birth date (e.g., 7).',
      'Step 2: Calculate your Expression number from birth name (e.g., 5).',
      'Step 3: Sum the two numbers: 7 + 5 = 12.',
      'Step 4: Reduce to single digit: 1 + 2 = 3, preserving Master Numbers 11, 22, 33.'
    ],
    meanings: COMMON_MEANINGS,
    faqs: [
      {
        qVi: 'Khi nào Số Trưởng Thành bắt đầu phát huy tác dụng?',
        qEn: 'When does the Maturity Number become active?',
        aVi: 'Số Trưởng Thành thường bắt đầu thức tỉnh từ tuổi 35 và đạt ảnh hưởng mạnh mẽ nhất từ sau tuổi 40–45, khi bạn đã tích lũy đủ trải nghiệm sống và bắt đầu tìm kiếm ý nghĩa sâu sắc hơn.',
        aEn: 'The Maturity Number gradually awakens around age 35, reaching full bloom in your 40s and 50s as youthful exploration consolidates into wisdom.'
      },
      {
        qVi: 'Tại sao cần cả họ tên và ngày sinh để tính chỉ số này?',
        qEn: 'Why does this calculation require both name and birth date?',
        aVi: 'Vì Số Trưởng Thành là sự giao thoa hoàn hảo giữa con đường bạn đi (Ngày sinh - Đường Đời) và tiềm năng bạn mang theo (Họ tên - Sứ Mệnh).',
        aEn: 'Because Maturity is the divine marriage between who you came here to be (Birth Date) and the tools you were gifted to express it (Birth Name).'
      }
    ],
    relatedSlugs: [
      { slug: 'life-path-number-calculator', nameVi: 'Số Đường Đời', nameEn: 'Life Path Number', descVi: 'Thành phần thứ nhất tạo nên số trưởng thành.', descEn: 'The first pillar of your maturity.' },
      { slug: 'expression-number-calculator', nameVi: 'Số Sứ Mệnh', nameEn: 'Expression Number', descVi: 'Thành phần thứ hai kiến tạo số trưởng thành.', descEn: 'The second pillar of your maturity.' },
      { slug: 'soul-urge-number-calculator', nameVi: 'Số Linh Hồn', nameEn: 'Soul Urge Number', descVi: 'Ngọn lửa nhiệt huyết nuôi dưỡng tuổi trưởng thành.', descEn: 'The inner flame sustaining your growth.' }
    ]
  }
};
