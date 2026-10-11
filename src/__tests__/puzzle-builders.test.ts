import test from 'node:test';
import assert from 'node:assert/strict';
import { shapeCell, symRow } from '@/lib/puzzle-builders';

test('symRow: operators become op items, others become glyph items', () => {
	assert.deepEqual(symRow(['3', '+', '4'], '7'), {
		items: [{ glyph: '3' }, { op: '+' }, { glyph: '4' }],
		value: '7',
	});
});

test('symRow: omits value for the question row and keeps item objects', () => {
	const row = symRow([{ color: '#c0392b' }, '×', '🕰️']);
	assert.deepEqual(row, {
		items: [{ color: '#c0392b' }, { op: '×' }, { glyph: '🕰️' }],
	});
	assert.equal('value' in row, false);
});

test('shapeCell: places marks in the middle row slots by count', () => {
	assert.deepEqual(
		shapeCell('circle', true, 1).marks.map(m => m.slot),
		[4],
	);
	assert.deepEqual(
		shapeCell('square', false, 2).marks.map(m => m.slot),
		[3, 5],
	);
	assert.deepEqual(
		shapeCell('triangle', true, 3).marks.map(m => m.slot),
		[3, 4, 5],
	);
	assert.equal(shapeCell('diamond', false, 2).marks[0].filled, false);
});
