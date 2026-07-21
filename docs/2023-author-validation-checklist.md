# ZAP 2023 official replay - independent validation checklist

This checklist is the human release gate for the private 2023 replay. Automated tests prove source identity, persistence, timing, the two deterministic score boundaries, correction limits, and the explicit no-grade state. They do not replace an independent teacher/corrector comparison against the printed originals.

## 1. Lock the two source identities

| Source | Pages | SHA-256 |
| --- | ---: | --- |
| `2023_mathematik_aufgaben_lg.pdf` | 12 | `a4dcf9b354db4be9d9ae6b6b37577d8f0dda809b63b01f3cdffea819bf9a6403` |
| `2023_mathematik_loesungen_lg.pdf` | 12 | `e140e436152944f942e66cf1616027aa5079412c6eba542b249b3310aff5fc4a` |

Any hash mismatch must disable the replay instead of attaching the 2023 rubric to another edition. Neither PDF may enter the public PWA bundle or learner backup.

No primary official 2023 mathematics grade-scale PDF has been independently validated for this implementation. The app must therefore keep `gradeScaleId` and `mathematicsGrade` absent rather than transcribing a secondary table or borrowing the 2024/2025 scale.

## 2. Compare every task page, solution page, and response control

| Task | Task / solution page | Expected final evidence | Maximum |
| ---: | --- | --- | ---: |
| 1 | 3 / 3 | `352 kg`, `49 min`, method and intermediate values `704`, `85` | 4 |
| 2 | 4 / 4 | `273 km`, `400 km/h`, `40 min`, with documented method/unit rules | 4 |
| 3 | 5 / 5 | `A = 4/15`, `B = 1/2`, `20` squares, valid containing rectangle | 4 |
| 4 | 6 / 6 | right, wrong, right, wrong; `+1/−1/0`, floored at zero | 4 |
| 5 | 7 / 7–8 | perpendicular bisector/P and complete reachable-region construction | 4 |
| 6 | 8 / 9 | `8000 cm³`, matching edge `k`, both matching `E` points | 4 |
| 7 | 9 / 10 | both completed arithmetic squares | 4 |
| 8 | 10 / 11 | `156` forks; exact result earns four even without visible working | 4 |
| 9 | 11 / 12 | `18 cm²`, `31.4 cm`, method and documented intermediate lengths | 4 |

Confirm each title, part split, point maximum, task page, solution page, and correction-focus summary against the originals. Task 5 must expose both solution pages. Paper constructions and net markings must remain human-corrected.

## 3. Validate the deterministic boundary

- Task 4: all four correct choices give `4`; three correct and one wrong give `2`; two correct and two wrong give `0`; three correct plus one blank give `3`.
- Task 4: the resulting task score is fixed. The correction UI must disable both lower and higher values.
- Task 8: `156` and `156 Gabeln` give a fixed `4`, because the printed rubric explicitly accepts the correct result found by trial without a visible path.
- Task 8: any other answer leaves `0–4` open so the original partial-credit branches can be judged by a person.
- Every other task begins with no fixed points and its full four-point maximum available for correction, even when the app recognizes a plausible final result.
- Completing correction must reject any score below a fixed floor or above the remaining reviewable ceiling.

## 4. Validate the no-grade result

- Complete all nine task scores and confirm the exact corrected total from `0–36` is stored.
- Confirm the result, Progress history, and companion history all identify edition `2023`.
- Confirm the UI says `Offizielle Notenskala nicht verifiziert` and `Korrigierter Punktestand ohne Notenumrechnung`.
- Confirm no 2024 or 2025 scale identifier, mathematics grade, pass/fail claim, or overall ZAP grade appears.
- Confirm correction and recovery scheduling do not change XP or `xpSinceAssessment`.

## 5. Sign-off

- [ ] Independent corrector compared all nine task/solution mappings.
- [ ] Independent corrector checked every rubric summary and paper/manual boundary.
- [ ] Independent corrector reproduced the Task 4 penalty table and Task 8 exact-answer rule.
- [ ] Independent corrector confirmed all other points remain human-corrected.
- [ ] Independent corrector confirmed the 2023 no-grade state throughout the app.
- [ ] Physical iPad run completed with the privately imported 2023 PDFs.

Record reviewer, date, device/browser, and any deviations below before calling the 2023 replay publicly validated.
