import _ from 'lodash';

export default class Controller {

    constructor(engine) {
        this.e = engine;

        _.bindAll(this, [
            '_onKeyDown',
            '_onKeyUp',
        ]);

        this.keys = new Set();
    }

    addInputListeners() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
    }

    _onKeyDown(e) {
        if (this.e.isActive()) {
            switch (e.which) {
                case 87:
                    this.keys.add('w');
                    break;
                case 83:
                    this.keys.add('s');
                    break;
                case 65:
                    this.keys.add('a');
                    break;
                case 68:
                    this.keys.add('d');
                    break;
            }
        }
    }

    _onKeyUp(e) {
        switch (e.which) {
            case 87:
                this.keys.delete('w');
                break;
            case 83:
                this.keys.delete('s');
                break;
            case 65:
                this.keys.delete('a');
                break;
            case 68:
                this.keys.delete('d');
                break;
        }
    }

}
