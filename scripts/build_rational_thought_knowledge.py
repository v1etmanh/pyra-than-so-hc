# -*- coding: utf-8 -*-
import os

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
os.makedirs(knowledge_dir, exist_ok=True)

rational_docs = [
    {
        "num": "1",
        "title_num": "1",
        "name": "Số 1 - Tư Duy Độc Lập, Tiên Phong & Quyết Đoán Tuyệt Đối",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 1 (Rational Thought 1 - tính từ Ngày sinh + Tên riêng) sở hữu cơ chế xử lý thông tin nhanh, dứt khoát và tập trung thẳng vào mục tiêu cốt lõi. Bạn có xu hướng tự mình phân tích, lọc bỏ các chi tiết rườm rà và ra quyết định độc lập mà không cần tham khảo quá nhiều ý kiến xung quanh. Não bộ của bạn phản ứng với vấn đề bằng câu hỏi: 'Mục tiêu là gì và hành động nào giúp đạt kết quả nhanh nhất?'.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Khả năng ra quyết định chớp nhoáng trong khủng hoảng, tư duy đột phá mở lối đi riêng, dám chấp nhận rủi ro có tính toán, tinh thần chịu trách nhiệm cao và không bao giờ bị lung lay bởi sự bàn tán của đám đông.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng (Đầu tư, công việc, quan hệ): Tính chủ quan, độc đoán, vội vã đưa ra kết luận trước khi có đủ dữ liệu, dễ bỏ qua những cảnh báo chuyên môn của cộng sự và có xu hướng đánh giá thấp độ phức tạp của khâu thực thi chi tiết.",
            "qa_q": "Làm sao để người có Tư duy lý trí 1 không đưa ra những quyết định sai lầm do quá tự tin và nóng vội?",
            "qa_a": "Hãy áp dụng 'Quy tắc 24h trước khi chốt quyết định lớn'. Hãy cho phép bản thân một khoảng thời gian lắng đọng để não bộ rà soát lại các rủi ro tiềm ẩn, và chủ động yêu cầu một cộng sự đáng tin cậy đóng vai trò 'Người phản biện' (Devil's Advocate) trước khi ký duyệt.",
            "methods": "1. **Áp dụng ma trận SWOT độc lập:** Viết rõ Điểm mạnh, Điểm yếu, Cơ hội và Thách thức ra giấy trước khi đầu tư.\n2. **Lắng nghe hết ý kiến phản biện:** Kiên nhẫn nghe hết góc nhìn trái chiều mà không ngắt lời hay gạt phăng ý kiến của người khác.\n3. **Rèn luyện tư duy đa chiều:** Đọc các bài phân tích chiến lược kinh doanh từ các chuyên gia đối lập để mở rộng tầm nhìn."
        }
    },
    {
        "num": "2",
        "title_num": "2",
        "name": "Số 2 - Tư Duy Trực Giác, Thấu Cảm & Hợp Tác Đa Phương",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 2 tiếp nhận và xử lý thông tin thông qua lăng kính trực giác và sự thấu cảm con người. Khi đứng trước một bài toán, bạn không chỉ nhìn vào các con số khô khan mà còn phân tích sâu sắc tác động của quyết định đó đến tâm lý, cảm xúc và mối quan hệ giữa các bên liên quan.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Khả năng đọc vị tâm lý đối tác xuất sắc, nhìn thấy những thỏa thuận ngầm và góc khuất mà số liệu không thể hiện, tài năng đàm phán ngoại giao kiến tạo giải pháp đôi bên cùng có lợi (Win-Win) và xoa dịu các xung đột lợi ích phức tạp.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Sự do dự, thiếu dứt khoát, dễ bị cảm xúc chi phối hoặc bị người khác thao túng tâm lý; sợ làm mất lòng đối phương nên trì hoãn việc đưa ra các quyết định cứng rắn (như cắt lỗ đầu tư hoặc sa thải nhân sự không phù hợp).",
            "qa_q": "Tại sao người có Tư duy lý trí 2 thường cảm thấy khó khăn khi phải đưa ra các quyết định dứt khoát mang tính cắt lỗ hoặc từ chối?",
            "qa_a": "Bởi vì não bộ của số 2 ưu tiên sự hòa hợp và sợ gây tổn thương cho người khác. Hãy hiểu rằng: Một quyết định từ chối rõ ràng, minh bạch ngay từ đầu chính là sự tử tế và nhân văn nhất, giúp tiết kiệm thời gian và nguồn lực cho tất cả các bên.",
            "methods": "1. **Sử dụng bảng chấm điểm tiêu chí logic:** Lập bảng tính Excel với các tiêu chí định lượng rõ ràng để hỗ trợ việc ra quyết định khách quan.\n2. **Tách rời cảm xúc khỏi bài toán công việc:** Đặt câu hỏi: 'Nếu xét thuần túy trên góc độ số liệu tài chính, đâu là lựa chọn tối ưu?'.\n3. **Đặt thời hạn chót (Deadline) bắt buộc:** Quy định thời gian tối đa để chốt quyết định, không để việc do dự kéo dài quá 48 giờ."
        }
    },
    {
        "num": "3",
        "title_num": "3",
        "name": "Số 3 - Tư Duy Sáng Tạo, Linh Hoạt & Đột Phá Ý Tưởng",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 3 xử lý thông tin bằng hình ảnh, sự liên tưởng phong phú và tư duy phản xạ nhanh nhạy. Bạn tiếp nhận dữ liệu rất nhanh và ngay lập tức nảy ra hàng loạt ý tưởng mới lạ, độc đáo. Não bộ của bạn luôn tìm kiếm những cách tiếp cận khác biệt, sinh động và tràn đầy cảm hứng.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Khả năng tư duy 'ngoài chiếc hộp' (Out of the box), tìm ra các giải pháp marketing, truyền thông và cải tiến sản phẩm xuất sắc, tài năng thuyết phục người khác đồng thuận với tầm nhìn sáng tạo của mình.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Dễ bị hưng phấn nhất thời cuốn theo các ý tưởng bay bổng thiếu tính khả thi, lạc quan tếu bỏ qua các rủi ro pháp lý/tài chính thực tế, thiếu sự kiên định và dễ bỏ dở dự án khi đối mặt với các quy trình kỹ thuật khô khan.",
            "qa_q": "Làm thế nào để người có Tư duy lý trí 3 biến những ý tưởng sáng tạo dồi dào thành các kế hoạch đầu tư/kinh doanh khả thi?",
            "qa_a": "Hãy kết hợp năng lượng sáng tạo của số 3 với mô hình thẩm định của số 4. Hãy luôn yêu cầu bản thân hoặc cộng sự lập 'Bản nghiên cứu tính khả thi' (Feasibility Study) với đầy đủ dự toán chi phí, lộ trình thực thi và phương án dự phòng trước khi rót vốn.",
            "methods": "1. **Hệ thống hóa ý tưởng bằng sơ đồ Mindmap:** Vẽ lại toàn bộ luồng ý tưởng và liên kết chúng với các mục tiêu kinh doanh cụ thể.\n2. **Thẩm định tính khả thi trước khi hành động:** Đặt câu hỏi: 'Ai sẽ là người thực thi chi tiết việc này và ngân sách cần bao nhiêu?'.\n3. **Tập trung vào 1 mục tiêu cốt lõi:** Chọn ra 1 ý tưởng xuất sắc nhất để triển khai đến cùng trước khi chuyển sang ý tưởng mới."
        }
    },
    {
        "num": "4",
        "title_num": "4",
        "name": "Số 4 - Tư Duy Hệ Thống, Logic Thực Chứng & Cấu Trúc Chuẩn Mực",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 4 tiếp nhận và xử lý thông tin theo chuỗi logic tuần tự, chặt chẽ và dựa trên bằng chứng thực tế/số liệu khoa học đã kiểm chứng. Bạn không bao giờ tin vào những lời hứa suông hay linh cảm mơ hồ; mọi vấn đề đều phải được mổ xẻ, phân loại và đưa vào quy trình rõ ràng.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Tư duy hệ thống xuất sắc, khả năng phân tích chi tiết đến từng milimet, tính cẩn trọng, khả năng quản trị rủi ro hàng đầu và năng lực thiết lập các quy trình vận hành chuẩn mực có độ bền vững cao.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Sự cứng nhắc, bảo thủ, tê liệt vì phân tích (Analysis Paralysis - đòi hỏi quá nhiều dữ liệu hoàn hảo mới chịu hành động), bỏ lỡ những cơ hội vàng trong thị trường biến động nhanh và e ngại những ý tưởng đột phá chưa có tiền lệ.",
            "qa_q": "Làm sao để người có Tư duy lý trí 4 trở nên linh hoạt hơn và không bị bỏ lỡ cơ hội kinh doanh vì phân tích quá lâu?",
            "qa_a": "Hãy áp dụng 'Quy tắc 70%' nổi tiếng của tướng Colin Powell: Khi bạn đã có được từ 40% đến 70% dữ liệu cần thiết, hãy ra quyết định và hành động ngay. Đừng đợi đến 100% dữ liệu vì khi đó cơ hội đã trôi qua mất.",
            "methods": "1. **Áp dụng nguyên tắc ra quyết định 70% dữ liệu:** Tập thói quen chốt quyết định khi các yếu tố rủi ro cốt lõi đã được kiểm soát ở mức chấp nhận được.\n2. **Thử nghiệm mô hình nhỏ (A/B Testing):** Triển khai thử nghiệm quy mô nhỏ để kiểm chứng thị trường thay vì phân tích lý thuyết trên giấy quá lâu.\n3. **Mở lòng đón nhận góc nhìn mới:** Lắng nghe và đánh giá nghiêm túc các ý tưởng đổi mới công nghệ từ thế hệ trẻ."
        }
    },
    {
        "num": "5",
        "title_num": "5",
        "name": "Số 5 - Tư Duy Thích Ứng, Đa Chiều & Nhạy Bén Xu Hướng",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 5 sở hữu bộ não cực kỳ nhanh nhạy, tiếp nhận thông tin đa nguồn trong chớp mắt và có khả năng liên kết các xu hướng mới lạ của xã hội. Bạn xử lý vấn đề dựa trên khả năng thích ứng linh hoạt, không thích bị gò bó vào các khuôn mẫu cũ và luôn tìm kiếm các giải pháp cơ động, cấp tiến.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Phản xạ chiến lược siêu nhanh trong biến động, tư duy đổi mới mô hình kinh doanh, khả năng xoay chuyển tình thế ngoạn mục khi gặp khủng hoảng và năng khiếu nắm bắt các cơ hội thị trường mới nổi.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Thiếu kiên định, dễ thay đổi chiến lược xoành xoạch khiến đội ngũ hoang mang, mạo hiểm quá mức vào những trào lưu ngắn hạn chưa được thẩm định và xu hướng bỏ dở các quy trình duy trì đều đặn.",
            "qa_q": "Tại sao người có Tư duy lý trí 5 thường có rất nhiều ý tưởng kinh doanh nhưng lại hay thay đổi chiến lược đột ngột?",
            "qa_a": "Bởi vì não bộ số 5 luôn bị kích thích bởi sự mới lạ và sợ sự trì trệ. Để thành công bền vững, bạn cần một 'Mỏ neo chiến lược': Cam kết theo đuổi một định hướng cốt lõi trong ít nhất 1 - 2 năm, chỉ thay đổi phương pháp thực thi chứ không đổi mục tiêu cuối cùng.",
            "methods": "1. **Thiết lập giới hạn cắt lỗ và rủi ro tối đa (Stop-loss):** Luôn đặt ra ranh giới an toàn tài chính trước khi tham gia bất kỳ thương vụ mạo hiểm nào.\n2. **Cam kết khung thời gian chiến lược:** Đặt ra quy tắc: 'Không thay đổi mục tiêu cốt lõi trong vòng 6 tháng đầu triển khai'.\n3. **Đánh giá dữ liệu lịch sử:** Kết hợp việc nắm bắt xu hướng tương lai với việc phân tích các chu kỳ dữ liệu trong quá khứ."
        }
    },
    {
        "num": "6",
        "title_num": "6",
        "name": "Số 6 - Tư Duy Trách Nhiệm, Nhân Văn & Cân Bằng Lợi Ích",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 6 tiếp nhận và xử lý thông tin dựa trên các chuẩn mực đạo đức, trách nhiệm đối với con người và sự ổn định của gia đình, tổ chức. Khi phân tích một vấn đề, bạn luôn cân nhắc kỹ lưỡng yếu tố an toàn, tính nhân văn và sự công bằng cho tất cả các bên tham gia.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Tư duy phát triển bền vững, các giải pháp mang tính phụng sự và nuôi dưỡng con người sâu sắc, xây dựng được sự gắn kết trung thành tuyệt đối từ đội ngũ và tạo dựng uy tín thương hiệu đạo đức vững mạnh.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Xu hướng lo âu thái quá (thêu dệt nên những kịch bản rủi ro tồi tệ), để tình cảm chi phối quá nhiều dẫn đến quyết định thiếu hiệu quả kinh tế hoặc tự ôm đồm gánh vác rủi ro thay cho người khác.",
            "qa_q": "Làm thế nào để người có Tư duy lý trí 6 ra quyết định kinh doanh dứt khoát mà không bị cảm giác áy náy làm chậm tiến độ?",
            "qa_a": "Hãy phân định rạch ròi giữa 'Lòng trắc ẩn đích thực' và 'Sự dung túng có hại'. Một quyết định quản trị chuẩn xác, kỷ luật và đúng nguyên tắc chính là cách tốt nhất để bảo vệ lợi ích của toàn thể tổ chức và giúp các cá nhân tự trưởng thành.",
            "methods": "1. **Áp dụng phân tích chi phí - lợi ích (Cost-Benefit Analysis):** Định lượng hóa các phương án bằng con số cụ thể bên cạnh việc đánh giá yếu tố con người.\n2. **Rèn luyện thói quen buông lỏng lo âu:** Nhắc nhở bản thân: 'Mọi việc đều đang diễn ra đúng quy luật, mình đã làm hết trách nhiệm tốt nhất có thể'.\n3. **Xây dựng quy chế minh bạch:** Dựa vào nội quy và hợp đồng pháp lý rõ ràng để xử lý các vấn đề nội bộ thay vì dùng tình cảm cá nhân."
        }
    },
    {
        "num": "7",
        "title_num": "7",
        "name": "Số 7 - Tư Duy Phân Tích Chiều Sâu, Nghiên Cứu Bản Chất & Triết Học",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 7 xử lý thông tin với sự hoài nghi khoa học nghiêm túc và tinh thần đào sâu bản chất. Bạn không bao giờ tin vào những nhận định bề nổi hay những lời quảng cáo hào nhoáng; bạn tự mình tìm kiếm tài liệu gốc, phân tích dữ liệu chuyên sâu và giải mã các quy luật ngầm chi phối sự việc.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Tư duy phản biện sắc bén như dao mổ, khả năng nhìn thấu các lỗ hổng chiến lược mà người khác bỏ sót, tầm nhìn dài hạn vượt thời gian và khả năng đúc kết tri thức uyên bác thành các mô hình thực tiễn.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Hoài nghi quá mức dẫn đến khó tin tưởng báo cáo của cấp dưới, xa rời thực tế thị trường vì quá chìm đắm vào lý thuyết học thuật và xu hướng tự cô lập bản thân khi suy nghĩ khiến quá trình ra quyết định bị chậm trễ.",
            "qa_q": "Tại sao người có Tư duy lý trí 7 thường mất rất nhiều thời gian để nghiên cứu trước khi đưa ra một quyết định đơn giản?",
            "qa_a": "Bởi vì não bộ số 7 có nhu cầu thấu suốt bản chất toàn diện. Tuy nhiên, trong thương trường, tốc độ đôi khi quan trọng hơn sự hoàn hảo tuyệt đối. Hãy đặt ra giới hạn thời gian nghiên cứu và kết hợp với dữ liệu thực nghiệm trên thị trường.",
            "methods": "1. **Đặt khung thời gian nghiên cứu tối đa (Time-boxing):** Giới hạn thời gian thu thập dữ liệu trong 3 - 5 ngày trước khi bắt buộc phải đưa ra kết luận.\n2. **Tích hợp dữ liệu thực nghiệm:** Trực tiếp phỏng vấn khách hàng hoặc người dùng thực tế thay vì chỉ đọc tài liệu lý thuyết.\n3. **Trao đổi với các chuyên gia thực chiến:** Thảo luận phương án với những người có kinh nghiệm thực tế để cân bằng với góc nhìn học thuật."
        }
    },
    {
        "num": "8",
        "title_num": "8",
        "name": "Số 8 - Tư Duy Thương Trường, Đòn Bẩy Tài Chính & Hiệu Suất Thực Thi",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 8 tiếp nhận và xử lý thông tin thông qua lăng kính định lượng thực dụng: Dòng tiền, biên lợi nhuận, lợi thế cạnh tranh, đòn bẩy nguồn lực và tỷ suất hoàn vốn (ROI). Bạn nhìn nhận mọi vấn đề như một bài toán kinh tế và luôn tìm cách tối ưu hóa hiệu quả thực thi.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Tầm nhìn thương trường nhạy bén, khả năng chớp thời cơ lớn, tư duy mở rộng quy mô (Scale-up) xuất chúng, bản lĩnh đàm phán quyền lực và năng lực huy động, điều phối nguồn vốn khổng lồ.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Quá thực dụng và lạnh lùng, chỉ nhìn vào con số tài chính ngắn hạn mà bỏ qua yếu tố tâm lý nhân sự hoặc giá trị đạo đức, dễ bị lòng tham thúc đẩy dẫn đến việc sử dụng đòn bẩy tài chính quá mức rủi ro.",
            "qa_q": "Làm sao để người có Tư duy lý trí 8 cân bằng giữa mục tiêu tối đa hóa lợi nhuận và sự phát triển bền vững của doanh nghiệp?",
            "qa_a": "Hãy tích hợp 'Chỉ số Đạo đức và Văn hóa' vào bảng cân đối kế hoạch kinh doanh. Hãy nhớ rằng: Khách hàng và nhân viên trung thành là tài sản vô hình lớn nhất; khi bạn xây dựng doanh nghiệp dựa trên sự chính trực và phụng sự, lợi nhuận sẽ tự động đến và tồn tại bền vững.",
            "methods": "1. **Kiểm soát đòn bẩy tài chính nghiêm ngặt:** Luôn duy trì tỷ lệ đòn bẩy nợ ở mức an toàn để phòng ngừa biến động thị trường.\n2. **Đánh giá tác động nhân sự:** Lắng nghe tâm tư của đội ngũ thực thi trước khi đưa ra các chính sách cắt giảm hoặc tăng áp lực hiệu suất.\n3. **Thực hành tư duy Win-Win trong đàm phán:** Đảm bảo đối tác cũng có phần lợi ích xứng đáng để duy trì mối quan hệ hợp tác dài hạn."
        }
    },
    {
        "num": "9",
        "title_num": "9",
        "name": "Số 9 - Tư Duy Toàn Cảnh, Lý Tưởng Vĩ Mô & Đạo Đức Nhân Loại",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí 9 tiếp nhận và xử lý thông tin dưới góc nhìn vĩ mô toàn cầu. Khi đứng trước một quyết định, bạn luôn nhìn vào bức tranh toàn cảnh và phân tích tác động dài hạn của nó đối với cộng đồng, môi trường và các giá trị nhân văn của xã hội.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Tầm nhìn chiến lược bao quát, giải pháp có tầm ảnh hưởng xã hội rộng lớn, khả năng quy tụ lòng người và xây dựng thương hiệu uy tín bằng sự chính trực, vị tha và văn minh.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Quá lý tưởng hóa, xa rời các chi tiết tài chính vi mô, dễ bị kẻ xấu lợi dụng lòng tốt thông qua những lời hứa hẹn nhân đạo giả tạo, và thiếu sự quyết liệt, cứng rắn trong các cuộc thương thảo kinh tế khốc liệt.",
            "qa_q": "Người mang Tư duy lý trí 9 cần làm gì để các quyết định mang tính lý tưởng cao đẹp có thể triển khai thành công trên thực tế?",
            "qa_a": "Hãy đồng hành cùng một cộng sự có tư duy thực tế (như số 4 hoặc số 8) để họ chịu trách nhiệm thẩm định các chi tiết tài chính và vận hành vi mô. Hãy để lý tưởng của số 9 định hướng tầm nhìn và để kỷ luật thực tế biến nó thành hiện thực.",
            "methods": "1. **Chia nhỏ tầm nhìn thành các cột mốc KPI định lượng:** Lập kế hoạch hành động từng bước rõ ràng cho các dự án mang tính xã hội.\n2. **Kiểm chứng pháp lý và tài chính độc lập:** Thuê chuyên gia kiểm toán và luật sư rà soát kỹ các hợp đồng trước khi cam kết nguồn lực.\n3. **Giữ vững sự thực tế trong lòng tốt:** Giúp đỡ và đầu tư dựa trên năng lực tự lập của đối tượng được thụ hưởng."
        }
    },
    {
        "num": "11",
        "title_num": "11",
        "name": "Số 11 - Tư Duy Siêu Giác Quan, Trực Giác Khai Sáng & Đột Phá Tâm Thức",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí Master 11 sở hữu bộ não kết hợp hoàn hảo giữa năng lực phân tích logic và linh cảm trực giác siêu giác quan. Bạn có khả năng cảm nhận được xu hướng vận động của tương lai và bản chất sâu xa của vấn đề thông qua những tia chớp trực giác xuất thần.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Khả năng dự đoán xu hướng tương lai chuẩn xác lạ thường, đưa ra những giải pháp đột phá mang tính thức tỉnh và truyền cảm hứng mạnh mẽ, tài năng kết nối thế giới tinh thần với đời sống thực tế.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Hệ thần kinh dễ bị quá tải vì tiếp nhận quá nhiều luồng năng lượng và thông tin cùng lúc, hoang mang khi linh cảm trực giác mâu thuẫn với số liệu bề nổi và dễ bị chông chênh trước áp lực thực tế.",
            "qa_q": "Làm thế nào để người có Tư duy lý trí Master 11 cân bằng giữa linh cảm trực giác và dữ liệu phân tích khoa học khi ra quyết định lớn?",
            "qa_a": "Hãy áp dụng nguyên lý 'Trực giác định hướng - Logic kiểm chứng'. Khi linh cảm xuất hiện, hãy ghi lại và sau đó dùng các công cụ phân tích dữ liệu khoa học để kiểm tra tính khả thi thực tế trước khi hành động.",
            "methods": "1. **Ghi chép nhật ký trực giác (Intuition Journal):** Viết lại những linh cảm xuất hiện trong ngày và theo dõi độ chuẩn xác của chúng trên thực tế.\n2. **Thiền định làm sạch tâm trí trước khi họp chiến lược:** Dành 10 phút ngồi tĩnh tâm để thanh lọc tạp niệm trước các quyết định quan trọng.\n3. **Diễn đạt linh cảm bằng ngôn ngữ logic:** Tập thói quen trình bày các ý tưởng trực giác bằng biểu đồ và lý lẽ rõ ràng để cộng sự dễ tiếp nhận."
        }
    },
    {
        "num": "22",
        "title_num": "22",
        "name": "Số 22 - Tư Duy Tổng Công Trình Sư, Kiến Tạo Vĩ Mô & Thực Thi Đỉnh Cao",
        "content": {
            "mechanism": "Người mang Chỉ số Tư duy Lý trí Master 22 (The Master Builder) sở hữu bộ óc của một tổng công trình sư vĩ đại. Bạn vừa có khả năng bao quát bức tranh chiến lược tầm cỡ quốc tế của số 11, vừa nắm vững đến từng chi tiết kỹ thuật và quy trình thực thi kỷ luật thép của số 4. Não bộ của bạn tư duy theo mô hình các đại hệ thống phức hợp.",
            "strengths": "Điểm mạnh trong giải quyết vấn đề thực tế: Năng lực biến những tầm nhìn khổng lồ thành bản vẽ kỹ thuật chi tiết và kế hoạch hành động thực tế, khả năng quy tụ và điều phối các nguồn lực tài chính, công nghệ và nhân lực quy mô lớn hàng triệu USD.",
            "blindspots": "Điểm mù khi ra quyết định quan trọng: Đặt tiêu chuẩn quá cao gây áp lực nghẹt thở cho cấp dưới, dễ thất vọng và cáu gắt khi thực tế tiến độ chậm hơn kỳ vọng, hoặc bị quá tải vì ôm đồm cùng lúc quá nhiều đại dự án.",
            "qa_q": "Người có Tư duy lý trí Master 22 làm thế nào để quản trị các đại dự án mà không bị kiệt quệ năng lượng tư duy?",
            "qa_a": "Hãy thực hành 'Phân quyền thông minh và Tự động hóa hệ thống'. Bạn là người kiến tạo mô hình chứ không phải người làm thay tất cả. Hãy đào tạo đội ngũ quản trị cấp trung vững vàng và trao quyền để họ tự vận hành từng phân hệ.",
            "methods": "1. **Lập sơ đồ cấu trúc phân rã công việc (WBS - Work Breakdown Structure):** Chia nhỏ các đại dự án thành các gói công việc cụ thể có người phụ trách rõ ràng.\n2. **Xây dựng hệ thống báo cáo Dashboard trực quan:** Theo dõi tiến độ toàn cục bằng các chỉ số đo lường hiệu suất (KPI/OKR) thời gian thực.\n3. **Thiết lập chế độ nghỉ ngơi dưỡng não định kỳ:** Dành các khoảng thời gian ngắt kết nối hoàn toàn khỏi công việc để não bộ phục hồi sức sáng tạo."
        }
    }
]

