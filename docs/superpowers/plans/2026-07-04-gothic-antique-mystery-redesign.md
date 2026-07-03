# Gothic Antique Mystery Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "hacker terminal / spy agent" visual theme (green CRT terminal, AGENT_ID, CLASSIFIED stamps) with a "Gothic Antique Mystery" theme (brass gold, candlelight amber, wine red, serif typography, static vignette) across the home, start, escape, and finish screens, without changing any game logic, state management, or routing.

**Architecture:** This is a pure styling/copy pass. `globals.css` is rewritten with a new set of CSS custom properties, utility classes, and keyframes replacing the terminal-themed ones. Each page/component then swaps class names and hardcoded color values to reference the new classes/variables, and replaces hacker-themed copy strings with mystery-themed copy. No props, state shape, hooks, or business logic change in any file.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS (utility classes + custom CSS in `globals.css`), `next/font/google`.

**No automated test harness exists in this repo** (confirmed in `AGENTS.md`). Verification for every task is: `pnpm lint`, `pnpm build`, and a manual visual check via `pnpm dev` in the browser (per task instructions below). This replaces the "write failing test" steps from the standard template.

---

## Important pre-existing bug to fix as part of this work

The current uncommitted `globals.css` (the terminal theme) **dropped several classes that other uncommitted files still reference**, meaning the app currently references undefined CSS classes:

- `.main-background` (used in `src/app/page.tsx:147`) — existed in the git HEAD version of `globals.css`, missing from current working tree version.
- `.animate-fade-in-scale` (used in `src/app/start/page.tsx:212`, `src/app/escape/[roomId]/RoomClient.tsx:478,672`) — existed in HEAD, missing now.
- `.animate-badge-pop` (used in `src/app/start/page.tsx:336`) — never defined anywhere.
- `.toast`, `.toast-success`, `.toast-error` (used in `src/app/escape/[roomId]/RoomClient.tsx:379-388`) — never defined anywhere.
- `.hud-stat` (used in `src/app/escape/[roomId]/RoomClient.tsx:429,438,446,459`) — never defined anywhere.

Since Task 1 rewrites `globals.css` from scratch, it must define all of these classes so the app doesn't silently render unstyled elements. This is folded into Task 1 below — no separate task needed.

---

### Task 1: Rewrite `globals.css` with the Gothic Antique Mystery design system

**Files:**
- Modify: `src/app/globals.css` (full rewrite)

- [ ] **Step 1: Replace the entire contents of `src/app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================
   CSS Custom Properties
   ============================================================ */
:root {
  --color-bg: #0d0b12;
  --color-brass: #c9a24b;
  --color-brass-dim: rgba(201, 162, 75, 0.15);
  --color-panel-bg: rgba(10, 8, 14, 0.85);
  --color-candle-amber: #e8965a;
  --color-candle-amber-dim: rgba(232, 150, 90, 0.15);
  --color-wine-red: #7a1f2b;
  --font-serif: 'Noto Serif KR', 'Playfair Display', serif;
  --font-display: 'Playfair Display', 'Noto Serif KR', serif;
}

/* ============================================================
   Base Reset
   ============================================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-serif);
  background-color: var(--color-bg);
  color: #c7bfae;
  overflow-x: hidden;
}

/* Custom selection */
::selection {
  background: var(--color-brass-dim);
  color: var(--color-brass);
}

/* ============================================================
   Home page key-drag background (kept from legacy, restyled)
   ============================================================ */
.main-background {
  background-image: url('/images/escape_room_main.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100vw;
  min-height: 100vh;
  position: relative;
}
.main-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 40%, rgba(13, 11, 18, 0.35) 0%, rgba(13, 11, 18, 0.85) 100%);
  pointer-events: none;
}

/* ============================================================
   Static vignette (replaces mouse-tracking flashlight)
   ============================================================ */
.vignette-bg {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    circle 700px at 50% 45%,
    rgba(201, 162, 75, 0.04) 0%,
    rgba(13, 11, 18, 0.96) 75%,
    #060509 100%
  );
}

/* Faint candle-like brightness pulse, for isolated accents only */
@keyframes candle-flicker {
  0%, 100% { opacity: 0.85; }
  45% { opacity: 1; }
  55% { opacity: 0.92; }
}
.candle-flicker {
  animation: candle-flicker 3.2s ease-in-out infinite;
}

/* ============================================================
   Antique panels
   ============================================================ */
.antique-panel {
  background: var(--color-panel-bg);
  border: 1px solid rgba(201, 162, 75, 0.25);
  box-shadow:
    0 0 24px rgba(201, 162, 75, 0.05),
    inset 0 0 14px rgba(201, 162, 75, 0.04);
  position: relative;
}

.antique-panel-warn {
  background: rgba(20, 10, 10, 0.9);
  border: 1px solid rgba(122, 31, 43, 0.4);
  box-shadow:
    0 0 20px rgba(122, 31, 43, 0.08),
    inset 0 0 12px rgba(122, 31, 43, 0.06);
}

/* Corner bracket decorations */
.corner-decor::before, .corner-decor::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: var(--color-brass);
  border-style: solid;
  pointer-events: none;
}
.corner-decor::before {
  top: -1px; left: -1px;
  border-width: 2px 0 0 2px;
}
.corner-decor::after {
  bottom: -1px; right: -1px;
  border-width: 0 2px 2px 0;
}

.corner-decor-warn::before, .corner-decor-warn::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-color: var(--color-wine-red);
  border-style: solid;
  pointer-events: none;
}
.corner-decor-warn::before {
  top: -1px; left: -1px;
  border-width: 2px 0 0 2px;
}
.corner-decor-warn::after {
  bottom: -1px; right: -1px;
  border-width: 0 2px 2px 0;
}

/* ============================================================
   Forms & Inputs
   ============================================================ */
.antique-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(201, 162, 75, 0.25);
  border-radius: 4px;
  padding: 12px 16px;
  color: var(--color-brass);
  font-family: var(--font-serif);
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s ease;
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.5);
}

.antique-input:focus {
  border-color: var(--color-brass);
  box-shadow:
    0 0 10px rgba(201, 162, 75, 0.18),
    inset 0 2px 6px rgba(0,0,0,0.5);
}

.antique-input::placeholder {
  color: rgba(201, 162, 75, 0.3);
}

/* ============================================================
   Buttons
   ============================================================ */
.btn-antique {
  background: rgba(201, 162, 75, 0.06);
  border: 1px solid rgba(201, 162, 75, 0.4);
  color: var(--color-brass);
  font-family: var(--font-serif);
  font-weight: 500;
  letter-spacing: 0.05em;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-antique:hover:not(:disabled) {
  background: rgba(201, 162, 75, 0.16);
  border-color: var(--color-brass);
  box-shadow: 0 0 12px rgba(201, 162, 75, 0.22);
}

.btn-antique-warn {
  background: rgba(122, 31, 43, 0.08);
  border: 1px solid rgba(122, 31, 43, 0.45);
  color: #e6a3ab;
  font-family: var(--font-serif);
  font-weight: 500;
  letter-spacing: 0.05em;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-antique-warn:hover:not(:disabled) {
  background: rgba(122, 31, 43, 0.18);
  border-color: var(--color-wine-red);
  box-shadow: 0 0 12px rgba(122, 31, 43, 0.28);
}

/* ============================================================
   Sealed document ( 봉인된 기록 ) 스타일
   ============================================================ */
.dossier-stamp {
  border: 3px double var(--color-wine-red);
  color: var(--color-wine-red);
  font-family: var(--font-display);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transform: rotate(-12deg);
  opacity: 0.85;
  box-shadow: 0 0 6px rgba(122, 31, 43, 0.25);
}

/* ============================================================
   Animations
   ============================================================ */
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in-scale {
  animation: fadeInScale 0.5s ease-out forwards;
}

@keyframes badgePop {
  0% { opacity: 0; transform: scale(0.7); }
  60% { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-badge-pop {
  animation: badgePop 0.35s ease-out forwards;
}

@keyframes brass-pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}
.cursor-blink {
  animation: brass-pulse 1s infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.4s ease-in-out;
}

/* HUD Progress */
.hud-progress-track {
  width: 100%;
  height: 3px;
  background: rgba(201, 162, 75, 0.1);
}
.hud-progress-fill {
  height: 100%;
  background: var(--color-brass);
  box-shadow: 0 0 8px var(--color-brass);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* HUD stat chip (room number / score / combo / hints) */
.hud-stat {
  border: 1px solid rgba(201, 162, 75, 0.3);
  border-radius: 4px;
  padding: 4px 10px;
  min-width: 56px;
}

/* Toast notifications */
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 80;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  font-family: var(--font-serif);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  padding: 10px 16px;
  border-radius: 4px;
  backdrop-filter: blur(6px);
  animation: fadeInScale 0.25s ease-out forwards;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.toast-success {
  background: rgba(201, 162, 75, 0.14);
  border: 1px solid rgba(201, 162, 75, 0.4);
  color: var(--color-brass);
}
.toast-error {
  background: rgba(122, 31, 43, 0.18);
  border: 1px solid rgba(122, 31, 43, 0.5);
  color: #e6a3ab;
}

/* Custom scrollbar for antique panels */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(201, 162, 75, 0.25);
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 162, 75, 0.45);
}
```

- [ ] **Step 2: Run lint and build to confirm no syntax errors**

