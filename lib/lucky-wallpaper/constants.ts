// -*- coding: utf-8 -*-
export interface NumberAesthetics {
  number: number;
  name_vi: string;
  name_en: string;
  primaryColors_vi: string[];
  primaryColors_en: string[];
  sacredSymbol_vi: string;
  sacredSymbol_en: string;
  keywords_en: string[];
}

export const NUMEROLOGY_AESTHETICS_MAP: Record<number, NumberAesthetics> = {
  1: {
    number: 1,
    name_vi: "Tiên phong & Khởi nguyên",
    name_en: "Pioneering & Origin",
    primaryColors_vi: ["Vàng hoàng kim", "Đỏ ruby", "Cam hoàng hôn"],
    primaryColors_en: ["Radiant gold", "Ruby red", "Sunset amber"],
    sacredSymbol_vi: "Tia chớp khởi nguyên, Mặt trời mọc rạng rỡ, Đại bàng dũng mãnh",
    sacredSymbol_en: "Solar burst, solitary luminous beacon, primal point of light, majestic eagle",
    keywords_en: ["solar flares", "radiant golden rays", "assertive geometric monad", "primal spark"],
  },
  2: {
    number: 2,
    name_vi: "Hòa hợp & Trực giác",
    name_en: "Harmony & Intuition",
    primaryColors_vi: ["Bạc ánh trăng", "Trắng ngọc trai", "Xanh lam pastel"],
    primaryColors_en: ["Moonlight silver", "Pearl white", "Soft pastel cyan"],
    sacredSymbol_vi: "Vòng tròn âm dương, Mặt trăng khuyết, Hồ nước phẳng lặng, Thiên nga",
    sacredSymbol_en: "Vesica piscis, glowing crescent moon, tranquil reflective lake, ethereal swans",
    keywords_en: ["soft lunar glow", "twin harmonious light streams", "reflective water surface", "peaceful serenity"],
  },
  3: {
    number: 3,
    name_vi: "Sáng tạo & Niềm vui",
    name_en: "Creativity & Joy",
    primaryColors_vi: ["Vàng chanh", "Xanh ngọc lục bảo", "Hồng san hô"],
    primaryColors_en: ["Lemon yellow", "Emerald green", "Coral pink"],
    sacredSymbol_vi: "Tam giác hoàng kim, Pháo hoa tinh vân, Cung đàn ánh sáng",
    sacredSymbol_en: "Golden triangle, blossoming celestial flowers, fireworks of starlight, musical prism",
    keywords_en: ["prismatic light refraction", "blossoming glowing flora", "vibrant dynamic sparks", "cheerful celestial dance"],
  },
  4: {
    number: 4,
    name_vi: "Vững chãi & Trật tự",
    name_en: "Structure & Foundation",
    primaryColors_vi: ["Xanh Navy đậm", "Nâu đất trầm", "Xanh lục bảo rừng già"],
    primaryColors_en: ["Deep navy blue", "Earthy bronze brown", "Forest green"],
    sacredSymbol_vi: "Khối lập phương Tesseract, Tháp đá pha lê, Kim tự tháp vững chãi",
    sacredSymbol_en: "Tesseract cube, crystal monolith, solid ancient pyramid, deep cosmic roots",
    keywords_en: ["hypercube sacred geometry", "architectural crystalline order", "grounded steady radiance", "ancient monolith"],
  },
  5: {
    number: 5,
    name_vi: "Tự do & Đột phá",
    name_en: "Freedom & Adventure",
    primaryColors_vi: ["Xanh ngọc Turquoise", "Bạc ánh kim", "Cực quang đa sắc"],
    primaryColors_en: ["Turquoise cyan", "Liquid silver", "Multicolor aurora"],
    sacredSymbol_vi: "Ngôi sao 5 cánh, Cánh chim sải rộng, Luồng gió xoáy thiên hà",
    sacredSymbol_en: "Luminous pentagram, soaring cosmic wings, swirling astral winds, boundless horizon",
    keywords_en: ["aurora borealis ribbons", "dynamic swirling vortex", "cosmic wings of light", "open boundless sky"],
  },
  6: {
    number: 6,
    name_vi: "Yêu thương & Chữa lành",
    name_en: "Love & Nurturing",
    primaryColors_vi: ["Hồng phấn Rose Gold", "Xanh ngọc bích", "Vàng mơ dịu"],
    primaryColors_en: ["Rose gold", "Gentle jade green", "Warm apricot glow"],
    sacredSymbol_vi: "Ngôi sao 6 cánh Merkaba, Vườn địa đàng ánh sáng, Trái tim pha lê",
    sacredSymbol_en: "Merkaba star of light, luminous sacred garden, crystal heart sanctuary",
    keywords_en: ["soft ethereal bloom", "merkaba light matrix", "healing warm glow", "golden pollen particles"],
  },
  7: {
    number: 7,
    name_vi: "Minh triết & Tĩnh tại",
    name_en: "Wisdom & Solitude",
    primaryColors_vi: ["Tím thạch anh", "Lam chàm Indigo", "Bạc huyền bí"],
    primaryColors_en: ["Amethyst purple", "Deep indigo", "Mystic silver"],
    sacredSymbol_vi: "Thất giác tinh 7 cánh, Hoa sen phát sáng, Vũ trụ huyền ảo, Đỉnh núi tuyết",
    sacredSymbol_en: "Heptagram 7-pointed star, glowing sacred lotus, nebula cosmos, solitary mountain peak",
    keywords_en: ["deep cosmic stardust", "bioluminescent sacred lotus", "spiritual third eye geometry", "quiet meditative depth"],
  },
  8: {
    number: 8,
    name_vi: "Thịnh vượng & Quyền lực",
    name_en: "Abundance & Power",
    primaryColors_vi: ["Đen Obsidian", "Đỏ Bordeaux", "Vàng hoàng gia"],
    primaryColors_en: ["Obsidian black", "Bordeaux ruby", "Imperial royal gold"],
    sacredSymbol_vi: "Vòng lặp vô cực Lemniscate, Vương miện ánh sáng, Rồng vàng vũ trụ",
    sacredSymbol_en: "Infinite lemniscate loop, glowing royal crown, ascending golden dragon of light",
    keywords_en: ["golden infinity lemniscate", "opulent liquid gold veins", "regal majestic aura", "deep obsidian contrast"],
  },
  9: {
    number: 9,
    name_vi: "Bao dung & Khép lại trọn vẹn",
    name_en: "Completion & Compassion",
    primaryColors_vi: ["Đỏ thẫm Crimson", "Vàng đồng Bronze", "Trắng tinh khôi"],
    primaryColors_en: ["Deep crimson", "Antique bronze", "Pure pearl white"],
    sacredSymbol_vi: "Cửu giác tinh Enneagram, Cổng vòm thiên đường, Cực quang rực rỡ",
    sacredSymbol_en: "Enneagram sacred geometry, celestial gateway portal, radiant universal light beam",
    keywords_en: ["universal transcendent portal", "radiant golden sunset horizon", "divine completion glow", "soothing aura"],
  },
  11: {
    number: 11,
    name_vi: "Bậc thầy Trực giác & Ánh sáng",
    name_en: "Master Intuition & Illumination",
    primaryColors_vi: ["Bạch kim Platin", "Bạc ánh sáng", "Ánh hào quang thiên thanh"],
    primaryColors_en: ["Platinum silver", "Celestial light", "Iridescent cyan glow"],
    sacredSymbol_vi: "Trụ đôi ánh sáng, Cổng không gian huyền bí, Tia sét tinh vân",
    sacredSymbol_en: "Twin pillars of light, ethereal portal gateway, celestial lightning",
    keywords_en: ["twin luminous light pillars", "high vibrational frequency", "iridescent dimensional gateway", "divine clarity"],
  },
  22: {
    number: 22,
    name_vi: "Bậc thầy Kiến tạo Di sản",
    name_en: "Master Builder & Legacy",
    primaryColors_vi: ["Vàng kim cổ điển", "Xanh lục bảo hoàng gia", "Đen kim cương"],
    primaryColors_en: ["Ancient antique gold", "Imperial emerald", "Diamond obsidian"],
    sacredSymbol_vi: "Khối kiến trúc vũ trụ 4D, Tháp ánh sáng kết nối Trời và Đất",
    sacredSymbol_en: "Cosmic architect temple, 4D sacred tesseract, bridge between heaven and earth",
    keywords_en: ["cosmic architectural grid", "crystalline palace of light", "master builder geometry", "unshakeable majesty"],
  },
  33: {
    number: 33,
    name_vi: "Bậc thầy Chữa lành Đại đồng",
    name_en: "Master Healer & Universal Love",
    primaryColors_vi: ["Hào quang cầu vồng Opal", "Vàng ngọc trai", "Hồng ngọc bích"],
    primaryColors_en: ["Iridescent opal glow", "Pearl gold", "Heart-center rose quartz"],
    sacredSymbol_vi: "Cây sinh mệnh phát sáng, Hoa sen nghìn cánh, Vòng tròn chữa lành vũ trụ",
    sacredSymbol_en: "Luminous Tree of Life, thousand-petal golden lotus, universal healing vortex",
    keywords_en: ["tree of life sacred geometry", "thousand-petal glowing lotus", "universal compassionate light", "celestial blessing"],
  },
};

