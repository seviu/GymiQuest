import { createRandom, pickIndex } from "../../domain/random"
import { germanMicrotexts, type GermanMicrotext } from "./content"
import {
  GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION,
  GERMAN_CORPUS_VERSION,
  GERMAN_DIFFICULTY_GENERATOR_VERSION,
  GERMAN_EXPANDED_GENERATOR_VERSION,
  GERMAN_GENERATOR_VERSION,
  GERMAN_MATCHING_GENERATOR_VERSION,
  GERMAN_MULTI_SELECT_GENERATOR_VERSION,
  GERMAN_SCORING_POLICY_VERSION,
  germanGeneratorVersions,
  germanLessonIdByTopic,
  type GermanGeneratorVersion,
  type GermanLessonId,
  type GermanPilotTopicId,
} from "./package"

export type GermanObjectiveFamilyId =
  | "truth-status"
  | "reading-evidence"
  | "multi-evidence"
  | "vocabulary-context"
  | "word-formation"
  | "one-error-correction"
  | "sentence-constituents"
  | "connector-cloze"
  | "tense-perspective"
  | "word-class"

export const germanDifficultyBands = ["foundation", "standard", "exam"] as const
export type GermanDifficultyBand = typeof germanDifficultyBands[number]

export interface GermanGenerationTask {
  lessonId: GermanLessonId
  topicId: GermanPilotTopicId
  seed: string
  questionCount: number
  excludedTemplateIds?: readonly string[]
  generatorVersion?: GermanGeneratorVersion
  difficultyBand?: GermanDifficultyBand
}

export interface GermanQuestionOption {
  id: string
  label: string
}

interface GermanQuestionBase {
  id: string
  subjectId: "german"
  generatorId: "zh-zap1-german"
  generatorVersion: GermanGeneratorVersion
  corpusVersion: typeof GERMAN_CORPUS_VERSION
  scoringPolicyVersion: typeof GERMAN_SCORING_POLICY_VERSION
  contentLocale: "de-CH"
  difficultyBand: GermanDifficultyBand
  familyId: GermanObjectiveFamilyId
  templateId: string
  topicId: GermanPilotTopicId
  seed: string
  passage?: GermanMicrotext
  prompt: string
  explanation: string
  evidenceLines?: readonly number[]
}

export interface GermanChoiceQuestion extends GermanQuestionBase {
  options: readonly GermanQuestionOption[]
  correctOptionId: string
}

export interface GermanMatchingItem {
  id: string
  label: string
}

export interface GermanMatchingTarget {
  id: string
  label: string
}

export interface GermanMatchingPair {
  itemId: string
  targetId: string
}

export interface GermanMatchingQuestion extends GermanQuestionBase {
  responseKind: "matching"
  matchingScoring?: "sentence-analysis-deduction-2025"
  items: readonly GermanMatchingItem[]
  targets: readonly GermanMatchingTarget[]
  correctMatches: readonly GermanMatchingPair[]
}

export type GermanTruthStatus = "true" | "false" | "undecidable"

export interface GermanTruthGridRow {
  id: string
  statement: string
}

export interface GermanTruthGridSelection {
  rowId: string
  status: GermanTruthStatus
}

export interface GermanTruthGridQuestion extends GermanQuestionBase {
  responseKind: "truth-grid"
  rows: readonly GermanTruthGridRow[]
  statusOptions: readonly GermanQuestionOption[]
  correctSelections: readonly GermanTruthGridSelection[]
}

export interface GermanBinaryGridQuestion extends GermanQuestionBase {
  responseKind: "binary-grid"
  rows: readonly GermanTruthGridRow[]
  statusOptions: readonly GermanQuestionOption[]
  correctSelections: readonly GermanTruthGridSelection[]
}

export interface GermanAcceptedTextAnswer {
  id: string
  text: string
}

export interface GermanAcceptedTextQuestion extends GermanQuestionBase {
  responseKind: "accepted-text"
  inputLabel: string
  maximumLength: number
  acceptedAnswers: readonly GermanAcceptedTextAnswer[]
}

export interface GermanMultiSelectQuestion extends GermanQuestionBase {
  responseKind: "multi-select"
  options: readonly GermanQuestionOption[]
  correctOptionIds: readonly string[]
  selectionCount: number
}

export type GermanGeneratedQuestion =
  | GermanChoiceQuestion
  | GermanMatchingQuestion
  | GermanTruthGridQuestion
  | GermanBinaryGridQuestion
  | GermanAcceptedTextQuestion
  | GermanMultiSelectQuestion

export function isGermanMatchingQuestion(
  question: GermanGeneratedQuestion,
): question is GermanMatchingQuestion {
  return "responseKind" in question && question.responseKind === "matching"
}

export function isGermanExactMatchingQuestion(
  question: GermanGeneratedQuestion,
): question is GermanMatchingQuestion {
  return isGermanMatchingQuestion(question) && question.matchingScoring === undefined
}

export function isGermanSentenceAnalysisQuestion(
  question: GermanGeneratedQuestion,
): question is GermanMatchingQuestion & { matchingScoring: "sentence-analysis-deduction-2025" } {
  return isGermanMatchingQuestion(question) &&
    question.matchingScoring === "sentence-analysis-deduction-2025"
}

export function isGermanTruthGridQuestion(
  question: GermanGeneratedQuestion,
): question is GermanTruthGridQuestion {
  return "responseKind" in question && question.responseKind === "truth-grid"
}

export function isGermanBinaryGridQuestion(
  question: GermanGeneratedQuestion,
): question is GermanBinaryGridQuestion {
  return "responseKind" in question && question.responseKind === "binary-grid"
}

export function isGermanAcceptedTextQuestion(
  question: GermanGeneratedQuestion,
): question is GermanAcceptedTextQuestion {
  return "responseKind" in question && question.responseKind === "accepted-text"
}

export function isGermanMultiSelectQuestion(
  question: GermanGeneratedQuestion,
): question is GermanMultiSelectQuestion {
  return "responseKind" in question && question.responseKind === "multi-select"
}

export function isGermanChoiceQuestion(
  question: GermanGeneratedQuestion,
): question is GermanChoiceQuestion {
  return !("responseKind" in question)
}

interface ReadingEvidenceTemplate {
  id: string
  passageId: string
  prompt: string
  correctLine: number
  explanation: string
}

const readingTemplates: readonly ReadingEvidenceTemplate[] = Object.freeze([
  {
    id: "lost-key-noticed",
    passageId: "lost-key",
    prompt: "Welche Zeile belegt, dass Mara den Verlust nicht unterwegs bemerkte?",
    correctLine: 1,
    explanation: "Zeile 1 nennt ausdrücklich den Zeitpunkt: erst vor der Haustür.",
  },
  {
    id: "lost-key-relief",
    passageId: "lost-key",
    prompt: "Welche Zeile zeigt Maras Erleichterung am deutlichsten?",
    correctLine: 4,
    explanation: "Zeile 4 benennt ihre Erleichterung direkt und beschreibt ihre schnelle Heimkehr.",
  },
  {
    id: "library-early",
    passageId: "library-window",
    prompt: "Welche Zeile belegt, dass Noah mehr Arbeitszeit als sonst hatte?",
    correctLine: 1,
    explanation: "Zeile 1 sagt, dass Noah früher als sonst ankam.",
  },
  {
    id: "library-progress",
    passageId: "library-window",
    prompt: "Welche Zeile belegt, dass Noah bereits gearbeitet hatte, bevor seine Freundin kam?",
    correctLine: 4,
    explanation: "Zeile 4 verbindet ihre Ankunft mit seinen bereits geschriebenen Notizen.",
  },
  {
    id: "rain-protection",
    passageId: "rain-rehearsal",
    prompt: "Welche Zeile erklärt, wie die Gruppe die Requisiten vor dem Regen schützte?",
    correctLine: 2,
    explanation: "Zeile 2 nennt den Hintereingang als Reaktion auf den Regen.",
  },
  {
    id: "rain-on-time",
    passageId: "rain-rehearsal",
    prompt: "Welche Zeile belegt, dass die Verspätung das Ende der Probe nicht verschob?",
    correctLine: 4,
    explanation: "Zeile 4 stellt den späteren Beginn dem pünktlichen Ende gegenüber.",
  },
  {
    id: "bell-problem",
    passageId: "bike-bell",
    prompt: "Welche Zeile belegt, dass die Klingel zuerst nicht richtig funktionierte?",
    correctLine: 2,
    explanation: "Zeile 2 beschreibt, dass beim Test kaum ein Ton zu hören war.",
  },
  {
    id: "bell-repair",
    passageId: "bike-bell",
    prompt: "Welche Zeile nennt die konkrete Reparatur?",
    correctLine: 3,
    explanation: "Zeile 3 nennt das Festziehen der lockeren Schraube.",
  },
  {
    id: "lost-key-systematic-search",
    passageId: "lost-key",
    prompt: "Welche Zeile zeigt am besten, dass Mara ihren Rückweg systematisch absuchte?",
    correctLine: 2,
    explanation: "Zeile 2 verbindet das langsame Zurückgehen mit der wiederholten Suche unter jeder Bank.",
  },
])

type TruthStatus = GermanTruthStatus

interface TruthStatusTemplate {
  id: string
  passageId: string
  statement: string
  correctStatus: TruthStatus
  explanation: string
  evidenceLines?: readonly number[]
}

const truthStatusTemplates: readonly TruthStatusTemplate[] = Object.freeze([
  {
    id: "lost-key-noticed-late",
    passageId: "lost-key",
    statement: "Mara bemerkte den fehlenden Schlüssel schon während des Heimwegs.",
    correctStatus: "false",
    explanation: "Falsch: Zeile 1 sagt ausdrücklich, dass Mara den Verlust erst vor der Haustür bemerkte.",
    evidenceLines: [1],
  },
  {
    id: "lost-key-loss-place",
    passageId: "lost-key",
    statement: "Mara verlor den Schlüssel im Kräutergarten.",
    correctStatus: "undecidable",
    explanation: "Nicht entscheidbar: Der Text nennt den Fundort, aber nicht den Ort, an dem der Schlüssel verloren ging.",
  },
  {
    id: "library-seat-usually-taken",
    passageId: "library-window",
    statement: "Der Tisch am Fenster ist normalerweise oft besetzt.",
    correctStatus: "true",
    explanation: "Richtig: Zeile 2 erklärt, dass dort meist jemand sitzt.",
    evidenceLines: [2],
  },
  {
    id: "library-recommendation",
    passageId: "library-window",
    statement: "Noahs Freundin hatte ihm das Buch über Zugvögel empfohlen.",
    correctStatus: "undecidable",
    explanation: "Nicht entscheidbar: Der Text nennt das Buch, aber keinen Grund für Noahs Auswahl.",
  },
  {
    id: "rain-scenery-dry",
    passageId: "rain-rehearsal",
    statement: "Die Kulissen blieben trotz des Regens trocken.",
    correctStatus: "true",
    explanation: "Richtig: Genau diese Information steht in Zeile 3.",
    evidenceLines: [3],
  },
  {
    id: "rain-ended-late",
    passageId: "rain-rehearsal",
    statement: "Die Probe endete wegen des verspäteten Beginns später als geplant.",
    correctStatus: "false",
    explanation: "Falsch: Zeile 4 sagt, dass die Probe trotzdem pünktlich endete.",
    evidenceLines: [4],
  },
  {
    id: "bell-brother-tightened",
    passageId: "bike-bell",
    statement: "Elins Bruder zog eine lockere Schraube fest.",
    correctStatus: "true",
    explanation: "Richtig: Die konkrete Reparatur wird in Zeile 3 genannt.",
    evidenceLines: [3],
  },
  {
    id: "bell-elin-repaired",
    passageId: "bike-bell",
    statement: "Elin reparierte die Klingel selbst.",
    correctStatus: "false",
    explanation: "Falsch: Laut Zeile 3 führte ihr Bruder die Reparatur aus.",
    evidenceLines: [3],
  },
  {
    id: "bell-planned-company",
    passageId: "bike-bell",
    statement: "Elin hatte von Anfang an geplant, die Ausfahrt gemeinsam mit ihrem Bruder zu machen.",
    correctStatus: "undecidable",
    explanation: "Nicht entscheidbar: Der Text nennt die gemeinsame Abfahrt, aber nicht, wann oder von wem sie geplant wurde.",
  },
])

interface MultiSelectTemplateOption {
  label: string
  correct: boolean
}

interface MultiSelectTemplate {
  id: string
  passageId: string
  prompt: string
  options: readonly [
    MultiSelectTemplateOption,
    MultiSelectTemplateOption,
    MultiSelectTemplateOption,
    MultiSelectTemplateOption,
  ]
  explanation: string
  evidenceLines: readonly number[]
}

