import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  type GermanGeneratedQuestion,
  type GermanMatchingPair,
  type GermanTruthGridSelection,
} from "./generators"
import {
  germanAcceptedAnswerId,
  normalizeGermanAcceptedText,
  scoreGermanObjectiveResponse,
  type GermanObjectiveResponse,
  type GermanObjectiveScoreEvidence,
} from "./scoringPolicy"

export type {
  GermanAcceptedTextResponse,
  GermanBinaryGridResponse,
  GermanMatchingResponse,
  GermanMultiSelectResponse,
  GermanObjectiveResponse,
  GermanTruthGridResponse,
} from "./scoringPolicy"

export type GermanGradingConfidence = "secure" | "needs-review" | "not-gradable"
export type GermanEvidenceStatus = "automatic-secure" | "awaiting-review" | "not-gradable"

export interface GermanChoiceGrade extends GermanObjectiveScoreEvidence {
  correct: boolean
  gradingConfidence: "secure"
  evidenceStatus: "automatic-secure"
  selectedOptionId: string
  correctOptionId: string
}

export interface GermanMatchingGrade extends GermanObjectiveScoreEvidence {
  correct: boolean
  gradingConfidence: "secure"
  evidenceStatus: "automatic-secure"
  responseKind: "matching"
  selectedMatches: GermanMatchingPair[]
  correctMatches: GermanMatchingPair[]
}

export interface GermanTruthGridGrade extends GermanObjectiveScoreEvidence {
  correct: boolean
  gradingConfidence: "secure"
  evidenceStatus: "automatic-secure"
  responseKind: "truth-grid"
  selectedSelections: GermanTruthGridSelection[]
  correctSelections: GermanTruthGridSelection[]
}

export interface GermanBinaryGridGrade extends GermanObjectiveScoreEvidence {
  correct: boolean
  gradingConfidence: "secure"
  evidenceStatus: "automatic-secure"
  responseKind: "binary-grid"
  selectedSelections: GermanTruthGridSelection[]
  correctSelections: GermanTruthGridSelection[]
}

export interface GermanAcceptedTextGrade extends GermanObjectiveScoreEvidence {
  correct: boolean
  gradingConfidence: "secure"
  evidenceStatus: "automatic-secure"
  responseKind: "accepted-text"
  selectedText: string
  acceptedAnswerId?: string
}

export interface GermanMultiSelectGrade extends GermanObjectiveScoreEvidence {
  correct: boolean
  gradingConfidence: "secure"
  evidenceStatus: "automatic-secure"
  responseKind: "multi-select"
  selectedOptionIds: string[]
  correctOptionIds: string[]
}

export type GermanObjectiveGrade =
  | GermanChoiceGrade
  | GermanMatchingGrade
  | GermanTruthGridGrade
  | GermanBinaryGridGrade
  | GermanAcceptedTextGrade
  | GermanMultiSelectGrade

function normalizedMatches(matches: readonly GermanMatchingPair[]): GermanMatchingPair[] {
  return [...matches]
    .map((match) => ({ ...match }))
    .sort((left, right) => left.itemId.localeCompare(right.itemId))
}

function normalizedTruthSelections(
  selections: readonly GermanTruthGridSelection[],
): GermanTruthGridSelection[] {
  return [...selections]
    .map((selection) => ({ ...selection }))
    .sort((left, right) => left.rowId.localeCompare(right.rowId))
}

function normalizedOptionIds(optionIds: readonly string[]): string[] {
  return [...optionIds].sort((left, right) => left.localeCompare(right))
}

