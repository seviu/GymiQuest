import { describe, expect, it } from "vitest"
import {
  createInitialLearner,
  migrateLearnerState,
  recordMockExamResult,
  recordOfficialMockReview,
} from "./learningEngine"
import {
  encodeOfficialTrueFalseAnswers,
  isOfficialPartAnswered,
} from "./officialExam"
import {
  completeOfficialExam2023Review,
  createActiveOfficialExam2023,
  gradeOfficialExam2023,
  officialExam2023Blueprint,
  scoreOfficial2023TrueFalse,
} from "./officialExam2023"
import {
  createActiveOfficialExamForEdition,
  gradeSupportedOfficialExam,
  officialExamDefinition,
} from "./officialExams"
import { isReplayableMockExam } from "./mockExam"

const correctTruthTable = () => encodeOfficialTrueFalseAnswers([
  "true",
  "false",
  "true",
  "false",
])

describe("official 2023 replay", () => {
  it("registers the exact document-backed 9-task, 36-point edition without a grade claim", () => {
    expect(officialExam2023Blueprint).toMatchObject({
      kind: "official",
      editionId: "zap-zh-lg-2023",
      year: 2023,
      rubricVersion: "2023-v1",
      durationSeconds: 3_600,
      maxPoints: 36,
      review: { precheckMode: "safe-floor" },
      grade: { status: "unavailable" },
    })
    expect(officialExam2023Blueprint.tasks).toHaveLength(9)
    expect(officialExam2023Blueprint.tasks.map((task) => task.taskPage)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(officialExam2023Blueprint.tasks.map((task) => task.solutionPages)).toEqual([
      [3], [4], [5], [6], [7, 8], [9], [10], [11], [12],
    ])
    expect(officialExam2023Blueprint.tasks.reduce((sum, task) => sum + task.maxPoints, 0)).toBe(36)
    expect(officialExam2023Blueprint.tasks.flatMap((task) => task.parts).reduce((sum, part) => sum + part.maxPoints, 0)).toBe(36)
  })

  it("creates and validates a persisted absolute-deadline run through the registry", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExamForEdition("zap-zh-lg-2023", "registry:2023", start)

    expect(exam).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2023",
      id: "official-mock:zap-zh-lg-2023:1:registry:2023",
      startedAt: start.toISOString(),
      deadlineAt: "2026-07-15T11:00:00.000Z",
    })
    expect(exam.progress.map((task) => task.parts.length)).toEqual([2, 3, 3, 1, 2, 3, 2, 1, 2])
    expect(isReplayableMockExam(exam)).toBe(true)
    expect(officialExamDefinition(exam.editionId)?.blueprint.year).toBe(2023)

    exam.progress[4]!.parts[1]!.partId = "damaged"
    expect(isReplayableMockExam(exam)).toBe(false)
  })

  it("implements the published plus-one, minus-one, blank-zero truth-table score", () => {
    expect(scoreOfficial2023TrueFalse(correctTruthTable())).toEqual({
      points: 4,
      correctAnswers: 4,
      incorrectAnswers: 0,
      unanswered: 0,
    })
    expect(scoreOfficial2023TrueFalse(encodeOfficialTrueFalseAnswers([
      "true", "false", "true", "true",
    ]))).toMatchObject({ points: 2, correctAnswers: 3, incorrectAnswers: 1 })
    expect(scoreOfficial2023TrueFalse(encodeOfficialTrueFalseAnswers([
      "true", "false", "false", "true",
    ]))).toMatchObject({ points: 0, correctAnswers: 2, incorrectAnswers: 2 })
    expect(scoreOfficial2023TrueFalse(encodeOfficialTrueFalseAnswers([
      "true", "", "true", "false",
    ]))).toMatchObject({ points: 3, correctAnswers: 3, unanswered: 1 })

    const truthPart = officialExam2023Blueprint.tasks[3]!.parts[0]!
    expect(isOfficialPartAnswered(truthPart, correctTruthTable())).toBe(true)
    expect(isOfficialPartAnswered(truthPart, "true||true|false")).toBe(false)
  })

  it("locks only the two machine-safe outcomes and leaves every other point for the original rubric", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExam2023("safe-boundary", start)
    exam.progress[0]!.parts[0]!.answer = "352 kg"
    exam.progress[0]!.parts[0]!.working = "704 : 2"
    exam.progress[3]!.parts[0]!.answer = correctTruthTable()
    exam.progress[7]!.parts[0]!.answer = "156 Gabeln"

    const result = gradeSupportedOfficialExam(exam, "submitted", new Date("2026-07-15T10:52:00.000Z"))
    expect(result).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2023",
      rubricVersion: "2023-v1",
      durationSeconds: 52 * 60,
      maxPoints: 36,
      certainPoints: 8,
      reviewablePoints: 28,
      officialReview: { status: "pending" },
    })
    expect(result.taskResults.map((task) => [task.certainPoints, task.reviewablePoints])).toEqual([
      [0, 4], [0, 4], [0, 4], [4, 0], [0, 4], [0, 4], [0, 4], [4, 0], [0, 4],
    ])
    expect(result.taskResults[0]!.parts[0]).toMatchObject({
      answerCorrect: true,
      certainPoints: 0,
      reviewablePoints: 2,
      confidence: "manual",
    })
    expect(result.taskResults[7]!.parts[0]).toMatchObject({
      answerCorrect: true,
      certainPoints: 4,
      reviewablePoints: 0,
      confidence: "certain",
    })

    const wrongUnitExam = createActiveOfficialExam2023("safe-boundary:wrong-unit", start)
    wrongUnitExam.progress[7]!.parts[0]!.answer = "156 Messer"
    const wrongUnitResult = gradeOfficialExam2023(
      wrongUnitExam,
      "submitted",
      new Date("2026-07-15T10:52:00.000Z"),
    )
    expect(wrongUnitResult.taskResults[7]!.parts[0]).toMatchObject({
      answerCorrect: false,
      certainPoints: 0,
      reviewablePoints: 4,
      confidence: "manual",
    })
  })

  it("enforces both automatic score floors and ceilings during human correction", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExam2023("fixed-truth-score", start)
    exam.progress[3]!.parts[0]!.answer = encodeOfficialTrueFalseAnswers([
      "true", "false", "true", "true",
    ])
    const result = gradeOfficialExam2023(exam, "submitted", new Date("2026-07-15T10:50:00.000Z"))
    expect(result.taskResults[3]).toMatchObject({ certainPoints: 2, reviewablePoints: 0 })

    const scores = [4, 3, 2, 2, 1, 4, 3, 2, 1]
    const completed = completeOfficialExam2023Review(
      result,
      scores,
      new Date("2026-07-15T12:00:00.000Z"),
    )
    expect(completed).toMatchObject({
      certainPoints: 22,
      reviewablePoints: 0,
      officialReview: {
        status: "complete",
        taskScores: scores,
        completedAt: "2026-07-15T12:00:00.000Z",
      },
    })
    expect(completed.officialReview).not.toHaveProperty("gradeScaleId")
    expect(completed.officialReview).not.toHaveProperty("mathematicsGrade")

    const belowFloor = [...scores]
    belowFloor[3] = 1
    expect(() => completeOfficialExam2023Review(result, belowFloor)).toThrow(
      "official review is incomplete or invalid",
    )
    const aboveCeiling = [...scores]
    aboveCeiling[3] = 3
    expect(() => completeOfficialExam2023Review(result, aboveCeiling)).toThrow(
      "official review is incomplete or invalid",
    )
  })

  it("schedules recovery without changing XP or fabricating a later grade", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const pending = gradeOfficialExam2023(
      createActiveOfficialExam2023("recovery:2023", start),
      "submitted",
      new Date("2026-07-15T10:50:00.000Z"),
    )
    const completed = completeOfficialExam2023Review(
      pending,
      [4, 3, 2, 0, 3, 2, 1, 4, 2],
      new Date("2026-07-15T12:00:00.000Z"),
    )
    const learner = createInitialLearner(start)
    learner.totalXp = 91
    learner.xpSinceAssessment = 44
    const pendingState = recordMockExamResult(learner, pending)
    const reviewedState = recordOfficialMockReview(pendingState, completed)

    expect(reviewedState.totalXp).toBe(91)
    expect(reviewedState.xpSinceAssessment).toBe(44)
    expect(reviewedState.mockHistory[0]?.officialReview?.status).toBe("complete")
    expect(reviewedState.mockHistory[0]?.officialReview).not.toHaveProperty("mathematicsGrade")
    expect(completed.recoveryTopicIds.length).toBeGreaterThan(0)

    const migrated = migrateLearnerState(reviewedState)
    expect(migrated.mockHistory[0]?.officialReview).not.toHaveProperty("gradeScaleId")
    expect(migrated.mockHistory[0]?.officialReview).not.toHaveProperty("mathematicsGrade")
  })
})