const multiSelectTemplates: readonly MultiSelectTemplate[] = Object.freeze([
  {
    id: "multi-lost-key-direct",
    passageId: "lost-key",
    prompt: "Welche zwei Aussagen stehen so im Text? Wähle genau zwei Antworten.",
    options: [
      { label: "Mara bemerkte den fehlenden Schlüssel erst vor der Haustür.", correct: true },
      { label: "Mara sah auf dem Rückweg unter jede Bank.", correct: true },
      { label: "Eine Nachbarin brachte Mara den Schlüssel.", correct: false },
      { label: "Mara rief sofort einen Schlüsseldienst.", correct: false },
    ],
    explanation: "Zeilen 1 und 2 nennen den späten Zeitpunkt und die Suche unter den Bänken ausdrücklich.",
    evidenceLines: [1, 2],
  },
  {
    id: "multi-library-direct",
    passageId: "library-window",
    prompt: "Welche zwei Aussagen werden direkt belegt? Wähle genau zwei Antworten.",
    options: [
      { label: "Noah kam früher als sonst in die Bibliothek.", correct: true },
      { label: "Der Tisch am Fenster war noch frei.", correct: true },
      { label: "Noahs Freundin wartete bereits am Eingang.", correct: false },
      { label: "Noah las ein Buch über das Wetter.", correct: false },
    ],
    explanation: "Zeilen 1 und 2 belegen Noahs frühe Ankunft und den freien Fensterplatz.",
    evidenceLines: [1, 2],
  },
  {
    id: "multi-rain-direct",
    passageId: "rain-rehearsal",
    prompt: "Welche zwei Aussagen stehen so im Text? Wähle genau zwei Antworten.",
    options: [
      { label: "Kurz vor der Probe begann es heftig zu regnen.", correct: true },
      { label: "Die Gruppe trug die Requisiten durch den Hintereingang.", correct: true },
      { label: "Die Probe wurde auf den nächsten Tag verschoben.", correct: false },
      { label: "Die Kulissen wurden draussen gelagert.", correct: false },
    ],
    explanation: "Zeilen 1 und 2 nennen den Regen und den Transport durch den Hintereingang.",
    evidenceLines: [1, 2],
  },
  {
    id: "multi-bell-direct",
    passageId: "bike-bell",
    prompt: "Welche zwei Aussagen werden direkt belegt? Wähle genau zwei Antworten.",
    options: [
      { label: "Elin prüfte vor der Ausfahrt Bremsen und Luftdruck.", correct: true },
      { label: "Beim ersten Test war die Klingel kaum zu hören.", correct: true },
      { label: "Elin ersetzte die Klingel durch eine neue.", correct: false },
      { label: "Der Bruder pumpte beide Reifen auf.", correct: false },
    ],
    explanation: "Zeilen 1 und 2 beschreiben die Kontrolle und den kaum hörbaren ersten Klingeltest.",
    evidenceLines: [1, 2],
  },
  {
    id: "multi-lost-key-result",
    passageId: "lost-key",
    prompt: "Welche zwei Aussagen beschreiben Fund und Reaktion richtig? Wähle genau zwei Antworten.",
    options: [
      { label: "Etwas glitzerte zwischen den nassen Steinen.", correct: true },
      { label: "Nach dem Fund lief Mara erleichtert nach Hause.", correct: true },
      { label: "Der Schlüssel lag sichtbar auf einer Bank.", correct: false },
      { label: "Mara blieb nach dem Fund im Kräutergarten.", correct: false },
    ],
    explanation: "Zeile 3 beschreibt den Fund zwischen den Steinen; Zeile 4 nennt Maras Erleichterung und Heimweg.",
    evidenceLines: [3, 4],
  },
  {
    id: "multi-library-work",
    passageId: "library-window",
    prompt: "Welche zwei Aussagen über Noahs Arbeit sind richtig? Wähle genau zwei Antworten.",
    options: [
      { label: "Noah öffnete ein Buch über Zugvögel.", correct: true },
      { label: "Vor der Ankunft seiner Freundin hatte Noah zwei Seiten Notizen geschrieben.", correct: true },
      { label: "Noah schrieb seine Notizen erst gemeinsam mit der Freundin.", correct: false },
      { label: "Noah gab den Fensterplatz freiwillig ab.", correct: false },
    ],
    explanation: "Zeilen 3 und 4 nennen das Buch und die bereits geschriebenen Notizen.",
    evidenceLines: [3, 4],
  },
  {
    id: "multi-rain-outcome",
    passageId: "rain-rehearsal",
    prompt: "Welche zwei Aussagen über den Verlauf der Probe sind richtig? Wähle genau zwei Antworten.",
    options: [
      { label: "Die Kulissen blieben trotz fehlendem Sonnenlicht trocken.", correct: true },
      { label: "Die Probe begann später und endete trotzdem pünktlich.", correct: true },
      { label: "Die Gruppe beendete die Probe zehn Minuten zu spät.", correct: false },
      { label: "Der Regen beschädigte mehrere Kulissen.", correct: false },
    ],
    explanation: "Zeilen 3 und 4 belegen die trockenen Kulissen und das pünktliche Ende trotz Verspätung.",
    evidenceLines: [3, 4],
  },
  {
    id: "multi-bell-repair",
    passageId: "bike-bell",
    prompt: "Welche zwei Aussagen beschreiben Reparatur und Ergebnis richtig? Wähle genau zwei Antworten.",
    options: [
      { label: "Elins Bruder zog eine lockere Schraube fest.", correct: true },
      { label: "Nach der Reparatur klang die Klingel klar.", correct: true },
      { label: "Die Geschwister brachen die Ausfahrt ab.", correct: false },
      { label: "Die Ursache war ein Loch im Reifen.", correct: false },
    ],
    explanation: "Zeilen 3 und 4 nennen die festgezogene Schraube und den klaren Klang danach.",
    evidenceLines: [3, 4],
  },
  {
    id: "multi-lost-key-inference",
    passageId: "lost-key",
    prompt: "Welche zwei Schlussfolgerungen werden durch den Text gestützt? Wähle genau zwei Antworten.",
    options: [
      { label: "Mara suchte Orte auf ihrem zuvor gegangenen Heimweg systematisch ab.", correct: true },
      { label: "Mit dem Fund endete Maras Sorge, und sie beeilte sich nach Hause.", correct: true },
      { label: "Der Text beweist, dass Mara den Schlüssel unter einer Bank verlor.", correct: false },
      { label: "Mara konnte das Glitzern schon von der Haustür aus sehen.", correct: false },
    ],
    explanation: "Zeile 2 zeigt die systematische Rückwegsuche; Zeile 4 verbindet Fund, Erleichterung und schnelle Heimkehr.",
    evidenceLines: [2, 4],
  },
  {
    id: "multi-library-inference",
    passageId: "library-window",
    prompt: "Welche zwei Schlussfolgerungen sind durch mehrere Textangaben gestützt? Wähle genau zwei Antworten.",
    options: [
      { label: "Noah nutzte die Zeit vor der Ankunft seiner Freundin bereits zum Arbeiten.", correct: true },
      { label: "Der freie Fensterplatz war an diesem Tag eine Ausnahme.", correct: true },
      { label: "Noahs Freundin hatte das Buch für ihn ausgesucht.", correct: false },
      { label: "Noah hatte das ganze Buch beendet, bevor seine Freundin kam.", correct: false },
    ],
    explanation: "Zeilen 1, 3 und 4 zeigen Noahs frühe Arbeit; Zeile 2 bezeichnet den freien Platz als ungewöhnlich.",
    evidenceLines: [1, 2, 3, 4],
  },
  {
    id: "multi-rain-inference",
    passageId: "rain-rehearsal",
    prompt: "Welche zwei Schlussfolgerungen passen zum gesamten Ablauf? Wähle genau zwei Antworten.",
    options: [
      { label: "Die Gruppe passte ihren Transportweg an, um die Requisiten ins Gebäude zu bringen.", correct: true },
      { label: "Der verspätete Beginn verlängerte die geplante Endzeit nicht.", correct: true },
      { label: "Die Gruppe wartete mit der Probe, bis wieder Sonnenlicht vorhanden war.", correct: false },
      { label: "Wegen des Regens fehlte am Ende ein Teil der Kulissen.", correct: false },
    ],
    explanation: "Zeile 2 zeigt die angepasste Route; Zeile 4 stellt den späteren Beginn dem pünktlichen Ende gegenüber.",
    evidenceLines: [2, 4],
  },
  {
    id: "multi-bell-inference",
    passageId: "bike-bell",
    prompt: "Welche zwei Schlussfolgerungen werden durch den Ablauf gestützt? Wähle genau zwei Antworten.",
    options: [
      { label: "Die Störung wurde bei einer Kontrolle vor der Abfahrt entdeckt.", correct: true },
      { label: "Die kleine Reparatur machte die Klingel wieder deutlich hörbar.", correct: true },
      { label: "Elin bemerkte das Problem erst während der Fahrt.", correct: false },
      { label: "Die Geschwister benötigten für die Reparatur eine Werkstatt.", correct: false },
    ],
    explanation: "Zeilen 1 und 2 ordnen die Entdeckung vor der Fahrt ein; Zeilen 3 und 4 zeigen die Wirkung der Reparatur.",
    evidenceLines: [1, 2, 3, 4],
  },
])

interface VocabularyTemplate {
  id: string
  passageId: string
  line: number
  target: string
  correct: string
  distractors: readonly string[]
  explanation: string
}

const vocabularyTemplates: readonly VocabularyTemplate[] = Object.freeze([
  {
    id: "noticed",
    passageId: "lost-key",
    line: 1,
    target: "bemerkte",
    correct: "stellte fest",
    distractors: ["versteckte", "vergass absichtlich"],
    explanation: "Mara stellt an der Haustür fest, dass der Schlüssel fehlt. «Bemerkte» bedeutet hier «stellte fest».",
  },
  {
    id: "relieved",
    passageId: "lost-key",
    line: 4,
    target: "erleichtert",
    correct: "froh, weil die Sorge vorbei ist",
    distractors: ["enttäuscht über den Fund", "unsicher, welchen Weg sie nehmen soll"],
    explanation: "Nachdem Mara den Schlüssel gefunden hat, ist ihre Sorge vorbei; deshalb ist sie erleichtert.",
  },
  {
    id: "neighbourhood-library",
    passageId: "library-window",
    line: 1,
    target: "Quartierbibliothek",
    correct: "Bibliothek eines Stadtteils",
    distractors: ["private Büchersammlung in einer Wohnung", "Schulzimmer für Gruppenarbeiten"],
    explanation: "Ein Quartier ist ein Stadtteil. Eine Quartierbibliothek versorgt dieses Wohngebiet.",
  },
  {
    id: "already",
    passageId: "library-window",
    line: 4,
    target: "bereits",
    correct: "schon",
    distractors: ["erst später", "fast nicht"],
    explanation: "Noah hatte die Notizen schon geschrieben, als seine Freundin eintraf.",
  },
  {
    id: "usually",
    passageId: "library-window",
    line: 2,
    target: "meist",
    correct: "in den meisten Fällen",
    distractors: ["ausnahmslos immer", "nur dieses eine Mal"],
    explanation: "Der Platz ist normalerweise häufig besetzt, aber nicht immer. «Meist» bedeutet «in den meisten Fällen».",
  },
  {
    id: "props",
    passageId: "rain-rehearsal",
    line: 2,
    target: "Requisiten",
    correct: "Gegenstände, die bei einer Aufführung verwendet werden",
    distractors: ["Eintrittskarten für das Publikum", "Personen, die den Text vorsprechen"],
    explanation: "Requisiten sind bewegliche Gegenstände, die für eine Theateraufführung gebraucht werden.",
  },
  {
    id: "scenery",
    passageId: "rain-rehearsal",
    line: 3,
    target: "Kulissen",
    correct: "gestaltete Bühnenbilder",
    distractors: ["schriftliche Rollenhefte", "Lampen ausserhalb des Gebäudes"],
    explanation: "Kulissen bilden die sichtbare Umgebung einer Szene auf der Bühne.",
  },
  {
    id: "missing",
    passageId: "rain-rehearsal",
    line: 3,
    target: "fehlte",
    correct: "war nicht vorhanden",
    distractors: ["war besonders hell", "wurde später eingeschaltet"],
    explanation: "Im Saal war kein Sonnenlicht vorhanden. «Fehlte» bezeichnet hier etwas, das nicht da war.",
  },
  {
    id: "hardly",
    passageId: "bike-bell",
    line: 2,
    target: "kaum",
    correct: "fast nicht",
    distractors: ["besonders laut", "genau zweimal"],
    explanation: "Wenn kaum ein Ton zu hören ist, hört man fast nichts.",
  },
  {
    id: "again",
    passageId: "bike-bell",
    line: 3,
    target: "erneut",
    correct: "noch einmal",
    distractors: ["zum ersten Mal", "heimlich"],
    explanation: "Nach der Reparatur wird die Klingel noch einmal getestet.",
  },
  {
    id: "glittered",
    passageId: "lost-key",
    line: 3,
    target: "glitzerte",
    correct: "funkelte im Licht",
    distractors: ["verschwand vollständig", "bewegte sich schnell"],
    explanation: "Der Schlüssel reflektiert Licht zwischen den nassen Steinen und funkelt deshalb.",
  },
  {
    id: "arrived",
    passageId: "library-window",
    line: 4,
    target: "eintraf",
    correct: "ankam",
    distractors: ["wieder abreiste", "eine Nachricht schrieb"],
    explanation: "Die Freundin trifft in der Bibliothek ein, sie kommt also dort an.",
  },
  {
    id: "heavily",
    passageId: "rain-rehearsal",
    line: 1,
    target: "heftig",
    correct: "stark und intensiv",
    distractors: ["nur für einen Augenblick", "kaum wahrnehmbar"],
    explanation: "«Heftig regnen» bedeutet, dass der Regen stark und intensiv ist.",
  },
  {
    id: "set-off",
    passageId: "bike-bell",
    line: 4,
    target: "losfahren",
    correct: "die Fahrt beginnen",
    distractors: ["das Velo abstellen", "zu Fuss zurückkehren"],
    explanation: "Nach der Kontrolle können die beiden ihre Fahrt beginnen.",
  },
  {
    id: "clear-sound",
    passageId: "bike-bell",
    line: 4,
    target: "klar",
    correct: "deutlich und gut hörbar",
    distractors: ["durchsichtig", "frei von jeder Farbe"],
    explanation: "Bei einem Klang bedeutet «klar», dass er deutlich und gut hörbar ist; die optischen Bedeutungen passen hier nicht.",
  },
])

interface ChoiceTemplate {
  id: string
  prompt: string
  correct: string
  distractors: readonly string[]
  explanation: string
}

interface MatchingTemplatePair {
  segment: string
  roleId: string
  roleLabel: string
}

interface MatchingTemplate {
  id: string
  sentence: string
  pairs: readonly [MatchingTemplatePair, MatchingTemplatePair, MatchingTemplatePair]
  explanation: string
}

interface SentenceAnalysisTemplate {
  id: string
  sentence: string
  pairs: readonly [
    MatchingTemplatePair,
    MatchingTemplatePair,
    MatchingTemplatePair,
    MatchingTemplatePair,
  ]
  explanation: string
}