Run: `pnpm lint && pnpm build`
Expected: Both complete with no errors (there will still be TypeScript/JSX errors from later tasks referencing old class names — ignore those for now if this is the very first task executed; if this is the only uncommitted file at this point, build should succeed since old TSX files don't reference removed classes like `.terminal-panel` — they still do, so build errors are EXPECTED until Tasks 2-5 are done. Confirm only that the CSS itself has no PostCSS/Tailwind parse errors, visible as `Error: ... globals.css` in the output.)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: rewrite globals.css with gothic antique mystery design system"
```

---

### Task 2: Update `layout.tsx` font to serif

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace the font import and usage**

In `src/app/layout.tsx`, replace:

```tsx
import { Noto_Sans_KR } from 'next/font/google';
```

with:

```tsx
import { Noto_Serif_KR } from 'next/font/google';
```

Replace:

```tsx
const notoSans = Noto_Sans_KR({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	display: 'swap',
});
```

with:

```tsx
const notoSerif = Noto_Serif_KR({
	weight: ['400', '500', '700'],
	subsets: ['latin'],
	display: 'swap',
});
```

Replace:

```tsx
className={`${notoSans.className} text-base`}
```

with:

```tsx
className={`${notoSerif.className} text-base`}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: No errors related to `layout.tsx` or font loading (other files may still fail until later tasks are done).

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "style: switch root layout font to Noto Serif KR"
```

---

### Task 3: Restyle home page (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`

The interactive key-drag logic (all `useState`/`useCallback`/`useEffect`/pointer handlers) stays exactly as-is. Only JSX text and classNames change.

- [ ] **Step 1: Update the instruction banner copy and color classes**

Replace:

```tsx
<div className="mb-8 max-w-md rounded-full bg-black/50 px-6 py-3 text-sm font-medium tracking-wide backdrop-blur">
	열쇠🔑를 잡고 가운데 열쇠구멍에 끼워보세요.
</div>
```

with:

```tsx
<div className="mb-8 max-w-md rounded-full bg-black/60 border border-[rgba(201,162,75,0.3)] px-6 py-3 text-sm font-medium tracking-wide text-[#e8d9b0] backdrop-blur">
	낡은 열쇠🔑를 쥐고 자물쇠 구멍에 꽂아보세요.
</div>
```

- [ ] **Step 2: Update the keyhole ring color**

Replace:

```tsx
className={`absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-300 transition-opacity duration-300 ${
```

with:

```tsx
className={`absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#c9a24b] transition-opacity duration-300 ${
```

- [ ] **Step 3: Update the unlock modal copy and button color**

Replace:

```tsx
<h2 className="mb-3 text-lg font-semibold">
	프로필을 설정하고 시작하세요
</h2>
<p className="mb-4 text-sm text-gray-600">
	열쇠가 잠금을 풀었습니다. 다음 화면에서 이름, 성별, 나이를 입력하면 세대별 문제로 게임이 시작됩니다.
</p>
<button
	type="button"
	onClick={() => router.push('/start')}
	className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-center text-base font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
>
	프로필 입력으로 이동
</button>
```

with:

```tsx
<h2 className="mb-3 text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
	방문객 기록을 남겨주세요
</h2>
<p className="mb-4 text-sm text-gray-600">
	자물쇠가 열렸습니다. 다음 화면에서 이름, 성별, 나이를 남기면 나이대에 맞는 저택의 방들이 준비됩니다.
</p>
<button
	type="button"
	onClick={() => router.push('/start')}
	className="mt-2 w-full rounded-lg bg-[#c9a24b] py-2 text-center text-base font-semibold text-[#0d0b12] transition hover:bg-[#dcb768] disabled:cursor-not-allowed disabled:bg-[#8a7239]"
>
	저택으로 들어가기
</button>
```

- [ ] **Step 4: Manual visual check**

Run: `pnpm dev`, open `http://localhost:3000`, drag the key into the keyhole, confirm the modal shows the new copy and gold button, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: restyle home page key-drag intro to gothic antique tone"
```

---

### Task 4: Restyle `start/page.tsx`

**Files:**
- Modify: `src/app/start/page.tsx`

All state, effects, `handleStart` logic, session read/write calls, and localStorage keys stay exactly as-is. Only the returned JSX (classNames + copy) and the `systemLogs` copy array change.

- [ ] **Step 1: Update `AGE_GROUP_LABELS` and `GENDER_OPTIONS` copy**

Replace:

```tsx
const AGE_GROUP_LABELS: Record<string, { label: string; desc: string; detail: string }> = {
	teen: { label: 'LEVEL_01 [청소년]', desc: '난이도 01 ~ 30', detail: '초급 논리 및 기초 추론 데이터베이스에 액세스합니다.' },
	adult: { label: 'LEVEL_02 [성인]', desc: '난이도 31 ~ 60', detail: '고급 논리 해킹 및 다차원 추리 프로세서가 가동됩니다.' },
	senior: { label: 'LEVEL_03 [시니어]', desc: '난이도 61 ~ 90', detail: '경험적 직관력 및 통합 인지 패턴 데이터베이스에 접근합니다.' },
};

const GENDER_OPTIONS = [
	{ value: 'male', label: 'MALE [남성]' },
	{ value: 'female', label: 'FEMALE [여성]' },
	{ value: 'other', label: 'UNIDENTIFIED [기타]' },
] as const;
```

with:

```tsx
const AGE_GROUP_LABELS: Record<string, { label: string; desc: string; detail: string }> = {
	teen: { label: '제1관 [청소년]', desc: '난이도 01 ~ 30', detail: '저택 초입, 가벼운 수수께끼가 기다리고 있습니다.' },
	adult: { label: '제2관 [성인]', desc: '난이도 31 ~ 60', detail: '깊은 서재, 얽히고설킨 단서들을 풀어야 합니다.' },
	senior: { label: '제3관 [시니어]', desc: '난이도 61 ~ 90', detail: '오래된 지하실, 연륜과 통찰이 필요한 방입니다.' },
};

const GENDER_OPTIONS = [
	{ value: 'male', label: '남성' },
	{ value: 'female', label: '여성' },
	{ value: 'other', label: '밝히지 않음' },
] as const;
```

- [ ] **Step 2: Update the terminal typing log copy**

Replace:

```tsx
const logs = [
	'INITIALIZING SECURITY PROTOCOL...',
	'ESTABLISHING ENCRYPTED CONNECTION TO SATELLITE...',
	'CHECKING PORT STATE: 10050 STATUS OK',
	'DECRYPTING CENTRAL SYSTEM DOSSIER FILE...',
	'AWAITING AGENT ID AND CREDENTIALS...'
];
```

with:

```tsx
const logs = [
	'촛불을 밝히는 중...',
	'낡은 현관문의 빗장을 여는 중...',
	'저택의 먼지를 털어내는 중...',
	'방문객 기록부를 펼치는 중...',
	'이름과 나이를 기다리는 중...'
];
```

- [ ] **Step 3: Update error messages**

Replace:

```tsx
triggerError('에러: 에이전트 식별 코드가 존재하지 않습니다.');
```

with:

```tsx
triggerError('이름을 알려주셔야 저택에 들어오실 수 있습니다.');
```

Replace:

```tsx
triggerError('에러: 연령 해독 수치가 범위를 벗어났습니다. (8 ~ 100)');
```

with:

```tsx
triggerError('나이는 8세에서 100세 사이로 입력해 주세요.');
```

Replace:

```tsx
alert('경고: 이미 모든 보안 룸을 해제한 요원입니다. 아카이브로 이동합니다.');
```

with:

```tsx
alert('이미 저택의 모든 방을 탈출하셨습니다. 기록실로 안내합니다.');
```

Replace:

```tsx
alert('동기화 완료: 기존 작전 세션이 식별되었습니다. 마지막 해독 지점으로 동기화합니다.');
```

with:

```tsx
alert('이전에 남기신 발자취를 찾았습니다. 마지막으로 계셨던 방으로 안내합니다.');
```

Replace:

```tsx
triggerError('시스템 경고: 메인 컨트롤 네트워크 오프라인. 연결 상태를 재점검하십시오.');
```

with:

```tsx
triggerError('저택과의 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.');
```

- [ ] **Step 4: Update the left dossier panel copy and classNames**

Replace:

```tsx
{/* Watermark badge */}
<div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border-4 border-dashed border-red-950/30 flex items-center justify-center rotate-12 pointer-events-none">
	<span className="text-[10px] font-mono tracking-widest text-red-900/40 uppercase text-center font-bold">
		CONFIDENTIAL DOSSIER<br />DO NOT EXTRACT
	</span>
</div>

{/* Header Stamp */}
<div className="flex justify-between items-start">
	<div className="flex flex-col gap-1 font-mono text-[10px] text-slate-500 tracking-wider">
		<div>DEPT OF SPECIAL LOGIC OPERATIONS</div>
		<div>CASE REF: #00A9-ESCAPE</div>
		<div>DATETIME: {new Date().toISOString().slice(0,10)}</div>
	</div>
	<div className="dossier-stamp px-3 py-1.5 text-xs font-bold font-sans border-2">
		CLASSIFIED
	</div>
</div>

{/* Case Report Content */}
<div className="my-8 flex-1 flex flex-col justify-center">
	<h1 className="text-3xl font-bold font-sans tracking-tight text-slate-100 mb-6 uppercase flex items-center gap-2">
		<span className="text-red-500">▶</span> 작전 개시 보고서
	</h1>

	<div className="space-y-4 text-xs font-mono leading-relaxed text-slate-400">
		<p className="border-l border-red-500 pl-3 py-1">
			<strong>[피실험 대상 보고]</strong> 본 시스템은 인지적 연산 및 기호 규칙을 해독하여 밀실에서 벗어나는 고밀도 암호 해독 훈련망입니다.
		</p>
		<p>
			탈출 요원은 제공되는 <span className="text-emerald-400 font-bold">{TOTAL_ROOMS}개의 격리 룸</span>의 각 통제 패널 암호를 분석 및 우회해야 합니다.
		</p>
		<p>
			사용 가능한 보조 주파수 디코딩(힌트) 횟수는 전체 임무 내 <span className="text-amber-400 font-bold">3회</span>로 제한되며, 각 힌트 해독 시 기록 데이터에 타임 페널티가 누적됩니다.
		</p>
	</div>
</div>
```

with:

```tsx
{/* Watermark badge */}
<div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border-4 border-dashed border-[rgba(122,31,43,0.3)] flex items-center justify-center rotate-12 pointer-events-none">
	<span className="text-[10px] tracking-widest text-[rgba(122,31,43,0.4)] uppercase text-center font-bold">
		봉인된 기록<br />반출 금지
	</span>
</div>

{/* Header Stamp */}
<div className="flex justify-between items-start">
	<div className="flex flex-col gap-1 text-[10px] text-slate-500 tracking-wider">
		<div>저택 관리 사무소</div>
		<div>기록 번호: #00A9-ESCAPE</div>
		<div>작성일: {new Date().toISOString().slice(0,10)}</div>
	</div>
	<div className="dossier-stamp px-3 py-1.5 text-xs font-bold border-2">
		봉인됨
	</div>
</div>

{/* Case Report Content */}
<div className="my-8 flex-1 flex flex-col justify-center">
	<h1 className="text-3xl font-bold tracking-tight text-slate-100 mb-6 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
		<span className="text-[#7a1f2b]">▶</span> 방문객 안내문
	</h1>

	<div className="space-y-4 text-xs leading-relaxed text-slate-400">
		<p className="border-l border-[#7a1f2b] pl-3 py-1">
			<strong>[안내]</strong> 이 저택은 오랜 세월 잠들어 있던 수수께끼의 방들로 이루어져 있습니다. 방문객은 각 방에 남겨진 단서를 풀어야만 다음 방으로 나아갈 수 있습니다.
		</p>
		<p>
			저택에는 <span className="text-[#c9a24b] font-bold">{TOTAL_ROOMS}개의 방</span>이 있으며, 각 방마다 감춰진 암호를 찾아내야 합니다.
		</p>
		<p>
			사용할 수 있는 단서(힌트)는 전체 여정 동안 <span className="text-[#e8965a] font-bold">3회</span>로 제한되며, 단서를 확인할 때마다 소요 시간에 페널티가 더해집니다.
		</p>
	</div>
</div>
```

- [ ] **Step 5: Update terminal log panel classNames**

Replace:

```tsx
{/* Terminal Output Screen at Bottom of Left Panel */}
<div className="p-4 rounded bg-black/90 border border-slate-900 text-[10px] font-mono text-emerald-500 h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1">
	{systemLogs.map((log, idx) => (
		<div key={idx} className="flex gap-2">
			<span className="text-emerald-800">&gt;</span>
			<span>{log}</span>
		</div>
	))}
	<div className="flex gap-1 animate-pulse">
		<span className="text-emerald-800">&gt;</span>
		<span className="w-1.5 h-3 bg-emerald-500" />
	</div>
</div>
```

with:

```tsx
{/* Terminal Output Screen at Bottom of Left Panel */}
<div className="p-4 rounded bg-black/90 border border-[rgba(201,162,75,0.15)] text-[10px] text-[#c9a24b] h-32 overflow-y-auto custom-scrollbar flex flex-col gap-1">
	{systemLogs.map((log, idx) => (
		<div key={idx} className="flex gap-2">
			<span className="text-[rgba(201,162,75,0.5)]">·</span>
			<span>{log}</span>
		</div>
	))}
	<div className="flex gap-1 animate-pulse">
		<span className="text-[rgba(201,162,75,0.5)]">·</span>
		<span className="w-1.5 h-3 bg-[#c9a24b]" />
	</div>
</div>
```

- [ ] **Step 6: Update right panel wrapper and header**

Replace:

```tsx
{/* ── Right Panel: System terminal Form ── */}
<div className="terminal-panel rounded p-8 flex flex-col justify-between relative overflow-hidden scanline-rolling">
	<div className="corner-decor" />

	{/* Panel Header */}
	<div className="flex justify-between items-center mb-8 border-b border-emerald-950 pb-3">
		<div className="flex items-center gap-2">
			<span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
			<span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
				SYSTEM TERMINAL ACCESS
			</span>
		</div>
		<div className="text-[10px] font-mono text-emerald-700">
			PORT: 3001/TCP
		</div>
	</div>
```

with:

```tsx
{/* ── Right Panel: Reception Desk Form ── */}
<div className="antique-panel rounded p-8 flex flex-col justify-between relative overflow-hidden">
	<div className="corner-decor" />

	{/* Panel Header */}
	<div className="flex justify-between items-center mb-8 border-b border-[rgba(201,162,75,0.2)] pb-3">
		<div className="flex items-center gap-2">
			<span className="w-2.5 h-2.5 bg-[#c9a24b] rounded-full candle-flicker" />
			<span className="text-xs font-bold tracking-widest text-[#c9a24b] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
				저택 접수대
			</span>
		</div>
		<div className="text-[10px] text-[rgba(201,162,75,0.5)]">
			방문 기록부
		</div>
	</div>
```

- [ ] **Step 7: Update form field labels and input classNames**

Replace:

```tsx
{/* Agent ID (Name) */}
<div className="flex flex-col gap-2">
	<div className="flex justify-between text-xs tracking-widest text-emerald-600">
		<span>AGENT_IDENTIFIER_CODE // 이름</span>
		<span>[REQUIRED]</span>
	</div>
	<input
		ref={answerInputRef}
		type="text"
		value={name}
		onChange={e => setName(e.target.value)}
		onKeyDown={e => e.key === 'Enter' && handleStart()}
		placeholder="코드명 또는 에이전트 이름 입력..."
		className="terminal-input"
		autoComplete="off"
	/>
</div>
```

with:

```tsx
{/* Name */}
<div className="flex flex-col gap-2">
	<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
		<span>방문객 성함</span>
		<span>[필수]</span>
	</div>
	<input
		ref={answerInputRef}
		type="text"
		value={name}
		onChange={e => setName(e.target.value)}
		onKeyDown={e => e.key === 'Enter' && handleStart()}
		placeholder="성함을 입력해 주세요..."
		className="antique-input"
		autoComplete="off"
	/>
</div>
```

Replace:

```tsx
{/* Gender Toggles */}
<div className="flex flex-col gap-2">
	<div className="text-xs tracking-widest text-emerald-600">
		GEN_CLASSIFICATION // 성별
	</div>
	<div className="grid grid-cols-3 gap-2">
		{GENDER_OPTIONS.map(opt => (
			<button
				key={opt.value}
				type="button"
				onClick={() => setGender(opt.value)}
				className="py-3 text-xs tracking-wider transition-all duration-150 border uppercase"
				style={{
					background: gender === opt.value ? 'rgba(57, 255, 20, 0.12)' : 'rgba(0,0,0,0.4)',
					borderColor: gender === opt.value ? 'var(--color-terminal-green)' : 'rgba(57, 255, 20, 0.15)',
					color: gender === opt.value ? 'var(--color-terminal-green)' : '#4b6151',
					boxShadow: gender === opt.value ? '0 0 10px rgba(57,255,20,0.1)' : 'none',
				}}
			>
				{opt.label}
			</button>
		))}
	</div>
</div>
```

with:

```tsx
{/* Gender Toggles */}
<div className="flex flex-col gap-2">
	<div className="text-xs tracking-widest text-[#a38a4a]">
		성별
	</div>
	<div className="grid grid-cols-3 gap-2">
		{GENDER_OPTIONS.map(opt => (
			<button
				key={opt.value}
				type="button"
				onClick={() => setGender(opt.value)}
				className="py-3 text-xs tracking-wider transition-all duration-150 border"
				style={{
					background: gender === opt.value ? 'rgba(201, 162, 75, 0.12)' : 'rgba(0,0,0,0.4)',
					borderColor: gender === opt.value ? 'var(--color-brass)' : 'rgba(201, 162, 75, 0.15)',
					color: gender === opt.value ? 'var(--color-brass)' : '#6b5f45',
					boxShadow: gender === opt.value ? '0 0 10px rgba(201,162,75,0.12)' : 'none',
				}}
			>
				{opt.label}
			</button>
		))}
	</div>
</div>
```

Replace:

```tsx
{/* Age & Level */}
<div className="flex flex-col gap-2">
	<div className="flex justify-between text-xs tracking-widest text-emerald-600">
		BIOMETRIC_AGE // 나이
		{ageGroupInfo && (
			<span className="text-emerald-400 font-bold animate-badge-pop">
				{ageGroupInfo.label}
			</span>
		)}
	</div>
	<div className="relative">
		<input
			type="number"
			min={8}
			max={100}
			value={age}
			onChange={e => setAge(e.target.value)}
			onKeyDown={e => e.key === 'Enter' && handleStart()}
			placeholder="연령 수치 입력 (8 ~ 100)..."
			className="terminal-input"
		/>
	</div>
	{ageGroupInfo && (
		<div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-emerald-500/80 leading-normal font-mono flex flex-col gap-1">
			<div><strong>[목표 분석 대역폭]:</strong> {ageGroupInfo.desc}</div>
			<div className="text-emerald-700">{ageGroupInfo.detail}</div>
		</div>
	)}
</div>
```

with:

```tsx
{/* Age & Level */}
<div className="flex flex-col gap-2">
	<div className="flex justify-between text-xs tracking-widest text-[#a38a4a]">
		나이
		{ageGroupInfo && (
			<span className="text-[#c9a24b] font-bold animate-badge-pop">
				{ageGroupInfo.label}
			</span>
		)}
	</div>
	<div className="relative">
		<input
			type="number"
			min={8}
			max={100}
			value={age}
			onChange={e => setAge(e.target.value)}
			onKeyDown={e => e.key === 'Enter' && handleStart()}
			placeholder="나이를 입력해 주세요 (8 ~ 100)..."
			className="antique-input"
		/>
	</div>
	{ageGroupInfo && (
		<div className="p-3 bg-[rgba(201,162,75,0.08)] border border-[rgba(201,162,75,0.2)] text-[11px] text-[#c9a24b]/80 leading-normal flex flex-col gap-1">
			<div><strong>[안내될 방]:</strong> {ageGroupInfo.desc}</div>
			<div className="text-[#a38a4a]">{ageGroupInfo.detail}</div>
		</div>
	)}
</div>
```

- [ ] **Step 8: Update error box and submit button**

Replace:

```tsx
{/* Error reporting */}
{errorMessage && (
	<div
		className={`flex items-start gap-2 p-3 bg-red-950/20 border border-red-900/30 rounded ${shakeError ? 'animate-shake' : ''}`}
	>
		<span className="text-red-500 text-xs font-bold">⚠️ SYSTEM_ERROR:</span>
		<p className="text-xs text-red-400 leading-normal font-mono">{errorMessage}</p>
	</div>
)}
```

with:

```tsx
{/* Error reporting */}
{errorMessage && (
	<div
		className={`flex items-start gap-2 p-3 bg-[rgba(122,31,43,0.15)] border border-[rgba(122,31,43,0.3)] rounded ${shakeError ? 'animate-shake' : ''}`}
	>
		<span className="text-[#e6a3ab] text-xs font-bold">⚠</span>
		<p className="text-xs text-[#e6a3ab] leading-normal">{errorMessage}</p>
	</div>
)}
```

Replace:

```tsx
{/* Start Operation Trigger */}
<div className="mt-8 pt-4 border-t border-emerald-950">
	<button
		type="button"
		onClick={handleStart}
		disabled={isSubmitting || isLoading}
		className="btn-terminal w-full py-4 text-sm font-semibold tracking-widest disabled:opacity-40"
	>
		{isLoading ? (
			<span className="flex items-center justify-center gap-2">
				CONNECTING SYSTEM INTEGRITY...
			</span>
		) : isSubmitting ? (
			<span className="flex items-center justify-center gap-2">
				LOGGING AGENT CREDENTIALS...
			</span>
		) : (
			<span className="flex items-center justify-center gap-2">
				LAUNCH OPERATION [작전 개시]
			</span>
		)}
	</button>
</div>
```

with:

```tsx
{/* Start Trigger */}
<div className="mt-8 pt-4 border-t border-[rgba(201,162,75,0.2)]">
	<button
		type="button"
		onClick={handleStart}
		disabled={isSubmitting || isLoading}
		className="btn-antique w-full py-4 text-sm font-semibold tracking-widest disabled:opacity-40"
	>
		{isLoading ? (
			<span className="flex items-center justify-center gap-2">
				저택의 문을 확인하는 중...
			</span>
		) : isSubmitting ? (
			<span className="flex items-center justify-center gap-2">
				방문 기록을 남기는 중...
			</span>
		) : (
			<span className="flex items-center justify-center gap-2">
				저택으로 들어가기
			</span>
		)}
	</button>
</div>
```

- [ ] **Step 9: Remove the mouse-tracking flashlight effect and scanline overlay**

Replace:

```tsx
	// Mouse move flashlight effect
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			document.documentElement.style.setProperty('--x', `${e.clientX}px`);
			document.documentElement.style.setProperty('--y', `${e.clientY}px`);
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

```

with nothing (delete this whole block).

Replace:

```tsx
		<div className="min-h-screen crt-effect flex items-center justify-center p-4 relative overflow-hidden select-none">
			{/* Torch flashlight spotlight element */}
			<div className="flashlight-bg" />

			{/* Scanning line */}
			<div className="scanline-overlay" />

			{/* Main Grid */}
```

with:

```tsx
		<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none" style={{ background: 'var(--color-bg)' }}>
			{/* Static vignette */}
			<div className="vignette-bg" />

			{/* Main Grid */}
```

- [ ] **Step 10: Manual visual check**

Run: `pnpm dev`, navigate to `/start`, confirm: no green terminal styling remains, gold/wine-red palette shows, typing log shows the new Korean copy, age group badge still appears when a valid age is entered, form still submits and routes to `/escape/1` (or resumes existing session) exactly as before.

- [ ] **Step 11: Verify build/lint**

Run: `pnpm lint && pnpm build`
Expected: No errors from `start/page.tsx` (errors from `RoomClient.tsx`/`finish/page.tsx` are expected until Tasks 5-6 are complete).

- [ ] **Step 12: Commit**

```bash
git add src/app/start/page.tsx
git commit -m "style: restyle start page to gothic antique mystery tone"
```

---

### Task 5: Restyle `escape/[roomId]/RoomClient.tsx`

**Files:**
- Modify: `src/app/escape/[roomId]/RoomClient.tsx`

All hooks, state, `handleSubmit`, `handleHint`, `handleBack`, `handleGiveUp`, session persistence, and routing logic stay exactly as-is. Only JSX classNames/inline styles and copy strings change, plus removal of the flashlight effect and decoy-passcode simulation (both are pure visual side-effects with no bearing on game state).

- [ ] **Step 1: Remove the mouse flashlight effect**

Replace:

```tsx
	// Mouse flashlight torch listener
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			document.documentElement.style.setProperty('--x', `${e.clientX}px`);
			document.documentElement.style.setProperty('--y', `${e.clientY}px`);
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	// Cyberpunk decryption decoy passcodes simulation
	useEffect(() => {
		if (isSubmitting) {
			const interval = setInterval(() => {
				const randomHex = Array.from({ length: 8 }, () => 
					Math.floor(Math.random() * 16).toString(16).toUpperCase()
				).join('');
				setDecoyPasscode(`DECRYPTING: [${randomHex}]`);
			}, 70);
			return () => clearInterval(interval);
		} else {
			setDecoyPasscode('');
		}
	}, [isSubmitting]);
```

with:

```tsx
	// Show a quiet "checking the lock..." caption while the answer is verified
	useEffect(() => {
		setDecoyPasscode(isSubmitting ? '자물쇠를 맞춰보는 중...' : '');
	}, [isSubmitting]);
```

(`decoyPasscode` state and its render usage stay — only the content generator changes from random hex to a static Korean caption.)

- [ ] **Step 2: Update the loading screen**

Replace:

```tsx
	if (isLoading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: '#030712' }}
			>
				<div className="flex flex-col items-center gap-4">
					<svg
						className="w-10 h-10 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						style={{ color: 'var(--color-terminal-green)' }}
					>
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
					</svg>
					<p
						className="text-sm tracking-widest uppercase"
						style={{ color: 'var(--color-terminal-green-dim)', fontFamily: 'var(--font-mono)' }}
					>
						Establishing Security Link...
					</p>
				</div>
			</div>
		);
	}
