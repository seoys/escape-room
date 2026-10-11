import { POOL_SIZE, TOTAL_ROOMS } from '@/lib/constants';

export const GAME_ROOMS_COOKIE_KEY = 'game_rooms';

// Used when there is no (valid) draw yet: the first TOTAL_ROOMS rooms in order.
export const DEFAULT_ROOM_IDS: number[] = Array.from(
	{ length: TOTAL_ROOMS },
	(_, index) => index + 1,
);

export function pickRoomIds(
	poolSize = POOL_SIZE,
	count = TOTAL_ROOMS,
	random: () => number = Math.random,
): number[] {
	const ids = Array.from({ length: poolSize }, (_, index) => index + 1);
	for (let i = ids.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[ids[i], ids[j]] = [ids[j], ids[i]];
	}
	return ids.slice(0, count);
}

export const serializeRoomIds = (ids: number[]): string => ids.join('.');

export function validRoomIds(
	ids: unknown,
	poolSize = POOL_SIZE,
	count = TOTAL_ROOMS,
): number[] | null {
	if (!Array.isArray(ids) || ids.length !== count) return null;
	const inRange = ids.every(
		id => Number.isInteger(id) && id >= 1 && id <= poolSize,
	);
	if (!inRange || new Set(ids).size !== count) return null;
	return ids as number[];
}

export function parseRoomIds(
	raw: string | null | undefined,
	poolSize = POOL_SIZE,
	count = TOTAL_ROOMS,
): number[] | null {
	if (!raw) return null;
	const ids = raw
		.split('.')
		.map(part => (/^\d+$/.test(part) ? Number(part) : NaN));
	return validRoomIds(ids, poolSize, count);
}

export const gameRoomsCookie = (ids: number[]): string =>
	`${GAME_ROOMS_COOKIE_KEY}=${serializeRoomIds(ids)}; path=/; max-age=2592000`;
