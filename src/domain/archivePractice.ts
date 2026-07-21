import {
  officialArchiveCatalog,
  type OfficialArchiveDocumentKind,
  type OfficialArchiveEditionId,
  type OfficialArchiveYear,
} from "./officialArchiveCatalog"

export const ARCHIVE_PRACTICE_SCHEMA_VERSION = 1 as const
export const ARCHIVE_PRACTICE_TASK_COUNT = 9 as const
export const ARCHIVE_PRACTICE_DURATION_SECONDS = 60 * 60

export type ArchivePracticePhase = "working" | "review"
export type ArchivePracticeSubmissionReason = "submitted" | "timeout"
export type ArchivePracticeReviewStatus =
  | "answer-matches"
  | "answer-differs-or-unclear"
  | "not-attempted"

export interface ArchivePracticeTaskProgress {
  taskNumber: number
  visited: boolean
  visitCount: number
  flagged: boolean
  attemptedOnPaper: boolean
  activeSeconds: number
  reviewStatus?: ArchivePracticeReviewStatus
}

export interface ActiveArchivePractice {
  schemaVersion: typeof ARCHIVE_PRACTICE_SCHEMA_VERSION
  kind: "archive-source-practice"
  id: string
  seed: string
  editionId: OfficialArchiveEditionId
  year: OfficialArchiveYear
  phase: ArchivePracticePhase
  durationSeconds: typeof ARCHIVE_PRACTICE_DURATION_SECONDS
  startedAt: string
  deadlineAt: string
  updatedAt: string
  submittedAt?: string
  submissionReason?: ArchivePracticeSubmissionReason
  currentTaskIndex: number
  currentDocumentKind: OfficialArchiveDocumentKind
  taskPageNumber: number
  solutionPageNumber: number
  progress: ArchivePracticeTaskProgress[]
}

export interface ArchivePracticeTaskResult {
  taskNumber: number
  reviewStatus: ArchivePracticeReviewStatus
  attemptedOnPaper: boolean
  activeSeconds: number
  visitCount: number
  flagged: boolean
}

export interface ArchivePracticeResult {
  schemaVersion: typeof ARCHIVE_PRACTICE_SCHEMA_VERSION
  kind: "archive-source-practice-result"
  id: string
  editionId: OfficialArchiveEditionId
  year: OfficialArchiveYear
  startedAt: string
  submittedAt: string
  completedAt: string
  submissionReason: ArchivePracticeSubmissionReason
  durationSeconds: number
  totalActiveSeconds: number
  taskResults: ArchivePracticeTaskResult[]
}

