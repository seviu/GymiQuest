# GymiQuest

GymiQuest is a web-first, installable Zürich ZAP1 trainer for Mathematics and German, built around a durable learning loop:

```text
lesson -> generated questions -> scheduled review -> periodic assessment -> targeted review
```

This repository contains a working Zürich ZAP mathematics trainer built from the complete 2025 skill inventory and a paper-by-paper recurrence audit of the 2015–2025 archive, plus a private German-subject learning engine calibrated from the supplied 2024–2025 language materials. Both subjects use original dynamic training content rather than a single copied paper.

## AI-assisted development: Codex and GPT-5.6

> **Development disclosure:** GymiQuest was developed with OpenAI Codex and GPT-5.6 as engineering tools. They assisted the development process; they are not part of the learner-facing application and are never called while a learner uses GymiQuest.

- **Codex** was used to navigate and inspect the repository, implement and refactor TypeScript/React code, update tests and documentation, run the local validation commands, and review the resulting diffs.
- **GPT-5.6** was used through Codex to reason about learning-flow state, edge cases, configurable reward rules, accessibility, localization, privacy boundaries, and test coverage. A concrete example is the assessment update: one final `Submit` action per question, immediate post-submission mistake feedback, recovery scheduling, and the centrally configurable lesson XP policy.
- AI-assisted changes were checked against the source and verified with the project's TypeScript build, Vitest suite, Playwright browser tests, PWA checks, and deployment-contract checks as appropriate. Automated checks do not replace independent mathematical, curriculum, accessibility, device, legal, or release review.
- Product requirements, educational policy, final decisions, and approval remain human responsibilities. No Codex, GPT-5.6, Gemini, or other AI API key is stored in this repository or included in the production bundle; learner data is not sent to an AI service by the app.

### Where Codex accelerated the workflow

- **Repository orientation and cross-cutting changes:** Codex traced state across `App.tsx`, the learning engine, the Mathematics and German subject packages, IndexedDB persistence, backups, and localization, so changes could be implemented consistently instead of one screen at a time.
- **High-volume implementation:** Codex helped keep generators, localized copy, fixtures, persistence contracts, and their tests synchronized across 23 Mathematics topic families and the German course.
- **Debugging and verification:** Codex helped reproduce and close edge cases around assessment submission and recovery, paused sessions, subject resets, offline reloads, German exam/writing flows, and responsive accessibility; each change was then checked with focused tests and the relevant release gates.

### Key product, engineering, and design decisions

- **Deterministic truth:** Seed-replayable generators, authored explanations, and explicit rubrics are the source of truth. AI is not called at runtime and never invents answer keys, grades, or official content.
- **Local-first privacy:** The app is an installable offline PWA with IndexedDB storage and encrypted backups, keeping learner history on the device and making practice dependable without a backend account.
- **Clear subject boundaries:** Mathematics and German have isolated course state, generators, assessments, and progress while sharing only the global profile, interface localization, and protected companion access.
- **Supportive practice, honest exams:** Adaptive practice can offer hints, repair, and recovery; strict exam modes remove hints and XP, preserve timing rules, and avoid fabricated grades or unsupported certainty.
- **Evidence over surveillance:** Parent/coach views show aggregate patterns and actionable next steps, while accessibility, human correction, curriculum validation, and physical-device checks remain explicit release gates.

## What works now

