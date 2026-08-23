# -*- coding: utf-8 -*-
import json
import os

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
os.makedirs(knowledge_dir, exist_ok=True)

with open(os.path.join('data', 'master_knowledge.json'), 'r', encoding='utf-8') as f:
    master_data = json.load(f)

# Filter life path items
life_path_items = [item for item in master_data if item.get('category') == 'life_path_number']

# Custom 3 actions per number dictionary
actions_map = {
    '1': [
        'Thực hành lắng nghe sâu (Deep Listening): Mỗi ngày dành ít nhất 1 cuộc trò chuyện chỉ để lắng nghe trọn vẹn mà không ngắt lời, không phán xét và không vội đưa ra chỉ đạo.',
        'Học cách ủy quyền và nhờ giúp đỡ: Chủ động giao phó ít nhất 1 đầu việc cho người khác và học cách chấp nhận các phương pháp làm việc khác với cách của mình.',
        'Viết nhật ký phản chiếu cái tôi: Cuối ngày tự hỏi: "Hôm nay quyết định của mình xuất phát từ lợi ích chung hay để thỏa mãn cái tôi cá nhân?".'
    ],
    '2': [
        'Thiết lập ranh giới cảm xúc (Boundary Setting): Tập từ chối ít nhất 1 yêu cầu không chính đáng mỗi ngày mà không giải thích vòng vo hay tự dằn vặt.',
        'Dành thời gian thanh lọc năng lượng: Mỗi ngày dành 15-20 phút một mình trong yên tĩnh (thiền định, đi dạo thiên nhiên) để xả bỏ năng lượng tiêu cực đã hấp thụ từ người khác.',
        'Thực hành ghi nhận bản thân: Viết ra 3 điều bạn trân trọng về chính mình trước khi đi ngủ.'
    ],
    '3': [
        'Thực hành "Nói lời ái ngữ": Mỗi ngày chủ động gửi lời khen ngợi hoặc động viên chân thành tới ít nhất 2 người xung quanh.',
        'Quy tắc hoàn tất 1 việc: Cam kết hoàn thành dứt điểm 1 đầu việc quan trọng trước khi bắt tay vào một ý tưởng mới.',
        'Viết nhật ký suy ngẫm: Dành 10 phút cuối ngày để tĩnh tâm viết ra cảm xúc sâu kín, giúp tâm trí lắng đọng lại.'
    ],
    '4': [
        'Thực hành linh hoạt (Go with the flow): Mỗi tuần cố tình thay đổi 1 thói quen cố định (đi con đường khác, thử món ăn mới) để rèn luyện tính thích nghi.',
        'Thiết lập "Giờ cấm công việc": Dành riêng ít nhất 1 giờ mỗi tối hoàn toàn không đụng vào công việc để kết nối trọn vẹn với bản thân và gia đình.',
        'Bày tỏ tình cảm bằng lời nói: Nói ít nhất 1 lời yêu thương hoặc cảm ơn chân thành với người thân mỗi ngày.'
    ],
    '5': [
        'Rèn luyện 1 thói quen kỷ luật bất biến: Chọn 1 việc cố định mỗi ngày (thể dục 30 phút, đọc sách 20 trang) và thực hiện nghiêm túc không bỏ ngày nào.',
        'Thực hành định tâm (Grounding): Dành 10 phút đi chân trần trên cỏ hoặc ngồi thiền tĩnh lặng để neo giữ năng lượng lại với mặt đất.',
        'Quy tắc 72 giờ: Trước khi từ bỏ một công việc hay bắt đầu một thú vui mới bốc đồng, hãy đợi đủ 72 giờ để xem cảm xúc có còn thôi thúc thực sự hay không.'
    ],
    '6': [
        'Thực hành "Chăm sóc bản thân trước" (Self-Care): Dành ít nhất 30 phút mỗi ngày chăm sóc riêng cho cơ thể và sở thích cá nhân mà không phục vụ ai khác.',
        'Kỹ thuật buông lỏng kiểm soát: Mỗi ngày tập quan sát người thân tự giải quyết vấn đề của họ mà không can thiệp hay đưa ra lời khuyên nếu không được hỏi.',
        'Thực hành biết ơn gia đình: Ghi nhận và cảm ơn những đóng góp nhỏ bé của bạn đời thay vì chỉ nhìn vào những điểm chưa hoàn hảo.'
    ],
    '7': [
        'Tĩnh tâm và thiền định hàng ngày: Dành 20 phút mỗi sáng trong tĩnh lặng tuyệt đối để kết nối với trực giác và làm sạch tâm trí.',
        'Chia sẻ 1 điều học được: Mỗi ngày viết ra hoặc chia sẻ một bài học chiêm nghiệm sâu sắc cho một người khác.',
        'Hòa mình vào thiên nhiên: Đi dạo dưới tán cây, gần nguồn nước để tái tạo năng lượng và cân bằng lại sau những giờ làm việc trí não căng thẳng.'
    ],
    '8': [
        'Thực hành từ thiện ẩn danh: Mỗi tháng trích một phần lợi nhuận để giúp đỡ những hoàn cảnh khó khăn một cách âm thầm, không màng danh tiếng.',
        'Thực hành lắng nghe không chỉ đạo: Trong các cuộc trò chuyện gia đình, chỉ lắng nghe và đồng cảm mà không đưa ra mệnh lệnh hay phán xét hiệu quả.',
        'Cân bằng năng lượng Thân - Tâm: Tập luyện thể thao đều đặn kết hợp với các bài tập thở sâu để giải phóng áp lực điều hành tích tụ trong cơ thể.'
    ],
    '9': [
        'Thực hành Tha thứ và Buông bỏ (Ho\'oponopono): Dành 5 phút mỗi tối nói lời tha thứ cho những ai đã làm tổn thương mình trong quá khứ.',
        'Ưu tiên gia đình nhỏ: Dành ít nhất 30 phút trò chuyện chất lượng và làm một hành động chăm sóc cụ thể cho người thân trong nhà mỗi ngày.',
        'Giúp đỡ có trí tuệ: Trước khi hỗ trợ ai đó, tự hỏi: "Hành động này có thực sự giúp họ tự lập và tiến bộ hay đang nuôi dưỡng sự ỷ lại của họ?".'
    ],
    '10': [
        'Đào sâu chuyên môn 45 phút: Dành ít nhất 45 phút mỗi ngày chỉ để nghiên cứu chuyên sâu về một kỹ năng cốt lõi duy nhất.',
        'Thực hành khiêm nhường lắng nghe: Lắng nghe người khác mà không tìm cách phô diễn sự hiểu biết hay kinh nghiệm của mình.',
        'Củng cố nền móng tổ ấm: Dành trọn vẹn buổi tối cuối tuần bên gia đình mà không sử dụng điện thoại hay giải quyết việc xã giao.'
    ],
    '11': [
        'Thực hành Neo năng lượng (Grounding Meditation): Dành 15 phút mỗi ngày đi chân trần trên đất hoặc thiền kết nối với luân xa gốc để giữ vững sự tỉnh thức thực tế.',
        'Thanh lọc trường năng lượng: Tắm nước muối ấm, xông tinh dầu tự nhiên sau một ngày tiếp xúc với nhiều người để tẩy sạch năng lượng tiêu cực.',
        'Viết nhật ký trực giác: Ghi chép lại những giấc mơ, linh cảm xuất hiện trong ngày để rèn luyện sự kết nối với trí tuệ vô thức.'
    ],
    '22': [
        'Lập kế hoạch hành động vi mô cho mục tiêu vĩ mô: Viết ra 3 việc cụ thể cần hoàn thành hôm nay để phục vụ cho tầm nhìn 10 năm tới.',
        'Rèn luyện sức khỏe thể chất nghiêm ngặt: Tập luyện thể lực ít nhất 30 phút mỗi ngày vì một trí tuệ vĩ đại cần một thể xác cực kỳ dẻo dai làm bệ đỡ.',
        'Quán chiếu sự chính trực: Cuối ngày tự soi chiếu lại tâm thức: "Mọi việc mình làm hôm nay có thực sự xuất phát từ lợi ích cộng đồng hay không?".'
    ]
}

