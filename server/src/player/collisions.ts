import {
	canTileExplode,
	isTileSolid,
	tileAtPosition,
	tileCoordForPosition,
} from "../map/map";
import { MapInfo } from "../state/MapInfo";
import { PowerUp } from "../state/PowerUp";

const playerWidth = 0.2;
const playerHeight = 0.1;

const powerUpWidth = 0.75;
const powerUpHeight = 0.75;

export function getPlayerBounds(
	x: number,
	y: number
): [number, number, number, number] {
	return [x - playerWidth / 2, y - playerHeight, x + playerWidth / 2, y];
}

export function getPowerUpBounds(
	x: number,
	y: number
): [number, number, number, number] {
	return [
		x - powerUpWidth / 2,
		y - powerUpHeight / 2,
		x + powerUpWidth / 2,
		y + powerUpHeight / 2,
	];
}

export function rectangleIntersection(
	r1: [number, number, number, number],
	r2: [number, number, number, number]
) {
	const leftX = Math.max(r1[0], r2[0]);
	const rightX = Math.min(r1[2], r2[2]);
	const topY = Math.max(r1[1], r2[1]);
	const bottomY = Math.min(r1[3], r2[3]);

	if (leftX < rightX && topY < bottomY) {
		return [leftX, topY, rightX, bottomY];
	}

	return null;
}

export function tilesOnHorizontalLine(x1: number, x2: number, y: number) {
	const results = [];

	for (let x = x1; x < x2; x += 1) {
		results.push(tileCoordForPosition(x, y));
	}
	results.push(tileCoordForPosition(x2, y));

	return results;
}

export function resolvePowerUpCollisions(
	x: number,
	y: number,
	powerUps: PowerUp[]
) {
	const playerBounds = getPlayerBounds(x, y);
	const results: PowerUp[] = [];

	powerUps.forEach((powerUp) => {
		const powerUpBounds = getPowerUpBounds(
			powerUp.position.x,
			powerUp.position.y
		);

		if (rectangleIntersection(playerBounds, powerUpBounds)) {
			results.push(powerUp);
		}
	});

	return results;
}

export interface ExplosionResults {
	origin: [number, number];
	north: number;
	east: number;
	south: number;
	west: number;
	tiles: [number, number][];
	powerUps: PowerUp[];
}

export function getExplosionResults(
	map: MapInfo,
	powerUps: PowerUp[],
	origin: [number, number],
	size: number
): ExplosionResults {
	function firstCollidingTile(
		ox: number,
		oy: number,
		dx: number,
		dy: number,
		maxSize: number
	) {
		for (let i = 0, y = oy, x = ox; i <= maxSize; i++, y += dy, x += dx) {
			x = Math.min(map.width - 1, Math.max(0, x));
			y = Math.min(map.height - 1, Math.max(0, y));

			const tile = tileAtPosition(x, y, map.map);
			if (isTileSolid(tile)) {
				if (canTileExplode(tile)) {
					return {
						pos: [x, y] as [number, number],
						steps: i,
						tile,
					};
				} else {
					return {
						pos: [x, y] as [number, number],
						steps: i - 1,
						tile: null,
					};
				}
			}
		}

		return undefined;
	}

	function findCollidedPowerUps(
		ox: number,
		oy: number,
		dx: number,
		dy: number,
		maxSize: number,
		powerUps: PowerUp[]
	) {
		const found: PowerUp[] = [];

		for (let i = 0, y = oy, x = ox; i <= maxSize; i++, y += dy, x += dx) {
			x = Math.min(map.width - 1, Math.max(0, x));
			y = Math.min(map.height - 1, Math.max(0, y));

			powerUps.forEach((powerUp) => {
				const [px, py] = tileCoordForPosition(
					powerUp.position.x,
					powerUp.position.y
				);

				if (px === x && py === y) {
					found.push(powerUp);
				}
			});
		}

		return found;
	}

	let northTile = firstCollidingTile(origin[0], origin[1], 0, -1, size);
	let eastTile = firstCollidingTile(origin[0], origin[1], 1, 0, size);
	let southTile = firstCollidingTile(origin[0], origin[1], 0, 1, size);
	let westTile = firstCollidingTile(origin[0], origin[1], -1, 0, size);

	const northSize = northTile ? northTile.steps : size;
	const eastSize = eastTile ? eastTile.steps : size;
	const southSize = southTile ? southTile.steps : size;
	const westSize = westTile ? westTile.steps : size;

	const collidedPowerUps = [
		...findCollidedPowerUps(origin[0], origin[1], 0, -1, northSize, powerUps),
		...findCollidedPowerUps(origin[0], origin[1], 1, 0, eastSize, powerUps),
		...findCollidedPowerUps(origin[0], origin[1], 0, 1, southSize, powerUps),
		...findCollidedPowerUps(origin[0], origin[1], -1, 0, westSize, powerUps),
	].filter((p, i, c) => c.indexOf(p) === i);

	return {
		origin,
		north: northSize,
		east: eastSize,
		south: southSize,
		west: westSize,
		tiles: [
			northTile && northTile.tile ? northTile.pos : null,
			eastTile && eastTile.tile ? eastTile.pos : null,
			southTile && southTile.tile ? southTile.pos : null,
			westTile && westTile.tile ? westTile.pos : null,
		].filter((t) => t),
		powerUps: collidedPowerUps,
	};
}

export function findClearDirectionForPlayer(
	x: number,
	y: number,
	rotation: number,
	map: MapInfo
) {
	const radians90 = (90 * Math.PI) / 180;

	let direction =
		Math.floor((rotation + radians90 / 2) / radians90) * radians90;
	let tries = 0;

	const possibilities: number[] = [];

	while (tries < 4) {
		tries++;

		// is this spot free?
		const tx = Math.floor(x + Math.cos(direction));
		const ty = Math.floor(y - Math.sin(direction));

		const tile = tileAtPosition(tx, ty, map.map);
		if (!isTileSolid(tile)) {
			possibilities.push(direction);
		}

		direction += radians90;
	}

	// find the closest one
	return possibilities[0];
}
