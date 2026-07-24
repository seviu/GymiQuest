# ZAP 1 German archive and recurrence matrix, 2015–2026

This audit records the structure of the supplied Zürich Langgymnasium German papers without
copying their passages, prompts, or answer keys into the public app. It is the evidence boundary
for source practice and for original GymiQuest training content.

## Verified source set

The private source catalog contains 49 PDFs:

- 12 language papers, 12 solution/correction documents, 12 text sheets, and 12 essay-prompt
  documents;
- one additional 2015 essay-correction guidance document;
- exact SHA-256 identities and observed page counts for every file.

The 2016 task PDF is named `2016_textverstaendnis_teil_a.pdf`, starts with printed page 2, and
has no cover page. Its contents nevertheless continue through `Teil B` and Aufgabe 16. The
separate solution document supplies all 16 task corrections. GymiQuest labels this source as
“Aufgabenseiten ohne Deckblatt” instead of pretending that a cover was supplied.

## Paper structure

All twelve language papers use a 45-minute limit, but their task and point totals are not
interchangeable.

| Year | Tasks | Official points | Text-sheet title |
| ---: | ---: | ---: | --- |
| 2015 | 16 | 46 | Geschichte von den beiden Träumern |
| 2016 | 16 | 48 | Das Auto |
| 2017 | 17 | 50 | Der Nachtfalter |
| 2018 | 15 | 56 | Der Räuber von Seistan |
| 2019 | 15 | 50 | Ein Beweis der Menschlichkeit |
| 2020 | 15 | 51 | Der Held |
| 2021 | 15 | 48 | Menschen, einem Missgeschick zuschauend |
| 2022 | 15 | 47 | Der Kaviar der Geizigen |
| 2023 | 15 | 51 | Elefanten im Garten |
| 2024 | 15 | 46 | Die Brücke |
| 2025 | 14 | 48 | Cougar |
| 2026 | 16 | 51 | Snickers |

The totals are taken from the task-paper cover table when present. The 2016 total is the sum of
the per-task maxima in the supplied task and correction pages.

## Recurring language-paper demands

### Stable across the archive

- Retrieve explicit facts and exact line evidence from one persistent text sheet.
- Explain causes, motives, changes, contrasts, and implied meaning in complete sentences.
- Distinguish `true`, `false`, and `not decidable from the text`; later papers also use binary
  grids with wrong-answer deductions.
- Resolve vocabulary in context through synonyms, paraphrases, semantic outliers, and word
  fields.
- Build or transform words using stems, prefixes, suffixes, word families, and word classes.
- Control verb person, number, tense, and perspective.
- Correct grammar and orthography under a tightly specified edit limit.
- Use connectors and function words to make a sentence both grammatical and meaningful.

### Rotating rather than universal

- Direct-speech punctuation and missing punctuation blocks.
- Ambiguity, pronoun reference, sentence-group analysis, and constituent questions.
- Inflection tables, plural patterns, adjective comparison, and morphological classification.
- Picture- or diagram-supported reading evidence.

These rotating formats should contribute variety, but no single generated form should claim to
reproduce every official paper.

## Scoring boundary

The official solutions use year- and task-specific conversions. Examples include:

- row thresholds rather than one point per row;
- correct-minus-wrong intermediate scores, with omissions treated differently from errors;
- partial credit for distinct ideas or evidence;
- task-specific deductions for language errors;
- finite accepted alternatives plus instructions to tolerate equivalent wording;
- correction limits where extra edits invalidate an otherwise useful answer.

Therefore:

- source practice unlocks the official solution PDF only after final submission or timeout and
  leaves comparison to the learner and an adult;
- generated objective training uses its own versioned rules and original content;
- human-reviewed short responses remain separate from automatic mastery;
- official paper points are never converted into XP or presented as an official ZAP grade.

The generated 15-question form deliberately keeps a 20-point training scale. Comparing that
number with the official 46–56 point totals would be misleading.

## Writing recurrence

Every supplied year offers three choices. The stable preparation needs are:

1. a constrained realistic narrative with explicit event, perspective, tense, or title
   requirements;
2. an anchored narrative based on a starting/ending sentence, image, object, place, or required
   situation;
3. increasingly often, a newspaper report with a non-first-person voice, chronological clarity,
   concrete consequences, and more than one viewpoint.

The generated writing studio already mirrors these three slots with newly authored prompts.
Official essay sheets and the 2015 correction guidance stay in private source practice because an
essay cannot be graded safely from a checklist alone.

## GymiQuest coverage

| Recurring demand | Current learning surface |
| --- | --- |
| Text facts, inference, and evidence | Generated exam plus human-reviewed comprehension |
| True/false/undecidable grids | Versioned threshold-scored generated grid |
| Binary grids with deductions | Source-calibrated generated adaptation |
| Vocabulary, synonyms, and outliers | Vocabulary and multi-select generators |
| Word families and word classes | Word-formation and word-class generators |
| Tense and perspective | Tense/perspective generator |
| Connectors and sentence structure | Connector, matching, and sentence-analysis generators |
| Bounded grammar correction | Single-choice and finite accepted-text correction |
| Open explanations and equivalent wording | Human review or official source comparison |
| Full official paper and correction rules | Private 2015–2026 source practice |
| Essay choices and drafting | Generated writing studio plus official source practice |

## Sources

Evidence comes only from the supplied local PDFs. The files are not copied into the repository,
the public build, or encrypted backups. Page references in implementation comments and tests use
PDF page numbers, not extracted-text offsets.
