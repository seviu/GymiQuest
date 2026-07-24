import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  type GermanGeneratedQuestion,
  type GermanAcceptedTextQuestion,
  type GermanMatchingPair,
  type GermanTruthGridSelection,
} from "./generators"
import { GERMAN_SCORING_POLICY_VERSION } from "./package"

export const germanScoringRuleIds = [
  "exact-option-v1",
  "exact-matching-v1",
  "exact-accepted-text-v1",
  "exact-multi-select-v1",
  "sentence-analysis-deduction-2025-v1",
  "binary-grid-penalty-2024-v1",
  "truth-grid-threshold-2025-v1",
] as const

export type GermanScoringRuleId = typeof germanScoringRuleIds[number]

export interface GermanMatchingResponse {
  responseKind: "matching"
  matches: GermanMatchingPair[]
}

export interface GermanTruthGridResponse {
  responseKind: "truth-grid"
  selections: GermanTruthGridSelection[]
}

export interface GermanAcceptedTextResponse {
  responseKind: "accepted-text"
  text: string
}

export interface GermanBinaryGridResponse {
  responseKind: "binary-grid"
  selections: GermanTruthGridSelection[]
}

export interface GermanMultiSelectResponse {
  responseKind: "multi-select"
  selectedOptionIds: string[]
}

export type GermanObjectiveResponse =
  | string
  | GermanMatchingResponse
  | GermanTruthGridResponse
  | GermanAcceptedTextResponse
  | GermanBinaryGridResponse
  | GermanMultiSelectResponse

export interface GermanObjectiveScoreEvidence {
  scoringRuleId: GermanScoringRuleId
  scoringPolicyVersion: typeof GERMAN_SCORING_POLICY_VERSION
  correctUnits: number
  totalUnits: number
  awardedPoints: number
  maximumPoints: number
  exact: boolean
  incorrectUnits?: number
  intermediateUnits?: number
}

export interface GermanScoringRuleDescriptor {
  id: GermanScoringRuleId
  responseKind: "single-choice" | "matching" | "truth-grid" | "accepted-text" | "multi-select" | "binary-grid"
  awardMode: "all-or-nothing" | "threshold" | "penalty-threshold" | "per-error-deduction"
  maximumPoints: number
  calibrationStatus:
    | "source-informed-training-rule"
    | "source-equivalent-generated-rule"
    | "source-calibrated-digital-adaptation"
  sourceNote: string
}

export const germanScoringRules: Readonly<Record<GermanScoringRuleId, GermanScoringRuleDescriptor>> = Object.freeze({
  "exact-option-v1": Object.freeze({
    id: "exact-option-v1",
    responseKind: "single-choice",
    awardMode: "all-or-nothing",
    maximumPoints: 1,
    calibrationStatus: "source-informed-training-rule",
    sourceNote: "Official 2015–2026 solutions contain exact-selection tasks, but their task-level conversions vary. GymiQuest awards one training point only for the exact option.",
  }),
  "exact-matching-v1": Object.freeze({
    id: "exact-matching-v1",
    responseKind: "matching",
    awardMode: "all-or-nothing",
    maximumPoints: 1,
    calibrationStatus: "source-informed-training-rule",
    sourceNote: "Official 2025 task 14 deducts per sentence-analysis error with no negative points. The generated three-pair interaction is not equivalent, so GymiQuest records pair evidence but awards one training point only when every pair is exact.",
  }),
  "exact-accepted-text-v1": Object.freeze({
    id: "exact-accepted-text-v1",
    responseKind: "accepted-text",
    awardMode: "all-or-nothing",
    maximumPoints: 1,
    calibrationStatus: "source-informed-training-rule",
    sourceNote: "Official correction sheets accept task-specific equivalent wording. GymiQuest uses only a finite authored answer set after Unicode and whitespace normalization; open-ended wording remains ungraded.",
  }),
  "exact-multi-select-v1": Object.freeze({
    id: "exact-multi-select-v1",
    responseKind: "multi-select",
    awardMode: "all-or-nothing",
    maximumPoints: 1,
    calibrationStatus: "source-informed-training-rule",
    sourceNote: "Official correction sheets include tasks with several selections and task-specific conversions. GymiQuest records every option decision but awards one training point only when the selected set is exact.",
  }),
  "sentence-analysis-deduction-2025-v1": Object.freeze({
    id: "sentence-analysis-deduction-2025-v1",
    responseKind: "matching",
    awardMode: "per-error-deduction",
    maximumPoints: 2,
    calibrationStatus: "source-calibrated-digital-adaptation",
    sourceNote: "Official 2025 task 14 starts each four-group sentence part at two points, deducts one point per error, and never awards negative points. GymiQuest supplies the word groups and question choices, so the generated interaction is a calibrated digital adaptation rather than the handwritten source response.",
  }),
  "binary-grid-penalty-2024-v1": Object.freeze({
    id: "binary-grid-penalty-2024-v1",
    responseKind: "binary-grid",
    awardMode: "penalty-threshold",
    maximumPoints: 3,
    calibrationStatus: "source-calibrated-digital-adaptation",
    sourceNote: "The generated interaction uses the six-row 2024 task-9 conversion: correct marks add one, wrong marks subtract one, omissions do not subtract, and intermediate scores 6/5/3-4/<3 award 3/2/1/0 points. The digital control prevents two marks in one row, so it is an adaptation rather than a source-equivalent paper response.",
  }),
  "truth-grid-threshold-2025-v1": Object.freeze({
    id: "truth-grid-threshold-2025-v1",
    responseKind: "truth-grid",
    awardMode: "threshold",
    maximumPoints: 3,
    calibrationStatus: "source-equivalent-generated-rule",
    sourceNote: "The generated grid uses the seven-row conversion documented for official 2025 task 5: seven correct rows earn 3 points, six earn 2, four or five earn 1, and zero to three earn 0. Its statements are newly authored.",
  }),
})

