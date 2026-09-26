'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Snowflake, Shield, Wind, Zap, Info } from 'lucide-react';

export interface Spell {
  id: string;
  name: string;
  element: 'fire' | 'ice' | 'earth' | 'wind';
  cost: number;
  cooldown: number; // turns
  description: string;
  icon: React.ReactNode;
}

export interface ElementalSpellBarProps {
  currentMana: number;
  activeSpell: string | null;
  onSelectSpell: (spellId: string | null) => void;
  isPlayerTurn: boolean;
}

const SPELLS: Spell[] = [
  {
    id: 'fire_trap',
    name: 'Inferno Strike',
    element: 'fire',
    cost: 4,
    cooldown: 2,
    description: 'Summons a Fire Hazard tile on target square. Burns occupying pieces for 2 turns.',
    icon: <Flame className="w-5 h-5 text-orange-400" />,
  },
  {
    id: 'ice_trap',
    name: 'Glacier Snap',
    element: 'ice',
    cost: 3,
    cooldown: 2,
    description: 'Encases target tile in Ice. Freezes piece for 1 turn, rendering it immune to captures.',
    icon: <Snowflake className="w-5 h-5 text-cyan-300" />,
  },
  {
    id: 'earth_shield',
    name: 'Earth Fortress',
    element: 'earth',
    cost: 3,
    cooldown: 1,
    description: 'Fortifies target square with Earth Shield (+1 Hit Protection) to absorb incoming capture.',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
  },
  {
    id: 'wind_gale',
    name: 'Gale Surge',
    element: 'wind',
    cost: 2,
    cooldown: 1,
    description: 'Creates a Wind Corridor. Allows Rooks, Bishops & Queens to hop friendly pieces.',
    icon: <Wind className="w-5 h-5 text-purple-300" />,
  },
];

export const ElementalSpellBar: React.FC<ElementalSpellBarProps> = ({
  currentMana,
  activeSpell,
  onSelectSpell,
  isPlayerTurn,
}) => {
  const [hoveredSpell, setHoveredSpell] = useState<Spell | null>(null);

  const getElementColorClass = (element: string, canCast: boolean, isActive: boolean) => {
    if (!canCast) return 'border-slate-800 bg-slate-900/60 opacity-50 cursor-not-allowed';
    if (isActive) {
      switch (element) {
        case 'fire':
          return 'border-orange-500 bg-orange-950/80 ring-2 ring-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]';
        case 'ice':
          return 'border-cyan-400 bg-cyan-950/80 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]';
        case 'earth':
          return 'border-emerald-400 bg-emerald-950/80 ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]';
        case 'wind':
          return 'border-purple-400 bg-purple-950/80 ring-2 ring-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)]';
        default:
          return 'border-amber-500 bg-amber-950/80';
      }
    }
    switch (element) {
      case 'fire':
        return 'border-orange-500/40 bg-slate-900/90 hover:border-orange-500 hover:bg-orange-950/40';
      case 'ice':
        return 'border-cyan-400/40 bg-slate-900/90 hover:border-cyan-400 hover:bg-cyan-950/40';
      case 'earth':
        return 'border-emerald-400/40 bg-slate-900/90 hover:border-emerald-400 hover:bg-emerald-950/40';
      case 'wind':
        return 'border-purple-400/40 bg-slate-900/90 hover:border-purple-400 hover:bg-purple-950/40';
      default:
        return 'border-slate-800 bg-slate-900';
    }
  };

  return (
    <div className="w-full relative">
      {/* Spell Bar Container */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold px-1">
          <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Elemental Action Spells</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {activeSpell ? (
              <span className="text-amber-400 font-extrabold animate-pulse">
                Click square on board to cast spell!
              </span>
            ) : (
              'Select spell to cast on board'
            )}
          </span>
        </div>

        {/* Spell Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SPELLS.map((spell) => {
            const canCast = isPlayerTurn && currentMana >= spell.cost;
            const isActive = activeSpell === spell.id;

            return (
              <motion.button
                key={spell.id}
                whileHover={canCast ? { scale: 1.03 } : {}}
                whileTap={canCast ? { scale: 0.97 } : {}}
                onClick={() => {
                  if (canCast) {
                    onSelectSpell(isActive ? null : spell.id);
                  }
                }}
                onMouseEnter={() => setHoveredSpell(spell)}
                onMouseLeave={() => setHoveredSpell(null)}
                className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-200 text-left ${getElementColorClass(
                  spell.element,
                  canCast,
                  isActive
                )}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1 rounded-lg bg-slate-950/60 border border-slate-800">
                    {spell.icon}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-slate-800 text-[10px] font-black text-cyan-300">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>{spell.cost}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-slate-100 truncate">
                    {spell.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium capitalize">
                    {spell.element} Element
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip Card */}
      <AnimatePresence>
        {hoveredSpell && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -top-24 left-0 right-0 z-30 glass-card p-3 rounded-xl border border-amber-500/30 shadow-2xl flex items-start gap-2.5 pointer-events-none"
          >
            <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0">
              {hoveredSpell.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h5 className="font-extrabold text-xs text-amber-300">
                  {hoveredSpell.name}
                </h5>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {hoveredSpell.cost} Mana
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                {hoveredSpell.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ElementalSpellBar;
