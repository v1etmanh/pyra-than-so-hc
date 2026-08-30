"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import PyraHeader from "../shared/PyraHeader";
import { useProfiles } from "@/hooks/useProfiles";

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
  label: string;
  title: string;
  image: string;
  excerpt: string;
  body: string;
  takeaway: string;
};

const numerologyInsights: NumerologyInsight[] = [
  {
    label: "LIFE PATH 7",
    title: "The seeker, the analyst, the quiet observer",
    image: "Nautical Pearl Seven.png",
    excerpt: "What a 7 is here to learn through solitude, study, and trust.",
    body: "Life Path 7 moves through the world by looking beneath the surface. You may need quiet before clarity arrives, and your strongest insights often appear when you give yourself space to question, research, and listen inward.",
    takeaway: "Your invitation: let curiosity be a compass, not a reason to hide.",
  },
  {
    label: "BIRTHDAY NUMBER",
    title: "The day you arrived carries its own signature",
    image: "Vintage Nautical Pearl and Diving Helmet.png",
    excerpt: "A closer look at the natural gifts written into your birth day.",
    body: "Your birthday number describes a quality you can reach for instinctively. It adds a distinct tone to your larger chart: a way of solving problems, connecting with people, or showing up when life asks you to be fully yourself.",
    takeaway: "Start with the number of your birth day before reducing it further.",
  },
  {
    label: "COLOR & ENERGY",
    title: "Why color can change the feeling of a room",
    image: "Vintage Rainbow Butterfly Botanical Collage.png",
    excerpt: "Use color as a ritual cue for focus, rest, courage, or release.",
    body: "Color does not decide your fate, but it can shape attention and atmosphere. A warm tone may help you feel more visible, while a quieter shade can create space for reflection. Choose the color that supports the energy you want to practice today.",
    takeaway: "Think of color as an anchor for intention, not a promise of luck.",
  },
  {
    label: "PERSONAL YEAR",
    title: "The rhythm of your current chapter",
    image: "Golden Quill and Nine-Year Wheel.png",
    excerpt: "Understand the theme your personal year is inviting you to explore.",
    body: "A personal year gives your calendar a symbolic rhythm. Some years ask for beginnings, some for patience, and some for honest completion. Knowing the theme can help you work with the season instead of forcing every door open at once.",
    takeaway: "Move with the chapter you are in; every number has a purpose.",
  },
  {
    label: "EXPRESSION NUMBER",
    title: "The name you carry and the way you express it",
    image: "Cosmic Ideas Burst from Marble Thought.png",
    excerpt: "What your full name can reveal about your creative language.",
    body: "In numerology, the expression number is read from the letters in your full name. It is a reflective tool for exploring how you communicate, build, imagine, and contribute—not a fixed label you have to perform perfectly.",
    takeaway: "Use the number as a mirror, then decide what still feels true.",
  },
  {
    label: "MASTER NUMBERS",
    title: "11, 22, and 33: a louder invitation",
    image: "Mystical Eye Triangle with Golden Numerals.png",
    excerpt: "Why some numbers are read as heightened potential and pressure.",
    body: "Master numbers are often associated with amplified sensitivity, vision, or responsibility. Their energy can feel expansive and demanding at the same time, so the practice is to ground the big idea in one small, repeatable action.",
    takeaway: "Big potential becomes useful when it has a daily container.",
  },
];