# Number 1 data if missing in json
doc_1_item = {
    'category': 'life_path_number',
    'number': 'Số 1',
    'core_essence': 'Trong hệ thống Nhân số học Pythagoras, số 1 là con số khởi nguyên của vạn vật, đại diện cho năng lượng nguyên thủy, sự khai mở và quyền năng lãnh đạo tự chủ. Nằm ở điểm xuất phát của Trục ngang Thể chất (Physical Plane), người mang Số Đường Đời 1 mang trong mình sứ mệnh trở thành Người Tiên Phong (The Pioneer / Leader) – người dũng cảm rẽ lối mở đường, biến những ý tưởng sơ khởi thành hành động thực tế. Mục đích sống lớn nhất của người Số 1 là học bài học về sự tự lực cánh sinh, tự tin vào giá trị bản thân và kiến tạo con đường độc lập.',
    'strengths_and_talents': 'Điểm mạnh bẩm sinh: Ý chí độc lập kiên cường, tư duy tiên phong đột phá, năng lực ra quyết định dứt khoát trong khủng hoảng, lòng dũng cảm, tinh thần trách nhiệm cao và khả năng dẫn dắt tập thể kiến tạo con đường mới.',
    'weaknesses_and_lessons': 'Cạm bẫy tâm lý lớn nhất của người Số 1 là cái tôi cá nhân quá lớn (Ego trap), tính độc đoán, gia trưởng và thiếu kiên nhẫn với người khác. Họ có xu hướng gồng mình gánh vác mọi việc, sợ thừa nhận sự yếu đuối và dễ tự cô lập mình. Bài học cuộc đời là học cách cân bằng giữa sự tự chủ và sự khiêm nhường hợp tác, hiểu rằng lãnh đạo thực thụ là nâng đỡ và trao quyền.',
    'career_and_life_path': 'Người Số 1 phát huy tối đa năng lực trong các môi trường tự chủ cao, ít bị giám sát vi mô. Định hướng nghề nghiệp lý tưởng nhất bao gồm: Doanh nhân sáng lập (Founder/CEO), giám đốc điều hành, trưởng dự án chiến lược, chuyên gia tư vấn độc lập, nhà phát minh công nghệ, kiến trúc sư, hoặc vận động viên chuyên nghiệp. Trong tài chính, họ kiếm tiền rất quyết đoán nhưng cần quản trị rủi ro kỷ luật dài hạn.',
    'relationship_and_behavior': 'Trong tình yêu, người Số 1 rất chân thành, mãnh liệt và luôn muốn đóng vai trò người bảo bọc, che chở vững chãi cho đối phương. Tuy nhiên, tính thích chỉ huy và áp đặt quan điểm có thể gây ngột ngạt. Họ cần học cách hạ bớt cái tôi, lắng nghe thấu cảm và chia sẻ quyền quyết định cùng bạn đời.',
    'qa_pair': {
        'question': 'Tại sao người mang số đường đời 1 rất nỗ lực nhưng thường xuyên cảm thấy cô đơn và áp lực?',
        'answer': 'Do bản tính độc lập và cái tôi quá cao, bạn có xu hướng tự gánh vác mọi trọng trách và ngại chia sẻ điểm yếu với người khác. Điều này vô tình tạo ra bức tường ngăn cách giữa bạn và những người xung quanh. Hãy học cách tin tưởng và ủy quyền, bạn sẽ thấy sự gắn kết và nhẹ nhõm hơn.'
    }
}

