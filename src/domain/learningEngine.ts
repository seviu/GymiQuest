import { topics } from "./content"
import type { ArchivePracticeResult } from "./archivePractice"
import { isSecureAssessmentResult } from "./assessmentReport"
import {
  ACTIVE_CURRICULUM_PACKAGE,
  CURRICULUM_IDENTITY_SCHEMA_VERSION,
  curriculumPackageReference,
  requireLearnerCurriculumPackage,
  taskMatchesLearnerCurriculum,
} from "./curriculumPackage"
import { buildTaskGenerationProfile, reviewDifficultyBands } from "./difficulty"
import { buildLessonPacingPlan } from "./lessonPacing"
import {
  blendMasteryEvidence,
  clampMastery,
  lessonEvidenceIsSecure,
  lessonPerformanceMisses,
  observeTopicMastery,
  recoveryEvidenceIsSecure,
} from "./mastery"
import type {
  EngineResult,
  LearnerState,
  LearningEvent,
  LearningTask,
  MockExamResult,
  TopicId,
  TopicMastery,
  XPAward,
  XPReason,
} from "./model"
import {
  officialMathematicsGradeForEdition,
} from "./officialGradeScale"
import { defaultLearnerPreferences, normalizeLearnerPreferences } from "./studyPlan"

export const XP_POLICY_VERSION = ACTIVE_CURRICULUM_PACKAGE.xp.policyVersion
export const DEFAULT_ASSESSMENT_THRESHOLD = ACTIVE_CURRICULUM_PACKAGE.assessment.xpThreshold
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30, 60] as const
export const MAX_TOPIC_INACTIVITY_DAYS = 21
export const LIGHT_RECOVERY_BREAK_HOURS = 8
export const DEEP_RECOVERY_BREAK_HOURS = 24
export const ASSESSMENT_TOPIC_LIMIT = ACTIVE_CURRICULUM_PACKAGE.assessment.topicLimit
export const PLACEMENT_TOPIC_IDS: TopicId[] = [
  ...ACTIVE_CURRICULUM_PACKAGE.placement.topicIds,
]
export const PLACEMENT_QUESTION_COUNT = PLACEMENT_TOPIC_IDS.length

function addHours(date: Date, hours: number): string {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString()
}

function addDays(date: Date, days: number): string {
  return addHours(date, days * 24)
}

function validTimestamp(value: string | undefined): number | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : undefined
}

function copyMastery(mastery: LearnerState["mastery"]): LearnerState["mastery"] {
  return Object.fromEntries(
    Object.entries(mastery).map(([topicId, value]) => [topicId, { ...value }]),
  ) as LearnerState["mastery"]
}

function curriculumPackageFor(state: LearnerState) {
  return requireLearnerCurriculumPackage(state)
}

function curriculumTopics(state: LearnerState) {
  return curriculumPackageFor(state).topicIds.map((topicId) => topics[topicId])
}

function taskCurriculumFor(state: LearnerState) {
  return curriculumPackageReference(curriculumPackageFor(state))
}

function copyState(state: LearnerState): LearnerState {
  const topicHelpRequests = Array.isArray(
    (state as LearnerState & { topicHelpRequests?: LearnerState["topicHelpRequests"] }).topicHelpRequests,
  )
    ? (state as LearnerState & { topicHelpRequests: LearnerState["topicHelpRequests"] }).topicHelpRequests
        .filter((request) => Boolean(topics[request.topicId]) && Number.isFinite(Date.parse(request.requestedAt)))
        .map((request) => ({ ...request }))
    : []
  return {
    ...state,
    preferences: normalizeLearnerPreferences(
      (state as LearnerState & { preferences?: unknown }).preferences,
    ),
    mastery: copyMastery(state.mastery),
    topicHelpRequests,
    learningEvents: [...state.learningEvents],
    learnerFeedback: Array.isArray(state.learnerFeedback) ? [...state.learnerFeedback] : [],
    xpLedger: [...state.xpLedger],
    completedTaskIds: [...state.completedTaskIds],
    mockHistory: Array.isArray(state.mockHistory) ? [...state.mockHistory] : [],
    archivePracticeHistory: Array.isArray(state.archivePracticeHistory)
      ? state.archivePracticeHistory.map((result) => ({
          ...result,
          taskResults: result.taskResults.map((task) => ({ ...task })),
        }))
      : [],
  }
}

function makeMastery(
  topicId: TopicId,
  status: TopicMastery["status"],
  overrides: Partial<TopicMastery> = {},
): TopicMastery {
  return {
    topicId,
    status,
    supportedMastery: 0,
    independentMastery: 0,
    retention: 0,
    reviewStage: 0,
    reviewIteration: 0,
    independentSuccesses: 0,
    ...overrides,
  }
}

export function createInitialLearner(
  now = new Date(),
  curriculumPackage = ACTIVE_CURRICULUM_PACKAGE,
): LearnerState {
  const timestamp = now.toISOString()
  const mastery = Object.fromEntries(
    curriculumPackage.topicIds.map((topicId) => [topicId, makeMastery(topicId, "locked")]),
  ) as LearnerState["mastery"]

  return {
    schemaVersion: CURRICULUM_IDENTITY_SCHEMA_VERSION,
    learnerId: "local-learner",
    displayName: "Lernende",
    courseId: curriculumPackage.courseId,
    courseVersion: curriculumPackage.version,
    createdAt: timestamp,
    updatedAt: timestamp,
    preferences: {
      ...defaultLearnerPreferences,
      practiceDays: [...defaultLearnerPreferences.practiceDays],
    },
    totalXp: 0,
    xpSinceAssessment: 0,
    assessmentThreshold: curriculumPackage.assessment.xpThreshold,
    assessmentNumber: 1,
    mastery,
    topicHelpRequests: [],
    learningEvents: [],
    learnerFeedback: [],
    xpLedger: [],
    completedTaskIds: [],
    mockHistory: [],
    archivePracticeHistory: [],
  }
}

