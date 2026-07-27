import { useEffect, useMemo } from "react"
import { useLocalization } from "../../i18n/localization"
import { TopicTheoryDisclosure } from "../../features/TopicTheoryDisclosure"
import { germanTheoryByTopic, germanTopics } from "./content"
import { germanCourseUiCopy } from "./uiCopy"
import {
  GERMAN_WRITING_MAX_DRAFT_LENGTH,
  GERMAN_WRITING_MAX_TITLE_LENGTH,
  buildGermanWritingForm,
  germanWritingWordCount,
  type GermanWritingHumanReview,
  type GermanWritingResult,
} from "./writing"
import {
  GERMAN_WRITING_MAX_REVISIONS_PER_RESULT,
  germanWritingRevisionCanSave,
  saveGermanWritingRevisionSnapshot,
  updateActiveGermanWritingRevision,
  type ActiveGermanWritingRevision,
  type GermanWritingRevisionSnapshot,
} from "./writingRevision"
import { germanWritingRevisionUiCopy } from "./writingRevisionCopy"

export function GermanWritingRevisionView({
  result,
  review,
  revision,
  priorRevisions,
  onChange,
  onComplete,
  onExit,
}: {
  result: GermanWritingResult
  review: GermanWritingHumanReview
  revision: ActiveGermanWritingRevision
  priorRevisions: readonly GermanWritingRevisionSnapshot[]
  onChange: (revision: ActiveGermanWritingRevision) => void
  onComplete: (snapshot: GermanWritingRevisionSnapshot) => void
  onExit: () => void
}) {
  const { locale } = useLocalization()
  const copy = germanWritingRevisionUiCopy[locale]
  const courseCopy = germanCourseUiCopy[locale]
  const prompt = useMemo(() => (
    buildGermanWritingForm(result.seed).prompts.find((candidate) => candidate.id === result.promptId)
  ), [result.promptId, result.seed])
  const previous = [...priorRevisions]
    .filter((candidate) => candidate.resultId === result.id)
    .sort((left, right) => left.revisionNumber - right.revisionNumber)
    .at(-1)
  const baseTitle = previous?.title ?? result.title
  const baseDraft = previous?.draft ?? result.draft
  const changed = revision.title.trim() !== baseTitle || revision.draft.trim() !== baseDraft
  const canSave = changed && germanWritingRevisionCanSave(revision)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [revision.id])

  return (
    <main className="german-writing-revision-shell">
      <header className="german-writing-revision-topbar">
        <button className="text-button" type="button" onClick={onExit}>← {copy.back}</button>
        <div>
          <span className="eyebrow">{copy.eyebrow(revision.revisionNumber, GERMAN_WRITING_MAX_REVISIONS_PER_RESULT)}</span>
          <strong>{copy.title}</strong>
          <small>{copy.noScore}</small>
        </div>
      </header>

      <section className="german-writing-revision-intro">
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <strong>{copy.noScore}</strong>
      </section>

      <TopicTheoryDisclosure
        className="german-writing-theory"
        topicId="writing"
        label={`${courseCopy.theory}: ${germanTopics.writing.shortTitle}`}
        hint={courseCopy.theoryHint}
        sections={[germanTheoryByTopic.writing]}
        takeawayLabel={courseCopy.lessonGoal}
        headingLevel={2}
      />

      <div className="german-writing-revision-layout">
        <aside className="german-writing-revision-context">
          <section className="german-writing-revision-feedback">
            <span className="eyebrow">{copy.feedback}</span>
            <article><strong>{copy.strength}</strong><p>{review.strength}</p></article>
            <article><strong>{copy.nextStep}</strong><p>{review.nextStep}</p></article>
          </section>
          {prompt && (
            <section>
              <span className="eyebrow">{copy.prompt}</span>
              <h2>{prompt.title}</h2>
              <p>{prompt.prompt}</p>
              <strong>{copy.requirements}</strong>
              <ul>{prompt.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
            </section>
          )}
          <details>
            <summary>{previous ? copy.previousVersion : copy.originalVersion}</summary>
            <h3>{baseTitle || "—"}</h3>
            <div className="german-writing-revision-previous">{baseDraft || "—"}</div>
          </details>
        </aside>

        <section className="german-writing-revision-editor">
          <label>
            <strong>{copy.titleLabel}</strong>
            <input
              value={revision.title}
              maxLength={GERMAN_WRITING_MAX_TITLE_LENGTH}
              placeholder={copy.titlePlaceholder}
              onChange={(event) => onChange(updateActiveGermanWritingRevision(
                revision,
                { title: event.currentTarget.value },
              ))}
            />
          </label>
          <label>
            <strong>{copy.draftLabel}</strong>
            <textarea
              value={revision.draft}
              maxLength={GERMAN_WRITING_MAX_DRAFT_LENGTH}
              placeholder={copy.draftPlaceholder}
              onChange={(event) => onChange(updateActiveGermanWritingRevision(
                revision,
                { draft: event.currentTarget.value },
              ))}
            />
          </label>
          <div className="german-writing-revision-meta">
            <span>{copy.wordCount(germanWritingWordCount(revision.draft))}</span>
            <span>{copy.autosave}</span>
          </div>
          <div className="german-writing-revision-save">
            <div><strong>{copy.saveHint}</strong><small>{copy.noScore}</small></div>
            <button
              className="primary-button"
              type="button"
              disabled={!canSave}
              onClick={() => onComplete(saveGermanWritingRevisionSnapshot(revision))}
            >{copy.save}</button>
          </div>
        </section>
      </div>
    </main>
  )
}
