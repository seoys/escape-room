export interface StoredSession {
	name: string;
	displayName?: string;
	gender?: string;
	age?: number;
	roomIds?: number[];
	host: string | null;
	userAgent: string | null;
	platform: string | null;
	now: string | null;
	roomId: number | 'finish';
	end?: string;
	seconds?: number;
	hintsRemaining?: number;
}
