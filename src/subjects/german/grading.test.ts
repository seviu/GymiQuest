import { describe, expect, it } from "vitest"
import {
  generateGermanQuestions,
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanExactMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  isGermanSentenceAnalysisQuestion,
} from "./generators"
import { buildGermanExamBlueprint } from "./exam"
import {
  gradeGermanObjectiveAnswer,
  isCompleteGermanResponse,
  isValidGermanResponse,
} from "./grading"

function matchingQuestion() {
  const question = generateGermanQuestions({
    lessonId: "german-sentence-structure-v1",
    topicId: "sentence-structure",
    seed: "matching-grade",
    questionCount: 6,
  }).find(isGermanExactMatchingQuestion)
  if (!question) throw new Error("Expected a generated matching question")
  return question
}

function sentenceAnalysisQuestion() {
  const question = generateGermanQuestions({
    lessonId: "german-sentence-structure-v1",
    topicId: "sentence-structure",
    seed: "sentence-analysis-grade",
    questionCount: 8,
  }).find(isGermanSentenceAnalysisQuestion)
  if (!question) throw new Error("Expected a generated sentence-analysis question")
  return question
}

function acceptedTextQuestion() {
  const question = generateGermanQuestions({
    lessonId: "german-grammar-correction-v1",
    topicId: "grammar-correction",
    seed: "accepted-text-grade",
    questionCount: 3,
  }).find(isGermanAcceptedTextQuestion)
  if (!question) throw new Error("Expected a generated accepted-text question")
  return question
}

function multiSelectQuestion() {
  const question = generateGermanQuestions({
    lessonId: "german-reading-evidence-v1",
    topicId: "reading-evidence",
    seed: "multi-select-grade",
    questionCount: 3,
  }).find(isGermanMultiSelectQuestion)
  if (!question) throw new Error("Expected a generated multi-select question")
  return question
}

