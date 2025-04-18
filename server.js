const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ 
    server,
    // Add WebSocket compression to reduce data transfer
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024
    }
});

// Store connected clients with their last broadcast timestamp
const clients = new Map();

// Store penguin data with a fixed size limit
const MAX_PENGUINS = 1000; // Adjust based on your needs
let penguinData = new Map();

// Utility function to broadcast updates efficiently
function broadcastUpdates(excludeClient = null, force = false) {
    const now = Date.now();
    const penguins = Array.from(penguinData.values());
    
    clients.forEach((lastBroadcast, client) => {
        if (client === excludeClient) return;
        if (client.readyState !== WebSocket.OPEN) return;
        
        // Only broadcast if it's been at least 100ms since last broadcast or if forced
        if (force || now - lastBroadcast >= 100) {
            try {
                client.send(JSON.stringify({
                    type: 'penguinUpdate',
                    penguins: penguins
                }));
                clients.set(client, now);
            } catch (err) {
                console.error('Error sending to client:', err);
            }
        }
    });
}

wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.set(ws, 0); // Initialize with 0 timestamp

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // Enforce size limit
            if (penguinData.size >= MAX_PENGUINS && !penguinData.has(data.penguinId)) {
                console.warn('Maximum penguin limit reached, ignoring new penguin');
                return;
            }

            penguinData.set(data.penguinId, {
                ...data,
                lastUpdate: Date.now()
            });

            // Broadcast updates with rate limiting
            broadcastUpdates(null, false);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });

    // Send initial data to new client
    if (penguinData.size > 0) {
        try {
            ws.send(JSON.stringify({
                type: 'penguinUpdate',
                penguins: Array.from(penguinData.values())
            }));
        } catch (err) {
            console.error('Error sending initial data:', err);
        }
    }
});

// Clean up stale penguin data (older than 5 seconds)
setInterval(() => {
    const now = Date.now();
    let hasChanges = false;
    
    for (const [id, data] of penguinData.entries()) {
        if (now - data.lastUpdate > 5000) {
            penguinData.delete(id);
            hasChanges = true;
        }
    }

    // Only broadcast if there were changes
    if (hasChanges) {
        broadcastUpdates(null, true);
    }
}, 1000);

const PORT = 52697;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});