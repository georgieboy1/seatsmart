# SeatSmart — Product Specification v1.0

An adaptable seating chart tool for classrooms and events. Users model a physical room once, enter attendees with relevant constraints, and generate an optimized seating chart they can fine-tune manually.

## 1. Vision & Goals

**Problem:** Seating is tedious whenever a room has human constraints. Teachers balance accommodations, peer dynamics, and behavior; event hosts balance families, accessibility needs, dietary constraints, and separation requests. Most people either redo it manually each time or use a simplistic alphabetical/table-list approach.

**Solution:** A web app where users choose a workspace type (`education` or `events`), model their physical layout once, enter attendees with relevant traits/constraints, and get an optimized seating chart in seconds — with the ability to fine-tune by dragging attendees around.

**Success looks like:** A user creates a chart in under 10 minutes that they would actually use for tomorrow's class, dinner, ceremony, workshop, or reception.

**Out of scope for v1.0:** Multi-user collaboration, attendance tracking, grade/LMS integration, guest messaging, billing/payments, mobile app, table-service operations, and fully custom constraint taxonomies.

## 2. Target User

Primary personas:

- **Education:** Middle/high school teacher, 1–25 years experience, manages classes of 20–35 attendees/students, low-to-medium technical skill, usually views on a laptop and occasionally prints charts.
- **Events:** Event host, planner, or coordinator arranging 20–150 attendees with family groups, dietary constraints, health/accessibility needs, and relationship preferences.

The UI should keep education language familiar while allowing events users to work with attendees rather than students.

## 3. Core Concepts (Data Model)

### Layout

A rectangular grid representing the physical room. Two layout types:

- **Traditional:** rows × columns of seats with a perimeter of non-seat cells around the edge.
- **Groups:** N groups of M attendees each, arranged in clusters. All groups are the same size in v1.0; users needing an odd group can toggle an interior seat cell to "empty" (see §5.3).

Perimeter cells can be one of: `door`, `window`, `teacher_desk`, `whiteboard`, `charging_station`, or plain perimeter (wall). Interior cells are `seat` (assignable) or `empty` (blocked).

A layout has: `id`, `name`, `type` (traditional | groups), `rows`, `columns`, `grid[][]` (cell types), `created_at`, `updated_at`.

### Attendee

An attendee belongs to a user. In education workspaces, the UI may label attendees as students; in events workspaces, it should use attendee/guest language. Fields:

- `id`, `user_id`, `name` (required)
- `external_id` — optional school ID, RSVP ID, ticket number, or imported system identifier
- `age` — optional integer for youth events or student contexts
- `family_name` — optional grouping label for family/household placement
- `prosocial_traits[]` — multi-select from a fixed list (helpful, focused, leader, calm, encouraging, etc.)
- `antisocial_traits[]` — multi-select (talkative, distracted, disruptive, off-task, etc.)
- `constraints[]` — multi-select for dietary, accessibility, and room-placement needs
- `allergies[]` — multi-select or imported list for food/environmental allergies
- `health_flags[]` — health or safety flags the user needs visible during seating
- `together_ids[]` — array of other attendee IDs they should sit with or near
- `separate_ids[]` — array of other attendee IDs to keep separated
- `cohort_id` — optional group such as class period, wedding side, team, table group, or RSVP cohort
- `notes` — free-text (optional)

Trait and constraint lists are **fixed in v1.0**. Custom taxonomies are a v1.1 feature; the `notes` field is the escape hatch for anything not captured by the fixed list.

### Seating Chart

A specific assignment of attendees to a layout's seats.

- `id`, `user_id`, `layout_id`, `name`
- `cohort_id` — optional group filter used when the chart was generated
- `assignments` — map of seat_position → attendee_id
- `locked_seats` — positions the user manually locked
- `score` — score at last save (recomputed on view)
- `stale`, `stale_reasons[]` — see §9
- `created_at`, `updated_at`

## 4. User Flows

### Flow 1: First-time setup

1. Land on `/` → sign up with email/password (Supabase Auth)
2. Verify email
3. Land on `/dashboard` → empty state with "Create your first layout" CTA
4. Walk through layout builder → save
5. Walk through attendee/roster builder → save
6. Click "Generate Seating Chart" → see result

Target: < 15 minutes from signup to first chart.

### Flow 2: Returning user generates a new chart

1. Log in → dashboard shows recent layouts and attendees
2. Click "Generate Seating Chart" → pick layout, options, generate
3. Drag attendees to fine-tune → save
4. Export as PNG or CSV → print

Target: < 2 minutes.

### Flow 3: Updating roster mid-term

1. Dashboard → "Attendees" → add/edit/remove
2. Regenerate existing chart with new roster (or accept the stale state — see §9.3)

## 5. Screen Specifications

### 5.1 Auth screens

