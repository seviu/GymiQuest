import { topicForLocale } from "../i18n/curriculumContent"
import type {
  LearningEvent,
  LearningLocale,
  LearnerState,
  QuestionResult,
  TaskKind,
  TopicId,
} from "./model"

/**
 * Known outcome, consistent with sessionReview: an independently solved
 * question is always assessable; otherwise fall back to solved evidence
 * (`solved ?? diagnostic?.resolved`). Legacy non-independent results without
 * either stay not-assessable — no manufactured certainty, and the independent
 * numerator can never exceed the assessable denominator.
 */
function knownSolved(result: QuestionResult): boolean | undefined {
  if (result.independentlySolved) return true
  return result.solved ?? result.diagnostic?.resolved
}

function isAssessable(result: QuestionResult): boolean {
  return knownSolved(result) !== undefined
}

/** Detail rows are bounded so the report stays readable; aggregates use the full history. */
const EXERCISE_DETAIL_LIMIT = 50
const SLOWEST_LIMIT = 5

export interface TeacherReportExercise {
  completedAt: string
  taskKind: TaskKind
  topicIds: TopicId[]
  questionCount: number
  /** Questions marked independently solved; see assessableCount for the base. */
  independentlySolvedCount: number
  /** Older events omit `solved`; only assessable questions ground a success rate. */
  assessableCount: number
  mistakes: number
  hintsUsed: number
  activeSeconds: number
}

export interface TeacherReportTopicRow {
  topicId: TopicId
  exerciseCount: number
  questionCount: number
  independentlySolvedCount: number
  assessableCount: number
  mistakes: number
  hintsUsed: number
  activeSeconds: number
}

export interface TeacherReport {
  generatedAt: string
  displayName: string
  exerciseCount: number
  exerciseCountByKind: Record<TaskKind, number>
  questionCount: number
  independentlySolvedCount: number
  assessableCount: number
  mistakes: number
  hintsUsed: number
  activeSeconds: number
  topicRows: TeacherReportTopicRow[]
  exercises: TeacherReportExercise[]
  slowest: TeacherReportExercise[]
}

function toExercise(event: LearningEvent): TeacherReportExercise {
  return {
    completedAt: event.completedAt,
    taskKind: event.taskKind,
    topicIds: event.topicIds,
    questionCount: event.questionResults.length,
    independentlySolvedCount: event.questionResults.filter((question) => question.independentlySolved).length,
    assessableCount: event.questionResults.filter(isAssessable).length,
    mistakes: event.mistakes,
    hintsUsed: event.hintsUsed,
    activeSeconds: event.activeSeconds,
  }
}

