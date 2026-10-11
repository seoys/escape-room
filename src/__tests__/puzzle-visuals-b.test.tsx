import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import GridVisual from '@/components/puzzle-visuals/GridVisual';
import SymbolRowsVisual from '@/components/puzzle-visuals/SymbolRowsVisual';
import ShapeMatrixVisual, {
	ShapeCellView,
} from '@/components/puzzle-visuals/ShapeMatrixVisual';
import { shapeCell, symRow } from '@/lib/puzzle-builders';

test('GridVisual renders cells, arrows, highlight and hidden marks', () => {
	const html = renderToStaticMarkup(
		<GridVisual
			rows={[
				[
					{ text: '샹', arrow: 'right', mark: 'highlight' },
					{ text: '들', arrow: 'down' },
				],
				[{ text: '5' }, { text: '30', mark: 'hidden' }],
			]}
			caption="경고문"
		/>,
	);
	assert.match(html, /샹/);
	assert.match(html, /→/);
	assert.match(html, /↓/);
	assert.match(html, /data-cell-mark="highlight"/);
	assert.match(html, /data-cell-mark="hidden"/);
	assert.ok(!html.includes('>30<'), 'hidden cell text must not be shown');
	assert.match(html, /경고문/);
});

test('SymbolRowsVisual renders "tokens = value" and "?" for the question row', () => {
	const html = renderToStaticMarkup(
		<SymbolRowsVisual
			rows={[symRow(['3', '+', '4'], '7'), symRow(['6', '+', '11'])]}
		/>,
	);
	assert.match(html, /7/);
	assert.match(html, /\?/);
	assert.ok(!html.includes('data-background="clock"'));
});

test('SymbolRowsVisual draws colored dots and an optional clock face', () => {
	const html = renderToStaticMarkup(
		<SymbolRowsVisual
			rows={[symRow([{ color: '#c0392b' }, { color: '#2f6db5' }], '15')]}
			background="clock"
		/>,
	);
	assert.match(html, /background:#c0392b|background-color:#c0392b/);
	assert.match(html, /data-background="clock"/);
});

test('SymbolRowsVisual names a labelled lamp in its aria-label and shows the initial', () => {
	const html = renderToStaticMarkup(
		<SymbolRowsVisual
			rows={[symRow([{ color: '#c0392b', label: '빨강' }], '1')]}
		/>,
	);
	assert.match(html, /aria-label="빨강 등불"/);
	assert.match(html, />빨</);
});

test('ShapeCellView draws one element per mark at the slot position', () => {
	const html = renderToStaticMarkup(
		<ShapeCellView cell={shapeCell('circle', true, 2)} />,
	);
	const circles = html.match(/data-shape="circle"/g) ?? [];
	assert.equal(circles.length, 2);
	assert.match(html, /cx="10"/);
	assert.match(html, /cx="50"/);
	assert.match(html, /cy="30"/);
});

test('ShapeMatrixVisual shows 8 cells and a question-mark cell', () => {
	const cells = Array.from({ length: 8 }, () =>
		shapeCell('square', false, 1),
	);
	const html = renderToStaticMarkup(<ShapeMatrixVisual cells={cells} />);
	assert.equal((html.match(/data-shape="square"/g) ?? []).length, 8);
	assert.match(html, /data-matrix-missing="true"/);
});
