# Chat Agent Prompt Lab

## Mục tiêu

Tinh chỉnh riêng luồng Chat Agent để câu trả lời:

- nói như một người bạn hiểu Tarot và Thần số học, không như thầy giáo hoặc thầy bói;
- trả lời đúng trọng tâm ngay câu đầu;
- có một nhận định trung tâm rõ ràng nhưng không biến dự đoán thành sự thật chắc chắn;
- dùng dữ liệu Tarot/Thần số học làm bằng chứng, không kể lại tài liệu;
- giảm lời khuyên chung chung và không ép mọi câu hỏi vào cùng một kiểu kết luận.

## Model đang dùng

- Phân loại intent: `Groq / openai/gpt-oss-20b`.
- Sinh câu trả lời Chat Agent: `DeepSeek / deepseek-chat`.
- `where_to_go` trả kết quả VietMap theo luồng xác thực riêng, không A/B bằng prompt trả lời chung.

## Kế hoạch triển khai

### Giai đoạn 1 — Lập baseline

1. Chọn tối thiểu 3 câu hỏi cho mỗi intent.
2. Chạy bằng prompt hiện tại và lưu nguyên văn output.
3. Trong môi trường development, dùng `scratch/chat-agent-prompt.json` để lấy đúng system/user prompt thực tế.
4. Không thay đồng thời model, temperature và prompt; baseline phải dùng cấu hình hiện tại.

### Giai đoạn 2 — Sửa classifier

1. Giữ một `primaryIntent` tương thích với route hiện tại.
2. Thêm `secondaryIntent` để không làm mất phần phụ của câu hỏi kép.
3. Thêm `answerMode` để model trả lời biết phải chọn, dự báo, giải thích hay mô tả chân dung.
4. Thêm `sensitivity` để câu hỏi rủi ro cao không bị đưa thẳng vào một bài Tarot thông thường.
5. Sửa fallback từ khóa: không coi mọi chữ “hay” là hai lựa chọn; chỉ nhận `two_choices` khi trích xuất được hai phương án.

Prompt thử nghiệm: [classifier-gpt-oss-20b.md](./classifier-gpt-oss-20b.md).

### Giai đoạn 3 — Sửa prompt trả lời

1. Thay persona “cà khịa cường độ cao” bằng “người bạn biết tâm linh”: gần gũi, nói thẳng, không lên lớp.
2. Tách prompt thành `base contract` và `intent contract`.
3. Chỉ yêu cầu một nhận định trung tâm; không bắt mọi bullet phải ghép Tarot với Thần số học.
4. Cho phép bỏ qua Thần số học khi không có tài liệu RAG đáng tin.
5. Giữ ba tiêu đề hiện tại để không phá UI, nhưng định nghĩa nội dung riêng cho từng intent.
6. Hạ temperature thử nghiệm từ `0.7` xuống `0.25–0.35` để tăng tính nhất quán.

Prompt thử nghiệm: [deepseek-chat-system.md](./deepseek-chat-system.md).

### Giai đoạn 4 — Kiểm soát output

1. Kiểm tra đủ ba phần, độ dài và số bullet.
2. Kiểm tra theo intent: `two_choices` phải gọi tên một lựa chọn; `timing_trajectory` phải có hướng diễn biến; `holistic_analysis` phải có một điểm nghẽn trung tâm.
3. Phát hiện các câu rỗng như “tùy bạn”, “hãy lắng nghe con tim”, “cả hai đều có ưu nhược điểm”.
4. Nếu sai hợp đồng, retry một lần bằng prompt sửa lỗi ngắn; nếu vẫn sai mới dùng fallback.
5. Viết fallback riêng theo dữ liệu thật, không dùng câu chung cố định.

### Giai đoạn 5 — A/B và rollout

1. Chạy cùng dữ liệu đầu vào với prompt cũ (A) và prompt mới (B).
2. Mỗi case chạy 3 lần để đo độ ổn định, không chỉ chọn output đẹp nhất.
3. Chỉ rollout khi B thắng A rõ ràng mà không tăng bịa đặt hoặc vi phạm an toàn.
4. Rollout theo thứ tự: `two_choices` → `relationship` → `timing_trajectory` → `general/daily` → các intent còn lại.

## Cách chấm A/B

Chấm mỗi tiêu chí từ 0–2:

1. **Trực diện:** câu đầu có trả lời đúng điều được hỏi không?
2. **Có lập trường:** có một nhận định trung tâm hay vẫn nói hai bên?
3. **Bám bằng chứng:** lý do có nối đúng lá/vị trí/tư liệu không?
4. **Cá nhân hóa thật:** bỏ tên người dùng đi thì câu này có áp dụng cho tất cả mọi người không?
5. **Giọng bạn bè:** có tự nhiên, dễ nghe, không lên lớp và không “phán” không?
6. **Hành động:** bước tiếp theo có đối tượng, thời điểm hoặc giới hạn rõ không?
7. **An toàn:** có tránh khẳng định tương lai, đọc suy nghĩ người khác và quyết định thay chuyên gia không?
8. **Nhất quán:** ba lần chạy có giữ cùng kết luận chính không?

Điều kiện đạt:

- Tổng điểm trung bình tối thiểu `13/16`.
- Không tiêu chí nào đạt `0`.
- Với `two_choices`, cả 3 lần phải chọn cùng một hướng khi dữ liệu không đổi.
- Không xuất hiện câu cấm hoặc dữ kiện không có trong input.

## Cách chạy thử

### Classifier

- Model: `openai/gpt-oss-20b` qua Groq.
- Temperature: `0.1`.
- Reasoning effort: `low`.
- Response format: JSON object.
- Max tokens: `350`.
- Dùng system prompt trong `classifier-gpt-oss-20b.md`, thay phần user template bằng từng test case.

### Chat Agent

- Model: `deepseek-chat`.
- Temperature A: `0.7` với prompt hiện tại.
- Temperature B1: `0.3` với prompt mới.
- Temperature B2: `0.7` với prompt mới để tách ảnh hưởng của prompt và temperature.
- Max tokens: `1200` là đủ cho format ngắn.
- System prompt = base contract + đúng một intent contract.
- User prompt = payload dữ liệu có delimiter như mẫu.

Các ca thử copy-paste: [test-cases.md](./test-cases.md).

## Vòng tinh chỉnh thứ hai

Sau lần test DeepSeek đầu tiên, V2 tập trung giảm giọng coach, siết suy đoán người thứ ba, phân biệt thời hạn thực hành với dự báo Tarot, loại hành động “ghi ra giấy”, bắt đúng bullet và sửa logic timing:

- [Kế hoạch V2](./iteration-2-plan.md)
- [6 prompt DeepSeek V2](./six-deepseek-ready-prompts-v2.md)

V3 giảm prompt-induced stiffness bằng silent constraints, giao vai trò riêng cho từng bullet và chặn toàn bộ biến thể ghi chép/danh sách:

- [Kế hoạch V3](./iteration-3-plan.md)
- [6 prompt DeepSeek V3](./six-deepseek-ready-prompts-v3.md)

