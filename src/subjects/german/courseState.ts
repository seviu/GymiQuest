import { courseKeys } from "../../domain/subjectIdentity"
import { germanLessons, germanStartCheckQuestions, germanTopics } from "./content"
import {
  generateGermanQuestions,
  germanDifficultyBandForSessionKind,
  type GermanGeneratedQuestion,
} from "./generators"
import {
  cloneGermanObjectiveResponse,
  gradeGermanObjectiveAnswer,
  type GermanObjectiveGrade,
  type GermanObjectiveResponse,
} from "./grading"
import {
  createActiveGermanExam,
  isActiveGermanExam,
  isGermanExamResult,
  type ActiveGermanExam,
  type GermanExamResult,
} from "./exam"
import {
  cloneActiveGermanWritingSession,
  cloneGermanWritingHumanReview,
  cloneGermanWritingResult,
  createGermanWritingHumanReview,
  createActiveGermanWritingSession,
  isActiveGermanWritingSession,
  isGermanWritingHumanReview,
  isGermanWritingResult,
  type ActiveGermanWritingSession,
  type GermanWritingHumanReview,
  type GermanWritingResult,
} from "./writing"
import {
  cloneActiveGermanComprehensionSession,
  cloneGermanComprehensionResult,
  cloneGermanComprehensionReview,
  createActiveGermanComprehensionSession,
  createGermanComprehensionReview,
  isActiveGermanComprehensionSession,
  isGermanComprehensionResult,
  isGermanComprehensionReview,
  resolveGermanComprehensionReview,
  type ActiveGermanComprehensionSession,
  type GermanComprehensionEvidenceStatus,
  type GermanComprehensionResult,
  type GermanComprehensionReview,
} from "./comprehension"
import {
  GERMAN_WRITING_MAX_REVISIONS_PER_RESULT,
  cloneActiveGermanWritingRevision,
  cloneGermanWritingRevisionSnapshot,
  createActiveGermanWritingRevision,
  isActiveGermanWritingRevision,
  isGermanWritingRevisionSnapshot,
  type ActiveGermanWritingRevision,
  type GermanWritingRevisionSnapshot,
} from "./writingRevision"
import {
  GERMAN_COURSE_ID,
  GERMAN_COURSE_VERSION,
  GERMAN_CURRICULUM_PACKAGE,
  GERMAN_GENERATOR_VERSION,
  GERMAN_ASSESSMENT_ACTIVITY_ID,
  germanLessonIdByTopic,
  germanGeneratorVersions,
  germanPilotTopicIds,
  germanTopicIds,
  type GermanActivityId,
  type GermanGeneratorVersion,
  type GermanPilotTopicId,
  type GermanTopicId,
} from "./package"

export type GermanTopicStatus = "available" | "learning" | "mastered" | "paused" | "coming-soon"
export type GermanSessionKind = "lesson" | "review" | "assessment"

export interface GermanTopicProgress {
  topicId: GermanTopicId
  status: GermanTopicStatus
  lessonAttempts: number
  reviewCount: number
  bestCorrect: number
  recentTemplateIds: string[]
  completedAt?: string
  reviewDueAt?: string
  helpRequestedAt?: string
}

export interface GermanStartCheckProgress {
  startedAt: string
  currentIndex: number
  answers: Record<string, number>
  completedAt?: string
  correctCount?: number
}

export type GermanSessionAnswer = GermanObjectiveGrade & {
  questionId: string
  answeredAt: string
}

export interface GermanLearningSession {
  id: string
  kind: GermanSessionKind
  lessonId: GermanActivityId
  topicId: GermanPilotTopicId
  assessmentTopicIds?: GermanPilotTopicId[]
  assessmentNumber?: number
  excludedTemplateIdsByTopic: Partial<Record<GermanPilotTopicId, string[]>>
  generatorVersion: GermanGeneratorVersion
  seed: string
  questionCount: number
  questionIndex: number
  answers: GermanSessionAnswer[]
  startedAt: string
  updatedAt: string
}

export interface GermanXpEvent {
  id: string
  sessionId: string
  kind: GermanSessionKind
  topicId?: GermanTopicId
  topicIds: GermanPilotTopicId[]
  baseXp: number
  bonusXp: number
  totalXp: number
  mistakes: number
  policyVersion: 1
  awardedAt: string
}

export interface GermanAssessmentTopicResult {
  topicId: GermanPilotTopicId
  correct: number
  total: number
}

export interface GermanAssessmentResult {
  id: string
  assessmentNumber: number
  correct: number
  total: number
  topicResults: GermanAssessmentTopicResult[]
  completedAt: string
  /** Exact, version-pinned evidence used only for the post-assessment review. */
  reviewSession?: GermanLearningSession
}

export interface GermanCourseState {
  schemaVersion: 9
  subjectId: "german"
  courseKey: typeof courseKeys.german
  courseId: typeof GERMAN_COURSE_ID
  courseVersion: typeof GERMAN_COURSE_VERSION
  learnerId: string
  createdAt: string
  updatedAt: string
  startCheck?: GermanStartCheckProgress
  totalXp: number
  xpSinceAssessment: number
  topicProgress: Record<GermanTopicId, GermanTopicProgress>
  xpLedger: GermanXpEvent[]
  assessmentHistory: GermanAssessmentResult[]
  examHistory: GermanExamResult[]
  writingHistory: GermanWritingResult[]
  writingReviews: GermanWritingHumanReview[]
  writingRevisions: GermanWritingRevisionSnapshot[]
  comprehensionHistory: GermanComprehensionResult[]
  comprehensionReviews: GermanComprehensionReview[]
  completedSessionIds: string[]
  activeSession?: GermanLearningSession
  activeExam?: ActiveGermanExam
  activeWriting?: ActiveGermanWritingSession
  activeWritingRevision?: ActiveGermanWritingRevision
  activeComprehension?: ActiveGermanComprehensionSession
}

export interface GermanAssignment {
  id: string
  kind: GermanSessionKind
  lessonId: GermanActivityId
  topicId: GermanPilotTopicId
  topicIds: GermanPilotTopicId[]
  assessmentNumber?: number
  title: string
  description: string
  maxXp: number
  dueAt?: string
  recommended?: boolean
}

function iso(now: Date): string {
  return now.toISOString()
}

function addDays(timestamp: string, days: number): string {
  return new Date(Date.parse(timestamp) + days * 24 * 60 * 60 * 1000).toISOString()
}

function createTopicProgress(topicId: GermanTopicId): GermanTopicProgress {
  return {
    topicId,
    status: germanTopics[topicId].availableInPilot ? "available" : "coming-soon",
    lessonAttempts: 0,
    reviewCount: 0,
    bestCorrect: 0,
    recentTemplateIds: [],
  }
}

