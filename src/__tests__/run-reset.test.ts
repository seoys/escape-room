import test from 'node:test';
import assert from 'node:assert/strict';
import { resetRunStorage } from '@/lib/run-reset';

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

const NOW = new Date('2026-10-11T12:00:00.000Z');

const oldRun = {
	startTime: '2026-10-10T08:00:00.000Z',
	endTime: '2026-10-10T09:00:00.000Z',
	currentRoom: '17',
	hintsRemaining: '0',
	hintsUsed: '3',
	score: '1450',
	combo: '4',
	bestCombo: '9',
	wrongCount: '5',
	lockUntil: String(NOW.getTime() + 60_000),
};

test('resetRunStorage restarts the clock at the given time', () => {
	const storage = fakeStorage(oldRun);
	resetRunStorage(storage, NOW);
	assert.equal(storage.getItem('startTime'), NOW.toISOString());
});

test('resetRunStorage clears a finished run (endTime) and the saved room', () => {
	const storage = fakeStorage(oldRun);
	resetRunStorage(storage, NOW);
	assert.equal(storage.getItem('endTime'), null);
	assert.equal(storage.getItem('currentRoom'), null);
});

test('resetRunStorage resets hints, score and combos', () => {
	const storage = fakeStorage(oldRun);
	resetRunStorage(storage, NOW);
	assert.equal(storage.getItem('hintsRemaining'), '3');
	assert.equal(storage.getItem('hintsUsed'), '0');
	assert.equal(storage.getItem('score'), '0');
	assert.equal(storage.getItem('combo'), '0');
	assert.equal(storage.getItem('bestCombo'), '0');
});

test('resetRunStorage clears the wrong-answer lockout', () => {
	const storage = fakeStorage(oldRun);
	resetRunStorage(storage, NOW);
	assert.equal(storage.getItem('wrongCount'), null);
	assert.equal(storage.getItem('lockUntil'), null);
});

test('resetRunStorage keeps the player identity and device info', () => {
	const identity = {
		playerName: '홍길동',
		playerKey: 'escape_홍길동_male_15',
		playerGender: 'male',
		playerAge: '15',
		playerLevel: '1',
		userHost: '1.2.3.4',
		userAgent: 'UA',
		userPlatform: 'MacIntel',
	};
	const storage = fakeStorage({ ...oldRun, ...identity });
	resetRunStorage(storage, NOW);
	for (const [key, value] of Object.entries(identity)) {
		assert.equal(storage.getItem(key), value, key);
	}
});

test('resetRunStorage works on an empty storage', () => {
	const storage = fakeStorage();
	resetRunStorage(storage, NOW);
	assert.equal(storage.getItem('startTime'), NOW.toISOString());
	assert.equal(storage.getItem('endTime'), null);
});
