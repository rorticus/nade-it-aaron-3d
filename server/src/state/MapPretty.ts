import { Schema, type } from '@colyseus/schema';
import {Vector2} from "./primitives";

export class MapPretty extends Schema {
    @type("number") type: number;
    @type(Vector2) position: Vector2;
}
