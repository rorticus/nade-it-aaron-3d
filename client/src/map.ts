import { Engine, GameObject, loadGLB } from "webgl-engine";
import { quat, vec3 } from "gl-matrix";
import * as mapDef from "../../shared/mapdef.json";
import { MapInfo } from "./state/MapInfo";
import * as pretties from "../../shared/pretties.json";

const tiles: ArrayBuffer[] = [];
const tilesByName: Record<string, number> = {};

Object.keys(mapDef).forEach((key) => {
	const k = (mapDef as any)[key];
	const index = k.index;
	tiles[index] = require(`./resources/models/${k.filename}.glb`);

	tilesByName[key] = index;
});

const prettyModels = pretties.map((pretty) =>
	require(`./resources/models/${pretty}`)
);

export function createMapGameObject(engine: Engine, def: MapInfo) {
	const root = new GameObject();

	const tileWidth = 1;
	const tileHeight = 1;

	const tileModels = tiles.map((tileData) =>
		loadGLB(engine.gl, engine.programs.standard, tileData)
	);

	tileModels[tilesByName["borderNorth"]].rotateY((Math.PI * 180) / 180);
	tileModels[tilesByName["borderSouth"]].rotateY(0);
	tileModels[tilesByName["borderWest"]].rotateY((Math.PI * 270) / 180);
	tileModels[tilesByName["borderEast"]].rotateY((Math.PI * 90) / 180);

	for (let y = 0; y < def.height; y++) {
		for (let x = 0; x < def.width; x++) {
			const tileIndex = def.map.charCodeAt(y * def.width + x);

			const tileCopy = tileModels[tileIndex];

			const tile = tileCopy.clone();
			tile.id = `tile-${x}-${y}`;
			tile.position = vec3.fromValues(x * tileWidth, 0, y * tileHeight);
			// quat.rotateY(tile.rotation, quat.create(), 0);

			root.add(tile);
		}
	}

	const allPretties = prettyModels.map(
		(prettyData) =>
			loadGLB(engine.gl, engine.programs.standard, prettyData).children[0]
	);

	def.mapPretties.forEach((mapPretty) => {
		const model = new GameObject();
		model.renderable = allPretties[mapPretty.type].renderable;
		model.position = vec3.fromValues(
			mapPretty.position.x,
			mapPretty.position.y,
			mapPretty.position.z
		);

		root.add(model);
	});

	root.position = vec3.fromValues(
		(-tileWidth * (def.width - 1)) / 2,
		0,
		(-tileHeight * (def.height - 1)) / 2
	);

	return root;
}

export function createTileAt(
	engine: Engine,
	x: number,
	y: number,
	tileIndex: number
) {
	const model = loadGLB(engine.gl, engine.programs.standard, tiles[tileIndex]);
	model.position = vec3.fromValues(x, 0, y);
	model.id = `tile-${x}-${y}`;

	return model;
}
