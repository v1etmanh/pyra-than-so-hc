# -*- coding: utf-8 -*-
import os

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
os.makedirs(knowledge_dir, exist_ok=True)

balance_docs = [
    {
        "num": "1",
        "title_num": "1",
        "name": "Số 1 - Chủ Động Tự Lực & Hành Động Quyết Đoán",
        "content": {
            "defense": "Khi đối mặt với các tình huống khủng hoảng, xung đột hoặc áp lực bất ngờ, phản ứng tự vệ vô thức của người mang Con số Cân bằng 1 (Balance 1 - tính từ chữ cái đầu tiên trong họ tên) là lập tức gạt bỏ sự phụ thuộc, thu mình vào trạng thái tự lực cánh sinh và tự xông lên gánh vác toàn bộ trách nhiệm. Bạn có xu hướng muốn tự mình giải quyết vấn đề một cách nhanh chóng mà không cần bất kỳ sự trợ giúp nào từ người xung quanh.",
            "stress_triggers": "Những phản ứng tiêu cực cần tuyệt đối tránh khi bị áp lực: Trở nên hung hăng, nóng nảy, áp đặt độc đoán lên người khác, đổ lỗi cho sự chậm trễ của tập thể hoặc vội vã đưa ra các quyết định liều lĩnh, bốc đồng chỉ để chứng minh quyền kiểm soát tình hình.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Sự tự chủ nội tâm vững vàng. Hãy tự nhắc nhở mình: 'Mình có đầy đủ bản lĩnh và trí tuệ để vượt qua thử thách này. Nhưng để chiến thắng trọn vẹn, mình cần sự bình tĩnh và trí tuệ tập thể chứ không phải sự vội vã đơn độc'.",
            "qa_q": "Tại sao mỗi khi gặp chuyện căng thẳng hoặc biến cố, tôi thường có xu hướng muốn gạt hết mọi người ra và tự làm một mình?",
            "qa_a": "Bởi vì cơ chế tự vệ của Số Cân bằng 1 gắn liền với nỗi sợ mất quyền kiểm soát và sợ bị người khác làm hỏng việc. Hãy hiểu rằng: Tìm kiếm sự hỗ trợ hoặc lắng nghe ý kiến của cộng sự không làm giảm đi uy tín lãnh đạo của bạn, mà trái lại giúp bạn ra quyết định sáng suốt và toàn diện hơn.",
            "quick_zen": "1. **Nguyên tắc khoảng dừng 10 giây:** Hít một hơi thật sâu, đếm chậm từ 1 đến 10 trước khi trả lời email hoặc phát ngôn trong lúc giận dữ.\n2. **Liệt kê 3 phương án hành động khách quan ra giấy:** Viết rõ ưu/nhược điểm của từng phương án trước khi chọn giải pháp thực thi.\n3. **Uống một ly nước lọc lớn:** Tập trung cảm nhận dòng nước mát chảy qua cổ họng để hạ nhiệt cơn nóng giận tức thì."
        }
    },
    {
        "num": "2",
        "title_num": "2",
        "name": "Số 2 - Lắng Nghe Thấu Cảm & Tìm Kiếm Giải Pháp Hòa Nhã",
        "content": {
            "defense": "Khi gặp phải xung đột gay gắt hoặc biến cố bất ngờ, phản ứng tự vệ vô thức của người mang Con số Cân bằng 2 là co cụm, nhạy cảm quá mức, né tránh va chạm hoặc tìm kiếm sự chở che, an ủi từ một người thân tín. Bạn rất sợ những cuộc cãi vã lớn tiếng và dễ cảm thấy hoang mang, mất phương hướng khi bầu không khí bị xáo trộn.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị stress: Tự biến mình thành nạn nhân yếu đuối, kìm nén uất ức dẫn đến suy sụp tinh thần, nhượng bộ mù quáng từ bỏ quyền lợi chính đáng chỉ để dĩ hòa vi quý, hoặc rơi vào suy diễn tiêu cực về thái độ của đối phương.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Nhận thức rõ ràng rằng 'Cảm xúc và hành vi tiêu cực của người khác là bài học của họ, không phải là trách nhiệm hay giá trị của mình'. Trú ẩn trong sự bình an nội tâm tự thân là nơi an toàn nhất.",
            "qa_q": "Làm thế nào để người mang Số Cân bằng 2 không bị năng lượng tiêu cực của người khác nhấn chìm khi xảy ra tranh cãi?",
            "qa_a": "Hãy áp dụng kỹ thuật 'Tách mình khỏi dòng sông cảm xúc'. Hãy hình dung bạn đang đứng trên bờ sông quan sát dòng nước cuộn trào của cảm xúc mà không nhảy xuống dòng nước đó. Hãy giữ khoảng cách tâm lý và dùng sự dịu dàng kiên định để làm dịu tình hình.",
            "quick_zen": "1. **Đặt tay lên luân xa tim:** Đặt bàn tay phải lên ngực áo, hít thở sâu 3 nhịp và thầm nhủ: 'Tôi bình an, vững chãi và an toàn trong chính tôi'.\n2. **Tạm lùi lại khỏi không gian xung đột:** Nhẹ nhàng xin phép rời khỏi cuộc tranh cãi 10 phút để rửa mặt và lấy lại thăng bằng.\n3. **Nghe một bản nhạc êm dịu:** Nghe một điệu nhạc thiền hoặc tiếng nước chảy để cân bằng lại hệ thần kinh nhạy cảm."
        }
    },
    {
        "num": "3",
        "title_num": "3",
        "name": "Số 3 - Biểu Đạt Cảm Xúc & Hài Hước Hóa Nghịch Cảnh",
        "content": {
            "defense": "Khi đối diện với khủng hoảng hoặc căng thẳng, phản ứng tự vệ vô thức của người mang Con số Cân bằng 3 là nói nhiều hơn bình thường, tìm cách giãi bày cảm xúc liên tục với bất kỳ ai xung quanh, hoặc dùng sự hài hước, đùa cợt tếu táo để né tránh nhìn thẳng vào mức độ nghiêm trọng của vấn đề.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị áp lực: Buông lời mỉa mai cay độc làm tổn thương người khác, sa đà vào buôn chuyện thị phi để xả bớt ức chế, nói năng bốc đồng thiếu suy nghĩ hoặc chìm đắm vào kịch tính cảm xúc (drama) làm vấn đề thêm trầm trọng.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Sự lạc quan tỉnh thức và niềm tin vào sức mạnh sáng tạo. Hãy tự nhủ: 'Mọi nút thắt đều có giải pháp sáng tạo để tháo gỡ. Mình cần bình tĩnh để trí thông minh của mình hoạt động hiệu quả nhất'.",
            "qa_q": "Tại sao mỗi khi bị căng thẳng hoặc tức giận, tôi lại có xu hướng dùng lời nói châm chọc làm tổn thương người khác?",
            "qa_a": "Bởi vì năng lượng của số 3 khi bị dồn nén sẽ tìm đường thoát ra thông qua ngôn từ. Khi thiếu sự định tâm, chiếc van ngôn từ này sẽ biến thành vũ khí sát thương. Hãy học cách xả van cảm xúc bằng việc viết lách một mình trước khi cất lời đối thoại.",
            "quick_zen": "1. **Viết xả cảm xúc tự do (Freewriting):** Dành 5 phút viết toàn bộ những cảm xúc giận dữ, ấm ức ra một tờ giấy trắng rồi xé bỏ.\n2. **Đi dạo hít thở không khí tươi mới:** Đi bộ nhanh ngoài trời 10 phút để giải phóng năng lượng ức chế trong cơ thể.\n3. **Thực hành ái ngữ trước khi đối thoại:** Tự nhắc nhở bản thân: 'Mục đích của cuộc nói chuyện này là giải quyết vấn đề, không phải để thắng thua'."
        }
    },
    {
        "num": "4",
        "title_num": "4",
        "name": "Số 4 - Phân Tích Logic Thực Tế & Chuẩn Hóa Quy Trình",
        "content": {
            "defense": "Khi gặp phải biến cố bất ngờ hoặc sự hỗn loạn, phản ứng tự vệ vô thức của người mang Con số Cân bằng 4 là bám víu vào các quy tắc cứng nhắc, xem xét lại từng chi tiết nhỏ, đòi hỏi mọi thứ phải có số liệu và bằng chứng rõ ràng. Bạn có xu hướng muốn kiểm soát chặt chẽ quy trình để khôi phục lại cảm giác trật tự và an toàn.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị stress: Trở nên khó tính, bảo thủ, cay nghiệt soi mói lỗi lầm của người khác, đóng băng hành động vì sợ mắc sai lầm (tê liệt vì phân tích), hoặc kìm nén cảm xúc dẫn đến chứng đau nửa đầu và mất ngủ.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Sự thật và các giải pháp thực tế từng bước một. Hãy tự nhủ: 'Sự hỗn loạn chỉ là tạm thời. Khi mình bình tĩnh chia nhỏ vấn đề và lập kế hoạch thực hiện từng bước, mọi việc sẽ vào đúng quỹ đạo'.",
            "qa_q": "Làm thế nào để người mang Số Cân bằng 4 không bị tê liệt vì phân tích (Analysis Paralysis) khi khủng hoảng xảy ra đột ngột?",
            "qa_a": "Hãy áp dụng nguyên tắc 'Hành động nhỏ để phá vỡ sự bế tắc'. Đừng cố giải quyết toàn bộ mớ hỗn độn cùng lúc; hãy chọn ra một việc nhỏ nhất, rõ ràng nhất có thể làm ngay bây giờ để tạo đà chuyển động cho hệ thống.",
            "quick_zen": "1. **Lập Checklist 3 bước khẩn cấp:** Viết ra: 1. Việc cấp bách nhất cần làm ngay là gì? 2. Rủi ro xấu nhất là gì? 3. Kế hoạch dự phòng là gì?\n2. **Thả lỏng cơ thể (Body Scan):** Ngồi thẳng lưng, thả lỏng vai, thả lỏng hàm và hít thở sâu trong 3 phút.\n3. **Dọn dẹp nhanh bàn làm việc:** Sắp xếp lại mặt bàn gọn gàng trong 5 phút để tạo cảm giác trật tự và kiểm soát không gian."
        }
    },
    {
        "num": "5",
        "title_num": "5",
        "name": "Số 5 - Thích Ứng Linh Hoạt & Tìm Kiếm Không Gian Đổi Mới",
        "content": {
            "defense": "Khi đối mặt với khủng hoảng, sự bế tắc hoặc áp lực gò bó, phản ứng tự vệ vô thức của người mang Con số Cân bằng 5 là tìm cách trốn chạy khỏi hiện trường căng thẳng, muốn thay đổi ngay lập tức mọi thứ xung quanh hoặc tìm đến các thú vui kích thích giác quan để giải tỏa sự ngột ngạt.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị stress: Bốc đồng hủy hoại các cam kết quan trọng, lạm dụng chất kích thích, mua sắm quá tay, lái xe liều lĩnh hoặc nổi loạn vô cớ phá vỡ các mối quan hệ tốt đẹp chỉ vì cảm xúc nhất thời.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Khả năng thích ứng linh hoạt và niềm tin rằng 'Mọi biến đổi đều là cơ hội để khai mở những chân trời mới tốt đẹp hơn'. Hãy sử dụng trí thông minh linh hoạt để xoay chuyển tình thế thay vì trốn chạy.",
            "qa_q": "Tại sao mỗi khi gặp bế tắc trong công việc hoặc tình cảm, tôi luôn có thôi thúc muốn bỏ cuộc hoặc đi du lịch thật xa để trốn tránh?",
            "qa_a": "Bởi vì cơ chế tự vệ của Số Cân bằng 5 phản ứng rất mạnh với cảm giác bị giam cầm. Tuy nhiên, trốn chạy ngoại cảnh không giải quyết được gốc rễ vấn đề. Hãy học cách dừng lại, đối diện và tìm kiếm giải pháp đổi mới ngay trong hoàn cảnh hiện tại.",
            "quick_zen": "1. **Tập một bài thể dục cường độ cao 10 phút:** Nhảy dây, hít đất hoặc chạy bộ nhanh để đốt cháy cortisol và xả bỏ năng lượng bực bội.\n2. **Kỹ thuật thở 4-7-8:** Hít vào bằng mũi 4 giây, giữ hơi 7 giây và thở mạnh ra bằng miệng 8 giây để hạ nhịp tim cấp tốc.\n3. **Thay đổi góc nhìn:** Tự hỏi bản thân: 'Nếu xem biến cố này là một trò chơi thử thách thú vị, mình sẽ vượt qua nó như thế nào?'."
        }
    },
    {
        "num": "6",
        "title_num": "6",
        "name": "Số 6 - Trách Nhiệm Yêu Thương & Vỗ Về Tổ Ấm",
        "content": {
            "defense": "Khi xảy ra biến cố trong gia đình hoặc tổ chức, phản ứng tự vệ vô thức của người mang Con số Cân bằng 6 là tự động gánh hết mọi trách nhiệm về phía mình, cố gắng bao bọc che chở cho tất cả mọi người và đóng vai người cứu rỗi toàn năng để khôi phục lại sự hòa thuận.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị áp lực: Rơi vào cái bẫy 'sáng tạo tiêu cực' (lo âu thêu dệt nên những kịch bản tồi tệ nhất), cằn nhằn áp đặt, kiểm soát người thân thái quá hoặc tự dằn vặt bản thân bằng cảm giác tội lỗi vô lý.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Tình yêu thương chân thành bắt đầu từ chính mình. Hãy tự nhủ: 'Mình không thể cứu cả thế giới nếu bản thân mình đang kiệt quệ. Mỗi người đều có bài học trưởng thành riêng, việc của mình là yêu thương và chúc phúc chứ không phải gánh nghiệp thay họ'.",
            "qa_q": "Làm sao để người có Số Cân bằng 6 không tự nhận lỗi và dằn vặt bản thân khi các biến cố của người thân xảy ra?",
            "qa_a": "Hãy phân định rõ ràng giữa 'Trách nhiệm yêu thương' và 'Trách nhiệm kiểm soát'. Bạn chỉ chịu trách nhiệm về thái độ và hành động của chính mình. Hãy trao cho người thân quyền tự chịu trách nhiệm về cuộc đời của họ.",
            "quick_zen": "1. **Uống một tách trà thảo mộc ấm:** Thưởng thức chậm rãi một tách trà hoa cúc hoặc trà gừng ấm để xoa dịu tâm trí.\n2. **Tự hỏi câu hỏi phân định:** 'Vấn đề này có thực sự thuộc phạm vi kiểm soát trực tiếp của mình không?'. Nếu không, hãy buông xả.\n3. **Chăm sóc bản thân trước:** Tắm nước ấm, thoa kem dưỡng hoặc nằm nghỉ ngơi 15 phút trước khi tiếp tục hỗ trợ người khác."
        }
    },
    {
        "num": "7",
        "title_num": "7",
        "name": "Số 7 - Tĩnh Lặng Chiêm Nghiệm & Đào Sâu Bản Chất",
        "content": {
            "defense": "Khi đối mặt với khủng hoảng hoặc sự căng thẳng, phản ứng tự vệ vô thức của người mang Con số Cân bằng 7 là lập tức rút lui hoàn toàn vào không gian riêng, cắt đứt liên lạc, giữ im lặng tuyệt đối và tự mình đào sâu suy ngẫm để tìm ra nguyên nhân gốc rễ và bản chất của vấn đề.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị áp lực: Trở nên hoài nghi cay đắng, suy diễn tiêu cực, coi thường ý kiến đóng góp của người khác, sống cô độc lãnh đạm kéo dài hoặc chìm đắm vào cảm giác bất mãn trước sự bất toàn của thế gian.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Trí tuệ chiêm nghiệm và niềm tin vào quy luật nhân quả tiến hóa. Hãy tự nhủ: 'Mọi biến cố xảy ra đều chứa đựng một bài học tiến hóa tâm thức sâu sắc. Khi mình nhìn thấu bản chất, sự bình an sẽ tự động trở lại'.",
            "qa_q": "Tại sao mỗi khi gặp chuyện thất vọng hoặc bế tắc, tôi lại muốn tắt điện thoại, ở một mình trong phòng tối và không muốn nói chuyện với ai?",
            "qa_a": "Bởi vì Số Cân bằng 7 cần sự tĩnh lặng tuyệt đối để tái tạo trường năng lượng và xử lý thông tin nội tâm. Đây là cơ chế lành mạnh, tuy nhiên đừng để khoảng lặng kéo dài thành sự xa lánh thực tế. Hãy đặt ra giới hạn thời gian tĩnh tâm rồi chủ động kết nối lại.",
            "quick_zen": "1. **Thiền định tĩnh lặng 15 phút:** Ngồi trong không gian yên tĩnh, tập trung vào hơi thở vào - ra tự nhiên ở đầu mũi.\n2. **Ghi chép đúc kết bài học (Journaling):** Viết ra câu trả lời cho câu hỏi: 'Bài học sâu sắc nhất mà vũ trụ muốn gửi đến mình qua sự kiện này là gì?'.\n3. **Hòa mình vào thiên nhiên:** Đi dạo dưới bóng cây hoặc ngắm nhìn bầu trời để mở rộng dung lượng tâm trí."
        }
    },
    {
        "num": "8",
        "title_num": "8",
        "name": "Số 8 - Kiểm Soát Thực Tế & Tái Thiết Nguồn Lực",
        "content": {
            "defense": "Khi đối mặt với khủng hoảng, mất mát hoặc sự đe dọa về tài chính/quyền hạn, phản ứng tự vệ vô thức của người mang Con số Cân bằng 8 là siết chặt quyền kiểm soát, tỏ ra cực kỳ cứng rắn, tập trung vào giải quyết bài toán vật chất/dòng tiền và tìm cách chi phối toàn bộ tình hình bằng sức mạnh điều hành.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị áp lực: Cơn thịnh nộ lôi đình, áp đặt độc tài tàn nhẫn, dùng tiền bạc/quyền lực để trừng phạt hoặc thao túng người khác, và sự cố chấp bảo thủ không chịu thừa nhận tổn thất.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Bản lĩnh kiên cường và tư duy giải quyết vấn đề dựa trên hiệu quả thực tế và sự công bằng chính trực. Hãy tự nhủ: 'Mất tiền là mất ít, mất uy tín là mất nhiều, mất bình tĩnh là mất tất cả. Mình phải giữ cái đầu lạnh và trái tim ấm'.",
            "qa_q": "Làm thế nào để người mang Số Cân bằng 8 không biến cơn giận dữ thành sự đàn áp độc đoán khi mọi việc không như ý muốn?",
            "qa_a": "Hãy áp dụng kỹ thuật 'Khoảng dừng chiến lược'. Người lãnh đạo quyền năng nhất là người làm chủ được cảm xúc của chính mình. Khi thấy cơn nóng giận dâng trào, hãy tạm dừng cuộc họp để lấy lại sự tỉnh táo trước khi ra bất kỳ quyết định chế tài nào.",
            "quick_zen": "1. **Kỹ thuật Khoảng dừng 5 phút:** Tạm dừng ngay cuộc đối thoại, đi rửa mặt bằng nước lạnh và hít thở sâu 5 lần.\n2. **Tập trung vào giải pháp hành động:** Đổi câu hỏi từ 'Ai đã làm sai việc này?' thành 'Hành động cụ thể nào cần làm ngay để giảm thiểu tổn thất?'.\n3. **Tập thể dục giải tỏa năng lượng:** Thực hiện một vài động tác giãn cơ hoặc đi bộ nhanh quanh văn phòng."
        }
    },
    {
        "num": "9",
        "title_num": "9",
        "name": "Số 9 - Bao Dung Vị Tha & Tầm Nhìn Toàn Cảnh",
        "content": {
            "defense": "Khi đối mặt với khủng hoảng, sự bất công hoặc hiểu lầm, phản ứng tự vệ vô thức của người mang Con số Cân bằng 9 là lùi lại một bước để quan sát bức tranh toàn cảnh, cố gắng tìm kiếm giải pháp nhân đạo nhất và có xu hướng dễ dàng tha thứ, bỏ qua lỗi lầm cho người khác.",
            "stress_triggers": "Những phản ứng tiêu cực cần tránh khi bị áp lực: Bi kịch hóa vấn đề, ôm giữ nỗi buồn trăn trở nhân thế, hy sinh mù quáng gánh chịu thiệt hại thay người khác hoặc thất vọng cay đắng đến mức buông xuôi, bất cần đời.",
            "anchor": "Mỏ neo tâm lý giúp bạn tĩnh tâm nhanh nhất: Lòng trắc ẩn bao la và tâm thế buông xả vô thường. Hãy tự nhủ: 'Mọi sự trên đời đến rồi sẽ đi theo quy luật vô thường. Khi mình giữ được tấm lòng rộng mở và sự vị tha thuần khiết, tâm hồn mình sẽ tự do tự tại'.",
            "qa_q": "Tại sao khi đối mặt với khủng hoảng tôi thường bỏ qua cho người khác nhưng trong lòng lại đau đáu, trăn trở không nguôi?",
            "qa_a": "Bởi vì bạn tha thứ bằng lý trí bề ngoài nhưng tiềm thức vẫn chưa thực sự buông xả tổn thương. Hãy thực hành tha thứ triệt để từ sâu thẳm trái tim và học cách chấp nhận sự bất toàn của con người như một phần tự nhiên của cuộc đời.",
            "quick_zen": "1. **Thực hành nghi thức Ho'oponopono:** Đọc thầm trong tâm 4 câu: 'Tôi xin lỗi - Xin hãy tha thứ cho tôi - Cảm ơn bạn - Tôi yêu bạn' để thanh tẩy cảm xúc tắc nghẽn.\n2. **Tập trung vào hành động phụng sự nhỏ:** Làm một việc tốt giản dị cho ai đó (tặng một món quà, giúp đỡ một người già) để chuyển hóa năng lượng tích cực.\n3. **Thiền buông xả:** Ngồi thả lỏng và quán tưởng mọi muộn phiền tan biến thành làn khói trắng bay về hư không."
        }
    }
]

