// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 0.5.40
// 

import { Schema, type, ArraySchema, MapSchema, DataChange } from "@colyseus/schema";
import { Vector2 } from "./Vector2"

export class MapPretty extends Schema {
    @type("number") public type: number;
    @type(Vector2) public position: Vector2 = new Vector2();
}
