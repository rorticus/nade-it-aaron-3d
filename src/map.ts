import { Engine, GameObject, loadGLB } from "webgl-engine";
import { quat, vec3 } from "gl-matrix";

export interface MapDefinition {
	width: number;
	height: number;
	tiles: {
		key: string;
		rotation?: number;
		offset?: [number, number];
	}[];
	spawns: [number, number][];
}

export function createMapGameObject(engine: Engine, def: MapDefinition) {
	const root = new GameObject();

	const grass = loadGLB(
		engine.gl,
		engine.programs.standard,
		require("./resources/models/ground_grass.glb")
	);

	const cliffStraight = loadGLB(
		engine.gl,
		engine.programs.standard,
		require("./resources/models/cliff_top_rock.glb")
	);

	cliffStraight.add(grass.clone());

	const cliffCorner = loadGLB(
		engine.gl,
		engine.programs.standard,
		require("./resources/models/cliff_cornerInnerTop_rock.glb")
	);

	cliffCorner.add(grass.clone());

	const tiles = {
		grass,
		cliffStraight,
		cliffCorner
	};

	const tileWidth = 1;
	const tileHeight = 1;

	for (let y = 0; y < def.height; y++) {
		for (let x = 0; x < def.width; x++) {
			const tileDef = def.tiles[y * def.width + x];

			const { offset = [0, 0], rotation = 0, key } = tileDef;
			const tileCopy = tiles[key as keyof typeof tiles];

			const tile = tileCopy.clone();
			tile.position = vec3.fromValues(
				x * tileWidth + offset[0],
				0,
				y * tileHeight + offset[1]
			);
			quat.rotateY(tile.rotation, quat.create(), rotation);

			root.position = vec3.fromValues(-tileWidth * def.width / 2, 0, -tileHeight * def.height / 2);

			root.add(tile);
		}
	}

	return root;
}
