export const subjectIds = ["math", "german"] as const
export type SubjectId = typeof subjectIds[number]

export const courseKeys = {
  math: "zh-zap1-math@1",
  german: "zh-zap1-german@1",
} as const satisfies Record<SubjectId, string>

export type CourseKey = typeof courseKeys[SubjectId]

export function isSubjectId(value: unknown): value is SubjectId {
  return typeof value === "string" && (subjectIds as readonly string[]).includes(value)
}

export function subjectIdForCourseKey(value: unknown): SubjectId | undefined {
  return subjectIds.find((subjectId) => courseKeys[subjectId] === value)
}