function cloneGermanSessionAnswer(answer: GermanSessionAnswer): GermanSessionAnswer {
  if (!("responseKind" in answer)) return { ...answer }
  if (answer.responseKind === "matching") {
    return {
      ...answer,
      selectedMatches: answer.selectedMatches.map((match) => ({ ...match })),
      correctMatches: answer.correctMatches.map((match) => ({ ...match })),
    }
  }
  if (answer.responseKind === "truth-grid" || answer.responseKind === "binary-grid") {
    return {
      ...answer,
      selectedSelections: answer.selectedSelections.map((selection) => ({ ...selection })),
      correctSelections: answer.correctSelections.map((selection) => ({ ...selection })),
    }
  }
  if (answer.responseKind === "multi-select") {
    return {
      ...answer,
      selectedOptionIds: [...answer.selectedOptionIds],
      correctOptionIds: [...answer.correctOptionIds],
    }
  }
  return { ...answer }
}

function cloneGermanLearningSession(session: GermanLearningSession): GermanLearningSession {
  return {
    ...session,
    assessmentTopicIds: session.assessmentTopicIds
      ? [...session.assessmentTopicIds]
      : undefined,
    excludedTemplateIdsByTopic: Object.fromEntries(Object.entries(
      session.excludedTemplateIdsByTopic,
    ).map(([topicId, templateIds]) => [topicId, [...templateIds]])),
    answers: session.answers.map(cloneGermanSessionAnswer),
  }
}

function cloneState(state: GermanCourseState): GermanCourseState {
  return {
    ...state,
    startCheck: state.startCheck ? {
      ...state.startCheck,
      answers: { ...state.startCheck.answers },
    } : undefined,
    topicProgress: Object.fromEntries(germanTopicIds.map((topicId) => [
      topicId,
      {
        ...state.topicProgress[topicId],
        recentTemplateIds: [...state.topicProgress[topicId].recentTemplateIds],
      },
    ])) as GermanCourseState["topicProgress"],
    xpLedger: state.xpLedger.map((event) => ({
      ...event,
      topicIds: [...event.topicIds],
    })),
    assessmentHistory: state.assessmentHistory.map((result) => ({
      ...result,
      topicResults: result.topicResults.map((topicResult) => ({ ...topicResult })),
      reviewSession: result.reviewSession
        ? cloneGermanLearningSession(result.reviewSession)
        : undefined,
    })),
    examHistory: state.examHistory.map((result) => ({
      ...result,
      questionResults: result.questionResults.map((questionResult) => ({
        ...questionResult,
        selectedMatches: questionResult.selectedMatches?.map((match) => ({ ...match })),
        correctMatches: questionResult.correctMatches?.map((match) => ({ ...match })),
        selectedSelections: questionResult.selectedSelections?.map((selection) => ({ ...selection })),
        correctSelections: questionResult.correctSelections?.map((selection) => ({ ...selection })),
        selectedOptionIds: questionResult.selectedOptionIds ? [...questionResult.selectedOptionIds] : undefined,
        correctOptionIds: questionResult.correctOptionIds ? [...questionResult.correctOptionIds] : undefined,
      })),
      topicResults: result.topicResults.map((topicResult) => ({ ...topicResult })),
    })),
    writingHistory: state.writingHistory.map(cloneGermanWritingResult),
    writingReviews: state.writingReviews.map(cloneGermanWritingHumanReview),
    writingRevisions: state.writingRevisions.map(cloneGermanWritingRevisionSnapshot),
    comprehensionHistory: state.comprehensionHistory.map(cloneGermanComprehensionResult),
    comprehensionReviews: state.comprehensionReviews.map(cloneGermanComprehensionReview),
    completedSessionIds: [...state.completedSessionIds],
    activeSession: state.activeSession
      ? cloneGermanLearningSession(state.activeSession)
      : undefined,
    activeExam: state.activeExam ? {
      ...state.activeExam,
      answers: Object.fromEntries(Object.entries(state.activeExam.answers).map(([questionId, response]) => [
        questionId,
        cloneGermanObjectiveResponse(response),
      ])),
      flaggedQuestionIds: [...state.activeExam.flaggedQuestionIds],
    } : undefined,
    activeWriting: state.activeWriting
      ? cloneActiveGermanWritingSession(state.activeWriting)
      : undefined,
    activeWritingRevision: state.activeWritingRevision
      ? cloneActiveGermanWritingRevision(state.activeWritingRevision)
      : undefined,
    activeComprehension: state.activeComprehension
      ? cloneActiveGermanComprehensionSession(state.activeComprehension)
      : undefined,
  }
}

export function createInitialGermanCourseState(
  learnerId = "local-learner",
  now = new Date(),
): GermanCourseState {
  const timestamp = iso(now)
  return {
    schemaVersion: 9,
    subjectId: "german",
    courseKey: courseKeys.german,
    courseId: GERMAN_COURSE_ID,
    courseVersion: GERMAN_COURSE_VERSION,
    learnerId,
    createdAt: timestamp,
    updatedAt: timestamp,
    totalXp: 0,
    xpSinceAssessment: 0,
    topicProgress: Object.fromEntries(germanTopicIds.map((topicId) => [
      topicId,
      createTopicProgress(topicId),
    ])) as GermanCourseState["topicProgress"],
    xpLedger: [],
    assessmentHistory: [],
    examHistory: [],
    writingHistory: [],
    writingReviews: [],
    writingRevisions: [],
    comprehensionHistory: [],
    comprehensionReviews: [],
    completedSessionIds: [],
  }
}

function writingRevisionRelationsAreValid(
  history: readonly GermanWritingResult[] | undefined,
  reviews: readonly GermanWritingHumanReview[] | undefined,
  revisions: readonly GermanWritingRevisionSnapshot[] | undefined,
  active: ActiveGermanWritingRevision | undefined,
): boolean {
  if (revisions === undefined) return active === undefined
  if (!history || !reviews || revisions.length > 100 ||
    !revisions.every(isGermanWritingRevisionSnapshot) ||
    new Set(revisions.map((revision) => revision.id)).size !== revisions.length) return false
  const resultById = new Map(history.map((result) => [result.id, result]))
  const reviewByResultId = new Map(reviews.map((review) => [review.resultId, review]))
  const revisionsByResultId = new Map<string, GermanWritingRevisionSnapshot[]>()
  for (const revision of revisions) {
    const result = resultById.get(revision.resultId)
    const review = reviewByResultId.get(revision.resultId)
    if (!result || !review || Date.parse(revision.startedAt) < Date.parse(review.reviewedAt)) return false
    const group = revisionsByResultId.get(revision.resultId) ?? []
    group.push(revision)
    revisionsByResultId.set(revision.resultId, group)
  }
  for (const group of revisionsByResultId.values()) {
    const ordered = [...group].sort((left, right) => left.revisionNumber - right.revisionNumber)
    if (ordered.length > GERMAN_WRITING_MAX_REVISIONS_PER_RESULT ||
      ordered.some((revision, index) => revision.revisionNumber !== index + 1)) return false
  }
  if (!active) return true
  if (!isActiveGermanWritingRevision(active)) return false
  const result = resultById.get(active.resultId)
  const review = reviewByResultId.get(active.resultId)
  const prior = revisionsByResultId.get(active.resultId) ?? []
  return Boolean(
    result &&
    review &&
    Date.parse(active.startedAt) >= Date.parse(review.reviewedAt) &&
    active.revisionNumber === prior.length + 1 &&
    active.revisionNumber <= GERMAN_WRITING_MAX_REVISIONS_PER_RESULT
  )
}