export function gradeGermanObjectiveAnswer(
  question: GermanGeneratedQuestion,
  response: GermanObjectiveResponse,
): GermanObjectiveGrade {
  if (isGermanMatchingQuestion(question)) {
    if (typeof response === "string" || response.responseKind !== "matching") {
      throw new Error(`German matching question ${question.id} requires matching pairs.`)
    }
    const selectedMatches = normalizedMatches(response.matches)
    const correctMatches = normalizedMatches(question.correctMatches)
    const itemIds = new Set(question.items.map((item) => item.id))
    const targetIds = new Set(question.targets.map((target) => target.id))
    const responseItemIds = new Set(selectedMatches.map((match) => match.itemId))
    const responseTargetIds = new Set(selectedMatches.map((match) => match.targetId))
    const requiresOneToOneTargets = question.matchingScoring !== "sentence-analysis-deduction-2025"
    if (
      selectedMatches.length !== question.items.length ||
      responseItemIds.size !== question.items.length ||
      (requiresOneToOneTargets && responseTargetIds.size !== question.targets.length) ||
      selectedMatches.some((match) => !itemIds.has(match.itemId) || !targetIds.has(match.targetId))
    ) {
      throw new Error(`Invalid matching response for German question ${question.id}.`)
    }
    const score = scoreGermanObjectiveResponse(question, response)
    return {
      ...score,
      correct: score.exact,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
      responseKind: "matching",
      selectedMatches,
      correctMatches,
    }
  }
  if (isGermanAcceptedTextQuestion(question)) {
    if (
      typeof response === "string" ||
      response.responseKind !== "accepted-text" ||
      normalizeGermanAcceptedText(response.text).length === 0 ||
      response.text.length > question.maximumLength
    ) {
      throw new Error(`German accepted-text question ${question.id} requires a bounded sentence.`)
    }
    const score = scoreGermanObjectiveResponse(question, response)
    const acceptedAnswerId = germanAcceptedAnswerId(question, response.text)
    return {
      ...score,
      correct: score.exact,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
      responseKind: "accepted-text",
      selectedText: response.text,
      ...(acceptedAnswerId ? { acceptedAnswerId } : {}),
    }
  }
  if (isGermanMultiSelectQuestion(question)) {
    if (typeof response === "string" || response.responseKind !== "multi-select") {
      throw new Error(`German multi-select question ${question.id} requires selected options.`)
    }
    const selectedOptionIds = normalizedOptionIds(response.selectedOptionIds)
    const correctOptionIds = normalizedOptionIds(question.correctOptionIds)
    const validOptionIds = new Set(question.options.map((option) => option.id))
    if (
      selectedOptionIds.length !== question.selectionCount ||
      new Set(selectedOptionIds).size !== selectedOptionIds.length ||
      selectedOptionIds.some((optionId) => !validOptionIds.has(optionId))
    ) {
      throw new Error(`Invalid multi-select response for German question ${question.id}.`)
    }
    const score = scoreGermanObjectiveResponse(question, response)
    return {
      ...score,
      correct: score.exact,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
      responseKind: "multi-select",
      selectedOptionIds,
      correctOptionIds,
    }
  }
  if (isGermanBinaryGridQuestion(question)) {
    if (typeof response === "string" || response.responseKind !== "binary-grid") {
      throw new Error(`German binary-grid question ${question.id} requires one status per answered row.`)
    }
    const selectedSelections = normalizedTruthSelections(response.selections)
    const correctSelections = normalizedTruthSelections(question.correctSelections)
    const rowIds = new Set(question.rows.map((row) => row.id))
    const validStatuses = new Set(question.statusOptions.map((option) => option.id))
    if (
      selectedSelections.length !== question.rows.length ||
      new Set(selectedSelections.map((selection) => selection.rowId)).size !== question.rows.length ||
      selectedSelections.some((selection) => (
        !rowIds.has(selection.rowId) || !validStatuses.has(selection.status)
      ))
    ) {
      throw new Error(`Invalid binary-grid response for German question ${question.id}.`)
    }
    const score = scoreGermanObjectiveResponse(question, response)
    return {
      ...score,
      correct: score.exact,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
      responseKind: "binary-grid",
      selectedSelections,
      correctSelections,
    }
  }
  if (isGermanTruthGridQuestion(question)) {
    if (typeof response === "string" || response.responseKind !== "truth-grid") {
      throw new Error(`German truth-grid question ${question.id} requires one status per row.`)
    }
    const selectedSelections = normalizedTruthSelections(response.selections)
    const correctSelections = normalizedTruthSelections(question.correctSelections)
    const rowIds = new Set(question.rows.map((row) => row.id))
    const validStatuses = new Set(question.statusOptions.map((option) => option.id))
    if (
      selectedSelections.length !== question.rows.length ||
      new Set(selectedSelections.map((selection) => selection.rowId)).size !== question.rows.length ||
      selectedSelections.some((selection) => (
        !rowIds.has(selection.rowId) || !validStatuses.has(selection.status)
      ))
    ) {
      throw new Error(`Invalid truth-grid response for German question ${question.id}.`)
    }
    const score = scoreGermanObjectiveResponse(question, response)
    return {
      ...score,
      correct: score.exact,
      gradingConfidence: "secure",
      evidenceStatus: "automatic-secure",
      responseKind: "truth-grid",
      selectedSelections,
      correctSelections,
    }
  }
  if (!isGermanChoiceQuestion(question)) {
    throw new Error("Unsupported German response kind.")
  }
  if (typeof response !== "string" || !question.options.some((option) => option.id === response)) {
    throw new Error(`Unknown option for German question ${question.id}.`)
  }
  const score = scoreGermanObjectiveResponse(question, response)
  return {
    ...score,
    correct: score.exact,
    gradingConfidence: "secure",
    evidenceStatus: "automatic-secure",
    selectedOptionId: response,
    correctOptionId: question.correctOptionId,
  }
}

export function germanResponseFromGrade(grade: GermanObjectiveGrade): GermanObjectiveResponse {
  if (!("responseKind" in grade)) return grade.selectedOptionId
  if (grade.responseKind === "matching") {
    return { responseKind: "matching", matches: grade.selectedMatches.map((match) => ({ ...match })) }
  }
  if (grade.responseKind === "accepted-text") {
    return { responseKind: "accepted-text", text: grade.selectedText }
  }
  if (grade.responseKind === "multi-select") {
    return { responseKind: "multi-select", selectedOptionIds: [...grade.selectedOptionIds] }
  }
  if (grade.responseKind === "binary-grid") {
    return { responseKind: "binary-grid", selections: grade.selectedSelections.map((selection) => ({ ...selection })) }
  }
  return { responseKind: "truth-grid", selections: grade.selectedSelections.map((selection) => ({ ...selection })) }
}

