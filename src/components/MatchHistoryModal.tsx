'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Trophy,
  Target,
  Clock,
  Calendar,
  X,
  Loader2,
  Bot,
  Users,
  Globe,
  Minus,
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import type { Match } from '@/types/database';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchMatches = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await (supabase.from('matches') as any)
        .select('*')
        .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
        .order('started_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setMatches(data as unknown as Match[]);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel max-w-xl w-full p-6 rounded-3xl border border-slate-800 shadow-2xl relative max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <Swords className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider leading-tight">
                  Match History
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Your recent elemental battles &amp; records
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Loading matches...
                </span>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                  <Swords className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">
                  No Matches Recorded Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Play local 2-player or bot matches to log your elemental chess history!
                </p>
              </div>
            ) : (
              matches.map((match) => {
                const isWhite = match.white_player_id === user?.id;
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

                const modeIcon =
                  match.game_mode === 'bot' ? (
                    <Bot className="w-4 h-4 text-cyan-400" />
                  ) : match.game_mode === 'multiplayer' ? (
                    <Globe className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Users className="w-4 h-4 text-amber-400" />
                  );

                const outcomeStyles = {
                  win: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400',
                  loss: 'bg-red-950/40 border-red-800/60 text-red-400',
                  draw: 'bg-slate-900/60 border-slate-800 text-slate-400',
                };

                const formattedDate = match.started_at
                  ? new Date(match.started_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent';

                return (
                  <div
                    key={match.id}
                    className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                        {modeIcon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-200 uppercase tracking-wide">
                            {match.game_mode === 'bot'
                              ? 'vs Elemental Bot'
                              : match.game_mode === 'multiplayer'
                              ? 'Online Match'
                              : 'Local 2P Match'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ({isWhite ? 'White' : 'Black'})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {formattedDate}
                          </span>
                          {match.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {Math.floor(match.duration / 60)}m {match.duration % 60}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shrink-0 flex items-center gap-1 ${outcomeStyles[outcome]}`}
                    >
                      {outcome === 'win' && <Trophy className="w-3.5 h-3.5" />}
                      {outcome === 'loss' && <Target className="w-3.5 h-3.5" />}
                      {outcome === 'draw' && <Minus className="w-3.5 h-3.5" />}
                      <span>{outcome}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
