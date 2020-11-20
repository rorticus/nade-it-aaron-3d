import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Player } from "./Player";
import { MapInfo } from "./MapInfo";
import { Bomb } from "./Bomb";
import { PowerUp } from "./PowerUp";

export interface FireBlock {
	position: [number, number];
	timer: number;
	delay: number;
	stay: number;
	active: boolean;
	owner: string;
}

export class GameState extends Schema {
	@type(MapInfo) map: MapInfo;
	@type({ map: Player }) players = new MapSchema<Player>();
	@type("boolean") isStarted = false;
	@type({ map: Bomb }) bombs = new MapSchema<Bomb>();
	@type({ map: PowerUp }) powerUps = new MapSchema<PowerUp>();

	fireBlocks: FireBlock[] = [];
}
