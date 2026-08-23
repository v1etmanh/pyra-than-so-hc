import dayjs from 'dayjs';

const reduceToSingleDigit = (num: number | string): number => {
  let sum = Number(num);
  while (sum > 9) {
    sum = String(sum)
      .split('')
      .reduce((a, b) => a + Number(b), 0);
  }
  return sum;
};

export const getAttitude = (birthDay: string): number => {
  const date = dayjs(birthDay).format('DD');
  const month = dayjs(birthDay).format('MM');
  const dateRoot = reduceToSingleDigit(date);
  const monthRoot = reduceToSingleDigit(month);
  return reduceToSingleDigit(dateRoot + monthRoot);
};
