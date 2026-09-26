'use client';

import React, { useState } from 'react';
import ChessBoard from '@/components/ChessBoard';
import { Flame, Shield, Snowflake, Wind, Sparkles } from 'lucide-react';

export default function Home() {
  const [gameMode, setGameMode] = useState<'local' | 'bot' | 'multiplayer'>('local');

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 py-8">
      {/* HEADER TITLE */}
      <header className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
          <Snowflake className="w-6 h-6 text-sky-400 animate-pulse" />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-sky-400 tracking-wider uppercase drop-shadow-md">
            Element Chess
          </h1>
          <Shield className="w-6 h-6 text-amber-500 animate-pulse" />
          <Wind className="w-6 h-6 text-teal-400 animate-pulse" />
        </div>
        <p className="text-slate-400 text-sm font-medium">
          Master the elemental hazards, protect your king, conquer the board.
        </p>
      </header>

      {/* MODE SELECTOR TABS */}
      <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl mb-6 gap-2">
        <button
          onClick={() => setGameMode('local')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            gameMode === 'local'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚔ Local 2P PvP
        </button>
        <button
          onClick={() => setGameMode('bot')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            gameMode === 'bot'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🤖 vs Elemental Bot
        </button>
        <button
          onClick={() => setGameMode('multiplayer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            gameMode === 'multiplayer'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🌐 Online Arena
        </button>
      </div>

      {/* PRIMARY CHESS BOARD */}
      <div className="w-full">
        <ChessBoard gameMode={gameMode} />
      </div>

      {/* FOOTER */}
      <footer className="mt-8 text-center text-xs text-slate-500">
        Element Chess Engine • Decoupled Tile Hazard System • Axis-Symmetric Balance Architecture
      </footer>
    </main>
  );
}
