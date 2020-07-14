// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 0.5.40
// 

import { Schema, type, ArraySchema, MapSchema, DataChange } from "@colyseus/schema";


export class Vector3 extends Schema {
    @type("number") public x: number;
    @type("number") public y: number;
    @type("number") public z: number;
}
