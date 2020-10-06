import {Schema, type} from "@colyseus/schema";
import {Vector3} from "./primitives";

export class PowerUp extends Schema {
    @type("string") id: string;
    @type("string") type: string;
    @type(Vector3) position: Vector3;
}
