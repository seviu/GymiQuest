import { describe, expect, it } from "vitest"
import { archiveExpansionTopicIds } from "../domain/archiveGeneratorExpansion"
import { generateQuestion, generateQuestionsForTask, isCorrectAnswer } from "../domain/generators"
import {
  topicIds,
  type DifficultyBand,
  type GeneratedQuestion,
  type LearningTask,
  type QuestionResponse,
} from "../domain/model"

function answerSignature(response: QuestionResponse): unknown {
  switch (response.kind) {
    case "number":
      return { kind: response.kind, value: response.value, decimals: response.decimals }
    case "fraction":
      return {
        kind: response.kind,
        numerator: response.numerator,
        denominator: response.denominator,
        requireSimplified: response.requireSimplified,
      }
    case "choice":
      return { kind: response.kind, value: response.value, optionIds: response.options.map((option) => option.id) }
    case "integer-set":
    case "integer-sequence":
      return { kind: response.kind, values: response.values }
    case "coordinate":
      return { kind: response.kind, x: response.x, y: response.y }
  }
}

function mathematicalSignature(question: GeneratedQuestion): unknown {
  return {
    topicId: question.topicId,
    response: answerSignature(question.response),
    visual: question.visual ? {
      kind: question.visual.kind,
      numerator: question.visual.numerator,
      denominator: question.visual.denominator,
      fromValue: question.visual.fromValue,
      toValue: question.visual.toValue,
      columns: question.visual.columns,
      rows: question.visual.rows,
      cells: question.visual.cells,
      values: question.visual.values,
      variant: question.visual.variant,
    } : undefined,
    practiceSteps: question.practiceSteps?.map((step) => ({
      id: step.id,
      value: step.value,
      decimals: step.decimals,
      unit: step.unit,
    })),
    geometryConstruction: question.geometryConstruction,
    generation: question.generation,
  }
}

function learnerVisibleText(question: GeneratedQuestion): string {
  return [
    question.prompt,
    question.answerLabel,
    question.hint,
    question.easierExplanation,
    question.explanation,
    ...question.workedSteps,
    ...(question.response.kind === "choice"
      ? question.response.options.map((option) => option.label)
      : []),
    ...(question.visual?.labels ?? []),
    ...(question.practiceSteps?.flatMap((step) => [
      step.label,
      step.instruction,
      step.nextStep,
    ]) ?? []),
  ].join("\n")
}

const germanLearnerWords = /\b(?:wie|welche|berechne|bestimme|konstruiere|deine|der|die|das|eine|ein|sind|tage|personen|fläche|gläser|kinder|erwachsene|pensionierte|gesucht|schritt|kontrolle)\b/iu
const englishLearnerWords = /\b(?:calculate|which|determine|construct|your|the|this|that|is|are|days|people|children|adults|remaining|answer|step|check)\b/iu
const italianLearnerWords = /\b(?:calcola|quale|scegli|trova|domanda|risposta|passaggio|spiegazione|suggerimento|quindi|oppure|insieme|sono|deve)\b/iu
const malformedTemplateCopy = /time\(s\)|volta\/e|vez\/veces|\b1 hours\b|\b1 ore\b|\b1 horas\b|\bmin remains\b/iu

function canonicalAnswer(question: GeneratedQuestion): string {
  switch (question.response.kind) {
    case "number":
      return String(question.response.value)
    case "fraction":
      return `${question.response.numerator}/${question.response.denominator}`
    case "choice":
      return question.response.value
    case "integer-set":
    case "integer-sequence":
      return question.response.values.join(", ")
    case "coordinate":
      return `${question.response.x}|${question.response.y}`
  }
}

