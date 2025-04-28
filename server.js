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

// Store entity data (penguins and enemies) with a fixed size limit
const MAX_ENTITIES = 1000; // Adjust based on your needs
let entityData = new Map();

// Utility function to broadcast updates efficiently
function broadcastUpdates(excludeClient = null, force = false) {
    const now = Date.now();
    const entities = Array.from(entityData.values());
    
    // Classify by entity type
    const penguins = entities.filter(entity => !entity.entityType || entity.entityType === 'penguin');
    const enemies = entities.filter(entity => entity.entityType === 'enemy');
    
    clients.forEach((lastBroadcast, client) => {
        if (client === excludeClient) return;
        if (client.readyState !== WebSocket.OPEN) return;
        
        // Only broadcast if it's been at least 100ms since last broadcast or if forced
        if (force || now - lastBroadcast >= 100) {
            try {
                client.send(JSON.stringify({
                    type: 'entityUpdate',
                    entities: entities,
                    penguins: penguins,
                    enemies: enemies
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
            const entityId = data.penguinId || data.enemyId || data.entityId;
            
            if (!entityId) {
                console.warn('Received data without ID, ignoring');
                return;
            }
            
            // Enforce size limit
            if (entityData.size >= MAX_ENTITIES && !entityData.has(entityId)) {
                console.warn('Maximum entity limit reached, ignoring new entity');
                return;
            }

            // Set default entityType if not provided
            if (!data.entityType) {
                data.entityType = 'penguin'; // Backward compatibility
            }

            entityData.set(entityId, {
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
    if (entityData.size > 0) {
        try {
            const entities = Array.from(entityData.values());
            const penguins = entities.filter(entity => !entity.entityType || entity.entityType === 'penguin');
            const enemies = entities.filter(entity => entity.entityType === 'enemy');
            
            ws.send(JSON.stringify({
                type: 'entityUpdate',
                entities: entities,
                penguins: penguins,
                enemies: enemies
            }));
        } catch (err) {
            console.error('Error sending initial data:', err);
        }
    }
});

// Clean up stale entity data (older than 5 seconds)
setInterval(() => {
    const now = Date.now();
    let hasChanges = false;
    
    for (const [id, data] of entityData.entries()) {
        if (now - data.lastUpdate > 5000) {
            entityData.delete(id);
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