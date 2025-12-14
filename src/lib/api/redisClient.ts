import { StoredSession } from '@/types/session';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

const buildUrl = (path: string) =>
	apiBaseUrl ? `${apiBaseUrl}${path}` : null;

const parseJsonSafe = <T>(value: string | null | undefined): T | null => {
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch (error) {
		console.error('Failed to parse session payload', error);
		return null;
	}
};

const request = async <T>(path: string, init?: RequestInit) => {
	const url = buildUrl(path);
	if (!url) return null;

	let response: Response | null = null;

	try {
		response = await fetch(url, init);
	} catch (error) {
		console.warn('Redis API fetch failed', error);
		return null;
	}

	if (!response) return null;
	if (!response.ok) {
		console.warn('Redis API request failed', response.status);
		return null;
	}

	try {
		return (await response.json()) as T;
	} catch (error) {
		console.warn('Redis API parse failed', error);
		return null;
	}
};

export const readSession = async (playerName: string) => {
	if (!playerName || !apiBaseUrl?.trim()) return null;

	const response = await request<{ result?: string }>(
		`/v1/redis/escape_${playerName}`,
	);

	return parseJsonSafe<StoredSession>(response?.result);
};

export const writeSession = async (
	playerName: string,
	payload: StoredSession,
) => {
	if (!playerName || !apiBaseUrl?.trim()) return false;

	try {
		const result = await request(
			`/v1/redis/escape_${playerName}?data=${encodeURIComponent(JSON.stringify(payload))}`,
			{ method: 'POST' },
		);

		return Boolean(result);
	} catch (error) {
		console.error('writeSession failed', error);
		return false;
	}
};

export const fetchLeaderboardSessions = async (prefix = 'escape_') => {
	const response = await request<{ result?: Record<string, string> }>(
		`/v1/redis/search/${prefix}`,
	);

	if (!response?.result) return [];

	return Object.values(response.result)
		.map(value => parseJsonSafe<StoredSession>(value))
		.filter(
			(
				session,
			): session is StoredSession &
				Required<Pick<StoredSession, 'seconds'>> => !!session?.seconds,
		)
		.sort((a, b) => a.seconds - b.seconds);
};
