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

// Store active rooms and their state
const rooms = {};

function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('create_room', () => {
        let code = generateRoomCode();
        while (rooms[code]) {
            code = generateRoomCode();
        }
        
        rooms[code] = {
            players: {
                w: socket.id,
                b: null
            },
            history: [] // could store move history
        };
        
        socket.join(code);
        socket.emit('room_created', code, 'w');
    });

    socket.on('join_room', (code) => {
        if (rooms[code]) {
            const room = rooms[code];
            if (!room.players.b) {
                room.players.b = socket.id;
                socket.join(code);
                socket.emit('room_joined', code, 'b');
                io.to(code).emit('game_start');
            } else {
                socket.emit('error_message', 'Room is full.');
            }
        } else {
            socket.emit('error_message', 'Invalid room code.');
        }
    });

    socket.on('make_move', (code, move) => {
        socket.to(code).emit('opponent_moved', move);
    });

    socket.on('use_element', (code, color, element, targetSquare) => {
        socket.to(code).emit('opponent_used_element', color, element, targetSquare);
    });
    
    socket.on('sync_element_selection', (code, color, element) => {
        socket.to(code).emit('opponent_selected_element', element);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Find if user was in a room and notify opponent
        for (const code in rooms) {
            const room = rooms[code];
            if (room.players.w === socket.id || room.players.b === socket.id) {
                io.to(code).emit('opponent_disconnected');
                delete rooms[code];
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
