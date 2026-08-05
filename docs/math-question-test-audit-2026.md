# Math question & test audit — improvement plan (2026-08-05, revised)

Scope: audit of the math questions given to learners (generators, grading, official-exam
content) and of the automated test suite guarding them. Evidence: 4 parallel code audits
(generator layer, answer pipeline, test suite, official-exam/curriculum layer) plus a live
`vitest run` baseline: **700 passed / 2 failed** — both failures are property-sweep
timeouts under parallel load, not math regressions (P0 #4).

Revisions after line-level verification: the claimed zero-denominator bug was false
(`generators.ts:589` has one capture group — the denominator; `answerDiagnosis.test.ts:51-54`
proves `"3/0"` gets the intended feedback); assessment format-finality and decimal-comma
parsing are deliberate tested contracts, reframed below as policy/locale items.

## P0 — Confirmed defects to fix now (small diffs, direct learner harm)

| # | Defect | Where | Harm |
|---|--------|-------|------|
| 1 | **Locale-blind number parsing.** The explicit contract is decimal-comma (`parseNumericAnswer("12,5") === 12.5`, `generators.test.ts:800-802`), so `"3,000" === 3` is *valid* under that convention — but wrong for English-grouping users, and the de-CH app itself displays `1'000` (`Intl.NumberFormat("de-CH")`, `generators.ts:29-35`) while the parser rejects `'`. | `generators.ts:555-565` | Learner echoing the app's own Swiss format fails; en-locale learners using comma grouping are mis-graded both directions |
| 2 | Mixed number `"1 1/2"` parses silently as `11/2` = 5.5 | `generators.ts:571-585` | Silent wrong-value grading of a format slip |
| 3 | `inputMode="decimal"` on answer fields — iOS decimal keypad has no minus key; negative answers are routine (coordinate-transformations) | `App.tsx:8979, 9005, 9068` | iPhone learners cannot type a required answer class |
| 4 | Flaky release gate: `mockExam.test.ts:144` (1000 seeds, 30 s cap) and `german/generators.test.ts:34` (default 5 s) time out under full-suite CPU contention; both pass in isolation | vitest defaults | `pnpm test` gates `deploy:cloudflare`; currently red |

Fixes: locale-aware parsing driven by `task.contentLocale` (de-CH → comma decimal +
`'`/`’` grouping; en → dot decimal + comma grouping) — do **not** add a digit-count
heuristic, it breaks valid decimal-comma input. Alternative: expected-aware alternate
interpretations at grading time. Reject mixed-number input as a format diagnostic.
`inputMode="text"` where the canonical answer can be negative. Explicit `testTimeout`
(60-120 s) on the two property sweeps, or globally in `vitest.config.ts`.

## P1 — Lock P0 with targeted tests (one test per fix, existing infra)

All use the existing seed-sweep/oracle patterns (`zap2025Generators.test.ts:49-53`,
`archiveGeneratorCoverage.test.ts:54-139`). No new framework.

1. Locale-aware parse contract: per `contentLocale`, canonical values round-trip through
   `parseNumericAnswer` in that locale's grouping (`1'000` for de-CH, `3,000` for en);
   decimal separators stay per the existing contract (`12,5`/`12.5`); a value from the
   *other* locale's convention must not silently change magnitude.
2. Tolerance boundary contract: `decimals=0` → `"3.009"` true / `"3.011"` false;
   repeating case: expected 1/3 → `"0.333"` false, `"0.33333"` true (documents today's
   behavior; flip if the latent fix below lands).
3. `"1 1/2"` → format error (or 1.5), never 5.5.

## P2 — Break the circular verification of official answer keys (highest content risk)

Every official answer key (2025/2023/2024/2015) is a single-source hand transcription;
SHA-256s verify PDF identity, not transcription; golden tests re-encode the same values.
Safe-floor grading hides typos **except** for machine-certain responses (tuple-set 2025 T3,
true-false 2023 T4, matching 2015 T9, face-labels 2025 T8) — a typo there silently
mis-grades with no human fallback.

1. **Double-entry fixture**: independent second transcription of every official
   answer/milestone/tuple (from the solution PDFs, ideally a different transcriber or text
   extraction) asserted equal to all four blueprints.
2. **Cross-check 2015/2023/2024 keys** (2025 is already covered: see Verified strengths).
   Where solution paths are reconstructable for these years, assert path-engine agreement
   against the blueprint final values as `officialExam2025.test.ts:293-390` does for 2025;
   otherwise include them in the double-entry fixture of item 1.
3. **Mutation guard**: for each machine-certain response, an alter-one-entry test asserting
   the score changes.
4. **Grade-scale source binding**: embed the notenskala SHA-256 in `officialGradeScale.ts`,
   publish the full 2024 37-point table in docs (only 3 boundary points documented today),
   assert both scales against docs-derived tables.
5. Pin the 2015 Task 9 "kein Paar on a pair-expected field" scoring branch
   (`officialExam2015.ts:305-330`) — currently counts as neither correct nor false;
   undocumented in the 5 known outcomes.

## P3 — Broaden property coverage of generated questions

- Oracle sweeps (independent re-derivation from `visual.values`) exist for **16 of 23**
  topics and run the **default band only**. Missing oracles: `mass-units`,
  `money-calculations`, `proportional-revenue`, `reverse-fractions`, `geometric-loci`
  (choice). Extend the existing oracle pattern to these 5 and run oracles across all 3
  bands for the 16.
- Band structure is already well covered: `generators.test.ts:376-405` cycles 1,000 seeds
  across every topic, generating all three bands per seed and asserting replay equality,
  three distinct prompts, score monotonicity, band labels, `candidateCount >= 3`, and
  canonical-answer acceptance. Do **not** add a band monotonicity/distinctness sweep —
  it would duplicate this stronger existing test.
- Negative-grading (false-accept) sweeps: ~6 assertions total today. Add per-kind
  wrong-value sweeps (perturbed canonical input must fail `isCorrectAnswer`) for number,
  fraction, set, coordinate kinds.
- `difficulty.ts` has no dedicated test (one assertion in `generators.test.ts:226-230`).

## P4 — Policy decisions & structural improvements (decide deliberately, then implement)

1. **Assessment format-finality is a deliberate, tested contract** — not a defect.
   `App.test.tsx:4494-4540` ("keeps a malformed assessment submission final and gradeable")
   pins: input disables, one attempt/mistake, unresolved format diagnostic, silent
   correction. Placement has the same deliberate contract (`App.test.tsx:2406+`).
   Practice mode retries format errors free (`App.tsx:8824-8827`); assessment does not
   (`App.tsx:8801-8812`). Whether a silent assessment may give validation feedback is a
   product/pedagogy decision: changing it means replacing those two contracts and deciding
   what a "final" submission means. The parser improvements in P0 #1 shrink how often the
   dilemma triggers, whatever is decided.
2. **Placement-only loci distractor weakness** *(attempted, reverted — needs a generation
   bump)*. `geometric-loci` choice options are built in fixed order (correct answer
   always position 0-2 of 4). Lessons, reviews, assessments, and mocks render the
   construction workbench instead (`shouldUseGeometryConstruction`,
   `geometryConstruction.ts:70-76`; mock branch `App.tsx:10526`); only the placement
   start-check renders the fixed-order list (`task.kind === "placement"`, and
   `geometric-loci` ∈ `placementTopicIds`, `curriculumPackage.ts:55-65`). A seeded-shuffle
   fix was implemented and **reverted** (`e01be62`): generator output is byte-pinned for
   persisted versions v2-v6 (v5 golden test, replayable mock blueprints, stored session
   seeds), and v6 is the current persisted version, so any output change requires a
   deliberate generation-version bump (v7: version registry, task profiles, goldens, mock
   blueprint, i18n replay tests). Bundle the shuffle into the next such bump; until then
   the exposure stays placement-only and cosmetic.
3. **Difficulty bands are intra-topic tertiles**, not calibrated to exam demand:
   "Prüfungsnah" = hardest third of the topic's own pool. For structurally simple topics
   (mass-units) the exam band can sit far below real exam tasks. Follow the
   spatial-rolling pattern (content-gated bands, `generators.ts:466-486`) for exam-heavy
   topics; document per-topic band semantics.
4. **Mock blueprint ↔ recurrence matrix binding**: 9 slots × flat 4 points; the slot→matrix-row
   mapping exists only as prose. Add a mapping test so matrix or slot drift fails CI.
5. **Duplicate repeated-digit enumeration** (`combinatorics.ts:82-131` vs
   `archiveGeneratorExpansion.ts:~445-460`): converge to one implementation.
6. **App.test.tsx (252 KB, ~120 `it`s in one describe)**: grading contracts live only here
   (set-order 3396, table coaching 3453, guided steps 3650, construction grading 3945) —
   extract these to domain tests; remove the fabricated `submittedAnswer: 'correct'` at 2463.
7. Latent grading-policy items (decide, then test): repeating-decimal tolerance requires
   more precision than the UI displays; integer tolerance accepts ±0.01; fraction questions
   reject exact decimal equivalents without saying the value was right; integer-set has no
   partial credit and no "entry X is wrong" hint; the "cannot be negative" hint fires from
   expected sign alone and misfires on signed topics (`answerDiagnosis.ts:206-211`).

## P4b — Learner-facing item-quality audit (the questions themselves, not just the invariants)

Generator invariants and answer-key checks prove a question is *gradable and reproducible* —
they say nothing about whether it is a *good question* for a 12-year-old. Add one sampled,
rubric-based audit pass, reusing the existing PIN-protected content-validation lab
(`authorValidation.ts` — already runs the production generator across all 23 topics × 3
bands and exposes prompt, hint, easier explanation, worked path, and exact seed).

Method: sample 3 seeds per topic × band cell (23 × 3 × 3 ≈ 207 items, reproducible via
recorded seeds), score each item on a one-page rubric, log defects with their seed so the
exact instance reopens in the lab:

1. **Wording & ambiguity** — exactly one defensible interpretation; units named; no
   double negatives; de-CH school vocabulary.
2. **Age-appropriate cognitive demand** — reading load and step count fit Sek-1 entrants;
   Aufbau genuinely easier than Prüfungsnah *as experienced*, not just as scored.
3. **Distractor plausibility** (choice kinds) — each distractor reachable by a real
   mistake; no giveaway outliers.
4. **Visual–prompt consistency** — diagram labels/values match the prompt and the values
   the grader uses; no irrelevant detail.
5. **Repetition** — across seeds, prompts vary in surface form, not only in digits
   (flags the 11 single-template topics from the coverage map).
6. **Zürich-exam alignment** — item resembles the documented recurrence rows
   (`docs/2015-2025-recurrence-matrix.md`) in form and demand.

Output: a defect ledger (seed + rubric dimension + severity) feeding generator fixes,
each fix locked by a seed-level regression test. This is a human pass over generated
content — the lab makes it cheap, but it cannot be automated away.

## P5 — Human gates (cannot be closed by code)

No independent human validation is recorded for **any** replay year: all four author-validation
checklists have empty sign-offs. Outstanding: 2015/2023/2024/2025 task-vs-original passes,
2024 full scale transcription, the 2015 T9 edge ruling, and the physical-iPad runs. Until
then, treat every typed key and the "verified" scale labels as unverified — matching the
2025 checklist's own warning (`docs/2025-author-validation-checklist.md:78-80`).

## Verified strengths (do not regress)

- Determinism is pure (no `Math.random`/`Date.now` anywhere in generators); replay equality pinned.
- Band split invariant pinned across 1,000 seeds × all 23 topics (`generators.test.ts:376-405`).
- 2025 calculation-path engine binds learner operands to prior results — a genuine runtime oracle.
- 2025 keys are cross-checked against the published correction scheme:
  `officialExam2025.test.ts:293-390` grades the exact published paths for Tasks 1, 2, 4, 5, 6,
  and 9 (plus one-error and unit variants) and requires full points only when the path
  terminates at the blueprint's final value; the audit independently re-derived the same
  arithmetic clean. 2015/2023/2024 have no equivalent check.
- No-grade state for 2015/2023 enforced at 3 layers with tests.
- Math spot-checks across ~20 generator families re-derived clean in this audit
  (voxel faces, LCM cycles, number walls, catch-up, tiling optimality, cube-net folding, …).
- Safe-floor grading defaults to human review on uncertainty (2025: 10 certain / 26 reviewable max).
- Assessment/placement finality contracts are explicit and tested (`App.test.tsx:4494-4540`, `2406+`).
