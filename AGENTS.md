# Repository Guidelines

## Project Structure & Module Organization
- `app/` – Next.js App Router (routes, layouts, server actions).
- `pages/` – Legacy routes kept for compatibility.
- `components/` – Reusable UI; prefer colocated subfolders (e.g., `components/charts/`).
- `lib/`, `hooks/`, `contexts/` – Utilities, React hooks, providers.
- `src/` – Shared code referenced via alias `@/*`.
- `public/` – Static assets (images, icons, fonts).
- `styles/` – Tailwind and global CSS.
- `scripts/` – Build/deploy/util scripts (e.g., `validate-env.js`).
- `tests/` – Smoke/E2E tests (Playwright) under `tests/smoke/`.

## Build, Test, and Development Commands
- `npm run dev` – Start local dev server at `http://localhost:3000`.
- `npm run build` – Validate env and build production bundle.
- `npm start` – Serve production build.
- `npm run lint` – ESLint (Next.js + TypeScript rules).
- `npm run export` – Static export for CDN previews.
- Visual: `npm run test:visual` (Percy; requires running app and `PERCY_TOKEN`).
- Smoke (Playwright): `npx playwright test tests/smoke --base-url http://localhost:3000`.
- Perf audit: `npm run perf:audit` (expects local server).

## Coding Style & Naming Conventions
- TypeScript, strict mode enabled; 2‑space indentation.
- React function components; PascalCase for components; kebab‑case for route segments.
- Import via alias `@/*` (e.g., `@/lib/...`, `@/components/...`).
- Linting: `.eslintrc.json` extends `next/core-web-vitals` and `next/typescript`.
- UX copy guard: run `bash scripts/forbid-words.sh` before PRs.

## Testing Guidelines
- Playwright smoke tests live in `tests/smoke/*`. Start the dev server and pass `--base-url`.
- Visual diffs use Percy (`scripts/percy-test.js`). Set `PERCY_TOKEN` and run while the site is up.
- Aim to cover high‑risk routes (`/api/*`, critical pages) with smoke checks.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat(scope): ...`, `fix: ...`, `chore: ...`, `docs: ...`, `build: ...`.
- PRs should include: clear summary, linked issues, test plan (commands + results), and screenshots for UI changes.
- Keep diffs focused; update docs when behavior or env vars change.

## Security & Configuration Tips
- Copy `.env.example` → `.env` and run `npm run check:env`.
- Never commit secrets. Client‑visible vars must be prefixed `NEXT_PUBLIC_`.
