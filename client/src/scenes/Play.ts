import {Engine, LightType, Scene} from "webgl-engine";
import {Room} from "colyseus.js";
import {GameState} from "../state/GameState";
import {StartGame} from "../interfaces";
import {createMapGameObject} from "../map";
import {vec3} from "gl-matrix";

export class Play extends Scene {
	constructor(
		public engine: Engine,
		startGame: StartGame,
		room: Room<GameState>
	) {
		super();

		this.camera.position = vec3.fromValues(0, 10, 10);
		this.pointLights[0].position = [0, 10, 10];
		this.pointLights[0].color = [1, 1, 1];

		const map = createMapGameObject(engine, {
			width: startGame.mapWidth,
			height: startGame.mapHeight,
			map: startGame.map
		});

		this.addGameObject(map);
	}
}
