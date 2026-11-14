# CLAUDE.md — SynDesk Development Guide

## Project Vision
SynDesk is a specialized classroom seating tool for educators. It uses a technical "Blueprint" aesthetic and an optimization algorithm to help teachers manage student accommodations and social dynamics.

## v1.0 Core Constraints
- **Industry Lock:** This project is exclusively for the **Education/Classroom** market. 
- **Terminology:** Always use "Student", "Class", "Accommodation", "Peer Support", and "Avoid Pairing". 
- **UI Aesthetic:** Utilitarian, precision-focused, deep blue/blueprint grid themes.
- **Marketplace/Events:** Do NOT implement or surface marketplace, venue, vendor, or event-planning features. Any existing code related to these is legacy and should remain hidden.

## Architecture: local-first, no server
- **No accounts, no backend, no database.** All data lives in the teacher's browser (`localStorage`) via `src/lib/local/store.ts`. Student data must never be sent anywhere. Do not add analytics, third-party scripts or network calls that carry user data.
- **Static export.** `next.config.ts` sets `output: "export"`. Every page is a Client Component that reads data through the hooks in `src/lib/local/hooks.ts`. No Server Actions, Route Handlers, `cookies()`, `headers()` or dynamic route segments (`[id]`); pass IDs as query strings (`/charts/view?id=…`) and wrap `useSearchParams` in `<Suspense>`.
- **Save functions** live in `src/lib/{students,classes,layouts,charts}/actions.ts`. They write to the local store and navigate with `go()` from `src/lib/local/nav.ts` (the client stand-in for `redirect`).
- **Backups** (`createBackup` / `parseBackup` in the store) are the only way data moves between devices. Bump `BACKUP_VERSION` and handle old versions if the row shapes change.
- **Offline:** `public/sw.js` caches pages network-first. Add new routes to its `PRECACHE` list.

## Coding Standards
- **Next.js 16 (App Router)**, static export only (see above).
- **Tailwind CSS 4:** Adhere to the brutalist, zero-radius design system.
- **IDs are UUIDs.** Zod schemas validate class and student IDs with `.uuid()`; anything that creates rows (including sample data) must use valid UUIDs.
- **Types over `any`:** Maintain strict TypeScript compliance for all data transformations.

## Common Tasks

### Adding a new Accommodation type
1. Update `src/lib/students/constants.ts`.
2. Add a corresponding icon in `src/components/charts/seat-item.tsx`.
3. Update the scoring weights in `src/lib/seating/scoring.ts`.

### Modifying the Seating Algorithm
1. The algorithm is split into three phases in `src/lib/seating/`.
2. Always add a corresponding unit test in `*.test.ts` to verify the new rule.
3. Run `npm test` before committing.

## Deployment
- `npm run build` writes a static site to `out/`. `npm run deploy` (from a clean `main`) lints, tests, builds and publishes `out/` to the `gh-pages` branch, which GitHub Pages serves at https://syndesk.futureoftheisles.org (`public/CNAME`). `public/.nojekyll` must stay, or Pages hides `_next/`.
- Released by **KC Studio**, a Future of the Isles studio, as a free tool listed on futureoftheisles.org/make.
- All changes must pass `npm run lint`, `npm test`, `npm run build` and `npm run e2e`.
- **Market Integrity:** Marketplace and event planning code is legacy/unsupported in v1.0. Do not surface any UI or docs related to these features.
