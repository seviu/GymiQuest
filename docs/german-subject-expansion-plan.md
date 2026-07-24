# German subject expansion plan

## Implementation checkpoint — 23 July 2026

The recommended first slice is implemented locally:

- the existing Mathematics runtime is preserved behind a subject registry;
- Mathematics and German use stable, isolated course keys plus a migrated course index;
- the main page has a responsive subject selector and deterministic resume policy;
- German has its own no-XP start check, XP ledger, review schedule, and resumable session;
- all ten closed-question families are live across five active strands, with 153 authored lesson/review templates and deterministic fresh-review exclusion;
- generator v2 adds connector cloze, tense/perspective transformation, and word-class identification; generator v3 adds deterministic three-pair sentence-constituent matching; generator v4 adds explicit foundation, standard, and exam template pools; generator v5 adds 12 constrained whole-sentence corrections with finite accepted variants; generator v6 adds 12 exact-two multi-evidence templates; generator v7 adds 12 four-group sentence-analysis templates while stored generator-v1–v6 sessions, reports, exams, results, and backups remain replayable;
- scoring policy v1 resolves an explicit rule per response model and records correct evidence units separately from awarded points; all 153 lesson/review templates appear in an author-validation matrix with family, response kind, difficulty, introduction version, and scoring rule;
- new lessons use foundation questions, scheduled reviews use standard questions, and periodic assessments plus the 45-minute simulation use exam questions; each five-question route has enough distinct templates to avoid an in-session repeat;
- exam blueprint v5 adds one newly authored seven-row true/false/undecidable grid with the exact 2025 task-5 threshold conversion, accessible row groups, partial autosave, answer-free reports, encrypted-backup support, and v1-v4 replay;
- exam blueprint v6 adds one constrained accepted-text correction with accessible input, autosave, privacy-safe completed results, encrypted-backup support, and v1-v5 replay;
- exam blueprint v7 replaces the third single-line evidence item with a four-option, exact-two multi-evidence task, keeps 15 tasks and 17 points, and preserves v1-v6 replay;
- exam blueprint v8 adds a newly authored six-row R/F grid with the 2024 task-9 add/subtract/no-omission conversion, keeps 15 tasks, expands the training form to 19 points, and preserves v1-v7 replay;
- exam blueprint v9 includes exactly one four-group sentence-analysis task with the 2025 task-14 two-points-minus-errors/no-negative-points conversion, keeps 15 tasks, expands the training form to 20 points, and preserves v1-v8 replay;
- all 57 passage-scoring units now appear in a machine-checked author catalog; the quality gate verifies unique IDs, sequential and valid line references, truth-status and binary-grid balance, vocabulary and multi-select answer uniqueness, source status, introduction version, and exclusion of later units from legacy papers;
- the German start check prioritizes insecure strands without granting mastery;
- German XP triggers an isolated mixed assessment whose missed skills return immediately as fresh reviews;
- unclear German topics pause immediately, leave the assignment feed, and appear in the protected companion dashboard until explicitly reopened.
- encrypted backup payload v5 round-trips both isolated courses, their resume index, and German source-practice state, while legacy payloads still restore without inventing German activity;
- separate current-subject reset actions preserve the other course, global profile, companion access, imported PDFs, and app settings;
- German questions now open answer-free, versioned defect reports in a separate tab, using the same Codex handoff as Mathematics.
- a generated 45-minute Sprachprüfung training mode now keeps one numbered text sheet visible across 15 objective questions, supports free navigation and flags, survives reloads, submits at the absolute deadline, and schedules targeted reviews without awarding XP;
- active and completed German simulations are included in encrypted backups, and every exam question has the same answer-free, separate-tab defect-report path.
- writing blueprint v1 now generates one choice from each of three prompt families, drawing from 12 newly authored prompts whose narrative, anchored-narrative, and report slots were rechecked against the 2015–2026 archive;
- the separate writing studio persists prompt choice, a three-part plan, title, draft, word count, and six-step self-review under an absolute 60-minute deadline that continues across exits and reloads;
- active and completed writing sessions round-trip through encrypted backups, affect neither XP nor objective mastery, and deliberately produce no automatic points or ZAP grade;
- every generated writing prompt has a replay-safe report link whose payload excludes the learner's title, plan, draft, checklist, and history.
- the protected companion dashboard lists completed texts with pending work first and lets an adult save one evidence-specific strength plus one achievable next step; the learner can read that feedback, but it has no scoring or mastery effect and round-trips only through local persistence and encrypted backups.
- constrained comprehension now draws 12 deterministic prompts from four original microtexts, requires a bounded explanation plus one or two evidence lines, and blocks only another short response while human feedback is outstanding;
- the protected companion view exposes authored expected elements and likely evidence lines, records an evidence status plus one strength and next step, and requires learner acknowledgement before the next prompt; the entire lifecycle persists locally and through encrypted backup without points, XP, grade, mastery, or automatic judgement;
- each comprehension prompt has a replay-safe issue-report link that excludes the learner response, evidence selection, reviewer feedback, and progress history.
- the private German archive registers all 49 supplied 2015–2026 PDFs, including the separate 2015 essay-correction guidance, verifies renamed files by exact content hash, stores them beside but never inside the Mathematics catalog, and exposes a compact year selector with a responsive device-local reader;
- German source PDFs remain outside encrypted backups and the public build, survive a German-subject progress reset, disappear on complete-profile reset, and create no points, XP, grade, mastery, or adaptive evidence.
- all twelve source years now launch a persisted 45-minute language-paper workspace or 60-minute essay workspace; language solutions stay locked until submission, absolute deadlines survive reloads, source essays autosave locally and through encrypted backup, and completion records only bounded self-review without learning effects;
- browser-based iPad-width QA covers the source shelf, language/text/solution tab switching, PDF cleanup, essay split view, reload resume, and horizontal-overflow boundary; physical-device sign-off remains separate.

