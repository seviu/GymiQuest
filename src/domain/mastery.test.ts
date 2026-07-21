import { describe, expect, it } from "vitest"
import type { LearningEvent, QuestionResult, TopicMastery } from "./model"
import {
  blendMasteryEvidence,
  lessonEvidenceIsSecure,
  observeTopicMastery,
  recoveryEvidenceIsSecure,
} from "./mastery"

function event(
  results: QuestionResult[],
  mistakes = results.filter((result) => !result.independentlySolved).length,
): LearningEvent {
  return {
    id: "event:mastery",
    taskId: "lesson:arithmetic-equations",
    taskKind: "lesson",
    topicIds: ["arithmetic-equations"],
    completedAt: "2026-07-14T12:00:00.000Z",
    activeSeconds: 60,
    mistakes,
    hintsUsed: results.reduce((sum, result) => sum + result.hintsUsed, 0),
    independentlyCompleted: results.every((result) => result.independentlySolved),
    questionResults: results,
  }
}

function result(
  id: string,
  options: Partial<QuestionResult> = {},
): QuestionResult {
  return {
    questionId: id,
    topicId: "arithmetic-equations",
    attempts: 1,
    hintsUsed: 0,
    activeSeconds: 30,
    independentlySolved: true,
    difficultyBand: "standard",
    ...options,
  }
}

describe("mastery evidence", () => {
  it("keeps supported understanding separate from independent retrieval", () => {
    const observation = observeTopicMastery(event([
      result("supported-foundation", {
        attempts: 2,
        hintsUsed: 1,
        independentlySolved: false,
        difficultyBand: "foundation",
      }),
      result("independent-exam", { difficultyBand: "exam" }),
    ]), "arithmetic-equations")

    expect(observation).toEqual({
      supported: 0.888,
      independent: 0.6,
      questionCount: 2,
    })
  })

  it("blends new observations without erasing earlier evidence", () => {
    const mastery = { supportedMastery: 0.5, independentMastery: 0.25 }
    blendMasteryEvidence(
      mastery,
      { supported: 1, independent: 0.75, questionCount: 2 },
      0.4,
    )

    expect(mastery).toEqual({ supportedMastery: 0.7, independentMastery: 0.45 })
  })

  it("allows one supported lesson question but requires a fully independent securing round", () => {
    const mastery: Pick<TopicMastery, "supportedMastery" | "independentMastery"> = {
      supportedMastery: 0.62,
      independentMastery: 0.48,
    }
    const oneSupported = event([
      result("one", { attempts: 2, independentlySolved: false }),
      result("two"),
      result("three"),
    ], 1)
    const twoMistakes = { ...oneSupported, mistakes: 2 }

    expect(lessonEvidenceIsSecure(mastery, oneSupported)).toBe(true)
    expect(lessonEvidenceIsSecure(mastery, twoMistakes)).toBe(false)
    expect(recoveryEvidenceIsSecure(oneSupported, "arithmetic-equations")).toBe(false)
    expect(recoveryEvidenceIsSecure(event([result("one"), result("two")]), "arithmetic-equations")).toBe(true)
  })
})
