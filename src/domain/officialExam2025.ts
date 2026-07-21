import type {
  MockExamPartResult,
  MockExamResult,
  MockExamTaskResult,
  MockSubmissionReason,
  TopicId,
} from "./model"
import {
  OFFICIAL_2025_MATH_GRADE_SCALE_ID,
  official2025MathematicsGrade,
} from "./officialGradeScale"
import {
  bestOfficialCalculationPath,
  type OfficialCalculationStep,
} from "./officialCalculationEvidence"
import {
  completeOfficialExamReview as completeOfficialReview,
  createActiveOfficialExam,
  isOfficialExamEdition,
  type OfficialExamBlueprint,
  type OfficialExamPartBlueprint,
  type OfficialExamTaskBlueprint,
  type OfficialResponseSpec,
  type OfficialRubricMilestone,
} from "./officialExam"
import type {
  ActiveMockExam,
  MockPartDraft,
  MockTaskProgress,
} from "./mockExam"
import {
  OFFICIAL_2025_EDITION_ID,
  officialArchiveCatalog,
  type OfficialArchiveDocumentDefinition,
  type OfficialArchiveDocumentKind,
} from "./officialArchiveCatalog"

export type { OfficialArchiveDocumentDefinition, OfficialArchiveDocumentKind } from "./officialArchiveCatalog"
export { OFFICIAL_2025_EDITION_ID } from "./officialArchiveCatalog"
export type {
  OfficialExamPartBlueprint,
  OfficialExamTaskBlueprint,
  OfficialResponseSpec,
  OfficialRubricMilestone,
} from "./officialExam"
export {
  decodeOfficialFaceLabels,
  encodeOfficialFaceLabels,
  isOfficialPartAnswered,
  isOfficialTaskAnswered,
} from "./officialExam"

export const OFFICIAL_2025_RUBRIC_VERSION = "2025-v1.1" as const
export const OFFICIAL_2025_BLUEPRINT_VERSION = 1 as const
export const OFFICIAL_2025_DURATION_SECONDS = 60 * 60
export const OFFICIAL_2025_MAX_POINTS = 36
export const OFFICIAL_2025_TASK_COUNT = 9

export const official2025Documents: Record<OfficialArchiveDocumentKind, OfficialArchiveDocumentDefinition> =
  officialArchiveCatalog[OFFICIAL_2025_EDITION_ID].documents

export interface OfficialExam2025Blueprint extends OfficialExamBlueprint {
  id: typeof OFFICIAL_2025_EDITION_ID
  editionId: typeof OFFICIAL_2025_EDITION_ID
  year: 2025
  rubricVersion: typeof OFFICIAL_2025_RUBRIC_VERSION
  version: typeof OFFICIAL_2025_BLUEPRINT_VERSION
  durationSeconds: typeof OFFICIAL_2025_DURATION_SECONDS
  maxPoints: typeof OFFICIAL_2025_MAX_POINTS
}

const taskId = (taskNumber: number) => `${OFFICIAL_2025_EDITION_ID}:task:${taskNumber}`
const part = (
  taskNumber: number,
  label: string,
  topicId: TopicId,
  maxPoints: number,
  response: OfficialResponseSpec,
  methodRequired: boolean,
  milestones: readonly OfficialRubricMilestone[] = [],
): OfficialExamPartBlueprint => ({
  kind: "official",
  id: `${taskId(taskNumber)}:part:${label}`,
  label,
  topicId,
  maxPoints,
  response,
  methodRequired,
  milestones,
})

const milestone = (
  id: string,
  label: string,
  expected: number | readonly number[],
  unit?: string,
): OfficialRubricMilestone => ({
  id,
  label,
  expected: Array.isArray(expected) ? expected : [expected],
  ...(unit ? { unit } : {}),
})

const fractionMilestone = (
  id: string,
  label: string,
  numerator: number,
  denominator: number,
): OfficialRubricMilestone => ({
  id,
  label,
  kind: "fraction",
  expected: [{ numerator, denominator }],
})

const calculationMilestone = (
  id: string,
  label: string,
  placeholder: string,
  rows?: number,
): OfficialRubricMilestone => ({
  id,
  label,
  kind: "calculation",
  placeholder,
  ...(rows ? { rows } : {}),
})