This remains a private learning-engine milestone, not full German exam coverage. The current simulation is a newly authored 20-point training paper with one source-equivalent grouped scoring rule, two source-calibrated digital adaptations, finite accepted text, and exact-set multi-select training. The writing studio is a newly authored 60-minute training surface, not a reproduction of an official prompt sheet and not an automatic essay grader. The comprehension and writing companion workflows record bounded human feedback, not a validated rubric or grade. The platform does not claim to reproduce the official 2015–2026 papers, whose structures vary from 14–17 tasks and 46–56 points. The official PDFs now support deliberately ungraded timed source practice; paper-equivalent invalid-mark handling and validated teacher scoring remain future work.

## Product decision

German is a second **subject**, not another interface language. The two choices stay independent:

- **App language:** German, English, Italian, or Spanish.
- **Active subject:** Mathematics or German.

German passages and answers remain in German even when navigation and explanations use another app language.

## What the 2015–2026 archive requires

The 49 supplied source documents establish three connected, but operationally distinct, products:

| Component | Archive evidence | Platform mode |
| --- | --- | --- |
| Sprachprüfung | 45 min every year; 14–17 tasks and 46–56 official points | Timed language and reading assessment |
| Textblatt | One persistent narrative reference for each paper | Persistent source pane for the Sprachprüfung |
| Text verfassen | Three prompt choices every year; prompt bundles and correction material vary | Separate writing studio and timed writing simulation |

The Sprachprüfung has two strands: `Teil A: Textverständnis` and `Teil B: Sprachbetrachtung`. Many language questions still quote or transform material from the Textblatt, so the passage must remain available throughout both parts.

The solutions show that scoring is more expressive than a single correct-answer flag. Examples include threshold scoring for true/false/undecidable grids, penalties for wrong selections, exact line ranges, distinct semantic categories, accepted equivalent phrasings, and orthography deductions on selected tasks only. The 2015 essay-correction guidance and the 2025 correction addendum also show why rubrics and accepted-answer policies must stay source- and version-specific.

The official material is calibration evidence. Worldwide training content should use newly authored passages, sentences, prompts, values, and contexts unless publication rights are secured.
The detailed recurrence and scoring audit lives in
[`2015-2026-german-recurrence-matrix.md`](./2015-2026-german-recurrence-matrix.md).

## Main-page experience

