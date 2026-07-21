import { germanMicrotexts, type GermanMicrotext } from "./content"

export const GERMAN_COMPREHENSION_SCHEMA_VERSION = 1 as const
export const GERMAN_COMPREHENSION_GENERATOR_VERSION = 1 as const
export const GERMAN_COMPREHENSION_RESPONSE_MIN_LENGTH = 20
export const GERMAN_COMPREHENSION_RESPONSE_MAX_LENGTH = 800

export type GermanComprehensionEvidenceStatus =
  | "well-supported"
  | "partly-supported"
  | "not-yet-supported"

export interface GermanComprehensionPrompt {
  id: string
  passageId: GermanMicrotext["id"]
  question: string
  expectedElements: readonly string[]
  suggestedEvidenceLines: readonly number[]
}

export interface ActiveGermanComprehensionSession {
  schemaVersion: typeof GERMAN_COMPREHENSION_SCHEMA_VERSION
  kind: "german-comprehension-session"
  id: string
  seed: string
  generatorVersion: typeof GERMAN_COMPREHENSION_GENERATOR_VERSION
  promptId: string
  startedAt: string
  updatedAt: string
  response: string
  evidenceLines: number[]
}

export interface GermanComprehensionResult {
  schemaVersion: typeof GERMAN_COMPREHENSION_SCHEMA_VERSION
  kind: "german-comprehension-result"
  id: string
  sessionId: string
  seed: string
  generatorVersion: typeof GERMAN_COMPREHENSION_GENERATOR_VERSION
  promptId: string
  startedAt: string
  submittedAt: string
  elapsedSeconds: number
  response: string
  evidenceLines: number[]
}

export interface GermanComprehensionReview {
  schemaVersion: typeof GERMAN_COMPREHENSION_SCHEMA_VERSION
  kind: "german-comprehension-review"
  id: string
  resultId: string
  evidenceStatus: GermanComprehensionEvidenceStatus
  strength: string
  nextStep: string
  reviewedAt: string
  resolvedAt?: string
}

