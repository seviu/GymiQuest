import { describe, expect, it } from "vitest"
import { createSeededLearner, requestTeacherSupport } from "./learningEngine"
import type { LearningEvent, MockExamResult } from "./model"
import { buildParentDashboard } from "./parentDashboard"

const now = new Date("2026-07-14T12:00:00.000Z")

function event(
  id: string,
  completedAt: string,
  options: { hints?: number; attempts?: number; independent?: boolean } = {},
): LearningEvent {
  const hints = options.hints ?? 0
  const attempts = options.attempts ?? 1
  const independent = options.independent ?? (hints === 0 && attempts === 1)
  return {
    id,
    taskId: `review:mass-units:${id}`,
    taskKind: "review",
    topicIds: ["mass-units"],
    completedAt,
    activeSeconds: 240,
    mistakes: Math.max(0, attempts - 1),
    hintsUsed: hints,
    independentlyCompleted: independent,
    questionResults: [{
      questionId: `${id}:question`,
      topicId: "mass-units",
      attempts,
      hintsUsed: hints,
      activeSeconds: 240,
      independentlySolved: independent,
    }],
  }
}

function mockResult(
  id: string,
  submittedAt: string,
  certainPoints: number,
  reviewablePoints: number,
  blueprintVersion = 4,
  source: MockExamResult["source"] = "generated",
): MockExamResult {
  return {
    id,
    source,
    seed: id,
    blueprintVersion,
    startedAt: submittedAt,
    submittedAt,
    submissionReason: "submitted",
    durationSeconds: 3_600,
    maxPoints: 36,
    certainPoints,
    reviewablePoints,
    taskResults: [],
    recoveryTopicIds: [],
  }
}

