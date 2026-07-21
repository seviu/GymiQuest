# GymiQuest public release checklist

This checklist publishes the assets-only PWA without moving learner profiles, answers, XP, imported official PDFs, or encrypted backups to a backend.

## 1. Authenticate once

```bash
pnpm cloudflare:whoami
pnpm exec wrangler login
```

The second command is required only when Wrangler reports that no Cloudflare account is authenticated.

## 2. Run the complete release gate and deploy

```bash
pnpm deploy:cloudflare
```

Before uploading, this command must prove all of the following:

- the complete unit/component suite passes;
- every registered curriculum package passes its topic-order, prerequisite, lesson, bilingual coaching, policy, exact task-identity, and complete topic-by-difficulty generator audit;
- the TypeScript production build succeeds;
- the PWA manifest, iPad icons, service-worker registration, and offline precache satisfy their artifact contract;
- the visible `/datenschutz.html` product disclosure is present, protected by the production headers, and available offline;
- the public artifact contains no `.pdf`, `.gqbackup`, or source-map files and no file exceeds Cloudflare Pages limits;
- Chromium, Firefox, and iPad-sized WebKit report no automated WCAG 2.0/2.1 A or AA and WCAG 2.2 AA violations on onboarding, diagnostic, learning plan, checkpoint return trail, progress, Mathe-Expedition collection, lesson, active practice, concept library, mock setup, parent PIN entry, or the production learner surface for any of the 23 generated topic families;
- all three engines preserve keyboard activation and visible focus, honor reduced motion, keep high-contrast and minimal-focus modes accessible across reload, preserve the assignment/XP/review engine while optional game surfaces stay hidden in minimal focus, and reflow without horizontal overflow at 320 CSS pixels;
- Chromium, Firefox, and iPad-sized WebKit preserve a saved learner after their production HTTP server is stopped;
- all three engines pause a foreground practice round, hide the problem, hold active time steady, survive reload in the paused state, and restore the typed answer on resume;
- all three engines render a missed assessment topic as a labelled checkpoint return review, expose a direct start action, and keep both the trail and opened review WCAG A/AA clean;
- all three engines open the PIN-protected 69-field generator lab, produce a fresh Prüfungsnah variant and a separate privacy-bounded report without changing learner progress, and walk all 23 topic families through the real response UI with a visible focusable control and no horizontal overflow while the three difficulty bands rotate across the matrix;
- all three engines expose the protected three-week pilot evidence with its no-coaching/motivation/novelty/causality boundary and can hand off directly to the release protocol without horizontal overflow;
- all three engines restore a checksum-valid private archive document into the 11-year shelf, keep the shelf free of horizontal overflow, and remove every archive record during test-profile reset;
- all three engines complete the 2015 replay, lock its deterministic Task 9 pairing score, and finish with corrected points but no invented mathematics grade;
- all three engines complete the 2023 replay, lock its deterministic Task 4 and Task 8 scores, and finish with corrected points but no invented mathematics grade;
- all three engines complete the 2025 rubric-fidelity path, lock the fraction route, source-published numeric equation paths including Task 4's exact/one-error cost routes, one-calculation-error and unit floors, reject wrong operations and broken chains, preserve the one-error follow-through and complete three-face-family floors, and apply only the verified 2025 mathematics scale after correction;
- the encrypted-backup suite round-trips active and corrected 2015, 2023, 2024, and 2025 replay state through the runtime registry, preserves no-grade years, applies only each verified year scale, and rejects relabelled edition metadata;
- new dynamic tasks and defect reports retain the exact curriculum package, legacy unversioned tasks remain replayable as Zürich v1, and generation, resume, completion, report decoding, and backup restore reject unknown or learner-mismatched task packages;
- the encrypted-backup suite round-trips 2016–2022 source-training history and active work/review state while continuing to exclude the private PDF bytes;
- all three engines load successfully through the local Cloudflare Pages runtime with the deployed security and cache policy.

This automated gate is necessary but not sufficient: complete the physical-device and human review below, including a manual screen-reader, text-zoom, touch-target, and physical-iPad pass.

The successful command prints the production `pages.dev` URL. The first production deployment is recorded here:

```text
Production URL: https://gymiquest.pages.dev
Production branch: main
Deployment ID: 922d90e5-b5e6-47b9-a384-80896c833ffa
Deployed: 15 July 2026
```

## 3. Public smoke test

On the printed production URL:

- open the profile screen in a private browser window;
- create a throwaway learner and choose “Bei den Grundlagen starten”;
- reload and confirm the same learner and learning plan return;
- open “Sammlung öffnen”, confirm the Mathe-Expedition shows eight equipment items and eight evidence chapters, and verify the page has no horizontal overflow at 320 CSS pixels;
- confirm `/manifest.webmanifest`, `/sw.js`, and the 192/512/maskable icons return HTTP 200;
- open “Datenschutz” from the app header and verify that the local-storage, hosting-request, private-PDF, backup, and deletion descriptions still match the deployed behavior;
- confirm `/sw.js` is not served with long-lived immutable caching;
- confirm no official task or solution PDF URL exists in the deployment;
- export an encrypted backup, inspect its preview, and delete the throwaway learner locally.

Production smoke evidence from 15 July 2026:

