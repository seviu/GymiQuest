import { generateQuestionsForTask } from "./generators"
import type {
  GeneratedQuestion,
  LearnerState,
  LearningEvent,
  LearningTask,
  QuestionResult,
} from "./model"

export type SessionReviewOutcome =
  | "independent"
  | "corrected"
  | "assisted"
  | "unresolved"
  | "not-assessable"

export type SessionReviewEvidenceStatus = "earned" | "missed" | "not-assessable"
export type SessionReviewTiming = "faster" | "typical" | "slower" | "no-baseline"

export interface SessionReviewMilestone {
  id: string
  label: string
  status: SessionReviewEvidenceStatus
}

export interface SessionReviewItem {
  index: number
  question: GeneratedQuestion
  result: QuestionResult
  outcome: SessionReviewOutcome
  finalAnswerStatus: SessionReviewEvidenceStatus
  milestones: SessionReviewMilestone[]
  timing: SessionReviewTiming
  baselineSeconds?: number
}

export interface SessionReview {
  items: SessionReviewItem[]
  recommendedItemIndex?: number
}

export const SESSION_TIME_BASELINE_MINIMUM = 3

function outcomeForResult(result: QuestionResult): SessionReviewOutcome {
  if (result.independentlySolved) return "independent"

  const solved = result.solved ?? result.diagnostic?.resolved
  if (solved === true) return result.hintsUsed > 0 ? "assisted" : "corrected"
  if (solved === false) return result.hintsUsed > 0 ? "assisted" : "unresolved"

  // Before privacy-safe solved evidence was introduced, a non-independent
  // result without a diagnostic did not distinguish correction from a viewed
  // solution. Do not manufacture certainty for those historical events.
  return "not-assessable"
}

function finalAnswerStatus(result: QuestionResult): SessionReviewEvidenceStatus {
  if (result.independentlySolved) return "earned"
  const solved = result.solved ?? result.diagnostic?.resolved
  if (solved === true) return "earned"
  if (solved === false) return "missed"
  return "not-assessable"
}

function median(values: number[]): number {
  const ordered = [...values].sort((left, right) => left - right)
  const middle = Math.floor(ordered.length / 2)
  if (ordered.length % 2 === 1) return ordered[middle]!
  return (ordered[middle - 1]! + ordered[middle]!) / 2
}

function timingForResult(
  result: QuestionResult,
  event: LearningEvent,
  learner: LearnerState,
): Pick<SessionReviewItem, "timing" | "baselineSeconds"> {
  const topicHistory = learner.learningEvents
    .filter((historical) => historical.id !== event.id)
    .flatMap((historical) => historical.questionResults)
    .filter((historical) => (
      historical.topicId === result.topicId &&
      historical.activeSeconds > 0
    ))
  const sameBandHistory = result.difficultyBand
    ? topicHistory.filter((historical) => historical.difficultyBand === result.difficultyBand)
    : []
  const comparison = sameBandHistory.length >= SESSION_TIME_BASELINE_MINIMUM
    ? sameBandHistory
    : topicHistory

  if (comparison.length < SESSION_TIME_BASELINE_MINIMUM) {
    return { timing: "no-baseline" }
  }

  const baselineSeconds = Math.max(1, Math.round(median(
    comparison.map((historical) => historical.activeSeconds),
  )))
  if (result.activeSeconds <= baselineSeconds * 0.67) {
    return { timing: "faster", baselineSeconds }
  }
  if (result.activeSeconds >= baselineSeconds * 1.5) {
    return { timing: "slower", baselineSeconds }
  }
  return { timing: "typical", baselineSeconds }
}

function milestonesForQuestion(
  question: GeneratedQuestion,
  result: QuestionResult,
  finalAnswerLabel: string,
): SessionReviewMilestone[] {
  const structuredSteps = question.practiceSteps?.map((step): SessionReviewMilestone => ({
    id: step.id,
    label: step.label,
    status: result.verifiedStepIds === undefined
      ? "not-assessable"
      : result.verifiedStepIds.includes(step.id)
        ? "earned"
        : "missed",
  })) ?? []

  return [
    ...structuredSteps,
    {
      id: `${question.id}:final-answer`,
      label: finalAnswerLabel,
      status: finalAnswerStatus(result),
    },
  ]
}

const recommendationPriority: Record<SessionReviewOutcome, number> = {
  unresolved: 0,
  assisted: 1,
  corrected: 2,
  "not-assessable": 3,
  independent: 4,
}

/**
 * Rebuilds deterministic questions and joins them with bounded result
 * evidence. Ordinary learning rounds do not retain wrong entries; silent
 * assessments may carry a bounded submittedAnswer for the explicit
 * post-submission mistake comparison.
 */
export function buildSessionReview(
  task: LearningTask,
  event: LearningEvent,
  learner: LearnerState,
): SessionReview {
  const questions = generateQuestionsForTask(task)
  const resultsById = new Map(event.questionResults.map((result) => [result.questionId, result]))
  const items = questions.flatMap((question, index): SessionReviewItem[] => {
    const result = resultsById.get(question.id) ?? event.questionResults[index]
    if (!result) return []
    return [{
      index,
      question,
      result,
      outcome: outcomeForResult(result),
      finalAnswerStatus: finalAnswerStatus(result),
      milestones: milestonesForQuestion(
        question,
        result,
        task.contentLocale === "en"
          ? "Final answer"
          : task.contentLocale === "it"
            ? "Risposta finale"
            : task.contentLocale === "es"
              ? "Respuesta final"
              : "Endergebnis",
      ),
      ...timingForResult(result, event, learner),
    }]
  })
  const recommendedItemIndex = items
    .map((item, index) => ({ index, priority: recommendationPriority[item.outcome] }))
    .sort((left, right) => left.priority - right.priority || left.index - right.index)
    .find((candidate) => candidate.priority < recommendationPriority.independent)?.index

  return {
    items,
    ...(recommendedItemIndex === undefined ? {} : { recommendedItemIndex }),
  }
}
