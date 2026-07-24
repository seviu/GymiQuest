import {
  germanSourceArchiveCatalog,
  type GermanSourceArchiveDocumentKind,
  type GermanSourceArchiveEditionId,
} from "./sourceArchiveCatalog"

export const GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION = 1 as const
export const GERMAN_SOURCE_PRACTICE_HISTORY_LIMIT = 100
export const germanSourceWritingReviewChecks = [
  "title-fit",
  "clear-structure",
  "task-complete",
  "paragraphs",
  "language",
  "proofread",
] as const

export type GermanSourcePracticeMode = "language-exam" | "writing"
export type GermanSourcePracticePhase = "working" | "review"
export type GermanSourcePracticeSubmissionReason = "submitted" | "timeout"
export type GermanSourceLanguageReviewStatus =
  | "mostly-matches"
  | "mixed-or-unclear"
  | "not-compared"
export type GermanSourceWritingReviewCheck = typeof germanSourceWritingReviewChecks[number]

export interface ActiveGermanSourcePractice {
  schemaVersion: typeof GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION
  kind: "german-source-practice"
  id: string
  seed: string
  editionId: GermanSourceArchiveEditionId
  mode: GermanSourcePracticeMode
  phase: GermanSourcePracticePhase
  durationSeconds: number
  startedAt: string
  deadlineAt: string
  updatedAt: string
  submittedAt?: string
  submissionReason?: GermanSourcePracticeSubmissionReason
  currentDocumentKind: GermanSourceArchiveDocumentKind
  pageNumbers: Partial<Record<GermanSourceArchiveDocumentKind, number>>
  writingTitle?: string
  writingDraft?: string
  languageReviewStatus?: GermanSourceLanguageReviewStatus
  writingReviewChecks: GermanSourceWritingReviewCheck[]
}

export interface GermanSourcePracticeResult {
  schemaVersion: typeof GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION
  kind: "german-source-practice-result"
  id: string
  practiceId: string
  editionId: GermanSourceArchiveEditionId
  mode: GermanSourcePracticeMode
  startedAt: string
  submittedAt: string
  completedAt: string
  submissionReason: GermanSourcePracticeSubmissionReason
  durationSeconds: number
  writingTitle?: string
  writingDraft?: string
  wordCount?: number
  languageReviewStatus?: GermanSourceLanguageReviewStatus
  writingReviewChecks: GermanSourceWritingReviewCheck[]
}

export interface GermanSourcePracticeState {
  schemaVersion: typeof GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION
  active?: ActiveGermanSourcePractice
  history: GermanSourcePracticeResult[]
}

const languageReviewStatuses = new Set<GermanSourceLanguageReviewStatus>([
  "mostly-matches",
  "mixed-or-unclear",
  "not-compared",
])
const writingReviewCheckSet = new Set<GermanSourceWritingReviewCheck>(germanSourceWritingReviewChecks)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
}

function isBoundedString(value: unknown, maximum: number, allowEmpty = false): value is string {
  return typeof value === "string" && value.length <= maximum && (allowEmpty || value.trim().length > 0)
}

function hasProhibitedScoringFields(value: Record<string, unknown>): boolean {
  return ["points", "maxPoints", "score", "grade", "xp", "mastery", "recoveryTopicIds"]
    .some((key) => Object.prototype.hasOwnProperty.call(value, key))
}

function durationFor(
  editionId: GermanSourceArchiveEditionId,
  mode: GermanSourcePracticeMode,
): number {
  const edition = germanSourceArchiveCatalog[editionId]
  return mode === "language-exam"
    ? edition.languageExamDurationSeconds
    : edition.writingDurationSeconds
}

export function germanSourcePracticeDocumentKinds(
  editionId: GermanSourceArchiveEditionId,
  mode: GermanSourcePracticeMode,
  phase: GermanSourcePracticePhase,
): GermanSourceArchiveDocumentKind[] {
  if (mode === "writing") {
    return phase === "review" &&
      germanSourceArchiveCatalog[editionId].documents["essay-guidance"] !== undefined
      ? ["essay-prompts", "essay-guidance"]
      : ["essay-prompts"]
  }
  return phase === "working"
    ? ["language-exam", "text-sheet"]
    : ["language-exam", "text-sheet", "solutions"]
}

function pageNumberIsValid(
  editionId: GermanSourceArchiveEditionId,
  kind: GermanSourceArchiveDocumentKind,
  pageNumber: unknown,
): pageNumber is number {
  const definition = germanSourceArchiveCatalog[editionId].documents[kind]
  return Number.isInteger(pageNumber) &&
    definition !== undefined &&
    Number(pageNumber) >= 1 &&
    Number(pageNumber) <= definition.pageCount
}

