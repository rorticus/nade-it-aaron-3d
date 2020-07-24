import * as mapDef from "../../../shared/mapdef.json";

export const MAP_WIDTH = 12;
export const MAP_HEIGHT = 12;

const tiles = Object.keys(mapDef).reduce((result, key) => {
	return {
		...result,
		[(mapDef as any)[key].filename]: parseInt(key, 10),
	};
}, {}) as { [key: string]: number };

export function generateMap(): string {
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

	return arr.reduce((str, n) => str + String.fromCharCode(n), "");
}
