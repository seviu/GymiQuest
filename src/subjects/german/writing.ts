import { createRandom, pickIndex } from "../../domain/random"

export const GERMAN_WRITING_BLUEPRINT_VERSION = 1 as const
export const GERMAN_WRITING_SESSION_VERSION = 1 as const
export const GERMAN_WRITING_DURATION_SECONDS = 60 * 60
export const GERMAN_WRITING_MAX_DRAFT_LENGTH = 12_000
export const GERMAN_WRITING_MAX_PLAN_LENGTH = 1_000
export const GERMAN_WRITING_MAX_TITLE_LENGTH = 160
export const GERMAN_WRITING_HUMAN_REVIEW_VERSION = 1 as const
export const GERMAN_WRITING_MAX_FEEDBACK_LENGTH = 2_000

export type GermanWritingGenre = "narrative" | "newspaper-report"
export type GermanWritingPromptSlot = "constrained-narrative" | "anchored-narrative" | "report"
export type GermanWritingStage = "choose" | "plan" | "draft" | "review"
export type GermanWritingSubmissionReason = "submitted" | "timeout"

export const germanWritingReviewCheckIds = [
  "task-fulfilled",
  "clear-structure",
  "perspective-and-tense",
  "precise-language",
  "sentence-variety",
  "spelling-and-punctuation",
] as const
export type GermanWritingReviewCheckId = typeof germanWritingReviewCheckIds[number]

export interface GermanWritingPromptTemplate {
  id: string
  slot: GermanWritingPromptSlot
  title: string
  titleMode: "given" | "learner"
  prompt: string
  genre: GermanWritingGenre
  requirements: readonly string[]
  sourceCalibrationYears: readonly [2024, 2025]
  sourceStatus: "newly-authored-training-content"
}