- A tablet-first learning-plan home screen with lessons, due reviews, prerequisites, course progress, and an assessment meter.
- A two-step local learner profile asks only for a nickname, exam date, realistic practice days, a 10/15/20-minute session length, preferred help style, visual mode, reading comfort, and geometry-tool side. New Zürich 2027 profiles preselect 8 March 2027 while keeping the date editable; saved profiles are never overwritten, and the suggestion disappears after that date. The profile can be edited later from Progress.
- The profile is part of the versioned learner state and encrypted backup. Older local profiles migrate to safe defaults without losing XP, mastery, reviews, mock history, source-training history, paused work, or topics waiting for an explanation.
- The persisted Focus presentation is a real minimal-focus alternative rather than only a flatter colour theme. It hides the daily quest, badges, collection, reward callouts, and expedition wording while keeping assignments, concept help, XP and assessment cadence, reviews, teacher-paused topics, and post-assessment recovery visible. Switching back to Calm reveals the same derived rewards; no evidence or XP is deleted.
- Fresh profiles begin without assumed mastery: the learner may take a nine-question, no-grade/no-XP start check or deliberately begin with the foundations. The ninth signal covers efficient arithmetic, a prerequisite for later number-constraint work. Secure placement evidence is provisional and returns as an early review; paused eight-question v1 checks remain exactly resumable. The completion handoff names the next adaptive lesson, tomorrow's provisional reviews, and the learner's selected weekly rhythm instead of ending on an unexplained score.
- A browsable 23-topic prerequisite path covering the complete 2025 inventory plus recurring archive gaps: efficient arithmetic, speed–distance–time, general data tables, complete number-constraint sets, composite area/perimeter, coordinate transformations, and algorithmically folded cube nets.
- Learners can choose any prerequisite-ready lesson, revisit a mastered topic, and see exactly what keeps a later topic locked.
- Deterministic dynamic generators: every task has fresh values, while its seed allows the exact question to be reproduced for grading and debugging. Generation v4 varies inside the requested Aufbau, Standard, or Prüfungsnah band, prevents repeated prompts inside a round, and adds full tetrahedron-orientation paths; persisted v1/v2/v3 tasks retain their original template and band behavior for exact paused-session replay. The topic-specific ranker uses structure such as multi-step rates, complements, rotations, perimeter traps, constructions, and spatial moves—not a cosmetic label or larger-number shortcut.
- Immediate grading for numbers, Swiss decimal-comma input, simplified fractions, complete unordered sets, ordered face sequences, diagram/choice responses, and semantic geometry constructions.
- Layered support: a small hint, an easier-number explanation, a three-stage concept repair, complete worked steps, and prerequisite refreshes. The learner's chosen style puts one entry first without hiding the others or changing grading.
- “The idea from the ground up” keeps the original answer untouched while the learner sees the authored concept and visual, studies a deterministic Aufbau example with different values, writes a one-sentence plan, and proves it on a fresh Standard question before returning. The full versioned detour survives reloads; already-paused legacy detours still replay their original questions.
- A standalone concept library makes all 23 ideas explorable before or outside a task. Each topic has clickable prerequisites, a learner-controlled step trace, a deterministic Aufbau example whose worked path is revealed one step at a time, and a fresh Standard teach-back check. All 23 topics now have exact, topic-specific playgrounds: reverse arithmetic chains, efficient factor-pair arithmetic, mass conversions, forward and reverse fractions, time fractions, weighted-average and catch-up motion, table complements/averages/differences, reversible price-count-revenue relationships, proportional revenue bundles, complete positive coin combinations, staged number-constraint filtering, unit-area fractions, all three composite cutout/perimeter forms, cost-optimized tiling, multi-stage reverse processes, inverse proportion, changing consumption, coordinate transformations, geometric loci, algorithmically folded cube nets, full tetrahedron orientations with editable multi-roll paths, and recovered cuboid surfaces. Looking around never unlocks a topic, changes mastery, or awards XP; the successful check can hand the learner into the real lesson, securing round, or fixed-XP refresh.
- Wrong practice answers receive concise concept-specific guidance for all 23 topic families; format errors, incomplete solution sets, unit-direction mistakes, fraction reversals, swapped coordinates, and unfinished intermediate steps are distinguished without revealing the answer.
- Completed practice now keeps a small, versioned error signal: category, child-friendly title, topic, and whether the learner solved the same question after correcting it. The Progress error compass groups the last 45 days into calm next steps and can launch a two-question refresh with fresh values; completed wrong-answer text is not retained.
- Every completed lesson, review, securing round, refresh, and assessment now includes an evidence-led round debrief. It distinguishes independent, corrected, assisted, unresolved, and ambiguous legacy work; shows structured step milestones, the canonical mathematical path, the saved diagnostic, active time, and a personal timing comparison only after three earlier topic samples. The recommended action can launch a separate fresh variant or the concept lab without changing the completed task's XP. Raw wrong entries remain discarded.
- After that debrief, the learner can optionally record one bounded clarity signal: clear, more practice, explanation unclear, question unclear, or too much at once. The signal stores no free text, can open a fresh variant or the concept lab immediately, survives encrypted backup, and appears only as an aggregate/action in the protected parent view. It never changes XP, mastery, review timing, assessment cadence, or exam points.
- During a lesson or practice question, the learner can pause the exact topic and ask for a shared explanation. The normal learning plan then excludes that topic from lessons, reviews, refreshes, resumable sessions, and periodic assessments without changing XP or mastery evidence. The protected parent/coach view keeps a dated queue; each request opens a compact guide built from the same authored lesson, diagnosis, worked steps, teach-back prompt, and prerequisite chain the learner sees. The topic can be reopened only from that guide after it has been discussed. Strict full mocks remain complete exam simulations and are not filtered by this training pause.
- Every one of those 23 coaching guides has authored English, Italian, and Spanish versions alongside the original German. The adult can switch the shared explanation among Deutsch, English, Italiano, and Español; the choice persists beside the device-local parent PIN and is excluded from learner history and backups. The learner's own language is selected separately, so a family can discuss an English, Italian, or Spanish explanation without changing an already-open deterministic question.
- Product localization has a typed, dependency-free four-language boundary. English, Italiano, Español, and Deutsch can be selected during first-run/profile setup or later in settings; the choice changes the document language immediately and persists separately on the device. All learner, curriculum, dynamic-question, wrong-answer feedback, concept-lab, mock/archive, companion, report, backup, privacy, and protected review/release surfaces are covered. Every generated topic and difficulty band keeps identical deterministic mathematics and grading across languages. Official Zürich PDFs, quoted source evidence, and the underlying Zürich curriculum scope remain explicitly in their original German; localization is not presented as adaptation to another country's curriculum.
- Mathematics and German are isolated learning subjects, independent from the interface language. The home selector resumes the last active subject; each subject keeps its own lessons, reviews, assessments, XP, paused topics, and strict exam while the global profile and companion access remain shared.
- German currently has six active strands: five objective strands with 153 authored lesson/review templates plus a separate writing studio. Objective practice progresses from foundation to exam difficulty and includes exact options, exact-two multi-evidence selection, exact three-pair matching, four-group sentence analysis with the 2025 two-points-minus-errors rule, seven-row 2025 threshold grids, a six-row 2024 digital penalty-grid adaptation, and constrained whole-sentence corrections with finite accepted variants. Its generated 45-minute, 15-task, 20-point simulation keeps one numbered passage visible, autosaves and survives reloads, awards no XP, and preserves generator-v1–v6 plus exam-v1–v8 replay. It remains private training coverage, not a claim to reproduce the complete official 46/48-point papers.
- The German writing studio deterministically offers three choices from 12 newly authored, 2024/2025-calibrated prompts. A strict 60-minute deadline continues across exits and reloads; prompt choice, three-part plan, title, draft, word count, and six-step self-review autosave locally and round-trip through encrypted backups. Completed texts receive no fabricated points, XP, or ZAP grade. In the PIN-protected companion area, an adult can read the text and save exactly one concrete strength plus one next step; that feedback is then frozen while the learner creates up to five immutable, locally autosaved revision snapshots. Original and revised versions remain available for read-only comparison in both views and encrypted backups, without affecting XP, mastery, or a grade.
- German reading practice also includes 12 deterministic short-response prompts across four original microtexts. The learner writes a bounded explanation and selects one or two evidence lines; only the PIN-protected companion view exposes the authored review guide and lets an adult record an evidence status, one strength, and one next step. The learner must acknowledge that feedback before another response opens. Responses, reviews, drafts, and history persist locally and in encrypted backups, but this lane awards no points, XP, grade, mastery, or automatic judgement.
- The private German source shelf registers the supplied 2024 and 2025 Sprachprüfung, solution, text-sheet, and essay-prompt PDFs by exact SHA-256 and page count. One multi-file picker identifies all eight documents by content, keeps the four roles separate from Mathematics, and opens them in a local responsive reader. Each year can now launch either a persisted 45-minute language-paper workspace, where the text sheet remains available and solutions unlock only after irreversible submission or timeout, or a persisted 60-minute source-essay workspace with a side-by-side prompt PDF, local title/draft autosave, live word count, and bounded self-check. These source practices deliberately create no points, XP, grade, mastery, or adaptive evidence.
- Every generated training question, short-response prompt, and writing prompt has a privacy-bounded “report this exercise” link that opens in a separate tab. It carries the deterministic task seed, generator/blueprint version, question identity, and prompt—but no learner name, typed response, selected evidence, reviewer feedback, writing title, plan, draft, checklist, or progress history—and can produce a Codex-ready Markdown reproduction report.
- The PIN-protected companion area now contains a read-only content-validation lab. It runs the same production task generator across all 23 topics and Aufbau, Standard, and Prüfungsnah difficulty, exposes the canonical answer, hint, easier explanation, complete worked path, generator structure score, and exact seed, and can open the same reproducible defect report. Any sample can also launch the real `TaskPlayer`/`QuestionStage` learner surface—with the production response control, diagram, help ladder, focus behavior, and report link—inside a zero-persistence local session. Its 69-field checkoff is deliberately scoped to the current session: it helps the parent/developer inspect fresh variants systematically but neither changes learner state nor pretends to replace independent mathematical sign-off.
- The same protected companion area now contains a public-readiness evidence protocol. Seven sections and 43 explicit checks separate the physical iPad, manual accessibility, private archive/source-training, independent 2015/2023/2024/2025 replay correction, real three-week learner-pilot, and operator/privacy/content-rights gates. It records each local timestamp together with the exact tested source build, captures the current standalone/service-worker/network/viewport facts, and exports a Markdown hand-off with blank reviewer and deviation fields. Dirty or unversioned builds are explicitly non-releaseable. The UI repeatedly states that a local checkmark is an attestation rather than proof. This record is separate from learner history and encrypted backups, survives learner-profile resets so the reset gate can itself be documented, and has its own explicit reset action.
- Constrained-number questions grade the complete unordered set: order does not matter, while missing, extra, or duplicate solutions do. This trains systematic enumeration instead of rewarding one lucky example.
- Dynamic reverse-chain lessons and repairs use a resumable four-step workbench: one intermediate result unlocks at a time, the first wrong step receives a targeted next action, and repeated corrections within that path count as one uncertain question. Scheduled reviews and assessments still require an independent final answer.
- Dynamic geometric-locus work uses a real construction plan rather than multiple choice in lessons, reviews, repairs, and assessments. Learners choose a parallel, circle, or perpendicular bisector and place it by touch, Pencil, mouse, or an accessible range control; grading checks the semantic tool and analytic placement with the exam's 2 mm plan tolerance. On wider screens the learner can keep the tool rail on the drawing-hand side, while narrow screens place it above the plan. The brief placement check remains choice-based.
- Active learning-time tracking excludes hidden time and now has a deliberate practice-only pause. Pausing hides the exercise, preserves the typed answer and exact active time across navigation, reload, and encrypted backup, and resumes from that state. Periodic assessments and strict mocks remain unpausable; mock deadlines continue while hidden or asleep.
- Local IndexedDB persistence for mastery, review scheduling, events, and the append-only XP ledger.
- Password-encrypted local backup and guarded restore for the complete learner history, XP ledger, review schedule, any paused task, supported official-replay state, Mathematics source training, and German source-practice state including a private essay draft. The validator resolves 2015, 2023, 2024, and 2025 through the same year-specific replay registry used at runtime, validates source-only edition identity separately, preserves each rubric and verified grade boundary, and rejects relabelled edition metadata. Imported source PDFs remain excluded. The password never leaves the device and is not stored by the app.
- In-progress lessons, reviews, and assessments survive navigation or reload with their page, typed answer, help/feedback state, prior results, and active timer intact.
- A paused start check is resumable with the same question, answer, and active time.
- A learner-facing progress dashboard shows the saved study plan, exam goal, seven-day active practice, independent-solving evidence, topic retention, next review dates, and recent learning rounds without turning it into surveillance.
- Testers can deliberately reset the complete learner profile from Progress and return to the first onboarding screen. The confirmation names every learner-local category removed, including active work, mocks, private PDFs, and the parent PIN, while explicitly preserving the separate public-readiness protocol.
- A PIN-protected, local parent/coach view turns that evidence into a calm weekly summary, three topic priorities, aggregate error patterns, help and timing patterns, recent mock results, and a three-session plan. Comparable generated mocks from the same blueprint version form an evidence-bounded trend: certain points are separated from points still dependent on written-method review, and overlapping ranges are never mislabeled as improvement or decline. Official year scales remain separate. The view exposes no XP, mastery, scheduling, or grading controls.
- The protected view also derives an honest three-week pilot record from data the learner profile already stores. It groups non-onboarding rounds into Zürich calendar weeks, shows active days, rounds, independent-answer rates, learner signals, and first-versus-latest no-hint assessment observations. It explicitly cannot determine whether the learner was coached, returned voluntarily, had truly never seen a paper-style task, or improved because of the app. No new child input, free text, storage record, or network request is added.
- The parent PIN is stored separately as a salted PBKDF2 verifier on the device, never as the PIN itself. It is intentionally excluded from learner backups so access must be set up again on a new device.
- An adaptive daily quest turns the current lesson/review queue into one calm, finite goal capped by the learner's chosen session length; it becomes a rest day when nothing is due and stays out of the way during a strict mock.
- Eight behavior-based achievements celebrate real evidence such as independent solving, self-correction, returning for reviews, completing assessments, and mastering topics. They are derived from learning history rather than a second reward currency.
- A Mathe-Expedition collection turns the existing ledger into eight visible equipment unlocks and the existing achievement evidence into eight story chapters. Every regularly earned lesson, review, and refresh XP counts toward the next item—including the full smaller fixed value of a difficult review. The collection adds no second currency and cannot change mastery, review timing, assessment cadence, or exam points.
- A scheduled review remains worth its full smaller XP award even when it exposes mistakes or needs help. Reviews never use the Aufbau band: fragile memories receive full Standard retrieval, while stable later reviews become Prüfungsnah. The outcome changes retention and the next due date, never the fixed review XP.
- Assessments unlock after 150 XP, preserve overflow, and turn missed topics into immediate fresh reviews. They first complete a broad coverage pass over mastered topics; later checks reserve up to three places for fragile topics and fill the rest with the least-recently assessed material. They begin with a deliberate rules screen, accept one final submission per question, immediately explain the submitted result, and end with a topic-level recovery report.
- The latest assessment recovery now remains visible as an expedition checkpoint return trail on Home. It links only to the fresh scheduled reviews the engine already created, labels those exact review cards, and can start or resume the next one directly. Completing the review closes that trail step even when it was difficult; a topic marked for shared explanation instead shows as paused and stays out of assignments until the adult reopens it. The trail is fully derived from existing events, due dates, and teacher requests, so it adds no reward state and cannot change XP, mastery, or scheduling.
- A separate generated full-mock mode builds nine recurrence-matched, Prüfungsnah tasks with two independently scored parts each: 60 minutes, 36 points, free task order, flags, no hints or XP, and an absolute deadline that continues through reload, sleep, or backgrounding. Blueprint v4 uses the full current generator set; variable-band v3, fixed-band v2, and legacy v1 papers and results remain replayable.
- The private official archive now registers all 22 task/solution PDFs from 2015–2025 by SHA-256 and page count. A single multi-file picker identifies renamed files by content, stores them in the correct year, and exposes an 11-year shelf with a responsive local page reader for tasks and solutions.
- The exact 2015, 2023, 2024, and 2025 pairs now have separate strict official replays. All four run with original pages, a 60-minute deadline, free task order, flags, autosave, and no hints or XP. The 2024 and 2025 results use only their own verified mathematics scales. The 2015 and 2023 results store corrected points but deliberately show no grade because their official year scales have not been independently verified. The source-only 2016–2022 pairs now run as persisted 60-minute paper training: solutions stay locked until submission/timeout, then every task receives only one bounded self-review label—end result matches, differs/unclear, or not attempted. Because their one-page answer sheets do not prove method or partial credit, these sessions produce no points, grade, XP, mastery change, or adaptive scheduling signal.
- Imported Mathematics and German source PDFs stay in a separate device-local IndexedDB store. They are never copied into the public app bundle or learner backup; another device must import its own source files. Resetting the current subject preserves private source documents, while resetting the complete test profile clears every imported year together with learner data and the parent PIN.
- Running mocks autosave every answer, written method, semantic construction, current task, flag, visit count, and per-task active time. Source-only archive training independently autosaves its absolute deadline, document/task page navigation, flags where relevant, active work, review phase, and bounded comparison labels. German source essays also autosave their title, draft, word count, and self-check. Pending/completed strict replays and source-training history remain in encrypted backups with exact edition identity; the private PDFs themselves never do.
- Generated mock results distinguish deterministic points from written methods awaiting review and do not claim a school grade. The 2025 official replay offers optional structured intermediate-value fields for the documented Task 1, 2, 4, 5, 6, and 9 milestones. Tasks 1a, 1b, 2b, 2c, 4b, 4c, 5, 6, and 9 also accept one numeric equation per line for the exact calculation paths published by the correction scheme. A strict grammar checks the operation sequence, propagated values, final answer, and at most one arithmetic inconsistency; prose, wrong operations, broken chains, and unencoded equivalent methods remain human-corrected. Task 4b awards its single point only for an exact verified method and result; Task 4c awards the published one-error floor while retaining the independent 15-large-tile floor. This adds the published one-calculation-error and unit floors without pretending to understand free writing. The structured fields also retain the Task 1b fraction route, the exact and one-later-error Task 6b v1.1 follow-through rules, and all named Task 9 face values. Task 9 reaches a four-point floor only with all three face families or its complete verified equation path rather than one isolated partial surface. The later rubric correction may raise these conservative floors but never erase them. The 2024 scheme does not publish equivalent machine-safe point floors, so all 36 points remain explicitly manual even when a numeric final answer can be previewed. The 2023 replay fixes only its published Task 4 truth-table rule and the exact Task 8 answer `156`. The 2015 replay fixes only Task 9, whose original correction scheme assigns 0–4 points solely from correct and false cube/net pairs; its other 32 points stay human-corrected. Human correction can neither erase a safe floor nor exceed the remaining reviewable ceiling. Only editions with an independently verified scale display a mathematics grade, always labelled as mathematics rather than the overall ZAP result.
- A production-verified offline PWA shell: the `de-CH` standalone manifest has dedicated 192 px, 512 px, maskable, and iPad home-screen icons; the service worker precaches the complete application shell. The build fails if those install assets or offline entries drift.

