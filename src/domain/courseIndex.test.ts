import { describe, expect, it } from "vitest"
import {
  createLearnerCourseIndex,
  markCourseCompleted,
  normalizeLearnerCourseIndex,
  resolveResumeSubject,
  touchCourse,
} from "./courseIndex"
import { courseKeys } from "./subjectIdentity"

describe("learner course index", () => {
  it("defaults migrated learners to mathematics exactly once", () => {
    const index = createLearnerCourseIndex(new Date("2026-07-17T10:00:00.000Z"))
    expect(index.activeCourseKey).toBe(courseKeys.math)
    expect(index.courseKeys).toEqual([courseKeys.math])

    const german = touchCourse(index, "german", new Date("2026-07-17T11:00:00.000Z"))
    expect(normalizeLearnerCourseIndex(german).activeCourseKey).toBe(courseKeys.german)
    expect(german.courseKeys).toEqual([courseKeys.math, courseKeys.german])
  })

  it("opens a paused subject before the most recently used idle subject", () => {
    const index = touchCourse(
      createLearnerCourseIndex(new Date("2026-07-17T10:00:00.000Z")),
      "german",
      new Date("2026-07-17T12:00:00.000Z"),
    )
    expect(resolveResumeSubject(index, [
      { subjectId: "math", paused: true, pausedAt: "2026-07-17T11:00:00.000Z" },
      { subjectId: "german", paused: false },
    ])).toBe("math")
  })

  it("keeps the active subject when both subjects have paused work", () => {
    const index = touchCourse(createLearnerCourseIndex(), "german")
    expect(resolveResumeSubject(index, [
      { subjectId: "math", paused: true, pausedAt: "2026-07-17T12:00:00.000Z" },
      { subjectId: "german", paused: true, pausedAt: "2026-07-17T11:00:00.000Z" },
    ])).toBe("german")
  })

  it("uses the latest use or completion when neither subject is paused", () => {
    let index = createLearnerCourseIndex(new Date("2026-07-17T10:00:00.000Z"))
    index = touchCourse(index, "german", new Date("2026-07-17T11:00:00.000Z"))
    index = markCourseCompleted(index, "math", new Date("2026-07-17T12:00:00.000Z"))
    expect(resolveResumeSubject(index, [])).toBe("math")
  })
})
