import { Schema, type } from '@colyseus/schema';
import {Vector3} from "./primitives";

export class Player extends Schema {
    @type("string") id: string;
    @type(Vector3) position: Vector3;
    @type('float32') rotation: number;
    @type('boolean') isReady = false;
    @type('int8') index = 0;
    @type('boolean') isHost = false;
    @type('boolean') moving = false;
    @type('int32') score = 0;
    @type('int8') bombsAllowed: number = 1;
    @type('int8') bombLength: number = 1;

    bombDelay: number = 1;
    bombDelayElapsed: number = 0;
    bombsUsed: number = 0;
}
