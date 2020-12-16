import { Engine, GameObject, loadGLB } from "webgl-engine";
import { CharacterPlacement, FontDefinition } from "../interfaces";

export const backgroundImage = require("../resources/images/title-screen.jpg")
	.default;
export const startButton = require("../resources/images/start-button.png")
	.default;

export const character = require("../resources/models/character.glb");

export const bomb = require("../resources/models/bomb.glb");

export const explosion = require("../resources/models/explosion.glb");
export const explosionCube = require("./models/explosion_cube.glb");

export const levelBackground = require("./models/level-background.glb");

export const powerPowerUp = require("../resources/models/explosion_powerup.glb");
export const bombPowerUp = require("../resources/models/bomb_powerup.glb");

export const boxExplosion = require('../resources/models/box-explosion-single.glb');

export const hudBombs = require("./images/badge-bomb.png");
export const hudPower = require("./images/badge-fire.png");

export const logo = require("./images/logo.png").default;
export const instructions = require("./images/instructions.png").default;
export const emptySlot = require("./images/empty-slot.png").default;
export const filledSlot = require("./images/filled-slot.png").default;
export const partyLeader = require("./images/party-leader.png").default;
export const playerPreviews = [
	require("./images/player-skin-1-preview.png").default,
	require("./images/player-skin-2-preview.png").default,
	require("./images/player-skin-3-preview.png").default,
	require("./images/player-skin-4-preview.png").default,
];
export const waitingForPlayers = require("./images/waiting-for-players.png")
	.default;
export const notReady = require("./images/not-ready.png").default;
export const ready = require("./images/ready.png").default;
export const readyBadge = require("./images/ready-badge.png").default;
export const scoreboxPlayer1 = require("./images/scorebox-player-1.png")
	.default;
export const scoreboxPlayer2 = require("./images/scorebox-player-2.png")
	.default;
export const scoreboxPlayer3 = require("./images/scorebox-player-3.png")
	.default;
export const scoreboxPlayer4 = require("./images/scorebox-player-4.png")
	.default;

const bomberman17Image = require("./bomberman17.png").default;
const bomberman17Font = require("./bomberman17.fnt");
const bomberman30Image = require("./bomberman30.png").default;
const bomberman30Font = require("./bomberman17.fnt");
const bomberman30BlackImage = require("./bomberman30black.png").default;
const bomberman30BlackFont = require("./bomberman30black.fnt");
const bomberman28Image = require("./bomberman28.png").default;
const bomberman28Font = require("./bomberman28.fnt");

export let hudBombsImage: HTMLImageElement;
export let hudPowerImage: HTMLImageElement;

export async function loadImage(url: string) {
	return new Promise<HTMLImageElement>((resolve) => {
		const img = new Image();
		img.onload = () => {
			resolve(img);
		};
		img.src = url;
	});
}

export let bomberman17: FontDefinition;
export let bomberman30: FontDefinition;
export let bomberman30Black: FontDefinition;
export let bomberman28: FontDefinition;

export let explosionTemplate!: GameObject;

export async function loadAssets(engine: Engine) {
	hudBombsImage = await loadImage(hudBombs.default);
	hudPowerImage = await loadImage(hudPower.default);

	bomberman17 = await loadFont(bomberman17Image, bomberman17Font);
	bomberman30 = await loadFont(bomberman30Image, bomberman30Font);
	bomberman30Black = await loadFont(
		bomberman30BlackImage,
		bomberman30BlackFont
	);
	bomberman28 = await loadFont(bomberman28Image, bomberman28Font);

	explosionTemplate = loadGLB(
		engine.gl,
		engine.programs.standard,
		explosionCube
	);
}

export async function loadFont(
	imageName: string,
	definition: string
): Promise<FontDefinition> {
	const image = await loadImage(imageName);

	const characterInfo: Record<string, CharacterPlacement> = {};

	definition.split("\n").forEach((line) => {
		if (line.indexOf("char ") === 0) {
			const lineParts = line.split(" ").reduce((res, part) => {
				const [name, ...rest] = part.split("=");

				return {
					...res,
					[name]: parseInt(rest.join("="), 10),
				};
			}, {} as Record<string, number>);

			characterInfo[String.fromCharCode(lineParts["id"])] = {
				x: lineParts["x"] || 0,
				y: lineParts["y"] || 0,
				width: lineParts["width"] || 0,
				height: lineParts["height"] || 0,
				xAdvance: lineParts["xadvance"] || 0,
				xOffset: lineParts["xoffset"] || 0,
				yOffset: lineParts["yoffset"] || 0,
			};
		}
	});

	return {
		imageName,
		definition,
		image,
		characterInfo,
	};
}
