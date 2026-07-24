import {
  difficultyBandIds,
  generationVersionIds,
  lessonPacingModeIds,
  learnerFeedbackKindIds,
  MAX_ASSESSMENT_SUBMITTED_ANSWER_LENGTH,
  practiceDayIds,
  questionDiagnosticKindIds,
  topicIds,
  type LearnerState,
  type LearnerFeedback,
  type LearningEvent,
  type LearningTask,
  type MockExamPartResult,
  type MockExamResult,
  type MockExamTaskResult,
  type QuestionResult,
  type TopicId,
  type TopicMastery,
  type TopicHelpRequest,
  type XPAward,
} from "../domain/model"
import {
  isLessonPacingQuestionCount,
  lessonPacingTaskMatchesResults,
} from "../domain/lessonPacing"
import {
  CURRICULUM_IDENTITY_SCHEMA_VERSION,
  resolveLearnerCurriculumPackage,
  resolveTaskCurriculumPackage,
  taskMatchesLearnerCurriculum,
} from "../domain/curriculumPackage"
import {
  isActiveArchivePractice,
  isArchivePracticeResult,
  type ActiveArchivePractice,
} from "../domain/archivePractice"
import {
  MOCK_MAX_POINTS,
  MOCK_TASK_COUNT,
  isReplayableMockExam,
  isSupportedGeneratedMockBlueprintVersion,
  type ActiveMockExam,
} from "../domain/mockExam"
import {
  officialMathematicsGradeForEdition,
} from "../domain/officialGradeScale"
import {
  officialExamDefinition,
} from "../domain/officialExams"
import type { OfficialExamBlueprint } from "../domain/officialExam"
import type {
  ActiveLearningSession,
  LearningSessionSnapshot,
} from "../domain/session"
import {
  normalizeLearnerCourseIndex,
  type LearnerCourseIndex,
} from "../domain/courseIndex"
import { courseKeys } from "../domain/subjectIdentity"
import {
  normalizeGermanCourseState,
  type GermanCourseState,
} from "../subjects/german/courseState"
import {
  isGermanSourcePracticeState,
  normalizeGermanSourcePracticeState,
  type GermanSourcePracticeState,
} from "../subjects/german/sourcePractice"
import {
  GERMAN_ASSESSMENT_ACTIVITY_ID,
  GERMAN_COURSE_ID,
  GERMAN_COURSE_VERSION,
  germanGeneratorVersions,
  germanLessonIds,
  germanPilotTopicIds,
  germanTopicIds,
} from "../subjects/german/package"
import { isActiveGermanExam, isGermanExamResult } from "../subjects/german/exam"
import {
  isActiveGermanWritingSession,
  isGermanWritingHumanReview,
  isGermanWritingResult,
} from "../subjects/german/writing"
import {
  isActiveGermanComprehensionSession,
  isGermanComprehensionResult,
  isGermanComprehensionReview,
} from "../subjects/german/comprehension"
import {
  isActiveGermanWritingRevision,
  isGermanWritingRevisionSnapshot,
} from "../subjects/german/writingRevision"
import {
  germanScoringRuleIds,
  germanSentenceAnalysisDeductionPoints,
  germanTruthGridThresholdPoints,
} from "../subjects/german/scoringPolicy"

const BACKUP_FORMAT = "gymiquest-encrypted-backup"
const BACKUP_VERSION = 1
const PAYLOAD_VERSION = 6
const PBKDF2_ITERATIONS = 250_000
const MAX_BACKUP_CHARACTERS = 10_000_000
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const validTopicIds = new Set<string>(topicIds)
const validDifficultyBands = new Set<string>(difficultyBandIds)
const validGenerationVersions = new Set<number>(generationVersionIds)
const validLessonPacingModes = new Set<string>(lessonPacingModeIds)
const validLearnerFeedbackKinds = new Set<string>(learnerFeedbackKindIds)
const validPracticeDayIds = new Set<string>(practiceDayIds)
const validQuestionDiagnosticKinds = new Set<string>(questionDiagnosticKindIds)
const validTaskKinds = new Set(["lesson", "review", "assessment", "repair", "placement"])
const validTaskPurposes = new Set(["lesson-recovery", "prerequisite-refresh", "error-refresh"])
const validTopicStatuses = new Set(["locked", "available", "learning", "mastered"])
const validXpReasons = new Set([
  "lesson-flawless",
  "lesson-full",
  "lesson-partial",
  "lesson-recovery",
  "review-complete",
  "repair-complete",
  "assessment-complete",
  "placement-complete",
])
const validPlayerPhases = new Set(["lesson", "assessment-intro", "questions"])
const validHelpKinds = new Set(["hint", "easier", "concept", "solution", "prerequisites"])
const validConceptRepairStages = new Set(["concept", "example", "check"])
const validGermanTopicIds = new Set<string>(germanTopicIds)
const validGermanPilotTopicIds = new Set<string>(germanPilotTopicIds)
const validGermanLessonIds = new Set<string>([
  ...germanLessonIds,
  GERMAN_ASSESSMENT_ACTIVITY_ID,
])
const validGermanTopicStatuses = new Set([
  "available",
  "learning",
  "mastered",
  "paused",
  "coming-soon",
])
const validGermanSessionKinds = new Set(["lesson", "review", "assessment"])
const validGermanGeneratorVersions = new Set<number>(germanGeneratorVersions)
const validGermanScoringRuleIds = new Set<string>(germanScoringRuleIds)
const validCourseKeys = new Set<string>(Object.values(courseKeys))

export type BackupErrorCode =
  | "crypto-unavailable"
  | "weak-passphrase"
  | "invalid-format"
  | "unsupported-version"
  | "unsupported-curriculum"
  | "locked-or-damaged"
  | "too-large"

export class BackupError extends Error {
  constructor(
    public readonly code: BackupErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "BackupError"
  }
}

export interface GymiQuestBackupPayload {
  version: 6
  createdAt: string
  learner: LearnerState
  activeSession?: ActiveLearningSession
  activeMock?: ActiveMockExam
  activeArchivePractice?: ActiveArchivePractice
  germanCourse?: GermanCourseState
  courseIndex?: LearnerCourseIndex
  germanSourcePractice?: GermanSourcePracticeState
}

interface EncryptedBackupEnvelope {
  format: typeof BACKUP_FORMAT
  version: 1
  createdAt: string
  kdf: {
    algorithm: "PBKDF2"
    hash: "SHA-256"
    iterations: number
    salt: string
  }
  cipher: {
    algorithm: "AES-GCM"
    iv: string
  }
  ciphertext: string
}

function cryptoApi(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new BackupError(
      "crypto-unavailable",
      "Dieser Browser kann keine verschlüsselte Sicherung erstellen.",
    )
  }
  return globalThis.crypto
}

function assertPassphrase(passphrase: string): void {
  if (passphrase.length < 8) {
    throw new BackupError(
      "weak-passphrase",
      "Das Sicherungspasswort muss mindestens 8 Zeichen lang sein.",
    )
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength))
  copy.set(bytes)
  return copy.buffer
}

function base64ToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new BackupError("invalid-format", "Die Sicherungsdatei enthält ungültige Daten.")
  }
  try {
    const binary = atob(value)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    throw new BackupError("invalid-format", "Die Sicherungsdatei enthält ungültige Daten.")
  }
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  usage: KeyUsage,
): Promise<CryptoKey> {
  const api = cryptoApi()
  const sourceKey = await api.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  )
  return api.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: toArrayBuffer(salt),
    },
    sourceKey,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  )
}

function authenticatedHeader(createdAt: string): ArrayBuffer {
  return toArrayBuffer(encoder.encode(`${BACKUP_FORMAT}:${BACKUP_VERSION}:${createdAt}`))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isBoundedString(value: unknown, maximum = 2_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum
}

function isDateString(value: unknown): value is string {
  return isBoundedString(value, 64) && Number.isFinite(Date.parse(value))
}

function isNonNegativeInteger(value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= maximum
  )
}

