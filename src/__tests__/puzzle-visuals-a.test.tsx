import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ImageVisual from '@/components/puzzle-visuals/ImageVisual';
import NoteVisual from '@/components/puzzle-visuals/NoteVisual';
import StatementsVisual from '@/components/puzzle-visuals/StatementsVisual';

test('ImageVisual renders an img with alt text', () => {
	const html = renderToStaticMarkup(
		<ImageVisual
			src="/puzzles/x.svg"
			alt="열쇠 그림"
			width={480}
			height={340}
		/>,
	);
	assert.match(html, /<img/);
	assert.match(html, /alt="열쇠 그림"/);
	assert.match(html, /\/puzzles\/x\.svg/);
});

test('NoteVisual renders the title and each line in order', () => {
	const html = renderToStaticMarkup(
		<NoteVisual
			title="10월 3일"
			lines={['첫째 줄', '둘째 줄']}
			style="diary"
		/>,
	);
	assert.match(html, /10월 3일/);
	assert.ok(html.indexOf('첫째 줄') < html.indexOf('둘째 줄'));
	assert.match(html, /data-note-style="diary"/);
});

test('NoteVisual works without a title and defaults to list style', () => {
	const html = renderToStaticMarkup(<NoteVisual lines={['하나']} />);
	assert.match(html, /하나/);
	assert.match(html, /data-note-style="list"/);
});

test('StatementsVisual shows every speaker name and statement', () => {
	const html = renderToStaticMarkup(
		<StatementsVisual
			speakers={[
				{ id: '1', name: '집사', says: '범인은 정원사입니다.' },
				{ id: '2', name: '요리사', says: '범인은 하녀가 아닙니다.' },
			]}
		/>,
	);
	for (const text of [
		'집사',
		'범인은 정원사입니다.',
		'요리사',
		'범인은 하녀가 아닙니다.',
	]) {
		assert.ok(html.includes(text), text);
	}
});

test('NoteVisual enlarges braille cells so the dot patterns can be told apart', () => {
	const html = renderToStaticMarkup(<NoteVisual lines={['⠁ A · ⠃ B']} />);
	assert.match(html, /<span[^>]*text-3xl[^>]*>⠁<\/span>/);
	assert.match(html, /<span[^>]*text-3xl[^>]*>⠃<\/span>/);
	assert.ok(html.includes('A'));
	assert.ok(!/<span[^>]*text-3xl[^>]*>A<\/span>/.test(html));
});

test('NoteVisual leaves lines without braille as plain text', () => {
	const html = renderToStaticMarkup(<NoteVisual lines={['평범한 줄']} />);
	assert.ok(!html.includes('text-3xl'));
	assert.match(html, /평범한 줄/);
});
