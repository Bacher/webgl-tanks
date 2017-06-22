import { vec3, vec4, mat3, mat4 } from 'gl-matrix';
import _ from 'lodash';
import Shader from './Shader';
import Model from './Model';
import Mesh from './Mesh';
import Texture from './Texture';
import TextureWrapper from './TextureWrapper';
import Camera from './Camera';
import Keyboard from './Keyboard';
import SoundSystem from './SoundSystem';
import TextureVisualizator from './TextureVisualizator';

import * as BasicShader from './shaders/basic';
import * as TexturedShader from './shaders/textured';
import * as LightTexturedShader from './shaders/textured-light';
import * as TexturedPolyShader from './shaders/textured-poly';
import * as PlainTexturedShader from './shaders/plain-textured';
import * as SkyBoxShader from './shaders/skybox';
import * as TerrainShader from './shaders/terrain';
import * as TerrainShadowShader from './shaders/terrain-shadow';
import * as TerrainShadowSubShader from './shaders/terrain-shadow-sub';
import * as DepthMapShader from './shaders/depthmap';

const PId2 = Math.PI / 2;
const DEPTHMAP_SIZE = 2048;

const iden4 = mat4.create();
mat4.identity(iden4);

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

        this._initDepthMap();
    }

    _initShaderPrograms() {
        this._shaders.basic            = this._initShader(BasicShader);
        this._shaders.textured         = this._initShader(TexturedShader);
        this._shaders.texturedLight    = this._initShader(LightTexturedShader);
        this._shaders.texturedPoly     = this._initShader(TexturedPolyShader);
        this._shaders.plainTextured    = this._initShader(PlainTexturedShader);
        this._shaders.skybox           = this._initShader(SkyBoxShader);
        this._shaders.terrain          = this._initShader(TerrainShader);
        this._shaders.terrainShadow    = this._initShader(TerrainShadowShader);
        this._shaders.terrainShadowSub = this._initShader(TerrainShadowSubShader);
        this._shaders.depthmap         = this._initShader(DepthMapShader);
    }

    _initShader({ v, f }) {
        const shader = new Shader(this, v, f);
        shader.compile();
        return shader;
    }

    _initDepthMap() {
        const gl = this.gl;

        const ext = gl.getExtension('WEBGL_depth_texture');

        if (!ext) {
            throw new Error('Depth texture not supported');
        }

        this._depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._depthTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, DEPTHMAP_SIZE, DEPTHMAP_SIZE, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_SHORT, null);

        this._depthFrameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._depthFrameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this._depthTexture, 0);

        this._depthTextureWrapper = new TextureWrapper(this, this._depthTexture);
        this._textureVisualizator = new TextureVisualizator(this, this._depthTextureWrapper);
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

        const lightDir = vec3.fromValues(-0.7780731916427612, -0.5285899043083191, 0.3394036591053009);
        vec3.normalize(lightDir, lightDir);

        // +DEPTH

        const depthShader = this._shaders.depthmap;
        depthShader.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._depthFrameBuffer);

        gl.viewport(0, 0, DEPTHMAP_SIZE, DEPTHMAP_SIZE);
        //gl.clearColor(0, 0, 0, 1);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        //const mLightProjection = this.camera.getMatrix();
        const mLightProjection = mat4.create();
        mat4.ortho(mLightProjection, -45, 45, -45, 45, 0, 120);
        //mat4.identity(mLightProjection);
        //mat4.perspective(45, 1, 0.1, 1000, mLightProjection);

        //mat4.rotateY(mLightProjection, mLightProjection, -this.camera.rotation.y);
        //mat4.translate(mLightProjection, mLightProjection, [-this.camera.position.x, -50, -this.camera.position.z]);
        mat4.rotateX(mLightProjection, mLightProjection, 0.6);
        mat4.rotateY(mLightProjection, mLightProjection, 1.22);

        mat4.translate(mLightProjection, mLightProjection, [12.8, -50, 6.43]);

        window.mLightProjection = mLightProjection;
        depthShader.setUniform('umCamera', mLightProjection);

        for (let model of this._sceneModels) {
            if (model.drawForDepthMap) {
                model.drawForDepthMap(depthShader);
            }
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // -DEPTH

        gl.viewport(0, 0, this._width, this._height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this._skyBox) {
            const shader = this._shaders['skybox'];
            shader.use();
            shader.setUniform('umCamera', this.camera.getSkyBoxMatrix());
            this._skyBox.draw(shader);
        }

        const mCamera = this.camera.getMatrix();

        for (let model of this._sceneModels) {
            const shader = this._shaders[model.shader];
            shader.use();
            shader.setUniform('umCamera', mCamera);

            // if (shader.uniforms['uLightDir'] != null) {
            //     shader.setUniform('uLightDir', lightDir);
            // }

            model.draw(shader, mCamera, lightDir);
        }

        const shader = this._shaders.textured;
        shader.use();
        shader.setUniform('umCamera', iden4);
        this._textureVisualizator.draw(shader);
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

            waits.push(Texture.loadTexture(engine, fileName, { alpha: isAlphaTexture }).then(texture => {
                textures[material] = texture;
            }));
        }

        return Promise.all(waits).then(() => new Model(engine, data, textures));
    });
}

export function loadMeshAndTextures(engine, { model, alphaTextures }) {
    return loadObj(model).then(data => {
        const textures = {};
        const waits = [];

        for (let group of data.groups) {
            const material       = group.material || group.id;
            const isAlphaTexture = alphaTextures && alphaTextures.includes(material);
            const extension      = isAlphaTexture ? 'png' : 'jpg';
            const fileName       = `${model}__${material}.${extension}`;

            waits.push(Texture.loadTexture(engine, fileName, { alpha: isAlphaTexture }).then(texture => {
                textures[material] = texture;
            }));
        }

        const mesh = new Mesh(engine, data);

        return Promise.all(waits).then(() => ({ mesh, textures }));
    });
}