function isPositiveInteger(value: unknown, maximum = Number.MAX_SAFE_INTEGER): value is number {
  return isNonNegativeInteger(value, maximum) && value > 0
}

function isTopicId(value: unknown): value is TopicId {
  return typeof value === "string" && validTopicIds.has(value)
}

function isTopicIdArray(value: unknown, allowEmpty = false): value is TopicId[] {
  return (
    Array.isArray(value) &&
    (allowEmpty || value.length > 0) &&
    value.length <= topicIds.length &&
    value.every(isTopicId) &&
    new Set(value).size === value.length
  )
}

function isOptionalDate(value: unknown): boolean {
  return value === undefined || isDateString(value)
}

function isStringArray(value: unknown, maximumItems: number, maximumLength = 500): value is string[] {
  return Array.isArray(value) &&
    value.length <= maximumItems &&
    value.every((item) => isBoundedString(item, maximumLength))
}

function isKnownGermanTopic(value: unknown): boolean {
  return typeof value === "string" && validGermanTopicIds.has(value)
}

function isKnownGermanPilotTopic(value: unknown): boolean {
  return typeof value === "string" && validGermanPilotTopicIds.has(value)
}

function isGermanTopicProgressShape(value: unknown, topicId: string): boolean {
  return Boolean(
    isRecord(value) &&
    value.topicId === topicId &&
    typeof value.status === "string" &&
    validGermanTopicStatuses.has(value.status) &&
    isNonNegativeInteger(value.lessonAttempts, 100_000) &&
    isNonNegativeInteger(value.reviewCount, 100_000) &&
    isNonNegativeInteger(value.bestCorrect, 1_000) &&
    isStringArray(value.recentTemplateIds, 100) &&
    isOptionalDate(value.completedAt) &&
    isOptionalDate(value.reviewDueAt) &&
    isOptionalDate(value.helpRequestedAt)
  )
}

function isGermanStartCheckShape(value: unknown): boolean {
  if (!isRecord(value) ||
    !isDateString(value.startedAt) ||
    !isNonNegativeInteger(value.currentIndex, 100) ||
    !isRecord(value.answers) ||
    Object.keys(value.answers).length > 100 ||
    !Object.entries(value.answers).every(([questionId, answer]) => (
      isBoundedString(questionId, 500) && isNonNegativeInteger(answer, 20)
    )) ||
    !isOptionalDate(value.completedAt)
  ) return false
  return value.correctCount === undefined || isNonNegativeInteger(value.correctCount, 100)
}

function isGermanSessionAnswerShape(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (
    !isBoundedString(value.questionId, 1_000) ||
    !isDateString(value.answeredAt) ||
    typeof value.correct !== "boolean" ||
    value.gradingConfidence !== "secure" ||
    value.evidenceStatus !== "automatic-secure"
  ) return false
  const scoringEvidenceKeys = [
    "scoringRuleId",
    "scoringPolicyVersion",
    "correctUnits",
    "totalUnits",
    "awardedPoints",
    "maximumPoints",
    "exact",
  ] as const
  const hasScoringEvidence = scoringEvidenceKeys.some((key) => value[key] !== undefined)
  if (hasScoringEvidence && !(
    typeof value.scoringRuleId === "string" &&
    validGermanScoringRuleIds.has(value.scoringRuleId) &&
    value.scoringPolicyVersion === 1 &&
    isNonNegativeInteger(value.correctUnits, 20) &&
    isPositiveInteger(value.totalUnits, 20) &&
    value.correctUnits <= value.totalUnits &&
    isNonNegativeInteger(value.awardedPoints, 20) &&
    isPositiveInteger(value.maximumPoints, 20) &&
    value.awardedPoints <= value.maximumPoints &&
    typeof value.exact === "boolean" &&
    value.exact === value.correct &&
    (!value.exact || value.awardedPoints === value.maximumPoints)
  )) return false
  if (value.responseKind === "accepted-text") {
    const acceptedAnswerIdValid = value.acceptedAnswerId === undefined || isBoundedString(value.acceptedAnswerId, 500)
    return isBoundedString(value.selectedText, 300) &&
      acceptedAnswerIdValid &&
      hasScoringEvidence &&
      value.scoringRuleId === "exact-accepted-text-v1" &&
      value.totalUnits === 1 &&
      value.correctUnits === (value.correct ? 1 : 0) &&
      value.awardedPoints === (value.correct ? 1 : 0) &&
      value.maximumPoints === 1 &&
      value.correct === (value.acceptedAnswerId !== undefined)
  }
  if (value.responseKind === "multi-select") {
    const validOptionIds = (optionIds: unknown): optionIds is string[] => (
      Array.isArray(optionIds) &&
      optionIds.length === 2 &&
      optionIds.every((optionId) => isBoundedString(optionId, 500)) &&
      new Set(optionIds).size === optionIds.length
    )
    if (!validOptionIds(value.selectedOptionIds) || !validOptionIds(value.correctOptionIds)) return false
    if (!hasScoringEvidence) return false
    const correct = new Set(value.correctOptionIds)
    const selectedCorrect = value.selectedOptionIds.filter((optionId) => correct.has(optionId)).length
    const exact = selectedCorrect === value.correctOptionIds.length
    return value.scoringRuleId === "exact-multi-select-v1" &&
      value.correctUnits === selectedCorrect * 2 &&
      value.totalUnits === 4 &&
      value.awardedPoints === (exact ? 1 : 0) &&
      value.maximumPoints === 1 &&
      value.correct === exact
  }
  if (value.responseKind !== "matching" && value.responseKind !== "truth-grid") {
    const validChoice = isBoundedString(value.selectedOptionId, 500) &&
      isBoundedString(value.correctOptionId, 500)
    if (!validChoice || !hasScoringEvidence) return validChoice
    return value.scoringRuleId === "exact-option-v1" &&
      value.totalUnits === 1 &&
      value.correctUnits === (value.correct ? 1 : 0) &&
      value.awardedPoints === (value.correct ? 1 : 0) &&
      value.maximumPoints === 1
  }
  const validPairs = (
    pairs: unknown,
    allowDuplicateTargets = false,
  ): pairs is Array<{ itemId: string; targetId: string }> => (
    Array.isArray(pairs) &&
    pairs.length > 0 &&
    pairs.length <= 20 &&
    pairs.every((pair) => (
      isRecord(pair) &&
      isBoundedString(pair.itemId, 500) &&
      isBoundedString(pair.targetId, 500)
    )) &&
    new Set(pairs.map((pair) => pair.itemId)).size === pairs.length &&
    (allowDuplicateTargets || new Set(pairs.map((pair) => pair.targetId)).size === pairs.length)
  )
  if (value.responseKind === "matching") {
    const selectedMatches = value.selectedMatches
    const correctMatches = value.correctMatches
    if (!validPairs(
      selectedMatches,
      value.scoringRuleId === "sentence-analysis-deduction-2025-v1",
    ) ||
      !validPairs(correctMatches) ||
      selectedMatches.length !== correctMatches.length
    ) return false
    if (!hasScoringEvidence) return true
    const correctByItem = new Map(correctMatches.map((pair) => [pair.itemId, pair.targetId]))
    const correctUnits = selectedMatches.filter((pair) => (
      correctByItem.get(pair.itemId) === pair.targetId
    )).length
    if (value.scoringRuleId === "sentence-analysis-deduction-2025-v1") {
      const incorrectUnits = correctMatches.length - correctUnits
      return correctMatches.length === 4 &&
        value.correctUnits === correctUnits &&
        value.incorrectUnits === incorrectUnits &&
        value.totalUnits === 4 &&
        value.awardedPoints === germanSentenceAnalysisDeductionPoints(incorrectUnits) &&
        value.maximumPoints === 2 &&
        value.correct === (correctUnits === 4)
    }
    return value.scoringRuleId === "exact-matching-v1" &&
      value.correctUnits === correctUnits &&
      value.totalUnits === correctMatches.length &&
      value.awardedPoints === (value.correct ? 1 : 0) &&
      value.maximumPoints === 1
  }
  const validSelections = (
    selections: unknown,
  ): selections is Array<{ rowId: string; status: "true" | "false" | "undecidable" }> => (
    Array.isArray(selections) &&
    selections.length > 0 &&
    selections.length <= 20 &&
    selections.every((selection) => (
      isRecord(selection) &&
      isBoundedString(selection.rowId, 500) &&
      (selection.status === "true" || selection.status === "false" || selection.status === "undecidable")
    )) &&
    new Set(selections.map((selection) => selection.rowId)).size === selections.length
  )
  const selectedSelections = value.selectedSelections
  const correctSelections = value.correctSelections
  if (!validSelections(selectedSelections) ||
    !validSelections(correctSelections) ||
    selectedSelections.length !== correctSelections.length
  ) return false
  if (!hasScoringEvidence) return true
  const correctByRow = new Map(correctSelections.map((selection) => [selection.rowId, selection.status]))
  const correctUnits = selectedSelections.filter((selection) => (
    correctByRow.get(selection.rowId) === selection.status
  )).length
  return value.scoringRuleId === "truth-grid-threshold-2025-v1" &&
    value.correctUnits === correctUnits &&
    correctSelections.length === 7 &&
    value.totalUnits === 7 &&
    value.awardedPoints === germanTruthGridThresholdPoints(correctUnits) &&
    value.maximumPoints === 3
}