```

with:

```tsx
	if (isLoading) {
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{ background: 'var(--color-bg)' }}
			>
				<div className="flex flex-col items-center gap-4">
					<svg
						className="w-10 h-10 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						style={{ color: 'var(--color-brass)' }}
					>
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
					</svg>
					<p
						className="text-sm tracking-widest"
						style={{ color: 'var(--color-brass-dim)', fontFamily: 'var(--font-serif)' }}
					>
						다음 방으로 이동하는 중...
					</p>
				</div>
			</div>
		);
	}
```

- [ ] **Step 3: Update toast messages in `handleSubmit`**

Replace:

```tsx
				const comboText = nextCombo > 1 ? ` · COMBO x${nextCombo} 🔥` : '';
				pushToast(`SUCCESS: ROOM OVERPASS (+${gainedScore} PTS${comboText})`, 'success', 2500);
```

with:

```tsx
				const comboText = nextCombo > 1 ? ` · 연속 x${nextCombo} 🔥` : '';
				pushToast(`문이 열렸습니다 (+${gainedScore}점${comboText})`, 'success', 2500);
```

Replace:

```tsx
				pushToast('ACCESS DENIED: PASSCODE REJECTED.', 'error', 2500);
```

with:

```tsx
				pushToast('열쇠가 맞지 않습니다.', 'error', 2500);