const constrainedNarrativePrompts: readonly GermanWritingPromptTemplate[] = Object.freeze([
  {
    id: "narrative-wrong-package",
    slot: "constrained-narrative",
    title: "Das falsche Paket",
    titleMode: "given",
    prompt: "Erzähle eine Geschichte, in der ein Paket an der falschen Adresse landet und dadurch eine unerwartete Entscheidung ausgelöst wird. Es muss deutlich werden, wie die Verwechslung entsteht und welche Folgen sie hat.",
    genre: "narrative",
    requirements: ["Erzähle im Präteritum.", "Zeige Ursache, Entscheidung und Folge.", "Übernimm den vorgegebenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "narrative-last-seat",
    slot: "constrained-narrative",
    title: "Der letzte freie Platz",
    titleMode: "given",
    prompt: "Erzähle eine Geschichte, in der zwei Personen denselben letzten freien Platz beanspruchen. Der Konflikt soll auf eine Weise enden, mit der am Anfang niemand gerechnet hat.",
    genre: "narrative",
    requirements: ["Erzähle im Präteritum.", "Baue einen klaren Konflikt und eine überraschende Lösung auf.", "Übernimm den vorgegebenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "narrative-detour",
    slot: "constrained-narrative",
    title: "Der Umweg",
    titleMode: "given",
    prompt: "Erzähle eine Geschichte, in der eine Person absichtlich einen vermeintlich schnelleren Weg wählt. Unterwegs geschieht etwas, das ihren ursprünglichen Plan verändert.",
    genre: "narrative",
    requirements: ["Erzähle im Präteritum.", "Mache den ursprünglichen Plan und seine Veränderung deutlich.", "Übernimm den vorgegebenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "narrative-small-courage",
    slot: "constrained-narrative",
    title: "Ein kleiner mutiger Schritt",
    titleMode: "given",
    prompt: "Erzähle eine Geschichte, in der jemand lange zögert und sich dann doch entscheidet, einer anderen Person zu helfen. Zeige, was den Sinneswandel auslöst.",
    genre: "narrative",
    requirements: ["Erzähle im Präteritum.", "Beschreibe Zögern, Auslöser und Handlung.", "Übernimm den vorgegebenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
])

const anchoredNarrativePrompts: readonly GermanWritingPromptTemplate[] = Object.freeze([
  {
    id: "anchor-silence",
    slot: "anchored-narrative",
    title: "Ein passender eigener Titel",
    titleMode: "learner",
    prompt: "Erzähle eine Geschichte, die mit diesem Satz endet: «Erst da verstand ich, warum niemand gelacht hatte.»",
    genre: "narrative",
    requirements: ["Erzähle im Präteritum und in der Ich-Form.", "Der vorgegebene Satz ist der letzte Satz.", "Formuliere einen passenden eigenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "anchor-return",
    slot: "anchored-narrative",
    title: "Ein passender eigener Titel",
    titleMode: "learner",
    prompt: "Beginne deine Geschichte mit diesem Satz: «Als ich den leeren Umschlag öffnete, wusste ich sofort, dass ich zurückgehen musste.» Erzähle, was davor verborgen geblieben war und was danach geschieht.",
    genre: "narrative",
    requirements: ["Erzähle im Präteritum und in der Ich-Form.", "Verwende den vorgegebenen Satz als Anfang.", "Formuliere einen passenden eigenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "anchor-place-name",
    slot: "anchored-narrative",
    title: "Ein passender eigener Titel",
    titleMode: "learner",
    prompt: "Wähle einen der Ortsnamen Nebelried, Glanzbach oder Stolperwil. Erzähle eine Geschichte darüber, wie dieser Ort zu seinem Namen gekommen sein könnte.",
    genre: "narrative",
    requirements: ["Die Geschichte muss den gewählten Ortsnamen nachvollziehbar erklären.", "Erzähle in einer einheitlichen Zeitform.", "Formuliere einen passenden eigenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "anchor-old-ticket",
    slot: "anchored-narrative",
    title: "Die alte Fahrkarte",
    titleMode: "given",
    prompt: "Erzähle eine Geschichte, in der eine alte Fahrkarte eine Erinnerung auslöst und die erzählende Person dazu bringt, noch am selben Tag etwas zu unternehmen.",
    genre: "narrative",
    requirements: ["Erzähle im Präteritum und in der Ich-Form.", "Verbinde Erinnerung und anschliessende Handlung klar.", "Übernimm den vorgegebenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
])

const reportPrompts: readonly GermanWritingPromptTemplate[] = Object.freeze([
  {
    id: "report-library-night",
    slot: "report",
    title: "Eine Nacht in der neuen Quartierbibliothek",
    titleMode: "given",
    prompt: "Eine Quartierbibliothek öffnet erstmals bis Mitternacht. Berichte für eine Zeitung von der Eröffnung, den angebotenen Aktivitäten und den Reaktionen der Besucherinnen und Besucher.",
    genre: "newspaper-report",
    requirements: ["Berichte nicht in der Ich-Form.", "Baue mindestens zwei unterschiedliche Stimmen ein.", "Übernimm den vorgegebenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "report-bicycle-ribbons",
    slot: "report",
    title: "Bunte Bänder an den Velos",
    titleMode: "given",
    prompt: "Über Nacht sind im ganzen Quartier bunte Bänder an zahlreichen Velos aufgetaucht. Berichte für eine Zeitung, wie die Menschen darauf reagieren und welche Erklärungen sie für das Phänomen haben.",
    genre: "newspaper-report",
    requirements: ["Berichte nicht in der Ich-Form.", "Baue zwei bis drei unterschiedliche Erklärungsversuche ein.", "Übernimm den vorgegebenen Titel."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "report-school-garden",
    slot: "report",
    title: "Der neue Schulgarten ist eröffnet",
    titleMode: "given",
    prompt: "Eine Schule eröffnet einen Garten, den Klassen und Nachbarschaft gemeinsam nutzen dürfen. Berichte für eine Zeitung von der Feier und davon, welche Möglichkeiten der Garten bietet.",
    genre: "newspaper-report",
    requirements: ["Berichte nicht in der Ich-Form.", "Beschreibe Eröffnungsfeier und künftige Nutzung.", "Baue mindestens zwei Stimmen ein."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
  {
    id: "report-dark-hour",
    slot: "report",
    title: "Eine Stunde ohne Strom",
    titleMode: "given",
    prompt: "In einem Dorf fällt während einer Veranstaltung für genau eine Stunde der Strom aus. Berichte für eine Zeitung über den Ablauf, die Reaktionen der Anwesenden und die vermutete Ursache.",
    genre: "newspaper-report",
    requirements: ["Berichte nicht in der Ich-Form.", "Ordne die Ereignisse zeitlich klar.", "Baue unterschiedliche Stimmen oder Vermutungen ein."],
    sourceCalibrationYears: [2024, 2025],
    sourceStatus: "newly-authored-training-content",
  },
])

export const germanWritingPromptCatalog: readonly GermanWritingPromptTemplate[] = Object.freeze([
  ...constrainedNarrativePrompts,
  ...anchoredNarrativePrompts,
  ...reportPrompts,
])

export interface GermanWritingForm {
  version: typeof GERMAN_WRITING_BLUEPRINT_VERSION
  seed: string
  prompts: readonly [GermanWritingPromptTemplate, GermanWritingPromptTemplate, GermanWritingPromptTemplate]
}

export function buildGermanWritingForm(seed: string): GermanWritingForm {
  return {
    version: GERMAN_WRITING_BLUEPRINT_VERSION,
    seed,
    prompts: [
      constrainedNarrativePrompts[pickIndex(createRandom(`${seed}:constrained`), constrainedNarrativePrompts.length)]!,
      anchoredNarrativePrompts[pickIndex(createRandom(`${seed}:anchored`), anchoredNarrativePrompts.length)]!,
      reportPrompts[pickIndex(createRandom(`${seed}:report`), reportPrompts.length)]!,
    ],
  }
}

export interface GermanWritingPlan {
  opening: string
  development: string
  ending: string
}

export interface ActiveGermanWritingSession {
  schemaVersion: typeof GERMAN_WRITING_SESSION_VERSION
  id: string
  blueprintVersion: typeof GERMAN_WRITING_BLUEPRINT_VERSION
  seed: string
  startedAt: string
  updatedAt: string
  durationSeconds: typeof GERMAN_WRITING_DURATION_SECONDS
  stage: GermanWritingStage
  selectedPromptId?: string
  title: string
  plan: GermanWritingPlan
  draft: string
  reviewChecks: GermanWritingReviewCheckId[]
}

export interface GermanWritingResult {
  schemaVersion: typeof GERMAN_WRITING_SESSION_VERSION
  id: string
  sessionId: string
  blueprintVersion: typeof GERMAN_WRITING_BLUEPRINT_VERSION
  seed: string
  promptId?: string
  startedAt: string
  submittedAt: string
  durationSeconds: number
  submissionReason: GermanWritingSubmissionReason
  title: string
  plan: GermanWritingPlan
  draft: string
  reviewChecks: GermanWritingReviewCheckId[]
  wordCount: number
  reviewStatus: "self-reviewed-awaiting-human-feedback"
}

export interface GermanWritingHumanReview {
  schemaVersion: typeof GERMAN_WRITING_HUMAN_REVIEW_VERSION
  resultId: string
  reviewedAt: string
  strength: string
  nextStep: string
}

function iso(now: Date): string {
  return now.toISOString()
}

function monotonicWritingUpdate(
  session: ActiveGermanWritingSession,
  now: Date,
): string {
  return iso(new Date(Math.max(
    Date.parse(session.startedAt),
    Date.parse(session.updatedAt),
    now.getTime(),
  )))
}

export function cloneActiveGermanWritingSession(
  session: ActiveGermanWritingSession,
): ActiveGermanWritingSession {
  return {
    ...session,
    plan: { ...session.plan },
    reviewChecks: [...session.reviewChecks],
  }
}

export function cloneGermanWritingResult(result: GermanWritingResult): GermanWritingResult {
  return {
    ...result,
    plan: { ...result.plan },
    reviewChecks: [...result.reviewChecks],
  }
}

export function cloneGermanWritingHumanReview(
  review: GermanWritingHumanReview,
): GermanWritingHumanReview {
  return { ...review }
}

export function createGermanWritingHumanReview(
  resultId: string,
  strength: string,
  nextStep: string,
  now = new Date(),
): GermanWritingHumanReview | undefined {
  const normalizedStrength = strength.trim()
  const normalizedNextStep = nextStep.trim()
  if (
    !resultId ||
    resultId.length > 2_500 ||
    !normalizedStrength ||
    normalizedStrength.length > GERMAN_WRITING_MAX_FEEDBACK_LENGTH ||
    !normalizedNextStep ||
    normalizedNextStep.length > GERMAN_WRITING_MAX_FEEDBACK_LENGTH
  ) return undefined
  return {
    schemaVersion: GERMAN_WRITING_HUMAN_REVIEW_VERSION,
    resultId,
    reviewedAt: iso(now),
    strength: normalizedStrength,
    nextStep: normalizedNextStep,
  }
}

export function createActiveGermanWritingSession(
  seed: string,
  now = new Date(),
): ActiveGermanWritingSession {
  const timestamp = iso(now)
  return {
    schemaVersion: GERMAN_WRITING_SESSION_VERSION,
    id: `german-writing:${GERMAN_WRITING_BLUEPRINT_VERSION}:${seed}`,
    blueprintVersion: GERMAN_WRITING_BLUEPRINT_VERSION,
    seed,
    startedAt: timestamp,
    updatedAt: timestamp,
    durationSeconds: GERMAN_WRITING_DURATION_SECONDS,
    stage: "choose",
    title: "",
    plan: { opening: "", development: "", ending: "" },
    draft: "",
    reviewChecks: [],
  }
}

export function chooseGermanWritingPrompt(
  session: ActiveGermanWritingSession,
  promptId: string,
  now = new Date(),
): ActiveGermanWritingSession {
  const prompt = buildGermanWritingForm(session.seed).prompts.find((candidate) => candidate.id === promptId)
  if (!prompt) return session
  return {
    ...cloneActiveGermanWritingSession(session),
    selectedPromptId: promptId,
    title: prompt.titleMode === "learner" ? "" : prompt.title,
    stage: "plan",
    updatedAt: monotonicWritingUpdate(session, now),
  }
}

export function updateGermanWritingPlan(
  session: ActiveGermanWritingSession,
  field: keyof GermanWritingPlan,
  value: string,
  now = new Date(),
): ActiveGermanWritingSession {
  if (value.length > GERMAN_WRITING_MAX_PLAN_LENGTH) return session
  return {
    ...cloneActiveGermanWritingSession(session),
    plan: { ...session.plan, [field]: value },
    updatedAt: monotonicWritingUpdate(session, now),
  }
}

export function updateGermanWritingTitle(
  session: ActiveGermanWritingSession,
  title: string,
  now = new Date(),
): ActiveGermanWritingSession {
  if (title.length > GERMAN_WRITING_MAX_TITLE_LENGTH) return session
  return { ...cloneActiveGermanWritingSession(session), title, updatedAt: monotonicWritingUpdate(session, now) }
}

export function updateGermanWritingDraft(
  session: ActiveGermanWritingSession,
  draft: string,
  now = new Date(),
): ActiveGermanWritingSession {
  if (draft.length > GERMAN_WRITING_MAX_DRAFT_LENGTH) return session
  return { ...cloneActiveGermanWritingSession(session), draft, updatedAt: monotonicWritingUpdate(session, now) }
}

export function toggleGermanWritingReviewCheck(
  session: ActiveGermanWritingSession,
  checkId: GermanWritingReviewCheckId,
  now = new Date(),
): ActiveGermanWritingSession {
  if (!germanWritingReviewCheckIds.includes(checkId)) return session
  const selected = new Set(session.reviewChecks)
  if (selected.has(checkId)) selected.delete(checkId)
  else selected.add(checkId)
  return {
    ...cloneActiveGermanWritingSession(session),
    reviewChecks: germanWritingReviewCheckIds.filter((candidate) => selected.has(candidate)),
    updatedAt: monotonicWritingUpdate(session, now),
  }
}

export function navigateGermanWritingStage(
  session: ActiveGermanWritingSession,
  stage: GermanWritingStage,
  now = new Date(),
): ActiveGermanWritingSession {
  if (stage !== "choose" && !session.selectedPromptId) return session
  if (stage === "review" && !session.draft.trim()) return session
  return { ...cloneActiveGermanWritingSession(session), stage, updatedAt: monotonicWritingUpdate(session, now) }
}

export function germanWritingWordCount(value: string): number {
  return value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0
}

export function remainingGermanWritingSeconds(
  session: ActiveGermanWritingSession,
  now = new Date(),
): number {
  const elapsed = Math.max(0, Math.floor((now.getTime() - Date.parse(session.startedAt)) / 1_000))
  return Math.max(0, session.durationSeconds - elapsed)
}

export function germanWritingExpired(
  session: ActiveGermanWritingSession,
  now = new Date(),
): boolean {
  return remainingGermanWritingSeconds(session, now) === 0
}

export function submitGermanWritingSession(
  session: ActiveGermanWritingSession,
  submissionReason: GermanWritingSubmissionReason,
  now = new Date(),
): GermanWritingResult {
  const submittedAt = iso(now)
  const elapsed = Math.max(0, Math.floor((now.getTime() - Date.parse(session.startedAt)) / 1_000))
  const deadlineReached = elapsed >= session.durationSeconds
  const resolvedSubmissionReason: GermanWritingSubmissionReason = deadlineReached
    ? "timeout"
    : submissionReason === "timeout"
      ? "submitted"
      : submissionReason
  return {
    schemaVersion: GERMAN_WRITING_SESSION_VERSION,
    id: `german-writing-result:${session.id}:${submittedAt}`,
    sessionId: session.id,
    blueprintVersion: session.blueprintVersion,
    seed: session.seed,
    ...(session.selectedPromptId ? { promptId: session.selectedPromptId } : {}),
    startedAt: session.startedAt,
    submittedAt,
    durationSeconds: Math.min(session.durationSeconds, elapsed),
    submissionReason: resolvedSubmissionReason,
    title: session.title,
    plan: { ...session.plan },
    draft: session.draft,
    reviewChecks: [...session.reviewChecks],
    wordCount: germanWritingWordCount(session.draft),
    reviewStatus: "self-reviewed-awaiting-human-feedback",
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value))
}

function isBoundedString(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum
}

function isWritingPlan(value: unknown): value is GermanWritingPlan {
  return isRecord(value) &&
    isBoundedString(value.opening, GERMAN_WRITING_MAX_PLAN_LENGTH) &&
    isBoundedString(value.development, GERMAN_WRITING_MAX_PLAN_LENGTH) &&
    isBoundedString(value.ending, GERMAN_WRITING_MAX_PLAN_LENGTH)
}

function isReviewChecks(value: unknown): value is GermanWritingReviewCheckId[] {
  return Array.isArray(value) &&
    value.length <= germanWritingReviewCheckIds.length &&
    value.every((checkId) => (
      typeof checkId === "string" && germanWritingReviewCheckIds.includes(checkId as GermanWritingReviewCheckId)
    )) &&
    new Set(value).size === value.length
}

export function isActiveGermanWritingSession(value: unknown): value is ActiveGermanWritingSession {
  if (!isRecord(value) ||
    value.schemaVersion !== GERMAN_WRITING_SESSION_VERSION ||
    value.blueprintVersion !== GERMAN_WRITING_BLUEPRINT_VERSION ||
    typeof value.seed !== "string" || value.seed.length === 0 || value.seed.length > 2_000 ||
    value.id !== `german-writing:${GERMAN_WRITING_BLUEPRINT_VERSION}:${value.seed}` ||
    !isDate(value.startedAt) ||
    !isDate(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.startedAt) ||
    value.durationSeconds !== GERMAN_WRITING_DURATION_SECONDS ||
    (value.stage !== "choose" && value.stage !== "plan" && value.stage !== "draft" && value.stage !== "review") ||
    !isBoundedString(value.title, GERMAN_WRITING_MAX_TITLE_LENGTH) ||
    !isWritingPlan(value.plan) ||
    !isBoundedString(value.draft, GERMAN_WRITING_MAX_DRAFT_LENGTH) ||
    !isReviewChecks(value.reviewChecks)
  ) return false
  const formPromptIds = new Set(buildGermanWritingForm(value.seed).prompts.map((prompt) => prompt.id))
  return value.selectedPromptId === undefined
    ? value.stage === "choose" &&
      value.title === "" &&
      value.plan.opening === "" &&
      value.plan.development === "" &&
      value.plan.ending === "" &&
      value.draft === "" &&
      value.reviewChecks.length === 0
    : typeof value.selectedPromptId === "string" && formPromptIds.has(value.selectedPromptId)
}

export function isGermanWritingResult(value: unknown): value is GermanWritingResult {
  if (!isRecord(value) ||
    value.schemaVersion !== GERMAN_WRITING_SESSION_VERSION ||
    value.blueprintVersion !== GERMAN_WRITING_BLUEPRINT_VERSION ||
    typeof value.seed !== "string" || value.seed.length === 0 || value.seed.length > 2_000 ||
    value.sessionId !== `german-writing:${GERMAN_WRITING_BLUEPRINT_VERSION}:${value.seed}` ||
    !isDate(value.startedAt) ||
    !isDate(value.submittedAt) ||
    Date.parse(value.submittedAt) < Date.parse(value.startedAt) ||
    value.id !== `german-writing-result:${value.sessionId}:${value.submittedAt}` ||
    typeof value.durationSeconds !== "number" || !Number.isInteger(value.durationSeconds) ||
    value.durationSeconds < 0 || value.durationSeconds > GERMAN_WRITING_DURATION_SECONDS ||
    (value.submissionReason !== "submitted" && value.submissionReason !== "timeout") ||
    !isBoundedString(value.title, GERMAN_WRITING_MAX_TITLE_LENGTH) ||
    !isWritingPlan(value.plan) ||
    !isBoundedString(value.draft, GERMAN_WRITING_MAX_DRAFT_LENGTH) ||
    !isReviewChecks(value.reviewChecks) ||
    value.wordCount !== germanWritingWordCount(value.draft as string) ||
    value.reviewStatus !== "self-reviewed-awaiting-human-feedback"
  ) return false
  const elapsed = Math.floor((Date.parse(value.submittedAt as string) - Date.parse(value.startedAt as string)) / 1_000)
  if (value.durationSeconds !== Math.min(GERMAN_WRITING_DURATION_SECONDS, elapsed)) return false
  const promptIds = new Set(buildGermanWritingForm(value.seed).prompts.map((prompt) => prompt.id))
  // Version-one results created near the deadline retain their stored label for replay.
  // New submissions normalize the label above, but validation must not invalidate an
  // already persisted result because a submit click and the one-second timeout tick raced.
  return value.promptId === undefined
    ? value.title === "" &&
      value.plan.opening === "" &&
      value.plan.development === "" &&
      value.plan.ending === "" &&
      value.draft === "" &&
      value.reviewChecks.length === 0 &&
      value.wordCount === 0
    : typeof value.promptId === "string" && promptIds.has(value.promptId)
}

export function isGermanWritingHumanReview(value: unknown): value is GermanWritingHumanReview {
  return isRecord(value) &&
    value.schemaVersion === GERMAN_WRITING_HUMAN_REVIEW_VERSION &&
    isBoundedString(value.resultId, 2_500) &&
    value.resultId.trim().length > 0 &&
    isDate(value.reviewedAt) &&
    isBoundedString(value.strength, GERMAN_WRITING_MAX_FEEDBACK_LENGTH) &&
    value.strength.trim().length > 0 &&
    isBoundedString(value.nextStep, GERMAN_WRITING_MAX_FEEDBACK_LENGTH) &&
    value.nextStep.trim().length > 0
}

function collectGermanWritingAuthorValidationIssues(): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const prompt of germanWritingPromptCatalog) {
    if (!prompt.id.trim() || ids.has(prompt.id)) issues.push(`invalid writing prompt id: ${prompt.id}`)
    ids.add(prompt.id)
    if (!prompt.title.trim()) issues.push(`${prompt.id}: title is empty`)
    if (prompt.titleMode !== "given" && prompt.titleMode !== "learner") {
      issues.push(`${prompt.id}: title mode is invalid`)
    }
    if (!prompt.prompt.trim()) issues.push(`${prompt.id}: prompt is empty`)
    if (prompt.requirements.length < 3 || prompt.requirements.some((requirement) => !requirement.trim())) {
      issues.push(`${prompt.id}: requirements are incomplete`)
    }
    if (prompt.sourceStatus !== "newly-authored-training-content") {
      issues.push(`${prompt.id}: source status is not bounded`)
    }
  }
  for (const slot of ["constrained-narrative", "anchored-narrative", "report"] as const) {
    const prompts = germanWritingPromptCatalog.filter((prompt) => prompt.slot === slot)
    if (prompts.length !== 4) issues.push(`${slot}: expected four prompts`)
    if (slot === "report" && prompts.some((prompt) => prompt.genre !== "newspaper-report")) {
      issues.push(`${slot}: non-report prompt found`)
    }
  }
  return issues
}

export const germanWritingAuthorValidationIssues: readonly string[] = Object.freeze(
  collectGermanWritingAuthorValidationIssues(),
)
