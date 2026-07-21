import { describe, expect, it } from "vitest"
import {
  createInitialLearner,
  migrateLearnerState,
  recordMockExamResult,
  recordOfficialMockReview,
} from "./learningEngine"
import {
  encodeOfficialMatchingAnswers,
  isOfficialPartAnswered,
} from "./officialExam"
import {
  completeOfficialExam2015Review,
  createActiveOfficialExam2015,
  gradeOfficialExam2015,
  officialExam2015Blueprint,
  scoreOfficial2015CubeMatches,
} from "./officialExam2015"
import {
  createActiveOfficialExamForEdition,
  gradeSupportedOfficialExam,
  officialExamDefinition,
} from "./officialExams"
import { isReplayableMockExam } from "./mockExam"

const correctCubeMatches = () => encodeOfficialMatchingAnswers(["D", "A", "none", "C"])

describe("official 2015 replay", () => {
  it("registers the exact 9-task, 36-point edition without a grade claim", () => {
    expect(officialExam2015Blueprint).toMatchObject({
      kind: "official",
      editionId: "zap-zh-lg-2015",
      year: 2015,
      rubricVersion: "2015-v1",
      durationSeconds: 3_600,
      maxPoints: 36,
      review: { precheckMode: "safe-floor" },
      grade: { status: "unavailable" },
    })
    expect(officialExam2015Blueprint.tasks).toHaveLength(9)
    expect(officialExam2015Blueprint.tasks.map((task) => task.taskPage)).toEqual([2, 2, 3, 3, 4, 5, 5, 6, 7])
    expect(officialExam2015Blueprint.tasks.map((task) => task.solutionPages)).toEqual([
      [3], [4], [5], [6], [7], [8], [9], [10], [11],
    ])
    expect(officialExam2015Blueprint.tasks.reduce((sum, task) => sum + task.maxPoints, 0)).toBe(36)
    expect(officialExam2015Blueprint.tasks.flatMap((task) => task.parts).reduce((sum, part) => sum + part.maxPoints, 0)).toBe(36)
  })

  it("creates and validates a persisted absolute-deadline run through the registry", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExamForEdition("zap-zh-lg-2015", "registry:2015", start)

    expect(exam).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2015",
      id: "official-mock:zap-zh-lg-2015:1:registry:2015",
      startedAt: start.toISOString(),
      deadlineAt: "2026-07-15T11:00:00.000Z",
    })
    expect(exam.progress.map((task) => task.parts.length)).toEqual([2, 1, 1, 1, 1, 1, 1, 1, 1])
    expect(isReplayableMockExam(exam)).toBe(true)
    expect(officialExamDefinition(exam.editionId)?.blueprint.year).toBe(2015)

    exam.progress[8]!.parts[0]!.partId = "damaged"
    expect(isReplayableMockExam(exam)).toBe(false)
  })

  it("implements every published cube-pair score boundary", () => {
    expect(scoreOfficial2015CubeMatches(correctCubeMatches())).toEqual({
      points: 4,
      correctPairs: 3,
      falsePairs: 0,
      unanswered: 0,
    })
    expect(scoreOfficial2015CubeMatches(encodeOfficialMatchingAnswers([
      "D", "A", "none", "none",
    ]))).toMatchObject({ points: 3, correctPairs: 2, falsePairs: 0 })
    expect(scoreOfficial2015CubeMatches(encodeOfficialMatchingAnswers([
      "D", "A", "B", "none",
    ]))).toMatchObject({ points: 2, correctPairs: 2, falsePairs: 1 })
    expect(scoreOfficial2015CubeMatches(encodeOfficialMatchingAnswers([
      "D", "A", "B", "D",
    ]))).toMatchObject({ points: 0, correctPairs: 2, falsePairs: 2 })
    expect(scoreOfficial2015CubeMatches(encodeOfficialMatchingAnswers([
      "D", "B", "none", "none",
    ]))).toMatchObject({ points: 1, correctPairs: 1, falsePairs: 1 })
    expect(scoreOfficial2015CubeMatches(encodeOfficialMatchingAnswers([
      "A", "B", "C", "D",
    ]))).toMatchObject({ points: 0, correctPairs: 0, falsePairs: 4 })

    const matchingPart = officialExam2015Blueprint.tasks[8]!.parts[0]!
    expect(isOfficialPartAnswered(matchingPart, correctCubeMatches())).toBe(true)
    expect(isOfficialPartAnswered(matchingPart, "D|A||C")).toBe(false)
    expect(isOfficialPartAnswered(matchingPart, "D|A|invented|C")).toBe(false)
  })

  it("locks only Task 9 and leaves every method-dependent point for the original rubric", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExam2015("safe-boundary", start)
    exam.progress[1]!.parts[0]!.answer = "4.685"
    exam.progress[1]!.parts[0]!.working = "29.28 - 5.59 = 23.69; 28.375 - 23.69"
    exam.progress[8]!.parts[0]!.answer = correctCubeMatches()

    const result = gradeSupportedOfficialExam(exam, "submitted", new Date("2026-07-15T10:52:00.000Z"))
    expect(result).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2015",
      rubricVersion: "2015-v1",
      durationSeconds: 52 * 60,
      maxPoints: 36,
      certainPoints: 4,
      reviewablePoints: 32,
      officialReview: { status: "pending" },
    })
    expect(result.taskResults.map((task) => [task.certainPoints, task.reviewablePoints])).toEqual([
      [0, 4], [0, 4], [0, 4], [0, 4], [0, 4], [0, 4], [0, 4], [0, 4], [4, 0],
    ])
    expect(result.taskResults[1]!.parts[0]).toMatchObject({
      answerCorrect: true,
      certainPoints: 0,
      reviewablePoints: 4,
      confidence: "manual",
    })
    expect(result.taskResults[8]!.parts[0]).toMatchObject({
      answerCorrect: true,
      certainPoints: 4,
      reviewablePoints: 0,
      confidence: "certain",
    })
  })

  it("freezes partial Task 9 points and completes correction without a grade", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const exam = createActiveOfficialExam2015("fixed-partial-cube-score", start)
    exam.progress[8]!.parts[0]!.answer = encodeOfficialMatchingAnswers(["D", "A", "B", "none"])
    const result = gradeOfficialExam2015(exam, "submitted", new Date("2026-07-15T10:50:00.000Z"))
    expect(result.taskResults[8]).toMatchObject({ certainPoints: 2, reviewablePoints: 0 })

    const scores = [4, 3, 2, 1, 0, 4, 3, 2, 2]
    const completed = completeOfficialExam2015Review(
      result,
      scores,
      new Date("2026-07-15T12:00:00.000Z"),
    )
    expect(completed).toMatchObject({
      certainPoints: 21,
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
    belowFloor[8] = 1
    expect(() => completeOfficialExam2015Review(result, belowFloor)).toThrow(
      "official review is incomplete or invalid",
    )
    const aboveCeiling = [...scores]
    aboveCeiling[8] = 3
    expect(() => completeOfficialExam2015Review(result, aboveCeiling)).toThrow(
      "official review is incomplete or invalid",
    )
  })

  it("schedules recovery without changing XP or fabricating a later grade", () => {
    const start = new Date("2026-07-15T10:00:00.000Z")
    const pending = gradeOfficialExam2015(
      createActiveOfficialExam2015("recovery:2015", start),
      "submitted",
      new Date("2026-07-15T10:50:00.000Z"),
    )
    const completed = completeOfficialExam2015Review(
      pending,
      [4, 3, 2, 1, 0, 4, 3, 2, 0],
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