const weeklyFrequency = {
  label: "NUMINA AI RECOMMENDS",
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
  { label: "ĐƯỜNG ĐỜI 7", title: "Người tìm kiếm, nhà phân tích, người quan sát tĩnh lặng", image: "Nautical Pearl Seven.png", excerpt: "Số 7 học được gì qua sự tĩnh lặng, nghiên cứu và niềm tin.", body: "Đường đời 7 bước qua thế giới bằng cách nhìn sâu hơn bề mặt. Bạn có thể cần sự yên tĩnh trước khi tìm thấy sự sáng rõ; những nhận thức mạnh mẽ nhất thường đến khi bạn cho mình không gian để đặt câu hỏi, nghiên cứu và lắng nghe bên trong.", takeaway: "Lời mời dành cho bạn: hãy để sự tò mò làm la bàn, đừng biến nó thành lý do để trốn tránh." },
  { label: "CON SỐ NGÀY SINH", title: "Ngày bạn đến với cuộc đời mang một dấu ấn riêng", image: "Vintage Nautical Pearl and Diving Helmet.png", excerpt: "Nhìn gần hơn vào những năng khiếu tự nhiên được ghi trong ngày sinh của bạn.", body: "Con số ngày sinh mô tả một phẩm chất bạn có thể chạm tới theo bản năng. Nó thêm sắc thái riêng vào toàn bộ biểu đồ: cách bạn giải quyết vấn đề, kết nối với người khác và xuất hiện khi cuộc sống cần bạn là chính mình.", takeaway: "Hãy bắt đầu với con số của ngày sinh trước khi rút gọn thêm." },
  { label: "MÀU SẮC & NĂNG LƯỢNG", title: "Vì sao màu sắc có thể thay đổi cảm nhận về một căn phòng", image: "Vintage Rainbow Butterfly Botanical Collage.png", excerpt: "Dùng màu sắc như một tín hiệu cho sự tập trung, nghỉ ngơi, can đảm hoặc buông bỏ.", body: "Màu sắc không quyết định số phận, nhưng có thể định hình sự chú ý và bầu không khí. Một gam màu ấm có thể giúp bạn hiện diện rõ hơn, còn sắc màu dịu có thể tạo khoảng trống cho suy ngẫm. Hãy chọn màu hỗ trợ nguồn năng lượng bạn muốn thực hành hôm nay.", takeaway: "Hãy xem màu sắc như điểm neo cho chủ ý, không phải lời hứa về may mắn." },
  { label: "NĂM CÁ NHÂN", title: "Nhịp điệu của chương đời hiện tại", image: "Golden Quill and Nine-Year Wheel.png", excerpt: "Hiểu chủ đề mà năm cá nhân đang mời bạn khám phá.", body: "Năm cá nhân tạo cho lịch của bạn một nhịp điệu biểu tượng. Có năm dành cho khởi đầu, có năm cần kiên nhẫn, cũng có năm dành cho sự hoàn tất chân thành. Biết chủ đề ấy giúp bạn đi cùng mùa của mình thay vì cố mở mọi cánh cửa cùng lúc.", takeaway: "Hãy bước cùng chương đời hiện tại; mỗi con số đều có một mục đích." },
  { label: "CON SỐ BIỂU ĐẠT", title: "Cái tên bạn mang và cách bạn thể hiện mình", image: "Cosmic Ideas Burst from Marble Thought.png", excerpt: "Tên đầy đủ có thể gợi mở điều gì về ngôn ngữ sáng tạo của bạn.", body: "Trong Nhân số học, con số biểu đạt được đọc từ các chữ cái trong họ tên đầy đủ. Đây là công cụ phản chiếu để khám phá cách bạn giao tiếp, xây dựng, tưởng tượng và đóng góp — không phải một nhãn cố định buộc bạn phải thể hiện hoàn hảo.", takeaway: "Hãy dùng con số như một tấm gương, rồi tự quyết định điều gì còn đúng với mình." },
  { label: "CÁC CON SỐ MASTER", title: "11, 22 và 33: một lời mời mạnh mẽ hơn", image: "Mystical Eye Triangle with Golden Numerals.png", excerpt: "Vì sao một số con số thường được đọc như tiềm năng và áp lực được khuếch đại.", body: "Các con số Master thường gắn với độ nhạy cảm, tầm nhìn hoặc trách nhiệm mạnh hơn. Năng lượng ấy có thể vừa rộng mở vừa đòi hỏi nhiều, vì vậy hãy neo ý tưởng lớn vào một hành động nhỏ có thể lặp lại mỗi ngày.", takeaway: "Tiềm năng lớn trở nên hữu ích khi có một khuôn khổ hằng ngày." },
];

