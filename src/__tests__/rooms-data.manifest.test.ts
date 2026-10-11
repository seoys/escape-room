import test from 'node:test';
import assert from 'node:assert/strict';
import { rooms } from '@/lib/rooms-data';
import { getGameRooms } from '@/lib/room-selector';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';

type Expectation = { id: number; kind: string; inputType: string };

const REPLACED: Expectation[] = [
	{ id: 1, kind: 'symbol-rows', inputType: 'number' },
	{ id: 2, kind: 'symbol-rows', inputType: 'number' },
	{ id: 3, kind: 'symbol-rows', inputType: 'number' },
	{ id: 4, kind: 'image', inputType: 'number' },
	{ id: 5, kind: 'grid', inputType: 'number' },
	{ id: 6, kind: 'symbol-rows', inputType: 'number' },
	{ id: 7, kind: 'grid', inputType: 'number' },
	{ id: 8, kind: 'grid', inputType: 'text' },
	{ id: 9, kind: 'grid', inputType: 'text' },
	{ id: 10, kind: 'image', inputType: 'choice' },
	{ id: 11, kind: 'note', inputType: 'text' },
	{ id: 13, kind: 'grid', inputType: 'text' },
	{ id: 15, kind: 'note', inputType: 'text' },
	{ id: 16, kind: 'note', inputType: 'choice' },
	{ id: 18, kind: 'image', inputType: 'choice' },
	{ id: 19, kind: 'statements', inputType: 'choice' },
	{ id: 28, kind: 'image', inputType: 'number' },
	{ id: 30, kind: 'shape-matrix', inputType: 'choice' },
];

const ADDED: Expectation[] = [
	{ id: 31, kind: 'grid', inputType: 'number' },
	{ id: 32, kind: 'symbol-rows', inputType: 'number' },
	{ id: 33, kind: 'image', inputType: 'number' },
	{ id: 34, kind: 'grid', inputType: 'text' },
	{ id: 35, kind: 'grid', inputType: 'text' },
	{ id: 36, kind: 'note', inputType: 'text' },
	{ id: 37, kind: 'shape-matrix', inputType: 'choice' },
	{ id: 38, kind: 'note', inputType: 'choice' },
	{ id: 39, kind: 'grid', inputType: 'text' },
	{ id: 40, kind: 'grid', inputType: 'number' },
	{ id: 41, kind: 'grid', inputType: 'text' },
	{ id: 42, kind: 'note', inputType: 'combo-lock' },
	{ id: 43, kind: 'note', inputType: 'text' },
	{ id: 44, kind: 'note', inputType: 'text' },
	{ id: 45, kind: 'note', inputType: 'number' },
	{ id: 46, kind: 'note', inputType: 'number' },
	{ id: 47, kind: 'note', inputType: 'text' },
	{ id: 48, kind: 'note', inputType: 'number' },
	{ id: 49, kind: 'note', inputType: 'choice' },
	{ id: 50, kind: 'image', inputType: 'number' },
];

test('rooms: 50 rooms, ids 1..50 contiguous and in order', () => {
	assert.equal(rooms.length, 50);
	assert.deepEqual(
		rooms.map(r => r.id),
		Array.from({ length: 50 }, (_, i) => i + 1),
	);
});

test('getGameRooms: the default draw is rooms 1..30 in id order', () => {
	const defaultRooms = getGameRooms(undefined);
	assert.equal(defaultRooms.length, 30);
	assert.deepEqual(
		defaultRooms.map(r => r.id),
		Array.from({ length: 30 }, (_, i) => i + 1),
	);
});

for (const expected of REPLACED) {
	test(`room ${expected.id} uses the ${expected.kind} visual with ${expected.inputType} input`, () => {
		const room = rooms[expected.id - 1];
		assert.equal(room.id, expected.id);
		assert.equal(room.visual?.kind, expected.kind);
		assert.equal(room.inputType, expected.inputType);
		assert.equal(room.variants, undefined);
	});
}

for (const expected of ADDED) {
	test(`added room ${expected.id} uses the ${expected.kind} visual with ${expected.inputType} input`, () => {
		const room = rooms[expected.id - 1];
		assert.equal(room.id, expected.id);
		assert.equal(room.visual?.kind, expected.kind);
		assert.equal(room.inputType, expected.inputType);
		assert.equal(room.variants, undefined);
	});
}

test('room 24 is the image tile-order room', () => {
	const room = rooms[23];
	assert.equal(room.id, 24);
	assert.equal(room.inputType, 'tile-order');
	assert.ok(room.tileImages);
});

test('every room (legacy and new) passes validateRoom', () => {
	for (const room of rooms) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
			`room ${room.id}`,
		);
	}
});

test('the remaining legacy rooms are untouched text rooms (no visual)', () => {
	const withVisual = new Set([
		...REPLACED.map(r => r.id),
		24,
		...ADDED.map(r => r.id),
	]);
	assert.equal(withVisual.size, 39);
	for (const room of rooms) {
		if (!withVisual.has(room.id))
			assert.equal(room.visual, undefined, `room ${room.id}`);
	}
	assert.deepEqual(
		rooms.filter(r => !withVisual.has(r.id)).map(r => r.id),
		[12, 14, 17, 20, 21, 22, 23, 25, 26, 27, 29],
	);
});
