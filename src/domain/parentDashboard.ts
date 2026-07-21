import { orderedTopics, topics } from "./content"
import {
  buildErrorCompass,
  diagnosticKindCopyForLanguage,
  type ErrorPattern,
} from "./errorPatterns"
import { buildAssignments, topicNeedsTeacherSupport } from "./learningEngine"
import {
  learnerFeedbackCopyForLanguage,
  recentLearnerFeedback,
} from "./learnerFeedback"
import { buildPilotEvidence, type PilotEvidence } from "./pilotEvidence"
import { buildParentTopicCoaching } from "./parentCoaching"
import type { ParentExplanationLanguage } from "./parentAccess"
import type {
  LearnerFeedbackKind,
  LearnerState,
  LearningLocale,
  LearningEvent,
  QuestionDiagnosticKind,
  TopicId,
} from "./model"
import { buildProgressAnalytics, type ProgressAnalytics } from "./progressAnalytics"

export interface ParentFocusTopic {
  topicId: TopicId
  title: string
  reason: string
  nextAction: string
  priority: number
}

export interface ParentSessionPlanItem {
  id: string
  title: string
  durationMinutes: number
  topicIds: TopicId[]
  purpose: string
}

export interface ParentMockSnapshot {
  id: string
  source: "generated" | "official-archive"
  editionId?: string
  officialReviewStatus?: "pending" | "complete"
  mathematicsGrade?: number
  submittedAt: string
  certainPoints: number
  reviewablePoints: number
  maxPoints: number
  durationSeconds: number
}

export type ParentMockTrendStatus = "insufficient" | "higher" | "lower" | "overlap"

export interface ParentMockTrendPoint {
  id: string
  submittedAt: string
  lowerPoints: number
  upperPoints: number
  maxPoints: number
  lowerPercent: number
  upperPercent: number
}

export interface ParentGeneratedMockTrend {
  blueprintVersion: number
  status: ParentMockTrendStatus
  comparisonCopy: string
  points: ParentMockTrendPoint[]
}

export interface ParentLearnerFeedbackPattern {
  kind: LearnerFeedbackKind
  label: string
  occurrences: number
  concern: boolean
  nextAction: string
}

export interface ParentTopicHelpRequest {
  topicId: TopicId
  title: string
  description: string
  requestedAt: string
  coachingGuide: {
    goal: string
    ideaTitle: string
    idea: string
    commonHurdle: string
    nextStep: string
    workedSteps: string[]
    takeaway: string
    teachBackPrompt: string
    prerequisiteTitles: string[]
  }
}

export interface ParentDashboardSummary {
  weekly: ProgressAnalytics
  pilot: PilotEvidence
  weeklyTarget: number
  completedLearningSessions: number
  dueReviews: number
  hintQuestions: number
  correctedQuestions: number
  averageQuestionSeconds: number
  learnerFeedbackCount: number
  learnerConcernCount: number
  learnerFeedbackPatterns: ParentLearnerFeedbackPattern[]
  topicHelpRequests: ParentTopicHelpRequest[]
  focusTopics: ParentFocusTopic[]
  sessionPlan: ParentSessionPlanItem[]
  recentMocks: ParentMockSnapshot[]
  generatedMockTrend?: ParentGeneratedMockTrend
  errorPatterns: ErrorPattern[]
  headline: string
}

const RECENT_EVIDENCE_DAYS = 30
const MOCK_TREND_LIMIT = 6

