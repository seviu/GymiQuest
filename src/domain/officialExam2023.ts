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
  decodeOfficialTrueFalseAnswers,
  isOfficialExamEdition,
  type OfficialExamBlueprint,
  type OfficialExamPartBlueprint,
  type OfficialExamTaskBlueprint,
  type OfficialResponseSpec,
  type OfficialRubricMilestone,
} from "./officialExam"
import type { ActiveMockExam } from "./mockExam"
import {
  OFFICIAL_2023_EDITION_ID,
  officialArchiveCatalog,
  type OfficialArchiveDocumentDefinition,
  type OfficialArchiveDocumentKind,
} from "./officialArchiveCatalog"

export { OFFICIAL_2023_EDITION_ID } from "./officialArchiveCatalog"

export const OFFICIAL_2023_RUBRIC_VERSION = "2023-v1" as const
export const OFFICIAL_2023_BLUEPRINT_VERSION = 1 as const
export const OFFICIAL_2023_DURATION_SECONDS = 60 * 60
export const OFFICIAL_2023_MAX_POINTS = 36
export const OFFICIAL_2023_TASK_COUNT = 9

export const official2023Documents: Record<OfficialArchiveDocumentKind, OfficialArchiveDocumentDefinition> =
  officialArchiveCatalog[OFFICIAL_2023_EDITION_ID].documents

export interface OfficialExam2023Blueprint extends OfficialExamBlueprint {
  id: typeof OFFICIAL_2023_EDITION_ID
  editionId: typeof OFFICIAL_2023_EDITION_ID
  year: 2023
  rubricVersion: typeof OFFICIAL_2023_RUBRIC_VERSION
  version: typeof OFFICIAL_2023_BLUEPRINT_VERSION
  durationSeconds: typeof OFFICIAL_2023_DURATION_SECONDS
  maxPoints: typeof OFFICIAL_2023_MAX_POINTS
}

const taskId = (taskNumber: number) => `${OFFICIAL_2023_EDITION_ID}:task:${taskNumber}`

const milestone = (
  id: string,
  label: string,
  expected: number | readonly number[],
  unit?: string,
): OfficialRubricMilestone => ({
  id,
  label,
  expected: typeof expected === "number" ? [expected] : expected,
  ...(unit ? { unit } : {}),
})

