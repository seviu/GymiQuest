import { describe, expect, it } from "vitest"
import {
  ACTIVE_CURRICULUM_PACKAGE,
  supportedCurriculumPackages,
  type CurriculumPackage,
} from "./curriculumPackage"
import { validateCurriculumPackageRuntime } from "./curriculumPackageValidation"

describe("curriculum package runtime validation", () => {
  it("proves every registered package has complete content and deterministic generators", () => {
    for (const curriculumPackage of supportedCurriculumPackages) {
      const report = validateCurriculumPackageRuntime(curriculumPackage)
      expect(report, JSON.stringify(report.issues, null, 2)).toMatchObject({
        courseId: curriculumPackage.courseId,
        version: curriculumPackage.version,
        topicCount: curriculumPackage.topicIds.length,
        expectedGeneratorCells: curriculumPackage.topicIds.length * 3,
        validatedGeneratorCells: curriculumPackage.topicIds.length * 3,
        issues: [],
        valid: true,
      })
    }
  })

  it("returns actionable structural issues for an incomplete candidate package", () => {
    const candidate = structuredClone(ACTIVE_CURRICULUM_PACKAGE) as CurriculumPackage
    const mutable = candidate as CurriculumPackage & {
      topicIds: typeof candidate.topicIds extends readonly (infer Item)[] ? Item[] : never
    }
    mutable.topicIds = mutable.topicIds.slice(0, -1)

    const report = validateCurriculumPackageRuntime(candidate, {
      includeGeneratorSamples: false,
    })

    expect(report.valid).toBe(false)
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ area: "policy", code: "invalid-xp" }),
    ]))
    expect(report.validatedGeneratorCells).toBe(0)
  })
})
