import Engine, { loadModel } from '../engine/Engine';
import Camera from '../engine/Camera';
import Texture from '../engine/Texture';
import Plain from '../engine/Plain';
import SkyBox from '../engine/SkyBox';
import CarController from '../engine/CarController';

const game = new Engine(document.getElementById('game-view'));
const camera = new Camera(game);

camera.position.y = 1.7;

game.setCamera(camera);

Promise.all([
    loadModel(game, {
        model: 'tank',
    }),
    loadModel(game, {
        model: 'oak',
        alphaTextures: ['blaetter'],
    }),
    SkyBox.loadSkyBox(game, 'skybox.jpg')
]).then(([tank, oak, skyBox]) => {
    game.keyboard.on('keydown', key => {
        if (key === 'q') {
            console.log('QQ');
        }
    });

    tank.position = {
        x: 0,
        y: -tank.boundBox.min[1],
        z: -7,
    };
    game.addModel(tank);

    const cc = new CarController(game, tank);
    game.addController(cc);

    game.setSkyBox(skyBox);

    oak.setScale(0.1);
    oak.position.z = 10;
    game.addModel(oak);

    game.startDrawCycle();

    Texture.loadTexture(game, 'grass.jpg').then(texture => {
        const plain = new Plain(game, texture, {
            repeat: [16, 16],
            size:   [128, 128],
        });

        game.addModel(plain);
    });
});

// const triangle = new Model(game, new Float32Array([
//     0, 1, 0,
//     -1, -1, 0,
//     1, -1, 0,
// ]));
