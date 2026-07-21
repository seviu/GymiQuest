import { describe, expect, it } from "vitest"
import { createSeededLearner } from "./learningEngine"
import { topicIds } from "./model"
import {
  buildStudySnapshot,
  defaultLearnerPreferences,
  normalizeLearnerPreferences,
  updateLearnerProfile,
} from "./studyPlan"

const now = new Date("2026-07-14T10:00:00.000Z")

describe("personal study plan", () => {
  it("normalizes incomplete stored preferences to safe versioned defaults", () => {
    expect(normalizeLearnerPreferences(undefined)).toEqual(defaultLearnerPreferences)
    expect(normalizeLearnerPreferences({
      examDate: "2026-02-31",
      practiceDays: ["monday", "monday", "not-a-day"],
      sessionMinutes: 45,
      helpStyle: "magic",
      visualMode: "flashing",
      readingMode: "cramped",
      geometryControlSide: "middle",
    })).toEqual({
      practiceDays: ["monday"],
      sessionMinutes: 15,
      helpStyle: "visual",
      visualMode: "calm",
      readingMode: "standard",
      geometryControlSide: "right",
    })
  })

  it("updates planning preferences without changing XP, mastery, or learning evidence", () => {
    const learner = createSeededLearner(now)
    learner.totalXp = 82
    const preservedMastery = structuredClone(learner.mastery)
    const preservedEvents = structuredClone(learner.learningEvents)

    const updated = updateLearnerProfile(learner, {
      displayName: "  Lina  ",
      examDate: "2026-08-13",
      practiceDays: ["monday", "wednesday", "friday"],
      sessionMinutes: 20,
      helpStyle: "step-by-step",
      visualMode: "focus",
      readingMode: "spacious",
      geometryControlSide: "left",
    }, now)

    expect(updated.displayName).toBe("Lina")
    expect(updated.preferences).toEqual({
      examDate: "2026-08-13",
      practiceDays: ["monday", "wednesday", "friday"],
      sessionMinutes: 20,
      helpStyle: "step-by-step",
      visualMode: "focus",
      readingMode: "spacious",
      geometryControlSide: "left",
    })
    expect(updated.totalXp).toBe(82)
    expect(updated.mastery).toEqual(preservedMastery)
    expect(updated.learningEvents).toEqual(preservedEvents)
  })

  it("rejects a past exam, an identifyingly empty nickname, and no learning days", () => {
    const learner = createSeededLearner(now)
    const valid: Parameters<typeof updateLearnerProfile>[1] = {
      displayName: "Lina",
      examDate: "2026-08-13",
      practiceDays: ["monday"],
      sessionMinutes: 15,
      helpStyle: "visual",
      visualMode: "calm",
      readingMode: "standard",
      geometryControlSide: "right",
    }

    expect(() => updateLearnerProfile(learner, { ...valid, displayName: "L" }, now)).toThrow(/2 bis 24/)
    expect(() => updateLearnerProfile(learner, { ...valid, examDate: "2026-07-13" }, now)).toThrow(/zukünftiges/)
    expect(() => updateLearnerProfile(learner, { ...valid, practiceDays: [] }, now)).toThrow(/mindestens einen/)
  })

  it("shows a Zurich civil-date countdown and an evidence label, never a predicted grade", () => {
    const learner = createSeededLearner(now)
    learner.preferences.examDate = "2026-08-13"

    const early = buildStudySnapshot(learner, now)
    expect(early.daysUntilExam).toBe(30)
    expect(early.examDateLabel).toBe("13. August 2026")
    expect(early.readinessLabel).toBe("Im Aufbau")
    expect(early.readinessDetail).toBe(`2 von ${topicIds.length} Themen gelernt`)

    for (const topicId of topicIds) {
      learner.mastery[topicId] = {
        ...learner.mastery[topicId],
        status: "mastered",
        retention: 0.9,
        independentSuccesses: 1,
      }
    }
    expect(buildStudySnapshot(learner, now).readinessLabel).toBe("Prüfungsnah")
  })
})
