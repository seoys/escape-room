import 'server-only';
import { symRow } from '@/lib/puzzle-builders';
import { Room } from '@/types/room';

export const extraSymbolRooms: Room[] = [
	{
		id: 32,
		title: '촛불 이진수',
		question:
			'[저택의 기록]\n샹들리에의 촛불 줄마다 숫자가 적혀 있다. 🔥는 켜진 촛불, ⚫는 꺼진 촛불이다.\n마지막 줄이 나타내는 숫자는? (숫자만 입력)',
		answer: '11',
		hint: [
			'한 줄에 촛불이 네 개입니다. 오른쪽 끝 촛불이 무엇을 뜻하는지부터 생각해 보세요.',
			'오른쪽에서부터 1, 2, 4, 8을 뜻합니다. 켜진 촛불이 뜻하는 수를 더하세요.',
		],
		type: '규칙추리',
		difficulty: 3,
		inputType: 'number',
		visual: {
			kind: 'symbol-rows',
			rows: [
				symRow(['⚫', '⚫', '⚫', '🔥'], '1'),
				symRow(['⚫', '⚫', '🔥', '⚫'], '2'),
				symRow(['⚫', '⚫', '🔥', '🔥'], '3'),
				symRow(['⚫', '🔥', '⚫', '🔥'], '5'),
				symRow(['🔥', '⚫', '🔥', '🔥']),
			],
		},
	},
];
