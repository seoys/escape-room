export type GridCell = {
	text?: string;
	arrow?: 'up' | 'down' | 'left' | 'right';
	mark?: 'hidden' | 'highlight';
};

export type SymbolItem = {
	glyph?: string;
	color?: string;
	label?: string;
	op?: '+' | '-' | '×' | '=';
};

export type SymbolRow = { items: SymbolItem[]; value?: string };

export type ShapeName = 'circle' | 'square' | 'triangle' | 'diamond';
export type ShapeMark = { shape: ShapeName; filled: boolean; slot: number };
export type ShapeCell = { marks: ShapeMark[] };

export type Speaker = { id: string; name: string; says: string };

export type PuzzleVisual =
	| { kind: 'image'; src: string; alt: string; width: number; height: number }
	| { kind: 'grid'; rows: GridCell[][]; caption?: string }
	| {
			kind: 'note';
			title?: string;
			lines: string[];
			style?: 'diary' | 'list' | 'warning';
	  }
	| { kind: 'symbol-rows'; rows: SymbolRow[]; background?: 'none' | 'clock' }
	| { kind: 'shape-matrix'; cells: ShapeCell[] }
	| { kind: 'statements'; speakers: Speaker[] };

export type ChoiceOption = {
	value: string;
	label?: string;
	image?: string;
	cell?: ShapeCell;
};

export interface RoomVariant {
	variantId: string;
	title: string;
	type: string;
	question: string;
	answer: string | string[];
	hint: string | string[];
	difficulty: number;
	inputType?:
		| 'text'
		| 'number'
		| 'password'
		| 'choice'
		| 'combo-lock'
		| 'tile-order';
	comboLength?: number;
	tiles?: string[];
	visual?: PuzzleVisual;
	options?: ChoiceOption[];
	tileImages?: Record<string, string>;
}

export interface Room {
	id: number;
	title: string;
	type: string;
	question: string;
	answer: string | string[];
	hint: string | string[];
	difficulty: number;
	inputType?:
		| 'text'
		| 'number'
		| 'password'
		| 'choice'
		| 'combo-lock'
		| 'tile-order';
	comboLength?: number;
	tiles?: string[];
	visual?: PuzzleVisual;
	options?: ChoiceOption[];
	tileImages?: Record<string, string>;
	variants?: RoomVariant[];
}

export type ClientRoom = Omit<Room, 'answer' | 'variants'> & {
	variantId?: string;
};

export interface GameState {
	currentRoom: number;
	hintsRemaining: number;
	hintsUsed: number;
	completedRooms: number[];
	playerName: string;
	playerGender?: string;
	playerAge?: number;
	startTime?: Date;
	endTime?: Date;
	host: string;
	userAgent: string;
	platform: string;
}