function hasGermanCourseIdentity(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<GermanCourseState>
  const schemaVersion = (candidate as { schemaVersion?: number }).schemaVersion
  const writingHistory = (candidate as Partial<GermanCourseState>).writingHistory
  const writingReviews = (candidate as Partial<GermanCourseState>).writingReviews
  const writingRevisions = (candidate as Partial<GermanCourseState>).writingRevisions
  const writingResultById = new Map(writingHistory?.map((result) => [result.id, result]) ?? [])
  const comprehensionHistory = (candidate as Partial<GermanCourseState>).comprehensionHistory
  const comprehensionReviews = (candidate as Partial<GermanCourseState>).comprehensionReviews
  const comprehensionResultById = new Map(comprehensionHistory?.map((result) => [result.id, result]) ?? [])
  return (schemaVersion === 1 || schemaVersion === 2 || schemaVersion === 3 || schemaVersion === 4 || schemaVersion === 5 || schemaVersion === 6 || schemaVersion === 7 || schemaVersion === 8 || schemaVersion === 9) &&
    candidate.subjectId === "german" &&
    candidate.courseKey === courseKeys.german &&
    candidate.courseId === GERMAN_COURSE_ID &&
    candidate.courseVersion === GERMAN_COURSE_VERSION &&
    typeof candidate.learnerId === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    typeof candidate.totalXp === "number" &&
    typeof candidate.xpSinceAssessment === "number" &&
    Boolean(candidate.topicProgress) &&
    germanTopicIds.every((topicId) => candidate.topicProgress?.[topicId]?.topicId === topicId) &&
    Array.isArray(candidate.xpLedger) &&
    Array.isArray(candidate.completedSessionIds) &&
    (candidate.activeSession === undefined ||
      candidate.activeSession.generatorVersion === undefined ||
      germanGeneratorVersions.includes(candidate.activeSession.generatorVersion)) &&
    (candidate.activeExam === undefined || isActiveGermanExam(candidate.activeExam)) &&
    ((candidate as Partial<GermanCourseState>).activeWriting === undefined ||
      isActiveGermanWritingSession((candidate as Partial<GermanCourseState>).activeWriting)) &&
    writingRevisionRelationsAreValid(
      writingHistory,
      writingReviews,
      writingRevisions,
      (candidate as Partial<GermanCourseState>).activeWritingRevision,
    ) &&
    ((candidate as Partial<GermanCourseState>).activeComprehension === undefined ||
      isActiveGermanComprehensionSession((candidate as Partial<GermanCourseState>).activeComprehension)) &&
    ((candidate as Partial<GermanCourseState>).examHistory === undefined || (
      Array.isArray((candidate as Partial<GermanCourseState>).examHistory) &&
      (candidate as Partial<GermanCourseState>).examHistory?.every(isGermanExamResult) === true
    )) &&
    (writingHistory === undefined || (
      Array.isArray(writingHistory) &&
      writingHistory.every(isGermanWritingResult)
    )) &&
    (writingReviews === undefined || (
      Array.isArray(writingReviews) &&
      writingReviews.every(isGermanWritingHumanReview) &&
      new Set(writingReviews.map((review) => review.resultId)).size === writingReviews.length &&
      writingReviews.every((review) => {
        const result = writingResultById.get(review.resultId)
        return Boolean(result && Date.parse(review.reviewedAt) >= Date.parse(result.submittedAt))
      })
    )) &&
    (comprehensionHistory === undefined || (
      Array.isArray(comprehensionHistory) &&
      comprehensionHistory.length <= 100 &&
      comprehensionHistory.every(isGermanComprehensionResult)
    )) &&
    (comprehensionReviews === undefined || (
      Array.isArray(comprehensionReviews) &&
      comprehensionReviews.length <= 100 &&
      comprehensionReviews.every(isGermanComprehensionReview) &&
      new Set(comprehensionReviews.map((review) => review.resultId)).size === comprehensionReviews.length &&
      comprehensionReviews.every((review) => {
        const result = comprehensionResultById.get(review.resultId)
        return Boolean(result && Date.parse(review.reviewedAt) >= Date.parse(result.submittedAt))
      })
    )) &&
    (schemaVersion !== 7 || (Array.isArray(writingHistory) && Array.isArray(writingReviews))) &&
    (schemaVersion !== 8 || (
      Array.isArray(writingHistory) &&
      Array.isArray(writingReviews) &&
      Array.isArray(comprehensionHistory) &&
      Array.isArray(comprehensionReviews)
    )) &&
    (schemaVersion !== 9 || (
      Array.isArray(writingHistory) &&
      Array.isArray(writingReviews) &&
      Array.isArray(writingRevisions) &&
      Array.isArray(comprehensionHistory) &&
      Array.isArray(comprehensionReviews)
    ))
}

