import { useEffect, useRef, useState } from "react"
import {
  archivePracticeReviewComplete,
  archivePracticeStatusCounts,
  completeArchivePractice,
  submitArchivePracticeForReview,
  type ActiveArchivePractice,
  type ArchivePracticeResult,
  type ArchivePracticeReviewStatus,
} from "../domain/archivePractice"
import { officialArchiveCatalog, type OfficialArchiveDocumentKind } from "../domain/officialArchiveCatalog"
import type { OfficialArchiveDocuments } from "../infra/officialArchive"
import { archiveCopy, archiveReviewChoices } from "../i18n/archiveCopy"
import { useLocalization } from "../i18n/localization"
import { PdfPageCanvas } from "./PdfPageCanvas"

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`
}

function reviewStatusLabel(
  choices: ReturnType<typeof archiveReviewChoices>,
  fallback: string,
  status?: ArchivePracticeReviewStatus,
): string {
  return choices.find((choice) => choice.status === status)?.label ?? fallback
}

export function ArchiveSourcePracticePlayer({
  initialPractice,
  documents,
  onChange,
  onComplete,
  onExit,
}: {
  initialPractice: ActiveArchivePractice
  documents: OfficialArchiveDocuments
  onChange: (practice: ActiveArchivePractice) => void
  onComplete: (result: ArchivePracticeResult) => void
  onExit: () => void
}) {
  const { locale } = useLocalization()
  const ui = archiveCopy(locale).practice
  const reviewChoices = archiveReviewChoices(locale)
  const [practice, setPractice] = useState(initialPractice)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const practiceRef = useRef(practice)
  const onChangeRef = useRef(onChange)
  const definition = officialArchiveCatalog[practice.editionId]
  const currentProgress = practice.progress[practice.currentTaskIndex]!
  const remaining = practice.phase === "working"
    ? Math.max(0, Math.ceil((Date.parse(practice.deadlineAt) - nowMs) / 1_000))
    : 0
  const attemptedCount = practice.progress.filter(({ attemptedOnPaper }) => attemptedOnPaper).length
  const reviewedCount = practice.progress.filter(({ reviewStatus }) => reviewStatus !== undefined).length
  const currentPage = practice.currentDocumentKind === "tasks"
    ? practice.taskPageNumber
    : practice.solutionPageNumber
  const currentDefinition = definition.documents[practice.currentDocumentKind]
  const currentRecord = documents[practice.currentDocumentKind]

  practiceRef.current = practice
  onChangeRef.current = onChange

  useEffect(() => {
    onChangeRef.current(practice)
  }, [practice])

  useEffect(() => {
    const tick = (countActive = true) => {
      const now = new Date()
      setNowMs(now.getTime())
      const current = practiceRef.current
      if (current.phase !== "working") return
      if (now.getTime() >= Date.parse(current.deadlineAt)) {
        setConfirmSubmit(false)
        setPractice(submitArchivePracticeForReview(current, "timeout", now))
        return
      }
      if (!countActive || document.visibilityState !== "visible") return
      setPractice((value) => value.phase === "working"
        ? {
            ...value,
            updatedAt: now.toISOString(),
            progress: value.progress.map((task, index) => index === value.currentTaskIndex
              ? { ...task, activeSeconds: task.activeSeconds + 1 }
              : task),
          }
        : value)
    }
    tick(false)
    const timer = window.setInterval(() => tick(true), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [practice.currentTaskIndex, practice.phase])

  const updatePractice = (update: (current: ActiveArchivePractice) => ActiveArchivePractice) => {
    setPractice((current) => ({
      ...update(current),
      updatedAt: new Date().toISOString(),
    }))
  }

  const navigateTask = (taskIndex: number) => {
    if (taskIndex === practice.currentTaskIndex) return
    updatePractice((current) => ({
      ...current,
      currentTaskIndex: taskIndex,
      progress: current.progress.map((task, index) => index === taskIndex
        ? { ...task, visited: true, visitCount: task.visitCount + 1 }
        : task),
    }))
    setConfirmSubmit(false)
  }

  const switchDocument = (kind: OfficialArchiveDocumentKind) => {
    if (practice.phase !== "review" || !documents[kind]) return
    updatePractice((current) => ({ ...current, currentDocumentKind: kind }))
  }

  const changePage = (offset: number) => {
    updatePractice((current) => {
      const kind = current.currentDocumentKind
      const key = kind === "tasks" ? "taskPageNumber" : "solutionPageNumber"
      const maximum = definition.documents[kind].pageCount
      return {
        ...current,
        [key]: Math.max(1, Math.min(maximum, current[key] + offset)),
      }
    })
  }

  const submit = () => {
    setConfirmSubmit(false)
    setPractice((current) => submitArchivePracticeForReview(current, "submitted", new Date()))
  }

  const finishReview = () => {
    if (!archivePracticeReviewComplete(practice)) return
    onComplete(completeArchivePractice(practice, new Date()))
  }

  return (
    <main className="mock-exam-shell archive-practice-shell">
      <header className="mock-exam-toolbar">
        <div className="mock-exam-identity">
          <span>{practice.phase === "working" ? ui.workingEyebrow : ui.reviewEyebrow}</span>
          <strong>{ui.identity(practice.year)}</strong>
        </div>
        {practice.phase === "working" ? (
          <div className={`mock-exam-clock${remaining <= 5 * 60 ? " urgent" : ""}`} aria-label={ui.remainingAria(formatClock(remaining))}>
            <span aria-hidden="true">◷</span>
            <strong>{formatClock(remaining)}</strong>
          </div>
        ) : (
          <div className="archive-review-progress" aria-label={ui.comparedAria(reviewedCount)}>
            <strong>{reviewedCount}/9</strong>
            <span>{ui.compared}</span>
          </div>
        )}
        <button className="mock-exit-button" type="button" onClick={onExit}>
          {ui.overview}
          <small>{practice.phase === "working" ? ui.timeContinues : ui.reviewSaved}</small>
        </button>
      </header>

      <div className="mock-exam-body">
        <aside className="mock-task-sidebar" aria-label={ui.navigationAria}>
          <div className="mock-task-grid">
            {practice.progress.map((task, index) => {
              const done = practice.phase === "working"
                ? task.attemptedOnPaper
                : task.reviewStatus !== undefined
              const state = task.flagged ? "flagged" : done ? "answered" : task.visited ? "started" : "unseen"
              return (
                <button
                  className={`${state}${index === practice.currentTaskIndex ? " current" : ""}`}
                  type="button"
                  key={task.taskNumber}
                  aria-current={index === practice.currentTaskIndex ? "step" : undefined}
                  aria-label={ui.taskAria(task.taskNumber, practice.phase === "working" ? task.attemptedOnPaper ? ui.onPaper : task.visited ? ui.started : ui.unseen : reviewStatusLabel(reviewChoices, ui.stillOpen, task.reviewStatus), task.flagged)}
                  onClick={() => navigateTask(index)}
                >
                  <strong>{task.taskNumber}</strong>
                  <span aria-hidden="true">{task.flagged ? "⚑" : done ? "✓" : task.visited ? "•" : ""}</span>
                </button>
              )
            })}
          </div>
          <div className="mock-nav-legend">
            <span><i className="answered" /> {practice.phase === "working" ? ui.completed : ui.compared}</span>
            <span><i className="started" /> {ui.started}</span>
            <span><i className="flagged" /> {ui.flagged}</span>
          </div>
          <button
            className={`mock-flag-button${currentProgress.flagged ? " active" : ""}`}
            type="button"
            aria-pressed={currentProgress.flagged}
            onClick={() => updatePractice((current) => ({
              ...current,
              progress: current.progress.map((task, index) => index === current.currentTaskIndex
                ? { ...task, flagged: !task.flagged }
                : task),
            }))}
          >
            <span aria-hidden="true">⚑</span>
            {currentProgress.flagged ? ui.removeFlag : ui.flagLater}
          </button>
          {practice.phase === "working" && (
            <button className="danger-button mock-submit-open" type="button" onClick={() => setConfirmSubmit(true)}>
              {ui.submitTraining}
            </button>
          )}
        </aside>

        <section className="mock-task-workspace">
          <div className="mock-task-topline archive-practice-topline">
            <div>
              <span>{ui.taskProgress(currentProgress.taskNumber)}</span>
              <h1>{practice.phase === "working" ? ui.solveOnPaper : ui.compareResult}</h1>
            </div>
            <strong>{practice.phase === "working" ? ui.countCompleted(attemptedCount) : ui.countCompared(reviewedCount)}</strong>
          </div>

          <section className="archive-source-boundary" aria-label={ui.boundaryAria}>
            <strong>{practice.phase === "working" ? ui.questionsOnly : ui.boundComparison}</strong>
            <p>
              {practice.phase === "working"
                ? ui.workingBoundary
                : ui.reviewBoundary}
            </p>
          </section>

          {practice.phase === "review" && (
            <div className="archive-document-tabs" aria-label={ui.compareSourceAria}>
              {(["tasks", "solutions"] as const).map((kind) => (
                <button
                  className={practice.currentDocumentKind === kind ? "active" : ""}
                  type="button"
                  key={kind}
                  disabled={!documents[kind]}
                  aria-pressed={practice.currentDocumentKind === kind}
                  onClick={() => switchDocument(kind)}
                >
                  {kind === "tasks" ? ui.questionPaper : ui.solutionSheet}
                </button>
              ))}
            </div>
          )}

          <section className="official-task-document archive-practice-document" aria-label={`${currentDefinition.title}, Seite ${currentPage}`}>
            <div>
              <div>
                <strong>{currentDefinition.title}</strong>
                <span>{ui.importedPage(currentPage, currentDefinition.pageCount)}</span>
              </div>
              <div className="official-library-page-controls" aria-label={ui.pdfNavigationAria}>
                <button type="button" disabled={currentPage <= 1} onClick={() => changePage(-1)} aria-label={ui.previousPdf}>←</button>
                <strong>{currentPage}/{currentDefinition.pageCount}</strong>
                <button type="button" disabled={currentPage >= currentDefinition.pageCount} onClick={() => changePage(1)} aria-label={ui.nextPdf}>→</button>
              </div>
            </div>
            {currentRecord ? (
              <PdfPageCanvas
                blob={currentRecord.blob}
                pageNumber={currentPage}
                title={ui.pdfTitle(currentDefinition.title, practice.year)}
              />
            ) : (
              <p className="official-missing-source" role="alert">{ui.missingPdf}</p>
            )}
          </section>

          {practice.phase === "working" ? (
            <button
              className={`archive-paper-toggle${currentProgress.attemptedOnPaper ? " active" : ""}`}
              type="button"
              aria-pressed={currentProgress.attemptedOnPaper}
              onClick={() => updatePractice((current) => ({
                ...current,
                progress: current.progress.map((task, index) => index === current.currentTaskIndex
                  ? { ...task, attemptedOnPaper: !task.attemptedOnPaper }
                  : task),
              }))}
            >
              <span aria-hidden="true">{currentProgress.attemptedOnPaper ? "✓" : "□"}</span>
              <div>
                <strong>{currentProgress.attemptedOnPaper ? ui.markedOnPaper : ui.completedOnPaper}</strong>
                <small>{ui.noInventedAnswer}</small>
              </div>
            </button>
          ) : (
            <fieldset className="archive-review-choices">
              <legend>{ui.compareQuestion(currentProgress.taskNumber)}</legend>
              {reviewChoices.map((choice) => (
                <label className={currentProgress.reviewStatus === choice.status ? "selected" : ""} key={choice.status}>
                  <input
                    type="radio"
                    name={`archive-review-${currentProgress.taskNumber}`}
                    value={choice.status}
                    checked={currentProgress.reviewStatus === choice.status}
                    onChange={() => updatePractice((current) => ({
                      ...current,
                      progress: current.progress.map((task, index) => index === current.currentTaskIndex
                        ? { ...task, reviewStatus: choice.status }
                        : task),
                    }))}
                  />
                  <span aria-hidden="true" />
                  <div><strong>{choice.label}</strong><small>{choice.detail}</small></div>
                </label>
              ))}
            </fieldset>
          )}

          <div className="mock-task-actions">
            <button className="secondary-button" type="button" disabled={practice.currentTaskIndex === 0} onClick={() => navigateTask(practice.currentTaskIndex - 1)}>
              {ui.previousTask}
            </button>
            {practice.currentTaskIndex < practice.progress.length - 1 ? (
              <button className="primary-button" type="button" onClick={() => navigateTask(practice.currentTaskIndex + 1)}>
                {ui.nextTask}
              </button>
            ) : practice.phase === "working" ? (
              <button className="primary-button" type="button" onClick={() => setConfirmSubmit(true)}>{ui.reviewSubmission}</button>
            ) : (
              <button className="primary-button" type="button" disabled={!archivePracticeReviewComplete(practice)} onClick={finishReview}>
                {ui.finishReview}
              </button>
            )}
          </div>
          {practice.phase === "review" && !archivePracticeReviewComplete(practice) && (
            <p className="archive-review-reminder" role="status">{ui.remainingTasks(9 - reviewedCount)}</p>
          )}
        </section>
      </div>

      {confirmSubmit && (
        <div className="mock-submit-layer" role="dialog" aria-modal="true" aria-labelledby="archive-submit-title">
          <section>
            <span className="eyebrow">{ui.finalEyebrow}</span>
            <h2 id="archive-submit-title">{ui.submitTitle}</h2>
            <p>
              {attemptedCount === 9
                ? ui.allAttempted
                : ui.someUnattempted(9 - attemptedCount)}
            </p>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmSubmit(false)}>{ui.keepWorking}</button>
              <button className="danger-button" type="button" onClick={submit}>{ui.submitAndOpen}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export function ArchivePracticeResultsView({
  result,
  onContinue,
}: {
  result: ArchivePracticeResult
  onContinue: () => void
}) {
  const { locale } = useLocalization()
  const ui = archiveCopy(locale).results
  const counts = archivePracticeStatusCounts(result)
  return (
    <main className="mock-results-shell archive-practice-results">
      <section className="mock-results-hero">
        <div>
          <span className="eyebrow">{ui.eyebrow}</span>
          <h1>{ui.title(result.year)}</h1>
          <p>{ui.body}</p>
        </div>
        <div className="mock-score-card archive-no-score-card">
          <span>{ui.noAssessment}</span>
          <strong>{ui.noPoints}</strong>
          <p>{ui.noChanges}</p>
        </div>
      </section>

      <section className="mock-result-summary archive-practice-summary">
        <div><span>{ui.matches}</span><strong>{counts["answer-matches"]}</strong><small>{ui.visibleComparison}</small></div>
        <div><span>{ui.unclear}</span><strong>{counts["answer-differs-or-unclear"]}</strong><small>{ui.revisit}</small></div>
        <div><span>{ui.notAttempted}</span><strong>{counts["not-attempted"]}</strong><small>{ui.duringExam}</small></div>
        <div><span>{ui.activeTime}</span><strong>{formatClock(result.totalActiveSeconds)}</strong><small>{ui.visibleWork}</small></div>
      </section>

      <section className="archive-result-boundary">
        <strong>{ui.meaningTitle}</strong>
        <p>{ui.meaningBody}</p>
      </section>

      <button className="primary-button wide mock-results-continue" type="button" onClick={onContinue}>
        {ui.back}
      </button>
    </main>
  )
}
