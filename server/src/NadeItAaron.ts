import { Room, Client } from "colyseus";
import { GameState } from "./state/GameState";
import { Player } from "./state/Player";
import { generateMap, MAP_HEIGHT, MAP_WIDTH } from "./map/map";
import { Vector3 } from "./state/primitives";

const FPS = 0.33;
const PLAYER_SPEED = 0.25;

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

			if (message.x !== 0) {
				player.position.x += (message.x > 0 ? 1 : -1) * PLAYER_SPEED * FPS;
				player.rotation = ((90 * Math.PI) / 180) * (message.x > 0 ? 1 : -1);
			}

			if (message.y !== 0) {
				player.position.z += (message.y > 0 ? 1 : -1) * PLAYER_SPEED * FPS;
				player.rotation = ((180 * Math.PI) / 180) * (message.y > 0 ? 0 : -1);
			}

			player.moving = false;
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

		if (Object.keys(this.state.players).length === 0) {
			player.isHost = true;
		} else {
			player.isHost = false;
		}

		const indices = [1, 2, 3, 4];
		for (let key in this.state.players) {
			const index = indices.indexOf(this.state.players[key].index);
			if (index >= 0) {
				indices.splice(index, 1);
			}
		}

		if (indices.length > 0) {
			player.index = indices[0];
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