export function buildTeacherReport(
  state: LearnerState,
  generatedAt = new Date(),
): TeacherReport {
  const events = [...state.learningEvents].sort((left, right) =>
    right.completedAt.localeCompare(left.completedAt),
  )
  const topics = new Map<TopicId, TeacherReportTopicRow>()
  const report: TeacherReport = {
    generatedAt: generatedAt.toISOString(),
    displayName: state.displayName,
    exerciseCount: events.length,
    exerciseCountByKind: { lesson: 0, review: 0, assessment: 0, repair: 0, placement: 0 },
    questionCount: 0,
    independentlySolvedCount: 0,
    assessableCount: 0,
    mistakes: 0,
    hintsUsed: 0,
    activeSeconds: 0,
    topicRows: [],
    exercises: events.slice(0, EXERCISE_DETAIL_LIMIT).map(toExercise),
    slowest: [...events]
      .sort((left, right) => right.activeSeconds - left.activeSeconds)
      .slice(0, SLOWEST_LIMIT)
      .map(toExercise),
  }

  for (const event of events) {
    const exercise = toExercise(event)
    report.exerciseCountByKind[event.taskKind] += 1
    report.questionCount += exercise.questionCount
    report.independentlySolvedCount += exercise.independentlySolvedCount
    report.assessableCount += exercise.assessableCount
    report.mistakes += exercise.mistakes
    report.hintsUsed += exercise.hintsUsed
    report.activeSeconds += exercise.activeSeconds

    for (const topicId of event.topicIds) {
      let row = topics.get(topicId)
      if (!row) {
        row = {
          topicId,
          exerciseCount: 0,
          questionCount: 0,
          independentlySolvedCount: 0,
          assessableCount: 0,
          mistakes: 0,
          hintsUsed: 0,
          activeSeconds: 0,
        }
        topics.set(topicId, row)
      }
      row.exerciseCount += 1
      // Exact per-topic numbers come from the per-question results; event-level
      // totals cannot be split across a multi-topic round without double counting.
      for (const questionResult of event.questionResults) {
        if (questionResult.topicId !== topicId) continue
        row.questionCount += 1
        row.independentlySolvedCount += questionResult.independentlySolved ? 1 : 0
        row.assessableCount += isAssessable(questionResult) ? 1 : 0
        // Wrong submissions: every attempt when never solved, all but the final
        // one when solved (outcome unknown for legacy results → count attempts − 1).
        row.mistakes += knownSolved(questionResult) === false
          ? questionResult.attempts
          : Math.max(0, questionResult.attempts - 1)
        row.hintsUsed += questionResult.hintsUsed
        row.activeSeconds += questionResult.activeSeconds
      }
    }
  }
  report.topicRows = [...topics.values()].sort(
    (left, right) => right.exerciseCount - left.exerciseCount || left.topicId.localeCompare(right.topicId),
  )
  return report
}

interface TeacherReportLabels {
  title: string
  generatedAt: string
  profile: string
  privacyNote: string
  summary: string
  rounds: string
  questions: string
  independent: string
  assessableOf: (count: number) => string
  mistakes: string
  hints: string
  activeTime: string
  topics: string
  detail: string
  newestFirst: string
  slowest: string
  noData: string
  kindLabels: Record<TaskKind, string>
  headers: {
    topic: string
    roundsShort: string
    questionsShort: string
    independentShort: string
    mistakesShort: string
    hintsShort: string
    time: string
    date: string
    kind: string
  }
}

