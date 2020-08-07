import { Room, Client } from "colyseus";
import { GameState } from "./state/GameState";
import { Player } from "./state/Player";
import { generateMap, MAP_HEIGHT, MAP_WIDTH } from "./map/map";
import { Vector3 } from "./state/primitives";
import { resolveCollisions } from "./player/collisions";

const FPS = 0.03333333;
const PLAYER_SPEED = 1.5;

export interface MoveMessage {
	x: number;
	y: number;
}

export class NadeItAaron extends Room<GameState> {
	onCreate(options: any) {
		this.setState(new GameState());

		this.onMessage("start", (client, message) => {
			const map = generateMap();
			this.broadcast("start", {
				mapWidth: MAP_WIDTH,
				mapHeight: MAP_HEIGHT,
				map,
			});
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

			const resolved = resolveCollisions(
				x,
				y,
				message.x,
				message.y,
				this.state
			);
			player.position.x = resolved.x;
			player.position.z = resolved.y;
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

			if (player.index === 1) {
				// upper right
				player.position.x = MAP_WIDTH - 0.5;
				player.position.z = 0.5;
			} else if (player.index === 2) {
				// upper left
				player.position.x = 0.5;
				player.position.z = 0.5;
			} else if (player.index === 3) {
				// lower right
				player.position.x = MAP_WIDTH - 0.5;
				player.position.z = MAP_HEIGHT - 0.5;
			} else if (player.index === 4) {
				// lower left
				player.position.x = 0.5;
				player.position.z = MAP_HEIGHT - 0.5;
			}
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
	}
}
