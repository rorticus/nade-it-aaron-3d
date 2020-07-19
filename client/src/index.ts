import { Engine } from "webgl-engine";
import * as Colyseus from "colyseus.js";
import Lobby from "./scenes/Lobby";
import { GameState } from "./state/GameState";
import {Play} from "./scenes/Play";
import {StartGame} from "./interfaces";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "1024");
canvas.setAttribute("height", "768");

document.body.appendChild(canvas);

const host = window.document.location.host.replace(/:.*/, "");
const client = new Colyseus.Client(
	location.protocol.replace("http", "ws") +
		"//" +
		host +
		(location.port ? ":" + location.port : "")
);

const engine = new Engine(canvas);
engine.start();

client
	.joinOrCreate<GameState>("nadeit", { sessionId: "123" })
	.then((room) => {
		console.log("sessionId", room.sessionId);

		engine.scene = new Lobby(engine, room.sessionId, room);

		room.onMessage<StartGame>("start", (message) => {
			engine.scene = new Play(engine, message, room);
		});
	});
