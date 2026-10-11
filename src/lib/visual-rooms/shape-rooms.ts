import 'server-only';
import { shapeCell } from '@/lib/puzzle-builders';
import { Room } from '@/types/room';

export const shapeRooms: Room[] = [
	{
		id: 22,
		title: '촛대 무늬',
		question:
			'[저택의 기록]\n응접실 벽의 3x3 무늬판에서 마지막 칸이 비어 있다.\n무늬의 규칙을 찾아 빈칸에 들어갈 조각을 아래에서 고르시오.',
		answer: 'C',
		hint: [
			'줄마다 도형의 종류가 하나로 정해져 있습니다.',
			'칸마다 도형 개수가 1, 2, 3으로 늘어나고, 속이 빈 칸은 가운데 줄에만 있습니다.',
		],
		type: '도형',
		difficulty: 3,
		inputType: 'choice',
		visual: {
			kind: 'shape-matrix',
			cells: [
				shapeCell('circle', true, 1),
				shapeCell('circle', false, 2),
				shapeCell('circle', true, 3),
				shapeCell('square', true, 1),
				shapeCell('square', false, 2),
				shapeCell('square', true, 3),
				shapeCell('triangle', true, 1),
				shapeCell('triangle', false, 2),
			],
		},
		options: [
			{ value: 'A', label: 'A', cell: shapeCell('triangle', false, 3) },
			{ value: 'B', label: 'B', cell: shapeCell('triangle', true, 2) },
			{ value: 'C', label: 'C', cell: shapeCell('triangle', true, 3) },
			{ value: 'D', label: 'D', cell: shapeCell('square', true, 3) },
			{ value: 'E', label: 'E', cell: shapeCell('circle', true, 3) },
			{ value: 'F', label: 'F', cell: shapeCell('triangle', true, 1) },
			{ value: 'G', label: 'G', cell: shapeCell('diamond', true, 3) },
			{ value: 'H', label: 'H', cell: shapeCell('triangle', false, 2) },
		],
	},
];
