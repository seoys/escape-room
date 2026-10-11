import test from 'node:test';
import assert from 'node:assert/strict';
import { imageRooms } from '@/lib/visual-rooms/image-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { Room } from '@/types/room';

const byId = (id: number): Room => {
	const room = imageRooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

test('image rooms: ids 20, 13, 8, 17, 11 pass validateRoom (files exist)', () => {
	assert.deepEqual(
		imageRooms.map(r => r.id),
		[20, 13, 8, 17, 11],
	);
	for (const room of imageRooms) {
		assert.deepEqual(
			validateRoom(room, { fileExists: publicFileExists }),
			[],
		);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 20: boy + owl = 170 and boy − owl = 110 give owl = 30', () => {
	const sum = 170;
	const difference = 110;
	assert.equal(String((sum - difference) / 2), byId(20).answer);
});

test('room 13: only the key whose teeth match the lock slot is the answer', () => {
	const slot = [2, 1, 3, 1];
	const keys: Record<string, number[]> = {
		A: [2, 1, 3, 2],
		B: [1, 2, 3, 1],
		C: [2, 1, 3, 1],
		D: [2, 3, 1, 1],
	};
	const matches = Object.keys(keys).filter(
		k => keys[k].join() === slot.join(),
	);
	assert.deepEqual(matches, [byId(13).answer]);
	assert.deepEqual(
		byId(13).options?.map(o => o.value),
		['A', 'B', 'C', 'D'],
	);
});

test('room 8: water reaches exactly buckets 1 and 3 in the pipe network', () => {
	// connected components of the drawing: nodes are pipe junctions, valve removes R
	const edges: [string, string][] = [
		['faucet', 'S'],
		['S', 'L1'], // left branch
		['L1', 'J'], // down the left pipe to the dot at (300,220)
		['J', 'bucket3'],
		['J', 'bucket1'], // dot connects the side pipe to bucket 1
		// right branch is blocked by the closed valve, so S–R is absent
		['R', 'bucket4'],
		['R', 'bucket2'], // side pipe joins the right pipe at its dot
		// the hop over the left pipe does not connect J and the bucket-2 pipe
	];
	const reached = new Set(['faucet']);
	let grew = true;
	while (grew) {
		grew = false;
		for (const [a, b] of edges) {
			if (reached.has(a) !== reached.has(b)) {
				reached.add(a);
				reached.add(b);
				grew = true;
			}
		}
	}
	const buckets = ['1', '2', '3', '4'].filter(n => reached.has(`bucket${n}`));
	assert.equal(buckets.join(''), byId(8).answer);
});

test('room 17: only the exit reached without repeating a door color is the answer', () => {
	type Edge = [string, string, 'R' | 'B'];
	const edges: Edge[] = [
		['S', 'A', 'R'],
		['S', 'B', 'B'],
		['A', 'C', 'R'],
		['A', 'D', 'B'],
		['B', 'D', 'B'],
		['B', 'E', 'R'],
		['C', 'X1', 'B'],
		['D', 'X1', 'B'],
		['D', 'X2', 'R'],
		['E', 'X3', 'R'],
	];
	const reachedExits = new Set<string>();
	const seen = new Set<string>();
	const walk = (node: string, last: string) => {
		const key = `${node}|${last}`;
		if (seen.has(key)) return;
		seen.add(key);
		if (node.startsWith('X')) reachedExits.add(node);
		for (const [a, b, color] of edges) {
			if (color === last) continue;
			if (a === node) walk(b, color);
			if (b === node) walk(a, color);
		}
	};
	walk('S', '-');
	assert.deepEqual([...reachedExits], ['X2']);
	assert.equal(byId(17).answer, '2');
	assert.deepEqual(
		byId(17).options?.map(o => o.value),
		['1', '2', '3'],
	);
});

test('room 11: tiles are in story order C, A, E, B, D and the answer is that string', () => {
	const room = byId(11);
	assert.deepEqual(room.tiles, ['C', 'A', 'E', 'B', 'D']);
	assert.equal(room.answer, 'CAEBD');
	assert.equal(room.inputType, 'tile-order');
	assert.deepEqual(Object.keys(room.tileImages ?? {}).sort(), [
		'A',
		'B',
		'C',
		'D',
		'E',
	]);
});
