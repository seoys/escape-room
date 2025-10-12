# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `src/app`, with route groups such as `start`, `escape/[roomId]`, and `finish`. Shared UI is under `src/components`, game data and helpers under `src/lib` (e.g. `rooms.ts`, `utils/`). State is centralized in `src/store/gameStore.ts` using Zustand for cross-room progress, while domain types live in `src/types`. Static images and audio belong in `public/assets` or `public/images`; keep large media optimized as WebP where possible.

## Build, Test, and Development Commands
Run `pnpm install` with Node 22+ before anything else. Use `pnpm dev` (TurboPack) for local development, and `pnpm build` + `pnpm start -- -p 10050` to mimic production. `pnpm lint` gates ESLint rules, while `pnpm format` and `pnpm format:check` enforce the Prettier profile. Deployment scripts under the `pm2:*` namespace run the build and restart the PM2 ecosystem config defined in `eco.config.js`.

## Coding Style & Naming Conventions
Code is TypeScript-first; prefer React Server Components unless client state is required (`'use client'`). Tabs are used for indentation in UI files—preserve them. Components and hooks use PascalCase and camelCase respectively, and colocate related styles via Tailwind utility classes or `globals.css`. Always import shared modules through the `@/` alias instead of relative depth chains.

## Testing Guidelines
A formal test suite is still pending. When introducing new features, add component-focused tests with React Testing Library and interaction smoke tests via Playwright under `src/**/__tests__` using the `*.test.tsx` pattern. Ensure new puzzles document edge cases, and capture acceptance criteria in `spec.md` updates. Lint before pushing; in the absence of automated coverage, provide manual QA notes in the PR.

## Commit & Pull Request Guidelines
Follow the existing `type: summary` convention (`feat`, `fix`, `refactor`, etc.) seen in `git log`. Keep messages concise and imperative. Pull requests should include: a short summary, screenshots or screen recordings for UI changes, and references to spec sections or issues. Note any migrations or environment changes, and list verification steps (e.g., `pnpm dev`, puzzle walkthrough) so reviewers can reproduce results quickly.