/**
 * Stable evidence-rich fixture for domain tests and product demos. The live app
 * always starts with createInitialLearner and therefore never assumes mastery.
 */
export function createSeededLearner(now = new Date()): LearnerState {
  const state = createInitialLearner(now)
  const timestamp = now.toISOString()
  state.placementCompletedAt = timestamp
  state.profileCompletedAt = timestamp
  state.mastery["mass-units"] = makeMastery("mass-units", "mastered", {
    supportedMastery: 0.78,
    independentMastery: 0.64,
    retention: 0.68,
    dueAt: timestamp,
    masteredAt: addDays(now, -5),
    independentSuccesses: 1,
  })
  state.mastery["fraction-of-quantity"] = makeMastery("fraction-of-quantity", "mastered", {
    supportedMastery: 0.76,
    independentMastery: 0.61,
    retention: 0.64,
    dueAt: timestamp,
    masteredAt: addDays(now, -4),
    independentSuccesses: 1,
  })
  return refreshTopicAvailability(state)
}

export function migrateLearnerState(state: LearnerState): LearnerState {
  const sourceVersion = Number(
    (state as LearnerState & { schemaVersion?: number }).schemaVersion ?? 1,
  )
  const curriculumPackage = requireLearnerCurriculumPackage(state)
  const next = copyState(state)
  const existingMastery = next.mastery as Partial<Record<TopicId, TopicMastery>>

  for (const topicId of curriculumPackage.topicIds) {
    if (!existingMastery[topicId]) {
      existingMastery[topicId] = makeMastery(topicId, "locked")
    }
    const mastery = existingMastery[topicId]!
    if (!Number.isFinite(mastery.supportedMastery)) {
      mastery.supportedMastery = mastery.status === "mastered"
        ? clampMastery(Math.max(0.65, mastery.retention))
        : 0
    }
    if (!Number.isFinite(mastery.independentMastery)) {
      mastery.independentMastery = mastery.status === "mastered"
        ? clampMastery(
            mastery.independentSuccesses > 0
              ? Math.max(0.55, mastery.retention * 0.9)
              : 0.45,
          )
        : 0
    }
  }

  next.mastery = existingMastery as LearnerState["mastery"]
  if (sourceVersion < 3 && !next.placementCompletedAt) {
    // Existing profiles already contain authored mastery and learning history;
    // onboarding them again would overwrite legitimate evidence.
    next.placementCompletedAt = next.createdAt
  }
  next.mockHistory = Array.isArray(
    (state as LearnerState & { mockHistory?: MockExamResult[] }).mockHistory,
  )
    ? (state as LearnerState & { mockHistory: MockExamResult[] }).mockHistory.map((result) => {
      if (
        result.source !== "official-archive" ||
        result.officialReview?.status !== "complete" ||
        result.officialReview.mathematicsGrade !== undefined ||
        !Number.isInteger(result.certainPoints) ||
        result.certainPoints < 0 ||
        result.certainPoints > 36
      ) {
        return result
      }
      const grade = officialMathematicsGradeForEdition(result.editionId, result.certainPoints)
      if (!grade) return result
      return {
        ...result,
        officialReview: {
          ...result.officialReview,
          ...grade,
        },
      }
    })
    : []
  next.archivePracticeHistory = Array.isArray(
    (state as LearnerState & { archivePracticeHistory?: ArchivePracticeResult[] }).archivePracticeHistory,
  )
    ? (state as LearnerState & { archivePracticeHistory: ArchivePracticeResult[] })
        .archivePracticeHistory
        .map((result) => ({
          ...result,
          taskResults: result.taskResults.map((task) => ({ ...task })),
        }))
    : []
  next.preferences = normalizeLearnerPreferences(
    (state as LearnerState & { preferences?: unknown }).preferences,
  )
  next.learnerFeedback = Array.isArray(
    (state as LearnerState & { learnerFeedback?: LearnerState["learnerFeedback"] }).learnerFeedback,
  )
    ? [...(state as LearnerState & { learnerFeedback: LearnerState["learnerFeedback"] }).learnerFeedback]
    : []
  const seenHelpTopics = new Set<TopicId>()
  next.topicHelpRequests = next.topicHelpRequests.filter((request) => {
    if (seenHelpTopics.has(request.topicId)) return false
    seenHelpTopics.add(request.topicId)
    return true
  })
  if (
    sourceVersion < 5 &&
    !next.profileCompletedAt &&
    (next.placementCompletedAt || next.learningEvents.length > 0)
  ) {
    next.profileCompletedAt = next.createdAt
  }
  next.courseId = curriculumPackage.courseId
  next.courseVersion = curriculumPackage.version
  next.assessmentThreshold = curriculumPackage.assessment.xpThreshold
  next.schemaVersion = CURRICULUM_IDENTITY_SCHEMA_VERSION
  return refreshTopicAvailability(next)
}

export function topicNeedsTeacherSupport(
  state: LearnerState,
  topicId: TopicId,
): boolean {
  return Array.isArray(state.topicHelpRequests) && state.topicHelpRequests.some(
    (request) => request.topicId === topicId,
  )
}

export function requestTeacherSupport(
  state: LearnerState,
  topicId: TopicId,
  now = new Date(),
): LearnerState {
  if (topicNeedsTeacherSupport(state, topicId)) return state
  const next = copyState(state)
  const timestamp = now.toISOString()
  next.topicHelpRequests.push({ topicId, requestedAt: timestamp })
  next.updatedAt = timestamp
  return next
}

export function resolveTeacherSupport(
  state: LearnerState,
  topicId: TopicId,
  now = new Date(),
): LearnerState {
  if (!topicNeedsTeacherSupport(state, topicId)) return state
  const next = copyState(state)
  next.topicHelpRequests = next.topicHelpRequests.filter(
    (request) => request.topicId !== topicId,
  )
  next.updatedAt = now.toISOString()
  return next
}