```

Replace:

```tsx
			pushToast('FATAL EXCEPTION: VALIDATION SEQUENCE INTERRUPTED.', 'error', 2500);
```

with:

```tsx
			pushToast('확인 중 문제가 발생했습니다. 다시 시도해 주세요.', 'error', 2500);
```

- [ ] **Step 4: Update the give-up confirmation copy**

Replace:

```tsx
	const handleGiveUp = () => {
		if (window.confirm('경고: 진행 중인 작전을 철수하고 아카이브로 소환됩니까?')) {
			router.push('/');
		}
	};
```

with:

```tsx
	const handleGiveUp = () => {
		if (window.confirm('탐사를 포기하고 저택을 나가시겠습니까?')) {
			router.push('/');
		}
	};
```

- [ ] **Step 5: Update the root wrapper, remove CRT/scanline, keep `ParticleBackground` and room image**

Replace:

```tsx
		<div
			className="min-h-screen crt-effect text-slate-300 overflow-x-hidden relative select-none"
			style={{
				background: '#040507',
				fontFamily: 'var(--font-mono)',
			}}
		>
			{/* Torch flashlight spotlight */}
			<div className="flashlight-bg" />

			{/* Scanning lines */}
			<div className="scanline-overlay" />

			<ParticleBackground />
```

with:

```tsx
		<div
			className="min-h-screen text-slate-300 overflow-x-hidden relative select-none"
			style={{
				background: 'var(--color-bg)',
				fontFamily: 'var(--font-serif)',
			}}
		>
			{/* Static vignette */}
			<div className="vignette-bg" />

			<ParticleBackground />
