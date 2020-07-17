import { GameComponentContext } from "webgl-engine/lib/interfaces";
import { GameObject } from "webgl-engine/lib/GameObject";
import {
	screenSpaceToWorldSpace,
	worldSpaceToScreenSpace,
} from "webgl-engine/lib/helpers/screen";

export interface ButtonEvents {
	onClick?: () => void;
}

export const UIButton = (
	width: number,
	height: number,
	eventHandlers: ButtonEvents = {}
) => {
	let pressed = false;

	return (context: GameComponentContext, gameObject: GameObject) => {
		const mouse = context.engine.mouseService;

		let [x, y] = worldSpaceToScreenSpace(
			context.engine,
			gameObject.position[0],
			gameObject.position[1]
		);
		const [mouseX, mouseY] = [mouse.pointerX, mouse.pointerY];

		x -= width / 2;
		y -= height / 2;

		if (
			mouseX >= x &&
			mouseX <= x + width &&
			mouseY >= y &&
			mouseY <= y + height
		) {
			if (mouse.leftMouseDown && !pressed) {
				pressed = true;
			} else if (!mouse.leftMouseDown && pressed) {
				pressed = false;

				eventHandlers.onClick && eventHandlers.onClick();
			}
		} else if (pressed && !mouse.leftMouseDown) {
			pressed = false;
		}
	};
};

export default UIButton;