function clonePractice(practice: ActiveGermanSourcePractice): ActiveGermanSourcePractice {
  return {
    ...practice,
    pageNumbers: { ...practice.pageNumbers },
    writingReviewChecks: [...practice.writingReviewChecks],
  }
}

function cloneResult(result: GermanSourcePracticeResult): GermanSourcePracticeResult {
  return { ...result, writingReviewChecks: [...result.writingReviewChecks] }
}

function nextPracticeTimestamp(practice: ActiveGermanSourcePractice, now: Date): string {
  return new Date(Math.max(
    now.getTime(),
    Date.parse(practice.startedAt),
    Date.parse(practice.updatedAt),
  )).toISOString()
}

export function createGermanSourcePracticeState(): GermanSourcePracticeState {
  return { schemaVersion: GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION, history: [] }
}

export function createActiveGermanSourcePractice(
  editionId: GermanSourceArchiveEditionId,
  mode: GermanSourcePracticeMode,
  seed: string,
  now = new Date(),
): ActiveGermanSourcePractice {
  if (!seed.trim()) throw new Error("German source practice needs a stable seed.")
  const durationSeconds = durationFor(editionId, mode)
  const startedAt = now.toISOString()
  const documentKinds = germanSourcePracticeDocumentKinds(editionId, mode, "working")
  return {
    schemaVersion: GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION,
    kind: "german-source-practice",
    id: `german-source-practice:${editionId}:${mode}:${seed}`,
    seed,
    editionId,
    mode,
    phase: "working",
    durationSeconds,
    startedAt,
    deadlineAt: new Date(now.getTime() + durationSeconds * 1_000).toISOString(),
    updatedAt: startedAt,
    currentDocumentKind: documentKinds[0]!,
    pageNumbers: Object.fromEntries(documentKinds.map((kind) => [kind, 1])),
    ...(mode === "writing" ? { writingTitle: "", writingDraft: "" } : {}),
    writingReviewChecks: [],
  }
}

export function remainingGermanSourcePracticeSeconds(
  practice: ActiveGermanSourcePractice,
  now = new Date(),
): number {
  if (practice.phase === "review") return 0
  return Math.max(0, Math.ceil((Date.parse(practice.deadlineAt) - now.getTime()) / 1_000))
}

export function navigateGermanSourcePractice(
  practice: ActiveGermanSourcePractice,
  kind: GermanSourceArchiveDocumentKind,
  pageNumber: number,
  now = new Date(),
): ActiveGermanSourcePractice {
  if (!germanSourcePracticeDocumentKinds(practice.editionId, practice.mode, practice.phase).includes(kind) ||
    !pageNumberIsValid(practice.editionId, kind, pageNumber)) return practice
  return {
    ...clonePractice(practice),
    currentDocumentKind: kind,
    pageNumbers: { ...practice.pageNumbers, [kind]: pageNumber },
    updatedAt: nextPracticeTimestamp(practice, now),
  }
}

export function updateGermanSourceWriting(
  practice: ActiveGermanSourcePractice,
  writingTitle: string,
  writingDraft: string,
  now = new Date(),
): ActiveGermanSourcePractice {
  if (practice.mode !== "writing" || practice.phase !== "working") return practice
  return {
    ...clonePractice(practice),
    writingTitle: writingTitle.slice(0, 300),
    writingDraft: writingDraft.slice(0, 50_000),
    updatedAt: nextPracticeTimestamp(practice, now),
  }
}

export function submitGermanSourcePractice(
  practice: ActiveGermanSourcePractice,
  submissionReason: GermanSourcePracticeSubmissionReason,
  now = new Date(),
): ActiveGermanSourcePractice {
  if (practice.phase === "review") return practice
  const timestamp = nextPracticeTimestamp(practice, now)
  const available = germanSourcePracticeDocumentKinds(practice.editionId, practice.mode, "review")
  return {
    ...clonePractice(practice),
    phase: "review",
    updatedAt: timestamp,
    submittedAt: timestamp,
    submissionReason,
    currentDocumentKind: practice.mode === "language-exam" ? "solutions" : "essay-prompts",
    pageNumbers: Object.fromEntries(available.map((kind) => [kind, practice.pageNumbers[kind] ?? 1])),
  }
}

export function setGermanSourceLanguageReview(
  practice: ActiveGermanSourcePractice,
  languageReviewStatus: GermanSourceLanguageReviewStatus,
  now = new Date(),
): ActiveGermanSourcePractice {
  if (practice.mode !== "language-exam" || practice.phase !== "review") return practice
  return {
    ...clonePractice(practice),
    languageReviewStatus,
    updatedAt: nextPracticeTimestamp(practice, now),
  }
}