export function cloneGermanObjectiveResponse(
  response: GermanObjectiveResponse,
): GermanObjectiveResponse {
  if (typeof response === "string") return response
  if (response.responseKind === "matching") {
    return { responseKind: "matching", matches: response.matches.map((match) => ({ ...match })) }
  }
  if (response.responseKind === "accepted-text") {
    return { responseKind: "accepted-text", text: response.text }
  }
  if (response.responseKind === "multi-select") {
    return { responseKind: "multi-select", selectedOptionIds: [...response.selectedOptionIds] }
  }
  if (response.responseKind === "binary-grid") {
    return { responseKind: "binary-grid", selections: response.selections.map((selection) => ({ ...selection })) }
  }
  return { responseKind: "truth-grid", selections: response.selections.map((selection) => ({ ...selection })) }
}

export function isCompleteGermanResponse(
  question: GermanGeneratedQuestion,
  response: GermanObjectiveResponse | undefined,
): boolean {
  if (!isValidGermanResponse(question, response)) return false
  if (isGermanChoiceQuestion(question)) return true
  if (!response || typeof response === "string") return false
  if (isGermanAcceptedTextQuestion(question)) {
    return response.responseKind === "accepted-text" && normalizeGermanAcceptedText(response.text).length > 0
  }
  if (isGermanMultiSelectQuestion(question)) {
    return response.responseKind === "multi-select" &&
      response.selectedOptionIds.length === question.selectionCount &&
      new Set(response.selectedOptionIds).size === response.selectedOptionIds.length
  }
  if (isGermanBinaryGridQuestion(question)) {
    return response.responseKind === "binary-grid" &&
      response.selections.length === question.rows.length &&
      new Set(response.selections.map((selection) => selection.rowId)).size === question.rows.length
  }
  if (isGermanMatchingQuestion(question)) {
    if (response.responseKind !== "matching") return false
    return response.matches.length === question.items.length &&
      new Set(response.matches.map((match) => match.itemId)).size === question.items.length &&
      (question.matchingScoring === "sentence-analysis-deduction-2025" ||
        new Set(response.matches.map((match) => match.targetId)).size === question.targets.length)
  }
  return response.responseKind === "truth-grid" &&
    response.selections.length === question.rows.length &&
    new Set(response.selections.map((selection) => selection.rowId)).size === question.rows.length
}

export function isValidGermanResponse(
  question: GermanGeneratedQuestion,
  response: GermanObjectiveResponse | undefined,
): boolean {
  if (response === undefined) return false
  if (isGermanChoiceQuestion(question)) {
    return typeof response === "string" && question.options.some((option) => option.id === response)
  }
  if (typeof response === "string") return false
  if (isGermanAcceptedTextQuestion(question)) {
    return response.responseKind === "accepted-text" && response.text.length <= question.maximumLength
  }
  if (isGermanMultiSelectQuestion(question)) {
    if (response.responseKind !== "multi-select") return false
    const optionIds = new Set(question.options.map((option) => option.id))
    return response.selectedOptionIds.length <= question.selectionCount &&
      new Set(response.selectedOptionIds).size === response.selectedOptionIds.length &&
      response.selectedOptionIds.every((optionId) => optionIds.has(optionId))
  }
  if (isGermanBinaryGridQuestion(question)) {
    if (response.responseKind !== "binary-grid") return false
    const rowIds = new Set(question.rows.map((row) => row.id))
    const validStatuses = new Set(question.statusOptions.map((option) => option.id))
    return response.selections.length <= question.rows.length &&
      new Set(response.selections.map((selection) => selection.rowId)).size === response.selections.length &&
      response.selections.every((selection) => (
        rowIds.has(selection.rowId) && validStatuses.has(selection.status)
      ))
  }
  if (isGermanMatchingQuestion(question)) {
    if (response.responseKind !== "matching") return false
    const itemIds = new Set(question.items.map((item) => item.id))
    const targetIds = new Set(question.targets.map((target) => target.id))
    return response.matches.length <= question.items.length &&
      new Set(response.matches.map((match) => match.itemId)).size === response.matches.length &&
      (question.matchingScoring === "sentence-analysis-deduction-2025" ||
        new Set(response.matches.map((match) => match.targetId)).size === response.matches.length) &&
      response.matches.every((match) => itemIds.has(match.itemId) && targetIds.has(match.targetId))
  }
  if (!isGermanTruthGridQuestion(question) || response.responseKind !== "truth-grid") return false
  const rowIds = new Set(question.rows.map((row) => row.id))
  const validStatuses = new Set(question.statusOptions.map((option) => option.id))
  return response.selections.length <= question.rows.length &&
    new Set(response.selections.map((selection) => selection.rowId)).size === response.selections.length &&
    response.selections.every((selection) => (
      rowIds.has(selection.rowId) && validStatuses.has(selection.status)
    ))
}
