# ZAP 2025 official replay - independent validation checklist

This checklist is the release gate for the private 2025 replay. Automated tests prove
that the implementation is internally consistent; they do not replace an independent
mathematics teacher or experienced ZAP corrector comparing it with the rendered source.

The app's PIN-protected dynamic-task Prüflabor is useful for inspecting generated variants,
solutions, hints, diagrams, and deterministic defect reports. Its session checkmarks are
sampling aids only. They do not complete or weaken this separate official-replay sign-off.

## Fixed source identity

| Document | Pages | SHA-256 |
|---|---:|---|
| `2025_mathematik_aufgaben.pdf` | 12 | `ebbab8f760060113dee4372af3545d369bf05314abae3600b61d5d5164264ec6` |
| `2025_mathematik_loesungen.pdf` | 15 | `d4b5f336318b7003dc5dbbfa38f87fabcef7e2a9ad0d24bf60161ffa2ec7bf75` |

The reviewer must work from files with these hashes. The app rejects other files instead
of silently attaching the 2025 rubric to a different edition.

## Rubric coverage review

| Task | Automated lower bound | Human correction still required for |
|---:|---|---|
| 1 | Alternative exact intermediate values; the `75/175 = 3/7` route; `3/7` as the marked result; both published numeric equation paths in 1a; the published path in 1b; their one-calculation-error floors; unit penalty in 1b | Unsupported alternative written paths outside the strict equation grammar |
| 2 | Final-only point in a; exact `1092 : 12` route in b; bundle-price milestones and both published 20-Fr./40-Fr. equation paths in c; the documented one-error floor in c | Systematic trial-and-check and alternative written methods outside the strict equation grammar |
| 3 | Complete tuple matrix, false-row deductions, zero-row penalty, v1.1 special case | Nothing when the entered rows are complete and legible |
| 4 | Reduced fraction; tile counts; exact published price path in b; exact and one-calculation-error price path in c; 15-large-tile optimization milestone | Graphical optimization evidence and alternative written methods outside the strict equation grammar |
| 5 | 54/72/84 kg score floors; the complete published numeric equation path; its one-calculation-error and unit floors; v1.1 follow-through from a wrong first mass | Other equivalent or prose-based methods outside the strict equation grammar |
| 6 | 960/96/32 and 720/36 milestones; the published numeric equation routes and one-calculation-error floors in a and b; exact v1.1 follow-through from 6a into 6b; its one-later-error case when the final division is entered structurally | Other paths whose operations are visible only in free writing |
| 7 | No automatic points | All compass traces, tool choice, shaded region, and the physical 2 mm tolerance |
| 8 | Per-field face scoring and the four/three-correct rule | Ambiguous or illegible paper labels |
| 9 | Dimensions, height, every v1.1 partial-surface value, 288/396 special results, all three face families, and the complete published equation path with its one-calculation-error and unit floors | Equivalent calculations outside the strict equation grammar or visible only in free writing |

Task 7 is intentionally manual. Its official rubric depends on physical compass evidence
and millimetre accuracy on the imported sheet. A simplified digital checklist would not
be equivalent evidence and therefore must not create certain points.

## Golden-case procedure

For every task, compare the app result with the solution PDF for:

1. full credit;
2. every explicit intermediate-value score floor;
3. zero credit;
4. exactly one documented calculation error where applicable;
5. missing or wrong units;
6. every v1.1 addition;
7. an alternative valid method not represented by the structured fields;
8. a response that looks plausible but must not earn the point.

The automated suite in `src/domain/officialExam2025.test.ts` contains the encoded golden
cases. If the independent reviewer disagrees, change the rubric implementation and add a
regression case before accepting the correction.

## Grade and product boundaries

- Confirm the 0-36 point total against the 2025 mathematics scale dated 14 March 2025.
- Confirm that the UI says `Mathematiknote 2025`, never overall grade or `bestanden`.
- Confirm that generated mocks do not reuse the 2025 official scale.
- Confirm that submitting or correcting an official replay changes neither total XP nor
  assessment cadence; only recovery topics and their review due dates may change.
- Confirm that imported PDFs are absent from `public/`, the service-worker asset list,
  and encrypted learner backups.

## Independent sign-off

| Field | Value |
|---|---|
| Reviewer name |  |
| Role / ZAP correction experience |  |
| Date |  |
| Source hashes confirmed | yes / no |
| Tasks 1-9 accepted | yes / no |
| Grade scale accepted | yes / no |
| Corrections or follow-up issue |  |

The replay is technically ready for family testing before this sign-off, but it should
not be marketed as an independently validated official-grade simulator until every row
above is accepted.
