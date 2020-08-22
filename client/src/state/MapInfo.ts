// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 0.5.40
// 

import { Schema, type, ArraySchema, MapSchema, DataChange } from "@colyseus/schema";
import { MapPretty } from "./MapPretty"

export class MapInfo extends Schema {
    @type("string") public map: string;
    @type([ MapPretty ]) public mapPretties: ArraySchema<MapPretty> = new ArraySchema<MapPretty>();
    @type("int8") public width: number;
    @type("int8") public height: number;
}
