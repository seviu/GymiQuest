import { createRandom, pickIndex } from "../../domain/random"
import type { GermanMicrotext } from "./content"
import {
  generateGermanQuestions,
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  type GermanDifficultyBand,
  type GermanBinaryGridQuestion,
  type GermanGeneratedQuestion,
  type GermanMatchingPair,
  type GermanMultiSelectQuestion,
  type GermanTruthGridSelection,
  type GermanTruthStatus,
} from "./generators"
import {
  cloneGermanObjectiveResponse,
  isValidGermanResponse,
  type GermanAcceptedTextResponse,
  type GermanBinaryGridResponse,
  type GermanMatchingResponse,
  type GermanMultiSelectResponse,
  type GermanObjectiveResponse,
  type GermanTruthGridResponse,
} from "./grading"
import {
  germanScoringRuleForQuestion,
  germanAcceptedAnswerId,
  scoreGermanObjectiveResponse,
  type GermanObjectiveScoreEvidence,
} from "./scoringPolicy"
import {
  GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION,
  GERMAN_CORPUS_VERSION,
  GERMAN_DIFFICULTY_GENERATOR_VERSION,
  GERMAN_EXPANDED_GENERATOR_VERSION,
  GERMAN_GENERATOR_VERSION,
  GERMAN_LEGACY_GENERATOR_VERSION,
  GERMAN_MATCHING_GENERATOR_VERSION,
  GERMAN_MULTI_SELECT_GENERATOR_VERSION,
  GERMAN_SCORING_POLICY_VERSION,
  germanLessonIdByTopic,
  germanPilotTopicIds,
  type GermanPilotTopicId,
  type GermanGeneratorVersion,
} from "./package"

export const GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION = 1 as const
export const GERMAN_EXPANDED_EXAM_BLUEPRINT_VERSION = 2 as const
export const GERMAN_MATCHING_EXAM_BLUEPRINT_VERSION = 3 as const
export const GERMAN_DIFFICULTY_EXAM_BLUEPRINT_VERSION = 4 as const
export const GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION = 5 as const
export const GERMAN_ACCEPTED_TEXT_EXAM_BLUEPRINT_VERSION = 6 as const
export const GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION = 7 as const
export const GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION = 8 as const
export const GERMAN_EXAM_BLUEPRINT_VERSION = 9 as const
export const germanExamBlueprintVersions = [
  GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION,
  GERMAN_EXPANDED_EXAM_BLUEPRINT_VERSION,
  GERMAN_MATCHING_EXAM_BLUEPRINT_VERSION,
  GERMAN_DIFFICULTY_EXAM_BLUEPRINT_VERSION,
  GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION,
  GERMAN_ACCEPTED_TEXT_EXAM_BLUEPRINT_VERSION,
  GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION,
  GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION,
  GERMAN_EXAM_BLUEPRINT_VERSION,
] as const
export type GermanExamBlueprintVersion = typeof germanExamBlueprintVersions[number]
export const GERMAN_EXAM_DURATION_SECONDS = 45 * 60
export const GERMAN_EXAM_QUESTION_COUNT = 15
export const GERMAN_LEGACY_EXAM_MAX_POINTS = 15
export const GERMAN_EXAM_MAX_POINTS = 20

export type GermanExamSubmissionReason = "submitted" | "timeout"

export interface ActiveGermanExam {
  schemaVersion: 1
  id: string
  blueprintVersion: GermanExamBlueprintVersion
  generatorVersion: GermanGeneratorVersion
  corpusVersion: typeof GERMAN_CORPUS_VERSION
  scoringPolicyVersion: typeof GERMAN_SCORING_POLICY_VERSION
  seed: string
  passageId: string
  startedAt: string
  updatedAt: string
  durationSeconds: number
  currentQuestionIndex: number
  answers: Record<string, GermanObjectiveResponse>
  flaggedQuestionIds: string[]
}

export interface GermanExamQuestionResult extends GermanObjectiveScoreEvidence {
  questionId: string
  topicId: GermanPilotTopicId
  familyId: GermanGeneratedQuestion["familyId"]
  responseKind?: "matching" | "truth-grid" | "binary-grid" | "accepted-text" | "multi-select"
  selectedOptionId?: string
  correctOptionId?: string
  selectedMatches?: GermanMatchingPair[]
  correctMatches?: GermanMatchingPair[]
  selectedSelections?: GermanTruthGridSelection[]
  correctSelections?: GermanTruthGridSelection[]
  selectedText?: string
  selectedAcceptedAnswerId?: string
  selectedOptionIds?: string[]
  correctOptionIds?: string[]
  correct: boolean
  points: number
}

export interface GermanExamTopicResult {
  topicId: GermanPilotTopicId
  correct: number
  total: number
}

export interface GermanExamResult {
  id: string
  examId: string
  blueprintVersion: GermanExamBlueprintVersion
  generatorVersion: GermanGeneratorVersion
  corpusVersion: typeof GERMAN_CORPUS_VERSION
  scoringPolicyVersion: typeof GERMAN_SCORING_POLICY_VERSION
  seed: string
  passageId: string
  startedAt: string
  submittedAt: string
  durationSeconds: number
  submissionReason: GermanExamSubmissionReason
  correctPoints: number
  maxPoints: number
  questionResults: GermanExamQuestionResult[]
  topicResults: GermanExamTopicResult[]
}

interface PassageTruthTemplate {
  id: string
  statement: string
  correct: "true" | "false" | "undecidable"
  explanation: string
  evidenceLines?: readonly number[]
}

interface PassageEvidenceTemplate {
  id: string
  prompt: string
  correctLine: number
  explanation: string
}

interface PassageVocabularyTemplate {
  id: string
  line: number
  target: string
  correct: string
  distractors: readonly string[]
  explanation: string
}

interface PassageMultiSelectTemplate {
  id: string
  prompt: string
  options: readonly [
    { id: string; label: string; correct: boolean },
    { id: string; label: string; correct: boolean },
    { id: string; label: string; correct: boolean },
    { id: string; label: string; correct: boolean },
  ]
  explanation: string
  evidenceLines: readonly number[]
}

interface PassageBinaryGridTemplate {
  id: string
  rows: readonly [
    PassageTruthTemplate,
    PassageTruthTemplate,
    PassageTruthTemplate,
    PassageTruthTemplate,
    PassageTruthTemplate,
    PassageTruthTemplate,
  ]
}

interface GermanExamPassageTemplate {
  passage: GermanMicrotext
  truth: readonly [PassageTruthTemplate, PassageTruthTemplate]
  additionalTruth: readonly [
    PassageTruthTemplate,
    PassageTruthTemplate,
    PassageTruthTemplate,
    PassageTruthTemplate,
    PassageTruthTemplate,
  ]
  evidence: readonly [PassageEvidenceTemplate, PassageEvidenceTemplate]
  additionalEvidence: PassageEvidenceTemplate
  multiSelect: PassageMultiSelectTemplate
  binaryGrid: PassageBinaryGridTemplate
  vocabulary: readonly [PassageVocabularyTemplate, PassageVocabularyTemplate]
}

