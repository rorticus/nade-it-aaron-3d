import { Room } from "colyseus.js";
import { vec3 } from "gl-matrix";
import { Engine, GameObject, LightType, Scene } from "webgl-engine";
import {
	positionSpriteOnCanvas,
	sprite,
	updateSpriteFromSource,
} from "webgl-engine/lib/webgl/utils";
import { UIButton } from "../components/UIButton";
import {
	backgroundImage,
	emptySlot,
	filledSlot,
	instructions,
	logo,
	notReady,
	partyLeader,
	playerPreviews,
	ready,
	readyBadge,
	startButton,
	waitingForPlayers,
} from "../resources/assets";
import { GameState } from "../state/GameState";
import { Player } from "../state/Player";

const slotCoordinates = [
	[20, 20],
	[754, 20],
	[20, 579],
	[754, 579],
];

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

		const logoSprite = sprite(engine, logo);
		positionSpriteOnCanvas(engine, logoSprite, 230, 4, 563, 463);
		this.addGameObject(logoSprite, 1);

		const instructionsSprite = sprite(engine, instructions);
		positionSpriteOnCanvas(engine, instructionsSprite, 142, 407, 839, 185);
		this.addGameObject(instructionsSprite, 2);

		const waiting = sprite(engine, waitingForPlayers);
		positionSpriteOnCanvas(engine, waiting, 341, 619, 342, 40);
		this.addGameObject(waiting, 2);

		const players: GameObject[] = [];
		for (let i = 0; i < 4; i++) {
			const player = sprite(engine, emptySlot);
			positionSpriteOnCanvas(
				engine,
				player,
				slotCoordinates[i][0],
				slotCoordinates[i][1],
				250,
				169
			);
			this.addGameObject(player, 3);

			players.push(player);
		}

		room.state.players.onAdd = (player, key) => {
			const character = this.getObjectById(`character${player.index}`);

			updateSpriteFromSource(engine, players[player.index - 1], filledSlot);

			const preview = sprite(engine, playerPreviews[player.index - 1]);
			positionSpriteOnCanvas(
				engine,
				preview,
				slotCoordinates[player.index - 1][0] + 79,
				slotCoordinates[player.index - 1][1] + 8,
				80,
				122
			);
			preview.id = `preview-${player.id}`;

			this.addGameObject(preview, 4);

			if (player.isHost) {
				const hostSprite = sprite(engine, partyLeader);
				hostSprite.id = "party-leader";
				positionSpriteOnCanvas(
					engine,
					hostSprite,
					slotCoordinates[player.index - 1][0] - 8,
					slotCoordinates[player.index - 1][1] - 15,
					266,
					44
				);
				this.addGameObject(hostSprite, 5);

				if (player.id === clientId) {
					// add start button
					const start = sprite(engine, startButton);
					start.id = "startButton";
					positionSpriteOnCanvas(engine, start, 341, 664, 342, 84);
					start.addComponent(
						UIButton(342, 84, {
							onClick() {
								room.send("start");
							},
						})
					);
					this.addGameObject(start, 2);
				}
			} else {
				const ready = sprite(engine, notReady);
				ready.id = "readyButton";
				positionSpriteOnCanvas(engine, ready, 341, 664, 342, 84);
				ready.addComponent(
					UIButton(342, 84, {
						onClick() {
							const p: Player = room.state.players[player.id];

							if (p.isReady) {
								room.send("not-ready");
							} else {
								room.send("ready");
							}
						},
					})
				);
				this.addGameObject(ready, 2);
			}
		};

		room.state.players.onChange = (player, key) => {
			if (player.id === clientId) {
				const readyButton = this.getObjectById("readyButton");
				if (readyButton) {
					if (player.isReady) {
						updateSpriteFromSource(engine, readyButton, ready);
					} else {
						updateSpriteFromSource(engine, readyButton, notReady);
					}
				}
			}

			if (player.isReady) {
				const readyOverlay = sprite(engine, readyBadge);
				positionSpriteOnCanvas(
					engine,
					readyOverlay,
					slotCoordinates[player.index - 1][0] - 8,
					slotCoordinates[player.index - 1][1] - 15,
					266,
					44
				);
				readyOverlay.id = `ready-badge-${player.id}`;
				this.addGameObject(readyOverlay, 5);
			} else {
				this.getObjectById(`ready-badge-${player.id}`)?.removeFromParent();
			}
		};

		room.state.players.onRemove = (player, key) => {
			updateSpriteFromSource(engine, players[player.index - 1], emptySlot);
			this.getObjectById(`preview-${player.id}`)?.removeFromParent();
			this.getObjectById(`ready-badge-${player.id}`)?.removeFromParent();

			if (player.isHost) {
				this.getObjectById("host-sprite")?.removeFromParent();
			}
		};
	}
}

export default Lobby;
