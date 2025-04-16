import { create } from 'zustand';
import { GameState } from '@/types/room';

interface GameStore extends GameState {
	initGame: () => void;
	setCurrentRoom: (roomId: number) => void;
	consumeHint: () => void;
	completeRoom: (roomId: number) => void;
	setPlayerName: (name: string) => void;
	setHost: (host: string) => void;
	setUserAgent: (userAgent: string) => void;
	setLanguage: (language: string) => void;
	setPlatform: (platform: string) => void;
	setScreenWidth: (screenWidth: number) => void;
	setScreenHeight: (screenHeight: number) => void;
	setTimeZone: (timeZone: string) => void;
}

export const useGameStore = create<GameStore>(set => ({
	currentRoom: 1,
	hintsRemaining: 3,
	completedRooms: [],
	startTime: undefined,
	endTime: undefined,
	playerName: '',
	host: '',
	userAgent: '',
	language: '',
	platform: '',
	screenWidth: 0,
	screenHeight: 0,
	timeZone: '',

	initGame: () => {
		localStorage.removeItem('currentRoom');
		set({
			currentRoom: 1,
			hintsRemaining: 3,
			completedRooms: [],
			startTime: new Date(),
			endTime: undefined,
			playerName: '',
		});
	},

	setHost: host => {
		set({ host });
	},

	setUserAgent: userAgent => {
		set({ userAgent });
	},

	setLanguage: language => {
		set({ language });
	},

	setPlatform: platform => {
		set({ platform });
	},

	setScreenWidth: screenWidth => {
		set({ screenWidth });
	},

	setScreenHeight: screenHeight => {
		set({ screenHeight });
	},

	setTimeZone: timeZone => {
		set({ timeZone });
	},

	setCurrentRoom: roomId => {
		localStorage.setItem('currentRoom', roomId.toString());
		set({ currentRoom: roomId });
	},

	setPlayerName: name => {
		set({ playerName: name });
	},

	consumeHint: () =>
		set(state => ({
			hintsRemaining: Math.max(0, state.hintsRemaining - 1),
		})),

	completeRoom: roomId =>
		set(state => {
			const completedRooms = [...state.completedRooms, roomId];
			const endTime = roomId === 10 ? new Date() : state.endTime;
			return { completedRooms, endTime };
		}),
}));
