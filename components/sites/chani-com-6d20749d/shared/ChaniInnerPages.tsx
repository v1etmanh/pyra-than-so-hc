"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import PyraHeader from "./PyraHeader";
import { useChatRAG } from "@/hooks/use-chat-rag";
import { useProfiles } from "@/hooks/useProfiles";
import { getPersonalityIdentityKey, getStoredPersonalityAssessment, usePersonalityProfile } from "@/hooks/usePersonalityProfile";
import { useProcessNumerology } from "@/hooks/useProcessNumerology";
import { useAuth } from "@/hooks/useAuth";
import { getNumerologyImagePath } from "@/utils/numerology-images";
import ReactMarkdown from "react-markdown";

const SITE = "/sites/chani-com-6d20749d";

function ChaniImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <Image src={src} alt={alt} width={760} height={760} unoptimized className={className} />;
}

function SiteImage({ base, src, alt, className }: { base: string; src: string; alt: string; className?: string }) {
  return <ChaniImage src={`${base}/${src}`} alt={alt} className={className} />;
}

export function InnerHeader() {
  return <PyraHeader />;
}

export function StoreButtons() {
  return <div className="app-store-buttons batch-store-buttons">
    <a href="https://apps.apple.com/us/app/chani-your-astrology-guide/id1532791252">APP STORE</a>
    <a href="https://play.google.com/store/apps/details?id=com.chani_nicholas_inc.chani">GOOGLE PLAY</a>
  </div>;
}

export function InnerFooter() {
  return <footer className="chani-footer batch-footer">
    <div className="footer-columns"><div><strong>COMPANY</strong><a href="/about/about-chani">About CHANI</a><a href="/about/careers">Careers</a><a href="/about/press">Press</a></div><div><strong>SUPPORT</strong><a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms of Service</a><a href="https://chaninicholas.zendesk.com/hc/en-us">FAQ</a></div><div><strong>CONNECT</strong><a href="https://www.instagram.com/chani.app/">Instagram</a><a href="https://open.spotify.com/show/7hpCJfE2JItPqOj8AgONCp">Spotify</a><a href="https://www.youtube.com/channel/UCwAhuKrSNpdetVX68rPBKww">YouTube</a></div></div>
    <div className="newsletter"><strong>SUBSCRIBE TO OUR NEWSLETTER</strong><div><input placeholder="yourname@email.com" /><button>SIGN UP</button></div></div>
    <p className="copyright">© Chani Nicholas Inc. 2026</p>
  </footer>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="chani-site batch-site"><InnerHeader />{children}<InnerFooter /></main>;
}

const astroBase = `${SITE}/astro-101-88fc9eb0/assets`;

