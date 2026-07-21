import { isSecureAssessmentResult } from "./assessmentReport"
import {
  topicIds,
  type LearningLocale,
  type LearnerState,
  type LearningEvent,
  type LearningTask,
  type TopicId,
} from "./model"

export type DailyQuestGoalId = "round" | "questions" | "active-time"

export interface DailyQuestGoal {
  id: DailyQuestGoalId
  title: string
  description: string
  current: number
  target: number
  unit: "rounds" | "questions" | "seconds"
  complete: boolean
}

export interface DailyQuest {
  dateKey: string
  isRestDay: boolean
  completedGoals: number
  goals: DailyQuestGoal[]
}

export type AchievementId =
  | "first-round"
  | "independent-ten"
  | "self-correction"
  | "five-reviews"
  | "first-assessment"
  | "first-mock"
  | "five-topics"
  | "course-complete"

export interface AchievementProgress {
  id: AchievementId
  icon: string
  title: string
  description: string
  current: number
  target: number
  unlocked: boolean
  unlockedAt?: string
}

export type ExpeditionCollectibleId =
  | "route-map"
  | "compass"
  | "notebook"
  | "lantern"
  | "climbing-rope"
  | "telescope"
  | "summit-flag"
  | "star-map"

export interface ExpeditionCollectible {
  id: ExpeditionCollectibleId
  icon: string
  title: string
  description: string
  xpRequired: number
  currentXp: number
  unlocked: boolean
}

export type ExpeditionChapterId =
  | "base-camp"
  | "detour"
  | "own-trail"
  | "first-ridge"
  | "return-path"
  | "viewpoint"
  | "exam-pass"
  | "summit"

export interface ExpeditionChapter {
  id: ExpeditionChapterId
  achievementId: AchievementId
  index: number
  title: string
  description: string
  evidence: string
  current: number
  target: number
  unlocked: boolean
  unlockedAt?: string
}

export interface ExpeditionCollection {
  totalXp: number
  collectibles: ExpeditionCollectible[]
  unlockedCollectibles: number
  nextCollectible?: ExpeditionCollectible
  xpToNext: number
  chapters: ExpeditionChapter[]
  unlockedChapters: number
}

export type CheckpointTrailStepStatus = "pending" | "paused" | "complete"

export interface CheckpointTrailStep {
  topicId: TopicId
  status: CheckpointTrailStepStatus
  reviewDueAt?: string
  completedAt?: string
}

export interface CheckpointTrail {
  assessmentNumber: number
  assessmentCompletedAt: string
  assessedTopics: number
  secureTopics: number
  recoveryTopics: number
  completedRecoveryTopics: number
  pausedRecoveryTopics: number
  steps: CheckpointTrailStep[]
  complete: boolean
}

const expeditionCollectibleDefinitions: readonly Omit<
  ExpeditionCollectible,
  "currentXp" | "unlocked"
>[] = [
  {
    id: "route-map",
    icon: "⌁",
    title: "Routenkarte",
    description: "Dein Lernpfad ist offen. Jede echte Runde zeichnet ihn weiter.",
    xpRequired: 0,
  },
  {
    id: "compass",
    icon: "◎",
    title: "Kompass",
    description: "Hilft dir, nach einem Fehler den nächsten guten Schritt zu finden.",
    xpRequired: 30,
  },
  {
    id: "notebook",
    icon: "▤",
    title: "Forschungsbuch",
    description: "Sammelt Ideen, die du schon mit neuen Zahlen angewendet hast.",
    xpRequired: 90,
  },
  {
    id: "lantern",
    icon: "✦",
    title: "Denklaterne",
    description: "Leuchtet bei Aufgaben, deren Weg nicht sofort sichtbar ist.",
    xpRequired: 180,
  },
  {
    id: "climbing-rope",
    icon: "∞",
    title: "Kletterseil",
    description: "Erinnert daran, schwierige Ideen in sichere Schritte zu zerlegen.",
    xpRequired: 300,
  },
  {
    id: "telescope",
    icon: "◉",
    title: "Fernrohr",
    description: "Macht sichtbar, welche Themen als Nächstes zurückkehren.",
    xpRequired: 480,
  },
  {
    id: "summit-flag",
    icon: "⚑",
    title: "Gipfelfahne",
    description: "Steht für einen langen Weg aus Lektionen, Reviews und Checks.",
    xpRequired: 720,
  },
  {
    id: "star-map",
    icon: "✧",
    title: "Sternkarte",
    description: "Begleitet die fortlaufende Festigung, wenn nur noch Reviews warten.",
    xpRequired: 1_000,
  },
]

