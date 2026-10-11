# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — Next.js dev server with Turbopack (http://localhost:3000)
- `pnpm build` — production build; run before committing non-trivial changes to `rooms-data.ts` or UI
- `pnpm start` — serve the production build on port 10050 (mirrors the PM2 process)
- `pnpm lint` — `next lint`; required before opening a PR
- Docker / Portainer: `docker-compose.yml` + `Dockerfile` at the repo root (Portainer "Repository" stack, ref `refs/heads/main`, compose path `docker-compose.yml`). The image builds with `BUILD_STANDALONE=true` (`next.config.js` → `output: 'standalone'`) and serves on port 10050; PM2 (`eco.config.js`) is unaffected. Optional stack env vars: `NEXT_PUBLIC_API_URL` (build-time, empty keeps the tracked `.env` value), `HOST_PORT`.
- `pnpm format` / `pnpm format:check` — Prettier over ts/tsx/js/jsx/json/md
- `pnpm test` — unit tests (`node:test` + `tsx`, files in `src/__tests__/`): room data integrity, puzzle logic, client-payload sanitizing, renderer markup

The unit tests do not cover the UI flow. QA for that is manual: run `pnpm dev` and step through `/`, `/start`, `/escape/[roomId]`, and `/finish`.

## Architecture

Next.js 15 App Router game where players solve a sequence of puzzle "rooms" and progress is persisted to a remote Redis-backed HTTP API.

**Room pool and per-run draw.** `src/lib/rooms-data.ts` holds a pool of 50 rooms (ids 1~50; `POOL_SIZE` in [src/lib/constants.ts](src/lib/constants.ts)). There are no age levels: every new run draws `TOTAL_ROOMS` (30) of the 50 in random order via `pickRoomIds()` ([src/lib/room-pool.ts](src/lib/room-pool.ts)) and stores the draw in the `game_rooms` cookie (`12.3.45…`, dot-separated room ids) and in the server session (`roomIds`) for resuming. `getGameRooms(cookie)` in [src/lib/room-selector.ts](src/lib/room-selector.ts) turns the cookie into the player's 30 rooms (a missing/invalid cookie falls back to rooms 1~30); both the room page and `verifyAnswer()` use it. Routes like `/escape/[roomId]` index into that array with `roomId - 1`, so `roomId` is a *position* (1~30), not a pool id.

**Server/client answer split.** [src/app/escape/[roomId]/page.tsx](src/app/escape/[roomId]/page.tsx) is a server component: it reads the `game_rooms` cookie, resolves the room (and picks a random `variant` if the room has any), and sends `RoomClient` a **sanitized** payload with `answer` stripped out. Answer checking happens exclusively in the server action `verifyAnswer()` in [src/app/actions/game.ts](src/app/actions/game.ts), which re-resolves the same room/variant from the same cookie and does a whitespace/case-insensitive string compare. Never add answer data to the client-bound room object.

**Room variants.** A `Room` can define `variants: RoomVariant[]` (see [src/types/room.ts](src/types/room.ts)) to serve different question text/answers for the same slot; the server page picks one per page load and passes its `variantId` through so `verifyAnswer` checks against the matching variant instead of the base room.

**State layers** — three separate persistence mechanisms that all need to stay in sync when touching game flow:
1. Zustand store ([src/store/gameStore.ts](src/store/gameStore.ts)) — in-memory + localStorage mirror for `currentRoom`, hints, combo/score.
2. Raw `localStorage` keys (`playerName`, `playerKey`, `score`, `combo`, `startTime`, etc.) written directly from `RoomClient.tsx`, not through the store.
3. Remote session ([src/lib/api/redisClient.ts](src/lib/api/redisClient.ts)) — `writeSession`/`readSession`/`fetchLeaderboardSessions` call an external HTTP API (`NEXT_PUBLIC_API_URL` + `/v1/redis/escape_{key}`) that proxies Redis. All calls fail soft (return `null`/`false` and log) if the env var is unset or the request fails, so the game must remain playable without the API.

**Scoring/combo/hint penalties** live inline in `RoomClient.tsx`'s `handleSubmit`/`handleHint` (not extracted to a lib): correct answers award `100 + difficulty*25` plus a combo bonus, minus a flat penalty if a hint was shown for that room; hints are capped globally at 3 (`hintsRemaining` in the store) and each hint used adds a 180s time penalty via `calculateSeconds()`.

**Wrong-answer lockout.** `src/lib/lockout.ts` counts wrong answers across the whole game (`wrongCount`/`lockUntil` in localStorage, cleared by `initGame()`); the 5th wrong answer locks answering for 5 minutes via `LockoutOverlay` in `RoomClient`, and when the lock ends the count restarts. Correct answers do not reduce the count, and the locked time still counts toward the run time.

**Special input types.** `Room.inputType` (`text` | `number` | `password` | `choice` | `combo-lock` | `tile-order`) drives which control `RoomClient` renders — `ComboLockInput` or `TileOrderInput` for the two custom ones, a plain `<input>` otherwise. `tiles` (for `tile-order`) are shuffled server-side per page load. `choice` renders `ChoiceInput` from `options`; `tile-order` rooms may add `tileImages` (tile id → image) for picture tiles.

**Visual puzzles.** A room/variant may carry `visual` (a `PuzzleVisual`: `image | grid | note | symbol-rows | shape-matrix | statements`), rendered by `PuzzleVisualView` in `src/components/puzzle-visuals/`. Sample rooms live in `src/lib/visual-rooms/` and are merged into `rooms` by id in `rooms-data.ts` (`FINAL_ROOM_ID` in `visual-rooms/index.ts` maps each sample to the room slot it replaces); rooms 31~50 are authored directly under their final ids (`extra-*.ts`). `visual`/`options` are display data and reach the browser through `toClientRoom()` (`src/lib/client-room.ts`), so never put an answer in them — hidden grid cells have their text stripped there. Illustrations go in `public/puzzles/`.

## Conventions

- Import via the `@/*` path alias (maps to `src/*`); tabs for indentation (see existing files), Prettier-enforced otherwise.
- Client components need `"use client"`; keep server-only logic (especially anything touching answers) in server components/actions.
- Commit messages: Korean, format `[type] message` where type is one of `feat|fix|refactor|chore|docs|style|perf|test|build`.
- When adding/editing rooms in `rooms-data.ts`, keep hint/answer strings concise to avoid layout shifts, and keep ids contiguous from 1 to `POOL_SIZE` (the draw and `getGameRooms()` look rooms up by id; see Architecture above).
