
export default class Connection {

    constructor(game) {
        this.g = game;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this._ws = new WebSocket('ws://localhost:9000/');

            this._ws.addEventListener('open', () => {
                console.log('Socket opened');
                resolve();
            });

            this._ws.addEventListener('error', err => {
                console.error('Socket error:', err);
                reject();
            });

            this._ws.addEventListener('message', e => {
                const message = JSON.parse(e.data);

                this._msgCallback(message.type, message.data);
            });

            this._ws.addEventListener('close', () => {
                console.log('Socket closed');
            });
        });
    }

    onMessage(callback) {
        this._msgCallback = callback;
    }

    send(type, data) {
        const json = JSON.stringify({
            type,
            data,
        });

        this._ws.send(json);
    }

}