export function normalizeGermanCourseState(value: unknown): GermanCourseState | undefined {
  if (!hasGermanCourseIdentity(value)) return undefined
  const candidate = value as unknown as Omit<GermanCourseState, "schemaVersion" | "assessmentHistory" | "examHistory" | "writingHistory" | "writingReviews" | "writingRevisions" | "comprehensionHistory" | "comprehensionReviews"> & {
    schemaVersion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    assessmentHistory?: GermanAssessmentResult[]
    examHistory?: GermanExamResult[]
    writingHistory?: GermanWritingResult[]
    writingReviews?: GermanWritingHumanReview[]
    writingRevisions?: GermanWritingRevisionSnapshot[]
    comprehensionHistory?: GermanComprehensionResult[]
    comprehensionReviews?: GermanComprehensionReview[]
  }
  const topicProgress = Object.fromEntries(germanTopicIds.map((topicId) => {
    const progress = candidate.topicProgress[topicId]
    return [topicId, {
      ...progress,
      recentTemplateIds: Array.isArray(progress.recentTemplateIds)
        ? [...progress.recentTemplateIds]
        : [],
      status: progress.status === "coming-soon" && germanTopics[topicId].availableInPilot
        ? "available"
        : progress.status,
    }]
  })) as GermanCourseState["topicProgress"]
  return {
    ...candidate,
    schemaVersion: 9,
    topicProgress,
    xpLedger: candidate.xpLedger.map((event) => ({
      ...event,
      topicIds: event.topicIds?.length
        ? [...event.topicIds]
        : event.topicId && germanPilotTopicIds.includes(event.topicId as GermanPilotTopicId)
          ? [event.topicId as GermanPilotTopicId]
          : [],
    })),
    assessmentHistory: (candidate.assessmentHistory ?? []).map((result) => ({
      ...result,
      topicResults: result.topicResults.map((topicResult) => ({ ...topicResult })),
      reviewSession: result.reviewSession
        ? cloneGermanLearningSession(result.reviewSession)
        : undefined,
    })),
    examHistory: (candidate.examHistory ?? []).map((result) => ({
      ...result,
      questionResults: result.questionResults.map((questionResult) => ({
        ...questionResult,
        selectedMatches: questionResult.selectedMatches?.map((match) => ({ ...match })),
        correctMatches: questionResult.correctMatches?.map((match) => ({ ...match })),
        selectedSelections: questionResult.selectedSelections?.map((selection) => ({ ...selection })),
        correctSelections: questionResult.correctSelections?.map((selection) => ({ ...selection })),
        selectedOptionIds: questionResult.selectedOptionIds ? [...questionResult.selectedOptionIds] : undefined,
        correctOptionIds: questionResult.correctOptionIds ? [...questionResult.correctOptionIds] : undefined,
      })),
      topicResults: result.topicResults.map((topicResult) => ({ ...topicResult })),
    })),
    writingHistory: (candidate.writingHistory ?? []).map(cloneGermanWritingResult),
    writingReviews: (candidate.writingReviews ?? []).map(cloneGermanWritingHumanReview),
    writingRevisions: (candidate.writingRevisions ?? []).map(cloneGermanWritingRevisionSnapshot),
    comprehensionHistory: (candidate.comprehensionHistory ?? []).map(cloneGermanComprehensionResult),
    comprehensionReviews: (candidate.comprehensionReviews ?? []).map(cloneGermanComprehensionReview),
    completedSessionIds: [...candidate.completedSessionIds],
    activeSession: candidate.activeSession
      ? cloneGermanLearningSession({
          ...candidate.activeSession,
          generatorVersion: candidate.activeSession.generatorVersion ?? 1,
          excludedTemplateIdsByTopic: candidate.activeSession.excludedTemplateIdsByTopic ?? {},
        })
      : undefined,
    activeExam: candidate.activeExam ? {
      ...candidate.activeExam,
      answers: Object.fromEntries(Object.entries(candidate.activeExam.answers).map(([questionId, response]) => [
        questionId,
        cloneGermanObjectiveResponse(response),
      ])),
      flaggedQuestionIds: [...candidate.activeExam.flaggedQuestionIds],
    } : undefined,
    activeWriting: candidate.activeWriting
      ? cloneActiveGermanWritingSession(candidate.activeWriting)
      : undefined,
    activeWritingRevision: candidate.activeWritingRevision
      ? cloneActiveGermanWritingRevision(candidate.activeWritingRevision)
      : undefined,
    activeComprehension: candidate.activeComprehension
      ? cloneActiveGermanComprehensionSession(candidate.activeComprehension)
      : undefined,
  }
}

export function isGermanCourseState(value: unknown): value is GermanCourseState {
  if (!hasGermanCourseIdentity(value)) return false
  const candidate = value as Partial<GermanCourseState>
  const writingResultById = new Map(candidate.writingHistory?.map((result) => [result.id, result]) ?? [])
  const comprehensionResultById = new Map(candidate.comprehensionHistory?.map((result) => [result.id, result]) ?? [])
  return candidate.schemaVersion === 9 &&
    Array.isArray(candidate.assessmentHistory) &&
    Array.isArray(candidate.examHistory) &&
    candidate.examHistory.every(isGermanExamResult) &&
    Array.isArray(candidate.writingHistory) &&
    candidate.writingHistory.every(isGermanWritingResult) &&
    Array.isArray(candidate.writingReviews) &&
    candidate.writingReviews.every(isGermanWritingHumanReview) &&
    new Set(candidate.writingReviews.map((review) => review.resultId)).size === candidate.writingReviews.length &&
    candidate.writingReviews.every((review) => {
      const result = writingResultById.get(review.resultId)
      return Boolean(result && Date.parse(review.reviewedAt) >= Date.parse(result.submittedAt))
    }) &&
    writingRevisionRelationsAreValid(
      candidate.writingHistory,
      candidate.writingReviews,
      candidate.writingRevisions,
      candidate.activeWritingRevision,
    ) &&
    Array.isArray(candidate.comprehensionHistory) &&
    candidate.comprehensionHistory.length <= 100 &&
    candidate.comprehensionHistory.every(isGermanComprehensionResult) &&
    Array.isArray(candidate.comprehensionReviews) &&
    candidate.comprehensionReviews.length <= 100 &&
    candidate.comprehensionReviews.every(isGermanComprehensionReview) &&
    new Set(candidate.comprehensionReviews.map((review) => review.resultId)).size === candidate.comprehensionReviews.length &&
    candidate.comprehensionReviews.every((review) => {
      const result = comprehensionResultById.get(review.resultId)
      return Boolean(result && Date.parse(review.reviewedAt) >= Date.parse(result.submittedAt))
    }) &&
    (candidate.activeExam === undefined || isActiveGermanExam(candidate.activeExam)) &&
    (candidate.activeWriting === undefined || isActiveGermanWritingSession(candidate.activeWriting)) &&
    (candidate.activeComprehension === undefined || isActiveGermanComprehensionSession(candidate.activeComprehension)) &&
    (candidate.activeSession === undefined ||
      germanGeneratorVersions.includes(candidate.activeSession.generatorVersion)) &&
    candidate.xpLedger?.every((event) => Array.isArray(event.topicIds)) === true
}

export function startGermanStartCheck(
  state: GermanCourseState,
  now = new Date(),
): GermanCourseState {
  if (state.startCheck?.completedAt || state.startCheck) return state
  return {
    ...cloneState(state),
    updatedAt: iso(now),
    startCheck: {
      startedAt: iso(now),
      currentIndex: 0,
      answers: {},
    },
  }
}

export function answerGermanStartCheck(
  state: GermanCourseState,
  optionIndex: number,
  now = new Date(),
): GermanCourseState {
  const progress = state.startCheck
  if (!progress || progress.completedAt) return state
  const question = germanStartCheckQuestions[progress.currentIndex]
  if (!question || !Number.isInteger(optionIndex) || !question.options[optionIndex]) return state
  const answers = { ...progress.answers, [question.id]: optionIndex }
  const complete = progress.currentIndex === germanStartCheckQuestions.length - 1
  const next = cloneState(state)
  next.updatedAt = iso(now)
  next.startCheck = {
    ...progress,
    answers,
    currentIndex: complete ? progress.currentIndex : progress.currentIndex + 1,
    ...(complete ? {
      completedAt: iso(now),
      correctCount: germanStartCheckQuestions.reduce(
        (total, candidate) => total + (answers[candidate.id] === candidate.correctIndex ? 1 : 0),
        0,
      ),
    } : {}),
  }
  return next
}

