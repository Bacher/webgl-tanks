import { mat4 } from 'gl-matrix';
import Mesh from './Mesh';

export default class Model {

    constructor(engine, meshInfo, textures) {
        this.e = engine;

        this._boundSphere = meshInfo.boundSphere;

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

        this._mPos = mat4.create();

        this._mesh = new Mesh(engine, meshInfo);

        this._textures = textures;
    }

    draw(shader) {
        const p = this.position;
        const r = this.rotation;
        const m = this._mPos;

        mat4.identity(m);
        mat4.translate(m, m, [p.x, p.y, p.z]);

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

        for (let group of this._mesh.groups) {
            this._textures[group.material].activate(shader);
            this._mesh.draw(group.id);
        }
    }

}
