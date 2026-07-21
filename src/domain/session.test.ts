import { describe, expect, it } from "vitest"
import {
  buildAssignments,
  buildPlacementTask,
  createInitialLearner,
  createSeededLearner,
  requestTeacherSupport,
} from "./learningEngine"
import { createActiveLearningSession, isResumableSession } from "./session"

const now = new Date("2026-07-14T10:00:00.000Z")

describe("active learning session", () => {
  it("starts lessons on their concept page and reviews on their first question", () => {
    const learner = createSeededLearner(now)
    const tasks = buildAssignments(learner, now)
    const lesson = tasks.find((task) => task.kind === "lesson")!
    const review = tasks.find((task) => task.kind === "review")!

    expect(createActiveLearningSession(lesson, now).phase).toBe("lesson")
    expect(createActiveLearningSession(review, now).phase).toBe("questions")
  })

  it("waits on the assessment rules screen before starting the timer", () => {
    const learner = createSeededLearner(now)
    learner.xpSinceAssessment = learner.assessmentThreshold
    const assessment = buildAssignments(learner, now)[0]!
    const session = createActiveLearningSession(assessment, now)

    expect(session.phase).toBe("assessment-intro")
    expect(session.activeSeconds).toBe(0)
    expect(session.question.questionStartedAt).toBe(0)
  })

  it("starts placement directly in silent questions and keeps it resumable", () => {
    const learner = createInitialLearner(now)
    const placement = buildPlacementTask(learner)
    const session = createActiveLearningSession(placement, now)

    expect(session.phase).toBe("questions")
    expect(session.task.kind).toBe("placement")
    expect(session.timerPaused).toBe(false)
    expect(session.question.verifiedPracticeSteps).toEqual([])
    expect(isResumableSession(session, learner)).toBe(true)
  })

  it("keeps a legacy session without manual-pause state resumable", () => {
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now).find((candidate) => candidate.kind === "review")!
    const session = createActiveLearningSession(task, now)
    delete session.timerPaused

    expect(isResumableSession(session, learner)).toBe(true)
  })

  it("maps an unversioned legacy task to Zurich v1 but rejects an unknown task package", () => {
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now).find((candidate) => candidate.kind === "review")!
    const legacySession = createActiveLearningSession(structuredClone(task), now)
    delete legacySession.task.curriculum
    expect(isResumableSession(legacySession, learner)).toBe(true)

    const unsupportedSession = createActiveLearningSession(structuredClone(task), now)
    unsupportedSession.task.curriculum = {
      courseId: learner.courseId,
      version: 99,
    }
    expect(isResumableSession(unsupportedSession, learner)).toBe(false)
  })

  it("keeps a paused eight-question placement v1 session resumable", () => {
    const learner = createInitialLearner(now)
    const current = buildPlacementTask(learner)
    const legacy = {
      ...current,
      id: `placement:${learner.learnerId}:v1`,
      seed: `placement:${learner.learnerId}:v1`,
      topicIds: current.topicIds.filter((topicId) => topicId !== "efficient-arithmetic"),
      questionCount: 8,
      generation: current.generation
        ? { ...current.generation, difficultyBands: current.generation.difficultyBands.slice(1) }
        : undefined,
    }
    const session = createActiveLearningSession(legacy, now)

    expect(session.task.id).toBe("placement:local-learner:v1")
    expect(session.task.questionCount).toBe(8)
    expect(isResumableSession(session, learner)).toBe(true)
  })

  it("does not resume a task that already has a completion ledger entry", () => {
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now)[0]!
    const session = createActiveLearningSession(task, now)

    expect(isResumableSession(session, learner)).toBe(true)
    learner.completedTaskIds.push(task.id)
    expect(isResumableSession(session, learner)).toBe(false)
  })

  it("does not cross the placement boundary with an incompatible paused task", () => {
    const newLearner = createInitialLearner(now)
    const placedLearner = createSeededLearner(now)
    const placementSession = createActiveLearningSession(buildPlacementTask(newLearner), now)
    const lessonSession = createActiveLearningSession(
      buildAssignments(placedLearner, now).find((task) => task.kind === "lesson")!,
      now,
    )

    expect(isResumableSession(placementSession, placedLearner)).toBe(false)
    expect(isResumableSession(lessonSession, newLearner)).toBe(false)
  })

  it("does not resume a normal task after its topic is paused for teacher support", () => {
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now).find((candidate) => candidate.kind === "review")!
    const session = createActiveLearningSession(task, now)

    expect(isResumableSession(session, learner)).toBe(true)
    const paused = requestTeacherSupport(learner, task.topicIds[0]!, now)
    expect(isResumableSession(session, paused)).toBe(false)
  })
})
