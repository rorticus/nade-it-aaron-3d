import { Engine, LightType, loadGLB, OrbitCamera, Scene } from "webgl-engine";
import { Room } from "colyseus.js";
import { GameState } from "../state/GameState";
import { StartGame } from "../interfaces";
import { createMapGameObject } from "../map";
import { character } from "../resources/assets";
import { vec3 } from "gl-matrix";
import { getPlayerSkin, updatePlayerSkin } from "../players";
import { Player } from "../state/Player";

export function configurePlayerModel(engine: Engine, player: Player) {
	const characterModel = loadGLB(
		engine.gl,
		engine.programs.standard,
		character
	);
	characterModel.id = player.id;
	characterModel.position = vec3.fromValues(
		player.position.x,
		player.position.y,
		player.position.z
	);
	characterModel.animation.transitionTo("Idle", 0);
	characterModel.rotateY(player.rotation);
	updatePlayerSkin(engine, characterModel, getPlayerSkin(player.index));

	return characterModel;
}

export class Play extends Scene {
	constructor(
		public engine: Engine,
		startGame: StartGame,
		room: Room<GameState>
	) {
		super();

		const cam = new OrbitCamera();
		cam.radius = 12;
		cam.elevation = -7;

		this.camera = cam;
		this.pointLights[0].position = [0, 10, 10];
		this.pointLights[0].color = [1, 1, 1];

		const map = createMapGameObject(engine, {
			width: startGame.mapWidth,
			height: startGame.mapHeight,
			map: startGame.map,
		});

		this.addGameObject(map);

		// add players to the map
		Object.keys(room.state.players).forEach((key) => {
			const player = room.state.players[key];

			this.addGameObject(configurePlayerModel(engine, player));
		});
	}
}
