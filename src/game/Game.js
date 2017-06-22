import Engine, { loadMeshAndTextures, loadObj } from '../engine/Engine';
import Camera from '../engine/Camera';
import Texture from '../engine/Texture';
import Plain from '../engine/Terrain';
import Model from '../engine/Model';
import SkyBox from '../engine/SkyBox';
import Connection from './Connection';
import { parseSearchQuery } from './utils';

const PI2 = Math.PI * 2;

export default class Game {

    constructor() {
        this.meshes   = new Map();
        this.textures = new Map();

        this.searchParams = parseSearchQuery();

        this.playerName = this.searchParams.name || 'Random_' + Math.random().toString().substr(2, 8);

        this.engine   = new Engine(document.getElementById('game-view'));
        this.camera   = new Camera(this.engine, { distance: 1000 });
        this.socket   = new Connection();
        this.tanksMap = new Map();

        this._isStarted = false;

        this.socket.onMessage(message => {
            this._handleMessage(message.type, message.data);
        });

        this.camera.position.y = 1.7;

        this.engine.setCamera(this.camera);
    }

    init() {
        this._prepare()
            .then(() => this.socket.connect())
            .then(() => {
                this.socket.send('join', {
                    name: this.playerName,
                });
            })
            .catch(err => {
                console.error('Init failed:', err);
            });
    }

    _prepare() {
        return this._loadResources()
            .then(() => this._afterLoad());
    }

    _afterLoad() {
        const engine = this.engine;

        this._initGround();

        engine.setSkyBox(this._skyBox);

        engine.addLogicHook(delta => {
            this._logicTick(delta);
        });

        this._addStaticGameObjects();

        this._bindKeyboard();
    }

    start() {
        this._isStarted = true;
        this.engine.startDrawCycle();

        if (!this.engine.isObserverMode) {
            this._sendInput();

            setInterval(() => {
                this._sendInput();
            }, 1000 / 30);
        }
    }

    _loadResources() {
        const engine = this.engine;

        return Promise.all([
            loadMeshAndTextures(engine, {
                model: 'tank',
            }).then(data => this.meshes.set('tank', data)),
            loadMeshAndTextures(engine, {
                model: 'oak',
                alphaTextures: ['blaetter'],
            }).then(data => this.meshes.set('oak', data)),
            SkyBox.loadSkyBox(engine, 'skybox.jpg').then(skyBox => this._skyBox = skyBox),
            engine.soundSystem.loadAudio('tank-shoot.wav', 'tank-shoot'),
            this.loadTexture('grass.jpg', { wrap: 'repeat' }),
            this.loadTexture('stone-road.jpg', { wrap: 'repeat' }),
            this.loadTexture('terrain.jpg'),
            loadObj('ground').then(groundMesh => this._groundMesh = groundMesh)
        ]);
    }

    _initGround() {
        const plain = new Plain(this.engine, {
            meshInfo: this._groundMesh,
            textures: [this.textures.get('grass.jpg'), this.textures.get('stone-road.jpg')],
            depthmap: this.textures.get('terrain.jpg'),
            repeat:   [16, 16],
            size:     [128, 128],
        });

        this.engine.addModel(plain);
    }

    _bindKeyboard() {
        this.engine.keyboard.on('keydown', key => {
            if (key === 'space') {
                this.engine.soundSystem.play('tank-shoot');
            }

            if (key === 'q') {
                console.log('Camera pos:', this.camera.position, 'rotation:', this.camera.rotation);
            }
        });
    }

    _addStaticGameObjects() {
        const oakData = this.meshes.get('oak');
        const oak = new Model(this.engine, oakData.mesh, oakData.textures);
        oak.setScale(0.1);
        oak.position.z = 10;
        this.engine.addModel(oak);
    }

    _logicTick(delta) {
        for (let tankState of this._worldState.tanks) {
            let tank = this.tanksMap.get(tankState.id);

            if (!tank) {
                const tankData = this.meshes.get('tank');
                tank = new Model(this.engine, tankData.mesh.clone(), tankData.textures);

                this.tanksMap.set(tankState.id, tank);
                this.engine.addModel(tank);
            }

            const pos = tankState.pos;

            tank.position = { x: pos.x, y: tank.position.y, z: pos.y };
            tank.rotation.y = tankState.dir;

            if (tankState.id === this._myTankId && !this.engine.isObserverMode) {
                this.camera.position.x = pos.x;
                this.camera.position.y = 4;
                this.camera.position.z = pos.y;
            }

            const turret = tank.getPart('Turret_2');

            turret.rotation.y = tankState.turDir;
        }
    }

    _handleMessage(type, data) {
        switch (type) {
            case 'world':
                this._worldState = data;

                if (!this._isStarted) {
                    this.start();
                }
                break;
            case 'tank':
                this._myTankId = data.id;
                break;
            default:
                console.log(`Unknown message [${type}]`);
        }
    }

    loadTexture(fileName, params) {
        return Texture.loadTexture(this.engine, fileName, params).then(texture => {
            this.textures.set(fileName, texture);

            return texture;
        });
    }

    _sendInput() {
        const keyboard = this.engine.keyboard;

        let direction = 0;
        let acceleration = 0;

        if (keyboard.keys.has('w')) {
            acceleration += 1;
        }

        if (keyboard.keys.has('s')) {
            acceleration -= 1;
        }

        if (keyboard.keys.has('a')) {
            direction -= 1;
        }

        if (keyboard.keys.has('d')) {
            direction = 1;
        }

        this.socket.send('input', {
            direction,
            acceleration,
            viewDirection: this.camera.rotation.y,
        });
    }

}

function normalizeAngle(angle) {
    let _angle = angle;

    if (_angle < 0) {
        return _angle - Math.floor(_angle / PI2) * PI2;
    } else {
        if (_angle < PI2) {
            return _angle
        } else {
            return _angle % PI2;
        }
    }
}
