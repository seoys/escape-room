import { rooms } from '@/lib/rooms-data';
import { AgeGroup, Room } from '@/types/room';

export const AGE_GROUP_COOKIE_KEY = 'player_age_group';

export const getAgeGroupFromAge = (age: number): AgeGroup => {
	if (age <= 19) return 'teen';
	if (age <= 39) return 'adult';
	return 'senior';
};

export const getRoomsForAgeGroup = (ageGroup: AgeGroup): Room[] => {
	if (ageGroup === 'teen') {
		return rooms.filter(room => room.id >= 1 && room.id <= 30);
	}
	if (ageGroup === 'adult') {
		return rooms.filter(room => room.id >= 31 && room.id <= 60);
	}
	return rooms.filter(room => room.id >= 61 && room.id <= 90);
};

export const normalizeAgeGroup = (value?: string | null): AgeGroup => {
	if (value === 'teen' || value === 'adult' || value === 'senior') {
		return value;
	}
	return 'adult';
};
