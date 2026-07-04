# Level System & Puzzle Content Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `AgeGroup` ('teen'/'adult'/'senior') concept with a `Level` (1|2|3|4) system mapped directly from age decade (10s=1, 20s=2, 30s=3, 40s+=4), add a new tap-to-order "tile-order" puzzle input type, and rewrite all 120 puzzle questions (30 per level) with school-grade-calibrated difficulty and varied puzzle types (arithmetic, observation, cipher, deduction, tile-order, nonsense, geometry), themed to match the existing "Gothic Antique Mystery" mansion UI.

**Architecture:** This is a full-stack small-scope type rename (`AgeGroup`→`Level`) touching 9 files, one new small client component (`TileOrderInput`), and a full content rewrite of `rooms-data.ts` (120 puzzle objects). No changes to scoring, hint, or session-persistence logic beyond the field rename.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Zustand (unaffected), Server Actions.

**No automated test harness exists in this repo** (confirmed in `AGENTS.md`). Verification is `pnpm lint` / `pnpm build` plus manual browser checks via `pnpm dev`, and manual re-derivation of puzzle answers for correctness (matching the approach used in the earlier puzzle-content review).

---

### Task 1: Replace `AgeGroup` type with `Level` in shared types

**Files:**
- Modify: `src/types/room.ts`
- Modify: `src/types/session.ts`

- [ ] **Step 1: Update `src/types/room.ts`**

Replace the entire file contents with:

```ts
export type Level = 1 | 2 | 3 | 4;

export interface Room {
	id: number;
	title: string;
	type: string;
	question: string;
	answer: string | string[];
	hint: string | string[];
	difficulty: number;
	inputType?: 'text' | 'number' | 'password' | 'choice' | 'combo-lock' | 'tile-order';
	comboLength?: number;
	tiles?: string[];
}

export interface GameState {
	currentRoom: number;
	hintsRemaining: number;
	hintsUsed: number;
	completedRooms: number[];
	playerName: string;
	playerGender?: string;
	playerAge?: number;
	level?: Level;
	startTime?: Date;
	endTime?: Date;
	host: string;
	userAgent: string;
	platform: string;
}
```

- [ ] **Step 2: Update `src/types/session.ts`**

Replace:

```ts
	ageGroup?: 'teen' | 'adult' | 'senior';
```

with:

```ts
	level?: 1 | 2 | 3 | 4;
```

- [ ] **Step 3: Verify build (expected to still fail elsewhere)**

Run: `pnpm build 2>&1 | head -40`
Expected: TypeScript errors in `src/lib/age-group.ts`, `src/lib/room-selector.ts`, `src/app/actions/game.ts`, `src/app/escape/[roomId]/page.tsx`, `src/app/escape/[roomId]/RoomClient.tsx`, `src/app/start/page.tsx`, `src/app/finish/page.tsx` referencing the now-removed `AgeGroup` type. This is expected — those are fixed in Tasks 2, 4, 5, 6.

- [ ] **Step 4: Commit**

```bash
git add src/types/room.ts src/types/session.ts
git commit -m "refactor: replace AgeGroup type with Level (1-4)"
```

---

### Task 2: Rewrite `age-group.ts` and `room-selector.ts` for levels

**Files:**
- Modify: `src/lib/age-group.ts`
- Modify: `src/lib/room-selector.ts`
- Modify: `src/app/actions/game.ts`
- Modify: `src/app/escape/[roomId]/page.tsx`

- [ ] **Step 1: Replace `src/lib/age-group.ts` entirely**

```ts
import { Level } from '@/types/room';

export const getLevelFromAge = (age: number): Level => {
	if (age <= 19) return 1;
	if (age <= 29) return 2;
	if (age <= 39) return 3;
	return 4;
};

export const normalizeLevel = (value?: string | null): Level => {
	const parsed = Number(value);
	if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) {
		return parsed;
	}
	return 2;
};
```

- [ ] **Step 2: Replace `src/lib/room-selector.ts` entirely**

```ts
import { rooms } from '@/lib/rooms-data';
import { Level, Room } from '@/types/room';
import { getLevelFromAge, normalizeLevel } from '@/lib/age-group';

export const LEVEL_COOKIE_KEY = 'player_level';

export const getRoomsForLevel = (level: Level): Room[] => {
	if (level === 1) {
		return rooms.filter(room => room.id >= 1 && room.id <= 30);
	}
	if (level === 2) {
		return rooms.filter(room => room.id >= 31 && room.id <= 60);
	}
	if (level === 3) {
		return rooms.filter(room => room.id >= 61 && room.id <= 90);
	}
	return rooms.filter(room => room.id >= 91 && room.id <= 120);
};

export { getLevelFromAge, normalizeLevel };
```

- [ ] **Step 3: Update `src/app/actions/game.ts`**

Replace the entire file contents with:

```ts
'use server';

import { getRoomsForLevel } from '@/lib/room-selector';
import { Level } from '@/types/room';

export async function verifyAnswer(
  roomId: number,
  answer: string,
  level: Level = 2,
): Promise<boolean> {
  const selectedRooms = getRoomsForLevel(level);
  const room = selectedRooms[roomId - 1];
  if (!room) return false;
  
  // Normalize string: lower case and completely remove all whitespaces/spaces
  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, '');
  
  const normalizedInput = normalize(answer);
  
  if (Array.isArray(room.answer)) {
    return room.answer.some(a => normalize(a) === normalizedInput);
  }
  
  return normalize(room.answer) === normalizedInput;
}
```

- [ ] **Step 4: Update `src/app/escape/[roomId]/page.tsx`**

Replace the entire file contents with:

```tsx
import { notFound, redirect } from 'next/navigation';
import RoomClient from './RoomClient';
import { cookies } from 'next/headers';
import {
  LEVEL_COOKIE_KEY,
  getRoomsForLevel,
} from '@/lib/room-selector';
import { normalizeLevel } from '@/lib/age-group';
import { TOTAL_ROOMS } from '@/lib/constants';


interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const resolvedParams = await params;
  const parsedRoomId = parseInt(resolvedParams.roomId, 10);
  const cookieStore = await cookies();
  const level = normalizeLevel(cookieStore.get(LEVEL_COOKIE_KEY)?.value);
  const selectedRooms = getRoomsForLevel(level);
  
  if (!Number.isFinite(parsedRoomId) || parsedRoomId < 1) {
    redirect('/escape/1');
  }

  if (parsedRoomId > TOTAL_ROOMS) {
    redirect('/escape/1');
  }

  const room = selectedRooms[parsedRoomId - 1];

  if (!room) {
    notFound(); 
  }

  // Sanitize: Security measure to remove answer from client payload
  const sanitizedRoom = {
    id: room.id,
    title: room.title,
    question: room.question,
    hint: room.hint,
    type: room.type,
    difficulty: room.difficulty,
    inputType: room.inputType,
    comboLength: room.comboLength,
    tiles: room.tiles,
  };
  const isLastRoom = parsedRoomId === TOTAL_ROOMS;

  return (
    <RoomClient 
      room={sanitizedRoom} 
      roomId={parsedRoomId}
      level={level}
      isLastRoom={isLastRoom}
    />
  );
}
```

Note: `sanitizedRoom.tiles` is safe to expose to the client because it's stored in **correct answer order** but the `TileOrderInput` component (Task 3) shuffles it client-side before display — the shuffle happens after the page already sent the correct order to the browser. This mirrors the existing security posture of this file (it already omits `answer` but does send other room metadata to the client); revealing tile content isn't a regression since the tiles themselves (unshuffled letters/words) are not the secret — their *order* is, and the order is exactly what the client must not be able to trivially read off. **Because this is a real, non-trivial security gap** (a curious player could open devtools and read `tiles` in network response to get the answer instantly), fix it in Step 5 below.

- [ ] **Step 5: Fix the tile-order security gap — shuffle server-side before sending to client**

In the same file (`src/app/escape/[roomId]/page.tsx`), replace the sanitizedRoom construction to shuffle tiles before sending:

```tsx
  const shuffleTiles = (tiles: string[]): string[] => {
    const arr = [...tiles];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Sanitize: Security measure to remove answer from client payload
  const sanitizedRoom = {
    id: room.id,
    title: room.title,
    question: room.question,
    hint: room.hint,
    type: room.type,
    difficulty: room.difficulty,
    inputType: room.inputType,
    comboLength: room.comboLength,
    tiles: room.tiles ? shuffleTiles(room.tiles) : undefined,
  };
```

This means `TileOrderInput` (Task 3) receives an **already-shuffled** `tiles` array from the server and should NOT shuffle it again client-side — it just renders the tiles in the order given as tappable buttons.

- [ ] **Step 6: Verify build (still expected to fail on remaining files)**

Run: `pnpm build 2>&1 | head -40`
Expected: Remaining errors only in `src/app/escape/[roomId]/RoomClient.tsx`, `src/app/start/page.tsx`, `src/app/finish/page.tsx` (fixed in Tasks 4-6).

