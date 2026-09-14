'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { BaziLoveLocale, BaziLovePersonInput, CalculationSex } from '@/lib/bazi-love/types';
import styles from './BaziLove.module.css';

interface BaziLoveFormProps {
  locale: BaziLoveLocale;
  onSubmit: (people: [BaziLovePersonInput, BaziLovePersonInput], question?: string) => void;
  isLoading: boolean;
}

export function BaziLoveForm({ locale, onSubmit, isLoading }: BaziLoveFormProps) {
  const isVi = locale === 'vi';

  const [detectedTz, setDetectedTz] = useState('Asia/Ho_Chi_Minh');
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setDetectedTz(tz);
    } catch {
      // fallback
    }
  }, []);

  // Person A state
  const [nameA, setNameA] = useState('');
  const [birthDateA, setBirthDateA] = useState('');
  const [birthTimeA, setBirthTimeA] = useState('');
  const [unknownTimeA, setUnknownTimeA] = useState(false);
  const [tzA, setTzA] = useState('');
  const [sexA, setSexA] = useState<CalculationSex>('male');

  // Person B state
  const [nameB, setNameB] = useState('');
  const [birthDateB, setBirthDateB] = useState('');
  const [birthTimeB, setBirthTimeB] = useState('');
  const [unknownTimeB, setUnknownTimeB] = useState(false);
  const [tzB, setTzB] = useState('');
  const [sexB, setSexB] = useState<CalculationSex>('female');

  // Question state
  const [question, setQuestion] = useState('');

  // Auto-fill timezone once detected if empty
  useEffect(() => {
    if (!tzA) setTzA(detectedTz);
    if (!tzB) setTzB(detectedTz);
  }, [detectedTz, tzA, tzB]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nameA.trim() || !birthDateA || !nameB.trim() || !birthDateB) return;

    const personA: BaziLovePersonInput = {
      name: nameA.trim(),
      birthDate: birthDateA,
      birthTime: unknownTimeA ? undefined : birthTimeA.trim() || undefined,
      timezone: tzA || detectedTz,
      calculationSex: sexA
    };

    const personB: BaziLovePersonInput = {
      name: nameB.trim(),
      birthDate: birthDateB,
      birthTime: unknownTimeB ? undefined : birthTimeB.trim() || undefined,
      timezone: tzB || detectedTz,
      calculationSex: sexB
    };

    onSubmit([personA, personB], question.trim() || undefined);
  };

  return (
    <form className={styles.formBoard} onSubmit={handleSubmit}>
      <div className={styles.stepBadge}>
        <span>✦</span>
        <span>{isVi ? 'BƯỚC 01 · NHẬP THÔNG TIN HAI NGƯỜI' : 'STEP 01 · ENTER PROFILES'}</span>
      </div>

      <div>
        <h2 className={styles.formHeadline}>
          {isVi ? 'Ghép Đôi Bát Tự & Thấu Cảm Tình Duyên' : 'Bazi Synastry & Relational Compatibility'}
        </h2>
        <p className={styles.formSubtitle}>
          {isVi
            ? 'Phân tích đa tầng từ cấu trúc Can Chi, ngũ hành tương phối đến chu kỳ vận thế. Thấu hiểu để cùng gắn kết và dung hòa bền lâu.'
            : 'Multi-layer analysis from Stem-Branch dynamics to elemental synergy and 5-year luck cycles. Understand each other for conscious harmony.'}
        </p>
      </div>

      <div className={styles.boardDivider} aria-hidden="true">
        <span>✦</span>
        <div className={styles.dividerLine} />
      </div>

      <div className={styles.peopleGrid}>
        {/* Person A */}
        <div className={styles.personBox}>
          <div className={styles.personBoxHeader}>
            <div className={styles.personAvatarBadge}>A</div>
            <span>{isVi ? 'Người thứ nhất (Người A)' : 'First Person (Person A)'}</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Tên hiển thị' : 'Display Name'}</label>
            <input
              type="text"
              required
              className={styles.fieldInput}
              placeholder={isVi ? 'VD: Minh Quân' : 'e.g. Alex'}
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Ngày sinh (Dương lịch)' : 'Birth Date (Solar)'}</label>
            <input
              type="date"
              required
              className={styles.fieldInput}
              value={birthDateA}
              onChange={(e) => setBirthDateA(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Giờ sinh' : 'Birth Time'}</label>
            <input
              type="time"
              disabled={unknownTimeA}
              className={styles.fieldInput}
              value={birthTimeA}
              onChange={(e) => setBirthTimeA(e.target.value)}
            />
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={unknownTimeA}
                onChange={(e) => setUnknownTimeA(e.target.checked)}
              />
              <span>{isVi ? 'Chưa rõ giờ sinh (quét mọi khung giờ)' : 'Unknown birth time (scan all time windows)'}</span>
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Múi giờ nơi sinh' : 'Timezone'}</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={tzA}
              onChange={(e) => setTzA(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Giới tính an sao Bát Tự' : 'Calculation Sex for Bazi'}</label>
            <div className={styles.sexButtons}>
              <button
                type="button"
                className={`${styles.sexBtn} ${sexA === 'male' ? styles.sexBtnActive : ''}`}
                onClick={() => setSexA('male')}
              >
                {isVi ? 'Nam' : 'Male'}
              </button>
              <button
                type="button"
                className={`${styles.sexBtn} ${sexA === 'female' ? styles.sexBtnActive : ''}`}
                onClick={() => setSexA('female')}
              >
                {isVi ? 'Nữ' : 'Female'}
              </button>
            </div>
          </div>
        </div>

        {/* Person B */}
        <div className={styles.personBox}>
          <div className={styles.personBoxHeader}>
            <div className={styles.personAvatarBadge}>B</div>
            <span>{isVi ? 'Người thứ hai (Người B)' : 'Second Person (Person B)'}</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Tên hiển thị' : 'Display Name'}</label>
            <input
              type="text"
              required
              className={styles.fieldInput}
              placeholder={isVi ? 'VD: Thanh Mai' : 'e.g. Taylor'}
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Ngày sinh (Dương lịch)' : 'Birth Date (Solar)'}</label>
            <input
              type="date"
              required
              className={styles.fieldInput}
              value={birthDateB}
              onChange={(e) => setBirthDateB(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Giờ sinh' : 'Birth Time'}</label>
            <input
              type="time"
              disabled={unknownTimeB}
              className={styles.fieldInput}
              value={birthTimeB}
              onChange={(e) => setBirthTimeB(e.target.value)}
            />
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={unknownTimeB}
                onChange={(e) => setUnknownTimeB(e.target.checked)}
              />
              <span>{isVi ? 'Chưa rõ giờ sinh (quét mọi khung giờ)' : 'Unknown birth time (scan all time windows)'}</span>
            </label>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Múi giờ nơi sinh' : 'Timezone'}</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={tzB}
              onChange={(e) => setTzB(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>{isVi ? 'Giới tính an sao Bát Tự' : 'Calculation Sex for Bazi'}</label>
            <div className={styles.sexButtons}>
              <button
                type="button"
                className={`${styles.sexBtn} ${sexB === 'male' ? styles.sexBtnActive : ''}`}
                onClick={() => setSexB('male')}
              >
                {isVi ? 'Nam' : 'Male'}
              </button>
              <button
                type="button"
                className={`${styles.sexBtn} ${sexB === 'female' ? styles.sexBtnActive : ''}`}
                onClick={() => setSexB('female')}
              >
                {isVi ? 'Nữ' : 'Female'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Question */}
      <div className={styles.questionInputBox}>
        <label className={styles.fieldLabel}>
          {isVi ? 'Câu hỏi hoặc điều bạn băn khoăn nhất (Tùy chọn)' : 'Question or Area of Focus (Optional)'}
        </label>
        <textarea
          className={styles.questionTextarea}
          placeholder={
            isVi
              ? 'VD: Chúng tôi đang tính chuyện sống chung hoặc kết hôn, cần lưu ý điều gì nhất?'
              : 'e.g. We are considering moving in or marriage, what dynamics should we be mindful of?'
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
        />
      </div>

      {/* Calculation sex note */}
      <div className={styles.sexNoticeBox}>
        <p style={{ margin: 0 }}>
          {isVi
            ? '✦ Lưu ý về giới tính: Trong thuật số Bát Tự cổ điển, giới tính chỉ dùng để xác định chiều an Đại Vận (thuận hay nghịch) và vị trí Thập Thần quan hệ. Đây hoàn toàn không phải dữ liệu để AI suy đoán bản dạng giới hay xu hướng tình cảm của bạn.'
            : '✦ Astrological Sex Notice: In classical Bazi, sex is used strictly to determine the directional flow of Luck Pillars and relational roles. It is not used to infer personal gender identity or orientation.'}
        </p>
      </div>

      {/* Submit CTA */}
      <button
        type="submit"
        disabled={isLoading || !nameA.trim() || !birthDateA || !nameB.trim() || !birthDateB}
        className={styles.btnSubmitForm}
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            <span>{isVi ? 'Đang tính toán…' : 'Calculating…'}</span>
          </>
        ) : (
          <>
            <span>✦</span>
            <span>{isVi ? 'Khám Phá Tương Hợp Bát Tự' : 'Reveal Bazi Synastry'}</span>
          </>
        )}
      </button>
    </form>
  );
}
