"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useLocale } from "next-intl";
import PyraHeader from "../shared/PyraHeader";
import { usePersonalityProfile } from "@/hooks/usePersonalityProfile";

type TraitKey = "extraversion" | "agreeableness" | "conscientiousness" | "emotionality" | "openness";
type View = "intro" | "quiz" | "result";

type Question = {
  id: number;
  trait: TraitKey;
  text: string;
  reverse: boolean;
};

const QUESTIONS: Question[] = [
  { id: 1, trait: "extraversion", text: "Tôi là người sôi nổi trong các buổi tiệc.", reverse: false },
  { id: 2, trait: "extraversion", text: "Tôi trò chuyện với rất nhiều người khác nhau trong các buổi tiệc.", reverse: false },
  { id: 3, trait: "extraversion", text: "Tôi không nói chuyện nhiều.", reverse: true },
  { id: 4, trait: "extraversion", text: "Tôi thường giữ mình ở phía sau, không chủ động nổi bật.", reverse: true },
  { id: 5, trait: "agreeableness", text: "Tôi đồng cảm với cảm xúc của người khác.", reverse: false },
  { id: 6, trait: "agreeableness", text: "Tôi dễ cảm nhận cảm xúc của người khác.", reverse: false },
  { id: 7, trait: "agreeableness", text: "Tôi không thực sự quan tâm đến người khác.", reverse: true },
  { id: 8, trait: "agreeableness", text: "Tôi không quan tâm đến vấn đề của người khác.", reverse: true },
  { id: 9, trait: "conscientiousness", text: "Tôi hoàn thành việc cần làm ngay lập tức.", reverse: false },
  { id: 10, trait: "conscientiousness", text: "Tôi thích sự ngăn nắp, trật tự.", reverse: false },
  { id: 11, trait: "conscientiousness", text: "Tôi thường quên cất đồ vật về đúng chỗ.", reverse: true },
  { id: 12, trait: "conscientiousness", text: "Tôi thường làm mọi thứ trở nên bừa bộn.", reverse: true },
  { id: 13, trait: "emotionality", text: "Tâm trạng của tôi thường thay đổi thất thường.", reverse: false },
  { id: 14, trait: "emotionality", text: "Tôi dễ bị kích động hoặc buồn bực.", reverse: false },
  { id: 15, trait: "emotionality", text: "Hầu hết thời gian tôi cảm thấy thư giãn.", reverse: true },
  { id: 16, trait: "emotionality", text: "Tôi hiếm khi cảm thấy buồn chán hoặc suy sụp.", reverse: true },
  { id: 17, trait: "openness", text: "Tôi có trí tưởng tượng phong phú.", reverse: false },
  { id: 18, trait: "openness", text: "Tôi gặp khó khăn khi hiểu các ý tưởng trừu tượng.", reverse: true },
  { id: 19, trait: "openness", text: "Tôi không hứng thú với những ý tưởng trừu tượng.", reverse: true },
  { id: 20, trait: "openness", text: "Tôi không có trí tưởng tượng tốt.", reverse: true },
];

