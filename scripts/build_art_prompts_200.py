# -*- coding: utf-8 -*-
import json
import os

data_dir = os.path.abspath(os.path.join(os.getcwd(), 'data'))
os.makedirs(data_dir, exist_ok=True)

prompts_list = []

# Base style suffix to ensure high artistic coherence across all 200+ images
STYLE_SUFFIX = ", dreamy ethereal surrealism, abstract cosmic atmosphere, deep indigo and mystic obsidian ambient background, soft glowing light, floating stardust bokeh, sacred geometry accents, soft nebula mist, fine art aesthetic, minimalist, evocative, masterpiece, no humans, no text, 8k resolution"

def add_prompt(item_id, category, indicator_name, number_val, title, specific_desc, filename):
    full_prompt = f"Abstract mystical concept of {indicator_name} Number {number_val}: {specific_desc}{STYLE_SUFFIX}"
    prompts_list.append({
        "id": item_id,
        "category": category,
        "indicator_name": indicator_name,
        "number_value": str(number_val),
        "title": title,
        "prompt": full_prompt,
        "filename": filename,
        "relative_path": f"images/numerology/{category}/{filename}"
    })

# 1. LIFE PATH (Đường đời - 13 numbers)
lp_data = [
    ("1", "Đường Đời 1 - Người Tiên Phong", "A single radiant golden pillar of light cutting through a dark cosmic expanse, initiating a new cosmic pathway of leadership and independence"),
    ("2", "Đường Đời 2 - Sứ Giả Hòa Bình", "Two gentle intertwining ribbons of iridescent cyan and pearl light dancing in serene harmony across a tranquil starry lake"),
    ("3", "Đường Đời 3 - Họa Sĩ Sáng Tạo", "A burst of vibrant turquoise, amber, and gold stardust sparks expanding like an joyful supernova of creative expression and communication"),
    ("4", "Đường Đời 4 - Người Kiến Tạo", "A glowing crystalline cubic foundation resting firmly upon sacred geometric grids, exuding stability, endurance, and practical mastery"),
    ("5", "Đường Đời 5 - Nhà Thám Hiểm", "A dynamic spiral vortex of swift cosmic winds and shifting spectrums of light, symbolizing boundless freedom and transformative adventure"),
    ("6", "Đường Đời 6 - Người Chữa Lành", "A warm protective nest of rose gold and amber light cradling a glowing celestial sphere, radiating unconditional love and harmony"),
    ("7", "Đường Đời 7 - Nhà Khai Sáng", "A solitary ethereal lighthouse on a celestial cliff casting a laser-sharp beam of deep violet and silver wisdom into the cosmic unknown"),
    ("8", "Đường Đời 8 - Bậc Thầy Điều Hành", "A grand luminous lemniscate infinity loop woven from molten gold and cosmic energy, embodying sovereign material mastery and executive power"),
    ("9", "Đường Đời 9 - Nhà Nhân Đạo", "An all-encompassing golden celestial sphere opening outward to shower radiant sparks of compassion and universal wisdom across the galaxies"),
    ("10", "Đường Đời 10 - Tự Chủ Toàn Diện", "A brilliant sunburst of pure white-gold light encircled by a halo of infinite potential, radiating supreme confidence and adaptability"),
    ("11", "Đường Đời 11 - Ngọn Hải Đăng Tâm Linh", "Two towering twin pillars of divine translucent light acting as an open celestial portal of high-frequency intuition and spiritual awakening"),
    ("22", "Đường Đời 22/4 - Bậc Thầy Kiến Thiết", "A vast sacred architectural blueprint constructed of glowing golden laser lines shaping a new utopian world in the cosmos"),
    ("33", "Đường Đời 33/6 - Trái Tim Vũ Trụ", "A majestic glowing cosmic lotus of radiant emerald and rose light pulsating with healing frequencies for all living beings")
]
for num, title, desc in lp_data:
    add_prompt(f"lifepath_{num}", "lifepath", "Đường Đời", num, title, desc, f"lifepath_{num}.jpg")

# 2. MISSION (Sứ Mệnh - 12 numbers)
mission_data = [
    ("1", "Sứ Mệnh 1 - Mở Lối Tiên Phong", "A glowing golden compass rose shining with supreme clarity at the center of the northern night sky, leading cosmic travelers forward"),
    ("2", "Sứ Mệnh 2 - Nhịp Cầu Gắn Kết", "A celestial bridge woven from moonbeams and gentle mist connecting two floating starry islands in deep peaceful space"),
    ("3", "Sứ Mệnh 3 - Truyền Cảm Hứng", "An ethereal golden harp made of light strings resonating musical waves of joy, color, and eloquent speech across the universe"),
    ("4", "Sứ Mệnh 4 - Xây Dựng Trật Tự", "A magnificent crystalline pyramid of golden order and timeless symmetry anchoring the cosmic chaos into peaceful structure"),
    ("5", "Sứ Mệnh 5 - Khơi Nguồn Đổi Mới", "A celestial wind of shimmering multicolored aurora borealis sweeping across vast interstellar frontiers with fearless curiosity"),
    ("6", "Sứ Mệnh 6 - Phụng Sự Gia Đình", "A glowing garden of radiant crystal flowers watered by a gentle stream of cosmic maternal light and tender care"),
    ("7", "Sứ Mệnh 7 - Tìm Kiếm Chân Lý", "An ancient ethereal book of light floating among silent nebulas, its pages turning to reveal the sacred laws of the universe"),
    ("8", "Sứ Mệnh 8 - Kiến Tạo Thịnh Vượng", "A cosmic crown of glowing geometric crystals commanding infinite streams of golden abundance to flow toward world prosperity"),
    ("9", "Sứ Mệnh 9 - Cứu Rỗi & Trao Đi", "A pair of gigantic luminous palms offering a sphere of starlight to heal and elevate humanity without expecting return"),
    ("11", "Sứ Mệnh 11 - Soi Sáng Tâm Thức", "A crystalline prism splitting cosmic divine light into rainbow lasers that dissolve darkness and awaken spiritual consciousness"),
    ("22", "Sứ Mệnh 22 - Đại Công Trình Nhân Loại", "A massive orbital wheel of sacred geometry engineering sustainable harmony and shelter for planetary civilizations"),
    ("33", "Sứ Mệnh 33 - Thầy Chữa Lành Vĩ Đại", "A cosmic heart of pure unconditional light expanding to encompass all stars and planetary systems in soothing divine love")
]
for num, title, desc in mission_data:
    add_prompt(f"mission_{num}", "mission", "Sứ Mệnh", num, title, desc, f"mission_{num}.jpg")

