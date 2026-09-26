'use client';

import React from 'react';
import { BoardTileMap, PieceStatusMap } from '@/types/elemental';
import { Shield, Flame, Snowflake, Wind, Lock } from 'lucide-react';

interface ElementalOverlayProps {
  boardTileMap: BoardTileMap;
  pieceStatusMap: PieceStatusMap;
  squareSize?: number;
  flipped?: boolean;
}

export const ElementalOverlay: React.FC<ElementalOverlayProps> = ({
  boardTileMap,
  pieceStatusMap,
  flipped = false,
}) => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = flipped ? [...files].reverse() : files;
  const displayRanks = flipped ? [...ranks].reverse() : ranks;

  return (
    <div className="aria-hidden pointer-events-none absolute inset-0 grid grid-cols-8 grid-rows-8 w-full h-full z-10">
      {displayRanks.map((rank) =>
        displayFiles.map((file) => {
          const square = `${file}${rank}`;
          const tile = boardTileMap[square];
          const status = pieceStatusMap[square];

          const isFire = tile?.element === 'fire';
          const isIce = tile?.element === 'ice';
          const isEarth = tile?.element === 'earth';
          const isWind = tile?.element === 'wind';

          return (
            <div
              key={square}
              data-square={square}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
            >
              {/* 1. FIRE TILE OVERLAY */}
              {isFire && (
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-amber-500/20 to-transparent animate-pulse border border-red-500/40">
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-red-950/80 text-amber-300 text-[10px] font-extrabold px-1 rounded shadow-md border border-red-500/50">
                    <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
                    <span>FIRE</span>
                  </div>
                </div>
              )}

              {/* 2. ICE TILE OVERLAY */}
              {isIce && (
                <div className="absolute inset-0 bg-sky-400/20 backdrop-blur-[1px] border-2 border-sky-300/60 shadow-[inset_0_0_12px_rgba(56,189,248,0.5)]">
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-sky-950/80 text-sky-200 text-[10px] font-extrabold px-1 rounded shadow-md border border-sky-400/50">
                    <Snowflake className="w-3 h-3 text-sky-300 animate-spin" />
                    <span>ICE</span>
                  </div>
                </div>
              )}

              {/* 3. EARTH TILE OVERLAY */}
              {isEarth && (
                <div className="absolute inset-0 bg-amber-950/30 border border-amber-600/50 shadow-[inset_0_0_8px_rgba(180,83,9,0.4)]">
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-amber-950/90 text-amber-200 text-[10px] font-extrabold px-1 rounded shadow-md border border-amber-600/60">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>EARTH</span>
                  </div>
                </div>
              )}

              {/* 4. WIND TILE OVERLAY */}
              {isWind && (
                <div className="absolute inset-0 bg-teal-400/15 border border-teal-300/40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-200/30 to-transparent animate-[breeze_2.5s_infinite_linear]" />
                  <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-teal-950/80 text-teal-200 text-[10px] font-extrabold px-1 rounded shadow-md border border-teal-400/50">
                    <Wind className="w-3 h-3 text-teal-300" />
                    <span>GALE</span>
                  </div>
                </div>
              )}

              {/* 5. PIECE STATUS BADGES & FROZEN ENCASEMENT */}
              {status?.isFrozen && (
                <div className="absolute inset-1 rounded-lg bg-cyan-500/30 border-2 border-cyan-200 backdrop-blur-[2px] flex items-center justify-center z-20 shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                  <div className="bg-cyan-900/90 text-cyan-100 p-1 rounded-full shadow-lg border border-cyan-300 flex items-center justify-center gap-1 px-1.5 py-0.5 text-[10px] font-extrabold">
                    <Lock className="w-3 h-3 text-cyan-200" />
                    <span>FROZEN</span>
                  </div>
                </div>
              )}

              {status?.isBurned && !status?.isFrozen && (
                <div className="absolute bottom-1 right-1 z-20 bg-red-950/90 border border-red-500 text-amber-300 text-[10px] font-bold px-1 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg animate-pulse">
                  <Flame className="w-3 h-3 text-red-500" />
                  <span>{status.burnTurnsRemaining}t</span>
                </div>
              )}

              {status?.hasEarthShield && !status?.isFrozen && (
                <div className="absolute top-1 right-1 z-20 bg-amber-950/90 border border-amber-400 text-amber-200 text-[10px] font-extrabold p-1 rounded-full shadow-lg flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-500/40" />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ElementalOverlay;
