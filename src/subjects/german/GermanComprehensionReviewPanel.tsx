import { useEffect, useMemo, useState } from "react"
import { useLocalization } from "../../i18n/localization"
import {
  germanComprehensionPassage,
  germanComprehensionPromptById,
  type GermanComprehensionEvidenceStatus,
  type GermanComprehensionResult,
  type GermanComprehensionReview,
} from "./comprehension"
import { germanComprehensionReviewUiCopy } from "./comprehensionReviewCopy"

function ReviewCard({
  result,
  review,
  onSave,
}: {
  result: GermanComprehensionResult
  review?: GermanComprehensionReview
  onSave: (
    resultId: string,
    status: GermanComprehensionEvidenceStatus,
    strength: string,
    nextStep: string,
  ) => void
}) {
  const { locale } = useLocalization()
  const copy = germanComprehensionReviewUiCopy[locale]
  const prompt = germanComprehensionPromptById(result.promptId)
  const passage = germanComprehensionPassage(result.promptId)
  const [status, setStatus] = useState<GermanComprehensionEvidenceStatus>(review?.evidenceStatus ?? "partly-supported")
  const [strength, setStrength] = useState(review?.strength ?? "")
  const [nextStep, setNextStep] = useState(review?.nextStep ?? "")
  useEffect(() => {
    setStatus(review?.evidenceStatus ?? "partly-supported")
    setStrength(review?.strength ?? "")
    setNextStep(review?.nextStep ?? "")
  }, [review])
  if (!prompt || !passage) return null
  const state = review?.resolvedAt ? "resolved" : review ? "reviewed" : "pending"
  const disabled = Boolean(review?.resolvedAt)
  return (
    <article className={`german-comprehension-review-item ${state}`}>
      <header>
        <div><small>{copy.prompt}</small><h3>{prompt.question}</h3></div>
        <span>{state === "pending" ? copy.pending : state === "reviewed" ? copy.reviewed : copy.resolved}</span>
      </header>
      <details open={state !== "resolved"}>
        <summary>{passage.title}</summary>
        <div className="german-comprehension-review-body">
          <section className="german-comprehension-review-passage">
            {passage.lines.map((line) => (
              <p key={line.number} className={result.evidenceLines.includes(line.number) ? "selected" : ""}>
                <strong>{line.number}</strong><span>{line.text}</span>
              </p>
            ))}
            <small>{copy.selectedEvidence(result.evidenceLines)}</small>
          </section>
          <section>
            <h4>{copy.learnerResponse}</h4>
            <p className="german-comprehension-review-response">{result.response}</p>
          </section>
          <details className="german-comprehension-review-guide">
            <summary>{copy.reviewGuide}</summary>
            <h4>{copy.expectedElements}</h4>
            <ul>{prompt.expectedElements.map((element) => <li key={element}>{element}</li>)}</ul>
            <p>{copy.suggestedLines(prompt.suggestedEvidenceLines)}</p>
          </details>
          <fieldset disabled={disabled}>
            <legend>{copy.statusLegend}</legend>
            {(Object.keys(copy.statuses) as GermanComprehensionEvidenceStatus[]).map((candidate) => (
              <label key={candidate}>
                <input
                  type="radio"
                  name={`comprehension-status-${result.id}`}
                  value={candidate}
                  checked={status === candidate}
                  onChange={() => setStatus(candidate)}
                />
                <span>{copy.statuses[candidate]}</span>
              </label>
            ))}
          </fieldset>
          <div className="german-comprehension-review-fields">
            <label>{copy.strength}<small>{copy.strengthHint}</small><textarea disabled={disabled} maxLength={300} value={strength} onChange={(event) => setStrength(event.currentTarget.value)} /></label>
            <label>{copy.nextStep}<small>{copy.nextStepHint}</small><textarea disabled={disabled} maxLength={300} value={nextStep} onChange={(event) => setNextStep(event.currentTarget.value)} /></label>
          </div>
          <p className="german-writing-no-grade"><strong>{copy.boundary}</strong></p>
          <div className="german-comprehension-review-save">
            <span>{review ? copy.saved : ""}</span>
            <button
              className="primary-button"
              type="button"
              disabled={disabled || strength.trim().length < 2 || nextStep.trim().length < 2}
              onClick={() => onSave(result.id, status, strength, nextStep)}
            >{copy.save}</button>
          </div>
        </div>
      </details>
    </article>
  )
}

export function GermanComprehensionReviewPanel({
  results,
  reviews,
  onSave,
}: {
  results: readonly GermanComprehensionResult[]
  reviews: readonly GermanComprehensionReview[]
  onSave: (
    resultId: string,
    status: GermanComprehensionEvidenceStatus,
    strength: string,
    nextStep: string,
  ) => void
}) {
  const { locale } = useLocalization()
  const copy = germanComprehensionReviewUiCopy[locale]
  const reviewByResult = new Map(reviews.map((review) => [review.resultId, review]))
  const ordered = useMemo(() => [...results].sort((left, right) => {
    const rank = (result: GermanComprehensionResult) => {
      const review = reviewByResult.get(result.id)
      return !review ? 0 : !review.resolvedAt ? 1 : 2
    }
    return rank(left) - rank(right) || Date.parse(right.submittedAt) - Date.parse(left.submittedAt)
  }), [results, reviews])
  return (
    <section className="parent-panel german-comprehension-review-panel" aria-labelledby="german-comprehension-review-title">
      <header>
        <div><span>{copy.eyebrow}</span><h2 id="german-comprehension-review-title">{copy.title}</h2><p>{copy.body}</p></div>
        <strong>{results.length}</strong>
      </header>
      {ordered.length === 0 ? <p>{copy.empty}</p> : (
        <div className="german-comprehension-review-list">
          {ordered.map((result) => (
            <ReviewCard key={result.id} result={result} review={reviewByResult.get(result.id)} onSave={onSave} />
          ))}
        </div>
      )}
    </section>
  )
}
