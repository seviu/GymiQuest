import { describe, expect, it } from "vitest"
import { topicIds } from "./model"
import {
  ACTIVE_CURRICULUM_PACKAGE,
  CURRICULUM_IDENTITY_SCHEMA_VERSION,
  UnsupportedCurriculumPackageError,
  ZURICH_ZAP1_MATH_COURSE_ID,
  ZURICH_ZAP1_MATH_PACKAGE_VERSION,
  curriculumPackageReference,
  requireLearnerCurriculumPackage,
  requireTaskCurriculumPackage,
  resolveCurriculumPackage,
  resolveLearnerCurriculumPackage,
  resolveTaskCurriculumPackage,
  supportedCurriculumPackages,
  taskMatchesLearnerCurriculum,
} from "./curriculumPackage"

describe("curriculum package registry", () => {
  it("registers the complete current Zurich package with its learning policy", () => {
    expect(ACTIVE_CURRICULUM_PACKAGE).toMatchObject({
      courseId: "zh-zap1-math",
      version: 1,
      title: "Zürich ZAP1 Mathematik",
      scope: {
        countryCode: "CH",
        regionCode: "ZH",
        learnerLocale: "de-CH",
        timeZone: "Europe/Zurich",
      },
      assessment: {
        xpThreshold: 150,
        topicLimit: 9,
        fragileTopicLimit: 3,
      },
      xp: {
        policyVersion: 2,
        lessonMaxXp: 25,
        assessmentMaxXp: 10,
        lessonMistakePolicy: {
          perfectBonusRate: 0.3,
          fullXpMaxMistakes: 1,
          deductionRatePerAdditionalMistake: 0.3,
          noXpAfterMistakes: 3,
        },
      },
      exam: {
        durationMinutes: 60,
        taskCount: 9,
        maximumPoints: 36,
      },
    })
    expect(ACTIVE_CURRICULUM_PACKAGE.topicIds).toEqual(topicIds)
    expect(ACTIVE_CURRICULUM_PACKAGE.placement.topicIds).toHaveLength(9)
    expect(Object.keys(ACTIVE_CURRICULUM_PACKAGE.xp.reviewByTopic)).toEqual(topicIds)
    expect(ACTIVE_CURRICULUM_PACKAGE.exam.archiveYears).toEqual([
      2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
    ])
  })

  it("keeps the published manifest and nested policy collections immutable", () => {
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.scope)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.topicIds)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.placement)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.placement.topicIds)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.assessment)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.xp)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.xp.lessonMistakePolicy)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.xp.reviewByTopic)).toBe(true)
    expect(Object.isFrozen(ACTIVE_CURRICULUM_PACKAGE.exam.archiveYears)).toBe(true)
    expect(Object.isFrozen(supportedCurriculumPackages)).toBe(true)
  })

  it("resolves only an exact registered course and package version", () => {
    expect(resolveCurriculumPackage(
      ZURICH_ZAP1_MATH_COURSE_ID,
      ZURICH_ZAP1_MATH_PACKAGE_VERSION,
    )).toBe(ACTIVE_CURRICULUM_PACKAGE)
    expect(resolveCurriculumPackage(ZURICH_ZAP1_MATH_COURSE_ID, 2)).toBeUndefined()
    expect(resolveCurriculumPackage("world-generic-math", 1)).toBeUndefined()
  })

  it("maps the unversioned legacy Zurich identity but requires a version in schema 12", () => {
    expect(resolveLearnerCurriculumPackage({
      schemaVersion: CURRICULUM_IDENTITY_SCHEMA_VERSION - 1,
      courseId: ZURICH_ZAP1_MATH_COURSE_ID,
    })).toBe(ACTIVE_CURRICULUM_PACKAGE)
    expect(resolveLearnerCurriculumPackage({
      schemaVersion: CURRICULUM_IDENTITY_SCHEMA_VERSION,
      courseId: ZURICH_ZAP1_MATH_COURSE_ID,
    })).toBeUndefined()
    expect(() => requireLearnerCurriculumPackage({
      schemaVersion: CURRICULUM_IDENTITY_SCHEMA_VERSION,
      courseId: ZURICH_ZAP1_MATH_COURSE_ID,
      courseVersion: 99,
    })).toThrowError(UnsupportedCurriculumPackageError)
  })

  it("pins legacy tasks to Zurich v1 and compares explicit task and learner identities", () => {
    const learner = {
      schemaVersion: CURRICULUM_IDENTITY_SCHEMA_VERSION,
      courseId: ZURICH_ZAP1_MATH_COURSE_ID,
      courseVersion: ZURICH_ZAP1_MATH_PACKAGE_VERSION,
    }
    const currentTask = {
      curriculum: curriculumPackageReference(ACTIVE_CURRICULUM_PACKAGE),
    }

    expect(resolveTaskCurriculumPackage({})).toBe(ACTIVE_CURRICULUM_PACKAGE)
    expect(requireTaskCurriculumPackage(currentTask)).toBe(ACTIVE_CURRICULUM_PACKAGE)
    expect(taskMatchesLearnerCurriculum(currentTask, learner)).toBe(true)
    expect(taskMatchesLearnerCurriculum({
      curriculum: { courseId: ZURICH_ZAP1_MATH_COURSE_ID, version: 99 },
    }, learner)).toBe(false)
    expect(() => requireTaskCurriculumPackage({
      curriculum: { courseId: ZURICH_ZAP1_MATH_COURSE_ID, version: 99 },
    })).toThrowError(UnsupportedCurriculumPackageError)
  })
})
