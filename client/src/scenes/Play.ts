import { Engine, Scene } from "webgl-engine";
import { Room } from "colyseus.js";
import { GameState } from "../state/GameState";
import { StartGame } from "../interfaces";

export class Play extends Scene {
	constructor(
		public engine: Engine,
		startGame: StartGame,
		room: Room<GameState>
	) {
		super();

		// todo: generate the map
	}
}
