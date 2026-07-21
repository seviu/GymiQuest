import {
  GERMAN_WRITING_MAX_DRAFT_LENGTH,
  GERMAN_WRITING_MAX_TITLE_LENGTH,
  germanWritingWordCount,
  type GermanWritingResult,
} from "./writing"

export const GERMAN_WRITING_REVISION_SCHEMA_VERSION = 1 as const
export const GERMAN_WRITING_MAX_REVISIONS_PER_RESULT = 5

export interface ActiveGermanWritingRevision {
  schemaVersion: typeof GERMAN_WRITING_REVISION_SCHEMA_VERSION
  kind: "german-writing-revision"
  id: string
  resultId: string
  revisionNumber: number
  startedAt: string
  updatedAt: string
  title: string
  draft: string
}

export interface GermanWritingRevisionSnapshot {
  schemaVersion: typeof GERMAN_WRITING_REVISION_SCHEMA_VERSION
  kind: "german-writing-revision-snapshot"
  id: string
  resultId: string
  revisionNumber: number
  startedAt: string
  savedAt: string
  title: string
  draft: string
  wordCount: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value))
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum
}

function hasScoringFields(value: Record<string, unknown>): boolean {
  return ["points", "maxPoints", "score", "grade", "xp", "mastery", "recoveryTopicIds"]
    .some((key) => Object.prototype.hasOwnProperty.call(value, key))
}

function activeRevisionId(resultId: string, revisionNumber: number): string {
  return `german-writing-revision:${resultId}:${revisionNumber}`
}

function snapshotId(resultId: string, revisionNumber: number, savedAt: string): string {
  return `german-writing-revision-snapshot:${resultId}:${revisionNumber}:${savedAt}`
}

function nextTimestamp(startedAt: string, updatedAt: string, now: Date): string {
  return new Date(Math.max(Date.parse(startedAt), Date.parse(updatedAt), now.getTime())).toISOString()
}

export function cloneActiveGermanWritingRevision(
  revision: ActiveGermanWritingRevision,
): ActiveGermanWritingRevision {
  return { ...revision }
}

export function cloneGermanWritingRevisionSnapshot(
  revision: GermanWritingRevisionSnapshot,
): GermanWritingRevisionSnapshot {
  return { ...revision }
}

export function germanWritingRevisionsForResult(
  revisions: readonly GermanWritingRevisionSnapshot[],
  resultId: string,
): GermanWritingRevisionSnapshot[] {
  return revisions
    .filter((revision) => revision.resultId === resultId)
    .sort((left, right) => left.revisionNumber - right.revisionNumber)
    .map(cloneGermanWritingRevisionSnapshot)
}

export function createActiveGermanWritingRevision(
  result: GermanWritingResult,
  revisions: readonly GermanWritingRevisionSnapshot[],
  now = new Date(),
): ActiveGermanWritingRevision | undefined {
  const prior = germanWritingRevisionsForResult(revisions, result.id)
  if (prior.length >= GERMAN_WRITING_MAX_REVISIONS_PER_RESULT) return undefined
  if (prior.some((revision, index) => revision.revisionNumber !== index + 1)) return undefined
  const latest = prior.at(-1)
  const revisionNumber = prior.length + 1
  const timestamp = now.toISOString()
  return {
    schemaVersion: GERMAN_WRITING_REVISION_SCHEMA_VERSION,
    kind: "german-writing-revision",
    id: activeRevisionId(result.id, revisionNumber),
    resultId: result.id,
    revisionNumber,
    startedAt: timestamp,
    updatedAt: timestamp,
    title: latest?.title ?? result.title,
    draft: latest?.draft ?? result.draft,
  }
}