# 3. SOUL URGE (Linh Hồn - 11 numbers)
soul_data = [
    ("1", "Linh Hồn 1 - Khát Vọng Độc Lập", "A fierce solitary golden flame burning quietly and purely at the very center of a dark deep space sanctuary"),
    ("2", "Linh Hồn 2 - Khao Khát Đồng Điệu", "A serene bioluminescent pool reflecting two distant twin stars merging into one perfect tranquil reflection"),
    ("3", "Linh Hồn 3 - Khao Khát Niềm Vui", "A dancing spirit of vibrant golden sparkles and glowing colorful bubbles rising joyfully from an ethereal fountain"),
    ("4", "Linh Hồn 4 - Khao Khát Bình An", "A perfectly square chamber of glowing emerald and obsidian stone offering absolute safety, order, and deep grounding"),
    ("5", "Linh Hồn 5 - Khao Khát Tự Do", "A luminous bird of light breaking free from shimmering golden chains, soaring into boundless twilight skies"),
    ("6", "Linh Hồn 6 - Khao Khát Yêu Thương", "A warm hearth of soft rose-gold embers surrounded by glowing gentle halos of nurturing protection"),
    ("7", "Linh Hồn 7 - Khao Khát Tĩnh Lặng", "A solitary floating stone sanctuary surrounded by silent swirling clouds of deep midnight blue meditation"),
    ("8", "Linh Hồn 8 - Khao Khát Uy Quyền", "A deeply seated golden orb radiating unshakeable confidence, self-mastery, and quiet magnetic gravity"),
    ("9", "Linh Hồn 9 - Khao Khát Đại Đồng", "A vast ocean of celestial starlight where every drop merges into universal peace, forgiveness, and selfless love"),
    ("11", "Linh Hồn 11 - Trực Giác Thuần Khiết", "A third eye of pure crystalline violet flame pulsating with transcendent wisdom and psychic clarity"),
    ("22", "Linh Hồn 22 - Hoài Bão Kiến Tạo Vĩ Đại", "A glowing blueprint etched upon a slab of cosmic lapis lazuli, vibrating with the desire to leave an eternal legacy")
]
for num, title, desc in soul_data:
    add_prompt(f"soul_{num}", "soul", "Linh Hồn", num, title, desc, f"soul_{num}.jpg")

# 4. PERSONALITY (Nhân Cách - 11 numbers)
personality_data = [
    ("1", "Nhân Cách 1 - Uy Lực & Đĩnh Đạc", "A sharp, confident silhouette surrounded by a crisp golden aura of dignified authority and decisive poise"),
    ("2", "Nhân Cách 2 - Nhã Nhặn & Thân Thiện", "A gentle veil of soft pastel lavender and pearl mist exuding approachable warmth, grace, and courteous charm"),
    ("3", "Nhân Cách 3 - Hấp Dẫn & Hoạt Ngôn", "A radiant halo of sparkling sunbeams and floating confetti light radiating infectious charm, humor, and elegance"),
    ("4", "Nhân Cách 4 - Đáng Tin Cậy & Chững Chạc", "A tailored geometric armor of sleek sapphire and slate crystal, representing absolute reliability and steadfast integrity"),
    ("5", "Nhân Cách 5 - Thời Thượng & Lôi Cuốn", "An electric aura of turquoise and magenta neon trails, projecting magnetic charm, curiosity, and trendsetting charisma"),
    ("6", "Nhân Cách 6 - Ấm Áp & Bao Dung", "A comforting cloak of glowing amber velvet, radiating welcoming maternal grace, beauty, and tasteful harmony"),
    ("7", "Nhân Cách 7 - Trầm Mặc & Bí Ẩn", "A mysterious shroud of deep indigo shadow edged with shimmering silver starlight, projecting profound depth and intellect"),
    ("8", "Nhân Cách 8 - Sang Trọng & Đẳng Cấp", "A polished obsidian and liquid gold aura of executive luxury, commanding instant respect and effortless status"),
    ("9", "Nhân Cách 9 - Cao Quý & Khoan Dung", "A flowing robe of luminous pearl-white and gold light, radiating dignified benevolence, broad-mindedness, and universal grace"),
    ("11", "Nhân Cách 11 - Huyền Bí & Khác Biệt", "An ethereal corona of iridescent electric violet sparks, giving off an otherworldly aura of inspiring spiritual wisdom"),
    ("22", "Nhân Cách 22 - Đẳng Cấp Bậc Thầy", "A commanding presence surrounded by interlocking platinum and gold rings of master builder energy and immense capability")
]
for num, title, desc in personality_data:
    add_prompt(f"personality_{num}", "personality", "Nhân Cách", num, title, desc, f"personality_{num}.jpg")

