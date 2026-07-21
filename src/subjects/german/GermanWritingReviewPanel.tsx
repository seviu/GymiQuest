import { useEffect, useMemo, useState } from "react"
import { useLocalization } from "../../i18n/localization"
import {
  GERMAN_WRITING_MAX_FEEDBACK_LENGTH,
  buildGermanWritingForm,
  type GermanWritingHumanReview,
  type GermanWritingResult,
} from "./writing"
import { germanWritingReviewUiCopy } from "./writingReviewCopy"
import {
  germanWritingRevisionsForResult,
  type ActiveGermanWritingRevision,
  type GermanWritingRevisionSnapshot,
} from "./writingRevision"

function GermanWritingReviewCard({
  result,
  review,
  revisions,
  feedbackLocked,
  onSave,
}: {
  result: GermanWritingResult
  review?: GermanWritingHumanReview
  revisions: readonly GermanWritingRevisionSnapshot[]
  feedbackLocked: boolean
  onSave: (resultId: string, strength: string, nextStep: string) => void
}) {
  const { intlLocale, locale } = useLocalization()
  const copy = germanWritingReviewUiCopy[locale]
  const [strength, setStrength] = useState(review?.strength ?? "")
  const [nextStep, setNextStep] = useState(review?.nextStep ?? "")
  const [saved, setSaved] = useState(false)
  const prompt = useMemo(() => (
    buildGermanWritingForm(result.seed).prompts.find((candidate) => candidate.id === result.promptId)
  ), [result.promptId, result.seed])
  const submitted = new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(result.submittedAt))

  useEffect(() => {
    setStrength(review?.strength ?? "")
    setNextStep(review?.nextStep ?? "")
  }, [review?.nextStep, review?.strength])

  return (
    <article className={review ? "german-writing-review-item reviewed" : "german-writing-review-item"}>
      <header>
        <div>
          <small>{copy.submitted(submitted)}</small>
          <h3>{result.title || prompt?.title || copy.draft}</h3>
          <p>{copy.summary(result.wordCount, result.reviewChecks.length)}</p>
        </div>
        <span>{review ? `✓ ${copy.reviewed}` : copy.awaiting}</span>
      </header>
      <details open={!review}>
        <summary><strong>{copy.open}</strong><span aria-hidden="true">⌄</span></summary>
        <div className="german-writing-human-review-body">
          {prompt && (
            <section>
              <span className="eyebrow">{copy.prompt}</span>
              <h4>{prompt.title}</h4>
              <p>{prompt.prompt}</p>
              <ul>{prompt.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
            </section>
          )}
          <section>
            <span className="eyebrow">{copy.draft}</span>
            <div className="german-writing-human-review-draft">{result.draft || "—"}</div>
          </section>
          {revisions.length > 0 && (
            <section className="german-writing-companion-revisions">
              <span className="eyebrow">{copy.revisionHistory}</span>
              <h4>{copy.revisionHistory}</h4>
              <p>{copy.revisionHistoryBody}</p>
              <div>
                {revisions.map((revision) => (
                  <details key={revision.id}>
                    <summary>{copy.revisionSnapshot(
                      revision.revisionNumber,
                      new Intl.DateTimeFormat(intlLocale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(revision.savedAt)),
                    )}</summary>
                    <h5>{revision.title || "—"}</h5>
                    <small>{copy.revisionWordCount(revision.wordCount)}</small>
                    <div className="german-writing-human-review-draft">{revision.draft}</div>
                  </details>
                ))}
              </div>
            </section>
          )}
          <div className="german-writing-human-review-fields">
            <label>
              <strong>{copy.strength}</strong>
              <small>{copy.strengthHint}</small>
              <textarea
                value={strength}
                disabled={feedbackLocked}
                maxLength={GERMAN_WRITING_MAX_FEEDBACK_LENGTH}
                placeholder={copy.strengthPlaceholder}
                onChange={(event) => {
                  setStrength(event.currentTarget.value)
                  setSaved(false)
                }}
              />
            </label>
            <label>
              <strong>{copy.nextStep}</strong>
              <small>{copy.nextStepHint}</small>
              <textarea
                value={nextStep}
                disabled={feedbackLocked}
                maxLength={GERMAN_WRITING_MAX_FEEDBACK_LENGTH}
                placeholder={copy.nextStepPlaceholder}
                onChange={(event) => {
                  setNextStep(event.currentTarget.value)
                  setSaved(false)
                }}
              />
            </label>
          </div>
          <p className="german-writing-no-grade"><strong>{copy.boundary}</strong></p>
          {feedbackLocked && <p className="german-writing-review-locked"><strong>{copy.feedbackLocked}</strong></p>}
          <div className="german-writing-human-review-save">
            <button
              className="primary-button"
              type="button"
              disabled={feedbackLocked || !strength.trim() || !nextStep.trim()}
              onClick={() => {
                onSave(result.id, strength, nextStep)
                setSaved(true)
              }}
            >
              {copy.save}
            </button>
            <span aria-live="polite">{saved ? `✓ ${copy.saved}` : ""}</span>
          </div>
        </div>
      </details>
    </article>
  )
}

export function GermanWritingReviewPanel({
  results,
  reviews,
  revisions = [],
  activeRevision,
  onSave,
}: {
  results: readonly GermanWritingResult[]
  reviews: readonly GermanWritingHumanReview[]
  revisions?: readonly GermanWritingRevisionSnapshot[]
  activeRevision?: ActiveGermanWritingRevision
  onSave: (resultId: string, strength: string, nextStep: string) => void
}) {
  const { locale } = useLocalization()
  const copy = germanWritingReviewUiCopy[locale]
  const reviewByResultId = new Map(reviews.map((review) => [review.resultId, review]))
  const visibleResults = [...results]
    .sort((left, right) => {
      const leftReviewed = reviewByResultId.has(left.id) ? 1 : 0
      const rightReviewed = reviewByResultId.has(right.id) ? 1 : 0
      return leftReviewed - rightReviewed || Date.parse(right.submittedAt) - Date.parse(left.submittedAt)
    })
    .slice(0, 10)
  const pendingCount = results.filter((result) => !reviewByResultId.has(result.id)).length

  if (results.length === 0) return null

  return (
    <section className="parent-panel german-writing-human-review-panel" aria-labelledby="german-writing-human-review-title">
      <div className="parent-panel-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2 id="german-writing-human-review-title">{copy.title}</h2>
        </div>
        <span>{copy.pending(pendingCount)}</span>
      </div>
      <p className="parent-topic-help-intro">{copy.intro}</p>
      <div className="german-writing-human-review-list">
        {visibleResults.map((result) => {
          const resultRevisions = germanWritingRevisionsForResult(revisions, result.id)
          return (
            <GermanWritingReviewCard
              key={result.id}
              result={result}
              review={reviewByResultId.get(result.id)}
              revisions={resultRevisions}
              feedbackLocked={resultRevisions.length > 0 || activeRevision?.resultId === result.id}
              onSave={onSave}
            />
          )
        })}
      </div>
    </section>
  )
}
