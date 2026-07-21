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
  isOfficialExamEdition,
  type OfficialExamBlueprint,
  type OfficialExamPartBlueprint,
  type OfficialExamTaskBlueprint,
  type OfficialResponseSpec,
} from "./officialExam"
import {
  OFFICIAL_2024_MATH_GRADE_SCALE_ID,
  official2024MathematicsGrade,
} from "./officialGradeScale"
import type { ActiveMockExam } from "./mockExam"
import {
  OFFICIAL_2024_EDITION_ID,
  officialArchiveCatalog,
  type OfficialArchiveDocumentDefinition,
  type OfficialArchiveDocumentKind,
} from "./officialArchiveCatalog"

export { OFFICIAL_2024_EDITION_ID } from "./officialArchiveCatalog"

export const OFFICIAL_2024_RUBRIC_VERSION = "2024-v1" as const
export const OFFICIAL_2024_BLUEPRINT_VERSION = 1 as const
export const OFFICIAL_2024_DURATION_SECONDS = 60 * 60
export const OFFICIAL_2024_MAX_POINTS = 36
export const OFFICIAL_2024_TASK_COUNT = 9

export const official2024Documents: Record<OfficialArchiveDocumentKind, OfficialArchiveDocumentDefinition> =
  officialArchiveCatalog[OFFICIAL_2024_EDITION_ID].documents

export interface OfficialExam2024Blueprint extends OfficialExamBlueprint {
  id: typeof OFFICIAL_2024_EDITION_ID
  editionId: typeof OFFICIAL_2024_EDITION_ID
  year: 2024
  rubricVersion: typeof OFFICIAL_2024_RUBRIC_VERSION
  version: typeof OFFICIAL_2024_BLUEPRINT_VERSION
  durationSeconds: typeof OFFICIAL_2024_DURATION_SECONDS
  maxPoints: typeof OFFICIAL_2024_MAX_POINTS
}

const taskId = (taskNumber: number) => `${OFFICIAL_2024_EDITION_ID}:task:${taskNumber}`

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

const text = (
  answerLabel: string,
  placeholder: string,
  multiline = false,
): OfficialResponseSpec => ({
  kind: "text",
  answerLabel,
  placeholder,
  multiline,
})

