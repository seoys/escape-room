# 연령 구분 폐지 + 50문제 풀에서 30문제 랜덤 출제 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 나이별 레벨을 없애고, 방 1~50의 풀에서 새 판마다 30개를 랜덤 순서로 뽑아 모두가 같은 방식으로 풀게 하며, 풀을 채울 신규 20문제(방 31~50)를 추가한다.

**Architecture:** 출제 결과(방 id 30개의 순서)를 쿠키 `game_rooms`(`12.3.45…`)에 저장하고, 서버(`page.tsx`, `verifyAnswer`)가 같은 순수 함수 `getGameRooms(cookie)`로 방을 해석한다. 시작 화면이 새 판에서 `pickRoomIds()`로 뽑아 쿠키와 서버 세션(`roomIds`)에 저장하고, 이어하기는 세션의 `roomIds`로 복원한다. 신규 20문제는 기존 렌더러/입력을 재사용하고 새 SVG는 2개만 만든다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind, Node 22, `node:test` + `tsx`(`pnpm test`).

**Spec:** `docs/superpowers/specs/2026-10-11-random-room-pool-design.md`

## Global Constraints

- Node `>=22.0.0`, 패키지 매니저 `pnpm`. 브랜치는 `feat/room-pool`에서 작업한다(이미 생성됨).
- 코드 스타일은 `.prettierrc.cjs`: 홑따옴표, 세미콜론, **탭(tabWidth 4)**, trailing comma `all`, `arrowParens: "avoid"`. **새로 만드는 파일**만 `pnpm exec prettier --write <files>`로 정리한다. 기존 2칸 들여쓰기 파일(`src/app/escape/[roomId]/page.tsx`, `src/app/actions/game.ts`, `RoomClient.tsx`, `src/app/start/page.tsx`, `src/app/finish/page.tsx`, `rooms-data.ts`)은 서식을 바꾸지 않고 주변 스타일을 따른다.
- import는 `@/` 별칭. 정답이 있는 데이터 모듈(`src/lib/visual-rooms/*`, `rooms-data.ts`) 첫 줄은 `import 'server-only';`이다.
- 정답을 클라이언트에 보내는 필드에 넣지 않는다(`visual`/`options`는 표시용). 숨김 격자 칸은 `{ mark: 'hidden' }`(텍스트 없음)으로 쓴다.
- 신규 문항은 고딕 저택 서사의 `[저택의 기록]`으로 시작하는 지시문을 쓰고, `variants` 없이 단일 문항이며, 힌트는 문자열 배열 1~2개다.
- 풀 크기 `POOL_SIZE = 50`, 출제 수 `TOTAL_ROOMS = 30`(`src/lib/constants.ts`). 쿠키 이름 `game_rooms`, 값 형식 `12.3.45`(점으로 이은 방 id), 유효기간 30일(`max-age=2592000`).
- 쿠키가 없거나 형식이 틀리면 방 1~30을 순서대로 쓴다(`DEFAULT_ROOM_IDS`).
- 커밋 메시지는 `CLAUDE.md` 규칙: 한국어, 형식 `[type] 메시지`(type은 `feat|fix|refactor|chore|docs|style|perf|test|build`). 본문 끝에 아래 줄을 붙인다.

