import { Schema, type } from "@colyseus/schema";
import { Vector2 } from "./primitives";

export class Player extends Schema {
	@type("string") id: string;
	@type(Vector2) position: Vector2;
	@type("string") name: string;
	@type("float32") rotation: number;
	@type("boolean") isReady = false;
	@type("int8") index = 0;
	@type("boolean") isHost = false;
	@type("int32") score = 0;
	@type("int8") bombsAllowed: number = 1;
	@type("int8") bombLength: number = 1;
	@type("boolean") isDead = false;

	bombDelay: number = 1;
	bombDelayElapsed: number = 0;
	bombsUsed: number = 0;

	leftDown = false;
	rightDown = false;
	upDown = false;
	downDown = false;
	moveTimer = 0;
	moving = false;
}
