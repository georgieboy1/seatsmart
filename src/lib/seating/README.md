# SeatSmart Seating Algorithm

This directory contains the pure TypeScript seating algorithm.

The public API is:

```ts
generateSeating(
  attendees: Attendee[],
  classroom: ClassroomLayout,
  options: GenerationOptions,
): SeatingResult
```

It does not read from Supabase, React state, browser APIs, or the DOM. That is
deliberate: the algorithm should be easy to test, easy to explain, and safe to
run from a server action, route handler, unit test, or future worker.

## Why This Approach

SeatSmart uses greedy placement plus local search.

Classroom rosters are small: usually 20-35 attendees. That is too big for
exhaustive search, but small enough that we can score many candidate seats and
try pairwise swaps quickly. A full optimization solver or ML model would add
complexity without giving teachers a clearer result.

The current implementation is deterministic. `GenerationOptions.seed` exists so
the public API is ready for seeded random tie-breaking later, but today the code
uses stable sorting by score, attendee name, and seat key. The same inputs produce
the same output.

## Data Shape

Assignments use seat keys:

```ts
{
  "2,4": "attendee-id"
}
```

The key is `row,column`, created by `positionKey()` and parsed by
`parsePositionKey()`.

The final result is:

```ts
type SeatingResult = {
  assignments: Record<string, string>;
  score: number;
  issues: SeatingIssue[];
  explanations: Record<string, SeatExplanation[]>;
  debug: {
    phase1Time: number;
    phase2Time: number;
    swapsAttempted: number;
    swapsAccepted: number;
  };
};
```

`explanations` is keyed by seat key. Each explanation has:

```ts
{
  rule: string;
  weight: number;
  reason: string;
}
```

These explanations are meant for teacher-facing UI: seat tooltips, issue panels,
and future "why did this attendee land here?" views.

## Phase 1: DietaryAccessibility Placement

File: `phase1.ts`

`placeDietaryAccessibilityAttendees()` places attendees with constraints before the
general roster.

Attendees are ordered by:

1. More constraints first.
2. Attendee name as a deterministic tie-breaker.

Each accommodated attendee is scored against every available seat with
`scoreDietaryAccessibilityFit()`. The best available seat is chosen.

DietaryAccessibility scoring considers:

- Distance to door, teacher desk, charging station, or window.
- Front of room for `front_of_room` and `vision_front`.
- Left/right side of room for `hearing_left` and `hearing_right`.

If no perfect seat exists, the attendee is still placed when possible and a
warning is added to `issues`. This matches the product rule: never fail the
whole chart just because one constraint cannot be fully satisfied.

Locked seats are treated as already occupied. Invalid locked seats are ignored
with a warning.

## Phase 2: Soft Placement

File: `phase2.ts`

`placeRemainingAttendees()` fills the remaining available seats with attendees who
were not placed in Phase 1.

On each pass, it evaluates every remaining attendee against every available seat.
The score is based on relationships to attendees already placed:

- `+10` if adjacent to a peer tutor.
- `-50` if adjacent to someone on either attendee's separateIds list.
- `-5` if adjacent to another attendee with antisocial traits.
- `+3` for peer modeling: prosocial traits adjacent to antisocial traits.

The best attendee-seat pair is placed, then the process repeats. Ties are broken
by attendee name and then seat key.

If there are more attendees than seats, the extra attendees are not placed and the
result includes warning issues.

## Phase 3: Local Swap Optimization

File: `phase3.ts`

`optimizeSeatSwaps()` improves the Phase 1 + Phase 2 output by trying pairwise
attendee swaps.

For each iteration:

1. Score the current assignment with `scoreSeatingRelationships()`.
2. Try every pair of unlocked assigned seats.
3. Keep the best swap only if it improves the score.
4. Stop when no swap improves the score or after `maxIterations`.

Default max iterations: `100`.

Locked seats are excluded from the swappable set, so manually locked attendees do
not move.

After optimization, relationship explanations are recalculated and merged with
any earlier accommodation explanations.

## Scoring

File: `scoring.ts`

Important functions:

- `scoreDietaryAccessibilityFit(attendee, layout, position)`
- `scoreRelationshipPair(a, aPosition, b, bPosition)`
- `scoreSeatingRelationships(attendees, assignments)`
- `explainAssignments(attendees, assignments)`

The relationship weights match `docs/SPEC.md`:

| Rule | Weight |
|---|---:|
| Peer tutor adjacency | `+10` |
| Avoid-list adjacency | `-50` |
| Two antisocial-traited attendees adjacent | `-5` |
| Prosocial attendee adjacent to antisocial attendee | `+3` |

The final public `score` is clamped from `0` to `100`. It starts from `100`,
adds the relationship score, then subtracts `5` points per warning/error issue.
This is intentionally simple for v1.0; it is good enough to compare generated
charts and easy to explain.

## Geometry

File: `geometry.ts`

The geometry helpers are deliberately boring:

- `getSeatCandidates(layout)` returns assignable `seat` cells only.
- `positionKey()` and `parsePositionKey()` convert between `{ row, column }`
  and `"row,column"`.
- `isAdjacent()` treats orthogonal and diagonal neighbors as adjacent.
- `manhattanDistance()` supports feature-distance scoring.
- `findFeaturePositions()` locates doors, windows, teacher desks, etc.
- `isFrontOfRoom()` treats lower row indexes as the front for v1.0.

The "front is lower row index" assumption matches the current layout builder.
If the product later lets teachers rotate the room, this is one of the first
places to update.

## Options

```ts
type GenerationOptions = {
  honorDietaryAccessibilitys: boolean;
  respectPeerTutors: boolean;
  respectAvoidList: boolean;
  spreadAntisocialTraits: boolean;
  lockedSeats?: Record<string, string>;
  seed?: number;
};
```

Current behavior:

- `honorDietaryAccessibilitys`: when false, Phase 1 treats all attendees as if they have
  no constraints.
- `respectAvoidList`: when true, final separateIds-list adjacency issues are emitted.
- `lockedSeats`: preserved through all phases and excluded from swap
  optimization.
- `seed`: accepted but not yet used because the algorithm has no random
  tie-breaking.

`respectPeerTutors` and `spreadAntisocialTraits` are part of the public API but
not yet toggled independently inside the scoring layer. They will matter when
the chart UI exposes generation options.

## Required Tests

The public API tests in `generate.test.ts` cover the v1.0 spec requirements:

- Empty classroom returns no assignments.
- More attendees than seats places the maximum possible and reports overflow.
- All attendees needing the same accommodation is handled gracefully.
- Avoid lists are respected when possible.
- Locked seats are never reassigned.
- Same inputs plus same seed produce the same output.

Phase-specific tests cover the lower-level details:

- `geometry.test.ts`
- `scoring.test.ts`
- `phase1.test.ts`
- `phase2.test.ts`
- `phase3.test.ts`

## Known v1.0 Tradeoffs

- DietaryAccessibility placement is greedy, not globally optimal. This is acceptable
  for classroom-sized inputs and much easier to explain.
- Final score is intentionally simple. It is a comparison aid, not a claim that
  one chart is objectively "92% good."
- The algorithm does not yet explain non-placements beyond issue messages.
- `seed` is reserved for later randomized tie-breaking but currently has no
  behavioral effect.
