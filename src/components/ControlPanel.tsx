'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Swords,
  Bot,
  Globe,
  RotateCcw,
  Flag,
  Handshake,
  ArrowLeftRight,
  Flame,
  Snowflake,
  Shield,
  Wind,
} from 'lucide-react';

export interface MoveHistoryItem {
  san: string;
  color: 'w' | 'b';
  elementTrigger?: 'fire' | 'ice' | 'earth' | 'wind';
  triggerText?: string;
  moveNumber: number;
}

export interface ControlPanelProps {
  gameMode: 'local' | 'bot' | 'multiplayer';
  onSelectGameMode: (mode: 'local' | 'bot' | 'multiplayer') => void;
  botDifficulty: 'easy' | 'medium' | 'hard';
  onSelectBotDifficulty: (diff: 'easy' | 'medium' | 'hard') => void;
  moveHistory: MoveHistoryItem[];
  onResetGame: () => void;
  onFlipBoard: () => void;
  onResign?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  gameMode,
  onSelectGameMode,
  botDifficulty,
  onSelectBotDifficulty,
  moveHistory,
  onResetGame,
  onFlipBoard,
  onResign,
}) => {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col gap-4 h-[560px]">
      {/* 1. GAME MODE SEGMENTED CONTROL */}
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
          Match Game Mode
        </h3>
        <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectGameMode('local')}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-extrabold transition-all ${
              gameMode === 'local'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>Local 2P</span>
          </button>

          <button
            onClick={() => onSelectGameMode('bot')}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-extrabold transition-all ${
              gameMode === 'bot'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Vs Bot</span>
          </button>

          <button
            onClick={() => onSelectGameMode('multiplayer')}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-extrabold transition-all ${
              gameMode === 'multiplayer'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Online</span>
          </button>
        </div>
      </div>

      {/* BOT DIFFICULTY PICKER (If Bot Mode Active) */}
      {gameMode === 'bot' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
            Elemental Bot Personality
          </h4>
          <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectBotDifficulty('easy')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                botDifficulty === 'easy'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌿 Druid
            </button>
            <button
              onClick={() => onSelectBotDifficulty('medium')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                botDifficulty === 'medium'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔥 Pyromancer
            </button>
            <button
              onClick={() => onSelectBotDifficulty('hard')}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                botDifficulty === 'hard'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Grandmaster
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. MOVE HISTORY FEED WITH SAN & ELEMENTAL TAGS */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
          <span>Move Chronicle</span>
          <span className="font-mono text-[10px] text-slate-500">
            {moveHistory.length} Moves
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs text-slate-300">
          {moveHistory.length === 0 ? (
            <p className="italic text-slate-600 text-center py-6 text-[11px]">
              No moves recorded. Make a move on the board!
            </p>
          ) : (
            moveHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold w-6">
                    {item.moveNumber}.
                  </span>
                  <span
                    className={`font-black ${
                      item.color === 'w' ? 'text-amber-200' : 'text-slate-400'
                    }`}
                  >
                    {item.san}
                  </span>
                </div>

                {/* Elemental Hazard Tag */}
                {item.elementTrigger && (
                  <div className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-950 border border-slate-800">
                    {item.elementTrigger === 'fire' && (
                      <Flame className="w-3 h-3 text-orange-400" />
                    )}
                    {item.elementTrigger === 'ice' && (
                      <Snowflake className="w-3 h-3 text-cyan-400" />
                    )}
                    {item.elementTrigger === 'earth' && (
                      <Shield className="w-3 h-3 text-emerald-400" />
                    )}
                    {item.elementTrigger === 'wind' && (
                      <Wind className="w-3 h-3 text-purple-400" />
                    )}
                    <span className="capitalize text-slate-300">
                      {item.elementTrigger}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. ACTION BAR BUTTONS */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onFlipBoard}
          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-2 rounded-xl text-xs border border-slate-700 transition-colors"
          title="Flip Board View"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
          <span>Flip</span>
        </button>

        <button
          onClick={onResetGame}
          className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-2 rounded-xl text-xs shadow-md transition-transform active:scale-95"
          title="Reset Match"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {onResign && (
          <button
            onClick={onResign}
            className="flex items-center justify-center gap-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 font-bold py-2 px-2 rounded-xl text-xs border border-red-800/80 transition-colors"
            title="Resign Match"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Resign</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
