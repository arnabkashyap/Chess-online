'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** The current Supabase user (null when signed out). */
  user: User | null;
  /** The current Supabase session (null when signed out). */
  session: Session | null;
  /** True while the initial session is being restored. */
  loading: boolean;
  /** True if the current user signed in anonymously (guest). */
  isGuest: boolean;

  /** Sign in as an anonymous guest. */
  signInAsGuest: () => Promise<void>;
  /** Sign in with Google OAuth (redirects to Google). */
  signInWithGoogle: () => Promise<void>;
  /** Sign in with Facebook OAuth (redirects to Facebook). */
  signInWithFacebook: () => Promise<void>;
  /** Link existing guest account with Google OAuth (preserves all user data). */
  linkGoogleAccount: () => Promise<void>;
  /** Link existing guest account with Facebook OAuth (preserves all user data). */
  linkFacebookAccount: () => Promise<void>;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize the supabase client so it's created once per mount
  const supabase = useMemo(() => createClient(), []);

  // ── Bootstrap: restore session + subscribe to auth changes ────────────────

  useEffect(() => {
    // 1. Get the current session (might already exist from cookies/middleware)
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for sign-in / sign-out / token-refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const isGuest = useMemo(() => {
    if (!user) return false;
    // Supabase marks anonymous sign-ins with is_anonymous on the user object
    return user.is_anonymous === true;
  }, [user]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const signInAsGuest = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('[Auth] Guest sign-in failed:', error.message);
      throw error;
    }
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('[Auth] Google sign-in failed:', error.message);
      throw error;
    }
  }, [supabase]);

  const signInWithFacebook = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('[Auth] Facebook sign-in failed:', error.message);
      throw error;
    }
  }, [supabase]);

  const linkGoogleAccount = useCallback(async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });
    if (error) {
      console.error('[Auth] Link Google failed:', error.message);
      throw error;
    }
  }, [supabase]);

  const linkFacebookAccount = useCallback(async () => {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      },
    });
    if (error) {
      console.error('[Auth] Link Facebook failed:', error.message);
      throw error;
    }
  }, [supabase]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Auth] Sign-out failed:', error.message);
      throw error;
    }
  }, [supabase]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isGuest,
      signInAsGuest,
      signInWithGoogle,
      signInWithFacebook,
      linkGoogleAccount,
      linkFacebookAccount,
      signOut,
    }),
    [
      user,
      session,
      loading,
      isGuest,
      signInAsGuest,
      signInWithGoogle,
      signInWithFacebook,
      linkGoogleAccount,
      linkFacebookAccount,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Access the auth context from any client component.
 *
 * @example
 * const { user, isGuest, signInWithGoogle, signOut } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth() must be used within an <AuthProvider>.');
  }
  return context;
}