const LABELS: Record<LearningLocale, TeacherReportLabels> = {
  de: {
    title: "Lernbericht für die Lehrperson",
    generatedAt: "Stand",
    profile: "Profil",
    privacyNote: "Lokal auf diesem Gerät erstellt. Enthält keine eingegebenen Antworten, keine Noten und keine persönlichen Angaben über das Profil hinaus.",
    summary: "Zusammenfassung",
    rounds: "Übungsrunden",
    questions: "Fragen gesamt",
    independent: "Selbstständig gelöst",
    assessableOf: (count) => `von ${count} bewertbaren Fragen`,
    mistakes: "Falsche Antworten",
    hints: "Hinweise genutzt",
    activeTime: "Aktive Übungszeit",
    topics: "Themen",
    detail: "Übungen im Detail",
    newestFirst: "neueste zuerst",
    slowest: "Zeitaufwendigste Übungen",
    noData: "Noch keine Übungen erfasst.",
    kindLabels: {
      lesson: "Lektion",
      review: "Wiederholung",
      assessment: "Standortbestimmung",
      repair: "Reparatur",
      placement: "Start-Check",
    },
    headers: {
      topic: "Thema",
      roundsShort: "Runden",
      questionsShort: "Fragen",
      independentShort: "Selbstständig",
      mistakesShort: "Fehler",
      hintsShort: "Hinweise",
      time: "Zeit",
      date: "Datum",
      kind: "Art",
    },
  },
  en: {
    title: "Mathematics progress report for the teacher",
    generatedAt: "Date",
    profile: "Profile",
    privacyNote: "Created locally on this device. Contains no typed answers, no grades, and no personal data beyond the profile.",
    summary: "Summary",
    rounds: "Practice rounds",
    questions: "Questions total",
    independent: "Solved independently",
    assessableOf: (count) => `of ${count} assessable questions`,
    mistakes: "Wrong answers",
    hints: "Hints used",
    activeTime: "Active practice time",
    topics: "Topics",
    detail: "Exercises in detail",
    newestFirst: "newest first",
    slowest: "Most time-intensive exercises",
    noData: "No exercises recorded yet.",
    kindLabels: {
      lesson: "Lesson",
      review: "Review",
      assessment: "Assessment",
      repair: "Repair",
      placement: "Placement",
    },
    headers: {
      topic: "Topic",
      roundsShort: "Rounds",
      questionsShort: "Questions",
      independentShort: "Independent",
      mistakesShort: "Mistakes",
      hintsShort: "Hints",
      time: "Time",
      date: "Date",
      kind: "Type",
    },
  },
  it: {
    title: "Rapporto di apprendimento per l'insegnante",
    generatedAt: "Data",
    profile: "Profilo",
    privacyNote: "Creato localmente su questo dispositivo. Non contiene risposte digitate, voti né dati personali oltre al profilo.",
    summary: "Riepilogo",
    rounds: "Sessioni di esercizio",
    questions: "Domande totali",
    independent: "Risolte autonomamente",
    assessableOf: (count) => `di ${count} domande valutabili`,
    mistakes: "Risposte errate",
    hints: "Suggerimenti usati",
    activeTime: "Tempo di esercizio attivo",
    topics: "Argomenti",
    detail: "Esercizi in dettaglio",
    newestFirst: "più recenti prima",
    slowest: "Esercizi più lunghi",
    noData: "Nessun esercizio registrato finora.",
    kindLabels: {
      lesson: "Lezione",
      review: "Ripasso",
      assessment: "Verifica",
      repair: "Riparazione",
      placement: "Test iniziale",
    },
    headers: {
      topic: "Argomento",
      roundsShort: "Sessioni",
      questionsShort: "Domande",
      independentShort: "Autonomo",
      mistakesShort: "Errori",
      hintsShort: "Suggerimenti",
      time: "Tempo",
      date: "Data",
      kind: "Tipo",
    },
  },
  es: {
    title: "Informe de aprendizaje para el docente",
    generatedAt: "Fecha",
    profile: "Perfil",
    privacyNote: "Creado localmente en este dispositivo. No contiene respuestas escritas, notas ni datos personales más allá del perfil.",
    summary: "Resumen",
    rounds: "Sesiones de práctica",
    questions: "Preguntas totales",
    independent: "Resueltas de forma autónoma",
    assessableOf: (count) => `de ${count} preguntas evaluables`,
    mistakes: "Respuestas incorrectas",
    hints: "Pistas usadas",
    activeTime: "Tiempo de práctica activa",
    topics: "Temas",
    detail: "Ejercicios en detalle",
    newestFirst: "más recientes primero",
    slowest: "Ejercicios más largos",
    noData: "Todavía no hay ejercicios registrados.",
    kindLabels: {
      lesson: "Lección",
      review: "Repaso",
      assessment: "Evaluación",
      repair: "Reparación",
      placement: "Prueba inicial",
    },
    headers: {
      topic: "Tema",
      roundsShort: "Sesiones",
      questionsShort: "Preguntas",
      independentShort: "Autónomo",
      mistakesShort: "Incorrectas",
      hintsShort: "Pistas",
      time: "Tiempo",
      date: "Fecha",
      kind: "Tipo",
    },
  },
}

const numberFormatTag = (locale: LearningLocale): string =>
  locale === "en" ? "en-GB" : locale === "it" ? "it-CH" : locale === "es" ? "es-ES" : "de-CH"

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  if (minutes < 1) return `${Math.max(1, Math.round(seconds))} s`
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

function formatPercent(independent: number, assessable: number, locale: LearningLocale): string {
  if (assessable === 0) return "–"
  return `${new Intl.NumberFormat(numberFormatTag(locale), { maximumFractionDigits: 0 }).format((independent / assessable) * 100)} %`
}

