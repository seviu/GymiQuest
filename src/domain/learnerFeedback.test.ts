import { describe, expect, it } from "vitest"
import { buildAssignments, createSeededLearner, recordCompletion } from "./learningEngine"
import { feedbackForEvent, recentLearnerFeedback, recordLearnerFeedback } from "./learnerFeedback"
import type { LearningEvent } from "./model"

const now = new Date("2026-07-14T12:00:00.000Z")

function completedReview() {
  const learner = createSeededLearner(now)
  const task = buildAssignments(learner, now).find((candidate) => candidate.kind === "review")!
  const event: LearningEvent = {
    id: "event:feedback:review",
    taskId: task.id,
    taskKind: task.kind,
    topicIds: task.topicIds,
    completedAt: now.toISOString(),
    activeSeconds: 90,
    mistakes: 2,
    hintsUsed: 1,
    independentlyCompleted: false,
    questionResults: task.topicIds.slice(0, task.questionCount).map((topicId, index) => ({
      questionId: `feedback:question:${index}`,
      topicId,
      attempts: index === 0 ? 3 : 1,
      hintsUsed: index === 0 ? 1 : 0,
      activeSeconds: 45,
      independentlySolved: index !== 0,
    })),
  }
  return { task, event, result: recordCompletion(learner, task, event) }
}

describe("learner feedback", () => {
  it("records one private post-round signal without changing learning or XP evidence", () => {
    const { event, result } = completedReview()
    const learningEvidence = {
      totalXp: result.state.totalXp,
      xpSinceAssessment: result.state.xpSinceAssessment,
      xpLedger: structuredClone(result.state.xpLedger),
      mastery: structuredClone(result.state.mastery),
      completedTaskIds: [...result.state.completedTaskIds],
    }

    const updated = recordLearnerFeedback(
      result.state,
      event.id,
      "explanation-unclear",
      new Date("2026-07-14T12:01:00.000Z"),
    )

    expect(feedbackForEvent(updated, event.id)).toMatchObject({
      id: `feedback:${event.id}`,
      taskId: event.taskId,
      taskKind: "review",
      topicIds: event.topicIds,
      kind: "explanation-unclear",
    })
    expect({
      totalXp: updated.totalXp,
      xpSinceAssessment: updated.xpSinceAssessment,
      xpLedger: updated.xpLedger,
      mastery: updated.mastery,
      completedTaskIds: updated.completedTaskIds,
    }).toEqual(learningEvidence)
  })

  it("is idempotent for repeated taps and ignores unknown event ids", () => {
    const { event, result } = completedReview()
    const first = recordLearnerFeedback(result.state, event.id, "more-practice", now)

    expect(recordLearnerFeedback(first, event.id, "clear", now)).toBe(first)
    expect(recordLearnerFeedback(first, "event:missing", "too-much", now)).toBe(first)
    expect(first.learnerFeedback).toHaveLength(1)
    expect(first.learnerFeedback[0]!.kind).toBe("more-practice")
  })

  it("returns only recent bounded feedback for coaching summaries", () => {
    const { event, result } = completedReview()
    const recent = recordLearnerFeedback(result.state, event.id, "question-unclear", now)
    recent.learnerFeedback.unshift({
      id: "feedback:old",
      learningEventId: "event:old",
      taskId: "review:old",
      taskKind: "review",
      topicIds: ["mass-units"],
      kind: "clear",
      recordedAt: "2026-05-01T12:00:00.000Z",
    })

    expect(recentLearnerFeedback(recent, now)).toEqual([
      expect.objectContaining({ kind: "question-unclear" }),
    ])
  })
})
