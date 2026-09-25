import { getChatResponseBudget, normalizeChatReply } from '../lib/spiritual-agent/response-length.ts';

const fallback = [
  '✦ KẾT LUẬN NHANH:\nThông điệp hiện tại là giữ vững hướng đi và đừng vội phản ứng theo cảm xúc.',
  '\n✦ VÌ SAO:\n• Lá Nhà Ảo Thuật (The Magician) nhấn mạnh bài học nhìn lại và điều chỉnh.\n• Một lựa chọn bình tĩnh sẽ giúp bạn thấy rõ bước tiếp theo.',
  '\n✦ NÊN LÀM GÌ:\n• Chọn một việc quan trọng nhất hôm nay.\n• Hoàn thành nó trước khi nhận thêm cam kết.'
].join('\n');

const budget = getChatResponseBudget({ intent: 'general', cardCount: 1 });

// Test 1: Chuẩn
const sample1 = `✦ KẾT LUẬN NHANH:
Bạn nên cẩn trọng với các quyết định tài chính trong hôm nay.

✦ VÌ SAO:
• Lá bài The Magician ngược cho thấy bạn đang thiếu tập trung và dễ bị phân tán nguồn lực.
• Cần xem xét lại các kế hoạch trước khi hành động.

✦ NÊN LÀM GÌ:
• Dành 15 phút rà soát lại các khoản chi.
• Tránh đưa ra quyết định vội vàng.`;

const res1 = normalizeChatReply(sample1, fallback, budget.complexity);
console.log('Test 1 (chuẩn) -> Có fallback không?', res1.includes('giữ vững hướng đi'));

// Test 2: AI quên dấu chấm ở bullet
const sample2 = `✦ KẾT LUẬN NHANH:
Bạn nên cẩn trọng với các quyết định tài chính trong hôm nay.

✦ VÌ SAO:
• Lá bài The Magician ngược cho thấy bạn đang thiếu tập trung
• Cần xem xét lại các kế hoạch trước khi hành động.

✦ NÊN LÀM GÌ:
• Dành 15 phút rà soát lại các khoản chi
• Tránh đưa ra quyết định vội vàng.`;

const res2 = normalizeChatReply(sample2, fallback, budget.complexity);
console.log('Test 2 (thiếu dấu chấm) -> Có fallback không?', res2.includes('giữ vững hướng đi'));

// Test 3: AI dùng format markdown **✦ KẾT LUẬN NHANH:** hoặc không có ký tự ✦
const sample3 = `KẾT LUẬN NHANH:
Bạn nên cẩn trọng với các quyết định tài chính trong hôm nay.

VÌ SAO:
• Lá bài The Magician ngược cho thấy bạn đang thiếu tập trung.
• Cần xem xét lại các kế hoạch trước khi hành động.

NÊN LÀM GÌ:
• Dành 15 phút rà soát lại các khoản chi.
• Tránh đưa ra quyết định vội vàng.`;

const res3 = normalizeChatReply(sample3, fallback, budget.complexity);
console.log('Test 3 (không có ✦) -> Có fallback không?', res3.includes('giữ vững hướng đi'));

// Test 4: AI viết đoạn mở đầu "Chào bạn! Dưới đây là phân tích..."
const sample4 = `Chào bạn, mình xin gửi phân tích lá bài của bạn:

✦ KẾT LUẬN NHANH:
Bạn nên cẩn trọng với các quyết định tài chính trong hôm nay.

✦ VÌ SAO:
• Lá bài The Magician ngược cho thấy bạn đang thiếu tập trung.
• Cần xem xét lại các kế hoạch trước khi hành động.

✦ NÊN LÀM GÌ:
• Dành 15 phút rà soát lại các khoản chi.
• Tránh đưa ra quyết định vội vàng.`;

const res4 = normalizeChatReply(sample4, fallback, budget.complexity);
console.log('Test 4 (có lời chào mở đầu) -> Có fallback không?', res4.includes('giữ vững hướng đi'));

// Test 5: AI viết hơi dài
const sample5 = `✦ KẾT LUẬN NHANH:
Bạn nên cẩn trọng với các quyết định tài chính trong hôm nay vì thời điểm này chưa thích hợp để mạo hiểm.

✦ VÌ SAO:
• Lá bài The Magician ngược chỉ ra rằng năng lượng sáng tạo, sự tự tin và các công cụ thực thi của bạn đang không được đặt đúng chỗ, dễ dẫn đến những sai sót không đáng có khi tiến hành dự án quan trọng.
• Nguồn lực và sự hỗ trợ xung quanh đang có dấu hiệu bị gián đoạn, đòi hỏi bạn phải tự mình kiểm chứng lại tính khả thi của mọi thỏa thuận trước khi ký kết hoặc chuyển tiền.
• Đây là bài học để bạn rèn luyện tính kiên nhẫn thay vì đốt cháy giai đoạn.

✦ NÊN LÀM GÌ:
• Dành 15 phút rà soát lại toàn bộ kế hoạch và các khoản chi tiêu.
• Lùi các quyết định đầu tư quan trọng sang tuần sau.`;

const res5 = normalizeChatReply(sample5, fallback, budget.complexity);
console.log('Test 5 (hơi dài) -> Có fallback không?', res5.includes('giữ vững hướng đi'));
