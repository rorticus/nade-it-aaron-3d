import { GameState } from "../state/GameState";

const playerWidth = 0.2;
const playerHeight = 0.1;

export function resolveCollisions(
	x: number,
	y: number,
	dirX: number,
	dirY: number,
	gameState: GameState
): { x: number; y: number } {
	let left = x - playerWidth / 2;
	let right = x + playerWidth / 2;
	let top = y - playerHeight / 2;
	let bottom = y + playerHeight / 2;

	return {
		x,
		y,
	};
}
