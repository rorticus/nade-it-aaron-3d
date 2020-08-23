import { Schema, type } from '@colyseus/schema';

export class Vector3 extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("number") z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();

        this.x = x;
        this.y = y;
        this.z = z;
    }
}