For two subjects, use a segmented selector beside the home title on iPad and desktop:

`Mathematik | Deutsch`

On a narrow phone, render the same semantic control as a `<select>` to preserve space and accessibility.

### Selection and resume rules

1. If either subject has a paused session, open that subject and show `Fortsetzen`.
2. Otherwise, reopen the subject used or completed most recently.
3. Migrated learners default to Mathematics only once.
4. Changing app language never changes the active subject.
5. Subject switching is available on the main page, not during an unanswered exercise.

Each subject remembers its own current lesson, review queue, assessment progress, unclear topics, XP events, and mock exam. Switching back must restore that exact state.

## Complete learner flow

### First visit to German

Reuse the learner name, exam date, accessibility settings, and companion access. Do not repeat global onboarding. Run only a short German start check covering reading evidence, vocabulary in context, morphology, grammar, and sentence structure. Use it to choose the starting lessons; it awards neither a grade nor XP.

### German home

Use the existing lesson/review/assessment feed with six initial strands:

1. Leseverständnis
2. Wortschatz im Kontext
3. Wortbildung
4. Grammatik und Orthografie
5. Satzbau
6. Text verfassen

The recommended next activity can be a lesson, scheduled review, targeted repair, or periodic assessment. XP is recorded from the beginning, but assessment cadence and mastery remain subject-specific so German activity cannot unlock a mathematics assessment.

### Reading lesson and review

On iPad, use a split view: numbered passage on the left, current question on the right. On a phone, the passage opens in a persistent sheet and returns to the same answer field. The learner can highlight evidence and jump to referenced lines.

The help flow follows the current mathematics pattern:

1. Key idea with a small annotated excerpt.
2. Worked example using a different microtext.
3. Teach-back check with fresh wording.
4. Return to the original unanswered question.

`Ich verstehe dieses Thema noch nicht` pauses that German skill and adds it to the companion queue. No more questions from that skill appear until the companion explains and reopens it.

### Sprachprüfung simulation

- 45-minute strict timer.
- Textblatt always available.
- Free task order and flags.
- Per-task, versioned scoring policy.
- Objective points shown immediately after submission.
- Rubric-dependent answers marked `awaiting review`, never silently guessed as correct.
- Failed skills create targeted reviews with new passages and sentences.

### Writing studio and Aufsatz simulation

The writing studio is a separate mode:

- Choose one of three original, deterministic prompts.
- Use a three-part plan plus a visible checklist for genre, tense, perspective, required elements, title, language, and punctuation.
- Autosave one current title, plan, and draft locally with a live word count.
- Run a strict 60-minute deadline from the moment the studio starts, including time spent outside the editor.
- Keep the stored result explicitly awaiting human feedback; no automatic points, XP, grade, structure judgement, or clarity judgement is inferred.
- In the PIN-protected companion area, read the full draft together and record one observable strength plus one achievable next step; show those human notes back to the learner.
- Open a reproducible issue report for any prompt without including the learner's writing.

## Dynamic content engine

German training must be dynamic in the same sense as Mathematics: a learner should not exhaust one copied paper.

### Original microtext corpus

Author versioned, age-appropriate narrative and informational microtexts. Each text stores:

- numbered lines and sentences;
- explicit facts and supporting spans;
- inferences and excluded inferences;
- characters, motives, emotions, and changes;
- vocabulary senses and synonym sets;
- grammatical annotations and transformable sentences;
- difficulty and reading-length metadata.

One text can safely generate multiple linked questions, but a review should use a different text so it measures transfer rather than memory.

### First objective generator families

1. True / false / undecidable with evidence.
2. Exact line or sentence evidence selection.
3. Contextual synonym and semantic outlier.
4. Word-family and morpheme transformation.
5. Connector/function-word cloze.
6. One-error grammar correction with exactly one permitted edit.
7. Tense and perspective transformation.
8. Word-class identification.
9. Sentence-constituent matching and reordering.
10. Exact-two multi-evidence selection.

Every family needs an independent validator, deterministic seed, difficulty score, accepted-answer policy, and four-locale explanation coverage. Do not create variety by merely shuffling copied official options.

