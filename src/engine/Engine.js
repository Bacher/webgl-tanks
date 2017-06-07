import { mat3, mat4 } from 'gl-matrix';
import _ from 'lodash';
import Shader from './Shader';
import Model from './Model';
import Texture from './Texture';
import Camera from './Camera';
import Controller from './Controller';
import * as BasicShader from './shaders/basic'
import * as TexturedShader from './shaders/textured'

const PId2 = Math.PI / 2;

window.mat3 = mat3;
window.mat4 = mat4;

export default class Engine {

    constructor(canvas) {
        _.bindAll(this, [
            '_onMouseMove',
        ]);

        this._canvas = canvas;

        this._firstDraw = true;

        this._width  = 600;
        this._height = 400;
        this._ratio  = this._width / this._height;

        this._canvas.width  = this._width;
        this._canvas.height = this._height;

        this.gl = canvas.getContext('webgl');

        this._shaders = {};
        this._sceneModels = [];

        this._camera = new Camera(this, this._ratio);
        this._controller = new Controller(this);

        this._initShaderPrograms();

        this._addInputListeners();
    }

    _initShaderPrograms() {
        this._shaders.basic = new Shader(this, BasicShader.v, BasicShader.f);
        this._shaders.basic.compile();

        this._shaders.textured = new Shader(this, TexturedShader.v, TexturedShader.f);
        this._shaders.textured.compile();
    }

    _addInputListeners() {
        this._canvas.addEventListener('mousedown', () => {
            if (document.pointerLockElement !== this._canvas) {
                this._canvas.requestPointerLock();
            }
        });

        this._canvas.addEventListener('mousemove', this._onMouseMove);

        this._controller.addInputListeners();
    }

    _onMouseMove(e) {
        if (this.isActive()) {
            const rotation = this._camera.rotation;
            rotation.y += (e.movementX * 0.003);
            rotation.x += (e.movementY * 0.003);

            if (rotation.x > PId2) {
                rotation.x = PId2;
            } else if (rotation.x < -PId2) {
                rotation.x = -PId2;
            }

            // normalizeAngle(this._camera.rotation, 'x');
            // normalizeAngle(this._camera.rotation, 'y');
        }
    }

    isActive() {
        return document.pointerLockElement === this._canvas;
    }

    addModel(model) {
        this._sceneModels.push(model);
    }

    draw() {
        const gl = this.gl;

        if (this._firstDraw) {
            this._firstDraw = false;
            gl.clearColor(0, 0, 0, 1);
            gl.enable(gl.DEPTH_TEST);
        }

        gl.viewport(0, 0, this._width, this._height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const shader = this._shaders.textured;
        shader.use();

        this._camera.applyMovement(this._controller);

        shader.setUniform('umCamera', this._camera.getMatrix());

        for (let model of this._sceneModels) {
            model.draw(shader);
        }
    }

    getDefaultCamera() {
        return this._camera;
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

export function loadModel(engine, { model }) {
    const url = `models/${model}.json`;

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

            const textures = {};
            const waits = [];

            for (let group of data.groups) {
                waits.push(Texture.loadTexture(engine, `${model}__${group.material}.jpg`).then(texture => {
                    textures[group.material] = texture;
                }))
            }

            return Promise.all(waits).then(() => {
                return new Model(engine, data, textures);
            });
        });
    });
}
