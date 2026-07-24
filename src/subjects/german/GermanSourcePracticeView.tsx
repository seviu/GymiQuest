import { useEffect, useRef, useState } from "react"
import { PdfPageCanvas } from "../../features/PdfPageCanvas"
import { useLocalization } from "../../i18n/localization"
import type { GermanSourceArchiveDocuments } from "../../infra/germanSourceArchive"
import { germanSourceArchiveCatalog } from "./sourceArchiveCatalog"
import { germanSourceArchiveUiCopy } from "./sourceArchiveCopy"
import {
  completeGermanSourcePractice,
  germanSourcePracticeCanComplete,
  germanSourcePracticeDocumentKinds,
  germanSourceWritingReviewChecks,
  germanSourceWritingWordCount,
  navigateGermanSourcePractice,
  remainingGermanSourcePracticeSeconds,
  setGermanSourceLanguageReview,
  submitGermanSourcePractice,
  toggleGermanSourceWritingReviewCheck,
  updateGermanSourceWriting,
  type ActiveGermanSourcePractice,
  type GermanSourceLanguageReviewStatus,
  type GermanSourcePracticeResult,
} from "./sourcePractice"
import { germanSourcePracticeUiCopy } from "./sourcePracticeCopy"

function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
}

export function GermanSourcePracticeView({
  practice,
  documents,
  onChange,
  onComplete,
  onExit,
}: {
  practice: ActiveGermanSourcePractice
  documents: GermanSourceArchiveDocuments
  onChange: (practice: ActiveGermanSourcePractice) => void
  onComplete: (result: GermanSourcePracticeResult) => void
  onExit: () => void
}) {
  const { locale } = useLocalization()
  const copy = germanSourcePracticeUiCopy[locale]
  const archiveCopy = germanSourceArchiveUiCopy[locale]
  const edition = germanSourceArchiveCatalog[practice.editionId]
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const timeoutSubmitted = useRef<string | undefined>(undefined)
  const remaining = remainingGermanSourcePracticeSeconds(practice, new Date(nowMs))
  const availableKinds = germanSourcePracticeDocumentKinds(
    practice.editionId,
    practice.mode,
    practice.phase,
  )
  const currentDefinition = edition.documents[practice.currentDocumentKind]
  const currentRecord = documents[practice.currentDocumentKind]
  const currentPage = practice.pageNumbers[practice.currentDocumentKind] ?? 1
  const isWriting = practice.mode === "writing"

  useEffect(() => {
    if (practice.phase !== "working") return
    const interval = window.setInterval(() => setNowMs(Date.now()), 1_000)
    return () => window.clearInterval(interval)
  }, [practice.phase])

  useEffect(() => {
    if (practice.phase !== "working" || remaining > 0 || timeoutSubmitted.current === practice.id) return
    timeoutSubmitted.current = practice.id
    onChange(submitGermanSourcePractice(practice, "timeout", new Date(nowMs)))
  }, [nowMs, onChange, practice, remaining])

  if (!currentRecord || !currentDefinition) {
    return (
      <main className="german-source-practice-shell">
        <section className="german-source-practice-missing" role="alert">
          <h1>{copy.missingSource}</h1>
          <button className="primary-button" type="button" onClick={onExit}>{copy.back}</button>
        </section>
      </main>
    )
  }

  const navigate = (kind: typeof practice.currentDocumentKind, pageNumber: number) => {
    onChange(navigateGermanSourcePractice(practice, kind, pageNumber))
  }

  return (
    <main className={`german-source-practice-shell ${isWriting ? "writing" : "language"} ${practice.phase}`}>
      <header className="german-source-practice-topbar">
        <button className="text-button" type="button" onClick={onExit}>← {copy.back}</button>
        <div>
          <span className="eyebrow">{copy.sourcePractice}</span>
          <strong>{edition.title} · {copy.modeNames[practice.mode]}</strong>
          <small>{copy.noScore}</small>
        </div>
        <div className={remaining <= 300 && practice.phase === "working" ? "german-source-clock urgent" : "german-source-clock"}>
          <span>{copy.remaining}</span>
          <strong>{clock(remaining)}</strong>
        </div>
        {practice.phase === "working" && (
          <button className="danger-button" type="button" onClick={() => setConfirmSubmit(true)}>{copy.submit}</button>
        )}
      </header>

      {practice.phase === "review" && practice.submissionReason === "timeout" && (
        <p className="german-source-timeout" role="status">{copy.timeout}</p>
      )}

      {confirmSubmit && practice.phase === "working" && (
        <section className="german-source-submit-confirmation" role="alert" aria-labelledby="german-source-submit-title">
          <div>
            <h2 id="german-source-submit-title">{copy.submitTitle}</h2>
            <p>{copy.submitBody}</p>
          </div>
          <div>
            <button className="text-button" type="button" onClick={() => setConfirmSubmit(false)}>{copy.cancel}</button>
            <button className="danger-button" type="button" onClick={() => {
              onChange(submitGermanSourcePractice(practice, "submitted"))
              setConfirmSubmit(false)
            }}>{copy.submitNow}</button>
          </div>
        </section>
      )}

      <section className="german-source-practice-boundary">
        <strong>{copy.noScore}</strong>
        <span>{practice.phase === "working" ? copy.workingBoundary[practice.mode] : copy.reviewBoundary}</span>
      </section>

      <div className={isWriting ? "german-source-practice-workspace writing" : "german-source-practice-workspace"}>
        <section className="german-source-document-panel">
          <div className="german-source-document-toolbar">
            <div className="official-library-reader-tabs" aria-label={copy.documentTabs}>
              {availableKinds.map((kind) => documents[kind] && (
                <button
                  className={practice.currentDocumentKind === kind ? "active" : ""}
                  type="button"
                  aria-pressed={practice.currentDocumentKind === kind}
                  key={kind}
                  onClick={() => navigate(kind, practice.pageNumbers[kind] ?? 1)}
                >
                  {archiveCopy.documentLabels[kind]}
                </button>
              ))}
            </div>
            <div className="official-library-page-controls" aria-label={copy.pageNavigation}>
              <button
                type="button"
                disabled={currentPage <= 1}
                aria-label={copy.previousPage}
                onClick={() => navigate(practice.currentDocumentKind, currentPage - 1)}
              >←</button>
              <strong>{copy.pageOf(currentPage, currentDefinition.pageCount)}</strong>
              <button
                type="button"
                disabled={currentPage >= currentDefinition.pageCount}
                aria-label={copy.nextPage}
                onClick={() => navigate(practice.currentDocumentKind, currentPage + 1)}
              >→</button>
            </div>
          </div>
          <div className="official-library-pdf german-source-practice-pdf">
            <PdfPageCanvas
              blob={currentRecord.blob}
              pageNumber={currentPage}
              title={currentDefinition.title}
            />
          </div>
          <footer><span>{currentRecord.filename}</span><span>{copy.saved}</span></footer>
        </section>

        {isWriting && (
          <section className="german-source-writing-editor">
            <label htmlFor="german-source-writing-title">{copy.writingTitle}</label>
            <input
              id="german-source-writing-title"
              value={practice.writingTitle ?? ""}
              maxLength={300}
              disabled={practice.phase === "review"}
              placeholder={copy.writingTitlePlaceholder}
              onChange={(event) => onChange(updateGermanSourceWriting(
                practice,
                event.currentTarget.value,
                practice.writingDraft ?? "",
              ))}
            />
            <div className="german-source-writing-label">
              <label htmlFor="german-source-writing-draft">{copy.writingDraft}</label>
              <strong>{copy.words(germanSourceWritingWordCount(practice.writingDraft ?? ""))}</strong>
            </div>
            <textarea
              id="german-source-writing-draft"
              value={practice.writingDraft ?? ""}
              maxLength={50_000}
              disabled={practice.phase === "review"}
              placeholder={copy.writingDraftPlaceholder}
              onChange={(event) => onChange(updateGermanSourceWriting(
                practice,
                practice.writingTitle ?? "",
                event.currentTarget.value,
              ))}
            />
            <small>{copy.writingPrivacy}</small>
          </section>
        )}
      </div>

      {practice.phase === "review" && (
        <section className="german-source-review-panel">
          <span className="eyebrow">{copy.noScore}</span>
          <h2>{isWriting ? copy.writingReviewTitle : copy.languageReviewTitle}</h2>
          <p>{isWriting ? copy.writingReviewBody : copy.languageReviewBody}</p>
          {isWriting ? (
            <div className="german-source-writing-checks">
              {germanSourceWritingReviewChecks.map((check) => (
                <label key={check}>
                  <input
                    type="checkbox"
                    checked={practice.writingReviewChecks.includes(check)}
                    onChange={() => onChange(toggleGermanSourceWritingReviewCheck(practice, check))}
                  />
                  <span>{copy.writingReviewChecks[check]}</span>
                </label>
              ))}
            </div>
          ) : (
            <fieldset className="german-source-language-review">
              <legend className="sr-only">{copy.languageReviewTitle}</legend>
              {(Object.keys(copy.languageReviewStatuses) as GermanSourceLanguageReviewStatus[]).map((status) => (
                <label key={status}>
                  <input
                    type="radio"
                    name="german-source-language-review"
                    value={status}
                    checked={practice.languageReviewStatus === status}
                    onChange={() => onChange(setGermanSourceLanguageReview(practice, status))}
                  />
                  <span>{copy.languageReviewStatuses[status]}</span>
                </label>
              ))}
            </fieldset>
          )}
          <small>{copy.completeHint}</small>
          <button
            className="primary-button"
            type="button"
            disabled={!germanSourcePracticeCanComplete(practice)}
            onClick={() => onComplete(completeGermanSourcePractice(practice))}
          >{copy.complete}</button>
        </section>
      )}
    </main>
  )
}
