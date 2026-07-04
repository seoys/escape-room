import { Level } from '@/types/room';

export const getLevelFromAge = (age: number): Level => {
	if (age <= 19) return 1;
	if (age <= 29) return 2;
	if (age <= 39) return 3;
	return 4;
};

export const normalizeLevel = (value?: string | null): Level => {
	const parsed = Number(value);
	if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) {
		return parsed;
	}
	return 2;
};