# 5. BIRTHDAY (Ngày Sinh - 12 numbers)
birthday_data = [
    ("1", "Ngày Sinh 1 - Hạt Giống Độc Lập", "A golden seed of light sprouting a single radiant spear into the cosmic soil, embodying innate initiative"),
    ("2", "Ngày Sinh 2 - Hạt Giống Ngoại Giao", "Two dew drops hanging together on a thread of moonbeam, reflecting deep intuitive sensitivity"),
    ("3", "Ngày Sinh 3 - Hạt Giống Trí Tuệ", "A blossoming flower of colorful light petals with laughter-like stardust floating around it"),
    ("4", "Ngày Sinh 4 - Hạt Giống Thực Tiễn", "A solid cubic crystal growing methodically layer by layer in steady, enduring perfection"),
    ("5", "Ngày Sinh 5 - Hạt Giống Phiêu Lưu", "A shooting star bursting into multiple shimmering trails exploring different celestial directions"),
    ("6", "Ngày Sinh 6 - Hạt Giống Chăm Sóc", "A glowing cocoon of golden silk protecting budding light lifeforms with infinite tenderness"),
    ("7", "Ngày Sinh 7 - Hạt Giống Chiêm Nghiệm", "A crystal geode split open to reveal an inner galaxy of deep purple amethyst wisdom"),
    ("8", "Ngày Sinh 8 - Hạt Giống Kinh Doanh", "A golden coin-shaped nebula revolving with magnetic force, attracting cosmic matter into organized wealth"),
    ("9", "Ngày Sinh 9 - Hạt Giống Nhân Ái", "A chalice overflowing with liquid stardust flowing out to nourish a barren landscape below"),
    ("10", "Ngày Sinh 10 - Hạt Giống Tự Lực", "A flawless sun disk with golden solar flares radiating independence and swift adaptive capability"),
    ("11", "Ngày Sinh 11 - Hạt Giống Trực Giác", "Twin lightning bolts of gentle lavender light striking a tranquil cosmic pool of illumination"),
    ("22", "Ngày Sinh 22 - Hạt Giống Đại Sứ Mệnh", "A golden master key floating before a portal leading to cities of light and advanced civilization")
]
for num, title, desc in birthday_data:
    add_prompt(f"birthday_{num}", "birthday", "Ngày Sinh", num, title, desc, f"birthday_{num}.jpg")

# 6. MATURITY (Trưởng Thành - 11 numbers)
maturity_data = [
    ("1", "Trưởng Thành 1 - Tự Lập Đỉnh Cao", "An ancient golden oak standing alone atop a sunlit mountain peak, crowned with radiant leaves of wisdom"),
    ("2", "Trưởng Thành 2 - Thấu Cảm Viên Mãn", "Two majestic celestial swans resting in a pond of calm liquid silver under a peaceful starry night"),
    ("3", "Trưởng Thành 3 - Lan Tỏa Niềm Vui", "A twilight sky lit with magnificent golden fireworks of artistic legacy and joyful storytelling"),
    ("4", "Trưởng Thành 4 - Cơ Đồ Bền Vững", "A timeless stone fortress surrounded by fertile golden wheat fields under an amber afternoon sun"),
    ("5", "Trưởng Thành 5 - Tự Do Trải Nghiệm", "A celestial ship sailing gracefully across an ocean of clouds toward an infinite golden horizon"),
    ("6", "Trưởng Thành 6 - Mái Ấm Trọn Vẹn", "A warm estate of glowing lamps with family trees rooted deep in fertile soil, surrounded by harmony"),
    ("7", "Trưởng Thành 7 - Trí Tuệ Giác Ngộ", "An illuminated sage cave lined with glowing crystals and scrolls of cosmic knowledge overlooking eternity"),
    ("8", "Trưởng Thành 8 - Đế Chế Vững Mạnh", "A grand throne of polished granite and gold overlooking sprawling vibrant cities of trade and industry"),
    ("9", "Trưởng Thành 9 - Di Sản Nhân Văn", "A magnificent golden archway through which thousands of people receive light, hope, and blessings"),
    ("11", "Trưởng Thành 11 - Người Dẫn Đường", "A towering pillar of celestial aurora acting as a beacon across dimensions for seekers of light"),
    ("22", "Trưởng Thành 22 - Công Trình Để Đời", "A monumental golden city of light standing proud across the landscape, built by a master visionary")
]
for num, title, desc in maturity_data:
    add_prompt(f"maturity_{num}", "maturity", "Trưởng Thành", num, title, desc, f"maturity_{num}.jpg")

# 7. BALANCE (Cân Bằng - 9 numbers)
balance_data = [
    ("1", "Cân Bằng 1 - Tự Chủ & Tĩnh Tại", "A single vertical golden plumb line hanging perfectly still amid swirling cosmic winds"),
    ("2", "Cân Bằng 2 - Lắng Nghe & Hòa Ái", "A pair of perfectly balanced silver scales holding glowing pearls in serene equilibrium"),
    ("3", "Cân Bằng 3 - Lạc Quan & Hài Hước", "A playful prism turning turbulent grey clouds into soft radiant rainbow light"),
    ("4", "Cân Bằng 4 - Kỷ Luật & Trật Tự", "A square foundation stone absorbing shocks and maintaining level balance under any pressure"),
    ("5", "Cân Bằng 5 - Thích Nghi Linh Hoạt", "A smooth water drop shifting form effortlessly while maintaining its pure crystalline essence"),
    ("6", "Cân Bằng 6 - Tình Yêu & Trách Nhiệm", "A glowing golden circle enclosing a warm flame, keeping the warmth balanced without burning"),
    ("7", "Cân Bằng 7 - Tĩnh Lặng & Chiêm Nghiệm", "A flat mirror-like lake surface reflecting the night sky with zero ripples"),
    ("8", "Cân Bằng 8 - Bản Lĩnh & Công Bằng", "A double infinity vortex balancing spiritual purpose and material power in steady rotation"),
    ("9", "Cân Bằng 9 - Buông Xả & Khoan Dung", "A gentle breath of wind carrying away fallen golden leaves to leave space for fresh light")
]
for num, title, desc in balance_data:
    add_prompt(f"balance_{num}", "balance", "Cân Bằng", num, title, desc, f"balance_{num}.jpg")