```
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

## Review Focus

스펙은 침묵하지만 플레이어가 만날 수 있는 상황이다. 각 줄의 테스트는 오른쪽 Task가 담당한다.

- 쿠키가 위변조되거나(개수 부족, 중복, 범위 밖, 숫자 아님) 비어 있으면 게임이 깨지지 않고 방 1~30으로 진행된다: Task 1 `parseRoomIds` 테스트, Task 6 `getGameRooms` 테스트.
- 페이지가 보여주는 방과 `verifyAnswer`가 검증하는 방이 같아야 한다(둘 다 `getGameRooms(cookie)`의 `roomId - 1` 위치): Task 6 `answer-check`/`getGameRooms` 통합 테스트.
- 기능 배포 이전에 만든 이어하기 세션에는 `roomIds`가 없다 → 방 1~30으로 복원한다: Task 1 `validRoomIds` 테스트(비배열·undefined 거부), Task 7 코드.
- 숨김 칸에 정답이 실려 나가지 않는다: Task 3 테스트(숨김 칸에 `text` 없음).
- 풀의 id가 1~50 연속이고 정렬돼 있어야 한다(`getGameRooms`가 id로 찾지만 manifest가 연속성을 확인): Task 8.
- 점자(`⠓`)·🔥/⚫ 이모지가 실제 화면에서 보인다: Task 9 브라우저 QA.
- 이어하기 경로(원격 세션 복원)는 원격 API 없이 브라우저에서 재현할 수 없다: 순수 함수는 테스트하고, 흐름은 코드 리뷰로만 확인한다(Task 9에서 한계를 명시).

---

## File Structure

| 파일 | 역할 | 작업 |
| --- | --- | --- |
| `src/lib/constants.ts` | `POOL_SIZE` 추가 | Modify |
| `src/lib/room-pool.ts` | 출제·직렬화·검증·쿠키 문자열 | Create |
| `src/lib/answer-check.ts` | 정답 비교 순수 함수 | Create |
| `src/lib/room-selector.ts` | `getGameRooms`·`resolveRoomIds`로 교체 | Modify |
| `src/app/actions/game.ts` | 쿠키로 방을 찾아 검증 | Modify |
| `src/app/escape/[roomId]/page.tsx`, `RoomClient.tsx` | 레벨 → `roomIds` | Modify |
| `src/app/start/page.tsx` | 레벨 UI 제거, 출제·쿠키·복원 | Modify |
| `src/app/finish/page.tsx` | 레벨 표시 제거 | Modify |
| `src/types/room.ts`, `src/types/session.ts` | `Level` 제거, `StoredSession.roomIds` | Modify |
| `src/lib/level.ts` | 삭제 | Delete |
| `public/puzzles/room-33-spot.svg`, `room-50-squares.svg` | 신규 일러스트 | Create |
| `src/lib/visual-rooms/extra-grid-rooms.ts` | 방 31·34·35·39·40·41 | Create |
| `src/lib/visual-rooms/extra-symbol-rooms.ts` | 방 32 | Create |
| `src/lib/visual-rooms/extra-note-rooms.ts` | 방 36·38·42~49 | Create |
| `src/lib/visual-rooms/extra-misc-rooms.ts` | 방 33·37·50 | Create |
| `src/lib/visual-rooms/index.ts` | 신규 방 병합 | Modify |
| `src/lib/rooms-data.ts` | 31~120 제거 | Modify |
| `src/__tests__/**` | 위 각 단위 테스트와 헬퍼 | Create/Modify |
| `CLAUDE.md` | 구조 설명 갱신 | Modify |

---

### Task 1: 풀 상수와 `room-pool` 라이브러리

**Files:**
- Modify: `src/lib/constants.ts`
- Create: `src/lib/room-pool.ts`
- Test: `src/__tests__/room-pool.test.ts`

**Interfaces:**
- Produces (`@/lib/constants`): `POOL_SIZE = 50` (기존 `TOTAL_ROOMS = 30` 유지).
- Produces (`@/lib/room-pool`):
  - `GAME_ROOMS_COOKIE_KEY = 'game_rooms'`
  - `DEFAULT_ROOM_IDS: number[]` — `[1..30]`
  - `pickRoomIds(poolSize = POOL_SIZE, count = TOTAL_ROOMS, random = Math.random): number[]` — 1~poolSize에서 중복 없이 count개를 섞인 순서로.
  - `serializeRoomIds(ids: number[]): string` — `'12.3.45'`
  - `validRoomIds(ids: unknown, poolSize = POOL_SIZE, count = TOTAL_ROOMS): number[] | null` — 길이 count, 정수, 1~poolSize, 중복 없음이면 그대로, 아니면 `null`.
  - `parseRoomIds(raw: string | null | undefined, poolSize = POOL_SIZE, count = TOTAL_ROOMS): number[] | null`
  - `gameRoomsCookie(ids: number[]): string` — `'game_rooms=12.3.45; path=/; max-age=2592000'`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/room-pool.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	DEFAULT_ROOM_IDS,
	GAME_ROOMS_COOKIE_KEY,
	gameRoomsCookie,
	parseRoomIds,
	pickRoomIds,
	serializeRoomIds,
	validRoomIds,
} from '@/lib/room-pool';

test('constants: 30 rooms are drawn from a pool of 50', () => {
	assert.equal(GAME_ROOMS_COOKIE_KEY, 'game_rooms');
	assert.deepEqual(
		DEFAULT_ROOM_IDS,
		Array.from({ length: 30 }, (_, i) => i + 1),
	);
});

test('pickRoomIds returns 30 unique ids from 1..50', () => {
	for (let i = 0; i < 50; i++) {
		const ids = pickRoomIds();
		assert.equal(ids.length, 30);
		assert.equal(new Set(ids).size, 30);
		assert.ok(ids.every(id => Number.isInteger(id) && id >= 1 && id <= 50));
	}
});

test('pickRoomIds is deterministic for a fixed random source', () => {
	// random() = 0 swaps every position with index 0: [1,2,3,4,5] -> [2,3,4,5,1]
	assert.deepEqual(
		pickRoomIds(5, 3, () => 0),
		[2, 3, 4],
	);
	assert.deepEqual(
		pickRoomIds(5, 3, () => 0),
		pickRoomIds(5, 3, () => 0),
	);
});

test('pickRoomIds differs between plays (order and membership are random)', () => {
	const seen = new Set<string>();
	for (let i = 0; i < 20; i++) seen.add(serializeRoomIds(pickRoomIds()));
	assert.ok(seen.size > 1);
});

test('serialize / parse round trip', () => {
	const ids = pickRoomIds();
	assert.deepEqual(parseRoomIds(serializeRoomIds(ids)), ids);
	assert.equal(serializeRoomIds([12, 3, 45]), '12.3.45');
});

test('parseRoomIds rejects tampered or incomplete cookie values', () => {
	const good = serializeRoomIds(pickRoomIds());
	assert.equal(parseRoomIds(undefined), null);
	assert.equal(parseRoomIds(null), null);
	assert.equal(parseRoomIds(''), null);
	assert.equal(parseRoomIds('1.2.3'), null); // too short
	assert.equal(parseRoomIds(good + '.7'), null); // too long
	assert.equal(parseRoomIds(good.replace(/^\d+/, '99')), null); // out of range
	assert.equal(parseRoomIds(good.replace(/^\d+/, '0')), null);
	assert.equal(parseRoomIds(good.replace(/^\d+/, 'abc')), null);
	assert.equal(parseRoomIds(good.replace(/^\d+/, '-3')), null);
	assert.equal(parseRoomIds(good.replace(/^\d+/, '1.5')), null);
	const dup = serializeRoomIds([...Array(29).fill(0).map((_, i) => i + 1), 1]);
	assert.equal(parseRoomIds(dup), null); // duplicate id
});

test('validRoomIds accepts only a full, unique, in-range id array', () => {
	assert.deepEqual(validRoomIds(DEFAULT_ROOM_IDS), DEFAULT_ROOM_IDS);
	assert.equal(validRoomIds(undefined), null);
	assert.equal(validRoomIds('1.2.3'), null);
	assert.equal(validRoomIds([1, 2, 3]), null);
	assert.equal(validRoomIds([...DEFAULT_ROOM_IDS.slice(1), 51]), null);
	assert.equal(validRoomIds([...DEFAULT_ROOM_IDS.slice(1), 2]), null);
	assert.equal(validRoomIds([...DEFAULT_ROOM_IDS.slice(1), 1.5]), null);
});

test('gameRoomsCookie builds a 30-day cookie string', () => {
	assert.equal(
		gameRoomsCookie([12, 3, 45]),
		'game_rooms=12.3.45; path=/; max-age=2592000',
	);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/room-pool.test.ts`
Expected: FAIL (`Cannot find module '@/lib/room-pool'`).

- [ ] **Step 3: 구현**

`src/lib/constants.ts` 전체:

```ts
export const TOTAL_ROOMS = 30;
// Rooms 1~POOL_SIZE are in the pool; each new run draws TOTAL_ROOMS of them.
export const POOL_SIZE = 50;
```

`src/lib/room-pool.ts`:

```ts
import { POOL_SIZE, TOTAL_ROOMS } from '@/lib/constants';

export const GAME_ROOMS_COOKIE_KEY = 'game_rooms';

// Used when there is no (valid) draw yet: the first TOTAL_ROOMS rooms in order.
export const DEFAULT_ROOM_IDS: number[] = Array.from(
	{ length: TOTAL_ROOMS },
	(_, index) => index + 1,
);

export function pickRoomIds(
	poolSize = POOL_SIZE,
	count = TOTAL_ROOMS,
	random: () => number = Math.random,
): number[] {
	const ids = Array.from({ length: poolSize }, (_, index) => index + 1);
	for (let i = ids.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[ids[i], ids[j]] = [ids[j], ids[i]];
	}
	return ids.slice(0, count);
}

export const serializeRoomIds = (ids: number[]): string => ids.join('.');

export function validRoomIds(
	ids: unknown,
	poolSize = POOL_SIZE,
	count = TOTAL_ROOMS,
): number[] | null {
	if (!Array.isArray(ids) || ids.length !== count) return null;
	const inRange = ids.every(
		id => Number.isInteger(id) && id >= 1 && id <= poolSize,
	);
	if (!inRange || new Set(ids).size !== count) return null;
	return ids as number[];
}

export function parseRoomIds(
	raw: string | null | undefined,
	poolSize = POOL_SIZE,
	count = TOTAL_ROOMS,
): number[] | null {
	if (!raw) return null;
	const ids = raw.split('.').map(part => (/^\d+$/.test(part) ? Number(part) : NaN));
	return validRoomIds(ids, poolSize, count);
}

export const gameRoomsCookie = (ids: number[]): string =>
	`${GAME_ROOMS_COOKIE_KEY}=${serializeRoomIds(ids)}; path=/; max-age=2592000`;
```

- [ ] **Step 4: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/room-pool.test.ts`
Expected: PASS (8 tests). `'1.5'` 케이스는 `.`으로 쪼개져 개수 불일치로도 `null`이다(그래도 통과해야 한다).
Run: `pnpm exec prettier --write src/lib/constants.ts src/lib/room-pool.ts src/__tests__/room-pool.test.ts`
Run: `pnpm test`
Expected: 전체 PASS (기존 112 + 8).

- [ ] **Step 5: 커밋**

```bash
git add src/lib/constants.ts src/lib/room-pool.ts src/__tests__/room-pool.test.ts
git commit -m "[feat] 방 풀 랜덤 출제 라이브러리 추가

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: 신규 SVG 2개 (방 33 틀린 그림, 방 50 정사각형)

**Files:**
- Create: `public/puzzles/room-33-spot.svg`
- Create: `public/puzzles/room-50-squares.svg`
- Test: `src/__tests__/extra-assets.test.ts`

**Interfaces:**
- Produces: `/puzzles/room-33-spot.svg`(480x260, 두 그림), `/puzzles/room-50-squares.svg`(300x300, 3x3 격자). Task 5의 문항이 `src`로 참조한다.
- 틀린 그림 SVG 규칙(테스트가 검사한다): 왼쪽/오른쪽 패널은 각각 `<g id="panel-left">`, `<g id="panel-right">`(안에 중첩 `<g>` 없음, 요소당 한 줄)이고, **두 패널에서 서로 다른 줄은 모두 `data-diff="1"`~`"5"` 속성을 가진다.**

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/extra-assets.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (name: string) =>
	fs.readFileSync(path.join(process.cwd(), 'public', 'puzzles', name), 'utf8');

const panelLines = (svg: string, id: string, nextMarker: string): string[] => {
	const start = svg.indexOf(`<g id="${id}"`);
	assert.ok(start >= 0, `${id} missing`);
	const bodyStart = svg.indexOf('>', start) + 1;
	const end = svg.indexOf(nextMarker, bodyStart);
	assert.ok(end > bodyStart, `${id} end missing`);
	return svg
		.slice(bodyStart, end)
		.replace(/<\/g>\s*$/, '')
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);
};

for (const name of ['room-33-spot.svg', 'room-50-squares.svg']) {
	test(`${name} is a well-formed svg with a viewBox`, () => {
		const svg = read(name);
		assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
		assert.match(svg, /viewBox="0 0 \d+ \d+"/);
		assert.match(svg, /<\/svg>\s*$/);
		assert.equal((svg.match(/<g[\s>]/g) ?? []).length, (svg.match(/<\/g>/g) ?? []).length);
	});
}

test('room-33-spot.svg: the two panels differ in exactly 5 marked places', () => {
	const svg = read('room-33-spot.svg');
	const left = panelLines(svg, 'panel-left', '<g id="panel-right"');
	const right = panelLines(svg, 'panel-right', '<g fill="none"');
	const onlyLeft = left.filter(line => !right.includes(line));
	const onlyRight = right.filter(line => !left.includes(line));
	const differing = [...onlyLeft, ...onlyRight];
	assert.ok(differing.length > 0);
	for (const line of differing) {
		assert.match(line, /data-diff="[1-5]"/, `unmarked difference: ${line}`);
	}
	const marks = new Set(differing.map(line => /data-diff="([1-5])"/.exec(line)![1]));
	assert.deepEqual([...marks].sort(), ['1', '2', '3', '4', '5']);
});

test('room-50-squares.svg: a 3x3 grid hides 14 squares (9 + 4 + 1)', () => {
	const svg = read('room-50-squares.svg');
	const verticals = (svg.match(/data-line="v"/g) ?? []).length;
	const horizontals = (svg.match(/data-line="h"/g) ?? []).length;
	assert.equal(verticals, 4);
	assert.equal(horizontals, 4);
	const cells = verticals - 1;
	const squares = Array.from({ length: cells }, (_, i) => (cells - i) ** 2).reduce((a, b) => a + b, 0);
	assert.equal(squares, 14);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-assets.test.ts`
Expected: FAIL (파일 없음 `ENOENT`).

- [ ] **Step 3: 틀린 그림 SVG 작성 (`public/puzzles/room-33-spot.svg`)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260">
	<defs>
		<g id="base">
			<rect x="0" y="0" width="220" height="240" fill="#e9dcbc"/>
			<rect x="0" y="180" width="220" height="60" fill="#8a6d3b"/>
			<rect x="20" y="24" width="70" height="80" fill="#1d2a44" stroke="#2a2418" stroke-width="3"/>
			<line x1="55" y1="24" x2="55" y2="104" stroke="#2a2418" stroke-width="3"/>
			<line x1="20" y1="64" x2="90" y2="64" stroke="#2a2418" stroke-width="3"/>
			<circle cx="73" cy="40" r="8" fill="#f6e6a0"/>
			<rect x="30" y="150" width="100" height="10" fill="#5a4a2a"/>
			<rect x="38" y="160" width="8" height="40" fill="#5a4a2a"/>
			<rect x="114" y="160" width="8" height="40" fill="#5a4a2a"/>
			<rect x="150" y="40" width="56" height="130" fill="#5a4a2a" stroke="#2a2418" stroke-width="2"/>
			<rect x="156" y="48" width="8" height="30" fill="#c0392b"/>
			<rect x="166" y="52" width="8" height="26" fill="#2f6db5"/>
			<rect x="176" y="46" width="8" height="32" fill="#3f9b4c"/>
			<rect x="156" y="100" width="8" height="30" fill="#e3c21b"/>
			<rect x="166" y="104" width="8" height="26" fill="#c0392b"/>
			<rect x="176" y="98" width="8" height="32" fill="#2f6db5"/>
			<circle cx="125" cy="60" r="16" fill="#f4ead0" stroke="#2a2418" stroke-width="2"/>
			<circle cx="125" cy="60" r="1.5" fill="#2a2418"/>
			<rect x="104" y="98" width="36" height="36" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
			<rect x="109" y="103" width="26" height="26" fill="#f4ead0"/>
			<rect x="40" y="205" width="120" height="30" fill="#7a2f2f" stroke="#2a2418" stroke-width="2"/>
		</g>
		<g id="candle">
			<rect x="-3" y="-16" width="6" height="16" fill="#f4ead0" stroke="#2a2418" stroke-width="1.5"/>
			<ellipse cx="0" cy="-21" rx="3" ry="5" fill="#e0a030"/>
		</g>
	</defs>
	<rect width="480" height="260" fill="#cbb98f"/>
	<g id="panel-left" transform="translate(10 10)">
		<use href="#base"/>
		<use href="#candle" x="50" y="150"/>
		<use href="#candle" x="72" y="150"/>
		<line x1="125" y1="60" x2="125" y2="48" stroke="#2a2418" stroke-width="2"/>
		<line data-diff="2" x1="125" y1="60" x2="134" y2="60" stroke="#2a2418" stroke-width="2"/>
		<circle data-diff="3" cx="122" cy="116" r="10" fill="#7a2f2f"/>
		<circle cx="36" cy="44" r="2.5" fill="#f6e6a0"/>
		<circle data-diff="4" cx="36" cy="88" r="2.5" fill="#f6e6a0"/>
		<rect data-diff="5" x="70" y="205" width="4" height="30" fill="#e0a030"/>
		<rect data-diff="5" x="100" y="205" width="4" height="30" fill="#e0a030"/>
		<rect data-diff="5" x="130" y="205" width="4" height="30" fill="#e0a030"/>
	</g>
	<g id="panel-right" transform="translate(250 10)">
		<use href="#base"/>
		<use href="#candle" x="50" y="150"/>
		<use href="#candle" x="72" y="150"/>
		<use data-diff="1" href="#candle" x="94" y="150"/>
		<line x1="125" y1="60" x2="125" y2="48" stroke="#2a2418" stroke-width="2"/>
		<line data-diff="2" x1="125" y1="60" x2="116" y2="60" stroke="#2a2418" stroke-width="2"/>
		<rect data-diff="3" x="112" y="106" width="20" height="20" fill="#7a2f2f"/>
		<circle cx="36" cy="44" r="2.5" fill="#f6e6a0"/>
		<rect data-diff="5" x="62" y="205" width="4" height="30" fill="#e0a030"/>
		<rect data-diff="5" x="86" y="205" width="4" height="30" fill="#e0a030"/>
		<rect data-diff="5" x="110" y="205" width="4" height="30" fill="#e0a030"/>
		<rect data-diff="5" x="134" y="205" width="4" height="30" fill="#e0a030"/>
	</g>
	<g fill="none" stroke="#2a2418" stroke-width="3">
		<rect x="10" y="10" width="220" height="240"/>
		<rect x="250" y="10" width="220" height="240"/>
	</g>
</svg>
```

차이 5곳: ① 탁자 위 촛불 2개 vs 3개 ② 시계 시침 3시 방향 vs 9시 방향 ③ 액자 속 원 vs 사각형 ④ 창문 속 별 2개 vs 1개 ⑤ 양탄자 줄무늬 3줄 vs 4줄.

- [ ] **Step 4: 정사각형 SVG 작성 (`public/puzzles/room-50-squares.svg`)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
	<rect width="300" height="300" fill="#f4ead0"/>
	<rect x="30" y="30" width="240" height="240" fill="none" stroke="#2a2418" stroke-width="4"/>
	<line data-line="v" x1="110" y1="30" x2="110" y2="270" stroke="#2a2418" stroke-width="4"/>
	<line data-line="v" x1="190" y1="30" x2="190" y2="270" stroke="#2a2418" stroke-width="4"/>
	<line data-line="h" x1="30" y1="110" x2="270" y2="110" stroke="#2a2418" stroke-width="4"/>
	<line data-line="h" x1="30" y1="190" x2="270" y2="190" stroke="#2a2418" stroke-width="4"/>
	<line data-line="v" x1="30" y1="30" x2="30" y2="270" stroke="#2a2418" stroke-width="4"/>
	<line data-line="v" x1="270" y1="30" x2="270" y2="270" stroke="#2a2418" stroke-width="4"/>
	<line data-line="h" x1="30" y1="30" x2="270" y2="30" stroke="#2a2418" stroke-width="4"/>
	<line data-line="h" x1="30" y1="270" x2="270" y2="270" stroke="#2a2418" stroke-width="4"/>
</svg>
```

- [ ] **Step 5: 통과 확인과 눈으로 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-assets.test.ts`
Expected: PASS (4 tests).
Run: `for f in public/puzzles/room-33-spot.svg public/puzzles/room-50-squares.svg; do xmllint --noout "$f" && echo ok $f; done`
Expected: 두 파일 모두 `ok`.
`mcp__Claude_Browser__navigate`로 `file:///Volumes/extend/projects/escape-room/public/puzzles/room-33-spot.svg`를 열어(탭이 쌓이지 않게 확인 후 닫는다) 왼쪽·오른쪽 그림의 5가지 차이가 눈으로 구별되는지, `room-50-squares.svg`가 3x3 격자인지 확인한다.

- [ ] **Step 6: 커밋**

```bash
pnpm exec prettier --write src/__tests__/extra-assets.test.ts
git add public/puzzles/room-33-spot.svg public/puzzles/room-50-squares.svg src/__tests__/extra-assets.test.ts
git commit -m "[feat] 신규 퍼즐용 틀린 그림·정사각형 격자 SVG 추가

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: 신규 격자 문항 6개 (방 31·34·35·39·40·41)

**Files:**
- Create: `src/__tests__/helpers/find-room.ts`
- Create: `src/lib/visual-rooms/extra-grid-rooms.ts`
- Test: `src/__tests__/extra-rooms-grid.test.ts`

**Interfaces:**
- Consumes: `Room`, `GridCell`, `validateRoom`, `publicFileExists`.
- Produces: `extraGridRooms: Room[]`(id 31, 34, 35, 39, 40, 41 순). 테스트 헬퍼 `roomById(rooms, id): Room`, `gridOf(room)`, `noteLinesOf(room): string[]`.

- [ ] **Step 1: 테스트 헬퍼와 실패하는 테스트 작성**

`src/__tests__/helpers/find-room.ts`:

```ts
import assert from 'node:assert/strict';
import { Room } from '@/types/room';

export const roomById = (rooms: Room[], id: number): Room => {
	const room = rooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

export const gridOf = (room: Room) => {
	if (room.visual?.kind !== 'grid') throw new Error(`room ${room.id} is not a grid`);
	return room.visual;
};

export const noteLinesOf = (room: Room): string[] => {
	if (room.visual?.kind !== 'note') throw new Error(`room ${room.id} is not a note`);
	return room.visual.lines;
};
```

`src/__tests__/extra-rooms-grid.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { extraGridRooms } from '@/lib/visual-rooms/extra-grid-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { gridOf, roomById } from './helpers/find-room';

const byId = (id: number) => roomById(extraGridRooms, id);

test('extra grid rooms: ids 31, 34, 35, 39, 40, 41 pass validateRoom and carry no variants', () => {
	assert.deepEqual(
		extraGridRooms.map(r => r.id),
		[31, 34, 35, 39, 40, 41],
	);
	for (const room of extraGridRooms) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), []);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
		assert.ok(Array.isArray(room.hint) && room.hint.length >= 1);
	}
});

test('hidden cells never carry text (the masked answer must not be in the data)', () => {
	for (const room of extraGridRooms) {
		for (const cell of gridOf(room).rows.flat()) {
			if (cell.mark === 'hidden') assert.equal(cell.text, undefined, `room ${room.id}`);
		}
	}
});

test('room 31: blanks follow from the equal line sums (rows and columns agree) and read as the answer', () => {
	const { rows } = gridOf(byId(31));
	const sum = 15;
	assert.equal(rows[2].reduce((s, cell) => s + Number(cell.text), 0), sum);
	const hiddenIn = (cells: { mark?: string }[]) => cells.filter(c => c.mark === 'hidden').length;
	const filled: number[] = [];
	rows.forEach((row, r) =>
		row.forEach((cell, c) => {
			if (cell.mark !== 'hidden') return;
			const column = rows.map(other => other[c]);
			assert.equal(hiddenIn(row), 1);
			assert.equal(hiddenIn(column), 1);
			const byRow = sum - row.reduce((s, o) => s + (o.mark === 'hidden' ? 0 : Number(o.text)), 0);
			const byCol = sum - column.reduce((s, o) => s + (o.mark === 'hidden' ? 0 : Number(o.text)), 0);
			assert.equal(byRow, byCol, `cell ${r},${c}`);
			filled.push(byRow);
		}),
	);
	assert.equal(filled.join(''), byId(31).answer);
});

test('room 34: following the 8 caption commands from the lit cell ends on the answer', () => {
	const { rows, caption } = gridOf(byId(34));
	let r = rows.findIndex(row => row.some(c => c.mark === 'highlight'));
	let c = rows[r].findIndex(cell => cell.mark === 'highlight');
	const commands = ((caption ?? '').split('명령:')[1] ?? '').match(/[↑↓←→]/g) ?? [];
	assert.equal(commands.length, 8);
	for (const command of commands) {
		r += command === '↓' ? 1 : command === '↑' ? -1 : 0;
		c += command === '→' ? 1 : command === '←' ? -1 : 0;
		assert.ok(rows[r]?.[c], 'a command leaves the grid');
	}
	assert.equal(rows[r][c].text, byId(34).answer);
});

test('room 35: the keypad code decodes (n presses = nth letter) to the answer', () => {
	const { rows, caption } = gridOf(byId(35));
	const tokens = ((caption ?? '').split('암호:')[1] ?? '').trim().split(/[\s·]+/).filter(Boolean);
	assert.equal(tokens.length, 3);
	const word = tokens
		.map(token => {
			const cell = rows.flat().find(c => c.text?.startsWith(`${token[0]} `));
			assert.ok(cell, `no key ${token[0]}`);
			return cell.text!.split(' ')[1][token.length - 1];
		})
		.join('');
	assert.equal(word, byId(35).answer);
});

test('room 39: the top-left to bottom-right diagonal spells the answer', () => {
	const { rows } = gridOf(byId(39));
	assert.equal(rows.length, rows[0].length);
	assert.equal(rows.map((row, i) => row[i].text).join(''), byId(39).answer);
});

test('room 40: the hidden sudoku cell is the single digit missing from its row and column', () => {
	const { rows } = gridOf(byId(40));
	const digits = [1, 2, 3, 4];
	let r = -1;
	let c = -1;
	rows.forEach((row, ri) =>
		row.forEach((cell, ci) => {
			if (cell.mark === 'hidden') {
				r = ri;
				c = ci;
			}
		}),
	);
	assert.ok(r >= 0, 'no hidden cell');
	const known = (cells: { text?: string }[]) => cells.filter(x => x.text).map(x => Number(x.text));
	const missingInRow = digits.filter(d => !known(rows[r]).includes(d));
	const missingInCol = digits.filter(d => !known(rows.map(row => row[c])).includes(d));
	assert.deepEqual(missingInRow, [Number(byId(40).answer)]);
	assert.deepEqual(missingInCol, [Number(byId(40).answer)]);
	// the given digits never repeat inside a row or a column
	for (const line of [...rows, ...rows[0].map((_, ci) => rows.map(row => row[ci]))]) {
		const nums = known(line);
		assert.equal(new Set(nums).size, nums.length);
	}
});

test('room 41: letters step by +2, +3, +4, so the next step +5 gives the answer', () => {
	const { rows } = gridOf(byId(41));
	const letters = rows[0].filter(c => c.mark !== 'hidden').map(c => c.text!.charCodeAt(0));
	const steps = letters.slice(1).map((code, i) => code - letters[i]);
	assert.deepEqual(steps, [2, 3, 4]);
	assert.equal(String.fromCharCode(letters[letters.length - 1] + 5), byId(41).answer);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-rooms-grid.test.ts`
Expected: FAIL (`Cannot find module '@/lib/visual-rooms/extra-grid-rooms'`).

- [ ] **Step 3: 데이터 작성**

`src/lib/visual-rooms/extra-grid-rooms.ts`:

```ts
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
				[{ text: '밤' }, { text: '달' }, { text: '해' }, { text: '별' }],
				[{ text: '꽃' }, { text: '불' }, { text: '창' }, { text: '새' }],
				[{ text: '문' }, { text: '책' }, { text: '샘' }, { text: '꿈' }],
				[{ text: '탑', mark: 'highlight' }, { text: '열' }, { text: '쇠' }, { text: '길' }],
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
			caption: '같은 숫자를 n번 누르면 그 칸의 n번째 글자가 됩니다. 암호: 55 · 33 · 999',
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
				[{ text: '3' }, { mark: 'hidden' }, { text: '1' }, { text: '2' }],
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
				[{ text: 'A' }, { text: 'C' }, { text: 'F' }, { text: 'J' }, { mark: 'hidden' }],
			],
		},
	},
];
```

- [ ] **Step 4: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-rooms-grid.test.ts`
Expected: PASS (8 tests).
Run: `pnpm exec prettier --write src/lib/visual-rooms/extra-grid-rooms.ts src/__tests__/extra-rooms-grid.test.ts src/__tests__/helpers/find-room.ts`
Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: 오류 없음, 전체 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/visual-rooms/extra-grid-rooms.ts src/__tests__/extra-rooms-grid.test.ts src/__tests__/helpers/find-room.ts
git commit -m "[feat] 신규 격자형 퍼즐 6개 추가 (방 31·34·35·39·40·41)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 신규 기호·쪽지 문항 11개 (방 32·36·38·42~49)

**Files:**
- Modify: `src/__tests__/helpers/hangul.ts` (`composeSyllable` 추가)
- Create: `src/lib/visual-rooms/extra-symbol-rooms.ts`
- Create: `src/lib/visual-rooms/extra-note-rooms.ts`
- Test: `src/__tests__/extra-rooms-text.test.ts`

**Interfaces:**
- Consumes: `symRow`(`@/lib/puzzle-builders`), `validateRoom`, `publicFileExists`, `initialOf`(hangul 헬퍼), `roomById`, `noteLinesOf`.
- Produces: `extraSymbolRooms: Room[]`(id 32), `extraNoteRooms: Room[]`(id 36, 38, 42, 43, 44, 45, 46, 47, 48, 49 순). 헬퍼 `composeSyllable(initial, medial, final?)`.

- [ ] **Step 1: 헬퍼 확장과 실패하는 테스트 작성**

`src/__tests__/helpers/hangul.ts` 끝에 추가한다(`INITIALS`, `FINALS` 상수는 같은 파일에 이미 있다):

```ts
const MEDIALS = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];

export const composeSyllable = (initial: string, medial: string, final = ''): string => {
	const i = INITIALS.indexOf(initial);
	const m = MEDIALS.indexOf(medial);
	const f = FINALS.indexOf(final);
	if (i < 0 || m < 0 || f < 0) throw new Error(`cannot compose ${initial}${medial}${final}`);
	return String.fromCharCode(0xac00 + (i * 21 + m) * 28 + f);
};
```

`src/__tests__/extra-rooms-text.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { extraSymbolRooms } from '@/lib/visual-rooms/extra-symbol-rooms';
import { extraNoteRooms } from '@/lib/visual-rooms/extra-note-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { composeSyllable, initialOf } from './helpers/hangul';
import { noteLinesOf, roomById } from './helpers/find-room';

const note = (id: number) => roomById(extraNoteRooms, id);

test('extra symbol/note rooms: ids and validateRoom', () => {
	assert.deepEqual(
		extraSymbolRooms.map(r => r.id),
		[32],
	);
	assert.deepEqual(
		extraNoteRooms.map(r => r.id),
		[36, 38, 42, 43, 44, 45, 46, 47, 48, 49],
	);
	for (const room of [...extraSymbolRooms, ...extraNoteRooms]) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), []);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
		assert.ok(Array.isArray(room.hint) && room.hint.length >= 1);
	}
});

test('room 32: lit candles read as binary (rightmost = 1) and the last row gives the answer', () => {
	const room = roomById(extraSymbolRooms, 32);
	assert.equal(room.visual?.kind, 'symbol-rows');
	if (room.visual?.kind !== 'symbol-rows') return;
	const read = (glyphs: (string | undefined)[]) =>
		glyphs.reduce((total, glyph) => total * 2 + (glyph === '🔥' ? 1 : 0), 0);
	for (const row of room.visual.rows) {
		const value = read(row.items.map(i => i.glyph));
		if (row.value !== undefined) assert.equal(value, Number(row.value));
		else assert.equal(String(value), room.answer);
	}
	assert.equal(room.visual.rows.filter(r => r.value === undefined).length, 1);
});

test('room 36: the braille legend decodes the last line to the answer', () => {
	const lines = noteLinesOf(note(36));
	const legend = new Map<string, string>();
	for (const line of lines.slice(0, 2)) {
		for (const match of line.matchAll(/([⠀-⣿])\s([A-Z])/g)) legend.set(match[1], match[2]);
	}
	assert.equal(legend.size, 10);
	const decoded = [...lines[2].replace(/\s/g, '')].map(ch => legend.get(ch)).join('');
	assert.equal(decoded, note(36).answer);
});

test('room 38: the weight statements give a total order whose third heaviest is the answer', () => {
	const room = note(38);
	const names = ['상자', '항아리', '시계', '책', '촛대'];
	// statements in the note, as [heavier, lighter]
	const heavier: [string, string][] = [
		['상자', '항아리'],
		['항아리', '시계'],
		['책', '항아리'],
		['상자', '책'],
		['시계', '촛대'],
	];
	const beats = new Map(names.map(n => [n, new Set<string>()]));
	for (const [a, b] of heavier) beats.get(a)!.add(b);
	for (let k = 0; k < names.length; k++)
		for (const a of names) for (const b of names)
			if (beats.get(a)!.has(names[k]) && beats.get(names[k])!.has(b)) beats.get(a)!.add(b);
	const order = [...names].sort((a, b) => beats.get(b)!.size - beats.get(a)!.size);
	order.forEach((name, i) => assert.equal(beats.get(name)!.size, names.length - 1 - i)); // total order
	const lines = noteLinesOf(room).join(' ');
	for (const name of names) assert.ok(lines.includes(name), name);
	const third = order[2];
	assert.equal(room.options?.find(o => o.label === third)?.value, room.answer);
	assert.deepEqual(room.options?.map(o => o.label), names);
});

test('room 42: the four clues fix the lock digits', () => {
	const room = note(42);
	assert.equal(room.inputType, 'combo-lock');
	assert.equal(room.comboLength, 4);
	assert.equal(noteLinesOf(room).length, 4);
	const d1 = 2; // smallest prime
	const d2 = d1 * 3 - 1;
	const d3 = d1 + d2;
	const d4 = 20 - (d1 + d2 + d3);
	assert.ok([d1, d2, d3, d4].every(d => d >= 0 && d <= 9));
	assert.equal(`${d1}${d2}${d3}${d4}`, room.answer);
});

test('room 43: the note read backwards says where the key is; the answer accepts the short and long forms', () => {
	const room = note(43);
	const reversed = [...noteLinesOf(room)[0]].reverse().join('');
	assert.equal(reversed, '열쇠는 시계 뒤에 있다');
	const accepted = (Array.isArray(room.answer) ? room.answer : [room.answer]).map(a => a.replace(/\s+/g, ''));
	assert.ok(accepted.includes('시계'));
	assert.ok(accepted.includes('시계뒤'));
});

test('room 44: the initials fit the words and their first syllables form the answer', () => {
	const room = note(44);
	const clues = noteLinesOf(room).slice(0, 2).map(line => line.split('—')[1].trim());
	assert.deepEqual(clues, ['ㅊㅁ', 'ㄱㅇㅇ']);
	const words: Record<string, string> = { ㅊㅁ: '창문', ㄱㅇㅇ: '고양이' };
	for (const clue of clues) {
		assert.equal([...words[clue]].map(initialOf).join(''), clue);
	}
	assert.equal(clues.map(c => words[c][0]).join(''), room.answer);
});

test('room 45: with the 3rd a Sunday, the third Wednesday is the answer', () => {
	const sundayOn = 3;
	const wednesdays = Array.from({ length: 5 }, (_, i) => sundayOn + 3 + i * 7).filter(d => d <= 31);
	assert.equal(String(wednesdays[2]), note(45).answer);
});

test('room 46: hidden faces are 7 minus each visible face and sum to the answer', () => {
	const visible = [4, 2, 3];
	assert.equal(String(visible.reduce((sum, face) => sum + (7 - face), 0)), note(46).answer);
	assert.equal(String(21 - visible.reduce((a, b) => a + b, 0)), note(46).answer);
});

test('room 47: each jamo line composes one syllable and together they spell the answer', () => {
	const lines = noteLinesOf(note(47));
	const word = lines
		.map(line => {
			const [initial, medial, final] = line.split(/\s+/);
			return composeSyllable(initial, medial, final);
		})
		.join('');
	assert.equal(word, note(47).answer);
});

test('room 48: every line reads the previous one aloud (look-and-say) and the answer is the next term', () => {
	const next = (term: string) =>
		term.replace(/(\d)\1*/g, run => `${run.length}${run[0]}`);
	const lines = noteLinesOf(note(48));
	assert.equal(lines[lines.length - 1], '?');
	const terms = lines.slice(0, -1);
	terms.slice(1).forEach((term, i) => assert.equal(term, next(terms[i])));
	assert.equal(next(terms[terms.length - 1]), note(48).answer);
});

