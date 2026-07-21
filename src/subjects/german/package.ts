export const GERMAN_COURSE_ID = "zh-zap1-german" as const
export const GERMAN_COURSE_VERSION = 1 as const
export const GERMAN_LEGACY_GENERATOR_VERSION = 1 as const
export const GERMAN_EXPANDED_GENERATOR_VERSION = 2 as const
export const GERMAN_MATCHING_GENERATOR_VERSION = 3 as const
export const GERMAN_DIFFICULTY_GENERATOR_VERSION = 4 as const
export const GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION = 5 as const
export const GERMAN_MULTI_SELECT_GENERATOR_VERSION = 6 as const
export const GERMAN_GENERATOR_VERSION = 7 as const
export const germanGeneratorVersions = [
  GERMAN_LEGACY_GENERATOR_VERSION,
  GERMAN_EXPANDED_GENERATOR_VERSION,
  GERMAN_MATCHING_GENERATOR_VERSION,
  GERMAN_DIFFICULTY_GENERATOR_VERSION,
  GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION,
  GERMAN_MULTI_SELECT_GENERATOR_VERSION,
  GERMAN_GENERATOR_VERSION,
] as const
export type GermanGeneratorVersion = typeof germanGeneratorVersions[number]
export const GERMAN_CORPUS_VERSION = 1 as const
export const GERMAN_SCORING_POLICY_VERSION = 1 as const

export const germanTopicIds = [
  "reading-evidence",
  "vocabulary-context",
  "word-formation",
  "grammar-correction",
  "sentence-structure",
  "writing",
] as const

export type GermanTopicId = typeof germanTopicIds[number]

export const germanLessonIds = [
  "german-reading-evidence-v1",
  "german-vocabulary-context-v1",
  "german-word-formation-v1",
  "german-grammar-correction-v1",
  "german-sentence-structure-v1",
] as const

export type GermanLessonId = typeof germanLessonIds[number]

export const germanPilotTopicIds = [
  "reading-evidence",
  "vocabulary-context",
  "word-formation",
  "grammar-correction",
  "sentence-structure",
] as const satisfies readonly GermanTopicId[]

export type GermanPilotTopicId = typeof germanPilotTopicIds[number]

export const GERMAN_ASSESSMENT_ACTIVITY_ID = "german-assessment-v1" as const
export type GermanActivityId = GermanLessonId | typeof GERMAN_ASSESSMENT_ACTIVITY_ID

export const germanLessonIdByTopic: Record<GermanPilotTopicId, GermanLessonId> = Object.freeze({
  "reading-evidence": "german-reading-evidence-v1",
  "vocabulary-context": "german-vocabulary-context-v1",
  "word-formation": "german-word-formation-v1",
  "grammar-correction": "german-grammar-correction-v1",
  "sentence-structure": "german-sentence-structure-v1",
})

export const GERMAN_CURRICULUM_PACKAGE = Object.freeze({
  courseId: GERMAN_COURSE_ID,
  version: GERMAN_COURSE_VERSION,
  title: "Zürich ZAP1 Deutsch",
  shortTitle: "ZAP1 Deutsch · Zürich",
  generatorId: GERMAN_COURSE_ID,
  generatorVersion: GERMAN_GENERATOR_VERSION,
  corpusVersion: GERMAN_CORPUS_VERSION,
  scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
  topicIds: Object.freeze([...germanTopicIds]),
  assessment: Object.freeze({
    xpThreshold: 120,
    questionCount: 5,
    completionXp: 10,
  }),
  xp: Object.freeze({
    policyVersion: 1,
    lessonBaseXp: 20,
    lessonFlawlessBonusXp: 5,
    reviewXp: 6,
  }),
  exam: Object.freeze({
    languageExamMinutes: 45,
    writingMinutes: 60,
  }),
})
