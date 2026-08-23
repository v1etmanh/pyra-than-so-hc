# -*- coding: utf-8 -*-
import os

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
os.makedirs(knowledge_dir, exist_ok=True)

maturity_docs = [
    {
        "num": "1",
        "title_num": "1",
        "name": "Số 1 - Hội Tụ Khí Chất Lãnh Đạo Độc Lập & Tự Chủ Đỉnh Cao",
        "content": {
            "awakening": "Sau tuổi 35, người mang Con số Trưởng thành 1 (Maturity 1 - tính từ tổng rút gọn của Số Đường Đời + Số Sứ Mệnh) bước vào giai đoạn thức tỉnh bản ngã mạnh mẽ nhất. Bạn thôi không còn tìm kiếm sự chấp thuận bên ngoài hay sống theo kỳ vọng của người khác. Ý chí tự lập kiên cường, bản lĩnh độc lập và khát vọng tiên phong trỗi dậy, thôi thúc bạn đứng lên làm chủ hoàn toàn vận mệnh, tự tạo ra con đường sự nghiệp riêng biệt và dẫn dắt người khác bằng chính tấm gương tự cường của mình.",
            "impact": "Ở nửa sau cuộc đời, mục tiêu của bạn là trở thành người đứng đầu tổ chức/doanh nghiệp tự lập, nhà sáng lập tiên phong, chuyên gia cố vấn chiến lược độc lập hoặc người truyền cảm hứng về tinh thần tự chủ cho thế hệ kế cận. Bạn để lại tầm ảnh hưởng xã hội thông qua sự can trường, khả năng ra quyết định chuẩn xác và tinh thần dám chịu trách nhiệm tối cao.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Cảm giác cô đơn trên đỉnh cao, khó chia sẻ gánh nặng với người khác hoặc lo sợ bị mất vị thế lãnh đạo. Chiến lược vượt qua: Chuyển hóa từ 'Lãnh đạo bằng quyền lực cái tôi' sang 'Lãnh đạo bằng sự trao quyền', học cách tin tưởng đồng đội và nuôi dưỡng thế hệ kế cận để cùng chung tay gánh vác.",
            "qa_q": "Tại sao bước vào tuổi 35 - 40, tôi lại có thôi thúc mãnh liệt muốn từ bỏ công việc ổn định để tự mình khởi nghiệp hoặc làm điều độc lập?",
            "qa_a": "Bởi vì năng lượng của Con số Trưởng thành 1 bắt đầu hội tụ và kích hoạt. Nửa đầu cuộc đời là giai đoạn học việc và tích lũy; nửa sau cuộc đời là thời điểm bản ngã lãnh đạo của bạn đòi hỏi phải có không gian tự chủ để tỏa sáng. Hãy dũng cảm bước ra làm chủ sự nghiệp của mình trên nền tảng kinh nghiệm đã tích lũy.",
            "advice": "1. **Rèn luyện tính tự chịu trách nhiệm tuyệt đối:** Tập thói quen tự quyết định và chịu trách nhiệm 100% về tài chính và sự nghiệp cá nhân.\n2. **Nâng cao năng lực tư duy chiến lược:** Đọc sách và tham gia các khóa học quản trị lãnh đạo cấp cao.\n3. **Học cách lắng nghe và trao quyền:** Tin tưởng và tạo cơ hội cho cấp dưới hoặc cộng sự phát triển sự độc lập của họ."
        }
    },
    {
        "num": "2",
        "title_num": "2",
        "name": "Số 2 - Hội Tụ Năng Lực Hòa Giải, Trực Giác Sâu Sắc & Trí Tuệ Thấu Cảm",
        "content": {
            "awakening": "Bước qua tuổi 35, người mang Con số Trưởng thành 2 trải qua sự chuyển hóa nội tâm sâu sắc: bạn nhận ra giá trị vô giá của sự bình yên tâm hồn, sự hòa hợp trong các mối quan hệ và sức mạnh của lòng trắc ẩn. Bạn không còn hứng thú với những cuộc tranh đua quyền lực bề nổi mà hướng tới việc hàn gắn các rạn nứt, nuôi dưỡng tình yêu thương và kiến tạo môi trường sống an lành.",
            "impact": "Ở nửa sau đời người, mục tiêu cuộc sống của bạn là trở thành sứ giả hòa bình, chuyên gia hòa giải đàm phán, cố vấn tâm lý trị liệu, người kết nối cộng đồng hoặc hậu phương tinh thần vững chắc cho gia đình và tổ chức. Tầm ảnh hưởng của bạn lan tỏa nhẹ nhàng nhưng sâu lắng thông qua sự thấu cảm và năng lượng an lành.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Cảm giác trống rỗng khi con cái lớn rời xa vòng tay (hội chứng tổ chim trống), lo sợ bị cô đơn, bỏ rơi hoặc rơi vào trạng thái nhạy cảm thái quá trước sự vô tâm của người khác. Chiến lược vượt qua: Tự lấp đầy bình chứa cảm xúc bằng tình yêu tự thân, tham gia các hoạt động xã hội thiện nguyện và nuôi dưỡng đời sống tâm linh.",
            "qa_q": "Làm thế nào để người có Số Trưởng thành 2 phát huy quyền năng của sự thấu cảm trong giai đoạn trung niên?",
            "qa_a": "Hãy sử dụng trực giác và sự nhạy cảm của bạn như một công cụ lắng nghe, thấu suốt để giúp đỡ người khác giải tỏa bế tắc tinh thần. Hãy trở thành người lắng nghe không phán xét, dùng sự dịu dàng và lòng bao dung để kết nối mọi người lại với nhau.",
            "advice": "1. **Thiết lập ranh giới cảm xúc lành mạnh:** Học cách yêu thương và giúp đỡ người khác mà không để bản thân bị tổn thương hay lợi dụng.\n2. **Rèn luyện khả năng lắng nghe thấu cảm:** Dành sự hiện diện trọn vẹn khi trò chuyện với bạn đời, con cái và đồng nghiệp.\n3. **Thực hành nuôi dưỡng tâm an:** Dành 15 phút mỗi ngày thiền định, nghe nhạc êm dịu hoặc hòa mình vào thiên nhiên."
        }
    },
    {
        "num": "3",
        "title_num": "3",
        "name": "Số 3 - Hội Tụ Sức Sáng Tạo Đỉnh Cao, Ngôn Từ Khai Sáng & Niềm Vui Sống",
        "content": {
            "awakening": "Sau tuổi 35, tài năng sáng tạo, khiếu hài hước và năng lực ngôn từ của người mang Con số Trưởng thành 3 đạt đến độ chín muồi rực rỡ nhất. Bạn thấu hiểu sâu sắc rằng sự lạc quan, tiếng cười và niềm vui sống đích thực chính là liều thuốc chữa lành tuyệt vời nhất cho nhân loại. Bạn thôi thúc muốn cất lên tiếng nói khai phóng, truyền cảm hứng và nâng đỡ tinh thần cho mọi người.",
            "impact": "Ở nửa sau cuộc đời, mục tiêu của bạn là sáng tác nghệ thuật, viết sách, giảng dạy, diễn thuyết truyền cảm hứng, làm truyền thông nhân văn hoặc xây dựng các sản phẩm mang lại niềm vui và giá trị tinh thần cho cộng đồng. Bạn để lại di sản bằng sự hân hoan, các tác phẩm sáng tạo và ngọn lửa lạc quan lan tỏa bất tận.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Nỗi sợ tuổi già, sợ mất đi sức hút cá nhân hoặc rơi vào cảm giác hối tiếc vì đã lãng phí năng lượng tuổi trẻ vào những cuộc vui bề nổi. Chiến lược vượt qua: Chuyển hóa sự hóm hỉnh duyên dáng thành trí tuệ sâu sắc, tập trung kỷ luật vào việc hoàn thành những tác phẩm sáng tạo để đời.",
            "qa_q": "Làm sao để người có Số Trưởng thành 3 biến kinh nghiệm sống phong phú thành các tác phẩm sáng tạo có giá trị lâu dài?",
            "qa_a": "Hãy kết hợp năng lượng sáng tạo bay bổng với tính kỷ luật thực thi bền bỉ. Hãy dành khung giờ cố định mỗi ngày để viết lách, đúc kết những trải nghiệm đời thực thành các bài học, tác phẩm hoặc bài giảng có chiều sâu tri thức.",
            "advice": "1. **Cam kết kỷ luật sáng tạo mỗi ngày:** Dành 45 phút mỗi ngày để viết, vẽ hoặc sáng tạo nội dung một cách nghiêm túc.\n2. **Đúc kết kinh nghiệm sống thành tác phẩm:** Lên kế hoạch viết một cuốn sách hoặc chuỗi bài chia sẻ về những bài học tâm đắc của cuộc đời.\n3. **Lan tỏa ái ngữ và niềm vui:** Luôn mang lại năng lượng tích cực và những lời động viên chân thành cho mọi người xung quanh."
        }
    },
    {
        "num": "4",
        "title_num": "4",
        "name": "Số 4 - Hội Tụ Nền Tảng Vững Chắc, Kỷ Luật Thép & Di Sản Ổn Định",
        "content": {
            "awakening": "Bước qua tuổi 35, người mang Con số Trưởng thành 4 khao khát mãnh liệt việc kiến tạo một nền móng vững như bàn thạch về tài chính, gia đình và sự nghiệp. Tính kỷ luật, sự chuẩn mực, óc tổ chức khoa học và tinh thần trách nhiệm của bạn đạt tới mức độ điêu luyện, mang lại sự an toàn, tin cậy tuyệt đối cho tổ chức và gia đình.",
            "impact": "Ở nửa sau cuộc đời, bạn trở thành trụ cột không thể thay thế trong gia đình và cơ quan, nhà quản trị hệ thống, giám đốc vận hành (COO), chuyên gia chuẩn hóa quy trình hoặc người xây dựng cơ nghiệp gia đình truyền đời. Bạn để lại di sản bằng các công trình thực tế, quy trình chuẩn mực và sự ổn định bền vững.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Cảm giác kiệt sức vì gánh nặng trách nhiệm quá lớn, trở nên cứng nhắc, bảo thủ, khó thích nghi với công nghệ mới và tư duy cấp tiến của giới trẻ. Chiến lược vượt qua: Học cách buông lỏng kiểm soát, tích hợp sự đổi mới sáng tạo vào hệ thống và dành thời gian nghỉ ngơi dưỡng sức.",
            "qa_q": "Tại sao bước sang tuổi trung niên người có Số Trưởng thành 4 lại coi trọng sự an toàn tài chính và nhà cửa đất đai hơn bao giờ hết?",
            "qa_a": "Bởi vì năng lượng của số 4 hướng về sự ổn định vật chất và nền móng vững chắc. Đối với bạn, sự bình an bắt đầu từ một tổ ấm an cư lạc nghiệp và một kế hoạch tài chính minh bạch. Hãy từng bước tích lũy và xây dựng cơ nghiệp một cách bài bản.",
            "advice": "1. **Chuẩn hóa kế hoạch tài chính hưu trí:** Lập kế hoạch quản trị tài chính và tích lũy tài sản vững chắc cho nửa sau cuộc đời.\n2. **Linh hoạt đón nhận đổi mới:** Chủ động học hỏi các công nghệ và phương pháp quản trị hiện đại.\n3. **Thiết lập chế độ chăm sóc sức khỏe nghiêm ngặt:** Khám sức khỏe định kỳ và tập luyện thể dục đều đặn để duy trì thể lực dẻo dai."
        }
    },
    {
        "num": "5",
        "title_num": "5",
        "name": "Số 5 - Hội Tụ Tự Do Đích Thực, Trải Nghiệm Đa Chiều & Khai Phóng Tư Duy",
        "content": {
            "awakening": "Sau tuổi 35, người mang Con số Trưởng thành 5 nhận ra chân lý: tự do đích thực không phải là trốn chạy hay thay đổi liên tục, mà là sự giải phóng tâm trí khỏi các định kiến cũ kỹ và năng lực làm chủ cuộc sống. Bạn khao khát đi du lịch khám phá thế giới, trải nghiệm các nền văn hóa đa dạng, mở rộng tầm nhìn và sống một cuộc đời phong phú, không hối tiếc.",
            "impact": "Ở nửa sau đời người, mục tiêu của bạn là trở thành nhà khai vấn đổi mới sáng tạo, cố vấn chiến lược linh hoạt, diễn giả tự do, nhà du hành trải nghiệm hoặc người kết nối thương mại văn hóa quốc tế. Bạn truyền cảm hứng cho mọi người dám bước ra khỏi vùng an toàn để sống can đảm và tự do.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Nỗi bất an vì chưa có sự nghiệp cố định theo chuẩn mực xã hội, cảm giác chênh vênh giữa khát vọng bay nhảy và trách nhiệm gia đình. Chiến lược vượt qua: Xây dựng nền tảng tài chính tự động (Passive Income) để tạo bệ đỡ vững vàng cho những chuyến phiêu lưu trải nghiệm.",
            "qa_q": "Làm thế nào để người có Số Trưởng thành 5 tận hưởng trọn vẹn sự tự do trung niên mà không rơi vào cảnh bấp bênh?",
            "qa_a": "Hãy thực hành 'Kỷ luật tự thân là đỉnh cao của tự do'. Khi bạn làm chủ được tâm trí, tài chính và sức khỏe của mình, bạn sẽ tự do đi bất cứ đâu và làm bất cứ điều gì mà vẫn giữ được sự an yên, vững chãi.",
            "advice": "1. **Xây dựng nguồn thu nhập linh hoạt/thụ động:** Đầu tư vào các mô hình kinh doanh hoặc tài sản tạo dòng tiền tự động.\n2. **Lập danh sách trải nghiệm cuộc đời (Bucket List):** Lên kế hoạch thực hiện các chuyến đi khám phá và học hỏi văn hóa mới mỗi năm.\n3. **Duy trì lối sống năng động, trẻ trung:** Thường xuyên thử thách bản thân với các môn thể thao hoặc kỹ năng mới mẻ."
        }
    },
    {
        "num": "6",
        "title_num": "6",
        "name": "Số 6 - Hội Tụ Tình Yêu Gia Đình, Phụng Sự Cộng Đồng & Chữa Lành Mái Ấm",
        "content": {
            "awakening": "Bước qua tuổi 35, trái tim của người mang Con số Trưởng thành 6 mở rộng với tình yêu thương bao la dành cho gia đình, con cháu và cộng đồng. Bạn tìm thấy ý nghĩa sống tối thượng trong việc chăm sóc tổ ấm, vun đắp các mối quan hệ hòa thuận, làm đẹp cho không gian sống và chở che cho những người yếu thế.",
            "impact": "Ở nửa sau cuộc đời, bạn trở thành người giữ lửa ấm gia tộc, nhà giáo dục nhân cách, chuyên gia tư vấn đời sống gia đình, người quản trị tổ chức bảo trợ xã hội hoặc người kiến tạo không gian sống xanh sạch đẹp. Di sản bạn để lại là tình yêu thương vô điều kiện và một gia đình hạnh phúc, thuận hòa.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Hội chứng 'tổ chim trống' khi con cái lớn khôn và tự lập, cảm giác ấm ức khi sự hy sinh của mình bị xem nhẹ, hoặc lo âu thái quá thêu dệt kịch bản xấu cho người thân. Chiến lược vượt qua: Học cách buông lỏng kiểm soát, chuyển hướng tình thương sang phụng sự xã hội và yêu thương chính bản thân mình.",
            "qa_q": "Tại sao ở tuổi trung niên người có Số Trưởng thành 6 lại cảm thấy gia đình và tổ ấm là ưu tiên số một vượt trên mọi danh vọng?",
            "qa_a": "Bởi vì năng lượng của số 6 hướng về cội nguồn yêu thương và sự gắn kết gia đình. Đối với bạn, thành công lớn nhất của cuộc đời không phải là danh vọng ngoài xã hội mà là nhìn thấy những người thân yêu được sống trong bình an, mạnh khỏe và hạnh phúc.",
            "advice": "1. **Thực hành yêu thương bản thân (Self-Care):** Dành thời gian chăm sóc sức khỏe, nhan sắc và bồi dưỡng sở thích cá nhân mỗi ngày.\n2. **Tôn trọng sự tự lập của con cái:** Học cách quan sát và chúc phúc cho con cái tự bước đi trên đôi chân của mình.\n3. **Mở rộng tình thương ra cộng đồng:** Tham gia các hoạt động thiện nguyện, bảo trợ trẻ em nghèo hoặc người già neo đơn."
        }
    },
    {
        "num": "7",
        "title_num": "7",
        "name": "Số 7 - Hội Tụ Trí Tuệ Khai Sáng, Chiêm Nghiệm Tâm Linh & Chiều Sâu Triết Học",
        "content": {
            "awakening": "Sau tuổi 35, người mang Con số Trưởng thành 7 rút lui dần khỏi những cuộc đua tranh phù phiếm để quay về thế giới nội tâm sâu thẳm. Bạn khao khát thấu suốt chân lý vũ trụ, giải mã các quy luật tâm linh và đúc kết những trải nghiệm thăng trầm thành tri thức uyên bác để sống một cuộc đời tĩnh tại, thanh cao.",
            "impact": "Ở nửa sau đời người, mục tiêu của bạn là trở thành học giả uyên thâm, tác giả sách triết lý/tâm lý, chuyên gia khai vấn tâm thức, nhà nghiên cứu khoa học chuyên sâu hoặc cố vấn chiến lược cấp cao có tầm nhìn thấu thị. Di sản bạn để lại là ngọn đèn tri thức soi sáng nhận thức cho nhân loại.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Cảm giác cô độc sâu sắc, mất kết nối với xã hội xung quanh, hoài nghi cay đắng trước những bất công trần thế. Chiến lược vượt qua: Mở lòng chia sẻ những đúc kết tri thức quý báu cho thế hệ trẻ, kết nối với thiên nhiên và những người bạn cùng tầng tâm thức.",
            "qa_q": "Làm thế nào để người có Số Trưởng thành 7 tìm thấy sự bình an tuyệt đối trong giai đoạn nửa sau cuộc đời?",
            "qa_a": "Hãy kết nối với cõi tĩnh lặng nội tâm thông qua thiền định, đọc sách và chiêm nghiệm. Khi bạn nhìn nhận mọi biến cố cuộc đời như những bài học tiến hóa tâm linh cần thiết, tâm trí bạn sẽ đạt tới trạng thái an nhiên tự tại.",
            "advice": "1. **Duy trì thói quen thiền định và đọc sách:** Dành 30 phút mỗi ngày trong không gian tĩnh lặng để kết nối trực giác và nuôi dưỡng trí tuệ.\n2. **Viết sách hoặc chia sẻ tri thức:** Đúc kết những bài học xương máu của cuộc đời thành các bài viết hoặc bài giảng có giá trị.\n3. **Sống hòa hợp với thiên nhiên:** Dành thời gian làm vườn, đi dạo bên bờ nước hoặc leo núi để hấp thụ linh khí tự nhiên."
        }
    },
    {
        "num": "8",
        "title_num": "8",
        "name": "Số 8 - Hội Tụ Quyền Lực Điều Hành, Thịnh Vượng Tài Chính & Kiến Tạo Cơ Nghiệp",
        "content": {
            "awakening": "Bước qua tuổi 35, năng lực điều hành, quản trị nguồn lực và tư duy tài chính của người mang Con số Trưởng thành 8 đạt đến độ chín muồi quyền năng nhất. Bạn tự tin đứng ra làm chủ doanh nghiệp, kiến tạo dòng tiền vững mạnh, quản lý tài sản quy mô lớn và sử dụng sức mạnh kinh tế để khẳng định vị thế và phụng sự xã hội chính trực.",
            "impact": "Ở nửa sau cuộc đời, bạn trở thành chủ tịch/CEO doanh nghiệp, nhà đầu tư chiến lược, nhà bảo trợ tài chính cho các đại dự án cộng đồng hoặc người kiến tạo gia tộc thịnh vượng trường tồn. Di sản bạn để lại là sự thịnh vượng vật chất vững bền và năng lực điều hành xuất chúng.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Áp lực tài chính đè nặng, nỗi sợ mất mát tài sản hoặc rơi vào cái bẫy của sự thực dụng lạnh lùng làm tổn thương các mối quan hệ tình cảm. Chiến lược vượt qua: Neo giữ sự nghiệp vào tâm thế phụng sự và kinh doanh đạo đức, cân bằng giữa thành công vật chất và sự ấm áp tình cảm gia đình.",
            "qa_q": "Tại sao giai đoạn trung niên là thời điểm vàng để người mang Số Trưởng thành 8 bứt phá tài chính vượt bậc?",
            "qa_a": "Bởi vì đây là giai đoạn bạn đã tích lũy đủ kinh nghiệm thực chiến, mạng lưới quan hệ và độ nhạy bén thương trường. Năng lượng số 8 sẽ giúp bạn thu hút các cơ hội kinh doanh lớn và hiện thực hóa các mục tiêu tài chính đỉnh cao.",
            "advice": "1. **Đầu tư tài chính bài bản và kỷ luật:** Đa dạng hóa danh mục đầu tư và quản trị rủi ro dòng tiền một cách chuyên nghiệp.\n2. **Kinh doanh trên nền tảng đạo đức:** Đảm bảo mọi hoạt động kinh tế đều mang lại giá trị thực cho khách hàng và xã hội.\n3. **Trích quỹ phụng sự cộng đồng:** Đều đặn đóng góp tài chính vào các dự án giáo dục, y tế hoặc bảo trợ xã hội."
        }
    },
    {
        "num": "9",
        "title_num": "9",
        "name": "Số 9 - Hội Tụ Tâm Nguyện Vị Tha, Phụng Sự Nhân Loại & Di Sản Tinh Thần",
        "content": {
            "awakening": "Sau tuổi 35, người mang Con số Trưởng thành 9 nhìn thấu sự vô thường của danh lợi và vật chất cá nhân. Tâm nguyện lớn nhất của bạn ở nửa sau đời người là cống hiến cho xã hội, xoa dịu nỗi đau của đồng loại, bảo vệ công lý và để lại một di sản nhân văn cao đẹp cho thế hệ mai sau.",
            "impact": "Ở nửa sau cuộc đời, bạn trở thành nhà lãnh đạo các tổ chức phi lợi nhuận (NGO), nhà hoạt động xã hội nhân đạo, nhà giáo dục khai phóng, nghệ sĩ cống hiến vì cộng đồng hoặc người truyền cảm hứng sống vị tha. Di sản bạn để lại là tình yêu nhân loại bao la và những giá trị tinh thần bất hủ.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Nỗi trăn trở đau đáu trước những bất công xã hội, sự thất vọng khi lòng tốt bị lợi dụng hoặc dằn vặt vì những sai lầm trong quá khứ. Chiến lược vượt qua: Thực hành tha thứ và buông bỏ hoàn toàn quá khứ, tập trung vào những hành động phụng sự thiết thực trong khả năng hiện tại.",
            "qa_q": "Làm thế nào để người mang Số Trưởng thành 9 hoàn thành trọn vẹn tâm nguyện cống hiến mà vẫn có cuộc sống an nhàn tuổi già?",
            "qa_a": "Hãy thực hành 'Phụng sự đi cùng Trí tuệ'. Hãy chuẩn bị một nền tảng tài chính tối thiểu vững chắc cho bản thân để không trở thành gánh nặng của gia đình, từ đó an tâm cống hiến trọn vẹn tâm sức cho các hoạt động nhân văn xã hội.",
            "advice": "1. **Thực hành Buông xả và Tha thứ:** Giải phóng hoàn toàn mọi oán hận quá khứ để tâm hồn được thanh thản, tự tại.\n2. **Tham gia trực tiếp vào các dự án thiện nguyện:** Đóng góp công sức và trí tuệ cho các tổ chức vì cộng đồng hoặc bảo vệ môi trường.\n3. **Sống làm tấm gương đạo đức:** Lan tỏa lối sống vị tha, khiêm nhường và bao dung cho con cháu noi theo."
        }
    },
    {
        "num": "11",
        "title_num": "11",
        "name": "Số 11 - Hội Tụ Trực Giác Tâm Linh Bậc Thầy, Khai Sáng & Đánh Thức Tâm Thức",
        "content": {
            "awakening": "Bước qua tuổi 35, người mang Con số Trưởng thành Master 11 trải qua sự thức tỉnh tâm linh mạnh mẽ. Trực giác siêu giác quan, năng lực thấu cảm năng lượng và sức mạnh truyền cảm hứng của bạn nở rộ, biến bạn thành ngọn đèn hải đăng soi đường cho những ai đang bế tắc, lạc lối tìm lại phương hướng cuộc đời.",
            "impact": "Ở nửa sau đời người, mục tiêu của bạn là trở thành bậc thầy khai vấn tinh thần (Spiritual Coach / Life Coach), chuyên gia trị liệu tâm lý, tác giả sách thức tỉnh tâm thức, nhà hoạt động hòa bình hoặc người truyền thụ các giá trị tinh thần cao quý. Di sản bạn để lại là sự thức tỉnh và bình an trong tâm thức hàng ngàn người.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Sự nhạy cảm quá mức khiến hệ thần kinh dễ bị quá tải, cảm giác lạc lõng giữa xã hội thực dụng hoặc hoang mang trước những trải nghiệm tâm linh vượt khỏi tầm hiểu biết thông thường. Chiến lược vượt qua: Thực hành nối đất (Grounding) nghiêm ngặt, thiền định thanh lọc năng lượng và sống hòa hợp với thiên nhiên.",
            "qa_q": "Tại sao sau tuổi 35 người có Số Trưởng thành Master 11 lại trải qua những biến chuyển tâm thức và linh cảm mạnh mẽ khác thường?",
            "qa_a": "Bởi vì năng lượng của Con số Master 11 đòi hỏi sự tích lũy trải nghiệm sống ở nửa đầu đời người để kích hoạt kênh trực giác cao cấp. Hãy tin tưởng vào tiếng nói nội tâm và sử dụng món quà tâm linh này để phụng sự, soi sáng cho mọi người.",
            "advice": "1. **Thiền định nối đất mỗi ngày:** Dành 20 phút mỗi sáng ngồi thiền kết nối với đất mẹ để giữ vững sự tỉnh thức trong đời thực.\n2. **Thanh lọc năng lượng thân tâm:** Duy trì chế độ ăn thanh nhẹ, tắm nước muối ấm và hạn chế tiếp xúc với môi trường tiêu cực.\n3. **Dùng lời nói nâng đỡ tâm hồn:** Chủ động chia sẻ những thông điệp yêu thương, chân lý để chữa lành nỗi đau cho người xung quanh."
        }
    },
    {
        "num": "22",
        "title_num": "22",
        "name": "Số 22 - Hội Tụ Quyền Năng Bậc Thầy Kiến Tạo Di Sản Vĩ Đại",
        "content": {
            "awakening": "Sau tuổi 35, năng lượng của Con số Trưởng thành Master 22 (The Master Builder) trỗi dậy mạnh mẽ nhất. Sau khi đã tích lũy đủ độ chín về kinh nghiệm chuyên môn và ý chí kỷ luật ở nửa đầu đời người, bạn sẵn sàng lãnh đạo và hiện thực hóa các đại dự án có quy mô tầm cỡ quốc gia hoặc quốc tế, để lại các công trình thế kỷ phục vụ cộng đồng.",
            "impact": "Ở nửa sau cuộc đời, bạn trở thành tổng công trình sư các đại dự án cơ sở hạ tầng, nhà kiến thiết thể chế/tập đoàn đa quốc gia, nhà sáng lập các quỹ phát triển xã hội toàn cầu hoặc nhà lãnh đạo mang tầm vóc lịch sử. Di sản bạn để lại là những công trình, hệ thống trường tồn cùng thời gian.",
            "crisis": "Khủng hoảng tuổi trung niên thường gặp: Áp lực trách nhiệm khổng lồ khiến bạn dễ bị căng thẳng thần kinh tột độ, kiệt sức thể chất hoặc rơi vào cám dỗ thao túng quyền lực nếu cái tôi lấn át. Chiến lược vượt qua: Giữ vững sự chính trực và đạo đức làm trọng tâm, học cách xây dựng đội ngũ cộng sự tin cậy để chia sẻ gánh nặng.",
            "qa_q": "Người có Số Trưởng thành Master 22 làm thế nào để kích hoạt toàn bộ tiềm năng kiến tạo vĩ đại ở giai đoạn nửa sau cuộc đời?",
            "qa_a": "Hãy kết hợp tầm nhìn vĩ mô của số 11 với năng lực thực thi kỷ luật thép của số 4. Hãy lập kế hoạch chiến lược dài hạn, quy tụ những cộng sự tài đức và kiên trì xây dựng từng viên gạch nền móng vững chắc cho đại công trình của bạn.",
            "advice": "1. **Lập bản đồ chiến lược di sản 10 - 20 năm:** Viết ra tầm nhìn dài hạn và các cột mốc thực thi cụ thể cho các đại dự án cuộc đời.\n2. **Xây dựng và đào tạo đội ngũ kế cận:** Tìm kiếm và chuyển giao kinh nghiệm cho những cộng sự trung thực, kỷ luật.\n3. **Rèn luyện sức khỏe thể chất phi thường:** Duy trì chế độ rèn luyện thể lực nghiêm ngặt để đảm bảo sức bền cho những mục tiêu vĩ đại."
        }
    }
]