test('room 49: exactly one lineup satisfies the clues and the third person is the answer', () => {
	const room = note(49);
	const people = ['가온', '나래', '다솜', '라온', '마루'];
	const permutations = (items: string[]): string[][] =>
		items.length <= 1
			? [items]
			: items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(rest => [item, ...rest]));
	const valid = permutations(people).filter(line => {
		const at = (name: string) => line.indexOf(name);
		return (
			at('가온') + 1 === at('나래') && // 가온 right before 나래
			at('다솜') === 4 && // 다솜 last
			at('라온') < at('가온') && // 라온 ahead of 가온
			at('마루') === at('나래') + 1 // 마루 right after 나래
		);
	});
	assert.equal(valid.length, 1);
	const third = valid[0][2];
	assert.deepEqual(room.options?.map(o => o.label), people);
	assert.equal(room.options?.find(o => o.label === third)?.value, room.answer);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-rooms-text.test.ts`
Expected: FAIL (`Cannot find module '@/lib/visual-rooms/extra-symbol-rooms'`).

- [ ] **Step 3: 방 32 데이터 작성**

`src/lib/visual-rooms/extra-symbol-rooms.ts`:

```ts
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
```

- [ ] **Step 4: 쪽지 문항 10개 데이터 작성**

`src/lib/visual-rooms/extra-note-rooms.ts`:

```ts
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
			lines: ['⠁ A · ⠃ B · ⠉ C · ⠙ D · ⠑ E', '⠋ F · ⠛ G · ⠓ H · ⠊ I · ⠚ J', '⠓ ⠊ ⠙ ⠑'],
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
		hint: ['끝 글자부터 거꾸로 읽어 보세요.', '띄어쓰기 단위도 거꾸로 놓여 있습니다.'],
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
			lines: ['마주 보는 두 면의 합 = 7', '보이는 면: 위 4 · 앞 2 · 오른쪽 3'],
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
```

- [ ] **Step 5: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-rooms-text.test.ts`
Expected: PASS (12 tests).
Run: `pnpm exec prettier --write src/lib/visual-rooms/extra-symbol-rooms.ts src/lib/visual-rooms/extra-note-rooms.ts src/__tests__/extra-rooms-text.test.ts src/__tests__/helpers/hangul.ts`
Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: 오류 없음, 전체 PASS.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/visual-rooms/extra-symbol-rooms.ts src/lib/visual-rooms/extra-note-rooms.ts src/__tests__/extra-rooms-text.test.ts src/__tests__/helpers/hangul.ts
git commit -m "[feat] 신규 기호·쪽지형 퍼즐 11개 추가 (방 32·36·38·42~49)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 신규 도형·이미지 문항 3개 (방 33·37·50)

**Files:**
- Create: `src/lib/visual-rooms/extra-misc-rooms.ts`
- Test: `src/__tests__/extra-rooms-misc.test.ts`

**Interfaces:**
- Consumes: `shapeCell`(`@/lib/puzzle-builders`), Task 2의 SVG, `validateRoom`.
- Produces: `extraMiscRooms: Room[]`(id 33, 37, 50 순).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/extra-rooms-misc.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { extraMiscRooms } from '@/lib/visual-rooms/extra-misc-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { roomById } from './helpers/find-room';
import { ShapeCell, ShapeName } from '@/types/room';
import fs from 'node:fs';
import path from 'node:path';

const byId = (id: number) => roomById(extraMiscRooms, id);

test('extra misc rooms: ids 33, 37, 50 pass validateRoom (files exist)', () => {
	assert.deepEqual(
		extraMiscRooms.map(r => r.id),
		[33, 37, 50],
	);
	for (const room of extraMiscRooms) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), []);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 33: the answer matches the number of marked differences in the drawing', () => {
	const room = byId(33);
	assert.equal(room.visual?.kind, 'image');
	if (room.visual?.kind !== 'image') return;
	const svg = fs.readFileSync(path.join(process.cwd(), 'public', room.visual.src), 'utf8');
	const marks = new Set([...svg.matchAll(/data-diff="(\d)"/g)].map(m => m[1]));
	assert.equal(String(marks.size), room.answer);
});

