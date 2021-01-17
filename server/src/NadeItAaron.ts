import { Room, Client, ServerError } from "colyseus";
import { GameState } from "./state/GameState";
import { Player } from "./state/Player";
import {
	canTileExplode,
	generateMap,
	getTileScore,
	MAP_HEIGHT,
	MAP_WIDTH,
	setTileToGrass,
	tileAtPosition,
	tileCoordForPosition,
} from "./map/map";
import { Vector2 } from "./state/primitives";
import {
	getExplosionResults,
	resolveCollisions,
	resolvePowerUpCollisions,
	findClearDirectionForPlayer,
	getPlayerBounds,
	rectangleIntersection,
} from "./player/collisions";
import { Bomb } from "./state/Bomb";
import * as uuid from "uuid";
import { PowerUp } from "./state/PowerUp";
import * as scores from "./player/scores.json";
import { consumeToken, validateSession, validateToken } from "./server";

const FPS = 0.03333333;
const PLAYER_SPEED = 2;
const GAME_TIME = 1000 * 60 * 5; // 5 minutes

export interface MoveMessage {
	x: number;
	y: number;
}

function padZeros(x: string) {
	return x.length < 2 ? "0".repeat(2 - x.length) + x : x;
}

export class NadeItAaron extends Room<GameState> {
	sessionId: string;
	started = false;
	ended = false;

	async onAuth(client: Client, options: any, request: any) {
		if (options.sessionId !== this.sessionId) {
			throw new ServerError(400, "Bad session ID");
		}

		if (!validateSession(this.sessionId)) {
			throw new ServerError(400, "Bad session ID");
		}

		if (!options.tokenId || !validateToken(options.tokenId)) {
			throw new ServerError(400, "Invalid token ID");
		}

		if (this.started) {
			throw new ServerError(400, "GAME_STARTED");
		}

		if (Object.keys(this.state.players).length >= 4) {
			throw new ServerError(400, "SERVER_FULL");
		}

		return true;
	}

	onCreate(options: any) {
		this.sessionId = options.sessionId;
		const state = new GameState();
		state.map = generateMap();
		this.setState(state);

		this.onMessage("start", (client, message) => {
			this.broadcast("start");
			this.state.gameTimeLeft = GAME_TIME;
			this.started = true;
		});

		this.onMessage<MoveMessage>("move", (client, message) => {
			const player: Player = this.state.players[client.id];

			if (player.isDead || this.ended) {
				return;
			}

			let x = player.position.x;
			let y = player.position.y;

			if (message.x !== 0) {
				x += (message.x > 0 ? 1 : -1) * PLAYER_SPEED * FPS;
				player.rotation = ((90 * Math.PI) / 180) * (message.x > 0 ? 1 : -1);
			}

			if (message.y !== 0) {
				y += (message.y > 0 ? 1 : -1) * PLAYER_SPEED * FPS;
				player.rotation = ((180 * Math.PI) / 180) * (message.y > 0 ? 0 : -1);
			}

			const resolved = resolveCollisions(x, y, message.x, message.y, state.map);
			player.position.x = resolved.x;
			player.position.y = resolved.y;

			// power ups
			const powerUpList: PowerUp[] = [];
			for (let k in this.state.powerUps) {
				powerUpList.push(this.state.powerUps[k]);
			}

			const powerUps = resolvePowerUpCollisions(
				player.position.x,
				player.position.y,
				powerUpList
			);

			powerUps.forEach((powerUp) => {
				switch (powerUp.type) {
					case "bomb":
						player.bombsAllowed++;
						break;
					case "power":
						player.bombLength++;
						break;
				}

				this.broadcast("powerup_collected", { powerUp });
				delete this.state.powerUps[powerUp.id];
			});
		});

		this.onMessage("place_bomb", (client, message) => {
			const player: Player = this.state.players[client.id];

			if (
				!this.ended &&
				!player.isDead &&
				player.bombsUsed < player.bombsAllowed &&
				player.bombDelayElapsed >= player.bombDelay
			) {
				const bomb = new Bomb();
				bomb.id = uuid.v4();
				bomb.owner = client.id;

				bomb.position = new Vector2(
					Math.floor(player.position.x) + 0.5,
					Math.floor(player.position.y) + 0.5
				);
				bomb.explosionTimer = 0;
				bomb.explosionLength = player.bombLength;
				bomb.explosionDelay = 3;

				player.bombsUsed++;
				player.bombDelayElapsed = 0;

				this.state.bombs[bomb.id] = bomb;
			}
		});

		this.onMessage("ready", (client, message) => {
			const player: Player = this.state.players[client.id];
			player.isReady = true;
		});

		this.onMessage("not-ready", (client, message) => {
			const player: Player = this.state.players[client.id];
			player.isReady = false;
		});

		this.setSimulationInterval((t) => this.update(t), 33);
	}