/**
 * Stores a strict mock separately from XP and periodic assessments. Only
 * certainly graded structured evidence changes mastery automatically; written
 * methods awaiting human review never silently become mastery evidence.
 */
export function recordMockExamResult(
  state: LearnerState,
  result: MockExamResult,
): LearnerState {
  if (state.mockHistory.some((entry) => entry.id === result.id)) return state

  const next = copyState(state)
  const completedAt = new Date(result.submittedAt)

  if (result.source === "official-archive" && result.officialReview?.status === "pending") {
    next.mockHistory.push(result)
    next.updatedAt = result.submittedAt
    return refreshTopicAvailability(next)
  }

  for (const task of result.taskResults) {
    for (const part of task.parts) {
      const mastery = next.mastery[part.topicId]
      if (mastery.status !== "mastered") continue

      if (part.answerCorrect && part.confidence === "certain") {
        mastery.retention = Math.min(1, mastery.retention + 0.05)
        mastery.supportedMastery = clampMastery(
          mastery.supportedMastery + (1 - mastery.supportedMastery) * 0.06,
        )
        mastery.independentMastery = clampMastery(
          mastery.independentMastery + (1 - mastery.independentMastery) * 0.08,
        )
        mastery.independentSuccesses += 1
        continue
      }

      if (!part.answerCorrect) {
        mastery.retention = Math.max(0.2, mastery.retention - 0.15)
        mastery.supportedMastery = clampMastery(mastery.supportedMastery * 0.96)
        mastery.independentMastery = clampMastery(mastery.independentMastery * 0.84)
        mastery.reviewStage = Math.max(0, mastery.reviewStage - 1)
        mastery.reviewIteration += 1
        mastery.dueAt = completedAt.toISOString()
      }
    }
  }

  next.mockHistory.push(result)
  next.updatedAt = result.submittedAt
  return refreshTopicAvailability(next)
}

/**
 * Replaces a pending official replay with its rubric-reviewed result. Low-scoring
 * topics become due review evidence, while XP and assessment cadence stay intact.
 */
export function recordOfficialMockReview(
  state: LearnerState,
  result: MockExamResult,
): LearnerState {
  if (result.source !== "official-archive" || result.officialReview?.status !== "complete") {
    throw new Error("Only a completed official correction can be recorded here.")
  }
  const index = state.mockHistory.findIndex((entry) => entry.id === result.id)
  if (index < 0) throw new Error("The submitted official replay is missing from history.")
  if (state.mockHistory[index]?.officialReview?.status === "complete") return state

  const next = copyState(state)
  next.mockHistory[index] = result
  const completedAt = result.officialReview.completedAt ?? result.submittedAt
  for (const topicId of result.recoveryTopicIds) {
    const mastery = next.mastery[topicId]
    if (mastery.status !== "mastered") continue
    mastery.retention = Math.max(0.2, mastery.retention - 0.15)
    mastery.supportedMastery = clampMastery(mastery.supportedMastery * 0.96)
    mastery.independentMastery = clampMastery(mastery.independentMastery * 0.84)
    mastery.reviewStage = Math.max(0, mastery.reviewStage - 1)
    mastery.reviewIteration += 1
    mastery.dueAt = completedAt
  }
  next.updatedAt = completedAt
  return refreshTopicAvailability(next)
}

/**
 * Stores a source-only archive self-review as history evidence only. The result
 * has no score, grade, XP, topic mapping, or mastery signal by construction.
 */
export function recordArchivePracticeResult(
  state: LearnerState,
  result: ArchivePracticeResult,
): LearnerState {
  if (state.archivePracticeHistory.some((entry) => entry.id === result.id)) return state
  const next = copyState(state)
  next.archivePracticeHistory.push(result)
  next.updatedAt = result.completedAt
  return next
}

export function buildPlacementTask(state: LearnerState): LearningTask {
  if (state.placementCompletedAt) {
    throw new Error("Placement has already been completed.")
  }
  const placementTopicIds = curriculumPackageFor(state).placement.topicIds
  return {
    id: `placement:${state.learnerId}:v2`,
    kind: "placement",
    title: "Dein kurzer Start-Check",
    description: "Neun gemischte Aufgaben finden einen passenden Startpunkt ohne Note und ohne XP.",
    topicIds: [...placementTopicIds],
    prerequisiteIds: [],
    maxXp: 0,
    questionCount: placementTopicIds.length,
    seed: `placement:${state.learnerId}:v2`,
    curriculum: taskCurriculumFor(state),
    generation: buildTaskGenerationProfile(
      placementTopicIds.map(() => "standard"),
    ),
  }
}

export function completePlacementWithoutCheck(
  state: LearnerState,
  now = new Date(),
): LearnerState {
  const next = copyState(state)
  next.placementCompletedAt = now.toISOString()
  next.updatedAt = now.toISOString()
  return refreshTopicAvailability(next)
}

function prerequisitesMastered(state: LearnerState, topicId: TopicId): boolean {
  return topics[topicId].prerequisites.every(
    (prerequisiteId) => state.mastery[prerequisiteId].status === "mastered",
  )
}

export function isCurriculumMastered(state: LearnerState): boolean {
  return curriculumTopics(state).every(
    (topic) => state.mastery[topic.id].status === "mastered",
  )
}

export function refreshTopicAvailability(state: LearnerState): LearnerState {
  const next = copyState(state)

  for (const topic of curriculumTopics(state)) {
    const mastery = next.mastery[topic.id]
    if (mastery.status === "mastered") continue
    if (mastery.status === "learning" && prerequisitesMastered(next, topic.id)) continue
    mastery.status = prerequisitesMastered(next, topic.id) ? "available" : "locked"
  }

  return next
}

