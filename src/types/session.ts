export interface StoredSession {
	name: string;
	host: string | null;
	userAgent: string | null;
	platform: string | null;
	now: string | null;
	roomId: number | 'finish';
	end?: string;
	seconds?: number;
	hintsRemaining?: number;
}
