# Benchmark và tối ưu thứ tự LLM fallback

## Tóm tắt

Xây dựng bộ benchmark độc lập để đo từng provider/model, chạy 30 mẫu/model trong 3 khung giờ, sau đó sinh báo cáo và cấu hình fallback đề xuất. Benchmark không tự sửa `.env` hoặc production.

Phạm vi ban đầu gồm:

- Gemini: `gemini-3.6-flash`
- NVIDIA NIM: 4 model đang cấu hình
- Groq: 2 model đang cấu hình
- OpenRouter: `openrouter/free`



khái niệm benchmark :  1 cách đo lường so sánh hiệu năng của 1 hệ thống :

 nếu để so sánh giữa các model  : chạy cùng 1 tập câu hỏi, hoặc bài test trên nhiều model/provide :để ghi lại các metrics 

+ tốc độ phản hồi
+ độ chính xác
+ chi phí
+ độ ổn định
+ thời gian xử lí



## Công cụ benchmark

- Thêm CLI `pnpm bench:llm` đọc danh sách provider/model từ `getProviderCascade()`, nhưng tuyệt đối không ghi API key vào log hoặc kết quả.
- Mỗi model có 1 lượt warm-up không tính điểm, sau đó 30 lượt đo: 10 lượt ở mỗi khung giờ.
- Trong mỗi batch 10 lượt/model:
  - 4 prompt stream ngắn để đo overhead và token đầu.--> test tính avg tập vô định
  - 4 prompt chat tiếng Việt đại diện cho NUMELYRA.--> hội thoại đơn giản
  - 2 prompt JSON không-stream đại diện cho query expansion.--> mô phorhg hệ thống thực
- Chạy tuần tự và xáo trộn thứ tự candidate bằng seed để tránh thiên lệch tải hoặc rate limit.
- Ghi từng mẫu dưới dạng JSONL với: provider, model cấu hình, model thực tế do provider trả về, prompt case, thời điểm, HTTP status, TTFB, TTFT nội dung, tổng thời gian, kích thước output, trạng thái `[DONE]`, kiểm tra định dạng và loại lỗi.
- OpenRouter `openrouter/free` được báo cáo ở cấp router alias và phân nhóm theo model thực tế nếu response cung cấp; không coi đây là một model cố định.
- Thêm `pnpm bench:llm:report` để tổng hợp ba batch thành:
  - `summary.json` cho xử lý máy.
  - `report.md` cho người vận hành.
  - `.env.suggested` chỉ chứa thứ tự model và timeout đề xuất, không chứa secret.
- Kết quả runtime nằm trong thư mục benchmark được git-ignore.



## Xếp hạng và chính sách fallback

- Báo cáo luôn hiển thị `avg`, nhưng thứ tự được quyết định theo:

  1. Model đạt ít nhất 29/30 request thành công.
  2. Tất cả mẫu JSON hợp lệ và output stream hoàn tất đúng giao thức.
  3. p95 TTFT không quá SLO mặc định 10 giây. slo service level object : mức độ lvel dịch vụ chấp nhận dc , ở đây ns tới mục tiêu

  ttft time to first token  thời gian gửi request tới lúc  nhận token ddaaud tiên
  p95 -> 95% request

  1. Tỷ lệ thành công cao hơn.
  2. p95 TTFT thấp hơn.
  3. p50 TTFT, rồi thời gian hoàn tất trung bình thấp hơn.
- Nếu không model nào đạt gate, báo cáo phải ghi rõ “chưa có candidate production-ready” thay vì tự chọn model nhanh nhất.
- Sinh hai loại đề xuất:

  - Thứ tự model trong từng provider cho các biến `*_CHAT_MODELS`.
  - Thứ tự provider dựa trên model tốt nhất đã đạt gate của mỗi provider.
- Alias định tuyến không ổn định như `openrouter/free` không được đẩy lên trước một model cố định chỉ nhờ kết quả trung bình tốt.
- Sinh timeout token đầu theo công thức: `p95 TTFT × 1.25`, làm tròn lên giây, tối thiểu 5 giây và tối đa 15 giây.
- --> quy định thời gian phản hồi của 1 mô hình
- Tách timeout nhận HTTP headers khỏi timeout nhận nội dung đầu tiên bằng cấu hình mới `LLM_FIRST_CONTENT_TIMEOUT_MS`; giữ `LLM_STREAM_IDLE_TIMEOUT_MS` cho khoảng ngừng sau khi stream đã bắt đầu.
- Chuẩn hóa xử lý lỗi:

  - `401/403`: thử key kế tiếp của cùng model.
  - `404`, hoặc `400/422` xác định rõ model/feature không hỗ trợ: thử model kế tiếp trong cùng provider.
  - `408/425/429/402`, `5xx`, lỗi mạng, timeout headers hoặc token đầu: bỏ qua phần còn lại của provider trong request hiện tại và sang provider kế tiếp.
  - Các lỗi request `4xx` không thể retry: dừng cascade và trả lỗi rõ ràng.
  - Stream lỗi trước token đầu: được fallback.
  - Stream lỗi sau khi đã gửi nội dung: không nối câu trả lời từ model khác.
- Bổ sung cooldown riêng cho key, model và provider; mặc định giữ 60 giây.

## Kiểm chứng end-to-end

- Sau khi có báo cáo, chạy local app với cấu hình đề xuất qua biến môi trường tạm thời, không ghi đè `.env`.
- Thực hiện 10 request qua `/api/chat`, đo riêng:
  - Thời gian nhận status đầu tiên.
  - Thời gian RAG/search.
  - Thời gian từ phase `generating` tới nội dung đầu.
  - Tổng thời gian người dùng chờ.
- Kết quả end-to-end dùng để xác nhận cấu hình đã chọn, không trộn vào dữ liệu xếp hạng trực tiếp từng model.
- Thêm kiểm thử mô phỏng cho delayed headers, reasoning chunk chưa có content, timeout token đầu, malformed SSE, thiếu `[DONE]`, `401`, `404`, `429`, `503`, đứt stream trước/sau token đầu và toàn bộ provider thất bại.
- Tiêu chí hoàn tất:
  - Đủ 30 mẫu hợp lệ cho mỗi candidate có key.
  - Báo cáo tái lập được từ raw JSONL.
  - Không có secret trong console hoặc artifact.
  - Thứ tự đề xuất và lý do loại/hạ hạng từng model được thể hiện rõ.
  - Cascade chuyển đúng phạm vi key/model/provider trong toàn bộ fault test.

## Giả định

- Chat streaming là workload ưu tiên; JSON không-stream chỉ là gate tương thích và có trọng số phụ.
- Benchmark ban đầu chỉ dùng các model đang cấu hình, không tự quét toàn bộ catalog provider.
- Ba batch được chạy ở ba thời điểm khác nhau theo múi giờ `Asia/Bangkok`.
- Việc áp dụng `.env.suggested` vào production luôn cần người vận hành duyệt.
