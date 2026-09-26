import {
  BoardTileMap,
  PieceStatusMap,
  BoardTile,
  PieceStatus,
  ElementType,
} from '../types/elemental';

/**
  Checks whether a piece on a given square is allowed to initiate a move.
  Returns false if the piece is frozen.
 */
export function canPieceMove(
  square: string,
  pieceStatusMap: PieceStatusMap
): boolean {
  if (!square || !pieceStatusMap[square]) return true;
  return !pieceStatusMap[square].isFrozen;
}

export interface ResolveTargetResult {
  captureBlocked: boolean;
  targetPieceDestroyed: boolean;
  message?: string;
  pieceStatusMap: PieceStatusMap;
  boardTileMap: BoardTileMap;
  removedSquare?: string;
}

/**
 * Handles element interactions when a piece lands on or attacks a target square.
 */
export function resolveTargetTile(
  targetSquare: string,
  boardTileMap: BoardTileMap,
  pieceStatusMap: PieceStatusMap,
  isCapture: boolean,
  targetPieceType?: string
): ResolveTargetResult {
  const updatedBoardTiles: BoardTileMap = { ...boardTileMap };
  const updatedPieceStatus: PieceStatusMap = { ...pieceStatusMap };

  const tile = updatedBoardTiles[targetSquare];
  const targetStatus = updatedPieceStatus[targetSquare] || {
    square: targetSquare,
    isFrozen: false,
    isBurned: false,
    burnTurnsRemaining: 0,
    hasEarthShield: false,
  };

  const isKing = targetPieceType?.toLowerCase() === 'k';

  // 1. EARTH HANDLING: Absorbs attack if target has Earth Shield or is on Earth Tile
  if (isCapture && (targetStatus.hasEarthShield || tile?.element === 'earth')) {
    // Shield absorbs the capture attack!
    updatedPieceStatus[targetSquare] = {
      ...targetStatus,
      hasEarthShield: false,
    };

    if (tile && tile.element === 'earth') {
      // Consume shield on tile metadata if present
      updatedBoardTiles[targetSquare] = {
        ...tile,
        metadata: {
          ...tile.metadata,
          shieldStrength: 0,
        },
      };
    }

    return {
      captureBlocked: true,
      targetPieceDestroyed: false,
      message: '🛡️ Earth Shield absorbed the capture attack!',
      pieceStatusMap: updatedPieceStatus,
      boardTileMap: updatedBoardTiles,
    };
  }

  // If piece lands on Earth Tile without capture (or capture succeeded), grant Earth Shield
  if (tile?.element === 'earth') {
    updatedPieceStatus[targetSquare] = {
      ...targetStatus,
      hasEarthShield: true,
    };
  }

  // 2. ICE HANDLING: Freezes piece for 1 turn (Kings are immune per King Protection Rule)
  if (tile?.element === 'ice' && !isKing) {
    updatedPieceStatus[targetSquare] = {
      ...updatedPieceStatus[targetSquare],
      square: targetSquare,
      isFrozen: true,
      frozenTurnsRemaining: 1,
    };
  }

  // 3. FIRE HANDLING: Applies Burn countdown for 2 turns (Kings are immune per King Protection Rule)
  if (tile?.element === 'fire' && !isKing) {
    updatedPieceStatus[targetSquare] = {
      ...updatedPieceStatus[targetSquare],
      square: targetSquare,
      isBurned: true,
      burnTurnsRemaining: 2,
    };
  }

  let eventMsg: string | undefined;
  if (tile?.element === 'fire' && !isKing) {
    eventMsg = '🔥 Piece scorched by Fire! 2 turns to escape!';
  } else if (tile?.element === 'ice' && !isKing) {
    eventMsg = '❄️ Piece encased in Ice for 1 turn!';
  } else if (tile?.element === 'earth') {
    eventMsg = '🛡️ Piece fortified with Earth Shield (+1 Hit Protection)!';
  } else if (tile?.element === 'wind') {
    eventMsg = '💨 Wind Gale corridor activated!';
  }

  return {
    captureBlocked: false,
    targetPieceDestroyed: true,
    message: eventMsg,
    pieceStatusMap: updatedPieceStatus,
    boardTileMap: updatedBoardTiles,
  };
}