const official2024Tasks: readonly OfficialExamTaskBlueprint[] = [
  {
    kind: "official",
    id: taskId(1),
    taskNumber: 1,
    title: "Geschickt rechnen",
    family: "efficient-arithmetic",
    maxPoints: 4,
    taskPage: 3,
    solutionPages: [3],
    rubricSummary: [
      "Endresultat: 4649.4.",
      "Der verständliche Lösungsweg nutzt, dass sich das erste und dritte Produkt aufheben; ein richtiges Endresultat ohne verständlichen Weg erhält gemäss Bewertungsgrundsätzen keine Punkte.",
    ],
    parts: [
      part(1, "", "efficient-arithmetic", 4, {
        kind: "number",
        value: 4649.4,
        answerLabel: "Endresultat",
      }),
    ],
  },
  {
    kind: "official",
    id: taskId(2),
    taskNumber: 2,
    title: "Parallelogramme im Koordinatensystem",
    family: "coordinate-transformations",
    maxPoints: 4,
    taskPage: 4,
    solutionPages: [4],
    rubricSummary: [
      "Teil a: A(5/2), B(7/5) und C(4/4) eintragen (1 Punkt).",
      "Teil b: D₁(2/1), D₂(8/3) und D₃(6/7) (3 Punkte). Falsche Punkte aus a verhindern die drei Punkte in b nicht.",
    ],
    parts: [
      part(2, "a", "coordinate-transformations", 1, text("Eingetragene Punkte A, B und C", "z. B. A(5|2), B(7|5), C(4|4)"), false),
      part(2, "b", "coordinate-transformations", 3, text("Gefundene Punkte D₁, D₂ und D₃", "z. B. D₁(2|1), D₂(8|3), D₃(6|7)"), false),
    ],
  },
  {
    kind: "official",
    id: taskId(3),
    taskNumber: 3,
    title: "Parkgebühren vergleichen",
    family: "money-calculations",
    maxPoints: 4,
    taskPage: 5,
    solutionPages: [5],
    rubricSummary: [
      "Teil a: Für 12 Stunden kosten Zentrum 22.50 Fr. und Am Fluss 17.20 Fr. (2 Punkte).",
      "Teil b: Mit 10 Fr. sind im Zentrum 7 h und am Fluss 6 h möglich (2 Punkte).",
    ],
    parts: [
      part(3, "a", "money-calculations", 2, text("Kosten bei beiden Parkhäusern", "Zentrum: … Fr. · Am Fluss: … Fr.")),
      part(3, "b", "money-calculations", 2, text("Parkdauer bei beiden Parkhäusern", "Zentrum: … h · Am Fluss: … h")),
    ],
  },
  {
    kind: "official",
    id: taskId(4),
    taskNumber: 4,
    title: "Anteile und Zahlenstrahl",
    family: "area-fractions",
    maxPoints: 4,
    taskPage: 6,
    solutionPages: [6],
    rubricSummary: [
      "Teil a: weiss 1/5, grau 1/2 und schwarz 3/10 (2 Punkte).",
      "Teil b: Abstand 1/24 und Markierung bei 5/6 (2 Punkte).",
    ],
    parts: [
      part(4, "a", "area-fractions", 2, text("Drei Farbanteile", "weiss: … · grau: … · schwarz: …"), false),
      part(4, "b", "number-constraints", 2, text("Abstand und markierter Bruch", "Abstand: … · Markierung: …"), false),
    ],
  },
  {
    kind: "official",
    id: taskId(5),
    taskNumber: 5,
    title: "Markus und Susanne unterwegs",
    family: "speed-distance-time",
    maxPoints: 4,
    taskPage: 7,
    solutionPages: [7],
    rubricSummary: [
      "Endresultat: 8 h 20 min; gleichwertig sind 8⅓ h oder 500 min.",
      "Der Lösungsweg bestimmt zuerst 720 km für die ersten drei Tage, danach 150 km Restdistanz und Susannes Geschwindigkeit von 18 km/h.",
    ],
    parts: [
      part(5, "", "speed-distance-time", 4, text("Benötigte Fahrzeit", "z. B. 8 h 20 min")),
    ],
  },
  {
    kind: "official",
    id: taskId(6),
    taskNumber: 6,
    title: "Umfang zusammengesetzter Flächen",
    family: "composite-areas",
    maxPoints: 4,
    taskPage: 8,
    solutionPages: [8],
    rubricSummary: [
      "Teil a: Laras Umfang beträgt 37 m (3 Punkte); die benötigten Seitenlängen sind 3 m, 4 m, 1.5 m und 10 m.",
      "Teil b: Emils Umfang beträgt 60 m (1 Punkt).",
    ],
    parts: [
      part(6, "a", "composite-areas", 3, { kind: "number", value: 37, answerLabel: "Laras Umfang", unit: "m" }),
      part(6, "b", "composite-areas", 1, { kind: "number", value: 60, answerLabel: "Emils Umfang", unit: "m" }),
    ],
  },
  {
    kind: "official",
    id: taskId(7),
    taskNumber: 7,
    title: "Würfelansichten ergänzen",
    family: "spatial-orientation",
    maxPoints: 4,
    taskPage: 9,
    solutionPages: [9],
    rubricSummary: [
      "Vier Würfelbilder a–d werden direkt mit der Lösung verglichen; Schwarz/Weiss und die Pfeilrichtung müssen eindeutig sein.",
      "Bei b gilt die Teilaufgabe als falsch, wenn nicht klar ist, wohin der Pfeil zeigt oder ob eine Figur weiss oder schwarz ist.",
    ],
    parts: [
      part(7, "", "cube-nets", 4, {
        kind: "paper",
        answerLabel: "Alle vier Würfelansichten auf dem Aufgabenblatt ergänzt",
        hint: "Die vier Zeichnungen werden nach der Abgabe direkt mit dem Korrekturschema verglichen.",
      }, false),
    ],
  },
  {
    kind: "official",
    id: taskId(8),
    taskNumber: 8,
    title: "Proportionale Wertepaare prüfen",
    family: "data-tables",
    maxPoints: 4,
    taskPage: 10,
    solutionPages: [10],
    rubricSummary: [
      "Teil a: Das dritte Wertepaar ist falsch; der korrigierte Wert ist 12 kg (2 Punkte).",
      "Teil b: Das erste Wertepaar ist falsch; der korrigierte Wert ist 200 km (2 Punkte). Andere korrekte Lösungswege sind möglich.",
    ],
    parts: [
      part(8, "a", "data-tables", 2, text("Falsches Wertepaar und Korrektur", "z. B. drittes Paar; 12 kg")),
      part(8, "b", "data-tables", 2, text("Falsches Wertepaar und Korrektur", "z. B. erstes Paar; 200 km")),
    ],
  },
  {
    kind: "official",
    id: taskId(9),
    taskNumber: 9,
    title: "Zahlenmauern",
    family: "number-constraints",
    maxPoints: 4,
    taskPage: 11,
    solutionPages: [11],
    rubricSummary: [
      "Teil a: 777, 434 und 344 (1 Punkt).",
      "Teil b: 212, 221, 324 und 757 (3 Punkte); der Lösungsweg grenzt die vier möglichen Ziffernkombinationen systematisch ein.",
    ],
    parts: [
      part(9, "a", "number-constraints", 1, text("Fehlende Zahlen", "777, 434, 344"), false),
      part(9, "b", "number-constraints", 3, text("Fehlende Zahlen und Begründung", "212, 221, 324, 757", true)),
    ],
  },
] as const

