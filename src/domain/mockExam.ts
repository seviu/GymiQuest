import {
  decodeGeometryConstructionAnswer,
  gradeGeometryConstruction,
} from "./geometryConstruction"
import { generateQuestion, isCorrectAnswer, parseCoordinateAnswer } from "./generators"
import type {
  GeneratedQuestion,
  MockExamPartResult,
  MockExamResult,
  MockExamSource,
  MockExamTaskResult,
  MockSubmissionReason,
  QuestionGenerationRequest,
  LearningLocale,
  TopicId,
} from "./model"
import {
  isOfficialTaskAnswered,
  isReplayableOfficialExam,
  type OfficialExamBlueprint,
  type OfficialExamTaskBlueprint,
} from "./officialExam"
import {
  gradeSupportedOfficialExam,
  resolveOfficialExamBlueprint,
} from "./officialExams"
import { createRandom, pick } from "./random"

export const LEGACY_MOCK_BLUEPRINT_VERSION = 1 as const
export const FIXED_BAND_MOCK_BLUEPRINT_VERSION = 2 as const
export const VARIABLE_BAND_MOCK_BLUEPRINT_VERSION = 3 as const
export const FULL_ORIENTATION_MOCK_BLUEPRINT_VERSION = 4 as const
export const ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION = 5 as const
export const MOCK_BLUEPRINT_VERSION = 6 as const
export type GeneratedMockBlueprintVersion =
  | typeof LEGACY_MOCK_BLUEPRINT_VERSION
  | typeof FIXED_BAND_MOCK_BLUEPRINT_VERSION
  | typeof VARIABLE_BAND_MOCK_BLUEPRINT_VERSION
  | typeof FULL_ORIENTATION_MOCK_BLUEPRINT_VERSION
  | typeof ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION
  | typeof MOCK_BLUEPRINT_VERSION
export const FULL_MOCK_DURATION_SECONDS = 60 * 60
export const MOCK_TASK_COUNT = 9
export const MOCK_MAX_POINTS = 36

export interface MockExamPartBlueprint {
  kind: "generated"
  id: string
  label: "a" | "b"
  topicId: TopicId
  seed: string
  maxPoints: 2
  contentLocale?: LearningLocale
  generation?: QuestionGenerationRequest
}

export interface MockExamTaskBlueprint {
  kind: "generated"
  id: string
  taskNumber: number
  title: string
  family: string
  maxPoints: 4
  parts: [MockExamPartBlueprint, MockExamPartBlueprint]
}

export interface MockExamBlueprint {
  kind: "generated"
  id: string
  seed: string
  version: GeneratedMockBlueprintVersion
  contentLocale: LearningLocale
  title: string
  durationSeconds: typeof FULL_MOCK_DURATION_SECONDS
  maxPoints: typeof MOCK_MAX_POINTS
  tasks: MockExamTaskBlueprint[]
}

export type StrictExamBlueprint = MockExamBlueprint | OfficialExamBlueprint
export type StrictExamTaskBlueprint = MockExamTaskBlueprint | OfficialExamTaskBlueprint

export interface MockPartDraft {
  partId: string
  answer: string
  working: string
  milestoneAnswers?: Record<string, string>
}

export interface MockTaskProgress {
  taskId: string
  visited: boolean
  visitCount: number
  flagged: boolean
  activeSeconds: number
  parts: MockPartDraft[]
}

export interface ActiveMockExam {
  schemaVersion: 1
  kind: "mock-exam"
  source?: MockExamSource
  editionId?: string
  id: string
  seed: string
  blueprintVersion: number
  contentLocale?: LearningLocale
  durationSeconds: number
  startedAt: string
  deadlineAt: string
  updatedAt: string
  currentTaskIndex: number
  progress: MockTaskProgress[]
}

interface BlueprintSlot {
  title: string
  englishTitle: string
  italianTitle: string
  spanishTitle: string
  family: string
  first: readonly TopicId[]
  second: readonly TopicId[]
}

