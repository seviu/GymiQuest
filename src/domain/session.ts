import type {
  LearnerState,
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
  version: 1 | 2 | 3 | 4 | 5
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

export interface ActiveLearningSession {
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

export function isResumableSession(
  session: ActiveLearningSession | undefined,
  learner: LearnerState,
): session is ActiveLearningSession {
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
