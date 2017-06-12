import { vec2 } from 'gl-matrix';

export default class PlainMesh {

    constructor(engine, meshInfo, repeat) {
        this.e = engine;

        const gl = this.e.gl;

        const group = meshInfo.groups[0];
        this._size   = group.size;
        this._offset = group.offset;

        this._pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._pos);
        gl.bufferData(gl.ARRAY_BUFFER, meshInfo.vertices, gl.STATIC_DRAW);

        this._ele = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ele);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshInfo.polygons, gl.STATIC_DRAW);

        this._repeat = repeat ? vec2.fromValues(...repeat) : vec2.fromValues(1, 1);

        this.rotation = { x: 0, y: 0, z: 0 };
    }

    applyBuffers(shader) {
        const gl = this.e.gl;

        shader.setUniform('repeat', this._repeat);
        shader.setAttribute('aPos', this._pos);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ele);
    }

    draw() {
        const gl = this.e.gl;

        gl.drawElements(gl.TRIANGLES, this._size * 3, gl.UNSIGNED_SHORT, this._offset * 6);
    }

}