const reviewStatuses = new Set<ArchivePracticeReviewStatus>([
  "answer-matches",
  "answer-differs-or-unclear",
  "not-attempted",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
}

function isBoundedString(value: unknown, maximum = 2_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum
}

function isNonNegativeInteger(value: unknown, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maximum
}

function hasProhibitedScoringFields(value: Record<string, unknown>): boolean {
  return ["points", "maxPoints", "score", "grade", "xp", "mastery", "recoveryTopicIds"]
    .some((key) => Object.prototype.hasOwnProperty.call(value, key))
}

export function isSourceOnlyArchiveEdition(
  editionId: OfficialArchiveEditionId,
): boolean {
  return officialArchiveCatalog[editionId]?.replayMode === "source-only"
}

export function createActiveArchivePractice(
  editionId: OfficialArchiveEditionId,
  seed: string,
  now = new Date(),
): ActiveArchivePractice {
  const edition = officialArchiveCatalog[editionId]
  if (!edition || edition.replayMode !== "source-only") {
    throw new Error("Archive source practice is only available for source-only editions.")
  }
  if (!seed.trim()) throw new Error("Archive source practice needs a stable seed.")

  const startedAt = now.toISOString()
  return {
    schemaVersion: ARCHIVE_PRACTICE_SCHEMA_VERSION,
    kind: "archive-source-practice",
    id: `archive-practice:${editionId}:${seed}`,
    seed,
    editionId,
    year: edition.year,
    phase: "working",
    durationSeconds: ARCHIVE_PRACTICE_DURATION_SECONDS,
    startedAt,
    deadlineAt: new Date(now.getTime() + ARCHIVE_PRACTICE_DURATION_SECONDS * 1_000).toISOString(),
    updatedAt: startedAt,
    currentTaskIndex: 0,
    currentDocumentKind: "tasks",
    taskPageNumber: 1,
    solutionPageNumber: 1,
    progress: Array.from({ length: ARCHIVE_PRACTICE_TASK_COUNT }, (_, index) => ({
      taskNumber: index + 1,
      visited: index === 0,
      visitCount: index === 0 ? 1 : 0,
      flagged: false,
      attemptedOnPaper: false,
      activeSeconds: 0,
    })),
  }
}

export function remainingArchivePracticeSeconds(
  practice: ActiveArchivePractice,
  now = new Date(),
): number {
  if (practice.phase === "review") return 0
  return Math.max(0, Math.ceil((Date.parse(practice.deadlineAt) - now.getTime()) / 1_000))
}

export function submitArchivePracticeForReview(
  practice: ActiveArchivePractice,
  submissionReason: ArchivePracticeSubmissionReason,
  submittedAt = new Date(),
): ActiveArchivePractice {
  if (practice.phase === "review") return practice
  const timestamp = submittedAt.toISOString()
  return {
    ...practice,
    phase: "review",
    updatedAt: timestamp,
    submittedAt: timestamp,
    submissionReason,
    currentDocumentKind: "solutions",
    solutionPageNumber: 1,
  }
}

export function archivePracticeReviewComplete(practice: ActiveArchivePractice): boolean {
  return practice.phase === "review" && practice.progress.every(
    ({ reviewStatus }) => reviewStatus !== undefined,
  )
}

export function completeArchivePractice(
  practice: ActiveArchivePractice,
  completedAt = new Date(),
): ArchivePracticeResult {
  if (!archivePracticeReviewComplete(practice) || !practice.submittedAt || !practice.submissionReason) {
    throw new Error("Every archive task needs a bounded self-review before completion.")
  }
  const elapsedSeconds = Math.max(
    1,
    Math.round((Date.parse(practice.submittedAt) - Date.parse(practice.startedAt)) / 1_000),
  )
  const taskResults = practice.progress.map((task): ArchivePracticeTaskResult => ({
    taskNumber: task.taskNumber,
    reviewStatus: task.reviewStatus!,
    attemptedOnPaper: task.attemptedOnPaper,
    activeSeconds: task.activeSeconds,
    visitCount: task.visitCount,
    flagged: task.flagged,
  }))

  return {
    schemaVersion: ARCHIVE_PRACTICE_SCHEMA_VERSION,
    kind: "archive-source-practice-result",
    id: `result:${practice.id}:${completedAt.toISOString()}`,
    editionId: practice.editionId,
    year: practice.year,
    startedAt: practice.startedAt,
    submittedAt: practice.submittedAt,
    completedAt: completedAt.toISOString(),
    submissionReason: practice.submissionReason,
    durationSeconds: Math.min(practice.durationSeconds, elapsedSeconds),
    totalActiveSeconds: taskResults.reduce((sum, task) => sum + task.activeSeconds, 0),
    taskResults,
  }
}

export function isActiveArchivePractice(value: unknown): value is ActiveArchivePractice {
  if (!isRecord(value)) return false
  const editionId = typeof value.editionId === "string"
    ? value.editionId as OfficialArchiveEditionId
    : undefined
  const edition = editionId ? officialArchiveCatalog[editionId] : undefined
  if (
    hasProhibitedScoringFields(value) ||
    value.schemaVersion !== ARCHIVE_PRACTICE_SCHEMA_VERSION ||
    value.kind !== "archive-source-practice" ||
    !edition ||
    edition.replayMode !== "source-only" ||
    value.year !== edition.year ||
    value.id !== `archive-practice:${editionId}:${value.seed}` ||
    !isBoundedString(value.seed) ||
    (value.phase !== "working" && value.phase !== "review") ||
    value.durationSeconds !== ARCHIVE_PRACTICE_DURATION_SECONDS ||
    !isDateString(value.startedAt) ||
    !isDateString(value.deadlineAt) ||
    Date.parse(value.deadlineAt) - Date.parse(value.startedAt) !== ARCHIVE_PRACTICE_DURATION_SECONDS * 1_000 ||
    !isDateString(value.updatedAt) ||
    !isNonNegativeInteger(value.currentTaskIndex, ARCHIVE_PRACTICE_TASK_COUNT - 1) ||
    (value.currentDocumentKind !== "tasks" && value.currentDocumentKind !== "solutions") ||
    !isNonNegativeInteger(value.taskPageNumber, edition.documents.tasks.pageCount) ||
    Number(value.taskPageNumber) < 1 ||
    !isNonNegativeInteger(value.solutionPageNumber, edition.documents.solutions.pageCount) ||
    Number(value.solutionPageNumber) < 1 ||
    !Array.isArray(value.progress) ||
    value.progress.length !== ARCHIVE_PRACTICE_TASK_COUNT
  ) return false

  if (value.phase === "working") {
    if (
      value.submittedAt !== undefined ||
      value.submissionReason !== undefined ||
      value.currentDocumentKind !== "tasks"
    ) return false
  } else if (
    !isDateString(value.submittedAt) ||
    (value.submissionReason !== "submitted" && value.submissionReason !== "timeout")
  ) return false

  return value.progress.every((task, index) => Boolean(
    isRecord(task) &&
    !hasProhibitedScoringFields(task) &&
    task.taskNumber === index + 1 &&
    typeof task.visited === "boolean" &&
    isNonNegativeInteger(task.visitCount, 100_000) &&
    typeof task.flagged === "boolean" &&
    typeof task.attemptedOnPaper === "boolean" &&
    isNonNegativeInteger(task.activeSeconds, 86_400) &&
    (task.reviewStatus === undefined || (
      typeof task.reviewStatus === "string" &&
      reviewStatuses.has(task.reviewStatus as ArchivePracticeReviewStatus)
    )) &&
    (value.phase === "review" || task.reviewStatus === undefined)
  ))
}

export function isArchivePracticeResult(value: unknown): value is ArchivePracticeResult {
  if (!isRecord(value)) return false
  const editionId = typeof value.editionId === "string"
    ? value.editionId as OfficialArchiveEditionId
    : undefined
  const edition = editionId ? officialArchiveCatalog[editionId] : undefined
  if (
    hasProhibitedScoringFields(value) ||
    value.schemaVersion !== ARCHIVE_PRACTICE_SCHEMA_VERSION ||
    value.kind !== "archive-source-practice-result" ||
    edition?.replayMode !== "source-only" ||
    value.year !== edition.year ||
    !isBoundedString(value.id) ||
    !value.id.startsWith(`result:archive-practice:${editionId}:`) ||
    !isDateString(value.startedAt) ||
    !isDateString(value.submittedAt) ||
    !isDateString(value.completedAt) ||
    Date.parse(value.submittedAt) < Date.parse(value.startedAt) ||
    Date.parse(value.completedAt) < Date.parse(value.submittedAt) ||
    (value.submissionReason !== "submitted" && value.submissionReason !== "timeout") ||
    !isNonNegativeInteger(value.durationSeconds, ARCHIVE_PRACTICE_DURATION_SECONDS) ||
    Number(value.durationSeconds) < 1 ||
    !isNonNegativeInteger(value.totalActiveSeconds, 86_400) ||
    !Array.isArray(value.taskResults) ||
    value.taskResults.length !== ARCHIVE_PRACTICE_TASK_COUNT
  ) return false

  const taskResultsValid = value.taskResults.every((task, index) => Boolean(
    isRecord(task) &&
    !hasProhibitedScoringFields(task) &&
    task.taskNumber === index + 1 &&
    typeof task.reviewStatus === "string" &&
    reviewStatuses.has(task.reviewStatus as ArchivePracticeReviewStatus) &&
    typeof task.attemptedOnPaper === "boolean" &&
    isNonNegativeInteger(task.activeSeconds, 86_400) &&
    isNonNegativeInteger(task.visitCount, 100_000) &&
    typeof task.flagged === "boolean"
  ))
  if (!taskResultsValid) return false

  return Boolean(
    Number(value.totalActiveSeconds) === value.taskResults.reduce(
      (sum, task) => sum + Number((task as Record<string, unknown>).activeSeconds),
      0,
    )
  )
}

export function archivePracticeStatusCounts(result: ArchivePracticeResult): Record<ArchivePracticeReviewStatus, number> {
  return result.taskResults.reduce<Record<ArchivePracticeReviewStatus, number>>((counts, task) => {
    counts[task.reviewStatus] += 1
    return counts
  }, {
    "answer-matches": 0,
    "answer-differs-or-unclear": 0,
    "not-attempted": 0,
  })
}
