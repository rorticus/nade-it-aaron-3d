import { vec3 } from "gl-matrix";
import { Camera, Engine, loadGLB, Scene } from "webgl-engine";
import { sprite, positionSpriteOnCanvas } from "webgl-engine/lib/webgl/utils";
import { getPlayerSkin, updatePlayerSkin } from "../players";
import { bomberman120, gameOver } from "../resources/assets";
import { drawTextOnCanvas, textDimensions } from "./helpers";

const titleWidth = 1004;
const titleHeight = 154;
const titleTop = 10;
const titleLeft = 10;

export class GameOver extends Scene {
	constructor(public engine: Engine, winnerName: string, winnerPlayerIndex: number) {
		super();

		const cam = new Camera();
		cam.position = vec3.fromValues(0, 5, 5);
		cam.lookAt = vec3.fromValues(0, 0, -2);

		this.camera = cam;
		this.pointLights[0].position = [0, 10, 3];
		this.pointLights[0].color = [0.6, 0.6, 0.6];

		this.pointLights[1].position = [0, 10, -3];
		this.pointLights[1].color = [0.5, 0.5, 0.5];

		const background = loadGLB(engine.gl, engine.programs.standard, gameOver);
		background.animation.initialState = "Root|mixamo.com|Layer0";
		updatePlayerSkin(engine, background, getPlayerSkin(winnerPlayerIndex));
		this.addGameObject(background);

		const title = `${winnerName.toUpperCase()} WINS!`;

		const dim = textDimensions(bomberman120, title);

		const c = document.createElement("canvas");
		c.width = dim.width;
		c.height = dim.height;

		const context2 = c.getContext("2d");
		drawTextOnCanvas(context2, title, bomberman120, 0, 0);
		const titleObject = sprite(engine, c);
		titleObject.renderPhase = "alpha";

		const aspect = dim.height / dim.width;

		if (dim.width > titleWidth) {
			let newWidth = titleWidth;
			let newHeight = newWidth * aspect;

			positionSpriteOnCanvas(
				engine,
				titleObject,
				titleLeft + titleWidth / 2 - newWidth / 2,
				titleTop + titleHeight / 2 - newHeight / 2,
				newWidth,
				newHeight
			);
		} else {
			positionSpriteOnCanvas(
				engine,
				titleObject,
				titleLeft + titleWidth / 2 - dim.width / 2,
				titleTop + titleHeight / 2 - dim.height / 2,
				dim.width,
				dim.height
			);
		}

        this.addGameObject(titleObject);
	}
}
