import { describe, expect, it } from "vitest"
import {
  GERMAN_DIFFICULTY_EXAM_BLUEPRINT_VERSION,
  GERMAN_ACCEPTED_TEXT_EXAM_BLUEPRINT_VERSION,
  GERMAN_EXAM_DURATION_SECONDS,
  GERMAN_EXAM_BLUEPRINT_VERSION,
  GERMAN_EXAM_MAX_POINTS,
  GERMAN_EXAM_QUESTION_COUNT,
  GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION,
  GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION,
  GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION,
  GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION,
  answerGermanExamQuestion,
  buildGermanExamBlueprint,
  createActiveGermanExam,
  germanExamAuthorValidationCatalog,
  germanExamAuthorValidationIssues,
  germanExamExpired,
  gradeGermanExam,
  isActiveGermanExam,
  isGermanExamResult,
  navigateGermanExam,
  remainingGermanExamSeconds,
  toggleGermanExamFlag,
} from "./exam"
import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanExactMatchingQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  isGermanSentenceAnalysisQuestion,
  type GermanGeneratedQuestion,
} from "./generators"
import type { GermanObjectiveResponse } from "./grading"

function correctResponse(question: GermanGeneratedQuestion): GermanObjectiveResponse {
  if (isGermanMatchingQuestion(question)) {
    return { responseKind: "matching", matches: question.correctMatches.map((match) => ({ ...match })) }
  }
  if (isGermanTruthGridQuestion(question)) {
    return { responseKind: "truth-grid", selections: question.correctSelections.map((selection) => ({ ...selection })) }
  }
  if (isGermanBinaryGridQuestion(question)) {
    return { responseKind: "binary-grid", selections: question.correctSelections.map((selection) => ({ ...selection })) }
  }
  if (isGermanAcceptedTextQuestion(question)) {
    return { responseKind: "accepted-text", text: question.acceptedAnswers[0]!.text }
  }
  if (isGermanMultiSelectQuestion(question)) {
    return { responseKind: "multi-select", selectedOptionIds: [...question.correctOptionIds] }
  }
  return question.correctOptionId
}