interface AssessmentTopicHistory {
  appearances: number
  lastAssessedAt?: string
}

function assessmentHistory(
  state: LearnerState,
): Map<TopicId, AssessmentTopicHistory> {
  const history = new Map<TopicId, AssessmentTopicHistory>()

  for (const event of state.learningEvents) {
    if (event.taskKind !== "assessment") continue
    for (const topicId of event.topicIds) {
      const previous = history.get(topicId)
      history.set(topicId, {
        appearances: (previous?.appearances ?? 0) + 1,
        lastAssessedAt: !previous?.lastAssessedAt || event.completedAt > previous.lastAssessedAt
          ? event.completedAt
          : previous.lastAssessedAt,
      })
    }
  }

  return history
}

/**
 * Periodic checks first complete a broad coverage pass over mastered topics.
 * Once every topic has appeared, up to three fragile topics are sampled again
 * and the remaining places go to the topics checked least recently. This keeps
 * the assessment adaptive without allowing one weak topic to crowd out the
 * rest of the curriculum indefinitely.
 */
export function selectAssessmentTopicIds(state: LearnerState): TopicId[] {
  const assessmentPolicy = curriculumPackageFor(state).assessment
  const masteredTopicIds = curriculumTopics(state)
    .map((topic) => topic.id)
    .filter((topicId) => (
      state.mastery[topicId].status === "mastered" &&
      !topicNeedsTeacherSupport(state, topicId)
    ))

  if (masteredTopicIds.length <= assessmentPolicy.topicLimit) return masteredTopicIds

  const history = assessmentHistory(state)
  const courseIndex = new Map(
    curriculumTopics(state).map((topic, index) => [topic.id, index] as const),
  )
  const rotationStart = (
    (state.assessmentNumber - 1) * assessmentPolicy.topicLimit
  ) % masteredTopicIds.length
  const rotationRank = (topicId: TopicId): number => {
    const index = courseIndex.get(topicId) ?? 0
    return (index - rotationStart + masteredTopicIds.length) % masteredTopicIds.length
  }
  const compareFragility = (left: TopicId, right: TopicId): number => {
    const leftMastery = state.mastery[left]
    const rightMastery = state.mastery[right]
    return (
      leftMastery.independentMastery - rightMastery.independentMastery ||
      leftMastery.retention - rightMastery.retention ||
      leftMastery.independentSuccesses - rightMastery.independentSuccesses ||
      leftMastery.reviewStage - rightMastery.reviewStage ||
      rotationRank(left) - rotationRank(right)
    )
  }

  const unseen = masteredTopicIds
    .filter((topicId) => !history.has(topicId))
    .sort(compareFragility)
  const selected = unseen.slice(0, assessmentPolicy.topicLimit)
  if (selected.length === assessmentPolicy.topicLimit) return selected

  const selectedIds = new Set(selected)
  const seenCandidates = masteredTopicIds.filter(
    (topicId) => history.has(topicId) && !selectedIds.has(topicId),
  )
  const remainingPlaces = assessmentPolicy.topicLimit - selected.length
  const focusCount = Math.min(assessmentPolicy.fragileTopicLimit, remainingPlaces)
  const focusTopics = [...seenCandidates]
    .sort(compareFragility)
    .slice(0, focusCount)

  for (const topicId of focusTopics) {
    selected.push(topicId)
    selectedIds.add(topicId)
  }

  const compareCoverage = (left: TopicId, right: TopicId): number => {
    const leftAt = history.get(left)?.lastAssessedAt ?? ""
    const rightAt = history.get(right)?.lastAssessedAt ?? ""
    return (
      leftAt.localeCompare(rightAt) ||
      compareFragility(left, right) ||
      rotationRank(left) - rotationRank(right)
    )
  }
  const coverageTopics = seenCandidates
    .filter((topicId) => !selectedIds.has(topicId))
    .sort(compareCoverage)

  selected.push(...coverageTopics.slice(0, assessmentPolicy.topicLimit - selected.length))
  return selected
}

function assessmentTask(state: LearnerState): LearningTask | undefined {
  if (state.xpSinceAssessment < state.assessmentThreshold) return undefined

  const topicIds = selectAssessmentTopicIds(state)
  if (topicIds.length === 0) return undefined
  const questionCount = Math.max(6, topicIds.length)

  return {
    id: `assessment:${state.assessmentNumber}`,
    kind: "assessment",
    title: `Standortbestimmung ${state.assessmentNumber}`,
    description: "Eine gemischte Standortbestimmung prüft neue Bereiche und fragile Themen, ohne den restlichen Lernpfad zu vergessen.",
    topicIds,
    prerequisiteIds: [],
    maxXp: curriculumPackageFor(state).xp.assessmentMaxXp,
    questionCount,
    seed: `assessment:${state.learnerId}:${state.assessmentNumber}`,
    curriculum: taskCurriculumFor(state),
    generation: buildTaskGenerationProfile(
      Array.from({ length: questionCount }, () => "exam"),
    ),
    assessmentNumber: state.assessmentNumber,
  }
}

function latestTopicPracticeTimestamp(
  state: LearnerState,
  topicId: TopicId,
): number {
  const mastery = state.mastery[topicId]
  const mockPracticeTimestamps = state.mockHistory
    .filter((result) => result.taskResults.some((task) => task.parts.some((part) => (
      part.topicId === topicId &&
      (
        part.answer.trim().length > 0 ||
        part.working.trim().length > 0 ||
        Object.values(part.milestoneAnswers ?? {}).some((answer) => answer.trim().length > 0)
      )
    ))))
    .map((result) => validTimestamp(result.submittedAt))
  const evidenceTimestamps = [
    validTimestamp(mastery.masteredAt),
    validTimestamp(mastery.lastReviewedAt),
    ...state.learningEvents
      .filter((event) => event.topicIds.includes(topicId))
      .map((event) => validTimestamp(event.completedAt)),
    ...mockPracticeTimestamps,
  ].filter((timestamp): timestamp is number => timestamp !== undefined)

  if (evidenceTimestamps.length > 0) return Math.max(...evidenceTimestamps)
  return validTimestamp(state.createdAt) ?? 0
}

