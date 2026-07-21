# ZAP 2024 official replay - independent validation checklist

This checklist is the human release gate for the private 2024 replay. Automated tests prove identity, persistence, timer behavior, manual-only scoring boundaries, and grade-scale lookup. They do not replace an independent teacher/corrector comparison against the printed originals.

## 1. Lock the three source identities

| Source | Pages | SHA-256 |
| --- | ---: | --- |
| `2024_mathematik_aufgaben_lg.pdf` | 12 | `fff33d36cacf17e207eb50d924fa6b01911ec504d28c266787f9fad6ebf73566` |
| `2024_mathematik_loesungen_lg.pdf` | 11 | `0c2008803530b6f39592a58b2e03d04d239654e44ea3a155c5cb8faeb6ed3c1d` |
| `notenskala_zap_lg_2024.pdf` | 1 | `37d3e442800c29a7878d2f90c9cb15016a96e5d41b8e06a7ce6bae7f540823cb` |

The grade scale is the official `Notenskala ZAP Langgymnasium 2024`, dated 15 March 2024:
<https://www.zh.ch/content/dam/zhweb/bilder-dokumente/themen/bildung/schulen/maturitaetsschulen/zap/korrekturschema-und-notenskala-zap-2024/lg-zap-1/notenskala_zap_lg_2024.pdf>

Any hash mismatch must disable the replay instead of attaching the 2024 rubric to another edition.

## 2. Compare every task page and response control

| Task | Task / solution page | Expected final evidence | Manual maximum |
| ---: | --- | --- | ---: |
| 1 | 3 / 3 | `4649.4` plus understandable cancellation method | 4 |
| 2 | 4 / 4 | A/B/C and all three D points in the coordinate system | 4 |
| 3 | 5 / 5 | both parking costs and both durations | 4 |
| 4 | 6 / 6 | three fractions, interval `1/24`, point `5/6` | 4 |
| 5 | 7 / 7 | `8 h 20 min` or an explicitly equivalent duration plus method | 4 |
| 6 | 8 / 8 | `37 m` and `60 m` plus the required derivation | 4 |
| 7 | 9 / 9 | four paper cube views with unambiguous fill and arrow direction | 4 |
| 8 | 10 / 10 | wrong pair and corrected value in each table | 4 |
| 9 | 11 / 11 | both number walls and the systematic digit argument | 4 |

For each task, confirm that the title, part split, point maximum, original task page, original solution page, and correction-focus copy match the printed PDFs. Confirm that task 7 stays paper/manual.

## 3. Validate the manual-only boundary

- Submit an entirely blank run: the pending result must show `0` fixed points and `36` points awaiting human correction.
- Submit correct numeric final answers: the UI may recognize them as preview evidence, but it must still fix no point before correction.
- Confirm all score choices `0–4` remain available for every 2024 task.
- Confirm the global rules are visible during correction: understandable method, no contradictory solutions, one-point unit deduction, and RF/logic-error handling.
- Confirm a completed correction cannot be edited silently and does not award XP.

## 4. Validate the 2024 mathematics scale

Compare all 37 whole-point totals against the official mathematics column. Pay special attention to year-specific boundaries where 2024 differs from 2025, including `20 points = 3.75`, `21 points = 4.0`, and `36 points = 6.0`.

The UI must say `Mathematiknote 2024`, never `Gesamtnote`, `bestanden`, or a 2025 scale identifier.

## 5. Sign-off

- [ ] Independent corrector compared all nine task/solution mappings.
- [ ] Independent corrector checked the response controls against the paper.
- [ ] Independent corrector checked the manual-only boundary and general correction rules.
- [ ] Independent corrector checked every 0–36 grade-scale mapping.
- [ ] Physical iPad run completed with the privately imported 2024 PDFs.

Record reviewer, date, device/browser, and any deviations below before calling the 2024 replay publicly validated.