describe("generated German strict exam", () => {
  it("machine-checks every authored passage unit and keeps future content out of legacy papers", () => {
    expect(germanExamAuthorValidationIssues).toEqual([])
    expect(germanExamAuthorValidationCatalog).toHaveLength(57)
    expect(new Set(germanExamAuthorValidationCatalog.map((entry) => (
      `${entry.passageId}:${entry.unitId}`
    ))).size).toBe(57)
    expect(Object.fromEntries(["truth-status", "reading-evidence", "multi-evidence", "vocabulary-context"].map((familyId) => [
      familyId,
      germanExamAuthorValidationCatalog.filter((entry) => entry.familyId === familyId).length,
    ]))).toEqual({
      "truth-status": 39,
      "reading-evidence": 9,
      "multi-evidence": 3,
      "vocabulary-context": 6,
    })
    expect(Object.fromEntries([
      GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION,
      GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION,
      GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION,
      GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION,
    ].map((version) => [
      version,
      germanExamAuthorValidationCatalog.filter((entry) => (
        entry.introducedInExamBlueprintVersion === version
      )).length,
    ]))).toEqual({ 1: 18, 5: 18, 7: 3, 8: 18 })
    expect(germanExamAuthorValidationCatalog.every((entry) => (
      entry.sourceStatus === "newly-authored-training-content" &&
      entry.validationStatus === "automated-objective-checks"
    ))).toBe(true)

    const currentFormsByPassage = new Map<string, ReturnType<typeof buildGermanExamBlueprint>>()
    for (let index = 0; index < 100 && currentFormsByPassage.size < 3; index += 1) {
      const form = buildGermanExamBlueprint(`author-catalog:${index}`)
      currentFormsByPassage.set(form.passage.id, form)
    }
    expect(currentFormsByPassage.size).toBe(3)

    for (const [passageId, currentForm] of currentFormsByPassage) {
      const catalogEntries = germanExamAuthorValidationCatalog.filter((entry) => entry.passageId === passageId)
      expect(catalogEntries).toHaveLength(19)
      expect(catalogEntries.every((entry) => entry.evidenceLines.every((lineNumber) => (
        currentForm.passage.lines.some((line) => line.number === lineNumber)
      )))).toBe(true)

      const currentPassageQuestions = currentForm.questions.slice(0, 6)
      const currentAuthorUnitIds = currentPassageQuestions.flatMap((question) => (
        isGermanTruthGridQuestion(question) || isGermanBinaryGridQuestion(question)
          ? question.rows.map((row) => row.id)
          : [question.templateId]
      ))
      expect(currentAuthorUnitIds).toHaveLength(17)
      expect(new Set(currentAuthorUnitIds).size).toBe(17)
      expect(currentAuthorUnitIds.every((unitId) => (
        catalogEntries.some((entry) => entry.unitId === unitId)
      ))).toBe(true)
      const truthGrid = currentPassageQuestions.find(isGermanTruthGridQuestion)
      expect(truthGrid).toBeDefined()
      expect(new Set(truthGrid?.correctSelections.map((selection) => selection.status))).toEqual(
        new Set(["true", "false", "undecidable"]),
      )

      const legacyForm = buildGermanExamBlueprint(
        currentForm.questions[0]!.seed.split(":truth-grid")[0]!,
        GERMAN_DIFFICULTY_EXAM_BLUEPRINT_VERSION,
      )
      expect(legacyForm.passage.id).toBe(passageId)
      const legacyUnitIds = legacyForm.questions.slice(0, 6).map((question) => question.templateId)
      const expectedLegacyUnitIds = catalogEntries
        .filter((entry) => entry.introducedInExamBlueprintVersion === GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION)
        .map((entry) => entry.unitId)
      expect(new Set(legacyUnitIds)).toEqual(new Set(expectedLegacyUnitIds))
      expect(legacyForm.questions.some(isGermanTruthGridQuestion)).toBe(false)
    }
  })

  it("builds deterministic 45-minute forms with one persistent text and broad objective coverage", () => {
    const forms = Array.from({ length: 30 }, (_, index) => buildGermanExamBlueprint(`form:${index}`))

    for (const form of forms) {
      expect(form.version).toBe(GERMAN_EXAM_BLUEPRINT_VERSION)
      expect(form.durationSeconds).toBe(45 * 60)
      expect(form.maxPoints).toBe(GERMAN_EXAM_MAX_POINTS)
      expect(form.questions).toHaveLength(GERMAN_EXAM_QUESTION_COUNT)
      expect(new Set(form.questions.map((question) => question.id)).size).toBe(GERMAN_EXAM_QUESTION_COUNT)
      expect(form.questions.slice(0, 6).every((question) => question.passage?.id === form.passage.id)).toBe(true)
      expect(new Set(form.questions.map((question) => question.topicId))).toEqual(new Set([
        "reading-evidence",
        "vocabulary-context",
        "word-formation",
        "grammar-correction",
        "sentence-structure",
      ]))
      expect(new Set(form.questions.map((question) => question.familyId))).toEqual(new Set([
        "truth-status",
        "reading-evidence",
        "multi-evidence",
        "vocabulary-context",
        "word-formation",
        "word-class",
        "one-error-correction",
        "tense-perspective",
        "sentence-constituents",
        "connector-cloze",
      ]))
      expect(form.questions.every((question) => (
        question.generatorVersion === 7 &&
        question.corpusVersion === 1 &&
        question.scoringPolicyVersion === 1 &&
        question.difficultyBand === "exam"
      ))).toBe(true)
      expect(form.questions.filter(isGermanMatchingQuestion)).toHaveLength(2)
      const sentenceAnalysis = form.questions.find(isGermanSentenceAnalysisQuestion)
      expect(sentenceAnalysis).toBeDefined()
      expect(sentenceAnalysis?.items).toHaveLength(4)
      expect(form.questions.filter(isGermanAcceptedTextQuestion)).toHaveLength(1)
      expect(form.questions.filter(isGermanMultiSelectQuestion)).toHaveLength(1)
      expect(form.questions.filter(isGermanTruthGridQuestion)).toHaveLength(1)
      expect(form.questions.filter(isGermanBinaryGridQuestion)).toHaveLength(1)
      const truthGrid = form.questions.find(isGermanTruthGridQuestion)!
      expect(truthGrid.rows).toHaveLength(7)
      expect(new Set(truthGrid.rows.map((row) => row.id)).size).toBe(7)
      expect(truthGrid.statusOptions.map((option) => option.id)).toEqual(["true", "false", "undecidable"])
      expect(new Set(truthGrid.correctSelections.map((selection) => selection.rowId))).toEqual(
        new Set(truthGrid.rows.map((row) => row.id)),
      )
      const binaryGrid = form.questions.find(isGermanBinaryGridQuestion)!
      expect(binaryGrid.rows).toHaveLength(6)
      expect(binaryGrid.statusOptions.map((option) => option.id)).toEqual(["true", "false"])
      expect(binaryGrid.correctSelections.filter((selection) => selection.status === "true")).toHaveLength(3)
      expect(binaryGrid.correctSelections.filter((selection) => selection.status === "false")).toHaveLength(3)
    }

    expect(buildGermanExamBlueprint("stable")).toEqual(buildGermanExamBlueprint("stable"))
    expect(new Set(forms.map((form) => form.passage.id)).size).toBe(3)
    expect(new Set(forms.map((form) => form.questions.map((question) => question.id).join("|"))).size).toBe(30)
  })

  it("keeps version-one through version-eight exam forms replayable as new responses ship", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("legacy-exam", start, 1)
    const blueprint = buildGermanExamBlueprint(exam.seed, 1)
    expect(blueprint.version).toBe(1)
    expect(blueprint.questions.every((question) => question.generatorVersion === 1)).toBe(true)
    expect(new Set(blueprint.questions.map((question) => question.familyId))).toEqual(new Set([
      "truth-status",
      "reading-evidence",
      "vocabulary-context",
      "word-formation",
      "one-error-correction",
      "sentence-constituents",
    ]))
    for (const question of blueprint.questions) {
      exam = answerGermanExamQuestion(exam, question.id, correctResponse(question), start)
    }
    const result = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    expect(isActiveGermanExam(exam)).toBe(true)
    expect(isGermanExamResult(result)).toBe(true)
    expect(result).toMatchObject({ blueprintVersion: 1, generatorVersion: 1, correctPoints: 15 })

    const expandedExam = createActiveGermanExam("expanded-exam", start, 2)
    const expandedBlueprint = buildGermanExamBlueprint(expandedExam.seed, 2)
    expect(expandedBlueprint.questions.every((question) => question.generatorVersion === 2)).toBe(true)
    expect(expandedBlueprint.questions.some(isGermanMatchingQuestion)).toBe(false)
    expect(isActiveGermanExam(expandedExam)).toBe(true)

    const matchingExam = createActiveGermanExam("matching-exam", start, 3)
    const matchingBlueprint = buildGermanExamBlueprint(matchingExam.seed, 3)
    expect(matchingBlueprint.questions.every((question) => (
      question.generatorVersion === 3 && question.difficultyBand === "standard"
    ))).toBe(true)
    expect(matchingBlueprint.questions.some(isGermanMatchingQuestion)).toBe(true)
    expect(isActiveGermanExam(matchingExam)).toBe(true)

    let difficultyExam = createActiveGermanExam("difficulty-exam", start, 4)
    const difficultyBlueprint = buildGermanExamBlueprint(difficultyExam.seed, 4)
    expect(difficultyBlueprint.maxPoints).toBe(15)
    expect(difficultyBlueprint.questions.every((question) => (
      question.generatorVersion === 4 && question.difficultyBand === "exam"
    ))).toBe(true)
    expect(difficultyBlueprint.questions.some(isGermanTruthGridQuestion)).toBe(false)
    expect(isActiveGermanExam(difficultyExam)).toBe(true)
    for (const question of difficultyBlueprint.questions) {
      difficultyExam = answerGermanExamQuestion(difficultyExam, question.id, correctResponse(question), start)
    }
    const difficultyResult = gradeGermanExam(
      difficultyExam,
      "submitted",
      new Date("2026-07-17T12:10:00.000Z"),
    )
    expect(difficultyResult).toMatchObject({ blueprintVersion: 4, correctPoints: 15, maxPoints: 15 })
    expect(isGermanExamResult(difficultyResult)).toBe(true)

    const truthGridExam = createActiveGermanExam("truth-grid-v5-exam", start, 5)
    const truthGridBlueprint = buildGermanExamBlueprint(truthGridExam.seed, 5)
    expect(truthGridBlueprint.maxPoints).toBe(17)
    expect(truthGridBlueprint.questions.every((question) => question.generatorVersion === 4)).toBe(true)
    expect(truthGridBlueprint.questions.filter(isGermanTruthGridQuestion)).toHaveLength(1)
    expect(truthGridBlueprint.questions.some(isGermanAcceptedTextQuestion)).toBe(false)
    expect(isActiveGermanExam(truthGridExam)).toBe(true)

    const acceptedTextExam = createActiveGermanExam(
      "accepted-text-v6-exam",
      start,
      GERMAN_ACCEPTED_TEXT_EXAM_BLUEPRINT_VERSION,
    )
    const acceptedTextBlueprint = buildGermanExamBlueprint(
      acceptedTextExam.seed,
      GERMAN_ACCEPTED_TEXT_EXAM_BLUEPRINT_VERSION,
    )
    expect(acceptedTextBlueprint.questions.every((question) => question.generatorVersion === 5)).toBe(true)
    expect(acceptedTextBlueprint.questions.filter(isGermanAcceptedTextQuestion)).toHaveLength(1)
    expect(acceptedTextBlueprint.questions.some(isGermanMultiSelectQuestion)).toBe(false)
    expect(isActiveGermanExam(acceptedTextExam)).toBe(true)

    const multiSelectExam = createActiveGermanExam(
      "multi-select-v7-exam",
      start,
      GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION,
    )
    const multiSelectBlueprint = buildGermanExamBlueprint(
      multiSelectExam.seed,
      GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION,
    )
    expect(multiSelectBlueprint.maxPoints).toBe(17)
    expect(multiSelectBlueprint.questions.every((question) => question.generatorVersion === 6)).toBe(true)
    expect(multiSelectBlueprint.questions.filter(isGermanMultiSelectQuestion)).toHaveLength(1)
    expect(multiSelectBlueprint.questions.some(isGermanBinaryGridQuestion)).toBe(false)
    expect(isActiveGermanExam(multiSelectExam)).toBe(true)

    const penaltyGridExam = createActiveGermanExam(
      "penalty-grid-v8-exam",
      start,
      GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION,
    )
    const penaltyGridBlueprint = buildGermanExamBlueprint(
      penaltyGridExam.seed,
      GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION,
    )
    expect(penaltyGridBlueprint.maxPoints).toBe(19)
    expect(penaltyGridBlueprint.questions.every((question) => question.generatorVersion === 6)).toBe(true)
    expect(penaltyGridBlueprint.questions.filter(isGermanBinaryGridQuestion)).toHaveLength(1)
    expect(penaltyGridBlueprint.questions.filter((question) => (
      isGermanMatchingQuestion(question) && question.matchingScoring !== undefined
    ))).toHaveLength(0)
    expect(isActiveGermanExam(penaltyGridExam)).toBe(true)
  })

  it("persists free navigation, flags, and answer changes without changing the generated paper", () => {
    const now = new Date("2026-07-17T12:00:00.000Z")
    const exam = createActiveGermanExam("learner-form:1", now)
    const blueprint = buildGermanExamBlueprint(exam.seed)
    const question = blueprint.questions[4]!
    if (!isGermanChoiceQuestion(question)) throw new Error("Selected passage question should be single choice")
    const selected = question.options[1]!.id

    const answered = answerGermanExamQuestion(exam, question.id, selected, new Date("2026-07-17T12:01:00.000Z"))
    const flagged = toggleGermanExamFlag(answered, question.id, new Date("2026-07-17T12:01:01.000Z"))
    const navigated = navigateGermanExam(flagged, 14, new Date("2026-07-17T12:01:02.000Z"))

    expect(navigated.answers).toEqual({ [question.id]: selected })
    expect(navigated.flaggedQuestionIds).toEqual([question.id])
    expect(navigated.currentQuestionIndex).toBe(14)
    expect(buildGermanExamBlueprint(navigated.seed)).toEqual(blueprint)
    expect(isActiveGermanExam(navigated)).toBe(true)
  })

  it("uses an absolute deadline and grades every objective question immediately", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("perfect-form", start)
    const blueprint = buildGermanExamBlueprint(exam.seed)
    for (const question of blueprint.questions) {
      exam = answerGermanExamQuestion(exam, question.id, correctResponse(question), start)
    }

    expect(remainingGermanExamSeconds(exam, start)).toBe(GERMAN_EXAM_DURATION_SECONDS)
    expect(remainingGermanExamSeconds(exam, new Date("2026-07-17T12:44:59.500Z"))).toBe(1)
    expect(germanExamExpired(exam, new Date("2026-07-17T12:45:00.000Z"))).toBe(true)

    const result = gradeGermanExam(exam, "timeout", new Date("2026-07-17T12:45:00.000Z"))
    expect(result).toMatchObject({
      submissionReason: "timeout",
      correctPoints: GERMAN_EXAM_MAX_POINTS,
      maxPoints: GERMAN_EXAM_MAX_POINTS,
      durationSeconds: GERMAN_EXAM_DURATION_SECONDS,
    })
    expect(result.questionResults.every((question) => (
      question.correct && question.points === question.maximumPoints
    ))).toBe(true)
    expect(result.questionResults.find((question) => question.responseKind === "truth-grid")).toMatchObject({
      scoringRuleId: "truth-grid-threshold-2025-v1",
      correctUnits: 7,
      totalUnits: 7,
      awardedPoints: 3,
      maximumPoints: 3,
      exact: true,
    })
    expect(result.questionResults.find((question) => question.scoringRuleId === "exact-matching-v1")).toMatchObject({
      scoringRuleId: "exact-matching-v1",
      correctUnits: 3,
      totalUnits: 3,
      awardedPoints: 1,
      maximumPoints: 1,
      exact: true,
    })
    expect(result.questionResults.find((question) => (
      question.scoringRuleId === "sentence-analysis-deduction-2025-v1"
    ))).toMatchObject({
      responseKind: "matching",
      correctUnits: 4,
      incorrectUnits: 0,
      totalUnits: 4,
      awardedPoints: 2,
      maximumPoints: 2,
      exact: true,
    })
    expect(result.questionResults.find((question) => question.responseKind === "multi-select")).toMatchObject({
      scoringRuleId: "exact-multi-select-v1",
      correctUnits: 4,
      totalUnits: 4,
      awardedPoints: 1,
      maximumPoints: 1,
      exact: true,
    })
    expect(result.questionResults.find((question) => question.responseKind === "binary-grid")).toMatchObject({
      scoringRuleId: "binary-grid-penalty-2024-v1",
      correctUnits: 6,
      incorrectUnits: 0,
      intermediateUnits: 6,
      totalUnits: 6,
      awardedPoints: 3,
      maximumPoints: 3,
      exact: true,
    })
    expect(result.topicResults.reduce((total, topic) => total + topic.total, 0)).toBe(GERMAN_EXAM_QUESTION_COUNT)
    expect(isGermanExamResult(result)).toBe(true)
  })

  it("persists partial matching work without counting it as a completed answer", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("matching-form", start)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanExactMatchingQuestion)
    expect(question).toBeDefined()
    if (!question) throw new Error("Expected a matching question")

    const partial = {
      responseKind: "matching" as const,
      matches: [question.correctMatches[0]!],
    }
    exam = answerGermanExamQuestion(exam, question.id, partial, start)
    expect(exam.answers[question.id]).toEqual(partial)
    expect(isActiveGermanExam(exam)).toBe(true)
    expect(gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
      .questionResults.find((result) => result.questionId === question.id)).toMatchObject({
        responseKind: "matching",
        correct: false,
        points: 0,
      })

    exam = answerGermanExamQuestion(exam, question.id, correctResponse(question), start)
    expect(gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
      .questionResults.find((result) => result.questionId === question.id)).toMatchObject({
        responseKind: "matching",
        correct: true,
        points: 1,
    })
  })

  it("autosaves independent sentence-analysis choices and seals the per-error deduction", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("sentence-analysis-form", start)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanSentenceAnalysisQuestion)
    if (!question) throw new Error("Expected a sentence-analysis question")
    const matches = question.correctMatches.map((match, index) => (
      index === 0 ? { ...match, targetId: question.correctMatches[1]!.targetId } : { ...match }
    ))

    exam = answerGermanExamQuestion(exam, question.id, { responseKind: "matching", matches }, start)
    expect(exam.answers[question.id]).toEqual({ responseKind: "matching", matches })
    expect(isActiveGermanExam(exam)).toBe(true)
    const result = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    expect(result.questionResults.find((entry) => entry.questionId === question.id)).toMatchObject({
      responseKind: "matching",
      scoringRuleId: "sentence-analysis-deduction-2025-v1",
      correctUnits: 3,
      incorrectUnits: 1,
      totalUnits: 4,
      awardedPoints: 1,
      maximumPoints: 2,
      correct: false,
    })
    expect(isGermanExamResult(result)).toBe(true)

    const forged = structuredClone(result)
    const forgedQuestion = forged.questionResults.find((entry) => entry.questionId === question.id)!
    forgedQuestion.incorrectUnits = 0
    expect(isGermanExamResult(forged)).toBe(false)
  })

  it("autosaves partial multi-select work and seals the exact option evidence", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("multi-select-form", start)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanMultiSelectQuestion)
    if (!question) throw new Error("Expected a multi-select question")
    const partial = {
      responseKind: "multi-select" as const,
      selectedOptionIds: [question.correctOptionIds[0]!],
    }

    exam = answerGermanExamQuestion(exam, question.id, partial, start)
    expect(exam.answers[question.id]).toEqual(partial)
    expect(isActiveGermanExam(exam)).toBe(true)
    const partialResult = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
      .questionResults.find((result) => result.questionId === question.id)
    expect(partialResult).toMatchObject({
      responseKind: "multi-select",
      selectedOptionIds: partial.selectedOptionIds,
      correctOptionIds: question.correctOptionIds,
      correct: false,
      points: 0,
    })

    exam = answerGermanExamQuestion(exam, question.id, correctResponse(question), start)
    const correctResult = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    expect(correctResult.questionResults.find((result) => result.questionId === question.id)).toMatchObject({
      responseKind: "multi-select",
      correct: true,
      points: 1,
    })
    expect(isGermanExamResult(correctResult)).toBe(true)

    const forged = structuredClone(correctResult)
    const forgedQuestion = forged.questionResults.find((result) => result.questionId === question.id)!
    forgedQuestion.correctOptionIds = [question.correctOptionIds[0]!, "invented-option"]
    expect(isGermanExamResult(forged)).toBe(false)

    const duplicatedSelection = structuredClone(correctResult)
    const duplicatedQuestion = duplicatedSelection.questionResults.find((result) => result.questionId === question.id)!
    duplicatedQuestion.selectedOptionIds = [question.correctOptionIds[0]!, question.correctOptionIds[0]!]
    expect(isGermanExamResult(duplicatedSelection)).toBe(false)
  })

  it("autosaves a partial truth grid and preserves its row-level scoring evidence", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("truth-grid-form", start)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanTruthGridQuestion)
    if (!question) throw new Error("Expected a truth-grid question")
    const partial = {
      responseKind: "truth-grid" as const,
      selections: [{ ...question.correctSelections[0]! }],
    }

    exam = answerGermanExamQuestion(exam, question.id, partial, start)
    expect(exam.answers[question.id]).toEqual(partial)
    expect(isActiveGermanExam(exam)).toBe(true)
    expect(gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
      .questionResults.find((result) => result.questionId === question.id)).toMatchObject({
        responseKind: "truth-grid",
        correctUnits: 1,
        awardedPoints: 0,
        maximumPoints: 3,
        correct: false,
      })
  })

  it("autosaves omissions in the binary grid and seals its penalty evidence", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("binary-grid-form", start)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanBinaryGridQuestion)
    if (!question) throw new Error("Expected a binary-grid question")
    const partial = {
      responseKind: "binary-grid" as const,
      selections: question.correctSelections.slice(0, 5).map((selection) => ({ ...selection })),
    }

    exam = answerGermanExamQuestion(exam, question.id, partial, start)
    expect(exam.answers[question.id]).toEqual(partial)
    expect(isActiveGermanExam(exam)).toBe(true)
    const result = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    expect(result.questionResults.find((entry) => entry.questionId === question.id)).toMatchObject({
      responseKind: "binary-grid",
      correctUnits: 5,
      incorrectUnits: 0,
      intermediateUnits: 5,
      awardedPoints: 2,
      maximumPoints: 3,
      correct: false,
    })
    expect(isGermanExamResult(result)).toBe(true)

    const forged = structuredClone(result)
    const forgedQuestion = forged.questionResults.find((entry) => entry.questionId === question.id)!
    forgedQuestion.intermediateUnits = 6
    expect(isGermanExamResult(forged)).toBe(false)
  })

  it("retains bounded submitted wording so completed mistakes can be reviewed", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let exam = createActiveGermanExam("accepted-text-form", start)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanAcceptedTextQuestion)
    if (!question) throw new Error("Expected an accepted-text question")
    const privateWrongText = "Mein eigener falscher Satz mit privatem Zusatz."

    exam = answerGermanExamQuestion(exam, question.id, {
      responseKind: "accepted-text",
      text: privateWrongText,
    }, start)
    expect(exam.answers[question.id]).toEqual({
      responseKind: "accepted-text",
      text: privateWrongText,
    })
    expect(isActiveGermanExam(exam)).toBe(true)

    const wrongResult = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    const wrongQuestionResult = wrongResult.questionResults.find((result) => result.questionId === question.id)
    expect(wrongQuestionResult).toMatchObject({
      responseKind: "accepted-text",
      selectedText: privateWrongText,
      correct: false,
      points: 0,
      scoringRuleId: "exact-accepted-text-v1",
    })
    expect(wrongQuestionResult).not.toHaveProperty("selectedAcceptedAnswerId")
    expect(JSON.stringify(wrongResult)).toContain(privateWrongText)
    expect(isGermanExamResult(wrongResult)).toBe(true)

    exam = answerGermanExamQuestion(exam, question.id, {
      responseKind: "accepted-text",
      text: question.acceptedAnswers[0]!.text,
    }, start)
    const correctResult = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    expect(correctResult.questionResults.find((result) => result.questionId === question.id)).toMatchObject({
      responseKind: "accepted-text",
      selectedText: question.acceptedAnswers[0]!.text,
      selectedAcceptedAnswerId: question.acceptedAnswers[0]!.id,
      correct: true,
      points: 1,
    })
    expect(isGermanExamResult(correctResult)).toBe(true)

    const forgedAcceptedId = structuredClone(correctResult)
    const forgedAcceptedQuestion = forgedAcceptedId.questionResults.find((result) => result.questionId === question.id)!
    forgedAcceptedQuestion.selectedAcceptedAnswerId = "invented-answer"
    expect(isGermanExamResult(forgedAcceptedId)).toBe(false)

    const missingAcceptedEvidence = structuredClone(correctResult)
    const missingEvidenceQuestion = missingAcceptedEvidence.questionResults.find((result) => result.questionId === question.id)!
    delete (missingEvidenceQuestion as unknown as Record<string, unknown>).scoringRuleId
    expect(isGermanExamResult(missingAcceptedEvidence)).toBe(false)
  })

  it("rejects damaged active and completed forms", () => {
    const exam = createActiveGermanExam("damaged", new Date("2026-07-17T12:00:00.000Z"))
    const damagedExam = structuredClone(exam)
    damagedExam.passageId = "invented-passage"
    expect(isActiveGermanExam(damagedExam)).toBe(false)
    const relabelledExam = structuredClone(exam)
    relabelledExam.id = "german-exam:1:someone-elses-form"
    expect(isActiveGermanExam(relabelledExam)).toBe(false)

    const result = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    const damagedResult = structuredClone(result)
    const damagedSelection = damagedResult.questionResults[0]!.correctSelections![0]!
    damagedSelection.status = damagedSelection.status === "true" ? "false" : "true"
    expect(isGermanExamResult(damagedResult)).toBe(false)

    const damagedScoring = structuredClone(result)
    ;(damagedScoring.questionResults[0] as { scoringRuleId: string }).scoringRuleId = "invented-rule"
    expect(isGermanExamResult(damagedScoring)).toBe(false)

    const replayableLegacyResult = gradeGermanExam(
      createActiveGermanExam("legacy-result-without-evidence", new Date("2026-07-17T12:00:00.000Z"), 4),
      "submitted",
      new Date("2026-07-17T12:10:00.000Z"),
    )
    const legacyResult = structuredClone(replayableLegacyResult) as unknown as {
      questionResults: Array<Record<string, unknown>>
    }
    for (const questionResult of legacyResult.questionResults) {
      delete questionResult.scoringRuleId
      delete questionResult.scoringPolicyVersion
      delete questionResult.correctUnits
      delete questionResult.totalUnits
      delete questionResult.awardedPoints
      delete questionResult.maximumPoints
      delete questionResult.exact
    }
    expect(isGermanExamResult(legacyResult)).toBe(true)

    const forgedScore = structuredClone(result)
    forgedScore.correctPoints = GERMAN_EXAM_MAX_POINTS
    expect(isGermanExamResult(forgedScore)).toBe(false)

    const forgedAnswer = structuredClone(result)
    forgedAnswer.questionResults[0]!.correct = true
    forgedAnswer.questionResults[0]!.points = 1
    expect(isGermanExamResult(forgedAnswer)).toBe(false)

    const forgedTopics = structuredClone(result)
    forgedTopics.topicResults[0]!.correct = forgedTopics.topicResults[0]!.total
    expect(isGermanExamResult(forgedTopics)).toBe(false)
  })
})