const englishCollectibleCopy: Record<
  ExpeditionCollectibleId,
  Pick<ExpeditionCollectible, "title" | "description">
> = {
  "route-map": {
    title: "Route map",
    description: "Your learning path is open. Every real round draws it further.",
  },
  compass: {
    title: "Compass",
    description: "Helps you find the next useful step after a mistake.",
  },
  notebook: {
    title: "Research notebook",
    description: "Collects ideas that you have already applied with new values.",
  },
  lantern: {
    title: "Thinking lantern",
    description: "Lights up exercises whose path is not immediately visible.",
  },
  "climbing-rope": {
    title: "Climbing rope",
    description: "Reminds you to break difficult ideas into secure steps.",
  },
  telescope: {
    title: "Telescope",
    description: "Shows which topics will return next.",
  },
  "summit-flag": {
    title: "Summit flag",
    description: "Represents a long path of lessons, reviews, and assessments.",
  },
  "star-map": {
    title: "Star map",
    description: "Accompanies ongoing consolidation once only reviews remain.",
  },
}

const italianCollectibleCopy: Record<
  ExpeditionCollectibleId,
  Pick<ExpeditionCollectible, "title" | "description">
> = {
  "route-map": {
    title: "Mappa del percorso",
    description: "Il tuo percorso di studio è aperto. Ogni vero giro lo disegna un po' di più.",
  },
  compass: {
    title: "Bussola",
    description: "Ti aiuta a trovare il prossimo passo utile dopo un errore.",
  },
  notebook: {
    title: "Quaderno di ricerca",
    description: "Raccoglie le idee che hai già applicato con valori nuovi.",
  },
  lantern: {
    title: "Lanterna del pensiero",
    description: "Illumina gli esercizi in cui il percorso non è subito visibile.",
  },
  "climbing-rope": {
    title: "Corda da arrampicata",
    description: "Ti ricorda di dividere le idee difficili in passaggi sicuri.",
  },
  telescope: {
    title: "Telescopio",
    description: "Mostra quali argomenti torneranno prossimamente.",
  },
  "summit-flag": {
    title: "Bandiera della vetta",
    description: "Rappresenta un lungo percorso di lezioni, ripassi e verifiche.",
  },
  "star-map": {
    title: "Mappa stellare",
    description: "Accompagna il consolidamento continuo quando rimangono soltanto ripassi.",
  },
}

const spanishCollectibleCopy: Record<
  ExpeditionCollectibleId,
  Pick<ExpeditionCollectible, "title" | "description">
> = {
  "route-map": {
    title: "Mapa de ruta",
    description: "Tu camino de aprendizaje está abierto. Cada sesión real lo dibuja un poco más.",
  },
  compass: {
    title: "Brújula",
    description: "Te ayuda a encontrar el siguiente paso útil después de un error.",
  },
  notebook: {
    title: "Cuaderno de investigación",
    description: "Recoge ideas que ya has aplicado con valores nuevos.",
  },
  lantern: {
    title: "Linterna del pensamiento",
    description: "Ilumina ejercicios cuyo camino no se ve de inmediato.",
  },
  "climbing-rope": {
    title: "Cuerda de escalada",
    description: "Te recuerda que debes dividir las ideas difíciles en pasos seguros.",
  },
  telescope: {
    title: "Telescopio",
    description: "Muestra qué temas volverán próximamente.",
  },
  "summit-flag": {
    title: "Bandera de la cumbre",
    description: "Representa un largo camino de lecciones, repasos y evaluaciones.",
  },
  "star-map": {
    title: "Mapa estelar",
    description: "Acompaña la consolidación continua cuando solo quedan repasos.",
  },
}

const expeditionChapterDefinitions: readonly Omit<
  ExpeditionChapter,
  "current" | "target" | "unlocked" | "unlockedAt"