const QUESTIONS_EN: Question[] = [
  { id: 1, trait: "extraversion", text: "I am lively at parties.", reverse: false },
  { id: 2, trait: "extraversion", text: "I talk to many different people at parties.", reverse: false },
  { id: 3, trait: "extraversion", text: "I do not talk a lot.", reverse: true },
  { id: 4, trait: "extraversion", text: "I tend to stay in the background rather than stand out.", reverse: true },
  { id: 5, trait: "agreeableness", text: "I empathize with other people's feelings.", reverse: false },
  { id: 6, trait: "agreeableness", text: "I easily sense other people's emotions.", reverse: false },
  { id: 7, trait: "agreeableness", text: "I do not really care about other people.", reverse: true },
  { id: 8, trait: "agreeableness", text: "I do not care about other people's problems.", reverse: true },
  { id: 9, trait: "conscientiousness", text: "I complete tasks as soon as they need to be done.", reverse: false },
  { id: 10, trait: "conscientiousness", text: "I like things to be neat and organized.", reverse: false },
  { id: 11, trait: "conscientiousness", text: "I often forget to put things back where they belong.", reverse: true },
  { id: 12, trait: "conscientiousness", text: "I often make everything messy.", reverse: true },
  { id: 13, trait: "emotionality", text: "My mood often changes unpredictably.", reverse: false },
  { id: 14, trait: "emotionality", text: "I am easily upset or irritated.", reverse: false },
  { id: 15, trait: "emotionality", text: "I feel relaxed most of the time.", reverse: true },
  { id: 16, trait: "emotionality", text: "I rarely feel sad or discouraged.", reverse: true },
  { id: 17, trait: "openness", text: "I have a vivid imagination.", reverse: false },
  { id: 18, trait: "openness", text: "I find abstract ideas difficult to understand.", reverse: true },
  { id: 19, trait: "openness", text: "I am not interested in abstract ideas.", reverse: true },
  { id: 20, trait: "openness", text: "I do not have a good imagination.", reverse: true },
];

const TRAIT_META: Record<TraitKey, { label: string; detail: string; symbol: string; color: string }> = {
  extraversion: { label: "Hướng Ngoại", detail: "Năng lượng xã hội và cách bạn bước vào thế giới.", symbol: "☼", color: "gold" },
  agreeableness: { label: "Dễ Chịu", detail: "Thấu cảm, tử tế và khả năng kết nối với người khác.", symbol: "♡", color: "rose" },
  conscientiousness: { label: "Tận Tâm", detail: "Kỷ luật, sự ngăn nắp và cách bạn hoàn thành điều đã chọn.", symbol: "⌂", color: "sage" },
  emotionality: { label: "Nhạy Cảm", detail: "Chiều sâu cảm xúc và cách bạn xử lý những dao động bên trong.", symbol: "☾", color: "lilac" },
  openness: { label: "Cởi Mở", detail: "Trí tưởng tượng, tò mò và khả năng đón nhận điều mới.", symbol: "✦", color: "blue" },
};

const TRAIT_META_EN: Record<TraitKey, { label: string; detail: string; symbol: string; color: string }> = {
  extraversion: { label: "Extraversion", detail: "Your social energy and the way you step into the world.", symbol: "☼", color: "gold" },
  agreeableness: { label: "Agreeableness", detail: "Empathy, kindness, and your ability to connect with others.", symbol: "♡", color: "rose" },
  conscientiousness: { label: "Conscientiousness", detail: "Discipline, organization, and how you complete what you choose.", symbol: "⌂", color: "sage" },
  emotionality: { label: "Emotionality", detail: "Your emotional depth and the way you process inner changes.", symbol: "☾", color: "lilac" },
  openness: { label: "Openness", detail: "Imagination, curiosity, and your capacity to welcome the new.", symbol: "✦", color: "blue" },
};

const SCALE = ["Hoàn toàn không đúng", "Khá không đúng", "Phân vân / Trung lập", "Khá đúng", "Hoàn toàn đúng"];
const SCALE_EN = ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"];
const INITIAL_ANSWERS = QUESTIONS.map(() => null as number | null);

function calculateResults(answers: Array<number | null>) {
  const totals = (Object.keys(TRAIT_META) as TraitKey[]).reduce<Record<TraitKey, { sum: number; count: number }>>((result, trait) => {
    result[trait] = { sum: 0, count: 0 };
    return result;
  }, {} as Record<TraitKey, { sum: number; count: number }>);

  QUESTIONS.forEach((question, index) => {
    const answer = answers[index];
    if (answer === null) return;
    totals[question.trait].sum += question.reverse ? 6 - answer : answer;
    totals[question.trait].count += 1;
  });

  return (Object.keys(TRAIT_META) as TraitKey[]).map((trait) => {
    const score = totals[trait].count ? totals[trait].sum / totals[trait].count : 0;
    return { trait, score, percent: Math.round(((score - 1) / 4) * 100), ...TRAIT_META[trait] };
  });
}

