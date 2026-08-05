import {
  difficultyBandIds,
  generationVersionIds,
  lessonPacingModeIds,
  topicIds,
  type GeneratedQuestion,
  type LearningTask,
  type TopicId,
} from "./model"
import { isAuthorValidationTask } from "./authorValidation"
import { resolveTaskCurriculumPackage } from "./curriculumPackage"
import {
  isLessonPacingQuestionCount,
  isReachableLessonPacingDifficultyBands,
} from "./lessonPacing"
import { courseKeys } from "./subjectIdentity"
import type { GermanLearningSession } from "../subjects/german/courseState"
import {
  generateGermanQuestions,
  germanDifficultyBandForSessionKind,
  germanDifficultyBands,
  type GermanDifficultyBand,
  type GermanGeneratedQuestion,
} from "../subjects/german/generators"
import {
  GERMAN_EXAM_QUESTION_COUNT,
  buildGermanExamBlueprint,
  germanExamBlueprintVersions,
  type ActiveGermanExam,
  type GermanExamBlueprintVersion,
} from "../subjects/german/exam"
import {
  GERMAN_ASSESSMENT_ACTIVITY_ID,
  GERMAN_CORPUS_VERSION,
  GERMAN_COURSE_ID,
  GERMAN_COURSE_VERSION,
  GERMAN_GENERATOR_VERSION,
  GERMAN_SCORING_POLICY_VERSION,
  germanGeneratorVersions,
  germanLessonIds,
  germanLessonIdByTopic,
  germanPilotTopicIds,
  germanTopicIds,
  type GermanActivityId,
  type GermanGeneratorVersion,
  type GermanPilotTopicId,
  type GermanTopicId,
} from "../subjects/german/package"
import {
  germanScoringRuleForQuestion,
  germanScoringRuleIds,
  type GermanScoringRuleId,
} from "../subjects/german/scoringPolicy"
import {
  GERMAN_WRITING_BLUEPRINT_VERSION,
  buildGermanWritingForm,
  type ActiveGermanWritingSession,
  type GermanWritingPromptTemplate,
} from "../subjects/german/writing"
import {
  GERMAN_COMPREHENSION_GENERATOR_VERSION,
  germanComprehensionPromptById,
  type ActiveGermanComprehensionSession,
  type GermanComprehensionPrompt,
} from "../subjects/german/comprehension"

export const EXERCISE_REPORT_VERSION = 1

export interface MathematicsExerciseReportReference {
  version: typeof EXERCISE_REPORT_VERSION
  task: LearningTask
  question: {
    index: number
    id: string
    topicId: TopicId
    prompt: string
    generation?: GeneratedQuestion["generation"]
    provenance?: GeneratedQuestion["provenance"]
  }
}

export interface GermanExerciseReportReference {
  version: typeof EXERCISE_REPORT_VERSION
  subjectId: "german"
  course: {
    courseKey: typeof courseKeys.german
    courseId: typeof GERMAN_COURSE_ID
    courseVersion: typeof GERMAN_COURSE_VERSION
    generatorId: typeof GERMAN_COURSE_ID
    generatorVersion: GermanGeneratorVersion
    corpusVersion: typeof GERMAN_CORPUS_VERSION
    scoringPolicyVersion: typeof GERMAN_SCORING_POLICY_VERSION
  }
  session:
    | GermanLearningExerciseReportSession
    | GermanExamExerciseReportSession
    | GermanWritingExerciseReportSession
    | GermanComprehensionExerciseReportSession
  question: {
    index: number
    id: string
    topicId: GermanTopicId
    familyId: GermanGeneratedQuestion["familyId"] | "writing-prompt" | "comprehension-response"
    difficultyBand?: GermanDifficultyBand
    scoringRuleId?: GermanScoringRuleId
    templateId: string
    seed: string
    prompt: string
  }
}

export interface GermanLearningExerciseReportSession {
  kind: GermanLearningSession["kind"]
  lessonId: GermanActivityId
  topicId: GermanPilotTopicId
  assessmentTopicIds?: GermanPilotTopicId[]
  excludedTemplateIdsByTopic: Partial<Record<GermanPilotTopicId, string[]>>
  generatorVersion?: GermanGeneratorVersion
  seed: string
  questionCount: number
}

export interface GermanExamExerciseReportSession {
  kind: "exam"
  topicId: GermanPilotTopicId
  seed: string
  questionCount: typeof GERMAN_EXAM_QUESTION_COUNT
  blueprintVersion: GermanExamBlueprintVersion
  passageId: string
}

