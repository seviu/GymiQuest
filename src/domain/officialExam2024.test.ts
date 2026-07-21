import { describe, expect, it } from "vitest"
import { createInitialLearner, migrateLearnerState } from "./learningEngine"
import { isReplayableMockExam } from "./mockExam"
import {
  completeOfficialExam2024Review,
  createActiveOfficialExam2024,
  gradeOfficialExam2024,
  officialExam2024Blueprint,
} from "./officialExam2024"
import {
  createActiveOfficialExamForEdition,
  gradeSupportedOfficialExam,
  officialExamDefinition,
} from "./officialExams"

describe("official 2024 replay", () => {
  it("registers the exact document-backed 9-task, 36-point edition", () => {
    expect(officialExam2024Blueprint).toMatchObject({
      kind: "official",
      editionId: "zap-zh-lg-2024",
      year: 2024,
      rubricVersion: "2024-v1",
      durationSeconds: 3_600,
      maxPoints: 36,
      review: { precheckMode: "manual-only" },
    })
    expect(officialExam2024Blueprint.tasks).toHaveLength(9)
    expect(officialExam2024Blueprint.tasks.map((task) => task.taskPage)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(officialExam2024Blueprint.tasks.map((task) => task.solutionPages)).toEqual([
      [3], [4], [5], [6], [7], [8], [9], [10], [11],
    ])
    expect(officialExam2024Blueprint.tasks.reduce((sum, task) => sum + task.maxPoints, 0)).toBe(36)
    expect(officialExam2024Blueprint.tasks.flatMap((task) => task.parts).reduce((sum, part) => sum + part.maxPoints, 0)).toBe(36)
  })

  it("creates and validates a persisted absolute-deadline run through the registry", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExamForEdition("zap-zh-lg-2024", "registry:2024", start)

    expect(exam).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2024",
      id: "official-mock:zap-zh-lg-2024:1:registry:2024",
      startedAt: start.toISOString(),
      deadlineAt: "2026-07-15T11:00:00.000Z",
    })
    expect(exam.progress.map((task) => task.parts.length)).toEqual([1, 2, 2, 2, 1, 2, 1, 2, 2])
    expect(isReplayableMockExam(exam)).toBe(true)
    expect(officialExamDefinition(exam.editionId)?.blueprint.year).toBe(2024)

    exam.progress[8]!.parts[1]!.partId = "damaged"
    expect(isReplayableMockExam(exam)).toBe(false)
  })

  it("keeps all 36 points manual even when a numeric final answer is recognized", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExam2024("manual-only", start)
    exam.progress[0]!.parts[0]!.answer = "4649,4"
    exam.progress[0]!.parts[0]!.working = "Die beiden äusseren Produkte heben sich auf."
    exam.progress[6]!.parts[0]!.answer = "completed-on-paper"

    const result = gradeSupportedOfficialExam(exam, "submitted", new Date("2026-07-15T10:52:00.000Z"))
    expect(result).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2024",
      rubricVersion: "2024-v1",
      durationSeconds: 52 * 60,
      maxPoints: 36,
      certainPoints: 0,
      reviewablePoints: 36,
      officialReview: { status: "pending" },
    })
    expect(result.taskResults.every((task) => task.certainPoints === 0 && task.reviewablePoints === 4)).toBe(true)
    expect(result.taskResults[0]!.parts[0]).toMatchObject({
      answerCorrect: true,
      certainPoints: 0,
      reviewablePoints: 4,
      confidence: "manual",
    })
  })

  it("freezes human task scores and applies only the published 2024 scale", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const result = gradeOfficialExam2024(
      createActiveOfficialExam2024("review:2024", start),
      "submitted",
      new Date("2026-07-15T10:50:00.000Z"),
    )
    const scores = [4, 3, 2, 1, 0, 4, 3, 2, 1]
    const completed = completeOfficialExam2024Review(
      result,
      scores,
      new Date("2026-07-15T12:00:00.000Z"),
    )

    expect(completed).toMatchObject({
      certainPoints: 20,
      reviewablePoints: 0,
      officialReview: {
        status: "complete",
        taskScores: scores,
        gradeScaleId: "zap-lg-2024-math-2024-03-15",
        mathematicsGrade: 3.75,
        completedAt: "2026-07-15T12:00:00.000Z",
      },
    })
    expect(completed.taskResults.map((task) => task.certainPoints)).toEqual(scores)
    expect(completed.recoveryTopicIds.length).toBeGreaterThan(0)
    expect(() => completeOfficialExam2024Review(result, [4, 4])).toThrow(
      "official review is incomplete or invalid",
    )
    result.taskResults[0]!.taskId = "damaged"
    expect(() => completeOfficialExam2024Review(result, scores)).toThrow(
      "official review is incomplete or invalid",
    )
  })

  it("backfills a legacy completed 2024 result with the 2024 scale only", () => {
    const now = new Date("2026-07-15T10:00:00.000Z")
    const result = gradeOfficialExam2024(
      createActiveOfficialExam2024("legacy-scale:2024", now),
      "submitted",
      new Date("2026-07-15T10:50:00.000Z"),
    )
    const completed = completeOfficialExam2024Review(result, [4, 3, 2, 1, 0, 4, 3, 2, 1])
    delete completed.officialReview!.gradeScaleId
    delete completed.officialReview!.mathematicsGrade
    const learner = createInitialLearner(now)
    learner.mockHistory = [completed]

    expect(migrateLearnerState(learner).mockHistory[0]?.officialReview).toMatchObject({
      gradeScaleId: "zap-lg-2024-math-2024-03-15",
      mathematicsGrade: 3.75,
    })
  })
})