const wordFormationTemplates: readonly ChoiceTemplate[] = Object.freeze([
  {
    id: "decide-noun",
    prompt: "Welches Nomen gehört zum Verb «entscheiden»?",
    correct: "Entscheidung",
    distractors: ["entscheidbar", "entschieden"],
    explanation: "Das Nomen zur Handlung «entscheiden» lautet «die Entscheidung».",
  },
  {
    id: "friendly-noun",
    prompt: "Welches Nomen wird aus dem Adjektiv «freundlich» gebildet?",
    correct: "Freundlichkeit",
    distractors: ["Befreundung", "freundlicherweise"],
    explanation: "Die Endung «-keit» bildet hier das Nomen «Freundlichkeit».",
  },
  {
    id: "read-person",
    prompt: "Wie heisst eine Person, die liest? Bilde das passende Nomen aus «lesen».",
    correct: "Leser oder Leserin",
    distractors: ["Lesung", "lesbar"],
    explanation: "Mit «-er» beziehungsweise «-erin» wird aus «lesen» eine Personenbezeichnung.",
  },
  {
    id: "calm-opposite",
    prompt: "Welches Wort bildet mit der Vorsilbe «un-» das Gegenteil von «ruhig»?",
    correct: "unruhig",
    distractors: ["beruhigen", "Ruhigkeit"],
    explanation: "Die Vorsilbe «un-» kehrt die Bedeutung um: ruhig → unruhig.",
  },
  {
    id: "collection-verb",
    prompt: "Welches Verb gehört zum Nomen «Sammlung»?",
    correct: "sammeln",
    distractors: ["gesammelt", "sammlerisch"],
    explanation: "Der gemeinsame Wortstamm führt zum Verb «sammeln».",
  },
  {
    id: "rain-jacket-compound",
    prompt: "Welches zusammengesetzte Nomen entsteht aus «Regen» und «Jacke»?",
    correct: "Regenjacke",
    distractors: ["regnerische Jacke", "Jackenregen"],
    explanation: "Deutsche Nomen können direkt verbunden werden: Regen + Jacke = Regenjacke.",
  },
  {
    id: "danger-adjective",
    prompt: "Welches Adjektiv wird aus dem Nomen «Gefahr» gebildet?",
    correct: "gefährlich",
    distractors: ["gefährden", "Gefährdung"],
    explanation: "Mit der Endung «-lich» und dem Umlaut entsteht das Adjektiv «gefährlich».",
  },
  {
    id: "punctual-noun",
    prompt: "Welches Nomen gehört zum Adjektiv «pünktlich»?",
    correct: "Pünktlichkeit",
    distractors: ["pünktlicher", "Punktlandung"],
    explanation: "Die Endung «-keit» macht aus «pünktlich» das Nomen «Pünktlichkeit».",
  },
  {
    id: "courage-adjective",
    prompt: "Welches Adjektiv wird aus dem Nomen «Mut» gebildet?",
    correct: "mutig",
    distractors: ["ermutigen", "Mutprobe"],
    explanation: "Die Endung «-ig» bildet aus «Mut» das Adjektiv «mutig».",
  },
  {
    id: "movement-verb",
    prompt: "Welches Verb gehört zum Nomen «Bewegung»?",
    correct: "bewegen",
    distractors: ["beweglich", "Bewegtheit"],
    explanation: "Nomen und Verb teilen den Stamm «beweg-»: Bewegung → bewegen.",
  },
  {
    id: "dark-noun",
    prompt: "Welches Nomen wird aus dem Adjektiv «dunkel» gebildet?",
    correct: "Dunkelheit",
    distractors: ["verdunkeln", "dunkelblau"],
    explanation: "Mit der Endung «-heit» entsteht das Nomen «Dunkelheit».",
  },
  {
    id: "drive-person",
    prompt: "Wie heisst eine Person, die ein Fahrzeug fährt? Bilde das Nomen aus «fahren».",
    correct: "Fahrer oder Fahrerin",
    distractors: ["Fahrt", "fahrbar"],
    explanation: "Die Endungen «-er» und «-erin» bilden die Personenbezeichnungen «Fahrer» und «Fahrerin».",
  },
])

const wordClassTemplates: readonly ChoiceTemplate[] = Object.freeze([
  {
    id: "word-class-bicycle-noun",
    prompt: "Welche Wortart hat «Fahrrad» in diesem Satz?\n\n«Das schnelle Fahrrad steht vor dem Haus.»",
    correct: "Nomen",
    distractors: ["Verb", "Adjektiv"],
    explanation: "«Fahrrad» bezeichnet ein Ding, wird grossgeschrieben und ist ein Nomen.",
  },
  {
    id: "word-class-laugh-verb",
    prompt: "Welche Wortart hat «lachen» in diesem Satz?\n\n«Die Kinder lachen über den Witz.»",
    correct: "Verb",
    distractors: ["Nomen", "Pronomen"],
    explanation: "«Lachen» beschreibt eine Tätigkeit und ist hier das konjugierte Verb.",
  },
  {
    id: "word-class-quiet-adjective",
    prompt: "Welche Wortart hat «leise» in diesem Satz?\n\n«Leise Musik begleitet die Szene.»",
    correct: "Adjektiv",
    distractors: ["Artikel", "Nomen"],
    explanation: "«Leise» beschreibt die Musik genauer und ist ein Adjektiv.",
  },
  {
    id: "word-class-she-pronoun",
    prompt: "Welche Wortart hat «Sie» in diesem Satz?\n\n«Sie wartet vor der Bibliothek.»",
    correct: "Pronomen",
    distractors: ["Präposition", "Verb"],
    explanation: "«Sie» steht anstelle eines Namens und ist deshalb ein Pronomen.",
  },
  {
    id: "word-class-a-article",
    prompt: "Welche Wortart hat «Ein» in diesem Satz?\n\n«Ein Vogel landet auf dem Geländer.»",
    correct: "Artikel",
    distractors: ["Adverb", "Konjunktion"],
    explanation: "«Ein» begleitet das Nomen «Vogel» und ist ein unbestimmter Artikel.",
  },
  {
    id: "word-class-under-preposition",
    prompt: "Welche Wortart hat «unter» in diesem Satz?\n\n«Der Ball liegt unter dem Tisch.»",
    correct: "Präposition",
    distractors: ["Pronomen", "Adjektiv"],
    explanation: "«Unter» zeigt die räumliche Beziehung zum Tisch und ist eine Präposition.",
  },
  {
    id: "word-class-because-conjunction",
    prompt: "Welche Wortart hat «weil» in diesem Satz?\n\n«Wir bleiben drinnen, weil es gewittert.»",
    correct: "Konjunktion",
    distractors: ["Artikel", "Nomen"],
    explanation: "«Weil» verbindet Haupt- und Nebensatz und ist eine Konjunktion.",
  },
  {
    id: "word-class-tomorrow-adverb",
    prompt: "Welche Wortart hat «morgen» in diesem Satz?\n\n«Wir beginnen morgen mit dem Modell.»",
    correct: "Adverb",
    distractors: ["Verb", "Artikel"],
    explanation: "«Morgen» bestimmt den Zeitpunkt und ist hier ein temporales Adverb.",
  },
  {
    id: "word-class-swimming-noun",
    prompt: "Welche Wortart hat «Schwimmen» in diesem Satz?\n\n«Beim Schwimmen trägt Lio eine Badekappe.»",
    correct: "Nomen",
    distractors: ["Verb", "Konjunktion"],
    explanation: "Nach «beim» ist «Schwimmen» nominalisiert und wird als Nomen grossgeschrieben.",
  },
  {
    id: "word-class-narrow-adjective",
    prompt: "Welche Wortart hat «schmal» in diesem Satz?\n\n«Der Weg bleibt schmal.»",
    correct: "Adjektiv",
    distractors: ["Pronomen", "Präposition"],
    explanation: "«Schmal» beschreibt eine Eigenschaft des Weges und ist ein Adjektiv.",
  },
  {
    id: "word-class-travel-verb",
    prompt: "Welche Wortart hat «reisen» in diesem Satz?\n\n«Mira möchte im Sommer reisen.»",
    correct: "Verb",
    distractors: ["Nomen", "Adverb"],
    explanation: "«Reisen» bezeichnet die Tätigkeit und bildet mit «möchte» das Prädikat.",
  },
  {
    id: "word-class-nobody-pronoun",
    prompt: "Welche Wortart hat «Niemand» in diesem Satz?\n\n«Niemand kannte den geheimen Weg.»",
    correct: "Pronomen",
    distractors: ["Artikel", "Adjektiv"],
    explanation: "«Niemand» steht für eine unbestimmte Personengruppe und ist ein Pronomen.",
  },
])

const sentenceStructureTemplates: readonly ChoiceTemplate[] = Object.freeze([
  {
    id: "subject-window",
    prompt: "Welches Satzglied ist das Subjekt?\n\n«Am Morgen öffnet Livia vorsichtig das Fenster.»",
    correct: "Livia",
    distractors: ["Am Morgen", "das Fenster"],
    explanation: "Wer öffnet? Livia. Deshalb ist «Livia» das Subjekt.",
  },
  {
    id: "object-window",
    prompt: "Welches Satzglied ist das Akkusativobjekt?\n\n«Am Morgen öffnet Livia vorsichtig das Fenster.»",
    correct: "das Fenster",
    distractors: ["Livia", "vorsichtig"],
    explanation: "Livia öffnet wen oder was? «Das Fenster» ist das Akkusativobjekt.",
  },
  {
    id: "predicate-arrival",
    prompt: "Welche Wörter bilden das Prädikat?\n\n«Der Bus ist heute pünktlich angekommen.»",
    correct: "ist angekommen",
    distractors: ["Der Bus", "heute pünktlich"],
    explanation: "Die Verbteile «ist» und «angekommen» bilden gemeinsam das Prädikat.",
  },
  {
    id: "dative-gift",
    prompt: "Welches Satzglied ist das Dativobjekt?\n\n«Noah schenkt seiner Schwester ein Buch.»",
    correct: "seiner Schwester",
    distractors: ["Noah", "ein Buch"],
    explanation: "Noah schenkt wem ein Buch? «Seiner Schwester» ist das Dativobjekt.",
  },
  {
    id: "main-clause-order-after-adverbial",
    prompt: "Welche Reihenfolge bildet einen korrekten Hauptsatz?",
    correct: "Nach der Pause lösen die Kinder die Aufgabe.",
    distractors: ["Nach der Pause die Kinder lösen die Aufgabe.", "Nach der Pause die Aufgabe lösen die Kinder."],
    explanation: "Steht die Zeitangabe zuerst, folgt das konjugierte Verb an zweiter Stelle.",
  },
  {
    id: "subordinate-verb-last",
    prompt: "Welche Ergänzung ist korrekt?\n\n«Mira kommt später, weil …»",
    correct: "sie den Bus verpasst hat.",
    distractors: ["sie hat den Bus verpasst.", "hat sie den Bus verpasst."],
    explanation: "Im Nebensatz mit «weil» steht das konjugierte Verb am Ende.",
  },
  {
    id: "time-adverbial",
    prompt: "Welches Satzglied ist die Zeitangabe?\n\n«Am nächsten Samstag besucht Amir seine Grosseltern.»",
    correct: "Am nächsten Samstag",
    distractors: ["Amir", "seine Grosseltern"],
    explanation: "Die Frage «Wann?» führt zur Zeitangabe «Am nächsten Samstag».",
  },
  {
    id: "main-after-subordinate",
    prompt: "Welche Fortsetzung ist korrekt?\n\n«Als die Glocke läutete, …»",
    correct: "gingen alle Kinder ins Schulhaus.",
    distractors: ["alle Kinder gingen ins Schulhaus.", "ins Schulhaus alle Kinder gingen."],
    explanation: "Der vorangestellte Nebensatz besetzt die erste Position; der Hauptsatz beginnt deshalb mit dem Verb «gingen».",
  },
  {
    id: "place-adverbial",
    prompt: "Welches Satzglied ist die Ortsangabe?\n\n«Vor dem Bahnhof wartet die Klasse auf den Bus.»",
    correct: "Vor dem Bahnhof",
    distractors: ["die Klasse", "auf den Bus"],
    explanation: "Die Frage «Wo?» führt zur Ortsangabe «Vor dem Bahnhof».",
  },
  {
    id: "object-first-main-clause",
    prompt: "Welche Reihenfolge ist korrekt, wenn das Objekt zuerst steht?",
    correct: "Dieses Rätsel löst Mia ohne Hilfe.",
    distractors: ["Dieses Rätsel Mia löst ohne Hilfe.", "Dieses Rätsel ohne Hilfe Mia löst."],
    explanation: "Auch nach einem vorangestellten Objekt steht das konjugierte Verb im Hauptsatz an zweiter Stelle.",
  },
  {
    id: "relative-clause-order",
    prompt: "Welche Ergänzung ist korrekt?\n\n«Das Buch, das …, liegt auf dem Tisch.»",
    correct: "Noah gestern ausgeliehen hat",
    distractors: ["Noah hat gestern ausgeliehen", "hat Noah gestern ausgeliehen"],
    explanation: "Im Relativsatz steht das konjugierte Verb «hat» am Ende.",
  },
  {
    id: "prepositional-object",
    prompt: "Welches Satzglied gehört fest zum Verb «warten»?\n\n«Die Klasse wartet vor dem Bahnhof auf den Bus.»",
    correct: "auf den Bus",
    distractors: ["Die Klasse", "vor dem Bahnhof"],
    explanation: "Das Verb wird hier mit «auf» ergänzt: auf jemanden oder etwas warten.",
  },
])

