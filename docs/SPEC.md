# SynDesk — Product Specification v1.0

The ultimate classroom seating tool for K-12 and Higher Ed. Educators model a physical room once, enter students with relevant accommodations, and generate an optimized seating chart in seconds — with intuitive drag-and-drop fine-tuning.

## 1. Executive Summary

Seating charts are a high-leverage tool for classroom management, but manually balancing accessibility needs, social dynamics, and physical room constraints is time-consuming and error-prone. SynDesk automates this process using a specialized optimization algorithm, allowing teachers to focus on instruction while ensuring every student is placed where they can best learn.

## 2. Terminology

- **Classroom Layout:** The physical model of the room (grid of seats, doors, windows, and the teacher's desk).
- **Class:** A group of students (e.g. "Homeroom", "AP Chemistry").
- **Accommodations:** Specific environmental needs (e.g., "Front of Room", "Near Door").
- **Peer Supports:** Requested pairings for positive modeling or student assistance.
- **Avoid Pairing:** Students who should be separated to minimize distractions or conflicts.
- **Placement Report:** A human-readable explanation of why each student was placed in their specific seat.

## 3. The "Blueprint" Aesthetic

The application utilizes a utilitarian, architectural design language:
- **Deep Architectural Blue** as the primary brand color.
- **Blueprint Grid** backgrounds in the seating workspace.
- **Monospace fonts** for all technical data points and metric tiles.
- **Brutalist UI elements** (sharp borders, zero corner radius) to convey precision and reliability.

## 4. Key Workflows

### A. Room Modeling
Teachers use a grid-based builder to define their classroom. Features like "Focal Points" (Teacher Desk) and "Environmental Markers" (Windows, Doors) act as anchors for the seating algorithm.

### B. Student Roster Import
A multi-step **Data Mapping Wizard** allows teachers to paste student lists directly from Excel or Google Sheets. The wizard auto-guesses column mappings and validates accommodation types before importing to ensure data integrity.

### C. Seating Generation
The algorithm runs in three phases:
1. **Accessibility Phase:** Prioritizes students with hard accommodations (e.g., vision/hearing needs).
2. **Social Phase:** Places remaining students while maximizing peer support proximity and respecting avoid-pairing rules.
3. **Refinement Phase:** Local seat swaps to maximize the overall "Classroom Health" score.

### D. Fine-Tuning & Export
Teachers can manually swap students via drag-and-drop or lock specific students into seats. Final charts can be exported as PNGs for printing or CSVs for grading records, with mandatory PII sensitivity warnings.

## 5. Security & Privacy

As a tool handling student data, SynDesk keeps that data on the teacher's device:
- **Local-first storage:** All records live in the browser's local storage. There is no server-side database, account or sync.
- **Backup files:** The only way data leaves the browser is a backup or CSV the teacher downloads, each behind a sensitivity warning.
- **No tracking:** No analytics, cookies or third-party requests.
- **Audit fields:** Records keep `created_at` and `updated_at`.

## 6. Development Status

- **Phase:** v1.0 public release (local-first)
- **Focus:** A free, no-account tool listed on Future of the Isles' Make page.
- **Target:** K-12 and Higher Ed teachers.