export interface StylePreset {
  id: string;
  name_vi: string;
  name_en: string;
  description_vi: string;
  prompt_modifiers: string;
  themeColor: string;
}

export const WALLPAPER_STYLES: StylePreset[] = [
  {
    id: "sacred_geometry",
    name_vi: "Hình Học Thiêng & Vũ Trụ",
    name_en: "Sacred Geometry & Cosmos",
    description_vi: "Các khối hình học tỷ lệ vàng, vòng lặp ánh sáng và bụi sao huyền ảo",
    prompt_modifiers: "sacred geometry, golden ratio fractal, celestial nebula background, intricate glowing vector lines, octane render 8k, majestic cosmic atmosphere",
    themeColor: "#8B5CF6",
  },
  {
    id: "luxury_gold_3d",
    name_vi: "Vàng Ròng 3D & Kính Pha Lê",
    name_en: "3D Liquid Gold & Crystal",
    description_vi: "Chất liệu vàng 24K lỏng, khối pha lê trong suốt tán sắc sang trọng",
    prompt_modifiers: "3D luxury glassmorphism, floating liquid gold ribbons, refractive crystal prism, smooth glossy surface, studio softbox lighting, ultra-premium clean aesthetic",
    themeColor: "#F59E0B",
  },
  {
    id: "ethereal_minimalist",
    name_vi: "Tối Giản Tĩnh Tại (Zen)",
    name_en: "Ethereal Minimalist Zen",
    description_vi: "Phong cách tối giản thanh lịch, làn sương mềm mại và ánh sáng dịu nhẹ",
    prompt_modifiers: "ethereal minimalist composition, smooth gradient mist, peaceful zen aesthetic, soft pastel tones, clean breathing space, architectural tranquility, high-end editorial",
    themeColor: "#10B981",
  },
  {
    id: "cyberpunk_neon",
    name_vi: "Neon Công Nghệ Tương Lai",
    name_en: "Cyberpunk Futuristic Neon",
    description_vi: "Ánh sáng neon phát quang, ký tự thần số học hologram hiện đại",
    prompt_modifiers: "futuristic cyberpunk neon glow, dark obsidian matrix background, holographic glowing numerology glyphs, volumetric laser lighting, synthwave retro-futurism",
    themeColor: "#EC4899",
  },
  {
    id: "watercolor_nature",
    name_vi: "Thủy Mặc & Thiên Nhiên",
    name_en: "Watercolor & Zen Nature",
    description_vi: "Nét cọ màu nước mềm mại, hồ sen tĩnh lặng, núi non mờ ảo và ánh trăng",
    prompt_modifiers: "delicate watercolor and ink illustration, glowing ethereal nature, blooming lotus and bamboo silhouettes, soft golden dust, dreamy poetic atmosphere",
    themeColor: "#3B82F6",
  },
  {
    id: "tarot_editorial",
    name_vi: "Nghệ Thuật Tarot Huyền Bí",
    name_en: "Mystical Tarot Editorial",
    description_vi: "Phong cách bài Tarot hoàng gia Art Nouveau với hoa văn mạ vàng tinh xảo",
    prompt_modifiers: "mystical tarot card art style, Art Nouveau golden filigree borders, celestial sun and moon symbolism, vintage esoteric engraving, high fashion luxury illustration",
    themeColor: "#D97706",
  },
];