const parentSummaryCopyBase = {
  de: {
    mockTrendInsufficient: "Für einen Verlauf braucht es zwei generierte Prüfungen derselben Version.",
    mockTrendHigher: "Der jüngste sicher belegte Punktebereich liegt vollständig über dem ersten Vergleichslauf.",
    mockTrendLower: "Der jüngste mögliche Punktebereich liegt unter dem ersten Vergleichslauf. Die vorgeschlagenen Aufholthemen haben jetzt Vorrang.",
    mockTrendOverlap: "Die Punktebereiche überschneiden sich. Offene Rechenwegpunkte werden deshalb nicht als Auf- oder Abwärtstrend ausgegeben.",
    reviewDueReason: "Die Wiederholung ist jetzt fällig.",
    reviewDueAction: "Eine kurze Wiederholung mit neuen Zahlen abschliessen.",
    ownFeedbackOne: (label: string) => `Aus eigener Rückmeldung: «${label}».`,
    ownFeedbackMany: (count: number, label: string) => `${count} eigene Rückmeldungen zeigen: «${label}».`,
    diagnosticOne: (label: string) => `1 jüngste Aufgabe zeigte: ${label}.`,
    diagnosticMany: (count: number, label: string) => `${count} jüngste Aufgaben zeigten: ${label}.`,
    uncertainReason: (uncertain: number, total: number) => `${uncertain} von ${total} jüngsten Aufgaben brauchten Korrektur oder Hilfe.`,
    uncertainMasteredAction: "Das Thema freiwillig auffrischen und danach selbständig prüfen.",
    uncertainLearningAction: "Die Lektion in Ruhe fortsetzen und die Erklärung bei Bedarf öffnen.",
    retentionReason: (percent: number) => `Der Behaltensstand liegt bei ${percent} Prozent.`,
    retentionAction: "Beim nächsten Abruf auf einen vollständigen Rechenweg achten.",
    learningReason: (supported: number, independent: number) => `Mit Hilfe liegt die Sicherheit bei ${supported} Prozent, selbständig bei ${independent} Prozent.`,
    availableReason: "Das Thema ist als nächste neue Idee bereit.",
    learningAction: "Die kurze Sicherungsrunde mit neuen Aufgaben abschliessen.",
    availableAction: "Eine kurze Lektion beginnen; Hilfe ist ausdrücklich erlaubt.",
    evidenceReason: "Das Thema ist gelernt, aber noch nicht selbständig bestätigt.",
    rhythmReason: "Das Thema bleibt im normalen Wiederholungsrhythmus.",
    rhythmAction: "Bis zur nächsten fälligen Wiederholung nichts zusätzlich erzwingen.",
    retrieveOneTitle: "Eine fällige Idee abrufen",
    retrieveManyTitle: "Zwei fällige Ideen abrufen",
    retrievePurpose: "Neue Zahlen, gleicher Gedanke. Fehler verändern den nächsten Termin, nicht den festen Review-XP-Wert.",
    secureTitle: (topic: string) => `Sicherungsrunde: ${topic}`,
    securePurpose: "Zwei neue Aufgaben prüfen den selbständigen Abruf. Bereits verdiente XP bleiben erhalten.",
    learnTitle: (topic: string) => `Neue Idee: ${topic}`,
    learnPurpose: "Eine Lektion mit Erklärung und drei dynamischen Aufgaben; Hilfe darf jederzeit benutzt werden.",
    assessTitle: "Gemischte Standortbestimmung",
    assessPurpose: "Ohne Hinweise prüfen, was abrufbar ist; Lücken werden danach automatisch zu Reviews.",
    focusTitle: (topic: string) => `Ruhig festigen: ${topic}`,
    fallbackTopicTitle: (topic: string) => `Beim Lernplan bleiben: ${topic}`,
    fallbackTitle: "Eine kurze Lernrunde, wenn es passt",
    fallbackPurpose: "Wenn nichts fällig ist, ist ein freier Tag ebenfalls Teil des Plans.",
    headlineDefault: "Ein ruhiger Einstieg reicht für diese Woche.",
    headlinePausedOne: "Ein pausiertes Thema wartet auf eine gemeinsame Erklärung.",
    headlinePausedMany: (count: number) => `${count} pausierte Themen warten auf eine gemeinsame Erklärung.`,
    headlineReviewOne: "Eine fällige Wiederholung ist der beste nächste Schritt.",
    headlineReviewMany: (count: number) => `${count} fällige Wiederholungen sind die besten nächsten Schritte.`,
    headlineFeedback: "Die eigene Rückmeldung zeigt, wo ein anderer Zugang hilft.",
    headlineUnderstanding: "Verstehen kommt vor Tempo: Hilfe nutzen und danach selbst prüfen.",
    headlineRhythm: "Der Wochenrhythmus steht. Zusätzlicher Druck ist nicht nötig.",
  },
  en: {
    mockTrendInsufficient: "A trend needs two generated exams from the same version.",
    mockTrendHigher: "The latest securely evidenced score range lies entirely above the first comparable run.",
    mockTrendLower: "The latest possible score range lies below the first comparable run. The suggested recovery topics now take priority.",
    mockTrendOverlap: "The score ranges overlap. Open method points are therefore not presented as an upward or downward trend.",
    reviewDueReason: "The review is due now.",
    reviewDueAction: "Complete one short review with fresh values.",
    ownFeedbackOne: (label: string) => `From the learner's own feedback: “${label}”.`,
    ownFeedbackMany: (count: number, label: string) => `${count} learner feedback signals say: “${label}”.`,
    diagnosticOne: (label: string) => `1 recent question showed: ${label}.`,
    diagnosticMany: (count: number, label: string) => `${count} recent questions showed: ${label}.`,
    uncertainReason: (uncertain: number, total: number) => `${uncertain} of ${total} recent questions needed a correction or help.`,
    uncertainMasteredAction: "Refresh the topic voluntarily, then check it independently.",
    uncertainLearningAction: "Continue the lesson calmly and open the explanation if needed.",
    retentionReason: (percent: number) => `The retention level is ${percent} percent.`,
    retentionAction: "Look for a complete calculation path at the next recall.",
    learningReason: (supported: number, independent: number) => `Security is ${supported} percent with support and ${independent} percent independently.`,
    availableReason: "The topic is ready as the next new idea.",
    learningAction: "Complete the short consolidation round with fresh questions.",
    availableAction: "Begin one short lesson; help is expressly allowed.",
    evidenceReason: "The topic is learned but not yet confirmed independently.",
    rhythmReason: "The topic remains in the normal review rhythm.",
    rhythmAction: "Do not force extra work before the next due review.",
    retrieveOneTitle: "Recall one due idea",
    retrieveManyTitle: "Recall two due ideas",
    retrievePurpose: "Fresh values, same idea. Mistakes change the next date, not the fixed review XP value.",
    secureTitle: (topic: string) => `Consolidation round: ${topic}`,
    securePurpose: "Two fresh questions check independent recall. XP already earned remains unchanged.",
    learnTitle: (topic: string) => `New idea: ${topic}`,
    learnPurpose: "One lesson with an explanation and three dynamic questions; help may be used at any time.",
    assessTitle: "Mixed assessment",
    assessPurpose: "Check what is recallable without hints; gaps automatically become reviews afterwards.",
    focusTitle: (topic: string) => `Consolidate calmly: ${topic}`,
    fallbackTopicTitle: (topic: string) => `Stay with the learning plan: ${topic}`,
    fallbackTitle: "One short learning round when it suits",
    fallbackPurpose: "When nothing is due, a free day is also part of the plan.",
    headlineDefault: "A calm start is enough for this week.",
    headlinePausedOne: "One paused topic is waiting for an explanation together.",
    headlinePausedMany: (count: number) => `${count} paused topics are waiting for an explanation together.`,
    headlineReviewOne: "One due review is the best next step.",
    headlineReviewMany: (count: number) => `${count} due reviews are the best next steps.`,
    headlineFeedback: "The learner's own feedback shows where a different approach may help.",
    headlineUnderstanding: "Understanding comes before speed: use help, then check independently.",
    headlineRhythm: "The weekly rhythm is in place. Extra pressure is not needed.",
  },
} as const

