# ZAP 1 mathematics archive and recurrence matrix, 2015-2025

This audit prevents the training engine from overfitting to the 2025 paper. It records the mathematical structure of eleven Zürich Langgymnasium papers and uses recurrence across years to prioritize original dynamic training families.

Official tasks are calibration and golden-test sources. Public training content must use original wording, values, diagrams, and contexts.

## Source registry

| Year | Aufgaben source | Pages | Solution source | Pages | Inspection note |
|---:|---|---:|---|---:|---|
| 2015 | `2015_mathematik_aufgaben_lg.pdf` | 8 | `2015_mathematik_loesung_lg.pdf` | 11 | Searchable task and detailed rubric text |
| 2016 | `2016_mathematik_aufgaben_lg.pdf` | 8 | `2016_mathematik_loesung_lg.pdf` | 1 | Searchable tasks; image-only answer sheet |
| 2017 | `2017_mathematik_aufgaben_lg.pdf` | 12 | `2017_mathematik_loesung_lg.pdf` | 1 | Searchable tasks; image-only answer sheet |
| 2018 | `2018_mathematik_aufgaben_lg.pdf` | 12 | `2018_mathematik_loesung_lg.pdf` | 1 | Searchable tasks; image-only answer sheet |
| 2019 | `2019_mathematik_aufgaben_lg.pdf` | 12 | `2019_mathematik_loesung_lg.pdf` | 1 | Searchable tasks and answer text |
| 2020 | `2020_mathematik_aufgaben_lg.pdf` | 12 | `2020_mathematik_lg.pdf` | 1 | Image-only; every task page inspected from rendered images |
| 2021 | `2021_mathematik_aufgaben.pdf` | 12 | `2021_mathematik_loesungen.pdf` | 1 | Image-only; every task page inspected from rendered images |
| 2022 | `2022_mathematik_aufgaben.pdf` | 11 | `2022_mathematik_loesungen.pdf` | 1 | Searchable tasks and answer text |
| 2023 | `2023_mathematik_aufgaben_lg.pdf` | 12 | `2023_mathematik_loesungen_lg.pdf` | 12 | Searchable tasks and detailed rubric |
| 2024 | `2024_mathematik_aufgaben_lg.pdf` | 12 | `2024_mathematik_loesungen_lg.pdf` | 11 | Searchable tasks and detailed rubric |
| 2025 | `2025_mathematik_aufgaben.pdf` | 12 | `2025_mathematik_loesungen.pdf` | 15 | Searchable tasks, detailed rubric, and correction addendum |

All files are under `/Users/svieira/Downloads`. Each paper has 60 minutes, nine tasks, and 36 available points.

The private runtime catalog verifies the exact local sources below. A machine audit on 15 July 2026 matched all 22 SHA-256 values and all 22 page counts against the files above.

| Year | Aufgaben SHA-256 | Lösungen SHA-256 |
|---:|---|---|
| 2015 | `d3110bce35c63bb9ea9a92578d065b4d4b83b086a511a76f1c3bba8fee021dc3` | `2ae7bbf7d5418aac082d28fb1a802feed96e31440542937f3686a04c30d30eb9` |
| 2016 | `57ab709a8da6b16ed0935548726d74d58f0384df4000db7eff42cf400c16bcd7` | `d598a8b7ebf3880adc242a120dac0d517c0de4704e3d4863a626c4305ec913df` |
| 2017 | `f82688d2af46224ab8d1a441f224d9fd0240cfa689a1d5eb84a9622c603dbb3b` | `3b33ed4ab48297745251d731c8e35086a9ab433b8ac25258dc3dbc64eca8342a` |
| 2018 | `ddb683633133e7d125f9a626235e143d8e9dfb538a8420a77e5b6fe4d05f4aa3` | `3e058d9eceb7ece6558edc7c440eb8781fa34e07567ea870a446e1fb91cb5fa6` |
| 2019 | `156eea641d704add69e31f2af9a124e3a2fb17559b820788fa79d4c86500ae3d` | `1d0e040d4fced1f4d338f3ae1ff5a0d475cc1b68e77cc2804eb5ec09f8394dca` |
| 2020 | `2b7313d7fd206382f25325e76afb1fb8d14344fee4ae98d0cac1c257a40070e7` | `e1904f8e9a00ae7d08aca9ce236c1b300aba8b31d18205259b632d3391136808` |
| 2021 | `cc76181e502276332b9fd6bc06db11a492883c6c6c042ef55bfc5bc1caf90f9f` | `80dc61a825f9e1efecfd381e970be6d56a5489ce21eb8cbb25528cabece96c98` |
| 2022 | `4affdc63b8cafb23b0c62d6a47e621e73b8ce3d9af6bb37ad5d6078ded624c62` | `37ba11d6ae9b386367d9cf34b6b91f96874878d5aef79aed5100892b55f0c969` |
| 2023 | `a4dcf9b354db4be9d9ae6b6b37577d8f0dda809b63b01f3cdffea819bf9a6403` | `e140e436152944f942e66cf1616027aa5079412c6eba542b249b3310aff5fc4a` |
| 2024 | `fff33d36cacf17e207eb50d924fa6b01911ec504d28c266787f9fad6ebf73566` | `0c2008803530b6f39592a58b2e03d04d239654e44ea3a155c5cb8faeb6ed3c1d` |
| 2025 | `ebbab8f760060113dee4372af3545d369bf05314abae3600b61d5d5164264ec6` | `d4b5f336318b7003dc5dbbfa38f87fabcef7e2a9ad0d24bf60161ffa2ec7bf75` |

