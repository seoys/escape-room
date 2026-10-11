import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { LockoutView } from '@/components/LockoutOverlay';

test('LockoutView shows the rule text and the remaining time as mm:ss', () => {
	const html = renderToStaticMarkup(<LockoutView remainingMs={90_000} />);
	assert.match(html, /총 5번을 틀려 5분간 문제를 풀 수 없습니다/);
	assert.match(html, />01:30</);
	assert.match(html, /잠금이 풀리면 오답 횟수가 초기화됩니다/);
});

test('LockoutView is an accessible modal that covers the screen', () => {
	const html = renderToStaticMarkup(<LockoutView remainingMs={300_000} />);
	assert.match(html, /role="alertdialog"/);
	assert.match(html, /aria-modal="true"/);
	assert.match(html, /fixed/);
	assert.match(html, />05:00</);
});

test('LockoutView never shows a negative time', () => {
	const html = renderToStaticMarkup(<LockoutView remainingMs={-2000} />);
	assert.match(html, />00:00</);
});
