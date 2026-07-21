import { describe, expect, it } from "vitest"
import {
  archiveExpansionTopicIds,
  generateArchiveExpansionQuestion,
} from "./archiveGeneratorExpansion"
import { buildConceptRepairQuestions } from "./conceptRepair"
import { generateQuestion } from "./generators"
import { topicIds } from "./model"

describe("concept repair question set", () => {
  it("builds reproducible fresh examples and checks for every topic", () => {
    for (const topicId of topicIds) {
      const source = generateQuestion(topicId, `source:${topicId}`)
      const first = buildConceptRepairQuestions(
        topicId,
        `repair:${topicId}`,
        source.prompt,
      )
      const replay = buildConceptRepairQuestions(
        topicId,
        `repair:${topicId}`,
        source.prompt,
      )

      expect(first, topicId).toEqual(replay)
      expect(first.example.prompt, topicId).not.toBe(source.prompt)
      expect(first.check.prompt, topicId).not.toBe(source.prompt)
      expect(first.check.prompt, topicId).not.toBe(first.example.prompt)
      expect(first.example.topicId).toBe(topicId)
      expect(first.check.topicId).toBe(topicId)
    }
  })

  it("uses Aufbau for the example and Standard for a new version-two teach-back", () => {
    const source = generateQuestion("speed-distance-time", "source:v2")
    const questions = buildConceptRepairQuestions(
      "speed-distance-time",
      "repair:v2",
      source.prompt,
      2,
    )

    expect(questions.example.generation?.difficultyBand).toBe("foundation")
    expect(questions.check.generation?.difficultyBand).toBe("standard")
    expect(questions.example.prompt).not.toBe(questions.check.prompt)
  })

  it("keeps v5 repair in the source archive template with ordered difficulty", () => {
    for (const topicId of archiveExpansionTopicIds) {
      const source = generateArchiveExpansionQuestion(
        topicId,
        `source:v5:${topicId}`,
        `source:v5:${topicId}`,
        "en",
      )
      const first = buildConceptRepairQuestions(
        topicId,
        `repair:v5:${topicId}`,
        source.prompt,
        5,
        "en",
        source.provenance,
      )
      const replay = buildConceptRepairQuestions(
        topicId,
        `repair:v5:${topicId}`,
        source.prompt,
        5,
        "en",
        source.provenance,
      )

      expect(replay, topicId).toEqual(first)
      expect(first.example.provenance?.familyId, topicId).toBe(source.provenance?.familyId)
      expect(first.example.provenance?.templateId, topicId).toBe(source.provenance?.templateId)
      expect(first.check.provenance, topicId).toEqual(first.example.provenance)
      expect(first.example.generation?.version, topicId).toBe(5)
      expect(first.example.generation?.difficultyBand, topicId).toBe("foundation")
      expect(first.check.generation?.difficultyBand, topicId).toBe("standard")
      expect(first.example.generation!.difficultyScore, topicId).toBeLessThanOrEqual(
        first.check.generation!.difficultyScore,
      )
      expect(new Set([source.prompt, first.example.prompt, first.check.prompt]).size, topicId).toBe(3)
    }
  })

  it("keeps v5 repair mathematics aligned across every learning locale", () => {
    for (const topicId of archiveExpansionTopicIds) {
      const repairs = (["de", "en", "it", "es"] as const).map((locale) => {
        const source = generateArchiveExpansionQuestion(topicId, `repair-locale:${topicId}`, "source", locale)
        return buildConceptRepairQuestions(
          topicId,
          `repair-locale-round:${topicId}`,
          source.prompt,
          5,
          locale,
          source.provenance,
        )
      })
      const signature = (questions: (typeof repairs)[number]) => ({
        example: {
          response: questions.example.response,
          visual: questions.example.visual ? {
            kind: questions.example.visual.kind,
            variant: questions.example.visual.variant,
            values: questions.example.visual.values,
            numerator: questions.example.visual.numerator,
            denominator: questions.example.visual.denominator,
          } : undefined,
          provenance: questions.example.provenance,
          generation: questions.example.generation,
        },
        check: {
          response: questions.check.response,
          visual: questions.check.visual ? {
            kind: questions.check.visual.kind,
            variant: questions.check.visual.variant,
            values: questions.check.visual.values,
            numerator: questions.check.visual.numerator,
            denominator: questions.check.visual.denominator,
          } : undefined,
          provenance: questions.check.provenance,
          generation: questions.check.generation,
        },
      })

      expect(repairs.map(signature), topicId).toEqual(Array(4).fill(signature(repairs[0]!)))
      expect(new Set(repairs.map(({ example }) => example.prompt)).size, topicId).toBe(4)
      expect(new Set(repairs.map(({ check }) => check.prompt)).size, topicId).toBe(4)
    }
  })
})
