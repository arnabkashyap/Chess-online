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
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
    
    playCapture() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
    
    playExplosion() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}
const SOUNDS = new SoundEngine();

class ElementChessGame {
    constructor() {
        this.chess = new Chess();
        this.elementSystem = new ElementSystem(this);
        this.boardElement = document.getElementById('board');
        
        this.selectedSquare = null;
        this.validMoves = [];
        
        this.playerColor = 'w'; // Local player is always white initially
        this.gameMode = 'bot'; // 'local', 'bot', 'multiplayer'
        
        this.elementMode = false; // True when player clicked "Use Element" and needs to select target
        
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
        // Element selection for Player 1
        document.getElementById('p1-element').addEventListener('change', (e) => {
            this.elementSystem.setElement('w', e.target.value);
            this.updateUI();
        });

        // Use Element button for Player 1
        document.getElementById('p1-use-element').addEventListener('click', () => {
            if (this.elementSystem.canUseElement('w')) {
                this.elementMode = true;
                document.getElementById('p1-element-status').innerText = "Select target piece on board";
                document.getElementById('p1-use-element').classList.add('ring-4', 'ring-red-500');
            }
        });
        
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
        this.elementSystem = new ElementSystem(this);
        this.selectedSquare = null;
        this.validMoves = [];
        this.elementMode = false;
        document.getElementById('game-over-overlay').classList.add('hidden');
        document.getElementById('p1-use-element').classList.remove('ring-4', 'ring-red-500');
        
        // Reset elements
        const p1El = document.getElementById('p1-element').value;
        const p2El = document.getElementById('p2-element').value;
        this.elementSystem.setElement('w', p1El);
        this.elementSystem.setElement('b', p2El);
        
        this.updateUI();
    }

    onSquareClick(squareName) {
        if (this.chess.game_over()) return;

        // Ensure it's our turn if playing against bot or multiplayer
        if ((this.gameMode === 'bot' || this.gameMode === 'multiplayer') && this.chess.turn() !== this.playerColor) {
            return;
        }

        const piece = this.chess.get(squareName);

        // Handle element mode targeting
        if (this.elementMode) {
            const success = this.elementSystem.useElement(this.playerColor, squareName);
            if (success) {
                this.elementMode = false;
                document.getElementById('p1-use-element').classList.remove('ring-4', 'ring-red-500');
                document.getElementById('p1-element-status').innerText = "Element used!";
                this.renderBoard();
            } else {
                alert("Invalid target for element.");
            }
            return;
        }

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
            // Check if piece is frozen
            if (this.elementSystem.isSquareFrozen(squareName)) {
                console.log("This piece is frozen!");
                this.selectedSquare = null;
                this.validMoves = [];
            } else {
                this.selectedSquare = squareName;
                this.validMoves = this.chess.moves({ square: squareName, verbose: true });
            }
        } else {
            this.selectedSquare = null;
            this.validMoves = [];
        }

        this.renderBoard();
    }

    makeMove(move) {
        // Track fire imp movements
        this.elementSystem.updateFireImpPosition(move.from, move.to);
        
        // Check if a fire imp was captured
        let explosion = false;
        if (this.chess.get(move.to)) {
            explosion = this.elementSystem.checkFireImpCapture(move.to);
        }

        const isCapture = move.flags && (move.flags.includes('c') || move.flags.includes('e'));

        this.chess.move(move);
        this.selectedSquare = null;
        this.validMoves = [];
        
        // Play appropriate sound
        if (explosion) {
            SOUNDS.playExplosion();
        } else if (isCapture) {
            SOUNDS.playCapture();
        } else {
            SOUNDS.playMove();
        }
        
        this.elementSystem.onTurnStart(this.chess.turn());
        
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

        // Update Use Element button state
        const p1Btn = document.getElementById('p1-use-element');
        if (this.elementSystem.canUseElement('w')) {
            p1Btn.disabled = false;
            p1Btn.classList.remove('opacity-50', 'cursor-not-allowed');
            document.getElementById('p1-element-status').innerText = "Ready to use";
        } else {
            p1Btn.disabled = true;
            p1Btn.classList.add('opacity-50', 'cursor-not-allowed');
            if (this.elementSystem.playerStates['w'].used) {
                document.getElementById('p1-element-status').innerText = "Element used";
            } else {
                document.getElementById('p1-element-status').innerText = "Select an element to begin";
            }
        }
    }

    renderBoard() {
        const squares = document.querySelectorAll('.square');
        
        squares.forEach(sq => {
            const squareName = sq.dataset.square;
            const piece = this.chess.get(squareName);
            
            // Clear existing pieces and classes
            sq.innerHTML = '';
            sq.classList.remove('selected', 'valid-move', 'capture', 'fire-imp', 'frozen');
            
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
            
            // Element specific classes
            if (this.elementSystem.game.fireImps && this.elementSystem.game.fireImps.some(i => i.square === squareName)) {
                sq.classList.add('fire-imp');
            }
            
            if (this.elementSystem.isSquareFrozen(squareName)) {
                sq.classList.add('frozen');
            }
        });
    }

    playExplosionAnimation(squareName) {
        const sq = document.querySelector(`.square[data-square="${squareName}"]`);
        if (sq) {
            sq.classList.add('fire-explosion');
            setTimeout(() => {
                sq.classList.remove('fire-explosion');
                this.renderBoard();
            }, 500);
        }
    }
}

// Initialize on load
window.onload = () => {
    window.gameInstance = new ElementChessGame();
};
