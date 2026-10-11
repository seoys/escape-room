# 이미지(시각)형 퍼즐 프레임워크 + 샘플 19유형 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 문항이 `visual`(시각 요소)과 `options`(보기)를 가질 수 있게 하고, 6종 렌더러와 보기 선택 UI를 만들어 레벨 1의 19개 방을 이미지형 샘플 문항으로 교체한다.

**Architecture:** `Room`/`RoomVariant`에 선택 필드(`visual`, `options`, `tileImages`)를 추가하고, `PuzzleVisualView`가 `visual.kind`에 따라 6종 렌더러(`image`, `grid`, `note`, `symbol-rows`, `shape-matrix`, `statements`)로 분기한다. 입력은 기존 `number`/`text`/`tile-order`를 재사용하고 새 `ChoiceInput`을 추가한다. 서버 정답 검증(`verifyAnswer`)은 바꾸지 않으며, 클라이언트로 보낼 필드 정제 로직을 `toClientRoom`으로 분리해 테스트한다. 샘플 문항 데이터는 `src/lib/visual-rooms/`에 렌더러군별로 두고 `rooms-data.ts`가 레거시 항목을 제거한 뒤 합쳐서 id 순으로 정렬한다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind, Node 22. 테스트는 새 devDependency `tsx` + Node 내장 `node:test`(+ `react-dom/server`의 `renderToStaticMarkup`).

**Spec:** `docs/superpowers/specs/2026-10-11-image-puzzle-framework-design.md`

## Global Constraints

- Node `>=22.0.0`, 패키지 매니저는 `pnpm`.
- 코드 스타일은 `.prettierrc.js`를 따른다: 홑따옴표, 세미콜론, **탭 들여쓰기(tabWidth 4)**, trailing comma `all`, `arrowParens: "avoid"`. 새/수정 파일은 마지막에 `pnpm exec prettier --write <files>`로 정리한다.
- import는 `@/` 별칭을 쓴다. 파일명은 kebab-case, 컴포넌트·타입은 PascalCase. 기존 컴포넌트 파일명(`TileOrderInput.tsx`)처럼 컴포넌트 파일은 PascalCase를 유지한다.
- `"use client"`는 상태 훅이 필요한 컴포넌트에만 붙인다(`ChoiceInput`, `TileOrderInput`). 렌더러 6종과 `PuzzleVisualView`는 서버/클라이언트 양쪽에서 렌더링 가능한 순수 컴포넌트다.
- 정답(`answer`)은 서버(`rooms-data.ts`, `visual-rooms/*`)에만 있다. 모든 `visual-rooms/*` 모듈 첫 줄은 `import 'server-only';`이다. `visual`/`options`/`tileImages`에는 정답을 넣지 않는다.
- 선택 보기의 `value`는 중립 id(`A`~`H`, `1`~`4`)다. 정답 여부를 암시하지 않는다.
- 교체한 방은 `variants` 없이 단일 문항이다. 문제 지문(`question`)은 고딕 저택 서사의 짧은 지시문(`[저택의 기록]`로 시작하는 기존 톤)을 유지한다.
- 웹에서 가져온 이미지·문제는 쓰지 않는다. 숫자·단어·그림은 이 계획서에 적힌 오리지널 값만 쓴다.
- `verifyAnswer`(`src/app/actions/game.ts`)와 `room-selector.ts`의 방 선택 로직은 수정하지 않는다.
- 커밋 메시지는 `feat:` / `test:` / `chore:` / `refactor:` 접두 영어 소문자 요약을 쓰고, 본문 끝에 아래 attribution 줄을 붙인다(원 저장소 관행: 짧은 영어 요약).

```
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
```

## Review Focus

스펙은 침묵하지만 실제 사용자가 만날 가능성이 큰 상황이다. 각 줄의 테스트는 오른쪽 Task가 담당한다.

- 보기를 고르지 않고 제출하면 빈 답으로 검증되어 "열쇠가 맞지 않습니다"가 뜬다(크래시 없음): Task 7의 `ChoiceInput` 초기 선택 없음 테스트.
- 방을 넘어갈 때(`options` 또는 `tiles` 변경) 이전 방의 선택/타일 선택이 남지 않는다: Task 7의 리셋 effect(코드 리뷰 + 브라우저 QA).
- 알 수 없는 `visual.kind`가 오면 화면이 깨지지 않고 지문만 보인다: Task 6 `PuzzleVisualView` 테스트.
- 클라이언트 페이로드에 `answer`/`variants`가 새지 않는다(새 필드를 허용 목록에 넣다가 실수로 통째로 넘기는 경우): Task 3 `toClientRoom` 테스트.
- 이미지 타일이 서버에서 섞여도 정답 문자열(`tiles` 원본 순서)과 `tileImages` 키가 어긋나지 않는다: Task 2 `validateRoom` 테스트, Task 3 셔플 테스트.
- `rooms` 배열 순서가 어긋나면 `selectedRooms[roomId - 1]`이 다른 방을 가리킨다: Task 14 (id 1~120 연속·정렬 테스트).

---

## File Structure

| 파일 | 역할 | 작업 |
| --- | --- | --- |
| `package.json` | `test` 스크립트, `tsx` devDependency | Modify |
| `tsconfig.test.json` | 테스트용 tsconfig(JSX 변환, `server-only` 스텁 경로) | Create |
| `src/__tests__/stubs/server-only.ts` | `server-only` 패키지 대체 스텁(테스트 전용) | Create |
| `src/__tests__/helpers/public-file.ts` | `public/` 파일 존재 확인 헬퍼 | Create |
| `src/__tests__/helpers/hangul.ts` | 한글 초성/받침 추출 헬퍼(퍼즐 정합성 테스트용) | Create |
| `src/types/room.ts` | `PuzzleVisual`, `ChoiceOption` 등 타입과 `Room` 필드 추가 | Modify |
| `src/lib/puzzle-builders.ts` | `symRow`, `shapeCell` 데이터 빌더 | Create |
| `src/lib/rooms-validation.ts` | `validateRoom(room, deps)` 순수 함수 | Create |
| `src/lib/client-room.ts` | `toClientRoom`(클라이언트 전달용 정제) | Create |
| `src/app/escape/[roomId]/page.tsx` | 정제 로직을 `toClientRoom`으로 교체 | Modify |
| `src/components/puzzle-visuals/*.tsx` | 렌더러 6종 + `PuzzleVisualView` | Create |
| `src/components/ChoiceInput.tsx` | 보기 선택 입력 | Create |
| `src/components/TileOrderInput.tsx` | `tileImages` 지원 | Modify |
| `src/app/escape/[roomId]/RoomClient.tsx` | `PuzzleVisualView` 렌더링, `choice` 분기, `tileImages` 전달 | Modify |
| `public/puzzles/*.svg` | 일러스트 9개(방 20·13·8·17, 만화 컷 5개) | Create |
| `src/lib/visual-rooms/*.ts` | 샘플 문항 데이터 19개(렌더러군별) + `index.ts` | Create |
| `src/lib/rooms-data.ts` | 레거시 19개 항목 제거, `visualRooms` 합쳐 id 정렬 | Modify |
| `src/__tests__/**` | 위 각 단위 테스트 | Create |

---

### Task 1: 테스트 도구 구성과 기존 데이터 기준선

**Files:**
- Modify: `package.json`
- Create: `tsconfig.test.json`
- Create: `src/__tests__/stubs/server-only.ts`
- Create: `src/__tests__/rooms-data.baseline.test.ts`

**Interfaces:**
- Produces: `pnpm test`(전체 실행). 단일 파일 실행은 `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test <파일>`. 모든 이후 Task가 이 명령을 쓴다.

- [ ] **Step 1: tsx 설치**

Run: `pnpm add -D tsx`
Expected: `package.json` devDependencies에 `tsx`가 추가되고 `pnpm-lock.yaml`이 갱신된다.

- [ ] **Step 2: 테스트 설정 파일 작성**

`tsconfig.test.json`:

```json
{
	"extends": "./tsconfig.json",
	"compilerOptions": {
		"jsx": "react-jsx",
		"paths": {
			"@/*": ["./src/*"],
			"server-only": ["./src/__tests__/stubs/server-only.ts"]
		}
	}
}
```

`src/__tests__/stubs/server-only.ts`:

```ts
// Test-only stand-in for the `server-only` package (Next bundles its own copy).
export {};
```

`package.json`의 `scripts`에 `"test"`를 `"lint"` 다음 줄에 추가한다:

```json
"test": "TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test \"src/__tests__/**/*.test.ts\" \"src/__tests__/**/*.test.tsx\"",
```

- [ ] **Step 3: 기준선 테스트 작성**

`src/__tests__/rooms-data.baseline.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { rooms } from '@/lib/rooms-data';

test('rooms: 120 rooms with ids 1..120 in order', () => {
	assert.equal(rooms.length, 120);
	assert.deepEqual(
		rooms.map(room => room.id),
		Array.from({ length: 120 }, (_, index) => index + 1),
	);
});

test('rooms: tile-order answers equal the joined tiles', () => {
	for (const room of rooms) {
		for (const entry of [room, ...(room.variants ?? [])]) {
			if (entry.inputType !== 'tile-order') continue;
			const answers = Array.isArray(entry.answer) ? entry.answer : [entry.answer];
			const joined = (entry.tiles ?? []).join('').toLowerCase().replace(/\s+/g, '');
			assert.ok(
				answers.some(a => a.toLowerCase().replace(/\s+/g, '') === joined),
				`room ${room.id} tile-order answer does not match tiles`,
			);
		}
	}
});
```

- [ ] **Step 4: 실행해 통과 확인**

Run: `pnpm test`
Expected: PASS (2 tests). `Cannot find module 'server-only'`가 나오면 `TSX_TSCONFIG_PATH`가 스크립트에 들어갔는지 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add package.json pnpm-lock.yaml tsconfig.test.json src/__tests__
git commit -m "chore: add node:test + tsx test setup and rooms baseline test"
```

---

### Task 2: 타입, 데이터 빌더, `validateRoom`

**Files:**
- Modify: `src/types/room.ts`
- Create: `src/lib/puzzle-builders.ts`
- Create: `src/lib/rooms-validation.ts`
- Create: `src/__tests__/puzzle-builders.test.ts`
- Create: `src/__tests__/rooms-validation.test.ts`

**Interfaces:**
- Produces (types, `@/types/room`):
  - `GridCell = { text?: string; arrow?: 'up' | 'down' | 'left' | 'right'; mark?: 'hidden' | 'highlight' }`
  - `SymbolItem = { glyph?: string; color?: string; op?: '+' | '-' | '×' | '=' }`
  - `SymbolRow = { items: SymbolItem[]; value?: string }`
  - `ShapeName = 'circle' | 'square' | 'triangle' | 'diamond'`
  - `ShapeMark = { shape: ShapeName; filled: boolean; slot: number }` (slot 0~8, 3x3 미니 격자의 칸 번호)
  - `ShapeCell = { marks: ShapeMark[] }`
  - `Speaker = { id: string; name: string; says: string }`
  - `PuzzleVisual`(판별 유니온, 아래 코드 참고)
  - `ChoiceOption = { value: string; label?: string; image?: string; cell?: ShapeCell }`
  - `Room`/`RoomVariant`에 `visual?: PuzzleVisual; options?: ChoiceOption[]; tileImages?: Record<string, string>`
- Produces (`@/lib/puzzle-builders`):
  - `symRow(tokens: SymToken[], value?: string): SymbolRow` — `SymToken = string | SymbolItem`. 문자열 토큰 중 `+ - × =`는 연산자, 그 외는 `glyph`.
  - `shapeCell(shape: ShapeName, filled: boolean, count: 1 | 2 | 3): ShapeCell` — 슬롯은 count 1→`[4]`, 2→`[3,5]`, 3→`[3,4,5]`.
- Produces (`@/lib/rooms-validation`):
  - `validateRoom(room: Room, deps: { fileExists: (publicPath: string) => boolean }): string[]` — 오류 메시지 목록(비어 있으면 정상). 변형(`variants`)도 각각 검사한다.

- [ ] **Step 1: 빌더 테스트(실패) 작성**

`src/__tests__/puzzle-builders.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { shapeCell, symRow } from '@/lib/puzzle-builders';

test('symRow: operators become op items, others become glyph items', () => {
	assert.deepEqual(symRow(['3', '+', '4'], '7'), {
		items: [{ glyph: '3' }, { op: '+' }, { glyph: '4' }],
		value: '7',
	});
});

test('symRow: omits value for the question row and keeps item objects', () => {
	const row = symRow([{ color: '#c0392b' }, '×', '🕰️']);
	assert.deepEqual(row, {
		items: [{ color: '#c0392b' }, { op: '×' }, { glyph: '🕰️' }],
	});
	assert.equal('value' in row, false);
});

