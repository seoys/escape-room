import test from 'node:test';
import assert from 'node:assert/strict';
import { getGameRooms, resolveRoomIds } from '@/lib/room-selector';
import {
	DEFAULT_ROOM_IDS,
	pickRoomIds,
	serializeRoomIds,
} from '@/lib/room-pool';
import { isCorrectAnswer } from '@/lib/answer-check';

test('getGameRooms returns the cookie rooms in cookie order', () => {
	const ids = pickRoomIds();
	const rooms = getGameRooms(serializeRoomIds(ids));
	assert.equal(rooms.length, 30);
	assert.deepEqual(
		rooms.map(r => r.id),
		ids,
	);
});

test('getGameRooms falls back to rooms 1..30 for a missing or tampered cookie', () => {
	for (const raw of [undefined, null, '', '1.2.3', 'abc', '1.1.1', '99.98']) {
		assert.deepEqual(
			getGameRooms(raw).map(r => r.id),
			DEFAULT_ROOM_IDS,
			String(raw),
		);
		assert.deepEqual(resolveRoomIds(raw), DEFAULT_ROOM_IDS);
	}
});

test('the page room and the verified room are the same position in the same draw', () => {
	const ids = pickRoomIds();
	const raw = serializeRoomIds(ids);
	for (const position of [1, 15, 30]) {
		const room = getGameRooms(raw)[position - 1];
		assert.equal(room.id, ids[position - 1]);
		const answer = Array.isArray(room.answer)
			? room.answer[0]
			: room.answer;
		assert.equal(isCorrectAnswer(room, answer), true);
	}
});