# 8. RATIONAL THOUGHT (Tư Duy Lý Trí - 11 numbers)
rational_data = [
    ("1", "Tư Duy 1 - Trực Diện & Dứt Khoát", "A single direct laser beam cutting through complex geometric matrices with swift precision"),
    ("2", "Tư Duy 2 - Trực Giác & Đa Chiều", "A gentle neural network woven with soft silver threads, sensing nuances before calculating"),
    ("3", "Tư Duy 3 - Sáng Tạo & Linh Hoạt", "A kaleidoscopic fractal blooming into inventive conceptual designs with vivid sparks of insight"),
    ("4", "Tư Duy 4 - Logic & Thực Tế", "A clean architectural blueprint with perfectly measured grids, right angles, and structural clarity"),
    ("5", "Tư Duy 5 - Đột Phá & Thích Ứng", "A dynamic branching network of electric cyan lines finding novel pathways through complex mazes"),
    ("6", "Tư Duy 6 - Nhân Văn & Thấu Đáo", "A harmonious geometric mandala prioritizing human well-being and aesthetic symmetry"),
    ("7", "Tư Duy 7 - Phân Tích Chuyên Sâu", "A magnifying lens of pure diamond focusing light to analyze the molecular core of truth"),
    ("8", "Tư Duy 8 - Chiến Lược & Thực Dụng", "A grand chess board of polished obsidian and gold with pieces moving according to master strategies"),
    ("9", "Tư Duy 9 - Tầm Nhìn Vĩ Mô", "A panoramic view of an entire galaxy from above, understanding the holistic interconnected ecosystem"),
    ("11", "Tư Duy 11 - Trực Giác Xuất Thần", "A lightning strike of instantaneous revelation bypassing normal logic into direct spiritual truth"),
    ("22", "Tư Duy 22 - Tư Duy Bậc Thầy", "A multi-dimensional geometric matrix combining micro-level engineering with macro-level vision")
]
for num, title, desc in rational_data:
    add_prompt(f"rational_{num}", "rational", "Tư Duy Lý Trí", num, title, desc, f"rational_{num}.jpg")

# 9. SUBCONSCIOUS POWER (Sức Mạnh Tiềm Thức - 7 levels)
subconscious_data = [
    ("3", "Tiềm Thức 3 - Cấp Độ Sơ Khai", "A gentle subterranean spring of glowing water beginning to bubble up into conscious awareness"),
    ("4", "Tiềm Thức 4 - Cấp Độ Ổn Định", "A solid bedrock beneath an ocean floor anchoring instincts against emotional tides"),
    ("5", "Tiềm Thức 5 - Cấp Độ Linh Hoạt", "A fluid tide of silver currents navigating deep underwater caverns with ease"),
    ("6", "Tiềm Thức 6 - Cấp Độ Trực Giác", "A radiant bioluminescent pearl pulsing in the dark ocean trenches, guiding decisions"),
    ("7", "Tiềm Thức 7 - Cấp Độ Thức Tỉnh", "A deep underground crystal cave reflecting moonlight through water with startling clarity"),
    ("8", "Tiềm Thức 8 - Cấp Độ Làm Chủ", "A magnetic core at the center of the world generating a vast protective gravitational field"),
    ("9", "Tiềm Thức 9 - Cấp Độ Hoàn Hảo", "The boundless cosmic ocean fully united with the waking mind in complete fearless enlightenment")
]
for num, title, desc in subconscious_data:
    add_prompt(f"subconscious_{num}", "subconscious", "Sức Mạnh Tiềm Thức", num, title, desc, f"subconscious_{num}.jpg")

# 10. HIDDEN PASSION (Đam Mê Ẩn Giấu - 9 numbers)
passion_data = [
    ("1", "Đam Mê 1 - Khát Vọng Dẫn Đầu", "A fiery spear of golden plasma piercing forward through dark nebula clouds with unstoppable drive"),
    ("2", "Đam Mê 2 - Khát Vọng Kết Nối", "Two harmonizing soundwaves creating a mesmerizing luminous resonance pattern across cosmic water"),
    ("3", "Đam Mê 3 - Khát Vọng Tỏa Sáng", "A radiant firework of rainbow stardust bursting at center stage of an ethereal cosmic theater"),
    ("4", "Đam Mê 4 - Khát Vọng Hoàn Thiện", "A master craftsman shaping a glowing cubic diamond with meticulous devotion and precision"),
    ("5", "Đam Mê 5 - Khát Vọng Khám Phá", "A wild comet soaring freely across uncharted constellations, leaving a vibrant turquoise trail"),
    ("6", "Đam Mê 6 - Khát Vọng Săn Sóc", "An eternal flame of rose gold warming a circle of crystal sculptures in an enchanted sanctuary"),
    ("7", "Đam Mê 7 - Khát Vọng Thông Tuệ", "A deep well of luminous water holding ancient reflections of celestial mysteries and sacred codes"),
    ("8", "Đam Mê 8 - Khát Vọng Quyền Lực", "A roaring furnace forging golden scepters and sovereign armor of supreme economic influence"),
    ("9", "Đam Mê 9 - Khát Vọng Phụng Sự", "A radiant supernova showering its entire life-force outward to give birth to thousands of new stars")
]
for num, title, desc in passion_data:
    add_prompt(f"passion_{num}", "passion", "Đam Mê Ẩn Giấu", num, title, desc, f"passion_{num}.jpg")

