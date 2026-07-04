export type Level = 1 | 2 | 3 | 4;

export interface Room {
	id: number;
	title: string;
	type: string;
	question: string;
	answer: string | string[];
	hint: string | string[];
	difficulty: number;
	inputType?: 'text' | 'number' | 'password' | 'choice' | 'combo-lock' | 'tile-order';
	comboLength?: number;
	tiles?: string[];
}

export interface GameState {
	currentRoom: number;
	hintsRemaining: number;
	hintsUsed: number;
	completedRooms: number[];
	playerName: string;
	playerGender?: string;
	playerAge?: number;
	level?: Level;
	startTime?: Date;
	endTime?: Date;
	host: string;
	userAgent: string;
	platform: string;
}
