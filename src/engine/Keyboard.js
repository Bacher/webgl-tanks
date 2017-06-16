import _ from 'lodash';

const KEYS = new Map([
    [16, 'shift'],
    [32, 'space'],
    [87, 'w'],
    [83, 's'],
    [65, 'a'],
    [68, 'd'],
    [81, 'q'],
    [69, 'e'],
]);

export default class Controller {

    constructor(engine) {
        this.e = engine;

        _.bindAll(this, [
            '_onKeyDown',
            '_onKeyUp',
        ]);

        this.keys = new Set();

        this._callbacks = {
            'keydown': [],
        };
    }

    addInputListeners() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
    }

    on(eventName, callback) {
        const callbacks = this._callbacks[eventName];

        if (!callbacks) {
            throw new Error(`Invalid eventName [${eventName}]`);
        }

        callbacks.push(callback);
    }

    off(eventName, callback) {
        const callbacks = this._callbacks[eventName];

        if (callbacks.length) {
            const index = callbacks.indexOf(callback);

            if (index !== -1) {
                callbacks.splice(index, 0);
            }
        }
    }

    _onKeyDown(e) {
        if (this.e.isActive()) {
            if (!e.metaKey && !e.ctrlKey) {
                e.preventDefault();
            }

            const key = KEYS.get(e.which);

            if (key) {
                this.keys.add(key);

                for (let callback of this._callbacks['keydown']) {
                    callback(key);
                }
            }
        }
    }

    _onKeyUp(e) {
        const key = KEYS.get(e.which);

        if (key) {
            this.keys.delete(key);
        }
    }

}
