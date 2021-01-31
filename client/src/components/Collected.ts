import { vec3 } from "gl-matrix";
import { GameObject } from "webgl-engine";
import { GameComponentContext } from "webgl-engine/lib/interfaces";

const collectionTimeDelay = 0.15;
const collectionTime = 0.25;

export const Collected = () => {
	let timer = 0;

	return (context: GameComponentContext, gameObject: GameObject) => {
		timer += context.deltaInSeconds;

		if (timer > collectionTimeDelay) {
			if (timer >= collectionTime + collectionTimeDelay) {
				gameObject.removeFromParent();
				return;
			}

			let s = 1 - Math.min((timer - collectionTimeDelay) / collectionTime, 1);
			gameObject.scale = vec3.fromValues(s, s, s);
		}
	};
};
