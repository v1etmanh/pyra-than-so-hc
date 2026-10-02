# Đánh giá bộ nhãn Tarot NUMELYRA

> Báo cáo lịch sử của **v1.0.0 trước khi sửa**. Dữ liệu được đánh giá trong báo cáo này hiện được giữ ở `data/tarot-labels/archive/v1.0.0`. Kết quả mới ở `data/tarot-labels/README.md` và `validation-report.json`; không dùng các số liệu bên dưới để đánh giá v2.0.0.

Ngày đánh giá: 01/10/2026. Phạm vi: 5 tệp nhãn và manifest trong `data/tarot-labels`, đối chiếu với dữ liệu thực được xuất từ `lib/tarot/cards.ts`.

## Kết luận

Bộ nhãn hoàn chỉnh về độ phủ và cấu trúc, nhưng chưa đạt điều kiện của bộ silver đã kiểm chứng và chưa phù hợp làm đáp án chuẩn để đánh giá model hoặc chốt luật tương tác. Có thể giữ làm bản nháp để thử luồng đọc dữ liệu. Vấn đề chính là bằng chứng không truy xuất được và việc chuyển lời khuyên thành năng lượng sẵn có, đặc biệt ở lá ngược.

Không sửa các nhãn hay manifest trong lần đánh giá này. Những kết luận về nghĩa dưới đây là nhận xét của AI dựa trên rubric và nguồn dự án, không phải gold của người hiểu Tarot.

## Kết quả kiểm tra toàn bộ

| Hạng mục | Kết quả |
|---|---:|
| Lá bài duy nhất | 78/78 |
| Trạng thái duy nhất | 156/156; không trùng, không thiếu |
| Ô nhãn core/shadow × 5 trục | 1.560/1.560 |
| Lỗi thang điểm, thiếu trục, kiểu dữ liệu điểm/quote/rationale, confidence ngoài khoảng | 0 |
| Điểm khác 0 | 1.170 |
| Quote không rỗng | 1.280 |
| Quote khớp nguyên văn liên tục với sourceSnippet | 201 |
| Quote không liên tục, nhưng mọi mảnh phân cách bằng dấu phẩy/chấm phẩy đều có trong sourceSnippet | 83 |
| Quote không vượt qua cả hai kiểm tra trên | 996 |
| Điểm khác 0 có quote không vượt qua kiểm tra | 915 |
| Điểm khác 0 nhưng quote rỗng | 1 |
| Tổng điểm khác 0 cần duyệt bằng chứng | 916/1.170 = 78,3% |
| Trạng thái có ít nhất một điểm khác 0 bị gắn cờ bằng chứng | 155/156 |
| Quote không rỗng ở điểm 0 | 111; không tự động coi là lỗi |
| Confidence | 156/156 đều bằng 0,95 |

Phép so khớp chuẩn hóa Unicode NFC, khoảng trắng và chữ hoa/thường, vẫn giữ dấu tiếng Việt. 996 quote không khớp là cờ cần kiểm tra, không phải tỷ lệ nhãn sai hoặc tỷ lệ hallucination đã được chứng minh. Một số là diễn giải hợp lý; một số thêm nội dung không có trong nguồn. Manifest hiện tuyên bố trích chính xác, nên diễn giải phải được lưu ở trường khác thay vì `evidenceQuote`. Quote khớp cũng chưa chứng minh đúng trục, đúng dấu hoặc đúng độ mạnh.

| Tệp | Trạng thái | Điểm khác 0 có quote không khớp | Điểm khác 0 thiếu quote |
|---|---:|---:|---:|
| major-arcana.json | 44 | 181 | 1 |
| wands.json | 28 | 169 | 0 |
| cups.json | 28 | 178 | 0 |
| swords.json | 28 | 194 | 0 |
| pentacles.json | 28 | 193 | 0 |

8 sourceSnippet khác nguồn chỉ do dùng “Vua” thay cho “Nhà Vua”, ở 4 King × 2 trạng thái. Không phát hiện thay đổi từ khóa/ý nghĩa ngoài khác biệt tên đó. 80 trường tên khác nguồn gồm 72 tên tiếng Anh của lá 2–10 (ví dụ “Two of Wands” so với “2 of Wands”) và 8 tên tiếng Việt King. Đây là khác biệt chuẩn hóa tên, không phải 80 nhãn sai; cardId đều khớp.

