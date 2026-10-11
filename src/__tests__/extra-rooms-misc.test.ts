import test from 'node:test';
import assert from 'node:assert/strict';
import { extraMiscRooms } from '@/lib/visual-rooms/extra-misc-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { roomById } from './helpers/find-room';
import { ShapeCell, ShapeName } from '@/types/room';
import { SPOT_DIFFERENCE_COUNT } from './helpers/spot-differences';

const byId = (id: number) => roomById(extraMiscRooms, id);

test('extra misc rooms: ids 33, 37, 50 pass validateRoom (files exist)', () => {
	assert.deepEqual(
		extraMiscRooms.map(r => r.id),
		[33, 37, 50],
	);
	for (const room of extraMiscRooms) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
		);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 33: the answer matches the number of differences between the two drawings', () => {
	assert.equal(String(SPOT_DIFFERENCE_COUNT), byId(33).answer);
});

test('room 37: each row uses every shape once with row-number many shapes; the answer option completes it', () => {
	const room = byId(37);
	assert.equal(room.visual?.kind, 'shape-matrix');
	if (room.visual?.kind !== 'shape-matrix') return;
	const cells = room.visual.cells;
	assert.equal(cells.length, 8);
	const shapeOf = (cell: ShapeCell) => cell.marks[0].shape;
	const rows = [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6, 8)];
	rows.forEach((row, index) => {
		for (const cell of row) {
			assert.equal(
				cell.marks.length,
				index + 1,
				'count equals row number',
			);
			assert.ok(cell.marks.every(m => m.filled));
		}
	});
	const all: ShapeName[] = ['circle', 'square', 'triangle'];
	assert.deepEqual(
		[...new Set(rows[0].map(shapeOf))].sort(),
		[...all].sort(),
	);
	assert.deepEqual(
		[...new Set(rows[1].map(shapeOf))].sort(),
		[...all].sort(),
	);
	const missingShape = all.find(s => !rows[2].map(shapeOf).includes(s))!;
	const expected = JSON.stringify({
		marks: [3, 4, 5].map(slot => ({
			shape: missingShape,
			filled: true,
			slot,
		})),
	});
	const matching = room.options!.filter(
		o => JSON.stringify(o.cell) === expected,
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

test('room 50: a 3x3 grid contains 14 squares (9 + 4 + 1)', () => {
	const cells = 3;
	let squares = 0;
	for (let size = 1; size <= cells; size++)
		squares += (cells - size + 1) ** 2;
	assert.equal(String(squares), byId(50).answer);
});
