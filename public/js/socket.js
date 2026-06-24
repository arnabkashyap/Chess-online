// socket.js
// Handles client-side multiplayer communication

window.addEventListener('DOMContentLoaded', () => {
    // Only init if socket.io is loaded (which means we are running on a server)
    if (typeof io !== 'undefined') {
        const socket = io();
        let currentRoom = null;
        
        const createBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const codeInput = document.getElementById('room-code-input');
        const statusText = document.getElementById('room-status');
        
        createBtn.addEventListener('click', () => {
            if (window.gameInstance && window.gameInstance.gameMode === 'multiplayer') {
                socket.emit('create_room');
                statusText.innerText = "Creating room...";
            }
        });
        
        joinBtn.addEventListener('click', () => {
            const code = codeInput.value.trim();
            if (code && window.gameInstance && window.gameInstance.gameMode === 'multiplayer') {
                socket.emit('join_room', code);
                statusText.innerText = "Joining...";
            }
        });

        // Socket Events
        socket.on('room_created', (code, color) => {
            currentRoom = code;
            statusText.innerText = `Room: ${code}. Waiting...`;
            window.gameInstance.playerColor = color;
            window.gameInstance.resetGame();
        });

        socket.on('room_joined', (code, color) => {
            currentRoom = code;
            statusText.innerText = `Joined Room: ${code}.`;
            window.gameInstance.playerColor = color;
            window.gameInstance.resetGame();
        });

        socket.on('game_start', () => {
            statusText.innerText = `Game Started! Room: ${currentRoom}`;
        });

        socket.on('error_message', (msg) => {
            statusText.innerText = msg;
            setTimeout(() => {
                if (!currentRoom) statusText.innerText = "";
            }, 3000);
        });
        
        socket.on('opponent_disconnected', () => {
            statusText.innerText = "Opponent disconnected.";
            currentRoom = null;
        });

        socket.on('opponent_moved', (move) => {
            if (window.gameInstance) {
                window.gameInstance.makeMove(move);
            }
        });

        // Override game makeMove to also emit
        const originalMakeMove = window.ElementChessGame.prototype.makeMove;
        window.ElementChessGame.prototype.makeMove = function(move) {
            originalMakeMove.call(this, move);
            // If in multiplayer and it's our turn we just played
            if (this.gameMode === 'multiplayer' && this.chess.turn() !== this.playerColor && currentRoom) {
                socket.emit('make_move', currentRoom, move);
            }
        };
    }
});