export const germanComprehensionPrompts: readonly GermanComprehensionPrompt[] = Object.freeze([
  {
    id: "lost-key-reason-return",
    passageId: "lost-key",
    question: "Warum geht Mara den Heimweg zurück? Antworte in einem vollständigen Satz und belege deine Erklärung mit dem Text.",
    expectedElements: ["Der Schlüssel fehlt.", "Mara sucht auf ihrem Heimweg danach."],
    suggestedEvidenceLines: [1, 2],
  },
  {
    id: "lost-key-change",
    passageId: "lost-key",
    question: "Wie verändert sich Maras Situation vom Anfang bis zum Ende? Erkläre beide Teile mit Textbelegen.",
    expectedElements: ["Am Anfang fehlt der Schlüssel.", "Am Ende findet Mara ihn und ist erleichtert."],
    suggestedEvidenceLines: [1, 4],
  },
  {
    id: "lost-key-turning-point",
    passageId: "lost-key",
    question: "Warum ist Zeile 3 der Wendepunkt der kurzen Geschichte? Begründe deine Antwort.",
    expectedElements: ["Mara bemerkt dort einen Hinweis auf den Schlüssel.", "Danach kann sie den Schlüssel finden."],
    suggestedEvidenceLines: [3, 4],
  },
  {
    id: "library-early",
    passageId: "library-window",
    question: "Woran erkennt man, dass Noah ungewöhnlich früh in der Bibliothek ist? Nenne zwei Hinweise aus dem Text.",
    expectedElements: ["Er kommt früher als sonst.", "Der sonst oft besetzte Fenstertisch ist noch frei."],
    suggestedEvidenceLines: [1, 2],
  },
  {
    id: "library-before-friend",
    passageId: "library-window",
    question: "Was hat Noah bereits getan, bevor seine Freundin eintrifft? Formuliere die Abfolge genau.",
    expectedElements: ["Er öffnet das Buch über Zugvögel.", "Er schreibt bereits zwei Seiten Notizen."],
    suggestedEvidenceLines: [3, 4],
  },
  {
    id: "library-purpose",
    passageId: "library-window",
    question: "Wofür nutzt Noah seinen frühen Bibliotheksbesuch? Begründe deine Antwort mit zwei Textinformationen.",
    expectedElements: ["Er liest in einem Buch über Zugvögel.", "Er macht dazu Notizen."],
    suggestedEvidenceLines: [3, 4],
  },
  {
    id: "rehearsal-back-entrance",
    passageId: "rain-rehearsal",
    question: "Warum trägt die Gruppe die Requisiten durch den Hintereingang? Erkläre den Zusammenhang.",
    expectedElements: ["Es regnet heftig.", "Die Requisiten beziehungsweise Kulissen sollen trocken bleiben."],
    suggestedEvidenceLines: [1, 2],
  },
  {
    id: "rehearsal-contrast",
    passageId: "rain-rehearsal",
    question: "Welche Schwierigkeit hat die Gruppe, und was gelingt ihr trotzdem? Belege beide Aussagen.",
    expectedElements: ["Die Probe beginnt wegen des Regens verspätet.", "Sie endet trotzdem pünktlich."],
    suggestedEvidenceLines: [1, 4],
  },
  {
    id: "rehearsal-dry",
    passageId: "rain-rehearsal",
    question: "Wie zeigt der Text, dass der Plan der Gruppe funktioniert? Erkläre Ursache und Ergebnis.",
    expectedElements: ["Die Gruppe nimmt wegen des Regens den Hintereingang.", "Alle Kulissen bleiben trocken."],
    suggestedEvidenceLines: [2, 3],
  },
  {
    id: "bike-delay",
    passageId: "bike-bell",
    question: "Warum können Elin und ihr Bruder nicht sofort losfahren? Begründe deine Antwort mit dem Text.",
    expectedElements: ["Die Klingel ist kaum zu hören.", "Sie muss zuerst repariert beziehungsweise geprüft werden."],
    suggestedEvidenceLines: [2, 3],
  },
  {
    id: "bike-repair",
    passageId: "bike-bell",
    question: "Welche Handlung löst das Problem mit der Klingel, und woran erkennt man den Erfolg?",
    expectedElements: ["Der Bruder zieht eine lockere Schraube fest.", "Danach klingt die Klingel klar."],
    suggestedEvidenceLines: [3, 4],
  },
  {
    id: "bike-careful-check",
    passageId: "bike-bell",
    question: "Woran erkennt man, dass die beiden das Fahrrad sorgfältig prüfen? Nenne zwei passende Textdetails.",
    expectedElements: ["Elin prüft Bremsen und Luftdruck.", "Die Klingel wird getestet und repariert."],
    suggestedEvidenceLines: [1, 2],
  },
])

const promptById = new Map(germanComprehensionPrompts.map((prompt) => [prompt.id, prompt]))
const passageById = new Map(germanMicrotexts.map((passage) => [passage.id, passage]))
const evidenceStatuses = new Set<GermanComprehensionEvidenceStatus>([
  "well-supported",
  "partly-supported",
  "not-yet-supported",
])

function hashSeed(seed: string): number {
  let hash = 2_166_136_261
  for (const character of seed) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16_777_619)
  }
  return hash >>> 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
}

function isBoundedString(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value.trim().length >= minimum && value.length <= maximum
}

function hasScoringFields(value: Record<string, unknown>): boolean {
  return ["points", "maxPoints", "score", "grade", "xp", "mastery", "recoveryTopicIds"]
    .some((key) => Object.prototype.hasOwnProperty.call(value, key))
}

function nextTimestamp(startedAt: string, updatedAt: string, now: Date): string {
  return new Date(Math.max(Date.parse(startedAt), Date.parse(updatedAt), now.getTime())).toISOString()
}

function validEvidenceLines(promptId: string, value: unknown): value is number[] {
  const prompt = promptById.get(promptId)
  const passage = prompt ? passageById.get(prompt.passageId) : undefined
  if (!prompt || !passage || !Array.isArray(value) || value.length > 2) return false
  const allowed = new Set(passage.lines.map((line) => line.number))
  return value.every((line) => Number.isInteger(line) && allowed.has(line)) &&
    new Set(value).size === value.length &&
    value.every((line, index) => index === 0 || Number(value[index - 1]) < Number(line))
}

export function germanComprehensionPromptById(promptId: string): GermanComprehensionPrompt | undefined {
  return promptById.get(promptId)
}