function inactivityReviewTimestamp(
  state: LearnerState,
  topicId: TopicId,
): number {
  return latestTopicPracticeTimestamp(state, topicId) +
    MAX_TOPIC_INACTIVITY_DAYS * 24 * 60 * 60 * 1_000
}

function effectiveReviewTimestamp(
  state: LearnerState,
  topicId: TopicId,
): number {
  const scheduledTimestamp = validTimestamp(state.mastery[topicId].dueAt)
  const inactivityTimestamp = inactivityReviewTimestamp(state, topicId)
  return scheduledTimestamp === undefined
    ? inactivityTimestamp
    : Math.min(scheduledTimestamp, inactivityTimestamp)
}

function topicIsNeglected(
  state: LearnerState,
  topicId: TopicId,
  now: Date,
): boolean {
  return inactivityReviewTimestamp(state, topicId) <= now.getTime()
}

function dueReviewTasks(state: LearnerState, now: Date): LearningTask[] {
  return curriculumTopics(state)
    .filter((topic) => {
      const mastery = state.mastery[topic.id]
      return (
        !topicNeedsTeacherSupport(state, topic.id) &&
        mastery.status === "mastered" &&
        effectiveReviewTimestamp(state, topic.id) <= now.getTime()
      )
    })
    .sort((left, right) => {
      const neglectDifference =
        Number(topicIsNeglected(state, right.id, now)) -
        Number(topicIsNeglected(state, left.id, now))
      if (neglectDifference !== 0) return neglectDifference
      return effectiveReviewTimestamp(state, left.id) -
        effectiveReviewTimestamp(state, right.id)
    })
    .map((topic) => {
      const mastery = state.mastery[topic.id]
      const neglected = topicIsNeglected(state, topic.id, now)
      const dueAt = new Date(effectiveReviewTimestamp(state, topic.id)).toISOString()
      return {
        id: `review:${topic.id}:${mastery.reviewIteration}`,
        kind: "review" as const,
        title: topic.title,
        description: neglected
          ? "Auffrischung nach längerer Pause: neue Zahlen, vertraute mathematische Idee."
          : "Fällige Wiederholung mit neuen Zahlen und derselben mathematischen Idee.",
        topicIds: [topic.id],
        prerequisiteIds: topic.prerequisites,
        maxXp: curriculumPackageFor(state).xp.reviewByTopic[topic.id],
        questionCount: 2,
        seed: `review:${state.learnerId}:${topic.id}:${mastery.reviewIteration}`,
        curriculum: taskCurriculumFor(state),
        generation: buildTaskGenerationProfile(reviewDifficultyBands(mastery)),
        dueAt,
      }
    })
}

function lessonTaskForTopic(state: LearnerState, topicId: TopicId): LearningTask {
  const topic = topics[topicId]
  const pacing = buildLessonPacingPlan(state, [topicId, ...topic.prerequisites])
  return {
    id: `lesson:${topic.id}`,
    kind: "lesson",
    title: topic.title,
    description: topic.description,
    topicIds: [topic.id],
    prerequisiteIds: topic.prerequisites,
    maxXp: curriculumPackageFor(state).xp.lessonMaxXp,
    questionCount: pacing.difficultyBands.length,
    seed: `lesson:${state.learnerId}:${topic.id}`,
    curriculum: taskCurriculumFor(state),
    generation: buildTaskGenerationProfile(pacing.difficultyBands),
    pacing: pacing.profile,
  }
}

function latestLessonRecoveryEvidence(
  state: LearnerState,
  topicId: TopicId,
): LearningEvent | undefined {
  return state.learningEvents
    .filter((event) => (
      event.topicIds.includes(topicId) &&
      (event.taskKind === "lesson" || event.taskPurpose === "lesson-recovery")
    ))
    .sort((left, right) => (
      (validTimestamp(right.completedAt) ?? 0) - (validTimestamp(left.completedAt) ?? 0)
    ))[0]
}

function lessonRecoveryReadyTimestamp(
  state: LearnerState,
  topicId: TopicId,
): number {
  const evidence = latestLessonRecoveryEvidence(state, topicId)
  if (!evidence) return 0
  const completedAt = validTimestamp(evidence.completedAt) ?? 0
  const breakHours = evidence.mistakes >= 2 || evidence.hintsUsed > 0
    ? DEEP_RECOVERY_BREAK_HOURS
    : LIGHT_RECOVERY_BREAK_HOURS
  return completedAt + breakHours * 60 * 60 * 1_000
}

function lessonRecoveryTaskForTopic(state: LearnerState, topicId: TopicId): LearningTask {
  const topic = topics[topicId]
  const taskPrefix = `lesson-recovery:${topicId}:`
  const sequence = state.learningEvents.filter((event) => event.taskId.startsWith(taskPrefix)).length
  const latestEvidence = latestLessonRecoveryEvidence(state, topicId)
  const readyTimestamp = lessonRecoveryReadyTimestamp(state, topicId)
  const needsGentleReturn = Boolean(
    latestEvidence &&
    (latestEvidence.mistakes >= 2 || latestEvidence.hintsUsed > 0),
  )
  return {
    id: `${taskPrefix}${sequence}`,
    kind: "repair",
    purpose: "lesson-recovery",
    title: `Sicherungsrunde: ${topic.shortTitle}`,
    description: "Nach einer kurzen Pause festigen zwei neue Aufgaben dieselbe Idee mit frischen Zahlen. Deine bisherigen XP bleiben erhalten.",
    topicIds: [topicId],
    prerequisiteIds: topic.prerequisites,
    maxXp: curriculumPackageFor(state).xp.reviewByTopic[topicId],
    questionCount: 2,
    seed: `lesson-recovery:${state.learnerId}:${topicId}:${sequence}`,
    curriculum: taskCurriculumFor(state),
    generation: buildTaskGenerationProfile(
      needsGentleReturn ? ["foundation", "standard"] : ["standard", "exam"],
    ),
    dueAt: readyTimestamp > 0 ? new Date(readyTimestamp).toISOString() : undefined,
  }
}

