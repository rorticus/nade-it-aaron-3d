import {
	canTileExplode,
	getCollisionRectsForTile,
	getTileCollisionRectsForPosition,
	tileAtPosition,
	tileCoordForPosition,
} from "../map/map";
import { MapInfo } from "../state/MapInfo";

const playerWidth = 0.2;
const playerHeight = 0.1;

export function getPlayerBounds(
	x: number,
	y: number
): [number, number, number, number] {
	return [x - playerWidth / 2, y - playerHeight, x + playerWidth / 2, y];
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

function tilesOnVerticalLine(x: number, y1: number, y2: number) {
	const results = [];

	for (let y = y1; y < y2; y += 1) {
		results.push(tileCoordForPosition(x, y));
	}
	results.push(tileCoordForPosition(x, y2));

	return results;
}

function getTilesInRect(rect: [number, number, number, number], map: MapInfo) {
	const allTiles = [
		...tilesOnHorizontalLine(rect[0], rect[2], rect[3]),
		...tilesOnHorizontalLine(rect[0], rect[2], rect[1]),
		...tilesOnVerticalLine(rect[0], rect[1], rect[3]),
		...tilesOnVerticalLine(rect[2], rect[1], rect[3]),
	];

	return allTiles.map((tile) => ({
		gid: tileAtPosition(tile[0], tile[1], map.map),
		x: tile[0],
		y: tile[1],
		tilePos: tile,
	}));
}

export function resolveCollisions(
	x: number,
	y: number,
	dx: number,
	dy: number,
	map: MapInfo
): { x: number; y: number } {
	let playerRect = getPlayerBounds(x, y);
	let nx = x;
	let ny = y;

	const walls = getTilesInRect(playerRect, map);

	walls.forEach((wall) => {
		const collisionRects = getTileCollisionRectsForPosition(
			wall.gid,
			wall.tilePos[0],
			wall.tilePos[1]
		);

		if (collisionRects.length) {
			collisionRects.forEach((collisionRect) => {
				const intersection = rectangleIntersection(collisionRect, playerRect);

				if (intersection) {
					const iw = intersection[2] - intersection[0];
					const ih = intersection[3] - intersection[1];

					if (iw > ih) {
						if (dy < 0) {
							// up
							ny += ih;
						} else if (dy > 0) {
							ny -= ih;
						}
					} else if (iw < ih) {
						if (dx < 0) {
							nx += iw;
						} else if (dx > 0) {
							nx -= iw;
						}
					}

					playerRect = getPlayerBounds(nx, ny);
				}
			});
		}
	});

	return { x: nx, y: ny };
}

export interface ExplosionResults {
	origin: [number, number];
	north: number;
	east: number;
	south: number;
	west: number;
	tiles: [number, number][];
}

export function getExplosionResults(
	map: MapInfo,
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
			const collisions = getCollisionRectsForTile(tile);
			if (collisions && collisions.length > 0) {
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

	let northTile = firstCollidingTile(origin[0], origin[1], 0, -1, size);
	let eastTile = firstCollidingTile(origin[0], origin[1], 1, 0, size);
	let southTile = firstCollidingTile(origin[0], origin[1], 0, 1, size);
	let westTile = firstCollidingTile(origin[0], origin[1], -1, 0, size);

	return {
		origin,
		north: northTile ? northTile.steps : size,
		east: eastTile ? eastTile.steps : size,
		south: southTile ? southTile.steps : size,
		west: westTile ? westTile.steps : size,
		tiles: [
			northTile && northTile.tile ? northTile.pos : null,
			eastTile && eastTile.tile ? eastTile.pos : null,
			southTile && southTile.tile ? southTile.pos : null,
			westTile && westTile.tile ? westTile.pos : null,
		].filter((t) => t),
	};
}
