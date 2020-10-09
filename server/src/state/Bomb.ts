import {Schema, type} from "@colyseus/schema";
import {Vector2} from "./primitives";

export class Bomb extends Schema {
	@type("string") id: string;
	@type("string") owner: string;
	@type(Vector2) position: Vector2;

	explosionTimer = 0;
	explosionDelay = 1000;
	explosionLength = 1;
}
