import { describe, expect, it } from "vitest"
import { generateDifficultyVariants, isCorrectAnswer } from "./generators"
import type { DifficultyBand, GeneratedQuestion, TopicId } from "./model"

const BANDS: readonly DifficultyBand[] = ["foundation", "standard", "exam"]
const SEED_COUNT = 500

function requireNumber(question: GeneratedQuestion): number {
  expect(question.response.kind).toBe("number")
  if (question.response.kind !== "number") throw new Error("Expected a number response")
  return question.response.value
}

/**
 * Independent oracles: each canonical value is re-derived from the rendered
 * visual fields only (never from question.response), so a generator bug that
 * writes a wrong response value fails here even when grader and generator
 * agree with each other.
 */
function deriveCanonicalValue(topicId: string, question: GeneratedQuestion): number {
  const visual = question.visual
  switch (topicId) {
    case "mass-units": {
      expect(visual?.kind).toBe("mass-conversion")
      const fromValue = visual?.fromValue
      expect(fromValue).toBeDefined()
      return visual?.unit === "g → kg" ? fromValue! / 1000 : fromValue! * 1000
    }
    case "reverse-fractions": {
      expect(visual?.kind).toBe("fraction-bar")
      const { numerator, denominator, fromValue } = visual ?? {}
      expect(numerator).toBeDefined()
      expect(denominator).toBeDefined()
      expect(fromValue).toBeDefined()
      return fromValue! / numerator! * denominator!
    }
    case "money-calculations": {
      expect(visual?.kind).toBe("price-table")
      const values = visual?.values ?? []
      if (visual?.variant === "unit-count") {
        expect(values).toHaveLength(6)
        const [childPrice, adultPrice, seniorPrice, categoryIndex, , revenue] = values
        expect([childPrice, adultPrice, seniorPrice][categoryIndex!]).toBeDefined()
        return revenue! / values[categoryIndex!]!
      }
      expect(visual?.variant).toBe("group-total")
      expect(values).toHaveLength(6)
      const [childPrice, adultPrice, seniorPrice, childCount, adultCount, seniorCount] = values
      return childCount! * childPrice! + adultCount! * adultPrice! + seniorCount! * seniorPrice!
    }
    case "proportional-revenue": {
      expect(visual?.kind).toBe("price-table")
      expect(visual?.variant).toBe("ratio-bundle")
      const [childPrice, adultPrice, , totalRevenue, ratio, seniorRevenue] = visual?.values ?? []
      expect(childPrice).toBeDefined()
      expect(adultPrice).toBeDefined()
      expect(totalRevenue).toBeDefined()
      expect(ratio).toBeDefined()
      expect(seniorRevenue).toBeDefined()
      const bundlePrice = ratio! * childPrice! + adultPrice!
      return (totalRevenue! - seniorRevenue!) / bundlePrice * ratio!
    }
    default:
      throw new Error(`No oracle for topic ${topicId}`)
  }
}

function sweepTopic(topicId: TopicId): void {
  for (let index = 0; index < SEED_COUNT; index += 1) {
    const seed = `oracle:${topicId}:${index}`
    const variants = generateDifficultyVariants(topicId, seed)
    expect(generateDifficultyVariants(topicId, seed)).toEqual(variants)

    for (const band of BANDS) {
      const question = variants[band]
      expect(question.generation?.difficultyBand).toBe(band)
      const canonical = deriveCanonicalValue(topicId, question)
      expect(requireNumber(question)).toBe(canonical)
      expect(isCorrectAnswer(question, String(canonical))).toBe(true)
    }
  }
}

describe("independent-oracle sweeps across all difficulty bands", () => {
  it("keeps kg/g mass conversions exact across 500 seeds × 3 bands", () => {
    sweepTopic("mass-units")
  })

  it("recovers the original mass from fraction remnants across 500 seeds × 3 bands", () => {
    sweepTopic("reverse-fractions")
  })

  it("prices groups and unit counts from the rendered price table across 500 seeds × 3 bands", () => {
    sweepTopic("money-calculations")
  })

  it("solves ratio-bundle revenues from the price table across 500 seeds × 3 bands", () => {
    sweepTopic("proportional-revenue")
  })
})
