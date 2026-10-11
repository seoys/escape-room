import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ChoiceInput from '@/components/ChoiceInput';
import { shapeCell } from '@/lib/puzzle-builders';

test('ChoiceInput renders one pressable card per option with nothing selected', () => {
	const html = renderToStaticMarkup(
		<ChoiceInput
			options={[
				{ value: '1', label: '출구 1' },
				{ value: '2', label: '출구 2' },
				{ value: '3', label: '출구 3' },
			]}
			onChange={() => {}}
		/>,
	);
	assert.equal((html.match(/<button/g) ?? []).length, 3);
	assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 3);
	assert.ok(!html.includes('aria-pressed="true"'));
	assert.match(html, /출구 2/);
});

test('ChoiceInput renders shape cells and option images', () => {
	const html = renderToStaticMarkup(
		<ChoiceInput
			options={[
				{
					value: 'A',
					label: 'A',
					cell: shapeCell('triangle', true, 3),
				},
				{ value: 'B', label: 'B', image: '/puzzles/x.svg' },
			]}
			onChange={() => {}}
		/>,
	);
	assert.match(html, /data-shape="triangle"/);
	assert.match(html, /\/puzzles\/x\.svg/);
});

test('ChoiceInput disables every card when disabled', () => {
	const html = renderToStaticMarkup(
		<ChoiceInput
			options={[{ value: '1', label: '하나' }]}
			onChange={() => {}}
			disabled
		/>,
	);
	assert.match(html, /disabled=""/);
});
