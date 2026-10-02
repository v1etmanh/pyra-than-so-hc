# Tarot labels 3.0.0

Bộ 156 trạng thái đã được AI gán lại theo `rubric.json` phiên bản 3.0.0. Bản 1.0.0 và 2.0.0 được giữ riêng để đối chiếu. Theo yêu cầu của người dùng, 24 trạng thái trước đó không có trục dùng được nay được điền bằng phán đoán AI có gắn nhãn suy luận. Các hướng xung đột khác cũng được giải quyết và đánh dấu tương tự.

## Những thay đổi về nghĩa

- Core là năng lượng **được mô tả**, có thể âm hoặc dương; không còn mặc định là bài học tích cực. Lời khuyên chữa lành không trở thành năng lượng đã hiện diện.
- Shadow chỉ chứa thách thức được nguồn **cùng trạng thái** nêu trực tiếp. Không tự tạo bóng tối của lá xuôi và không mượn trích dẫn từ lá ngược.
- STR/RSK đo hướng đặc tính. Quá kiểm soát và liều lĩnh có thể mang điểm dương trong shadow; âm không có nghĩa là xấu.
- Nguồn có nhiều hướng đối lập nhưng người dùng cho phép phán đoán thì chọn cách đọc tổng thể phù hợp hơn, đánh dấu `evidenceStatus=inferred`, ghi quote và lý do. Đây là suy luận AI, không phải phát biểu trực tiếp của nguồn.
- `eligibleForRelations=true` với nhãn inferred: có thể dùng trong luật theo chỉ thị người dùng. Giữ cờ suy luận trong mọi báo cáo và câu trả lời giải thích nhãn. Nhãn `supported` nghĩa là nội dung trực tiếp hỗ trợ trục; `inferred` chỉ có trích dẫn làm điểm tựa.
- Không đủ căn cứ thì `score=0`, `evidenceStatus=insufficient`. Đây là **bỏ qua do thiếu dữ liệu**, không phải quan hệ trung tính đã được xác nhận.
- `overallConfidence` và confidence từng ô là `null`: chưa có hiệu chuẩn. `evidenceCoverage` là tỷ lệ ô có bằng chứng, không phải độ chính xác hoặc xác suất nhãn đúng.

## Dùng dữ liệu

Ô có bằng chứng trực tiếp hoặc phán đoán đã được chủ đích cho phép mới dùng được trong luật:

```js
['supported', 'inferred'].includes(cell.evidenceStatus) &&
cell.eligibleForRelations === true &&
cell.score !== 0
```

Mỗi `evidenceQuotes` chứa phần trích nguyên văn, `sourceField` và khoảng `[start, end)` theo chỉ số chuỗi JavaScript (UTF-16). Ô inferred thêm `inferenceMethod` và `rationale` có mở đầu cảnh báo phán đoán. Quote là căn cứ diễn giải; tự nó không chứng minh điểm. Nguồn không đưa đủ thông tin cho từng trục vẫn được đánh dấu thiếu bằng chứng.

Nếu không còn trục dùng được trong phép so sánh, trả trạng thái **insufficient evidence** ở tầng ứng dụng. Không mặc định gọi là neutral, resonance, balance hay warning. Hiện chưa có mã ứng dụng nào đọc bộ nhãn này; README quy định cách tích hợp sau này, không tuyên bố đã triển khai luật.

## Kết quả kiểm tra bản này

- Đủ 78 lá, 156 trạng thái, 1.560 ô; không trùng, không thiếu.
- 327 ô khác 0: 286 nhãn supported và 41 nhãn inferred; cả hai nhóm có quote đúng trường nguồn và đúng chiều bài.
- 1.230 ô còn thiếu bằng chứng; không có trạng thái nào còn thiếu tất cả trục dùng được; không còn trục mơ hồ chưa giải quyết.
- 24/24 trạng thái trước đó không dùng được đã có ít nhất một phán đoán inferred bật cho luật. `review-queue.json` liệt kê những ô phán đoán để người duyệt có thể xem lại.
- `core.INT` dương ở 4/78 trạng thái ngược, thay cho 78/78 trước đây.
- Metadata tên bài và sourceSnippet khớp nguồn hiện tại. Các bản ghi có version, source/rubric hash và provenance cho lượt gán lại.

Nguồn Minor Arcana chỉ có ba từ khóa và câu mẫu, nên 1.230 ô không đủ căn cứ trực tiếp. 41 ô suy luận được bật theo yêu cầu của người dùng, giữ rõ nguồn gốc và lý do. Mức áp dụng cho luật là quyết định có chủ đích của người dùng; các phán đoán vẫn cần xác nhận gold trước khi dùng để chấm chất lượng model.

## Các tệp

- 5 tệp theo bộ bài: dữ liệu hiện tại.
- `rubric.json`: định nghĩa/neo năm trục và core/shadow.
- `label-schema.json`: JSON Schema cho từng bản ghi.
- `manifest.json`: phiên bản, thống kê và giới hạn xác nhận.
- `validation-report.json`: kiểm tra toàn bộ nguồn, schema, hash, thống kê, điều kiện dùng trong luật và review queue.
- `reannotation-report.json`: so sánh điểm/bằng chứng/rationale của cả 1.560 ô cũ và mới.
- `human-review-template-3.0.0.json`: phiếu duyệt chưa điền, gồm 50 trạng thái chọn phân tầng ngẫu nhiên và các trường hợp bị cờ bổ sung. Không chứa nhãn AI để người duyệt gán độc lập. Đây chưa phải gold.
- `archive/v1.0.0` và `archive/v2.0.0`: dữ liệu trước đó, giữ nguyên.

## Chạy lại

Tại gốc dự án:

```sh
npm run labels:tarot:validate
npm run test:tarot-labels
```

Nguồn, rubric, bảng quyết định hoặc bảng suy luận thay đổi sẽ làm kiểm tra hash thất bại. Sửa `decisions.mjs` cho nhãn trực tiếp và `inferences.mjs` cho phán đoán rồi chạy `npm run labels:tarot:rebuild`. Tạo schema bằng `node --experimental-strip-types scripts/tarot-labeling/write-schema.mjs` và báo cáo bằng `node --experimental-strip-types scripts/tarot-labeling/report.mjs`. Không ghi đè phiếu duyệt đã đóng băng hoặc đã có người điền.

## Mức xác nhận

Đây là **silver gồm nhãn nguồn hỗ trợ trực tiếp và phán đoán AI được ghi nhãn riêng**, do một lượt AI thực hiện. Validator chứng minh cấu trúc và vị trí trích dẫn; các test kiểm tra lỗi thường gặp. Chúng không chứng minh mọi lựa chọn ngữ nghĩa là đúng.

Chưa có human gold, các lượt độc lập từ nhiều mô hình hoặc weighted kappa/alpha. Vì vậy `auditPassed=false`, confidence chưa xác định và không tuyên bố zero hallucination hay nhãn gold. 41 điểm inferred có thể dùng theo yêu cầu hiện tại nhưng cần được xem xét trong đánh giá cuối.