>[] = [
  {
    id: "base-camp",
    achievementId: "first-round",
    index: 1,
    title: "Das Basislager",
    description: "Du hast nicht nur geplant, sondern eine vollständige Lernrunde beendet.",
    evidence: "Erste Lernrunde",
  },
  {
    id: "detour",
    achievementId: "self-correction",
    index: 2,
    title: "Die erste Umleitung",
    description: "Ein falscher Weg war kein Ende: Du hast korrigiert und weitergedacht.",
    evidence: "Eigene Korrektur",
  },
  {
    id: "own-trail",
    achievementId: "independent-ten",
    index: 3,
    title: "Die eigene Spur",
    description: "Zehn Aufgaben hast du ohne Hilfe bis zur richtigen Antwort gebracht.",
    evidence: "10 selbständige Aufgaben",
  },
  {
    id: "first-ridge",
    achievementId: "five-topics",
    index: 4,
    title: "Der erste Höhenzug",
    description: "Fünf Themen sind gelernt und für spätere Wiederholungen geöffnet.",
    evidence: "5 gelernte Themen",
  },
  {
    id: "return-path",
    achievementId: "five-reviews",
    index: 5,
    title: "Der Rückweg mit Aussicht",
    description: "Du bist fünfmal zu älterem Wissen zurückgekehrt, damit es abrufbar bleibt.",
    evidence: "5 Reviews",
  },
  {
    id: "viewpoint",
    achievementId: "first-assessment",
    index: 6,
    title: "Der Standortpunkt",
    description: "Eine gemischte Standortbestimmung hat den nächsten Trainingsweg gezeigt.",
    evidence: "Erste Standortbestimmung",
  },
  {
    id: "exam-pass",
    achievementId: "first-mock",
    index: 7,
    title: "Der Prüfungspass",
    description: "Du hast eine ganze Probeprüfung unter echten Zeitregeln abgegeben.",
    evidence: "Erste Probeprüfung",
  },
  {
    id: "summit",
    achievementId: "course-complete",
    index: 8,
    title: "Der Gipfelweg",
    description: "Alle Themen sind gelernt. Reviews und Checks halten den Weg jetzt offen.",
    evidence: "Alle Themen gelernt",
  },
]

const englishChapterCopy: Record<
  ExpeditionChapterId,
  Pick<ExpeditionChapter, "title" | "description" | "evidence">
> = {
  "base-camp": {
    title: "Base camp",
    description: "You did more than plan: you completed a full learning round.",
    evidence: "First learning round",
  },
  detour: {
    title: "The first detour",
    description: "A wrong turn was not the end: you corrected it and kept thinking.",
    evidence: "Own correction",
  },
  "own-trail": {
    title: "Your own trail",
    description: "You brought ten questions to the correct answer without help.",
    evidence: "10 independent questions",
  },
  "first-ridge": {
    title: "The first ridge",
    description: "Five topics are learned and open for later reviews.",
    evidence: "5 learned topics",
  },
  "return-path": {
    title: "The return path",
    description: "You returned to older knowledge five times so it stays ready.",
    evidence: "5 reviews",
  },
  viewpoint: {
    title: "The viewpoint",
    description: "A mixed assessment showed the next training route.",
    evidence: "First assessment",
  },
  "exam-pass": {
    title: "The exam pass",
    description: "You submitted a complete mock exam under real timing rules.",
    evidence: "First mock exam",
  },
  summit: {
    title: "The summit path",
    description: "All topics are learned. Reviews and assessments now keep the route open.",
    evidence: "All topics learned",
  },
}

const italianChapterCopy: Record<
  ExpeditionChapterId,
  Pick<ExpeditionChapter, "title" | "description" | "evidence">
> = {
  "base-camp": {
    title: "Campo base",
    description: "Non hai soltanto pianificato: hai completato un intero giro di studio.",
    evidence: "Primo giro di studio",
  },
  detour: {
    title: "La prima deviazione",
    description: "Una strada sbagliata non era la fine: hai corretto e continuato a pensare.",
    evidence: "Correzione autonoma",
  },
  "own-trail": {
    title: "Il tuo sentiero",
    description: "Hai portato dieci domande alla risposta corretta senza aiuto.",
    evidence: "10 domande autonome",
  },
  "first-ridge": {
    title: "La prima cresta",
    description: "Cinque argomenti sono stati appresi e sono aperti per ripassi successivi.",
    evidence: "5 argomenti appresi",
  },
  "return-path": {
    title: "Il sentiero di ritorno",
    description: "Sei tornato cinque volte su conoscenze precedenti perché restino disponibili.",
    evidence: "5 ripassi",
  },
  viewpoint: {
    title: "Il punto panoramico",
    description: "Una verifica mista ha mostrato il prossimo percorso di allenamento.",
    evidence: "Prima verifica",
  },
  "exam-pass": {
    title: "Il passo dell'esame",
    description: "Hai consegnato una simulazione completa con vere regole di tempo.",
    evidence: "Prima simulazione",
  },
  summit: {
    title: "Il sentiero della vetta",
    description: "Tutti gli argomenti sono stati appresi. Ripassi e verifiche tengono ora aperto il percorso.",
    evidence: "Tutti gli argomenti appresi",
  },
}

