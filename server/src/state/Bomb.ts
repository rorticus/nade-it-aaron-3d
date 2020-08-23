import {Schema, type} from "@colyseus/schema";
import {Vector3} from "./primitives";

export class Bomb extends Schema {
	@type("string") id: string;
	@type("string") owner: string;
	@type(Vector3) position: Vector3;

	explosionTimer = 0;
	explosionDelay = 1000;
	explosionLength = 1;
}
