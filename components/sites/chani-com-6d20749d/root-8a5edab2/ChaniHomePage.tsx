"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import PyraHeader from "../shared/PyraHeader";
import { useProfiles } from "@/hooks/useProfiles";
import { useBilling } from "@/hooks/useBilling";

const ASSET = "/sites/chani-com-6d20749d/root-8a5edab2/assets";

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  tone: "dark" | "light";
};

const slides: Slide[] = [
  {
    eyebrow: "A numerology guide for everyday life",
    title: "Know your pattern",
    description:
      "Explore the numbers behind your story, understand your natural strengths, and find a clearer way forward.",
    cta: "READ YOUR MAP",
    href: "/indicators",
    image: `${ASSET}/hero-numerology-1.jpg`,
    tone: "dark",
  },
  {
    eyebrow: "Your daily decision companion",
    title: "Meet the day",
    description:
      "Use your personal year, month, and day to turn uncertainty into one grounded next step.",
    cta: "ASK TODAY",
    href: "/chat",
    image: `${ASSET}/hero-numerology-2.jpg`,
    tone: "light",
  },
  {
    eyebrow: "Create an atmosphere for change",
    title: "Make it yours",
    description:
      "Turn your numbers and intentions into a visual ritual with lucky wallpapers made for your energy.",
    cta: "OPEN THE STUDIO",
    href: "/lucky-wallpaper",
    image: `${ASSET}/hero-numerology-3.jpg`,
    tone: "light",
  },
];

type NumerologyInsight = {
  href: string;
  label: string;
  title: string;
  image: string;
  excerpt: string;
  cta: string;
};

const numerologyInsights: NumerologyInsight[] = [
  {
    href: "/life-path-number-calculator",
    label: "CORE ARCHETYPE",
    title: "Life Path Number",
    image: "Vintage Nautical Pearl and Diving Helmet.png",
    excerpt: "Calculate your core life purpose, soul lesson, and innate strengths directly from your birth date.",
    cta: "CALCULATE ↗",
  },
  {
    href: "/indicators",
    label: "FULL CONSCIOUSNESS HUB",
    title: "24-Indicator Master Chart",
    image: "Mystical Eye Triangle with Golden Numerals.png",
    excerpt: "Our master calculator combining birth name and date to map your full conscious and subconscious blueprint.",
    cta: "EXPLORE ↗",
  },
  {
    href: "/expression-number-calculator",
    label: "DESTINY & GIFTS",
    title: "Expression Number",
    image: "Cosmic Ideas Burst from Marble Thought.png",
    excerpt: "Reveal your natural talents, vocal style, and outward potential using all letters in your birth name.",
    cta: "CALCULATE ↗",
  },
  {
    href: "/soul-urge-number-calculator",
    label: "INNER LONGING",
    title: "Soul Urge Number",
    image: "Vintage Rainbow Butterfly Botanical Collage.png",
    excerpt: "Uncover your deepest spiritual cravings and emotional truth through the vowels of your name.",
    cta: "CALCULATE ↗",
  },
  {
    href: "/personal-year-number-calculator",
    label: "CYCLE & TIMING",
    title: "Personal Year Number",
    image: "Golden Quill and Nine-Year Wheel.png",
    excerpt: "Navigate the rhythm and energetic themes of your current chapter within the classic 9-year cycle.",
    cta: "CALCULATE ↗",
  },
  {
    href: "/personality-number-calculator",
    label: "OUTER PERSONA",
    title: "Personality Number",
    image: "Personality Mirror and Cosmic Aura.png",
    excerpt: "Discover your outer aura, social impression, and initial presence using the consonants in your name.",
    cta: "CALCULATE ↗",
  },
  {
    href: "/birthday-number-calculator",
    label: "INNATE GIFT",
    title: "Birthday Number",
    image: "Nautical Pearl Seven.png",
    excerpt: "Explore the instinctual superpower and daily problem-solving gifts granted by the exact day you were born.",
    cta: "CALCULATE ↗",
  },
  {
    href: "/maturity-number-calculator",
    label: "MID-LIFE INTEGRATION",
    title: "Maturity Number",
    image: "Tree of Life and Celestial Sundial.png",
    excerpt: "Synthesize your Life Path and Expression to illuminate your culminating direction after age 35–40.",
    cta: "CALCULATE ↗",
  },
];