Leagues, public profiles, social competition, subscriptions, and a production backend are intentionally not part of this slice. XP is in the engine now so those later features can consume a stable ledger without changing learning behavior. Graded replays for 2016–2022, independent verification of 2015 and 2023 year scales, unsupported 2025 prose/trial-and-check alternatives and error paths outside the strict numeric grammar, and independent human sign-off of all four encoded official replays remain future work. The protected readiness protocol makes those human/device/legal gates actionable and exportable, but deliberately cannot satisfy them by itself. The 2016–2022 answer sheets support timed practice and bounded self-comparison, not a fabricated score; paper-only tasks stay manual unless a future structured surface can preserve the evidence required by the original scheme.

## Run locally

Requirements: Node.js 24+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

Then open `http://127.0.0.1:5173/`.

Validation:

```bash
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm build` also runs the PWA contract verifier. After a successful build, `pnpm verify:pwa` can rerun that artifact check without rebuilding.

`pnpm test:e2e` rebuilds the production app and runs Chromium, Firefox, and iPad-sized WebKit. Each engine creates and persists a learner profile, activates the service worker, shuts down its own HTTP server, reloads, and must recover the same learner and learning plan from the offline shell plus IndexedDB. Each engine also pauses a foreground practice round, proves that the hidden problem cannot be worked while active time is stopped, reloads into the same pause state, and resumes with the typed answer intact. The browser suite additionally reproduces learner and author-lab exercise reports in separate tabs, pauses a topic, verifies the evidence-bounded generated-mock trend without horizontal overflow, restores checksum-valid private archive records, completes a persisted 2022 source training plus bounded no-score review, completes the manual 2024 and corrected-without-grade 2015/2023 replay paths, checks a fresh Prüfungsnah validation variant without mutating learner data, walks all 23 dynamic topic families through the production learner response surface while rotating across the three difficulty bands, opens the shared coaching guide, reopens the topic through the protected companion queue, and proves that profile reset removes the archive before returning to onboarding.

