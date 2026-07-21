import { useMemo } from "react"
import { useLocalization } from "../../i18n/localization"
import { germanTopics } from "./content"
import {
  buildGermanExamBlueprint,
  type GermanExamQuestionResult,
  type GermanExamResult,
} from "./exam"
import { germanExamUiCopy } from "./examCopy"
import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  type GermanGeneratedQuestion,
} from "./generators"
import { GermanQuestionResponseInput } from "./GermanQuestionResponseInput"
import type { GermanObjectiveResponse } from "./grading"

function responseForResult(
  question: GermanGeneratedQuestion,
  result: GermanExamQuestionResult,
): GermanObjectiveResponse | undefined {
  if (isGermanChoiceQuestion(question)) return result.selectedOptionId
  if (isGermanMatchingQuestion(question)) {
    return result.selectedMatches
      ? { responseKind: "matching", matches: result.selectedMatches.map((match) => ({ ...match })) }
      : undefined
  }
  if (isGermanAcceptedTextQuestion(question)) {
    const selectedText = result.selectedText ?? question.acceptedAnswers.find((answer) => (
      answer.id === result.selectedAcceptedAnswerId
    ))?.text
    return selectedText === undefined
      ? undefined
      : { responseKind: "accepted-text", text: selectedText }
  }
  if (isGermanMultiSelectQuestion(question)) {
    return result.selectedOptionIds
      ? { responseKind: "multi-select", selectedOptionIds: [...result.selectedOptionIds] }
      : undefined
  }
  if (isGermanBinaryGridQuestion(question)) {
    return result.selectedSelections
      ? { responseKind: "binary-grid", selections: result.selectedSelections.map((selection) => ({ ...selection })) }
      : undefined
  }
  if (isGermanTruthGridQuestion(question)) {
    return result.selectedSelections
      ? { responseKind: "truth-grid", selections: result.selectedSelections.map((selection) => ({ ...selection })) }
      : undefined
  }
  return undefined
}

export function GermanExamResultView({
  result,
  onExit,
}: {
  result: GermanExamResult
  onExit: () => void
}) {
  const { locale } = useLocalization()
  const copy = germanExamUiCopy[locale]
  const blueprint = useMemo(
    () => buildGermanExamBlueprint(result.seed, result.blueprintVersion),
    [result.blueprintVersion, result.seed],
  )
  const resultsByQuestion = new Map(result.questionResults.map((questionResult) => (
    [questionResult.questionId, questionResult]
  )))
  const mistakes = blueprint.questions.flatMap((question, index) => {
    const questionResult = resultsByQuestion.get(question.id)
    return questionResult && !questionResult.correct
      ? [{ question, questionResult, index }]
      : []
  })

  return (
    <main className="german-exam-shell german-exam-review-shell">
      <header className="german-exam-topbar">
        <div>
          <span className="eyebrow">{copy.reviewEyebrow}</span>
          <strong>{copy.resultScore(result.correctPoints, result.maxPoints)}</strong>
        </div>
        <div className="german-exam-review-count">{copy.reviewMistakes(mistakes.length)}</div>
        <button className="text-button" type="button" onClick={onExit}>← {copy.back}</button>
      </header>

      <section className="german-exam-result-card german-exam-review-hero">
        <span className="eyebrow">{copy.reviewEyebrow}</span>
        <h1>{copy.reviewTitle}</h1>
        <p>{copy.reviewBody}</p>
        <small>{copy.noXp}</small>
      </section>

      {mistakes.length === 0 ? (
        <section className="assessment-review-all-correct german-exam-all-correct">
          <span aria-hidden="true">✓</span><strong>{copy.allCorrect}</strong>
        </section>
      ) : (
        <div className="german-exam-workspace german-exam-review-workspace">
          <aside
            className="german-exam-passage"
            aria-label={`${copy.passage}: ${blueprint.passage.title}`}
            tabIndex={0}
          >
            <span className="eyebrow">{copy.passage}</span>
            <h2>{blueprint.passage.title}</h2>
            <ol>{blueprint.passage.lines.map((line) => <li value={line.number} key={line.number}>{line.text}</li>)}</ol>
          </aside>
          <section className="german-exam-review-list" aria-label={copy.reviewTitle}>
            {mistakes.map(({ question, questionResult, index }) => (
              <article key={question.id}>
                <div className="german-exam-review-question-heading">
                  <span className="eyebrow">{germanTopics[question.topicId].shortTitle}</span>
                  <strong>{copy.question(index + 1, blueprint.questions.length)}</strong>
                </div>
                <h2>{question.prompt}</h2>
                <div className="german-review-response">
                  <div className="german-review-answer-legend">
                    <span className="submitted">{copy.yourAnswer}</span>
                    <span className="correct">{copy.correctAnswer}</span>
                  </div>
                  <GermanQuestionResponseInput
                    question={question}
                    response={responseForResult(question, questionResult)}
                    disabled
                    reveal
                    matchingPlaceholder={copy.matchingSelect}
                    onChange={() => undefined}
                  />
                </div>
                <div className="german-review-explanation">
                  <strong>{copy.explanation}</strong>
                  <p>{question.explanation}</p>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </main>
  )
}
