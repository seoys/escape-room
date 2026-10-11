import 'server-only';
import { Room } from '@/types/room';

export const imageRooms: Room[] = [
	{
		id: 20,
		title: '올빼미 키',
		question:
			'[저택의 기록]\n서재 벽화에 소년과 올빼미의 키를 재는 그림 세 장이 걸려 있다.\n세 번째 그림에서 올빼미의 키는 몇 cm인가? (숫자만 입력)',
		answer: '30',
		hint: [
			'첫 번째 그림은 소년의 키 + 올빼미의 키입니다.',
			'두 번째 그림의 110은 소년의 키 − 올빼미의 키입니다. 두 식을 비교해 보세요.',
		],
		type: '연산',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'image',
			src: '/puzzles/room-20-owl.svg',
			alt: '그림 세 장. 왼쪽: 올빼미를 머리에 얹은 소년의 전체 높이 170. 가운데: 소년 옆 바닥에 선 올빼미, 소년과 올빼미 머리 높이의 차이 110. 오른쪽: 올빼미 혼자의 키 물음표.',
			width: 480,
			height: 260,
		},
	},
	{
		id: 13,
		title: '자물쇠의 홈',
		question:
			'[저택의 기록]\n지하 창고 자물쇠의 열쇠 구멍을 자세히 살펴보라.\n네 개의 열쇠 중 이 자물쇠를 열 수 있는 열쇠는 무엇인가?',
		answer: 'C',
		hint: [
			'열쇠 구멍의 검은 윤곽에서 아래로 내려온 홈이 몇 개이고 길이가 어떤지 보세요.',
			'홈의 길이 순서와 똑같은 이빨을 가진 열쇠를 찾으세요.',
		],
		type: '관찰',
		difficulty: 2,
		inputType: 'choice',
		options: [
			{ value: 'A', label: '열쇠 A' },
			{ value: 'B', label: '열쇠 B' },
			{ value: 'C', label: '열쇠 C' },
			{ value: 'D', label: '열쇠 D' },
		],
		visual: {
			kind: 'image',
			src: '/puzzles/room-13-keys.svg',
			alt: '위에는 검은 열쇠 구멍이 있는 자물쇠, 아래에는 이빨 모양이 서로 다른 열쇠 A, B, C, D 네 개.',
			width: 480,
			height: 340,
		},
	},
	{
		id: 8,
		title: '지하 수도관',
		question:
			'[저택의 기록]\n지하실 수도관에서 물이 새고 있다. 수도꼭지에서 흘러나온 물은 어느 통들에 닿는가?\n닿는 통의 번호를 작은 수부터 이어서 입력하라. (숫자만 입력)',
		answer: '13',
		hint: [
			'빨간 ✕ 밸브가 있는 쪽으로는 물이 흐르지 않습니다.',
			'점(●)으로 만나는 관은 연결되고, 다리(∩)로 건너는 관은 연결되지 않습니다.',
		],
		type: '관찰',
		difficulty: 3,
		inputType: 'number',
		visual: {
			kind: 'image',
			src: '/puzzles/room-8-pipes.svg',
			alt: '위쪽 수도꼭지에서 나온 관이 둘로 갈라지고, 오른쪽 관에는 빨간 밸브가 있다. 왼쪽 관은 아래로 내려가며 옆 관과 점으로 만나고, 다른 옆 관은 다리로 건너간다. 아래에는 번호 1부터 4까지의 통이 있다.',
			width: 480,
			height: 340,
		},
	},
	{
		id: 17,
		title: '색색의 문',
		question:
			'[저택의 기록]\n저택의 비밀 통로에는 빨강과 파랑 문이 있다. 같은 색 문을 연속으로 지날 수는 없다.\n입구에서 출발해 어느 출구로 나갈 수 있는가?',
		answer: '2',
		hint: [
			'입구에서 갈 수 있는 두 길을 모두 따라가 보세요.',
			'방금 지난 문과 색이 같은 문은 건널 수 없습니다.',
		],
		type: '추리',
		difficulty: 3,
		inputType: 'choice',
		options: [
			{ value: '1', label: '출구 1' },
			{ value: '2', label: '출구 2' },
			{ value: '3', label: '출구 3' },
		],
		visual: {
			kind: 'image',
			src: '/puzzles/room-17-doors.svg',
			alt: '입구에서 출발해 빨강 또는 파랑 문으로 이어진 방들과 출구 1, 2, 3을 잇는 통로 지도.',
			width: 480,
			height: 270,
		},
	},
	{
		id: 11,
		title: '사건의 순서',
		question:
			'[저택의 기록]\n하인의 하루를 그린 만화 다섯 컷이 뒤섞여 있다.\n사건이 일어난 순서대로 컷을 눌러라.',
		answer: 'CAEBD',
		hint: [
			'문 앞에 편지가 처음 도착한 장면부터 찾으세요.',
			'문이 열려 있는 장면이 마지막입니다.',
		],
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['C', 'A', 'E', 'B', 'D'],
		tileImages: {
			A: '/puzzles/room-11-a.svg',
			B: '/puzzles/room-11-b.svg',
			C: '/puzzles/room-11-c.svg',
			D: '/puzzles/room-11-d.svg',
			E: '/puzzles/room-11-e.svg',
		},
	},
];
