import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";
import { Player } from "./Player";

export class GameState extends Schema {
	@type(["uint8"]) map = new ArraySchema<"uint8">();
	@type({ map: Player }) players = new MapSchema<Player>();
	@type("boolean") isStarted = false;
}