const parentSummaryCopy = {
  ...parentSummaryCopyBase,
  it: {
    mockTrendInsufficient: "Per mostrare una tendenza servono due esami generati con la stessa versione.",
    mockTrendHigher: "L'intervallo di punti più recente e documentato con sicurezza è interamente superiore al primo tentativo confrontabile.",
    mockTrendLower: "L'intervallo di punti possibile più recente è inferiore al primo tentativo confrontabile. Ora hanno priorità gli argomenti di recupero proposti.",
    mockTrendOverlap: "Gli intervalli di punti si sovrappongono. I punti di procedimento ancora aperti non vengono quindi presentati come tendenza positiva o negativa.",
    reviewDueReason: "Il ripasso è in scadenza ora.",
    reviewDueAction: "Completa un breve ripasso con valori nuovi.",
    ownFeedbackOne: (label: string) => `Dal feedback dello studente: «${label}».`,
    ownFeedbackMany: (count: number, label: string) => `${count} feedback dello studente indicano: «${label}».`,
    diagnosticOne: (label: string) => `1 domanda recente ha mostrato: ${label}.`,
    diagnosticMany: (count: number, label: string) => `${count} domande recenti hanno mostrato: ${label}.`,
    uncertainReason: (uncertain: number, total: number) => `${uncertain} delle ultime ${total} domande hanno richiesto una correzione o un aiuto.`,
    uncertainMasteredAction: "Riprendi volontariamente l'argomento e poi controllalo in autonomia.",
    uncertainLearningAction: "Continua la lezione con calma e apri la spiegazione se serve.",
    retentionReason: (percent: number) => `Il livello di ritenzione è del ${percent} percento.`,
    retentionAction: "Al prossimo richiamo, presta attenzione a un procedimento completo.",
    learningReason: (supported: number, independent: number) => `La sicurezza è del ${supported} percento con aiuto e del ${independent} percento in autonomia.`,
    availableReason: "L'argomento è pronto come prossima idea nuova.",
    learningAction: "Completa il breve giro di consolidamento con domande nuove.",
    availableAction: "Inizia una breve lezione; l'aiuto è espressamente consentito.",
    evidenceReason: "L'argomento è stato appreso, ma non ancora confermato in autonomia.",
    rhythmReason: "L'argomento rimane nel normale ritmo dei ripassi.",
    rhythmAction: "Non forzare lavoro aggiuntivo prima del prossimo ripasso in scadenza.",
    retrieveOneTitle: "Richiama un'idea in scadenza",
    retrieveManyTitle: "Richiama due idee in scadenza",
    retrievePurpose: "Valori nuovi, stessa idea. Gli errori cambiano la prossima data, non il valore XP fisso del ripasso.",
    secureTitle: (topic: string) => `Giro di consolidamento: ${topic}`,
    securePurpose: "Due domande nuove controllano il richiamo autonomo. Gli XP già guadagnati non cambiano.",
    learnTitle: (topic: string) => `Nuova idea: ${topic}`,
    learnPurpose: "Una lezione con spiegazione e tre domande dinamiche; l'aiuto si può usare in qualsiasi momento.",
    assessTitle: "Verifica mista",
    assessPurpose: "Controlla senza suggerimenti ciò che è richiamabile; le lacune diventano poi automaticamente ripassi.",
    focusTitle: (topic: string) => `Consolida con calma: ${topic}`,
    fallbackTopicTitle: (topic: string) => `Segui il piano di studio: ${topic}`,
    fallbackTitle: "Un breve giro di studio quando va bene",
    fallbackPurpose: "Quando non c'è nulla in scadenza, anche un giorno libero fa parte del piano.",
    headlineDefault: "Per questa settimana basta un inizio tranquillo.",
    headlinePausedOne: "Un argomento in pausa attende una spiegazione condivisa.",
    headlinePausedMany: (count: number) => `${count} argomenti in pausa attendono una spiegazione condivisa.`,
    headlineReviewOne: "Un ripasso in scadenza è il miglior passo successivo.",
    headlineReviewMany: (count: number) => `${count} ripassi in scadenza sono i migliori passi successivi.`,
    headlineFeedback: "Il feedback dello studente mostra dove può servire un altro approccio.",
    headlineUnderstanding: "La comprensione viene prima della velocità: usa l'aiuto e poi controlla in autonomia.",
    headlineRhythm: "Il ritmo settimanale è impostato. Non serve ulteriore pressione.",
  },
  es: {
    mockTrendInsufficient: "Para mostrar una tendencia hacen falta dos exámenes generados con la misma versión.",
    mockTrendHigher: "El intervalo de puntuación más reciente y respaldado con seguridad está completamente por encima del primer intento comparable.",
    mockTrendLower: "El intervalo de puntuación posible más reciente está por debajo del primer intento comparable. Ahora tienen prioridad los temas de refuerzo propuestos.",
    mockTrendOverlap: "Los intervalos de puntuación se solapan. Por eso los puntos de procedimiento aún abiertos no se presentan como una tendencia ascendente o descendente.",
    reviewDueReason: "El repaso toca ahora.",
    reviewDueAction: "Completa un repaso breve con valores nuevos.",
    ownFeedbackOne: (label: string) => `Según la valoración del estudiante: «${label}».`,
    ownFeedbackMany: (count: number, label: string) => `${count} valoraciones del estudiante indican: «${label}».`,
    diagnosticOne: (label: string) => `1 pregunta reciente mostró: ${label}.`,
    diagnosticMany: (count: number, label: string) => `${count} preguntas recientes mostraron: ${label}.`,
    uncertainReason: (uncertain: number, total: number) => `${uncertain} de las últimas ${total} preguntas necesitaron una corrección o ayuda.`,
    uncertainMasteredAction: "Repasa el tema voluntariamente y compruébalo después de forma autónoma.",
    uncertainLearningAction: "Continúa la lección con calma y abre la explicación si la necesitas.",
    retentionReason: (percent: number) => `El nivel de retención es del ${percent} por ciento.`,
    retentionAction: "En el próximo recuerdo, presta atención a un procedimiento completo.",
    learningReason: (supported: number, independent: number) => `La seguridad es del ${supported} por ciento con ayuda y del ${independent} por ciento de forma autónoma.`,
    availableReason: "El tema está listo como siguiente idea nueva.",
    learningAction: "Completa la breve ronda de consolidación con preguntas nuevas.",
    availableAction: "Empieza una lección breve; usar ayuda está expresamente permitido.",
    evidenceReason: "El tema está aprendido, pero aún no confirmado de forma autónoma.",
    rhythmReason: "El tema permanece en el ritmo normal de repasos.",
    rhythmAction: "No fuerces trabajo adicional antes del próximo repaso pendiente.",
    retrieveOneTitle: "Recordar una idea pendiente",
    retrieveManyTitle: "Recordar dos ideas pendientes",
    retrievePurpose: "Valores nuevos, misma idea. Los errores cambian la próxima fecha, no el valor fijo de XP del repaso.",
    secureTitle: (topic: string) => `Ronda de consolidación: ${topic}`,
    securePurpose: "Dos preguntas nuevas comprueban el recuerdo autónomo. Los XP ya obtenidos no cambian.",
    learnTitle: (topic: string) => `Idea nueva: ${topic}`,
    learnPurpose: "Una lección con explicación y tres preguntas dinámicas; se puede usar ayuda en cualquier momento.",
    assessTitle: "Evaluación mixta",
    assessPurpose: "Comprueba sin pistas lo que se puede recordar; después las lagunas se convierten automáticamente en repasos.",
    focusTitle: (topic: string) => `Consolidar con calma: ${topic}`,
    fallbackTopicTitle: (topic: string) => `Seguir el plan de aprendizaje: ${topic}`,
    fallbackTitle: "Una breve sesión de aprendizaje cuando venga bien",
    fallbackPurpose: "Cuando no hay nada pendiente, un día libre también forma parte del plan.",
    headlineDefault: "Para esta semana basta con empezar con calma.",
    headlinePausedOne: "Un tema pausado espera una explicación conjunta.",
    headlinePausedMany: (count: number) => `${count} temas pausados esperan una explicación conjunta.`,
    headlineReviewOne: "Un repaso pendiente es el mejor siguiente paso.",
    headlineReviewMany: (count: number) => `${count} repasos pendientes son los mejores siguientes pasos.`,
    headlineFeedback: "La valoración del estudiante muestra dónde puede ayudar otro enfoque.",
    headlineUnderstanding: "Comprender va antes que la rapidez: usa ayuda y luego compruébalo de forma autónoma.",
    headlineRhythm: "El ritmo semanal está establecido. No hace falta más presión.",
  },
}

