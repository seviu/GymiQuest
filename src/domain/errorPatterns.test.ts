import { describe, expect, it } from "vitest"
import { createSeededLearner } from "./learningEngine"
import type { LearningEvent, QuestionDiagnosticEvidence, TopicId } from "./model"
import {
  buildErrorCompass,
  chooseQuestionDiagnostic,
  completeQuestionDiagnostic,
} from "./errorPatterns"

const now = new Date("2026-07-14T12:00:00.000Z")

function event(
  id: string,
  completedAt: string,
  topicId: TopicId,
  diagnostic: QuestionDiagnosticEvidence,
  taskKind: LearningEvent["taskKind"] = "review",
): LearningEvent {
  return {
    id,
    taskId: `${taskKind}:${topicId}:${id}`,
    taskKind,
    topicIds: [topicId],
    completedAt,
    activeSeconds: 60,
    mistakes: diagnostic.resolved ? 1 : 2,
    hintsUsed: 0,
    independentlyCompleted: false,
    questionResults: [{
      questionId: `${id}:question`,
      topicId,
      attempts: diagnostic.resolved ? 2 : 3,
      hintsUsed: 0,
      activeSeconds: 60,
      independentlySolved: false,
      diagnostic,
    }],
  }
}

describe("error compass", () => {
  it("keeps the most meaningful first diagnostic and records whether it was resolved", () => {
    const format = { kind: "format" as const, title: "Die Eingabe war noch nicht lesbar." }
    const units = { kind: "unit-conversion" as const, title: "Die 1000er-Richtung ist vertauscht." }
    const generic = { kind: "concept" as const, title: "Die Grundidee braucht noch Übung." }

    expect(chooseQuestionDiagnostic(format, units)).toEqual(units)
    expect(chooseQuestionDiagnostic(units, generic)).toEqual(units)
    expect(completeQuestionDiagnostic(units, true)).toEqual({ ...units, resolved: true })
  })

  it("aggregates recent mathematical hurdles without mutating XP or mastery", () => {
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      event("open", "2026-07-13T10:00:00.000Z", "mass-units", {
        kind: "unit-conversion",
        title: "Die Richtung der Umrechnung war vertauscht.",
        resolved: false,
      }),
      event("resolved", "2026-07-14T09:00:00.000Z", "mass-units", {
        kind: "unit-conversion",
        title: "Die 1000er-Richtung ist vertauscht.",
        resolved: true,
      }),
      event("placement", "2026-07-14T10:00:00.000Z", "area-fractions", {
        kind: "fraction-structure",
        title: "Zähler und Nenner waren vertauscht.",
        resolved: false,
      }, "placement"),
      event("old", "2026-05-01T10:00:00.000Z", "reverse-fractions", {
        kind: "concept",
        title: "Die Gegenoperation war noch nicht sicher.",
        resolved: false,
      }),
    ]
    const originalXp = learner.totalXp
    const originalMastery = structuredClone(learner.mastery)

    const compass = buildErrorCompass(learner, now)

    expect(compass).toMatchObject({
      windowDays: 45,
      totalOccurrences: 2,
      resolvedOccurrences: 1,
    })
    expect(compass.patterns).toHaveLength(1)
    expect(compass.patterns[0]).toMatchObject({
      kind: "unit-conversion",
      label: "Einheitenrichtung",
      occurrences: 2,
      resolvedOccurrences: 1,
      openOccurrences: 1,
      topicIds: ["mass-units"],
      latestTitle: "Die 1000er-Richtung ist vertauscht.",
    })
    expect(learner.totalXp).toBe(originalXp)
    expect(learner.mastery).toEqual(originalMastery)
  })
})
