import { useMemo } from 'react';
import dayjs from 'dayjs';
import { NumerologyHookType } from '@/utils/types';
import {
  getSoul,
  getBalance,
  getMission,
  getPassion,
  sumAdjacent,
  removeAccents,
  getWalksOfLife,
  getPersonality,
  getMissingNumbers,
  substractAdjacent,
  getRationalThinking,
  getKarmicDebts,
  getBridges,
  getAttitude,
  getBirthChartArrows
} from '@/functions';

export const useProcessNumerology = (
  fullName: string,
  birthDay: string
): (NumerologyHookType & { isCore?: boolean; category?: string })[] => {
  const data = useMemo(() => {
    if (!birthDay) return [];
    const date = dayjs(birthDay).format('DD');
    const month = dayjs(birthDay).format('MM');
    const year = dayjs(birthDay).format('YYYY');
    const currentYear = dayjs().format('YYYY');
    const currentMonth = dayjs().format('MM');
    const currentDay = dayjs().format('DD');

    const txtName = (fullName || '').trim();
    const name = removeAccents(txtName.toLocaleUpperCase());
    let completedName: string = '';
    const arrStrName = name.split('');
    arrStrName.map((char, index) => {
      if ((char === ' ' && arrStrName?.[index + 1] !== ' ') || char !== ' ') {
        completedName += char;
      }
    });

    const arrName = name.replace(/\s/g, '').split('');

    // 1. Core 5 indicators
    const walksOfLife = getWalksOfLife(birthDay);
    const mission = getMission(name);
    const soul = getSoul(name);
    const personality = getPersonality(arrName);
    const dateOfBirth = sumAdjacent(date, 0);

    // 2. Auxiliary and psychological indicators
    const passion = getPassion(arrName);
    const mature = sumAdjacent(walksOfLife, mission, 'mature');
    const balance = getBalance(completedName);
    const missingNumber = getMissingNumbers(arrName).map((item) => item.value);
    const subconsciousPower = 9 - missingNumber.length;
    const rationalThinking = getRationalThinking(completedName, date);
    const attitude = getAttitude(birthDay);

    // 3. Karmic and Bridges
    const karmicDebts = getKarmicDebts(birthDay, fullName);
    const bridges = getBridges(walksOfLife, mission, soul, personality, mature, passion);

    // 4. Cycles and Pinnacles
    const reduceToSingleDigit = (num: number | string): number => {
      let sum = Number(num);
      while (sum > 9) {
        sum = String(sum)
          .split('')
          .reduce((a, b) => a + Number(b), 0);
      }
      return sum;
    };

    const dateRoot = reduceToSingleDigit(date);
    const monthRoot = reduceToSingleDigit(month);
    const yearRoot = reduceToSingleDigit(year);
    const currentYearRoot = reduceToSingleDigit(currentYear);

    const calculatePeak = (sum: number, isPeak34: boolean) => {
      let currentSum = sum;
      while (currentSum >= 10) {
        if (isPeak34 && (currentSum === 10 || currentSum === 11)) {
          return currentSum;
        }
        currentSum = String(currentSum)
          .split('')
          .reduce((a, b) => a + Number(b), 0);
      }
      return currentSum;
    };

    const way1 = calculatePeak(monthRoot + dateRoot, false);
    const way2 = calculatePeak(dateRoot + yearRoot, false);
    const way3 = calculatePeak(way1 + way2, true);
    const way4 = calculatePeak(monthRoot + yearRoot, true);
    const way = `${way1} - ${way2} - ${way3} - ${way4}`;

    const challenge1 = substractAdjacent(month, date);
    const challenge2 = substractAdjacent(year, date);
    const challenge3 = Math.abs(challenge1 - challenge2);
    const challenge4 = substractAdjacent(month, year);
    const challenges = `${challenge1} - ${challenge2} - ${challenge3} - ${challenge4}`;

    const yearIndividual = reduceToSingleDigit(currentYearRoot + dateRoot + monthRoot);
    const monthIndividual = reduceToSingleDigit(yearIndividual + reduceToSingleDigit(currentMonth));
    const dayIndividual = reduceToSingleDigit(monthIndividual + reduceToSingleDigit(currentDay));

    // 5. Birth chart arrows
    const birthArrows = getBirthChartArrows(birthDay);
    const activeArrows = birthArrows
      .filter((a: any) => a.hasArrow || a.isEmpty)
      .map((a: any) => `${a.name}: ${a.hasArrow ? 'Có mặt (Mạnh)' : 'Trống (Thách thức)'}`)
      .join('; ');

    return [
      // 5 CORE INDICATORS
      {
        key: 'walksOfLife',
        value: walksOfLife,
        name: 'Đường đời',
        name_en: 'Life Path',
        isCore: true,
        category: 'core'
      },
      {
        key: 'mission',
        value: mission,
        name: 'Sứ mệnh',
        name_en: 'Mission / Destiny',
        isCore: true,
        category: 'core'
      },
      {
        key: 'soul',
        value: soul,
        name: 'Linh hồn',
        name_en: 'Soul Urge',
        isCore: true,
        category: 'core'
      },
      {
        key: 'personality',
        value: personality,
        name: 'Nhân cách',
        name_en: 'Personality',
        isCore: true,
        category: 'core'
      },
      {
        key: 'dateOfBirth',
        value: dateOfBirth,
        name: 'Ngày sinh',
        name_en: 'Birthday Number',
        isCore: true,
        category: 'core'
      },

      // 19 LAZY-LOADED INDICATORS
      {
        key: 'mature',
        value: mature,
        name: 'Trưởng thành',
        name_en: 'Maturity Number',
        isCore: false,
        category: 'potential'
      },
      {
        key: 'balance',
        value: balance,
        name: 'Cân bằng',
        name_en: 'Balance Number',
        isCore: false,
        category: 'potential'
      },
      {
        key: 'rationalThinking',
        value: rationalThinking,
        name: 'Tư duy lý trí',
        name_en: 'Rational Thought',
        isCore: false,
        category: 'mind'
      },
      {
        key: 'subconsciousPower',
        value: subconsciousPower,
        name: 'Sức mạnh tiềm thức',
        name_en: 'Subconscious Power',
        isCore: false,
        category: 'mind'
      },
      {
        key: 'passion',
        value: passion,
        name: 'Đam mê ẩn giấu',
        name_en: 'Hidden Passion',
        isCore: false,
        category: 'potential'
      },
      {
        key: 'attitude',
        value: attitude,
        name: 'Thái độ tiếp cận',
        name_en: 'Attitude / Approach',
        isCore: false,
        category: 'behavior'
      },
      {
        key: 'karmicDebts',
        value: karmicDebts.details,
        name: 'Con số Nợ nghiệp',
        name_en: 'Karmic Debts',
        isCore: false,
        category: 'karmic'
      },
      {
        key: 'missingNumbers',
        value: missingNumber.length > 0 ? missingNumber.join(', ') : 'Không thiếu',
        name: 'Bài học Số thiếu',
        name_en: 'Karmic Lessons',
        isCore: false,
        category: 'karmic'
      },
      {
        key: 'bridgeLifeMission',
        value: bridges.bridgeLifeMission,
        name: 'Cầu nối Đường đời & Sứ mệnh',
        name_en: 'Bridge Life Path - Mission',
        isCore: false,
        category: 'bridge'
      },
      {
        key: 'bridgeSoulPersonality',
        value: bridges.bridgeSoulPersonality,
        name: 'Cầu nối Linh hồn & Nhân cách',
        name_en: 'Bridge Soul - Personality',
        isCore: false,
        category: 'bridge'
      },
      {
        key: 'bridgeMaturityPassion',
        value: Number.isFinite(bridges.bridgeMaturityPassion)
          ? bridges.bridgeMaturityPassion
          : 'Đang phân tích',
        name: 'Cầu nối Trưởng thành & Đam mê',
        name_en: 'Bridge Maturity - Passion',
        isCore: false,
        category: 'bridge'
      },
      {
        key: 'yearIndividual',
        value: yearIndividual,
        name: 'Năm cá nhân',
        name_en: 'Personal Year',
        isCore: false,
        category: 'cycle'
      },
      {
        key: 'monthIndividual',
        value: monthIndividual,
        name: 'Tháng cá nhân',
        name_en: 'Personal Month',
        isCore: false,
        category: 'cycle'
      },
      {
        key: 'dayIndividual',
        value: dayIndividual,
        name: 'Ngày cá nhân',
        name_en: 'Personal Day',
        isCore: false,
        category: 'cycle'
      },
      {
        key: 'way',
        value: way,
        name: '4 Đỉnh cao cuộc đời',
        name_en: '4 Pinnacles',
        isCore: false,
        category: 'cycle'
      },
      {
        key: 'challenges',
        value: challenges,
        name: '4 Thách thức cuộc đời',
        name_en: '4 Challenges',
        isCore: false,
        category: 'cycle'
      },
      {
        key: 'arrows',
        value: activeArrows || 'Đang phân tích',
        name: '8 Mũi tên cá tính 3x3',
        name_en: 'Arrows of Individuality',
        isCore: false,
        category: 'chart'
      },
      {
        key: 'nameChart',
        value: `Tổng số ký tự: ${arrName.length}`,
        name: 'Biểu đồ tên & Tần suất',
        name_en: 'Name Chart',
        isCore: false,
        category: 'chart'
      },
      {
        key: 'birthChart',
        value: `Tổng chữ số ngày sinh: ${date + month + year}`,
        name: 'Biểu đồ ngày sinh 3x3',
        name_en: 'Birth Chart Matrix',
        isCore: false,
        category: 'chart'
      }
    ];
  }, [fullName, birthDay]);
  return data;
};
