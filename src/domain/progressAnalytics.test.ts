import { describe, expect, it } from "vitest"
import { createInitialLearner } from "./learningEngine"
import type { LearningEvent, TaskKind, TopicId } from "./model"
import { buildProgressAnalytics } from "./progressAnalytics"

const now = new Date("2026-07-14T12:00:00.000Z")

function event(
  id: string,
  completedAt: string,
  taskKind: TaskKind,
  activeSeconds: number,
  topicId: TopicId,
  independent: boolean[],
): LearningEvent {
  return {
    id,
    taskId: `${taskKind}:${topicId}:${id}`,
    taskKind,
    topicIds: [topicId],
    completedAt,
    activeSeconds,
    mistakes: independent.filter((value) => !value).length,
    hintsUsed: 0,
    independentlyCompleted: independent.every(Boolean),
    questionResults: independent.map((value, index) => ({
      questionId: `${id}:${index}`,
      topicId,
      attempts: value ? 1 : 2,
      hintsUsed: 0,
      activeSeconds: Math.round(activeSeconds / independent.length),
      independentlySolved: value,
    })),
  }
}

describe("progress analytics", () => {
  it("builds a chronological seven-day activity series", () => {
    const learner = createInitialLearner(now)
    learner.learningEvents = [
      event("monday", "2026-07-13T10:00:00.000Z", "lesson", 600, "mass-units", [true, true, true]),
      event("today-review", "2026-07-14T08:00:00.000Z", "review", 240, "mass-units", [true, false]),
      event("today-assessment", "2026-07-14T09:00:00.000Z", "assessment", 360, "fraction-of-quantity", [true, false]),
      event("too-old", "2026-07-01T09:00:00.000Z", "lesson", 999, "mass-units", [true]),
    ]

    const analytics = buildProgressAnalytics(learner, now)

    expect(analytics.days).toHaveLength(7)
    expect(analytics.days.map((day) => day.dateKey)).toEqual([
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
    ])
    expect(analytics.days.at(-2)).toMatchObject({ activeSeconds: 600, sessions: 1 })
    expect(analytics.days.at(-1)).toMatchObject({ activeSeconds: 600, sessions: 2 })
  })

  it("summarizes time, task kinds, and independent evidence", () => {
    const learner = createInitialLearner(now)
    learner.learningEvents = [
      event("lesson", "2026-07-13T10:00:00.000Z", "lesson", 600, "mass-units", [true, true, true]),
      event("review", "2026-07-14T08:00:00.000Z", "review", 240, "mass-units", [true, false]),
      event("assessment", "2026-07-14T09:00:00.000Z", "assessment", 360, "fraction-of-quantity", [true, false]),
    ]

    const analytics = buildProgressAnalytics(learner, now)
    expect(analytics.activeSeconds).toBe(1200)
    expect(analytics.sessions).toBe(3)
    expect(analytics.questions).toBe(7)
    expect(analytics.independentQuestions).toBe(5)
    expect(analytics.independentRate).toBe(71)
    expect(analytics.lessons).toBe(1)
    expect(analytics.reviews).toBe(1)
    expect(analytics.assessments).toBe(1)
    expect(analytics.placements).toBe(0)
  })

  it("returns a calm zero state when there is no recent activity", () => {
    const analytics = buildProgressAnalytics(createInitialLearner(now), now)
    expect(analytics.activeSeconds).toBe(0)
    expect(analytics.sessions).toBe(0)
    expect(analytics.independentRate).toBe(0)
    expect(analytics.days.every((day) => day.activeSeconds === 0)).toBe(true)
  })

  it("counts placement separately from lessons, reviews, and assessments", () => {
    const learner = createInitialLearner(now)
    learner.learningEvents = [
      event("placement", "2026-07-14T08:00:00.000Z", "placement", 300, "mass-units", [true]),
    ]

    const analytics = buildProgressAnalytics(learner, now)

    expect(analytics.sessions).toBe(1)
    expect(analytics.placements).toBe(1)
    expect(analytics.lessons).toBe(0)
    expect(analytics.reviews).toBe(0)
    expect(analytics.assessments).toBe(0)
  })

  it("counts a lesson securing round with lessons instead of ordinary reviews", () => {
    const learner = createInitialLearner(now)
    const securingRound = event(
      "securing",
      "2026-07-14T08:00:00.000Z",
      "repair",
      180,
      "arithmetic-equations",
      [true, true],
    )
    securingRound.taskPurpose = "lesson-recovery"
    learner.learningEvents = [
      securingRound,
      event("refresh", "2026-07-14T09:00:00.000Z", "repair", 120, "mass-units", [true]),
    ]

    const analytics = buildProgressAnalytics(learner, now)

    expect(analytics.lessons).toBe(1)
    expect(analytics.reviews).toBe(1)
  })

  it("keeps consecutive civil days across Zurich daylight-saving changes", () => {
    const transitionNow = new Date("2026-03-29T22:30:00.000Z")
    const learner = createInitialLearner(transitionNow)
    learner.learningEvents = [
      event("dst-day", "2026-03-29T10:00:00.000Z", "review", 180, "mass-units", [true]),
    ]

    const analytics = buildProgressAnalytics(learner, transitionNow)

    expect(analytics.days.map((day) => day.dateKey)).toEqual([
      "2026-03-24",
      "2026-03-25",
      "2026-03-26",
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
      "2026-03-30",
    ])
    expect(analytics.days.at(-2)).toMatchObject({ activeSeconds: 180, sessions: 1 })
  })
})
