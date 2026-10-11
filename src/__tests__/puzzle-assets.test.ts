import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'puzzles');

const EXPECTED = [
	'room-20-owl.svg',
	'room-13-keys.svg',
	'room-8-pipes.svg',
	'room-17-doors.svg',
	'room-11-a.svg',
	'room-11-b.svg',
	'room-11-c.svg',
	'room-11-d.svg',
	'room-11-e.svg',
];

for (const name of EXPECTED) {
	test(`puzzle asset ${name} is a well-formed svg with a viewBox`, () => {
		const file = path.join(dir, name);
		assert.ok(fs.existsSync(file), `${name} is missing`);
		const svg = fs.readFileSync(file, 'utf8');
		assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
		assert.match(svg, /viewBox="0 0 \d+ \d+"/);
		assert.match(svg, /<\/svg>\s*$/);
		const opens = (svg.match(/<g[\s>]/g) ?? []).length;
		const closes = (svg.match(/<\/g>/g) ?? []).length;
		assert.equal(opens, closes, 'unbalanced <g> tags');
	});
}
