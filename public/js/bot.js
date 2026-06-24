// bot.js
// Simple Minimax AI for Element Chess

const pieceValues = {
    'p': 10,
    'n': 30,
    'b': 30,
    'r': 50,
    'q': 90,
    'k': 900
};

function evaluateBoard(chess) {
    let totalEvaluation = 0;
    const board = chess.board();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece, x, y) {
    if (piece === null) {
        return 0;
    }
    const getAbsoluteValue = function(piece, isWhite, x, y) {
        if (piece.type === 'p') {
            return pieceValues[piece.type];
        } else {
            return pieceValues[piece.type];
        }
    };

    const val = getAbsoluteValue(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? val : -val;
}

function minimax(chess, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || chess.game_over()) {
        return evaluateBoard(chess);
    }

    const moves = chess.moves();

    if (isMaximizingPlayer) {
        let bestVal = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            chess.move(moves[i]);
            bestVal = Math.max(bestVal, minimax(chess, depth - 1, alpha, beta, !isMaximizingPlayer));
            chess.undo();
            alpha = Math.max(alpha, bestVal);
            if (beta <= alpha) {
                break;
            }
        }
        return bestVal;
    } else {
        let bestVal = Infinity;
        for (let i = 0; i < moves.length; i++) {
            chess.move(moves[i]);
            bestVal = Math.min(bestVal, minimax(chess, depth - 1, alpha, beta, !isMaximizingPlayer));
            chess.undo();
            beta = Math.min(beta, bestVal);
            if (beta <= alpha) {
                break;
            }
        }
        return bestVal;
    }
}

window.makeBotMove = function(gameInstance) {
    const chess = gameInstance.chess;
    
    // We are black, so we want to minimize the evaluation score
    let bestMove = null;
    let bestValue = Infinity;
    
    // Depth 3 is standard for responsive JS browser bots
    const depth = 2; 
    
    const possibleMoves = chess.moves();
    
    if (possibleMoves.length === 0) return;
    
    // Shuffle moves to add some randomness to equal evaluated moves
    possibleMoves.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < possibleMoves.length; i++) {
        const move = possibleMoves[i];
        chess.move(move);
        
        // After making a move, we evaluate for White (maximizing player)
        const boardValue = minimax(chess, depth - 1, -Infinity, Infinity, true);
        chess.undo();
        
        if (boardValue < bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }
    
    if (bestMove) {
        gameInstance.makeMove(bestMove);
    }
};
