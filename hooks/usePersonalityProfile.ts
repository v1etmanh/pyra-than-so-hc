'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PersonalityProfile,
  generatePersonalityProfile
} from '@/utils/personalityTypes';

const PERSONALITY_STORAGE_KEY = 'user_personality_profiles_v2';

export type PersonalityAssessmentStatus = 'completed' | 'skipped';

export type PersonalityIdentity = {
  name: string;
  birthDate: string;
};

export type PersonalityAssessmentRecord = {
  identityKey: string;
  name: string;
  birthDate: string;
  status: PersonalityAssessmentStatus;
  profile?: PersonalityProfile;
  updatedAt: number;
};

type PersonalityAssessmentStore = Record<string, PersonalityAssessmentRecord>;

function normalizeIdentityPart(value: string) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function getPersonalityIdentityKey(name: string, birthDate: string) {
  return `${normalizeIdentityPart(name)}::${birthDate.trim()}`;
}

function loadStore(): PersonalityAssessmentStore {
  if (typeof window === 'undefined') return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PERSONALITY_STORAGE_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as PersonalityAssessmentStore;
  } catch {
    return {};
  }
}

function saveStore(store: PersonalityAssessmentStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PERSONALITY_STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.warn('Failed to save personality assessment state:', error);
  }
}

export function getStoredPersonalityAssessment(identityKey: string) {
  return loadStore()[identityKey] || null;
}

export function usePersonalityProfile(identity?: PersonalityIdentity) {
  const identityKey = useMemo(
    () => identity && identity.name && identity.birthDate
      ? getPersonalityIdentityKey(identity.name, identity.birthDate)
      : '',
    [identity?.birthDate, identity?.name]
  );
  const [store, setStore] = useState<PersonalityAssessmentStore>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setIsLoaded(true);
  }, []);

  const record = identityKey ? store[identityKey] || null : null;

  const saveAnswers = useCallback((
    answers: Record<number, number>,
    targetIdentityKey = identityKey,
    identityDetails?: PersonalityIdentity
  ): PersonalityProfile => {
    const key = targetIdentityKey || 'standalone';
    const profile = generatePersonalityProfile(answers);
    const previous = loadStore();
    const [keyName = '', keyBirthDate = ''] = key.split('::');
    const next: PersonalityAssessmentStore = {
      ...previous,
      [key]: {
        identityKey: key,
        name: identityDetails?.name || previous[key]?.name || (key === 'standalone' ? '' : keyName),
        birthDate: identityDetails?.birthDate || previous[key]?.birthDate || keyBirthDate,
        status: 'completed',
        profile,
        updatedAt: Date.now()
      }
    };
    saveStore(next);
    setStore(next);
    return profile;
  }, [identityKey]);

  const skipAssessment = useCallback((
    targetIdentityKey: string,
    identityDetails: PersonalityIdentity
  ) => {
    const previous = loadStore();
    const next: PersonalityAssessmentStore = {
      ...previous,
      [targetIdentityKey]: {
        identityKey: targetIdentityKey,
        name: identityDetails.name,
        birthDate: identityDetails.birthDate,
        status: 'skipped',
        updatedAt: Date.now()
      }
    };
    saveStore(next);
    setStore(next);
  }, []);

  const resetProfile = useCallback((targetIdentityKey = identityKey) => {
    if (!targetIdentityKey) return;
    const previous = loadStore();
    delete previous[targetIdentityKey];
    saveStore(previous);
    setStore(previous);
  }, [identityKey]);

  return {
    profile: record?.profile || null,
    record,
    identityKey,
    status: record?.status || null,
    isLoaded,
    hasCompletedSurvey: record?.status === 'completed' && Boolean(record.profile?.scores),
    saveAnswers,
    skipAssessment,
    resetProfile
  };
}
