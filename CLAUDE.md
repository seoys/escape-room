# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — Next.js dev server with Turbopack (http://localhost:3000)
- `pnpm build` — production build; run before committing non-trivial changes to `rooms-data.ts` or UI
- `pnpm start` — serve the production build on port 10050 (mirrors the PM2 process)
- `pnpm lint` — `next lint`; required before opening a PR
- `pnpm format` / `pnpm format:check` — Prettier over ts/tsx/js/jsx/json/md

There is no automated test suite. QA is manual: run `pnpm dev` and step through `/`, `/start`, `/escape/[roomId]`, and `/finish`.

## Architecture

Next.js 15 App Router game where players solve a sequence of puzzle "rooms" and progress is persisted to a remote Redis-backed HTTP API.

**Level → room selection.** `src/lib/rooms-data.ts` holds 120 rooms (four difficulty tracks of 30). A player's `level` (1-4, derived from age via `src/lib/level.ts`) is stored in the `player_level` cookie and used by `getRoomsForLevel()` in [src/lib/room-selector.ts](src/lib/room-selector.ts) to slice out the 30 rooms for that track: rooms 1-30 = level 1, 31-60 = level 2, etc. `TOTAL_ROOMS` in [src/lib/constants.ts](src/lib/constants.ts) (30) is the per-track room count, not the total dataset size — routes like `/escape/[roomId]` index into the level-filtered array with `roomId - 1`, not into the raw `rooms` array.

**Server/client answer split.** [src/app/escape/[roomId]/page.tsx](src/app/escape/[roomId]/page.tsx) is a server component: it reads the level cookie, resolves the room (and picks a random `variant` if the room has any), and sends `RoomClient` a **sanitized** payload with `answer` stripped out. Answer checking happens exclusively in the server action `verifyAnswer()` in [src/app/actions/game.ts](src/app/actions/game.ts), which re-resolves the same room/variant by id and does a whitespace/case-insensitive string compare. Never add answer data to the client-bound room object.

**Room variants.** A `Room` can define `variants: RoomVariant[]` (see [src/types/room.ts](src/types/room.ts)) to serve different question text/answers for the same slot; the server page picks one per page load and passes its `variantId` through so `verifyAnswer` checks against the matching variant instead of the base room.

**State layers** — three separate persistence mechanisms that all need to stay in sync when touching game flow:
1. Zustand store ([src/store/gameStore.ts](src/store/gameStore.ts)) — in-memory + localStorage mirror for `currentRoom`, hints, combo/score.
2. Raw `localStorage` keys (`playerName`, `playerKey`, `score`, `combo`, `startTime`, etc.) written directly from `RoomClient.tsx`, not through the store.
3. Remote session ([src/lib/api/redisClient.ts](src/lib/api/redisClient.ts)) — `writeSession`/`readSession`/`fetchLeaderboardSessions` call an external HTTP API (`NEXT_PUBLIC_API_URL` + `/v1/redis/escape_{key}`) that proxies Redis. All calls fail soft (return `null`/`false` and log) if the env var is unset or the request fails, so the game must remain playable without the API.

**Scoring/combo/hint penalties** live inline in `RoomClient.tsx`'s `handleSubmit`/`handleHint` (not extracted to a lib): correct answers award `100 + difficulty*25` plus a combo bonus, minus a flat penalty if a hint was shown for that room; hints are capped globally at 3 (`hintsRemaining` in the store) and each hint used adds a 180s time penalty via `calculateSeconds()`.

**Special input types.** `Room.inputType` (`text` | `number` | `password` | `choice` | `combo-lock` | `tile-order`) drives which control `RoomClient` renders — `ComboLockInput` or `TileOrderInput` for the two custom ones, a plain `<input>` otherwise. `tiles` (for `tile-order`) are shuffled server-side per page load.

## Conventions

- Import via the `@/*` path alias (maps to `src/*`); tabs for indentation (see existing files), Prettier-enforced otherwise.
- Client components need `"use client"`; keep server-only logic (especially anything touching answers) in server components/actions.
- Commit messages: Korean, format `[type] message` where type is one of `feat|fix|refactor|chore|docs|style|perf|test|build`.
- When adding/editing rooms in `rooms-data.ts`, keep hint/answer strings concise to avoid layout shifts, and remember IDs determine level bucket (see Architecture above).
