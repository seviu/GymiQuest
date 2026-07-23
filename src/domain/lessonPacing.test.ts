import { describe, expect, it } from "vitest"
import { generateQuestionsForTask } from "./generators"
import {
  topicIds,
  type DifficultyBand,
  type LearnerState,
  type LearningEvent,
  type LearningTask,
  type LessonPacingMode,
  type QuestionResult,
  type SessionMinutes,
  type TaskKind,
  type TopicId,
} from "./model"
import { defaultLearnerPreferences } from "./studyPlan"
import {
  adaptLessonTaskAfterQuestion,
  buildLessonPacingPlan,
  isLessonPacingQuestionCount,
  isReachableLessonPacingDifficultyBands,
  lessonPacingDifficultyBands,
  lessonPacingTaskMatchesResults,
} from "./lessonPacing"

function result(
  questionId: string,
  topicId: TopicId,
  independent: boolean,
  overrides: Partial<QuestionResult> = {},
): QuestionResult {
  return {
    questionId,
    topicId,
    attempts: independent ? 1 : 2,
    hintsUsed: 0,
    activeSeconds: 30,
    independentlySolved: independent,
    solved: true,
    difficultyBand: "standard",
    ...overrides,
  }
}

function event(
  id: string,
  completedAt: string,
  results: QuestionResult[],
): LearningEvent {
  return {
    id,
    taskId: `review:${id}`,
    taskKind: "review",
    topicIds: [...new Set(results.map((item) => item.topicId))],
    completedAt,
    activeSeconds: results.length * 30,
    mistakes: results.filter((item) => !item.independentlySolved).length,
    hintsUsed: results.reduce((sum, item) => sum + item.hintsUsed, 0),
    independentlyCompleted: results.every((item) => item.independentlySolved),
    questionResults: results,
  }
}

function pacingState(
  learningEvents: LearningEvent[],
  sessionMinutes: SessionMinutes = 15,
): Pick<LearnerState, "learningEvents" | "preferences"> {
  return {
    learningEvents,
    preferences: {
      ...defaultLearnerPreferences,
      practiceDays: [...defaultLearnerPreferences.practiceDays],
      sessionMinutes,
    },
  }
}

function lessonTask(
  difficultyBands: DifficultyBand[],
  mode: LessonPacingMode = difficultyBands.length === 2
    ? "accelerated"
    : difficultyBands.length === 4 || difficultyBands[1] === "foundation"
      ? "supported"
      : "steady",
): LearningTask {
  return {
    id: "lesson:adaptive-test",
    kind: "lesson",
    title: "Adaptive lesson",
    description: "Test pacing",
    topicIds: ["mass-units"],
    prerequisiteIds: [],
    maxXp: 25,
    questionCount: difficultyBands.length,
    seed: "lesson:adaptive-test",
    curriculum: { courseId: "zh-zap1-math", version: 1 },
    generation: {
      version: 5,
      difficultyBands: [...difficultyBands],
    },
    pacing: {
      version: 1,
      mode,
    },
  }
}

type PacingOutcome = "independent" | "corrected" | "assisted" | "unresolved"

function pacingOutcomeResult(
  questionId: string,
  topicId: TopicId,
  difficultyBand: DifficultyBand,
  outcome: PacingOutcome,
): QuestionResult {
  if (outcome === "independent") {
    return result(questionId, topicId, true, { difficultyBand })
  }
  if (outcome === "corrected") {
    return result(questionId, topicId, false, {
      attempts: 2,
      solved: true,
      difficultyBand,
    })
  }
  if (outcome === "assisted") {
    return result(questionId, topicId, false, {
      attempts: 1,
      hintsUsed: 1,
      solved: false,
      difficultyBand,
    })
  }
  return result(questionId, topicId, false, {
    attempts: 1,
    solved: false,
    difficultyBand,
  })
}

function outcomeSequences(length: number): PacingOutcome[][] {
  const outcomes: PacingOutcome[] = [
    "independent",
    "corrected",
    "assisted",
    "unresolved",
  ]
  if (length === 0) return [[]]
  return outcomes.flatMap((outcome) => (
    outcomeSequences(length - 1).map((tail) => [outcome, ...tail])
  ))
}

