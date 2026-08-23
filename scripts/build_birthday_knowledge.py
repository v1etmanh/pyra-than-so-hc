# -*- coding: utf-8 -*-
import os

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
os.makedirs(knowledge_dir, exist_ok=True)

birthday_docs = [
    {
        "num": "1",
        "title_num": "1",
        "name": "Số 1 - Bản Lĩnh Độc Lập & Khởi Xướng Tiên Phong",
        "content": {
            "talent": "Người mang Con số Ngày sinh 1 (sinh vào các ngày 1, 10, 19, 28) sở hữu món quà thiên bẩm về ý chí tự lập kiên cường, óc sáng tạo độc bản và bản lĩnh tiên phong dũng cảm. Ngay từ nhỏ, bạn đã bộc lộ tính tự chủ cao, không thích dựa dẫm hay bị sai bảo, luôn muốn tự mình tìm ra cách giải quyết vấn đề và dám chịu trách nhiệm về các quyết định cá nhân.",
            "support": "Số Ngày sinh 1 đóng vai trò như một bàn đạp phản lực tiếp thêm sự quyết đoán, lòng can đảm và tinh thần dấn thân cho Con số Đường đời. Dù Đường đời của bạn mang năng lượng nào, ngày sinh 1 giúp bạn không bao giờ chùn bước trước nghịch cảnh, luôn chủ động biến ý tưởng trên giấy thành hành động thực tế trên thương trường.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Tính khí bướng bỉnh, cái tôi quá cao, hay nóng vội và thiếu kiên nhẫn khi làm việc nhóm. Bạn dễ có xu hướng lấn át người khác hoặc tự cô lập mình vì nghĩ rằng không ai có thể làm việc tốt bằng chính mình.",
            "qa_q": "Tại sao từ nhỏ tôi đã cảm thấy khó hòa nhập với những quy tắc áp đặt và luôn muốn làm theo cách của riêng mình?",
            "qa_a": "Bởi vì năng lượng khởi nguyên của Ngày sinh 1 ban tặng cho bạn tư duy độc lập tự chủ. Bạn sinh ra để tạo ra con đường mới chứ không phải để rập khuôn. Hãy học cách dung hòa: giữ vững sự tự chủ bên trong nhưng thể hiện sự khiêm nhường, lắng nghe có chọn lọc ở bên ngoài.",
            "advice": "1. **Tự chịu trách nhiệm 100%:** Khi gặp thất bại, không đổ lỗi cho hoàn cảnh mà tập trung tìm giải pháp hành động mới.\n2. **Học cách lắng nghe góp ý:** Lắng nghe trọn vẹn ý kiến của người đi trước trước khi đưa ra quyết định cuối cùng.\n3. **Đảm nhận vai trò khởi xướng:** Chủ động nhận trách nhiệm khởi động một dự án hoặc mục tiêu mới trong công việc."
        }
    },
    {
        "num": "2",
        "title_num": "2",
        "name": "Số 2 - Trực Giác Nhạy Bén & Khả Năng Hòa Giải Tinh Tế",
        "content": {
            "talent": "Người mang Con số Ngày sinh 2 (sinh vào các ngày 2, 20) được vũ trụ trao tặng món quà bẩm sinh về trực giác tâm linh nhạy cảm, năng khiếu hòa giải và sự thấu cảm tinh tế. Bạn có khả năng cảm nhận chính xác cảm xúc và năng lượng của người khác, biết lắng nghe chân thành, khéo léo xoa dịu những căng thẳng và kết nối con người lại với nhau.",
            "support": "Số Ngày sinh 2 hỗ trợ đắc lực cho Con số Đường đời bằng việc mang lại sự mềm mại, khéo léo trong ngoại giao và khả năng xây dựng mạng lưới quan hệ hợp tác bền chặt. Nó giúp bạn biến những kế hoạch gai góc của đường đời thành các thỏa thuận hòa nhã, thu phục nhân tâm.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Sự nhạy cảm thái quá dẫn đến việc dễ bị tổn thương, tự ti, phụ thuộc cảm xúc vào người khác (lụy tình) và nỗi sợ xung đột khiến bạn không dám đứng lên bảo vệ quyền lợi chính đáng của mình.",
            "qa_q": "Làm thế nào để người có Ngày sinh 2 giữ được sự hòa nhã mà không bị người khác lấn át trong môi trường cạnh tranh?",
            "qa_a": "Hãy xây dựng 'Sự nhạy cảm có bản lĩnh'. Nhạy cảm là giác quan thông minh để đọc vị tình huống chứ không phải để tự làm mình tổn thương. Hãy rèn luyện sự kiên định, học cách từ chối dứt khoát những đòi hỏi bất công mà vẫn giữ phong thái lịch thiệp.",
            "advice": "1. **Thiết lập ranh giới bảo vệ cảm xúc:** Học cách nói 'Không' một cách nhẹ nhàng nhưng dứt khoát với những yêu cầu vượt quá giới hạn.\n2. **Tập phát biểu ý kiến riêng:** Chủ động chia sẻ quan điểm của mình trong các cuộc thảo luận nhóm.\n3. **Thanh lọc năng lượng tiêu cực:** Dành 15 phút mỗi ngày đi dạo một mình hoặc nghe nhạc êm dịu để giải tỏa cảm xúc tích tụ."
        }
    },
    {
        "num": "3",
        "title_num": "3",
        "name": "Số 3 - Tài Năng Ngôn Ngữ, Sáng Tạo & Lan Tỏa Niềm Vui",
        "content": {
            "talent": "Người mang Con số Ngày sinh 3 (sinh vào các ngày 3, 12, 21, 30) sở hữu năng khiếu thiên bẩm về biểu đạt ngôn ngữ, óc hài hước duyên dáng, tư duy sáng tạo nhanh nhạy và khả năng làm chủ sân khấu. Bạn có tài biến những điều phức tạp trở nên dí dỏm, lôi cuốn và luôn mang lại nguồn năng lượng tích cực, tiếng cười cho những người xung quanh.",
            "support": "Số Ngày sinh 3 hỗ trợ Con số Đường đời như một công cụ truyền thông và marketing tuyệt vời. Dù bạn làm trong bất kỳ ngành nghề nào, năng khiếu ăn nói và sự sáng tạo của ngày sinh 3 sẽ giúp bạn dễ dàng truyền tải ý tưởng, thu hút đối tác và mở rộng tầm ảnh hưởng xã hội.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Tính khí thất thường, làm việc theo cảm hứng nhất thời, dễ phân tán năng lượng vào quá nhiều thú vui, chi tiêu bốc đồng và thói quen vô tư buông lời mỉa mai khi tức giận.",
            "qa_q": "Làm sao để người có Ngày sinh 3 biến tài năng ăn nói thành thành tựu sự nghiệp thực tế?",
            "qa_a": "Hãy kết hợp tài năng biểu đạt với sự đào sâu chuyên môn và tính kỷ luật. Đừng chỉ dừng lại ở những câu chuyện giải trí; hãy sử dụng ngôn từ để chia sẻ tri thức, đào tạo, viết lách hoặc đàm phán kinh doanh một cách bài bản và kiên định.",
            "advice": "1. **Rèn luyện kỹ năng viết và thuyết trình:** Dành 30 phút mỗi ngày viết bài chia sẻ hoặc luyện tập kỹ năng trình bày ý tưởng.\n2. **Cam kết hoàn thành trọn vẹn 1 việc:** Đặt ra mục tiêu và kiên trì hoàn thành dứt điểm trước khi chuyển sang dự án mới.\n3. **Nói lời ái ngữ:** Chủ động gửi gắm những lời khen ngợi và động viên chân thành tới người xung quanh mỗi ngày."
        }
    },
    {
        "num": "4",
        "title_num": "4",
        "name": "Số 4 - Óc Thực Tế, Kỷ Luật & Năng Lực Tổ Chức Vững Vàng",
        "content": {
            "talent": "Người mang Con số Ngày sinh 4 (sinh vào các ngày 4, 13, 31) được trời phú cho óc tổ chức khoa học, tính kỷ luật tự giác, sự tỉ mỉ chuẩn xác và đôi bàn tay khéo léo trong các công việc thực tiễn. Bạn có năng khiếu quản lý sắp xếp quy trình, làm việc với sự tận tâm, trung thực và luôn là chỗ dựa vững chãi đáng tin cậy nhất.",
            "support": "Số Ngày sinh 4 đóng vai trò như một mỏ neo thực tế cho Con số Đường đời. Nó giúp bạn không bị bay bổng xa rời thực tế, luôn biết cách lập kế hoạch chi tiết, quản trị rủi ro và từng bước xây dựng nền móng kiên cố cho sự nghiệp.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Sự cứng nhắc, bảo thủ, lo âu thái quá về mặt tài chính vật chất, nhìn nhận vấn đề khô khan thiếu lãng mạn và dễ bị cuốn vào vòng xoáy tham công tiếc việc (workaholic).",
            "qa_q": "Làm thế nào để người mang Ngày sinh 4 bứt phá khỏi sự an toàn rập khuôn và trở nên linh hoạt hơn?",
            "qa_a": "Hãy học cách chấp nhận rằng sự thay đổi là quy luật tất yếu của cuộc sống. Hãy cho phép bản thân thử nghiệm những phương pháp làm việc mới mẻ và dành thời gian nghỉ ngơi thư giãn để nuôi dưỡng khía cạnh cảm xúc, tinh thần.",
            "advice": "1. **Lập kế hoạch tuần chi tiết:** Sắp xếp các đầu việc theo thứ tự ưu tiên và tuân thủ nghiêm túc.\n2. **Linh hoạt thử nghiệm thói quen mới:** Mỗi tuần thử thay đổi 1 thói quen sinh hoạt để rèn luyện tính thích nghi.\n3. **Bày tỏ tình cảm bằng lời nói:** Nói lời yêu thương, cảm ơn với người thân thay vì chỉ chăm lo chu cấp vật chất."
        }
    },
    {
        "num": "5",
        "title_num": "5",
        "name": "Số 5 - Khả Năng Thích Ứng, Tinh Thần Phiêu Lưu & Khai Phóng",
        "content": {
            "talent": "Người mang Con số Ngày sinh 5 (sinh vào các ngày 5, 14, 23) sở hữu món quà bẩm sinh về khả năng thích ứng linh hoạt siêu việt, tư duy phóng khoáng, trực giác phong phú và năng lượng phiêu lưu tràn đầy. Bạn có khả năng hòa nhập nhanh chóng vào bất kỳ môi trường văn hóa nào và có sức hút tự nhiên lôi cuốn mọi người.",
            "support": "Số Ngày sinh 5 hỗ trợ Đường đời bằng sự dũng cảm dám đổi mới và khả năng xoay chuyển tình thế tài tình. Nó giúp bạn không bị gục ngã trước những biến động bất ngờ của thời cuộc, luôn nhìn thấy cơ hội mới trong những hoàn cảnh khó khăn nhất.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Sự cả thèm chóng chán, bốc đồng thiếu kiên nhẫn, dễ bị cám dỗ bởi những thú vui nhất thời và xu hướng trốn chạy thực tại khi công việc bước vào giai đoạn duy trì đều đặn.",
            "qa_q": "Làm sao để người có Ngày sinh 5 duy trì sự tập trung mà vẫn thỏa mãn được khao khát tự do?",
            "qa_a": "Hãy áp dụng nguyên tắc 'Tự do trong khuôn khổ'. Thiết lập một vài kỷ luật cốt lõi bất biến (về sức khỏe, tài chính, cam kết cơ bản), và trong không gian an toàn đó, bạn hoàn toàn tự do sáng tạo và trải nghiệm những điều mới lạ.",
            "advice": "1. **Rèn luyện 1 thói quen kỷ luật cố định:** Cam kết tập thể dục hoặc đọc sách 30 phút mỗi ngày vào giờ cố định.\n2. **Khám phá trải nghiệm mới lành mạnh:** Học 1 môn thể thao mới hoặc tham gia 1 khóa học mới thay vì thay đổi công việc bốc đồng.\n3. **Định tâm tĩnh lặng:** Dành 10 phút đi dạo chân trần trên cỏ để neo giữ năng lượng bình an."
        }
    },
    {
        "num": "6",
        "title_num": "6",
        "name": "Số 6 - Năng Lượng Chăm Sóc, Gu Thẩm Mỹ & Trách Nhiệm Gia Đình",
        "content": {
            "talent": "Người mang Con số Ngày sinh 6 (sinh vào các ngày 6, 15, 24) được trời phú cho trái tim ấm áp giàu lòng trắc ẩn, năng khiếu thẩm mỹ nghệ thuật tinh tế và tinh thần trách nhiệm gia đình mẫu mực. Bạn có tài năng bẩm sinh trong việc chăm sóc sức khỏe, cố vấn tâm lý, bài trí không gian sống và tạo dựng sự hòa thuận cho gia đình.",
            "support": "Số Ngày sinh 6 hỗ trợ Đường đời bằng nguồn năng lượng yêu thương và sự gắn kết nhân văn sâu sắc. Nó giúp bạn xây dựng được hậu phương gia đình vững chắc, tạo dựng hình ảnh cá nhân uy tín, đáng tin cậy và được mọi người hết lòng ủng hộ.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Xu hướng lo lắng thái quá (sáng tạo tiêu cực), bao bọc kiểm soát người thân ngột ngạt, dễ bị gánh nặng trách nhiệm đè nén và ấm ức khi sự hy sinh của mình không được ghi nhận.",
            "qa_q": "Làm thế nào để người mang Ngày sinh 6 cân bằng giữa việc chăm lo cho người khác và phát triển sự nghiệp cá nhân?",
            "qa_a": "Hãy học bài học 'Yêu thương bản thân trước tiên'. Bạn chỉ có thể mang lại hạnh phúc cho người khác khi chính bạn cảm thấy đủ đầy và an yên. Hãy trao cho người thân không gian tự lập và dành thời gian nuôi dưỡng đam mê riêng của mình.",
            "advice": "1. **Chăm sóc bản thân mỗi ngày:** Dành 30 phút chăm sóc sắc đẹp, sức khỏe hoặc sở thích cá nhân mà không phục vụ ai khác.\n2. **Tôn trọng sự tự lập của người thân:** Quan sát và khích lệ người thân tự giải quyết vấn đề của họ thay vì làm hộ.\n3. **Làm đẹp không gian làm việc:** Đặt một chậu cây xanh hoặc bức tranh đẹp trên bàn làm việc để nuôi dưỡng cảm hứng thẩm mỹ."
        }
    },
    {
        "num": "7",
        "title_num": "7",
        "name": "Số 7 - Óc Phân Tích Sâu Sắc, Trực Giác Triết Học & Tinh Thần Tự Học",
        "content": {
            "talent": "Người mang Con số Ngày sinh 7 (sinh vào các ngày 7, 16, 25) sở hữu món quà thiên bẩm về tư duy phân tích sắc sảo, năng lực tự học phi thường, trực giác triết học thấu suốt và tinh thần độc lập tư tưởng. Bạn không bao giờ chấp nhận những thông tin bề nổi, luôn tự mình đào sâu nghiên cứu để tìm ra bản chất cốt lõi của vấn đề.",
            "support": "Số Ngày sinh 7 hỗ trợ Con số Đường đời bằng sự thông tuệ, tầm nhìn sâu sắc và khả năng thấu hiểu các quy luật tự nhiên. Nó giúp bạn đưa ra những quyết định mang tính chiến lược dài hạn, tránh được những cạm bẫy hời hợt trên đường đời.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Tính bảo thủ, hoài nghi quá mức, từ chối học hỏi từ kinh nghiệm của người khác dẫn đến việc phải trả giá bằng những mất mát tổn thất thực tế (về tiền bạc, tình cảm hoặc sức khỏe) mới chịu thức tỉnh.",
            "qa_q": "Tại sao người có Ngày sinh 7 thời trẻ thường hay gặp phải những thử thách gian nan và cảm thấy cô độc?",
            "qa_a": "Bởi vì ngày sinh 7 mang bài học tôi luyện qua thực chứng. Vũ trụ gửi đến những thử thách để bạn đúc kết thành trí tuệ thực tế. Hãy mở lòng đón nhận lời khuyên của người đi trước và nhìn nhận mọi biến cố như những bài học tiến hóa quý giá.",
            "advice": "1. **Thiền định tĩnh tâm mỗi ngày:** Dành 20 phút mỗi sáng ngồi trong tĩnh lặng để làm sạch tâm trí và kết nối trực giác.\n2. **Đọc sách chuyên sâu:** Dành thời gian nghiên cứu các tác phẩm triết học, khoa học hoặc tâm lý học chiều sâu.\n3. **Lắng nghe khiêm nhường:** Lắng nghe ý kiến của người khác với tâm thế học hỏi, giảm bớt sự hoài nghi phán xét ban đầu."
        }
    },
    {
        "num": "8",
        "title_num": "8",
        "name": "Số 8 - Tư Duy Tài Chính, Bản Lĩnh Kinh Doanh & Khí Chất Uy Quyền",
        "content": {
            "talent": "Người mang Con số Ngày sinh 8 (sinh vào các ngày 8, 17, 26) sở hữu năng khiếu thiên bẩm về sự nhạy bén thương trường, tư duy tài chính sắc sảo, óc tổ chức điều hành và ý chí kiên cường không gì khuất phục được. Bạn toát ra phong thái đĩnh đạc của một nhà lãnh đạo có năng lực tạo dựng của cải thực tế.",
            "support": "Số Ngày sinh 8 đóng vai trò như đòn bẩy vật chất và năng lực điều hành thực chiến cho Con số Đường đời. Dù đường đời của bạn là gì, ngày sinh 8 sẽ giúp bạn hiện thực hóa các ý tưởng thành các thành quả kinh tế vững chắc và tạo dựng vị thế xã hội đáng kính.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Xu hướng thực dụng thái quá, đánh giá con người qua tiền bạc địa vị, khó bộc lộ cảm xúc dịu dàng và dễ trở nên độc đoán, lạnh lùng trong cách đối xử với người thân.",
            "qa_q": "Làm thế nào để người có Ngày sinh 8 phát huy năng lực kiếm tiền mà không bị áp lực vật chất chi phối tâm can?",
            "qa_a": "Hãy ghi nhớ quy luật 'Cân bằng giữa Vật chất và Tâm linh'. Tiền bạc là dòng chảy năng lượng phục vụ cuộc sống; khi bạn làm kinh doanh với sự chính trực và tâm thế phụng sự xã hội, tài sản của bạn sẽ vô cùng vững bền và mang lại hạnh phúc đích thực.",
            "advice": "1. **Quản trị dòng tiền kỷ luật:** Lập bảng theo dõi tài chính cá nhân và đầu tư có kế hoạch rõ ràng.\n2. **Bộc lộ sự dịu dàng với người thân:** Dành thời gian lắng nghe và ôm người thương mà không bàn về công việc hay tiền bạc.\n3. **Thực hành thiện nguyện:** Trích một phần lợi nhuận giúp đỡ những hoàn cảnh khó khăn một cách chân thành."
        }
    },
    {
        "num": "9",
        "title_num": "9",
        "name": "Số 9 - Lòng Trắc Ẩn Bao La, Tầm Nhìn Vĩ Mô & Trách Nhiệm Xã Hội",
        "content": {
            "talent": "Người mang Con số Ngày sinh 9 (sinh vào các ngày 9, 18, 27) được ban tặng món quà bẩm sinh về lòng nhân ái bao la, tầm nhìn vĩ mô bao quát, phong thái đàng hoàng quý phái và tinh thần trách nhiệm cộng đồng cao cả. Bạn có uy tín tự nhiên, dễ dàng thu hút lòng tin và sự tôn trọng của mọi người.",
            "support": "Số Ngày sinh 9 hỗ trợ Con số Đường đời bằng cách nâng tầm các mục tiêu cá nhân thành những sứ mệnh nhân văn cao đẹp. Nó giúp bạn nhận được sự trợ giúp quý báu từ quý nhân và cộng đồng trong mọi hành trình phát triển sự nghiệp.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Tính lý tưởng hóa quá mức, khó buông bỏ những ký ức tổn thương trong quá khứ, dễ bị kẻ xấu lợi dụng lòng tốt và xu hướng lo việc bao đồng ngoài xã hội mà bỏ bê người thân bên cạnh.",
            "qa_q": "Người mang Ngày sinh 9 cần làm gì để cho đi lòng tốt mà không bị thất vọng hay lợi dụng?",
            "qa_a": "Hãy thực hành 'Cho đi bằng Trí tuệ sáng suốt'. Hãy kiểm chứng thông tin thực tế trước khi giúp đỡ, đặt ra những ranh giới rõ ràng và ưu tiên chăm sóc chu đáo gia đình nhỏ của mình trước khi gánh vác việc thiên hạ.",
            "advice": "1. **Thực hành Buông bỏ và Tha thứ:** Viết ra những điều tiếc nuối trong quá khứ và nói lời tha thứ để giải phóng tâm trí.\n2. **Hành động thiện nguyện thiết thực:** Tham gia trực tiếp vào 1 hoạt động giúp đỡ cộng đồng hoặc bảo vệ môi trường.\n3. **Hiện diện trọn vẹn bên người thân:** Dành thời gian chăm sóc chu đáo những nhu cầu thiết thực của cha mẹ/con cái."
        }
    },
    {
        "num": "10",
        "title_num": "10",
        "name": "Số 10 - Sự Linh Hoạt Đỉnh Cao, Tự Tin & Thích Nghi Tuyệt Vời",
        "content": {
            "talent": "Người mang Con số Ngày sinh 10 (sinh vào các ngày 10, 19, 28) sở hữu món quà bẩm sinh về sự linh hoạt đỉnh cao, khả năng thích ứng tuyệt vời trong mọi hoàn cảnh, phong thái lịch thiệp tự tin và sức hút quyến rũ tự nhiên. Bạn có khả năng làm quen và xoay xở tài tình trong mọi môi trường sống.",
            "support": "Số Ngày sinh 10 hỗ trợ Con số Đường đời bằng sự nhanh nhạy, năng lượng vui tươi và khả năng phục hồi thần tốc sau thất bại. Nó giúp bạn dễ dàng mở rộng các mối quan hệ xã giao và nắm bắt nhanh chóng các xu hướng mới của thời đại.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Dễ tự mãn bề nổi, thiếu sự kiên nhẫn để đào sâu chuyên môn phức tạp, 'biết nhiều nhưng không sâu' và dễ bị hoang mang mất phương hướng khi đứng trước quá nhiều ngã rẽ.",
            "qa_q": "Làm thế nào để người có Ngày sinh 10 biến sự linh hoạt đa tài thành thành tựu đỉnh cao bền vững?",
            "qa_a": "Hãy chọn ra một lĩnh vực mũi nhọn duy nhất mà bạn đam mê nhất và cam kết rèn luyện kỷ luật thép trong ít nhất 5 năm. Chiều sâu chuyên môn kết hợp với khả năng thích ứng linh hoạt sẽ đưa bạn lên đỉnh cao danh vọng.",
            "advice": "1. **Tập trung vào 1 kỹ năng cốt lõi:** Dành ít nhất 45 phút mỗi ngày chỉ để nâng cao tay nghề chuyên môn sâu.\n2. **Thực hành khiêm nhường lắng nghe:** Lắng nghe người khác mà không tìm cách phô trương sự hiểu biết của mình.\n3. **Kiên định với mục tiêu:** Cam kết hoàn thành trọn vẹn từng mục tiêu đã đề ra trước khi chuyển sang kế hoạch mới."
        }
    },
    {
        "num": "11",
        "title_num": "11",
        "name": "Số 11 - Trực Giác Siêu Cảm, Khai Sáng Tâm Linh & Truyền Cảm Hứng",
        "content": {
            "talent": "Người mang Con số Ngày sinh 11 (sinh vào các ngày 11, 29) được vũ trụ ban tặng món quà siêu giác quan về trực giác tâm linh nhạy bén, khả năng cảm nhận trường năng lượng thấu suốt và sức truyền cảm hứng tinh thần thuần khiết. Lời nói và sự hiện diện của bạn có khả năng lay động và thức tỉnh tâm thức của người khác.",
            "support": "Số Ngày sinh 11 đóng vai trò như ngọn đèn hải đăng tâm linh cho Con số Đường đời. Nó giúp bạn đưa ra những quyết định chuẩn xác dựa trên linh cảm ban đầu và dẫn dắt sự nghiệp hướng tới những giá trị đạo đức cao quý.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Sự nhạy cảm quá mức khiến hệ thần kinh dễ bị quá tải, lo âu bất an, thiếu tự tin vào trực giác của mình và cảm giác chông chênh giữa lý tưởng tâm linh với áp lực sinh tồn thực tế.",
            "qa_q": "Làm sao để người có Ngày sinh Master 11 bảo vệ sự nhạy cảm và phát huy trực giác trong đời sống hàng ngày?",
            "qa_a": "Hãy thực hành 'Nối đất' (Grounding) đều đặn: tiếp xúc với thiên nhiên, duy trì lối sống thanh tịnh và học cách bảo vệ trường năng lượng cá nhân. Trực giác sẽ phát huy sức mạnh tối đa khi bạn giữ được sự bình an nội tâm.",
            "advice": "1. **Thiền định nối đất mỗi sáng:** Dành 15 phút thiền định kết nối với đất mẹ để giữ vững sự tỉnh thức trong đời thực.\n2. **Thanh lọc năng lượng tiêu cực:** Tắm nước muối ấm hoặc nghe nhạc tần số cao để tẩy sạch tạp niệm.\n3. **Ghi chép và tin tưởng trực giác:** Ghi lại những linh cảm xuất hiện trong ngày để rèn luyện sự kết nối với trí tuệ vô thức."
        }
    },
    {
        "num": "22",
        "title_num": "22",
        "name": "Số 22 - Bản Lĩnh Kiến Tạo Vĩ Đại & Năng Lực Thực Thi Phi Thường",
        "content": {
            "talent": "Người mang Con số Ngày sinh 22 (sinh vào ngày 22) sở hữu món quà quyền năng nhất: sự kết hợp hoàn hảo giữa tầm nhìn vĩ mô của số 11 và kỷ luật thép của số 4. Bạn có năng lực bẩm sinh trong việc biến những ý tưởng khổng lồ thành các công trình, hệ thống thực tế hữu hình phụng sự cộng đồng.",
            "support": "Số Ngày sinh 22 cung cấp nguồn năng lượng kiến tạo mạnh mẽ cho Con số Đường đời. Nó giúp bạn mở rộng quy mô của mọi dự án bạn chạm tay vào, từ quy mô cá nhân nâng lên tầm vóc tập đoàn hoặc tác động xã hội rộng lớn.",
            "blindspot": "Điểm mù cần khắc phục trong giai đoạn 0 - 35 tuổi: Áp lực tự thân quá lớn dẫn đến căng thẳng thần kinh, thiếu kiên nhẫn với người làm việc chậm hơn và nguy cơ rơi vào tham vọng độc tài nếu đánh mất la bàn đạo đức.",
            "qa_q": "Người có Ngày sinh Master 22 cần chuẩn bị những gì trong giai đoạn trẻ tuổi để đón nhận cơ hội lớn?",
            "qa_a": "Hãy kiên trì tôi luyện bản lĩnh và xây dựng nền móng chuyên môn vững chắc theo năng lượng số 4. Đừng nóng vội; khi bạn đã đủ độ chín về đạo đức, năng lực quản trị và thể lực, cánh cửa kiến tạo vĩ đại sẽ mở ra.",
            "advice": "1. **Rèn luyện kỷ luật thép mỗi ngày:** Tuân thủ nghiêm ngặt thời gian biểu và hoàn thành đúng hạn mọi cam kết nhỏ nhất.\n2. **Lập kế hoạch chiến lược dài hạn:** Viết ra lộ trình phát triển 5 - 10 năm và chia nhỏ thành các mục tiêu tháng.\n3. **Rèn luyện thể lực tráng kiện:** Tập thể dục thể thao ít nhất 30 phút mỗi ngày để tạo bệ đỡ cho trí tuệ vĩ đại."
        }
    }
]

