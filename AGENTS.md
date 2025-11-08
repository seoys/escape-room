# Repository Guidelines

## Project Structure & Module Organization
The app uses Next.js App Router with all routes in `src/app`: `page.tsx` drives the landing page, `start` manages player onboarding, `escape/[roomId]` renders puzzle-specific UI, and `finish` reports completion. Shared puzzle metadata lives in `src/lib/rooms.ts`, global state (current room, hints, player data) is centralized in `src/store/gameStore.ts` via Zustand, and strongly typed contracts sit in `src/types/room.ts`. Static assets and puzzle imagery belong in `public/`, while deployment/process settings are defined in `eco.config.js`. Reference `spec.md` whenever adding new rooms so narrative, difficulty curve, and UI expectations stay aligned.

## Build, Test, and Development Commands
- `pnpm dev` — Runs Next.js with Turbopack at http://localhost:3000 for rapid iteration.
- `pnpm build` — Creates an optimized production bundle; run before committing complex UI or data changes.
- `pnpm start` — Serves the built bundle on port 10050 (mirrors the PM2 process defined in `eco.config.js`).
- `pnpm lint` — Executes `next lint`; required prior to opening a PR.
- `pnpm format` / `pnpm format:check` — Applies or verifies Prettier formatting for TS/JS/JSON/MD files.
- `pnpm pm2:start|stop|restart` — Utility scripts for the production instance; never run locally unless you mirror the server setup.

## Coding Style & Naming Conventions
Use TypeScript everywhere, keep imports path-based via the `@/` alias, and prefer functional React components with `"use client"` added only when stateful hooks are needed. Follow Prettier defaults (2-space indentation, double quotes in TSX) and rely on Tailwind utility classes plus shadcn primitives for styling; co-locate component-specific styles in `globals.css` only when multiple pages reuse them. Name files and folders in kebab-case (`start`, `game-store`) and components/types in PascalCase (`FinishPage`, `RoomData`). Update `rooms.ts` with descriptive IDs, enforce schema via `Room` type, and keep hint/answer strings concise to avoid layout shifts.

## Testing Guidelines
There is not yet an automated test harness; perform targeted manual QA by running `pnpm dev`, stepping through `/start`, `/escape/[roomId]`, and `/finish`, and ensuring Redux-backed Redis sync requests succeed. When adding logic, include at least smoke tests via React Testing Library or Playwright under `src/__tests__` (mirroring route structure) and assert room data integrity by snapshotting `rooms.ts`. Document reproduction steps in the PR description until automated coverage lands.

## Commit & Pull Request Guidelines
Recent commits follow a concise, descriptive style (often sentence-case summaries, occasionally bilingual) that call out both scope and motivation—mirror that cadence, e.g., “Update room 9 puzzle flow and associated assets.” Squash micro-commits locally; reference related issues or checklist items in the body. PRs should include: context that ties back to `spec.md`, a bulleted change list, screenshots or recordings for UI tweaks, notes on data migrations, and confirmation that `pnpm build` and `pnpm lint` pass. Highlight any Redis schema or PM2 config impacts so deploys remain predictable.

## Security & Configuration Tips
Node 22+ is enforced via `package.json`, so confirm your local runtime matches before installing dependencies. Secrets (Redis URLs, API tokens) belong in `.env.local`; never hardcode them in components or commit that file. When touching `eco.config.js` or remote fetch URLs (`https://api.sosohappy.synology.me/v1/redis/...`), validate that request payloads omit personal identifiers and that error branches fail closed to avoid leaking puzzle answers.
