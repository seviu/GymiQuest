import type {
  MockExamPartResult,
  MockExamResult,
  MockExamTaskResult,
  MockSubmissionReason,
  TopicId,
} from "./model"
import {
  completeOfficialExamReview,
  createActiveOfficialExam,
  decodeOfficialMatchingAnswers,
  isOfficialExamEdition,
  type OfficialExamBlueprint,
  type OfficialExamPartBlueprint,
  type OfficialExamTaskBlueprint,
  type OfficialResponseSpec,
} from "./officialExam"
import type { ActiveMockExam } from "./mockExam"
import {
  OFFICIAL_2015_EDITION_ID,
  officialArchiveCatalog,
  type OfficialArchiveDocumentDefinition,
  type OfficialArchiveDocumentKind,
} from "./officialArchiveCatalog"

export { OFFICIAL_2015_EDITION_ID } from "./officialArchiveCatalog"

export const OFFICIAL_2015_RUBRIC_VERSION = "2015-v1" as const
export const OFFICIAL_2015_BLUEPRINT_VERSION = 1 as const
export const OFFICIAL_2015_DURATION_SECONDS = 60 * 60
export const OFFICIAL_2015_MAX_POINTS = 36
export const OFFICIAL_2015_TASK_COUNT = 9

export const official2015Documents: Record<OfficialArchiveDocumentKind, OfficialArchiveDocumentDefinition> =
  officialArchiveCatalog[OFFICIAL_2015_EDITION_ID].documents

export interface OfficialExam2015Blueprint extends OfficialExamBlueprint {
  id: typeof OFFICIAL_2015_EDITION_ID
  editionId: typeof OFFICIAL_2015_EDITION_ID
  year: 2015
  rubricVersion: typeof OFFICIAL_2015_RUBRIC_VERSION
  version: typeof OFFICIAL_2015_BLUEPRINT_VERSION
  durationSeconds: typeof OFFICIAL_2015_DURATION_SECONDS
  maxPoints: typeof OFFICIAL_2015_MAX_POINTS
}

const taskId = (taskNumber: number) => `${OFFICIAL_2015_EDITION_ID}:task:${taskNumber}`

const part = (
  taskNumber: number,
  label: string,
  topicId: TopicId,
  maxPoints: number,
  response: OfficialResponseSpec,
  methodRequired = true,
): OfficialExamPartBlueprint => ({
  kind: "official",
  id: `${taskId(taskNumber)}:part:${label || "all"}`,
  label,
  topicId,
  maxPoints,
  response,
  methodRequired,
  milestones: [],
})

const text = (answerLabel: string, placeholder: string): OfficialResponseSpec => ({
  kind: "text",
  answerLabel,
  placeholder,
})