	onJoin(client: Client, options: any) {
		console.log("client joined", client.id);

		const p = new Vector2(0, 0);

		const player = new Player();
		player.isReady = false;
		player.rotation = 0;
		player.position = p;
		player.name = consumeToken(options.tokenId);

		player.isHost = Object.keys(this.state.players).length === 0;

		const indices = [1, 2, 3, 4];
		for (let key in this.state.players) {
			const index = indices.indexOf(this.state.players[key].index);
			if (index >= 0) {
				indices.splice(index, 1);
			}
		}

		if (indices.length > 0) {
			player.index = indices[0];

			const spawn = this.state.map.spawns[indices[0] - 1];
			player.position.x = spawn[0];
			player.position.y = spawn[1];
		}

		player.id = client.id;
		this.state.players[client.id] = player;
	}

	onLeave(client: Client, consented: boolean) {
		if (this.started) {
			console.log("client left", client.id);

			this.killPlayer(client.id);
			// todo: say something embarassing in slack
		} else {
			delete this.state.players[client.id];
		}
	}

	killPlayer(id: string) {
		const player: Player = this.state.players[id];
		player.isDead = true;
		this.broadcast("player-death", {
			playerId: id,
			direction: findClearDirectionForPlayer(
				player.position.x,
				player.position.y,
				player.rotation,
				this.state.map
			),
		});
	}

	onDispose() {
		console.log("onDispose");
	}

	endGame() {
		if (!this.ended) {
			this.ended = true;
			console.log("game ended");
		}
	}