all_birthday_markdown = "# TỔNG HỢP 12 CON SỐ NGÀY SINH (BIRTHDAY NUMBERS) - THẦN SỐ HỌC PYTHAGORAS\n\n"

for doc in birthday_docs:
    num_val = doc["num"]
    c = doc["content"]
    
    md = f"""---
id: "numerology-birthday-{num_val}"
category: "birthday_number"
indicator_name: "Ngày sinh"
indicator_key: "dateOfBirth"
number_value: "{num_val}"
keywords: ["số ngày sinh {num_val}", "birthday number {num_val}", "năng khiếu bẩm sinh ngày {num_val}", "ngày sinh {num_val}"]
title: "Món Quà Thiên Bẩm Của Con Số Ngày Sinh {num_val}"
---

# Món Quà Thiên Bẩm Của Con Số Ngày Sinh {num_val}

## Tài Năng Đặc Biệt Và Năng Lực Bẩm Sinh Của Con Số Ngày Sinh {num_val}
{c['talent']}

## Cách Con Số Ngày Sinh {num_val} Hỗ Trợ Đắc Lực Cho Con Số Đường Đời
{c['support']}

## Điểm Mù Cần Khắc Phục Trong Giai Đoạn Trẻ Tuổi (0 - 35 tuổi)
{c['blindspot']}

## Các Câu Hỏi Tra Cứu Thường Gặp Về Số Ngày Sinh {num_val} (Semantic Q&A)
- **Q: {c['qa_q']}**
  - **A:** {c['qa_a']}
- **Q: Làm thế nào để kích hoạt năng khiếu bẩm sinh của Ngày sinh {num_val}?**
  - **A:** {c['advice']}

## 3 Hành Động Đánh Thức Năng Lực Thiên Phú Của Số Ngày Sinh {num_val}
{c['advice']}
"""
    
    filename = f"birthday_{num_val}.md"
    filepath = os.path.join(knowledge_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md.strip() + "\n")
    print(f"Successfully generated: {filename}")
    all_birthday_markdown += md.strip() + "\n\n---\n\n"

all_filepath = os.path.join(knowledge_dir, "birthday_all.md")
with open(all_filepath, "w", encoding="utf-8") as f:
    f.write(all_birthday_markdown.strip() + "\n")
print("Successfully generated: birthday_all.md")
print("DONE: All 12 Birthday Markdown files generated successfully!")
