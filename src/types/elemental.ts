export type ElementType = 'fire' | 'ice' | 'earth' | 'wind' | 'none';

export interface TileMetadata {
  shieldStrength?: number;
  burnedPieceColor?: 'w' | 'b';
  turnsRemaining?: number;
}

export interface BoardTile {
  square: string;
  element: ElementType;
  duration: number; // -1 for persistent, >0 for decaying turn duration
  metadata?: TileMetadata;
}

export type BoardTileMap = Record<string, BoardTile>;

export interface PieceStatus {
  square: string;
  isFrozen: boolean;
  isBurned: boolean;
  burnTurnsRemaining: number;
  hasEarthShield: boolean;
  frozenTurnsRemaining?: number;
}

export type PieceStatusMap = Record<string, PieceStatus>;

export interface TileResolutionResult {
  captureBlocked: boolean;
  targetPieceDestroyed: boolean;
  message?: string;
  pieceStatusMap: PieceStatusMap;
  boardTileMap: BoardTileMap;
}