export interface GermanWritingExerciseReportSession {
  kind: "writing"
  topicId: "writing"
  seed: string
  questionCount: 3
  blueprintVersion: typeof GERMAN_WRITING_BLUEPRINT_VERSION
}

export interface GermanComprehensionExerciseReportSession {
  kind: "comprehension"
  topicId: "reading-evidence"
  seed: string
  questionCount: 1
  promptVersion: typeof GERMAN_COMPREHENSION_GENERATOR_VERSION
}

export type ExerciseReportReference = MathematicsExerciseReportReference | GermanExerciseReportReference

const validTopicIds = new Set<string>(topicIds)
const validTaskKinds = new Set(["lesson", "review", "assessment", "repair", "placement"])
const validDifficultyBands = new Set<string>(difficultyBandIds)
const validGenerationVersions = new Set<number>(generationVersionIds)
const validLessonPacingModes = new Set<string>(lessonPacingModeIds)
const validGermanLearningSessionKinds = new Set(["lesson", "review", "assessment"])
const validGermanGeneratorVersions = new Set<number>(germanGeneratorVersions)
const validGermanDifficultyBands = new Set<string>(germanDifficultyBands)
const validGermanScoringRuleIds = new Set<string>(germanScoringRuleIds)
const validGermanExamBlueprintVersions = new Set<number>(germanExamBlueprintVersions)
const validGermanLessonIds = new Set<string>([...germanLessonIds, GERMAN_ASSESSMENT_ACTIVITY_ID])
const validGermanPilotTopicIds = new Set<string>(germanPilotTopicIds)
const validGermanTopicIds = new Set<string>(germanTopicIds)
const validGermanFamilyIds = new Set([
  "truth-status",
  "reading-evidence",
  "multi-evidence",
  "vocabulary-context",
  "word-formation",
  "one-error-correction",
  "sentence-constituents",
  "connector-cloze",
  "tense-perspective",
  "word-class",
  "writing-prompt",
  "comprehension-response",
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isShortString(value: unknown, maximum = 20_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedKeys = new Set(allowed)
  return Object.keys(value).every((key) => allowedKeys.has(key))
}

function isTopicId(value: unknown): value is TopicId {
  return typeof value === "string" && validTopicIds.has(value)
}

function isTopicIdArray(value: unknown): value is TopicId[] {
  return Array.isArray(value) && value.length > 0 && value.every(isTopicId)
}

function isQuestionProvenance(value: unknown): value is NonNullable<GeneratedQuestion["provenance"]> {
  return Boolean(
    isRecord(value) &&
    value.kind === "original-dynamic" &&
    isShortString(value.familyId, 200) &&
    isShortString(value.templateId, 200) &&
    typeof value.templateVersion === "number" &&
    Number.isInteger(value.templateVersion) &&
    value.templateVersion > 0,
  )
}

function isQuestionGeneration(
  value: unknown,
): value is NonNullable<GeneratedQuestion["generation"]> {
  return Boolean(
    isRecord(value) &&
    typeof value.version === "number" &&
    validGenerationVersions.has(value.version) &&
    typeof value.difficultyBand === "string" &&
    validDifficultyBands.has(value.difficultyBand) &&
    typeof value.difficultyScore === "number" &&
    Number.isFinite(value.difficultyScore) &&
    typeof value.candidateCount === "number" &&
    Number.isInteger(value.candidateCount) &&
    value.candidateCount > 0
  )
}

function isLearningTaskReference(value: unknown): value is LearningTask {
  return Boolean(
    isRecord(value) &&
    isShortString(value.id, 1_000) &&
    typeof value.kind === "string" &&
    validTaskKinds.has(value.kind) &&
    isShortString(value.title, 2_000) &&
    isShortString(value.description, 10_000) &&
    isTopicIdArray(value.topicIds) &&
    Array.isArray(value.prerequisiteIds) &&
    value.prerequisiteIds.every(isTopicId) &&
    typeof value.maxXp === "number" &&
    Number.isInteger(value.maxXp) &&
    value.maxXp >= 0 &&
    typeof value.questionCount === "number" &&
    Number.isInteger(value.questionCount) &&
    value.questionCount > 0 &&
    isShortString(value.seed, 2_000) &&
    (value.contentLocale === undefined || value.contentLocale === "en" || value.contentLocale === "it" || value.contentLocale === "es" || value.contentLocale === "de") &&
    (value.generation === undefined || Boolean(
      isRecord(value.generation) &&
      typeof value.generation.version === "number" &&
      validGenerationVersions.has(value.generation.version) &&
      Array.isArray(value.generation.difficultyBands) &&
      value.generation.difficultyBands.length === value.questionCount &&
      value.generation.difficultyBands.every((band) => (
        typeof band === "string" && validDifficultyBands.has(band)
      ))
    )) &&
    (value.pacing === undefined || Boolean(
      value.kind === "lesson" &&
      isRecord(value.pacing) &&
      value.pacing.version === 1 &&
      typeof value.pacing.mode === "string" &&
      validLessonPacingModes.has(value.pacing.mode) &&
      isRecord(value.generation) &&
      isLessonPacingQuestionCount(
        value.pacing.mode as (typeof lessonPacingModeIds)[number],
        value.questionCount,
      )
    )) &&
    resolveTaskCurriculumPackage(value) !== undefined,
  )
}

function isMathematicsExerciseReportReference(value: unknown): value is MathematicsExerciseReportReference {
  if (!isRecord(value) || value.version !== EXERCISE_REPORT_VERSION) return false
  if (!isLearningTaskReference(value.task) || !isRecord(value.question)) return false
  return Boolean(
    typeof value.question.index === "number" &&
    Number.isInteger(value.question.index) &&
    value.question.index >= 0 &&
    value.question.index < value.task.questionCount &&
    (value.task.pacing === undefined || Boolean(
      value.task.generation &&
      isReachableLessonPacingDifficultyBands(
        value.task.pacing.mode,
        value.task.questionCount,
        value.task.generation.difficultyBands,
        value.question.index,
      )
    )) &&
    isShortString(value.question.id, 2_000) &&
    isTopicId(value.question.topicId) &&
    value.task.topicIds.includes(value.question.topicId) &&
    isShortString(value.question.prompt) &&
    (value.question.generation === undefined || Boolean(
      isQuestionGeneration(value.question.generation) &&
      (
        value.task.generation === undefined ||
        (
          value.question.generation.version === value.task.generation.version &&
          value.question.generation.difficultyBand ===
            value.task.generation.difficultyBands[value.question.index]
        )
      )
    )) &&
    (value.question.provenance === undefined || isQuestionProvenance(value.question.provenance)),
  )
}

function isGermanTopicId(value: unknown): value is GermanTopicId {
  return typeof value === "string" && validGermanTopicIds.has(value)
}

function isGermanPilotTopicId(value: unknown): value is GermanPilotTopicId {
  return typeof value === "string" && validGermanPilotTopicIds.has(value)
}

function isGermanTopicIdArray(value: unknown): value is GermanPilotTopicId[] {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.length <= germanPilotTopicIds.length &&
    value.every(isGermanPilotTopicId) &&
    new Set(value).size === value.length
}

function isGermanExclusions(value: unknown): boolean {
  return Boolean(
    isRecord(value) &&
    Object.keys(value).length <= germanPilotTopicIds.length &&
    Object.entries(value).every(([topicId, templateIds]) => (
      validGermanPilotTopicIds.has(topicId) &&
      Array.isArray(templateIds) &&
      templateIds.length <= 100 &&
      templateIds.every((templateId) => isShortString(templateId, 500))
    ))
  )
}

function germanWritingReportQuestionId(
  prompt: GermanWritingPromptTemplate,
  index: number,
): string {
  return `german-writing:${GERMAN_WRITING_BLUEPRINT_VERSION}:${prompt.id}:${index}`
}

function germanComprehensionReportQuestionId(prompt: GermanComprehensionPrompt): string {
  return `german-comprehension:${GERMAN_COMPREHENSION_GENERATOR_VERSION}:${prompt.id}`
}

function isGermanExerciseReportReference(value: unknown): value is GermanExerciseReportReference {
  if (!isRecord(value) ||
    !hasOnlyKeys(value, ["version", "subjectId", "course", "session", "question"]) ||
    value.version !== EXERCISE_REPORT_VERSION ||
    value.subjectId !== "german" ||
    !isRecord(value.course) ||
    !hasOnlyKeys(value.course, [
      "courseKey",
      "courseId",
      "courseVersion",
      "generatorId",
      "generatorVersion",
      "corpusVersion",
      "scoringPolicyVersion",
    ]) ||
    value.course.courseKey !== courseKeys.german ||
    value.course.courseId !== GERMAN_COURSE_ID ||
    value.course.courseVersion !== GERMAN_COURSE_VERSION ||
    value.course.generatorId !== GERMAN_COURSE_ID ||
    typeof value.course.generatorVersion !== "number" ||
    !validGermanGeneratorVersions.has(value.course.generatorVersion) ||
    value.course.corpusVersion !== GERMAN_CORPUS_VERSION ||
    value.course.scoringPolicyVersion !== GERMAN_SCORING_POLICY_VERSION ||
    !isRecord(value.session) ||
    typeof value.session.kind !== "string" ||
    !isGermanTopicId(value.session.topicId) ||
    !isShortString(value.session.seed, 2_000) ||
    typeof value.session.questionCount !== "number" ||
    !Number.isInteger(value.session.questionCount) ||
    value.session.questionCount < 1 ||
    value.session.questionCount > 100 ||
    !isRecord(value.question) ||
    !hasOnlyKeys(value.question, [
      "index",
      "id",
      "topicId",
      "familyId",
      "difficultyBand",
      "scoringRuleId",
      "templateId",
      "seed",
      "prompt",
    ]) ||
    typeof value.question.index !== "number" ||
    !Number.isInteger(value.question.index) ||
    value.question.index < 0 ||
    value.question.index >= value.session.questionCount ||
    !isShortString(value.question.id, 2_000) ||
    !isGermanTopicId(value.question.topicId) ||
    typeof value.question.familyId !== "string" ||
    !validGermanFamilyIds.has(value.question.familyId) ||
    (value.question.difficultyBand !== undefined && (
      typeof value.question.difficultyBand !== "string" ||
      !validGermanDifficultyBands.has(value.question.difficultyBand)
    )) ||
    (value.question.scoringRuleId !== undefined && (
      typeof value.question.scoringRuleId !== "string" ||
      !validGermanScoringRuleIds.has(value.question.scoringRuleId)
    )) ||
    !isShortString(value.question.templateId, 500) ||
    !isShortString(value.question.seed, 2_000) ||
    !isShortString(value.question.prompt)
  ) return false

  if (value.session.kind === "writing") {
    if (!hasOnlyKeys(value.session, [
      "kind",
      "topicId",
      "seed",
      "questionCount",
      "blueprintVersion",
    ]) ||
      value.session.topicId !== "writing" ||
      value.question.topicId !== "writing" ||
      value.session.questionCount !== 3 ||
      value.session.blueprintVersion !== GERMAN_WRITING_BLUEPRINT_VERSION ||
      value.question.familyId !== "writing-prompt" ||
      value.question.difficultyBand !== undefined ||
      value.question.scoringRuleId !== undefined
    ) return false
    const prompt = buildGermanWritingForm(value.session.seed).prompts[value.question.index]
    return Boolean(
      prompt &&
      value.question.id === germanWritingReportQuestionId(prompt, value.question.index) &&
      value.question.templateId === prompt.id &&
      value.question.seed === value.session.seed &&
      value.question.prompt === prompt.prompt
    )
  }

  if (value.session.kind === "comprehension") {
    if (!hasOnlyKeys(value.session, [
      "kind",
      "topicId",
      "seed",
      "questionCount",
      "promptVersion",
    ]) ||
      value.session.topicId !== "reading-evidence" ||
      value.question.topicId !== "reading-evidence" ||
      value.session.questionCount !== 1 ||
      value.session.promptVersion !== GERMAN_COMPREHENSION_GENERATOR_VERSION ||
      value.question.index !== 0 ||
      value.question.familyId !== "comprehension-response" ||
      value.question.difficultyBand !== undefined ||
      value.question.scoringRuleId !== undefined
    ) return false
    const prompt = germanComprehensionPromptById(value.question.templateId)
    return Boolean(
      prompt &&
      value.question.id === germanComprehensionReportQuestionId(prompt) &&
      value.question.seed === value.session.seed &&
      value.question.prompt === prompt.question
    )
  }

  if (value.session.kind === "exam") {
    if (!hasOnlyKeys(value.session, [
      "kind",
      "topicId",
      "seed",
      "questionCount",
      "blueprintVersion",
      "passageId",
    ]) ||
      value.session.questionCount !== GERMAN_EXAM_QUESTION_COUNT ||
      typeof value.session.blueprintVersion !== "number" ||
      !validGermanExamBlueprintVersions.has(value.session.blueprintVersion) ||
      !isShortString(value.session.passageId, 500)
    ) return false
    const blueprint = buildGermanExamBlueprint(
      value.session.seed,
      value.session.blueprintVersion as GermanExamBlueprintVersion,
    )
    const question = blueprint.questions[value.question.index]
    return Boolean(
      blueprint.passage.id === value.session.passageId &&
      question?.generatorVersion === value.course.generatorVersion &&
      question &&
      question.id === value.question.id &&
      question.topicId === value.question.topicId &&
      question.topicId === value.session.topicId &&
      question.familyId === value.question.familyId &&
      (value.question.difficultyBand === undefined ||
        question.difficultyBand === value.question.difficultyBand) &&
      (value.question.scoringRuleId === undefined ||
        germanScoringRuleForQuestion(question).id === value.question.scoringRuleId) &&
      question.templateId === value.question.templateId &&
      question.seed === value.question.seed &&
      question.prompt === value.question.prompt
    )
  }

  if (!isGermanPilotTopicId(value.session.topicId) ||
    !isGermanPilotTopicId(value.question.topicId) ||
    !validGermanLearningSessionKinds.has(value.session.kind) ||
    !hasOnlyKeys(value.session, [
      "kind",
      "lessonId",
      "topicId",
      "assessmentTopicIds",
      "excludedTemplateIdsByTopic",
      "generatorVersion",
      "seed",
      "questionCount",
    ]) ||
    typeof value.session.lessonId !== "string" ||
    !validGermanLessonIds.has(value.session.lessonId) ||
    (value.session.generatorVersion !== undefined && (
      typeof value.session.generatorVersion !== "number" ||
      !validGermanGeneratorVersions.has(value.session.generatorVersion)
    )) ||
    (value.session.generatorVersion ?? value.course.generatorVersion) !== value.course.generatorVersion ||
    !isGermanExclusions(value.session.excludedTemplateIdsByTopic)
  ) return false
  const assessmentTopics = value.session.assessmentTopicIds
  if (assessmentTopics !== undefined && !isGermanTopicIdArray(assessmentTopics)) return false
  if (value.session.kind === "assessment") {
    if (
      value.session.lessonId !== GERMAN_ASSESSMENT_ACTIVITY_ID ||
      assessmentTopics === undefined ||
      value.session.questionCount !== assessmentTopics.length
    ) {
      return false
    }
  } else if (
    value.session.lessonId !== germanLessonIdByTopic[value.session.topicId] ||
    assessmentTopics !== undefined
  ) return false
  const permittedTopics = assessmentTopics ?? [value.session.topicId]
  if (!permittedTopics.includes(value.question.topicId)) return false
  const generatorVersion = (value.session.generatorVersion ?? value.course.generatorVersion) as GermanGeneratorVersion
  const expectedQuestion = value.session.kind === "assessment"
    ? (() => {
        const topicId = assessmentTopics?.[value.question.index]
        if (!topicId) return undefined
        return generateGermanQuestions({
          lessonId: germanLessonIdByTopic[topicId],
          topicId,
          generatorVersion,
          seed: `${value.session.seed}:${topicId}:${value.question.index}`,
          questionCount: 1,
          difficultyBand: germanDifficultyBandForSessionKind(
            value.session.kind as GermanLearningSession["kind"],
          ),
          excludedTemplateIds: (value.session.excludedTemplateIdsByTopic as Record<string, string[]>)[topicId],
        })[0]
      })()
    : generateGermanQuestions({
        lessonId: value.session.lessonId as Exclude<GermanActivityId, typeof GERMAN_ASSESSMENT_ACTIVITY_ID>,
        topicId: value.session.topicId,
        generatorVersion,
        seed: value.session.seed,
        questionCount: value.session.questionCount,
        difficultyBand: germanDifficultyBandForSessionKind(
          value.session.kind as GermanLearningSession["kind"],
        ),
        excludedTemplateIds: (value.session.excludedTemplateIdsByTopic as Record<string, string[]>)[value.session.topicId],
      })[value.question.index]
  return Boolean(
    expectedQuestion &&
    expectedQuestion.id === value.question.id &&
    expectedQuestion.topicId === value.question.topicId &&
    expectedQuestion.familyId === value.question.familyId &&
    (value.question.difficultyBand === undefined ||
      expectedQuestion.difficultyBand === value.question.difficultyBand) &&
    (value.question.scoringRuleId === undefined ||
      germanScoringRuleForQuestion(expectedQuestion).id === value.question.scoringRuleId) &&
    expectedQuestion.templateId === value.question.templateId &&
    expectedQuestion.seed === value.question.seed &&
    expectedQuestion.prompt === value.question.prompt
  )
}

export function isGermanExerciseReport(
  reference: ExerciseReportReference,
): reference is GermanExerciseReportReference {
  return "subjectId" in reference && reference.subjectId === "german"
}

export function isMathematicsExerciseReport(
  reference: ExerciseReportReference,
): reference is MathematicsExerciseReportReference {
  return !isGermanExerciseReport(reference)
}

function isExerciseReportReference(value: unknown): value is ExerciseReportReference {
  return isGermanExerciseReportReference(value) || isMathematicsExerciseReportReference(value)
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return globalThis.btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "")
}

function decodeBase64Url(value: string): string {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  const binary = globalThis.atob(padded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function createExerciseReportReference(
  task: LearningTask,
  question: GeneratedQuestion,
  questionIndex: number,
): MathematicsExerciseReportReference {
  return {
    version: EXERCISE_REPORT_VERSION,
    task: {
      ...task,
      topicIds: [...task.topicIds],
      prerequisiteIds: [...task.prerequisiteIds],
      ...(task.generation
        ? { generation: { ...task.generation, difficultyBands: [...task.generation.difficultyBands] } }
        : {}),
      ...(task.pacing ? { pacing: { ...task.pacing } } : {}),
      ...(task.curriculum ? { curriculum: { ...task.curriculum } } : {}),
    },
    question: {
      index: questionIndex,
      id: question.id,
      topicId: question.topicId,
      prompt: question.prompt,
      ...(question.generation ? { generation: { ...question.generation } } : {}),
      ...(question.provenance ? { provenance: { ...question.provenance } } : {}),
    },
  }
}

export function createGermanExerciseReportReference(
  session: GermanLearningSession,
  question: GermanGeneratedQuestion,
  questionIndex: number,
): GermanExerciseReportReference {
  return {
    version: EXERCISE_REPORT_VERSION,
    subjectId: "german",
    course: {
      courseKey: courseKeys.german,
      courseId: GERMAN_COURSE_ID,
      courseVersion: GERMAN_COURSE_VERSION,
      generatorId: GERMAN_COURSE_ID,
      generatorVersion: session.generatorVersion,
      corpusVersion: GERMAN_CORPUS_VERSION,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    },
    session: {
      kind: session.kind,
      lessonId: session.lessonId,
      topicId: session.topicId,
      ...(session.assessmentTopicIds
        ? { assessmentTopicIds: [...session.assessmentTopicIds] }
        : {}),
      excludedTemplateIdsByTopic: Object.fromEntries(
        Object.entries(session.excludedTemplateIdsByTopic).map(([topicId, templateIds]) => [
          topicId,
          [...templateIds],
        ]),
      ),
      generatorVersion: session.generatorVersion,
      seed: session.seed,
      questionCount: session.questionCount,
    },
    question: {
      index: questionIndex,
      id: question.id,
      topicId: question.topicId,
      familyId: question.familyId,
      difficultyBand: question.difficultyBand,
      scoringRuleId: germanScoringRuleForQuestion(question).id,
      templateId: question.templateId,
      seed: question.seed,
      prompt: question.prompt,
    },
  }
}

export function createGermanExamExerciseReportReference(
  exam: ActiveGermanExam,
  question: GermanGeneratedQuestion,
  questionIndex: number,
): GermanExerciseReportReference {
  return {
    version: EXERCISE_REPORT_VERSION,
    subjectId: "german",
    course: {
      courseKey: courseKeys.german,
      courseId: GERMAN_COURSE_ID,
      courseVersion: GERMAN_COURSE_VERSION,
      generatorId: GERMAN_COURSE_ID,
      generatorVersion: exam.generatorVersion,
      corpusVersion: GERMAN_CORPUS_VERSION,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    },
    session: {
      kind: "exam",
      topicId: question.topicId,
      seed: exam.seed,
      questionCount: GERMAN_EXAM_QUESTION_COUNT,
      blueprintVersion: exam.blueprintVersion,
      passageId: exam.passageId,
    },
    question: {
      index: questionIndex,
      id: question.id,
      topicId: question.topicId,
      familyId: question.familyId,
      difficultyBand: question.difficultyBand,
      scoringRuleId: germanScoringRuleForQuestion(question).id,
      templateId: question.templateId,
      seed: question.seed,
      prompt: question.prompt,
    },
  }
}

export function createGermanWritingExerciseReportReference(
  session: ActiveGermanWritingSession,
  prompt: GermanWritingPromptTemplate,
  promptIndex: number,
): GermanExerciseReportReference {
  const replayedPrompt = buildGermanWritingForm(session.seed).prompts[promptIndex]
  if (!replayedPrompt || replayedPrompt.id !== prompt.id) {
    throw new Error("German writing prompt does not belong to this reproducible form.")
  }
  return {
    version: EXERCISE_REPORT_VERSION,
    subjectId: "german",
    course: {
      courseKey: courseKeys.german,
      courseId: GERMAN_COURSE_ID,
      courseVersion: GERMAN_COURSE_VERSION,
      generatorId: GERMAN_COURSE_ID,
      generatorVersion: GERMAN_GENERATOR_VERSION,
      corpusVersion: GERMAN_CORPUS_VERSION,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    },
    session: {
      kind: "writing",
      topicId: "writing",
      seed: session.seed,
      questionCount: 3,
      blueprintVersion: session.blueprintVersion,
    },
    question: {
      index: promptIndex,
      id: germanWritingReportQuestionId(prompt, promptIndex),
      topicId: "writing",
      familyId: "writing-prompt",
      templateId: prompt.id,
      seed: session.seed,
      prompt: prompt.prompt,
    },
  }
}

export function createGermanComprehensionExerciseReportReference(
  session: ActiveGermanComprehensionSession,
  prompt: GermanComprehensionPrompt,
): GermanExerciseReportReference {
  const replayedPrompt = germanComprehensionPromptById(session.promptId)
  if (!replayedPrompt || replayedPrompt.id !== prompt.id) {
    throw new Error("German comprehension prompt does not belong to this reproducible session.")
  }
  return {
    version: EXERCISE_REPORT_VERSION,
    subjectId: "german",
    course: {
      courseKey: courseKeys.german,
      courseId: GERMAN_COURSE_ID,
      courseVersion: GERMAN_COURSE_VERSION,
      generatorId: GERMAN_COURSE_ID,
      generatorVersion: GERMAN_GENERATOR_VERSION,
      corpusVersion: GERMAN_CORPUS_VERSION,
      scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    },
    session: {
      kind: "comprehension",
      topicId: "reading-evidence",
      seed: session.seed,
      questionCount: 1,
      promptVersion: session.generatorVersion,
    },
    question: {
      index: 0,
      id: germanComprehensionReportQuestionId(prompt),
      topicId: "reading-evidence",
      familyId: "comprehension-response",
      templateId: prompt.id,
      seed: session.seed,
      prompt: prompt.question,
    },
  }
}

export function encodeExerciseReport(reference: ExerciseReportReference): string {
  return encodeBase64Url(JSON.stringify(reference))
}

export function decodeExerciseReport(encoded: string | undefined): ExerciseReportReference | undefined {
  if (!encoded || encoded.length > 100_000) return undefined
  try {
    const value: unknown = JSON.parse(decodeBase64Url(encoded))
    return isExerciseReportReference(value) ? value : undefined
  } catch {
    return undefined
  }
}

/**
 * Accept a report link that acquired harmless whitespace while being copied
 * into a message (for example, `?data =...`). The payload still has to pass
 * the full report-reference validation above.
 */
export function exerciseReportDataFromSearch(search: string): string | undefined {
  const parameters = new URLSearchParams(search)
  const direct = parameters.get("data")
  if (direct) return direct
  for (const [key, value] of parameters) {
    if (key.trim() === "data") return value.trim() || undefined
  }
  return undefined
}

export function buildExerciseReportUrl(
  reference: ExerciseReportReference,
  origin: string,
): string {
  const url = new URL("/exercise-report", origin)
  url.searchParams.set("data", encodeExerciseReport(reference))
  return url.toString()
}

export function buildCodexExerciseReport(
  reference: ExerciseReportReference,
  issue: string,
  reportUrl: string,
): string {
  if (isGermanExerciseReport(reference)) {
    const sessionDetails = reference.session.kind === "exam"
      ? [
          `- Exam blueprint version: ${reference.session.blueprintVersion}`,
          `- Passage ID: ${reference.session.passageId}`,
        ]
      : reference.session.kind === "writing"
        ? [`- Writing blueprint version: ${reference.session.blueprintVersion}`]
        : reference.session.kind === "comprehension"
          ? [`- Comprehension prompt version: ${reference.session.promptVersion}`]
        : [`- Lesson ID: ${reference.session.lessonId}`]
    const reproductionInstruction = reference.session.kind === "exam"
      ? "Please reproduce this from the versioned German exam metadata with `buildGermanExamBlueprint(seed)`, add a regression test, then fix the exam generator, grading, wording, option, or passage defect."
      : reference.session.kind === "writing"
        ? "Please reproduce this from the versioned German writing metadata with `buildGermanWritingForm(seed)`, add a regression test, then fix the prompt, requirements, wording, or presentation defect."
        : reference.session.kind === "comprehension"
          ? "Please reproduce this from the versioned German comprehension metadata with `germanComprehensionPromptById(templateId)`, add a regression test, then fix the prompt, passage, evidence guidance, wording, or presentation defect."
        : "Please reproduce this from the versioned German session metadata with `germanSessionQuestions(...)`, add a regression test, then fix the generator, grading, wording, option, or explanation defect."
    const assessmentDetails = reference.session.kind === "writing" || reference.session.kind === "comprehension"
      ? []
      : [
          `- Difficulty band: ${reference.question.difficultyBand ?? "legacy standard"}`,
          `- Scoring rule: ${reference.question.scoringRuleId ?? "legacy rule inferred during replay"}`,
        ]
    const privacyBoundary = reference.session.kind === "writing"
      ? "no learner name, title, plan, draft, checklist, or progress history"
      : reference.session.kind === "comprehension"
        ? "no learner name, response, selected evidence lines, reviewer feedback, or progress history"
      : "no learner name, selected option, typed answer, or progress history"
    return [
      "# GymiQuest exercise defect",
      "",
      `Report URL: ${reportUrl}`,
      `Problem reported: ${issue.trim() || "No description supplied."}`,
      "",
      "## Deterministic reproduction",
      "",
      "- Subject: German",
      `- Session kind: ${reference.session.kind}`,
      `- Curriculum package: ${reference.course.courseId}@${reference.course.courseVersion}`,
      `- Generator ID: ${reference.course.generatorId}`,
      `- Generator version: ${reference.course.generatorVersion}`,
      `- Corpus version: ${reference.course.corpusVersion}`,
      `- Scoring policy version: ${reference.course.scoringPolicyVersion}`,
      ...assessmentDetails,
      ...sessionDetails,
      `- Session seed: ${reference.session.seed}`,
      `- Generator family: ${reference.question.familyId}`,
      `- Generator template: ${reference.question.templateId}`,
      `- Question seed: ${reference.question.seed}`,
      `- Question index: ${reference.question.index}`,
      `- Question ID: ${reference.question.id}`,
      `- Topic ID: ${reference.question.topicId}`,
      `- Prompt shown: ${reference.question.prompt}`,
      "",
      "## Answer-free reproduction reference",
      "",
      "```json",
      JSON.stringify({ course: reference.course, session: reference.session, question: reference.question }, null, 2),
      "```",
      "",
      `${reproductionInstruction} The report intentionally contains ${privacyBoundary}.`,
    ].join("\n")
  }
  const difficulty = reference.question.generation?.difficultyBand ?? "unknown"
  const generatorVersion = reference.question.generation?.version ?? reference.task.generation?.version ?? "unknown"
  const curriculumPackage = resolveTaskCurriculumPackage(reference.task)
  const curriculumLabel = curriculumPackage
    ? `${curriculumPackage.courseId}@${curriculumPackage.version}`
    : "unknown"
  const generatorFamily = reference.question.provenance?.familyId ?? "legacy-or-core"
  const generatorTemplate = reference.question.provenance
    ? `${reference.question.provenance.templateId}@${reference.question.provenance.templateVersion}`
    : "unknown"
  return [
    "# GymiQuest exercise defect",
    "",
    `Report URL: ${reportUrl}`,
    `Problem reported: ${issue.trim() || "No description supplied."}`,
    "",
    "## Deterministic reproduction",
    "",
    `- Task ID: ${reference.task.id}`,
    `- Report context: ${isAuthorValidationTask(reference.task) ? "author validation lab" : "learner task"}`,
    `- Task kind: ${reference.task.kind}`,
    `- Curriculum package: ${curriculumLabel}`,
    `- Task seed: ${reference.task.seed}`,
    `- Generator version: ${generatorVersion}`,
    `- Generator family: ${generatorFamily}`,
    `- Generator template: ${generatorTemplate}`,
    `- Question index: ${reference.question.index}`,
    `- Question ID: ${reference.question.id}`,
    `- Topic ID: ${reference.question.topicId}`,
    `- Difficulty: ${difficulty}`,
    `- Prompt shown: ${reference.question.prompt}`,
    "",
    "## Task payload",
    "",
    "```json",
    JSON.stringify(reference.task, null, 2),
    "```",
    "",
    "Please reproduce this with `generateQuestionsForTask(task)`, add a regression test, then fix the generator, grading, wording, or explanation defect. The report intentionally contains no learner name, typed answer, or progress history.",
  ].join("\n")
}

export function exerciseReportFilename(reference: ExerciseReportReference): string {
  const safeTopic = reference.question.topicId.replace(/[^a-z0-9-]/gu, "-")
  return `gymiquest-report-${safeTopic}-${reference.question.index + 1}.md`
}
