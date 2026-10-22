# Kế hoạch tinh chỉnh Prompt V2

## Mục tiêu vòng hai

Giữ lại ưu điểm của V1 — trả lời thẳng, có lập trường, bám dữ liệu — đồng thời sửa sáu lỗi đã quan sát trong output DeepSeek:

1. Giảm giọng coach hoặc thầy phân tích.
2. Không biến thời hạn do AI đề xuất thành mốc được Tarot dự báo.
3. Không suy đoán ý định, cảm xúc hoặc hành động tương lai của người thứ ba.
4. Chặn hành động mẫu “ghi ra giấy”, “viết nhật ký”, “lập danh sách”.
5. Bắt buộc đúng bullet `•` để tương thích validator.
6. Với timing, tách rõ hiện trạng và xu hướng có điều kiện.

## Thay đổi trong Base Contract

### Giọng người bạn

- Viết như đang trả lời tin nhắn riêng cho một người bạn, không như đang lập báo cáo.
- Ưu tiên câu đời thường: “Nói thẳng nhé…”, “Chỗ đang giữ bạn lại là…”, “Mình nghiêng về…”.
- Tránh các cụm mang giọng chuyên gia: “cơ chế duy trì”, “nguồn lực tháo gỡ”, “vùng mất cân bằng”, “chiến lược phát triển”, “đặt mốc kiểm chứng”.
- Không mở đầu bằng “Bạn là người…”. Dùng “Ở bạn có xu hướng…” hoặc mô tả hành vi cụ thể để tránh dán nhãn.
- Không bắt buộc hài hước hoặc cà khịa.

### Thời hạn đề xuất

- Model được phép đưa khung thời gian thực hành, nhưng phải thể hiện đó là ranh giới/thử nghiệm do người dùng tự đặt.
- Không được viết như thể Tarot dự báo rằng sau 7 ngày, 4 tuần hoặc một mốc tùy ý sẽ có sự kiện xảy ra.
- Mẫu đúng: “Bạn có thể tự cho mình một tuần để quan sát rồi dừng chờ.”
- Mẫu sai: “Trong 7 ngày họ sẽ cho bạn câu trả lời.”

### Người thứ ba

- Chỉ mô tả hành vi quan sát được: nhắn trực tiếp, giữ lời, chủ động hẹn, tương tác lặp lại.
- Cấm suy luận: “họ thật sự muốn”, “họ còn yêu”, “họ sẽ quay lại”, “họ đang thử lòng”.
- Quyết định phải dựa trên mức độ rõ ràng và nhất quán của hành vi, không dựa trên ý định được đoán.

### Hành động

- Cấm mặc định: ghi ra giấy, viết nhật ký, lập danh sách, theo dõi bằng bảng hoặc ghi chép cảm xúc.
- Ưu tiên hành động ngoài đời: đóng máy, gửi một tin nhắn, từ chối một việc, đặt điện thoại ngoài tầm tay, khóa lịch, bắt đầu một phiên làm việc, hẹn một cuộc nói chuyện.
- Chỉ dùng ghi chép khi người dùng hỏi về học tập, tổ chức hoặc theo dõi và ghi chép thật sự là lựa chọn tốt nhất.

### Format

- Trong `✦ VÌ SAO` và `✦ NÊN LÀM GÌ`, mỗi ý bắt buộc bắt đầu bằng ký tự `•`.
- Không dùng đoạn văn trần trong hai phần này.
- `VÌ SAO`: 2–4 bullet.
- `NÊN LÀM GÌ`: 1–2 bullet.

## Thay đổi riêng cho Timing

Kết luận dùng hai lớp rõ ràng:

1. `Hiện tại:` đang cải thiện, chững lại hay xấu đi.
2. `Xu hướng:` sẽ nghiêng về đâu nếu giữ nguyên hoặc thực hiện hành động cụ thể.

Không được viết “đang cải thiện nhưng chỉ khi…”, vì đó là trộn hiện trạng với khả năng tương lai.

Ví dụ đúng:

> Hiện tại công việc vẫn đang chững. Trong ba tháng tới, xu hướng có thể cải thiện rõ nếu bạn cam kết với một hướng mới thay vì tiếp tục giữ cấu trúc cũ.

## Quy trình test V2

1. Dùng đúng sáu tình huống và dữ liệu của V1 để so sánh công bằng.
2. Mở chat DeepSeek mới cho từng prompt.
3. Chạy mỗi prompt ba lần ở temperature `0.3` nếu dùng API.
4. Không chọn output đẹp nhất; lưu cả ba lần.
5. So sánh V1 và V2 theo rubric cũ, cộng thêm sáu kiểm tra hồi quy dưới đây.

## Kiểm tra hồi quy bắt buộc

Mỗi output chỉ đạt khi:

- câu đầu vẫn chốt đúng trọng tâm;
- không xuất hiện cụm coach/thầy phân tích bị cấm;
- mọi mốc thời gian tự thêm đều được diễn đạt như đề xuất thực hành;
- không có câu suy đoán tâm trí người thứ ba;
- không có “ghi ra giấy”, “viết nhật ký” hoặc “lập danh sách”;
- tất cả ý trong hai phần cuối đều bắt đầu bằng `•`;
- riêng timing có cả `Hiện tại` và `Xu hướng`, không tự mâu thuẫn.

## Tiêu chí quyết định sau test

- Nếu V2 giữ điểm trực diện và lập trường bằng V1 nhưng giọng tự nhiên hơn, dùng V2 làm base prompt mới.
- Nếu bullet vẫn sai ở hơn 1/18 lượt chạy, cần structured output hoặc post-validator; không tiếp tục nhồi thêm chữ “BẮT BUỘC” vào prompt.
- Nếu suy đoán người thứ ba vẫn xuất hiện, thêm validator theo cụm từ và retry một lần.
- Nếu timing vẫn trộn hiện trạng/xu hướng, chuyển kết luận timing sang schema hai trường trước khi render thành văn bản.

