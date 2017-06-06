
export default class Shader {

    constructor(engine, vertexShaderText, fragmentShaderText) {
        this.e = engine;

        this._vst = vertexShaderText;
        this._fst = fragmentShaderText;

        this._program   = null;
        this.uniforms   = {};
        this.attributes = {};
    }

    compile() {
        const gl = this.e.gl;

        const vertexShader   = this._makeShader(gl.VERTEX_SHADER, this._vst);
        const fragmentShader = this._makeShader(gl.FRAGMENT_SHADER, this._fst);

        const program = this._program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Could not initialize shader program');
        }

        gl.useProgram(program);

        const uniformRx    = /uniform\s+([^ ]+)\s+([^\s;]+)/g;
        const attributesRx = /attribute\s+[^ ]+\s+([^\s;]+)/g;
        let match;

        while (true) {
            match = uniformRx.exec(this._vst);

            if (!match) {
                break;
            }

            const [, type, name] = match;

            const location = gl.getUniformLocation(program, name);

            if (location == null) {
                throw new Error(`Bad uniform location [${name}]`);
            }

            this.uniforms[name] = {
                location,
                type,
            };
        }

        while (true) {
            match = attributesRx.exec(this._vst);

            if (!match) {
                break;
            }

            const name = match[1];

            const location = gl.getAttribLocation(program, name);

            if (location == null) {
                throw new Error(`Bad attribute location [${name}]`);
            }

            this.attributes[name] = {
                location,
            };
        }
    }

    _makeShader(type, shaderCode) {
        const gl = this.e.gl;

        const shader = gl.createShader(type);

        gl.shaderSource(shader, shaderCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader error:', gl.getShaderInfoLog(shader));
            throw new Error('Shader error');
        }

        return shader;
    }

    use() {
        const gl = this.e.gl;

        gl.useProgram(this._program);
    }

    setUniform(name, value) {
        const gl      = this.e.gl;
        const uniform = this.uniforms[name];

        if (!uniform) {
            throw new Error(`Uniform [${name}] not found in shader`);
        }

        const location = uniform.location;

        switch (uniform.type) {
            case 'mat4':
                gl.uniformMatrix4fv(location, false, value);
                break;
            default:
                throw new Error('Unknown uniform type');
        }
    }

    setAttribute(name, buffer) {
        const gl = this.e.gl;

        const attribute = this.attributes[name];

        if (!attribute) {
            throw new Error(`Attribute [${name}] not found`);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(attribute.location, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribute.location);
    }

}
