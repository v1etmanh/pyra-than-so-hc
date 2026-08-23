import { removeAccents } from '../removeAccents';
import { getValueInAlphabets } from './getValueInAlphabets';
import dayjs from 'dayjs';

export interface KarmicDebtResult {
  debts: string[];
  details: string;
}

const reduceNum = (n: number | string): number => {
  let val = Number(n);
  while (val > 9 && val !== 11 && val !== 22 && val !== 33) {
    val = String(val).split('').reduce((acc, digit) => acc + Number(digit), 0);
  }
  return val;
};

export const getKarmicDebts = (birthDay: string, fullName: string): KarmicDebtResult => {
  const debts = new Set<string>();
  const dateStr = dayjs(birthDay).format('DD');
  const monthStr = dayjs(birthDay).format('MM');
  const yearStr = dayjs(birthDay).format('YYYY');

  const dayNum = parseInt(dateStr, 10);
  if ([13, 14, 16, 19].includes(dayNum)) {
    if (dayNum === 13) debts.add('13/4');
    if (dayNum === 14) debts.add('14/5');
    if (dayNum === 16) debts.add('16/7');
    if (dayNum === 19) debts.add('19/1');
  }

  // Check Life path unreduced sum
  const dSum = dateStr.split('').reduce((a, b) => a + Number(b), 0);
  const mSum = monthStr.split('').reduce((a, b) => a + Number(b), 0);
  const ySum = yearStr.split('').reduce((a, b) => a + Number(b), 0);
  const lifePathRaw = dSum + mSum + ySum;
  if ([13, 14, 16, 19].includes(lifePathRaw)) {
    if (lifePathRaw === 13) debts.add('13/4');
    if (lifePathRaw === 14) debts.add('14/5');
    if (lifePathRaw === 16) debts.add('16/7');
    if (lifePathRaw === 19) debts.add('19/1');
  }

  // Check Name letters
  const cleanName = removeAccents(fullName.toUpperCase()).replace(/[^A-Z]/g, '');
  let nameSum = 0;
  for (let i = 0; i < cleanName.length; i++) {
    nameSum += getValueInAlphabets(cleanName[i]);
  }
  if ([13, 14, 16, 19].includes(nameSum)) {
    if (nameSum === 13) debts.add('13/4');
    if (nameSum === 14) debts.add('14/5');
    if (nameSum === 16) debts.add('16/7');
    if (nameSum === 19) debts.add('19/1');
  }

  const debtList = Array.from(debts);
  return {
    debts: debtList,
    details: debtList.length > 0 ? debtList.join(', ') : 'Không có nợ nghiệp'
  };
};
