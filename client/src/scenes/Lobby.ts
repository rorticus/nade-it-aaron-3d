import {Engine, LightType, loadGLB, Scene} from "webgl-engine";
import {positionSpriteOnCanvas, sprite} from "webgl-engine/lib/webgl/utils";
import {vec3} from "gl-matrix";

const backgroundImage = require('../resources/images/lobby-background.png').default;
const waitingForPlayers = require('../resources/images/waiting-for-players.png').default;

const character = require('../resources/models/character.glb');

function loadCharacter(engine: Engine, position: [number, number, number], rotation: number) {
    const character1 = loadGLB(engine.gl, engine.programs.standard, character);
    character1.id = 'character1';
    character1.position = position;
    character1.animation.transitionTo('Idle', 0);
    character1.rotateY(rotation);
    character1.getObjectById('characterMedium', true).renderable.renderables[0].uniforms['u_color'] = vec3.fromValues(0, 0, 0);

    return character1;
}

export class Lobby extends Scene {
    constructor(engine: Engine) {
        super();

        this.camera.position = vec3.fromValues(0, 0, 10);
        this.pointLights = [
            {
                type: LightType.Point,
                position: [0, 0, 10],
                color: [1, 1, 1]
            }
        ];

        const background = sprite(engine, backgroundImage);
        positionSpriteOnCanvas(engine, background, 0, 0, 1024, 768);
        this.addGameObject(background);

        const waiting = sprite(engine, waitingForPlayers);
        positionSpriteOnCanvas(engine, waiting, 369, 324, 286, 121);
        this.addGameObject(waiting, 1);

        const character1 = loadCharacter(engine, [6,1,0], -Math.PI * 45 / 180);
        character1.id = 'character1';
        this.addGameObject(character1, 2);

        const character2 = loadCharacter(engine, [-6, 1, 0], Math.PI * 45 / 180);
        character2.id = 'character2';
        this.addGameObject(character2, 2);

        const character3 = loadCharacter(engine, [6, -4.5, 0], -Math.PI * 45 / 180);
        character3.id = 'character3';
        this.addGameObject(character3, 2);

        const character4 = loadCharacter(engine, [-6, -4.5, 0], Math.PI * 45 / 180);
        character4.id = 'character4';
        this.addGameObject(character4, 2);
    }
}

export default Lobby;