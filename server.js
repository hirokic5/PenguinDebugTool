const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Store penguin data
let penguinData = new Map();

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);

    ws.on('message', (message) => {
        try {
            console.log('Received message:', message.toString());
            const data = JSON.parse(message);
            penguinData.set(data.penguinId, {
                ...data,
                lastUpdate: Date.now()
            });

            // Broadcast to all connected clients
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'penguinUpdate',
                        penguins: Array.from(penguinData.values())
                    }));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    // Send current penguin data to newly connected client
    for (const penguin of penguinData.values()) {
        ws.send(JSON.stringify({
            type: 'penguinUpdate',
            penguin: penguin
        }));
    }
});

// Clean up stale penguin data (older than 5 seconds)
setInterval(() => {
    const now = Date.now();
    for (const [id, data] of penguinData.entries()) {
        if (now - data.lastUpdate > 5000) {
            penguinData.delete(id);
            // Broadcast the cleanup
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'penguinUpdate',
                        penguins: Array.from(penguinData.values())
                    }));
                }
            });
        }
    }
}, 1000);

const PORT = 52697;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});