import { describe, expect, it } from "vitest"
import {
  generateGermanQuestions,
  germanAcceptedCorrectionAuthorValidationIssues,
  germanAuthorValidationMatrix,
  germanGeneratorDiagnostics,
  germanMultiSelectAuthorValidationIssues,
  germanSentenceAnalysisAuthorValidationIssues,
  isGermanAcceptedTextQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
} from "./generators"
import {
  GERMAN_GENERATOR_VERSION,
  GERMAN_MULTI_SELECT_GENERATOR_VERSION,
  germanLessonIdByTopic,
  germanPilotTopicIds,
} from "./package"
import { normalizeGermanAcceptedText } from "./scoringPolicy"

describe("German objective generators", () => {
  it("reproduces the same questions from the complete generator reference", () => {
    const task = {
      lessonId: "german-reading-evidence-v1" as const,
      topicId: "reading-evidence" as const,
      seed: "learner:reading:1",
      questionCount: 5,
    }
    expect(generateGermanQuestions(task)).toEqual(generateGermanQuestions(task))
    expect(generateGermanQuestions({ ...task, seed: "learner:reading:2" })).not.toEqual(generateGermanQuestions(task))
  })

  it("keeps every generated question objectively and independently gradable", () => {
    for (const topicId of germanPilotTopicIds) {
      for (let seed = 0; seed < 1_000; seed += 1) {
        const questions = generateGermanQuestions({
          lessonId: germanLessonIdByTopic[topicId],
          topicId,
          seed: `property:${topicId}:${seed}`,
          questionCount: 5,
        })
        expect(questions).toHaveLength(5)
        expect(new Set(questions.map((question) => question.id)).size).toBe(5)
        for (const question of questions) {
          expect(question.subjectId).toBe("german")
          expect(question.generatorId).toBe("zh-zap1-german")
          expect(question.generatorVersion).toBe(GERMAN_GENERATOR_VERSION)
          expect(question.corpusVersion).toBe(1)
          expect(question.scoringPolicyVersion).toBe(1)
          expect(question.contentLocale).toBe("de-CH")
          expect(question.difficultyBand).toBe("standard")
          if (isGermanMatchingQuestion(question)) {
            const expectedPairCount = question.matchingScoring === "sentence-analysis-deduction-2025" ? 4 : 3
            expect(question.items).toHaveLength(expectedPairCount)
            expect(question.targets).toHaveLength(expectedPairCount)
            expect(question.correctMatches).toHaveLength(expectedPairCount)
            expect(new Set(question.items.map((item) => item.id)).size).toBe(expectedPairCount)
            expect(new Set(question.targets.map((target) => target.id)).size).toBe(expectedPairCount)
            expect(new Set(question.correctMatches.map((match) => match.itemId))).toEqual(
              new Set(question.items.map((item) => item.id)),
            )
            expect(new Set(question.correctMatches.map((match) => match.targetId))).toEqual(
              new Set(question.targets.map((target) => target.id)),
            )
          } else if (isGermanAcceptedTextQuestion(question)) {
            expect(question.maximumLength).toBe(300)
            expect(question.acceptedAnswers.length).toBeGreaterThanOrEqual(1)
            expect(new Set(question.acceptedAnswers.map((answer) => answer.id)).size)
              .toBe(question.acceptedAnswers.length)
            expect(new Set(question.acceptedAnswers.map((answer) => normalizeGermanAcceptedText(answer.text))).size)
              .toBe(question.acceptedAnswers.length)
          } else if (isGermanMultiSelectQuestion(question)) {
            expect(question.options).toHaveLength(4)
            expect(question.correctOptionIds).toHaveLength(2)
            expect(question.selectionCount).toBe(2)
            expect(new Set(question.options.map((option) => option.id)).size).toBe(4)
            expect(new Set(question.correctOptionIds).size).toBe(2)
            expect(question.correctOptionIds.every((optionId) => (
              question.options.some((option) => option.id === optionId)
            ))).toBe(true)
          } else if (isGermanChoiceQuestion(question)) {
            expect(question.options.filter((option) => option.id === question.correctOptionId)).toHaveLength(1)
            expect(new Set(question.options.map((option) => option.label)).size).toBe(question.options.length)
          } else {
            throw new Error("Standalone German generators must not emit an exam-only truth grid.")
          }
          if (question.familyId === "reading-evidence") {
            expect(question.passage).toBeDefined()
            expect(question.evidenceLines).toHaveLength(1)
            expect(question.passage?.lines.some((line) => line.number === question.evidenceLines?.[0])).toBe(true)
          }
          if (question.familyId === "truth-status") {
            expect(question.passage).toBeDefined()
            expect(isGermanChoiceQuestion(question)).toBe(true)
            if (isGermanChoiceQuestion(question)) {
              expect(question.options.map((option) => option.id).sort()).toEqual(["false", "true", "undecidable"])
            }
          }
          if (question.familyId === "multi-evidence") {
            expect(question.passage).toBeDefined()
            expect(isGermanMultiSelectQuestion(question)).toBe(true)
            expect(question.evidenceLines?.length).toBeGreaterThanOrEqual(1)
          }
          if (question.familyId === "vocabulary-context") {
            expect(question.passage).toBeDefined()
            expect(question.evidenceLines).toHaveLength(1)
          }
        }
      }
    }
  })

  it("covers all ten objective families with enough original templates to avoid a single-paper product", () => {
    const generated = germanPilotTopicIds.flatMap((topicId) => (
      generateGermanQuestions({
        lessonId: germanLessonIdByTopic[topicId],
        topicId,
        seed: `coverage:${topicId}`,
        questionCount: 8,
      })
    ))
    const families = new Set(generated.map((question) => question.familyId))
    expect(families).toEqual(new Set([
      "truth-status",
      "reading-evidence",
      "multi-evidence",
      "vocabulary-context",
      "word-formation",
      "one-error-correction",
      "sentence-constituents",
      "connector-cloze",
      "tense-perspective",
      "word-class",
    ]))
    expect(generated.some(isGermanMatchingQuestion)).toBe(true)
    expect(germanGeneratorDiagnostics).toEqual({
      readingTemplateCount: 9,
      truthStatusTemplateCount: 9,
      multiSelectTemplateCount: 12,
      vocabularyTemplateCount: 15,
      wordFormationTemplateCount: 12,
      wordClassTemplateCount: 12,
      grammarTemplateCount: 12,
      acceptedCorrectionTemplateCount: 12,
      tensePerspectiveTemplateCount: 12,
      sentenceStructureTemplateCount: 12,
      connectorTemplateCount: 12,
      constituentMatchingTemplateCount: 12,
      sentenceAnalysisTemplateCount: 12,
    })
  })

  it("replays version-two sessions without introducing matching responses", () => {
    for (const topicId of germanPilotTopicIds) {
      const questions = generateGermanQuestions({
        lessonId: germanLessonIdByTopic[topicId],
        topicId,
        seed: `expanded:${topicId}`,
        questionCount: 8,
        generatorVersion: 2,
      })
      expect(questions.every((question) => question.generatorVersion === 2)).toBe(true)
      expect(questions.every((question) => !isGermanMatchingQuestion(question))).toBe(true)
    }
  })

  it("keeps version-three matching sessions on their original unfiltered template pools", () => {
    for (const topicId of germanPilotTopicIds) {
      const questions = generateGermanQuestions({
        lessonId: germanLessonIdByTopic[topicId],
        topicId,
        seed: `matching-v3:${topicId}`,
        questionCount: 12,
        generatorVersion: 3,
        difficultyBand: "exam",
      })
      expect(questions.every((question) => question.generatorVersion === 3)).toBe(true)
      expect(questions.every((question) => question.difficultyBand === "standard")).toBe(true)
    }
  })

  it("publishes an author-validation row for every authored template", () => {
    expect(germanAcceptedCorrectionAuthorValidationIssues).toEqual([])
    expect(germanMultiSelectAuthorValidationIssues).toEqual([])
    expect(germanSentenceAnalysisAuthorValidationIssues).toEqual([])
    expect(germanAuthorValidationMatrix).toHaveLength(153)
    expect(new Set(germanAuthorValidationMatrix.map((entry) => (
      `${entry.familyId}:${entry.responseKind}:${entry.templateId}`
    ))).size).toBe(153)
    expect(new Set(germanAuthorValidationMatrix.map((entry) => entry.familyId))).toEqual(new Set([
      "truth-status",
      "reading-evidence",
      "multi-evidence",
      "vocabulary-context",
      "word-formation",
      "one-error-correction",
      "sentence-constituents",
      "connector-cloze",
      "tense-perspective",
      "word-class",
    ]))
    expect(germanAuthorValidationMatrix.filter((entry) => entry.responseKind === "matching")).toHaveLength(24)
    expect(germanAuthorValidationMatrix.filter((entry) => (
      entry.scoringRuleId === "sentence-analysis-deduction-2025-v1"
    ))).toHaveLength(12)
    expect(germanAuthorValidationMatrix.filter((entry) => entry.responseKind === "accepted-text")).toHaveLength(12)
    expect(germanAuthorValidationMatrix.filter((entry) => entry.responseKind === "multi-select")).toHaveLength(12)
    expect(Object.fromEntries(["foundation", "standard", "exam"].map((difficultyBand) => [
      difficultyBand,
      germanAuthorValidationMatrix.filter((entry) => (
        entry.responseKind === "accepted-text" && entry.difficultyBand === difficultyBand
      )).length,
    ]))).toEqual({ foundation: 4, standard: 4, exam: 4 })
    expect(Object.fromEntries(["foundation", "standard", "exam"].map((difficultyBand) => [
      difficultyBand,
      germanAuthorValidationMatrix.filter((entry) => (
        entry.responseKind === "multi-select" && entry.difficultyBand === difficultyBand
      )).length,
    ]))).toEqual({ foundation: 4, standard: 4, exam: 4 })
    expect(germanAuthorValidationMatrix.every((entry) => (
      entry.scoringPolicyVersion === 1 &&
      entry.sourceStatus === "newly-authored-training-content" &&
      entry.validationStatus === "automated-objective-checks"
    ))).toBe(true)
    expect(new Set(germanAuthorValidationMatrix.map((entry) => entry.difficultyBand))).toEqual(
      new Set(["foundation", "standard", "exam"]),
    )
    for (const familyId of new Set(germanAuthorValidationMatrix.map((entry) => entry.familyId))) {
      expect(new Set(germanAuthorValidationMatrix
        .filter((entry) => entry.familyId === familyId)
        .map((entry) => entry.difficultyBand)), familyId).toEqual(
        new Set(["foundation", "standard", "exam"]),
      )
    }
    expect(Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((version) => [
      version,
      germanAuthorValidationMatrix.filter((entry) => entry.introducedInGeneratorVersion === version).length,
    ]))).toEqual({ 1: 64, 2: 36, 3: 12, 4: 5, 5: 12, 6: 12, 7: 12 })
  })

  it("selects only the requested difficulty band in the current generator", () => {
    for (const difficultyBand of ["foundation", "standard", "exam"] as const) {
      for (const topicId of germanPilotTopicIds) {
        for (let seed = 0; seed < 50; seed += 1) {
          const questions = generateGermanQuestions({
            lessonId: germanLessonIdByTopic[topicId],
            topicId,
            seed: `difficulty:${difficultyBand}:${topicId}:${seed}`,
            questionCount: 5,
            difficultyBand,
          })
          expect(questions.every((question) => question.difficultyBand === difficultyBand)).toBe(true)
          expect(new Set(questions.map((question) => question.templateId)).size).toBe(5)
        }
      }
    }
  })

  it("replays version-four sessions without introducing accepted-text responses", () => {
    for (const difficultyBand of ["foundation", "standard", "exam"] as const) {
      const questions = generateGermanQuestions({
        lessonId: germanLessonIdByTopic["grammar-correction"],
        topicId: "grammar-correction",
        seed: `difficulty-v4:${difficultyBand}`,
        questionCount: 12,
        difficultyBand,
        generatorVersion: 4,
      })
      expect(questions.every((question) => question.generatorVersion === 4)).toBe(true)
      expect(questions.every((question) => question.difficultyBand === difficultyBand)).toBe(true)
      expect(questions.some(isGermanAcceptedTextQuestion)).toBe(false)
    }
  })

  it("replays version-five sessions without introducing multi-select responses", () => {
    const questions = generateGermanQuestions({
      lessonId: germanLessonIdByTopic["reading-evidence"],
      topicId: "reading-evidence",
      seed: "accepted-text-v5:reading",
      questionCount: 12,
      generatorVersion: 5,
      difficultyBand: "exam",
    })
    expect(questions.every((question) => question.generatorVersion === 5)).toBe(true)
    expect(questions.some(isGermanMultiSelectQuestion)).toBe(false)
  })

  it("replays version-six sessions without introducing four-pair sentence analysis", () => {
    const questions = generateGermanQuestions({
      lessonId: germanLessonIdByTopic["sentence-structure"],
      topicId: "sentence-structure",
      seed: "multi-select-v6:sentence-structure",
      questionCount: 12,
      generatorVersion: GERMAN_MULTI_SELECT_GENERATOR_VERSION,
      difficultyBand: "exam",
    })
    expect(questions.every((question) => question.generatorVersion === 6)).toBe(true)
    expect(questions.filter(isGermanMatchingQuestion).every((question) => (
      question.matchingScoring === undefined && question.items.length === 3
    ))).toBe(true)
  })

  it("replays version-one sessions without introducing version-two families", () => {
    const expectedTemplates = {
      "reading-evidence": ["lost-key-relief", "rain-scenery-dry", "lost-key-noticed", "lost-key-noticed-late", "bell-problem"],
      "vocabulary-context": ["scenery", "hardly", "glittered", "arrived", "relieved"],
      "word-formation": ["read-person", "calm-opposite", "punctual-noun", "collection-verb", "dark-noun"],
      "grammar-correction": ["plural-were", "tense-borrow", "nominalised-swimming", "das-dass", "has-double-t"],
      "sentence-structure": ["object-window", "main-clause-order-after-adverbial", "subordinate-verb-last", "predicate-arrival", "place-adverbial"],
    } as const

    for (const topicId of germanPilotTopicIds) {
      const questions = generateGermanQuestions({
        lessonId: germanLessonIdByTopic[topicId],
        topicId,
        seed: `legacy:${topicId}`,
        questionCount: 5,
        generatorVersion: 1,
      })
      expect(questions.map((question) => question.templateId)).toEqual(expectedTemplates[topicId])
      expect(questions.every((question) => question.generatorVersion === 1)).toBe(true)
      expect(questions.every((question) => question.id.startsWith("german:1:"))).toBe(true)
      expect(questions.some((question) => (
        question.familyId === "connector-cloze" ||
        question.familyId === "tense-perspective" ||
        question.familyId === "word-class"
      ))).toBe(false)
    }
  })

  it("can generate a fresh review without repeating any template from the preceding round", () => {
    for (const topicId of germanPilotTopicIds) {
      const lessonId = germanLessonIdByTopic[topicId]
      const lesson = generateGermanQuestions({
        lessonId,
        topicId,
        seed: `fresh:${topicId}:lesson`,
        questionCount: 5,
        difficultyBand: "foundation",
      })
      const review = generateGermanQuestions({
        lessonId,
        topicId,
        seed: `fresh:${topicId}:review`,
        questionCount: 5,
        difficultyBand: "standard",
        excludedTemplateIds: lesson.map((question) => question.templateId),
      })
      const priorTemplates = new Set(lesson.map((question) => question.templateId))
      expect(review.every((question) => !priorTemplates.has(question.templateId)), topicId).toBe(true)
    }
  })

  it("rejects a lesson and topic mismatch instead of silently generating the wrong skill", () => {
    expect(() => generateGermanQuestions({
      lessonId: "german-word-formation-v1",
      topicId: "vocabulary-context",
      seed: "mismatch",
      questionCount: 1,
    })).toThrow(/does not teach/u)
  })
})
