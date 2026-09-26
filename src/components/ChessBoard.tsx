'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { BoardTileMap, PieceStatusMap } from '@/types/elemental';
import {
  canPieceMove,
  resolveTargetTile,
  processEndOfTurn,
  generateSymmetricTiles,
} from '@/engine/elementalEngine';
import ElementalOverlay from './ChessBoard/ElementalOverlay';
import { Shield, Flame, Snowflake, Wind, AlertCircle, RefreshCw } from 'lucide-react';

const PIECE_IMAGES: Record<string, string> = {
  p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
  P: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  N: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  B: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  R: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  Q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  K: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
};

// Web Audio sound engine for chess actions
class SoundEngine {
  private ctx: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch {
        this.ctx = null;
      }
    }
  }

  playMove() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCapture() {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

const sounds = new SoundEngine();

export interface ChessBoardProps {
  gameMode?: 'local' | 'bot' | 'multiplayer';
  botDifficulty?: 'easy' | 'medium' | 'hard';
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  gameMode = 'local',
  botDifficulty = 'medium',
}) => {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [boardTileMap, setBoardTileMap] = useState<BoardTileMap>(() =>
    generateSymmetricTiles(12345)
  );
  const [pieceStatusMap, setPieceStatusMap] = useState<PieceStatusMap>({});

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [gameOverText, setGameOverText] = useState<string>('');

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const triggerBanner = (msg: string) => {
    setBannerMessage(msg);
    setLogs((prev) => [msg, ...prev.slice(0, 15)]);
    setTimeout(() => {
      setBannerMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleResetGame = useCallback(() => {
    const newChess = new Chess();
    setGame(newChess);
    setBoardTileMap(generateSymmetricTiles());
    setPieceStatusMap({});
    setSelectedSquare(null);
    setValidMoves([]);
    setBannerMessage(null);
    setLogs(['Game reset with fresh symmetric elemental tiles!']);
    setTurn('w');
    setIsGameOver(false);
    setGameOverText('');
  }, []);

  // Helper to convert current board into a map of square -> piece info
  const getBoardPieces = (chessInstance: Chess) => {
    const pieces: Record<string, { type: string; color: 'w' | 'b' }> = {};
    const b = chessInstance.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = b[r][f];
        if (sq) {
          const sqName = `${files[f]}${ranks[r]}`;
          pieces[sqName] = { type: sq.type, color: sq.color };
        }
      }
    }
    return pieces;
  };

  const handleSquareClick = (square: string) => {
    if (isGameOver) return;

    // Check turn for Bot mode
    if (gameMode === 'bot' && turn === 'b') {
      return;
    }

    const piece = game.get(square as Square);

    // 1. Intercept attempt to select or move a frozen piece
    if (selectedSquare === null && piece) {
      if (!canPieceMove(square, pieceStatusMap)) {
        triggerBanner(`❌ Piece on ${square} is frozen in ice and cannot move!`);
        return;
      }
    }

    // 2. Execute move if a square was previously selected
    if (selectedSquare) {
      const move = validMoves.find((m) => m.to === square);
      if (move) {
        executeMove(move);
        return;
      }
    }

    // 3. Select piece
    if (piece && piece.color === turn) {
      if (!canPieceMove(square, pieceStatusMap)) {
        triggerBanner(`❌ Piece on ${square} is frozen in ice and cannot move!`);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      setSelectedSquare(square);
      const moves = game.moves({ square: square as Square, verbose: true });
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const executeMove = (move: Move) => {
    const fromSquare = move.from;
    const targetSquare = move.to;
    const isCapture = move.flags.includes('c') || move.flags.includes('e');
    const targetPiece = game.get(targetSquare as Square);

    // Step A: Resolve Target Tile Hazards & Earth Shield Absorptions
    const resolution = resolveTargetTile(
      targetSquare,
      boardTileMap,
      pieceStatusMap,
      isCapture,
      targetPiece?.type
    );

    let nextPieceStatus = resolution.pieceStatusMap;
    let nextBoardTiles = resolution.boardTileMap;

    // Move status tracking from source square to destination square
    if (nextPieceStatus[fromSquare]) {
      const movedStatus = { ...nextPieceStatus[fromSquare], square: targetSquare };
      delete nextPieceStatus[fromSquare];
      nextPieceStatus[targetSquare] = movedStatus;
    }

    if (resolution.captureBlocked) {
      // Earth Shield absorbed the capture! Stop attacker on current square & play shield sound
      triggerBanner(resolution.message || '🛡️ Earth Shield absorbed the attack!');
      sounds.playCapture();
      setSelectedSquare(null);
      setValidMoves([]);
      setPieceStatusMap(nextPieceStatus);
      setBoardTileMap(nextBoardTiles);
      return;
    }

    // Step B: Execute standard chess.js move
    const result = game.move(move);
    if (!result) return;

    if (isCapture) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    if (resolution.message) {
      triggerBanner(resolution.message);
    }

    // Step C: Process End-of-Turn maintenance (burn countdowns, unfreezing, tile decay)
    const currentPieces = getBoardPieces(game);
    const endTurnResult = processEndOfTurn(
      nextBoardTiles,
      nextPieceStatus,
      turn,
      currentPieces
    );

    nextPieceStatus = endTurnResult.pieceStatusMap;
    nextBoardTiles = endTurnResult.boardTileMap;

    // If pieces were destroyed by fire, remove them from chess.js state by clearing square
    if (endTurnResult.destroyedSquares.length > 0) {
      endTurnResult.destroyedSquares.forEach((sq) => {
        // Enforce piece removal on fire destruction
        game.remove(sq as Square);
      });
    }

    endTurnResult.messages.forEach((msg) => triggerBanner(msg));

    // Update state
    setBoardTileMap(nextBoardTiles);
    setPieceStatusMap(nextPieceStatus);
    setSelectedSquare(null);
    setValidMoves([]);

    const nextTurn = game.turn();
    setTurn(nextTurn);

    // Check game over
    if (game.isGameOver()) {
      setIsGameOver(true);
      if (game.isCheckmate()) {
        setGameOverText(`Checkmate! ${turn === 'w' ? 'White' : 'Black'} wins!`);
      } else if (game.isDraw()) {
        setGameOverText('Game ended in a draw!');
      } else {
        setGameOverText('Game Over!');
      }
    }
  };

  // Bot move trigger
  useEffect(() => {
    if (gameMode === 'bot' && turn === 'b' && !isGameOver) {
      const timer = setTimeout(() => {
        const moves = game.moves({ verbose: true });
        if (moves.length === 0) return;

        // Filter out frozen black pieces
        const availableMoves = moves.filter((m) =>
          canPieceMove(m.from, pieceStatusMap)
        );

        if (availableMoves.length > 0) {
          const randomMove =
            availableMoves[Math.floor(Math.random() * availableMoves.length)];
          executeMove(randomMove);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, isGameOver, game, pieceStatusMap]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center w-full max-w-6xl mx-auto p-4">
      {/* LEFT PANEL: Game Status & Hazard Legend */}
      <div className="w-full lg:w-72 bg-gray-900/90 border border-gray-800 p-5 rounded-2xl shadow-2xl flex flex-col gap-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h2 className="text-lg font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span>⚔ Match Arena</span>
          </h2>
          <span className="text-xs font-semibold px-2 py-1 bg-amber-500/20 text-amber-300 rounded-md border border-amber-500/30 uppercase">
            {turn === 'w' ? 'White Turn' : 'Black Turn'}
          </span>
        </div>

        {/* Dynamic Hazard Legend */}
        <div className="flex flex-col gap-2.5 text-xs text-gray-300">
          <h3 className="font-bold uppercase tracking-wider text-gray-400">
            Elemental Hazards
          </h3>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-red-950/40 border border-red-800/50">
            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-red-300">Fire (Inferno)</p>
              <p className="text-[11px] text-gray-400">2-turn burn countdown before destruction.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-sky-950/40 border border-sky-800/50">
            <Snowflake className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <p className="font-bold text-sky-300">Ice (Glacier)</p>
              <p className="text-[11px] text-gray-400">Locks piece for 1 turn; grants physical immunity.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-950/40 border border-amber-800/50">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-amber-300">Earth (Fortress)</p>
              <p className="text-[11px] text-gray-400">Grants +1 Hit Protection to absorb next capture.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-teal-950/40 border border-teal-800/50">
            <Wind className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <p className="font-bold text-teal-300">Wind (Gale)</p>
              <p className="text-[11px] text-gray-400">Corridor allows sliding pieces to pass over friendly pieces.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetGame}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-transform active:scale-98"
        >
          <RefreshCw className="w-4 h-4" />
          <span>New Battle</span>
        </button>
      </div>

      {/* CENTER: CHESS BOARD & OVERLAY */}
      <div className="flex flex-col items-center gap-3">
        {/* Banner Alert Toast */}
        {bannerMessage && (
          <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-500 text-amber-200 text-xs font-bold py-2 px-4 rounded-xl shadow-xl animate-bounce">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
        )}

        <div className="relative bg-gray-900 p-3 rounded-2xl shadow-2xl border-4 border-amber-900/60 flex items-center justify-center">
          {/* Main 8x8 Board Container */}
          <div className="relative grid grid-cols-8 grid-rows-8 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-lg overflow-hidden border border-amber-950 shadow-inner select-none">
            {ranks.map((rank, rIdx) =>
              files.map((file, fIdx) => {
                const square = `${file}${rank}`;
                const isLight = (rIdx + fIdx) % 2 === 0;
                const piece = game.get(square as Square);
                const isSelected = selectedSquare === square;
                const isPossibleMove = validMoves.some((m) => m.to === square);

                let pieceKey = '';
                if (piece) {
                  pieceKey =
                    piece.color === 'w'
                      ? piece.type.toUpperCase()
                      : piece.type.toLowerCase();
                }

                return (
                  <div
                    key={square}
                    onClick={() => handleSquareClick(square)}
                    className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                      isLight ? 'bg-[#eeedd2]' : 'bg-[#769656]'
                    } ${isSelected ? '!bg-amber-400/80 ring-2 ring-amber-300' : ''}`}
                  >
                    {/* Possible move dot */}
                    {isPossibleMove && (
                      <div className="absolute w-4 h-4 rounded-full bg-amber-500/70 border border-amber-300 z-20 pointer-events-none animate-ping" />
                    )}

                    {/* Piece image */}
                    {pieceKey && PIECE_IMAGES[pieceKey] && (
                      <img
                        src={PIECE_IMAGES[pieceKey]}
                        alt={pieceKey}
                        className="w-[82%] h-[82%] object-contain z-10 drop-shadow-md pointer-events-none"
                      />
                    )}
                  </div>
                );
              })
            )}

            {/* ELEMENTAL VISUAL OVERLAY */}
            <ElementalOverlay
              boardTileMap={boardTileMap}
              pieceStatusMap={pieceStatusMap}
            />

            {/* GAME OVER OVERLAY */}
            {isGameOver && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center">
                <h3 className="text-3xl font-extrabold text-amber-400 mb-2 drop-shadow-md">
                  ⚔ Game Over!
                </h3>
                <p className="text-gray-200 text-sm font-semibold mb-6">
                  {gameOverText}
                </p>
                <button
                  onClick={handleResetGame}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Action Log */}
      <div className="w-full lg:w-72 bg-gray-900/90 border border-gray-800 p-5 rounded-2xl shadow-2xl flex flex-col gap-3 h-[420px]">
        <h3 className="text-sm font-extrabold text-gray-300 uppercase tracking-wider border-b border-gray-800 pb-2">
          📜 Battle Chronicle
        </h3>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs text-gray-400 scrollbar-thin">
          {logs.length === 0 ? (
            <p className="italic text-gray-600 text-center py-4">No events recorded yet.</p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-gray-800/60 border border-gray-700/50 leading-tight text-gray-200"
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
