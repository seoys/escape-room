import { rooms } from '@/lib/rooms-data';
import {
	DEFAULT_ROOM_IDS,
	GAME_ROOMS_COOKIE_KEY,
	parseRoomIds,
} from '@/lib/room-pool';
import { Room } from '@/types/room';

export { GAME_ROOMS_COOKIE_KEY };

// The draw stored in the game_rooms cookie, or rooms 1..30 when it is missing/invalid.
export const resolveRoomIds = (raw?: string | null): number[] =>
	parseRoomIds(raw) ?? DEFAULT_ROOM_IDS;

// The player's 30 rooms in play order. Both the room page and verifyAnswer use this,
// so what is shown and what is checked always agree.
export const getGameRooms = (raw?: string | null): Room[] => {
	const byId = new Map(rooms.map(room => [room.id, room]));
	return resolveRoomIds(raw)
		.map(id => byId.get(id))
		.filter((room): room is Room => room !== undefined);
};