### Private archive capability boundary

- The app can select many PDFs at once, identify them by content rather than filename, and store each task/solution document under its verified year in IndexedDB.
- All 11 years are available in a local page reader. The 2016–2022 pairs additionally run as strict 60-minute source training with an absolute persisted deadline, free task order, flags, paper-attempt marks, and solutions locked until submission or timeout. No PDF is copied into the public PWA artifact or encrypted learner backup.
- The independently encoded 2015, 2023, 2024, and 2025 rubrics are connected to strict replay. The 2024 edition remains fully human-scored; the 2025 edition uses only its documented conservative floors; the 2023 edition fixes only its truth-table and exact `156` rules; and the 2015 edition fixes only Task 9's published cube/net pairing score. Every other point is corrected against the original pages.
- Only 2024 and 2025 use published year-specific mathematics scales. The 2015 and 2023 replays end with corrected 0–36 point totals and explicitly withhold a grade until primary official scales are independently obtained and validated. The 2016–2022 editions remain source-only; after the timer they permit only three task-level self-review labels: end result matches, differs/unclear, or not attempted. Their one-page final-answer sheets cannot establish method or partial credit, so the result deliberately has no points, grade, XP, mastery effect, or adaptive review effect.

## Task-family synopsis

| Year | Task families, in paper order |
|---:|---|
| 2015 | mixed time/mass units; decimal arithmetic; sequential fractions and money; constant speed; composite perimeter; revenue ratios; linked age equations; fractions with fuel consumption; cube nets |
| 2016 | volume/time units; decimal missing-value equation; inverse step-length relation; mass and linked equations; constrained combinations; count relations; multi-phase travel; drilled cube and exposed faces; quadrilateral construction |
| 2017 | volume equation; decimal arithmetic; linked count ratios; speed; composite perimeter; fractional surcharge; mixture-cost optimization; integer combinations; polyhedron net correspondence |
| 2018 | efficient arithmetic; time units; redistribution; reverse unit price; out-and-back speed; conservation after a cutting error; grid spiral measurement; digit constraints and divisibility; intersected loci |
| 2019 | efficient arithmetic; data table with units and fractions; inverse proportion; money equation; distributive structure; average speed; rectangular frame; digit constraints; cube-solid surface and path |
| 2020 | fraction of a length and efficient arithmetic; data table, fractions, and money; divisors; fraction comparison and midpoint; digit constraints; composite area; changing fill rates; cube plan and surface; coordinate loci |
| 2021 | reverse arithmetic chain and efficient multiplication; rental table and time; speed and missed connection; number sequences; recurring schedules and LCM; proportional revenue; composite area; cube rolling; symmetric construction |
| 2022 | efficient arithmetic; climate table, fractions, and mean; cube counting; reverse fraction; catch-up speed; number-line distance; package dimensions and volume; leaking fill rate; rotations, reflections, and symmetry |
| 2023 | missing values with units and time; travel table and speed; area fractions; arithmetic equivalence laws; scale/locus construction; cuboid net and volume; arithmetic square; package equality and LCM; overlapping area and perimeter |
| 2024 | efficient arithmetic; coordinates and parallelograms; piecewise prices; fractions and number line; multi-day relative motion; composite rectangular gardens; cube orientation; proportional unit pairs; constrained number wall |
| 2025 | missing-value chain; time fraction; money and revenue table; integer coin combinations; tiled fractions and cost optimization; reverse mass process; inverse/changing supply; intersected loci; tetrahedron rolling; cuboid surface |

## Recurrence matrix

`●` means the family is materially assessed in that year. Counts are paper-level presence, not the number of subtasks.