export function toggleGermanSourceWritingReviewCheck(
  practice: ActiveGermanSourcePractice,
  check: GermanSourceWritingReviewCheck,
  now = new Date(),
): ActiveGermanSourcePractice {
  if (practice.mode !== "writing" || practice.phase !== "review") return practice
  const selected = new Set(practice.writingReviewChecks)
  if (selected.has(check)) selected.delete(check)
  else selected.add(check)
  return {
    ...clonePractice(practice),
    writingReviewChecks: germanSourceWritingReviewChecks.filter((candidate) => selected.has(candidate)),
    updatedAt: nextPracticeTimestamp(practice, now),
  }
}

export function germanSourcePracticeCanComplete(practice: ActiveGermanSourcePractice): boolean {
  return practice.phase === "review" && (
    practice.mode === "writing" || practice.languageReviewStatus !== undefined
  )
}

export function completeGermanSourcePractice(
  practice: ActiveGermanSourcePractice,
  completedAt = new Date(),
): GermanSourcePracticeResult {
  if (!germanSourcePracticeCanComplete(practice) || !practice.submittedAt || !practice.submissionReason) {
    throw new Error("German source practice needs its bounded review before completion.")
  }
  const elapsedSeconds = Math.max(
    1,
    Math.round((Date.parse(practice.submittedAt) - Date.parse(practice.startedAt)) / 1_000),
  )
  const draft = practice.mode === "writing" ? practice.writingDraft ?? "" : undefined
  const completedTimestamp = new Date(Math.max(
    completedAt.getTime(),
    Date.parse(practice.submittedAt),
  )).toISOString()
  return {
    schemaVersion: GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION,
    kind: "german-source-practice-result",
    id: `result:${practice.id}:${completedTimestamp}`,
    practiceId: practice.id,
    editionId: practice.editionId,
    mode: practice.mode,
    startedAt: practice.startedAt,
    submittedAt: practice.submittedAt,
    completedAt: completedTimestamp,
    submissionReason: practice.submissionReason,
    durationSeconds: Math.min(practice.durationSeconds, elapsedSeconds),
    ...(practice.mode === "writing" ? {
      writingTitle: practice.writingTitle ?? "",
      writingDraft: draft,
      wordCount: germanSourceWritingWordCount(draft ?? ""),
    } : { languageReviewStatus: practice.languageReviewStatus }),
    writingReviewChecks: [...practice.writingReviewChecks],
  }
}

export function germanSourceWritingWordCount(draft: string): number {
  const normalized = draft.trim()
  return normalized ? normalized.split(/\s+/u).length : 0
}

export function finishGermanSourcePracticeState(
  state: GermanSourcePracticeState,
  result: GermanSourcePracticeResult,
): GermanSourcePracticeState {
  if (state.active?.id !== result.practiceId) return state
  return {
    schemaVersion: GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION,
    history: [
      ...state.history.filter((candidate) => candidate.id !== result.id),
      cloneResult(result),
    ].slice(-GERMAN_SOURCE_PRACTICE_HISTORY_LIMIT),
  }
}

export function isActiveGermanSourcePractice(value: unknown): value is ActiveGermanSourcePractice {
  if (!isRecord(value) || hasProhibitedScoringFields(value)) return false
  const editionId = typeof value.editionId === "string"
    ? value.editionId as GermanSourceArchiveEditionId
    : undefined
  const mode = value.mode === "language-exam" || value.mode === "writing" ? value.mode : undefined
  const phase = value.phase === "working" || value.phase === "review" ? value.phase : undefined
  if (!editionId || !mode || !phase) return false
  const edition = germanSourceArchiveCatalog[editionId]
  if (!edition ||
    value.schemaVersion !== GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION ||
    value.kind !== "german-source-practice" ||
    !isBoundedString(value.seed, 2_000) ||
    value.id !== `german-source-practice:${editionId}:${mode}:${value.seed}` ||
    value.durationSeconds !== durationFor(editionId, mode) ||
    !isDateString(value.startedAt) ||
    !isDateString(value.deadlineAt) ||
    Date.parse(value.deadlineAt) - Date.parse(value.startedAt) !== Number(value.durationSeconds) * 1_000 ||
    !isDateString(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.startedAt) ||
    !Array.isArray(value.writingReviewChecks) ||
    !value.writingReviewChecks.every((check) => writingReviewCheckSet.has(check as GermanSourceWritingReviewCheck)) ||
    new Set(value.writingReviewChecks).size !== value.writingReviewChecks.length
  ) return false
  const pageNumbers = value.pageNumbers
  if (!isRecord(pageNumbers)) return false
  const allowedKinds = germanSourcePracticeDocumentKinds(editionId, mode, phase)
  if (typeof value.currentDocumentKind !== "string" ||
    !allowedKinds.includes(value.currentDocumentKind as GermanSourceArchiveDocumentKind) ||
    !allowedKinds.every((kind) => pageNumberIsValid(editionId, kind, pageNumbers[kind]))) return false
  if (mode === "writing") {
    if (!isBoundedString(value.writingTitle, 300, true) ||
      !isBoundedString(value.writingDraft, 50_000, true) ||
      value.languageReviewStatus !== undefined) return false
  } else if (
    value.writingTitle !== undefined ||
    value.writingDraft !== undefined ||
    value.writingReviewChecks.length > 0 ||
    (value.languageReviewStatus !== undefined &&
      !languageReviewStatuses.has(value.languageReviewStatus as GermanSourceLanguageReviewStatus))
  ) return false
  if (phase === "working") {
    return value.submittedAt === undefined &&
      value.submissionReason === undefined &&
      value.languageReviewStatus === undefined
  }
  return isDateString(value.submittedAt) &&
    Date.parse(value.submittedAt) >= Date.parse(value.startedAt) &&
    Date.parse(value.updatedAt) >= Date.parse(value.submittedAt) &&
    (value.submissionReason === "submitted" || value.submissionReason === "timeout")
}

