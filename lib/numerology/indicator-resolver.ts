/**
 * indicator-resolver.ts - Bộ giải mã & trích xuất chuyên sâu các chỉ số Thần số học Pythagoras
 * Kết nối giữa yêu cầu của AI Classifier (chọn 1-5 chỉ số) với kho kiến thức bản mệnh (Archetypes)
 */

import {
  calculateLifePath,
  calculateExpression,
  calculateSoulUrge,
  calculatePersonality,
  calculateBirthdayNumber,
  calculateMaturity,
  calculatePersonalYear,
  reduceDigits,
  normalizeName,
  PYTHAGOREAN_TABLE
} from './calculator-engine.ts';

export interface ResolvedIndicator {
  key: string;
  nameVi: string;
  value: number;
  archetypeVi: string;
  strengths: string[];
  challenges: string[];
  advice: string;
  summaryLine: string;
}

// 1–9 & 11, 22, 33 Base Meanings
const ARCHETYPE_MAP: Record<number, { title: string; str: string[]; cha: string[]; adv: string }> = {
  1: {
    title: 'Nhà Lãnh Đạo Tiên Phong',
    str: ['Độc lập, ý chí kiên định', 'Khả năng khởi xướng vượt trội', 'Tư duy đổi mới, quyết đoán'],
    cha: ['Dễ độc đoán hoặc thiếu kiên nhẫn', 'Khó thỏa hiệp hoặc lắng nghe ý kiến người khác'],
    adv: 'Rèn luyện sự khiêm nhường và học cách dẫn dắt bằng cảm hứng thay vì áp đặt quyền uy.'
  },
  2: {
    title: 'Sứ Giả Hòa Bình & Trực Giác',
    str: ['Trực giác nhạy bén, đồng cảm sâu sắc', 'Năng khiếu ngoại giao, hòa giải', 'Biết cách lắng nghe và gắn kết'],
    cha: ['Dễ nhạy cảm thái quá, sợ xung đột', 'Có xu hướng phụ thuộc cảm xúc vào người khác'],
    adv: 'Thiết lập ranh giới cảm xúc lành mạnh và tin tưởng vào tiếng nói nội tâm của chính bạn.'
  },
  3: {
    title: 'Nghệ Sĩ Biểu Đạt & Sáng Tạo',
    str: ['Năng lượng lạc quan, truyền cảm hứng', 'Khả năng ngôn từ và nghệ thuật vượt trội', 'Tâm hồn phong phú, hòa đồng'],
    cha: ['Dễ phân tán năng lượng, thiếu kiên trì', 'Đôi khi trốn tránh cảm xúc thật bằng sự vui vẻ bề ngoài'],
    adv: 'Tập trung năng lượng sáng tạo vào mục tiêu dài hạn và học cách đối diện với chiều sâu nội tâm.'
  },
  4: {
    title: 'Người Xây Dựng & Kỷ Luật',
    str: ['Kỷ luật vững vàng, tỉ mỉ, đáng tin cậy', 'Tư duy logic, tổ chức hệ thống', 'Kiên định, trách nhiệm cao'],
    cha: ['Cứng nhắc, khó thích ứng với thay đổi', 'Đôi khi quá bảo thủ hoặc làm việc kiệt sức'],
    adv: 'Đón nhận những điều bất ngờ và cho phép bản thân linh hoạt trước dòng chảy cuộc sống.'
  },
  5: {
    title: 'Nhà Thám Hiểm Tự Do',
    str: ['Thích ứng phi thường, đa tài', 'Khát khao phiêu lưu, khám phá thế giới', 'Khả năng lan tỏa năng lượng đổi mới'],
    cha: ['Dễ bồn chồn, thiếu kiên nhẫn', 'Sợ sự ràng buộc, dễ phân tán cam kết'],
    adv: 'Tự do đích thực đến từ sự làm chủ bản thân; hãy tìm kiếm tự do trong mục đích thay vì chỉ trốn chạy cam kết.'
  },
  6: {
    title: 'Người Nuôi Dưỡng & Trách Nhiệm',
    str: ['Tình yêu thương vô điều kiện, hướng về gia đình', 'Trách nhiệm cao, gu thẩm mỹ tinh tế', 'Khả năng chữa lành và che chở'],
    cha: ['Dễ kiểm soát, can thiệp quá sâu vào người khác', 'Hay hy sinh quên mình dẫn đến oán trách ngầm'],
    adv: 'Chăm sóc bản thân là điều kiện tiên quyết để có thể yêu thương và chăm sóc người khác trọn vẹn.'
  },
  7: {
    title: 'Nhà Hiền Triết & Khai Phóng Tri Thức',
    str: ['Tư duy phân tích sắc bén, trực giác tâm linh', 'Khát khao tìm kiếm chân lý tối thượng', 'Độc lập, sâu sắc, tinh tế'],
    cha: ['Khép kín, hoài nghi, khó mở lòng', 'Dễ cảm thấy cô đơn hoặc xa cách với thực tại'],
    adv: 'Kết hợp tri thức trí tuệ với sự kết nối con người; đừng để sự tìm tòi biến thành ốc đảo cô độc.'
  },
  8: {
    title: 'Nhà Kiến Tạo Thịnh Vượng & Quyền Lực',
    str: ['Tầm nhìn chiến lược, khả năng điều hành lớn', 'Lực hút thịnh vượng và năng lượng dồi dào', 'Công bằng, kiên cường vượt nghịch cảnh'],
    cha: ['Dễ bị cuốn vào chủ nghĩa vật chất', 'Khắc nghiệt với bản thân và người dưới quyền'],
    adv: 'Sức mạnh thật sự là công cụ phụng sự; hãy biến tài chính và ảnh hưởng thành phương tiện xây dựng giá trị bền vững.'
  },
  9: {
    title: 'Nhà Nhân Đạo Bác Ái & Trí Huệ',
    str: ['Tấm lòng vị tha, bao dung toàn nhân loại', 'Tầm nhìn rộng mở, trực giác tâm linh trưởng thành', 'Khả năng buông bỏ và thấu hiểu'],
    cha: ['Dễ thất vọng trước thực tế trần tục', 'Khó buông bỏ quá khứ hoặc những mất mát'],
    adv: 'Cống hiến với tâm thế bình an; chấp nhận sự không hoàn hảo như một phần của hành trình tiến hóa.'
  },
  11: {
    title: 'Bậc Thầy Trực Giác & Soi Sáng (Master 11)',
    str: ['Trực giác thần bí phi thường, tần số tâm linh cao', 'Khả năng truyền cảm hứng thức tỉnh người khác', 'Tầm nhìn đi trước thời đại'],
    cha: ['Năng lượng quá tải gây căng thẳng thần kinh', 'Dao động giữa nghi ngờ bản thân và sứ mệnh lớn'],
    adv: 'Học cách giữ thăng bằng thân-tâm-trí; bạn là chiếc cầu nối giữa trực giác và thế giới thực tại.'
  },
  22: {
    title: 'Bậc Thầy Kiến Thiết Thế Giới (Master 22)',
    str: ['Biến lý tưởng vĩ đại thành hiện thực cụ thể', 'Tầm nhìn không giới hạn kết hợp kỷ luật phi thường', 'Năng lực lãnh đạo các dự án mang tính di sản'],
    cha: ['Áp lực cực lớn từ kỳ vọng bản thân', 'Sợ thất bại khi gánh vác trách nhiệm khổng lồ'],
    adv: 'Xây dựng từng viên gạch với sự nhẫn nại; di sản vĩ đại nhất được tạo nên từ sự kiên định mỗi ngày.'
  },
  33: {
    title: 'Bậc Thầy Nâng Đỡ & Tình Yêu Phổ Quát (Master 33)',
    str: ['Tình yêu thương vô điều kiện ở tầng thứ cao nhất', 'Khả năng chữa lành và nâng đỡ tâm hồn nhân loại', 'Hiện thân của sự tận tụy và từ bi'],
    cha: ['Gánh nặng cảm xúc của tha nhân', 'Dễ kiệt quệ nếu không biết tự bảo vệ năng lượng'],
    adv: 'Soi sáng bằng chính sự an lạc nội tại của bạn; đừng gánh thay số phận của người khác.'
  }
};