const official2015Tasks: readonly OfficialExamTaskBlueprint[] = [
  {
    kind: "official",
    id: taskId(1),
    taskNumber: 1,
    title: "Zeit und Masse umrechnen",
    family: "unit-conversions",
    maxPoints: 4,
    taskPage: 2,
    solutionPages: [3],
    rubricSummary: [
      "Teil a: 20 min 2 s (2 Punkte). 459 s : 17 = 27 s oder eine der beiden gleichwertigen Einzelangaben ergibt 1 Punkt.",
      "Teil b: 1 kg 944 g (2 Punkte). 4.08 kg beziehungsweise 4080 g oder eine der beiden gleichwertigen Einzelangaben ergibt 1 Punkt.",
    ],
    parts: [
      part(1, "a", "time-fractions", 2, text("Zeitresultat", "z. B. 20 min 2 s")),
      part(1, "b", "mass-units", 2, text("Masseresultat", "z. B. 1 kg 944 g")),
    ],
  },
  {
    kind: "official",
    id: taskId(2),
    taskNumber: 2,
    title: "Brüche und Dezimalzahlen geschickt berechnen",
    family: "efficient-arithmetic",
    maxPoints: 4,
    taskPage: 2,
    solutionPages: [4],
    rubricSummary: [
      "Endresultat: 4.685 als Dezimalzahl.",
      "Die dokumentierten Stufen sind 29.28, 5.59 und 23.69; Teilpunkte hängen vom verständlichen Weg und der Anzahl korrekter Teilrechnungen ab.",
    ],
    parts: [
      part(2, "", "efficient-arithmetic", 4, { kind: "number", value: 4.685, answerLabel: "Endresultat" }),
    ],
  },
  {
    kind: "official",
    id: taskId(3),
    taskNumber: 3,
    title: "Fussballpreis aus Anteilen",
    family: "fraction-money",
    maxPoints: 4,
    taskPage: 3,
    solutionPages: [5],
    rubricSummary: [
      "Endresultat: Der Fussball ist 4 Fr. günstiger als erwartet.",
      "Die Originalkorrektur vergibt Teilpunkte unter anderem für 36 Fr. verbraucht, 48 Fr. Rest, 32 Fr. geplant, 28 Fr. tatsächlich oder einen richtigen Weg mit genau einem Rechenfehler.",
    ],
    parts: [
      part(3, "", "money-calculations", 4, { kind: "number", value: 4, answerLabel: "Preisunterschied", unit: "Fr." }),
    ],
  },
  {
    kind: "official",
    id: taskId(4),
    taskNumber: 4,
    title: "200-Meter-Lauf vergleichen",
    family: "speed-distance-time",
    maxPoints: 4,
    taskPage: 3,
    solutionPages: [6],
    rubricSummary: [
      "Endresultat: Stefanie ist noch 25 m vom Ziel entfernt.",
      "Die Originalkorrektur staffelt unter anderem über 200 m in 35 s und 40 s, 5 s Zeitunterschied oder 175 m für Stefanie.",
    ],
    parts: [
      part(4, "", "speed-distance-time", 4, { kind: "number", value: 25, answerLabel: "Entfernung zur Ziellinie", unit: "m" }),
    ],
  },
  {
    kind: "official",
    id: taskId(5),
    taskNumber: 5,
    title: "Umfang einer Rechteckfigur",
    family: "composite-perimeter",
    maxPoints: 4,
    taskPage: 4,
    solutionPages: [7],
    rubricSummary: [
      "Endresultat: 72 cm mit Einheit.",
      "Dokumentierte Teilstufen sind unter anderem Umfang D = 33 cm, Breite B = 7.5 cm, Höhe E = 2.5 cm, Breite C = 5 cm und Gesamtbreite 24.5 cm.",
    ],
    parts: [
      part(5, "", "composite-areas", 4, { kind: "number", value: 72, answerLabel: "Umfang der Gesamtfigur", unit: "cm" }),
    ],
  },
  {
    kind: "official",
    id: taskId(6),
    taskNumber: 6,
    title: "Weinflaschen zählen",
    family: "proportional-revenue",
    maxPoints: 4,
    taskPage: 5,
    solutionPages: [8],
    rubricSummary: [
      "Endresultat: insgesamt 980 Flaschen.",
      "Die dokumentierten Stufen sind 6300 Fr. für mittlere und kleine Flaschen, 21 Fr. pro Paket, 300 Pakete, 600 mittlere und 300 kleine Flaschen.",
    ],
    parts: [
      part(6, "", "proportional-revenue", 4, { kind: "number", value: 980, answerLabel: "Anzahl Flaschen", unit: "Flaschen" }),
    ],
  },
  {
    kind: "official",
    id: taskId(7),
    taskNumber: 7,
    title: "Alter über vier Generationen",
    family: "number-constraints",
    maxPoints: 4,
    taskPage: 5,
    solutionPages: [9],
    rubricSummary: [
      "Endresultat: Die Urgrossmutter ist 98 Jahre alt.",
      "Teilpunktstufen sind Livia = 12, Mutter = 39, Altersunterschied = 27 und Grossmutter = 71 Jahre beziehungsweise ein richtiger Weg mit genau einem Rechenfehler.",
    ],
    parts: [
      part(7, "", "number-constraints", 4, { kind: "number", value: 98, answerLabel: "Alter der Urgrossmutter", unit: "Jahre" }),
    ],
  },
  {
    kind: "official",
    id: taskId(8),
    taskNumber: 8,
    title: "Flugreichweite aus Gewichtsanteilen",
    family: "fraction-proportion",
    maxPoints: 4,
    taskPage: 6,
    solutionPages: [10],
    rubricSummary: [
      "Endresultat: 3120 km mit korrekter Einheit.",
      "Die Originalkorrektur berücksichtigt unter anderem 6.75 t Passagiere, 18 t Starttreibstoff, 40.5 t Landegewicht, 13.5 t Verbrauch, 4.5 t Rest und 780 km Zusatzreichweite.",
    ],
    parts: [
      part(8, "", "fraction-of-quantity", 4, { kind: "number", value: 3120, answerLabel: "Maximale Flugstrecke", unit: "km" }),
    ],
  },
  {
    kind: "official",
    id: taskId(9),
    taskNumber: 9,
    title: "Würfelnetze zuordnen",
    family: "cube-net-matching",
    maxPoints: 4,
    taskPage: 7,
    solutionPages: [11],
    rubricSummary: [
      "Zusammen gehören Netz 1 und Würfel D, Netz 2 und Würfel A sowie Netz 4 und Würfel C; Netz 3 und Würfel B bleiben übrig.",
      "Die Originalkorrektur bewertet nur die Paare: drei richtige = 4 Punkte; zwei richtige ohne falsches Paar = 3; zwei richtige mit einem falschen Paar = 2; ein richtiges Paar = 1.",
    ],
    parts: [
      part(9, "", "cube-nets", 4, {
        kind: "matching-grid",
        answerLabel: "Ordne jedem Netz einen Würfel oder «kein Paar» zu",
        fields: ["Netz 1", "Netz 2", "Netz 3", "Netz 4"],
        options: [
          { value: "A", label: "Würfel A" },
          { value: "B", label: "Würfel B" },
          { value: "C", label: "Würfel C" },
          { value: "D", label: "Würfel D" },
          { value: "none", label: "kein Paar" },
        ],
        expected: ["D", "A", "none", "C"],
      }, false),
    ],
  },
] as const