function assessmentTopics(state: GermanCourseState, assessmentNumber: number): GermanPilotTopicId[] {
  const eligible = germanPilotTopicIds.filter((topicId) => {
    const progress = state.topicProgress[topicId]
    return Boolean(progress.completedAt && !progress.helpRequestedAt)
  })
  if (eligible.length < 2) return []
  const offset = (assessmentNumber - 1) % eligible.length
  const rotated = [...eligible.slice(offset), ...eligible.slice(0, offset)]
  return Array.from(
    { length: GERMAN_CURRICULUM_PACKAGE.assessment.questionCount },
    (_, index) => rotated[index % rotated.length]!,
  )
}

export function buildGermanAssignments(
  state: GermanCourseState,
  now = new Date(),
): GermanAssignment[] {
  if (!state.startCheck?.completedAt || state.activeExam || state.activeWriting || state.activeWritingRevision || state.activeComprehension) return []
  const nowMs = now.getTime()
  const diagnosticPriority = new Set(germanStartCheckQuestions
    .filter((question) => state.startCheck?.answers[question.id] !== question.correctIndex)
    .map((question) => question.topicId))
  const assessmentNumber = state.assessmentHistory.length + 1
  const dueAssessmentTopics = state.xpSinceAssessment >= GERMAN_CURRICULUM_PACKAGE.assessment.xpThreshold
    ? assessmentTopics(state, assessmentNumber)
    : []
  if (dueAssessmentTopics.length > 0) {
    return [{
      id: `assessment:german:${assessmentNumber}`,
      kind: "assessment",
      lessonId: GERMAN_ASSESSMENT_ACTIVITY_ID,
      topicId: dueAssessmentTopics[0]!,
      topicIds: dueAssessmentTopics,
      assessmentNumber,
      title: `Deutsch-Standortbestimmung ${assessmentNumber}`,
      description: "Fünf neue Aufgaben prüfen, welche Lernfelder als Nächstes wiederholt werden.",
      maxXp: GERMAN_CURRICULUM_PACKAGE.assessment.completionXp,
    }]
  }
  const assignments: GermanAssignment[] = []
  for (const topicId of germanPilotTopicIds) {
    const progress = state.topicProgress[topicId]
    if (progress.helpRequestedAt) continue
    const lessonId = germanLessonIdByTopic[topicId]
    const lesson = germanLessons[lessonId]
    if (!progress.completedAt) {
      assignments.push({
        id: `lesson:${lessonId}`,
        kind: "lesson",
        lessonId,
        topicId,
        topicIds: [topicId],
        title: lesson.title,
        description: lesson.goal,
        maxXp: GERMAN_CURRICULUM_PACKAGE.xp.lessonBaseXp + GERMAN_CURRICULUM_PACKAGE.xp.lessonFlawlessBonusXp,
        recommended: diagnosticPriority.has(topicId),
      })
    } else if (progress.reviewDueAt && Date.parse(progress.reviewDueAt) <= nowMs) {
      assignments.push({
        id: `review:${lessonId}:${progress.reviewCount + 1}`,
        kind: "review",
        lessonId,
        topicId,
        topicIds: [topicId],
        title: `Review: ${germanTopics[topicId].shortTitle}`,
        description: "Neue Formulierungen prüfen, ob die Idee noch sicher sitzt.",
        maxXp: GERMAN_CURRICULUM_PACKAGE.xp.reviewXp,
        dueAt: progress.reviewDueAt,
      })
    }
  }
  return assignments.sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "review" ? -1 : 1
    if (Boolean(left.recommended) !== Boolean(right.recommended)) return left.recommended ? -1 : 1
    return germanTopics[left.topicId].courseOrder - germanTopics[right.topicId].courseOrder
  })
}

export function startGermanSession(
  state: GermanCourseState,
  assignment: GermanAssignment,
  now = new Date(),
): GermanCourseState {
  if (!state.startCheck?.completedAt || state.activeSession || state.activeExam || state.activeWriting || state.activeWritingRevision || state.activeComprehension) return state
  const progress = state.topicProgress[assignment.topicId]
  if (assignment.topicIds.some((topicId) => {
    const topicProgress = state.topicProgress[topicId]
    return Boolean(topicProgress.helpRequestedAt || topicProgress.status === "coming-soon")
  })) return state
  const timestamp = iso(now)
  const attempt = assignment.kind === "assessment"
    ? assignment.assessmentNumber ?? state.assessmentHistory.length + 1
    : assignment.kind === "review"
      ? progress.reviewCount + 1
      : progress.lessonAttempts + 1
  const session: GermanLearningSession = {
    id: `${assignment.kind}:${assignment.lessonId}:${state.learnerId}:${attempt}`,
    kind: assignment.kind,
    lessonId: assignment.lessonId,
    topicId: assignment.topicId,
    assessmentTopicIds: assignment.kind === "assessment" ? [...assignment.topicIds] : undefined,
    assessmentNumber: assignment.kind === "assessment" ? attempt : undefined,
    excludedTemplateIdsByTopic: Object.fromEntries(assignment.topicIds.map((topicId) => [
      topicId,
      [...state.topicProgress[topicId].recentTemplateIds],
    ])) as Partial<Record<GermanPilotTopicId, string[]>>,
    generatorVersion: GERMAN_GENERATOR_VERSION,
    seed: `${GERMAN_COURSE_ID}:${assignment.lessonId}:${assignment.kind}:${attempt}`,
    questionCount: assignment.kind === "assessment" ? assignment.topicIds.length : 5,
    questionIndex: 0,
    answers: [],
    startedAt: timestamp,
    updatedAt: timestamp,
  }
  const next = cloneState(state)
  next.updatedAt = timestamp
  next.activeSession = session
  if (assignment.kind !== "assessment") {
    next.topicProgress[assignment.topicId] = {
      ...progress,
      status: "learning",
    }
  }
  return next
}

export function germanSessionQuestions(session: GermanLearningSession): GermanGeneratedQuestion[] {
  if (session.kind === "assessment") {
    return (session.assessmentTopicIds ?? [session.topicId]).map((topicId, index) => (
      generateGermanQuestions({
        lessonId: germanLessonIdByTopic[topicId],
        topicId,
        generatorVersion: session.generatorVersion,
        seed: `${session.seed}:${topicId}:${index}`,
        questionCount: 1,
        difficultyBand: germanDifficultyBandForSessionKind(session.kind),
        excludedTemplateIds: session.excludedTemplateIdsByTopic[topicId],
      })[0]!
    ))
  }
  return generateGermanQuestions({
    lessonId: germanLessonIdByTopic[session.topicId],
    topicId: session.topicId,
    generatorVersion: session.generatorVersion,
    seed: session.seed,
    questionCount: session.questionCount,
    difficultyBand: germanDifficultyBandForSessionKind(session.kind),
    excludedTemplateIds: session.excludedTemplateIdsByTopic[session.topicId],
  })
}

