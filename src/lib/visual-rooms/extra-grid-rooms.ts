import 'server-only';
import { Room } from '@/types/room';

export const extraGridRooms: Room[] = [
	{
		id: 31,
		title: '서재의 마방진',
		question:
			'[저택의 기록]\n서재 선반에 3x3 숫자판이 놓여 있다. 가로, 세로, 대각선의 합이 모두 같다.\n물음표 두 칸의 숫자를 위에서부터 차례로 이어 쓰시오. (숫자만 입력)',
		answer: '17',
		hint: [
			'이미 완성된 줄을 찾아 모든 줄의 합이 얼마인지 먼저 구하세요.',
			'합을 알면, 빈칸이 하나뿐인 줄에서 빈칸의 값이 정해집니다.',
		],
		type: '규칙추리',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'grid',
			caption: '가로 · 세로 · 대각선의 합은 모두 같다',
			rows: [
				[{ text: '8' }, { mark: 'hidden' }, { text: '6' }],
				[{ text: '3' }, { text: '5' }, { mark: 'hidden' }],
				[{ text: '4' }, { text: '9' }, { text: '2' }],
			],
		},
	},
	{
		id: 34,
		title: '복도 명령',
		question:
			'[저택의 기록]\n복도 바닥의 글자판 위에서 빛나는 칸에서 출발한다.\n판 아래의 명령대로 한 칸씩 움직여 도착한 칸의 글자를 입력하시오.',
		answer: '별',
		hint: [
			'명령 하나가 한 칸 이동입니다. 손가락으로 따라가며 한 칸씩 확인하세요.',
			'↑ 위, ↓ 아래, ← 왼쪽, → 오른쪽입니다.',
		],
		type: '관찰',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'grid',
			caption: '명령: ↑ ↑ → → ↓ → ↑ ↑',
			rows: [
				[
					{ text: '밤' },
					{ text: '달' },
					{ text: '해' },
					{ text: '별' },
				],
				[
					{ text: '꽃' },
					{ text: '불' },
					{ text: '창' },
					{ text: '새' },
				],
				[
					{ text: '문' },
					{ text: '책' },
					{ text: '샘' },
					{ text: '꿈' },
				],
				[
					{ text: '탑', mark: 'highlight' },
					{ text: '열' },
					{ text: '쇠' },
					{ text: '길' },
				],
			],
		},
	},
	{
		id: 35,
		title: '전화 키패드 암호',
		question:
			'[저택의 기록]\n오래된 전화기의 숫자 버튼에는 알파벳이 새겨져 있다.\n전화기 아래 암호를 풀어 영어 낱말을 입력하시오. (영어 대문자로 입력)',
		answer: 'KEY',
		hint: [
			'암호는 세 묶음이고, 묶음 하나가 글자 하나입니다.',
			'5를 두 번 누르면 5번 칸의 두 번째 글자인 K입니다.',
		],
		type: '암호',
		difficulty: 3,
		inputType: 'text',
		visual: {
			kind: 'grid',
			caption:
				'같은 숫자를 n번 누르면 그 칸의 n번째 글자가 됩니다. 암호: 55 · 33 · 999',
			rows: [
				[{ text: '1' }, { text: '2 ABC' }, { text: '3 DEF' }],
				[{ text: '4 GHI' }, { text: '5 JKL' }, { text: '6 MNO' }],
				[{ text: '7 PQRS' }, { text: '8 TUV' }, { text: '9 WXYZ' }],
				[{ text: '*' }, { text: '0' }, { text: '#' }],
			],
		},
	},
	{
		id: 39,
		title: '대각선 읽기',
		question:
			'[저택의 기록]\n서재 바닥의 3x3 글자판에서 왼쪽 위에서 오른쪽 아래로 이어지는 대각선을 읽어라. 그것이 이 방이 가리키는 물건이다. (한글로 입력)',
		answer: '나침반',
		hint: [
			'대각선에는 글자가 세 개 있습니다.',
			'왼쪽 위 칸, 가운데 칸, 오른쪽 아래 칸을 차례로 읽으세요.',
		],
		type: '관찰',
		difficulty: 1,
		inputType: 'text',
		visual: {
			kind: 'grid',
			rows: [
				[{ text: '나' }, { text: '달' }, { text: '별' }],
				[{ text: '밤' }, { text: '침' }, { text: '불' }],
				[{ text: '샘' }, { text: '책' }, { text: '반' }],
			],
		},
	},
	{
		id: 40,
		title: '작은 스도쿠',
		question:
			'[저택의 기록]\n응접실 탁자에 4x4 숫자판이 놓여 있다. 가로줄과 세로줄에는 1부터 4까지가 한 번씩만 들어간다.\n물음표 칸에 들어갈 숫자는? (숫자만 입력)',
		answer: '4',
		hint: [
			'물음표가 있는 가로줄에서 이미 쓰인 숫자를 지우세요.',
			'세로줄에서도 같은 방법으로 확인해 보세요.',
		],
		type: '추리',
		difficulty: 1,
		inputType: 'number',
		visual: {
			kind: 'grid',
			rows: [
				[{ text: '1' }, { text: '2' }, {}, { text: '4' }],
				[
					{ text: '3' },
					{ mark: 'hidden' },
					{ text: '1' },
					{ text: '2' },
				],
				[{}, { text: '1' }, { text: '4' }, { text: '3' }],
				[{ text: '4' }, { text: '3' }, { text: '2' }, {}],
			],
		},
	},
	{
		id: 41,
		title: '건너뛰는 알파벳',
		question:
			'[저택의 기록]\n서고 책등에 알파벳이 간격을 두고 붙어 있다. 물음표에 들어갈 글자는? (영어 대문자로 입력)',
		answer: 'O',
		hint: [
			'글자와 글자 사이에 건너뛴 글자의 수를 세어 보세요.',
			'건너뛰는 수가 매번 하나씩 늘어납니다.',
		],
		type: '규칙추리',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'grid',
			rows: [
				[
					{ text: 'A' },
					{ text: 'C' },
					{ text: 'F' },
					{ text: 'J' },
					{ mark: 'hidden' },
				],
			],
		},
	},
];
