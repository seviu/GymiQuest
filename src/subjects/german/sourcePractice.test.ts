import { describe, expect, it } from "vitest"
import {
  completeGermanSourcePractice,
  createActiveGermanSourcePractice,
  createGermanSourcePracticeState,
  finishGermanSourcePracticeState,
  GERMAN_SOURCE_PRACTICE_HISTORY_LIMIT,
  germanSourcePracticeCanComplete,
  germanSourcePracticeDocumentKinds,
  isActiveGermanSourcePractice,
  isGermanSourcePracticeResult,
  navigateGermanSourcePractice,
  normalizeGermanSourcePracticeState,
  remainingGermanSourcePracticeSeconds,
  setGermanSourceLanguageReview,
  submitGermanSourcePractice,
  toggleGermanSourceWritingReviewCheck,
  updateGermanSourceWriting,
} from "./sourcePractice"

const start = new Date("2026-07-17T12:00:00.000Z")

describe("German source-only practice", () => {
  it("creates an absolute 45-minute language session with solutions locked", () => {
    const practice = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2025",
      "language-exam",
      "source:language:1",
      start,
    )

    expect(practice).toMatchObject({
      durationSeconds: 45 * 60,
      phase: "working",
      currentDocumentKind: "language-exam",
      pageNumbers: { "language-exam": 1, "text-sheet": 1 },
    })
    expect(practice.pageNumbers.solutions).toBeUndefined()
    expect(germanSourcePracticeDocumentKinds(practice.mode, practice.phase)).toEqual([
      "language-exam",
      "text-sheet",
    ])
    expect(remainingGermanSourcePracticeSeconds(
      practice,
      new Date(start.getTime() + 70_000),
    )).toBe(2_630)
    expect(isActiveGermanSourcePractice(practice)).toBe(true)
  })

  it("unlocks solutions only after submission and completes with bounded comparison", () => {
    const active = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2024",
      "language-exam",
      "source:language:2",
      start,
    )
    expect(navigateGermanSourcePractice(active, "solutions", 1, start)).toBe(active)
    const submitted = submitGermanSourcePractice(
      active,
      "submitted",
      new Date(start.getTime() + 1_200_000),
    )
    expect(submitted).toMatchObject({
      phase: "review",
      currentDocumentKind: "solutions",
      pageNumbers: { solutions: 1 },
    })
    expect(germanSourcePracticeCanComplete(submitted)).toBe(false)
    const reviewed = setGermanSourceLanguageReview(submitted, "mixed-or-unclear", new Date(start.getTime() + 1_201_000))
    const result = completeGermanSourcePractice(reviewed, new Date(start.getTime() + 1_202_000))
    expect(result).toMatchObject({
      mode: "language-exam",
      durationSeconds: 1_200,
      languageReviewStatus: "mixed-or-unclear",
      writingReviewChecks: [],
    })
    expect(isGermanSourcePracticeResult(result)).toBe(true)
    expect(result).not.toHaveProperty("points")
    expect(result).not.toHaveProperty("xp")
    expect(result).not.toHaveProperty("grade")
  })

  it("autosaves a 60-minute source writing draft and records only self-review checks", () => {
    let practice = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2025",
      "writing",
      "source:writing:1",
      start,
    )
    practice = updateGermanSourceWriting(
      practice,
      "Ein besonderer Nachmittag",
      "Heute begann alles ganz ruhig. Dann änderte sich plötzlich der Plan.",
      new Date(start.getTime() + 5_000),
    )
    expect(practice.durationSeconds).toBe(60 * 60)
    expect(practice.currentDocumentKind).toBe("essay-prompts")
    const submitted = submitGermanSourcePractice(practice, "timeout", new Date(start.getTime() + 3_600_000))
    const reviewed = toggleGermanSourceWritingReviewCheck(
      toggleGermanSourceWritingReviewCheck(submitted, "clear-structure"),
      "proofread",
    )
    const result = completeGermanSourcePractice(reviewed, new Date(start.getTime() + 3_601_000))
    expect(result).toMatchObject({
      mode: "writing",
      submissionReason: "timeout",
      durationSeconds: 3_600,
      writingTitle: "Ein besonderer Nachmittag",
      wordCount: 11,
      writingReviewChecks: ["clear-structure", "proofread"],
    })
    expect(isGermanSourcePracticeResult(result)).toBe(true)
  })

  it("stores a completed result without accepting scoring-shaped or malformed records", () => {
    const active = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2025",
      "language-exam",
      "source:language:state",
      start,
    )
    const reviewed = setGermanSourceLanguageReview(
      submitGermanSourcePractice(active, "submitted", new Date(start.getTime() + 60_000)),
      "mostly-matches",
      new Date(start.getTime() + 61_000),
    )
    const result = completeGermanSourcePractice(reviewed, new Date(start.getTime() + 62_000))
    const state = finishGermanSourcePracticeState(
      { ...createGermanSourcePracticeState(), active },
      result,
    )
    expect(state.active).toBeUndefined()
    expect(state.history).toEqual([result])
    expect(normalizeGermanSourcePracticeState(state)).toEqual(state)
    expect(isActiveGermanSourcePractice({ ...active, score: 8 })).toBe(false)
    expect(isActiveGermanSourcePractice({
      ...active,
      updatedAt: new Date(start.getTime() - 1_000).toISOString(),
    })).toBe(false)
    expect(isGermanSourcePracticeResult({ ...result, xp: 10 })).toBe(false)
    expect(isGermanSourcePracticeResult({ ...result, practiceId: `${result.practiceId}:tampered` })).toBe(false)
    expect(isGermanSourcePracticeResult({ ...result, durationSeconds: result.durationSeconds + 1 })).toBe(false)
    expect(normalizeGermanSourcePracticeState({ ...state, history: [{ ...result, grade: 6 }] })).toEqual(
      createGermanSourcePracticeState(),
    )
  })

  it("bounds completed source history so private essay drafts cannot grow without limit", () => {
    const active = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2025",
      "language-exam",
      "source:bounded-history",
      start,
    )
    const reviewed = setGermanSourceLanguageReview(
      submitGermanSourcePractice(active, "submitted", new Date(start.getTime() + 60_000)),
      "not-compared",
    )
    const result = completeGermanSourcePractice(reviewed, new Date(start.getTime() + 61_000))
    const earlier = Array.from({ length: GERMAN_SOURCE_PRACTICE_HISTORY_LIMIT }, (_, index) => ({
      ...result,
      id: `${result.id}:old:${index}`,
    }))

    const finished = finishGermanSourcePracticeState({
      schemaVersion: 1,
      active,
      history: earlier,
    }, result)

    expect(finished.history).toHaveLength(GERMAN_SOURCE_PRACTICE_HISTORY_LIMIT)
    expect(finished.history.at(-1)).toEqual(result)
    expect(finished.history[0]?.id).toBe(earlier[1]?.id)
  })
})