export function currentGermanQuestion(state: GermanCourseState): GermanGeneratedQuestion | undefined {
  const session = state.activeSession
  return session ? germanSessionQuestions(session)[session.questionIndex] : undefined
}

export function answerCurrentGermanQuestion(
  state: GermanCourseState,
  response: GermanObjectiveResponse,
  now = new Date(),
): GermanCourseState {
  const session = state.activeSession
  const question = currentGermanQuestion(state)
  if (!session || !question || session.answers.some((answer) => answer.questionId === question.id)) return state
  const grade = gradeGermanObjectiveAnswer(question, response)
  const next = cloneState(state)
  const timestamp = iso(now)
  next.updatedAt = timestamp
  next.activeSession = {
    ...session,
    updatedAt: timestamp,
    answers: [...session.answers, {
      ...grade,
      questionId: question.id,
      answeredAt: timestamp,
    }],
  }
  return next
}

function xpForSession(session: GermanLearningSession): { baseXp: number; bonusXp: number } {
  const mistakes = session.answers.filter((answer) => !answer.correct).length
  if (session.kind === "assessment") {
    return {
      baseXp: GERMAN_CURRICULUM_PACKAGE.assessment.completionXp,
      bonusXp: 0,
    }
  }
  if (session.kind === "review") {
    return {
      baseXp: mistakes === 0 ? GERMAN_CURRICULUM_PACKAGE.xp.reviewXp : Math.max(2, GERMAN_CURRICULUM_PACKAGE.xp.reviewXp - mistakes * 2),
      bonusXp: 0,
    }
  }
  if (mistakes >= 4) return { baseXp: 0, bonusXp: 0 }
  if (mistakes === 0) {
    return {
      baseXp: GERMAN_CURRICULUM_PACKAGE.xp.lessonBaseXp,
      bonusXp: GERMAN_CURRICULUM_PACKAGE.xp.lessonFlawlessBonusXp,
    }
  }
  if (mistakes === 1) return { baseXp: GERMAN_CURRICULUM_PACKAGE.xp.lessonBaseXp, bonusXp: 0 }
  return { baseXp: mistakes === 2 ? 14 : 8, bonusXp: 0 }
}

export function advanceGermanSession(
  state: GermanCourseState,
  now = new Date(),
): { state: GermanCourseState; completed: boolean; award?: GermanXpEvent } {
  const session = state.activeSession
  const question = currentGermanQuestion(state)
  if (!session || !question || !session.answers.some((answer) => answer.questionId === question.id)) {
    return { state, completed: false }
  }
  const timestamp = iso(now)
  if (session.questionIndex < session.questionCount - 1) {
    const next = cloneState(state)
    next.updatedAt = timestamp
    next.activeSession = {
      ...session,
      questionIndex: session.questionIndex + 1,
      updatedAt: timestamp,
    }
    return { state: next, completed: false }
  }

  const next = cloneState(state)
  const mistakes = session.answers.filter((answer) => !answer.correct).length
  const xp = xpForSession(session)
  const award: GermanXpEvent = {
    id: `xp:${session.id}`,
    sessionId: session.id,
    kind: session.kind,
    topicId: session.topicId,
    topicIds: session.kind === "assessment"
      ? [...(session.assessmentTopicIds ?? [session.topicId])]
      : [session.topicId],
    baseXp: xp.baseXp,
    bonusXp: xp.bonusXp,
    totalXp: xp.baseXp + xp.bonusXp,
    mistakes,
    policyVersion: 1,
    awardedAt: timestamp,
  }
  next.updatedAt = timestamp
  next.totalXp += award.totalXp
  next.xpLedger.push(award)
  next.completedSessionIds.push(session.id)

  if (session.kind === "assessment") {
    const questions = germanSessionQuestions(session)
    const byTopic = new Map<GermanPilotTopicId, GermanAssessmentTopicResult>()
    for (const assessmentQuestion of questions) {
      const answer = session.answers.find((candidate) => candidate.questionId === assessmentQuestion.id)
      const result = byTopic.get(assessmentQuestion.topicId) ?? {
        topicId: assessmentQuestion.topicId,
        correct: 0,
        total: 0,
      }
      result.total += 1
      if (answer?.correct) result.correct += 1
      byTopic.set(assessmentQuestion.topicId, result)
    }
    const topicResults = [...byTopic.values()]
    for (const result of topicResults) {
      const progress = next.topicProgress[result.topicId]
      next.topicProgress[result.topicId] = {
        ...progress,
        status: progress.completedAt ? "mastered" : progress.status,
        recentTemplateIds: [...new Set([
          ...progress.recentTemplateIds,
          ...questions
            .filter((assessmentQuestion) => assessmentQuestion.topicId === result.topicId)
            .map((assessmentQuestion) => assessmentQuestion.templateId),
        ])].slice(-6),
        reviewDueAt: result.correct === result.total
          ? addDays(timestamp, 7)
          : timestamp,
      }
    }
    next.xpSinceAssessment = 0
    next.assessmentHistory.push({
      id: `german-assessment:${session.assessmentNumber ?? next.assessmentHistory.length + 1}:${session.id}`,
      assessmentNumber: session.assessmentNumber ?? next.assessmentHistory.length + 1,
      correct: session.questionCount - mistakes,
      total: session.questionCount,
      topicResults,
      completedAt: timestamp,
      reviewSession: cloneGermanLearningSession(session),
    })
    next.activeSession = undefined
    return { state: next, completed: true, award }
  }

  const progress = next.topicProgress[session.topicId]
  const completedTemplateIds = germanSessionQuestions(session).map((completedQuestion) => completedQuestion.templateId)
  next.xpSinceAssessment += award.totalXp
  next.topicProgress[session.topicId] = {
    ...progress,
    status: "mastered",
    lessonAttempts: progress.lessonAttempts + (session.kind === "lesson" ? 1 : 0),
    reviewCount: progress.reviewCount + (session.kind === "review" ? 1 : 0),
    bestCorrect: Math.max(progress.bestCorrect, session.questionCount - mistakes),
    recentTemplateIds: completedTemplateIds,
    completedAt: progress.completedAt ?? timestamp,
    reviewDueAt: addDays(timestamp, session.kind === "lesson" ? 1 : Math.min(30, 3 * (progress.reviewCount + 1))),
  }
  next.activeSession = undefined
  return { state: next, completed: true, award }
}

export function startGermanStrictExam(
  state: GermanCourseState,
  now = new Date(),
): GermanCourseState {
  if (!state.startCheck?.completedAt || state.activeSession || state.activeExam || state.activeWriting || state.activeWritingRevision || state.activeComprehension) return state
  const next = cloneState(state)
  const examNumber = state.examHistory.length + 1
  next.updatedAt = iso(now)
  next.activeExam = createActiveGermanExam(
    `${GERMAN_COURSE_ID}:strict-exam:${examNumber}`,
    now,
  )
  return next
}