test('room 37: each row uses every shape once with row-number many shapes; the answer option completes it', () => {
	const room = byId(37);
	assert.equal(room.visual?.kind, 'shape-matrix');
	if (room.visual?.kind !== 'shape-matrix') return;
	const cells = room.visual.cells;
	assert.equal(cells.length, 8);
	const shapeOf = (cell: ShapeCell) => cell.marks[0].shape;
	const rows = [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6, 8)];
	rows.forEach((row, index) => {
		for (const cell of row) {
			assert.equal(cell.marks.length, index + 1, 'count equals row number');
			assert.ok(cell.marks.every(m => m.filled));
		}
	});
	const all: ShapeName[] = ['circle', 'square', 'triangle'];
	assert.deepEqual([...new Set(rows[0].map(shapeOf))].sort(), [...all].sort());
	assert.deepEqual([...new Set(rows[1].map(shapeOf))].sort(), [...all].sort());
	const missingShape = all.find(s => !rows[2].map(shapeOf).includes(s))!;
	const expected = JSON.stringify({
		marks: [3, 4, 5].map(slot => ({ shape: missingShape, filled: true, slot })),
	});
	const matching = room.options!.filter(o => JSON.stringify(o.cell) === expected);
	assert.equal(matching.length, 1, 'exactly one option completes the pattern');
	assert.equal(matching[0].value, room.answer);
	assert.deepEqual(
		room.options!.map(o => o.value),
		['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
	);
});

