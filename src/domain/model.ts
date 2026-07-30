import type { ArchivePracticeResult } from "./archivePractice"

export const topicIds = [
  "arithmetic-equations",
  "efficient-arithmetic",
  "mass-units",
  "fraction-of-quantity",
  "time-fractions",
  "speed-distance-time",
  "data-tables",
  "money-calculations",
  "proportional-revenue",
  "integer-combinations",
  "number-constraints",
  "area-fractions",
  "composite-areas",
  "tiling-costs",
  "reverse-fractions",
  "reverse-chains",
  "inverse-proportion",
  "changing-rates",
  "geometric-loci",
  "coordinate-transformations",
  "cube-nets",
  "spatial-rolling",
  "cuboid-surface",
] as const

export type TopicId = (typeof topicIds)[number]

/**
 * Languages with complete generated-training content. The app shell only
 * exposes a language after it is added here and its exercise templates are
 * covered by the generator locale tests.
 */
export const learningLocaleIds = ["en", "it", "es", "de"] as const

export type LearningLocale = (typeof learningLocaleIds)[number]

export type TaskKind = "lesson" | "review" | "assessment" | "repair" | "placement"

export type TaskPurpose =
  | "lesson-recovery"
  | "prerequisite-refresh"
  | "error-refresh"

export type TopicStatus = "locked" | "available" | "learning" | "mastered"

export const difficultyBandIds = ["foundation", "standard", "exam"] as const

export type DifficultyBand = (typeof difficultyBandIds)[number]

/**
 * Version 1 tasks did not persist a generation profile. Version 2 used a fixed
 * representative inside each band. Version 3 varies within the requested band.
 * Version 4 retains that variation and pins the full tetrahedron-orientation
 * template so older paused spatial tasks keep their original one-roll question.
 * Version 5 adds the first archive-informed expansion without changing stored
 * version 2-4 tasks. Version 6 adds five further recurring exam families while
 * preserving the exact version-5 dispatcher for paused and resumed work.
 */
export const generationVersionIds = [2, 3, 4, 5, 6] as const

export type GenerationVersion = (typeof generationVersionIds)[number]

export interface TaskGenerationProfile {
  version: GenerationVersion
  difficultyBands: DifficultyBand[]
}

export const lessonPacingModeIds = ["supported", "steady", "accelerated"] as const

export type LessonPacingMode = (typeof lessonPacingModeIds)[number]

export interface LessonPacingProfile {
  version: 1
  mode: LessonPacingMode
}

export interface QuestionGenerationRequest {
  version: GenerationVersion
  difficultyBand: DifficultyBand
}

export interface GeneratedQuestionProfile extends QuestionGenerationRequest {
  difficultyScore: number
  candidateCount: number
}

export const practiceDayIds = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export type PracticeDay = (typeof practiceDayIds)[number]
export type SessionMinutes = 10 | 15 | 20
export type LearnerHelpStyle = "concise" | "visual" | "story" | "step-by-step"
export type LearnerVisualMode = "calm" | "focus" | "high-contrast"
export type LearnerReadingMode = "standard" | "spacious"
export type GeometryControlSide = "right" | "left"

export interface LearnerPreferences {
  examDate?: string
  practiceDays: PracticeDay[]
  sessionMinutes: SessionMinutes
  helpStyle: LearnerHelpStyle
  visualMode: LearnerVisualMode
  readingMode: LearnerReadingMode
  geometryControlSide: GeometryControlSide
}

export interface TopicDefinition {
  id: TopicId
  title: string
  shortTitle: string
  description: string
  prerequisites: TopicId[]
  courseOrder: number
}

export interface LessonPage {
  eyebrow: string
  title: string
  body: string
  visual:
    | "balance"
    | "factor-pairs"
    | "mass-scale"
    | "fraction-forward"
    | "clock-fraction"
    | "motion-model"
    | "data-table"
    | "money-table"
    | "combination-grid"
    | "number-filter"
    | "tile-grid"
    | "area-cutout"
    | "fraction-backward"
    | "reverse-chain"
    | "supply-model"
    | "locus-map"
    | "coordinate-plane"
    | "cube-net"
    | "pyramid-roll"
    | "cuboid-net"
  steps: string[]
  takeaway: string
}

export interface LessonDefinition {
  id: string
  topicId: TopicId
  title: string
  goal: string
  pages: LessonPage[]
}

export interface TopicMastery {
  topicId: TopicId
  status: TopicStatus
  supportedMastery: number
  independentMastery: number
  retention: number
  reviewStage: number
  reviewIteration: number
  dueAt?: string
  /** Learner-chosen pause; unlike dueAt, this overrides inactivity reviews. */
  deferredUntil?: string
  masteredAt?: string
  lastReviewedAt?: string
  independentSuccesses: number
}

export interface TopicHelpRequest {
  topicId: TopicId
  requestedAt: string
}

export interface CurriculumPackageReference {
  courseId: string
  version: number
}

