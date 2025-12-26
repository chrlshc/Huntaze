# Visual Baseline Guide

This guide explains how to generate and validate visual regression baselines for the Huntaze design system.

## Prerequisites

- Playwright installed (`npx playwright --version`)
- App running at `http://localhost:3000` or set `PW_BASE_URL` / `BASE_URL`

## Workflow

1. Validate setup:
   - `npm run test:visual:validate`
2. Generate baselines (first run or intentional UI changes):
   - `npm run test:visual:update`
3. Review screenshots:
   - `tests/visual/__screenshots__/`
4. Run visual regression tests:
   - `npm run test:visual`

## Optional Helpers

- Guided baseline capture: `npx tsx scripts/capture-visual-baseline.ts`
- HTML report: `npm run test:visual:report`

## Troubleshooting

- Missing snapshots: re-run `npm run test:visual:update`
- Timeouts: ensure the app is running or set `PW_BASE_URL`
- Flaky diffs: ensure animations are disabled and retry once
