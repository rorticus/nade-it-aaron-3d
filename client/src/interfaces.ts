export interface CharacterPlacement {
	x: number;
	y: number;
	width: number;
	height: number;
	xAdvance: number;
	xOffset: number;
	yOffset: number;
}

export interface FontDefinition {
	imageName: string;
	image?: CanvasImageSource;
	definition: string;
	characterInfo?: Record<string, CharacterPlacement>;
}

export interface ExplosionDescription {
	origin: [number, number];
	north: number;
	east: number;
	south: number;
	west: number;
}

export interface FireDescription {
	position: [number, number];
	duration: number;
}
