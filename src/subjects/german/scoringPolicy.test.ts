import { describe, expect, it } from "vitest"
import {
  generateGermanQuestions,
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanExactMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  isGermanSentenceAnalysisQuestion,
} from "./generators"
import { buildGermanExamBlueprint } from "./exam"
import {
  germanScoringRuleForQuestion,
  germanScoringRules,
  scoreGermanObjectiveResponse,
} from "./scoringPolicy"

describe("German scoring policy", () => {
  it("applies the source-calibrated 2024 six-row penalty thresholds", () => {
    const question = buildGermanExamBlueprint("binary-penalty-policy")
      .questions.find(isGermanBinaryGridQuestion)
    if (!question) throw new Error("Expected a binary-grid question")
    const responseWith = (wrong: number, omitted: number) => ({
      responseKind: "binary-grid" as const,
      selections: question.correctSelections
        .slice(0, question.correctSelections.length - omitted)
        .map((selection, index) => ({
          ...selection,
          status: index < wrong
            ? (selection.status === "true" ? "false" as const : "true" as const)
            : selection.status,
        })),
    })

    expect(scoreGermanObjectiveResponse(question, responseWith(0, 0))).toMatchObject({
      correctUnits: 6,
      incorrectUnits: 0,
      intermediateUnits: 6,
      awardedPoints: 3,
      exact: true,
    })
    expect(scoreGermanObjectiveResponse(question, responseWith(0, 1))).toMatchObject({
      correctUnits: 5,
      incorrectUnits: 0,
      intermediateUnits: 5,
      awardedPoints: 2,
      exact: false,
    })
    expect(scoreGermanObjectiveResponse(question, responseWith(1, 0))).toMatchObject({
      correctUnits: 5,
      incorrectUnits: 1,
      intermediateUnits: 4,
      awardedPoints: 1,
    })
    expect(scoreGermanObjectiveResponse(question, responseWith(2, 0))).toMatchObject({
      correctUnits: 4,
      incorrectUnits: 2,
      intermediateUnits: 2,
      awardedPoints: 0,
    })
    expect(germanScoringRules["binary-grid-penalty-2024-v1"]).toMatchObject({
      calibrationStatus: "source-calibrated-digital-adaptation",
      awardMode: "penalty-threshold",
    })
    expect(germanScoringRules["binary-grid-penalty-2024-v1"].sourceNote).toContain("prevents two marks")
  })

  it("keeps multi-select exact-set scoring explicit and source-informed", () => {
    const question = generateGermanQuestions({
      lessonId: "german-reading-evidence-v1",
      topicId: "reading-evidence",
      seed: "scoring-policy:multi-select",
      questionCount: 3,
    }).find(isGermanMultiSelectQuestion)
    if (!question) throw new Error("Expected a multi-select question")
    const distractorId = question.options.find((option) => !question.correctOptionIds.includes(option.id))!.id

    expect(germanScoringRuleForQuestion(question)).toMatchObject({
      id: "exact-multi-select-v1",
      responseKind: "multi-select",
      calibrationStatus: "source-informed-training-rule",
      awardMode: "all-or-nothing",
    })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "multi-select",
      selectedOptionIds: [...question.correctOptionIds],
    })).toMatchObject({ correctUnits: 4, totalUnits: 4, awardedPoints: 1, exact: true })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "multi-select",
      selectedOptionIds: [question.correctOptionIds[0]!, distractorId],
    })).toMatchObject({ correctUnits: 2, totalUnits: 4, awardedPoints: 0, exact: false })
    expect(germanScoringRules["exact-multi-select-v1"].sourceNote).toContain("selected set is exact")
  })

  it("keeps constrained text exact, finite, and distinct from open-ended grading", () => {
    const question = generateGermanQuestions({
      lessonId: "german-grammar-correction-v1",
      topicId: "grammar-correction",
      seed: "scoring-policy:accepted-text",
      questionCount: 3,
    }).find(isGermanAcceptedTextQuestion)
    if (!question) throw new Error("Expected an accepted-text question")

    expect(germanScoringRuleForQuestion(question)).toMatchObject({
      id: "exact-accepted-text-v1",
      responseKind: "accepted-text",
      calibrationStatus: "source-informed-training-rule",
      awardMode: "all-or-nothing",
    })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "accepted-text",
      text: question.acceptedAnswers[0]!.text,
    })).toMatchObject({ correctUnits: 1, awardedPoints: 1, exact: true })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "accepted-text",
      text: "Eine plausible, aber nicht freigegebene Formulierung.",
    })).toMatchObject({ correctUnits: 0, awardedPoints: 0, exact: false })
    expect(germanScoringRules["exact-accepted-text-v1"].sourceNote).toContain("finite authored answer set")
  })

  it("records unit evidence while keeping the matching training point all-or-nothing", () => {
    const question = generateGermanQuestions({
      lessonId: "german-sentence-structure-v1",
      topicId: "sentence-structure",
      seed: "scoring-policy:matching",
      questionCount: 6,
    }).find(isGermanExactMatchingQuestion)
    if (!question) throw new Error("Expected a matching question")
    const [first, second, third] = question.correctMatches
    const response = {
      responseKind: "matching" as const,
      matches: [
        { itemId: first!.itemId, targetId: second!.targetId },
        { itemId: second!.itemId, targetId: first!.targetId },
        { ...third! },
      ],
    }

    expect(scoreGermanObjectiveResponse(question, response)).toEqual({
      scoringRuleId: "exact-matching-v1",
      scoringPolicyVersion: 1,
      correctUnits: 1,
      totalUnits: 3,
      awardedPoints: 0,
      maximumPoints: 1,
      exact: false,
    })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "matching",
      matches: question.correctMatches.map((match) => ({ ...match })),
    })).toMatchObject({ correctUnits: 3, awardedPoints: 1, exact: true })
  })

  it("applies the official 2025 two-points-minus-errors rule to four-group analysis", () => {
    const question = generateGermanQuestions({
      lessonId: "german-sentence-structure-v1",
      topicId: "sentence-structure",
      seed: "scoring-policy:sentence-analysis",
      questionCount: 8,
    }).find(isGermanSentenceAnalysisQuestion)
    if (!question) throw new Error("Expected a sentence-analysis question")
    const oneWrong = question.correctMatches.map((match, index) => (
      index === 0 ? { ...match, targetId: question.correctMatches[1]!.targetId } : { ...match }
    ))
    const twoWrong = question.correctMatches.map((match, index) => (
      index < 2 ? { ...match, targetId: question.correctMatches[2]!.targetId } : { ...match }
    ))

    expect(germanScoringRuleForQuestion(question)).toMatchObject({
      id: "sentence-analysis-deduction-2025-v1",
      responseKind: "matching",
      awardMode: "per-error-deduction",
      maximumPoints: 2,
      calibrationStatus: "source-calibrated-digital-adaptation",
    })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "matching",
      matches: question.correctMatches.map((match) => ({ ...match })),
    })).toMatchObject({
      correctUnits: 4,
      incorrectUnits: 0,
      totalUnits: 4,
      awardedPoints: 2,
      maximumPoints: 2,
      exact: true,
    })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "matching",
      matches: oneWrong,
    })).toMatchObject({ correctUnits: 3, incorrectUnits: 1, awardedPoints: 1, exact: false })
    expect(scoreGermanObjectiveResponse(question, {
      responseKind: "matching",
      matches: twoWrong,
    })).toMatchObject({ correctUnits: 2, incorrectUnits: 2, awardedPoints: 0, exact: false })
    expect(germanScoringRules["sentence-analysis-deduction-2025-v1"].sourceNote)
      .toContain("handwritten source response")
  })

  it("keeps exact-option scoring explicit and source claims bounded", () => {
    const question = generateGermanQuestions({
      lessonId: "german-vocabulary-context-v1",
      topicId: "vocabulary-context",
      seed: "scoring-policy:choice",
      questionCount: 1,
    })[0]!
    if (!isGermanChoiceQuestion(question)) throw new Error("Expected a choice question")

    expect(germanScoringRuleForQuestion(question).id).toBe("exact-option-v1")
    expect(scoreGermanObjectiveResponse(question, question.correctOptionId)).toMatchObject({
      correctUnits: 1,
      totalUnits: 1,
      awardedPoints: 1,
      exact: true,
    })
    expect(germanScoringRules["exact-matching-v1"]).toMatchObject({
      calibrationStatus: "source-informed-training-rule",
      awardMode: "all-or-nothing",
    })
    expect(germanScoringRules["exact-matching-v1"].sourceNote).toContain("not equivalent")
  })

  it("applies the source-equivalent seven-row 2025 truth-grid thresholds", () => {
    const question = buildGermanExamBlueprint("threshold-policy")
      .questions.find(isGermanTruthGridQuestion)
    if (!question) throw new Error("Expected a truth-grid question")
    const responseWithMistakes = (mistakes: number) => ({
      responseKind: "truth-grid" as const,
      selections: question.correctSelections.map((selection, index) => ({
        ...selection,
        status: index < mistakes
          ? (selection.status === "true" ? "false" as const : "true" as const)
          : selection.status,
      })),
    })

    expect(scoreGermanObjectiveResponse(question, responseWithMistakes(0))).toMatchObject({
      correctUnits: 7,
      awardedPoints: 3,
      maximumPoints: 3,
      exact: true,
    })
    expect(scoreGermanObjectiveResponse(question, responseWithMistakes(1))).toMatchObject({
      correctUnits: 6,
      awardedPoints: 2,
      exact: false,
    })
    expect(scoreGermanObjectiveResponse(question, responseWithMistakes(2))).toMatchObject({
      correctUnits: 5,
      awardedPoints: 1,
    })
    expect(scoreGermanObjectiveResponse(question, responseWithMistakes(4))).toMatchObject({
      correctUnits: 3,
      awardedPoints: 0,
    })
    expect(germanScoringRules["truth-grid-threshold-2025-v1"]).toMatchObject({
      calibrationStatus: "source-equivalent-generated-rule",
      awardMode: "threshold",
    })
  })
})
