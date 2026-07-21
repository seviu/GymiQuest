import {
  type GeometryControlSide,
  practiceDayIds,
  topicIds,
  type LearnerHelpStyle,
  type LearnerPreferences,
  type LearnerReadingMode,
  type LearnerState,
  type LearnerVisualMode,
  type PracticeDay,
  type SessionMinutes,
} from "./model"

export const defaultLearnerPreferences: LearnerPreferences = {
  practiceDays: ["tuesday", "thursday", "saturday"],
  sessionMinutes: 15,
  helpStyle: "visual",
  visualMode: "calm",
  readingMode: "standard",
  geometryControlSide: "right",
}

export const practiceDayLabels: Record<PracticeDay, string> = {
  monday: "Mo",
  tuesday: "Di",
  wednesday: "Mi",
  thursday: "Do",
  friday: "Fr",
  saturday: "Sa",
  sunday: "So",
}

export const helpStyleLabels: Record<LearnerHelpStyle, { title: string; description: string }> = {
  concise: { title: "Kurz und direkt", description: "Zuerst nur der nächste kleine Hinweis." },
  visual: { title: "Mit einem Bild", description: "Die Grundidee und ihre Darstellung zuerst." },
  story: { title: "Mit einem Beispiel", description: "Dieselbe Idee zunächst in einer einfacheren Situation." },
  "step-by-step": { title: "Schritt für Schritt", description: "Einen vollständigen Weg sichtbar aufbauen." },
}

export const visualModeLabels: Record<LearnerVisualMode, { title: string; description: string }> = {
  calm: { title: "Ruhig", description: "Warme Flächen und sanfte Orientierung." },
  focus: {
    title: "Fokus",
    description: "Lernplan, XP und Reviews bleiben; Quests, Abzeichen und Sammlung werden ausgeblendet.",
  },
  "high-contrast": { title: "Hoher Kontrast", description: "Stärkere Kanten und deutlichere Schriftfarben." },
}

export const readingModeLabels: Record<LearnerReadingMode, { title: string; description: string }> = {
  standard: { title: "Standard", description: "Vertraute Schrift und normale Textabstände." },
  spacious: { title: "Mehr Leseruhe", description: "Klarere Schrift, mehr Abstand und kürzere Textzeilen." },
}

export const geometryControlSideLabels: Record<GeometryControlSide, { title: string; description: string }> = {
  right: { title: "Werkzeuge rechts", description: "Der Plan bleibt links von deiner Zeichenhand sichtbar." },
  left: { title: "Werkzeuge links", description: "Der Plan bleibt rechts von deiner Zeichenhand sichtbar." },
}

const sessionMinuteValues = new Set<number>([10, 15, 20])
const helpStyles = new Set<LearnerHelpStyle>(["concise", "visual", "story", "step-by-step"])
const visualModes = new Set<LearnerVisualMode>(["calm", "focus", "high-contrast"])
const readingModes = new Set<LearnerReadingMode>(["standard", "spacious"])
const geometryControlSides = new Set<GeometryControlSide>(["right", "left"])
const dayIds = new Set<PracticeDay>(practiceDayIds)

function validDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const parsed = new Date(Date.UTC(year!, month! - 1, day!))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month! - 1 && parsed.getUTCDate() === day
}

function dateKey(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function normalizeLearnerPreferences(value: unknown): LearnerPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...defaultLearnerPreferences, practiceDays: [...defaultLearnerPreferences.practiceDays] }
  }
  const candidate = value as Partial<LearnerPreferences>
  const practiceDays = Array.isArray(candidate.practiceDays)
    ? [...new Set(candidate.practiceDays.filter((day): day is PracticeDay => dayIds.has(day as PracticeDay)))]
    : []
  const sessionMinutes = sessionMinuteValues.has(candidate.sessionMinutes as number)
    ? candidate.sessionMinutes as SessionMinutes
    : defaultLearnerPreferences.sessionMinutes
  const helpStyle = helpStyles.has(candidate.helpStyle as LearnerHelpStyle)
    ? candidate.helpStyle as LearnerHelpStyle
    : defaultLearnerPreferences.helpStyle
  const visualMode = visualModes.has(candidate.visualMode as LearnerVisualMode)
    ? candidate.visualMode as LearnerVisualMode
    : defaultLearnerPreferences.visualMode
  const readingMode = readingModes.has(candidate.readingMode as LearnerReadingMode)
    ? candidate.readingMode as LearnerReadingMode
    : defaultLearnerPreferences.readingMode
  const geometryControlSide = geometryControlSides.has(candidate.geometryControlSide as GeometryControlSide)
    ? candidate.geometryControlSide as GeometryControlSide
    : defaultLearnerPreferences.geometryControlSide

  return {
    ...(validDateOnly(candidate.examDate) ? { examDate: candidate.examDate } : {}),
    practiceDays: practiceDays.length > 0 ? practiceDays : [...defaultLearnerPreferences.practiceDays],
    sessionMinutes,
    helpStyle,
    visualMode,
    readingMode,
    geometryControlSide,
  }
}

