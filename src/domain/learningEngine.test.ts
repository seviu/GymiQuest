import { describe, expect, it } from "vitest"
import { orderedTopics } from "./content"
import { UnsupportedCurriculumPackageError } from "./curriculumPackage"
import {
  topicIds,
  type LearnerState,
  type LearningEvent,
  type LearningTask,
  type LessonPacingMode,
  type QuestionResult,
  type TopicId,
} from "./model"
import {
  buildAssignments,
  buildErrorRefresh,
  buildPlacementTask,
  buildPrerequisiteRefresh,
  buildTopicLesson,
  completePlacementWithoutCheck,
  createInitialLearner,
  createSeededLearner,
  isCurriculumMastered,
  DEEP_RECOVERY_BREAK_HOURS,
  LIGHT_RECOVERY_BREAK_HOURS,
  MAX_TOPIC_INACTIVITY_DAYS,
  migrateLearnerState,
  nextLessonRecoveryAt,
  nextReviewAt,
  recordCompletion,
  REVIEW_INTERVAL_DAYS,
  requestTeacherSupport,
  resolveTeacherSupport,
  selectAssessmentTopicIds,
  topicNeedsTeacherSupport,
} from "./learningEngine"

const now = new Date("2026-07-14T10:00:00.000Z")

function questionResults(task: LearningTask, options: { mistakes?: number; hints?: number } = {}): QuestionResult[] {
  const mistakes = options.mistakes ?? 0
  const hints = options.hints ?? 0
  return Array.from({ length: task.questionCount }, (_, index) => ({
    questionId: `${task.id}:question:${index}`,
    topicId: task.topicIds[index % task.topicIds.length]!,
    attempts: index === 0 ? mistakes + 1 : 1,
    hintsUsed: index === 0 ? hints : 0,
    activeSeconds: 25,
    independentlySolved: !(index === 0 && (mistakes > 0 || hints > 0)),
  }))
}

function completion(
  task: LearningTask,
  suffix: string,
  options: { mistakes?: number; hints?: number; at?: string } = {},
): LearningEvent {
  const mistakes = options.mistakes ?? 0
  const hints = options.hints ?? 0
  return {
    id: `event:${task.id}:${suffix}`,
    taskId: task.id,
    taskKind: task.kind,
    topicIds: task.topicIds,
    completedAt: options.at ?? now.toISOString(),
    activeSeconds: task.questionCount * 25,
    mistakes,
    hintsUsed: hints,
    independentlyCompleted: mistakes === 0 && hints === 0,
    questionResults: questionResults(task, { mistakes, hints }),
  }
}

function taskOfKind(state: LearnerState, kind: LearningTask["kind"]): LearningTask {
  const task = buildAssignments(state, now).find((assignment) => assignment.kind === kind)
  if (!task) throw new Error(`Expected a ${kind} task`)
  return task
}

function addPacingEvidence(
  state: LearnerState,
  topicId: TopicId,
  independentResults: readonly boolean[],
  id: string,
  completedAt: string,
): void {
  const mistakes = independentResults.filter((independent) => !independent).length
  state.learningEvents.push({
    id: `event:pacing:${id}`,
    taskId: `pacing:${id}`,
    taskKind: "review",
    topicIds: [topicId],
    completedAt,
    activeSeconds: independentResults.length * 20,
    mistakes,
    hintsUsed: 0,
    independentlyCompleted: mistakes === 0,
    questionResults: independentResults.map((independent, index) => ({
      questionId: `pacing:${id}:question:${index}`,
      topicId,
      attempts: independent ? 1 : 2,
      hintsUsed: 0,
      activeSeconds: 20,
      independentlySolved: independent,
      solved: true,
    })),
  })
}

function learnerForPacing(mode: LessonPacingMode): LearnerState {
  const state = createSeededLearner(now)
  if (mode === "steady") return state

  const topicId = taskOfKind(state, "lesson").topicIds[0]!
  addPacingEvidence(
    state,
    topicId,
    mode === "accelerated" ? [true, true] : [true, false],
    mode,
    "2026-07-13T10:00:00.000Z",
  )
  return state
}

function completionWithMissedQuestions(
  task: LearningTask,
  suffix: string,
  missedIndexes: readonly number[],
): LearningEvent {
  const missed = new Set(missedIndexes)
  return {
    id: `event:${task.id}:${suffix}`,
    taskId: task.id,
    taskKind: task.kind,
    topicIds: task.topicIds,
    completedAt: now.toISOString(),
    activeSeconds: task.questionCount * 25,
    mistakes: missed.size,
    hintsUsed: 0,
    independentlyCompleted: missed.size === 0,
    questionResults: Array.from({ length: task.questionCount }, (_, index) => ({
      questionId: `${task.id}:question:${index}`,
      topicId: task.topicIds[index % task.topicIds.length]!,
      attempts: missed.has(index) ? 2 : 1,
      hintsUsed: 0,
      activeSeconds: 25,
      independentlySolved: !missed.has(index),
      solved: true,
      difficultyBand: task.generation?.difficultyBands[index],
    })),
  }
}

