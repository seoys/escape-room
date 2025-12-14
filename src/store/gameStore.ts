import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GameState } from '@/types/room';
import { getBrowserInfo, getIpAddress } from '@/lib/utils/userInfo';
import { rooms } from '@/lib/rooms';

const getInitialHintsRemaining = () => {
	if (typeof window === 'undefined') return 3;
	const stored = parseInt(
		(localStorage.getItem('hintsRemaining') as string) ?? '',
		10,
	);
	if (Number.isFinite(stored) && stored >= 0) return stored;
	return 3;
};
interface GameStore extends GameState {
	initGame: () => Promise<void>;
	setCurrentRoom: (roomId: number) => void;
	consumeHint: () => void;
	completeRoom: (roomId: number) => void;
	setPlayerName: (name: string) => void;
	setHintsRemaining: (value: number) => void;
}

// @ts-expect-error - Complex type inference with zustand devtools
const store = set => ({
	currentRoom: 1,
	hintsRemaining: getInitialHintsRemaining(),
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

		localStorage.setItem('userHost', host.toString());
		localStorage.setItem('userAgent', browserInfo.userAgent);
		localStorage.setItem('userPlatform', browserInfo.platform);
		localStorage.setItem('startTime', new Date().toISOString());
		localStorage.setItem('hintsRemaining', '3');
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

	setCurrentRoom: (roomId: number) => {
		localStorage.setItem('currentRoom', roomId.toString());
		set({ currentRoom: roomId });
	},

	setPlayerName: (name: string) => {
		localStorage.setItem('playerName', name.toString());
		set({ playerName: name });
	},

	setHintsRemaining: (value: number) => {
		localStorage.setItem('hintsRemaining', value.toString());
		set({ hintsRemaining: value });
	},

	consumeHint: () =>
		set((state: GameStore) => {
			const nextHints = Math.max(0, state.hintsRemaining - 1);
			if (typeof window !== 'undefined') {
				localStorage.setItem('hintsRemaining', nextHints.toString());
			}
			return { hintsRemaining: nextHints };
		}),

	completeRoom: (roomId: number) =>
		set((state: GameStore) => {
			const completedRooms = [...state.completedRooms, roomId];
			const isFinalRoom =
				roomId >= rooms[rooms.length - 1]?.id &&
				typeof window !== 'undefined';
			const endTime = isFinalRoom ? new Date() : state.endTime;

			if (isFinalRoom && endTime) {
				localStorage.setItem('endTime', endTime.toISOString());
			}

			return { completedRooms, endTime };
		}),
});

export const useGameStore = create<GameStore>()(
	process.env.NODE_ENV !== 'production'
		? devtools(store, { name: 'game-store' })
		: store,
);
