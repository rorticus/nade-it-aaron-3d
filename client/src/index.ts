import { Engine } from "webgl-engine";
import * as Colyseus from "colyseus.js";
import Lobby from "./scenes/Lobby";
import { GameState } from "./state/GameState";
import { Play } from "./scenes/Play";
import { loadAssets } from "./resources/assets";

const canvas = document.createElement("canvas");
canvas.setAttribute("width", "1024");
canvas.setAttribute("height", "768");

document.body.appendChild(canvas);

const debug = document.createElement("div");
document.body.appendChild(debug);

const host = window.document.location.host.replace(/:.*/, "");
const client = new Colyseus.Client(
	location.protocol.replace("http", "ws") +
		"//" +
		host +
		(location.port ? ":" + location.port : "")
);

async function main() {
	const engine = new Engine(canvas);
	engine.backgroundColor = [44 / 255, 216 / 255, 184 / 255];
	engine.fpsUpdated = (fps) => {
		debug.innerHTML = `${fps}`;
	};
	await loadAssets(engine);
	engine.start();

	document.body.addEventListener("click", function soundResume() {
		engine.soundService.resume();
		document.body.removeEventListener("click", soundResume);
	});

	client
		.joinOrCreate<GameState>("nadeit", { sessionId: "123", name: "Unnamed" })
		.then((room) => {
			console.log("sessionId", room.sessionId);

			engine.scene = new Lobby(engine, room.sessionId, room);

			room.onMessage("start", (message) => {
				engine.scene = new Play(engine, room);
			});
		}).catch(e => {
			if(e.message === 'GAME_STARTED') {
				document.write('<h1>This game has already started. You missed your chance! 😭</h1>');
			}
		});
}

main();