export function germanTruthGridThresholdPoints(correctUnits: number): 0 | 1 | 2 | 3 {
  if (correctUnits >= 7) return 3
  if (correctUnits === 6) return 2
  if (correctUnits >= 4) return 1
  return 0
}

export function germanBinaryGridPenaltyPoints(
  correctUnits: number,
  incorrectUnits: number,
): 0 | 1 | 2 | 3 {
  const intermediate = correctUnits - incorrectUnits
  if (intermediate >= 6) return 3
  if (intermediate === 5) return 2
  if (intermediate >= 3) return 1
  return 0
}

export function germanSentenceAnalysisDeductionPoints(incorrectUnits: number): 0 | 1 | 2 {
  if (incorrectUnits <= 0) return 2
  if (incorrectUnits === 1) return 1
  return 0
}

export function normalizeGermanAcceptedText(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim()
}

export function germanAcceptedAnswerId(
  question: GermanAcceptedTextQuestion,
  text: string,
): string | undefined {
  const normalized = normalizeGermanAcceptedText(text)
  return question.acceptedAnswers.find((answer) => (
    normalizeGermanAcceptedText(answer.text) === normalized
  ))?.id
}

export function germanScoringRuleForQuestion(
  question: GermanGeneratedQuestion,
): GermanScoringRuleDescriptor {
  if (isGermanMatchingQuestion(question)) {
    return question.matchingScoring === "sentence-analysis-deduction-2025"
      ? germanScoringRules["sentence-analysis-deduction-2025-v1"]
      : germanScoringRules["exact-matching-v1"]
  }
  if (isGermanAcceptedTextQuestion(question)) return germanScoringRules["exact-accepted-text-v1"]
  if (isGermanMultiSelectQuestion(question)) return germanScoringRules["exact-multi-select-v1"]
  if (isGermanBinaryGridQuestion(question)) return germanScoringRules["binary-grid-penalty-2024-v1"]
  if (isGermanTruthGridQuestion(question)) return germanScoringRules["truth-grid-threshold-2025-v1"]
  return germanScoringRules["exact-option-v1"]
}

