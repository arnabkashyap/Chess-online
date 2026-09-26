// bot.js
// Difficulty-scaled Minimax AI for Element Chess

// ── Piece base values ─────────────────────────────────────────────────────────
const PIECE_VALUES = {
    'p': 10,
    'n': 30,
    'b': 32,   // slightly prefer bishops
    'r': 50,
    'q': 90,
    'k': 900
};

// ── Positional bonus tables (piece-square tables, indexed [row][col]) ─────────
// Positive = good for BLACK (which is the minimising player / bot side).
// These are used only on Medium and Hard to give the bot positional awareness.
const PST = {
    // Encourage pawns to advance and control the centre
    p: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 5,  5,  5,  5,  5,  5,  5,  5],
        [ 1,  1,  2,  3,  3,  2,  1,  1],
        [ 0,  0,  1,  2,  2,  1,  0,  0],
        [ 0,  0,  0,  2,  2,  0,  0,  0],
        [ 0, -1, -1,  0,  0, -1, -1,  0],
        [ 0,  1,  1, -2, -2,  1,  1,  0],
        [ 0,  0,  0,  0,  0,  0,  0,  0]
    ],
    // Knights prefer the centre
    n: [
        [-5, -4, -3, -3, -3, -3, -4, -5],
        [-4, -2,  0,  0,  0,  0, -2, -4],
        [-3,  0,  1,  2,  2,  1,  0, -3],
        [-3,  1,  2,  3,  3,  2,  1, -3],
        [-3,  0,  2,  3,  3,  2,  0, -3],
        [-3,  1,  1,  2,  2,  1,  1, -3],
        [-4, -2,  0,  1,  1,  0, -2, -4],
        [-5, -4, -3, -3, -3, -3, -4, -5]
    ],
    // Bishops prefer long diagonals
    b: [
        [-2, -1, -1, -1, -1, -1, -1, -2],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [-1,  0,  1,  1,  1,  1,  0, -1],
        [-1,  1,  1,  1,  1,  1,  1, -1],
        [-1,  0,  1,  1,  1,  1,  0, -1],
        [-1,  1,  1,  1,  1,  1,  1, -1],
        [-1,  1,  0,  0,  0,  0,  1, -1],
        [-2, -1, -1, -1, -1, -1, -1, -2]
    ],
    // Rooks prefer open files and 7th rank
    r: [
        [ 0,  0,  0,  0,  0,  0,  0,  0],
        [ 1,  2,  2,  2,  2,  2,  2,  1],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [ 0,  0,  0,  1,  1,  0,  0,  0]
    ],
    // Queen combination of rook + bishop tables
    q: [
        [-2, -1, -1,  0,  0, -1, -1, -2],
        [-1,  0,  1,  0,  0,  0,  0, -1],
        [-1,  1,  1,  1,  1,  1,  0, -1],
        [ 0,  0,  1,  1,  1,  1,  0,  0],
        [ 0,  0,  1,  1,  1,  1,  0,  0],
        [-1,  0,  1,  1,  1,  1,  0, -1],
        [-1,  0,  0,  0,  0,  0,  0, -1],
        [-2, -1, -1,  0,  0, -1, -1, -2]
    ],
    // King hides in opening/mid, centralises in endgame (simple version)
    k: [
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-3, -4, -4, -5, -5, -4, -4, -3],
        [-2, -3, -3, -4, -4, -3, -3, -2],
        [-1, -2, -2, -2, -2, -2, -2, -1],
        [ 2,  2,  0,  0,  0,  0,  2,  2],
        [ 2,  3,  1,  0,  0,  1,  3,  2]
    ]
};