```

(Task 6 restyles `ParticleBackground`'s particle color; no change needed here.)

- [ ] **Step 6: Update the HUD row**

Replace:

```tsx
					<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={handleBack}
								className="btn-terminal py-1.5 px-3 text-[11px] font-mono leading-none"
							>
								{`<< RETURN`}
							</button>

							<div className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
								<span className="text-[10px] tracking-widest text-emerald-600 uppercase">
									MONITOR_ON
								</span>
							</div>
						</div>
```

with:

```tsx
					<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={handleBack}
								className="btn-antique py-1.5 px-3 text-[11px] leading-none"
							>
								{`< 이전 방`}
							</button>

							<div className="flex items-center gap-1.5">
								<span className="w-2 h-2 rounded-full bg-[#c9a24b] candle-flicker" />
								<span className="text-[10px] tracking-widest text-[#a38a4a]">
									탐사 중
								</span>
							</div>
						</div>
```

Replace:

```tsx
						{/* Right: Data metrics */}
						<div className="flex items-center gap-2">
							{/* Room ID */}
							<div className="hud-stat text-center border-emerald-950/40 bg-black/60">
								<div className="text-[9px] text-emerald-800 tracking-wider uppercase font-mono">SECTOR</div>
								<div className="text-xs font-bold text-slate-300">
									{roomId.toString().padStart(2, '0')}
									<span className="text-slate-700">/{TOTAL_ROOMS}</span>
								</div>
							</div>

							{/* Score */}
							<div className="hud-stat text-center border-emerald-950/40 bg-black/60 hidden sm:block">
								<div className="text-[9px] text-emerald-800 tracking-wider uppercase font-mono">DATA_PTS</div>
								<div className="text-xs font-bold text-emerald-400">{score}</div>
							</div>

							{/* Combo */}
							{combo > 1 && (
								<div
									className="hud-stat text-center"
									style={{
										background: 'rgba(255,170,0,0.06)',
										borderColor: 'rgba(255,170,0,0.3)',
									}}
								>
									<div className="text-[9px] text-amber-600 tracking-wider uppercase font-mono">COMBO</div>
									<div className="text-xs font-bold text-amber-400">+{combo}</div>
								</div>
							)}

							{/* Hints */}
							<div
								className="hud-stat text-center"
								style={{
									background: hintsRemaining > 0 ? 'rgba(255,170,0,0.08)' : 'rgba(30,41,59,0.3)',
									borderColor: hintsRemaining > 0 ? 'rgba(255,170,0,0.25)' : 'rgba(100,116,139,0.15)',
								}}
							>
								<div className="text-[9px] text-emerald-800 tracking-wider uppercase font-mono">DECRYPT_KEY</div>
								<div
									className="text-xs font-bold"
									style={{ color: hintsRemaining > 0 ? '#ffaa00' : '#475569' }}
								>
									🔑 {hintsRemaining}
								</div>
							</div>
						</div>
```

with:

```tsx
						{/* Right: Stats */}
						<div className="flex items-center gap-2">
							{/* Room ID */}
							<div className="hud-stat text-center border-[rgba(201,162,75,0.2)] bg-black/60">
								<div className="text-[9px] text-[#a38a4a] tracking-wider">방</div>
								<div className="text-xs font-bold text-slate-300">
									{roomId.toString().padStart(2, '0')}
									<span className="text-slate-700">/{TOTAL_ROOMS}</span>
								</div>
							</div>

							{/* Score */}
							<div className="hud-stat text-center border-[rgba(201,162,75,0.2)] bg-black/60 hidden sm:block">
								<div className="text-[9px] text-[#a38a4a] tracking-wider">점수</div>
								<div className="text-xs font-bold text-[#c9a24b]">{score}</div>
							</div>

							{/* Combo */}
							{combo > 1 && (
								<div
									className="hud-stat text-center"
									style={{
										background: 'rgba(232,150,90,0.08)',
										borderColor: 'rgba(232,150,90,0.3)',
									}}
								>
									<div className="text-[9px] text-[#e8965a] tracking-wider">연속</div>
									<div className="text-xs font-bold text-[#e8965a]">+{combo}</div>
								</div>
							)}

							{/* Hints */}
							<div
								className="hud-stat text-center"
								style={{
									background: hintsRemaining > 0 ? 'rgba(232,150,90,0.08)' : 'rgba(30,41,59,0.3)',
									borderColor: hintsRemaining > 0 ? 'rgba(232,150,90,0.25)' : 'rgba(100,116,139,0.15)',
								}}
							>
								<div className="text-[9px] text-[#a38a4a] tracking-wider">단서</div>
								<div
									className="text-xs font-bold"
									style={{ color: hintsRemaining > 0 ? '#e8965a' : '#475569' }}
								>
									🕯 {hintsRemaining}
								</div>
							</div>
						</div>
```

- [ ] **Step 7: Update the main question panel**

Replace:

```tsx
					<div className="terminal-panel rounded p-6 md:p-10 relative overflow-hidden">
						<div className="corner-decor" />

						{/* Top line scan roll */}
						<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

						{/* Badge & Title block */}
						<div className="flex items-start gap-4 mb-6 border-b border-emerald-950 pb-5">
							<div
								className="flex-shrink-0 w-12 h-12 rounded border flex items-center justify-center text-lg font-bold"
								style={{
									background: 'rgba(57, 255, 20, 0.08)',
									borderColor: 'rgba(57, 255, 20, 0.3)',
									color: 'var(--color-terminal-green)',
								}}
							>
								{roomId.toString().padStart(2, '0')}
							</div>
							<div>
								<div className="text-[10px] text-emerald-600 tracking-widest uppercase mb-1">
									{`[CATEGORY_NODE // ${room.type} (난이도: ${room.difficulty})]`}
								</div>
								<h2
									className={`${spaceGrotesk.className} text-xl md:text-3xl font-bold text-slate-100 tracking-wide`}
								>
									{room.title}
								</h2>
							</div>
						</div>

						{/* Question console board */}
						<div
							className="rounded p-5 md:p-6 mb-6"
							style={{
								background: 'rgba(0, 0, 0, 0.7)',
								border: '1px solid rgba(57, 255, 20, 0.15)',
								borderLeft: '4px solid var(--color-terminal-green)',
							}}
						>
							<div className="text-[10px] text-emerald-800 tracking-wider uppercase mb-3 border-b border-emerald-950/40 pb-1">
								{`// INCOMING ENCRYPTED QUESTION DOSSIER`}
							</div>
							<pre
								className="whitespace-pre-wrap leading-relaxed text-sm md:text-base text-slate-300 font-mono"
								style={{ fontWeight: 300 }}
							>
								{room.question}
							</pre>
						</div>
```

with:

```tsx
					<div className="antique-panel rounded p-6 md:p-10 relative overflow-hidden">
						<div className="corner-decor" />

						{/* Top gold hairline */}
						<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[rgba(201,162,75,0.4)] to-transparent" />

						{/* Badge & Title block */}
						<div className="flex items-start gap-4 mb-6 border-b border-[rgba(201,162,75,0.2)] pb-5">
							<div
								className="flex-shrink-0 w-12 h-12 rounded border flex items-center justify-center text-lg font-bold"
								style={{
									background: 'rgba(201, 162, 75, 0.1)',
									borderColor: 'rgba(201, 162, 75, 0.35)',
									color: 'var(--color-brass)',
								}}
							>
								{roomId.toString().padStart(2, '0')}
							</div>
							<div>
								<div className="text-[10px] text-[#a38a4a] tracking-widest mb-1">
									{`${room.type} · 난이도 ${room.difficulty}`}
								</div>
								<h2
									className="text-xl md:text-3xl font-bold text-slate-100 tracking-wide"
									style={{ fontFamily: 'var(--font-display)' }}
								>
									{room.title}
								</h2>
							</div>
						</div>

						{/* Question board */}
						<div
							className="rounded p-5 md:p-6 mb-6"
							style={{
								background: 'rgba(0, 0, 0, 0.55)',
								border: '1px solid rgba(201, 162, 75, 0.15)',
								borderLeft: '4px solid var(--color-brass)',
							}}
						>
							<div className="text-[10px] text-[#a38a4a] tracking-wider mb-3 border-b border-[rgba(201,162,75,0.15)] pb-1">
								이 방에 남겨진 수수께끼
							</div>
							<pre
								className="whitespace-pre-wrap leading-relaxed text-sm md:text-base text-slate-300"
								style={{ fontWeight: 400, fontFamily: 'var(--font-serif)' }}
							>
								{room.question}
							</pre>
						</div>