function nextLessonTask(state: LearnerState, now: Date): LearningTask | undefined {
  const learningTopic = curriculumTopics(state)
    .filter((candidate) => (
      state.mastery[candidate.id].status === "learning" &&
      !topicNeedsTeacherSupport(state, candidate.id) &&
      lessonRecoveryReadyTimestamp(state, candidate.id) <= now.getTime()
    ))
    .sort((left, right) => (
      lessonRecoveryReadyTimestamp(state, left.id) -
      lessonRecoveryReadyTimestamp(state, right.id)
    ))[0]
  if (learningTopic) return lessonRecoveryTaskForTopic(state, learningTopic.id)

  const topic = curriculumTopics(state).find(
    (candidate) => (
      state.mastery[candidate.id].status === "available" &&
      !topicNeedsTeacherSupport(state, candidate.id)
    ),
  )
  return topic ? lessonTaskForTopic(state, topic.id) : undefined
}

/**
 * Opens a specific lesson from the curriculum path. The learner may choose
 * among all prerequisite-ready topics, but cannot bypass a locked topic or a
 * currently due assessment. A topic already in progress opens its focused
 * securing round instead of replaying the authored lesson pages.
 */
export function buildTopicLesson(
  state: LearnerState,
  topicId: TopicId,
): LearningTask {
  if (!state.placementCompletedAt) {
    throw new Error("Complete placement before starting a lesson.")
  }
  if (topicNeedsTeacherSupport(state, topicId)) {
    throw new Error("This topic is paused for teacher support.")
  }
  const current = refreshTopicAvailability(state)
  if (assessmentTask(current)) {
    throw new Error("Complete the current assessment before starting a new lesson.")
  }
  if (current.mastery[topicId].status === "learning") {
    return lessonRecoveryTaskForTopic(current, topicId)
  }
  if (current.mastery[topicId].status !== "available") {
    throw new Error("This lesson is not currently available.")
  }
  return lessonTaskForTopic(current, topicId)
}

/**
 * Mastery decides which work is assigned. XP never makes a task easier and is
 * not used to suppress legitimate reviews; reviews simply carry smaller awards.
 */
export function buildAssignments(state: LearnerState, now = new Date()): LearningTask[] {
  if (!state.placementCompletedAt) return []
  const current = refreshTopicAvailability(state)
  const assessment = assessmentTask(current)
  if (assessment && !current.completedTaskIds.includes(assessment.id)) {
    return [assessment]
  }

  const result: LearningTask[] = []
  const lesson = nextLessonTask(current, now)
  const reviews = dueReviewTasks(current, now)
  const neglectedReview = reviews.find((task) => (
    topicIsNeglected(current, task.topicIds[0]!, now)
  ))

  if (neglectedReview) result.push(neglectedReview)
  if (lesson) result.push(lesson)
  result.push(...reviews.filter((task) => task.id !== neglectedReview?.id))

  return result.filter((task) => !current.completedTaskIds.includes(task.id))
}

export function buildPrerequisiteRefresh(
  state: LearnerState,
  topicId: TopicId,
): LearningTask {
  if (!state.placementCompletedAt) {
    throw new Error("Complete placement before starting a refresh.")
  }
  if (topicNeedsTeacherSupport(state, topicId)) {
    throw new Error("This topic is paused for teacher support.")
  }
  const topic = topics[topicId]
  const sequence = state.learningEvents.filter(
    (event) => event.taskKind === "repair" && event.topicIds.includes(topicId),
  ).length

  return {
    id: `repair:${topicId}:${sequence}`,
    kind: "repair",
    title: `Auffrischung: ${topic.shortTitle}`,
    description: "Besuche die Voraussetzung mit neuen Aufgaben, bevor du weiterlernst.",
    topicIds: [topicId],
    prerequisiteIds: topic.prerequisites,
    maxXp: curriculumPackageFor(state).xp.reviewByTopic[topicId],
    questionCount: 2,
    seed: `repair:${state.learnerId}:${topicId}:${sequence}`,
    curriculum: taskCurriculumFor(state),
    purpose: "prerequisite-refresh",
    generation: buildTaskGenerationProfile(["foundation", "standard"]),
  }
}

export function buildErrorRefresh(
  state: LearnerState,
  topicId: TopicId,
): LearningTask {
  if (!state.placementCompletedAt) {
    throw new Error("Complete placement before starting an error refresh.")
  }
  if (topicNeedsTeacherSupport(state, topicId)) {
    throw new Error("This topic is paused for teacher support.")
  }
  const current = refreshTopicAvailability(state)
  if (assessmentTask(current)) {
    throw new Error("Complete the current assessment before starting an error refresh.")
  }
  const topic = topics[topicId]
  const sequence = state.learningEvents.filter(
    (event) => event.taskKind === "repair" && event.topicIds.includes(topicId),
  ).length

  return {
    id: `error-repair:${topicId}:${sequence}`,
    kind: "repair",
    title: `Mit neuen Zahlen: ${topic.shortTitle}`,
    description: "Gezielte Auffrischung aus deinem Fehlerkompass – gleiche Idee, neue Aufgabe.",
    topicIds: [topicId],
    prerequisiteIds: topic.prerequisites,
    maxXp: curriculumPackageFor(state).xp.reviewByTopic[topicId],
    questionCount: 2,
    seed: `error-repair:${state.learnerId}:${topicId}:${sequence}`,
    curriculum: taskCurriculumFor(state),
    purpose: "error-refresh",
    generation: buildTaskGenerationProfile(["standard", "exam"]),
  }
}

