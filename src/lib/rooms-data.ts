import 'server-only';
import { Room } from '@/types/room';
import { visualRooms } from '@/lib/visual-rooms';

// The game draws 30 of these 50 rooms for each run (see src/lib/room-pool.ts).
// Rooms 1~30: the original Level 1 set; 19 of them were replaced by visual puzzles and
// rooms 31~50 are visual puzzles written for the pool (see visual-rooms/). The rooms
// still defined below are the 11 text rooms that remain from the 2026-08-26 rewrite.
const legacyRooms: Room[] = [
	// ==========================================
	// 방 1~30 (the remaining text rooms of the original set)
	// ==========================================
	{
		id: 12,
		title: '스테인드글라스 창',
		question: '[탑의 기록]\n창문 유리 조각에 빨강=2, 파랑=5, 노랑=3이라는 숫자가 매겨져 있다.\n이 창문은 빨간 유리 3장, 파란 유리 2장, 노란 유리 1장으로 이루어져 있다.\n(빨간 유리 수 x 2) + (파란 유리 수 x 5) + (노란 유리 수 x 3)의 값은? (숫자만 입력)',
		answer: '19',
		hint: '3x2=6, 2x5=10, 1x3=3을 모두 더하세요.',
		type: '암호',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 14,
		title: '안내판의 문구',
		question: '[복도의 기록]\n복도 안내판에 네 개의 낡은 단어가 세로로 적혀 있다.\n"Old / Peaceful / Empty / Nights"\n각 단어의 첫 글자만 위에서부터 순서대로 읽으면 어떤 단어가 되는가? (대문자 4글자)',
		answer: 'OPEN',
		hint: '각 줄의 맨 앞 글자만 모아보세요.',
		type: '암호',
		difficulty: 2,
	},
	{
		id: 17,
		title: '하인들의 오후',
		question: '[복도의 기록]\n요리사, 집사, 정원사가 각각 다른 시간에 청소를 마쳤다.\n① 정원사는 세 사람 중 가장 마지막에 끝냈다.\n② 집사는 두 번째로 끝났다.\n가장 먼저 청소를 끝낸 사람은 누구인가? (요리사/집사/정원사 중 입력)',
		answer: '요리사',
		hint: '정원사=마지막, 집사=두 번째이므로 남은 사람이 첫 번째입니다.',
		type: '추리',
		difficulty: 1,
	},
	{
		id: 20,
		title: '편지 봉인',
		question: '[서재의 기록]\n편지를 완성하는 과정 조각들을 순서대로 탭하시오.',
		answer: '편지쓰기봉투에넣기촛농으로봉인우표붙이기',
		hint: '쓰고, 담고, 봉하고, 붙이는 순서를 생각하세요.',
		type: '타일배열',
		difficulty: 1,
		inputType: 'tile-order',
		tiles: ['편지쓰기', '봉투에넣기', '촛농으로봉인', '우표붙이기'],
	},
	{
		id: 21,
		title: '차 한 잔',
		question: '[응접실의 기록]\n차를 우리는 과정 조각들을 순서대로 탭하시오.',
		answer: '찻잎넣기물붓기기다리기따르기',
		hint: '찻잎을 넣고, 물을 붓고, 기다린 뒤, 따르는 순서입니다.',
		type: '타일배열',
		difficulty: 1,
		inputType: 'tile-order',
		tiles: ['찻잎넣기', '물붓기', '기다리기', '따르기'],
	},
	{
		id: 22,
		title: '온실의 새싹',
		question: '[온실의 기록]\n식물이 자라나는 순서 조각들을 순서대로 탭하시오.',
		answer: '씨앗새싹줄기꽃',
		hint: '가장 작은 상태부터 순서대로 고르세요.',
		type: '타일배열',
		difficulty: 1,
		inputType: 'tile-order',
		tiles: ['씨앗', '새싹', '줄기', '꽃'],
	},
	{
		id: 23,
		title: '초상화 손질',
		question: '[다락방의 기록]\n낡은 초상화를 손질하는 과정 조각들을 순서대로 탭하시오.',
		answer: '먼지털기세척하기건조하기액자걸기',
		hint: '털고, 씻고, 말리고, 거는 순서입니다.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['먼지털기', '세척하기', '건조하기', '액자걸기'],
	},
	{
		id: 25,
		title: '거꾸로 도는 시계',
		question: '[복도의 기록]\n하인은 매일 아침 저택의 모든 시계를 일부러 반대로(거울에 비친 모습처럼) 돌려놓는다.\n그 이유는 무엇일까? (고장이라서/거울방때문에/장난이라서 중 입력)',
		answer: '거울방때문에',
		hint: '이 저택엔 사방이 거울로 된 방이 있습니다. 거울에 비치면 시계가 다시 제대로 보이겠죠.',
		type: '넌센스',
		difficulty: 1,
	},
	{
		id: 26,
		title: '그림자 쓸기',
		question: '[정원의 기록]\n정원사는 매일 오후, 나무 그림자가 길어질 때마다 그 그림자를 정성껏 빗자루로 쓸어낸다.\n그 이유는 무엇일까? (그림자가무거워서/발자국을숨기려/전통이라서 중 입력)',
		answer: '발자국을숨기려',
		hint: '그림자 위에 남는 건 나무 그림자만이 아닙니다.',
		type: '넌센스',
		difficulty: 1,
	},
	{
		id: 27,
		title: '빈 소금 단지',
		question: '[부엌의 기록]\n주방 선반에는 소금 단지가 두 개 있는데, 하나는 항상 비어 있다.\n그 이유는 무엇일까? (열쇠를숨기려고/장식용이라서/소금이비싸서 중 입력)',
		answer: '열쇠를숨기려고',
		hint: '텅 빈 단지 속을 들여다본 사람은 아직 없습니다.',
		type: '넌센스',
		difficulty: 2,
	},
	{
		id: 29,
		title: '탑의 육각창',
		question: '[탑의 기록]\n탑의 창문은 정육각형 모양이다.\n창틀의 각 변마다 촛불을 하나씩 세우려면 촛불은 몇 개 필요한가? (숫자만 입력)',
		answer: '6',
		hint: '정육각형의 변은 몇 개인가요?',
		type: '도형',
		difficulty: 1,
		inputType: 'number',
	},
];

// Rooms rewritten as image/visual puzzles live in src/lib/visual-rooms/. They replace
// the text rooms with the same ids, so the merged list is kept sorted by id:
// getGameRooms resolves the player's draw against it by id.
export const rooms: Room[] = [...legacyRooms, ...visualRooms].sort(
	(a, b) => a.id - b.id,
);