all_rational_markdown = "# TỔNG HỢP 11 CHỈ SỐ TƯ DUY LÝ TRÍ (RATIONAL THOUGHT) - THẦN SỐ HỌC PYTHAGORAS\n\n"

for doc in rational_docs:
    num_val = doc["num"]
    c = doc["content"]
    
    md = f"""---
id: "numerology-rationalthought-{num_val}"
category: "rational_thought"
indicator_name: "Tư duy lý trí"
indicator_key: "rationalThinking"
number_value: "{num_val}"
keywords: ["tư duy lý trí {num_val}", "rational thought {num_val}", "cách ra quyết định số {num_val}", "tư duy giải quyết vấn đề {num_val}"]
title: "Mô Thức Ra Quyết Định Của Chỉ Số Tư Duy Lý Trí {num_val}"
---

# Mô Thức Ra Quyết Định Của Chỉ Số Tư Duy Lý Trí {num_val}

## Cơ Chế Tiếp Nhận Và Xử Lý Thông Tin Của Tư Duy Lý Trí {num_val}
{c['mechanism']}

## Điểm Mạnh Trong Giải Quyết Vấn Đề Thực Tế
{c['strengths']}

## Điểm Mù Khi Ra Quyết Định Quan Trọng (Đầu tư, công việc, quan hệ)
{c['blindspots']}

## Các Câu Hỏi Tra Cứu Thường Gặp Về Tư Duy Lý Trí {num_val} (Semantic Q&A)
- **Q: {c['qa_q']}**
  - **A:** {c['qa_a']}
- **Q: Phương pháp rèn luyện tư duy sắc bén cho người mang Tư duy lý trí {num_val} là gì?**
  - **A:** {c['methods']}

## Phương Pháp Rèn Luyện Tư Duy Sắc Bén Cho Số {num_val}
{c['methods']}
"""
    
    filename = f"rational_thought_{num_val}.md"
    filepath = os.path.join(knowledge_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(md.strip() + "\n")
    print(f"Successfully generated: {filename}")
    all_rational_markdown += md.strip() + "\n\n---\n\n"

all_filepath = os.path.join(knowledge_dir, "rational_thought_all.md")
with open(all_filepath, "w", encoding="utf-8") as f:
    f.write(all_rational_markdown.strip() + "\n")
print("Successfully generated: rational_thought_all.md")
print("DONE: All 11 Rational Thought Markdown files generated successfully!")
