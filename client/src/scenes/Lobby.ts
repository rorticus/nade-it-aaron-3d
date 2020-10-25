import { Engine, LightType, loadGLB, Scene } from "webgl-engine";
import { positionSpriteOnCanvas, sprite } from "webgl-engine/lib/webgl/utils";
import { vec3, vec4 } from "gl-matrix";
import { GameState } from "../state/GameState";
import { getPlayerSkin, removePlayerSkin, updatePlayerSkin } from "../players";
import { UIButton } from "../components/UIButton";
import { Room } from "colyseus.js";
import {backgroundImage, character, startButton, waitingForPlayers} from "../resources/assets";

function loadCharacter(
	engine: Engine,
	position: [number, number, number],
	rotation: number
) {
	const characterModel = loadGLB(
		engine.gl,
		engine.programs.standard,
		character
	);
	characterModel.position = position;
	characterModel.animation.transitionTo("Idle", 0);
	characterModel.rotateY(rotation);
	characterModel.getObjectById(
		"characterMedium",
		true
	).renderable.renderables[0].uniforms["u_color"] = vec4.fromValues(0, 0, 0, 1);

	return characterModel;
}

export class Lobby extends Scene {
	constructor(public engine: Engine, clientId: string, room: Room<GameState>) {
		super();

		this.camera.position = vec3.fromValues(0, 0, 10);
		this.pointLights = [
			{
				type: LightType.Point,
				position: [0, 0, 10],
				color: [1, 1, 1],
			},
		];

		const background = sprite(engine, backgroundImage);
		positionSpriteOnCanvas(engine, background, 0, 0, 1024, 768);
		this.addGameObject(background);

		const waiting = sprite(engine, waitingForPlayers);
		positionSpriteOnCanvas(engine, waiting, 369, 324, 286, 121);
		this.addGameObject(waiting, 1);

		const character1 = loadCharacter(engine, [6, 1, 0], (-Math.PI * 45) / 180);
		character1.id = "character1";
		this.addGameObject(character1, 2);

		const character2 = loadCharacter(engine, [-6, 1, 0], (Math.PI * 45) / 180);
		character2.id = "character2";
		this.addGameObject(character2, 2);

		const character3 = loadCharacter(
			engine,
			[6, -4.5, 0],
			(-Math.PI * 45) / 180
		);
		character3.id = "character3";
		this.addGameObject(character3, 2);

		const character4 = loadCharacter(
			engine,
			[-6, -4.5, 0],
			(Math.PI * 45) / 180
		);
		character4.id = "character4";
		this.addGameObject(character4, 2);

		room.state.players.onAdd = (player, key) => {
			const character = this.getObjectById(`character${player.index}`);

			if (player.isReady) {
				updatePlayerSkin(engine, character, getPlayerSkin(player.index));
			} else {
				removePlayerSkin(engine, character);
			}

			if (player.id === clientId && player.isHost) {
				// add start button
				const start = sprite(engine, startButton);
				start.id = "startButton";
				positionSpriteOnCanvas(engine, start, 344, 568, 335, 177);
				start.addComponent(
					UIButton(335, 177, {
						onClick() {
							room.send('start');
						},
					})
				);
				this.addGameObject(start, 1);
			}
		};

		room.state.players.onChange = (player, key) => {
			const character = this.getObjectById(`character${player.index}`);

			if (player.isReady) {
				updatePlayerSkin(engine, character, getPlayerSkin(player.index));
			} else {
				removePlayerSkin(engine, character);
			}
		};

		room.state.players.onRemove = (player, key) => {
			const character = this.getObjectById(`character${player.index}`);

			removePlayerSkin(engine, character);
		};
	}
}

export default Lobby;
