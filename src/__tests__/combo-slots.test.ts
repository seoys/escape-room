import test from 'node:test';
import assert from 'node:assert/strict';
import {
	backspaceSlot,
	changeSlot,
	fromSlots,
	isComplete,
	toSlots,
} from '@/lib/combo-slots';

const type = (slots: string[], index: number, raw: string) =>
	changeSlot(slots, index, raw).slots;

test('typing digits in order builds the value and moves the focus on', () => {
	let slots = toSlots('', 4);
	const focus: (number | null)[] = [];
	for (const [index, digit] of ['2', '5', '7', '6'].entries()) {
		const result = changeSlot(slots, index, digit);
		slots = result.slots;
		focus.push(result.focus);
	}
	assert.equal(fromSlots(slots), '2576');
	assert.deepEqual(focus, [1, 2, 3, null]);
	assert.equal(isComplete(slots), true);
});

test('clearing a slot in the middle keeps the other digits in their places', () => {
	const slots = toSlots('2376', 4);
	const cleared = type(slots, 1, '');
	assert.deepEqual(cleared, ['2', '', '7', '6']);
	assert.equal(fromSlots(cleared), '2 76');
	assert.equal(isComplete(cleared), false);
	// typing the right digit afterwards fixes the code
	assert.equal(fromSlots(type(cleared, 1, '5')), '2576');
});

test('typing into a later slot first does not drop the digit into slot 1', () => {
	const slots = type(toSlots('', 4), 2, '7');
	assert.deepEqual(slots, ['', '', '7', '']);
	assert.equal(fromSlots(slots), '  7');
	assert.deepEqual(toSlots('  7', 4), ['', '', '7', '']);
});

test('backspace on an empty slot clears the previous slot and moves the focus there', () => {
	const slots = toSlots('25', 4);
	const result = backspaceSlot(slots, 2);
	assert.ok(result);
	assert.deepEqual(result.slots, ['2', '', '', '']);
	assert.equal(result.focus, 1);
	assert.equal(backspaceSlot(slots, 1), null); // slot 1 has a digit: the browser handles it
	assert.equal(backspaceSlot(toSlots('', 4), 0), null);
});

test('the value is empty only when every slot is empty', () => {
	assert.equal(fromSlots(toSlots('', 4)), '');
	assert.equal(fromSlots(['', '', '', '3']), '   3');
	assert.equal(fromSlots(['2', '', '', '']), '2');
});

test('letters are upper-cased, other characters clear the slot, extra characters keep the last one', () => {
	assert.deepEqual(type(toSlots('', 2), 0, 'a'), ['A', '']);
	assert.deepEqual(type(toSlots('A1', 2), 0, '-'), ['', '1']);
	assert.deepEqual(type(toSlots('', 2), 0, '45'), ['5', '']);
});

test('toSlots tolerates short, long and placeholder-filled values', () => {
	assert.deepEqual(toSlots('2', 3), ['2', '', '']);
	assert.deepEqual(toSlots('25769', 4), ['2', '5', '7', '6']);
	assert.deepEqual(toSlots('2 76', 4), ['2', '', '7', '6']);
});
