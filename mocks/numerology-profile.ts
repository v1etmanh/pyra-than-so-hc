import type { MockNumerologyIndicator } from './numerology-indicators';

export type NumerologyProfile24 = Record<string, string | number>;

/** Default profile used by the MVP when the real calculated profile is absent. */
export const MOCK_USER_PROFILE_24: NumerologyProfile24 = {
  walksOfLife: 7,
  mission: 3,
  soul: 6,
  personality: 1,
  dateOfBirth: 2,
  mature: 1,
  balance: 5,
  rationalThinking: 7,
  subconsciousPower: 6,
  passion: 3,
  attitude: 4,
  karmicDebts: '13/4',
  missingNumbers: '2, 8',
  bridgeLifeMission: 2,
  bridgeSoulPersonality: 5,
  bridgeMaturityPassion: 2,
  yearIndividual: 8,
  monthIndividual: 4,
  dayIndividual: 6,
  way: '8 - 7 - 6 - 11',
  challenges: '5 - 6 - 1 - 1',
  arrows: 'Quyết tâm; Trí tuệ',
  nameChart: '13 ký tự',
  birthChart: '3 × 3'
};

export function normalizeNumerologyProfile(input: unknown): {
  profile: NumerologyProfile24;
  usedMock: boolean;
} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { profile: { ...MOCK_USER_PROFILE_24 }, usedMock: true };
  }

  const candidate = input as Record<string, unknown>;
  const profile: NumerologyProfile24 = {};
  for (const key of Object.keys(MOCK_USER_PROFILE_24)) {
    const value = candidate[key];
    if (typeof value === 'string' || typeof value === 'number') {
      profile[key] = value;
    } else {
      profile[key] = MOCK_USER_PROFILE_24[key];
    }
  }
  return { profile, usedMock: false };
}

export function profileToIndicatorValues(
  indicators: MockNumerologyIndicator[],
  profile: NumerologyProfile24
): Array<{ indicator: MockNumerologyIndicator; value: string | number }> {
  return indicators.map((indicator) => ({
    indicator,
    value: profile[indicator.key] ?? indicator.mockValue
  }));
}
