import { describe, expect, it } from "vitest"
import { generateQuestionsForTask } from "./generators"
import { createSeededLearner } from "./learningEngine"
import type { LearningEvent, LearningTask, QuestionResult } from "./model"
import { buildSessionReview } from "./sessionReview"

const now = new Date("2026-07-14T12:00:00.000Z")

function task(
  topicId: LearningTask["topicIds"][number],
  questionCount: number,
  kind: LearningTask["kind"] = "review",
): LearningTask {
  return {
    id: `${kind}:${topicId}:debrief-test`,
    kind,
    title: "Rückblick testen",
    description: "Deterministische Test-Runde",
    topicIds: [topicId],
    prerequisiteIds: [],
    maxXp: kind === "lesson" ? 25 : 4,
    questionCount,
    seed: `${kind}:${topicId}:debrief-test`,
    generation: {
      version: 3,
      difficultyBands: Array.from({ length: questionCount }, () => "standard"),
    },
  }
}

function eventFor(taskValue: LearningTask, results: QuestionResult[]): LearningEvent {
  return {
    id: `event:${taskValue.id}`,
    taskId: taskValue.id,
    taskKind: taskValue.kind,
    topicIds: taskValue.topicIds,
    completedAt: now.toISOString(),
    activeSeconds: results.reduce((sum, result) => sum + result.activeSeconds, 0),
    mistakes: results.filter((result) => result.solved === false).length,
    hintsUsed: results.reduce((sum, result) => sum + result.hintsUsed, 0),
    independentlyCompleted: results.every((result) => result.independentlySolved),
    questionResults: results,
  }
}

describe("privacy-safe session review", () => {
  it("distinguishes independent, corrected, assisted, and unresolved work", () => {
    const reviewTask = task("mass-units", 4)
    const questions = generateQuestionsForTask(reviewTask)
    const results = questions.map((question, index): QuestionResult => ({
      questionId: question.id,
      topicId: question.topicId,
      attempts: index === 0 ? 1 : 2,
      hintsUsed: index === 2 ? 1 : 0,
      activeSeconds: 30 + index * 5,
      independentlySolved: index === 0,
      solved: index !== 3,
      difficultyBand: question.generation?.difficultyBand,
    }))
    const learner = createSeededLearner(now)

    const review = buildSessionReview(reviewTask, eventFor(reviewTask, results), learner)

    expect(review.items.map((item) => item.outcome)).toEqual([
      "independent",
      "corrected",
      "assisted",
      "unresolved",
    ])
    expect(review.items.map((item) => item.finalAnswerStatus)).toEqual([
      "earned",
      "earned",
      "earned",
      "missed",
    ])
    expect(review.recommendedItemIndex).toBe(3)
  })

  it("shows structured milestones and a personal timing signal without storing answers", () => {
    const lessonTask = task("reverse-chains", 1, "lesson")
    const question = generateQuestionsForTask(lessonTask)[0]!
    const steps = question.practiceSteps
    expect(steps?.length).toBeGreaterThan(2)
    const result: QuestionResult = {
      questionId: question.id,
      topicId: question.topicId,
      attempts: 2,
      hintsUsed: 0,
      activeSeconds: 100,
      independentlySolved: false,
      solved: true,
      verifiedStepIds: steps!.slice(0, 2).map((step) => step.id),
      difficultyBand: "standard",
    }
    const currentEvent = eventFor(lessonTask, [result])
    const learner = createSeededLearner(now)
    learner.learningEvents = [40, 50, 60].map((activeSeconds, index) => ({
      ...eventFor(lessonTask, [{ ...result, questionId: `historical:${index}`, activeSeconds }]),
      id: `historical-event:${index}`,
    }))

    const review = buildSessionReview(lessonTask, currentEvent, learner)
    const item = review.items[0]!

    expect(item.outcome).toBe("corrected")
    expect(item.timing).toBe("slower")
    expect(item.baselineSeconds).toBe(50)
    expect(item.milestones.slice(0, 2).every((milestone) => milestone.status === "earned")).toBe(true)
    expect(item.milestones[2]?.status).toBe("missed")
    expect(item.milestones.at(-1)).toMatchObject({ label: "Endergebnis", status: "earned" })
    expect(result).not.toHaveProperty("answer")
  })

  it("does not guess the outcome of an older ambiguous result", () => {
    const reviewTask = task("mass-units", 1)
    const question = generateQuestionsForTask(reviewTask)[0]!
    const legacyResult: QuestionResult = {
      questionId: question.id,
      topicId: question.topicId,
      attempts: 2,
      hintsUsed: 0,
      activeSeconds: 40,
      independentlySolved: false,
    }

    const review = buildSessionReview(
      reviewTask,
      eventFor(reviewTask, [legacyResult]),
      createSeededLearner(now),
    )

    expect(review.items[0]).toMatchObject({
      outcome: "not-assessable",
      finalAnswerStatus: "not-assessable",
    })
  })
})
