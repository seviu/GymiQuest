import { describe, expect, it } from "vitest"
import {
  buildAssignments,
  buildPrerequisiteRefresh,
  createSeededLearner,
  migrateLearnerState,
  requestTeacherSupport,
} from "../domain/learningEngine"
import {
  completeArchivePractice,
  createActiveArchivePractice,
  submitArchivePracticeForReview,
} from "../domain/archivePractice"
import type { LearnerState, LearningTask } from "../domain/model"
import { generateQuestionsForTask } from "../domain/generators"
import {
  createActiveLearningSession,
  createPrerequisiteDetourSession,
  isResumableSession,
} from "../domain/session"
import {
  FULL_MOCK_DURATION_SECONDS,
  LEGACY_MOCK_BLUEPRINT_VERSION,
  MOCK_BLUEPRINT_VERSION,
  createActiveMockExam,
  gradeMockExam,
} from "../domain/mockExam"
import {
  officialExamDefinition,
} from "../domain/officialExams"
import { createLearnerCourseIndex, touchCourse } from "../domain/courseIndex"
import {
  advanceGermanSession,
  answerCurrentGermanQuestion,
  buildGermanAssignments,
  completeGermanComprehensionPractice,
  completeGermanWritingPractice,
  completeGermanWritingRevision,
  createInitialGermanCourseState,
  currentGermanQuestion,
  resolveGermanComprehensionHumanReview,
  saveGermanComprehensionHumanReview,
  startGermanComprehensionPractice,
  startGermanSession,
  startGermanWritingPractice,
  startGermanWritingRevision,
  saveGermanWritingHumanReview,
  updateGermanWritingPractice,
  updateGermanWritingRevision,
  updateGermanComprehensionPractice,
} from "../subjects/german/courseState"
import {
  answerGermanExamQuestion,
  buildGermanExamBlueprint,
  createActiveGermanExam,
  gradeGermanExam,
} from "../subjects/german/exam"
import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
} from "../subjects/german/generators"
import {
  buildGermanWritingForm,
  chooseGermanWritingPrompt,
  submitGermanWritingSession,
  updateGermanWritingDraft,
} from "../subjects/german/writing"
import {
  completeGermanSourcePractice,
  createActiveGermanSourcePractice,
  createGermanSourcePracticeState,
  setGermanSourceLanguageReview,
  submitGermanSourcePractice,
  updateGermanSourceWriting,
} from "../subjects/german/sourcePractice"
import {
  germanComprehensionPassage,
  submitGermanComprehensionSession,
  updateGermanComprehensionSession,
} from "../subjects/german/comprehension"
import {
  saveGermanWritingRevisionSnapshot,
  updateActiveGermanWritingRevision,
} from "../subjects/german/writingRevision"
import {
  BackupError,
  backupFilename,
  createEncryptedBackup,
  openEncryptedBackup,
} from "./backup"

const now = new Date("2026-07-14T12:00:00.000Z")
const password = "Lernen-bleibt-2026"
const fullOfficialTaskScores = [4, 4, 4, 4, 4, 4, 4, 4, 4] as const
const officialReplayBackupCases = [
  ["zap-zh-lg-2015", undefined, undefined],
  ["zap-zh-lg-2023", undefined, undefined],
  ["zap-zh-lg-2024", "zap-lg-2024-math-2024-03-15", 6],
  ["zap-zh-lg-2025", "zap-lg-2025-math-2025-03-14", 6],
] as const

