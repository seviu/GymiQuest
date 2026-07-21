# Archive generation v5 implementation checkpoint

Last updated: 2026-07-17, Europe/Zurich.

This file is the durable restart boundary for the archive-expansion work. Everything below is present in the current working tree. The work is intentionally **not committed or deployed** because the user did not request either action.

## Status

The mathematics archive-v5 slice is complete and verified. There is no known implementation blocker.

- Supplied 2015-2024 mathematics task and solution PDFs were audited against the archive catalog and recurrence matrix; the existing 2025 material remains part of the calibration set.
- Generation version 5 adds five archive-informed families with seven stable templates and 2,240 independently solved parameter configurations:
  - compensation schedules: 360
  - return-home schedules: 177
  - late-start schedules: 108
  - duration/price tables: 1,152
  - repeated-digit constraints: 192
  - cuboid missing-edge problems: 251
- Versions 2-4 retain their exact replay paths. Byte-level golden hashes cover all five topics touched by the v5 mixer.
- Current lessons, reviews, concept labs, assessments, and generated mock exams can draw from v5. Older mock blueprints remain replayable with their historical generation version.
- Each new question carries original-dynamic family/template provenance. Reports expose that provenance without learner-private content.
- Lesson introductions and help/repair flows use a separate, easier example from the same family and template; they never reveal the active question's values or answer.
- Every new family has a dedicated learner visual and concept-playground explanation in German, English, Italian, and Spanish.
- The author release gate now covers 69 topic/difficulty cells plus the seven new archive templates, for 76 manual checks in total.
- `docs/2015-2025-recurrence-matrix.md` records the archive evidence, implemented coverage, counts, and remaining future candidates.

## Verification on the final working-tree state

- `pnpm test`: 50 files, 460 tests passed.
- `pnpm test:e2e`: 78 tests passed across Chromium, Firefox, and iPad WebKit.
- The e2e command also completed TypeScript compilation, production build, PWA contract verification, and deployment-contract verification.
- The only build notice is the pre-existing large-chunk advisory; it is not a failure.

## German-subject follow-up

The supplied 2024-2025 German language-exam, solution, reading-text, and essay-topic PDFs were audited. The resulting implementation plan is in `docs/german-subject-expansion-plan.md`.

Key boundary: German is a second learning subject, not an interface locale. The plan preserves the same lesson/review/assessment engine, remembers the last active subject, separates deterministic grading from rubric/human review, and uses original dynamic passages and prompts for publishable training content.

## Resume instructions

No repair work is pending. On a later run:

1. Check `git status --short` and this file; do not recreate the PDF analysis.
2. If the user approves German implementation, begin with Phase 0/1 in `docs/german-subject-expansion-plan.md`.
3. Do not commit or deploy this work unless the user explicitly requests it.
