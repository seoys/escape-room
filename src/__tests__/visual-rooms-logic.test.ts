import test from 'node:test';
import assert from 'node:assert/strict';
import { noteRooms } from '@/lib/visual-rooms/note-rooms';
import { statementRooms } from '@/lib/visual-rooms/statement-rooms';
import { shapeRooms } from '@/lib/visual-rooms/shape-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { Room, ShapeCell } from '@/types/room';

const find = (rooms: Room[], id: number): Room => {
	const room = rooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

const noteLines = (room: Room): string[] => {
	assert.equal(room.visual?.kind, 'note');
	return room.visual?.kind === 'note' ? room.visual.lines : [];
};

test('rooms 14, 28, 25, 15, 22 pass validateRoom and carry no variants', () => {
	assert.deepEqual(
		noteRooms.map(r => r.id),
		[14, 28, 25],
	);
	assert.deepEqual(
		statementRooms.map(r => r.id),
		[15],
	);
	assert.deepEqual(
		shapeRooms.map(r => r.id),
		[22],
	);
	for (const room of [...noteRooms, ...statementRooms, ...shapeRooms]) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
		);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 14: the first syllable of every diary line spells the answer', () => {
	const room = find(noteRooms, 14);
	const acrostic = noteLines(room)
		.map(line => [...line][0])
		.join('');
	assert.equal(acrostic, room.answer);
});

test('room 28: the second syllable of every listed word spells the answer', () => {
	const room = find(noteRooms, 28);
	const picked = noteLines(room)
		.map(word => [...word][1])
		.join('');
	assert.equal(picked, room.answer);
});

test('room 25: the card that beats 7 is the answer, using the stated cycle', () => {
	const room = find(noteRooms, 25);
	// rules stated in the note: 7 > 3, 3 > 9, 9 > 7
	const beats: Record<string, string> = { '7': '3', '3': '9', '9': '7' };
	const winner = Object.keys(beats).find(card => beats[card] === '7');
	assert.equal(room.answer, winner);
	assert.deepEqual(
		room.options?.map(o => o.value),
		['3', '7', '9'],
	);
});

test('room 15: exactly one statement is false for exactly one suspect — the answer', () => {
	const room = find(statementRooms, 15);
	assert.equal(room.visual?.kind, 'statements');
	// suspects in speaker order: 1 집사, 2 요리사, 3 정원사, 4 하녀
	const statements: ((culprit: number) => boolean)[] = [
		culprit => culprit === 3, // 집사: "범인은 정원사입니다."
		culprit => culprit !== 4, // 요리사: "범인은 하녀가 아닙니다."
		culprit => culprit === 1, // 정원사: "범인은 집사입니다."
		culprit => culprit !== 3, // 하녀: "범인은 정원사가 아닙니다."
	];
	const consistent = [1, 2, 3, 4].filter(
		culprit => statements.filter(says => !says(culprit)).length === 1,
	);
	assert.deepEqual(consistent, [1]);
	assert.equal(room.answer, '1');
	assert.deepEqual(
		room.options?.map(o => o.value),
		['1', '2', '3', '4'],
	);
	if (room.visual?.kind === 'statements') {
		assert.deepEqual(
			room.visual.speakers.map(s => s.name),
			['집사', '요리사', '정원사', '하녀'],
		);
	}
});

test('room 22: hints describe fill by column, matching the picture (hollow cells sit in the middle column, not a row)', () => {
	const room = find(shapeRooms, 22);
	const hints = Array.isArray(room.hint) ? room.hint : [room.hint];
	assert.ok(
		!hints.join(' ').includes('가운데 줄'),
		'the middle row mixes filled and hollow shapes',
	);
	assert.ok(hints.join(' ').includes('가운데 칸'));
});

test('room 22: rows fix the shape, columns fix count and fill; the answer option completes the rule', () => {
	const room = find(shapeRooms, 22);
	assert.equal(room.visual?.kind, 'shape-matrix');
	if (room.visual?.kind !== 'shape-matrix') return;
	const cells = room.visual.cells;
	const rowShape = (row: number) => cells[row * 3].marks[0].shape;
	const expected = (row: number, col: number): ShapeCell => ({
		marks: (
			{ 0: [4], 1: [3, 5], 2: [3, 4, 5] } as Record<number, number[]>
		)[col].map(slot => ({
			shape: rowShape(row),
			filled: col !== 1,
			slot,
		})),
	});
	for (let index = 0; index < 8; index++) {
		assert.deepEqual(
			cells[index],
			expected(Math.floor(index / 3), index % 3),
			`cell ${index}`,
		);
	}
	const missing = expected(2, 2);
	const matching = room.options!.filter(
		o => JSON.stringify(o.cell) === JSON.stringify(missing),
	);
	assert.equal(
		matching.length,
		1,
		'exactly one option completes the pattern',
	);
	assert.equal(matching[0].value, room.answer);
	assert.deepEqual(
		room.options!.map(o => o.value),
		['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
	);
});
