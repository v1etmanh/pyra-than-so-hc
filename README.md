# NUMINA Numerology

Ứng dụng Next.js cho Thần số học, Tarot và hình nền may mắn AI, hỗ trợ giao diện tiếng Việt và tiếng Anh.

## Kiến trúc nội dung và AI

Luồng Numerology không dùng vector retrieval. Nội dung được lấy bằng khóa chính xác `indicatorKey + numberValue`:

1. Đọc record từ bảng Supabase `numerology_knowledge`.
2. Nếu Supabase lỗi hoặc không có record, đọc nội dung tương ứng trong `knowledge/*.md`.
3. Ghép knowledge với profile, nội dung card và câu hỏi trước khi gọi model cascade.

Các endpoint AI đang hoạt động:

- `/api/tarot/reading`
- `/api/numerology/lazy-indicator`
- `/api/numerology/initial-analysis`
- `/api/numerology/analyze-birthchart`
- `/api/lucky-wallpaper/generate`

Module dùng chung cho provider/model cascade nằm trong `lib/ai`. Các route Q&A legacy không còn được frontend sử dụng đã được loại bỏ.

## Cài đặt

Yêu cầu Node.js 20+ và pnpm.

```bash
pnpm install
pnpm dev
```

Ứng dụng mặc định chạy tại `http://localhost:3200/vi`; đổi locale sang `/en` để kiểm tra bản tiếng Anh.

Sao chép `.env.example` thành `.env.local` rồi điền Supabase, billing và ít nhất một provider AI. Có thể cấu hình nhiều model cho mỗi provider bằng danh sách phân tách bởi dấu phẩy.

Ba timeout của stream được tách riêng:

- `LLM_RESPONSE_HEADER_TIMEOUT_MS`: chờ HTTP response headers.
- `LLM_FIRST_CONTENT_TIMEOUT_MS`: chờ token nội dung đầu tiên; chunk reasoning không gia hạn deadline này.
- `LLM_STREAM_IDLE_TIMEOUT_MS`: chờ chunk kế tiếp sau khi đã có nội dung.

## Kiểm thử

```bash
pnpm test:unit
pnpm typecheck
pnpm lint
pnpm build
```

## Benchmark provider/model fallback

Mỗi khung giờ chạy một batch 10 mẫu/model. Chạy đủ ba batch để có 30 mẫu/model:

```bash
pnpm bench:llm -- --batch morning
pnpm bench:llm -- --batch afternoon
pnpm bench:llm -- --batch evening
pnpm bench:llm:report
```

Mỗi batch gồm 4 stream probe ngắn, 4 prompt Tarot/Numerology và 2 prompt structured JSON. Báo cáo xếp theo reliability, p95 TTFT, p50 TTFT rồi tổng thời gian; kết quả được ghi vào `.benchmarks/llm/`. File `.env.suggested` chỉ là đề xuất để review, không tự sửa production.

Xem trước candidate mà không gọi API:

```bash
pnpm bench:llm -- --batch dry-run --dry-run
```

Sau khi ứng dụng đang chạy, benchmark end-to-end 6 request Tarot và 4 request lazy indicator:

```bash
pnpm bench:llm:e2e -- --app-url http://localhost:3200
```

## Dọn vector schema trên Supabase

Chạy `supabase/preflight_vector_cleanup.sql` để ghi nhận row count, function definition và dependency trước khi sao lưu. Migration `supabase/migrations/20260911_remove_vector_rag.sql` chỉ được chạy sau khi code mới đã deploy, smoke test thành công và đã sao lưu schema/dữ liệu. Migration xóa RPC/bảng vector cũ, nhưng chỉ xóa extension `vector` khi không còn dependency khác. Bảng `numerology_knowledge` được giữ nguyên.

## Phạm vi kho tri thức

Các file `knowledge/*.md` là fallback nội dung có chủ đích và không bị xóa. Chúng không phải vector store. Những script Daily Decision còn lại là công cụ nội dung độc lập, không tham gia runtime Numerology hiện tại.

## Miễn trừ trách nhiệm

Nội dung Thần số học và Tarot mang tính tham khảo, chiêm nghiệm và giải trí. Không dùng kết quả của ứng dụng thay cho tư vấn y tế, pháp lý, tài chính hoặc quyết định chuyên môn.
