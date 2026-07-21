import type {
  LearnerFeedback,
  LearnerFeedbackKind,
  LearnerState,
  LearningLocale,
} from "./model"

export interface LearnerFeedbackCopy {
  label: string
  detail: string
  learnerNextAction: string
  parentNextAction: string
  concern: boolean
}

export const learnerFeedbackCopy: Record<LearnerFeedbackKind, LearnerFeedbackCopy> = {
  clear: {
    label: "Die Idee ist klar",
    detail: "Ich könnte jemandem erklären, wie ich vorgegangen bin.",
    learnerNextAction: "Gut. Eine spätere Wiederholung prüft die Idee noch einmal mit neuen Zahlen.",
    parentNextAction: "Beim normalen Review-Rhythmus bleiben; zusätzliche Aufgaben sind nicht nötig.",
    concern: false,
  },
  "more-practice": {
    label: "Ich brauche noch Übung",
    detail: "Die Idee ist da, aber mit neuen Zahlen bin ich noch unsicher.",
    learnerNextAction: "Wenn du noch Energie hast, löse eine frische Variante derselben Idee.",
    parentNextAction: "Eine frische Aufgabe mit derselben Idee lösen und danach bewusst aufhören.",
    concern: true,
  },
  "explanation-unclear": {
    label: "Die Erklärung war noch unklar",
    detail: "Ich brauche einen anderen Zugang zur Grundidee.",
    learnerNextAction: "Öffne die Grundidee im Konzept-Labor und bewege sie Schritt für Schritt.",
    parentNextAction: "Die Grundidee im Konzept-Labor anders darstellen und erst danach neu prüfen.",
    concern: true,
  },
  "question-unclear": {
    label: "Die Aufgabe war unklar",
    detail: "Ich wusste nicht genau, was gefragt oder gegeben war.",
    learnerNextAction: "Öffne die Grundidee und trenne die nächste Aufgabe in Gegeben und Gesucht.",
    parentNextAction: "Die nächste Aufgabe zuerst in Gegeben, Gesucht und Rechenweg zerlegen.",
    concern: true,
  },
  "too-much": {
    label: "Es war zu viel auf einmal",
    detail: "Ich brauche eine kürzere Runde oder eine Pause.",
    learnerNextAction: "Für heute darf Schluss sein. Der Lernplan bleibt gespeichert.",
    parentNextAction: "Die nächste Einheit kurz halten und nur einen Lernschritt einplanen.",
    concern: true,
  },
}

export const englishLearnerFeedbackCopy: Record<LearnerFeedbackKind, LearnerFeedbackCopy> = {
  clear: {
    label: "The idea is clear",
    detail: "I could explain to someone how I approached it.",
    learnerNextAction: "Good. A later review will check the idea again with new values.",
    parentNextAction: "Keep the normal review rhythm; extra questions are not needed.",
    concern: false,
  },
  "more-practice": {
    label: "I still need practice",
    detail: "I understand the idea, but new values still make me uncertain.",
    learnerNextAction: "If you still have energy, solve a fresh version of the same idea.",
    parentNextAction: "Solve one fresh question with the same idea, then stop deliberately.",
    concern: true,
  },
  "explanation-unclear": {
    label: "The explanation was still unclear",
    detail: "I need a different way into the key idea.",
    learnerNextAction: "Open the key idea in the concept lab and move through it step by step.",
    parentNextAction: "Present the key idea differently in the concept lab before checking again.",
    concern: true,
  },
  "question-unclear": {
    label: "The question was unclear",
    detail: "I was not sure exactly what was given or being asked.",
    learnerNextAction: "Open the key idea and separate the next question into given and wanted.",
    parentNextAction: "First separate the next question into given, wanted, and calculation path.",
    concern: true,
  },
  "too-much": {
    label: "It was too much at once",
    detail: "I need a shorter round or a break.",
    learnerNextAction: "You may stop for today. Your learning plan remains stored.",
    parentNextAction: "Keep the next session short and plan only one learning step.",
    concern: true,
  },
}