## Các vấn đề cần xử lý

### 1. Bằng chứng bị sáng tác hoặc mở rộng

- `major-01/upright/shadow.EMO = -1`, quote rỗng (major-arcana.json:70). Vi phạm trực tiếp quy tắc không có bằng chứng thì gán 0.
- `swords-01/upright/core.RSK = +2`, quote “dám đối diện sự thật trần trụi” (swords.json:15). Nguồn chỉ nói “đột phá, sự thật, sáng rõ”; không nói khẩu vị rủi ro hoặc mức dũng cảm cực đại.
- `cups-01/upright/shadow.STR = -1`, quote “thiếu ranh giới”. Nguồn xuôi không nói thiếu ranh giới; đây là giả thuyết về bóng tối được thêm vào.
- `pentacles-04/reversed/core.INT = +2`, quote “thấu hiểu quy luật dòng chảy” (pentacles.json:191). Nguồn nói “tham giữ, sợ mất, cứng nhắc”; phần giải thích đã thêm một bài học tích cực về lưu thông tiền bạc mà nguồn không nêu.

Nguồn Minor Arcana thực tế gồm ba từ khóa và câu mẫu lặp lại các từ khóa. Nó không cung cấp 10 kết luận độc lập cho mỗi trạng thái. Ép điền quá nhiều điểm khác 0 khiến model dùng hiểu biết Tarot ngoài nguồn hoặc tự suy rộng. Có thể bổ sung nguồn mô tả core/shadow phong phú hơn, nhưng phải phiên bản hóa và gán lại từ nguồn đó.

### 2. Trộn trạng thái hiện tại với lời khuyên phát triển

Core được định nghĩa gồm cả “năng lượng tự nhiên”, “bài học tích cực” và “tiềm năng phát triển”, nên hiện có nhiều cách hiểu. Ví dụ Át Cốc ngược có `core.EMO = +1` vì “tự yêu thương bản thân”, dù trạng thái mô tả là nghẽn cảm xúc và thu mình. Lời khuyên chữa lành không chứng minh rằng năng lượng cảm xúc đang dương.

Phân bố đáng kiểm tra:

- `core.INT` xuôi: 74/78 dương, 4 bằng 0, không âm.
- `core.INT` ngược: 78/78 dương; 56 ở +1, 22 ở +2.
- `core.STR` ngược: 72/78 ở +1.

Đây là dấu hiệu rubric/prompt tạo mẫu chung, không tự chứng minh mọi điểm trên đều sai. Nếu core chủ ý là tiềm năng tích cực, cần ghi rõ luật đang so tiềm năng hay trạng thái hiện hữu; không dùng hai nghĩa thay thế cho nhau. Có thể tách riêng trường `growthAdvice` để lời khuyên không làm tăng điểm của trạng thái.

### 3. Dấu điểm chưa nhất quán với vị trí trên trục

- Kẻ Khờ ngược có `shadow.RSK = -2` với rationale “cực đoan giữa sợ hãi co cụm và liều lĩnh mù quáng” (major-arcana.json:47). Sợ hãi và liều lĩnh nằm ở hai đầu khác nhau nếu RSK đo khẩu vị rủi ro. Một số lá khác, như Kỵ Sĩ Kiếm, lại gán liều lĩnh +2.
- Hoàng Đế ngược có `shadow.STR = -2` cho “kiểm soát quá mức hoặc thiếu nền nếp” (major-arcana.json:246), trong khi shadow xuôi có STR +2 cho bảo thủ, quá khuôn mẫu. Một giá trị âm đang gom cả quá nhiều và quá ít cấu trúc.
- Tòa Tháp xuôi có `core.RSK = +2` vì bị đẩy vào biến cố. Mức rủi ro của hoàn cảnh không đồng nghĩa với khẩu vị rủi ro của chủ thể.

