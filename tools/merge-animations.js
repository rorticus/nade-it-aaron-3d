const fs = require("fs");
const path = require("path");
const { argv } = require("process");

const [, , inputFilename, outputFilename, animationName] = argv;

if (!inputFilename || !outputFilename || !animationName) {
	console.log(
		"node merge-animations.js <input filename> <output filename> <animationName>"
	);
	process.exit(1);
}

const fileData = fs.readFileSync(inputFilename);

// header
const dataView = new DataView(fileData.buffer);

const magic = dataView.getUint32(0, true);
const version = dataView.getUint32(4, true);
const length = dataView.getUint32(8, true);

if (magic !== 0x46546c67) {
	console.error("not a valid glb file");
	process.exit(1);
}

// get all the chunks
const chunks = [];
let offset = 12;

while (offset < length) {
	const chunkLength = dataView.getUint32(offset, true);
	const chunkType = dataView.getUint32(offset + 4, true);
	const chunkData = fileData.slice(offset + 8, offset + 8 + chunkLength);

	offset += 8 + chunkLength;

	chunks.push({
		length: chunkLength,
		type: chunkType,
		data: chunkData,
	});
}

// process json chunks
chunks.forEach((chunk) => {
	if (chunk.type === 0x4e4f534a) {
		const json = JSON.parse(chunk.data.toString("utf-8"));

		if (!json.animations || json.animations.length === 0) {
			console.error("there are no animations!");
			process.exit(1);
		}

		const combinedAnimation = {
			channels: [],
			name: animationName,
			samplers: [],
		};

		json.animations.forEach((animation) => {
			combinedAnimation.channels = [
				...combinedAnimation.channels,
				...animation.channels,
			];
			combinedAnimation.samplers = [
				...combinedAnimation.samplers,
				...animation.samplers,
			];
		});

		json.animations = [combinedAnimation];

		let result = JSON.stringify(json);
		while (result.length % 4) {
			result += " ";
		}

		chunk.data = Buffer.from(result);
		chunk.length = chunk.data.byteLength;
	}
});

const outputBuffer = new ArrayBuffer(
	12 /* file header */ +
		chunks.reduce(
			(total, chunk) => total + 8 /* chunk header */ + chunk.length,
			0
		)
);

const outputView = new DataView(outputBuffer);
outputView.setUint32(0, magic, true);
outputView.setUint32(4, version, true);
outputView.setUint32(8, outputBuffer.byteLength, true);

offset = 12;
chunks.forEach((chunk) => {
	outputView.setUint32(offset, chunk.length, true);
	outputView.setUint32(offset + 4, chunk.type, true);
	const targetBuffer = Buffer.from(outputBuffer, offset + 8, chunk.length);
	chunk.data.copy(targetBuffer);

	offset += 8 + chunk.length;
});

const finalBuffer = Buffer.from(outputBuffer);
fs.writeFileSync(outputFilename, finalBuffer);
