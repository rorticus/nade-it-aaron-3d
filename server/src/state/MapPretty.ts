import { Schema, type } from '@colyseus/schema';
import {Vector3} from "./primitives";

export class MapPretty extends Schema {
    @type("number") type: number;
    @type(Vector3) position: Vector3;
}
