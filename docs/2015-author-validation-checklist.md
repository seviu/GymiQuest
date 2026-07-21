# ZAP 2015 official replay - independent validation checklist

This checklist is the human release gate for the private 2015 replay. Automated tests prove source identity, persistence, timing, the deterministic Task 9 score, correction limits, and the explicit no-grade state. They do not replace an independent teacher/corrector comparison against the printed originals.

## 1. Lock the two source identities

| Source | Pages | SHA-256 |
| --- | ---: | --- |
| `2015_mathematik_aufgaben_lg.pdf` | 8 | `d3110bce35c63bb9ea9a92578d065b4d4b83b086a511a76f1c3bba8fee021dc3` |
| `2015_mathematik_loesung_lg.pdf` | 11 | `2ae7bbf7d5418aac082d28fb1a802feed96e31440542937f3686a04c30d30eb9` |

Both hashes were rechecked against the files served from the [official Kanton Zürich Langgymnasium archive](https://www.zh.ch/de/bildung/schulen/maturitaetsschule/zentrale-aufnahmepruefung/pruefung-fuer-das-langgymnasium.html) on 15 July 2026.

Any hash mismatch must disable the replay instead of attaching the 2015 rubric to another edition. Neither PDF may enter the public PWA bundle or learner backup.

The official Zürich archive exposes the task paper and full correction scheme, but no primary year-specific 2015 mathematics grade-scale document was independently found for this implementation. The app must therefore keep `gradeScaleId` and `mathematicsGrade` absent rather than infer a formula, transcribe a secondary table, or borrow a later scale.

## 2. Compare every task page, solution page, and response control

| Task | Task / solution page | Expected final evidence | Maximum |
| ---: | --- | --- | ---: |
| 1 | 2 / 3 | `20 min 2 s`, `1 kg 944 g`, with the two documented method paths | 4 |
| 2 | 2 / 4 | `4.685` as a decimal, with the documented intermediate calculations | 4 |
| 3 | 3 / 5 | football is `4 Fr.` cheaper, with fraction and price reasoning | 4 |
| 4 | 3 / 6 | Stefanie is `25 m` from the finish, with both constant-speed paths | 4 |
| 5 | 4 / 7 | total perimeter `72 cm`, with the documented rectangle dimensions | 4 |
| 6 | 5 / 8 | `980` bottles, with revenue, package, and bottle-count stages | 4 |
| 7 | 5 / 9 | great-grandmother is `98` years old, with the documented age constraints | 4 |
| 8 | 6 / 10 | maximum distance `3120 km`, with passenger/fuel weight stages | 4 |
| 9 | 7 / 11 | pairs `1-D`, `2-A`, `4-C`; net 3 and cube B remain unmatched | 4 |

Confirm each title, part split, point maximum, task page, solution page, and correction-focus summary against the originals. Tasks sharing one printed page must still open the correct page. The spare working page 8 is not a separate task.

## 3. Validate the deterministic boundary

- Task 9: all three correct pairs give `4` points.
- Task 9: two correct pairs and no false pair give `3` points.
- Task 9: two correct pairs and one false pair give `2` points.
- Task 9: two correct pairs and two false pairs give `0` under `Sonst`.
- Task 9: one correct pair gives `1` point; no correct pair gives `0`.
- Task 9: the resulting score is fixed. Human correction must disable both lower and higher values.
- Tasks 1-8: even an apparently correct final number leaves the full four points open because the printed general rules and task-specific options depend on method, units, intermediate evidence, and error type.
- Completing correction must reject any score below a fixed floor or above the remaining reviewable ceiling.

## 4. Validate the no-grade result

- Complete all nine task scores and confirm the exact corrected total from `0-36` is stored.
- Confirm the result, Progress history, and companion history all identify edition `2015`.
- Confirm the UI says `Offizielle Notenskala nicht verifiziert` and `Korrigierter Punktestand ohne Notenumrechnung`.
- Confirm no 2024 or 2025 scale identifier, mathematics grade, pass/fail claim, or overall ZAP grade appears.
- Confirm correction and recovery scheduling do not change XP or `xpSinceAssessment`.

## 5. Sign-off

- [ ] Independent corrector compared all nine task/solution mappings.
- [ ] Independent corrector checked every rubric summary and manual boundary.
- [ ] Independent corrector reproduced all five Task 9 score outcomes.
- [ ] Independent corrector confirmed Tasks 1-8 remain human-corrected.
- [ ] Independent corrector confirmed the 2015 no-grade state throughout the app.
- [ ] Physical iPad run completed with the privately imported 2015 PDFs.

Record reviewer, date, device/browser, and any deviations below before calling the 2015 replay publicly validated.
