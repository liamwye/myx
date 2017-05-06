const express = require('express');
const WebSocketServer = require('ws').Server;
const path = require('path');

// Initialise the ws
const ws = require('ws');
const wss = new WebSocketServer({ port: 2222});

wss.on('connection', function(ws) {
    console.log('Client connected to web interface');
    ws.on('close', function() {
        console.log('Client disconnected from web interface');
    })
});

function sendClientMessage(message) {
    wss.clients.forEach(function(client) {
        client.send(message);
    });
}

// Initialise the server
var server = express();

// Define settings
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, '/www/index.html');

server.use(function(request, response) {
    response.sendFile(INDEX);
});

server.listen(PORT, function () {
  console.log(`Web interface listening on port ${PORT}`);
})
