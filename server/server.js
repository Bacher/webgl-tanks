const http = require('http');
const WebSocketServer = require('websocket').server;

const server = http.createServer();
server.listen(9000, err => {
    if (err) {
        throw new Error('Listen failed:', err);
    }

    console.log('Server started at 9000 port');
});

const wsServer = new WebSocketServer({
    httpServer:            server,
    autoAcceptConnections: true,
});

wsServer.on('connect', conn => {
    console.log('new connection');

    conn.sendUTF(JSON.stringify({
        type: 'initial',
        data: {
            you: 'hello',
        },
    }));

    conn.on('message', message => {
        console.log('MESSAGE', message);
    });
});