	update(deltaInMs: number) {
		const deltaInSeconds = deltaInMs / 1000;

		if (!this.started) {
			return;
		}

		this.state.gameTimeLeft -= deltaInMs;
		if (this.state.gameTimeLeft <= 0) {
			this.endGame();
		}

		const seconds = Math.max(
			Math.floor((this.state.gameTimeLeft / 1000) % 60),
			0
		);
		const hours = Math.max(Math.floor(this.state.gameTimeLeft / 1000 / 60), 0);
		this.state.gameTimer = `${hours} ${padZeros(String(seconds))}`;

		// update time since last bomb drop
		for (let id in this.state.players) {
			const player: Player = this.state.players[id];

			player.bombDelayElapsed += deltaInSeconds;
		}

		const removeFire = [];

		let map = this.state.map.map;
		for (let i = 0; i < this.state.fireBlocks.length; i++) {
			const fire = this.state.fireBlocks[i];
			fire.timer += deltaInSeconds;

			if (!fire.active && fire.timer > fire.delay) {
				fire.active = true;

				if (!this.ended) {
					// check powerup collisions
					for (let k in this.state.powerUps) {
						const powerUp: PowerUp = this.state.powerUps[k];

						const [px, py] = tileCoordForPosition(
							powerUp.position.x,
							powerUp.position.y
						);

						if (px === fire.position[0] && py === fire.position[1]) {
							this.state.players[fire.owner].score += scores.POWERUP_DESTROYED;
							this.broadcast("powerup_explode", { powerUp });
							delete this.state.powerUps[powerUp.id];
						}
					}

					// check for tile / powerup positions on this tile
					const tile = tileAtPosition(
						fire.position[0],
						fire.position[1],
						this.state.map.map
					);

					if (canTileExplode(tile)) {
						map = setTileToGrass(fire.position[0], fire.position[1], map);

						const score = getTileScore(tile);

						if (score) {
							this.state.players[fire.owner].score += score;
						}

						if (Math.random() * 100 < 15) {
							const powerUps = ["bomb", "power"];
							const powerUpType =
								powerUps[Math.floor(Math.random() * powerUps.length)];

							const p = new PowerUp();
							p.id = uuid.v4();
							p.type = powerUpType;
							p.position = new Vector2(
								fire.position[0] + 0.5,
								fire.position[1] + 0.5
							);

							this.state.powerUps[p.id] = p;

							this.broadcast("powerup_added", { powerUp: p });
						}
					}

					// check player collissions
					const fireRect = [
						fire.position[0],
						fire.position[1],
						fire.position[0] + 1,
						fire.position[1] + 1,
					] as [number, number, number, number];
					for (let playerId in this.state.players) {
						const player: Player = this.state.players[playerId];

						if (!player.isDead) {
							const playerRect = getPlayerBounds(
								player.position.x,
								player.position.y
							);

							if (rectangleIntersection(fireRect, playerRect)) {
								this.killPlayer(playerId);
							}
						}
					}
				}

				this.broadcast("fire", {
					position: fire.position,
					duration: fire.stay,
				});
			}

			if (fire.active) {
				// check for play collisions

				if (fire.timer > fire.stay + fire.delay) {
					// remove this one
					removeFire.push(fire);
				}
			}
		}
		this.state.map.map = map;

		removeFire.forEach((f) =>
			this.state.fireBlocks.splice(this.state.fireBlocks.indexOf(f), 1)
		);

		// count down bomb timers
		for (let key in this.state.bombs) {
			const bomb: Bomb = this.state.bombs[key];

			bomb.explosionTimer += deltaInSeconds;

			if (bomb.explosionTimer > bomb.explosionDelay) {
				const powerUpList: PowerUp[] = [];
				for (let k in this.state.powerUps) {
					powerUpList.push(this.state.powerUps[k]);
				}

				delete this.state.bombs[key];

				this.state.players[bomb.owner].bombsUsed--;

				const bombTilePos = tileCoordForPosition(
					bomb.position.x,
					bomb.position.y
				);

				const results = getExplosionResults(
					this.state.map,
					powerUpList,
					bombTilePos,
					bomb.explosionLength
				);

				// add fireblocks
				this.state.fireBlocks.push({
					active: false,
					delay: 0,
					position: bombTilePos,
					stay: 0.5,
					timer: 0,
					owner: bomb.owner,
				});

				for (let i = 1; i <= results.north; i++) {
					this.state.fireBlocks.push({
						active: false,
						delay: i * 0.1,
						position: [bombTilePos[0], bombTilePos[1] - i],
						stay: 0.5,
						timer: 0,
						owner: bomb.owner,
					});
				}

				for (let i = 1; i <= results.south; i++) {
					this.state.fireBlocks.push({
						active: false,
						delay: i * 0.1,
						position: [bombTilePos[0], bombTilePos[1] + i],
						stay: 0.5,
						timer: 0,
						owner: bomb.owner,
					});
				}

				for (let i = 1; i <= results.east; i++) {
					this.state.fireBlocks.push({
						active: false,
						delay: i * 0.1,
						position: [bombTilePos[0] + i, bombTilePos[1]],
						stay: 0.5,
						timer: 0,
						owner: bomb.owner,
					});
				}

				for (let i = 1; i <= results.west; i++) {
					this.state.fireBlocks.push({
						active: false,
						delay: i * 0.1,
						position: [bombTilePos[0] - i, bombTilePos[1]],
						stay: 0.5,
						timer: 0,
						owner: bomb.owner,
					});
				}
			}
		}
	}
}
