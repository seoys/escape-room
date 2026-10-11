import 'server-only';
import { shapeCell } from '@/lib/puzzle-builders';
import { Room } from '@/types/room';

export const extraMiscRooms: Room[] = [
	{
		id: 33,
		title: '틀린 그림 찾기',
		question:
			'[저택의 기록]\n응접실의 두 그림은 거의 같지만 다른 곳이 있다. 다른 곳은 모두 몇 군데인가? (숫자만 입력)',
		answer: '5',
		hint: [
			'창문, 시계, 액자, 탁자, 바닥의 양탄자를 차례로 비교해 보세요.',
			'같은 물건이라도 개수, 방향, 모양이 다를 수 있습니다.',
		],
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'image',
			src: '/puzzles/room-33-spot.svg',
			alt: '같은 방을 그린 두 그림. 창문과 별, 시계, 액자, 탁자 위 촛불, 책장, 바닥의 양탄자가 각각 그려져 있다.',
			width: 480,
			height: 260,
		},
	},
	{
		id: 37,
		title: '벽면 무늬 둘',
		question:
			'[저택의 기록]\n응접실 벽의 3x3 무늬판에서 마지막 칸이 비어 있다.\n무늬의 규칙을 찾아 빈칸에 들어갈 조각을 아래에서 고르시오.',
		answer: 'F',
		hint: [
			'한 줄에는 세 가지 도형이 한 번씩 들어갑니다.',
			'도형의 개수는 줄 번호와 같습니다. 세 번째 줄은 모두 세 개입니다.',
		],
		type: '도형',
		difficulty: 3,
		inputType: 'choice',
		visual: {
			kind: 'shape-matrix',
			cells: [
				shapeCell('circle', true, 1),
				shapeCell('square', true, 1),
				shapeCell('triangle', true, 1),
				shapeCell('square', true, 2),
				shapeCell('triangle', true, 2),
				shapeCell('circle', true, 2),
				shapeCell('triangle', true, 3),
				shapeCell('circle', true, 3),
			],
		},
		options: [
			{ value: 'A', label: 'A', cell: shapeCell('triangle', true, 3) },
			{ value: 'B', label: 'B', cell: shapeCell('square', true, 2) },
			{ value: 'C', label: 'C', cell: shapeCell('circle', true, 3) },
			{ value: 'D', label: 'D', cell: shapeCell('square', false, 3) },
			{ value: 'E', label: 'E', cell: shapeCell('diamond', true, 3) },
			{ value: 'F', label: 'F', cell: shapeCell('square', true, 3) },
			{ value: 'G', label: 'G', cell: shapeCell('square', true, 1) },
			{ value: 'H', label: 'H', cell: shapeCell('circle', true, 2) },
		],
	},
	{
		id: 50,
		title: '정사각형 세기',
		question:
			'[저택의 기록]\n무도회장 바닥에 3x3 격자무늬가 그려져 있다. 이 그림 속에서 찾을 수 있는 크고 작은 정사각형은 모두 몇 개인가? (숫자만 입력)',
		answer: '14',
		hint: [
			'가장 작은 칸부터 세어 보세요. 그다음 두 칸짜리, 세 칸짜리를 세세요.',
			'작은 칸 9개, 2x2 크기 몇 개, 3x3 크기 몇 개를 더합니다.',
		],
		type: '도형',
		difficulty: 3,
		inputType: 'number',
		visual: {
			kind: 'image',
			src: '/puzzles/room-50-squares.svg',
			alt: '가로 세로 세 칸씩, 모두 아홉 칸으로 나뉜 정사각형 격자 그림.',
			width: 300,
			height: 300,
		},
	},
];
