import type {
  MockExamResult,
  TopicId,
} from "./model"
import type {
  OfficialArchiveEditionId,
  OfficialArchiveYear,
} from "./officialArchiveCatalog"
import type {
  ActiveMockExam,
  MockTaskProgress,
} from "./mockExam"

export type OfficialResponseSpec =
  | {
      kind: "number"
      value: number
      answerLabel: string
      unit?: string
      forbidUnit?: boolean
    }
  | {
      kind: "fraction"
      numerator: number
      denominator: number
      answerLabel: string
    }
  | {
      kind: "tuple-set"
      answerLabel: string
      expected: readonly string[]
    }
  | {
      kind: "face-labels"
      answerLabel: string
      fields: readonly string[]
      expected: readonly number[]
      scoring: "one-per-field" | "all-or-three"
    }
  | {
      kind: "true-false-grid"
      answerLabel: string
      statements: readonly string[]
      expected: readonly boolean[]
    }
  | {
      kind: "matching-grid"
      answerLabel: string
      fields: readonly string[]
      options: readonly {
        value: string
        label: string
      }[]
      expected: readonly string[]
    }
  | {
      kind: "text"
      answerLabel: string
      multiline?: boolean
      placeholder?: string
      inputMode?: "text" | "decimal" | "numeric"
    }
  | {
      kind: "paper"
      answerLabel: string
      hint?: string
    }

interface OfficialRubricMilestoneBase {
  id: string
  label: string
  unit?: string
}

export type OfficialRubricMilestone =
  | OfficialRubricMilestoneBase & {
      kind?: "number"
      expected: readonly number[]
    }
  | OfficialRubricMilestoneBase & {
      kind: "fraction"
      expected: readonly {
        numerator: number
        denominator: number
      }[]
    }
  | OfficialRubricMilestoneBase & {
      kind: "calculation"
      placeholder?: string
      rows?: number
    }

export interface OfficialExamPartBlueprint {
  kind: "official"
  id: string
  label: string
  topicId: TopicId
  maxPoints: number
  response: OfficialResponseSpec
  methodRequired: boolean
  milestones: readonly OfficialRubricMilestone[]
}

export interface OfficialExamTaskBlueprint {
  kind: "official"
  id: string
  taskNumber: number
  title: string
  family: string
  maxPoints: 4
  taskPage: number
  solutionPages: readonly number[]
  rubricSummary: readonly string[]
  parts: readonly OfficialExamPartBlueprint[]
}

export interface OfficialExamReviewPresentation {
  rubricLabel: string
  rubricDetail: string
  precheckMode: "safe-floor" | "manual-only"
}

export interface OfficialExamGradePresentation {
  status: "verified" | "unavailable"
  label: string
  detail: string
}

export interface OfficialExamBlueprint {
  kind: "official"
  id: OfficialArchiveEditionId
  editionId: OfficialArchiveEditionId
  title: string
  year: OfficialArchiveYear
  rubricVersion: string
  version: number
  durationSeconds: number
  maxPoints: 36
  tasks: readonly OfficialExamTaskBlueprint[]
  review: OfficialExamReviewPresentation
  grade: OfficialExamGradePresentation
}

function runId(blueprint: OfficialExamBlueprint, seed: string): string {
  return `official-mock:${blueprint.editionId}:${blueprint.version}:${seed}`
}

export function createActiveOfficialExam(
  blueprint: OfficialExamBlueprint,
  seed: string,
  now = new Date(),
  durationSeconds = blueprint.durationSeconds,
): ActiveMockExam {
  if (!Number.isInteger(durationSeconds) || durationSeconds <= 0) {
    throw new Error("An official exam needs a positive whole-second duration.")
  }
  const startedAt = now.toISOString()
  return {
    schemaVersion: 1,
    kind: "mock-exam",
    source: "official-archive",
    editionId: blueprint.editionId,
    id: runId(blueprint, seed),
    seed,
    blueprintVersion: blueprint.version,
    durationSeconds,
    startedAt,
    deadlineAt: new Date(now.getTime() + durationSeconds * 1_000).toISOString(),
    updatedAt: startedAt,
    currentTaskIndex: 0,
    progress: blueprint.tasks.map((task, index) => ({
      taskId: task.id,
      visited: index === 0,
      visitCount: index === 0 ? 1 : 0,
      flagged: false,
      activeSeconds: 0,
      parts: task.parts.map((taskPart) => ({
        partId: taskPart.id,
        answer: "",
        working: "",
        milestoneAnswers: {},
      })),
    })),
  }
}

export function isOfficialExamEdition(
  exam: ActiveMockExam,
  editionId: OfficialArchiveEditionId,
): boolean {
  return exam.source === "official-archive" && exam.editionId === editionId
}

export function decodeOfficialFaceLabels(answer: string, count: number): string[] {
  const values = answer.split("|")
  return Array.from({ length: count }, (_, index) => values[index] ?? "")
}

export function encodeOfficialFaceLabels(values: readonly string[]): string {
  return values.join("|")
}

export type OfficialTrueFalseValue = "true" | "false" | ""

export function decodeOfficialTrueFalseAnswers(
  answer: string,
  count: number,
): OfficialTrueFalseValue[] {
  const values = answer.split("|")
  return Array.from({ length: count }, (_, index) => {
    const value = values[index]
    return value === "true" || value === "false" ? value : ""
  })
}

