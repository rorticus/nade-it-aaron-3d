import { Engine, loadGLB, OrbitCamera, Scene } from "webgl-engine";
import { Room } from "colyseus.js";
import { GameState } from "../state/GameState";
import { StartGame } from "../interfaces";
import { createMapGameObject } from "../map";
import { character } from "../resources/assets";
import { vec3 } from "gl-matrix";
import { getPlayerSkin, updatePlayerSkin } from "../players";
import { Player } from "../state/Player";
import { GameComponentContext } from "webgl-engine/lib/interfaces";
import { KeyboardKey } from "webgl-engine/lib/services/KeyboardService";

const PLAYER_SPEED = 1.5;

const MOVEMENT_TAG = "Moving";

export class MovingTracker {
	movingTimer = 0;
	tag = MOVEMENT_TAG;

	update(context: GameComponentContext) {
		this.movingTimer = Math.max(this.movingTimer - context.deltaInSeconds, 0);
	}

	reset(t: number) {
		this.movingTimer += t;
	}

	isMoving() {
		return this.movingTimer > 0;
	}
}

export function mapToWorldCoordinates(
	map: StartGame,
	x: number,
	y: number
): vec3 {
	return vec3.fromValues(x - map.mapWidth / 2, 0, y - map.mapHeight / 2);
}

export function configurePlayerModel(
	engine: Engine,
	map: StartGame,
	player: Player
) {
	const characterModel = loadGLB(
		engine.gl,
		engine.programs.standard,
		character
	);
	characterModel.id = player.id;
	characterModel.position = mapToWorldCoordinates(
		map,
		player.position.x,
		player.position.z
	);
	characterModel.scale = vec3.fromValues(0.35, 0.35, 0.35);
	characterModel.animation.transitionTo("Idle", 0);
	characterModel.rotateY(player.rotation);
	updatePlayerSkin(engine, characterModel, getPlayerSkin(player.index));

	const movementTracker = new MovingTracker();
	characterModel.addComponent(movementTracker);

	characterModel.animation.addTransition(
		"Idle",
		"Walk",
		() => {
			return movementTracker.isMoving();
		},
		0.1
	);

	characterModel.animation.addTransition(
		"Walk",
		"Idle",
		() => {
			return !movementTracker.isMoving();
		},
		0.1
	);
	characterModel.animation.states["Walk"].timeScale = 2;

	return characterModel;
}

export class Play extends Scene {
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

			this.addGameObject(configurePlayerModel(engine, startGame, player));
		});

		this.room.state.players.onChange = (player) => {
			const model = this.getObjectById(player.id);

			model.position = mapToWorldCoordinates(
				startGame,
				player.position.x,
				player.position.z
			);
			model.rotateY(player.rotation);
		};
	}

	update(context: GameComponentContext) {
		super.update(context);

		const { keyboardService } = context.engine;
		let dirX = 0;
		let dirY = 0;

		if (keyboardService.down[KeyboardKey.ArrowLeft]) {
			dirX -= 1;
		}

		if (keyboardService.down[KeyboardKey.ArrowRight]) {
			dirX += 1;
		}

		if (keyboardService.down[KeyboardKey.ArrowUp]) {
			dirY -= 1;
		}

		if (keyboardService.down[KeyboardKey.ArrowDown]) {
			dirY += 1;
		}

		if (dirX || dirY) {
			const player = this.getObjectById(this.room.sessionId);
			if (player) {
				// player.position[0] += dirX * PLAYER_SPEED * context.deltaInSeconds;
				// player.position[2] += dirY * PLAYER_SPEED * context.deltaInSeconds;

				const movement = player.findComponent<MovingTracker>(MOVEMENT_TAG);
				if (movement) {
					movement.reset(context.deltaInSeconds + 0.0000001);
				}
			}

			this.room.send("move", { x: dirX, y: dirY });
		}
	}
}
