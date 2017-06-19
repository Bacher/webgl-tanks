
export default class Connection {

    constructor() {

    }

    connect() {
        return new Promise((resolve, reject) => {
            this._ws = new WebSocket('ws://localhost:9000/');

            this._ws.addEventListener('open', () => {
                console.log('Socket opened');
            });

            this._ws.addEventListener('error', err => {
                console.error('Socket error:', err);
                reject();
            });

            this._ws.addEventListener('message', e => {
                const message = JSON.parse(e.data);

                if (message.type === 'initial') {
                    resolve(message.data);
                } else {
                    this._msgCallback(message);
                }
            });

            this._ws.addEventListener('close', () => {
                console.log('socket closed');
            });
        });
    }

    onMessage(callback) {
        this._msgCallback = callback;
    }

    send(name, data) {
        const json = JSON.stringify({
            name,
            data,
        });

        this._ws.send(json);
    }

}
