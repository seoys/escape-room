import test from 'node:test';
import assert from 'node:assert/strict';
import {
	LOCK_MS,
	MAX_WRONG,
	clearLockout,
	formatRemaining,
	lockoutNotice,
	readLockout,
	recordWrongAnswer,
	remainingMs,
	resolveLockout,
	writeLockout,
} from '@/lib/lockout';

const NOW = 1_700_000_000_000;

const fakeStorage = (initial: Record<string, string> = {}) => {
	const data = { ...initial };
	return {
		data,
		getItem: (key: string) => (key in data ? data[key] : null),
		setItem: (key: string, value: string) => {
			data[key] = value;
		},
		removeItem: (key: string) => {
			delete data[key];
		},
	};
};

test('constants: 5 wrong answers lock for 5 minutes', () => {
	assert.equal(MAX_WRONG, 5);
	assert.equal(LOCK_MS, 5 * 60 * 1000);
});

test('recordWrongAnswer counts up without locking before the limit', () => {
	let state = { wrongCount: 0, lockUntil: null as number | null };
	for (let i = 1; i < MAX_WRONG; i++) {
		state = recordWrongAnswer(state, NOW);
		assert.deepEqual(state, { wrongCount: i, lockUntil: null });
	}
});

test('recordWrongAnswer locks for LOCK_MS on the 5th wrong answer', () => {
	const state = recordWrongAnswer({ wrongCount: 4, lockUntil: null }, NOW);
	assert.deepEqual(state, { wrongCount: 5, lockUntil: NOW + LOCK_MS });
});

test('recordWrongAnswer ignores wrong answers while already locked', () => {
	const locked = { wrongCount: 5, lockUntil: NOW + 1000 };
	assert.deepEqual(recordWrongAnswer(locked, NOW), locked);
});

test('remainingMs: time left, zero when expired or not locked', () => {
	assert.equal(remainingMs(NOW + 90_000, NOW), 90_000);
	assert.equal(remainingMs(NOW - 1, NOW), 0);
	assert.equal(remainingMs(NOW, NOW), 0);
	assert.equal(remainingMs(null, NOW), 0);
});

test('resolveLockout resets the counter once the lock has expired', () => {
	assert.deepEqual(resolveLockout({ wrongCount: 5, lockUntil: NOW }, NOW), {
		wrongCount: 0,
		lockUntil: null,
	});
	assert.deepEqual(
		resolveLockout({ wrongCount: 5, lockUntil: NOW - 60_000 }, NOW),
		{ wrongCount: 0, lockUntil: null },
	);
});

test('resolveLockout keeps an active lock and a partial count unchanged', () => {
	const active = { wrongCount: 5, lockUntil: NOW + 10_000 };
	assert.deepEqual(resolveLockout(active, NOW), active);
	const partial = { wrongCount: 3, lockUntil: null };
	assert.deepEqual(resolveLockout(partial, NOW), partial);
});

test('resolveLockout caps a lock that lies further away than LOCK_MS (clock changed or tampered)', () => {
	const stretched = { wrongCount: 5, lockUntil: NOW + 10 * LOCK_MS };
	assert.deepEqual(resolveLockout(stretched, NOW), {
		wrongCount: 5,
		lockUntil: NOW + LOCK_MS,
	});
});

test('formatRemaining renders mm:ss and rounds partial seconds up', () => {
	assert.equal(formatRemaining(LOCK_MS), '05:00');
	assert.equal(formatRemaining(90_000), '01:30');
	assert.equal(formatRemaining(59_001), '01:00');
	assert.equal(formatRemaining(1), '00:01');
	assert.equal(formatRemaining(0), '00:00');
	assert.equal(formatRemaining(-5), '00:00');
});

test('lockoutNotice shows the running count and the rule', () => {
	assert.equal(
		lockoutNotice(2),
		'오답 2/5 · 5번 틀리면 5분간 문제를 풀 수 없습니다',
	);
	assert.equal(
		lockoutNotice(0),
		'오답 0/5 · 5번 틀리면 5분간 문제를 풀 수 없습니다',
	);
});

test('storage round trip: write, read, clear', () => {
	const storage = fakeStorage();
	writeLockout(storage, { wrongCount: 5, lockUntil: NOW + 5000 });
	assert.deepEqual(readLockout(storage), {
		wrongCount: 5,
		lockUntil: NOW + 5000,
	});
	clearLockout(storage);
	assert.deepEqual(readLockout(storage), { wrongCount: 0, lockUntil: null });
	assert.deepEqual(storage.data, {});
});

test('writeLockout removes lockUntil when not locked', () => {
	const storage = fakeStorage({ lockUntil: '123' });
	writeLockout(storage, { wrongCount: 2, lockUntil: null });
	assert.equal(storage.getItem('lockUntil'), null);
	assert.equal(storage.getItem('wrongCount'), '2');
});

test('readLockout survives missing and corrupted values', () => {
	assert.deepEqual(readLockout(fakeStorage()), {
		wrongCount: 0,
		lockUntil: null,
	});
	assert.deepEqual(
		readLockout(fakeStorage({ wrongCount: 'abc', lockUntil: 'xyz' })),
		{ wrongCount: 0, lockUntil: null },
	);
	assert.deepEqual(
		readLockout(fakeStorage({ wrongCount: '-3', lockUntil: '-1' })),
		{ wrongCount: 0, lockUntil: null },
	);
	assert.deepEqual(readLockout(fakeStorage({ wrongCount: '99' })), {
		wrongCount: MAX_WRONG,
		lockUntil: null,
	});
});