const weeklyFrequencyVi = {
  label: "NUMINA AI GỢI Ý",
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
  const [selectedInsight, setSelectedInsight] = useState<NumerologyInsight | null>(null);
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
    if (!selectedInsight) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedInsight(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedInsight]);

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
          <div className="chani-hero-kicker">{activeSlide.eyebrow}</div>
          <h1>{activeSlide.title}</h1>
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

      <section className="chani-section chani-blog-section">
        <SectionHeading>{isVietnamese ? "Đọc vị những con số của bạn" : "Read your numbers"}</SectionHeading>
        <div className="chani-card-grid">{localizedInsights.map((insight, index) => <article className="chani-card chani-insight-card" key={insight.title}>
          <button className="chani-card-trigger" type="button" onClick={() => setSelectedInsight(insight)} aria-label={`${isVietnamese ? "Đọc" : "Read"} ${insight.title}`}>
            <ChaniImage src={`${ASSET}/${insight.image}`} alt="" className={`card-image card-image-${index % 3}`} />
            <span className="chani-card-label">{insight.label}</span>
            <h3>{insight.title}</h3>
            <span className="chani-card-excerpt">{insight.excerpt}</span>
            <span className="chani-small-button">{isVietnamese ? "ĐỌC THÊM" : "READ MORE"}</span>
          </button>
        </article>)}</div>
      </section>

      <section className="chani-section chani-frequency-section">
        <SectionHeading>{isVietnamese ? "Tần số năng lượng trong tuần" : "Your weekly frequency"}</SectionHeading>
        <div className="frequency-layout">
          <div className="frequency-visual spotify-frequency-card" aria-hidden="true">
            <div className="freq-green-ripples">
              <span className="green-ring ring-1" />
              <span className="green-ring ring-2" />
              <span className="green-ring ring-3" />
              <span className="green-ring ring-4" />
              <span className="green-ring ring-5" />
              <span className="green-ring ring-6" />
              <span className="green-ring ring-7" />
            </div>
            <div className="spotify-freq-badge">
              <span className="spotify-freq-dot" />
              <span>TUNED // 432 HZ</span>
            </div>
            <span className="frequency-star frequency-star-a">✦</span>
            <span className="frequency-star frequency-star-b">✧</span>
            <span className="spotify-freq-num">7</span>
            <span className="frequency-needle">♩</span>
            <div className="spotify-freq-equalizer">
              {[30, 65, 45, 80, 50, 95, 40, 70, 60, 85, 45, 75, 60, 35, 80, 50, 70, 45, 60, 80, 50].map((height, i) => (
                <span
                  key={i}
                  className="spotify-freq-bar"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${(i * 0.08).toFixed(2)}s`,
                    animationDuration: `${0.9 + (i % 4) * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="frequency-answer">
            <p className="frequency-label">{localizedWeeklyFrequency.label}</p>
            <p className="frequency-prompt">“{localizedWeeklyFrequency.prompt}”</p>
            <h3>{localizedWeeklyFrequency.title}</h3>
            <p className="frequency-artist">{localizedWeeklyFrequency.artist}</p>
            <p className="frequency-copy">{localizedWeeklyFrequency.answer}</p>
            <div className="frequency-tags">{localizedWeeklyFrequency.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <a className="chani-outline-button" href="https://open.spotify.com/" target="_blank" rel="noreferrer">{isVietnamese ? "PHÁT TẦN SỐ" : "PLAY THE FREQUENCY"}</a>
          </div>
        </div>
      </section>

      <section className="chani-section chani-guidance-section">
        <SectionHeading>{isVietnamese ? "Câu hỏi cho chương đời tiếp theo" : "Questions for your next chapter"}</SectionHeading>
        <div className="guidance-grid">{localizedGuidanceCards.map((card, index) => <article className="guidance-card" key={card.title}>
          <div className={`guidance-image-wrap guidance-image-wrap-${index}`}><ChaniImage src={`${ASSET}/numerology-insights/${card.image}`} alt="" className="guidance-image" /></div>
          <p className="guidance-label">{card.label}</p>
          <h3>{card.title}</h3>
          <p>{card.description}</p>
          <a className="chani-small-button" href={localize("/chat")}>{isVietnamese ? "HỎI NUMINA AI" : "ASK NUMINA AI"}</a>
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

      {selectedInsight && <div className="insight-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedInsight(null); }}>
        <section className="insight-modal" role="dialog" aria-modal="true" aria-labelledby="insight-modal-title">
          <button className="insight-modal-close" type="button" onClick={() => setSelectedInsight(null)} aria-label={isVietnamese ? "Đóng nội dung" : "Close insight"}>×</button>
          <div className="insight-modal-art"><ChaniImage src={`${ASSET}/${selectedInsight.image}`} alt="" /></div>
          <div className="insight-modal-copy">
            <p className="chani-hero-kicker">{selectedInsight.label}</p>
            <h2 id="insight-modal-title">{selectedInsight.title}</h2>
            <p>{selectedInsight.body}</p>
            <p className="insight-modal-takeaway">{selectedInsight.takeaway}</p>
            <button className="chani-outline-button" type="button" onClick={() => setSelectedInsight(null)}>{isVietnamese ? "ĐÓNG" : "CLOSE"}</button>
          </div>
        </section>
      </div>}

      <footer className="chani-footer">
        <div className="footer-columns"><div><strong>{isVietnamese ? "CÔNG TY" : "COMPANY"}</strong><a href={localize("/about/about-chani")}>{isVietnamese ? "Về Numina" : "About Numina"}</a><a href={localize("/about/careers")}>{isVietnamese ? "Tuyển dụng" : "Careers"}</a><a href={localize("/about/press")}>{isVietnamese ? "Báo chí" : "Press"}</a></div><div><strong>{isVietnamese ? "HỖ TRỢ" : "SUPPORT"}</strong><a href={localize("/privacy-policy")}>{isVietnamese ? "Chính sách riêng tư" : "Privacy Policy"}</a><a href={localize("/terms-of-service")}>{isVietnamese ? "Điều khoản sử dụng" : "Terms of Service"}</a><a href="https://chaninicholas.zendesk.com/hc/en-us">FAQ</a></div><div><strong>{isVietnamese ? "KẾT NỐI" : "CONNECT"}</strong><a href="https://www.instagram.com/chani.app/">Instagram</a><a href="https://open.spotify.com/show/7hpCJfE2JItPqOj8AgONCp">Spotify</a><a href="https://www.youtube.com/channel/UCwAhuKrSNpdetVX68rPBKww">YouTube</a></div></div>
        <div className="newsletter"><strong>{isVietnamese ? "ĐĂNG KÝ NHẬN BẢN TIN" : "SUBSCRIBE TO OUR NEWSLETTER"}</strong><div><input placeholder="yourname@email.com" /><button>{isVietnamese ? "ĐĂNG KÝ" : "SIGN UP"}</button></div></div>
        <p className="copyright">© Chani Nicholas Inc. 2026</p>
      </footer>
    </main>
  );
}