The same three-engine gate runs automated Axe checks for WCAG 2.0/2.1 A and AA plus WCAG 2.2 AA across onboarding, the start diagnostic, learning plan, progress, lesson introduction, active practice, concept library, mock setup, parent PIN entry, and the production learner surface for every one of the 23 generated topic families. Every matrix sample must expose a visible, focusable response control and avoid horizontal overflow. The deterministic domain gate separately covers all 69 topic-by-difficulty combinations. Automation does not replace a manual screen-reader, text-zoom, touch-target, or physical-iPad review. `pnpm test:release` runs the complete unit/component suite and this cross-browser gate.

A final physical-device release check should still add the app to an iPad home screen, launch it in standalone mode, and repeat a saved lesson while Wi-Fi is disabled.

## Global reach and current scope

The PWA can be opened from anywhere, but its current educational product is intentionally specific to Zürich ZAP1 Mathematics and German, Europe/Zurich scheduling, one device-local learner profile, and no account or background sync. The two immutable course identities are `zh-zap1-math@1` and `zh-zap1-german@1`; progress, deterministic reports, and encrypted backups retain the exact subject and generator versions. Legacy unversioned Zürich profiles and tasks map permanently to Mathematics v1, while unknown or mismatched course data is rejected before generation, resume, completion, report decoding, or restore. Supporting another country requires a separately validated curriculum/content package, terminology, exam rules, and release evidence; translating labels alone does not create a new curriculum.

