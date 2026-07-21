import { describe, expect, it } from "vitest"
import { createSeededLearner } from "./learningEngine"
import type { LearningEvent, TaskKind } from "./model"
import { buildPilotEvidence } from "./pilotEvidence"

const now = new Date("2026-07-20T12:00:00.000Z")

function event(
  id: string,
  completedAt: string,
  options: {
    kind?: TaskKind
    independent?: number
    questions?: number
  } = {},
): LearningEvent {
  const questions = options.questions ?? 2
  const independent = options.independent ?? questions
  return {
    id,
    taskId: `${options.kind ?? "review"}:mass-units:${id}`,
    taskKind: options.kind ?? "review",
    topicIds: ["mass-units"],
    completedAt,
    activeSeconds: questions * 90,
    mistakes: questions - independent,
    hintsUsed: 0,
    independentlyCompleted: independent === questions,
    questionResults: Array.from({ length: questions }, (_, index) => ({
      questionId: `${id}:question:${index}`,
      topicId: "mass-units" as const,
      attempts: index < independent ? 1 : 2,
      hintsUsed: 0,
      activeSeconds: 90,
      independentlySolved: index < independent,
      difficultyBand: options.kind === "assessment" ? "exam" as const : "standard" as const,
    })),
  }
}

describe("three-week pilot evidence", () => {
  it("has a calm zero state and ignores placement or future-dated work", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      event("placement", "2026-07-01T10:00:00.000Z", { kind: "placement" }),
      event("future", "2026-08-01T10:00:00.000Z"),
    ]

    expect(buildPilotEvidence(learner, now)).toEqual({
      sessions: 0,
      activeSeconds: 0,
      activeDays: 0,
      calendarWeeks: 0,
      calendarCoverageMet: false,
      observedSpanDays: 0,
      questions: 0,
      independentQuestions: 0,
      independentRate: 0,
      learnerSignals: 0,
      weeks: [],
      assessments: [],
      assessmentComparison: "insufficient",
    })
  })

  it("groups real learning into Zurich calendar weeks and counts existing learner voice", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      // 00:30 on Monday in Zurich, despite still being Sunday in UTC.
      event("week-one", "2026-06-28T22:30:00.000Z", { independent: 1 }),
      event("week-two", "2026-07-06T09:00:00.000Z"),
      event("week-three-a", "2026-07-13T09:00:00.000Z"),
      event("week-three-b", "2026-07-15T09:00:00.000Z", { independent: 0 }),
    ]
    learner.learnerFeedback = [
      {
        id: "feedback:week-three-b",
        learningEventId: "week-three-b",
        taskId: "review:mass-units:week-three-b",
        taskKind: "review",
        topicIds: ["mass-units"],
        kind: "explanation-unclear",
        recordedAt: "2026-07-15T09:01:00.000Z",
      },
      {
        id: "feedback:future-clock",
        learningEventId: "week-two",
        taskId: "review:mass-units:week-two",
        taskKind: "review",
        topicIds: ["mass-units"],
        kind: "clear",
        recordedAt: "2026-08-01T09:01:00.000Z",
      },
    ]

    const evidence = buildPilotEvidence(learner, now)

    expect(evidence).toMatchObject({
      sessions: 4,
      activeDays: 4,
      calendarWeeks: 3,
      calendarCoverageMet: true,
      observedSpanDays: 17,
      questions: 8,
      independentQuestions: 5,
      independentRate: 63,
      learnerSignals: 1,
      firstCompletedAt: "2026-06-28T22:30:00.000Z",
      latestCompletedAt: "2026-07-15T09:00:00.000Z",
    })
    expect(evidence.weeks.map((week) => week.weekStartDateKey)).toEqual([
      "2026-06-29",
      "2026-07-06",
      "2026-07-13",
    ])
    expect(evidence.weeks.at(-1)).toMatchObject({
      activeDays: 2,
      sessions: 2,
      questions: 4,
      independentQuestions: 2,
      independentRate: 50,
      learnerSignals: 1,
    })
  })

  it("compares first and latest assessment observations without calling them improvement", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      event("assessment-one", "2026-07-01T09:00:00.000Z", {
        kind: "assessment",
        questions: 6,
        independent: 2,
      }),
      event("assessment-two", "2026-07-15T09:00:00.000Z", {
        kind: "assessment",
        questions: 6,
        independent: 4,
      }),
    ]

    const evidence = buildPilotEvidence(learner, now)

    expect(evidence.assessments).toEqual([
      {
        eventId: "assessment-one",
        completedAt: "2026-07-01T09:00:00.000Z",
        questions: 6,
        independentQuestions: 2,
        independentRate: 33,
      },
      {
        eventId: "assessment-two",
        completedAt: "2026-07-15T09:00:00.000Z",
        questions: 6,
        independentQuestions: 4,
        independentRate: 67,
      },
    ])
    expect(evidence.assessmentComparison).toBe("higher")
    expect(evidence.assessmentChangePoints).toBe(34)
  })

  it("reports equal and lower assessment observations literally", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      event("first", "2026-07-01T09:00:00.000Z", { kind: "assessment", independent: 1 }),
      event("same", "2026-07-08T09:00:00.000Z", { kind: "assessment", independent: 1 }),
    ]
    expect(buildPilotEvidence(learner, now).assessmentComparison).toBe("same")

    learner.learningEvents.push(
      event("lower", "2026-07-15T09:00:00.000Z", { kind: "assessment", independent: 0 }),
    )
    expect(buildPilotEvidence(learner, now)).toMatchObject({
      assessmentComparison: "lower",
      assessmentChangePoints: -50,
    })
  })
})
