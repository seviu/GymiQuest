import { describe, expect, it } from "vitest"
import { createSeededLearner } from "./learningEngine"
import type { LearningEvent, LearningTask, QuestionResult, TopicId } from "./model"
import { buildAssessmentReport, isSecureAssessmentResult } from "./assessmentReport"

const task: LearningTask = {
  id: "assessment:3",
  kind: "assessment",
  title: "Standortbestimmung 3",
  description: "Gemischte Standortbestimmung",
  topicIds: ["mass-units", "fraction-of-quantity"],
  prerequisiteIds: [],
  maxXp: 10,
  questionCount: 6,
  seed: "assessment:learner:3",
  assessmentNumber: 3,
}

function result(
  topicId: TopicId,
  index: number,
  secure = true,
): QuestionResult {
  return {
    questionId: `${topicId}:${index}`,
    topicId,
    attempts: 1,
    hintsUsed: 0,
    activeSeconds: 20,
    independentlySolved: secure,
  }
}

function event(questionResults: QuestionResult[]): LearningEvent {
  return {
    id: "event:assessment:3",
    taskId: task.id,
    taskKind: "assessment",
    topicIds: task.topicIds,
    completedAt: "2026-07-14T12:00:00.000Z",
    activeSeconds: 120,
    mistakes: questionResults.filter((item) => !item.independentlySolved).length,
    hintsUsed: 0,
    independentlyCompleted: questionResults.every((item) => item.independentlySolved),
    questionResults,
  }
}

describe("assessment report", () => {
  it("uses one strict definition of secure assessment evidence", () => {
    expect(isSecureAssessmentResult(result("mass-units", 0))).toBe(true)
    expect(isSecureAssessmentResult({ ...result("mass-units", 1), attempts: 2 })).toBe(false)
    expect(isSecureAssessmentResult({ ...result("mass-units", 2), hintsUsed: 1 })).toBe(false)
  })

  it("groups results by topic and marks a whole topic for review after one miss", () => {
    const questionResults = [
      result("mass-units", 0),
      result("fraction-of-quantity", 0),
      result("mass-units", 1),
      result("fraction-of-quantity", 1, false),
      result("mass-units", 2),
      result("fraction-of-quantity", 2),
    ]
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    learner.mastery["fraction-of-quantity"].dueAt = "2026-07-14T12:00:00.000Z"

    const report = buildAssessmentReport(task, event(questionResults), learner)

    expect(report.correct).toBe(5)
    expect(report.total).toBe(6)
    expect(report.percentage).toBe(83)
    expect(report.secureTopicIds).toEqual(["mass-units"])
    expect(report.reviewTopicIds).toEqual(["fraction-of-quantity"])
    expect(report.topicOutcomes).toEqual([
      expect.objectContaining({ topicId: "mass-units", correct: 3, total: 3, status: "secure" }),
      expect.objectContaining({
        topicId: "fraction-of-quantity",
        correct: 2,
        total: 3,
        status: "review",
        reviewDueAt: "2026-07-14T12:00:00.000Z",
      }),
    ])
  })

  it("rejects non-assessment evidence", () => {
    expect(() => buildAssessmentReport({ ...task, kind: "review" }, event([]))).toThrow(
      /require an assessment/,
    )
  })
})
