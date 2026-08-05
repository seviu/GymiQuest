import { useEffect, useMemo, useRef, useState } from "react"
import {
  buildExerciseReportUrl,
  createGermanWritingExerciseReportReference,
} from "../../domain/exerciseReport"
import { useLocalization } from "../../i18n/localization"
import { TopicTheoryDisclosure } from "../../features/TopicTheoryDisclosure"
import { germanTheoryByTopic } from "./content"
import { germanCourseUiCopy } from "./uiCopy"
import {
  GERMAN_WRITING_MAX_DRAFT_LENGTH,
  GERMAN_WRITING_MAX_PLAN_LENGTH,
  GERMAN_WRITING_MAX_TITLE_LENGTH,
  buildGermanWritingForm,
  chooseGermanWritingPrompt,
  germanWritingExpired,
  germanWritingReviewCheckIds,
  germanWritingWordCount,
  navigateGermanWritingStage,
  remainingGermanWritingSeconds,
  submitGermanWritingSession,
  toggleGermanWritingReviewCheck,
  updateGermanWritingDraft,
  updateGermanWritingPlan,
  updateGermanWritingTitle,
  type ActiveGermanWritingSession,
  type GermanWritingResult,
  type GermanWritingStage,
  type GermanWritingSubmissionReason,
} from "./writing"
import { germanWritingUiCopy } from "./writingCopy"

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
}

const stageOrder: readonly GermanWritingStage[] = ["choose", "plan", "draft", "review"]