# 11. ATTITUDE (Thái Độ Tiếp Cận - 9 numbers)
attitude_data = [
    ("1", "Thái Độ 1 - Quyết Liệt Tiên Phong", "A sudden flash of golden dawn light piercing through morning mist with bold confidence"),
    ("2", "Thái Độ 2 - Nhẹ Nhàng Lắng Nghe", "A tranquil ripple on clear mountain water receiving a single blossom petal with gentle grace"),
    ("3", "Thái Độ 3 - Tươi Vui Hoạt Bát", "A bright sunbeam sparkling on morning dew, creating instantaneous rainbow refractions"),
    ("4", "Thái Độ 4 - Thận Trọng Vững Vàng", "A solid granite cornerstone greeting incoming waves with calm, unyielding composure"),
    ("5", "Thái Độ 5 - Hào Hứng Thích Nghi", "A playful gust of fresh spring wind dancing effortlessly through shifting forest paths"),
    ("6", "Thái Độ 6 - Chu Đáo Ấm Áp", "A warm lantern glowing in an open doorway, welcoming weary travelers with comforting light"),
    ("7", "Thái Độ 7 - Quan Sát Sâu Sắc", "A calm analytical eye composed of starlight looking quietly from behind soft twilight clouds"),
    ("8", "Thái Độ 8 - Tự Tin Thực Dụng", "A sleek polished platinum shield deflecting doubts with decisive strength and executive presence"),
    ("9", "Thái Độ 9 - Bao Dung Rộng Mở", "An open panoramic sky greeting every cloud with calm acceptance and noble benevolence")
]
for num, title, desc in attitude_data:
    add_prompt(f"attitude_{num}", "attitude", "Thái Độ Tiếp Cận", num, title, desc, f"attitude_{num}.jpg")

# 12. KARMIC DEBT (4 Con Số Nợ Nghiệp)
debt_data = [
    ("13_4", "Nợ Nghiệp 13/4 - Nỗ Lực Vượt Bậc", "A fractured stone block being meticulously repaired with golden Kintsugi seams, turning hardship into indestructible diamond strength"),
    ("14_5", "Nợ Nghiệp 14/5 - Kỷ Luật Trong Tự Do", "A soaring falcon of light wearing a golden ribbon of self-discipline, mastering chaotic winds without losing control"),
    ("16_7", "Nợ Nghiệp 16/7 - Tái Sinh Tâm Hồn", "A crumbling tower of false ego falling into a river of starlight, from which a radiant spiritual diamond rises pure and humble"),
    ("19_1", "Nợ Nghiệp 19/1 - Khiêm Nhường Lãnh Đạo", "A fiery sun of pride learning to bow down to water the earth below, transforming arrogance into generous, humble leadership")
]
for num, title, desc in debt_data:
    add_prompt(f"karmic_{num}", "karmic", "Nợ Nghiệp", num, title, desc, f"karmic_{num}.jpg")

# 13. KARMIC LESSONS / SỐ THIẾU (9 numbers)
lesson_data = [
    ("1", "Số Thiếu 1 - Học Tính Tự Lập", "A small fledgling light stepping out of a golden nest onto its own independent path of courage"),
    ("2", "Số Thiếu 2 - Học Cách Lắng Nghe", "An open ear-shaped shell of mother-of-pearl catching the subtle whisper of ocean currents"),
    ("3", "Số Thiếu 3 - Học Cách Biểu Đạt", "A muted bell of crystal suddenly vibrating and ringing with clear harmonious joyful music"),
    ("4", "Số Thiếu 4 - Học Tính Kỷ Luật", "An hourglass with glowing golden sand flowing smoothly and steadily, establishing sacred order"),
    ("5", "Số Thiếu 5 - Học Dám Đổi Mới", "A closed cage door unlocking as a bird of light spreads wings to embrace unfamiliar skies"),
    ("6", "Số Thiếu 6 - Học Trách Nhiệm Gia Đình", "A hollow hearth rekindling with a soft, steady warm flame of unconditional devotion"),
    ("7", "Số Thiếu 7 - Học Nuôi Dưỡng Đức Tin", "A single candle burning brightly inside a vast dark temple of philosophical contemplation"),
    ("8", "Số Thiếu 8 - Học Quản Trị Tiền Bạc", "A scattered pile of golden stardust being gathered methodically into a solid sovereign ingot"),
    ("9", "Số Thiếu 9 - Học Lòng Bao Dung", "A closed fist slowly opening into an open hand releasing a glowing white dove of forgiveness")
]
for num, title, desc in lesson_data:
    add_prompt(f"missing_{num}", "missing", "Số Thiếu", num, title, desc, f"missing_{num}.jpg")

