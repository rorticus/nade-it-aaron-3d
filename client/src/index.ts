import {Camera, Engine, loadGLTF, OrbitCamera, Scene} from "webgl-engine";
import {vec3} from "gl-matrix";
import {createMapGameObject} from "./map";
import * as Colyseus from 'colyseus.js';

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "512");
canvas.setAttribute("height", "512");

document.body.appendChild(canvas);

const host = window.document.location.host.replace(/:.*/, '');
const client = new Colyseus.Client(location.protocol.replace("http", "ws") + "//" + host + (location.port ? ':' + location.port : ''));

const engine = new Engine(canvas);
engine.start();

client.joinOrCreate('nadeit', { sessionId: '123'}).then(room => {
    console.log('sessionId', room.sessionId);
});