const weeklyFrequency = {
  label: "NUMELYRA AI RECOMMENDS",
  title: "Space Song",
  artist: "Beach House",
  prompt: "What should I listen to this week?",
  answer: "Give yourself a little more room to feel. This spacious, dreamlike track supports a Life Path 7 kind of week: quiet observation, honest reflection, and letting an answer arrive in its own time.",
  tags: ["REFLECTION", "INTUITION", "SLOW DOWN"],
};

const guidanceCards = [
  {
    label: "THE YEAR AHEAD",
    title: "Is this your lucky year?",
    image: "lucky-year.png",
    description: "Read the numbers around your next twelve months and find the openings worth saying yes to.",
  },
  {
    label: "YOUR NEXT SEASON",
    title: "How long until your good fortune arrives?",
    image: "good-fortune.png",
    description: "See the rhythm of your personal cycle and the kind of patience your next breakthrough may need.",
  },
  {
    label: "THE UNANSWERED QUESTION",
    title: "Why hasn’t CR7 won the World Cup?",
    image: "cr7-world-cup.png",
    description: "A playful numerology reading on timing, pressure, legacy, and the strange stories we ask the stars to explain.",
  },
];

const slidesVi: Slide[] = [
  { eyebrow: "La bàn Nhân số học cho đời sống hằng ngày", title: "Hiểu bản đồ của bạn", description: "Khám phá những con số phía sau câu chuyện của bạn, nhận ra thế mạnh tự nhiên và tìm hướng đi rõ ràng hơn.", cta: "ĐỌC BẢN ĐỒ", href: "/indicators", image: `${ASSET}/hero-numerology-1.jpg`, tone: "dark" },
  { eyebrow: "Người bạn đồng hành cho mỗi ngày", title: "Gặp gỡ năng lượng hôm nay", description: "Dùng năm, tháng và ngày cá nhân để biến sự băn khoăn thành một bước tiếp theo vững vàng.", cta: "HỎI NGAY HÔM NAY", href: "/chat", image: `${ASSET}/hero-numerology-2.jpg`, tone: "light" },
  { eyebrow: "Tạo không gian cho sự thay đổi", title: "Biến năng lượng thành của riêng bạn", description: "Kết hợp các con số và mong muốn của bạn thành hình nền may mắn, được tạo riêng cho nguồn năng lượng ấy.", cta: "MỞ XƯỞNG HÌNH NỀN", href: "/lucky-wallpaper", image: `${ASSET}/hero-numerology-3.jpg`, tone: "light" },
];

