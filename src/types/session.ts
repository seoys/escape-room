export interface StoredSession {
	name: string;
	displayName?: string;
	gender?: string;
	age?: number;
	ageGroup?: 'teen' | 'adult' | 'senior';
	host: string | null;
	userAgent: string | null;
	platform: string | null;
	now: string | null;
	roomId: number | 'finish';
	end?: string;
	seconds?: number;
	hintsRemaining?: number;
}
