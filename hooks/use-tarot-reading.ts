'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { del, get, set } from 'idb-keyval';
import { generateUUID } from '@/lib/uuid';
import type { ProfileContext } from '@/lib/ai/types';
import type {
  DrawnTarotCard,
  StoredDrawnTarotCard,
  TarotLocale,
  TarotPhase,
  TarotFollowUp,
  TarotReadingContext,
  TarotReadingRequest,
  TarotSession,
  TarotSSEEvent
} from '@/lib/tarot/types';
import { getTarotCardRevealKey, normalizeTarotRevealKeys } from '@/lib/tarot/presentation';

const TAROT_STORE_KEY = 'numina-tarot-readings-v1';
const TAROT_ACTIVE_KEY = 'numina-tarot-active-v1';
const MAX_SESSIONS = 50;
const REQUEST_TIMEOUT_MS = 180_000;

interface UseTarotReadingReturn {
  sessions: TarotSession[];
  currentSession: TarotSession | null;
  activeSessionId: string | null;
  phase: TarotPhase;
  error: string | null;
  isRunning: boolean;
  isHydrated: boolean;
  startReading: (question: string, spreadId: string, profile?: ProfileContext) => Promise<void>;
  askFollowUp: (question: string) => Promise<void>;
  revealCard: (card: DrawnTarotCard) => void;
  revealFollowUpCard: (followUpId: string, card: DrawnTarotCard) => void;
  regenerate: () => Promise<void>;
  newReading: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
  cancel: () => void;
}

function storedCard(drawn: DrawnTarotCard): StoredDrawnTarotCard {
  return {
    cardId: drawn.card.id,
    isReversed: drawn.isReversed,
    positionId: drawn.position.id
  };
}

function readingContext(session: TarotSession): TarotReadingContext {
  return {
    originalQuestion: session.question,
    spreadId: session.spreadId,
    drawnCards: session.drawnCards.map(storedCard),
    interpretation: session.interpretation,
    priorFollowUps: session.followUps
      .filter((followUp) => followUp.status === 'done' && followUp.interpretation.trim())
      .map((followUp) => ({
        question: followUp.question,
        interpretation: followUp.interpretation,
        additionalCards: followUp.additionalCards.map(storedCard)
      }))
  };
}

function isUserCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function normalizeStoredSession(session: TarotSession): TarotSession {
  const stored = session as TarotSession & {
    revealedCardKeys?: unknown;
    followUps?: Array<TarotFollowUp & { revealedAdditionalCardKeys?: unknown }>;
  };
  const drawnCards = Array.isArray(stored.drawnCards) ? stored.drawnCards : [];
  const followUps = Array.isArray(stored.followUps) ? stored.followUps : [];

  return {
    ...stored,
    drawnCards,
    revealedCardKeys: normalizeTarotRevealKeys(drawnCards, stored.revealedCardKeys, true),
    followUps: followUps.map((followUp) => {
      const additionalCards = Array.isArray(followUp.additionalCards) ? followUp.additionalCards : [];
      return {
        ...followUp,
        additionalCards,
        revealedAdditionalCardKeys: normalizeTarotRevealKeys(
          additionalCards,
          followUp.revealedAdditionalCardKeys,
          true
        )
      };
    })
  };
}

