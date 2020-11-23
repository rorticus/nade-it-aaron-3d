import { vec3, vec4 } from "gl-matrix";
import {
	Engine,
	GameObject,
	loadGLB,
	ScaleAnimationChannel,
	TranslationAnimationChannel,
} from "webgl-engine";
import {
	AnimationState,
	AnimationWrapMode,
} from "webgl-engine/lib/animation/AnimationState";
import { PlayerMovement } from "../components/PlayerMovement";
import {
	ExplosionDescription,
	FireDescription,
	FontDefinition,
} from "../interfaces";
import { getPlayerSkin, updatePlayerSkin } from "../players";
import {
	bomb,
	bombPowerUp,
	character,
	explosion,
	explosionCube,
	explosionTemplate,
	powerPowerUp,
} from "../resources/assets";
import { MapInfo } from "../state/MapInfo";
import { Player } from "../state/Player";
import { PowerUp } from "../state/PowerUp";

export const playerColors = [
	vec4.fromValues(0, 0, 1, 1),
	vec4.fromValues(0, 1, 0, 1),
	vec4.fromValues(1, 0, 0, 1),
	vec4.fromValues(1, 1, 0, 1),
];

export function drawTextOnCanvas(
	context: CanvasRenderingContext2D,
	text: string,
	font: FontDefinition,
	x: number,
	y: number
) {
	const image = font.image;

	for (let i = 0, cx = x; i < text.length; i++) {
		const char = font.characterInfo[text[i]];

		if (!char) {
			continue;
		}

		context.drawImage(
			image,
			char.x,
			char.y,
			char.width,
			char.height,
			cx + char.xOffset,
			y + char.yOffset,
			char.width,
			char.height
		);
		cx += char.xAdvance;
	}
}

export function textDimensions(
	font: FontDefinition,
	text: string
): { width: number; height: number } {
	let width = 2;
	let height = 0;

	for (let i = 0; i < text.length; i++) {
		const char = font.characterInfo[text[i]];

		if (!char) {
			continue;
		}

		width += char.xAdvance;
		height = Math.max(height, char.height);
	}

	return { height, width };
}

export function mapToWorldCoordinates(
	map: MapInfo,
	x: number,
	y: number
): vec3 {
	return vec3.fromValues(x - map.width / 2, 0, y - map.height / 2);
}

export function configurePlayerModel(
	engine: Engine,
	map: MapInfo,
	player: Player
) {
	const characterModel = loadGLB(
		engine.gl,
		engine.programs.standard,
		character
	);
	characterModel.id = player.id;
	characterModel.position = mapToWorldCoordinates(
		map,
		player.position.x,
		player.position.y
	);
	characterModel.scale = vec3.fromValues(0.35, 0.35, 0.35);
	characterModel.animation.transitionTo("Idle", 0);
	characterModel.rotateY(player.rotation);
	updatePlayerSkin(engine, characterModel, getPlayerSkin(player.index));

	const movementTracker = new PlayerMovement();
	characterModel.addComponent(movementTracker);

	characterModel.animation.addTransition(
		"Idle",
		"Walk",
		() => {
			return movementTracker.isMoving();
		},
		0.1
	);

	characterModel.animation.addTransition(
		"Walk",
		"Idle",
		() => {
			return !movementTracker.isMoving();
		},
		0.1
	);

	characterModel.animation.addTransition("Walk", "Walk", () => false);

	characterModel.animation.addTransition(
		"Interact_ground",
		"Idle",
		(condition, gameObject, duration) => {
			return condition.deltaInSeconds > duration / 2 - 0.66;
		},
		0.33
	);

	characterModel.animation.states["Walk"].timeScale = 2;
	characterModel.animation.states["Interact_ground"].timeScale = 2;

	return characterModel;
}

export function createBomb(engine: Engine) {
	const model = loadGLB(engine.gl, engine.programs.standard, bomb);

	model.animation.configure("Spawn", {
		wrap: AnimationWrapMode.None,
	});
	model.animation.configure("Pulses", {
		wrap: AnimationWrapMode.Loop,
	});

	model.animation.initialState = "Spawn";
	model.animation.addTransition(
		"Spawn",
		"Pulses",
		(context, gameObject, playDuration, totalDuration) => {
			return playDuration > totalDuration;
		}
	);

	return model;
}

export function createFireBlock(engine: Engine, desc: FireDescription) {
	const e = explosionTemplate.clone();

	e.animation.registerState("explodingIn", new AnimationState());
	e.animation.registerState("explodingOut", new AnimationState());
	e.animation
		.getState("explodingIn")
		.channels.push(
			new ScaleAnimationChannel(
				e,
				[0, 0.25],
				[vec3.fromValues(1, 0, 1), vec3.fromValues(1.25, 1, 1.25)]
			)
		);
	e.animation
		.getState("explodingOut")
		.channels.push(
			new ScaleAnimationChannel(
				e,
				[desc.duration - 0.5, desc.duration - 0.25],
				[vec3.fromValues(1.25, 1, 1.25), vec3.fromValues(1, 0, 1)]
			)
		);
	e.animation.initialState = "explodingIn";

	e.animation.addTransition(
		"explodingIn",
		"explodingOut",
		(context, go, playDuration, totalDuration) => playDuration > totalDuration
	);

	e.animation.registerState("finished", new AnimationState());
	e.animation.configure("finished", {
		onEnter() {
			e.removeFromParent();
		},
	});
	e.animation.addTransition(
		"explodingOut",
		"finished",
		(context, gameObject, playDuration, totalDuration) => {
			return playDuration > totalDuration;
		}
	);

	return e;
}

export function createPowerUp(engine: Engine, powerUp: PowerUp) {
	const models: Record<string, ArrayBuffer> = {
		bomb: bombPowerUp,
		power: powerPowerUp,
	};

	const model = loadGLB(
		engine.gl,
		engine.programs.standard,
		models[powerUp.type]
	);
	model.id = powerUp.id;

	model.animation.initialState = "Spawn";
	model.animation.addTransition(
		"Spawn",
		"Advertise",
		(context, gameObject, playDuration, totalDuration) => {
			return playDuration > totalDuration;
		}
	);

	return model;
}
