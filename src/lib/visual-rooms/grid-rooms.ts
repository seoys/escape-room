import 'server-only';
import { Room } from '@/types/room';

export const gridRooms: Room[] = [
	{
		id: 4,
		title: '석판의 아홉 글자',
		question:
			'[저택의 기록]\n서고 문 앞 석판에 글자 아홉 개와 자음 세 개가 새겨져 있다.\n자음에 맞는 글자를 하나씩 골라 순서대로 이으면 열쇠가 되는 낱말이 된다. 그 낱말은?',
		answer: '거미줄',
		hint: [
			'ㄱ으로 시작하는 글자는 하나뿐입니다. 그 글자부터 정하세요.',
			'ㅁ과 ㅈ 후보가 둘씩 있습니다. 읽었을 때 진짜 낱말이 되는 조합을 찾으세요.',
		],
		type: '암호',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'grid',
			caption: 'ㄱ  ㅁ  ㅈ  =  ?',
			rows: [
				[{ text: '미' }, { text: '책' }, { text: '별' }],
				[{ text: '꽃' }, { text: '달' }, { text: '거' }],
				[{ text: '줄' }, { text: '문' }, { text: '장' }],
			],
		},
	},
	{
		id: 23,
		title: '촛불이 켜진 타일',
		question:
			'[저택의 기록]\n무도회장 바닥의 글자 타일 중 몇 개에만 촛불이 켜져 있다.\n타일 아래 경고문을 따라 낱말을 읽어라. (영어 대문자로 입력)',
		answer: 'MANOR',
		hint: [
			'촛불이 켜진 타일만 보세요. 몇 개인가요?',
			'위에서 아래로, 같은 줄에서는 왼쪽에서 오른쪽으로 읽습니다.',
		],
		type: '관찰',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'grid',
			caption:
				'경고: 불이 켜진 타일 외에는 밟지 마라. 위에서 아래로, 왼쪽에서 오른쪽으로 읽어라.',
			rows: [
				[
					{ text: 'M', mark: 'highlight' },
					{ text: 'T' },
					{ text: 'A', mark: 'highlight' },
				],
				[
					{ text: 'S' },
					{ text: 'N', mark: 'highlight' },
					{ text: 'L' },
				],
				[
					{ text: 'O', mark: 'highlight' },
					{ text: 'D' },
					{ text: 'R', mark: 'highlight' },
				],
			],
		},
	},
	{
		id: 26,
		title: '장부의 숫자표',
		question:
			'[저택의 기록]\n집사의 장부에 두 줄짜리 숫자표가 있다. 왼쪽 숫자마다 오른쪽 숫자가 정해진다.\n빈 칸에 들어갈 숫자는? (숫자만 입력)',
		answer: '30',
		hint: [
			'오른쪽 숫자가 얼마씩 커지는지 보세요: 2, 6, 12, 20 …',
			'커지는 폭이 4, 6, 8로 2씩 늘어납니다. 다음 폭은 10입니다.',
		],
		type: '규칙추리',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'grid',
			rows: [
				[{ text: '1' }, { text: '2' }],
				[{ text: '2' }, { text: '6' }],
				[{ text: '3' }, { text: '12' }],
				[{ text: '4' }, { text: '20' }],
				[{ text: '5' }, { mark: 'hidden' }],
			],
		},
	},
	{
		id: 27,
		title: '금고 키패드',
		question:
			'[저택의 기록]\n서재 금고의 키패드에 지문 자국이 남은 칸만 반짝인다.\n자국이 남은 번호를 위에서 아래로, 같은 줄에서는 왼쪽에서 오른쪽으로 읽어 금고의 번호를 맞혀라. (숫자만 입력)',
		answer: '3580',
		hint: [
			'반짝이는 칸이 몇 개인지 먼저 세어 보세요.',
			'읽는 순서는 책을 읽는 순서와 같습니다.',
		],
		type: '관찰',
		difficulty: 1,
		inputType: 'number',
		visual: {
			kind: 'grid',
			rows: [
				[
					{ text: '1' },
					{ text: '2' },
					{ text: '3', mark: 'highlight' },
				],
				[
					{ text: '4' },
					{ text: '5', mark: 'highlight' },
					{ text: '6' },
				],
				[
					{ text: '7' },
					{ text: '8', mark: 'highlight' },
					{ text: '9' },
				],
				[
					{ text: '*' },
					{ text: '0', mark: 'highlight' },
					{ text: '#' },
				],
			],
		},
	},
	{
		id: 29,
		title: '화살표 복도',
		question:
			'[저택의 기록]\n복도 바닥 타일마다 글자와 화살표가 새겨져 있다.\n빛나는 타일에서 출발해 화살표를 따라가며 글자를 모으면 천장의 장식 이름이 된다. 그 이름은?',
		answer: '샹들리에',
		hint: [
			'화살표가 가리키는 다음 타일로 한 칸씩만 움직이세요.',
			'화살표가 없는 타일에서 멈춥니다.',
		],
		type: '관찰',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'grid',
			rows: [
				[
					{ text: '샹', arrow: 'right', mark: 'highlight' },
					{ text: '들', arrow: 'down' },
					{ text: '꽃', arrow: 'down' },
				],
				[
					{ text: '밤', arrow: 'up' },
					{ text: '리', arrow: 'right' },
					{ text: '에' },
				],
				[
					{ text: '문', arrow: 'right' },
					{ text: '창', arrow: 'right' },
					{ text: '불', arrow: 'up' },
				],
			],
		},
	},
];
