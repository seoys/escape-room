import test from 'node:test';
import assert from 'node:assert/strict';
import { rooms } from '@/lib/rooms-data';
import { getRoomsForLevel } from '@/lib/room-selector';
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

test('rooms: 120 rooms, ids 1..120 contiguous and in order', () => {
	assert.equal(rooms.length, 120);
	assert.deepEqual(
		rooms.map(r => r.id),
		Array.from({ length: 120 }, (_, i) => i + 1),
	);
});

test('rooms: each level still gets exactly 30 rooms in id order', () => {
	for (const level of [1, 2, 3, 4] as const) {
		const levelRooms = getRoomsForLevel(level);
		assert.equal(levelRooms.length, 30, `level ${level}`);
		assert.deepEqual(
			levelRooms.map(r => r.id),
			Array.from({ length: 30 }, (_, i) => (level - 1) * 30 + i + 1),
		);
	}
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
	const replaced = new Set([...REPLACED.map(r => r.id), 24]);
	assert.equal(replaced.size, 19);
	for (const room of rooms) {
		if (!replaced.has(room.id))
			assert.equal(room.visual, undefined, `room ${room.id}`);
	}
});
