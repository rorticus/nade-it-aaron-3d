import { Room, Client } from "colyseus";
import { GameState } from "./state/GameState";
import { Player } from "./state/Player";
import {
	generateMap,
	getTileScore,
	MAP_HEIGHT,
	MAP_WIDTH,
	setTileToGrass,
	tileAtPosition,
	tileCoordForPosition,
} from "./map/map";
import { Vector3 } from "./state/primitives";
import { getExplosionResults, resolveCollisions } from "./player/collisions";
import { Bomb } from "./state/Bomb";
import * as uuid from "uuid";
import { PowerUp } from "./state/PowerUp";

const FPS = 0.03333333;
const PLAYER_SPEED = 2;

export interface MoveMessage {
	x: number;
	y: number;
}

export class NadeItAaron extends Room<GameState> {
	onCreate(options: any) {
		const state = new GameState();
		state.map = generateMap();
		this.setState(state);

		this.onMessage("start", (client, message) => {
			this.broadcast("start");
		});

		this.onMessage<MoveMessage>("move", (client, message) => {
			const player = this.state.players[client.id];
			let x = player.position.x;
			let y = player.position.z;

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
			player.position.z = resolved.y;
		});

		this.onMessage("place_bomb", (client, message) => {
			const player: Player = this.state.players[client.id];

			if (
				player.bombsUsed < player.bombsAllowed &&
				player.bombDelayElapsed >= player.bombDelay
			) {
				const bomb = new Bomb();
				bomb.id = uuid.v4();
				bomb.owner = client.id;

				bomb.position = new Vector3(
					Math.floor(player.position.x) + 0.5,
					0,
					Math.floor(player.position.z) + 0.5
				);
				bomb.explosionTimer = 0;
				bomb.explosionLength = player.bombLength;
				bomb.explosionDelay = 3;

				player.bombsUsed++;
				player.bombDelayElapsed = 0;

				this.state.bombs[bomb.id] = bomb;
			}
		});

		this.setSimulationInterval((t) => this.update(t), 33);
	}

	onJoin(client: Client, options: any) {
		console.log("client joined", client.id);

		const p = new Vector3();
		p.x = 0;
		p.y = 0;
		p.z = 0;

		const v = new Vector3();
		v.x = 0;
		v.y = 0;
		v.z = 0;

		const player = new Player();
		player.isReady = true;
		player.rotation = 0;
		player.position = p;

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
			player.position.z = spawn[1];
		}

		player.id = client.id;
		this.state.players[client.id] = player;
	}

	onLeave(client: Client, consented: boolean) {
		console.log("client left", client.id);
		delete this.state.players[client.id];
	}

	onDispose() {
		console.log("onDispose");
	}

	update(deltaInMs: number) {
		const deltaInSeconds = deltaInMs / 1000;

		// update time since last bomb drop
		for (let id in this.state.players) {
			const player: Player = this.state.players[id];

			player.bombDelayElapsed += deltaInSeconds;
		}

		// count down bomb timers
		for (let key in this.state.bombs) {
			const bomb = this.state.bombs[key];

			bomb.explosionTimer += deltaInSeconds;

			if (bomb.explosionTimer > bomb.explosionDelay) {
				delete this.state.bombs[key];

				this.state.players[bomb.owner].bombsUsed--;

				const bombTilePos = tileCoordForPosition(
					bomb.position.x,
					bomb.position.z
				);

				const results = getExplosionResults(
					this.state.map,
					bombTilePos,
					bomb.explosionLength
				);

				let map = this.state.map.map;
				results.tiles.forEach((tilePos) => {
					const tile = tileAtPosition(tilePos[0], tilePos[1], map);
					const score = getTileScore(tile);

					if (score) {
						this.state.players[bomb.owner].score += score;
					}

					map = setTileToGrass(tilePos[0], tilePos[1], map);

					// chance of spawning a powerup
					if (Math.random() * 100 < 10) {
						const powerUps = ["bomb", "power"];
						const powerUpType =
							powerUps[Math.floor(Math.random() * powerUps.length)];

						const p = new PowerUp();
						p.id = uuid.v4();
						p.type = powerUpType;
						p.position = new Vector3(tilePos[0] + 0.5, tilePos[1] + 0.5);

						this.state.powerUps[p.id] = p;
					}
				});
				this.state.map.map = map;

				this.broadcast("explode", {
					origin: bombTilePos,
					north: results.north,
					east: results.east,
					south: results.south,
					west: results.west,
				});
			}
		}
	}
}
