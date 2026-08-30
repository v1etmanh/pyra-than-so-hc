# Audit ngôn ngữ giao diện

Ngày rà soát: 2026-08-30

## Kết luận nhanh

- Dự án đã dùng `next-intl`, có hai locale `vi` và `en`, mặc định là `vi` trong `src/i18n/routing.ts`.
- Giao diện cũ ở `components/` phần lớn đã lấy chuỗi từ `locales/vi.json` và `locales/en.json`.
- Giao diện Numina/Chani mới đã được rà theo các route đang phục vụ người dùng và mặc định hiển thị tiếng Việt; các nhãn tiếng Anh còn lại là nhánh `/en`, tên thương hiệu/model, hoặc dữ liệu kỹ thuật không hiển thị ở giao diện tiếng Việt.
- Nội dung tiếng Anh trong API, tên biến, khóa dữ liệu, tên model và comment kỹ thuật không phải chuỗi giao diện; không nên dịch các phần này.

## Các vùng cần Việt hóa hoặc đưa vào message key

### Giao diện chính

- `components/sites/chani-com-6d20749d/root-8a5edab2/ChaniHomePage.tsx`
  - Dữ liệu slide đầu trang, thẻ kiến thức, hướng dẫn, bộ đếm thời gian.
  - Nhãn nút, biểu mẫu họ tên/ngày sinh, trạng thái mở bản đồ, modal và newsletter.
  - Một số liên kết nội bộ đang dùng đường dẫn tuyệt đối, cần giữ locale hiện tại.

- `components/sites/chani-com-6d20749d/shared/PyraHeader.tsx`
  - Tên menu, nhãn truy cập tài khoản, các nhãn trợ năng và fallback tài khoản đã được đưa vào namespace `ChaniHeader`.
  - Đã bổ sung bộ chọn ngôn ngữ vào khu vực header và chuẩn hóa đường dẫn theo locale.

- `components/sites/chani-com-6d20749d/shared/ChaniInnerPages.tsx`
  - Footer dùng chung, trang Chat Numina, trang hồ sơ, xưởng hình nền và trang 24 chỉ số.
  - Chat, tài khoản, xưởng hình nền, 24 chỉ số và modal AI đã có nhánh Việt/Anh; cache lời luận giải được tách theo locale để không dùng nhầm bản dịch.

- `components/sites/chani-com-6d20749d/app-f53b52ad/ChaniAppPage.tsx`
  - Bài đánh giá 20 câu, thang đo, kết quả và nhãn 5 nhóm tính cách đã có bản Việt/Anh.

### Thành phần dùng i18n nhưng còn chuỗi viết trực tiếp

- `components/Chat/ProviderSettings.tsx`: các thông báo key/API và trạng thái nhà cung cấp đã dùng message key; tên provider/model vẫn giữ nguyên để khớp cấu hình kỹ thuật.
- `components/Numerology/NumerologySearchQA.tsx`: lỗi, placeholder và nhãn tìm kiếm đang dùng ternary Anh/Việt.
- `components/Survey/PersonalityAssessmentModal.tsx`: nội dung đánh giá đang dùng ternary Anh/Việt thay vì message key.
- `hooks/useAuth.tsx`: còn một số thông báo lỗi kỹ thuật cần đưa vào message key nếu muốn chuẩn hóa tuyệt đối cả khu vực xác thực.

### Dữ liệu song ngữ có chủ đích

- `hooks/useProcessNumerology.tsx`: `name`/`name_en` là dữ liệu chỉ số.
- `lib/lucky-wallpaper/constants.ts` và `lib/lucky-wallpaper/ai-prompt-synthesizer.ts`: các trường `_en` phục vụ prompt và kết quả song ngữ.
- `locales/en.json`: bản dịch tiếng Anh chính thức.
- `locales/vi.json`: một số thuật ngữ kỹ thuật như Provider, Model, Key, BYOK và Personal Day còn giữ tiếng Anh trong ngoặc; có thể Việt hóa tiếp nếu muốn giao diện thuần Việt.

## Quy tắc ngôn ngữ đề xuất

1. Chuỗi người dùng nhìn thấy phải nằm trong locale message hoặc một module copy có locale rõ ràng.
2. Dùng tiếng Việt làm ngôn ngữ mặc định; tiếng Anh chỉ xuất hiện khi URL là `/en/...` hoặc người dùng chọn English.
3. Giữ nguyên tên biến, endpoint, khóa database, enum, tên provider/model và thuật ngữ cần thiết cho cấu hình kỹ thuật.
4. Các câu trả lời AI phải nhận `locale`/`language` từ giao diện để tránh giao diện tiếng Việt nhưng nội dung AI tiếng Anh.
5. Khi thêm locale mới, bổ sung message key trước rồi mới đưa key vào component; không viết thêm text trực tiếp trong JSX.

## Feature chọn ngôn ngữ

`components/LanguageSwitcher.tsx` hiện cung cấp menu chọn `Tiếng Việt`/`Tiếng Anh`. Các route chính và phản hồi AI nhận locale tương ứng. Menu:

- dùng chung cho footer và header;
- giữ nguyên route hiện tại khi đổi locale bằng navigation API của `next-intl` (đặc biệt `/en/indicators` → `/indicators`);
- dùng `/` cho tiếng Việt và `/en/...` cho tiếng Anh theo cấu hình `localePrefix: "as-needed"`;
- hiển thị locale đang chọn và đánh dấu bằng dấu kiểm.
