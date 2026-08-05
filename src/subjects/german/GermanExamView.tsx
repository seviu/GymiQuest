import { useEffect, useMemo, useRef, useState } from "react"
import {
  buildExerciseReportUrl,
  createGermanExamExerciseReportReference,
} from "../../domain/exerciseReport"
import { useLocalization } from "../../i18n/localization"
import { germanTopics } from "./content"
import {
  GERMAN_EXAM_QUESTION_COUNT,
  answerGermanExamQuestion,
  buildGermanExamBlueprint,
  germanExamExpired,
  gradeGermanExam,
  navigateGermanExam,
  remainingGermanExamSeconds,
  toggleGermanExamFlag,
  type ActiveGermanExam,
  type GermanExamResult,
  type GermanExamSubmissionReason,
} from "./exam"
import { germanExamUiCopy } from "./examCopy"
import { GermanQuestionResponseInput } from "./GermanQuestionResponseInput"
import { isCompleteGermanResponse } from "./grading"

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
}

export function GermanExamView({
  exam,
  onChange,
  onComplete,
  onExit,
}: {
  exam: ActiveGermanExam
  onChange: (exam: ActiveGermanExam) => void
  onComplete: (result: GermanExamResult) => void
  onExit: () => void
}) {
  const { copy: appCopy, locale } = useLocalization()
  const copy = germanExamUiCopy[locale]
  const blueprint = useMemo(
    () => buildGermanExamBlueprint(exam.seed, exam.blueprintVersion),
    [exam.blueprintVersion, exam.seed],
  )
  const [clock, setClock] = useState(() => new Date())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const completedRef = useRef(false)
  const question = blueprint.questions[exam.currentQuestionIndex]!
  const response = exam.answers[question.id]
  const remaining = remainingGermanExamSeconds(exam, clock)
  const answeredCount = blueprint.questions.filter((candidate) => (
    isCompleteGermanResponse(candidate, exam.answers[candidate.id])
  )).length
  const unansweredCount = GERMAN_EXAM_QUESTION_COUNT - answeredCount
  const flagged = exam.flaggedQuestionIds.includes(question.id)
  const exerciseReportUrl = useMemo(() => buildExerciseReportUrl(
    createGermanExamExerciseReportReference(exam, question, exam.currentQuestionIndex),
    window.location.origin,
  ), [exam, question])

  const finish = (reason: GermanExamSubmissionReason, now = new Date()) => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete(gradeGermanExam(exam, reason, now))
  }

  useEffect(() => {
    completedRef.current = false
  }, [exam.id])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now)
      if (germanExamExpired(exam, now) && !completedRef.current) {
        completedRef.current = true
        onComplete(gradeGermanExam(exam, "timeout", now))
      }
    }
    tick()
    const timer = window.setInterval(tick, 1_000)
    return () => window.clearInterval(timer)
  }, [exam, onComplete])

  return (
    <main className="german-exam-shell">
      <header className="german-exam-topbar">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <strong>{copy.question(exam.currentQuestionIndex + 1, GERMAN_EXAM_QUESTION_COUNT)}</strong>
        </div>
        <div className={remaining <= 5 * 60 ? "german-exam-timer urgent" : "german-exam-timer"} aria-live="polite">
          <span aria-hidden="true">◷</span>
          <strong>{formatTimer(remaining)}</strong>
        </div>
        <button className="text-button" type="button" onClick={onExit}>{copy.exit}</button>
      </header>

      <nav className="german-exam-navigation" aria-label={copy.answered(answeredCount, GERMAN_EXAM_QUESTION_COUNT)}>
        <span>{copy.answered(answeredCount, GERMAN_EXAM_QUESTION_COUNT)}</span>
        <div>
          {blueprint.questions.map((candidate, index) => {
            const answered = isCompleteGermanResponse(candidate, exam.answers[candidate.id])
            const isFlagged = exam.flaggedQuestionIds.includes(candidate.id)
            return (
              <button
                key={candidate.id}
                type="button"
                className={`${index === exam.currentQuestionIndex ? "current" : ""}${answered ? " answered" : ""}${isFlagged ? " flagged" : ""}`}
                aria-current={index === exam.currentQuestionIndex ? "step" : undefined}
                aria-label={`${copy.question(index + 1, GERMAN_EXAM_QUESTION_COUNT)}${answered ? ` · ${copy.answered(1, 1)}` : ""}${isFlagged ? ` · ${copy.flag}` : ""}`}
                onClick={() => onChange(navigateGermanExam(exam, index))}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="german-exam-workspace">
        <aside className="german-exam-passage" aria-label={`${copy.passage}: ${blueprint.passage.title}`}>
          <span className="eyebrow">{copy.passage}</span>
          <h2>{blueprint.passage.title}</h2>
          <ol>
            {blueprint.passage.lines.map((line) => <li value={line.number} key={line.number}>{line.text}</li>)}
          </ol>
        </aside>

        <section className="german-exam-question-card">
          <div className="german-exam-question-heading">
            <div>
              <span className="eyebrow">{germanTopics[question.topicId].shortTitle}</span>
              <h1>{copy.question(exam.currentQuestionIndex + 1, GERMAN_EXAM_QUESTION_COUNT)}</h1>
            </div>
            <button
              className={flagged ? "secondary-button flagged" : "text-button"}
              type="button"
              aria-pressed={flagged}
              onClick={() => onChange(toggleGermanExamFlag(exam, question.id))}
            >
              ⚑ {flagged ? copy.unflag : copy.flag}
            </button>
          </div>
          <p className="german-question-prompt">{question.prompt}</p>
          <a
            className="exercise-report-link"
            href={exerciseReportUrl}
          >
            <span aria-hidden="true">⚑</span> {appCopy.player.reportIssue}
          </a>
          <GermanQuestionResponseInput
            question={question}
            response={response}
            matchingPlaceholder={copy.matchingSelect}
            onChange={(nextResponse) => onChange(answerGermanExamQuestion(
              exam,
              question.id,
              nextResponse,
            ))}
          />

          <div className="german-exam-question-actions">
            <button
              className="secondary-button"
              type="button"
              disabled={exam.currentQuestionIndex === 0}
              onClick={() => onChange(navigateGermanExam(exam, exam.currentQuestionIndex - 1))}
            >
              ← {copy.previous}
            </button>
            {exam.currentQuestionIndex < GERMAN_EXAM_QUESTION_COUNT - 1 ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => onChange(navigateGermanExam(exam, exam.currentQuestionIndex + 1))}
              >
                {copy.next} →
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={() => setConfirmSubmit(true)}>
                {copy.submitOpen}
              </button>
            )}
          </div>

          {confirmSubmit && (
            <div className="reset-confirmation german-exam-submit-confirmation" role="alert">
              <p><strong>{copy.submitTitle}</strong><span>{copy.submitBody(unansweredCount)}</span></p>
              <div>
                <button className="text-button" type="button" onClick={() => setConfirmSubmit(false)}>{copy.cancel}</button>
                <button className="danger-button" type="button" onClick={() => finish("submitted")}>{copy.submit}</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
