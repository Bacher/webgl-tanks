
const textures = new Map();

export default class Texture {

    static loadTexture(engine, fileName, textureOptions) {
        return new Promise((resolve, reject) => {
            const image = new Image();

            image.addEventListener('load', () => {
                resolve(new Texture(engine, image, textureOptions));
            });

            image.addEventListener('error', () => {
                reject(new Error(`Loading texture ${fileName} failed`));
            });

            image.src = `textures/${fileName}`;
        });
    }

    constructor(engine, textureImage, textureOptions = false) {
        this.e = engine;
        const gl = this.e.gl;

        this.isAlpha = Boolean(textureOptions.alpha);

        this._texture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (textureOptions.wrap == null) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    activate(shader, paramName = 'uSampler', i = 0) {
        const gl = this.e.gl;

        gl.activeTexture(gl[`TEXTURE${i}`]);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        shader.setUniform(paramName, i);
    }

}
