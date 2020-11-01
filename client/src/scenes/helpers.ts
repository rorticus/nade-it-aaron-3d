import { FontDefinition } from "../interfaces";

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
