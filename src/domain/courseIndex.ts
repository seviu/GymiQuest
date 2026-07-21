import {
  courseKeys,
  isSubjectId,
  subjectIdForCourseKey,
  type CourseKey,
  type SubjectId,
} from "./subjectIdentity"

export interface LearnerCourseIndex {
  schemaVersion: 1
  activeCourseKey: CourseKey
  courseKeys: CourseKey[]
  lastUsedAtByCourse: Partial<Record<CourseKey, string>>
  lastCompletedAtByCourse: Partial<Record<CourseKey, string>>
}

export interface SubjectResumeEvidence {
  subjectId: SubjectId
  paused: boolean
  pausedAt?: string
}

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
}

function normalizedTimestampMap(value: unknown): Partial<Record<CourseKey, string>> {
  if (!value || typeof value !== "object") return {}
  const record = value as Record<string, unknown>
  return Object.fromEntries(
    Object.values(courseKeys)
      .filter((courseKey) => validTimestamp(record[courseKey]))
      .map((courseKey) => [courseKey, record[courseKey] as string]),
  )
}

export function createLearnerCourseIndex(now = new Date()): LearnerCourseIndex {
  return {
    schemaVersion: 1,
    activeCourseKey: courseKeys.math,
    courseKeys: [courseKeys.math],
    lastUsedAtByCourse: {
      [courseKeys.math]: now.toISOString(),
    },
    lastCompletedAtByCourse: {},
  }
}

export function normalizeLearnerCourseIndex(
  value: unknown,
  now = new Date(),
): LearnerCourseIndex {
  if (!value || typeof value !== "object") return createLearnerCourseIndex(now)
  const candidate = value as Partial<LearnerCourseIndex>
  const knownKeys = Array.isArray(candidate.courseKeys)
    ? candidate.courseKeys.filter((courseKey): courseKey is CourseKey => Boolean(subjectIdForCourseKey(courseKey)))
    : []
  const activeSubject = subjectIdForCourseKey(candidate.activeCourseKey)
  const activeCourseKey = activeSubject ? courseKeys[activeSubject] : courseKeys.math
  const courseKeySet = new Set<CourseKey>([courseKeys.math, activeCourseKey, ...knownKeys])
  return {
    schemaVersion: 1,
    activeCourseKey,
    courseKeys: [...courseKeySet],
    lastUsedAtByCourse: normalizedTimestampMap(candidate.lastUsedAtByCourse),
    lastCompletedAtByCourse: normalizedTimestampMap(candidate.lastCompletedAtByCourse),
  }
}

export function touchCourse(
  index: LearnerCourseIndex,
  subjectId: SubjectId,
  now = new Date(),
): LearnerCourseIndex {
  const courseKey = courseKeys[subjectId]
  return {
    ...index,
    activeCourseKey: courseKey,
    courseKeys: index.courseKeys.includes(courseKey) ? [...index.courseKeys] : [...index.courseKeys, courseKey],
    lastUsedAtByCourse: {
      ...index.lastUsedAtByCourse,
      [courseKey]: now.toISOString(),
    },
    lastCompletedAtByCourse: { ...index.lastCompletedAtByCourse },
  }
}

export function markCourseCompleted(
  index: LearnerCourseIndex,
  subjectId: SubjectId,
  now = new Date(),
): LearnerCourseIndex {
  const touched = touchCourse(index, subjectId, now)
  return {
    ...touched,
    lastCompletedAtByCourse: {
      ...touched.lastCompletedAtByCourse,
      [courseKeys[subjectId]]: now.toISOString(),
    },
  }
}

function mostRecentSubject(index: LearnerCourseIndex): SubjectId {
  let winner = subjectIdForCourseKey(index.activeCourseKey) ?? "math"
  let latest = Number.NEGATIVE_INFINITY
  for (const subjectId of ["math", "german"] as const) {
    const courseKey = courseKeys[subjectId]
    for (const timestamp of [
      index.lastUsedAtByCourse[courseKey],
      index.lastCompletedAtByCourse[courseKey],
    ]) {
      if (!validTimestamp(timestamp)) continue
      const value = Date.parse(timestamp)
      if (value > latest) {
        winner = subjectId
        latest = value
      }
    }
  }
  return winner
}

export function resolveResumeSubject(
  index: LearnerCourseIndex,
  evidence: readonly SubjectResumeEvidence[],
): SubjectId {
  const paused = evidence.filter((item) => isSubjectId(item.subjectId) && item.paused)
  if (paused.length === 1) return paused[0]!.subjectId
  if (paused.length > 1) {
    const activeSubject = subjectIdForCourseKey(index.activeCourseKey)
    if (activeSubject && paused.some((item) => item.subjectId === activeSubject)) return activeSubject
    return [...paused].sort((left, right) => (
      (validTimestamp(right.pausedAt) ? Date.parse(right.pausedAt) : 0) -
      (validTimestamp(left.pausedAt) ? Date.parse(left.pausedAt) : 0)
    ))[0]!.subjectId
  }
  return mostRecentSubject(index)
}
