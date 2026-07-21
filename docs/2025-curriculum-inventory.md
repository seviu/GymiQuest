# ZAP 1 Mathematics 2025 - curriculum inventory

Source pair inspected visually and textually:

- `/Users/svieira/Downloads/2025_mathematik_aufgaben.pdf` - 12 pages
- `/Users/svieira/Downloads/2025_mathematik_loesungen.pdf` - 15 pages, including correction addendum

This file is an internal curriculum map. Public generated exercises must use original wording, values, diagrams, and contexts. The official paper remains a calibration and golden-test source, not the renewable training inventory. Its separate replay mode renders only PDFs that the learner imports and keeps on that device.

## Paper-level constraints

- 60 minutes, no calculator, 9 tasks, 36 points total.
- Every task is worth 4 points.
- Unless explicitly exempted, a correct result without a comprehensible method receives no credit.
- Units matter in final answers when requested.
- Repeated downstream work can earn follow-through credit after an earlier numerical error.

Those rules require the product to keep exam score separate from practice XP and to store structured intermediate evidence, not only final values.

## Task-to-skill map

| Task | Source pages (task / rubric) | Mathematical demand | Faithful exam response | Dynamic training family | Key rubric checkpoints |
|---|---:|---|---|---|---|
| 1a | 3 / 4 | Solve a missing-value multiplication/division chain | One number plus method | `arithmetic-equations` | Invert operations in the right order; intermediate product or quotient earns partial credit |
| 1b | 3 / 4 | Fraction of a mixed time quantity, hour-minute conversion, solve missing numerator | One unitless integer plus method | `time-fractions` | Convert the whole duration, calculate one fractional part, isolate the missing numerator; an attached unit on the final numerator is penalized |
| 2a | 4 / 5 | Add a group price from three ticket categories | Money value | `money-calculations` | Exact group total; method is not required for this one-point part |
| 2b | 4 / 5 | Recover a visitor count from category revenue and unit price | Count plus method | `money-calculations` | Divide category revenue by its ticket price |
| 2c | 4 / 5 | Solve a revenue table with a fixed ratio between two visitor groups | Count plus method | `proportional-revenue` | Remove known-category revenue, bundle the ratio groups, divide by bundle price |
| 3 | 5 / 6 | Enumerate every positive integer combination of three coin types for a total | Unordered set of triples | `integer-combinations` | Seven exact combinations in 2025; false rows reduce credit; no method required |
| 4a | 6 / 7 | Read a tiled diagram, compare small and large tile areas, reduce a fraction | Reduced fraction | `area-fractions` | Count equivalent unit areas and fully reduce the result |
| 4b | 6 / 7 | Count both tile types in a pattern and calculate total cost | Money value plus method | `tiling-costs` | Correct small/large counts and weighted total |
| 4c | 6 / 7 | Optimize a covering cost subject to 1x1 and 2x2 tile geometry | Money value plus method | `tiling-costs` | Maximize the cheaper-per-area large tiles, then price the remaining cells |
| 5 | 7 / 8 plus addendum 14 | Reverse a multi-stage mass process with unit conversion, discarded fraction, retained fraction, and transport loss | Mass plus structured method | `reverse-chains` | Filled-container mass; mass before cooking; mass before sorting; initial transported mass; follow-through credit is explicit |
| 6a | 8 / 9 | Inverse proportion between people and supply duration; answer the increase, not the new total | Duration plus method | `inverse-proportion` | Preserve total person-days, calculate new duration, then subtract original duration |
| 6b | 8 / 9 plus addendum 14 | Two-phase consumption after a population change | Duration plus method | `changing-rates` | Calculate remaining person-days after phase one, then divide by the new population; follow-through from part a is allowed |
| 7 | 9 / 10-11 | Intersect four geometric constraints on a scale map | Compass/ruler construction and shaded region | `geometric-loci` | Parallel at the scaled line distance; circle around a point; perpendicular bisector of two points; correct side/intersection; 2 mm tolerance |
| 8a | 10 / 12 | Track tetrahedron face labels through one edge roll | Two face labels | `spatial-rolling` | One point per correctly labelled visible face |
| 8b | 10 / 12 | Track the supporting face over a four-cell triangular path | Four face labels | `spatial-rolling` | Full credit for all four, partial credit for three; 2025 target order is 4, 3, 2, 1 in the shown cells |
| 9 | 11 / 13 plus addendum 14 | Infer one block's dimensions from composite cuboids and volume, then calculate surface area | Area with unit plus method | `cuboid-surface` | Infer length and width, derive block height from volume, calculate all three face pairs; named partial surfaces and common omissions receive credit |

## Prerequisite graph introduced by this paper

```text
arithmetic-equations
  -> proportional-revenue
  -> integer-combinations
  -> inverse-proportion -> changing-rates
  -> cuboid-surface

fraction-of-quantity
  -> time-fractions
  -> area-fractions -> tiling-costs
  -> reverse-fractions -> reverse-chains

money-calculations
  -> proportional-revenue
  -> tiling-costs

mass-units
  -> reverse-fractions -> reverse-chains

geometric-loci       (independent visual strand)
spatial-rolling      (independent spatial strand)
```

