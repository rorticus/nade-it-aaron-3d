import {MapSchema, Schema, type} from "@colyseus/schema";
import {Player} from "./Player";
import {MapInfo} from "./MapInfo";

export class GameState extends Schema {
	@type(MapInfo) map: MapInfo;
	@type({ map: Player }) players = new MapSchema<Player>();
	@type("boolean") isStarted = false;
}
