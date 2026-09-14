'use client';

import { FormEvent, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { normalizeMarkdownForMobile } from '@/lib/markdown/presentation';
import type { BaziLoveChatMessage, BaziLoveLocale } from '@/lib/bazi-love/types';
import styles from './BaziLove.module.css';

interface BaziLoveChatProps {
  interpretation: string;
  messages: BaziLoveChatMessage[];
  locale: BaziLoveLocale;
  onAskFollowUp: (question: string) => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

const QUICK_PROMPTS = {
  vi: [
    'Cách hóa giải điểm ma sát lớn nhất giữa hai người là gì?',
    'Chúng tôi nên giao tiếp thế nào khi có bất đồng?',
    'Trong 5 năm tới, giai đoạn nào cần đồng lòng nhất?',
    'Đối phương thường biểu đạt cảm xúc và quan tâm qua cách nào?'
  ],
  en: [
    'How can we best harmonize our primary friction area?',
    'What communication guidelines work best during disagreements?',
    'Which phase in the next 5 years requires the most mutual patience?',
    'How does my partner naturally express emotional attachment?'
  ]
};

export function BaziLoveChat({
  interpretation,
  messages,
  locale,
  onAskFollowUp,
  onRegenerate,
  isLoading
}: BaziLoveChatProps) {
  const isVi = locale === 'vi';
  const [question, setQuestion] = useState('');

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onAskFollowUp(question.trim());
    setQuestion('');
  };

  const handleQuickPrompt = (promptText: string) => {
    if (isLoading) return;
    onAskFollowUp(promptText);
  };

  return (
    <section className={styles.chatSection}>
      <div className={styles.chatTitleRow}>
        <div>
          <p className={styles.sectionKicker}>
            {isVi ? 'LỜI GIẢI TỪ NUMELYRA' : 'NUMELYRA’S GUIDANCE'}
          </p>
          <h3 className={styles.chatHeading}>
            {isVi ? 'Luận Giải Chi Tiết & Đối Thoại Thấu Cảm' : 'Deep Interpretation & Dialogue'}
          </h3>
        </div>

        <button
          type="button"
          disabled={isLoading}
          className={styles.bannerBtnNew}
          style={{ minHeight: '34px', padding: '0 12px', fontSize: '11px' }}
          onClick={onRegenerate}
        >
          ↻ {isVi ? 'Tạo lại góc nhìn mới' : 'Fresh Perspective'}
        </button>
      </div>

      <div className={styles.messagesList}>
        {/* Main Initial Reading */}
        {interpretation && (
          <article className={`${styles.messageBubble} ${styles.assistantBubble}`}>
            <ReactMarkdown>{normalizeMarkdownForMobile(interpretation)}</ReactMarkdown>
          </article>
        )}

        {/* Follow-up dialogue history */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageBubble} ${
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble
            }`}
          >
            {msg.role === 'user' ? (
              <div>{msg.content}</div>
            ) : (
              <div>
                <ReactMarkdown>{normalizeMarkdownForMobile(msg.content)}</ReactMarkdown>
                {msg.status === 'streaming' && (
                  <span className={styles.spinner} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '0.5rem' }} />
                )}
                {msg.status === 'error' && (
                  <p style={{ color: 'var(--bazi-negative-text)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                    {msg.error || (isVi ? 'Đã có lỗi xảy ra khi tạo câu trả lời.' : 'An error occurred during response generation.')}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div className={styles.quickPrompts}>
        {QUICK_PROMPTS[locale].map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            className={styles.promptChip}
            onClick={() => handleQuickPrompt(p)}
          >
            💬 {p}
          </button>
        ))}
      </div>

      {/* Follow-up Input Form */}
      <form className={styles.chatForm} onSubmit={handleSend}>
        <input
          type="text"
          disabled={isLoading}
          className={styles.chatInput}
          placeholder={
            isVi
              ? 'Hỏi tiếp về tương hợp, thói quen, cách thấu hiểu đối phương…'
              : 'Ask a follow-up question about communication, growth, dynamics…'
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" disabled={isLoading || !question.trim()} className={styles.chatSendBtn}>
          {isLoading ? (isVi ? '…' : '…') : (isVi ? 'Gửi câu hỏi ➤' : 'Send ➤')}
        </button>
      </form>
    </section>
  );
}