function representativeOutcomeSequences(): PacingOutcome[][] {
  const representatives = new Map<string, PacingOutcome[]>()

  for (const outcomes of outcomeSequences(3)) {
    let task = lessonTask(["foundation", "foundation", "standard", "exam"])
    const completedResults: QuestionResult[] = []

    for (const [questionIndex, outcome] of outcomes.entries()) {
      const difficultyBand = task.generation!.difficultyBands[questionIndex]!
      completedResults.push(pacingOutcomeResult(
        `representative:${questionIndex}`,
        "mass-units",
        difficultyBand,
        outcome,
      ))
      task = adaptLessonTaskAfterQuestion(task, completedResults)
    }

    const path = task.generation!.difficultyBands.join(",")
    if (!representatives.has(path)) representatives.set(path, outcomes)
  }

  return [...representatives.values()]
}

describe("adaptive lesson pacing", () => {
  it("uses the latest relevant round rather than unrelated newer performance", () => {
    const relevant = event("relevant", "2026-07-14T09:00:00.000Z", [
      result("relevant:1", "mass-units", true),
      result("relevant:2", "mass-units", true),
    ])
    const unrelated = event("unrelated", "2026-07-14T10:00:00.000Z", [
      result("unrelated:1", "spatial-rolling", false),
      result("unrelated:2", "spatial-rolling", false),
    ])

    expect(buildLessonPacingPlan(
      pacingState([relevant, unrelated]),
      ["mass-units"],
    )).toEqual({
      profile: { version: 1, mode: "accelerated" },
      difficultyBands: ["standard", "exam"],
    })
  })

  it("uses only relevant results inside the latest relevant round", () => {
    const mixed = event("mixed", "2026-07-14T09:00:00.000Z", [
      result("mixed:relevant:1", "mass-units", true),
      result("mixed:relevant:2", "mass-units", true),
      result("mixed:unrelated:1", "spatial-rolling", false),
      result("mixed:unrelated:2", "spatial-rolling", false),
    ])

    expect(buildLessonPacingPlan(
      pacingState([mixed]),
      ["mass-units"],
    ).profile.mode).toBe("accelerated")
  })

  it("covers the evidence boundaries for supported, steady, and accelerated pacing", () => {
    expect(buildLessonPacingPlan(pacingState([]), ["mass-units"])).toEqual({
      profile: { version: 1, mode: "steady" },
      difficultyBands: ["foundation", "standard", "exam"],
    })

    const oneIndependent = event("one-independent", "2026-07-14T09:00:00.000Z", [
      result("one-independent:1", "mass-units", true),
    ])
    expect(buildLessonPacingPlan(
      pacingState([oneIndependent]),
      ["mass-units"],
    ).profile.mode).toBe("steady")

    const oneMiss = event("one-miss", "2026-07-14T09:30:00.000Z", [
      result("one-miss:1", "mass-units", false),
    ])
    expect(buildLessonPacingPlan(
      pacingState([oneMiss]),
      ["mass-units"],
    ).profile.mode).toBe("supported")

    const exactlyHalf = event("exactly-half", "2026-07-14T10:00:00.000Z", [
      result("exactly-half:1", "mass-units", true),
      result("exactly-half:2", "mass-units", false),
    ])
    expect(buildLessonPacingPlan(
      pacingState([exactlyHalf]),
      ["mass-units"],
    )).toEqual({
      profile: { version: 1, mode: "supported" },
      difficultyBands: ["foundation", "foundation", "standard", "exam"],
    })
    expect(buildLessonPacingPlan(
      pacingState([exactlyHalf], 10),
      ["mass-units"],
    ).difficultyBands).toEqual(["foundation", "foundation", "standard"])

    const aboveHalf = event("above-half", "2026-07-14T10:30:00.000Z", [
      result("above-half:1", "mass-units", true),
      result("above-half:2", "mass-units", true),
      result("above-half:3", "mass-units", false),
    ])
    expect(buildLessonPacingPlan(
      pacingState([aboveHalf]),
      ["mass-units"],
    ).profile.mode).toBe("steady")

    const twoIndependent = event("two-independent", "2026-07-14T11:00:00.000Z", [
      result("two-independent:1", "mass-units", true),
      result("two-independent:2", "mass-units", true),
    ])
    expect(buildLessonPacingPlan(
      pacingState([twoIndependent]),
      ["mass-units"],
    ).profile.mode).toBe("accelerated")
  })

  it("requires one attempt, no hints, and independent completion for strong evidence", () => {
    const nominallyIndependent = event(
      "not-strictly-independent",
      "2026-07-14T09:00:00.000Z",
      [
        result("attempted-twice", "mass-units", true, { attempts: 2 }),
        result("used-hint", "mass-units", true, { hintsUsed: 1 }),
      ],
    )

    expect(buildLessonPacingPlan(
      pacingState([nominallyIndependent]),
      ["mass-units"],
    ).profile.mode).toBe("supported")
  })

  it("breaks equal completion timestamps by persisted event order", () => {
    const supported = event("supported", "2026-07-14T09:00:00.000Z", [
      result("supported:1", "mass-units", false),
    ])
    const accelerated = event("accelerated", "2026-07-14T09:00:00.000Z", [
      result("accelerated:1", "mass-units", true),
      result("accelerated:2", "mass-units", true),
    ])

    expect(buildLessonPacingPlan(
      pacingState([supported, accelerated]),
      ["mass-units"],
    ).profile.mode).toBe("accelerated")
    expect(buildLessonPacingPlan(
      pacingState([accelerated, supported]),
      ["mass-units"],
    ).profile.mode).toBe("supported")
  })

  it("promotes, repeats, or demotes only the next unseen difficulty without mutating the snapshot", () => {
    const initial = lessonTask(["foundation", "foundation", "exam"])
    const independent = result("lesson:1", "mass-units", true, {
      difficultyBand: "foundation",
    })
    const promoted = adaptLessonTaskAfterQuestion(initial, [independent])

    expect(promoted).not.toBe(initial)
    expect(initial.generation?.difficultyBands).toEqual(["foundation", "foundation", "exam"])
    expect(promoted.generation?.difficultyBands).toEqual(["foundation", "standard", "exam"])

    const repeatInitial = lessonTask(["standard", "exam", "exam"])
    const corrected = result("lesson:corrected", "mass-units", false, {
      attempts: 2,
      solved: true,
    })
    expect(adaptLessonTaskAfterQuestion(
      repeatInitial,
      [corrected],
    ).generation?.difficultyBands).toEqual(["standard", "standard", "exam"])

    const assisted = result("lesson:assisted", "mass-units", false, {
      attempts: 1,
      hintsUsed: 1,
      solved: false,
    })
    expect(adaptLessonTaskAfterQuestion(
      repeatInitial,
      [assisted],
    ).generation?.difficultyBands).toEqual(["standard", "standard", "exam"])

    const unresolved = result("lesson:unresolved", "mass-units", false, {
      attempts: 1,
      solved: false,
    })
    expect(adaptLessonTaskAfterQuestion(
      repeatInitial,
      [unresolved],
    ).generation?.difficultyBands).toEqual(["standard", "foundation", "exam"])

    expect(repeatInitial.generation?.difficultyBands).toEqual(["standard", "exam", "exam"])
  })

  it("clamps promotions and demotions at the difficulty boundaries", () => {
    const examTask = lessonTask(["exam", "exam"])
    const independentExam = result("lesson:exam", "mass-units", true, {
      difficultyBand: "exam",
    })
    expect(adaptLessonTaskAfterQuestion(examTask, [independentExam])).toBe(examTask)

    const foundationTask = lessonTask(["foundation", "standard", "exam"])
    const unresolvedFoundation = result("lesson:foundation", "mass-units", false, {
      attempts: 1,
      solved: false,
      difficultyBand: "foundation",
    })
    expect(adaptLessonTaskAfterQuestion(
      foundationTask,
      [unresolvedFoundation],
    ).generation?.difficultyBands).toEqual(["foundation", "foundation", "exam"])
    expect(foundationTask.generation?.difficultyBands).toEqual([
      "foundation",
      "standard",
      "exam",
    ])
  })

  it("leaves foundation through the nearest band after two corrected questions", () => {
    let task = lessonTask(["foundation", "standard", "exam"])
    const completedResults = [
      pacingOutcomeResult(
        "lesson:steady:1",
        "mass-units",
        "foundation",
        "corrected",
      ),
    ]
    task = adaptLessonTaskAfterQuestion(task, completedResults)
    expect(task.generation?.difficultyBands).toEqual([
      "foundation",
      "foundation",
      "exam",
    ])

    completedResults.push(pacingOutcomeResult(
      "lesson:steady:2",
      "mass-units",
      "foundation",
      "corrected",
    ))
    task = adaptLessonTaskAfterQuestion(task, completedResults)

    expect(task.generation?.difficultyBands).toEqual([
      "foundation",
      "foundation",
      "standard",
    ])
  })

  it("leaves legacy, non-lesson, not-started, and completed task snapshots untouched", () => {
    const current = lessonTask(["foundation", "standard", "exam"])
    const completed = result("lesson:1", "mass-units", true, {
      difficultyBand: "foundation",
    })
    const legacy: LearningTask = { ...current, pacing: undefined }
    const withoutGeneration: LearningTask = { ...current, generation: undefined }

    expect(adaptLessonTaskAfterQuestion(legacy, [completed])).toBe(legacy)
    expect(adaptLessonTaskAfterQuestion(withoutGeneration, [completed])).toBe(withoutGeneration)
    expect(adaptLessonTaskAfterQuestion(current, [])).toBe(current)
    expect(adaptLessonTaskAfterQuestion(current, [
      completed,
      result("lesson:2", "mass-units", true),
      result("lesson:3", "mass-units", true),
    ])).toBe(current)

    const nonLessonKinds: Exclude<TaskKind, "lesson">[] = [
      "review",
      "assessment",
      "repair",
      "placement",
    ]
    for (const kind of nonLessonKinds) {
      const nonLesson: LearningTask = { ...current, kind }
      expect(adaptLessonTaskAfterQuestion(nonLesson, [completed]), kind).toBe(nonLesson)
    }
  })

  it("recognizes reachable snapshots across every pacing mode and rejects impossible paths", () => {
    const profiles: Array<{
      mode: LessonPacingMode
      questionCount: number
    }> = [
      { mode: "accelerated", questionCount: 2 },
      { mode: "steady", questionCount: 3 },
      { mode: "supported", questionCount: 3 },
      { mode: "supported", questionCount: 4 },
    ]

    for (const { mode, questionCount } of profiles) {
      const initialBands = lessonPacingDifficultyBands(mode, questionCount)!
      for (
        let completedQuestionCount = 0;
        completedQuestionCount < questionCount;
        completedQuestionCount += 1
      ) {
        for (const outcomes of outcomeSequences(completedQuestionCount)) {
          let task = lessonTask(initialBands, mode)
          const completedResults: QuestionResult[] = []
          for (const outcome of outcomes) {
            const questionIndex = completedResults.length
            const difficultyBand = task.generation!.difficultyBands[questionIndex]!
            completedResults.push(pacingOutcomeResult(
              `${mode}:${questionCount}:${questionIndex}`,
              "mass-units",
              difficultyBand,
              outcome,
            ))
            task = adaptLessonTaskAfterQuestion(task, completedResults)
          }

          expect(
            isReachableLessonPacingDifficultyBands(
              mode,
              questionCount,
              task.generation!.difficultyBands,
              completedQuestionCount,
            ),
            `${mode}:${questionCount}: ${outcomes.join(", ")}`,
          ).toBe(true)
          expect(
            lessonPacingTaskMatchesResults(task, completedResults),
            `${mode}:${questionCount}: ${outcomes.join(", ")}`,
          ).toBe(true)
        }
      }
    }

    expect(isReachableLessonPacingDifficultyBands(
      "steady",
      3,
      ["foundation", "foundation", "exam"],
      2,
    )).toBe(false)
    expect(isReachableLessonPacingDifficultyBands(
      "supported",
      4,
      ["foundation", "foundation", "foundation", "foundation"],
      2,
    )).toBe(false)

    const incoherentTask = lessonTask(
      ["foundation", "foundation", "standard"],
      "steady",
    )
    expect(lessonPacingTaskMatchesResults(incoherentTask, [
      pacingOutcomeResult(
        "steady:incoherent",
        "mass-units",
        "foundation",
        "corrected",
      ),
    ])).toBe(false)
  })

  it("preserves shown questions and unique deterministic replay for every reachable path and topic", () => {
    const sequences = representativeOutcomeSequences()

    for (const topicId of topicIds) {
      const realizedPaths = new Set<string>()

      for (const outcomes of sequences) {
        let task: LearningTask = {
          id: `lesson:${topicId}:adaptive-replay`,
          kind: "lesson",
          title: "Adaptive replay",
          description: "Adaptive replay",
          topicIds: [topicId],
          prerequisiteIds: [],
          maxXp: 25,
          questionCount: 4,
          seed: `lesson:${topicId}:adaptive-replay`,
          curriculum: { courseId: "zh-zap1-math", version: 1 },
          generation: {
            version: 5,
            difficultyBands: ["foundation", "foundation", "standard", "exam"],
          },
          pacing: { version: 1, mode: "supported" },
        }
        let questions = generateQuestionsForTask(task)
        const completedResults: QuestionResult[] = []

        for (const outcome of outcomes) {
          const questionIndex = completedResults.length
          const difficultyBand = task.generation!.difficultyBands[questionIndex]!
          const taskBeforeAdaptation = task
          const bandsBeforeAdaptation = [...task.generation!.difficultyBands]
          completedResults.push(pacingOutcomeResult(
            questions[questionIndex]!.id,
            topicId,
            difficultyBand,
            outcome,
          ))

          task = adaptLessonTaskAfterQuestion(task, completedResults)
          const regenerated = generateQuestionsForTask(task)

          expect(
            regenerated.slice(0, questionIndex + 1),
            `${topicId}: ${outcomes.join(", ")}`,
          ).toEqual(questions.slice(0, questionIndex + 1))
          expect(
            taskBeforeAdaptation.generation?.difficultyBands,
            `${topicId}: ${outcomes.join(", ")}`,
          ).toEqual(bandsBeforeAdaptation)
          questions = regenerated
        }

        realizedPaths.add(task.generation!.difficultyBands.join(","))
        expect(
          generateQuestionsForTask(structuredClone(task)),
          `${topicId}: ${outcomes.join(", ")}`,
        ).toEqual(questions)
        expect(
          new Set(questions.map((question) => question.prompt)).size,
          `${topicId}: ${outcomes.join(", ")}`,
        ).toBe(questions.length)
      }

      expect(realizedPaths.has("foundation,foundation,standard,standard"), topicId).toBe(true)
    }
  }, 60_000)

  it("keeps the maximum repeated-band path unique across a broad seed spread", () => {
    for (const topicId of topicIds) {
      for (let seedIndex = 0; seedIndex < 100; seedIndex += 1) {
        const task: LearningTask = {
          id: `lesson:${topicId}:repeat-stress:${seedIndex}`,
          kind: "lesson",
          title: "Adaptive repeat stress",
          description: "Adaptive repeat stress",
          topicIds: [topicId],
          prerequisiteIds: [],
          maxXp: 25,
          questionCount: 4,
          seed: `lesson:${topicId}:repeat-stress:${seedIndex}`,
          curriculum: { courseId: "zh-zap1-math", version: 1 },
          generation: {
            version: 5,
            difficultyBands: [
              "foundation",
              "foundation",
              "standard",
              "standard",
            ],
          },
          pacing: { version: 1, mode: "supported" },
        }
        const questions = generateQuestionsForTask(task)

        expect(
          new Set(questions.map((question) => question.prompt)).size,
          `${topicId}: seed ${seedIndex}`,
        ).toBe(questions.length)
        expect(generateQuestionsForTask(structuredClone(task))).toEqual(questions)
      }
    }
  }, 60_000)

  it("accepts only the persisted count ranges for each pacing mode", () => {
    expect(isLessonPacingQuestionCount("accelerated", 2)).toBe(true)
    expect(isLessonPacingQuestionCount("steady", 3)).toBe(true)
    expect(isLessonPacingQuestionCount("supported", 3)).toBe(true)
    expect(isLessonPacingQuestionCount("supported", 4)).toBe(true)
    expect(isLessonPacingQuestionCount("accelerated", 3)).toBe(false)
    expect(isLessonPacingQuestionCount("steady", 4)).toBe(false)
    expect(isLessonPacingQuestionCount("supported", 2)).toBe(false)
  })
})
