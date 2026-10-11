import test from 'node:test';
import assert from 'node:assert/strict';
import { isCorrectAnswer } from '@/lib/answer-check';
import { Room } from '@/types/room';

const base: Room = {
	id: 1,
	title: 't',
	type: '암호',
	question: 'q',
	answer: 'Open Sesame',
	hint: 'h',
	difficulty: 1,
};

test('isCorrectAnswer ignores case and all whitespace', () => {
	assert.equal(isCorrectAnswer(base, ' open  sesame '), true);
	assert.equal(isCorrectAnswer(base, 'OPENSESAME'), true);
	assert.equal(isCorrectAnswer(base, 'open'), false);
	assert.equal(isCorrectAnswer(base, ''), false);
});

test('isCorrectAnswer accepts any of several answers', () => {
	const room: Room = { ...base, answer: ['시계', '시계 뒤'] };
	assert.equal(isCorrectAnswer(room, '시계뒤'), true);
	assert.equal(isCorrectAnswer(room, '시계'), true);
	assert.equal(isCorrectAnswer(room, '촛대'), false);
});

test('isCorrectAnswer checks the selected variant, falling back to the room', () => {
	const room: Room = {
		...base,
		variants: [
			{
				variantId: '1-a',
				title: 'v',
				type: '암호',
				question: 'vq',
				answer: 'variant',
				hint: 'vh',
				difficulty: 1,
			},
		],
	};
	assert.equal(isCorrectAnswer(room, 'variant', '1-a'), true);
	assert.equal(isCorrectAnswer(room, 'open sesame', '1-a'), false);
	assert.equal(isCorrectAnswer(room, 'open sesame', 'unknown'), true);
	assert.equal(isCorrectAnswer(room, 'open sesame'), true);
});