function lessonXp(state: LearnerState, task: LearningTask, event: LearningEvent): {
  baseXp: number
  bonusXp: number
  reason: XPReason
} {
  const performanceMisses = lessonPerformanceMisses(event)
  const policy = curriculumPackageFor(state).xp.lessonMistakePolicy

  if (performanceMisses === 0) {
    return {
      baseXp: task.maxXp,
      bonusXp: Math.round(task.maxXp * policy.perfectBonusRate),
      reason: "lesson-flawless",
    }
  }
  if (performanceMisses <= policy.fullXpMaxMistakes) {
    return { baseXp: task.maxXp, bonusXp: 0, reason: "lesson-full" }
  }
  if (performanceMisses <= policy.noXpAfterMistakes) {
    const deductionSteps = performanceMisses - policy.fullXpMaxMistakes
    const multiplier = Math.max(
      0,
      1 - deductionSteps * policy.deductionRatePerAdditionalMistake,
    )
    return { baseXp: Math.round(task.maxXp * multiplier), bonusXp: 0, reason: "lesson-partial" }
  }
  return { baseXp: 0, bonusXp: 0, reason: "lesson-recovery" }
}

function createAward(
  state: LearnerState,
  task: LearningTask,
  event: LearningEvent,
): XPAward {
  let baseXp = task.maxXp
  let bonusXp = 0
  let reason: XPReason
  let countsTowardAssessment = true

  switch (task.kind) {
    case "lesson": {
      const lessonAward = lessonXp(state, task, event)
      baseXp = lessonAward.baseXp
      bonusXp = lessonAward.bonusXp
      reason = lessonAward.reason
      break
    }
    case "review":
      // A completed scheduled review is legitimate training even when it reveals
      // mistakes. Its lower task value is the only XP difference from a lesson.
      reason = "review-complete"
      break
    case "repair":
      reason = "repair-complete"
      break
    case "assessment":
      reason = "assessment-complete"
      countsTowardAssessment = false
      break
    case "placement":
      baseXp = 0
      reason = "placement-complete"
      countsTowardAssessment = false
      break
  }

  return {
    id: `xp:${event.id}`,
    learnerId: state.learnerId,
    sourceEventId: event.id,
    taskId: task.id,
    taskKind: task.kind,
    maxXp: task.maxXp,
    baseXp,
    bonusXp,
    totalXp: baseXp + bonusXp,
    reason,
    policyVersion: curriculumPackageFor(state).xp.policyVersion,
    countsTowardAssessment,
    awardedAt: event.completedAt,
  }
}

function reviewInterval(stage: number): number {
  return REVIEW_INTERVAL_DAYS[Math.min(stage, REVIEW_INTERVAL_DAYS.length - 1)]
}

function applyLessonEvidence(
  mastery: TopicMastery,
  event: LearningEvent,
  completedAt: Date,
): void {
  const observation = observeTopicMastery(event, mastery.topicId)
  blendMasteryEvidence(mastery, observation, 0.72)
  const secure = lessonEvidenceIsSecure(mastery, event)

  if (!secure) {
    mastery.status = "learning"
    mastery.masteredAt = undefined
    mastery.retention = 0
    mastery.reviewStage = 0
    mastery.dueAt = undefined
    return
  }

  mastery.status = "mastered"
  mastery.masteredAt = mastery.masteredAt ?? completedAt.toISOString()
  mastery.retention = lessonPerformanceMisses(event) === 0 ? 0.72 : 0.6
  mastery.reviewStage = 0
  mastery.reviewIteration += 1
  mastery.independentSuccesses += observation.independent === 1 ? 1 : 0
  mastery.dueAt = addDays(completedAt, 1)
}

function applyLessonRecoveryEvidence(
  mastery: TopicMastery,
  event: LearningEvent,
  completedAt: Date,
): void {
  const observation = observeTopicMastery(event, mastery.topicId)
  blendMasteryEvidence(mastery, observation, 0.65)

  if (!recoveryEvidenceIsSecure(event, mastery.topicId)) {
    mastery.status = "learning"
    mastery.masteredAt = undefined
    mastery.retention = 0
    mastery.reviewStage = 0
    mastery.dueAt = undefined
    return
  }

  mastery.status = "mastered"
  mastery.masteredAt = completedAt.toISOString()
  mastery.retention = 0.65
  mastery.reviewStage = 0
  mastery.reviewIteration += 1
  mastery.independentSuccesses += 1
  mastery.dueAt = addDays(completedAt, 1)
}

function applyReviewEvidence(
  mastery: TopicMastery,
  event: LearningEvent,
  completedAt: Date,
): void {
  const results = event.questionResults.filter((result) => result.topicId === mastery.topicId)
  const independent =
    event.independentlyCompleted &&
    results.length > 0 &&
    results.every((result) => result.independentlySolved && result.hintsUsed === 0)
  const observation = observeTopicMastery(event, mastery.topicId)
  blendMasteryEvidence(mastery, observation, independent ? 0.18 : 0.15)

  mastery.lastReviewedAt = completedAt.toISOString()
  mastery.reviewIteration += 1

  if (independent) {
    mastery.reviewStage = Math.min(mastery.reviewStage + 1, REVIEW_INTERVAL_DAYS.length - 1)
    mastery.retention = Math.min(1, mastery.retention + 0.12)
    mastery.independentSuccesses += 1
    mastery.dueAt = addDays(completedAt, reviewInterval(mastery.reviewStage))
  } else {
    mastery.reviewStage = Math.max(0, mastery.reviewStage - 1)
    mastery.retention = Math.max(0.2, mastery.retention - 0.12)
    mastery.dueAt = addHours(completedAt, event.hintsUsed > 0 ? 4 : 24)
  }
}