export const officialExam2024Blueprint: OfficialExam2024Blueprint = {
  kind: "official",
  id: OFFICIAL_2024_EDITION_ID,
  editionId: OFFICIAL_2024_EDITION_ID,
  title: "ZAP 1 Mathematik 2024 – offizielle Wiederholung",
  year: 2024,
  rubricVersion: OFFICIAL_2024_RUBRIC_VERSION,
  version: OFFICIAL_2024_BLUEPRINT_VERSION,
  durationSeconds: OFFICIAL_2024_DURATION_SECONDS,
  maxPoints: OFFICIAL_2024_MAX_POINTS,
  tasks: official2024Tasks,
  review: {
    rubricLabel: "Korrekturschema 2024",
    rubricDetail: "Bewertungsgrundsätze vom Original",
    precheckMode: "manual-only",
  },
  grade: {
    status: "verified",
    label: "Notenskala LG 2024",
    detail: "Offizielle Mathematikskala · nicht Gesamtnote",
  },
}

export function createActiveOfficialExam2024(
  seed: string,
  now = new Date(),
  durationSeconds = OFFICIAL_2024_DURATION_SECONDS,
): ActiveMockExam {
  return createActiveOfficialExam(officialExam2024Blueprint, seed, now, durationSeconds)
}

export function isOfficialExam2024(exam: ActiveMockExam): boolean {
  return isOfficialExamEdition(exam, OFFICIAL_2024_EDITION_ID)
}

function normalizedNumber(answer: string): number | undefined {
  const match = answer.trim().replace(",", ".").match(/^([-+]?\d+(?:\.\d+)?)/u)
  if (!match) return undefined
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

function previewAnswerCorrect(partBlueprint: OfficialExamPartBlueprint, answer: string): boolean {
  if (partBlueprint.response.kind !== "number") return false
  const value = normalizedNumber(answer)
  return value !== undefined && Math.abs(value - partBlueprint.response.value) < 1e-9
}

/**
 * The published 2024 scheme explains solutions and global correction rules but
 * does not encode safe, machine-applicable point floors for every task. The
 * preview may recognize a numeric final answer, but all 36 points remain human.
 */
export function gradeOfficialExam2024(
  exam: ActiveMockExam,
  submissionReason: MockSubmissionReason,
  submittedAt = new Date(),
): MockExamResult {
  if (!isOfficialExam2024(exam)) throw new Error("This is not the supported official 2024 exam.")

  const taskResults = officialExam2024Blueprint.tasks.map((task, taskIndex): MockExamTaskResult => {
    const progress = exam.progress[taskIndex]
    if (!progress || progress.taskId !== task.id) {
      throw new Error(`Official progress is missing task ${task.taskNumber}.`)
    }
    const parts = task.parts.map((taskPart, partIndex): MockExamPartResult => {
      const draft = progress.parts[partIndex]
      if (!draft || draft.partId !== taskPart.id) {
        throw new Error(`Official progress is missing task ${task.taskNumber}${taskPart.label}.`)
      }
      return {
        partId: taskPart.id,
        taskId: task.id,
        topicId: taskPart.topicId,
        answer: draft.answer,
        working: draft.working,
        answerCorrect: previewAnswerCorrect(taskPart, draft.answer),
        methodRequired: taskPart.methodRequired,
        maxPoints: taskPart.maxPoints,
        certainPoints: 0,
        reviewablePoints: taskPart.maxPoints,
        confidence: "manual",
      }
    })
    return {
      taskId: task.id,
      taskNumber: task.taskNumber,
      title: task.title,
      maxPoints: task.maxPoints,
      certainPoints: 0,
      reviewablePoints: task.maxPoints,
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
    title: officialExam2024Blueprint.title,
    editionId: OFFICIAL_2024_EDITION_ID,
    rubricVersion: OFFICIAL_2024_RUBRIC_VERSION,
    seed: exam.seed,
    blueprintVersion: exam.blueprintVersion,
    startedAt: exam.startedAt,
    submittedAt: submittedAt.toISOString(),
    submissionReason,
    durationSeconds: Math.min(exam.durationSeconds, elapsedSeconds),
    maxPoints: OFFICIAL_2024_MAX_POINTS,
    certainPoints: 0,
    reviewablePoints: OFFICIAL_2024_MAX_POINTS,
    taskResults,
    recoveryTopicIds: [],
    officialReview: {
      editionId: OFFICIAL_2024_EDITION_ID,
      rubricVersion: OFFICIAL_2024_RUBRIC_VERSION,
      status: "pending",
      taskScores: Array.from({ length: OFFICIAL_2024_TASK_COUNT }, () => null),
    },
  }
}

export function completeOfficialExam2024Review(
  result: MockExamResult,
  taskScores: readonly number[],
  completedAt = new Date(),
): MockExamResult {
  return completeOfficialExamReview(
    result,
    officialExam2024Blueprint,
    taskScores,
    {
      gradeScaleId: OFFICIAL_2024_MATH_GRADE_SCALE_ID,
      mathematicsGrade: official2024MathematicsGrade,
    },
    completedAt,
  )
}