export interface LearnerProfileInput extends LearnerPreferences {
  displayName: string
}

export function updateLearnerProfile(
  learner: LearnerState,
  input: LearnerProfileInput,
  now = new Date(),
  timeZone = "Europe/Zurich",
): LearnerState {
  const displayName = input.displayName.trim().replace(/\s+/g, " ")
  if (displayName.length < 2 || displayName.length > 24) {
    throw new Error("Der Spitzname braucht 2 bis 24 Zeichen.")
  }
  if (!validDateOnly(input.examDate) || input.examDate < dateKey(now, timeZone)) {
    throw new Error("Bitte ein heutiges oder zukünftiges Prüfungsdatum wählen.")
  }
  if (
    !Array.isArray(input.practiceDays) ||
    input.practiceDays.length === 0 ||
    input.practiceDays.length > practiceDayIds.length ||
    input.practiceDays.some((day) => !dayIds.has(day)) ||
    new Set(input.practiceDays).size !== input.practiceDays.length
  ) {
    throw new Error("Bitte mindestens einen ruhigen Lerntag wählen.")
  }
  const preferences = normalizeLearnerPreferences(input)
  const timestamp = now.toISOString()
  return {
    ...learner,
    displayName,
    preferences,
    profileCompletedAt: learner.profileCompletedAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export interface StudySnapshot {
  examDate?: string
  daysUntilExam?: number
  examDateLabel: string
  readinessLabel: "Im Aufbau" | "Am Festigen" | "Prüfungsnah"
  readinessDetail: string
}

export function buildStudySnapshot(
  learner: LearnerState,
  now = new Date(),
  timeZone = "Europe/Zurich",
): StudySnapshot {
  const mastered = topicIds.filter((topicId) => learner.mastery[topicId].status === "mastered")
  const retention = mastered.length === 0
    ? 0
    : mastered.reduce((sum, topicId) => sum + learner.mastery[topicId].retention, 0) / mastered.length
  const coverage = mastered.length / topicIds.length
  const independence = mastered.reduce(
    (sum, topicId) => sum + learner.mastery[topicId].independentMastery,
    0,
  ) / topicIds.length
  const latestMock = learner.mockHistory.at(-1)
  const mockSignal = latestMock ? latestMock.certainPoints / latestMock.maxPoints : 0
  const evidenceScore = coverage * 0.55 + retention * coverage * 0.2 + independence * 0.15 + mockSignal * 0.1
  const readinessLabel = evidenceScore >= 0.72
    ? "Prüfungsnah"
    : evidenceScore >= 0.34
      ? "Am Festigen"
      : "Im Aufbau"

  const examDate = learner.preferences.examDate
  if (!examDate) {
    return {
      examDateLabel: "Termin noch offen",
      readinessLabel,
      readinessDetail: `${mastered.length} von ${topicIds.length} Themen gelernt`,
    }
  }

  const today = dateKey(now, timeZone)
  const daysUntilExam = Math.ceil(
    (Date.parse(`${examDate}T12:00:00.000Z`) - Date.parse(`${today}T12:00:00.000Z`)) /
    (24 * 60 * 60 * 1000),
  )
  const examDateLabel = new Intl.DateTimeFormat("de-CH", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${examDate}T12:00:00.000Z`))

  return {
    examDate,
    daysUntilExam,
    examDateLabel,
    readinessLabel,
    readinessDetail: `${mastered.length} von ${topicIds.length} Themen gelernt`,
  }
}