## Publish on Cloudflare Pages

The public release path is an assets-only Cloudflare Pages deployment. The build output contains no official exam PDFs, learner backups, source maps, account system, or server-side learner data. A visible, offline-capable `/datenschutz.html` page explains the implemented local-storage, hosting-request, backup, private-PDF, and deletion boundaries; its public-launch qualification remains until operator/contact and country-appropriate reviewed legal information are supplied. Every build checks these technical boundaries before deployment.

```bash
pnpm cloudflare:whoami
pnpm exec wrangler login       # once, if the previous command says unauthenticated
pnpm deploy:cloudflare
```

`pnpm deploy:cloudflare` runs the full unit, build, PWA, deployment-contract, Chromium, Firefox, and WebKit gates before it uploads `dist/`. The first deployment uses the `gymiquest` Pages project and the `main` production branch. `pnpm cloudflare:dev` serves the same output through the local Cloudflare runtime, including `_headers` behavior.

The current production technical preview is [https://gymiquest.pages.dev](https://gymiquest.pages.dev), deployed from `main` on 15 July 2026. Its automated release gate and browser-based production smoke test pass. Broad public-launch sign-off still requires the physical iPad gate, independent 2015, 2023, 2024, and 2025 author validation, and completed operator/contact/legal information described in the [public release checklist](./docs/public-release-checklist.md).

This is Cloudflare's Direct Upload workflow. Cloudflare documents that a Direct Upload project cannot later be converted into a Git-integrated Pages project; automated delivery can still use Direct Upload from CI. If dashboard-managed Git integration is preferred, create that Pages project before the first upload. See the [public release checklist](./docs/public-release-checklist.md).

## XP and mastery are separate

- Mastery and retention choose what the learner sees.
- Lesson XP follows the versioned curriculum policy: flawless work earns the full task value plus 30%, one miss earns the full value, two misses earn 70%, three misses earn 40%, and more than three earn `0`. Fractional XP is rounded to the nearest whole XP. An assisted question counts as a miss for the lesson bonus.
- Reviews award their full smaller task value when completed. They are difficult maintenance work, not easy tasks: there is no anti-farming cap, mistake deduction, or help deduction.
- Error-compass refreshes use the same smaller fixed task value. Error evidence can change retention and timing, never the earned fixed review/refresh XP.
- Daily quests, achievements, and the Mathe-Expedition collection never create XP, change mastery, or alter review scheduling; they only make existing learning progress visible.
- XP opens the next assessment; it never determines a ZAP grade.
- Assessment evidence controls which reviews come next.

Once all topics are mastered, the engine stops assigning lessons and explicitly enters a continuing consolidation phase. Home, the curriculum path, and Progress explain that the long-term course is scheduled reviews plus coverage-aware periodic assessments; an empty day is a rest day, not the end of the course.

## Structure

```text
src/domain/content.ts          prerequisite graph and authored lessons
src/domain/curriculumPackage.ts versioned package registry, scope, topic coverage, assessment, and XP policy
src/domain/curriculumPackageValidation.ts package content, coaching, policy, and generator completeness gate
src/domain/difficulty.ts       versioned bands, task paths, and structural candidate scoring
src/domain/generators.ts       deterministic exercise generators and grading
src/domain/zap2025Generators.ts dynamic families calibrated from the 2025 paper
src/domain/archiveGenerators.ts recurring dynamic families identified across 2015–2025
src/domain/officialArchiveCatalog.ts private 2015–2025 PDF identities, page counts, and replay capability
src/domain/cubeNet.ts           enumeration and 3D folding of all eleven cube nets
src/domain/mockExam.ts          shared generated/official strict-exam session and replay rules
src/domain/officialExam.ts shared official replay, persistence, response, and correction contracts
src/domain/officialExams.ts year-specific official replay registry and grading dispatch
src/domain/officialExam2015.ts exact 2015 pages, deterministic cube-pair score, and no-grade correction workflow
src/domain/officialExam2023.ts exact 2023 pages, two deterministic score boundaries, and no-grade correction workflow
src/domain/officialExam2024.ts exact 2024 page manifest and manual-only correction workflow
src/domain/officialExam2025.ts exact 2025 page manifest, response schema, rubric, and conservative point floors
src/domain/officialCalculationEvidence.ts strict numeric-equation grammar for source-published calculation paths
src/domain/officialGradeScale.ts independently versioned 2024 and 2025 mathematics point-to-grade scales
src/domain/answerDiagnosis.ts  wrong-answer misconception and next-step guidance
src/domain/errorPatterns.ts    durable error evidence, 45-day compass, and recovery copy
src/domain/conceptRepair.ts    deterministic worked-example and teach-back question pair
src/domain/conceptLab.ts       deterministic standalone concept-library rounds
src/domain/practiceSteps.ts    sequential intermediate-step grading and resumable encoding
src/domain/geometryConstruction.ts semantic construction encoding, snapping, and tolerance grading
src/domain/learningEngine.ts   assignment, XP, mastery, review, and assessment rules
src/domain/exerciseReport.ts   privacy-bounded deterministic defect references and Codex reports
src/domain/subjectRegistry.ts  isolated Mathematics/German runtime and course identities
src/domain/authorValidation.ts zero-XP production-generator samples and 69-field validation coverage
src/domain/releaseReadiness.ts human/device/legal gate definitions and privacy-bounded Markdown evidence
src/domain/learnerFeedback.ts  bounded learner voice, immediate next actions, and pilot evidence
src/domain/studyPlan.ts        profile validation, preference migration, countdown, and readiness band
src/domain/engagement.ts       derived daily quest, achievements, and XP-backed expedition collection
src/domain/parentDashboard.ts  aggregate coaching signals and three-session plan
src/domain/parentCoaching.ts   authored German/English coaching guides for all topics
src/domain/parentAccess.ts     device-local parent PIN and coaching-language preference
src/domain/progressAnalytics.ts weekly practice and independent-evidence summaries
src/domain/pilotEvidence.ts timezone-safe multi-week pilot evidence and assessment observations
src/domain/session.ts          resumable in-progress learning-session state
src/domain/sessionReview.ts    privacy-safe completed-round evidence and timing comparison
src/domain/archivePractice.ts  strict source-only timer, bounded self-review, and no-score result contract
src/infra/learnerRepository.ts IndexedDB learner, active-session, private archive, and release-evidence persistence
src/infra/officialArchive.ts   local PDF validation and official-document identity
src/infra/backup.ts            versioned PBKDF2/AES-GCM backup envelope and validation
src/subjects/german/           German package, dynamic generators, grading, course state, exam, and learner UI
src/features/DataBackupPanel.tsx learner-facing export, preview, and restore flow
src/features/ExerciseReportView.tsx separate-tab tester report and export flow
src/features/PdfPageCanvas.tsx local, responsive official-page rendering
src/features/OfficialArchiveShelf.tsx private year shelf, bulk import, and source reader
src/features/ArchiveSourcePractice.tsx timed source workspace, locked solutions, and result boundary
src/App.tsx                    end-to-end learner UI flow
src/styles.css                 responsive product UI
scripts/verify-pwa.mjs         install/offline artifact contract
scripts/verify-deployment.mjs  public artifact, privacy, and host-limit contract
e2e/                           Chromium, Firefox, WebKit, offline, and Cloudflare runtime gates
docs/2025-curriculum-inventory.md audited task, rubric, skill, and generator map
docs/2025-author-validation-checklist.md independent teacher/corrector release gate
docs/2024-author-validation-checklist.md independent 2024 transcription and correction release gate
docs/2015-2025-recurrence-matrix.md archive registry, recurrence evidence, and gap priorities
docs/public-release-checklist.md authentication, deployment, smoke test, and iPad release gate
```

The broader product and curriculum plan is in [`GYMI_MATH_APP_PLAN.md`](./GYMI_MATH_APP_PLAN.md).
