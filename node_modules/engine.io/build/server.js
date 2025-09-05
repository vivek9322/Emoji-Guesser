// /emoji-guesser/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

// --- Game Data ---
const emojiPuzzles = [
    { emojis: '🍕🎸🎤', answer: 'pizza rockstar' },
    { emojis: '👨‍🍳🐀🇫🇷', answer: 'ratatouille' },
    { emojis: '🕷️👨🏻➡️🕸️', answer: 'spiderman' },
    { emojis: '🦁👑', answer: 'lion king' },
    { emojis: '🍦🥶', answer: 'ice cream' },
    { emojis: 'BREAKFAST 🍳 CLUB ☕️', answer: 'breakfast club' },
    { emojis: '👻BUSTERS🚫', answer: 'ghostbusters' },
    { emojis: 'STAR ⭐ WARS ⚔️', answer: 'star wars' },
];

// --- Game State ---
let players = {};
let currentPuzzleIndex = 0;

function getScores() {
    return Object.values(players).map(p => ({ id: p.id, score: p.score }));
}

function newRound() {
    currentPuzzleIndex = (currentPuzzleIndex + 1) % emojiPuzzles.length;
    io.emit('new puzzle', emojiPuzzles[currentPuzzleIndex].emojis);
    io.emit('update scores', getScores());
}

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Add new player
    players[socket.id] = { id: socket.id, score: 0 };

    // Send current game state to the new player
    socket.emit('new puzzle', emojiPuzzles[currentPuzzleIndex].emojis);
    io.emit('update scores', getScores()); // Update scores for everyone

    // Handle player disconnect
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('update scores', getScores()); // Update scores for remaining players
    });

    // Handle guess submission
    socket.on('submit guess', (guess) => {
        const correctAnswer = emojiPuzzles[currentPuzzleIndex].answer;
        if (guess.trim().toLowerCase() === correctAnswer.toLowerCase()) {
            // Correct guess!
            players[socket.id].score += 1;
            io.emit('chat message', { user: 'System', text: `🎉 ${players[socket.id].id.substring(0, 5)} guessed it right!` });
            newRound();
        } else {
            // Incorrect guess, show it in chat
            socket.broadcast.emit('chat message', { user: players[socket.id].id.substring(0, 5), text: guess });
        }
    });

    // Handle chat messages
    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', { user: players[socket.id].id.substring(0, 5), text: msg });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});