export function germanComprehensionPassage(promptId: string): GermanMicrotext | undefined {
  const prompt = promptById.get(promptId)
  return prompt ? passageById.get(prompt.passageId) : undefined
}

export function createActiveGermanComprehensionSession(
  seed: string,
  excludedPromptIds: readonly string[] = [],
  now = new Date(),
): ActiveGermanComprehensionSession {
  if (!seed.trim() || seed.length > 2_000) throw new Error("German comprehension needs a bounded seed.")
  const excluded = new Set(excludedPromptIds.filter((id) => promptById.has(id)))
  const startIndex = hashSeed(seed) % germanComprehensionPrompts.length
  const prompt = Array.from({ length: germanComprehensionPrompts.length }, (_, offset) => (
    germanComprehensionPrompts[(startIndex + offset) % germanComprehensionPrompts.length]!
  )).find((candidate) => !excluded.has(candidate.id)) ?? germanComprehensionPrompts[startIndex]!
  const timestamp = now.toISOString()
  return {
    schemaVersion: GERMAN_COMPREHENSION_SCHEMA_VERSION,
    kind: "german-comprehension-session",
    id: `german-comprehension:${seed}`,
    seed,
    generatorVersion: GERMAN_COMPREHENSION_GENERATOR_VERSION,
    promptId: prompt.id,
    startedAt: timestamp,
    updatedAt: timestamp,
    response: "",
    evidenceLines: [],
  }
}

export function updateGermanComprehensionSession(
  session: ActiveGermanComprehensionSession,
  response: string,
  evidenceLines: readonly number[],
  now = new Date(),
): ActiveGermanComprehensionSession {
  const normalizedLines = [...new Set(evidenceLines)].sort((left, right) => left - right).slice(0, 2)
  if (!validEvidenceLines(session.promptId, normalizedLines)) return session
  return {
    ...session,
    response: response.slice(0, GERMAN_COMPREHENSION_RESPONSE_MAX_LENGTH),
    evidenceLines: normalizedLines,
    updatedAt: nextTimestamp(session.startedAt, session.updatedAt, now),
  }
}

export function germanComprehensionCanSubmit(session: ActiveGermanComprehensionSession): boolean {
  return session.response.trim().length >= GERMAN_COMPREHENSION_RESPONSE_MIN_LENGTH &&
    validEvidenceLines(session.promptId, session.evidenceLines) &&
    session.evidenceLines.length > 0
}

export function submitGermanComprehensionSession(
  session: ActiveGermanComprehensionSession,
  now = new Date(),
): GermanComprehensionResult {
  if (!germanComprehensionCanSubmit(session)) {
    throw new Error("German comprehension needs a complete response and at least one evidence line.")
  }
  const submittedAt = nextTimestamp(session.startedAt, session.updatedAt, now)
  const elapsedSeconds = Math.max(
    1,
    Math.min(3_600, Math.round((Date.parse(submittedAt) - Date.parse(session.startedAt)) / 1_000)),
  )
  return {
    schemaVersion: GERMAN_COMPREHENSION_SCHEMA_VERSION,
    kind: "german-comprehension-result",
    id: `result:${session.id}:${submittedAt}`,
    sessionId: session.id,
    seed: session.seed,
    generatorVersion: session.generatorVersion,
    promptId: session.promptId,
    startedAt: session.startedAt,
    submittedAt,
    elapsedSeconds,
    response: session.response.trim(),
    evidenceLines: [...session.evidenceLines],
  }
}

export function createGermanComprehensionReview(
  result: GermanComprehensionResult,
  evidenceStatus: GermanComprehensionEvidenceStatus,
  strength: string,
  nextStep: string,
  now = new Date(),
): GermanComprehensionReview | undefined {
  const reviewedAt = new Date(Math.max(now.getTime(), Date.parse(result.submittedAt))).toISOString()
  if (!evidenceStatuses.has(evidenceStatus) ||
    !isBoundedString(strength, 2, 300) ||
    !isBoundedString(nextStep, 2, 300)) return undefined
  return {
    schemaVersion: GERMAN_COMPREHENSION_SCHEMA_VERSION,
    kind: "german-comprehension-review",
    id: `german-comprehension-review:${result.id}`,
    resultId: result.id,
    evidenceStatus,
    strength: strength.trim(),
    nextStep: nextStep.trim(),
    reviewedAt,
  }
}