export function scoreGermanObjectiveResponse(
  question: GermanGeneratedQuestion,
  response: GermanObjectiveResponse | undefined,
): GermanObjectiveScoreEvidence {
  const rule = germanScoringRuleForQuestion(question)
  if (isGermanChoiceQuestion(question)) {
    const exact = typeof response === "string" && response === question.correctOptionId
    return {
      scoringRuleId: rule.id,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
      correctUnits: exact ? 1 : 0,
      totalUnits: 1,
      awardedPoints: exact ? 1 : 0,
      maximumPoints: 1,
      exact,
    }
  }

  if (isGermanAcceptedTextQuestion(question)) {
    const text = typeof response === "object" && response?.responseKind === "accepted-text"
      ? response.text
      : ""
    const exact = germanAcceptedAnswerId(question, text) !== undefined
    return {
      scoringRuleId: rule.id,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
      correctUnits: exact ? 1 : 0,
      totalUnits: 1,
      awardedPoints: exact ? 1 : 0,
      maximumPoints: 1,
      exact,
    }
  }

  if (isGermanMultiSelectQuestion(question)) {
    const selectedOptionIds = typeof response === "object" && response?.responseKind === "multi-select"
      ? response.selectedOptionIds
      : []
    const selected = new Set(selectedOptionIds)
    const correct = new Set(question.correctOptionIds)
    const correctUnits = question.options.filter((option) => (
      selected.has(option.id) === correct.has(option.id)
    )).length
    const exact = selectedOptionIds.length === question.selectionCount &&
      correctUnits === question.options.length
    return {
      scoringRuleId: rule.id,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
      correctUnits,
      totalUnits: question.options.length,
      awardedPoints: exact ? 1 : 0,
      maximumPoints: 1,
      exact,
    }
  }

  if (isGermanBinaryGridQuestion(question)) {
    if (question.rows.length !== 6 || question.correctSelections.length !== 6) {
      throw new Error(`German binary-grid question ${question.id} must contain exactly six rows.`)
    }
    const selections = typeof response === "object" && response?.responseKind === "binary-grid"
      ? response.selections
      : []
    const selectedByRow = new Map(selections.map((selection) => [selection.rowId, selection.status]))
    const correctUnits = question.correctSelections.filter((selection) => (
      selectedByRow.get(selection.rowId) === selection.status
    )).length
    const incorrectUnits = selections.length - correctUnits
    const intermediateUnits = correctUnits - incorrectUnits
    const exact = selections.length === question.rows.length && correctUnits === question.rows.length
    return {
      scoringRuleId: rule.id,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
      correctUnits,
      incorrectUnits,
      intermediateUnits,
      totalUnits: question.rows.length,
      awardedPoints: germanBinaryGridPenaltyPoints(correctUnits, incorrectUnits),
      maximumPoints: 3,
      exact,
    }
  }

  if (isGermanTruthGridQuestion(question)) {
    if (question.rows.length !== 7 || question.correctSelections.length !== 7) {
      throw new Error(`German truth-grid question ${question.id} must contain exactly seven rows.`)
    }
    const selections = typeof response === "object" && response?.responseKind === "truth-grid"
      ? response.selections
      : []
    const selectedByRow = new Map(selections.map((selection) => [selection.rowId, selection.status]))
    const correctUnits = question.correctSelections.filter((selection) => (
      selectedByRow.get(selection.rowId) === selection.status
    )).length
    const exact = selections.length === question.rows.length && correctUnits === question.rows.length
    return {
      scoringRuleId: rule.id,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
      correctUnits,
      totalUnits: question.rows.length,
      awardedPoints: germanTruthGridThresholdPoints(correctUnits),
      maximumPoints: 3,
      exact,
    }
  }

  const selectedMatches = typeof response === "object" && response?.responseKind === "matching"
    ? response.matches
    : []
  const selectedByItem = new Map(selectedMatches.map((match) => [match.itemId, match.targetId]))
  const correctUnits = question.correctMatches.filter((match) => (
    selectedByItem.get(match.itemId) === match.targetId
  )).length
  const exact = selectedMatches.length === question.items.length && correctUnits === question.items.length
  const sentenceAnalysis = question.matchingScoring === "sentence-analysis-deduction-2025"
  const incorrectUnits = sentenceAnalysis ? question.items.length - correctUnits : undefined
  return {
    scoringRuleId: rule.id,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    correctUnits,
    ...(incorrectUnits === undefined ? {} : { incorrectUnits }),
    totalUnits: question.items.length,
    awardedPoints: sentenceAnalysis
      ? germanSentenceAnalysisDeductionPoints(incorrectUnits ?? question.items.length)
      : exact ? 1 : 0,
    maximumPoints: sentenceAnalysis ? 2 : 1,
    exact,
  }
}
