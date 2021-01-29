import { GameComponentContext } from "webgl-engine/lib/interfaces";
import { vec3 } from "gl-matrix";
import { GameObject } from "webgl-engine";

export const PlayerMovementTag = "PlayerMovement";
const PlayerMoveTime = 0.5;

export class PlayerMovement {
	movingTimer = 0;
	tag = PlayerMovementTag;
	targetPos?: vec3;
	targetPosTime: number;
	originalPosition: vec3 = vec3.create();

	update(context: GameComponentContext, gameObject: GameObject) {
		if (this.targetPos) {
			if (this.movingTimer < this.targetPosTime) {
				this.movingTimer += context.deltaInSeconds;

				vec3.lerp(
					gameObject.position,
					this.originalPosition,
					this.targetPos,
					Math.min(this.movingTimer / this.targetPosTime, 1)
				);
			} else {
				this.movingTimer = 0;
				this.targetPos = undefined;
			}
		}
	}

	isMoving() {
		return this.targetPos !== undefined;
	}

	setTarget(gameObject: GameObject, x: number, y: number, z: number) {
		vec3.copy(this.originalPosition, gameObject.position);
		this.targetPos = vec3.fromValues(x, y, z);
		this.movingTimer = 0;
		this.targetPosTime = this.movingTimer + PlayerMoveTime;
	}
}