export function isGermanSourcePracticeResult(value: unknown): value is GermanSourcePracticeResult {
  if (!isRecord(value) || hasProhibitedScoringFields(value)) return false
  const editionId = typeof value.editionId === "string"
    ? value.editionId as GermanSourceArchiveEditionId
    : undefined
  const mode = value.mode === "language-exam" || value.mode === "writing" ? value.mode : undefined
  if (!editionId || !germanSourceArchiveCatalog[editionId] || !mode ||
    value.schemaVersion !== GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION ||
    value.kind !== "german-source-practice-result" ||
    !isBoundedString(value.id, 4_000) ||
    !isBoundedString(value.practiceId, 4_000) ||
    !value.practiceId.startsWith(`german-source-practice:${editionId}:${mode}:`) ||
    !isDateString(value.startedAt) ||
    !isDateString(value.submittedAt) ||
    !isDateString(value.completedAt) ||
    Date.parse(value.submittedAt) < Date.parse(value.startedAt) ||
    Date.parse(value.completedAt) < Date.parse(value.submittedAt) ||
    value.id !== `result:${value.practiceId}:${value.completedAt}` ||
    (value.submissionReason !== "submitted" && value.submissionReason !== "timeout") ||
    value.durationSeconds !== Math.min(
      durationFor(editionId, mode),
      Math.max(1, Math.round((Date.parse(value.submittedAt) - Date.parse(value.startedAt)) / 1_000)),
    ) ||
    !Array.isArray(value.writingReviewChecks) ||
    !value.writingReviewChecks.every((check) => writingReviewCheckSet.has(check as GermanSourceWritingReviewCheck)) ||
    new Set(value.writingReviewChecks).size !== value.writingReviewChecks.length
  ) return false
  if (mode === "writing") {
    return isBoundedString(value.writingTitle, 300, true) &&
      isBoundedString(value.writingDraft, 50_000, true) &&
      value.wordCount === germanSourceWritingWordCount(value.writingDraft) &&
      value.languageReviewStatus === undefined
  }
  return value.writingTitle === undefined &&
    value.writingDraft === undefined &&
    value.wordCount === undefined &&
    value.writingReviewChecks.length === 0 &&
    languageReviewStatuses.has(value.languageReviewStatus as GermanSourceLanguageReviewStatus)
}

export function normalizeGermanSourcePracticeState(value: unknown): GermanSourcePracticeState {
  if (!isGermanSourcePracticeState(value)) return createGermanSourcePracticeState()
  return {
    schemaVersion: GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION,
    active: value.active ? clonePractice(value.active) : undefined,
    history: value.history.map(cloneResult),
  }
}

export function isGermanSourcePracticeState(value: unknown): value is GermanSourcePracticeState {
  if (!isRecord(value) ||
    value.schemaVersion !== GERMAN_SOURCE_PRACTICE_SCHEMA_VERSION ||
    (value.active !== undefined && !isActiveGermanSourcePractice(value.active)) ||
    !Array.isArray(value.history) ||
    value.history.length > GERMAN_SOURCE_PRACTICE_HISTORY_LIMIT ||
    !value.history.every(isGermanSourcePracticeResult) ||
    new Set(value.history.map((result) => result.id)).size !== value.history.length
  ) return false
  return true
}
