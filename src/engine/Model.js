import { vec3, mat4 } from 'gl-matrix';
import Mesh from './Mesh';

export default class Model {

    constructor(engine, meshInfo, textures) {
        this.e = engine;

        this.shader = 'textured';

        const bb = this.boundBox = meshInfo.boundBox;
        this.boundSphere = meshInfo.boundSphere;

        const { min, max } = bb;

        this._boundBoxPoints = [
            vec3.fromValues(...min),
            vec3.fromValues(min[0], min[1], max[2]),
            vec3.fromValues(max[0], min[1], max[2]),
            vec3.fromValues(max[0], min[1], min[2]),
            vec3.fromValues(min[0], max[1], min[2]),
            vec3.fromValues(min[0], max[1], max[2]),
            vec3.fromValues(...max),
            vec3.fromValues(max[0], max[1], min[2]),
        ];

        this._tmpBoundBoxPoints = [
            vec3.create(),
            vec3.create(),
            vec3.create(),
            vec3.create(),
            vec3.create(),
            vec3.create(),
            vec3.create(),
            vec3.create(),
        ];

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

    draw(shader, mCamera) {
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

        if (!this._checkVisibility(mCamera, m)) {
            return;
        }

        shader.setUniform('umModel', m);

        this._mesh.applyBuffers(shader);

        for (let group of this._mesh.groups) {
            this._textures[group.material].activate(shader);
            this._mesh.draw(group.id);
        }
    }

    _checkVisibility(mCamera, mModel) {
        const mFinal = mat4.create();

        mat4.multiply(mFinal, mCamera, mModel);

        let allZout  = true;
        let allXgt1  = true;
        let allXltm1 = true;
        let allYgt1  = true;
        let allYltm1 = true;

        for (let i = 0; i < 8; i++) {
            const tmp = this._tmpBoundBoxPoints[i];
            vec3.transformMat4(tmp, this._boundBoxPoints[i], mFinal);

            if (tmp[0] < 1) {
                allXgt1 = false;
            }
            if (tmp[0] > -1) {
                allXltm1 = false;
            }

            if (tmp[1] < 1) {
                allYgt1 = false;
            }
            if (tmp[1] > -1) {
                allYltm1 = false;
            }

            if (tmp[2] >0 && tmp[2] < 1) {
                allZout = false;
            }
        }

        const bulb = document.getElementById('bulb');

        if (allZout || allXgt1 || allXltm1 || allYgt1 || allYltm1) {
            bulb.style['background-color'] = '#f00';
            return false;
        } else {
            bulb.style['background-color'] = '#0f0';
            return true;
        }
    }

}