const numerologyInsightsVi: NumerologyInsight[] = [
  {
    href: "/life-path-number-calculator",
    label: "CHỈ SỐ CHỦ ĐẠO",
    title: "Con số Đường đời (Life Path)",
    image: "Vintage Nautical Pearl and Diving Helmet.png",
    excerpt: "Tính con số chủ đạo từ ngày sinh để thấu suốt bài học linh hồn, năng khiếu và con đường phát triển cá nhân.",
    cta: "TÍNH NGAY ↗",
  },
  {
    href: "/indicators",
    label: "BẢN ĐỒ TOÀN DIỆN",
    title: "Bản đồ 24 Chỉ số Pitago",
    image: "Mystical Eye Triangle with Golden Numerals.png",
    excerpt: "Công cụ tính tổng hợp toàn diện kết hợp họ tên và ngày sinh để giải mã trọn vẹn tiềm năng và tiềm thức.",
    cta: "KHÁM PHÁ ↗",
  },
  {
    href: "/expression-number-calculator",
    label: "SỨ MỆNH & VẬN MỆNH",
    title: "Chỉ số Sứ mệnh (Expression)",
    image: "Cosmic Ideas Burst from Marble Thought.png",
    excerpt: "Giải mã tài năng bẩm sinh, cách bạn hành động và dấu ấn cá nhân qua toàn bộ các chữ cái trong họ tên.",
    cta: "TÍNH NGAY ↗",
  },
  {
    href: "/soul-urge-number-calculator",
    label: "KHÁT KHAO NỘI TÂM",
    title: "Chỉ số Linh hồn (Soul Urge)",
    image: "Vintage Rainbow Butterfly Botanical Collage.png",
    excerpt: "Khám phá động lực sâu kín, tiếng nói trực giác và điều trái tim bạn thực sự mong cầu qua các nguyên âm.",
    cta: "TÍNH NGAY ↗",
  },
  {
    href: "/personal-year-number-calculator",
    label: "CHU KỲ & THỜI ĐIỂM",
    title: "Năm Cá nhân (Personal Year)",
    image: "Golden Quill and Nine-Year Wheel.png",
    excerpt: "Định vị năm hiện tại của bạn trong chu kỳ 9 năm để nắm bắt thời cơ bắt đầu, bứt phá hay chiêm nghiệm.",
    cta: "TÍNH NGAY ↗",
  },
  {
    href: "/personality-number-calculator",
    label: "HÌNH ẢNH ĐỐI NGOẠI",
    title: "Chỉ số Nhân cách (Personality)",
    image: "Personality Mirror and Cosmic Aura.png",
    excerpt: "Nhận diện ấn tượng đầu tiên bạn tỏa ra và cách thế giới đón nhận năng lượng của bạn qua các phụ âm.",
    cta: "TÍNH NGAY ↗",
  },
  {
    href: "/birthday-number-calculator",
    label: "MÓN QUÀ THIÊN PHÚ",
    title: "Chỉ số Ngày sinh (Birthday)",
    image: "Nautical Pearl Seven.png",
    excerpt: "Món quà đặc biệt từ chính ngày bạn cất tiếng khóc chào đời, phản ánh tài năng phản xạ tự nhiên của bạn.",
    cta: "TÍNH NGAY ↗",
  },
  {
    href: "/maturity-number-calculator",
    label: "ĐỈNH CAO CHÍN MUỒI",
    title: "Chỉ số Trưởng thành (Maturity)",
    image: "Tree of Life and Celestial Sundial.png",
    excerpt: "Giao thoa giữa Đường đời và Sứ mệnh, mở ra sứ mệnh nở rộ và hướng đi thăng hoa sau tuổi 35–40.",
    cta: "TÍNH NGAY ↗",
  },
];

const weeklyFrequencyVi = {
  label: "NUMELYRA AI GỢI Ý",
  title: "Space Song",
  artist: "Beach House",
  prompt: "Tuần này tôi nên nghe gì?",
  answer: "Hãy cho mình thêm một chút không gian để cảm nhận. Giai điệu mơ màng và rộng mở này phù hợp với một tuần mang tinh thần Đường đời 7: quan sát tĩnh lặng, thành thật nhìn lại và để câu trả lời đến vào đúng thời điểm.",
  tags: ["CHIÊM NGHIỆM", "TRỰC GIÁC", "CHẬM LẠI"],
};

const guidanceCardsVi = [
  { label: "NĂM PHÍA TRƯỚC", title: "Đây có phải năm may mắn của bạn?", image: "lucky-year.png", description: "Đọc những con số quanh mười hai tháng sắp tới và nhận ra những cơ hội đáng để bạn nói lời đồng ý." },
  { label: "MÙA TIẾP THEO", title: "Bao lâu nữa vận may sẽ đến?", image: "good-fortune.png", description: "Nhìn nhịp điệu của chu kỳ cá nhân và kiểu kiên nhẫn mà bước đột phá tiếp theo có thể cần." },
  { label: "CÂU HỎI CHƯA CÓ LỜI GIẢI", title: "Vì sao CR7 chưa vô địch World Cup?", image: "cr7-world-cup.png", description: "Một lời luận giải vui về thời điểm, áp lực, di sản và những câu chuyện kỳ lạ ta thường nhờ các vì sao giải thích." },
];

