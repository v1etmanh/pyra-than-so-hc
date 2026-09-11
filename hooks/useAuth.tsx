'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'forgot' | 'new_password';
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot' | 'new_password') => void;
  closeAuthModal: () => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: AuthError | Error | null; user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  updateUserProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot' | 'new_password'>('signin');

  const fetchProfile = useCallback(
    async (userId: string, userEmail?: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          // If profile row doesn't exist yet, construct a fallback
          setProfile({
            id: userId,
            email: userEmail,
            full_name: userEmail ? userEmail.split('@')[0] : 'User',
          });
          return;
        }

        if (data) {
          setProfile(data as UserProfile);
        }
      } catch (err) {
        console.warn('[useAuth] Error fetching profile:', err);
        setProfile({
          id: userId,
          email: userEmail,
          full_name: userEmail ? userEmail.split('@')[0] : 'User',
        });
      }
    },
    [supabase]
  );

  useEffect(() => {
    let isMounted = true;

    // Check if redirected from a password recovery link
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.get('reset_password') === 'true' || url.hash.includes('type=recovery')) {
        setAuthModalMode('new_password');
        setIsAuthModalOpen(true);
      }
    }

    // Get initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setIsLoading(false);
    });

    // Listen for real-time auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setAuthModalMode('new_password');
        setIsAuthModalOpen(true);
      }

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' | 'forgot' | 'new_password' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { error };
        }

        if (data.session) {
          setSession(data.session);
          setUser(data.user);
          await fetchProfile(data.user.id, data.user.email);
          setIsAuthModalOpen(false);
        }

        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Login failed') };
      }
    },
    [supabase, fetchProfile]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/api/auth/callback?next=/account`
        : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Google login failed') };
    }
  }, [supabase]);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      try {
        const trimmedEmail = email.trim();
        const trimmedName = fullName?.trim() || trimmedEmail.split('@')[0];

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
            },
          },
        });

        if (error) {
          return { error, user: null, session: null };
        }

        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          if (data.session) {
            await fetchProfile(data.user.id, data.user.email);
            setIsAuthModalOpen(false);
          }
        }

        return { error: null, user: data.user, session: data.session };
      } catch (err) {
        return {
          error: err instanceof Error ? err : new Error('Signup failed'),
          user: null,
          session: null,
        };
      }
    },
    [supabase, fetchProfile]
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.warn('[useAuth] Sign out error:', err);
    }
  }, [supabase]);

  const deleteAccount = useCallback(async () => {
    try {
      const response = await fetch('/api/account/delete', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Account deletion failed');
      }

      Object.keys(window.localStorage)
        .filter((key) => /numerology|pyra|profile|meaning|chakra/i.test(key))
        .forEach((key) => window.localStorage.removeItem(key));
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Account deletion failed') };
    }
  }, [supabase]);

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      try {
        const redirectTo = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/auth/callback?next=/account?reset_password=true` 
          : undefined;

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });
        return { error };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Password reset request failed') };
      }
    },
    [supabase]
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        return { error };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Update password failed') };
      }
    },
    [supabase]
  );

  const updateUserProfile = useCallback(
    async (updates: { full_name?: string; avatar_url?: string }) => {
      if (!user) return { error: new Error('User not logged in') };

      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;

        // Also update auth user metadata
        await supabase.auth.updateUser({
          data: updates,
        });

        await fetchProfile(user.id, user.email);
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Update profile failed') };
      }
    },
    [supabase, user, fetchProfile]
  );

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  }, [user, fetchProfile]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signInWithPassword,
      signInWithGoogle,
      signUp,
      signOut,
      deleteAccount,
      resetPasswordForEmail,
      updatePassword,
      updateUserProfile,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      isLoading,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signInWithPassword,
      signInWithGoogle,
      signUp,
      signOut,
      deleteAccount,
      resetPasswordForEmail,
      updatePassword,
      updateUserProfile,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