export function startGermanWritingPractice(
  state: GermanCourseState,
  now = new Date(),
): GermanCourseState {
  if (!state.startCheck?.completedAt || state.activeSession || state.activeExam || state.activeWriting || state.activeWritingRevision || state.activeComprehension) return state
  const next = cloneState(state)
  const timestamp = iso(now)
  next.updatedAt = timestamp
  next.activeWriting = createActiveGermanWritingSession(
    `${GERMAN_COURSE_ID}:writing:${state.writingHistory.length + 1}`,
    now,
  )
  return next
}

export function updateGermanWritingPractice(
  state: GermanCourseState,
  writing: ActiveGermanWritingSession,
): GermanCourseState {
  if (
    !state.activeWriting ||
    state.activeWriting.id !== writing.id ||
    !isActiveGermanWritingSession(writing)
  ) return state
  const next = cloneState(state)
  next.updatedAt = writing.updatedAt
  next.activeWriting = cloneActiveGermanWritingSession(writing)
  return next
}

export function completeGermanWritingPractice(
  state: GermanCourseState,
  result: GermanWritingResult,
  now = new Date(),
): GermanCourseState {
  if (
    !state.activeWriting ||
    state.activeWriting.id !== result.sessionId ||
    state.activeWriting.seed !== result.seed ||
    state.activeWriting.startedAt !== result.startedAt ||
    !isGermanWritingResult(result) ||
    state.writingHistory.some((entry) => entry.id === result.id)
  ) return state
  const next = cloneState(state)
  const timestamp = iso(now)
  next.updatedAt = timestamp
  next.activeWriting = undefined
  next.writingHistory.push(cloneGermanWritingResult(result))
  return next
}

export function saveGermanWritingHumanReview(
  state: GermanCourseState,
  resultId: string,
  strength: string,
  nextStep: string,
  now = new Date(),
): GermanCourseState {
  const result = state.writingHistory.find((candidate) => candidate.id === resultId)
  const feedbackIsLocked = state.activeWritingRevision?.resultId === resultId ||
    state.writingRevisions.some((revision) => revision.resultId === resultId)
  if (!result || feedbackIsLocked || now.getTime() < Date.parse(result.submittedAt)) return state
  const review = createGermanWritingHumanReview(resultId, strength, nextStep, now)
  if (!review) return state
  const next = cloneState(state)
  const existingIndex = next.writingReviews.findIndex((candidate) => candidate.resultId === resultId)
  if (existingIndex >= 0) next.writingReviews[existingIndex] = review
  else next.writingReviews.push(review)
  next.updatedAt = review.reviewedAt
  return next
}

export function startGermanWritingRevision(
  state: GermanCourseState,
  resultId: string,
  now = new Date(),
): GermanCourseState {
  if (!state.startCheck?.completedAt ||
    state.activeSession ||
    state.activeExam ||
    state.activeWriting ||
    state.activeWritingRevision ||
    state.activeComprehension ||
    state.writingRevisions.length >= 100) return state
  const result = state.writingHistory.find((candidate) => candidate.id === resultId)
  const review = state.writingReviews.find((candidate) => candidate.resultId === resultId)
  if (!result || !review || now.getTime() < Date.parse(review.reviewedAt)) return state
  const active = createActiveGermanWritingRevision(result, state.writingRevisions, now)
  if (!active) return state
  const next = cloneState(state)
  next.activeWritingRevision = active
  next.updatedAt = active.updatedAt
  return next
}

export function updateGermanWritingRevision(
  state: GermanCourseState,
  revision: ActiveGermanWritingRevision,
): GermanCourseState {
  if (!state.activeWritingRevision ||
    state.activeWritingRevision.id !== revision.id ||
    !isActiveGermanWritingRevision(revision)) return state
  const next = cloneState(state)
  next.activeWritingRevision = cloneActiveGermanWritingRevision(revision)
  next.updatedAt = revision.updatedAt
  return next
}

export function completeGermanWritingRevision(
  state: GermanCourseState,
  snapshot: GermanWritingRevisionSnapshot,
  now = new Date(),
): GermanCourseState {
  const active = state.activeWritingRevision
  if (!active ||
    active.resultId !== snapshot.resultId ||
    active.revisionNumber !== snapshot.revisionNumber ||
    active.startedAt !== snapshot.startedAt ||
    Date.parse(snapshot.savedAt) < Date.parse(active.updatedAt) ||
    active.title.trim() !== snapshot.title ||
    active.draft.trim() !== snapshot.draft ||
    !isGermanWritingRevisionSnapshot(snapshot) ||
    state.writingRevisions.some((candidate) => (
      candidate.id === snapshot.id ||
      candidate.resultId === snapshot.resultId && candidate.revisionNumber === snapshot.revisionNumber
    ))) return state
  const result = state.writingHistory.find((candidate) => candidate.id === snapshot.resultId)
  const review = state.writingReviews.find((candidate) => candidate.resultId === snapshot.resultId)
  const prior = state.writingRevisions
    .filter((candidate) => candidate.resultId === snapshot.resultId)
    .sort((left, right) => left.revisionNumber - right.revisionNumber)
  const base = prior.at(-1) ?? result
  if (!result || !review ||
    Date.parse(snapshot.startedAt) < Date.parse(review.reviewedAt) ||
    prior.length + 1 !== snapshot.revisionNumber ||
    !base || base.title === snapshot.title && base.draft === snapshot.draft) return state
  const next = cloneState(state)
  next.activeWritingRevision = undefined
  next.writingRevisions.push(cloneGermanWritingRevisionSnapshot(snapshot))
  next.updatedAt = new Date(Math.max(now.getTime(), Date.parse(snapshot.savedAt))).toISOString()
  return next
}

export function startGermanComprehensionPractice(
  state: GermanCourseState,
  now = new Date(),
): GermanCourseState {
  if (!state.startCheck?.completedAt ||
    state.activeSession ||
    state.activeExam ||
    state.activeWriting ||
    state.activeWritingRevision ||
    state.activeComprehension) return state
  const unresolved = state.comprehensionHistory.some((result) => {
    const review = state.comprehensionReviews.find((candidate) => candidate.resultId === result.id)
    return !review?.resolvedAt
  })
  if (unresolved) return state
  const next = cloneState(state)
  const recentPromptIds = state.comprehensionHistory.slice(-3).map((result) => result.promptId)
  next.activeComprehension = createActiveGermanComprehensionSession(
    `${GERMAN_COURSE_ID}:comprehension:${state.comprehensionHistory.length + 1}:${now.toISOString()}`,
    recentPromptIds,
    now,
  )
  next.updatedAt = next.activeComprehension.updatedAt
  return next
}