`/login` and `/signup` — minimal Supabase Auth UI: email, password, submit. Forgot-password flow included. Email verification required before app access.

### 5.2 Dashboard (`/dashboard`)

Home base after login. Shows:

- Greeting with the user's display name
- Workspace toggle (`education` | `events`) that changes labels and defaults without changing the underlying data model
- Cards for layouts, attendees/cohorts, and recent charts
- Primary CTA: "Generate Seating Chart" (disabled if no layout or fewer than 2 attendees)
- Empty states with clear guidance for new users

### 5.3 Layout Builder (`/layouts/new` and `/layouts/[id]`)

The most visually complex screen.

**Top bar:** layout name (editable), layout type selector (Traditional / Groups), Save button.

**Left panel (controls):**
- For Traditional: rows (1–10) and columns (1–10) number inputs
- For Groups: number of groups (1–12) and attendees per group (1–8)
- "Apply" button regenerates the grid (warns if changes will be lost)

**Center:** the editable grid. Cells render with color and abbreviation (D=door, W=window, TD=teacher desk, WB=whiteboard, CS=charging station, P=perimeter wall, S=seat, blank=empty). Click a perimeter cell to cycle its type. Click an interior cell to toggle seat ↔ empty.

**Right panel:** legend with all cell types and brief tooltips.

**Bottom:** Save, Duplicate, Delete, Cancel buttons.

### 5.4 Attendee Roster (`/attendees`)

Table view with inline editing where possible.

**Columns:** Name, Cohort, Constraints (chips), Allergies/health flags (chips), Together (count), Separate (count), Actions (edit, delete).

**Above the table:**
- Search bar (filters by name)
- "Add Attendee" button (opens modal; education workspace may label this "Add Student")
- "Import CSV" button (uploads a CSV with columns such as name, cohort, constraints, allergies, together, separate — comma-separated within cells)
- "Export CSV" button

**Add/Edit modal:** name, cohort, multi-select dropdowns for constraints/allergies/health flags, together and separate pickers that filter the existing attendee list. Save creates/updates; Cancel discards.

### 5.5 Seating Chart View (`/charts/new` and `/charts/[id]`)

**Top bar:** chart name, layout used (read-only), Generate / Regenerate button, Save button, Export dropdown (PNG, CSV, JSON). If the chart is stale, a banner appears here — see §9.3.

**Center:** the layout grid with attendees placed in seats. Each seat shows attendee name and small icons for key constraints. Empty seats show "—". Locked seats show a small lock icon. Hover any seat to see its explanations (§6.4).

**Right panel:**
- "Generation options" (checkboxes): Honor constraints, Keep together groups, Respect separate list, Spread high-conflict attendees, Reset random seed
- "Locked seats" count and "Unlock all" button
- "Generation score" (0–100) with tooltip explaining what the score considers
- "Issues" list — any violated constraints after manual edits, in plain English ("Maya and Jordan are on each other's separate list but sit next to each other"). Populated from §6.4 explanations.

**Bottom:** Save, Delete, Back to Dashboard.

**Interaction:** Drag any unlocked attendee to swap with another seat. Right-click a seat for: Lock, Unlock, Clear, Assign specific attendee. Keyboard: Tab moves between seats; Enter opens seat action menu.

## 6. The Seating Algorithm

Pure TypeScript module at `/src/lib/seating/`. Public API:

```typescript
generateSeating(
  attendees: Attendee[],
  layout: ClassroomLayout,
  options: GenerationOptions
): SeatingResult
```

### 6.1 Approach: constraint-weighted greedy placement