export const officialExam2015Blueprint: OfficialExam2015Blueprint = {
  kind: "official",
  id: OFFICIAL_2015_EDITION_ID,
  editionId: OFFICIAL_2015_EDITION_ID,
  title: "ZAP 1 Mathematik 2015 – offizielle Wiederholung",
  year: 2015,
  rubricVersion: OFFICIAL_2015_RUBRIC_VERSION,
  version: OFFICIAL_2015_BLUEPRINT_VERSION,
  durationSeconds: OFFICIAL_2015_DURATION_SECONDS,
  maxPoints: OFFICIAL_2015_MAX_POINTS,
  tasks: official2015Tasks,
  review: {
    rubricLabel: "Korrekturschema 2015",
    rubricDetail: "Originalschema mit Bewertungsgrundsätzen",
    precheckMode: "safe-floor",
  },
  grade: {
    status: "unavailable",
    label: "Offizielle Notenskala nicht verifiziert",
    detail: "Korrigierter Punktestand ohne Notenumrechnung",
  },
}

export function createActiveOfficialExam2015(
  seed: string,
  now = new Date(),
  durationSeconds = OFFICIAL_2015_DURATION_SECONDS,
): ActiveMockExam {
  return createActiveOfficialExam(officialExam2015Blueprint, seed, now, durationSeconds)
}

export function isOfficialExam2015(exam: ActiveMockExam): boolean {
  return isOfficialExamEdition(exam, OFFICIAL_2015_EDITION_ID)
}

