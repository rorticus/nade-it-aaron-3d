import {Schema, type} from "@colyseus/schema";
import {Vector2} from "./primitives";

export class PowerUp extends Schema {
    @type("string") id: string;
    @type("string") type: string;
    @type(Vector2) position: Vector2;
}
