// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// ─────────────────────────────────────────────
// Active game rooms  { roomId: { w: socketId, b: socketId } }
// ─────────────────────────────────────────────
const rooms = {};

// ─────────────────────────────────────────────
// Matchmaking queue  [ socketId, ... ]  (FIFO)
// Only holds sockets that are actively searching.
// ─────────────────────────────────────────────
const matchmakingQueue = [];

function generateRoomId() {
    return 'room_' + Math.random().toString(36).slice(2, 10);
}

/** Remove a socket from the matchmaking queue if present. */
function removeFromQueue(socketId) {
    const idx = matchmakingQueue.indexOf(socketId);
    if (idx !== -1) {
        matchmakingQueue.splice(idx, 1);
        console.log(`[Queue] Removed ${socketId}. Queue size: ${matchmakingQueue.length}`);
    }
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ── MATCHMAKING ────────────────────────────────────────────────────────────
    socket.on('find_match', (userData) => {
        // Prevent double-queuing
        if (matchmakingQueue.includes(socket.id)) return;

        // Persist user data on socket instance
        socket.userData = userData || { uid: socket.id, displayName: 'Guest', photoURL: '👤' };

        if (matchmakingQueue.length > 0) {
            // ── Scenario A: an opponent is waiting ─────────────────────────────
            const opponentId = matchmakingQueue.shift(); // FIFO pop
            const opponentSocket = io.sockets.sockets.get(opponentId);

            if (!opponentSocket || !opponentSocket.connected) {
                // Opponent disconnected while waiting — try again recursively
                socket.emit('find_match', userData);
                return;
            }

            const roomId = generateRoomId();
            rooms[roomId] = { w: opponentId, b: socket.id };

            // Join both sockets to the Socket.IO room
            opponentSocket.join(roomId);
            socket.join(roomId);

            console.log(`[Match] Room ${roomId}: WHITE=${opponentId}  BLACK=${socket.id}`);

            // Fetch opponent's data or default
            const opponentData = opponentSocket.userData || { uid: opponentId, displayName: 'Guest', photoURL: '👤' };
            const myData = socket.userData;

            // Notify: the waiting player (first in queue) becomes WHITE
            opponentSocket.emit('match_found', { roomId, color: 'w', opponent: myData });
            // The new joiner becomes BLACK
            socket.emit('match_found', { roomId, color: 'b', opponent: opponentData });

            // Broadcast game start to the room
            io.to(roomId).emit('game_start');

        } else {
            // ── Scenario B: queue is empty — add this player ───────────────────
            matchmakingQueue.push(socket.id);
            socket.emit('in_queue');
            console.log(`[Queue] Added ${socket.id}. Queue size: ${matchmakingQueue.length}`);
        }
    });

    socket.on('cancel_search', () => {
        removeFromQueue(socket.id);
        console.log(`[Queue] ${socket.id} cancelled search.`);
    });

    // ── GAMEPLAY ───────────────────────────────────────────────────────────────
    socket.on('make_move', (roomId, move) => {
        socket.to(roomId).emit('opponent_moved', move);
    });

    // ── DISCONNECT ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // 1. Remove from matchmaking queue if still searching
        removeFromQueue(socket.id);

        // 2. Notify opponent in any active game room and clean up
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.w === socket.id || room.b === socket.id) {
                io.to(roomId).emit('opponent_disconnected');
                delete rooms[roomId];
                console.log(`[Room] Deleted ${roomId} after disconnect.`);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
