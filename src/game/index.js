import Engine, { loadModel } from '../engine/Engine';
import Camera from '../engine/Camera';
import Model from '../engine/Model';

const game = new Engine(document.getElementById('game-view'));
const camera = new Camera(game);

game.setCamera(camera);

let frame = 0;

loadModel(game, {
    model: 'tank',
}).then(tank => {
    tank.position = {
        x: 0,
        y: -1,
        z: -7,
    };

    game.addModel(tank);

    const intervalId = setInterval(() => {
        tank.rotation.y += 0.2;

        frame++;
        game.draw();

        if (frame === 1000) {
            clearInterval(intervalId);
        }
    }, 200);
});

// const triangle = new Model(game, new Float32Array([
//     0, 1, 0,
//     -1, -1, 0,
//     1, -1, 0,
// ]));


