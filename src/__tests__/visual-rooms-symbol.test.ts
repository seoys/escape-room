import test from 'node:test';
import assert from 'node:assert/strict';
import { symbolRooms } from '@/lib/visual-rooms/symbol-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { countJamo } from './helpers/hangul';
import { Room, SymbolRow } from '@/types/room';

const byId = (id: number): Room => {
	const room = symbolRooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

const rowsOf = (room: Room): SymbolRow[] => {
	assert.equal(room.visual?.kind, 'symbol-rows');
	return room.visual?.kind === 'symbol-rows' ? room.visual.rows : [];
};

test('symbol rooms: ids 2, 7, 12, 16 and all pass validateRoom', () => {
	assert.deepEqual(
		symbolRooms.map(r => r.id),
		[2, 7, 12, 16],
	);
	for (const room of symbolRooms) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
		);
		assert.equal(room.variants, undefined);
		assert.equal(room.inputType, 'number');
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 2: the emoji equations resolve to the stored answer', () => {
	const rows = rowsOf(byId(2));
	const glyphs = [
		...new Set(
			rows.flatMap(r => r.items.map(i => i.glyph).filter(Boolean)),
		),
	] as string[];
	const evaluate = (
		row: SymbolRow,
		values: Record<string, number>,
	): number => {
		// × binds tighter than +
		const terms: number[] = [];
		let pendingMultiply = false;
		let current: number | null = null;
		for (const item of row.items) {
			if (item.glyph) {
				const v = values[item.glyph];
				if (pendingMultiply && current !== null) {
					current *= v;
					pendingMultiply = false;
				} else {
					if (current !== null) terms.push(current);
					current = v;
				}
			} else if (item.op === '×') pendingMultiply = true;
		}
		if (current !== null) terms.push(current);
		return terms.reduce((sum, t) => sum + t, 0);
	};
	const solutions: Record<string, number>[] = [];
	const limit = 20;
	const search = (index: number, values: Record<string, number>) => {
		if (index === glyphs.length) {
			const ok = rows
				.filter(r => r.value !== undefined)
				.every(r => evaluate(r, values) === Number(r.value));
			if (ok) solutions.push({ ...values });
			return;
		}
		for (let v = 1; v <= limit; v++)
			search(index + 1, { ...values, [glyphs[index]]: v });
	};
	search(0, {});
	assert.equal(solutions.length, 1, 'equations must have a unique solution');
	const question = rows.find(r => r.value === undefined)!;
	assert.equal(String(evaluate(question, solutions[0])), byId(2).answer);
});

test('room 7: rainbow colors map to digits consistently and the question row matches', () => {
	const rows = rowsOf(byId(7));
	const digitOf: Record<string, string> = {};
	for (const row of rows.filter(r => r.value !== undefined)) {
		const colors = row.items.map(i => i.color!);
		assert.equal(colors.length, row.value!.length);
		colors.forEach((color, index) => {
			const digit = row.value![index];
			assert.ok(
				digitOf[color] === undefined || digitOf[color] === digit,
				`inconsistent ${color}`,
			);
			digitOf[color] = digit;
		});
	}
	const question = rows.find(r => r.value === undefined)!;
	assert.equal(
		question.items.map(i => digitOf[i.color!]).join(''),
		byId(7).answer,
	);
});

test('room 7: every lamp names its color so it can be told apart without sight of hue', () => {
	const labelOf: Record<string, string> = {};
	for (const row of rowsOf(byId(7))) {
		for (const item of row.items) {
			assert.ok(item.label, `lamp ${item.color} has no label`);
			assert.ok(
				labelOf[item.color!] === undefined ||
					labelOf[item.color!] === item.label,
				`${item.color} has two labels`,
			);
			labelOf[item.color!] = item.label!;
		}
	}
	assert.equal(
		new Set(Object.values(labelOf)).size,
		Object.keys(labelOf).length,
		'different colors need different labels',
	);
});

test('room 12: clock arithmetic wraps at 12 and the question row matches', () => {
	const rows = rowsOf(byId(12));
	const visual = byId(12).visual;
	assert.equal(
		visual?.kind === 'symbol-rows' ? visual.background : undefined,
		'clock',
	);
	const clockSum = (row: SymbolRow) => {
		const [a, b] = row.items.filter(i => i.glyph).map(i => Number(i.glyph));
		return ((a + b - 1) % 12) + 1;
	};
	for (const row of rows.filter(r => r.value !== undefined)) {
		assert.equal(clockSum(row), Number(row.value));
	}
	assert.equal(
		String(clockSum(rows.find(r => r.value === undefined)!)),
		byId(12).answer,
	);
});

test('room 16: each word value equals its count of ㅇ and the question matches', () => {
	const rows = rowsOf(byId(16));
	for (const row of rows.filter(r => r.value !== undefined)) {
		assert.equal(
			countJamo(row.items[0].glyph!, 'ㅇ'),
			Number(row.value),
			row.items[0].glyph,
		);
	}
	const question = rows.find(r => r.value === undefined)!;
	assert.equal(
		String(countJamo(question.items[0].glyph!, 'ㅇ')),
		byId(16).answer,
	);
});
