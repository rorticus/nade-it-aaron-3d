import { Room } from "colyseus.js";
import { vec3 } from "gl-matrix";
import { Camera, Engine, loadGLB, Scene } from "webgl-engine";
import { GameComponentContext } from "webgl-engine/lib/interfaces";
import { KeyboardKey } from "webgl-engine/lib/services/KeyboardService";
import { StandardMaterialInstance } from "webgl-engine/lib/StandardMaterialInstance";
import {
	positionSpriteOnCanvas,
	sprite,
	updateSpriteFromSource,
} from "webgl-engine/lib/webgl/utils";
import {
	PlayerMovement,
	PlayerMovementTag,
} from "../components/PlayerMovement";
import { ExplosionDescription, FireDescription } from "../interfaces";
import { createMapGameObject, createTileAt } from "../map";
import {
	bomberman17,
	bomberman28,
	bomberman30Black,
	hudBombsImage,
	hudPowerImage,
	levelBackground,
	scoreboxPlayer1,
	scoreboxPlayer2,
	scoreboxPlayer3,
	scoreboxPlayer4,
} from "../resources/assets";
import { GameState } from "../state/GameState";
import { Player } from "../state/Player";
import { PowerUp } from "../state/PowerUp";
import {
	configurePlayerModel,
	createBomb,
	createBoxExplosion,
	createFireBlock,
	createPowerUp,
	drawTextOnCanvas,
	mapToWorldCoordinates,
	playerColors,
	textDimensions,
} from "./helpers";

export function createBadge(
	engine: Engine,
	image: CanvasImageSource,
	y: number
) {
	const canvas = document.createElement("canvas");
	canvas.width = 84;
	canvas.height = 42;
	const context = canvas.getContext("2d");

	const gameObject = sprite(engine, canvas);
	positionSpriteOnCanvas(engine, gameObject, 931, y, 84, 42);

	function update(value: number) {
		context.clearRect(0, 0, 84, 42);
		const num = `${value}`;

		context.drawImage(image, 0, 0);

		const textBounds = textDimensions(bomberman30Black, num);
		drawTextOnCanvas(
			context,
			num,
			bomberman30Black,
			84 - textBounds.width - 8,
			42 / 2 - textBounds.height / 2
		);

		updateSpriteFromSource(engine, gameObject, canvas);
	}

	update(1);

	return {
		gameObject,
		update,
	};
}

export function createPlayerScoreBox(
	engine: Engine,
	index: number,
	name: string,
	scoreboxY: number
) {
	let image: string;

	switch (index) {
		case 1:
			image = scoreboxPlayer1;
			break;
		case 2:
			image = scoreboxPlayer2;
			break;
		case 3:
			image = scoreboxPlayer3;
			break;
		case 4:
			image = scoreboxPlayer4;
			break;
	}

	const box = sprite(engine, image);

	const canvas = document.createElement("canvas");
	canvas.width = 116;
	canvas.height = 49;
	const context = canvas.getContext("2d");

	const textBit = sprite(engine, canvas);

	function update(value: number) {
		context.clearRect(0, 0, 116, 49);
		const num = `${value}`;

		const textBounds = textDimensions(bomberman28, num);
		drawTextOnCanvas(
			context,
			num,
			bomberman28,
			116 / 2 - textBounds.width / 2,
			49 / 2 - textBounds.height / 2
		);

		updateSpriteFromSource(engine, textBit, canvas);
	}

	positionSpriteOnCanvas(engine, textBit, 5, scoreboxY, 116, 49);
	positionSpriteOnCanvas(engine, box, 5, scoreboxY, 116, 82);

	textBit.renderPhase = "alpha";
	box.renderPhase = "alpha";

	const dim = textDimensions(bomberman17, name);

	const c = document.createElement("canvas");
	c.width = dim.width;
	c.height = dim.height;

	const context2 = c.getContext("2d");
	drawTextOnCanvas(context2, name, bomberman17, 0, 0);
	const nameObject = sprite(engine, c);
	nameObject.renderPhase = "alpha";

	const aspect = dim.width / dim.height;

	if (dim.width > 116) {
		let newWidth = 116;
		let newHeight = newWidth * aspect;

		positionSpriteOnCanvas(
			engine,
			nameObject,
			5 + 116 / 2 - newWidth / 2,
			scoreboxY + 49 + 32 / 2 - newHeight / 2,
			newWidth,
			newHeight
		);
	} else {
		positionSpriteOnCanvas(
			engine,
			nameObject,
			5 + 116 / 2 - dim.width / 2,
			scoreboxY + 49 + 32 / 2 - dim.height / 2,
			dim.width,
			dim.height
		);
	}

	update(0);

	return {
		gameObjectScorebox: box,
		gameObjectText: textBit,
		gameObjectName: nameObject,
		update,
	};
}