# 14. BRIDGES (Cầu Nối - 9 values: 0 to 8)
bridge_data = [
    ("0", "Cầu Nối 0 - Đồng Thuận Tuyệt Đối", "Two identical rivers of light merging seamlessly into one harmonious boundless ocean with zero friction"),
    ("1", "Cầu Nối 1 - Cầu Nối Độc Lập", "A single sturdy golden plank spanning a narrow canyon, requiring decisive personal initiative to cross"),
    ("2", "Cầu Nối 2 - Cầu Nối Ngoại Giao", "A delicate bridge of woven silk and moonbeams, crossed through gentle cooperation and active listening"),
    ("3", "Cầu Nối 3 - Cầu Nối Ngôn Từ", "A vibrant bridge of singing rainbow light connecting thought to reality through joyful expression"),
    ("4", "Cầu Nối 4 - Cầu Nối Kỷ Luật", "A stone aqueduct with arches of enduring discipline carrying life-giving water across dry valleys"),
    ("5", "Cầu Nối 5 - Cầu Nối Linh Hoạt", "A dynamic suspension bridge swaying gracefully in the wind without breaking, embracing change"),
    ("6", "Cầu Nối 6 - Cầu Nối Yêu Thương", "A bridge covered in fragrant climbing roses, harmonizing personal ambition with devotion to loved ones"),
    ("7", "Cầu Nối 7 - Cầu Nối Trí Tuệ", "A bridge through mist with stepping stones illuminated by lanterns of inner philosophical contemplation"),
    ("8", "Cầu Nối 8 - Cầu Nối Tài Chính", "A grand bridge of polished granite and gold linking visionary ideals to tangible economic prosperity")
]
for num, title, desc in bridge_data:
    add_prompt(f"bridge_{num}", "bridge", "Cầu Nối", num, title, desc, f"bridge_{num}.jpg")

# 15. PERSONAL YEAR (Năm Cá Nhân - 9 numbers)
year_data = [
    ("1", "Năm Cá Nhân 1 - Gieo Hạt Mới", "A fertile cosmic soil receiving a brilliant golden seed as dawn breaks over the horizon"),
    ("2", "Năm Cá Nhân 2 - Nuôi Dưỡng & Kiên Nhẫn", "A tiny green sprout being nourished by gentle morning dew and soft supportive moonlight"),
    ("3", "Năm Cá Nhân 3 - Bung Nở & Sáng Tạo", "A tree bursting into magnificent colorful blossoms with butterflies of starlight dancing around"),
    ("4", "Năm Cá Nhân 4 - Củng Cố Rễ Sâu", "Deep roots of gold wrapping securely around solid bedrock, establishing an unshakeable base"),
    ("5", "Năm Cá Nhân 5 - Đột Phá & Chuyển Mình", "Leaves transforming into vibrant amber wings soaring through swift winds of exciting transformation"),
    ("6", "Năm Cá Nhân 6 - Trĩu Quả & Yêu Thương", "Golden fruits glowing warmly among lush branches, providing nourishment for home and family"),
    ("7", "Năm Cá Nhân 7 - Tĩnh Lặng Chiêm Nghiệm", "The tree standing peaceful under a winter night sky dusted with snow, gathering deep wisdom inside"),
    ("8", "Năm Cá Nhân 8 - Thu Hoạch Bội Thu", "A grand harvest of glowing golden grain and cornucopias overflowing with material reward"),
    ("9", "Năm Cá Nhân 9 - Hoàn Tất & Buông Xả", "Golden leaves gently floating down into a stream, clearing the ground for the next 9-year cycle")
]
for num, title, desc in year_data:
    add_prompt(f"year_{num}", "year", "Năm Cá Nhân", num, title, desc, f"year_{num}.jpg")

# 16. PERSONAL MONTH (Tháng Cá Nhân - 9 numbers)
month_data = [
    ("1", "Tháng Cá Nhân 1 - Động Lực Khởi Đầu", "A monthly cosmic calendar page turning into a bright flash of renewed motivation and clear direction"),
    ("2", "Tháng Cá Nhân 2 - Kết Nối Dịu Êm", "A serene crescent moon guiding quiet diplomatic agreements and relationship healing"),
    ("3", "Tháng Cá Nhân 3 - Cảm Hứng Tuôn Trào", "A swirling dance of colorful paint splashes forming harmonious artistic patterns in the air"),
    ("4", "Tháng Cá Nhân 4 - Hoàn Thiện Chi Tiết", "A luminous carpenter square aligning cosmic tiles into sturdy, organized workspaces"),
    ("5", "Tháng Cá Nhân 5 - Gió Mới Phiêu Du", "A sudden refreshing breeze opening panoramic windows toward exciting social gatherings"),
    ("6", "Tháng Cá Nhân 6 - Trái Tim Tổ Ấm", "A glowing candlelight illuminating a peaceful dining table filled with warmth and family love"),
    ("7", "Tháng Cá Nhân 7 - Tĩnh Dưỡng Tinh Thần", "A serene Zen meditation stone garden under misty morning light for mental recharge"),
    ("8", "Tháng Cá Nhân 8 - Đẩy Mạnh Thương Vụ", "A golden handshake of light sealing successful commercial contracts and financial growth"),
    ("9", "Tháng Cá Nhân 9 - Dọn Dẹp Đón Mới", "A radiant broom of starlight sweeping away mental clutter to welcome fresh cycles")
]
for num, title, desc in month_data:
    add_prompt(f"month_{num}", "month", "Tháng Cá Nhân", num, title, desc, f"month_{num}.jpg")

