import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// "Level 1" in comments (a digit follows) is fine; the identifier `Level` and these names are not.
const FORBIDDEN =
	/getLevelFromAge|normalizeLevel|LEVEL_COOKIE_KEY|getRoomsForLevel|player_level|playerLevel|LEVEL_LABELS|\bLevel\b(?!\s+\d)|\blevel\?:|\.level\b/;

const collect = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory())
			return entry.name === '__tests__' ? [] : collect(full);
		return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
	});

test('the age-based level concept is gone from the source', () => {
	const offenders = collect(path.join(process.cwd(), 'src')).filter(file =>
		FORBIDDEN.test(fs.readFileSync(file, 'utf8')),
	);
	assert.deepEqual(offenders, []);
});

test('src/lib/level.ts no longer exists', () => {
	assert.equal(
		fs.existsSync(path.join(process.cwd(), 'src', 'lib', 'level.ts')),
		false,
	);
});
