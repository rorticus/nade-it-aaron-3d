export const backgroundImage = require("../resources/images/title-screen.jpg")
	.default;
export const startButton = require("../resources/images/start-button.png")
	.default;

export const character = require("../resources/models/character.glb");

export const bomb = require("../resources/models/bomb.glb");

export const explosion = require("../resources/models/explosion.glb");

export const powerPowerUp = require("../resources/models/power_powerup.glb");
export const bombPowerUp = require("../resources/models/bomb_powerup.glb");

export const hudBombs = require("./images/hud-bombs.png");
export const hudPower = require("./images/hud-power.png");

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
