// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 0.5.40
// 

import { Schema, type, ArraySchema, MapSchema, DataChange } from "@colyseus/schema";
import { MapInfo } from "./MapInfo"
import { Player } from "./Player"

export class GameState extends Schema {
    @type(MapInfo) public map: MapInfo = new MapInfo();
    @type({ map: Player }) public players: MapSchema<Player> = new MapSchema<Player>();
    @type("boolean") public isStarted: boolean;
}
