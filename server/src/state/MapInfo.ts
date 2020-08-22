import {ArraySchema, Schema, type} from "@colyseus/schema";
import {MapPretty} from "./MapPretty";

export class MapInfo extends Schema {
    @type("string") map = '';
    @type([MapPretty]) mapPretties = new ArraySchema<MapPretty>();
    @type("int8") width: number;
    @type("int8") height: number;
}
