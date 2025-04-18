const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:52697');

ws.on('open', function open() {
    console.log('Connected to server');
});

ws.on('message', function incoming(data) {
    try {
        const parsed = JSON.parse(data);
        console.clear();  // Clear console for better readability
        console.log('Received Penguin Data:');
        console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
        console.error('Error parsing message:', e);
    }
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});

ws.on('close', function close() {
    console.log('Disconnected from server');
});