// Every mock keeps the nine broad task families stable while the exact topic,
// numbers, diagrams, and surface form vary. This mirrors the archive's
// recurrence instead of copying the 2025 paper order.
const blueprintSlots: readonly BlueprintSlot[] = [
  {
    title: "Rechnen und Einheiten",
    englishTitle: "Calculations and units",
    italianTitle: "Calcoli e unità",
    spanishTitle: "Cálculos y unidades",
    family: "calculation-units",
    first: ["arithmetic-equations", "efficient-arithmetic"],
    second: ["mass-units", "time-fractions"],
  },
  {
    title: "Tabellen und Geld",
    englishTitle: "Tables and money",
    italianTitle: "Tabelle e denaro",
    spanishTitle: "Tablas y dinero",
    family: "tables-ratios",
    first: ["data-tables", "money-calculations"],
    second: ["proportional-revenue", "data-tables"],
  },
  {
    title: "Zahlen systematisch finden",
    englishTitle: "Find numbers systematically",
    italianTitle: "Trovare numeri sistematicamente",
    spanishTitle: "Encontrar números sistemáticamente",
    family: "number-constraints",
    first: ["integer-combinations", "number-constraints"],
    second: ["number-constraints", "integer-combinations"],
  },
  {
    title: "Flächen und Anteile",
    englishTitle: "Areas and fractions",
    italianTitle: "Aree e frazioni",
    spanishTitle: "Áreas y fracciones",
    family: "planar-geometry",
    first: ["area-fractions", "composite-areas"],
    second: ["tiling-costs", "composite-areas"],
  },
  {
    title: "Veränderungen rückwärts lösen",
    englishTitle: "Solve changes backwards",
    italianTitle: "Risolvere cambiamenti a ritroso",
    spanishTitle: "Resolver cambios hacia atrás",
    family: "reverse-processes",
    first: ["reverse-fractions"],
    second: ["reverse-chains"],
  },
  {
    title: "Bewegung und veränderliche Raten",
    englishTitle: "Motion and changing rates",
    italianTitle: "Movimento e tassi variabili",
    spanishTitle: "Movimiento y ritmos cambiantes",
    family: "rates-motion",
    first: ["speed-distance-time", "inverse-proportion"],
    second: ["changing-rates", "speed-distance-time"],
  },
  {
    title: "Konstruieren und abbilden",
    englishTitle: "Construct and transform",
    italianTitle: "Costruire e trasformare",
    spanishTitle: "Construir y transformar",
    family: "construction-transformations",
    first: ["geometric-loci"],
    second: ["coordinate-transformations"],
  },
  {
    title: "Körper im Kopf bewegen",
    englishTitle: "Visualise solids in space",
    italianTitle: "Visualizzare solidi nello spazio",
    spanishTitle: "Visualizar sólidos en el espacio",
    family: "spatial-orientation",
    first: ["cube-nets"],
    second: ["spatial-rolling"],
  },
  {
    title: "Volumen und Oberfläche",
    englishTitle: "Volume and surface area",
    italianTitle: "Volume e area totale",
    spanishTitle: "Volumen y superficie",
    family: "solid-geometry",
    first: ["cuboid-surface"],
    second: ["cube-nets", "composite-areas"],
  },
] as const

const answerOnlyTopics = new Set<TopicId>([
  "integer-combinations",
  "number-constraints",
  "area-fractions",
  "geometric-loci",
  "coordinate-transformations",
  "cube-nets",
  "spatial-rolling",
])

export function isSupportedGeneratedMockBlueprintVersion(
  version: unknown,
): version is GeneratedMockBlueprintVersion {
  return version === LEGACY_MOCK_BLUEPRINT_VERSION || version === MOCK_BLUEPRINT_VERSION
    || version === FIXED_BAND_MOCK_BLUEPRINT_VERSION || version === VARIABLE_BAND_MOCK_BLUEPRINT_VERSION
    || version === FULL_ORIENTATION_MOCK_BLUEPRINT_VERSION
    || version === ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION
}

function examId(seed: string, version: GeneratedMockBlueprintVersion): string {
  return `generated-mock:${version}:${seed}`
}

