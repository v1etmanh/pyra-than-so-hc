import dayjs from 'dayjs';

export interface ArrowDetection {
  code: string;
  name: string;
  hasArrow: boolean;
  isEmpty: boolean;
  type: 'strength' | 'weakness' | 'none';
}

export const getBirthChartArrows = (birthDay: string): ArrowDetection[] => {
  const dateFormatted = dayjs(birthDay).format('DDMMYYYY');
  const digits = dateFormatted.split('').map(Number);
  const counts: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) {
    counts[i] = 0;
  }
  digits.forEach((d) => {
    if (d >= 1 && d <= 9) {
      counts[d] = (counts[d] || 0) + 1;
    }
  });

  const checkArrow = (n1: number, n2: number, n3: number, code: string, name: string): ArrowDetection => {
    const hasAll = counts[n1] > 0 && counts[n2] > 0 && counts[n3] > 0;
    const emptyAll = counts[n1] === 0 && counts[n2] === 0 && counts[n3] === 0;

    let type: 'strength' | 'weakness' | 'none' = 'none';
    if (hasAll) type = 'strength';
    else if (emptyAll) type = 'weakness';

    return {
      code,
      name,
      hasArrow: hasAll,
      isEmpty: emptyAll,
      type
    };
  };

  return [
    checkArrow(1, 4, 7, '1-4-7', 'Thực tế (1-4-7) / Hỗn độn'),
    checkArrow(2, 5, 8, '2-5-8', 'Cân bằng Cảm xúc (2-5-8) / Nhạy cảm'),
    checkArrow(3, 6, 9, '3-6-9', 'Sáng trí (3-6-9) / Trí nhớ ngắn hạn'),
    checkArrow(1, 2, 3, '1-2-3', 'Kế hoạch (1-2-3) / Tùy hứng'),
    checkArrow(4, 5, 6, '4-5-6', 'Ý chí (4-5-6) / Uất hận'),
    checkArrow(7, 8, 9, '7-8-9', 'Hoạt động (7-8-9) / Thụ động'),
    checkArrow(1, 5, 9, '1-5-9', 'Quyết tâm (1-5-9) / Trì hoãn'),
    checkArrow(3, 5, 7, '3-5-7', 'Tâm linh (3-5-7) / Hoài nghi')
  ];
};