| Family | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | Papers | Current engine before this audit |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---:|---|
| Calculation fluency and compatible units | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | 11/11 | Strong, but mass-heavy |
| Fractions, ratios, and proportional quantities | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | 11/11 | Strong |
| Spatial solids, nets, or orientation | ● | ● | ● |  | ● | ● | ● | ● | ● | ● | ● | 10/11 | Partial: tetrahedron and cuboid only |
| Speed, distance, and time | ● | ● | ● | ● | ● |  | ● | ● | ● | ● |  | 9/11 | Missing as a topic |
| Composite planar area or perimeter | ● |  | ● | ● | ● | ● | ● |  | ● | ● | ● | 9/11 | Partial: tiled areas only |
| Systematic number constraints, patterns, or enumeration |  | ● | ● | ● | ● | ● | ● |  | ● | ● | ● | 9/11 | Partial: one coin-combination family |
| Construction, coordinates, or transformations |  | ● |  | ● |  | ● | ● | ● | ● | ● | ● | 8/11 | Partial: loci only |
| Tables and multi-column data interpretation |  |  |  |  | ● | ● | ● | ● | ● | ● | ● | 7/11 | Partial: money table only |
| Explicit efficient-arithmetic structure |  |  |  | ● | ● | ● | ● | ● | ● | ● |  | 7/11 | Missing as a topic |
| Multi-stage rates or changing processes | ● | ● | ● | ● | ● | ● |  | ● |  | ● | ● | 9/11 | Strong for supply; speed variant missing |

## Generator decisions from recurrence

The first four additions are evidence-based gaps, not one-off paper replicas:

1. `speed-distance-time` - uniform, relative, and multi-phase motion with exact no-calculator values.
2. `composite-areas` - decompose or subtract rectangles; derive missing dimensions before area/perimeter.
3. `number-constraints` - return the complete unordered set satisfying divisibility, digit, range, and sum conditions.
4. `efficient-arithmetic` - factor common terms and use compensation/distributivity before calculating.

The second archive wave adds `data-tables`, `coordinate-transformations`, and `cube-nets`. Table complements, missing means, and linked route totals are solved from original displayed cells. Coordinate questions require produced ordered pairs for reflections, rotations, and translations. Cube questions enumerate the 35 free hexominoes, retain the eleven valid nets, and derive opposite faces by simulated folding. Each family has 1,000-seed validation and learner-facing explanations.

### Generation v5: third archive wave

Generation v5 adds five original archive-informed families and seven templates to five existing topics. The dispatcher deterministically mixes them with the earlier generators; it does not turn an official task into a fixed practice question.

| Family | Templates | Official calibration anchors | Independently checked invariant | Enumerated candidates |
|---|---|---|---|---:|
| `archive-v5-efficient-compensation` | `round-number-above`, `round-number-below` | 2018 Task 1; 2019 Task 5; 2022 Task 1 | The nearby factor is the round base plus or minus the offset, and the answer is recomputed as the exact product. | 360 |
| `archive-v5-travel-timing` | `return-home`, `late-start` | 2018 Task 5; 2021 Task 3 | Planned distance is recomputed from speed and time; consumed minutes are removed before solving the required speed from the remaining time. | 285 |
| `archive-v5-duration-price-table` | `infer-base-and-hourly-rate` | 2021 Task 2 | The hourly rate is recovered from the difference of two table rows, the base fee from either row, and the target price from both recovered values. | 1,152 |
| `archive-v5-repeated-digit-filter` | `complete-set-with-repetition` | 2018 Task 8 | An independent four-place enumeration rechecks allowed repeated digits, lower bound, non-redundant divisibility, digit sum, place relation, uniqueness, and completeness. Learner sets are capped at eight values to avoid transcription-heavy iPad work. | 192 |
| `archive-v5-cuboid-missing-edge` | `height-from-volume` | 2022 Task 7 | The missing height is recomputed as `volume / (length * width)` and verified by `length * width * height = volume`. | 251 |

The diagnostics therefore expose **5 families, 7 templates, and 2,240 solved candidate configurations**: 360 compensation, 177 return-home, 108 late-start, 1,152 duration-price, 192 repeated-digit, and 251 cuboid configurations. The generator tests replay 1,000 seeds per family and independently verify each invariant; a separate locale pass checks that German, English, Italian, and Spanish preserve identical mathematics.

The replay boundary is explicit: new learning tasks default to generation version 5, while stored version 2, 3, and 4 tasks keep their previous routing and deterministic output. Seeds control template and value selection. Official papers supply only structural calibration and golden-answer checks; public questions use original wording, contexts, values, and visuals.

### Prioritized archive gaps after v5

The next evidence-backed gaps are relational systems, voxel-solid counting and exposed surfaces, recurring-cycle/LCM situations, structured number or logic puzzles, and number-line reasoning. These remain candidates for a later wave; they are not implemented by generation v5.

## Acceptance rules

- Every dynamic instance must be reproducible from its seed.
- Every generated value set must be solved independently by code, not stored as an unverified prompt answer.
- No family is considered covered by a single fixed official task.
- Official wording, diagrams, and numerical configurations remain separate from original practice content.
- The generated full-mock blueprint keeps nine recurrence-based family slots and varies the selected topics, values, diagrams, and contexts deterministically from its seed. It does not replay the 2025 topic order.