const constituentMatchingTemplates: readonly MatchingTemplate[] = Object.freeze([
  {
    id: "matching-monday-book",
    sentence: "Am Montag bringt Lina ihrem Bruder das Buch.",
    pairs: [
      { segment: "Am Montag", roleId: "time", roleLabel: "Zeitangabe" },
      { segment: "Lina", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "ihrem Bruder", roleId: "dative-object", roleLabel: "Dativobjekt" },
    ],
    explanation: "«Am Montag» beantwortet wann, «Lina» wer und «ihrem Bruder» wem etwas gebracht wird.",
  },
  {
    id: "matching-garden-roses",
    sentence: "Im Garten pflanzt der Hauswart neue Rosen.",
    pairs: [
      { segment: "Im Garten", roleId: "place", roleLabel: "Ortsangabe" },
      { segment: "der Hauswart", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "neue Rosen", roleId: "accusative-object", roleLabel: "Akkusativobjekt" },
    ],
    explanation: "Der Garten nennt den Ort, der Hauswart handelt und die Rosen werden gepflanzt.",
  },
  {
    id: "matching-rain-excursion",
    sentence: "Wegen des Regens verschob die Klasse den Ausflug.",
    pairs: [
      { segment: "Wegen des Regens", roleId: "reason", roleLabel: "Grundangabe" },
      { segment: "die Klasse", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "den Ausflug", roleId: "accusative-object", roleLabel: "Akkusativobjekt" },
    ],
    explanation: "Der Regen nennt den Grund, die Klasse handelt und der Ausflug wird verschoben.",
  },
  {
    id: "matching-trainer-rule",
    sentence: "Der Trainer erklärte den Kindern die Regel.",
    pairs: [
      { segment: "Der Trainer", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "den Kindern", roleId: "dative-object", roleLabel: "Dativobjekt" },
      { segment: "die Regel", roleId: "accusative-object", roleLabel: "Akkusativobjekt" },
    ],
    explanation: "Der Trainer erklärt; den Kindern wird etwas erklärt und die Regel ist der erklärte Inhalt.",
  },
  {
    id: "matching-after-meal",
    sentence: "Nach dem Essen räumte Milo sorgfältig den Tisch ab.",
    pairs: [
      { segment: "Nach dem Essen", roleId: "time", roleLabel: "Zeitangabe" },
      { segment: "sorgfältig", roleId: "manner", roleLabel: "Angabe der Art und Weise" },
      { segment: "räumte … ab", roleId: "predicate", roleLabel: "Prädikat" },
    ],
    explanation: "Die drei Teile nennen den Zeitpunkt, die Art der Handlung und das zweiteilige Prädikat.",
  },
  {
    id: "matching-window-repair",
    sentence: "Morgen wird unsere Nachbarin das Fenster reparieren.",
    pairs: [
      { segment: "Morgen", roleId: "time", roleLabel: "Zeitangabe" },
      { segment: "unsere Nachbarin", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "wird … reparieren", roleId: "predicate", roleLabel: "Prädikat" },
    ],
    explanation: "«Morgen» nennt den Zeitpunkt, die Nachbarin handelt und «wird … reparieren» bildet das Prädikat.",
  },
  {
    id: "matching-musician-hall",
    sentence: "Die junge Musikerin spielt im Saal erstaunlich ruhig.",
    pairs: [
      { segment: "Die junge Musikerin", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "im Saal", roleId: "place", roleLabel: "Ortsangabe" },
      { segment: "erstaunlich ruhig", roleId: "manner", roleLabel: "Angabe der Art und Weise" },
    ],
    explanation: "Die Musikerin handelt; Saal und ruhige Ausführung beantworten wo und wie.",
  },
  {
    id: "matching-tired-bags",
    sentence: "Aus Müdigkeit verwechselte Tom die beiden Taschen.",
    pairs: [
      { segment: "Aus Müdigkeit", roleId: "reason", roleLabel: "Grundangabe" },
      { segment: "Tom", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "die beiden Taschen", roleId: "accusative-object", roleLabel: "Akkusativobjekt" },
    ],
    explanation: "Die Müdigkeit begründet die Verwechslung, Tom handelt und die Taschen werden verwechselt.",
  },
  {
    id: "matching-school-wait",
    sentence: "Vor der Schule wartet Leila auf ihre Freundin.",
    pairs: [
      { segment: "Vor der Schule", roleId: "place", roleLabel: "Ortsangabe" },
      { segment: "Leila", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "auf ihre Freundin", roleId: "prepositional-object", roleLabel: "Präpositionalobjekt" },
    ],
    explanation: "Die Schule nennt den Ort, Leila wartet und «auf ihre Freundin» gehört fest zum Verb «warten».",
  },
  {
    id: "matching-dog-owner",
    sentence: "Der kleine Hund folgt seinem Besitzer überallhin.",
    pairs: [
      { segment: "Der kleine Hund", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "seinem Besitzer", roleId: "dative-object", roleLabel: "Dativobjekt" },
      { segment: "überallhin", roleId: "direction", roleLabel: "Richtungsangabe" },
    ],
    explanation: "Der Hund handelt, dem Besitzer wird gefolgt und «überallhin» nennt die Richtung.",
  },
  {
    id: "matching-patient-puzzle",
    sentence: "Mit grosser Geduld löste Mira das schwierige Rätsel.",
    pairs: [
      { segment: "Mit grosser Geduld", roleId: "manner", roleLabel: "Angabe der Art und Weise" },
      { segment: "Mira", roleId: "subject", roleLabel: "Subjekt" },
      { segment: "das schwierige Rätsel", roleId: "accusative-object", roleLabel: "Akkusativobjekt" },
    ],
    explanation: "Die Geduld beschreibt wie Mira handelt; Mira löst und das Rätsel wird gelöst.",
  },
  {
    id: "matching-grandfather-card",
    sentence: "Heute schenkt der Grossvater seiner Enkelin eine Karte.",
    pairs: [
      { segment: "Heute", roleId: "time", roleLabel: "Zeitangabe" },
      { segment: "seiner Enkelin", roleId: "dative-object", roleLabel: "Dativobjekt" },
      { segment: "eine Karte", roleId: "accusative-object", roleLabel: "Akkusativobjekt" },
    ],
    explanation: "«Heute» nennt wann; die Enkelin erhält etwas und die Karte wird geschenkt.",
  },
])

