
export default class TextureWrapper {

    constructor(engine, texture) {
        this.e = engine;
        this._texture = texture;
    }

    activate(shader, paramName = 'uSampler', i = 0) {
        const gl = this.e.gl;

        gl.activeTexture(gl[`TEXTURE${i}`]);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        shader.setUniform(paramName, i);
    }

}
