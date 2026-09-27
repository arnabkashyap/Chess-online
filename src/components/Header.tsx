'use client';

import React, { useState } from 'react';
import {
  Flame,
  Snowflake,
  Shield,
  Wind,
  Share2,
  Volume2,
  VolumeX,
  BookOpen,
  Check,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { UserMenu } from './UserMenu';

export interface HeaderProps {
  isMuted?: boolean;
  onToggleMute?: () => void;
  roomCode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isMuted = false,
  onToggleMute,
  roomCode = 'ELM-9842',
}) => {
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(
      `Join my Element Chess match! Room Code: ${roomCode} - https://chess-online-nine.vercel.app`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="w-full glass-panel border-b border-slate-800 px-6 py-3.5 flex items-center justify-between z-30 sticky top-0 backdrop-blur-xl">
        {/* BRAND LOGO */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-purple-500/20 border border-slate-700 shadow-md">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <Snowflake className="w-5 h-5 text-cyan-400 animate-pulse -ml-1" />
            <Shield className="w-5 h-5 text-emerald-400 animate-pulse -ml-1" />
            <Wind className="w-5 h-5 text-purple-400 animate-pulse -ml-1" />
          </div>
          <div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-cyan-400 tracking-wider uppercase leading-none drop-shadow-md">
              Element Chess
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Tactical Hazard Strategy Arena
            </p>
          </div>
        </div>

        {/* CENTER ROOM CODE & SHARE */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
          <span className="text-[11px] text-slate-400 font-bold">Room:</span>
          <span className="font-mono text-xs font-black text-amber-300">
            {roomCode}
          </span>
          <button
            onClick={handleCopyShare}
            className="ml-1 p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[10px] font-bold"
            title="Copy Share Link"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>

        {/* RIGHT CONTROLS & SETTINGS */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Elemental Rules</span>
          </button>

          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors shadow-sm"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* USER ACCOUNT MENU */}
          <UserMenu />
        </div>
      </header>

      {/* RULES GUIDE MODAL */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-amber-500/30 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-extrabold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Element Chess Rulebook</span>
              </h3>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-orange-950/40 border border-orange-800/50">
                  <h4 className="font-bold text-orange-400 flex items-center gap-1.5 mb-1">
                    <Flame className="w-4 h-4" /> Fire Tiles (Inferno)
                  </h4>
                  <p>
                    Applies a 2-turn Burn countdown. Pieces remaining on Fire tiles are destroyed automatically at turn end. (Kings are immune!)
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                    <Snowflake className="w-4 h-4" /> Ice Tiles (Glacier)
                  </h4>
                  <p>
                    Encases piece in Ice for 1 turn. Frozen pieces cannot move on the next turn, but act as immune to physical captures.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
                  <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Shield className="w-4 h-4" /> Earth Tiles (Fortress)
                  </h4>
                  <p>
                    Grants Earth Shield (+1 Hit Protection). Absorbs the first capture attempt, breaking the shield while keeping defender alive.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/50">
                  <h4 className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                    <Wind className="w-4 h-4" /> Wind Corridors (Gale)
                  </h4>
                  <p>
                    Extends movement for Rooks, Bishops, and Queens, allowing them to slide over 1 friendly piece along wind tiles.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="mt-6 w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                Close Rulebook
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
