import { Engine, loadGLB, OrbitCamera, Scene } from "webgl-engine";
import { Room } from "colyseus.js";
import { GameState } from "../state/GameState";
import {createMapGameObject, createTileAt} from "../map";
import { bomb, character } from "../resources/assets";
import { vec3 } from "gl-matrix";
import { getPlayerSkin, updatePlayerSkin } from "../players";
import { Player } from "../state/Player";
import { GameComponentContext } from "webgl-engine/lib/interfaces";
import { KeyboardKey } from "webgl-engine/lib/services/KeyboardService";
import { MapInfo } from "../state/MapInfo";
import { AnimationWrapMode } from "webgl-engine/lib/animation/AnimationState";
import {
	PlayerMovement,
	PlayerMovementTag,
} from "../components/PlayerMovement";

export function mapToWorldCoordinates(
	map: MapInfo,
	x: number,
	y: number
): vec3 {
	return vec3.fromValues(x - map.width / 2, 0, y - map.height / 2);
}

export function configurePlayerModel(
	engine: Engine,
	map: MapInfo,
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

	const movementTracker = new PlayerMovement();
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

	characterModel.animation.addTransition("Walk", "Walk", () => false);

	characterModel.animation.addTransition(
		"Interact_ground",
		"Idle",
		(condition, gameObject, duration) => {
			return condition.deltaInSeconds > duration / 2 - 0.66;
		},
		0.33
	);

	characterModel.animation.states["Walk"].timeScale = 2;
	characterModel.animation.states["Interact_ground"].timeScale = 2;

	return characterModel;
}

function createBomb(engine: Engine) {
	const model = loadGLB(engine.gl, engine.programs.standard, bomb);

	model.animation.configure("Spawn", {
		wrap: AnimationWrapMode.None,
	});
	model.animation.configure("Pulses", {
		wrap: AnimationWrapMode.Loop,
	});

	model.animation.initialState = "Spawn";
	model.animation.addTransition(
		"Spawn",
		"Pulses",
		(context, gameObject, playDuration, totalDuration) => {
			return playDuration > totalDuration;
		}
	);

	return model;
}

export class Play extends Scene {
	constructor(public engine: Engine, public room: Room<GameState>) {
		super();

		const cam = new OrbitCamera();
		cam.radius = 12;
		cam.elevation = -7;
		cam.lookAt = [0, -2, 0];

		this.camera = cam;
		this.pointLights[0].position = [0, 10, 20];
		this.pointLights[0].color = [1, 1, 1];

		this.pointLights[1].position = [0, 10, -20];
		this.pointLights[1].color = [1, 1, 1];

		const map = createMapGameObject(engine, room.state.map);

		this.addGameObject(map);

		// add players to the map
		Object.keys(room.state.players).forEach((key) => {
			const player = room.state.players[key];

			this.addGameObject(configurePlayerModel(engine, room.state.map, player));
		});

		this.room.state.players.onChange = (player) => {
			const model = this.getObjectById(player.id);

			const movement = model.findComponent<PlayerMovement>(PlayerMovementTag);
			if (movement) {
				const pos = mapToWorldCoordinates(
					room.state.map,
					player.position.x,
					player.position.z
				);
				movement.setTarget(model, pos[0], model.position[1], pos[2]);
			}

			model.rotateY(player.rotation);
		};

		// bomb is dropped
		this.room.state.bombs.onAdd = (bomb, key) => {
			console.log(`Adding bomb ${bomb.id}, key ${key}`);

			const model = createBomb(engine);
			model.position = mapToWorldCoordinates(
				room.state.map,
				bomb.position.x,
				bomb.position.z
			);
			model.id = bomb.id;
			model.scale = [0.5, 0.5, 0.5];

			this.addGameObject(model);

			const player = this.getObjectById(bomb.owner);
			player.animation.transitionTo("Interact_ground", 0.33);
		};
		this.room.state.bombs.onRemove = (bomb, key) => {
			console.log(`Removing bomb ${bomb.id} index ${key}`);

			const model = this.getObjectById(bomb.id);

			if (model) {
				this.removeGameObject(model);
			} else {
				console.error(`Cannot find bomb with id ${bomb.id}`);
			}
		};

		this.room.state.map.onChange = (changes) => {
			changes.forEach((change) => {
				if (change.field === "map") {
					for (let y = 0; y < this.room.state.map.height; y++) {
						for (let x = 0; x < this.room.state.map.width; x++) {
							const index = y * this.room.state.map.width + x;
							if (
								change.value.charCodeAt(index) !==
								change.previousValue.charCodeAt(index)
							) {
								const tile = this.getObjectById(`tile-${x}-${y}`);
								if (tile) {
									const newTile = createTileAt(this.engine, x, y, 13);
									tile.children[0].renderable = newTile.children[0].renderable;
								}
							}
						}
					}
				}
			});
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

			if (player && player.animation.canTransition("Walk")) {
				this.room.send("move", { x: dirX, y: dirY });
			}
		}

		if (keyboardService.pressed(KeyboardKey.Space)) {
			this.room.send("place_bomb");
		}
	}
}
