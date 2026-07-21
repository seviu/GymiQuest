import { useEffect, useMemo } from "react"
import { useLocalization } from "../../i18n/localization"
import {
  buildGermanWritingForm,
  type GermanWritingHumanReview,
  type GermanWritingResult,
} from "./writing"
import { germanWritingUiCopy } from "./writingCopy"
import { germanWritingReviewUiCopy } from "./writingReviewCopy"
import {
  GERMAN_WRITING_MAX_REVISIONS_PER_RESULT,
  germanWritingRevisionsForResult,
  type ActiveGermanWritingRevision,
  type GermanWritingRevisionSnapshot,
} from "./writingRevision"
import { germanWritingRevisionUiCopy } from "./writingRevisionCopy"

export function GermanWritingResultView({
  result,
  humanReview,
  revisions = [],
  activeRevision,
  onStartRevision,
  onResumeRevision,
  onExit,
}: {
  result: GermanWritingResult
  humanReview?: GermanWritingHumanReview
  revisions?: readonly GermanWritingRevisionSnapshot[]
  activeRevision?: ActiveGermanWritingRevision
  onStartRevision?: (resultId: string) => void
  onResumeRevision?: () => void
  onExit: () => void
}) {
  const { intlLocale, locale } = useLocalization()
  const copy = germanWritingUiCopy[locale]
  const reviewCopy = germanWritingReviewUiCopy[locale]
  const revisionCopy = germanWritingRevisionUiCopy[locale]
  const prompt = useMemo(() => (
    buildGermanWritingForm(result.seed).prompts.find((candidate) => candidate.id === result.promptId)
  ), [result.promptId, result.seed])
  const resultRevisions = germanWritingRevisionsForResult(revisions, result.id)
  const matchingActiveRevision = activeRevision?.resultId === result.id
    ? activeRevision
    : undefined

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [result.id, resultRevisions.length])

  return (
    <main className="german-writing-result-shell">
      <button className="text-button german-back-button" type="button" onClick={onExit}>← {copy.backHome}</button>
      <section className="german-writing-result-view">
        <span className="eyebrow">{copy.resultEyebrow}</span>
        <h1>{humanReview ? reviewCopy.learnerTitle : copy.resultTitle}</h1>
        {result.submissionReason === "timeout" && <p role="status"><strong>{copy.timeout}</strong></p>}
        <p>{humanReview ? reviewCopy.learnerBody : copy.resultBody}</p>
        <div className="german-writing-result-summary">
          <strong>{copy.resultSummary(result.wordCount, result.reviewChecks.length)}</strong>
          <span>{copy.noGrade}</span>
        </div>
        {humanReview && (
          <section className="german-writing-learner-feedback">
            <span className="eyebrow">{reviewCopy.learnerEyebrow}</span>
            <div>
              <article><strong>{reviewCopy.strength}</strong><p>{humanReview.strength}</p></article>
              <article><strong>{reviewCopy.nextStep}</strong><p>{humanReview.nextStep}</p></article>
            </div>
            <small>{reviewCopy.reviewedAt(new Intl.DateTimeFormat(intlLocale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(humanReview.reviewedAt)))}</small>
            {(matchingActiveRevision || (
              resultRevisions.length < GERMAN_WRITING_MAX_REVISIONS_PER_RESULT && onStartRevision
            )) && (
              <button
                className="primary-button german-writing-revision-start"
                type="button"
                onClick={() => {
                  if (matchingActiveRevision) onResumeRevision?.()
                  else onStartRevision?.(result.id)
                }}
              >{matchingActiveRevision ? revisionCopy.resume : revisionCopy.start}</button>
            )}
          </section>
        )}
        {resultRevisions.length > 0 && (
          <section className="german-writing-revision-history" aria-labelledby="german-writing-revision-history-title">
            <span className="eyebrow">{revisionCopy.historyTitle}</span>
            <h2 id="german-writing-revision-history-title">{revisionCopy.historyTitle}</h2>
            <p>{revisionCopy.historyBody}</p>
            <div>
              {resultRevisions.map((revision) => (
                <details key={revision.id}>
                  <summary>{revisionCopy.snapshot(
                    revision.revisionNumber,
                    new Intl.DateTimeFormat(intlLocale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(revision.savedAt)),
                  )}</summary>
                  <h3>{revision.title || "—"}</h3>
                  <small>{revisionCopy.wordCount(revision.wordCount)}</small>
                  <div className="german-writing-result-draft">{revision.draft}</div>
                </details>
              ))}
            </div>
            {resultRevisions.length >= GERMAN_WRITING_MAX_REVISIONS_PER_RESULT && (
              <strong className="german-writing-revision-limit">{revisionCopy.limitReached}</strong>
            )}
          </section>
        )}
        {prompt && (
          <article className="german-writing-result-prompt">
            <span className="eyebrow">{copy.requirements}</span>
            <h2>{prompt.title}</h2>
            <p>{prompt.prompt}</p>
            <ul>{prompt.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
          </article>
        )}
        <section>
          <h2>{copy.plan}</h2>
          <ol className="german-writing-result-plan">
            <li><strong>{copy.opening}</strong><p>{result.plan.opening || "—"}</p></li>
            <li><strong>{copy.development}</strong><p>{result.plan.development || "—"}</p></li>
            <li><strong>{copy.ending}</strong><p>{result.plan.ending || "—"}</p></li>
          </ol>
        </section>
        <section>
          <h2>{result.title || copy.draft}</h2>
          <div className="german-writing-result-draft">{result.draft || copy.empty}</div>
        </section>
      </section>
    </main>
  )
}
