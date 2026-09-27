'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Trophy,
  Target,
  Clock,
  Calendar,
  ArrowLeft,
  Loader2,
  Bot,
  Users,
  Globe,
  Minus,
  Filter,
  Flame,
  Snowflake,
  Shield,
  Wind,
  Zap,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Match } from '@/types/database';

export default function MatchHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'win' | 'loss' | 'draw'>('all');

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch matches from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchMatches = async () => {
      setDataLoading(true);
      const supabase = createClient();
      const { data, error } = await (supabase.from('matches') as any)
        .select('*')
        .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
        .order('started_at', { ascending: false });

      if (!error && data) {
        setMatches(data as unknown as Match[]);
      }
      setDataLoading(false);
    };

    fetchMatches();
  }, [user]);

  // Filtered match list
  const filteredMatches = useMemo(() => {
    if (!user) return [];
    return matches.filter((match) => {
      const isWhite = match.white_player_id === user.id;
      let outcome: 'win' | 'loss' | 'draw' = 'draw';
      if (match.result === 'draw') outcome = 'draw';
      else if (
        (match.result === 'white' && isWhite) ||
        (match.result === 'black' && !isWhite)
      ) {
        outcome = 'win';
      } else if (match.result) {
        outcome = 'loss';
      }

      if (filter === 'all') return true;
      return outcome === filter;
    });
  }, [matches, filter, user]);

  // Summary counts
  const counts = useMemo(() => {
    if (!user) return { all: 0, win: 0, loss: 0, draw: 0 };
    let win = 0,
      loss = 0,
      draw = 0;

    matches.forEach((m) => {
      const isWhite = m.white_player_id === user.id;
      if (m.result === 'draw') draw++;
      else if (
        (m.result === 'white' && isWhite) ||
        (m.result === 'black' && !isWhite)
      ) {
        win++;
      } else if (m.result) {
        loss++;
      }
    });

    return { all: matches.length, win, loss, draw };
  }, [matches, user]);

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
            Loading Match History...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Header */}
      <header className="w-full glass-panel border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Profile</span>
        </button>

        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <Snowflake className="w-4 h-4 text-cyan-400 animate-pulse" />
          <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
          <Wind className="w-4 h-4 text-purple-400 animate-pulse" />
        </div>

        <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 uppercase tracking-wider">
          Match Chronicle
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Title & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 uppercase tracking-wide">
              Elemental Match History
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Detailed log of your tactical battles, outcomes, and ratings
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-full sm:w-auto">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              label={`All (${counts.all})`}
            />
            <FilterButton
              active={filter === 'win'}
              onClick={() => setFilter('win')}
              label={`Wins (${counts.win})`}
              badgeColor="amber"
            />
            <FilterButton
              active={filter === 'loss'}
              onClick={() => setFilter('loss')}
              label={`Losses (${counts.loss})`}
              badgeColor="red"
            />
            <FilterButton
              active={filter === 'draw'}
              onClick={() => setFilter('draw')}
              label={`Draws (${counts.draw})`}
              badgeColor="slate"
            />
          </div>
        </div>

        {/* Match List */}
        {filteredMatches.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Swords className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-300 uppercase tracking-wider mb-1">
              No Matches Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              {filter === 'all'
                ? "You haven't completed any elemental chess matches yet."
                : `No matches found matching the "${filter}" filter.`}
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold shadow-lg transition-all"
            >
              Enter Arena &amp; Play
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredMatches.map((match, idx) => {
                const isWhite = match.white_player_id === user.id;
                let outcome: 'win' | 'loss' | 'draw' = 'draw';
                if (match.result === 'draw') outcome = 'draw';
                else if (
                  (match.result === 'white' && isWhite) ||
                  (match.result === 'black' && !isWhite)
                ) {
                  outcome = 'win';
                } else if (match.result) {
                  outcome = 'loss';
                }

                const opponentName =
                  match.game_mode === 'bot'
                    ? 'Elemental Bot (AI)'
                    : match.game_mode === 'multiplayer'
                    ? 'Online Opponent'
                    : 'Local Opponent (2P)';

                const modeIcon =
                  match.game_mode === 'bot' ? (
                    <Bot className="w-5 h-5 text-cyan-400" />
                  ) : match.game_mode === 'multiplayer' ? (
                    <Globe className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Users className="w-5 h-5 text-amber-400" />
                  );

                const outcomeStyles = {
                  win: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400',
                  loss: 'bg-red-950/40 border-red-800/60 text-red-400',
                  draw: 'bg-slate-900/60 border-slate-800 text-slate-400',
                };

                const ratingChangeVal =
                  match.rating_change ??
                  (outcome === 'win' ? 15 : outcome === 'loss' ? -10 : 2);
                const scoreChangeVal =
                  match.score_change ??
                  (outcome === 'win' ? 100 : outcome === 'loss' ? 10 : 30);

                const ratingChangeStr = `${
                  ratingChangeVal >= 0 ? `+${ratingChangeVal}` : ratingChangeVal
                } ELO (+${scoreChangeVal} PTS)`;

                const spellsData = match.spells_used as any;

                const formattedDate = match.started_at
                  ? new Date(match.started_at).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent Match';

                const movesCount = Array.isArray(match.moves)
                  ? match.moves.length
                  : 0;

                return (
                  <motion.div
                    key={match.id || idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left info */}
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
                        {modeIcon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                            vs {opponentName}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            ({isWhite ? 'White' : 'Black'})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formattedDate}
                          </span>

                          {match.duration && (
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {Math.floor(match.duration / 60)}m {match.duration % 60}s
                            </span>
                          )}

                          {movesCount > 0 && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                              <Swords className="w-3 h-3 text-slate-500" />
                              {movesCount} moves
                            </span>
                          )}

                          {spellsData && spellsData.total > 0 && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              <Zap className="w-3 h-3 text-amber-400" />
                              {spellsData.total} Spells Cast
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right status & rating change */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Rating Change
                        </span>
                        <span
                          className={`text-xs font-mono font-bold ${
                            outcome === 'win'
                              ? 'text-emerald-400'
                              : outcome === 'loss'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {ratingChangeStr}
                        </span>
                      </div>

                      <div
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shrink-0 flex items-center gap-1.5 ${outcomeStyles[outcome]}`}
                      >
                        {outcome === 'win' && <Trophy className="w-4 h-4" />}
                        {outcome === 'loss' && <Target className="w-4 h-4" />}
                        {outcome === 'draw' && <Minus className="w-4 h-4" />}
                        <span>{outcome}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  badgeColor = 'slate',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badgeColor?: 'slate' | 'amber' | 'red';
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial text-center ${
        active
          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      {label}
    </button>
  );
}
