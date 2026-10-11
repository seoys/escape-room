import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import PuzzleVisualView from '@/components/puzzle-visuals/PuzzleVisualView';
import { PuzzleVisual } from '@/types/room';

test('renders nothing without a visual', () => {
	assert.equal(renderToStaticMarkup(<PuzzleVisualView />), '');
});

test('dispatches each kind to its renderer', () => {
	const cases: [PuzzleVisual, RegExp][] = [
		[
			{
				kind: 'image',
				src: '/puzzles/a.svg',
				alt: '그림',
				width: 10,
				height: 10,
			},
			/<img/,
		],
		[{ kind: 'grid', rows: [[{ text: '가' }]] }, /data-cell-mark/],
		[{ kind: 'note', lines: ['줄'] }, /data-note-style/],
		[
			{
				kind: 'symbol-rows',
				rows: [{ items: [{ glyph: '1' }], value: '1' }],
			},
			/1/,
		],
		[
			{
				kind: 'shape-matrix',
				cells: Array.from({ length: 8 }, () => ({ marks: [] })),
			},
			/data-matrix-missing/,
		],
		[
			{
				kind: 'statements',
				speakers: [{ id: '1', name: '집사', says: '말' }],
			},
			/집사/,
		],
	];
	for (const [visual, pattern] of cases) {
		assert.match(
			renderToStaticMarkup(<PuzzleVisualView visual={visual} />),
			pattern,
			visual.kind,
		);
	}
});

test('unknown kind renders nothing instead of crashing', () => {
	const originalWarn = console.warn;
	const warnings: unknown[] = [];
	console.warn = (...args: unknown[]) => warnings.push(args);
	try {
		const bogus = { kind: 'bogus' } as unknown as PuzzleVisual;
		assert.equal(
			renderToStaticMarkup(<PuzzleVisualView visual={bogus} />),
			'',
		);
		assert.equal(warnings.length, 1);
	} finally {
		console.warn = originalWarn;
	}
});
