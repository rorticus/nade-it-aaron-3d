import {Engine, loadGLTF, OrbitCamera, Scene} from 'webgl-engine';
import {vec3} from "gl-matrix";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const engine = new Engine(canvas);

const mushroom = loadGLTF(
    engine.gl,
    engine.programs.standard,
    require("./resources/models/fox.json")
);

const orbitCamera = new OrbitCamera();

const scene = new Scene();
scene.camera = orbitCamera;
scene.pointLights[0].position = vec3.fromValues(0, 5, 5);
scene.pointLights[0].color = vec3.fromValues(1, 1, 1);

scene.addGameObject(mushroom);

engine.scene = scene;
engine.start();
