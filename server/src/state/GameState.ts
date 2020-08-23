import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Player } from "./Player";
import { MapInfo } from "./MapInfo";
import { Bomb } from "./Bomb";

export class GameState extends Schema {
	@type(MapInfo) map: MapInfo;
	@type({ map: Player }) players = new MapSchema<Player>();
	@type("boolean") isStarted = false;
	@type([Bomb]) bombs = new ArraySchema<Bomb>();
}
