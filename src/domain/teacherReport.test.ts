import { describe, expect, it } from "vitest"
import { createInitialLearner } from "./learningEngine"
import {
  buildTeacherReport,
  formatTeacherReportMarkdown,
  teacherReportFilename,
} from "./teacherReport"
import type { LearningEvent, LearnerState, QuestionResult } from "./model"

function question(overrides: Partial<QuestionResult>): QuestionResult {
  return {
    questionId: "q",
    topicId: "mass-units",
    attempts: 1,
    hintsUsed: 0,
    activeSeconds: 30,
    independentlySolved: true,
    solved: true,
    ...overrides,
  }
}

function event(overrides: Partial<LearningEvent>): LearningEvent {
  return {
    id: "event",
    taskId: "task",
    taskKind: "lesson",
    topicIds: ["mass-units"],
    completedAt: "2026-08-01T10:00:00.000Z",
    activeSeconds: 120,
    mistakes: 0,
    hintsUsed: 0,
    independentlyCompleted: true,
    questionResults: [],
    ...overrides,
  }
}

function stateWith(events: LearningEvent[]): LearnerState {
  const state = createInitialLearner(new Date("2026-07-01T08:00:00.000Z"))
  state.learningEvents = events
  return state
}

const events: LearningEvent[] = [
  event({
    id: "older",
    taskKind: "lesson",
    topicIds: ["mass-units"],
    completedAt: "2026-08-01T10:00:00.000Z",
    activeSeconds: 120,
    mistakes: 1,
    questionResults: [
      question({ questionId: "a", independentlySolved: true, solved: true }),
      question({ questionId: "b", independentlySolved: false, solved: false, hintsUsed: 2 }),
    ],
    hintsUsed: 2,
  }),
  event({
    id: "newer-slow",
    taskKind: "review",
    topicIds: ["mass-units", "time-fractions"],
    completedAt: "2026-08-03T09:00:00.000Z",
    activeSeconds: 600,
    mistakes: 2,
    hintsUsed: 1,
    independentlyCompleted: false,
    questionResults: [
      question({ questionId: "c", topicId: "mass-units", independentlySolved: false, solved: true }),
      // legacy result without solved: not assessable for a success rate
      question({ questionId: "d", topicId: "time-fractions", independentlySolved: false, solved: undefined }),
    ],
  }),
]

describe("teacher report", () => {
  it("aggregates totals, kinds, and an assessable success base across the full history", () => {
    const report = buildTeacherReport(stateWith(events), new Date("2026-08-05T12:00:00.000Z"))

    expect(report.exerciseCount).toBe(2)
    expect(report.exerciseCountByKind).toMatchObject({ lesson: 1, review: 1, assessment: 0 })
    expect(report.questionCount).toBe(4)
    expect(report.independentlySolvedCount).toBe(1)
    expect(report.assessableCount).toBe(3)
    expect(report.mistakes).toBe(3)
    expect(report.hintsUsed).toBe(3)
    expect(report.activeSeconds).toBe(720)
    expect(report.generatedAt).toBe("2026-08-05T12:00:00.000Z")
  })

  it("aggregates topic rows over every event and sorts by exercise count", () => {
    const report = buildTeacherReport(stateWith(events))

    expect(report.topicRows.map((row) => row.topicId)).toEqual(["mass-units", "time-fractions"])
    expect(report.topicRows[0]).toMatchObject({
      exerciseCount: 2,
      questionCount: 3,
      independentlySolvedCount: 1,
      assessableCount: 3,
      mistakes: 1, // question b (never solved, 1 attempt); a and c solved first try
      hintsUsed: 2, // per-question hints: b used 2
      activeSeconds: 90, // per-question seconds: a + b + c
    })
    expect(report.topicRows[1]).toMatchObject({
      exerciseCount: 1,
      questionCount: 1,
      assessableCount: 0,
    })
  })

  it("lists exercises newest first and ranks the slowest by active time", () => {
    const report = buildTeacherReport(stateWith(events))

    expect(report.exercises.map((exercise) => exercise.completedAt)).toEqual([
      "2026-08-03T09:00:00.000Z",
      "2026-08-01T10:00:00.000Z",
    ])
    expect(report.slowest[0]).toMatchObject({ completedAt: "2026-08-03T09:00:00.000Z", activeSeconds: 600 })
    expect(report.slowest[1]).toMatchObject({ activeSeconds: 120 })
  })

  it("keeps the independent rate inside its assessable base for legacy results", () => {
    // Legacy events omit `solved`; independent results are still assessable,
    // so the numerator can never outrun the denominator (no >100%, no false "–").
    const legacy = event({
      id: "legacy",
      taskKind: "lesson",
      questionResults: [
        question({ questionId: "e", independentlySolved: true, solved: undefined }),
        question({ questionId: "f", independentlySolved: false, solved: undefined }),
      ],
    })
    const report = buildTeacherReport(stateWith([legacy]), new Date("2026-08-05T12:00:00.000Z"))

    expect(report.questionCount).toBe(2)
    expect(report.independentlySolvedCount).toBe(1)
    expect(report.assessableCount).toBe(1)
    expect(report.topicRows[0]).toMatchObject({
      independentlySolvedCount: 1,
      assessableCount: 1,
      mistakes: 0,
    })

    const markdown = formatTeacherReportMarkdown(report, "de")
    expect(markdown).toContain("100 %")
    expect(markdown).not.toContain("– |")
  })

  it("renders a localized Markdown report with per-exercise detail", () => {
    const report = buildTeacherReport(stateWith(events), new Date("2026-08-05T12:00:00.000Z"))
    const markdown = formatTeacherReportMarkdown(report, "de")

    expect(markdown).toContain("# Lernbericht für die Lehrperson — GymiQuest Mathematik")
    expect(markdown).toContain("Selbstständig gelöst: 33 % (von 3 bewertbaren Fragen)")
    expect(markdown).toContain("Falsche Antworten: 3")
    expect(markdown).toContain("Hinweise genutzt: 3")
    expect(markdown).toContain("Aktive Übungszeit: 12 min")
    expect(markdown).toContain("| kg und g")
    expect(markdown).toContain("Wiederholung")
    expect(markdown).toContain("0/1") // review: one assessable question, none independent
    expect(markdown).toContain("## Zeitaufwendigste Übungen")
    expect(markdown).toContain("10 min")

    const english = formatTeacherReportMarkdown(report, "en")
    expect(english).toContain("# Mathematics progress report for the teacher")
    expect(english).toContain("Solved independently: 33 % (of 3 assessable questions)")
    expect(english).toContain("| kg and g")
  })

  it("renders a valid empty report without sections when no exercises exist", () => {
    const report = buildTeacherReport(stateWith([]), new Date("2026-08-05T12:00:00.000Z"))
    const markdown = formatTeacherReportMarkdown(report, "de")

    expect(report.exerciseCount).toBe(0)
    expect(markdown).toContain("Noch keine Übungen erfasst.")
    expect(markdown).not.toContain("## Themen")
  })

  it("names the file by report date", () => {
    const report = buildTeacherReport(stateWith(events), new Date("2026-08-05T12:00:00.000Z"))
    expect(teacherReportFilename(report)).toBe("gymiquest-lernbericht-2026-08-05.md")
  })
})