all_items = [doc_1_item] + life_path_items

all_markdown = '# TỔNG HỢP 12 CON SỐ ĐƯỜNG ĐỜI (LIFE PATH NUMBERS) - THẦN SỐ HỌC PYTHAGORAS\n\n'

for item in all_items:
    num_str = item.get('number', '').replace('Số ', '').strip()
    clean_num = num_str.replace('/', '_')
    key_num = '22' if '22' in num_str else num_str
    
    actions = actions_map.get(key_num, [
        'Thực hành tỉnh thức và lắng nghe cảm xúc bản thân mỗi ngày.',
        'Đặt ra 1 mục tiêu cụ thể và hoàn thành trọn vẹn trong ngày.',
        'Thực hành lòng biết ơn trước khi đi ngủ.'
    ])
    
    actions_formatted = []
    for i, act in enumerate(actions):
        if ': ' in act:
            parts = act.split(': ', 1)
            actions_formatted.append(f"{i+1}. **{parts[0]}:** {parts[1]}")
        else:
            actions_formatted.append(f"{i+1}. **Thực hành chuyển hóa:** {act}")
    actions_text = '\n'.join(actions_formatted)
    
    qa = item.get('qa_pair', {})
    q_text = qa.get('question', f'Đặc điểm nổi bật và lời khuyên quan trọng nhất cho Số Đường Đời {num_str} là gì?')
    a_text = qa.get('answer', item.get('core_essence', ''))
    
    md_content = f"""---
id: "numerology-walksoflife-{clean_num}"
category: "life_path_number"
indicator_name: "Đường đời"
indicator_key: "walksOfLife"
number_value: "{num_str}"
keywords: ["đường đời {num_str}", "số chủ đạo {num_str}", "life path {num_str}", "tính cách số {num_str}", "nghề nghiệp số {num_str}"]
title: "Luận Giải Chuyên Sâu Số Đường Đời {num_str} Chuẩn Pythagoras"
---

# Luận Giải Toàn Diện Về Số Đường Đời {num_str}

## Bản Chất Cốt Lõi Và Mục Đích Sống Của Số Đường Đời {num_str}
{item.get('core_essence', '')}

## Điểm Mạnh Bẩm Sinh Và Tài Năng Nổi Trội Của Số Đường Đời {num_str}
{item.get('strengths_and_talents', '')}

## Cạm Bẫy Tâm Lý, Vùng Tối (Shadow Side) Và Bài Học Cuộc Đời Của Số Đường Đời {num_str}
{item.get('weaknesses_and_lessons', '')}

## Định Hướng Sự Nghiệp Và Phong Cách Tài Chính Cho Số Đường Đời {num_str}
{item.get('career_and_life_path', '')}

## Tình Cảm, Hôn Nhân Và Giao Tiếp Của Người Mang Số Đường Đời {num_str}
{item.get('relationship_and_behavior', '')}

## Các Câu Hỏi Tra Cứu Thường Gặp Về Số Đường Đời {num_str} (Semantic Q&A)
- **Q: {q_text}**
  - **A:** {a_text}
- **Q: Nghề nghiệp lý tưởng nhất cho người có số đường đời {num_str} là gì?**
  - **A:** {item.get('career_and_life_path', '')}

## 3 Hành Động Thực Hành Chuyển Hóa Hàng Ngày Cho Số Đường Đời {num_str}
{actions_text}
"""

    filename = f"life_path_{clean_num}.md"
    filepath = os.path.join(knowledge_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(md_content.strip() + '\n')
    print(f"Successfully created: {filename}")
    
    all_markdown += md_content.strip() + '\n\n---\n\n'

all_filepath = os.path.join(knowledge_dir, 'life_path_all.md')
with open(all_filepath, 'w', encoding='utf-8') as f:
    f.write(all_markdown.strip() + '\n')
print("Successfully created: life_path_all.md")
print("DONE: All 12 Life Path Markdown files generated!")
