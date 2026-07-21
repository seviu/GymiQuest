import { useLocalization } from "../../i18n/localization"
import type { GermanComprehensionResult, GermanComprehensionReview } from "./comprehension"
import { germanComprehensionUiCopy } from "./comprehensionCopy"

export function GermanComprehensionFeedbackCard({
  result,
  review,
  onResolve,
}: {
  result: GermanComprehensionResult
  review?: GermanComprehensionReview
  onResolve: (resultId: string) => void
}) {
  const { locale } = useLocalization()
  const copy = germanComprehensionUiCopy[locale]
  const resolved = Boolean(review?.resolvedAt)
  return (
    <article className={`german-comprehension-feedback-card ${review ? "reviewed" : "pending"} ${resolved ? "resolved" : ""}`}>
      <span className="eyebrow">{copy.homeEyebrow}</span>
      <h2>{resolved ? copy.resolvedTitle : review ? copy.feedbackTitle : copy.waitingTitle}</h2>
      {!review ? (
        <p>{copy.waitingBody}</p>
      ) : (
        <>
          <strong className="german-comprehension-status">{copy.status[review.evidenceStatus]}</strong>
          <div>
            <section><span>{copy.strength}</span><p>{review.strength}</p></section>
            <section><span>{copy.nextStep}</span><p>{review.nextStep}</p></section>
          </div>
          {resolved ? (
            <p>{copy.acknowledged}</p>
          ) : (
            <button className="primary-button" type="button" onClick={() => onResolve(result.id)}>
              {copy.acknowledge}
            </button>
          )}
        </>
      )}
      <small>{copy.noScore}</small>
    </article>
  )
}
