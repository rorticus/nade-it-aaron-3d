import { Engine, GameObject, loadGLB } from "webgl-engine";
import { quat, vec3 } from "gl-matrix";
import * as mapDef from "../../shared/mapdef.json";
import {MapInfo} from "./state/MapInfo";
import * as pretties from '../../shared/pretties.json';

const tiles: ArrayBuffer[] = [];
Object.keys(mapDef).forEach((key) => {
	tiles[parseInt(key, 10)] = require(`./resources/models/${
		(mapDef as any)[key].filename
	}.glb`);
});

const prettyModels = pretties.map(pretty => require(`./resources/models/${pretty}`));

export function createMapGameObject(engine: Engine, def: MapInfo) {
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

	const allPretties = prettyModels.map(prettyData => loadGLB(engine.gl, engine.programs.standard, prettyData).children[0]);

	def.mapPretties.forEach(mapPretty => {
		const model = new GameObject();
		model.renderable = allPretties[mapPretty.type].renderable;
		model.position = vec3.fromValues(mapPretty.position.x, mapPretty.position.y, mapPretty.position.z);

		root.add(model);
	});

	root.position = vec3.fromValues(
		(-tileWidth * (def.width - 1)) / 2,
		0,
		(-tileHeight * (def.height - 1)) / 2
	);

	return root;
}