function localizedTopic(topicId: TopicId, locale: LearningLocale) {
  return buildParentTopicCoaching(topicId, locale)
}

function localizedTopicShortTitle(topicId: TopicId, locale: LearningLocale): string {
  return locale === "de" ? topics[topicId].shortTitle : localizedTopic(topicId, locale).title
}

function buildGeneratedMockTrend(
  learner: LearnerState,
  locale: LearningLocale,
): ParentGeneratedMockTrend | undefined {
  const copy = parentSummaryCopy[locale]
  const generated = learner.mockHistory
    .filter((mock) => (mock.source ?? "generated") === "generated")
    .sort((left, right) => left.submittedAt.localeCompare(right.submittedAt))
  const latest = generated.at(-1)
  if (!latest) return undefined

  // Blueprint changes may alter task structure and difficulty. Compare only
  // generated papers from the latest version rather than drawing a false line
  // across incompatible exams.
  const comparable = generated
    .filter((mock) => mock.blueprintVersion === latest.blueprintVersion)
    .slice(-MOCK_TREND_LIMIT)
  const points = comparable.map((mock): ParentMockTrendPoint => {
    const upperPoints = Math.min(mock.maxPoints, mock.certainPoints + mock.reviewablePoints)
    return {
      id: mock.id,
      submittedAt: mock.submittedAt,
      lowerPoints: mock.certainPoints,
      upperPoints,
      maxPoints: mock.maxPoints,
      lowerPercent: Math.round(mock.certainPoints / mock.maxPoints * 100),
      upperPercent: Math.round(upperPoints / mock.maxPoints * 100),
    }
  })

  let status: ParentMockTrendStatus = "insufficient"
  let comparisonCopy: string = copy.mockTrendInsufficient
  if (points.length >= 2) {
    const first = points[0]!
    const current = points.at(-1)!
    const firstLower = first.lowerPoints / first.maxPoints
    const firstUpper = first.upperPoints / first.maxPoints
    const currentLower = current.lowerPoints / current.maxPoints
    const currentUpper = current.upperPoints / current.maxPoints

    if (currentLower > firstUpper) {
      status = "higher"
      comparisonCopy = copy.mockTrendHigher
    } else if (currentUpper < firstLower) {
      status = "lower"
      comparisonCopy = copy.mockTrendLower
    } else {
      status = "overlap"
      comparisonCopy = copy.mockTrendOverlap
    }
  }

  return {
    blueprintVersion: latest.blueprintVersion,
    status,
    comparisonCopy,
    points,
  }
}