const sentenceAnalysisTemplates: readonly SentenceAnalysisTemplate[] = Object.freeze([
  {
    id: "analysis-monday-book",
    sentence: "Am Montag schenkt Lina ihrem Bruder das Buch.",
    pairs: [
      { segment: "Am Montag", roleId: "when", roleLabel: "wann?" },
      { segment: "Lina", roleId: "who", roleLabel: "wer?" },
      { segment: "ihrem Bruder", roleId: "to-whom", roleLabel: "wem?" },
      { segment: "das Buch", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Die vier Wortgruppen beantworten der Reihe nach die Fragen wann, wer, wem und wen oder was.",
  },
  {
    id: "analysis-morning-roses",
    sentence: "Am Morgen pflanzt der Hauswart im Garten neue Rosen.",
    pairs: [
      { segment: "Am Morgen", roleId: "when", roleLabel: "wann?" },
      { segment: "der Hauswart", roleId: "who", roleLabel: "wer?" },
      { segment: "im Garten", roleId: "where", roleLabel: "wo?" },
      { segment: "neue Rosen", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Morgen, Hauswart, Garten und Rosen nennen Zeitpunkt, handelnde Person, Ort und Akkusativobjekt.",
  },
  {
    id: "analysis-trainer-rule",
    sentence: "Der Trainer erklärt den Kindern geduldig die Regel.",
    pairs: [
      { segment: "Der Trainer", roleId: "who", roleLabel: "wer?" },
      { segment: "den Kindern", roleId: "to-whom", roleLabel: "wem?" },
      { segment: "geduldig", roleId: "how", roleLabel: "wie?" },
      { segment: "die Regel", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Trainer, Kinder, geduldig und Regel beantworten wer, wem, wie und wen oder was.",
  },
  {
    id: "analysis-grandfather-card",
    sentence: "Heute schenkt der Grossvater seiner Enkelin eine Karte.",
    pairs: [
      { segment: "Heute", roleId: "when", roleLabel: "wann?" },
      { segment: "der Grossvater", roleId: "who", roleLabel: "wer?" },
      { segment: "seiner Enkelin", roleId: "to-whom", roleLabel: "wem?" },
      { segment: "eine Karte", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Heute nennt den Zeitpunkt; Grossvater, Enkelin und Karte beantworten wer, wem und wen oder was.",
  },
  {
    id: "analysis-rain-excursion",
    sentence: "Gestern verschob die Klasse wegen des Regens den Ausflug.",
    pairs: [
      { segment: "Gestern", roleId: "when", roleLabel: "wann?" },
      { segment: "die Klasse", roleId: "who", roleLabel: "wer?" },
      { segment: "wegen des Regens", roleId: "why", roleLabel: "warum?" },
      { segment: "den Ausflug", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Gestern, Klasse, Regen und Ausflug nennen Zeitpunkt, Subjekt, Grund und Akkusativobjekt.",
  },
  {
    id: "analysis-after-meal",
    sentence: "Nach dem Essen räumte Milo sorgfältig den Tisch ab.",
    pairs: [
      { segment: "Nach dem Essen", roleId: "when", roleLabel: "wann?" },
      { segment: "Milo", roleId: "who", roleLabel: "wer?" },
      { segment: "sorgfältig", roleId: "how", roleLabel: "wie?" },
      { segment: "den Tisch", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Die vier Wortgruppen beantworten wann, wer, wie und wen oder was.",
  },
  {
    id: "analysis-window-repair",
    sentence: "Morgen wird unsere Nachbarin das Fenster fachgerecht reparieren.",
    pairs: [
      { segment: "Morgen", roleId: "when", roleLabel: "wann?" },
      { segment: "unsere Nachbarin", roleId: "who", roleLabel: "wer?" },
      { segment: "das Fenster", roleId: "what", roleLabel: "wen oder was?" },
      { segment: "fachgerecht", roleId: "how", roleLabel: "wie?" },
    ],
    explanation: "Morgen, Nachbarin, Fenster und fachgerecht nennen Zeitpunkt, Subjekt, Objekt und Art der Ausführung.",
  },
  {
    id: "analysis-musician-hall",
    sentence: "Die junge Musikerin spielt im Saal ruhig eine neue Melodie.",
    pairs: [
      { segment: "Die junge Musikerin", roleId: "who", roleLabel: "wer?" },
      { segment: "im Saal", roleId: "where", roleLabel: "wo?" },
      { segment: "ruhig", roleId: "how", roleLabel: "wie?" },
      { segment: "eine neue Melodie", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Musikerin, Saal, ruhig und Melodie beantworten wer, wo, wie und wen oder was.",
  },
  {
    id: "analysis-tired-bags",
    sentence: "Aus Müdigkeit verwechselte Tom gestern die beiden Taschen.",
    pairs: [
      { segment: "Aus Müdigkeit", roleId: "why", roleLabel: "warum?" },
      { segment: "Tom", roleId: "who", roleLabel: "wer?" },
      { segment: "gestern", roleId: "when", roleLabel: "wann?" },
      { segment: "die beiden Taschen", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Müdigkeit, Tom, gestern und Taschen nennen Grund, Subjekt, Zeitpunkt und Akkusativobjekt.",
  },
  {
    id: "analysis-school-wait",
    sentence: "Vor der Schule wartet Leila geduldig auf ihre Freundin.",
    pairs: [
      { segment: "Vor der Schule", roleId: "where", roleLabel: "wo?" },
      { segment: "Leila", roleId: "who", roleLabel: "wer?" },
      { segment: "geduldig", roleId: "how", roleLabel: "wie?" },
      { segment: "auf ihre Freundin", roleId: "for-whom", roleLabel: "auf wen?" },
    ],
    explanation: "Schule, Leila, geduldig und Freundin beantworten wo, wer, wie und auf wen.",
  },
  {
    id: "analysis-patient-puzzle",
    sentence: "Mit grosser Geduld löste Mira am Abend das schwierige Rätsel.",
    pairs: [
      { segment: "Mit grosser Geduld", roleId: "how", roleLabel: "wie?" },
      { segment: "Mira", roleId: "who", roleLabel: "wer?" },
      { segment: "am Abend", roleId: "when", roleLabel: "wann?" },
      { segment: "das schwierige Rätsel", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Geduld, Mira, Abend und Rätsel nennen Art der Ausführung, Subjekt, Zeitpunkt und Akkusativobjekt.",
  },
  {
    id: "analysis-break-procedure",
    sentence: "Während der Pause erklärte die Lehrerin den Schülern das Verfahren.",
    pairs: [
      { segment: "Während der Pause", roleId: "when", roleLabel: "wann?" },
      { segment: "die Lehrerin", roleId: "who", roleLabel: "wer?" },
      { segment: "den Schülern", roleId: "to-whom", roleLabel: "wem?" },
      { segment: "das Verfahren", roleId: "what", roleLabel: "wen oder was?" },
    ],
    explanation: "Pause, Lehrerin, Schüler und Verfahren beantworten wann, wer, wem und wen oder was.",
  },
])

const connectorTemplates: readonly ChoiceTemplate[] = Object.freeze([
  {
    id: "connector-despite-delay",
    prompt: "Welcher Ausdruck verbindet die Aussagen sinnvoll?\n\n«Der Bus hatte Verspätung. ___ kamen wir pünktlich an.»",
    correct: "Trotzdem",
    distractors: ["Deshalb", "Sobald"],
    explanation: "«Trotzdem» zeigt den Gegensatz zwischen der Verspätung und der pünktlichen Ankunft.",
  },
  {
    id: "connector-purpose-train",
    prompt: "Welche Konjunktion passt?\n\n«Mira stellte den Wecker früher, ___ sie den ersten Zug erreichte.»",
    correct: "damit",
    distractors: ["obwohl", "während"],
    explanation: "«Damit» leitet den Zweck ein: Der frühe Wecker soll die Zugfahrt ermöglichen.",
  },
  {
    id: "connector-before-package",
    prompt: "Welche Konjunktion macht die zeitliche Reihenfolge eindeutig?\n\n«Nico prüfte die Adresse, ___ er das Paket abschickte.»",
    correct: "bevor",
    distractors: ["nachdem", "obwohl"],
    explanation: "Die Prüfung geschieht zuerst; deshalb passt «bevor».",
  },
  {
    id: "connector-as-soon-as-green",
    prompt: "Welche Konjunktion passt?\n\n«___ das Licht grün wurde, fuhren die Velos los.»",
    correct: "Sobald",
    distractors: ["Solange", "Obwohl"],
    explanation: "«Sobald» zeigt, dass die Fahrt unmittelbar nach dem Farbwechsel beginnt.",
  },
  {
    id: "connector-purpose-air",
    prompt: "Welche Konjunktion drückt den Zweck aus?\n\n«Lina öffnete das Fenster, ___ frische Luft hereinkam.»",
    correct: "damit",
    distractors: ["denn", "obwohl"],
    explanation: "Das Fenster wird mit dem Zweck geöffnet, frische Luft hereinzulassen.",
  },
  {
    id: "connector-not-only",
    prompt: "Welches Wort ergänzt die feste Verbindung?\n\n«Es war nicht nur kalt, ___ es schneite auch.»",
    correct: "sondern",
    distractors: ["oder", "weil"],
    explanation: "Die feste Verbindung lautet «nicht nur …, sondern auch …».",
  },
  {
    id: "connector-alternative",
    prompt: "Welche Konjunktion nennt eine Alternative?\n\n«Du kannst zu Fuss gehen ___ den Bus nehmen.»",
    correct: "oder",
    distractors: ["sondern", "damit"],
    explanation: "«Oder» verbindet zwei mögliche Alternativen.",
  },
  {
    id: "connector-afterwards",
    prompt: "Welches Adverb ordnet die Handlungen richtig?\n\n«Noah packte zuerst seine Hefte ein. ___ verliess er das Zimmer.»",
    correct: "Danach",
    distractors: ["Trotzdem", "Sonst"],
    explanation: "«Danach» zeigt, dass das Verlassen auf das Einpacken folgt.",
  },
  {
    id: "connector-otherwise-bus",
    prompt: "Welches Wort nennt die Folge, falls die Aufforderung nicht beachtet wird?\n\n«Beeil dich, ___ verpasst du den Bus.»",
    correct: "sonst",
    distractors: ["deshalb", "obwohl"],
    explanation: "«Sonst» bedeutet hier: Wenn du dich nicht beeilst, verpasst du den Bus.",
  },
  {
    id: "connector-reason-storm",
    prompt: "Welche Konjunktion nennt den Grund?\n\n«Die Klasse verlegte das Training in die Halle, ___ draussen ein Gewitter tobte.»",
    correct: "weil",
    distractors: ["damit", "sobald"],
    explanation: "Das Gewitter ist der Grund für den Wechsel in die Halle; deshalb passt «weil».",
  },
  {
    id: "connector-reason-brook",
    prompt: "Welche Konjunktion verbindet Aussage und Begründung?\n\n«Der Bach führt viel Wasser, ___ es hat tagelang geregnet.»",
    correct: "denn",
    distractors: ["sondern", "trotzdem"],
    explanation: "«Denn» leitet im zweiten Hauptsatz die Begründung ein.",
  },
  {
    id: "connector-concession-cold",
    prompt: "Welche Konjunktion zeigt einen unerwarteten Gegensatz?\n\n«___ es sehr kalt war, spielten die Kinder lange draussen.»",
    correct: "Obwohl",
    distractors: ["Weil", "Damit"],
    explanation: "«Obwohl» verbindet die Kälte mit der unerwartet langen Spielzeit draussen.",
  },
])

interface GrammarTemplate {
  id: string
  sentence: string
  correct: string
  distractors: readonly string[]
  explanation: string
}

interface AcceptedCorrectionTemplate {
  id: string
  sentence: string
  accepted: readonly [string, ...string[]]
  explanation: string
}

const grammarTemplates: readonly GrammarTemplate[] = Object.freeze([
  {
    id: "seid-seit",
    sentence: "Ihr seit heute besonders aufmerksam.",
    correct: "Ihr seid heute besonders aufmerksam.",
    distractors: ["Ihr seit heute besonders aufmerksahm.", "Ihr sind heute besonders aufmerksam."],
    explanation: "«Seid» ist die Verbform von «sein» für «ihr»; «seit» bezeichnet einen Zeitpunkt oder Zeitraum.",
  },
  {
    id: "das-dass",
    sentence: "Mila hofft, das der Zug pünktlich kommt.",
    correct: "Mila hofft, dass der Zug pünktlich kommt.",
    distractors: ["Mila hofft, dass der Zug pünktlich kommen.", "Mila hofft das, der Zug pünktlich kommt."],
    explanation: "Hier leitet «dass» einen Nebensatz ein und wird mit Doppel-s geschrieben.",
  },
  {
    id: "tense-borrow",
    sentence: "Gestern ging sie zur Bibliothek und leiht ein Buch aus.",
    correct: "Gestern ging sie zur Bibliothek und lieh ein Buch aus.",
    distractors: ["Gestern geht sie zur Bibliothek und lieh ein Buch aus.", "Gestern ging sie zur Bibliothek und geliehen ein Buch aus."],
    explanation: "Beide Handlungen liegen in der Vergangenheit; zu «ging» passt «lieh».",
  },
  {
    id: "main-clause-order",
    sentence: "Obwohl es regnete, die Mannschaft spielte weiter.",
    correct: "Obwohl es regnete, spielte die Mannschaft weiter.",
    distractors: ["Obwohl regnete es, spielte die Mannschaft weiter.", "Obwohl es regnete, weiter die Mannschaft spielte."],
    explanation: "Nach dem vorangestellten Nebensatz beginnt der Hauptsatz mit dem konjugierten Verb «spielte».",
  },
  {
    id: "capitalised-noun",
    sentence: "Das laute lachen hörte man bis auf den Flur.",
    correct: "Das laute Lachen hörte man bis auf den Flur.",
    distractors: ["Das Laute lachen hörte man bis auf den Flur.", "Das laute Lachen hörte Mann bis auf den Flur."],
    explanation: "Nach Artikel und Adjektiv ist «Lachen» hier ein Nomen und wird grossgeschrieben.",
  },
  {
    id: "subject-verb-agreement",
    sentence: "Die Kinder packt ihre Hefte sorgfältig ein.",
    correct: "Die Kinder packen ihre Hefte sorgfältig ein.",
    distractors: ["Die Kinder packen ihren Hefte sorgfältig ein.", "Die Kinder packt ihr Hefte sorgfältig ein."],
    explanation: "Das Subjekt «die Kinder» steht im Plural; deshalb lautet die Verbform «packen».",
  },
  {
    id: "adjective-ending",
    sentence: "Nora füttert jeden Morgen den junge Hund.",
    correct: "Nora füttert jeden Morgen den jungen Hund.",
    distractors: ["Nora füttert jeden Morgen dem jungen Hund.", "Nora füttert jeden Morgen den jungen Hunde."],
    explanation: "Nach «den» erhält das Adjektiv im Akkusativ die Endung «-en»: «den jungen Hund».",
  },
  {
    id: "relative-pronoun",
    sentence: "Das Velo, dass vor dem Haus steht, gehört Amir.",
    correct: "Das Velo, das vor dem Haus steht, gehört Amir.",
    distractors: ["Das Velo dass, vor dem Haus steht, gehört Amir.", "Das Velo, welches vor dem Haus stehen, gehört Amir."],
    explanation: "Das Relativpronomen bezieht sich auf «das Velo» und wird hier mit einem s geschrieben.",
  },
  {
    id: "plural-were",
    sentence: "Wir war gestern pünktlich am Treffpunkt.",
    correct: "Wir waren gestern pünktlich am Treffpunkt.",
    distractors: ["Wir wart gestern pünktlich am Treffpunkt.", "Wir waren gestern pünktliche am Treffpunkt."],
    explanation: "Zum Subjekt «wir» gehört im Präteritum die Verbform «waren».",
  },
  {
    id: "has-double-t",
    sentence: "Sie hatt das Fenster vor dem Regen geschlossen.",
    correct: "Sie hat das Fenster vor dem Regen geschlossen.",
    distractors: ["Sie hatte das Fenster vor dem Regen geschlossen hat.", "Sie hat den Fenster vor dem Regen geschlossen."],
    explanation: "Die Präsensform von «haben» für «sie» lautet «hat» mit einem t.",
  },
  {
    id: "subordinate-comma",
    sentence: "Wenn es regnet bleiben wir in der Bibliothek.",
    correct: "Wenn es regnet, bleiben wir in der Bibliothek.",
    distractors: ["Wenn, es regnet bleiben wir in der Bibliothek.", "Wenn es regnet bleiben, wir in der Bibliothek."],
    explanation: "Der Nebensatz «Wenn es regnet» wird mit einem Komma vom Hauptsatz getrennt.",
  },
  {
    id: "nominalised-swimming",
    sentence: "Beim schwimmen trägt Lio immer eine Badekappe.",
    correct: "Beim Schwimmen trägt Lio immer eine Badekappe.",
    distractors: ["Beim schwimmen Trägt Lio immer eine Badekappe.", "Beim Schwimmen trägt Lio immer einen Badekappe."],
    explanation: "Nach «beim» ist «Schwimmen» ein nominalisiertes Verb und wird grossgeschrieben.",
  },
])

const acceptedCorrectionTemplates: readonly AcceptedCorrectionTemplate[] = Object.freeze([
  {
    id: "text-seid-hour",
    sentence: "Wir warten seid einer Stunde auf den Bus.",
    accepted: ["Wir warten seit einer Stunde auf den Bus.", "Wir warten seit einer Stunde auf den Bus"],
    explanation: "«Seit» bezeichnet hier einen Zeitraum; «seid» wäre eine Form des Verbs «sein».",
  },
  {
    id: "text-noun-reading",
    sentence: "Das lesen macht mir heute besonders Freude.",
    accepted: ["Das Lesen macht mir heute besonders Freude.", "Das Lesen macht mir heute besonders Freude"],
    explanation: "Nach dem Artikel «das» ist «Lesen» nominalisiert und wird grossgeschrieben.",
  },
  {
    id: "text-plural-carry",
    sentence: "Die beiden Kinder trägt den Korb gemeinsam.",
    accepted: ["Die beiden Kinder tragen den Korb gemeinsam.", "Die beiden Kinder tragen den Korb gemeinsam"],
    explanation: "Zum Pluralsubjekt «die beiden Kinder» gehört die Verbform «tragen».",
  },
  {
    id: "text-before-comma",
    sentence: "Bevor wir gehen prüfen wir noch einmal die Fenster.",
    accepted: ["Bevor wir gehen, prüfen wir noch einmal die Fenster.", "Bevor wir gehen, prüfen wir noch einmal die Fenster"],
    explanation: "Der Nebensatz «Bevor wir gehen» wird mit einem Komma vom Hauptsatz getrennt.",
  },
  {
    id: "text-dass-news",
    sentence: "Ayla weiss, das die Nachricht angekommen ist.",
    accepted: ["Ayla weiss, dass die Nachricht angekommen ist.", "Ayla weiss, dass die Nachricht angekommen ist"],
    explanation: "Die Konjunktion «dass» leitet den Nebensatz ein und wird mit Doppel-s geschrieben.",
  },
  {
    id: "text-relative-das",
    sentence: "Das Heft, dass auf dem Pult liegt, gehört Nevin.",
    accepted: ["Das Heft, das auf dem Pult liegt, gehört Nevin.", "Das Heft, das auf dem Pult liegt, gehört Nevin"],
    explanation: "Das Relativpronomen bezieht sich auf «das Heft» und wird mit einem s geschrieben.",
  },
  {
    id: "text-dative-adjective",
    sentence: "Milo hilft dem neue Schüler bei der Aufgabe.",
    accepted: ["Milo hilft dem neuen Schüler bei der Aufgabe.", "Milo hilft dem neuen Schüler bei der Aufgabe"],
    explanation: "Nach «dem» erhält das Adjektiv im Dativ die Endung «-en».",
  },
  {
    id: "text-past-parallel",
    sentence: "Gestern räumte Sora ihr Zimmer auf und bringt die Bücher zurück.",
    accepted: ["Gestern räumte Sora ihr Zimmer auf und brachte die Bücher zurück.", "Gestern räumte Sora ihr Zimmer auf und brachte die Bücher zurück"],
    explanation: "Beide Handlungen liegen in der Vergangenheit; zu «räumte» passt «brachte».",
  },
  {
    id: "text-subordinate-main-order",
    sentence: "Nachdem die Pause beendet war, die Klasse begann mit der Prüfung.",
    accepted: ["Nachdem die Pause beendet war, begann die Klasse mit der Prüfung.", "Nachdem die Pause beendet war, begann die Klasse mit der Prüfung"],
    explanation: "Nach dem vorangestellten Nebensatz beginnt der Hauptsatz mit dem konjugierten Verb «begann».",
  },
  {
    id: "text-nominalised-cycling",
    sentence: "Beim velofahren trägt Samira immer einen Helm.",
    accepted: ["Beim Velofahren trägt Samira immer einen Helm.", "Beim Velofahren trägt Samira immer einen Helm"],
    explanation: "Nach «beim» ist «Velofahren» ein Nomen und wird grossgeschrieben.",
  },
  {
    id: "text-compound-subject",
    sentence: "Sowohl der Trainer als auch die Spielerin war rechtzeitig in der Halle.",
    accepted: ["Sowohl der Trainer als auch die Spielerin waren rechtzeitig in der Halle.", "Sowohl der Trainer als auch die Spielerin waren rechtzeitig in der Halle"],
    explanation: "«Sowohl … als auch …» verbindet zwei Subjekte; deshalb steht das Verb im Plural: «waren».",
  },
  {
    id: "text-indirect-question-comma",
    sentence: "Niemand wusste ob der letzte Zug noch auf Reisende wartete.",
    accepted: ["Niemand wusste, ob der letzte Zug noch auf Reisende wartete.", "Niemand wusste, ob der letzte Zug noch auf Reisende wartete"],
    explanation: "Der indirekte Fragesatz mit «ob» wird durch ein Komma vom Hauptsatz getrennt.",
  },
])

const tensePerspectiveTemplates: readonly ChoiceTemplate[] = Object.freeze([
  {
    id: "tense-present-to-preterite",
    prompt: "Setze den Satz ins Präteritum. Welche Form ist korrekt?\n\n«Heute öffnet Nina das Fenster.»",
    correct: "Gestern öffnete Nina das Fenster.",
    distractors: ["Gestern öffnet Nina das Fenster.", "Gestern hat Nina das Fenster öffnen."],
    explanation: "Im Präteritum lautet die Verbform von «öffnen» für Nina «öffnete».",
  },
  {
    id: "tense-preterite-to-present",
    prompt: "Setze den Satz ins Präsens. Welche Form ist korrekt?\n\n«Gestern spielten die Kinder im Hof.»",
    correct: "Heute spielen die Kinder im Hof.",
    distractors: ["Heute spielten die Kinder im Hof.", "Heute gespielt die Kinder im Hof."],
    explanation: "Im Präsens lautet die Verbform zum Pluralsubjekt «die Kinder» «spielen».",
  },
  {
    id: "tense-present-to-perfect",
    prompt: "Setze den Satz ins Perfekt. Welche Form ist korrekt?\n\n«Mara schreibt einen Brief.»",
    correct: "Mara hat einen Brief geschrieben.",
    distractors: ["Mara ist einen Brief geschrieben.", "Mara hat einen Brief schreibt."],
    explanation: "Das Perfekt von «schreiben» wird mit «hat» und «geschrieben» gebildet.",
  },
  {
    id: "tense-found-to-present",
    prompt: "Setze den Satz ins Präsens. Welche Form ist korrekt?\n\n«Jonas fand den Schlüssel.»",
    correct: "Jonas findet den Schlüssel.",
    distractors: ["Jonas findete den Schlüssel.", "Jonas gefunden den Schlüssel."],
    explanation: "Die Präsensform von «finden» für Jonas lautet «findet».",
  },
  {
    id: "perspective-i-to-he",
    prompt: "Ersetze «ich» durch «er» und passe alle Formen an. Welche Lösung ist korrekt?\n\n«Ich trage meine Tasche selbst.»",
    correct: "Er trägt seine Tasche selbst.",
    distractors: ["Er trage meine Tasche selbst.", "Er trägt ihre Tasche selbst."],
    explanation: "Verb und Possessivpronomen müssen zur dritten Person Singular passen: «trägt seine».",
  },
  {
    id: "perspective-we-to-they",
    prompt: "Ersetze «wir» durch «sie» (Plural) und passe das Possessivpronomen an. Welche Lösung ist korrekt?\n\n«Wir lösen unsere Aufgaben gemeinsam.»",
    correct: "Sie lösen ihre Aufgaben gemeinsam.",
    distractors: ["Sie löst ihre Aufgaben gemeinsam.", "Sie lösen unsere Aufgaben gemeinsam."],
    explanation: "In der dritten Person Plural bleiben «lösen» und das Possessivpronomen «ihre».",
  },
  {
    id: "perspective-he-to-i",
    prompt: "Ersetze «er» durch «ich» und passe alle Formen an. Welche Lösung ist korrekt?\n\n«Er fährt mit seinem Velo zur Schule.»",
    correct: "Ich fahre mit meinem Velo zur Schule.",
    distractors: ["Ich fährt mit seinem Velo zur Schule.", "Ich fahre mit seinem Velo zur Schule."],
    explanation: "Zur Ich-Perspektive gehören «fahre» und «meinem».",
  },
  {
    id: "tense-future-one",
    prompt: "Setze den Satz ausdrücklich ins Futur I. Welche Form ist korrekt?\n\n«Morgen besuchen wir das Museum.»",
    correct: "Morgen werden wir das Museum besuchen.",
    distractors: ["Morgen wurden wir das Museum besuchen.", "Morgen haben wir das Museum besuchen."],
    explanation: "Das Futur I wird mit einer Form von «werden» und dem Infinitiv gebildet.",
  },
  {
    id: "tense-perfect-to-preterite",
    prompt: "Setze den Satz ins Präteritum. Welche Form ist korrekt?\n\n«Sie hat den Fuchs gesehen.»",
    correct: "Sie sah den Fuchs.",
    distractors: ["Sie sehte den Fuchs.", "Sie hatte den Fuchs sehen."],
    explanation: "Das Präteritum von «sehen» in der dritten Person Singular lautet «sah».",
  },
  {
    id: "tense-before-past",
    prompt: "Welche Form zeigt eindeutig, dass das Essen vor dem Aufbruch beendet war?",
    correct: "Nachdem Lio gegessen hatte, ging er los.",
    distractors: ["Nachdem Lio gegessen hat, ging er los.", "Nachdem Lio essen wird, ging er los."],
    explanation: "Das Plusquamperfekt «hatte gegessen» kennzeichnet die frühere der beiden vergangenen Handlungen.",
  },
  {
    id: "perspective-mia-first-person",
    prompt: "Erzähle den Satz aus Mias Ich-Perspektive. Welche Form ist korrekt?\n\n«Mia packte ihren Rucksack und suchte ihre Jacke.»",
    correct: "Ich packte meinen Rucksack und suchte meine Jacke.",
    distractors: ["Ich packte ihren Rucksack und suchte ihre Jacke.", "Ich packten meinen Rucksack und suchten meine Jacke."],
    explanation: "In der Ich-Perspektive werden Name, Verbformen und Possessivpronomen angepasst.",
  },
  {
    id: "perspective-children-we",
    prompt: "Die Kinder erzählen selbst. Welche Form in der Wir-Perspektive ist korrekt?\n\n«Die Kinder bauten ihre Hütte im Wald.»",
    correct: "Wir bauten unsere Hütte im Wald.",
    distractors: ["Wir baute ihre Hütte im Wald.", "Wir bauten ihre Hütte im Wald."],
    explanation: "Zur Wir-Perspektive gehören die Pluralform «bauten» und «unsere».",
  },
])

function templateKey(familyId: GermanObjectiveFamilyId, templateId: string): string {
  return `${familyId}:${templateId}`
}

const foundationTemplateKeys = new Set<string>([
  templateKey("reading-evidence", "lost-key-noticed"),
  templateKey("reading-evidence", "rain-protection"),
  templateKey("reading-evidence", "bell-problem"),
  templateKey("truth-status", "lost-key-noticed-late"),
  templateKey("truth-status", "rain-scenery-dry"),
  templateKey("truth-status", "rain-ended-late"),
  templateKey("multi-evidence", "multi-lost-key-direct"),
  templateKey("multi-evidence", "multi-library-direct"),
  templateKey("multi-evidence", "multi-rain-direct"),
  templateKey("multi-evidence", "multi-bell-direct"),
  templateKey("vocabulary-context", "noticed"),
  templateKey("vocabulary-context", "relieved"),
  templateKey("vocabulary-context", "props"),
  templateKey("vocabulary-context", "hardly"),
  templateKey("vocabulary-context", "missing"),
  templateKey("word-formation", "decide-noun"),
  templateKey("word-formation", "friendly-noun"),
  templateKey("word-formation", "read-person"),
  templateKey("word-formation", "calm-opposite"),
  templateKey("word-class", "word-class-bicycle-noun"),
  templateKey("word-class", "word-class-laugh-verb"),
  templateKey("word-class", "word-class-quiet-adjective"),
  templateKey("word-class", "word-class-she-pronoun"),
  templateKey("sentence-constituents", "subject-window"),
  templateKey("sentence-constituents", "object-window"),
  templateKey("sentence-constituents", "predicate-arrival"),
  templateKey("sentence-constituents", "time-adverbial"),
  templateKey("sentence-constituents", "matching-monday-book"),
  templateKey("sentence-constituents", "matching-garden-roses"),
  templateKey("sentence-constituents", "matching-rain-excursion"),
  templateKey("sentence-constituents", "matching-trainer-rule"),
  templateKey("sentence-constituents", "analysis-monday-book"),
  templateKey("sentence-constituents", "analysis-morning-roses"),
  templateKey("sentence-constituents", "analysis-trainer-rule"),
  templateKey("sentence-constituents", "analysis-grandfather-card"),
  templateKey("connector-cloze", "connector-purpose-train"),
  templateKey("connector-cloze", "connector-before-package"),
  templateKey("connector-cloze", "connector-as-soon-as-green"),
  templateKey("connector-cloze", "connector-afterwards"),
  templateKey("one-error-correction", "seid-seit"),
  templateKey("one-error-correction", "das-dass"),
  templateKey("one-error-correction", "capitalised-noun"),
  templateKey("one-error-correction", "has-double-t"),
  templateKey("one-error-correction", "text-seid-hour"),
  templateKey("one-error-correction", "text-noun-reading"),
  templateKey("one-error-correction", "text-plural-carry"),
  templateKey("one-error-correction", "text-before-comma"),
  templateKey("tense-perspective", "tense-present-to-preterite"),
  templateKey("tense-perspective", "tense-preterite-to-present"),
  templateKey("tense-perspective", "tense-present-to-perfect"),
  templateKey("tense-perspective", "tense-found-to-present"),
])

const examTemplateKeys = new Set<string>([
  templateKey("reading-evidence", "library-progress"),
  templateKey("reading-evidence", "rain-on-time"),
  templateKey("reading-evidence", "lost-key-systematic-search"),
  templateKey("truth-status", "lost-key-loss-place"),
  templateKey("truth-status", "library-recommendation"),
  templateKey("truth-status", "bell-planned-company"),
  templateKey("multi-evidence", "multi-lost-key-inference"),
  templateKey("multi-evidence", "multi-library-inference"),
  templateKey("multi-evidence", "multi-rain-inference"),
  templateKey("multi-evidence", "multi-bell-inference"),
  templateKey("vocabulary-context", "glittered"),
  templateKey("vocabulary-context", "arrived"),
  templateKey("vocabulary-context", "heavily"),
  templateKey("vocabulary-context", "set-off"),
  templateKey("vocabulary-context", "clear-sound"),
  templateKey("word-formation", "courage-adjective"),
  templateKey("word-formation", "movement-verb"),
  templateKey("word-formation", "dark-noun"),
  templateKey("word-formation", "drive-person"),
  templateKey("word-class", "word-class-because-conjunction"),
  templateKey("word-class", "word-class-swimming-noun"),
  templateKey("word-class", "word-class-travel-verb"),
  templateKey("word-class", "word-class-nobody-pronoun"),
  templateKey("sentence-constituents", "main-after-subordinate"),
  templateKey("sentence-constituents", "object-first-main-clause"),
  templateKey("sentence-constituents", "relative-clause-order"),
  templateKey("sentence-constituents", "prepositional-object"),
  templateKey("sentence-constituents", "matching-school-wait"),
  templateKey("sentence-constituents", "matching-dog-owner"),
  templateKey("sentence-constituents", "matching-patient-puzzle"),
  templateKey("sentence-constituents", "matching-grandfather-card"),
  templateKey("sentence-constituents", "analysis-tired-bags"),
  templateKey("sentence-constituents", "analysis-school-wait"),
  templateKey("sentence-constituents", "analysis-patient-puzzle"),
  templateKey("sentence-constituents", "analysis-break-procedure"),
  templateKey("connector-cloze", "connector-not-only"),
  templateKey("connector-cloze", "connector-reason-storm"),
  templateKey("connector-cloze", "connector-reason-brook"),
  templateKey("connector-cloze", "connector-concession-cold"),
  templateKey("one-error-correction", "adjective-ending"),
  templateKey("one-error-correction", "relative-pronoun"),
  templateKey("one-error-correction", "subordinate-comma"),
  templateKey("one-error-correction", "nominalised-swimming"),
  templateKey("one-error-correction", "text-subordinate-main-order"),
  templateKey("one-error-correction", "text-nominalised-cycling"),
  templateKey("one-error-correction", "text-compound-subject"),
  templateKey("one-error-correction", "text-indirect-question-comma"),
  templateKey("tense-perspective", "tense-perfect-to-preterite"),
  templateKey("tense-perspective", "tense-before-past"),
  templateKey("tense-perspective", "perspective-mia-first-person"),
  templateKey("tense-perspective", "perspective-children-we"),
])

const versionFourTemplateKeys = new Set<string>([
  templateKey("reading-evidence", "lost-key-systematic-search"),
  templateKey("truth-status", "bell-planned-company"),
  templateKey("vocabulary-context", "usually"),
  templateKey("vocabulary-context", "missing"),
  templateKey("vocabulary-context", "clear-sound"),
])

const versionFiveTemplateKeys = new Set<string>(acceptedCorrectionTemplates.map((template) => (
  templateKey("one-error-correction", template.id)
)))

const versionSixTemplateKeys = new Set<string>(multiSelectTemplates.map((template) => (
  templateKey("multi-evidence", template.id)
)))

const versionSevenTemplateKeys = new Set<string>(sentenceAnalysisTemplates.map((template) => (
  templateKey("sentence-constituents", template.id)
)))

export function germanAuthoredDifficultyBand(
  familyId: GermanObjectiveFamilyId,
  templateId: string,
): GermanDifficultyBand {
  const key = templateKey(familyId, templateId)
  if (foundationTemplateKeys.has(key)) return "foundation"
  if (examTemplateKeys.has(key)) return "exam"
  return "standard"
}

export function germanDifficultyBandForSessionKind(
  kind: "lesson" | "review" | "assessment",
): GermanDifficultyBand {
  if (kind === "lesson") return "foundation"
  if (kind === "assessment") return "exam"
  return "standard"
}

function generatedDifficultyBand(
  generatorVersion: GermanGeneratorVersion,
  familyId: GermanObjectiveFamilyId,
  templateId: string,
): GermanDifficultyBand {
  return generatorVersion >= GERMAN_DIFFICULTY_GENERATOR_VERSION
    ? germanAuthoredDifficultyBand(familyId, templateId)
    : "standard"
}

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = pickIndex(random, index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!]
  }
  return result
}

function withoutRecent<T extends { id: string }>(
  templates: readonly T[],
  excludedTemplateIds: readonly string[] | undefined,
): readonly T[] {
  if (!excludedTemplateIds?.length) return templates
  const excluded = new Set(excludedTemplateIds)
  const available = templates.filter((template) => !excluded.has(template.id))
  return available.length > 0 ? available : templates
}

function templatesAtDifficulty<T extends { id: string }>(
  templates: readonly T[],
  familyId: GermanObjectiveFamilyId,
  generatorVersion: GermanGeneratorVersion,
  requestedDifficulty: GermanDifficultyBand | undefined,
): readonly T[] {
  const versionedTemplates = templates.filter((template) => {
    const key = templateKey(familyId, template.id)
    if (versionSevenTemplateKeys.has(key)) return generatorVersion >= GERMAN_GENERATOR_VERSION
    if (versionSixTemplateKeys.has(key)) return generatorVersion >= GERMAN_MULTI_SELECT_GENERATOR_VERSION
    if (versionFiveTemplateKeys.has(key)) return generatorVersion >= GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION
    if (versionFourTemplateKeys.has(key)) return generatorVersion >= GERMAN_DIFFICULTY_GENERATOR_VERSION
    return true
  })
  if (generatorVersion < GERMAN_DIFFICULTY_GENERATOR_VERSION) return versionedTemplates
  const difficultyBand = requestedDifficulty ?? "standard"
  const matching = versionedTemplates.filter((template) => (
    germanAuthoredDifficultyBand(familyId, template.id) === difficultyBand
  ))
  if (matching.length === 0) {
    throw new Error(`German family ${familyId} has no ${difficultyBand} templates.`)
  }
  return matching
}

function passageFor(id: string): GermanMicrotext {
  const passage = germanMicrotexts.find((candidate) => candidate.id === id)
  if (!passage) throw new Error(`Unknown German microtext: ${id}`)
  return passage
}

function readingQuestion(
  template: ReadingEvidenceTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  const random = createRandom(`${seed}:options`)
  const passage = passageFor(template.passageId)
  const options = shuffled(passage.lines.map((line) => ({
    id: `line-${line.number}`,
    label: `Zeile ${line.number}: ${line.text}`,
  })), random)
  return {
    id: `german:${generatorVersion}:${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "reading-evidence", template.id),
    familyId: "reading-evidence",
    templateId: template.id,
    topicId: "reading-evidence",
    seed,
    passage,
    prompt: template.prompt,
    options,
    correctOptionId: `line-${template.correctLine}`,
    explanation: template.explanation,
    evidenceLines: [template.correctLine],
  }
}

function truthStatusQuestion(
  template: TruthStatusTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  const random = createRandom(`${seed}:options`)
  const labels: Record<TruthStatus, string> = {
    true: "Richtig",
    false: "Falsch",
    undecidable: "Nicht entscheidbar",
  }
  const options = shuffled((Object.keys(labels) as TruthStatus[]).map((status) => ({
    id: status,
    label: labels[status],
  })), random)
  return {
    id: `german:${generatorVersion}:${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "truth-status", template.id),
    familyId: "truth-status",
    templateId: template.id,
    topicId: "reading-evidence",
    seed,
    passage: passageFor(template.passageId),
    prompt: `Ist die Aussage richtig, falsch oder mit dem Text nicht entscheidbar?\n\n«${template.statement}»`,
    options,
    correctOptionId: template.correctStatus,
    explanation: template.explanation,
    evidenceLines: template.evidenceLines,
  }
}

function multiSelectQuestion(
  template: MultiSelectTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanMultiSelectQuestion {
  const options = template.options.map((option, index) => ({
    id: `option-${index + 1}`,
    label: option.label,
  }))
  return {
    id: `german:${generatorVersion}:multi-evidence-${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "multi-evidence", template.id),
    familyId: "multi-evidence",
    templateId: template.id,
    topicId: "reading-evidence",
    seed,
    passage: passageFor(template.passageId),
    prompt: template.prompt,
    responseKind: "multi-select",
    options: shuffled(options, createRandom(`${seed}:options`)),
    correctOptionIds: template.options.flatMap((option, index) => (
      option.correct ? [`option-${index + 1}`] : []
    )),
    selectionCount: 2,
    explanation: template.explanation,
    evidenceLines: template.evidenceLines,
  }
}

function choiceOptions(
  correct: string,
  distractors: readonly string[],
  seed: string,
): GermanQuestionOption[] {
  return shuffled([
    { id: "correct", label: correct },
    ...distractors.map((label, index) => ({ id: `distractor-${index + 1}`, label })),
  ], createRandom(`${seed}:options`))
}

function vocabularyQuestion(
  template: VocabularyTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  return {
    id: `german:${generatorVersion}:vocabulary-${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "vocabulary-context", template.id),
    familyId: "vocabulary-context",
    templateId: template.id,
    topicId: "vocabulary-context",
    seed,
    passage: passageFor(template.passageId),
    prompt: `Was bedeutet «${template.target}» in Zeile ${template.line} am ehesten?`,
    options: choiceOptions(template.correct, template.distractors, seed),
    correctOptionId: "correct",
    explanation: template.explanation,
    evidenceLines: [template.line],
  }
}

function choiceQuestion(
  template: ChoiceTemplate,
  seed: string,
  familyId: Extract<
    GermanObjectiveFamilyId,
    "word-formation" | "sentence-constituents" | "connector-cloze" | "tense-perspective" | "word-class"
  >,
  topicId: Extract<GermanPilotTopicId, "word-formation" | "grammar-correction" | "sentence-structure">,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  return {
    id: `german:${generatorVersion}:${familyId}-${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, familyId, template.id),
    familyId,
    templateId: template.id,
    topicId,
    seed,
    prompt: template.prompt,
    options: choiceOptions(template.correct, template.distractors, seed),
    correctOptionId: "correct",
    explanation: template.explanation,
  }
}

function matchingQuestion(
  template: MatchingTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanMatchingQuestion {
  const items = template.pairs.map((pair, index) => ({
    id: `part-${index + 1}`,
    label: pair.segment,
  }))
  const correctMatches = template.pairs.map((pair, index) => ({
    itemId: `part-${index + 1}`,
    targetId: pair.roleId,
  }))
  return {
    id: `german:${generatorVersion}:constituent-matching-${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "sentence-constituents", template.id),
    familyId: "sentence-constituents",
    templateId: template.id,
    topicId: "sentence-structure",
    seed,
    prompt: `Ordne jedem Satzteil seine Funktion zu.\n\n«${template.sentence}»`,
    responseKind: "matching",
    items,
    targets: shuffled(template.pairs.map((pair) => ({
      id: pair.roleId,
      label: pair.roleLabel,
    })), createRandom(`${seed}:targets`)),
    correctMatches,
    explanation: template.explanation,
  }
}

function sentenceAnalysisQuestion(
  template: SentenceAnalysisTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanMatchingQuestion {
  const items = template.pairs.map((pair, index) => ({
    id: `group-${index + 1}`,
    label: pair.segment,
  }))
  const correctMatches = template.pairs.map((pair, index) => ({
    itemId: `group-${index + 1}`,
    targetId: pair.roleId,
  }))
  return {
    id: `german:${generatorVersion}:sentence-analysis-${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "sentence-constituents", template.id),
    familyId: "sentence-constituents",
    templateId: template.id,
    topicId: "sentence-structure",
    seed,
    prompt: `Ordne jeder Wortgruppe die passende Frage zu.\n\n«${template.sentence}»`,
    responseKind: "matching",
    matchingScoring: "sentence-analysis-deduction-2025",
    items,
    targets: shuffled(template.pairs.map((pair) => ({
      id: pair.roleId,
      label: pair.roleLabel,
    })), createRandom(`${seed}:targets`)),
    correctMatches,
    explanation: template.explanation,
  }
}

function grammarQuestion(
  template: GrammarTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanGeneratedQuestion {
  const random = createRandom(`${seed}:options`)
  const options = shuffled([
    { id: "correct", label: template.correct },
    ...template.distractors.map((label, index) => ({ id: `distractor-${index + 1}`, label })),
  ], random)
  return {
    id: `german:${generatorVersion}:${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "one-error-correction", template.id),
    familyId: "one-error-correction",
    templateId: template.id,
    topicId: "grammar-correction",
    seed,
    prompt: `Im Satz steckt genau ein Fehler. Welche Korrektur ist richtig?\n\n«${template.sentence}»`,
    options,
    correctOptionId: "correct",
    explanation: template.explanation,
  }
}

function acceptedCorrectionQuestion(
  template: AcceptedCorrectionTemplate,
  seed: string,
  generatorVersion: GermanGeneratorVersion,
): GermanAcceptedTextQuestion {
  return {
    id: `german:${generatorVersion}:accepted-correction-${template.id}:${seed}`,
    subjectId: "german",
    generatorId: "zh-zap1-german",
    generatorVersion,
    corpusVersion: GERMAN_CORPUS_VERSION,
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    contentLocale: "de-CH",
    difficultyBand: generatedDifficultyBand(generatorVersion, "one-error-correction", template.id),
    familyId: "one-error-correction",
    templateId: template.id,
    topicId: "grammar-correction",
    seed,
    prompt: `Im Satz steckt genau ein Fehler. Schreibe den ganzen Satz korrigiert ab. Der Schlusspunkt am Ende ist optional.\n\n«${template.sentence}»`,
    responseKind: "accepted-text",
    inputLabel: "Korrigierter Satz",
    maximumLength: 300,
    acceptedAnswers: template.accepted.map((text, index) => ({
      id: index === 0 ? "canonical" : `accepted-${index + 1}`,
      text,
    })),
    explanation: template.explanation,
  }
}

function questionsFromTemplates<T extends { id: string }>(
  templates: readonly T[],
  task: GermanGenerationTask,
  build: (template: T, seed: string) => GermanGeneratedQuestion,
): GermanGeneratedQuestion[] {
  const available = withoutRecent(templates, task.excludedTemplateIds)
  const ordered = shuffled(available, createRandom(`${task.seed}:${task.topicId}`))
  return Array.from({ length: task.questionCount }, (_, index) => (
    build(ordered[index % ordered.length]!, `${task.seed}:${index}`)
  ))
}

interface GermanQuestionFactory {
  id: string
  build: (seed: string) => GermanGeneratedQuestion
}

function familyFactories<T extends { id: string }>(
  templates: readonly T[],
  build: (template: T, seed: string) => GermanGeneratedQuestion,
): GermanQuestionFactory[] {
  return templates.map((template) => ({
    id: template.id,
    build: (seed) => build(template, seed),
  }))
}

function questionsFromFamilies(
  families: readonly (readonly GermanQuestionFactory[])[],
  task: GermanGenerationTask,
): GermanGeneratedQuestion[] {
  const orderedFamilies = families.map((family, familyIndex) => shuffled(
    withoutRecent(family, task.excludedTemplateIds),
    createRandom(`${task.seed}:${task.topicId}:family:${familyIndex}`),
  ))
  const firstFamily = pickIndex(createRandom(`${task.seed}:${task.topicId}:family-order`), families.length)
  const familyIndexes = Array.from({ length: families.length }, () => 0)
  return Array.from({ length: task.questionCount }, (_, index) => {
    const familyIndex = (index + firstFamily) % orderedFamilies.length
    const family = orderedFamilies[familyIndex]!
    const templateIndex = familyIndexes[familyIndex]!
    familyIndexes[familyIndex] = templateIndex + 1
    return family[templateIndex % family.length]!.build(`${task.seed}:${index}`)
  })
}

export function generateGermanQuestions(task: GermanGenerationTask): GermanGeneratedQuestion[] {
  if (!Number.isInteger(task.questionCount) || task.questionCount < 1) {
    throw new Error("German question count must be a positive integer.")
  }
  if (germanLessonIdByTopic[task.topicId] !== task.lessonId) {
    throw new Error(`German lesson ${task.lessonId} does not teach ${task.topicId}.`)
  }
  const generatorVersion = task.generatorVersion ?? GERMAN_GENERATOR_VERSION
  if (!germanGeneratorVersions.includes(generatorVersion)) {
    throw new Error(`Unsupported German generator version: ${String(generatorVersion)}.`)
  }
  if (task.topicId === "reading-evidence") {
    const evidence = shuffled(
      withoutRecent(templatesAtDifficulty(
        readingTemplates,
        "reading-evidence",
        generatorVersion,
        task.difficultyBand,
      ), task.excludedTemplateIds),
      createRandom(`${task.seed}:evidence`),
    )
    const truth = shuffled(
      withoutRecent(templatesAtDifficulty(
        truthStatusTemplates,
        "truth-status",
        generatorVersion,
        task.difficultyBand,
      ), task.excludedTemplateIds),
      createRandom(`${task.seed}:truth`),
    )
    if (generatorVersion >= GERMAN_MULTI_SELECT_GENERATOR_VERSION) {
      return questionsFromFamilies([
        familyFactories(evidence, (template, seed) => (
          readingQuestion(template, seed, generatorVersion)
        )),
        familyFactories(truth, (template, seed) => (
          truthStatusQuestion(template, seed, generatorVersion)
        )),
        familyFactories(templatesAtDifficulty(
          multiSelectTemplates,
          "multi-evidence",
          generatorVersion,
          task.difficultyBand,
        ), (template, seed) => multiSelectQuestion(template, seed, generatorVersion)),
      ], task)
    }
    const familyRandom = createRandom(`${task.seed}:reading-families`)
    const firstFamily = pickIndex(familyRandom, 2)
    let evidenceIndex = 0
    let truthIndex = 0
    return Array.from({ length: task.questionCount }, (_, index) => {
      const seed = `${task.seed}:${index}`
      if ((index + firstFamily) % 2 === 0) {
        return readingQuestion(evidence[evidenceIndex++ % evidence.length]!, seed, generatorVersion)
      }
      return truthStatusQuestion(truth[truthIndex++ % truth.length]!, seed, generatorVersion)
    })
  }
  if (task.topicId === "vocabulary-context") {
    return questionsFromTemplates(templatesAtDifficulty(
      vocabularyTemplates,
      "vocabulary-context",
      generatorVersion,
      task.difficultyBand,
    ), task, (template, seed) => (
      vocabularyQuestion(template, seed, generatorVersion)
    ))
  }
  if (task.topicId === "word-formation") {
    if (generatorVersion === 1) {
      return questionsFromTemplates(wordFormationTemplates, task, (template, seed) => (
        choiceQuestion(template, seed, "word-formation", "word-formation", generatorVersion)
      ))
    }
    return questionsFromFamilies([
      familyFactories(templatesAtDifficulty(
        wordFormationTemplates,
        "word-formation",
        generatorVersion,
        task.difficultyBand,
      ), (template, seed) => (
        choiceQuestion(template, seed, "word-formation", "word-formation", generatorVersion)
      )),
      familyFactories(templatesAtDifficulty(
        wordClassTemplates,
        "word-class",
        generatorVersion,
        task.difficultyBand,
      ), (template, seed) => (
        choiceQuestion(template, seed, "word-class", "word-formation", generatorVersion)
      )),
    ], task)
  }
  if (task.topicId === "sentence-structure") {
    if (generatorVersion === 1) {
      return questionsFromTemplates(sentenceStructureTemplates, task, (template, seed) => (
        choiceQuestion(template, seed, "sentence-constituents", "sentence-structure", generatorVersion)
      ))
    }
    const existingFamilies = [
      familyFactories(templatesAtDifficulty(
        sentenceStructureTemplates,
        "sentence-constituents",
        generatorVersion,
        task.difficultyBand,
      ), (template, seed) => (
        choiceQuestion(template, seed, "sentence-constituents", "sentence-structure", generatorVersion)
      )),
      familyFactories(templatesAtDifficulty(
        connectorTemplates,
        "connector-cloze",
        generatorVersion,
        task.difficultyBand,
      ), (template, seed) => (
        choiceQuestion(template, seed, "connector-cloze", "sentence-structure", generatorVersion)
      )),
    ]
    if (generatorVersion === GERMAN_EXPANDED_GENERATOR_VERSION) {
      return questionsFromFamilies(existingFamilies, task)
    }
    const matchingFamilies = [
      ...existingFamilies,
      familyFactories(templatesAtDifficulty(
        constituentMatchingTemplates,
        "sentence-constituents",
        generatorVersion,
        task.difficultyBand,
      ), (template, seed) => (
        matchingQuestion(template, seed, generatorVersion)
      )),
    ]
    if (generatorVersion < GERMAN_GENERATOR_VERSION) {
      return questionsFromFamilies(matchingFamilies, task)
    }
    return questionsFromFamilies([
      ...matchingFamilies,
      familyFactories(templatesAtDifficulty(
        sentenceAnalysisTemplates,
        "sentence-constituents",
        generatorVersion,
        task.difficultyBand,
      ), (template, seed) => (
        sentenceAnalysisQuestion(template, seed, generatorVersion)
      )),
    ], task)
  }
  if (generatorVersion === 1) {
    return questionsFromTemplates(grammarTemplates, task, (template, seed) => (
      grammarQuestion(template, seed, generatorVersion)
    ))
  }
  const existingGrammarFamilies = [
    familyFactories(templatesAtDifficulty(
      grammarTemplates,
      "one-error-correction",
      generatorVersion,
      task.difficultyBand,
    ), (template, seed) => (
      grammarQuestion(template, seed, generatorVersion)
    )),
    familyFactories(templatesAtDifficulty(
      tensePerspectiveTemplates,
      "tense-perspective",
      generatorVersion,
      task.difficultyBand,
    ), (template, seed) => (
      choiceQuestion(template, seed, "tense-perspective", "grammar-correction", generatorVersion)
    )),
  ]
  if (generatorVersion < GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION) {
    return questionsFromFamilies(existingGrammarFamilies, task)
  }
  return questionsFromFamilies([
    ...existingGrammarFamilies,
    familyFactories(templatesAtDifficulty(
      acceptedCorrectionTemplates,
      "one-error-correction",
      generatorVersion,
      task.difficultyBand,
    ), (template, seed) => acceptedCorrectionQuestion(template, seed, generatorVersion)),
  ], task)
}

export const germanGeneratorDiagnostics = Object.freeze({
  readingTemplateCount: readingTemplates.length,
  truthStatusTemplateCount: truthStatusTemplates.length,
  multiSelectTemplateCount: multiSelectTemplates.length,
  vocabularyTemplateCount: vocabularyTemplates.length,
  wordFormationTemplateCount: wordFormationTemplates.length,
  wordClassTemplateCount: wordClassTemplates.length,
  grammarTemplateCount: grammarTemplates.length,
  acceptedCorrectionTemplateCount: acceptedCorrectionTemplates.length,
  tensePerspectiveTemplateCount: tensePerspectiveTemplates.length,
  sentenceStructureTemplateCount: sentenceStructureTemplates.length,
  connectorTemplateCount: connectorTemplates.length,
  constituentMatchingTemplateCount: constituentMatchingTemplates.length,
  sentenceAnalysisTemplateCount: sentenceAnalysisTemplates.length,
})

export interface GermanAuthorValidationMatrixEntry {
  topicId: GermanPilotTopicId
  familyId: GermanObjectiveFamilyId
  templateId: string
  responseKind: "single-choice" | "matching" | "accepted-text" | "multi-select"
  difficultyBand: GermanDifficultyBand
  scoringRuleId:
    | "exact-option-v1"
    | "exact-matching-v1"
    | "exact-accepted-text-v1"
    | "exact-multi-select-v1"
    | "sentence-analysis-deduction-2025-v1"
  scoringPolicyVersion: typeof GERMAN_SCORING_POLICY_VERSION
  introducedInGeneratorVersion: GermanGeneratorVersion
  sourceStatus: "newly-authored-training-content"
  validationStatus: "automated-objective-checks"
}

function authorMatrixEntries<T extends { id: string }>(
  templates: readonly T[],
  topicId: GermanPilotTopicId,
  familyId: GermanObjectiveFamilyId,
  responseKind: GermanAuthorValidationMatrixEntry["responseKind"] = "single-choice",
  introducedInGeneratorVersion?: GermanGeneratorVersion,
  scoringRuleId?: GermanAuthorValidationMatrixEntry["scoringRuleId"],
): GermanAuthorValidationMatrixEntry[] {
  return templates.map((template) => ({
    topicId,
    familyId,
    templateId: template.id,
    responseKind,
    difficultyBand: germanAuthoredDifficultyBand(familyId, template.id),
    scoringRuleId: scoringRuleId ?? (responseKind === "matching"
      ? "exact-matching-v1"
      : responseKind === "accepted-text"
        ? "exact-accepted-text-v1"
        : responseKind === "multi-select"
          ? "exact-multi-select-v1"
        : "exact-option-v1"),
    scoringPolicyVersion: GERMAN_SCORING_POLICY_VERSION,
    introducedInGeneratorVersion: introducedInGeneratorVersion ?? (
      versionFourTemplateKeys.has(templateKey(familyId, template.id))
      ? GERMAN_DIFFICULTY_GENERATOR_VERSION
      : responseKind === "multi-select"
        ? GERMAN_MULTI_SELECT_GENERATOR_VERSION
      : responseKind === "matching"
        ? GERMAN_MATCHING_GENERATOR_VERSION
        : familyId === "connector-cloze" || familyId === "tense-perspective" || familyId === "word-class"
          ? GERMAN_EXPANDED_GENERATOR_VERSION
          : 1
    ),
    sourceStatus: "newly-authored-training-content",
    validationStatus: "automated-objective-checks",
  }))
}

export const germanAuthorValidationMatrix: readonly GermanAuthorValidationMatrixEntry[] = Object.freeze([
  ...authorMatrixEntries(readingTemplates, "reading-evidence", "reading-evidence"),
  ...authorMatrixEntries(truthStatusTemplates, "reading-evidence", "truth-status"),
  ...authorMatrixEntries(
    multiSelectTemplates,
    "reading-evidence",
    "multi-evidence",
    "multi-select",
    GERMAN_MULTI_SELECT_GENERATOR_VERSION,
  ),
  ...authorMatrixEntries(vocabularyTemplates, "vocabulary-context", "vocabulary-context"),
  ...authorMatrixEntries(wordFormationTemplates, "word-formation", "word-formation"),
  ...authorMatrixEntries(wordClassTemplates, "word-formation", "word-class"),
  ...authorMatrixEntries(grammarTemplates, "grammar-correction", "one-error-correction"),
  ...authorMatrixEntries(
    acceptedCorrectionTemplates,
    "grammar-correction",
    "one-error-correction",
    "accepted-text",
    GERMAN_ACCEPTED_TEXT_GENERATOR_VERSION,
  ),
  ...authorMatrixEntries(tensePerspectiveTemplates, "grammar-correction", "tense-perspective"),
  ...authorMatrixEntries(sentenceStructureTemplates, "sentence-structure", "sentence-constituents"),
  ...authorMatrixEntries(connectorTemplates, "sentence-structure", "connector-cloze"),
  ...authorMatrixEntries(
    constituentMatchingTemplates,
    "sentence-structure",
    "sentence-constituents",
    "matching",
  ),
  ...authorMatrixEntries(
    sentenceAnalysisTemplates,
    "sentence-structure",
    "sentence-constituents",
    "matching",
    GERMAN_GENERATOR_VERSION,
    "sentence-analysis-deduction-2025-v1",
  ),
])

function normalizedAcceptedCorrectionAuthorText(value: string): string {
  return value.normalize("NFC").replace(/\s+/gu, " ").trim()
}

function collectAcceptedCorrectionAuthorValidationIssues(): string[] {
  const issues: string[] = []
  const allCorrectionIds = [...grammarTemplates, ...acceptedCorrectionTemplates].map((template) => template.id)
  if (new Set(allCorrectionIds).size !== allCorrectionIds.length) {
    issues.push("correction template ids are not globally unique")
  }
  for (const template of acceptedCorrectionTemplates) {
    const normalizedSentence = normalizedAcceptedCorrectionAuthorText(template.sentence)
    const normalizedAnswers = template.accepted.map(normalizedAcceptedCorrectionAuthorText)
    if (!template.id.trim()) issues.push("accepted correction has an empty id")
    if (!normalizedSentence) issues.push(`${template.id}: source sentence is empty`)
    if (!template.explanation.trim()) issues.push(`${template.id}: explanation is empty`)
    if (template.accepted.length !== 2) issues.push(`${template.id}: expected canonical and no-period variants`)
    if (normalizedAnswers.some((answer) => !answer || answer.length > 300)) {
      issues.push(`${template.id}: accepted answer is empty or too long`)
    }
    if (new Set(normalizedAnswers).size !== normalizedAnswers.length) {
      issues.push(`${template.id}: accepted answers collapse to a duplicate`)
    }
    if (normalizedAnswers.includes(normalizedSentence)) {
      issues.push(`${template.id}: erroneous source sentence is accepted`)
    }
    if (!normalizedAnswers[0]?.endsWith(".")) issues.push(`${template.id}: canonical answer has no final point`)
    if (normalizedAnswers[0]?.replace(/\.$/u, "") !== normalizedAnswers[1]) {
      issues.push(`${template.id}: second answer is not the canonical no-period variant`)
    }
  }
  for (const difficultyBand of germanDifficultyBands) {
    const count = acceptedCorrectionTemplates.filter((template) => (
      germanAuthoredDifficultyBand("one-error-correction", template.id) === difficultyBand
    )).length
    if (count !== 4) issues.push(`accepted correction ${difficultyBand} band has ${count} templates`)
  }
  return issues
}

export const germanAcceptedCorrectionAuthorValidationIssues: readonly string[] = Object.freeze(
  collectAcceptedCorrectionAuthorValidationIssues(),
)

function collectMultiSelectAuthorValidationIssues(): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const template of multiSelectTemplates) {
    if (!template.id.trim() || ids.has(template.id)) issues.push(`invalid multi-select id: ${template.id}`)
    ids.add(template.id)
    const passage = germanMicrotexts.find((candidate) => candidate.id === template.passageId)
    if (!passage) issues.push(`${template.id}: unknown passage ${template.passageId}`)
    if (!template.prompt.trim()) issues.push(`${template.id}: prompt is empty`)
    if (!template.explanation.trim()) issues.push(`${template.id}: explanation is empty`)
    if (template.options.length !== 4) issues.push(`${template.id}: expected four options`)
    const labels = template.options.map((option) => option.label.normalize("NFC").trim())
    if (labels.some((label) => !label)) issues.push(`${template.id}: option label is empty`)
    if (new Set(labels).size !== labels.length) issues.push(`${template.id}: option labels are not unique`)
    if (template.options.filter((option) => option.correct).length !== 2) {
      issues.push(`${template.id}: expected exactly two correct options`)
    }
    const passageLineNumbers = new Set(passage?.lines.map((line) => line.number) ?? [])
    if (!template.evidenceLines.length || template.evidenceLines.some((line) => !passageLineNumbers.has(line))) {
      issues.push(`${template.id}: evidence lines are empty or invalid`)
    }
  }
  for (const difficultyBand of germanDifficultyBands) {
    const count = multiSelectTemplates.filter((template) => (
      germanAuthoredDifficultyBand("multi-evidence", template.id) === difficultyBand
    )).length
    if (count !== 4) issues.push(`multi-select ${difficultyBand} band has ${count} templates`)
  }
  return issues
}

export const germanMultiSelectAuthorValidationIssues: readonly string[] = Object.freeze(
  collectMultiSelectAuthorValidationIssues(),
)

function collectSentenceAnalysisAuthorValidationIssues(): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const template of sentenceAnalysisTemplates) {
    if (!template.id.trim() || ids.has(template.id)) issues.push(`invalid sentence-analysis id: ${template.id}`)
    ids.add(template.id)
    if (!template.sentence.trim()) issues.push(`${template.id}: sentence is empty`)
    if (!template.explanation.trim()) issues.push(`${template.id}: explanation is empty`)
    if (template.pairs.length !== 4) issues.push(`${template.id}: expected four word groups`)
    const segments = template.pairs.map((pair) => pair.segment.normalize("NFC").trim())
    const roleIds = template.pairs.map((pair) => pair.roleId.trim())
    const roleLabels = template.pairs.map((pair) => pair.roleLabel.normalize("NFC").trim())
    if (segments.some((segment) => !segment)) issues.push(`${template.id}: word group is empty`)
    if (roleIds.some((roleId) => !roleId)) issues.push(`${template.id}: question id is empty`)
    if (roleLabels.some((label) => !label)) issues.push(`${template.id}: question label is empty`)
    if (new Set(segments).size !== segments.length) issues.push(`${template.id}: word groups are not unique`)
    if (new Set(roleIds).size !== roleIds.length) issues.push(`${template.id}: question ids are not unique`)
    if (new Set(roleLabels).size !== roleLabels.length) issues.push(`${template.id}: question labels are not unique`)
  }
  for (const difficultyBand of germanDifficultyBands) {
    const count = sentenceAnalysisTemplates.filter((template) => (
      germanAuthoredDifficultyBand("sentence-constituents", template.id) === difficultyBand
    )).length
    if (count !== 4) issues.push(`sentence analysis ${difficultyBand} band has ${count} templates`)
  }
  return issues
}

export const germanSentenceAnalysisAuthorValidationIssues: readonly string[] = Object.freeze(
  collectSentenceAnalysisAuthorValidationIssues(),
)