- [ ] **Step 7: Commit**

```bash
git add src/lib/age-group.ts src/lib/room-selector.ts src/app/actions/game.ts "src/app/escape/[roomId]/page.tsx"
git commit -m "refactor: rewrite room-selector and verifyAnswer for level-based room lookup"
```

---

### Task 3: New `TileOrderInput` component

**Files:**
- Create: `src/components/TileOrderInput.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useEffect, useState } from 'react';

interface TileOrderInputProps {
  tiles: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export default function TileOrderInput({ tiles, value, onChange, disabled }: TileOrderInputProps) {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 justify-center min-h-[2.5rem] p-3 rounded border border-[rgba(201,162,75,0.25)] bg-black/40">
        {selectedIndices.length === 0 ? (
          <span className="text-xs text-[rgba(201,162,75,0.4)]">타일을 순서대로 탭하세요...</span>
        ) : (
          selectedIndices.map((tileIndex, orderIndex) => (
            <span
              key={`selected-${orderIndex}`}
              className="antique-input px-3 py-1 text-sm"
              style={{ width: 'auto', display: 'inline-block' }}
            >
              {tiles[tileIndex]}
            </span>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {tiles.map((tile, index) => (
          <button
            key={index}
            type="button"
            disabled={disabled || selectedIndices.includes(index)}
            onClick={() => handleTap(index)}
            className="btn-antique px-4 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {tile}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleReset}
        disabled={disabled || selectedIndices.length === 0}
        className="text-[10px] text-[rgba(201,162,75,0.6)] hover:text-[#c9a24b] transition-colors self-center underline disabled:opacity-30 disabled:cursor-not-allowed"
      >
        다시 섞기
      </button>
    </div>
  );
}
```

Note: `value` prop is accepted for interface symmetry with `ComboLockInput`/text inputs but this component manages selection order via its own `selectedIndices` state (not derived from `value`), since re-deriving tile positions from a plain string would be ambiguous when tiles repeat (e.g. `"RECIPE"` has two `E` tiles). This matches how `ComboLockInput` also keeps some internal UI state independent of full recomputation from `value`.

- [ ] **Step 2: Verify component compiles**

Run: `pnpm build 2>&1 | grep -i "TileOrderInput"`
Expected: No output (no errors referencing this new file). The overall build will still fail due to `RoomClient.tsx` not yet using `Level`/this component (fixed next task).

- [ ] **Step 3: Commit**

```bash
git add src/components/TileOrderInput.tsx
git commit -m "feat: add TileOrderInput tap-to-order puzzle component"
```

---

### Task 4: Integrate `Level` and `TileOrderInput` into `RoomClient.tsx`

**Files:**
- Modify: `src/app/escape/[roomId]/RoomClient.tsx`

- [ ] **Step 1: Update imports and props interface**

Replace:

```tsx
import { AgeGroup, Room } from '@/types/room';
```

with:

```tsx
import { Level, Room } from '@/types/room';
```

Replace:

```tsx
interface RoomClientProps {
	room: Omit<Room, 'answer'>;
	roomId: number;
	ageGroup: AgeGroup;
	isLastRoom: boolean;
}
```

with:

```tsx
interface RoomClientProps {
	room: Omit<Room, 'answer'>;
	roomId: number;
	level: Level;
	isLastRoom: boolean;
}
```

Add the import for the new component near the other component imports (alongside `ComboLockInput`):

```tsx
import TileOrderInput from '@/components/TileOrderInput';
```

- [ ] **Step 2: Update the function signature**

Replace:

```tsx
export default function RoomClient({
	room,
	roomId,
	ageGroup,
	isLastRoom,
}: RoomClientProps) {
```

with:

```tsx
export default function RoomClient({
	room,
	roomId,
	level,
	isLastRoom,
}: RoomClientProps) {
```

- [ ] **Step 3: Update all `ageGroup` references to `level`**

There are three `writeSession(...)` call sites in this file (room-entry persistence, hint-consumption persistence, and last-room completion persistence) plus the `verifyAnswer` call — each currently passes `ageGroup`. In each of the three `StoredSession` payload object literals, replace the line:

```tsx
					ageGroup,
```

with:

```tsx
					level,
```

And replace the `verifyAnswer` call:

```tsx
			const isValid = await verifyAnswer(roomId, answer, ageGroup);
```

with:

```tsx
			const isValid = await verifyAnswer(roomId, answer, level);
```

- [ ] **Step 4: Render `TileOrderInput` for the new input type**

Replace:

```tsx
							{room.inputType === 'combo-lock' ? (
								<ComboLockInput
									length={room.comboLength || 4}
									value={answer}
									onChange={setAnswer}
									disabled={isSubmitting}
									onComplete={() => {}}
								/>
							) : (
```

with:

```tsx
							{room.inputType === 'combo-lock' ? (
								<ComboLockInput
									length={room.comboLength || 4}
									value={answer}
									onChange={setAnswer}
									disabled={isSubmitting}
									onComplete={() => {}}
								/>
							) : room.inputType === 'tile-order' ? (
								<TileOrderInput
									tiles={room.tiles || []}
									value={answer}
									onChange={setAnswer}
									disabled={isSubmitting}
								/>
							) : (
```

- [ ] **Step 5: Verify build**

Run: `pnpm build 2>&1 | head -40`
Expected: Remaining errors only in `src/app/start/page.tsx` and `src/app/finish/page.tsx` (fixed in Tasks 5-6). No errors referencing `RoomClient.tsx`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/escape/[roomId]/RoomClient.tsx"
git commit -m "feat: wire Level type and TileOrderInput into RoomClient"
```

---

### Task 5: Update `start/page.tsx` for level labels and level-based routing

**Files:**
- Modify: `src/app/start/page.tsx`

- [ ] **Step 1: Replace the age-group label map with level labels**

Replace:

```tsx
const AGE_GROUP_LABELS: Record<string, { label: string; desc: string; detail: string }> = {
	teen: { label: '제1관 [청소년]', desc: '난이도 01 ~ 30', detail: '저택 초입, 가벼운 수수께끼가 기다리고 있습니다.' },
	adult: { label: '제2관 [성인]', desc: '난이도 31 ~ 60', detail: '깊은 서재, 얽히고설킨 단서들을 풀어야 합니다.' },
	senior: { label: '제3관 [시니어]', desc: '난이도 61 ~ 90', detail: '오래된 지하실, 연륜과 통찰이 필요한 방입니다.' },
};
```

with:

```tsx
const LEVEL_LABELS: Record<number, { label: string; desc: string; detail: string }> = {
	1: { label: '제1관 [입문]', desc: '방 01 ~ 30', detail: '저택 초입의 가벼운 수수께끼들이 기다리고 있습니다.' },
	2: { label: '제2관 [심화]', desc: '방 31 ~ 60', detail: '서재 깊은 곳, 조금 더 얽힌 단서들을 풀어야 합니다.' },
	3: { label: '제3관 [고급]', desc: '방 61 ~ 90', detail: '지하실의 낡은 장치들이 정교한 추리를 요구합니다.' },
	4: { label: '제4관 [최상급]', desc: '방 91 ~ 120', detail: '가장 깊은 곳, 저택 최후의 진실이 기다립니다.' },
};
```

- [ ] **Step 2: Update the import**

Replace:

```tsx
import { getAgeGroupFromAge } from '@/lib/age-group';
```

with:

```tsx
import { getLevelFromAge } from '@/lib/age-group';
```

- [ ] **Step 3: Update the derived level-from-age logic**

Replace:

```tsx
	const parsedAge = parseInt(age, 10);
	const ageGroup =
		Number.isFinite(parsedAge) && parsedAge >= 8 && parsedAge <= 100
			? getAgeGroupFromAge(parsedAge)
			: null;
```

with:

```tsx
	const parsedAge = parseInt(age, 10);
	const level =
		Number.isFinite(parsedAge) && parsedAge >= 8 && parsedAge <= 100
			? getLevelFromAge(parsedAge)
			: null;
```

Replace (near the bottom of the component body, right before the `return`):

```tsx
	const ageGroupInfo = ageGroup ? AGE_GROUP_LABELS[ageGroup] : null;
```

with:

```tsx
	const levelInfo = level ? LEVEL_LABELS[level] : null;
```

And update the two JSX usages of `ageGroupInfo` to `levelInfo`:

Replace:

```tsx
							<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
						나이
						{ageGroupInfo && (
							<span className="text-[#c9a24b] font-bold animate-badge-pop">
								{ageGroupInfo.label}
							</span>
						)}
					</div>
```

with:

```tsx
							<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
						나이
						{levelInfo && (
							<span className="text-[#c9a24b] font-bold animate-badge-pop">
								{levelInfo.label}
							</span>
						)}
					</div>
