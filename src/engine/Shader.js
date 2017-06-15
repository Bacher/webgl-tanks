
export default class Shader {

    constructor(engine, vertexShaderText, fragmentShaderText) {
        this.e = engine;

        this._vst = vertexShaderText.replace(/\/\/.+\n/g, '\n');
        this._fst = fragmentShaderText.replace(/\/\/.+\n/g, '\n');

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

        for (let shaderText of [this._vst, this._fst]) {
            const uniformRx    = /uniform\s+([^ ]+)\s+([^;]+)/g;
            const attributesRx = /attribute\s+([^ ]+)\s+([^;]+)/g;

            let match;

            while (true) {
                match = uniformRx.exec(shaderText);

                if (!match) {
                    break;
                }

                const [, type, names] = match;

                for (let name of names.trim().split(/\s*,\s*/)) {
                    const location = gl.getUniformLocation(program, name);

                    if (location == null) {
                        throw new Error(`Bad uniform location [${name}]`);
                    }

                    this.uniforms[name] = {
                        location,
                        type,
                    };
                }
            }

            while (true) {
                match = attributesRx.exec(shaderText);

                if (!match) {
                    break;
                }

                const [, type, names] = match;

                for (let name of names.trim().split(/\s*,\s*/)) {
                    const location = gl.getAttribLocation(program, name);

                    if (location == null) {
                        throw new Error(`Bad attribute location [${name}]`);
                    }

                    this.attributes[name] = {
                        location,
                        type,
                    };
                }
            }
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
            return;
        }

        const location = uniform.location;

        switch (uniform.type) {
            case 'vec2':
                gl.uniform2fv(location, value);
                break;
            case 'vec3':
                gl.uniform3fv(location, value);
                break;
            case 'mat4':
                gl.uniformMatrix4fv(location, false, value);
                break;
            case 'sampler2D':
                gl.uniform1i(location, value);
                break;
            default:
                throw new Error(`Unknown uniform type [${uniform.type}]`);
        }
    }

    setAttribute(name, buffer) {
        const gl = this.e.gl;

        const attribute = this.attributes[name];

        if (!attribute) {
            throw new Error(`Attribute [${name}] not found`);
        }

        let itemSize;

        switch (attribute.type) {
            case 'vec1':
                itemSize = 1;
                break;
            case 'vec2':
                itemSize = 2;
                break;
            case 'vec3':
                itemSize = 3;
                break;
            case 'vec4':
                itemSize = 4;
                break;
            default:
                throw new Error(`Unknown attribute type [${attribute.type}]`);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(attribute.location, itemSize, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribute.location);
    }

}