describe("learning engine", () => {
  it("starts a fresh learner without assumed mastery or assignments", () => {
    const state = createInitialLearner(now)

    expect(state.schemaVersion).toBe(12)
    expect(state.courseId).toBe("zh-zap1-math")
    expect(state.courseVersion).toBe(1)
    expect(state.profileCompletedAt).toBeUndefined()
    expect(state.preferences).toMatchObject({
      practiceDays: ["tuesday", "thursday", "saturday"],
      sessionMinutes: 15,
      helpStyle: "visual",
      visualMode: "calm",
      readingMode: "standard",
      geometryControlSide: "right",
    })
    expect(state.mockHistory).toEqual([])
    expect(state.learnerFeedback).toEqual([])
    expect(state.topicHelpRequests).toEqual([])
    expect(state.placementCompletedAt).toBeUndefined()
    expect(Object.values(state.mastery).every((mastery) => mastery.status === "locked")).toBe(true)
    expect(buildAssignments(state, now)).toEqual([])

    const placement = buildPlacementTask(state)
    expect(placement.kind).toBe("placement")
    expect(placement.id).toBe("placement:local-learner:v2")
    expect(placement.questionCount).toBe(9)
    expect(placement.topicIds).toHaveLength(9)
    expect(placement.topicIds).toContain("efficient-arithmetic")
    expect(placement.curriculum).toEqual({ courseId: "zh-zap1-math", version: 1 })
    expect(placement.maxXp).toBe(0)
  })

  it("can begin with the foundations without inventing mastery evidence", () => {
    const state = completePlacementWithoutCheck(createInitialLearner(now), now)
    const tasks = buildAssignments(state, now)

    expect(state.placementCompletedAt).toBe(now.toISOString())
    expect(Object.values(state.mastery).every((mastery) => mastery.status !== "mastered")).toBe(true)
    expect(tasks.some((task) => task.kind === "lesson")).toBe(true)
    expect(tasks.some((task) => task.kind === "review")).toBe(false)
  })

  it("binds every engine-authored task kind to the learner curriculum package", () => {
    const fresh = createInitialLearner(now)
    const learner = createSeededLearner(now)
    const assignments = buildAssignments(learner, now)
    const lesson = assignments.find((task) => task.kind === "lesson")!
    const assessmentLearner = structuredClone(learner)
    assessmentLearner.xpSinceAssessment = assessmentLearner.assessmentThreshold
    const tasks = [
      buildPlacementTask(fresh),
      ...assignments,
      buildTopicLesson(learner, lesson.topicIds[0]!),
      buildPrerequisiteRefresh(learner, "mass-units"),
      buildErrorRefresh(learner, "mass-units"),
      ...buildAssignments(assessmentLearner, now),
    ]

    expect(tasks.length).toBeGreaterThan(6)
    expect(tasks.every((task) => (
      task.curriculum?.courseId === learner.courseId &&
      task.curriculum.version === learner.courseVersion
    ))).toBe(true)
  })

  it("persists an evidence-based difficulty path without making reviews Aufbau work", () => {
    const fresh = createInitialLearner(now)
    expect(buildPlacementTask(fresh).generation?.difficultyBands).toEqual(
      Array.from({ length: 9 }, () => "standard"),
    )

    const state = createSeededLearner(now)
    const lesson = taskOfKind(state, "lesson")
    const review = taskOfKind(state, "review")
    expect(lesson.generation?.difficultyBands).toEqual(["foundation", "standard", "exam"])
    expect(review.generation?.difficultyBands).not.toContain("foundation")

    const reviewedTopic = review.topicIds[0]!
    state.mastery[reviewedTopic].reviewStage = 2
    state.mastery[reviewedTopic].retention = 0.8
    state.mastery[reviewedTopic].independentMastery = 0.8
    expect(taskOfKind(state, "review").generation?.difficultyBands).toEqual(["exam", "exam"])

    state.xpSinceAssessment = state.assessmentThreshold
    const assessment = taskOfKind(state, "assessment")
    expect(assessment.generation?.difficultyBands).toEqual(
      Array.from({ length: assessment.questionCount }, () => "exam"),
    )
  })

  it("chooses default, accelerated, and supported lesson pacing from the latest relevant round", () => {
    const steadyState = createSeededLearner(now)
    const steadyLesson = taskOfKind(steadyState, "lesson")
    expect(steadyLesson).toMatchObject({
      pacing: { version: 1, mode: "steady" },
      questionCount: 3,
      generation: { difficultyBands: ["foundation", "standard", "exam"] },
    })

    const targetTopicId = steadyLesson.topicIds[0]!
    const acceleratedState = createSeededLearner(now)
    addPacingEvidence(
      acceleratedState,
      targetTopicId,
      [true, false],
      "older-relevant-struggle",
      "2026-07-13T08:00:00.000Z",
    )
    addPacingEvidence(
      acceleratedState,
      targetTopicId,
      [true, true],
      "latest-relevant-success",
      "2026-07-13T09:00:00.000Z",
    )
    addPacingEvidence(
      acceleratedState,
      "mass-units",
      [false, false],
      "newer-unrelated-struggle",
      "2026-07-13T10:00:00.000Z",
    )
    expect(taskOfKind(acceleratedState, "lesson")).toMatchObject({
      pacing: { version: 1, mode: "accelerated" },
      questionCount: 2,
      generation: { difficultyBands: ["standard", "exam"] },
    })

    const supportedState = createSeededLearner(now)
    addPacingEvidence(
      supportedState,
      targetTopicId,
      [true, false],
      "latest-relevant-support",
      "2026-07-13T10:00:00.000Z",
    )
    expect(taskOfKind(supportedState, "lesson")).toMatchObject({
      pacing: { version: 1, mode: "supported" },
      questionCount: 4,
      generation: { difficultyBands: ["foundation", "foundation", "standard", "exam"] },
    })
  })

  it("uses immediate-prerequisite evidence and caps supported pacing in a ten-minute session", () => {
    const state = createSeededLearner(now)
    state.preferences.sessionMinutes = 10
    addPacingEvidence(
      state,
      "fraction-of-quantity",
      [true, false],
      "weak-immediate-prerequisite",
      "2026-07-13T09:00:00.000Z",
    )
    addPacingEvidence(
      state,
      "mass-units",
      [true, true],
      "newer-unrelated-success",
      "2026-07-13T10:00:00.000Z",
    )

    expect(buildTopicLesson(state, "time-fractions")).toMatchObject({
      pacing: { version: 1, mode: "supported" },
      questionCount: 3,
      generation: { difficultyBands: ["foundation", "foundation", "standard"] },
    })
  })

  it("leaves placement, review, repair, and assessment lengths and bands unchanged", () => {
    const fresh = createInitialLearner(now)
    const state = createSeededLearner(now)
    const assessmentState = structuredClone(state)
    assessmentState.xpSinceAssessment = assessmentState.assessmentThreshold

    const placement = buildPlacementTask(fresh)
    const review = taskOfKind(state, "review")
    const prerequisiteRefresh = buildPrerequisiteRefresh(state, "mass-units")
    const errorRefresh = buildErrorRefresh(state, "mass-units")
    const assessment = taskOfKind(assessmentState, "assessment")

    expect(placement).toMatchObject({
      questionCount: 9,
      generation: { difficultyBands: Array.from({ length: 9 }, () => "standard") },
    })
    expect(review).toMatchObject({
      questionCount: 2,
      generation: { difficultyBands: ["standard", "exam"] },
    })
    expect(prerequisiteRefresh).toMatchObject({
      questionCount: 2,
      generation: { difficultyBands: ["foundation", "standard"] },
    })
    expect(errorRefresh).toMatchObject({
      questionCount: 2,
      generation: { difficultyBands: ["standard", "exam"] },
    })
    expect(assessment).toMatchObject({
      questionCount: 6,
      generation: { difficultyBands: Array.from({ length: 6 }, () => "exam") },
    })
    expect([
      placement,
      review,
      prerequisiteRefresh,
      errorRefresh,
      assessment,
    ].every((task) => task.pacing === undefined)).toBe(true)
  })

  it("uses secure placement answers as provisional mastery with an early review", () => {
    const state = createInitialLearner(now)
    const task = buildPlacementTask(state)
    const results = task.topicIds.map((topicId, index): QuestionResult => ({
      questionId: `${task.id}:question:${index}`,
      topicId,
      attempts: 1,
      hintsUsed: 0,
      activeSeconds: 20,
      independentlySolved: index % 2 === 0,
    }))
    const event: LearningEvent = {
      id: "event:placement:first",
      taskId: task.id,
      taskKind: "placement",
      topicIds: task.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 160,
      mistakes: 4,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: results,
    }

    const result = recordCompletion(state, task, event)

    expect(result.award).toMatchObject({
      totalXp: 0,
      reason: "placement-complete",
      countsTowardAssessment: false,
    })
    expect(result.state.totalXp).toBe(0)
    expect(result.state.xpSinceAssessment).toBe(0)
    expect(result.state.placementCompletedAt).toBe(now.toISOString())

    for (const [index, topicId] of task.topicIds.entries()) {
      const mastery = result.state.mastery[topicId]
      if (index % 2 === 0) {
        expect(mastery.status, topicId).toBe("mastered")
        expect(mastery.supportedMastery, topicId).toBe(0.65)
        expect(mastery.independentMastery, topicId).toBe(0.6)
        expect(mastery.retention, topicId).toBe(0.55)
        expect(mastery.independentSuccesses, topicId).toBe(1)
        expect(new Date(mastery.dueAt!).getTime(), topicId).toBe(
          now.getTime() + 24 * 60 * 60 * 1000,
        )
      } else {
        expect(mastery.status, topicId).not.toBe("mastered")
        expect(mastery.dueAt, topicId).toBeUndefined()
      }
    }
  })

  it.each([
    ["accelerated", 0, 33, "lesson-flawless"],
    ["accelerated", 1, 25, "lesson-full"],
    ["steady", 2, 18, "lesson-partial"],
    ["steady", 3, 10, "lesson-partial"],
    ["supported", 4, 0, "lesson-recovery"],
  ] as const)(
    "awards the explicit lesson policy in a %s round with %i mistakes",
    (mode, mistakes, xp, reason) => {
      const state = learnerForPacing(mode)
      const lesson = taskOfKind(state, "lesson")
      const result = recordCompletion(
        state,
        lesson,
        completionWithMissedQuestions(
          lesson,
          `${mode}-${mistakes}`,
          Array.from({ length: mistakes }, (_, index) => index),
        ),
      )

      expect(result.award.totalXp).toBe(xp)
      expect(result.award.reason).toBe(reason)
    },
  )

  it("keeps 25 XP but requires recovery after one miss in a two-question accelerated lesson", () => {
    const state = learnerForPacing("accelerated")
    const lesson = taskOfKind(state, "lesson")
    const topicId = lesson.topicIds[0]!
    const result = recordCompletion(
      state,
      lesson,
      completionWithMissedQuestions(lesson, "accelerated-one-miss", [0]),
    )
    const immediateRecovery = buildAssignments(result.state, now).find(
      (task) => task.purpose === "lesson-recovery" && task.topicIds.includes(topicId),
    )
    const returnAt = new Date(now.getTime() + LIGHT_RECOVERY_BREAK_HOURS * 60 * 60 * 1_000)
    const recovery = buildAssignments(result.state, returnAt).find(
      (task) => task.purpose === "lesson-recovery" && task.topicIds.includes(topicId),
    )

    expect(lesson).toMatchObject({
      questionCount: 2,
      pacing: { mode: "accelerated" },
    })
    expect(result.award).toMatchObject({ totalXp: 25, reason: "lesson-full" })
    expect(result.state.mastery[topicId].status).toBe("learning")
    expect(immediateRecovery).toBeUndefined()
    expect(nextLessonRecoveryAt(result.state, now)).toBe(returnAt.toISOString())
    expect(nextLessonRecoveryAt(result.state, returnAt)).toBeUndefined()
    expect(recovery).toMatchObject({
      kind: "repair",
      purpose: "lesson-recovery",
      questionCount: 2,
      generation: { difficultyBands: ["standard", "exam"] },
      dueAt: returnAt.toISOString(),
    })
    expect(recovery?.pacing).toBeUndefined()
  })

  it("awards zero XP and requires recovery when all four supported questions are missed", () => {
    const state = learnerForPacing("supported")
    const lesson = taskOfKind(state, "lesson")
    const topicId = lesson.topicIds[0]!
    const result = recordCompletion(
      state,
      lesson,
      completionWithMissedQuestions(lesson, "supported-four-misses", [0, 1, 2, 3]),
    )
    const immediateRecovery = buildAssignments(result.state, now).find(
      (task) => task.purpose === "lesson-recovery" && task.topicIds.includes(topicId),
    )
    const returnAt = new Date(now.getTime() + DEEP_RECOVERY_BREAK_HOURS * 60 * 60 * 1_000)
    const recovery = buildAssignments(result.state, returnAt).find(
      (task) => task.purpose === "lesson-recovery" && task.topicIds.includes(topicId),
    )

    expect(lesson).toMatchObject({
      questionCount: 4,
      pacing: { mode: "supported" },
    })
    expect(result.award).toMatchObject({
      baseXp: 0,
      bonusXp: 0,
      totalXp: 0,
      reason: "lesson-recovery",
    })
    expect(result.state.mastery[topicId].status).toBe("learning")
    expect(immediateRecovery).toBeUndefined()
    expect(recovery).toMatchObject({
      kind: "repair",
      purpose: "lesson-recovery",
      generation: { difficultyBands: ["foundation", "standard"] },
      dueAt: returnAt.toISOString(),
    })
  })

  it("awards no lesson XP after more than three mistakes and schedules the topic again", () => {
    const state = createSeededLearner(now)
    const lesson = taskOfKind(state, "lesson")
    const topicId = lesson.topicIds[0]!
    const event = completion(lesson, "four-mistakes", { mistakes: 4 })

    const result = recordCompletion(state, lesson, event)
    const immediateRecovery = buildAssignments(result.state, now).find(
      (task) => task.purpose === "lesson-recovery" && task.topicIds.includes(topicId),
    )
    const returnAt = new Date(now.getTime() + DEEP_RECOVERY_BREAK_HOURS * 60 * 60 * 1_000)
    const recovery = buildAssignments(result.state, returnAt).find(
      (task) => task.purpose === "lesson-recovery" && task.topicIds.includes(topicId),
    )

    expect(result.award).toMatchObject({ baseXp: 0, bonusXp: 0, totalXp: 0 })
    expect(result.state.learningEvents.at(-1)).toEqual(event)
    expect(result.state.mastery[topicId].status).toBe("learning")
    expect(immediateRecovery).toBeUndefined()
    expect(recovery).toMatchObject({ kind: "repair", purpose: "lesson-recovery" })
  })

  it("keeps earned lesson XP while a fresh securing round protects prerequisite unlocking", () => {
    const state = createSeededLearner(now)
    const lesson = taskOfKind(state, "lesson")
    const topicId = lesson.topicIds[0]!
    const dependent = orderedTopics().find((candidate) => (
      candidate.prerequisites.includes(topicId) &&
      candidate.prerequisites.every((prerequisiteId) => (
        prerequisiteId === topicId || state.mastery[prerequisiteId].status === "mastered"
      ))
    ))
    if (!dependent) throw new Error(`Expected a direct dependent for ${topicId}`)

    const introduced = recordCompletion(
      state,
      lesson,
      completion(lesson, "introduced", { mistakes: 2 }),
    )

    expect(introduced.award).toMatchObject({ totalXp: 18, reason: "lesson-partial" })
    expect(introduced.state.mastery[topicId]).toMatchObject({
      status: "learning",
      retention: 0,
      dueAt: undefined,
    })
    expect(introduced.state.mastery[topicId].supportedMastery).toBeGreaterThan(0)
    expect(introduced.state.mastery[topicId].independentMastery).toBeGreaterThan(0)
    expect(introduced.state.mastery[dependent.id].status).toBe("locked")

    const firstReturnAt = new Date(
      now.getTime() + DEEP_RECOVERY_BREAK_HOURS * 60 * 60 * 1_000,
    )
    expect(buildAssignments(introduced.state, now).some(
      (task) => task.purpose === "lesson-recovery",
    )).toBe(false)
    const firstRecovery = buildAssignments(introduced.state, firstReturnAt).find(
      (task) => task.purpose === "lesson-recovery",
    )
    expect(firstRecovery).toMatchObject({
      kind: "repair",
      purpose: "lesson-recovery",
      topicIds: [topicId],
      questionCount: 2,
      generation: { difficultyBands: ["foundation", "standard"] },
      dueAt: firstReturnAt.toISOString(),
    })
    expect(firstRecovery!.maxXp).toBeLessThan(lesson.maxXp)

    const stillLearning = recordCompletion(
      introduced.state,
      firstRecovery!,
      completion(firstRecovery!, "needs-another-round", {
        mistakes: 1,
        at: firstReturnAt.toISOString(),
      }),
    )
    expect(stillLearning.award.totalXp).toBe(firstRecovery!.maxXp)
    expect(stillLearning.state.mastery[topicId].status).toBe("learning")
    expect(stillLearning.state.learningEvents.at(-1)?.taskPurpose).toBe("lesson-recovery")
    expect(stillLearning.state.mastery[dependent.id].status).toBe("locked")

    const secondReturnAt = new Date(
      firstReturnAt.getTime() + LIGHT_RECOVERY_BREAK_HOURS * 60 * 60 * 1_000,
    )
    expect(buildAssignments(stillLearning.state, firstReturnAt).some(
      (task) => task.purpose === "lesson-recovery",
    )).toBe(false)
    const secondRecovery = buildAssignments(stillLearning.state, secondReturnAt).find(
      (task) => task.purpose === "lesson-recovery",
    )
    expect(secondRecovery?.id).not.toBe(firstRecovery!.id)
    expect(secondRecovery?.seed).not.toBe(firstRecovery!.seed)

    const secured = recordCompletion(
      stillLearning.state,
      secondRecovery!,
      completion(secondRecovery!, "secured", { at: secondReturnAt.toISOString() }),
    )
    expect(secured.award.totalXp).toBe(secondRecovery!.maxXp)
    expect(secured.state.mastery[topicId]).toMatchObject({
      status: "mastered",
      retention: 0.65,
      independentSuccesses: 1,
    })
    expect(secured.state.mastery[topicId].dueAt).toBeDefined()
    expect(secured.state.mastery[dependent.id].status).toBe("available")
  })

  it("accepts one supported lesson question as enough evidence for the normal review path", () => {
    const state = createSeededLearner(now)
    const lesson = taskOfKind(state, "lesson")
    const topicId = lesson.topicIds[0]!
    const result = recordCompletion(
      state,
      lesson,
      completion(lesson, "one-supported-question", { mistakes: 1 }),
    )

    expect(result.award).toMatchObject({ totalXp: 25, reason: "lesson-full" })
    expect(result.state.mastery[topicId].status).toBe("mastered")
    expect(result.state.mastery[topicId].dueAt).toBeDefined()
    expect(buildAssignments(result.state, now).some(
      (task) => task.purpose === "lesson-recovery" && task.topicIds.includes(topicId),
    )).toBe(false)
  })

  it("awards every completed scheduled review its smaller fixed XP", () => {
    const state = createSeededLearner(now)
    const review = taskOfKind(state, "review")
    const result = recordCompletion(
      state,
      review,
      completion(review, "difficult", { mistakes: 5, hints: 2 }),
    )

    expect(review.maxXp).toBe(4)
    expect(result.award.totalXp).toBe(review.maxXp)
    expect(result.award.reason).toBe("review-complete")
    expect(result.state.xpSinceAssessment).toBe(review.maxXp)
    expect(new Date(result.state.mastery[review.topicIds[0]!].dueAt!).getTime()).toBeGreaterThan(
      now.getTime(),
    )
  })

  it("counts an assisted lesson question as non-flawless without punishing review XP", () => {
    const state = createSeededLearner(now)
    const lesson = taskOfKind(state, "lesson")
    const assisted = completion(lesson, "hinted", { hints: 1 })
    const result = recordCompletion(state, lesson, assisted)

    expect(result.award.totalXp).toBe(25)
    expect(result.award.reason).toBe("lesson-full")
  })

  it("lets review XP cross the assessment threshold", () => {
    const state = createSeededLearner(now)
    state.totalXp = 146
    state.xpSinceAssessment = 146
    const review = taskOfKind(state, "review")
    const result = recordCompletion(
      state,
      review,
      completion(review, "threshold", { mistakes: 4, hints: 1 }),
    )

    expect(result.state.xpSinceAssessment).toBe(150)
    expect(result.assessmentUnlocked).toBe(true)
    expect(buildAssignments(result.state, now).some((task) => task.kind === "assessment")).toBe(true)
  })

  it("advances the review interval only after independent retrieval", () => {
    const state = createSeededLearner(now)
    const review = taskOfKind(state, "review")
    const previousIndependentMastery = state.mastery[review.topicIds[0]!].independentMastery
    const result = recordCompletion(state, review, completion(review, "independent"))
    const mastery = result.state.mastery[review.topicIds[0]!]
    const expectedDays = REVIEW_INTERVAL_DAYS[1]

    expect(mastery.reviewStage).toBe(1)
    expect(mastery.independentMastery).toBeGreaterThan(previousIndependentMastery)
    expect(new Date(mastery.dueAt!).getTime()).toBe(
      now.getTime() + expectedDays * 24 * 60 * 60 * 1000,
    )
  })

  it("returns a difficult review later with a fresh deterministic seed", () => {
    const state = createSeededLearner(now)
    const review = taskOfKind(state, "review")
    const result = recordCompletion(
      state,
      review,
      completion(review, "needs-more", { mistakes: 2, hints: 1 }),
    )

    expect(buildAssignments(result.state, now).some((task) => task.topicIds[0] === review.topicIds[0])).toBe(false)

    const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000)
    const nextReview = buildAssignments(result.state, fourHoursLater).find(
      (task) => task.kind === "review" && task.topicIds[0] === review.topicIds[0],
    )

    expect(nextReview).toBeDefined()
    expect(nextReview?.id).not.toBe(review.id)
    expect(nextReview?.seed).not.toBe(review.seed)
    expect(nextReview?.maxXp).toBe(review.maxXp)
  })

  it("resurfaces a mastered topic after the maximum inactivity window", () => {
    const state = createSeededLearner(now)
    const topicId: TopicId = "mass-units"
    const lastPracticeAt = new Date(
      now.getTime() - MAX_TOPIC_INACTIVITY_DAYS * 24 * 60 * 60 * 1_000,
    )
    state.mastery[topicId].lastReviewedAt = lastPracticeAt.toISOString()
    state.mastery[topicId].masteredAt = lastPracticeAt.toISOString()
    state.mastery[topicId].dueAt = new Date(
      now.getTime() + 40 * 24 * 60 * 60 * 1_000,
    ).toISOString()

    const assignments = buildAssignments(state, now)
    const refresh = assignments.find((task) => (
      task.kind === "review" && task.topicIds[0] === topicId
    ))

    expect(refresh).toMatchObject({
      kind: "review",
      topicIds: [topicId],
      dueAt: now.toISOString(),
    })
    expect(refresh?.description).toContain("längerer Pause")
    expect(assignments[0]?.id).toBe(refresh?.id)
    expect(nextReviewAt(state)).toBe(now.toISOString())
  })

  it("uses recent mixed practice to postpone the inactivity refresh", () => {
    const state = createSeededLearner(now)
    const topicId: TopicId = "mass-units"
    const recentPracticeAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1_000)
    state.mastery[topicId].lastReviewedAt = new Date(
      now.getTime() - 45 * 24 * 60 * 60 * 1_000,
    ).toISOString()
    state.mastery[topicId].dueAt = new Date(
      now.getTime() + 40 * 24 * 60 * 60 * 1_000,
    ).toISOString()
    state.mastery["fraction-of-quantity"].lastReviewedAt = now.toISOString()
    state.mastery["fraction-of-quantity"].dueAt = new Date(
      now.getTime() + 40 * 24 * 60 * 60 * 1_000,
    ).toISOString()
    state.learningEvents.push({
      id: "event:recent-mixed-practice",
      taskId: "assessment:recent-mixed-practice",
      taskKind: "assessment",
      topicIds: [topicId],
      completedAt: recentPracticeAt.toISOString(),
      activeSeconds: 60,
      mistakes: 0,
      hintsUsed: 0,
      independentlyCompleted: true,
      questionResults: [{
        questionId: "assessment:recent-mixed-practice:question:0",
        topicId,
        attempts: 1,
        hintsUsed: 0,
        activeSeconds: 60,
        independentlySolved: true,
      }],
    })

    expect(buildAssignments(state, now).some((task) => (
      task.kind === "review" && task.topicIds[0] === topicId
    ))).toBe(false)
    expect(nextReviewAt(state)).toBe(
      new Date(
        recentPracticeAt.getTime() + MAX_TOPIC_INACTIVITY_DAYS * 24 * 60 * 60 * 1_000,
      ).toISOString(),
    )
  })

  it("uses a recently attempted generated mock to postpone the inactivity refresh", () => {
    const state = createSeededLearner(now)
    const topicId: TopicId = "mass-units"
    const recentPracticeAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1_000)
    state.mastery[topicId].lastReviewedAt = new Date(
      now.getTime() - 45 * 24 * 60 * 60 * 1_000,
    ).toISOString()
    state.mastery[topicId].dueAt = new Date(
      now.getTime() + 40 * 24 * 60 * 60 * 1_000,
    ).toISOString()
    state.mastery["fraction-of-quantity"].lastReviewedAt = now.toISOString()
    state.mastery["fraction-of-quantity"].dueAt = new Date(
      now.getTime() + 40 * 24 * 60 * 60 * 1_000,
    ).toISOString()
    state.mockHistory.push({
      id: "result:recent-generated-mock",
      source: "generated",
      seed: "recent-generated-mock",
      blueprintVersion: 6,
      startedAt: new Date(recentPracticeAt.getTime() - 60 * 60 * 1_000).toISOString(),
      submittedAt: recentPracticeAt.toISOString(),
      submissionReason: "submitted",
      durationSeconds: 3_600,
      maxPoints: 4,
      certainPoints: 4,
      reviewablePoints: 0,
      recoveryTopicIds: [],
      taskResults: [{
        taskId: "recent-generated-mock:task:1",
        taskNumber: 1,
        title: "Mass units",
        maxPoints: 4,
        certainPoints: 4,
        reviewablePoints: 0,
        activeSeconds: 120,
        visitCount: 1,
        flagged: false,
        parts: [{
          partId: "recent-generated-mock:task:1:part:1",
          taskId: "recent-generated-mock:task:1",
          topicId,
          answer: "2.5",
          working: "",
          answerCorrect: true,
          methodRequired: false,
          maxPoints: 4,
          certainPoints: 4,
          reviewablePoints: 0,
          confidence: "certain",
        }],
      }],
    })

    expect(buildAssignments(state, now).some((task) => (
      task.kind === "review" && task.topicIds[0] === topicId
    ))).toBe(false)
    expect(nextReviewAt(state)).toBe(
      new Date(
        recentPracticeAt.getTime() + MAX_TOPIC_INACTIVITY_DAYS * 24 * 60 * 60 * 1_000,
      ).toISOString(),
    )
  })

  it("unlocks an assessment at the threshold and preserves overflow afterward", () => {
    const state = createSeededLearner(now)
    state.xpSinceAssessment = state.assessmentThreshold + 7
    state.totalXp = state.xpSinceAssessment
    const assessment = taskOfKind(state, "assessment")
    const result = recordCompletion(state, assessment, completion(assessment, "complete"))

    expect(result.award.countsTowardAssessment).toBe(false)
    expect(result.state.xpSinceAssessment).toBe(7)
    expect(result.state.assessmentNumber).toBe(2)
  })

  it("makes the unlocked assessment the sole cadence task", () => {
    const state = createSeededLearner(now)
    state.xpSinceAssessment = state.assessmentThreshold

    const tasks = buildAssignments(state, now)
    expect(tasks).toHaveLength(1)
    expect(tasks[0]!.kind).toBe("assessment")
  })

  it("rotates broad assessments through at most nine mastered topics", () => {
    const state = createSeededLearner(now)
    for (const mastery of Object.values(state.mastery)) mastery.status = "mastered"
    state.xpSinceAssessment = state.assessmentThreshold

    const first = buildAssignments(state, now)[0]!
    state.assessmentNumber = 2
    const second = buildAssignments(state, now)[0]!

    expect(first.kind).toBe("assessment")
    expect(first.topicIds).toHaveLength(9)
    expect(second.topicIds).toHaveLength(9)
    expect(second.topicIds).not.toEqual(first.topicIds)
  })

  it("covers every mastered topic across the first three periodic assessments", () => {
    let state = createSeededLearner(now)
    for (const mastery of Object.values(state.mastery)) {
      mastery.status = "mastered"
      mastery.retention = 0.8
      mastery.dueAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }

    const sampled: TopicId[] = []
    const rounds: TopicId[][] = []
    for (let index = 0; index < 3; index += 1) {
      state.xpSinceAssessment = state.assessmentThreshold
      const task = buildAssignments(state, now)[0]!
      expect(task.kind).toBe("assessment")
      rounds.push(task.topicIds)
      sampled.push(...task.topicIds)
      state = recordCompletion(
        state,
        task,
        completion(task, `coverage-${index}`),
      ).state
    }

    expect(new Set(rounds[0]).size).toBe(9)
    expect(rounds[1]!.every((topicId) => !rounds[0]!.includes(topicId))).toBe(true)
    expect(new Set(sampled)).toEqual(new Set(topicIds))
  })

  it("keeps fragile topics in the assessment mix after broad coverage", () => {
    const state = createSeededLearner(now)
    for (const mastery of Object.values(state.mastery)) {
      mastery.status = "mastered"
      mastery.retention = 0.9
      mastery.independentSuccesses = 4
      mastery.reviewStage = 3
    }
    state.learningEvents.push({
      id: "event:assessment:historic-coverage",
      taskId: "assessment:historic-coverage",
      taskKind: "assessment",
      topicIds: [...topicIds],
      completedAt: "2026-06-14T10:00:00.000Z",
      activeSeconds: 900,
      mistakes: 0,
      hintsUsed: 0,
      independentlyCompleted: true,
      questionResults: topicIds.map((topicId, index) => ({
        questionId: `historic:${index}`,
        topicId,
        attempts: 1,
        hintsUsed: 0,
        activeSeconds: 30,
        independentlySolved: true,
      })),
    })
    state.mastery["cuboid-surface"].retention = 0.25
    state.mastery["cuboid-surface"].independentSuccesses = 1
    state.mastery["cuboid-surface"].reviewStage = 0
    state.assessmentNumber = 4

    expect(selectAssessmentTopicIds(state)).toContain("cuboid-surface")
  })

  it("turns missed assessment topics into immediate fresh reviews", () => {
    const state = createSeededLearner(now)
    state.xpSinceAssessment = state.assessmentThreshold
    const assessment = taskOfKind(state, "assessment")
    const event = completion(assessment, "gap", { mistakes: 1 })
    const missedTopic = event.questionResults[0]!.topicId
    const previousIteration = state.mastery[missedTopic].reviewIteration
    const previousIndependentMastery = state.mastery[missedTopic].independentMastery
    const result = recordCompletion(state, assessment, event)
    const reviews = buildAssignments(result.state, now).filter(
      (assignment) => assignment.kind === "review" && assignment.topicIds.includes(missedTopic),
    )

    expect(result.state.mastery[missedTopic].reviewIteration).toBe(previousIteration + 1)
    expect(result.state.mastery[missedTopic].independentMastery).not.toBe(previousIndependentMastery)
    expect(reviews).toHaveLength(1)
  })

  it("becomes reviews and assessments only after every lesson is mastered", () => {
    const state = createSeededLearner(now)
    for (const mastery of Object.values(state.mastery)) {
      mastery.status = "mastered"
      mastery.dueAt = now.toISOString()
    }

    const tasks = buildAssignments(state, now)
    expect(isCurriculumMastered(state)).toBe(true)
    expect(tasks.some((task) => task.kind === "lesson")).toBe(false)
    expect(tasks.every((task) => task.kind === "review")).toBe(true)
  })

  it("keeps a fully mastered learner in the review-assessment-review cadence", () => {
    const state = createSeededLearner(now)
    for (const mastery of Object.values(state.mastery)) {
      mastery.status = "mastered"
      mastery.dueAt = now.toISOString()
    }

    const initialTasks = buildAssignments(state, now)
    const review = initialTasks[0]!
    expect(initialTasks).toHaveLength(topicIds.length)
    expect(initialTasks.every((task) => task.kind === "review")).toBe(true)

    state.xpSinceAssessment = state.assessmentThreshold - review.maxXp
    state.totalXp = state.xpSinceAssessment
    const afterDifficultReview = recordCompletion(
      state,
      review,
      completion(review, "endgame-review", { mistakes: 7, hints: 3 }),
    )

    expect(afterDifficultReview.award.totalXp).toBe(review.maxXp)
    expect(buildAssignments(afterDifficultReview.state, now).map((task) => task.kind)).toEqual([
      "assessment",
    ])

    const assessment = buildAssignments(afterDifficultReview.state, now)[0]!
    const afterAssessment = recordCompletion(
      afterDifficultReview.state,
      assessment,
      completion(assessment, "endgame-assessment"),
    )
    const resumedTasks = buildAssignments(afterAssessment.state, now)

    expect(afterAssessment.state.assessmentNumber).toBe(2)
    expect(resumedTasks.length).toBeGreaterThan(0)
    expect(resumedTasks.every((task) => task.kind === "review")).toBe(true)
    expect(resumedTasks.some((task) => task.kind === "lesson")).toBe(false)

    afterAssessment.state.xpSinceAssessment = afterAssessment.state.assessmentThreshold
    const nextAssessment = buildAssignments(afterAssessment.state, now)
    expect(nextAssessment).toHaveLength(1)
    expect(nextAssessment[0]).toMatchObject({ id: "assessment:2", kind: "assessment" })
  })

  it("lets the learner choose any prerequisite-ready lesson from the curriculum", () => {
    const state = createSeededLearner(now)

    const moneyLesson = buildTopicLesson(state, "money-calculations")
    expect(moneyLesson.kind).toBe("lesson")
    expect(moneyLesson.topicIds).toEqual(["money-calculations"])

    expect(() => buildTopicLesson(state, "tiling-costs")).toThrow(/not currently available/)
    expect(() => buildTopicLesson(state, "mass-units")).toThrow(/not currently available/)
  })

  it("keeps a due assessment ahead of optional curriculum lessons", () => {
    const state = createSeededLearner(now)
    state.xpSinceAssessment = state.assessmentThreshold

    expect(() => buildTopicLesson(state, "money-calculations")).toThrow(/current assessment/)
  })

  it("builds a fresh targeted error refresh with the topic's smaller fixed XP", () => {
    const state = createSeededLearner(now)
    const refresh = buildErrorRefresh(state, "mass-units")
    const result = recordCompletion(
      state,
      refresh,
      completion(refresh, "difficult", { mistakes: 5, hints: 2 }),
    )
    const next = buildErrorRefresh(result.state, "mass-units")

    expect(refresh).toMatchObject({
      kind: "repair",
      title: "Mit neuen Zahlen: kg und g",
      maxXp: 4,
      questionCount: 2,
    })
    expect(result.award).toMatchObject({ totalXp: 4, reason: "repair-complete" })
    expect(next.id).not.toBe(refresh.id)
    expect(next.seed).not.toBe(refresh.seed)
  })

  it("does not let optional error practice bypass a pending assessment", () => {
    const state = createSeededLearner(now)
    state.xpSinceAssessment = state.assessmentThreshold

    expect(() => buildErrorRefresh(state, "mass-units")).toThrow(/current assessment/)
  })

  it("pauses one exact topic without changing XP or mastery evidence", () => {
    const state = createSeededLearner(now)
    state.mastery["fraction-of-quantity"].dueAt = "2026-07-16T10:00:00.000Z"
    const originalXp = state.totalXp
    const originalMastery = structuredClone(state.mastery)
    const requestedAt = new Date("2026-07-14T10:05:00.000Z")

    const paused = requestTeacherSupport(state, "mass-units", requestedAt)

    expect(paused).not.toBe(state)
    expect(topicNeedsTeacherSupport(paused, "mass-units")).toBe(true)
    expect(paused.topicHelpRequests).toEqual([{
      topicId: "mass-units",
      requestedAt: requestedAt.toISOString(),
    }])
    expect(paused.totalXp).toBe(originalXp)
    expect(paused.mastery).toEqual(originalMastery)
    expect(buildAssignments(paused, now).flatMap((task) => task.topicIds)).not.toContain("mass-units")
    expect(nextReviewAt(paused)).toBe("2026-07-16T10:00:00.000Z")
    expect(() => buildTopicLesson(paused, "mass-units")).toThrow(/paused for teacher support/)
    expect(() => buildPrerequisiteRefresh(paused, "mass-units")).toThrow(/paused for teacher support/)
    expect(() => buildErrorRefresh(paused, "mass-units")).toThrow(/paused for teacher support/)

    paused.xpSinceAssessment = paused.assessmentThreshold
    expect(selectAssessmentTopicIds(paused)).not.toContain("mass-units")
    expect(buildAssignments(paused, now)[0]?.topicIds).not.toContain("mass-units")
    expect(requestTeacherSupport(paused, "mass-units", now)).toBe(paused)

    const reopened = resolveTeacherSupport(paused, "mass-units", new Date("2026-07-14T10:10:00.000Z"))
    expect(topicNeedsTeacherSupport(reopened, "mass-units")).toBe(false)
    expect(reopened.topicHelpRequests).toEqual([])
    expect(selectAssessmentTopicIds(reopened)).toContain("mass-units")
    expect(reopened.totalXp).toBe(originalXp)
    expect(reopened.mastery).toEqual(originalMastery)
    expect(resolveTeacherSupport(reopened, "mass-units", now)).toBe(reopened)
  })

  it("moves to another available lesson while a new topic waits for an explanation", () => {
    const learner = completePlacementWithoutCheck(createInitialLearner(now), now)
    const firstLesson = buildAssignments(learner, now).find((task) => task.kind === "lesson")
    if (!firstLesson) throw new Error("Expected an available lesson")

    const paused = requestTeacherSupport(learner, firstLesson.topicIds[0]!, now)
    const replacement = buildAssignments(paused, now).find((task) => task.kind === "lesson")

    expect(replacement).toBeDefined()
    expect(replacement?.topicIds).not.toEqual(firstLesson.topicIds)
  })

  it("is idempotent for the same completion event", () => {
    const state = createSeededLearner(now)
    const review = taskOfKind(state, "review")
    const event = completion(review, "once")
    const first = recordCompletion(state, review, event)
    const second = recordCompletion(first.state, review, event)

    expect(second.state.totalXp).toBe(first.state.totalXp)
    expect(second.state.xpLedger).toHaveLength(1)
  })

  it("rejects completion evidence from a task belonging to another package", () => {
    const state = createSeededLearner(now)
    const review = taskOfKind(state, "review")
    const unsupported = {
      ...review,
      curriculum: { courseId: state.courseId, version: 99 },
    }
    const before = structuredClone(state)

    expect(() => recordCompletion(
      state,
      unsupported,
      completion(unsupported, "foreign-package"),
    )).toThrow("task curriculum")
    expect(state).toEqual(before)
  })

  it("migrates the original four-topic local profile without losing progress", () => {
    const legacy = createSeededLearner(now)
    ;(legacy as unknown as { schemaVersion: number }).schemaVersion = 2
    delete (legacy as unknown as { courseVersion?: number }).courseVersion
    delete legacy.placementCompletedAt
    const preservedXp = 73
    legacy.totalXp = preservedXp
    legacy.xpSinceAssessment = preservedXp
    const partialMastery = legacy.mastery as Partial<typeof legacy.mastery>

    for (const topicId of Object.keys(partialMastery)) {
      if (!["mass-units", "fraction-of-quantity", "reverse-fractions", "reverse-chains"].includes(topicId)) {
        delete partialMastery[topicId as keyof typeof partialMastery]
      }
    }

    const migrated = migrateLearnerState(legacy)
    expect(Object.keys(migrated.mastery)).toHaveLength(topicIds.length)
    expect(migrated.totalXp).toBe(preservedXp)
    expect(migrated.mastery["mass-units"].status).toBe("mastered")
    expect(migrated.placementCompletedAt).toBe(legacy.createdAt)
    expect(migrated.schemaVersion).toBe(12)
    expect(migrated.courseId).toBe("zh-zap1-math")
    expect(migrated.courseVersion).toBe(1)
    expect(migrated.learnerFeedback).toEqual([])
    expect(migrated.topicHelpRequests).toEqual([])
    expect(migrated.mastery["mass-units"]).toMatchObject({
      supportedMastery: 0.78,
      independentMastery: 0.64,
    })
    expect(migrated.profileCompletedAt).toBe(legacy.createdAt)
    expect(migrated.preferences.sessionMinutes).toBe(15)
    expect(migrated.mockHistory).toEqual([])
  })

  it("rejects an unknown curriculum package instead of silently treating it as Zurich", () => {
    const unsupported = structuredClone(createSeededLearner(now))
    unsupported.courseVersion = 99

    expect(() => migrateLearnerState(unsupported)).toThrowError(
      UnsupportedCurriculumPackageError,
    )
    expect(unsupported.courseVersion).toBe(99)
  })
})