// ── Difficulty configuration ──────────────────────────────────────────────────
// depth        : Minimax search depth
// blunderChance: probability [0-1] to ignore the best move and play randomly
// usePST       : whether to include positional bonus tables in evaluation
// elementalWeight: how strongly elemental square bonuses are weighted (0 = off)
//
// The `elementalWeight` hook is a forward-compatible slot.  Currently there are
// no elemental modifiers on the board object, so it evaluates to 0 for all
// difficulties.  If you add elemental square data later, scale it by this value.
const DIFFICULTY_CONFIG = {
    easy: {
        depth: 2,
        blunderChance: 0.30,
        usePST: false,
        elementalWeight: 0.0
    },
    medium: {
        depth: 3,
        blunderChance: 0.10,
        usePST: true,
        elementalWeight: 0.3
    },
    hard: {
        depth: 4,
        blunderChance: 0.00,
        usePST: true,
        elementalWeight: 1.0
    }
};

// ── Board evaluation ──────────────────────────────────────────────────────────
/**
 * Returns a score from White's perspective.
 *   positive  → White is winning
 *   negative  → Black (bot) is winning
 *
 * @param {Chess}  chess
 * @param {object} config  - DIFFICULTY_CONFIG entry
 */
function evaluateBoard(chess, config) {
    let total = 0;
    const board = chess.board();

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (!piece) continue;

            // 1. Base material value
            let val = PIECE_VALUES[piece.type];

            // 2. Positional bonus (Medium / Hard only)
            if (config.usePST && PST[piece.type]) {
                // For Black, the table is read top-to-bottom as-is.
                // For White, we mirror vertically (7 - row).
                const tableRow = piece.color === 'b' ? row : 7 - row;
                val += PST[piece.type][tableRow][col];
            }

            // 3. Elemental bonus hook
            // Extend here: val += getElementalBonus(row, col, piece) * config.elementalWeight;

            // 4. Sign: White pieces add, Black pieces subtract (from White's view)
            total += piece.color === 'w' ? val : -val;
        }
    }

    return total;
}

// ── Alpha-Beta Minimax ────────────────────────────────────────────────────────
function minimax(chess, depth, alpha, beta, isMaximizingPlayer, config) {
    if (depth === 0 || chess.game_over()) {
        return evaluateBoard(chess, config);
    }

    const moves = chess.moves();

    if (isMaximizingPlayer) {
        let bestVal = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            chess.move(moves[i]);
            bestVal = Math.max(bestVal, minimax(chess, depth - 1, alpha, beta, false, config));
            chess.undo();
            alpha = Math.max(alpha, bestVal);
            if (beta <= alpha) break; // Beta cut-off
        }
        return bestVal;
    } else {
        let bestVal = Infinity;
        for (let i = 0; i < moves.length; i++) {
            chess.move(moves[i]);
            bestVal = Math.min(bestVal, minimax(chess, depth - 1, alpha, beta, true, config));
            chess.undo();
            beta = Math.min(beta, bestVal);
            if (beta <= alpha) break; // Alpha cut-off
        }
        return bestVal;
    }
}

// ── Public entry point ────────────────────────────────────────────────────────
/**
 * Called by game.js after the player's move.
 * Reads `gameInstance.botDifficulty` to select the config profile.
 *
 * @param {ElementChessGame} gameInstance
 */
window.makeBotMove = function(gameInstance) {
    const chess = gameInstance.chess;
    const difficulty = (gameInstance.botDifficulty || 'medium').toLowerCase();
    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;

    const possibleMoves = chess.moves();
    if (possibleMoves.length === 0) return;

    // ── Blunder roll: Easy / Medium may play a random legal move ─────────────
    if (config.blunderChance > 0 && Math.random() < config.blunderChance) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        gameInstance.makeMove(randomMove);
        return;
    }

    // ── Minimax search for best move ──────────────────────────────────────────
    // Shuffle equal-valued moves to add natural variety
    possibleMoves.sort(() => Math.random() - 0.5);

    let bestMove = null;
    let bestValue = Infinity; // Bot is Black (minimising player)

    for (let i = 0; i < possibleMoves.length; i++) {
        chess.move(possibleMoves[i]);
        // After the bot's trial move, evaluate with White as maximiser
        const boardValue = minimax(chess, config.depth - 1, -Infinity, Infinity, true, config);
        chess.undo();

        if (boardValue < bestValue) {
            bestValue = boardValue;
            bestMove = possibleMoves[i];
        }
    }

    if (bestMove) {
        gameInstance.makeMove(bestMove);
    }
};
