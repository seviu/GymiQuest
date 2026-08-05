import type {
  LearnerState,
  LearningLocale,
  LearningTask,
  QuestionDiagnosticEvidence,
  QuestionResult,
} from "./model"
import { taskMatchesLearnerCurriculum } from "./curriculumPackage"

export type HelpKind = "hint" | "easier" | "concept" | "solution" | "prerequisites"
export type PlayerPhase = "lesson" | "assessment-intro" | "questions"
export type QuestionFeedback = "correct" | "wrong" | null
export type ConceptRepairStage = "concept" | "example" | "check"

export interface ConceptRepairProgress {
  version: 1 | 2 | 3 | 4 | 5 | 6
  seed: string
  stage: ConceptRepairStage
  teachBack: string
  answer: string
  attempts: number
  feedback: QuestionFeedback
}

export interface QuestionSessionProgress {
  questionIndex: number
  answer: string
  submissions: number
  mistakes: number
  helpCount: number
  activeHelp: HelpKind[]
  feedback: QuestionFeedback
  results: QuestionResult[]
  questionStartedAt: number
  firstDiagnostic?: Omit<QuestionDiagnosticEvidence, "resolved">
  verifiedPracticeSteps?: string[]
  conceptRepair?: ConceptRepairProgress
}

export interface LearningSessionSnapshot {
  schemaVersion: 1
  id: string
  task: LearningTask
  phase: PlayerPhase
  pageIndex: number
  activeSeconds: number
  /** Optional so paused sessions saved before manual pause existed remain valid. */
  timerPaused?: boolean
  question: QuestionSessionProgress
  startedAt: string
  updatedAt: string
}

export interface PrerequisiteDetourContext {
  kind: "prerequisite-refresh"
  origin: LearningSessionSnapshot
}

export interface ActiveLearningSession extends LearningSessionSnapshot {
  /**
   * A prerequisite refresh is a temporary child session. Its origin is kept as
   * a non-recursive snapshot so reloads and backups can return to the exact
   * question without allowing an unbounded session stack.
   */
  prerequisiteDetour?: PrerequisiteDetourContext
}

export function createActiveLearningSession(
  task: LearningTask,
  now = new Date(),
): ActiveLearningSession {
  const timestamp = now.toISOString()
  const phase: PlayerPhase = task.kind === "lesson"
    ? "lesson"
    : task.kind === "assessment"
      ? "assessment-intro"
      : "questions"

  return {
    schemaVersion: 1,
    id: `session:${task.id}`,
    task,
    phase,
    pageIndex: 0,
    activeSeconds: 0,
    timerPaused: false,
    question: {
      questionIndex: 0,
      answer: "",
      submissions: 0,
      mistakes: 0,
      helpCount: 0,
      activeHelp: [],
      feedback: null,
      results: [],
      questionStartedAt: 0,
      verifiedPracticeSteps: [],
    },
    startedAt: timestamp,
    updatedAt: timestamp,
  }
}

/**
 * Keeps a paused Mathematics session in the learner's explicitly selected
 * language. The generated values and answer remain unchanged; only the
 * deterministic learner-facing rendering is switched and saved for resume.
 */
export function setActiveLearningSessionContentLocale(
  session: ActiveLearningSession,
  contentLocale: LearningLocale,
  now = new Date(),
): ActiveLearningSession {
  const localizeTask = (task: LearningTask): LearningTask => (
    task.contentLocale === contentLocale ? task : { ...task, contentLocale }
  )
  const task = localizeTask(session.task)
  const origin = session.prerequisiteDetour?.origin
  const originTask = origin ? localizeTask(origin.task) : undefined
  const localizedOrigin = origin && originTask && originTask !== origin.task
    ? { ...origin, task: originTask, updatedAt: now.toISOString() }
    : origin

  if (task === session.task && localizedOrigin === origin) return session

  return {
    ...session,
    task,
    updatedAt: now.toISOString(),
    ...(session.prerequisiteDetour && localizedOrigin
      ? {
          prerequisiteDetour: {
            ...session.prerequisiteDetour,
            origin: localizedOrigin,
          },
        }
      : {}),
  }
}

function sessionSnapshot(
  session: ActiveLearningSession,
): LearningSessionSnapshot {
  const { prerequisiteDetour: _detour, ...snapshot } = session
  return snapshot
}

export function createPrerequisiteDetourSession(
  task: LearningTask,
  origin: ActiveLearningSession,
  now = new Date(),
): ActiveLearningSession {
  if (task.kind !== "repair" || task.purpose !== "prerequisite-refresh") {
    throw new Error("A prerequisite detour requires a prerequisite-refresh repair task.")
  }
  if (origin.prerequisiteDetour) {
    throw new Error("Nested prerequisite detours are not supported.")
  }
  return {
    ...createActiveLearningSession(task, now),
    prerequisiteDetour: {
      kind: "prerequisite-refresh",
      origin: sessionSnapshot(origin),
    },
  }
}

function sessionCoreIsResumable(
  session: LearningSessionSnapshot | undefined,
  learner: LearnerState,
): session is LearningSessionSnapshot {
  return Boolean(
    session &&
    session.schemaVersion === 1 &&
    taskMatchesLearnerCurriculum(session.task, learner) &&
    (session.task.kind === "placement"
      ? !learner.placementCompletedAt
      : Boolean(learner.placementCompletedAt)) &&
    !session.task.topicIds.some((topicId) => (learner.topicHelpRequests ?? []).some(
      (request) => request.topicId === topicId,
    )) &&
    !learner.completedTaskIds.includes(session.task.id),
  )
}

export function originatingSession(
  session: ActiveLearningSession | undefined,
): ActiveLearningSession | undefined {
  const origin = session?.prerequisiteDetour?.origin
  return origin ? { ...origin } : undefined
}

export function isResumableSession(
  session: ActiveLearningSession | undefined,
  learner: LearnerState,
): session is ActiveLearningSession {
  if (!sessionCoreIsResumable(session, learner)) return false
  if (!session.prerequisiteDetour) return true
  return (
    session.task.kind === "repair" &&
    session.task.purpose === "prerequisite-refresh" &&
    session.prerequisiteDetour.kind === "prerequisite-refresh" &&
    sessionCoreIsResumable(session.prerequisiteDetour.origin, learner)
  )
}

/**
 * Recovers the origin when a refresh was committed but a stale detour remained
 * on disk. This also keeps older, ordinary sessions on the direct fast path.
 */
export function resolveResumableSession(
  session: ActiveLearningSession | undefined,
  learner: LearnerState,
): ActiveLearningSession | undefined {
  if (isResumableSession(session, learner)) return session
  const origin = originatingSession(session)
  return sessionCoreIsResumable(origin, learner) ? origin : undefined
}
