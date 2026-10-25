export type LoveMatchProfile = {
  fullName: string;
  birthDate?: string;
  gender?: string;
};

function escapePromptData(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildCompactLoveRetrySystemPrompt(firstName: string, secondName: string): string {
  const safeFirstName = escapePromptData(firstName);
  const safeSecondName = escapePromptData(secondName);
  return `Bạn là Tiểu Linh Miêu. Trả lời ngắn, tiếng Việt, chỉ dùng dữ liệu trong yêu cầu.
- Gọi đúng tên ${safeFirstName} và ${safeSecondName}; không dùng “bạn”, “người ấy”, “hai bạn”, “Người A/B”.
- Không dùng Tarot. Chọn một quan điểm nổi trội từ dữ liệu Tử Vi/Bát Tự rồi nói thẳng theo hướng đó.
- Nếu câu hỏi hỏi một người nghĩ/cảm thấy gì về người kia, trả lời trực tiếp theo đúng chiều chủ thể → đối tượng; được phép suy luận khi tín hiệu chưa tuyệt đối và không dùng câu né tránh “không thể biết chắc”.
- Điểm tương hợp là dữ liệu tham khảo, không phải định mệnh.

Dùng đúng ba phần, không mở bài, tối đa 220 từ:
✦ KẾT LUẬN NHANH:
[2–3 câu trả lời trực tiếp]
✦ VÌ SAO:
• [2–3 ý ngắn, có dữ kiện]
✦ NÊN LÀM GÌ:
• [1–2 hành động cụ thể]`;
}

export function buildCompactLoveRetryUserPrompt(input: {
  message: string;
  first: LoveMatchProfile;
  second: LoveMatchProfile;
  baziScore: number;
  baziSummary: string;
}): string {
  return [
    `<user_message>${escapePromptData(input.message)}</user_message>`,
    '<profiles>',
    `${escapePromptData(input.first.fullName)}: ${escapePromptData(input.first.gender || 'không xác định')}, sinh ${escapePromptData(input.first.birthDate || 'không xác định')}.`,
    `${escapePromptData(input.second.fullName)}: ${escapePromptData(input.second.gender || 'không xác định')}, sinh ${escapePromptData(input.second.birthDate || 'không xác định')}.`,
    'Nam/nữ trong câu hỏi phải ánh xạ theo giới tính trên.',
    '</profiles>',
    `<bazi_data>Điểm backend duy nhất: ${input.baziScore}%.\n${escapePromptData(input.baziSummary)}</bazi_data>`,
  ].join('\n');
}

export function buildDirectionalLoveFallback(
  message: string,
  first: LoveMatchProfile,
  second: LoveMatchProfile,
  baziScore: number,
): string {
  const asksPrivateThought = /(?:nghĩ\s+gì|cảm\s+thấy\s+(?:gì|thế nào)|có\s+tình\s+cảm|trong\s+lòng)/i.test(message);
  const male = [first, second].find((profile) => profile.gender === 'male');
  const female = [first, second].find((profile) => profile.gender === 'female');
  const maleToFemale = Boolean(male && female && /(?:nam|anh ấy|người nam).{0,32}(?:nữ|cô ấy|người nữ)/i.test(message));
  const femaleToMale = Boolean(male && female && /(?:nữ|cô ấy|người nữ).{0,32}(?:nam|anh ấy|người nam)/i.test(message));
  const subject = maleToFemale ? male! : femaleToMale ? female! : first;
  const target = maleToFemale ? female! : femaleToMale ? male! : second;

  if (asksPrivateThought) {
    const viewpoint = baziScore >= 85
      ? `${subject.fullName} đang có thiện cảm rõ với ${target.fullName} và xem ${target.fullName} là người đáng để tiến gần nghiêm túc.`
      : baziScore >= 70
        ? `${subject.fullName} có để tâm đến ${target.fullName}, nhưng vẫn đang thăm dò xem hai người có thật sự cùng nhịp hay không.`
        : `${subject.fullName} có chú ý đến ${target.fullName}, nhưng hiện nghiêng về dè chừng và quan sát nhiều hơn là chủ động tiến tới.`;
    return [
      `✦ KẾT LUẬN NHANH:\n${viewpoint} Mức tương hợp ${baziScore}% nghiêng về một kết nối có sức hút và khả năng phát triển nếu ${subject.fullName} chủ động rõ hơn.`,
      `\n✦ VÌ SAO:\n• Tương tác Tử Vi/Bát Tự cho thấy ${subject.fullName} dễ nhìn thấy ở ${target.fullName} sự ổn định và nét cuốn hút phù hợp để xây dựng kết nối.\n• Nhịp giữa ${subject.fullName} và ${target.fullName} vẫn có điểm cần điều chỉnh, nên ${subject.fullName} có xu hướng vừa quan tâm vừa quan sát phản ứng của ${target.fullName}.`,
      `\n✦ NÊN LÀM GÌ:\n• ${subject.fullName} nên tạo một lời mời cụ thể để ${target.fullName} có cơ hội phản hồi rõ ràng, thay vì tiếp tục giữ sự quan tâm ở mức dò ý.`,
    ].join('\n');
  }

  return [
    `✦ KẾT LUẬN NHANH:\n${first.fullName} và ${second.fullName} đạt khoảng ${baziScore}% tương hợp. Đây là nền tảng tham khảo để ${first.fullName} và ${second.fullName} hiểu nhịp tương tác, không phải kết luận về tình cảm hay tương lai.`,
    `\n✦ VÌ SAO:\n• Cung Phu Thê và ngũ hành của ${first.fullName} với ${second.fullName} có cả điểm bổ trợ lẫn điểm cần điều chỉnh.\n• Điểm số không thay thế hành vi thực tế và lựa chọn của ${first.fullName} hoặc ${second.fullName}.`,
    `\n✦ NÊN LÀM GÌ:\n• ${first.fullName} và ${second.fullName} nói rõ mong đợi và một ranh giới quan trọng trước khi tiến thêm.`,
  ].join('\n');
}
