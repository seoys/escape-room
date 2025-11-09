# Escape Room Web Game

Interactive web escape-room experience featuring a sequence of themed puzzles, persistent player sessions, and a live leaderboard backed by Redis.

## Overview
- Players register on `/start`, receive three shared hints, and advance through numbered rooms hosted under `/escape/[roomId]`.
- Puzzle content, answers, and media live in `src/lib/rooms.ts` and `public/images`, enabling designers to iterate without touching routing code.
- Server-side APIs (provided separately) are reached via `NEXT_PUBLIC_API_URL` to track session metadata, hint usage, and leaderboard entries exposed on `/finish`.

## Key Features
- Puzzle progression gatekept by Zustand store and localStorage, with resume support for returning players.
- Automatic Redis logging on room entry/exit for analytics and ranking.
- Responsive Tailwind-driven UI with optimized WebP backgrounds per room.
- Finish page pulls top completion times and highlights the current player.

## Tech Stack
- Next.js 15 (App Router, React Server + Client Components)
- React 19 + Zustand state management
- Tailwind CSS with custom scrollbar plugin
- Redis (remote) for persistence and leaderboard storage

## Project Structure
```
src/
  app/
    page.tsx          # landing page -> start screen
    start/            # player registration and session bootstrap
    escape/[roomId]/  # dynamic puzzle room renderer
    finish/           # leaderboard and completion summary
  components/         # shared UI (e.g., Card)
  lib/                # puzzle data, helpers, user info utils
  store/              # Zustand game state store
  types/              # shared TypeScript definitions
public/
  images/             # room backgrounds (prefer WebP)
  assets/             # auxiliary media
```

## Getting Started
1. Install Node.js 22+ and enable pnpm (`corepack enable`).
2. Install dependencies: `pnpm install`.
3. Create `.env.local` and provide `NEXT_PUBLIC_API_URL` pointing to the Redis API gateway.
4. Run the dev server: `pnpm dev` (Turbopack) and open `http://localhost:3000`.

## Environment Variables
- `NEXT_PUBLIC_API_URL`: Base URL for escape-room Redis endpoints (e.g., `https://api.example.com`). Must expose `/v1/redis/...` routes used for player state and leaderboard queries.

## Available Scripts
- `pnpm dev` — start Next.js with Turbopack for local development.
- `pnpm build` — generate the production build.
- `pnpm start -- -p 10050` — serve the build locally on port 10050.
- `pnpm lint` — run ESLint with the Next.js configuration.
- `pnpm format` / `pnpm format:check` — apply or verify Prettier formatting.
- `pnpm pm2:start|stop|restart|delete|logs|monit` — helper commands around the PM2 ecosystem config in `eco.config.js` for server deploys.

## Game Data & Testing
- Update puzzle metadata in `src/lib/rooms.ts`, card content in `src/lib/cardWords.ts`, and shared helpers under `src/lib/utils/`.
- Add future tests using React Testing Library/Playwright under `src/**/__tests__` with the `*.test.tsx` naming pattern. Until automation lands, document manual QA steps in PRs.

## Deployment Notes
- The production process expects a Redis instance reachable from the configured API URL.
- For PM2 hosting, build locally (`pnpm build`) and manage processes with the scripts above; `eco.config.js` defines the runtime entry.

## Contributing
- Follow the repository guide in `AGENTS.md` for style, testing, and PR expectations.
- Keep commit messages in the `type: summary` format (e.g., `feat: add room timer`).
- Coordinate puzzle content changes with updates to `spec.md` so designers and developers stay aligned.