const passageTemplates: readonly GermanExamPassageTemplate[] = Object.freeze([
  {
    passage: {
      id: "night-observatory",
      title: "Eine Nacht auf dem Schuldach",
      lines: [
        { number: 1, text: "Seit Wochen plante die Naturkundeklasse einen Abend auf dem Schuldach." },
        { number: 2, text: "Am Freitag trugen die Jugendlichen Decken, Thermoskannen und zwei Fernrohre nach oben." },
        { number: 3, text: "Kurz vor Sonnenuntergang schoben sich jedoch dichte Wolken vor den Himmel." },
        { number: 4, text: "Niemand wollte sofort aufgeben, deshalb erklärte Herr Frei zuerst die Sternkarte." },
        { number: 5, text: "Die Klasse lernte, den Norden mithilfe des Grossen Wagens zu bestimmen." },
        { number: 6, text: "Eine Stunde später riss die Wolkendecke an einer schmalen Stelle auf." },
        { number: 7, text: "Durch das grössere Fernrohr erschien der Mondrand plötzlich voller Krater." },
        { number: 8, text: "Selma zeichnete drei davon ab, während Jan die Namen im Atlas suchte." },
        { number: 9, text: "Als erneut Wolken aufzogen, verglichen beide ihre Notizen bei warmem Tee." },
        { number: 10, text: "Auf dem Heimweg waren sich alle einig, dass sich das Warten gelohnt hatte." },
      ],
    },
    truth: [
      {
        id: "observatory-give-up",
        statement: "Die Klasse brach den Abend ab, als die ersten Wolken erschienen.",
        correct: "false",
        explanation: "Falsch: In Zeile 4 steht, dass niemand sofort aufgeben wollte.",
        evidenceLines: [4],
      },
      {
        id: "observatory-atlas-owner",
        statement: "Der Mondatlas gehörte Jan.",
        correct: "undecidable",
        explanation: "Nicht entscheidbar: Der Text nennt Jans Benutzung, aber nicht den Besitzer des Atlas.",
      },
    ],
    additionalTruth: [
      {
        id: "observatory-two-telescopes",
        statement: "Die Jugendlichen brachten zwei Fernrohre auf das Schuldach.",
        correct: "true",
        explanation: "Richtig: Zeile 2 nennt ausdrücklich zwei Fernrohre.",
        evidenceLines: [2],
      },
      {
        id: "observatory-find-north",
        statement: "Die Klasse nutzte den Grossen Wagen, um den Norden zu bestimmen.",
        correct: "true",
        explanation: "Richtig: Genau das beschreibt Zeile 5.",
        evidenceLines: [5],
      },
      {
        id: "observatory-moon-before-clouds",
        statement: "Die Klasse beobachtete den Mond, bevor die ersten Wolken aufzogen.",
        correct: "false",
        explanation: "Falsch: Die Wolken erschienen in Zeile 3; die Mondbeobachtung wurde erst nach der Öffnung in Zeile 6 möglich.",
        evidenceLines: [3, 6, 7],
      },
      {
        id: "observatory-jan-drew",
        statement: "Jan zeichnete drei Mondkrater ab.",
        correct: "false",
        explanation: "Falsch: Zeile 8 ordnet die Zeichnung Selma und die Atlassuche Jan zu.",
        evidenceLines: [8],
      },
      {
        id: "observatory-thermos-tea",
        statement: "In den Thermoskannen befand sich der Tee, den Selma und Jan später tranken.",
        correct: "undecidable",
        explanation: "Nicht entscheidbar: Thermoskannen und Tee werden genannt, ihr Zusammenhang wird aber nicht ausdrücklich hergestellt.",
      },
    ],
    evidence: [
      {
        id: "observatory-sky-opens",
        prompt: "Welche Zeile belegt, dass später doch noch eine Beobachtung möglich wurde?",
        correctLine: 6,
        explanation: "Zeile 6 beschreibt die Öffnung in der Wolkendecke.",
      },
      {
        id: "observatory-cooperation",
        prompt: "Welche Zeile zeigt am deutlichsten, dass Selma und Jan verschiedene Aufgaben übernahmen?",
        correctLine: 8,
        explanation: "Zeile 8 nennt Selmas Zeichnung und Jans Suche im Atlas.",
      },
    ],
    additionalEvidence: {
      id: "observatory-clouds-return",
      prompt: "Welche Zeile zeigt, dass Selma und Jan auch nach der Rückkehr der Wolken weiterarbeiteten?",
      correctLine: 9,
      explanation: "Zeile 9 beschreibt, wie beide bei erneut aufziehenden Wolken ihre Notizen verglichen.",
    },
    multiSelect: {
      id: "observatory-multi-observation",
      prompt: "Welche zwei Aussagen über die Beobachtung sind richtig? Wähle genau zwei Antworten.",
      options: [
        { id: "two-telescopes", label: "Die Jugendlichen brachten zwei Fernrohre mit.", correct: true },
        { id: "divided-work", label: "Selma zeichnete Krater, während Jan ihre Namen suchte.", correct: true },
        { id: "clear-sky", label: "Der Himmel blieb während des ganzen Abends wolkenlos.", correct: false },
        { id: "jan-drew", label: "Jan zeichnete drei Krater ab.", correct: false },
      ],
      explanation: "Zeile 2 nennt zwei Fernrohre; Zeile 8 verteilt Zeichnung und Atlassuche auf Selma und Jan.",
      evidenceLines: [2, 8],
    },
    binaryGrid: {
      id: "observatory-binary-interpretations",
      rows: [
        {
          id: "observatory-planned-weeks",
          statement: "Die Klasse hatte den Dachabend seit mehreren Wochen vorbereitet.",
          correct: "true",
          explanation: "Richtig: Zeile 1 sagt, dass die Klasse den Abend seit Wochen plante.",
          evidenceLines: [1],
        },
        {
          id: "observatory-cancelled-immediately",
          statement: "Herr Frei sagte den Abend wegen der ersten Wolken sofort ab.",
          correct: "false",
          explanation: "Falsch: Zeile 4 beschreibt stattdessen seine Erklärung der Sternkarte.",
          evidenceLines: [4],
        },
        {
          id: "observatory-map-before-opening",
          statement: "Die Erklärung der Sternkarte fand statt, bevor sich die Wolkendecke öffnete.",
          correct: "true",
          explanation: "Richtig: Die Erklärung steht in Zeile 4, die Öffnung erst in Zeile 6.",
          evidenceLines: [4, 6],
        },
        {
          id: "observatory-small-telescope",
          statement: "Die Mondkrater wurden durch das kleinere Fernrohr beobachtet.",
          correct: "false",
          explanation: "Falsch: Zeile 7 nennt ausdrücklich das grössere Fernrohr.",
          evidenceLines: [7],
        },
        {
          id: "observatory-no-comparison",
          statement: "Selma und Jan verglichen ihre Aufzeichnungen nicht miteinander.",
          correct: "false",
          explanation: "Falsch: Genau diesen Vergleich beschreibt Zeile 9.",
          evidenceLines: [9],
        },
        {
          id: "observatory-wait-worthwhile",
          statement: "Am Ende hielt die ganze Klasse das Warten für lohnenswert.",
          correct: "true",
          explanation: "Richtig: Zeile 10 nennt diese gemeinsame Einschätzung.",
          evidenceLines: [10],
        },
      ],
    },
    vocabulary: [
      {
        id: "observatory-riss",
        line: 6,
        target: "riss … auf",
        correct: "öffnete sich",
        distractors: ["wurde dunkler", "bewegte sich schneller", "fiel herunter"],
        explanation: "Die Wolkendecke öffnete sich an einer schmalen Stelle.",
      },
      {
        id: "observatory-gelohnt",
        line: 10,
        target: "gelohnt",
        correct: "war die Mühe wert",
        distractors: ["war zu gefährlich", "dauerte zu lange", "wurde abgesagt"],
        explanation: "Die Klasse fand, dass das Erlebnis die Wartezeit wert war.",
      },
    ],
  },
  {
    passage: {
      id: "bridge-garden",
      title: "Der Garten über den Gleisen",
      lines: [
        { number: 1, text: "Zwischen zwei Quartieren führte eine breite Fussgängerbrücke über die Bahngleise." },
        { number: 2, text: "Lange bestand sie nur aus grauem Beton und wurde möglichst rasch überquert." },
        { number: 3, text: "Dann schlug ein Nachbarschaftsverein vor, dort einen kleinen Garten anzulegen." },
        { number: 4, text: "Die Bahn erlaubte leichte Pflanzkästen, verlangte aber einen freien Rettungsweg." },
        { number: 5, text: "Freiwillige sammelten alte Holzkisten und strichen sie mit wetterfester Farbe." },
        { number: 6, text: "Kinder pflanzten Kräuter, während ältere Bewohnerinnen robuste Blumen auswählten." },
        { number: 7, text: "Im ersten Sommer mussten alle häufig giessen, weil kaum Regen fiel." },
        { number: 8, text: "Trotzdem überstanden fast alle Pflanzen die heissen Wochen." },
        { number: 9, text: "Bald blieben Passantinnen stehen, rochen an der Minze und kamen miteinander ins Gespräch." },
        { number: 10, text: "Aus dem früheren Durchgang war ein kleiner Treffpunkt geworden." },
      ],
    },
    truth: [
      {
        id: "bridge-no-rules",
        statement: "Die Bahn stellte für den Brückengarten keine Bedingungen.",
        correct: "false",
        explanation: "Falsch: Zeile 4 nennt leichte Kästen und einen freien Rettungsweg als Bedingungen.",
        evidenceLines: [4],
      },
      {
        id: "bridge-flower-colour",
        statement: "Die älteren Bewohnerinnen wählten gelbe Blumen aus.",
        correct: "undecidable",
        explanation: "Nicht entscheidbar: Der Text beschreibt die Blumen als robust, nennt aber keine Farbe.",
      },
    ],
    additionalTruth: [
      {
        id: "bridge-grey-passage",
        statement: "Vor dem Gartenprojekt wurde die graue Brücke meist rasch überquert.",
        correct: "true",
        explanation: "Richtig: Zeile 2 beschreibt die Brücke als grauen, schnell überquerten Durchgang.",
        evidenceLines: [2],
      },
      {
        id: "bridge-rescue-path",
        statement: "Ein Rettungsweg musste trotz der Pflanzkästen frei bleiben.",
        correct: "true",
        explanation: "Richtig: Diese Bedingung steht in Zeile 4.",
        evidenceLines: [4],
      },
      {
        id: "bridge-children-herbs",
        statement: "Die Kinder pflanzten Kräuter.",
        correct: "true",
        explanation: "Richtig: Zeile 6 nennt die Kräuter ausdrücklich.",
        evidenceLines: [6],
      },
      {
        id: "bridge-rain-plentiful",
        statement: "Im ersten Sommer fiel besonders viel Regen.",
        correct: "false",
        explanation: "Falsch: Laut Zeile 7 fiel kaum Regen.",
        evidenceLines: [7],
      },
      {
        id: "bridge-crates-donated",
        statement: "Ein Geschäft aus dem Quartier schenkte dem Verein die alten Holzkisten.",
        correct: "undecidable",
        explanation: "Nicht entscheidbar: Zeile 5 nennt das Sammeln der Kisten, aber nicht ihre Herkunft.",
      },
    ],
    evidence: [
      {
        id: "bridge-dry-summer",
        prompt: "Welche Zeile erklärt, weshalb die Pflanzen oft Wasser brauchten?",
        correctLine: 7,
        explanation: "Zeile 7 nennt den fehlenden Regen als Ursache.",
      },
      {
        id: "bridge-social-change",
        prompt: "Welche Zeile belegt erstmals, dass der Ort Menschen miteinander verband?",
        correctLine: 9,
        explanation: "Zeile 9 beschreibt, wie Passantinnen stehen blieben und miteinander sprachen.",
      },
    ],
    additionalEvidence: {
      id: "bridge-new-purpose",
      prompt: "Welche Zeile fasst die neue Funktion der Brücke am deutlichsten zusammen?",
      correctLine: 10,
      explanation: "Zeile 10 stellt dem früheren Durchgang den neuen Treffpunkt gegenüber.",
    },
    multiSelect: {
      id: "bridge-multi-project",
      prompt: "Welche zwei Aussagen über das Gartenprojekt sind richtig? Wähle genau zwei Antworten.",
      options: [
        { id: "rescue-path", label: "Ein Rettungsweg musste frei bleiben.", correct: true },
        { id: "children-herbs", label: "Kinder pflanzten Kräuter.", correct: true },
        { id: "heavy-rain", label: "Im ersten Sommer fiel besonders viel Regen.", correct: false },
        { id: "metal-boxes", label: "Die Pflanzkästen bestanden aus schwerem Metall.", correct: false },
      ],
      explanation: "Zeile 4 nennt den freien Rettungsweg; Zeile 6 beschreibt die von Kindern gepflanzten Kräuter.",
      evidenceLines: [4, 6],
    },
    binaryGrid: {
      id: "bridge-binary-project",
      rows: [
        {
          id: "bridge-proposal-railway",
          statement: "Die Idee für den Garten stammte von der Bahn.",
          correct: "false",
          explanation: "Falsch: Zeile 3 nennt einen Nachbarschaftsverein als Urheber der Idee.",
          evidenceLines: [3],
        },
        {
          id: "bridge-permission-conditions",
          statement: "Die Bahn erlaubte den Garten nur unter bestimmten Bedingungen.",
          correct: "true",
          explanation: "Richtig: Zeile 4 nennt leichte Kästen und einen freien Rettungsweg.",
          evidenceLines: [4],
        },
        {
          id: "bridge-new-metal-boxes",
          statement: "Die Freiwilligen kauften neue Pflanzkästen aus Metall.",
          correct: "false",
          explanation: "Falsch: Zeile 5 beschreibt gesammelte alte Holzkisten.",
          evidenceLines: [5],
        },
        {
          id: "bridge-same-plants",
          statement: "Kinder und ältere Bewohnerinnen pflanzten genau dieselben Pflanzen.",
          correct: "false",
          explanation: "Falsch: Zeile 6 unterscheidet Kräuter und robuste Blumen.",
          evidenceLines: [6],
        },
        {
          id: "bridge-water-often",
          statement: "Wegen des trockenen Sommers musste häufig gegossen werden.",
          correct: "true",
          explanation: "Richtig: Zeile 7 verbindet häufiges Giessen mit dem fehlenden Regen.",
          evidenceLines: [7],
        },
        {
          id: "bridge-became-meeting-place",
          statement: "Das Projekt machte aus dem Durchgang einen Ort für Begegnungen.",
          correct: "true",
          explanation: "Richtig: Zeilen 9 und 10 beschreiben Gespräche und den neuen Treffpunkt.",
          evidenceLines: [9, 10],
        },
      ],
    },
    vocabulary: [
      {
        id: "bridge-robust",
        line: 6,
        target: "robuste",
        correct: "widerstandsfähige",
        distractors: ["seltene", "duftlose", "künstliche"],
        explanation: "Robuste Pflanzen halten schwierige Bedingungen gut aus.",
      },
      {
        id: "bridge-ueberstanden",
        line: 8,
        target: "überstanden",
        correct: "überlebten",
        distractors: ["verschönerten", "verkürzten", "verursachten"],
        explanation: "Die Pflanzen überlebten die heissen Wochen trotz der Trockenheit.",
      },
    ],
  },
  {
    passage: {
      id: "repair-cafe",
      title: "Ein zweites Leben für alte Dinge",
      lines: [
        { number: 1, text: "Einmal im Monat verwandelt sich die Mehrzweckhalle in ein Reparaturcafé." },
        { number: 2, text: "Die Besucher bringen Lampen, Spielzeug, kleine Möbel und manchmal auch Fahrräder mit." },
        { number: 3, text: "Am Eingang erklärt eine Helferin, dass eine Reparatur nicht immer gelingen kann." },
        { number: 4, text: "Danach suchen die Gäste gemeinsam mit Freiwilligen nach der Ursache des Defekts." },
        { number: 5, text: "An einem Tisch sortiert Rami winzige Schrauben in beschriftete Schalen." },
        { number: 6, text: "Nebenan zeigt Frau Keller einem Kind, wie man ein loses Kabel sicher befestigt." },
        { number: 7, text: "Wer warten muss, kann bei Saft und Kuchen anderen Arbeiten zuschauen." },
        { number: 8, text: "Viele Gegenstände funktionieren später wieder, einige lassen sich jedoch nicht retten." },
        { number: 9, text: "Auch dann nehmen die Besitzer oft eine nützliche Erklärung mit nach Hause." },
        { number: 10, text: "Das Team freut sich über jedes Ding, das nicht vorschnell im Abfall landet." },
      ],
    },
    truth: [
      {
        id: "repair-guarantee",
        statement: "Das Reparaturcafé garantiert, dass jeder Gegenstand wieder funktioniert.",
        correct: "false",
        explanation: "Falsch: Zeilen 3 und 8 sagen ausdrücklich, dass Reparaturen scheitern können.",
        evidenceLines: [3, 8],
      },
      {
        id: "repair-cake-baker",
        statement: "Frau Keller hat den Kuchen gebacken.",
        correct: "undecidable",
        explanation: "Nicht entscheidbar: Der Text nennt Frau Keller bei einer Kabelreparatur, aber nicht beim Backen.",
      },
    ],
    additionalTruth: [
      {
        id: "repair-monthly",
        statement: "Das Reparaturcafé findet einmal pro Monat statt.",
        correct: "true",
        explanation: "Richtig: Diese Häufigkeit steht in Zeile 1.",
        evidenceLines: [1],
      },
      {
        id: "repair-guests-search",
        statement: "Die Gäste suchen gemeinsam mit Freiwilligen nach der Fehlerursache.",
        correct: "true",
        explanation: "Richtig: Genau diese Zusammenarbeit beschreibt Zeile 4.",
        evidenceLines: [4],
      },
      {
        id: "repair-watch-while-waiting",
        statement: "Wartende Besucher können anderen Reparaturen zuschauen.",
        correct: "true",
        explanation: "Richtig: Diese Möglichkeit nennt Zeile 7.",
        evidenceLines: [7],
      },
      {
        id: "repair-everything-saved",
        statement: "Am Ende werden alle mitgebrachten Gegenstände gerettet.",
        correct: "false",
        explanation: "Falsch: Zeile 8 sagt, dass sich einige Gegenstände nicht retten lassen.",
        evidenceLines: [8],
      },
      {
        id: "repair-rami-employed",
        statement: "Rami ist als bezahlter Mitarbeiter des Reparaturcafés angestellt.",
        correct: "undecidable",
        explanation: "Nicht entscheidbar: Der Text beschreibt Ramis Tätigkeit, aber weder Anstellung noch Bezahlung.",
      },
    ],
    evidence: [
      {
        id: "repair-learning",
        prompt: "Welche Zeile belegt, dass ein Besuch auch ohne erfolgreiche Reparatur nützlich sein kann?",
        correctLine: 9,
        explanation: "Zeile 9 nennt die hilfreiche Erklärung, die Besitzer trotzdem erhalten.",
      },
      {
        id: "repair-together",
        prompt: "Welche Zeile zeigt, dass Gäste an der Fehlersuche beteiligt sind?",
        correctLine: 4,
        explanation: "Zeile 4 sagt, dass Gäste und Freiwillige gemeinsam nach der Ursache suchen.",
      },
    ],
    additionalEvidence: {
      id: "repair-safe-instruction",
      prompt: "Welche Zeile zeigt am deutlichsten, dass im Reparaturcafé auch sicheres Vorgehen vermittelt wird?",
      correctLine: 6,
      explanation: "Zeile 6 beschreibt, wie Frau Keller das sichere Befestigen eines Kabels zeigt.",
    },
    multiSelect: {
      id: "repair-multi-learning",
      prompt: "Welche zwei Aussagen über den Ablauf sind richtig? Wähle genau zwei Antworten.",
      options: [
        { id: "shared-search", label: "Gäste und Freiwillige suchen gemeinsam nach der Ursache.", correct: true },
        { id: "useful-explanation", label: "Auch ohne erfolgreiche Reparatur kann eine Erklärung nützlich sein.", correct: true },
        { id: "guaranteed", label: "Jede mitgebrachte Sache wird garantiert repariert.", correct: false },
        { id: "weekly", label: "Das Reparaturcafé findet jede Woche statt.", correct: false },
      ],
      explanation: "Zeile 4 nennt die gemeinsame Fehlersuche; Zeile 9 beschreibt den Nutzen einer Erklärung trotz Misserfolg.",
      evidenceLines: [4, 9],
    },
    binaryGrid: {
      id: "repair-binary-process",
      rows: [
        {
          id: "repair-daily",
          statement: "Das Reparaturcafé findet jeden Tag statt.",
          correct: "false",
          explanation: "Falsch: Zeile 1 nennt einen Termin pro Monat.",
          evidenceLines: [1],
        },
        {
          id: "repair-guests-participate",
          statement: "Die Gäste beteiligen sich gemeinsam mit Freiwilligen an der Fehlersuche.",
          correct: "true",
          explanation: "Richtig: Genau diese Zusammenarbeit steht in Zeile 4.",
          evidenceLines: [4],
        },
        {
          id: "repair-labelled-bowls",
          statement: "Rami ordnet kleine Schrauben in beschriftete Schalen.",
          correct: "true",
          explanation: "Richtig: Zeile 5 beschreibt diese Tätigkeit.",
          evidenceLines: [5],
        },
        {
          id: "repair-waiting-hidden",
          statement: "Wartende Besucher dürfen den anderen Arbeiten nicht zuschauen.",
          correct: "false",
          explanation: "Falsch: Zeile 7 erlaubt ihnen ausdrücklich das Zuschauen.",
          evidenceLines: [7],
        },
        {
          id: "repair-all-succeed",
          statement: "Alle mitgebrachten Gegenstände funktionieren nach dem Besuch wieder.",
          correct: "false",
          explanation: "Falsch: Zeile 8 sagt, dass sich einige Dinge nicht retten lassen.",
          evidenceLines: [8],
        },
        {
          id: "repair-failure-can-teach",
          statement: "Auch eine gescheiterte Reparatur kann den Besitzern etwas Nützliches vermitteln.",
          correct: "true",
          explanation: "Richtig: Zeile 9 nennt die nützliche Erklärung trotz Misserfolg.",
          evidenceLines: [9],
        },
      ],
    },
    vocabulary: [
      {
        id: "repair-defekt",
        line: 4,
        target: "Defekts",
        correct: "Schadens",
        distractors: ["Preises", "Geräuschs", "Gewichts"],
        explanation: "Ein Defekt ist eine Beschädigung oder Funktionsstörung.",
      },
      {
        id: "repair-vorschnell",
        line: 10,
        target: "vorschnell",
        correct: "zu hastig",
        distractors: ["besonders leise", "erst sehr spät", "mit grosser Mühe"],
        explanation: "Vorschnell bedeutet, etwas ohne genügend Prüfung zu früh zu entscheiden.",
      },
    ],
  },
])

