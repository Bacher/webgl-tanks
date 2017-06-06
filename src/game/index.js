import Engine from '../engine/Engine';
import Model from '../engine/Model';

const game   = new Engine(document.getElementById('game-view'));
//const camera = game.getDefaultCamera();

const triangle = new Model(game, new Float32Array([
    0, 1, 0,
    -1, -1, 0,
    1, -1, 0,
]));

game.addModel(triangle);

setInterval(() => {
    triangle.rotateY(0.2);

    game.draw();
}, 17);