function applyAssessmentEvidence(
  state: LearnerState,
  event: LearningEvent,
  completedAt: Date,
): void {
  for (const topicId of event.topicIds) {
    const mastery = state.mastery[topicId]
    const results = event.questionResults.filter((result) => result.topicId === topicId)
    if (results.length === 0) continue

    const independent = results.every(isSecureAssessmentResult)
    const observation = observeTopicMastery(event, topicId)
    blendMasteryEvidence(mastery, observation, 0.22)

    if (independent) {
      mastery.retention = Math.min(1, mastery.retention + 0.08)
      mastery.independentSuccesses += 1
      const laterDueAt = addDays(completedAt, reviewInterval(mastery.reviewStage))
      if (!mastery.dueAt || new Date(mastery.dueAt).getTime() < completedAt.getTime()) {
        mastery.dueAt = laterDueAt
      }
    } else {
      // A missed assessment item produces a fresh review immediately.
      mastery.retention = Math.max(0.2, mastery.retention - 0.18)
      mastery.reviewStage = Math.max(0, mastery.reviewStage - 1)
      mastery.reviewIteration += 1
      mastery.dueAt = completedAt.toISOString()
    }
  }
}

function applyPlacementEvidence(
  state: LearnerState,
  event: LearningEvent,
  completedAt: Date,
): void {
  for (const topicId of event.topicIds) {
    const mastery = state.mastery[topicId]
    const results = event.questionResults.filter((result) => result.topicId === topicId)
    if (results.length === 0 || !results.every(isSecureAssessmentResult)) continue

    mastery.status = "mastered"
    mastery.supportedMastery = Math.max(mastery.supportedMastery, 0.65)
    mastery.independentMastery = Math.max(mastery.independentMastery, 0.6)
    mastery.retention = 0.55
    mastery.reviewStage = 0
    mastery.reviewIteration += 1
    mastery.independentSuccesses += 1
    mastery.masteredAt = completedAt.toISOString()
    mastery.dueAt = addDays(completedAt, 1)
  }
  state.placementCompletedAt = completedAt.toISOString()
}

export function recordCompletion(
  state: LearnerState,
  task: LearningTask,
  event: LearningEvent,
): EngineResult {
  if (!taskMatchesLearnerCurriculum(task, state)) {
    throw new Error("The task curriculum does not match the learner curriculum.")
  }
  if (event.taskId !== task.id || event.taskKind !== task.kind) {
    throw new Error("The completion event does not match its task.")
  }
  if (event.taskPurpose !== undefined && event.taskPurpose !== task.purpose) {
    throw new Error("The completion event does not match its task purpose.")
  }

  const existingAward = state.xpLedger.find((award) => award.sourceEventId === event.id)
  if (existingAward) {
    return {
      state,
      award: existingAward,
      assessmentUnlocked: state.xpSinceAssessment >= state.assessmentThreshold,
    }
  }

  if (state.completedTaskIds.includes(task.id)) {
    throw new Error("This task has already been completed.")
  }

  const recordedEvent = task.purpose && !event.taskPurpose
    ? { ...event, taskPurpose: task.purpose }
    : event
  const next = copyState(state)
  const completedAt = new Date(event.completedAt)
  const award = createAward(next, task, event)

  next.learningEvents.push(recordedEvent)
  next.xpLedger.push(award)
  next.completedTaskIds.push(task.id)
  next.totalXp += award.totalXp

  if (award.countsTowardAssessment) {
    next.xpSinceAssessment += award.totalXp
  }

  switch (task.kind) {
    case "lesson":
      applyLessonEvidence(next.mastery[task.topicIds[0]!], event, completedAt)
      break
    case "review":
      applyReviewEvidence(next.mastery[task.topicIds[0]!], event, completedAt)
      break
    case "repair":
      if (task.purpose === "lesson-recovery") {
        applyLessonRecoveryEvidence(next.mastery[task.topicIds[0]!], event, completedAt)
      } else {
        applyReviewEvidence(next.mastery[task.topicIds[0]!], event, completedAt)
      }
      break
    case "assessment":
      applyAssessmentEvidence(next, event, completedAt)
      next.xpSinceAssessment = Math.max(0, next.xpSinceAssessment - next.assessmentThreshold)
      next.assessmentNumber += 1
      break
    case "placement":
      applyPlacementEvidence(next, event, completedAt)
      break
  }

  const refreshed = refreshTopicAvailability(next)
  refreshed.updatedAt = event.completedAt

  return {
    state: refreshed,
    award,
    assessmentUnlocked: refreshed.xpSinceAssessment >= refreshed.assessmentThreshold,
  }
}

export function courseProgress(state: LearnerState): number {
  const curriculum = curriculumTopics(state)
  const mastered = curriculum.filter(
    (topic) => state.mastery[topic.id].status === "mastered",
  ).length
  return mastered / curriculum.length
}

export function nextReviewAt(state: LearnerState): string | undefined {
  return Object.values(state.mastery)
    .filter((mastery) => (
      mastery.status === "mastered" &&
      !topicNeedsTeacherSupport(state, mastery.topicId)
    ))
    .map((mastery) => effectiveReviewTimestamp(state, mastery.topicId))
    .filter(Number.isFinite)
    .sort((left, right) => left - right)
    .map((timestamp) => new Date(timestamp).toISOString())[0]
}

export function nextLessonRecoveryAt(
  state: LearnerState,
  now = new Date(),
): string | undefined {
  return curriculumTopics(state)
    .filter((topic) => (
      state.mastery[topic.id].status === "learning" &&
      !topicNeedsTeacherSupport(state, topic.id)
    ))
    .map((topic) => lessonRecoveryReadyTimestamp(state, topic.id))
    .filter((timestamp) => timestamp > now.getTime())
    .sort((left, right) => left - right)
    .map((timestamp) => new Date(timestamp).toISOString())[0]
}
