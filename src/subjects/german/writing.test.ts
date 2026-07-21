import { describe, expect, it } from "vitest"
import {
  GERMAN_WRITING_DURATION_SECONDS,
  buildGermanWritingForm,
  chooseGermanWritingPrompt,
  createGermanWritingHumanReview,
  createActiveGermanWritingSession,
  germanWritingAuthorValidationIssues,
  germanWritingExpired,
  germanWritingPromptCatalog,
  germanWritingWordCount,
  isActiveGermanWritingSession,
  isGermanWritingResult,
  isGermanWritingHumanReview,
  navigateGermanWritingStage,
  remainingGermanWritingSeconds,
  submitGermanWritingSession,
  toggleGermanWritingReviewCheck,
  updateGermanWritingDraft,
  updateGermanWritingPlan,
  updateGermanWritingTitle,
} from "./writing"

describe("German writing practice", () => {
  it("builds three deterministic, newly authored choices from independent prompt pools", () => {
    const form = buildGermanWritingForm("writing-form:1")
    expect(form).toEqual(buildGermanWritingForm("writing-form:1"))
    expect(form.prompts).toHaveLength(3)
    expect(form.prompts.map((prompt) => prompt.slot)).toEqual([
      "constrained-narrative",
      "anchored-narrative",
      "report",
    ])
    expect(form.prompts.every((prompt) => (
      prompt.sourceStatus === "newly-authored-training-content" &&
      prompt.sourceCalibrationYears.join(",") === "2024,2025"
    ))).toBe(true)
    expect(new Set(Array.from({ length: 80 }, (_, index) => (
      buildGermanWritingForm(`writing-variety:${index}`).prompts.map((prompt) => prompt.id).join("|")
    ))).size).toBeGreaterThan(20)
  })

  it("machine-checks all twelve prompts without claiming official-text identity", () => {
    expect(germanWritingAuthorValidationIssues).toEqual([])
    expect(germanWritingPromptCatalog).toHaveLength(12)
    expect(new Set(germanWritingPromptCatalog.map((prompt) => prompt.id)).size).toBe(12)
    expect(germanWritingPromptCatalog.filter((prompt) => prompt.genre === "newspaper-report")).toHaveLength(4)
  })

  it("persists prompt choice, planning, drafting, and bounded self-review", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let session = createActiveGermanWritingSession("writing-session:1", start)
    const prompt = buildGermanWritingForm(session.seed).prompts[1]!
    session = chooseGermanWritingPrompt(session, prompt.id, new Date("2026-07-17T12:01:00.000Z"))
    session = updateGermanWritingPlan(session, "opening", "Die Ausgangslage und die Hauptfigur.", start)
    session = updateGermanWritingPlan(session, "development", "Der entscheidende Konflikt.", start)
    session = updateGermanWritingPlan(session, "ending", "Die Folge der Entscheidung.", start)
    session = updateGermanWritingTitle(session, "Der leere Umschlag", start)
    session = navigateGermanWritingStage(session, "draft", start)
    session = updateGermanWritingDraft(session, "Ich öffnete den Umschlag und hielt den Atem an.", start)
    session = navigateGermanWritingStage(session, "review", start)
    session = toggleGermanWritingReviewCheck(session, "task-fulfilled", start)

    expect(session).toMatchObject({
      selectedPromptId: prompt.id,
      stage: "review",
      title: "Der leere Umschlag",
      reviewChecks: ["task-fulfilled"],
    })
    expect(isActiveGermanWritingSession(session)).toBe(true)
    expect(session.updatedAt).toBe("2026-07-17T12:01:00.000Z")
  })

  it("uses an absolute sixty-minute deadline across exits and reloads", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    const session = createActiveGermanWritingSession("writing-timer", start)
    expect(remainingGermanWritingSeconds(session, start)).toBe(GERMAN_WRITING_DURATION_SECONDS)
    expect(remainingGermanWritingSeconds(session, new Date("2026-07-17T12:59:59.200Z"))).toBe(1)
    expect(germanWritingExpired(session, new Date("2026-07-17T13:00:00.000Z"))).toBe(true)
    expect(submitGermanWritingSession(
      session,
      "submitted",
      new Date("2026-07-17T13:00:02.000Z"),
    ).submissionReason).toBe("timeout")
    expect(submitGermanWritingSession(
      session,
      "timeout",
      new Date("2026-07-17T12:10:00.000Z"),
    ).submissionReason).toBe("submitted")
  })

  it("seals a privacy-local human-review result without inventing a score", () => {
    const start = new Date("2026-07-17T12:00:00.000Z")
    let session = createActiveGermanWritingSession("writing-result", start)
    session = chooseGermanWritingPrompt(session, buildGermanWritingForm(session.seed).prompts[0]!.id, start)
    session = updateGermanWritingDraft(session, "Ein sorgfältig formulierter erster Trainingsentwurf.", start)
    const result = submitGermanWritingSession(
      session,
      "submitted",
      new Date("2026-07-17T12:20:00.000Z"),
    )

    expect(result).toMatchObject({
      durationSeconds: 20 * 60,
      submissionReason: "submitted",
      wordCount: 5,
      reviewStatus: "self-reviewed-awaiting-human-feedback",
    })
    expect(result).not.toHaveProperty("points")
    expect(result).not.toHaveProperty("grade")
    expect(isGermanWritingResult(result)).toBe(true)
  })

  it("counts German words and rejects forged replay metadata", () => {
    expect(germanWritingWordCount("Mia öffnete's – ganz langsam – und ging zurück.")).toBe(7)
    const session = createActiveGermanWritingSession("writing-forged")
    const forged = { ...session, seed: "other-seed" }
    expect(isActiveGermanWritingSession(forged)).toBe(false)
    expect(isActiveGermanWritingSession({ ...session, draft: "hidden draft" })).toBe(false)
  })

  it("stores bounded human feedback without adding a score", () => {
    const review = createGermanWritingHumanReview(
      "german-writing-result:example",
      "  Der Einstieg macht die Situation sofort klar.  ",
      "  Im Hauptteil die Zeitform noch einmal prüfen.  ",
      new Date("2026-07-17T15:00:00.000Z"),
    )

    expect(review).toEqual({
      schemaVersion: 1,
      resultId: "german-writing-result:example",
      reviewedAt: "2026-07-17T15:00:00.000Z",
      strength: "Der Einstieg macht die Situation sofort klar.",
      nextStep: "Im Hauptteil die Zeitform noch einmal prüfen.",
    })
    expect(review).not.toHaveProperty("points")
    expect(review).not.toHaveProperty("grade")
    expect(isGermanWritingHumanReview(review)).toBe(true)
    expect(createGermanWritingHumanReview("result", "", "Nächster Schritt")).toBeUndefined()
    expect(createGermanWritingHumanReview("result", "Stärke", " ")).toBeUndefined()
  })
})