export interface LearningTask {
  id: string
  kind: TaskKind
  title: string
  description: string
  topicIds: TopicId[]
  prerequisiteIds: TopicId[]
  maxXp: number
  questionCount: number
  seed: string
  /**
   * Pins the exact wording of a started task. Older tasks omit it and replay
   * in the original German source language.
   */
  contentLocale?: LearningLocale
  /** Missing only on paused tasks created before curriculum package v1 was persisted. */
  curriculum?: CurriculumPackageReference
  purpose?: TaskPurpose
  generation?: TaskGenerationProfile
  /**
   * Present only on lessons whose length and next unseen difficulty are chosen
   * from recent performance. The task snapshot pins the decision for reloads.
   */
  pacing?: LessonPacingProfile
  dueAt?: string
  assessmentNumber?: number
}

export const questionDiagnosticKindIds = [
  "format",
  "unit-conversion",
  "fraction-structure",
  "incomplete-enumeration",
  "stopped-early",
  "coordinate-order",
  "construction-method",
  "construction-precision",
  "concept",
] as const

export type QuestionDiagnosticKind = (typeof questionDiagnosticKindIds)[number]

export const MAX_ASSESSMENT_SUBMITTED_ANSWER_LENGTH = 4_000

export interface QuestionDiagnosticEvidence {
  kind: QuestionDiagnosticKind
  title: string
  resolved: boolean
}

export interface QuestionResult {
  questionId: string
  topicId: TopicId
  attempts: number
  hintsUsed: number
  activeSeconds: number
  independentlySolved: boolean
  /**
   * Privacy-safe completion evidence. Older events omit this field, so a
   * debrief must treat their assisted outcome as not assessable rather than
   * guessing whether the final answer was eventually solved.
   */
  solved?: boolean
  /** Structured step ids only; learner-entered values are deliberately not retained. */
  verifiedStepIds?: string[]
  /**
   * A bounded answer snapshot retained only for silent checks so the learner can
   * compare a submitted mistake with the solution after the assessment ends.
   * Older results and ordinary lesson/review rounds omit it.
   */
  submittedAnswer?: string
  difficultyBand?: DifficultyBand
  diagnostic?: QuestionDiagnosticEvidence
}

export interface LearningEvent {
  id: string
  taskId: string
  taskKind: TaskKind
  taskPurpose?: TaskPurpose
  topicIds: TopicId[]
  completedAt: string
  activeSeconds: number
  mistakes: number
  hintsUsed: number
  independentlyCompleted: boolean
  questionResults: QuestionResult[]
}

export const learnerFeedbackKindIds = [
  "clear",
  "more-practice",
  "explanation-unclear",
  "question-unclear",
  "too-much",
] as const

export type LearnerFeedbackKind = (typeof learnerFeedbackKindIds)[number]

/**
 * A bounded, learner-authored signal captured after a completed round. It is
 * stored separately from mathematical evidence so it can guide explanations
 * and parent support without changing XP, mastery, grading, or review timing.
 */
export interface LearnerFeedback {
  id: string
  learningEventId: string
  taskId: string
  taskKind: TaskKind
  topicIds: TopicId[]
  kind: LearnerFeedbackKind
  recordedAt: string
}

export type MockSubmissionReason = "submitted" | "timeout"
export type MockGradeConfidence = "certain" | "manual"
export type MockExamSource = "generated" | "official-archive"

export interface OfficialMockReview {
  editionId: string
  rubricVersion: string
  status: "pending" | "complete"
  taskScores: Array<number | null>
  completedAt?: string
  gradeScaleId?: string
  mathematicsGrade?: number
}

export interface MockExamPartResult {
  partId: string
  taskId: string
  topicId: TopicId
  answer: string
  working: string
  milestoneAnswers?: Record<string, string>
  earnedMilestoneIds?: string[]
  answerCorrect: boolean
  methodRequired: boolean
  maxPoints: number
  certainPoints: number
  reviewablePoints: number
  confidence: MockGradeConfidence
}

export interface MockExamTaskResult {
  taskId: string
  taskNumber: number
  title: string
  maxPoints: number
  certainPoints: number
  reviewablePoints: number
  activeSeconds: number
  visitCount: number
  flagged: boolean
  parts: MockExamPartResult[]
}

export interface MockExamResult {
  id: string
  source?: MockExamSource
  title?: string
  editionId?: string
  rubricVersion?: string
  seed: string
  blueprintVersion: number
  contentLocale?: LearningLocale
  startedAt: string
  submittedAt: string
  submissionReason: MockSubmissionReason
  durationSeconds: number
  maxPoints: number
  certainPoints: number
  reviewablePoints: number
  taskResults: MockExamTaskResult[]
  recoveryTopicIds: TopicId[]
  officialReview?: OfficialMockReview
}

export type XPReason =
  | "lesson-flawless"
  | "lesson-full"
  | "lesson-partial"
  | "lesson-recovery"
  | "review-complete"
  | "repair-complete"
  | "assessment-complete"
  | "placement-complete"

export interface XPAward {
  id: string
  learnerId: string
  sourceEventId: string
  taskId: string
  taskKind: TaskKind
  /** Persisted for new awards so history can show earned XP against the offered task value. */
  maxXp?: number
  baseXp: number
  bonusXp: number
  totalXp: number
  reason: XPReason
  policyVersion: number
  countsTowardAssessment: boolean
  awardedAt: string
}