export function PodcastWeekAheadPage() {
  const [draft, setDraft] = useState("");
  const chat = useChatRAG();
  const { profiles } = useProfiles();

  // Deduplicate profiles by name and birthDate
  const uniqueProfiles = useMemo(() => {
    const seen = new Set<string>();
    return profiles.filter((p) => {
      const key = `${p.name.trim().toLowerCase()}_${p.birthDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profiles]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeProfile = useMemo(() => {
    if (selectedProfileId) {
      const found = uniqueProfiles.find((p) => p.id === selectedProfileId);
      if (found) return found;
    }
    return uniqueProfiles[0];
  }, [uniqueProfiles, selectedProfileId]);

  const indicators = useProcessNumerology(activeProfile?.name || "", activeProfile?.birthDate || "");
  const lifePath = indicators[0]?.value || "7";
  const displayName = activeProfile?.name || "Your Map";

  // Click outside to close dropdown
  useEffect(() => {
    if (!showProfileSelect) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileSelect(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileSelect]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || chat.isStreaming) return;
    setDraft("");

    const profileContext = activeProfile
      ? {
          name: activeProfile.name,
          birthDate: activeProfile.birthDate,
          lifePath: String(lifePath),
          indicators: indicators.map((ind) => ({
            key: ind.key,
            name: ind.name,
            value: String(ind.value ?? ""),
          })),
        }
      : undefined;

    await chat.sendMessage(text, profileContext);
  };

  const quickQuestions = [
    ["☼", "HÔM NAY MẶC MÀU GÌ?"],
    ["◷", "HÔM NAY NÊN RA ĐƯỜNG MẤY GIỜ?"],
    ["♧", "HÔM NAY NÊN TẬP TRUNG VÀO ĐIỀU GÌ?"],
    ["♡", "AI ĐANG MANG ĐẾN NĂNG LƯỢNG TỐT CHO TÔI?"],
    ["⌁", "HÔM NAY NÊN TRÁNH ĐIỀU GÌ?"],
    ["✦", "TỐI NAY TÔI NÊN NGHE BÀI HÁT NÀO?"],
  ];
  const askQuickQuestion = (question: string) => setDraft(question);

  return (
    <main className="chani-site pyra-ai-page">
      <InnerHeader />
      <section className="pyra-ai-workspace">
        <div className="pyra-ai-chat-panel">
          <div className="pyra-ai-chat-header">
            <p className="batch-kicker">NUMINA AI / PERSONAL NUMEROLOGY GUIDE</p>
            <h1>Ask Numina anything</h1>
            <div ref={dropdownRef} style={{ position: "relative", display: "inline-block", zIndex: 1000 }}>
              <button
                className="pyra-ai-profile-pill"
                type="button"
                onClick={() => setShowProfileSelect((prev) => !prev)}
                aria-expanded={showProfileSelect}
                aria-label="Chọn hồ sơ đang xem"
                style={{ cursor: "pointer" }}
              >
                <span className="pyra-ai-avatar">{String(lifePath).slice(0, 2)}</span>
                <span>{displayName} · Life Path {lifePath}</span>
                <span style={{ transition: "transform 0.2s", transform: showProfileSelect ? "rotate(180deg)" : "none" }}>⌄</span>
              </button>

              {showProfileSelect && uniqueProfiles.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    background: "#fdfbf7",
                    border: "1px solid rgba(42,42,43,.2)",
                    borderRadius: "12px",
                    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
                    zIndex: 99999,
                    minWidth: "260px",
                    padding: "8px 0",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "6px 16px", fontSize: "10px", letterSpacing: "0.08em", color: "#888", borderBottom: "1px solid rgba(0,0,0,0.06)", fontFamily: '"Courier New", monospace' }}>
                    CHỌN BẢN ĐỒ NGÀY SINH
                  </div>
                  {uniqueProfiles.map((p) => {
                    const isSelected = activeProfile?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfileId(p.id);
                          setShowProfileSelect(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          padding: "10px 16px",
                          background: isSelected ? "rgba(189,164,118,0.2)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = isSelected ? "rgba(189,164,118,0.3)" : "rgba(0,0,0,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? "rgba(189,164,118,0.2)" : "transparent")}
                      >
                        <div>
                          <strong style={{ display: "block", fontFamily: "var(--chani-serif)", fontSize: "14px", color: "#2a2a2b" }}>
                            {p.name}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#777", fontFamily: '"Courier New", monospace' }}>
                            {p.birthDate}
                          </span>
                        </div>
                        {isSelected && <span style={{ color: "#8a6d3b", fontSize: "14px", fontWeight: "bold" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="pyra-ai-messages" aria-live="polite">
            {chat.messages.map((message) => (
              <div
                className={`pyra-ai-message-row ${message.role === "user" ? "is-user" : "is-ai"}`}
                key={message.id}
              >
                {message.role === "user" ? (
                  <>
                    <div className="pyra-ai-message user-message">
                      <p>{message.content || "…"}</p>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span className="pyra-ai-mini-avatar">↗</span>
                  </>
                ) : (
                  <>
                    <span className="pyra-ai-compass">✧</span>
                    <div className="pyra-ai-message ai-message">
                      <div className="pyra-ai-markdown-body">
                        {message.content ? (
                          <ReactMarkdown
                            components={{
                              strong: ({ node, ...props }) => <strong className="ai-chat-bold-highlight" {...props} />,
                              b: ({ node, ...props }) => <b className="ai-chat-bold-highlight" {...props} />,
                              h1: ({ node, ...props }) => <h3 className="ai-chat-heading" {...props} />,
                              h2: ({ node, ...props }) => <h3 className="ai-chat-heading" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="ai-chat-heading" {...props} />,
                              h4: ({ node, ...props }) => <h4 className="ai-chat-subheading" {...props} />,
                              li: ({ node, ...props }) => <li className="ai-chat-list-item" {...props} />,
                              p: ({ node, ...props }) => <p className="ai-chat-paragraph" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="ai-chat-paragraph">
                            {message.isStreaming
                              ? chat.phase === "searching"
                                ? "ĐANG TRA CỨU TƯ LIỆU…"
                                : "ĐANG LUẬN GIẢI…"
                              : "…"}
                          </p>
                        )}
                      </div>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {message.isStreaming
                          ? ` · ${chat.phase === "searching" ? "SEARCHING" : "THINKING"}`
                          : ""}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {chat.isStreaming && (
            <div className="pyra-ai-live-status" aria-live="polite">
              <span className="pyra-ai-live-dot">✧</span>
              <span>
                {chat.phase === "searching"
                  ? "ĐANG TRA CỨU TƯ LIỆU…"
                  : "ĐANG TẠO LỜI GIẢI…"}
              </span>
              <span className="pyra-ai-live-pulse" aria-hidden="true" />
            </div>
          )}
          {chat.error && (
            <p className="pyra-chat-error" role="alert">
              {chat.error}
            </p>
          )}
          <form className="pyra-ai-input-wrap" onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Numina anything..."
              aria-label="Ask Numina anything"
              disabled={chat.isStreaming}
            />
            <button type="submit" aria-label="Send message" disabled={chat.isStreaming}>
              ➤
            </button>
          </form>
        </div>
        <aside className="pyra-human-panel">
          <div className="pyra-human-art">
            <span className="pyra-human-moon">◐</span>
            <span className="pyra-human-star star-one">✦</span>
            <span className="pyra-human-star star-two">✧</span>
            <span className="pyra-human-hand">☽</span>
          </div>
          <p className="batch-kicker">NUMINA / QUICK GUIDANCE</p>
          <h2>Ask me today</h2>
          <div className="pyra-human-rule">✦</div>
          <p className="pyra-human-intro">
            Tap a familiar question and let Numina read the energy around your day.
          </p>
          <div className="pyra-human-services pyra-quick-questions">
            {quickQuestions.map(([icon, question]) => (
              <button
                type="button"
                key={question}
                onClick={() => askQuickQuestion(question)}
              >
                <span className="pyra-service-icon">{icon}</span>
                <span>{question}</span>
                <b>›</b>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

const astroResources = [
  ["The signs", "signs.webp", "The twelve signs of the zodiac each have a unique language, style, and way of moving through the world."],
  ["The houses", "houses.webp", "The houses show where the stories in your birth chart unfold — from home and family to work and community."],
  ["Planets & points", "planets-points.avif", "The planets and points describe the characters, instincts, and inner forces at work in your chart."],
  ["Key terms", "key-terms.webp", "A glossary of the most useful astrology words, translated into language you can actually use."],
  ["Altars", "altars.webp", "Create a personal ritual space to connect with the themes moving through your life and chart."],
  ["Other fun topics", "fun-topics.webp", "Explore synastry, retrogrades, lunar nodes, and more ways to deepen your practice."],
];

export function Astro101Page() {
  return <Shell><section className="batch-simple-hero batch-astro-hero"><p className="batch-kicker">THE CHANI ASTRO HUB</p><h1>Astro 101</h1><p>New to astrology? Start here. Astro 101 breaks down the basics so you can build a relationship with the sky at your own pace.</p></section><section className="batch-section batch-astro-resources"><p className="batch-kicker batch-center">THE BASICS</p><h2 className="batch-section-title">Learn the language of the stars</h2><div className="batch-resource-grid">{astroResources.map(([title, image, text]) => <a href="/astro-hub/astro-101" className="batch-resource-card" key={title}><SiteImage base={astroBase} src={image} alt="" /><h3>{title}</h3><p>{text}</p><span>READ MORE ↗</span></a>)}</div><p className="batch-note">If you’re not sure where to begin, try this one.</p></section><section className="batch-study-cta"><div><p className="batch-kicker">READY TO FURTHER YOUR STUDIES?</p><h2>Check out our astro resources</h2><p>Keep learning with the CHANI app, our astrology planner, and books for every stage of your practice.</p><StoreButtons /></div><div className="batch-study-art"><SiteImage base={astroBase} src="planner-bubble.webp" alt="Astrology planner illustration" /><SiteImage base={astroBase} src="astro-planner.webp" alt="Astrology planner" /></div></section></Shell>;
}

const personalDayInsights: Record<number, { title: string; theme: string; color: string; hours: string; affirmation: string; advice: string }> = {
  1: {
    title: "Ngày của Khởi đầu & Hành động Quyết đoán",
    theme: "Năng lượng lãnh đạo, độc lập và bắt đầu kế hoạch mới.",
    color: "Đỏ tươi, Vàng hoàng kim",
    hours: "07:00 - 09:00 & 13:00 - 15:00",
    affirmation: "Tôi tự tin bước những bước đầu tiên và làm chủ vận mệnh của mình.",
    advice: "Hãy bắt tay vào dự án mới, đưa ra quyết định độc lập và đừng chần chừ."
  },
  2: {
    title: "Ngày của Hợp tác, Lắng nghe & Trực giác",
    theme: "Năng lượng kết nối tình cảm, ngoại giao và lắng nghe linh cảm.",
    color: "Trắng ngọc trai, Cam nhạt",
    hours: "09:00 - 11:00 & 19:00 - 21:00",
    affirmation: "Tôi kết nối trong hòa hợp và tin tưởng vào trực giác mách bảo.",
    advice: "Dành thời gian chăm sóc các mối quan hệ, lắng nghe nhiều hơn nói và giữ bình tĩnh."
  },
  3: {
    title: "Ngày của Sáng tạo, Giao tiếp & Niềm vui",
    theme: "Năng lượng bùng nổ ý tưởng, truyền cảm hứng và giao tiếp xã hội.",
    color: "Vàng chanh, Hổ phách",
    hours: "10:00 - 12:00 & 16:00 - 18:00",
    affirmation: "Tôi tự do thể hiện bản thân và lan tỏa năng lượng tích cực.",
    advice: "Viết lách, gặp gỡ bạn bè, chia sẻ ý tưởng và tận hưởng những khoảnh khắc vui vẻ."
  },
  4: {
    title: "Ngày của Kỷ luật, Tổ chức & Đặt nền móng",
    theme: "Năng lượng thực tế, cẩn trọng và sắp xếp công việc gọn gàng.",
    color: "Xanh lá cây đậm, Nâu đất",
    hours: "08:00 - 10:00 & 14:00 - 16:00",
    affirmation: "Tôi kiên trì xây dựng nền móng vững chắc cho tương lai.",
    advice: "Giải quyết các công việc tồn đọng, lập kế hoạch chi tiêu và giữ không gian sống ngăn nắp."
  },
  5: {
    title: "Ngày của Tự do, Thay đổi & Cơ hội bất ngờ",
    theme: "Năng lượng phiêu lưu, thích nghi linh hoạt và đón nhận luồng gió mới.",
    color: "Xanh da trời, Xanh ngọc bích",
    hours: "11:00 - 13:00 & 17:00 - 19:00",
    affirmation: "Tôi cởi mở đón nhận sự thay đổi và khám phá những chân trời mới.",
    advice: "Thử một trải nghiệm mới, đi dạo ngoài trời hoặc thay đổi góc làm việc của bạn."
  },
  6: {
    title: "Ngày của Gia đình, Yêu thương & Chữa lành",
    theme: "Năng lượng phụng sự, chăm sóc người thân và tạo không gian ấm áp.",
    color: "Hồng pastel, Xanh lam nhạt",
    hours: "07:30 - 09:30 & 18:30 - 20:30",
    affirmation: "Trái tim tôi tràn ngập lòng nhân ái và tình yêu thương vô điều kiện.",
    advice: "Nấu một bữa ăn ngon cho gia đình, gọi điện cho người thân và trang hoàng tổ ấm."
  },
  7: {
    title: "Ngày của Chiêm nghiệm, Tĩnh lặng & Học hỏi",
    theme: "Năng lượng soi rọi nội tâm, đọc sách và kết nối với bản thể cao hơn.",
    color: "Tím hoa cà, Trắng bạc",
    hours: "06:00 - 08:00 & 21:00 - 23:00",
    affirmation: "Trong tĩnh lặng, mọi câu trả lời chân thật nhất sẽ tự hiển lộ.",
    advice: "Dành thời gian một mình, thiền định hoặc đọc một cuốn sách sâu sắc về tâm hồn."
  },
  8: {
    title: "Ngày của Thành tựu, Tài chính & Quyền năng",
    theme: "Năng lượng hiện thực hóa mục tiêu, quản lý dòng tiền và nâng tầm vị thế.",
    color: "Đỏ ruby, Đen tuyền, Vàng ánh kim",
    hours: "09:30 - 11:30 & 15:00 - 17:00",
    affirmation: "Tôi xứng đáng nhận được sự thịnh vượng và thành công từ vũ trụ.",
    advice: "Đàm phán công việc quan trọng, chốt hợp đồng và nhìn nhận mọi thứ dưới góc độ tổng thể."
  },
  9: {
    title: "Ngày của Hoàn tất, Buông bỏ & Bao dung",
    theme: "Năng lượng khép lại chu kỳ cũ, tha thứ và chuẩn bị cho vòng quay mới.",
    color: "Vàng đồng, Tím than, Xanh rêu",
    hours: "08:30 - 10:30 & 16:30 - 18:30",
    affirmation: "Tôi nhẹ nhàng buông bỏ những điều không còn phục vụ cho sự phát triển của mình.",
    advice: "Dọn dẹp đồ đạc cũ, hoàn tất dự án dở dang và làm một việc thiện nguyện nhỏ."
  }
};

function AccountDetailsForm() {
  const { user } = useAuth();
  const { profiles, saveProfile, isSyncing } = useProfiles();
  const [saved, setSaved] = useState(false);
  const profile = profiles[0];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const activeName = name || profile?.name || "";
  const activeBirthDate = birthDate || profile?.birthDate || "";
  const activeEmail = email || user?.email || "";

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeName || !activeBirthDate) return;
    await saveProfile(activeName, activeBirthDate);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form className="account-details-form" onSubmit={save}>
      <div className="account-form-heading">
        <p className="batch-kicker">PERSONAL DETAILS {isSyncing && "· ĐANG ĐỒNG BỘ…"}</p>
        <h2>Cập nhật thông tin bản đồ</h2>
      </div>
      <label>
        Họ và tên
        <input
          value={activeName}
          onChange={(event) => setName(event.target.value)}
          placeholder="Họ và tên của bạn"
          required
        />
      </label>
      <label>
        Email tài khoản
        <input
          type="email"
          value={activeEmail}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={Boolean(user?.email)}
        />
      </label>
      <label>
        Ngày tháng năm sinh (Dương lịch)
        <input
          type="date"
          value={activeBirthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          required
        />
      </label>
      <button type="submit">
        {saved ? "ĐÃ LƯU THAY ĐỔI ✓" : "LƯU CẬP NHẬT"}
      </button>
      {saved && (
        <p className="account-form-message">
          {user ? "Hồ sơ của bạn đã được cập nhật và đồng bộ lên đám mây." : "Hồ sơ cá nhân đã được lưu trên thiết bị của bạn."}
        </p>
      )}
    </form>
  );
}

export function ChartPage() {
  const { user, profile: authProfile, signOut, openAuthModal } = useAuth();
  const { profiles, saveProfile, deleteProfile, isSyncing } = useProfiles();
  const { profile: personality } = usePersonalityProfile();

  // Deduplicate profiles
  const uniqueProfiles = useMemo(() => {
    const seen = new Set<string>();
    return profiles.filter((p) => {
      const key = `${p.name.trim().toLowerCase()}_${p.birthDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profiles]);

  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileBirth, setNewProfileBirth] = useState("");
  const [newProfileSaved, setNewProfileSaved] = useState(false);

  const activeProfile = useMemo(() => {
    if (activeProfileId) {
      const found = uniqueProfiles.find((p) => p.id === activeProfileId);
      if (found) return found;
    }
    return uniqueProfiles[0] || { name: authProfile?.full_name || "Bản đồ của bạn", birthDate: "1995-01-01" };
  }, [uniqueProfiles, activeProfileId, authProfile]);

  const indicators = useProcessNumerology(activeProfile.name, activeProfile.birthDate);

  const lifePath = indicators.find((i) => i.key === "walksOfLife")?.value || indicators[0]?.value || "7";
  const destiny = indicators.find((i) => i.key === "mission")?.value || "4";
  const soul = indicators.find((i) => i.key === "soul")?.value || "3";
  const personalityNum = indicators.find((i) => i.key === "personality")?.value || "1";
  const personalYear = indicators.find((i) => i.key === "year")?.value || "8";
  const personalMonth = indicators.find((i) => i.key === "month")?.value || "2";
  const rawPersonalDay = indicators.find((i) => i.key === "day")?.value;
  const personalDayNum = Number(rawPersonalDay) || 7;
  const todayInsight = personalDayInsights[personalDayNum] || personalDayInsights[7];

  const displayName = authProfile?.full_name || activeProfile.name || (user?.email ? user.email.split("@")[0] : "BẠN");

  const handleAddNewProfile = (e: FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim() || !newProfileBirth) return;
    saveProfile(newProfileName.trim(), newProfileBirth);
    setNewProfileName("");
    setNewProfileBirth("");
    setNewProfileSaved(true);
    setTimeout(() => setNewProfileSaved(false), 3000);
  };

  const today = new Date();
  const dateFormatted = `Thứ ${today.getDay() === 0 ? "Chủ Nhật" : today.getDay() + 1}, Ngày ${today.getDate()} Tháng ${today.getMonth() + 1}, ${today.getFullYear()}`;

  return (
    <Shell>
      {/* 1. HERO SECTION */}
      <section className="account-hero">
        <div className="account-hero-copy">
          <p className="batch-kicker">NUMINA / SACRED NUMEROLOGY DASHBOARD</p>
          <h1>
            Your map,<br />
            <em>held close.</em>
          </h1>
          <p>
            {user
              ? `Chào mừng ${displayName}. Toàn bộ bản đồ năng lượng, hồ sơ ngày sinh và dữ liệu của bạn đã được kết nối với tài khoản ${user.email}.`
              : "Không gian cá nhân lưu giữ các con số, phản chiếu năng lượng và nghi thức giúp bạn bước qua mỗi ngày với sự rõ ràng hơn."}
          </p>

          <div className="account-profile-card">
            <span className="account-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{displayName}</strong>
              <span>
                {user
                  ? `${user.email} · ✦ CLOUD SYNCED`
                  : activeProfile?.birthDate
                  ? `${activeProfile.birthDate} · LOCAL MAP`
                  : "Chưa đăng nhập · Dữ liệu tạm thời"}
              </span>
            </div>
            {user ? (
              <a href="#settings">CÀI ĐẶT</a>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("signin")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#886a92",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: '"Courier New", monospace',
                  textDecoration: "underline",
                }}
              >
                ĐĂNG NHẬP
              </button>
            )}
          </div>

          {/* Profile Switcher Tabs */}
          {uniqueProfiles.length > 1 && (
            <div style={{ marginTop: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontFamily: '"Courier New", monospace', color: "#777", width: "100%", marginBottom: "4px" }}>
                ĐANG XEM BẢN ĐỒ CỦA:
              </span>
              {uniqueProfiles.map((p) => {
                const isActive = p.id === activeProfile?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveProfileId(p.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      background: isActive ? "#2a2a2b" : "rgba(255,255,255,0.6)",
                      color: isActive ? "#fff" : "#2a2a2b",
                      border: "1px solid rgba(42,42,43,0.15)",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: '"Courier New", monospace',
                      transition: "all 0.2s",
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="account-hero-art">
          <span className="account-art-star account-art-star-one">✦</span>
          <span className="account-art-star account-art-star-two">✧</span>
          <span className="account-orbit account-orbit-one" />
          <span className="account-orbit account-orbit-two" />
          <strong>{String(lifePath).slice(0, 2)}</strong>
          <p>
            LIFE PATH NUMBER<br />
            {activeProfile.name.toUpperCase()}
          </p>
        </div>
      </section>

      {/* Cloud Sync Banner for Guests */}
      {!user && (
        <section
          style={{
            padding: "24px 13vw",
            background: "#ebd99e",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <strong style={{ fontFamily: "var(--chani-serif)", fontSize: "18px", color: "#2a2a2b" }}>
              ✦ Đồng bộ hành trình của bạn lên Đám mây
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: "12px", fontFamily: 'var(--chani-mono)', color: "#444" }}>
              Đăng nhập hoặc tạo tài khoản miễn phí để không bao giờ mất hồ sơ và kết quả tra cứu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal("signin")}
            style={{
              padding: "10px 20px",
              background: "#2a2a2b",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: 'var(--chani-mono)',
              letterSpacing: "0.06em",
            }}
          >
            ĐĂNG NHẬP NGAY ↗
          </button>
        </section>
      )}

      {/* 2. DAILY COSMIC TRANSIT & PERSONAL DAY FORECAST */}
      <section style={{ padding: "80px 13vw", background: "#f5f0e6", borderTop: "1px solid rgba(42,42,43,.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "36px" }}>
          <div>
            <p className="batch-kicker">DAILY COSMIC TRANSIT · {dateFormatted.toUpperCase()}</p>
            <h2 style={{ fontFamily: "var(--chani-serif)", fontSize: "clamp(36px, 4vw, 54px)", color: "#2a2a2b", margin: 0, textTransform: "uppercase" }}>
              Năng lượng hôm nay của bạn
            </h2>
          </div>
          <Link
            href="/chat"
            style={{
              padding: "12px 24px",
              background: "#2a2a2b",
              color: "#fff",
              textDecoration: "none",
              fontSize: "11px",
              fontFamily: 'var(--chani-mono)',
              letterSpacing: "0.05em",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            HỎI NUMINA AI VỀ HÔM NAY ↗
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Main Today Card */}
          <div
            style={{
              padding: "36px 32px",
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(189,164,118,0.35)",
              boxShadow: "10px 10px 0 rgba(189,164,118,0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#bda476",
                  color: "#fff",
                  fontFamily: "var(--chani-serif)",
                  fontSize: "22px",
                }}
              >
                {personalDayNum}
              </span>
              <div>
                <span style={{ fontSize: "10px", fontFamily: 'var(--chani-mono)', color: "#888", display: "block" }}>
                  NGÀY CÁ NHÂN {personalDayNum}
                </span>
                <strong style={{ fontFamily: "var(--chani-serif)", fontSize: "18px", color: "#2a2a2b" }}>
                  {todayInsight.title}
                </strong>
              </div>
            </div>

            <p style={{ fontFamily: 'var(--chani-mono)', fontSize: "13px", lineHeight: "1.6", color: "#555", marginBottom: "20px" }}>
              {todayInsight.theme}
            </p>

            <div style={{ padding: "16px", background: "#fcfaf7", borderLeft: "3px solid #bda476", marginBottom: "20px" }}>
              <span style={{ fontSize: "10px", fontFamily: 'var(--chani-mono)', color: "#999", display: "block", marginBottom: "4px" }}>
                ✦ KHẲNG ĐỊNH TÍCH CỰC (AFFIRMATION)
              </span>
              <p style={{ fontFamily: "var(--chani-serif)", fontStyle: "italic", fontSize: "14px", color: "#2a2a2b", margin: 0 }}>
                "{todayInsight.affirmation}"
              </p>
            </div>

            <p style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", color: "#666", margin: 0 }}>
              <strong>Lời khuyên:</strong> {todayInsight.advice}
            </p>
          </div>

          {/* Quick Energy Metrics Card */}
          <div
            style={{
              padding: "36px 32px",
              background: "#ebe4d5",
              border: "1px solid rgba(42,42,43,0.15)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p className="batch-kicker">COSMIC HARMONY</p>
              <h3 style={{ fontFamily: "var(--chani-serif)", fontSize: "24px", color: "#2a2a2b", margin: "0 0 20px" }}>
                Chỉ dẫn rung động hôm nay
              </h3>

              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(42,42,43,0.1)", paddingBottom: "10px" }}>
                  <span style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", color: "#666" }}>Màu sắc thu hút năng lượng:</span>
                  <strong style={{ fontFamily: "var(--chani-serif)", fontSize: "13px", color: "#2a2a2b" }}>{todayInsight.color}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(42,42,43,0.1)", paddingBottom: "10px" }}>
                  <span style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", color: "#666" }}>Khung giờ vàng hội tụ:</span>
                  <strong style={{ fontFamily: "var(--chani-serif)", fontSize: "13px", color: "#2a2a2b" }}>{todayInsight.hours}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(42,42,43,0.1)", paddingBottom: "10px" }}>
                  <span style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", color: "#666" }}>Tháng cá nhân hiện tại:</span>
                  <strong style={{ fontFamily: "var(--chani-serif)", fontSize: "13px", color: "#2a2a2b" }}>Tháng {personalMonth}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px" }}>
                  <span style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", color: "#666" }}>Năm cá nhân 2026:</span>
                  <strong style={{ fontFamily: "var(--chani-serif)", fontSize: "13px", color: "#8a6d3b" }}>Năm {personalYear} (Chu kỳ 9 năm)</strong>
                </div>
              </div>
            </div>

            <Link
              href="/wallpaper"
              style={{
                marginTop: "20px",
                display: "inline-block",
                color: "#2a2a2b",
                fontFamily: '"Courier New", monospace',
                fontSize: "11px",
                textDecoration: "underline",
              }}
            >
              TẠO HÌNH NỀN THẦN SỐ HỌC MAY MẮN CHO ĐIỆN THOẠI ↗
            </Link>
          </div>
        </div>
      </section>

      {/* 3. CORE 4 PILLARS BLUEPRINT */}
      <section style={{ padding: "90px 13vw", background: "#fcfbf9" }}>
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 60px" }}>
          <p className="batch-kicker">YOUR SACRED BLUEPRINT</p>
          <h2 style={{ fontFamily: "var(--chani-serif)", fontSize: "clamp(42px, 5vw, 68px)", color: "#2a2a2b", margin: "0 0 16px", textTransform: "uppercase" }}>
            4 Trụ Cột Thần Số Học Cốt Lõi
          </h2>
          <p style={{ fontFamily: 'var(--chani-mono)', fontSize: "13px", color: "#666" }}>
            Bộ khung năng lượng định hình bản sắc, tài năng và khát vọng sâu thẳm của {activeProfile.name}.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          {/* Life Path */}
          <div
            className="pillar-card"
            style={{
              padding: "32px 24px",
              background: "#eadbd4",
              border: "1px solid rgba(42,42,43,0.12)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {getNumerologyImagePath("walksOfLife", lifePath) && (
              <img
                src={getNumerologyImagePath("walksOfLife", lifePath)!}
                alt={`Số Đường Đời ${lifePath}`}
                className="pillar-card-icon"
              />
            )}
            <span style={{ fontSize: "36px", fontFamily: "var(--chani-serif)", color: "#8d6056", display: "block", marginBottom: "16px" }}>
              ✦ {lifePath}
            </span>
            <p className="batch-kicker" style={{ margin: "0 0 8px" }}>SỐ ĐƯỜNG ĐỜI</p>
            <h3 style={{ fontFamily: "var(--chani-serif)", fontSize: "22px", margin: "0 0 12px", color: "#2a2a2b" }}>
              La Bàn Cuộc Đời
            </h3>
            <p style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", lineHeight: "1.5", color: "#555", margin: 0 }}>
              Con đường và bài học linh hồn lớn nhất bạn đến cuộc đời này để trải nghiệm và làm chủ.
            </p>
          </div>

          {/* Destiny */}
          <div
            className="pillar-card"
            style={{
              padding: "32px 24px",
              background: "#e0e6db",
              border: "1px solid rgba(42,42,43,0.12)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {getNumerologyImagePath("mission", destiny) && (
              <img
                src={getNumerologyImagePath("mission", destiny)!}
                alt={`Số Sứ Mệnh ${destiny}`}
                className="pillar-card-icon"
              />
            )}
            <span style={{ fontSize: "36px", fontFamily: "var(--chani-serif)", color: "#5d7355", display: "block", marginBottom: "16px" }}>
              ☼ {destiny}
            </span>
            <p className="batch-kicker" style={{ margin: "0 0 8px" }}>SỐ SỨ MỆNH</p>
            <h3 style={{ fontFamily: "var(--chani-serif)", fontSize: "22px", margin: "0 0 12px", color: "#2a2a2b" }}>
              Năng Lực Hành Động
            </h3>
            <p style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", lineHeight: "1.5", color: "#555", margin: 0 }}>
              Công cụ và tiềm năng bẩm sinh mà vũ trụ trao tặng để bạn hiện thực hóa hoài bão.
            </p>
          </div>

          {/* Soul Urge */}
          <div
            className="pillar-card"
            style={{
              padding: "32px 24px",
              background: "#e4dce8",
              border: "1px solid rgba(42,42,43,0.12)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {getNumerologyImagePath("soul", soul) && (
              <img
                src={getNumerologyImagePath("soul", soul)!}
                alt={`Số Linh Hồn ${soul}`}
                className="pillar-card-icon"
              />
            )}
            <span style={{ fontSize: "36px", fontFamily: "var(--chani-serif)", color: "#745b7f", display: "block", marginBottom: "16px" }}>
              ♡ {soul}
            </span>
            <p className="batch-kicker" style={{ margin: "0 0 8px" }}>SỐ LINH HỒN</p>
            <h3 style={{ fontFamily: "var(--chani-serif)", fontSize: "22px", margin: "0 0 12px", color: "#2a2a2b" }}>
              Tiếng Nói Trái Tim
            </h3>
            <p style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", lineHeight: "1.5", color: "#555", margin: 0 }}>
              Khát khao chân thật, thầm kín nhất mang lại sự bình yên và hạnh phúc trọn vẹn.
            </p>
          </div>

          {/* Personality */}
          <div
            className="pillar-card"
            style={{
              padding: "32px 24px",
              background: "#eee5d9",
              border: "1px solid rgba(42,42,43,0.12)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {getNumerologyImagePath("personality", personalityNum) && (
              <img
                src={getNumerologyImagePath("personality", personalityNum)!}
                alt={`Số Nhân Cách ${personalityNum}`}
                className="pillar-card-icon"
              />
            )}
            <span style={{ fontSize: "36px", fontFamily: "var(--chani-serif)", color: "#9e793f", display: "block", marginBottom: "16px" }}>
              ◐ {personalityNum}
            </span>
            <p className="batch-kicker" style={{ margin: "0 0 8px" }}>SỐ NHÂN CÁCH</p>
            <h3 style={{ fontFamily: "var(--chani-serif)", fontSize: "22px", margin: "0 0 12px", color: "#2a2a2b" }}>
              Tấm Gương Ngoại Cảnh
            </h3>
            <p style={{ fontFamily: 'var(--chani-mono)', fontSize: "12px", lineHeight: "1.5", color: "#555", margin: 0 }}>
              Cách bạn bộc lộ bản thân ra thế giới bên ngoài và ấn tượng bạn tạo nên với mọi người.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <Link
            href="/indicators"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "#2a2a2b",
              color: "#fff",
              textDecoration: "none",
              fontFamily: 'var(--chani-mono)',
              fontSize: "12px",
              letterSpacing: "0.06em",
            }}
          >
            KHÁM PHÁ TOÀN BỘ 24 CHỈ SỐ CHI TIẾT ↗
          </Link>
        </div>
      </section>

      {/* 4. SAVED PROFILES & FAMILY HUBS */}
      <section style={{ padding: "80px 13vw", background: "#f4f2ee", borderTop: "1px solid rgba(42,42,43,.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "36px" }}>
          <div>
            <p className="batch-kicker">FAMILY & FRIENDS MAPS ({uniqueProfiles.length}/10)</p>
            <h2 style={{ fontFamily: "var(--chani-serif)", fontSize: "clamp(32px, 4vw, 48px)", color: "#2a2a2b", margin: 0, textTransform: "uppercase" }}>
              Quản lý danh sách bản đồ đã lưu
            </h2>
          </div>
          <span style={{ fontFamily: 'var(--chani-mono)', fontSize: "11px", color: "#777" }}>
            Tự động lưu trữ trên {user ? "Đám mây Supabase" : "Trình duyệt"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          {uniqueProfiles.map((p) => {
            const isSelected = p.id === activeProfile?.id;
            return (
              <div
                key={p.id}
                style={{
                  padding: "24px",
                  background: isSelected ? "#fff" : "rgba(255,255,255,0.75)",
                  border: isSelected ? "2px solid #bda476" : "1px solid rgba(42,42,43,.15)",
                  boxShadow: isSelected ? "0 8px 24px rgba(189,164,118,0.2)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <strong style={{ display: "block", fontSize: "18px", fontFamily: "var(--chani-serif)", color: "#2a2a2b" }}>
                        {p.name}
                      </strong>
                      <span style={{ fontSize: "12px", fontFamily: 'var(--chani-mono)', color: "#777" }}>
                        {p.birthDate}
                      </span>
                    </div>
                    {isSelected && (
                      <span style={{ padding: "3px 8px", background: "#ebd99e", fontSize: "9px", fontFamily: 'var(--chani-mono)', borderRadius: "10px" }}>
                        ĐANG CHỌN
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "18px", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveProfileId(p.id)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: isSelected ? "#2a2a2b" : "transparent",
                      color: isSelected ? "#fff" : "#2a2a2b",
                      border: "1px solid #2a2a2b",
                      cursor: "pointer",
                      fontSize: "10px",
                      fontFamily: 'var(--chani-mono)',
                    }}
                  >
                    CHỌN BẢN ĐỒ
                  </button>
                  <Link
                    href="/indicators"
                    style={{
                      padding: "8px 12px",
                      background: "transparent",
                      color: "#2a2a2b",
                      border: "1px solid rgba(42,42,43,0.3)",
                      fontSize: "10px",
                      fontFamily: 'var(--chani-mono)',
                      textDecoration: "none",
                      display: "grid",
                      placeItems: "center",
                    }}
                    title="Xem 24 chỉ số"
                  >
                    24 CHỈ SỐ ↗
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteProfile(p.id)}
                    style={{
                      padding: "8px",
                      background: "none",
                      border: "none",
                      color: "#c44",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontFamily: 'var(--chani-mono)',
                    }}
                    aria-label={`Xóa hồ sơ ${p.name}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Profile Inline Form */}
        <div style={{ padding: "32px", background: "rgba(255,255,255,0.6)", border: "1px dashed rgba(42,42,43,0.3)" }}>
          <p className="batch-kicker" style={{ margin: "0 0 6px" }}>THÊM HỒ SƠ MỚI</p>
          <h3 style={{ fontFamily: "var(--chani-serif)", fontSize: "20px", margin: "0 0 16px", color: "#2a2a2b" }}>
            Lưu bản đồ người thân, con cái hoặc bạn bè
          </h3>
          <form onSubmit={handleAddNewProfile} style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Họ và tên người cần lưu"
              required
              style={{
                flex: "1 1 220px",
                padding: "10px 14px",
                border: "1px solid rgba(42,42,43,0.2)",
                background: "#fff",
                fontFamily: 'var(--chani-mono)',
                fontSize: "12px",
              }}
            />
            <input
              type="date"
              value={newProfileBirth}
              onChange={(e) => setNewProfileBirth(e.target.value)}
              required
              style={{
                flex: "1 1 180px",
                padding: "10px 14px",
                border: "1px solid rgba(42,42,43,0.2)",
                background: "#fff",
                fontFamily: 'var(--chani-mono)',
                fontSize: "12px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "11px 24px",
                background: "#2a2a2b",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: 'var(--chani-mono)',
                fontSize: "11px",
                letterSpacing: "0.05em",
              }}
            >
              + THÊM HỒ SƠ
            </button>
            {newProfileSaved && (
              <span style={{ fontSize: "11px", color: "#477a45", fontFamily: 'var(--chani-mono)' }}>
                Đã thêm hồ sơ thành công! ✓
              </span>
            )}
          </form>
        </div>
      </section>

      {/* 5. 5-DIMENSIONS PSYCHOLOGY SECTION */}
      {personality?.scores && (
        <section style={{ padding: "80px 13vw", background: "#eee8df", borderTop: "1px solid rgba(42,42,43,.15)" }}>
          <p className="batch-kicker">INNER DIMENSIONS MAP</p>
          <h2 style={{ fontFamily: "var(--chani-serif)", fontSize: "36px", color: "#2a2a2b", margin: "0 0 24px", textTransform: "uppercase" }}>
            5 Chiều Kích Tâm Lý Nội Tâm
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {Object.entries(personality.scores).map(([trait, score]) => (
              <div key={trait} style={{ padding: "20px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(42,42,43,0.12)" }}>
                <span style={{ fontSize: "11px", fontFamily: 'var(--chani-mono)', color: "#777", textTransform: "uppercase", display: "block" }}>
                  {trait}
                </span>
                <strong style={{ fontSize: "28px", fontFamily: "var(--chani-serif)", color: "#2a2a2b" }}>
                  {Math.round(score * 100)}%
                </strong>
                <div style={{ width: "100%", height: "4px", background: "#e0d9cf", marginTop: "8px", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(score * 100)}%`, height: "100%", background: "#8d6056" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. SETTINGS & CLOUD SECURITY */}
      <section className="account-settings" id="settings">
        <AccountDetailsForm />
        <aside className="account-settings-side">
          <p className="batch-kicker">ACCOUNT & SECURITY</p>
          <h2>
            Your space,<br />
            <em>your rhythm.</em>
          </h2>
          <div className="account-setting-row">
            <span>◌</span>
            <div>
              <strong>Đồng bộ đám mây (Cloud Sync)</strong>
              <p>{user ? "Hồ sơ của bạn đang được tự động đồng bộ thời gian thực lên Supabase." : "Đăng nhập để tự động sao lưu dữ liệu vĩnh viễn trên đám mây."}</p>
            </div>
            <button type="button" aria-label="Toggle cloud sync status">
              {user ? "ON" : "OFF"}
            </button>
          </div>
          <div className="account-setting-row">
            <span>⌁</span>
            <div>
              <strong>Bảo mật bản đồ cá nhân</strong>
              <p>Mọi chỉ số và thông tin cá nhân đều được mã hóa an toàn.</p>
            </div>
            <button type="button" aria-label="Private map enabled">
              ON
            </button>
          </div>

          <div style={{ marginTop: "28px", display: "flex", gap: "20px", alignItems: "center" }}>
            <Link className="account-logout" href="/">
              TRỞ LẠI TRANG CHỦ ↗
            </Link>
            {user && (
              <button
                type="button"
                onClick={() => signOut()}
                style={{
                  marginTop: "28px",
                  background: "none",
                  border: "none",
                  color: "#a34e4e",
                  cursor: "pointer",
                  font: '10px "Courier New", monospace',
                  textDecoration: "underline",
                }}
              >
                ĐĂNG XUẤT ✕
              </button>
            )}
          </div>
        </aside>
      </section>
    </Shell>
  );
}

const wallpaperStyles = [
  ["geometry", "Sacred Geometry", "✧"], ["gold", "Gold 3D", "◇"], ["zen", "Zen", "◉"], ["botanical", "Botanical", "❧"], ["cosmic", "Cosmic", "◌"], ["minimal", "Minimal", "◯"],
];

const wallpaperIntentions = [
  ["wealth", "Wealth", "☼"], ["love", "Love", "♡"], ["peace", "Peace", "❀"], ["focus", "Focus", "◉"], ["healing", "Healing", "♢"], ["courage", "Courage", "⌁"],
];

const wallpaperLibrary = [
  { kind: "lucky", title: "Hoa mẫu đơn đỏ / hồng", subtitle: "Thoát ế thần tốc", description: "Theo lời đồn mạng xã hội, hoa mẫu đơn bung nở đại diện cho cung Đào hoa, vẻ quyến rũ và một chuyện tình son sắt.", image: "/images/collages/collage_01_peony_love.png" },
  { kind: "lucky", title: "Thần Tài & mèo Maneki Neko", subtitle: "Dân sales và buôn bán", description: "Biểu tượng thường được chọn cho những ngày vía Thần Tài, gắn với lời chúc tiền về, đơn đi tấp nập và tài lộc mở ra.", image: "/images/collages/collage_02_wealth_gold.png" },
  { kind: "lucky", title: "Cỏ 4 lá xanh ngọc", subtitle: "May mắn toàn năng", description: "Bốn chiếc lá mang bốn điều ước: niềm tin, hy vọng, tình yêu và một vận may bất ngờ gặp đúng lúc.", image: "/images/collages/collage_03_four_leaf_clover.png" },
  { kind: "lucky", title: "Bát mã truy phong", subtitle: "Công danh & thăng tiến", description: "Tám chú ngựa phi về phía trước gợi tinh thần Mã đáo thành công, bền bỉ vượt qua những khúc quanh của sự nghiệp.", image: "/images/collages/collage_04_galloping_horses.png" },
  { kind: "lucky", title: "Cá chép vượt Vũ Môn", subtitle: "Cử nhân & mùa thi cử", description: "Cá chép hóa rồng là hình ảnh của nỗ lực, vượt ngưỡng và tin rằng một mùa thi hay một cuộc phỏng vấn có thể mở ra chương mới.", image: "/images/collages/collage_05_koi_dragon_gate.png" },
  { kind: "lucky", title: "Số thiên thần 111 · 777 · 888", subtitle: "Angel numbers", description: "111 cho khởi đầu, 777 cho niềm vui bất ngờ, 888 cho dòng chảy thịnh vượng. Hãy xem chúng như những lời nhắc để chú ý hơn.", image: "/images/collages/collage_06_angel_numbers.png" },
  { kind: "lucky", title: "Hoa sen & trăng tròn", subtitle: "Chữa lành & bình an", description: "Một hình nền nhẹ và tĩnh dành cho những ngày cần hạ nhịp, làm dịu ánh nhìn và trở về với hơi thở của mình.", image: "/images/collages/collage_07_lotus_supermoon.png" },
  { kind: "danger", title: "Hoa bỉ ngạn đỏ", subtitle: "Red spider lily / Manjushage", description: "Trong folklore, loài hoa này gắn với chia ly và đoạn tuyệt. Hình ảnh ma mị, đẹp nhưng không phải lựa chọn nhẹ năng lượng cho mọi người.", image: "/images/collages/collage_08_spider_lily.png" },
  { kind: "danger", title: "Gương vỡ / thủy tinh nứt", subtitle: "Broken glass", description: "Lời đồn phong thủy xem mặt gương nứt như biểu tượng của rạn vỡ. Về thị giác, các đường nứt cũng dễ tạo cảm giác bất an mỗi lần mở máy.", image: "/images/collages/collage_09_broken_mirror.png" },
  { kind: "danger", title: "Hoàng hôn tàn", subtitle: "Setting sun", description: "Mặt trời lặn thường được đọc như dấu hiệu của thoái trào và hao hụt. Nếu cần năng lượng mở ra, hãy thử đổi sang bình minh.", image: "/images/collages/collage_10_twilight_sunset.png" },
  { kind: "danger", title: "Cây khô & sa mạc cằn cỗi", subtitle: "Cạn kiệt nguồn sống", description: "Một ẩn dụ mạnh về sự cô đơn, thiếu nước và mất động lực. Không phải ai cũng muốn mang cảm giác khô cạn vào màn hình mỗi ngày.", image: "/images/collages/collage_11_barren_desert.png" },
  { kind: "danger", title: "Mãnh thú nhe nanh", subtitle: "Hổ gầm · rắn độc · cá mập", description: "Sát khí quá nặng có thể khiến không gian cá nhân trở nên căng thẳng. Đây là thử thách thị giác cho người thích một chút kịch tính.", image: "/images/collages/collage_12_roaring_beast.png" },
  { kind: "danger", title: "Đồng hồ đứng yên", subtitle: "Thời gian mắc kẹt", description: "Đồng hồ chết và đồng hồ cát cạn thường được gắn với sự ngưng trệ, bế tắc và cảm giác vận khí không còn chuyển động.", image: "/images/collages/collage_13_stopped_clock.png" },
  { kind: "danger", title: "Bức ảnh nguyền rủa", subtitle: "Cursed wallpaper meme", description: "Một câu chuyện Reddit về hình hồ nước gây boot-loop từng lan truyền mạnh. Đây là folklore internet, không phải lời khẳng định kỹ thuật.", image: "/images/collages/collage_14_ward_evil_eye.png" },
];

export function EditorsPicksPage() {
  const { profiles } = useProfiles();

  // Deduplicate profiles
  const uniqueProfiles = useMemo(() => {
    const seen = new Set<string>();
    return profiles.filter((p) => {
      const key = `${p.name.trim().toLowerCase()}_${p.birthDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profiles]);

  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const activeProfile = useMemo(() => {
    if (activeProfileId) {
      const found = uniqueProfiles.find((p) => p.id === activeProfileId);
      if (found) return found;
    }
    return uniqueProfiles[0] || { name: "Bản đồ của bạn", birthDate: "1995-01-01" };
  }, [uniqueProfiles, activeProfileId]);

  const indicators = useProcessNumerology(activeProfile.name, activeProfile.birthDate);
  const lifePath = indicators.find((i) => i.key === "walksOfLife")?.value || "7";
  const destiny = indicators.find((i) => i.key === "mission")?.value || "4";
  const soul = indicators.find((i) => i.key === "soul")?.value || "3";
  const personalityNum = indicators.find((i) => i.key === "personality")?.value || "1";
  const personalYear = Number(indicators.find((i) => i.key === "year")?.value) || 2026;
  const personalDay = Number(indicators.find((i) => i.key === "day")?.value) || 1;

  const [style, setStyle] = useState("geometry");
  const [intention, setIntention] = useState("wealth");
  const [device, setDevice] = useState("phone");
  const [customWish, setCustomWish] = useState("");
  const [challengeTitle, setChallengeTitle] = useState<string | null>(null);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<"idle" | "directing" | "rendering" | "done">("idle");
  const [generatedData, setGeneratedData] = useState<{
    imageUrl: string;
    explanation_vi: string;
    affirmation_vi: string;
    luckyColors_vi: string[];
    sacredSymbols?: string[];
    prompt?: string;
    isAIGenerated?: boolean;
    aiProvider?: string;
    aiModel?: string;
    imageProvider?: string;
    imageModel?: string;
  } | null>(null);

  const generateWallpaper = async () => {
    setIsGenerating(true);
    setGenerationPhase("directing");
    try {
      const styleIdMap: Record<string, string> = {
        geometry: "sacred_geometry",
        gold: "luxury_gold_3d",
        zen: "ethereal_minimalist",
        botanical: "watercolor_nature",
        cosmic: "tarot_editorial",
        minimal: "ethereal_minimalist",
      };
      const styleId = styleIdMap[style] || "sacred_geometry";
      const deviceType = device === "phone" ? "mobile" : device === "laptop" ? "desktop" : "square";

      const response = await fetch("/api/lucky-wallpaper/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: activeProfile.name,
          birthDate: activeProfile.birthDate,
          lifePathNumber: Number(lifePath) || 7,
          destinyNumber: destiny,
          soulUrgeNumber: soul,
          personalityNumber: personalityNum,
          personalDay,
          personalYear,
          intentionId: intention,
          styleId,
          deviceType,
          customWish: customWish.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo hình nền.");
      }

      setGenerationPhase("rendering");
      setGeneratedData({
        imageUrl: data.imageUrl,
        explanation_vi: data.explanation_vi,
        affirmation_vi: data.affirmation_vi,
        luckyColors_vi: data.luckyColors_vi || [],
        sacredSymbols: data.sacredSymbols || [],
        prompt: data.prompt,
        isAIGenerated: data.isAIGenerated,
        aiProvider: data.aiProvider,
        aiModel: data.aiModel,
        imageProvider: data.imageProvider,
        imageModel: data.imageModel,
      });
      setGenerationPhase("done");
    } catch (err) {
      console.error(err);
      setGenerationPhase("idle");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadWallpaper = () => {
    if (!generatedData?.imageUrl) return;
    const anchor = document.createElement("a");
    anchor.href = generatedData.imageUrl;
    anchor.download = `pyra-lucky-wallpaper-${lifePath}-${intention}.png`;
    anchor.target = "_blank";
    anchor.click();
  };

  return (
    <Shell>
      <section className="wallpaper-studio-section">
        <div className="wallpaper-studio-copy">
          <p className="batch-kicker">NUMINA / AI SACRED WALLPAPER STUDIO</p>
          <h2>Lucky wallpaper studio</h2>
          <p className="wallpaper-studio-lead">
            Kiến tạo bức tranh năng lượng hộ mệnh độc bản. AI Art Director sẽ giải mã bản đồ Thần số học của bạn và kết hợp hình học thiêng liêng để tạo nên hình nền may mắn 8K.
          </p>

          {/* Profile Switcher */}
          {uniqueProfiles.length > 1 && (
            <div style={{ marginBottom: "24px", padding: "12px 16px", background: "rgba(255,255,255,0.7)", border: "1px solid rgba(42,42,43,0.15)" }}>
              <span style={{ fontSize: "10px", fontFamily: '"Courier New", monospace', color: "#777", display: "block", marginBottom: "8px" }}>
                ✦ TẠO HÌNH NỀN CHO BẢN ĐỒ:
              </span>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {uniqueProfiles.map((p) => {
                  const isSelected = p.id === activeProfile?.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveProfileId(p.id)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "16px",
                        background: isSelected ? "#2a2a2b" : "transparent",
                        color: isSelected ? "#fff" : "#2a2a2b",
                        border: "1px solid #2a2a2b",
                        fontSize: "11px",
                        fontFamily: '"Courier New", monospace',
                        cursor: "pointer",
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Numerology Summary Pill */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px", fontSize: "11px", fontFamily: '"Courier New", monospace', color: "#665d5b" }}>
            <span style={{ padding: "4px 10px", background: "rgba(189,164,118,0.2)", borderRadius: "4px" }}>
              Số Đường Đời: <strong>{String(lifePath)}</strong>
            </span>
            <span style={{ padding: "4px 10px", background: "rgba(189,164,118,0.2)", borderRadius: "4px" }}>
              Ngày Cá Nhân Hôm Nay: <strong>{personalDay}</strong>
            </span>
            <span style={{ padding: "4px 10px", background: "rgba(189,164,118,0.2)", borderRadius: "4px" }}>
              Năm {personalYear}
            </span>
          </div>

          <div className="wallpaper-controls">
            {/* Style Selection */}
            <div className="wallpaper-control-group">
              <p className="wallpaper-control-label">PHONG CÁCH NGHỆ THUẬT (STYLE)</p>
              <div className="wallpaper-option-grid">
                {wallpaperStyles.map(([value, label, symbol]) => (
                  <button
                    className={style === value ? "wallpaper-option is-selected" : "wallpaper-option"}
                    type="button"
                    key={value}
                    onClick={() => setStyle(value)}
                  >
                    <span>{symbol}</span>
                    <strong>{label}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Intention Selection */}
            <div className="wallpaper-control-group">
              <p className="wallpaper-control-label">Ý NIỆM THU HÚT (INTENTION)</p>
              <div className="wallpaper-option-grid">
                {wallpaperIntentions.map(([value, label, symbol]) => (
                  <button
                    className={intention === value ? "wallpaper-option is-selected" : "wallpaper-option"}
                    type="button"
                    key={value}
                    onClick={() => setIntention(value)}
                  >
                    <span>{symbol}</span>
                    <strong>{label}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Wish Input */}
            <div className="wallpaper-control-group" style={{ marginTop: "16px" }}>
              <p className="wallpaper-control-label">MONG MUỐN RIÊNG (TÙY CHỌN)</p>
              <input
                type="text"
                value={customWish}
                onChange={(e) => setCustomWish(e.target.value)}
                placeholder="Ví dụ: Ánh hào quang rồng vàng, hoa sen ngọc bích, cổng mặt trời..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid rgba(42,42,43,0.2)",
                  background: "rgba(255,255,255,0.8)",
                  fontFamily: '"Courier New", monospace',
                  fontSize: "12px",
                }}
              />
            </div>

            {/* Device Selector */}
            <div className="wallpaper-device-buttons">
              {[
                ["phone", "▯", "ĐIỆN THOẠI (9:16)"],
                ["laptop", "▱", "MÁY TÍNH (16:9)"],
                ["avatar", "♙", "AVATAR (1:1)"],
              ].map(([value, symbol, label]) => (
                <button
                  className={device === value ? "wallpaper-device is-selected" : "wallpaper-device"}
                  type="button"
                  key={value}
                  onClick={() => setDevice(value)}
                >
                  <span>{symbol}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="wallpaper-actions">
              <button
                className="wallpaper-secondary-button"
                type="button"
                onClick={generateWallpaper}
                disabled={isGenerating}
              >
                {generatedData ? "TÁI TẠO BẢN ĐỒ MỚI" : "TẠO THỬ NGAY"} <span>⤨</span>
              </button>
              <button
                className="wallpaper-primary-button"
                type="button"
                onClick={generatedData ? downloadWallpaper : generateWallpaper}
                disabled={isGenerating}
              >
                {generatedData ? "TẢI ẢNH GỐC HD (PNG)" : "KÍCH HOẠT & TẠO ẢNH 8K"} <span>↓</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preview and Energy Reading Panel */}
        <div className="wallpaper-studio-preview">
          <div className={`wallpaper-preview-device ${device}`}>
            <div className={`wallpaper-preview wallpaper-style-${style} wallpaper-intention-${intention}`}>
              {generatedData?.imageUrl ? (
                <img src={generatedData.imageUrl} alt="Numina Lucky Sacred Wallpaper" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <span className="wallpaper-preview-stars">✦　✧　·　✦</span>
                  <span className="wallpaper-preview-orbit orbit-one" />
                  <span className="wallpaper-preview-orbit orbit-two" />
                  <strong>{String(lifePath).slice(0, 2)}</strong>
                  <span className="wallpaper-preview-glyph">✧</span>
                  <span className="wallpaper-preview-caption">LIFE PATH {String(lifePath)}</span>
                  <span className="wallpaper-preview-moon">☾</span>
                </>
              )}
            </div>
          </div>

          <p className="wallpaper-preview-note">
            {isGenerating
              ? generationPhase === "directing"
                ? "✦ AI ART DIRECTOR ĐANG THIẾT KẾ SIÊU PROMPT PHONG THỦY…"
                : "✦ AI GENERATOR ĐANG VẼ TÁC PHẨM 8K ĐỘC BẢN…"
              : generatedData
              ? `Tác phẩm phong thủy độc bản của ${activeProfile.name}`
              : `Bản xem trước phong cách ${style} · Ý niệm ${intention}`}
          </p>

          {/* Sacred Reading Card below image */}
          {generatedData && (
            <div
              style={{
                marginTop: "20px",
                width: "100%",
                maxWidth: "460px",
                padding: "20px 24px",
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(189,164,118,0.4)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(42,42,43,0.1)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "10px", fontFamily: '"Courier New", monospace', color: "#8a6d3b", fontWeight: "bold" }}>
                  ✦ GIẢI MÃ NĂNG LƯỢNG BẢN ĐỒ THẦN SỐ HỌC
                </span>
                {generatedData.isAIGenerated && (
                  <span style={{ fontSize: "9px", fontFamily: '"Courier New", monospace', padding: "2px 6px", background: "#ebd99e", borderRadius: "4px" }}>
                    AI ART DIRECTED
                  </span>
                )}
              </div>

              <p style={{ fontFamily: "var(--chani-serif)", fontSize: "13px", lineHeight: "1.6", color: "#333", margin: "0 0 14px" }}>
                {generatedData.explanation_vi}
              </p>

              <div style={{ padding: "12px 14px", background: "#fcfaf7", borderLeft: "3px solid #bda476", marginBottom: "14px" }}>
                <span style={{ fontSize: "9px", fontFamily: 'var(--chani-mono)', color: "#888", display: "block", marginBottom: "3px" }}>
                  KHẨU QUYẾT KÍCH HOẠT MỖI NGÀY:
                </span>
                <p style={{ fontFamily: "var(--chani-serif)", fontStyle: "italic", fontSize: "13px", color: "#2a2a2b", margin: 0 }}>
                  "{generatedData.affirmation_vi}"
                </p>
              </div>

              {generatedData.luckyColors_vi?.length > 0 && (
                <div style={{ fontSize: "11px", fontFamily: 'var(--chani-mono)', color: "#666", marginBottom: "8px" }}>
                  <strong>Màu sắc tương hợp:</strong> {generatedData.luckyColors_vi.join(", ")}
                </div>
              )}

              {/* View AI Prompt Toggle */}
              {generatedData.prompt && (
                <div style={{ marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowPromptDetails(!showPromptDetails)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#777",
                      fontSize: "10px",
                      fontFamily: '"Courier New", monospace',
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {showPromptDetails ? "Ẩn chi tiết Prompt AI [-]" : "Xem chi tiết Prompt AI Art Director [+]"}
                  </button>
                  {showPromptDetails && (
                    <div style={{ marginTop: "8px", padding: "10px", background: "#2a2a2b", color: "#ddd", fontSize: "10px", fontFamily: '"Courier New", monospace', lineHeight: "1.4", wordBreak: "break-word" }}>
                      {generatedData.prompt}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Library of Lucky & Danger Wallpapers */}
      <section className="wallpaper-library-section">
        <div className="wallpaper-library-heading">
          <p className="batch-kicker">THE WALLPAPER LIBRARY</p>
          <h2>Lucky or unlucky?</h2>
          <p>
            Những biểu tượng thị giác mang năng lượng thu hút phước lành và những cảnh báo phong thủy dân gian bạn nên lưu tâm.
          </p>
        </div>
        <div className="wallpaper-library-list">
          {wallpaperLibrary.map((item, index) => (
            <article
              className={`wallpaper-library-item ${index % 2 ? "is-reversed" : ""} ${item.kind === "danger" ? "is-danger" : "is-lucky"}`}
              key={item.title}
            >
              <div className="wallpaper-library-image">
                <ChaniImage src={item.image} alt={item.title} />
              </div>
              <div className="wallpaper-library-copy">
                <p className="batch-kicker">
                  {item.kind === "lucky" ? `LUCKY WALLPAPER 0${index + 1}` : `DANGER WALLPAPER 0${index - 6}`}
                </p>
                <h3>{item.title}</h3>
                <h4>{item.subtitle}</h4>
                <p>{item.description}</p>
                {item.kind === "lucky" ? (
                  <a className="wallpaper-library-button lucky" href={item.image} download>
                    DOWNLOAD WALLPAPER ↓
                  </a>
                ) : (
                  <button
                    className="wallpaper-library-button danger"
                    type="button"
                    onClick={() => setChallengeTitle(item.title)}
                  >
                    I’M BRAVE — TRY IT
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Danger Modal */}
      {challengeTitle && (
        <div
          className="wallpaper-challenge-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setChallengeTitle(null);
          }}
        >
          <section className="wallpaper-challenge" role="dialog" aria-modal="true" aria-labelledby="wallpaper-challenge-title">
            <button
              type="button"
              className="wallpaper-challenge-close"
              onClick={() => setChallengeTitle(null)}
              aria-label="Close warning"
            >
              ×
            </button>
            <p className="batch-kicker">DANGER WALLPAPER CHALLENGE</p>
            <h3 id="wallpaper-challenge-title">{challengeTitle}</h3>
            <p>Đây là một câu chuyện dân gian / folklore trên mạng, không phải kết luận khoa học. Bạn vẫn muốn thử hình nền này chứ?</p>
            <button className="wallpaper-library-button danger" type="button" onClick={() => setChallengeTitle(null)}>
              I ACCEPT THE VIBE
            </button>
          </section>
        </div>
      )}
    </Shell>
  );
}

const numerologyCards = [
  ["card_01_walksOfLife.png", "01", "Số Đường Đời"], ["card_02_mission.png", "02", "Số Sứ Mệnh"], ["card_03_soul.png", "03", "Số Linh Hồn"], ["card_04_personality.png", "04", "Số Nhân Cách"], ["card_05_dateOfBirth.png", "05", "Số Ngày Sinh"], ["card_06_mature.png", "06", "Số Trưởng Thành"], ["card_07_balance.png", "07", "Số Cân Bằng"], ["card_08_rationalThinking.png", "08", "Số Tư Duy Lý Trí"], ["card_09_subconsciousPower.png", "09", "Sức Mạnh Tiềm Thức"], ["card_10_passion.png", "10", "Đam Mê Ẩn Giấu"], ["card_11_attitude.png", "11", "Thái Độ Tiếp Cận"], ["card_12_karmicDebts.png", "12", "Con Số Nợ Nghiệp"], ["card_13_missingNumbers.png", "13", "Bài Học Số Thiếu"], ["card_14_bridgeLifeMission.png", "14", "Cầu Nối Đường Đời - Sứ Mệnh"], ["card_15_bridgeSoulPersonality.png", "15", "Cầu Nối Linh Hồn - Nhân Cách"], ["card_16_bridgeMaturityPassion.png", "16", "Cầu Nối Trưởng Thành - Đam Mê"], ["card_17_yearIndividual.png", "17", "Năm Cá Nhân"], ["card_18_monthIndividual.png", "18", "Tháng Cá Nhân"], ["card_19_dayIndividual.png", "19", "Ngày Cá Nhân"], ["card_20_way.png", "20", "4 Đỉnh Cao Cuộc Đời"], ["card_21_challenges.png", "21", "4 Thách Thức Cuộc Đời"], ["card_22_arrows.png", "22", "8 Mũi Tên Cá Tính 3x3"], ["card_23_nameChart.png", "23", "Biểu Đồ Tên & Tần Suất"], ["card_24_birthChart.png", "24", "Biểu Đồ Ngày Sinh 3x3"],
];

function getCompactCardTitle(number: string, title: string) {
  const compactTitles: Record<string, string> = {
    "08": "Tư Duy Lý Trí",
    "09": "Sức Mạnh Tiềm Thức",
    "12": "Nợ Nghiệp",
    "13": "Số Thiếu",
    "14": "Nối Đường Đời – Sứ Mệnh",
    "15": "Nối Linh Hồn – Nhân Cách",
    "16": "Nối Trưởng Thành – Đam Mê",
    "20": "4 Đỉnh Cao",
    "21": "4 Thách Thức",
    "22": "Mũi Tên Cá Tính",
    "23": "Biểu Đồ Tên",
    "24": "Biểu Đồ Ngày Sinh",
  };
  return compactTitles[number] || title;
}

function getCompactCardValue(indicatorKey: string | undefined, value: string) {
  if (indicatorKey === "arrows") {
    return value
      .split("; ")
      .map((arrow) => {
        const [label, status] = arrow.split(":");
        const numbers = label?.match(/\([^)]*\)/)?.[0] || label;
        return `${numbers || "—"} ${status?.startsWith("Có") ? "✓" : "·"}`;
      })
      .join("  ");
  }
  if (indicatorKey === "nameChart") return value.replace("Tổng số ký tự:", "Ký tự:");
  if (indicatorKey === "birthChart") return value.replace("Tổng chữ số ngày sinh:", "Chữ số:");
  return value;
}

const INDICATOR_READING_CACHE_KEY = "pyra-indicator-readings-v1";
const INDICATOR_READING_CACHE_LIMIT = 100;
const NUMEROLOGY_REVEAL_DURATION_MS = 2400;

type CachedIndicatorReading = {
  analysis: string;
  savedAt: string;
};

function getIndicatorReadingCacheKey(fullName: string, birthDate: string, indicatorKey: string, value: string | number) {
  return [fullName.trim().toLocaleLowerCase(), birthDate, indicatorKey, String(value)].join("::");
}

function getCachedIndicatorReading(cacheKey: string): CachedIndicatorReading | null {
  if (typeof window === "undefined") return null;
  try {
    const cache = JSON.parse(window.localStorage.getItem(INDICATOR_READING_CACHE_KEY) || "{}");
    const entry = cache?.[cacheKey];
    return entry?.analysis ? entry : null;
  } catch {
    return null;
  }
}

function hasCachedIndicatorReading(cacheKey: string) {
  return Boolean(getCachedIndicatorReading(cacheKey));
}

function saveCachedIndicatorReading(cacheKey: string, analysis: string) {
  if (typeof window === "undefined" || !analysis.trim()) return;
  try {
    const cache = JSON.parse(window.localStorage.getItem(INDICATOR_READING_CACHE_KEY) || "{}");
    cache[cacheKey] = { analysis, savedAt: new Date().toISOString() } satisfies CachedIndicatorReading;
    const trimmedCache = Object.fromEntries(
      Object.entries(cache)
        .sort(([, left], [, right]) =>
          String((right as CachedIndicatorReading).savedAt).localeCompare(String((left as CachedIndicatorReading).savedAt))
        )
        .slice(0, INDICATOR_READING_CACHE_LIMIT)
    );
    window.localStorage.setItem(INDICATOR_READING_CACHE_KEY, JSON.stringify(trimmedCache));
  } catch {
    // A full/blocked localStorage must not stop the AI reading flow.
  }
}

function NumerologyProfileForm({ onSubmit }: { onSubmit: (name: string, birthDate: string) => void }) {
  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    onSubmit(name, birthDate);
    setSubmitted(true);
  };

  return <form className="numerology-profile-form" onSubmit={submit}>
    <p className="batch-kicker">BEGIN YOUR PERSONAL MAP</p>
    <h2>Enter your details</h2>
    <p>We’ll use your name and birth date to reveal the 24 numbers shaping your personal pattern.</p>
    <label>Full name<input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></label>
    <fieldset>
      <legend>Date of birth</legend>
      <div className="numerology-date-fields">
        <label>Day<input type="number" min="1" max="31" value={day} onChange={(event) => setDay(event.target.value)} placeholder="DD" required /></label>
        <label>Month<input type="number" min="1" max="12" value={month} onChange={(event) => setMonth(event.target.value)} placeholder="MM" required /></label>
        <label>Year<input type="number" min="1900" max="2100" value={year} onChange={(event) => setYear(event.target.value)} placeholder="YYYY" required /></label>
      </div>
    </fieldset>
    <button type="submit">{submitted ? "24 INDICATORS READY" : "REVEAL MY 24 INDICATORS"}</button>
    {submitted && <p className="numerology-form-message">Your personal map is ready. Select an indicator below for an AI interpretation.</p>}
  </form>;
}

export function OurTeamPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profiles, saveProfile } = useProfiles();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selected, setSelected] = useState<{ title: string; name: string; value: string; key?: string } | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [readingSource, setReadingSource] = useState<"ai" | "local">("ai");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<"idle" | "retrieving" | "generating" | "complete" | "error">("idle");
  const [assessmentPrompt, setAssessmentPrompt] = useState<{ name: string; birthDate: string; identityKey: string } | null>(null);
  const [revealPhase, setRevealPhase] = useState<"hidden" | "revealing" | "revealed">("hidden");
  const [butterflyAnim, setButterflyAnim] = useState<{
    stage: "crumpling" | "flying" | "converging" | "exploding";
    cardIndex: number;
    title: string;
    cardRect: { top: number; left: number; width: number; height: number };
    catchPos?: { x: number; y: number };
  } | null>(null);
  const [butterflyPos, setButterflyPos] = useState<{ x: number; y: number; facing: number; tilt: number }>({
    x: 0,
    y: 0,
    facing: 1,
    tilt: 0,
  });
  const numerologySectionRef = useRef<HTMLElement | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const { profile: personalityProfile, skipAssessment } = usePersonalityProfile(
    fullName && birthDate ? { name: fullName, birthDate } : undefined
  );
  const indicators = useProcessNumerology(fullName, birthDate);

  const localePrefix = pathname.match(/^\/(en|vi)(?=\/|$)/)?.[0] || "";
  const requestedIdentityKey = searchParams.get("identityKey") || "";
  const shouldAnimateReturn = searchParams.get("reveal") === "1";

  useEffect(() => {
    if (!butterflyAnim || butterflyAnim.stage !== "flying") return;

    let animationFrameId: number;
    let currentX = butterflyAnim.cardRect.left + butterflyAnim.cardRect.width / 2;
    let currentY = butterflyAnim.cardRect.top + butterflyAnim.cardRect.height / 2;
    let targetX = Math.random() * (window.innerWidth - 220) + 110;
    let targetY = Math.random() * (window.innerHeight - 220) + 110;
    let lastTargetTime = Date.now();
    let startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      if (now - lastTargetTime > 1600) {
        targetX = Math.random() * (window.innerWidth - 220) + 110;
        targetY = Math.random() * (window.innerHeight - 220) + 110;
        lastTargetTime = now;
      }

      const dx = targetX - currentX;
      const dy = targetY - currentY;
      currentX += dx * 0.048 + Math.sin(elapsed * 4.2) * 2.8;
      currentY += dy * 0.048 + Math.cos(elapsed * 3.6) * 3.2;

      // Facing: original sprite head is on the top-left.
      // When moving right (dx > 0), flip horizontally (-1) so head leads right.
      // When moving left (dx < 0), keep natural (1).
      const facing = dx >= 0 ? -1 : 1;
      const climbFactor = Math.max(-1, Math.min(1, dy / (Math.abs(dx) + 20)));
      const tilt = climbFactor * (facing === -1 ? -16 : 16) + Math.sin(elapsed * 6) * 4;

      setButterflyPos({ x: currentX, y: currentY, facing, tilt });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [butterflyAnim?.stage]);

  const startReveal = (name: string, date: string) => {
    setFullName(name);
    setBirthDate(date);
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    setRevealPhase("revealing");
    window.requestAnimationFrame(() => {
      numerologySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    revealTimerRef.current = window.setTimeout(() => {
      setRevealPhase("revealed");
    }, NUMEROLOGY_REVEAL_DURATION_MS);
  };

  useEffect(() => {
    // Restore the profile that started the assessment, not merely the newest
    // profile, so multiple names/dates never share one personality vector.
    const profile = requestedIdentityKey
      ? profiles.find((item) => getPersonalityIdentityKey(item.name, item.birthDate) === requestedIdentityKey)
      : profiles[0];
    if (profile && !fullName && !birthDate) {
      setFullName(profile.name);
      setBirthDate(profile.birthDate);
      const assessment = getStoredPersonalityAssessment(
        getPersonalityIdentityKey(profile.name, profile.birthDate)
      );
      if (assessment) {
        if (shouldAnimateReturn) {
          startReveal(profile.name, profile.birthDate);
          router.replace(`${localePrefix}/indicators`);
        } else {
          setRevealPhase("revealed");
        }
      }
    }
  }, [birthDate, fullName, localePrefix, profiles, requestedIdentityKey, router, shouldAnimateReturn]);

  useEffect(() => () => {
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
  }, []);

  const reveal = (name: string, date: string) => {
    const trimmedName = name.trim();
    const identityKey = getPersonalityIdentityKey(trimmedName, date);
    setFullName(trimmedName);
    setBirthDate(date);
    saveProfile(trimmedName, date);

    if (!getStoredPersonalityAssessment(identityKey)) {
      setRevealPhase("hidden");
      setAssessmentPrompt({ name: trimmedName, birthDate: date, identityKey });
      return;
    }

    startReveal(trimmedName, date);
  };

  const continueAssessment = () => {
    if (!assessmentPrompt) return;
    router.push(`${localePrefix}/assessment?returnTo=indicators&identityKey=${encodeURIComponent(assessmentPrompt.identityKey)}`);
    setAssessmentPrompt(null);
  };

  const skipAssessmentForIdentity = () => {
    if (!assessmentPrompt) return;
    skipAssessment(assessmentPrompt.identityKey, {
      name: assessmentPrompt.name,
      birthDate: assessmentPrompt.birthDate
    });
    const { name, birthDate } = assessmentPrompt;
    setAssessmentPrompt(null);
    startReveal(name, birthDate);
  };

  const readIndicator = async (index: number, title: string, element?: HTMLElement) => {
    if (revealPhase !== "revealed" || butterflyAnim) return;
    const indicator = indicators[index];
    if (!indicator) return;
    const indicatorValue = String(indicator.value);
    const cacheKey = getIndicatorReadingCacheKey(fullName, birthDate, indicator.key, indicatorValue);
    const cachedReading = getCachedIndicatorReading(cacheKey);

    // If reading is already cached locally -> open modal immediately without animation
    if (cachedReading) {
      setSelected({ title, name: indicator.name, value: indicatorValue, key: indicator.key });
      setReadingSource("local");
      setAnalysis(cachedReading.analysis);
      setAnalysisStage("complete");
      setIsLoading(false);
      return;
    }

    // 1. Immediately launch Card Crumple animation layer -> Butterfly flight for unread cards
    if (element) {
      const rect = element.getBoundingClientRect();
      setButterflyAnim({
        stage: "crumpling",
        cardIndex: index,
        title,
        cardRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      });
    }

    // 2. Immediately trigger async API reading in the background
    setReadingSource("ai");
    setIsLoading(true);
    setAnalysisStage("retrieving");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      setAnalysisStage("generating");
      const response = await fetch("/api/numerology/lazy-indicator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, birthDay: birthDate, indicatorKey: indicator.key, indicatorName: indicator.name, indicatorValue: indicator.value, personalityProfile }) });
      if (!response.ok || !response.body) throw new Error("Unable to read this indicator right now.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try { const event = JSON.parse(payload); if (event.content) { text += event.content; setAnalysis(text); } } catch { /* wait for the next complete SSE event */ }
        }
      }
      if (text.trim() && !text.trimStart().startsWith("⚠️")) {
        saveCachedIndicatorReading(cacheKey, text);
      }
      setAnalysisStage("complete");
    } catch (error) {
      setAnalysisStage("error");
      setAnalysis(error instanceof Error ? error.message : "Unable to load the AI interpretation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCatchButterfly = () => {
    if (!butterflyAnim || butterflyAnim.stage !== "flying") return;
    const { cardIndex, title } = butterflyAnim;
    const indicator = indicators[cardIndex];
    if (!indicator) return;

    const currentCatchPos = { x: butterflyPos.x, y: butterflyPos.y };
    setButterflyAnim((prev) => (prev ? { ...prev, stage: "converging", catchPos: currentCatchPos } : null));

    // 1. Orb glides smoothly from catch position to screen center (620ms)
    window.setTimeout(() => {
      setButterflyAnim((prev) => (prev ? { ...prev, stage: "exploding" } : null));

      // 2. Huge center explosion erupts at center (680ms), then reveal reading modal
      window.setTimeout(() => {
        setButterflyAnim(null);
        setSelected({ title, name: indicator.name, value: String(indicator.value), key: indicator.key });
      }, 680);
    }, 620);
  };

  return <Shell>
    <section className="batch-simple-hero batch-team-hero numerology-profile-hero">
      <div className="numerology-profile-intro"><p className="batch-kicker">YOUR NUMEROLOGY DASHBOARD</p><h1>Know your numbers.</h1><p>Your name and birth date hold a personal pattern. Start here to discover the 24 indicators that shape your energy, choices, and timing.</p></div>
      <NumerologyProfileForm onSubmit={reveal} />
    </section>
    <section ref={numerologySectionRef} className={`batch-section batch-team-section numerology-card-section numerology-reveal-${revealPhase}`} aria-busy={revealPhase === "revealing"}>
      <div className="numerology-indicators-heading">
        <p className="batch-kicker batch-center">YOUR 24 INDICATORS</p>
        <h2>24 chỉ số thần số học của {(fullName.trim() || "bạn").normalize("NFC")}</h2>
        <p>Bộ chỉ số được tính riêng từ họ tên và ngày sinh của bạn.</p>
      </div>
      {revealPhase !== "revealed" && <p className="numerology-reveal-status" aria-live="polite">{revealPhase === "hidden" ? "ENTER YOUR DETAILS TO UNLOCK YOUR PERSONAL MAP" : "YOUR PERSONAL MAP IS AWAKENING…"}</p>}
      <div className="numerology-energy-wave" aria-hidden="true" />
      <div className="batch-team-grid numerology-card-grid">
        {numerologyCards.map(([image, number, title], index) => {
          const indicator = indicators[index];
          const value = indicator ? String(indicator.value) : "—";
          const displayTitle = getCompactCardTitle(number, title);
          const displayValue = getCompactCardValue(indicator?.key, value);
          const isNumeric = /^\d+$/.test(value);
          const isReading = selected?.title === displayTitle && isLoading;
          const isCrumpled = butterflyAnim?.cardIndex === index;
          const isInteractive = Boolean(indicator) && revealPhase === "revealed" && !butterflyAnim;
          const cacheKey = indicator ? getIndicatorReadingCacheKey(fullName, birthDate, indicator.key, value) : "";
          const hasSavedReading = Boolean(indicator && hasCachedIndicatorReading(cacheKey));
          return <article className={`batch-team-card numerology-card ${isReading ? "is-reading" : ""}`} key={image} style={{ "--card-delay": `${Math.min(index, 23) * 55}ms`, opacity: isCrumpled ? 0 : 1, transition: "opacity 0.2s ease" } as CSSProperties} role={isInteractive ? "button" : undefined} tabIndex={isInteractive ? 0 : undefined} aria-busy={isReading} onClick={(event) => isInteractive && readIndicator(index, displayTitle, event.currentTarget)} onKeyDown={(event) => { if (isInteractive && (event.key === "Enter" || event.key === " ")) readIndicator(index, displayTitle, event.currentTarget as HTMLElement); }}>
            <div className="numerology-card-inner">
              <div className="numerology-card-face numerology-card-back" aria-hidden={revealPhase === "revealed"}>
                <span className="numerology-card-back-badge">#{number}</span>
              </div>
              <div className="numerology-card-face numerology-card-front" aria-hidden={revealPhase !== "revealed"}>
                <ChaniImage src={`/images/card/${image}`} alt={displayTitle} /><p className="numerology-card-number">{number} / 24</p><strong className={`numerology-card-value ${isNumeric ? "" : "is-text"}`} title={value}>{displayValue}</strong><h3 title={title}>{displayTitle}</h3><span>{isReading ? "READING…" : hasSavedReading ? "VIEW SAVED READING" : indicator ? "CLICK FOR AI READING" : "ENTER DETAILS TO REVEAL"}</span>
              </div>
            </div>
          </article>;
        })}
      </div>
      <p className="numerology-disclaimer">Don’t be sad if your number looks a little unlucky :)) Even calculators can be wrong too.</p>
    </section>

    {/* Card Crumple Animation Layer */}
    {butterflyAnim?.stage === "crumpling" && (
      <div
        className="card-crumple-layer"
        style={{
          top: butterflyAnim.cardRect.top,
          left: butterflyAnim.cardRect.left,
          width: butterflyAnim.cardRect.width,
          height: butterflyAnim.cardRect.height,
        }}
      >
        <video
          src="/animation/start.webm"
          autoPlay
          muted
          playsInline
          onEnded={() => setButterflyAnim((prev) => (prev ? { ...prev, stage: "flying" } : null))}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    )}

    {/* Flying Butterfly & Energy Convergence & Center Explosion Backdrop */}
    {butterflyAnim && butterflyAnim.stage !== "crumpling" && (
      <div className="butterfly-flight-backdrop">
        {/* Stage 1: Flying Butterfly */}
        {butterflyAnim.stage === "flying" && (
          <>
            <div
              className="butterfly-flyer"
              style={{
                left: butterflyPos.x,
                top: butterflyPos.y,
                transform: "translate(-50%, -50%)",
              }}
              onClick={handleCatchButterfly}
              role="button"
              tabIndex={0}
              aria-label="Catch the butterfly to reveal your reading"
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCatchButterfly(); }}
            >
              <div
                className="butterfly-sprite-container"
                style={{
                  transform: `scaleX(${butterflyPos.facing}) rotate(${butterflyPos.tilt}deg)`,
                  transition: "transform 0.1s linear",
                }}
              >
                <video
                  src="/animation/excute.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="butterfly-video-sprite"
                />
                <div className="butterfly-aura" />
              </div>
              <span className="butterfly-tap-label">✦ CHẠM ĐỂ BẮT ✦</span>
            </div>
            <div className="butterfly-guidance-pill">
              <p>✦ Bướm tinh linh đang mang thông điệp vũ trụ — Hãy chạm vào cánh bướm để mở lời giải!</p>
              <button type="button" onClick={handleCatchButterfly}>Bỏ qua & Xem ngay →</button>
            </div>
          </>
        )}

        {/* Stage 2: Glowing Purple Orb Gliding from Catch Position to Center */}
        {butterflyAnim.stage === "converging" && (
          <div
            className="purple-converge-orb"
            style={{
              "--start-x": `${butterflyAnim.catchPos?.x || butterflyPos.x}px`,
              "--start-y": `${butterflyAnim.catchPos?.y || butterflyPos.y}px`,
            } as React.CSSProperties}
            aria-hidden="true"
          />
        )}

        {/* Stage 3: Center Jackpot Explosion */}
        {butterflyAnim.stage === "exploding" && (
          <div className="purple-center-explosion" aria-hidden="true">
            <div className="jackpot-ring jackpot-ring-1" />
            <div className="jackpot-ring jackpot-ring-2" />
            <div className="jackpot-ring jackpot-ring-3" />
            <div className="jackpot-core-flare" />
            <div className="jackpot-starbeams" />

            {Array.from({ length: 20 }).map((_, i) => {
              const angle = (i * 360) / 20;
              const dist = 95 + (i % 3) * 50;
              const delay = (i % 4) * 0.025;
              const size = 14 + (i % 3) * 6;
              const isStar = i % 2 === 0;
              return (
                <span
                  key={i}
                  className={`jackpot-sparkle ${isStar ? "is-star" : "is-diamond"}`}
                  style={{
                    "--burst-angle": `${angle}deg`,
                    "--burst-dist": `${dist}px`,
                    "--burst-delay": `${delay}s`,
                    "--burst-size": `${size}px`,
                  } as React.CSSProperties}
                >
                  {isStar ? "✦" : "◆"}
                </span>
              );
            })}

            <div className="jackpot-banner-flash">
              <span>✦ THÔNG ĐIỆP ĐÃ MỞ ✦</span>
            </div>
          </div>
        )}
      </div>
    )}

    {assessmentPrompt && <div className="indicator-assessment-backdrop" role="presentation"><section className="indicator-assessment-modal" role="dialog" aria-modal="true" aria-labelledby="indicator-assessment-title"><div className="indicator-assessment-symbol" aria-hidden="true">✦</div><p className="batch-kicker">NUMINA / PERSONALITY MAP</p><h2 id="indicator-assessment-title">Make your map more personal.</h2><p>Muốn lời luận giải sát với cách bạn suy nghĩ và cảm nhận hơn? Hãy hoàn thành bài trắc nghiệm 20 câu để tạo bộ vector tính cách riêng cho hồ sơ này.</p><p className="indicator-assessment-meta">20 CÂU HỎI · KHOẢNG 2–3 PHÚT · KHÔNG CÓ ĐÚNG HAY SAI</p><div className="indicator-assessment-actions"><button type="button" className="indicator-assessment-secondary" onClick={skipAssessmentForIdentity}>BỎ QUA LẦN NÀY</button><button type="button" className="indicator-assessment-primary" onClick={continueAssessment}>LÀM BÀI TEST <span>→</span></button></div></section></div>}
    {selected && (() => {
      const illustrationSrc = getNumerologyImagePath(selected.key, selected.value, selected.title);
      return (
        <div className="indicator-ai-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isLoading) setSelected(null); }}>
          <section className={`indicator-ai-modal indicator-ai-modal-split ${isLoading ? "is-loading" : "is-ready"}`} role="dialog" aria-modal="true" aria-labelledby="indicator-ai-title">
            <div className="indicator-ai-orbit" aria-hidden="true" />
            <button type="button" className="indicator-ai-close" onClick={() => setSelected(null)} aria-label="Close interpretation">×</button>
            
            {/* Left Column: Heading, Metadata, Status, and Detailed Interpretation */}
            <div className="indicator-ai-left-col">
              <p className="batch-kicker">NUMINA AI / PERSONAL INDICATOR</p>
              <h2 id="indicator-ai-title">{selected.title}</h2>
              <p className="indicator-ai-value">{selected.name} · {selected.value}</p>
              <p className={`indicator-ai-source ${readingSource === "local" ? "is-local" : ""}`}>
                {readingSource === "local" ? "SAVED ON THIS DEVICE · INSTANT READING" : "GENERATED FOR YOUR PERSONAL MAP"}
              </p>

              {isLoading && (
                <div className="indicator-ai-progress" aria-live="polite">
                  <div className="indicator-ai-progress-line">
                    <span className={analysisStage === "retrieving" || analysisStage === "generating" || analysisStage === "complete" ? "is-active" : ""} />
                    <span className={analysisStage === "generating" || analysisStage === "complete" ? "is-active" : ""} />
                    <span className={analysisStage === "complete" ? "is-active" : ""} />
                  </div>
                  <div className="indicator-ai-status">
                    <span>{analysisStage === "retrieving" ? "ĐANG TRA CỨU TƯ LIỆU" : "ĐÃ TRA CỨU"}</span>
                    <span>{analysisStage === "generating" ? "ĐANG LUẬN GIẢI" : analysisStage === "complete" ? "ĐÃ LUẬN GIẢI" : "CHỜ LUẬN GIẢI"}</span>
                    <span>NUMINA AI</span>
                  </div>
                </div>
              )}

              <div className="indicator-ai-content">
                {isLoading && !analysis ? (
                  <div className="indicator-ai-loading-text">
                    <span className="indicator-ai-spinner">✦</span>
                    <p>Numina đang kết nối trường năng lượng và tra cứu tư liệu cho chỉ số <strong>{selected.title} {selected.value}</strong>…</p>
                  </div>
                ) : analysis ? (
                  <ReactMarkdown
                    components={{
                      strong: ({ node, ...props }) => <strong className="indicator-highlight-bold" {...props} />,
                      b: ({ node, ...props }) => <b className="indicator-highlight-bold" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="indicator-section-h3" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="indicator-section-h4" {...props} />,
                      li: ({ node, ...props }) => <li className="indicator-bullet-item" {...props} />,
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                ) : (
                  <p>No interpretation available.</p>
                )}
              </div>

              <div className="indicator-ai-actions">
                {analysisStage === "error" && (
                  <button type="button" className="indicator-ai-retry" onClick={() => { const index = indicators.findIndex((item) => item.name === selected.name); if (index >= 0) readIndicator(index, selected.title); }}>THỬ LẠI ↻</button>
                )}
                {!isLoading && <button type="button" className="indicator-ai-done" onClick={() => setSelected(null)}>ĐÓNG LỜI GIẢI</button>}
              </div>
            </div>

            {/* Right Column: Sacred Energy Artwork Poster Card (Matching Layout from Image 2) */}
            <div className="indicator-ai-right-col">
              <div className="indicator-ai-poster-card">
                <p className="batch-kicker indicator-ai-poster-kicker">SACRED ENERGY SYMBOL</p>
                {illustrationSrc ? (
                  <div className="indicator-ai-poster-media">
                    <img src={illustrationSrc} alt={selected.title} className="indicator-ai-poster-img" />
                    <div className="indicator-ai-poster-glow" />
                  </div>
                ) : (
                  <div className="indicator-ai-poster-fallback">
                    <span>✦</span>
                    <strong>{selected.value}</strong>
                  </div>
                )}
                <div className="indicator-ai-poster-meta">
                  <strong>{selected.title}</strong>
                  <span>CON SỐ BIỂU TRƯNG: {selected.value}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      );
    })()}
  </Shell>;
}