export const italianLearnerFeedbackCopy: Record<LearnerFeedbackKind, LearnerFeedbackCopy> = {
  clear: {
    label: "L'idea è chiara",
    detail: "Potrei spiegare a qualcuno come ho proceduto.",
    learnerNextAction: "Bene. Un ripasso successivo controllerà di nuovo l'idea con valori nuovi.",
    parentNextAction: "Mantieni il ritmo normale dei ripassi; non servono esercizi aggiuntivi.",
    concern: false,
  },
  "more-practice": {
    label: "Ho ancora bisogno di esercitarmi",
    detail: "Ho capito l'idea, ma con valori nuovi sono ancora incerto.",
    learnerNextAction: "Se hai ancora energia, risolvi una variante nuova della stessa idea.",
    parentNextAction: "Risolvete una domanda nuova con la stessa idea, poi fermatevi consapevolmente.",
    concern: true,
  },
  "explanation-unclear": {
    label: "La spiegazione non era ancora chiara",
    detail: "Ho bisogno di un altro modo per arrivare all'idea chiave.",
    learnerNextAction: "Apri l'idea chiave nel laboratorio dei concetti e percorrila passo dopo passo.",
    parentNextAction: "Presenta diversamente l'idea chiave nel laboratorio dei concetti prima di controllare di nuovo.",
    concern: true,
  },
  "question-unclear": {
    label: "La domanda non era chiara",
    detail: "Non ero sicuro di che cosa fosse dato o richiesto.",
    learnerNextAction: "Apri l'idea chiave e separa la prossima domanda in dati e obiettivo.",
    parentNextAction: "Dividi prima la prossima domanda in dati, obiettivo e procedimento.",
    concern: true,
  },
  "too-much": {
    label: "Era troppo tutto insieme",
    detail: "Ho bisogno di un giro più breve o di una pausa.",
    learnerNextAction: "Per oggi puoi fermarti. Il tuo piano di studio resta salvato.",
    parentNextAction: "Mantieni breve la prossima sessione e pianifica un solo passaggio di apprendimento.",
    concern: true,
  },
}

export const spanishLearnerFeedbackCopy: Record<LearnerFeedbackKind, LearnerFeedbackCopy> = {
  clear: {
    label: "La idea está clara",
    detail: "Podría explicar a otra persona cómo lo he resuelto.",
    learnerNextAction: "Bien. Un repaso posterior volverá a comprobar la idea con valores nuevos.",
    parentNextAction: "Mantén el ritmo normal de repasos; no hacen falta preguntas adicionales.",
    concern: false,
  },
  "more-practice": {
    label: "Todavía necesito practicar",
    detail: "Entiendo la idea, pero los valores nuevos aún me hacen dudar.",
    learnerNextAction: "Si todavía tienes energía, resuelve una variante nueva de la misma idea.",
    parentNextAction: "Resuelvan una pregunta nueva con la misma idea y después paren de forma consciente.",
    concern: true,
  },
  "explanation-unclear": {
    label: "La explicación todavía no estaba clara",
    detail: "Necesito otra manera de llegar a la idea clave.",
    learnerNextAction: "Abre la idea clave en el laboratorio de conceptos y recórrela paso a paso.",
    parentNextAction: "Presenta la idea clave de otra forma en el laboratorio de conceptos antes de volver a comprobarla.",
    concern: true,
  },
  "question-unclear": {
    label: "La pregunta no estaba clara",
    detail: "No sabía exactamente qué se daba o qué se pedía.",
    learnerNextAction: "Abre la idea clave y separa la siguiente pregunta en datos y objetivo.",
    parentNextAction: "Separa primero la siguiente pregunta en datos, objetivo y procedimiento.",
    concern: true,
  },
  "too-much": {
    label: "Era demasiado de una vez",
    detail: "Necesito una sesión más corta o una pausa.",
    learnerNextAction: "Puedes parar por hoy. Tu plan de aprendizaje queda guardado.",
    parentNextAction: "Mantén breve la próxima sesión y planifica un solo paso de aprendizaje.",
    concern: true,
  },
}

export function learnerFeedbackCopyForLanguage(
  locale: LearningLocale,
): Record<LearnerFeedbackKind, LearnerFeedbackCopy> {
  return locale === "en"
    ? englishLearnerFeedbackCopy
    : locale === "it"
      ? italianLearnerFeedbackCopy
      : locale === "es"
        ? spanishLearnerFeedbackCopy
        : learnerFeedbackCopy
}

export function feedbackForEvent(
  learner: LearnerState,
  learningEventId: string,
): LearnerFeedback | undefined {
  return learner.learnerFeedback.find((feedback) => (
    feedback.learningEventId === learningEventId
  ))
}

/**
 * Records one append-only learner signal for a completed round. Repeated calls
 * for the same event are idempotent, which prevents double taps from creating
 * duplicate feedback or changing the first submitted signal.
 */
export function recordLearnerFeedback(
  learner: LearnerState,
  learningEventId: string,
  kind: LearnerFeedbackKind,
  now = new Date(),
): LearnerState {
  const event = learner.learningEvents.find((candidate) => candidate.id === learningEventId)
  if (!event || feedbackForEvent(learner, learningEventId)) return learner

  const feedback: LearnerFeedback = {
    id: `feedback:${learningEventId}`,
    learningEventId,
    taskId: event.taskId,
    taskKind: event.taskKind,
    topicIds: [...event.topicIds],
    kind,
    recordedAt: now.toISOString(),
  }

  return {
    ...learner,
    updatedAt: feedback.recordedAt,
    learnerFeedback: [...learner.learnerFeedback, feedback],
  }
}

export function recentLearnerFeedback(
  learner: LearnerState,
  now = new Date(),
  days = 30,
): LearnerFeedback[] {
  const earliest = now.getTime() - days * 24 * 60 * 60 * 1000
  return learner.learnerFeedback.filter((feedback) => (
    Date.parse(feedback.recordedAt) >= earliest
  ))
}