export function GermanWritingView({
  session,
  onChange,
  onComplete,
  onExit,
}: {
  session: ActiveGermanWritingSession
  onChange: (session: ActiveGermanWritingSession) => void
  onComplete: (result: GermanWritingResult) => void
  onExit: () => void
}) {
  const { copy: appCopy, locale } = useLocalization()
  const copy = germanWritingUiCopy[locale]
  const courseCopy = germanCourseUiCopy[locale]
  const form = useMemo(() => buildGermanWritingForm(session.seed), [session.seed])
  const selectedPrompt = form.prompts.find((prompt) => prompt.id === session.selectedPromptId)
  const selectedPromptIndex = form.prompts.findIndex((prompt) => prompt.id === session.selectedPromptId)
  const [clock, setClock] = useState(() => new Date())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const completedRef = useRef(false)
  const remaining = remainingGermanWritingSeconds(session, clock)
  const wordCount = germanWritingWordCount(session.draft)

  const finish = (reason: GermanWritingSubmissionReason, now = new Date()) => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete(submitGermanWritingSession(session, reason, now))
  }

  useEffect(() => {
    completedRef.current = false
  }, [session.id])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now)
      if (germanWritingExpired(session, now) && !completedRef.current) {
        completedRef.current = true
        onComplete(submitGermanWritingSession(session, "timeout", now))
      }
    }
    tick()
    const timer = window.setInterval(tick, 1_000)
    return () => window.clearInterval(timer)
  }, [onComplete, session])

  const promptPanel = selectedPrompt && (
    <aside className="german-writing-prompt-panel">
      <span className="eyebrow">{selectedPrompt.genre === "newspaper-report" ? "BERICHT" : "ERZÄHLUNG"}</span>
      <h2>{selectedPrompt.title}</h2>
      <p>{selectedPrompt.prompt}</p>
      <a
        className="exercise-report-link"
        href={buildExerciseReportUrl(
          createGermanWritingExerciseReportReference(session, selectedPrompt, selectedPromptIndex),
          window.location.origin,
        )}
      >
        <span aria-hidden="true">⚑</span> {appCopy.player.reportIssue}
      </a>
      <strong>{copy.requirements}</strong>
      <ul>{selectedPrompt.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
    </aside>
  )

  const theoryDisclosure = (
    <TopicTheoryDisclosure
      className="german-writing-theory"
      topicId="writing"
      label={`${courseCopy.theory}: Texte verfassen`}
      hint={courseCopy.theoryHint}
      sections={[germanTheoryByTopic.writing]}
      takeawayLabel={courseCopy.lessonGoal}
      headingLevel={2}
    />
  )

  return (
    <main className="german-writing-shell">
      <header className="german-writing-topbar">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <strong>{copy.stages[session.stage]}</strong>
        </div>
        <div
          className={remaining <= 5 * 60 ? "german-writing-timer urgent" : "german-writing-timer"}
          aria-label={copy.timerLabel}
          aria-live="polite"
        >
          <span aria-hidden="true">◷</span>
          <strong>{formatTimer(remaining)}</strong>
        </div>
        <button className="text-button" type="button" onClick={onExit}>{copy.exit}</button>
      </header>

      <nav className="german-writing-stage-nav" aria-label={copy.eyebrow}>
        {stageOrder.map((stage, index) => {
          const accessible = stage === "choose" || Boolean(session.selectedPromptId) && (
            stage !== "review" || Boolean(session.draft.trim())
          )
          return (
            <button
              key={stage}
              type="button"
              disabled={!accessible}
              aria-current={session.stage === stage ? "step" : undefined}
              onClick={() => onChange(navigateGermanWritingStage(session, stage))}
            >
              <span>{index + 1}</span>{copy.stages[stage]}
            </button>
          )
        })}
      </nav>

      {session.stage === "choose" && (
        <section className="german-writing-choose">
          <div className="german-writing-section-heading">
            <span className="eyebrow">{copy.stages.choose}</span>
            <h1>{copy.chooseTitle}</h1>
            <p>{copy.chooseBody}</p>
          </div>
          {theoryDisclosure}
          <div className="german-writing-prompt-grid">
            {form.prompts.map((prompt, index) => (
              <article key={prompt.id}>
                <span className="eyebrow">{copy.theme(index + 1)}</span>
                <h2>{prompt.title}</h2>
                <p>{prompt.prompt}</p>
                <strong>{copy.requirements}</strong>
                <ul>{prompt.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
                <a
                  className="exercise-report-link"
                  href={buildExerciseReportUrl(
                    createGermanWritingExerciseReportReference(session, prompt, index),
                    window.location.origin,
                  )}
                >
                  <span aria-hidden="true">⚑</span> {appCopy.player.reportIssue}
                </a>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => onChange(chooseGermanWritingPrompt(session, prompt.id))}
                >
                  {copy.choose}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {session.stage === "plan" && selectedPrompt && (
        <div className="german-writing-workspace">
          {promptPanel}
          <section className="german-writing-card">
            <div className="german-writing-section-heading">
              <span className="eyebrow">{copy.stages.plan}</span>
              <h1>{copy.planTitle}</h1>
              <p>{copy.planBody}</p>
            </div>
            {theoryDisclosure}
            <label>
              <strong>{copy.opening}</strong>
              <textarea
                value={session.plan.opening}
                maxLength={GERMAN_WRITING_MAX_PLAN_LENGTH}
                placeholder={copy.openingPlaceholder}
                onChange={(event) => onChange(updateGermanWritingPlan(session, "opening", event.currentTarget.value))}
              />
            </label>
            <label>
              <strong>{copy.development}</strong>
              <textarea
                value={session.plan.development}
                maxLength={GERMAN_WRITING_MAX_PLAN_LENGTH}
                placeholder={copy.developmentPlaceholder}
                onChange={(event) => onChange(updateGermanWritingPlan(session, "development", event.currentTarget.value))}
              />
            </label>
            <label>
              <strong>{copy.ending}</strong>
              <textarea
                value={session.plan.ending}
                maxLength={GERMAN_WRITING_MAX_PLAN_LENGTH}
                placeholder={copy.endingPlaceholder}
                onChange={(event) => onChange(updateGermanWritingPlan(session, "ending", event.currentTarget.value))}
              />
            </label>
            <div className="german-writing-actions">
              <button className="secondary-button" type="button" onClick={() => onChange(navigateGermanWritingStage(session, "choose"))}>← {copy.previous}</button>
              <button className="primary-button" type="button" onClick={() => onChange(navigateGermanWritingStage(session, "draft"))}>{copy.next} →</button>
            </div>
          </section>
        </div>
      )}

      {session.stage === "draft" && selectedPrompt && (
        <div className="german-writing-workspace">
          {promptPanel}
          <section className="german-writing-card german-writing-draft-card">
            <div className="german-writing-section-heading">
              <span className="eyebrow">{copy.stages.draft}</span>
              <h1>{copy.draftTitle}</h1>
              <p>{copy.draftBody}</p>
            </div>
            {theoryDisclosure}
            <label>
              <strong>{copy.titleLabel}</strong>
              <input
                value={session.title}
                maxLength={GERMAN_WRITING_MAX_TITLE_LENGTH}
                placeholder={copy.titlePlaceholder}
                onChange={(event) => onChange(updateGermanWritingTitle(session, event.currentTarget.value))}
              />
            </label>
            <label>
              <strong>{copy.textLabel}</strong>
              <textarea
                value={session.draft}
                maxLength={GERMAN_WRITING_MAX_DRAFT_LENGTH}
                placeholder={copy.textPlaceholder}
                spellCheck
                onChange={(event) => onChange(updateGermanWritingDraft(session, event.currentTarget.value))}
              />
            </label>
            <div className="german-writing-draft-meta" aria-live="polite">
              <strong>{copy.wordCount(wordCount)}</strong><span>✓ {copy.autosave}</span>
            </div>
            <div className="german-writing-actions">
              <button className="secondary-button" type="button" onClick={() => onChange(navigateGermanWritingStage(session, "plan"))}>← {copy.previous}</button>
              <button
                className="primary-button"
                type="button"
                disabled={!session.draft.trim()}
                onClick={() => onChange(navigateGermanWritingStage(session, "review"))}
              >
                {copy.next} →
              </button>
            </div>
          </section>
        </div>
      )}

      {session.stage === "review" && selectedPrompt && (
        <div className="german-writing-workspace">
          {promptPanel}
          <section className="german-writing-card german-writing-review-card">
            <div className="german-writing-section-heading">
              <span className="eyebrow">{copy.stages.review}</span>
              <h1>{copy.reviewTitle}</h1>
              <p>{copy.reviewBody}</p>
            </div>
            {theoryDisclosure}
            <div className="german-writing-review-list">
              {germanWritingReviewCheckIds.map((checkId) => (
                <label key={checkId}>
                  <input
                    type="checkbox"
                    checked={session.reviewChecks.includes(checkId)}
                    onChange={() => onChange(toggleGermanWritingReviewCheck(session, checkId))}
                  />
                  <span>{copy.checks[checkId]}</span>
                </label>
              ))}
            </div>
            <p className="german-writing-no-grade"><strong>{copy.noGrade}</strong></p>
            <div className="german-writing-actions">
              <button className="secondary-button" type="button" onClick={() => onChange(navigateGermanWritingStage(session, "draft"))}>← {copy.previous}</button>
              <button className="primary-button" type="button" onClick={() => setConfirmSubmit(true)}>{copy.submitOpen}</button>
            </div>
            {confirmSubmit && (
              <div className="reset-confirmation german-writing-submit-confirmation" role="alert">
                <p><strong>{copy.submitTitle}</strong><span>{copy.submitBody}</span></p>
                <div>
                  <button className="text-button" type="button" onClick={() => setConfirmSubmit(false)}>{copy.cancel}</button>
                  <button className="danger-button" type="button" onClick={() => finish("submitted")}>{copy.submit}</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  )
}
