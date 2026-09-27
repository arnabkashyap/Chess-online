'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Snowflake,
  Shield,
  Wind,
  User,
  Chrome,
  Facebook,
  Loader2,
  AlertCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInAsGuest, signInWithGoogle, signInWithFacebook } = useAuth();

  const [actionLoading, setActionLoading] = useState<string | null>(null); // 'guest' | 'google' | 'facebook'
  const [error, setError] = useState<string | null>(null);

  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const handleAction = async (action: 'guest' | 'google' | 'facebook') => {
    setError(null);
    setActionLoading(action);
    try {
      if (action === 'guest') {
        await signInAsGuest();
        // Guest sign-in resolves immediately — auth state triggers redirect
      } else if (action === 'google') {
        await signInWithGoogle();
        // OAuth redirects away from the page
      } else if (action === 'facebook') {
        await signInWithFacebook();
        // OAuth redirects away from the page
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
      setActionLoading(null);
    }
  };

  // Full-screen loading while checking initial auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Loading Element Chess...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-2/3 left-1/3 w-60 h-60 bg-purple-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-10 right-1/4 w-48 h-48 bg-emerald-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Main Card */}
        <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-purple-500/20 border border-slate-700 shadow-lg mb-4">
              <Flame className="w-6 h-6 text-orange-400 animate-pulse" />
              <Snowflake className="w-6 h-6 text-cyan-400 animate-pulse -ml-1" />
              <Shield className="w-6 h-6 text-emerald-400 animate-pulse -ml-1" />
              <Wind className="w-6 h-6 text-purple-400 animate-pulse -ml-1" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-cyan-400 tracking-wider uppercase leading-none drop-shadow-md text-center">
              Element Chess
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-2">
              Tactical Hazard Strategy Arena
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <Sparkles className="w-4 h-4 text-amber-500/60" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Enter the Arena
            </span>
            <Sparkles className="w-4 h-4 text-amber-500/60" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs font-semibold text-red-300">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth Buttons */}
          <div className="flex flex-col gap-3">
            {/* Continue as Guest */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('guest')}
              disabled={actionLoading !== null}
              className="relative flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-900/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-amber-500/30"
            >
              {actionLoading === 'guest' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <span>Continue as Guest</span>
              <span className="absolute right-3 text-[10px] font-bold text-amber-200/80 uppercase tracking-wider">
                Instant
              </span>
            </motion.button>

            {/* OR Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Continue with Google */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('google')}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-sm border border-slate-700 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {actionLoading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </motion.button>

            {/* Continue with Facebook */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('facebook')}
              disabled={actionLoading !== null}
              className="flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-slate-100 font-bold text-sm border border-[#1877F2]/30 shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {actionLoading === 'facebook' ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              <span>Continue with Facebook</span>
            </motion.button>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-600 mt-6 leading-relaxed">
            Guest accounts can be upgraded later.
            <br />
            By continuing you agree to our terms of service.
          </p>
        </div>

        {/* Elemental decorative badge below card */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <Flame className="w-3.5 h-3.5 text-orange-500/40" />
          <Snowflake className="w-3.5 h-3.5 text-cyan-500/40" />
          <Shield className="w-3.5 h-3.5 text-emerald-500/40" />
          <Wind className="w-3.5 h-3.5 text-purple-500/40" />
          <span className="text-[10px] text-slate-600 font-bold ml-1">
            Fire · Ice · Earth · Wind
          </span>
        </div>
      </motion.div>
    </div>
  );
}
