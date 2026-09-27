'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Trophy,
  Target,
  TrendingUp,
  Flame,
  Snowflake,
  Shield,
  Wind,
  Swords,
  Crown,
  ArrowLeft,
  Loader2,
  Zap,
  Star,
  Minus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Profile, PlayerStats } from '@/types/database';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authErrorParam = searchParams?.get('auth_error');

  const {
    user,
    loading: authLoading,
    isGuest,
    linkGoogleAccount,
    linkFacebookAccount,
  } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Upgrade account states
  const [upgradeLoading, setUpgradeLoading] = useState<'google' | 'facebook' | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(authErrorParam || null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch profile and stats
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setDataLoading(true);
      const supabase = createClient();

      const [profileRes, statsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('player_stats').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data as unknown as Profile);
      if (statsRes.data) setStats(statsRes.data as unknown as PlayerStats);

      setDataLoading(false);
    };

    fetchData();
  }, [user]);

  const handleLinkAccount = async (provider: 'google' | 'facebook') => {
    setUpgradeError(null);
    setUpgradeLoading(provider);
    try {
      if (provider === 'google') {
        await linkGoogleAccount();
      } else {
        await linkFacebookAccount();
      }
    } catch (err: any) {
      setUpgradeError(
        err?.message || `Failed to link ${provider} account. Your guest data remains safe.`
      );
      setUpgradeLoading(null);
    }
  };

  // Full-page loader
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Loading Profile...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const winRate =
    stats && stats.matches_played > 0
      ? ((stats.wins / stats.matches_played) * 100).toFixed(1)
      : '0.0';

  const avatarUrl = profile.avatar_url;
  const displayName = profile.display_name || 'Player';
  const username = profile.username;

  // Spell calculations
  const fireSpells = stats?.fire_spells_used || 0;
  const iceSpells = stats?.ice_spells_used || 0;
  const earthSpells = stats?.earth_spells_used || 0;
  const windSpells = stats?.wind_spells_used || 0;
  const totalSpells = stats?.total_spells_used || fireSpells + iceSpells + earthSpells + windSpells;

  const firePct = totalSpells > 0 ? ((fireSpells / totalSpells) * 100).toFixed(0) : '0';
  const icePct = totalSpells > 0 ? ((iceSpells / totalSpells) * 100).toFixed(0) : '0';
  const earthPct = totalSpells > 0 ? ((earthSpells / totalSpells) * 100).toFixed(0) : '0';
  const windPct = totalSpells > 0 ? ((windSpells / totalSpells) * 100).toFixed(0) : '0';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top navigation bar */}
      <header className="w-full glass-panel border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Arena</span>
        </button>

        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <Snowflake className="w-4 h-4 text-cyan-400 animate-pulse" />
          <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
          <Wind className="w-4 h-4 text-purple-400 animate-pulse" />
        </div>

        <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 uppercase tracking-wider">
          Player Profile
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* ─── PROFILE HERO CARD ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-800 to-cyan-500/20 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-500" />
                )}
              </div>
              {/* Account type badge */}
              <div
                className={`absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md ${
                  isGuest
                    ? 'bg-amber-950/90 text-amber-300 border-amber-600/50'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500/40'
                }`}
              >
                {isGuest ? 'Guest' : 'Permanent'}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 tracking-wide uppercase">
                {displayName}
              </h1>
              {username && (
                <p className="text-sm text-slate-400 font-mono mt-1">@{username}</p>
              )}
              {!username && (
                <p className="text-sm text-slate-600 font-mono mt-1 italic">
                  {isGuest ? 'Temporary Guest Account' : 'No username set'}
                </p>
              )}

              {/* Rating badge */}
              {stats && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-sm px-3 py-1.5 rounded-xl">
                    <Crown className="w-4 h-4" />
                    <span>{stats.rating} ELO</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-xs px-3 py-1.5 rounded-xl">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Score: {stats.score}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── GUEST ACCOUNT UPGRADE BANNER ─── */}
        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-panel rounded-3xl p-6 border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                  <h3 className="text-base font-black text-amber-300 uppercase tracking-wider">
                    Upgrade Account &amp; Preserve Progress
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  Link your guest account with Google or Facebook. Your existing rating (
                  <strong className="text-amber-400">{stats?.rating || 1200} ELO</strong>), score (
                  <strong className="text-cyan-400">{stats?.score || 0}</strong>), match history, and elemental spell statistics will be safely preserved.
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-semibold pt-1">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Rating Preserved
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Match History Kept
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Spell Mastery Retained
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                {/* Upgrade Google */}
                <button
                  onClick={() => handleLinkAccount('google')}
                  disabled={upgradeLoading !== null}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold border border-slate-700 shadow-lg transition-all w-full sm:w-auto disabled:opacity-50"
                >
                  {upgradeLoading === 'google' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span>Link Google</span>
                </button>

                {/* Upgrade Facebook */}
                <button
                  onClick={() => handleLinkAccount('facebook')}
                  disabled={upgradeLoading !== null}
                  className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-slate-100 text-xs font-bold border border-[#1877F2]/30 shadow-lg transition-all w-full sm:w-auto disabled:opacity-50"
                >
                  {upgradeLoading === 'facebook' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <span>Link Facebook</span>
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            <AnimatePresence>
              {upgradeError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-3 border-t border-red-900/40"
                >
                  <div className="flex items-center gap-2 bg-red-950/60 border border-red-800/60 rounded-xl px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs font-semibold text-red-300">{upgradeError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ─── STATS GRID ─── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Battle Statistics</span>
              </h2>

              <button
                onClick={() => router.push('/profile/history')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
              >
                <span>Full Match History</span>
                <Swords className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard
                label="Matches"
                value={stats.matches_played}
                icon={<Swords className="w-5 h-5 text-slate-400" />}
                color="slate"
              />
              <StatCard
                label="Wins"
                value={stats.wins}
                icon={<Trophy className="w-5 h-5 text-amber-400" />}
                color="amber"
              />
              <StatCard
                label="Losses"
                value={stats.losses}
                icon={<Target className="w-5 h-5 text-red-400" />}
                color="red"
              />
              <StatCard
                label="Draws"
                value={stats.draws}
                icon={<Minus className="w-5 h-5 text-slate-400" />}
                color="slate"
              />
              <StatCard
                label="Win Rate"
                value={`${winRate}%`}
                icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                color="emerald"
              />
            </div>
          </motion.div>
        )}

        {/* ─── ELEMENTAL SPELL MASTERY SECTION ─── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <Snowflake className="w-4 h-4 text-cyan-400" />
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <Wind className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                    Elemental Spell Mastery
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Tracked from successful spell casts in tactical chess battles
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-amber-300">
                  {totalSpells} Spells Cast
                </span>
              </div>
            </div>

            {/* 4 Element Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Fire */}
              <div className="glass-panel rounded-2xl p-4 border border-orange-500/30 bg-gradient-to-b from-orange-950/30 to-slate-900/60 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-xl bg-orange-950/80 border border-orange-500/40 mb-2">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <p className="text-2xl font-black text-orange-400">{fireSpells}</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Fire Spells</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Inferno Strike ({firePct}%)
                </p>
              </div>

              {/* Ice */}
              <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 bg-gradient-to-b from-cyan-950/30 to-slate-900/60 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 mb-2">
                  <Snowflake className="w-6 h-6 text-cyan-300" />
                </div>
                <p className="text-2xl font-black text-cyan-300">{iceSpells}</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Ice Spells</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Glacier Snap ({icePct}%)
                </p>
              </div>

              {/* Earth */}
              <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-slate-900/60 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 mb-2">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400">{earthSpells}</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Earth Spells</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Earth Fortress ({earthPct}%)
                </p>
              </div>

              {/* Wind */}
              <div className="glass-panel rounded-2xl p-4 border border-purple-500/30 bg-gradient-to-b from-purple-950/30 to-slate-900/60 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 mb-2">
                  <Wind className="w-6 h-6 text-purple-300" />
                </div>
                <p className="text-2xl font-black text-purple-300">{windSpells}</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">Wind Spells</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Gale Surge ({windPct}%)
                </p>
              </div>
            </div>

            {/* Visual Elemental Balance Distribution Bar */}
            {totalSpells > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Elemental Balance</span>
                  <span>{totalSpells} Total Spells</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-900 border border-slate-800 flex overflow-hidden p-0.5 gap-0.5">
                  <div
                    style={{ width: `${firePct}%` }}
                    className="bg-orange-500 rounded-l-full transition-all duration-500"
                    title={`Fire: ${fireSpells}`}
                  />
                  <div
                    style={{ width: `${icePct}%` }}
                    className="bg-cyan-400 transition-all duration-500"
                    title={`Ice: ${iceSpells}`}
                  />
                  <div
                    style={{ width: `${earthPct}%` }}
                    className="bg-emerald-400 transition-all duration-500"
                    title={`Earth: ${earthSpells}`}
                  />
                  <div
                    style={{ width: `${windPct}%` }}
                    className="bg-purple-400 rounded-r-full transition-all duration-500"
                    title={`Wind: ${windSpells}`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── STREAKS & PROGRESSION ─── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2 px-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Streaks &amp; Rating</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Current Streak */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500/15 border border-orange-500/30">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Current Streak
                  </p>
                  <p className="text-2xl font-black text-orange-400">{stats.current_streak}</p>
                </div>
              </div>

              {/* Best Streak */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30">
                  <Star className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Best Streak
                  </p>
                  <p className="text-2xl font-black text-amber-400">{stats.best_streak}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                  <Crown className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    ELO Rating
                  </p>
                  <p className="text-2xl font-black text-cyan-400">{stats.rating}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SCORE CARD ─── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-2xl p-5 border border-slate-800"
          >
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Score Breakdown</span>
            </h2>

            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                  {stats.score}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Total Score
                </p>
              </div>

              <div className="w-px h-12 bg-slate-800" />

              <div className="text-center">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {stats.rating}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  ELO Rating
                </p>
              </div>

              <div className="w-px h-12 bg-slate-800" />

              <div className="text-center">
                <p className="text-4xl font-black text-emerald-400">{winRate}%</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Win Rate
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Loading Profile...
            </p>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

// ─── Stat Card Sub-Component ───────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const borderColor: Record<string, string> = {
    amber: 'border-amber-500/20',
    red: 'border-red-500/20',
    emerald: 'border-emerald-500/20',
    slate: 'border-slate-800',
    cyan: 'border-cyan-500/20',
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-4 border ${
        borderColor[color] || 'border-slate-800'
      } flex flex-col items-center gap-2`}
    >
      {icon}
      <p className="text-2xl font-black text-slate-100">{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