export function updateGermanComprehensionPractice(
  state: GermanCourseState,
  session: ActiveGermanComprehensionSession,
): GermanCourseState {
  if (!state.activeComprehension ||
    state.activeComprehension.id !== session.id ||
    !isActiveGermanComprehensionSession(session)) return state
  const next = cloneState(state)
  next.activeComprehension = cloneActiveGermanComprehensionSession(session)
  next.updatedAt = session.updatedAt
  return next
}

export function completeGermanComprehensionPractice(
  state: GermanCourseState,
  result: GermanComprehensionResult,
  now = new Date(),
): GermanCourseState {
  if (!state.activeComprehension ||
    state.activeComprehension.id !== result.sessionId ||
    state.activeComprehension.seed !== result.seed ||
    state.activeComprehension.generatorVersion !== result.generatorVersion ||
    state.activeComprehension.promptId !== result.promptId ||
    state.activeComprehension.startedAt !== result.startedAt ||
    Date.parse(result.submittedAt) < Date.parse(state.activeComprehension.updatedAt) ||
    result.response !== state.activeComprehension.response.trim() ||
    result.evidenceLines.length !== state.activeComprehension.evidenceLines.length ||
    result.evidenceLines.some((line, index) => line !== state.activeComprehension?.evidenceLines[index]) ||
    !isGermanComprehensionResult(result) ||
    state.comprehensionHistory.some((candidate) => candidate.id === result.id)) return state
  const next = cloneState(state)
  next.activeComprehension = undefined
  next.comprehensionHistory = [
    ...next.comprehensionHistory,
    cloneGermanComprehensionResult(result),
  ].slice(-100)
  const retainedResultIds = new Set(next.comprehensionHistory.map((candidate) => candidate.id))
  next.comprehensionReviews = next.comprehensionReviews.filter((review) => retainedResultIds.has(review.resultId))
  next.updatedAt = new Date(Math.max(now.getTime(), Date.parse(result.submittedAt))).toISOString()
  return next
}

export function saveGermanComprehensionHumanReview(
  state: GermanCourseState,
  resultId: string,
  evidenceStatus: GermanComprehensionEvidenceStatus,
  strength: string,
  nextStep: string,
  now = new Date(),
): GermanCourseState {
  const result = state.comprehensionHistory.find((candidate) => candidate.id === resultId)
  const existing = state.comprehensionReviews.find((candidate) => candidate.resultId === resultId)
  if (!result || existing?.resolvedAt || now.getTime() < Date.parse(result.submittedAt)) return state
  const review = createGermanComprehensionReview(result, evidenceStatus, strength, nextStep, now)
  if (!review) return state
  const next = cloneState(state)
  const existingIndex = next.comprehensionReviews.findIndex((candidate) => candidate.resultId === resultId)
  if (existingIndex >= 0) next.comprehensionReviews[existingIndex] = review
  else next.comprehensionReviews.push(review)
  next.updatedAt = review.reviewedAt
  return next
}

export function resolveGermanComprehensionHumanReview(
  state: GermanCourseState,
  resultId: string,
  now = new Date(),
): GermanCourseState {
  const reviewIndex = state.comprehensionReviews.findIndex((candidate) => candidate.resultId === resultId)
  if (reviewIndex < 0 || state.comprehensionReviews[reviewIndex]!.resolvedAt) return state
  const next = cloneState(state)
  const resolved = resolveGermanComprehensionReview(next.comprehensionReviews[reviewIndex]!, now)
  next.comprehensionReviews[reviewIndex] = resolved
  next.updatedAt = resolved.resolvedAt ?? resolved.reviewedAt
  return next
}

export function updateGermanStrictExam(
  state: GermanCourseState,
  exam: ActiveGermanExam,
): GermanCourseState {
  if (!state.activeExam || state.activeExam.id !== exam.id || !isActiveGermanExam(exam)) return state
  const next = cloneState(state)
  next.updatedAt = exam.updatedAt
  next.activeExam = {
    ...exam,
    answers: { ...exam.answers },
    flaggedQuestionIds: [...exam.flaggedQuestionIds],
  }
  return next
}

export function completeGermanStrictExam(
  state: GermanCourseState,
  result: GermanExamResult,
  now = new Date(),
): GermanCourseState {
  if (
    !state.activeExam ||
    state.activeExam.id !== result.examId ||
    state.activeExam.seed !== result.seed ||
    state.activeExam.passageId !== result.passageId ||
    state.activeExam.startedAt !== result.startedAt ||
    !isGermanExamResult(result) ||
    state.examHistory.some((entry) => entry.id === result.id)
  ) return state
  const next = cloneState(state)
  const timestamp = iso(now)
  next.updatedAt = timestamp
  next.activeExam = undefined
  next.examHistory.push({
    ...result,
    questionResults: result.questionResults.map((questionResult) => ({
      ...questionResult,
      selectedMatches: questionResult.selectedMatches?.map((match) => ({ ...match })),
      correctMatches: questionResult.correctMatches?.map((match) => ({ ...match })),
      selectedSelections: questionResult.selectedSelections?.map((selection) => ({ ...selection })),
      correctSelections: questionResult.correctSelections?.map((selection) => ({ ...selection })),
      selectedOptionIds: questionResult.selectedOptionIds ? [...questionResult.selectedOptionIds] : undefined,
      correctOptionIds: questionResult.correctOptionIds ? [...questionResult.correctOptionIds] : undefined,
    })),
    topicResults: result.topicResults.map((topicResult) => ({ ...topicResult })),
  })
  for (const topicResult of result.topicResults) {
    if (topicResult.correct === topicResult.total) continue
    const progress = next.topicProgress[topicResult.topicId]
    if (progress.helpRequestedAt || progress.status === "coming-soon") continue
    next.topicProgress[topicResult.topicId] = {
      ...progress,
      reviewDueAt: timestamp,
    }
  }
  return next
}

export function requestGermanTopicSupport(
  state: GermanCourseState,
  topicId: GermanTopicId,
  now = new Date(),
): GermanCourseState {
  const progress = state.topicProgress[topicId]
  if (progress.helpRequestedAt || progress.status === "coming-soon") return state
  const next = cloneState(state)
  const timestamp = iso(now)
  next.updatedAt = timestamp
  next.topicProgress[topicId] = {
    ...progress,
    status: "paused",
    helpRequestedAt: timestamp,
  }
  if (
    next.activeSession?.topicId === topicId ||
    next.activeSession?.assessmentTopicIds?.includes(topicId as GermanPilotTopicId)
  ) next.activeSession = undefined
  return next
}

export function resolveGermanTopicSupport(
  state: GermanCourseState,
  topicId: GermanTopicId,
  now = new Date(),
): GermanCourseState {
  const progress = state.topicProgress[topicId]
  if (!progress.helpRequestedAt) return state
  const next = cloneState(state)
  next.updatedAt = iso(now)
  next.topicProgress[topicId] = {
    ...progress,
    status: progress.completedAt ? "mastered" : "available",
    helpRequestedAt: undefined,
  }
  return next
}
