import { AgeGroup } from '@/types/room';

export const getAgeGroupFromAge = (age: number): AgeGroup => {
	if (age <= 19) return 'teen';
	if (age <= 39) return 'adult';
	return 'senior';
};

export const normalizeAgeGroup = (value?: string | null): AgeGroup => {
	if (value === 'teen' || value === 'adult' || value === 'senior') {
		return value;
	}
	return 'adult';
};
