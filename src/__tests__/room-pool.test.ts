import test from 'node:test';
import assert from 'node:assert/strict';
import {
	DEFAULT_ROOM_IDS,
	GAME_ROOMS_COOKIE_KEY,
	gameRoomsCookie,
	parseRoomIds,
	pickRoomIds,
	serializeRoomIds,
	validRoomIds,
} from '@/lib/room-pool';

test('constants: 30 rooms are drawn from a pool of 50', () => {
	assert.equal(GAME_ROOMS_COOKIE_KEY, 'game_rooms');
	assert.deepEqual(
		DEFAULT_ROOM_IDS,
		Array.from({ length: 30 }, (_, i) => i + 1),
	);
});

test('pickRoomIds returns 30 unique ids from 1..50', () => {
	for (let i = 0; i < 50; i++) {
		const ids = pickRoomIds();
		assert.equal(ids.length, 30);
		assert.equal(new Set(ids).size, 30);
		assert.ok(ids.every(id => Number.isInteger(id) && id >= 1 && id <= 50));
	}
});

test('pickRoomIds is deterministic for a fixed random source', () => {
	// random() = 0 swaps every position with index 0: [1,2,3,4,5] -> [2,3,4,5,1]
	assert.deepEqual(
		pickRoomIds(5, 3, () => 0),
		[2, 3, 4],
	);
	assert.deepEqual(
		pickRoomIds(5, 3, () => 0),
		pickRoomIds(5, 3, () => 0),
	);
});

test('pickRoomIds differs between plays (order and membership are random)', () => {
	const seen = new Set<string>();
	for (let i = 0; i < 20; i++) seen.add(serializeRoomIds(pickRoomIds()));
	assert.ok(seen.size > 1);
});

test('serialize / parse round trip', () => {
	const ids = pickRoomIds();
	assert.deepEqual(parseRoomIds(serializeRoomIds(ids)), ids);
	assert.equal(serializeRoomIds([12, 3, 45]), '12.3.45');
});

test('parseRoomIds rejects tampered or incomplete cookie values', () => {
	const good = serializeRoomIds(pickRoomIds());
	assert.equal(parseRoomIds(undefined), null);
	assert.equal(parseRoomIds(null), null);
	assert.equal(parseRoomIds(''), null);
	assert.equal(parseRoomIds('1.2.3'), null); // too short
	assert.equal(parseRoomIds(good + '.7'), null); // too long
	assert.equal(parseRoomIds(good.replace(/^\d+/, '99')), null); // out of range
	assert.equal(parseRoomIds(good.replace(/^\d+/, '0')), null);
	assert.equal(parseRoomIds(good.replace(/^\d+/, 'abc')), null);
	assert.equal(parseRoomIds(good.replace(/^\d+/, '-3')), null);
	assert.equal(parseRoomIds(good.replace(/^\d+/, '1.5')), null);
	const dup = serializeRoomIds([
		...Array(29)
			.fill(0)
			.map((_, i) => i + 1),
		1,
	]);
	assert.equal(parseRoomIds(dup), null); // duplicate id
});

test('validRoomIds accepts only a full, unique, in-range id array', () => {
	assert.deepEqual(validRoomIds(DEFAULT_ROOM_IDS), DEFAULT_ROOM_IDS);
	assert.equal(validRoomIds(undefined), null);
	assert.equal(validRoomIds('1.2.3'), null);
	assert.equal(validRoomIds([1, 2, 3]), null);
	assert.equal(validRoomIds([...DEFAULT_ROOM_IDS.slice(1), 51]), null);
	assert.equal(validRoomIds([...DEFAULT_ROOM_IDS.slice(1), 2]), null);
	assert.equal(validRoomIds([...DEFAULT_ROOM_IDS.slice(1), 1.5]), null);
});

test('gameRoomsCookie builds a 30-day cookie string', () => {
	assert.equal(
		gameRoomsCookie([12, 3, 45]),
		'game_rooms=12.3.45; path=/; max-age=2592000',
	);
});
