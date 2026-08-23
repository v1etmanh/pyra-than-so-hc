# -*- coding: utf-8 -*-
import os

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
os.makedirs(knowledge_dir, exist_ok=True)

pd_docs = [
    {
        "num": "1",
        "title_num": "1",
        "name": "Ngày Cá Nhân Số 1 - Năng Động, Quyết Đoán & Bắt Đầu Việc Mới",
        "content": {
            "mood": "Trong 24 giờ của Ngày Cá Nhân Số 1 (Personal Day 1 = Tháng cá nhân + Ngày dương lịch), tâm trạng của bạn tràn ngập sự tự tin, hứng khởi và nguồn sinh lực dồi dào. Bạn có thôi thúc muốn đứng lên dẫn dắt, tự mình ra quyết định và không muốn bị phụ thuộc vào bất kỳ ai. Đây là ngày của hành động tiên phong.",
            "activities": "- **Khởi động một nhiệm vụ mới:** Bắt tay vào một dự án, thói quen hoặc kế hoạch bạn đã ấp ủ.\n- **Gửi đề xuất/Email quan trọng:** Chủ động liên hệ đối tác hoặc trình bày ý tưởng mới với cấp trên.\n- **Tự đưa ra quyết định dứt khoát:** Giải quyết những việc còn do dự mà không cần chờ người khác.\n- **Tập thể dục cường độ cao:** Chạy bộ hoặc tập gym để giải phóng năng lượng thể chất mạnh mẽ.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Nóng nảy gắt gỏng khi người khác làm việc chậm chạp; tranh cãi hơn thua để chứng tỏ cái tôi; hoặc hành động bốc đồng mà thiếu sự quan sát xung quanh.",
            "qa_q": "Tôi nên làm gì vào Ngày Cá Nhân Số 1 để mở màn một ngày làm việc hiệu quả nhất?",
            "qa_a": "Hãy thức dậy sớm, viết ra 3 việc quan trọng nhất cần hoàn thành và chủ động giải quyết ngay việc khó nhất đầu tiên vào buổi sáng. Tinh thần tiên phong của Ngày 1 sẽ giúp bạn giải quyết công việc nhanh chóng."
        }
    },
    {
        "num": "2",
        "title_num": "2",
        "name": "Ngày Cá Nhân Số 2 - Nhẹ Nhàng, Lắng Nghe, Hòa Giải & Hợp Tác",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 2 mang tính lắng đọng, êm dịu, nhạy cảm và giàu tình cảm. Bạn muốn tìm kiếm sự bình yên, thích làm việc cùng người khác và nhạy bén cảm nhận được tâm tư, cảm xúc của những người xung quanh.",
            "activities": "- **Hẹn hò lãng mạn hoặc ăn trưa cùng cộng sự:** Tăng cường sự gắn kết tình cảm và trao đổi chân tình.\n- **Lắng nghe và hòa giải hiểu lầm:** Giải quyết mâu thuẫn bằng sự nhẹ nhàng, tinh tế và thấu cảm.\n- **Làm việc nhóm và hỗ trợ đồng nghiệp:** Đóng góp vào thành công chung của tập thể.\n- **Chăm sóc sức khỏe tinh thần:** Thưởng thức trà chiều, nghe nhạc nhẹ nhàng để thư giãn tâm trí.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Tự ái, suy diễn quá mức trước lời nói vô tình của người khác; e ngại không dám bày tỏ quan điểm dẫn đến ức chế ngấm ngầm; hoặc ôm đồm cảm xúc tiêu cực của người khác.",
            "qa_q": "Tại sao trong Ngày Cá Nhân Số 2 tôi lại cảm thấy nhạy cảm và dễ xúc động hơn bình thường?",
            "qa_a": "Bởi vì tần số rung động của Ngày 2 kích hoạt trực giác và luân xa tim của bạn. Hãy đón nhận sự nhạy cảm này như một món quà để thấu hiểu người khác, nhưng giữ tâm thế bình thản trước các biến động bên ngoài."
        }
    },
    {
        "num": "3",
        "title_num": "3",
        "name": "Ngày Cá Nhân Số 3 - Vui Tươi, Hoạt Ngôn, Sáng Tạo & Giao Lưu",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 3 ngập tràn sự vui tươi, lạc quan, hài hước và phóng khoáng. Bạn cảm thấy tràn đầy ý tưởng sáng tạo, muốn nói chuyện, chia sẻ và kết nối với mọi người xung quanh bằng nguồn năng lượng tích cực.",
            "activities": "- **Thuyết trình, bán hàng hoặc đàm phán trực tiếp:** Tận dụng sự hoạt ngôn và duyên dáng tự nhiên.\n- **Sáng tạo nội dung và viết lách:** Đăng bài chia sẻ, viết blog, làm video truyền thông.\n- **Gặp gỡ bạn bè, mở rộng giao lưu:** Tham gia các buổi tiệc, sự kiện giao lưu vui vẻ.\n- **Tham gia các hoạt động nghệ thuật:** Nghe nhạc sôi động, vẽ tranh hoặc đi xem kịch, xem phim hài.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Nói quá nhiều lấn át người khác; sa đà vào buôn chuyện thị phi; chi tiêu mua sắm bốc đồng vào những món đồ không thực sự cần thiết; hoặc phân tán năng lượng làm việc nửa vời.",
            "qa_q": "Ngày Cá Nhân Số 3 có phải là ngày lý tưởng nhất để thuyết trình ý tưởng hoặc đăng bài truyền thông?",
            "qa_a": "Chính xác. Năng lượng biểu đạt và sự lôi cuốn của Ngày 3 sẽ giúp thông điệp của bạn dễ dàng chạm tới cảm xúc người nghe và nhận được sự đón nhận nồng nhiệt nhất."
        }
    },
    {
        "num": "4",
        "title_num": "4",
        "name": "Ngày Cá Nhân Số 4 - Kỷ Luật, Trật Tự, Tập Trung & Hoàn Thiện Chi Tiết",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 4 chuyển sang trạng thái nghiêm túc, thực tế, tập trung cao độ và có xu hướng cầu toàn. Bạn muốn thấy mọi thứ ngăn nắp, có trật tự và muốn tập trung giải quyết dứt điểm các công việc chi tiết.",
            "activities": "- **Lập kế hoạch và rà soát sổ sách:** Kiểm tra thu chi, đối chiếu số liệu tài chính và lên lịch trình.\n- **Dọn dẹp bàn làm việc và nhà cửa:** Sắp xếp lại đồ đạc, lau chùi không gian sống ngăn nắp.\n- **Hoàn thiện các chi tiết kỹ thuật/pháp lý:** Đọc kỹ hợp đồng, sửa lỗi tài liệu và chuẩn hóa quy trình.\n- **Chăm sóc cơ thể:** Ăn uống đúng giờ, uống đủ nước và ngủ đủ giấc.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Cứng nhắc bắt bẻ lỗi nhỏ của người khác; cằn nhằn về sự bừa bãi xung quanh; quá khắt khe với bản thân dẫn đến căng thẳng, đau nửa đầu.",
            "qa_q": "Làm sao để giải tỏa áp lực khi có quá nhiều việc chi tiết dồn dập trong Ngày Cá Nhân Số 4?",
            "qa_a": "Hãy lập danh sách việc cần làm (To-do list) và đánh dấu hoàn thành từng việc một. Tập trung làm xong từng việc thay vì ôm đồm nhiều việc cùng lúc sẽ giúp bạn cảm thấy thỏa mãn và nhẹ nhõm."
        }
    },
    {
        "num": "5",
        "title_num": "5",
        "name": "Ngày Cá Nhân Số 5 - Tự Do, Đổi Mới, Linh Hoạt & Nắm Bắt Bất Ngờ",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 5 rất hào hứng, thích phiêu lưu, tò mò và ghét sự gò bó đơn điệu. Bạn cảm thấy bồn chồn nếu phải ngồi yên một chỗ và luôn sẵn sàng đón nhận những điều mới lạ, bất ngờ diễn ra trong ngày.",
            "activities": "- **Thay đổi không khí làm việc:** Ra quán cafe làm việc, đổi cung đường đi làm hoặc thử một món ăn mới lạ.\n- **Đi công tác, dạo phố hoặc gặp gỡ đối tác mới:** Mở rộng tầm nhìn và đón nhận các cơ hội mới.\n- **Xử lý linh hoạt các tình huống phát sinh:** Ứng biến nhanh nhạy trước các thay đổi lịch trình đột xuất.\n- **Tìm hiểu công nghệ hoặc xu hướng mới:** Nâng cấp kiến thức về những điều mới nổi.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Bốc đồng hủy bỏ hẹn quan trọng vì cảm xúc nhất thời; vội vã đưa ra quyết định khi chưa cân nhắc kỹ; lái xe phóng nhanh vượt ẩu do tâm lý vội vàng.",
            "qa_q": "Tôi nên ứng biến như thế nào nếu lịch trình bị xáo trộn bất ngờ trong Ngày Cá Nhân Số 5?",
            "qa_a": "Hãy mỉm cười và đón nhận sự thay đổi như một gia vị thú vị của cuộc sống. Hãy linh hoạt điều chỉnh kế hoạch thay vì bực dọc; sự việc bất ngờ thường mang đến những cơ hội tốt không ngờ."
        }
    },
    {
        "num": "6",
        "title_num": "6",
        "name": "Ngày Cá Nhân Số 6 - Tổ Ấm, Yêu Thương, Chu Đáo & Vun Vén Hạnh Phúc",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 6 ngập tràn sự ấm áp, chu đáo, tinh thần trách nhiệm và lòng trắc ẩn. Tâm trí bạn hướng về gia đình, người thương, bạn bè thân thiết và mong muốn mang lại niềm vui, sự an lành cho những người xung quanh.",
            "activities": "- **Nấu bữa tối sum họp gia đình:** Tự tay chuẩn bị một bữa ăn ngon và ấm cúng cho người thân yêu.\n- **Mua sắm quà tặng hoặc đồ trang trí nhà cửa:** Mua hoa tươi, nến thơm hoặc quà nhỏ thể hiện sự quan tâm.\n- **Thăm hỏi cha mẹ, bạn bè hoặc người ốm:** Trao gửi những lời động viên và sự chăm sóc ân cần.\n- **Làm một việc tử tế:** Giúp đỡ một người gặp khó khăn trên đường hoặc đóng góp từ thiện nhỏ.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Bao đồng can thiệp vào chuyện riêng của người khác; cằn nhằn áp đặt ý muốn của mình lên người thân; hy sinh quá mức dẫn đến tủi thân, trách móc.",
            "qa_q": "Tôi nên làm gì để tạo nên một buổi tối ấm áp, ý nghĩa nhất trong Ngày Cá Nhân Số 6?",
            "qa_a": "Hãy tạm gác công việc lại sau giờ tan sở, trở về nhà với nụ cười tươi, cùng người thân chuẩn bị bữa tối và lắng nghe họ chia sẻ về một ngày của mình với sự hiện diện trọn vẹn 100%."
        }
    },
    {
        "num": "7",
        "title_num": "7",
        "name": "Ngày Cá Nhân Số 7 - Tĩnh Lặng, Chiêm Nghiệm, Tự Học & Nạp Năng Lượng Tâm Thức",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 7 có xu hướng lắng sâu, trầm mặc, hướng nội và thích sự yên tĩnh. Bạn cảm thấy mệt mỏi với những nơi ồn ào, xô bồ và có nhu cầu mạnh mẽ được ở một mình để suy ngẫm, đọc sách và phục hồi năng lượng.",
            "activities": "- **Đọc sách chuyên môn hoặc triết học:** Nạp thêm tri thức tinh hoa trong không gian yên tĩnh.\n- **Thiền định, tĩnh tâm hoặc đi dạo công viên:** Hít thở sâu, hòa mình vào thiên nhiên để thanh lọc tâm trí.\n- **Viết nhật ký và chiêm nghiệm:** Đúc kết những bài học cuộc sống và lắng nghe trực giác mách bảo.\n- **Tránh các quyết định tài chính mạo hiểm:** Giữ an toàn nguồn vốn trong ngày hôm nay.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Tranh luận triết lý thắng thua vô ích; suy nghĩ quá nhiều dẫn đến hoài nghi tiêu cực; gượng ép bản thân tham gia các cuộc vui ồn ào khiến bản thân kiệt sức.",
            "qa_q": "Tại sao tôi lại cảm thấy muốn tắt điện thoại và ở một mình trong Ngày Cá Nhân Số 7?",
            "qa_a": "Đó là tiếng gọi tự nhiên của tâm hồn khi cần nghỉ ngơi và nạp lại năng lượng tâm thức. Hãy cho phép mình có những khoảng lặng quý giá này để lắng nghe trực giác và tái tạo trí tuệ."
        }
    },
    {
        "num": "8",
        "title_num": "8",
        "name": "Ngày Cá Nhân Số 8 - Quyết Đoán, Tài Chính, Quyền Lực & Chốt Thương Vụ",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 8 cực kỳ mạnh mẽ, sắc bén, thực tế và hướng thẳng tới kết quả tài chính, công việc. Bạn cảm thấy tự tin, có uy quyền lãnh đạo và muốn xử lý những việc lớn có giá trị kinh tế cao.",
            "activities": "- **Đàm phán thương mại và chốt đơn hàng lớn:** Tận dụng sự quyết đoán và nhạy bén để ký kết hợp đồng.\n- **Xử lý các giao dịch tài chính quan trọng:** Thanh toán, chuyển tiền đầu tư hoặc thu hồi các khoản nợ.\n- **Họp điều hành và giao việc cho đội ngũ:** Khẳng định vai trò lãnh đạo và đôn đốc tiến độ dứt khoát.\n- **Mặc trang phục lịch lãm, sang trọng:** Củng cố phong thái chuyên nghiệp và uy tín cá nhân.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Hách dịch, áp đặt thô bạo lên người khác; nổi nóng khi cấp dưới làm việc chậm trễ; tham lam tính toán chi li làm mất lòng cộng sự.",
            "qa_q": "Ngày Cá Nhân Số 8 có phải là ngày tốt nhất để thương lượng giá cả hoặc ký kết hợp đồng kinh tế?",
            "qa_a": "Chính xác. Năng lượng thực tế và quyền uy của Ngày 8 sẽ hỗ trợ bạn làm chủ cuộc đàm phán, bảo vệ quyền lợi chính đáng và đạt được những thỏa thuận tài chính có lợi nhất."
        }
    },
    {
        "num": "9",
        "title_num": "9",
        "name": "Ngày Cá Nhân Số 9 - Buông Xả, Hoàn Tất, Tha Thứ & Dọn Dẹp Đón Mới",
        "content": {
            "mood": "Tâm trạng trong 24 giờ của Ngày Cá Nhân Số 9 mang sự nhẹ nhõm, bao dung, hướng thiện và muốn kết thúc trọn vẹn những việc cũ. Bạn cảm thấy sẵn sàng buông bỏ những điều không còn phù hợp để giải phóng không gian cho những điều mới mẻ sắp tới.",
            "activities": "- **Hoàn thành nốt các công việc còn dang dở:** Đóng gói tài liệu, gửi báo cáo tổng kết và trả nợ.\n- **Dọn dẹp bàn làm việc và thanh lý đồ cũ:** Vứt bỏ rác, xóa tệp tin thừa trên máy tính để làm sạch năng lượng.\n- **Thực hành tha thứ và buông xả:** Bỏ qua những bực bội cũ, gửi lời chúc bình an đến người khác.\n- **Làm một việc thiện nguyện nhỏ:** Ủng hộ tiền lẻ, nhường đường hoặc giúp đỡ người yếu thế.",
            "conflicts": "Những mâu thuẫn vụn vặt cần tránh: Bắt đầu một dự án lớn mới toanh ngay trong hôm nay (hãy để sang Ngày 1); ôm giữ sự ấm ức trong lòng; níu kéo những mối quan hệ không còn lành mạnh.",
            "qa_q": "Tôi nên kết thúc Ngày Cá Nhân Số 9 như thế nào để tâm trí được thư thái nhất?",
            "qa_a": "Hãy tắm nước ấm thư giãn, dọn sạch bàn làm việc trước khi đi ngủ, viết ra những điều bạn biết ơn trong ngày và đi ngủ với tâm thế thanh thản để sẵn sàng đón nhận bình minh tràn đầy sinh lực của Ngày Cá Nhân Số 1."
        }
    }
]