```

- [ ] **Step 8: Update the target image block, hint status bar, and remove the `spaceGrotesk` import**

Replace:

```tsx
						{/* Target image (Stage 10 spec) */}
						{roomId === 10 && (
							<div
								className="mb-6 rounded overflow-hidden bg-black/80"
								style={{ border: '1px solid rgba(57, 255, 20, 0.15)' }}
							>
```

with:

```tsx
						{/* Target image (Stage 10 spec) */}
						{roomId === 10 && (
							<div
								className="mb-6 rounded overflow-hidden bg-black/80"
								style={{ border: '1px solid rgba(201, 162, 75, 0.15)' }}
							>
```

Replace:

```tsx
						{/* Hints active log */}
						{shownHintsCount > 0 && (
							<div className="flex items-center gap-2 p-3 bg-amber-950/20 border border-amber-900/30 text-xs text-amber-500 rounded mb-6">
								<span className="text-sm">🔑</span>
								<span>
									{`DECODED HINT STATUS: ${shownHintsCount} OF ${hintArray.length} KEYS DISCLOSED.`}
								</span>
								<button
									type="button"
									onClick={() => setIsHintLayerOpen(true)}
									className="ml-auto text-[10px] uppercase underline text-amber-600 hover:text-amber-400 transition-colors"
								>
									[VIEW_DECRYPTED]
								</button>
							</div>
						)}
```

with:

```tsx
						{/* Hints active log */}
						{shownHintsCount > 0 && (
							<div className="flex items-center gap-2 p-3 bg-[rgba(232,150,90,0.1)] border border-[rgba(232,150,90,0.25)] text-xs text-[#e8965a] rounded mb-6">
								<span className="text-sm">🕯</span>
								<span>
									{`단서 ${shownHintsCount} / ${hintArray.length}개를 확인했습니다.`}
								</span>
								<button
									type="button"
									onClick={() => setIsHintLayerOpen(true)}
									className="ml-auto text-[10px] underline text-[#a38a4a] hover:text-[#e8965a] transition-colors"
								>
									다시 보기
								</button>
							</div>
						)}
```

At the top of the file, remove the now-unused import:

```tsx
import { Space_Grotesk } from 'next/font/google';
```

and remove:

```tsx
const spaceGrotesk = Space_Grotesk({
	weight: ['400', '500', '600', '700'],
	subsets: ['latin'],
	display: 'swap',
});
```

- [ ] **Step 9: Update the answer input and action buttons**

Replace:

```tsx
							<div className="relative">
									{/* Typing decryption simulator header */}
									{decoyPasscode && (
										<div className="absolute -top-6 left-2 text-[10px] text-emerald-500 animate-pulse font-mono">
											{decoyPasscode}
										</div>
									)}

									<input
										ref={answerInputRef}
										type={
											room.inputType === 'number'
												? 'number'
												: room.inputType === 'password'
													? 'password'
													: 'text'
										}
										inputMode={room.inputType === 'number' ? 'numeric' : 'text'}
										value={answer}
										onChange={e => setAnswer(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleSubmit(e as unknown as React.FormEvent);
											}
										}}
										placeholder="ENTER SECURITY ACCESS CODE..."
										className={`terminal-input py-4 text-xl md:text-2xl text-center tracking-[0.25em] uppercase font-mono ${inputShake ? 'animate-shake' : ''}`}
										autoComplete="off"
									/>
								</div>
```

with:

```tsx
							<div className="relative">
									{/* Verifying caption */}
									{decoyPasscode && (
										<div className="absolute -top-6 left-2 text-[10px] text-[#c9a24b] animate-pulse">
											{decoyPasscode}
										</div>
									)}

									<input
										ref={answerInputRef}
										type={
											room.inputType === 'number'
												? 'number'
												: room.inputType === 'password'
													? 'password'
													: 'text'
										}
										inputMode={room.inputType === 'number' ? 'numeric' : 'text'}
										value={answer}
										onChange={e => setAnswer(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleSubmit(e as unknown as React.FormEvent);
											}
										}}
										placeholder="암호를 입력하세요..."
										className={`antique-input py-4 text-xl md:text-2xl text-center tracking-[0.25em] uppercase ${inputShake ? 'animate-shake' : ''}`}
										autoComplete="off"
									/>
								</div>
```

Replace:

```tsx
							{/* Actions Console Menu */}
							<div className="flex flex-wrap items-center gap-3 pt-3 border-t border-emerald-950/50">
								{/* Give Up button */}
								<button
									type="button"
									onClick={handleGiveUp}
									className="btn-terminal-warn py-2 px-4 text-xs font-mono"
								>
									{`[GIVE_UP]`}
								</button>

								{/* Hint Decoder trigger */}
								<button
									type="button"
									onClick={handleHint}
									disabled={!canUseHint && shownHintsCount === 0}
									className="btn-terminal py-2 px-4 text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed"
									style={{
										color: canUseHint || shownHintsCount > 0 ? 'var(--color-warn-amber)' : 'rgba(57,255,20,0.3)',
										borderColor: canUseHint || shownHintsCount > 0 ? 'var(--color-warn-amber)' : 'rgba(57,255,20,0.15)',
										background: canUseHint || shownHintsCount > 0 ? 'rgba(255,170,0,0.05)' : 'transparent',
									}}
								>
									{canUseHint
										? `[🔑 DECODING_HINT (${hintsRemaining})]`
										: shownHintsCount > 0
											? '[🔑 REVIEW_HINTS]'
											: '[🔑 DECRYPT_UNAVAILABLE]'}
								</button>

								<div className="flex-1" />

								{/* Submit Button */}
								<button
									type="submit"
									disabled={isSubmitting}
									className="btn-terminal py-3 px-8 text-xs font-bold font-mono tracking-widest disabled:opacity-50"
									style={{
										background: isSubmitting ? 'transparent' : 'rgba(57, 255, 20, 0.1)',
									}}
								>
									{isSubmitting ? 'DECRYPTING...' : 'EXECUTE_OVERPASS_CMD'}
								</button>
							</div>
```

with:

```tsx
							{/* Actions */}
							<div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[rgba(201,162,75,0.15)]">
								{/* Give Up button */}
								<button
									type="button"
									onClick={handleGiveUp}
									className="btn-antique-warn py-2 px-4 text-xs"
								>
									탐사 포기
								</button>

								{/* Hint trigger */}
								<button
									type="button"
									onClick={handleHint}
									disabled={!canUseHint && shownHintsCount === 0}
									className="btn-antique py-2 px-4 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
									style={{
										color: canUseHint || shownHintsCount > 0 ? 'var(--color-candle-amber)' : 'rgba(201,162,75,0.3)',
										borderColor: canUseHint || shownHintsCount > 0 ? 'var(--color-candle-amber)' : 'rgba(201,162,75,0.15)',
										background: canUseHint || shownHintsCount > 0 ? 'rgba(232,150,90,0.06)' : 'transparent',
									}}
								>
									{canUseHint
										? `🕯 단서 확인 (${hintsRemaining})`
										: shownHintsCount > 0
											? '🕯 단서 다시 보기'
											: '🕯 단서 없음'}
								</button>

								<div className="flex-1" />

								{/* Submit Button */}
								<button
									type="submit"
									disabled={isSubmitting}
									className="btn-antique py-3 px-8 text-xs font-bold tracking-widest disabled:opacity-50"
									style={{
										background: isSubmitting ? 'transparent' : 'rgba(201, 162, 75, 0.12)',
									}}
								>
									{isSubmitting ? '확인하는 중...' : '문 열기'}
								</button>
							</div>
```

- [ ] **Step 10: Update the footer and hint modal**

Replace:

```tsx
				{/* Footer security tag */}
				<footer className="pt-4 text-center text-[9px] text-emerald-950 tracking-[0.2em] font-mono">
					{`SECURE CORE HOST // ${typeof window !== 'undefined' ? localStorage.getItem('userHost') || '127.0.0.1' : '127.0.0.1'} // SESSION ENCRYPTED`}
				</footer>
```

with:

```tsx
				{/* Footer */}
				<footer className="pt-4 text-center text-[9px] text-[rgba(201,162,75,0.3)] tracking-[0.2em]">
					저택은 조용히 당신을 지켜보고 있습니다
				</footer>
```

Replace:

```tsx
					<div
						className="terminal-panel-warn rounded-lg w-full max-w-lg overflow-hidden animate-fade-in-scale relative"
						onClick={e => e.stopPropagation()}
					>
						<div className="corner-decor-warn" />

						{/* Modal header */}
						<div
							className="flex items-center justify-between px-6 py-4 border-b border-amber-950"
						>
							<div className="flex items-center gap-2 text-amber-500">
								<span>💡</span>
								<h3
									className="text-xs tracking-widest uppercase font-mono"
								>
									{`DECODING SEQUENCER : DISCLOSED HINT KEYS (${shownHintsCount}/${hintArray.length})`}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setIsHintLayerOpen(false)}
								className="text-amber-800 hover:text-amber-400 transition-colors text-base"
							>
								✕
							</button>
						</div>
```

with:

```tsx
					<div
						className="antique-panel-warn rounded-lg w-full max-w-lg overflow-hidden animate-fade-in-scale relative"
						onClick={e => e.stopPropagation()}
					>
						<div className="corner-decor-warn" />

						{/* Modal header */}
						<div
							className="flex items-center justify-between px-6 py-4 border-b border-[rgba(232,150,90,0.25)]"
						>
							<div className="flex items-center gap-2 text-[#e8965a]">
								<span>🕯</span>
								<h3
									className="text-xs tracking-widest"
									style={{ fontFamily: 'var(--font-display)' }}
								>
									{`밝혀진 단서 (${shownHintsCount}/${hintArray.length})`}
								</h3>
							</div>
							<button
								type="button"
								onClick={() => setIsHintLayerOpen(false)}
								className="text-[rgba(232,150,90,0.6)] hover:text-[#e8965a] transition-colors text-base"
							>
								✕
							</button>
						</div>
```

Replace:

```tsx
							{hintArray.slice(0, shownHintsCount).map((hint, index) => (
								<div
									key={index}
									className="rounded p-4"
									style={{
										background:
											activeHintIndex === index
												? 'rgba(255, 170, 0, 0.1)'
												: 'rgba(0,0,0,0.5)',
										border: `1px solid ${activeHintIndex === index ? 'rgba(255,170,0,0.4)' : 'rgba(255,170,0,0.1)'}`,
									}}
								>
									<div
										className="text-[9px] tracking-widest uppercase mb-1"
										style={{
											color: activeHintIndex === index ? 'var(--color-warn-amber)' : 'rgba(255,170,0,0.4)',
										}}
									>
										{`[HINT_KEY_NODE_${(index + 1).toString().padStart(2, '0')}]`}
									</div>
									<p className="text-slate-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-mono">
										{hint}
									</p>
								</div>
							))}

							{/* Proceed decoding next hint */}
							{canUseHint && (
								<button
									type="button"
									onClick={() => {
										setIsHintLayerOpen(false);
										handleHint();
									}}
									className="w-full py-3 border border-dashed border-amber-900/40 rounded text-xs transition-all duration-200 mt-2 text-amber-800 hover:text-amber-400 hover:border-amber-500/50"
									style={{
										background: 'rgba(255,170,0,0.02)',
									}}
								>
									{`+ TRIGGER NEXT DECRYPTION SEQUENCE (KEYS_REMAINING: ${hintsRemaining})`}
								</button>
							)}
```

with:

```tsx
							{hintArray.slice(0, shownHintsCount).map((hint, index) => (
								<div
									key={index}
									className="rounded p-4"
									style={{
										background:
											activeHintIndex === index
												? 'rgba(232, 150, 90, 0.1)'
												: 'rgba(0,0,0,0.5)',
										border: `1px solid ${activeHintIndex === index ? 'rgba(232,150,90,0.4)' : 'rgba(232,150,90,0.1)'}`,
									}}
								>
									<div
										className="text-[9px] tracking-widest mb-1"
										style={{
											color: activeHintIndex === index ? 'var(--color-candle-amber)' : 'rgba(232,150,90,0.4)',
										}}
									>
										{`단서 ${(index + 1).toString().padStart(2, '0')}`}
									</div>
									<p className="text-slate-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
										{hint}
									</p>
								</div>
							))}

							{/* Reveal next hint */}
							{canUseHint && (
								<button
									type="button"
									onClick={() => {
										setIsHintLayerOpen(false);
										handleHint();
									}}
									className="w-full py-3 border border-dashed border-[rgba(232,150,90,0.35)] rounded text-xs transition-all duration-200 mt-2 text-[rgba(232,150,90,0.7)] hover:text-[#e8965a] hover:border-[rgba(232,150,90,0.6)]"
									style={{
										background: 'rgba(232,150,90,0.02)',
									}}
								>
									{`+ 다음 단서 확인하기 (남은 단서: ${hintsRemaining})`}
								</button>
							)}
```

- [ ] **Step 11: Manual visual check**

Run: `pnpm dev`, navigate to `/escape/1`, confirm: gold/wine-red palette shows throughout, HUD stats render, submitting a wrong answer shows the new toast + shake, submitting the correct answer advances to room 2, hint modal opens/closes correctly, give-up confirm dialog shows new copy.

- [ ] **Step 12: Verify build/lint**

Run: `pnpm lint && pnpm build`
Expected: No errors from `RoomClient.tsx` (errors from `finish/page.tsx` and the two hardcoded-color components are expected until Tasks 6-7 are complete).

- [ ] **Step 13: Commit**

```bash
git add "src/app/escape/[roomId]/RoomClient.tsx"
git commit -m "style: restyle escape room screen to gothic antique mystery tone"
```

---

### Task 6: Restyle `ComboLockInput`, `SpeedrunTimer`, and `ParticleBackground`

**Files:**
- Modify: `src/components/ComboLockInput.tsx`
- Modify: `src/components/SpeedrunTimer.tsx`
- Modify: `src/components/ParticleBackground.tsx`

These three components hardcode emerald/green colors independent of `globals.css`. Only color values and one font reference change — no logic changes.

- [ ] **Step 1: Update `ComboLockInput.tsx` colors**

Replace:

```tsx
          className="w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-black/60 border-2 border-slate-700 
            focus:border-emerald-500 rounded-lg text-3xl md:text-5xl text-center 
            text-emerald-400 font-mono font-bold shadow-inner 
            focus:shadow-[0_0_20px_rgba(16,185,129,0.4)] focus:scale-[1.05] 
            transition-all duration-200 uppercase"
```

with:

```tsx
          className="w-12 h-16 sm:w-16 sm:h-20 md:w-20 md:h-24 bg-black/60 border-2 border-slate-700 
            focus:border-[#c9a24b] rounded-lg text-3xl md:text-5xl text-center 
            text-[#c9a24b] font-bold shadow-inner 
            focus:shadow-[0_0_20px_rgba(201,162,75,0.4)] focus:scale-[1.05] 
            transition-all duration-200 uppercase"
          style={{ fontFamily: 'var(--font-serif)' }}
```

- [ ] **Step 2: Update `SpeedrunTimer.tsx` colors**

Replace:

```tsx
		<div className="flex flex-col items-center bg-black/60 border border-emerald-900/50 p-3 rounded shadow-lg backdrop-blur-sm">
			<div className={`text-2xl md:text-3xl text-emerald-400 tracking-wider ${blackHanSans.className}`}>
				{formatTime(totalTime)}
			</div>
			{penaltyTime > 0 && (
				<div className="text-xs text-red-500/90 font-mono tracking-widest mt-1">
					+ {formatTime(penaltyTime)} PENALTY ({hintsUsed} HINTS)
				</div>
			)}
		</div>
```

with:

```tsx
		<div className="flex flex-col items-center bg-black/60 border border-[rgba(201,162,75,0.3)] p-3 rounded shadow-lg backdrop-blur-sm">
			<div className={`text-2xl md:text-3xl text-[#c9a24b] tracking-wider ${blackHanSans.className}`}>
				{formatTime(totalTime)}
			</div>
			{penaltyTime > 0 && (
				<div className="text-xs text-[#e6a3ab] tracking-widest mt-1" style={{ fontFamily: 'var(--font-serif)' }}>
					+{formatTime(penaltyTime)} (단서 {hintsUsed}회 사용)
				</div>
			)}
		</div>
```

(`Black_Han_Sans` display font for the numeric timer is kept — it's a bold display face used purely for legibility of digits, not part of the terminal theme, and the design spec doesn't call for removing it.)

- [ ] **Step 3: Update `ParticleBackground.tsx` particle color**

Replace:

```tsx
				ctx.fillStyle = 'rgba(16, 185, 129, 0.4)'; // emerald-500
```

with:

```tsx
				ctx.fillStyle = 'rgba(201, 162, 75, 0.35)'; // brass gold, dust-mote feel
```

Replace:

```tsx
				if (dist < 150) {
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(mouse.x, mouse.y);
					ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 - dist / 150})`;
					ctx.stroke();
				}
```

with:

```tsx
				if (dist < 150) {
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(mouse.x, mouse.y);
					ctx.strokeStyle = `rgba(201, 162, 75, ${0.35 - dist / 150})`;
					ctx.stroke();
				}
```

Replace:

```tsx
                    if (pdist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pj.x, pj.y);
                        ctx.strokeStyle = `rgba(16, 185, 129, ${0.2 - pdist / 500})`; // faint connection
                        ctx.stroke();
                    }
```

with:

```tsx
                    if (pdist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pj.x, pj.y);
                        ctx.strokeStyle = `rgba(201, 162, 75, ${0.18 - pdist / 500})`; // faint connection
                        ctx.stroke();
                    }
```

- [ ] **Step 4: Manual visual check**

Run: `pnpm dev`, navigate to a room using a combo-lock input (check `src/lib/rooms-data.ts` for a room with `inputType: 'combo-lock'`) and confirm gold styling; navigate to any room and confirm the timer and floating particles now render gold instead of green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ComboLockInput.tsx src/components/SpeedrunTimer.tsx src/components/ParticleBackground.tsx
git commit -m "style: restyle combo lock, timer, and particle background to gold palette"
```

---

### Task 7: Restyle `finish/page.tsx`

**Files:**
- Modify: `src/app/finish/page.tsx`

All data fetching, score/time calculation, and achievement logic stay exactly as-is. Only the returned JSX classNames and copy change.

- [ ] **Step 1: Replace the page background and card wrapper**

Replace:

```tsx
	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden">
			<Image
				src="/images/finish_background.png"
				alt="배경 이미지"
				fill
				className="object-cover"
				priority
			/>
			<div className="relative z-10 max-w-2xl w-full mx-4">
				<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
					<h1 className="text-4xl font-bold mb-6 text-orange-800">
						🎉 축하합니다!
					</h1>
					<p className="text-xl text-gray-700 mb-8">
						모든 방을 성공적으로 탈출했습니다!
					</p>
```

with:

```tsx
	return (
		<main className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--color-bg)' }}>
			<Image
				src="/images/finish_background.png"
				alt="배경 이미지"
				fill
				className="object-cover opacity-40"
				priority
			/>
			<div className="vignette-bg" />
			<div className="relative z-10 max-w-2xl w-full mx-4">
				<div className="antique-panel rounded-2xl shadow-2xl p-8 text-center">
					<h1 className="text-4xl font-bold mb-6 text-[#c9a24b]" style={{ fontFamily: 'var(--font-display)' }}>
						🕯 탈출을 축하합니다
					</h1>
					<p className="text-xl text-slate-300 mb-8">
						저택의 모든 방에서 무사히 빠져나오셨습니다.
					</p>
```

- [ ] **Step 2: Replace the summary stats block**

Replace:

```tsx
					<div className="bg-orange-50 p-6 rounded-xl mb-8 shadow-inner">
						<p className="text-lg font-medium text-orange-900">
							이름: {playerName}
						</p>
						<p className="text-lg font-medium text-orange-900 mt-2 flex flex-col items-center">
							<span>최종 소요 시간: {timeLabel}</span>
							{penaltyLabel && (
								<span className="text-sm text-red-600 font-bold mt-1">
									{penaltyLabel}
								</span>
							)}
						</p>
						<p className="text-lg font-medium text-orange-900 mt-2">
							최종 점수: {scoreLabel}
						</p>
						<p className="text-lg font-medium text-orange-900 mt-1">
							최고 콤보: x{comboLabel}
						</p>
					</div>
```

with:

```tsx
					<div className="bg-[rgba(201,162,75,0.06)] border border-[rgba(201,162,75,0.2)] p-6 rounded-xl mb-8 shadow-inner">
						<p className="text-lg font-medium text-[#e8d9b0]">
							이름: {playerName}
						</p>
						<p className="text-lg font-medium text-[#e8d9b0] mt-2 flex flex-col items-center">
							<span>최종 소요 시간: {timeLabel}</span>
							{penaltyLabel && (
								<span className="text-sm text-[#e6a3ab] font-bold mt-1">
									{penaltyLabel}
								</span>
							)}
						</p>
						<p className="text-lg font-medium text-[#e8d9b0] mt-2">
							최종 점수: {scoreLabel}
						</p>
						<p className="text-lg font-medium text-[#e8d9b0] mt-1">
							최고 연속: x{comboLabel}
						</p>
					</div>
```

- [ ] **Step 3: Replace the achievements block**

Replace:

```tsx
					<div className="bg-orange-50 p-6 rounded-xl mb-8 shadow-inner text-left">
						<h2 className="text-2xl font-bold text-orange-800 mb-3 text-center">
							🎖️ 업적
						</h2>
						<ul className="space-y-2">
							{achievements.map(item => (
								<li
									key={item}
									className="bg-white/80 rounded-lg px-3 py-2 text-orange-900 text-sm"
								>
									{item}
								</li>
							))}
						</ul>
					</div>
```

with:

```tsx
					<div className="bg-[rgba(201,162,75,0.06)] border border-[rgba(201,162,75,0.2)] p-6 rounded-xl mb-8 shadow-inner text-left">
						<h2 className="text-2xl font-bold text-[#c9a24b] mb-3 text-center" style={{ fontFamily: 'var(--font-display)' }}>
							남겨진 기록
						</h2>
						<ul className="space-y-2">
							{achievements.map(item => (
								<li
									key={item}
									className="bg-black/40 border border-[rgba(201,162,75,0.15)] rounded-lg px-3 py-2 text-[#e8d9b0] text-sm"
								>
									{item}
								</li>
							))}
						</ul>
					</div>
```

- [ ] **Step 4: Replace the leaderboard block and the "back to home" link**

Replace:

```tsx
					<div className="bg-orange-50 p-6 rounded-xl mb-8 shadow-inner">
						<h2 className="text-2xl font-bold text-orange-800 mb-4">
							🏆 TOP 5
						</h2>
						{leaderboardError ? (
							<p className="text-sm text-orange-900">
								{leaderboardError}
							</p>
						) : (
							<div className="space-y-3">
								{topUsers.map((user, index) => (
									<div
										key={user.name}
										className="flex items-center justify-between bg-white/80 p-3 rounded-lg"
									>
										<div className="flex items-center gap-2">
											<span className="font-bold text-orange-600 w-8">
												{index === 0 && '🥇'}
												{index === 1 && '🥈'}
												{index === 2 && '🥉'}
												{index > 2 && '🎖️'}
											</span>
											<span className="font-medium">
												{user.name}
											</span>
											{user.ageGroup && (
												<span className="text-xs text-orange-500">
													({user.ageGroup})
												</span>
											)}
										</div>
										<span className="text-gray-600">
											{Math.floor(user.seconds / 60)}분{' '}
											{user.seconds % 60}초
										</span>
									</div>
								))}
								{topUsers.length === 0 ? (
									<p className="text-sm text-orange-900">
										아직 랭킹 정보가 없습니다.
									</p>
								) : null}
							</div>
						)}
					</div>

					<Link
						href="/"
						className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
					>
						처음으로 돌아가기
					</Link>
```

with:

```tsx
					<div className="bg-[rgba(201,162,75,0.06)] border border-[rgba(201,162,75,0.2)] p-6 rounded-xl mb-8 shadow-inner">
						<h2 className="text-2xl font-bold text-[#c9a24b] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
							방명록 TOP 5
						</h2>
						{leaderboardError ? (
							<p className="text-sm text-[#e8d9b0]">
								{leaderboardError}
							</p>
						) : (
							<div className="space-y-3">
								{topUsers.map((user, index) => (
									<div
										key={user.name}
										className="flex items-center justify-between bg-black/40 border border-[rgba(201,162,75,0.15)] p-3 rounded-lg"
									>
										<div className="flex items-center gap-2">
											<span className="font-bold text-[#c9a24b] w-8">
												{index === 0 && '🥇'}
												{index === 1 && '🥈'}
												{index === 2 && '🥉'}
												{index > 2 && '🕯'}
											</span>
											<span className="font-medium text-[#e8d9b0]">
												{user.name}
											</span>
											{user.ageGroup && (
												<span className="text-xs text-[#a38a4a]">
													({user.ageGroup})
												</span>
											)}
										</div>
										<span className="text-slate-400">
											{Math.floor(user.seconds / 60)}분{' '}
											{user.seconds % 60}초
										</span>
									</div>
								))}
								{topUsers.length === 0 ? (
									<p className="text-sm text-[#e8d9b0]">
										아직 방명록이 비어 있습니다.
									</p>
								) : null}
							</div>
						)}
					</div>

					<Link
						href="/"
						className="inline-block bg-[#c9a24b] hover:bg-[#dcb768] text-[#0d0b12] font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
					>
						처음으로 돌아가기
					</Link>
```

- [ ] **Step 5: Manual visual check**

Run: `pnpm dev`, complete a game (or manually set `localStorage` `startTime`/`endTime`/`score` and navigate to `/finish`), confirm gold/dark palette, achievements and leaderboard render correctly, "처음으로 돌아가기" link works.

- [ ] **Step 6: Verify build/lint**

Run: `pnpm lint && pnpm build`
Expected: Both pass cleanly with zero errors — this is the last file referencing old theme classes/colors.

- [ ] **Step 7: Commit**

```bash
git add src/app/finish/page.tsx
git commit -m "style: restyle finish page to gothic antique mystery tone"
```

---

### Task 8: Final full-flow verification

**Files:** none (verification only)

- [ ] **Step 1: Grep for any remaining references to the old theme**

Run:
```bash
grep -rn "terminal-panel\|terminal-input\|btn-terminal\|crt-effect\|flashlight-bg\|scanline\|var(--color-terminal-green\|var(--color-warn-amber\|var(--color-danger-red\|font-mono\|AGENT\|CLASSIFIED\|DECRYPT" src/app src/components
```
Expected: No matches inside the app/component files touched by this plan (matches inside `src/lib`, `src/store`, `src/types` are out of scope and fine to ignore since they don't render theme).

- [ ] **Step 2: Full build and lint**

Run: `pnpm lint && pnpm build`
Expected: Both exit 0 with no errors or warnings introduced by this work.

- [ ] **Step 3: Full manual playthrough**

Run: `pnpm dev`, then in the browser:
1. Open `/` — drag key into lock, confirm modal, click through to `/start`.
2. Fill in name/gender/age, submit, confirm redirect to `/escape/1`.
3. Answer at least 2 rooms (one correct, one intentionally wrong first) — confirm toasts, HUD, hint modal all render in the gothic antique palette with no leftover green/mono styling.
4. Use "탐사 포기" (give up) on one room, confirm it returns home without breaking session state.
5. (Optional, if time allows) Fast-track to `/finish` by setting `localStorage.setItem('startTime', ...)`/`endTime` manually, or by completing all rooms, and confirm the finish screen renders correctly.

- [ ] **Step 4: Final commit (only if Step 1-3 turned up fixes)**

If any leftover reference was found and fixed:

```bash
git add -A
git commit -m "style: clean up remaining legacy terminal theme references"
```

If nothing needed fixing, skip this step — the work is already fully committed from Tasks 1-7.
