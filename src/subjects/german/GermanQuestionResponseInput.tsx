import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  type GermanGeneratedQuestion,
} from "./generators"
import type { GermanObjectiveResponse } from "./grading"
import { germanAcceptedAnswerId } from "./scoringPolicy"

export function GermanQuestionResponseInput({
  question,
  response,
  disabled = false,
  reveal = false,
  matchingPlaceholder,
  onChange,
}: {
  question: GermanGeneratedQuestion
  response?: GermanObjectiveResponse
  disabled?: boolean
  reveal?: boolean
  matchingPlaceholder: string
  onChange: (response: GermanObjectiveResponse) => void
}) {
  if (isGermanChoiceQuestion(question)) {
    const selectedOptionId = typeof response === "string" ? response : undefined
    return (
      <div className="german-answer-options">
        {question.options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            aria-pressed={selectedOptionId === option.id}
            className={reveal
              ? option.id === question.correctOptionId
                ? "correct"
                : selectedOptionId === option.id
                  ? "incorrect"
                  : undefined
              : undefined}
            onClick={() => onChange(option.id)}
          >
            <span>{String.fromCharCode(65 + index)}</span>{option.label}
          </button>
        ))}
      </div>
    )
  }

  if (isGermanAcceptedTextQuestion(question)) {
    const text = typeof response === "object" && response?.responseKind === "accepted-text"
      ? response.text
      : ""
    const correct = germanAcceptedAnswerId(question, text) !== undefined
    const solutionId = `${question.id}:accepted-solution`
    return (
      <label className={reveal ? (correct ? "german-accepted-text correct" : "german-accepted-text incorrect") : "german-accepted-text"}>
        <span>{question.inputLabel}</span>
        <textarea
          value={text}
          rows={3}
          maxLength={question.maximumLength}
          disabled={disabled}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="sentences"
          aria-invalid={reveal && !correct ? true : undefined}
          aria-describedby={reveal ? solutionId : undefined}
          onChange={(event) => onChange({ responseKind: "accepted-text", text: event.currentTarget.value })}
        />
        {reveal && (
          <small id={solutionId} aria-live="polite">
            {correct ? "✓" : `Beispiellösung: ${question.acceptedAnswers[0]?.text ?? ""}`}
          </small>
        )}
      </label>
    )
  }

  if (isGermanMultiSelectQuestion(question)) {
    const selectedOptionIds = typeof response === "object" && response?.responseKind === "multi-select"
      ? response.selectedOptionIds
      : []
    const selected = new Set(selectedOptionIds)
    const correct = new Set(question.correctOptionIds)
    const selectionLimitReached = selected.size >= question.selectionCount
    return (
      <fieldset className="german-multi-select" disabled={disabled}>
        <legend>Wähle genau {question.selectionCount} Antworten.</legend>
        {question.options.map((option, index) => {
          const optionSelected = selected.has(option.id)
          const optionCorrect = correct.has(option.id)
          return (
            <label
              key={option.id}
              className={reveal && optionCorrect ? "correct" : reveal && optionSelected ? "incorrect" : undefined}
            >
              <input
                type="checkbox"
                checked={optionSelected}
                disabled={disabled || (!optionSelected && selectionLimitReached)}
                aria-invalid={reveal && optionSelected && !optionCorrect ? true : undefined}
                onChange={() => {
                  const next = optionSelected
                    ? selectedOptionIds.filter((optionId) => optionId !== option.id)
                    : [...selectedOptionIds, option.id]
                  onChange({ responseKind: "multi-select", selectedOptionIds: next })
                }}
              />
              <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <b>{option.label}</b>
              {reveal && optionCorrect && <small>✓</small>}
            </label>
          )
        })}
      </fieldset>
    )
  }

  if (isGermanBinaryGridQuestion(question)) {
    const selectedSelections = typeof response === "object" && response?.responseKind === "binary-grid"
      ? response.selections
      : []
    const selectedByRow = new Map(selectedSelections.map((selection) => [selection.rowId, selection.status]))
    const correctByRow = new Map(question.correctSelections.map((selection) => [selection.rowId, selection.status]))
    return (
      <fieldset className="german-truth-grid german-binary-grid" disabled={disabled}>
        <legend className="sr-only">{question.prompt}</legend>
        <div className="german-truth-grid-header" aria-hidden="true">
          <span />
          {question.statusOptions.map((option) => <b key={option.id}>{option.label}</b>)}
        </div>
        {question.rows.map((row, index) => {
          const selectedStatus = selectedByRow.get(row.id)
          const correctStatus = correctByRow.get(row.id)
          return (
            <div className="german-truth-grid-row" key={row.id}>
              <div className="german-truth-grid-statement"><b>{index + 1}</b>{row.statement}</div>
              <div role="radiogroup" aria-label={row.statement}>
                {question.statusOptions.map((option) => {
                  const selected = selectedStatus === option.id
                  const correct = correctStatus === option.id
                  return (
                    <label
                      className={reveal && correct ? "correct" : reveal && selected ? "incorrect" : undefined}
                      key={option.id}
                      title={option.label}
                    >
                      <input
                        type="radio"
                        name={`${question.id}:${row.id}`}
                        value={option.id}
                        checked={selected}
                        aria-label={`${row.statement}: ${option.label}`}
                        aria-invalid={reveal && selected && !correct ? true : undefined}
                        onChange={() => {
                          const selections = selectedSelections.filter((selection) => selection.rowId !== row.id)
                          selections.push({ rowId: row.id, status: option.id as "true" | "false" })
                          onChange({ responseKind: "binary-grid", selections })
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </fieldset>
    )
  }

  if (isGermanTruthGridQuestion(question)) {
    const selectedSelections = typeof response === "object" && response?.responseKind === "truth-grid"
      ? response.selections
      : []
    const selectedByRow = new Map(selectedSelections.map((selection) => [selection.rowId, selection.status]))
    const correctByRow = new Map(question.correctSelections.map((selection) => [selection.rowId, selection.status]))
    return (
      <fieldset className="german-truth-grid" disabled={disabled}>
        <legend className="sr-only">{question.prompt}</legend>
        <div className="german-truth-grid-header" aria-hidden="true">
          <span />
          {question.statusOptions.map((option) => <b key={option.id}>{option.label}</b>)}
        </div>
        {question.rows.map((row, index) => {
          const selectedStatus = selectedByRow.get(row.id)
          const correctStatus = correctByRow.get(row.id)
          return (
            <div className="german-truth-grid-row" key={row.id}>
              <div className="german-truth-grid-statement"><b>{index + 1}</b>{row.statement}</div>
              <div role="radiogroup" aria-label={row.statement}>
                {question.statusOptions.map((option) => {
                  const selected = selectedStatus === option.id
                  const correct = correctStatus === option.id
                  return (
                    <label
                      className={reveal && correct ? "correct" : reveal && selected ? "incorrect" : undefined}
                      key={option.id}
                      title={option.label}
                    >
                      <input
                        type="radio"
                        name={`${question.id}:${row.id}`}
                        value={option.id}
                        checked={selected}
                        aria-label={`${row.statement}: ${option.label}`}
                        aria-invalid={reveal && selected && !correct ? true : undefined}
                        onChange={() => {
                          const selections = selectedSelections.filter((selection) => selection.rowId !== row.id)
                          selections.push({
                            rowId: row.id,
                            status: option.id as "true" | "false" | "undecidable",
                          })
                          onChange({ responseKind: "truth-grid", selections })
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </fieldset>
    )
  }

  if (!isGermanMatchingQuestion(question)) return null

  const selectedMatches = typeof response === "object" && response?.responseKind === "matching"
    ? response.matches
    : []
  const selectedByItem = new Map(selectedMatches.map((match) => [match.itemId, match.targetId]))
  const correctByItem = new Map(question.correctMatches.map((match) => [match.itemId, match.targetId]))
  const targetLabelById = new Map(question.targets.map((target) => [target.id, target.label]))

  return (
    <fieldset className="german-matching" disabled={disabled}>
      <legend className="sr-only">{question.prompt}</legend>
      {question.items.map((item, index) => {
        const selectedTargetId = selectedByItem.get(item.id) ?? ""
        const correctTargetId = correctByItem.get(item.id)
        const itemCorrect = selectedTargetId === correctTargetId
        return (
          <label
            className={reveal ? (itemCorrect ? "correct" : "incorrect") : undefined}
            key={item.id}
          >
            <span><b>{index + 1}</b>{item.label}</span>
            <select
              value={selectedTargetId}
              aria-invalid={reveal && !itemCorrect ? true : undefined}
              onChange={(event) => {
                const targetId = event.currentTarget.value
                const matches = selectedMatches.filter((match) => (
                  match.itemId !== item.id && (
                    question.matchingScoring === "sentence-analysis-deduction-2025" ||
                    match.targetId !== targetId
                  )
                ))
                matches.push({ itemId: item.id, targetId })
                onChange({ responseKind: "matching", matches })
              }}
            >
              <option value="" disabled>{matchingPlaceholder}</option>
              {question.targets.map((target) => (
                <option value={target.id} key={target.id}>{target.label}</option>
              ))}
            </select>
            {reveal && (
              <small aria-live="polite">
                {itemCorrect ? "✓" : `→ ${targetLabelById.get(correctTargetId ?? "") ?? ""}`}
              </small>
            )}
          </label>
        )
      })}
    </fieldset>
  )
}
