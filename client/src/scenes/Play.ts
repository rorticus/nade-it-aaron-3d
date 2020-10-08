import {
	Engine,
	GameObject,
	loadGLB,
	OrbitCamera,
	Scene,
	TranslationAnimationChannel,
} from "webgl-engine";
import { Room } from "colyseus.js";
import { GameState } from "../state/GameState";
import { createMapGameObject, createTileAt } from "../map";
import {
	bomb,
	bombPowerUp,
	character,
	explosion,
	hudBombs,
	hudBombsImage,
	hudPowerImage,
	powerPowerUp,
} from "../resources/assets";
import { vec3 } from "gl-matrix";
import { getPlayerSkin, updatePlayerSkin } from "../players";
import { Player } from "../state/Player";
import { GameComponentContext } from "webgl-engine/lib/interfaces";
import { KeyboardKey } from "webgl-engine/lib/services/KeyboardService";
import { MapInfo } from "../state/MapInfo";
import {
	AnimationState,
	AnimationWrapMode,
} from "webgl-engine/lib/animation/AnimationState";
import {
	PlayerMovement,
	PlayerMovementTag,
} from "../components/PlayerMovement";
import {
	positionSpriteOnCanvas,
	sprite,
	updateSpriteFromSource,
} from "webgl-engine/lib/webgl/utils";
import * as hudInfo from "../resources/hud.json";
import { PowerUp } from "../state/PowerUp";

export interface ExplosionDescription {
	origin: [number, number];
	north: number;
	east: number;
	south: number;
	west: number;
}

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

export function createExplosion(engine: Engine, desc: ExplosionDescription) {
	const north = loadGLB(engine.gl, engine.programs.standard, explosion);
	north.rotateY((90 * Math.PI) / 180);

	const east = loadGLB(engine.gl, engine.programs.standard, explosion);

	const west = loadGLB(engine.gl, engine.programs.standard, explosion);
	west.rotateY((180 * Math.PI) / 180);

	const south = loadGLB(engine.gl, engine.programs.standard, explosion);
	south.rotateY((270 * Math.PI) / 180);

	const model = new GameObject();
	model.add(north);
	model.add(east);
	model.add(west);
	model.add(south);

	function animationIn(model: GameObject, size: number) {
		const originalPosition = vec3.clone(
			model.getObjectById("Slider", true).position
		);
		vec3.add(originalPosition, originalPosition, vec3.fromValues(0, -0.5, 0));
		const newPosition = vec3.create();

		vec3.add(newPosition, originalPosition, vec3.fromValues(0, size, 0));

		return new TranslationAnimationChannel(
			model.getObjectById("Slider", true),
			[0, 0.25, 0.5],
			[originalPosition, newPosition, originalPosition]
		);
	}

	const state = new AnimationState();
	state.channels = [
		animationIn(north, desc.north),
		animationIn(east, desc.east),
		animationIn(west, desc.west),
		animationIn(south, desc.south),
	];

	model.animation.registerState("explode", state);
	model.animation.initialState = "explode";
	model.animation.registerState("finished", new AnimationState());
	model.animation.configure("finished", {
		onEnter() {
			model.removeFromParent();
		},
	});
	model.animation.addTransition(
		"explode",
		"finished",
		(context, gameObject, playDuration, totalDuration) => {
			return playDuration > totalDuration;
		}
	);

	return model;
}

function createScoreBox(engine: Engine, player: Player) {
	const scoreBox = new GameObject();
	const hudPosition = hudInfo.positions[player.index - 1];

	const canvas = document.createElement("canvas");
	canvas.width = 300;
	canvas.height = 150;
	const context = canvas.getContext("2d");

	function renderScorebox() {
		context.fillStyle = "white";
		context.font = "bold 75px sans-serif";
		context.textBaseline = "top";
		context.textAlign = "left";

		context.clearRect(0, 0, 300, 150);

		const score = `${player.score}`.padStart(6, "0");

		const textBounds = context.measureText(score);

		function drawIconWithBadge(
			image: CanvasImageSource,
			x: number,
			y: number,
			badge: number
		) {
			context.drawImage(hudBombsImage, x, y);
			context.fillStyle = "red";
			context.beginPath();
			context.arc(x + 48, y + 42, 12, 0, 360);
			context.fill();
			context.closePath();

			context.fillStyle = "white";
			context.font = "bold 12px sans-serif";
			context.textBaseline = "middle";
			context.textAlign = "center";
			context.fillText(String(badge), x + 48, y + 42);
		}

		if (hudPosition.alignment === "left") {
			context.fillText(
				score,
				0,
				100 -
					(textBounds.fontBoundingBoxDescent - textBounds.fontBoundingBoxAscent)
			);

			drawIconWithBadge(hudBombsImage, 0, 90, player.bombsAllowed);
			drawIconWithBadge(hudPowerImage, 64, 90, player.bombLength);
		} else if (hudPosition.alignment === "right") {
			context.fillText(
				score,
				300 - textBounds.width,
				100 -
					(textBounds.fontBoundingBoxDescent - textBounds.fontBoundingBoxAscent)
			);

			drawIconWithBadge(hudBombsImage, 300 - 128, 90, player.bombsAllowed);
			drawIconWithBadge(hudPowerImage, 300 - 64, 90, player.bombLength);
		}
	}

	renderScorebox();

	const canvasSprite = sprite(engine, canvas);

	player.onChange = (changes) => {
		changes.forEach((change) => {
			if (change.field === "score") {
				renderScorebox();
				updateSpriteFromSource(engine, canvasSprite, canvas);
			}
		});
	};

	scoreBox.add(canvasSprite);

	positionSpriteOnCanvas(
		engine,
		scoreBox,
		hudPosition.x,
		hudPosition.y,
		300,
		150
	);

	return scoreBox;
}

export function createPowerUp(engine: Engine, powerUp: PowerUp) {
	const models: Record<string, ArrayBuffer> = {
		bomb: bombPowerUp,
		power: powerPowerUp,
	};

	const model = loadGLB(
		engine.gl,
		engine.programs.standard,
		models[powerUp.type]
	);
	model.id = powerUp.id;

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
			this.addGameObject(createScoreBox(engine, player));
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
			const model = this.getObjectById(bomb.id);

			if (model) {
				this.removeGameObject(model);
			} else {
				console.error(`Cannot find bomb with id ${bomb.id}`);
			}
		};

		// powerups
		this.room.state.powerUps.onAdd = (powerUp, key) => {
			const model = createPowerUp(engine, powerUp);
			model.position = mapToWorldCoordinates(
				this.room.state.map,
				powerUp.position.x,
				powerUp.position.y
			);

			this.addGameObject(model);
		};
		this.room.state.powerUps.onRemove = (powerUp) => {
			const model = this.getObjectById(powerUp.id);
			model.removeFromParent();
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

		this.room.onMessage("explode", (payload: ExplosionDescription) => {
			// construct the explosion
			const model = createExplosion(this.engine, payload);

			model.position = vec3.fromValues(
				payload.origin[0],
				0.5,
				payload.origin[1]
			);

			map.add(model);
		});
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
