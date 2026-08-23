/**
 * Multi-profile management hook with Supabase Cloud Sync & LocalStorage fallback.
 * Automatically synchronizes profiles to Supabase user_numerology_profiles when authenticated.
 * Max 10 profiles per user.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'numerology-profiles';
const MAX_PROFILES = 10;

export interface NumerologyProfile {
  id: string;
  name: string;
  birthDate: string;
  createdAt: string;
  userId?: string;
}

function generateProfileId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadProfilesFromStorage(): NumerologyProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveProfilesToStorage(profiles: NumerologyProfile[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function useProfiles() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<NumerologyProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync / Load profiles
  useEffect(() => {
    let isCancelled = false;

    async function initializeProfiles() {
      const localProfiles = loadProfilesFromStorage();

      if (!user) {
        if (!isCancelled) {
          setProfiles(localProfiles);
          setIsLoaded(true);
        }
        return;
      }

      // User is logged in: Fetch from Supabase
      setIsSyncing(true);
      const supabase = createClient();

      try {
        const { data: remoteProfiles, error } = await supabase
          .from('user_numerology_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[useProfiles] Failed to fetch remote profiles:', error);
          if (!isCancelled) {
            setProfiles(localProfiles);
            setIsLoaded(true);
          }
          return;
        }

        const formattedRemote: NumerologyProfile[] = (remoteProfiles || []).map((row) => ({
          id: row.id,
          name: row.name,
          birthDate: row.birth_date,
          createdAt: row.created_at,
          userId: row.user_id,
        }));

        // Merge local guest profiles if any exist that aren't on remote
        if (localProfiles.length > 0) {
          for (const local of localProfiles) {
            const alreadyExists = formattedRemote.some(
              (r) =>
                r.name.toLowerCase() === local.name.toLowerCase() &&
                r.birthDate === local.birthDate
            );

            if (!alreadyExists && formattedRemote.length < MAX_PROFILES) {
              const { data: inserted, error: insertErr } = await supabase
                .from('user_numerology_profiles')
                .insert({
                  user_id: user.id,
                  name: local.name,
                  birth_date: local.birthDate,
                })
                .select()
                .single();

              if (!insertErr && inserted) {
                formattedRemote.unshift({
                  id: inserted.id,
                  name: inserted.name,
                  birthDate: inserted.birth_date,
                  createdAt: inserted.created_at,
                  userId: inserted.user_id,
                });
              }
            }
          }
          // Clear local storage once synced
          localStorage.removeItem(STORAGE_KEY);
        }

        if (!isCancelled) {
          setProfiles(formattedRemote);
          saveProfilesToStorage(formattedRemote);
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn('[useProfiles] Cloud sync error:', err);
        if (!isCancelled) {
          setProfiles(localProfiles);
          setIsLoaded(true);
        }
      } finally {
        if (!isCancelled) {
          setIsSyncing(false);
        }
      }
    }

    initializeProfiles();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const saveProfile = useCallback(
    (
      name: string,
      birthDate: string
    ): { success: boolean; isMaxReached: boolean } => {
      const trimmedName = name.trim();
      if (!trimmedName || !birthDate) {
        return { success: false, isMaxReached: false };
      }

      // Check max limit
      const current = [...profiles];
      const existingIndex = current.findIndex(
        (p) =>
          p.name.toLowerCase() === trimmedName.toLowerCase() &&
          p.birthDate === birthDate
      );

      if (existingIndex < 0 && current.length >= MAX_PROFILES) {
        return { success: false, isMaxReached: true };
      }

      let updatedProfiles = [...current];
      if (existingIndex >= 0) {
        updatedProfiles[existingIndex] = {
          ...updatedProfiles[existingIndex],
          name: trimmedName,
          birthDate,
          createdAt: new Date().toISOString(),
        };
      } else {
        const newProfile: NumerologyProfile = {
          id: generateProfileId(),
          name: trimmedName,
          birthDate,
          createdAt: new Date().toISOString(),
          userId: user?.id,
        };
        updatedProfiles = [newProfile, ...updatedProfiles];
      }

      setProfiles(updatedProfiles);
      saveProfilesToStorage(updatedProfiles);

      if (user) {
        const supabase = createClient();
        // Check if row already exists on Supabase for this user
        supabase
          .from('user_numerology_profiles')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', trimmedName)
          .eq('birth_date', birthDate)
          .maybeSingle()
          .then(({ data: existingRemote, error: selectErr }) => {
            if (selectErr) console.warn('[useProfiles] Remote check error:', selectErr);

            if (existingRemote?.id) {
              // Update existing remote profile
              supabase
                .from('user_numerology_profiles')
                .update({
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingRemote.id)
                .then(({ error: updateErr }) => {
                  if (updateErr) console.error('[useProfiles] Cloud update error:', updateErr);
                });
            } else {
              // Insert new remote profile
              supabase
                .from('user_numerology_profiles')
                .insert({
                  user_id: user.id,
                  name: trimmedName,
                  birth_date: birthDate,
                })
                .select()
                .single()
                .then(({ data: inserted, error: insertErr }) => {
                  if (insertErr) {
                    console.error('[useProfiles] Cloud insert error:', insertErr);
                  } else if (inserted) {
                    setProfiles((prev) =>
                      prev.map((p) =>
                        p.name.toLowerCase() === trimmedName.toLowerCase() && p.birthDate === birthDate
                          ? { ...p, id: inserted.id, userId: inserted.user_id }
                          : p
                      )
                    );
                  }
                });
            }
          });
      }

      return { success: true, isMaxReached: false };
    },
    [profiles, user]
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      if (user) {
        const supabase = createClient();
        supabase
          .from('user_numerology_profiles')
          .delete()
          .eq('id', profileId)
          .then(({ error }) => {
            if (error) console.error('[useProfiles] Cloud delete error:', error);
          });
      }

      setProfiles((prev) => {
        const updated = prev.filter((p) => p.id !== profileId);
        saveProfilesToStorage(updated);
        return updated;
      });
    },
    [user]
  );

  const getProfile = useCallback(
    (profileId: string): NumerologyProfile | undefined => {
      return profiles.find((p) => p.id === profileId);
    },
    [profiles]
  );

  return useMemo(
    () => ({
      profiles,
      isLoaded,
      isSyncing,
      saveProfile,
      deleteProfile,
      getProfile,
      maxProfiles: MAX_PROFILES,
    }),
    [profiles, isLoaded, isSyncing, saveProfile, deleteProfile, getProfile]
  );
}
