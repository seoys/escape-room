export interface Room {
	id: number;
	title: string;
	type: string;
	question: string;
	answer: string | string[];
	hint: string | string[];
	difficulty: number;
	inputType?: 'text' | 'number' | 'password' | 'choice' | 'combo-lock';
	comboLength?: number;
}

export interface GameState {
	currentRoom: number;
	hintsRemaining: number;
	completedRooms: number[];
	playerName: string;
	startTime?: Date;
	endTime?: Date;
	host: string;
	userAgent: string;
	platform: string;
}