export function useTarotReading(locale: TarotLocale): UseTarotReadingReturn {
  const [sessions, setSessions] = useState<TarotSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<TarotPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );
  const isRunning = ['drawing', 'revealing', 'deciding', 'interpreting'].includes(phase);

  const persist = useCallback((next: TarotSession[]) => {
    void set(TAROT_STORE_KEY, next).catch((persistError) => {
      console.error('[Tarot] Could not save reading history', persistError);
    });
  }, []);

  const patchSession = useCallback((
    id: string,
    updater: (session: TarotSession) => TarotSession
  ) => {
    setSessions((previous) => {
      let changed = false;
      const next = previous.map((session) => {
        if (session.id !== id) return session;
        const updated = updater(session);
        if (updated === session) return session;
        changed = true;
        return { ...updated, updatedAt: new Date().toISOString() };
      });
      if (!changed) return previous;
      persist(next);
      return next;
    });
  }, [persist]);

  useEffect(() => {
    let mounted = true;
    Promise.all([get<TarotSession[]>(TAROT_STORE_KEY), get<string>(TAROT_ACTIVE_KEY)])
      .then(([storedSessions, storedActive]) => {
        if (!mounted) return;
        const validSessions = Array.isArray(storedSessions)
          ? storedSessions
            .filter((session) => session && typeof session.id === 'string')
            .slice(0, MAX_SESSIONS)
            .map(normalizeStoredSession)
          : [];
        setSessions(validSessions);
        if (validSessions.length > 0) void set(TAROT_STORE_KEY, validSessions).catch(console.error);
        const nextActive = storedActive && validSessions.some((session) => session.id === storedActive)
          ? storedActive
          : validSessions[0]?.id ?? null;
        setActiveSessionId(nextActive);
        setPhase(nextActive ? 'ready' : 'idle');
      })
      .catch((loadError) => console.error('[Tarot] Could not load reading history', loadError))
      .finally(() => {
        if (mounted) setIsHydrated(true);
      });
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (activeSessionId) void set(TAROT_ACTIVE_KEY, activeSessionId).catch(console.error);
  }, [activeSessionId]);

  const runRequest = useCallback(async (
    body: TarotReadingRequest,
    onEvent: (event: TarotSSEEvent) => void
  ): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('/api/tarot/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      if (!response.ok) {
        let message = locale === 'vi' ? 'NUMELYRA chưa thể bắt đầu trải bài.' : 'NUMELYRA could not begin the reading.';
        try {
          const payload = await response.json() as { error?: string; code?: string };
          if (payload.code === 'DAILY_LIMIT_REACHED') {
            message = locale === 'vi'
              ? 'Bạn đã dùng hết lượt luận giải hôm nay. Hãy quay lại ngày mai hoặc nâng cấp Pro.'
              : 'You have used all readings for today. Return tomorrow or upgrade to Pro.';
          } else if (payload.code === 'RATE_LIMITED') {
            message = locale === 'vi' ? 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng thử lại sau.' : 'You are sending requests too quickly. Please try again later.';
          } else if (payload.error) {
            message = payload.error;
          }
        } catch {
          // Keep the localized fallback.
        }
        throw new Error(message);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error(locale === 'vi' ? 'Không nhận được luồng trả lời.' : 'No response stream was returned.');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const event = JSON.parse(raw) as TarotSSEEvent;
            if (event.type === 'error') throw new Error(event.message);
            onEvent(event);
          } catch (parseError) {
            if (parseError instanceof SyntaxError) continue;
            throw parseError;
          }
        }
      }
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        if (!timedOut) {
          const cancellation = new Error(locale === 'vi' ? 'Đã dừng luận giải.' : 'The reading was stopped.');
          cancellation.name = 'AbortError';
          throw cancellation;
        }
        throw new Error(locale === 'vi' ? 'NUMELYRA phản hồi quá lâu. Vui lòng thử lại.' : 'NUMELYRA took too long to respond. Please try again.');
      }
      throw requestError;
    } finally {
      window.clearTimeout(timeout);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [locale]);

  const startReading = useCallback(async (
    question: string,
    spreadId: string,
    profile?: ProfileContext
  ) => {
    const trimmed = question.trim();
    if (trimmed.length < 3 || isRunning) return;
    const id = generateUUID();
    const now = new Date().toISOString();
    const session: TarotSession = {
      id,
      title: trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed,
      question: trimmed,
      spreadId,
      spread: null,
      drawnCards: [],
      revealedCardKeys: [],
      interpretation: '',
      followUps: [],
      profile,
      locale,
      createdAt: now,
      updatedAt: now
    };
    setSessions((previous) => {
      const next = [session, ...previous].slice(0, MAX_SESSIONS);
      persist(next);
      return next;
    });
    setActiveSessionId(id);
    setError(null);
    setPhase('drawing');

    try {
      await runRequest({ mode: 'initial', question: trimmed, spreadId, profile, language: locale }, (event) => {
        if (event.type === 'status') setPhase(event.phase);
        if (event.type === 'reading') {
          patchSession(id, (current) => ({ ...current, spread: event.spread, drawnCards: event.cards }));
          setPhase('revealing');
        }
        if (event.type === 'content') {
          setPhase('interpreting');
          patchSession(id, (current) => ({ ...current, interpretation: current.interpretation + event.content }));
        }
        if (event.type === 'done') setPhase('ready');
      });
      setPhase('ready');
    } catch (readingError) {
      if (isUserCancellation(readingError)) return;
      const message = readingError instanceof Error ? readingError.message : (locale === 'vi' ? 'Đã xảy ra lỗi.' : 'An error occurred.');
      setError(message);
      setPhase('error');
    }
  }, [isRunning, locale, patchSession, persist, runRequest]);

  const askFollowUp = useCallback(async (question: string) => {
    const trimmed = question.trim();
    const session = currentSession;
    if (!session || !session.spread || !session.interpretation || trimmed.length < 3 || isRunning) return;
    const followUpId = generateUUID();
    patchSession(session.id, (current) => ({
      ...current,
      followUps: [...current.followUps, {
        id: followUpId,
        question: trimmed,
        decision: null,
        reason: '',
        additionalCards: [],
        revealedAdditionalCardKeys: [],
        interpretation: '',
        status: 'running',
        error: null,
        createdAt: new Date().toISOString()
      }]
    }));
    setError(null);
    setPhase('deciding');

    try {
      await runRequest({
        mode: 'follow-up',
        question: trimmed,
        language: locale,
        reading: readingContext(session),
        profile: session.profile
      }, (event) => {
        if (event.type === 'status') setPhase(event.phase);
        if (event.type === 'follow_up_decision') {
          patchSession(session.id, (current) => ({
            ...current,
            followUps: current.followUps.map((item) => item.id === followUpId
              ? { ...item, decision: event.decision, reason: event.reason }
              : item)
          }));
        }
        if (event.type === 'supplementary_cards') {
          setPhase('revealing');
          patchSession(session.id, (current) => ({
            ...current,
            followUps: current.followUps.map((item) => item.id === followUpId
              ? { ...item, additionalCards: event.cards }
              : item)
          }));
        }
        if (event.type === 'content') {
          setPhase('interpreting');
          patchSession(session.id, (current) => ({
            ...current,
            followUps: current.followUps.map((item) => item.id === followUpId
              ? { ...item, interpretation: item.interpretation + event.content }
              : item)
          }));
        }
        if (event.type === 'done') {
          patchSession(session.id, (current) => ({
            ...current,
            followUps: current.followUps.map((item) => item.id === followUpId
              ? { ...item, status: 'done' }
              : item)
          }));
          setPhase('ready');
        }
      });
      setPhase('ready');
    } catch (followUpError) {
      const message = followUpError instanceof Error ? followUpError.message : (locale === 'vi' ? 'Không thể trả lời câu hỏi tiếp theo.' : 'Could not answer the follow-up.');
      patchSession(session.id, (current) => ({
        ...current,
        followUps: current.followUps.map((item) => item.id === followUpId
          ? { ...item, status: 'error', error: message }
          : item)
      }));
      if (isUserCancellation(followUpError)) return;
      setError(message);
      setPhase('error');
    }
  }, [currentSession, isRunning, locale, patchSession, runRequest]);

  const revealCard = useCallback((card: DrawnTarotCard) => {
    const session = currentSession;
    if (!session) return;
    const key = getTarotCardRevealKey(card);
    patchSession(session.id, (current) => {
      if (!current.drawnCards.some((drawn) => getTarotCardRevealKey(drawn) === key)) return current;
      const revealedCardKeys = current.revealedCardKeys ?? [];
      if (revealedCardKeys.includes(key)) return current;
      return { ...current, revealedCardKeys: [...revealedCardKeys, key] };
    });
  }, [currentSession, patchSession]);

  const revealFollowUpCard = useCallback((followUpId: string, card: DrawnTarotCard) => {
    const session = currentSession;
    if (!session) return;
    const key = getTarotCardRevealKey(card);
    patchSession(session.id, (current) => {
      const followUp = current.followUps.find((item) => item.id === followUpId);
      if (!followUp || !followUp.additionalCards.some((drawn) => getTarotCardRevealKey(drawn) === key)) return current;
      const revealedKeys = followUp.revealedAdditionalCardKeys ?? [];
      if (revealedKeys.includes(key)) return current;
      return {
        ...current,
        followUps: current.followUps.map((item) => item.id === followUpId
          ? { ...item, revealedAdditionalCardKeys: [...revealedKeys, key] }
          : item)
      };
    });
  }, [currentSession, patchSession]);

  const regenerate = useCallback(async () => {
    const session = currentSession;
    if (!session || !session.spread || !session.drawnCards.length || isRunning) return;
    const context = readingContext(session);
    const previousInterpretation = session.interpretation;
    patchSession(session.id, (current) => ({ ...current, interpretation: '' }));
    setError(null);
    setPhase('interpreting');
    try {
      await runRequest({ mode: 'regenerate', language: locale, reading: context, profile: session.profile }, (event) => {
        if (event.type === 'status') setPhase(event.phase);
        if (event.type === 'content') {
          patchSession(session.id, (current) => ({ ...current, interpretation: current.interpretation + event.content }));
        }
        if (event.type === 'done') setPhase('ready');
      });
      setPhase('ready');
    } catch (regenerateError) {
      patchSession(session.id, (current) => ({ ...current, interpretation: previousInterpretation }));
      if (isUserCancellation(regenerateError)) return;
      const message = regenerateError instanceof Error ? regenerateError.message : (locale === 'vi' ? 'Không thể luận giải lại.' : 'Could not regenerate the reading.');
      setError(message);
      setPhase('error');
    }
  }, [currentSession, isRunning, locale, patchSession, runRequest]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase(currentSession ? 'ready' : 'idle');
  }, [currentSession]);

  const newReading = useCallback(() => {
    cancel();
    setActiveSessionId(null);
    setError(null);
    setPhase('idle');
    void del(TAROT_ACTIVE_KEY).catch(console.error);
  }, [cancel]);

  const switchSession = useCallback((id: string) => {
    cancel();
    if (!sessions.some((session) => session.id === id)) return;
    setActiveSessionId(id);
    setError(null);
    setPhase('ready');
  }, [cancel, sessions]);

  const deleteSession = useCallback((id: string) => {
    if (isRunning) return;
    setSessions((previous) => {
      const next = previous.filter((session) => session.id !== id);
      persist(next);
      if (activeSessionId === id) {
        const nextId = next[0]?.id ?? null;
        setActiveSessionId(nextId);
        setPhase(nextId ? 'ready' : 'idle');
      }
      return next;
    });
  }, [activeSessionId, isRunning, persist]);

  const clearHistory = useCallback(() => {
    if (isRunning) return;
    setSessions([]);
    setActiveSessionId(null);
    setError(null);
    setPhase('idle');
    void Promise.all([del(TAROT_STORE_KEY), del(TAROT_ACTIVE_KEY)]).catch(console.error);
  }, [isRunning]);

  return {
    sessions,
    currentSession,
    activeSessionId,
    phase,
    error,
    isRunning,
    isHydrated,
    startReading,
    askFollowUp,
    revealCard,
    revealFollowUpCard,
    regenerate,
    newReading,
    switchSession,
    deleteSession,
    clearHistory,
    cancel
  };
}
