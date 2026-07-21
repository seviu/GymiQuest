import { useMemo, useState } from "react"
import { SubjectSwitcher } from "../../features/SubjectSwitcher"
import {
  buildExerciseReportUrl,
  createGermanExerciseReportReference,
} from "../../domain/exerciseReport"
import { useLocalization } from "../../i18n/localization"
import { germanLessons, germanStartCheckQuestions, germanTopics } from "./content"
import {
  advanceGermanSession,
  answerCurrentGermanQuestion,
  answerGermanStartCheck,
  buildGermanAssignments,
  currentGermanQuestion,
  completeGermanStrictExam,
  completeGermanComprehensionPractice,
  completeGermanWritingRevision,
  completeGermanWritingPractice,
  requestGermanTopicSupport,
  resolveGermanComprehensionHumanReview,
  startGermanComprehensionPractice,
  startGermanSession,
  startGermanStrictExam,
  startGermanWritingPractice,
  startGermanWritingRevision,
  startGermanStartCheck,
  updateGermanStrictExam,
  updateGermanComprehensionPractice,
  updateGermanWritingPractice,
  updateGermanWritingRevision,
  germanSessionQuestions,
  type GermanAssessmentResult,
  type GermanCourseState,
  type GermanXpEvent,
} from "./courseState"
import { germanCoachingForTopic } from "./coaching"
import { germanCourseUiCopy, type GermanCourseUiCopy } from "./uiCopy"
import {
  GERMAN_CURRICULUM_PACKAGE,
  germanLessonIdByTopic,
  germanPilotTopicIds,
  germanTopicIds,
} from "./package"
import { GermanExamView } from "./GermanExamView"
import { GermanExamResultView } from "./GermanExamResultView"
import { GermanWritingResultView } from "./GermanWritingResultView"
import { GermanWritingRevisionView } from "./GermanWritingRevisionView"
import { GermanWritingView } from "./GermanWritingView"
import { GermanComprehensionView } from "./GermanComprehensionView"
import { GermanComprehensionFeedbackCard } from "./GermanComprehensionFeedbackCard"
import { germanComprehensionUiCopy } from "./comprehensionCopy"
import { germanExamUiCopy } from "./examCopy"
import { germanWritingUiCopy } from "./writingCopy"
import { germanWritingReviewUiCopy } from "./writingReviewCopy"
import { germanWritingRevisionUiCopy } from "./writingRevisionCopy"
import { GERMAN_WRITING_MAX_REVISIONS_PER_RESULT } from "./writingRevision"
import { GermanQuestionResponseInput } from "./GermanQuestionResponseInput"
import { GermanSourceArchiveShelf } from "./GermanSourceArchiveShelf"
import { GermanSourcePracticeView } from "./GermanSourcePracticeView"
import type {
  GermanSourceArchiveBulkImportResult,
  GermanSourceArchiveLibrary,
} from "../../infra/germanSourceArchive"
import {
  createActiveGermanSourcePractice,
  finishGermanSourcePracticeState,
  type ActiveGermanSourcePractice,
  type GermanSourcePracticeMode,
  type GermanSourcePracticeResult,
  type GermanSourcePracticeState,
} from "./sourcePractice"
import { isGermanChoiceQuestion } from "./generators"
import {
  germanResponseFromGrade,
  isCompleteGermanResponse,
  type GermanObjectiveResponse,
} from "./grading"

