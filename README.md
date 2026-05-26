# SynDesk

The ultimate classroom seating tool for K-12 and Higher Ed. Model your room once, enter your class roster with accommodations, and get an optimized seating chart in seconds — with intuitive drag-and-drop fine-tuning.

> **Status:** v1.0 Private Beta Candidate. Focused exclusively on classroom management and student support.

## 🚀 Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/YOUR-USERNAME/syndesk.git
   cd syndesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Create a project at [supabase.com](https://supabase.com).
   - Copy `.env.example` to `.env.local`.
   - Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. **Run migrations**
   Apply the SQL files in `supabase/migrations/` to your Supabase project in numerical order. For the full private-beta verification path, see [`docs/PRIVATE_BETA_CHECKLIST.md`](docs/PRIVATE_BETA_CHECKLIST.md).

5. **Start developing**
   ```bash
   npm run dev
   ```

## 🛠 Features

- **Blueprint Workspace:** A technical, blueprint-style grid for modeling your physical classroom with seats, doors, and focal points.
- **Student Roster Management:** Track student accommodations (vision, hearing, mobility), peer supports, and pairing restrictions.
- **Smart Seating Algorithm:** A custom greedy + local search optimizer that prioritizes accessibility and social balance.
- **Data Mapping Wizard:** Paste from Excel/Sheets or upload CSV with visual column mapping to prevent data corruption.
- **Interactive Editor:** Drag and drop students, lock specific seats, and export results with automated "Placement Reports" explaining the algorithm's decisions.

## 📁 Project Structure

```text
syndesk/
├── docs/                   # Product Specification
├── supabase/               # SQL migrations & DB config
├── e2e/                    # Playwright E2E specs
└── src/
    ├── app/                # Next.js App Router (Students, Classes, Charts)
    ├── components/         # UI & Domain components
    └── lib/
        ├── students/       # Student logic & Import Wizard
        ├── classes/        # Class management logic
        ├── seating/        # The Seating Algorithm
        └── supabase/       # Client/Server DB utilities
```

## 🛡️ Privacy & Security

SynDesk is built with student data privacy at the core:
- **PII Protection:** Native warnings before any data export.
- **Data Isolation:** Row Level Security (RLS) ensures only you can access your student rosters and layouts.
- **Zero Tracking:** No third-party analytics or tracking pixels are used.

## Private Beta

Before inviting teachers, run the checklist in
[`docs/PRIVATE_BETA_CHECKLIST.md`](docs/PRIVATE_BETA_CHECKLIST.md). It covers the
fresh Supabase migration test, authenticated E2E credentials, desktop
walkthrough, and feedback intake.

## License

[MIT](LICENSE) © Kacy George