const spanishChapterCopy: Record<
  ExpeditionChapterId,
  Pick<ExpeditionChapter, "title" | "description" | "evidence">
> = {
  "base-camp": {
    title: "Campamento base",
    description: "No solo hiciste un plan: completaste una sesión de aprendizaje entera.",
    evidence: "Primera sesión de aprendizaje",
  },
  detour: {
    title: "El primer desvío",
    description: "Un camino equivocado no fue el final: lo corregiste y seguiste pensando.",
    evidence: "Corrección propia",
  },
  "own-trail": {
    title: "Tu propio sendero",
    description: "Llevaste diez preguntas hasta la respuesta correcta sin ayuda.",
    evidence: "10 preguntas autónomas",
  },
  "first-ridge": {
    title: "La primera cresta",
    description: "Cinco temas están aprendidos y abiertos para repasos posteriores.",
    evidence: "5 temas aprendidos",
  },
  "return-path": {
    title: "El camino de vuelta",
    description: "Volviste cinco veces a conocimientos anteriores para mantenerlos disponibles.",
    evidence: "5 repasos",
  },
  viewpoint: {
    title: "El mirador",
    description: "Una evaluación mixta mostró la siguiente ruta de entrenamiento.",
    evidence: "Primera evaluación",
  },
  "exam-pass": {
    title: "El paso del examen",
    description: "Entregaste un simulacro completo con reglas reales de tiempo.",
    evidence: "Primer simulacro",
  },
  summit: {
    title: "El camino a la cumbre",
    description: "Todos los temas están aprendidos. Los repasos y las evaluaciones mantienen ahora abierta la ruta.",
    evidence: "Todos los temas aprendidos",
  },
}

function engagementText(
  locale: LearningLocale,
  german: string,
  english: string,
  italian: string,
  spanish: string,
): string {
  return locale === "en" ? english : locale === "it" ? italian : locale === "es" ? spanish : german
}

const PRACTICE_SECONDS_PER_QUESTION = 180

