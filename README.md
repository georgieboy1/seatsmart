# SynDesk

The ultimate classroom seating tool for K-12 and Higher Ed. Model your room once, enter your class roster with accommodations, and get an optimized seating chart in seconds — with intuitive drag-and-drop fine-tuning.

> **Status:** v1.0, free public release by KC Studio (a Future of the Isles studio).
> No accounts and no server: everything a teacher enters stays in their browser.

## 🚀 Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run e2e        # browser test: home → sample class → saved chart
npm run build      # static site in out/
npm run deploy     # publish to syndesk.futureoftheisles.org (gh-pages)
```

There is nothing to configure: no database, no environment variables, no API keys.

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
├── e2e/                    # Playwright E2E specs
└── src/
    ├── app/                # Next.js App Router (Students, Classes, Charts)
    ├── components/         # UI & Domain components
    └── lib/
        ├── students/       # Student logic & Import Wizard
        ├── classes/        # Class management logic
        ├── seating/        # The Seating Algorithm
        └── local/          # On-device store, hooks, backups, sample class
```

## 🛡️ Privacy & Security

SynDesk is built so student data never has to leave the teacher's device:
- **On-device only:** Classes, students, layouts and charts are saved in the browser's local storage. There is no server-side database and no account.
- **Backups:** Teachers move data between devices with a downloadable backup file, which shows a sensitive-data warning first.
- **PII Protection:** Native warnings before any data export.
- **Zero Tracking:** No analytics, ads, cookies or third-party requests.
- **Offline:** A service worker keeps the app working without a connection.

## License

[MIT](LICENSE) © Kacy George
