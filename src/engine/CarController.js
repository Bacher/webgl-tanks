import _ from 'lodash';

const MAX_SELF_SPEED = 10;

export default class CarController {

    constructor(engine, model) {
        this.e = engine;

        this._model = model;

        this._speed        = 0;
        this._acceleration = 0;
        this._position     = _.clone(this._model.position);
        this._direction    = this._model.rotation.y;
    }

    logicTick(delta) {
        const keyboard = this.e.keyboard;

        let directionChange = 0;
        let accelerationChange = 0;

        if (keyboard.keys.has('w')) {
            accelerationChange += 1;
        }

        if (keyboard.keys.has('s')) {
            accelerationChange -= 1;
        }

        if (keyboard.keys.has('a')) {
            directionChange -= 1;
        }

        if (keyboard.keys.has('d')) {
            directionChange = 1;
        }

        //this._acceleration += this._speed * delta * 0.0625 / 100;

        this._acceleration += accelerationChange * delta * 0.000625;

        const dir = this._speed >= 0 ? 1 : -1;

        this._direction -= dir * directionChange * delta * 0.0625 * 0.02;

        if (
            Number.isNaN(this._speed) ||
            Number.isNaN(this._acceleration) ||
            Number.isNaN(this._direction)
        ) {
            debugger
        }

        if (delta !== 0) {
            if (Math.abs(this._acceleration) > 0.0001) {
                this._acceleration *= Math.pow(0.95, delta * 0.0625);
            }

            // if (this._acceleration > 0) {
            //     this._acceleration -= 0.01;
            //
            //     if (this._acceleration < 0) {
            //         this._acceleration = 0;
            //     }
            // } else {
            //     this._acceleration += 0.01;
            //
            //     if (this._acceleration > 0) {
            //         this._acceleration = 0;
            //     }
            // }

            //console.log('slowing', 0.95 / delta);
            this._speed *= Math.pow(0.8, delta);

            if (this._speed > 0) {
                this._speed -= 0.1;

                if (this._speed < 0) {
                    this._speed = 0;
                }
            } else {
                this._speed += 0.1;

                if (this._speed > 0) {
                    this._speed = 0;
                }
            }
        }

        let speedChange;

        if (this._acceleration < -0.001 || this._acceleration > 0.001) {
            speedChange = this._acceleration;

            if (this._speed > 0 && this._acceleration > 0 || this._speed < 0 && this._acceleration < 0) {
                speedChange *= (MAX_SELF_SPEED - this._speed) / MAX_SELF_SPEED;
            }

            this._speed += speedChange;
        }

        const distance = this._speed * delta * 0.0625;

        const sin = Math.sin(-this._direction);
        const cos = Math.cos(-this._direction);

        this._position.z -= distance * cos;
        this._position.x += distance * sin;

        const model = this._model;

        model.position   = this._position;
        model.rotation.y = this._direction;

        this.e.camera.position.x = this._position.x;
        this.e.camera.position.y = 4;
        this.e.camera.position.z = this._position.z;
    }

}