function isGermanTemplateExclusionsShape(value: unknown): boolean {
  return Boolean(
    isRecord(value) &&
    Object.keys(value).length <= germanPilotTopicIds.length &&
    Object.entries(value).every(([topicId, templateIds]) => (
      validGermanPilotTopicIds.has(topicId) && isStringArray(templateIds, 100)
    ))
  )
}

function isGermanActiveSessionShape(value: unknown): boolean {
  if (!isRecord(value) ||
    !isBoundedString(value.id, 1_000) ||
    typeof value.kind !== "string" ||
    !validGermanSessionKinds.has(value.kind) ||
    typeof value.lessonId !== "string" ||
    !validGermanLessonIds.has(value.lessonId) ||
    !isKnownGermanPilotTopic(value.topicId) ||
    !isGermanTemplateExclusionsShape(value.excludedTemplateIdsByTopic) ||
    (value.generatorVersion !== undefined && (
      typeof value.generatorVersion !== "number" ||
      !validGermanGeneratorVersions.has(value.generatorVersion)
    )) ||
    !isBoundedString(value.seed, 2_000) ||
    !isPositiveInteger(value.questionCount, 100) ||
    !isNonNegativeInteger(value.questionIndex, 99) ||
    value.questionIndex >= value.questionCount ||
    !Array.isArray(value.answers) ||
    value.answers.length > value.questionCount ||
    !value.answers.every(isGermanSessionAnswerShape) ||
    !isDateString(value.startedAt) ||
    !isDateString(value.updatedAt)
  ) return false
  if (value.assessmentNumber !== undefined && !isPositiveInteger(value.assessmentNumber, 100_000)) {
    return false
  }
  return value.assessmentTopicIds === undefined || (
    Array.isArray(value.assessmentTopicIds) &&
    value.assessmentTopicIds.length > 0 &&
    value.assessmentTopicIds.length <= germanPilotTopicIds.length &&
    value.assessmentTopicIds.every(isKnownGermanPilotTopic) &&
    new Set(value.assessmentTopicIds).size === value.assessmentTopicIds.length
  )
}

function isGermanXpEventShape(value: unknown): boolean {
  if (!isRecord(value) ||
    !isBoundedString(value.id, 1_000) ||
    !isBoundedString(value.sessionId, 1_000) ||
    typeof value.kind !== "string" ||
    !validGermanSessionKinds.has(value.kind) ||
    !Array.isArray(value.topicIds) ||
    value.topicIds.length > germanPilotTopicIds.length ||
    !value.topicIds.every(isKnownGermanPilotTopic) ||
    new Set(value.topicIds).size !== value.topicIds.length ||
    !isNonNegativeInteger(value.baseXp, 1_000_000) ||
    !isNonNegativeInteger(value.bonusXp, 1_000_000) ||
    !isNonNegativeInteger(value.totalXp, 1_000_000) ||
    !isNonNegativeInteger(value.mistakes, 1_000) ||
    value.policyVersion !== 1 ||
    !isDateString(value.awardedAt)
  ) return false
  return value.topicId === undefined || isKnownGermanTopic(value.topicId)
}

function isGermanAssessmentResultShape(value: unknown): boolean {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.id, 1_000) &&
    isPositiveInteger(value.assessmentNumber, 100_000) &&
    isNonNegativeInteger(value.correct, 100) &&
    isPositiveInteger(value.total, 100) &&
    value.correct <= value.total &&
    Array.isArray(value.topicResults) &&
    value.topicResults.length > 0 &&
    value.topicResults.length <= germanPilotTopicIds.length &&
    value.topicResults.every((result) => Boolean(
      isRecord(result) &&
      isKnownGermanPilotTopic(result.topicId) &&
      isNonNegativeInteger(result.correct, 100) &&
      isPositiveInteger(result.total, 100) &&
      result.correct <= result.total
    )) &&
    isDateString(value.completedAt) &&
    (value.reviewSession === undefined || (
      isGermanActiveSessionShape(value.reviewSession) &&
      isRecord(value.reviewSession) &&
      value.reviewSession.kind === "assessment"
    ))
  )
}

function isGermanCourseShape(value: unknown): boolean {
  if (!isRecord(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2 && value.schemaVersion !== 3 && value.schemaVersion !== 4 && value.schemaVersion !== 5 && value.schemaVersion !== 6 && value.schemaVersion !== 7 && value.schemaVersion !== 8 && value.schemaVersion !== 9) ||
    value.subjectId !== "german" ||
    value.courseKey !== courseKeys.german ||
    value.courseId !== GERMAN_COURSE_ID ||
    value.courseVersion !== GERMAN_COURSE_VERSION ||
    !isBoundedString(value.learnerId, 500) ||
    !isDateString(value.createdAt) ||
    !isDateString(value.updatedAt) ||
    !isNonNegativeInteger(value.totalXp, 1_000_000_000) ||
    !isNonNegativeInteger(value.xpSinceAssessment, 1_000_000_000) ||
    !isRecord(value.topicProgress) ||
    Object.keys(value.topicProgress).length !== germanTopicIds.length ||
    !germanTopicIds.every((topicId) => isGermanTopicProgressShape(
      (value.topicProgress as Record<string, unknown>)[topicId],
      topicId,
    )) ||
    (value.startCheck !== undefined && !isGermanStartCheckShape(value.startCheck)) ||
    !Array.isArray(value.xpLedger) ||
    value.xpLedger.length > 100_000 ||
    !value.xpLedger.every(isGermanXpEventShape) ||
    !Array.isArray(value.completedSessionIds) ||
    !isStringArray(value.completedSessionIds, 100_000, 1_000) ||
    (value.activeSession !== undefined && !isGermanActiveSessionShape(value.activeSession)) ||
    (value.activeExam !== undefined && !isActiveGermanExam(value.activeExam)) ||
    (value.activeWriting !== undefined && !isActiveGermanWritingSession(value.activeWriting)) ||
    (value.activeWritingRevision !== undefined && !isActiveGermanWritingRevision(value.activeWritingRevision)) ||
    (value.activeComprehension !== undefined && !isActiveGermanComprehensionSession(value.activeComprehension)) ||
    (value.examHistory !== undefined && (
      !Array.isArray(value.examHistory) ||
      value.examHistory.length > 10_000 ||
      !value.examHistory.every(isGermanExamResult)
    )) ||
    (value.writingHistory !== undefined && (
      !Array.isArray(value.writingHistory) ||
      value.writingHistory.length > 10_000 ||
      !value.writingHistory.every(isGermanWritingResult)
    )) ||
    (value.writingReviews !== undefined && (
      !Array.isArray(value.writingReviews) ||
      value.writingReviews.length > 10_000 ||
      !value.writingReviews.every(isGermanWritingHumanReview)
    )) ||
    (value.writingRevisions !== undefined && (
      !Array.isArray(value.writingRevisions) ||
      value.writingRevisions.length > 100 ||
      !value.writingRevisions.every(isGermanWritingRevisionSnapshot)
    )) ||
    (value.comprehensionHistory !== undefined && (
      !Array.isArray(value.comprehensionHistory) ||
      value.comprehensionHistory.length > 100 ||
      !value.comprehensionHistory.every(isGermanComprehensionResult)
    )) ||
    (value.comprehensionReviews !== undefined && (
      !Array.isArray(value.comprehensionReviews) ||
      value.comprehensionReviews.length > 100 ||
      !value.comprehensionReviews.every(isGermanComprehensionReview)
    )) ||
    (value.schemaVersion === 6 && !Array.isArray(value.writingHistory)) ||
    (value.schemaVersion === 7 && (
      !Array.isArray(value.writingHistory) ||
      !Array.isArray(value.writingReviews)
    )) ||
    (value.schemaVersion === 8 && (
      !Array.isArray(value.writingHistory) ||
      !Array.isArray(value.writingReviews) ||
      !Array.isArray(value.comprehensionHistory) ||
      !Array.isArray(value.comprehensionReviews)
    )) ||
    (value.schemaVersion === 9 && (
      !Array.isArray(value.writingHistory) ||
      !Array.isArray(value.writingReviews) ||
      !Array.isArray(value.writingRevisions) ||
      !Array.isArray(value.comprehensionHistory) ||
      !Array.isArray(value.comprehensionReviews)
    ))
  ) return false
  return value.assessmentHistory === undefined || (
    Array.isArray(value.assessmentHistory) &&
    value.assessmentHistory.length <= 10_000 &&
    value.assessmentHistory.every(isGermanAssessmentResultShape)
  )
}