function localDateKey(value: Date | string, timeZone: string): string {
  const date = typeof value === "string" ? new Date(value) : value
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

function practiceEvent(event: LearningEvent): boolean {
  return event.taskKind !== "placement"
}

function practiceTask(task: LearningTask): boolean {
  return task.kind === "lesson" || task.kind === "review" || task.kind === "repair"
}

export function buildDailyQuest(
  learner: LearnerState,
  remainingTasks: LearningTask[],
  now = new Date(),
  timeZone = "Europe/Zurich",
  locale: LearningLocale = "de",
): DailyQuest {
  const dateKey = localDateKey(now, timeZone)
  const events = learner.learningEvents.filter(
    (event) => practiceEvent(event) && localDateKey(event.completedAt, timeZone) === dateKey,
  )
  const remaining = remainingTasks.filter(practiceTask)
  const completedQuestions = events.reduce(
    (total, event) => total + event.questionResults.length,
    0,
  )
  const activeSeconds = events.reduce((total, event) => total + event.activeSeconds, 0)
  const remainingQuestions = remaining.reduce(
    (total, task) => total + task.questionCount,
    0,
  )
  const availableRounds = events.length + remaining.length
  const availableQuestions = completedQuestions + remainingQuestions
  const activeTarget = Math.min(
    learner.preferences.sessionMinutes * 60,
    activeSeconds + remainingQuestions * PRACTICE_SECONDS_PER_QUESTION,
  )
  const isRestDay = availableRounds === 0

  const goals: DailyQuestGoal[] = [
    {
      id: "round",
      title: engagementText(locale, "Eine Lernrunde abschliessen", "Complete one learning round", "Completa un giro di studio", "Completa una sesión de aprendizaje"),
      description: engagementText(locale, "Lektion, Wiederholung oder Standortbestimmung – was heute passt.", "A lesson, review, or assessment—whatever fits today.", "Una lezione, un ripasso o una verifica: ciò che va bene oggi.", "Una lección, un repaso o una evaluación: lo que encaje hoy."),
      current: events.length,
      target: Math.min(1, availableRounds),
      unit: "rounds",
      complete: events.length >= Math.min(1, availableRounds),
    },
    {
      id: "questions",
      title: engagementText(locale, "Aufgaben wirklich bearbeiten", "Work through real questions", "Lavora davvero sulle domande", "Resuelve preguntas de verdad"),
      description: engagementText(locale, "Hilfe ist erlaubt; wichtig ist, dass du die Idee bis zum Ende durchgehst.", "Help is allowed; what matters is following the idea through to the end.", "L'aiuto è consentito; conta seguire l'idea fino alla fine.", "Se permite usar ayuda; lo importante es seguir la idea hasta el final."),
      current: completedQuestions,
      target: Math.min(3, availableQuestions),
      unit: "questions",
      complete: completedQuestions >= Math.min(3, availableQuestions),
    },
    {
      id: "active-time",
      title: engagementText(locale, "Ruhige aktive Lernzeit", "Calm active learning time", "Tempo di studio attivo e tranquillo", "Tiempo de aprendizaje activo y tranquilo"),
      description: engagementText(locale, "Nur sichtbare, aktive Zeit zählt. Es gibt keinen Geschwindigkeitsbonus.", "Only visible, active time counts. There is no speed bonus.", "Conta soltanto il tempo visibile e attivo. Non c'è alcun bonus per la velocità.", "Solo cuenta el tiempo visible y activo. No hay bonificación por rapidez."),
      current: activeSeconds,
      target: activeTarget,
      unit: "seconds",
      complete: activeSeconds >= activeTarget,
    },
  ]

  return {
    dateKey,
    isRestDay,
    completedGoals: isRestDay ? 0 : goals.filter((goal) => goal.complete).length,
    goals,
  }
}

function sortedEvents(learner: LearnerState): LearningEvent[] {
  return [...learner.learningEvents]
    .filter(practiceEvent)
    .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
}

function thresholdEvent(
  events: LearningEvent[],
  target: number,
  contribution: (event: LearningEvent) => number,
): LearningEvent | undefined {
  let total = 0
  for (const event of events) {
    total += contribution(event)
    if (total >= target) return event
  }
  return undefined
}

function achievement(
  id: AchievementId,
  icon: string,
  title: string,
  description: string,
  current: number,
  target: number,
  unlockedAt?: string,
): AchievementProgress {
  return {
    id,
    icon,
    title,
    description,
    current: Math.min(current, target),
    target,
    unlocked: current >= target,
    ...(unlockedAt ? { unlockedAt } : {}),
  }
}

export function buildAchievements(
  learner: LearnerState,
  locale: LearningLocale = "de",
): AchievementProgress[] {
  const events = sortedEvents(learner)
  const firstRound = events[0]
  const independentCount = events.reduce(
    (total, event) => total + event.questionResults.filter((result) => result.independentlySolved).length,
    0,
  )
  const independentUnlock = thresholdEvent(
    events,
    10,
    (event) => event.questionResults.filter((result) => result.independentlySolved).length,
  )
  const correctionEvents = events.filter(
    (event) => event.questionResults.some((result) => result.attempts > 1),
  )
  const reviewEvents = events.filter((event) => event.taskKind === "review")
  const assessmentEvents = events.filter((event) => event.taskKind === "assessment")
  const masteredDates = topicIds
    .map((topicId) => learner.mastery[topicId])
    .filter((mastery) => mastery.status === "mastered" && mastery.masteredAt)
    .map((mastery) => mastery.masteredAt!)
    .sort()
  const mocks = [...learner.mockHistory]
    .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt))

  return [
    achievement(
      "first-round",
      "✦",
      engagementText(locale, "Der erste Schritt", "The first step", "Il primo passo", "El primer paso"),
      engagementText(locale, "Eine echte Lernrunde abgeschlossen.", "Completed a real learning round.", "Hai completato un vero giro di studio.", "Has completado una sesión de aprendizaje real."),
      events.length,
      1,
      firstRound?.completedAt,
    ),
    achievement(
      "independent-ten",
      "◎",
      engagementText(locale, "Selbst geschafft", "Solved independently", "Risolto in autonomia", "Resuelto de forma autónoma"),
      engagementText(locale, "Zehn Aufgaben ohne Hilfe bis zur richtigen Antwort gebracht.", "Brought ten questions to the correct answer without help.", "Hai portato dieci domande alla risposta corretta senza aiuto.", "Has llevado diez preguntas hasta la respuesta correcta sin ayuda."),
      independentCount,
      10,
      independentUnlock?.completedAt,
    ),
    achievement(
      "self-correction",
      "↗",
      engagementText(locale, "Drangeblieben", "Kept going", "Hai continuato", "Has seguido adelante"),
      engagementText(locale, "Nach einer falschen Antwort selbst korrigiert und weitergemacht.", "Corrected a wrong answer yourself and continued.", "Hai corretto da solo una risposta sbagliata e hai continuato.", "Has corregido por tu cuenta una respuesta incorrecta y has continuado."),
      correctionEvents.length,
      1,
      correctionEvents[0]?.completedAt,
    ),
    achievement(
      "five-reviews",
      "↻",
      engagementText(locale, "Wiederkehrer", "Returning learner", "Ritorno allo studio", "De vuelta al aprendizaje"),
      engagementText(locale, "Fünf fällige Wiederholungen abgeschlossen.", "Completed five due reviews.", "Hai completato cinque ripassi in scadenza.", "Has completado cinco repasos pendientes."),
      reviewEvents.length,
      5,
      reviewEvents[4]?.completedAt,
    ),
    achievement(
      "first-assessment",
      "◆",
      engagementText(locale, "Standortfinder", "Position finder", "Punto della situazione", "Punto de situación"),
      engagementText(locale, "Die erste gemischte Standortbestimmung abgeschlossen.", "Completed the first mixed assessment.", "Hai completato la prima verifica mista.", "Has completado la primera evaluación mixta."),
      assessmentEvents.length,
      1,
      assessmentEvents[0]?.completedAt,
    ),
    achievement(
      "first-mock",
      "◇",
      engagementText(locale, "Prüfungsmut", "Exam courage", "Coraggio da esame", "Valentía ante el examen"),
      engagementText(locale, "Eine vollständige Probeprüfung abgegeben.", "Submitted a complete mock exam.", "Hai consegnato una simulazione completa.", "Has entregado un simulacro completo."),
      mocks.length,
      1,
      mocks[0]?.submittedAt,
    ),
    achievement(
      "five-topics",
      "⌁",
      engagementText(locale, "Pfadfinder", "Pathfinder", "Apripista", "Explorador de caminos"),
      engagementText(locale, "Fünf Themen gelernt und für Wiederholungen geöffnet.", "Learned five topics and opened them for reviews.", "Hai appreso cinque argomenti e li hai aperti ai ripassi.", "Has aprendido cinco temas y los has abierto para repasos."),
      masteredDates.length,
      5,
      masteredDates[4],
    ),
    achievement(
      "course-complete",
      "★",
      engagementText(locale, "Gipfel erreicht", "Summit reached", "Vetta raggiunta", "Cumbre alcanzada"),
      engagementText(locale, "Alle Themen gelernt – ab jetzt halten Reviews und Checks sie abrufbar.", "All topics learned—reviews and assessments now keep them ready.", "Tutti gli argomenti sono stati appresi: ora ripassi e verifiche li mantengono disponibili.", "Todos los temas están aprendidos; ahora los repasos y las evaluaciones los mantienen disponibles."),
      masteredDates.length,
      topicIds.length,
      masteredDates[topicIds.length - 1],
    ),
  ]
}

