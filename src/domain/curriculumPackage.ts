import {
  topicIds,
  type CurriculumPackageReference,
  type TopicId,
} from "./model"

export const CURRICULUM_IDENTITY_SCHEMA_VERSION = 12 as const
export const ZURICH_ZAP1_MATH_COURSE_ID = "zh-zap1-math" as const
export const ZURICH_ZAP1_MATH_PACKAGE_VERSION = 1 as const

export interface CurriculumPackage {
  readonly courseId: string
  readonly version: number
  readonly title: string
  readonly shortTitle: string
  readonly scope: {
    readonly countryCode: string
    readonly regionCode: string
    readonly jurisdiction: string
    readonly track: string
    readonly subject: string
    readonly learnerLocale: string
    readonly learnerLanguageLabel: string
    readonly timeZone: string
  }
  readonly topicIds: readonly TopicId[]
  readonly placement: {
    readonly topicIds: readonly TopicId[]
  }
  readonly assessment: {
    readonly xpThreshold: number
    readonly topicLimit: number
    readonly fragileTopicLimit: number
  }
  readonly xp: {
    readonly policyVersion: number
    readonly lessonMaxXp: number
    readonly assessmentMaxXp: number
    readonly lessonMistakePolicy: {
      readonly perfectBonusRate: number
      readonly fullXpMaxMistakes: number
      readonly deductionRatePerAdditionalMistake: number
      readonly noXpAfterMistakes: number
    }
    readonly reviewByTopic: Readonly<Record<TopicId, number>>
  }
  readonly exam: {
    readonly durationMinutes: number
    readonly taskCount: number
    readonly maximumPoints: number
    readonly archiveYears: readonly number[]
  }
}

const placementTopicIds = Object.freeze([
  "arithmetic-equations",
  "efficient-arithmetic",
  "mass-units",
  "fraction-of-quantity",
  "time-fractions",
  "money-calculations",
  "area-fractions",
  "inverse-proportion",
  "geometric-loci",
] satisfies TopicId[])

const reviewXpByTopic = Object.freeze({
  "arithmetic-equations": 4,
  "efficient-arithmetic": 4,
  "mass-units": 4,
  "fraction-of-quantity": 4,
  "time-fractions": 4,
  "speed-distance-time": 6,
  "data-tables": 6,
  "money-calculations": 4,
  "proportional-revenue": 6,
  "integer-combinations": 6,
  "number-constraints": 6,
  "area-fractions": 4,
  "composite-areas": 6,
  "tiling-costs": 6,
  "reverse-fractions": 6,
  "reverse-chains": 8,
  "inverse-proportion": 6,
  "changing-rates": 8,
  "geometric-loci": 6,
  "coordinate-transformations": 6,
  "cube-nets": 6,
  "spatial-rolling": 6,
  "cuboid-surface": 8,
} satisfies Record<TopicId, number>)

export const ZURICH_ZAP1_MATH_PACKAGE: CurriculumPackage = Object.freeze({
  courseId: ZURICH_ZAP1_MATH_COURSE_ID,
  version: ZURICH_ZAP1_MATH_PACKAGE_VERSION,
  title: "Zürich ZAP1 Mathematik",
  shortTitle: "ZAP1 Mathematik · Zürich",
  scope: Object.freeze({
    countryCode: "CH",
    regionCode: "ZH",
    jurisdiction: "Kanton Zürich",
    track: "ZAP1 Langgymnasium",
    subject: "Mathematik",
    learnerLocale: "de-CH",
    learnerLanguageLabel: "Deutsch (Schweiz)",
    timeZone: "Europe/Zurich",
  }),
  topicIds: Object.freeze([...topicIds]),
  placement: Object.freeze({
    topicIds: placementTopicIds,
  }),
  assessment: Object.freeze({
    xpThreshold: 150,
    topicLimit: 9,
    fragileTopicLimit: 3,
  }),
  xp: Object.freeze({
    policyVersion: 2,
    lessonMaxXp: 25,
    assessmentMaxXp: 10,
    lessonMistakePolicy: Object.freeze({
      perfectBonusRate: 0.3,
      fullXpMaxMistakes: 1,
      deductionRatePerAdditionalMistake: 0.3,
      noXpAfterMistakes: 3,
    }),
    reviewByTopic: reviewXpByTopic,
  }),
  exam: Object.freeze({
    durationMinutes: 60,
    taskCount: 9,
    maximumPoints: 36,
    archiveYears: Object.freeze([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]),
  }),
})

export const ACTIVE_CURRICULUM_PACKAGE = ZURICH_ZAP1_MATH_PACKAGE

