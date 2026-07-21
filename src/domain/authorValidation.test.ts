import { describe, expect, it } from "vitest"
import {
  AUTHOR_VALIDATION_GENERATION_VERSION,
  authorValidationArchiveTemplates,
  authorValidationKey,
  authorValidationSelections,
  authorValidationTemplateKey,
  buildAuthorValidationSample,
  formatAuthorValidationAnswer,
  isAuthorValidationTask,
  nextUncheckedAuthorValidationSelection,
} from "./authorValidation"
import { generateQuestionsForTask, isCorrectAnswer } from "./generators"
import { difficultyBandIds, topicIds, type GeneratedQuestion } from "./model"

function canonicalInput(question: GeneratedQuestion): string {
  switch (question.response.kind) {
    case "number":
      return String(question.response.value)
    case "fraction":
      return `${question.response.numerator}/${question.response.denominator}`
    case "choice":
      return question.response.value
    case "integer-set":
      return question.response.values.join(", ")
    case "integer-sequence":
      return question.response.values.join(", ")
    case "coordinate":
      return `${question.response.x}|${question.response.y}`
  }
}

describe("author validation samples", () => {
  it("covers every topic and difficulty through the production task generator", () => {
    expect(AUTHOR_VALIDATION_GENERATION_VERSION).toBe(5)
    const selections = authorValidationSelections()
    expect(selections).toHaveLength(topicIds.length * difficultyBandIds.length)
    expect(new Set(selections.map(({ topicId, difficultyBand }) => (
      authorValidationKey(topicId, difficultyBand)
    ))).size).toBe(selections.length)
    expect(authorValidationArchiveTemplates).toHaveLength(7)
    expect(new Set(authorValidationArchiveTemplates.map(({ key }) => key)).size).toBe(7)
    expect(authorValidationArchiveTemplates.every(({ familyId, templateId, key }) => (
      authorValidationTemplateKey(familyId, templateId) === key
    ))).toBe(true)

    for (const { topicId, difficultyBand } of selections) {
      const sample = buildAuthorValidationSample(topicId, difficultyBand, 1)
      const replay = generateQuestionsForTask(sample.task)[0]!

      expect(sample.task.maxXp).toBe(0)
      expect(sample.task.questionCount).toBe(1)
      expect(sample.task.curriculum).toEqual({
        courseId: "zh-zap1-math",
        version: 1,
      })
      expect(sample.task.generation).toEqual({
        version: AUTHOR_VALIDATION_GENERATION_VERSION,
        difficultyBands: [difficultyBand],
      })
      expect(sample.question.topicId).toBe(topicId)
      expect(sample.question.generation?.difficultyBand).toBe(difficultyBand)
      expect(replay).toEqual(sample.question)
      expect(isCorrectAnswer(sample.question, canonicalInput(sample.question))).toBe(true)
      expect(formatAuthorValidationAnswer(sample.question).trim()).not.toBe("")
      expect(isAuthorValidationTask(sample.task)).toBe(true)
    }
  })

  it("uses a new deterministic seed for each requested variant", () => {
    const first = buildAuthorValidationSample("mass-units", "standard", 1)
    const second = buildAuthorValidationSample("mass-units", "standard", 2)

    expect(first.task.id).not.toBe(second.task.id)
    expect(first.task.seed).not.toBe(second.task.seed)
    expect(first.question.id).not.toBe(second.question.id)
    expect(buildAuthorValidationSample("mass-units", "standard", 2)).toEqual(second)
  })

  it("advances to the next unchecked coverage field and wraps safely", () => {
    const selections = authorValidationSelections()
    const first = selections[0]!
    const second = selections[1]!
    const checked = new Set([authorValidationKey(second.topicId, second.difficultyBand)])

    expect(nextUncheckedAuthorValidationSelection(first, checked)).toEqual(selections[2])

    const allChecked = new Set(selections.map(({ topicId, difficultyBand }) => (
      authorValidationKey(topicId, difficultyBand)
    )))
    expect(nextUncheckedAuthorValidationSelection(first, allChecked)).toEqual(first)
  })

  it("rejects invalid sample counters instead of silently changing the reproduction seed", () => {
    expect(() => buildAuthorValidationSample("mass-units", "standard", 0)).toThrow(
      "positive safe integer",
    )
  })
})
