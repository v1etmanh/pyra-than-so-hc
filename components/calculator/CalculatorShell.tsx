'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import PyraHeader from '@/components/sites/chani-com-6d20749d/shared/PyraHeader';
import { InnerFooter } from '@/components/sites/chani-com-6d20749d/shared/ChaniInnerPages';
import {
  calculateLifePath,
  calculateExpression,
  calculateSoulUrge,
  calculatePersonality,
  calculatePersonalYear,
  calculateBirthdayNumber,
  calculateMaturity,
  CalculationResult
} from '@/lib/numerology/calculator-engine';
import {
  CalculatorPageData,
  NumberMeaning
} from '@/lib/numerology/calculator-content';
import { siteBaseUrl } from '@/lib/seo/metadata';
import '@/styles/numerology-calculators.css';

interface CalculatorShellProps {
  data: CalculatorPageData;
}

export default function CalculatorShell({ data }: CalculatorShellProps) {
  const locale = useLocale();
  const isVi = locale === 'vi';
  const localize = (path: string) => (isVi ? path : `/en${path}`);

  // Form states
  const [fullName, setFullName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [targetYear, setTargetYear] = useState(new Date().getFullYear().toString());

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [meaning, setMeaning] = useState<NumberMeaning | null>(null);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    const ty = parseInt(targetYear, 10);
    const trimmedName = fullName.trim();

    // Validations based on inputType
    if (data.inputType === 'name' || data.inputType === 'name-date') {
      if (!trimmedName || trimmedName.length < 2) {
        setError(isVi ? 'Vui lòng nhập họ tên đầy đủ hợp lệ (tối thiểu 2 ký tự).' : 'Please enter a valid full name (at least 2 characters).');
        return;
      }
    }

    if (data.inputType === 'date' || data.inputType === 'name-date' || data.inputType === 'date-year') {
      if (isNaN(d) || d < 1 || d > 31) {
        setError(isVi ? 'Ngày sinh không hợp lệ (từ 1 đến 31).' : 'Invalid birth day (between 1 and 31).');
        return;
      }
      if (isNaN(m) || m < 1 || m > 12) {
        setError(isVi ? 'Tháng sinh không hợp lệ (từ 1 đến 12).' : 'Invalid birth month (between 1 and 12).');
        return;
      }
      if (data.inputType !== 'date-year' || !isNaN(y)) {
        if (isNaN(y) || y < 1900 || y > new Date().getFullYear()) {
          setError(isVi ? 'Năm sinh không hợp lệ (1900 đến năm hiện tại).' : 'Invalid birth year (1900 to current year).');
          return;
        }
      }
    }

    if (data.inputType === 'date-year') {
      if (isNaN(ty) || ty < 1900 || ty > 2100) {
        setError(isVi ? 'Năm cần xem không hợp lệ (1900 đến 2100).' : 'Invalid target year (between 1900 and 2100).');
        return;
      }
    }

    let calcRes: CalculationResult;

    switch (data.slug) {
      case 'life-path-number-calculator':
        calcRes = calculateLifePath(d, m, y);
        break;
      case 'expression-number-calculator':
        calcRes = calculateExpression(trimmedName);
        break;
      case 'soul-urge-number-calculator':
        calcRes = calculateSoulUrge(trimmedName);
        break;
      case 'personality-number-calculator':
        calcRes = calculatePersonality(trimmedName);
        break;
      case 'personal-year-number-calculator':
        calcRes = calculatePersonalYear(d, m, ty);
        break;
      case 'birthday-number-calculator':
        calcRes = calculateBirthdayNumber(d);
        break;
      case 'maturity-number-calculator':
        calcRes = calculateMaturity(d, m, y, trimmedName);
        break;
      default:
        calcRes = calculateLifePath(d, m, y);
    }

    setResult(calcRes);
    const foundMeaning = data.meanings[calcRes.value] || null;
    setMeaning(foundMeaning);

    // Scroll to results smoothly
    setTimeout(() => {
      document.getElementById('calc-results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const canonicalUrl = `${siteBaseUrl}${localize(`/${data.slug}`)}`;

  // Structured Data Schema
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isVi ? data.nameVi : data.nameEn,
    url: canonicalUrl,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    description: isVi ? data.introVi : data.introEn,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isVi ? 'Trang chủ' : 'Home',
        item: `${siteBaseUrl}${localize('/')}`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isVi ? 'Công cụ tính' : 'Calculators',
        item: `${siteBaseUrl}${localize('/indicators')}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isVi ? data.nameVi : data.nameEn,
        item: canonicalUrl
      }
    ]
  };

  return (
    <div className="calc-page-wrapper">
      <PyraHeader />

      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="calc-container">
        {/* Breadcrumbs */}
        <nav className="calc-breadcrumbs" aria-label="Breadcrumb">
          <Link href={localize('/')}>{isVi ? 'Trang chủ' : 'Home'}</Link>
          <span className="calc-breadcrumbs-sep">/</span>
          <Link href={localize('/indicators')}>{isVi ? 'Bản đồ 24 chỉ số' : '24 Indicators'}</Link>
          <span className="calc-breadcrumbs-sep">/</span>
          <span aria-current="page">{isVi ? data.nameVi : data.nameEn}</span>
        </nav>

        {/* Hero Section */}
        <section className="calc-hero">
          <span className="calc-kicker">{isVi ? data.kickerVi : data.kickerEn}</span>
          <h1 className="calc-title">{isVi ? data.h1Vi : data.h1En}</h1>
          <p className="calc-intro">{isVi ? data.introVi : data.introEn}</p>
        </section>

        {/* Interactive Form Card */}
        <section className="calc-form-card" aria-label="Calculator Input Form">
          <form onSubmit={handleCalculate}>
            <div className="calc-form-grid">
              {/* Full Name Input */}
              {(data.inputType === 'name' || data.inputType === 'name-date') && (
                <div className="calc-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="full-name" className="calc-form-label">
                    {isVi ? 'Họ và tên khai sinh đầy đủ' : 'Full Birth Certificate Name'}
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    className="calc-form-input"
                    placeholder={isVi ? 'Ví dụ: Nguyễn Văn An' : 'e.g., Johnathan Edward Smith'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Birth Date Inputs */}
              {(data.inputType === 'date' || data.inputType === 'name-date' || data.inputType === 'date-year') && (
                <>
                  <div className="calc-form-group">
                    <label htmlFor="birth-day" className="calc-form-label">
                      {isVi ? 'Ngày sinh' : 'Day'}
                    </label>
                    <input
                      id="birth-day"
                      type="number"
                      min="1"
                      max="31"
                      className="calc-form-input"
                      placeholder="DD"
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      required
                    />
                  </div>
                  <div className="calc-form-group">
                    <label htmlFor="birth-month" className="calc-form-label">
                      {isVi ? 'Tháng sinh' : 'Month'}
                    </label>
                    <input
                      id="birth-month"
                      type="number"
                      min="1"
                      max="12"
                      className="calc-form-input"
                      placeholder="MM"
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* Birth Year Input */}
              {(data.inputType === 'date' || data.inputType === 'name-date') && (
                <div className="calc-form-group">
                  <label htmlFor="birth-year" className="calc-form-label">
                    {isVi ? 'Năm sinh' : 'Year'}
                  </label>
                  <input
                    id="birth-year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="calc-form-input"
                    placeholder="YYYY"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Target Year Input for Personal Year */}
              {data.inputType === 'date-year' && (
                <div className="calc-form-group">
                  <label htmlFor="target-year" className="calc-form-label">
                    {isVi ? 'Năm cần xem vận hạn' : 'Target Forecast Year'}
                  </label>
                  <input
                    id="target-year"
                    type="number"
                    min="1900"
                    max="2100"
                    className="calc-form-input"
                    placeholder="YYYY"
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {error && <p className="calc-form-error" role="alert">{error}</p>}

            <div className="calc-form-actions">
              <button type="submit" className="calc-btn-submit">
                <span>✦</span>
                <span>{isVi ? 'TÍNH NGAY KẾT QUẢ' : 'CALCULATE NOW'}</span>
              </button>
              <div className="calc-privacy-guarantee">
                <span>🔒</span>
                <span>
                  {isVi
                    ? '100% Client-side. Tên và ngày sinh được tính trực tiếp trên trình duyệt, không lưu trữ.'
                    : '100% Client-side. Your details are computed locally in your browser, never recorded.'}
                </span>
              </div>
            </div>
          </form>

          {/* Result Section */}
          {result && (
            <div id="calc-results" className="calc-result-wrapper">
              <div className="calc-result-header">
                <div className="calc-result-badge">
                  <span className="calc-result-number">{result.value}</span>
                  {result.isMaster && (
                    <span className="calc-result-master-tag">Master</span>
                  )}
                </div>
                <div className="calc-result-titles">
                  <h3>
                    {meaning
                      ? isVi
                        ? meaning.titleVi
                        : meaning.titleEn
                      : isVi
                      ? `Con số năng lượng ${result.value}`
                      : `Vibrational Energy ${result.value}`}
                  </h3>
                  <div className="calc-result-archetype">
                    {meaning ? (isVi ? meaning.archetypeVi : meaning.archetypeEn) : ''}
                  </div>
                </div>
              </div>

              {/* Step-by-step Math Breakdown */}
              <div className="calc-math-box">
                <div className="calc-math-title">
                  <span>📐</span>
                  <span>{isVi ? 'Phép tính toán học từng bước chi tiết' : 'Step-by-Step Mathematical Calculation'}</span>
                </div>
                {(isVi ? result.stepsVi : result.stepsEn).map((step, idx) => (
                  <div key={idx} className="calc-math-step">{step}</div>
                ))}
              </div>

              {/* Strengths & Challenges */}
              {meaning && (
                <>
                  <div className="calc-insights-grid">
                    <div className="calc-insight-card calc-card-strengths">
                      <div className="calc-insight-heading">
                        <span>✦</span>
                        <span>{isVi ? 'Điểm mạnh nổi bật' : 'Key Strengths'}</span>
                      </div>
                      <ul className="calc-insight-list">
                        {(isVi ? meaning.strengthsVi : meaning.strengthsEn).map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="calc-insight-card calc-card-challenges">
                      <div className="calc-insight-heading">
                        <span>⚠</span>
                        <span>{isVi ? 'Thách thức & Bài học' : 'Lessons & Challenges'}</span>
                      </div>
                      <ul className="calc-insight-list">
                        {(isVi ? meaning.challengesVi : meaning.challengesEn).map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="calc-advice-card">
                    <div className="calc-advice-title">
                      {isVi ? 'Lời khuyên phát triển từ NUMELYRA' : 'Guidance from NUMELYRA'}
                    </div>
                    <p className="calc-advice-text">
                      {isVi ? meaning.adviceVi : meaning.adviceEn}
                    </p>
                  </div>
                </>
              )}

              {/* CTA to Full 24-Indicator Map */}
              <div className="calc-cta-box">
                <h4>
                  {isVi
                    ? 'Khám phá Bản đồ 24 chỉ số Thần số học hoàn chỉnh'
                    : 'Unlock Your Complete 24-Indicator Numerology Blueprint'}
                </h4>
                <p>
                  {isVi
                    ? 'Chỉ số này mới chỉ là 1 trong 24 mảnh ghép linh hồn của bạn. Hãy mở bản đồ tổng quan để hiểu trọn vẹn Nợ nghiệp, Kim tự tháp đỉnh cao, và Năm/Tháng/Ngày cá nhân.'
                    : 'This number is only 1 piece of your complete 24-indicator cosmic puzzle. Access your full chart to analyze Karmic Debts, Pinnacles, Bridges, and Personal Timing.'}
                </p>
                <Link href={localize('/indicators')} className="calc-cta-btn">
                  {isVi ? 'XEM BẢN ĐỒ 24 CHỈ SỐ CỦA TÔI ↗' : 'VIEW MY FULL 24-INDICATOR MAP ↗'}
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* How to Calculate Manually Section */}
        <section className="calc-content-section">
          <h2 className="calc-section-title">
            {isVi
              ? `Cách tính ${data.nameVi} theo chuẩn Pythagoras`
              : `How to Calculate Your ${data.nameEn} Manually`}
          </h2>
          <div className="calc-prose">
            <p>
              <strong>{isVi ? 'Công thức tổng quát:' : 'Core Formula:'}</strong>{' '}
              {isVi ? data.manualFormulaVi : data.manualFormulaEn}
            </p>
            <ol className="calc-steps-list">
              {(isVi ? data.manualStepsVi : data.manualStepsEn).map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>

            {/* Pythagorean Table for Name-based Calculators */}
            {(data.inputType === 'name' || data.inputType === 'name-date') && (
              <>
                <p>
                  <strong>{isVi ? 'Bảng quy đổi chữ số Pythagoras chuẩn quốc tế:' : 'Pythagorean Alphabet-to-Number Conversion Chart:'}</strong>
                </p>
                <table className="calc-pythagorean-table" aria-label="Pythagorean conversion table">
                  <thead>
                    <tr>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <th key={n}>{n}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>A, J, S</td>
                      <td>B, K, T</td>
                      <td>C, L, U</td>
                      <td>D, M, V</td>
                      <td>E, N, W</td>
                      <td>F, O, X</td>
                      <td>G, P, Y*</td>
                      <td>H, Q, Z</td>
                      <td>I, R</td>
                    </tr>
                  </tbody>
                </table>
                <p style={{ fontSize: '13.5px', color: '#78716c', fontStyle: 'italic' }}>
                  {isVi
                    ? '* Quy tắc chữ Y: Y được tính là nguyên âm khi trong từ không có nguyên âm nào khác (A, E, I, O, U). Ngược lại, Y được tính là phụ âm.'
                    : '* The Y Rule: Y functions as a vowel when a word contains no other vowels (A, E, I, O, U). Otherwise, it acts as a consonant.'}
                </p>
              </>
            )}
          </div>
        </section>

        {/* Meaning of Numbers Section */}
        <section className="calc-content-section">
          <h2 className="calc-section-title">
            {isVi
              ? `Ý nghĩa các con số trong ${data.nameVi}`
              : `Meaning of Numbers in Your ${data.nameEn}`}
          </h2>
          <div className="calc-meanings-grid">
            {Object.entries(data.meanings).map(([key, item]) => (
              <div key={key} className="calc-meaning-card">
                <div className="calc-card-num-header">
                  <div className="calc-small-badge">{key}</div>
                  <h4>{isVi ? item.titleVi : item.titleEn}</h4>
                </div>
                <p className="calc-meaning-desc">
                  {isVi ? item.adviceVi : item.adviceEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs Accordion Section */}
        <section className="calc-content-section">
          <h2 className="calc-section-title">
            {isVi ? 'Câu hỏi thường gặp (FAQ)' : 'Frequently Asked Questions'}
          </h2>
          <div className="calc-faq-list">
            {data.faqs.map((faq, idx) => (
              <details key={idx} className="calc-faq-item">
                <summary className="calc-faq-question">
                  {isVi ? faq.qVi : faq.qEn}
                </summary>
                <div className="calc-faq-answer">
                  {isVi ? faq.aVi : faq.aEn}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Related Calculators Section */}
        <section className="calc-content-section">
          <h2 className="calc-section-title">
            {isVi ? 'Các công cụ tính Thần số học liên quan' : 'Related Numerology Calculators'}
          </h2>
          <div className="calc-related-grid">
            {data.relatedSlugs.map((rel) => (
              <Link
                key={rel.slug}
                href={localize(`/${rel.slug}`)}
                className="calc-related-card"
              >
                <div className="calc-related-title">
                  {isVi ? rel.nameVi : rel.nameEn}
                </div>
                <div className="calc-related-desc">
                  {isVi ? rel.descVi : rel.descEn}
                </div>
                <span className="calc-related-link">
                  {isVi ? 'Khám phá ngay →' : 'Calculate now →'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <InnerFooter />
    </div>
  );
}