## Response and grading implications

The adaptive lesson/review engine now trains the paper with these exact response types:

1. `number` - integers, decimals, money, time, and measured quantities;
2. `fraction` - exact numerator/denominator with an optional reduced-form requirement;
3. `choice` - spatial-face tracking and other finite labels;
4. `integer-set` - complete unordered solution sets with duplicate/extra detection;
5. `coordinate` - ordered pairs with separate x/y entry;
6. semantic geometry constructions - selected tool plus analytic placement and tolerance.

The generated 60-minute mock provides nine tasks, 36 points, free navigation, flags,
an absolute deadline, autosave, semantic construction, written working, and post-exam
recovery. It treats two generated parts as the deterministic partial-credit units inside
each four-point task.

The separate official 2025 replay now provides the same strict session behavior over
the learner's device-local source PDF. Its manifest maps all nine task pages and every
solution/addendum page, includes the Task 3 unordered tuple matrix and v1.1 edge cases,
and grades the Task 8 face-label fields deterministically. Optional structured fields
record the exact published intermediate values for Tasks 1, 2, 4, 5, 6, and 9. They
also preserve the fraction-valued alternative route in Task 1b, a learner-entered final
division for Task 6b, and the three distinct face families in Task 9. Tasks 1a, 1b, 2b,
2c, 4b, 4c, 5, 6, and 9 additionally accept one numeric equation per line. The evaluator matches
only source-published operation paths, requires each later operand to use the learner's
own stated previous result, binds the last equation to the final answer, and counts
arithmetic inconsistencies. This proves the documented exact and one-calculation-error
floors without interpreting prose. Wrong operations, broken chains, extra or missing
equations, and unsupported equivalent methods remain human-corrected. Task 4b receives
its single point only for the exact verified price path; Task 4c can prove its published
one-error floor while the separate 15-large-tile milestone remains sufficient for one
point. Task 9 reaches
four certain points only when the dimensions, height, all three face families, and final
surface are present or when its complete published equation path is verified; one named
partial surface can prove only the published two-point floor. Results
then enter a required nine-task correction pass: the learner compares the saved response
with the original solution and concise rubric before assigning the final integer score
from 0 to 4. Scores below the deterministic floor are unavailable. Only after all nine
tasks are corrected are recovery topics scheduled. The replay creates no XP and does not
move assessment cadence.

The dynamic `spatial-rolling` family now uses a full four-position tetrahedron
orientation transition rather than a one-face shortcut. The published Task 8a start
state provides the calibration: rolling the `bottom 4 / left 1 / right 2 / back 3`
orientation over the back edge produces `bottom 3 / left 2 / right 1 / back 4`.
Every edge transition is an involution, alternating two different edge directions
visits all four supporting faces, and Prüfungsnah generation requires the ordered
three- or four-step face sequence. Generation v4 owns this template; v1-v3 paused
sessions and generated mocks retain their original one-roll replay.

Remaining official-exam work is deliberately narrower:

- encode further prose, systematic trial-and-check, or alternative error paths only when
  a structured field can prove the operations without guessing from free writing;
- keep Task 7 manual unless a future construction surface can preserve compass traces,
  tool choice, region marking, and the physical 2 mm tolerance;
- run an independent author/teacher validation pass over every encoded rubric;
- add later archive years and their verified scales as separate manifests without
  turning fixed papers into the dynamic training inventory.

Until those checks are encoded and validated, unsupported written and geometric work
stays visibly reviewable. A final answer is never silently promoted to a certain point.
After the nine task scores are corrected, the mathematics grade is looked up in the
verified scale below rather than inferred from a generic formula.

The deliberate Task 7 boundary and the independent release protocol are documented in
[`2025-author-validation-checklist.md`](./2025-author-validation-checklist.md).

## Mathematics grade scale

The completed correction uses the mathematics column of **“Notenskala ZAP ·
Langgymnasium 2025”**, published by the Zürcher Maturitätsschulen coordination on
14 March 2025. This scale belongs only to the exact 2025 official replay; a generated
36-point mock must not reuse it as though difficulty were interchangeable.

| Points | Mathematics grade | Points | Mathematics grade |
|---:|---:|---:|---:|
| 0 | 1.00 | 16 | 3.50 |
| 1–2 | 1.25 | 17–18 | 3.75 |
| 3 | 1.50 | 19 | 4.00 |
| 4–5 | 1.75 | 20–21 | 4.25 |
| 6–7 | 2.00 | 22–23 | 4.50 |
| 8 | 2.25 | 24 | 4.75 |
| 9–10 | 2.50 | 25–26 | 5.00 |
| 11 | 2.75 | 27 | 5.25 |
| 12–13 | 3.00 | 28–29 | 5.50 |
| 14–15 | 3.25 | 30–31 | 5.75 |
|  |  | 32–36 | 6.00 |

The UI says **Mathematiknote 2025**, never “Gesamtnote” or “bestanden”. The overall
ZAP result additionally depends on the two German examination components and, where
applicable, the prior school marks.
