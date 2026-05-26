# SynDesk Private Beta Checklist

Use this before inviting each private-beta teacher. The goal is a boring,
repeatable setup: clean database, verified auth, one successful end-to-end
seating chart, and a clear feedback path.

## 1. Fresh Supabase Migration Test

Create a brand-new Supabase project, then apply every SQL file in
`supabase/migrations/` in numerical order from `0001` through `0011`.

Run this verification query afterward:

```sql
select
  to_regclass('public.students') as students_table,
  to_regclass('public.cohorts') as classes_storage_table,
  to_regclass('public.attendees') as legacy_attendees_table,
  to_regclass('public.guests') as legacy_guests_table;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'students'
order by ordinal_position;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'layouts'
order by ordinal_position;
```

Expected:

- `students_table = public.students`
- `classes_storage_table = public.cohorts`
- `legacy_attendees_table` is null
- `legacy_guests_table` is null
- `students` includes `external_id`, `age`, `family_name`, `constraints`,
  `allergies`, `health_flags`, `together_ids`, and `separate_ids`
- `layouts` includes `students_per_group`
- `layouts` does not include `venue_id`

If any of those are wrong, stop and fix migrations before inviting testers.

## 2. Authenticated E2E Credentials

Create one disposable Supabase Auth user for automated tests. Do not use a real
teacher account.

Local setup:

```bash
cp .env.test.example .env.test
```

Fill in:

```bash
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

For CI, add those two values as encrypted secrets. The authenticated Playwright
happy path skips itself when these variables are missing.

## 3. Desktop Teacher Walkthrough

Run this manually on a desktop-width browser before each beta round:

1. Sign up or log in.
2. Create one class.
3. Add at least four students.
4. Add accommodations to at least two students.
5. Add one peer support relationship.
6. Add one avoid-pairing relationship.
7. Create a classroom layout.
8. Generate a seating chart.
9. Confirm the Placement Report explains at least one decision in plain English.
10. Drag one student, lock one seat, and save the chart.
11. Export CSV and confirm the sensitive-data warning appears.
12. Reload the saved chart and confirm assignments persist.

## 4. Verification Commands

Run these before sharing a beta link:

```bash
npm run lint
npm test
npm run build
npm run e2e
```

Expected local E2E result without credentials:

- home smoke test passes
- stabilization audit passes or skips if no active session exists
- authenticated happy path skips with a clear credential message

Expected CI/private-beta result with credentials:

- authenticated happy path passes

## 5. Feedback Intake

Use the GitHub issue template at
`.github/ISSUE_TEMPLATE/private_beta_feedback.yml`, or copy those questions into
a Google Form for non-technical teachers.
