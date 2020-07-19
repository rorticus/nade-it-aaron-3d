export const MAP_WIDTH = 12;
export const MAP_HEIGHT = 12;

export function generateMap(): string {
	const arr = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);

	for (let y = 0; y < MAP_HEIGHT; y++) {
		for (let x = 0; x < MAP_WIDTH; x++) {
			let idx = y * MAP_WIDTH + x;

			arr[idx] = 13;
		}
	}

	for (let x = 0; x < MAP_WIDTH; x++) {
		arr[x] = 1;
		arr[x + (MAP_HEIGHT - 1) * MAP_WIDTH] = 25;
	}

	for (let y = 0; y < MAP_HEIGHT; y++) {
		arr[y * MAP_WIDTH] = 12;
		arr[y * MAP_WIDTH + MAP_WIDTH - 1] = 14;
	}

	arr[0] = 2;
	arr[MAP_WIDTH - 1] = 0;
	arr[(MAP_HEIGHT - 1) * MAP_WIDTH] = 24;
	arr[(MAP_HEIGHT - 1) * MAP_WIDTH + MAP_WIDTH - 1] = 26;

	return arr.reduce((str, n) => str + String.fromCharCode(n), "");
}
