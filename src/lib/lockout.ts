// Wrong-answer lockout: MAX_WRONG wrong answers in the whole game lock answering
// for LOCK_MS; when the lock ends the counter starts over. State lives in
// localStorage so a refresh or a room change cannot skip the lock.

export const MAX_WRONG = 5;
export const LOCK_MS = 5 * 60 * 1000;

const WRONG_COUNT_KEY = 'wrongCount';
const LOCK_UNTIL_KEY = 'lockUntil';

export interface LockoutState {
	wrongCount: number;
	lockUntil: number | null;
}

export const NO_LOCKOUT: LockoutState = { wrongCount: 0, lockUntil: null };

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function recordWrongAnswer(
	state: LockoutState,
	now: number,
): LockoutState {
	if (state.lockUntil !== null) return state;
	const wrongCount = state.wrongCount + 1;
	return wrongCount >= MAX_WRONG
		? { wrongCount: MAX_WRONG, lockUntil: now + LOCK_MS }
		: { wrongCount, lockUntil: null };
}

export function remainingMs(lockUntil: number | null, now: number): number {
	return lockUntil === null ? 0 : Math.max(0, lockUntil - now);
}

// Expired lock -> fresh counter. A lock further away than LOCK_MS cannot have been
// set by recordWrongAnswer (clock moved back, edited storage), so it is capped.
export function resolveLockout(state: LockoutState, now: number): LockoutState {
	if (state.lockUntil === null) return state;
	if (state.lockUntil <= now) return NO_LOCKOUT;
	return state.lockUntil > now + LOCK_MS
		? { ...state, lockUntil: now + LOCK_MS }
		: state;
}

export function formatRemaining(ms: number): string {
	const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function lockoutNotice(wrongCount: number): string {
	return `오답 ${wrongCount}/${MAX_WRONG} · ${MAX_WRONG}번 틀리면 ${LOCK_MS / 60000}분간 문제를 풀 수 없습니다`;
}

export function readLockout(storage: StorageLike): LockoutState {
	const count = parseInt(storage.getItem(WRONG_COUNT_KEY) ?? '', 10);
	const until = parseInt(storage.getItem(LOCK_UNTIL_KEY) ?? '', 10);
	return {
		wrongCount:
			Number.isFinite(count) && count > 0
				? Math.min(count, MAX_WRONG)
				: 0,
		lockUntil: Number.isFinite(until) && until > 0 ? until : null,
	};
}

export function writeLockout(storage: StorageLike, state: LockoutState): void {
	storage.setItem(WRONG_COUNT_KEY, String(state.wrongCount));
	if (state.lockUntil === null) storage.removeItem(LOCK_UNTIL_KEY);
	else storage.setItem(LOCK_UNTIL_KEY, String(state.lockUntil));
}

export function clearLockout(storage: StorageLike): void {
	storage.removeItem(WRONG_COUNT_KEY);
	storage.removeItem(LOCK_UNTIL_KEY);
}