all_balance_markdown = "# TỔNG HỢP 9 CON SỐ CÂN BẰNG (BALANCE NUMBERS) - THẦN SỐ HỌC PYTHAGORAS\n\n"

for doc in balance_docs:
    num_val = doc["num"]
    c = doc["content"]
    
    md = f"""---
id: "numerology-balance-{num_val}"
category: "balance_number"
indicator_name: "Cân bằng"
indicator_key: "balance"
number_value: "{num_val}"
keywords: ["con số cân bằng {num_val}", "balance number {num_val}", "xử lý khủng hoảng số {num_val}", "cân bằng cảm xúc {num_val}"]
title: "Chiến Lược Lấy Lại Cân Bằng Của Con Số Cân Bằng {num_val}"
---

# Chiến Lược Lấy Lại Cân Bằng Của Con Số Cân Bằng {num_val}

## Phản Ứng Tự Vệ Vô Thức Khi Đối Mặt Khủng Hoảng Của Số Cân Bằng {num_val}
{c['defense']}

## Những Phản Ứng Tiêu Cực Cần Tránh Khi Bị Áp Lực (Stress Trigger)
{c['stress_triggers']}

## Mỏ Neo Tâm Lý Giúp Người Có Số Cân Bằng {num_val} Tĩnh Tâm Nhanh Nhất
{c['anchor']}

## Các Câu Hỏi Tra Cứu Thường Gặp Về Con Số Cân Bằng {num_val} (Semantic Q&A)
- **Q: {c['qa_q']}**
  - **A:** {c['qa_a']}
- **Q: Kỹ thuật giúp lấy lại cân bằng nhanh nhất cho Số Cân bằng {num_val} là gì?**
  - **A:** {c['quick_zen']}

## Kỹ Thuật Định Tâm Cấp Tốc Dành Riêng Cho Số Cân Bằng {num_val}
{c['quick_zen']}
"""
    
    filename = f"balance_{num_val}.md"
    filepath = os.path.join(knowledge_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md.strip() + "\n")
    print(f"Successfully generated: {filename}")
    all_balance_markdown += md.strip() + "\n\n---\n\n"

all_filepath = os.path.join(knowledge_dir, "balance_all.md")
with open(all_filepath, "w", encoding="utf-8") as f:
    f.write(all_balance_markdown.strip() + "\n")
print("Successfully generated: balance_all.md")
print("DONE: All 9 Balance Markdown files generated successfully!")
