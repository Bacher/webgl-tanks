import { mat4 } from 'gl-matrix';

export default class Model {

    constructor(engine, vertices) {
        this.e   = engine;
        const gl = engine.gl;

        this._mPos = mat4.create();
        this._rotateY = 0;

        this._buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this._verticesCount = vertices.length / 3;
    }

    draw(shader) {
        const gl = this.e.gl;

        mat4.identity(this._mPos);
        mat4.translate(this._mPos, this._mPos, [-1.5, 0, -7]);
        mat4.rotateY(this._mPos, this._mPos, this._rotateY);

        shader.setUniform('umModel', this._mPos);
        shader.setAttribute('aPos', this._buffer);

        gl.drawArrays(gl.TRIANGLES, 0, this._verticesCount);
    }

    rotateY(angle) {
        this._rotateY += angle;
    }

}