function recentEvents(learner: LearnerState, now: Date): LearningEvent[] {
  const earliest = now.getTime() - RECENT_EVIDENCE_DAYS * 24 * 60 * 60 * 1000
  return learner.learningEvents.filter((event) => Date.parse(event.completedAt) >= earliest)
}

function focusTopics(
  learner: LearnerState,
  now: Date,
  locale: LearningLocale,
): ParentFocusTopic[] {
  const copy = parentSummaryCopy[locale]
  const feedbackCopy = learnerFeedbackCopyForLanguage(locale)
  const evidence = recentEvents(learner, now)
  const feedback = recentLearnerFeedback(learner, now)
  const attemptsByTopic = new Map<TopicId, { uncertain: number; total: number }>()
  const diagnosticsByTopic = new Map<TopicId, QuestionDiagnosticKind[]>()
  const feedbackByTopic = new Map<TopicId, LearnerFeedbackKind[]>()
  for (const item of feedback) {
    if (!feedbackCopy[item.kind].concern) continue
    for (const topicId of item.topicIds) {
      feedbackByTopic.set(topicId, [
        ...(feedbackByTopic.get(topicId) ?? []),
        item.kind,
      ])
    }
  }
  for (const result of evidence.flatMap((event) => event.questionResults)) {
    const current = attemptsByTopic.get(result.topicId) ?? { uncertain: 0, total: 0 }
    current.total += 1
    if (result.attempts > 1 || result.hintsUsed > 0 || !result.independentlySolved) {
      current.uncertain += 1
    }
    attemptsByTopic.set(result.topicId, current)
    if (result.diagnostic) {
      diagnosticsByTopic.set(result.topicId, [
        ...(diagnosticsByTopic.get(result.topicId) ?? []),
        result.diagnostic.kind,
      ])
    }
  }

  return orderedTopics()
    .flatMap((topic): ParentFocusTopic[] => {
      const mastery = learner.mastery[topic.id]
      if (mastery.status === "locked" || topicNeedsTeacherSupport(learner, topic.id)) return []
      const evidenceForTopic = attemptsByTopic.get(topic.id) ?? { uncertain: 0, total: 0 }
      const reviewDue = mastery.status === "mastered" && Boolean(
        mastery.dueAt && Date.parse(mastery.dueAt) <= now.getTime(),
      )
      const needsIndependentEvidence = mastery.independentMastery < 0.55
      const independenceGap = 1 - mastery.independentMastery
      const retentionGap = mastery.status === "mastered" ? 1 - mastery.retention : 0
      const uncertaintyRate = evidenceForTopic.total === 0
        ? 0
        : evidenceForTopic.uncertain / evidenceForTopic.total
      const diagnosticKinds = diagnosticsByTopic.get(topic.id) ?? []
      const feedbackKinds = feedbackByTopic.get(topic.id) ?? []
      const feedbackKind = [...new Set(feedbackKinds)].sort((left, right) => (
        feedbackKinds.filter((kind) => kind === right).length -
        feedbackKinds.filter((kind) => kind === left).length
      ))[0]
      const diagnosticKind = [...new Set(diagnosticKinds)].sort((left, right) => (
        diagnosticKinds.filter((kind) => kind === right).length -
        diagnosticKinds.filter((kind) => kind === left).length
      ))[0]
      const priority =
        (reviewDue ? 100 : 0) +
        (mastery.status === "learning" ? 70 : mastery.status === "available" ? 45 : 0) +
        retentionGap * 45 +
        independenceGap * 30 +
        uncertaintyRate * 35 +
        diagnosticKinds.length * 12 +
        feedbackKinds.length * 30 +
        (needsIndependentEvidence ? 15 : 0)

      let reason: string
      let nextAction: string
      if (reviewDue) {
        reason = copy.reviewDueReason
        nextAction = copy.reviewDueAction
      } else if (feedbackKind) {
        const ownFeedback = feedbackCopy[feedbackKind]
        reason = feedbackKinds.length === 1
          ? copy.ownFeedbackOne(ownFeedback.label)
          : copy.ownFeedbackMany(feedbackKinds.length, ownFeedback.label)
        nextAction = ownFeedback.parentNextAction
      } else if (diagnosticKind) {
        const diagnostic = diagnosticKindCopyForLanguage(diagnosticKind, locale)
        reason = diagnosticKinds.length === 1
          ? copy.diagnosticOne(diagnostic.label)
          : copy.diagnosticMany(diagnosticKinds.length, diagnostic.label)
        nextAction = diagnostic.nextMove
      } else if (evidenceForTopic.uncertain > 0) {
        reason = copy.uncertainReason(evidenceForTopic.uncertain, evidenceForTopic.total)
        nextAction = mastery.status === "mastered"
          ? copy.uncertainMasteredAction
          : copy.uncertainLearningAction
      } else if (mastery.status === "mastered" && retentionGap > 0.35) {
        reason = copy.retentionReason(Math.round(mastery.retention * 100))
        nextAction = copy.retentionAction
      } else if (mastery.status === "available" || mastery.status === "learning") {
        reason = mastery.status === "learning"
          ? copy.learningReason(
            Math.round(mastery.supportedMastery * 100),
            Math.round(mastery.independentMastery * 100),
          )
          : copy.availableReason
        nextAction = mastery.status === "learning"
          ? copy.learningAction
          : copy.availableAction
      } else {
        reason = needsIndependentEvidence
          ? copy.evidenceReason
          : copy.rhythmReason
        nextAction = copy.rhythmAction
      }

      return [{
        topicId: topic.id,
        title: localizedTopic(topic.id, locale).title,
        reason,
        nextAction,
        priority,
      }]
    })
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 3)
}