describe("parent dashboard summary", () => {
  it("turns aggregate learning evidence into calm priorities and three sessions", () => {
    const learner = createSeededLearner(now)
    const corrected = event("corrected", "2026-07-13T10:00:00.000Z", { attempts: 2 })
    corrected.questionResults[0]!.diagnostic = {
      kind: "unit-conversion",
      title: "Die 1000er-Richtung ist vertauscht.",
      resolved: true,
    }
    learner.learningEvents = [
      corrected,
      event("hinted", "2026-07-14T09:00:00.000Z", { hints: 1 }),
    ]
    const originalXp = learner.totalXp
    const originalMastery = structuredClone(learner.mastery)

    const summary = buildParentDashboard(learner, now)

    expect(summary.completedLearningSessions).toBe(2)
    expect(summary.weeklyTarget).toBe(3)
    expect(summary.dueReviews).toBe(2)
    expect(summary.hintQuestions).toBe(1)
    expect(summary.correctedQuestions).toBe(1)
    expect(summary.errorPatterns[0]).toMatchObject({
      kind: "unit-conversion",
      occurrences: 1,
      resolvedOccurrences: 1,
    })
    expect(summary.averageQuestionSeconds).toBe(240)
    expect(summary.learnerFeedbackCount).toBe(0)
    expect(summary.learnerConcernCount).toBe(0)
    expect(summary.headline).toContain("fällige Wiederholungen")
    expect(summary.focusTopics[0]).toMatchObject({
      topicId: "mass-units",
      reason: "Die Wiederholung ist jetzt fällig.",
    })
    expect(summary.sessionPlan).toHaveLength(3)
    expect(summary.sessionPlan[0]!.purpose).toContain("festen Review-XP-Wert")
    expect(learner.totalXp).toBe(originalXp)
    expect(learner.mastery).toEqual(originalMastery)
  })

  it("shows a non-judgmental zero state without inventing evidence", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = []
    for (const mastery of Object.values(learner.mastery)) {
      if (mastery.status === "mastered") mastery.dueAt = "2026-07-20T12:00:00.000Z"
    }

    const summary = buildParentDashboard(learner, now)

    expect(summary.weekly.questions).toBe(0)
    expect(summary.averageQuestionSeconds).toBe(0)
    expect(summary.hintQuestions).toBe(0)
    expect(summary.correctedQuestions).toBe(0)
    expect(summary.learnerFeedbackPatterns).toEqual([])
    expect(summary.generatedMockTrend).toBeUndefined()
    expect(summary.headline).toBe("Ein ruhiger Einstieg reicht für diese Woche.")
    expect(summary.sessionPlan).toHaveLength(3)
  })

  it("compares only the latest generated blueprint and preserves unresolved points as a range", () => {
    const learner = createSeededLearner(now)
    learner.mockHistory = [
      mockResult("legacy", "2026-07-08T12:00:00.000Z", 30, 0, 3),
      mockResult("first", "2026-07-10T12:00:00.000Z", 12, 6),
      mockResult("official", "2026-07-11T12:00:00.000Z", 36, 0, 1, "official-archive"),
      mockResult("latest", "2026-07-12T12:00:00.000Z", 22, 2),
    ]

    const trend = buildParentDashboard(learner, now).generatedMockTrend

    expect(trend).toEqual({
      blueprintVersion: 4,
      status: "higher",
      comparisonCopy: "Der jüngste sicher belegte Punktebereich liegt vollständig über dem ersten Vergleichslauf.",
      points: [
        {
          id: "first",
          submittedAt: "2026-07-10T12:00:00.000Z",
          lowerPoints: 12,
          upperPoints: 18,
          maxPoints: 36,
          lowerPercent: 33,
          upperPercent: 50,
        },
        {
          id: "latest",
          submittedAt: "2026-07-12T12:00:00.000Z",
          lowerPoints: 22,
          upperPoints: 24,
          maxPoints: 36,
          lowerPercent: 61,
          upperPercent: 67,
        },
      ],
    })
  })

  it("does not claim a direction when generated mock point ranges overlap", () => {
    const learner = createSeededLearner(now)
    learner.mockHistory = [
      mockResult("first", "2026-07-10T12:00:00.000Z", 18, 6),
      mockResult("latest", "2026-07-12T12:00:00.000Z", 20, 5),
    ]

    expect(buildParentDashboard(learner, now).generatedMockTrend).toMatchObject({
      status: "overlap",
      comparisonCopy: "Die Punktebereiche überschneiden sich. Offene Rechenwegpunkte werden deshalb nicht als Auf- oder Abwärtstrend ausgegeben.",
    })
  })

  it("names a lower range without converting it into a grade", () => {
    const learner = createSeededLearner(now)
    learner.mockHistory = [
      mockResult("first", "2026-07-10T12:00:00.000Z", 24, 0),
      mockResult("latest", "2026-07-12T12:00:00.000Z", 16, 4),
    ]

    expect(buildParentDashboard(learner, now).generatedMockTrend).toMatchObject({
      status: "lower",
      comparisonCopy: "Der jüngste mögliche Punktebereich liegt unter dem ersten Vergleichslauf. Die vorgeschlagenen Aufholthemen haben jetzt Vorrang.",
    })
  })

  it("uses the learner's chosen days and duration for coaching targets", () => {
    const learner = createSeededLearner(now)
    learner.preferences.practiceDays = ["wednesday", "saturday"]
    learner.preferences.sessionMinutes = 20

    const summary = buildParentDashboard(learner, now)
    const englishSummary = buildParentDashboard(
      learner,
      now,
      "Europe/Zurich",
      "en",
      "en",
    )

    expect(summary.weeklyTarget).toBe(2)
    expect(summary.sessionPlan.find((item) => item.id === "learn")?.durationMinutes).toBe(20)
    expect(summary.sessionPlan.find((item) => item.id === "retrieve")?.durationMinutes).toBe(10)
    expect(summary.sessionPlan.find((item) => item.id === "learn")?.purpose).toContain(
      "zwei bis vier adaptiven Aufgaben",
    )
    expect(summary.sessionPlan.find((item) => item.id === "learn")?.purpose).toContain(
      "die Anzahl steht beim Start fest",
    )
    expect(englishSummary.sessionPlan.find((item) => item.id === "learn")?.purpose).toContain(
      "two to four adaptive questions",
    )
    expect(englishSummary.sessionPlan.find((item) => item.id === "learn")?.purpose).toContain(
      "the question count is fixed",
    )
  })

  it("prioritizes the learner's own bounded confusion signal without changing learning state", () => {
    const learner = createSeededLearner(now)
    for (const mastery of Object.values(learner.mastery)) {
      if (mastery.status === "mastered") mastery.dueAt = "2026-07-20T12:00:00.000Z"
    }
    const feedbackEvent = event("own-voice", "2026-07-14T09:00:00.000Z")
    feedbackEvent.taskId = "lesson:arithmetic-equations:own-voice"
    feedbackEvent.taskKind = "lesson"
    feedbackEvent.topicIds = ["arithmetic-equations"]
    feedbackEvent.questionResults[0]!.topicId = "arithmetic-equations"
    learner.learningEvents = [feedbackEvent]
    learner.learnerFeedback = [{
      id: `feedback:${feedbackEvent.id}`,
      learningEventId: feedbackEvent.id,
      taskId: feedbackEvent.taskId,
      taskKind: feedbackEvent.taskKind,
      topicIds: feedbackEvent.topicIds,
      kind: "explanation-unclear",
      recordedAt: "2026-07-14T09:01:00.000Z",
    }]
    const originalXp = learner.totalXp
    const originalMastery = structuredClone(learner.mastery)

    const summary = buildParentDashboard(learner, now)

    expect(summary.learnerFeedbackCount).toBe(1)
    expect(summary.learnerConcernCount).toBe(1)
    expect(summary.learnerFeedbackPatterns[0]).toMatchObject({
      kind: "explanation-unclear",
      label: "Die Erklärung war noch unklar",
      occurrences: 1,
      concern: true,
    })
    expect(summary.headline).toContain("eigene Rückmeldung")
    expect(summary.focusTopics[0]).toMatchObject({
      topicId: "arithmetic-equations",
      reason: "Aus eigener Rückmeldung: «Die Erklärung war noch unklar».",
      nextAction: "Die Grundidee im Konzept-Labor anders darstellen und erst danach neu prüfen.",
    })
    expect(learner.totalXp).toBe(originalXp)
    expect(learner.mastery).toEqual(originalMastery)
  })

  it("shows an in-progress lesson as a securing round without taking away earned XP", () => {
    const learner = createSeededLearner(now)
    for (const mastery of Object.values(learner.mastery)) {
      if (mastery.status === "mastered") mastery.dueAt = "2026-07-20T12:00:00.000Z"
    }
    learner.mastery["arithmetic-equations"].status = "learning"
    learner.mastery["arithmetic-equations"].supportedMastery = 0.62
    learner.mastery["arithmetic-equations"].independentMastery = 0.4

    const summary = buildParentDashboard(learner, now)

    expect(summary.focusTopics[0]).toMatchObject({
      topicId: "arithmetic-equations",
      reason: "Mit Hilfe liegt die Sicherheit bei 62 Prozent, selbständig bei 40 Prozent.",
      nextAction: "Die kurze Sicherungsrunde mit neuen Aufgaben abschliessen.",
    })
    expect(summary.sessionPlan.find((item) => item.id === "secure")).toMatchObject({
      title: "Sicherungsrunde: Rechenketten",
      purpose: "Zwei neue Aufgaben prüfen den selbständigen Abruf. Bereits verdiente XP bleiben erhalten.",
    })
  })

  it("puts learner-paused topics in a separate teacher queue and removes them from training priorities", () => {
    const learner = requestTeacherSupport(
      createSeededLearner(now),
      "mass-units",
      new Date("2026-07-14T10:30:00.000Z"),
    )
    const originalXp = learner.totalXp
    const originalMastery = structuredClone(learner.mastery)

    const summary = buildParentDashboard(learner, now)

    expect(summary.headline).toContain("pausiertes Thema")
    expect(summary.topicHelpRequests).toEqual([{
      topicId: "mass-units",
      title: "Kilogramm und Gramm sicher umrechnen",
      description: "Massen zwischen Kilogramm und Gramm umwandeln.",
      requestedAt: "2026-07-14T10:30:00.000Z",
      coachingGuide: {
        goal: "Du kannst Kilogramm und Gramm ohne Taschenrechner sicher ineinander umwandeln.",
        ideaTitle: "Ein Kilogramm besteht aus 1000 Gramm",
        idea: "Beim Wechsel von Kilogramm zu Gramm wird die Zahl 1000-mal so gross. In die andere Richtung wird sie 1000-mal kleiner.",
        commonHurdle: "Kilogramm und Gramm beschreiben dieselbe Masse, aber mit unterschiedlich grossen Zahlen.",
        nextStep: "kg → g: mal 1000. g → kg: durch 1000.",
        workedSteps: [
          "kg → g: mit 1000 multiplizieren",
          "g → kg: durch 1000 dividieren",
        ],
        takeaway: "Die Einheit sagt dir, in welche Richtung du umrechnest.",
        teachBackPrompt: "Was würdest du als Erstes tun – und warum? Erkläre es mit dem Merksatz, noch bevor du ausrechnest.",
        prerequisiteTitles: [],
      },
    }])
    expect(summary.focusTopics.map((topic) => topic.topicId)).not.toContain("mass-units")
    expect(summary.sessionPlan.flatMap((item) => item.topicIds)).not.toContain("mass-units")
    expect(learner.totalXp).toBe(originalXp)
    expect(learner.mastery).toEqual(originalMastery)
  })

  it("includes the authored prerequisite path in a paused topic's coaching guide", () => {
    const learner = requestTeacherSupport(
      createSeededLearner(now),
      "time-fractions",
      new Date("2026-07-14T10:30:00.000Z"),
    )

    const summary = buildParentDashboard(learner, now)

    expect(summary.topicHelpRequests[0]?.coachingGuide.prerequisiteTitles).toEqual([
      "Den Bruchteil einer Menge bestimmen",
    ])
  })

  it("can build the paused-topic coaching queue in authored English", () => {
    const learner = requestTeacherSupport(
      createSeededLearner(now),
      "time-fractions",
      new Date("2026-07-14T10:30:00.000Z"),
    )

    const summary = buildParentDashboard(learner, now, "Europe/Zurich", "en")

    expect(summary.topicHelpRequests[0]).toMatchObject({
      title: "Calculate fractions of time intervals",
      description: "Put hours and minutes into one unit before finding a fraction.",
      coachingGuide: {
        ideaTitle: "Convert everything to minutes first",
        takeaway: "All times need the same unit before using a fraction.",
        prerequisiteTitles: ["Find a fraction of a quantity"],
      },
    })
    expect(summary.headline).toContain("pausiertes Thema")
  })
})