function isCourseTimestampMapShape(value: unknown): boolean {
  return Boolean(
    isRecord(value) &&
    Object.keys(value).length <= validCourseKeys.size &&
    Object.entries(value).every(([courseKey, timestamp]) => (
      validCourseKeys.has(courseKey) && isDateString(timestamp)
    ))
  )
}

function isLearnerCourseIndexShape(value: unknown): boolean {
  return Boolean(
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.activeCourseKey === "string" &&
    validCourseKeys.has(value.activeCourseKey) &&
    Array.isArray(value.courseKeys) &&
    value.courseKeys.length > 0 &&
    value.courseKeys.length <= validCourseKeys.size &&
    value.courseKeys.every((courseKey) => typeof courseKey === "string" && validCourseKeys.has(courseKey)) &&
    new Set(value.courseKeys).size === value.courseKeys.length &&
    value.courseKeys.includes(courseKeys.math) &&
    isCourseTimestampMapShape(value.lastUsedAtByCourse) &&
    isCourseTimestampMapShape(value.lastCompletedAtByCourse)
  )
}

function isBoundedDraft(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum
}

function isPoints(value: unknown, maximum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= maximum
}

function isQuestionResult(value: unknown): value is QuestionResult {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.questionId) &&
    isTopicId(value.topicId) &&
    isPositiveInteger(value.attempts, 1_000) &&
    isNonNegativeInteger(value.hintsUsed, 1_000) &&
    isNonNegativeInteger(value.activeSeconds, 31_536_000) &&
    typeof value.independentlySolved === "boolean" &&
    (value.solved === undefined || typeof value.solved === "boolean") &&
    (value.submittedAnswer === undefined || isBoundedString(
      value.submittedAnswer,
      MAX_ASSESSMENT_SUBMITTED_ANSWER_LENGTH,
    )) &&
    (value.verifiedStepIds === undefined || (
      Array.isArray(value.verifiedStepIds) &&
      value.verifiedStepIds.length <= 100 &&
      value.verifiedStepIds.every((stepId) => isBoundedString(stepId, 200)) &&
      new Set(value.verifiedStepIds).size === value.verifiedStepIds.length
    )) &&
    (value.difficultyBand === undefined || (
      typeof value.difficultyBand === "string" && validDifficultyBands.has(value.difficultyBand)
    )) &&
    (value.diagnostic === undefined || (
      isRecord(value.diagnostic) &&
      typeof value.diagnostic.kind === "string" &&
      validQuestionDiagnosticKinds.has(value.diagnostic.kind) &&
      isBoundedString(value.diagnostic.title, 500) &&
      typeof value.diagnostic.resolved === "boolean"
    ))
  )
}

function isLearningEvent(value: unknown): value is LearningEvent {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.id) &&
    isBoundedString(value.taskId) &&
    typeof value.taskKind === "string" &&
    validTaskKinds.has(value.taskKind) &&
    (value.taskPurpose === undefined || (
      typeof value.taskPurpose === "string" && validTaskPurposes.has(value.taskPurpose)
    )) &&
    isTopicIdArray(value.topicIds) &&
    isDateString(value.completedAt) &&
    isNonNegativeInteger(value.activeSeconds, 31_536_000) &&
    isNonNegativeInteger(value.mistakes, 100_000) &&
    isNonNegativeInteger(value.hintsUsed, 100_000) &&
    typeof value.independentlyCompleted === "boolean" &&
    Array.isArray(value.questionResults) &&
    value.questionResults.length <= 1_000 &&
    value.questionResults.every(isQuestionResult)
  )
}

function isLearnerFeedback(value: unknown): value is LearnerFeedback {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.id) &&
    isBoundedString(value.learningEventId) &&
    isBoundedString(value.taskId) &&
    typeof value.taskKind === "string" &&
    validTaskKinds.has(value.taskKind) &&
    isTopicIdArray(value.topicIds) &&
    typeof value.kind === "string" &&
    validLearnerFeedbackKinds.has(value.kind) &&
    isDateString(value.recordedAt)
  )
}

function isXpAward(value: unknown): value is XPAward {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.id) &&
    isBoundedString(value.learnerId) &&
    isBoundedString(value.sourceEventId) &&
    isBoundedString(value.taskId) &&
    typeof value.taskKind === "string" &&
    validTaskKinds.has(value.taskKind) &&
    (value.maxXp === undefined || isNonNegativeInteger(value.maxXp, 100_000)) &&
    isNonNegativeInteger(value.baseXp, 100_000) &&
    isNonNegativeInteger(value.bonusXp, 100_000) &&
    isNonNegativeInteger(value.totalXp, 200_000) &&
    value.totalXp === value.baseXp + value.bonusXp &&
    typeof value.reason === "string" &&
    validXpReasons.has(value.reason) &&
    isPositiveInteger(value.policyVersion, 1_000) &&
    typeof value.countsTowardAssessment === "boolean" &&
    isDateString(value.awardedAt)
  )
}

function isTopicMastery(
  value: unknown,
  topicId: TopicId,
  requireEvidenceScores: boolean,
): value is TopicMastery {
  return Boolean(
    isRecord(value) &&
    value.topicId === topicId &&
    typeof value.status === "string" &&
    validTopicStatuses.has(value.status) &&
    (!requireEvidenceScores || (
      typeof value.supportedMastery === "number" &&
      Number.isFinite(value.supportedMastery) &&
      value.supportedMastery >= 0 &&
      value.supportedMastery <= 1 &&
      typeof value.independentMastery === "number" &&
      Number.isFinite(value.independentMastery) &&
      value.independentMastery >= 0 &&
      value.independentMastery <= 1
    )) &&
    typeof value.retention === "number" &&
    Number.isFinite(value.retention) &&
    value.retention >= 0 &&
    value.retention <= 1 &&
    isNonNegativeInteger(value.reviewStage, 1_000) &&
    isNonNegativeInteger(value.reviewIteration, 1_000_000) &&
    isOptionalDate(value.dueAt) &&
    isOptionalDate(value.masteredAt) &&
    isOptionalDate(value.lastReviewedAt) &&
    isNonNegativeInteger(value.independentSuccesses, 1_000_000)
  )
}

