// Slot logic for ComboLockInput. The lock's value is one string, so an emptied slot
// has to stay visible in it as a placeholder; otherwise the digits behind it would
// slide one slot to the left. Trailing placeholders are trimmed, so an untouched lock
// has the value ''. The server ignores whitespace, so a gap just makes the code wrong.

const GAP = ' ';

export type SlotChange = { slots: string[]; focus: number | null };

export const toSlots = (value: string, length: number): string[] =>
	Array.from({ length }, (_, index) => {
		const char = value[index];
		return char && char !== GAP ? char : '';
	});

export const fromSlots = (slots: string[]): string =>
	slots
		.map(slot => slot || GAP)
		.join('')
		.replace(/ +$/, '');

export const isComplete = (slots: string[]): boolean =>
	slots.every(slot => slot !== '');

// A character was typed into (or removed from) one slot.
export function changeSlot(
	slots: string[],
	index: number,
	raw: string,
): SlotChange {
	const char = raw.replace(/[^0-9A-Za-z]/g, '').slice(-1);
	const next = [...slots];
	next[index] = char.toUpperCase();
	return {
		slots: next,
		focus: char && index < slots.length - 1 ? index + 1 : null,
	};
}

// Backspace in an empty slot clears the previous one and moves the focus there.
// Returns null when the browser's own handling (deleting the slot's character) is enough.
export function backspaceSlot(
	slots: string[],
	index: number,
): { slots: string[]; focus: number } | null {
	if (slots[index] || index === 0) return null;
	const next = [...slots];
	next[index - 1] = '';
	return { slots: next, focus: index - 1 };
}
