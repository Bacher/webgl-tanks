import Engine, { loadModel } from '../engine/Engine';
import Camera from '../engine/Camera';
import Texture from '../engine/Texture';
import Plain from '../engine/Plain';

const game = new Engine(document.getElementById('game-view'));
const camera = new Camera(game);

camera.position.y = 1.7;

game.setCamera(camera);

let frame = 0;

loadModel(game, {
    model: 'tank',
}).then(tank => {
    tank.position = {
        x: 0,
        y: -tank.boundBox.min[1],
        z: -7,
    };

    game.addModel(tank);

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
