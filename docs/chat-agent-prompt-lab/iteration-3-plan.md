# Kế hoạch tinh chỉnh Prompt V3

## Mục tiêu

V3 giữ độ dứt khoát và khả năng tuân thủ format của V2, nhưng sửa ba dấu hiệu còn máy móc:

1. Model lặp lại chỉ dẫn an toàn trong câu trả lời.
2. Các bullet đúng format nhưng đôi khi nói lại cùng một ý.
3. Hành động vẫn lách về ghi chép, danh sách hoặc phong cách quản lý năng suất.

## Nguyên tắc thiết kế V3

### 1. Silent constraints

Các quy tắc an toàn và giới hạn chỉ điều khiển cách trả lời, không được xuất hiện trong nội dung gửi người dùng.

- Không viết “đây không phải dự báo”, “đây chỉ là khung thử”, “theo chỉ dẫn”, “dữ liệu được cung cấp”.
- Thời hạn do AI đề xuất được diễn đạt tự nhiên bằng “bạn có thể tự cho mình…” hoặc “thử trong…”.
- Chỉ giải thích giới hạn Tarot/Thần số học khi câu hỏi trực tiếp yêu cầu sự chắc chắn hoặc thuộc vùng rủi ro cao.

### 2. Mỗi bullet có một nhiệm vụ riêng

Thay vì yêu cầu 2–4 bullet chung chung, mỗi intent định nghĩa chính xác chức năng của từng bullet. Model không được dùng hai bullet để diễn đạt lại cùng một luận điểm.

Ví dụ chân dung:

- Bullet 1: thế mạnh.
- Bullet 2: điểm tự làm khó.
- Bullet 3: tình huống hai mặt va nhau.

### 3. Chặn cả họ hành động ghi chép

Không chỉ cấm “ghi ra giấy”. Cấm đề xuất người dùng:

- viết, ghi, note;
- lập, mở hoặc đọc danh sách;
- dùng nhật ký, bảng, tracker;
- ghi nhận nhanh, theo dõi hoặc chấm tiến độ.

Ngoại lệ chỉ khi chính người dùng hỏi về học tập, ghi nhớ, lập kế hoạch hoặc công cụ tổ chức.

### 4. Hành động phải là hành vi ngoài đời

Ưu tiên:

- đóng hoặc cất một thiết bị;
- gửi hoặc không gửi một tin nhắn;
- bật chế độ không làm phiền;
- từ chối hoặc bàn giao một việc;
- nói một câu rõ ràng với người liên quan;
- bắt đầu, hoàn tất hoặc dừng một hành động quan sát được.

### 5. Giảm chất coach bằng độ dài và từ vựng

- Rút mục tiêu xuống khoảng 100–160 từ.
- Không dùng các từ: cơ chế, nguồn lực, vùng mất cân bằng, chiến lược, tối ưu, hiệu suất, KPI, kiểm chứng, quy trình.
- Không mở đầu bằng nhãn “Bạn là người…”.
- Dùng một câu đời thường khi phù hợp, nhưng không bắt buộc cà khịa.

## Logic riêng cần giữ

### Two choices

- Câu đầu gọi tên một phương án.
- Lý do gồm: tình trạng hiện tại, so sánh kết quả, rủi ro của phương án đã chọn.

### Relationship

- Chỉ đánh giá hành vi quan sát được.
- Không suy luận ý định hoặc cảm xúc của người thứ ba.
- Nếu thêm thời hạn, dùng như ranh giới người hỏi tự chọn.

### Timing

- Câu 1: `Hiện tại:`.
- Câu 2: `Xu hướng ba tháng tới:`.
- Không trộn trạng thái hiện tại với khả năng tương lai.

### Holistic

- Một điểm nghẽn trung tâm.
- Ba bullet: biểu hiện, lý do nó lặp, chỗ có thể đổi.

### Core personality

- Hai khuynh hướng và chỗ va nhau.
- Ba bullet không trùng vai trò.
- Một thử nghiệm hành vi, không ghi chép.

### Daily guidance

- Một ưu tiên.
- Hai bullet: lý do chọn và điều cần tránh.
- Một hành động trực tiếp, không biến thành kế hoạch quản trị ngày làm việc.

## Quy trình test

1. Mỗi prompt V3 chạy trong chat DeepSeek mới.
2. Chạy ba lần mỗi prompt; lưu đủ 18 output.
3. So sánh cùng dữ liệu với V1 và V2.
4. Chấm rubric cũ và thêm ba cổng bắt buộc:
   - Không lộ chỉ dẫn kỹ thuật.
   - Không có bất kỳ biến thể ghi chép/danh sách/tracker nào.
   - Không có hai bullet trùng vai trò.

## Điều kiện qua vòng

- 18/18 output đúng ký tự bullet.
- 18/18 không lộ câu giải thích nội bộ.
- 18/18 không dùng hành động ghi chép khi input không yêu cầu.
- Prompt relationship không có suy đoán tâm trí người thứ ba.
- Prompt timing luôn tách hiện tại và xu hướng.
- Điểm “giọng người bạn” trung bình tối thiểu 1.5/2.

Nếu V3 vẫn lỗi format hoặc lộ quy tắc quá 1 lần trong 18 lượt, bước tiếp theo không phải thêm prompt dài hơn mà là structured output kết hợp validator/retry.

