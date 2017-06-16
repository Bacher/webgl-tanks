import { vec3, vec4, mat3, mat4 } from 'gl-matrix';
import _ from 'lodash';
import Shader from './Shader';
import Model from './Model';
import Texture from './Texture';
import Camera from './Camera';
import Keyboard from './Keyboard';
import SoundSystem from './SoundSystem';
import * as BasicShader from './shaders/basic';
import * as TexturedShader from './shaders/textured';
import * as TexturedPolyShader from './shaders/textured-poly';
import * as PlainTexturedShader from './shaders/plain-textured';
import * as SkyBoxShader from './shaders/skybox';
import * as TerrainShader from './shaders/terrain';

const PId2 = Math.PI / 2;

window.vec3 = vec3;
window.vec4 = vec4;
window.mat3 = mat3;
window.mat4 = mat4;

export default class Engine {

    constructor(canvas) {
        _.bindAll(this, [
            '_frame',
            '_onMouseMove',
        ]);

        this._canvas = canvas;

        this.zeroOrigin = vec3.create();

        this.isObserverMode = /\bobs\b/.test(window.location.search);

        this._firstDraw = true;

        this._width  = 600;
        this._height = 400;
        this._ratio  = this._width / this._height;

        this._canvas.width  = this._width;
        this._canvas.height = this._height;

        window.gl = this.gl = canvas.getContext('webgl');

        this._shaders = {};
        this._sceneModels = [];
        this._controllers = [];
        this.camera = null;
        this._logicHooks = [];

        this.keyboard = new Keyboard(this);
        this.soundSystem = new SoundSystem();

        this._initShaderPrograms();

        this._addInputListeners();
    }

    _initShaderPrograms() {
        this._shaders.basic = new Shader(this, BasicShader.v, BasicShader.f);
        this._shaders.basic.compile();

        this._shaders.textured = new Shader(this, TexturedShader.v, TexturedShader.f);
        this._shaders.textured.compile();

        this._shaders.texturedPoly = new Shader(this, TexturedPolyShader.v, TexturedPolyShader.f);
        this._shaders.texturedPoly.compile();

        this._shaders.plainTextured = new Shader(this, PlainTexturedShader.v, PlainTexturedShader.f);
        this._shaders.plainTextured.compile();

        this._shaders.skybox = new Shader(this, SkyBoxShader.v, SkyBoxShader.f);
        this._shaders.skybox.compile();

        this._shaders.terrain = new Shader(this, TerrainShader.v, TerrainShader.f);
        this._shaders.terrain.compile();
    }

    _addInputListeners() {
        this._canvas.addEventListener('mousedown', () => {
            if (document.pointerLockElement !== this._canvas) {
                this._canvas.requestPointerLock();
            }
        });

        this._canvas.addEventListener('mousemove', this._onMouseMove);

        this.keyboard.addInputListeners();
    }

    _onMouseMove(e) {
        if (this.isActive()) {
            const rotation = this.camera.rotation;
            rotation.y -= (e.movementX * 0.003);
            rotation.x -= (e.movementY * 0.003);

            if (rotation.x > PId2) {
                rotation.x = PId2;
            } else if (rotation.x < -PId2) {
                rotation.x = -PId2;
            }

            // normalizeAngle(this.camera.rotation, 'x');
            // normalizeAngle(this.camera.rotation, 'y');
        }
    }

    isActive() {
        return document.pointerLockElement === this._canvas;
    }

    setSkyBox(skyBox) {
        this._skyBox = skyBox;
    }

    addModel(model) {
        this._sceneModels.push(model);
    }

    addController(controller) {
        if (this._controllers.indexOf(controller) === -1) {
            this._controllers.push(controller);
        }
    }

    setCamera(camera) {
        this.camera = camera;
        this.camera.aspectRatio = this._ratio;
    }

    _logicTick(delta) {
        this.camera.applyMovement(delta);

        for (let controller of this._controllers) {
            controller.logicTick(delta);
        }

        for (let func of this._logicHooks) {
            func(delta);
        }
    }

    _draw() {
        const gl = this.gl;

        if (this._firstDraw) {
            this._firstDraw = false;
            gl.clearColor(0, 0, 0, 1);
            gl.enable(gl.DEPTH_TEST);
        }

        gl.viewport(0, 0, this._width, this._height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this._skyBox) {
            const shader = this._shaders['skybox'];
            shader.use();
            shader.setUniform('umCamera', this.camera.getSkyBoxMatrix());
            this._skyBox.draw(shader);
        }

        const mCamera = this.camera.getMatrix();

        const lightDir = vec3.fromValues(1, 1, 0);
        vec3.normalize(lightDir, lightDir);

        for (let model of this._sceneModels) {
            const shader = this._shaders[model.shader];
            shader.use();
            shader.setUniform('umCamera', mCamera);

            // if (shader.uniforms['uLightDir'] != null) {
            //     shader.setUniform('uLightDir', lightDir);
            // }

            model.draw(shader, mCamera, lightDir);
        }
    }

    startDrawCycle() {
        this._frame();
    }

    _frame(now) {
        this._logicTick(this._lastTickTs ? now - this._lastTickTs : 0);
        this._lastTickTs = now;
        this._draw();

        requestAnimationFrame(this._frame);
    }

    addLogicHook(func) {
        this._logicHooks.push(func);
    }

}

const PI2 = 2 * Math.PI;

function normalizeAngle(rotation, dimension) {
    const angle = rotation[dimension];

    if (angle < 0) {
        rotation[dimension] = angle % PI2 + PI2;
    } else if (angle >= PI2) {
        rotation[dimension] = angle % PI2;
    }
}

export function loadObj(modelName) {
    const url = `models/${modelName}.json`;

    return fetch(url).then(res => {
        if (!res.ok) {
            console.error(`Model loading [${url}] failed`);
            throw new Error('Model loading error');
        }

        return res.json().then(data => {
            data.vertices = new Float32Array(data.vertices);
            data.uvs      = new Float32Array(data.uvs);
            data.normals  = new Float32Array(data.normals);
            data.polygons = new Uint16Array(data.polygons);

            return data;
        });
    });
}

export function loadModel(engine, { model, alphaTextures }) {
    return loadObj(model).then(data => {
        const textures = {};
        const waits = [];

        for (let group of data.groups) {
            const material  = group.material || group.id;
            const isAlphaTexture = alphaTextures && alphaTextures.includes(material);
            const extension      = isAlphaTexture ? 'png' : 'jpg';
            const fileName       = `${model}__${material}.${extension}`;

            waits.push(Texture.loadTexture(engine, fileName, isAlphaTexture).then(texture => {
                textures[material] = texture;
            }));
        }

        return Promise.all(waits).then(() => new Model(engine, data, textures));
    });
}