describe("localized generated questions", () => {
  it("provides English learner copy for every dynamic topic without changing the mathematics", () => {
    for (const topicId of topicIds) {
      const seed = `locale-coverage:${topicId}`
      const german = generateQuestion(topicId, seed, seed, undefined, "de")
      const english = generateQuestion(topicId, seed, seed, undefined, "en")

      expect(mathematicalSignature(english), topicId).toEqual(mathematicalSignature(german))
      expect(english.prompt, topicId).not.toBe(german.prompt)
      expect(learnerVisibleText(english), topicId).not.toMatch(germanLearnerWords)
    }
  })

  it("keeps adaptive band selection identical before translating the selected candidate", () => {
    for (const topicId of topicIds) {
      const seed = `locale-adaptive:${topicId}`
      const generation = { version: 4 as const, difficultyBand: "exam" as const }
      const german = generateQuestion(topicId, seed, seed, generation, "de")
      const english = generateQuestion(topicId, seed, seed, generation, "en")

      expect(mathematicalSignature(english), topicId).toEqual(mathematicalSignature(german))
      expect(english.generation?.difficultyScore, topicId).toBe(german.generation?.difficultyScore)
      expect(english.prompt, topicId).not.toBe(german.prompt)
    }
  })

  it("translates selected v5 archive expansions without changing provenance or grading", () => {
    const bands: readonly DifficultyBand[] = ["foundation", "standard", "exam"]

    for (const topicId of archiveExpansionTopicIds) {
      let verified = false
      for (let index = 0; index < 30 && !verified; index += 1) {
        for (const difficultyBand of bands) {
          const seed = `locale-v5-expansion:${topicId}:${index}:${difficultyBand}`
          const generation = { version: 5 as const, difficultyBand }
          const german = generateQuestion(topicId, seed, seed, generation, "de")
          if (!german.provenance) continue

          const translations = (["en", "it", "es"] as const).map((locale) =>
            generateQuestion(topicId, seed, seed, generation, locale)
          )
          for (const translated of translations) {
            expect(mathematicalSignature(translated), `${topicId}/${difficultyBand}`).toEqual(mathematicalSignature(german))
            expect(translated.provenance, `${topicId}/${difficultyBand}`).toEqual(german.provenance)
            expect(isCorrectAnswer(translated, canonicalAnswer(translated)), `${topicId}/${difficultyBand}`).toBe(true)
            expect(learnerVisibleText(translated), `${topicId}/${difficultyBand}`).not.toMatch(malformedTemplateCopy)
          }
          expect(new Set([german, ...translations].map((question) => question.prompt)).size).toBe(4)
          verified = true
          break
        }
      }
      expect(verified, topicId).toBe(true)
    }
  })

  it("provides deterministic Italian copy and identical grading across every topic and difficulty band", () => {
    const bands: readonly DifficultyBand[] = ["foundation", "standard", "exam"]
    for (const topicId of topicIds) {
      for (const difficultyBand of bands) {
        const seed = `locale-it:${topicId}:${difficultyBand}`
        const generation = { version: 4 as const, difficultyBand }
        const german = generateQuestion(topicId, seed, seed, generation, "de")
        const english = generateQuestion(topicId, seed, seed, generation, "en")
        const italian = generateQuestion(topicId, seed, seed, generation, "it")
        const replay = generateQuestion(topicId, seed, seed, generation, "it")
        const context = `${topicId}/${difficultyBand}`

        expect(replay, context).toEqual(italian)
        expect(mathematicalSignature(italian), context).toEqual(mathematicalSignature(german))
        expect(mathematicalSignature(italian), context).toEqual(mathematicalSignature(english))
        expect(italian.prompt, context).not.toBe(german.prompt)
        expect(italian.prompt, context).not.toBe(english.prompt)
        expect(learnerVisibleText(italian), context).not.toMatch(germanLearnerWords)
        expect(learnerVisibleText(italian), context).not.toMatch(englishLearnerWords)
        expect(isCorrectAnswer(italian, canonicalAnswer(italian)), context).toBe(true)
      }
    }
  })

  it("provides deterministic Spanish copy and identical grading across every topic and difficulty band", () => {
    const bands: readonly DifficultyBand[] = ["foundation", "standard", "exam"]
    for (const topicId of topicIds) {
      for (const difficultyBand of bands) {
        const seed = `locale-es:${topicId}:${difficultyBand}`
        const generation = { version: 4 as const, difficultyBand }
        const german = generateQuestion(topicId, seed, seed, generation, "de")
        const english = generateQuestion(topicId, seed, seed, generation, "en")
        const italian = generateQuestion(topicId, seed, seed, generation, "it")
        const spanish = generateQuestion(topicId, seed, seed, generation, "es")
        const replay = generateQuestion(topicId, seed, seed, generation, "es")
        const context = `${topicId}/${difficultyBand}`

        expect(replay, context).toEqual(spanish)
        expect(mathematicalSignature(spanish), context).toEqual(mathematicalSignature(german))
        expect(mathematicalSignature(spanish), context).toEqual(mathematicalSignature(english))
        expect(spanish.prompt, context).not.toBe(german.prompt)
        expect(spanish.prompt, context).not.toBe(english.prompt)
        expect(spanish.prompt, context).not.toBe(italian.prompt)
        expect(learnerVisibleText(spanish), context).not.toMatch(germanLearnerWords)
        expect(learnerVisibleText(spanish), context).not.toMatch(englishLearnerWords)
        expect(learnerVisibleText(spanish), context).not.toMatch(italianLearnerWords)
        expect(isCorrectAnswer(spanish, canonicalAnswer(spanish)), context).toBe(true)
      }
    }
  })

  it("pins English to a task so deterministic reports and resumed sessions replay the same wording", () => {
    const task: LearningTask = {
      id: "review:locale-pinning",
      kind: "review",
      title: "Language pinning",
      description: "Deterministic bilingual task",
      topicIds: ["mass-units", "time-fractions", "geometric-loci"],
      prerequisiteIds: [],
      maxXp: 6,
      questionCount: 6,
      seed: "review:locale-pinning",
      contentLocale: "en",
      generation: {
        version: 4,
        difficultyBands: ["foundation", "standard", "exam", "foundation", "standard", "exam"],
      },
    }
    const first = generateQuestionsForTask(task)
    const replay = generateQuestionsForTask(structuredClone(task))
    const german = generateQuestionsForTask({ ...task, contentLocale: "de" })

    expect(replay).toEqual(first)
    expect(new Set(first.map((question) => question.prompt)).size).toBe(first.length)
    first.forEach((question, index) => {
      expect(mathematicalSignature(question)).toEqual(mathematicalSignature(german[index]!))
      expect(question.prompt).not.toBe(german[index]!.prompt)
      expect(learnerVisibleText(question)).not.toMatch(germanLearnerWords)
    })
  })
})
