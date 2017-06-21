import Engine, { loadModel, loadObj } from '../engine/Engine';
import Camera from '../engine/Camera';
import Texture from '../engine/Texture';
import Plain from '../engine/Terrain';
import SkyBox from '../engine/SkyBox';
import CarController from '../engine/CarController';
import Connection from './Connection';
import { parseSearchQuery } from './utils';

const PI2 = Math.PI * 2;

export default class Game {

    constructor() {
        this.models   = new Map();
        this.textures = new Map();

        this.searchParams = parseSearchQuery();

        this.playerName = this.searchParams.name || 'Random_' + Math.random().substr(2, 8);

        this.engine = new Engine(document.getElementById('game-view'));
        this.camera = new Camera(this.engine, { distance: 1000 });
        this.socket = new Connection();
        this.tanks  = [];
        this.tank   = null;

        this._isStarted = false;

        this.socket.onMessage(message => {
            this._handleMessage(message);
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

        // const turret = tank.getPart('Turret_2');
        //
        // tank.position = {
        //     x: 0,
        //     y: -tank.boundBox.min[1],
        //     z: -7,
        // };
        //
        // engine.addModel(tank);
        //
        // if (!engine.isObserverMode) {
        //     const cc = new CarController(engine, tank);
        //     engine.addController(cc);
        // }
    }

    start() {
        this._isStarted = true;
        this.engine.startDrawCycle();
    }

    _loadResources() {
        const engine = this.engine;

        return Promise.all([
            loadModel(engine, {
                model: 'tank',
            }).then(tank => this.models.set('tank', tank)),
            loadModel(engine, {
                model: 'oak',
                alphaTextures: ['blaetter'],
            }).then(oak => this.models.set('oak', oak)),
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
            repeat: [16, 16],
            size:   [128, 128],
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
        const oak = this.models.get('oak');
        oak.setScale(0.1);
        oak.position.z = 10;
        this.engine.addModel(oak);
    }

    _logicTick(delta) {
        if (this.engine.isObserverMode) {
            return;
        }

        const _delta = delta * 0.0008;

        const needAngle  = this.camera.rotation.y - this.tank.rotation.y;
        const deltaAngle = normalizeAngle(turret.rotation.y - needAngle);

        if (deltaAngle < _delta || deltaAngle > PI2 - _delta) {
            turret.rotation.y = needAngle
        } else {
            if (deltaAngle > Math.PI) {
                turret.rotation.y += _delta;
            } else {
                turret.rotation.y -= _delta;
            }
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