export interface LearnerState {
  schemaVersion: 12
  learnerId: string
  displayName: string
  courseId: string
  courseVersion: number
  createdAt: string
  updatedAt: string
  profileCompletedAt?: string
  placementCompletedAt?: string
  preferences: LearnerPreferences
  totalXp: number
  xpSinceAssessment: number
  assessmentThreshold: number
  assessmentNumber: number
  mastery: Record<TopicId, TopicMastery>
  topicHelpRequests: TopicHelpRequest[]
  learningEvents: LearningEvent[]
  learnerFeedback: LearnerFeedback[]
  xpLedger: XPAward[]
  completedTaskIds: string[]
  mockHistory: MockExamResult[]
  archivePracticeHistory: ArchivePracticeResult[]
}

export interface EngineResult {
  state: LearnerState
  award: XPAward
  assessmentUnlocked: boolean
}

export interface ChoiceOption {
  id: string
  label: string
}

export type QuestionResponse =
  | {
      kind: "number"
      value: number
      decimals: number
      unit?: string
    }
  | {
      kind: "fraction"
      numerator: number
      denominator: number
      requireSimplified: boolean
    }
  | {
      kind: "choice"
      value: string
      options: ChoiceOption[]
    }
  | {
      kind: "integer-set"
      values: number[]
    }
  | {
      kind: "integer-sequence"
      values: number[]
    }
  | {
      kind: "coordinate"
      x: number
      y: number
    }

export interface GeneratedQuestionProvenance {
  kind: "original-dynamic"
  familyId: string
  templateId: string
  templateVersion: number
}

export interface GeneratedQuestion {
  id: string
  topicId: TopicId
  prompt: string
  answerLabel: string
  response: QuestionResponse
  hint: string
  easierExplanation: string
  explanation: string
  workedSteps: string[]
  generation?: GeneratedQuestionProfile
  provenance?: GeneratedQuestionProvenance
  practiceSteps?: PracticeStep[]
  geometryConstruction?: GeometryConstructionSpec
  visual?: {
    kind:
      | "fraction-bar"
      | "mass-conversion"
      | "reverse-chain"
      | "equation-balance"
      | "factor-pairs"
      | "clock"
      | "motion-model"
      | "data-table"
      | "price-table"
      | "coin-combinations"
      | "number-filter"
      | "tile-grid"
      | "composite-area"
      | "supply"
      | "locus"
      | "coordinate-plane"
      | "cube-net"
      | "pyramid"
      | "cuboid"
      | "number-wall"
      | "number-line"
    numerator?: number
    denominator?: number
    fromValue?: number
    toValue?: number
    unit?: string
    labels?: string[]
    values?: number[]
    columns?: number
    rows?: number
    cells?: number[]
    arrows?: string[]
    variant?:
      | "sum"
      | "difference"
      | "average"
      | "catch-up"
      | "return-home"
      | "late-start"
      | "duration-price"
      | "missing-edge"
      | "relation-total"
      | "voxel-count"
      | "voxel-surface"
      | "recurring-cycles"
      | "number-wall-centre"
      | "number-wall-edge"
      | "fraction-midpoint"
      | "fraction-distance"
      | "greater"
      | "less"
      | "frame"
      | "corner"
      | "notch"
      | "complement"
      | "missing-average"
      | "group-total"
      | "unit-count"
      | "ratio-bundle"
      | "opposite-faces"
      | "reflect-x"
      | "reflect-y"
      | "reflect-origin"
      | "rotate-cw"
      | "rotate-ccw"
      | "translate"
  }
}

export interface PracticeStep {
  id: string
  label: string
  instruction: string
  value: number
  decimals: number
  unit?: string
  nextStep: string
}

export type GeometryConstructionTool = "parallel" | "circle" | "bisector"

export interface GeometryPoint {
  x: number
  y: number
  label: string
}

interface GeometryConstructionBase {
  expectedTool: GeometryConstructionTool
  width: number
  height: number
  pixelsPerCentimeter: number
  targetParameter: number
  initialParameter: number
  minParameter: number
  maxParameter: number
  snap: number
  tolerance: number
}

export interface ParallelConstructionSpec extends GeometryConstructionBase {
  expectedTool: "parallel"
  reference: {
    kind: "line"
    y: number
    label: string
    allowedSide: "north"
  }
  distanceCentimeters: number
}

export interface CircleConstructionSpec extends GeometryConstructionBase {
  expectedTool: "circle"
  reference: {
    kind: "point"
    point: GeometryPoint
  }
  distanceCentimeters: number
}

export interface BisectorConstructionSpec extends GeometryConstructionBase {
  expectedTool: "bisector"
  reference: {
    kind: "point-pair"
    first: GeometryPoint
    second: GeometryPoint
  }
}

export type GeometryConstructionSpec =
  | ParallelConstructionSpec
  | CircleConstructionSpec
  | BisectorConstructionSpec
