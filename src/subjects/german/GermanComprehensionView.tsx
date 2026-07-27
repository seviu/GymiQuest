import { useLocalization } from "../../i18n/localization"
import { TopicTheoryDisclosure } from "../../features/TopicTheoryDisclosure"
import {
  buildExerciseReportUrl,
  createGermanComprehensionExerciseReportReference,
} from "../../domain/exerciseReport"
import {
  GERMAN_COMPREHENSION_RESPONSE_MAX_LENGTH,
  germanComprehensionCanSubmit,
  germanComprehensionPassage,
  germanComprehensionPromptById,
  submitGermanComprehensionSession,
  updateGermanComprehensionSession,
  type ActiveGermanComprehensionSession,
  type GermanComprehensionResult,
} from "./comprehension"
import { germanComprehensionUiCopy } from "./comprehensionCopy"
import { germanTheoryByTopic, germanTopics } from "./content"
import { germanCourseUiCopy } from "./uiCopy"

export function GermanComprehensionView({
  session,
  onChange,
  onComplete,
  onExit,
}: {
  session: ActiveGermanComprehensionSession
  onChange: (session: ActiveGermanComprehensionSession) => void
  onComplete: (result: GermanComprehensionResult) => void
  onExit: () => void
}) {
  const { copy: appCopy, locale } = useLocalization()
  const copy = germanComprehensionUiCopy[locale]
  const courseCopy = germanCourseUiCopy[locale]
  const prompt = germanComprehensionPromptById(session.promptId)
  const passage = germanComprehensionPassage(session.promptId)
  if (!prompt || !passage) return null

  const toggleLine = (line: number) => {
    const selected = session.evidenceLines.includes(line)
      ? session.evidenceLines.filter((candidate) => candidate !== line)
      : session.evidenceLines.length < 2
        ? [...session.evidenceLines, line]
        : session.evidenceLines
    onChange(updateGermanComprehensionSession(session, session.response, selected))
  }

  return (
    <main className="german-comprehension-shell">
      <header className="german-comprehension-topbar">
        <button className="text-button" type="button" onClick={onExit}>← {copy.back}</button>
        <div>
          <span className="eyebrow">{copy.practiceEyebrow}</span>
          <strong>{copy.practiceTitle}</strong>
          <small>{copy.noScore}</small>
        </div>
      </header>

      <section className="german-comprehension-boundary">
        <strong>{copy.noScore}</strong>
        <span>{copy.practiceBody}</span>
      </section>

      <div className="german-comprehension-workspace">
        <section className="german-comprehension-passage" aria-labelledby="german-comprehension-passage-title">
          <span className="eyebrow">{copy.passage}</span>
          <h1 id="german-comprehension-passage-title">{passage.title}</h1>
          <div>
            {passage.lines.map((line) => (
              <p key={line.number} className={session.evidenceLines.includes(line.number) ? "selected" : ""}>
                <strong>{line.number}</strong>
                <span>{line.text}</span>
              </p>
            ))}
          </div>
        </section>

        <section className="german-comprehension-response">
          <span className="eyebrow">{copy.question}</span>
          <h2>{prompt.question}</h2>
          <TopicTheoryDisclosure
            className="german-question-theory"
            topicId="reading-evidence"
            label={`${courseCopy.theory}: ${germanTopics["reading-evidence"].shortTitle}`}
            hint={courseCopy.theoryHint}
            sections={[germanTheoryByTopic["reading-evidence"]]}
            takeawayLabel={courseCopy.lessonGoal}
            headingLevel={3}
          />
          <a
            className="exercise-report-link"
            href={buildExerciseReportUrl(
              createGermanComprehensionExerciseReportReference(session, prompt),
              window.location.origin,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true">⚑</span> {appCopy.player.reportIssue} ↗
          </a>
          <fieldset>
            <legend>{copy.evidenceLegend}</legend>
            <p>{copy.evidenceHint}</p>
            <div className="german-comprehension-line-options">
              {passage.lines.map((line) => {
                const checked = session.evidenceLines.includes(line.number)
                return (
                  <label key={line.number} className={checked ? "selected" : ""}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!checked && session.evidenceLines.length >= 2}
                      onChange={() => toggleLine(line.number)}
                    />
                    <span>{copy.lineLabel(line.number)}</span>
                  </label>
                )
              })}
            </div>
            <small>{session.evidenceLines.length >= 2 ? copy.evidenceLimit : copy.selectedLines(session.evidenceLines)}</small>
          </fieldset>
          <label htmlFor="german-comprehension-answer">{copy.answerLabel}</label>
          <textarea
            id="german-comprehension-answer"
            value={session.response}
            maxLength={GERMAN_COMPREHENSION_RESPONSE_MAX_LENGTH}
            placeholder={copy.answerPlaceholder}
            onChange={(event) => onChange(updateGermanComprehensionSession(
              session,
              event.currentTarget.value,
              session.evidenceLines,
            ))}
          />
          <div className="german-comprehension-submit">
            <span>{copy.characters(session.response.length, GERMAN_COMPREHENSION_RESPONSE_MAX_LENGTH)}</span>
            <button
              className="primary-button"
              type="button"
              disabled={!germanComprehensionCanSubmit(session)}
              onClick={() => onComplete(submitGermanComprehensionSession(session))}
            >{copy.submit}</button>
          </div>
          <small>{copy.submitHint}</small>
        </section>
      </div>
    </main>
  )
}
