export interface BridgeResults {
  bridgeLifeMission: number;
  bridgeSoulPersonality: number;
  bridgeMaturityPassion: number;
}

const reduceToSingleDigit = (num: number | string): number => {
  let sum = Number(num);
  while (sum > 9) {
    sum = String(sum)
      .split('')
      .reduce((a, b) => a + Number(b), 0);
  }
  return sum;
};

export const getBridges = (
  walksOfLife: number | string,
  mission: number | string,
  soul: number | string,
  personality: number | string,
  mature: number | string,
  passion: number | string
): BridgeResults => {
  const rWalk = reduceToSingleDigit(walksOfLife);
  const rMission = reduceToSingleDigit(mission);
  const rSoul = reduceToSingleDigit(soul);
  const rPersonality = reduceToSingleDigit(personality);
  const rMature = reduceToSingleDigit(mature);
  const rPassion = reduceToSingleDigit(passion);

  return {
    bridgeLifeMission: Math.abs(rWalk - rMission),
    bridgeSoulPersonality: Math.abs(rSoul - rPersonality),
    bridgeMaturityPassion: Math.abs(rMature - rPassion),
  };
};
