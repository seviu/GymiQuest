import type {
  DifficultyBand,
  LearningEvent,
  QuestionResult,
  TopicId,
  TopicMastery,
} from "./model"

export const LESSON_SUPPORTED_MASTERY_THRESHOLD = 0.6
export const LESSON_INDEPENDENT_MASTERY_THRESHOLD = 0.45

export interface MasteryObservation {
  supported: number
  independent: number
  questionCount: number
}

export function clampMastery(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 1_000) / 1_000
}

function difficultyWeight(difficultyBand: DifficultyBand | undefined): number {
  switch (difficultyBand) {
    case "foundation":
      return 0.8
    case "exam":
      return 1.2
    case "standard":
    default:
      return 1
  }
}

function isIndependentResult(result: QuestionResult): boolean {
  return result.independentlySolved && result.attempts === 1 && result.hintsUsed === 0
}

function supportedResultScore(result: QuestionResult): number {
  if (isIndependentResult(result)) return 1
  if (result.attempts <= 2 && result.hintsUsed <= 1) return 0.72
  if (result.attempts <= 3 && result.hintsUsed <= 2) return 0.55
  return 0.4
}

/**
 * Converts the saved per-question evidence into two deliberately separate
 * observations. Exam-like questions carry slightly more weight, but asking for
 * help still produces supported evidence instead of being treated as failure.
 */
export function observeTopicMastery(
  event: LearningEvent,
  topicId: TopicId,
): MasteryObservation {
  const results = event.questionResults.filter((result) => result.topicId === topicId)
  if (results.length === 0) {
    return { supported: 0, independent: 0, questionCount: 0 }
  }

  const totalWeight = results.reduce(
    (sum, result) => sum + difficultyWeight(result.difficultyBand),
    0,
  )
  const supported = results.reduce(
    (sum, result) => sum + supportedResultScore(result) * difficultyWeight(result.difficultyBand),
    0,
  ) / totalWeight
  const independent = results.reduce(
    (sum, result) => sum + (isIndependentResult(result) ? 1 : 0) * difficultyWeight(result.difficultyBand),
    0,
  ) / totalWeight

  return {
    supported: clampMastery(supported),
    independent: clampMastery(independent),
    questionCount: results.length,
  }
}

export function blendMasteryEvidence(
  mastery: Pick<TopicMastery, "supportedMastery" | "independentMastery">,
  observation: MasteryObservation,
  weight: number,
): void {
  if (observation.questionCount === 0) return
  mastery.supportedMastery = clampMastery(
    mastery.supportedMastery + (observation.supported - mastery.supportedMastery) * weight,
  )
  mastery.independentMastery = clampMastery(
    mastery.independentMastery +
      (observation.independent - mastery.independentMastery) * weight,
  )
}

export function lessonPerformanceMisses(event: LearningEvent): number {
  const assistedQuestions = event.questionResults.filter(
    (result) => !isIndependentResult(result),
  ).length
  return Math.max(event.mistakes, assistedQuestions)
}

export function lessonEvidenceIsSecure(
  mastery: Pick<TopicMastery, "supportedMastery" | "independentMastery">,
  event: LearningEvent,
): boolean {
  return (
    lessonPerformanceMisses(event) <= 1 &&
    mastery.supportedMastery >= LESSON_SUPPORTED_MASTERY_THRESHOLD &&
    mastery.independentMastery >= LESSON_INDEPENDENT_MASTERY_THRESHOLD
  )
}

export function recoveryEvidenceIsSecure(event: LearningEvent, topicId: TopicId): boolean {
  const results = event.questionResults.filter((result) => result.topicId === topicId)
  return results.length > 0 && results.every(isIndependentResult)
}
