import * as mapDef from "../../../shared/mapdef.json";
import { MapPretty } from "../state/MapPretty";
import possiblePretties from "../../../shared/pretties.json";
import { Vector2 } from "../state/primitives";
import { MapInfo } from "../state/MapInfo";
import { ArraySchema } from "@colyseus/schema";
import { RectangleGrid, RecursiveBackTracker } from "./maze";
import * as scores from "../player/scores.json";

export const MAP_WIDTH = 13;
export const MAP_HEIGHT = 13;

export const tiles = Object.keys(mapDef).reduce((result, key) => {
	const k = (mapDef as any)[key];

	return {
		...result,
		[key]: k.index,
	};
}, {}) as { [key: string]: number };

const tilesByIndex = Object.keys(mapDef).reduce((result, key) => {
	result[(mapDef as any)[key].index] = key;
	return result;
}, []);

export function tileCoordForPosition(x: number, y: number): [number, number] {
	const tx = Math.floor(x);
	const ty = Math.floor(y);

	return [tx, ty];
}

export function tileRectFromTileCoords(tx: number, ty: number) {
	const left = tx;
	const top = ty;

	return [left, top, left + 1, top + 1];
}

export function tileAtPosition(tx: number, ty: number, map: string) {
	return map.charCodeAt(ty * MAP_WIDTH + tx);
}

export function isTileSolid(gid: number) {
	if (tilesByIndex[gid] === undefined) {
		console.error(`${gid} is not found in ${tilesByIndex}`);
	}

	const entry = (mapDef as any)[tilesByIndex[gid]];

	const { solid = false } = entry;

	return solid;
}

export function canTileExplode(gid: number) {
	return gid === tiles["box"];
}

export function setTileToGrass(tx: number, ty: number, map: string) {
	const index = ty * MAP_WIDTH + tx;
	return (
		map.substring(0, index) +
		String.fromCharCode(tiles["grass"]) +
		map.substring(index + 1)
	);
}

export function centeredInTile(tileX: number, tileY: number): [number, number] {
	return [tileX + 0.5, tileY + 0.5];
}

export function getTileScore(gid: number) {
	if (gid === tiles["box"]) {
		return scores.BOX_DESTROYED;
	}

	return 0;
}

export const GRID_CELL_SPAWN = 1;
export const GRID_CELL_WALL = 2;

export function generateMap(): MapInfo {
	console.assert(!(MAP_WIDTH % 1));
	console.assert(!(MAP_HEIGHT % 1));

	const maze = new RecursiveBackTracker();
	const grid = new RectangleGrid((MAP_WIDTH - 1) / 2, (MAP_HEIGHT - 1) / 2);

	maze.generate(grid);
	grid.braid(1);
	grid.pock(0.75);

	const rows = grid.toArray(GRID_CELL_WALL);

	// top left
	rows[1][1] = GRID_CELL_SPAWN;
	rows[1][2] = GRID_CELL_SPAWN;
	rows[2][1] = GRID_CELL_SPAWN;
	// top right
	rows[1][MAP_WIDTH - 2] = GRID_CELL_SPAWN;
	rows[1][MAP_WIDTH - 3] = GRID_CELL_SPAWN;
	rows[2][MAP_WIDTH - 2] = GRID_CELL_SPAWN;
	// bottom left
	rows[MAP_HEIGHT - 2][1] = GRID_CELL_SPAWN;
	rows[MAP_HEIGHT - 3][1] = GRID_CELL_SPAWN;
	rows[MAP_HEIGHT - 2][2] = GRID_CELL_SPAWN;
	// bottom right
	rows[MAP_HEIGHT - 2][MAP_WIDTH - 2] = GRID_CELL_SPAWN;
	rows[MAP_HEIGHT - 3][MAP_WIDTH - 2] = GRID_CELL_SPAWN;
	rows[MAP_HEIGHT - 2][MAP_WIDTH - 3] = GRID_CELL_SPAWN;

	// outer walls are all the border type
	for (let x = 0; x < MAP_WIDTH; x++) {
		rows[0][x] =
			x === 0
				? tiles["borderNorthWest"]
				: x === MAP_WIDTH - 1
				? tiles["borderNorthEast"]
				: tiles["borderNorth"];
		rows[MAP_HEIGHT - 1][x] =
			x === 0
				? tiles["borderSouthWest"]
				: x === MAP_WIDTH - 1
				? tiles["borderSouthEast"]
				: tiles["borderSouth"];
	}

	for (let y = 1; y < MAP_HEIGHT - 1; y++) {
		rows[y][0] = tiles["borderWest"];
		rows[y][MAP_WIDTH - 1] = tiles["borderEast"];
	}

	// all other interior walls are rocks
	const rockTiles = [tiles["largeRock"], tiles["largeRock2"]];

	for (let y = 1; y < MAP_HEIGHT - 1; y++) {
		for (let x = 1; x < MAP_WIDTH - 1; x++) {
			if (rows[y][x] !== 0 && rows[y][x] !== GRID_CELL_SPAWN) {
				rows[y][x] = rockTiles[Math.floor(Math.random() * rockTiles.length)];
			}
		}
	}

	// interior spaces are grass
	for (let y = 1; y < MAP_HEIGHT - 1; y++) {
		for (let x = 1; x < MAP_WIDTH - 1; x++) {
			if (rows[y][x] === 0 || rows[y][x] === GRID_CELL_SPAWN) {
				if (rows[y][x] === GRID_CELL_SPAWN) {
					rows[y][x] = tiles["grass"];
				} else {
					if (Math.random() * 100 < 75) {
						rows[y][x] = tiles["box"];
					} else {
						rows[y][x] = tiles["grass"];
					}
				}
			}
		}
	}

	const arr = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);

	for (let y = 0; y < MAP_HEIGHT; y++) {
		for (let x = 0; x < MAP_WIDTH; x++) {
			let idx = y * MAP_WIDTH + x;

			arr[idx] = rows[y][x];
		}
	}

	const pretties = new ArraySchema<MapPretty>();
	const prettyCount = Math.floor((MAP_WIDTH - 1) * (MAP_HEIGHT - 1) * 0.5);

	for (let i = 0; i < prettyCount; i++) {
		const p = new MapPretty();

		p.type = Math.floor(Math.random() * possiblePretties.length);
		p.position = new Vector2(
			0.25 + Math.random() * (MAP_WIDTH - 1),
			0.25 + Math.random() * (MAP_HEIGHT - 1)
		);
		pretties.push(p);
	}

	const mapInfo = new MapInfo();
	mapInfo.map = arr.reduce((str, n) => str + String.fromCharCode(n), "");
	mapInfo.width = MAP_WIDTH;
	mapInfo.height = MAP_HEIGHT;
	mapInfo.mapPretties = pretties;
	mapInfo.spawns = [
		centeredInTile(MAP_WIDTH - 2, 1),
		centeredInTile(1, 1),
		centeredInTile(MAP_WIDTH - 2, MAP_HEIGHT - 2),
		centeredInTile(1, MAP_HEIGHT - 2),
	];

	return mapInfo;
}
