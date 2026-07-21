import {
  authorValidationSelections,
  buildAuthorValidationSample,
} from "./authorValidation"
import { lessons, topics } from "./content"
import type { CurriculumPackage } from "./curriculumPackage"
import { generateQuestionsForTask } from "./generators"
import {
  difficultyBandIds,
  type DifficultyBand,
  type LessonDefinition,
  type TopicDefinition,
  type TopicId,
} from "./model"
import { buildParentTopicCoaching } from "./parentCoaching"

export type CurriculumPackageValidationArea =
  | "manifest"
  | "topic"
  | "lesson"
  | "coaching"
  | "generator"
  | "policy"

export interface CurriculumPackageValidationIssue {
  area: CurriculumPackageValidationArea
  code: string
  message: string
  topicId?: TopicId
  difficultyBand?: DifficultyBand
}

export interface CurriculumPackageValidationReport {
  courseId: string
  version: number
  topicCount: number
  expectedGeneratorCells: number
  validatedGeneratorCells: number
  issues: CurriculumPackageValidationIssue[]
  valid: boolean
}

export interface CurriculumPackageValidationOptions {
  includeGeneratorSamples?: boolean
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function validateCurriculumPackageRuntime(
  curriculumPackage: CurriculumPackage,
  options: CurriculumPackageValidationOptions = {},
): CurriculumPackageValidationReport {
  const includeGeneratorSamples = options.includeGeneratorSamples ?? true
  const issues: CurriculumPackageValidationIssue[] = []
  const addIssue = (
    area: CurriculumPackageValidationArea,
    code: string,
    message: string,
    topicId?: TopicId,
    difficultyBand?: DifficultyBand,
  ) => issues.push({
    area,
    code,
    message,
    ...(topicId ? { topicId } : {}),
    ...(difficultyBand ? { difficultyBand } : {}),
  })

  if (!nonEmpty(curriculumPackage.courseId) || !Number.isInteger(curriculumPackage.version) || curriculumPackage.version < 1) {
    addIssue("manifest", "invalid-identity", "Course ID and package version must form a stable positive identity.")
  }
  for (const value of [
    curriculumPackage.title,
    curriculumPackage.shortTitle,
    curriculumPackage.scope.jurisdiction,
    curriculumPackage.scope.track,
    curriculumPackage.scope.subject,
    curriculumPackage.scope.learnerLocale,
    curriculumPackage.scope.timeZone,
  ]) {
    if (!nonEmpty(value)) {
      addIssue("manifest", "missing-scope-copy", "Every package scope field must be non-empty.")
      break
    }
  }

  const packageTopicIds = [...curriculumPackage.topicIds]
  const packageTopicSet = new Set(packageTopicIds)
  if (packageTopicIds.length === 0) {
    addIssue("manifest", "empty-topic-list", "A curriculum package must contain at least one topic.")
  }
  if (packageTopicSet.size !== packageTopicIds.length) {
    addIssue("manifest", "duplicate-topic", "The package topic order contains a duplicate topic.")
  }

  for (const [index, topicId] of packageTopicIds.entries()) {
    const topic = (topics as Partial<Record<TopicId, TopicDefinition>>)[topicId]
    const lesson = (lessons as Partial<Record<TopicId, LessonDefinition>>)[topicId]
    if (!topic) {
      addIssue("topic", "missing-topic-definition", `No topic definition is bound to ${topicId}.`, topicId)
      continue
    }
    if (topic.id !== topicId || topic.courseOrder !== index + 1) {
      addIssue("topic", "topic-order-mismatch", `${topicId} does not match package position ${index + 1}.`, topicId)
    }
    for (const prerequisiteId of topic.prerequisites) {
      const prerequisiteIndex = packageTopicIds.indexOf(prerequisiteId)
      if (prerequisiteIndex === -1) {
        addIssue("topic", "external-prerequisite", `${topicId} depends on ${prerequisiteId}, which is outside the package.`, topicId)
      } else if (prerequisiteIndex >= index) {
        addIssue("topic", "forward-prerequisite", `${topicId} depends on a topic that does not precede it.`, topicId)
      }
    }

    if (!lesson || lesson.topicId !== topicId || lesson.pages.length === 0) {
      addIssue("lesson", "missing-lesson", `${topicId} needs an authored lesson with at least one page.`, topicId)
    } else if (
      !nonEmpty(lesson.goal) ||
      lesson.pages.some((page) => (
        !nonEmpty(page.title) ||
        !nonEmpty(page.body) ||
        !nonEmpty(page.takeaway) ||
        page.steps.length === 0 ||
        page.steps.some((step) => !nonEmpty(step))
      ))
    ) {
      addIssue("lesson", "incomplete-lesson", `${topicId} has an incomplete concept explanation.`, topicId)
    }

    for (const language of ["de", "en", "it", "es"] as const) {
      try {
        const coaching = buildParentTopicCoaching(topicId, language)
        const copy = [
          coaching.title,
          coaching.description,
          coaching.goal,
          coaching.ideaTitle,
          coaching.idea,
          coaching.commonHurdle,
          coaching.nextStep,
          coaching.takeaway,
          coaching.teachBackPrompt,
          ...coaching.workedSteps,
          ...coaching.prerequisiteTitles,
        ]
        if (
          coaching.workedSteps.length === 0 ||
          coaching.prerequisiteTitles.length !== topic.prerequisites.length ||
          copy.some((value) => !nonEmpty(value))
        ) {
          addIssue("coaching", "incomplete-coaching", `${topicId} has incomplete ${language} coaching copy.`, topicId)
        }
      } catch {
        addIssue("coaching", "missing-coaching", `${topicId} has no usable ${language} coaching guide.`, topicId)
      }
    }
  }

  const placementTopicIds = [...curriculumPackage.placement.topicIds]
  if (
    placementTopicIds.length === 0 ||
    new Set(placementTopicIds).size !== placementTopicIds.length ||
    placementTopicIds.some((topicId) => !packageTopicSet.has(topicId))
  ) {
    addIssue("policy", "invalid-placement", "Placement topics must be a non-empty unique subset of package topics.")
  }
  if (
    !Number.isInteger(curriculumPackage.assessment.xpThreshold) ||
    curriculumPackage.assessment.xpThreshold < 1 ||
    !Number.isInteger(curriculumPackage.assessment.topicLimit) ||
    curriculumPackage.assessment.topicLimit < 1 ||
    curriculumPackage.assessment.topicLimit > packageTopicIds.length ||
    !Number.isInteger(curriculumPackage.assessment.fragileTopicLimit) ||
    curriculumPackage.assessment.fragileTopicLimit < 0 ||
    curriculumPackage.assessment.fragileTopicLimit > curriculumPackage.assessment.topicLimit
  ) {
    addIssue("policy", "invalid-assessment", "Assessment thresholds and topic limits must fit the package.")
  }

  const reviewTopicIds = Object.keys(curriculumPackage.xp.reviewByTopic)
  const lessonMistakePolicy = curriculumPackage.xp.lessonMistakePolicy
  if (
    reviewTopicIds.length !== packageTopicIds.length ||
    reviewTopicIds.some((topicId) => !packageTopicSet.has(topicId as TopicId)) ||
    packageTopicIds.some((topicId) => {
      const xp = curriculumPackage.xp.reviewByTopic[topicId]
      return !Number.isInteger(xp) || xp < 1
    }) ||
    !Number.isInteger(curriculumPackage.xp.policyVersion) ||
    curriculumPackage.xp.policyVersion < 1 ||
    !Number.isInteger(curriculumPackage.xp.lessonMaxXp) ||
    curriculumPackage.xp.lessonMaxXp < 1 ||
    !Number.isInteger(curriculumPackage.xp.assessmentMaxXp) ||
    curriculumPackage.xp.assessmentMaxXp < 1 ||
    !Number.isFinite(lessonMistakePolicy.perfectBonusRate) ||
    lessonMistakePolicy.perfectBonusRate < 0 ||
    !Number.isInteger(lessonMistakePolicy.fullXpMaxMistakes) ||
    lessonMistakePolicy.fullXpMaxMistakes < 0 ||
    !Number.isFinite(lessonMistakePolicy.deductionRatePerAdditionalMistake) ||
    lessonMistakePolicy.deductionRatePerAdditionalMistake < 0 ||
    lessonMistakePolicy.deductionRatePerAdditionalMistake > 1 ||
    !Number.isInteger(lessonMistakePolicy.noXpAfterMistakes) ||
    lessonMistakePolicy.noXpAfterMistakes < lessonMistakePolicy.fullXpMaxMistakes
  ) {
    addIssue("policy", "invalid-xp", "XP policy must cover every package topic with positive integer values.")
  }

  const archiveYears = [...curriculumPackage.exam.archiveYears]
  if (
    !Number.isInteger(curriculumPackage.exam.durationMinutes) ||
    curriculumPackage.exam.durationMinutes < 1 ||
    !Number.isInteger(curriculumPackage.exam.taskCount) ||
    curriculumPackage.exam.taskCount < 1 ||
    !Number.isInteger(curriculumPackage.exam.maximumPoints) ||
    curriculumPackage.exam.maximumPoints < 1 ||
    archiveYears.length === 0 ||
    new Set(archiveYears).size !== archiveYears.length ||
    archiveYears.some((year, index) => !Number.isInteger(year) || (index > 0 && year <= archiveYears[index - 1]!))
  ) {
    addIssue("policy", "invalid-exam", "Exam and archive values must be positive, unique, and chronological.")
  }

  const selections = authorValidationSelections(curriculumPackage)
  const expectedGeneratorCells = packageTopicIds.length * difficultyBandIds.length
  if (selections.length !== expectedGeneratorCells) {
    addIssue("generator", "coverage-count", "The author-validation matrix does not cover every topic and difficulty band.")
  }

  let validatedGeneratorCells = 0
  if (includeGeneratorSamples) {
    for (const { topicId, difficultyBand } of selections) {
      try {
        const sample = buildAuthorValidationSample(
          topicId,
          difficultyBand,
          1,
          curriculumPackage,
        )
        const replay = generateQuestionsForTask(sample.task)[0]
        validatedGeneratorCells += 1
        if (
          !replay ||
          replay.topicId !== topicId ||
          replay.generation?.difficultyBand !== difficultyBand ||
          !nonEmpty(replay.prompt) ||
          !nonEmpty(replay.hint) ||
          !nonEmpty(replay.easierExplanation) ||
          !nonEmpty(replay.explanation) ||
          replay.workedSteps.length === 0 ||
          replay.workedSteps.some((step) => !nonEmpty(step)) ||
          !nonEmpty(sample.expectedAnswer) ||
          sample.task.curriculum?.courseId !== curriculumPackage.courseId ||
          sample.task.curriculum.version !== curriculumPackage.version ||
          !sameJson(replay, sample.question)
        ) {
          addIssue("generator", "invalid-generator-cell", `${topicId} ${difficultyBand} is incomplete or not deterministic.`, topicId, difficultyBand)
        }
      } catch (error) {
        validatedGeneratorCells += 1
        addIssue(
          "generator",
          "generator-failed",
          `${topicId} ${difficultyBand} failed: ${error instanceof Error ? error.message : "unknown error"}`,
          topicId,
          difficultyBand,
        )
      }
    }
  }

  return {
    courseId: curriculumPackage.courseId,
    version: curriculumPackage.version,
    topicCount: packageTopicIds.length,
    expectedGeneratorCells,
    validatedGeneratorCells,
    issues,
    valid: issues.length === 0 && (
      !includeGeneratorSamples || validatedGeneratorCells === expectedGeneratorCells
    ),
  }
}
