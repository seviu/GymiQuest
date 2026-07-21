import { describe, expect, it } from "vitest"
import {
  archivePracticeStatusCounts,
  completeArchivePractice,
  createActiveArchivePractice,
  isActiveArchivePractice,
  isArchivePracticeResult,
  remainingArchivePracticeSeconds,
  submitArchivePracticeForReview,
} from "./archivePractice"
import { createSeededLearner, recordArchivePracticeResult } from "./learningEngine"

const startedAt = new Date("2026-07-15T10:00:00.000Z")

describe("source-only archive practice", () => {
  it.each([2016, 2017, 2018, 2019, 2020, 2021, 2022] as const)(
    "creates a strict, replayable %i session without score fields",
    (year) => {
      const practice = createActiveArchivePractice(`zap-zh-lg-${year}`, `learner:${year}:1`, startedAt)

      expect(practice).toMatchObject({
        kind: "archive-source-practice",
        year,
        phase: "working",
        durationSeconds: 3_600,
        currentDocumentKind: "tasks",
      })
      expect(practice.progress).toHaveLength(9)
      expect(remainingArchivePracticeSeconds(practice, startedAt)).toBe(3_600)
      expect(isActiveArchivePractice(practice)).toBe(true)
      expect(practice).not.toHaveProperty("points")
      expect(practice).not.toHaveProperty("grade")
      expect(practice).not.toHaveProperty("xp")
    },
  )

  it("rejects editions that have a defensible correction replay", () => {
    expect(() => createActiveArchivePractice("zap-zh-lg-2025", "wrong-mode", startedAt)).toThrow(
      "only available for source-only editions",
    )
  })

  it("keeps the absolute deadline across time away from the app", () => {
    const practice = createActiveArchivePractice("zap-zh-lg-2022", "deadline", startedAt)

    expect(remainingArchivePracticeSeconds(practice, new Date("2026-07-15T10:45:00.000Z"))).toBe(900)
    expect(remainingArchivePracticeSeconds(practice, new Date("2026-07-15T11:05:00.000Z"))).toBe(0)
  })

  it("reveals review only after submission and completes bounded self-review", () => {
    const working = createActiveArchivePractice("zap-zh-lg-2019", "review", startedAt)
    working.progress[0]!.attemptedOnPaper = true
    working.progress[0]!.activeSeconds = 120
    const review = submitArchivePracticeForReview(
      working,
      "submitted",
      new Date("2026-07-15T10:42:00.000Z"),
    )

    expect(review).toMatchObject({
      phase: "review",
      currentDocumentKind: "solutions",
      submissionReason: "submitted",
    })
    expect(() => completeArchivePractice(review)).toThrow("Every archive task")

    review.progress.forEach((task, index) => {
      task.reviewStatus = index === 0
        ? "answer-matches"
        : index === 1
          ? "answer-differs-or-unclear"
          : "not-attempted"
    })
    const result = completeArchivePractice(review, new Date("2026-07-15T10:50:00.000Z"))

    expect(result).toMatchObject({
      kind: "archive-source-practice-result",
      year: 2019,
      durationSeconds: 2_520,
      totalActiveSeconds: 120,
    })
    expect(archivePracticeStatusCounts(result)).toEqual({
      "answer-matches": 1,
      "answer-differs-or-unclear": 1,
      "not-attempted": 7,
    })
    expect(isArchivePracticeResult(result)).toBe(true)
    expect(result).not.toHaveProperty("maxPoints")
    expect(result).not.toHaveProperty("grade")
    expect(result).not.toHaveProperty("xp")
  })

  it("rejects relabelled editions and review states with invented status values", () => {
    const practice = createActiveArchivePractice("zap-zh-lg-2021", "tamper", startedAt)
    expect(isActiveArchivePractice({ ...practice, editionId: "zap-zh-lg-2022" })).toBe(false)

    const review = submitArchivePracticeForReview(practice, "timeout", new Date("2026-07-15T11:00:00.000Z"))
    review.progress[0]!.reviewStatus = "correct" as never
    expect(isActiveArchivePractice(review)).toBe(false)
  })

  it("rejects scoring fields injected into active or completed source practice", () => {
    const practice = createActiveArchivePractice("zap-zh-lg-2020", "no-scoring", startedAt)
    expect(isActiveArchivePractice({ ...practice, xp: 10 })).toBe(false)
    expect(isActiveArchivePractice({
      ...practice,
      progress: practice.progress.map((task, index) => index === 0
        ? { ...task, points: 4 }
        : task),
    })).toBe(false)

    const review = submitArchivePracticeForReview(
      practice,
      "submitted",
      new Date("2026-07-15T10:30:00.000Z"),
    )
    review.progress.forEach((task) => { task.reviewStatus = "not-attempted" })
    const result = completeArchivePractice(review, new Date("2026-07-15T10:35:00.000Z"))

    expect(isArchivePracticeResult({ ...result, grade: 5.5 })).toBe(false)
    expect(isArchivePracticeResult({
      ...result,
      taskResults: result.taskResults.map((task, index) => index === 0
        ? { ...task, score: 4 }
        : task),
    })).toBe(false)
  })

  it("records history without changing XP, mastery, assessments, or adaptive review state", () => {
    const learner = createSeededLearner(startedAt)
    const practice = submitArchivePracticeForReview(
      createActiveArchivePractice("zap-zh-lg-2018", "history-only", startedAt),
      "submitted",
      new Date("2026-07-15T10:30:00.000Z"),
    )
    practice.progress.forEach((task) => { task.reviewStatus = "answer-matches" })
    const result = completeArchivePractice(practice, new Date("2026-07-15T10:35:00.000Z"))
    const before = {
      totalXp: learner.totalXp,
      xpSinceAssessment: learner.xpSinceAssessment,
      assessmentNumber: learner.assessmentNumber,
      mastery: structuredClone(learner.mastery),
      learningEvents: structuredClone(learner.learningEvents),
      xpLedger: structuredClone(learner.xpLedger),
    }

    const next = recordArchivePracticeResult(learner, result)

    expect(next.archivePracticeHistory).toEqual([result])
    expect({
      totalXp: next.totalXp,
      xpSinceAssessment: next.xpSinceAssessment,
      assessmentNumber: next.assessmentNumber,
      mastery: next.mastery,
      learningEvents: next.learningEvents,
      xpLedger: next.xpLedger,
    }).toEqual(before)
    expect(recordArchivePracticeResult(next, result)).toBe(next)
  })
})
