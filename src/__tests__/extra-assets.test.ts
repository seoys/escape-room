import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (name: string) =>
	fs.readFileSync(
		path.join(process.cwd(), 'public', 'puzzles', name),
		'utf8',
	);

const panelLines = (svg: string, id: string, nextMarker: string): string[] => {
	const start = svg.indexOf(`<g id="${id}"`);
	assert.ok(start >= 0, `${id} missing`);
	const bodyStart = svg.indexOf('>', start) + 1;
	const end = svg.indexOf(nextMarker, bodyStart);
	assert.ok(end > bodyStart, `${id} end missing`);
	return svg
		.slice(bodyStart, end)
		.replace(/<\/g>\s*$/, '')
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);
};

for (const name of ['room-33-spot.svg', 'room-50-squares.svg']) {
	test(`${name} is a well-formed svg with a viewBox`, () => {
		const svg = read(name);
		assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
		assert.match(svg, /viewBox="0 0 \d+ \d+"/);
		assert.match(svg, /<\/svg>\s*$/);
		assert.equal(
			(svg.match(/<g[\s>]/g) ?? []).length,
			(svg.match(/<\/g>/g) ?? []).length,
		);
	});
}

test('room-33-spot.svg: the two panels differ in exactly 5 marked places', () => {
	const svg = read('room-33-spot.svg');
	const left = panelLines(svg, 'panel-left', '<g id="panel-right"');
	const right = panelLines(svg, 'panel-right', '<g fill="none"');
	const onlyLeft = left.filter(line => !right.includes(line));
	const onlyRight = right.filter(line => !left.includes(line));
	const differing = [...onlyLeft, ...onlyRight];
	assert.ok(differing.length > 0);
	for (const line of differing) {
		assert.match(line, /data-diff="[1-5]"/, `unmarked difference: ${line}`);
	}
	const marks = new Set(
		differing.map(line => /data-diff="([1-5])"/.exec(line)![1]),
	);
	assert.deepEqual([...marks].sort(), ['1', '2', '3', '4', '5']);
});

test('room-50-squares.svg: a 3x3 grid hides 14 squares (9 + 4 + 1)', () => {
	const svg = read('room-50-squares.svg');
	const verticals = (svg.match(/data-line="v"/g) ?? []).length;
	const horizontals = (svg.match(/data-line="h"/g) ?? []).length;
	assert.equal(verticals, 4);
	assert.equal(horizontals, 4);
	const cells = verticals - 1;
	const squares = Array.from(
		{ length: cells },
		(_, i) => (cells - i) ** 2,
	).reduce((a, b) => a + b, 0);
	assert.equal(squares, 14);
});
