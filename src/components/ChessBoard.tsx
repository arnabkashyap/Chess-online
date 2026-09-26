'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { BoardTileMap, PieceStatusMap } from '@/types/elemental';
import {
  canPieceMove,
  resolveTargetTile,
  processEndOfTurn,
  generateSymmetricTiles,
} from '@/engine/elementalEngine';
import ElementalOverlay from './ChessBoard/ElementalOverlay';
import PlayerCard from './PlayerCard';
import ElementalSpellBar from './ElementalSpellBar';
import ControlPanel, { MoveHistoryItem } from './ControlPanel';
import Header from './Header';
import { AlertCircle, RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

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
    if (this.isMuted || !this.ctx) return;
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
    if (this.isMuted || !this.ctx) return;
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

export const ChessBoard: React.FC = () => {
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [boardTileMap, setBoardTileMap] = useState<BoardTileMap>(() =>
    generateSymmetricTiles(12345)
  );
  const [pieceStatusMap, setPieceStatusMap] = useState<PieceStatusMap>({});

  // Game Settings & Modes
  const [gameMode, setGameMode] = useState<'local' | 'bot' | 'multiplayer'>('local');
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Player State
  const [whiteMana, setWhiteMana] = useState(4);
  const [blackMana, setBlackMana] = useState(4);
  const [whiteCaptured, setWhiteCaptured] = useState<string[]>([]);
  const [blackCaptured, setBlackCaptured] = useState<string[]>([]);
  const [activeSpell, setActiveSpell] = useState<string | null>(null);

  // Board State
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverText, setGameOverText] = useState('');

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = isFlipped ? [...files].reverse() : files;
  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

  const triggerBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleResetGame = useCallback(() => {
    setGame(new Chess());
    setBoardTileMap(generateSymmetricTiles());
    setPieceStatusMap({});
    setSelectedSquare(null);
    setValidMoves([]);
    setBannerMessage(null);
    setMoveHistory([]);
    setTurn('w');
    setWhiteMana(4);
    setBlackMana(4);
    setWhiteCaptured([]);
    setBlackCaptured([]);
    setActiveSpell(null);
    setIsGameOver(false);
    setGameOverText('');
  }, []);

  // Material calculations
  const whiteScore = whiteCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p.toLowerCase()] || 1), 0);
  const blackScore = blackCaptured.reduce((sum, p) => sum + (PIECE_VALUES[p.toLowerCase()] || 1), 0);
  const whiteAdvantage = Math.max(0, whiteScore - blackScore);
  const blackAdvantage = Math.max(0, blackScore - whiteScore);

  const handleSquareClick = (square: string) => {
    if (isGameOver) return;

    // Check turn for Bot mode
    if (gameMode === 'bot' && turn === 'b') return;

    // A. CASTING SPELL MODE
    if (activeSpell) {
      castSpellOnSquare(square, activeSpell);
      setActiveSpell(null);
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

  const castSpellOnSquare = (square: string, spellId: string) => {
    const currentMana = turn === 'w' ? whiteMana : blackMana;
    let cost = 3;
    let element: 'fire' | 'ice' | 'earth' | 'wind' = 'fire';
    let spellName = 'Spell';

    if (spellId === 'fire_trap') {
      cost = 4;
      element = 'fire';
      spellName = 'Inferno Strike';
    } else if (spellId === 'ice_trap') {
      cost = 3;
      element = 'ice';
      spellName = 'Glacier Snap';
    } else if (spellId === 'earth_shield') {
      cost = 3;
      element = 'earth';
      spellName = 'Earth Fortress';
    } else if (spellId === 'wind_gale') {
      cost = 2;
      element = 'wind';
      spellName = 'Gale Surge';
    }

    if (currentMana < cost) {
      triggerBanner(`❌ Insufficient Mana to cast ${spellName}!`);
      return;
    }

    // Deduct Mana
    if (turn === 'w') {
      setWhiteMana((m) => Math.max(0, m - cost));
    } else {
      setBlackMana((m) => Math.max(0, m - cost));
    }

    // Apply Tile Hazard directly onto selected square
    const nextTiles = { ...boardTileMap };
    const dur = element === 'fire' || element === 'ice' ? 6 : -1;
    nextTiles[square] = { square, element, duration: dur };
    setBoardTileMap(nextTiles);

    triggerBanner(`✨ Cast ${spellName} on ${square}!`);

    // Log move chronicle
    setMoveHistory((prev) => [
      {
        san: `Cast ${spellName} @ ${square}`,
        color: turn,
        elementTrigger: element,
        moveNumber: Math.floor(prev.length / 2) + 1,
      },
      ...prev,
    ]);
  };

  const executeMove = (move: Move) => {
    const fromSquare = move.from;
    const targetSquare = move.to;
    const isCapture = move.flags.includes('c') || move.flags.includes('e');
    const targetPiece = game.get(targetSquare as Square);

    if (isCapture && targetPiece) {
      if (turn === 'w') {
        setWhiteCaptured((prev) => [...prev, targetPiece.type]);
      } else {
        setBlackCaptured((prev) => [...prev, targetPiece.type]);
      }
    }

    // Step A: Target Tile Resolution
    const resolution = resolveTargetTile(
      targetSquare,
      boardTileMap,
      pieceStatusMap,
      isCapture,
      targetPiece?.type
    );

    let nextPieceStatus = resolution.pieceStatusMap;
    let nextBoardTiles = resolution.boardTileMap;

    if (nextPieceStatus[fromSquare]) {
      const movedStatus = { ...nextPieceStatus[fromSquare], square: targetSquare };
      delete nextPieceStatus[fromSquare];
      nextPieceStatus[targetSquare] = movedStatus;
    }

    if (resolution.captureBlocked) {
      triggerBanner(resolution.message || '🛡️ Earth Shield absorbed the attack!');
      sounds.playCapture();
      setSelectedSquare(null);
      setValidMoves([]);
      setPieceStatusMap(nextPieceStatus);
      setBoardTileMap(nextBoardTiles);
      return;
    }

    // Step B: Execute standard chess move
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

    // Record Move Chronicle
    const targetTileElem = boardTileMap[targetSquare]?.element;
    const elemTag = targetTileElem !== 'none' ? targetTileElem : undefined;

    setMoveHistory((prev) => [
      {
        san: result.san,
        color: turn,
        elementTrigger: elemTag,
        moveNumber: Math.floor(prev.length / 2) + 1,
      },
      ...prev,
    ]);

    // Step C: Process End of Turn
    const endTurnResult = processEndOfTurn(
      nextBoardTiles,
      nextPieceStatus,
      turn
    );

    nextPieceStatus = endTurnResult.pieceStatusMap;
    nextBoardTiles = endTurnResult.boardTileMap;

    if (endTurnResult.destroyedSquares.length > 0) {
      endTurnResult.destroyedSquares.forEach((sq) => game.remove(sq as Square));
    }

    endTurnResult.messages.forEach((msg) => triggerBanner(msg));

    // Regenerate +1 Mana per turn up to 10
    if (turn === 'w') {
      setWhiteMana((m) => Math.min(10, m + 1));
    } else {
      setBlackMana((m) => Math.min(10, m + 1));
    }

    setBoardTileMap(nextBoardTiles);
    setPieceStatusMap(nextPieceStatus);
    setSelectedSquare(null);
    setValidMoves([]);

    const nextTurn = game.turn();
    setTurn(nextTurn);

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

  // Bot Turn Effect
  useEffect(() => {
    if (gameMode === 'bot' && turn === 'b' && !isGameOver) {
      const timer = setTimeout(() => {
        const moves = game.moves({ verbose: true });
        if (moves.length === 0) return;

        const availableMoves = moves.filter((m) =>
          canPieceMove(m.from, pieceStatusMap)
        );

        if (availableMoves.length > 0) {
          const randomMove =
            availableMoves[Math.floor(Math.random() * availableMoves.length)];
          executeMove(randomMove);
        }
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, isGameOver, game, pieceStatusMap]);

  return (
    <div className="w-full flex flex-col items-center">
      <Header
        isMuted={isMuted}
        onToggleMute={() => {
          sounds.isMuted = !isMuted;
          setIsMuted(!isMuted);
        }}
      />

      {/* 3-COLUMN DESKTOP LAYOUT */}
      <div className="w-full max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Player Cards & Graveyard */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <PlayerCard
            name={gameMode === 'bot' ? 'Elemental Bot' : 'Black Mage'}
            color="b"
            isTurn={turn === 'b'}
            mana={blackMana}
            capturedPieces={blackCaptured}
            materialAdvantage={blackAdvantage}
            isBot={gameMode === 'bot'}
          />

          <PlayerCard
            name="White Archmage"
            color="w"
            isTurn={turn === 'w'}
            mana={whiteMana}
            capturedPieces={whiteCaptured}
            materialAdvantage={whiteAdvantage}
          />
        </div>

        {/* CENTER COLUMN: Turn Advantage Banner, Chessboard & Spell Bar */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4">
          
          {/* Turn Banner Notification */}
          <div className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-black uppercase text-amber-300">
                {turn === 'w' ? "White's Turn" : "Black's Turn"}
              </span>
            </div>
            {bannerMessage && (
              <span className="text-xs font-bold text-amber-400 animate-pulse truncate max-w-[240px]">
                {bannerMessage}
              </span>
            )}
          </div>

          {/* CHESSBOARD GRID CANVAS */}
          <div className="relative bg-slate-950 p-3 rounded-2xl shadow-2xl border-4 border-amber-900/60 flex items-center justify-center">
            <div className="relative grid grid-cols-8 grid-rows-8 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-lg overflow-hidden border border-amber-950 shadow-inner select-none">
              {displayRanks.map((rank, rIdx) =>
                displayFiles.map((file, fIdx) => {
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
                        isLight ? 'bg-[#ebd9b4]' : 'bg-[#a37849]'
                      } ${
                        isSelected ? '!bg-amber-400/90 ring-4 ring-amber-300 z-20' : ''
                      }`}
                    >
                      {/* Possible move target highlight */}
                      {isPossibleMove && (
                        <div className="absolute w-4 h-4 rounded-full bg-amber-500/80 border-2 border-amber-200 z-20 pointer-events-none animate-ping" />
                      )}

                      {/* Piece image */}
                      {pieceKey && PIECE_IMAGES[pieceKey] && (
                        <img
                          src={PIECE_IMAGES[pieceKey]}
                          alt={pieceKey}
                          className="w-[84%] h-[84%] object-contain z-10 drop-shadow-lg pointer-events-none transition-transform hover:scale-110"
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
                flipped={isFlipped}
              />

              {/* GAME OVER OVERLAY */}
              {isGameOver && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center">
                  <Trophy className="w-12 h-12 text-amber-400 animate-bounce mb-2" />
                  <h3 className="text-3xl font-black text-amber-400 uppercase tracking-wider mb-2">
                    Match Concluded!
                  </h3>
                  <p className="text-slate-200 text-sm font-semibold mb-6">
                    {gameOverText}
                  </p>
                  <button
                    onClick={handleResetGame}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    Play New Match
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ELEMENTAL SPELL ACTION BAR */}
          <ElementalSpellBar
            currentMana={turn === 'w' ? whiteMana : blackMana}
            activeSpell={activeSpell}
            onSelectSpell={setActiveSpell}
            isPlayerTurn={gameMode !== 'bot' || turn === 'w'}
          />
        </div>

        {/* RIGHT COLUMN: Control Panel & Move History */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <ControlPanel
            gameMode={gameMode}
            onSelectGameMode={(m) => {
              setGameMode(m);
              handleResetGame();
            }}
            botDifficulty={botDifficulty}
            onSelectBotDifficulty={setBotDifficulty}
            moveHistory={moveHistory}
            onResetGame={handleResetGame}
            onFlipBoard={() => setIsFlipped(!isFlipped)}
            onResign={() => {
              setIsGameOver(true);
              setGameOverText(`${turn === 'w' ? 'White' : 'Black'} resigned the match.`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
