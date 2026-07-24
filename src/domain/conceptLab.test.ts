import { describe, expect, it } from "vitest"
import { buildConceptLabRound } from "./conceptLab"
import { topicIds } from "./model"

describe("concept lab rounds", () => {
  it("builds a deterministic fresh example and independent check for every topic", () => {
    for (const topicId of topicIds) {
      const first = buildConceptLabRound(topicId, `lab:${topicId}`)
      const replay = buildConceptLabRound(topicId, `lab:${topicId}`)

      expect(first, topicId).toEqual(replay)
      expect(first.reference.topicId, topicId).toBe(topicId)
      expect(first.example.topicId, topicId).toBe(topicId)
      expect(first.check.topicId, topicId).toBe(topicId)
      expect(first.example.prompt, topicId).not.toBe(first.check.prompt)
      expect(first.reference.generation?.version, topicId).toBe(6)
      expect(first.example.generation?.version, topicId).toBe(first.reference.provenance ? 6 : 4)
      expect(first.check.generation?.version, topicId).toBe(first.reference.provenance ? 6 : 4)
      expect(first.example.generation?.difficultyBand, topicId).toBe("foundation")
      expect(first.check.generation?.difficultyBand, topicId).toBe("standard")
    }
  })

  it("changes the exercise round when its deterministic round seed changes", () => {
    const first = buildConceptLabRound("reverse-chains", "lab:reverse-chains:0")
    const next = buildConceptLabRound("reverse-chains", "lab:reverse-chains:1")

    expect([
      next.reference.prompt,
      next.example.prompt,
      next.check.prompt,
    ]).not.toEqual([
      first.reference.prompt,
      first.example.prompt,
      first.check.prompt,
    ])
  })
})
