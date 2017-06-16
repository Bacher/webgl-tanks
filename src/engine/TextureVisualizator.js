import { mat4 } from 'gl-matrix';
import PlainMesh from './PlainMesh';

export default class TextureVisualizator {

    constructor(engine, texture) {
        this.e = engine;

        this._texture = texture;

        this._mesh = new PlainMesh(engine);

        this._m = mat4.create();
        mat4.identity(this._m);
        mat4.translate(this._m, this._m, [0.58, -0.58, -1]);
        mat4.scale(this._m, this._m, [0.4, 0.4, 0.5]);
    }

    draw(shader) {
        this._mesh.applyBuffers(shader);
        this._texture.activate(shader);
        shader.setUniform('umModel', this._m);

        this._mesh.draw();
    }

}