function localizePath(path: string, locale: string) {
  return locale === "vi" ? path : `/${locale}${path === "/" ? "" : path}`;
}

function ChaniImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <Image src={src} alt={alt} width={640} height={640} unoptimized className={className} />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="chani-section-title">{children}</h2>;
}

export default function ChaniHomePage() {
  const router = useRouter();
  const locale = useLocale();
  const { saveProfile } = useProfiles();
  const [slide, setSlide] = useState(0);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeName, setIntakeName] = useState("");
  const [intakeBirth, setIntakeBirth] = useState("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5 * 24 * 60 * 60 + 15 * 60 + 59);

  const handleDecodeMap = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = intakeName.trim();
    if (trimmed && intakeBirth) {
      saveProfile(trimmed, intakeBirth);
    }
    router.push("/indicators");
  };

  useEffect(() => {
    const interval = window.setInterval(() => setSlide((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!videoOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [videoOpen]);

  const countdown = useMemo(() => {
    const days = Math.floor(secondsLeft / 86400);
    const hours = Math.floor((secondsLeft % 86400) / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    return [days, hours, minutes, seconds].map((value) => String(value).padStart(2, "0"));
  }, [secondsLeft]);

  const isVietnamese = locale === "vi";
  const { isPro, openUpgradeModal } = useBilling();
  const localizedSlides = isVietnamese ? slidesVi : slides;
  const localizedInsights = isVietnamese ? numerologyInsightsVi : numerologyInsights;
  const localizedWeeklyFrequency = isVietnamese ? weeklyFrequencyVi : weeklyFrequency;
  const localizedGuidanceCards = isVietnamese ? guidanceCardsVi : guidanceCards;
  const localize = (path: string) => localizePath(path, locale);
  const activeSlide = localizedSlides[slide];
  const enterNumerologyMap = () => router.push(locale === "vi" ? "/indicators" : `/${locale}/indicators`);
  const handleLockClick = () => {
    if (intakeOpen) {
      setIntakeOpen(false);
      return;
    }
    setIntakeOpen(true);
    setVideoOpen(true);
  };

  return (
    <main className="chani-site">
      <PyraHeader />

      <section className="chani-hero" aria-label={isVietnamese ? "Nội dung nổi bật" : "Featured updates"}>
        <div className="chani-hero-copy">
          <h1 className="chani-hero-kicker" style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px", fontWeight: 700 }}>
            {isVietnamese ? "Công cụ tính Thần số học Pitago & Bản đồ Tâm thức" : "Free Pythagorean Numerology Calculators & Blueprint"}
          </h1>
          <div className="chani-hero-slide-heading" style={{ margin: "0 0 18px", fontFamily: "var(--chani-serif)", fontSize: "clamp(46px, 5.5vw, 84px)", fontWeight: 400, lineHeight: 0.95, letterSpacing: "-1px" }}>
            {activeSlide.title}
          </div>
          <p>{activeSlide.description}</p>
          <a className="chani-outline-button" href={localize(activeSlide.href)}>{activeSlide.cta}</a>
        </div>
        <div className="chani-hero-art"><ChaniImage src={activeSlide.image} alt="" className="hero-image" /></div>
        <button className="hero-arrow hero-arrow-left" onClick={() => setSlide((slide + localizedSlides.length - 1) % localizedSlides.length)} aria-label={isVietnamese ? "Trang trước" : "previous slide"}>←</button>
        <button className="hero-arrow hero-arrow-right" onClick={() => setSlide((slide + 1) % localizedSlides.length)} aria-label={isVietnamese ? "Trang tiếp theo" : "next slide"}>→</button>
        <div className="hero-dots">{localizedSlides.map((item, index) => <button key={item.title} className={index === slide ? "active" : ""} onClick={() => setSlide(index)} aria-label={`${isVietnamese ? "Hiển thị trang" : "Show slide"} ${index + 1}`} />)}</div>
      </section>

      <section className={`chani-profile-intake ${intakeOpen ? "is-open" : ""}`} aria-label={isVietnamese ? "Tạo bản đồ Nhân số học" : "Create your numerology map"}>
        <div className="profile-intake-content">
          <div className="profile-intake-copy">
            <p className="chani-hero-kicker">{isVietnamese ? "Bản đồ Nhân số học của bạn" : "Your numerology dashboard"}</p>
            <h2>{isVietnamese ? "Bắt đầu với những con số của bạn." : "Start with your numbers."}</h2>
            <p>{isVietnamese ? "Nhập thông tin để khám phá những khuôn mẫu, thế mạnh và lời mời đang hiện diện trong bản đồ cá nhân của bạn." : "Enter your details to discover the patterns, strengths, and invitations written into your personal map."}</p>
            <form onSubmit={handleDecodeMap}>
              <div className="profile-intake-fields">
                <label>
                  <span>{isVietnamese ? "Họ và tên" : "Full name"}</span>
                  <input
                    type="text"
                    value={intakeName}
                    onChange={(e) => setIntakeName(e.target.value)}
                    placeholder={isVietnamese ? "Nhập họ và tên" : "Your name"}
                    required
                  />
                </label>
                <label>
                  <span>{isVietnamese ? "Ngày sinh" : "Date of birth"}</span>
                  <input
                    type="date"
                    value={intakeBirth}
                    onChange={(e) => setIntakeBirth(e.target.value)}
                    required
                  />
                </label>
              </div>
              <button className="chani-outline-button" type="submit">
                {isVietnamese ? "GIẢI MÃ BẢN ĐỒ" : "DECODE MY MAP"}
              </button>
            </form>
          </div>
          <div className="profile-intake-art" aria-hidden="true">
            <ChaniImage src="/sites/chani-com-6d20749d/chart-9f6c9a84/assets/paper.webp" alt="" className="intake-paper" />
            <ChaniImage src="/sites/chani-com-6d20749d/chart-9f6c9a84/assets/saturn.webp" alt="" className="intake-saturn" />
            <span className="intake-number">7</span>
            <div className="intake-decode-card"><p>{isVietnamese ? "GIẢI MÃ BẢN ĐỒ" : "DECODE MY MAP"}</p><h3>{isVietnamese ? "Những con số đang viết gì về bạn?" : "What is written in your numbers?"}</h3><div><span>⌕</span><span>{isVietnamese ? "Nhập thông tin để bắt đầu" : "Enter your details to begin"}</span><strong>→</strong></div></div>
          </div>
        </div>
        <div className="profile-intake-doors" aria-hidden={intakeOpen}>
          <div className="profile-door profile-door-left"><ChaniImage src={`${ASSET}/doors/numerology-door-left.png`} alt="" /></div>
          <div className="profile-door profile-door-right"><ChaniImage src={`${ASSET}/doors/numerology-door-right.png`} alt="" /></div>
          <button className={`profile-lock ${intakeOpen ? "is-open" : ""}`} type="button" onClick={handleLockClick} aria-label={intakeOpen ? (isVietnamese ? "Đóng cánh cửa Nhân số học" : "Close numerology doors") : (isVietnamese ? "Mở bản đồ Nhân số học" : "Open numerology doors")} aria-expanded={intakeOpen}>
            <span className="profile-lock-icon" aria-hidden="true" />
            <span className="profile-lock-label">{intakeOpen ? (isVietnamese ? "Đóng" : "Close") : (isVietnamese ? "Mở bản đồ Nhân số học" : "Open your numerology map")}</span>
          </button>
        </div>
      </section>

      {videoOpen && <div className="map-entry-video" role="dialog" aria-modal="true" aria-label={isVietnamese ? "Đang mở bản đồ Nhân số học" : "Entering your numerology map"}><div className="map-entry-flare" /><video autoPlay muted playsInline onEnded={enterNumerologyMap} onError={enterNumerologyMap}><source src="/videos/Video%20Project%2021.mp4" type="video/mp4" /></video><div className="map-entry-video-copy"><span>{isVietnamese ? "ĐANG MỞ BẢN ĐỒ" : "OPENING YOUR MAP"}</span><strong>{isVietnamese ? "Đi theo ánh sáng" : "Follow the light"}</strong></div><button type="button" onClick={enterNumerologyMap}>{isVietnamese ? "VÀO BẢN ĐỒ ↗" : "ENTER MAP ↗"}</button></div>}

      <section className="chani-section chani-blog-section" aria-label={isVietnamese ? "Công cụ Thần số học Pitago" : "Pythagorean Numerology Calculators"}>
        <SectionHeading>{isVietnamese ? "Đọc vị những con số của bạn" : "Read your numbers"}</SectionHeading>
        <div className="chani-card-grid">
          {localizedInsights.map((insight, index) => (
            <article className="chani-card chani-insight-card" key={insight.href}>
              <a
                href={localize(insight.href)}
                className="chani-card-trigger"
                aria-label={`${isVietnamese ? "Tính" : "Calculate"} ${insight.title}`}
              >
                <ChaniImage
                  src={`${ASSET}/${insight.image}`}
                  alt={insight.title}
                  className={`card-image card-image-${index % 3}`}
                />
                <span className="chani-card-label">{insight.label}</span>
                <h3>{insight.title}</h3>
                <span className="chani-card-excerpt">{insight.excerpt}</span>
                <span className="chani-small-button">{insight.cta}</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="chani-section chani-frequency-section" aria-label={isVietnamese ? "Tần số năng lượng trong tuần" : "Your weekly frequency"}>
        {/* Corner celestial stars */}
        <span className="freq-corner-star freq-star-tl" aria-hidden="true">✦</span>
        <span className="freq-corner-star freq-star-tr" aria-hidden="true">✦</span>

        {/* Section Header */}
        <div className="freq-header">
          <div className="freq-moon-phases" aria-hidden="true">
            <span>)</span><span>)</span><span>)</span>
            <span className="freq-moon-circle">◯</span>
            <span>(</span><span>(</span><span>(</span>
          </div>
          <h2 className="freq-main-title">{isVietnamese ? "Tần số năng lượng trong tuần" : "YOUR WEEKLY FREQUENCY"}</h2>
          <p className="freq-sub-kicker">{isVietnamese ? "ÂM NHẠC CHO HÀNH TRÌNH NHÂN SỐ HỌC CỦA BẠN" : "MUSIC FOR YOUR NUMEROLOGY JOURNEY"}</p>
        </div>

        <div className="frequency-layout">
          {/* Left: The Botanical Collage with the 7 Album Card */}
          <div className="freq-visual-container">
            <ChaniImage
              src={`${ASSET}/weekly-frequency-album-7.png`}
              alt="Weekly Frequency - Space Song & Number 7"
              className="freq-album-collage-img"
            />
          </div>

          {/* Center/Right: Track Info, Tags & Player Bar */}
          <div className="frequency-answer">
            <p className="frequency-label">{localizedWeeklyFrequency.label}</p>
            <p className="frequency-prompt">“{localizedWeeklyFrequency.prompt}”</p>
            <h3 className="freq-track-title">{localizedWeeklyFrequency.title}</h3>
            <p className="frequency-artist">{localizedWeeklyFrequency.artist}</p>
            <p className="frequency-copy">{localizedWeeklyFrequency.answer}</p>
            <div className="frequency-tags">
              {localizedWeeklyFrequency.tags.map((tag) => (
                <span key={tag} className="freq-pill-tag">{tag}</span>
              ))}
            </div>

            {/* Rounded Dark-Forest Player Bar */}
            <div className="freq-player-bar-wrapper">
              <a
                className="freq-player-pill"
                href="https://open.spotify.com/search/Beach%20House%20Space%20Song"
                target="_blank"
                rel="noreferrer"
                aria-label={isVietnamese ? "Phát tần số trên Spotify" : "Play frequency on Spotify"}
              >
                <span className="freq-play-circle" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <polygon points="7,4 20,12 7,20" />
                  </svg>
                </span>
                <span className="freq-play-text">{isVietnamese ? "PHÁT TẦN SỐ" : "PLAY THE FREQUENCY"}</span>
                <div className="freq-mini-visualizer" aria-hidden="true">
                  {[35, 70, 50, 88, 62, 80, 45, 75, 55, 30].map((h, i) => (
                    <span
                      key={i}
                      className="freq-mini-bar"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${(i * 0.1).toFixed(2)}s`,
                        animationDuration: `${0.85 + (i % 3) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </a>
            </div>

            <p className="freq-footer-tagline">
              <span>{isVietnamese ? "ÂM NHẠC" : "MUSIC"}</span>
              <span className="freq-tag-dot">•</span>
              <span>{isVietnamese ? "NHÂN SỐ HỌC" : "NUMEROLOGY"}</span>
              <span className="freq-tag-dot">•</span>
              <span>{isVietnamese ? "BÌNH YÊN BÊN TRONG" : "A CALMER YOU"}</span>
            </p>
          </div>

          {/* Far Right Decorative Moon Branch (Desktop) */}
          <aside className="freq-right-accent" aria-hidden="true">
            <ChaniImage
              src={`${ASSET}/weekly-frequency-right-moon.png`}
              alt=""
              className="freq-right-accent-img"
            />
          </aside>
        </div>

        {/* Bottom Landscape Watercolor Border */}
        <div className="freq-bottom-hills" aria-hidden="true" />
      </section>

      <section className="chani-section chani-guidance-section">
        <SectionHeading>{isVietnamese ? "Câu hỏi cho chương đời tiếp theo" : "Questions for your next chapter"}</SectionHeading>
        <div className="guidance-grid">{localizedGuidanceCards.map((card, index) => <article className="guidance-card" key={card.title}>
          <div className={`guidance-image-wrap guidance-image-wrap-${index}`}><ChaniImage src={`${ASSET}/numerology-insights/${card.image}`} alt="" className="guidance-image" /></div>
          <p className="guidance-label">{card.label}</p>
          <h3>{card.title}</h3>
          <p>{card.description}</p>
          <a className="chani-small-button" href={localize("/chat")}>{isVietnamese ? "HỎI NUMELYRA AI" : "ASK NUMELYRA AI"}</a>
        </article>)}</div>
      </section>

      <section className="chani-countdown-section">
        <div className="countdown-copy"><p className="handwritten">{isVietnamese ? "Năng lượng của bạn nằm trong tay bạn." : "Your energy is yours to shape."}</p><h2>{isVietnamese ? "Chúng tôi ở đây để giúp bạn thu gom nguồn năng lượng ấy." : "We’re here to help you gather it."}</h2></div>
        <div className="countdown-card"><p>{isVietnamese ? "Bước chuyển tiếp theo bắt đầu sau..." : "Your next shift begins with..."}</p><div className="countdown-grid">{countdown.map((value, index) => <div key={index}><strong>{value}</strong><span>{(isVietnamese ? ["ngày", "giờ", "phút", "giây"] : ["days", "hours", "minutes", "seconds"])[index]}</span></div>)}</div><a className="chani-small-button" href={localize("/indicators")}>{isVietnamese ? "BẮT ĐẦU BẢN ĐỒ" : "START YOUR MAP"}</a></div>
      </section>

      <section className="chani-impact-section">
        <div className="impact-paper"><p className="handwritten">{isVietnamese ? "Một nơi để trở về" : "A place to return to"}</p><p>{isVietnamese ? "Mọi thứ ở đây được tạo ra để giúp bạn thu gom năng lượng, hiểu những khuôn mẫu của mình và sống có chủ ý hơn." : "Everything here is designed to help you gather your energy, understand your patterns, and move through life with more intention."}</p><a className="chani-outline-button" href={localize("/indicators")}>{isVietnamese ? "KHÁM PHÁ BẢN ĐỒ" : "EXPLORE YOUR MAP"}</a></div>
        <div className="shop-paper"><ChaniImage src={`${ASSET}/eclipse-card.png`} alt="" className="shop-image" /><div><p className="handwritten">{isVietnamese ? "Công cụ cho nguồn năng lượng của bạn" : "Tools for your energy"}</p><p>{isVietnamese ? "Từ tần số hằng tuần đến những nghi thức cá nhân, hãy tìm những cách nhỏ để biến hiểu biết bên trong thành thực hành mỗi ngày." : "From weekly frequencies to personal rituals, find small ways to turn your inner knowing into an everyday practice."}</p><a className="chani-outline-button" href={localize("/chat")}>{isVietnamese ? "TÌM TẦN SỐ CỦA BẠN" : "FIND YOUR FREQUENCY"}</a></div></div>
      </section>

      <section className="chani-start-section">
        <ChaniImage src={`${ASSET}/leo-season.avif`} alt="" className="start-art" />
        <div><h2>{isVietnamese ? "Năng lượng của bạn luôn có một nơi để hướng tới." : "Your energy has somewhere to go."}</h2><a className="chani-outline-button" href={localize("/indicators")}>{isVietnamese ? "BẮT ĐẦU TẠI ĐÂY" : "BEGIN HERE"}</a></div>
      </section>

      {/* NUMELYRA Pro Sacred Sanctuary Banner */}
      {!isPro && (
        <section className="home-pro-companion-banner" aria-label="NUMELYRA Pro Membership">
          <div className="home-pro-banner-content">
            <div className="home-pro-kicker">✦ NUMELYRA SACRED MEMBERSHIP</div>
            <h2 className="home-pro-title">
              {isVietnamese
                ? "Khai mở toàn diện thần số, tarot & năng lượng biểu tượng"
                : "Unlock the full depth of numerology, tarot & energy symbols"}
            </h2>
            <p className="home-pro-desc">
              {isVietnamese
                ? "Trải nghiệm không giới hạn 100 lượt vấn an AI/ngày, 20 hình nền năng lượng 4K, trọn bộ 78 lá Tarot và ưu tiên xử lý độc quyền."
                : "Experience 100 daily AI inquiries, 20 high-res 4K wallpapers, full 78-card Tarot sanctuary, and dedicated priority compute."}
            </p>
          </div>
          <button
            type="button"
            className="home-pro-btn"
            onClick={() => openUpgradeModal({ feature: 'general' })}
          >
            {isVietnamese ? "NÂNG CẤP PRO · 79.000Đ ↗" : "JOIN PRO · $3.99/MO ↗"}
          </button>
        </section>
      )}


      <footer className="chani-footer">
        <div className="footer-columns"><div><strong>{isVietnamese ? "CÔNG TY" : "COMPANY"}</strong><a href={localize("/about/about-chani")}>{isVietnamese ? "Về NUMELYRA" : "About NUMELYRA"}</a><a href={localize("/about/careers")}>{isVietnamese ? "Tuyển dụng" : "Careers"}</a><a href={localize("/about/press")}>{isVietnamese ? "Báo chí" : "Press"}</a></div><div><strong>{isVietnamese ? "HỖ TRỢ" : "SUPPORT"}</strong><a href={localize("/privacy-policy")}>{isVietnamese ? "Chính sách riêng tư" : "Privacy Policy"}</a><a href={localize("/terms-of-service")}>{isVietnamese ? "Điều khoản sử dụng" : "Terms of Service"}</a><a href="mailto:mqnyle@gmail.com">{isVietnamese ? "Liên hệ hỗ trợ" : "Contact Support"}</a></div><div><strong>{isVietnamese ? "KẾT NỐI" : "CONNECT"}</strong><a href="https://www.instagram.com/elhnam72/" target="_blank" rel="noopener noreferrer">Instagram</a><a href="mailto:mqnyle@gmail.com">Email: mqnyle@gmail.com</a></div></div>
        <div className="newsletter"><strong>{isVietnamese ? "ĐĂNG KÝ NHẬN BẢN TIN" : "SUBSCRIBE TO OUR NEWSLETTER"}</strong><div><input placeholder="yourname@email.com" /><button>{isVietnamese ? "ĐĂNG KÝ" : "SIGN UP"}</button></div></div>
        <p className="copyright">© NUMELYRA 2026</p>
      </footer>
    </main>
  );
}
