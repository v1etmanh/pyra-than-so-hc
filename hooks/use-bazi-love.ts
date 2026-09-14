'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { del, get, set } from 'idb-keyval';
import { generateUUID } from '@/lib/uuid';
import type {
  BaziCompatibilityResult,
  BaziLoveChatMessage,
  BaziLoveLocale,
  BaziLovePersonInput,
  BaziLovePhase,
  BaziLoveReadingRequest,
  BaziLoveSession,
  BaziLoveSSEEvent
} from '@/lib/bazi-love/types';

const BAZI_LOVE_STORE_KEY = 'numina-bazi-love-sessions-v1';
const BAZI_LOVE_ACTIVE_KEY = 'numina-bazi-love-active-v1';
const MAX_SESSIONS = 50;
const REQUEST_TIMEOUT_MS = 180_000;

export interface UseBaziLoveReturn {
  sessions: BaziLoveSession[];
  currentSession: BaziLoveSession | null;
  activeSessionId: string | null;
  phase: BaziLovePhase;
  statusMessage: string;
  error: string | null;
  isRunning: boolean;
  isHydrated: boolean;
  startReading: (
    people: [BaziLovePersonInput, BaziLovePersonInput],
    question?: string
  ) => Promise<void>;
  askFollowUp: (question: string) => Promise<void>;
  regenerate: () => Promise<void>;
  newReading: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  clearHistory: () => void;
  cancel: () => void;
}

function isUserCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function useBaziLove(locale: BaziLoveLocale): UseBaziLoveReturn {
  const [sessions, setSessions] = useState<BaziLoveSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<BaziLovePhase>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionsRef = useRef<BaziLoveSession[]>([]);
  sessionsRef.current = sessions;

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedSessions, savedActiveId] = await Promise.all([
          get<BaziLoveSession[]>(BAZI_LOVE_STORE_KEY),
          get<string>(BAZI_LOVE_ACTIVE_KEY)
        ]);
        if (!active) return;
        const list = Array.isArray(savedSessions) ? savedSessions : [];
        setSessions(list);
        if (savedActiveId && list.some((s) => s.id === savedActiveId)) {
          setActiveSessionId(savedActiveId);
        } else if (list.length > 0) {
          setActiveSessionId(list[0].id);
        }
      } catch (err) {
        console.warn('[useBaziLove] Failed to load sessions from IndexedDB:', err);
      } finally {
        if (active) setIsHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist sessions to IndexedDB whenever updated
  const persistSessions = useCallback(async (updated: BaziLoveSession[], activeId: string | null) => {
    setSessions(updated);
    setActiveSessionId(activeId);
    try {
      await Promise.all([
        set(BAZI_LOVE_STORE_KEY, updated.slice(0, MAX_SESSIONS)),
        activeId ? set(BAZI_LOVE_ACTIVE_KEY, activeId) : del(BAZI_LOVE_ACTIVE_KEY)
      ]);
    } catch (err) {
      console.warn('[useBaziLove] Failed to persist to IndexedDB:', err);
    }
  }, []);

  const currentSession = useMemo(() => {
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPhase('idle');
    setStatusMessage('');
  }, []);

  const streamReading = useCallback(
    async (
      payload: BaziLoveReadingRequest,
      onCompatibility: (compat: BaziCompatibilityResult) => void,
      onContent: (chunk: string) => void
    ): Promise<void> => {
      cancel();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch('/api/bazi-love/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (!res.ok) {
          let errMsg = 'Failed to request Bazi analysis';
          try {
            const data = await res.json();
            errMsg = data.error || errMsg;
          } catch {
            /* ignore */
          }
          throw new Error(errMsg);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('Response stream unavailable');

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
            const rawData = line.slice(6).trim();
            if (!rawData || rawData === '[DONE]') continue;

            try {
              const event = JSON.parse(rawData) as BaziLoveSSEEvent;
              if (event.type === 'status') {
                setPhase(event.phase);
                setStatusMessage(event.message);
              } else if (event.type === 'compatibility') {
                onCompatibility(event.result);
              } else if (event.type === 'content') {
                onContent(event.content);
              } else if (event.type === 'error') {
                throw new Error(event.message);
              } else if (event.type === 'done') {
                // finished
              }
            } catch (parseErr) {
              if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
                throw parseErr;
              }
            }
          }
        }
      } finally {
        clearTimeout(timeoutId);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [cancel]
  );

  const startReading = useCallback(
    async (people: [BaziLovePersonInput, BaziLovePersonInput], question?: string) => {
      setError(null);
      setPhase('calculating');
      setStatusMessage(locale === 'vi' ? 'Đang tính toán lá số Bát Tự…' : 'Calculating Bazi charts…');

      const sessionId = generateUUID();
      const now = new Date().toISOString();
      const title = `${people[0].name} & ${people[1].name}`;

      let currentCompat: BaziCompatibilityResult | null = null;
      let currentInterpretation = '';

      const newSession: BaziLoveSession = {
        id: sessionId,
        title,
        people,
        originalQuestion: question || '',
        compatibility: null,
        interpretation: '',
        messages: [],
        locale,
        createdAt: now,
        updatedAt: now
      };

      // Set active immediately
      const initialUpdated = [newSession, ...sessionsRef.current.filter((s) => s.id !== sessionId)];
      await persistSessions(initialUpdated, sessionId);

      try {
        await streamReading(
          {
            mode: 'initial',
            people,
            language: locale,
            question
          },
          (compat) => {
            currentCompat = compat;
            setSessions((prev) =>
              prev.map((s) => (s.id === sessionId ? { ...s, compatibility: compat } : s))
            );
          },
          (chunk) => {
            currentInterpretation += chunk;
            setSessions((prev) =>
              prev.map((s) =>
                s.id === sessionId ? { ...s, interpretation: currentInterpretation } : s
              )
            );
          }
        );

        setPhase('ready');
        setStatusMessage('');

        const finalSession: BaziLoveSession = {
          ...newSession,
          compatibility: currentCompat,
          interpretation: currentInterpretation,
          updatedAt: new Date().toISOString()
        };
        const finalSessions = [finalSession, ...sessionsRef.current.filter((s) => s.id !== sessionId)];
        await persistSessions(finalSessions, sessionId);
      } catch (err) {
        if (isUserCancellation(err)) return;
        setPhase('error');
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setError(msg);
      }
    },
    [locale, persistSessions, streamReading]
  );

  const askFollowUp = useCallback(
    async (question: string) => {
      if (!currentSession || !currentSession.compatibility) return;
      const cleanQ = question.trim();
      if (!cleanQ) return;

      setError(null);
      setPhase('interpreting');
      setStatusMessage(locale === 'vi' ? 'NUMELYRA đang phân tích câu hỏi…' : 'NUMELYRA is responding…');

      const userMsg: BaziLoveChatMessage = {
        id: generateUUID(),
        role: 'user',
        content: cleanQ,
        createdAt: new Date().toISOString()
      };

      const assistantMsgId = generateUUID();
      const assistantMsg: BaziLoveChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: new Date().toISOString()
      };

      const updatedMessages = [...currentSession.messages, userMsg, assistantMsg];
      const sessionWithDraft: BaziLoveSession = {
        ...currentSession,
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      };

      const intermediate = sessionsRef.current.map((s) =>
        s.id === currentSession.id ? sessionWithDraft : s
      );
      await persistSessions(intermediate, currentSession.id);

      let streamedText = '';

      try {
        const historyPayload = currentSession.messages.map((m) => ({
          role: m.role,
          content: m.content
        }));

        await streamReading(
          {
            mode: 'follow-up',
            people: currentSession.people,
            language: locale,
            question: cleanQ,
            history: historyPayload
          },
          () => {},
          (chunk) => {
            streamedText += chunk;
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id !== currentSession.id) return s;
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: streamedText } : m
                  )
                };
              })
            );
          }
        );

        setPhase('ready');
        setStatusMessage('');

        const finalSession: BaziLoveSession = {
          ...currentSession,
          messages: updatedMessages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: streamedText, status: 'done' } : m
          ),
          updatedAt: new Date().toISOString()
        };

        const finalSessions = sessionsRef.current.map((s) =>
          s.id === currentSession.id ? finalSession : s
        );
        await persistSessions(finalSessions, currentSession.id);
      } catch (err) {
        if (isUserCancellation(err)) return;
        setPhase('error');
        const msg = err instanceof Error ? err.message : 'Follow-up failed';
        setError(msg);

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== currentSession.id) return s;
            return {
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, status: 'error', error: msg } : m
              )
            };
          })
        );
      }
    },
    [currentSession, locale, persistSessions, streamReading]
  );

  const regenerate = useCallback(async () => {
    if (!currentSession) return;
    setError(null);
    setPhase('interpreting');
    setStatusMessage(locale === 'vi' ? 'Đang tạo một góc nhìn mới…' : 'Generating a fresh perspective…');

    let newInterpretation = '';

    try {
      await streamReading(
        {
          mode: 'regenerate',
          people: currentSession.people,
          language: locale,
          question: currentSession.originalQuestion
        },
        (compat) => {
          setSessions((prev) =>
            prev.map((s) => (s.id === currentSession.id ? { ...s, compatibility: compat } : s))
          );
        },
        (chunk) => {
          newInterpretation += chunk;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSession.id ? { ...s, interpretation: newInterpretation } : s
            )
          );
        }
      );

      setPhase('ready');
      setStatusMessage('');

      const updatedSession: BaziLoveSession = {
        ...currentSession,
        interpretation: newInterpretation,
        updatedAt: new Date().toISOString()
      };

      const updated = sessionsRef.current.map((s) =>
        s.id === currentSession.id ? updatedSession : s
      );
      await persistSessions(updated, currentSession.id);
    } catch (err) {
      if (isUserCancellation(err)) return;
      setPhase('error');
      const msg = err instanceof Error ? err.message : 'Regeneration failed';
      setError(msg);
    }
  }, [currentSession, locale, persistSessions, streamReading]);

  const newReading = useCallback(() => {
    cancel();
    setError(null);
    setPhase('idle');
    setStatusMessage('');
    setActiveSessionId(null);
  }, [cancel]);

  const switchSession = useCallback((id: string) => {
    cancel();
    setError(null);
    setPhase('ready');
    setStatusMessage('');
    setActiveSessionId(id);
    set(BAZI_LOVE_ACTIVE_KEY, id).catch(() => {});
  }, [cancel]);

  const deleteSession = useCallback(
    async (id: string) => {
      const remaining = sessionsRef.current.filter((s) => s.id !== id);
      const nextActiveId = activeSessionId === id ? (remaining[0]?.id ?? null) : activeSessionId;
      await persistSessions(remaining, nextActiveId);
      if (!nextActiveId) {
        setPhase('idle');
      }
    },
    [activeSessionId, persistSessions]
  );

  const clearHistory = useCallback(async () => {
    cancel();
    await Promise.all([del(BAZI_LOVE_STORE_KEY), del(BAZI_LOVE_ACTIVE_KEY)]);
    setSessions([]);
    setActiveSessionId(null);
    setPhase('idle');
    setStatusMessage('');
    setError(null);
  }, [cancel]);

  const isRunning = phase === 'calculating' || phase === 'interpreting';

  return {
    sessions,
    currentSession,
    activeSessionId,
    phase,
    statusMessage,
    error,
    isRunning,
    isHydrated,
    startReading,
    askFollowUp,
    regenerate,
    newReading,
    switchSession,
    deleteSession,
    clearHistory,
    cancel
  };
}
