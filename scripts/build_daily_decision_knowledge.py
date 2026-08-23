# -*- coding: utf-8 -*-
"""Generate the Daily Decision RAG knowledge documents.

The source of truth is the 60-question catalogue with per-question, per-day
contextual decision mappings. The generator writes one Markdown document per
question and personal day, producing 60 x 9 = 540 retrieval-friendly documents
in ``knowledge/``.

The generated content is intentionally framed as a reflective suggestion, not
as medical, financial, legal, relationship, or road-safety advice.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_DIR = ROOT_DIR / "knowledge"
SCHEMA_VERSION = "1.0.0"

DAY_THEMES = {
    1: {
        "vi": "khởi động, chủ động và tự mình đưa ra lựa chọn",
        "en": "starting, taking initiative, and choosing for yourself",
        "action_vi": "chọn một việc rõ ràng rồi bắt tay vào ngay",
        "action_en": "pick one clear action and start it promptly",
        "avoid_vi": "quá nóng vội hoặc biến sự chủ động thành áp đặt",
        "avoid_en": "rushing or turning initiative into pressure on others",
    },
    2: {
        "vi": "cân bằng, lắng nghe và phối hợp nhẹ nhàng",
        "en": "balance, listening, and gentle cooperation",
        "action_vi": "ưu tiên lựa chọn tạo cảm giác hài hòa và dễ phối hợp",
        "action_en": "prioritize an option that feels harmonious and easy to share",
        "avoid_vi": "suy diễn cảm xúc hoặc chiều lòng người khác quá mức",
        "avoid_en": "over-reading emotions or pleasing others at your own expense",
    },
    3: {
        "vi": "biểu đạt, sáng tạo và kết nối vui vẻ",
        "en": "expression, creativity, and cheerful connection",
        "action_vi": "chọn phương án có màu sắc vui tươi và cho phép bạn thể hiện bản thân",
        "action_en": "choose an option that feels playful and lets you express yourself",
        "avoid_vi": "phân tán vì quá nhiều lựa chọn hoặc hứa quá nhiều",
        "avoid_en": "scattering your attention or promising more than you can deliver",
    },
    4: {
        "vi": "trật tự, thực tế và hoàn thiện từng bước",
        "en": "structure, practicality, and steady completion",
        "action_vi": "chọn phương án ổn định, dễ chuẩn bị và dễ hoàn tất",
        "action_en": "choose an option that is stable, prepared, and easy to complete",
        "avoid_vi": "cầu toàn đến mức làm mất thời gian hoặc sự thoải mái",
        "avoid_en": "being so perfectionistic that you lose time or ease",
    },
    5: {
        "vi": "linh hoạt, trải nghiệm mới và thay đổi không khí",
        "en": "flexibility, new experiences, and a change of scenery",
        "action_vi": "thử một biến thể mới nhưng vẫn giữ giới hạn an toàn và thực tế",
        "action_en": "try a new variation while keeping practical and safety limits",
        "avoid_vi": "bốc đồng, vội vàng hoặc thay đổi kế hoạch thiếu cân nhắc",
        "avoid_en": "impulsiveness, haste, or changing plans without thinking it through",
    },
    6: {
        "vi": "chăm sóc, ấm áp và cân bằng với nhu cầu của mình",
        "en": "care, warmth, and balance with your own needs",
        "action_vi": "chọn điều mang lại sự dễ chịu cho bạn và những người cùng tham gia",
        "action_en": "choose what creates comfort for you and the people involved",
        "avoid_vi": "ôm hết trách nhiệm hoặc chăm sóc người khác mà quên bản thân",
        "avoid_en": "taking on every responsibility and forgetting yourself",
    },
    7: {
        "vi": "tĩnh lặng, quan sát và nạp lại năng lượng",
        "en": "quiet reflection, observation, and restoring energy",
        "action_vi": "chọn phương án yên tĩnh, có thời gian suy nghĩ và không quá tải",
        "action_en": "choose a quieter option with room to think and avoid overload",
        "avoid_vi": "tự cô lập hoàn toàn hoặc suy nghĩ quá lâu mà không hành động",
        "avoid_en": "isolating completely or thinking so long that you never act",
    },
    8: {
        "vi": "mục tiêu, hiệu quả và sự quyết đoán có trách nhiệm",
        "en": "goals, efficiency, and responsible decisiveness",
        "action_vi": "chọn phương án tạo kết quả rõ ràng và phù hợp nguồn lực hiện có",
        "action_en": "choose an option with a clear result that fits your available resources",
        "avoid_vi": "ép buộc người khác hoặc đánh đổi sự cân bằng để lấy kết quả nhanh",
        "avoid_en": "pressuring others or sacrificing balance for a quick result",
    },
    9: {
        "vi": "hoàn tất, buông bớt và mở chỗ cho điều mới",
        "en": "completion, letting go, and making room for what is new",
        "action_vi": "ưu tiên lựa chọn giúp khép lại việc cũ và đem lại cảm giác nhẹ nhõm",
        "action_en": "prioritize an option that closes a loop and leaves you lighter",
        "avoid_vi": "ôm chuyện cũ hoặc bắt đầu quá nhiều việc khi chưa dọn chỗ",
        "avoid_en": "holding on to old tension or starting too much before clearing space",
    },
}

CATEGORY_DATA = {
    "food": {"name_vi": "Ẩm thực", "name_en": "Food"},
    "drink": {"name_vi": "Thức uống", "name_en": "Drinks"},
    "fashion": {"name_vi": "Thời trang và màu sắc", "name_en": "Fashion and colors"},
    "work": {"name_vi": "Công việc và năng suất", "name_en": "Work and productivity"},
    "relax": {"name_vi": "Giải trí và thư giãn", "name_en": "Relaxation and entertainment"},
    "wellness": {"name_vi": "Thể chất và tinh thần", "name_en": "Wellness"},
    "lifestyle": {"name_vi": "Đi lại và không gian sống", "name_en": "Travel and living space"},
    "relationship": {"name_vi": "Tình cảm và giao tiếp", "name_en": "Relationships and communication"},
}

QUESTION_DECISION_MATRIX: dict[str, dict[str, Any]] = {
    # --- FOOD (8 questions) ---
    "food_lunch": {
        "cat": "food", "slug": "lunch",
        "q_vi": "Trưa nay ăn gì?", "q_en": "What should I eat for lunch today?",
        "synonyms": ["trưa nay ăn gì", "món ăn trưa", "gợi ý ăn trưa", "lunch suggestion", "what to eat for lunch"],
        "days": {
            1: ("một món giàu đạm (bò bít tết hoặc cơm gà nướng) để nạp năng lượng tiên phong", "a high-protein meal (like steak or grilled chicken) for bold initiative"),
            2: ("một món canh thanh mát hoặc súp nhẹ nhàng dễ tiêu hóa", "a light, soothing soup or gentle broth for balance"),
            3: ("một món chua cay rộn ràng (bún Thái hoặc cơm tấm sườn nướng)", "a vibrant, zesty dish (like spicy noodles or broken rice) for cheerful mood"),
            4: ("một bữa cơm truyền thống đủ chất, ngăn nắp và no lâu", "a wholesome, structured traditional meal that keeps you fueled"),
            5: ("một món ẩm thực đường phố mới lạ để đổi vị giác", "an exciting street-food dish for a fresh change of taste"),
            6: ("một bữa ăn ấm cúng cùng đồng nghiệp hoặc người thân", "a warm, nourishing lunch shared with colleagues or loved ones"),
            7: ("một món chay thực dưỡng hoặc salad rau củ thanh tịnh", "a clean plant-based dish or fresh salad for mindful clarity"),
            8: ("một bữa ăn thịnh soạn, chất lượng cao để duy trì hiệu suất", "a hearty, premium meal to support your drive and efficiency"),
            9: ("một món thanh đạm kết hợp nhiều loại rau củ quả tươi", "a light, colorful meal with fresh greens to close the midday loop"),
        }
    },
    "food_dinner_home_or_out": {
        "cat": "food", "slug": "dinner_home_or_out",
        "q_vi": "Tối nay ăn cơm nhà hay đi ăn tiệm?", "q_en": "Should I eat at home or go out for dinner tonight?",
        "synonyms": ["ăn cơm nhà hay ăn tiệm", "tối nay ăn ở đâu", "nấu cơm hay đi ăn ngoài", "dinner at home or restaurant"],
        "days": {
            1: ("ăn tiệm nhanh gọn để chủ động thời gian và lịch trình cá nhân", "eat out efficiently to stay proactive with your own schedule"),
            2: ("ăn cơm nhà ấm áp, cùng nhau nấu nướng và trò chuyện", "cook a cozy dinner at home to foster connection"),
            3: ("đi ăn ngoài tại một quán ăn vui nhộn, không gian mở cùng bạn bè", "go out to a lively, vibrant restaurant with good company"),
            4: ("tự nấu một bữa cơm nhà chỉn chu theo thực đơn đã lên sẵn", "cook a well-planned, orderly home dinner"),
            5: ("khám phá một quán ăn mới toanh mà bạn chưa từng thử", "explore a brand-new eatery that you haven't visited before"),
            6: ("chuẩn bị bữa tối chu đáo quây quần bên những người thân yêu", "prepare a caring, wholesome family dinner at home"),
            7: ("ăn bữa tối nhẹ nhàng, yên tĩnh tại nhà để nạp lại năng lượng", "enjoy a quiet, simple meal at home to recharge peacefully"),
            8: ("chọn một nhà hàng chất lượng, không gian đẹp để tự thưởng", "choose a reputable, quality restaurant to reward your achievements"),
            9: ("ăn tối thanh đạm tại nhà, dọn dẹp gọn gàng gian bếp", "have a light home dinner and tidy up the kitchen"),
        }
    },
    "food_light_or_rich": {
        "cat": "food", "slug": "light_or_rich",
        "q_vi": "Ăn món thanh đạm hay đậm đà nhiều đạm?", "q_en": "Should I choose a light meal or a rich protein-heavy meal?",
        "synonyms": ["ăn thanh đạm hay đậm đà", "món ăn nhẹ hay nhiều đạm", "light or rich meal", "healthy or heavy food"],
        "days": {
            1: ("món đậm đà giàu đạm để tăng cường sinh lực hành động", "a rich, protein-packed dish to fuel strong physical drive"),
            2: ("món thanh đạm, ít dầu mỡ để cơ thể nhẹ nhàng êm dịu", "a light, gentle meal that is easy on digestion"),
            3: ("món có gia vị hài hòa, màu sắc bắt mắt kích thích vị giác", "a colorful, richly seasoned dish that sparks joyful taste"),
            4: ("món ăn cân đối, vừa đủ đạm và nhiều chất xơ lành mạnh", "a balanced, wholesome meal with steady protein and fiber"),
            5: ("món ăn biến tấu hương vị mới lạ, không quá ngấy", "a flavorful, innovative dish that is refreshing and not too heavy"),
            6: ("món hầm hoặc súp ấm nóng, bổ dưỡng và hài hòa", "a warm, nourishing stew or soup that brings comforting balance"),
            7: ("món thanh đạm thuần thực vật, gia vị tối giản", "a clean, plant-based meal with minimal seasoning for clarity"),
            8: ("món giàu đạm chất lượng cao để bồi bổ thể lực và trí lực", "a premium protein-rich meal to sustain high productivity"),
            9: ("món thanh nhẹ, dễ tiêu giúp thanh lọc cơ thể", "a light, easily digestible meal to cleanse and refresh"),
        }
    },
    "food_cuisine": {
        "cat": "food", "slug": "cuisine",
        "q_vi": "Ăn đồ Việt, đồ Hàn, đồ Nhật hay đồ Tây?", "q_en": "Should I choose Vietnamese, Korean, Japanese, or Western food?",
        "synonyms": ["ăn đồ việt hàn nhật hay tây", "chọn món nước nào", "vietnamese korean japanese or western food"],
        "days": {
            1: ("đồ Tây (như Bò bít tết hoặc Mì Ý) gọn gàng, dồi dào năng lượng", "Western food (like steak or pasta) for swift, energizing fuel"),
            2: ("đồ Việt truyền thống với các món canh rau thanh dịu, gần gũi", "traditional Vietnamese home-style dishes for comforting harmony"),
            3: ("đồ Hàn hoặc đồ Thái với hương vị cay ngọt rực rỡ, vui tươi", "Korean or Thai cuisine for vibrant, playful, and zesty flavors"),
            4: ("đồ Nhật thanh tao, chuẩn mực, trình bày ngăn nắp", "Japanese cuisine for its orderly, balanced, and clean presentation"),
            5: ("ẩm thực kết hợp (Fusion) hoặc món đường phố quốc tế mới lạ", "Fusion cuisine or international street food for a novel experience"),
            6: ("đồ Việt mâm cơm gia đình ấm cúng chuẩn vị truyền thống", "comforting Vietnamese family dishes shared together"),
            7: ("đồ Nhật thực dưỡng hoặc món chay thanh tịnh", "Zen Japanese cuisine or pure vegetarian fare for peaceful dining"),
            8: ("ẩm thực Âu hoặc tiệc nướng cao cấp khẳng định thành quả", "fine Western dining or quality BBQ to celebrate your momentum"),
            9: ("món lẩu đa dạng nhiều rau nấm để cùng thưởng thức nhẹ nhàng", "a wholesome multi-veggie hotpot to share harmoniously"),
        }
    },
    "food_breakfast": {
        "cat": "food", "slug": "breakfast",
        "q_vi": "Bữa sáng ăn gì để nạp năng lượng nhanh nhất?", "q_en": "What should I eat for breakfast to get energy quickly?",
        "synonyms": ["ăn sáng món gì", "bữa sáng nhanh gọn", "breakfast ideas", "quick breakfast fuel"],
        "days": {
            1: ("bánh mì kẹp trứng ốp la và một ly cà phê đậm đà", "eggs on toast with a bold coffee for an assertive start"),
            2: ("cháo yến mạch ấm hoặc súp nhẹ dễ tiêu", "warm oatmeal porridge or light soup for a gentle morning"),
            3: ("bánh mì sandwich kẹp thịt kèm ly sinh tố trái cây tươi", "a fresh sandwich and fruit smoothie for a colorful boost"),
            4: ("phở bò hoặc hủ tiếu truyền thống chắc bụng, đủ chất", "traditional warm noodle soup for steady, structured fuel"),
            5: ("bánh mì ngũ cốc nguyên cám kèm sữa chua hạt dinh dưỡng", "wholegrain toast with nutty yogurt for quick, flexible energy"),
            6: ("bữa sáng tự chuẩn bị ấm áp với sữa hạt và bánh mì bơ", "a caring homemade breakfast with nut milk and toast"),
            7: ("sinh tố xanh detox hoặc trái cây tươi thanh mát", "a green detox smoothie or fresh fruit for a light, clear mind"),
            8: ("bữa sáng giàu đạm với trứng, xúc xích và bơ tươi", "a hearty breakfast with eggs and avocado for high stamina"),
            9: ("đĩa trái cây tươi theo mùa và ngũ cốc nhẹ", "a seasonal fresh fruit platter with light muesli to start clean"),
        }
    },
    "food_snack": {
        "cat": "food", "slug": "snack",
        "q_vi": "Chiều nay ăn vặt món giòn rụm hay ngọt dịu?", "q_en": "Should my afternoon snack be crunchy or gently sweet?",
        "synonyms": ["ăn vặt giòn hay ngọt", "món ăn xế", "snack chiều", "afternoon snack crunchy or sweet"],
        "days": {
            1: ("món giòn rụm (hạt hạnh nhân, snack rong biển) tạo sự tỉnh táo", "crunchy almonds or seaweed crisps for a quick alertness lift"),
            2: ("món ngọt dịu (sữa chua, chè hạt sen) xoa dịu cảm xúc", "gently sweet yogurt or lotus seed dessert for soothing balance"),
            3: ("món ăn vặt giòn tan nhiều gia vị (bắp rang bơ, bánh gạo)", "flavorful crispy popcorn or rice crackers for fun inspiration"),
            4: ("các loại hạt dinh dưỡng sấy mộc, ít gia vị và tiện lợi", "plain roasted nuts with minimal seasoning for neat focus"),
            5: ("trái cây sấy dẻo hoặc snack chua ngọt mới lạ", "tangy dried fruit or a novelty snack for playful change"),
            6: ("bánh ngọt mềm hoặc một miếng phô mai béo ngậy ấm cúng", "a soft pastry or creamy cheese bite for comforting pleasure"),
            7: ("thanh ngũ cốc thuần hạt hoặc một quả táo tươi giòn", "a clean seed bar or fresh crisp apple for mindful snacking"),
            8: ("socola đen nguyên chất hoặc hạt macca bùi béo", "rich dark chocolate or macadamia nuts for sustaining drive"),
            9: ("một ly thạch trái cây tươi mát lành, thanh nhiệt", "refreshing fruit jelly or chilled fruit bites to refresh"),
        }
    },
    "food_dessert": {
        "cat": "food", "slug": "dessert",
        "q_vi": "Món tráng miệng chọn trái cây tươi hay bánh ngọt?", "q_en": "Should I choose fresh fruit or cake for dessert?",
        "synonyms": ["tráng miệng trái cây hay bánh", "món tráng miệng", "dessert fruit or pastry"],
        "days": {
            1: ("trái cây họ cam quýt chua ngọt kích thích tinh thần", "fresh citrus fruit slices for a sharp, refreshing finish"),
            2: ("pudding sữa mềm mịn hoặc thạch dừa thanh dịu", "soft milk pudding or coconut jelly for gentle satisfaction"),
            3: ("bánh kem mini nhiều màu sắc hoặc một viên kem tươi", "a colorful mini cupcake or fruit gelato for festive delight"),
            4: ("trái cây tươi gọt sẵn (táo, ổi) giòn ngọt thanh lịch", "neatly sliced apples or pears for clean, orderly dessert"),
            5: ("kem ốc quế mát lạnh hoặc món tráng miệng phong cách mới", "an ice cream cone or a trendy sweet treat for novelty"),
            6: ("bánh su kem hoặc bánh tart trái cây ngọt ngào", "a cream puff or fruit tart for warm, caring sweetness"),
            7: ("đĩa dưa hấu hoặc thanh long ướp lạnh thanh khiết", "chilled watermelon or dragon fruit slices for pure lightness"),
            8: ("bánh tiramisu hoặc mousse socola đậm đà cao cấp", "rich tiramisu or dark chocolate mousse for a rewarding treat"),
            9: ("một chén chè nhãn nhục hạt sen thanh tao", "a light lotus seed and longan sweet soup to close sweetly"),
        }
    },
    "food_spicy_or_mild": {
        "cat": "food", "slug": "spicy_or_mild",
        "q_vi": "Ăn cay nồng hay vị ngọt thanh tự nhiên?", "q_en": "Should I choose spicy food or a naturally mild sweet taste?",
        "synonyms": ["ăn cay hay không cay", "ăn cay nồng hay ngọt thanh", "spicy or mild taste", "flavor preference today"],
        "days": {
            1: ("vị cay nồng ấm áp để kích hoạt nhiệt huyết hành động", "a warm spicy kick to ignite energy and bold momentum"),
            2: ("vị ngọt thanh tự nhiên, nhẹ dịu cho dạ dày", "a naturally mild, soothing flavor that feels gentle and easy"),
            3: ("vị chua cay đan xen rộn ràng, kích thích vị giác", "a lively sweet-and-sour or tangy flavor to lift your mood"),
            4: ("vị mặn ngọt cân bằng, tròn vị theo công thức truyền thống", "a balanced, traditional savory taste with no extreme spices"),
            5: ("vị cay lạ miệng (sốt ớt Hàn hoặc mù tạt) tạo cảm giác sảng khoái", "an adventurous spicy flavor (like chili sauce or wasabi) for novelty"),
            6: ("vị ngọt thanh từ rau củ hầm và nước dùng tự nhiên", "naturally sweet broth simmered from wholesome vegetables"),
            7: ("vị thanh đạm nguyên bản, nêm nếm tối giản", "pure, minimal seasoning that honors natural fresh flavors"),
            8: ("vị đậm đà có tiêu tỏi thơm nồng, dứt khoát", "rich, savory seasoning with aromatic garlic and black pepper"),
            9: ("vị thanh nhẹ, dễ chịu giúp làm sạch vòm họng", "mild, clean seasoning that brings a peaceful, gentle finish"),
        }
    },

    # --- DRINK (8 questions) ---
    "drink_coffee": {
        "cat": "drink", "slug": "coffee",
        "q_vi": "Sáng nay uống cà phê đen, bạc xỉu hay cà phê muối?", "q_en": "Should I have black coffee, a milky coffee, or salted coffee this morning?",
        "synonyms": ["uống cà phê đen bạc xỉu hay cà phê muối", "chọn loại cafe nào", "black coffee or milky coffee or salted coffee"],
        "days": {
            1: ("cà phê đen đá đậm vị để kích hoạt sự tập trung tiên phong", "bold black coffee to spark sharp focus and initiative"),
            2: ("bạc xỉu ngọt ngào, nhiều sữa êm dịu cho buổi sáng nhẹ nhàng", "a sweet, gentle milky coffee (bac xiu) for a soft start"),
            3: ("cà phê muối béo mặn tạo cảm hứng sáng tạo và vui vẻ", "salted cream coffee for a playful, creative flavor twist"),
            4: ("cà phê đen ít đường hoặc Americano chuẩn mực, gọn gàng", "clean Americano or low-sugar black coffee for steady routine"),
            5: ("cà phê Cold Brew ủ lạnh hoặc cà phê cốt dừa mới lạ", "chilled cold brew or coconut coffee for refreshing novelty"),
            6: ("cà phê sữa truyền thống ấm áp, dễ chịu", "comforting traditional Vietnamese milk coffee enjoyed slowly"),
            7: ("cà phê pha phin chậm rãi hoặc chuyển sang trà xanh mạn", "slow-drip artisan coffee or light green tea for quiet focus"),
            8: ("cà phê Espresso đôi đậm đặc để tối ưu hóa năng suất", "a double espresso shot for peak drive and decisive execution"),
            9: ("cà phê nhẹ hoặc bạc xỉu đá ít ngọt để khép lại chu kỳ êm ả", "a light coffee or gentle iced milk coffee to finish smoothly"),
        }
    },
    "drink_milk_tea_or_fruit_tea": {
        "cat": "drink", "slug": "milk_tea_or_fruit_tea",
        "q_vi": "Trà sữa béo ngậy hay trà trái cây thanh mát?", "q_en": "Should I choose rich milk tea or refreshing fruit tea?",
        "synonyms": ["uống trà sữa hay trà trái cây", "chọn trà sữa hay trà đào", "milk tea or fruit tea"],
        "days": {
            1: ("trà trái cây nhiệt đới (trà ổi hồng hoặc trà tắc) nạp năng lượng tươi mới", "a zesty tropical fruit tea (pink guava or kumquat) for fresh vigor"),
            2: ("trà sữa lài hoặc trà sữa ô long ít đường êm ái", "gentle jasmine milk tea with low sugar for soothing comfort"),
            3: ("trà đào cam sả hoặc trà mãng cầu vui tươi, thơm lừng", "peach lemongrass tea or soursop tea for lively inspiration"),
            4: ("trà trái cây ít ngọt với thạch nha đam thanh gọn", "low-sugar fruit tea with aloe vera for neat, clean hydration"),
            5: ("trà sữa trân châu phô mai nướng hoặc trà trái cây mix mới lạ", "trendy boba cheese milk tea or an experimental mixed fruit tea"),
            6: ("trà sữa kem trứng ấm áp hoặc trà hoa quả quây quần", "creamy egg pudding milk tea for cozy, caring sweetness"),
            7: ("trà sen vàng thanh nhã hoặc trà trái cây thuần tự nhiên", "pure lotus seed tea or unsweetened fruit infusion for tranquility"),
            8: ("trà sữa đậm vị trà ô long nướng cao cấp", "rich roasted oolong milk tea for a refined, premium treat"),
            9: ("trà dưa hấu hoặc trà dâu tằm thanh nhiệt mát lành", "refreshing watermelon or mulberry fruit tea to cleanse and cool"),
        }
    },
    "drink_detox": {
        "cat": "drink", "slug": "detox",
        "q_vi": "Nên uống nước chanh mật ong, nước dừa hay cần tây?", "q_en": "Should I choose lemon honey water, coconut water, or celery juice?",
        "synonyms": ["uống chanh mật ong nước dừa hay cần tây", "chọn nước detox nào", "lemon honey or coconut water or celery juice"],
        "days": {
            1: ("nước chanh mật ong ấm kích hoạt hệ tiêu hóa và tinh thần", "warm lemon honey water to jumpstart digestion and vitality"),
            2: ("nước dừa tươi ngọt lành bù khoáng dịu nhẹ", "fresh young coconut water for gentle natural hydration"),
            3: ("nước ép cần tây kết hợp táo xanh thơm mát, sảng khoái", "celery juice with green apple for a crisp, refreshing lift"),
            4: ("nước chanh gừng mật ong chuẩn mực, giữ ấm cơ thể", "warm lemon ginger honey water for reliable, grounded wellness"),
            5: ("nước dừa tắc hoặc nước ép cần tây dưa leo giải nhiệt mới mẻ", "coconut water with a twist of citrus for playful hydration"),
            6: ("nước mật ong chanh đào ấm áp chăm sóc cổ họng", "warm honey lemon infusion to soothe and care for your throat"),
            7: ("nước ép cần tây nguyên chất thanh lọc sâu", "pure cold-pressed celery juice for deep mindful detox"),
            8: ("nước dừa tươi kèm cơm dừa nạp nhanh năng lượng khoáng", "fresh coconut water with coconut meat for sustained stamina"),
            9: ("nước chanh ấm pha loãng giúp cơ thể thanh nhẹ, thoải mái", "gentle warm lemon water to close the day clean and light"),
        }
    },
    "drink_afternoon_drink": {
        "cat": "drink", "slug": "afternoon_drink",
        "q_vi": "Chiều nay uống matcha, nước tăng lực hay trà đậm?", "q_en": "Should I have matcha, an energy drink, or strong tea this afternoon?",
        "synonyms": ["chiều nay uống matcha hay trà đậm", "thức uống chống buồn ngủ buổi chiều", "matcha energy drink or strong tea"],
        "days": {
            1: ("một ly matcha latte đá đậm vị hoặc trà đen giúp tỉnh táo nhanh", "a rich iced matcha latte or bold black tea for crisp focus"),
            2: ("matcha latte êm dịu, ít ngọt để giữ tâm trạng an hòa", "gentle, low-sweetness matcha latte for calm productivity"),
            3: ("trà trái cây sủi bọt hoặc matcha đá xay tạo hứng khởi", "sparkling fruit tea or matcha frappe for playful creativity"),
            4: ("trà mạn ô long ủ lạnh không đường, tập trung hoàn thành việc", "unsweetened cold-brew oolong tea for disciplined concentration"),
            5: ("trà sữa matcha kem tuyết hoặc nước khoáng có ga chanh", "matcha cream slush or sparkling lemon mineral water for novelty"),
            6: ("matcha ấm thơm lừng, xua tan cảm giác mệt mỏi", "a warm comforting matcha latte to soothe midday fatigue"),
            7: ("trà xanh mạn nóng hổi, nhâm nhi tĩnh tâm", "hot brewed green tea enjoyed slowly for peaceful focus"),
            8: ("trà đen đậm đặc hoặc matcha nguyên chất tối ưu năng suất", "strong black tea or ceremonial matcha for decisive stamina"),
            9: ("nước khoáng mát hoặc trà thảo mộc nhẹ nhàng giải nhiệt", "cool mineral water or light herbal tea to finish work peacefully"),
        }
    },
    "drink_juice_color": {
        "cat": "drink", "slug": "juice_color",
        "q_vi": "Uống nước ép màu đỏ hay màu vàng?", "q_en": "Should I choose red or yellow fruit juice?",
        "synonyms": ["uống nước ép màu đỏ hay màu vàng", "chọn nước ép tone đỏ hay vàng", "red juice or yellow juice"],
        "days": {
            1: ("nước ép màu Đỏ (dưa hấu hoặc củ dền) bổ máu, kích hoạt năng lượng", "Red juice (watermelon or beetroot) to ignite bold vitality"),
            2: ("nước ép màu Vàng nhạt (lê hoặc dưa lưới) dịu nhẹ, cân bằng", "Soft Yellow juice (pear or melon) for soothing, gentle balance"),
            3: ("nước ép màu Vàng cam rực rỡ (cam hoặc dứa) khơi mở niềm vui", "Bright Yellow-Orange juice (orange or pineapple) for sunny cheer"),
            4: ("nước ép màu Vàng tươi (táo vàng hoặc cà rốt) đều đặn, bổ dưỡng", "Golden Apple or Carrot juice for steady, wholesome nutrition"),
            5: ("nước ép mix Đỏ và Vàng (dưa hấu cam) bùng nổ hương vị", "Red-and-Yellow blend (watermelon citrus) for playful adventure"),
            6: ("nước ép màu Đỏ hồng (lựu hoặc dâu tây) ngọt ngào, chăm sóc làn da", "Rose-Red juice (pomegranate or strawberry) for skin-loving care"),
            7: ("nước ép màu Vàng chanh thanh tao hoặc nước dừa tươi trong vắt", "Light lemon-apple juice or clear coconut water for pure clarity"),
            8: ("nước ép màu Đỏ thẫm (củ dền táo gừng) tăng cường thể lực", "Deep Red juice (beetroot apple ginger) for power and drive"),
            9: ("nước ép màu Đỏ cam tươi mát (cà chua táo hoặc dưa hấu mát)", "Refreshing Red-Orange juice (tomato apple) to cleanse smoothly"),
        }
    },
    "drink_evening_drink": {
        "cat": "drink", "slug": "evening_drink",
        "q_vi": "Tối nay uống sữa ấm hay trà hoa cúc?", "q_en": "Should I have warm milk or chamomile tea tonight?",
        "synonyms": ["tối nay uống sữa ấm hay trà hoa cúc", "thức uống dễ ngủ buổi tối", "warm milk or chamomile tea tonight"],
        "days": {
            1: ("một ly sữa hạt ấm nhỏ giúp cơ thể phục hồi thể lực sau ngày dài", "a small cup of warm nut milk to restore physical energy"),
            2: ("trà hoa cúc mật ong êm dịu, xua tan căng thẳng tâm trí", "calming chamomile tea with a touch of honey to unwind gently"),
            3: ("trà hoa quả thảo mộc ấm dịu thơm ngọt ngào", "warm fruit-infused herbal tea for a cozy, cheerful bedtime"),
            4: ("sữa tươi không đường hâm ấm đúng giờ trước khi ngủ", "plain warm milk taken at a regular hour for sound sleep routine"),
            5: ("trà bạc hà ấm thoang thoảng tạo cảm giác nhẹ nhõm", "light warm peppermint tea for a fresh, relaxed sensation"),
            6: ("sữa hạt sen hoặc sữa hạnh nhân ấm áp, yêu chiều bản thân", "warm lotus seed or almond milk for deep nurturing comfort"),
            7: ("trà hoa cúc thuần khiết không đường, tĩnh tâm chiêm nghiệm", "pure unsweetened chamomile tea for quiet meditation before bed"),
            8: ("sữa nghệ ấm (Golden Milk) giúp tái tạo năng lượng sâu", "warm golden turmeric milk for deep restoration and strength"),
            9: ("một ly nước ấm nhẹ hoặc trà hoa cúc loãng khép lại ngày", "a gentle cup of warm water or light chamomile to rest cleanly"),
        }
    },
    "drink_sugar_level": {
        "cat": "drink", "slug": "sugar_level",
        "q_vi": "Giảm đường trong ly nước xuống mức nào?", "q_en": "How much should I reduce the sugar in my drink?",
        "synonyms": ["giảm bao nhiêu đường", "chọn mức đường", "uống ngọt hay ít đường", "sugar level in drink"],
        "days": {
            1: ("giảm xuống mức 50% đường để giữ tỉnh táo và năng lượng dồi dào", "reduce to 50% sugar for crisp energy without a heavy sugar crash"),
            2: ("chọn 30% đường hoặc ngọt thanh nhẹ nhàng, êm dịu", "choose 30% sugar for a gentle, subtle sweetness"),
            3: ("giữ mức 50% - 70% đường vừa vặn để thưởng thức trọn vị vui tươi", "keep at 50%-70% sugar to enjoy full, vibrant flavor"),
            4: ("giảm hẳn xuống 0% - 30% đường theo kỷ luật sức khỏe lành mạnh", "drop to 0%-30% sugar for structured, healthy discipline"),
            5: ("thay đường bằng mật ong hoặc đường thốt nốt mới lạ", "substitute refined sugar with honey or natural sweetener for novelty"),
            6: ("chọn 50% đường ngọt ngào vừa phải, tạo cảm giác dễ chịu", "pick 50% sugar for comforting, well-rounded sweetness"),
            7: ("chọn 0% đường (không đường nguyên bản) để thanh lọc vị giác", "choose 0% sugar (unsweetened) for pure, mindful clarity"),
            8: ("chọn 30% đường hoặc uống mộc để duy trì thể trạng đỉnh cao", "opt for 30% sugar or plain to sustain peak physical performance"),
            9: ("chọn mức ngọt rất nhẹ (20% - 30%) hoặc không đường", "choose very low sugar (20%-30%) to close the day lightly"),
        }
    },
    "drink_warm_or_iced": {
        "cat": "drink", "slug": "warm_or_iced",
        "q_vi": "Uống nước ấm thanh lọc hay nước đá mát lạnh?", "q_en": "Should I choose warm water or iced water?",
        "synonyms": ["uống nước ấm hay nước đá", "chọn nước nóng hay nước lạnh", "warm water or iced water"],
        "days": {
            1: ("nước mát vừa phải giúp sảng khoái và kích hoạt tinh thần hành động", "cool water for a crisp, refreshing boost to take action"),
            2: ("nước ấm dịu nhẹ bảo vệ cổ họng và tạo cảm giác ấm áp", "soothing warm water to comfort your throat and ease tension"),
            3: ("nước mát kèm vài lát chanh/cam tươi tạo sự tươi tắn", "chilled water with citrus slices for bright, lively hydration"),
            4: ("nước ấm nhiệt độ phòng đều đặn từng ngụm nhỏ", "room-temperature or gentle warm water sipped regularly"),
            5: ("nước đá lạnh có ga sảng khoái xua tan sự bí bách", "refreshing sparkling iced water to break monotony"),
            6: ("nước ấm mật ong hoặc nước thảo mộc êm dịu", "warm herbal water to nurture comfort throughout the day"),
            7: ("nước ấm tinh khiết giúp cơ thể tĩnh tâm và thanh lọc", "pure warm water for mindful hydration and inner calm"),
            8: ("nước mát bổ sung khoáng chất duy trì thể lực cao", "cool mineral water to sustain sharp stamina and drive"),
            9: ("nước ấm thanh nhẹ giúp cơ thể đào thải độc tố", "light warm water to gently flush and cleanse the system"),
        }
    },

    # --- FASHION (8 questions) ---
    "fashion_lucky_color": {
        "cat": "fashion", "slug": "lucky_color",
        "q_vi": "Hôm nay mặc outfit tông màu gì?", "q_en": "What color tone should I wear today?",
        "synonyms": ["hôm nay mặc màu gì", "màu áo may mắn", "outfit màu gì", "what color to wear today", "lucky outfit color"],
        "days": {
            1: ("tông Vàng rực rỡ, Đỏ cam hoặc Ánh kim thể hiện sự tiên phong", "bright Gold, Red-Orange, or Metallic accents for bold leadership"),
            2: ("tông Trắng, Kem hoặc Xanh lá pastel nhẹ nhàng hòa hợp", "pure White, Cream, or soft Pastel Green for soothing harmony"),
            3: ("tông Vàng tươi, Hồng hoặc Tím hoa cà sáng tạo, nổi bật", "sunny Yellow, Pink, or Violet for cheerful creative expression"),
            4: ("tông Xanh Navy, Xám đậm hoặc Nâu đất chỉn chu, chuyên nghiệp", "Navy Blue, Dark Grey, or Earth Brown for neat professionalism"),
            5: ("tông Xanh ngọc (Turquoise), Bạc hoặc Pastel đa sắc linh hoạt", "Turquoise, Silver, or multi-tone Pastels for flexible freedom"),
            6: ("tông Xanh da trời, Hồng phấn hoặc Xanh rêu ấm áp, thẩm mỹ", "Sky Blue, Blush Pink, or Moss Green for loving, aesthetic warmth"),
            7: ("tông Tím khói, Trắng bạc hoặc Xanh lam trầm tĩnh chiêm nghiệm", "Smoky Purple, Silver-White, or Deep Indigo for quiet depth"),
            8: ("tông Đen sang trọng, Đỏ Bordeaux hoặc Xanh than quyền lực", "Classic Black, Bordeaux Red, or Midnight Blue for executive confidence"),
            9: ("tông Đỏ tươi, Đỏ Ruby hoặc Vàng đồng tỏa sáng hào sảng", "Ruby Red, Crimson, or Bronze for compassionate brilliance"),
        }
    },
    "fashion_style": {
        "cat": "fashion", "slug": "style",
        "q_vi": "Phong cách năng động thoải mái hay thanh lịch chỉn chu?", "q_en": "Should my style be relaxed and active or polished and elegant?",
        "synonyms": ["phong cách ăn mặc hôm nay", "mặc năng động hay lịch sự", "casual or elegant style today"],
        "days": {
            1: ("phong cách dứt khoát, sắc sảo và tự tin tạo ấn tượng ban đầu", "an assertive, sharp style that projects confidence immediately"),
            2: ("phong cách mềm mại, thanh lịch và tạo cảm giác dễ gần gũi", "a soft, graceful style that feels approachable and warm"),
            3: ("phong cách trẻ trung, nhiều điểm nhấn vui tươi và sáng tạo", "a youthful, expressive style with playful, creative accents"),
            4: ("phong cách gọn gàng, chuẩn form và tối giản thanh lịch", "a neat, structured, minimalist style for focused composure"),
            5: ("phong cách năng động, phóng khoáng và sẵn sàng dịch chuyển", "an active, relaxed, and versatile style ready for movement"),
            6: ("phong cách trang nhã, chỉnh chu với chất liệu vải êm ái", "an elegant, well-groomed style with comfortable, refined fabrics"),
            7: ("phong cách tối giản tinh tế, không cầu kỳ hay phô trương", "an understated, minimal style with thoughtful subtlety"),
            8: ("phong cách sang trọng, quyền lực và khẳng định vị thế", "a tailored, upscale executive look that commands respect"),
            9: ("phong cách phóng khoáng, nhẹ nhàng và thoải mái tự nhiên", "an open, graceful, and natural style that radiates ease"),
        }
    },
    "fashion_top": {
        "cat": "fashion", "slug": "top",
        "q_vi": "Áo thun basic hay sơ mi/áo kiểu cách điệu?", "q_en": "Should I wear a basic T-shirt or a styled shirt?",
        "synonyms": ["mặc áo thun hay sơ mi", "chọn áo gì hôm nay", "t-shirt or button shirt today"],
        "days": {
            1: ("áo sơ mi đứng form hoặc áo polo sắc nét tạo vẻ tự tin", "a crisp button-down shirt or sharp polo for decisive presence"),
            2: ("áo thun cotton mềm mại hoặc áo sơ mi lụa nhẹ nhàng", "a soft cotton tee or flowing silk shirt for gentle comfort"),
            3: ("áo kiểu có họa tiết vui tươi hoặc áo thun in hình sáng tạo", "a styled top with playful patterns or creative graphic tee"),
            4: ("áo sơ mi cổ điển được ủi phẳng phiu, ngăn nắp", "a neatly pressed classic button-down shirt for clean order"),
            5: ("áo thun oversize thoải mái hoặc áo layer khoác ngoài linh hoạt", "a relaxed oversize tee or a versatile layered overshirt"),
            6: ("áo dệt kim mềm hoặc áo blouse trang nhã, ấm cúng", "a cozy knit top or an elegant blouse that feels welcoming"),
            7: ("áo thun trơn màu tối giản hoặc sơ mi vải đũi mộc mạc", "a plain monochrome tee or natural linen shirt for calm ease"),
            8: ("áo sơ mi cao cấp phối cùng blazer lịch lãm", "a premium tailored shirt paired with a sharp blazer"),
            9: ("áo thun form rộng thoải mái hoặc áo cổ tim nhẹ nhàng", "a breathable, flowing top or classic V-neck for effortless grace"),
        }
    },
    "fashion_bottom": {
        "cat": "fashion", "slug": "bottom",
        "q_vi": "Quần jeans cá tính hay quần tây/váy nhẹ nhàng?", "q_en": "Should I wear expressive jeans or tailored pants/a light skirt?",
        "synonyms": ["mặc quần jeans hay quần tây", "chọn quần hay váy hôm nay", "jeans or tailored pants or skirt"],
        "days": {
            1: ("quần tây đứng form hoặc quần jeans tối màu dứt khoát", "tailored trousers or dark structured jeans for strong posture"),
            2: ("quần vải mềm suông hoặc chân váy nhẹ nhàng thướt tha", "flowing soft pants or a graceful midi skirt for ease"),
            3: ("quần jeans ống rộng cá tính hoặc chân váy xếp ly tươi tắn", "wide-leg expressive jeans or a playful pleated skirt"),
            4: ("quần tây âu thẳng thớm hoặc chân váy bút chì chuẩn mực", "straight-cut tailored slacks or a classic pencil skirt"),
            5: ("quần jeans co giãn thoải mái hoặc quần túi hộp năng động", "flexible stretch jeans or dynamic cargo pants for freedom"),
            6: ("quần kaki mềm mại hoặc chân váy xòe duyên dáng", "comfortable chinos or a charming A-line skirt"),
            7: ("quần ống suông vải tự nhiên (linen) nhẹ nhõm, mộc mạc", "loose natural linen trousers for unburdened calm"),
            8: ("quần âu cắt may cao cấp tôn dáng và chuyên nghiệp", "bespoke tailored trousers that enhance commanding presence"),
            9: ("quần culottes thoải mái hoặc chân váy maxi nhẹ nhàng", "relaxed culottes or a breezy maxi skirt to move freely"),
        }
    },
    "fashion_shoes": {
        "cat": "fashion", "slug": "shoes",
        "q_vi": "Đi giày sneaker, cao gót hay loafer?", "q_en": "Should I wear sneakers, heels, or loafers?",
        "synonyms": ["đi giày gì hôm nay", "chọn sneaker cao gót hay loafer", "sneakers heels or loafers"],
        "days": {
            1: ("đôi giày tây sắc sảo hoặc sneaker form gọn tạo bước đi tự tin", "sharp dress shoes or sleek clean sneakers for purposeful steps"),
            2: ("giày loafer êm ái hoặc giày búp bê nhẹ nhàng, dễ chịu", "cushioned loafers or soft flats for smooth, gentle movement"),
            3: ("đôi sneaker nổi bật nhiều màu sắc hoặc giày mule sành điệu", "colorful statement sneakers or trendy mules for fun energy"),
            4: ("giày da Oxford hoặc loafer cổ điển, chắc chắn và chuẩn mực", "classic leather Oxfords or sturdy loafers for dependable footing"),
            5: ("giày sneaker thể thao đa năng, linh hoạt cho mọi cung đường", "versatile athletic sneakers ready for any sudden move"),
            6: ("giày cao gót thấp êm chân hoặc giày da mềm trang nhã", "low-block comfortable heels or soft leather shoes for grace"),
            7: ("giày slip-on tối giản hoặc dép quai hậu da mộc mạc", "minimalist slip-ons or simple leather sandals for quiet ease"),
            8: ("giày cao gót mũi nhọn quyền lực hoặc giày da bóng bẩy", "commanding pointed heels or polished dress shoes for prestige"),
            9: ("đôi giày vải hoặc sneaker nhẹ nhàng, êm ái suốt ngày", "lightweight canvas shoes or soft sneakers for effortless steps"),
        }
    },
    "fashion_accessory": {
        "cat": "fashion", "slug": "accessory",
        "q_vi": "Phụ kiện điểm nhấn nên là đồng hồ, vòng đá hay dây chuyền?", "q_en": "Should my accent accessory be a watch, stone bracelet, or necklace?",
        "synonyms": ["chọn phụ kiện gì", "đeo đồng hồ vòng tay hay dây chuyền", "watch bracelet or necklace accessory"],
        "days": {
            1: ("chiếc đồng hồ mặt kim loại sắc nét thể hiện sự chủ động", "a sharp metallic watch that embodies punctuality and control"),
            2: ("vòng đá thạch anh hồng hoặc ngọc bích tạo sự dịu dàng", "a rose quartz or jade bracelet for soft harmonious vibration"),
            3: ("chiếc dây chuyền mặt độc đáo hoặc hoa tai bắt mắt", "a playful pendant necklace or eye-catching statement earrings"),
            4: ("chiếc đồng hồ dây da cổ điển, tối giản và bền bỉ", "a classic leather-strap watch for orderly, timeless focus"),
            5: ("chiếc kính râm thời trang hoặc vòng đeo tay phong cách mới", "stylish sunglasses or an unconventional wrist accessory"),
            6: ("dây chuyền ngọc trai hoặc khăn lụa quàng cổ tinh tế", "a delicate pearl necklace or fine silk scarf for elegance"),
            7: ("vòng đá phong thủy trầm mộc hoặc nhẫn bạc tối giản", "a wooden mala bracelet or minimal silver ring for grounding"),
            8: ("đồng hồ cao cấp mạ vàng/bạc hoặc khuy cài áo sang trọng", "a luxury gold/silver watch or polished lapel pin for stature"),
            9: ("vòng tay sợi may mắn hoặc phụ kiện mang tính kỷ niệm", "a meaningful charm bracelet or keepsake accessory to cherish"),
        }
    },
    "fashion_perfume": {
        "cat": "fashion", "slug": "perfume",
        "q_vi": "Mùi nước hoa nên là hương gỗ, hoa cỏ hay biển?", "q_en": "Should I choose a woody, floral, or ocean-like fragrance?",
        "synonyms": ["xịt nước hoa mùi gì", "hương gỗ hoa cỏ hay biển", "woody floral or aquatic perfume"],
        "days": {
            1: ("hương cam chanh (Citrus) kết hợp gỗ ấm nồng nàn, thức tỉnh", "invigorating citrus and warm cedarwood to spark drive"),
            2: ("hương hoa nhài, hoa hồng nhẹ nhàng thanh khiết", "gentle jasmine or fresh rose notes for soothing softness"),
            3: ("hương trái cây ngọt ngào, cam ngọt và vani rạng rỡ", "sparkling fruity notes, sweet orange, and vanilla for joy"),
            4: ("hương cỏ hương bài (Vetiver) và gỗ tuyết tùng đĩnh đạc", "grounded vetiver and crisp cedarwood for focused composure"),
            5: ("hương biển tươi mát (Aquatic) và bạc hà sảng khoái", "breezy aquatic notes with crisp mint for free-spirited freshness"),
            6: ("hương hoa huệ, hoa mẫu đơn ấm áp và quyến rũ", "warm peony and creamy white florals for loving elegance"),
            7: ("hương trầm hương, đàn hương (Sandalwood) sâu lắng tĩnh tại", "deep sandalwood and frankincense for quiet mindfulness"),
            8: ("hương da thuộc, hổ phách và gỗ mun sang trọng quyền uy", "rich leather, amber, and dark woods for commanding prestige"),
            9: ("hương trà trắng và hoa sen thanh tao, trong lành", "white tea and lotus flower for pure, uplifting lightness"),
        }
    },
    "fashion_bag": {
        "cat": "fashion", "slug": "bag",
        "q_vi": "Túi xách nên là balo, túi tote hay túi da nhỏ?", "q_en": "Should I carry a backpack, tote, or small leather bag?",
        "synonyms": ["dùng túi xách gì", "mang balo túi tote hay túi da", "backpack tote or leather bag today"],
        "days": {
            1: ("chiếc túi xách da đứng form gọn gàng để chủ động công việc", "a structured leather briefcase or sharp handbag for bold work"),
            2: ("chiếc túi tote vải mềm mại, tiện lợi và gần gũi", "a soft canvas tote bag for gentle, casual utility"),
            3: ("túi đeo chéo có màu sắc nổi bật hoặc họa tiết vui tươi", "a colorful crossbody bag with playful personality"),
            4: ("balo chuyên dụng ngăn nắp đựng laptop và tài liệu chỉn chu", "a neatly organized backpack with dedicated laptop compartments"),
            5: ("túi bao tử đeo ngực hoặc balo nhẹ linh hoạt cho ngày dịch chuyển", "a compact sling bag or light backpack ready for dynamic movement"),
            6: ("túi xách da mềm dáng tròn ấm cúng và thanh lịch", "a soft leather hobo or shoulder bag for graceful everyday comfort"),
            7: ("túi tote tối giản màu mộc, chỉ mang những vật dụng thiết yếu", "a minimalist plain tote carrying only mindful essentials"),
            8: ("túi da cao cấp dáng hộp sắc sảo khẳng định đẳng cấp", "a premium structured leather satchel that exudes success"),
            9: ("túi vải canvas nhẹ nhàng, dọn sạch đồ đạc thừa bên trong", "a lightweight canvas bag, decluttered of all unnecessary weight"),
        }
    },

    # --- WORK (8 questions) ---
    "work_morning_priority": {
        "cat": "work", "slug": "morning_priority",
        "q_vi": "Nhiệm vụ quan trọng nhất cần giải quyết đầu buổi sáng là gì?", "q_en": "What important task should I solve first this morning?",
        "synonyms": ["việc ưu tiên buổi sáng", "nhiệm vụ quan trọng nhất hôm nay", "morning work priority", "most important task"],
        "days": {
            1: ("chọn việc khó nhất, đòi hỏi sự quyết đoán và giải quyết ngay", "tackle the most challenging task demanding bold initiative first"),
            2: ("rà soát lại các phản hồi, lắng nghe và hỗ trợ các khúc mắc của đồng đội", "review team feedback, listen carefully, and align next steps"),
            3: ("viết lách, lên ý tưởng sáng tạo hoặc chuẩn bị bài thuyết trình", "draft creative ideas, content, or presentation concepts"),
            4: ("rà soát số liệu, chuẩn hóa quy trình và dọn dẹp checklist việc cần làm", "audit figures, standardize workflows, and clear your checklist"),
            5: ("thử nghiệm một giải pháp mới để tháo gỡ điểm nghẽn dự án", "test a novel workaround to break through an existing bottleneck"),
            6: ("họp trao đổi thân tình, chăm sóc tiến độ và động viên tập thể", "hold a warm check-in to support team morale and progress"),
            7: ("nghiên cứu sâu tài liệu, phân tích dữ liệu một mình không phân tâm", "conduct deep focused research and analysis without distractions"),
            8: ("tập trung vào các đầu mối tài chính, chốt hợp đồng hoặc chỉ số KPI", "focus on financial metrics, deal closures, and key KPIs"),
            9: ("hoàn tất dứt điểm các dự án còn dang dở trước khi nhận việc mới", "wrap up loose ends on pending projects before taking on new ones"),
        }
    },
    "work_deep_work_or_team": {
        "cat": "work", "slug": "deep_work_or_team",
        "q_vi": "Nên làm việc độc lập hay họp nhóm, trao đổi?", "q_en": "Should I work independently or meet and collaborate with the team?",
        "synonyms": ["làm việc độc lập hay họp nhóm", "làm một mình hay cùng team", "deep work or team collaboration"],
        "days": {
            1: ("tập trung làm việc độc lập để tự mình ra quyết định dứt khoát", "focus on independent deep work to make swift, decisive calls"),
            2: ("dành thời gian họp nhóm, lắng nghe và phối hợp nhịp nhàng", "collaborate with team members, listening and aligning smoothly"),
            3: ("tổ chức buổi brainstorm sôi nổi, tự do chia sẻ ý tưởng mới", "lead a lively brainstorming session with open, playful sharing"),
            4: ("làm việc độc lập theo quy trình chuẩn hóa, không bị ngắt quãng", "work independently within structured, uninterrupted blocks"),
            5: ("kết hợp trao đổi nhanh linh hoạt và chuyển đổi nhiệm vụ linh động", "blend quick agile check-ins with dynamic task switching"),
            6: ("làm việc nhóm trong bầu không khí hỗ trợ và đồng cảm", "collaborate in a supportive, empathetic team environment"),
            7: ("dành trọn thời gian cho Deep Work đơn độc, tắt mọi thông báo", "commit to solitary deep work with all notifications muted"),
            8: ("chủ trì cuộc họp điều hành, giao việc rõ ràng và kiểm soát tiến độ", "chair the executive meeting with clear delegation and milestones"),
            9: ("họp tổng kết ngắn gọn để khép lại các giai đoạn công việc cũ", "hold a brief retrospective to close finished milestones smoothly"),
        }
    },
    "work_new_idea": {
        "cat": "work", "slug": "new_idea",
        "q_vi": "Có nên gửi đề xuất hoặc ý tưởng mới hôm nay không?", "q_en": "Should I send a new proposal or idea today?",
        "synonyms": ["có nên gửi đề xuất mới", "trình bày ý tưởng mới hôm nay", "send proposal or new idea today"],
        "days": {
            1: ("rất nên gửi ngay hôm nay với tâm thế tự tin và chủ động", "yes, send it today with strong confidence and clear initiative"),
            2: ("hãy trao đổi nhẹ nhàng với đồng sự trước khi gửi bản chính thức", "consult with a trusted peer gently before submitting officially"),
            3: ("rất phù hợp để trình bày ý tưởng sáng tạo với hình thức bắt mắt", "ideal day to pitch creative ideas with engaging, lively visuals"),
            4: ("hãy kiểm tra kỹ lại số liệu và tính khả thi trước khi gửi", "review figures and feasibility checklists carefully before sending"),
            5: ("nên đề xuất một góc nhìn đột phá, phá vỡ lối mòn cũ", "propose an innovative angle that challenges outdated routines"),
            6: ("trình bày ý tưởng với trọng tâm là mang lại lợi ích chung", "frame the proposal around collective benefit and shared harmony"),
            7: ("nên dành hôm nay để hoàn thiện thêm lập luận chi tiết, chưa vội gửi", "spend today refining arguments and evidence in quiet depth first"),
            8: ("gửi đề xuất với các số liệu chứng minh hiệu quả tài chính rõ ràng", "submit proposals backed by clear ROI and measurable impact"),
            9: ("chỉ nên gửi nếu đề xuất giúp giải quyết dứt điểm các vướng mắc cũ", "submit only if the idea helps resolve and close legacy issues"),
        }
    },
    "work_inbox_or_tabs": {
        "cat": "work", "slug": "inbox_or_tabs",
        "q_vi": "Nên dọn hộp thư đến hay dọn các tab trình duyệt?", "q_en": "Should I clean my inbox or clear my browser tabs?",
        "synonyms": ["dọn email hay dọn tab trình duyệt", "inbox zero hay tắt tab", "clean inbox or browser tabs"],
        "days": {
            1: ("dọn dẹp nhanh các email quan trọng và lưu lại các tab cần thiết", "quickly process priority emails and archive essential tabs"),
            2: ("trả lời các email cần phản hồi lịch thiệp, giữ hòa khí", "reply to emails requiring thoughtful, polite communication"),
            3: ("lưu lại các bài viết cảm hứng vào sổ tay rồi đóng bớt tab", "bookmark inspiring reads and close distracting clutter tabs"),
            4: ("thực hiện dọn dẹp Inbox Zero và đóng toàn bộ tab thừa", "execute full Inbox Zero and close all unused browser tabs neatly"),
            5: ("đóng ngay 50% số tab không còn dùng để giải phóng bộ nhớ", "purge 50% of stale browser tabs to refresh your mental bandwidth"),
            6: ("sắp xếp lại hộp thư theo từng thư mục dự án ngăn nắp", "organize email folders thoughtfully to keep communication smooth"),
            7: ("tắt hết các tab gây xao nhãng để tập trung vào 1 trang duy nhất", "close all noisy tabs to focus on a single meaningful screen"),
            8: ("xóa bỏ các email rác và gắn nhãn các hợp đồng quan trọng", "delete junk mail and tag high-value contracts and receipts"),
            9: ("thanh lọc triệt để cả hộp thư lẫn tab trình duyệt cũ", "perform a thorough clean-up of both inbox and legacy tabs"),
        }
    },
    "work_pomodoro_or_deep": {
        "cat": "work", "slug": "pomodoro_or_deep",
        "q_vi": "Nên làm Pomodoro 25 phút hay liền mạch 90 phút?", "q_en": "Should I use 25-minute Pomodoro blocks or a 90-minute focus block?",
        "synonyms": ["chọn pomodoro 25p hay 90p", "làm việc theo chu kỳ nào", "pomodoro 25 min or 90 min deep block"],
        "days": {
            1: ("làm một khối 90 phút liền mạch để tạo bước đột phá nhanh", "use a solid 90-minute focus block for an uninterrupted breakthrough"),
            2: ("chia nhỏ 25 phút Pomodoro nhẹ nhàng để giữ nhịp độ thoải mái", "use gentle 25-minute Pomodoros to maintain balanced rhythm"),
            3: ("áp dụng Pomodoro 25 phút kết hợp giải lao ngắn vui vẻ", "use 25-minute Pomodoros with cheerful mini-breaks in between"),
            4: ("thực hiện nghiêm ngặt chu kỳ Pomodoro 25 phút có ghi chép", "stick strictly to 25-minute Pomodoros with structured tracking"),
            5: ("linh hoạt thay đổi giữa 25 phút và 50 phút tùy hứng thú", "flexibly adapt between 25 and 50-minute bursts as energy flows"),
            6: ("làm việc nhịp độ vừa phải 45-50 phút rồi nghỉ ngơi thư thái", "work in 45-50 minute moderate blocks with caring rest intervals"),
            7: ("chọn khối Deep Work 90 phút hoàn toàn tĩnh lặng", "commit to a 90-minute deep silence block for profound immersion"),
            8: ("làm việc 90 phút tập trung cao độ hướng thẳng đến kết quả", "run high-intensity 90-minute sprints focused on key deliverables"),
            9: ("chia các phiên 25 phút ngắn để dọn dẹp nốt các việc còn lại", "use short 25-minute sprints to finish remaining backlog items"),
        }
    },
    "work_negotiation": {
        "cat": "work", "slug": "negotiation",
        "q_vi": "Hôm nay có nên đàm phán hợp đồng hoặc đề xuất lương không?", "q_en": "Is today suitable for negotiating a contract or salary?",
        "synonyms": ["đàm phán lương hôm nay", "ký hợp đồng đề xuất lương", "salary negotiation contract signing today"],
        "days": {
            1: ("rất thuận lợi để chủ động đưa ra đề xuất với phong thái tự tin", "very favorable for initiating negotiations with bold clarity"),
            2: ("tập trung lắng nghe điều kiện của đối phương và tìm điểm hòa giải", "focus on listening and exploring win-win mutual compromises"),
            3: ("tận dụng khả năng hoạt ngôn và sự duyên dáng để tạo thiện cảm", "use charming, expressive communication to build positive rapport"),
            4: ("chuẩn bị đầy đủ chứng từ, số liệu chi tiết trước khi bước vào bàn đàm phán", "bring meticulous data, records, and terms before negotiating"),
            5: ("sẵn sàng đưa ra các phương án linh hoạt, thay thế nếu gặp trở ngại", "propose flexible, creative alternatives if discussions stall"),
            6: ("đàm phán trên tinh thần thấu hiểu và cùng có lợi lâu dài", "negotiate with empathy, focusing on sustainable long-term partnership"),
            7: ("nên nghiên cứu sâu các điều khoản hợp đồng, chưa vội chốt ngay", "review contract clauses in quiet depth; defer final signing"),
            8: ("ngày đắc địa để chốt các thỏa thuận tài chính lớn và khẳng định giá trị", "prime day for closing major financial deals and asserting value"),
            9: ("hoàn tất ký kết các điều khoản đã thống nhất từ trước", "finalize and sign terms that were previously well aligned"),
        }
    },
    "work_yes_or_no": {
        "cat": "work", "slug": "yes_or_no",
        "q_vi": "Nên đồng ý nắm bắt cơ hội hay nói không để bảo vệ thời gian?", "q_en": "Should I say yes to an opportunity or protect my time by saying no?",
        "synonyms": ["nói đồng ý hay từ chối", "chấp nhận cơ hội hay bảo vệ thời gian", "say yes or no to opportunity"],
        "days": {
            1: ("nói ĐỒNG Ý với cơ hội mới mẻ đòi hỏi tính tiên phong", "say YES to fresh opportunities requiring bold initiative"),
            2: ("nói KHÔNG khéo léo với những việc gây xung đột hoặc áp lực", "say a gentle NO to requests that cause undue friction or strain"),
            3: ("nói ĐỒNG Ý với những lời mời giao lưu hoặc sáng tạo", "say YES to creative collaborations and uplifting invitations"),
            4: ("nói KHÔNG với những việc ngoài kế hoạch để bảo vệ trật tự", "say a firm NO to unplanned distractions to protect your structure"),
            5: ("nói ĐỒNG Ý để thử thách bản thân với một trải nghiệm lạ", "say YES to step outside your comfort zone for valuable learning"),
            6: ("nói ĐỒNG Ý nếu việc đó giúp đỡ được người bạn quan tâm", "say YES if it genuinely supports someone you care about"),
            7: ("nói KHÔNG dứt khoát để bảo vệ không gian tĩnh lặng cá nhân", "say a clear NO to protect your quiet time and energy"),
            8: ("nói ĐỒNG Ý với những cơ hội mang lại giá trị tài chính thực tế", "say YES to opportunities offering clear financial growth"),
            9: ("nói KHÔNG với các nghĩa vụ mới để tập trung hoàn thành việc cũ", "say NO to new commitments so you can wrap up current loops"),
        }
    },
    "work_old_or_new_project": {
        "cat": "work", "slug": "old_or_new_project",
        "q_vi": "Nên giải quyết việc tồn đọng cũ hay mở dự án mới?", "q_en": "Should I clear old work or start a new project?",
        "synonyms": ["làm việc cũ hay dự án mới", "giải quyết việc tồn đọng hay mở mới", "clear backlog or start new project"],
        "days": {
            1: ("khởi động dự án mới mà bạn đã ấp ủ bấy lâu", "launch the new project you have been eager to pioneer"),
            2: ("hỗ trợ hoàn thiện các phần việc chung còn dang dở cùng đồng đội", "cooperatively assist in finishing shared ongoing tasks"),
            3: ("phác thảo các ý tưởng sơ khởi cho dự án mới với tinh thần sáng tạo", "sketch creative starter concepts for upcoming initiatives"),
            4: ("tập trung giải quyết triệt để danh sách việc tồn đọng cũ", "focus systematically on clearing your existing task backlog"),
            5: ("thử nghiệm một hướng đi mới cho công việc hiện tại", "test a novel, agile angle within your current assignments"),
            6: ("chăm sóc và hoàn thiện chu đáo các dự án đang triển khai", "nurture and refine active projects with caring attention to detail"),
            7: ("đánh giá lại toàn diện các dự án cũ trước khi mở việc mới", "review existing project architecture deeply before expanding"),
            8: ("đẩy mạnh tiến độ dự án trọng điểm mang lại kết quả lớn", "accelerate the main high-impact project for tangible results"),
            9: ("dứt khoát đóng lại các dự án cũ và dọn sạch tồn đọng", "decisively wrap up and archive finished legacy projects"),
        }
    },

    # --- RELAX (8 questions) ---
    "relax_playlist": {
        "cat": "relax", "slug": "playlist",
        "q_vi": "Playlist hôm nay nên là lofi, pop sôi động hay piano?", "q_en": "Should today's playlist be lo-fi, upbeat pop, or piano?",
        "synonyms": ["nghe nhạc gì hôm nay", "chọn playlist lofi pop hay piano", "lofi pop or piano music today"],
        "days": {
            1: ("nhạc Pop sôi động hoặc Rock truyền cảm hứng thúc đẩy hành động", "upbeat pop or energizing rock to fuel decisive momentum"),
            2: ("nhạc Acoustic êm dịu hoặc Lofi nhẹ nhàng thư thái", "gentle acoustic melodies or mellow lo-fi for soft balance"),
            3: ("nhạc Pop vui tươi, Dance hoặc nhạc có lời rộn ràng", "cheerful pop, dance, or upbeat vocal tracks for joyful mood"),
            4: ("nhạc Baroque không lời hoặc Lofi nhịp điệu đều đặn tập trung", "instrumental Baroque or steady lo-fi beats for structured focus"),
            5: ("nhạc Indie phá cách, EDM hoặc danh sách bài hát mới lạ", "indie gems, upbeat electronic, or eclectic new releases"),
            6: ("nhạc Jazz ấm áp, R&B hoặc tình ca ngọt ngào", "warm jazz, soulful R&B, or soothing ballads for comforting ease"),
            7: ("nhạc Piano cổ điển, tiếng mưa hoặc nhạc thiền định", "classical piano, nature soundscapes, or meditative ambient"),
            8: ("nhạc giao hưởng hùng tráng hoặc Epic Cinematic nâng tầm khí thế", "epic cinematic soundtracks or powerful orchestral pieces"),
            9: ("nhạc thiền chuông xoay hoặc giai điệu thanh khiết buông thư", "singing bowls or ethereal ambient melodies to unwind deeply"),
        }
    },
    "relax_film": {
        "cat": "relax", "slug": "film",
        "q_vi": "Nên xem phim hài, trinh thám hay tài liệu?", "q_en": "Should I watch a comedy, mystery, or documentary?",
        "synonyms": ["xem phim hài trinh thám hay tài liệu", "tối nay xem phim gì", "comedy mystery or documentary film"],
        "days": {
            1: ("phim hành động phiêu lưu hoặc phim truyền cảm hứng khởi nghiệp", "an inspiring action or entrepreneurial movie to ignite drive"),
            2: ("phim tâm lý tình cảm nhẹ nhàng hoặc phim hoạt hình ấm áp", "a gentle romance or heartwarming animated story"),
            3: ("phim hài hước dí dỏm hoặc phim âm nhạc sôi động", "a witty comedy or upbeat musical for pure laughter"),
            4: ("phim trinh thám phá án có cốt truyện logic, chặt chẽ", "a structured mystery or detective thriller with smart logic"),
            5: ("phim viễn tưởng khoa học (Sci-Fi) hoặc phiêu lưu khám phá", "a mind-bending Sci-Fi or adventurous discovery film"),
            6: ("phim gia đình ấm cúng hoặc câu chuyện chữa lành tâm hồn", "a cozy family drama or heartwarming healing story"),
            7: ("phim tài liệu khoa học, triết học hoặc phim nghệ thuật sâu sắc", "a deep documentary, philosophical piece, or arthouse film"),
            8: ("phim tiểu sử doanh nhân hoặc drama tài chính kịch tính", "a biographical business drama or high-stakes financial story"),
            9: ("phim nhân văn ý nghĩa hoặc một tập phim ngắn khép lại nhẹ nhõm", "a meaningful humanitarian film or gentle short cinema"),
        }
    },
    "relax_podcast": {
        "cat": "relax", "slug": "podcast",
        "q_vi": "Nên nghe podcast về tài chính, tâm lý hay đời sống?", "q_en": "Should I listen to a finance, psychology, or life podcast?",
        "synonyms": ["nghe podcast chủ đề gì", "podcast tài chính tâm lý hay đời sống", "finance psychology or life podcast"],
        "days": {
            1: ("podcast về lãnh đạo, câu chuyện thành công và tư duy dẫn đầu", "a podcast on leadership, bold mindset, and initiative"),
            2: ("podcast về tâm lý học hành vi và nghệ thuật lắng nghe", "a podcast exploring empathy, relationships, and active listening"),
            3: ("podcast trò chuyện dí dỏm, nghệ thuật hoặc sáng tạo nội dung", "a cheerful conversational podcast on arts, culture, or humor"),
            4: ("podcast về quản lý thời gian, năng suất và xây dựng thói quen", "a practical podcast on habit building and structured productivity"),
            5: ("podcast về du lịch trải nghiệm, văn hóa mới và phong cách sống tự do", "a travel, nomadic lifestyle, or cultural discovery podcast"),
            6: ("podcast về chữa lành cảm xúc, gia đình và tình yêu thương", "a nurturing podcast on emotional wellness and family care"),
            7: ("podcast về triết học, thiền định và chiều sâu tâm thức", "a deep podcast on philosophy, mindfulness, and consciousness"),
            8: ("podcast về đầu tư, tài chính cá nhân và chiến lược kinh doanh", "a strategic podcast on investing, wealth, and career mastery"),
            9: ("podcast về bài học buông bỏ, sống tối giản và nhân đạo", "a podcast on minimalism, gratitude, and letting go gracefully"),
        }
    },
    "relax_book": {
        "cat": "relax", "slug": "book",
        "q_vi": "Nên đọc sách phát triển bản thân, tiểu thuyết hay thơ?", "q_en": "Should I read self-development, fiction, or poetry?",
        "synonyms": ["đọc sách gì tối nay", "chọn sách phát triển bản thân tiểu thuyết hay thơ", "self-help fiction or poetry book"],
        "days": {
            1: ("sách phát triển bản thân về tính quyết đoán và lãnh đạo", "a self-development book on decisiveness and taking initiative"),
            2: ("tập thơ nhẹ nhàng hoặc tản văn dịu mát tâm hồn", "gentle poetry or comforting reflective essays"),
            3: ("tiểu thuyết hài hước hoặc truyện phiêu lưu giàu trí tưởng tượng", "an imaginative fiction novel or humorous storytelling"),
            4: ("sách kỹ năng chuyên môn, phương pháp quản trị ngăn nắp", "a structured non-fiction book on methodology and mastery"),
            5: ("sách du ký khám phá thế giới hoặc tiểu thuyết khoa học viễn tưởng", "a travelogue or thrilling sci-fi adventure"),
            6: ("tiểu thuyết tình cảm gia đình hoặc sách nấu ăn, nghệ thuật sống", "a heartwarming domestic novel or lifestyle art book"),
            7: ("sách triết học phương Đông, tâm linh hoặc thiền quán", "Eastern philosophy, mindfulness, or spiritual wisdom literature"),
            8: ("sách tiểu sử nhân vật kiệt xuất hoặc sách tài chính kinh điển", "a biography of an extraordinary achiever or financial classic"),
            9: ("sách về buông bỏ, tha thứ và nghệ thuật sống an nhiên", "a book on letting go, forgiveness, and mindful peace"),
        }
    },
    "relax_meditation_music": {
        "cat": "relax", "slug": "meditation_music",
        "q_vi": "Có nên nghe nhạc thiền 432Hz hoặc 528Hz không?", "q_en": "Should I listen to 432Hz or 528Hz meditation music?",
        "synonyms": ["nghe nhạc thiền 432hz 528hz", "có nên nghe nhạc thiền hôm nay", "listen to 432hz or 528hz music"],
        "days": {
            1: ("rất nên nghe 528Hz trong 15 phút để tái tạo năng lượng tích cực", "listen to 528Hz for 15 minutes to stimulate positive transformation"),
            2: ("nghe nhạc tần số 432Hz êm ái giúp xoa dịu cảm xúc nhạy cảm", "listen to soothing 432Hz frequencies to calm sensitive emotions"),
            3: ("kết hợp nhạc thiền nhẹ với vài phút thư giãn sáng tạo", "enjoy light harmonic meditation tones to refresh creative flow"),
            4: ("nghe tần số Solfeggio đều đặn hỗ trợ giấc ngủ đúng giờ", "play steady Solfeggio frequencies to support regular sleep routine"),
            5: ("thử trải nghiệm nhạc chuông xoay Tây Tạng mới mẻ", "explore Tibetan singing bowl resonance for refreshing novelty"),
            6: ("nghe nhạc tần số tình yêu 528Hz để nuôi dưỡng sự ấm áp", "embrace 528Hz love frequency to nurture warmth and self-care"),
            7: ("dành trọn 30 phút tĩnh lặng cùng sóng âm 432Hz thanh lọc sâu", "immerse in 30 minutes of 432Hz sound therapy for deep inner quiet"),
            8: ("nghe nhạc sóng Alpha nâng cao sự tập trung và minh triết", "listen to Alpha brainwave audio for sharp focus and clarity"),
            9: ("nghe âm thanh chuông gió hoặc sóng biển để buông xả muộn phiền", "let gentle wind chimes or ocean waves release all residual tension"),
        }
    },
    "relax_digital_detox": {
        "cat": "relax", "slug": "digital_detox",
        "q_vi": "Có nên tắt mạng xã hội hai tiếng buổi tối không?", "q_en": "Should I turn off social media for two hours tonight?",
        "synonyms": ["tắt mạng xã hội 2 tiếng", "digital detox tối nay", "turn off social media tonight"],
        "days": {
            1: ("nên tắt sớm để dành trọn buổi tối lên kế hoạch cho mục tiêu lớn", "yes, log off early to focus your evening on goal planning"),
            2: ("nên tắt màn hình để trò chuyện trực tiếp cùng người thân yêu", "yes, unplug to have real, caring conversations with loved ones"),
            3: ("có thể lướt xem nội dung vui vẻ một chút rồi chuyển sang đọc sách", "enjoy a short cheerful scroll, then switch to creative offline time"),
            4: ("rất nên thực hiện nghiêm túc việc tắt thông báo sau 20h", "strongly recommended to enforce a strict no-notification rule after 8 PM"),
            5: ("thử thách không dùng điện thoại để đi dạo ngắm phố phường", "challenge yourself to leave the phone aside and take a walk"),
            6: ("tắt mạng xã hội để cùng gia đình chuẩn bị bữa tối ấm cúng", "disconnect from feeds to share cozy evening routines with family"),
            7: ("tuyệt đối nên tắt mọi thiết bị để tâm trí hoàn toàn tĩnh lặng", "essential to disconnect completely for peaceful mental sanctuary"),
            8: ("tắt thông báo sau khi đã hoàn tất các email công việc quan trọng", "turn off social notifications once core work targets are delivered"),
            9: ("rất nên thanh lọc tâm trí, tránh xa tin tức độc hại vào cuối ngày", "highly advised to cleanse your mind from noisy feeds before sleep"),
        }
    },
    "relax_asmr_or_live": {
        "cat": "relax", "slug": "asmr_or_live",
        "q_vi": "Nên xem ASMR thư giãn hay livestream trò chuyện?", "q_en": "Should I watch relaxing ASMR or a conversational livestream?",
        "synonyms": ["xem asmr hay livestream", "chọn asmr hay live trò chuyện", "watch asmr or livestream"],
        "days": {
            1: ("chọn một video ngắn truyền cảm hứng thay vì xem quá lâu", "watch a short inspiring clip rather than lingering on screen"),
            2: ("xem livestream trò chuyện nhẹ nhàng tạo cảm giác gắn kết", "watch a warm, friendly livestream for gentle connection"),
            3: ("xem livestream hài hước, giải trí sôi động cùng cộng đồng", "join a cheerful, humorous livestream for shared laughter"),
            4: ("chọn ASMR âm thanh mưa rơi hoặc tiếng gõ bàn phím gọn gàng", "listen to structured rain or typing ASMR for orderly relaxation"),
            5: ("thử một video ASMR trải nghiệm âm thanh 3D mới lạ", "explore an immersive 3D binaural ASMR soundscape for novelty"),
            6: ("xem video nấu ăn hoặc chăm sóc thú cưng ngọt ngào, ấm cúng", "watch soothing baking or pet-care videos for gentle comfort"),
            7: ("chọn ASMR tiếng thiên nhiên tĩnh lặng hoặc tắt máy đi ngủ sớm", "choose natural ambient sounds or turn off the screen for sleep"),
            8: ("xem video phân tích ngắn gọn, súc tích rồi nghỉ ngơi đúng giờ", "watch a concise analytical breakdown, then rest on schedule"),
            9: ("chọn ASMR tiếng sóng biển rì rào để dễ dàng đi vào giấc ngủ", "listen to soft ocean wave ASMR to drift smoothly into sleep"),
        }
    },
    "relax_sky_photo": {
        "cat": "relax", "slug": "sky_photo",
        "q_vi": "Có nên chụp một bức ảnh bầu trời hôm nay không?", "q_en": "Should I take a photo of the sky today?",
        "synonyms": ["chụp ảnh bầu trời hôm nay", "ngắm mây chụp ảnh trời", "take photo of sky today"],
        "days": {
            1: ("hãy chụp khoảnh khắc bình minh rạng rỡ chào đón khởi đầu mới", "capture the bright sunrise to celebrate a bold new beginning"),
            2: ("chụp bầu trời mây trắng bồng bềnh nhẹ nhàng lúc ban trưa", "photograph soft drifting clouds at midday for peaceful calm"),
            3: ("chụp khoảnh khắc rực rỡ nhiều sắc màu lúc hoàng hôn", "snap the vibrant, colorful sunset to inspire creative joy"),
            4: ("dành 2 phút ngắm vòm trời trong xanh để thư giãn đôi mắt", "pause for 2 minutes gazing at the clear blue sky to rest your eyes"),
            5: ("chụp một góc phố độc đáo cùng bầu trời lúc đổi gió", "capture an unconventional cityscape against the changing sky"),
            6: ("chụp bầu trời hoàng hôn ấm áp và chia sẻ cùng bạn bè", "take a warm sunset photo to share with someone dear"),
            7: ("ngắm nhìn bầu trời đêm đầy sao trong sự tĩnh lặng", "contemplate the quiet night sky and stars in peaceful stillness"),
            8: ("chụp bầu trời khoáng đạt từ tầng cao để mở rộng tầm nhìn", "photograph the expansive horizon from a high vantage point"),
            9: ("ngắm ráng chiều buông xuống và gửi lời cảm ơn một ngày trọn vẹn", "watch the twilight fade and offer gratitude for a full day"),
        }
    },

    # --- WELLNESS (8 questions) ---
    "wellness_exercise": {
        "cat": "wellness", "slug": "exercise",
        "q_vi": "Bài tập hôm nay nên là chạy bộ, gym, yoga hay đi bộ nhẹ?", "q_en": "Should today's exercise be running, gym, yoga, or a light walk?",
        "synonyms": ["tập thể dục gì hôm nay", "chạy bộ gym yoga hay đi bộ", "running gym yoga or walk today"],
        "days": {
            1: ("chạy bộ bứt tốc hoặc tập gym cường độ cao để giải phóng năng lượng", "a brisk run or high-intensity gym workout to release power"),
            2: ("tập Yoga giãn cơ mềm mại hoặc bơi lội nhẹ nhàng", "gentle restorative yoga or a relaxed swim for harmony"),
            3: ("tham gia lớp nhảy Zumba, Cardio vui nhộn hoặc đạp xe cùng bạn", "a fun Zumba class, upbeat dance cardio, or social cycling"),
            4: ("bài tập thể lực có giáo án chuẩn mực (Calisthenics hoặc tạ chuẩn)", "a disciplined, structured resistance workout with proper form"),
            5: ("thử một môn thể thao mới lạ (leo núi nhân tạo, cầu lông)", "try a fresh physical activity like bouldering or badminton"),
            6: ("đi bộ công viên thư thái hoặc bài tập Pilates chăm sóc vóc dáng", "a scenic park walk or mindful Pilates to nurture your body"),
            7: ("tập Yoga tĩnh tại kết hợp thiền định và hít thở sâu", "gentle Yin yoga paired with mindful breathwork in quiet"),
            8: ("tập tạ tăng cơ hoặc chạy bền chinh phục cột mốc mới", "heavy compound lifting or endurance running for high achievement"),
            9: ("đi bộ thảnh thơi và thực hiện các động tác căng cơ nhẹ nhàng", "a leisurely walk and light full-body stretching to unwind"),
        }
    },
    "wellness_shower": {
        "cat": "wellness", "slug": "shower",
        "q_vi": "Nên tắm nước ấm thư giãn hay nước mát sảng khoái?", "q_en": "Should I take a warm relaxing shower or a cool refreshing one?",
        "synonyms": ["tắm nước nóng hay nước lạnh", "tắm nước ấm hay nước mát", "warm or cool shower today"],
        "days": {
            1: ("tắm nước mát buổi sáng để kích hoạt sự sảng khoái và tỉnh táo", "a cool, crisp morning shower to awaken vitality and focus"),
            2: ("tắm nước ấm thư thái với tinh dầu dịu nhẹ trước khi ngủ", "a soothing warm bath with gentle essential oils for comfort"),
            3: ("tắm vòi sen mát mẻ kết hợp sữa tắm hương trái cây tươi tắn", "a refreshing shower with fruity, uplifting shower gel"),
            4: ("tắm nước ấm vừa phải theo thói quen sinh hoạt điều độ", "a moderate warm shower within your consistent daily routine"),
            5: ("tắm chuyển đổi nhiệt độ (ấm sang mát) tăng cường tuần hoàn", "a contrast shower (warm to cool) to boost circulation and vigor"),
            6: ("ngâm bồn nước ấm với muối khoáng chăm sóc làn da", "a warm mineral soak to pamper your muscles and skin"),
            7: ("tắm nước ấm trong không gian yên tĩnh, tắt bớt đèn chói", "a quiet, dimly-lit warm shower for peaceful mindfulness"),
            8: ("tắm nước mát dứt khoát phục hồi cơ bắp sau ngày làm việc", "a revitalizing cool shower to reset muscles and stamina"),
            9: ("tắm nước ấm gột rửa mọi căng thẳng của ngày dài", "a comforting warm rinse to wash away all residual fatigue"),
        }
    },
    "wellness_bedtime": {
        "cat": "wellness", "slug": "bedtime",
        "q_vi": "Giờ đi ngủ tối nay nên sắp xếp thế nào?", "q_en": "How should I arrange my bedtime tonight?",
        "synonyms": ["mấy giờ đi ngủ tối nay", "ngủ sớm hay ngủ muộn", "bedtime schedule tonight"],
        "days": {
            1: ("đi ngủ trước 23h để cơ thể sẵn sàng đón ngày mới tràn trề năng lượng", "sleep before 11 PM to wake up charged with fresh drive"),
            2: ("lên giường sớm hơn 30 phút, đọc vài trang sách nhẹ trước khi ngủ", "wind down 30 minutes earlier with a gentle read"),
            3: ("thư giãn đầu óc nhẹ nhàng rồi đi ngủ đúng giấc tự nhiên", "relax your mind happily and drift into sleep at a natural hour"),
            4: ("cố định giờ đi ngủ chính xác (ví dụ 22h30) để giữ nhịp sinh học", "lock in a fixed bedtime (e.g., 10:30 PM) for strict circadian rhythm"),
            5: ("tạo không gian phòng ngủ thoáng đãng, mát mẻ để dễ chìm vào giấc", "keep the bedroom cool and well-ventilated for restful sleep"),
            6: ("chuẩn bị chăn gối thơm tho, ấm áp và đi ngủ trong sự dễ chịu", "prepare cozy, fresh bedding to sleep in nurturing comfort"),
            7: ("tắt mọi thiết bị điện tử từ 21h30 để tâm trí hoàn toàn tĩnh lặng", "power off all screens by 9:30 PM for deep restorative sleep"),
            8: ("ngủ đủ 7-8 tiếng trọn vẹn để tái tạo hiệu suất làm việc đỉnh cao", "ensure a solid 7-8 hours of sleep to sustain peak performance"),
            9: ("buông bỏ mọi lo âu, đi ngủ sớm để khép lại chu kỳ trọn vẹn", "let go of all worries and sleep early to reset peacefully"),
        }
    },
    "wellness_skincare": {
        "cat": "wellness", "slug": "skincare",
        "q_vi": "Nên đắp mặt nạ, tẩy da chết hay mát-xa mặt?", "q_en": "Should I use a face mask, exfoliate, or massage my face?",
        "synonyms": ["chăm sóc da hôm nay", "đắp mặt nạ tẩy tế bào chết hay massage", "face mask exfoliate or facial massage"],
        "days": {
            1: ("rửa mặt sạch sâu và thoa kem dưỡng ẩm mỏng nhẹ nhanh gọn", "deep-cleanse and apply a light hydrating serum efficiently"),
            2: ("đắp mặt nạ dưỡng ẩm cấp nước dịu nhẹ cho làn da mềm mịn", "apply a gentle hydrating sheet mask for soothing moisture"),
            3: ("đắp mặt nạ đất sét thanh lọc kết hợp mặt nạ trái cây tươi tắn", "use a revitalizing clay or vitamin C mask for glowing skin"),
            4: ("thực hiện đầy đủ các bước dưỡng da chuẩn mực theo đúng thứ tự", "follow your structured step-by-step skincare routine diligently"),
            5: ("tẩy tế bào chết nhẹ nhàng để làm mới bề mặt làn da", "gently exfoliate to sweep away dullness and refresh your skin"),
            6: ("mát-xa mặt nâng cơ bằng thanh lăn ngọc bích hoặc dầu dưỡng", "perform a relaxing jade-roller facial massage with nourishing oil"),
            7: ("chăm sóc da tối giản với nước hoa hồng hữu cơ và kem dưỡng mộc", "stick to minimalist organic toner and clean, gentle cream"),
            8: ("sử dụng serum chống lão hóa cao cấp chăm sóc chuyên sâu", "apply an intensive peptide or retinol serum for premium care"),
            9: ("đắp mặt nạ làm dịu da và rửa mặt bằng nước ấm thanh khiết", "use a calming aloe vera mask and rinse with pure warm water"),
        }
    },
    "wellness_breathing": {
        "cat": "wellness", "slug": "breathing",
        "q_vi": "Nên tập thở bụng sâu hay thở 4-7-8 giữa giờ?", "q_en": "Should I practice deep belly breathing or 4-7-8 breathing?",
        "synonyms": ["bài tập thở giữa giờ", "thở bụng hay thở 478", "deep belly breathing or 478 breathing"],
        "days": {
            1: ("thực hiện 5 chu kỳ hít thở sâu đẩy căng lồng ngực lấy lại khí thế", "take 5 deep, chest-opening breaths to instantly recharge power"),
            2: ("thực hành thở bụng êm dịu trong 3 phút để làm mềm cơ thể", "practice gentle diaphragmatic belly breathing for 3 minutes"),
            3: ("thở nhịp nhàng kết hợp mỉm cười giải tỏa mọi áp lực", "breathe rhythmically with a soft smile to release built-up tension"),
            4: ("áp dụng kỹ thuật thở hộp (Box Breathing 4-4-4-4) ổn định tâm trí", "use Box Breathing (4-4-4-4) for disciplined mental equilibrium"),
            5: ("hít thở luân phiên hai cánh mũi (Nadi Shodhana) làm mới luồng khí", "try alternate nostril breathing to refresh oxygenation and balance"),
            6: ("thở sâu chạm tay lên ngực cảm nhận sự bình an và ấm áp", "breathe with a hand on your heart to cultivate self-compassion"),
            7: ("thực hành kỹ thuật thở 4-7-8 tĩnh lặng trước khi đi ngủ", "practice the 4-7-8 breathing method for deep serene stillness"),
            8: ("hít thở sâu bằng cơ hoành giữ thẳng cột sống khẳng định nội lực", "breathe deeply through your diaphragm with tall, strong posture"),
            9: ("thở ra thật dài để tống sạch khí tù hãm và buông lỏng toàn thân", "take long, releasing exhales to let go of all physical strain"),
        }
    },
    "wellness_supplement": {
        "cat": "wellness", "slug": "supplement",
        "q_vi": "Có nên bổ sung vitamin hoặc khoáng chất hôm nay không?", "q_en": "Should I take a vitamin or mineral supplement today?",
        "synonyms": ["uống vitamin gì hôm nay", "bổ sung khoáng chất thực phẩm chức năng", "vitamins or supplements today"],
        "days": {
            1: ("bổ sung Vitamin B-Complex hoặc Vitamin C để duy trì thể lực dồi dào", "take Vitamin B-Complex or Vitamin C with breakfast for active energy"),
            2: ("uống viên Magie hoặc men vi sinh nhẹ nhàng hỗ trợ tiêu hóa", "consider gentle Magnesium or probiotics for soothing balance"),
            3: ("bổ sung Vitamin C từ trái cây tươi tự nhiên như cam, ổi", "enjoy natural Vitamin C from fresh oranges or berries for glow"),
            4: ("uống đầy đủ các loại vitamin theo đơn hoặc thói quen đều đặn", "take your prescribed daily vitamins on exact schedule with water"),
            5: ("bổ sung điện giải hoặc khoáng chất sau khi vận động", "replenish electrolytes or minerals after dynamic physical movement"),
            6: ("bổ sung Omega-3 hoặc Collagen chăm sóc khớp và làn da", "take Omega-3 or Collagen to support joint and skin vitality"),
            7: ("ưu tiên nạp vi chất từ rau củ quả tươi sạch thay vì thuốc", "prioritize raw organic greens and clean whole foods for nutrients"),
            8: ("bổ sung Vitamin D3 + K2 và Kẽm tăng cường sức đề kháng bền vững", "take Vitamin D3 + K2 and Zinc to sustain robust immunity"),
            9: ("uống nhiều nước lọc và nước ấm thanh lọc cơ thể tự nhiên", "drink ample pure water to support the body's natural cleansing"),
        }
    },
    "wellness_foot_soak": {
        "cat": "wellness", "slug": "foot_soak",
        "q_vi": "Có nên ngâm chân nước muối gừng ấm trước khi ngủ không?", "q_en": "Should I soak my feet in warm ginger-salt water before bed?",
        "synonyms": ["ngâm chân nước gừng muối", "ngâm chân buổi tối", "warm foot soak ginger salt"],
        "days": {
            1: ("rất nên ngâm chân 15 phút để thư giãn cơ bắp sau ngày di chuyển nhiều", "soak feet for 15 minutes to relax active muscles after a busy day"),
            2: ("ngâm chân nước ấm thêm vài giọt tinh dầu oải hương dịu êm", "enjoy a warm soak with lavender drops to ease sensitive nerves"),
            3: ("ngâm chân thảo mộc hoa cúc ấm áp và nghe bản nhạc yêu thích", "enjoy a chamomile herbal foot bath with your favorite tunes"),
            4: ("thực hiện ngâm chân nước muối gừng ấm đúng 15-20 phút theo thói quen", "soak in warm ginger-salt water for a structured 15-20 minutes"),
            5: ("thêm muối khoáng Epsom vào nước ấm giúp khử mỏi đôi chân", "add Epsom salts to warm water to relieve restless legs"),
            6: ("tự mát-xa lòng bàn chân sau khi ngâm nước ấm chăm sóc cơ thể", "massage your foot soles gently after a warm soak for self-care"),
            7: ("ngâm chân trong không gian yên tĩnh, tập trung vào hơi thở", "soak in quiet darkness, focusing on calm, grounding breaths"),
            8: ("ngâm chân nước nóng vừa phải kích hoạt các huyệt đạo lưu thông khí huyết", "use comfortably hot water to stimulate acupressure points and vigor"),
            9: ("ngâm chân muối ấm để giải phóng mọi mệt mỏi tích tụ của ngày", "soak in warm sea salt to discharge all residual daily fatigue"),
        }
    },
    "wellness_neck_stretch": {
        "cat": "wellness", "slug": "neck_stretch",
        "q_vi": "Động tác giãn cơ cổ vai gáy nào nên làm ngay?", "q_en": "What neck and shoulder stretch should I do now?",
        "synonyms": ["giãn cơ cổ vai gáy", "động tác đỡ mỏi cổ", "neck and shoulder stretch exercises"],
        "days": {
            1: ("xoay tròn bả vai ra sau 10 lần và vươn căng lồng ngực", "roll shoulders backward 10 times and open your chest assertively"),
            2: ("nghiêng đầu nhẹ nhàng sang hai bên, giữ mỗi bên 15 giây", "gently tilt your head side to side, holding 15 seconds each"),
            3: ("vươn hai tay lên cao đan ngón tay vào nhau và kéo giãn toàn thân", "interlace fingers overhead and stretch upward with a deep breath"),
            4: ("thực hiện chuỗi động tác gập duỗi cổ 4 hướng chậm rãi, chuẩn xác", "perform methodical 4-direction neck stretches with strict form"),
            5: ("đứng dậy xoay vặn thân người nhẹ nhàng và lắc cổ tay thư giãn", "stand up, perform light torso twists, and shake out your wrists"),
            6: ("dùng tay tự xoa bóp nhẹ vùng cơ thang sau gáy với dầu ấm", "gently knead your upper trapezius muscles with warm care"),
            7: ("ngồi thẳng lưng, cúi nhẹ đầu về phía trước cảm nhận sự giãn nở tĩnh tại", "sit tall, gently tuck your chin to your chest in quiet release"),
            8: ("ép chặt hai bả vai vào nhau giữ 5 giây rồi thả lỏng lặp lại 5 lần", "pinch shoulder blades together firmly for 5 seconds, repeat 5 times"),
            9: ("thả lỏng hoàn toàn cổ và vai, thở ra thật chậm giải phóng áp lực", "drop shoulders completely and exhale slowly to let go of tension"),
        }
    },

    # --- LIFESTYLE (6 questions) ---
    "lifestyle_transport": {
        "cat": "lifestyle", "slug": "transport",
        "q_vi": "Nên tự lái xe hay đi phương tiện công cộng?", "q_en": "Should I drive myself or use public transport?",
        "synonyms": ["tự lái xe hay đi xe buýt", "chọn phương tiện đi lại", "drive myself or public transport"],
        "days": {
            1: ("tự lái xe máy hoặc ô tô để hoàn toàn làm chủ lộ trình và thời gian", "drive yourself to stay fully in command of your schedule"),
            2: ("đi xe buýt, tàu điện hoặc đi chung xe cùng bạn bè nhẹ nhàng", "take the bus, metro, or carpool with friends for easy harmony"),
            3: ("đi xe đạp dạo phố hoặc bắt chuyến xe công nghệ ngắm phố phường", "ride a bicycle or take a rideshare to enjoy the lively streets"),
            4: ("chọn phương tiện quen thuộc, xuất phát đúng giờ theo lịch trình", "use your reliable, familiar transport and depart strictly on time"),
            5: ("thử trải nghiệm một tuyến xe buýt mới hoặc đi bộ đoạn đường ngắn", "try a new transit line or walk part of the journey for novelty"),
            6: ("lái xe cẩn thận, nhường đường và giữ tâm trạng ôn hòa", "drive safely, yield politely, and maintain a caring, calm attitude"),
            7: ("đi bộ trong không gian yên tĩnh hoặc chọn phương tiện ít ồn ào", "walk quietly or choose less crowded transport for mental peace"),
            8: ("chọn phương tiện nhanh chóng, tối ưu hóa thời gian di chuyển", "pick the fastest, most efficient transport to maximize productivity"),
            9: ("chọn phương tiện công cộng thân thiện môi trường", "choose eco-friendly public transit to travel with a light footprint"),
        }
    },
    "lifestyle_route": {
        "cat": "lifestyle", "slug": "route",
        "q_vi": "Nên đi cung đường quen thuộc hay thử lối rẽ mới?", "q_en": "Should I take the familiar route or try a new turn?",
        "synonyms": ["đi đường quen hay đường mới", "chọn lối đi nào hôm nay", "familiar route or new turn today"],
        "days": {
            1: ("chủ động rẽ vào một con đường thoáng đãng hơn để tiết kiệm thời gian", "take a clear, open alternative route to save time decisively"),
            2: ("đi cung đường quen thuộc êm ả, có nhiều cây xanh bóng mát", "stick to a peaceful, tree-lined familiar road for calm driving"),
            3: ("thử đi qua con phố rực rỡ nhiều cửa hàng nhộn nhịp", "pass through a lively, colorful street for joyful inspiration"),
            4: ("đi đúng cung đường quen thuộc chuẩn xác về mặt thời gian", "follow your trusted standard route for predictable punctuality"),
            5: ("thử một lối rẽ mới toanh an toàn để khám phá cảnh quan mới", "explore a safe new shortcut or scenic road for fresh adventure"),
            6: ("chọn con đường rộng rãi, an toàn và dễ đi nhất", "choose the widest, safest, and most comfortable route for ease"),
            7: ("chọn tuyến đường ít khói bụi và tránh xa các nút giao ồn ào", "take quieter backstreets away from loud, congested traffic"),
            8: ("chọn tuyến đường cao tốc hoặc đại lộ nhanh nhất để đến đích", "take the express avenue for maximum speed and punctuality"),
            9: ("đi cung đường quen thuộc thảnh thơi, không vội vã", "travel your familiar route peacefully with no need to rush"),
        }
    },
    "lifestyle_bike_walk": {
        "cat": "lifestyle", "slug": "bike_walk",
        "q_vi": "Có nên đi dạo quanh khu phố bằng xe đạp không?", "q_en": "Should I cycle around the neighborhood today?",
        "synonyms": ["đi dạo bằng xe đạp", "đạp xe đi dạo hôm nay", "cycling around neighborhood"],
        "days": {
            1: ("rất nên đạp xe tốc độ vừa phải vào sáng sớm để đón luồng sinh khí", "yes, take a brisk early-morning ride to catch fresh vigor"),
            2: ("đạp xe nhẹ nhàng lúc xế chiều cùng bạn bè hoặc người thân", "enjoy an easy late-afternoon cycle ride with a companion"),
            3: ("đạp xe ngắm phố phường kết hợp dừng chân thưởng thức ly nước mát", "cycle around vibrant streets and stop for a refreshing drink"),
            4: ("đạp xe theo lộ trình cố định quanh công viên an toàn", "stick to a disciplined, safe cycling loop around the park"),
            5: ("khám phá những con ngõ nhỏ bằng xe đạp để đổi gió", "explore quaint local alleys by bike for a delightful change"),
            6: ("đạp xe thảnh thơi tận hưởng không khí trong lành quanh hồ", "take a gentle lakeside bike ride to breathe fresh air"),
            7: ("đạp xe chậm rãi trong tĩnh lặng, lắng nghe tiếng gió", "cycle slowly in quiet streets, tuning in to natural stillness"),
            8: ("đạp xe cường độ cao rèn luyện sức bền và cơ bắp", "push a challenging pace to build endurance and power"),
            9: ("đạp xe thư thả một vòng ngắn rồi về nghỉ ngơi trọn vẹn", "take a short, peaceful loop to wind down the day gently"),
        }
    },
    "lifestyle_workspace": {
        "cat": "lifestyle", "slug": "workspace",
        "q_vi": "Nên ngồi gần cửa sổ nhiều ánh sáng hay góc kín tập trung?", "q_en": "Should I work near a bright window or in a focused enclosed corner?",
        "synonyms": ["ngồi làm việc ở đâu", "chỗ ngồi gần cửa sổ hay góc kín", "work near window or quiet corner"],
        "days": {
            1: ("chọn bàn làm việc rộng rãi, hướng nhìn thoáng để tự tin chỉ đạo", "pick a spacious, open desk with clear sightlines for initiative"),
            2: ("ngồi gần đồng đội thân thiện để tiện trao đổi và hỗ trợ", "sit near supportive teammates for easy, harmonious collaboration"),
            3: ("chọn vị trí gần cửa sổ nhiều ánh sáng tự nhiên và cây xanh", "choose a bright sunlit window seat with greenery for creativity"),
            4: ("chọn góc làm việc yên tĩnh, ngăn nắp và ít người qua lại", "pick an orderly, private corner with minimal foot traffic"),
            5: ("đổi sang bàn làm việc đứng hoặc quán cà phê mới để đổi không khí", "switch to a standing desk or a vibrant cafe for fresh scenery"),
            6: ("trang trí góc làm việc bằng một chậu cây nhỏ và đèn ấm", "adorn your desk with a small plant and warm lighting for comfort"),
            7: ("chọn góc làm việc biệt lập hoàn toàn, cách xa tiếng ồn", "retreat to a secluded, distraction-free quiet zone for deep work"),
            8: ("chọn vị trí trung tâm chỉ huy hoặc bàn làm việc chuyên nghiệp", "sit at an executive, professional desk with commanding focus"),
            9: ("dọn sạch bàn làm việc chỉ để lại sổ tay và bút viết tối giản", "clear your desk completely, keeping only essential notebook and pen"),
        }
    },
    "lifestyle_declutter": {
        "cat": "lifestyle", "slug": "declutter",
        "q_vi": "Món đồ nào cần dọn dẹp hoặc bỏ đi ngay hôm nay?", "q_en": "What item should I tidy or remove today?",
        "synonyms": ["dọn dẹp món đồ gì", "vứt đồ cũ dọn nhà", "declutter items today", "tidy up living space"],
        "days": {
            1: ("dọn sạch mặt bàn làm việc để tạo không gian cho kế hoạch mới", "clear your primary desktop to make space for bold projects"),
            2: ("sắp xếp lại góc sinh hoạt chung để không gian thêm ấm cúng", "tidy shared living spaces to enhance household harmony"),
            3: ("dọn dẹp tủ quần áo, quyên góp những món đồ không còn mặc", "sort your wardrobe and donate colorful clothes you no longer wear"),
            4: ("rà soát lại ngăn kéo tài liệu, phân loại giấy tờ theo bìa hồ sơ", "audit document drawers and categorize paperwork neatly in folders"),
            5: ("thanh lý các món đồ công nghệ cũ hoặc phụ kiện thừa thãi", "part with unused gadget clutter or excess accessories"),
            6: ("dọn dẹp gian bếp và phòng tắm sáng sủa, thơm tho", "clean and refresh the kitchen and bathroom with caring warmth"),
            7: ("loại bỏ các vật phẩm gây rối mắt trong không gian nghỉ ngơi", "remove visual clutter from your bedroom for tranquil minimalism"),
            8: ("sắp xếp lại tủ sách, tài liệu tài chính và vật dụng giá trị", "organize book collections, financial files, and valued assets"),
            9: ("thanh lọc triệt để những món đồ cũ hỏng không còn giá trị", "perform a thorough purge of broken, stale items to invite new energy"),
        }
    },
    "lifestyle_wallet": {
        "cat": "lifestyle", "slug": "wallet",
        "q_vi": "Hôm nay có nên dọn hóa đơn cũ và xếp tiền trong ví không?", "q_en": "Should I clear old receipts and organize my wallet today?",
        "synonyms": ["dọn ví tiền hóa đơn cũ", "sắp xếp ví tiền hôm nay", "organize wallet clear receipts"],
        "days": {
            1: ("rất nên dọn sạch hóa đơn cũ và xếp tiền phẳng phiu để đón tài lộc", "yes, discard old receipts and arrange bills neatly for fresh prosperity"),
            2: ("sắp xếp lại các thẻ ngân hàng ngay ngắn và giữ ví sạch sẽ", "reorganize bank cards gently and keep the wallet tidy"),
            3: ("bỏ bớt giấy rác thừa và để vào ví một biểu tượng may mắn nhỏ", "clear paper trash and place a small cheerful lucky charm inside"),
            4: ("kiểm kê thu chi chi tiết và sắp xếp tiền theo thứ tự mệnh giá", "audit receipts carefully and organize banknotes by descending denomination"),
            5: ("chuyển bớt thẻ thành viên sang ứng dụng điện thoại cho ví gọn nhẹ", "move physical loyalty cards to digital apps to lighten your wallet"),
            6: ("lau sạch ví da và sắp xếp hình ảnh người thân ngay ngắn", "wipe down the leather wallet and frame family photos tenderly"),
            7: ("tối giản hóa chiếc ví, chỉ giữ lại những thẻ và tiền mặt cần thiết", "simplify your wallet to essential cards and cash only"),
            8: ("dọn sạch ví, chuẩn bị sẵn sàng cho các giao dịch tài chính lớn", "prime your wallet meticulously for significant financial abundance"),
            9: ("vứt bỏ toàn bộ hóa đơn cũ đã quyết toán để khép lại dòng tiền cũ", "purge all settled receipts to close out old financial cycles cleanly"),
        }
    },

    # --- RELATIONSHIP (6 questions) ---
    "relationship_check_in": {
        "cat": "relationship", "slug": "check_in",
        "q_vi": "Ai là người đầu tiên nên được gửi tin nhắn hỏi thăm?", "q_en": "Who should receive the first warm check-in message?",
        "synonyms": ["nhắn tin hỏi thăm ai", "gửi tin nhắn cho ai hôm nay", "who to message check in today"],
        "days": {
            1: ("chủ động gửi tin nhắn cho một đối tác hoặc đồng nghiệp quan trọng", "proactively message a key business partner or collaborator"),
            2: ("nhắn tin hỏi thăm người bạn thân thiết hoặc người yêu thương", "send a caring check-in to an intimate friend or partner"),
            3: ("gửi lời chúc vui vẻ vào nhóm bạn bè hoặc đồng nghiệp thân thiết", "drop a cheerful, funny greeting into your group chat"),
            4: ("gửi email hoặc tin nhắn xác nhận công việc rõ ràng với cấp trên/khách hàng", "send a clear, professional progress confirmation to your client or lead"),
            5: ("nhắn tin cho một người bạn cũ đã lâu không gặp để kết nối lại", "reach out to a long-lost friend to reconnect spontaneously"),
            6: ("gọi điện hỏi thăm sức khỏe bố mẹ hoặc người thân trong gia đình", "call your parents or family elders with heartfelt care"),
            7: ("gửi một lời cảm ơn chân thành, ngắn gọn tới người đã giúp đỡ bạn", "send a quiet, sincere note of gratitude to someone who guided you"),
            8: ("liên hệ đối tác chiến lược để thảo luận cơ hội hợp tác mới", "contact a strategic partner to explore mutually profitable avenues"),
            9: ("gửi lời tha thứ hoặc hòa giải một khúc mắc cũ bằng sự tử tế", "send a kind, forgiving message to close an old misunderstanding"),
        }
    },
    "relationship_listen_or_share": {
        "cat": "relationship", "slug": "listen_or_share",
        "q_vi": "Trong cuộc trò chuyện hôm nay nên lắng nghe hay chia sẻ?", "q_en": "Should I listen or share more in today's conversation?",
        "synonyms": ["lắng nghe hay chia sẻ", "nói nhiều hay nghe nhiều hôm nay", "listen or share in conversations"],
        "days": {
            1: ("tự tin chia sẻ quan điểm và định hướng giải pháp rõ ràng", "confidently share your vision and outline actionable solutions"),
            2: ("dành 80% thời gian để lắng nghe thấu cảm và không phán xét", "devote 80% of your time to empathetic, non-judgmental listening"),
            3: ("chia sẻ những câu chuyện vui vẻ, truyền cảm hứng và niềm lạc quan", "share uplifting stories, humor, and infectious optimism"),
            4: ("lắng nghe cẩn thận các chi tiết và phản hồi súc tích, đúng trọng tâm", "listen attentively to facts and respond concisely with precision"),
            5: ("trao đổi cởi mở, đặt các câu hỏi gợi mở để tìm góc nhìn mới", "engage in open dialogue, asking curious questions for fresh insights"),
            6: ("lắng nghe bằng cả trái tim và dành lời động viên chân thành", "listen with deep heart-centered warmth and offer genuine comfort"),
            7: ("lắng nghe trong tĩnh lặng, suy ngẫm kỹ trước khi mở lời", "listen in quiet contemplation, pausing before speaking"),
            8: ("trình bày thẳng thắn, rõ ràng về mục tiêu và kỳ vọng", "speak with direct, articulate clarity about goals and expectations"),
            9: ("lắng nghe bao dung, mở rộng lòng đón nhận mọi sự khác biệt", "listen with generous compassion, embracing diverse viewpoints peacefully"),
        }
    },
    "relationship_date": {
        "cat": "relationship", "slug": "date",
        "q_vi": "Địa điểm hẹn hò nên là quán ăn lãng mạn hay dạo phố?", "q_en": "Should the date be at a romantic restaurant or a walk outside?",
        "synonyms": ["hẹn hò ở đâu tối nay", "quán ăn lãng mạn hay dạo phố", "date night restaurant or walk outside"],
        "days": {
            1: ("chọn một nhà hàng phong cách mới, bạn là người chủ động đặt bàn", "pick a stylish new venue and take the lead in making reservations"),
            2: ("quán cà phê nhỏ ấm cúng với nến thơm và âm nhạc êm dịu", "a cozy candlelit cafe with soft music for intimate connection"),
            3: ("khu vui chơi giải trí, xem kịch hoặc quán bar cocktail sôi động", "a lively comedy club, cocktail lounge, or dynamic entertainment spot"),
            4: ("nhà hàng quen thuộc có không gian lịch sự, riêng tư và yên tĩnh", "a reputable, quiet restaurant with private, orderly ambiance"),
            5: ("cùng nhau dạo phố đêm, thử các món ăn vặt đường phố mới lạ", "an evening stroll discovering new street foods and hidden gems"),
            6: ("một bữa tối lãng mạn dưới ánh nến với hoa tươi và sự chăm sóc", "a classic romantic candlelit dinner with flowers and gentle care"),
            7: ("cùng đi dạo bên bờ hồ yên tĩnh hoặc ghé tiệm trà thanh tao", "a serene lakeside walk or quiet artisan tea house"),
            8: ("nhà hàng cao cấp trên tầng cao ngắm toàn cảnh thành phố lung linh", "a rooftop fine-dining lounge with panoramic city skyline views"),
            9: ("bữa tối nhẹ nhàng ấm áp rồi cùng nhau tản bộ thảnh thơi", "a gentle, heartwarming dinner followed by an unhurried walk"),
        }
    },
    "relationship_scent": {
        "cat": "relationship", "slug": "scent",
        "q_vi": "Hôm nay nên thắp mùi nến hoặc tinh dầu nào?", "q_en": "What candle or essential-oil scent should I use today?",
        "synonyms": ["thắp nến thơm mùi gì", "mùi tinh dầu hôm nay", "candle or essential oil scent today"],
        "days": {
            1: ("tinh dầu Cam ngọt (Sweet Orange) hoặc Vỏ bưởi tiếp thêm sinh lực", "Sweet Orange or Grapefruit essential oil to boost fresh vitality"),
            2: ("tinh dầu Hoa oải hương (Lavender) hoặc Hoa cúc xoa dịu tâm trí", "calming Lavender or Chamomile to nurture peace and soft harmony"),
            3: ("nến thơm hương Trái cây nhiệt đới hoặc Hoa ngọc lan tây vui tươi", "Tropical Fruit or Ylang Ylang candle for cheerful creative joy"),
            4: ("tinh dầu Gỗ tuyết tùng (Cedarwood) hoặc Bạc hà giúp tập trung", "Cedarwood or Peppermint oil for clean, structured concentration"),
            5: ("tinh dầu Sả chanh (Lemongrass) hoặc Bạch đàn tươi mát đổi mới", "Lemongrass or Eucalyptus oil for an invigorating, fresh atmosphere"),
            6: ("nến thơm hương Vani ngọt ngào, Hoa hồng hoặc Quế ấm cúng", "sweet Vanilla, Rose, or warm Cinnamon candle for cozy loving vibes"),
            7: ("tinh dầu Trầm hương (Frankincense) hoặc Đàn hương tĩnh tại", "Frankincense or Sandalwood for deep meditative mindfulness"),
            8: ("nến thơm hương Gỗ sồi, Hổ phách hoặc Da thuộc đẳng cấp", "Amber, Oakmoss, or rich Leatherwood candle for grounded luxury"),
            9: ("tinh dầu Xô thơm trắng (White Sage) hoặc Trà xanh thanh lọc", "White Sage or Green Tea oil to cleanse and renew the atmosphere"),
        }
    },
    "relationship_affirmation": {
        "cat": "relationship", "slug": "affirmation",
        "q_vi": "Câu khẳng định tích cực nào nên đọc hôm nay?", "q_en": "What positive affirmation should I read today?",
        "synonyms": ["câu affirmation hôm nay", "câu khẳng định tích cực", "daily positive affirmation"],
        "days": {
            1: ("'Tôi tự tin bước về phía trước và làm chủ vận mệnh của chính mình.'", "'I step forward with confidence and master my own path.'"),
            2: ("'Tôi lắng nghe với sự thấu cảm và thu hút sự hòa hợp quanh mình.'", "'I listen with empathy and attract peaceful harmony everywhere.'"),
            3: ("'Tôi tự do thể hiện sự sáng tạo và lan tỏa niềm vui đến mọi người.'", "'I express my authentic creativity and radiate joy to others.'"),
            4: ("'Tôi kiên trì xây dựng nền móng vững chắc cho thành công bền lâu.'", "'I build strong foundations with patience, order, and steady focus.'"),
            5: ("'Tôi cởi mở đón nhận thay đổi và linh hoạt thích ứng với mọi cơ hội.'", "'I embrace dynamic change and adapt freely to every opportunity.'"),
            6: ("'Tôi yêu thương, trân trọng bản thân và chăm sóc những người tôi yêu quý.'", "'I love and honor myself while nurturing those dear to my heart.'"),
            7: ("'Tôi tìm thấy sự thông tuệ trong tĩnh lặng và tin tưởng trực giác của mình.'", "'I find wisdom in stillness and trust my inner knowing.'"),
            8: ("'Tôi xứng đáng đón nhận sự thịnh vượng, thành công và quyền lực chính đáng.'", "'I am worthy of abundance, achievement, and authentic leadership.'"),
            9: ("'Tôi buông bỏ những điều cũ kỹ với lòng biết ơn và mở lòng đón nhận điều mới.'", "'I release the old with gratitude and welcome new blessings freely.'"),
        }
    },
    "relationship_good_deed": {
        "cat": "relationship", "slug": "good_deed",
        "q_vi": "Một hành động gieo hạt phước đức nên làm hôm nay là gì?", "q_en": "What small act of kindness should I do today?",
        "synonyms": ["việc thiện hôm nay", "gieo hạt phước đức", "small act of kindness today"],
        "days": {
            1: ("chủ động giúp đỡ một người đang gặp khó khăn mà không chờ họ lên tiếng", "proactively assist someone in need without waiting to be asked"),
            2: ("kiên nhẫn lắng nghe một người đang có tâm sự buồn mà không phán xét", "patiently listen to someone in distress with pure, non-judgmental warmth"),
            3: ("dành một lời khen ngợi chân thành làm bừng sáng ngày của ai đó", "give an authentic, heartfelt compliment to brighten someone's day"),
            4: ("giúp đồng nghiệp dọn dẹp không gian chung hoặc sắp xếp lại đồ đạc", "help a teammate organize shared space or sort out messy files"),
            5: ("ủng hộ một quán ăn nhỏ ven đường hoặc tip thêm cho người giao hàng", "support a local street vendor or offer a generous tip to your courier"),
            6: ("nấu một món ăn ngon hoặc mua quà tặng bất ngờ cho người thân", "cook a nourishing treat or bring a sweet surprise gift for loved ones"),
            7: ("gửi lời cầu chúc bình an trong tâm tới những người đang chịu đau khổ", "send silent, heartfelt wishes of peace and healing to those suffering"),
            8: ("chia sẻ kiến thức kinh nghiệm quý giá hoặc hỗ trợ tài chính đúng chỗ", "mentor someone with practical guidance or donate to a high-impact cause"),
            9: ("tha thứ cho một lỗi lầm cũ và quyên góp đồ đạc cho người cơ nhỡ", "forgive an old grievance and donate unused belongings to charity"),
        }
    },
}

def slugify(value: str) -> str:
    value = value.lower().replace("đ", "d")
    value = re.sub(r"[^a-z0-9]+", "_", value).strip("_")
    return value


def safety_flags(category: str, slug: str) -> tuple[str, bool, str, str]:
    if category == "wellness" and slug in {"supplement", "bedtime", "breathing", "neck_stretch", "foot_soak"}:
        return (
            "medium",
            True,
            "Đây là gợi ý chăm sóc bản thân mang tính tham khảo. Nếu bạn có bệnh nền, đang dùng thuốc hoặc có triệu chứng bất thường, hãy hỏi chuyên gia phù hợp.",
            "This is a general self-care suggestion. If you have a medical condition, take medication, or have unusual symptoms, consult an appropriate professional.",
        )
    if category == "lifestyle" and slug in {"transport", "route"}:
        return (
            "medium",
            True,
            "Ưu tiên luật giao thông, tình trạng đường và sự an toàn thực tế; thần số học không thay thế đánh giá an toàn.",
            "Prioritize traffic rules, road conditions, and real-world safety; numerology does not replace a safety assessment.",
        )
    if category == "work" and slug == "negotiation":
        return (
            "medium",
            True,
            "Đây chỉ là gợi ý phản chiếu; hãy dựa trên dữ liệu, hợp đồng và tư vấn chuyên môn trước quyết định tài chính hoặc pháp lý.",
            "This is only a reflective suggestion; rely on data, contracts, and professional advice before financial or legal decisions.",
        )
    return "low", False, "Hãy dùng gợi ý này như một cách tạo cảm hứng; lựa chọn cuối cùng vẫn nên dựa trên hoàn cảnh thực tế của bạn.", "Use this as inspiration; your final choice should still reflect your real circumstances."


def build_document(q_data: dict[str, Any], day: int) -> str:
    category = q_data["cat"]
    slug = q_data["slug"]
    question_vi = q_data["q_vi"]
    question_en = q_data["q_en"]
    synonyms = q_data.get("synonyms", [])
    
    category_meta = CATEGORY_DATA[category]
    theme = DAY_THEMES[day]
    option_vi, option_en = q_data["days"][day]
    safety_level, disclaimer, caution_vi, caution_en = safety_flags(category, slug)
    doc_id = f"daily-decision-{category}-{slug}-day-{day}"
    title_vi = f"Gợi ý quyết định: {question_vi} — Ngày cá nhân số {day}"
    title_en = f"Decision suggestion: {question_en} — Personal Day {day}"
    
    keywords = [
        question_vi,
        question_en,
        f"ngày cá nhân {day}",
        f"personal day {day}",
        category_meta["name_vi"],
        category_meta["name_en"],
        slug.replace("_", " "),
    ] + synonyms
    
    # Remove duplicates preserving order
    seen_kw = set()
    dedup_keywords = []
    for kw in keywords:
        if kw.lower() not in seen_kw:
            seen_kw.add(kw.lower())
            dedup_keywords.append(kw)

    disclaimer_line = "Có lưu ý an toàn: có." if disclaimer else "Có lưu ý an toàn: không."
    disclaimer_line_en = "Safety note: yes." if disclaimer else "Safety note: no."

    return f'''---
id: "{doc_id}"
category: "daily_decision"
indicator_name: "Quyết định hàng ngày / Daily Decision"
indicator_key: "dailyDecision"
number_value: "{day}"
question_id: "{category}_{slug}"
decision_category: "{category}"
personal_day: "{day}"
safety_level: "{safety_level}"
requires_disclaimer: {str(disclaimer).lower()}
content_version: "{SCHEMA_VERSION}"
keywords: {json.dumps(dedup_keywords, ensure_ascii=False)}
title: "{title_vi}"
---

# {title_vi}

## Câu hỏi / Question

**VI:** {question_vi}

**EN:** {question_en}

## Gợi ý theo năng lượng ngày cá nhân số {day} / Suggestion for Personal Day {day}

Ngày cá nhân số {day} gợi lên năng lượng **{theme['vi']}**. Với nhóm **{category_meta['name_vi']}**, lựa chọn phù hợp để bạn cân nhắc hôm nay là: **{option_vi}**.

Personal Day {day} reflects **{theme['en']}**. For **{category_meta['name_en']}**, consider: **{option_en}**.

## Cách thực hiện / Practical next step

**VI:** {theme['action_vi']}. Hãy kiểm tra thời gian, ngân sách, sức khỏe và sở thích thật của bạn trước khi quyết định. {caution_vi}

**EN:** {theme['action_en']}. Check your actual time, budget, health, and preferences before deciding. {caution_en}

## Vì sao lựa chọn này phù hợp / Why this suggestion fits

**VI:** Đây là một gợi ý phản chiếu dựa trên chủ đề năng lượng của ngày, không phải dự đoán chắc chắn. Mục tiêu là giúp bạn giảm phân vân và chuyển sang một hành động nhỏ, hợp lý.

**EN:** This is a reflective suggestion based on the day's energy theme, not a certainty or prediction. Its purpose is to reduce decision fatigue and help you take one reasonable next step.

## Câu hỏi tương tự / Semantic Q&A

- **Q:** {question_vi}
  - **A:** Ngày cá nhân số {day} hôm nay, hãy cân nhắc {option_vi}. {theme['action_vi'].capitalize()}.
- **Q:** {question_en}
  - **A:** On Personal Day {day}, consider {option_en}. {theme['action_en'].capitalize()}.
- **Q:** Tôi nên chọn gì cho {category_meta['name_vi'].lower()} hôm nay?
  - **A:** Hãy cân nhắc {option_vi}, sau đó kiểm tra điều kiện thực tế trước khi chọn.

## Metadata kiểm duyệt / Editorial metadata

- `question_id`: `{category}_{slug}`
- `personal_day`: `{day}`
- `safety_level`: `{safety_level}`
- `requires_disclaimer`: `{str(disclaimer).lower()}`
- `{disclaimer_line}`
- `{disclaimer_line_en}`
'''


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default=str(KNOWLEDGE_DIR), help="Output knowledge directory")
    parser.add_argument("--manifest", default="daily_decision_manifest.json", help="Manifest filename")
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []

    for qid, q_data in QUESTION_DECISION_MATRIX.items():
        category = q_data["cat"]
        slug = q_data["slug"]
        for day in range(1, 10):
            filename = f"daily_decision_{category}_{slug}_day_{day}.md"
            (output_dir / filename).write_text(
                build_document(q_data, day),
                encoding="utf-8",
            )
            manifest.append(
                {
                    "id": f"daily-decision-{category}-{slug}-day-{day}",
                    "filename": filename,
                    "category": category,
                    "question_id": f"{category}_{slug}",
                    "personal_day": day,
                }
            )

    manifest_path = output_dir / args.manifest
    manifest_path.write_text(json.dumps({
        "schema_version": SCHEMA_VERSION,
        "question_count": len(QUESTION_DECISION_MATRIX),
        "document_count": len(manifest),
        "documents": manifest,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Generated {len(manifest)} Daily Decision Markdown documents in {output_dir}")
    print(f"Generated manifest: {manifest_path}")


if __name__ == "__main__":
    main()