### Scoring evidence boundary

The platform keeps generated-training scores separate from official correction rules. The supplied solution sheets establish at least three distinct official patterns:

- 2025 solutions, PDF page 5, Aufgabe 5: correct truth-grid rows are converted through thresholds rather than scored as independent one-point questions.
- 2024 solutions, PDF page 17, Aufgabe 9: correct selections gain intermediate credit, incorrect selections subtract, and omissions do not subtract.
- 2025 solutions, PDF page 14, Aufgabe 14: each sentence-analysis part starts from two points, loses one per error, and cannot become negative.

Those rules are not interchangeable. GymiQuest therefore labels `exact-option-v1`, `exact-matching-v1`, `exact-accepted-text-v1`, and `exact-multi-select-v1` as source-informed training rules. Exact three-pair matching and multi-select store unit-level evidence but award one point only for an exact response; the multi-select rule does not imitate an official penalty conversion. Accepted text is limited to a finite authored answer set after Unicode and whitespace normalization; genuinely open wording is not auto-graded. The separate `truth-grid-threshold-2025-v1` rule is source-equivalent because its generated response model has exactly seven single-choice rows and applies the documented 7→3, 6→2, 4–5→1, 0–3→0 conversion. `binary-grid-penalty-2024-v1` applies the documented six-row correct-minus-wrong intermediate score and 6/5/3–4/<3 conversion, with omissions worth zero. It is explicitly a source-calibrated digital adaptation because radio controls prevent two marks in one row. `sentence-analysis-deduction-2025-v1` begins each newly authored four-group item at two points, deducts one per incorrect or omitted group, and stops at zero, matching the official 2025 task-14 arithmetic. It remains a digital adaptation because GymiQuest supplies the word groups and question choices instead of grading the handwritten source response. Paper-equivalent invalid-mark handling remains unavailable.

### Rubric-assisted families

- Precise paraphrase with required or forbidden words.
- Two genuinely different reasons.
- Multi-evidence explanation in the learner's own words.
- Character or mood interpretation.

These return `secure`, `needs-review`, or `not-gradable` evidence. Only secure automatic results or completed human review may change mastery.

## Architecture

### Preserve mathematics replay

Do not renumber or reinterpret mathematics generation versions 2–6. Add an explicit generator namespace; an absent namespace permanently means legacy mathematics.

```ts
type SubjectId = "math" | "german"

type GeneratorReference =
  | { generatorId?: "zh-zap1-math"; version: 2 | 3 | 4 | 5 | 6 }
  | { generatorId: "zh-zap1-german"; version: 1 | 2 | 3 | 4 | 5 | 6 | 7; corpusVersion: 1 }
```

German tasks always pin the curriculum package, generator, corpus, seed, template, scoring-policy version, and content locale.

### Subject runtime

Create a subject registry instead of adding German conditionals throughout `App.tsx`:

```ts
interface SubjectRuntime {
  package: CurriculumPackage
  topics: TopicCatalog
  lessons: LessonCatalog
  generateQuestions(task: LearningTask): GeneratedQuestion[]
  diagnoseAnswer(question: GeneratedQuestion, answer: unknown): Diagnosis
  coachingForTopic(topicId: string, locale: AppLocale): CoachingCopy
  buildMockExam?: (seed: string) => StrictExamBlueprint
  archive?: SubjectArchiveAdapter
}
```

Suggested modules:

- `src/domain/subjectRegistry.ts`
- `src/subjects/math/module.ts`
- `src/subjects/german/package.ts`
- `src/subjects/german/content.ts`
- `src/subjects/german/generators.ts`
- `src/subjects/german/grading.ts`
- `src/subjects/german/coaching.ts`

Wrap the current mathematics implementation; do not rewrite it during the first migration.

### Multi-course persistence

Replace the singleton repository key `current` with stable course keys:

- `zh-zap1-math@1`
- `zh-zap1-german@1`

Add a small global index:

```ts
interface LearnerCourseIndex {
  schemaVersion: 1
  activeCourseKey: string
  courseKeys: string[]
  lastUsedAtByCourse: Record<string, string>
  lastCompletedAtByCourse: Record<string, string>
}
```