const part = (
  taskNumber: number,
  label: string,
  topicId: TopicId,
  maxPoints: number,
  response: OfficialResponseSpec,
  methodRequired = true,
  milestones: readonly OfficialRubricMilestone[] = [],
): OfficialExamPartBlueprint => ({
  kind: "official",
  id: `${taskId(taskNumber)}:part:${label || "all"}`,
  label,
  topicId,
  maxPoints,
  response,
  methodRequired,
  milestones,
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

const official2023Tasks: readonly OfficialExamTaskBlueprint[] = [
  {
    kind: "official",
    id: taskId(1),
    taskNumber: 1,
    title: "Masse und Zeit ergänzen",
    family: "unit-and-time-fractions",
    maxPoints: 4,
    taskPage: 3,
    solutionPages: [3],
    rubricSummary: [
      "Teil a: 352 kg (2 Punkte); 704 kg als korrektes Zwischenresultat oder ein richtiger Weg mit genau einem Rechenfehler ergibt 1 Punkt.",
      "Teil b: 49 min (2 Punkte); 85 min als korrektes Zwischenresultat oder ein richtiger Weg mit genau einem Rechenfehler ergibt 1 Punkt.",
    ],
    parts: [
      part(1, "a", "mass-units", 2, { kind: "number", value: 352, answerLabel: "Fehlende Masse", unit: "kg" }, true, [
        milestone("remaining-mass-704", "Masse vor dem Halbieren", 704, "kg"),
      ]),
      part(1, "b", "time-fractions", 2, { kind: "number", value: 49, answerLabel: "Fehlende Zeit", unit: "min" }, true, [
        milestone("five-ninths-85", "Fünf Neuntel der Ausgangszeit", 85, "min"),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(2),
    taskNumber: 2,
    title: "Reisezeiten vergleichen",
    family: "speed-distance-time",
    maxPoints: 4,
    taskPage: 4,
    solutionPages: [4],
    rubricSummary: [
      "Teil a: 273 km mit korrekter Einheit (1 Punkt).",
      "Teil b: 400 km/h mit richtigem Weg (1 Punkt).",
      "Teil c: 40 min mit richtigem Weg (2 Punkte); 8 km in 5 min oder ein richtiger Weg mit genau einem Rechenfehler ergibt 1 Punkt.",
    ],
    parts: [
      part(2, "a", "speed-distance-time", 1, { kind: "number", value: 273, answerLabel: "Distanz Paris–Brüssel", unit: "km" }, false),
      part(2, "b", "speed-distance-time", 1, { kind: "number", value: 400, answerLabel: "Durchschnittsgeschwindigkeit", unit: "km/h" }),
      part(2, "c", "speed-distance-time", 2, { kind: "number", value: 40, answerLabel: "Eingesparte Zeit", unit: "min" }, true, [
        milestone("distance-in-five-minutes-8", "Distanz in 5 Minuten", 8, "km"),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(3),
    taskNumber: 3,
    title: "Flächenanteile in Gitternetzen",
    family: "area-fractions",
    maxPoints: 4,
    taskPage: 5,
    solutionPages: [5],
    rubricSummary: [
      "Teil a: A = 4/15 und B = 1/2, beide vollständig gekürzt (2 Punkte); eine korrekte Angabe oder beide unkürzbar richtige Angaben ergeben 1 Punkt.",
      "Teil b: 20 Häuschen und ein gültiges umschliessendes Rechteck (2 Punkte); Zahl oder Rechteck allein ergibt 1 Punkt.",
    ],
    parts: [
      part(3, "a", "area-fractions", 2, text("Bruchteile A und B", "A = 4/15 · B = 1/2"), false),
      part(3, "b1", "area-fractions", 1, { kind: "number", value: 20, answerLabel: "Anzahl Häuschen des Rechtecks" }, false),
      part(3, "b2", "area-fractions", 1, {
        kind: "paper",
        answerLabel: "Ein passendes Rechteck ist auf dem Aufgabenblatt eingezeichnet",
        hint: "Das Rechteck muss das vorgegebene graue Teilstück vollständig enthalten.",
      }, false),
    ],
  },
  {
    kind: "official",
    id: taskId(4),
    taskNumber: 4,
    title: "Richtig oder falsch ohne Ausrechnen",
    family: "efficient-arithmetic",
    maxPoints: 4,
    taskPage: 6,
    solutionPages: [6],
    rubricSummary: [
      "Die vier Antworten lauten richtig, falsch, richtig, falsch.",
      "Jede richtige Antwort gibt +1, jede falsche −1 und jede ausgelassene 0 Punkte; die Aufgabe hat mindestens 0 und höchstens 4 Punkte.",
    ],
    parts: [
      part(4, "", "efficient-arithmetic", 4, {
        kind: "true-false-grid",
        answerLabel: "Beurteile jede Aussage auf dem Aufgabenblatt",
        statements: ["Aussage 1", "Aussage 2", "Aussage 3", "Aussage 4"],
        expected: [true, false, true, false],
      }, false),
    ],
  },
  {
    kind: "official",
    id: taskId(5),
    taskNumber: 5,
    title: "Wachhund Rex konstruieren",
    family: "geometric-loci",
    maxPoints: 4,
    taskPage: 7,
    solutionPages: [7, 8],
    rubricSummary: [
      "Teil a: Die mit Zirkel konstruierte Mittelsenkrechte von F und K schneidet w im deutlich markierten Punkt P (1 Punkt).",
      "Teil b: Richtiger 20-m-Kreis, Hilfsgerade und Hilfspunkt Q, zweiter Kreis um die Hausecke und korrekt markiertes erreichbares Gebiet (3 Punkte).",
    ],
    parts: [
      part(5, "a", "geometric-loci", 1, {
        kind: "paper",
        answerLabel: "P ist mit Zirkel und Lineal auf dem Aufgabenblatt konstruiert",
        hint: "Lass die Hilfslinien der Mittelsenkrechten sichtbar.",
      }, false),
      part(5, "b", "geometric-loci", 3, {
        kind: "paper",
        answerLabel: "Das erreichbare Gebiet ist vollständig konstruiert und markiert",
        hint: "Die Originalkorrektur prüft Radius, Hilfsgerade, Q, zweiten Kreis und Gebiet getrennt.",
      }, false),
    ],
  },
  {
    kind: "official",
    id: taskId(6),
    taskNumber: 6,
    title: "Quadernetz verstehen",
    family: "cuboid-and-net",
    maxPoints: 4,
    taskPage: 8,
    solutionPages: [9],
    rubricSummary: [
      "Teil a: 8000 cm³ mit richtigem Weg (2 Punkte); die Seiten 40 cm und 25 cm oder ein richtiger Weg mit genau einem Rechenfehler ergeben 1 Punkt.",
      "Teil b: passende Klebekante k eindeutig markieren (1 Punkt). Teil c: beide weiteren Punkte E eindeutig markieren (1 Punkt).",
    ],
    parts: [
      part(6, "a", "cuboid-surface", 2, { kind: "number", value: 8000, answerLabel: "Volumen", unit: "cm³" }, true, [
        milestone("cuboid-length-40", "Länge des grossen Rechtecks", 40, "cm"),
        milestone("cuboid-width-25", "Breite des grossen Rechtecks", 25, "cm"),
      ]),
      part(6, "b", "cube-nets", 1, {
        kind: "paper",
        answerLabel: "Die passende zweite Kante k ist im Netz markiert",
      }, false),
      part(6, "c", "cube-nets", 1, {
        kind: "paper",
        answerLabel: "Die beiden weiteren Eckpunkte E sind im Netz markiert",
      }, false),
    ],
  },
  {
    kind: "official",
    id: taskId(7),
    taskNumber: 7,
    title: "Rechenquadrate ergänzen",
    family: "number-constraints",
    maxPoints: 4,
    taskPage: 9,
    solutionPages: [10],
    rubricSummary: [
      "Teil a: alle fünf fehlenden Zahlen korrekt (2 Punkte); 11 und 13 oder die linke obere Ecke 7 ergeben 1 Punkt.",
      "Teil b: alle sechs fehlenden Zahlen korrekt (2 Punkte); die obere graue 6 oder die oberen weissen Zahlen 1 und 5 ergeben 1 Punkt.",
    ],
    parts: [
      part(7, "a", "number-constraints", 2, text("Fünf eingetragene Zahlen", "z. B. nach Positionen beschrieben"), false),
      part(7, "b", "number-constraints", 2, text("Sechs eingetragene Zahlen", "z. B. nach Positionen beschrieben"), false),
    ],
  },
  {
    kind: "official",
    id: taskId(8),
    taskNumber: 8,
    title: "Gabel- und Messerpackungen",
    family: "integer-combinations",
    maxPoints: 4,
    taskPage: 10,
    solutionPages: [11],
    rubricSummary: [
      "156 Gabeln ergeben 4 Punkte; die Originalkorrektur erlaubt ausdrücklich das korrekte Endresultat durch systematisches Pröbeln auch ohne sichtbaren Lösungsweg.",
      "Teilpunkte sind unter anderem für kgV(4, 6) = 12, die 52 zusätzlichen Gabeln oder die passende 1/3- beziehungsweise 50%-Beziehung möglich.",
    ],
    parts: [
      part(8, "", "integer-combinations", 4, { kind: "number", value: 156, answerLabel: "Anzahl Gabeln", unit: "Gabeln" }, false, [
        milestone("lcm-12", "Kleinstes gemeinsames Vielfaches", 12),
        milestone("additional-forks-52", "Zusätzliche Gabeln", 52),
        milestone("fork-packages-39", "Packungen Gabeln", 39),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(9),
    taskNumber: 9,
    title: "Überlappende Rechtecke",
    family: "composite-areas",
    maxPoints: 4,
    taskPage: 11,
    solutionPages: [12],
    rubricSummary: [
      "Teil a: 18 cm² mit korrekter Einheit (1 Punkt).",
      "Teil b: 31.4 cm mit richtigem Weg und korrekter Einheit (3 Punkte); 7.2 cm, 4.5 cm und 1.5 cm bilden die dokumentierten Teilpunktstufen.",
    ],
    parts: [
      part(9, "a", "composite-areas", 1, { kind: "number", value: 18, answerLabel: "Flächeninhalt der Überlappung", unit: "cm²" }, false),
      part(9, "b", "composite-areas", 3, { kind: "number", value: 31.4, answerLabel: "Umfang der Gesamtfigur", unit: "cm" }, true, [
        milestone("large-rectangle-width-7.2", "Breite des grossen Rechtecks", 7.2, "cm"),
        milestone("overlap-width-4.5", "Breite der Überlappung", 4.5, "cm"),
        milestone("remaining-height-1.5", "Verbleibende Höhe", 1.5, "cm"),
      ]),
    ],
  },
] as const

export const officialExam2023Blueprint: OfficialExam2023Blueprint = {
  kind: "official",
  id: OFFICIAL_2023_EDITION_ID,
  editionId: OFFICIAL_2023_EDITION_ID,
  title: "ZAP 1 Mathematik 2023 – offizielle Wiederholung",
  year: 2023,
  rubricVersion: OFFICIAL_2023_RUBRIC_VERSION,
  version: OFFICIAL_2023_BLUEPRINT_VERSION,
  durationSeconds: OFFICIAL_2023_DURATION_SECONDS,
  maxPoints: OFFICIAL_2023_MAX_POINTS,
  tasks: official2023Tasks,
  review: {
    rubricLabel: "Korrekturschema 2023",
    rubricDetail: "Originalschema mit Punktabzug in Aufgabe 4",
    precheckMode: "safe-floor",
  },
  grade: {
    status: "unavailable",
    label: "Offizielle Notenskala nicht verifiziert",
    detail: "Korrigierter Punktestand ohne Notenumrechnung",
  },
}

export function createActiveOfficialExam2023(
  seed: string,
  now = new Date(),
  durationSeconds = OFFICIAL_2023_DURATION_SECONDS,
): ActiveMockExam {
  return createActiveOfficialExam(officialExam2023Blueprint, seed, now, durationSeconds)
}

export function isOfficialExam2023(exam: ActiveMockExam): boolean {
  return isOfficialExamEdition(exam, OFFICIAL_2023_EDITION_ID)
}

function normalizedNumber(answer: string): number | undefined {
  const normalized = answer.trim().replace(/[’']/g, "").replace(",", ".")
  const match = normalized.match(/^([-+]?\d+(?:\.\d+)?)(?:\s*[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9²³.]*)?$/u)
  if (!match) return undefined
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

function previewAnswerCorrect(partBlueprint: OfficialExamPartBlueprint, answer: string): boolean {
  if (partBlueprint.response.kind === "number") {
    const value = normalizedNumber(answer)
    return value !== undefined && Math.abs(value - partBlueprint.response.value) < 1e-9
  }
  if (partBlueprint.response.kind === "paper") return answer === "completed-on-paper"
  return false
}

function isExactForkAnswer(answer: string): boolean {
  return /^156(?:[.,]0*)?(?:\s+Gabeln)?$/iu.test(answer.trim())
}

export interface Official2023TrueFalseScore {
  points: number
  correctAnswers: number
  incorrectAnswers: number
  unanswered: number
}

export function scoreOfficial2023TrueFalse(answer: string): Official2023TrueFalseScore {
  const response = officialExam2023Blueprint.tasks[3]!.parts[0]!.response
  if (response.kind !== "true-false-grid") throw new Error("The 2023 truth-table response is missing.")
  const values = decodeOfficialTrueFalseAnswers(answer, response.expected.length)
  let correctAnswers = 0
  let incorrectAnswers = 0
  let unanswered = 0
  values.forEach((value, index) => {
    if (!value) {
      unanswered += 1
    } else if ((value === "true") === response.expected[index]) {
      correctAnswers += 1
    } else {
      incorrectAnswers += 1
    }
  })
  return {
    points: Math.max(0, correctAnswers - incorrectAnswers),
    correctAnswers,
    incorrectAnswers,
    unanswered,
  }
}

function gradeOfficialPart(
  task: OfficialExamTaskBlueprint,
  taskPart: OfficialExamPartBlueprint,
  answer: string,
  working: string,
  milestoneAnswers: Record<string, string> | undefined,
): MockExamPartResult {
  let answerCorrect = previewAnswerCorrect(taskPart, answer)
  let certainPoints = 0
  let reviewablePoints = taskPart.maxPoints

  if (taskPart.response.kind === "true-false-grid") {
    const score = scoreOfficial2023TrueFalse(answer)
    certainPoints = score.points
    reviewablePoints = 0
    answerCorrect = score.points === taskPart.maxPoints
  } else if (task.taskNumber === 8 && taskPart.response.kind === "number") {
    answerCorrect = isExactForkAnswer(answer)
    if (answerCorrect) {
      // The published scheme explicitly grants all four points for 156 found by
      // systematic trial, even when no written method is visible.
      certainPoints = taskPart.maxPoints
      reviewablePoints = 0
    }
  }

  return {
    partId: taskPart.id,
    taskId: task.id,
    topicId: taskPart.topicId,
    answer,
    working,
    ...(milestoneAnswers && Object.keys(milestoneAnswers).length > 0
      ? { milestoneAnswers: { ...milestoneAnswers } }
      : {}),
    answerCorrect,
    methodRequired: taskPart.methodRequired,
    maxPoints: taskPart.maxPoints,
    certainPoints,
    reviewablePoints,
    confidence: reviewablePoints === 0 ? "certain" : "manual",
  }
}

export function gradeOfficialExam2023(
  exam: ActiveMockExam,
  submissionReason: MockSubmissionReason,
  submittedAt = new Date(),
): MockExamResult {
  if (!isOfficialExam2023(exam)) throw new Error("This is not the supported official 2023 exam.")

  const taskResults = officialExam2023Blueprint.tasks.map((task, taskIndex): MockExamTaskResult => {
    const progress = exam.progress[taskIndex]
    if (!progress || progress.taskId !== task.id) {
      throw new Error(`Official progress is missing task ${task.taskNumber}.`)
    }
    const parts = task.parts.map((taskPart, partIndex) => {
      const draft = progress.parts[partIndex]
      if (!draft || draft.partId !== taskPart.id) {
        throw new Error(`Official progress is missing task ${task.taskNumber}${taskPart.label}.`)
      }
      return gradeOfficialPart(
        task,
        taskPart,
        draft.answer,
        draft.working,
        draft.milestoneAnswers,
      )
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
    title: officialExam2023Blueprint.title,
    editionId: OFFICIAL_2023_EDITION_ID,
    rubricVersion: OFFICIAL_2023_RUBRIC_VERSION,
    seed: exam.seed,
    blueprintVersion: exam.blueprintVersion,
    startedAt: exam.startedAt,
    submittedAt: submittedAt.toISOString(),
    submissionReason,
    durationSeconds: Math.min(exam.durationSeconds, elapsedSeconds),
    maxPoints: OFFICIAL_2023_MAX_POINTS,
    certainPoints: taskResults.reduce((sum, task) => sum + task.certainPoints, 0),
    reviewablePoints: taskResults.reduce((sum, task) => sum + task.reviewablePoints, 0),
    taskResults,
    recoveryTopicIds: [],
    officialReview: {
      editionId: OFFICIAL_2023_EDITION_ID,
      rubricVersion: OFFICIAL_2023_RUBRIC_VERSION,
      status: "pending",
      taskScores: Array.from({ length: OFFICIAL_2023_TASK_COUNT }, () => null),
    },
  }
}

export function completeOfficialExam2023Review(
  result: MockExamResult,
  taskScores: readonly number[],
  completedAt = new Date(),
): MockExamResult {
  return completeOfficialExamReview(
    result,
    officialExam2023Blueprint,
    taskScores,
    undefined,
    completedAt,
  )
}
