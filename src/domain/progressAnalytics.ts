import type { LearnerState, LearningEvent } from "./model"

export interface DailyActivity {
  dateKey: string
  label: string
  activeSeconds: number
  sessions: number
}

export interface ProgressAnalytics {
  days: DailyActivity[]
  activeSeconds: number
  sessions: number
  questions: number
  independentQuestions: number
  independentRate: number
  lessons: number
  reviews: number
  assessments: number
  placements: number
}

function dateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ""
  return `${value("year")}-${value("month")}-${value("day")}`
}

function shiftedDateKey(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year!, month! - 1, day! + days, 12))
    .toISOString()
    .slice(0, 10)
}

function weekdayLabel(value: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${value}T12:00:00.000Z`)).replace(".", "")
}

function eventsInRange(
  events: LearningEvent[],
  dateKeys: Set<string>,
  timeZone: string,
): LearningEvent[] {
  return events.filter((event) => dateKeys.has(dateKey(new Date(event.completedAt), timeZone)))
}

export function buildProgressAnalytics(
  learner: LearnerState,
  now = new Date(),
  timeZone = "Europe/Zurich",
  intlLocale = "de-CH",
): ProgressAnalytics {
  const todayKey = dateKey(now, timeZone)
  const days = Array.from({ length: 7 }, (_, index): DailyActivity => {
    const currentDateKey = shiftedDateKey(todayKey, index - 6)
    return {
      dateKey: currentDateKey,
      label: weekdayLabel(currentDateKey, intlLocale),
      activeSeconds: 0,
      sessions: 0,
    }
  })
  const byDate = new Map(days.map((day) => [day.dateKey, day]))
  const weeklyEvents = eventsInRange(
    learner.learningEvents,
    new Set(days.map((day) => day.dateKey)),
    timeZone,
  )

  for (const event of weeklyEvents) {
    const day = byDate.get(dateKey(new Date(event.completedAt), timeZone))
    if (!day) continue
    day.activeSeconds += event.activeSeconds
    day.sessions += 1
  }

  const questionResults = weeklyEvents.flatMap((event) => event.questionResults)
  const independentQuestions = questionResults.filter(
    (result) => result.independentlySolved,
  ).length

  return {
    days,
    activeSeconds: weeklyEvents.reduce((sum, event) => sum + event.activeSeconds, 0),
    sessions: weeklyEvents.length,
    questions: questionResults.length,
    independentQuestions,
    independentRate: questionResults.length === 0
      ? 0
      : Math.round((independentQuestions / questionResults.length) * 100),
    lessons: weeklyEvents.filter(
      (event) => event.taskKind === "lesson" || event.taskPurpose === "lesson-recovery",
    ).length,
    reviews: weeklyEvents.filter(
      (event) => event.taskKind === "review" || (
        event.taskKind === "repair" && event.taskPurpose !== "lesson-recovery"
      ),
    ).length,
    assessments: weeklyEvents.filter((event) => event.taskKind === "assessment").length,
    placements: weeklyEvents.filter((event) => event.taskKind === "placement").length,
  }
}
