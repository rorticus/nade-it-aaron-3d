export function sample<T>(arr: Array<T>): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(array: T[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
}

export function removeFromArray<T>(arr: Array<T>, item: T) {
	const index = arr.indexOf(item);

	if (index >= 0) {
		arr.splice(index, 1);
	}
}
export abstract class Cell {
	row: number;
	column: number;
	private _links?: Map<Cell, boolean>;
	weight: number;
	type?: number;

	constructor(row: number, column: number) {
		this.row = row;
		this.column = column;
		this.weight = 1;

		this._links = new Map<Cell, boolean>();
	}

	link(cell: Cell, bidirectional = true) {
		this._links.set(cell, true);

		if (bidirectional) {
			cell.link(this, false);
		}
	}

	unlink(cell: Cell, bidirectional = true) {
		this._links.delete(cell);

		if (bidirectional) {
			cell.unlink(this, false);
		}
	}

	links() {
		return Array.from(this._links.keys());
	}

	linked(cell: Cell | null) {
		if (!cell) {
			return false;
		}

		return this._links.has(cell);
	}

	abstract neighbors(): Cell[];

	toString() {
		return `Cell(${this.row}, ${this.column})`;
	}
}

export interface Grid<T extends Cell = Cell> {
	rows: number;
	columns: number;

	readonly allCells: T[];
	readonly allRows: T[][];
	readonly size: number;

	row(row: number): T[];
	cell(row: number, column: number): T | null;
	randomCell(): T;
	contentsOf(cell: T): string;
	backgroundColorForCell(cell: T): string | null;
	deadEnds(): T[];
	braid(p: number): void;
}

export abstract class GridBase<T extends Cell = Cell> implements Grid<T> {
	rows: number;
	columns: number;

	protected _grid: (T | undefined)[][];

	get allCells(): T[] {
		return this._grid
			.reduce((cells, row) => [...cells, ...row], [])
			.filter((c) => c);
	}

	get allRows(): T[][] {
		return this._grid;
	}

	get size() {
		return this.rows * this.columns;
	}

	constructor(rows: number, columns: number) {
		this.rows = rows;
		this.columns = columns;

		this._grid = this.prepareGrid();
		this.configureCells();
	}

	abstract prepareGrid(): T[][];

	abstract configureCells(): void;

	row(row: number): T[] {
		if (row >= 0 && row < this.rows) {
			return this._grid[row];
		}

		return null;
	}

	cell(row: number, column: number): T | null {
		if (row >= 0 && row < this.rows) {
			if (column >= 0 && column < this._grid[row].length) {
				return this._grid[row][column] || null;
			}
		}

		return null;
	}

	randomCell() {
		const row = Math.floor(Math.random() * this.rows);
		const column = Math.floor(Math.random() * this.columns);

		return this.cell(row, column);
	}

	contentsOf(cell: T) {
		return " ";
	}

	backgroundColorForCell(cell: T): string | null {
		return null;
	}

	deadEnds() {
		const list: T[] = [];

		this.allCells.forEach((cell) => {
			if (cell.links().length === 1) {
				list.push(cell);
			}
		});

		return list;
	}

	braid(p = 1) {
		const deadEnds = shuffle(this.deadEnds());
		deadEnds.forEach((cell) => {
			if (cell.links().length !== 1) {
				return;
			}

			if (Math.random() > p) {
				return;
			}

			const neighbors = cell
				.neighbors()
				.filter((cell) => cell.links().length !== 1);

			if (neighbors.length) {
				const neighbor = sample(neighbors);
				cell.link(neighbor);
			}
		});
	}

	pock(r = 1) {
		this.allCells.forEach((cell) => {
			const links = cell.links();
			if (links.length > 0) {
				if (Math.random() < r) {
					const neighbors = cell.neighbors();
					neighbors.forEach((neighbor) => {
						if (!cell.linked(neighbor) && Math.random() < r) {
							cell.link(neighbor);
						}
					});
				}
			}
		});
	}
}

export class RectangleCell extends Cell {
	north?: RectangleCell;
	east?: RectangleCell;
	south?: RectangleCell;
	west?: RectangleCell;

	neighbors(): Cell[] {
		const list: Cell[] = [];

		if (this.north) {
			list.push(this.north);
		}

		if (this.south) {
			list.push(this.south);
		}

		if (this.east) {
			list.push(this.east);
		}

		if (this.west) {
			list.push(this.west);
		}

		return list;
	}

	unlink(cell: Cell, bidirectional: boolean = true) {
		super.unlink(cell, bidirectional);

		if (this.north === cell) {
			this.north.south = undefined;
		}
		if (this.south === cell) {
			this.south.north = undefined;
		}
		if (this.east === cell) {
			this.east.west = undefined;
		}
		if (this.west === cell) {
			this.west.east = undefined;
		}
	}
}

export class RectangleGrid extends GridBase<RectangleCell> {
	prepareGrid() {
		const grid: RectangleCell[][] = [];

		for (let row = 0; row < this.rows; row++) {
			let r: RectangleCell[] = [];
			for (let col = 0; col < this.columns; col++) {
				r.push(new RectangleCell(row, col));
			}

			grid.push(r);
		}

		return grid;
	}

	configureCells(): void {
		this.allCells.forEach((cell) => {
			const row = cell.row;
			const col = cell.column;

			cell.north = this.cell(row - 1, col);
			cell.south = this.cell(row + 1, col);
			cell.west = this.cell(row, col - 1);
			cell.east = this.cell(row, col + 1);
		});
	}

	toString() {
		let output = "+" + "---+".repeat(this.columns) + "\n";

		this.allRows.forEach((row) => {
			let top = "|";
			let bottom = "+";

			row.forEach((cell) => {
				if (!cell) {
					let body = `  `;
					const eastBoundary = "|";

					top += body + eastBoundary;

					let southBoundary = "---";
					bottom += southBoundary + "+";
				} else {
					let body = ` ${this.contentsOf(cell)} `;
					const eastBoundary = cell.linked(cell.east) ? " " : "|";

					top += body + eastBoundary;

					let southBoundary = cell.linked(cell.south) ? "   " : "---";
					bottom += southBoundary + "+";
				}
			});

			output += top + "\n";
			output += bottom + "\n";
		});

		return output;
	}

	toArray(borderType = 1) {
		const output: number[][] = [];

		const firstRow: number[] = [];
		for (let i = 0; i < this.columns * 2 + 1; i++) {
			firstRow.push(borderType);
		}
		output.push(firstRow);

		this.allRows.forEach((row) => {
			const top: number[] = [borderType];
			const bottom: number[] = [borderType];

			row.forEach((cell) => {
				top.push(cell.type || 0);
				top.push(cell.linked(cell.east) ? cell.type || 0 : borderType);

				bottom.push(cell.linked(cell.south) ? cell.type || 0 : borderType);
				bottom.push(borderType);
			});

			output.push(top);
			output.push(bottom);
		});

		return output;
	}
}

export class RecursiveBackTracker {
	generate(grid: Grid): void {
		const startAt = grid.randomCell();

		const stack = [startAt];

		while (stack.length) {
			const current = stack[stack.length - 1];

			const neighbors = current
				.neighbors()
				.filter((n) => n.links().length === 0);

			if (neighbors.length === 0) {
				stack.pop();
			} else {
				const neighbor = sample(neighbors);
				current.link(neighbor);
				stack.push(neighbor);
			}
		}
	}
}
