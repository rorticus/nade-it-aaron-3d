// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 0.5.40
// 

import { Schema, type, ArraySchema, MapSchema, DataChange } from "@colyseus/schema";
import { Vector3 } from "./Vector3"

export class Player extends Schema {
    @type("string") public id: string;
    @type(Vector3) public position: Vector3 = new Vector3();
    @type("float32") public rotation: number;
    @type("boolean") public isReady: boolean;
    @type("int8") public index: number;
    @type("boolean") public isHost: boolean;
    @type(Vector3) public velocity: Vector3 = new Vector3();
    @type("boolean") public left: boolean;
    @type("boolean") public right: boolean;
    @type("boolean") public up: boolean;
    @type("boolean") public down: boolean;
}
