import type {
  LearnerState,
  LearningEvent,
  LearningTask,
  QuestionResult,
  TopicId,
} from "./model"

export interface AssessmentTopicOutcome {
  topicId: TopicId
  correct: number
  total: number
  status: "secure" | "review"
  reviewDueAt?: string
}

export interface AssessmentReport {
  correct: number
  total: number
  percentage: number
  secureTopicIds: TopicId[]
  reviewTopicIds: TopicId[]
  topicOutcomes: AssessmentTopicOutcome[]
}

export function isSecureAssessmentResult(result: QuestionResult): boolean {
  return (
    result.independentlySolved &&
    result.attempts === 1 &&
    result.hintsUsed === 0
  )
}

/**
 * Produces the learner-facing report from the same evidence used by the
 * scheduler. A topic is secure only when every sampled question was solved
 * independently; one miss schedules that topic for review.
 */
export function buildAssessmentReport(
  task: LearningTask,
  event: LearningEvent,
  learner?: LearnerState,
): AssessmentReport {
  if (task.kind !== "assessment" || event.taskKind !== "assessment") {
    throw new Error("Assessment reports require an assessment task and event.")
  }
  if (event.taskId !== task.id) {
    throw new Error("The assessment event does not belong to this task.")
  }

  const topicOutcomes = task.topicIds.map((topicId): AssessmentTopicOutcome => {
    const results = event.questionResults.filter((result) => result.topicId === topicId)
    const correct = results.filter(isSecureAssessmentResult).length
    const secure = results.length > 0 && correct === results.length

    return {
      topicId,
      correct,
      total: results.length,
      status: secure ? "secure" : "review",
      reviewDueAt: secure ? undefined : learner?.mastery[topicId].dueAt,
    }
  })

  const correct = event.questionResults.filter(isSecureAssessmentResult).length
  const total = event.questionResults.length

  return {
    correct,
    total,
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
    secureTopicIds: topicOutcomes
      .filter((outcome) => outcome.status === "secure")
      .map((outcome) => outcome.topicId),
    reviewTopicIds: topicOutcomes
      .filter((outcome) => outcome.status === "review")
      .map((outcome) => outcome.topicId),
    topicOutcomes,
  }
}
