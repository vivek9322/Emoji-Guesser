// /emoji-guesser/public/client.js
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // --- DOM Elements ---
    const guessForm = document.getElementById('guess-form');
    const guessInput = document.getElementById('guess-input');
    const emojiDisplay = document.getElementById('emoji-display');
    const scoreboard = document.getElementById('scoreboard');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const messages = document.getElementById('messages');

    // --- Socket Event Handlers ---

    // Update the emoji puzzle
    socket.on('new puzzle', (emojis) => {
        emojiDisplay.classList.remove('visible');
        // A short delay to allow the fade-out animation to play
        setTimeout(() => {
            emojiDisplay.textContent = emojis;
            emojiDisplay.classList.add('visible');
        }, 300);
    });

    // Update the scoreboard
    socket.on('update scores', (scores) => {
        scoreboard.innerHTML = ''; // Clear existing scores
        scores.forEach(player => {
            const playerScoreElem = document.createElement('div');
            playerScoreElem.className = 'player-score';
            // Display 'You' for the current player
            const playerName = player.id === socket.id ? 'You' : `Player ${player.id.substring(0, 5)}`;
            playerScoreElem.textContent = `${playerName}: ${player.score}`;
            scoreboard.appendChild(playerScoreElem);
        });
    });

    // Handle incoming chat messages
    socket.on('chat message', (msg) => {
        addChatMessage(msg.user, msg.text);
    });

    // --- Event Listeners ---

    // Handle guess submission
    guessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const guess = guessInput.value;
        if (guess) {
            socket.emit('submit guess', guess);
            // Don't clear the input here, let the server decide
            // If the guess is wrong, it will be shown as a chat message
        }
    });

    // Handle chat message submission
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = chatInput.value;
        if (msg) {
            socket.emit('chat message', msg);
            addChatMessage('You', msg, true); // Show my own message immediately
            chatInput.value = '';
        }
    });

    // --- Helper Functions ---

    /**
     * Adds a message to the chat window.
     * @param {string} user - The user who sent the message ('You', 'System', or player ID).
     * @param {string} text - The message content.
     * @param {boolean} isMyMessage - True if the message is from the current client.
     */
    function addChatMessage(user, text, isMyMessage = false) {
        const item = document.createElement('li');
        item.textContent = `${user}: ${text}`;

        if (user === 'System') {
            item.className = 'system-message';
            item.textContent = text; // System messages don't need a user prefix
        } else if (isMyMessage) {
            item.className = 'my-message';
        } else {
            item.className = 'other-message';
        }
        
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight; // Auto-scroll to the bottom
    }
});