export function achievementsUnlockedAt(
  learner: LearnerState,
  completedAt: string,
  locale: LearningLocale = "de",
): AchievementProgress[] {
  return buildAchievements(learner, locale).filter(
    (item) => item.unlocked && item.unlockedAt === completedAt,
  )
}

export function buildExpeditionCollection(
  learner: LearnerState,
  locale: LearningLocale = "de",
): ExpeditionCollection {
  const totalXp = Math.max(0, learner.totalXp)
  const collectibles = expeditionCollectibleDefinitions.map((definition) => {
    const localized = locale === "en"
      ? englishCollectibleCopy[definition.id]
      : locale === "it"
        ? italianCollectibleCopy[definition.id]
        : locale === "es"
          ? spanishCollectibleCopy[definition.id]
          : definition
    return {
      ...definition,
      title: localized.title,
      description: localized.description,
      currentXp: Math.min(totalXp, definition.xpRequired),
      unlocked: totalXp >= definition.xpRequired,
    }
  })
  const achievementById = new Map(
    buildAchievements(learner, locale).map((item) => [item.id, item]),
  )
  const chapters = expeditionChapterDefinitions.map((definition) => {
    const evidence = achievementById.get(definition.achievementId)
    if (!evidence) throw new Error(`Missing expedition achievement: ${definition.achievementId}`)
    const localized = locale === "en"
      ? englishChapterCopy[definition.id]
      : locale === "it"
        ? italianChapterCopy[definition.id]
        : locale === "es"
          ? spanishChapterCopy[definition.id]
          : definition
    return {
      ...definition,
      title: localized.title,
      description: localized.description,
      evidence: localized.evidence,
      current: evidence.current,
      target: evidence.target,
      unlocked: evidence.unlocked,
      ...(evidence.unlockedAt ? { unlockedAt: evidence.unlockedAt } : {}),
    }
  })
  const nextCollectible = collectibles.find((item) => !item.unlocked)

  return {
    totalXp,
    collectibles,
    unlockedCollectibles: collectibles.filter((item) => item.unlocked).length,
    ...(nextCollectible ? { nextCollectible } : {}),
    xpToNext: nextCollectible ? Math.max(0, nextCollectible.xpRequired - totalXp) : 0,
    chapters,
    unlockedChapters: chapters.filter((item) => item.unlocked).length,
  }
}