export function updateActiveGermanWritingRevision(
  revision: ActiveGermanWritingRevision,
  update: { title?: string; draft?: string },
  now = new Date(),
): ActiveGermanWritingRevision {
  const title = update.title ?? revision.title
  const draft = update.draft ?? revision.draft
  if (title.length > GERMAN_WRITING_MAX_TITLE_LENGTH || draft.length > GERMAN_WRITING_MAX_DRAFT_LENGTH) {
    return revision
  }
  return {
    ...revision,
    title,
    draft,
    updatedAt: nextTimestamp(revision.startedAt, revision.updatedAt, now),
  }
}

export function germanWritingRevisionCanSave(revision: ActiveGermanWritingRevision): boolean {
  return revision.draft.trim().length > 0
}

export function saveGermanWritingRevisionSnapshot(
  revision: ActiveGermanWritingRevision,
  now = new Date(),
): GermanWritingRevisionSnapshot {
  if (!germanWritingRevisionCanSave(revision)) {
    throw new Error("A German writing revision needs a non-empty draft.")
  }
  const savedAt = nextTimestamp(revision.startedAt, revision.updatedAt, now)
  return {
    schemaVersion: GERMAN_WRITING_REVISION_SCHEMA_VERSION,
    kind: "german-writing-revision-snapshot",
    id: snapshotId(revision.resultId, revision.revisionNumber, savedAt),
    resultId: revision.resultId,
    revisionNumber: revision.revisionNumber,
    startedAt: revision.startedAt,
    savedAt,
    title: revision.title.trim(),
    draft: revision.draft.trim(),
    wordCount: germanWritingWordCount(revision.draft.trim()),
  }
}

export function isActiveGermanWritingRevision(value: unknown): value is ActiveGermanWritingRevision {
  return Boolean(
    isRecord(value) &&
    !hasScoringFields(value) &&
    value.schemaVersion === GERMAN_WRITING_REVISION_SCHEMA_VERSION &&
    value.kind === "german-writing-revision" &&
    typeof value.resultId === "string" && value.resultId.length > 0 && value.resultId.length <= 4_000 &&
    typeof value.revisionNumber === "number" && Number.isInteger(value.revisionNumber) &&
    value.revisionNumber >= 1 && value.revisionNumber <= GERMAN_WRITING_MAX_REVISIONS_PER_RESULT &&
    value.id === activeRevisionId(value.resultId, value.revisionNumber) &&
    isDateString(value.startedAt) &&
    isDateString(value.updatedAt) && Date.parse(value.updatedAt) >= Date.parse(value.startedAt) &&
    isBoundedString(value.title, GERMAN_WRITING_MAX_TITLE_LENGTH) &&
    isBoundedString(value.draft, GERMAN_WRITING_MAX_DRAFT_LENGTH)
  )
}

export function isGermanWritingRevisionSnapshot(
  value: unknown,
): value is GermanWritingRevisionSnapshot {
  return Boolean(
    isRecord(value) &&
    !hasScoringFields(value) &&
    value.schemaVersion === GERMAN_WRITING_REVISION_SCHEMA_VERSION &&
    value.kind === "german-writing-revision-snapshot" &&
    typeof value.resultId === "string" && value.resultId.length > 0 && value.resultId.length <= 4_000 &&
    typeof value.revisionNumber === "number" && Number.isInteger(value.revisionNumber) &&
    value.revisionNumber >= 1 && value.revisionNumber <= GERMAN_WRITING_MAX_REVISIONS_PER_RESULT &&
    isDateString(value.startedAt) &&
    isDateString(value.savedAt) && Date.parse(value.savedAt) >= Date.parse(value.startedAt) &&
    value.id === snapshotId(value.resultId, value.revisionNumber, value.savedAt) &&
    isBoundedString(value.title, GERMAN_WRITING_MAX_TITLE_LENGTH) &&
    isBoundedString(value.draft, GERMAN_WRITING_MAX_DRAFT_LENGTH) && value.draft.trim().length > 0 &&
    typeof value.wordCount === "number" && Number.isInteger(value.wordCount) &&
    value.wordCount === germanWritingWordCount(value.draft)
  )
}