function buildSessionPlan(
  learner: LearnerState,
  focus: ParentFocusTopic[],
  now: Date,
  locale: LearningLocale,
): ParentSessionPlanItem[] {
  const copy = parentSummaryCopy[locale]
  const assignments = buildAssignments(learner, now)
  const preferredMinutes = learner.preferences.sessionMinutes
  const assessment = assignments.find((task) => task.kind === "assessment")
  const reviews = assignments.filter((task) => task.kind === "review")
  const lesson = assignments.find((task) => task.kind === "lesson")
  const securingRound = assignments.find((task) => task.purpose === "lesson-recovery")
  const result: ParentSessionPlanItem[] = []

  if (reviews.length > 0) {
    const topicIds = [...new Set(reviews.slice(0, 2).flatMap((task) => task.topicIds))]
    result.push({
      id: "retrieve",
      title: reviews.length === 1 ? copy.retrieveOneTitle : copy.retrieveManyTitle,
      durationMinutes: Math.min(10, preferredMinutes),
      topicIds,
      purpose: copy.retrievePurpose,
    })
  }

  if (securingRound) {
    result.push({
      id: "secure",
      title: copy.secureTitle(localizedTopicShortTitle(securingRound.topicIds[0]!, locale)),
      durationMinutes: Math.min(10, preferredMinutes),
      topicIds: securingRound.topicIds,
      purpose: copy.securePurpose,
    })
  } else if (lesson) {
    result.push({
      id: "learn",
      title: copy.learnTitle(localizedTopicShortTitle(lesson.topicIds[0]!, locale)),
      durationMinutes: preferredMinutes,
      topicIds: lesson.topicIds,
      purpose: copy.learnPurpose,
    })
  }

  if (assessment) {
    result.push({
      id: "assess",
      title: copy.assessTitle,
      durationMinutes: Math.max(15, preferredMinutes),
      topicIds: assessment.topicIds,
      purpose: copy.assessPurpose,
    })
  }

  for (const item of focus) {
    if (result.length >= 3) break
    if (result.some((session) => session.topicIds.includes(item.topicId))) continue
    result.push({
      id: `focus:${item.topicId}`,
      title: copy.focusTitle(localizedTopicShortTitle(item.topicId, locale)),
      durationMinutes: Math.min(10, preferredMinutes),
      topicIds: [item.topicId],
      purpose: item.nextAction,
    })
  }

  while (result.length < 3) {
    const fallback = focus[result.length % Math.max(1, focus.length)]
    result.push({
      id: `rest:${result.length}`,
      title: fallback
        ? copy.fallbackTopicTitle(localizedTopicShortTitle(fallback.topicId, locale))
        : copy.fallbackTitle,
      durationMinutes: Math.min(10, preferredMinutes),
      topicIds: fallback ? [fallback.topicId] : [],
      purpose: fallback
        ? fallback.nextAction
        : copy.fallbackPurpose,
    })
  }

  return result.slice(0, 3)
}