export interface GermanExamAuthorValidationEntry {
  passageId: string
  unitId: string
  familyId: "truth-status" | "reading-evidence" | "multi-evidence" | "vocabulary-context"
  currentResponseKind: "truth-grid-row" | "binary-grid-row" | "single-choice" | "multi-select"
  introducedInExamBlueprintVersion:
    | typeof GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION
    | typeof GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION
    | typeof GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION
    | typeof GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION
  evidenceLines: readonly number[]
  sourceStatus: "newly-authored-training-content"
  validationStatus: "automated-objective-checks"
}

export const germanExamAuthorValidationCatalog: readonly GermanExamAuthorValidationEntry[] = Object.freeze(
  passageTemplates.flatMap((template) => {
    const additionalTruthIds = new Set(template.additionalTruth.map((truth) => truth.id))
    return [
      ...[...template.truth, ...template.additionalTruth].map((truth): GermanExamAuthorValidationEntry => ({
        passageId: template.passage.id,
        unitId: truth.id,
        familyId: "truth-status",
        currentResponseKind: "truth-grid-row",
        introducedInExamBlueprintVersion: additionalTruthIds.has(truth.id)
          ? GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION
          : GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION,
        evidenceLines: Object.freeze([...(truth.evidenceLines ?? [])]),
        sourceStatus: "newly-authored-training-content",
        validationStatus: "automated-objective-checks",
      })),
      ...template.evidence.map((evidence): GermanExamAuthorValidationEntry => ({
        passageId: template.passage.id,
        unitId: evidence.id,
        familyId: "reading-evidence",
        currentResponseKind: "single-choice",
        introducedInExamBlueprintVersion: GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION,
        evidenceLines: Object.freeze([evidence.correctLine]),
        sourceStatus: "newly-authored-training-content",
        validationStatus: "automated-objective-checks",
      })),
      ({
        passageId: template.passage.id,
        unitId: template.additionalEvidence.id,
        familyId: "reading-evidence",
        currentResponseKind: "single-choice",
        introducedInExamBlueprintVersion: GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION,
        evidenceLines: Object.freeze([template.additionalEvidence.correctLine]),
        sourceStatus: "newly-authored-training-content",
        validationStatus: "automated-objective-checks",
      }) satisfies GermanExamAuthorValidationEntry,
      ({
        passageId: template.passage.id,
        unitId: template.multiSelect.id,
        familyId: "multi-evidence",
        currentResponseKind: "multi-select",
        introducedInExamBlueprintVersion: GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION,
        evidenceLines: Object.freeze([...template.multiSelect.evidenceLines]),
        sourceStatus: "newly-authored-training-content",
        validationStatus: "automated-objective-checks",
      }) satisfies GermanExamAuthorValidationEntry,
      ...template.binaryGrid.rows.map((row): GermanExamAuthorValidationEntry => ({
        passageId: template.passage.id,
        unitId: row.id,
        familyId: "truth-status",
        currentResponseKind: "binary-grid-row",
        introducedInExamBlueprintVersion: GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION,
        evidenceLines: Object.freeze([...(row.evidenceLines ?? [])]),
        sourceStatus: "newly-authored-training-content",
        validationStatus: "automated-objective-checks",
      })),
      ...template.vocabulary.map((vocabulary): GermanExamAuthorValidationEntry => ({
        passageId: template.passage.id,
        unitId: vocabulary.id,
        familyId: "vocabulary-context",
        currentResponseKind: "single-choice",
        introducedInExamBlueprintVersion: GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION,
        evidenceLines: Object.freeze([vocabulary.line]),
        sourceStatus: "newly-authored-training-content",
        validationStatus: "automated-objective-checks",
      })),
    ]
  }).map((entry) => Object.freeze(entry)),
)