export function buildGeneratedMockBlueprint(
  seed: string,
  version: GeneratedMockBlueprintVersion = MOCK_BLUEPRINT_VERSION,
  contentLocale: LearningLocale = "de",
): MockExamBlueprint {
  const tasks = blueprintSlots.map((slot, index): MockExamTaskBlueprint => {
    const random = createRandom(`${seed}:slot:${index}`)
    const taskId = `${examId(seed, version)}:task:${index + 1}`
    const firstTopicPool: readonly TopicId[] =
      version === MOCK_BLUEPRINT_VERSION && slot.family === "planar-geometry"
        ? ["fraction-of-quantity", ...slot.first]
        : slot.first
    const firstTopic = pick(random, firstTopicPool)
    const secondTopic = pick(random, slot.second)
    const generation = version === LEGACY_MOCK_BLUEPRINT_VERSION
      ? undefined
      : {
          version: version === FIXED_BAND_MOCK_BLUEPRINT_VERSION
            ? 2 as const
            : version === VARIABLE_BAND_MOCK_BLUEPRINT_VERSION
              ? 3 as const
              : version === FULL_ORIENTATION_MOCK_BLUEPRINT_VERSION
                ? 4 as const
                : version === ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION
                  ? 5 as const
                  : 6 as const,
          difficultyBand: "exam" as const,
        }

    return {
      kind: "generated",
      id: taskId,
      taskNumber: index + 1,
      title: contentLocale === "en"
        ? slot.englishTitle
        : contentLocale === "it"
          ? slot.italianTitle
          : contentLocale === "es"
            ? slot.spanishTitle
            : slot.title,
      family: slot.family,
      maxPoints: 4,
      parts: [
        {
          kind: "generated",
          id: `${taskId}:part:a`,
          label: "a",
          topicId: firstTopic,
          seed: `${seed}:task:${index + 1}:part:a:${firstTopic}`,
          maxPoints: 2,
          contentLocale,
          ...(generation ? { generation } : {}),
        },
        {
          kind: "generated",
          id: `${taskId}:part:b`,
          label: "b",
          topicId: secondTopic,
          seed: `${seed}:task:${index + 1}:part:b:${secondTopic}`,
          maxPoints: 2,
          contentLocale,
          ...(generation ? { generation } : {}),
        },
      ],
    }
  })

  return {
    kind: "generated",
    id: examId(seed, version),
    seed,
    version,
    contentLocale,
    title: contentLocale === "en"
      ? "Generated ZAP exam"
      : contentLocale === "it"
        ? "Esame ZAP generato"
        : contentLocale === "es"
          ? "Examen ZAP generado"
          : "Generierte ZAP-Prüfung",
    durationSeconds: FULL_MOCK_DURATION_SECONDS,
    maxPoints: MOCK_MAX_POINTS,
    tasks,
  }
}

export function generateMockPartQuestion(part: MockExamPartBlueprint): GeneratedQuestion {
  return generateQuestion(part.topicId, part.seed, part.id, part.generation, part.contentLocale ?? "de")
}

export function createActiveMockExam(
  seed: string,
  now = new Date(),
  durationSeconds = FULL_MOCK_DURATION_SECONDS,
  blueprintVersion: GeneratedMockBlueprintVersion = MOCK_BLUEPRINT_VERSION,
  contentLocale: LearningLocale = "de",
): ActiveMockExam {
  if (!Number.isInteger(durationSeconds) || durationSeconds <= 0) {
    throw new Error("A mock exam needs a positive whole-second duration.")
  }
  const blueprint = buildGeneratedMockBlueprint(seed, blueprintVersion, contentLocale)
  const startedAt = now.toISOString()
  const deadlineAt = new Date(now.getTime() + durationSeconds * 1000).toISOString()

  return {
    schemaVersion: 1,
    kind: "mock-exam",
    source: "generated",
    id: blueprint.id,
    seed,
    blueprintVersion,
    contentLocale,
    durationSeconds,
    startedAt,
    deadlineAt,
    updatedAt: startedAt,
    currentTaskIndex: 0,
    progress: blueprint.tasks.map((task, index) => ({
      taskId: task.id,
      visited: index === 0,
      visitCount: index === 0 ? 1 : 0,
      flagged: false,
      activeSeconds: 0,
      parts: task.parts.map((part) => ({
        partId: part.id,
        answer: "",
        working: "",
      })),
    })),
  }
}