export function resolveGermanComprehensionReview(
  review: GermanComprehensionReview,
  now = new Date(),
): GermanComprehensionReview {
  if (review.resolvedAt) return { ...review }
  return {
    ...review,
    resolvedAt: new Date(Math.max(now.getTime(), Date.parse(review.reviewedAt))).toISOString(),
  }
}

export function cloneActiveGermanComprehensionSession(
  session: ActiveGermanComprehensionSession,
): ActiveGermanComprehensionSession {
  return { ...session, evidenceLines: [...session.evidenceLines] }
}

export function cloneGermanComprehensionResult(
  result: GermanComprehensionResult,
): GermanComprehensionResult {
  return { ...result, evidenceLines: [...result.evidenceLines] }
}

export function cloneGermanComprehensionReview(
  review: GermanComprehensionReview,
): GermanComprehensionReview {
  return { ...review }
}

export function isActiveGermanComprehensionSession(
  value: unknown,
): value is ActiveGermanComprehensionSession {
  if (!isRecord(value) || hasScoringFields(value) ||
    value.schemaVersion !== GERMAN_COMPREHENSION_SCHEMA_VERSION ||
    value.kind !== "german-comprehension-session" ||
    !isBoundedString(value.seed, 1, 2_000) ||
    value.id !== `german-comprehension:${value.seed}` ||
    value.generatorVersion !== GERMAN_COMPREHENSION_GENERATOR_VERSION ||
    typeof value.promptId !== "string" || !promptById.has(value.promptId) ||
    !isDateString(value.startedAt) || !isDateString(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.startedAt) ||
    typeof value.response !== "string" || value.response.length > GERMAN_COMPREHENSION_RESPONSE_MAX_LENGTH ||
    !validEvidenceLines(value.promptId, value.evidenceLines)) return false
  return true
}

export function isGermanComprehensionResult(value: unknown): value is GermanComprehensionResult {
  if (!isRecord(value) || hasScoringFields(value) ||
    value.schemaVersion !== GERMAN_COMPREHENSION_SCHEMA_VERSION ||
    value.kind !== "german-comprehension-result" ||
    !isBoundedString(value.seed, 1, 2_000) ||
    value.sessionId !== `german-comprehension:${value.seed}` ||
    value.generatorVersion !== GERMAN_COMPREHENSION_GENERATOR_VERSION ||
    typeof value.promptId !== "string" || !promptById.has(value.promptId) ||
    !isDateString(value.startedAt) || !isDateString(value.submittedAt) ||
    Date.parse(value.submittedAt) < Date.parse(value.startedAt) ||
    value.id !== `result:${value.sessionId}:${value.submittedAt}` ||
    !isBoundedString(
      value.response,
      GERMAN_COMPREHENSION_RESPONSE_MIN_LENGTH,
      GERMAN_COMPREHENSION_RESPONSE_MAX_LENGTH,
    ) ||
    !validEvidenceLines(value.promptId, value.evidenceLines) || value.evidenceLines.length === 0 ||
    value.elapsedSeconds !== Math.max(
      1,
      Math.min(3_600, Math.round((Date.parse(value.submittedAt) - Date.parse(value.startedAt)) / 1_000)),
    )) return false
  return true
}

export function isGermanComprehensionReview(value: unknown): value is GermanComprehensionReview {
  if (!isRecord(value) || hasScoringFields(value) ||
    value.schemaVersion !== GERMAN_COMPREHENSION_SCHEMA_VERSION ||
    value.kind !== "german-comprehension-review" ||
    !isBoundedString(value.resultId, 10, 4_000) ||
    value.id !== `german-comprehension-review:${value.resultId}` ||
    !evidenceStatuses.has(value.evidenceStatus as GermanComprehensionEvidenceStatus) ||
    !isBoundedString(value.strength, 2, 300) ||
    !isBoundedString(value.nextStep, 2, 300) ||
    !isDateString(value.reviewedAt) ||
    (value.resolvedAt !== undefined && (
      !isDateString(value.resolvedAt) || Date.parse(value.resolvedAt) < Date.parse(value.reviewedAt)
    ))) return false
  return true
}