export interface EndOfTurnResult {
  pieceStatusMap: PieceStatusMap;
  boardTileMap: BoardTileMap;
  destroyedSquares: string[];
  messages: string[];
}

/**
 * Processes turn countdowns, burn damage, unfreezing, and tile decay at turn end.
 */
export function processEndOfTurn(
  boardTileMap: BoardTileMap,
  pieceStatusMap: PieceStatusMap,
  currentTurnColor: 'w' | 'b',
  boardPieces?: Record<string, { type: string; color: 'w' | 'b' }>
): EndOfTurnResult {
  const updatedBoardTiles: BoardTileMap = { ...boardTileMap };
  const updatedPieceStatus: PieceStatusMap = { ...pieceStatusMap };
  const destroyedSquares: string[] = [];
  const messages: string[] = [];

  // 1. Process Burn Countdowns & Unfreezing for pieces
  Object.keys(updatedPieceStatus).forEach((sq) => {
    const status = updatedPieceStatus[sq];
    if (!status) return;

    const pieceInfo = boardPieces ? boardPieces[sq] : undefined;
    const isKing = pieceInfo?.type.toLowerCase() === 'k';

    // Unfreeze pieces of the current turn color if freeze duration elapsed
    if (status.isFrozen) {
      const remaining = (status.frozenTurnsRemaining ?? 1) - 1;
      if (remaining <= 0) {
        updatedPieceStatus[sq] = {
          ...status,
          isFrozen: false,
          frozenTurnsRemaining: 0,
        };
        messages.push(`❄️ Piece at ${sq} thawed from ice!`);
      } else {
        updatedPieceStatus[sq] = {
          ...status,
          frozenTurnsRemaining: remaining,
        };
      }
    }

    // Process Burn countdown for pieces on current turn if burned
    if (status.isBurned && pieceInfo?.color === currentTurnColor) {
      if (isKing) {
        // King Protection Rule: Kings are immune to fire destruction
        updatedPieceStatus[sq] = {
          ...status,
          isBurned: false,
          burnTurnsRemaining: 0,
        };
      } else {
        const nextBurn = status.burnTurnsRemaining - 1;
        if (nextBurn <= 0) {
          // Piece destroyed by fire!
          destroyedSquares.push(sq);
          delete updatedPieceStatus[sq];
          messages.push(`🔥 Piece at ${sq} was consumed by Inferno Fire!`);
        } else {
          updatedPieceStatus[sq] = {
            ...status,
            burnTurnsRemaining: nextBurn,
          };
          messages.push(`🔥 Piece at ${sq} burn countdown: ${nextBurn} turn(s) left!`);
        }
      }
    }
  });

  // 2. Process Tile Duration Decay
  Object.keys(updatedBoardTiles).forEach((sq) => {
    const tile = updatedBoardTiles[sq];
    if (tile && tile.duration > 0) {
      const newDur = tile.duration - 1;
      if (newDur === 0) {
        updatedBoardTiles[sq] = {
          square: sq,
          element: 'none',
          duration: -1,
        };
        messages.push(`Tile at ${sq} elemental hazard expired.`);
      } else {
        updatedBoardTiles[sq] = {
          ...tile,
          duration: newDur,
        };
      }
    }
  });

  return {
    pieceStatusMap: updatedPieceStatus,
    boardTileMap: updatedBoardTiles,
    destroyedSquares,
    messages,
  };
}

/**
 * Generates dynamic elemental tiles with guaranteed VERTICAL SYMMETRY.
 * Ranks 1, 2, 7, and 8 remain hazard-free to avoid unfair opening traps.
 * Files (a-h) and Ranks (3-6) feature vertically mirrored hazard tiles.
 */