An IndexedDB upgrade copies legacy `current` records to Mathematics transactionally. It must retain the legacy record until the new write succeeds. Parent access and release-readiness data remain global.

### Response renderer and grader registry

Extract the current direct response-kind branches into registered renderers and graders. German adds:

- multiple choice and multi-select;
- true/false/undecidable grids;
- cloze fields;
- passage-span and line-range selection;
- matching (implemented for sentence constituents in generator v3);
- ordering;
- constrained text correction;
- accepted-variant short answer;
- rubric-reviewed long text.

Add `gradingConfidence` and `evidenceStatus` to question results. Existing mathematics results migrate as secure automatic evidence.

### Archive, reports, backup, and reset

German archive editions have four core document roles—language exam, solutions, text sheet, and essay topics—and can register source-specific companion roles such as the 2015 essay-correction guidance. Each subject declares its own roles instead of assuming the mathematics pair.

Exercise reports include subject, curriculum, generator/corpus/scoring versions, family, template, and seed. They must never include learner-entered comprehension or essay text.

Introduce a multi-course encrypted-backup payload. Legacy backups import as Mathematics. Settings expose separate actions:

- Reset current subject progress.
- Reset the complete learner and restart global onboarding.

## Delivery phases

### Phase 0 — Mathematics safety gate

- Golden replay fixtures for mathematics v2–v6.
- Legacy IndexedDB, session, mock, and backup fixtures.
- Current full release suite green.

### Phase 1 — Subject foundation

- Subject registry and mathematics adapter.
- Course-keyed persistence and migration.
- Main-page subject selector and last-subject resume policy.
- Empty German course shell and German-only start check.

### Phase 2 — German closed-question MVP

- Versioned microtext corpus and skill graph.
- First six objective families: truth status, evidence, vocabulary, morphology, one-error correction, and sentence constituents.
- Lessons, dynamic reviews, periodic assessments, XP events, and unclear-topic companion flow.

### Phase 3 — Complete objective Sprachprüfung coverage

- Implemented: connector cloze, tense/perspective transformation, and word classes.
- Implemented: accessible three-pair sentence-constituent matching in lessons, reviews, assessments, and strict simulations, including autosave, secure grading, reports, backups, and v1/v2 replay.
- Implemented: 45-minute generated simulation with persistent passage pane, free navigation, flags, timeout, backups, and targeted reviews.
- Implemented: explicit exact-option, exact-matching, finite accepted-text, exact-set multi-select, and four-group per-error sentence-analysis rules with evidence-unit telemetry, legacy-result acceptance, and a 153-row author-validation matrix.
- Implemented: replay-safe generator and exam blueprint v4 progression from foundation lessons to standard reviews and exam-band assessments/simulations; five new context questions prevent duplicate prompts in five-question single-family sessions.
- Implemented: exam blueprint v5 seven-row truth grid with the source-equivalent 2025 threshold rule, multi-point result validation, autosave, accessible interaction, reports, backups, and v1-v4 replay.
- Implemented: generator v5 and exam blueprint v6 constrained whole-sentence correction with 12 original templates, finite accepted variants, accessible input, secure automatic grading, privacy-safe results/reports, backups, and v1-v4 session plus v1-v5 exam replay.
- Implemented: generator v6 and exam blueprint v7 exact-two multi-evidence selection with 12 lesson/review templates, three passage-specific exam units, accessible checkboxes, partial autosave, exact-set grading, reports, backups, and v1-v5 session plus v1-v6 exam replay.
- Implemented: exam blueprint v8 six-row binary grid with the 2024 correct-minus-wrong/no-omission thresholds, 18 new passage-specific rows, accessible radio groups, partial autosave, sealed penalty evidence, reports, backups, and v1-v7 replay. It is labelled a digital adaptation because double marks are prevented.
- Implemented: generator v7 and exam blueprint v9 four-group sentence analysis with 12 new templates, independent accessible selectors, the 2025 two-points-minus-errors/no-negative-points conversion, partial autosave, sealed evidence, reports, backups, and generator-v1–v6 plus exam-v1–v8 replay. It is labelled a digital adaptation because the source expects handwritten grouping and questions.
- Implemented: a 57-unit passage author catalog and automated content-quality gate covering IDs, line evidence, truth-status and binary balance, vocabulary and multi-select targets, answer uniqueness, version introduction, and legacy-paper exclusion.
- Remaining: paper-equivalent invalid-mark handling after a faithful paper-response model is validated.

