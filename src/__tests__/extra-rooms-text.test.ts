import test from 'node:test';
import assert from 'node:assert/strict';
import { extraSymbolRooms } from '@/lib/visual-rooms/extra-symbol-rooms';
import { extraNoteRooms } from '@/lib/visual-rooms/extra-note-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { composeSyllable, initialOf } from './helpers/hangul';
import { noteLinesOf, roomById } from './helpers/find-room';

const note = (id: number) => roomById(extraNoteRooms, id);

test('extra symbol/note rooms: ids and validateRoom', () => {
	assert.deepEqual(
		extraSymbolRooms.map(r => r.id),
		[32],
	);
	assert.deepEqual(
		extraNoteRooms.map(r => r.id),
		[36, 38, 42, 43, 44, 45, 46, 47, 48, 49],
	);
	for (const room of [...extraSymbolRooms, ...extraNoteRooms]) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
		);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
		assert.ok(Array.isArray(room.hint) && room.hint.length >= 1);
	}
});

test('room 32: lit candles read as binary (rightmost = 1) and the last row gives the answer', () => {
	const room = roomById(extraSymbolRooms, 32);
	assert.equal(room.visual?.kind, 'symbol-rows');
	if (room.visual?.kind !== 'symbol-rows') return;
	const read = (glyphs: (string | undefined)[]) =>
		glyphs.reduce(
			(total, glyph) => total * 2 + (glyph === '🔥' ? 1 : 0),
			0,
		);
	for (const row of room.visual.rows) {
		const value = read(row.items.map(i => i.glyph));
		if (row.value !== undefined) assert.equal(value, Number(row.value));
		else assert.equal(String(value), room.answer);
	}
	assert.equal(room.visual.rows.filter(r => r.value === undefined).length, 1);
});

test('room 36: the braille legend decodes the last line to the answer', () => {
	const lines = noteLinesOf(note(36));
	const legend = new Map<string, string>();
	for (const line of lines.slice(0, 2)) {
		for (const match of line.matchAll(/([⠀-⣿])\s([A-Z])/g))
			legend.set(match[1], match[2]);
	}
	assert.equal(legend.size, 10);
	const decoded = [...lines[2].replace(/\s/g, '')]
		.map(ch => legend.get(ch))
		.join('');
	assert.equal(decoded, note(36).answer);
});

test('room 38: the weight statements give a total order whose third heaviest is the answer', () => {
	const room = note(38);
	const names = ['상자', '항아리', '시계', '책', '촛대'];
	// statements in the note, as [heavier, lighter]
	const heavier: [string, string][] = [
		['상자', '항아리'],
		['항아리', '시계'],
		['책', '항아리'],
		['상자', '책'],
		['시계', '촛대'],
	];
	const beats = new Map(names.map(n => [n, new Set<string>()]));
	for (const [a, b] of heavier) beats.get(a)!.add(b);
	for (let k = 0; k < names.length; k++)
		for (const a of names)
			for (const b of names)
				if (beats.get(a)!.has(names[k]) && beats.get(names[k])!.has(b))
					beats.get(a)!.add(b);
	const order = [...names].sort(
		(a, b) => beats.get(b)!.size - beats.get(a)!.size,
	);
	order.forEach((name, i) =>
		assert.equal(beats.get(name)!.size, names.length - 1 - i),
	); // total order
	const lines = noteLinesOf(room).join(' ');
	for (const name of names) assert.ok(lines.includes(name), name);
	const third = order[2];
	assert.equal(
		room.options?.find(o => o.label === third)?.value,
		room.answer,
	);
	assert.deepEqual(
		room.options?.map(o => o.label),
		names,
	);
});

test('room 42: the four clues fix the lock digits', () => {
	const room = note(42);
	assert.equal(room.inputType, 'combo-lock');
	assert.equal(room.comboLength, 4);
	assert.equal(noteLinesOf(room).length, 4);
	const d1 = 2; // smallest prime
	const d2 = d1 * 3 - 1;
	const d3 = d1 + d2;
	const d4 = 20 - (d1 + d2 + d3);
	assert.ok([d1, d2, d3, d4].every(d => d >= 0 && d <= 9));
	assert.equal(`${d1}${d2}${d3}${d4}`, room.answer);
});