# 17. PERSONAL DAY (Ngày Cá Nhân - 9 numbers)
day_data = [
    ("1", "Ngày Cá Nhân 1 - Hành Động Tự Tin", "A single radiant morning sunbeam illuminating an open journal with bold decisive plans"),
    ("2", "Ngày Cá Nhân 2 - Lắng Nghe Thấu Đáo", "Two gentle water ripples meeting softly and expanding together in peace"),
    ("3", "Ngày Cá Nhân 3 - Giao Lưu Vui Vẻ", "A burst of golden confetti and laughter sparks brightening up a daily workspace"),
    ("4", "Ngày Cá Nhân 4 - Tập Trung Hoàn Tất", "A clean desk with glowing checklist items ticking off smoothly in methodical order"),
    ("5", "Ngày Cá Nhân 5 - Bất Ngờ Thú Vị", "A surprise gift box of shimmering cyan starlight opening to reveal spontaneous joy"),
    ("6", "Ngày Cá Nhân 6 - Sưởi Ấm Yêu Thương", "A warm cup of golden tea giving off fragrant steam that forms a gentle heart shape"),
    ("7", "Ngày Cá Nhân 7 - Tĩnh Lặng Nạp Năng Lượng", "A quiet reading nook illuminated by a soft lantern with a book of deep wisdom"),
    ("8", "Ngày Cá Nhân 8 - Quyết Đoán Tài Chính", "A crisp golden seal stamping an important achievement on a parchment of success"),
    ("9", "Ngày Cá Nhân 9 - Buông Bỏ Bình An", "A floating lantern drifting peacefully into the night sky, carrying away all worries")
]
for num, title, desc in day_data:
    add_prompt(f"day_{num}", "day", "Ngày Cá Nhân", num, title, desc, f"day_{num}.jpg")

# 18. PINNACLES (Đỉnh Cao Kim Tự Tháp - 11 numbers)
pinnacle_data = [
    ("1", "Đỉnh Cao 1 - Đỉnh Khởi Nghiệp", "The peak of a golden pyramid touching a solitary morning star of bold self-made leadership"),
    ("2", "Đỉnh Cao 2 - Đỉnh Hợp Tác", "The peak of an alabaster pyramid glowing with twin intertwined halos of diplomatic success"),
    ("3", "Đỉnh Cao 3 - Đỉnh Tỏa Sáng", "The peak of a turquoise pyramid projecting kaleidoscopic beams of fame, art, and joy"),
    ("4", "Đỉnh Cao 4 - Đỉnh Cơ Đồ", "The peak of an emerald-granite pyramid crowned with an everlasting fortress of tangible wealth"),
    ("5", "Đỉnh Cao 5 - Đỉnh Tự Do", "The peak of a shimmering sapphire pyramid releasing a flock of golden eagles into boundless skies"),
    ("6", "Đỉnh Cao 6 - Đỉnh Hạnh Phúc", "The peak of a rose-gold pyramid radiating a warm dome of family harmony and humanitarian beauty"),
    ("7", "Đỉnh Cao 7 - Đỉnh Khai Sáng", "The peak of an amethyst pyramid piercing the cloud layer into a realm of pure cosmic enlightenment"),
    ("8", "Đỉnh Cao 8 - Đỉnh Thịnh Vượng", "The peak of a solid gold pyramid projecting a massive pillar of light commanding sovereign financial mastery"),
    ("9", "Đỉnh Cao 9 - Đỉnh Nhân Văn", "The peak of a diamond pyramid showering a rainfall of blessings and peace across entire continents"),
    ("10", "Đỉnh Cao 10 - Đỉnh Tự Chủ", "The peak of a crystalline pyramid glowing with the supreme wholeness of a golden sun disk"),
    ("11", "Đỉnh Cao 11 - Đỉnh Thức Tỉnh", "The peak of an ethereal violet pyramid opening a direct stargate of transcendental psychic illumination")
]
for num, title, desc in pinnacle_data:
    add_prompt(f"pinnacle_{num}", "pinnacle", "Đỉnh Cao", num, title, desc, f"pinnacle_{num}.jpg")

# 19. CHALLENGES (Thách Thức - 9 numbers)
challenge_data = [
    ("0", "Thách Thức 0 - Thử Thách Tự Do", "A vast open void with no walls, presenting the existential challenge of choosing one's own moral compass"),
    ("1", "Thách Thức 1 - Vượt Qua Tự Ti", "A warrior of light facing a giant shadow mirror, learning to claim true self-worth without aggression"),
    ("2", "Thách Thức 2 - Làm Chủ Nhạy Cảm", "A sensitive lotus flower floating on stormy waters, learning to stay serene without closing its petals"),
    ("3", "Thách Thức 3 - Kiểm Soát Lời Ăn", "A swirling whirlwind of scattered words being focused through a golden prism into harmonious truth"),
    ("4", "Thách Thức 4 - Thiết Lập Kỷ Luật", "A turbulent mountain path being methodically paved with solid stepping stones of patience"),
    ("5", "Thách Thức 5 - Tiết Chế Dục Vọng", "A wild fiery stallion being gently guided by reins of golden mindfulness and self-restraint"),
    ("6", "Thách Thức 6 - Buông Bỏ Áp Đặt", "A tight grasping hand relaxing to allow a bird of light to perch freely out of true love"),
    ("7", "Thách Thức 7 - Vượt Qua Hoài Nghi", "A seeker stepping across a misty chasm with quiet faith, as invisible stones appear beneath each step"),
    ("8", "Thách Thức 8 - Làm Chủ Vật Chất", "A mountain of raw gold ore being purified in divine fire to remove greed and reveal pure justice")
]
for num, title, desc in challenge_data:
    add_prompt(f"challenge_{num}", "challenge", "Thách Thức", num, title, desc, f"challenge_{num}.jpg")

