import { vec3, mat4 } from 'gl-matrix';
import PlainMesh from './PlainMesh';

export default class Model {

    constructor(engine, texture, options) {
        this.e = engine;

        this.shader = 'plainTextured';

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

        this.scale = [
            options.size[0],
            1,
            options.size[1],
        ];

        this._mPos = mat4.create();

        this._mesh = new PlainMesh(engine, options.repeat || [1, 1]);

        this._texture = texture;
    }

    draw(shader, mCamera) {
        const p = this.position;
        const r = this.rotation;
        const s = this.scale;
        const m = this._mPos;

        mat4.identity(m);
        mat4.translate(m, m, [p.x, p.y, p.z]);

        mat4.scale(m, m, s);

        if (r.x) {
            mat4.rotateX(m, m, r.x);
        }

        if (r.y) {
            mat4.rotateY(m, m, r.y);
        }

        if (r.z) {
            mat4.rotateZ(m, m, r.z);
        }

        shader.setUniform('umModel', m);

        this._mesh.applyBuffers(shader);

        this._texture.activate(shader);
        this._mesh.draw();
    }

}
