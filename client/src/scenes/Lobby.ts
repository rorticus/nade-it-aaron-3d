import {Engine, Scene} from "webgl-engine";
import {positionSpriteOnCanvas, sprite} from "webgl-engine/lib/webgl/utils";

const backgroundImage = require('../resources/images/lobby-background.png').default;
const waitingForPlayers = require('../resources/images/waiting-for-players.png').default;

export class Lobby extends Scene {
    constructor(engine: Engine) {
        super();

        const background = sprite(engine, backgroundImage);
        positionSpriteOnCanvas(engine, background, 0, 0, 1024, 768);
        this.addGameObject(background);

        const waiting = sprite(engine, waitingForPlayers);
        positionSpriteOnCanvas(engine, waiting, 369, 324, 286, 121);
        this.addGameObject(waiting, 1);
    }
}

export default Lobby;