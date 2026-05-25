# CLAUDE.md — Working Instructions for Claude Code

## Project

SynDesk — an open-source seating chart web app for education and events.
Full spec: see `docs/SPEC.md`. Treat that document as the source of truth.

## My situation

- I am a beginner. Explain decisions as you make them.
- I will read every file you create or modify. If I don't understand something, I will ask. Write code I can learn from.
- I want to ship a portfolio-worthy v1.0. Cut scope before cutting quality.

## How to work with me

1. **One task at a time.** Don't build "the whole attendee roster page" in one shot. Break work into commits I can review individually.
2. **Plan before coding.** For any task larger than a single file, write a brief plan first and wait for me to approve it.
3. **Explain as you go.** When you introduce a new pattern, library, or concept, add a 2–3 sentence comment in the code or summarize it in your reply. I'd rather move slower and understand.
4. **Ask, don't assume.** If the spec is ambiguous, ask me. Don't pick for me on architectural or product decisions.
5. **Test what you build.** Especially the seating algorithm — that's the portfolio centerpiece. Aim for 90%+ coverage there.
6. **Commit frequently with clear messages.** One logical change per commit. Conventional commits style: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`.
7. **Run things before claiming they work.** Use the dev server, run tests, check the browser console. Don't say "this should work" — verify it works.

## Tech stack (locked for v1.0)

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- TanStack Query (server state) + Zustand (client state)
- React Hook Form + Zod
- dnd-kit for drag-and-drop
- Vitest (unit) + Playwright (E2E)
- Deployed on Vercel

Do not introduce new dependencies without proposing them first and explaining the tradeoff.

## Data lifecycle invariants

These rules are non-negotiable. See §9 of the spec for full context.

- **Mark charts stale in the app layer, not Postgres triggers.** When mutating `attendees`, `cohorts`, or `layouts`, update the `stale` flag and append to `stale_reasons` on every affected `seating_charts` row in the same mutation. Triggers are invisible side effects and harder to debug.
- **Never delete a layout that's referenced by a chart.** Block the action and surface the chart count to the user: *"This layout is used by 3 charts. Delete or duplicate them first."*
- **Never silently drop data.** When a referenced attendee, cohort, or seat position disappears, the seat renders as empty with a warning indicator — the underlying assignment stays in the DB until the user explicitly regenerates or clears.
- **Algorithm placements must record their reasons.** Every seat in a generated chart carries an `explanations[]` array (see SPEC §6.4). Seat tooltips and the issues panel both read from this — do not duplicate the logic in the UI.

## Architectural Decisions

- **Cohorts are optional but encouraged.** Cohorts are the grouping primitive across workspace types: class periods in education, event groups/families/RSVP batches in events. Chart generation does NOT require a cohort; users can select all attendees to skip grouping.
- **Workspace type controls language and defaults, not ownership.** `profiles.workspace_type` can be `education` or `events`. The underlying database model uses `attendees`; education UI may still say "students" where that helps users.
- **Manual score invalidation.** Any manual swap in the seating chart view clears the algorithmically generated score and explanations. This ensures the UI doesn't display stale or misleading metrics after the user has manually overridden the optimized layout.

## What's in `/reference`

Old WordPress plugin code with the same product idea. Use it for feature scope and visual reference only. Do NOT port it line-by-line — it has real bugs and mixed responsibilities. Architect the new version cleanly from the spec.

## Out of scope for v1.0

Listed in `docs/SPEC.md` §11. If a feature isn't there, ask before building it. We are deliberately cutting scope to ship.

## When you get stuck

Tell me what's blocking you and what options you considered. Don't hack around problems silently.
