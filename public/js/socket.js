// socket.js
// Handles client-side multiplayer communication via Socket.IO

window.addEventListener('DOMContentLoaded', () => {
    // Only initialise if Socket.IO is available (i.e. running on our Node server)
    if (typeof io === 'undefined') return;

    const socket = io();

    // ── DOM references ─────────────────────────────────────────────────────────
    const findMatchBtn    = document.getElementById('find-match-btn');
    const cancelSearchBtn = document.getElementById('cancel-search-btn');
    const idleState       = document.getElementById('idle-state');
    const searchingState  = document.getElementById('searching-state');
    const statusText      = document.getElementById('room-status');

    // The room this client is currently playing in (null when not in a game)
    let currentRoom = null;
    // Whether this client is currently in the matchmaking queue
    let isSearching = false;

    // ── UI helpers ─────────────────────────────────────────────────────────────
    function showIdleState() {
        idleState.classList.remove('hidden');
        searchingState.classList.add('hidden');
        isSearching = false;
    }

    function showSearchingState() {
        idleState.classList.add('hidden');
        searchingState.classList.remove('hidden');
        searchingState.classList.add('flex');
        isSearching = true;
    }

    function setStatus(msg) {
        if (statusText) statusText.innerText = msg;
    }

    // ── Button: Find Match ─────────────────────────────────────────────────────
    findMatchBtn.addEventListener('click', () => {
        if (window.gameInstance && window.gameInstance.gameMode === 'multiplayer' && !isSearching) {
            const currentUser = window.authManager ? window.authManager.getCurrentUser() : null;
            socket.emit('find_match', currentUser);
            showSearchingState();
            setStatus('');
        }
    });

    // ── Button: Cancel Search ──────────────────────────────────────────────────
    cancelSearchBtn.addEventListener('click', () => {
        if (isSearching) {
            socket.emit('cancel_search');
            showIdleState();
            setStatus('Search cancelled.');
            // Clear status after 2s
            setTimeout(() => setStatus(''), 2000);
        }
    });

    // ── Safety guard: clean up queue entry when user closes / navigates away ───
    window.addEventListener('beforeunload', () => {
        if (isSearching) {
            // sendBeacon would be better for HTTP, but socket.emit works
            // synchronously enough here before the socket closes
            socket.emit('cancel_search');
        }
    });

    // ── Socket Events ──────────────────────────────────────────────────────────

    /** Server confirmed we are in the queue waiting for an opponent. */
    socket.on('in_queue', () => {
        // UI is already in searching state; nothing extra needed
        setStatus('');
    });

    /**
     * Server found a match.
     * Payload: { roomId: string, color: 'w' | 'b' }
     */
    socket.on('match_found', ({ roomId, color, opponent }) => {
        currentRoom = roomId;
        isSearching = false;

        // Update game state
        if (window.gameInstance) {
            window.gameInstance.playerColor = color;
            window.gameInstance.opponent = opponent;
            window.gameInstance.resetGame();
        }

        // Reset UI back to idle so "Play Again" can re-queue later
        showIdleState();
        setStatus(`Match found! You are ${color === 'w' ? 'White ♙' : 'Black ♟'}`);
    });

    /** Both players are ready; game is live. */
    socket.on('game_start', () => {
        setStatus(`Game in progress — Room ${currentRoom}`);
    });

    /** Opponent left the game. */
    socket.on('opponent_disconnected', () => {
        setStatus('Opponent disconnected.');
        currentRoom = null;
        if (window.gameInstance) {
            window.gameInstance.opponent = null;
            window.gameInstance.updateProfiles();
        }
        showIdleState();
    });

    /** Apply a move sent by the opponent. */
    socket.on('opponent_moved', (move) => {
        if (window.gameInstance) {
            window.gameInstance.makeMove(move);
        }
    });

    // ── Patch makeMove to broadcast moves to opponent ──────────────────────────
    const originalMakeMove = window.ElementChessGame.prototype.makeMove;
    window.ElementChessGame.prototype.makeMove = function (move) {
        originalMakeMove.call(this, move);
        // After the move, chess.turn() has flipped — if it is now the
        // opponent's turn, this client just played, so broadcast it.
        if (this.gameMode === 'multiplayer' && this.chess.turn() !== this.playerColor && currentRoom) {
            socket.emit('make_move', currentRoom, move);
        }
    };

    // ── Show/hide multiplayer panel when game mode selector changes ────────────
    // (game.js already handles this, but we reset the UI state here too)
    document.getElementById('game-mode').addEventListener('change', (e) => {
        if (e.target.value !== 'multiplayer') {
            // If user switches away while searching, cancel gracefully
            if (isSearching) {
                socket.emit('cancel_search');
                isSearching = false;
            }
            showIdleState();
            setStatus('');
            currentRoom = null;
            if (window.gameInstance) {
                window.gameInstance.opponent = null;
                window.gameInstance.updateProfiles();
            }
        }
    });
});
