// game.js
// Main game logic and UI rendering

const PIECE_IMAGES = {
    'p': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'n': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'b': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'r': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'q': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'k': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    'P': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'N': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'B': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'R': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'Q': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'K': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
};

class SoundEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    playMove() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        
        // Use a triangle wave for a warmer, wood-like organic thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        // Quick pitch drop mimics a piece impacting a surface
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        
        // Tight, fast decay prevents ringing, sounding like solid wood
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }
    
    playCapture() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        
        // Layer 1: High frequency click (the physical collision)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        // Layer 2: Deeper resonance thump (the energy of the slide/capture)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(140, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        gain2.gain.setValueAtTime(0.5, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.05);
        osc2.stop(now + 0.12);
    }
    
    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
        
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }
}
const SOUNDS = new SoundEngine();

class ElementChessGame {
    constructor() {
        this.chess = new Chess();
        this.boardElement = document.getElementById('board');
        
        this.selectedSquare = null;
        this.validMoves = [];
        
        this.playerColor = 'w'; // Local player is always white initially
        this.gameMode = 'bot'; // 'local', 'bot', 'multiplayer'
        
        this.initBoard();
        this.bindEvents();
        this.updateUI();
    }

    initBoard() {
        this.boardElement.innerHTML = '';
        const files = 'abcdefgh';
        const ranks = '87654321';

        for (let r = 0; r < 8; r++) {
            for (let f = 0; f < 8; f++) {
                const squareName = files[f] + ranks[r];
                const isLight = (f + r) % 2 === 0;
                
                const squareDiv = document.createElement('div');
                squareDiv.className = `square ${isLight ? 'light' : 'dark'}`;
                squareDiv.dataset.square = squareName;
                
                // Add click listener
                squareDiv.addEventListener('click', () => this.onSquareClick(squareName));
                
                this.boardElement.appendChild(squareDiv);
            }
        }
    }

    bindEvents() {
        // Game mode
        document.getElementById('game-mode').addEventListener('change', (e) => {
            this.gameMode = e.target.value;
            if (this.gameMode === 'multiplayer') {
                document.getElementById('multiplayer-controls').classList.remove('hidden');
                document.getElementById('multiplayer-controls').classList.add('flex');
            } else {
                document.getElementById('multiplayer-controls').classList.add('hidden');
                document.getElementById('multiplayer-controls').classList.remove('flex');
            }
            this.resetGame();
        });

        // Restart
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    resetGame() {
        this.chess.reset();
        this.selectedSquare = null;
        this.validMoves = [];
        document.getElementById('game-over-overlay').classList.add('hidden');
        this.updateUI();
    }

    onSquareClick(squareName) {
        if (this.chess.game_over()) return;

        // Ensure it's our turn if playing against bot or multiplayer
        if ((this.gameMode === 'bot' || this.gameMode === 'multiplayer') && this.chess.turn() !== this.playerColor) {
            return;
        }

        const piece = this.chess.get(squareName);

        // Handle normal movement
        if (this.selectedSquare) {
            // Is it a valid move?
            const move = this.validMoves.find(m => m.to === squareName);
            
            if (move) {
                this.makeMove(move);
                return;
            }
        }

        // Select a piece
        if (piece && piece.color === this.chess.turn()) {
            this.selectedSquare = squareName;
            this.validMoves = this.chess.moves({ square: squareName, verbose: true });
        } else {
            this.selectedSquare = null;
            this.validMoves = [];
        }

        this.renderBoard();
    }

    makeMove(move) {
        const isCapture = move.flags && (move.flags.includes('c') || move.flags.includes('e'));

        this.chess.move(move);
        this.selectedSquare = null;
        this.validMoves = [];
        
        // Play appropriate sound
        if (isCapture) {
            SOUNDS.playCapture();
        } else {
            SOUNDS.playMove();
        }
        
        this.updateUI();

        // Check game over
        if (this.chess.game_over()) {
            this.handleGameOver();
            return;
        }

        // Trigger bot if mode is bot
        if (this.gameMode === 'bot' && this.chess.turn() === 'b') {
            setTimeout(() => {
                if (window.makeBotMove) {
                    window.makeBotMove(this);
                }
            }, 500); // Small delay for realism
        }
    }

    handleGameOver() {
        const overlay = document.getElementById('game-over-overlay');
        const text = document.getElementById('game-over-text');
        
        if (this.chess.in_checkmate()) {
            text.innerText = `Checkmate! ${this.chess.turn() === 'w' ? 'Black' : 'White'} wins.`;
        } else if (this.chess.in_draw()) {
            text.innerText = "Draw!";
        } else {
            text.innerText = "Game Over";
        }
        
        overlay.classList.remove('hidden');
    }

    updateUI() {
        this.renderBoard();
    }

    renderBoard() {
        const squares = document.querySelectorAll('.square');
        
        squares.forEach(sq => {
            const squareName = sq.dataset.square;
            const piece = this.chess.get(squareName);
            
            // Clear existing pieces and classes
            sq.innerHTML = '';
            sq.classList.remove('selected', 'valid-move', 'capture');
            
            // Add piece if exists
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'piece w-full h-full';
                
                // Determine image key (Uppercase for white, Lowercase for black)
                const imgKey = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
                pieceDiv.style.backgroundImage = `url(${PIECE_IMAGES[imgKey]})`;
                
                sq.appendChild(pieceDiv);
            }
            
            // Highlight selected
            if (squareName === this.selectedSquare) {
                sq.classList.add('selected');
            }
            
            // Highlight valid moves
            const move = this.validMoves.find(m => m.to === squareName);
            if (move) {
                sq.classList.add('valid-move');
                if (this.chess.get(squareName)) {
                    sq.classList.add('capture');
                }
            }
        });
    }
}

// Initialize on load
window.onload = () => {
    window.gameInstance = new ElementChessGame();
};