### Phase 4 — Rubric-assisted comprehension

- Implemented: 12 deterministic constrained short-response prompts over four original microtexts, with a 20–800-character explanation and one or two selected evidence lines.
- Implemented: one unresolved response at a time, local autosave, bounded 100-record history, encrypted-backup migration, and no interruption to ordinary German lessons while feedback is pending.
- Implemented: protected human-review queue with pending-first ordering, authored expected elements and likely evidence, three evidence-status choices, one bounded strength, one bounded next step, and learner acknowledgement.
- Implemented: replay-safe separate-tab defect reports that omit the learner response, selected evidence, reviewer feedback, and progress history.
- Implemented boundary: no points, XP, grade, mastery, automatic correctness judgement, or automatic recovery scheduling.
- Remaining: validation with a German teacher before any rubric, consequential scoring, mastery effect, or assessment integration is enabled.

### Phase 5 — Writing studio

- Implemented: 12 original prompts split across constrained narrative, anchored narrative, and newspaper-report pools; each seeded form offers one of each.
- Implemented: prompt choice, three-part planning, title and draft autosave, live word count, six-step self-review, absolute 60-minute timeout, resume/reset/backup integration, localized controls, and privacy-safe reports.
- Implemented: protected companion review with pending-first ordering, full local draft view, one bounded strength, one bounded next step, learner-visible feedback, encrypted-backup support, and no scoring side effects.
- Implemented: up to five immutable revision snapshots per completed text after human feedback, with an autosaved learner editor, original/previous-version comparison, reload resume, encrypted-backup migration, read-only companion history, and frozen originating feedback.
- Implemented boundary: no points, XP, ZAP grade, or invented automatic essay feedback.
- Remaining: a validated teacher rubric and consequential scoring policy, plus any richer teacher-reviewed revision lifecycle beyond the current read-only comparison history.

### Phase 6 — German archive and worldwide release

- Implemented: core-plus-optional archive ingestion for all twelve supplied years, with 49 exact content identities, shared local storage without cross-subject mixing, bulk import, a compact year selector, local reader, reset boundaries, and no backup/public-build inclusion.
- Implemented: persisted 45-minute language-source practice and 60-minute source writing, absolute deadlines, locked solutions, local draft autosave, encrypted state/history backup without PDFs, and bounded no-score review.
- Implemented engineering QA: iPad-width responsive source workspaces, live document switching, reload resume, and regression coverage for PDF cleanup.
- Remaining: graded replay only after rubric validation; copyright review, manual accessibility audit, physical-device sign-off, and human language/content review.

## Acceptance tests

- Legacy `current` data migrates byte-for-byte into Mathematics.
- Mathematics v2–v6 replay remains stable.
- Subject XP, mastery, reviews, help requests, sessions, and assessments never leak across subjects.
- Reload opens the paused subject first, otherwise the most recently used/completed subject.
- UI language changes do not change subject.
- Switching subjects preserves one paused session in each course.
- German questions reproduce from generator, corpus, scoring-policy version, and seed.
- Objective families pass high-volume property tests.
- Rubric-dependent answers do not affect mastery before review.
- The German passage remains available throughout a 45-minute simulation.
- Backup round-trips both subjects; legacy backup imports as Mathematics.
- Current-subject reset preserves the other subject and companion access.
- Reports reproduce both subjects, including comprehension and writing prompts, without learner answers, selected evidence, reviewer feedback, or drafts.
- Every registered German archive role, including the optional 2015 correction guidance, is recognized without disturbing mathematics files.

## Recommended first implementation slice

Build Phase 0 and Phase 1 together, then ship a private German shell containing one reading-evidence lesson and one grammar-correction lesson. That slice proves the hardest architectural requirement—two isolated, resumable subjects—before investing in the full German content corpus.
