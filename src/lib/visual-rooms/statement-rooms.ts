import 'server-only';
import { Room } from '@/types/room';

export const statementRooms: Room[] = [
	{
		id: 15,
		title: '정원사의 알리바이',
		question:
			'[저택의 기록]\n열쇠를 훔친 범인은 네 사람 중 한 명이다.\n네 사람의 진술 중 단 하나만 거짓이다. 열쇠를 훔친 사람은 누구인가?',
		answer: '1',
		hint: [
			'범인이 한 명씩이라고 가정하고, 그때 거짓이 되는 진술의 개수를 세어 보세요.',
			'거짓이 정확히 하나가 되는 경우는 한 가지뿐입니다.',
		],
		type: '추리',
		difficulty: 3,
		inputType: 'choice',
		options: [
			{ value: '1', label: '집사' },
			{ value: '2', label: '요리사' },
			{ value: '3', label: '정원사' },
			{ value: '4', label: '하녀' },
		],
		visual: {
			kind: 'statements',
			speakers: [
				{ id: '1', name: '집사', says: '범인은 정원사입니다.' },
				{ id: '2', name: '요리사', says: '범인은 하녀가 아닙니다.' },
				{ id: '3', name: '정원사', says: '범인은 집사입니다.' },
				{ id: '4', name: '하녀', says: '범인은 정원사가 아닙니다.' },
			],
		},
	},
];
