import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import TileOrderInput from '@/components/TileOrderInput';

test('TileOrderInput keeps text tiles when tileImages is absent', () => {
	const html = renderToStaticMarkup(
		<TileOrderInput tiles={['가', '나']} onChange={() => {}} />,
	);
	assert.match(html, />가</);
	assert.ok(!html.includes('<img'));
});

test('TileOrderInput renders image tiles when tileImages is given', () => {
	const html = renderToStaticMarkup(
		<TileOrderInput
			tiles={['C', 'A']}
			tileImages={{
				C: '/puzzles/room-11-c.svg',
				A: '/puzzles/room-11-a.svg',
			}}
			onChange={() => {}}
		/>,
	);
	assert.equal((html.match(/<img/g) ?? []).length, 2);
	assert.match(html, /alt="컷 C"/);
	assert.match(html, /room-11-a\.svg/);
});