- a throwaway learner and the generated learning plan survived a production reload;
- the deployed Datenschutz page matched the app's implemented data boundaries;
- an encrypted `.gqbackup` was downloaded, decrypted, and checked for the expected learner payload, then the learner and downloaded test backup were deleted;
- the manifest, service worker, and all three icon variants returned HTTP 200; service-worker and fingerprinted-asset cache headers matched their deployment policy;
- the public artifact verifier found no PDFs, backups, or source maps; known PDF-looking routes resolved only to the HTML app shell and exposed no PDF bytes;
- a 375 × 812 production viewport had no horizontal overflow and retained 44-point header actions.

This proves the browser-based production path. It does not replace the physical iPad gate below.

The PIN-protected Begleitansicht now contains **Freigabeprotokoll öffnen**. It mirrors the human/device/legal gates as 43 local attestations, records each checked timestamp against the exact tested source build, captures the current standalone/service-worker/network/viewport facts, and exports a Markdown protocol with reviewer and deviation fields. Use it to carry evidence between the device owner, independent corrector, and responsible operator. A local checkmark is not independent proof, never changes the product status, and is excluded from the learner backup. The protocol survives a learner-profile reset so that reset can itself be documented; only **Lokale Freigabehaken zurücksetzen** or clearing all website data removes it. A clean build records its full Git commit; a local build with source changes is visibly suffixed `-dirty` and is not acceptable as release evidence.

## 4. Physical iPad gate

- Safari → Share → Add to Home Screen;
- launch from the new home-screen icon and confirm standalone presentation;
- create or restore a throwaway learner;
- start a lesson and submit at least one answer;
- switch the throwaway learner to **Mehr Leseruhe** and **Werkzeuge links**, reload, open the Geometrische Orte concept, and confirm the reading setting persists and the tool rail sits on the left without covering the construction plan;
- while the iPad remains foregrounded, pause the lesson, wait at least one minute, and confirm the problem stays hidden and active time does not advance; force-close once while paused and confirm the same pause state, typed answer, and active time return before resuming;
- disable Wi-Fi and cellular data;
- force-close, relaunch, and confirm the learner and active lesson survive;
- finish the lesson offline and confirm XP, review scheduling, and the debrief persist after connectivity returns;
- open a generated question's defect report and confirm the installed app hands the reproducible report to a separate browser view without exposing the learner name or entered answer;
- pause one topic, confirm it appears in the PIN-protected companion queue and disappears from normal training, then explain and reopen it without changing existing XP;
- use Progress to reset the throwaway profile and confirm onboarding returns with the learner, active work, private PDFs, and parent PIN removed;
- complete onboarding for a fresh throwaway learner, set a new parent PIN, reopen the Freigabeprotokoll, and confirm its earlier build-bound checks survived the learner reset;
- use the multi-file picker to import the privately owned 2015–2025 PDFs, confirm all 22 registered sources land under the correct year, and open at least one task and solution page from an older year;
- import/open the 2015, 2023, 2024, and 2025 pairs; confirm 2024 and 2025 offer their own graded strict replay and year-specific scale, while 2015 and 2023 offer corrected points with an explicit unverified-scale/no-grade state;
- start one 2016–2022 source training, confirm its absolute 60-minute deadline survives exit/reload, solutions remain unavailable until submission/timeout, every task requires one bounded self-review label, and the completed result shows no points, grade, XP, mastery, or adaptive-review claim;
- confirm the imported PDFs remain available only on that iPad and are absent from the encrypted learner backup.
- return to the protected Freigabeprotokoll, record only the steps actually completed, download the Markdown file, and fill in reviewer, date, device/browser, deviations, and referenced evidence outside the app.

## 5. Three-week learner pilot

- use one real learner profile for at least three distinct Zürich calendar weeks; do not count onboarding or developer-generated fixture data;
- let the learner complete several lessons or reviews without navigation or solution coaching, and record that as a human observation rather than inferring it from clicks;
- open the protected Begleitansicht and confirm the pilot panel shows the expected calendar weeks, active days, completed rounds, independent-answer rate, and bounded learner signals;
- complete at least two periodic Standortbestimmungen. Compare the first and latest observed independent-answer percentages, but do not label a higher value as improvement without looking at the actual task evidence;
- observe at least one genuinely unseen paper-style problem outside the recycled training path and retain a privacy-safe result or reviewer note;
- ask whether the learner wanted to return and what remained confusing before explaining. Change the highest-impact one or two product points and repeat with a fresh problem;
- open the Freigabeprotokoll, record only observations that actually occurred, export it, and add reviewer, date, deviations, and referenced evidence outside the app.

The pilot panel derives aggregates from the existing local learning history. It adds no child free text and cannot establish absence of coaching, voluntary return, genuine novelty, or causation.

## 6. Release decision

Only call the build publicly ready after the physical iPad gate, all four independent official-replay author-validation checklists, a real three-week learner pilot, and the operator/privacy/content-rights section pass with reviewable evidence. The in-app Freigabeprotokoll helps assemble that evidence but cannot approve itself. Before a general public launch, replace the qualification on `/datenschutz.html` with the responsible operator, a contact route, and country-appropriate reviewed legal information. Leagues and public profiles remain deferred; their absence does not change review XP or the long-term reviews-plus-assessments loop.

Cloudflare Direct Upload projects cannot later be converted to Git-integrated Pages projects. If dashboard-managed Git integration is desired, create that project before the first Direct Upload. Direct Upload can still be automated from CI with an API token.