function curriculumPackageKey(courseId: string, version: number): string {
  return `${courseId}@${version}`
}

const packageRegistry = new Map<string, CurriculumPackage>([
  [
    curriculumPackageKey(
      ZURICH_ZAP1_MATH_PACKAGE.courseId,
      ZURICH_ZAP1_MATH_PACKAGE.version,
    ),
    ZURICH_ZAP1_MATH_PACKAGE,
  ],
])

export const supportedCurriculumPackages = Object.freeze([
  ...packageRegistry.values(),
])

export function resolveCurriculumPackage(
  courseId: unknown,
  version: unknown,
): CurriculumPackage | undefined {
  if (
    typeof courseId !== "string" ||
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    return undefined
  }
  return packageRegistry.get(curriculumPackageKey(courseId, version))
}

export function curriculumPackageReference(
  curriculumPackage: CurriculumPackage,
): CurriculumPackageReference {
  return {
    courseId: curriculumPackage.courseId,
    version: curriculumPackage.version,
  }
}

export interface TaskCurriculumIdentity {
  readonly curriculum?: unknown
}

/**
 * Tasks saved before schema 12 had no curriculum field. They are permanently
 * assigned to the only package that existed at that time, Zurich package v1;
 * this fallback must not follow whichever package becomes active in future.
 */
export function resolveTaskCurriculumPackage(
  task: TaskCurriculumIdentity,
): CurriculumPackage | undefined {
  if (task.curriculum === undefined) return ZURICH_ZAP1_MATH_PACKAGE
  if (
    typeof task.curriculum !== "object" ||
    task.curriculum === null ||
    Array.isArray(task.curriculum)
  ) {
    return undefined
  }
  const reference = task.curriculum as {
    readonly courseId?: unknown
    readonly version?: unknown
  }
  return resolveCurriculumPackage(
    reference.courseId,
    reference.version,
  )
}

export function requireTaskCurriculumPackage(
  task: TaskCurriculumIdentity,
): CurriculumPackage {
  const curriculumPackage = resolveTaskCurriculumPackage(task)
  if (curriculumPackage) return curriculumPackage
  const reference = typeof task.curriculum === "object" && task.curriculum !== null
    ? task.curriculum as { readonly courseId?: unknown; readonly version?: unknown }
    : undefined
  throw new UnsupportedCurriculumPackageError(
    reference?.courseId,
    reference?.version,
  )
}

export interface LearnerCurriculumIdentity {
  readonly schemaVersion?: unknown
  readonly courseId?: unknown
  readonly courseVersion?: unknown
}

export function resolveLearnerCurriculumPackage(
  learner: LearnerCurriculumIdentity,
): CurriculumPackage | undefined {
  if (typeof learner.courseId !== "string") return undefined

  if (learner.courseVersion !== undefined) {
    return resolveCurriculumPackage(learner.courseId, learner.courseVersion)
  }

  const schemaVersion = typeof learner.schemaVersion === "number"
    ? learner.schemaVersion
    : 1
  if (
    Number.isInteger(schemaVersion) &&
    schemaVersion < CURRICULUM_IDENTITY_SCHEMA_VERSION &&
    learner.courseId === ZURICH_ZAP1_MATH_COURSE_ID
  ) {
    return ZURICH_ZAP1_MATH_PACKAGE
  }
  return undefined
}

export class UnsupportedCurriculumPackageError extends Error {
  constructor(
    public readonly courseId: unknown,
    public readonly courseVersion: unknown,
  ) {
    const versionLabel = typeof courseVersion === "number"
      ? `Version ${courseVersion}`
      : "ohne Versionsangabe"
    super(`Das Lehrplanpaket ${String(courseId)} (${versionLabel}) wird von dieser App-Version nicht unterstützt.`)
    this.name = "UnsupportedCurriculumPackageError"
  }
}

export function requireLearnerCurriculumPackage(
  learner: LearnerCurriculumIdentity,
): CurriculumPackage {
  const curriculumPackage = resolveLearnerCurriculumPackage(learner)
  if (curriculumPackage) return curriculumPackage
  throw new UnsupportedCurriculumPackageError(
    learner.courseId,
    learner.courseVersion,
  )
}

export function taskMatchesLearnerCurriculum(
  task: TaskCurriculumIdentity,
  learner: LearnerCurriculumIdentity,
): boolean {
  const taskPackage = resolveTaskCurriculumPackage(task)
  const learnerPackage = resolveLearnerCurriculumPackage(learner)
  return Boolean(
    taskPackage &&
    learnerPackage &&
    taskPackage.courseId === learnerPackage.courseId &&
    taskPackage.version === learnerPackage.version,
  )
}