export function buildParentDashboard(
  learner: LearnerState,
  now = new Date(),
  timeZone = "Europe/Zurich",
  explanationLanguage: ParentExplanationLanguage = "de",
  locale: LearningLocale = "de",
): ParentDashboardSummary {
  const copy = parentSummaryCopy[locale]
  const feedbackCopy = learnerFeedbackCopyForLanguage(locale)
  const weekly = buildProgressAnalytics(
    learner,
    now,
    timeZone,
    locale === "en" ? "en-GB" : locale === "it" ? "it-CH" : locale === "es" ? "es-ES" : "de-CH",
  )
  const pilot = buildPilotEvidence(learner, now, timeZone)
  const weeklyQuestions = learner.learningEvents
    .filter((event) => weekly.days.some((day) => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(event.completedAt))
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? ""
      return day.dateKey === `${part("year")}-${part("month")}-${part("day")}`
    }))
    .flatMap((event) => event.questionResults)
  const dueReviews = buildAssignments(learner, now).filter((task) => task.kind === "review").length
  const weeklyTarget = learner.preferences.practiceDays.length
  const focus = focusTopics(learner, now, locale)
  const errorPatterns = buildErrorCompass(learner, now, 45, locale).patterns.slice(0, 3)
  const completedLearningSessions = weekly.lessons + weekly.reviews + weekly.assessments
  const hintQuestions = weeklyQuestions.filter((result) => result.hintsUsed > 0).length
  const correctedQuestions = weeklyQuestions.filter(
    (result) => result.attempts > 1 && result.diagnostic?.resolved === true,
  ).length
  const averageQuestionSeconds = weeklyQuestions.length === 0
    ? 0
    : Math.round(
      weeklyQuestions.reduce((sum, result) => sum + result.activeSeconds, 0) /
      weeklyQuestions.length,
    )
  const learnerFeedback = recentLearnerFeedback(learner, now)
  const learnerFeedbackPatterns = (Object.keys(feedbackCopy) as LearnerFeedbackKind[])
    .map((kind): ParentLearnerFeedbackPattern => ({
      kind,
      label: feedbackCopy[kind].label,
      occurrences: learnerFeedback.filter((feedback) => feedback.kind === kind).length,
      concern: feedbackCopy[kind].concern,
      nextAction: feedbackCopy[kind].parentNextAction,
    }))
    .filter((pattern) => pattern.occurrences > 0)
    .sort((left, right) => (
      Number(right.concern) - Number(left.concern) ||
      right.occurrences - left.occurrences
    ))
  const learnerConcernCount = learnerFeedback.filter((feedback) => (
    feedbackCopy[feedback.kind].concern
  )).length
  const topicHelpRequests = learner.topicHelpRequests
    .map((request): ParentTopicHelpRequest => {
      const coaching = buildParentTopicCoaching(request.topicId, explanationLanguage)
      return {
        topicId: request.topicId,
        title: coaching.title,
        description: coaching.description,
        requestedAt: request.requestedAt,
        coachingGuide: {
          goal: coaching.goal,
          ideaTitle: coaching.ideaTitle,
          idea: coaching.idea,
          commonHurdle: coaching.commonHurdle,
          nextStep: coaching.nextStep,
          workedSteps: coaching.workedSteps,
          takeaway: coaching.takeaway,
          teachBackPrompt: coaching.teachBackPrompt,
          prerequisiteTitles: coaching.prerequisiteTitles,
        },
      }
    })
    .sort((left, right) => left.requestedAt.localeCompare(right.requestedAt))

  let headline: string = copy.headlineDefault
  if (topicHelpRequests.length > 0) {
    headline = topicHelpRequests.length === 1
      ? copy.headlinePausedOne
      : copy.headlinePausedMany(topicHelpRequests.length)
  } else if (dueReviews > 0) {
    headline = dueReviews === 1
      ? copy.headlineReviewOne
      : copy.headlineReviewMany(dueReviews)
  } else if (learnerConcernCount > 0) {
    headline = copy.headlineFeedback
  } else if (weekly.questions > 0 && weekly.independentRate < 50) {
    headline = copy.headlineUnderstanding
  } else if (completedLearningSessions >= weeklyTarget) {
    headline = copy.headlineRhythm
  }

  return {
    weekly,
    pilot,
    weeklyTarget,
    completedLearningSessions,
    dueReviews,
    hintQuestions,
    correctedQuestions,
    averageQuestionSeconds,
    learnerFeedbackCount: learnerFeedback.length,
    learnerConcernCount,
    learnerFeedbackPatterns,
    topicHelpRequests,
    focusTopics: focus,
    sessionPlan: buildSessionPlan(learner, focus, now, locale),
    recentMocks: [...learner.mockHistory]
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
      .slice(0, 3)
      .map((mock) => ({
        id: mock.id,
        source: mock.source ?? "generated",
        ...(mock.editionId ? { editionId: mock.editionId } : {}),
        ...(mock.officialReview ? { officialReviewStatus: mock.officialReview.status } : {}),
        ...(mock.officialReview?.mathematicsGrade !== undefined
          ? { mathematicsGrade: mock.officialReview.mathematicsGrade }
          : {}),
        submittedAt: mock.submittedAt,
        certainPoints: mock.certainPoints,
        reviewablePoints: mock.reviewablePoints,
        maxPoints: mock.maxPoints,
        durationSeconds: mock.durationSeconds,
      })),
    generatedMockTrend: buildGeneratedMockTrend(learner, locale),
    errorPatterns,
    headline,
  }
}
