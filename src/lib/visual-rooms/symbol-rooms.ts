import 'server-only';
import { symRow } from '@/lib/puzzle-builders';
import { Room } from '@/types/room';

const RED = '#c0392b';
const ORANGE = '#e08a1e';
const YELLOW = '#e3c21b';
const GREEN = '#3f9b4c';
const BLUE = '#2f6db5';

export const symbolRooms: Room[] = [
	{
		id: 2,
		title: '촛불의 흔적',
		question:
			'[저택의 기록]\n벽난로 위 석판에 그림 수식이 새겨져 있다.\n그림마다 정해진 값이 있다. 마지막 수식의 값은 얼마인가? (숫자만 입력)',
		answer: '19',
		hint: [
			'첫째 줄로 🕯️ 하나의 값을 구하고, 둘째 줄로 🔔을 구하세요.',
			'마지막 수식은 곱셈을 먼저 계산합니다.',
		],
		type: '규칙추리',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'symbol-rows',
			rows: [
				symRow(['🕯️', '+', '🕯️', '+', '🕯️'], '12'),
				symRow(['🕯️', '+', '🔔', '+', '🔔'], '14'),
				symRow(['🔔', '+', '🕰️', '+', '🕰️'], '11'),
				symRow(['🕯️', '+', '🔔', '×', '🕰️']),
			],
		},
	},
	{
		id: 7,
		title: '무지개 등불',
		question:
			'[저택의 기록]\n정원 온실의 등불은 색마다 정해진 번호가 있다.\n마지막 줄 등불의 번호를 순서대로 이으면 온실 자물쇠의 비밀번호가 된다. (숫자만 입력)',
		answer: '4512',
		hint: [
			'첫째 줄 세 등불이 1, 3, 5라면 빨강 · 노랑 · 파랑이 각각 몇 번일지 생각해 보세요.',
			'무지개 빛깔의 순서(빨주노초파남보)를 떠올려 보세요.',
		],
		type: '규칙추리',
		difficulty: 1,
		inputType: 'number',
		visual: {
			kind: 'symbol-rows',
			rows: [
				symRow(
					[
						{ color: RED, label: '빨강' },
						{ color: YELLOW, label: '노랑' },
						{ color: BLUE, label: '파랑' },
					],
					'135',
				),
				symRow(
					[
						{ color: ORANGE, label: '주황' },
						{ color: GREEN, label: '초록' },
						{ color: RED, label: '빨강' },
					],
					'241',
				),
				symRow(
					[
						{ color: YELLOW, label: '노랑' },
						{ color: ORANGE, label: '주황' },
						{ color: BLUE, label: '파랑' },
					],
					'325',
				),
				symRow([
					{ color: GREEN, label: '초록' },
					{ color: BLUE, label: '파랑' },
					{ color: RED, label: '빨강' },
					{ color: ORANGE, label: '주황' },
				]),
			],
		},
	},
	{
		id: 12,
		title: '멈춘 괘종시계',
		question:
			'[저택의 기록]\n복도의 괘종시계 문자판에 이상한 계산식이 적혀 있다.\n시계 위에서만 통하는 규칙이다. 마지막 식의 값은? (숫자만 입력)',
		answer: '5',
		hint: [
			'3 + 4 = 7은 평범하지만 5 + 9 = 2는 이상합니다. 시계판에는 숫자가 어디까지 있나요?',
			'12를 넘으면 다시 1부터 세어 올라갑니다.',
		],
		type: '규칙추리',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'symbol-rows',
			background: 'clock',
			rows: [
				symRow(['3', '+', '4'], '7'),
				symRow(['5', '+', '9'], '2'),
				symRow(['8', '+', '7'], '3'),
				symRow(['6', '+', '11']),
			],
		},
	},
	{
		id: 16,
		title: '동그라미 세기',
		question:
			'[저택의 기록]\n서재 문에 낱말과 숫자가 짝지어 새겨져 있다.\n낱말 속에 숨은 규칙을 찾아 마지막 낱말의 숫자를 구하라. (숫자만 입력)',
		answer: '3',
		hint: [
			'낱말마다 글자 모양을 눈으로 살펴보세요. 숫자 0인 낱말은 어떤 점이 다른가요?',
			'글자 속 동그라미(ㅇ)의 개수를 세어 보세요. 받침의 ㅇ도 셉니다.',
		],
		type: '관찰',
		difficulty: 3,
		inputType: 'number',
		visual: {
			kind: 'symbol-rows',
			rows: [
				symRow(['사과'], '0'),
				symRow(['아이'], '2'),
				symRow(['영양'], '4'),
				symRow(['원앙']),
			],
		},
	},
];
