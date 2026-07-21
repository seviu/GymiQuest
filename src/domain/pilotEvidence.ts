import type { LearnerState, LearningEvent } from "./model"

export type PilotAssessmentComparison = "insufficient" | "higher" | "lower" | "same"

export interface PilotWeekEvidence {
  weekStartDateKey: string
  weekEndDateKey: string
  activeDays: number
  sessions: number
  activeSeconds: number
  questions: number
  independentQuestions: number
  independentRate: number
  assessments: number
  learnerSignals: number
}

export interface PilotAssessmentEvidence {
  eventId: string
  completedAt: string
  questions: number
  independentQuestions: number
  independentRate: number
}

export interface PilotEvidence {
  sessions: number
  activeSeconds: number
  activeDays: number
  calendarWeeks: number
  calendarCoverageMet: boolean
  observedSpanDays: number
  questions: number
  independentQuestions: number
  independentRate: number
  learnerSignals: number
  weeks: PilotWeekEvidence[]
  assessments: PilotAssessmentEvidence[]
  assessmentComparison: PilotAssessmentComparison
  assessmentChangePoints?: number
  firstCompletedAt?: string
  latestCompletedAt?: string
}

interface MutablePilotWeek {
  weekStartDateKey: string
  weekEndDateKey: string
  activeDateKeys: Set<string>
  events: LearningEvent[]
  learnerSignals: number
}

function localDateKey(value: string | Date, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => (
    parts.find((entry) => entry.type === type)?.value ?? ""
  )
  return `${part("year")}-${part("month")}-${part("day")}`
}

function shiftDateKey(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year!, month! - 1, day! + days, 12))
    .toISOString()
    .slice(0, 10)
}

function weekStartDateKey(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  return shiftDateKey(value, -daysSinceMonday)
}

function inclusiveDateSpan(first: string, latest: string): number {
  const start = Date.parse(`${first}T12:00:00.000Z`)
  const end = Date.parse(`${latest}T12:00:00.000Z`)
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1)
}

function independentRate(events: LearningEvent[]): number {
  const questions = events.flatMap((event) => event.questionResults)
  if (questions.length === 0) return 0
  const independent = questions.filter((result) => result.independentlySolved).length
  return Math.round(independent / questions.length * 100)
}

function isPilotEvent(event: LearningEvent, now: Date): boolean {
  const completedAt = Date.parse(event.completedAt)
  return (
    event.taskKind !== "placement" &&
    Number.isFinite(completedAt) &&
    completedAt <= now.getTime()
  )
}

function assessmentEvidence(event: LearningEvent): PilotAssessmentEvidence {
  const questions = event.questionResults.length
  const independentQuestions = event.questionResults.filter(
    (result) => result.independentlySolved,
  ).length
  return {
    eventId: event.id,
    completedAt: event.completedAt,
    questions,
    independentQuestions,
    independentRate: questions === 0
      ? 0
      : Math.round(independentQuestions / questions * 100),
  }
}

/**
 * Derives a bounded pilot record from mathematical evidence already stored on
 * the learner profile. It deliberately cannot infer whether an adult coached a
 * round, whether the learner returned voluntarily, or whether a paper task was
 * genuinely unseen; those remain human observations.
 */
export function buildPilotEvidence(
  learner: LearnerState,
  now = new Date(),
  timeZone = "Europe/Zurich",
): PilotEvidence {
  const events = learner.learningEvents
    .filter((event) => isPilotEvent(event, now))
    .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
  const feedbackEventIds = new Set(
    learner.learnerFeedback
      .filter((feedback) => {
        const recordedAt = Date.parse(feedback.recordedAt)
        return Number.isFinite(recordedAt) && recordedAt <= now.getTime()
      })
      .map((feedback) => feedback.learningEventId),
  )
  const mutableWeeks = new Map<string, MutablePilotWeek>()

  for (const event of events) {
    const dateKey = localDateKey(event.completedAt, timeZone)
    const start = weekStartDateKey(dateKey)
    const current = mutableWeeks.get(start) ?? {
      weekStartDateKey: start,
      weekEndDateKey: shiftDateKey(start, 6),
      activeDateKeys: new Set<string>(),
      events: [],
      learnerSignals: 0,
    }
    current.activeDateKeys.add(dateKey)
    current.events.push(event)
    if (feedbackEventIds.has(event.id)) current.learnerSignals += 1
    mutableWeeks.set(start, current)
  }

  const weeks = [...mutableWeeks.values()]
    .sort((left, right) => left.weekStartDateKey.localeCompare(right.weekStartDateKey))
    .map((week): PilotWeekEvidence => {
      const questions = week.events.flatMap((event) => event.questionResults)
      const independentQuestions = questions.filter(
        (result) => result.independentlySolved,
      ).length
      return {
        weekStartDateKey: week.weekStartDateKey,
        weekEndDateKey: week.weekEndDateKey,
        activeDays: week.activeDateKeys.size,
        sessions: week.events.length,
        activeSeconds: week.events.reduce((sum, event) => sum + event.activeSeconds, 0),
        questions: questions.length,
        independentQuestions,
        independentRate: questions.length === 0
          ? 0
          : Math.round(independentQuestions / questions.length * 100),
        assessments: week.events.filter((event) => event.taskKind === "assessment").length,
        learnerSignals: week.learnerSignals,
      }
    })

  const questions = events.flatMap((event) => event.questionResults)
  const independentQuestions = questions.filter((result) => result.independentlySolved).length
  const assessments = events
    .filter((event) => event.taskKind === "assessment" && event.questionResults.length > 0)
    .map(assessmentEvidence)
  const firstAssessment = assessments[0]
  const latestAssessment = assessments.at(-1)
  let assessmentComparison: PilotAssessmentComparison = "insufficient"
  let assessmentChangePoints: number | undefined
  if (firstAssessment && latestAssessment && firstAssessment !== latestAssessment) {
    assessmentChangePoints = latestAssessment.independentRate - firstAssessment.independentRate
    assessmentComparison = assessmentChangePoints > 0
      ? "higher"
      : assessmentChangePoints < 0
        ? "lower"
        : "same"
  }

  const activeDateKeys = new Set(
    events.map((event) => localDateKey(event.completedAt, timeZone)),
  )
  const orderedDateKeys = [...activeDateKeys].sort()

  return {
    sessions: events.length,
    activeSeconds: events.reduce((sum, event) => sum + event.activeSeconds, 0),
    activeDays: activeDateKeys.size,
    calendarWeeks: weeks.length,
    calendarCoverageMet: weeks.length >= 3,
    observedSpanDays: orderedDateKeys.length === 0
      ? 0
      : inclusiveDateSpan(orderedDateKeys[0]!, orderedDateKeys.at(-1)!),
    questions: questions.length,
    independentQuestions,
    independentRate: independentRate(events),
    learnerSignals: weeks.reduce((sum, week) => sum + week.learnerSignals, 0),
    weeks,
    assessments,
    assessmentComparison,
    ...(assessmentChangePoints === undefined ? {} : { assessmentChangePoints }),
    ...(events[0] ? { firstCompletedAt: events[0].completedAt } : {}),
    ...(events.at(-1) ? { latestCompletedAt: events.at(-1)!.completedAt } : {}),
  }
}
