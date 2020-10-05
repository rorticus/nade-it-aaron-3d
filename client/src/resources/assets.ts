export const backgroundImage = require("../resources/images/lobby-background.png")
	.default;
export const waitingForPlayers = require("../resources/images/waiting-for-players.png")
	.default;
export const startButton = require("../resources/images/start-button.png")
	.default;

export const character = require("../resources/models/character.glb");

export const bomb = require("../resources/models/bomb.glb");

export const explosion = require("../resources/models/explosion.glb");

export const hudBombs = require("./images/hud-bombs.png");
export const hudPower = require("./images/hud-power.png");

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

export async function loadAssets() {
	hudBombsImage = await loadImage(hudBombs.default);
	hudPowerImage = await loadImage(hudPower.default);
}
