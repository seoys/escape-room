import 'server-only';
import { Room } from '@/types/room';

export const extraNoteRooms: Room[] = [
	{
		id: 36,
		title: '점자 쪽지',
		question:
			'[저택의 기록]\n벽난로 옆에 점자로 쓴 쪽지가 있다. 점자 대응표를 보고 마지막 줄의 낱말을 읽어라. (영어 대문자로 입력)',
		answer: 'HIDE',
		hint: [
			'점 모양이 같은 글자를 대응표에서 찾아 하나씩 바꾸세요.',
			'낱말은 네 글자입니다.',
		],
		type: '암호',
		difficulty: 3,
		inputType: 'text',
		visual: {
			kind: 'note',
			style: 'list',
			title: '점자 대응표',
			lines: [
				'⠁ A · ⠃ B · ⠉ C · ⠙ D · ⠑ E',
				'⠋ F · ⠛ G · ⠓ H · ⠊ I · ⠚ J',
				'⠓ ⠊ ⠙ ⠑',
			],
		},
	},
	{
		id: 38,
		title: '저울 추리',
		question:
			'[저택의 기록]\n서재 저울 옆에 무게를 비교한 쪽지가 남아 있다.\n다섯 물건 중 세 번째로 무거운 것은?',
		answer: '2',
		hint: [
			'가장 무거운 것과 가장 가벼운 것부터 찾아 양 끝에 놓으세요.',
			'문장을 이어서 무거운 것부터 가벼운 것 순서로 한 줄에 세워 보세요.',
		],
		type: '추리',
		difficulty: 3,
		inputType: 'choice',
		options: [
			{ value: '1', label: '상자' },
			{ value: '2', label: '항아리' },
			{ value: '3', label: '시계' },
			{ value: '4', label: '책' },
			{ value: '5', label: '촛대' },
		],
		visual: {
			kind: 'note',
			style: 'list',
			title: '무게 비교 쪽지',
			lines: [
				'상자는 항아리보다 무겁다.',
				'항아리는 시계보다 무겁다.',
				'책은 상자보다 가볍지만 항아리보다는 무겁다.',
				'시계는 촛대보다 무겁다.',
			],
		},
	},
	{
		id: 42,
		title: '금고 자물쇠',
		question:
			'[저택의 기록]\n지하 금고의 네 자리 자물쇠에 단서 네 줄이 붙어 있다. 네 단서가 가리키는 번호를 맞혀라.',
		answer: '2576',
		hint: [
			'첫째 자리부터 차례로 구하세요. 가장 작은 소수는 2입니다.',
			'넷째 자리는 앞의 세 자리를 구한 뒤 전체 합 20에서 빼면 됩니다.',
		],
		type: '추리',
		difficulty: 3,
		inputType: 'combo-lock',
		comboLength: 4,
		visual: {
			kind: 'note',
			style: 'list',
			title: '금고 단서',
			lines: [
				'첫째 자리는 가장 작은 소수다.',
				'둘째 자리는 첫째 자리의 3배보다 1 작다.',
				'셋째 자리는 첫째와 둘째 자리의 합이다.',
				'네 자리의 합은 20이다.',
			],
		},
	},
	{
		id: 43,
		title: '거꾸로 쓴 쪽지',
		question:
			'[저택의 기록]\n서재 벽에 거울에 비춘 듯 거꾸로 쓴 쪽지가 붙어 있다.\n열쇠는 어디에 있다고 적혀 있는가? (두 글자로 입력)',
		answer: ['시계', '시계뒤', '시계뒤에'],
		hint: [
			'끝 글자부터 거꾸로 읽어 보세요.',
			'띄어쓰기 단위도 거꾸로 놓여 있습니다.',
		],
		type: '암호',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'note',
			style: 'diary',
			lines: ['다있 에뒤 계시 는쇠열'],
		},
	},
	{
		id: 44,
		title: '초성 수수께끼',
		question:
			'[저택의 기록]\n서재 문에 수수께끼가 새겨져 있다. 초성을 단서로 두 낱말을 알아내 첫 글자를 이으면 저택의 한 장소가 된다. 그 장소는? (한글로 입력)',
		answer: '창고',
		hint: [
			'초성 ㅊㅁ에 어울리는 낱말은 빛이 들어오는 곳입니다.',
			'두 낱말의 첫 글자만 이어 쓰세요.',
		],
		type: '암호',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'note',
			style: 'list',
			title: '문 위의 수수께끼',
			lines: ['빛이 들어오는 곳 — ㅊㅁ', '쥐를 잡는 동물 — ㄱㅇㅇ'],
		},
	},
	{
		id: 45,
		title: '달력의 수요일',
		question:
			'[저택의 기록]\n벽에 걸린 달력이 찢어져 날짜 몇 개만 남았다. 이 달 3일이 일요일이라면 이 달의 세 번째 수요일은 며칠인가? (숫자만 입력)',
		answer: '20',
		hint: [
			'일요일 다음 날이 월요일입니다. 3일부터 요일을 하나씩 세어 가세요.',
			'수요일은 일요일에서 3일 뒤이고, 그다음부터 7일마다 돌아옵니다.',
		],
		type: '추리',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'note',
			style: 'list',
			title: '찢어진 달력',
			lines: ['일  월  화  수  목  금  토', '3일은 일요일이다.'],
		},
	},
	{
		id: 46,
		title: '주사위의 뒷면',
		question:
			'[저택의 기록]\n탁자 위의 주사위는 마주 보는 두 면의 눈을 더하면 항상 7이다.\n지금 위쪽 면은 4, 앞쪽 면은 2, 오른쪽 면은 3이 보인다.\n보이지 않는 아래, 뒤, 왼쪽 세 면의 눈을 모두 더하면? (숫자만 입력)',
		answer: '12',
		hint: [
			'아래쪽 면은 위쪽 면과 마주 봅니다. 마주 보는 면의 합은 7입니다.',
			'주사위 여섯 면의 눈을 모두 더하면 21입니다.',
		],
		type: '추리',
		difficulty: 2,
		inputType: 'number',
		visual: {
			kind: 'note',
			style: 'list',
			title: '주사위 메모',
			lines: [
				'마주 보는 두 면의 합 = 7',
				'보이는 면: 위 4 · 앞 2 · 오른쪽 3',
			],
		},
	},
	{
		id: 47,
		title: '흩어진 자모',
		question:
			'[저택의 기록]\n벽난로 옆 석판에 한글 자음과 모음이 낱개로 흩어져 있다. 한 줄이 한 글자가 되도록 합쳐 낱말을 만들어라. (한글로 입력)',
		answer: '촛불',
		hint: [
			'첫 줄은 초성 ㅊ, 중성 ㅗ, 종성 ㅅ이 모여 한 글자가 됩니다.',
			'밤을 밝히는 물건입니다.',
		],
		type: '암호',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'note',
			style: 'list',
			title: '흩어진 글자',
			lines: ['ㅊ ㅗ ㅅ', 'ㅂ ㅜ ㄹ'],
		},
	},
	{
		id: 48,
		title: '읽는 수열',
		question:
			'[저택의 기록]\n서재의 숫자판에 수가 한 줄씩 늘어 있다. 규칙을 찾아 물음표에 들어갈 수를 구하라. (숫자만 입력)',
		answer: '312211',
		hint: [
			'앞의 수를 더하거나 곱하는 것이 아니라, 앞의 수를 소리 내어 읽어 보세요.',
			'1은 "1이 한 개" → 11, 11은 "1이 두 개" → 21입니다.',
		],
		type: '규칙추리',
		difficulty: 4,
		inputType: 'number',
		visual: {
			kind: 'note',
			style: 'list',
			title: '숫자판',
			lines: ['1', '11', '21', '1211', '111221', '?'],
		},
	},
	{
		id: 49,
		title: '손님의 줄',
		question:
			'[저택의 기록]\n만찬회에 온 손님 다섯 명이 한 줄로 서 있다. 조건을 모두 만족할 때 앞에서 세 번째에 서 있는 사람은 누구인가?',
		answer: '2',
		hint: [
			'맨 뒤에 서는 사람부터 정하세요.',
			'가온-나래-마루가 이어서 서고, 그 앞에 라온이 섭니다.',
		],
		type: '추리',
		difficulty: 3,
		inputType: 'choice',
		options: [
			{ value: '1', label: '가온' },
			{ value: '2', label: '나래' },
			{ value: '3', label: '다솜' },
			{ value: '4', label: '라온' },
			{ value: '5', label: '마루' },
		],
		visual: {
			kind: 'note',
			style: 'list',
			title: '줄 서기 조건',
			lines: [
				'가온은 나래 바로 앞에 선다.',
				'다솜은 맨 뒤에 선다.',
				'라온은 가온보다 앞에 선다.',
				'마루는 나래 바로 뒤에 선다.',
			],
		},
	},
];
