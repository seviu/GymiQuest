import { describe, expect, it } from "vitest"
import { generateQuestion } from "./generators"
import type { LearningTask } from "./model"
import {
  arePracticeStepsComplete,
  decodePracticeStepAnswers,
  encodePracticeStepAnswers,
  gradePracticeSteps,
  normalizeVerifiedPracticeSteps,
  shouldUsePracticeSteps,
} from "./practiceSteps"

const question = generateQuestion("reverse-chains", "guided-reverse-chain")
const steps = question.practiceSteps ?? []

function task(kind: LearningTask["kind"]): LearningTask {
  return {
    id: `${kind}:reverse-chains:test`,
    kind,
    title: "Rückwärtskette",
    description: "Test",
    topicIds: ["reverse-chains"],
    prerequisiteIds: [],
    maxXp: kind === "lesson" ? 25 : 6,
    questionCount: 1,
    seed: `${kind}:reverse-chains:test`,
  }
}

describe("structured practice steps", () => {
  it("authors a complete dynamic reverse-chain path", () => {
    expect(steps.map((step) => step.id)).toEqual([
      "jars",
      "before-cooking",
      "before-sorting",
      "harvest",
    ])
    expect(steps.every((step) => Number.isFinite(step.value))).toBe(true)
    expect(steps.every((step) => step.nextStep.length > 20)).toBe(true)

    const answers = Object.fromEntries(
      steps.map((step) => [step.id, String(step.value).replace(".", ",")]),
    )
    expect(gradePracticeSteps(steps, answers)).toEqual({
      correct: true,
      statuses: Object.fromEntries(steps.map((step) => [step.id, "correct"])),
    })
  })

  it("stops at the first wrong step without revealing later results", () => {
    const answers = Object.fromEntries(
      steps.map((step) => [step.id, String(step.value)]),
    )
    answers[steps[1]!.id] = String(steps[1]!.value + 10)
    answers[steps[2]!.id] = String(steps[2]!.value + 20)

    const grade = gradePracticeSteps(steps, answers)

    expect(grade.correct).toBe(false)
    expect(grade.issue).toMatchObject({
      stepId: "before-cooking",
      stepNumber: 2,
    })
    expect(grade.statuses).toMatchObject({
      jars: "correct",
      "before-cooking": "attention",
      "before-sorting": "pending",
      harvest: "pending",
    })
    expect(grade.issue?.message).toContain("erste Schritt stimmt")
  })

  it("distinguishes missing and malformed numbers", () => {
    const missing = gradePracticeSteps(steps, {})
    expect(missing.issue?.title).toBe("Schritt 1 ist noch leer.")

    const malformed = gradePracticeSteps(steps, { jars: "12 kg" })
    expect(malformed.issue?.title).toBe("Schritt 1 braucht eine Zahl.")
    expect(malformed.issue?.message).toContain("Einheit steht bereits")
  })

  it("serializes resumable field values and preserves a legacy final answer", () => {
    const answers = { jars: "12,5", harvest: "40" }
    expect(decodePracticeStepAnswers(encodePracticeStepAnswers(answers), steps)).toEqual(answers)
    expect(decodePracticeStepAnswers("41,5", steps)).toEqual({ harvest: "41,5" })
    expect(arePracticeStepsComplete(steps, answers)).toBe(false)
    expect(normalizeVerifiedPracticeSteps(steps, ["jars", "wrong", "before-sorting"]))
      .toEqual(["jars"])
  })

  it("guides lessons and repairs but keeps reviews and assessments independent", () => {
    expect(shouldUsePracticeSteps(task("lesson"), question)).toBe(true)
    expect(shouldUsePracticeSteps(task("repair"), question)).toBe(true)
    expect(shouldUsePracticeSteps(task("review"), question)).toBe(false)
    expect(shouldUsePracticeSteps(task("assessment"), question)).toBe(false)
  })
})
