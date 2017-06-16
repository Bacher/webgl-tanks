import { vec3, mat4 } from 'gl-matrix';

export default class MeshPart {

    constructor(engine, mesh, info) {
        this.e = engine;

        this._mesh    = mesh;
        this.id       = info.id;
        this.material = info.material;
        this.offset   = info.offset;
        this.size     = info.size;
        this.relation = info.relation || 'static';

        if (this.relation.includes('rotation')) {
            this.rotation = {
                x: 0,
                y: 0,
                z: 0,
            };

            this._m = mat4.create();
        }
    }

    draw(shader, mModel, lightDir) {
        const r     = this.rotation;
        const light = vec3.clone(lightDir);
        let model   = mModel;

        if (r) {
            if (r.x) {
                mat4.rotateX(this._m, mModel, r.x);
                model = this._m;
                vec3.rotateX(light, light, this.e.zeroOrigin, -r.x);
            }

            if (r.y) {
                mat4.rotateY(this._m, mModel, r.y);
                model = this._m;
                vec3.rotateY(light, light, this.e.zeroOrigin, -r.y);
            }

            if (r.z) {
                mat4.rotateZ(this._m, mModel, r.z);
                model = this._m;
                vec3.rotateZ(light, light, this.e.zeroOrigin, -r.z);
            }
        }

        shader.setUniform('uLightDir', light);
        shader.setUniform('umModel', model);

        gl.drawElements(gl.TRIANGLES, this.size * 3, gl.UNSIGNED_SHORT, this.offset * 6);
    }

    drawForDepthMap(shader, mModel) {
        const r   = this.rotation;
        let model = mModel;

        if (r) {
            if (r.x) {
                mat4.rotateX(this._m, mModel, r.x);
                model = this._m;
            }

            if (r.y) {
                mat4.rotateY(this._m, mModel, r.y);
                model = this._m;
            }

            if (r.z) {
                mat4.rotateZ(this._m, mModel, r.z);
                model = this._m;
            }
        }

        shader.setUniform('umModel', model);

        gl.drawElements(gl.TRIANGLES, this.size * 3, gl.UNSIGNED_SHORT, this.offset * 6);
    }

}
