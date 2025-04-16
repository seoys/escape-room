export interface Room {
	id: number;
	title: string;
	type: string;
	question: string;
	answer: string;
	hint: string;
	difficulty: number;
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
	language: string;
	platform: string;
	screenWidth: number;
	screenHeight: number;
	timeZone: string;
}