describe("encrypted learner backup", () => {
  it("round-trips learner history and a paused active session", async () => {
    let learner = createSeededLearner(now)
    learner = requestTeacherSupport(
      learner,
      "mass-units",
      new Date("2026-07-14T12:02:00.000Z"),
    )
    learner.totalXp = 87
    learner.preferences = {
      examDate: "2027-03-08",
      practiceDays: ["monday", "wednesday", "saturday"],
      sessionMinutes: 20,
      helpStyle: "step-by-step",
      visualMode: "focus",
      readingMode: "spacious",
      geometryControlSide: "left",
    }
    learner.mastery["arithmetic-equations"].status = "learning"
    learner.mastery["arithmetic-equations"].supportedMastery = 0.61
    learner.mastery["arithmetic-equations"].independentMastery = 0.4
    const task = buildAssignments(learner, now)[0]!
    expect(task.purpose).toBe("lesson-recovery")
    task.contentLocale = "it"
    learner.learningEvents.push({
      id: "event:error-evidence",
      taskId: "review:mass-units:error-evidence",
      taskKind: "review",
      topicIds: ["mass-units"],
      completedAt: now.toISOString(),
      activeSeconds: 45,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: [{
        questionId: "error-evidence:question",
        topicId: "mass-units",
        attempts: 2,
        hintsUsed: 0,
        activeSeconds: 45,
        independentlySolved: false,
        solved: true,
        submittedAnswer: "1250",
        verifiedStepIds: ["convert-to-grams"],
        difficultyBand: "exam",
        diagnostic: {
          kind: "unit-conversion",
          title: "Die 1000er-Richtung ist vertauscht.",
          resolved: true,
        },
      }],
    })
    learner.learnerFeedback.push({
      id: "feedback:event:error-evidence",
      learningEventId: "event:error-evidence",
      taskId: "review:mass-units:error-evidence",
      taskKind: "review",
      topicIds: ["mass-units"],
      kind: "explanation-unclear",
      recordedAt: "2026-07-14T12:01:00.000Z",
    })
    const session = createActiveLearningSession(task, now)
    session.activeSeconds = 91
    session.timerPaused = true
    session.question.answer = "42"
    session.question.verifiedPracticeSteps = ["jars", "before-cooking"]
    session.question.activeHelp = ["concept"]
    session.question.firstDiagnostic = {
      kind: "stopped-early",
      title: "Der richtige Zwischenwert war noch nicht die Endantwort.",
    }
    session.question.conceptRepair = {
      version: 5,
      seed: `${task.seed}:question:0:concept-repair`,
      stage: "check",
      teachBack: "Ich rechne zuerst mit der Gegenoperation.",
      answer: "18",
      attempts: 1,
      feedback: "wrong",
    }
    const completedMock = createActiveMockExam(
      "backup:completed",
      now,
      FULL_MOCK_DURATION_SECONDS,
      LEGACY_MOCK_BLUEPRINT_VERSION,
      "it",
    )
    learner.mockHistory.push(
      gradeMockExam(completedMock, "submitted", new Date("2026-07-14T12:30:00.000Z")),
    )
    const activeMock = createActiveMockExam(
      "backup:active",
      new Date("2026-07-14T13:00:00.000Z"),
      FULL_MOCK_DURATION_SECONDS,
      MOCK_BLUEPRINT_VERSION,
      "it",
    )
    activeMock.progress[0]!.parts[0]!.answer = "42"

    const serialized = await createEncryptedBackup(learner, session, password, now, activeMock)
    const restored = await openEncryptedBackup(serialized, password)

    expect(serialized).not.toContain(learner.learnerId)
    expect(serialized).not.toContain(task.title)
    expect(restored.createdAt).toBe(now.toISOString())
    expect(restored.learner).toEqual(learner)
    expect(restored.activeSession).toEqual(session)
    expect(restored.learner.learningEvents[0]!.questionResults[0]!.diagnostic).toMatchObject({
      kind: "unit-conversion",
      resolved: true,
    })
    expect(restored.activeSession?.question.firstDiagnostic?.kind).toBe("stopped-early")
    expect(restored.activeSession?.task.purpose).toBe("lesson-recovery")
    expect(restored.activeSession?.task.curriculum).toEqual({
      courseId: "zh-zap1-math",
      version: 1,
    })
    expect(restored.activeSession?.timerPaused).toBe(true)
    expect(restored.activeSession?.task.contentLocale).toBe("it")
    expect(restored.learner.learningEvents[0]!.questionResults[0]!.difficultyBand).toBe("exam")
    expect(restored.learner.learningEvents[0]!.questionResults[0]).toMatchObject({
      solved: true,
      submittedAnswer: "1250",
      verifiedStepIds: ["convert-to-grams"],
    })
    expect(restored.learner.learnerFeedback[0]).toMatchObject({
      learningEventId: "event:error-evidence",
      kind: "explanation-unclear",
    })
    expect(restored.learner.topicHelpRequests).toEqual(learner.topicHelpRequests)
    expect(restored.learner.courseId).toBe("zh-zap1-math")
    expect(restored.learner.courseVersion).toBe(1)
    expect(restored.activeMock).toEqual(activeMock)
    expect(restored.activeMock?.contentLocale).toBe("it")
    expect(restored.learner.mockHistory).toEqual(learner.mockHistory)
    expect(restored.version).toBe(6)
  })

  it("preserves a prerequisite detour and its exact source session", async () => {
    const learner = createSeededLearner(now)
    const source = createActiveLearningSession(buildAssignments(learner, now)[0]!, now)
    source.activeSeconds = 83
    source.question.answer = "gespeicherter Entwurf"
    source.question.submissions = 1
    source.question.mistakes = 1
    source.question.activeHelp = ["prerequisites"]
    const detour = createPrerequisiteDetourSession(
      buildPrerequisiteRefresh(learner, "mass-units"),
      source,
      new Date("2026-07-14T12:03:00.000Z"),
    )
    detour.activeSeconds = 19
    detour.question.answer = "1000"

    const serialized = await createEncryptedBackup(learner, detour, password, now)
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.activeSession).toEqual(detour)
    expect(restored.activeSession?.prerequisiteDetour?.origin).toEqual(source)
    expect(isResumableSession(restored.activeSession, learner)).toBe(true)
  })

  it("preserves Spanish on active learning and mock-exam work", async () => {
    const learner = createSeededLearner(now)
    const task = { ...buildAssignments(learner, now)[0]!, contentLocale: "es" as const }
    const session = createActiveLearningSession(task, now)
    const activeMock = createActiveMockExam(
      "backup:spanish",
      now,
      FULL_MOCK_DURATION_SECONDS,
      MOCK_BLUEPRINT_VERSION,
      "es",
    )

    const serialized = await createEncryptedBackup(learner, session, password, now, activeMock)
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.activeSession?.task.contentLocale).toBe("es")
    expect(restored.activeMock?.contentLocale).toBe("es")
  })

  it("rejects a backup for an unknown curriculum package with a distinct error", async () => {
    const unknownVersion = createSeededLearner(now)
    unknownVersion.courseVersion = 99
    const versionBackup = await createEncryptedBackup(
      unknownVersion,
      undefined,
      password,
      now,
    )

    await expect(openEncryptedBackup(versionBackup, password)).rejects.toMatchObject({
      code: "unsupported-curriculum",
      message: expect.stringContaining("zh-zap1-math"),
    })

    const unknownCourse = createSeededLearner(now)
    unknownCourse.courseId = "world-generic-math"
    const courseBackup = await createEncryptedBackup(
      unknownCourse,
      undefined,
      password,
      now,
    )

    await expect(openEncryptedBackup(courseBackup, password)).rejects.toMatchObject({
      code: "unsupported-curriculum",
      message: expect.stringContaining("world-generic-math"),
    })
  })

  it("rejects an active task from an unknown curriculum package", async () => {
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now)[0]!
    const session = createActiveLearningSession(task, now)
    session.task.curriculum = {
      courseId: "zh-zap1-math",
      version: 99,
    }
    const serialized = await createEncryptedBackup(
      learner,
      session,
      password,
      now,
    )

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "unsupported-curriculum",
      message: expect.stringContaining("pausierte Aufgabe"),
    })
  })

  it("accepts a version-four learner backup and lets migration add preference defaults", async () => {
    const learner = createSeededLearner(now)
    learner.totalXp = 64
    const legacy = structuredClone(learner) as unknown as {
      schemaVersion: number
      preferences?: unknown
      profileCompletedAt?: string
      learnerFeedback?: unknown
      courseVersion?: number
    }
    legacy.schemaVersion = 4
    delete legacy.courseVersion
    delete legacy.preferences
    delete legacy.profileCompletedAt
    delete legacy.learnerFeedback

    const serialized = await createEncryptedBackup(
      legacy as unknown as LearnerState,
      undefined,
      password,
      now,
    )
    const restored = await openEncryptedBackup(serialized, password)
    const migrated = migrateLearnerState(restored.learner)

    expect(migrated.schemaVersion).toBe(12)
    expect(migrated.courseVersion).toBe(1)
    expect(migrated.totalXp).toBe(64)
    expect(migrated.preferences).toMatchObject({
      practiceDays: ["tuesday", "thursday", "saturday"],
      sessionMinutes: 15,
      helpStyle: "visual",
      visualMode: "calm",
      readingMode: "standard",
      geometryControlSide: "right",
    })
    expect(migrated.profileCompletedAt).toBe(learner.createdAt)
    expect(migrated.learnerFeedback).toEqual([])
    expect(migrated.topicHelpRequests).toEqual([])
  })

  it("accepts a version-ten backup and migrates the new accessibility preferences", async () => {
    const legacy = structuredClone(createSeededLearner(now)) as unknown as {
      schemaVersion: number
      preferences: Record<string, unknown>
    }
    legacy.schemaVersion = 10
    delete legacy.preferences.readingMode
    delete legacy.preferences.geometryControlSide

    const serialized = await createEncryptedBackup(
      legacy as unknown as LearnerState,
      undefined,
      password,
      now,
    )
    const restored = await openEncryptedBackup(serialized, password)
    const migrated = migrateLearnerState(restored.learner)

    expect(restored.learner.schemaVersion).toBe(10)
    expect(migrated.schemaVersion).toBe(12)
    expect(migrated.preferences).toMatchObject({
      readingMode: "standard",
      geometryControlSide: "right",
    })
  })

  it("keeps a paused legacy generation-v2 task without pacing replayable", async () => {
    const learner = createSeededLearner(now)
    const currentTask = buildAssignments(learner, now)[0]!
    if (!currentTask.generation) throw new Error("Expected a versioned task")
    const versionTwoTask = {
      ...currentTask,
      generation: { ...currentTask.generation, version: 2 as const },
    }
    delete (versionTwoTask as { curriculum?: unknown }).curriculum
    delete (versionTwoTask as { pacing?: unknown }).pacing
    const session = createActiveLearningSession(versionTwoTask, now)
    session.activeSeconds = 17
    session.question.answer = "alter Entwurf"

    const serialized = await createEncryptedBackup(learner, session, password, now)
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.activeSession?.task.generation?.version).toBe(2)
    expect(restored.activeSession?.task.curriculum).toBeUndefined()
    expect(restored.activeSession?.task.pacing).toBeUndefined()
    expect(isResumableSession(restored.activeSession, learner)).toBe(true)
    expect(restored.activeSession?.question.answer).toBe("alter Entwurf")
  })

  it("accepts and restores the current generation-v6 task contract", async () => {
    const learner = createSeededLearner(now)
    const currentTask = buildAssignments(learner, now)[0]!
    expect(currentTask.generation?.version).toBe(6)
    const session = createActiveLearningSession(currentTask, now)

    const serialized = await createEncryptedBackup(learner, session, password, now)
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.activeSession?.task.generation?.version).toBe(6)
    expect(restored.activeSession?.task.pacing).toEqual({
      version: 1,
      mode: "steady",
    })
    expect(restored.activeSession?.task).toEqual(currentTask)
    expect(isResumableSession(restored.activeSession, learner)).toBe(true)
  })

  it("round-trips the realized difficulty path of a paused paced lesson", async () => {
    const learner = createSeededLearner(now)
    const task = structuredClone(buildAssignments(learner, now)[0]!)
    if (!task.generation || !task.pacing) throw new Error("Expected a paced lesson")
    const firstQuestion = generateQuestionsForTask(task)[0]!
    task.generation.difficultyBands = ["foundation", "foundation", "exam"]
    const expectedNextQuestion = generateQuestionsForTask(task)[1]!
    const session = createActiveLearningSession(task, now)
    session.phase = "questions"
    session.question.questionIndex = 1
    session.question.results = [{
      questionId: firstQuestion.id,
      topicId: firstQuestion.topicId,
      attempts: 2,
      hintsUsed: 0,
      activeSeconds: 31,
      independentlySolved: false,
      solved: true,
      difficultyBand: "foundation",
    }]

    const serialized = await createEncryptedBackup(learner, session, password, now)
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.activeSession?.task.pacing).toEqual(task.pacing)
    expect(restored.activeSession?.task.generation?.difficultyBands).toEqual([
      "foundation",
      "foundation",
      "exam",
    ])
    expect(restored.activeSession?.question.results).toEqual(session.question.results)
    expect(generateQuestionsForTask(restored.activeSession!.task)[1]).toEqual(
      expectedNextQuestion,
    )
  })

  it.each([
    [
      "an unknown pacing mode",
      (task: LearningTask) => {
        const pacing = task.pacing as { mode: string }
        pacing.mode = "invented"
      },
    ],
    [
      "a question count that does not belong to the pacing mode",
      (task: LearningTask) => {
        task.pacing = { version: 1, mode: "accelerated" }
      },
    ],
    [
      "pacing attached to a non-lesson task",
      (task: LearningTask) => {
        task.kind = "review"
      },
    ],
    [
      "a malformed realized generation path",
      (task: LearningTask) => {
        if (!task.generation) throw new Error("Expected generation metadata")
        task.generation.difficultyBands = ["foundation", "standard"]
      },
    ],
    [
      "no realized generation path",
      (task: LearningTask) => {
        task.generation = undefined
      },
    ],
  ] as const)("rejects an active task with %s", async (_label, mutateTask) => {
    const learner = createSeededLearner(now)
    const task = structuredClone(buildAssignments(learner, now)[0]!)
    if (!task.pacing) throw new Error("Expected a paced lesson")
    mutateTask(task)
    const serialized = await createEncryptedBackup(
      learner,
      createActiveLearningSession(task, now),
      password,
      now,
    )

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects paced progress whose result count or realized path is incoherent", async () => {
    const learner = createSeededLearner(now)
    const task = structuredClone(buildAssignments(learner, now)[0]!)
    if (!task.generation || !task.pacing) throw new Error("Expected a paced lesson")

    const missingResultSession = createActiveLearningSession(task, now)
    missingResultSession.phase = "questions"
    missingResultSession.question.questionIndex = 1
    const missingResultBackup = await createEncryptedBackup(
      learner,
      missingResultSession,
      password,
      now,
    )
    await expect(openEncryptedBackup(missingResultBackup, password)).rejects.toMatchObject({
      code: "invalid-format",
    })

    const impossiblePathTask = structuredClone(task)
    impossiblePathTask.generation!.difficultyBands = [
      "foundation",
      "foundation",
      "exam",
    ]
    const impossiblePathSession = createActiveLearningSession(impossiblePathTask, now)
    impossiblePathSession.phase = "questions"
    impossiblePathSession.question.questionIndex = 2
    impossiblePathSession.question.results = [0, 1].map((index) => ({
      questionId: `${task.id}:question:${index}`,
      topicId: task.topicIds[0]!,
      attempts: 2,
      hintsUsed: 0,
      activeSeconds: 20,
      independentlySolved: false,
      solved: true,
      difficultyBand: "foundation" as const,
    }))
    const impossiblePathBackup = await createEncryptedBackup(
      learner,
      impossiblePathSession,
      password,
      now,
    )
    await expect(openEncryptedBackup(impossiblePathBackup, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("round-trips source-only archive history and an active review without embedding PDFs", async () => {
    const learner = createSeededLearner(now)
    const completedPractice = submitArchivePracticeForReview(
      createActiveArchivePractice("zap-zh-lg-2019", "backup:archive:completed", now),
      "submitted",
      new Date("2026-07-14T12:40:00.000Z"),
    )
    completedPractice.progress.forEach((task, index) => {
      task.reviewStatus = index < 4 ? "answer-matches" : index < 7
        ? "answer-differs-or-unclear"
        : "not-attempted"
    })
    learner.archivePracticeHistory.push(
      completeArchivePractice(completedPractice, new Date("2026-07-14T12:50:00.000Z")),
    )
    const activePractice = submitArchivePracticeForReview(
      createActiveArchivePractice(
        "zap-zh-lg-2022",
        "backup:archive:active",
        new Date("2026-07-14T13:00:00.000Z"),
      ),
      "timeout",
      new Date("2026-07-14T14:00:00.000Z"),
    )
    activePractice.progress[0]!.reviewStatus = "answer-matches"

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      activePractice,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.version).toBe(6)
    expect(restored.learner.archivePracticeHistory).toEqual(learner.archivePracticeHistory)
    expect(restored.activeArchivePractice).toEqual(activePractice)
    expect(serialized).not.toContain("%PDF")
  })

  it.each(officialReplayBackupCases)(
    "round-trips the supported %s replay and correction without embedding source PDFs",
    async (editionId, expectedGradeScaleId, expectedGrade) => {
      const learner = createSeededLearner(now)
      const definition = officialExamDefinition(editionId)
      if (!definition) throw new Error(`Missing official definition for ${editionId}`)
      const submitted = definition.grade(
        definition.create(`backup:${editionId}:completed`, now),
        "submitted",
        new Date("2026-07-14T12:45:00.000Z"),
      )
      const taskScores = submitted.taskResults.map((task) => (
        task.certainPoints + task.reviewablePoints
      ))
      const corrected = definition.completeReview(
        submitted,
        taskScores,
        new Date("2026-07-14T13:00:00.000Z"),
      )
      learner.mockHistory.push(corrected)
      const activeOfficial = definition.create(
        `backup:${editionId}:active`,
        new Date("2026-07-14T14:00:00.000Z"),
      )
      activeOfficial.progress[2]!.parts[0]!.answer = "1,1,9"
      activeOfficial.progress[4]!.parts[0]!.milestoneAnswers = {
        "jar-mass-54": "54",
        "before-cooking-72": "72",
        ...(editionId === "zap-zh-lg-2025"
          ? {
              "calculation-path": "108 · 0,5 = 54\n54 : 3 = 18\n18 · 4 = 72\n72 : 6 = 12\n12 · 7 = 84\n84 + 2,5 = 86,5",
            }
          : {}),
      }

      const serialized = await createEncryptedBackup(learner, undefined, password, now, activeOfficial)
      const restored = await openEncryptedBackup(serialized, password)

      expect(restored.activeMock).toEqual(activeOfficial)
      expect(restored.learner.mockHistory.at(-1)).toEqual(corrected)
      expect(restored.learner.mockHistory.at(-1)?.officialReview).toMatchObject({
        editionId,
        rubricVersion: definition.blueprint.rubricVersion,
        status: "complete",
      })
      expect(restored.learner.mockHistory.at(-1)?.officialReview?.gradeScaleId).toBe(expectedGradeScaleId)
      expect(restored.learner.mockHistory.at(-1)?.officialReview?.mathematicsGrade).toBe(expectedGrade)
      expect(serialized).not.toContain("%PDF")
    },
  )

  it("round-trips pending correction state for every supported official replay", async () => {
    const learner = createSeededLearner(now)
    for (const [editionId] of officialReplayBackupCases) {
      const definition = officialExamDefinition(editionId)
      if (!definition) throw new Error(`Missing official definition for ${editionId}`)
      learner.mockHistory.push(definition.grade(
        definition.create(`backup:${editionId}:pending`, now),
        "submitted",
        new Date("2026-07-14T12:45:00.000Z"),
      ))
    }

    const serialized = await createEncryptedBackup(learner, undefined, password, now)
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.learner.mockHistory.map((result) => result.editionId)).toEqual(
      officialReplayBackupCases.map(([editionId]) => editionId),
    )
    expect(restored.learner.mockHistory.every((result) => (
      result.officialReview?.status === "pending" &&
      result.officialReview.gradeScaleId === undefined &&
      result.officialReview.mathematicsGrade === undefined
    ))).toBe(true)
  })

  it("round-trips isolated German progress and the cross-subject resume index", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.totalXp = 37
    germanCourse.xpSinceAssessment = 37
    germanCourse.topicProgress["reading-evidence"] = {
      ...germanCourse.topicProgress["reading-evidence"],
      status: "mastered",
      completedAt: now.toISOString(),
      reviewDueAt: "2026-07-18T12:00:00.000Z",
    }
    const completedExam = createActiveGermanExam("backup:german:completed", now)
    germanCourse.examHistory.push(gradeGermanExam(
      completedExam,
      "submitted",
      new Date("2026-07-14T12:10:00.000Z"),
    ))
    germanCourse.activeExam = createActiveGermanExam(
      "backup:german:active",
      new Date("2026-07-14T12:30:00.000Z"),
    )
    const courseIndex = touchCourse(
      createLearnerCourseIndex(now),
      "german",
      new Date("2026-07-14T13:00:00.000Z"),
    )

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
      courseIndex,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.version).toBe(6)
    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.courseIndex).toEqual(courseIndex)
    expect(serialized).not.toContain("reading-evidence")
  })

  it("round-trips German source-practice timing and drafts without embedding source PDFs", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    const courseIndex = touchCourse(createLearnerCourseIndex(now), "german", now)
    const language = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2024",
      "language-exam",
      "backup:german-source:language",
      now,
    )
    const languageResult = completeGermanSourcePractice(
      setGermanSourceLanguageReview(
        submitGermanSourcePractice(
          language,
          "submitted",
          new Date("2026-07-14T12:30:00.000Z"),
        ),
        "mixed-or-unclear",
        new Date("2026-07-14T12:31:00.000Z"),
      ),
      new Date("2026-07-14T12:32:00.000Z"),
    )
    const privateDraft = "Dieser Quellenaufsatz bleibt verschlüsselt und exakt fortsetzbar."
    const writing = updateGermanSourceWriting(
      createActiveGermanSourcePractice(
        "zap-zh-lg-german-2025",
        "writing",
        "backup:german-source:writing",
        new Date("2026-07-14T13:00:00.000Z"),
      ),
      "Mein Quellenaufsatz",
      privateDraft,
      new Date("2026-07-14T13:05:00.000Z"),
    )
    const germanSourcePractice = {
      ...createGermanSourcePracticeState(),
      active: writing,
      history: [languageResult],
    }

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
      courseIndex,
      germanSourcePractice,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanSourcePractice).toEqual(germanSourcePractice)
    expect(restored.germanSourcePractice?.active?.deadlineAt).toBe(writing.deadlineAt)
    expect(restored.germanSourcePractice?.history).toEqual([languageResult])
    expect(serialized).not.toContain(privateDraft)
    expect(serialized).not.toContain("%PDF")
  })

  it("round-trips active and completed German writing without exposing either draft", async () => {
    const learner = createSeededLearner(now)
    let germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }

    germanCourse = startGermanWritingPractice(germanCourse, now)
    let first = germanCourse.activeWriting!
    first = chooseGermanWritingPrompt(first, buildGermanWritingForm(first.seed).prompts[0]!.id, now)
    const completedDraft = "Dieser bereits abgeschlossene Text bleibt im verschlüsselten Verlauf."
    first = updateGermanWritingDraft(first, completedDraft, now)
    germanCourse = updateGermanWritingPractice(germanCourse, first)
    const result = submitGermanWritingSession(first, "submitted", new Date("2026-07-14T12:20:00.000Z"))
    germanCourse = completeGermanWritingPractice(
      germanCourse,
      result,
      new Date("2026-07-14T12:20:00.000Z"),
    )
    const privateStrength = "Der Aufbau ist für die Leserin gut nachvollziehbar."
    const privateNextStep = "Die direkte Rede im Hauptteil sauberer zeichensetzen."
    germanCourse = saveGermanWritingHumanReview(
      germanCourse,
      result.id,
      privateStrength,
      privateNextStep,
      new Date("2026-07-14T12:25:00.000Z"),
    )

    germanCourse = startGermanWritingPractice(germanCourse, new Date("2026-07-14T12:30:00.000Z"))
    let active = germanCourse.activeWriting!
    active = chooseGermanWritingPrompt(
      active,
      buildGermanWritingForm(active.seed).prompts[2]!.id,
      new Date("2026-07-14T12:31:00.000Z"),
    )
    const activeDraft = "Dieser noch offene Bericht wird nach dem Import fortgesetzt."
    active = updateGermanWritingDraft(active, activeDraft, new Date("2026-07-14T12:35:00.000Z"))
    germanCourse = updateGermanWritingPractice(germanCourse, active)

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.germanCourse?.writingHistory).toEqual([result])
    expect(restored.germanCourse?.writingReviews).toEqual(germanCourse.writingReviews)
    expect(restored.germanCourse?.activeWriting).toEqual(active)
    expect(serialized).not.toContain(completedDraft)
    expect(serialized).not.toContain(activeDraft)
    expect(serialized).not.toContain(privateStrength)
    expect(serialized).not.toContain(privateNextStep)
  })

  it("round-trips active and saved German writing revisions without exposing either text", async () => {
    const learner = createSeededLearner(now)
    let germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    germanCourse = startGermanWritingPractice(germanCourse, now)
    let writing = germanCourse.activeWriting!
    writing = chooseGermanWritingPrompt(writing, buildGermanWritingForm(writing.seed).prompts[0]!.id, now)
    writing = updateGermanWritingDraft(
      writing,
      "Der ursprüngliche Text bleibt als unveränderliche Abgabe gespeichert.",
      new Date("2026-07-14T12:10:00.000Z"),
    )
    germanCourse = updateGermanWritingPractice(germanCourse, writing)
    const result = submitGermanWritingSession(writing, "submitted", new Date("2026-07-14T12:20:00.000Z"))
    germanCourse = completeGermanWritingPractice(germanCourse, result)
    germanCourse = saveGermanWritingHumanReview(
      germanCourse,
      result.id,
      "Der Einstieg ist verständlich.",
      "Den Hauptteil klarer mit dem Konflikt verbinden.",
      new Date("2026-07-14T12:25:00.000Z"),
    )

    germanCourse = startGermanWritingRevision(germanCourse, result.id, new Date("2026-07-14T12:30:00.000Z"))
    const savedRevisionText = "Diese erste Überarbeitung setzt die menschliche Rückmeldung sichtbar um."
    let revision = updateActiveGermanWritingRevision(
      germanCourse.activeWritingRevision!,
      { draft: savedRevisionText },
      new Date("2026-07-14T12:35:00.000Z"),
    )
    germanCourse = updateGermanWritingRevision(germanCourse, revision)
    germanCourse = completeGermanWritingRevision(
      germanCourse,
      saveGermanWritingRevisionSnapshot(revision, new Date("2026-07-14T12:36:00.000Z")),
    )

    germanCourse = startGermanWritingRevision(germanCourse, result.id, new Date("2026-07-14T12:40:00.000Z"))
    const activeRevisionText = "Diese zweite Überarbeitung bleibt als fortsetzbarer Entwurf verschlüsselt."
    revision = updateActiveGermanWritingRevision(
      germanCourse.activeWritingRevision!,
      { draft: activeRevisionText },
      new Date("2026-07-14T12:45:00.000Z"),
    )
    germanCourse = updateGermanWritingRevision(germanCourse, revision)

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.germanCourse?.writingRevisions).toEqual(germanCourse.writingRevisions)
    expect(restored.germanCourse?.activeWritingRevision).toEqual(revision)
    expect(serialized).not.toContain(savedRevisionText)
    expect(serialized).not.toContain(activeRevisionText)
  })

  it("round-trips active and reviewed German comprehension without exposing private text", async () => {
    const learner = createSeededLearner(now)
    let germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    germanCourse = startGermanComprehensionPractice(germanCourse, now)
    const firstPassage = germanComprehensionPassage(germanCourse.activeComprehension!.promptId)!
    const completedResponse = "Diese private Kurzantwort verbindet eine Textstelle mit einer eigenen Erklärung."
    const first = updateGermanComprehensionSession(
      germanCourse.activeComprehension!,
      completedResponse,
      [firstPassage.lines[0]!.number],
      new Date("2026-07-14T12:04:00.000Z"),
    )
    germanCourse = updateGermanComprehensionPractice(germanCourse, first)
    const result = submitGermanComprehensionSession(first, new Date("2026-07-14T12:05:00.000Z"))
    germanCourse = completeGermanComprehensionPractice(germanCourse, result)
    const privateStrength = "Der zentrale Zusammenhang ist verständlich formuliert."
    const privateNextStep = "Die markierte Zeile noch wörtlicher mit der Begründung verbinden."
    germanCourse = saveGermanComprehensionHumanReview(
      germanCourse,
      result.id,
      "partly-supported",
      privateStrength,
      privateNextStep,
      new Date("2026-07-14T12:10:00.000Z"),
    )
    germanCourse = resolveGermanComprehensionHumanReview(
      germanCourse,
      result.id,
      new Date("2026-07-14T12:11:00.000Z"),
    )
    germanCourse = startGermanComprehensionPractice(germanCourse, new Date("2026-07-14T12:12:00.000Z"))
    const secondPassage = germanComprehensionPassage(germanCourse.activeComprehension!.promptId)!
    const activeResponse = "Auch diese noch offene Antwort bleibt ausschliesslich im verschlüsselten Lernstand."
    const active = updateGermanComprehensionSession(
      germanCourse.activeComprehension!,
      activeResponse,
      [secondPassage.lines[1]!.number],
      new Date("2026-07-14T12:13:00.000Z"),
    )
    germanCourse = updateGermanComprehensionPractice(germanCourse, active)

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.germanCourse?.comprehensionHistory).toEqual([result])
    expect(restored.germanCourse?.comprehensionReviews).toEqual(germanCourse.comprehensionReviews)
    expect(restored.germanCourse?.activeComprehension).toEqual(active)
    expect(serialized).not.toContain(completedResponse)
    expect(serialized).not.toContain(activeResponse)
    expect(serialized).not.toContain(privateStrength)
    expect(serialized).not.toContain(privateNextStep)
  })

  it("round-trips a paused German matching answer without exposing it in ciphertext", async () => {
    const learner = createSeededLearner(now)
    let germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    const assignment = buildGermanAssignments(germanCourse, now)
      .find((candidate) => candidate.topicId === "sentence-structure")!
    germanCourse = startGermanSession(germanCourse, assignment, now)

    while (true) {
      const question = currentGermanQuestion(germanCourse)!
      if (isGermanMatchingQuestion(question)) {
        germanCourse = answerCurrentGermanQuestion(germanCourse, {
          responseKind: "matching",
          matches: question.correctMatches.map((match) => ({ ...match })),
        }, now)
        break
      }
      if (!isGermanChoiceQuestion(question)) throw new Error("Unexpected truth grid in a learning session")
      germanCourse = answerCurrentGermanQuestion(germanCourse, question.correctOptionId, now)
      germanCourse = advanceGermanSession(germanCourse, now).state
    }

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.germanCourse?.activeSession?.answers.at(-1)).toMatchObject({
      responseKind: "matching",
      correct: true,
      selectedMatches: expect.any(Array),
      correctMatches: expect.any(Array),
    })
    expect(serialized).not.toContain("selectedMatches")
  })

  it("round-trips four-group German analysis with its per-error scoring evidence", async () => {
    const learner = createSeededLearner(now)
    let germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    const assignment = buildGermanAssignments(germanCourse, now)
      .find((candidate) => candidate.topicId === "sentence-structure")!
    germanCourse = startGermanSession(germanCourse, assignment, now)

    while (true) {
      const question = currentGermanQuestion(germanCourse)!
      if (
        isGermanMatchingQuestion(question) &&
        question.matchingScoring === "sentence-analysis-deduction-2025"
      ) {
        const matches = question.correctMatches.map((match, index) => (
          index === 0 ? { ...match, targetId: question.correctMatches[1]!.targetId } : { ...match }
        ))
        germanCourse = answerCurrentGermanQuestion(germanCourse, {
          responseKind: "matching",
          matches,
        }, now)
        break
      }
      if (isGermanMatchingQuestion(question)) {
        germanCourse = answerCurrentGermanQuestion(germanCourse, {
          responseKind: "matching",
          matches: question.correctMatches.map((match) => ({ ...match })),
        }, now)
      } else {
        if (!isGermanChoiceQuestion(question)) throw new Error("Unexpected sentence-structure response")
        germanCourse = answerCurrentGermanQuestion(germanCourse, question.correctOptionId, now)
      }
      germanCourse = advanceGermanSession(germanCourse, now).state
    }

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.germanCourse?.activeSession?.answers.at(-1)).toMatchObject({
      responseKind: "matching",
      correct: false,
      scoringRuleId: "sentence-analysis-deduction-2025-v1",
      correctUnits: 3,
      incorrectUnits: 1,
      totalUnits: 4,
      awardedPoints: 1,
      maximumPoints: 2,
    })
    expect(serialized).not.toContain("selectedMatches")
  })

  it("round-trips a securely graded German multi-select answer", async () => {
    const learner = createSeededLearner(now)
    let germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    const assignment = buildGermanAssignments(germanCourse, now)
      .find((candidate) => candidate.topicId === "reading-evidence")!
    germanCourse = startGermanSession(germanCourse, assignment, now)

    while (true) {
      const question = currentGermanQuestion(germanCourse)!
      if (isGermanMultiSelectQuestion(question)) {
        germanCourse = answerCurrentGermanQuestion(germanCourse, {
          responseKind: "multi-select",
          selectedOptionIds: [...question.correctOptionIds],
        }, now)
        break
      }
      if (!isGermanChoiceQuestion(question)) throw new Error("Unexpected response in reading session")
      germanCourse = answerCurrentGermanQuestion(germanCourse, question.correctOptionId, now)
      germanCourse = advanceGermanSession(germanCourse, now).state
    }

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.germanCourse?.activeSession?.answers.at(-1)).toMatchObject({
      responseKind: "multi-select",
      selectedOptionIds: expect.any(Array),
      correctOptionIds: expect.any(Array),
      correct: true,
      scoringRuleId: "exact-multi-select-v1",
    })
    expect(serialized).not.toContain("selectedOptionIds")
  })

  it("round-trips a securely graded German text correction without exposing the sentence in ciphertext", async () => {
    const learner = createSeededLearner(now)
    let germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    const assignment = buildGermanAssignments(germanCourse, now)
      .find((candidate) => candidate.topicId === "grammar-correction")!
    germanCourse = startGermanSession(germanCourse, assignment, now)

    let acceptedText = ""
    while (true) {
      const question = currentGermanQuestion(germanCourse)!
      if (isGermanAcceptedTextQuestion(question)) {
        acceptedText = question.acceptedAnswers[0]!.text
        germanCourse = answerCurrentGermanQuestion(germanCourse, {
          responseKind: "accepted-text",
          text: acceptedText,
        }, now)
        break
      }
      if (!isGermanChoiceQuestion(question)) throw new Error("Unexpected response in grammar session")
      germanCourse = answerCurrentGermanQuestion(germanCourse, question.correctOptionId, now)
      germanCourse = advanceGermanSession(germanCourse, now).state
    }

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse).toEqual(germanCourse)
    expect(restored.germanCourse?.activeSession?.answers.at(-1)).toMatchObject({
      responseKind: "accepted-text",
      acceptedAnswerId: "canonical",
      correct: true,
      scoringRuleId: "exact-accepted-text-v1",
    })
    expect(serialized).not.toContain(acceptedText)
    expect(serialized).not.toContain("selectedText")
  })

  it("round-trips an in-progress German text field for a strict exam", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    let exam = createActiveGermanExam("backup:german:accepted-text", now)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanAcceptedTextQuestion)
    if (!question) throw new Error("Expected an accepted-text question")
    const draft = "Noch nicht fertig"
    exam = answerGermanExamQuestion(exam, question.id, {
      responseKind: "accepted-text",
      text: draft,
    }, now)
    germanCourse.activeExam = exam

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse?.activeExam).toEqual(exam)
    expect(serialized).not.toContain(draft)
  })

  it("round-trips a partial German truth grid without exposing row selections in ciphertext", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    let exam = createActiveGermanExam("backup:german:truth-grid", now)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanTruthGridQuestion)
    if (!question) throw new Error("Expected a truth-grid question")
    exam = answerGermanExamQuestion(exam, question.id, {
      responseKind: "truth-grid",
      selections: question.correctSelections.slice(0, 2).map((selection) => ({ ...selection })),
    }, now)
    germanCourse.activeExam = exam

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse?.activeExam).toEqual(exam)
    expect(serialized).not.toContain("selectedSelections")
  })

  it("round-trips a partial German binary penalty grid", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    let exam = createActiveGermanExam("backup:german:binary-grid", now)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanBinaryGridQuestion)
    if (!question) throw new Error("Expected a binary-grid question")
    exam = answerGermanExamQuestion(exam, question.id, {
      responseKind: "binary-grid",
      selections: question.correctSelections.slice(0, 4).map((selection) => ({ ...selection })),
    }, now)
    germanCourse.activeExam = exam

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse?.activeExam).toEqual(exam)
    expect(serialized).not.toContain("binary-grid")
  })

  it("round-trips a partial German multi-select strict-exam response", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    let exam = createActiveGermanExam("backup:german:multi-select", now)
    const question = buildGermanExamBlueprint(exam.seed).questions.find(isGermanMultiSelectQuestion)
    if (!question) throw new Error("Expected a multi-select question")
    exam = answerGermanExamQuestion(exam, question.id, {
      responseKind: "multi-select",
      selectedOptionIds: [question.correctOptionIds[0]!],
    }, now)
    germanCourse.activeExam = exam

    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
    )
    const restored = await openEncryptedBackup(serialized, password)

    expect(restored.germanCourse?.activeExam).toEqual(exam)
    expect(serialized).not.toContain("multi-select")
  })

  it("rejects German progress belonging to a different learner", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState("different-learner", now)
    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
      createLearnerCourseIndex(now),
    )

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects malformed German course data inside an otherwise valid backup", async () => {
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.totalXp = -1
    const serialized = await createEncryptedBackup(
      learner,
      undefined,
      password,
      now,
      undefined,
      undefined,
      germanCourse,
      createLearnerCourseIndex(now),
    )

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects official results whose edition identity or grade metadata was relabelled", async () => {
    const learner = createSeededLearner(now)
    const definition = officialExamDefinition("zap-zh-lg-2025")!
    const corrected = definition.completeReview(
      definition.grade(
        definition.create("backup:official:tampered", now),
        "submitted",
        new Date("2026-07-14T12:45:00.000Z"),
      ),
      fullOfficialTaskScores,
      new Date("2026-07-14T13:00:00.000Z"),
    )
    corrected.editionId = "zap-zh-lg-2024"
    if (corrected.officialReview) corrected.officialReview.editionId = "zap-zh-lg-2024"
    learner.mockHistory.push(corrected)

    const serialized = await createEncryptedBackup(learner, undefined, password, now)
    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects invented grade metadata on a corrected no-grade edition", async () => {
    const learner = createSeededLearner(now)
    const definition = officialExamDefinition("zap-zh-lg-2015")!
    const submitted = definition.grade(
      definition.create("backup:official:invented-grade", now),
      "submitted",
      new Date("2026-07-14T12:45:00.000Z"),
    )
    const corrected = definition.completeReview(
      submitted,
      submitted.taskResults.map((task) => task.certainPoints + task.reviewablePoints),
      new Date("2026-07-14T13:00:00.000Z"),
    )
    if (!corrected.officialReview) throw new Error("Missing official review")
    corrected.officialReview.gradeScaleId = "zap-lg-2025-math-2025-03-14"
    corrected.officialReview.mathematicsGrade = 6
    learner.mockHistory.push(corrected)

    const serialized = await createEncryptedBackup(learner, undefined, password, now)
    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("accepts a schema-five learner without diagnostic evidence and migrates it", async () => {
    const legacy = createSeededLearner(now)
    ;(legacy as unknown as { schemaVersion: number }).schemaVersion = 5

    const serialized = await createEncryptedBackup(legacy, undefined, password, now)
    const restored = await openEncryptedBackup(serialized, password)
    const migrated = migrateLearnerState(restored.learner)

    expect(restored.learner.schemaVersion).toBe(5)
    expect(migrated.schemaVersion).toBe(12)
    expect(migrated.learningEvents).toEqual([])
  })

  it("accepts schema-six mastery and derives the two evidence scores during migration", async () => {
    const learner = createSeededLearner(now)
    const legacy = structuredClone(learner) as unknown as {
      schemaVersion: number
      mastery: Record<string, {
        supportedMastery?: number
        independentMastery?: number
      }>
    }
    legacy.schemaVersion = 6
    for (const mastery of Object.values(legacy.mastery)) {
      delete mastery.supportedMastery
      delete mastery.independentMastery
    }

    const serialized = await createEncryptedBackup(
      legacy as unknown as LearnerState,
      undefined,
      password,
      now,
    )
    const restored = await openEncryptedBackup(serialized, password)
    const migrated = migrateLearnerState(restored.learner)

    expect(restored.learner.schemaVersion).toBe(6)
    expect(migrated.schemaVersion).toBe(12)
    expect(migrated.mastery["mass-units"].supportedMastery).toBeGreaterThanOrEqual(0.65)
    expect(migrated.mastery["mass-units"].independentMastery).toBeGreaterThanOrEqual(0.55)
    expect(migrated.mastery["arithmetic-equations"]).toMatchObject({
      supportedMastery: 0,
      independentMastery: 0,
    })
  })

  it("rejects a wrong passphrase without exposing whether the payload is valid", async () => {
    const serialized = await createEncryptedBackup(
      createSeededLearner(now),
      undefined,
      password,
      now,
    )

    await expect(openEncryptedBackup(serialized, "Falsches-Passwort")).rejects.toMatchObject({
      code: "locked-or-damaged",
    })
  })

  it("detects ciphertext and authenticated-header tampering", async () => {
    const serialized = await createEncryptedBackup(
      createSeededLearner(now),
      undefined,
      password,
      now,
    )
    const envelope = JSON.parse(serialized) as { createdAt: string; ciphertext: string }
    envelope.ciphertext = `${envelope.ciphertext.slice(0, -2)}AA`
    await expect(
      openEncryptedBackup(JSON.stringify(envelope), password),
    ).rejects.toBeInstanceOf(BackupError)

    const headerEnvelope = JSON.parse(serialized) as { createdAt: string }
    headerEnvelope.createdAt = "2020-01-01T00:00:00.000Z"
    await expect(
      openEncryptedBackup(JSON.stringify(headerEnvelope), password),
    ).rejects.toMatchObject({ code: "locked-or-damaged" })
  })

  it("accepts a one-character symbol or blank password and rejects unrelated files", async () => {
    const learner = createSeededLearner(now)
    const symbolPasswordBackup = await createEncryptedBackup(learner, undefined, "!", now)
    const passwordFreeBackup = await createEncryptedBackup(learner, undefined, "", now)

    await expect(openEncryptedBackup(symbolPasswordBackup, "!")).resolves.toMatchObject({
      learner: { learnerId: learner.learnerId },
    })
    await expect(openEncryptedBackup(passwordFreeBackup, "")).resolves.toMatchObject({
      learner: { learnerId: learner.learnerId },
    })
    await expect(openEncryptedBackup("not-json", password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects decrypted payloads whose learning data has an invalid shape", async () => {
    const learner = createSeededLearner(now)
    learner.mastery["mass-units"].retention = 4
    const serialized = await createEncryptedBackup(learner, undefined, password, now)

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects schema-seven evidence scores outside the mastery range", async () => {
    const learner = createSeededLearner(now)
    learner.mastery["mass-units"].independentMastery = 1.1
    const serialized = await createEncryptedBackup(learner, undefined, password, now)

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects unknown diagnostic categories in decrypted history", async () => {
    const learner = createSeededLearner(now)
    learner.learningEvents.push({
      id: "event:invalid-diagnostic",
      taskId: "review:mass-units:invalid-diagnostic",
      taskKind: "review",
      topicIds: ["mass-units"],
      completedAt: now.toISOString(),
      activeSeconds: 20,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: [{
        questionId: "invalid-diagnostic:question",
        topicId: "mass-units",
        attempts: 2,
        hintsUsed: 0,
        activeSeconds: 20,
        independentlySolved: false,
        diagnostic: {
          kind: "made-up-category" as "concept",
          title: "This category must not pass backup validation.",
          resolved: false,
        },
      }],
    })
    const serialized = await createEncryptedBackup(learner, undefined, password, now)

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects a version-five profile with an impossible civil exam date", async () => {
    const learner = createSeededLearner(now)
    learner.preferences.examDate = "2026-02-31"
    const serialized = await createEncryptedBackup(learner, undefined, password, now)

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("rejects a decrypted backup with impossible active mock navigation", async () => {
    const activeMock = createActiveMockExam("invalid-active-mock", now)
    activeMock.currentTaskIndex = 99
    const serialized = await createEncryptedBackup(
      createSeededLearner(now),
      undefined,
      password,
      now,
      activeMock,
    )

    await expect(openEncryptedBackup(serialized, password)).rejects.toMatchObject({
      code: "invalid-format",
    })
  })

  it("uses a recognizable but non-sensitive dated extension", () => {
    expect(backupFilename(now)).toBe("gymiquest-backup-2026-07-14.gqbackup")
  })
})