const official2025Tasks: readonly OfficialExamTaskBlueprint[] = [
  {
    kind: "official",
    id: taskId(1),
    taskNumber: 1,
    title: "Fehlende Zahlen",
    family: "calculation-time",
    maxPoints: 4,
    taskPage: 3,
    solutionPages: [4, 14],
    rubricSummary: [
      "Teil a: volle Punkte für korrekten Umkehrweg und 4941; ein tragfähiges Zwischenresultat kann einen Punkt geben.",
      "Teil b: volle Punkte für den korrekten Weg und die einheitenlose 3; die Ergänzung v1.1 akzeptiert die 3 auch direkt im Kästchen.",
    ],
    parts: [
      part(1, "a", "arithmetic-equations", 2, { kind: "number", value: 4941, answerLabel: "Zahl im Kästchen" }, true, [
        milestone("product-54351", "Zwischenwert nach 671 · 81", 54_351),
        milestone("quotient-61", "Zwischenwert nach 671 : 11", 61),
        calculationMilestone(
          "calculation-path",
          "Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile, z. B. 671 · 81 = …",
          3,
        ),
      ]),
      part(1, "b", "time-fractions", 2, { kind: "number", value: 3, answerLabel: "Zahl im Kästchen", forbidUnit: true }, true, [
        milestone("combined-minutes-75", "27 min + 4/5 h", 75, "min"),
        milestone("seventh-minutes-25", "1/7 von 2 h 55 min", 25, "min"),
        milestone("seven-times-525", "7 · 75 min", 525, "min"),
        fractionMilestone("ratio-75-175", "Verhältnis 75 min zu 175 min", 3, 7),
        calculationMilestone(
          "calculation-path",
          "Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile, z. B. 7 · 75 = …",
          3,
        ),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(2),
    taskNumber: 2,
    title: "Museum und Eintrittspreise",
    family: "tables-ratios",
    maxPoints: 4,
    taskPage: 4,
    solutionPages: [5],
    rubricSummary: [
      "Teil a wird nur nach dem Endresultat bewertet.",
      "Für b und c muss der passende Rechenweg erkennbar sein; bei c kann eine richtige Bündelung der Verhältnisgruppen einen Teilpunkt ergeben.",
    ],
    parts: [
      part(2, "a", "money-calculations", 1, { kind: "number", value: 73, answerLabel: "Gruppenpreis", unit: "Fr." }, false),
      part(2, "b", "money-calculations", 1, { kind: "number", value: 91, answerLabel: "Anzahl Pensionierte" }, true, [
        calculationMilestone(
          "calculation-path",
          "Strukturierter Rechenweg",
          "1092 : 12 = …",
          2,
        ),
      ]),
      part(2, "c", "proportional-revenue", 2, { kind: "number", value: 148, answerLabel: "Anzahl Kinder" }, true, [
        milestone("remaining-revenue-2960", "Einnahmen Kinder und Erwachsene", 2960, "Fr."),
        milestone("bundle-price-40", "Preis für 2 Kinder + 1 erwachsene Person", 40, "Fr."),
        milestone("half-bundle-price-20", "Preis für 1 Kind + 1/2 erwachsene Person", 20, "Fr."),
        milestone("adult-count-74", "Anzahl Erwachsene im Verhältnis", 74),
        calculationMilestone(
          "calculation-path",
          "Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile; veröffentlichter 20-Fr.- oder 40-Fr.-Weg",
          6,
        ),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(3),
    taskNumber: 3,
    title: "Münzkombinationen",
    family: "integer-combinations",
    maxPoints: 4,
    taskPage: 5,
    solutionPages: [6, 14],
    rubricSummary: [
      "Es zählen vollständige, positive Dreierkombinationen; ein Lösungsweg ist nicht nötig.",
      "Die Punktzahl folgt einer Matrix aus richtigen und falschen Zeilen. Die Ergänzung v1.1 regelt die Sonderfälle mit einer falschen Einfranken-Anzahl und Zeilen mit 0.",
    ],
    parts: [
      part(3, "", "integer-combinations", 4, {
        kind: "tuple-set",
        answerLabel: "Eine Kombination pro Zeile: 5 Fr., 2 Fr., 1 Fr.",
        expected: ["1,1,9", "1,2,7", "1,3,5", "1,4,3", "1,5,1", "2,1,4", "2,2,2"],
      }, false),
    ],
  },
  {
    kind: "official",
    id: taskId(4),
    taskNumber: 4,
    title: "Bodenplatten",
    family: "tiling-costs",
    maxPoints: 4,
    taskPage: 6,
    solutionPages: [7],
    rubricSummary: [
      "Teil a verlangt den vollständig gekürzten Bruch.",
      "Für b und c muss die Plattenzählung beziehungsweise die Kostenidee erkennbar sein; 15 grosse Platten sind der zentrale Teilpunkt in c.",
    ],
    parts: [
      part(4, "a", "area-fractions", 1, { kind: "fraction", numerator: 23, denominator: 35, answerLabel: "Anteil der weissen Platten" }, false),
      part(4, "b", "tiling-costs", 1, { kind: "number", value: 302, answerLabel: "Preis der gezeichneten Anordnung", unit: "Fr." }, true, [
        milestone("small-tiles-46", "Anzahl kleine Platten", 46),
        milestone("large-tiles-6", "Anzahl grosse Platten", 6),
        calculationMilestone(
          "calculation-path",
          "Strukturierter Rechenweg",
          "Eine Rechnung pro Zeile, z. B. 46 · 5 = …",
          4,
        ),
      ]),
      part(4, "c", "tiling-costs", 2, { kind: "number", value: 230, answerLabel: "Tiefster Preis", unit: "Fr." }, true, [
        milestone("optimal-large-tiles-15", "Grosse Platten beim tiefsten Preis", 15),
        milestone("remaining-small-tiles-10", "Verbleibende kleine Platten", 10),
        calculationMilestone(
          "calculation-path",
          "Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile; 15 grosse und 10 kleine Platten",
          4,
        ),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(5),
    taskNumber: 5,
    title: "Erdbeeren rückwärts rechnen",
    family: "reverse-processes",
    maxPoints: 4,
    taskPage: 7,
    solutionPages: [8, 14],
    rubricSummary: [
      "Die Meilensteine 54 kg, 72 kg, 84 kg und 86.5 kg entsprechen aufeinander aufbauenden Punktstufen.",
      "Die Ergänzung v1.1 erlaubt zwei Punkte bei einem falschen ersten Massenwert, wenn danach vollständig korrekt weitergerechnet wurde.",
    ],
    parts: [
      part(5, "", "reverse-chains", 4, { kind: "number", value: 86.5, answerLabel: "Geerntete Erdbeeren", unit: "kg" }, true, [
        milestone("jar-mass-54", "Erdbeermasse in allen Gläsern", 54, "kg"),
        milestone("before-cooking-72", "Masse vor dem Einkochen", 72, "kg"),
        milestone("before-sorting-84", "Masse vor dem Aussortieren", 84, "kg"),
        calculationMilestone(
          "calculation-path",
          "Vollständiger Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile; 500 g als 0,5 kg verwenden",
          7,
        ),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(6),
    taskNumber: 6,
    title: "Lebensmittelvorrat",
    family: "inverse-proportion",
    maxPoints: 4,
    taskPage: 8,
    solutionPages: [9, 14],
    rubricSummary: [
      "In a sind 960 Tagesrationen, 96 Tage für 10 Personen oder 32 Tage für 30 Personen tragfähige Teilresultate.",
      "In b können 720 verbleibende Tagesrationen oder 36 Tage für 20 Personen einen Teilpunkt geben; v1.1 erlaubt korrekte Weiterführung aus a.",
    ],
    parts: [
      part(6, "a", "inverse-proportion", 2, { kind: "number", value: 8, answerLabel: "Tage länger", unit: "Tage" }, true, [
        milestone("total-rations-960", "Gesamte Tagesrationen", 960),
        milestone("ten-people-days-96", "Vorrat für 10 Personen", 96, "Tage"),
        milestone("thirty-people-days-32", "Vorrat für 30 Personen", 32, "Tage"),
        calculationMilestone(
          "calculation-path",
          "Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile, beginnend mit 40 · 24 = …",
          5,
        ),
      ]),
      part(6, "b", "changing-rates", 2, { kind: "number", value: 24, answerLabel: "Weitere Tage", unit: "Tage" }, true, [
        milestone("remaining-rations-720", "Tagesrationen nach 12 Tagen", 720),
        milestone("twenty-people-days-36", "Restdauer für 20 Personen", 36, "Tage"),
        calculationMilestone(
          "follow-through-division",
          "Letzte Division aus deinem Rechenweg",
          "z. B. Zwischenwert : Personenzahl = Ergebnis",
        ),
        calculationMilestone(
          "calculation-path",
          "Vollständiger Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile, z. B. 20 · 48 = …",
          5,
        ),
      ]),
    ],
  },
  {
    kind: "official",
    id: taskId(7),
    taskNumber: 7,
    title: "Schatzkarte konstruieren",
    family: "geometric-loci",
    maxPoints: 4,
    taskPage: 9,
    solutionPages: [10, 11, 15],
    rubricSummary: [
      "Bewertet werden die Parallele im richtigen Abstand, der Kreis um F, die konstruierte Mittelsenkrechte und das passende Schnittgebiet.",
      "Werkzeugspuren und eine Toleranz von 2 mm entscheiden über die höchste Punktstufe; diese Aufgabe wird am Papier korrigiert.",
    ],
    parts: [
      part(7, "", "geometric-loci", 4, { kind: "paper", answerLabel: "Konstruktion auf dem Aufgabenblatt ausgeführt" }, true),
    ],
  },
  {
    kind: "official",
    id: taskId(8),
    taskNumber: 8,
    title: "Pyramide rollen",
    family: "spatial-rolling",
    maxPoints: 4,
    taskPage: 10,
    solutionPages: [12],
    rubricSummary: [
      "In a gibt jede der zwei richtig beschrifteten sichtbaren Flächen einen Punkt.",
      "In b geben vier richtige Felder zwei Punkte, drei richtige Felder einen Punkt.",
    ],
    parts: [
      part(8, "a", "spatial-rolling", 2, {
        kind: "face-labels",
        answerLabel: "Sichtbare Seitenflächen",
        fields: ["links", "rechts"],
        expected: [2, 1],
        scoring: "one-per-field",
      }, false),
      part(8, "b", "spatial-rolling", 2, {
        kind: "face-labels",
        answerLabel: "Vier Felder im Zielbild",
        fields: ["oben", "links", "mitte", "rechts"],
        expected: [4, 3, 2, 1],
        scoring: "all-or-three",
      }, false),
    ],
  },
  {
    kind: "official",
    id: taskId(9),
    taskNumber: 9,
    title: "Quaderoberfläche",
    family: "solid-geometry",
    maxPoints: 4,
    taskPage: 11,
    solutionPages: [13, 14],
    rubricSummary: [
      "15 cm und 6 cm, danach 4 cm Höhe, sind die zentralen Zwischenstufen.",
      "Volle Punkte verlangen 576 cm² mit korrekter Einheit; die Korrektur nennt eigene Stufen für 288 cm², 396 cm² und einzelne Flächenpaare.",
    ],
    parts: [
      part(9, "", "cuboid-surface", 4, { kind: "number", value: 576, answerLabel: "Oberfläche", unit: "cm²" }, true, [
        milestone("block-length-15", "Länge eines Bausteins", 15, "cm"),
        milestone("block-width-6", "Breite eines Bausteins", 6, "cm"),
        milestone("block-height-4", "Höhe eines Bausteins", 4, "cm"),
        milestone("end-face", "Stirnfläche (eine oder beide)", [48, 96], "cm²"),
        milestone("side-face", "Linke/rechte Seitenfläche (eine oder beide)", [60, 120], "cm²"),
        milestone("base-face", "Boden-/Deckfläche (eine oder beide)", [180, 360], "cm²"),
        milestone("alternative-side-face", "Alternative Seitenfläche aus Quader A", [120, 240], "cm²"),
        calculationMilestone(
          "calculation-path",
          "Vollständiger Rechenweg für die Ein-Fehler-Regel",
          "Eine Rechnung pro Zeile, beginnend mit 15 · 6 = …",
          9,
        ),
      ]),
    ],
  },
] as const

export const officialExam2025Blueprint: OfficialExam2025Blueprint = {
  kind: "official",
  id: OFFICIAL_2025_EDITION_ID,
  editionId: OFFICIAL_2025_EDITION_ID,
  title: "ZAP 1 Mathematik 2025 – offizielle Wiederholung",
  year: 2025,
  rubricVersion: OFFICIAL_2025_RUBRIC_VERSION,
  version: OFFICIAL_2025_BLUEPRINT_VERSION,
  durationSeconds: OFFICIAL_2025_DURATION_SECONDS,
  maxPoints: OFFICIAL_2025_MAX_POINTS,
  tasks: official2025Tasks,
  review: {
    rubricLabel: "Korrekturschema v1.1",
    rubricDetail: "Ergänzungen enthalten",
    precheckMode: "safe-floor",
  },
  grade: {
    status: "verified",
    label: "Notenskala LG 2025",
    detail: "Offizielle Mathematikskala · nicht Gesamtnote",
  },
}

export function createActiveOfficialExam2025(
  seed: string,
  now = new Date(),
  durationSeconds = OFFICIAL_2025_DURATION_SECONDS,
): ActiveMockExam {
  return createActiveOfficialExam(officialExam2025Blueprint, seed, now, durationSeconds)
}

export function isOfficialExam2025(exam: ActiveMockExam): boolean {
  return isOfficialExamEdition(exam, OFFICIAL_2025_EDITION_ID)
}

interface ParsedNumericAnswer {
  value: number
  unit?: string
}

function parseNumericAnswer(value: string): ParsedNumericAnswer | undefined {
  const normalized = value
    .trim()
    .replace(/[’']/g, "")
    .replace(",", ".")
  const match = normalized.match(/^([-+]?\d+(?:\.\d+)?)(?:\s*([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9²³.]*))?$/u)
  if (!match) return undefined
  const parsed = Number(match[1])
  return Number.isFinite(parsed)
    ? { value: parsed, ...(match[2] ? { unit: match[2] } : {}) }
    : undefined
}

function normalizeDecimal(value: string): number | undefined {
  return parseNumericAnswer(value)?.value
}

function almostEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9
}

function hasAttachedUnit(value: string): boolean {
  return Boolean(parseNumericAnswer(value)?.unit)
}

function normalizeUnit(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("de-CH")
    .replace(/\./g, "")
    .replace(/\^2/g, "²")
}

function attachedUnitMatches(value: string, expectedUnit: string): boolean {
  const supplied = parseNumericAnswer(value)?.unit
  if (!supplied) return true
  const normalizedSupplied = normalizeUnit(supplied)
  const normalizedExpected = normalizeUnit(expectedUnit)
  if (normalizedExpected === "tage") {
    return normalizedSupplied === "tag" || normalizedSupplied === "tage"
  }
  if (normalizedExpected === "fr") {
    return normalizedSupplied === "fr" || normalizedSupplied === "franken"
  }
  if (normalizedExpected === "cm²") {
    return normalizedSupplied === "cm²" || normalizedSupplied === "cm2"
  }
  return normalizedSupplied === normalizedExpected
}

function hasInvalidAttachedUnit(
  response: Extract<OfficialResponseSpec, { kind: "number" }>,
  value: string,
): boolean {
  if (!hasAttachedUnit(value)) return false
  if (response.forbidUnit || !response.unit) return true
  return !attachedUnitMatches(value, response.unit)
}

const resultOf = (resultOf: number) => ({ resultOf })

const official2025CalculationPaths = {
  "1a": [
    [
      { left: 671, operator: "multiply", right: 81 },
      { left: resultOf(0), operator: "divide", right: 11 },
    ],
    [
      { left: 671, operator: "divide", right: 11 },
      { left: resultOf(0), operator: "multiply", right: 81 },
    ],
  ],
  "1b": [
    [
      { left: 7, operator: "multiply", right: 75 },
      { left: resultOf(0), operator: "divide", right: 175 },
    ],
  ],
  "2b": [
    [
      { left: 1092, operator: "divide", right: 12 },
    ],
  ],
  "2c": [
    [
      { left: 4052, operator: "subtract", right: 1092 },
      { left: 9, operator: "add", right: 11 },
      { left: resultOf(0), operator: "divide", right: resultOf(1) },
    ],
    [
      { left: 4052, operator: "subtract", right: 1092 },
      { left: 2, operator: "multiply", right: 9 },
      { left: resultOf(1), operator: "add", right: 22 },
      { left: resultOf(0), operator: "divide", right: resultOf(2) },
      { left: resultOf(3), operator: "multiply", right: 2 },
    ],
  ],
  "4b": [
    [
      { left: 46, operator: "multiply", right: 5 },
      { left: 6, operator: "multiply", right: 12 },
      { left: resultOf(0), operator: "add", right: resultOf(1) },
    ],
  ],
  "4c": [
    [
      { left: 15, operator: "multiply", right: 12 },
      { left: 10, operator: "multiply", right: 5 },
      { left: resultOf(0), operator: "add", right: resultOf(1) },
    ],
  ],
  "5": [
    [
      { left: 108, operator: "multiply", right: 0.5 },
      { left: resultOf(0), operator: "divide", right: 3 },
      { left: resultOf(1), operator: "multiply", right: 4 },
      { left: resultOf(2), operator: "divide", right: 6 },
      { left: resultOf(3), operator: "multiply", right: 7 },
      { left: resultOf(4), operator: "add", right: 2.5 },
    ],
  ],
  "6a": [
    [
      { left: 40, operator: "multiply", right: 24 },
      { left: resultOf(0), operator: "divide", right: 10 },
      { left: resultOf(1), operator: "divide", right: 3 },
      { left: resultOf(2), operator: "subtract", right: 24 },
    ],
    [
      { left: 40, operator: "multiply", right: 24 },
      { left: resultOf(0), operator: "divide", right: 30 },
      { left: resultOf(1), operator: "subtract", right: 24 },
    ],
  ],
  "6b": [
    [
      { left: 20, operator: "multiply", right: 48 },
      { left: 48, operator: "subtract", right: 12 },
      { left: resultOf(1), operator: "multiply", right: 20 },
      { left: resultOf(2), operator: "divide", right: 30 },
    ],
    [
      { left: 20, operator: "multiply", right: 48 },
      { left: 20, operator: "multiply", right: 12 },
      { left: resultOf(0), operator: "subtract", right: resultOf(1) },
      { left: resultOf(2), operator: "divide", right: 30 },
    ],
  ],
  "9": [
    [
      { left: 15, operator: "multiply", right: 6 },
      { left: 360, operator: "divide", right: resultOf(0) },
      { left: resultOf(1), operator: "multiply", right: 15 },
      { left: resultOf(1), operator: "multiply", right: 12 },
      { left: 12, operator: "multiply", right: 15 },
      { left: resultOf(2), operator: "add", right: resultOf(3) },
      { left: resultOf(5), operator: "add", right: resultOf(4) },
      { left: 2, operator: "multiply", right: resultOf(6) },
    ],
  ],
} as const satisfies Record<string, readonly (readonly OfficialCalculationStep[])[]>

type Official2025CalculationPathKey = keyof typeof official2025CalculationPaths

function calculationPathEvidence(
  draft: MockPartDraft,
  key: Official2025CalculationPathKey,
) {
  const finalAnswer = normalizeDecimal(draft.answer)
  if (finalAnswer === undefined) return undefined
  return bestOfficialCalculationPath(
    draft.milestoneAnswers?.["calculation-path"] ?? "",
    official2025CalculationPaths[key],
    finalAnswer,
  )
}

function milestoneAnswer(draft: MockPartDraft, milestoneId: string): number | undefined {
  return normalizeDecimal(draft.milestoneAnswers?.[milestoneId] ?? "")
}

function matchingMilestoneIds(
  part: OfficialExamPartBlueprint,
  draft: MockPartDraft,
): string[] {
  return part.milestones.flatMap((entry) => {
    if (entry.kind === "calculation") return []
    if (entry.kind === "fraction") {
      const answer = parseFraction(draft.milestoneAnswers?.[entry.id] ?? "")
      return answer && entry.expected.some((expected) => (
        answer.numerator * expected.denominator === expected.numerator * answer.denominator
      ))
        ? [entry.id]
        : []
    }
    const answer = milestoneAnswer(draft, entry.id)
    return answer !== undefined && entry.expected.some((expected) => almostEqual(answer, expected))
      ? [entry.id]
      : []
  })
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

function parseFraction(value: string): { numerator: number; denominator: number } | undefined {
  const match = value.trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/)
  if (!match) return undefined
  const numerator = Number(match[1])
  const denominator = Number(match[2])
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) return undefined
  return { numerator, denominator }
}

function parseDivisionCalculation(value: string): {
  dividend: number
  divisor: number
  result?: number
} | undefined {
  const normalized = value
    .trim()
    .replace(/[’']/g, "")
    .replace(/,/g, ".")
  const match = normalized.match(
    /^([-+]?\d+(?:\.\d+)?)\s*(?::|\/|÷)\s*([-+]?\d+(?:\.\d+)?)(?:\s*=\s*([-+]?\d+(?:\.\d+)?))?$/u,
  )
  if (!match) return undefined
  const dividend = Number(match[1])
  const divisor = Number(match[2])
  const result = match[3] === undefined ? undefined : Number(match[3])
  if (!Number.isFinite(dividend) || !Number.isFinite(divisor) || divisor === 0) return undefined
  if (result !== undefined && !Number.isFinite(result)) return undefined
  return { dividend, divisor, ...(result === undefined ? {} : { result }) }
}

function tupleRows(value: string): number[][] {
  return value
    .split(/[;\n]+/)
    .map((row) => row.match(/-?\d+/g)?.map(Number) ?? [])
    .filter((row) => row.length > 0)
}

function tupleKey(row: readonly number[]): string {
  return row.join(",")
}

export interface OfficialTupleScore {
  points: number
  correctRows: number
  falseRows: number
  zeroPenaltyApplied: boolean
  specialCaseApplied: boolean
}

export function scoreOfficial2025CoinRows(answer: string): OfficialTupleScore {
  const expected = new Set(
    (officialExam2025Blueprint.tasks[2]!.parts[0]!.response as Extract<OfficialResponseSpec, { kind: "tuple-set" }>).expected,
  )
  const uniqueRows = [...new Map(tupleRows(answer).map((row) => [tupleKey(row), row])).values()]
  const zeroRows = uniqueRows.filter((row) => row.includes(0))
  const scoredRows = uniqueRows.filter((row) => !row.includes(0))
  const correctRows = scoredRows.filter((row) => expected.has(tupleKey(row))).length
  const falseCandidates = scoredRows.filter((row) => !expected.has(tupleKey(row)))
  const falseRows = falseCandidates.length
  let points = correctRows < 4 || falseRows > 3
    ? 0
    : Math.max(0, correctRows - 3 - falseRows)
  const specialCaseApplied = uniqueRows.length === 7 && correctRows === 6 && falseRows === 1 && (() => {
    const falseRow = falseCandidates[0]
    return Boolean(falseRow && falseRow.length === 3 && [...expected].some((entry) => {
      const [five, two, one] = entry.split(",").map(Number)
      return falseRow[0] === five && falseRow[1] === two && falseRow[2] !== one
    }))
  })()
  if (specialCaseApplied) points = Math.max(points, 3)
  if (zeroRows.length > 0) points = Math.max(0, points - 2)
  return {
    points,
    correctRows,
    falseRows,
    zeroPenaltyApplied: zeroRows.length > 0,
    specialCaseApplied,
  }
}

function parseFaceLabels(answer: string): number[] {
  return answer.split("|").map((value) => Number(value)).filter(Number.isFinite)
}

function scoreFaceLabels(spec: Extract<OfficialResponseSpec, { kind: "face-labels" }>, answer: string): number {
  const labels = parseFaceLabels(answer)
  const correct = spec.expected.reduce(
    (sum, expected, index) => sum + (labels[index] === expected ? 1 : 0),
    0,
  )
  return spec.scoring === "one-per-field"
    ? correct
    : correct === spec.expected.length
      ? 2
      : correct === spec.expected.length - 1
        ? 1
        : 0
}

function officialPartMachineScore(part: OfficialExamPartBlueprint, answer: string): {
  answerCorrect: boolean
  numericallyCorrect: boolean
  points: number
} {
  switch (part.response.kind) {
    case "number": {
      const parsed = normalizeDecimal(answer)
      const numericallyCorrect = parsed !== undefined && Math.abs(parsed - part.response.value) < 1e-9
      const unitValid = !hasInvalidAttachedUnit(part.response, answer)
      return {
        answerCorrect: numericallyCorrect && unitValid,
        numericallyCorrect,
        points: numericallyCorrect && unitValid && !part.methodRequired ? part.maxPoints : 0,
      }
    }
    case "fraction": {
      const parsed = parseFraction(answer)
      const answerCorrect = Boolean(
        parsed &&
        parsed.numerator * part.response.denominator === part.response.numerator * parsed.denominator &&
        greatestCommonDivisor(parsed.numerator, parsed.denominator) === 1,
      )
      return { answerCorrect, numericallyCorrect: answerCorrect, points: answerCorrect ? part.maxPoints : 0 }
    }
    case "tuple-set": {
      const score = scoreOfficial2025CoinRows(answer)
      const answerCorrect = score.points === part.maxPoints
      return { answerCorrect, numericallyCorrect: answerCorrect, points: score.points }
    }
    case "face-labels": {
      const points = scoreFaceLabels(part.response, answer)
      const answerCorrect = points === part.maxPoints
      return { answerCorrect, numericallyCorrect: answerCorrect, points }
    }
    case "true-false-grid":
      return { answerCorrect: false, numericallyCorrect: false, points: 0 }
    case "matching-grid":
      return { answerCorrect: false, numericallyCorrect: false, points: 0 }
    case "paper":
      return {
        answerCorrect: answer === "completed-on-paper",
        numericallyCorrect: answer === "completed-on-paper",
        points: 0,
      }
    case "text":
      return { answerCorrect: false, numericallyCorrect: false, points: 0 }
  }
}

function scoreOfficialMethodMilestones(
  task: OfficialExamTaskBlueprint,
  part: OfficialExamPartBlueprint,
  draft: MockPartDraft,
  answerNumericallyCorrect: boolean,
  taskProgress: MockTaskProgress,
): { points: number; earnedMilestoneIds: string[] } {
  const earnedMilestoneIds = matchingMilestoneIds(part, draft)
  const matched = new Set(earnedMilestoneIds)
  const has = (id: string) => matched.has(id)
  const invalidUnit = part.response.kind === "number" && hasInvalidAttachedUnit(part.response, draft.answer)
  let points = 0

  switch (`${task.taskNumber}${part.label}`) {
    case "1a": {
      const methodVisible = has("product-54351") || has("quotient-61")
      points = methodVisible ? (answerNumericallyCorrect && !invalidUnit ? 2 : 1) : 0
      const calculation = calculationPathEvidence(draft, "1a")
      if (calculation?.arithmeticErrors === 0 && !invalidUnit) {
        points = Math.max(points, 2)
        earnedMilestoneIds.push("calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1 && !invalidUnit) {
        points = Math.max(points, 1)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
    case "1b": {
      const onePointMilestone = has("seventh-minutes-25") ||
        has("seven-times-525") ||
        has("ratio-75-175")
      const methodVisible = onePointMilestone || (
        has("combined-minutes-75") && has("seventh-minutes-25")
      )
      points = onePointMilestone ? 1 : 0
      if (answerNumericallyCorrect && methodVisible) {
        points = part.response.kind === "number" && part.response.forbidUnit && hasAttachedUnit(draft.answer)
          ? 1
          : 2
      }
      if (/^3\s*\/\s*7$/.test(draft.answer.trim())) points = Math.max(points, 1)
      const calculation = calculationPathEvidence(draft, "1b")
      if (calculation?.arithmeticErrors === 0) {
        points = Math.max(points, invalidUnit ? 1 : 2)
        earnedMilestoneIds.push(invalidUnit ? "calculation-path-unit" : "calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1 && !invalidUnit) {
        points = Math.max(points, 1)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
    case "2b": {
      const calculation = calculationPathEvidence(draft, "2b")
      if (calculation?.arithmeticErrors === 0 && !invalidUnit) {
        points = 1
        earnedMilestoneIds.push("calculation-path-exact")
      }
      break
    }
    case "2c": {
      const bundleVisible = has("bundle-price-40") || has("half-bundle-price-20")
      const fullPathVisible = bundleVisible || (
        has("remaining-revenue-2960") && has("adult-count-74")
      )
      points = bundleVisible ? 1 : 0
      if (answerNumericallyCorrect && !invalidUnit && fullPathVisible) points = 2
      const calculation = calculationPathEvidence(draft, "2c")
      if (calculation?.arithmeticErrors === 0 && !invalidUnit) {
        points = Math.max(points, 2)
        earnedMilestoneIds.push("calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1 && !invalidUnit) {
        points = Math.max(points, 1)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
    case "4b": {
      points = answerNumericallyCorrect && !invalidUnit && has("small-tiles-46") && has("large-tiles-6") ? 1 : 0
      const calculation = calculationPathEvidence(draft, "4b")
      if (calculation?.arithmeticErrors === 0 && !invalidUnit) {
        points = 1
        earnedMilestoneIds.push("calculation-path-exact")
      }
      break
    }
    case "4c": {
      points = has("optimal-large-tiles-15") ? (answerNumericallyCorrect && !invalidUnit ? 2 : 1) : 0
      const calculation = calculationPathEvidence(draft, "4c")
      if (calculation?.arithmeticErrors === 0) {
        points = Math.max(points, invalidUnit ? 1 : 2)
        earnedMilestoneIds.push(invalidUnit ? "calculation-path-unit" : "calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1) {
        points = Math.max(points, 1)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
    case "5": {
      if (has("jar-mass-54")) points = Math.max(points, 1)
      if (has("before-cooking-72")) points = Math.max(points, 2)
      if (has("before-sorting-84")) points = Math.max(points, 3)
      if (
        answerNumericallyCorrect &&
        has("jar-mass-54") &&
        has("before-cooking-72") &&
        has("before-sorting-84")
      ) {
        points = invalidUnit ? 3 : 4
      }

      const jarMass = milestoneAnswer(draft, "jar-mass-54")
      const beforeCooking = milestoneAnswer(draft, "before-cooking-72")
      const beforeSorting = milestoneAnswer(draft, "before-sorting-84")
      const finalAnswer = normalizeDecimal(draft.answer)
      const validFollowThrough =
        jarMass !== undefined &&
        beforeCooking !== undefined &&
        beforeSorting !== undefined &&
        finalAnswer !== undefined &&
        !almostEqual(jarMass, 54) &&
        almostEqual(beforeCooking, jarMass * 4 / 3) &&
        almostEqual(beforeSorting, beforeCooking * 7 / 6) &&
        almostEqual(finalAnswer, beforeSorting + 2.5)
      if (validFollowThrough) {
        points = Math.max(points, 2)
        earnedMilestoneIds.push("follow-through-v1.1")
      }
      const calculation = calculationPathEvidence(draft, "5")
      if (calculation?.arithmeticErrors === 0) {
        points = Math.max(points, invalidUnit ? 3 : 4)
        earnedMilestoneIds.push(invalidUnit ? "calculation-path-unit" : "calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1 && !invalidUnit) {
        points = Math.max(points, 3)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
    case "6a": {
      const methodVisible = [
        "total-rations-960",
        "ten-people-days-96",
        "thirty-people-days-32",
      ].some(has)
      points = methodVisible ? (answerNumericallyCorrect && !invalidUnit ? 2 : 1) : 0
      const calculation = calculationPathEvidence(draft, "6a")
      if (calculation?.arithmeticErrors === 0 && !invalidUnit) {
        points = Math.max(points, 2)
        earnedMilestoneIds.push("calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1 && !invalidUnit) {
        points = Math.max(points, 1)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
    case "6b": {
      const methodVisible = has("remaining-rations-720") || has("twenty-people-days-36")
      points = methodVisible ? (answerNumericallyCorrect && !invalidUnit ? 2 : 1) : 0
      const sourceRations = milestoneAnswer(taskProgress.parts[0]!, "total-rations-960")
      const remainingRations = milestoneAnswer(draft, "remaining-rations-720")
      const finalAnswer = normalizeDecimal(draft.answer)
      const validFollowThrough =
        sourceRations !== undefined &&
        remainingRations !== undefined &&
        finalAnswer !== undefined &&
        sourceRations > 240 &&
        !almostEqual(sourceRations, 960) &&
        almostEqual(remainingRations, sourceRations - 240) &&
        almostEqual(finalAnswer, remainingRations / 30)
      if (validFollowThrough) {
        points = 2
        earnedMilestoneIds.push("follow-through-from-6a-v1.1")
      } else {
        const division = parseDivisionCalculation(
          draft.milestoneAnswers?.["follow-through-division"] ?? "",
        )
        const oneErrorFollowThrough =
          sourceRations !== undefined &&
          remainingRations !== undefined &&
          finalAnswer !== undefined &&
          sourceRations > 240 &&
          !almostEqual(sourceRations, 960) &&
          almostEqual(remainingRations, sourceRations - 240) &&
          division !== undefined &&
          almostEqual(division.dividend, remainingRations) &&
          almostEqual(division.divisor, 30) &&
          (division.result === undefined || almostEqual(division.result, finalAnswer))
        if (oneErrorFollowThrough) {
          points = Math.max(points, 1)
          earnedMilestoneIds.push("follow-through-one-error-v1.1")
        }
      }
      const calculation = calculationPathEvidence(draft, "6b")
      if (calculation?.arithmeticErrors === 0 && !invalidUnit) {
        points = Math.max(points, 2)
        earnedMilestoneIds.push("calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1 && !invalidUnit) {
        points = Math.max(points, 1)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
    case "9": {
      const dimensionsVisible = has("block-length-15") && has("block-width-6")
      const legacySurface = milestoneAnswer(draft, "surface-pair")
      const legacySurfaceVisible = legacySurface !== undefined &&
        [48, 60, 96, 120, 180, 240, 360].some((expected) => almostEqual(legacySurface, expected))
      const partialSurfaceVisible = legacySurfaceVisible || [
        "end-face",
        "side-face",
        "base-face",
        "alternative-side-face",
      ].some(has)
      if (dimensionsVisible) points = 1
      if (has("block-height-4") || partialSurfaceVisible) points = Math.max(points, 2)
      const submitted = normalizeDecimal(draft.answer)
      if ((submitted === 288 || submitted === 396) && !invalidUnit) points = Math.max(points, 3)
      if (
        answerNumericallyCorrect &&
        dimensionsVisible &&
        has("block-height-4") &&
        has("end-face") &&
        has("side-face") &&
        has("base-face")
      ) {
        points = invalidUnit ? 3 : 4
      }
      const calculation = calculationPathEvidence(draft, "9")
      if (calculation?.arithmeticErrors === 0) {
        points = Math.max(points, invalidUnit ? 3 : 4)
        earnedMilestoneIds.push(invalidUnit ? "calculation-path-unit" : "calculation-path-exact")
      } else if (calculation?.arithmeticErrors === 1) {
        points = Math.max(points, invalidUnit ? 2 : 3)
        earnedMilestoneIds.push("calculation-path-one-error")
      }
      break
    }
  }

  return { points: Math.min(part.maxPoints, points), earnedMilestoneIds }
}

function gradeOfficialPart(
  task: OfficialExamTaskBlueprint,
  taskPart: OfficialExamPartBlueprint,
  draft: MockPartDraft,
  taskProgress: MockTaskProgress,
): MockExamPartResult {
  const machine = officialPartMachineScore(taskPart, draft.answer)
  const milestoneScore = taskPart.methodRequired
    ? scoreOfficialMethodMilestones(task, taskPart, draft, machine.numericallyCorrect, taskProgress)
    : { points: machine.points, earnedMilestoneIds: [] }
  const certainPoints = Math.max(machine.points, milestoneScore.points)
  return {
    partId: taskPart.id,
    taskId: task.id,
    topicId: taskPart.topicId,
    answer: draft.answer,
    working: draft.working,
    ...(draft.milestoneAnswers && Object.keys(draft.milestoneAnswers).length > 0
      ? { milestoneAnswers: { ...draft.milestoneAnswers } }
      : {}),
    ...(milestoneScore.earnedMilestoneIds.length > 0
      ? { earnedMilestoneIds: milestoneScore.earnedMilestoneIds }
      : {}),
    answerCorrect: machine.answerCorrect,
    methodRequired: taskPart.methodRequired,
    maxPoints: taskPart.maxPoints,
    certainPoints,
    reviewablePoints: taskPart.maxPoints - certainPoints,
    confidence: taskPart.maxPoints === certainPoints ? "certain" : "manual",
  }
}

export function gradeOfficialExam2025(
  exam: ActiveMockExam,
  submissionReason: MockSubmissionReason,
  submittedAt = new Date(),
): MockExamResult {
  if (!isOfficialExam2025(exam)) throw new Error("This is not the supported official 2025 exam.")
  const taskResults = officialExam2025Blueprint.tasks.map((task, taskIndex): MockExamTaskResult => {
    const progress = exam.progress[taskIndex]
    if (!progress || progress.taskId !== task.id) {
      throw new Error(`Official progress is missing task ${task.taskNumber}.`)
    }
    const parts = task.parts.map((taskPart, partIndex) => {
      const draft = progress.parts[partIndex]
      if (!draft || draft.partId !== taskPart.id) {
        throw new Error(`Official progress is missing task ${task.taskNumber}${taskPart.label}.`)
      }
      return gradeOfficialPart(task, taskPart, draft, progress)
    })
    const certainPoints = parts.reduce((sum, result) => sum + result.certainPoints, 0)
    return {
      taskId: task.id,
      taskNumber: task.taskNumber,
      title: task.title,
      maxPoints: task.maxPoints,
      certainPoints,
      reviewablePoints: task.maxPoints - certainPoints,
      activeSeconds: progress.activeSeconds,
      visitCount: progress.visitCount,
      flagged: progress.flagged,
      parts,
    }
  })

  const weakness = new Map<TopicId, number>()
  for (const task of taskResults) {
    for (const resultPart of task.parts) {
      if (!resultPart.answerCorrect && resultPart.answer.trim()) {
        weakness.set(resultPart.topicId, (weakness.get(resultPart.topicId) ?? 0) + 3)
      }
    }
  }
  const elapsedSeconds = Math.max(1, Math.round((submittedAt.getTime() - Date.parse(exam.startedAt)) / 1_000))
  return {
    id: `result:${exam.id}:${submittedAt.toISOString()}`,
    source: "official-archive",
    title: officialExam2025Blueprint.title,
    editionId: OFFICIAL_2025_EDITION_ID,
    rubricVersion: OFFICIAL_2025_RUBRIC_VERSION,
    seed: exam.seed,
    blueprintVersion: exam.blueprintVersion,
    startedAt: exam.startedAt,
    submittedAt: submittedAt.toISOString(),
    submissionReason,
    durationSeconds: Math.min(exam.durationSeconds, elapsedSeconds),
    maxPoints: OFFICIAL_2025_MAX_POINTS,
    certainPoints: taskResults.reduce((sum, task) => sum + task.certainPoints, 0),
    reviewablePoints: taskResults.reduce((sum, task) => sum + task.reviewablePoints, 0),
    taskResults,
    recoveryTopicIds: [...weakness.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([topicId]) => topicId),
    officialReview: {
      editionId: OFFICIAL_2025_EDITION_ID,
      rubricVersion: OFFICIAL_2025_RUBRIC_VERSION,
      status: "pending",
      taskScores: Array.from({ length: OFFICIAL_2025_TASK_COUNT }, () => null),
    },
  }
}

export function completeOfficialExam2025Review(
  result: MockExamResult,
  taskScores: readonly number[],
  completedAt = new Date(),
): MockExamResult {
  return completeOfficialReview(
    result,
    officialExam2025Blueprint,
    taskScores,
    {
      gradeScaleId: OFFICIAL_2025_MATH_GRADE_SCALE_ID,
      mathematicsGrade: official2025MathematicsGrade,
    },
    completedAt,
  )
}
