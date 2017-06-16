import { vec2 } from 'gl-matrix';

const buffers = {
    pos: null,
    uvs: null,
};

export default class PlainMesh {

    constructor(engine) {
        this.e = engine;

        const gl = this.e.gl;

        if (!buffers.pos) {
            const pos = new Float32Array([
                // 1, 1, 0,
                // 1, -1, 0,
                // -1, -1, 0,
                // -1, 1, 0,
                -1, 1, 0,
                -1, -1, 0,
                1, -1, 0,
                1, 1, -0,
                // 1, 1, 0,
                // -1, 1, 0,
                // 1, -1, 0,
                // -1, -1, 0,
            ]);

            const uvs = new Float32Array([
                0, 1,
                0, 0,
                1, 0,
                1, 1,
            ]);

            buffers.pos = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.pos);
            gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);

            buffers.uvs = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvs);
            gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
        }

        this.rotation = { x: 0, y: 0, z: 0 };
    }

    applyBuffers(shader) {
        //const gl = this.e.gl;

        shader.setAttribute('aPos', buffers.pos);
        shader.setAttribute('aUV', buffers.uvs);
        //shader.setAttribute('aNormal', this._nor);
    }

    draw() {
        const gl = this.e.gl;

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

}