export interface IntentionOption {
  id: string;
  name_vi: string;
  name_en: string;
  icon: string;
  prompt_keywords: string;
  affirmation_vi: string;
  affirmation_en: string;
}

export const INTENTION_OPTIONS: IntentionOption[] = [
  {
    id: "wealth",
    name_vi: "Tài Lộc & Thịnh Vượng",
    name_en: "Wealth & Abundance",
    icon: "💰",
    prompt_keywords: "golden aura of endless abundance, cascading starlight coins, opulent prosperity vortex, majestic golden illumination",
    affirmation_vi: "Tôi mở rộng tâm trí đón nhận dòng chảy thịnh vượng và cơ hội tài chính dồi dào.",
    affirmation_en: "I open my heart and mind to receive infinite abundance, prosperity, and wealth.",
  },
  {
    id: "love",
    name_vi: "Tình Duyên & Gắn Kết",
    name_en: "Love & Harmony",
    icon: "💖",
    prompt_keywords: "warm glowing rose quartz heart, intertwining golden ribbons of connection, soft pink and emerald aura, unconditional love energy",
    affirmation_vi: "Tôi lan tỏa tình yêu thương chân thành và thu hút những mối quan hệ hòa hợp, ngọt ngào.",
    affirmation_en: "I radiate authentic love and attract deep, harmonious, and joyful connections.",
  },
  {
    id: "career",
    name_vi: "Sự Nghiệp & Bứt Phá",
    name_en: "Career & Breakthrough",
    icon: "🚀",
    prompt_keywords: "ascending beacon of laser focus, razor sharp victory crystalline structure, soaring momentum, unshakeable confidence",
    affirmation_vi: "Tôi sở hữu sự tập trung sắc bén, tự tin bứt phá và làm chủ đỉnh cao sự nghiệp.",
    affirmation_en: "I possess sharp focus and bold confidence to achieve extraordinary career breakthroughs.",
  },
  {
    id: "peace",
    name_vi: "Bình An & Chữa Lành",
    name_en: "Peace & Healing",
    icon: "🌿",
    prompt_keywords: "soothing bioluminescent lotus, tranquil reflective lake at twilight, soft healing cyan and lavender mist, profound inner stillness",
    affirmation_vi: "Tâm trí tôi an yên, cơ thể tôi được hồi phục và tràn đầy năng lượng tích cực.",
    affirmation_en: "My mind is peaceful, my spirit is serene, and my whole being is healed and renewed.",
  },
  {
    id: "creativity",
    name_vi: "Sáng Tạo & Cảm Hứng",
    name_en: "Creativity & Inspiration",
    icon: "✨",
    prompt_keywords: "prismatic burst of rainbow sparks, dynamic swirling idea galaxies, vibrant crystalline prism, joyful inspiration",
    affirmation_vi: "Dòng chảy sáng tạo vô tận luôn tuôn tràn trong từng suy nghĩ và hành động của tôi.",
    affirmation_en: "Infinite creative inspiration flows freely through my mind and actions today.",
  },
  {
    id: "protection",
    name_vi: "Hộ Mệnh & May Mắn",
    name_en: "Protection & Good Luck",
    icon: "🛡️",
    prompt_keywords: "radiant protective shield of golden light, sacred ancient talisman glyphs, repelling all negative energy, pure lucky aura",
    affirmation_vi: "Tôi luôn được bảo bọc trong ánh sáng may mắn, bình an và vững chãi trước mọi thử thách.",
    affirmation_en: "I am protected by divine lucky light, walking safely and boldly towards my highest good.",
  },
];

export interface DeviceAspectRatio {
  id: string;
  label_vi: string;
  label_en: string;
  ratio: string;
  width: number;
  height: number;
  iconName: string;
}

export const DEVICE_ASPECT_RATIOS: DeviceAspectRatio[] = [
  {
    id: "mobile",
    label_vi: "Hình nền Điện thoại",
    label_en: "Phone Wallpaper",
    ratio: "9:16",
    width: 720,
    height: 1280,
    iconName: "smartphone",
  },
  {
    id: "desktop",
    label_vi: "Hình nền Máy tính",
    label_en: "Desktop Wallpaper",
    ratio: "16:9",
    width: 1280,
    height: 720,
    iconName: "monitor",
  },
  {
    id: "square",
    label_vi: "Ảnh Đại diện / Avatar",
    label_en: "Avatar / Square",
    ratio: "1:1",
    width: 1024,
    height: 1024,
    iconName: "square",
  },
];