export function isReplayableMockExam(exam: ActiveMockExam): boolean {
  if (exam.source === "official-archive") {
    const blueprint = resolveOfficialExamBlueprint(exam)
    return Boolean(blueprint && isReplayableOfficialExam(exam, blueprint))
  }
  if (
    exam.schemaVersion !== 1 ||
    exam.kind !== "mock-exam" ||
    !isSupportedGeneratedMockBlueprintVersion(exam.blueprintVersion) ||
    !Number.isInteger(exam.durationSeconds) ||
    exam.durationSeconds <= 0 ||
    !Number.isInteger(exam.currentTaskIndex) ||
    exam.currentTaskIndex < 0 ||
    exam.currentTaskIndex >= MOCK_TASK_COUNT ||
    !Number.isFinite(Date.parse(exam.startedAt)) ||
    !Number.isFinite(Date.parse(exam.deadlineAt)) ||
    Date.parse(exam.deadlineAt) - Date.parse(exam.startedAt) !== exam.durationSeconds * 1000
  ) {
    return false
  }

  const blueprint = buildGeneratedMockBlueprint(exam.seed, exam.blueprintVersion, exam.contentLocale ?? "de")
  return Boolean(
    exam.id === blueprint.id &&
    exam.progress.length === blueprint.tasks.length &&
    exam.progress.every((task, taskIndex) => (
      task.taskId === blueprint.tasks[taskIndex]?.id &&
      task.parts.length === blueprint.tasks[taskIndex]?.parts.length &&
      task.parts.every((part, partIndex) => (
        part.partId === blueprint.tasks[taskIndex]?.parts[partIndex]?.id
      ))
    ))
  )
}

export function resolveStrictExamBlueprint(exam: ActiveMockExam): StrictExamBlueprint {
  if (exam.source === "official-archive") {
    const blueprint = resolveOfficialExamBlueprint(exam)
    if (!blueprint) throw new Error("This official exam edition is not supported.")
    return blueprint
  }
  if (!isSupportedGeneratedMockBlueprintVersion(exam.blueprintVersion)) {
    throw new Error("This generated exam blueprint is not supported.")
  }
  return buildGeneratedMockBlueprint(exam.seed, exam.blueprintVersion, exam.contentLocale ?? "de")
}

export function isStrictExamTaskAnswered(
  task: StrictExamTaskBlueprint,
  progress: MockTaskProgress,
): boolean {
  return task.kind === "official"
    ? isOfficialTaskAnswered(task, progress)
    : isMockTaskAnswered(task, progress)
}

export function gradeStrictExam(
  exam: ActiveMockExam,
  submissionReason: MockSubmissionReason,
  submittedAt = new Date(),
): MockExamResult {
  return exam.source === "official-archive"
    ? gradeSupportedOfficialExam(exam, submissionReason, submittedAt)
    : gradeMockExam(exam, submissionReason, submittedAt)
}

export function remainingMockSeconds(exam: ActiveMockExam, now = new Date()): number {
  return Math.max(0, Math.ceil((Date.parse(exam.deadlineAt) - now.getTime()) / 1000))
}

export function isMockExpired(exam: ActiveMockExam, now = new Date()): boolean {
  return remainingMockSeconds(exam, now) === 0
}

export function mockPartRequiresMethod(question: GeneratedQuestion): boolean {
  return (
    !question.geometryConstruction &&
    question.response.kind !== "choice" &&
    question.response.kind !== "integer-set" &&
    !answerOnlyTopics.has(question.topicId)
  )
}

export function isMockPartAnswered(question: GeneratedQuestion, answer: string): boolean {
  if (question.response.kind === "coordinate") return Boolean(parseCoordinateAnswer(answer))
  return Boolean(answer.trim())
}