function normalizedNumber(answer: string): number | undefined {
  const normalized = answer.trim().replace(/[’']/g, "").replace(",", ".")
  const match = normalized.match(/^([-+]?\d+(?:\.\d+)?)(?:\s*[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9²³.]*)?$/u)
  if (!match) return undefined
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

function previewAnswerCorrect(partBlueprint: OfficialExamPartBlueprint, answer: string): boolean {
  if (partBlueprint.response.kind !== "number") return false
  const value = normalizedNumber(answer)
  return value !== undefined && Math.abs(value - partBlueprint.response.value) < 1e-9
}

export interface Official2015CubeMatchScore {
  points: number
  correctPairs: number
  falsePairs: number
  unanswered: number
}

export function scoreOfficial2015CubeMatches(answer: string): Official2015CubeMatchScore {
  const response = officialExam2015Blueprint.tasks[8]!.parts[0]!.response
  if (response.kind !== "matching-grid") throw new Error("The 2015 cube matching response is missing.")
  const allowed = new Set(response.options.map(({ value }) => value))
  const values = decodeOfficialMatchingAnswers(answer, response.fields.length)
    .map((value) => allowed.has(value) ? value : "")
  let correctPairs = 0
  let falsePairs = 0
  let unanswered = 0
  values.forEach((value, index) => {
    if (!value) {
      unanswered += 1
    } else if (response.expected[index] !== "none" && value === response.expected[index]) {
      correctPairs += 1
    } else if (value !== "none") {
      falsePairs += 1
    }
  })
  const points = correctPairs === 3
    ? 4
    : correctPairs === 2
      ? falsePairs === 0 ? 3 : falsePairs === 1 ? 2 : 0
      : correctPairs === 1
        ? 1
        : 0
  return { points, correctPairs, falsePairs, unanswered }
}

function gradeOfficialPart(
  task: OfficialExamTaskBlueprint,
  taskPart: OfficialExamPartBlueprint,
  answer: string,
  working: string,
): MockExamPartResult {
  let answerCorrect = previewAnswerCorrect(taskPart, answer)
  let certainPoints = 0
  let reviewablePoints = taskPart.maxPoints

  if (task.taskNumber === 9 && taskPart.response.kind === "matching-grid") {
    const score = scoreOfficial2015CubeMatches(answer)
    certainPoints = score.points
    reviewablePoints = 0
    answerCorrect = score.points === taskPart.maxPoints
  }

  return {
    partId: taskPart.id,
    taskId: task.id,
    topicId: taskPart.topicId,
    answer,
    working,
    answerCorrect,
    methodRequired: taskPart.methodRequired,
    maxPoints: taskPart.maxPoints,
    certainPoints,
    reviewablePoints,
    confidence: reviewablePoints === 0 ? "certain" : "manual",
  }
}

export function gradeOfficialExam2015(
  exam: ActiveMockExam,
  submissionReason: MockSubmissionReason,
  submittedAt = new Date(),
): MockExamResult {
  if (!isOfficialExam2015(exam)) throw new Error("This is not the supported official 2015 exam.")

  const taskResults = officialExam2015Blueprint.tasks.map((task, taskIndex): MockExamTaskResult => {
    const progress = exam.progress[taskIndex]
    if (!progress || progress.taskId !== task.id) {
      throw new Error(`Official progress is missing task ${task.taskNumber}.`)
    }
    const parts = task.parts.map((taskPart, partIndex) => {
      const draft = progress.parts[partIndex]
      if (!draft || draft.partId !== taskPart.id) {
        throw new Error(`Official progress is missing task ${task.taskNumber}${taskPart.label}.`)
      }
      return gradeOfficialPart(task, taskPart, draft.answer, draft.working)
    })
    const certainPoints = parts.reduce((sum, result) => sum + result.certainPoints, 0)
    const reviewablePoints = parts.reduce((sum, result) => sum + result.reviewablePoints, 0)
    return {
      taskId: task.id,
      taskNumber: task.taskNumber,
      title: task.title,
      maxPoints: task.maxPoints,
      certainPoints,
      reviewablePoints,
      activeSeconds: progress.activeSeconds,
      visitCount: progress.visitCount,
      flagged: progress.flagged,
      parts,
    }
  })

  const elapsedSeconds = Math.max(1, Math.round((submittedAt.getTime() - Date.parse(exam.startedAt)) / 1_000))
  return {
    id: `result:${exam.id}:${submittedAt.toISOString()}`,
    source: "official-archive",
    title: officialExam2015Blueprint.title,
    editionId: OFFICIAL_2015_EDITION_ID,
    rubricVersion: OFFICIAL_2015_RUBRIC_VERSION,
    seed: exam.seed,
    blueprintVersion: exam.blueprintVersion,
    startedAt: exam.startedAt,
    submittedAt: submittedAt.toISOString(),
    submissionReason,
    durationSeconds: Math.min(exam.durationSeconds, elapsedSeconds),
    maxPoints: OFFICIAL_2015_MAX_POINTS,
    certainPoints: taskResults.reduce((sum, task) => sum + task.certainPoints, 0),
    reviewablePoints: taskResults.reduce((sum, task) => sum + task.reviewablePoints, 0),
    taskResults,
    recoveryTopicIds: [],
    officialReview: {
      editionId: OFFICIAL_2015_EDITION_ID,
      rubricVersion: OFFICIAL_2015_RUBRIC_VERSION,
      status: "pending",
      taskScores: Array.from({ length: OFFICIAL_2015_TASK_COUNT }, () => null),
    },
  }
}

export function completeOfficialExam2015Review(
  result: MockExamResult,
  taskScores: readonly number[],
  completedAt = new Date(),
): MockExamResult {
  return completeOfficialExamReview(
    result,
    officialExam2015Blueprint,
    taskScores,
    undefined,
    completedAt,
  )
}
