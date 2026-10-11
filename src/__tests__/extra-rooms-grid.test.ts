import test from 'node:test';
import assert from 'node:assert/strict';
import { extraGridRooms } from '@/lib/visual-rooms/extra-grid-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { gridOf, roomById } from './helpers/find-room';

const byId = (id: number) => roomById(extraGridRooms, id);

test('extra grid rooms: ids 31, 34, 35, 39, 40, 41 pass validateRoom and carry no variants', () => {
	assert.deepEqual(
		extraGridRooms.map(r => r.id),
		[31, 34, 35, 39, 40, 41],
	);
	for (const room of extraGridRooms) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
		);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
		assert.ok(Array.isArray(room.hint) && room.hint.length >= 1);
	}
});

test('hidden cells never carry text (the masked answer must not be in the data)', () => {
	for (const room of extraGridRooms) {
		for (const cell of gridOf(room).rows.flat()) {
			if (cell.mark === 'hidden')
				assert.equal(cell.text, undefined, `room ${room.id}`);
		}
	}
});

test('room 31: blanks follow from the equal line sums (rows and columns agree) and read as the answer', () => {
	const { rows } = gridOf(byId(31));
	const sum = 15;
	assert.equal(
		rows[2].reduce((s, cell) => s + Number(cell.text), 0),
		sum,
	);
	const hiddenIn = (cells: { mark?: string }[]) =>
		cells.filter(c => c.mark === 'hidden').length;
	const filled: number[] = [];
	rows.forEach((row, r) =>
		row.forEach((cell, c) => {
			if (cell.mark !== 'hidden') return;
			const column = rows.map(other => other[c]);
			assert.equal(hiddenIn(row), 1);
			assert.equal(hiddenIn(column), 1);
			const byRow =
				sum -
				row.reduce(
					(s, o) => s + (o.mark === 'hidden' ? 0 : Number(o.text)),
					0,
				);
			const byCol =
				sum -
				column.reduce(
					(s, o) => s + (o.mark === 'hidden' ? 0 : Number(o.text)),
					0,
				);
			assert.equal(byRow, byCol, `cell ${r},${c}`);
			filled.push(byRow);
		}),
	);
	assert.equal(filled.join(''), byId(31).answer);
});

test('room 34: following the 8 caption commands from the lit cell ends on the answer', () => {
	const { rows, caption } = gridOf(byId(34));
	let r = rows.findIndex(row => row.some(c => c.mark === 'highlight'));
	let c = rows[r].findIndex(cell => cell.mark === 'highlight');
	const commands =
		((caption ?? '').split('명령:')[1] ?? '').match(/[↑↓←→]/g) ?? [];
	assert.equal(commands.length, 8);
	for (const command of commands) {
		r += command === '↓' ? 1 : command === '↑' ? -1 : 0;
		c += command === '→' ? 1 : command === '←' ? -1 : 0;
		assert.ok(rows[r]?.[c], 'a command leaves the grid');
	}
	assert.equal(rows[r][c].text, byId(34).answer);
});

test('room 35: the keypad code decodes (n presses = nth letter) to the answer', () => {
	const { rows, caption } = gridOf(byId(35));
	const tokens = ((caption ?? '').split('암호:')[1] ?? '')
		.trim()
		.split(/[\s·]+/)
		.filter(Boolean);
	assert.equal(tokens.length, 3);
	const word = tokens
		.map(token => {
			const cell = rows
				.flat()
				.find(c => c.text?.startsWith(`${token[0]} `));
			assert.ok(cell, `no key ${token[0]}`);
			return cell.text!.split(' ')[1][token.length - 1];
		})
		.join('');
	assert.equal(word, byId(35).answer);
});

test('room 39: the top-left to bottom-right diagonal spells the answer', () => {
	const { rows } = gridOf(byId(39));
	assert.equal(rows.length, rows[0].length);
	assert.equal(rows.map((row, i) => row[i].text).join(''), byId(39).answer);
});

test('room 40: the hidden sudoku cell is the single digit missing from its row and column', () => {
	const { rows } = gridOf(byId(40));
	const digits = [1, 2, 3, 4];
	let r = -1;
	let c = -1;
	rows.forEach((row, ri) =>
		row.forEach((cell, ci) => {
			if (cell.mark === 'hidden') {
				r = ri;
				c = ci;
			}
		}),
	);
	assert.ok(r >= 0, 'no hidden cell');
	const known = (cells: { text?: string }[]) =>
		cells.filter(x => x.text).map(x => Number(x.text));
	const missingInRow = digits.filter(d => !known(rows[r]).includes(d));
	const missingInCol = digits.filter(
		d => !known(rows.map(row => row[c])).includes(d),
	);
	assert.deepEqual(missingInRow, [Number(byId(40).answer)]);
	assert.deepEqual(missingInCol, [Number(byId(40).answer)]);
	// the given digits never repeat inside a row or a column
	for (const line of [
		...rows,
		...rows[0].map((_, ci) => rows.map(row => row[ci])),
	]) {
		const nums = known(line);
		assert.equal(new Set(nums).size, nums.length);
	}
});

test('room 41: letters step by +2, +3, +4, so the next step +5 gives the answer', () => {
	const { rows } = gridOf(byId(41));
	const letters = rows[0]
		.filter(c => c.mark !== 'hidden')
		.map(c => c.text!.charCodeAt(0));
	const steps = letters.slice(1).map((code, i) => code - letters[i]);
	assert.deepEqual(steps, [2, 3, 4]);
	assert.equal(
		String.fromCharCode(letters[letters.length - 1] + 5),
		byId(41).answer,
	);
});
