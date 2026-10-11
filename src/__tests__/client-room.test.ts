import test from 'node:test';
import assert from 'node:assert/strict';
import { toClientRoom } from '@/lib/client-room';
import { Room } from '@/types/room';

const room: Room = {
	id: 3,
	title: 'room',
	type: '관찰',
	question: 'q',
	answer: 'SECRET-ANSWER',
	hint: 'h',
	difficulty: 2,
	inputType: 'tile-order',
	tiles: ['A', 'B', 'C'],
	tileImages: {
		A: '/puzzles/a.svg',
		B: '/puzzles/b.svg',
		C: '/puzzles/c.svg',
	},
	visual: { kind: 'note', lines: ['x'] },
	options: [{ value: '1', label: 'one' }],
	variants: [
		{
			variantId: '3-a',
			title: 'variant',
			type: '관찰',
			question: 'vq',
			answer: 'VARIANT-SECRET',
			hint: 'vh',
			difficulty: 1,
			inputType: 'choice',
			options: [{ value: 'X' }],
		},
	],
};

const reverse = <T>(items: T[]): T[] => [...items].reverse();

test('toClientRoom never exposes answer or variants', () => {
	const client = toClientRoom(room, undefined, reverse);
	assert.equal('answer' in client, false);
	assert.equal('variants' in client, false);
	assert.ok(!JSON.stringify(client).includes('SECRET'));
});

test('toClientRoom forwards visual, options and tileImages and shuffles a tile copy', () => {
	const client = toClientRoom(room, undefined, reverse);
	assert.deepEqual(client.visual, { kind: 'note', lines: ['x'] });
	assert.deepEqual(client.options, [{ value: '1', label: 'one' }]);
	assert.deepEqual(client.tileImages, room.tileImages);
	assert.deepEqual(client.tiles, ['C', 'B', 'A']);
	assert.deepEqual(room.tiles, ['A', 'B', 'C']);
});

test('toClientRoom uses the selected variant fields and variantId', () => {
	const client = toClientRoom(room, room.variants![0], reverse);
	assert.equal(client.id, 3);
	assert.equal(client.variantId, '3-a');
	assert.equal(client.title, 'variant');
	assert.equal(client.inputType, 'choice');
	assert.deepEqual(client.options, [{ value: 'X' }]);
	assert.equal(client.tiles, undefined);
	assert.ok(!JSON.stringify(client).includes('SECRET'));
});
