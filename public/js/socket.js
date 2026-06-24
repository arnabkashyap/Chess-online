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
        const p1ElementSelect = document.getElementById('p1-element');
        
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
        
        p1ElementSelect.addEventListener('change', (e) => {
            if (currentRoom) {
                socket.emit('sync_element_selection', currentRoom, window.gameInstance.playerColor, e.target.value);
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
            
            // Sync initial element
            socket.emit('sync_element_selection', currentRoom, color, p1ElementSelect.value);
        });

        socket.on('game_start', () => {
            statusText.innerText = `Game Started! Room: ${currentRoom}`;
            // Both players sync their elements
            socket.emit('sync_element_selection', currentRoom, window.gameInstance.playerColor, p1ElementSelect.value);
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
        
        socket.on('opponent_selected_element', (element) => {
            const oppColor = window.gameInstance.playerColor === 'w' ? 'b' : 'w';
            document.getElementById('p2-element').value = element;
            window.gameInstance.elementSystem.setElement(oppColor, element);
        });
        
        socket.on('opponent_used_element', (color, element, targetSquare) => {
            if (window.gameInstance) {
                window.gameInstance.elementSystem.useElement(color, targetSquare);
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
        
        // Override element use to also emit
        const originalUseElement = window.ElementSystem.prototype.useElement;
        window.ElementSystem.prototype.useElement = function(color, square) {
            const success = originalUseElement.call(this, color, square);
            if (success && this.game.gameMode === 'multiplayer' && color === this.game.playerColor && currentRoom) {
                const element = this.playerStates[color].element;
                socket.emit('use_element', currentRoom, color, element, square);
            }
            return success;
        };

    }
});