export function isMockTaskAnswered(
  task: MockExamTaskBlueprint,
  progress: MockTaskProgress,
): boolean {
  return task.parts.every((part, index) => {
    const draft = progress.parts[index]
    return Boolean(draft && isMockPartAnswered(generateMockPartQuestion(part), draft.answer))
  })
}

function gradePart(
  task: MockExamTaskBlueprint,
  part: MockExamPartBlueprint,
  draft: MockPartDraft,
): MockExamPartResult {
  const question = generateMockPartQuestion(part)
  const answerCorrect = question.geometryConstruction
    ? gradeGeometryConstruction(
        question.geometryConstruction,
        decodeGeometryConstructionAnswer(draft.answer),
      ).correct
    : isCorrectAnswer(question, draft.answer)
  const methodRequired = mockPartRequiresMethod(question)
  const hasWorking = Boolean(draft.working.trim())
  const certainPoints = answerCorrect && !methodRequired ? part.maxPoints : 0
  const reviewablePoints = answerCorrect && methodRequired && hasWorking ? part.maxPoints : 0

  return {
    partId: part.id,
    taskId: task.id,
    topicId: part.topicId,
    answer: draft.answer,
    working: draft.working,
    answerCorrect,
    methodRequired,
    maxPoints: part.maxPoints,
    certainPoints,
    reviewablePoints,
    confidence: reviewablePoints > 0 ? "manual" : "certain",
  }
}

export function gradeMockExam(
  exam: ActiveMockExam,
  submissionReason: MockSubmissionReason,
  submittedAt = new Date(),
): MockExamResult {
  if (!isSupportedGeneratedMockBlueprintVersion(exam.blueprintVersion)) {
    throw new Error("This mock blueprint version is not supported.")
  }
  const blueprint = buildGeneratedMockBlueprint(exam.seed, exam.blueprintVersion, exam.contentLocale ?? "de")
  const taskResults = blueprint.tasks.map((task, index): MockExamTaskResult => {
    const progress = exam.progress[index]
    if (!progress || progress.taskId !== task.id) {
      throw new Error(`Mock progress is missing task ${task.taskNumber}.`)
    }
    const parts = task.parts.map((part, partIndex) => {
      const draft = progress.parts[partIndex]
      if (!draft || draft.partId !== part.id) {
        throw new Error(`Mock progress is missing task ${task.taskNumber}${part.label}.`)
      }
      return gradePart(task, part, draft)
    })

    return {
      taskId: task.id,
      taskNumber: task.taskNumber,
      title: task.title,
      maxPoints: task.maxPoints,
      certainPoints: parts.reduce((sum, result) => sum + result.certainPoints, 0),
      reviewablePoints: parts.reduce((sum, result) => sum + result.reviewablePoints, 0),
      activeSeconds: progress.activeSeconds,
      visitCount: progress.visitCount,
      flagged: progress.flagged,
      parts,
    }
  })

  const weakness = new Map<TopicId, number>()
  for (const task of taskResults) {
    for (const part of task.parts) {
      const weight = !part.answerCorrect ? 3 : part.methodRequired && !part.working.trim() ? 2 : 0
      if (weight > 0) weakness.set(part.topicId, (weakness.get(part.topicId) ?? 0) + weight)
    }
  }
  const recoveryTopicIds = [...weakness.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([topicId]) => topicId)

  const elapsedSeconds = Math.max(
    1,
    Math.round((submittedAt.getTime() - Date.parse(exam.startedAt)) / 1000),
  )

  return {
    id: `result:${exam.id}:${submittedAt.toISOString()}`,
    source: "generated",
    title: blueprint.title,
    seed: exam.seed,
    blueprintVersion: exam.blueprintVersion,
    contentLocale: exam.contentLocale ?? "de",
    startedAt: exam.startedAt,
    submittedAt: submittedAt.toISOString(),
    submissionReason,
    durationSeconds: Math.min(exam.durationSeconds, elapsedSeconds),
    maxPoints: blueprint.maxPoints,
    certainPoints: taskResults.reduce((sum, task) => sum + task.certainPoints, 0),
    reviewablePoints: taskResults.reduce((sum, task) => sum + task.reviewablePoints, 0),
    taskResults,
    recoveryTopicIds,
  }
}