function normalizedGermanAuthorText(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("de-CH").replace(/\s+/gu, " ").trim()
}

function collectGermanExamAuthorValidationIssues(): string[] {
  const issues: string[] = []
  const passageIds = new Set<string>()
  const globalUnitIds = new Set<string>()

  for (const template of passageTemplates) {
    const { passage } = template
    if (passageIds.has(passage.id)) issues.push(`duplicate passage id: ${passage.id}`)
    passageIds.add(passage.id)

    const lineNumbers = new Set<number>()
    for (const [index, line] of passage.lines.entries()) {
      if (line.number !== index + 1) {
        issues.push(`${passage.id}: line ${line.number} is not sequential at position ${index + 1}`)
      }
      if (lineNumbers.has(line.number)) issues.push(`${passage.id}: duplicate line ${line.number}`)
      if (!line.text.trim()) issues.push(`${passage.id}: line ${line.number} is empty`)
      lineNumbers.add(line.number)
    }

    const truthTemplates = [...template.truth, ...template.additionalTruth]
    const evidenceTemplates = [...template.evidence, template.additionalEvidence]
    const localUnitIds = new Set<string>()
    const registerUnit = (unitId: string): void => {
      if (localUnitIds.has(unitId)) issues.push(`${passage.id}: duplicate unit id ${unitId}`)
      if (globalUnitIds.has(unitId)) issues.push(`duplicate global unit id: ${unitId}`)
      localUnitIds.add(unitId)
      globalUnitIds.add(unitId)
    }
    const validateLine = (unitId: string, lineNumber: number): void => {
      if (!lineNumbers.has(lineNumber)) issues.push(`${passage.id}/${unitId}: missing line ${lineNumber}`)
    }

    if (truthTemplates.length !== 7) issues.push(`${passage.id}: expected 7 truth rows`)
    const truthStatuses = new Set<GermanTruthStatus>()
    for (const truth of truthTemplates) {
      registerUnit(truth.id)
      truthStatuses.add(truth.correct)
      if (!truth.statement.trim()) issues.push(`${passage.id}/${truth.id}: empty statement`)
      if (!truth.explanation.trim()) issues.push(`${passage.id}/${truth.id}: empty explanation`)
      if (truth.correct !== "undecidable" && !truth.evidenceLines?.length) {
        issues.push(`${passage.id}/${truth.id}: decidable row has no evidence line`)
      }
      for (const lineNumber of truth.evidenceLines ?? []) validateLine(truth.id, lineNumber)
    }
    for (const requiredStatus of ["true", "false", "undecidable"] as const) {
      if (!truthStatuses.has(requiredStatus)) issues.push(`${passage.id}: no ${requiredStatus} truth row`)
    }

    for (const evidence of evidenceTemplates) {
      registerUnit(evidence.id)
      if (!evidence.prompt.trim()) issues.push(`${passage.id}/${evidence.id}: empty evidence prompt`)
      if (!evidence.explanation.trim()) issues.push(`${passage.id}/${evidence.id}: empty evidence explanation`)
      validateLine(evidence.id, evidence.correctLine)
    }

    registerUnit(template.multiSelect.id)
    if (!template.multiSelect.prompt.trim()) issues.push(`${passage.id}/${template.multiSelect.id}: empty multi-select prompt`)
    if (!template.multiSelect.explanation.trim()) issues.push(`${passage.id}/${template.multiSelect.id}: empty multi-select explanation`)
    if (template.multiSelect.options.length !== 4) issues.push(`${passage.id}/${template.multiSelect.id}: expected four options`)
    if (template.multiSelect.options.filter((option) => option.correct).length !== 2) {
      issues.push(`${passage.id}/${template.multiSelect.id}: expected two correct options`)
    }
    const multiOptionIds = template.multiSelect.options.map((option) => option.id)
    const multiOptionLabels = template.multiSelect.options.map((option) => normalizedGermanAuthorText(option.label))
    if (new Set(multiOptionIds).size !== multiOptionIds.length || multiOptionIds.some((id) => !id.trim())) {
      issues.push(`${passage.id}/${template.multiSelect.id}: invalid or duplicate option ids`)
    }
    if (new Set(multiOptionLabels).size !== multiOptionLabels.length || multiOptionLabels.some((label) => !label)) {
      issues.push(`${passage.id}/${template.multiSelect.id}: invalid or duplicate option labels`)
    }
    if (!template.multiSelect.evidenceLines.length) issues.push(`${passage.id}/${template.multiSelect.id}: no evidence lines`)
    for (const lineNumber of template.multiSelect.evidenceLines) validateLine(template.multiSelect.id, lineNumber)

    const binaryStatuses = { true: 0, false: 0 }
    if (!template.binaryGrid.id.trim()) issues.push(`${passage.id}: empty binary-grid id`)
    if (template.binaryGrid.rows.length !== 6) issues.push(`${passage.id}: expected six binary-grid rows`)
    for (const row of template.binaryGrid.rows) {
      registerUnit(row.id)
      if (row.correct !== "true" && row.correct !== "false") {
        issues.push(`${passage.id}/${row.id}: binary row is not true or false`)
      } else {
        binaryStatuses[row.correct] += 1
      }
      if (!row.statement.trim()) issues.push(`${passage.id}/${row.id}: empty binary statement`)
      if (!row.explanation.trim()) issues.push(`${passage.id}/${row.id}: empty binary explanation`)
      if (!row.evidenceLines?.length) issues.push(`${passage.id}/${row.id}: binary row has no evidence line`)
      for (const lineNumber of row.evidenceLines ?? []) validateLine(row.id, lineNumber)
    }
    if (binaryStatuses.true !== 3 || binaryStatuses.false !== 3) {
      issues.push(`${passage.id}: binary-grid balance is ${binaryStatuses.true}/${binaryStatuses.false}`)
    }

    for (const vocabulary of template.vocabulary) {
      registerUnit(vocabulary.id)
      validateLine(vocabulary.id, vocabulary.line)
      const lineText = normalizedGermanAuthorText(
        passage.lines.find((line) => line.number === vocabulary.line)?.text ?? "",
      )
      const targetParts = vocabulary.target
        .split(/…|\.\.\./u)
        .map(normalizedGermanAuthorText)
        .filter(Boolean)
      if (!targetParts.length || targetParts.some((part) => !lineText.includes(part))) {
        issues.push(`${passage.id}/${vocabulary.id}: target is absent from line ${vocabulary.line}`)
      }
      const answerLabels = [vocabulary.correct, ...vocabulary.distractors].map(normalizedGermanAuthorText)
      if (vocabulary.distractors.length !== 3) {
        issues.push(`${passage.id}/${vocabulary.id}: expected 3 distractors`)
      }
      if (answerLabels.some((label) => !label)) issues.push(`${passage.id}/${vocabulary.id}: empty answer label`)
      if (new Set(answerLabels).size !== answerLabels.length) {
        issues.push(`${passage.id}/${vocabulary.id}: duplicate answer label`)
      }
      if (!vocabulary.explanation.trim()) issues.push(`${passage.id}/${vocabulary.id}: empty explanation`)
    }

    if (localUnitIds.size !== 19) issues.push(`${passage.id}: expected 19 unique author units`)
  }

  if (germanExamAuthorValidationCatalog.length !== passageTemplates.length * 19) {
    issues.push("author catalog does not contain 19 units per passage")
  }
  const catalogKeys = germanExamAuthorValidationCatalog.map((entry) => `${entry.passageId}:${entry.unitId}`)
  if (new Set(catalogKeys).size !== catalogKeys.length) issues.push("author catalog contains duplicate keys")
  return issues
}

