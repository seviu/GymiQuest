import { describe, expect, it } from "vitest"
import {
  buildAssignments,
  buildPlacementTask,
  buildPrerequisiteRefresh,
  createInitialLearner,
  createSeededLearner,
  requestTeacherSupport,
} from "./learningEngine"
import {
  createActiveLearningSession,
  createPrerequisiteDetourSession,
  isResumableSession,
  originatingSession,
  resolveResumableSession,
  setActiveLearningSessionContentLocale,
} from "./session"

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

  it("changes a paused session and its prerequisite return path to the selected language", () => {
    const learner = createSeededLearner(now)
    const source = createActiveLearningSession({
      ...buildAssignments(learner, now)[0]!,
      contentLocale: "en",
    }, now)
    source.question.answer = "24"
    const detour = createPrerequisiteDetourSession(
      { ...buildPrerequisiteRefresh(learner, "mass-units"), contentLocale: "en" },
      source,
      now,
    )

    const localized = setActiveLearningSessionContentLocale(
      detour,
      "de",
      new Date("2026-07-14T10:01:00.000Z"),
    )

    expect(localized.task.contentLocale).toBe("de")
    expect(localized.prerequisiteDetour?.origin.task.contentLocale).toBe("de")
    expect(localized.prerequisiteDetour?.origin.question.answer).toBe("24")
    expect(localized.updatedAt).toBe("2026-07-14T10:01:00.000Z")
  })

  it("preserves the exact question state through a prerequisite detour", () => {
    const learner = createSeededLearner(now)
    const sourceTask = buildAssignments(learner, now)[0]!
    const source = createActiveLearningSession(sourceTask, now)
    source.activeSeconds = 73
    source.timerPaused = true
    source.question.answer = "12,5"
    source.question.submissions = 2
    source.question.mistakes = 1
    source.question.helpCount = 1
    source.question.activeHelp = ["hint", "prerequisites"]
    source.question.questionStartedAt = 17
    source.question.verifiedPracticeSteps = ["first-step"]
    source.question.firstDiagnostic = {
      kind: "format",
      title: "Nur die Zahl eingeben.",
    }
    source.question.conceptRepair = {
      version: 5,
      seed: "detour:origin:repair",
      stage: "example",
      teachBack: "Ich rechne zuerst zurück.",
      answer: "18",
      attempts: 1,
      feedback: "wrong",
    }

    const refresh = buildPrerequisiteRefresh(learner, "mass-units")
    const detour = createPrerequisiteDetourSession(
      refresh,
      source,
      new Date("2026-07-14T10:02:00.000Z"),
    )

    expect(detour.task).toEqual(refresh)
    expect(detour.activeSeconds).toBe(0)
    expect(originatingSession(detour)).toEqual(source)
    expect(detour.prerequisiteDetour?.origin).not.toHaveProperty("prerequisiteDetour")
    expect(isResumableSession(detour, learner)).toBe(true)

    learner.completedTaskIds.push(refresh.id)
    expect(resolveResumableSession(detour, learner)).toEqual(source)
  })

  it("rejects a nested prerequisite detour", () => {
    const learner = createSeededLearner(now)
    const source = createActiveLearningSession(buildAssignments(learner, now)[0]!, now)
    const refresh = buildPrerequisiteRefresh(learner, "mass-units")
    const detour = createPrerequisiteDetourSession(refresh, source, now)

    expect(() => createPrerequisiteDetourSession(refresh, detour, now)).toThrow(
      /Nested prerequisite detours/,
    )
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
