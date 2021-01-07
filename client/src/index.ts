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

const [, token] = document.location.href.split("?");

if (token) {
	const [name, value] = token.split("=");

	if (name === "t" && value) {
		const [sessionId, tokenId] = value.split(":");
		main(sessionId, tokenId);
	}
}

async function main(sessionId: string, tokenId: string) {
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
		.joinOrCreate<GameState>("nadeit", { sessionId, tokenId })
		.then((room) => {
			engine.scene = new Lobby(engine, room.sessionId, room);

			room.onMessage("start", (message) => {
				engine.scene = new Play(engine, room);
			});
		})
		.catch((e) => {
			if (e.message === "GAME_STARTED") {
				document.write(
					"<h1>This game has already started. You missed your chance! 😭</h1>"
				);
			} else {
				document.write(e.message);
			}
		});
}
