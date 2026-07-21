import {
  learnerFeedbackCopyForLanguage,
  type LearnerFeedbackCopy,
} from "../domain/learnerFeedback"
import type { LearnerFeedbackKind, LearningLocale } from "../domain/model"

export function learnerFeedbackCopyForLocale(
  locale: LearningLocale,
): Record<LearnerFeedbackKind, LearnerFeedbackCopy> {
  return learnerFeedbackCopyForLanguage(locale)
}
