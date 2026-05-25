# SeatSmart

Adaptive seating, automated. Educators and event hosts model a room once, enter attendees with relevant constraints, and get an optimized seating chart in seconds — with drag-and-drop fine-tuning.

> **Status:** Phase 5 complete, Phase 6 in progress.

## Features

- **Layout Builder:** Model your physical room with seats, doors, windows, and more.
- **Workspace Modes:** Switch between education and events language/defaults without changing the core data model.
- **Attendee Roster:** Manage attendees with constraints, allergies, health flags, family/grouping data, and relationship preferences.
- **Smart Seating Algorithm:** Greedy + local optimization algorithm that respects constraints and relationship dynamics.
- **Interactive Fine-tuning:** Drag-and-drop attendees to swap seats, and lock attendees into specific positions.
- **Stale Chart Detection:** Automatically flags charts that need updating when attendee, cohort, or layout data changes.
- **Export Options:** Download your charts as PNG (for printing), CSV (for grading), or JSON.
- **Privacy First:** Data owned by the account holder, secured with Supabase Row Level Security.

See [`docs/SPEC.md`](docs/SPEC.md) for the full v1.0 product specification.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives, Nova preset)
- **Supabase** — Postgres + Auth + Storage with Row Level Security
- **Vitest** + **React Testing Library** (unit) and **Playwright** (E2E)
- Deployed on **Vercel**

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)

### Install

```bash
git clone https://github.com/YOUR-USERNAME/seatsmart.git
cd seatsmart
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with values from your Supabase project's API settings page:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Configure Supabase Auth redirects

In the Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` for local dev (or your production URL)
- **Redirect URLs:** add `http://localhost:3000/auth/callback` and any deploy URL such as `https://seatsmart.vercel.app/auth/callback`

Without this, email verification links won't redirect back to the app.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Run the production build locally |
| `npm run lint` | ESLint |
| `npm test` | Run all Vitest unit tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run e2e` | Run Playwright E2E tests (auto-starts dev server) |
| `npm run e2e:ui` | Playwright in interactive UI mode |

## Project structure

```
seatsmart/
├── docs/
│   └── SPEC.md              # source of truth for the v1.0 product spec
├── src/
│   ├── app/                 # Next.js App Router routes
│   │   ├── auth/            # email verification callback + landing
│   │   ├── dashboard/       # protected; redirects to /login if not authed
│   │   ├── login/
│   │   ├── signup/
│   │   ├── page.tsx         # public landing
│   │   └── page.test.tsx
│   ├── components/ui/       # shadcn/ui components
│   ├── lib/
│   │   └── supabase/        # browser + server client factories
│   └── proxy.ts             # session refresh on every request (renamed
│                            # from middleware.ts in Next.js 16)
├── e2e/                     # Playwright E2E specs
├── CLAUDE.md                # working instructions for Claude Code
└── AGENTS.md                # Next.js 16's own agent rules
```

## Deploying to Vercel

1. Push to GitHub.
2. Sign into [Vercel](https://vercel.com) with GitHub and import the repo. Vercel auto-detects Next.js.
3. In **Project Settings → Environment Variables**, add the three variables from your `.env.local` for both Production and Preview scopes.
4. Click **Deploy**. The first deploy takes about 2 minutes.
5. Once you have the production URL, add it back to Supabase's **Site URL** and add `<production-url>/auth/callback` to **Redirect URLs**.

## License

[MIT](LICENSE) © Kacy George