test('room 50: a 3x3 grid contains 14 squares (9 + 4 + 1)', () => {
	const cells = 3;
	let squares = 0;
	for (let size = 1; size <= cells; size++) squares += (cells - size + 1) ** 2;
	assert.equal(String(squares), byId(50).answer);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-rooms-misc.test.ts`
Expected: FAIL (`Cannot find module '@/lib/visual-rooms/extra-misc-rooms'`).

- [ ] **Step 3: 데이터 작성**

`src/lib/visual-rooms/extra-misc-rooms.ts`:

```ts
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
```

- [ ] **Step 4: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/extra-rooms-misc.test.ts`
Expected: PASS (4 tests).
Run: `pnpm exec prettier --write src/lib/visual-rooms/extra-misc-rooms.ts src/__tests__/extra-rooms-misc.test.ts`
Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: 오류 없음, 전체 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/visual-rooms/extra-misc-rooms.ts src/__tests__/extra-rooms-misc.test.ts
git commit -m "[feat] 신규 도형·이미지형 퍼즐 3개 추가 (방 33·37·50)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 선택·서버 전환 (`getGameRooms`, `isCorrectAnswer`, 서버 액션, 페이지, `RoomClient`)

**Files:**
- Create: `src/lib/answer-check.ts`
- Modify: `src/lib/room-selector.ts`
- Modify: `src/app/actions/game.ts`
- Modify: `src/app/escape/[roomId]/page.tsx`
- Modify: `src/app/escape/[roomId]/RoomClient.tsx`
- Modify: `src/types/session.ts`
- Modify: `src/__tests__/rooms-data.manifest.test.ts`
- Test: `src/__tests__/answer-check.test.ts`, `src/__tests__/room-selector.test.ts`

**Interfaces:**
- Consumes: `parseRoomIds`, `DEFAULT_ROOM_IDS`, `GAME_ROOMS_COOKIE_KEY`(Task 1), `rooms`.
- Produces:
  - `isCorrectAnswer(room: Room, answer: string, variantId?: string): boolean` (`@/lib/answer-check`)
  - `resolveRoomIds(raw?: string | null): number[]`, `getGameRooms(raw?: string | null): Room[]`, `GAME_ROOMS_COOKIE_KEY`(재export) (`@/lib/room-selector`)
  - `verifyAnswer(roomId: number, answer: string, variantId?: string): Promise<boolean>` — 레벨 인자 없음.
  - `RoomClient` props: `level` 제거, `roomIds: number[]` 추가. `StoredSession.roomIds?: number[]`(`level` 필드는 Task 7에서 제거).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/answer-check.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { isCorrectAnswer } from '@/lib/answer-check';
import { Room } from '@/types/room';

const base: Room = {
	id: 1,
	title: 't',
	type: '암호',
	question: 'q',
	answer: 'Open Sesame',
	hint: 'h',
	difficulty: 1,
};

test('isCorrectAnswer ignores case and all whitespace', () => {
	assert.equal(isCorrectAnswer(base, ' open  sesame '), true);
	assert.equal(isCorrectAnswer(base, 'OPENSESAME'), true);
	assert.equal(isCorrectAnswer(base, 'open'), false);
	assert.equal(isCorrectAnswer(base, ''), false);
});

test('isCorrectAnswer accepts any of several answers', () => {
	const room: Room = { ...base, answer: ['시계', '시계 뒤'] };
	assert.equal(isCorrectAnswer(room, '시계뒤'), true);
	assert.equal(isCorrectAnswer(room, '시계'), true);
	assert.equal(isCorrectAnswer(room, '촛대'), false);
});

test('isCorrectAnswer checks the selected variant, falling back to the room', () => {
	const room: Room = {
		...base,
		variants: [
			{
				variantId: '1-a',
				title: 'v',
				type: '암호',
				question: 'vq',
				answer: 'variant',
				hint: 'vh',
				difficulty: 1,
			},
		],
	};
	assert.equal(isCorrectAnswer(room, 'variant', '1-a'), true);
	assert.equal(isCorrectAnswer(room, 'open sesame', '1-a'), false);
	assert.equal(isCorrectAnswer(room, 'open sesame', 'unknown'), true);
	assert.equal(isCorrectAnswer(room, 'open sesame'), true);
});
```

`src/__tests__/room-selector.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { getGameRooms, resolveRoomIds } from '@/lib/room-selector';
import { DEFAULT_ROOM_IDS, pickRoomIds, serializeRoomIds } from '@/lib/room-pool';
import { isCorrectAnswer } from '@/lib/answer-check';

test('getGameRooms returns the cookie rooms in cookie order', () => {
	const ids = pickRoomIds();
	const rooms = getGameRooms(serializeRoomIds(ids));
	assert.equal(rooms.length, 30);
	assert.deepEqual(
		rooms.map(r => r.id),
		ids,
	);
});

test('getGameRooms falls back to rooms 1..30 for a missing or tampered cookie', () => {
	for (const raw of [undefined, null, '', '1.2.3', 'abc', '1.1.1', '99.98']) {
		assert.deepEqual(
			getGameRooms(raw).map(r => r.id),
			DEFAULT_ROOM_IDS,
			String(raw),
		);
		assert.deepEqual(resolveRoomIds(raw), DEFAULT_ROOM_IDS);
	}
});

test('the page room and the verified room are the same position in the same draw', () => {
	const ids = pickRoomIds();
	const raw = serializeRoomIds(ids);
	for (const position of [1, 15, 30]) {
		const room = getGameRooms(raw)[position - 1];
		assert.equal(room.id, ids[position - 1]);
		const answer = Array.isArray(room.answer) ? room.answer[0] : room.answer;
		assert.equal(isCorrectAnswer(room, answer), true);
	}
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/answer-check.test.ts src/__tests__/room-selector.test.ts`
Expected: FAIL (`Cannot find module '@/lib/answer-check'`; `getGameRooms` 없음).

- [ ] **Step 3: 구현 — `answer-check.ts`와 `room-selector.ts`**

`src/lib/answer-check.ts`:

```ts
import { Room } from '@/types/room';

// Lower case and drop every whitespace character before comparing.
const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '');

export function isCorrectAnswer(
	room: Room,
	answer: string,
	variantId?: string,
): boolean {
	const source =
		variantId && room.variants
			? (room.variants.find(variant => variant.variantId === variantId) ?? room)
			: room;
	const input = normalize(answer);
	const accepted = Array.isArray(source.answer) ? source.answer : [source.answer];
	return accepted.some(candidate => normalize(candidate) === input);
}
```

`src/lib/room-selector.ts` 전체:

```ts
import { rooms } from '@/lib/rooms-data';
import {
	DEFAULT_ROOM_IDS,
	GAME_ROOMS_COOKIE_KEY,
	parseRoomIds,
} from '@/lib/room-pool';
import { Room } from '@/types/room';

export { GAME_ROOMS_COOKIE_KEY };

// The draw stored in the game_rooms cookie, or rooms 1..30 when it is missing/invalid.
export const resolveRoomIds = (raw?: string | null): number[] =>
	parseRoomIds(raw) ?? DEFAULT_ROOM_IDS;

// The player's 30 rooms in play order. Both the room page and verifyAnswer use this,
// so what is shown and what is checked always agree.
export const getGameRooms = (raw?: string | null): Room[] => {
	const byId = new Map(rooms.map(room => [room.id, room]));
	return resolveRoomIds(raw)
		.map(id => byId.get(id))
		.filter((room): room is Room => room !== undefined);
};
```

- [ ] **Step 4: 구현 — 서버 액션, 페이지, `RoomClient`, 세션 타입**

`src/app/actions/game.ts` 전체(기존 2칸 들여쓰기 유지):

```ts
'use server';

import { cookies } from 'next/headers';
import { isCorrectAnswer } from '@/lib/answer-check';
import { GAME_ROOMS_COOKIE_KEY, getGameRooms } from '@/lib/room-selector';

export async function verifyAnswer(
  roomId: number,
  answer: string,
  variantId?: string,
): Promise<boolean> {
  const cookieStore = await cookies();
  const selectedRooms = getGameRooms(cookieStore.get(GAME_ROOMS_COOKIE_KEY)?.value);
  const room = selectedRooms[roomId - 1];
  if (!room) return false;
  return isCorrectAnswer(room, answer, variantId);
}
```

`src/app/escape/[roomId]/page.tsx` — import 블록과 앞부분을 바꾼다(2칸 들여쓰기 유지). 기존

```tsx
import {
  LEVEL_COOKIE_KEY,
  getRoomsForLevel,
} from '@/lib/room-selector';
import { normalizeLevel } from '@/lib/level';
```

를 다음으로 바꾼다:

```tsx
import {
  GAME_ROOMS_COOKIE_KEY,
  getGameRooms,
  resolveRoomIds,
} from '@/lib/room-selector';
```

기존

```tsx
  const level = normalizeLevel(cookieStore.get(LEVEL_COOKIE_KEY)?.value);
  const selectedRooms = getRoomsForLevel(level);
```

를 다음으로 바꾼다:

```tsx
  const rawRoomIds = cookieStore.get(GAME_ROOMS_COOKIE_KEY)?.value;
  const selectedRooms = getGameRooms(rawRoomIds);
```

기존 `level={level}`(RoomClient 호출)을 `roomIds={resolveRoomIds(rawRoomIds)}`로 바꾼다.

`src/app/escape/[roomId]/RoomClient.tsx`:
- `import { ChoiceOption, ClientRoom, Level } from '@/types/room';` → `import { ChoiceOption, ClientRoom } from '@/types/room';`
- `interface RoomClientProps`의 `level: Level;` → `roomIds: number[];`
- 컴포넌트 매개변수 구조분해의 `level,` → `roomIds,`
- `StoredSession` 페이로드 세 곳(방 입장 저장, 완주 저장, 힌트 사용 저장)의 `level,` 줄을 모두 `roomIds,`로 바꾼다.
- `const isValid = await verifyAnswer(roomId, answer, level, room.variantId);` → `const isValid = await verifyAnswer(roomId, answer, room.variantId);`

`src/types/session.ts`: `level?: 1 | 2 | 3 | 4;` 줄 **바로 아래**에 `roomIds?: number[];`를 추가한다(`level`은 Task 7에서 지운다).

`src/__tests__/rooms-data.manifest.test.ts`: 파일 상단 `import { getRoomsForLevel } from '@/lib/room-selector';`를 `import { getGameRooms } from '@/lib/room-selector';`로 바꾸고, 테스트 `rooms: each level still gets exactly 30 rooms in id order`(블록 전체)를 다음으로 교체한다:

```ts
test('getGameRooms: the default draw is rooms 1..30 in id order', () => {
	const defaultRooms = getGameRooms(undefined);
	assert.equal(defaultRooms.length, 30);
	assert.deepEqual(
		defaultRooms.map(r => r.id),
		Array.from({ length: 30 }, (_, i) => i + 1),
	);
});
```

- [ ] **Step 5: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/answer-check.test.ts src/__tests__/room-selector.test.ts`
Expected: PASS (6 tests).
Run: `pnpm exec prettier --write src/lib/answer-check.ts src/lib/room-selector.ts src/__tests__/answer-check.test.ts src/__tests__/room-selector.test.ts`
Run: `pnpm exec tsc --noEmit`
Expected: 오류 없음. (`start/page.tsx`가 아직 `getLevelFromAge`를 쓰지만 `level.ts`는 남아 있어 통과한다. `Level` 타입도 Task 7까지 남아 있다.)
Run: `pnpm lint && pnpm test`
Expected: 린트 클린, 전체 PASS.

- [ ] **Step 6: 커밋**

```bash
git add src/lib/answer-check.ts src/lib/room-selector.ts src/app/actions/game.ts "src/app/escape/[roomId]/page.tsx" "src/app/escape/[roomId]/RoomClient.tsx" src/types/session.ts src/__tests__/answer-check.test.ts src/__tests__/room-selector.test.ts src/__tests__/rooms-data.manifest.test.ts
git commit -m "[refactor] 방 선택을 레벨에서 game_rooms 쿠키 기반으로 전환

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 시작·기록실 전환과 레벨 제거

**Files:**
- Modify: `src/app/start/page.tsx`
- Modify: `src/app/finish/page.tsx`
- Modify: `src/types/room.ts`, `src/types/session.ts`
- Delete: `src/lib/level.ts`
- Test: `src/__tests__/no-level.test.ts`

**Interfaces:**
- Consumes: `pickRoomIds`, `validRoomIds`, `gameRoomsCookie`, `DEFAULT_ROOM_IDS`(Task 1), `StoredSession.roomIds`(Task 6).
- Produces: 레벨 개념이 코드에 남지 않는다.

- [ ] **Step 1: 실패하는 보호 테스트 작성**

`src/__tests__/no-level.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// "Level 1" in comments (a digit follows) is fine; the identifier `Level` and these names are not.
const FORBIDDEN =
	/getLevelFromAge|normalizeLevel|LEVEL_COOKIE_KEY|getRoomsForLevel|player_level|playerLevel|LEVEL_LABELS|\bLevel\b(?!\s+\d)|\blevel\?:|\.level\b/;

const collect = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return entry.name === '__tests__' ? [] : collect(full);
		return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
	});

test('the age-based level concept is gone from the source', () => {
	const offenders = collect(path.join(process.cwd(), 'src')).filter(file =>
		FORBIDDEN.test(fs.readFileSync(file, 'utf8')),
	);
	assert.deepEqual(offenders, []);
});

test('src/lib/level.ts no longer exists', () => {
	assert.equal(fs.existsSync(path.join(process.cwd(), 'src', 'lib', 'level.ts')), false);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/no-level.test.ts`
Expected: FAIL (`start/page.tsx`, `level.ts`, `types/room.ts` 등이 걸린다).

- [ ] **Step 3: 시작 화면 수정 (`src/app/start/page.tsx`, 탭 들여쓰기 유지)**

(a) 상단 import와 `LEVEL_LABELS` 블록을 다음으로 바꾼다. 기존

```tsx
import { getLevelFromAge } from '@/lib/level';
import { TOTAL_ROOMS } from '@/lib/constants';
import { Level } from '@/types/room';

const LEVEL_LABELS: Record<Level, { label: string; desc: string; detail: string }> = {
	1: { label: '제1관 [입문]', desc: '방 01 ~ 30', detail: '저택 초입의 가벼운 수수께끼들이 기다리고 있습니다.' },
	2: { label: '제2관 [심화]', desc: '방 31 ~ 60', detail: '서재 깊은 곳, 조금 더 얽힌 단서들을 풀어야 합니다.' },
	3: { label: '제3관 [고급]', desc: '방 61 ~ 90', detail: '지하실의 낡은 장치들이 정교한 추리를 요구합니다.' },
	4: { label: '제4관 [최상급]', desc: '방 91 ~ 120', detail: '가장 깊은 곳, 저택 최후의 진실이 기다립니다.' },
};
```

를 다음으로:

```tsx
import { TOTAL_ROOMS } from '@/lib/constants';
import {
	DEFAULT_ROOM_IDS,
	gameRoomsCookie,
	pickRoomIds,
	validRoomIds,
} from '@/lib/room-pool';
```

(b) `level` 계산을 지운다. 아래 블록을 삭제한다:

```tsx
	const level =
		Number.isFinite(parsedAge) && parsedAge >= 8 && parsedAge <= 100
			? getLevelFromAge(parsedAge)
			: null;
```

(c) `handleStart`에서:
- `const currentLevel = getLevelFromAge(parsedAge);` 줄을 삭제한다.
- `localStorage.setItem('playerLevel', currentLevel.toString());` 줄을 삭제한다.
- ``document.cookie = `player_level=${currentLevel}; path=/; max-age=2592000`;`` 줄을 삭제한다.
- 이어하기 분기: 기존

```tsx
				if (isSameUser) {
					alert('이전에 남기신 발자취를 찾았습니다. 마지막으로 계셨던 방으로 안내합니다.');
```

를 다음으로 바꾼다:

```tsx
				if (isSameUser) {
					// Resume with the rooms drawn for this run (older sessions have none: rooms 1..30).
					document.cookie = gameRoomsCookie(
						validRoomIds(existingSession.roomIds) ?? DEFAULT_ROOM_IDS,
					);
					alert('이전에 남기신 발자취를 찾았습니다. 마지막으로 계셨던 방으로 안내합니다.');
```

- 새 판 분기: 기존

```tsx
			useGameStore.getState().resetRun();

			const payload: StoredSession = {
```

를 다음으로 바꾼다:

```tsx
			useGameStore.getState().resetRun();

			// Draw this run's 30 rooms (random subset, random order) out of the pool.
			const roomIds = pickRoomIds();
			document.cookie = gameRoomsCookie(roomIds);

			const payload: StoredSession = {
```

- 페이로드의 `level: currentLevel,` 줄을 `roomIds,`로 바꾼다.

(d) `const levelInfo = level ? LEVEL_LABELS[level] : null;` 줄을 삭제한다.

(e) JSX의 나이 블록을 다음으로 교체한다. 기존

```tsx
						{/* Age & Level */}
						<div className="flex flex-col gap-2">
							<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
								나이
								{levelInfo && (
									<span className="text-[#c9a24b] font-bold animate-badge-pop">
										{levelInfo.label}
									</span>
								)}
							</div>
```

를 다음으로:

```tsx
						{/* Age */}
						<div className="flex flex-col gap-2">
							<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
								나이
							</div>
```

그리고 같은 블록 끝의 다음 조각을 삭제한다:

```tsx
							{levelInfo && (
								<div className="p-3 bg-[rgba(201,162,75,0.08)] border border-[rgba(201,162,75,0.2)] text-[11px] text-[#c9a24b]/80 leading-normal flex flex-col gap-1">
									<div><strong>[안내될 방]:</strong> {levelInfo.desc}</div>
									<div className="text-[#a38a4a]">{levelInfo.detail}</div>
								</div>
							)}
```

- [ ] **Step 4: 기록실·타입·레벨 파일 정리**

`src/app/finish/page.tsx`:
- `{ name: string; seconds: number; level?: number }[]` → `{ name: string; seconds: number }[]`
- `level: session.level,` 줄 삭제
- 다음 JSX 조각 삭제:

```tsx
											{user.level && (
												<span className="text-xs text-[#a38a4a]">
													({user.level}레벨)
												</span>
											)}
```

`src/types/room.ts`: 첫 줄 `export type Level = 1 | 2 | 3 | 4;`와 `GameState`의 `level?: Level;` 줄을 삭제한다.
`src/types/session.ts`: `level?: 1 | 2 | 3 | 4;` 줄을 삭제한다.
`src/lib/level.ts`: `git rm src/lib/level.ts`.
`src/__tests__/run-reset.test.ts`의 `playerLevel: '1',` 줄은 테스트 입력 데이터이므로 지우고(해당 키는 더 이상 쓰이지 않음), 같은 객체의 나머지 항목은 그대로 둔다.

- [ ] **Step 5: 통과 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/no-level.test.ts`
Expected: PASS (2 tests).
Run: `pnpm exec prettier --write src/__tests__/no-level.test.ts`
Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: 오류 없음, 린트 클린, 전체 PASS. `tsc`가 `Level` 미정의 오류를 내면 남은 사용처를 `grep -rn "Level" src`로 찾아 고친다.

- [ ] **Step 6: 커밋**

```bash
git add -A src
git commit -m "[feat] 시작 시 30문제 랜덤 출제·쿠키 저장 및 연령 레벨 개념 제거

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: 데이터 통합 — 31~120 삭제, 신규 20문제 병합, 풀 테스트

**Files:**
- Modify: `src/lib/visual-rooms/index.ts`
- Modify: `src/lib/rooms-data.ts`
- Modify: `src/__tests__/rooms-data.baseline.test.ts`, `src/__tests__/rooms-data.manifest.test.ts`

**Interfaces:**
- Consumes: Task 3~5의 `extraGridRooms`, `extraSymbolRooms`, `extraNoteRooms`, `extraMiscRooms`.
- Produces: `rooms`는 id 1~50의 연속 배열(방 1~30 기존 구성, 31~50 신규).

- [ ] **Step 1: 실패하는 테스트로 갱신**

`src/__tests__/rooms-data.baseline.test.ts`의 첫 테스트를 다음으로 바꾼다:

```ts
test('rooms: 50 rooms with ids 1..50 in order', () => {
	assert.equal(rooms.length, 50);
	assert.deepEqual(
		rooms.map(room => room.id),
		Array.from({ length: 50 }, (_, index) => index + 1),
	);
});
```

`src/__tests__/rooms-data.manifest.test.ts`:
- 첫 테스트를 `rooms: 50 rooms, ids 1..50 contiguous and in order`로 바꾸고 `120`→`50`, `length: 120`→`length: 50`으로 수정한다.
- `REPLACED` 배열 아래에 신규 문항 기대값을 추가한다:

```ts
const ADDED: Expectation[] = [
	{ id: 31, kind: 'grid', inputType: 'number' },
	{ id: 32, kind: 'symbol-rows', inputType: 'number' },
	{ id: 33, kind: 'image', inputType: 'number' },
	{ id: 34, kind: 'grid', inputType: 'text' },
	{ id: 35, kind: 'grid', inputType: 'text' },
	{ id: 36, kind: 'note', inputType: 'text' },
	{ id: 37, kind: 'shape-matrix', inputType: 'choice' },
	{ id: 38, kind: 'note', inputType: 'choice' },
	{ id: 39, kind: 'grid', inputType: 'text' },
	{ id: 40, kind: 'grid', inputType: 'number' },
	{ id: 41, kind: 'grid', inputType: 'text' },
	{ id: 42, kind: 'note', inputType: 'combo-lock' },
	{ id: 43, kind: 'note', inputType: 'text' },
	{ id: 44, kind: 'note', inputType: 'text' },
	{ id: 45, kind: 'note', inputType: 'number' },
	{ id: 46, kind: 'note', inputType: 'number' },
	{ id: 47, kind: 'note', inputType: 'text' },
	{ id: 48, kind: 'note', inputType: 'number' },
	{ id: 49, kind: 'note', inputType: 'choice' },
	{ id: 50, kind: 'image', inputType: 'number' },
];
```

- `REPLACED`를 도는 `for` 루프 바로 아래에 같은 형태의 루프를 `ADDED`에도 추가한다(제목 `added room ${id} uses ...`, 내용은 기존 루프와 동일).
- 마지막 테스트 `the remaining legacy rooms are untouched text rooms (no visual)`를 다음으로 바꾼다:

```ts
test('the remaining legacy rooms are untouched text rooms (no visual)', () => {
	const withVisual = new Set([...REPLACED.map(r => r.id), 24, ...ADDED.map(r => r.id)]);
	assert.equal(withVisual.size, 39);
	for (const room of rooms) {
		if (!withVisual.has(room.id)) assert.equal(room.visual, undefined, `room ${room.id}`);
	}
	assert.deepEqual(
		rooms.filter(r => !withVisual.has(r.id)).map(r => r.id),
		[12, 14, 17, 20, 21, 22, 23, 25, 26, 27, 29],
	);
});
```

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/rooms-data.baseline.test.ts src/__tests__/rooms-data.manifest.test.ts`
Expected: FAIL (아직 120개이고 31~50이 옛 문항).

- [ ] **Step 2: 신규 문항을 `visualRooms`에 병합**

`src/lib/visual-rooms/index.ts` 전체:

```ts
import 'server-only';
import { Room } from '@/types/room';
import { extraGridRooms } from './extra-grid-rooms';
import { extraMiscRooms } from './extra-misc-rooms';
import { extraNoteRooms } from './extra-note-rooms';
import { extraSymbolRooms } from './extra-symbol-rooms';
import { gridRooms } from './grid-rooms';
import { imageRooms } from './image-rooms';
import { noteRooms } from './note-rooms';
import { shapeRooms } from './shape-rooms';
import { statementRooms } from './statement-rooms';
import { symbolRooms } from './symbol-rooms';

// The first 19 sample rooms were authored (and are tested) under their original ids.
// This map assigns each one to the room it replaces: sample id -> final room id.
// Matching rooms by type keeps the type mix: 연산 1~6, 관찰 7~10, 암호 11/13/15,
// 추리 16/18/19, 타일배열 24, 도형 28/30.
export const FINAL_ROOM_ID: Record<number, number> = {
	2: 1,
	7: 2,
	12: 3,
	20: 4,
	26: 5,
	16: 6,
	27: 7,
	29: 8,
	23: 9,
	13: 10,
	14: 11,
	4: 13,
	28: 15,
	25: 16,
	17: 18,
	15: 19,
	11: 24,
	8: 28,
	22: 30,
};

const remapped: Room[] = [
	...symbolRooms,
	...gridRooms,
	...noteRooms,
	...statementRooms,
	...shapeRooms,
	...imageRooms,
].map(room => {
	const id = FINAL_ROOM_ID[room.id];
	if (id === undefined) throw new Error(`no final room id for sample ${room.id}`);
	return { ...room, id };
});

// Rooms 31~50 were authored directly under their final ids.
const added: Room[] = [
	...extraGridRooms,
	...extraSymbolRooms,
	...extraNoteRooms,
	...extraMiscRooms,
];

export const visualRooms: Room[] = [...remapped, ...added];
```

- [ ] **Step 3: `rooms-data.ts`에서 31~120 제거**

임시 스크립트를 scratchpad(`/private/tmp/claude-501/-Volumes-extend-projects-escape-room/6769de1a-6e79-41dd-bbaa-24b3abbadba9/scratchpad/remove-levels-2-4.mjs`)에 만들어 한 번만 실행하고 커밋하지 않는다:

```js
import fs from 'node:fs';

const file = '/Volumes/extend/projects/escape-room/src/lib/rooms-data.ts';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const level2 = lines.findIndex(line => line.includes('// Level 2 ('));
if (level2 < 1 || !lines[level2 - 1].includes('// ====')) throw new Error('Level 2 banner not found');
const start = level2 - 1;
const end = lines.lastIndexOf('];');
if (end <= start) throw new Error('array end not found');

const kept = [...lines.slice(0, start), ...lines.slice(end)];
fs.writeFileSync(file, kept.join('\n'));
console.log('removed lines:', end - start);
```

Run: `node /private/tmp/claude-501/-Volumes-extend-projects-escape-room/6769de1a-6e79-41dd-bbaa-24b3abbadba9/scratchpad/remove-levels-2-4.mjs`
Expected: `removed lines: <약 910>`.
Run: `grep -c $'^\t\tid: ' src/lib/rooms-data.ts` → Expected: `11`.
Run: `git diff --stat src/lib/rooms-data.ts | tail -1` → 삭제만 있고 추가 줄이 없어야 한다(`git diff src/lib/rooms-data.ts | grep -c '^+[^+]'`가 `0`).

머리 주석을 갱신한다. `src/lib/rooms-data.ts` 상단의 `// Type mix guideline` 줄부터 `// 19 of the Level 1 rooms were replaced by visual puzzles (see visual-rooms/).` 줄까지(8줄)를 다음으로 교체한다:

```ts
// The game draws 30 of these 50 rooms for each run (see src/lib/room-pool.ts).
// Rooms 1~30: the original Level 1 set; 19 of them were replaced by visual puzzles and
// rooms 31~50 are visual puzzles written for the pool (see visual-rooms/). The rooms
// still defined below are the 11 text rooms that remain from the 2026-08-26 rewrite.
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm exec prettier --write src/lib/visual-rooms/index.ts src/__tests__/rooms-data.baseline.test.ts src/__tests__/rooms-data.manifest.test.ts`
Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: 오류 없음, 전체 PASS (manifest의 `every room passes validateRoom` 포함 — 풀 50개 모두 검증).
Run: `pnpm lint`
Expected: 클린.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/visual-rooms/index.ts src/lib/rooms-data.ts src/__tests__/rooms-data.baseline.test.ts src/__tests__/rooms-data.manifest.test.ts
git commit -m "[feat] 방 풀을 50개로 확정: 신규 20문제 병합, 레벨 2~4용 31~120 제거

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 빌드·브라우저 QA·문서

**Files:**
- Modify: `CLAUDE.md`
- (결함이 있을 때만 해당 코드)

**Interfaces:**
- Consumes: 모든 이전 Task.
- Produces: 통과한 `pnpm lint`/`build`/`test`와 브라우저 확인 결과.

- [ ] **Step 1: 린트·빌드·테스트**

Run: `pnpm lint`
Expected: 오류 0.
Run: `pnpm build`
Expected: 빌드 성공.
Run: `pnpm test`
Expected: 전체 PASS.

- [ ] **Step 2: 문서 갱신 (`CLAUDE.md`)**

`CLAUDE.md`에서 "**Level → room selection.**"로 시작하는 문단 전체를 다음으로 교체한다:

```
**Room pool and per-run draw.** `src/lib/rooms-data.ts` holds a pool of 50 rooms (ids 1~50; `POOL_SIZE` in [src/lib/constants.ts](src/lib/constants.ts)). There are no age levels: every new run draws `TOTAL_ROOMS` (30) of the 50 in random order via `pickRoomIds()` ([src/lib/room-pool.ts](src/lib/room-pool.ts)) and stores the draw in the `game_rooms` cookie (`12.3.45…`, dot-separated room ids) and in the server session (`roomIds`) for resuming. `getGameRooms(cookie)` in [src/lib/room-selector.ts](src/lib/room-selector.ts) turns the cookie into the player's 30 rooms (a missing/invalid cookie falls back to rooms 1~30); both the room page and `verifyAnswer()` use it. Routes like `/escape/[roomId]` index into that array with `roomId - 1`, so `roomId` is a *position* (1~30), not a pool id.
```

"**Server/client answer split.**" 문단의 "`reads the level cookie, resolves the room`"을 "`reads the game_rooms cookie, resolves the room`"으로, "`which re-resolves the same room/variant by id`"를 "`which re-resolves the same room/variant from the same cookie`"로 고친다. "**Visual puzzles.**" 문단의 "`merged into rooms by id in rooms-data.ts (FINAL_ROOM_ID in visual-rooms/index.ts maps each sample to the room slot it replaces)`" 뒤에 "`; rooms 31~50 are authored directly under their final ids (extra-*.ts)`"를 덧붙인다.

- [ ] **Step 3: dev 서버 시작과 새 판 시작 확인**

`mcp__Claude_Browser__preview_start`에 `{name: "dev"}`로 시작한다(서버는 Bash로 띄우지 않는다). 이전 작업의 열린 탭이 있으면 `tabs_close`로 정리한다. 시작 화면을 연다:

`mcp__Claude_Browser__navigate`로 `http://localhost:3000/start`.

`read_page`(filter `interactive`)로 입력 ref를 찾아 이름 `풀테스트`, 남성, 나이 `15`로 시작 버튼을 누른다. 이동 후 `javascript_tool`로 확인한다:

```js
const cookie = document.cookie.split('; ').find(c => c.startsWith('game_rooms=')) ?? '';
const ids = cookie.replace('game_rooms=', '').split('.').map(Number);
({
  path: location.pathname,
  count: ids.length,
  unique: new Set(ids).size,
  inRange: ids.every(id => id >= 1 && id <= 50),
  hasLevelCookie: document.cookie.includes('player_level'),
  playerLevelStored: localStorage.getItem('playerLevel'),
  ids,
})
```

Expected: `path: /escape/1`, `count: 30`, `unique: 30`, `inRange: true`, `hasLevelCookie: false`, `playerLevelStored: null`.

시작 화면에서 나이를 입력할 때 **레벨 배지와 "안내될 방" 문구가 나타나지 않는지** `screenshot`으로 확인한다.

같은 방법으로 이름 `풀테스트2`, 나이 `45`로 다시 시작해 `ids`가 이전과 **다른 구성/순서**인지 확인한다(두 `ids` 배열이 같으면 안 된다).

- [ ] **Step 4: 신규 20문제 전체 풀이 (자동 구동)**

쿠키를 "방 31~50이 앞 20위치에 오는" 구성으로 직접 설정해 한 번에 풀어 본다. `javascript_tool`로 실행한다:

```js
const ids = [...Array.from({ length: 20 }, (_, i) => 31 + i), ...Array.from({ length: 10 }, (_, i) => 1 + i)];
document.cookie = `game_rooms=${ids.join('.')}; path=/; max-age=2592000`;
localStorage.setItem('currentRoom', '1');
location.href = '/escape/1';
'ok'
```

잠시(5초) 기다린 뒤 아래 구동 스크립트를 한 번에 실행한다. 정답 제출 후 클라이언트 라우팅으로 다음 방으로 넘어가므로 같은 스크립트가 계속 돈다.

```js
const sleep = ms => new Promise(r => setTimeout(r, ms));
const answers = {
  31: ['text', '17'], 32: ['text', '11'], 33: ['text', '5'], 34: ['text', '별'], 35: ['text', 'KEY'],
  36: ['text', 'HIDE'], 37: ['choice', 'F'], 38: ['choice', '항아리'], 39: ['text', '나침반'], 40: ['text', '4'],
  41: ['text', 'O'], 42: ['combo', '2576'], 43: ['text', '시계'], 44: ['text', '창고'], 45: ['text', '20'],
  46: ['text', '12'], 47: ['text', '촛불'], 48: ['text', '312211'], 49: ['choice', '나래'], 50: ['text', '14'],
};
const setNative = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
const button = t => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === t);
const submit = () => [...document.querySelectorAll('button')].find(b => b.textContent.includes('문 열기')).click();
const waitFor = async (check, ms = 10000) => { const end = Date.now() + ms; while (Date.now() < end) { if (check()) return true; await sleep(200); } return false; };
const ready = () => document.querySelector('input') || document.querySelector('[aria-pressed]');
const report = [];
await waitFor(ready);
for (let position = 1; position <= 20; position++) {
  const roomId = 30 + position;
  const title = document.querySelector('h1,h2')?.textContent ?? '';
  const [kind, value] = answers[roomId];
  const before = location.pathname;
  if (kind === 'text') { setNative(document.querySelector('input'), value); }
  else if (kind === 'choice') { button(value)?.click(); }
  else { const inputs = [...document.querySelectorAll('input')]; for (let i = 0; i < 4; i++) { setNative(inputs[i], value[i]); await sleep(60); } }
  await sleep(150); submit();
  await waitFor(() => location.pathname !== before && ready());
  report.push(`${roomId} ${title} ${before} -> ${location.pathname}`);
}
report.join('\n')
```

Expected: 각 줄이 `/escape/N -> /escape/N+1`로 한 칸씩 넘어가고 마지막이 `/escape/21`이다. 막히는 방이 있으면 그 방의 입력 방식(특히 42번 자물쇠, 37·38·49번 보기 선택)을 따로 점검한다. 오답이 반복되면 5번째에 오답 잠금이 걸리니, 실패한 방은 `localStorage.removeItem('wrongCount')`로 풀고 그 방부터 다시 시도한다.

- [ ] **Step 5: 화면 확인 (스크린샷)**

새 방 중 화면 표현이 위험한 것을 `javascript_tool`로 `localStorage.setItem('currentRoom','N'); location.href='/escape/N'`(위 쿠키 유지, N은 위치 번호이므로 방 id − 30)로 열어 `screenshot`으로 확인한다:
- 방 36(위치 6): 점자 문자가 점 모양으로 보이고 글자와 대응표가 정렬돼 있다.
- 방 32(위치 2): 🔥와 ⚫가 줄마다 정렬돼 보인다.
- 방 33(위치 3): 두 그림이 나란히 보이고 5곳의 차이가 구별된다.
- 방 42(위치 12): 4칸 자물쇠 입력이 보인다.
- 방 37(위치 7): 패턴판과 보기 8개가 375px 폭에서도 들어온다(`resize_window`의 `mobile` 프리셋 후 `desktop`으로 복원).

- [ ] **Step 6: 오답 처리·정답 비노출·정리**

방 하나에서 오답 한 번 제출해 "열쇠가 맞지 않습니다."와 `오답 1/5` 표시가 나오는지 확인한다. 이어서 아무 방에서 다음을 실행한다:

```js
const html = await (await fetch(location.pathname, { credentials: 'include' })).text();
({ hasAnswerKey: /\\?"answer\\?"\s*:/.test(html), hasVariantsKey: /\\?"variants\\?"\s*:/.test(html) })
```

Expected: 둘 다 `false`.

QA 값을 정리하고 서버를 멈춘다:

```js
['playerName','playerKey','playerGender','playerAge','startTime','endTime','currentRoom','score','combo','bestCombo','hintsUsed','hintsRemaining','wrongCount','lockUntil'].forEach(k => localStorage.removeItem(k));
document.cookie = 'game_rooms=; path=/; max-age=0';
Object.keys(localStorage)
```

`mcp__Claude_Browser__preview_stop`으로 dev 서버를 멈춘다.

이어하기 경로(원격 세션에서 `roomIds` 복원)는 원격 API가 없는 이 환경에서 브라우저로 재현할 수 없다. 순수 함수(`validRoomIds`)는 테스트로 확인했고, 분기 코드는 Task 7의 변경을 코드 리뷰로만 확인했다고 최종 보고에 적는다.

- [ ] **Step 7: 결함 수정 (있을 때만)**

QA에서 결함을 찾으면 관련 단위 테스트를 먼저 추가해 실패를 확인한 뒤 최소 수정하고 `pnpm test`, `pnpm lint`, `pnpm build`를 다시 통과시킨다. `[fix]` 접두 커밋으로 남긴다.

- [ ] **Step 8: 문서 커밋**

```bash
git add CLAUDE.md
git commit -m "[docs] CLAUDE.md를 50문제 풀 랜덤 출제 구조로 갱신

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-Review

**1. 스펙 커버리지**
- 목표 1(레벨 제거): Task 6(서버·`RoomClient`·세션 `roomIds`), Task 7(시작 화면·기록실·타입·`level.ts` 삭제, `no-level` 보호 테스트).
- 목표 2(풀 50, 31~120 삭제): Task 8.
- 목표 3(30개 뽑기·쿠키·서버 해석): Task 1(`pickRoomIds`/`parseRoomIds`/`gameRoomsCookie`), Task 6(`getGameRooms`·`verifyAnswer`·`page.tsx`), Task 7(`start/page.tsx`가 뽑아서 저장).
- 목표 4(이어하기 복원): Task 7(이어하기 분기에서 `validRoomIds(existingSession.roomIds) ?? DEFAULT_ROOM_IDS`, `RoomClient` 세션 저장에 `roomIds`). 브라우저 재현은 불가하다고 Task 9에 명시.
- 목표 5(신규 20문제·SVG 2개): Task 2~5, 방 31~50 전부(31·34·35·39·40·41 / 32 / 36·38·42~49 / 33·37·50 = 20개). 각 정답은 스펙 표와 일치한다(17, 11, 5, 별, KEY, HIDE, F, 항아리, 나침반, 4, O, 2576, 시계, 창고, 20, 12, 촛불, 312211, 나래, 14).
- 오류 처리·경계: 대체 1~30(Task 1·6 테스트), 세션 `roomIds` 없음(Task 7), 쿠키 위변조(Task 1·6).
- 검증 항목(`pickRoomIds`·`parseRoomIds`·`getGameRooms`·정합성·신규 정답 논리·브라우저): Task 1·3~6·8·9.

**2. Placeholder 점검:** TBD/TODO/"적절히 처리" 없음. 모든 코드 스텝에 실제 코드. Task 7의 JSX/TSX 수정은 기존 코드를 그대로 인용해 바꿀 문자열을 지정했다.

**3. 타입·이름 일관성:** `pickRoomIds`, `serializeRoomIds`, `validRoomIds`, `parseRoomIds`, `gameRoomsCookie`, `DEFAULT_ROOM_IDS`, `GAME_ROOMS_COOKIE_KEY`(Task 1)가 Task 6·7에서 같은 시그니처로 쓰인다. `getGameRooms`/`resolveRoomIds`/`isCorrectAnswer`(Task 6)가 `page.tsx`·`game.ts`·테스트에서 일치한다. 데이터 모듈 export 이름(`extraGridRooms`, `extraSymbolRooms`, `extraNoteRooms`, `extraMiscRooms`)이 Task 3~5·8에서 일치한다. 테스트 헬퍼(`roomById`, `gridOf`, `noteLinesOf`, `composeSyllable`)는 정의된 Task(3, 4) 이후에서만 쓴다.

**4. Review Focus:** 각 줄의 테스트 위치를 헤더에 명시했다. 쿠키 위변조·불일치 방지는 단위 테스트로 고정했고, 풀 연속성은 Task 8 manifest가 지킨다. 브라우저 전용 항목(점자·이모지 렌더링)은 Task 9가 맡는다.