Cần quyết định trục đo hướng/cường độ đặc tính hay mức lành mạnh. Nếu đo đặc tính, +2 vẫn có thể là shadow (quá chủ động, quá kiểm soát, quá liều lĩnh); dấu âm không đồng nghĩa “xấu”. Nguồn có hai khả năng đối lập cần được biểu diễn bằng nhánh hoặc cờ mơ hồ, không chọn một cực chỉ vì cả hai đều tiêu cực. Chưa có ví dụ neo rõ cho -1, 0, +1 trong manifest.

### 4. Confidence và trạng thái QA chưa được chứng minh

Median confidence 0,95 là đúng về số học, nhưng vì tất cả bản ghi đều cùng giá trị nên không giúp xếp ưu tiên duyệt hoặc lọc trục yếu. Chưa có confidence theo ô nhãn.

`zeroHallucinationEnforced: true` và `auditPassed: true` trong manifest không được kết quả kiểm tra hiện tại hỗ trợ. Nên dùng trạng thái draft/unvalidated và chỉ đặt pass theo các điều kiện kiểm tra có thể tái chạy.

### 5. Không đủ dữ liệu để tính độ đồng thuận

Trong thư mục đã đọc chỉ có một bộ nhãn cuối cùng. Không có model ID, run ID, prompt/rubric version, nhãn của từng lượt, dấu vết phản biện hoặc nhãn người. Vì thế không thể tính bất đồng ≥2 bậc, median qua lượt, weighted kappa hay Krippendorff's alpha từ bộ này. Phiên bản dataset có ở manifest nhưng chưa có liên kết phiên bản nguồn/rubric cho từng bản ghi.

## Đề xuất bước tiếp theo

1. Giữ bản 1.0.0 như nháp. Chốt core/shadow, hướng điểm của RSK/STR, phân biệt trạng thái với lời khuyên và thêm neo -2/-1/0/+1/+2.
2. Chạy lại pilot đã định: khoảng 20 lá, có cả xuôi/ngược và các trường hợp đối lập như Fool/Emperor. Lưu độc lập từng lượt với model/run/prompt/rubric/source version. Không đưa nhãn bản nháp vào prompt các lượt độc lập.
3. Dùng `evidenceQuotes: string[]` để mỗi phần trích khớp nguồn riêng; diễn giải để ở `rationale`. Validator chặn điểm khác 0 nếu không có trích dẫn. Phần không đủ bằng chứng gán 0 theo quy ước hiện tại, kèm `evidenceStatus: insufficient` để phân biệt thiếu dữ liệu với trung tính thực sự.
4. Duyệt thủ công việc quote có thực sự hỗ trợ trục và độ mạnh. Không sửa tự động 915 điểm về 0 chỉ dựa trên phép không khớp chuỗi: có thể sửa bằng chứng, sửa điểm, hoặc bổ sung nguồn tùy từng trường hợp.
5. Sau khi pilot ổn, gán lại hàng loạt, xử lý bất đồng và thực hiện human gold/frozen test theo kế hoạch. Hiện 155/156 trạng thái bị cờ bằng chứng, nên sửa quy trình rồi chạy lại pilot trước sẽ hiệu quả hơn duyệt tay gần toàn bộ bản nháp.

## Tệp tái kiểm tra

- `scratch/audit-tarot-labels.mjs`: chạy bằng `node --experimental-strip-types scratch/audit-tarot-labels.mjs` tại thư mục gốc dự án.
- `scratch/tarot-label-audit.json`: thống kê, SHA-256 nguồn/dataset và danh sách cờ.
- `scratch/tarot-label-audit-issues.csv`: danh sách cờ mở được bằng Excel. Cột line trỏ tới đầu bản ghi, không nhất thiết dòng của ô nhãn.

Kiểm tra tự động bao phủ toàn bộ dữ liệu; đọc nghĩa tập trung vào các ví dụ và mẫu lệch nêu trên. Chưa xác nhận ngữ nghĩa riêng của tất cả 1.560 ô nhãn, chưa đánh giá Tarot ngoài nguồn dự án, và chưa kiểm thử luật tương tác hoặc đầu ra “VÌ SAO”.
