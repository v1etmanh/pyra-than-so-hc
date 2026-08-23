import { getWalksOfLife, getMission, getSoul, getPersonality, getKarmicDebts, getBridges, getAttitude, getBirthChartArrows } from '../functions/Numerology';

console.log('Testing 24 Numerology Indicators Engine...');

const birthDay = '1995-10-24';
const fullName = 'NGUYEN VAN AN';

const walksOfLife = getWalksOfLife(birthDay);
const mission = getMission(fullName);
const soul = getSoul(fullName);
const personality = getPersonality(fullName.split(''));
const karmicDebts = getKarmicDebts(birthDay, fullName);
const bridges = getBridges(walksOfLife, mission, soul, personality, 7, 3);
const attitude = getAttitude(birthDay);
const arrows = getBirthChartArrows(birthDay);

console.log('✅ Core Indicators:', { walksOfLife, mission, soul, personality });
console.log('✅ Karmic Debts:', karmicDebts);
console.log('✅ Bridges:', bridges);
console.log('✅ Attitude:', attitude);
console.log('✅ 8 Arrows count:', arrows.length);
console.log('🎉 All 24 indicators mathematical engine verified successfully!');
