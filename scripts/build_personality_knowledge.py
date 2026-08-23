# -*- coding: utf-8 -*-
import os

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
os.makedirs(knowledge_dir, exist_ok=True)

personality_docs = [
    {
        "num": "1",
        "title_num": "1",
        "name": "Số 1 - Phong Thái Tiên Phong, Tự Tin & Khí Chất Lãnh Đạo",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 1 (Personality 1 - tính từ tổng các phụ âm trong họ tên) toát ra ấn tượng đầu tiên vô cùng mạnh mẽ: tự tin, đĩnh đạc, độc lập và mang khí chất của một nhà lãnh đạo bẩm sinh. Bạn có dáng đi nhanh nhẹn, phong thái dứt khoát, ánh mắt kiên định và phong cách ăn mặc chỉnh chu, sang trọng, mang hơi hướng quyền lực và tiên phong. Mọi người khi mới gặp thường cảm nhận bạn là người có năng lực, bản lĩnh và không dễ bị khuất phục.",
            "social_style": "Phong cách giao tiếp xã hội của bạn rất trực diện, rõ ràng, gãy gọn và đi thẳng vào trọng tâm vấn đề. Bạn không thích sự vòng vo, giả tạo hay tán gẫu vô bổ. Trong các cuộc thảo luận hoặc làm việc nhóm, bạn thường là người chủ động đưa ra định hướng, ra quyết định và dẫn dắt tập thể tiến lên phía trước.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 1 là 'chiếc áo giáp của sự mạnh mẽ và bất khả xâm phạm'. Nguy cơ xung đột lớn nhất là người khác dễ hiểu lầm bạn là kẻ kiêu ngạo, lạnh lùng, gia trưởng và khó gần. Nếu bên trong (Chỉ số Linh hồn) bạn là một tâm hồn nhạy cảm (như Linh hồn 2 hay 6), bạn sẽ thường xuyên cảm thấy cô đơn vì vẻ ngoài quá mạnh mẽ khiến người khác nghĩ rằng bạn không bao giờ cần sự an ủi hay chở che.",
            "qa_q": "Tại sao người khác thường thấy tôi khó gần và nghĩ tôi kiêu ngạo dù trong lòng tôi rất cởi mở và muốn kết bạn?",
            "qa_a": "Bởi vì thần thái tự tin, quyết đoán và ánh mắt sắc sảo của Nhân cách 1 vô tình tạo ra một từ trường áp đảo khiến người khác cảm thấy e dè. Hãy chủ động mỉm cười ấm áp hơn trong lần đầu gặp gỡ, đặt những câu hỏi mở quan tâm đến đối phương và hạ bớt tông giọng khi trò chuyện đời thường.",
            "advice": "1. **Thêm sự mềm mỏng vào ngôn ngữ cơ thể:** Tập mỉm cười nhẹ nhàng và thả lỏng vai khi bước vào một cuộc trò chuyện mới.\n2. **Thực hành lắng nghe trước khi phát biểu:** Để người khác chia sẻ hết quan điểm của họ trước khi đưa ra nhận xét hoặc chỉ đạo.\n3. **Bộc lộ sự ấm áp tự nhiên:** Chủ động chào hỏi và hỏi thăm một câu chuyện đời thường giản dị với đồng nghiệp mỗi sáng."
        }
    },
    {
        "num": "2",
        "title_num": "2",
        "name": "Số 2 - Phong Thái Dịu Dàng, Hòa Nhã & Đầy Thiện Cảm",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 2 toát lên ấn tượng đầu tiên vô cùng dịu dàng, nhã nhặn, khiêm nhường và dễ mến. Năng lượng tỏa ra từ bạn mang lại cảm giác bình an, thư thái và an toàn cho người đối diện. Phong cách ăn mặc của bạn thường trang nhã, thanh lịch, màu sắc hài hòa tinh tế và không hề phô trương lòe loẹt. Bạn là người mà bất cứ ai cũng cảm thấy dễ dàng tiếp cận và giãi bày tâm sự.",
            "social_style": "Phong cách giao tiếp của bạn cực kỳ khéo léo, lịch thiệp và luôn đặt sự tôn trọng người đối diện lên hàng đầu. Bạn là người lắng nghe xuất chúng, biết gật đầu đồng cảm, nói năng nhẹ nhàng và luôn chủ động tìm kiếm sự hòa hợp, tránh né những xung đột tranh cãi gay gắt.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 2 là 'sứ giả hòa nhã không tì vết'. Nguy cơ xung đột là bạn dễ bị người khác xem là nhu nhược, thiếu chính kiến, dễ bị lấn át hoặc bắt nạt. Nếu Linh hồn bên trong bạn mang năng lượng mạnh mẽ (như Linh hồn 1 hay 8), bạn sẽ cảm thấy bức bối vì vẻ ngoài quá hiền lành khiến người khác không đánh giá đúng tầm uy quyền và năng lực thực sự của bạn.",
            "qa_q": "Làm thế nào để người mang Nhân cách 2 giữ được sự hòa nhã mà vẫn toát lên uy tín và bản lĩnh vững vàng?",
            "qa_a": "Hãy rèn luyện 'Sự hòa nhã có ranh giới'. Khi giao tiếp, hãy giữ ánh mắt thẳng thắn, tư thế vững vàng và diễn đạt quan điểm cá nhân một cách dứt khoát, không dùng những từ ngữ hạ mình hay xin lỗi không cần thiết. Sự dịu dàng khi đi cùng sự kiên định sẽ tạo nên uy tín tuyệt đối.",
            "advice": "1. **Giữ ánh mắt kiên định khi giao tiếp:** Nhìn thẳng vào mắt đối phương với sự bình thản khi bày tỏ quan điểm của mình.\n2. **Hạn chế dùng từ xin lỗi không cần thiết:** Thay vì nói 'Xin lỗi đã làm phiền', hãy chuyển thành 'Cảm ơn bạn đã dành thời gian'.\n3. **Khẳng định ranh giới cá nhân:** Nói lời từ chối một cách lịch thiệp nhưng dứt khoát khi đối phương đưa ra yêu cầu vượt quá giới hạn."
        }
    },
    {
        "num": "3",
        "title_num": "3",
        "name": "Số 3 - Phong Thái Hài Hước, Thu Hút & Tràn Đầy Sức Sống",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 3 toát ra ấn tượng đầu tiên vô cùng rạng rỡ, hoạt bát, duyên dáng và tràn ngập sinh khí. Nụ cười tươi tắn, ánh mắt lấp lánh và gu thời trang bắt mắt, sành điệu giúp bạn luôn trở thành tâm điểm thu hút sự chú ý trong bất kỳ đám đông nào. Mọi người xung quanh luôn cảm thấy vui vẻ, phấn chấn và hào hứng khi ở bên cạnh bạn.",
            "social_style": "Phong cách giao tiếp xã hội của bạn cực kỳ sinh động, hoạt ngôn, dí dỏm và đầy tính lôi cuốn. Bạn có tài kể chuyện hấp dẫn, biết pha trò đúng lúc, sử dụng cử chỉ tay và biểu cảm gương mặt phong phú, biến bất kỳ chủ đề tẻ nhạt nào thành một câu chuyện hào hứng và thú vị.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 3 là 'hoạt náo viên vui vẻ'. Nguy cơ xung đột là bạn dễ bị đánh giá là người bề nổi, nông cạn, thích nói nhiều hơn làm hoặc thiếu nghiêm túc trong các vấn đề quan trọng. Nếu Linh hồn bên trong bạn có chiều sâu chiêm nghiệm (như Linh hồn 7 hay 9), bạn sẽ cảm thấy vô cùng kiệt sức khi luôn phải đóng vai người mang lại tiếng cười cho thiên hạ.",
            "qa_q": "Tại sao mọi người thường chỉ tìm đến tôi khi cần cuộc vui nhưng lại ít khi chia sẻ những chuyện hệ trọng hay công việc nghiêm túc?",
            "qa_a": "Bởi vì hình ảnh bên ngoài của bạn quá gắn liền với sự vui nhộn và giải trí. Hãy học cách tiết chế sự dí dỏm đúng bối cảnh, thể hiện sự lắng nghe sâu sắc và chia sẻ những góc nhìn chuyên môn nghiêm túc khi thảo luận công việc để xây dựng uy tín chuyên nghiệp.",
            "advice": "1. **Tiết chế sự hài hước đúng lúc:** Trong các cuộc họp nghiêm túc, tập trung lắng nghe và đưa ra ý kiến đóng góp có chiều sâu dữ liệu.\n2. **Chọn lọc trang phục chuyên nghiệp:** Mặc trang phục chỉn chu, thanh lịch khi xuất hiện trong các bối cảnh trang trọng.\n3. **Cho phép mình tĩnh lặng:** Không cần phải luôn là người bắt đầu câu chuyện trong đám đông, hãy thử đóng vai trò người quan sát thầm lặng."
        }
    },
    {
        "num": "4",
        "title_num": "4",
        "name": "Số 4 - Phong Thái Chỉnh Chu, Đáng Tin Cậy & Kỷ Luật Thép",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 4 tạo ra ấn tượng đầu tiên về một con người vô cùng nghiêm túc, đĩnh đạc, chuẩn mực và đáng tin cậy tuyệt đối. Bạn xuất hiện với phong thái đàng hoàng, phong cách ăn mặc truyền thống, gọn gàng, tối giản và lịch sự. Mọi người khi gặp bạn đều cảm nhận được sự vững chãi, an tâm và tính thực tế toát ra từ từng cử chỉ.",
            "social_style": "Phong cách giao tiếp của bạn rất súc tích, logic, chính xác và dựa trên dữ liệu/sự thật rõ ràng. Bạn luôn đúng giờ, tôn trọng các quy chuẩn, cam kết giữ trọn lời hứa và làm việc theo quy trình bài bản. Bạn không thích những lời hứa hẹn sáo rỗng hay những ý tưởng viển vông thiếu tính khả thi.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 4 là 'người bảo thủ nghiêm khắc'. Nguy cơ xung đột là bạn dễ bị xem là người khô khan, cứng nhắc, khó tính và thiếu lãng mạn. Nếu Linh hồn bên trong bạn khao khát tự do, phiêu lưu (như Linh hồn 3 hay 5), bạn sẽ cảm thấy ngột ngạt trong chính hình ảnh nghiêm trang, khuôn mẫu mà xã hội gán cho mình.",
            "qa_q": "Làm thế nào để người có Nhân cách 4 trở nên gần gũi, ấm áp hơn trong mắt bạn bè và đồng nghiệp?",
            "qa_a": "Hãy mở lòng đón nhận những ý kiến mới mẻ với nụ cười thân thiện, thực hành khen ngợi nỗ lực của người khác thay vì chỉ tập trung vào việc soi xét các lỗi sai chi tiết, và cho phép bản thân tham gia vào những cuộc trò chuyện đời thường không liên quan đến công việc.",
            "advice": "1. **Mỉm cười và thả lỏng cơ mặt:** Tập mỉm cười nhẹ nhàng khi lắng nghe người khác nói để tạo cảm giác cởi mở, dễ gần.\n2. **Khen ngợi trước, góp ý sau:** Khi nhận xét công việc của ai đó, hãy ghi nhận điểm tốt của họ trước khi chỉ ra điểm cần hoàn thiện.\n3. **Linh hoạt thử nghiệm cái mới:** Thử một phong cách ăn mặc mới mẻ hoặc đổi một quán cà phê mới để làm mềm bớt vẻ ngoài nghiêm nghị."
        }
    },
    {
        "num": "5",
        "title_num": "5",
        "name": "Số 5 - Phong Thái Phóng Khoáng, Năng Động & Đầy Sức Hút",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 5 toát lên ấn tượng đầu tiên cực kỳ trẻ trung, hiện đại, phóng khoáng và tràn đầy năng lượng phiêu lưu. Bạn sở hữu gu thời trang độc đáo, phá cách, thần thái tự do và sự cuốn hút bí ẩn khiến người khác tò mò muốn khám phá. Bạn bước vào một căn phòng với phong thái tự tin, linh hoạt và không bao giờ chịu lẫn vào đám đông.",
            "social_style": "Phong cách giao tiếp của bạn vô cùng cởi mở, tự nhiên, hào hứng và nhanh nhẹn. Bạn có thể dễ dàng bắt chuyện với bất kỳ ai, nhanh chóng hòa nhập vào mọi môi trường văn hóa mới và luôn mang đến những chủ đề mới lạ, cấp tiến và hấp dẫn.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 5 là 'kẻ phiêu lưu bất định'. Nguy cơ xung đột là bạn dễ bị người khác đánh giá là người bốc đồng, lông bông, khó cam kết lâu dài và thiếu sự ổn định đáng tin cậy. Nếu Linh hồn bên trong bạn mong muốn sự an toàn tổ ấm (như Linh hồn 4 hay 6), bạn sẽ thấy bất an khi vẻ ngoài quá xáo động khiến người khác e ngại gắn bó sâu sắc.",
            "qa_q": "Làm thế nào để người mang Nhân cách 5 tạo được sự tin cậy về tính cam kết dài hạn trong công việc và tình cảm?",
            "qa_a": "Hãy thể hiện sự nhất quán giữa lời nói và hành động. Trong công việc, hãy luôn đảm bảo hoàn thành đúng hạn các cam kết cốt lõi; trong tình cảm, hãy chủ động chia sẻ những kế hoạch tương lai rõ ràng để đối phương cảm nhận được sự nghiêm túc của bạn.",
            "advice": "1. **Thể hiện sự cam kết nhất quán:** Luôn giữ đúng lời hứa và hoàn thành đúng hạn các đầu việc đã nhận trước tập thể.\n2. **Tiết chế sự bốc đồng:** Lắng nghe trọn vẹn câu chuyện trước khi chuyển đổi chủ đề hoặc đưa ra phản hồi quá nhanh.\n3. **Cân bằng phong cách thời trang:** Kết hợp nét cá tính độc đáo với sự thanh lịch, chỉn chu phù hợp với từng hoàn cảnh giao tiếp."
        }
    },
    {
        "num": "6",
        "title_num": "6",
        "name": "Số 6 - Phong Thái Ấm Áp, Đáng Tin & Đậm Chất Gia Đình",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 6 toát lên ấn tượng đầu tiên vô cùng ấm áp, phúc hậu, chu đáo và đáng tin cậy như một người anh, người chị hoặc người cha, người mẹ mẫu mực. Bạn xuất hiện với phong cách ăn mặc thanh lịch, hài hòa, toát lên vẻ đẹp thẩm mỹ tinh tế và sự chăm chút cẩn thận. Mọi người khi gặp bạn đều cảm nhận được sự che chở, an tâm và muốn tìm đến bạn để nương tựa.",
            "social_style": "Phong cách giao tiếp của bạn rất ân cần, nhẹ nhàng, lịch thiệp và luôn quan tâm đến sự thoải mái, hạnh phúc của những người xung quanh. Bạn là người chủ động hỏi thăm sức khỏe, chăm chút từng ly từng tí và tạo dựng một bầu không khí thân thiện, ấm cúng như trong một gia đình.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 6 là 'người bảo bọc toàn năng'. Nguy cơ xung đột là bạn dễ bị xem là người hay lo chuyện bao đồng, can thiệp quá sâu vào đời tư của người khác hoặc có xu hướng cằn nhằn áp đặt. Nếu Linh hồn bên trong bạn là người độc lập, tự do (như Linh hồn 1 hay 5), bạn sẽ cảm thấy nghẹt thở vì mọi người luôn mặc định bạn phải gánh vác trách nhiệm chăm sóc.",
            "qa_q": "Tại sao mọi người xung quanh thường tự động dựa dẫm, đẩy hết trách nhiệm cho tôi và kỳ vọng tôi phải luôn chăm sóc họ?",
            "qa_a": "Bởi vì vẻ ngoài quá đỗi chu đáo và thói quen luôn chủ động nhận phần việc chăm sóc của Nhân cách 6 đã vô tình tạo thói quen ỷ lại cho người khác. Hãy học cách lùi lại một bước, chỉ giúp đỡ khi được yêu cầu và trao cơ hội cho người khác tự chịu trách nhiệm về cuộc đời họ.",
            "advice": "1. **Thiết lập ranh giới giúp đỡ:** Chỉ đưa ra lời khuyên hoặc hỗ trợ khi đối phương thực sự mở lời nhờ cậy.\n2. **Tập trung chăm sóc bản thân:** Dành thời gian làm đẹp, thư giãn và bồi dưỡng phong thái tự tin độc lập của chính mình.\n3. **Buông bỏ sự cằn nhằn:** Thay thế những lời nhắc nhở lo âu bằng sự tin tưởng và những lời khích lệ tích cực."
        }
    },
    {
        "num": "7",
        "title_num": "7",
        "name": "Số 7 - Phong Thái Trầm Lặng, Uyên Bác & Đầy Chiều Sâu Bí Ẩn",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 7 toát ra ấn tượng đầu tiên vô cùng trầm tĩnh, kín đáo, sâu sắc và toát lên vẻ uyên bác của một bậc trí giả. Ánh mắt của bạn sắc sảo như thấu suốt tâm can người đối diện, phong thái độc lập, nhã nhặn và mang một nét bí ẩn cuốn hút. Bạn không bao giờ vội vã, luôn toát lên vẻ đĩnh đạc của một người nắm giữ nhiều tri thức sâu xa.",
            "social_style": "Phong cách giao tiếp của bạn là 'nói ít nhưng câu từ đắt giá'. Bạn suy nghĩ cực kỳ thấu đáo trước khi phát ngôn, nói năng từ tốn, điềm đạm và thích thảo luận về những chủ đề chuyên sâu, khoa học, triết học hơn là những câu chuyện phiếm hời hợt. Bạn là người quan sát thầm lặng nhưng nắm bắt toàn bộ cục diện.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 7 là 'tòa tháp ngà tri thức cô độc'. Nguy cơ xung đột là bạn dễ bị người khác hiểu lầm là người lạnh lùng, xa cách, kiêu ngạo trí tuệ hoặc lập dị khó gần. Nếu Linh hồn bên trong bạn khao khát sự ấm áp, yêu thương (như Linh hồn 2 hay 6), bạn sẽ cảm thấy vô cùng đau khổ vì vẻ ngoài quá lạnh lùng đẩy những người yêu thương ra xa.",
            "qa_q": "Làm thế nào để người có Nhân cách 7 kết nối hòa hợp với xã hội mà không phải gồng mình giả tạo?",
            "qa_a": "Hãy sử dụng sự ấm áp của ánh mắt và nụ cười chân thành để làm cầu nối. Bạn không cần phải nói nhiều hay tỏ ra ồn ào; chỉ cần chủ động cất lời chào hỏi trước, lắng nghe thấu cảm và chia sẻ những câu chuyện giản dị, mọi người sẽ cảm nhận được sự ấm áp từ bên trong bạn.",
            "advice": "1. **Chủ động cất lời chào hỏi:** Hãy là người đầu tiên mỉm cười và chào hỏi khi gặp gỡ đồng nghiệp hoặc bạn bè.\n2. **Đơn giản hóa cách diễn đạt:** Trình bày những ý tưởng sâu sắc bằng ngôn ngữ bình dị, dễ hiểu để mọi người dễ tiếp cận.\n3. **Thể hiện sự ấm áp qua hành động nhỏ:** Mời một tách trà hoặc gửi một cuốn sách hay cho người bạn trân quý."
        }
    },
    {
        "num": "8",
        "title_num": "8",
        "name": "Số 8 - Phong Thái Quyền Uy, Sang Trọng & Khí Chất Doanh Nhân",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 8 toát lên ấn tượng đầu tiên vô cùng quyền uy, đĩnh đạc, sang trọng và toát ra thần thái của một nhà lãnh đạo hoặc doanh nhân thành đạt. Bạn xuất hiện với phong thái đỉnh đạc, trang phục cao cấp chỉn chu, tác phong chuyên nghiệp và toát lên sức mạnh của người làm chủ cuộc chơi. Người đối diện ngay lập tức cảm nhận được sự uy quyền và năng lực giải quyết việc lớn từ bạn.",
            "social_style": "Phong cách giao tiếp của bạn cực kỳ tự tin, mạnh mẽ, trọng tâm, dứt khoát và hướng thẳng tới kết quả. Bạn đàm phán sắc sảo, có năng lực thuyết phục tự nhiên và luôn toát ra khí chất của người điều hành chiến lược, kiểm soát toàn bộ tình hình.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 8 là 'chiếc áo giáp quyền lực và tiền bạc'. Nguy cơ xung đột là bạn dễ bị xem là người thực dụng, lạnh lùng, áp đặt, coi trọng địa vị hơn tình cảm hoặc gây cảm giác sợ hãi cho người yếu thế hơn. Nếu Linh hồn bên trong bạn giàu lòng vị tha và trắc ẩn (như Linh hồn 9 hay 2), bạn sẽ dằn vặt vì vẻ ngoài quá cứng rắn khiến người khác hiểu sai tâm đức của mình.",
            "qa_q": "Làm thế nào để người có Nhân cách 8 duy trì phong thái lãnh đạo uy quyền mà vẫn được mọi người yêu mến, gần gũi?",
            "qa_a": "Hãy kết hợp 'Uy quyền lãnh đạo' với 'Trái tim phụng sự'. Người lãnh đạo vĩ đại nhất là người dùng sức mạnh của mình để nâng đỡ, bảo vệ và trao quyền cho người khác. Hãy thêm sự lắng nghe chân thành và sự bao dung vào phong cách điều hành của bạn.",
            "advice": "1. **Thêm sự ấm áp vào phong cách điều hành:** Dành lời khen ngợi và động viên chân thành cho sự cố gắng của cấp dưới/đồng nghiệp.\n2. **Lắng nghe mà không phán xét:** Dành thời gian lắng nghe tâm tư của người khác mà không ngắt lời hay áp đặt tiêu chuẩn hiệu suất.\n3. **Thể hiện sự khiêm nhường:** Để người khác tỏa sáng trong các thành công chung của tập thể."
        }
    },
    {
        "num": "9",
        "title_num": "9",
        "name": "Số 9 - Phong Thái Hào Hiệp, Khoan Dung & Khí Chất Trượng Phu",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 9 tạo ra ấn tượng đầu tiên vô cùng đàng hoàng, độ lượng, quý phái và toát lên khí chất hào hiệp của bậc quân tử vị tha. Bạn có phong thái ung dung tự tại, ánh mắt bao dung, cử chỉ hào phóng và phong cách ăn mặc đĩnh đạc, sang trọng một cách tự nhiên. Mọi người khi gặp bạn đều cảm thấy an tâm, kính trọng và dễ dàng trao gửi niềm tin tuyệt đối.",
            "social_style": "Phong cách giao tiếp của bạn rất nhã nhặn, cởi mở, chân thành và giàu lòng nhân ái. Bạn luôn hướng các cuộc trò chuyện về những giá trị tốt đẹp, tinh thần đoàn kết và lợi ích chung của cộng đồng. Bạn là người sẵn sàng đứng ra bảo vệ kẻ yếu và đấu tranh cho sự công bằng.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 9 là 'bậc trượng phu hoàn hảo'. Nguy cơ xung đột là bạn dễ bị xem là người lý tưởng hóa, xa rời thực tế hoặc bị kẻ xấu lợi dụng vẻ ngoài tốt bụng, hào phóng để trục lợi. Nếu Linh hồn bên trong bạn thực tế (như Linh hồn 4 hay 8), bạn sẽ cảm thấy mâu thuẫn vì vẻ ngoài quá hào hiệp khiến bạn khó từ chối những đòi hỏi vô lý của người khác.",
            "qa_q": "Làm thế nào để người mang Nhân cách 9 giữ được phong thái hào hiệp, vị tha mà không bị kẻ xấu lợi dụng?",
            "qa_a": "Hãy trang bị 'Trí tuệ tỉnh thức' đi cùng lòng tốt. Sự hào hiệp chân chính không đồng nghĩa với việc nuông chiều sự ỷ lại. Hãy kiểm chứng kỹ thông tin trước khi giúp đỡ, đặt ra những tiêu chuẩn rõ ràng và dũng cảm nói lời từ chối với những yêu cầu thiếu minh bạch.",
            "advice": "1. **Cho đi có chọn lọc và trí tuệ:** Giúp đỡ đúng người, đúng thời điểm và hướng tới việc giúp họ tự lập thay vì cho không biếu không.\n2. **Kết hợp lý tưởng với thực tế:** Đưa ra các giải pháp hành động cụ thể, có thể đo lường được thay vì chỉ nói về tầm nhìn vĩ mô.\n3. **Giữ vững sự chính trực:** Luôn là tấm gương sáng về đạo đức và nhân cách trong mọi môi trường bạn hiện diện."
        }
    },
    {
        "num": "11",
        "title_num": "11",
        "name": "Số 11 - Phong Thái Siêu Nhiên, Tinh Khiết & Đầy Cảm Hứng",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 11 toát lên một ấn tượng đầu tiên vô cùng đặc biệt: thanh thoát, tinh tế, thánh thiện và mang một trường năng lượng an lành, thuần khiết lạ thường. Ánh mắt của bạn sáng ngời, nhạy cảm và toát lên vẻ huyền bí của một người có trực giác siêu phàm. Mọi người khi tiếp xúc với bạn đều cảm thấy tâm trí được dịu lại và được truyền cảm hứng mạnh mẽ.",
            "social_style": "Phong cách giao tiếp của bạn rất nhẹ nhàng, sâu lắng, mang tính khích lệ và thức tỉnh nhận thức. Bạn nói chuyện bằng sự chân thành mộc mạc nhưng lời nói lại có sức lay động sâu sắc tới tâm can người nghe, giúp họ nhìn thấy những giá trị tốt đẹp bên trong chính mình.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 11 là 'sứ giả tâm linh tách biệt'. Nguy cơ xung đột là bạn dễ bị người khác xem là người lập dị, 'ở trên mây', quá nhạy cảm hoặc xa rời thực tế đời thường. Sự khác biệt về tần số năng lượng có thể khiến bạn cảm thấy lạc lõng giữa môi trường xã hội ồn ào xô bồ.",
            "qa_q": "Làm thế nào để người mang Nhân cách 11 hòa nhập vào đời sống xã hội thường nhật mà vẫn giữ được sự tinh khiết tâm hồn?",
            "qa_a": "Hãy học cách diễn đạt những ý niệm tâm linh và trực giác sâu sắc bằng ngôn ngữ đời thường giản dị, gần gũi. Hãy sống chan hòa, thực tế và dùng tình yêu thương chân thành để kết nối với mọi người trong những công việc bình dị nhất.",
            "advice": "1. **Giao tiếp bằng ngôn ngữ đời thường:** Truyền tải thông điệp tích cực bằng những ví dụ gần gũi, thực tế và dễ áp dụng.\n2. **Ăn mặc lịch sự, thanh nhã:** Chọn trang phục màu sắc tươi sáng, nhẹ nhàng để lan tỏa năng lượng bình an.\n3. **Thực hành hiện diện trọn vẹn:** Tập trung hoàn toàn vào giây phút hiện tại khi trò chuyện với người đối diện."
        }
    },
    {
        "num": "22",
        "title_num": "22",
        "name": "Số 22 - Phong Thái Uy Dũng Của Bậc Thầy Kiến Tạo Vĩ Đại",
        "content": {
            "first_impression": "Người mang Chỉ số Nhân cách 22 toát ra ấn tượng đầu tiên cực kỳ choáng ngợp: vừa có tầm nhìn vĩ mô của một nhà lãnh đạo thế giới, vừa có sự vững chãi, thực tế của một tổng công trình sư vĩ đại. Bạn xuất hiện với phong thái uy dũng, quyền năng, đĩnh đạc và toát lên năng lực kiến tạo những điều phi thường. Mọi người khi gặp bạn đều cảm nhận được tầm vóc khổng lồ và sự tin cậy tuyệt đối.",
            "social_style": "Phong cách giao tiếp của bạn kết hợp hoàn hảo giữa tầm nhìn chiến lược dài hạn và các giải pháp thực thi chi tiết, chính xác. Bạn nói chuyện với sự tự tin của người nắm giữ chìa khóa thành công của các đại dự án, luôn truyền cảm hứng cho mọi người cùng chung tay xây dựng những công trình lớn.",
            "mask_conflict": "Mặt nạ xã hội của Nhân cách 22 là 'người khổng lồ không tì vết'. Nguy cơ xung đột là bạn dễ tạo ra áp lực và cảm giác tự ti, choáng ngợp cho những người xung quanh vì tiêu chuẩn và kỳ vọng của bạn quá cao. Người khác có thể cảm thấy mình quá nhỏ bé hoặc e ngại tiếp cận bạn.",
            "qa_q": "Làm thế nào để người mang Nhân cách 22 dẫn dắt tập thể mà không làm người khác cảm thấy bị áp lực, lép vế?",
            "qa_a": "Hãy biết 'Hạ thấp tầm mắt để nâng người khác lên'. Dù tầm nhìn của bạn ở quy mô vĩ đại, hãy luôn thể hiện sự kiên nhẫn, ghi nhận từng đóng góp nhỏ bé của cộng sự và biến những mục tiêu khổng lồ thành những nhiệm vụ vừa sức để mọi người cùng hào hứng tham gia.",
            "advice": "1. **Ghi nhận và động viên từng bước tiến nhỏ:** Khích lệ sự nỗ lực của cộng sự dù kết quả chưa đạt tới độ hoàn hảo tuyệt đối.\n2. **Thể hiện sự kiên nhẫn và bao dung:** Lắng nghe và hướng dẫn những người có tốc độ thực thi chậm hơn mình.\n3. **Giữ phong thái khiêm nhường của bậc đại trí:** Luôn nhớ rằng quyền năng vĩ đại nhất là quyền năng phục vụ và nâng đỡ nhân loại."
        }
    }
]

