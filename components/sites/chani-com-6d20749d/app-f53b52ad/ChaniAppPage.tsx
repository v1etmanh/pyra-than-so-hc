"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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

const TRAIT_META: Record<TraitKey, { label: string; detail: string; symbol: string; color: string }> = {
  extraversion: { label: "Hướng Ngoại", detail: "Năng lượng xã hội và cách bạn bước vào thế giới.", symbol: "☼", color: "gold" },
  agreeableness: { label: "Dễ Chịu", detail: "Thấu cảm, tử tế và khả năng kết nối với người khác.", symbol: "♡", color: "rose" },
  conscientiousness: { label: "Tận Tâm", detail: "Kỷ luật, sự ngăn nắp và cách bạn hoàn thành điều đã chọn.", symbol: "⌂", color: "sage" },
  emotionality: { label: "Nhạy Cảm", detail: "Chiều sâu cảm xúc và cách bạn xử lý những dao động bên trong.", symbol: "☾", color: "lilac" },
  openness: { label: "Cởi Mở", detail: "Trí tưởng tượng, tò mò và khả năng đón nhận điều mới.", symbol: "✦", color: "blue" },
};

const SCALE = ["Hoàn toàn không đúng", "Khá không đúng", "Phân vân / Trung lập", "Khá đúng", "Hoàn toàn đúng"];
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
  const assessmentIdentityKey = searchParams.get("identityKey") || undefined;
  const [view, setView] = useState<View>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(INITIAL_ANSWERS);
  const results = calculateResults(answers);
  const currentQuestion = QUESTIONS[current];
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
        <p className="assessment-kicker">PYRA / PERSONALITY MAP</p>
        <h1>Thấu hiểu bản thể<br /><em>5 chiều không gian tâm hồn</em></h1>
        <p className="assessment-lead">Một bài trắc nghiệm Mini-IPIP gồm 20 câu hỏi để soi chiếu 5 trục tính cách: cách bạn kết nối, chăm sóc, hành động, cảm nhận và tưởng tượng.</p>
        <div className="assessment-trait-preview">{(Object.keys(TRAIT_META) as TraitKey[]).map((trait, index) => <article className={`assessment-trait-chip ${TRAIT_META[trait].color}`} key={trait}><span>{String(index + 1).padStart(2, "0")}</span><strong>{TRAIT_META[trait].label}</strong><small>{TRAIT_META[trait].detail}</small></article>)}</div>
        <button className="assessment-primary-button" type="button" onClick={startAssessment}>BẮT ĐẦU KHẢO SÁT <span>✦</span></button>
        <p className="assessment-note">20 câu hỏi · khoảng 2–3 phút · không có câu trả lời đúng hay sai</p>
      </section>}

      {view === "quiz" && <section className="assessment-quiz assessment-glass">
        <div className="assessment-progress-head"><span className={`assessment-badge ${currentQuestion.trait}`}>{TRAIT_META[currentQuestion.trait].symbol} {TRAIT_META[currentQuestion.trait].label}</span><span>CÂU {current + 1} / {QUESTIONS.length}</span></div>
        <div className="assessment-progress-track"><span style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }} /></div>
        <div className="assessment-question-mark">{TRAIT_META[currentQuestion.trait].symbol}</div>
        <p className="assessment-question-number">CÂU HỎI {String(currentQuestion.id).padStart(2, "0")}</p>
        <h2 className="assessment-question">{currentQuestion.text}</h2>
        <div className="assessment-scale">{SCALE.map((label, index) => <button className={currentAnswer === index + 1 ? "is-selected" : ""} type="button" key={label} onClick={() => selectAnswer(index + 1)}><strong>{index + 1}</strong><span>{label}</span></button>)}</div>
        <div className="assessment-navigation"><button type="button" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}>← QUAY LẠI</button><button className="assessment-next-button" type="button" disabled={currentAnswer === null} onClick={goNext}>{current === QUESTIONS.length - 1 ? "XEM KẾT QUẢ" : "CÂU TIẾP THEO →"}</button></div>
      </section>}

      {view === "result" && <section className="assessment-result">
        <div className="assessment-result-hero assessment-glass"><p className="assessment-kicker">✦ HỒ SƠ TÂM LÝ HOÀN TẤT ✦</p><h1>Bản đồ năng lượng<br /><em>của bạn</em></h1><p>5 trục tính cách phản ánh cách bạn tương tác, tư duy và đón nhận thế giới xung quanh.</p></div>
        <div className="assessment-result-layout"><div className="assessment-strongest assessment-glass"><span className="assessment-result-symbol">{strongest.symbol}</span><p className="assessment-kicker">NĂNG LƯỢNG NỔI BẬT</p><h2>{strongest.label}</h2><p>{strongest.detail}</p><div className="assessment-score-orbit"><strong>{strongest.percent}</strong><span>%</span></div></div><div className="assessment-result-list">{results.map((result) => <article className={`assessment-result-card ${result.color}`} key={result.trait}><div className="assessment-result-card-head"><span>{result.symbol}</span><strong>{result.label}</strong><b>{result.percent}%</b></div><div className="assessment-result-bar"><span style={{ width: `${result.percent}%` }} /></div><p>{result.detail}</p></article>)}</div></div>
        <div className="assessment-result-actions assessment-glass"><div><p className="assessment-kicker">MUỐN ĐỌC SÂU HƠN?</p><h3>Đặt bản đồ tính cách cạnh 24 chỉ số thần số học của bạn.</h3></div><button className="assessment-primary-button" type="button" onClick={startAssessment}>LÀM LẠI <span>↻</span></button></div>
        <p className="assessment-disclaimer">Đây là công cụ tự phản chiếu, không phải chẩn đoán tâm lý hay lời tiên đoán cố định. Bạn luôn có quyền viết lại câu chuyện của mình.</p>
      </section>}
    </main>
  </main>;
}