const PERSONAL_YEAR_THEMES: Record<number, string> = {
  1: 'Khởi đầu mới, tiên phong, đặt nền móng cho chu kỳ 9 năm tiếp theo.',
  2: 'Hợp tác, hòa giải, kiên nhẫn, phát triển trực giác và các mối quan hệ.',
  3: 'Mở rộng giao tiếp, sáng tạo, lan tỏa cảm hứng và học hỏi kỹ năng mới.',
  4: 'Kỷ luật, củng cố nền tảng, làm việc kiên trì và quản lý tài chính vững chắc.',
  5: 'Thay đổi, bứt phá giới hạn, linh hoạt, du lịch và đón nhận cơ hội bất ngờ.',
  6: 'Gia đình, trách nhiệm, yêu thương, phụng sự và chăm sóc những người thân yêu.',
  7: 'Chiêm nghiệm, tĩnh lặng, đào sâu tâm linh, nâng cao tri thức và nhìn lại chính mình.',
  8: 'Gặt hái tài chính, quyền lực cá nhân, thành tựu sự nghiệp và đền đáp công sức.',
  9: 'Khép lại chu kỳ, buông bỏ những điều không còn phù hợp, bao dung và chuẩn bị tái sinh.'
};

export function resolveTargetIndicators(
  fullName: string,
  birthDate: string,
  requestedKeys: string[] = []
): ResolvedIndicator[] {
  const parts = birthDate.split('-');
  const year = parseInt(parts[0], 10) || 2000;
  const month = parseInt(parts[1], 10) || 1;
  const day = parseInt(parts[2], 10) || 1;

  // Lấy tối đa 5 keys duy nhất
  const uniqueKeys = Array.from(new Set(requestedKeys.filter(Boolean))).slice(0, 5);
  const keysToProcess = uniqueKeys.length > 0 ? uniqueKeys : ['walksOfLife', 'yearIndividual'];

  const results: ResolvedIndicator[] = [];

  for (const key of keysToProcess) {
    let value = 1;
    let nameVi = '';

    switch (key) {
      case 'walksOfLife': {
        nameVi = 'Số Đường Đời (Life Path)';
        value = calculateLifePath(day, month, year).value;
        break;
      }
      case 'mission': {
        nameVi = 'Số Sứ Mệnh (Destiny / Expression)';
        value = calculateExpression(fullName).value;
        break;
      }
      case 'soul': {
        nameVi = 'Số Linh Hồn (Soul Urge)';
        value = calculateSoulUrge(fullName).value;
        break;
      }
      case 'personality': {
        nameVi = 'Số Nhân Cách (Personality)';
        value = calculatePersonality(fullName).value;
        break;
      }
      case 'dateOfBirth': {
        nameVi = 'Số Ngày Sinh (Birthday Number)';
        value = calculateBirthdayNumber(day).value;
        break;
      }
      case 'mature': {
        nameVi = 'Số Trưởng Thành (Maturity Number)';
        value = calculateMaturity(day, month, year, fullName).value;
        break;
      }
      case 'rationalThinking': {
        nameVi = 'Số Tư Duy Lý Trí (Rational Thought)';
        const norm = normalizeName(fullName);
        const firstName = norm.split(' ').pop() || '';
        let nameSum = 0;
        for (const c of firstName) {
          nameSum += PYTHAGOREAN_TABLE[c] || 0;
        }
        const rDay = reduceDigits(day, false).result;
        const rName = reduceDigits(nameSum, false).result;
        value = reduceDigits(rDay + rName, true).result;
        break;
      }
      case 'yearIndividual': {
        const curYear = new Date().getFullYear();
        nameVi = `Năm Cá Nhân ${curYear} (Personal Year)`;
        value = calculatePersonalYear(day, month, curYear).value;
        break;
      }
      case 'attitude': {
        nameVi = 'Số Thái Độ (Attitude Number)';
        const rDay = reduceDigits(day, false).result;
        const rMonth = reduceDigits(month, false).result;
        value = reduceDigits(rDay + rMonth, false).result;
        break;
      }
      default: {
        continue;
      }
    }

    const arch = ARCHETYPE_MAP[value] || ARCHETYPE_MAP[reduceDigits(value, false).result] || {
      title: `Năng Lượng Số ${value}`,
      str: ['Tập trung, quyết đoán', 'Độc lập'],
      cha: ['Cần cân bằng nội tâm'],
      adv: 'Phát huy điểm mạnh tự nhiên của bản thân.'
    };

    let summaryLine = '';
    if (key === 'yearIndividual') {
      summaryLine = `Năm số ${value}: ${PERSONAL_YEAR_THEMES[value] || 'Chu kỳ phát triển cá nhân.'}`;
    } else {
      summaryLine = `Số ${value} [${arch.title}]: Mạnh về ${arch.str.slice(0, 2).join(', ')}; Thách thức: ${arch.cha[0] || 'Chưa kiểm soát tốt năng lượng'}. Lời khuyên: ${arch.adv}`;
    }

    results.push({
      key,
      nameVi,
      value,
      archetypeVi: arch.title,
      strengths: arch.str,
      challenges: arch.cha,
      advice: arch.adv,
      summaryLine
    });
  }

  return results;
}

export function formatIndicatorsForPrompt(indicators: ResolvedIndicator[]): string {
  if (!indicators || indicators.length === 0) return 'Không có dữ liệu chỉ số bổ sung.';
  return indicators.map((ind, i) => `${i + 1}. ${ind.nameVi} = ${ind.value} (${ind.archetypeVi}):
   • Điểm mạnh cốt lõi: ${ind.strengths.join('; ')}
   • Thách thức/Điểm yếu cần chú ý: ${ind.challenges.join('; ')}
   • Bài học & Lời khuyên: ${ind.advice}`).join('\n');
}
