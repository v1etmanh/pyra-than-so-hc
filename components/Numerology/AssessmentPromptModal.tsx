'use client';

import React, { useEffect, useState } from 'react';

interface AssessmentPromptModalProps {
  isVietnamese: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export function AssessmentPromptModal({
  isVietnamese,
  onStart,
  onSkip,
}: AssessmentPromptModalProps) {
  // Structured text segments for rich typing and emphasis
  const content = isVietnamese
    ? {
      part1:
        'Bạn ơi! Dù số phận mỗi người mang một khuôn mẫu năng lượng từ khi sinh ra, nhưng khoa học tâm lý học hiện đại khẳng định một chân lý cốt lõi: ',
      highlight:
        'CHÍNH TÍNH CÁCH VÀ CẢM XÚC MỚI LÀ THỨ THỰC SỰ ĐỊNH HÌNH NÊN SỐ PHẬN CỦA BẠN.',
      part2:
        '\n\nNhững con số Thần số học cho bạn biết hạt mầm tiềm năng vũ trụ trao tặng — nhưng cách bạn tư duy, cách bạn đối diện với nghịch cảnh và phản ứng với cảm xúc mỗi ngày mới quyết định hạt mầm ấy sẽ nở hoa ra sao.\n\n',
      part3:
        'Hãy dành 2 phút thực hiện bài trắc nghiệm cảm xúc khoa học (chuẩn Mini-IPIP Big Five) này. Numina sẽ kết hợp nhịp đập tâm lý cùng bản đồ số học của bạn, tạo nên lời giải mã chân thật, sâu sắc và may đo độc bản cho riêng bạn.',
    }
    : {
      part1:
        'Dear seeker! While numerology outlines the cosmic energy blueprint you were born with, modern psychological science confirms a profound truth: ',
      highlight:
        'YOUR CHARACTER AND EMOTIONS ARE WHAT TRULY SCULPT YOUR DESTINY.',
      part2:
        '\n\nNumbers reveal the raw potential gifted by the universe — but how you think, how you handle pressure, and how you navigate emotions every day are what truly determine how far you will go.\n\n',
      part3:
        'Take 2 minutes to complete this scientific emotional assessment (Mini-IPIP Big Five). Numina will integrate your psychological traits into your numerology map, delivering the most authentic and deeply tailored interpretation crafted uniquely for you.',
    };

  const { part1, highlight, part2, part3 } = content;
  const lenPart1 = part1.length;
  const lenHighlight = highlight.length;
  const lenPart2 = part2.length;
  const lenPart3 = part3.length;
  const totalLength = lenPart1 + lenHighlight + lenPart2 + lenPart3;

  const [charIndex, setCharIndex] = useState(0);
  const isFinished = charIndex >= totalLength;

  // Typewriter timer: advance 1 char every 12ms for lively fluid pacing
  useEffect(() => {
    setCharIndex(0);
    const timer = setInterval(() => {
      setCharIndex((prev) => {
        if (prev >= totalLength) {
          clearInterval(timer);
          return totalLength;
        }
        return prev + 1;
      });
    }, 12);

    return () => clearInterval(timer);
  }, [totalLength]);

  // Click to skip typing animation
  const handleFastForward = () => {
    if (!isFinished) {
      setCharIndex(totalLength);
    }
  };

  // Compute streamed text for each section
  const renderedPart1 = part1.slice(0, charIndex);

  const renderedHighlight =
    charIndex > lenPart1
      ? highlight.slice(0, charIndex - lenPart1)
      : '';

  const offset2 = lenPart1 + lenHighlight;
  const renderedPart2 =
    charIndex > offset2
      ? part2.slice(0, charIndex - offset2)
      : '';

  const offset3 = offset2 + lenPart2;
  const renderedPart3 =
    charIndex > offset3
      ? part3.slice(0, charIndex - offset3)
      : '';

  // Determine which section currently has the blinking cursor
  const cursorInSection =
    charIndex <= lenPart1
      ? 1
      : charIndex <= offset2
        ? 2
        : charIndex <= offset3
          ? 3
          : 4;

  return (
    <div
      className="indicator-assessment-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <section
        className="indicator-assessment-modal indicator-assessment-modal-rich"
        role="dialog"
        aria-modal="true"
        aria-labelledby="indicator-assessment-title"
      >
        {/* Close Button */}
        <button
          type="button"
          className="indicator-assessment-close"
          onClick={onSkip}
          aria-label={isVietnamese ? 'Đóng và để sau' : 'Close'}
        >
          ✕
        </button>

        {/* Pulsating Celestial Emblem */}
        <div className="indicator-assessment-symbol" aria-hidden="true">
          ✦
        </div>

        {/* Kicker */}
        <p className="batch-kicker indicator-assessment-kicker">
          {isVietnamese
            ? '✦ KHOA HỌC TÂM LÝ & BẢN ĐỒ VẬN MỆNH ✦'
            : '✦ PSYCHOLOGICAL SCIENCE & DESTINY MAP ✦'}
        </p>

        {/* Main Headline */}
        <h2 id="indicator-assessment-title" className="indicator-assessment-title">
          {isVietnamese
            ? 'Số phận hay tính cách định hình bạn?'
            : 'Does Destiny or Personality Define You?'}
        </h2>

        {/* Interactive Typewriter Reading Box */}
        <div
          className="indicator-assessment-typewriter-box"
          onClick={handleFastForward}
          role="region"
          aria-label="Thông điệp đánh giá tính cách"
          title={
            isFinished
              ? ''
              : isVietnamese
                ? 'Nhấp để hiện nhanh toàn bộ văn bản'
                : 'Click to display full text'
          }
        >
          {/* Paragraph 1: Intro + Scientific Highlight */}
          <p className="indicator-assessment-paragraph">
            {renderedPart1}
            {cursorInSection === 1 && !isFinished && (
              <span className="indicator-assessment-cursor" aria-hidden="true">
                ✦
              </span>
            )}
            {renderedHighlight && (
              <strong className="indicator-assessment-highlight">
                {renderedHighlight}
                {cursorInSection === 2 && !isFinished && (
                  <span className="indicator-assessment-cursor" aria-hidden="true">
                    ✦
                  </span>
                )}
              </strong>
            )}
          </p>

          {/* Paragraph 2: Potential vs Action */}
          {renderedPart2.trim() && (
            <p className="indicator-assessment-paragraph">
              {renderedPart2.trim()}
              {cursorInSection === 3 && !isFinished && (
                <span className="indicator-assessment-cursor" aria-hidden="true">
                  ✦
                </span>
              )}
            </p>
          )}

          {/* Paragraph 3: The Invitation & AI Tailoring */}
          {renderedPart3.trim() && (
            <p className="indicator-assessment-paragraph">
              {renderedPart3.trim()}
              {cursorInSection === 4 && !isFinished && (
                <span className="indicator-assessment-cursor" aria-hidden="true">
                  ✦
                </span>
              )}
            </p>
          )}

          {/* Skip hint while typing */}
          {!isFinished && (
            <div className="indicator-assessment-skip-hint">
              <span>
                {isVietnamese
                  ? '✦ Nhấp vào khung để hiện toàn bộ ✦'
                  : '✦ Click anywhere in this box to show all ✦'}
              </span>
            </div>
          )}
        </div>

        {/* Meta Pill */}
        <div className="indicator-assessment-meta-pill">
          <span>
            {isVietnamese
              ? '✦ 20 CÂU TRẮC NGHIỆM KHOA HỌC · KHOẢNG 2 PHÚT · KHÔNG CÓ ĐÚNG HAY SAI ✦'
              : '✦ 20 SCIENTIFIC QUESTIONS · ~2 MINUTES · NO RIGHT OR WRONG ✦'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="indicator-assessment-actions">
          <button
            type="button"
            className="indicator-assessment-secondary"
            onClick={onSkip}
          >
            {isVietnamese ? 'BỎ QUA, XEM SỐ HỌC TRƯỚC' : 'SKIP FOR NOW'}
          </button>
          <button
            type="button"
            className="indicator-assessment-primary indicator-assessment-cta-glow"
            onClick={onStart}
          >
            {isVietnamese ? 'LÀM BÀI TEST NGAY (2 PHÚT)' : 'TAKE THE TEST NOW (2 MINS)'}{' '}
            <span>→</span>
          </button>
        </div>
      </section>
    </div>
  );
}
