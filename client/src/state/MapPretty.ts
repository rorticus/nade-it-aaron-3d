// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 0.5.40
// 

import { Schema, type, ArraySchema, MapSchema, DataChange } from "@colyseus/schema";
import { Vector3 } from "./Vector3"

export class MapPretty extends Schema {
    @type("number") public type: number;
    @type(Vector3) public position: Vector3 = new Vector3();
}