export function encodeOfficialTrueFalseAnswers(
  values: readonly OfficialTrueFalseValue[],
): string {
  return values.join("|")
}

export function decodeOfficialMatchingAnswers(answer: string, count: number): string[] {
  const values = answer.split("|")
  return Array.from({ length: count }, (_, index) => values[index] ?? "")
}

export function encodeOfficialMatchingAnswers(values: readonly string[]): string {
  return values.join("|")
}

export function isOfficialPartAnswered(part: OfficialExamPartBlueprint, answer: string): boolean {
  if (part.response.kind === "paper") return answer === "completed-on-paper"
  if (part.response.kind === "face-labels") {
    return decodeOfficialFaceLabels(answer, part.response.fields.length).every((value) => value.trim())
  }
  if (part.response.kind === "true-false-grid") {
    return decodeOfficialTrueFalseAnswers(answer, part.response.statements.length).every(Boolean)
  }
  if (part.response.kind === "matching-grid") {
    const allowed = new Set(part.response.options.map(({ value }) => value))
    return decodeOfficialMatchingAnswers(answer, part.response.fields.length)
      .every((value) => allowed.has(value))
  }
  return Boolean(answer.trim())
}

export function isOfficialTaskAnswered(
  task: OfficialExamTaskBlueprint,
  progress: MockTaskProgress,
): boolean {
  return task.parts.every((taskPart, index) => {
    const draft = progress.parts[index]
    return Boolean(draft && isOfficialPartAnswered(taskPart, draft.answer))
  })
}

export function isReplayableOfficialExam(
  exam: ActiveMockExam,
  blueprint: OfficialExamBlueprint,
): boolean {
  if (
    exam.schemaVersion !== 1 ||
    exam.kind !== "mock-exam" ||
    !isOfficialExamEdition(exam, blueprint.editionId) ||
    exam.blueprintVersion !== blueprint.version ||
    exam.id !== runId(blueprint, exam.seed) ||
    !Number.isInteger(exam.durationSeconds) ||
    exam.durationSeconds <= 0 ||
    !Number.isInteger(exam.currentTaskIndex) ||
    exam.currentTaskIndex < 0 ||
    exam.currentTaskIndex >= blueprint.tasks.length ||
    !Number.isFinite(Date.parse(exam.startedAt)) ||
    !Number.isFinite(Date.parse(exam.deadlineAt)) ||
    Date.parse(exam.deadlineAt) - Date.parse(exam.startedAt) !== exam.durationSeconds * 1_000
  ) {
    return false
  }

  return exam.progress.length === blueprint.tasks.length && exam.progress.every((task, taskIndex) => (
    task.taskId === blueprint.tasks[taskIndex]?.id &&
    task.parts.length === blueprint.tasks[taskIndex]?.parts.length &&
    task.parts.every((draft, partIndex) => (
      draft.partId === blueprint.tasks[taskIndex]?.parts[partIndex]?.id
    ))
  ))
}

export function completeOfficialExamReview(
  result: MockExamResult,
  blueprint: OfficialExamBlueprint,
  taskScores: readonly number[],
  grade: {
    gradeScaleId: string
    mathematicsGrade: (points: number) => number
  } | undefined,
  completedAt = new Date(),
): MockExamResult {
  if (
    result.source !== "official-archive" ||
    result.editionId !== blueprint.editionId ||
    result.maxPoints !== blueprint.maxPoints ||
    taskScores.length !== blueprint.tasks.length ||
    result.taskResults.length !== blueprint.tasks.length ||
    result.taskResults.some((task, index) => (
      task.taskId !== blueprint.tasks[index]!.id ||
      task.maxPoints !== blueprint.tasks[index]!.maxPoints
    )) ||
    taskScores.some((score, index) => (
      !Number.isInteger(score) ||
      score < 0 ||
      score > blueprint.tasks[index]!.maxPoints ||
      score < result.taskResults[index]!.certainPoints ||
      score > result.taskResults[index]!.certainPoints + result.taskResults[index]!.reviewablePoints
    ))
  ) {
    throw new Error("The official review is incomplete or invalid.")
  }

  const taskResults = result.taskResults.map((task, index) => ({
    ...task,
    certainPoints: taskScores[index]!,
    reviewablePoints: 0,
  }))
  const weakness = new Map<TopicId, number>()
  taskScores.forEach((score, taskIndex) => {
    const gap = blueprint.tasks[taskIndex]!.maxPoints - score
    if (gap <= 0) return
    for (const taskPart of blueprint.tasks[taskIndex]!.parts) {
      weakness.set(taskPart.topicId, (weakness.get(taskPart.topicId) ?? 0) + gap)
    }
  })
  const totalPoints = taskScores.reduce((sum, score) => sum + score, 0)

  return {
    ...result,
    certainPoints: totalPoints,
    reviewablePoints: 0,
    taskResults,
    recoveryTopicIds: [...weakness.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([topicId]) => topicId),
    officialReview: {
      editionId: blueprint.editionId,
      rubricVersion: blueprint.rubricVersion,
      status: "complete",
      taskScores: [...taskScores],
      completedAt: completedAt.toISOString(),
      ...(grade
        ? {
            gradeScaleId: grade.gradeScaleId,
            mathematicsGrade: grade.mathematicsGrade(totalPoints),
          }
        : {}),
    },
  }
}