# 20. PYTHAGORAS ARROWS (8 Cặp Mũi Tên - 16 images)
arrow_data = [
    ("1_4_7_strength", "arrow", "Mũi Tên Sức Mạnh 1-4-7 (Thực Tế)", "Three solid aligned golden cubes anchoring firmly into the earth with physical mastery and technical skill", "arrow_1_4_7_str.jpg"),
    ("1_4_7_empty", "arrow", "Mũi Tên Trống 1-4-7 (Hỗn Độn)", "A misty void where physical foundations are missing, showing floating disorderly particles seeking structure", "arrow_1_4_7_emp.jpg"),
    ("2_5_8_strength", "arrow", "Mũi Tên Sức Mạnh 2-5-8 (Cảm Xúc)", "Three aligned glowing spheres of rose, pearl, and violet pulsating in perfect emotional tranquility", "arrow_2_5_8_str.jpg"),
    ("2_5_8_empty", "arrow", "Mũi Tên Trống 2-5-8 (Nhạy Cảm)", "A fragile glass heart exposed to cold cosmic winds, seeking a protective aura of emotional boundaries", "arrow_2_5_8_emp.jpg"),
    ("3_6_9_strength", "arrow", "Mũi Tên Sức Mạnh 3-6-9 (Sáng Trí)", "Three brilliant stars aligned in the upper heavens radiating supreme intellect, memory, and creative genius", "arrow_3_6_9_str.jpg"),
    ("3_6_9_empty", "arrow", "Mũi Tên Trống 3-6-9 (Trí Nhớ Ngắn)", "A fading cloud of starlight where thoughts slip away, needing a golden book of grounding memory", "arrow_3_6_9_emp.jpg"),
    ("1_2_3_strength", "arrow", "Mũi Tên Sức Mạnh 1-2-3 (Kế Hoạch)", "A perfectly drafted golden architectural plan unfolding step-by-step with impeccable foresight", "arrow_1_2_3_str.jpg"),
    ("1_2_3_empty", "arrow", "Mũi Tên Trống 1-2-3 (Tùy Hứng)", "A scattered deck of light cards blowing in random winds, seeking a deliberate compass of planning", "arrow_1_2_3_emp.jpg"),
    ("4_5_6_strength", "arrow", "Mũi Tên Sức Mạnh 4-5-6 (Ý Chí)", "An unbroken beam of laser steel piercing through dark storm clouds with unconquerable determination", "arrow_4_5_6_str.jpg"),
    ("4_5_6_empty", "arrow", "Mũi Tên Trống 4-5-6 (Bất An)", "A flickering candle flame struggling in heavy winds, needing a protective lantern of resilient willpower", "arrow_4_5_6_emp.jpg"),
    ("7_8_9_strength", "arrow", "Mũi Tên Sức Mạnh 7-8-9 (Hoạt Động)", "A dynamic trio of shooting stars racing across the cosmos with vibrant physical energy and high productivity", "arrow_7_8_9_str.jpg"),
    ("7_8_9_empty", "arrow", "Mũi Tên Trống 7-8-9 (Thụ Động)", "A stagnant pool of still water reflecting motionless clouds, waiting for an active wave of motivation", "arrow_7_8_9_emp.jpg"),
    ("1_5_9_strength", "arrow", "Mũi Tên Sức Mạnh 1-5-9 (Quyết Tâm)", "A diagonal spear of solid golden lightning cutting diagonally across space, unstoppable in purpose", "arrow_1_5_9_str.jpg"),
    ("1_5_9_empty", "arrow", "Mũi Tên Trống 1-5-9 (Trì Hoãn)", "An hourglass with blocked sands of hesitation, needing the spark of action to resume its flow", "arrow_1_5_9_emp.jpg"),
    ("3_5_7_strength", "arrow", "Mũi Tên Sức Mạnh 3-5-7 (Tâm Linh)", "A diagonal pathway of luminous purple lotus blossoms ascending into transcendent cosmic realms", "arrow_3_5_7_str.jpg"),
    ("3_5_7_empty", "arrow", "Mũi Tên Trống 3-5-7 (Hoài Nghi)", "A dark maze of mirrors reflecting skeptical shadows, awaiting the open sunlight of intuitive faith", "arrow_3_5_7_emp.jpg")
]
for item_id, cat, title, desc, fn in arrow_data:
    add_prompt(item_id, cat, "Mũi Tên Ma Trận", item_id, title, desc, fn)

# 21. MATRIX & ISOLATED NUMBERS (5 images)
matrix_data = [
    ("name_chart_matrix", "matrix", "Biểu Đồ Tên", "Matrix", "Ma Trận Tần Suất Biểu Đồ Tên", "A 3x3 glowing matrix of sacred letters resonating with harmonic soundwaves and vibrant frequencies", "name_chart_matrix.jpg"),
    ("isolated_1", "isolated", "Số Cô Lập", "1", "Số 1 Bị Cô Lập - Bế Tắc Nội Tâm", "A single golden island of light surrounded by a deep chasm, reaching for bridge threads of connection", "isolated_1.jpg"),
    ("isolated_3", "isolated", "Số Cô Lập", "3", "Số 3 Bị Cô Lập - Bất An Trí Não", "A storm of floating thoughts swirling inside a detached bubble of starlight seeking grounded roots", "isolated_3.jpg"),
    ("isolated_7", "isolated", "Số Cô Lập", "7", "Số 7 Bị Cô Lập - Bài Học Tổn Thất", "A solitary crystal weathering fierce waves in isolation, waiting for the healing light of spiritual wisdom", "isolated_7.jpg"),
    ("isolated_9", "isolated", "Số Cô Lập", "9", "Số 9 Bị Cô Lập - Hoài Bão Bất Lực", "A grand golden cloud of ideals floating high above an empty landscape, needing practical ladders down to earth", "isolated_9.jpg")
]
for item_id, cat, ind_name, num_val, title, desc, fn in matrix_data:
    add_prompt(item_id, cat, ind_name, num_val, title, desc, fn)

output_path = os.path.join(data_dir, "art_prompts_200.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(prompts_list, f, ensure_ascii=False, indent=2)

print(f"DONE: Successfully built {len(prompts_list)} detailed art prompts into: {output_path}")
