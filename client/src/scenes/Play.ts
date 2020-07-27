import {Engine, loadGLB, OrbitCamera, Scene} from "webgl-engine";
import {Room} from "colyseus.js";
import {GameState} from "../state/GameState";
import {StartGame} from "../interfaces";
import {createMapGameObject} from "../map";
import {character} from "../resources/assets";
import {vec3} from "gl-matrix";
import {getPlayerSkin, updatePlayerSkin} from "../players";
import {Player} from "../state/Player";
import {GameComponentContext} from "webgl-engine/lib/interfaces";
import {KeyboardKey} from "webgl-engine/lib/services/KeyboardService";
import {Actions} from "../actions";
import {AnimationWrapMode} from "webgl-engine/lib/animation/AnimationState";

const EPSILON = 0.001;

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
	characterModel.scale = vec3.fromValues(0.35, 0.35, 0.35);
	characterModel.animation.transitionTo("Idle", 0);
	characterModel.rotateY(player.rotation);
	updatePlayerSkin(engine, characterModel, getPlayerSkin(player.index));

	characterModel.animation.addTransition(
		"Idle",
		"Walk",
		() => {
			return player.up || player.down || player.left || player.right;
		},
		0.33
	);

	characterModel.animation.addTransition(
		"Walk",
		"Idle",
		() => {
			return !player.up && !player.down && !player.left && !player.right;
		},
		0.1
	);
	characterModel.animation.states['Walk'].timeScale = 1.25;

	return characterModel;
}

export class Play extends Scene {
	private down = false;
	private left = false;
	private right = false;
	private up = false;

	constructor(
		public engine: Engine,
		startGame: StartGame,
		public room: Room<GameState>
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

		this.room.state.players.onChange = (player) => {
			const model = this.getObjectById(player.id);

			model.position[0] = player.position.x;
			model.position[1] = player.position.y;
			model.position[2] = player.position.z;

			model.rotateY(player.rotation);
		};
	}

	update(context: GameComponentContext) {
		super.update(context);

		const { keyboardService } = context.engine;

		if (keyboardService.down[KeyboardKey.ArrowLeft] && !this.left) {
			this.room.send(Actions.LeftDown);
			this.left = true;
		} else if (!keyboardService.down[KeyboardKey.ArrowLeft] && this.left) {
			this.left = false;
			this.room.send(Actions.LeftUp);
		}

		if (keyboardService.down[KeyboardKey.ArrowRight] && !this.right) {
			this.room.send(Actions.RightDown);
			this.right = true;
		} else if (!keyboardService.down[KeyboardKey.ArrowRight] && this.right) {
			this.right = false;
			this.room.send(Actions.RightUp);
		}

		if (keyboardService.down[KeyboardKey.ArrowUp] && !this.up) {
			this.room.send(Actions.UpDown);
			this.up = true;
		} else if (!keyboardService.down[KeyboardKey.ArrowUp] && this.up) {
			this.up = false;
			this.room.send(Actions.UpUp);
		}

		if (keyboardService.down[KeyboardKey.ArrowDown] && !this.down) {
			this.room.send(Actions.DownDown);
			this.down = true;
		} else if (!keyboardService.down[KeyboardKey.ArrowDown] && this.down) {
			this.down = false;
			this.room.send(Actions.DownUp);
		}
	}
}