test('room 43: the note read backwards says where the key is; the answer accepts the short and long forms', () => {
	const room = note(43);
	const reversed = [...noteLinesOf(room)[0]].reverse().join('');
	assert.equal(reversed, '열쇠는 시계 뒤에 있다');
	const accepted = (
		Array.isArray(room.answer) ? room.answer : [room.answer]
	).map(a => a.replace(/\s+/g, ''));
	assert.ok(accepted.includes('시계'));
	assert.ok(accepted.includes('시계뒤'));
});

test('room 44: the initials fit the words and their first syllables form the answer', () => {
	const room = note(44);
	const clues = noteLinesOf(room)
		.slice(0, 2)
		.map(line => line.split('—')[1].trim());
	assert.deepEqual(clues, ['ㅊㅁ', 'ㄱㅇㅇ']);
	const words: Record<string, string> = { ㅊㅁ: '창문', ㄱㅇㅇ: '고양이' };
	for (const clue of clues) {
		assert.equal([...words[clue]].map(initialOf).join(''), clue);
	}
	assert.equal(clues.map(c => words[c][0]).join(''), room.answer);
});

test('room 45: with the 3rd a Sunday, the third Wednesday is the answer', () => {
	const sundayOn = 3;
	const wednesdays = Array.from(
		{ length: 5 },
		(_, i) => sundayOn + 3 + i * 7,
	).filter(d => d <= 31);
	assert.equal(String(wednesdays[2]), note(45).answer);
});

test('room 46: the visible faces can meet at a die corner, and the hidden faces sum to the answer', () => {
	const match = /위 (\d) · 앞 (\d) · 오른쪽 (\d)/.exec(
		noteLinesOf(note(46)).join(' '),
	);
	assert.ok(match, 'visible faces line not found');
	const visible = [match[1], match[2], match[3]].map(Number);
	assert.ok(visible.every(face => face >= 1 && face <= 6));
	assert.equal(new Set(visible).size, 3, 'faces must differ');
	// opposite faces add up to 7, so two of them can never be visible together
	for (const [i, j] of [
		[0, 1],
		[0, 2],
		[1, 2],
	]) {
		assert.notEqual(
			visible[i] + visible[j],
			7,
			`faces ${visible[i]} and ${visible[j]} are opposite`,
		);
	}
	assert.equal(
		String(visible.reduce((sum, face) => sum + (7 - face), 0)),
		note(46).answer,
	);
	assert.equal(
		String(21 - visible.reduce((a, b) => a + b, 0)),
		note(46).answer,
	);
});

test('room 47: each jamo line composes one syllable and together they spell the answer', () => {
	const lines = noteLinesOf(note(47));
	const word = lines
		.map(line => {
			const [initial, medial, final] = line.split(/\s+/);
			return composeSyllable(initial, medial, final);
		})
		.join('');
	assert.equal(word, note(47).answer);
});

test('room 48: every line reads the previous one aloud (look-and-say) and the answer is the next term', () => {
	const next = (term: string) =>
		term.replace(/(\d)\1*/g, run => `${run.length}${run[0]}`);
	const lines = noteLinesOf(note(48));
	assert.equal(lines[lines.length - 1], '?');
	const terms = lines.slice(0, -1);
	terms.slice(1).forEach((term, i) => assert.equal(term, next(terms[i])));
	assert.equal(next(terms[terms.length - 1]), note(48).answer);
});

test('room 49: exactly one lineup satisfies the clues and the third person is the answer', () => {
	const room = note(49);
	const people = ['가온', '나래', '다솜', '라온', '마루'];
	const permutations = (items: string[]): string[][] =>
		items.length <= 1
			? [items]
			: items.flatMap((item, i) =>
					permutations([
						...items.slice(0, i),
						...items.slice(i + 1),
					]).map(rest => [item, ...rest]),
				);
	const valid = permutations(people).filter(line => {
		const at = (name: string) => line.indexOf(name);
		return (
			at('가온') + 1 === at('나래') && // 가온 right before 나래
			at('다솜') === 4 && // 다솜 last
			at('라온') < at('가온') && // 라온 ahead of 가온
			at('마루') === at('나래') + 1 // 마루 right after 나래
		);
	});
	assert.equal(valid.length, 1);
	const third = valid[0][2];
	assert.deepEqual(
		room.options?.map(o => o.label),
		people,
	);
	assert.equal(
		room.options?.find(o => o.label === third)?.value,
		room.answer,
	);
});
