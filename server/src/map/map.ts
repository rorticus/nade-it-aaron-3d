import * as mapDef from "../../../shared/mapdef.json";
import { MapPretty } from "../state/MapPretty";
import possiblePretties from "../../../shared/pretties.json";
import { Vector3 } from "../state/primitives";
import { MapInfo } from "../state/MapInfo";
import { ArraySchema } from "@colyseus/schema";

export const MAP_WIDTH = 13;
export const MAP_HEIGHT = 13;

export const tiles = Object.keys(mapDef).reduce((result, key) => {
	return {
		...result,
		[(mapDef as any)[key].filename]: parseInt(key, 10),
	};
}, {}) as { [key: string]: number };

export function getCollisionRectsForTile(
	tile: number
): [number, number, number, number][] {
	if (tile === tiles["borderEast"]) {
		return [[0.5, 0, 1, 1]];
	} else if (tile === tiles["borderWest"]) {
		return [[0, 0, 0.5, 1]];
	} else if (tile === tiles["borderNorth"]) {
		return [[0, 0, 1, 0.5]];
	} else if (tile === tiles["borderSouth"]) {
		return [[0, 0.5, 1, 1]];
	} else if (tile === tiles["borderNorthWest"]) {
		return [
			[0, 0, 0.5, 1],
			[0, 0, 1, 0.5],
		];
	} else if (tile === tiles["borderNorthEast"]) {
		return [
			[0.5, 0, 1, 1],
			[0, 0, 1, 0.5],
		];
	} else if (tile === tiles["borderSouthEast"]) {
		return [
			[0.5, 0, 1, 1],
			[0, 0.5, 1, 1],
		];
	} else if (tile === tiles["borderSouthWest"]) {
		return [
			[0, 0, 0.5, 1],
			[0, 0.5, 1, 1],
		];
	} else if (tile === tiles["largeRock"] || tile === tiles["largeRock2"]) {
		return [[0, 0, 1, 1]];
	} else if (tile === tiles["box"]) {
		return [[0, 0, 1, 1]];
	}

	return null;
}

export function tileCoordForPosition(x: number, y: number) {
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

export function getTileCollisionRectsForPosition(
	gid: number,
	tx: number,
	ty: number
): [number, number, number, number][] {
	const c = getCollisionRectsForTile(gid);
	const p = tileRectFromTileCoords(tx, ty);

	if (!c) {
		return [];
	}

	return c.map((c) => [c[0] + p[0], c[1] + p[1], c[2] + p[0], c[3] + p[1]]);
}

export function generateMap(): MapInfo {
	const arr = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);

	for (let y = 0; y < MAP_HEIGHT; y++) {
		for (let x = 0; x < MAP_WIDTH; x++) {
			let idx = y * MAP_WIDTH + x;

			arr[idx] = tiles["grass"];
		}
	}

	for (let x = 0; x < MAP_WIDTH; x++) {
		arr[x] = tiles["borderNorth"];
		arr[x + (MAP_HEIGHT - 1) * MAP_WIDTH] = tiles["borderSouth"];
	}

	for (let y = 0; y < MAP_HEIGHT; y++) {
		arr[y * MAP_WIDTH] = tiles["borderWest"];
		arr[y * MAP_WIDTH + MAP_WIDTH - 1] = tiles["borderEast"];
	}

	arr[0] = tiles["borderNorthWest"];
	arr[MAP_WIDTH - 1] = tiles["borderNorthEast"];
	arr[(MAP_HEIGHT - 1) * MAP_WIDTH] = tiles["borderSouthWest"];
	arr[(MAP_HEIGHT - 1) * MAP_WIDTH + MAP_WIDTH - 1] = tiles["borderSouthEast"];

	const rockTiles = [tiles["largeRock"], tiles["largeRock2"]];
	for (let y = 1; y < MAP_HEIGHT; y++) {
		for (let x = 1; x < MAP_WIDTH; x++) {
			if (x % 2 && y % 2) {
				arr[y * MAP_WIDTH + x] =
					rockTiles[Math.floor(Math.random() * rockTiles.length)];
			}
		}
	}

	// place boxes
	for (let y = 1; y < MAP_HEIGHT - 1; y++) {
		for (let x = 1; x < MAP_WIDTH - 1; x++) {
			if(arr[y * MAP_WIDTH + x] === tiles['grass']) {
				if(Math.random() * 100 < 75) {
					arr[y * MAP_WIDTH + x] = tiles["box"];
				}
			}
		}
	}

	const pretties = new ArraySchema<MapPretty>();
	const prettyCount = Math.floor((MAP_WIDTH - 1) * (MAP_HEIGHT - 1) * 0.5);

	for (let i = 0; i < prettyCount; i++) {
		const p = new MapPretty();

		p.type = Math.floor(Math.random() * possiblePretties.length);
		p.position = new Vector3();
		p.position.x = 0.25 + Math.random() * (MAP_WIDTH - 1);
		p.position.y = 0;
		p.position.z = 0.25 + Math.random() * (MAP_HEIGHT - 1);

		pretties.push(p);
	}

	const mapInfo = new MapInfo();
	mapInfo.map = arr.reduce((str, n) => str + String.fromCharCode(n), "");
	mapInfo.width = MAP_WIDTH;
	mapInfo.height = MAP_HEIGHT;
	mapInfo.mapPretties = pretties;

	return mapInfo;
}
