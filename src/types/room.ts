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
  startTime?: Date;
  endTime?: Date;
}