describe("German objective grading", () => {
  it("autosaves omissions in the binary penalty grid but requires all rows for learning submission", () => {
    const question = buildGermanExamBlueprint("binary-grid-grade")
      .questions.find(isGermanBinaryGridQuestion)
    if (!question) throw new Error("Expected a binary-grid question")
    const partial = {
      responseKind: "binary-grid" as const,
      selections: question.correctSelections.slice(0, 5).map((selection) => ({ ...selection })),
    }
    const complete = {
      responseKind: "binary-grid" as const,
      selections: question.correctSelections.map((selection) => ({ ...selection })),
    }

    expect(isValidGermanResponse(question, partial)).toBe(true)
    expect(isCompleteGermanResponse(question, partial)).toBe(false)
    expect(() => gradeGermanObjectiveAnswer(question, partial)).toThrow(/Invalid binary-grid/u)
    expect(gradeGermanObjectiveAnswer(question, complete)).toMatchObject({
      responseKind: "binary-grid",
      correct: true,
      correctUnits: 6,
      incorrectUnits: 0,
      intermediateUnits: 6,
      awardedPoints: 3,
      maximumPoints: 3,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
    })
  })

  it("grades an exact two-option set and records every option decision", () => {
    const question = multiSelectQuestion()
    const correctResponse = {
      responseKind: "multi-select" as const,
      selectedOptionIds: [...question.correctOptionIds],
    }
    expect(isValidGermanResponse(question, correctResponse)).toBe(true)
    expect(isCompleteGermanResponse(question, correctResponse)).toBe(true)
    expect(gradeGermanObjectiveAnswer(question, correctResponse)).toMatchObject({
      responseKind: "multi-select",
      selectedOptionIds: [...question.correctOptionIds].sort(),
      correctOptionIds: [...question.correctOptionIds].sort(),
      correct: true,
      scoringRuleId: "exact-multi-select-v1",
      correctUnits: 4,
      totalUnits: 4,
      awardedPoints: 1,
      maximumPoints: 1,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
    })

    const wrongOptionId = question.options.find((option) => !question.correctOptionIds.includes(option.id))!.id
    const wrongResponse = {
      responseKind: "multi-select" as const,
      selectedOptionIds: [question.correctOptionIds[0]!, wrongOptionId],
    }
    expect(gradeGermanObjectiveAnswer(question, wrongResponse)).toMatchObject({
      correct: false,
      correctUnits: 2,
      awardedPoints: 0,
    })
  })

  it("autosaves one multi-select choice but requires exactly two for submission", () => {
    const question = multiSelectQuestion()
    const partial = {
      responseKind: "multi-select" as const,
      selectedOptionIds: [question.correctOptionIds[0]!],
    }
    const duplicate = {
      responseKind: "multi-select" as const,
      selectedOptionIds: [question.correctOptionIds[0]!, question.correctOptionIds[0]!],
    }
    expect(isValidGermanResponse(question, partial)).toBe(true)
    expect(isCompleteGermanResponse(question, partial)).toBe(false)
    expect(() => gradeGermanObjectiveAnswer(question, partial)).toThrow(/Invalid multi-select/u)
    expect(isValidGermanResponse(question, duplicate)).toBe(false)
  })

  it("grades only a finite accepted sentence set after Unicode and whitespace normalization", () => {
    const question = acceptedTextQuestion()
    const canonical = question.acceptedAnswers[0]!
    const response = {
      responseKind: "accepted-text" as const,
      text: `  ${canonical.text.replaceAll(" ", "   ")}\n`,
    }
    const grade = gradeGermanObjectiveAnswer(question, response)

    expect(isValidGermanResponse(question, response)).toBe(true)
    expect(isCompleteGermanResponse(question, response)).toBe(true)
    expect(grade).toMatchObject({
      responseKind: "accepted-text",
      selectedText: response.text,
      acceptedAnswerId: canonical.id,
      correct: true,
      scoringRuleId: "exact-accepted-text-v1",
      correctUnits: 1,
      totalUnits: 1,
      awardedPoints: 1,
      maximumPoints: 1,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
    })

    const wrong = { responseKind: "accepted-text" as const, text: "Ein anderer, frei formulierter Satz." }
    expect(gradeGermanObjectiveAnswer(question, wrong)).toMatchObject({
      responseKind: "accepted-text",
      correct: false,
      correctUnits: 0,
      awardedPoints: 0,
    })
    expect(gradeGermanObjectiveAnswer(question, wrong)).not.toHaveProperty("acceptedAnswerId")
  })

  it("allows an empty accepted-text draft for clearing, but not for submission", () => {
    const question = acceptedTextQuestion()
    const empty = { responseKind: "accepted-text" as const, text: "" }
    const oversized = { responseKind: "accepted-text" as const, text: "x".repeat(question.maximumLength + 1) }

    expect(isValidGermanResponse(question, empty)).toBe(true)
    expect(isCompleteGermanResponse(question, empty)).toBe(false)
    expect(() => gradeGermanObjectiveAnswer(question, empty)).toThrow(/bounded sentence/u)
    expect(isValidGermanResponse(question, oversized)).toBe(false)
  })

  it("grades a complete one-to-one matching response securely", () => {
    const question = matchingQuestion()
    const response = {
      responseKind: "matching" as const,
      matches: question.correctMatches.map((match) => ({ ...match })),
    }

    expect(isValidGermanResponse(question, response)).toBe(true)
    expect(isCompleteGermanResponse(question, response)).toBe(true)
    expect(gradeGermanObjectiveAnswer(question, response)).toMatchObject({
      responseKind: "matching",
      correct: true,
      scoringRuleId: "exact-matching-v1",
      correctUnits: 3,
      totalUnits: 3,
      awardedPoints: 1,
      maximumPoints: 1,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
    })
  })

  it("keeps partial work valid for exam autosave but not gradable as complete", () => {
    const question = matchingQuestion()
    const response = {
      responseKind: "matching" as const,
      matches: [{ ...question.correctMatches[0]! }],
    }

    expect(isValidGermanResponse(question, response)).toBe(true)
    expect(isCompleteGermanResponse(question, response)).toBe(false)
    expect(() => gradeGermanObjectiveAnswer(question, response)).toThrow(/Invalid matching response/u)
  })

  it("grades four sentence groups independently and deducts one point per error", () => {
    const question = sentenceAnalysisQuestion()
    const matches = question.correctMatches.map((match, index) => (
      index === 0 ? { ...match, targetId: question.correctMatches[1]!.targetId } : { ...match }
    ))
    const response = { responseKind: "matching" as const, matches }

    expect(isValidGermanResponse(question, response)).toBe(true)
    expect(isCompleteGermanResponse(question, response)).toBe(true)
    expect(gradeGermanObjectiveAnswer(question, response)).toMatchObject({
      responseKind: "matching",
      correct: false,
      scoringRuleId: "sentence-analysis-deduction-2025-v1",
      correctUnits: 3,
      incorrectUnits: 1,
      totalUnits: 4,
      awardedPoints: 1,
      maximumPoints: 2,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
    })
  })

  it("rejects duplicate targets instead of silently accepting an invalid assignment", () => {
    const question = matchingQuestion()
    const targetId = question.targets[0]!.id
    const response = {
      responseKind: "matching" as const,
      matches: question.items.map((item) => ({ itemId: item.id, targetId })),
    }

    expect(isValidGermanResponse(question, response)).toBe(false)
    expect(isCompleteGermanResponse(question, response)).toBe(false)
    expect(() => gradeGermanObjectiveAnswer(question, response)).toThrow(/Invalid matching response/u)
  })

  it("accepts partial truth-grid autosave but grades only a complete seven-row response", () => {
    const question = buildGermanExamBlueprint("truth-grid-grade")
      .questions.find(isGermanTruthGridQuestion)
    if (!question) throw new Error("Expected a truth-grid question")
    const partial = {
      responseKind: "truth-grid" as const,
      selections: [{ ...question.correctSelections[0]! }],
    }
    const complete = {
      responseKind: "truth-grid" as const,
      selections: question.correctSelections.map((selection) => ({ ...selection })),
    }

    expect(isValidGermanResponse(question, partial)).toBe(true)
    expect(isCompleteGermanResponse(question, partial)).toBe(false)
    expect(() => gradeGermanObjectiveAnswer(question, partial)).toThrow(/Invalid truth-grid response/u)
    expect(isCompleteGermanResponse(question, complete)).toBe(true)
    expect(gradeGermanObjectiveAnswer(question, complete)).toMatchObject({
      responseKind: "truth-grid",
      correct: true,
      correctUnits: 7,
      awardedPoints: 3,
      maximumPoints: 3,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
    })
  })
})