all_pd_markdown = "# TỔNG HỢP 9 NGÀY CÁ NHÂN (PERSONAL DAYS 1 - 9) - THẦN SỐ HỌC PYTHAGORAS\n\n"

for doc in pd_docs:
    num_val = doc["num"]
    c = doc["content"]
    
    md = f"""---
id: "numerology-personalday-{num_val}"
category: "personal_day"
indicator_name: "Ngày cá nhân"
indicator_key: "dayIndividual"
number_value: "{num_val}"
keywords: ["ngày cá nhân {num_val}", "personal day {num_val}", "năng lượng ngày {num_val}", "dự báo ngày {num_val}"]
title: "Năng Lượng Vi Mô Của Ngày Cá Nhân Số {num_val}"
---

# Năng Lượng Vi Mô Của Ngày Cá Nhân Số {num_val}

## Tâm Trạng Và Năng Lượng Chủ Đạo Trong 24 Giờ Của Ngày Số {num_val}
{c['mood']}

## Hoạt Động Lý Tưởng Nên Làm Trong Ngày (Gặp đối tác, ký hợp đồng, dọn dẹp, thiền định...)
{c['activities']}

## Những Mâu Thuẫn Vụn Vặt Cần Tránh Để Không Tiêu Hao Sinh Khí
{c['conflicts']}

## Các Câu Hỏi Tra Cứu Thường Gặp (Semantic Q&A)
- **Q: {c['qa_q']}**
  - **A:** {c['qa_a']}
"""
    
    filename = f"personal_day_{num_val}.md"
    filepath = os.path.join(knowledge_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md.strip() + "\n")
    print(f"Successfully generated: {filename}")
    all_pd_markdown += md.strip() + "\n\n---\n\n"

all_filepath = os.path.join(knowledge_dir, "personal_day_all.md")
with open(all_filepath, "w", encoding="utf-8") as f:
    f.write(all_pd_markdown.strip() + "\n")
print("Successfully generated: personal_day_all.md")
print("DONE: All 9 Personal Day Markdown files generated successfully!")
