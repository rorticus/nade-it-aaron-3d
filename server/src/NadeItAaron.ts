import { Room, Client } from "colyseus";
import { GameState } from "./state/GameState";
import { Player } from "./state/Player";
import { generateMap, MAP_HEIGHT, MAP_WIDTH } from "./map/map";
import { Vector3 } from "./state/primitives";

const PLAYER_SPEED = 3;
const FRICTION = 0.75;

export class NadeItAaron extends Room<GameState> {
	private left = false;
	private right = false;
	private up = false;
	private down = false;

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

		this.onMessage("leftDown", (client) => {
			this.state.players[client.id].left = true;
		});
		this.onMessage("leftUp", (client) => {
			this.state.players[client.id].left = false;
		});

		this.onMessage("rightDown", (client) => {
			this.state.players[client.id].right = true;
		});
		this.onMessage("rightUp", (client) => {
			this.state.players[client.id].right = false;
		});

		this.onMessage("upDown", (client) => {
			this.state.players[client.id].up = true;
		});
		this.onMessage("upUp", (client) => {
			this.state.players[client.id].up = false;
		});

		this.onMessage("downDown", (client) => {
			this.state.players[client.id].down = true;
		});
		this.onMessage("downUp", (client) => {
			this.state.players[client.id].down = false;
		});
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
		player.velocity = v;

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

		this.setSimulationInterval((t) => this.update(t));
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

		// move players
		Object.keys(this.state.players).forEach((k) => {
			const p = this.state.players[k];
			let r = 0;
			let rChanged = false;

			if (p.up) {
				p.position.z -= PLAYER_SPEED * deltaInSeconds;
				r -= (180 * Math.PI) / 180;
				rChanged = true;
			}
			if (p.down) {
				p.position.z += PLAYER_SPEED * deltaInSeconds;
				r += 0;
				rChanged = true;
			}
			if (p.left) {
				p.position.x -= PLAYER_SPEED * deltaInSeconds;
				r -= (90 * Math.PI) / 180;
				rChanged = true;
			}
			if (p.right) {
				p.position.x += PLAYER_SPEED * deltaInSeconds;
				r += (90 * Math.PI) / 180;
				rChanged = true;
			}

			if (rChanged) {
				p.rotation = r;
			}
		});
	}
}
