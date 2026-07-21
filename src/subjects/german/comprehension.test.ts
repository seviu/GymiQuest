import { describe, expect, it } from "vitest"
import {
  createActiveGermanComprehensionSession,
  createGermanComprehensionReview,
  germanComprehensionCanSubmit,
  germanComprehensionPassage,
  germanComprehensionPromptById,
  germanComprehensionPrompts,
  isActiveGermanComprehensionSession,
  isGermanComprehensionResult,
  isGermanComprehensionReview,
  resolveGermanComprehensionReview,
  submitGermanComprehensionSession,
  updateGermanComprehensionSession,
} from "./comprehension"

const start = new Date("2026-07-17T12:00:00.000Z")

describe("German constrained comprehension practice", () => {
  it("has an authored replay-safe prompt catalog with valid evidence lines", () => {
    expect(germanComprehensionPrompts).toHaveLength(12)
    expect(new Set(germanComprehensionPrompts.map((prompt) => prompt.id)).size).toBe(12)
    for (const prompt of germanComprehensionPrompts) {
      const passage = germanComprehensionPassage(prompt.id)
      expect(passage).toBeDefined()
      expect(prompt.expectedElements.length).toBeGreaterThanOrEqual(2)
      expect(prompt.suggestedEvidenceLines).toHaveLength(2)
      expect(prompt.suggestedEvidenceLines.every((line) => (
        passage?.lines.some((candidate) => candidate.number === line)
      ))).toBe(true)
      expect(germanComprehensionPromptById(prompt.id)).toBe(prompt)
    }
  })

  it("selects a fresh prompt deterministically and autosaves a bounded response", () => {
    const first = createActiveGermanComprehensionSession("comprehension:1", [], start)
    const replay = createActiveGermanComprehensionSession("comprehension:1", [], start)
    const next = createActiveGermanComprehensionSession(
      "comprehension:1",
      [first.promptId],
      start,
    )
    expect(first).toEqual(replay)
    expect(next.promptId).not.toBe(first.promptId)
    const passage = germanComprehensionPassage(first.promptId)!
    const updated = updateGermanComprehensionSession(
      first,
      "Meine Erklärung stützt sich auf die genaue Abfolge im Text und nennt die entscheidende Veränderung.",
      [passage.lines[1]!.number, passage.lines[0]!.number],
      new Date("2026-07-17T12:02:00.000Z"),
    )
    expect(updated.evidenceLines).toEqual([
      passage.lines[0]!.number,
      passage.lines[1]!.number,
    ])
    expect(germanComprehensionCanSubmit(updated)).toBe(true)
    expect(isActiveGermanComprehensionSession(updated)).toBe(true)
    expect(isActiveGermanComprehensionSession({ ...updated, xp: 5 })).toBe(false)
  })

  it("submits without scoring and follows pending, reviewed, resolved lifecycle", () => {
    const active = createActiveGermanComprehensionSession("comprehension:review", [], start)
    const passage = germanComprehensionPassage(active.promptId)!
    const updated = updateGermanComprehensionSession(
      active,
      "Die Antwort erklärt den Zusammenhang und verweist auf zwei passende Informationen aus dem Text.",
      [passage.lines[0]!.number, passage.lines[1]!.number],
      new Date("2026-07-17T12:03:00.000Z"),
    )
    const result = submitGermanComprehensionSession(updated, new Date("2026-07-17T12:04:00.000Z"))
    expect(result.elapsedSeconds).toBe(240)
    expect(result).not.toHaveProperty("points")
    expect(result).not.toHaveProperty("xp")
    expect(result).not.toHaveProperty("mastery")
    expect(isGermanComprehensionResult(result)).toBe(true)

    const review = createGermanComprehensionReview(
      result,
      "partly-supported",
      "Du nennst die zentrale Veränderung.",
      "Verbinde den zweiten Satz noch genauer mit Zeile 2.",
      new Date("2026-07-17T12:10:00.000Z"),
    )!
    expect(isGermanComprehensionReview(review)).toBe(true)
    expect(review.resolvedAt).toBeUndefined()
    const resolved = resolveGermanComprehensionReview(review, new Date("2026-07-17T12:11:00.000Z"))
    expect(resolved.resolvedAt).toBe("2026-07-17T12:11:00.000Z")
    expect(isGermanComprehensionReview(resolved)).toBe(true)
  })

  it("rejects incomplete, malformed, or scoring-shaped evidence", () => {
    const active = createActiveGermanComprehensionSession("comprehension:invalid", [], start)
    expect(germanComprehensionCanSubmit(active)).toBe(false)
    expect(() => submitGermanComprehensionSession(active)).toThrow(/complete response/)
    const passage = germanComprehensionPassage(active.promptId)!
    const updated = updateGermanComprehensionSession(
      active,
      "Eine ausreichend lange, aber noch menschlich zu prüfende Antwort.",
      [passage.lines[0]!.number],
      start,
    )
    const result = submitGermanComprehensionSession(updated, new Date("2026-07-17T12:01:00.000Z"))
    expect(isGermanComprehensionResult({ ...result, score: 1 })).toBe(false)
    expect(isGermanComprehensionResult({ ...result, elapsedSeconds: 59 })).toBe(false)
    expect(createGermanComprehensionReview(result, "well-supported", " ", "Nächster Schritt"))
      .toBeUndefined()
  })
})