function formatExerciseRow(
  exercise: TeacherReportExercise,
  labels: TeacherReportLabels,
  locale: LearningLocale,
): string {
  const date = new Intl.DateTimeFormat(numberFormatTag(locale), { dateStyle: "short" }).format(new Date(exercise.completedAt))
  const topics = exercise.topicIds.map((topicId) => topicForLocale(topicId, locale).shortTitle).join(", ")
  const independent = exercise.assessableCount === 0
    ? "–"
    : `${exercise.independentlySolvedCount}/${exercise.assessableCount}`
  return `| ${date} | ${labels.kindLabels[exercise.taskKind]} | ${topics} | ${exercise.questionCount} | ${independent} | ${exercise.mistakes} | ${exercise.hintsUsed} | ${formatDuration(exercise.activeSeconds)} |`
}

export function formatTeacherReportMarkdown(
  report: TeacherReport,
  locale: LearningLocale = "de",
): string {
  const labels = LABELS[locale]
  const headers = labels.headers
  const lines: string[] = [
    `# ${labels.title} — GymiQuest Mathematik`,
    "",
    `${labels.generatedAt}: ${new Intl.DateTimeFormat(numberFormatTag(locale), { dateStyle: "long" }).format(new Date(report.generatedAt))} · ${labels.profile}: ${report.displayName}`,
    "",
    `_${labels.privacyNote}_`,
    "",
    `## ${labels.summary}`,
    "",
  ]

  if (report.exerciseCount === 0) {
    lines.push(labels.noData, "")
    return lines.join("\n")
  }

  const kindSummary = (Object.keys(labels.kindLabels) as TaskKind[])
    .filter((kind) => report.exerciseCountByKind[kind] > 0)
    .map((kind) => `${labels.kindLabels[kind]} ${report.exerciseCountByKind[kind]}`)
    .join(", ")
  lines.push(
    `- ${labels.rounds}: ${report.exerciseCount} (${kindSummary})`,
    `- ${labels.questions}: ${report.questionCount}`,
    `- ${labels.independent}: ${formatPercent(report.independentlySolvedCount, report.assessableCount, locale)} (${labels.assessableOf(report.assessableCount)})`,
    `- ${labels.mistakes}: ${report.mistakes}`,
    `- ${labels.hints}: ${report.hintsUsed}`,
    `- ${labels.activeTime}: ${formatDuration(report.activeSeconds)}`,
    "",
    `## ${labels.topics}`,
    "",
    `| ${headers.topic} | ${headers.roundsShort} | ${headers.questionsShort} | ${headers.independentShort} | ${headers.mistakesShort} | ${headers.hintsShort} | ${headers.time} |`,
    "|---|---:|---:|---:|---:|---:|---:|",
    ...report.topicRows.map((row) =>
      `| ${topicForLocale(row.topicId, locale).shortTitle} | ${row.exerciseCount} | ${row.questionCount} | ${formatPercent(row.independentlySolvedCount, row.assessableCount, locale)} | ${row.mistakes} | ${row.hintsUsed} | ${formatDuration(row.activeSeconds)} |`,
    ),
    "",
    `## ${labels.detail} (${labels.newestFirst})`,
    "",
    `| ${headers.date} | ${headers.kind} | ${headers.topic} | ${headers.questionsShort} | ${headers.independentShort} | ${headers.mistakesShort} | ${headers.hintsShort} | ${headers.time} |`,
    "|---|---|---|---:|---:|---:|---:|---:|",
    ...report.exercises.map((exercise) => formatExerciseRow(exercise, labels, locale)),
    "",
    `## ${labels.slowest}`,
    "",
    `| ${headers.date} | ${headers.kind} | ${headers.topic} | ${headers.questionsShort} | ${headers.independentShort} | ${headers.mistakesShort} | ${headers.hintsShort} | ${headers.time} |`,
    "|---|---|---|---:|---:|---:|---:|---:|",
    ...report.slowest.map((exercise) => formatExerciseRow(exercise, labels, locale)),
    "",
  )
  return lines.join("\n")
}

export function teacherReportFilename(report: TeacherReport): string {
  return `gymiquest-lernbericht-${report.generatedAt.slice(0, 10)}.md`
}