test('shapeCell: places marks in the middle row slots by count', () => {
	assert.deepEqual(
		shapeCell('circle', true, 1).marks.map(m => m.slot),
		[4],
	);
	assert.deepEqual(
		shapeCell('square', false, 2).marks.map(m => m.slot),
		[3, 5],
	);
	assert.deepEqual(
		shapeCell('triangle', true, 3).marks.map(m => m.slot),
		[3, 4, 5],
	);
	assert.equal(shapeCell('diamond', false, 2).marks[0].filled, false);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-builders.test.ts`
Expected: FAIL (`Cannot find module '@/lib/puzzle-builders'`).

- [ ] **Step 3: 타입 추가**

`src/types/room.ts`의 `export type Level = 1 | 2 | 3 | 4;` 아래, `RoomVariant` 정의 위에 추가한다:

```ts
export type GridCell = {
	text?: string;
	arrow?: 'up' | 'down' | 'left' | 'right';
	mark?: 'hidden' | 'highlight';
};

export type SymbolItem = {
	glyph?: string;
	color?: string;
	op?: '+' | '-' | '×' | '=';
};

export type SymbolRow = { items: SymbolItem[]; value?: string };

export type ShapeName = 'circle' | 'square' | 'triangle' | 'diamond';
export type ShapeMark = { shape: ShapeName; filled: boolean; slot: number };
export type ShapeCell = { marks: ShapeMark[] };

export type Speaker = { id: string; name: string; says: string };

export type PuzzleVisual =
	| { kind: 'image'; src: string; alt: string; width: number; height: number }
	| { kind: 'grid'; rows: GridCell[][]; caption?: string }
	| {
			kind: 'note';
			title?: string;
			lines: string[];
			style?: 'diary' | 'list' | 'warning';
	  }
	| { kind: 'symbol-rows'; rows: SymbolRow[]; background?: 'none' | 'clock' }
	| { kind: 'shape-matrix'; cells: ShapeCell[] }
	| { kind: 'statements'; speakers: Speaker[] };

export type ChoiceOption = {
	value: string;
	label?: string;
	image?: string;
	cell?: ShapeCell;
};
```

`RoomVariant`와 `Room` 두 인터페이스 모두에서 `tiles?: string[];` 바로 다음 줄에 같은 세 필드를 추가한다 (`Room`은 `variants?: RoomVariant[];` 앞):

```ts
	visual?: PuzzleVisual;
	options?: ChoiceOption[];
	tileImages?: Record<string, string>;
```

- [ ] **Step 4: 빌더 구현**

`src/lib/puzzle-builders.ts`:

```ts
import { ShapeCell, ShapeName, SymbolItem, SymbolRow } from '@/types/room';

const OPERATORS = ['+', '-', '×', '='];

export type SymToken = string | SymbolItem;

export function symRow(tokens: SymToken[], value?: string): SymbolRow {
	const items: SymbolItem[] = tokens.map(token => {
		if (typeof token !== 'string') return token;
		return OPERATORS.includes(token)
			? { op: token as SymbolItem['op'] }
			: { glyph: token };
	});
	return value === undefined ? { items } : { items, value };
}

const SLOTS_BY_COUNT: Record<1 | 2 | 3, number[]> = {
	1: [4],
	2: [3, 5],
	3: [3, 4, 5],
};

export function shapeCell(
	shape: ShapeName,
	filled: boolean,
	count: 1 | 2 | 3,
): ShapeCell {
	return {
		marks: SLOTS_BY_COUNT[count].map(slot => ({ shape, filled, slot })),
	};
}
```

- [ ] **Step 5: 빌더 테스트 통과 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-builders.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: `validateRoom` 테스트(실패) 작성**

`src/__tests__/rooms-validation.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRoom } from '@/lib/rooms-validation';
import { Room } from '@/types/room';

const deps = { fileExists: (p: string) => p === '/puzzles/ok.svg' };

const base = (overrides: Partial<Room>): Room => ({
	id: 1,
	title: 't',
	type: '관찰',
	question: 'q',
	answer: '1',
	hint: 'h',
	difficulty: 1,
	...overrides,
});

test('plain rooms are valid', () => {
	assert.deepEqual(validateRoom(base({}), deps), []);
});

test('choice: needs options, unique values, and an answer among them', () => {
	assert.match(
		validateRoom(base({ inputType: 'choice' }), deps).join('\n'),
		/options/,
	);
	assert.match(
		validateRoom(
			base({
				inputType: 'choice',
				options: [{ value: 'A' }, { value: 'A' }],
				answer: 'A',
			}),
			deps,
		).join('\n'),
		/duplicate/,
	);
	assert.match(
		validateRoom(
			base({
				inputType: 'choice',
				options: [{ value: 'A' }, { value: 'B' }],
				answer: 'C',
			}),
			deps,
		).join('\n'),
		/answer/,
	);
	assert.deepEqual(
		validateRoom(
			base({
				inputType: 'choice',
				options: [{ value: 'A' }, { value: 'B' }],
				answer: 'B',
			}),
			deps,
		),
		[],
	);
});

test('choice: option images must exist', () => {
	const errors = validateRoom(
		base({
			inputType: 'choice',
			options: [{ value: 'A', image: '/puzzles/missing.svg' }],
			answer: 'A',
		}),
		deps,
	);
	assert.match(errors.join('\n'), /missing\.svg/);
});

test('tile-order: answer must equal joined tiles; tileImages must cover tiles', () => {
	assert.match(
		validateRoom(
			base({ inputType: 'tile-order', tiles: ['B', 'A'], answer: 'AB' }),
			deps,
		).join('\n'),
		/tiles/,
	);
	assert.match(
		validateRoom(
			base({
				inputType: 'tile-order',
				tiles: ['B', 'A'],
				answer: 'BA',
				tileImages: { B: '/puzzles/ok.svg' },
			}),
			deps,
		).join('\n'),
		/tileImages/,
	);
	assert.deepEqual(
		validateRoom(
			base({
				inputType: 'tile-order',
				tiles: ['B', 'A'],
				answer: 'BA',
				tileImages: { A: '/puzzles/ok.svg', B: '/puzzles/ok.svg' },
			}),
			deps,
		),
		[],
	);
});

test('visual: image file must exist; grid/symbol-rows/statements must not be empty', () => {
	const image = { kind: 'image', src: '/puzzles/nope.svg', alt: 'a', width: 1, height: 1 } as const;
	assert.match(validateRoom(base({ visual: image }), deps).join('\n'), /nope\.svg/);
	assert.match(
		validateRoom(base({ visual: { kind: 'grid', rows: [] } }), deps).join('\n'),
		/grid/,
	);
	assert.match(
		validateRoom(base({ visual: { kind: 'symbol-rows', rows: [] } }), deps).join('\n'),
		/symbol-rows/,
	);
	assert.match(
		validateRoom(base({ visual: { kind: 'statements', speakers: [] } }), deps).join('\n'),
		/statements/,
	);
	assert.match(
		validateRoom(base({ visual: { kind: 'shape-matrix', cells: [] } }), deps).join('\n'),
		/shape-matrix/,
	);
});

test('variants are validated too', () => {
	const room = base({
		variants: [
			{
				variantId: '1-a',
				title: 't',
				type: '관찰',
				question: 'q',
				answer: 'C',
				hint: 'h',
				difficulty: 1,
				inputType: 'choice',
				options: [{ value: 'A' }],
			},
		],
	});
	assert.match(validateRoom(room, deps).join('\n'), /1-a/);
});
```

- [ ] **Step 7: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/rooms-validation.test.ts`
Expected: FAIL (`Cannot find module '@/lib/rooms-validation'`).

- [ ] **Step 8: `validateRoom` 구현**

`src/lib/rooms-validation.ts`:

```ts
import { Room, RoomVariant } from '@/types/room';

export interface ValidationDeps {
	fileExists: (publicPath: string) => boolean;
}

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, '');

const answersOf = (entry: Room | RoomVariant): string[] =>
	Array.isArray(entry.answer) ? entry.answer : [entry.answer];

function validateEntry(
	entry: Room | RoomVariant,
	label: string,
	deps: ValidationDeps,
): string[] {
	const errors: string[] = [];
	const fail = (message: string) => errors.push(`${label}: ${message}`);

	if (entry.inputType === 'choice') {
		const options = entry.options ?? [];
		if (options.length === 0) {
			fail('choice room needs options');
		} else {
			const values = options.map(option => option.value);
			if (new Set(values).size !== values.length) fail('duplicate option values');
			if (!answersOf(entry).some(a => values.includes(a))) {
				fail('answer is not one of the option values');
			}
		}
	}

	for (const option of entry.options ?? []) {
		if (option.image && !deps.fileExists(option.image)) {
			fail(`option image not found: ${option.image}`);
		}
	}

	if (entry.inputType === 'tile-order') {
		const tiles = entry.tiles ?? [];
		const joined = normalize(tiles.join(''));
		if (tiles.length === 0 || !answersOf(entry).some(a => normalize(a) === joined)) {
			fail('answer must equal the joined tiles');
		}
	}

	if (entry.tileImages) {
		const tiles = entry.tiles ?? [];
		for (const tile of tiles) {
			const src = entry.tileImages[tile];
			if (!src) fail(`tileImages is missing tile ${tile}`);
			else if (!deps.fileExists(src)) fail(`tile image not found: ${src}`);
		}
	}

	const visual = entry.visual;
	if (visual) {
		switch (visual.kind) {
			case 'image':
				if (!deps.fileExists(visual.src)) fail(`image not found: ${visual.src}`);
				break;
			case 'grid':
				if (visual.rows.length === 0) fail('grid has no rows');
				break;
			case 'note':
				if (visual.lines.length === 0) fail('note has no lines');
				break;
			case 'symbol-rows':
				if (visual.rows.length === 0) fail('symbol-rows has no rows');
				break;
			case 'shape-matrix':
				if (visual.cells.length !== 8) fail('shape-matrix needs exactly 8 cells');
				break;
			case 'statements':
				if (visual.speakers.length === 0) fail('statements has no speakers');
				break;
		}
	}

	return errors;
}

export function validateRoom(room: Room, deps: ValidationDeps): string[] {
	return [
		...validateEntry(room, `room ${room.id}`, deps),
		...(room.variants ?? []).flatMap(variant =>
			validateEntry(variant, `room ${room.id} variant ${variant.variantId}`, deps),
		),
	];
}
```

- [ ] **Step 9: 통과 확인과 정리**

Run: `pnpm test`
Expected: PASS (기존 2 + 3 + 6 tests).
Run: `pnpm exec prettier --write src/types/room.ts src/lib/puzzle-builders.ts src/lib/rooms-validation.ts src/__tests__/puzzle-builders.test.ts src/__tests__/rooms-validation.test.ts`

- [ ] **Step 10: 커밋**

```bash
git add src/types/room.ts src/lib/puzzle-builders.ts src/lib/rooms-validation.ts src/__tests__
git commit -m "feat: add visual puzzle types, data builders and room validation"
```

---

### Task 3: 클라이언트 전달용 정제 `toClientRoom`

**Files:**
- Create: `src/lib/client-room.ts`
- Create: `src/__tests__/client-room.test.ts`
- Modify: `src/app/escape/[roomId]/page.tsx`

**Interfaces:**
- Consumes: `Room`, `RoomVariant`, `ClientRoom` (`@/types/room`).
- Produces: `toClientRoom(room: Room, variant: RoomVariant | undefined, shuffle?: <T>(items: T[]) => T[]): ClientRoom` 와 `shuffleItems<T>(items: T[]): T[]`(`@/lib/client-room`). 반환 객체에는 `answer`, `variants`가 없다. `visual`, `options`, `tileImages`는 선택한 항목(변형이 있으면 변형)의 값을 그대로 넘긴다. `tiles`는 `shuffle`로 섞은 복사본이다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/client-room.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { toClientRoom } from '@/lib/client-room';
import { Room } from '@/types/room';

const room: Room = {
	id: 3,
	title: 'room',
	type: '관찰',
	question: 'q',
	answer: 'SECRET-ANSWER',
	hint: 'h',
	difficulty: 2,
	inputType: 'tile-order',
	tiles: ['A', 'B', 'C'],
	tileImages: { A: '/puzzles/a.svg', B: '/puzzles/b.svg', C: '/puzzles/c.svg' },
	visual: { kind: 'note', lines: ['x'] },
	options: [{ value: '1', label: 'one' }],
	variants: [
		{
			variantId: '3-a',
			title: 'variant',
			type: '관찰',
			question: 'vq',
			answer: 'VARIANT-SECRET',
			hint: 'vh',
			difficulty: 1,
			inputType: 'choice',
			options: [{ value: 'X' }],
		},
	],
};

const reverse = <T>(items: T[]): T[] => [...items].reverse();

test('toClientRoom never exposes answer or variants', () => {
	const client = toClientRoom(room, undefined, reverse);
	assert.equal('answer' in client, false);
	assert.equal('variants' in client, false);
	assert.ok(!JSON.stringify(client).includes('SECRET'));
});

test('toClientRoom forwards visual, options and tileImages and shuffles a tile copy', () => {
	const client = toClientRoom(room, undefined, reverse);
	assert.deepEqual(client.visual, { kind: 'note', lines: ['x'] });
	assert.deepEqual(client.options, [{ value: '1', label: 'one' }]);
	assert.deepEqual(client.tileImages, room.tileImages);
	assert.deepEqual(client.tiles, ['C', 'B', 'A']);
	assert.deepEqual(room.tiles, ['A', 'B', 'C']);
});

test('toClientRoom uses the selected variant fields and variantId', () => {
	const client = toClientRoom(room, room.variants![0], reverse);
	assert.equal(client.id, 3);
	assert.equal(client.variantId, '3-a');
	assert.equal(client.title, 'variant');
	assert.equal(client.inputType, 'choice');
	assert.deepEqual(client.options, [{ value: 'X' }]);
	assert.equal(client.tiles, undefined);
	assert.ok(!JSON.stringify(client).includes('SECRET'));
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/client-room.test.ts`
Expected: FAIL (`Cannot find module '@/lib/client-room'`).

- [ ] **Step 3: 구현**

`src/lib/client-room.ts`:

```ts
import { ClientRoom, Room, RoomVariant } from '@/types/room';

export function shuffleItems<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

// Whitelist of fields that may reach the browser: never pass `answer` or `variants`.
export function toClientRoom(
	room: Room,
	variant: RoomVariant | undefined,
	shuffle: <T>(items: T[]) => T[] = shuffleItems,
): ClientRoom {
	const playable = variant ?? room;
	return {
		id: room.id,
		variantId: variant?.variantId,
		title: playable.title,
		question: playable.question,
		hint: playable.hint,
		type: playable.type,
		difficulty: playable.difficulty,
		inputType: playable.inputType,
		comboLength: playable.comboLength,
		tiles: playable.tiles ? shuffle(playable.tiles) : undefined,
		tileImages: playable.tileImages,
		visual: playable.visual,
		options: playable.options,
	};
}
```

- [ ] **Step 4: 통과 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/client-room.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: `page.tsx`를 `toClientRoom`으로 교체**

`src/app/escape/[roomId]/page.tsx`에서 `shuffleTiles` 함수 정의(`const shuffleTiles = ...` 블록 전체)와 `const playableRoom = ...`, `const sanitizedRoom = {...};` 블록을 아래로 바꾼다. 결과 구간:

```tsx
	const selectedVariant = room.variants?.length
		? room.variants[Math.floor(Math.random() * room.variants.length)]
		: undefined;

	// Sanitize: Security measure to remove answer from client payload
	const sanitizedRoom = toClientRoom(room, selectedVariant);
	const isLastRoom = parsedRoomId === TOTAL_ROOMS;
```

파일 상단 import에 추가한다: `import { toClientRoom } from '@/lib/client-room';`

- [ ] **Step 6: 타입 확인과 전체 테스트**

Run: `pnpm exec tsc --noEmit`
Expected: 오류 없음.
Run: `pnpm test`
Expected: PASS.
Run: `pnpm exec prettier --write src/lib/client-room.ts src/__tests__/client-room.test.ts "src/app/escape/[roomId]/page.tsx"`

- [ ] **Step 7: 커밋**

```bash
git add src/lib/client-room.ts src/__tests__/client-room.test.ts "src/app/escape/[roomId]/page.tsx"
git commit -m "refactor: extract toClientRoom and forward visual puzzle fields"
```

---

### Task 4: 렌더러 A — `ImageVisual`, `NoteVisual`, `StatementsVisual`

**Files:**
- Create: `src/components/puzzle-visuals/ImageVisual.tsx`
- Create: `src/components/puzzle-visuals/NoteVisual.tsx`
- Create: `src/components/puzzle-visuals/StatementsVisual.tsx`
- Test: `src/__tests__/puzzle-visuals-a.test.tsx`

**Interfaces:**
- Produces:
  - `ImageVisual({ src, alt, width, height }: { src: string; alt: string; width: number; height: number })` — `next/image`(`unoptimized`)로 표시.
  - `NoteVisual({ title, lines, style }: { title?: string; lines: string[]; style?: 'diary' | 'list' | 'warning' })`
  - `StatementsVisual({ speakers }: { speakers: Speaker[] })`
  - 모두 default export.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/puzzle-visuals-a.test.tsx`:

```tsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ImageVisual from '@/components/puzzle-visuals/ImageVisual';
import NoteVisual from '@/components/puzzle-visuals/NoteVisual';
import StatementsVisual from '@/components/puzzle-visuals/StatementsVisual';

test('ImageVisual renders an img with alt text', () => {
	const html = renderToStaticMarkup(
		<ImageVisual src="/puzzles/x.svg" alt="열쇠 그림" width={480} height={340} />,
	);
	assert.match(html, /<img/);
	assert.match(html, /alt="열쇠 그림"/);
	assert.match(html, /\/puzzles\/x\.svg/);
});

test('NoteVisual renders the title and each line in order', () => {
	const html = renderToStaticMarkup(
		<NoteVisual title="10월 3일" lines={['첫째 줄', '둘째 줄']} style="diary" />,
	);
	assert.match(html, /10월 3일/);
	assert.ok(html.indexOf('첫째 줄') < html.indexOf('둘째 줄'));
	assert.match(html, /data-note-style="diary"/);
});

test('NoteVisual works without a title and defaults to list style', () => {
	const html = renderToStaticMarkup(<NoteVisual lines={['하나']} />);
	assert.match(html, /하나/);
	assert.match(html, /data-note-style="list"/);
});

test('StatementsVisual shows every speaker name and statement', () => {
	const html = renderToStaticMarkup(
		<StatementsVisual
			speakers={[
				{ id: '1', name: '집사', says: '범인은 정원사입니다.' },
				{ id: '2', name: '요리사', says: '범인은 하녀가 아닙니다.' },
			]}
		/>,
	);
	for (const text of ['집사', '범인은 정원사입니다.', '요리사', '범인은 하녀가 아닙니다.']) {
		assert.ok(html.includes(text), text);
	}
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-visuals-a.test.tsx`
Expected: FAIL (모듈을 찾을 수 없음).

- [ ] **Step 3: 구현**

`src/components/puzzle-visuals/ImageVisual.tsx`:

```tsx
import Image from 'next/image';

interface ImageVisualProps {
	src: string;
	alt: string;
	width: number;
	height: number;
}

export default function ImageVisual({ src, alt, width, height }: ImageVisualProps) {
	return (
		<figure
			className="mb-6 rounded overflow-hidden bg-black/60"
			style={{ border: '1px solid rgba(201, 162, 75, 0.25)' }}
		>
			<Image
				src={src}
				alt={alt}
				width={width}
				height={height}
				unoptimized
				className="w-full h-auto"
			/>
		</figure>
	);
}
```

`src/components/puzzle-visuals/NoteVisual.tsx`:

```tsx
interface NoteVisualProps {
	title?: string;
	lines: string[];
	style?: 'diary' | 'list' | 'warning';
}

const BORDER_BY_STYLE: Record<NonNullable<NoteVisualProps['style']>, string> = {
	diary: '1px solid rgba(60, 42, 20, 0.35)',
	list: '1px solid rgba(60, 42, 20, 0.35)',
	warning: '2px solid #8b2a1d',
};

export default function NoteVisual({ title, lines, style = 'list' }: NoteVisualProps) {
	return (
		<div
			data-note-style={style}
			className="mb-6 mx-auto max-w-md rounded px-5 py-4 shadow-lg"
			style={{
				background: '#e9dcbc',
				color: '#2a2418',
				border: BORDER_BY_STYLE[style],
			}}
		>
			{title && (
				<div className="mb-2 border-b border-[rgba(60,42,20,0.35)] pb-1 text-sm font-bold">
					{title}
				</div>
			)}
			<ul className="flex flex-col gap-1">
				{lines.map((line, index) => (
					<li
						key={index}
						className={`border-b border-[rgba(60,42,20,0.18)] py-1 text-sm md:text-base ${style === 'diary' ? 'italic' : ''}`}
					>
						{line}
					</li>
				))}
			</ul>
		</div>
	);
}
```

`src/components/puzzle-visuals/StatementsVisual.tsx`:

```tsx
import { Speaker } from '@/types/room';

export default function StatementsVisual({ speakers }: { speakers: Speaker[] }) {
	return (
		<ul className="mb-6 flex flex-col gap-3">
			{speakers.map(speaker => (
				<li key={speaker.id} className="flex items-start gap-3">
					<span
						className="shrink-0 rounded px-2 py-1 text-xs font-bold tracking-wider"
						style={{
							background: 'rgba(201, 162, 75, 0.15)',
							color: 'var(--color-brass)',
							border: '1px solid rgba(201, 162, 75, 0.35)',
						}}
					>
						{speaker.name}
					</span>
					<span
						className="rounded-lg px-3 py-2 text-sm md:text-base"
						style={{
							background: 'rgba(0, 0, 0, 0.55)',
							border: '1px solid rgba(201, 162, 75, 0.2)',
						}}
					>
						{speaker.says}
					</span>
				</li>
			))}
		</ul>
	);
}
```

- [ ] **Step 4: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-visuals-a.test.tsx`
Expected: PASS (4 tests).
Run: `pnpm exec prettier --write src/components/puzzle-visuals src/__tests__/puzzle-visuals-a.test.tsx`

- [ ] **Step 5: 커밋**

```bash
git add src/components/puzzle-visuals src/__tests__/puzzle-visuals-a.test.tsx
git commit -m "feat: add image, note and statements puzzle visuals"
```

---

### Task 5: 렌더러 B — `GridVisual`, `SymbolRowsVisual`, `ShapeMatrixVisual`

**Files:**
- Create: `src/components/puzzle-visuals/GridVisual.tsx`
- Create: `src/components/puzzle-visuals/SymbolRowsVisual.tsx`
- Create: `src/components/puzzle-visuals/ShapeMatrixVisual.tsx`
- Test: `src/__tests__/puzzle-visuals-b.test.tsx`

**Interfaces:**
- Consumes: `GridCell`, `SymbolRow`, `ShapeCell`, `ShapeName` (`@/types/room`).
- Produces (default export 외 추가 export 명시):
  - `GridVisual({ rows, caption }: { rows: GridCell[][]; caption?: string })` — 칸은 `data-cell-mark="highlight|hidden|none"` 속성, 화살표는 `→ ← ↑ ↓` 글리프. `hidden` 칸은 텍스트 대신 `?`.
  - `SymbolRowsVisual({ rows, background }: { rows: SymbolRow[]; background?: 'none' | 'clock' })` — 줄마다 `토큰들 = 값(없으면 ?)`. `background === 'clock'`이면 `data-background="clock"`이 붙은 시계판 SVG를 깐다.
  - `ShapeMatrixVisual({ cells }: { cells: ShapeCell[] })` — 8칸 + 9번째 `?` 칸. 
  - named export `ShapeCellView({ cell, size }: { cell: ShapeCell; size?: number })` — 보기 카드와 행렬 칸이 함께 쓰는 인라인 SVG(60x60 viewBox, 3x3 슬롯 중심 `x = 10 + 20 * (slot % 3)`, `y = 10 + 20 * Math.floor(slot / 3)`). 도형 요소는 `data-shape="circle|square|triangle|diamond"` 속성을 가진다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/puzzle-visuals-b.test.tsx`:

```tsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import GridVisual from '@/components/puzzle-visuals/GridVisual';
import SymbolRowsVisual from '@/components/puzzle-visuals/SymbolRowsVisual';
import ShapeMatrixVisual, { ShapeCellView } from '@/components/puzzle-visuals/ShapeMatrixVisual';
import { shapeCell, symRow } from '@/lib/puzzle-builders';

test('GridVisual renders cells, arrows, highlight and hidden marks', () => {
	const html = renderToStaticMarkup(
		<GridVisual
			rows={[
				[{ text: '샹', arrow: 'right', mark: 'highlight' }, { text: '들', arrow: 'down' }],
				[{ text: '5' }, { text: '30', mark: 'hidden' }],
			]}
			caption="경고문"
		/>,
	);
	assert.match(html, /샹/);
	assert.match(html, /→/);
	assert.match(html, /↓/);
	assert.match(html, /data-cell-mark="highlight"/);
	assert.match(html, /data-cell-mark="hidden"/);
	assert.ok(!html.includes('>30<'), 'hidden cell text must not be shown');
	assert.match(html, /경고문/);
});

test('SymbolRowsVisual renders "tokens = value" and "?" for the question row', () => {
	const html = renderToStaticMarkup(
		<SymbolRowsVisual
			rows={[symRow(['3', '+', '4'], '7'), symRow(['6', '+', '11'])]}
		/>,
	);
	assert.match(html, /7/);
	assert.match(html, /\?/);
	assert.ok(!html.includes('data-background="clock"'));
});

test('SymbolRowsVisual draws colored dots and an optional clock face', () => {
	const html = renderToStaticMarkup(
		<SymbolRowsVisual
			rows={[symRow([{ color: '#c0392b' }, { color: '#2f6db5' }], '15')]}
			background="clock"
		/>,
	);
	assert.match(html, /background:#c0392b|background-color:#c0392b/);
	assert.match(html, /data-background="clock"/);
});

test('ShapeCellView draws one element per mark at the slot position', () => {
	const html = renderToStaticMarkup(<ShapeCellView cell={shapeCell('circle', true, 2)} />);
	const circles = html.match(/data-shape="circle"/g) ?? [];
	assert.equal(circles.length, 2);
	assert.match(html, /cx="10"/);
	assert.match(html, /cx="50"/);
	assert.match(html, /cy="30"/);
});

test('ShapeMatrixVisual shows 8 cells and a question-mark cell', () => {
	const cells = Array.from({ length: 8 }, () => shapeCell('square', false, 1));
	const html = renderToStaticMarkup(<ShapeMatrixVisual cells={cells} />);
	assert.equal((html.match(/data-shape="square"/g) ?? []).length, 8);
	assert.match(html, /data-matrix-missing="true"/);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-visuals-b.test.tsx`
Expected: FAIL (모듈을 찾을 수 없음).

- [ ] **Step 3: `GridVisual` 구현**

`src/components/puzzle-visuals/GridVisual.tsx`:

```tsx
import { GridCell } from '@/types/room';

const ARROW_GLYPH: Record<NonNullable<GridCell['arrow']>, string> = {
	up: '↑',
	down: '↓',
	left: '←',
	right: '→',
};

interface GridVisualProps {
	rows: GridCell[][];
	caption?: string;
}

export default function GridVisual({ rows, caption }: GridVisualProps) {
	const columns = Math.max(...rows.map(row => row.length));
	return (
		<div className="mb-6">
			<div
				className="mx-auto grid max-w-sm gap-2"
				style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
			>
				{rows.flatMap((row, rowIndex) =>
					row.map((cell, colIndex) => {
						const mark = cell.mark ?? 'none';
						return (
							<div
								key={`${rowIndex}-${colIndex}`}
								data-cell-mark={mark}
								className="relative flex aspect-square items-center justify-center rounded text-2xl font-bold md:text-3xl"
								style={{
									background: 'rgba(0, 0, 0, 0.55)',
									color: '#e9dcbc',
									border:
										mark === 'highlight'
											? '2px solid var(--color-brass)'
											: mark === 'hidden'
												? '2px dashed rgba(201, 162, 75, 0.5)'
												: '1px solid rgba(201, 162, 75, 0.25)',
									boxShadow:
										mark === 'highlight'
											? '0 0 14px rgba(232, 150, 90, 0.55)'
											: undefined,
								}}
							>
								{mark === 'hidden' ? '?' : cell.text}
								{cell.arrow && (
									<span
										aria-label={`화살표 ${cell.arrow}`}
										className="absolute bottom-0.5 right-1.5 text-sm"
										style={{ color: 'var(--color-brass)' }}
									>
										{ARROW_GLYPH[cell.arrow]}
									</span>
								)}
							</div>
						);
					}),
				)}
			</div>
			{caption && (
				<p className="mt-3 text-center text-xs md:text-sm text-[#a38a4a]">{caption}</p>
			)}
		</div>
	);
}
```

- [ ] **Step 4: `SymbolRowsVisual` 구현**

`src/components/puzzle-visuals/SymbolRowsVisual.tsx`:

```tsx
import { SymbolItem, SymbolRow } from '@/types/room';

interface SymbolRowsVisualProps {
	rows: SymbolRow[];
	background?: 'none' | 'clock';
}

function ClockFace() {
	return (
		<svg
			data-background="clock"
			aria-hidden="true"
			viewBox="0 0 200 200"
			className="pointer-events-none absolute inset-0 m-auto h-full max-h-72 w-full opacity-15"
		>
			<circle cx="100" cy="100" r="92" fill="none" stroke="#c9a24b" strokeWidth="4" />
			{Array.from({ length: 12 }, (_, index) => {
				const angle = (index * Math.PI) / 6;
				return (
					<line
						key={index}
						x1={100 + 80 * Math.sin(angle)}
						y1={100 - 80 * Math.cos(angle)}
						x2={100 + 90 * Math.sin(angle)}
						y2={100 - 90 * Math.cos(angle)}
						stroke="#c9a24b"
						strokeWidth="4"
					/>
				);
			})}
		</svg>
	);
}

function Item({ item }: { item: SymbolItem }) {
	if (item.color) {
		return (
			<span
				role="img"
				aria-label="색깔 등불"
				className="inline-block h-7 w-7 rounded-full"
				style={{ background: item.color, border: '2px solid rgba(255,255,255,0.35)' }}
			/>
		);
	}
	if (item.op) return <span className="text-xl text-[#a38a4a]">{item.op}</span>;
	return <span className="text-2xl md:text-3xl">{item.glyph}</span>;
}

export default function SymbolRowsVisual({ rows, background = 'none' }: SymbolRowsVisualProps) {
	return (
		<div
			className="relative mb-6 mx-auto flex max-w-md flex-col gap-3 rounded px-4 py-5"
			style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(201,162,75,0.25)' }}
		>
			{background === 'clock' && <ClockFace />}
			{rows.map((row, rowIndex) => (
				<div
					key={rowIndex}
					className="relative flex flex-wrap items-center justify-center gap-2 text-[#e9dcbc]"
				>
					{row.items.map((item, itemIndex) => (
						<Item key={itemIndex} item={item} />
					))}
					<span className="text-xl text-[#a38a4a]">=</span>
					<span className="min-w-8 text-2xl font-bold md:text-3xl">{row.value ?? '?'}</span>
				</div>
			))}
		</div>
	);
}
```

- [ ] **Step 5: `ShapeMatrixVisual` 구현**

`src/components/puzzle-visuals/ShapeMatrixVisual.tsx`:

```tsx
import { ShapeCell, ShapeMark } from '@/types/room';

function Mark({ mark }: { mark: ShapeMark }) {
	const x = 10 + 20 * (mark.slot % 3);
	const y = 10 + 20 * Math.floor(mark.slot / 3);
	const paint = {
		fill: mark.filled ? 'currentColor' : 'none',
		stroke: 'currentColor',
		strokeWidth: 2,
	};
	switch (mark.shape) {
		case 'circle':
			return <circle data-shape="circle" cx={x} cy={y} r={7} {...paint} />;
		case 'square':
			return <rect data-shape="square" x={x - 7} y={y - 7} width={14} height={14} {...paint} />;
		case 'triangle':
			return (
				<polygon
					data-shape="triangle"
					points={`${x},${y - 8} ${x + 8},${y + 7} ${x - 8},${y + 7}`}
					{...paint}
				/>
			);
		case 'diamond':
			return (
				<polygon
					data-shape="diamond"
					points={`${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`}
					{...paint}
				/>
			);
	}
}

export function ShapeCellView({ cell, size = 72 }: { cell: ShapeCell; size?: number }) {
	return (
		<svg
			viewBox="0 0 60 60"
			width={size}
			height={size}
			role="img"
			aria-label={`도형 ${cell.marks.length}개`}
			style={{ color: '#e9dcbc' }}
		>
			{cell.marks.map((mark, index) => (
				<Mark key={index} mark={mark} />
			))}
		</svg>
	);
}

export default function ShapeMatrixVisual({ cells }: { cells: ShapeCell[] }) {
	return (
		<div className="mb-6 mx-auto grid max-w-xs grid-cols-3 gap-2">
			{cells.map((cell, index) => (
				<div
					key={index}
					className="flex items-center justify-center rounded"
					style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(201,162,75,0.25)' }}
				>
					<ShapeCellView cell={cell} />
				</div>
			))}
			<div
				data-matrix-missing="true"
				className="flex items-center justify-center rounded text-3xl font-bold"
				style={{
					background: 'rgba(0,0,0,0.35)',
					border: '2px dashed rgba(201,162,75,0.5)',
					color: 'var(--color-brass)',
				}}
			>
				?
			</div>
		</div>
	);
}
```

- [ ] **Step 6: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-visuals-b.test.tsx`
Expected: PASS (5 tests). `background:#c0392b` 정규식이 React의 인라인 스타일 직렬화(`background:#c0392b`)와 맞는지 확인한다.
Run: `pnpm exec tsc --noEmit`
Expected: 오류 없음.
Run: `pnpm exec prettier --write src/components/puzzle-visuals src/__tests__/puzzle-visuals-b.test.tsx`

- [ ] **Step 7: 커밋**

```bash
git add src/components/puzzle-visuals src/__tests__/puzzle-visuals-b.test.tsx
git commit -m "feat: add grid, symbol-rows and shape-matrix puzzle visuals"
```

---

### Task 6: 디스패처 `PuzzleVisualView`

**Files:**
- Create: `src/components/puzzle-visuals/PuzzleVisualView.tsx`
- Test: `src/__tests__/puzzle-visual-view.test.tsx`

**Interfaces:**
- Consumes: Task 4·5의 6개 렌더러, `PuzzleVisual` 타입.
- Produces: `PuzzleVisualView({ visual }: { visual?: PuzzleVisual })` — `visual`이 없거나 알 수 없는 `kind`면 `null`을 반환(알 수 없는 kind는 `console.warn`).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/puzzle-visual-view.test.tsx`:

```tsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import PuzzleVisualView from '@/components/puzzle-visuals/PuzzleVisualView';
import { PuzzleVisual } from '@/types/room';

test('renders nothing without a visual', () => {
	assert.equal(renderToStaticMarkup(<PuzzleVisualView />), '');
});

test('dispatches each kind to its renderer', () => {
	const cases: [PuzzleVisual, RegExp][] = [
		[{ kind: 'image', src: '/puzzles/a.svg', alt: '그림', width: 10, height: 10 }, /<img/],
		[{ kind: 'grid', rows: [[{ text: '가' }]] }, /data-cell-mark/],
		[{ kind: 'note', lines: ['줄'] }, /data-note-style/],
		[{ kind: 'symbol-rows', rows: [{ items: [{ glyph: '1' }], value: '1' }] }, /1/],
		[
			{
				kind: 'shape-matrix',
				cells: Array.from({ length: 8 }, () => ({ marks: [] })),
			},
			/data-matrix-missing/,
		],
		[{ kind: 'statements', speakers: [{ id: '1', name: '집사', says: '말' }] }, /집사/],
	];
	for (const [visual, pattern] of cases) {
		assert.match(renderToStaticMarkup(<PuzzleVisualView visual={visual} />), pattern, visual.kind);
	}
});

test('unknown kind renders nothing instead of crashing', () => {
	const originalWarn = console.warn;
	const warnings: unknown[] = [];
	console.warn = (...args: unknown[]) => warnings.push(args);
	try {
		const bogus = { kind: 'bogus' } as unknown as PuzzleVisual;
		assert.equal(renderToStaticMarkup(<PuzzleVisualView visual={bogus} />), '');
		assert.equal(warnings.length, 1);
	} finally {
		console.warn = originalWarn;
	}
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-visual-view.test.tsx`
Expected: FAIL (모듈을 찾을 수 없음).

- [ ] **Step 3: 구현**

`src/components/puzzle-visuals/PuzzleVisualView.tsx`:

```tsx
import { PuzzleVisual } from '@/types/room';
import GridVisual from './GridVisual';
import ImageVisual from './ImageVisual';
import NoteVisual from './NoteVisual';
import ShapeMatrixVisual from './ShapeMatrixVisual';
import StatementsVisual from './StatementsVisual';
import SymbolRowsVisual from './SymbolRowsVisual';

export default function PuzzleVisualView({ visual }: { visual?: PuzzleVisual }) {
	if (!visual) return null;
	switch (visual.kind) {
		case 'image':
			return <ImageVisual {...visual} />;
		case 'grid':
			return <GridVisual rows={visual.rows} caption={visual.caption} />;
		case 'note':
			return <NoteVisual title={visual.title} lines={visual.lines} style={visual.style} />;
		case 'symbol-rows':
			return <SymbolRowsVisual rows={visual.rows} background={visual.background} />;
		case 'shape-matrix':
			return <ShapeMatrixVisual cells={visual.cells} />;
		case 'statements':
			return <StatementsVisual speakers={visual.speakers} />;
		default:
			console.warn('Unknown puzzle visual kind', (visual as { kind?: unknown }).kind);
			return null;
	}
}
```

- [ ] **Step 4: 통과 확인과 정리**

Run: `pnpm test`
Expected: PASS.
Run: `pnpm exec tsc --noEmit`
Expected: 오류 없음. (`ImageVisual {...visual}`가 `kind` prop을 넘겨 타입 오류가 나면 `<ImageVisual src={visual.src} alt={visual.alt} width={visual.width} height={visual.height} />`로 바꾼다.)
Run: `pnpm exec prettier --write src/components/puzzle-visuals/PuzzleVisualView.tsx src/__tests__/puzzle-visual-view.test.tsx`

- [ ] **Step 5: 커밋**

```bash
git add src/components/puzzle-visuals/PuzzleVisualView.tsx src/__tests__/puzzle-visual-view.test.tsx
git commit -m "feat: add PuzzleVisualView dispatcher"
```

---

### Task 7: `ChoiceInput`, `TileOrderInput` 이미지 지원, `RoomClient` 연결

**Files:**
- Create: `src/components/ChoiceInput.tsx`
- Modify: `src/components/TileOrderInput.tsx`
- Modify: `src/app/escape/[roomId]/RoomClient.tsx`
- Test: `src/__tests__/choice-input.test.tsx`, `src/__tests__/tile-order-input.test.tsx`

**Interfaces:**
- Consumes: `ChoiceOption`, `ShapeCellView`(Task 5), `PuzzleVisualView`(Task 6).
- Produces:
  - `ChoiceInput({ options, onChange, disabled }: { options: ChoiceOption[]; onChange: (value: string) => void; disabled?: boolean })` — 카드를 탭해 하나를 선택. 선택한 카드는 `aria-pressed="true"`. 선택 값은 `onChange(option.value)`. `options`가 바뀌면 선택과 값(`onChange('')`)을 초기화한다.
  - `TileOrderInput`에 `tileImages?: Record<string, string>` prop 추가. 있으면 타일을 이미지 버튼으로(`alt="컷 <id>"`), 선택 영역은 순번 배지가 붙은 썸네일로 표시. 없으면 기존 텍스트 동작 그대로.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/choice-input.test.tsx`:

```tsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import ChoiceInput from '@/components/ChoiceInput';
import { shapeCell } from '@/lib/puzzle-builders';

test('ChoiceInput renders one pressable card per option with nothing selected', () => {
	const html = renderToStaticMarkup(
		<ChoiceInput
			options={[
				{ value: '1', label: '출구 1' },
				{ value: '2', label: '출구 2' },
				{ value: '3', label: '출구 3' },
			]}
			onChange={() => {}}
		/>,
	);
	assert.equal((html.match(/<button/g) ?? []).length, 3);
	assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 3);
	assert.ok(!html.includes('aria-pressed="true"'));
	assert.match(html, /출구 2/);
});

test('ChoiceInput renders shape cells and option images', () => {
	const html = renderToStaticMarkup(
		<ChoiceInput
			options={[
				{ value: 'A', label: 'A', cell: shapeCell('triangle', true, 3) },
				{ value: 'B', label: 'B', image: '/puzzles/x.svg' },
			]}
			onChange={() => {}}
		/>,
	);
	assert.match(html, /data-shape="triangle"/);
	assert.match(html, /\/puzzles\/x\.svg/);
});

test('ChoiceInput disables every card when disabled', () => {
	const html = renderToStaticMarkup(
		<ChoiceInput options={[{ value: '1', label: '하나' }]} onChange={() => {}} disabled />,
	);
	assert.match(html, /disabled=""/);
});
```

`src/__tests__/tile-order-input.test.tsx`:

```tsx
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import TileOrderInput from '@/components/TileOrderInput';

test('TileOrderInput keeps text tiles when tileImages is absent', () => {
	const html = renderToStaticMarkup(<TileOrderInput tiles={['가', '나']} onChange={() => {}} />);
	assert.match(html, />가</);
	assert.ok(!html.includes('<img'));
});

test('TileOrderInput renders image tiles when tileImages is given', () => {
	const html = renderToStaticMarkup(
		<TileOrderInput
			tiles={['C', 'A']}
			tileImages={{ C: '/puzzles/room-11-c.svg', A: '/puzzles/room-11-a.svg' }}
			onChange={() => {}}
		/>,
	);
	assert.equal((html.match(/<img/g) ?? []).length, 2);
	assert.match(html, /alt="컷 C"/);
	assert.match(html, /room-11-a\.svg/);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/choice-input.test.tsx src/__tests__/tile-order-input.test.tsx`
Expected: FAIL (`ChoiceInput` 모듈 없음, 이미지 타일 테스트 실패).

- [ ] **Step 3: `ChoiceInput` 구현**

`src/components/ChoiceInput.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChoiceOption } from '@/types/room';
import { ShapeCellView } from '@/components/puzzle-visuals/ShapeMatrixVisual';

interface ChoiceInputProps {
	options: ChoiceOption[];
	onChange: (value: string) => void;
	disabled?: boolean;
}

export default function ChoiceInput({ options, onChange, disabled }: ChoiceInputProps) {
	const [selected, setSelected] = useState<string | null>(null);

	// A new room brings new options: drop the previous selection and answer.
	useEffect(() => {
		setSelected(null);
		onChange('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options]);

	const handleSelect = (value: string) => {
		if (disabled) return;
		setSelected(value);
		onChange(value);
	};

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{options.map(option => {
				const isSelected = selected === option.value;
				return (
					<button
						key={option.value}
						type="button"
						disabled={disabled}
						aria-pressed={isSelected}
						onClick={() => handleSelect(option.value)}
						className="btn-antique flex flex-col items-center justify-center gap-2 px-3 py-3 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
						style={isSelected ? { borderColor: 'var(--color-brass)', boxShadow: '0 0 12px rgba(232,150,90,0.5)' } : undefined}
					>
						{option.cell && <ShapeCellView cell={option.cell} size={64} />}
						{option.image && (
							<Image
								src={option.image}
								alt={option.label ?? option.value}
								width={96}
								height={96}
								unoptimized
								className="h-auto w-24"
							/>
						)}
						{option.label && <span>{option.label}</span>}
					</button>
				);
			})}
		</div>
	);
}
```

- [ ] **Step 4: `TileOrderInput` 이미지 지원**

`src/components/TileOrderInput.tsx` 전체를 아래로 교체한다(기존 동작 유지, 기존 파일의 2칸 들여쓰기 대신 프로젝트 prettier 설정을 따른다):

```tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface TileOrderInputProps {
	tiles: string[];
	tileImages?: Record<string, string>;
	onChange: (val: string) => void;
	disabled?: boolean;
}

// selectedIndices, not value, is the source of truth — value may be ambiguous with duplicate tiles
export default function TileOrderInput({
	tiles,
	tileImages,
	onChange,
	disabled,
}: TileOrderInputProps) {
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

	useEffect(() => {
		setSelectedIndices([]);
		onChange('');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tiles]);

	const handleTap = (index: number) => {
		if (disabled || selectedIndices.includes(index)) return;
		const nextIndices = [...selectedIndices, index];
		setSelectedIndices(nextIndices);
		onChange(nextIndices.map(i => tiles[i]).join(''));
	};

	const handleReset = () => {
		if (disabled) return;
		setSelectedIndices([]);
		onChange('');
	};

	const renderTile = (tile: string, size: number) =>
		tileImages?.[tile] ? (
			<Image
				src={tileImages[tile]}
				alt={`컷 ${tile}`}
				width={size}
				height={Math.round(size * 0.75)}
				unoptimized
				className="h-auto rounded"
				style={{ width: size }}
			/>
		) : (
			tile
		);

	const imageMode = Boolean(tileImages);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex min-h-[2.5rem] flex-wrap justify-center gap-2 rounded border border-[rgba(201,162,75,0.25)] bg-black/40 p-3">
				{selectedIndices.length === 0 ? (
					<span className="text-xs text-[rgba(201,162,75,0.4)]">
						{imageMode ? '컷을 순서대로 탭하세요...' : '타일을 순서대로 탭하세요...'}
					</span>
				) : (
					selectedIndices.map((tileIndex, orderIndex) => (
						<span
							key={`selected-${orderIndex}`}
							className="antique-input relative px-3 py-1 text-sm"
							style={{ width: 'auto', display: 'inline-block' }}
						>
							{imageMode && (
								<span className="absolute -left-1 -top-1 rounded-full bg-[#c9a24b] px-1.5 text-[10px] font-bold text-black">
									{orderIndex + 1}
								</span>
							)}
							{renderTile(tiles[tileIndex], 72)}
						</span>
					))
				)}
			</div>

			<div className="flex flex-wrap justify-center gap-2">
				{tiles.map((tile, index) => (
					<button
						key={index}
						type="button"
						disabled={disabled || selectedIndices.includes(index)}
						onClick={() => handleTap(index)}
						className="btn-antique px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-30"
					>
						{renderTile(tile, 112)}
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={handleReset}
				disabled={disabled || selectedIndices.length === 0}
				className="self-center text-[10px] text-[rgba(201,162,75,0.6)] underline transition-colors hover:text-[#c9a24b] disabled:cursor-not-allowed disabled:opacity-30"
			>
				다시 섞기
			</button>
		</div>
	);
}
```

- [ ] **Step 5: `RoomClient` 연결**

`src/app/escape/[roomId]/RoomClient.tsx`를 수정한다.

(a) import 추가 (`TileOrderInput` import 다음 줄들에):

```tsx
import ChoiceInput from '@/components/ChoiceInput';
import PuzzleVisualView from '@/components/puzzle-visuals/PuzzleVisualView';
import { ChoiceOption, ClientRoom, Level } from '@/types/room';
```

그리고 기존 `import { ClientRoom, Level } from '@/types/room';` 줄은 삭제한다. `interface RoomClientProps` 위에 상수를 추가한다:

```tsx
const NO_OPTIONS: ChoiceOption[] = [];
```

(b) 질문 박스(`</div>` 로 닫히는 `이 방에 남겨진 수수께끼` 블록) 바로 뒤, `{/* Target image (Stage 10 spec) */}` 위에 추가한다:

```tsx
							<PuzzleVisualView visual={room.visual} />
```

(c) 입력 분기에서 `tile-order` 분기를 수정하고 `choice` 분기를 추가한다. 기존

```tsx
							) : room.inputType === 'tile-order' ? (
								<TileOrderInput
									tiles={room.tiles || []}
									onChange={setAnswer}
									disabled={isSubmitting}
								/>
							) : (
```

를 다음으로 교체한다:

```tsx
							) : room.inputType === 'tile-order' ? (
								<TileOrderInput
									tiles={room.tiles || []}
									tileImages={room.tileImages}
									onChange={setAnswer}
									disabled={isSubmitting}
								/>
							) : room.inputType === 'choice' ? (
								<ChoiceInput
									options={room.options ?? NO_OPTIONS}
									onChange={setAnswer}
									disabled={isSubmitting}
								/>
							) : (
```

- [ ] **Step 6: 통과 확인과 정리**

Run: `pnpm test`
Expected: PASS.
Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음(기존에 있던 경고는 늘리지 않는다).
Run: `pnpm exec prettier --write src/components/ChoiceInput.tsx src/components/TileOrderInput.tsx src/__tests__/choice-input.test.tsx src/__tests__/tile-order-input.test.tsx`
(`RoomClient.tsx`는 기존 서식을 크게 바꾸지 않도록 prettier를 돌리지 않는다.)

- [ ] **Step 7: 커밋**

```bash
git add src/components src/__tests__ "src/app/escape/[roomId]/RoomClient.tsx"
git commit -m "feat: add choice input, image tiles and wire visuals into RoomClient"
```

---

### Task 8: 일러스트 SVG 4종 (방 20·13·8·17)

**Files:**
- Create: `public/puzzles/room-20-owl.svg`
- Create: `public/puzzles/room-13-keys.svg`
- Create: `public/puzzles/room-8-pipes.svg`
- Create: `public/puzzles/room-17-doors.svg`
- Test: `src/__tests__/puzzle-assets.test.ts`

**Interfaces:**
- Produces: 위 4개 SVG 경로(`/puzzles/<파일명>`). Task 13의 문항 데이터가 `src`로 참조한다. 이 Task는 파일 존재·형식만 검증하고, 그림 자체는 Step 6에서 눈으로 확인한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/puzzle-assets.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'puzzles');

const EXPECTED = [
	'room-20-owl.svg',
	'room-13-keys.svg',
	'room-8-pipes.svg',
	'room-17-doors.svg',
];

for (const name of EXPECTED) {
	test(`puzzle asset ${name} is a well-formed svg with a viewBox`, () => {
		const file = path.join(dir, name);
		assert.ok(fs.existsSync(file), `${name} is missing`);
		const svg = fs.readFileSync(file, 'utf8');
		assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
		assert.match(svg, /viewBox="0 0 \d+ \d+"/);
		assert.match(svg, /<\/svg>\s*$/);
		const opens = (svg.match(/<g[\s>]/g) ?? []).length;
		const closes = (svg.match(/<\/g>/g) ?? []).length;
		assert.equal(opens, closes, 'unbalanced <g> tags');
	});
}
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-assets.test.ts`
Expected: FAIL (4개 모두 `... is missing`).

- [ ] **Step 3: 방 20 — 올빼미 키 (`room-20-owl.svg`)**

해석: 소년 키 H, 올빼미 키 o. 왼쪽 그림 H + o = 170, 가운데 그림 H − o = 110. 따라서 H = 140, o = 30.

`public/puzzles/room-20-owl.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 260" width="480" height="260">
	<defs>
		<marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
			<path d="M0 0L10 5L0 10Z" fill="#2a2418"/>
		</marker>
		<g id="boy">
			<circle cx="0" cy="-126" r="14" fill="#e8c9a0" stroke="#2a2418" stroke-width="2"/>
			<rect x="-15" y="-112" width="30" height="72" fill="#5a4a2a"/>
			<rect x="-12" y="-40" width="10" height="40" fill="#2a2418"/>
			<rect x="2" y="-40" width="10" height="40" fill="#2a2418"/>
		</g>
		<g id="owl">
			<ellipse cx="0" cy="-15" rx="12" ry="15" fill="#8a6d3b" stroke="#2a2418" stroke-width="2"/>
			<circle cx="-4" cy="-20" r="3.5" fill="#ffffff"/>
			<circle cx="4" cy="-20" r="3.5" fill="#ffffff"/>
			<circle cx="-4" cy="-20" r="1.5" fill="#2a2418"/>
			<circle cx="4" cy="-20" r="1.5" fill="#2a2418"/>
			<path d="M-2 -13L2 -13L0 -9Z" fill="#e0a030"/>
		</g>
	</defs>
	<rect width="480" height="260" fill="#f4ead0"/>
	<line x1="10" y1="230" x2="470" y2="230" stroke="#2a2418" stroke-width="3"/>

	<use href="#boy" transform="translate(80 230)"/>
	<use href="#owl" transform="translate(80 90)"/>
	<line x1="40" y1="60" x2="40" y2="230" stroke="#2a2418" stroke-width="2" marker-start="url(#arr)" marker-end="url(#arr)"/>
	<line x1="40" y1="60" x2="66" y2="60" stroke="#2a2418" stroke-width="1" stroke-dasharray="4 3"/>
	<text x="12" y="150" font-size="18" font-family="sans-serif" fill="#2a2418">170</text>

	<use href="#boy" transform="translate(240 230)"/>
	<use href="#owl" transform="translate(292 230)"/>
	<line x1="292" y1="200" x2="350" y2="200" stroke="#2a2418" stroke-width="1" stroke-dasharray="4 3"/>
	<line x1="254" y1="90" x2="350" y2="90" stroke="#2a2418" stroke-width="1" stroke-dasharray="4 3"/>
	<line x1="338" y1="90" x2="338" y2="200" stroke="#2a2418" stroke-width="2" marker-start="url(#arr)" marker-end="url(#arr)"/>
	<text x="346" y="150" font-size="18" font-family="sans-serif" fill="#2a2418">110</text>

	<use href="#owl" transform="translate(420 230)"/>
	<line x1="446" y1="200" x2="446" y2="230" stroke="#2a2418" stroke-width="2" marker-start="url(#arr)" marker-end="url(#arr)"/>
	<text x="452" y="222" font-size="24" font-weight="bold" font-family="sans-serif" fill="#8b2a1d">?</text>
</svg>
```

- [ ] **Step 4: 방 13 — 자물쇠와 열쇠 (`room-13-keys.svg`)**

정답 열쇠는 이빨 길이 `[2,1,3,1]`(8px 단위)인 C. 자물쇠 구멍(검은 홈)이 같은 윤곽이다. A `[2,1,3,2]`, B `[1,2,3,1]`, C `[2,1,3,1]`, D `[2,3,1,1]`.

`public/puzzles/room-13-keys.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 340" width="480" height="340">
	<defs>
		<g id="key-base">
			<circle cx="14" cy="5" r="12" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
			<circle cx="14" cy="5" r="4" fill="#f4ead0"/>
			<rect x="26" y="0" width="84" height="10" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		</g>
	</defs>
	<rect width="480" height="340" fill="#f4ead0"/>

	<path d="M205 60V40a35 35 0 0 1 70 0V60" fill="none" stroke="#3a3020" stroke-width="10"/>
	<rect x="170" y="60" width="140" height="110" rx="10" fill="#8a7a52" stroke="#3a3020" stroke-width="4"/>
	<g transform="translate(198 100)" fill="#000000">
		<rect x="0" y="0" width="84" height="10"/>
		<rect x="18" y="10" width="8" height="16"/>
		<rect x="34" y="10" width="8" height="8"/>
		<rect x="50" y="10" width="8" height="24"/>
		<rect x="66" y="10" width="8" height="8"/>
	</g>

	<g transform="translate(60 215)">
		<use href="#key-base"/>
		<rect x="44" y="10" width="8" height="16" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="60" y="10" width="8" height="8" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="76" y="10" width="8" height="24" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="92" y="10" width="8" height="16" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<text x="-40" y="14" font-size="24" font-weight="bold" font-family="sans-serif" fill="#2a2418">A</text>
	</g>
	<g transform="translate(270 215)">
		<use href="#key-base"/>
		<rect x="44" y="10" width="8" height="8" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="60" y="10" width="8" height="16" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="76" y="10" width="8" height="24" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="92" y="10" width="8" height="8" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<text x="-40" y="14" font-size="24" font-weight="bold" font-family="sans-serif" fill="#2a2418">B</text>
	</g>
	<g transform="translate(60 285)">
		<use href="#key-base"/>
		<rect x="44" y="10" width="8" height="16" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="60" y="10" width="8" height="8" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="76" y="10" width="8" height="24" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="92" y="10" width="8" height="8" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<text x="-40" y="14" font-size="24" font-weight="bold" font-family="sans-serif" fill="#2a2418">C</text>
	</g>
	<g transform="translate(270 285)">
		<use href="#key-base"/>
		<rect x="44" y="10" width="8" height="16" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="60" y="10" width="8" height="24" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="76" y="10" width="8" height="8" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<rect x="92" y="10" width="8" height="8" fill="#c9a24b" stroke="#2a2418" stroke-width="2"/>
		<text x="-40" y="14" font-size="24" font-weight="bold" font-family="sans-serif" fill="#2a2418">D</text>
	</g>
</svg>
```

- [ ] **Step 5: 방 8 — 수도관 (`room-8-pipes.svg`)과 방 17 — 같은 색 문 (`room-17-doors.svg`)**

방 8: 물이 닿는 통은 1번과 3번이다(● 점은 연결, ∩ 다리는 연결 안 됨, 빨간 ✕ 밸브 쪽은 막힘).

`public/puzzles/room-8-pipes.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 340" width="480" height="340">
	<rect width="480" height="340" fill="#f4ead0"/>
	<g fill="none" stroke="#3d6b8a" stroke-width="10" stroke-linejoin="round" stroke-linecap="butt">
		<path d="M240 38V70"/>
		<path d="M240 70H90V140H300V290"/>
		<path d="M240 70H390V290"/>
		<path d="M300 220H60V290"/>
		<path d="M150 290V250H288a12 12 0 0 1 24 0H390"/>
	</g>
	<rect x="222" y="6" width="36" height="24" fill="#7a6a4a" stroke="#2a2418" stroke-width="2"/>
	<rect x="234" y="30" width="12" height="10" fill="#7a6a4a" stroke="#2a2418" stroke-width="2"/>
	<g fill="#2a2418">
		<circle cx="240" cy="70" r="8"/>
		<circle cx="300" cy="220" r="8"/>
		<circle cx="390" cy="250" r="8"/>
	</g>
	<circle cx="390" cy="110" r="14" fill="#c0392b" stroke="#2a2418" stroke-width="2"/>
	<path d="M383 103L397 117M397 103L383 117" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
	<g fill="#d9c9a0" stroke="#2a2418" stroke-width="2">
		<path d="M34 290H86L80 330H40Z"/>
		<path d="M124 290H176L170 330H130Z"/>
		<path d="M274 290H326L320 330H280Z"/>
		<path d="M364 290H416L410 330H370Z"/>
	</g>
	<g font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="#2a2418">
		<text x="60" y="318">1</text>
		<text x="150" y="318">2</text>
		<text x="300" y="318">3</text>
		<text x="390" y="318">4</text>
	</g>
</svg>
```

방 17: 같은 색 문을 연속으로 지날 수 없다. 갈 수 있는 길은 입구 → A → D → 출구 2 하나뿐이다(빨강 R / 파랑 B).

`public/puzzles/room-17-doors.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" width="480" height="270">
	<rect width="480" height="270" fill="#f4ead0"/>
	<g stroke-width="6" stroke-linecap="round">
		<line x1="50" y1="135" x2="170" y2="65" stroke="#c0392b"/>
		<line x1="50" y1="135" x2="170" y2="205" stroke="#2f6db5"/>
		<line x1="170" y1="65" x2="300" y2="30" stroke="#c0392b"/>
		<line x1="170" y1="65" x2="300" y2="120" stroke="#2f6db5"/>
		<line x1="170" y1="205" x2="300" y2="120" stroke="#2f6db5"/>
		<line x1="170" y1="205" x2="300" y2="220" stroke="#c0392b"/>
		<line x1="300" y1="30" x2="430" y2="50" stroke="#2f6db5"/>
		<line x1="300" y1="120" x2="430" y2="50" stroke="#2f6db5"/>
		<line x1="300" y1="120" x2="430" y2="135" stroke="#c0392b"/>
		<line x1="300" y1="220" x2="430" y2="220" stroke="#c0392b"/>
	</g>
	<g font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="#2a2418" stroke="#f4ead0" stroke-width="3" paint-order="stroke">
		<text x="110" y="104">빨강</text>
		<text x="110" y="174">파랑</text>
		<text x="235" y="44">빨강</text>
		<text x="235" y="96">파랑</text>
		<text x="235" y="166">파랑</text>
		<text x="235" y="216">빨강</text>
		<text x="365" y="38">파랑</text>
		<text x="365" y="82">파랑</text>
		<text x="365" y="124">빨강</text>
		<text x="365" y="216">빨강</text>
	</g>
	<g fill="#f4ead0" stroke="#2a2418" stroke-width="2">
		<circle cx="50" cy="135" r="20"/>
		<circle cx="170" cy="65" r="14"/>
		<circle cx="170" cy="205" r="14"/>
		<circle cx="300" cy="30" r="14"/>
		<circle cx="300" cy="120" r="14"/>
		<circle cx="300" cy="220" r="14"/>
	</g>
	<g fill="#e8c9a0" stroke="#2a2418" stroke-width="2">
		<circle cx="430" cy="50" r="18"/>
		<circle cx="430" cy="135" r="18"/>
		<circle cx="430" cy="220" r="18"/>
	</g>
	<g font-family="sans-serif" font-weight="bold" text-anchor="middle" fill="#2a2418">
		<text x="50" y="139" font-size="12">입구</text>
		<text x="430" y="57" font-size="18">1</text>
		<text x="430" y="142" font-size="18">2</text>
		<text x="430" y="227" font-size="18">3</text>
	</g>
</svg>
```

- [ ] **Step 6: 테스트 통과와 눈으로 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-assets.test.ts`
Expected: PASS (4 tests).
각 SVG를 브라우저로 열어 확인한다. 아래 파일 4개를 하나씩 Browser pane으로 연다(예: `mcp__Claude_Browser__preview_start`의 `url`에 `file:///Volumes/extend/projects/escape-room/public/puzzles/room-13-keys.svg`) 또는 `pnpm dev` 후 `http://localhost:3000/puzzles/room-13-keys.svg`.
확인 기준:
- `room-20-owl.svg`: 소년 둘, 올빼미 셋, 치수선 `170`, `110`, `?`가 겹치지 않고 보인다.
- `room-13-keys.svg`: 자물쇠 구멍 윤곽이 열쇠 C와 이빨 길이(길게-짧게-더 길게-짧게)가 같고, 다른 세 열쇠와는 다르다.
- `room-8-pipes.svg`: 점 3개, 다리(∩) 1개, 빨간 ✕ 밸브, 통 번호 1~4가 보인다.
- `room-17-doors.svg`: 선 색과 "빨강/파랑" 글자가 일치하고 출구 1·2·3이 보인다.

- [ ] **Step 7: 커밋**

```bash
git add public/puzzles src/__tests__/puzzle-assets.test.ts
git commit -m "feat: add owl, keys, pipes and doors puzzle illustrations"
```

---

### Task 9: 만화 컷 SVG 5종 (방 11)

**Files:**
- Create: `public/puzzles/room-11-a.svg`, `room-11-b.svg`, `room-11-c.svg`, `room-11-d.svg`, `room-11-e.svg`
- Modify: `src/__tests__/puzzle-assets.test.ts`

**Interfaces:**
- Produces: 컷 이미지 5개. 이야기 순서는 **C → A → E → B → D**이고 파일 이름의 글자는 순서를 암시하지 않도록 섞었다. Task 13의 방 11 데이터가 `tiles: ['C','A','E','B','D']`와 `tileImages`로 참조한다.
  - C: 편지가 문 밑으로 들어온다 → A: 하인이 편지를 줍는다 → E: 편지를 읽고 놀란다 → B: 열쇠를 들고 달린다 → D: 문을 연다.

- [ ] **Step 1: 테스트에 컷 파일 추가(실패 확인)**

`src/__tests__/puzzle-assets.test.ts`의 `EXPECTED` 배열에 5개를 추가한다:

```ts
	'room-11-a.svg',
	'room-11-b.svg',
	'room-11-c.svg',
	'room-11-d.svg',
	'room-11-e.svg',
```

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-assets.test.ts`
Expected: FAIL (새 5개 `... is missing`).

- [ ] **Step 2: 컷 C(1번째) — 편지가 문 밑으로 들어온다**

`public/puzzles/room-11-c.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
	<rect width="160" height="120" fill="#f1e6c8" stroke="#2a2418" stroke-width="3"/>
	<line x1="0" y1="100" x2="160" y2="100" stroke="#2a2418" stroke-width="2"/>
	<rect x="104" y="28" width="40" height="72" fill="#8a6d3b" stroke="#2a2418" stroke-width="2"/>
	<circle cx="112" cy="66" r="3" fill="#c9a24b"/>
	<rect x="84" y="93" width="22" height="7" fill="#ffffff" stroke="#2a2418" stroke-width="1.5"/>
	<line x1="72" y1="95" x2="80" y2="95" stroke="#2a2418" stroke-width="1.5"/>
	<line x1="68" y1="99" x2="80" y2="99" stroke="#2a2418" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 3: 컷 A(2번째) — 하인이 편지를 줍는다**

`public/puzzles/room-11-a.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
	<rect width="160" height="120" fill="#f1e6c8" stroke="#2a2418" stroke-width="3"/>
	<line x1="0" y1="100" x2="160" y2="100" stroke="#2a2418" stroke-width="2"/>
	<rect x="104" y="28" width="40" height="72" fill="#8a6d3b" stroke="#2a2418" stroke-width="2"/>
	<circle cx="112" cy="66" r="3" fill="#c9a24b"/>
	<g stroke="#2a2418" stroke-width="3" stroke-linecap="round" fill="none">
		<circle cx="50" cy="42" r="9" fill="#e8c9a0"/>
		<line x1="50" y1="51" x2="52" y2="78"/>
		<line x1="52" y1="78" x2="42" y2="100"/>
		<line x1="52" y1="78" x2="62" y2="100"/>
		<line x1="50" y1="58" x2="68" y2="90"/>
	</g>
	<rect x="64" y="90" width="22" height="7" fill="#ffffff" stroke="#2a2418" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 4: 컷 E(3번째) — 편지를 읽고 놀란다**

`public/puzzles/room-11-e.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
	<rect width="160" height="120" fill="#f1e6c8" stroke="#2a2418" stroke-width="3"/>
	<line x1="0" y1="100" x2="160" y2="100" stroke="#2a2418" stroke-width="2"/>
	<rect x="104" y="28" width="40" height="72" fill="#8a6d3b" stroke="#2a2418" stroke-width="2"/>
	<circle cx="112" cy="66" r="3" fill="#c9a24b"/>
	<g stroke="#2a2418" stroke-width="3" stroke-linecap="round" fill="none">
		<circle cx="60" cy="42" r="9" fill="#e8c9a0"/>
		<line x1="60" y1="51" x2="60" y2="78"/>
		<line x1="60" y1="78" x2="52" y2="100"/>
		<line x1="60" y1="78" x2="68" y2="100"/>
		<line x1="60" y1="58" x2="50" y2="68"/>
		<line x1="60" y1="58" x2="70" y2="68"/>
	</g>
	<circle cx="56" cy="40" r="1.8" fill="#2a2418"/>
	<circle cx="64" cy="40" r="1.8" fill="#2a2418"/>
	<rect x="48" y="62" width="24" height="14" fill="#ffffff" stroke="#2a2418" stroke-width="1.5"/>
	<text x="60" y="24" font-size="22" font-weight="bold" font-family="sans-serif" text-anchor="middle" fill="#c0392b">!</text>
</svg>
```

- [ ] **Step 5: 컷 B(4번째) — 열쇠를 들고 달린다**

`public/puzzles/room-11-b.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
	<rect width="160" height="120" fill="#f1e6c8" stroke="#2a2418" stroke-width="3"/>
	<line x1="0" y1="100" x2="160" y2="100" stroke="#2a2418" stroke-width="2"/>
	<rect x="104" y="28" width="40" height="72" fill="#8a6d3b" stroke="#2a2418" stroke-width="2"/>
	<circle cx="112" cy="66" r="3" fill="#c9a24b"/>
	<g stroke="#2a2418" stroke-width="3" stroke-linecap="round" fill="none">
		<circle cx="62" cy="41" r="9" fill="#e8c9a0"/>
		<line x1="60" y1="50" x2="56" y2="78"/>
		<line x1="56" y1="78" x2="44" y2="98"/>
		<line x1="56" y1="78" x2="70" y2="92"/>
		<line x1="60" y1="56" x2="76" y2="62"/>
	</g>
	<circle cx="80" cy="62" r="4" fill="#c9a24b" stroke="#2a2418" stroke-width="1.5"/>
	<line x1="84" y1="62" x2="94" y2="62" stroke="#c9a24b" stroke-width="3"/>
	<g stroke="#2a2418" stroke-width="2" stroke-linecap="round">
		<line x1="30" y1="60" x2="42" y2="60"/>
		<line x1="26" y1="72" x2="40" y2="72"/>
		<line x1="32" y1="84" x2="44" y2="84"/>
	</g>
</svg>
```

- [ ] **Step 6: 컷 D(5번째) — 문을 연다**

`public/puzzles/room-11-d.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
	<rect width="160" height="120" fill="#f1e6c8" stroke="#2a2418" stroke-width="3"/>
	<line x1="0" y1="100" x2="160" y2="100" stroke="#2a2418" stroke-width="2"/>
	<rect x="104" y="28" width="40" height="72" fill="#2a2418"/>
	<rect x="124" y="34" width="20" height="60" fill="#f6d36b" opacity="0.7"/>
	<polygon points="104,28 124,34 124,94 104,100" fill="#8a6d3b" stroke="#2a2418" stroke-width="2"/>
	<g stroke="#2a2418" stroke-width="3" stroke-linecap="round" fill="none">
		<circle cx="70" cy="42" r="9" fill="#e8c9a0"/>
		<line x1="70" y1="51" x2="70" y2="78"/>
		<line x1="70" y1="78" x2="62" y2="100"/>
		<line x1="70" y1="78" x2="78" y2="100"/>
		<line x1="70" y1="58" x2="98" y2="62"/>
	</g>
	<circle cx="100" cy="62" r="4" fill="#c9a24b" stroke="#2a2418" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 7: 통과 확인과 눈으로 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/puzzle-assets.test.ts`
Expected: PASS (9 tests).
다섯 컷을 브라우저로 열어 확인한다: C 컷에는 사람이 없고 문 아래에 편지만 있고, A는 몸을 숙여 편지를 줍고, E는 머리 위에 빨간 `!`와 편지를 든 채 서 있고, B는 열쇠를 들고 달리는 모습(속도선)이고, D는 문이 열려 빛이 새어 나온다.

- [ ] **Step 8: 커밋**

```bash
git add public/puzzles src/__tests__/puzzle-assets.test.ts
git commit -m "feat: add five comic panel illustrations for the story-order room"
```

---

### Task 10: 문항 데이터 A — 기호 수식 4방 (id 2·7·12·16)

**Files:**
- Create: `src/__tests__/helpers/public-file.ts`
- Create: `src/__tests__/helpers/hangul.ts`
- Create: `src/lib/visual-rooms/symbol-rooms.ts`
- Test: `src/__tests__/visual-rooms-symbol.test.ts`

**Interfaces:**
- Consumes: `symRow`(Task 2), `Room`, `validateRoom`.
- Produces: `symbolRooms: Room[]`(id 2, 7, 12, 16 순). 테스트 헬퍼 `publicFileExists(p: string): boolean`, `initialOf(syllable: string): string`, `countJamo(word: string, jamo: string): number`.

- [ ] **Step 1: 헬퍼 작성**

`src/__tests__/helpers/public-file.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';

export const publicFileExists = (publicPath: string): boolean =>
	fs.existsSync(path.join(process.cwd(), 'public', publicPath));
```

`src/__tests__/helpers/hangul.ts`:

```ts
const INITIALS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

const decompose = (syllable: string) => {
	const code = syllable.charCodeAt(0) - 0xac00;
	if (code < 0 || code > 11171) return null;
	return { initial: INITIALS[Math.floor(code / 588)], final: FINALS[code % 28] };
};

export const initialOf = (syllable: string): string =>
	decompose(syllable)?.initial ?? '';

export const countJamo = (word: string, jamo: string): number =>
	[...word].reduce((total, syllable) => {
		const parts = decompose(syllable);
		if (!parts) return total;
		return total + (parts.initial === jamo ? 1 : 0) + (parts.final === jamo ? 1 : 0);
	}, 0);
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/__tests__/visual-rooms-symbol.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { symbolRooms } from '@/lib/visual-rooms/symbol-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { countJamo } from './helpers/hangul';
import { Room, SymbolRow } from '@/types/room';

const byId = (id: number): Room => {
	const room = symbolRooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

const rowsOf = (room: Room): SymbolRow[] => {
	assert.equal(room.visual?.kind, 'symbol-rows');
	return room.visual?.kind === 'symbol-rows' ? room.visual.rows : [];
};

test('symbol rooms: ids 2, 7, 12, 16 and all pass validateRoom', () => {
	assert.deepEqual(symbolRooms.map(r => r.id), [2, 7, 12, 16]);
	for (const room of symbolRooms) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), []);
		assert.equal(room.variants, undefined);
		assert.equal(room.inputType, 'number');
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 2: the emoji equations resolve to the stored answer', () => {
	const rows = rowsOf(byId(2));
	const glyphs = [...new Set(rows.flatMap(r => r.items.map(i => i.glyph).filter(Boolean)))] as string[];
	const evaluate = (row: SymbolRow, values: Record<string, number>): number => {
		// × binds tighter than +
		const terms: number[] = [];
		let pendingMultiply = false;
		let sum = 0;
		let current: number | null = null;
		for (const item of row.items) {
			if (item.glyph) {
				const v = values[item.glyph];
				if (pendingMultiply && current !== null) {
					current *= v;
					pendingMultiply = false;
				} else {
					if (current !== null) terms.push(current);
					current = v;
				}
			} else if (item.op === '×') pendingMultiply = true;
		}
		if (current !== null) terms.push(current);
		for (const t of terms) sum += t;
		return sum;
	};
	const solutions: Record<string, number>[] = [];
	const limit = 20;
	const search = (index: number, values: Record<string, number>) => {
		if (index === glyphs.length) {
			const ok = rows.filter(r => r.value !== undefined).every(r => evaluate(r, values) === Number(r.value));
			if (ok) solutions.push({ ...values });
			return;
		}
		for (let v = 1; v <= limit; v++) search(index + 1, { ...values, [glyphs[index]]: v });
	};
	search(0, {});
	assert.equal(solutions.length, 1, 'equations must have a unique solution');
	const question = rows.find(r => r.value === undefined)!;
	assert.equal(String(evaluate(question, solutions[0])), byId(2).answer);
});

test('room 7: rainbow colors map to digits consistently and the question row matches', () => {
	const rows = rowsOf(byId(7));
	const digitOf: Record<string, string> = {};
	for (const row of rows.filter(r => r.value !== undefined)) {
		const colors = row.items.map(i => i.color!);
		assert.equal(colors.length, row.value!.length);
		colors.forEach((color, index) => {
			const digit = row.value![index];
			assert.ok(digitOf[color] === undefined || digitOf[color] === digit, `inconsistent ${color}`);
			digitOf[color] = digit;
		});
	}
	const question = rows.find(r => r.value === undefined)!;
	assert.equal(question.items.map(i => digitOf[i.color!]).join(''), byId(7).answer);
});

test('room 12: clock arithmetic wraps at 12 and the question row matches', () => {
	const rows = rowsOf(byId(12));
	const visual = byId(12).visual;
	assert.equal(visual?.kind === 'symbol-rows' ? visual.background : undefined, 'clock');
	const clockSum = (row: SymbolRow) => {
		const [a, b] = row.items.filter(i => i.glyph).map(i => Number(i.glyph));
		return ((a + b - 1) % 12) + 1;
	};
	for (const row of rows.filter(r => r.value !== undefined)) {
		assert.equal(clockSum(row), Number(row.value));
	}
	assert.equal(String(clockSum(rows.find(r => r.value === undefined)!)), byId(12).answer);
});

test('room 16: each word value equals its count of ㅇ and the question matches', () => {
	const rows = rowsOf(byId(16));
	for (const row of rows.filter(r => r.value !== undefined)) {
		assert.equal(countJamo(row.items[0].glyph!, 'ㅇ'), Number(row.value), row.items[0].glyph);
	}
	const question = rows.find(r => r.value === undefined)!;
	assert.equal(String(countJamo(question.items[0].glyph!, 'ㅇ')), byId(16).answer);
});
```

- [ ] **Step 3: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-symbol.test.ts`
Expected: FAIL (`Cannot find module '@/lib/visual-rooms/symbol-rooms'`).

- [ ] **Step 4: 데이터 작성**

`src/lib/visual-rooms/symbol-rooms.ts`:

```ts
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
				symRow([{ color: RED }, { color: YELLOW }, { color: BLUE }], '135'),
				symRow([{ color: ORANGE }, { color: GREEN }, { color: RED }], '241'),
				symRow([{ color: YELLOW }, { color: ORANGE }, { color: BLUE }], '325'),
				symRow([{ color: GREEN }, { color: BLUE }, { color: RED }, { color: ORANGE }]),
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
```

- [ ] **Step 5: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-symbol.test.ts`
Expected: PASS (5 tests). 방 2의 유일해 검사에서 실패하면 수식 값을 점검한다(🕯️=4, 🔔=5, 🕰️=3, 답 19).
Run: `pnpm exec prettier --write src/lib/visual-rooms/symbol-rooms.ts src/__tests__/helpers src/__tests__/visual-rooms-symbol.test.ts`

- [ ] **Step 6: 커밋**

```bash
git add src/lib/visual-rooms/symbol-rooms.ts src/__tests__
git commit -m "feat: add symbol-rows sample rooms 2, 7, 12 and 16"
```

---

### Task 11: 문항 데이터 B — 격자 5방 (id 4·23·26·27·29)

**Files:**
- Create: `src/lib/visual-rooms/grid-rooms.ts`
- Test: `src/__tests__/visual-rooms-grid.test.ts`

**Interfaces:**
- Consumes: `Room`, `GridCell`, `validateRoom`, 테스트 헬퍼(Task 10).
- Produces: `gridRooms: Room[]`(id 4, 23, 26, 27, 29 순).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/visual-rooms-grid.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { gridRooms } from '@/lib/visual-rooms/grid-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { initialOf } from './helpers/hangul';
import { GridCell, Room } from '@/types/room';

const byId = (id: number): Room => {
	const room = gridRooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

const gridOf = (room: Room): { rows: GridCell[][]; caption?: string } => {
	assert.equal(room.visual?.kind, 'grid');
	if (room.visual?.kind !== 'grid') throw new Error('not a grid');
	return { rows: room.visual.rows, caption: room.visual.caption };
};

const highlightedInReadingOrder = (rows: GridCell[][]): string[] =>
	rows.flat().filter(c => c.mark === 'highlight').map(c => c.text ?? '');

test('grid rooms: ids 4, 23, 26, 27, 29 and all pass validateRoom', () => {
	assert.deepEqual(gridRooms.map(r => r.id), [4, 23, 26, 27, 29]);
	for (const room of gridRooms) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), []);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 4: the answer takes one grid syllable per initial in the caption, in order', () => {
	const { rows, caption } = gridOf(byId(4));
	const wanted = (caption ?? '').match(/[ㄱ-ㅎ]/g) ?? [];
	const answer = [...byId(4).answer as string];
	assert.equal(answer.length, wanted.length);
	const syllables = rows.flat().map(c => c.text!);
	answer.forEach((syllable, index) => {
		assert.ok(syllables.includes(syllable), `${syllable} not in grid`);
		assert.equal(initialOf(syllable), wanted[index]);
	});
});

test('room 23: lit tiles read in reading order spell the answer', () => {
	const { rows } = gridOf(byId(23));
	assert.equal(highlightedInReadingOrder(rows).join(''), byId(23).answer);
});

test('room 26: right = left × (left + 1); the hidden cell equals the answer', () => {
	const { rows } = gridOf(byId(26));
	for (const [left, right] of rows) {
		const a = Number(left.text);
		if (right.mark === 'hidden') {
			assert.equal(String(a * (a + 1)), byId(26).answer);
		} else {
			assert.equal(Number(right.text), a * (a + 1));
		}
	}
});

test('room 27: fingerprint keys read in reading order give the code', () => {
	const { rows } = gridOf(byId(27));
	assert.equal(rows.length, 4);
	assert.equal(highlightedInReadingOrder(rows).join(''), byId(27).answer);
});

test('room 29: following the arrows from the lit cell collects the answer', () => {
	const { rows } = gridOf(byId(29));
	let r = rows.findIndex(row => row.some(c => c.mark === 'highlight'));
	let c = rows[r].findIndex(cell => cell.mark === 'highlight');
	const visited = new Set<string>();
	let word = '';
	for (;;) {
		const key = `${r},${c}`;
		assert.ok(!visited.has(key), 'arrow path loops');
		visited.add(key);
		const cell = rows[r][c];
		word += cell.text;
		if (!cell.arrow) break;
		if (cell.arrow === 'right') c += 1;
		if (cell.arrow === 'left') c -= 1;
		if (cell.arrow === 'down') r += 1;
		if (cell.arrow === 'up') r -= 1;
		assert.ok(rows[r]?.[c], 'arrow leaves the grid');
	}
	assert.equal(word, byId(29).answer);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-grid.test.ts`
Expected: FAIL (`Cannot find module '@/lib/visual-rooms/grid-rooms'`).

- [ ] **Step 3: 데이터 작성**

`src/lib/visual-rooms/grid-rooms.ts`:

```ts
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
			caption: '경고: 불이 켜진 타일 외에는 밟지 마라. 위에서 아래로, 왼쪽에서 오른쪽으로 읽어라.',
			rows: [
				[{ text: 'M', mark: 'highlight' }, { text: 'T' }, { text: 'A', mark: 'highlight' }],
				[{ text: 'S' }, { text: 'N', mark: 'highlight' }, { text: 'L' }],
				[{ text: 'O', mark: 'highlight' }, { text: 'D' }, { text: 'R', mark: 'highlight' }],
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
				[{ text: '5' }, { text: '30', mark: 'hidden' }],
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
				[{ text: '1' }, { text: '2' }, { text: '3', mark: 'highlight' }],
				[{ text: '4' }, { text: '5', mark: 'highlight' }, { text: '6' }],
				[{ text: '7' }, { text: '8', mark: 'highlight' }, { text: '9' }],
				[{ text: '*' }, { text: '0', mark: 'highlight' }, { text: '#' }],
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
				[{ text: '밤', arrow: 'up' }, { text: '리', arrow: 'right' }, { text: '에' }],
				[
					{ text: '문', arrow: 'right' },
					{ text: '창', arrow: 'right' },
					{ text: '불', arrow: 'up' },
				],
			],
		},
	},
];
```

- [ ] **Step 4: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-grid.test.ts`
Expected: PASS (6 tests).
Run: `pnpm exec prettier --write src/lib/visual-rooms/grid-rooms.ts src/__tests__/visual-rooms-grid.test.ts`

- [ ] **Step 5: 커밋**

```bash
git add src/lib/visual-rooms/grid-rooms.ts src/__tests__/visual-rooms-grid.test.ts
git commit -m "feat: add grid sample rooms 4, 23, 26, 27 and 29"
```

---

### Task 12: 문항 데이터 C — 쪽지·진술·행렬 5방 (id 14·28·25·15·22)

**Files:**
- Create: `src/lib/visual-rooms/note-rooms.ts`
- Create: `src/lib/visual-rooms/statement-rooms.ts`
- Create: `src/lib/visual-rooms/shape-rooms.ts`
- Test: `src/__tests__/visual-rooms-logic.test.ts`

**Interfaces:**
- Consumes: `shapeCell`(Task 2), `validateRoom`, 헬퍼.
- Produces: `noteRooms: Room[]`(id 14, 28, 25), `statementRooms: Room[]`(id 15), `shapeRooms: Room[]`(id 22).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/visual-rooms-logic.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { noteRooms } from '@/lib/visual-rooms/note-rooms';
import { statementRooms } from '@/lib/visual-rooms/statement-rooms';
import { shapeRooms } from '@/lib/visual-rooms/shape-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { Room, ShapeCell } from '@/types/room';

const find = (rooms: Room[], id: number): Room => {
	const room = rooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

const noteLines = (room: Room): string[] => {
	assert.equal(room.visual?.kind, 'note');
	return room.visual?.kind === 'note' ? room.visual.lines : [];
};

test('rooms 14, 28, 25, 15, 22 pass validateRoom and carry no variants', () => {
	assert.deepEqual(noteRooms.map(r => r.id), [14, 28, 25]);
	assert.deepEqual(statementRooms.map(r => r.id), [15]);
	assert.deepEqual(shapeRooms.map(r => r.id), [22]);
	for (const room of [...noteRooms, ...statementRooms, ...shapeRooms]) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), []);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 14: the first syllable of every diary line spells the answer', () => {
	const room = find(noteRooms, 14);
	const acrostic = noteLines(room).map(line => [...line][0]).join('');
	assert.equal(acrostic, room.answer);
});

test('room 28: the second syllable of every listed word spells the answer', () => {
	const room = find(noteRooms, 28);
	const picked = noteLines(room).map(word => [...word][1]).join('');
	assert.equal(picked, room.answer);
});

test('room 25: the card that beats 7 is the answer, using the stated cycle', () => {
	const room = find(noteRooms, 25);
	// rules stated in the note: 7 > 3, 3 > 9, 9 > 7
	const beats: Record<string, string> = { '7': '3', '3': '9', '9': '7' };
	const winner = Object.keys(beats).find(card => beats[card] === '7');
	assert.equal(room.answer, winner);
	assert.deepEqual(room.options?.map(o => o.value), ['3', '7', '9']);
});

test('room 15: exactly one statement is false for exactly one suspect — the answer', () => {
	const room = find(statementRooms, 15);
	assert.equal(room.visual?.kind, 'statements');
	// suspects in speaker order: 1 집사, 2 요리사, 3 정원사, 4 하녀
	const statements: ((culprit: number) => boolean)[] = [
		culprit => culprit === 3, // 집사: "범인은 정원사입니다."
		culprit => culprit !== 4, // 요리사: "범인은 하녀가 아닙니다."
		culprit => culprit === 1, // 정원사: "범인은 집사입니다."
		culprit => culprit !== 3, // 하녀: "범인은 정원사가 아닙니다."
	];
	const consistent = [1, 2, 3, 4].filter(
		culprit => statements.filter(says => !says(culprit)).length === 1,
	);
	assert.deepEqual(consistent, [1]);
	assert.equal(room.answer, '1');
	assert.deepEqual(room.options?.map(o => o.value), ['1', '2', '3', '4']);
	if (room.visual?.kind === 'statements') {
		assert.deepEqual(room.visual.speakers.map(s => s.name), ['집사', '요리사', '정원사', '하녀']);
	}
});

test('room 22: rows fix the shape, columns fix count and fill; the answer option completes the rule', () => {
	const room = find(shapeRooms, 22);
	assert.equal(room.visual?.kind, 'shape-matrix');
	if (room.visual?.kind !== 'shape-matrix') return;
	const cells = room.visual.cells;
	const rowShape = (row: number) => cells[row * 3].marks[0].shape;
	const expected = (row: number, col: number): ShapeCell => ({
		marks: ({ 0: [4], 1: [3, 5], 2: [3, 4, 5] } as Record<number, number[]>)[col].map(slot => ({
			shape: rowShape(row),
			filled: col !== 1,
			slot,
		})),
	});
	for (let index = 0; index < 8; index++) {
		assert.deepEqual(cells[index], expected(Math.floor(index / 3), index % 3), `cell ${index}`);
	}
	const missing = expected(2, 2);
	const matching = room.options!.filter(o => JSON.stringify(o.cell) === JSON.stringify(missing));
	assert.equal(matching.length, 1, 'exactly one option completes the pattern');
	assert.equal(matching[0].value, room.answer);
	assert.deepEqual(room.options!.map(o => o.value), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-logic.test.ts`
Expected: FAIL (모듈을 찾을 수 없음).

- [ ] **Step 3: 쪽지 문항 작성 (id 14, 28, 25)**

`src/lib/visual-rooms/note-rooms.ts`:

```ts
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
			lines: ['7은 3보다 강하다.', '3은 9보다 강하다.', '9는 7보다 강하다.'],
		},
	},
];
```

- [ ] **Step 4: 진술 추리 문항 작성 (id 15)**

`src/lib/visual-rooms/statement-rooms.ts`:

```ts
import 'server-only';
import { Room } from '@/types/room';

export const statementRooms: Room[] = [
	{
		id: 15,
		title: '정원사의 알리바이',
		question:
			'[저택의 기록]\n열쇠를 훔친 범인은 네 사람 중 한 명이다.\n네 사람의 진술 중 단 하나만 거짓이다. 열쇠를 훔친 사람은 누구인가?',
		answer: '1',
		hint: [
			'범인이 한 명씩이라고 가정하고, 그때 거짓이 되는 진술의 개수를 세어 보세요.',
			'거짓이 정확히 하나가 되는 경우는 한 가지뿐입니다.',
		],
		type: '추리',
		difficulty: 3,
		inputType: 'choice',
		options: [
			{ value: '1', label: '집사' },
			{ value: '2', label: '요리사' },
			{ value: '3', label: '정원사' },
			{ value: '4', label: '하녀' },
		],
		visual: {
			kind: 'statements',
			speakers: [
				{ id: '1', name: '집사', says: '범인은 정원사입니다.' },
				{ id: '2', name: '요리사', says: '범인은 하녀가 아닙니다.' },
				{ id: '3', name: '정원사', says: '범인은 집사입니다.' },
				{ id: '4', name: '하녀', says: '범인은 정원사가 아닙니다.' },
			],
		},
	},
];
```

- [ ] **Step 5: 3x3 패턴 행렬 문항 작성 (id 22)**

규칙: 줄이 도형을 정한다(원, 사각형, 삼각형). 칸의 열이 개수(1, 2, 3)를 정하고, 가운데 열만 속이 빈 도형이다. 빠진 칸은 속이 찬 삼각형 3개(보기 C).

`src/lib/visual-rooms/shape-rooms.ts`:

```ts
import 'server-only';
import { shapeCell } from '@/lib/puzzle-builders';
import { Room } from '@/types/room';

export const shapeRooms: Room[] = [
	{
		id: 22,
		title: '촛대 무늬',
		question:
			'[저택의 기록]\n응접실 벽의 3x3 무늬판에서 마지막 칸이 비어 있다.\n무늬의 규칙을 찾아 빈칸에 들어갈 조각을 아래에서 고르시오.',
		answer: 'C',
		hint: [
			'줄마다 도형의 종류가 하나로 정해져 있습니다.',
			'칸마다 도형 개수가 1, 2, 3으로 늘어나고, 속이 빈 칸은 가운데 줄에만 있습니다.',
		],
		type: '도형',
		difficulty: 3,
		inputType: 'choice',
		visual: {
			kind: 'shape-matrix',
			cells: [
				shapeCell('circle', true, 1),
				shapeCell('circle', false, 2),
				shapeCell('circle', true, 3),
				shapeCell('square', true, 1),
				shapeCell('square', false, 2),
				shapeCell('square', true, 3),
				shapeCell('triangle', true, 1),
				shapeCell('triangle', false, 2),
			],
		},
		options: [
			{ value: 'A', label: 'A', cell: shapeCell('triangle', false, 3) },
			{ value: 'B', label: 'B', cell: shapeCell('triangle', true, 2) },
			{ value: 'C', label: 'C', cell: shapeCell('triangle', true, 3) },
			{ value: 'D', label: 'D', cell: shapeCell('square', true, 3) },
			{ value: 'E', label: 'E', cell: shapeCell('circle', true, 3) },
			{ value: 'F', label: 'F', cell: shapeCell('triangle', true, 1) },
			{ value: 'G', label: 'G', cell: shapeCell('diamond', true, 3) },
			{ value: 'H', label: 'H', cell: shapeCell('triangle', false, 2) },
		],
	},
];
```

- [ ] **Step 6: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-logic.test.ts`
Expected: PASS (6 tests).
Run: `pnpm exec prettier --write src/lib/visual-rooms src/__tests__/visual-rooms-logic.test.ts`

- [ ] **Step 7: 커밋**

```bash
git add src/lib/visual-rooms src/__tests__/visual-rooms-logic.test.ts
git commit -m "feat: add note, statements and shape-matrix sample rooms 14, 28, 25, 15 and 22"
```

---

### Task 13: 문항 데이터 D — 일러스트 5방 (id 20·13·8·17·11)

**Files:**
- Create: `src/lib/visual-rooms/image-rooms.ts`
- Test: `src/__tests__/visual-rooms-image.test.ts`

**Interfaces:**
- Consumes: Task 8·9의 SVG 파일 경로, `validateRoom`.
- Produces: `imageRooms: Room[]`(id 20, 13, 8, 17, 11 순).

- [ ] **Step 1: 실패하는 테스트 작성**

`src/__tests__/visual-rooms-image.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { imageRooms } from '@/lib/visual-rooms/image-rooms';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';
import { Room } from '@/types/room';

const byId = (id: number): Room => {
	const room = imageRooms.find(r => r.id === id);
	assert.ok(room, `room ${id} missing`);
	return room;
};

test('image rooms: ids 20, 13, 8, 17, 11 pass validateRoom (files exist)', () => {
	assert.deepEqual(imageRooms.map(r => r.id), [20, 13, 8, 17, 11]);
	for (const room of imageRooms) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), []);
		assert.equal(room.variants, undefined);
		assert.ok(room.question.startsWith('[저택의 기록]'));
	}
});

test('room 20: boy + owl = 170 and boy − owl = 110 give owl = 30', () => {
	const sum = 170;
	const difference = 110;
	assert.equal(String((sum - difference) / 2), byId(20).answer);
});

test('room 13: only the key whose teeth match the lock slot is the answer', () => {
	const slot = [2, 1, 3, 1];
	const keys: Record<string, number[]> = {
		A: [2, 1, 3, 2],
		B: [1, 2, 3, 1],
		C: [2, 1, 3, 1],
		D: [2, 3, 1, 1],
	};
	const matches = Object.keys(keys).filter(k => keys[k].join() === slot.join());
	assert.deepEqual(matches, [byId(13).answer]);
	assert.deepEqual(byId(13).options?.map(o => o.value), ['A', 'B', 'C', 'D']);
});

test('room 8: water reaches exactly buckets 1 and 3 in the pipe network', () => {
	// connected components of the drawing: nodes are pipe junctions, valve removes R
	const edges: [string, string][] = [
		['faucet', 'S'],
		['S', 'L1'], // left branch
		['L1', 'J'], // down the left pipe to the dot at (300,220)
		['J', 'bucket3'],
		['J', 'bucket1'], // dot connects the side pipe to bucket 1
		// right branch is blocked by the closed valve, so S–R is absent
		['R', 'bucket4'],
		['R', 'bucket2'], // side pipe joins the right pipe at its dot
		// the hop over the left pipe does not connect J and the bucket-2 pipe
	];
	const reached = new Set(['faucet']);
	let grew = true;
	while (grew) {
		grew = false;
		for (const [a, b] of edges) {
			if (reached.has(a) !== reached.has(b)) {
				reached.add(a);
				reached.add(b);
				grew = true;
			}
		}
	}
	const buckets = ['1', '2', '3', '4'].filter(n => reached.has(`bucket${n}`));
	assert.equal(buckets.join(''), byId(8).answer);
});

test('room 17: only the exit reached without repeating a door color is the answer', () => {
	type Edge = [string, string, 'R' | 'B'];
	const edges: Edge[] = [
		['S', 'A', 'R'],
		['S', 'B', 'B'],
		['A', 'C', 'R'],
		['A', 'D', 'B'],
		['B', 'D', 'B'],
		['B', 'E', 'R'],
		['C', 'X1', 'B'],
		['D', 'X1', 'B'],
		['D', 'X2', 'R'],
		['E', 'X3', 'R'],
	];
	const reachedExits = new Set<string>();
	const seen = new Set<string>();
	const walk = (node: string, last: string) => {
		const key = `${node}|${last}`;
		if (seen.has(key)) return;
		seen.add(key);
		if (node.startsWith('X')) reachedExits.add(node);
		for (const [a, b, color] of edges) {
			if (color === last) continue;
			if (a === node) walk(b, color);
			if (b === node) walk(a, color);
		}
	};
	walk('S', '-');
	assert.deepEqual([...reachedExits], ['X2']);
	assert.equal(byId(17).answer, '2');
	assert.deepEqual(byId(17).options?.map(o => o.value), ['1', '2', '3']);
});

test('room 11: tiles are in story order C, A, E, B, D and the answer is that string', () => {
	const room = byId(11);
	assert.deepEqual(room.tiles, ['C', 'A', 'E', 'B', 'D']);
	assert.equal(room.answer, 'CAEBD');
	assert.equal(room.inputType, 'tile-order');
	assert.deepEqual(Object.keys(room.tileImages ?? {}).sort(), ['A', 'B', 'C', 'D', 'E']);
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-image.test.ts`
Expected: FAIL (`Cannot find module '@/lib/visual-rooms/image-rooms'`).

- [ ] **Step 3: 데이터 작성**

`src/lib/visual-rooms/image-rooms.ts`:

```ts
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
```

- [ ] **Step 4: 통과 확인과 정리**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/visual-rooms-image.test.ts`
Expected: PASS (5 tests).
Run: `pnpm exec prettier --write src/lib/visual-rooms/image-rooms.ts src/__tests__/visual-rooms-image.test.ts`

- [ ] **Step 5: 커밋**

```bash
git add src/lib/visual-rooms/image-rooms.ts src/__tests__/visual-rooms-image.test.ts
git commit -m "feat: add illustrated sample rooms 20, 13, 8, 17 and 11"
```

---

### Task 14: 통합 — 레거시 19개 제거, `visualRooms` 합치기, 매니페스트 테스트

**Files:**
- Create: `src/lib/visual-rooms/index.ts`
- Modify: `src/lib/rooms-data.ts`
- Test: `src/__tests__/rooms-data.manifest.test.ts`

**Interfaces:**
- Consumes: Task 10~13의 `symbolRooms`, `gridRooms`, `noteRooms`, `statementRooms`, `shapeRooms`, `imageRooms`.
- Produces: `visualRooms: Room[]`(`@/lib/visual-rooms`), 그리고 id 1~120 연속·정렬된 `rooms`(`@/lib/rooms-data`).

- [ ] **Step 1: 실패하는 매니페스트 테스트 작성**

`src/__tests__/rooms-data.manifest.test.ts`:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { rooms } from '@/lib/rooms-data';
import { getRoomsForLevel } from '@/lib/room-selector';
import { validateRoom } from '@/lib/rooms-validation';
import { publicFileExists } from './helpers/public-file';

type Expectation = { id: number; kind: string; inputType: string };

const REPLACED: Expectation[] = [
	{ id: 2, kind: 'symbol-rows', inputType: 'number' },
	{ id: 7, kind: 'symbol-rows', inputType: 'number' },
	{ id: 12, kind: 'symbol-rows', inputType: 'number' },
	{ id: 16, kind: 'symbol-rows', inputType: 'number' },
	{ id: 20, kind: 'image', inputType: 'number' },
	{ id: 26, kind: 'grid', inputType: 'number' },
	{ id: 13, kind: 'image', inputType: 'choice' },
	{ id: 22, kind: 'shape-matrix', inputType: 'choice' },
	{ id: 27, kind: 'grid', inputType: 'number' },
	{ id: 8, kind: 'image', inputType: 'number' },
	{ id: 17, kind: 'image', inputType: 'choice' },
	{ id: 23, kind: 'grid', inputType: 'text' },
	{ id: 29, kind: 'grid', inputType: 'text' },
	{ id: 4, kind: 'grid', inputType: 'text' },
	{ id: 14, kind: 'note', inputType: 'text' },
	{ id: 28, kind: 'note', inputType: 'text' },
	{ id: 15, kind: 'statements', inputType: 'choice' },
	{ id: 25, kind: 'note', inputType: 'choice' },
];

test('rooms: 120 rooms, ids 1..120 contiguous and in order', () => {
	assert.equal(rooms.length, 120);
	assert.deepEqual(
		rooms.map(r => r.id),
		Array.from({ length: 120 }, (_, i) => i + 1),
	);
});

test('rooms: each level still gets exactly 30 rooms in id order', () => {
	for (const level of [1, 2, 3, 4] as const) {
		const levelRooms = getRoomsForLevel(level);
		assert.equal(levelRooms.length, 30, `level ${level}`);
		assert.deepEqual(
			levelRooms.map(r => r.id),
			Array.from({ length: 30 }, (_, i) => (level - 1) * 30 + i + 1),
		);
	}
});

for (const expected of REPLACED) {
	test(`room ${expected.id} uses the ${expected.kind} visual with ${expected.inputType} input`, () => {
		const room = rooms[expected.id - 1];
		assert.equal(room.id, expected.id);
		assert.equal(room.visual?.kind, expected.kind);
		assert.equal(room.inputType, expected.inputType);
		assert.equal(room.variants, undefined);
	});
}

test('room 11 is the image tile-order room', () => {
	const room = rooms[10];
	assert.equal(room.id, 11);
	assert.equal(room.inputType, 'tile-order');
	assert.ok(room.tileImages);
});

test('every room (legacy and new) passes validateRoom', () => {
	for (const room of rooms) {
		assert.deepEqual(validateRoom(room, { fileExists: publicFileExists }), [], `room ${room.id}`);
	}
});

test('the remaining legacy rooms are untouched text rooms (no visual)', () => {
	const replaced = new Set([...REPLACED.map(r => r.id), 11]);
	assert.equal(replaced.size, 19);
	for (const room of rooms) {
		if (!replaced.has(room.id)) assert.equal(room.visual, undefined, `room ${room.id}`);
	}
});
```

- [ ] **Step 2: 실행해 실패 확인**

Run: `TSX_TSCONFIG_PATH=tsconfig.test.json node --import tsx --test src/__tests__/rooms-data.manifest.test.ts`
Expected: FAIL (`room 2 uses the symbol-rows visual ...`: 아직 레거시 항목).

- [ ] **Step 3: `visual-rooms/index.ts` 작성**

`src/lib/visual-rooms/index.ts`:

```ts
import 'server-only';
import { Room } from '@/types/room';
import { gridRooms } from './grid-rooms';
import { imageRooms } from './image-rooms';
import { noteRooms } from './note-rooms';
import { shapeRooms } from './shape-rooms';
import { statementRooms } from './statement-rooms';
import { symbolRooms } from './symbol-rooms';

export const visualRooms: Room[] = [
	...symbolRooms,
	...gridRooms,
	...noteRooms,
	...statementRooms,
	...shapeRooms,
	...imageRooms,
];
```

- [ ] **Step 4: 레거시 19개 항목 제거 (1회성 스크립트)**

임시 스크립트를 scratchpad(`/private/tmp/claude-501/-Volumes-extend-projects-escape-room/6769de1a-6e79-41dd-bbaa-24b3abbadba9/scratchpad/remove-legacy.mjs`)에 만들고 실행한 뒤 커밋하지 않는다.

```js
import fs from 'node:fs';

const file = '/Volumes/extend/projects/escape-room/src/lib/rooms-data.ts';
const remove = new Set([2, 7, 12, 16, 20, 26, 13, 22, 27, 8, 17, 23, 29, 4, 14, 28, 15, 25, 11]);

const lines = fs.readFileSync(file, 'utf8').split('\n');
const out = [];
let removed = 0;

for (let i = 0; i < lines.length; i++) {
	const idMatch = lines[i] === '\t{' ? /^\t\tid: (\d+),$/.exec(lines[i + 1] ?? '') : null;
	if (idMatch && remove.has(Number(idMatch[1]))) {
		let end = i;
		while (lines[end] !== '\t},') end++;
		i = end;
		removed++;
		continue;
	}
	out.push(lines[i]);
}

fs.writeFileSync(file, out.join('\n'));
console.log('removed entries:', removed);
```

Run: `node /private/tmp/claude-501/-Volumes-extend-projects-escape-room/6769de1a-6e79-41dd-bbaa-24b3abbadba9/scratchpad/remove-legacy.mjs`
Expected: `removed entries: 19`.
Run: `git diff --stat src/lib/rooms-data.ts`
Expected: 삭제만 있고(추가 줄 0에 가까움) 파일 하나만 변경된다. `git diff src/lib/rooms-data.ts | grep '^+[^+]'`가 비어 있어야 한다.

- [ ] **Step 5: `rooms-data.ts` 합치기**

`src/lib/rooms-data.ts` 상단 import에 추가한다:

```ts
import { visualRooms } from '@/lib/visual-rooms';
```

파일 첫 부분의 `export const rooms: Room[] = [`를 `const legacyRooms: Room[] = [`로 바꾼다. 파일 맨 끝(배열을 닫는 `];` 다음)에 추가한다:

```ts

// Rooms rewritten as image/visual puzzles live in src/lib/visual-rooms/. They replace
// the legacy text rooms with the same ids, so the merged list is kept sorted by id:
// getRoomsForLevel and verifyAnswer index into it by position.
export const rooms: Room[] = [...legacyRooms, ...visualRooms].sort(
	(a, b) => a.id - b.id,
);
```

상단의 "Type mix guideline ..." 주석 블록 아래에 한 줄을 덧붙인다:

```ts
// Note: 19 of the Level 1 rooms were later replaced by visual puzzles (see visual-rooms/).
```

- [ ] **Step 6: 전체 테스트 통과 확인**

Run: `pnpm test`
Expected: PASS (이전 Task의 테스트 전부와 매니페스트 테스트). `Task 1`의 기준선 테스트(120개·타일 정합성)도 통과해야 한다.
Run: `pnpm exec tsc --noEmit`
Expected: 오류 없음.
Run: `pnpm exec prettier --write src/lib/visual-rooms/index.ts src/__tests__/rooms-data.manifest.test.ts`
(`rooms-data.ts`는 기존 서식을 유지하기 위해 prettier를 돌리지 않는다.)

- [ ] **Step 7: 커밋**

```bash
git add src/lib/visual-rooms/index.ts src/lib/rooms-data.ts src/__tests__/rooms-data.manifest.test.ts
git commit -m "feat: replace 19 level 1 rooms with visual puzzles"
```

---

### Task 15: 린트·빌드, 브라우저 QA, 문서 동기화

**Files:**
- Modify: `docs/superpowers/specs/2026-10-11-image-puzzle-framework-design.md`
- (코드 수정은 QA에서 발견된 결함이 있을 때만)

**Interfaces:**
- Consumes: 모든 이전 Task의 산출물.
- Produces: 통과한 `pnpm lint`/`pnpm build`/`pnpm test`와 방 19개의 수동 확인 결과.

- [ ] **Step 1: 린트·빌드·테스트**

Run: `pnpm lint`
Expected: 오류 0. (기존에 있던 경고는 허용, 새 경고는 고친다.)
Run: `pnpm build`
Expected: 빌드 성공. `Type error`가 나오면 해당 파일을 수정한다.
Run: `pnpm test`
Expected: 전체 PASS.

- [ ] **Step 2: dev 서버 시작과 진입 설정**

`mcp__Claude_Browser__preview_start`에 `{name: "dev"}`로 시작한다(`.claude/launch.json`의 `dev` 설정 사용). 서버는 Bash로 직접 띄우지 않는다. 시작 후 `read_console_messages`와 `preview_logs`에 오류가 없는지 본다.

방에 직접 들어가려면 레벨 쿠키와 localStorage를 설정한다. `mcp__Claude_Browser__javascript_tool`로 아래를 실행한다(플레이어 이름은 테스트용 값):

```js
document.cookie = 'player_level=1; path=/';
localStorage.setItem('playerName', 'qa-tester');
localStorage.setItem('playerKey', 'qa-tester');
localStorage.setItem('startTime', new Date().toISOString());
localStorage.setItem('currentRoom', '2');
location.href = '/escape/2';
```

- [ ] **Step 3: 방별 수동 확인표**

방마다 `localStorage.setItem('currentRoom', '<id>'); location.href = '/escape/<id>'`로 이동하고, 아래 입력으로 **정답 처리**와 **오답 처리**(임의의 틀린 값 또는 다른 보기)를 모두 확인한다. 정답이면 "문이 열렸습니다" 토스트와 다음 방 이동, 오답이면 "열쇠가 맞지 않습니다".

| id | 보이는 것 | 정답 입력 |
| --- | --- | --- |
| 2 | 이모지 수식 4줄 | `19` |
| 7 | 색 등불 4줄 | `4512` |
| 12 | 시계판 배경 위 수식 4줄 | `5` |
| 16 | 낱말=숫자 4줄 | `3` |
| 20 | 올빼미 일러스트 | `30` |
| 26 | 5x2 숫자표, 마지막 칸 `?` | `30` |
| 13 | 자물쇠와 열쇠 + 보기 4개 | 카드 `열쇠 C` 선택 후 확인 |
| 22 | 3x3 도형 8칸 + `?` + 보기 8개 | 카드 `C` 선택 |
| 27 | 4x3 키패드, 4칸 반짝임 | `3580` |
| 8 | 수도관 일러스트 | `13` |
| 17 | 문 지도 + 보기 3개 | 카드 `출구 2` 선택 |
| 23 | 3x3 글자, 5칸 반짝임, 경고문 | `MANOR` |
| 29 | 3x3 화살표 글자, 출발 칸 반짝임 | `샹들리에` |
| 4 | 3x3 글자 + `ㄱ ㅁ ㅈ = ?` | `거미줄` |
| 14 | 일기장 쪽지 4줄 | `비밀서재` |
| 28 | 낱말 목록 3줄 | `지하실` |
| 15 | 진술 4개 + 보기 4개 | 카드 `집사` 선택 |
| 25 | 카드 규칙 3줄 + 보기 3개 | 카드 `카드 9` 선택 |
| 11 | 컷 5장 섞임 | 이야기 순서(편지 도착 → 줍기 → 놀람 → 달리기 → 문 열기)대로 탭 |

추가 확인:
- 보기형 방(13·22·17·15·25)에서 **아무것도 선택하지 않고 확인**을 눌러도 오류 없이 "열쇠가 맞지 않습니다"만 나오는지.
- 보기 선택 후 다음 방으로 넘어갔을 때 선택이 남아 있지 않은지(방 13 → 14 정답 이동, 방 22 → 23 등).
- 방 11에서 `다시 섞기`로 선택이 초기화되고, 같은 컷을 두 번 누를 수 없는지.
- 힌트 버튼이 기존처럼 최대 3회 공용으로 동작하는지(방 2에서 힌트 사용 → 남은 횟수 감소).
- `resize_window`의 `mobile` 프리셋(375폭)에서 가로 스크롤이 없고, 보기 카드와 컷 이미지가 화면 안에 들어오는지. 확인 후 `desktop` 프리셋으로 되돌린다.
- 대표 화면은 `computer`의 `screenshot`으로 확보한다(방 2, 13, 22, 11).

- [ ] **Step 4: 클라이언트 페이로드에 정답이 없는지 확인**

`/escape/13` 페이지를 연 상태에서 `mcp__Claude_Browser__javascript_tool`로 실행한다:

```js
const html = document.documentElement.outerHTML;
({
  hasAnswerKey: /"answer"\s*:/.test(html),
  hasVariantsKey: /"variants"\s*:/.test(html),
})
```

Expected: 두 값 모두 `false`. `read_network_requests`로 RSC 응답(`?_rsc=`)을 열어도 `"answer"` 문자열이 없어야 한다.

- [ ] **Step 5: 결함 수정 (있을 때만)**

QA에서 결함을 찾으면 Task 번호와 함께 최소 수정하고, 관련 단위 테스트를 먼저 추가한 뒤 `pnpm test`, `pnpm lint`, `pnpm build`를 다시 통과시킨다. 수정은 `fix:` 접두 커밋으로 남긴다.

- [ ] **Step 6: 스펙 문서 동기화**

`docs/superpowers/specs/2026-10-11-image-puzzle-framework-design.md`를 구현과 맞춘다.
- 섹션 1의 `ShapeCell` 도형 이름 목록에서 `'heart' | 'star'`를 제거한다(구현은 `circle | square | triangle | diamond`).
- 섹션 2 표의 `PuzzleVisual.tsx`를 `PuzzleVisualView.tsx`로 바꾼다.
- 섹션 6 검증의 첫 항목을 다음으로 교체한다: "자동 검증은 `pnpm test`(`node:test` + `tsx`, `src/__tests__/`)로 한다. `validateRoom` 정합성 검사, `toClientRoom`의 정답 비노출, 렌더러 정적 마크업, 방별 퍼즐 논리(수식 유일해, 아크로스틱, 진술 추리, 화살표 경로 등)를 포함한다."

- [ ] **Step 7: 최종 커밋**

```bash
git add docs/superpowers/specs/2026-10-11-image-puzzle-framework-design.md
git commit -m "docs: sync image puzzle spec with implementation"
```

QA에서 코드를 고쳤다면 해당 파일도 같은 커밋 또는 별도 `fix:` 커밋에 포함한다.

---

## Self-Review

**1. Spec coverage**

- 목표 1(필드 `visual`/`options`): Task 2. 목표 2(6종 렌더러): Task 4·5·6. 목표 3(`choice` UI): Task 7. 목표 4(이미지 타일): Task 7(+ Task 9 자산, Task 13 데이터). 목표 5(19개 방 교체): Task 10~14. 목표 6(정답 비노출): Task 3(+ Task 15 Step 4).
- 섹션 3 서버 흐름(`page.tsx` 정제): Task 3. 섹션 4 교체 표 19행: Task 10(2·7·12·16), 11(4·23·26·27·29), 12(14·28·25·15·22), 13(20·13·8·17·11)로 19개 모두 대응. 섹션 5 오류 처리: 알 수 없는 kind(Task 6), 이미지 로드 실패는 `next/image`가 `alt`를 노출하는 기본 동작, 빈 선택 제출은 Review Focus와 Task 15 수동 확인. 섹션 6 검증: Task 15(스펙 문서 동기화 포함).
- 갭 확인: 스펙의 "이미지 로드 실패 시 alt가 보이게 한다"는 별도 코드 없이 `<img alt>` 기본 동작에 의존한다(Task 4 `ImageVisual`, Task 7).

**2. Placeholder scan:** TBD/TODO/"적절한 오류 처리" 같은 표현 없음. 모든 코드 스텝에 실제 코드가 있다. Task 14 Step 4의 스크립트는 scratchpad 임시 파일이며 커밋하지 않는다고 명시했다.

**3. Type consistency:** `symRow`/`shapeCell`/`validateRoom`/`toClientRoom`/`ShapeCellView`/`PuzzleVisualView`/`ChoiceInput` 이름과 시그니처가 Task 간에 일치한다. 데이터 모듈 export 이름(`symbolRooms`, `gridRooms`, `noteRooms`, `statementRooms`, `shapeRooms`, `imageRooms`)이 Task 10~14에서 일치한다. 방 11 타일 순서 `['C','A','E','B','D']`와 정답 `CAEBD`, SVG 파일명(`room-11-c` = 1번째 컷)이 Task 9·13에서 일치한다. `GridVisual`은 `rows`/`caption`, `SymbolRowsVisual`은 `rows`/`background`로 Task 5와 Task 6 디스패처가 같다.

**4. Review Focus:** 위 6줄 각각에 대응 Task를 명시했다. `rooms` 정렬과 레벨별 30개는 Task 14 매니페스트 테스트, 정답 비노출은 Task 3 테스트, 알 수 없는 kind는 Task 6 테스트, 보기 미선택·방 전환 시 선택 초기화는 Task 7 구현과 Task 15 수동 확인이다.
