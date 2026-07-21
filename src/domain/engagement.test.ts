import { describe, expect, it } from "vitest"
import {
  achievementsUnlockedAt,
  buildAchievements,
  buildCheckpointTrail,
  buildDailyQuest,
  buildExpeditionCollection,
} from "./engagement"
import { buildAssignments, createSeededLearner, recordCompletion } from "./learningEngine"
import type { LearningEvent, TaskKind, TopicId } from "./model"
import { createActiveMockExam, gradeMockExam } from "./mockExam"

const now = new Date("2026-07-14T10:00:00.000Z")

function event(
  id: string,
  taskKind: TaskKind,
  completedAt: string,
  options: { corrected?: boolean; independent?: number; topicId?: TopicId } = {},
): LearningEvent {
  const topicId = options.topicId ?? "mass-units"
  const independent = options.independent ?? 2
  return {
    id,
    taskId: `${taskKind}:${id}`,
    taskKind,
    topicIds: [topicId],
    completedAt,
    activeSeconds: 300,
    mistakes: options.corrected ? 1 : 0,
    hintsUsed: 0,
    independentlyCompleted: independent === 2,
    questionResults: [0, 1].map((index) => ({
      questionId: `${id}:question:${index}`,
      topicId,
      attempts: options.corrected && index === 0 ? 2 : 1,
      hintsUsed: 0,
      activeSeconds: 150,
      independentlySolved: index < independent && !(options.corrected && index === 0),
    })),
  }
}