function isMockPartResult(value: unknown): value is MockExamPartResult {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.partId) &&
    isBoundedString(value.taskId) &&
    isTopicId(value.topicId) &&
    isBoundedDraft(value.answer, 10_000) &&
    isBoundedDraft(value.working, 50_000) &&
    (value.milestoneAnswers === undefined || (
      isRecord(value.milestoneAnswers) &&
      Object.entries(value.milestoneAnswers).length <= 20 &&
      Object.entries(value.milestoneAnswers).every(([key, answer]) => (
        isBoundedString(key, 200) && isBoundedDraft(answer, 1_000)
      ))
    )) &&
    (value.earnedMilestoneIds === undefined || (
      Array.isArray(value.earnedMilestoneIds) &&
      value.earnedMilestoneIds.length <= 20 &&
      value.earnedMilestoneIds.every((id) => isBoundedString(id, 200)) &&
      new Set(value.earnedMilestoneIds).size === value.earnedMilestoneIds.length
    )) &&
    typeof value.answerCorrect === "boolean" &&
    typeof value.methodRequired === "boolean" &&
    isPoints(value.maxPoints, 4) &&
    value.maxPoints > 0 &&
    isPoints(value.certainPoints, value.maxPoints) &&
    isPoints(value.reviewablePoints, value.maxPoints) &&
    value.certainPoints + value.reviewablePoints <= value.maxPoints &&
    (value.confidence === "certain" || value.confidence === "manual")
  )
}

function isMockTaskResult(value: unknown): value is MockExamTaskResult {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.taskId) &&
    isPositiveInteger(value.taskNumber, MOCK_TASK_COUNT) &&
    isBoundedString(value.title) &&
    value.maxPoints === 4 &&
    isPoints(value.certainPoints, value.maxPoints) &&
    isPoints(value.reviewablePoints, value.maxPoints) &&
    value.certainPoints + value.reviewablePoints <= value.maxPoints &&
    isNonNegativeInteger(value.activeSeconds, 86_400) &&
    isNonNegativeInteger(value.visitCount, 100_000) &&
    typeof value.flagged === "boolean" &&
    Array.isArray(value.parts) &&
    value.parts.length >= 1 &&
    value.parts.length <= 4 &&
    value.parts.every(isMockPartResult)
  )
}

function isOfficialMockReview(
  value: unknown,
  blueprint: OfficialExamBlueprint,
  certainPoints: unknown,
): boolean {
  if (!isRecord(value)) return false
  const taskScores = value.taskScores
  const taskScoresValid = Array.isArray(taskScores) &&
    taskScores.length === blueprint.tasks.length &&
    taskScores.every((score, index) => (
      score === null || (Number.isInteger(score) && isPoints(score, blueprint.tasks[index]!.maxPoints))
    ))
  if (!taskScoresValid) return false
  if (
    value.editionId !== blueprint.editionId ||
    value.rubricVersion !== blueprint.rubricVersion ||
    (value.status !== "pending" && value.status !== "complete")
  ) {
    return false
  }

  if (value.status === "pending") {
    return value.completedAt === undefined &&
      value.gradeScaleId === undefined &&
      value.mathematicsGrade === undefined
  }

  if (
    !taskScores.every((score) => typeof score === "number") ||
    !isDateString(value.completedAt) ||
    !Number.isInteger(certainPoints) ||
    !isPoints(certainPoints, blueprint.maxPoints) ||
    taskScores.reduce<number>((sum, score) => sum + (score as number), 0) !== certainPoints
  ) {
    return false
  }

  const expectedGrade = officialMathematicsGradeForEdition(
    blueprint.editionId,
    certainPoints as number,
  )
  return expectedGrade
    ? value.gradeScaleId === expectedGrade.gradeScaleId &&
      value.mathematicsGrade === expectedGrade.mathematicsGrade
    : value.gradeScaleId === undefined && value.mathematicsGrade === undefined
}

function isOfficialMockResultForBlueprint(
  value: Record<string, unknown>,
  blueprint: OfficialExamBlueprint,
): boolean {
  if (
    value.editionId !== blueprint.editionId ||
    value.rubricVersion !== blueprint.rubricVersion ||
    value.blueprintVersion !== blueprint.version ||
    value.title !== blueprint.title ||
    !Array.isArray(value.taskResults) ||
    value.taskResults.length !== blueprint.tasks.length ||
    !isOfficialMockReview(value.officialReview, blueprint, value.certainPoints)
  ) {
    return false
  }

  const taskResultsValid = value.taskResults.every((candidate, taskIndex) => {
    if (!isMockTaskResult(candidate)) return false
    const task = blueprint.tasks[taskIndex]!
    if (
      candidate.taskId !== task.id ||
      candidate.taskNumber !== task.taskNumber ||
      candidate.title !== task.title ||
      candidate.maxPoints !== task.maxPoints ||
      !Array.isArray(candidate.parts) ||
      candidate.parts.length !== task.parts.length
    ) {
      return false
    }

    return candidate.parts.every((partCandidate, partIndex) => {
      const part = task.parts[partIndex]!
      return partCandidate.partId === part.id &&
        partCandidate.taskId === task.id &&
        partCandidate.topicId === part.topicId &&
        partCandidate.maxPoints === part.maxPoints &&
        partCandidate.methodRequired === part.methodRequired
    })
  })
  if (!taskResultsValid || !isRecord(value.officialReview)) return false

  const officialReview = value.officialReview
  const taskScores = officialReview.taskScores
  const taskResults = value.taskResults as MockExamTaskResult[]
  return Array.isArray(taskScores) && taskScores.every((score, taskIndex) => {
    if (score === null) return officialReview.status === "pending"
    const taskResult = taskResults[taskIndex]!
    return score >= taskResult.certainPoints &&
      score <= taskResult.certainPoints + taskResult.reviewablePoints
  })
}

function isMockResult(value: unknown): value is MockExamResult {
  if (!isRecord(value)) return false
  const officialDefinition = value.source === "official-archive" && typeof value.editionId === "string"
    ? officialExamDefinition(value.editionId)
    : undefined
  const sourceValid = value.source === undefined || value.source === "generated" || value.source === "official-archive"
  const sourceMetadataValid = value.source === "official-archive"
    ? Boolean(
        officialDefinition &&
        isOfficialMockResultForBlueprint(value, officialDefinition.blueprint),
      )
    : value.officialReview === undefined &&
      value.editionId === undefined &&
      value.rubricVersion === undefined &&
      (value.title === undefined || isBoundedString(value.title))
  const blueprintVersionValid = value.source === "official-archive"
    ? value.blueprintVersion === officialDefinition?.blueprint.version
    : isSupportedGeneratedMockBlueprintVersion(value.blueprintVersion)
  const resultShapeValid = Boolean(
    sourceValid &&
    sourceMetadataValid &&
    isBoundedString(value.id) &&
    isBoundedString(value.seed) &&
    blueprintVersionValid &&
    isDateString(value.startedAt) &&
    isDateString(value.submittedAt) &&
    (value.submissionReason === "submitted" || value.submissionReason === "timeout") &&
    isPositiveInteger(value.durationSeconds, 86_400) &&
    value.maxPoints === MOCK_MAX_POINTS &&
    isPoints(value.certainPoints, value.maxPoints) &&
    isPoints(value.reviewablePoints, value.maxPoints) &&
    value.certainPoints + value.reviewablePoints <= value.maxPoints &&
    Array.isArray(value.taskResults) &&
    value.taskResults.length === MOCK_TASK_COUNT &&
    value.taskResults.every(isMockTaskResult) &&
    isTopicIdArray(value.recoveryTopicIds, true) &&
    value.recoveryTopicIds.length <= 3
  )
  return resultShapeValid
}

function isMasteryRecord(
  value: unknown,
  schemaVersion: number,
): value is LearnerState["mastery"] {
  if (!isRecord(value)) return false
  const entries = Object.entries(value)
  return (
    entries.length <= topicIds.length &&
    entries.every(([key, mastery]) => (
      isTopicId(key) && isTopicMastery(mastery, key, schemaVersion >= 7)
    ))
  )
}

