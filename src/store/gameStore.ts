import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GameState } from '@/types/room';
import { getBrowserInfo, getIpAddress } from '@/lib/utils/userInfo';
interface GameStore extends GameState {
	initGame: () => Promise<void>;
	setCurrentRoom: (roomId: number) => void;
	consumeHint: () => void;
	completeRoom: (roomId: number) => void;
	setPlayerName: (name: string) => void;
	setHost: (host: string) => void;
	setUserAgent: (userAgent: string) => void;
	setPlatform: (platform: string) => void;
}

// @ts-expect-error - Complex type inference with zustand devtools
const store = set => ({
	currentRoom: 1,
	hintsRemaining: 3,
	completedRooms: [],
	startTime: undefined,
	endTime: undefined,
	playerName: '',
	host: '',
	userAgent: '',
	platform: '',

	initGame: async () => {
		localStorage.removeItem('currentRoom');
		const host = await getIpAddress();
		const browserInfo = await getBrowserInfo();

		set({
			currentRoom: 1,
			hintsRemaining: 3,
			completedRooms: [],
			startTime: new Date(),
			endTime: undefined,
			playerName: '',
			host: host,
			userAgent: browserInfo.userAgent,
			platform: browserInfo.platform,
		});
	},

	setHost: (host: string) => {
		localStorage.setItem('userHost', host.toString());
		set({ host });
	},

	setUserAgent: (userAgent: string) => {
		localStorage.setItem('userAgent', userAgent.toString());
		set({ userAgent });
	},

	setPlatform: (platform: string) => {
		localStorage.setItem('userPlatform', platform.toString());
		set({ platform });
	},

	setCurrentRoom: (roomId: number) => {
		localStorage.setItem('currentRoom', roomId.toString());
		set({ currentRoom: roomId });
	},

	setPlayerName: (name: string) => {
		localStorage.setItem('playerName', name.toString());
		set({ playerName: name });
	},

	consumeHint: () =>
		set((state: GameStore) => ({
			hintsRemaining: Math.max(0, state.hintsRemaining - 1),
		})),

	completeRoom: (roomId: number) =>
		set((state: GameStore) => {
			const completedRooms = [...state.completedRooms, roomId];
			const endTime = roomId === 10 ? new Date() : state.endTime;
			return { completedRooms, endTime };
		}),
});

export const useGameStore = create<GameStore>()(
	process.env.NODE_ENV !== 'production'
		? devtools(store, { name: 'game-store' })
		: store,
);
