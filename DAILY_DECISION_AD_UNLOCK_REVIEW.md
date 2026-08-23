# Phân tích vấn đề: Daily Decision Maker và Ad-Unlock

> **Trạng thái:** Tài liệu lịch sử, ngoài phạm vi sản phẩm hiện tại. Dự án hiện chỉ có một pipeline RAG Q&A chung cho câu hỏi numerology; không triển khai Daily Decision hoặc rewarded-ad unlock.

Ngày cập nhật: 22/08/2026

## 1. Tóm tắt

Ý tưởng Daily Decision Maker và mở khóa nội dung bằng quảng cáo phù hợp với website thần số học: người dùng nhận được giá trị nhanh, còn sản phẩm có thêm cơ chế freemium. Tuy nhiên, bản kế hoạch ban đầu mới mô tả tính năng ở mức ý tưởng. Trước khi triển khai cần làm rõ dữ liệu, giới hạn của AI, cách xác thực quảng cáo và tiêu chí đo lường chất lượng.

Tài liệu này ghi lại các vấn đề cần xử lý và quyết định thiết kế được đề xuất.

## 2. Các vấn đề chính

### 2.1. 60 câu hỏi chưa đủ nếu chỉ có tiêu đề

Kế hoạch dự kiến có 60 câu hỏi x 9 ngày cá nhân = 540 quyết định, nhưng chưa cung cấp nội dung cụ thể của 540 đáp án. Đây là tài sản nội dung cốt lõi của sản phẩm và phải được biên tập, dịch, kiểm duyệt trước khi đưa vào vector database.

Mỗi quyết định nên có tối thiểu:

- `question_id`, `category`, `intent` và danh sách biến thể câu hỏi.
- `personal_day` từ 1 đến 9.
- Nội dung tiếng Việt và tiếng Anh.
- Lý do ngắn gọn để giải thích lựa chọn.
- `safety_level` và cờ `requires_disclaimer` nếu liên quan đến sức khỏe, giao thông, tiền bạc hoặc quan hệ.
- `content_version` để có thể cập nhật nội dung mà không làm hỏng các kết quả cũ.

### 2.2. Semantic Search không đồng nghĩa với câu trả lời đúng

Embedding giúp tìm câu hỏi gần nghĩa, nhưng không quyết định được câu hỏi có nằm trong phạm vi hỗ trợ hay không. Ngưỡng `0.75` cần được hiệu chỉnh bằng dữ liệu kiểm thử có nhãn, không nên xem là giá trị mặc định.

Luồng an toàn hơn:

1. Chuẩn hóa ngôn ngữ và nhận diện intent.
2. Tìm kiếm các câu hỏi hạt giống gần nhất.
3. Kiểm tra ngưỡng và độ chênh giữa kết quả thứ nhất/thứ hai.
4. Nếu đủ tin cậy, lấy đáp án từ ma trận tĩnh.
5. Nếu không đủ tin cậy, hỏi lại hoặc trả lời ngoài phạm vi; chỉ dùng AI fallback cho các intent đã được cho phép.

Với 60 intent, có thể bắt đầu bằng keyword/rule engine kết hợp embedding. ChromaDB và embedding bên ngoài chỉ nên được thêm khi bộ kiểm thử chứng minh có lợi ích rõ ràng.

### 2.3. AI fallback không được tự bịa nguyên lý

Fallback chỉ nên chọn `intent` và diễn đạt nội dung đã được kiểm duyệt. Không nên để LLM tự suy luận rằng một câu hỏi bất kỳ phải dùng Số Linh Hồn, Số Nhân Cách hay một chỉ số khác.

Các câu hỏi về vitamin, giấc ngủ, lái xe, tiền bạc hoặc quyết định quan hệ cần có guardrail riêng. Câu trả lời nên có ngôn ngữ tham khảo/giải trí, không tạo cảm giác là tư vấn y tế, tài chính hoặc chuyên môn.

Ví dụ, câu hỏi “Hôm nay nên nuôi mèo hay chó?” không nên bị ép vào một chỉ số thần số học. Hệ thống có thể nói rằng câu hỏi ngoài phạm vi và đưa ra tiêu chí thực tế như thời gian, chi phí, không gian sống và khả năng chăm sóc.