function isLearnerPreferences(value: unknown, schemaVersion: number): boolean {
  if (!isRecord(value)) return false
  const examDateIsValid = value.examDate === undefined || (() => {
    if (typeof value.examDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.examDate)) {
      return false
    }
    const [year, month, day] = value.examDate.split("-").map(Number)
    const parsed = new Date(Date.UTC(year!, month! - 1, day!))
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month! - 1 && parsed.getUTCDate() === day
  })()
  return Boolean(
    examDateIsValid &&
    Array.isArray(value.practiceDays) &&
    value.practiceDays.length >= 1 &&
    value.practiceDays.length <= practiceDayIds.length &&
    value.practiceDays.every((day) => typeof day === "string" && validPracticeDayIds.has(day)) &&
    new Set(value.practiceDays).size === value.practiceDays.length &&
    (value.sessionMinutes === 10 || value.sessionMinutes === 15 || value.sessionMinutes === 20) &&
    (value.helpStyle === "concise" || value.helpStyle === "visual" || value.helpStyle === "story" || value.helpStyle === "step-by-step") &&
    (value.visualMode === "calm" || value.visualMode === "focus" || value.visualMode === "high-contrast") &&
    (schemaVersion < 11 || value.readingMode === "standard" || value.readingMode === "spacious") &&
    (schemaVersion < 11 || value.geometryControlSide === "right" || value.geometryControlSide === "left")
  )
}

function isTopicHelpRequest(value: unknown): value is TopicHelpRequest {
  return Boolean(
    isRecord(value) &&
    isTopicId(value.topicId) &&
    isDateString(value.requestedAt),
  )
}

function isLearningTask(value: unknown): value is LearningTask {
  return Boolean(
    isRecord(value) &&
    isBoundedString(value.id) &&
    typeof value.kind === "string" &&
    validTaskKinds.has(value.kind) &&
    isBoundedString(value.title) &&
    isBoundedString(value.description, 10_000) &&
    isTopicIdArray(value.topicIds) &&
    isTopicIdArray(value.prerequisiteIds, true) &&
    isNonNegativeInteger(value.maxXp, 100_000) &&
    isPositiveInteger(value.questionCount, 1_000) &&
    isBoundedString(value.seed) &&
    (value.contentLocale === undefined || value.contentLocale === "en" || value.contentLocale === "it" || value.contentLocale === "es" || value.contentLocale === "de") &&
    resolveTaskCurriculumPackage(value) !== undefined &&
    (value.purpose === undefined || (
      typeof value.purpose === "string" && validTaskPurposes.has(value.purpose)
    )) &&
    (value.generation === undefined || Boolean(
      isRecord(value.generation) &&
      typeof value.generation.version === "number" &&
      validGenerationVersions.has(value.generation.version) &&
      Array.isArray(value.generation.difficultyBands) &&
      value.generation.difficultyBands.length === value.questionCount &&
      value.generation.difficultyBands.every((band) => (
        typeof band === "string" && validDifficultyBands.has(band)
      ))
    )) &&
    (value.pacing === undefined || Boolean(
      value.kind === "lesson" &&
      isRecord(value.pacing) &&
      value.pacing.version === 1 &&
      typeof value.pacing.mode === "string" &&
      validLessonPacingModes.has(value.pacing.mode) &&
      isRecord(value.generation) &&
      isLessonPacingQuestionCount(
        value.pacing.mode as (typeof lessonPacingModeIds)[number],
        value.questionCount,
      )
    )) &&
    isOptionalDate(value.dueAt) &&
    (value.assessmentNumber === undefined || isPositiveInteger(value.assessmentNumber, 1_000_000))
  )
}

function parseEnvelope(serialized: string): EncryptedBackupEnvelope {
  if (serialized.length > MAX_BACKUP_CHARACTERS) {
    throw new BackupError("too-large", "Die Sicherungsdatei ist unerwartet gross.")
  }

  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch {
    throw new BackupError("invalid-format", "Diese Datei ist keine GymiQuest-Sicherung.")
  }
  if (!isRecord(value) || value.format !== BACKUP_FORMAT) {
    throw new BackupError("invalid-format", "Diese Datei ist keine GymiQuest-Sicherung.")
  }
  if (value.version !== BACKUP_VERSION) {
    throw new BackupError(
      "unsupported-version",
      "Diese Sicherung wurde mit einer nicht unterstützten Version erstellt.",
    )
  }
  if (
    !isDateString(value.createdAt) ||
    !isRecord(value.kdf) ||
    value.kdf.algorithm !== "PBKDF2" ||
    value.kdf.hash !== "SHA-256" ||
    typeof value.kdf.iterations !== "number" ||
    !Number.isInteger(value.kdf.iterations) ||
    value.kdf.iterations < 100_000 ||
    value.kdf.iterations > 2_000_000 ||
    typeof value.kdf.salt !== "string" ||
    !isRecord(value.cipher) ||
    value.cipher.algorithm !== "AES-GCM" ||
    typeof value.cipher.iv !== "string" ||
    typeof value.ciphertext !== "string"
  ) {
    throw new BackupError("invalid-format", "Die Sicherungsdatei ist unvollständig.")
  }

  return value as unknown as EncryptedBackupEnvelope
}

function isLearnerShape(value: unknown): value is LearnerState {
  if (!isRecord(value)) return false
  return Boolean(
    isPositiveInteger(value.schemaVersion, CURRICULUM_IDENTITY_SCHEMA_VERSION) &&
    isBoundedString(value.learnerId) &&
    isBoundedString(value.displayName) &&
    resolveLearnerCurriculumPackage(value) !== undefined &&
    isDateString(value.createdAt) &&
    isDateString(value.updatedAt) &&
    isOptionalDate(value.profileCompletedAt) &&
    isOptionalDate(value.placementCompletedAt) &&
    ((value.schemaVersion < 5 && value.preferences === undefined) || isLearnerPreferences(value.preferences, value.schemaVersion)) &&
    isNonNegativeInteger(value.totalXp, 1_000_000_000) &&
    isNonNegativeInteger(value.xpSinceAssessment, 1_000_000_000) &&
    isPositiveInteger(value.assessmentThreshold, 1_000_000) &&
    isPositiveInteger(value.assessmentNumber, 1_000_000) &&
    isMasteryRecord(value.mastery, value.schemaVersion) &&
    ((value.schemaVersion < 9 && value.topicHelpRequests === undefined) || (
      Array.isArray(value.topicHelpRequests) &&
      value.topicHelpRequests.length <= topicIds.length &&
      value.topicHelpRequests.every(isTopicHelpRequest) &&
      new Set(value.topicHelpRequests.map((request) => request.topicId)).size === value.topicHelpRequests.length
    )) &&
    Array.isArray(value.learningEvents) &&
    value.learningEvents.length <= 100_000 &&
    value.learningEvents.every(isLearningEvent) &&
    ((value.schemaVersion < 8 && value.learnerFeedback === undefined) || (
      Array.isArray(value.learnerFeedback) &&
      value.learnerFeedback.length <= 100_000 &&
      value.learnerFeedback.every(isLearnerFeedback)
    )) &&
    Array.isArray(value.xpLedger) &&
    value.xpLedger.length <= 100_000 &&
    value.xpLedger.every(isXpAward) &&
    Array.isArray(value.completedTaskIds) &&
    value.completedTaskIds.length <= 100_000 &&
    value.completedTaskIds.every((taskId) => isBoundedString(taskId)) &&
    ((value.schemaVersion < 4 && value.mockHistory === undefined) || (
      Array.isArray(value.mockHistory) &&
      value.mockHistory.length <= 10_000 &&
      value.mockHistory.every(isMockResult)
    )) &&
    ((value.schemaVersion < 10 && value.archivePracticeHistory === undefined) || (
      Array.isArray(value.archivePracticeHistory) &&
      value.archivePracticeHistory.length <= 10_000 &&
      value.archivePracticeHistory.every(isArchivePracticeResult)
    ))
  )
}