export default function ChaniAppPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { saveAnswers } = usePersonalityProfile();
  const isVietnamese = useLocale() === "vi";
  const localizedMeta = isVietnamese ? TRAIT_META : TRAIT_META_EN;
  const assessmentIdentityKey = searchParams.get("identityKey") || undefined;
  const [view, setView] = useState<View>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(INITIAL_ANSWERS);
  const results = calculateResults(answers);
  const currentQuestion = QUESTIONS[current];
  const localizedQuestion = (isVietnamese ? QUESTIONS : QUESTIONS_EN)[current];
  const currentAnswer = answers[current];
  const strongest = results.reduce((best, result) => result.score > best.score ? result : best, results[0]);

  const startAssessment = () => {
    setAnswers(INITIAL_ANSWERS);
    setCurrent(0);
    setView("quiz");
  };

  const selectAnswer = (value: number) => {
    setAnswers((existing) => existing.map((answer, index) => index === current ? value : answer));
  };

  const goNext = () => {
    if (currentAnswer === null) return;
    if (current === QUESTIONS.length - 1) {
      const answerMap = answers.reduce<Record<number, number>>((result, answer, index) => {
        if (answer !== null) result[QUESTIONS[index].id] = answer;
        return result;
      }, {});
      saveAnswers(answerMap, assessmentIdentityKey);
      setView("result");
      if (searchParams.get("returnTo") === "indicators") {
        const localePrefix = pathname.match(/^\/(en|vi)(?=\/|$)/)?.[0] || "";
        const identityQuery = assessmentIdentityKey ? `?identityKey=${encodeURIComponent(assessmentIdentityKey)}&reveal=1` : "?reveal=1";
        router.replace(`${localePrefix}/indicators${identityQuery}`);
      }
      return;
    }
    setCurrent((value) => value + 1);
  };

  return <main className="chani-site pyra-assessment-page">
    <PyraHeader />
    <div className="assessment-ambient assessment-ambient-one" /><div className="assessment-ambient assessment-ambient-two" />
    <main className="assessment-shell">
      {view === "intro" && <section className="assessment-intro assessment-glass">
        <div className="assessment-seal">✦</div>
        <p className="assessment-kicker">NUMINA / {isVietnamese ? "BẢN ĐỒ TÍNH CÁCH" : "PERSONALITY MAP"}</p>
        <h1>{isVietnamese ? <>Thấu hiểu bản thể<br /><em>5 chiều không gian tâm hồn</em></> : <>Understand your inner world<br /><em>through five dimensions</em></>}</h1>
        <p className="assessment-lead">{isVietnamese ? "Một bài trắc nghiệm Mini-IPIP gồm 20 câu hỏi để soi chiếu 5 trục tính cách: cách bạn kết nối, chăm sóc, hành động, cảm nhận và tưởng tượng." : "A 20-question Mini-IPIP assessment reflecting five personality dimensions: how you connect, care, act, feel, and imagine."}</p>
        <div className="assessment-trait-preview">{(Object.keys(TRAIT_META) as TraitKey[]).map((trait, index) => <article className={`assessment-trait-chip ${localizedMeta[trait].color}`} key={trait}><span>{String(index + 1).padStart(2, "0")}</span><strong>{localizedMeta[trait].label}</strong><small>{localizedMeta[trait].detail}</small></article>)}</div>
        <button className="assessment-primary-button" type="button" onClick={startAssessment}>{isVietnamese ? "BẮT ĐẦU KHẢO SÁT" : "START ASSESSMENT"} <span>✦</span></button>
        <p className="assessment-note">{isVietnamese ? "20 câu hỏi · khoảng 2–3 phút · không có câu trả lời đúng hay sai" : "20 questions · about 2–3 minutes · there are no right or wrong answers"}</p>
      </section>}

      {view === "quiz" && <section className="assessment-quiz assessment-glass">
        <div className="assessment-progress-head"><span className={`assessment-badge ${currentQuestion.trait}`}>{localizedMeta[currentQuestion.trait].symbol} {localizedMeta[currentQuestion.trait].label}</span><span>{isVietnamese ? "CÂU" : "QUESTION"} {current + 1} / {QUESTIONS.length}</span></div>
        <div className="assessment-progress-track"><span style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }} /></div>
        <div className="assessment-question-mark">{localizedMeta[currentQuestion.trait].symbol}</div>
        <p className="assessment-question-number">{isVietnamese ? "CÂU HỎI" : "QUESTION"} {String(currentQuestion.id).padStart(2, "0")}</p>
        <h2 className="assessment-question">{localizedQuestion.text}</h2>
        <div className="assessment-scale">{(isVietnamese ? SCALE : SCALE_EN).map((label, index) => <button className={currentAnswer === index + 1 ? "is-selected" : ""} type="button" key={label} onClick={() => selectAnswer(index + 1)}><strong>{index + 1}</strong><span>{label}</span></button>)}</div>
        <div className="assessment-navigation"><button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>← {isVietnamese ? "QUAY LẠI" : "BACK"}</button><button className="assessment-next-button" type="button" disabled={currentAnswer === null} onClick={goNext}>{current === QUESTIONS.length - 1 ? (isVietnamese ? "XEM KẾT QUẢ" : "SEE RESULTS") : (isVietnamese ? "CÂU TIẾP THEO →" : "NEXT QUESTION →")}</button></div>
      </section>}

      {view === "result" && <section className="assessment-result">
        <div className="assessment-result-hero assessment-glass"><p className="assessment-kicker">{isVietnamese ? "✦ HỒ SƠ TÂM LÝ HOÀN TẤT ✦" : "✦ PERSONALITY PROFILE COMPLETE ✦"}</p><h1>{isVietnamese ? <>Bản đồ năng lượng<br /><em>của bạn</em></> : <>Your energy<br /><em>map</em></>}</h1><p>{isVietnamese ? "5 trục tính cách phản ánh cách bạn tương tác, tư duy và đón nhận thế giới xung quanh." : "Five personality dimensions reflecting how you interact with, think about, and experience the world around you."}</p></div>
        <div className="assessment-result-layout"><div className="assessment-strongest assessment-glass"><span className="assessment-result-symbol">{strongest.symbol}</span><p className="assessment-kicker">{isVietnamese ? "NĂNG LƯỢNG NỔI BẬT" : "STRONGEST ENERGY"}</p><h2>{localizedMeta[strongest.trait].label}</h2><p>{localizedMeta[strongest.trait].detail}</p><div className="assessment-score-orbit"><strong>{strongest.percent}</strong><span>%</span></div></div><div className="assessment-result-list">{results.map((result) => <article className={`assessment-result-card ${localizedMeta[result.trait].color}`} key={result.trait}><div className="assessment-result-card-head"><span>{localizedMeta[result.trait].symbol}</span><strong>{localizedMeta[result.trait].label}</strong><b>{result.percent}%</b></div><div className="assessment-result-bar"><span style={{ width: `${result.percent}%` }} /></div><p>{localizedMeta[result.trait].detail}</p></article>)}</div></div>
        <div className="assessment-result-actions assessment-glass"><div><p className="assessment-kicker">{isVietnamese ? "MUỐN ĐỌC SÂU HƠN?" : "WANT TO GO DEEPER?"}</p><h3>{isVietnamese ? "Đặt bản đồ tính cách cạnh 24 chỉ số thần số học của bạn." : "Place your personality map beside your 24 numerology indicators."}</h3></div><button className="assessment-primary-button" type="button" onClick={startAssessment}>{isVietnamese ? "LÀM LẠI" : "RETAKE"} <span>↻</span></button></div>
        <p className="assessment-disclaimer">{isVietnamese ? "Đây là công cụ tự phản chiếu, không phải chẩn đoán tâm lý hay lời tiên đoán cố định. Bạn luôn có quyền viết lại câu chuyện của mình." : "This is a self-reflection tool, not a psychological diagnosis or fixed prediction. You always have the right to rewrite your story."}</p>
      </section>}
    </main>
  </main>;
}