### 2.4. Rewarded Ads không nên dùng countdown giả lập

Countdown 5–10 giây trong giao diện không phải bằng chứng quảng cáo đã hoàn thành. Quyền mở khóa phải được cấp sau event hoàn thành do ad provider phát ra; cần xử lý cả trường hợp người dùng đóng quảng cáo, không có ad fill, ad blocker, mạng lỗi hoặc mở nhiều tab.

Google yêu cầu rewarded ads phải có sự đồng ý rõ ràng, mô tả chính xác phần thưởng, cho phép người dùng bỏ qua và không làm gián đoạn việc dùng website nếu họ từ chối. Trên web, cần phân biệt rõ Google Ad Manager Rewarded Ads với AdSense/Offerwall.

Tham khảo:

- [Google Ad Manager: Traffic rewarded ads for web](https://support.google.com/admanager/answer/9116812?hl=en)
- [Google Publisher Tag: Display a rewarded ad](https://developers.google.com/publisher-tag/samples/display-rewarded-ad)
- [Google AdSense: Policies for ad units that offer rewards](https://support.google.com/adsense/answer/9121589?hl=en)

### 2.5. Unlock vĩnh viễn cần lưu ở backend

`localStorage` chỉ được dùng cho trạng thái giao diện tạm thời. Quyền mở khóa cần lưu server-side theo tài khoản/profile và có event idempotency để tránh cấp quyền nhiều lần cho một lượt quảng cáo.

Nên lưu các trường:

- `user_id`, `profile_id`, `metric_id`.
- `provider`, `provider_event_id`.
- `unlocked_at`, `content_version`.
- `status` và thông tin audit tối thiểu.

Cần quyết định từ đầu phạm vi của quyền mở khóa: theo một chỉ số, một báo cáo, một profile hay toàn bộ tài khoản.

### 2.6. Tiêu chí kiểm thử ban đầu còn thấp

10 biến thể câu hỏi và độ chính xác 85% chưa đủ để đánh giá hệ thống. Cần có bộ đánh giá gồm câu hỏi tiếng Việt, tiếng Anh, tiếng lóng, thiếu dấu, sai chính tả, câu ngoài phạm vi và câu nhạy cảm.

Ngoài độ chính xác, cần đo:

- Tỷ lệ nhận diện đúng intent.
- Tỷ lệ fallback an toàn.
- P95 latency của luồng không dùng LLM và có LLM.
- Chi phí trung bình mỗi lượt fallback.
- Tỷ lệ cấp unlock đúng sau khi quảng cáo hoàn thành.
- Tỷ lệ lỗi khi reload, đổi thiết bị hoặc mở nhiều tab.

### 2.7. Tài liệu ban đầu còn thiếu chi tiết triển khai

Mục “Mermaid diagram” đang là placeholder. Cần bổ sung sơ đồ thật, API contract, schema dữ liệu, quyền truy cập, log, rate limit và cách xử lý khi dịch vụ embedding/LLM/ads không khả dụng.

## 3. Kết luận và mức ưu tiên

Ý tưởng nên tiếp tục, nhưng chưa nên triển khai toàn bộ cùng lúc.

### P0 - Bắt buộc trước khi code production

- Hoàn thiện ma trận 540 quyết định và bản dịch.
- Định nghĩa intent, schema, version và safety flags.
- Xây bộ đánh giá có nhãn.
- Chốt nhà cung cấp rewarded ads và luồng xác thực event.
- Thiết kế unlock server-side.

### P1 - Cần có trong phiên bản đầu

- Rule engine cho intent chính.
- Embedding search có fallback an toàn.
- Disclaimer và bộ lọc câu hỏi nhạy cảm.
- Test reload, đa ngôn ngữ, no-fill và ad blocker.

### P2 - Có thể làm sau khi MVP ổn định

- AI tự đề xuất câu hỏi hạt giống mới.
- Cá nhân hóa nội dung theo lịch sử.
- A/B test vị trí quảng cáo và số lượng chỉ số khóa.
- Dashboard chất lượng và chi phí.