**Phase 1: Hard constraints first.** Place attendees with constraints into seats that satisfy them, scored by:
- Distance to the relevant feature (door, window, teacher's desk, charging station)
- Front/back position
- Side of room (for hearing/vision/accessibility constraints)

Use Hungarian algorithm or simple greedy match when conflicts arise. If a hard constraint cannot be satisfied, log it to `issues[]` but continue.

**Phase 2: Soft constraints.** Place remaining attendees minimizing a cost function:
- +10 per together-list adjacency (good)
- −50 per separate-list adjacency (bad)
- −5 per pair of high-conflict attendees who are adjacent
- +3 per positive/supportive attendee adjacent to a higher-need attendee (peer modeling / support)

**Phase 3: Local optimization.** Run a small number of seat-swap passes (max ~100 iterations) that try swapping pairs to reduce total cost. Stop when no swap improves the score.

### 6.2 Why this approach (for the README)

Greedy + local search is the right complexity tier for this problem: seating groups are small enough that exhaustive search is unnecessary, while ML/optimization libraries would be overkill for v1.0. The algorithm is deterministic given a random seed, which makes it testable and reproducible.

### 6.3 Required tests

- Empty layout → returns empty result
- More attendees than seats → places maximum possible, lists overflow in `issues`
- All attendees need same constraint → handles gracefully
- Separate lists are respected when possible
- Locked seats are never reassigned
- Determinism: same inputs + same seed → identical outputs

### 6.4 Explanations (portfolio-critical feature)

Every placement decision records why it was made. Each seat in the result carries:

```typescript
explanations: Array<{
  rule: 'constraint' | 'together' | 'separate' | 'antisocial_spread' | 'prosocial_pairing' | 'default'
  weight: number       // signed contribution to score
  reason: string       // plain-English, user-facing
}>
```

The chart UI consumes this in two places:

- **Seat tooltip:** top 2–3 reasons in plain English. *"Maya is here because: needs to be near the door (accessibility), should sit near Sam."*
- **Issues panel (§5.5):** lists violated or compromised constraints. *"Jordan is on Alex's separate list but sits adjacent — no better seat was available."*

Building this from the start disciplines the algorithm: decisions must be inspectable, which prevents placement logic from becoming spaghetti. The cost is one extra array allocation per placement.

The result shape: `{ assignments, score, issues, explanationsBySeat, debug: { phase1Time, phase2Time, swapsAttempted, swapsAccepted } }`.

## 7. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | One repo, file-based routing, Vercel deploy |
| Language | TypeScript | Catches errors early; portfolio expectation |
| Styling | Tailwind CSS + shadcn/ui | Fast, customizable, code-owned components |
| Backend | Supabase | Postgres + Auth + Storage + RLS, zero-DevOps |
| State (server) | TanStack Query | Caching, mutations, optimistic updates |
| State (client) | Zustand | Lightweight, simple, no boilerplate |
| Drag-and-drop | dnd-kit | Accessible, modern, well-maintained |
| Forms | React Hook Form + Zod | Validation shared frontend/backend |
| Tests | Vitest + Playwright | Fast unit tests + critical E2E flows |
| Hosting | Vercel | Free hobby tier, git-push deploys |
| Domain | Cloudflare Registrar | At-cost pricing, CDN baseline |

## 8. Database Schema (Supabase / Postgres)

Six core tables. Row-level security policies restrict each row to its owning user.

```sql
-- users: managed by Supabase Auth (auth.users)

profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  workspace_type TEXT CHECK (workspace_type IN ('education', 'events')) DEFAULT 'education',
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

layouts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('traditional', 'groups')),
  rows INT,
  columns INT,
  num_groups INT,
  attendees_per_group INT,
  grid JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

attendees (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  cohort_id UUID REFERENCES cohorts,
  name TEXT NOT NULL,
  external_id TEXT,
  age INT,
  family_name TEXT,
  prosocial_traits TEXT[] DEFAULT '{}',
  antisocial_traits TEXT[] DEFAULT '{}',
  constraints TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  health_flags TEXT[] DEFAULT '{}',
  together_ids UUID[] DEFAULT '{}',
  separate_ids UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

cohorts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

seating_charts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  layout_id UUID REFERENCES layouts NOT NULL,
  cohort_id UUID REFERENCES cohorts ON DELETE SET NULL,
  name TEXT NOT NULL,
  assignments JSONB NOT NULL,
  locked_seats JSONB DEFAULT '[]',
  score NUMERIC,
  stale BOOLEAN DEFAULT FALSE,
  stale_reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

RLS policy template for each table: `USING (auth.uid() = user_id)`.

## 9. Data Lifecycle

When a user edits attendees, cohorts, or layouts after a chart has been generated, what happens to the chart? The principle for v1.0:

**Live references with stale-chart detection.** Charts reference attendees and layout cells by ID, not by snapshot. When referenced data changes, charts are marked stale and the user chooses whether to regenerate or accept the current state. We never silently lose data and never block roster or layout edits.

### 9.1 Attendee events

| Event | Behavior |
|---|---|
| Edit name or notes | Live. Charts re-render with the new value immediately. |
| Edit traits / constraints / together_ids / separate_ids | Live. The chart's `issues` and current score are recalculated on view. The persisted `score` becomes "score at last save." |
| Add attendee | Not auto-placed. Appears in the roster; existing charts are unaffected until the user regenerates or drags them into a seat. |
| Delete attendee | Confirm dialog: *"Maya is placed in 2 seating charts. Remove this attendee and clear those seats?"* On confirm, drop seat assignments and mark affected charts stale. |
| Delete cohort | Attendees keep existing with `cohort_id = null`; charts keep existing with `cohort_id = null` and are marked stale with reason `"cohort was deleted"`. |

### 9.2 Layout events

| Event | Behavior |
|---|---|
| Rename | Live. |
| Toggle cell types (seat ↔ empty, perimeter swap) | Mark all referencing charts stale. Assignments to now-empty cells render with a warning icon. |
| Resize (rows/columns) | Mark all referencing charts stale. Assignments to positions that no longer exist are dropped on view (but remain in the DB row until regenerate runs, so undo is possible). |
| Delete | **Blocked** if any chart references the layout. Show: *"This layout is used by 3 charts. Delete or duplicate them first."* |

### 9.3 The stale-chart UX

A chart is "stale" when its underlying roster or layout has changed since the chart was generated. On open, a banner appears at the top of the chart view:

> This chart is out of date: the layout was resized and 1 attendee was removed.
> **[Regenerate]** **[Keep as-is]**

- **Regenerate** runs the algorithm fresh against current data.
- **Keep as-is** clears the stale flag and persists the current (possibly degraded) state — the user has explicitly accepted it.

Edits to rosters and layouts never block; recovery is always one click.

### 9.4 Implementation

Mark the stale flag in the **application layer** (inside TanStack Query mutation hooks), not Postgres triggers. App-layer logic is visible in the codebase where a beginner can read and debug it; triggers are invisible side effects.

Every mutation on `attendees`, `cohorts`, or `layouts` that could affect charts:

1. Queries for charts that reference the changed entity.
2. Updates `stale = true` and appends to `stale_reasons`.

This is N+1-style but acceptable: a v1 user should have a small number of charts, and the operation runs in a single Supabase batch. Migrate to triggers in a future version only if mutation logic becomes unwieldy.

### 9.5 Required tests

In addition to the algorithm tests in §6:

- Generate chart → delete a placed attendee → assert chart is stale, seat is empty, `stale_reasons` contains the right entry.
- Generate chart → resize layout smaller → assert assignments outside the new bounds are dropped on view but recoverable via regenerate.
- Edit attendee constraints → assert the recalculated issues and score reflect the new data without regeneration.
- Attempt to delete a layout that's in use → assert deletion is blocked with the correct error message.

### 9.6 Deferred to v1.1

- **Layout versioning / copy-on-write.** Snapshotting the layout grid into each chart so old charts always render exactly as generated. The stale banner covers 95% of the pain at 5% of the work.
- **"Frozen" charts.** Letting users mark a chart "final, do not auto-update."
- **Soft-delete + undo for attendees.** 30-day restore window. Hard-delete with confirmation is sufficient for v1.0.

## 10. Non-Functional Requirements

- **Performance:** Seating generation < 500ms p95. Page loads < 2s on 3G.
- **Accessibility:** WCAG AA. Keyboard-navigable grids, ARIA labels on all seats, sufficient color contrast, no color-only meaning (also use icons/text).
- **Browser support:** Last 2 versions of Chrome, Safari, Firefox, Edge.
- **Responsive:** Layout and chart screens work on screens ≥ 1024px. Mobile shows a "Best on desktop" notice for editor pages but allows read-only viewing.
- **Privacy:** All attendee data scoped to the owning account. No tracking pixels, no third-party analytics in v1.0. Privacy policy and ToS pages required.
- **Error handling:** Every async operation has loading + error states. Network errors show retry. Form validation inline.

## 11. Out-of-Scope Reminders (v1.0)

To stay focused, the following are explicitly not in v1.0:

- Multi-user organization/workspace support
- Sharing layouts or charts between users
- Real-time collaboration
- Mobile-first responsive editing
- PDF export (PNG is enough; print stylesheet covers paper output)
- Excel import/export (CSV only)
- Custom trait/accommodation taxonomies (use the fixed list)
- Attendee photos or avatars
- Attendance, grades, LMS integrations, or event messaging
- Billing, plans, or paywalls
- Email notifications

## 12. Launch Checklist

Before declaring v1.0 done:

- [ ] All five screens functional end-to-end
- [ ] Algorithm has ≥ 90% test coverage
- [ ] At least one Playwright E2E test for the full happy path
- [ ] Accessibility audit passes (axe DevTools, manual keyboard test)
- [ ] README with screenshots, live demo link, architecture explanation
- [ ] `/lib/seating/README.md` explaining the algorithm
- [ ] Privacy policy and ToS pages
- [ ] Custom domain + HTTPS
- [ ] Two real target users have tested it and given feedback
- [ ] Error monitoring set up (Sentry free tier)
- [ ] Open source under MIT license with clear contribution guide

## 13. Project Phases (4–6 weeks part-time)

| Phase | Duration | Output |
|---|---|---|
| 1. Foundation | 3 days | Next.js + Supabase + Vercel live with auth |
| 2. Layout Builder | 1 week | Save/load seating layouts |
| 3. Roster | 1 week | Attendee CRUD with CSV import/export |
| 4. Algorithm | 1 week | Pure tested module + Generate button + explanations |
| 5. Manual Edit | 4 days | Drag-and-drop + lock + export PNG |
| 6. Polish | 4 days | A11y, README, target-user tests, launch |
