import {Camera, Engine, loadGLTF, OrbitCamera, Scene} from "webgl-engine";
import { vec3 } from "gl-matrix";
import { createMapGameObject } from "./map";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const map = createMapGameObject(engine, {
	height: 5,
	spawns: [],
	width: 5,
	tiles: [
		{ key: "cliffCorner", rotation: Math.PI * 270 / 180 }, // row 0
		{ key: "cliffStraight", rotation: Math.PI * 180 / 180 },
		{ key: "cliffStraight", rotation: Math.PI * 180 / 180 },
		{ key: "cliffStraight", rotation: Math.PI * 180 / 180 },
		{ key: "cliffCorner", rotation: Math.PI * 180 / 180 },
		{ key: "cliffStraight", rotation: Math.PI * 270 / 180 }, // row 1
		{ key: "grass" },
		{ key: "grass" },
		{ key: "grass" },
		{ key: "cliffStraight", rotation: Math.PI * 90 / 180 },
		{ key: "cliffStraight", rotation: Math.PI * 270 / 180 }, // row 2
		{ key: "grass" },
		{ key: "grass" },
		{ key: "grass" },
		{ key: "cliffStraight", rotation: Math.PI * 90 / 180 },
		{ key: "cliffStraight", rotation: Math.PI * 270 / 180 }, // row 3
		{ key: "grass" },
		{ key: "grass" },
		{ key: "grass" },
		{ key: "cliffStraight", rotation: Math.PI * 90 / 180 },
		{ key: "cliffCorner" }, // row 4
		{ key: "cliffStraight" },
		{ key: "cliffStraight" },
		{ key: "cliffStraight" },
		{ key: "cliffCorner", rotation: Math.PI * 90 / 180 },
	],
});

const camera = new Camera();
camera.position = vec3.fromValues(0, 4, -5);

const scene = new Scene();
scene.camera = camera;
scene.pointLights[0].position = vec3.fromValues(0, 5, 5);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.addGameObject(map);

engine.scene = scene;
engine.start();