export const germanExamAuthorValidationIssues: readonly string[] = Object.freeze(
  collectGermanExamAuthorValidationIssues(),
)

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = pickIndex(random, index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!]
  }
  return result
}

function baseQuestion(
  passage: GermanMicrotext,
  seed: string,
  templateId: string,
  blueprintVersion: GermanExamBlueprintVersion,
  generatorVersion: GermanGeneratorVersion,
): Pick<GermanGeneratedQuestion,
  | "id"
  | "subjectId"
  | "generatorId"
  | "generatorVersion"
  | "corpusVersion"
  | "scoringPolicyVersion"
  | "contentLocale"
  | "difficultyBand"
  | "templateId"
  | "topicId"
  | "seed"
  | "passage"
> {
  return {
    id: `german-exam:${blueprintVersion}:${templateId}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: (blueprintVersion >= GERMAN_DIFFICULTY_EXAM_BLUEPRINT_VERSION
      ? "exam"
      : "standard") satisfies GermanDifficultyBand,
    templateId,
    topicId: "reading-evidence",
    seed,
    passage,
  }
}

function truthQuestion(
  passage: GermanMicrotext,
  template: PassageTruthTemplate,
  seed: string,
  blueprintVersion: GermanExamBlueprintVersion,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  const labels = {
    true: "Richtig",
    false: "Falsch",
    undecidable: "Nicht entscheidbar",
  } as const
  return {
    ...baseQuestion(passage, seed, template.id, blueprintVersion, generatorVersion),
    familyId: "truth-status",
    prompt: `Ist die Aussage richtig, falsch oder mit dem Text nicht entscheidbar?\n\n«${template.statement}»`,
    options: shuffled(Object.entries(labels).map(([id, label]) => ({ id, label })), createRandom(`${seed}:options`)),
    correctOptionId: template.correct,
    explanation: template.explanation,
    evidenceLines: template.evidenceLines,
  }
}

function truthGridQuestion(
  passage: GermanMicrotext,
  templates: readonly PassageTruthTemplate[],
  seed: string,
  blueprintVersion: GermanExamBlueprintVersion,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  return {
    ...baseQuestion(passage, seed, "passage-truth-grid", blueprintVersion, generatorVersion),
    familyId: "truth-status",
    prompt: "Beurteile die sieben Aussagen anhand des Textes. Markiere pro Zeile genau eine Antwort. Diese Aufgabe zählt maximal 3 Punkte.",
    responseKind: "truth-grid",
    rows: templates.map((template) => ({
      id: template.id,
      statement: template.statement,
    })),
    statusOptions: [
      { id: "true", label: "Richtig" },
      { id: "false", label: "Falsch" },
      { id: "undecidable", label: "Nicht entscheidbar" },
    ],
    correctSelections: templates.map((template) => ({
      rowId: template.id,
      status: template.correct,
    })),
    explanation: "Prüfe jede Aussage einzeln: direkt belegt, durch den Text widerlegt oder nicht entscheidbar.",
  }
}

function binaryGridQuestion(
  passage: GermanMicrotext,
  template: PassageBinaryGridTemplate,
  seed: string,
  blueprintVersion: GermanExamBlueprintVersion,
  generatorVersion: GermanGeneratorVersion,
): GermanBinaryGridQuestion {
  return {
    ...baseQuestion(passage, seed, template.id, blueprintVersion, generatorVersion),
    familyId: "truth-status",
    prompt: "Beurteile die sechs Aussagen mit Richtig oder Falsch. Richtige Markierungen zählen +1, falsche −1; ausgelassene Zeilen zählen 0. Diese Aufgabe zählt maximal 3 Punkte.",
    responseKind: "binary-grid",
    rows: template.rows.map((row) => ({ id: row.id, statement: row.statement })),
    statusOptions: [
      { id: "true", label: "Richtig" },
      { id: "false", label: "Falsch" },
    ],
    correctSelections: template.rows.map((row) => ({
      rowId: row.id,
      status: row.correct as "true" | "false",
    })),
    explanation: "Zähle richtige Markierungen und ziehe falsche ab. Nicht beantwortete Zeilen verändern die Zwischenpunktzahl nicht.",
  }
}

function evidenceQuestion(
  passage: GermanMicrotext,
  template: PassageEvidenceTemplate,
  seed: string,
  blueprintVersion: GermanExamBlueprintVersion,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  return {
    ...baseQuestion(passage, seed, template.id, blueprintVersion, generatorVersion),
    familyId: "reading-evidence",
    prompt: template.prompt,
    options: shuffled(passage.lines.map((line) => ({
      id: `line-${line.number}`,
      label: `Zeile ${line.number}: ${line.text}`,
    })), createRandom(`${seed}:options`)),
    correctOptionId: `line-${template.correctLine}`,
    explanation: template.explanation,
    evidenceLines: [template.correctLine],
  }
}

function passageMultiSelectQuestion(
  passage: GermanMicrotext,
  template: PassageMultiSelectTemplate,
  seed: string,
  blueprintVersion: GermanExamBlueprintVersion,
  generatorVersion: GermanGeneratorVersion,
): GermanMultiSelectQuestion {
  return {
    ...baseQuestion(passage, seed, template.id, blueprintVersion, generatorVersion),
    familyId: "multi-evidence",
    prompt: template.prompt,
    responseKind: "multi-select",
    options: shuffled(template.options.map((option) => ({
      id: option.id,
      label: option.label,
    })), createRandom(`${seed}:options`)),
    correctOptionIds: template.options.flatMap((option) => option.correct ? [option.id] : []),
    selectionCount: 2,
    explanation: template.explanation,
    evidenceLines: template.evidenceLines,
  }
}

function vocabularyQuestion(
  passage: GermanMicrotext,
  template: PassageVocabularyTemplate,
  seed: string,
  blueprintVersion: GermanExamBlueprintVersion,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  return {
    ...baseQuestion(passage, seed, template.id, blueprintVersion, generatorVersion),
    topicId: "vocabulary-context",
    familyId: "vocabulary-context",
    prompt: `Was bedeutet «${template.target}» in Zeile ${template.line} am ehesten?`,
    options: shuffled([
      { id: "correct", label: template.correct },
      ...template.distractors.map((label, index) => ({ id: `distractor-${index + 1}`, label })),
    ], createRandom(`${seed}:options`)),
    correctOptionId: "correct",
    explanation: template.explanation,
    evidenceLines: [template.line],
  }
}

export interface GermanExamBlueprint {
  version: GermanExamBlueprintVersion
  title: string
  passage: GermanMicrotext
  questions: GermanGeneratedQuestion[]
  durationSeconds: typeof GERMAN_EXAM_DURATION_SECONDS
  maxPoints: number
}

function generatorVersionForBlueprint(version: GermanExamBlueprintVersion): GermanGeneratorVersion {
  if (version === GERMAN_LEGACY_EXAM_BLUEPRINT_VERSION) return GERMAN_LEGACY_GENERATOR_VERSION
  if (version === GERMAN_EXPANDED_EXAM_BLUEPRINT_VERSION) return GERMAN_EXPANDED_GENERATOR_VERSION
  if (version === GERMAN_MATCHING_EXAM_BLUEPRINT_VERSION) return GERMAN_MATCHING_GENERATOR_VERSION
  if (version <= GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION) return GERMAN_DIFFICULTY_GENERATOR_VERSION
  if (version === GERMAN_ACCEPTED_TEXT_EXAM_BLUEPRINT_VERSION) return GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION
  if (version <= GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION) return GERMAN_MULTI_SELECT_GENERATOR_VERSION
  return GERMAN_GENERATOR_VERSION
}

export function buildGermanExamBlueprint(
  seed: string,
  version: GermanExamBlueprintVersion = GERMAN_EXAM_BLUEPRINT_VERSION,
): GermanExamBlueprint {
  const generatorVersion = generatorVersionForBlueprint(version)
  const passageTemplate = passageTemplates[pickIndex(
    createRandom(`${seed}:passage`),
    passageTemplates.length,
  )]!
  const evidenceTemplates = version >= GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION
    ? passageTemplate.evidence.slice(0, 1)
    : version >= GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION &&
        version < GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION
      ? [...passageTemplate.evidence, passageTemplate.additionalEvidence]
      : passageTemplate.evidence
  const passageQuestions = [
    ...(version >= GERMAN_TRUTH_GRID_EXAM_BLUEPRINT_VERSION
      ? [truthGridQuestion(
          passageTemplate.passage,
          [...passageTemplate.truth, ...passageTemplate.additionalTruth],
          `${seed}:truth-grid`,
          version,
          generatorVersion,
        )]
      : passageTemplate.truth.map((template, index) => truthQuestion(
          passageTemplate.passage,
          template,
          `${seed}:truth:${index}`,
          version,
          generatorVersion,
        ))),
    ...(version >= GERMAN_PENALTY_GRID_EXAM_BLUEPRINT_VERSION
      ? [binaryGridQuestion(
          passageTemplate.passage,
          passageTemplate.binaryGrid,
          `${seed}:binary-grid`,
          version,
          generatorVersion,
        )]
      : []),
    ...evidenceTemplates.map((template, index) => evidenceQuestion(
      passageTemplate.passage,
      template,
      `${seed}:evidence:${index}`,
      version,
      generatorVersion,
    )),
    ...(version >= GERMAN_MULTI_SELECT_EXAM_BLUEPRINT_VERSION
      ? [passageMultiSelectQuestion(
          passageTemplate.passage,
          passageTemplate.multiSelect,
          `${seed}:multi-select`,
          version,
          generatorVersion,
        )]
      : []),
    ...passageTemplate.vocabulary.map((template, index) => vocabularyQuestion(
      passageTemplate.passage,
      template,
      `${seed}:vocabulary:${index}`,
      version,
      generatorVersion,
    )),
  ]
  const languageQuestionCounts = version >= GERMAN_EXAM_BLUEPRINT_VERSION
    ? ([
        ["word-formation", 2],
        ["grammar-correction", 3],
        ["sentence-structure", 4],
      ] as const)
    : ([
        ["word-formation", 3],
        ["grammar-correction", 3],
        ["sentence-structure", 3],
      ] as const)
  const languageQuestions = languageQuestionCounts.flatMap(([topicId, questionCount]) => generateGermanQuestions({
    lessonId: germanLessonIdByTopic[topicId],
    topicId,
    seed: `${seed}:language:${topicId}`,
    questionCount,
    generatorVersion,
    difficultyBand: version >= GERMAN_DIFFICULTY_EXAM_BLUEPRINT_VERSION ? "exam" : undefined,
  }))
  const questions = [...passageQuestions, ...languageQuestions]
  if (questions.length !== GERMAN_EXAM_QUESTION_COUNT) {
    throw new Error(`German exam blueprint must contain ${GERMAN_EXAM_QUESTION_COUNT} questions.`)
  }
  return {
    version,
    title: "Generierte Deutsch-Sprachprüfung",
    passage: passageTemplate.passage,
    questions,
    durationSeconds: GERMAN_EXAM_DURATION_SECONDS,
    maxPoints: questions.reduce((total, question) => (
      total + germanScoringRuleForQuestion(question).maximumPoints
    ), 0),
  }
}

function iso(now: Date): string {
  return now.toISOString()
}

export function createActiveGermanExam(
  seed: string,
  now = new Date(),
  blueprintVersion: GermanExamBlueprintVersion = GERMAN_EXAM_BLUEPRINT_VERSION,
): ActiveGermanExam {
  const blueprint = buildGermanExamBlueprint(seed, blueprintVersion)
  const timestamp = iso(now)
  return {
    schemaVersion: 1,
    id: `german-exam:${blueprintVersion}:${seed}`,
    blueprintVersion,
    generatorVersion: generatorVersionForBlueprint(blueprintVersion),
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    seed,
    passageId: blueprint.passage.id,
    startedAt: timestamp,
    updatedAt: timestamp,
    durationSeconds: GERMAN_EXAM_DURATION_SECONDS,
    currentQuestionIndex: 0,
    answers: {},
    flaggedQuestionIds: [],
  }
}

export function remainingGermanExamSeconds(exam: ActiveGermanExam, now = new Date()): number {
  const elapsed = Math.max(0, Math.floor((now.getTime() - Date.parse(exam.startedAt)) / 1_000))
  return Math.max(0, exam.durationSeconds - elapsed)
}

export function germanExamExpired(exam: ActiveGermanExam, now = new Date()): boolean {
  return remainingGermanExamSeconds(exam, now) === 0
}

export function answerGermanExamQuestion(
  exam: ActiveGermanExam,
  questionId: string,
  response: GermanObjectiveResponse,
  now = new Date(),
): ActiveGermanExam {
  const blueprint = buildGermanExamBlueprint(exam.seed, exam.blueprintVersion)
  const question = blueprint.questions.find((candidate) => candidate.id === questionId)
  if (!question || !isValidGermanResponse(question, response)) return exam
  return {
    ...exam,
    answers: {
      ...exam.answers,
      [questionId]: cloneGermanObjectiveResponse(response),
    },
    flaggedQuestionIds: [...exam.flaggedQuestionIds],
    updatedAt: iso(now),
  }
}

export function navigateGermanExam(
  exam: ActiveGermanExam,
  questionIndex: number,
  now = new Date(),
): ActiveGermanExam {
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= GERMAN_EXAM_QUESTION_COUNT) {
    return exam
  }
  return {
    ...exam,
    currentQuestionIndex: questionIndex,
    answers: { ...exam.answers },
    flaggedQuestionIds: [...exam.flaggedQuestionIds],
    updatedAt: iso(now),
  }
}

export function toggleGermanExamFlag(
  exam: ActiveGermanExam,
  questionId: string,
  now = new Date(),
): ActiveGermanExam {
  const blueprint = buildGermanExamBlueprint(exam.seed, exam.blueprintVersion)
  if (!blueprint.questions.some((question) => question.id === questionId)) return exam
  const flagged = new Set(exam.flaggedQuestionIds)
  if (flagged.has(questionId)) flagged.delete(questionId)
  else flagged.add(questionId)
  return {
    ...exam,
    answers: { ...exam.answers },
    flaggedQuestionIds: [...flagged],
    updatedAt: iso(now),
  }
}

export function gradeGermanExam(
  exam: ActiveGermanExam,
  submissionReason: GermanExamSubmissionReason,
  submittedAt = new Date(),
): GermanExamResult {
  const blueprint = buildGermanExamBlueprint(exam.seed, exam.blueprintVersion)
  const questionResults = blueprint.questions.map((question): GermanExamQuestionResult => {
    const response = exam.answers[question.id]
    if (isGermanMatchingQuestion(question)) {
      const matchingResponse = typeof response === "object" && response?.responseKind === "matching"
        ? response
        : undefined
      const score = scoreGermanObjectiveResponse(question, matchingResponse)
      return {
        ...score,
        questionId: question.id,
        topicId: question.topicId,
        familyId: question.familyId,
        responseKind: "matching",
        ...(matchingResponse
          ? { selectedMatches: matchingResponse.matches.map((match) => ({ ...match })) }
          : {}),
        correctMatches: question.correctMatches.map((match) => ({ ...match })),
        correct: score.exact,
        points: score.awardedPoints,
      }
    }
    if (isGermanAcceptedTextQuestion(question)) {
      const acceptedTextResponse = typeof response === "object" && response?.responseKind === "accepted-text"
        ? response
        : undefined
      const score = scoreGermanObjectiveResponse(question, acceptedTextResponse)
      const selectedAcceptedAnswerId = acceptedTextResponse
        ? germanAcceptedAnswerId(question, acceptedTextResponse.text)
        : undefined
      return {
        ...score,
        questionId: question.id,
        topicId: question.topicId,
        familyId: question.familyId,
        responseKind: "accepted-text",
        ...(acceptedTextResponse ? { selectedText: acceptedTextResponse.text } : {}),
        ...(selectedAcceptedAnswerId ? { selectedAcceptedAnswerId } : {}),
        correct: score.exact,
        points: score.awardedPoints,
      }
    }
    if (isGermanMultiSelectQuestion(question)) {
      const multiSelectResponse = typeof response === "object" && response?.responseKind === "multi-select"
        ? response
        : undefined
      const score = scoreGermanObjectiveResponse(question, multiSelectResponse)
      return {
        ...score,
        questionId: question.id,
        topicId: question.topicId,
        familyId: question.familyId,
        responseKind: "multi-select",
        ...(multiSelectResponse
          ? { selectedOptionIds: [...multiSelectResponse.selectedOptionIds] }
          : {}),
        correctOptionIds: [...question.correctOptionIds],
        correct: score.exact,
        points: score.awardedPoints,
      }
    }
    if (isGermanBinaryGridQuestion(question)) {
      const binaryResponse = typeof response === "object" && response?.responseKind === "binary-grid"
        ? response
        : undefined
      const score = scoreGermanObjectiveResponse(question, binaryResponse)
      return {
        ...score,
        questionId: question.id,
        topicId: question.topicId,
        familyId: question.familyId,
        responseKind: "binary-grid",
        ...(binaryResponse
          ? { selectedSelections: binaryResponse.selections.map((selection) => ({ ...selection })) }
          : {}),
        correctSelections: question.correctSelections.map((selection) => ({ ...selection })),
        correct: score.exact,
        points: score.awardedPoints,
      }
    }
    if (isGermanTruthGridQuestion(question)) {
      const truthResponse = typeof response === "object" && response?.responseKind === "truth-grid"
        ? response
        : undefined
      const score = scoreGermanObjectiveResponse(question, truthResponse)
      return {
        ...score,
        questionId: question.id,
        topicId: question.topicId,
        familyId: question.familyId,
        responseKind: "truth-grid",
        ...(truthResponse
          ? { selectedSelections: truthResponse.selections.map((selection) => ({ ...selection })) }
          : {}),
        correctSelections: question.correctSelections.map((selection) => ({ ...selection })),
        correct: score.exact,
        points: score.awardedPoints,
      }
    }
    const selectedOptionId = typeof response === "string" ? response : undefined
    const score = scoreGermanObjectiveResponse(question, selectedOptionId)
    return {
      ...score,
      questionId: question.id,
      topicId: question.topicId,
      familyId: question.familyId,
      ...(selectedOptionId ? { selectedOptionId } : {}),
      correctOptionId: question.correctOptionId,
      correct: score.exact,
      points: score.awardedPoints,
    }
  })
  const topicResults = germanPilotTopicIds
    .map((topicId): GermanExamTopicResult | undefined => {
      const results = questionResults.filter((result) => result.topicId === topicId)
      return results.length === 0 ? undefined : {
        topicId,
        correct: results.filter((result) => result.correct).length,
        total: results.length,
      }
    })
    .filter((result): result is GermanExamTopicResult => Boolean(result))
  const elapsedSeconds = Math.max(
    0,
    Math.floor((submittedAt.getTime() - Date.parse(exam.startedAt)) / 1_000),
  )
  return {
    id: `result:${exam.id}:${submittedAt.toISOString()}`,
    examId: exam.id,
    blueprintVersion: exam.blueprintVersion,
    generatorVersion: exam.generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    seed: exam.seed,
    passageId: exam.passageId,
    startedAt: exam.startedAt,
    submittedAt: submittedAt.toISOString(),
    durationSeconds: Math.min(exam.durationSeconds, elapsedSeconds),
    submissionReason,
    correctPoints: questionResults.reduce((total, result) => total + result.points, 0),
    maxPoints: blueprint.maxPoints,
    questionResults,
    topicResults,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value))
}

function isBoundedString(value: unknown, maximum = 2_000): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maximum
}

function isBoundedDraft(value: unknown, maximum = 2_000): value is string {
  return typeof value === "string" && value.length <= maximum
}

function matchingPairsFromUnknown(value: unknown): GermanMatchingPair[] | undefined {
  if (!Array.isArray(value) || value.length > 20) return undefined
  const pairs: GermanMatchingPair[] = []
  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !isBoundedString(candidate.itemId, 500) ||
      !isBoundedString(candidate.targetId, 500)
    ) return undefined
    pairs.push({ itemId: candidate.itemId, targetId: candidate.targetId })
  }
  return pairs
}

function truthSelectionsFromUnknown(value: unknown): GermanTruthGridSelection[] | undefined {
  if (!Array.isArray(value) || value.length > 20) return undefined
  const selections: GermanTruthGridSelection[] = []
  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !isBoundedString(candidate.rowId, 500) ||
      (candidate.status !== "true" && candidate.status !== "false" && candidate.status !== "undecidable")
    ) return undefined
    selections.push({ rowId: candidate.rowId, status: candidate.status as GermanTruthStatus })
  }
  return selections
}

function germanResponseFromUnknown(value: unknown): GermanObjectiveResponse | undefined {
  if (typeof value === "string") return value
  if (!isRecord(value)) return undefined
  if (value.responseKind === "matching") {
    const matches = matchingPairsFromUnknown(value.matches)
    return matches ? { responseKind: "matching", matches } : undefined
  }
  if (value.responseKind === "truth-grid") {
    const selections = truthSelectionsFromUnknown(value.selections)
    return selections ? { responseKind: "truth-grid", selections } : undefined
  }
  if (value.responseKind === "binary-grid") {
    const selections = truthSelectionsFromUnknown(value.selections)
    return selections ? { responseKind: "binary-grid", selections } : undefined
  }
  if (value.responseKind === "accepted-text" && isBoundedDraft(value.text, 500)) {
    return { responseKind: "accepted-text", text: value.text }
  }
  if (value.responseKind === "multi-select" && Array.isArray(value.selectedOptionIds)) {
    if (
      value.selectedOptionIds.length > 20 ||
      !value.selectedOptionIds.every((optionId) => isBoundedString(optionId, 500))
    ) return undefined
    return { responseKind: "multi-select", selectedOptionIds: [...value.selectedOptionIds] as string[] }
  }
  return undefined
}

function matchingPairsEqual(
  left: readonly GermanMatchingPair[] | undefined,
  right: readonly GermanMatchingPair[],
): boolean {
  if (!left || left.length !== right.length) return false
  const orderedLeft = [...left].sort((a, b) => a.itemId.localeCompare(b.itemId))
  const orderedRight = [...right].sort((a, b) => a.itemId.localeCompare(b.itemId))
  return orderedLeft.every((pair, index) => (
    pair.itemId === orderedRight[index]?.itemId &&
    pair.targetId === orderedRight[index]?.targetId
  ))
}

function truthSelectionsEqual(
  left: readonly GermanTruthGridSelection[] | undefined,
  right: readonly GermanTruthGridSelection[],
): boolean {
  if (!left || left.length !== right.length) return false
  const orderedLeft = [...left].sort((a, b) => a.rowId.localeCompare(b.rowId))
  const orderedRight = [...right].sort((a, b) => a.rowId.localeCompare(b.rowId))
  return orderedLeft.every((selection, index) => (
    selection.rowId === orderedRight[index]?.rowId &&
    selection.status === orderedRight[index]?.status
  ))
}

function optionIdsEqual(
  left: readonly string[] | undefined,
  right: readonly string[],
): boolean {
  if (!left || left.length !== right.length) return false
  const orderedLeft = [...left].sort((a, b) => a.localeCompare(b))
  const orderedRight = [...right].sort((a, b) => a.localeCompare(b))
  return orderedLeft.every((optionId, index) => optionId === orderedRight[index])
}

function scoringEvidenceMatches(
  result: Record<string, unknown>,
  expected: GermanObjectiveScoreEvidence,
): boolean {
  const evidenceKeys = [
    "scoringRuleId",
    "scoringPolicyVersion",
    "correctUnits",
    "totalUnits",
    "awardedPoints",
    "maximumPoints",
    "exact",
  ] as const
  if (evidenceKeys.every((key) => result[key] === undefined)) return true
  return evidenceKeys.every((key) => result[key] === expected[key]) &&
    result.incorrectUnits === expected.incorrectUnits &&
    result.intermediateUnits === expected.intermediateUnits
}

export function isActiveGermanExam(value: unknown): value is ActiveGermanExam {
  if (!isRecord(value) ||
    value.schemaVersion !== 1 ||
    !germanExamBlueprintVersions.includes(value.blueprintVersion as GermanExamBlueprintVersion) ||
    value.generatorVersion !== generatorVersionForBlueprint(value.blueprintVersion as GermanExamBlueprintVersion) ||
    value.corpusVersion !== GERMAN_CORPUS_VERSION ||
    value.scoringPolicyVersion !== GERMAN_SCORING_POLICY_VERSION ||
    !isBoundedString(value.id) ||
    !isBoundedString(value.seed) ||
    !isBoundedString(value.passageId, 500) ||
    !isDate(value.startedAt) ||
    !isDate(value.updatedAt) ||
    value.durationSeconds !== GERMAN_EXAM_DURATION_SECONDS ||
    typeof value.currentQuestionIndex !== "number" ||
    !Number.isInteger(value.currentQuestionIndex) ||
    value.currentQuestionIndex < 0 ||
    value.currentQuestionIndex >= GERMAN_EXAM_QUESTION_COUNT ||
    !isRecord(value.answers) ||
    !Array.isArray(value.flaggedQuestionIds)
  ) return false
  const blueprint = buildGermanExamBlueprint(value.seed, value.blueprintVersion as GermanExamBlueprintVersion)
  if (
    value.id !== `german-exam:${value.blueprintVersion}:${value.seed}` ||
    Date.parse(value.updatedAt) < Date.parse(value.startedAt) ||
    blueprint.passage.id !== value.passageId
  ) return false
  const questionsById = new Map(blueprint.questions.map((question) => [question.id, question]))
  const answersValid = Object.entries(value.answers).length <= GERMAN_EXAM_QUESTION_COUNT &&
    Object.entries(value.answers).every(([questionId, rawResponse]) => {
      const question = questionsById.get(questionId)
      const response = germanResponseFromUnknown(rawResponse)
      return Boolean(question && response !== undefined && isValidGermanResponse(question, response))
    })
  const flagsValid = value.flaggedQuestionIds.length <= GERMAN_EXAM_QUESTION_COUNT &&
    value.flaggedQuestionIds.every((questionId) => typeof questionId === "string" && questionsById.has(questionId)) &&
    new Set(value.flaggedQuestionIds).size === value.flaggedQuestionIds.length
  return answersValid && flagsValid
}

export function isGermanExamResult(value: unknown): value is GermanExamResult {
  if (!isRecord(value) ||
    !isBoundedString(value.id) ||
    !isBoundedString(value.examId) ||
    !germanExamBlueprintVersions.includes(value.blueprintVersion as GermanExamBlueprintVersion) ||
    value.generatorVersion !== generatorVersionForBlueprint(value.blueprintVersion as GermanExamBlueprintVersion) ||
    value.corpusVersion !== GERMAN_CORPUS_VERSION ||
    value.scoringPolicyVersion !== GERMAN_SCORING_POLICY_VERSION ||
    !isBoundedString(value.seed) ||
    !isBoundedString(value.passageId, 500) ||
    !isDate(value.startedAt) ||
    !isDate(value.submittedAt) ||
    typeof value.durationSeconds !== "number" ||
    !Number.isInteger(value.durationSeconds) ||
    value.durationSeconds < 0 ||
    value.durationSeconds > GERMAN_EXAM_DURATION_SECONDS ||
    (value.submissionReason !== "submitted" && value.submissionReason !== "timeout") ||
    typeof value.correctPoints !== "number" ||
    !Number.isInteger(value.correctPoints) ||
    value.correctPoints < 0 ||
    typeof value.maxPoints !== "number" ||
    !Number.isInteger(value.maxPoints) ||
    value.maxPoints < 1 ||
    value.maxPoints > 100 ||
    !Array.isArray(value.questionResults) ||
    value.questionResults.length !== GERMAN_EXAM_QUESTION_COUNT ||
    !Array.isArray(value.topicResults)
  ) return false
  const blueprint = buildGermanExamBlueprint(value.seed, value.blueprintVersion as GermanExamBlueprintVersion)
  const expectedExamId = `german-exam:${value.blueprintVersion}:${value.seed}`
  const elapsedSeconds = Math.floor((Date.parse(value.submittedAt) - Date.parse(value.startedAt)) / 1_000)
  if (
    blueprint.passage.id !== value.passageId ||
    value.correctPoints > blueprint.maxPoints ||
    value.maxPoints !== blueprint.maxPoints ||
    value.examId !== expectedExamId ||
    value.id !== `result:${value.examId}:${value.submittedAt}` ||
    elapsedSeconds < 0 ||
    value.durationSeconds !== Math.min(GERMAN_EXAM_DURATION_SECONDS, elapsedSeconds) ||
    (value.submissionReason === "timeout" && elapsedSeconds < GERMAN_EXAM_DURATION_SECONDS)
  ) return false
  const questionResultsValid = value.questionResults.every((result, index) => {
    const question = blueprint.questions[index]
    if (!isRecord(result) || !question) return false
    if (isGermanMatchingQuestion(question)) {
      const selectedMatches = result.selectedMatches === undefined
        ? undefined
        : matchingPairsFromUnknown(result.selectedMatches)
      const correctMatches = matchingPairsFromUnknown(result.correctMatches)
      const response: GermanMatchingResponse | undefined = selectedMatches
        ? { responseKind: "matching", matches: selectedMatches }
        : undefined
      const expectedScore = scoreGermanObjectiveResponse(question, response)
      return result.questionId === question.id &&
        result.topicId === question.topicId &&
        result.familyId === question.familyId &&
        result.responseKind === "matching" &&
        correctMatches !== undefined &&
        matchingPairsEqual(correctMatches, question.correctMatches) &&
        (selectedMatches !== undefined || result.selectedMatches === undefined) &&
        typeof result.correct === "boolean" &&
        typeof result.points === "number" &&
        Number.isInteger(result.points) &&
        scoringEvidenceMatches(result, expectedScore) &&
        result.correct === expectedScore.exact &&
        result.points === expectedScore.awardedPoints
    }
    if (isGermanAcceptedTextQuestion(question)) {
      const selectedAcceptedAnswer = result.selectedAcceptedAnswerId === undefined
        ? undefined
        : question.acceptedAnswers.find((answer) => answer.id === result.selectedAcceptedAnswerId)
      if (result.selectedAcceptedAnswerId !== undefined && !selectedAcceptedAnswer) return false
      if (result.selectedText !== undefined && (
        typeof result.selectedText !== "string" ||
        result.selectedText.length > question.maximumLength
      )) return false
      const selectedText = result.selectedText ?? selectedAcceptedAnswer?.text
      const response: GermanAcceptedTextResponse | undefined = selectedText !== undefined
        ? { responseKind: "accepted-text", text: selectedText }
        : undefined
      const expectedScore = scoreGermanObjectiveResponse(question, response)
      return result.questionId === question.id &&
        result.topicId === question.topicId &&
        result.familyId === question.familyId &&
        result.responseKind === "accepted-text" &&
        result.selectedAcceptedAnswerId === (
          selectedText === undefined ? undefined : germanAcceptedAnswerId(question, selectedText)
        ) &&
        result.scoringRuleId === expectedScore.scoringRuleId &&
        result.scoringPolicyVersion === expectedScore.scoringPolicyVersion &&
        typeof result.correct === "boolean" &&
        typeof result.points === "number" &&
        Number.isInteger(result.points) &&
        scoringEvidenceMatches(result, expectedScore) &&
        result.correct === expectedScore.exact &&
        result.points === expectedScore.awardedPoints
    }
    if (isGermanMultiSelectQuestion(question)) {
      const validQuestionOptionIds = new Set(question.options.map((option) => option.id))
      const selectedOptionIds = result.selectedOptionIds === undefined
        ? undefined
        : Array.isArray(result.selectedOptionIds) &&
            result.selectedOptionIds.length <= question.selectionCount &&
            new Set(result.selectedOptionIds).size === result.selectedOptionIds.length &&
            result.selectedOptionIds.every((optionId) => (
              isBoundedString(optionId, 500) && validQuestionOptionIds.has(optionId)
            ))
          ? result.selectedOptionIds as string[]
          : undefined
      const correctOptionIds = Array.isArray(result.correctOptionIds) &&
        result.correctOptionIds.every((optionId) => isBoundedString(optionId, 500))
        ? result.correctOptionIds as string[]
        : undefined
      const response: GermanMultiSelectResponse | undefined = selectedOptionIds
        ? { responseKind: "multi-select", selectedOptionIds }
        : undefined
      const expectedScore = scoreGermanObjectiveResponse(question, response)
      return result.questionId === question.id &&
        result.topicId === question.topicId &&
        result.familyId === question.familyId &&
        result.responseKind === "multi-select" &&
        (result.selectedOptionIds === undefined || selectedOptionIds !== undefined) &&
        correctOptionIds !== undefined &&
        optionIdsEqual(correctOptionIds, question.correctOptionIds) &&
        (selectedOptionIds !== undefined || result.selectedOptionIds === undefined) &&
        typeof result.correct === "boolean" &&
        typeof result.points === "number" &&
        Number.isInteger(result.points) &&
        scoringEvidenceMatches(result, expectedScore) &&
        result.correct === expectedScore.exact &&
        result.points === expectedScore.awardedPoints
    }
    if (isGermanBinaryGridQuestion(question)) {
      const selectedSelections = result.selectedSelections === undefined
        ? undefined
        : truthSelectionsFromUnknown(result.selectedSelections)
      const correctSelections = truthSelectionsFromUnknown(result.correctSelections)
      const response: GermanBinaryGridResponse | undefined = selectedSelections
        ? { responseKind: "binary-grid", selections: selectedSelections }
        : undefined
      const expectedScore = scoreGermanObjectiveResponse(question, response)
      return result.questionId === question.id &&
        result.topicId === question.topicId &&
        result.familyId === question.familyId &&
        result.responseKind === "binary-grid" &&
        result.scoringRuleId === expectedScore.scoringRuleId &&
        result.scoringPolicyVersion === expectedScore.scoringPolicyVersion &&
        correctSelections !== undefined &&
        truthSelectionsEqual(correctSelections, question.correctSelections) &&
        (selectedSelections !== undefined || result.selectedSelections === undefined) &&
        (response === undefined || isValidGermanResponse(question, response)) &&
        typeof result.correct === "boolean" &&
        typeof result.points === "number" &&
        Number.isInteger(result.points) &&
        scoringEvidenceMatches(result, expectedScore) &&
        result.correct === expectedScore.exact &&
        result.points === expectedScore.awardedPoints
    }
    if (isGermanTruthGridQuestion(question)) {
      const selectedSelections = result.selectedSelections === undefined
        ? undefined
        : truthSelectionsFromUnknown(result.selectedSelections)
      const correctSelections = truthSelectionsFromUnknown(result.correctSelections)
      const response: GermanTruthGridResponse | undefined = selectedSelections
        ? { responseKind: "truth-grid", selections: selectedSelections }
        : undefined
      const expectedScore = scoreGermanObjectiveResponse(question, response)
      return result.questionId === question.id &&
        result.topicId === question.topicId &&
        result.familyId === question.familyId &&
        result.responseKind === "truth-grid" &&
        correctSelections !== undefined &&
        truthSelectionsEqual(correctSelections, question.correctSelections) &&
        (selectedSelections !== undefined || result.selectedSelections === undefined) &&
        typeof result.correct === "boolean" &&
        typeof result.points === "number" &&
        Number.isInteger(result.points) &&
        scoringEvidenceMatches(result, expectedScore) &&
        result.correct === expectedScore.exact &&
        result.points === expectedScore.awardedPoints
    }
    const selectedOptionValid = result && (
      result.selectedOptionId === undefined ||
      question?.options.some((option) => option.id === result.selectedOptionId)
    )
    const expectedScore = scoreGermanObjectiveResponse(question, result.selectedOptionId as string | undefined)
    return Boolean(
      isRecord(result) && question &&
      result.questionId === question.id &&
      result.topicId === question.topicId &&
      result.familyId === question.familyId &&
      selectedOptionValid &&
      result.correctOptionId === question.correctOptionId &&
      typeof result.correct === "boolean" &&
      typeof result.points === "number" &&
      Number.isInteger(result.points) &&
      scoringEvidenceMatches(result, expectedScore) &&
      result.correct === expectedScore.exact &&
      result.points === expectedScore.awardedPoints
    )
  })
  if (!questionResultsValid) return false

  const questionResults = value.questionResults as unknown as GermanExamQuestionResult[]
  const expectedCorrectPoints = questionResults.reduce((total, result) => total + result.points, 0)
  const expectedTopicResults = germanPilotTopicIds.flatMap((topicId) => {
    const results = questionResults.filter((result) => result.topicId === topicId)
    return results.length === 0 ? [] : [{
      topicId,
      correct: results.filter((result) => result.correct).length,
      total: results.length,
    }]
  })
  return value.correctPoints === expectedCorrectPoints &&
    value.topicResults.length === expectedTopicResults.length &&
    value.topicResults.every((result, index) => {
      const expected = expectedTopicResults[index]
      return Boolean(
        isRecord(result) && expected &&
        result.topicId === expected.topicId &&
        result.correct === expected.correct &&
        result.total === expected.total
      )
    })
}