function GermanStartCheckMistakeReview({
  state,
  copy,
}: {
  state: GermanCourseState
  copy: GermanCourseUiCopy
}) {
  const answers = state.startCheck?.answers ?? {}
  const mistakes = germanStartCheckQuestions.filter((question) => (
    answers[question.id] !== question.correctIndex
  ))
  if (mistakes.length === 0) return null

  return (
    <section className="german-mistake-review" aria-labelledby="german-start-mistakes-title">
      <div className="german-mistake-review-heading">
        <div>
          <span className="eyebrow">{copy.mistakeReviewEyebrow}</span>
          <h2 id="german-start-mistakes-title">{copy.mistakeReviewTitle}</h2>
        </div>
        <strong>{copy.mistakeCount(mistakes.length)}</strong>
      </div>
      <div className="german-mistake-review-list">
        {mistakes.map((question) => {
          const selectedIndex = answers[question.id]
          return (
            <article key={question.id}>
              <small>{question.skill}</small>
              <h3>{question.prompt}</h3>
              <dl className="assessment-answer-comparison">
                <div className="submitted">
                  <dt>{copy.yourAnswer}</dt>
                  <dd>{selectedIndex === undefined ? "–" : question.options[selectedIndex] ?? "–"}</dd>
                </div>
                <div className="correct">
                  <dt>{copy.correctAnswer}</dt>
                  <dd>{question.options[question.correctIndex]}</dd>
                </div>
                <div className="explanation">
                  <dt>{copy.explanation}</dt>
                  <dd>{question.explanation}</dd>
                </div>
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function GermanAssessmentMistakeReview({
  result,
  copy,
}: {
  result: GermanAssessmentResult
  copy: GermanCourseUiCopy
}) {
  if (!result.reviewSession) {
    return (
      <section className="german-mistake-review unavailable">
        <span className="eyebrow">{copy.mistakeReviewEyebrow}</span>
        <p>{copy.olderReviewUnavailable}</p>
      </section>
    )
  }
  const questions = germanSessionQuestions(result.reviewSession)
  const answers = new Map(result.reviewSession.answers.map((answer) => [answer.questionId, answer]))
  const mistakes = questions.flatMap((question) => {
    const answer = answers.get(question.id)
    return answer && !answer.correct ? [{ question, answer }] : []
  })

  return (
    <section className="german-mistake-review" aria-labelledby={`german-assessment-mistakes-${result.id}`}>
      <div className="german-mistake-review-heading">
        <div>
          <span className="eyebrow">{copy.mistakeReviewEyebrow}</span>
          <h2 id={`german-assessment-mistakes-${result.id}`}>{copy.mistakeReviewTitle}</h2>
        </div>
        <strong>{copy.mistakeCount(mistakes.length)}</strong>
      </div>
      {mistakes.length === 0 ? (
        <div className="assessment-review-all-correct"><span aria-hidden="true">✓</span><strong>{copy.noMistakes}</strong></div>
      ) : (
        <div className="german-mistake-review-list">
          {mistakes.map(({ question, answer }, index) => (
            <article key={question.id}>
              <small>{copy.questionProgress(index + 1, mistakes.length)} · {germanTopics[question.topicId].shortTitle}</small>
              <h3>{question.prompt}</h3>
              {question.passage && (
                <details className="german-review-passage">
                  <summary>{copy.passage}: {question.passage.title}</summary>
                  <ol>{question.passage.lines.map((line) => <li value={line.number} key={line.number}>{line.text}</li>)}</ol>
                </details>
              )}
              <div className="german-review-response">
                <div className="german-review-answer-legend">
                  <span className="submitted">{copy.yourAnswer}</span>
                  <span className="correct">{copy.correctAnswer}</span>
                </div>
                <GermanQuestionResponseInput
                  question={question}
                  response={germanResponseFromGrade(answer)}
                  disabled
                  reveal
                  matchingPlaceholder={copy.matchingSelect}
                  onChange={() => undefined}
                />
              </div>
              <div className="german-review-explanation"><strong>{copy.explanation}</strong><p>{question.explanation}</p></div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export function GermanCourseView({
  state,
  displayName,
  sourceArchiveLibrary = {},
  sourcePracticeState,
  onChange,
  onImportSourceArchive,
  onSourcePracticeStateChange,
  onSubjectChange,
  onEditProfile,
  onOpenCompanion,
  onResetSubject,
  now = new Date(),
}: {
  state: GermanCourseState
  displayName: string
  sourceArchiveLibrary?: GermanSourceArchiveLibrary
  sourcePracticeState: GermanSourcePracticeState
  onChange: (state: GermanCourseState, completed?: boolean) => void
  onImportSourceArchive?: (files: readonly File[]) => Promise<GermanSourceArchiveBulkImportResult>
  onSourcePracticeStateChange: (state: GermanSourcePracticeState) => void
  onSubjectChange: () => void
  onEditProfile: () => void
  onOpenCompanion: () => void
  onResetSubject: () => void
  now?: Date
}) {
  const { locale, intlLocale, t, copy: appCopy } = useLocalization()
  const copy = germanCourseUiCopy[locale]
  const examCopy = germanExamUiCopy[locale]
  const writingCopy = germanWritingUiCopy[locale]
  const writingReviewCopy = germanWritingReviewUiCopy[locale]
  const writingRevisionCopy = germanWritingRevisionUiCopy[locale]
  const comprehensionCopy = germanComprehensionUiCopy[locale]
  const [startSelection, setStartSelection] = useState<number>()
  const [sessionVisible, setSessionVisible] = useState(false)
  const [introductionVisible, setIntroductionVisible] = useState(false)
  const [completionAward, setCompletionAward] = useState<GermanXpEvent>()
  const [confirmReset, setConfirmReset] = useState(false)
  const [examVisible, setExamVisible] = useState(false)
  const [examIntroductionVisible, setExamIntroductionVisible] = useState(false)
  const [examResultVisible, setExamResultVisible] = useState(false)
  const [writingVisible, setWritingVisible] = useState(false)
  const [writingIntroductionVisible, setWritingIntroductionVisible] = useState(false)
  const [writingResultVisible, setWritingResultVisible] = useState(false)
  const [writingRevisionVisible, setWritingRevisionVisible] = useState(Boolean(state.activeWritingRevision))
  const [sourcePracticeVisible, setSourcePracticeVisible] = useState(Boolean(sourcePracticeState.active))
  const [comprehensionVisible, setComprehensionVisible] = useState(Boolean(state.activeComprehension))
  const [responseDrafts, setResponseDrafts] = useState<Record<string, GermanObjectiveResponse>>({})
  const assignments = useMemo(() => buildGermanAssignments(state, now), [state, now])
  const activeQuestion = currentGermanQuestion(state)
  const activeAnswer = state.activeSession?.answers.find((answer) => answer.questionId === activeQuestion?.id)
  const activeResponse = activeAnswer
    ? germanResponseFromGrade(activeAnswer)
    : activeQuestion
      ? responseDrafts[activeQuestion.id]
      : undefined
  const exerciseReportUrl = useMemo(() => (
    state.activeSession && activeQuestion
      ? buildExerciseReportUrl(
          createGermanExerciseReportReference(
            state.activeSession,
            activeQuestion,
            state.activeSession.questionIndex,
          ),
          window.location.origin,
        )
      : undefined
  ), [activeQuestion, state.activeSession])
  const openComprehensionResult = [...state.comprehensionHistory].reverse().find((result) => {
    const review = state.comprehensionReviews.find((candidate) => candidate.resultId === result.id)
    return !review?.resolvedAt
  })
  const openComprehensionReview = openComprehensionResult
    ? state.comprehensionReviews.find((review) => review.resultId === openComprehensionResult.id)
    : undefined

  const persist = (next: GermanCourseState, completed = false) => onChange(next, completed)

  const startSourcePractice = (
    editionId: ActiveGermanSourcePractice["editionId"],
    mode: GermanSourcePracticeMode,
  ) => {
    if (state.activeSession || state.activeExam || state.activeWriting || state.activeWritingRevision || state.activeComprehension || sourcePracticeState.active) return
    const attempt = sourcePracticeState.history.filter((result) => (
      result.editionId === editionId && result.mode === mode
    )).length + 1
    const active = createActiveGermanSourcePractice(
      editionId,
      mode,
      `${state.courseId}:source:${editionId}:${mode}:${attempt}`,
      now,
    )
    onSourcePracticeStateChange({ ...sourcePracticeState, active })
    setSourcePracticeVisible(true)
  }

  if (!state.startCheck) {
    return (
      <main className="german-welcome-shell">
        <SubjectSwitcher value="german" onChange={(subjectId) => {
          if (subjectId === "math") onSubjectChange()
        }} />
        <section className="german-welcome-card">
          <span className="eyebrow">{copy.pilot}</span>
          <h1>{copy.welcomeTitle(displayName)}</h1>
          <p>{copy.welcomeBody}</p>
          <ul>{copy.startCheckFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
          <button className="primary-button" type="button" onClick={() => persist(startGermanStartCheck(state, now))}>
            {copy.startCheckStart}
          </button>
        </section>
      </main>
    )
  }

  if (!state.startCheck.completedAt) {
    const question = germanStartCheckQuestions[state.startCheck.currentIndex]!
    return (
      <main className="german-check-shell">
        <section className="german-check-card">
          <span className="eyebrow">{copy.startCheckProgress(state.startCheck.currentIndex + 1, germanStartCheckQuestions.length)}</span>
          <div className="german-progress-track"><span style={{ width: `${(state.startCheck.currentIndex + 1) / germanStartCheckQuestions.length * 100}%` }} /></div>
          <small>{question.skill}</small>
          <h1>{copy.startCheckTitle}</h1>
          <p className="german-question-prompt">{question.prompt}</p>
          <div className="german-answer-options">
            {question.options.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-pressed={startSelection === index}
                onClick={() => setStartSelection(index)}
              >
                <span>{String.fromCharCode(65 + index)}</span>{option}
              </button>
            ))}
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={startSelection === undefined}
            onClick={() => {
              if (startSelection === undefined) return
              persist(answerGermanStartCheck(state, startSelection, now), state.startCheck?.currentIndex === germanStartCheckQuestions.length - 1)
              setStartSelection(undefined)
            }}
          >
            {copy.startCheckSubmit}
          </button>
        </section>
      </main>
    )
  }

  if (sourcePracticeState.active && sourcePracticeVisible) {
    return (
      <GermanSourcePracticeView
        practice={sourcePracticeState.active}
        documents={sourceArchiveLibrary[sourcePracticeState.active.editionId] ?? {}}
        onChange={(active) => onSourcePracticeStateChange({ ...sourcePracticeState, active })}
        onComplete={(result: GermanSourcePracticeResult) => {
          onSourcePracticeStateChange(finishGermanSourcePracticeState(sourcePracticeState, result))
          setSourcePracticeVisible(false)
        }}
        onExit={() => setSourcePracticeVisible(false)}
      />
    )
  }

  if (state.activeComprehension && comprehensionVisible) {
    return (
      <GermanComprehensionView
        session={state.activeComprehension}
        onChange={(session) => persist(updateGermanComprehensionPractice(state, session))}
        onComplete={(result) => {
          persist(completeGermanComprehensionPractice(state, result), true)
          setComprehensionVisible(false)
        }}
        onExit={() => setComprehensionVisible(false)}
      />
    )
  }

  if (state.activeWritingRevision && writingRevisionVisible) {
    const revisionResult = state.writingHistory.find((result) => (
      result.id === state.activeWritingRevision?.resultId
    ))
    const revisionReview = state.writingReviews.find((review) => (
      review.resultId === state.activeWritingRevision?.resultId
    ))
    if (revisionResult && revisionReview) {
      return (
        <GermanWritingRevisionView
          result={revisionResult}
          review={revisionReview}
          revision={state.activeWritingRevision}
          priorRevisions={state.writingRevisions}
          onChange={(revision) => persist(updateGermanWritingRevision(state, revision))}
          onComplete={(snapshot) => {
            persist(completeGermanWritingRevision(state, snapshot, now), true)
            setWritingRevisionVisible(false)
            setWritingResultVisible(true)
          }}
          onExit={() => {
            setWritingRevisionVisible(false)
            setWritingResultVisible(true)
          }}
        />
      )
    }
  }

  if (state.activeWriting && writingVisible) {
    return (
      <GermanWritingView
        session={state.activeWriting}
        onChange={(writing) => persist(updateGermanWritingPractice(state, writing))}
        onComplete={(result) => {
          persist(completeGermanWritingPractice(state, result), true)
          setWritingVisible(false)
          setWritingResultVisible(true)
        }}
        onExit={() => setWritingVisible(false)}
      />
    )
  }

  if (writingIntroductionVisible && !state.activeWriting) {
    return (
      <main className="german-exam-intro-shell german-writing-intro-shell">
        <section className="german-exam-intro-card german-writing-intro-card">
          <span className="eyebrow">{writingCopy.eyebrow}</span>
          <h1>{writingCopy.introTitle}</h1>
          <p>{writingCopy.introBody}</p>
          <ul>{writingCopy.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
          <p className="german-writing-no-grade"><strong>{writingCopy.noGrade}</strong></p>
          <div>
            <button className="text-button" type="button" onClick={() => setWritingIntroductionVisible(false)}>{writingCopy.cancel}</button>
            <button className="primary-button" type="button" onClick={() => {
              const next = startGermanWritingPractice(state, now)
              persist(next)
              setWritingIntroductionVisible(false)
              setWritingVisible(Boolean(next.activeWriting))
            }}>{writingCopy.start}</button>
          </div>
        </section>
      </main>
    )
  }

  if (writingResultVisible && state.writingHistory.at(-1)) {
    return (
      <GermanWritingResultView
        result={state.writingHistory.at(-1)!}
        humanReview={state.writingReviews.find((review) => (
          review.resultId === state.writingHistory.at(-1)!.id
        ))}
        revisions={state.writingRevisions}
        activeRevision={state.activeWritingRevision}
        onStartRevision={(resultId) => {
          const next = startGermanWritingRevision(state, resultId, now)
          persist(next)
          if (next.activeWritingRevision) {
            setWritingResultVisible(false)
            setWritingRevisionVisible(true)
          }
        }}
        onResumeRevision={() => {
          setWritingResultVisible(false)
          setWritingRevisionVisible(true)
        }}
        onExit={() => setWritingResultVisible(false)}
      />
    )
  }

  if (examResultVisible && state.examHistory.at(-1)) {
    return (
      <GermanExamResultView
        result={state.examHistory.at(-1)!}
        onExit={() => setExamResultVisible(false)}
      />
    )
  }

  if (state.activeExam && examVisible) {
    return (
      <GermanExamView
        exam={state.activeExam}
        onChange={(exam) => persist(updateGermanStrictExam(state, exam))}
        onComplete={(result) => {
          persist(completeGermanStrictExam(state, result), true)
          setExamVisible(false)
          setExamResultVisible(true)
        }}
        onExit={() => setExamVisible(false)}
      />
    )
  }

  if (examIntroductionVisible && !state.activeExam) {
    return (
      <main className="german-exam-intro-shell">
        <section className="german-exam-intro-card">
          <span className="eyebrow">{examCopy.eyebrow}</span>
          <h1>{examCopy.introTitle}</h1>
          <p>{examCopy.introBody}</p>
          <ul>{examCopy.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
          <p className="german-exam-no-xp"><strong>{examCopy.noXp}</strong></p>
          <div>
            <button className="text-button" type="button" onClick={() => setExamIntroductionVisible(false)}>{examCopy.cancel}</button>
            <button className="primary-button" type="button" onClick={() => {
              const next = startGermanStrictExam(state, now)
              persist(next)
              setExamIntroductionVisible(false)
              setExamVisible(Boolean(next.activeExam))
            }}>{examCopy.start}</button>
          </div>
        </section>
      </main>
    )
  }

  if (state.activeSession && state.activeSession.kind === "lesson" && sessionVisible && introductionVisible) {
    const lesson = germanLessons[germanLessonIdByTopic[state.activeSession.topicId]]
    return (
      <main className="german-lesson-shell">
        <button className="text-button german-back-button" type="button" onClick={() => setSessionVisible(false)}>← {copy.backHome}</button>
        <section className="german-lesson-introduction">
          <span className="eyebrow">{lesson.introduction.eyebrow}</span>
          <h1>{lesson.introduction.title}</h1>
          <p>{lesson.introduction.body}</p>
          <ol>{lesson.introduction.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <div className="german-takeaway"><strong>{copy.lessonGoal}</strong><span>{lesson.introduction.takeaway}</span></div>
          <button className="primary-button" type="button" onClick={() => setIntroductionVisible(false)}>{copy.lessonStart}</button>
        </section>
      </main>
    )
  }

  if (state.activeSession && sessionVisible && activeQuestion) {
    const coaching = germanCoachingForTopic(state.activeSession.topicId, locale)
    const silentAssessment = state.activeSession.kind === "assessment"
    return (
      <main className="german-player-shell">
        <div className="german-player-topbar">
          <button className="text-button" type="button" onClick={() => setSessionVisible(false)}>← {copy.backHome}</button>
          <strong>{state.activeSession.kind === "assessment"
            ? copy.assessment
            : state.activeSession.kind === "review"
              ? copy.review
              : copy.lesson}</strong>
          <span>{copy.questionProgress(state.activeSession.questionIndex + 1, state.activeSession.questionCount)}</span>
        </div>
        <div className="german-progress-track"><span style={{ width: `${(state.activeSession.questionIndex + 1) / state.activeSession.questionCount * 100}%` }} /></div>
        <div className={activeQuestion.passage ? "german-question-layout has-passage" : "german-question-layout"}>
          {activeQuestion.passage && (
            <article className="german-passage" aria-label={`${copy.passage}: ${activeQuestion.passage.title}`}>
              <span className="eyebrow">{copy.passage}</span>
              <h2>{activeQuestion.passage.title}</h2>
              <ol>
                {activeQuestion.passage.lines.map((line) => (
                  <li value={line.number} key={line.number}>{line.text}</li>
                ))}
              </ol>
            </article>
          )}
          <section className="german-question-card">
            <span className="eyebrow">{germanTopics[activeQuestion.topicId].shortTitle}</span>
            <h1 className="german-question-prompt">{activeQuestion.prompt}</h1>
            {exerciseReportUrl && (
              <a
                className="exercise-report-link"
                href={exerciseReportUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true">⚑</span> {appCopy.player.reportIssue} ↗
              </a>
            )}
            <GermanQuestionResponseInput
              question={activeQuestion}
              response={activeResponse}
              disabled={Boolean(activeAnswer)}
              reveal={Boolean(activeAnswer) && !silentAssessment}
              matchingPlaceholder={copy.matchingSelect}
              onChange={(response) => {
                if (!isGermanChoiceQuestion(activeQuestion)) {
                  setResponseDrafts((current) => ({ ...current, [activeQuestion.id]: response }))
                  return
                }
                persist(answerCurrentGermanQuestion(state, response, now))
              }}
            />
            {!isGermanChoiceQuestion(activeQuestion) && !activeAnswer && (
              <button
                className="primary-button german-response-submit"
                type="button"
                disabled={!isCompleteGermanResponse(activeQuestion, activeResponse)}
                onClick={() => {
                  if (activeResponse) persist(answerCurrentGermanQuestion(state, activeResponse, now))
                }}
              >
                {copy.submitAnswer}
              </button>
            )}
            {activeAnswer && (
              silentAssessment ? (
                <div className="german-feedback saved" role="status">
                  <strong>{copy.assessmentAnswerSaved}</strong>
                </div>
              ) : (
                <div className={activeAnswer.correct ? "german-feedback correct" : "german-feedback incorrect"} role="status">
                  <strong>{activeAnswer.correct ? copy.correct : copy.incorrect}</strong>
                  <p>{activeQuestion.explanation}</p>
                  {!activeAnswer.correct && <small><b>{coaching.title}:</b> {coaching.guidance}</small>}
                </div>
              )
            )}
            <div className="german-question-actions">
              {activeAnswer && (
                <button className="primary-button" type="button" onClick={() => {
                  const result = advanceGermanSession(state, now)
                  persist(result.state, result.completed)
                  if (result.completed) {
                    setCompletionAward(result.award)
                    setSessionVisible(false)
                  }
                }}>{copy.continue}</button>
              )}
              <button className="text-button" type="button" onClick={() => {
                persist(requestGermanTopicSupport(state, activeQuestion.topicId, now))
                setSessionVisible(false)
              }}>{copy.support}</button>
            </div>
          </section>
        </div>
      </main>
    )
  }

  const mastered = germanPilotTopicIds.filter(
    (topicId) => Boolean(state.topicProgress[topicId].completedAt),
  ).length
  const nextReview = germanPilotTopicIds
    .map((topicId) => state.topicProgress[topicId].reviewDueAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0]

  return (
    <main className="german-home-shell">
      <aside className="german-stats-column">
        <SubjectSwitcher value="german" onChange={(subjectId) => {
          if (subjectId === "math") onSubjectChange()
        }} />
        <section className="german-stat-card primary">
          <span className="eyebrow">{copy.xp}</span>
          <strong>{state.totalXp}</strong>
          <div className="german-xp-track"><span style={{ width: `${Math.min(100, state.xpSinceAssessment / GERMAN_CURRICULUM_PACKAGE.assessment.xpThreshold * 100)}%` }} /></div>
          <small>{state.xpSinceAssessment}/{GERMAN_CURRICULUM_PACKAGE.assessment.xpThreshold} XP</small>
        </section>
        <section className="german-stat-card">
          <strong>{mastered}/{germanPilotTopicIds.length}</strong>
          <span>{copy.learned}</span>
        </section>
        <section className="german-stat-card">
          <span>{copy.nextReview}</span>
          <strong>{nextReview ? new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" }).format(new Date(nextReview)) : "—"}</strong>
        </section>
        <button className="secondary-button" type="button" onClick={onEditProfile}>{copy.editProfile}</button>
        <button className="secondary-button" type="button" onClick={onOpenCompanion}>{copy.openCompanion}</button>
        {confirmReset ? (
          <div className="reset-confirmation" role="alert">
            <p><strong>{copy.resetTitle}</strong><span>{copy.resetBody}</span></p>
            <div>
              <button className="text-button" type="button" onClick={() => setConfirmReset(false)}>{t("common.cancel")}</button>
              <button className="danger-button" type="button" onClick={onResetSubject}>{copy.resetConfirm}</button>
            </div>
          </div>
        ) : (
          <button className="text-button" type="button" onClick={() => setConfirmReset(true)}>{copy.resetOpen}</button>
        )}
      </aside>
      <section className="german-plan-column">
        <span className="eyebrow">{copy.homeEyebrow}</span>
        <h1>{copy.homeTitle}</h1>
        <p className="german-home-lead">{copy.homeBody}</p>
        {state.startCheck.correctCount !== undefined && (
          <div className="german-start-result">✓ {copy.startCheckResult(state.startCheck.correctCount, germanStartCheckQuestions.length)}</div>
        )}
        <GermanStartCheckMistakeReview state={state} copy={copy} />
        <article className={state.activeComprehension ? "german-comprehension-home-card active" : "german-comprehension-home-card"}>
          <div>
            <span className="eyebrow">{comprehensionCopy.homeEyebrow}</span>
            <h2>{comprehensionCopy.homeTitle}</h2>
            <p>{comprehensionCopy.homeBody}</p>
            <small>{comprehensionCopy.noScore}</small>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={Boolean(openComprehensionResult || sourcePracticeState.active || ((state.activeSession || state.activeExam || state.activeWriting || state.activeWritingRevision) && !state.activeComprehension))}
            onClick={() => {
              if (state.activeComprehension) {
                setComprehensionVisible(true)
                return
              }
              const next = startGermanComprehensionPractice(state, now)
              persist(next)
              setComprehensionVisible(Boolean(next.activeComprehension))
            }}
          >{state.activeComprehension ? comprehensionCopy.resume : comprehensionCopy.start}</button>
        </article>
        {openComprehensionResult && (
          <GermanComprehensionFeedbackCard
            result={openComprehensionResult}
            review={openComprehensionReview}
            onResolve={(resultId) => persist(resolveGermanComprehensionHumanReview(state, resultId, now), true)}
          />
        )}
        <article className={state.activeWriting ? "german-exam-card german-writing-home-card active" : "german-exam-card german-writing-home-card"}>
          <div>
            <span className="eyebrow">{writingCopy.eyebrow}</span>
            <h2>{writingCopy.cardTitle}</h2>
            <p>{writingCopy.cardBody}</p>
            <small>{writingCopy.noGrade}</small>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={Boolean(sourcePracticeState.active || state.activeComprehension || state.activeWritingRevision || ((state.activeSession || state.activeExam) && !state.activeWriting))}
            onClick={() => {
              if (state.activeWriting) setWritingVisible(true)
              else setWritingIntroductionVisible(true)
            }}
          >
            {state.activeWriting ? writingCopy.resume : writingCopy.open}
          </button>
        </article>
        {state.writingHistory.at(-1) && !state.activeWriting && (
          <article className="german-exam-result-card german-writing-result-card">
            <span className="eyebrow">{state.writingReviews.some((review) => review.resultId === state.writingHistory.at(-1)!.id)
              ? writingReviewCopy.learnerEyebrow
              : writingCopy.resultEyebrow}</span>
            <div>
              <h2>{state.writingReviews.some((review) => review.resultId === state.writingHistory.at(-1)!.id)
                ? writingReviewCopy.learnerTitle
                : writingCopy.resultTitle}</h2>
              <strong>{writingCopy.resultSummary(
                state.writingHistory.at(-1)!.wordCount,
                state.writingHistory.at(-1)!.reviewChecks.length,
              )}</strong>
            </div>
            <p>{state.writingReviews.some((review) => review.resultId === state.writingHistory.at(-1)!.id)
              ? writingReviewCopy.learnerBody
              : writingCopy.resultBody}</p>
            <button className="secondary-button" type="button" onClick={() => setWritingResultVisible(true)}>{writingCopy.openLast}</button>
          </article>
        )}
        {state.activeWritingRevision && (
          <article className="german-exam-result-card german-writing-revision-home-card">
            <span className="eyebrow">{writingRevisionCopy.eyebrow(
              state.activeWritingRevision.revisionNumber,
              GERMAN_WRITING_MAX_REVISIONS_PER_RESULT,
            )}</span>
            <div>
              <h2>{writingRevisionCopy.title}</h2>
              <strong>{writingRevisionCopy.autosave}</strong>
            </div>
            <p>{writingRevisionCopy.noScore}</p>
            <button
              className="primary-button"
              type="button"
              onClick={() => setWritingRevisionVisible(true)}
            >{writingRevisionCopy.resume}</button>
          </article>
        )}
        <article className={state.activeExam ? "german-exam-card active" : "german-exam-card"}>
          <div>
            <span className="eyebrow">{examCopy.eyebrow}</span>
            <h2>{examCopy.cardTitle}</h2>
            <p>{examCopy.cardBody}</p>
            <small>{examCopy.noXp}</small>
          </div>
          <button
            className="secondary-button"
            type="button"
            disabled={Boolean(sourcePracticeState.active || state.activeComprehension || state.activeWritingRevision || ((state.activeSession || state.activeWriting) && !state.activeExam))}
            onClick={() => {
              if (state.activeExam) setExamVisible(true)
              else setExamIntroductionVisible(true)
            }}
          >
            {state.activeExam ? examCopy.resume : examCopy.open}
          </button>
        </article>
        {state.examHistory.at(-1) && (
          <article className="german-exam-result-card">
            <span className="eyebrow">{examCopy.resultEyebrow}</span>
            <div>
              <h2>{examCopy.resultTitle}</h2>
              <strong>{examCopy.resultScore(
                state.examHistory.at(-1)!.correctPoints,
                state.examHistory.at(-1)!.maxPoints,
              )}</strong>
            </div>
            {state.examHistory.at(-1)!.submissionReason === "timeout" && (
              <p role="status"><strong>{examCopy.timeout}</strong></p>
            )}
            <p>{examCopy.resultBody}</p>
            <small>{examCopy.noXp}</small>
            <button className="secondary-button" type="button" onClick={() => setExamResultVisible(true)}>{examCopy.openReview}</button>
          </article>
        )}
        {completionAward && (
          <div className="german-completion-banner" role="status">
            <strong>{copy.completed}</strong>
            <span>{copy.earned(completionAward.totalXp)}</span>
            {completionAward.kind === "assessment" && state.assessmentHistory.at(-1) && (
              <small>{copy.assessmentResult(
                state.assessmentHistory.at(-1)!.correct,
                state.assessmentHistory.at(-1)!.total,
              )}</small>
            )}
          </div>
        )}
        {state.assessmentHistory.at(-1) && (
          <GermanAssessmentMistakeReview result={state.assessmentHistory.at(-1)!} copy={copy} />
        )}
        <h2>{copy.assignments}</h2>
        <div className="german-task-list">
          {state.activeSession && (
            <article className="german-task-card resume">
              <div>
                <span>{copy.resume}</span>
                <h3>{state.activeSession.kind === "assessment"
                  ? `${copy.assessment} ${state.activeSession.assessmentNumber ?? ""}`.trim()
                  : germanLessons[germanLessonIdByTopic[state.activeSession.topicId]].title}</h3>
                <p>{copy.questionProgress(state.activeSession.questionIndex + 1, state.activeSession.questionCount)}</p>
              </div>
              <button className="primary-button" type="button" onClick={() => {
                setCompletionAward(undefined)
                setIntroductionVisible(false)
                setSessionVisible(true)
              }}>{copy.resume}</button>
            </article>
          )}
          {!state.activeSession && assignments.map((assignment) => (
            <article className="german-task-card" key={assignment.id}>
              <div>
                <span>{assignment.kind === "assessment"
                  ? copy.assessment
                  : assignment.kind === "review"
                    ? copy.review
                    : copy.lesson} · {copy.maxXp(assignment.maxXp)}</span>
                <h3>{assignment.title}</h3>
                <p>{assignment.description}</p>
                {assignment.recommended && <small className="german-recommended">★ {copy.recommended}</small>}
                {assignment.kind !== "assessment" && germanTopics[assignment.topicId].prerequisiteIds.length > 0 && (
                  <small className="german-prerequisites">
                    <b>{copy.prerequisites}:</b>{" "}
                    {germanTopics[assignment.topicId].prerequisiteIds
                      .map((topicId) => germanTopics[topicId].shortTitle)
                      .join(" · ")}
                  </small>
                )}
              </div>
              <button className="primary-button" type="button" onClick={() => {
                const next = startGermanSession(state, assignment, now)
                persist(next)
                setCompletionAward(undefined)
                setIntroductionVisible(assignment.kind === "lesson")
                setSessionVisible(true)
              }} disabled={Boolean(sourcePracticeState.active || state.activeComprehension)}>{copy.start}</button>
            </article>
          ))}
        </div>
        <div className="german-strand-grid">
          {germanTopicIds.map((topicId) => {
            const topic = germanTopics[topicId]
            const progress = state.topicProgress[topicId]
            return (
              <article className={`german-strand-card ${progress.status}`} key={topicId}>
                <span>{String(topic.courseOrder).padStart(2, "0")}</span>
                <div><h3>{topic.shortTitle}</h3><p>{topic.description}</p></div>
                <small>{progress.helpRequestedAt
                  ? copy.paused
                  : topicId === "writing"
                    ? writingCopy.available
                    : topic.availableInPilot
                      ? progress.completedAt ? "✓" : copy.lesson
                      : copy.comingSoon}</small>
                {progress.helpRequestedAt && <p className="german-paused-note">{copy.pausedBody}</p>}
              </article>
            )
          })}
        </div>
        <GermanSourceArchiveShelf
          library={sourceArchiveLibrary}
          onImport={onImportSourceArchive}
          activePractice={sourcePracticeState.active}
          latestResult={sourcePracticeState.history.at(-1)}
          practiceBlocked={Boolean(state.activeSession || state.activeExam || state.activeWriting || state.activeWritingRevision || state.activeComprehension)}
          onStartPractice={startSourcePractice}
          onResumePractice={() => setSourcePracticeVisible(true)}
        />
        <p className="german-generated-note">{copy.generatedNote}</p>
      </section>
    </main>
  )
}
