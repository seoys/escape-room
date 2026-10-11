import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRoom } from '@/lib/rooms-validation';
import { Room } from '@/types/room';

const deps = { fileExists: (p: string) => p === '/puzzles/ok.svg' };

const base = (overrides: Partial<Room>): Room => ({
	id: 1,
	title: 't',
	type: '관찰',
	question: 'q',
	answer: '1',
	hint: 'h',
	difficulty: 1,
	...overrides,
});

test('plain rooms are valid', () => {
	assert.deepEqual(validateRoom(base({}), deps), []);
});

test('choice: needs options, unique values, and an answer among them', () => {
	assert.match(
		validateRoom(base({ inputType: 'choice' }), deps).join('\n'),
		/options/,
	);
	assert.match(
		validateRoom(
			base({
				inputType: 'choice',
				options: [{ value: 'A' }, { value: 'A' }],
				answer: 'A',
			}),
			deps,
		).join('\n'),
		/duplicate/,
	);
	assert.match(
		validateRoom(
			base({
				inputType: 'choice',
				options: [{ value: 'A' }, { value: 'B' }],
				answer: 'C',
			}),
			deps,
		).join('\n'),
		/answer/,
	);
	assert.deepEqual(
		validateRoom(
			base({
				inputType: 'choice',
				options: [{ value: 'A' }, { value: 'B' }],
				answer: 'B',
			}),
			deps,
		),
		[],
	);
});

test('choice: option images must exist', () => {
	const errors = validateRoom(
		base({
			inputType: 'choice',
			options: [{ value: 'A', image: '/puzzles/missing.svg' }],
			answer: 'A',
		}),
		deps,
	);
	assert.match(errors.join('\n'), /missing\.svg/);
});

test('tile-order: answer must equal joined tiles; tileImages must cover tiles', () => {
	assert.match(
		validateRoom(
			base({ inputType: 'tile-order', tiles: ['B', 'A'], answer: 'AB' }),
			deps,
		).join('\n'),
		/tiles/,
	);
	assert.match(
		validateRoom(
			base({
				inputType: 'tile-order',
				tiles: ['B', 'A'],
				answer: 'BA',
				tileImages: { B: '/puzzles/ok.svg' },
			}),
			deps,
		).join('\n'),
		/tileImages/,
	);
	assert.deepEqual(
		validateRoom(
			base({
				inputType: 'tile-order',
				tiles: ['B', 'A'],
				answer: 'BA',
				tileImages: { A: '/puzzles/ok.svg', B: '/puzzles/ok.svg' },
			}),
			deps,
		),
		[],
	);
});

test('visual: image file must exist; grid/symbol-rows/statements must not be empty', () => {
	const image = {
		kind: 'image',
		src: '/puzzles/nope.svg',
		alt: 'a',
		width: 1,
		height: 1,
	} as const;
	assert.match(
		validateRoom(base({ visual: image }), deps).join('\n'),
		/nope\.svg/,
	);
	assert.match(
		validateRoom(base({ visual: { kind: 'grid', rows: [] } }), deps).join(
			'\n',
		),
		/grid/,
	);
	assert.match(
		validateRoom(
			base({ visual: { kind: 'symbol-rows', rows: [] } }),
			deps,
		).join('\n'),
		/symbol-rows/,
	);
	assert.match(
		validateRoom(
			base({ visual: { kind: 'statements', speakers: [] } }),
			deps,
		).join('\n'),
		/statements/,
	);
	assert.match(
		validateRoom(
			base({ visual: { kind: 'shape-matrix', cells: [] } }),
			deps,
		).join('\n'),
		/shape-matrix/,
	);
});

test('variants are validated too', () => {
	const room = base({
		variants: [
			{
				variantId: '1-a',
				title: 't',
				type: '관찰',
				question: 'q',
				answer: 'C',
				hint: 'h',
				difficulty: 1,
				inputType: 'choice',
				options: [{ value: 'A' }],
			},
		],
	});
	assert.match(validateRoom(room, deps).join('\n'), /1-a/);
});