function assertSupportedBackupCurriculum(value: unknown): void {
  if (!isRecord(value) || !isRecord(value.learner)) return
  const learner = value.learner
  const schemaVersion = learner.schemaVersion
  const courseId = learner.courseId
  if (
    typeof schemaVersion !== "number" ||
    !isPositiveInteger(schemaVersion, CURRICULUM_IDENTITY_SCHEMA_VERSION) ||
    typeof courseId !== "string" ||
    !isBoundedString(courseId)
  ) {
    return
  }

  const versionShapeValid = schemaVersion < CURRICULUM_IDENTITY_SCHEMA_VERSION
    ? learner.courseVersion === undefined || isPositiveInteger(learner.courseVersion, 1_000_000)
    : isPositiveInteger(learner.courseVersion, 1_000_000)
  if (!versionShapeValid || resolveLearnerCurriculumPackage(learner)) return

  const versionLabel = typeof learner.courseVersion === "number"
    ? `Version ${learner.courseVersion}`
    : "eine ältere Version"
  throw new BackupError(
    "unsupported-curriculum",
    `Diese Sicherung gehört zum Lehrplanpaket „${courseId}“ (${versionLabel}), das diese App-Version nicht unterstützt.`,
  )
}

function assertSupportedBackupTaskCurriculum(value: unknown): void {
  if (!isRecord(value) || !isRecord(value.activeSession)) return
  const sessions = [value.activeSession]
  const returnContext = value.activeSession.prerequisiteDetour
  if (
    isRecord(returnContext) &&
    returnContext.kind === "prerequisite-refresh" &&
    isRecord(returnContext.origin)
  ) {
    sessions.push(returnContext.origin)
  }

  for (const session of sessions) {
    if (
      !isRecord(session.task) ||
      session.task.curriculum === undefined ||
      !isRecord(session.task.curriculum)
    ) {
      continue
    }
    const curriculum = session.task.curriculum
    if (
      typeof curriculum.courseId !== "string" ||
      !isBoundedString(curriculum.courseId) ||
      !isPositiveInteger(curriculum.version, 1_000_000) ||
      resolveTaskCurriculumPackage(session.task)
    ) {
      continue
    }
    throw new BackupError(
      "unsupported-curriculum",
      `Die pausierte Aufgabe gehört zum Lehrplanpaket „${curriculum.courseId}“ (Version ${curriculum.version}), das diese App-Version nicht unterstützt.`,
    )
  }
}

function isSessionSnapshotShape(value: unknown): value is LearningSessionSnapshot {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !isBoundedString(value.id) ||
    !isLearningTask(value.task) ||
    typeof value.phase !== "string" ||
    !validPlayerPhases.has(value.phase) ||
    !isNonNegativeInteger(value.pageIndex, 1_000) ||
    !isNonNegativeInteger(value.activeSeconds, 31_536_000) ||
    (value.timerPaused !== undefined && typeof value.timerPaused !== "boolean") ||
    !isRecord(value.question) ||
    !isDateString(value.startedAt) ||
    !isDateString(value.updatedAt)
  ) {
    return false
  }

  const question = value.question
  return Boolean(
    isNonNegativeInteger(question.questionIndex, value.task.questionCount - 1) &&
    typeof question.answer === "string" &&
    question.answer.length <= 10_000 &&
    isNonNegativeInteger(question.submissions, 100_000) &&
    isNonNegativeInteger(question.mistakes, 100_000) &&
    isNonNegativeInteger(question.helpCount, 100_000) &&
    Array.isArray(question.activeHelp) &&
    question.activeHelp.length <= validHelpKinds.size &&
    question.activeHelp.every(
      (help) => typeof help === "string" && validHelpKinds.has(help),
    ) &&
    new Set(question.activeHelp).size === question.activeHelp.length &&
    (question.feedback === null || question.feedback === "correct" || question.feedback === "wrong") &&
    Array.isArray(question.results) &&
    question.results.length <= value.task.questionCount &&
    question.results.every(isQuestionResult) &&
    question.results.length === question.questionIndex &&
    (
      value.task.pacing === undefined ||
      lessonPacingTaskMatchesResults(value.task, question.results)
    ) &&
    (question.firstDiagnostic === undefined || (
      isRecord(question.firstDiagnostic) &&
      typeof question.firstDiagnostic.kind === "string" &&
      validQuestionDiagnosticKinds.has(question.firstDiagnostic.kind) &&
      isBoundedString(question.firstDiagnostic.title, 500)
    )) &&
    (question.verifiedPracticeSteps === undefined || (
      Array.isArray(question.verifiedPracticeSteps) &&
      question.verifiedPracticeSteps.length <= 100 &&
      question.verifiedPracticeSteps.every((stepId) => isBoundedString(stepId, 200)) &&
      new Set(question.verifiedPracticeSteps).size === question.verifiedPracticeSteps.length
    )) &&
    (question.conceptRepair === undefined || (
      isRecord(question.conceptRepair) &&
      (question.conceptRepair.version === 1 || question.conceptRepair.version === 2 || question.conceptRepair.version === 3 || question.conceptRepair.version === 4 || question.conceptRepair.version === 5 || question.conceptRepair.version === 6) &&
      isBoundedString(question.conceptRepair.seed, 1_000) &&
      typeof question.conceptRepair.stage === "string" &&
      validConceptRepairStages.has(question.conceptRepair.stage) &&
      isBoundedDraft(question.conceptRepair.teachBack, 2_000) &&
      isBoundedDraft(question.conceptRepair.answer, 10_000) &&
      isNonNegativeInteger(question.conceptRepair.attempts, 100_000) &&
      (question.conceptRepair.feedback === null ||
        question.conceptRepair.feedback === "correct" ||
        question.conceptRepair.feedback === "wrong")
    )) &&
    typeof question.questionStartedAt === "number" &&
    Number.isFinite(question.questionStartedAt) &&
    question.questionStartedAt >= 0
  )
}

function isSessionShape(value: unknown): value is ActiveLearningSession {
  if (!isSessionSnapshotShape(value)) return false
  if (!isRecord(value) || value.prerequisiteDetour === undefined) return true
  const detour = value.prerequisiteDetour
  return Boolean(
    value.task.kind === "repair" &&
    value.task.purpose === "prerequisite-refresh" &&
    isRecord(detour) &&
    detour.kind === "prerequisite-refresh" &&
    isSessionSnapshotShape(detour.origin) &&
    !(
      isRecord(detour.origin) &&
      detour.origin.prerequisiteDetour !== undefined
    )
  )
}

function sessionTasksMatchLearnerCurriculum(
  session: ActiveLearningSession,
  learner: LearnerState,
): boolean {
  if (!taskMatchesLearnerCurriculum(session.task, learner)) return false
  const origin = session.prerequisiteDetour?.origin
  return !origin || taskMatchesLearnerCurriculum(origin.task, learner)
}

function isActiveMockShape(value: unknown): value is ActiveMockExam {
  const officialDefinition = isRecord(value) &&
    value.source === "official-archive" &&
    typeof value.editionId === "string"
    ? officialExamDefinition(value.editionId)
    : undefined
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.kind !== "mock-exam" ||
    (value.source !== undefined && value.source !== "generated" && value.source !== "official-archive") ||
    (value.editionId !== undefined && !isBoundedString(value.editionId)) ||
    !isBoundedString(value.id) ||
    !isBoundedString(value.seed) ||
    (value.source === "official-archive"
      ? !officialDefinition || value.blueprintVersion !== officialDefinition.blueprint.version
      : !isSupportedGeneratedMockBlueprintVersion(value.blueprintVersion)) ||
    !isPositiveInteger(value.durationSeconds, 86_400) ||
    !isDateString(value.startedAt) ||
    !isDateString(value.deadlineAt) ||
    !isDateString(value.updatedAt) ||
    !isNonNegativeInteger(value.currentTaskIndex, MOCK_TASK_COUNT - 1) ||
    !Array.isArray(value.progress) ||
    value.progress.length !== MOCK_TASK_COUNT
  ) {
    return false
  }

  const progressValid = value.progress.every((task) => Boolean(
    isRecord(task) &&
    isBoundedString(task.taskId) &&
    typeof task.visited === "boolean" &&
    isNonNegativeInteger(task.visitCount, 100_000) &&
    typeof task.flagged === "boolean" &&
    isNonNegativeInteger(task.activeSeconds, 86_400) &&
    Array.isArray(task.parts) &&
    task.parts.length >= 1 &&
    task.parts.length <= 4 &&
    task.parts.every((part) => Boolean(
      isRecord(part) &&
      isBoundedString(part.partId) &&
      isBoundedDraft(part.answer, 10_000) &&
      isBoundedDraft(part.working, 50_000) &&
      (part.milestoneAnswers === undefined || (
        isRecord(part.milestoneAnswers) &&
        Object.entries(part.milestoneAnswers).length <= 20 &&
        Object.entries(part.milestoneAnswers).every(([key, answer]) => (
          isBoundedString(key, 200) && isBoundedDraft(answer, 1_000)
        ))
      ))
    ))
  ))
  if (!progressValid) return false

  const candidate = value as unknown as ActiveMockExam
  return isReplayableMockExam(candidate)
}

