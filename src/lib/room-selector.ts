import { rooms } from '@/lib/rooms-data';
import { AgeGroup, Room } from '@/types/room';
import { getAgeGroupFromAge, normalizeAgeGroup } from '@/lib/age-group';

export const AGE_GROUP_COOKIE_KEY = 'player_age_group';

export const getRoomsForAgeGroup = (ageGroup: AgeGroup): Room[] => {
	if (ageGroup === 'teen') {
		return rooms.filter(room => room.id >= 1 && room.id <= 30);
	}
	if (ageGroup === 'adult') {
		return rooms.filter(room => room.id >= 31 && room.id <= 60);
	}
	return rooms.filter(room => room.id >= 61 && room.id <= 90);
};

export { getAgeGroupFromAge, normalizeAgeGroup };