export class Play extends Scene {
	constructor(public engine: Engine, public room: Room<GameState>) {
		super();

		const cam = new Camera();
		cam.position = vec3.fromValues(0, 10, 3);
		cam.lookAt = vec3.fromValues(0, 0, 0.5);

		this.camera = cam;
		this.pointLights[0].position = [0, 10, 3];
		this.pointLights[0].color = [0.6, 0.6, 0.6];

		this.pointLights[1].position = [0, 10, -3];
		this.pointLights[1].color = [0.5, 0.5, 0.5];

		const background = loadGLB(
			engine.gl,
			engine.programs.standard,
			levelBackground
		);
		this.addGameObject(background);

		const map = createMapGameObject(engine, room.state.map);

		this.addGameObject(map);

		const bombBadge = createBadge(engine, hudBombsImage, 5);
		const fireBadge = createBadge(engine, hudPowerImage, 52);

		this.addGameObject(bombBadge.gameObject);
		this.addGameObject(fireBadge.gameObject);

		// add players to the map
		let scoreboxY = 5;

		Object.keys(room.state.players).forEach((key) => {
			const player: Player = room.state.players[key];

			const playerModel = configurePlayerModel(engine, room.state.map, player);
			this.addGameObject(playerModel);

			const material = new StandardMaterialInstance();
			material.outlineColor = playerColors[player.index - 1];
			playerModel.getObjectById(
				"characterMedium",
				true
			).renderable.materialInstance = material;

			player.onChange = (changes) => {
				if (player.id === room.sessionId) {
					changes.forEach((change) => {
						if (change.field === "bombsAllowed") {
							bombBadge.update(change.value);
						} else if (change.field === "bombLength") {
							fireBadge.update(change.value);
						}
					});
				}

				changes.forEach((change) => {
					if (change.field === "score") {
						scorebox.update(change.value);
					}
				});
			};

			const scorebox = createPlayerScoreBox(
				engine,
				player.index,
				player.name,
				scoreboxY
			);
			this.addGameObject(scorebox.gameObjectScorebox);
			this.addGameObject(scorebox.gameObjectText);
			this.addGameObject(scorebox.gameObjectName);

			scoreboxY += 82 + 5;
		});

		for (let playerKey in this.room.state.players) {
			const player: Player = this.room.state.players[playerKey];
			player.onChange = (changes) => {
				const model = this.getObjectById(player.id);

				changes.forEach((change) => {
					if (change.field === "position") {
						const movement = model.findComponent<PlayerMovement>(
							PlayerMovementTag
						);
						if (movement) {
							const pos = mapToWorldCoordinates(
								room.state.map,
								player.position.x,
								player.position.y
							);
							movement.setTarget(model, pos[0], model.position[1], pos[2]);
						}
					} else if (change.field === "rotation") {
						model.rotateY(player.rotation);
					}
				});
			};
		}

		// bomb is dropped
		this.room.state.bombs.onAdd = (bomb, key) => {
			const model = createBomb(engine);
			model.position = mapToWorldCoordinates(
				room.state.map,
				bomb.position.x,
				bomb.position.y
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
		this.room.onMessage(
			"powerup_added",
			({ powerUp }: { powerUp: PowerUp }) => {
				const model = createPowerUp(engine, powerUp);
				model.position = mapToWorldCoordinates(
					this.room.state.map,
					powerUp.position.x,
					powerUp.position.y
				);

				this.addGameObject(model);
			}
		);

		this.room.onMessage(
			"powerup_collected",
			({ powerUp }: { powerUp: PowerUp }) => {
				const model = this.getObjectById(powerUp.id);
				model.removeFromParent();
			}
		);

		this.room.onMessage(
			"powerup_explode",
			({ powerUp }: { powerUp: PowerUp }) => {
				const model = this.getObjectById(powerUp.id);
				model.removeFromParent();
			}
		);

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

									const explosion = createBoxExplosion(engine);
									explosion.position = mapToWorldCoordinates(
										room.state.map,
										x + 0.5,
										y + 0.5
									);
									this.addGameObject(explosion);
								}
							}
						}
					}
				}
			});
		};

		this.room.onMessage("fire", (payload: FireDescription) => {
			const model = createFireBlock(this.engine, payload);

			model.position = vec3.fromValues(
				payload.position[0],
				0.5,
				payload.position[1]
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