function parsePayload(value: unknown): GymiQuestBackupPayload {
  assertSupportedBackupCurriculum(value)
  assertSupportedBackupTaskCurriculum(value)
  if (
    !isRecord(value) ||
    (
      value.version !== 1 &&
      value.version !== 2 &&
      value.version !== 3 &&
      value.version !== 4 &&
      value.version !== 5 &&
      value.version !== PAYLOAD_VERSION
    ) ||
    !isDateString(value.createdAt) ||
    !isLearnerShape(value.learner) ||
    (value.activeSession !== undefined && !isSessionShape(value.activeSession)) ||
    (value.activeMock !== undefined && !isActiveMockShape(value.activeMock)) ||
    (value.activeArchivePractice !== undefined && !isActiveArchivePractice(value.activeArchivePractice)) ||
    ((value.version === 4 || value.version === 5 || value.version === PAYLOAD_VERSION) && value.germanCourse !== undefined && !isGermanCourseShape(value.germanCourse)) ||
    ((value.version === 4 || value.version === 5 || value.version === PAYLOAD_VERSION) && value.courseIndex !== undefined && !isLearnerCourseIndexShape(value.courseIndex)) ||
    ((value.version === 5 || value.version === PAYLOAD_VERSION) && value.germanSourcePractice !== undefined && !isGermanSourcePracticeState(value.germanSourcePractice))
  ) {
    throw new BackupError("invalid-format", "Die entschlüsselte Sicherung ist unvollständig.")
  }

  const learner = value.learner as LearnerState
  const germanCourse = (value.version === 4 || value.version === 5 || value.version === PAYLOAD_VERSION) && value.germanCourse
    ? normalizeGermanCourseState(value.germanCourse)
    : undefined
  const courseIndex = (value.version === 4 || value.version === 5 || value.version === PAYLOAD_VERSION) && value.courseIndex
    ? normalizeLearnerCourseIndex(value.courseIndex)
    : undefined
  const germanSourcePractice = (value.version === 5 || value.version === PAYLOAD_VERSION) && value.germanSourcePractice
    ? normalizeGermanSourcePracticeState(value.germanSourcePractice)
    : undefined
  if (
    value.activeSession &&
    !sessionTasksMatchLearnerCurriculum(
      value.activeSession as ActiveLearningSession,
      learner,
    )
  ) {
    throw new BackupError(
      "invalid-format",
      "Die pausierte Aufgabe gehört nicht zum Lernstand dieser Sicherung.",
    )
  }
  if (
    ((value.version === 4 || value.version === 5 || value.version === PAYLOAD_VERSION) && value.germanCourse && !germanCourse) ||
    (germanCourse && germanCourse.learnerId !== learner.learnerId)
  ) {
    throw new BackupError(
      "invalid-format",
      "Der Deutsch-Lernstand gehört nicht zum Profil dieser Sicherung.",
    )
  }
  return {
    version: PAYLOAD_VERSION,
    createdAt: value.createdAt as string,
    learner: {
      ...learner,
      mockHistory: Array.isArray(learner.mockHistory) ? learner.mockHistory : [],
      archivePracticeHistory: Array.isArray(learner.archivePracticeHistory)
        ? learner.archivePracticeHistory
        : [],
      learnerFeedback: Array.isArray(learner.learnerFeedback) ? learner.learnerFeedback : [],
      topicHelpRequests: Array.isArray(learner.topicHelpRequests) ? learner.topicHelpRequests : [],
    },
    ...(value.activeSession ? { activeSession: value.activeSession as ActiveLearningSession } : {}),
    ...(value.activeMock ? { activeMock: value.activeMock as ActiveMockExam } : {}),
    ...(value.activeArchivePractice
      ? { activeArchivePractice: value.activeArchivePractice as ActiveArchivePractice }
      : {}),
    ...(germanCourse ? { germanCourse } : {}),
    ...(courseIndex ? { courseIndex } : {}),
    ...(germanSourcePractice ? { germanSourcePractice } : {}),
  }
}

export async function createEncryptedBackup(
  learner: LearnerState,
  activeSession: ActiveLearningSession | undefined,
  passphrase: string,
  now = new Date(),
  activeMock?: ActiveMockExam,
  activeArchivePractice?: ActiveArchivePractice,
  germanCourse?: GermanCourseState,
  courseIndex?: LearnerCourseIndex,
  germanSourcePractice?: GermanSourcePracticeState,
): Promise<string> {
  assertPassphrase(passphrase)
  const api = cryptoApi()
  const createdAt = now.toISOString()
  const salt = api.getRandomValues(new Uint8Array(16))
  const iv = api.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS, "encrypt")
  const payload: GymiQuestBackupPayload = {
    version: PAYLOAD_VERSION,
    createdAt,
    learner,
    ...(activeSession ? { activeSession } : {}),
    ...(activeMock ? { activeMock } : {}),
    ...(activeArchivePractice ? { activeArchivePractice } : {}),
    ...(germanCourse ? { germanCourse } : {}),
    ...(courseIndex ? { courseIndex } : {}),
    ...(germanSourcePractice ? { germanSourcePractice } : {}),
  }
  const ciphertext = await api.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: authenticatedHeader(createdAt),
    },
    key,
    encoder.encode(JSON.stringify(payload)),
  )
  const envelope: EncryptedBackupEnvelope = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt,
    kdf: {
      algorithm: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: {
      algorithm: "AES-GCM",
      iv: bytesToBase64(iv),
    },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
  return JSON.stringify(envelope, null, 2)
}

export async function openEncryptedBackup(
  serialized: string,
  passphrase: string,
): Promise<GymiQuestBackupPayload> {
  assertPassphrase(passphrase)
  const envelope = parseEnvelope(serialized)
  const salt = base64ToBytes(envelope.kdf.salt)
  const iv = base64ToBytes(envelope.cipher.iv)
  if (salt.length !== 16 || iv.length !== 12) {
    throw new BackupError("invalid-format", "Die Sicherungsdatei enthält ungültige Schlüsselwerte.")
  }

  try {
    const api = cryptoApi()
    const key = await deriveKey(
      passphrase,
      salt,
      envelope.kdf.iterations,
      "decrypt",
    )
    const plaintext = await api.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toArrayBuffer(iv),
        additionalData: authenticatedHeader(envelope.createdAt),
      },
      key,
      toArrayBuffer(base64ToBytes(envelope.ciphertext)),
    )
    const payload = parsePayload(JSON.parse(decoder.decode(plaintext)))
    if (payload.createdAt !== envelope.createdAt) {
      throw new BackupError("invalid-format", "Die Sicherungsdatei enthält widersprüchliche Zeitangaben.")
    }
    return payload
  } catch (error) {
    if (error instanceof BackupError) throw error
    throw new BackupError(
      "locked-or-damaged",
      "Das Passwort stimmt nicht oder die Sicherungsdatei wurde beschädigt.",
    )
  }
}

export function backupFilename(now = new Date()): string {
  return `gymiquest-backup-${now.toISOString().slice(0, 10)}.gqbackup`
}
