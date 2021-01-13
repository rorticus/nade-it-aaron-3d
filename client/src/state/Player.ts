// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 0.5.40
// 

import { Schema, type, ArraySchema, MapSchema, DataChange } from "@colyseus/schema";
import { Vector2 } from "./Vector2"

export class Player extends Schema {
    @type("string") public id: string;
    @type(Vector2) public position: Vector2 = new Vector2();
    @type("string") public name: string;
    @type("float32") public rotation: number;
    @type("boolean") public isReady: boolean;
    @type("int8") public index: number;
    @type("boolean") public isHost: boolean;
    @type("boolean") public moving: boolean;
    @type("int32") public score: number;
    @type("int8") public bombsAllowed: number;
    @type("int8") public bombLength: number;
    @type("boolean") public isDead: boolean;
}
