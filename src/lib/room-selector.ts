import { rooms } from '@/lib/rooms-data';
import { Level, Room } from '@/types/room';
import { getLevelFromAge, normalizeLevel } from '@/lib/age-group';

export const LEVEL_COOKIE_KEY = 'player_level';

export const getRoomsForLevel = (level: Level): Room[] => {
	if (level === 1) {
		return rooms.filter(room => room.id >= 1 && room.id <= 30);
	}
	if (level === 2) {
		return rooms.filter(room => room.id >= 31 && room.id <= 60);
	}
	if (level === 3) {
		return rooms.filter(room => room.id >= 61 && room.id <= 90);
	}
	return rooms.filter(room => room.id >= 91 && room.id <= 120);
};

export { getLevelFromAge, normalizeLevel };
