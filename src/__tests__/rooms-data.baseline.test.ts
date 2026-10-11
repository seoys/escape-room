import test from 'node:test';
import assert from 'node:assert/strict';
import { rooms } from '@/lib/rooms-data';

test('rooms: 50 rooms with ids 1..50 in order', () => {
	assert.equal(rooms.length, 50);
	assert.deepEqual(
		rooms.map(room => room.id),
		Array.from({ length: 50 }, (_, index) => index + 1),
	);
});

test('rooms: tile-order answers equal the joined tiles', () => {
	for (const room of rooms) {
		for (const entry of [room, ...(room.variants ?? [])]) {
			if (entry.inputType !== 'tile-order') continue;
			const answers = Array.isArray(entry.answer)
				? entry.answer
				: [entry.answer];
			const joined = (entry.tiles ?? [])
				.join('')
				.toLowerCase()
				.replace(/\s+/g, '');
			assert.ok(
				answers.some(
					a => a.toLowerCase().replace(/\s+/g, '') === joined,
				),
				`room ${room.id} tile-order answer does not match tiles`,
			);
		}
	}
});
