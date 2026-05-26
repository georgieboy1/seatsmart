# CLAUDE.md — SynDesk Development Guide

## Project Vision
SynDesk is a specialized classroom seating tool for educators. It uses a technical "Blueprint" aesthetic and an optimization algorithm to help teachers manage student accommodations and social dynamics.

## v1.0 Core Constraints
- **Industry Lock:** This project is exclusively for the **Education/Classroom** market. 
- **Terminology:** Always use "Student", "Class", "Accommodation", "Peer Support", and "Avoid Pairing". 
- **UI Aesthetic:** Utilitarian, precision-focused, deep blue/blueprint grid themes.
- **Marketplace/Events:** Do NOT implement or surface marketplace, venue, vendor, or event-planning features. Any existing code related to these is legacy and should remain hidden.

## Coding Standards
- **Next.js 16 (App Router):** Use Server Components for data fetching and Client Components for interactivity.
- **Tailwind CSS 4:** Adhere to the brutalist, zero-radius design system.
- **Supabase:** Leverage RLS for all table access.
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
- Deployed on **Vercel**.
- All PRs must pass `npm run lint` and `npm run build` to ensure market readiness.
- **Market Integrity:** Marketplace and event planning code is legacy/unsupported in v1.0. Do not surface any UI or docs related to these features.
