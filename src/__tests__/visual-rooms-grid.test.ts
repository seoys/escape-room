import test from 'node:test';
import assert from 'node:assert/strict';
import { gridRooms } from '@/lib/visual-rooms/grid-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { initialOf } from './helpers/hangul';
import { GridCell, Room } from '@/types/room';

const byId = (id: number): Room => {
	const room = gridRooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

const gridOf = (room: Room): { rows: GridCell[][]; caption?: string } => {
	assert.equal(room.visual?.kind, 'grid');
	if (room.visual?.kind !== 'grid') throw new Error('not a grid');
	return { rows: room.visual.rows, caption: room.visual.caption };
};

const highlightedInReadingOrder = (rows: GridCell[][]): string[] =>
	rows
		.flat()
		.filter(c => c.mark === 'highlight')
		.map(c => c.text ?? '');

test('grid rooms: ids 4, 23, 26, 27, 29 and all pass validateRoom', () => {
	assert.deepEqual(
		gridRooms.map(r => r.id),
		[4, 23, 26, 27, 29],
	);
	for (const room of gridRooms) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
		);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 4: the answer takes one grid syllable per initial in the caption, in order', () => {
	const { rows, caption } = gridOf(byId(4));
	const wanted = (caption ?? '').match(/[ㄱ-ㅎ]/g) ?? [];
	const answer = [...(byId(4).answer as string)];
	assert.equal(answer.length, wanted.length);
	const syllables = rows.flat().map(c => c.text!);
	answer.forEach((syllable, index) => {
		assert.ok(syllables.includes(syllable), `${syllable} not in grid`);
		assert.equal(initialOf(syllable), wanted[index]);
	});
});

test('room 23: lit tiles read in reading order spell the answer', () => {
	const { rows } = gridOf(byId(23));
	assert.equal(highlightedInReadingOrder(rows).join(''), byId(23).answer);
});

test('room 26: right = left × (left + 1); the hidden cell equals the answer', () => {
	const { rows } = gridOf(byId(26));
	for (const [left, right] of rows) {
		const a = Number(left.text);
		if (right.mark === 'hidden') {
			assert.equal(String(a * (a + 1)), byId(26).answer);
		} else {
			assert.equal(Number(right.text), a * (a + 1));
		}
	}
});

test('room 27: fingerprint keys read in reading order give the code', () => {
	const { rows } = gridOf(byId(27));
	assert.equal(rows.length, 4);
	assert.equal(highlightedInReadingOrder(rows).join(''), byId(27).answer);
});

test('room 29: following the arrows from the lit cell collects the answer', () => {
	const { rows } = gridOf(byId(29));
	let r = rows.findIndex(row => row.some(c => c.mark === 'highlight'));
	let c = rows[r].findIndex(cell => cell.mark === 'highlight');
	const visited = new Set<string>();
	let word = '';
	for (;;) {
		const key = `${r},${c}`;
		assert.ok(!visited.has(key), 'arrow path loops');
		visited.add(key);
		const cell = rows[r][c];
		word += cell.text;
		if (!cell.arrow) break;
		if (cell.arrow === 'right') c += 1;
		if (cell.arrow === 'left') c -= 1;
		if (cell.arrow === 'down') r += 1;
		if (cell.arrow === 'up') r -= 1;
		assert.ok(rows[r]?.[c], 'arrow leaves the grid');
	}
	assert.equal(word, byId(29).answer);
});