all_personality_markdown = "# TỔNG HỢP 11 CON SỐ NHÂN CÁCH (PERSONALITY NUMBERS) - THẦN SỐ HỌC PYTHAGORAS\n\n"

for doc in personality_docs:
    num_val = doc["num"]
    c = doc["content"]
    
    md = f"""---
id: "numerology-personality-{num_val}"
category: "personality_number"
indicator_name: "Nhân cách"
indicator_key: "personality"
number_value: "{num_val}"
keywords: ["nhân cách {num_val}", "chỉ số nhân cách {num_val}", "personality {num_val}", "ấn tượng bên ngoài {num_val}", "phong thái số {num_val}"]
title: "Hình Ảnh Thể Hiện Xã Hội Của Con Số Nhân Cách {num_val}"
---

# Hình Ảnh Thể Hiện Xã Hội Của Con Số Nhân Cách {num_val}

## Ấn Tượng Đầu Tiên Và Thần Thái Bên Ngoài Của Nhân Cách {num_val}
{c['first_impression']}

## Phong Cách Giao Tiếp Và Ứng Xử Xã Hội Của Nhân Cách {num_val}
{c['social_style']}

## Mặt Nạ Xã Hội Và Nguy Cơ Xung Đột Giữa Vẻ Ngoài Với Bản Chất Nội Tâm
{c['mask_conflict']}

## Các Câu Hỏi Tra Cứu Thường Gặp Về Chỉ Số Nhân Cách {num_val} (Semantic Q&A)
- **Q: {c['qa_q']}**
  - **A:** {c['qa_a']}
- **Q: Làm sao để người mang Nhân cách {num_val} xây dựng phong cách chân thực và thu hút?**
  - **A:** {c['advice']}

## Lời Khuyên Xây Dựng Phong Cách Chân Thực Cho Người Mang Nhân Cách {num_val}
{c['advice']}
"""
    
    filename = f"personality_{num_val}.md"
    filepath = os.path.join(knowledge_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md.strip() + "\n")
    print(f"Successfully generated: {filename}")
    all_personality_markdown += md.strip() + "\n\n---\n\n"

all_filepath = os.path.join(knowledge_dir, "personality_all.md")
with open(all_filepath, "w", encoding="utf-8") as f:
    f.write(all_personality_markdown.strip() + "\n")
print("Successfully generated: personality_all.md")
print("DONE: All 11 Personality Markdown files generated successfully!")
