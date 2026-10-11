import 'server-only';
import { Room } from '@/types/room';

export const noteRooms: Room[] = [
	{
		id: 14,
		title: '젖은 일기장',
		question:
			'[저택의 기록]\n서재 책상에서 젖은 일기장 한 쪽이 발견되었다.\n줄마다 눈여겨볼 곳이 있는 것 같다. 일기장이 가리키는 장소는? (한글로 입력)',
		answer: '비밀서재',
		hint: [
			'내용이 아니라 줄의 모양을 보세요. 줄마다 어디가 비슷한가요?',
			'각 줄의 첫 글자만 위에서 아래로 이어 읽어 보세요.',
		],
		type: '암호',
		difficulty: 1,
		inputType: 'text',
		visual: {
			kind: 'note',
			style: 'diary',
			title: '10월 3일 화요일',
			lines: [
				'비 오는 밤이었다. 복도의 시계가 멈춰 있었다.',
				'밀린 편지들을 정리하다 낡은 열쇠를 발견했다.',
				'서랍 깊숙한 곳에서 접힌 지도 한 장이 나왔다.',
				'재가 되어 버린 편지의 마지막 줄만 읽을 수 있었다.',
			],
		},
	},
	{
		id: 28,
		title: '서가에 끼운 쪽지',
		question:
			'[저택의 기록]\n서가 틈에 낱말 세 개가 적힌 쪽지가 끼워져 있다.\n낱말마다 같은 자리의 글자를 하나씩 모으면 저택의 한 장소가 나타난다. 그 장소는?',
		answer: '지하실',
		hint: [
			'첫 번째 글자를 모으면 의미가 되는 낱말이 나오나요? 다른 자리도 시도해 보세요.',
			'낱말마다 두 번째 글자를 이어 읽어 보세요.',
		],
		type: '암호',
		difficulty: 2,
		inputType: 'text',
		visual: {
			kind: 'note',
			style: 'list',
			title: '서가 쪽지',
			lines: ['고지서', '기하학', '교실'],
		},
	},
	{
		id: 25,
		title: '세 장의 카드',
		question:
			'[저택의 기록]\n서재 탁자 위에 카드 세 장 3, 7, 9가 놓여 있다. 하인이 카드 7을 냈다.\n쪽지의 규칙대로 하인을 이기려면 어떤 카드를 내야 하는가?',
		answer: '9',
		hint: [
			'세 줄의 규칙이 꼬리를 물고 이어집니다. "7을 이긴다"라고 적힌 줄을 찾으세요.',
		],
		type: '추리',
		difficulty: 1,
		inputType: 'choice',
		options: [
			{ value: '3', label: '카드 3' },
			{ value: '7', label: '카드 7' },
			{ value: '9', label: '카드 9' },
		],
		visual: {
			kind: 'note',
			style: 'warning',
			title: '카드놀이 규칙',
			lines: [
				'7은 3보다 강하다.',
				'3은 9보다 강하다.',
				'9는 7보다 강하다.',
			],
		},
	},
];
