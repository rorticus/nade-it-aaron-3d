import { Engine, GameObject, loadGLB } from "webgl-engine";
import { quat, vec3 } from "gl-matrix";
import * as mapDef from "../../shared/mapdef.json";

export interface MapDefinition {
	width: number;
	height: number;
	map: string;
}

const tiles: ArrayBuffer[] = [];
Object.keys(mapDef).forEach((key) => {
	tiles[parseInt(key, 10)] = require(`./resources/models/${
		(mapDef as any)[key].filename
	}.glb`);
});

export function createMapGameObject(engine: Engine, def: MapDefinition) {
	const root = new GameObject();

	const tileWidth = 1;
	const tileHeight = 1;

	const tileModels = tiles.map((tileData) =>
		loadGLB(engine.gl, engine.programs.standard, tileData)
	);

	for (let y = 0; y < def.height; y++) {
		for (let x = 0; x < def.width; x++) {
			const tileIndex = def.map.charCodeAt(y * def.width + x);

			const tileCopy = tileModels[tileIndex];

			const tile = tileCopy.clone();
			tile.position = vec3.fromValues(x * tileWidth, 0, y * tileHeight);
			// quat.rotateY(tile.rotation, quat.create(), 0);

			root.add(tile);
		}
	}

	root.position = vec3.fromValues(
		(-tileWidth * (def.width - 1)) / 2,
		0,
		(-tileHeight * (def.height - 1)) / 2
	);

	return root;
}
