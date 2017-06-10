import { mat4 } from 'gl-matrix';

const PId2 = Math.PI / 2;

export default class Camera {

    constructor(engine) {
        this.e = engine;

        this._forward = 0;
        this._right   = 0;

        this.aspectRatio = 1;

        this.position = {
            x: 0,
            y: 0,
            z: 0,
        };

        this.rotation = {
            x: 0,
            y: 0,
            z: 0,
        };

        this._mat = mat4.create();
    }

    getMatrix() {
        const pos = this.position;

        mat4.identity(this._mat);
        mat4.perspective(this._mat, 45, this.aspectRatio, 0.1, 100);
        mat4.rotateX(this._mat, this._mat, -this.rotation.x);
        mat4.rotateY(this._mat, this._mat, -this.rotation.y);
        mat4.translate(this._mat, this._mat, [-pos.x, -pos.y, -pos.z]);

        return this._mat;
    }

    applyMovement(controller, delta) {
        this._forward = 0;
        this._right   = 0;

        if (controller.keys.has('w')) {
            this._forward += 1;
        }

        if (controller.keys.has('s')) {
            this._forward -= 1;
        }

        if (controller.keys.has('a')) {
            this._right -= 1;
        }

        if (controller.keys.has('d')) {
            this._right += 1;
        }

        let distance = 1;

        if (this._forward !== 0 && this._right !== 0) {
            distance = 0.707107;
        }

        distance *= delta * 0.01;

        if (this._forward !== 0) {
            const sin = Math.sin(-this.rotation.y);
            const cos = Math.cos(-this.rotation.y);

            this.position.z -= distance * this._forward * cos;
            this.position.x += distance * this._forward * sin;
        }

        if (this._right !== 0) {
            const sin = Math.sin(-this.rotation.y + PId2);
            const cos = Math.cos(-this.rotation.y + PId2);

            this.position.z -= distance * this._right * cos;
            this.position.x += distance * this._right * sin;
        }
    }

}