export function generateSymmetricTiles(seed?: number): BoardTileMap {
  const tiles: BoardTileMap = {};
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // Initialize all 64 squares as 'none'
  for (let r = 1; r <= 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${files[f]}${r}`;
      tiles[sq] = { square: sq, element: 'none', duration: -1 };
    }
  }

  // Pseudo-random generator using seed or Math.random
  let currentSeed = seed ?? Date.now();
  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  const elements: ElementType[] = ['fire', 'ice', 'earth', 'wind'];

  // Hazards are placed only on Ranks 3, 4, 5, 6
  // Symmetric mapping: Square (fileIdx, rank) mirrors to (7 - fileIdx, rank) or rank 9 - rank
  // To ensure vertical symmetry between White (ranks 1-4) and Black (ranks 5-8):
  // (fileIdx, 3) <-> (fileIdx, 6)
  // (fileIdx, 4) <-> (fileIdx, 5)

  const hazardConfigs: { fileIdx: number; rank: number; element: ElementType }[] = [
    { fileIdx: 2, rank: 3, element: 'fire' }, // c3
    { fileIdx: 5, rank: 3, element: 'ice' },  // f3
    { fileIdx: 3, rank: 4, element: 'earth' },// d4
    { fileIdx: 4, rank: 4, element: 'wind' }, // e4
  ];

  // Randomize placement if seed is provided
  hazardConfigs.forEach((cfg) => {
    const elIndex = Math.floor(pseudoRandom() * elements.length);
    const element = elements[elIndex];
    const dur = element === 'fire' || element === 'ice' ? 6 : -1;

    // Primary square (e.g. c3)
    const primarySquare = `${files[cfg.fileIdx]}${cfg.rank}`;
    tiles[primarySquare] = { square: primarySquare, element, duration: dur };

    // Vertically mirrored square for Black (e.g. c6 for c3, d5 for d4)
    const mirroredRank = 9 - cfg.rank; // 3 -> 6, 4 -> 5
    const mirroredSquare = `${files[cfg.fileIdx]}${mirroredRank}`;
    tiles[mirroredSquare] = { square: mirroredSquare, element, duration: dur };

    // Horizontally mirrored pair for complete symmetry (e.g. f3 -> f6)
    const mirrorFileIdx = 7 - cfg.fileIdx; // c(2) -> f(5), d(3) -> e(4)
    const hSquare1 = `${files[mirrorFileIdx]}${cfg.rank}`;
    const hSquare2 = `${files[mirrorFileIdx]}${mirroredRank}`;

    tiles[hSquare1] = { square: hSquare1, element, duration: dur };
    tiles[hSquare2] = { square: hSquare2, element, duration: dur };
  });

  return tiles;
}

/**
 * Checks if a sliding piece move along a wind corridor is allowed.
 * Allows Rooks, Bishops, and Queens to slide through 1 friendly piece
 * if moving along a line containing Wind Tiles.
 */
export function getWindExtendedMoves(
  square: string,
  pieceType: string,
  pieceColor: 'w' | 'b',
  boardTileMap: BoardTileMap,
  boardPieces: Record<string, { type: string; color: 'w' | 'b' }>
): string[] {
  const extendedMoves: string[] = [];
  const type = pieceType.toLowerCase();
  if (type !== 'r' && type !== 'b' && type !== 'q') return extendedMoves;

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const fileIdx = files.indexOf(square[0]);
  const rank = parseInt(square[1]);

  const directions: [number, number][] = [];
  if (type === 'r' || type === 'q') {
    directions.push([0, 1], [0, -1], [1, 0], [-1, 0]); // Rook vectors
  }
  if (type === 'b' || type === 'q') {
    directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]); // Bishop vectors
  }

  directions.forEach(([df, dr]) => {
    let currentF = fileIdx + df;
    let currentR = rank + dr;
    let passedFriendly = false;

    while (currentF >= 0 && currentF < 8 && currentR >= 1 && currentR <= 8) {
      const sq = `${files[currentF]}${currentR}`;
      const hasWind = boardTileMap[sq]?.element === 'wind';
      const piece = boardPieces[sq];

      if (!piece) {
        extendedMoves.push(sq);
      } else {
        if (piece.color === pieceColor) {
          if (!passedFriendly && hasWind) {
            // Wind corridor allows hopping over 1 friendly piece!
            passedFriendly = true;
          } else {
            break;
          }
        } else {
          // Enemy piece can be captured, stop ray
          extendedMoves.push(sq);
          break;
        }
      }

      currentF += df;
      currentR += dr;
    }
  });

  return extendedMoves;
}