all_maturity_markdown = "# TỔNG HỢP 11 CON SỐ TRƯỞNG THÀNH (MATURITY NUMBERS) - THẦN SỐ HỌC PYTHAGORAS\n\n"

for doc in maturity_docs:
    num_val = doc["num"]
    c = doc["content"]
    
    md = f"""---
id: "numerology-maturity-{num_val}"
category: "maturity_number"
indicator_name: "Trưởng thành"
indicator_key: "mature"
number_value: "{num_val}"
keywords: ["con số trưởng thành {num_val}", "maturity {num_val}", "sau 35 tuổi số {num_val}", "trung niên {num_val}", "vận mệnh trung niên {num_val}"]
title: "Năng Lượng Tuổi Trung Niên Của Con Số Trưởng Thành {num_val}"
---

# Năng Lượng Tuổi Trung Niên Của Con Số Trưởng Thành {num_val}

## Sự Thức Tỉnh Bản Ngã Và Sức Mạnh Hội Tụ Sau Tuổi 35 Của Số Trưởng Thành {num_val}
{c['awakening']}

## Tầm Ảnh Hưởng Xã Hội Và Mục Tiêu Cuộc Sống Ở Nửa Sau Đời Người
{c['impact']}

## Khủng Hoảng Tuổi Trung Niên Thường Gặp Và Chiến Lược Vượt Qua
{c['crisis']}

## Các Câu Hỏi Tra Cứu Thường Gặp Về Số Trưởng Thành {num_val} (Semantic Q&A)
- **Q: {c['qa_q']}**
  - **A:** {c['qa_a']}
- **Q: Làm thế nào để chuẩn bị nền tảng tốt nhất đón nhận năng lượng Trưởng thành {num_val}?**
  - **A:** {c['advice']}

## Lời Khuyên Chuẩn Bị Nền Tảng Để Đón Nhận Năng Lượng Trưởng Thành {num_val}
{c['advice']}
"""
    
    filename = f"maturity_{num_val}.md"
    filepath = os.path.join(knowledge_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md.strip() + "\n")
    print(f"Successfully generated: {filename}")
    all_maturity_markdown += md.strip() + "\n\n---\n\n"

all_filepath = os.path.join(knowledge_dir, "maturity_all.md")
with open(all_filepath, "w", encoding="utf-8") as f:
    f.write(all_maturity_markdown.strip() + "\n")
print("Successfully generated: maturity_all.md")
print("DONE: All 11 Maturity Markdown files generated successfully!")