function latestAssessmentIndex(events: LearningEvent[]): number {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (events[index]?.taskKind === "assessment") return index
  }
  return -1
}

function assessmentNumber(event: LearningEvent, eventsThroughAssessment: LearningEvent[]): number {
  const taskNumber = /^assessment:(\d+)$/u.exec(event.taskId)?.[1]
  if (taskNumber) return Number(taskNumber)
  return eventsThroughAssessment.filter((candidate) => candidate.taskKind === "assessment").length
}

/**
 * Links the latest periodic assessment to the exact scheduled reviews it
 * created. The trail is derived from append-only evidence: it never creates a
 * task, changes a due date, awards XP, or treats a difficult review as lost
 * work. Completing the targeted review closes that return step; the scheduler
 * remains free to bring the topic back again when its retention requires it.
 */
export function buildCheckpointTrail(learner: LearnerState): CheckpointTrail | undefined {
  const assessmentIndex = latestAssessmentIndex(learner.learningEvents)
  if (assessmentIndex < 0) return undefined

  const assessment = learner.learningEvents[assessmentIndex]!
  const laterEvents = learner.learningEvents.slice(assessmentIndex + 1)
  const recoveryTopicIds = assessment.topicIds.filter((topicId, index, all) => {
    if (all.indexOf(topicId) !== index) return false
    const results = assessment.questionResults.filter((result) => result.topicId === topicId)
    return results.length === 0 || !results.every(isSecureAssessmentResult)
  })
  const pausedTopicIds = new Set(
    Array.isArray(learner.topicHelpRequests)
      ? learner.topicHelpRequests.map((request) => request.topicId)
      : [],
  )
  const steps = recoveryTopicIds.map((topicId): CheckpointTrailStep => {
    const completedReview = [...laterEvents].reverse().find(
      (event) => event.taskKind === "review" && event.topicIds.includes(topicId),
    )

    if (completedReview) {
      return {
        topicId,
        status: "complete",
        completedAt: completedReview.completedAt,
      }
    }
    if (pausedTopicIds.has(topicId)) {
      return {
        topicId,
        status: "paused",
      }
    }
    return {
      topicId,
      status: "pending",
      ...(learner.mastery[topicId].dueAt ? { reviewDueAt: learner.mastery[topicId].dueAt } : {}),
    }
  })
  const completedRecoveryTopics = steps.filter((step) => step.status === "complete").length
  const pausedRecoveryTopics = steps.filter((step) => step.status === "paused").length

  return {
    assessmentNumber: assessmentNumber(
      assessment,
      learner.learningEvents.slice(0, assessmentIndex + 1),
    ),
    assessmentCompletedAt: assessment.completedAt,
    assessedTopics: new Set(assessment.topicIds).size,
    secureTopics: new Set(assessment.topicIds).size - recoveryTopicIds.length,
    recoveryTopics: recoveryTopicIds.length,
    completedRecoveryTopics,
    pausedRecoveryTopics,
    steps,
    complete: completedRecoveryTopics === recoveryTopicIds.length,
  }
}