```

Replace:

```tsx
					{ageGroupInfo && (
						<div className="p-3 bg-[rgba(201,162,75,0.08)] border border-[rgba(201,162,75,0.2)] text-[11px] text-[#c9a24b]/80 leading-normal flex flex-col gap-1">
							<div><strong>[안내될 방]:</strong> {ageGroupInfo.desc}</div>
							<div className="text-[#a38a4a]">{ageGroupInfo.detail}</div>
						</div>
					)}
```

with:

```tsx
					{levelInfo && (
						<div className="p-3 bg-[rgba(201,162,75,0.08)] border border-[rgba(201,162,75,0.2)] text-[11px] text-[#c9a24b]/80 leading-normal flex flex-col gap-1">
							<div><strong>[안내될 방]:</strong> {levelInfo.desc}</div>
							<div className="text-[#a38a4a]">{levelInfo.detail}</div>
						</div>
					)}
```

- [ ] **Step 4: Update `handleStart` to store/derive level instead of age group**

Replace:

```tsx
		const trimmedName = name.trim();
		const currentAgeGroup = getAgeGroupFromAge(parsedAge);
		const playerKey = `escape_${trimmedName}_${gender}_${parsedAge}`;

		try {
			await useGameStore.getState().setPlayerName(trimmedName);
			localStorage.setItem('playerName', trimmedName);
			localStorage.setItem('playerGender', gender);
			localStorage.setItem('playerAge', parsedAge.toString());
			localStorage.setItem('playerAgeGroup', currentAgeGroup);
			localStorage.setItem('playerKey', playerKey);
			document.cookie = `player_age_group=${currentAgeGroup}; path=/; max-age=2592000`;
```

with:

```tsx
		const trimmedName = name.trim();
		const currentLevel = getLevelFromAge(parsedAge);
		const playerKey = `escape_${trimmedName}_${gender}_${parsedAge}`;

		try {
			await useGameStore.getState().setPlayerName(trimmedName);
			localStorage.setItem('playerName', trimmedName);
			localStorage.setItem('playerGender', gender);
			localStorage.setItem('playerAge', parsedAge.toString());
			localStorage.setItem('playerLevel', currentLevel.toString());
			localStorage.setItem('playerKey', playerKey);
			document.cookie = `player_level=${currentLevel}; path=/; max-age=2592000`;
```

Then further down in the same function, replace the `payload` object's field:

```tsx
			const payload: StoredSession = {
				name: playerKey,
				displayName: trimmedName,
				gender,
				age: parsedAge,
				ageGroup: currentAgeGroup,
```

with:

```tsx
			const payload: StoredSession = {
				name: playerKey,
				displayName: trimmedName,
				gender,
				age: parsedAge,
				level: currentLevel,
```

- [ ] **Step 5: Update the `localStorage.getItem('playerAgeGroup')` bootstrap read**

Search the file for any remaining `playerAgeGroup` reads in the bootstrap `useEffect` (loading previously-saved values on mount). If present, replace:

```tsx
			const storedAgeGroup = localStorage.getItem('playerAgeGroup');
```

with nothing needed — this file doesn't restore an age-group-derived UI field on mount beyond what's already covered by `age`/`name`/`gender` restoration, since `levelInfo` is derived live from `age` state each render. If you find such a line while editing, simply delete it (it would be dead code after this change) rather than renaming it.

- [ ] **Step 6: Verify build**

Run: `pnpm build 2>&1 | head -40`
Expected: Remaining errors only in `src/app/finish/page.tsx` (fixed in Task 6). No errors referencing `start/page.tsx`.

- [ ] **Step 7: Manual visual check**

Run: `pnpm dev`, navigate to `/start`, enter an age in each of the four bands (e.g. 15, 25, 35, 45) and confirm the level badge shows "제1관 [입문]" / "제2관 [심화]" / "제3관 [고급]" / "제4관 [최상급]" respectively, with matching `desc`/`detail` text.

- [ ] **Step 8: Commit**

```bash
git add src/app/start/page.tsx
git commit -m "refactor: switch start page from age-group labels to level labels"
```

---

### Task 6: Update `finish/page.tsx` leaderboard display

**Files:**
- Modify: `src/app/finish/page.tsx`

- [ ] **Step 1: Update the `topUsers` state type and mapping**

Replace:

```tsx
	const [topUsers, setTopUsers] = useState<
		{ name: string; seconds: number; ageGroup?: string }[]
	>([]);
```

with:

```tsx
	const [topUsers, setTopUsers] = useState<
		{ name: string; seconds: number; level?: number }[]
	>([]);
```

Replace:

```tsx
				sessions.slice(0, 5).map(session => ({
					name: session.displayName || session.name.replace('escape_', ''),
					seconds: session.seconds ?? 0,
					ageGroup: session.ageGroup,
				})),
```

with:

```tsx
				sessions.slice(0, 5).map(session => ({
					name: session.displayName || session.name.replace('escape_', ''),
					seconds: session.seconds ?? 0,
					level: session.level,
				})),
```

- [ ] **Step 2: Update the JSX badge**

Replace:

```tsx
										{user.ageGroup && (
											<span className="text-xs text-[#a38a4a]">
												({user.ageGroup})
											</span>
										)}
```

with:

```tsx
										{user.level && (
											<span className="text-xs text-[#a38a4a]">
												({user.level}레벨)
											</span>
										)}
```

- [ ] **Step 3: Verify build**

Run: `pnpm lint && pnpm build`
Expected: Both pass cleanly. This resolves the last file referencing the old `AgeGroup`/`ageGroup` naming (aside from `rooms-data.ts` content, which doesn't reference the type — it's rewritten for content reasons in Tasks 7-10, not type reasons).

- [ ] **Step 4: Commit**

```bash
git add src/app/finish/page.tsx
git commit -m "refactor: switch finish page leaderboard badge from age group to level"
```

---

### Task 7: Rewrite `rooms-data.ts` — Level 1 (ids 1-30, upper-elementary difficulty)

**Files:**
- Modify: `src/lib/rooms-data.ts` (replace entire file; this task writes the header + Level 1 section; Tasks 8-10 append Levels 2-4)

- [ ] **Step 1: Replace the entire file with the header plus Level 1 content**

```ts
import 'server-only';
import { Room } from '@/types/room';

export const rooms: Room[] = [
	// ==========================================
	// Level 1 (10대 / 초등 고학년 수준) — 방 1~30
	// ==========================================
	{
		id: 1,
		title: '낡은 계산기',
		question: '[저택의 기록]\n지하실에서 낡은 계산기를 발견했다.\n24 + 19 = ? (숫자만 입력)',
		answer: '43',
		hint: '24+19를 계산하세요.',
		type: '연산',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 2,
		title: '촛불의 수',
		question: '[저택의 기록]\n촛대마다 촛불이 4개씩 꽂혀 있고, 촛대는 5개 있다.\n촛불은 모두 몇 개인가? (숫자만 입력)',
		answer: '20',
		hint: '4 x 5를 계산하세요.',
		type: '연산',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 3,
		title: '그림자 놀이',
		question: '[정원의 기록]\n정원 조각상의 그림자 길이는 해가 질수록 2배씩 길어진다.\n처음 그림자 길이가 3m였다면, 두 번 길어진 뒤 그림자 길이는? (숫자만 입력, m 제외)',
		answer: '12',
		hint: '3 -> 6 -> 12',
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 4,
		title: '알파벳 자리',
		question: '[서재의 기록]\n서재 책장에 A=1, B=2, C=3 규칙이 붙어 있다.\nE는 몇 번째 글자인가? (숫자만 입력)',
		answer: '5',
		hint: 'A부터 순서대로 세어보세요.',
		type: '암호',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 5,
		title: '이름표 조각',
		question: '[응접실의 기록]\n바닥에 떨어진 글자 조각 4개를 주웠다.\n올바른 순서로 탭하면 저택에서 가장 중요한 장소 이름이 된다.',
		answer: 'HOME',
		hint: '영어로 "집"을 뜻하는 4글자 단어입니다.',
		type: '타일배열',
		difficulty: 1,
		inputType: 'tile-order',
		tiles: ['H', 'O', 'M', 'E'],
	},
	{
		id: 6,
		title: '세 명의 하인',
		question: '[응접실의 기록]\n하인 세 명 중 한 명이 촛대를 깨뜨렸다.\nA: "나는 안 그랬어요."\nB: "C가 그랬어요."\nC: "B가 거짓말을 하고 있어요."\n이 중 단 한 명만 진실을 말한다면, 촛대를 깨뜨린 사람은 누구인가? (대문자 1글자)',
		answer: 'A',
		hint: '각 사람이 진실을 말한다고 하나씩 가정해보고, 모순이 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 3,
	},
	{
		id: 7,
		title: '정원의 장미',
		question: '[정원의 기록]\n장미가 6송이씩 심긴 화단이 5개 있다.\n장미는 모두 몇 송이인가? (숫자만 입력)',
		answer: '30',
		hint: '6 x 5를 계산하세요.',
		type: '연산',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 8,
		title: '액자의 둘레',
		question: '[서재의 기록]\n가로 6, 세로 3인 직사각형 액자의 둘레는? (숫자만 입력)',
		answer: '18',
		hint: '둘레 = 2 x (가로 + 세로)',
		type: '도형',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 9,
		title: '문이 아닌 문',
		question: '[복도의 기록]\n저택에는 열리지 않는 문이 하나 있다. 사실 그 문은 벽에 그려진 그림이다.\n이 문을 열려면 무엇을 해야 할까? (그림이다/열지않는다/부순다 중 입력)',
		answer: '열지않는다',
		hint: '그림은 문이 아닙니다.',
		type: '넌센스',
		difficulty: 1,
	},
	{
		id: 10,
		title: '모스 촛불',
		question: '[탑의 기록]\n촛불 신호가 짧게 셋, 길게 셋, 짧게 셋으로 반복된다.\n세계 공통 구조 신호 세 글자는 무엇인가? (대문자 3글자)',
		answer: 'SOS',
		hint: '가장 유명한 조난 신호입니다.',
		type: '암호',
		difficulty: 1,
	},
	{
		id: 11,
		title: '사건의 순서',
		question: '[복도의 기록]\n집사가 목격한 사건 조각: 비명, 발소리, 정적.\n실제 벌어진 순서대로 탭하시오.',
		answer: '발소리비명정적',
		hint: '발소리가 들리고, 비명이 들리고, 그다음 조용해졌습니다.',
		type: '타일배열',
		difficulty: 1,
		inputType: 'tile-order',
		tiles: ['발소리', '비명', '정적'],
	},
	{
		id: 12,
		title: '은촛대 무게',
		question: '[보관실의 기록]\n은촛대 하나의 무게는 250g이다.\n촛대 4개의 무게 합은? (숫자만 입력)',
		answer: '1000',
		hint: '250 x 4',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 13,
		title: '시계의 각도',
		question: '[탑의 기록]\n저택 시계가 3시 정각을 가리킨다.\n시침과 분침이 이루는 각도는? (숫자만 입력)',
		answer: '90',
		hint: '3시는 직각을 이룹니다.',
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 14,
		title: '책장의 순서',
		question: '[서재의 기록]\n책장에 A, C, E, G 순서로 책이 꽂혀 있다.\n다음에 올 알파벳은? (대문자 1글자)',
		answer: 'I',
		hint: '한 칸씩 건너뜁니다.',
		type: '암호',
		difficulty: 2,
	},
	{
		id: 15,
		title: '정원사의 알리바이',
		question: '[정원의 기록]\n정원사, 요리사, 마부 중 한 명이 온실 유리를 깼다.\n정원사: "나는 그 시간 온실에 없었다."\n요리사: "정원사는 사실을 말하고 있다."\n마부: "나는 범인이 아니다."\n이 중 딱 한 명만 거짓말을 하고 있고, 거짓말한 사람이 범인이다. 범인은 누구인가? (정원사/요리사/마부 중 입력)',
		answer: '마부',
		hint: '각자 거짓말한다고 가정했을 때 모순이 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 3,
	},
	{
		id: 16,
		title: '복도의 촛불 간격',
		question: '[복도의 기록]\n복도에 촛불이 3m 간격으로 놓여 있다. 촛불이 5개라면\n첫 촛불부터 마지막 촛불까지 거리는? (숫자만 입력)',
		answer: '12',
		hint: '간격 수는 촛불 수보다 1개 적습니다. 4간격 x 3m',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 17,
		title: '정원의 화단',
		question: '[정원의 기록]\n한 변이 5m인 정사각형 화단의 넓이는? (숫자만 입력)',
		answer: '25',
		hint: '5 x 5',
		type: '도형',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 18,
		title: '빈 방',
		question: '[다락방의 기록]\n저택에서 가장 물건이 많은 방은 사실 텅 빈 방이다.\n이 방에 가득한 것은 무엇일까? (공기/먼지/어둠 중 입력)',
		answer: '공기',
		hint: '눈에 보이지 않아도 방을 채우고 있는 것입니다.',
		type: '넌센스',
		difficulty: 1,
	},
	{
		id: 19,
		title: '편지 조각',
		question: '[서재의 기록]\n찢어진 편지 조각에 적힌 글자들.\n순서대로 탭하면 저택의 비밀을 뜻하는 단어가 된다.',
		answer: 'SECRET',
		hint: '영어로 "비밀"을 뜻하는 6글자 단어입니다.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['S', 'E', 'C', 'R', 'E', 'T'],
	},
	{
		id: 20,
		title: '하인들의 새참',
		question: '[부엌의 기록]\n빵 3개씩 담긴 바구니가 4개 있다.\n빵은 모두 몇 개인가? (숫자만 입력)',
		answer: '12',
		hint: '3 x 4',
		type: '연산',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 21,
		title: '역순 이름',
		question: '[현관의 기록]\n오래된 문패에 "ESUOH"라고 적혀 있다.\n뒤집어 읽으면 어떤 단어가 되는가? (대문자 5글자)',
		answer: 'HOUSE',
		hint: '글자를 거꾸로 읽어보세요.',
		type: '암호',
		difficulty: 2,
	},
	{
		id: 22,
		title: '촛대 무늬',
		question: '[보관실의 기록]\n촛대 3개에는 별 무늬가, 2개에는 달 무늬가 새겨져 있다.\n촛대는 모두 몇 개인가? (숫자만 입력)',
		answer: '5',
		hint: '3 + 2',
		type: '관찰',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 23,
		title: '삼각 지붕',
		question: '[탑의 기록]\n삼각형 모양 지붕 창문의 세 각의 합은 몇 도인가? (숫자만 입력)',
		answer: '180',
		hint: '삼각형 내각의 합입니다.',
		type: '도형',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 24,
		title: '숫자 계단',
		question: '[계단의 기록]\n계단에 적힌 숫자 조각들을 작은 수부터 순서대로 탭하시오.',
		answer: '12345',
		hint: '가장 작은 수부터 차례로 고르세요.',
		type: '타일배열',
		difficulty: 1,
		inputType: 'tile-order',
		tiles: ['1', '2', '3', '4', '5'],
	},
	{
		id: 25,
		title: '다락방의 열쇠',
		question: '[다락방의 기록]\n다락방 열쇠를 잃어버렸다. 하녀, 집사, 정원사 중 한 명이 가지고 있다.\n하녀: "내가 가지고 있어요."\n집사: "하녀는 거짓말을 하고 있어요."\n정원사: "나는 가지고 있지 않아요."\n이 중 딱 한 명만 진실을 말한다면, 열쇠를 가진 사람은 누구인가? (하녀/집사/정원사 중 입력)',
		answer: '정원사',
		hint: '각자 진실을 말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 3,
	},
	{
		id: 26,
		title: '초의 개수',
		question: '[보관실의 기록]\n촛대에 초가 7개씩 3줄로 꽂혀 있다.\n초는 모두 몇 개인가? (숫자만 입력)',
		answer: '21',
		hint: '7 x 3',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 27,
		title: '그림 속 숫자',
		question: '[다락방의 기록]\n벽화에 적힌 숫자 나열: 2, 4, 6, 8, ?\n다음 숫자는? (숫자만 입력)',
		answer: '10',
		hint: '짝수가 2씩 증가합니다.',
		type: '관찰',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 28,
		title: '자리 바꾸기',
		question: '[서재의 기록]\n암호 규칙: 각 알파벳을 바로 다음 알파벳으로 바꾼다.\n"HOUSE"를 이 규칙으로 암호화하면? (대문자 5글자)',
		answer: 'IPVTF',
		hint: 'H->I, O->P, U->V, S->T, E->F',
		type: '암호',
		difficulty: 3,
	},
	{
		id: 29,
		title: '정원의 오각형 분수',
		question: '[정원의 기록]\n오각형 모양 분수의 변은 몇 개인가? (숫자만 입력)',
		answer: '5',
		hint: '오각형입니다.',
		type: '도형',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 30,
		title: '최종 문장',
		question: '[응접실의 기록]\n응접실 바닥에 흩어진 문장 조각들을 순서대로 탭하시오.',
		answer: '저택에서탈출성공했다',
		hint: '주어-목적어-서술어 순서를 생각해보세요.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['저택에서', '탈출', '성공했다'],
	},
];
```

- [ ] **Step 2: Verify Level 1 file is syntactically valid**

Run: `pnpm build 2>&1 | grep -i "rooms-data"`
Expected: No output (the array is syntactically valid TypeScript, even though it currently only has 30 of the 120 rooms needed — that's fine, `getRoomsForLevel` will just return fewer/empty results for levels 2-4 until Tasks 8-10 append them; this doesn't break the build, only gameplay for those levels, which isn't tested until Task 11).

- [ ] **Step 3: Commit**

```bash
git add src/lib/rooms-data.ts
git commit -m "content: rewrite rooms-data.ts with Level 1 puzzles (ids 1-30)"
```

---

### Task 8: Append Level 2 puzzles (ids 31-60, middle-school-1st-year difficulty)

**Files:**
- Modify: `src/lib/rooms-data.ts`

- [ ] **Step 1: Insert Level 2 content immediately before the closing `];` of the `rooms` array**

Find the line `];` at the end of `src/lib/rooms-data.ts` (currently right after the id-30 object's closing `},`). Insert the following block right before that `];` line (i.e., after the id-30 entry's trailing comma, before the array closes):

```ts
	// ==========================================
	// Level 2 (20대 / 중학교 1학년 수준) — 방 31~60
	// ==========================================
	{
		id: 31,
		title: '저택 관리비',
		question: '[사무실의 기록]\n이번 달 관리비는 지난달의 1.5배이다.\n지난달 관리비가 40만원이었다면 이번 달은 얼마인가? (숫자만 입력, 만원 단위)',
		answer: '60',
		hint: '40 x 1.5',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 32,
		title: '일차식 자물쇠',
		question: '[서재의 기록]\n자물쇠 다이얼 규칙: 2x + 3 = 15.\nx의 값은? (숫자만 입력)',
		answer: '6',
		hint: '양변에서 3을 빼고 2로 나누세요.',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 33,
		title: '그림자 비율',
		question: '[탑의 기록]\n저택 첨탑의 그림자는 실제 높이의 2배로 늘어난다.\n첨탑 높이가 15m라면 그림자 길이는? (숫자만 입력)',
		answer: '30',
		hint: '15 x 2',
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 34,
		title: '시저의 열쇠',
		question: '[서재의 기록]\n암호문 "PHHW"는 알파벳을 +3 이동해 만든 것이다.\n원문은? (대문자 4글자)',
		answer: 'MEET',
		hint: '각 글자를 -3 이동하세요.',
		type: '암호',
		difficulty: 2,
	},
	{
		id: 35,
		title: '요리사의 메모',
		question: '[부엌의 기록]\n요리사가 남긴 글자 조각들을 순서대로 탭하면 "조리법"을 뜻하는 단어가 된다.',
		answer: 'RECIPE',
		hint: '요리법을 뜻하는 영어 단어입니다.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['R', 'E', 'C', 'I', 'P', 'E'],
	},
	{
		id: 36,
		title: '정원의 화분',
		question: '[정원의 기록]\n화분이 깨졌다. 세 사람 중 정확히 한 명만 진실을 말한다.\nA: "나는 안 깼다."\nB: "나도 안 깼다."\nC: "A가 깼다."\n범인은 누구인가? (A/B/C 중 입력)',
		answer: 'B',
		hint: '각자 진실이라고 가정했을 때 모순이 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 3,
	},
	{
		id: 37,
		title: '액자 비율',
		question: '[서재의 기록]\n액자의 가로세로 비율은 3:2이다.\n가로가 18cm라면 세로는 몇 cm인가? (숫자만 입력)',
		answer: '12',
		hint: '18 / 3 x 2',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 38,
		title: '복도의 마름모',
		question: '[복도의 기록]\n마름모 타일 한 변이 5cm이다.\n네 변의 길이 합(둘레)은? (숫자만 입력)',
		answer: '20',
		hint: '5 x 4',
		type: '도형',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 39,
		title: '밀 수 없는 문',
		question: '[현관의 기록]\n저택의 어떤 문은 아무리 힘을 줘도 절대 밀리지 않는다.\n문에는 "당기시오"라고 적혀 있었다.\n이 문을 여는 방법은? (민다/당긴다/부순다 중 입력)',
		answer: '당긴다',
		hint: '문에 적힌 글자를 다시 읽어보세요.',
		type: '넌센스',
		difficulty: 1,
	},
	{
		id: 40,
		title: '이진수 자물쇠',
		question: '[지하실의 기록]\n이진수 1101은 십진수로 얼마인가? (숫자만 입력)',
		answer: '13',
		hint: '8 + 4 + 0 + 1',
		type: '암호',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 41,
		title: '촛불 소모량',
		question: '[보관실의 기록]\n양초 하나가 1시간에 2cm씩 녹는다. 처음 길이가 20cm였다면\n6시간 후 남은 길이는? (숫자만 입력)',
		answer: '8',
		hint: '20 - 2 x 6',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 42,
		title: '격자 속 규칙',
		question: '[다락방의 기록]\n1, 4, 9, 16, ?\n다음 수는 무엇인가? (숫자만 입력)',
		answer: '25',
		hint: '1², 2², 3², 4², 5²',
		type: '관찰',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 43,
		title: '손님 명단',
		question: '[응접실의 기록]\n찢어진 손님 명단 조각: 백작, 자작, 남작.\n신분이 높은 순서대로 탭하시오.',
		answer: '백작자작남작',
		hint: '귀족 작위는 공작-후작-백작-자작-남작 순서입니다.',
		type: '타일배열',
		difficulty: 3,
		inputType: 'tile-order',
		tiles: ['백작', '자작', '남작'],
	},
	{
		id: 44,
		title: '서재의 도난',
		question: '[서재의 기록]\n서재에서 책이 사라졌다. 세 사람 중 정확히 한 명만 진실을 말한다.\n집사: "나는 안 가져갔다."\n하녀: "나도 안 가져갔다."\n손님: "집사가 가져갔다."\n범인은 누구인가? (집사/하녀/손님 중 입력)',
		answer: '하녀',
		hint: '각자 진실이라고 가정했을 때 모순이 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 3,
	},
	{
		id: 45,
		title: '환전 계산',
		question: '[사무실의 기록]\n1달러가 1300원일 때, 5달러는 몇 원인가? (숫자만 입력)',
		answer: '6500',
		hint: '1300 x 5',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 46,
		title: '정원 화단의 넓이',
		question: '[정원의 기록]\n밑변 8, 높이 5인 삼각형 화단의 넓이는? (숫자만 입력)',
		answer: '20',
		hint: '(8 x 5) / 2',
		type: '도형',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 47,
		title: '숫자로 바뀐 이름',
		question: '[서재의 기록]\n규칙: A=1, B=2, ... Z=26.\n"BED"의 알파벳 값을 모두 더하면? (숫자만 입력)',
		answer: '11',
		hint: 'B=2, E=5, D=4의 합',
		type: '암호',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 48,
		title: '수열 조각',
		question: '[다락방의 기록]\n흩어진 숫자 조각 8, 2, 6, 4를 오름차순으로 탭하시오.',
		answer: '2468',
		hint: '작은 수부터 고르세요.',
		type: '타일배열',
		difficulty: 1,
		inputType: 'tile-order',
		tiles: ['2', '4', '6', '8'],
	},
	{
		id: 49,
		title: '일꾼들의 품삯',
		question: '[사무실의 기록]\n일꾼 한 명의 하루 품삯은 15000원이다.\n일꾼 4명이 3일 일하면 총 품삯은? (숫자만 입력)',
		answer: '180000',
		hint: '15000 x 4 x 3',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 50,
		title: '벽시계의 눈금',
		question: '[탑의 기록]\n시계 눈금은 12개다. 3시간이 지나면 몇 개의 눈금을 지나는가? (숫자만 입력)',
		answer: '15',
		hint: '1시간에 5칸씩 움직입니다.',
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 51,
		title: '빛이 없는 방',
		question: '[지하실의 기록]\n창문이 없는 방에 촛불을 하나만 켰다.\n촛불을 끄면 방 안은 무엇으로 가득할까? (어둠/공기/먼지 중 입력)',
		answer: '어둠',
		hint: '빛이 없으면 남는 것입니다.',
		type: '넌센스',
		difficulty: 1,
	},
	{
		id: 52,
		title: '3의 배수 자물쇠',
		question: '[지하실의 기록]\n금고 다이얼은 3으로 나누어 떨어지는 수에서만 열린다.\n다음 중 열리는 수는? 22, 27, 31 (숫자만 입력)',
		answer: '27',
		hint: '27 / 3 = 9',
		type: '암호',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 53,
		title: '촛농 무게',
		question: '[보관실의 기록]\n초 하나의 무게가 120g이다. 촛농이 녹아 무게의 1/4이 줄었다면\n남은 무게는? (숫자만 입력)',
		answer: '90',
		hint: '120 - 30',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 54,
		title: '육각 정자',
		question: '[정원의 기록]\n정육각형 정자의 내각 하나의 크기는? (숫자만 입력, 도 단위)',
		answer: '120',
		hint: '(6-2) x 180 / 6',
		type: '도형',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 55,
		title: '편지의 문장',
		question: '[서재의 기록]\n편지 조각 "열쇠는", "서재", "책장", "뒤에", "있다"를\n올바른 문장 순서로 탭하시오.',
		answer: '열쇠는서재책장뒤에있다',
		hint: '주어부터 순서대로 읽어보세요.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['열쇠는', '서재', '책장', '뒤에', '있다'],
	},
	{
		id: 56,
		title: '마구간의 열쇠',
		question: '[마구간의 기록]\n마구간 열쇠를 아무도 인정하지 않는다. 세 사람 중 정확히 한 명만 진실을 말한다.\n마부: "나는 안 가지고 있다."\n집사: "나도 안 가지고 있다."\n하녀: "마부가 가지고 있다."\n열쇠를 가진 사람은? (마부/집사/하녀 중 입력)',
		answer: '집사',
		hint: '각자 진실이라고 가정했을 때 모순이 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 3,
	},
	{
		id: 57,
		title: '탑의 계단 수',
		question: '[탑의 기록]\n탑 계단은 한 층에 18개씩이다.\n5개 층을 오르면 계단은 모두 몇 개인가? (숫자만 입력)',
		answer: '90',
		hint: '18 x 5',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 58,
		title: '달빛 각도',
		question: '[탑의 기록]\n달빛이 창문에 45도로 들어온다. 반사되어 나가는 각도도 45도라면,\n입사각과 반사각의 합은? (숫자만 입력)',
		answer: '90',
		hint: '45 + 45',
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 59,
		title: '거꾸로 된 단어',
		question: '[서재의 기록]\n"TEACLE"의 마지막 3글자를 순서대로 입력하시오. (대문자 3글자)',
		answer: 'CLE',
		hint: '뒤에서 3글자를 세어보세요: T-E-A-C-L-E',
		type: '암호',
		difficulty: 2,
	},
	{
		id: 60,
		title: '최종 계산',
		question: '[사무실의 기록]\n15 x 4 - 20 = ? (숫자만 입력)',
		answer: '40',
		hint: '60 - 20',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | grep -i "rooms-data"`
Expected: No output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rooms-data.ts
git commit -m "content: append Level 2 puzzles (ids 31-60)"
```

---

### Task 9: Append Level 3 puzzles (ids 61-90, middle-school-2nd-year difficulty)

**Files:**
- Modify: `src/lib/rooms-data.ts`

- [ ] **Step 1: Insert Level 3 content immediately before the closing `];`**

```ts
	// ==========================================
	// Level 3 (30대 / 중학교 2학년 수준) — 방 61~90
	// ==========================================
	{
		id: 61,
		title: '연립방정식 금고',
		question: '[지하실의 기록]\n금고 다이얼: x + y = 12, x - y = 4.\nx의 값은? (숫자만 입력)',
		answer: '8',
		hint: '두 식을 더하면 2x = 16',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 62,
		title: '그림자의 함수',
		question: '[정원의 기록]\n그림자 길이(cm) = 물체 높이(cm) x 1.5.\n높이 20cm인 촛대의 그림자는? (숫자만 입력)',
		answer: '30',
		hint: '20 x 1.5',
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 63,
		title: '진법 변환 자물쇠',
		question: '[지하실의 기록]\n8진수 17은 10진수로 얼마인가? (숫자만 입력)',
		answer: '15',
		hint: '1 x 8 + 7',
		type: '암호',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 64,
		title: '가문의 문장',
		question: '[응접실의 기록]\n가문 문장에 새겨진 글자 조각을 탭한 순서가\n"성(castle)"을 뜻하는 단어가 되게 하시오.',
		answer: 'CASTLE',
		hint: '성을 뜻하는 영어 단어입니다.',
		type: '타일배열',
		difficulty: 3,
		inputType: 'tile-order',
		tiles: ['C', 'A', 'S', 'T', 'L', 'E'],
	},
	{
		id: 65,
		title: '네 명의 하인과 촛대',
		question: '[보관실의 기록]\n촛대가 사라졌다. 네 사람 중 정확히 한 명만 거짓말을 한다.\nA: "나는 범인이 아니다."\nB: "나는 범인이 아니다."\nC: "나는 범인이 아니다."\nD: "A가 범인이다."\n범인은 누구인가? (A/B/C/D 중 입력)',
		answer: 'A',
		hint: '각자 거짓말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 4,
	},
	{
		id: 66,
		title: '확률 주사위',
		question: '[응접실의 기록]\n주사위를 던져 짝수가 나올 확률을 기약분수로 나타낼 때\n분모는 얼마인가? (숫자만 입력)',
		answer: '2',
		hint: '짝수는 2,4,6으로 3/6 = 1/2',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 67,
		title: '피타고라스의 정원',
		question: '[정원의 기록]\n직각삼각형의 두 변이 9, 12일 때 빗변의 길이는? (숫자만 입력)',
		answer: '15',
		hint: '3-4-5 비율의 3배입니다.',
		type: '도형',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 68,
		title: '이차 규칙',
		question: '[다락방의 기록]\n1, 4, 9, 16, 25, ?\n다음 수는? (숫자만 입력)',
		answer: '36',
		hint: '6의 제곱입니다.',
		type: '관찰',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 69,
		title: '모듈러 자물쇠',
		question: '[지하실의 기록]\n규칙: N을 7로 나눈 나머지. 23의 나머지는? (숫자만 입력)',
		answer: '2',
		hint: '21 + 2',
		type: '암호',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 70,
		title: '연도의 순서',
		question: '[서재의 기록]\n저택 증축 연도 조각 1902, 1888, 1935, 1911을\n오래된 순서대로 탭하시오.',
		answer: '1888190219111935',
		hint: '작은 숫자부터 고르세요.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['1888', '1902', '1911', '1935'],
	},
	{
		id: 71,
		title: '퍼센트 할인',
		question: '[사무실의 기록]\n골동품 가격 80000원에서 25% 할인하면 얼마인가? (숫자만 입력)',
		answer: '60000',
		hint: '80000 x 0.75',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 72,
		title: '오각별의 각',
		question: '[탑의 기록]\n정오각형의 내각의 합은? (숫자만 입력, 도 단위)',
		answer: '540',
		hint: '(5-2) x 180',
		type: '도형',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 73,
		title: '다섯 손님의 진술',
		question: '[응접실의 기록]\n보석이 사라졌다. 다섯 손님 중 정확히 한 명만 거짓말을 한다.\nA: "나는 범인이 아니다."\nB: "나는 범인이 아니다."\nC: "나는 범인이 아니다."\nD: "나는 범인이 아니다."\nE: "A가 범인이다."\n범인은 누구인가? (A/B/C/D/E 중 입력)',
		answer: 'A',
		hint: '각자 거짓말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 4,
	},
	{
		id: 74,
		title: '알파벳 곱셈 암호',
		question: '[서재의 기록]\n규칙: 알파벳 순서 x2. C(3번째)는 어떤 수로 바뀌는가? (숫자만 입력)',
		answer: '6',
		hint: '3 x 2',
		type: '암호',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 75,
		title: '속력 계산',
		question: '[마구간의 기록]\n마차가 60km를 4시간 동안 이동했다.\n시속은 몇 km인가? (숫자만 입력)',
		answer: '15',
		hint: '60 / 4',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 76,
		title: '암호 조각 재배열',
		question: '[지하실의 기록]\n금고에 적힌 조각 3, 9, 1, 7, 5를 오름차순으로 탭하시오.',
		answer: '13579',
		hint: '작은 수부터 고르세요.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['1', '3', '5', '7', '9'],
	},
	{
		id: 77,
		title: '원기둥 창고',
		question: '[보관실의 기록]\n원의 지름이 14일 때 반지름은? (숫자만 입력)',
		answer: '7',
		hint: '지름 / 2',
		type: '도형',
		difficulty: 1,
		inputType: 'number',
	},
	{
		id: 78,
		title: '패턴 찾기',
		question: '[다락방의 기록]\n3, 6, 12, 24, 48, ?\n다음 수는? (숫자만 입력)',
		answer: '96',
		hint: '2배씩 증가합니다.',
		type: '관찰',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 79,
		title: '시저 -2 암호',
		question: '[서재의 기록]\n"FMSQC"는 원문의 각 글자를 알파벳 순서로 2칸 앞으로 이동해 만든 암호다.\n원문은? (대문자 5글자)',
		answer: 'HOUSE',
		hint: '각 글자를 +2 이동하세요.',
		type: '암호',
		difficulty: 3,
	},
	{
		id: 80,
		title: '무게 중심',
		question: '[보관실의 기록]\n저울 왼쪽에 3kg추 두 개, 오른쪽에 2kg추 세 개가 있다.\n양쪽 무게 차이는? (숫자만 입력)',
		answer: '0',
		hint: '3 x 2 = 6, 2 x 3 = 6, 차이는 0',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 81,
		title: '여섯 용의자',
		question: '[지하실의 기록]\n금괴가 사라졌다. 여섯 사람 중 정확히 한 명만 거짓말을 한다.\nA: "나는 범인이 아니다."\nB: "나는 범인이 아니다."\nC: "나는 범인이 아니다."\nD: "나는 범인이 아니다."\nE: "나는 범인이 아니다."\nF: "A가 범인이다."\n범인은 누구인가? (A~F 중 입력)',
		answer: 'A',
		hint: '각자 거짓말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 4,
	},
	{
		id: 82,
		title: '탑의 높이',
		question: '[탑의 기록]\n탑 그림자 길이가 24m이고, 그림자와 높이의 비율이 4:3이다(그림자:높이).\n탑의 높이는? (숫자만 입력)',
		answer: '18',
		hint: '24 / 4 x 3',
		type: '도형',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 83,
		title: '고서의 목차',
		question: '[서재의 기록]\n고서 목차 조각 "결말", "서론", "전개", "위기"를\n이야기 순서대로 탭하시오.',
		answer: '서론전개위기결말',
		hint: '이야기 구조를 떠올려 보세요.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['서론', '전개', '위기', '결말'],
	},
	{
		id: 84,
		title: '이자 계산',
		question: '[사무실의 기록]\n원금 10만원에 연 5% 단리 이자를 2년간 받으면 이자 총액은? (숫자만 입력)',
		answer: '10000',
		hint: '100000 x 0.05 x 2',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 85,
		title: '숨은 배수',
		question: '[다락방의 기록]\n1부터 30까지 수 중 4와 6의 공배수는 몇 개인가? (숫자만 입력)',
		answer: '2',
		hint: '12의 배수: 12, 24',
		type: '관찰',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 86,
		title: '이진 자물쇠 2',
		question: '[지하실의 기록]\n10진수 26을 2진수로 바꾸면? (숫자만 입력, 이진수 그대로)',
		answer: '11010',
		hint: '16 + 8 + 2',
		type: '암호',
		difficulty: 3,
	},
	{
		id: 87,
		title: '부채꼴의 각',
		question: '[탑의 기록]\n원의 1/4에 해당하는 부채꼴의 중심각은? (숫자만 입력, 도 단위)',
		answer: '90',
		hint: '360 / 4',
		type: '도형',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 88,
		title: '재판정의 순서',
		question: '[응접실의 기록]\n재판 절차 조각 "판결", "증언", "기소", "변론"을\n진행되는 순서대로 탭하시오.',
		answer: '기소증언변론판결',
		hint: '재판이 시작되고 끝나는 순서를 생각해보세요.',
		type: '타일배열',
		difficulty: 3,
		inputType: 'tile-order',
		tiles: ['기소', '증언', '변론', '판결'],
	},
	{
		id: 89,
		title: '최종 방정식',
		question: '[사무실의 기록]\n3x - 5 = 16.\nx의 값은? (숫자만 입력)',
		answer: '7',
		hint: '21 / 3',
		type: '연산',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 90,
		title: '최종 용의자',
		question: '[지하실의 기록]\n저택의 마지막 사건. 일곱 사람 중 정확히 한 명만 거짓말을 한다.\nA: "나는 범인이 아니다."\nB: "나는 범인이 아니다."\nC: "나는 범인이 아니다."\nD: "나는 범인이 아니다."\nE: "나는 범인이 아니다."\nF: "나는 범인이 아니다."\nG: "A가 범인이다."\n범인은 누구인가? (A~G 중 입력)',
		answer: 'A',
		hint: '각자 거짓말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 4,
	},
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | grep -i "rooms-data"`
Expected: No output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rooms-data.ts
git commit -m "content: append Level 3 puzzles (ids 61-90)"
```

---

### Task 10: Append Level 4 puzzles (ids 91-120, middle-school-3rd-year difficulty)

**Files:**
- Modify: `src/lib/rooms-data.ts`

- [ ] **Step 1: Insert Level 4 content immediately before the closing `];`**

```ts
	// ==========================================
	// Level 4 (40대 이상 / 중학교 3학년 수준) — 방 91~120
	// ==========================================
	{
		id: 91,
		title: '인수분해 자물쇠',
		question: '[지하실의 기록]\nx² - 5x + 6 = 0의 두 해 중 더 큰 값은? (숫자만 입력)',
		answer: '3',
		hint: '(x-2)(x-3) = 0',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 92,
		title: '피타고라스 응용',
		question: '[정원의 기록]\n직각삼각형의 빗변이 13, 한 변이 5일 때 나머지 한 변은? (숫자만 입력)',
		answer: '12',
		hint: '5-12-13 비율입니다.',
		type: '도형',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 93,
		title: '모듈러 응용',
		question: '[지하실의 기록]\n규칙: (3N+1)을 5로 나눈 나머지. N=7일 때 값은? (숫자만 입력)',
		answer: '2',
		hint: '3 x 7 + 1 = 22, 22를 5로 나눈 나머지',
		type: '암호',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 94,
		title: '삼차 수열',
		question: '[다락방의 기록]\n1, 8, 27, 64, ?\n다음 수는? (숫자만 입력)',
		answer: '125',
		hint: '5의 세제곱입니다.',
		type: '관찰',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 95,
		title: '암호 알고리즘 조각',
		question: '[서재의 기록]\n암호 절차 조각 "암호화", "평문", "전송", "복호화"를\n올바른 처리 순서로 탭하시오.',
		answer: '평문암호화전송복호화',
		hint: '메시지가 만들어지고 전달되는 순서를 생각해보세요.',
		type: '타일배열',
		difficulty: 3,
		inputType: 'tile-order',
		tiles: ['평문', '암호화', '전송', '복호화'],
	},
	{
		id: 96,
		title: '이중 거짓말',
		question: '[응접실의 기록]\n금고 암호를 아는 사람이 둘이다. 다섯 사람 중 정확히 두 명만 거짓말을 한다.\nA: "나는 모른다."\nB: "나는 모른다."\nC: "나는 모른다."\nD: "나는 모른다."\nE: "A와 B가 안다."\n금고 암호를 아는 두 사람은 누구인가? (알파벳순으로, 예: AB 형식 입력)',
		answer: 'AB',
		hint: 'E의 진술이 참이라고 가정하고 앞뒤를 맞춰보세요.',
		type: '추리',
		difficulty: 5,
	},
	{
		id: 97,
		title: '복리 이자',
		question: '[사무실의 기록]\n원금 10만원을 연 10% 복리로 2년간 예치하면 원리금 합계는? (숫자만 입력)',
		answer: '121000',
		hint: '100000 x 1.1 x 1.1',
		type: '연산',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 98,
		title: '삼각형의 닮음',
		question: '[서재의 기록]\n닮음비가 1:3인 두 삼각형에서 작은 삼각형 넓이가 4일 때\n큰 삼각형 넓이는? (숫자만 입력)',
		answer: '36',
		hint: '넓이비는 (1:3)² = 1:9',
		type: '도형',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 99,
		title: '해시 자물쇠',
		question: '[지하실의 기록]\n해시 규칙: 문자열의 각 글자 알파벳 값의 합을 9로 나눈 나머지.\n"MANOR"의 해시값은? (M=13, A=1, N=14, O=15, R=18) (숫자만 입력)',
		answer: '7',
		hint: '13+1+14+15+18=61, 61을 9로 나눈 나머지',
		type: '암호',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 100,
		title: '긴 암호 문장',
		question: '[지하실의 기록]\n조각난 문장 "지하실에", "숨겨진", "금고의", "열쇠가", "있다"를\n올바른 문장 순서로 탭하시오.',
		answer: '지하실에숨겨진금고의열쇠가있다',
		hint: '장소-수식어-목적어-서술어 순서를 생각해보세요.',
		type: '타일배열',
		difficulty: 3,
		inputType: 'tile-order',
		tiles: ['지하실에', '숨겨진', '금고의', '열쇠가', '있다'],
	},
	{
		id: 101,
		title: '피보나치 저택',
		question: '[다락방의 기록]\n1, 1, 2, 3, 5, 8, ?\n다음 수는? (숫자만 입력)',
		answer: '13',
		hint: '앞의 두 수를 더합니다.',
		type: '관찰',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 102,
		title: '비례식 자물쇠',
		question: '[지하실의 기록]\nx:6 = 10:15 일 때 x의 값은? (숫자만 입력)',
		answer: '4',
		hint: '6 x 10 / 15',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 103,
		title: '원뿔 창고',
		question: '[보관실의 기록]\n원의 둘레 공식은 2πr이다. 반지름 7, π=22/7로 계산할 때 둘레는? (숫자만 입력)',
		answer: '44',
		hint: '2 x 22/7 x 7',
		type: '도형',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 104,
		title: '저택의 마지막 진실',
		question: '[응접실의 기록]\n보물이 사라졌다. 여섯 사람 중 정확히 한 명만 거짓말을 한다.\nA: "나는 범인이 아니다."\nB: "나는 범인이 아니다."\nC: "나는 범인이 아니다."\nD: "나는 범인이 아니다."\nE: "나는 범인이 아니다."\nF: "C가 범인이다."\n범인은 누구인가? (A~F 중 입력)',
		answer: 'C',
		hint: '각자 거짓말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 4,
	},
	{
		id: 105,
		title: '제곱근 자물쇠',
		question: '[지하실의 기록]\n169의 제곱근은? (숫자만 입력)',
		answer: '13',
		hint: '13 x 13 = 169',
		type: '암호',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 106,
		title: '농도 계산',
		question: '[부엌의 기록]\n소금물 200g에 소금이 20g 녹아 있다.\n농도는 몇 %인가? (숫자만 입력)',
		answer: '10',
		hint: '20 / 200 x 100',
		type: '연산',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 107,
		title: '최종 암호 배열',
		question: '[지하실의 기록]\n금고 다이얼 조각 5, 3, 8, 1, 9, 2를\n오름차순으로 탭하여 최종 암호를 만드시오.',
		answer: '123589',
		hint: '작은 수부터 고르세요.',
		type: '타일배열',
		difficulty: 2,
		inputType: 'tile-order',
		tiles: ['1', '2', '3', '5', '8', '9'],
	},
	{
		id: 108,
		title: '부피 계산',
		question: '[보관실의 기록]\n가로 3, 세로 4, 높이 5인 직육면체 상자의 부피는? (숫자만 입력)',
		answer: '60',
		hint: '3 x 4 x 5',
		type: '도형',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 109,
		title: '등비수열의 저택',
		question: '[다락방의 기록]\n2, 6, 18, 54, ?\n다음 수는? (숫자만 입력)',
		answer: '162',
		hint: '3배씩 증가합니다.',
		type: '관찰',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 110,
		title: '복합 모듈러',
		question: '[지하실의 기록]\n규칙: N을 4로 나눈 나머지에 3을 곱한다. N=15일 때 값은? (숫자만 입력)',
		answer: '9',
		hint: '15를 4로 나눈 나머지는 3, 3 x 3 = 9',
		type: '암호',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 111,
		title: '최종 방정식 2',
		question: '[사무실의 기록]\n2(x+3) = 16.\nx의 값은? (숫자만 입력)',
		answer: '5',
		hint: 'x + 3 = 8',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 112,
		title: '일곱 용의자의 함정',
		question: '[응접실의 기록]\n마지막 보석이 사라졌다. 일곱 사람 중 정확히 한 명만 거짓말을 한다.\nA: "나는 범인이 아니다."\nB: "나는 범인이 아니다."\nC: "나는 범인이 아니다."\nD: "나는 범인이 아니다."\nE: "나는 범인이 아니다."\nF: "나는 범인이 아니다."\nG: "D가 범인이다."\n범인은 누구인가? (A~G 중 입력)',
		answer: 'D',
		hint: '각자 거짓말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 5,
	},
	{
		id: 113,
		title: '닮음 그림자',
		question: '[정원의 기록]\n실제 높이 6m인 조각상의 그림자가 4m이다.\n같은 시각 그림자 길이가 10m인 나무의 실제 높이는? (숫자만 입력)',
		answer: '15',
		hint: '6:4 = x:10',
		type: '도형',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 114,
		title: '최종 해시',
		question: '[지하실의 기록]\n해시 규칙: 문자열 글자 수 x 3.\n"ESCAPE"의 해시값은? (숫자만 입력)',
		answer: '18',
		hint: '6글자 x 3',
		type: '암호',
		difficulty: 2,
		inputType: 'number',
	},
	{
		id: 115,
		title: '확률의 방',
		question: '[응접실의 기록]\n주머니에 빨간 공 3개, 파란 공 2개가 있다.\n빨간 공을 뽑을 확률을 기약분수로 나타낼 때 분모는? (숫자만 입력)',
		answer: '5',
		hint: '3/5',
		type: '연산',
		difficulty: 3,
		inputType: 'number',
	},
	{
		id: 116,
		title: '최종 문서 조각',
		question: '[서재의 기록]\n마지막 문서 조각 "저택의", "모든", "비밀이", "풀렸다"를\n올바른 문장 순서로 탭하시오.',
		answer: '저택의모든비밀이풀렸다',
		hint: '주어부터 순서대로 읽어보세요.',
		type: '타일배열',
		difficulty: 3,
		inputType: 'tile-order',
		tiles: ['저택의', '모든', '비밀이', '풀렸다'],
	},
	{
		id: 117,
		title: '최종 피타고라스',
		question: '[정원의 기록]\n직각삼각형의 두 변이 20, 21일 때 빗변의 길이는? (숫자만 입력)',
		answer: '29',
		hint: '20-21-29는 피타고라스 수입니다.',
		type: '도형',
		difficulty: 4,
		inputType: 'number',
	},
	{
		id: 118,
		title: '최종 규칙 찾기',
		question: '[다락방의 기록]\n2, 5, 11, 23, 47, ?\n다음 수는? (숫자만 입력)',
		answer: '95',
		hint: '각 항에 2를 곱하고 1을 더합니다.',
		type: '관찰',
		difficulty: 5,
		inputType: 'number',
	},
	{
		id: 119,
		title: '최종 모듈러 자물쇠',
		question: '[지하실의 기록]\n규칙: N²을 7로 나눈 나머지. N=10일 때 값은? (숫자만 입력)',
		answer: '2',
		hint: '10² = 100, 100을 7로 나눈 나머지',
		type: '암호',
		difficulty: 5,
		inputType: 'number',
	},
	{
		id: 120,
		title: '저택 최후의 진실',
		question: '[응접실의 기록]\n저택 탈출의 마지막 관문. 여덟 사람 중 정확히 한 명만 거짓말을 한다.\nA: "나는 범인이 아니다."\nB: "나는 범인이 아니다."\nC: "나는 범인이 아니다."\nD: "나는 범인이 아니다."\nE: "나는 범인이 아니다."\nF: "나는 범인이 아니다."\nG: "나는 범인이 아니다."\nH: "E가 범인이다."\n범인은 누구인가? (A~H 중 입력)',
		answer: 'E',
		hint: '각자 거짓말한다고 가정하고 모순 없는 경우를 찾아보세요.',
		type: '추리',
		difficulty: 5,
	},
];
```

- [ ] **Step 2: Verify full build and lint**

Run: `pnpm lint && pnpm build`
Expected: Both pass cleanly with zero errors — this is the last content addition, and `rooms-data.ts` now has exactly 120 entries (ids 1-120).

- [ ] **Step 3: Sanity-check the room count**

Run: `grep -c "id: [0-9]" src/lib/rooms-data.ts`
Expected: `120`

- [ ] **Step 4: Commit**

```bash
git add src/lib/rooms-data.ts
git commit -m "content: append Level 4 puzzles (ids 91-120), completing 120-room rewrite"
```

---

### Task 11: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full lint and build**

Run: `pnpm lint && pnpm build`
Expected: Zero errors/warnings.

- [ ] **Step 2: Grep for any remaining old-naming references**

Run: `grep -rn "AgeGroup\|ageGroup\|getAgeGroupFromAge\|normalizeAgeGroup\|getRoomsForAgeGroup\|AGE_GROUP_COOKIE_KEY\|playerAgeGroup\|player_age_group" src/`
Expected: No matches anywhere in `src/`.

- [ ] **Step 3: Manual playthrough — Level 1 (age 15)**

Run `pnpm dev`, go to `/start`, enter age 15, confirm level badge shows "제1관 [입문]". Submit, land on `/escape/1`. Answer room 1 correctly (`43`), confirm advance to room 2. Navigate directly to room 5 (`/escape/5`) via the URL after having progressed there, or by testing `TileOrderInput` specifically: tap tiles in order `H`, `O`, `M`, `E` and confirm the answer field fills as `HOME` and submitting advances the room.

- [ ] **Step 4: Manual playthrough — Level 4 tile-order and deduction spot check**

Set age to 45 in `/start` (confirm badge "제4관 [최상급]"), proceed to `/escape/1` (which now serves room 91 for this level via `getRoomsForLevel`), confirm the deduction puzzle (id 91, arithmetic) or navigate through a couple of rooms until reaching a `tile-order` room (e.g. id 95) and confirm tapping tiles in the correct order (평문, 암호화, 전송, 복호화) submits successfully.

- [ ] **Step 5: Confirm `TileOrderInput` reset button works**

On any `tile-order` room, tap 2 tiles, click "다시 섞기", confirm the selected-tiles row clears and all tile buttons become re-tappable.

- [ ] **Step 6: Confirm finish page shows level badge**

Manually set in browser console: `localStorage.setItem('startTime', new Date(Date.now()-60000).toISOString()); localStorage.setItem('endTime', new Date().toISOString()); localStorage.setItem('score','100');` then navigate to `/finish` and confirm no runtime errors (leaderboard level badge only shows if a session with a `level` field exists server-side, so an empty leaderboard is an acceptable outcome for this local check — the important thing is no crash referencing `user.ageGroup`).

- [ ] **Step 7: No further commit needed unless Step 2's grep found leftovers**

If Step 2 found any leftover references, fix them and commit:

```bash
git add -A
git commit -m "fix: clean up remaining AgeGroup/ageGroup references"
```
