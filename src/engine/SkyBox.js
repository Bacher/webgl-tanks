import Texture from './Texture';

export default class SkyBox {

    static loadSkyBox(engine, textureName) {
        return Texture.loadTexture(engine, textureName).then(texture => {
            return new SkyBox(engine, texture);
        });
    }

    constructor(engine, texture) {
        this.e = engine;

        this._texture = texture;

        this._createBuffers();
    }

    _createBuffers() {
        const A = 200;

        const posArray = new Float32Array([
            // Front face
            -A, -A,  A,
            A, -A,  A,
            A,  A,  A,
            -A,  A,  A,
            // Back face
            A, -A, -A,
            -A, -A, -A,
            -A,  A, -A,
            A,  A, -A,
            // Top face
            -A,  A, -A,
            -A,  A,  A,
            A,  A,  A,
            A,  A, -A,
            // Bottom face
            -A, -A, -A,
            A, -A, -A,
            A, -A,  A,
            -A, -A,  A,
            // Right face
            A, -A,  A,
            A, -A, -A,
            A,  A, -A,
            A,  A,  A,
            // Left face
            -A, -A, -A,
            -A, -A,  A,
            -A,  A,  A,
            -A,  A, -A,
        ]);

        this._pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._pos);
        gl.bufferData(gl.ARRAY_BUFFER, posArray, gl.STATIC_DRAW);

        const T = 0.0016;

        const uvArray = new Float32Array([
            // Front face
            0.5 + T, T,
            0.75 - T, T,
            0.75 - T, 0.5 - T,
            0.5 + T, 0.5 - T,
            // Back face
            T, T,
            0.25 - T, T,
            0.25 - T, 0.5 - T,
            T, 0.5 - T,
            // Top face
            0.25 + T, 0.5 + T,
            0.5 - T, 0.5 + T,
            0.5 - T, 1 - T,
            0.25 + T, 1 - T,
            // Bottom face
            0.1, 0.1,
            0.1, 0.1,
            0.1, 0.1,
            0.1, 0.1,
            // Right face
            0.75 + T, T,
            1 - T, T,
            1 - T, 0.5 - T,
            0.75 + T, 0.5 - T,
            // Left face
            0.25 + T, T,
            0.5 - T, T,
            0.5 - T, 0.5 - T,
            0.25 + T, 0.5 - T,
        ]);

        this._uv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._uv);
        gl.bufferData(gl.ARRAY_BUFFER, uvArray, gl.STATIC_DRAW);

        const cubeVertexIndices = new Uint16Array([
            0, 1, 2,      0, 2, 3,    // Front face
            4, 5, 6,      4, 6, 7,    // Back face
            8, 9, 10,     8, 10, 11,  // Top face
            12, 13, 14,   12, 14, 15, // Bottom face
            16, 17, 18,   16, 18, 19, // Right face
            20, 21, 22,   20, 22, 23  // Left face
        ]);

        this._index = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndices, gl.STATIC_DRAW);
    }

    draw(shader) {
        shader.setAttribute('aPos', this._pos);
        shader.setAttribute('aUV', this._uv);

        this._texture.activate(shader);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._index);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }

}