describe("local engagement layer", () => {
  it("builds a daily quest from real completed and remaining work", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      event("today-review", "review", "2026-07-14T08:30:00.000Z"),
      event("yesterday-review", "review", "2026-07-13T20:30:00.000Z"),
    ]
    const remainingLesson = buildAssignments(learner, now).find((task) => task.kind === "lesson")!
    const quest = buildDailyQuest(learner, [remainingLesson], now)

    expect(quest.dateKey).toBe("2026-07-14")
    expect(quest.isRestDay).toBe(false)
    expect(quest.completedGoals).toBe(1)
    expect(quest.goals.find((goal) => goal.id === "round")).toMatchObject({
      current: 1,
      target: 1,
      complete: true,
    })
    expect(quest.goals.find((goal) => goal.id === "questions")).toMatchObject({
      current: 2,
      target: 3,
      complete: false,
    })
    expect(quest.goals.find((goal) => goal.id === "active-time")).toMatchObject({
      current: 300,
      target: 840,
      complete: false,
    })
  })

  it("turns a day with no available work into a rest day instead of a lost streak", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = []
    const quest = buildDailyQuest(learner, [], now)

    expect(quest.isRestDay).toBe(true)
    expect(quest.completedGoals).toBe(0)
    expect(quest.goals.every((goal) => goal.target === 0 && goal.complete)).toBe(true)
  })

  it("caps the active-time quest at the learner's chosen normal session length", () => {
    const learner = createSeededLearner(now)
    learner.preferences.sessionMinutes = 10
    learner.learningEvents = []
    const tasks = buildAssignments(learner, now)

    const quest = buildDailyQuest(learner, tasks, now)

    expect(quest.goals.find((goal) => goal.id === "active-time")?.target).toBe(600)
  })

  it("unlocks badges from durable learning evidence without awarding currency", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = Array.from({ length: 5 }, (_, index) =>
      event(
        `review-${index + 1}`,
        "review",
        `2026-07-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
        { corrected: index === 0 },
      ))
    learner.learningEvents.push(
      event("assessment-1", "assessment", "2026-07-06T10:00:00.000Z"),
    )
    for (const [index, topicId] of ([
      "arithmetic-equations",
      "efficient-arithmetic",
      "time-fractions",
    ] as TopicId[]).entries()) {
      learner.mastery[topicId] = {
        ...learner.mastery[topicId],
        status: "mastered",
        masteredAt: `2026-06-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
      }
    }
    const mock = gradeMockExam(
      createActiveMockExam("achievement:mock", now),
      "submitted",
      new Date("2026-07-07T11:00:00.000Z"),
    )
    learner.mockHistory.push(mock)

    const achievements = buildAchievements(learner)
    const byId = Object.fromEntries(achievements.map((item) => [item.id, item]))

    expect(byId["first-round"]).toMatchObject({ unlocked: true, current: 1 })
    expect(byId["self-correction"]).toMatchObject({ unlocked: true, current: 1 })
    expect(byId["five-reviews"]).toMatchObject({ unlocked: true, current: 5 })
    expect(byId["independent-ten"]).toMatchObject({ unlocked: true, current: 10 })
    expect(byId["first-assessment"]).toMatchObject({ unlocked: true })
    expect(byId["first-mock"]).toMatchObject({ unlocked: true })
    expect(byId["five-topics"]).toMatchObject({ unlocked: true, current: 5 })
    expect(byId["course-complete"]).toMatchObject({ unlocked: false, current: 5 })
    const expedition = buildExpeditionCollection(learner)
    expect(expedition.unlockedChapters).toBe(7)
    expect(expedition.chapters.find((chapter) => chapter.id === "summit")).toMatchObject({
      unlocked: false,
      current: 5,
      target: 23,
    })
    expect(learner.totalXp).toBe(0)
    expect(learner.xpLedger).toHaveLength(0)
  })

  it("opens collection items from the existing XP ledger without creating another currency", () => {
    const learner = createSeededLearner(now)
    learner.totalXp = 179
    const original = structuredClone(learner)

    const expedition = buildExpeditionCollection(learner)

    expect(expedition.totalXp).toBe(179)
    expect(expedition.unlockedCollectibles).toBe(3)
    expect(expedition.collectibles.filter((item) => item.unlocked).map((item) => item.id)).toEqual([
      "route-map",
      "compass",
      "notebook",
    ])
    expect(expedition.nextCollectible).toMatchObject({
      id: "lantern",
      xpRequired: 180,
      currentXp: 179,
      unlocked: false,
    })
    expect(expedition.xpToNext).toBe(1)
    expect(learner).toEqual(original)
  })

  it("keeps review-only progress eligible for the long-term collection", () => {
    const learner = createSeededLearner(now)
    learner.totalXp = 996
    const review = buildAssignments(learner, now).find((task) => task.kind === "review")!
    const result = recordCompletion(learner, review, {
      id: `event:${review.id}:collection-unlock`,
      taskId: review.id,
      taskKind: review.kind,
      taskPurpose: review.purpose,
      topicIds: review.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: review.questionCount * 30,
      mistakes: review.questionCount,
      hintsUsed: review.questionCount,
      independentlyCompleted: false,
      questionResults: Array.from({ length: review.questionCount }, (_, index) => ({
        questionId: `${review.id}:question:${index}`,
        topicId: review.topicIds[index % review.topicIds.length]!,
        attempts: 2,
        hintsUsed: 1,
        activeSeconds: 30,
        independentlySolved: false,
      })),
    })

    const expedition = buildExpeditionCollection(result.state)

    expect(result.award).toMatchObject({ totalXp: 4, reason: "review-complete" })
    expect(result.state.totalXp).toBe(1_000)
    expect(expedition.unlockedCollectibles).toBe(expedition.collectibles.length)
    expect(expedition.nextCollectible).toBeUndefined()
    expect(expedition.xpToNext).toBe(0)
    expect(expedition.collectibles.at(-1)).toMatchObject({
      id: "star-map",
      unlocked: true,
      xpRequired: 1_000,
    })
  })

  it("links the latest checkpoint misses to completed and teacher-paused return steps", () => {
    const learner = createSeededLearner(now)
    const assessmentCompletedAt = "2026-07-14T08:00:00.000Z"
    const completedReviewAt = "2026-07-14T09:00:00.000Z"
    learner.learningEvents = [
      {
        id: "event:assessment:3",
        taskId: "assessment:3",
        taskKind: "assessment",
        topicIds: ["mass-units", "time-fractions", "inverse-proportion"],
        completedAt: assessmentCompletedAt,
        activeSeconds: 480,
        mistakes: 2,
        hintsUsed: 0,
        independentlyCompleted: false,
        questionResults: [
          {
            questionId: "assessment:3:mass",
            topicId: "mass-units",
            attempts: 1,
            hintsUsed: 0,
            activeSeconds: 120,
            independentlySolved: true,
          },
          {
            questionId: "assessment:3:time",
            topicId: "time-fractions",
            attempts: 2,
            hintsUsed: 0,
            activeSeconds: 180,
            independentlySolved: false,
          },
          {
            questionId: "assessment:3:inverse",
            topicId: "inverse-proportion",
            attempts: 2,
            hintsUsed: 0,
            activeSeconds: 180,
            independentlySolved: false,
          },
        ],
      },
      event("checkpoint-time-review", "review", completedReviewAt, {
        topicId: "time-fractions",
      }),
    ]
    learner.topicHelpRequests = [{
      topicId: "inverse-proportion",
      requestedAt: "2026-07-14T09:30:00.000Z",
    }]
    const original = structuredClone(learner)

    const trail = buildCheckpointTrail(learner)

    expect(trail).toMatchObject({
      assessmentNumber: 3,
      assessmentCompletedAt,
      assessedTopics: 3,
      secureTopics: 1,
      recoveryTopics: 2,
      completedRecoveryTopics: 1,
      pausedRecoveryTopics: 1,
      complete: false,
    })
    expect(trail?.steps).toEqual([
      {
        topicId: "time-fractions",
        status: "complete",
        completedAt: completedReviewAt,
      },
      {
        topicId: "inverse-proportion",
        status: "paused",
      },
    ])
    expect(learner).toEqual(original)
  })

  it("lets the newest secure checkpoint replace an older completed return trail", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      {
        ...event("older-check", "assessment", "2026-07-10T08:00:00.000Z", {
          topicId: "mass-units",
          corrected: true,
        }),
        taskId: "assessment:1",
      },
      {
        ...event("new-check", "assessment", "2026-07-14T08:00:00.000Z", {
          topicId: "time-fractions",
        }),
        taskId: "assessment:2",
      },
    ]

    expect(buildCheckpointTrail(learner)).toMatchObject({
      assessmentNumber: 2,
      assessedTopics: 1,
      secureTopics: 1,
      recoveryTopics: 0,
      completedRecoveryTopics: 0,
      complete: true,
      steps: [],
    })
  })

  it("has no checkpoint trail before the first periodic assessment", () => {
    expect(buildCheckpointTrail(createSeededLearner(now))).toBeUndefined()
  })

  it("identifies only badges unlocked by the just-completed event", () => {
    const learner = createSeededLearner(now)
    const completedAt = "2026-07-14T09:00:00.000Z"
    learner.learningEvents = [
      event("first-corrected", "review", completedAt, { corrected: true }),
    ]

    expect(achievementsUnlockedAt(learner, completedAt).map((item) => item.id)).toEqual([
      "first-round",
      "self-correction",
    ])
  })
})
