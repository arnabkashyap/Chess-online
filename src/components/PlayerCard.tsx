'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Flame, User, Bot, Crown } from 'lucide-react';

export interface PlayerCardProps {
  name: string;
  color: 'w' | 'b';
  avatar?: string;
  isTurn: boolean;
  mana: number; // 0 - 10
  maxMana?: number;
  timeRemaining?: string; // e.g. "04:45"
  capturedPieces: string[]; // Array of piece types captured by this player (e.g. ['p', 'p', 'n', 'q'])
  materialAdvantage?: number; // e.g. +3
  isBot?: boolean;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  color,
  avatar,
  isTurn,
  mana,
  maxMana = 10,
  timeRemaining = '05:00',
  capturedPieces,
  materialAdvantage = 0,
  isBot = false,
}) => {
  const isWhite = color === 'w';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel p-4 rounded-2xl relative overflow-hidden transition-all duration-300 ${
        isTurn
          ? 'ring-2 ring-amber-500/80 shadow-[0_0_25px_rgba(249,115,22,0.25)] border-amber-500/40'
          : 'border-slate-800'
      }`}
    >
      {/* Background Active Glow gradient */}
      {isTurn && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Top Header: Avatar, Name, Color Badge & Timer */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar Container with Active Ring */}
          <div
            className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg select-none transition-transform ${
              isWhite
                ? 'bg-slate-200 text-slate-900 border border-slate-300'
                : 'bg-slate-800 text-slate-100 border border-slate-700'
            } ${isTurn ? 'scale-105 shadow-md ring-2 ring-amber-400' : ''}`}
          >
            {avatar ? (
              <span className="text-xl">{avatar}</span>
            ) : isBot ? (
              <Bot className="w-6 h-6 text-amber-400" />
            ) : (
              <User className="w-6 h-6 text-slate-400" />
            )}

            {/* Turn Crown Badge */}
            {isTurn && (
              <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-md animate-bounce">
                <Crown className="w-3 h-3 fill-slate-950" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm text-slate-100 truncate max-w-[120px]">
                {name}
              </h3>
              <span
                className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                  isWhite
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                {isWhite ? 'White' : 'Black'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Timer: <span className="text-slate-200 font-bold">{timeRemaining}</span>
            </p>
          </div>
        </div>

        {/* Material Advantage Differential */}
        {materialAdvantage > 0 && (
          <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-2 py-1 rounded-lg shadow-sm">
            +{materialAdvantage}
          </div>
        )}
      </div>

      {/* MANA GAUGE (Segmented Energy Bar) */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
          <span className="flex items-center gap-1 text-cyan-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
            <span>Mana Pool</span>
          </span>
          <span className="font-mono text-cyan-300">
            {mana} / {maxMana}
          </span>
        </div>

        {/* 10 Segment Bars */}
        <div className="grid grid-cols-10 gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
          {Array.from({ length: maxMana }).map((_, idx) => {
            const isActive = idx < mana;
            return (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  backgroundColor: isActive ? '#06b6d4' : '#1e293b',
                  boxShadow: isActive ? '0 0 8px rgba(6, 182, 212, 0.6)' : 'none',
                }}
                transition={{ duration: 0.2 }}
                className="h-2 rounded-sm"
              />
            );
          })}
        </div>
      </div>

      {/* CAPTURED PIECES GRAVEYARD */}
      <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
          <span>Trophies Captured</span>
          <span className="font-mono text-slate-500">{capturedPieces.length} Taken</span>
        </div>

        <div className="flex flex-wrap items-center gap-1 min-h-[22px]">
          {capturedPieces.length === 0 ? (
            <span className="text-[11px] text-slate-600 italic">No pieces captured yet</span>
          ) : (
            capturedPieces.map((piece, i) => (
              <span
                key={i}
                className="text-base leading-none text-amber-200/90 filter drop-shadow-sm select-none"
                title={`${piece.toUpperCase()} (val: ${PIECE_VALUES[piece.toLowerCase()] || 1})`}
              >
                {PIECE_SYMBOLS[piece.toLowerCase()] || '♟'}
              </span>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;
