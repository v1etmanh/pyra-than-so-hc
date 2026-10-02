// User-authorized, AI-judgement annotations for otherwise unusable states and conflicts.
// reference is k:<keyword index> or m:<exact substring of the meaning>.
// These labels are inferred from context, not claimed as direct source statements.
export const inferences = {
  'major-04:reversed:core:STR': {score:-1,reference:'k:2',rationale:'Chọn thiếu nền nếp thay cho đầu kia của thế lưỡng nan: câu giải thích nhấn lực cản và yêu cầu cân bằng quyền lực; trong core, mất kỷ luật là trạng thái phổ quát hơn việc đoán người đọc đang độc đoán. Mức -1 là suy luận vừa phải.'},
  'major-04:reversed:shadow:STR': {score:2,reference:'m:Kiểm soát quá mức',rationale:'Chọn quá kiểm soát làm bóng tối cụ thể của Hoàng Đế ngược: giữ quyền lực quá chặt biến năng lực lập trật tự thành áp chế. Đây là cách đọc biểu tượng, không phải nguồn xác quyết người rút bài đang độc đoán.'},
  'major-05:reversed:core:STR': {score:-1,reference:'k:0',rationale:'Chọn phá khuôn làm trạng thái chủ đạo của việc tự chọn niềm tin thay vì vâng theo thói quen; -1 chỉ sự nới lỏng khuôn phép, không phải hỗn loạn.'},
  'major-05:reversed:shadow:STR': {score:2,reference:'k:1',rationale:'Giáo điều là bóng tối của cùng trục cấu trúc: biến hệ thống và truyền thống thành quy tắc bất di bất dịch.'},
  'major-10:upright:core:ACT': {score:1,reference:'m:chu kỳ đang chuyển',rationale:'Xem chu kỳ chuyển động là hoạt động vừa phải của tiến trình; cơ hội đang mở chứ chưa chứng minh một hành động quyết liệt của chủ thể.'},
  'major-13:upright:core:ACT': {score:1,reference:'m:cần khép lại để tạo chỗ cho điều mới',rationale:'Xem việc khép chu kỳ và chuyển hóa như bước chuyển có chủ đích ở mức vừa; không đồng nhất nó với một hành động bùng nổ.'},
  'major-14:upright:core:STR': {score:1,reference:'m:sự điều chỉnh từ tốn',rationale:'Một tiến trình được điều chỉnh và kết hợp có trình tự thể hiện cấu trúc vừa phải; câu nguồn đưa đây như giải pháp nên nhãn vẫn là suy luận, chưa chắc là trạng thái người rút bài.'},
  'major-14:upright:core:EMO': {score:1,reference:'k:0',rationale:'Đọc điều hòa và cân bằng như khả năng điều tiết cảm xúc ở mức vừa; đây là cách chiếu trục vào chủ đề lá, vì nguồn không nêu quan hệ cụ thể.'},
  'major-17:upright:core:EMO': {score:1,reference:'m:chữa lành',rationale:'Chữa lành hàm ý phục hồi sự ổn định cảm xúc ở mức vừa, không có căn cứ để nâng lên trạng thái yêu thương hoặc gắn kết sâu.'},
  'major-19:upright:core:ACT': {score:1,reference:'k:2',rationale:'Sinh lực gợi khả năng tham gia hoạt động ở mức vừa; kết quả tích cực phụ thuộc điều kiện xuất hiện chân thật, không chứng minh dứt khoát.'},
  'major-19:upright:core:EMO': {score:1,reference:'k:0',rationale:'Niềm vui là dấu hiệu cảm xúc tích cực vừa phải; không suy thành kết nối sâu khi nguồn không nói về người khác.'},
  'major-19:reversed:core:EMO': {score:-1,reference:'k:0',rationale:'Niềm vui bị trì hoãn làm sắc thái cảm xúc hiện tại kém tích cực; chọn -1 thay vì kết luận chai sạn hoặc cô lập.'},
  'major-19:reversed:shadow:ACT': {score:-1,reference:'k:2',rationale:'Mệt mỏi làm suy giảm khả năng hành động vừa phải. Không nâng thành tê liệt vì nguồn không nói chủ thể hoàn toàn mất khả năng hoạt động.'},
  'major-21:upright:core:STR': {score:1,reference:'k:0',rationale:'Hoàn thành một chu kỳ cho thấy cấu trúc đã được khép lại ở mức vừa; thành tựu không tự chứng minh kỷ luật hoàn hảo.'},
  'wands-06:upright:core:RSK': {score:1,reference:'k:2',rationale:'Tự tin làm tăng mức sẵn sàng tiến ra và đón nhận thử thách ở mức vừa; chiến thắng tự nó chỉ là kết quả.'},
  'wands-06:reversed:core:EMO': {score:-1,reference:'k:1',rationale:'Thiếu công nhận có thể làm suy yếu cảm giác được kết nối/đáp lại ở mức vừa; không mặc định thất bại là cô lập hoàn toàn.'},
  'wands-06:reversed:shadow:EMO': {score:-1,reference:'k:0',rationale:'Kiêu hãnh có thể gây ma sát trong quan hệ. Chọn âm vừa phải vì nguồn không mô tả thao túng hay cô lập.'},
  'wands-10:reversed:core:ACT': {score:-1,reference:'k:0',rationale:'Sụp sức làm giảm khả năng khởi xướng và duy trì hành động; -1 giữ mức vừa vì nguồn còn nêu khả năng buông gánh.'},
  'wands-13:upright:core:RSK': {score:1,reference:'k:0',rationale:'Tự tin và độc lập gợi độ sẵn sàng tự chủ ở mức vừa; nguồn không mô tả hành vi liều lĩnh.'},
  'cups-05:upright:core:EMO': {score:-1,reference:'k:2',rationale:'Buồn đau là trạng thái cảm xúc khó khăn ở mức vừa; điểm này không đồng nghĩa thiếu khả năng yêu thương hoặc gắn bó.'},
  'cups-06:upright:core:EMO': {score:1,reference:'k:2',rationale:'Ký ức/hoài niệm thường giữ kết nối tình cảm với người hoặc thời điểm; chọn +1 thận trọng, không suy ra thấu cảm sâu.'},
  'cups-07:upright:core:INT': {score:1,reference:'k:1',rationale:'Tưởng tượng cho thấy hoạt động nội tâm nhưng không nhất thiết trực giác đúng; chọn +1 vừa, không dùng neo +2.'},
  'cups-09:upright:core:EMO': {score:1,reference:'k:0',rationale:'Mãn nguyện là sắc thái cảm xúc tích cực vừa phải, không khẳng định sự kết nối hoặc lòng vị tha.'},
  'swords-01:upright:core:ACT': {score:1,reference:'k:0',rationale:'Đọc đột phá như khởi động một bước tiến, nhưng giữ ở +1 vì nguồn nêu sáng rõ trí tuệ, chưa nói hành động cụ thể.'},
  'swords-04:reversed:core:ACT': {score:1,reference:'k:0',rationale:'Bồn chồn gợi chuyển động không yên, không chứng minh tiến triển hiệu quả; +1 là suy luận về mức hoạt động.'},
  'swords-04:reversed:shadow:ACT': {score:-1,reference:'k:1',rationale:'Kiệt sức làm suy giảm khả năng duy trì hành động ở mức vừa; nguồn không khẳng định tê liệt tuyệt đối.'},
  'swords-10:upright:core:ACT': {score:-2,reference:'k:2',rationale:'Chạm đáy biểu thị rất ít năng lực khởi động bước tiếp theo trong cách đọc này; -2 là suy luận từ đáy cuộc khủng hoảng, không phải hành động bị cản trực tiếp trong nghĩa lá.'},
  'swords-10:reversed:core:ACT': {score:1,reference:'k:2',rationale:'Bắt đầu phục hồi là sự quay lại hoạt động ở mức vừa; “bắt đầu” không đủ để gán +2.'},
  'pentacles-05:upright:core:EMO': {score:-1,reference:'k:2',rationale:'Bất an phản ánh cảm xúc thiếu an tâm ở mức vừa; điểm không chẩn đoán cô lập hay mất gắn kết.'},
  'pentacles-06:reversed:core:EMO': {score:-1,reference:'k:2',rationale:'Mất quyền trong trao đổi làm quan hệ có thể kém tương hỗ; đây là suy luận vừa phải vì nguồn không gọi tên cảm xúc.'},
  'pentacles-07:reversed:core:ACT': {score:1,reference:'k:0',rationale:'Nóng vội gợi xu hướng lao vào sớm ở mức vừa; nguồn không nói hành động quyết đoán hay thành công.'},
  'pentacles-07:reversed:shadow:STR': {score:-1,reference:'k:2',rationale:'Lãng phí cho thấy việc phân bổ/duy trì nguồn lực kém hiệu quả; -1 là rối cấu trúc vừa phải, không phải hỗn loạn hoàn toàn.'},

  // Resolve all other source conflicts the same way: select the reading best
  // supported by the full card sentence, while retaining inference provenance.
  'major-00:reversed:core:ACT': {score:-1,reference:'m:Sự do dự',rationale:'Câu nghĩa đặt do dự ở đầu tiên và khuyên kiểm tra nền tảng trước khi bước tiếp; chọn trì hoãn vừa làm trạng thái chính, giữ liều lĩnh như khả năng nhưng không chọn vì luật cần một điểm duy nhất.'},
  'major-00:reversed:core:RSK': {score:-1,reference:'k:2',rationale:'Trong hai cực sợ bước đi hoặc liều lĩnh, chọn co cụm vừa vì lời khuyên kiểm tra nền tảng hợp với thận trọng hơn là khuyến khích dấn thân; đây vẫn là phán đoán.'},
  'major-00:reversed:shadow:ACT': {score:-1,reference:'m:Sự do dự',rationale:'Lấy do dự làm rủi ro hành động thấp vừa, không coi cùng lúc cả tê liệt và bốc đồng là một hướng.'},
  'major-00:reversed:shadow:RSK': {score:-1,reference:'k:2',rationale:'Chọn sợ bước đi là xu hướng né rủi ro vừa; giữ liều lĩnh dưới ACT/RSK alternatives của v1 như lịch sử, nhưng v2 chọn một hướng thận trọng.'},
  'major-18:upright:core:INT': {score:1,reference:'k:2',rationale:'Dù mơ hồ và tiềm thức tạo bất định, trực giác là từ khóa đích danh và là chủ đề chính của Mặt Trăng; chọn trực giác vừa thay vì mơ hồ che phủ toàn bộ nội tâm.'},
  'wands-05:reversed:core:EMO': {score:1,reference:'k:1',rationale:'Lấy hòa giải làm hướng cảm xúc chủ đạo sau va chạm; điểm dương vừa thể hiện hướng hàn gắn trong nghĩa ngược, không xóa khả năng dồn nén.'},
  'wands-05:reversed:shadow:EMO': {score:-1,reference:'k:2',rationale:'Chọn dồn nén làm rủi ro cảm xúc của hòa giải bề mặt; chọn âm vừa thay vì suy ra thao túng hoặc chai sạn.'},
  'wands-08:reversed:core:ACT': {score:-1,reference:'k:0',rationale:'Lấy trì hoãn làm trạng thái chính theo nghĩa ngược; vội vàng là cách phản ứng thay thế nhưng nguồn không cho biết nhánh nào đang xảy ra.'},
  'wands-08:reversed:shadow:ACT': {score:2,reference:'k:2',rationale:'Chọn vội vàng làm bóng tối hành động: tốc độ không kiểm soát biến trì hoãn thành cú lao quá nhanh. Đây là cách nối toàn bộ ý nghĩa lá và được đánh dấu suy luận.'}
};
