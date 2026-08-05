import { describe, expect, it } from "vitest"
import { generateQuestion, isCorrectAnswer } from "./generators"
import type { GeneratedQuestion } from "./model"

const SEED_COUNT = 200
const SKIP_RATIO_LIMIT = 0.1

function canonicalInput(question: GeneratedQuestion): string {
  switch (question.response.kind) {
    case "number":
      return String(question.response.value)
    case "fraction":
      return `${question.response.numerator}/${question.response.denominator}`
    case "integer-set":
      return question.response.values.join(", ")
    case "coordinate":
      return `${question.response.x}|${question.response.y}`
    default:
      throw new Error(`Unexpected response kind: ${question.response.kind}`)
  }
}

/**
 * False-accept sweeps: a perturbed learner input (one small, plausible slip)
 * must FAIL isCorrectAnswer. Each block keeps the canonical input as a
 * positive control so a grader that rejects everything cannot pass, and
 * counts seeds where the perturbation accidentally coincides with the
 * canonical value (e.g. symmetric coordinates) so the sweep stays
 * meaningful — the skip rate must stay below 10%.
 */
describe("negative-grading sweeps", () => {
  it("rejects a number answer off by one across 200 seeds", () => {
    for (let index = 0; index < SEED_COUNT; index += 1) {
      const question = generateQuestion("mass-units", `negative:number:${index}`)
      const expected = question.response.value
      if (question.response.kind !== "number") throw new Error("Expected a number response")

      expect(isCorrectAnswer(question, canonicalInput(question))).toBe(true)
      expect(isCorrectAnswer(question, String(expected + 1))).toBe(false)
      expect(isCorrectAnswer(question, String(expected - 1))).toBe(false)
    }
  })

  it("rejects a swapped fraction across 200 seeds", () => {
    let skipped = 0
    for (let index = 0; index < SEED_COUNT; index += 1) {
      const question = generateQuestion("area-fractions", `negative:fraction:${index}`)
      if (question.response.kind !== "fraction") throw new Error("Expected a fraction response")
      const { numerator, denominator } = question.response

      // A square fraction swaps onto itself; the input would be accepted, so skip.
      if (numerator === denominator) {
        skipped += 1
        continue
      }
      expect(isCorrectAnswer(question, canonicalInput(question))).toBe(true)
      expect(isCorrectAnswer(question, `${denominator}/${numerator}`)).toBe(false)
    }
    expect(skipped / SEED_COUNT).toBeLessThan(SKIP_RATIO_LIMIT)
  })

  it("rejects a solution set with one member replaced by a non-member across 200 seeds", () => {
    for (let index = 0; index < SEED_COUNT; index += 1) {
      const question = generateQuestion("number-constraints", `negative:set:${index}`)
      if (question.response.kind !== "integer-set") throw new Error("Expected an integer-set response")
      const [first, ...rest] = question.response.values

      // Every set member is a four-digit number, so a five-digit replacement
      // can never coincide with a member.
      const nonMember = 10_000 + first!
      expect(rest.some((entry) => entry === nonMember)).toBe(false)
      expect(isCorrectAnswer(question, canonicalInput(question))).toBe(true)
      expect(isCorrectAnswer(question, [nonMember, ...rest].join(", "))).toBe(false)
    }
  })

  it("rejects swapped coordinates across 200 seeds", () => {
    let skipped = 0
    for (let index = 0; index < SEED_COUNT; index += 1) {
      const question = generateQuestion("coordinate-transformations", `negative:coordinate:${index}`)
      if (question.response.kind !== "coordinate") throw new Error("Expected a coordinate response")
      const { x, y } = question.response

      // Symmetric coordinates swap onto themselves, so the swap is accepted.
      if (x === y) {
        skipped += 1
        continue
      }
      expect(isCorrectAnswer(question, canonicalInput(question))).toBe(true)
      expect(isCorrectAnswer(question, `${y}|${x}`)).toBe(false)
    }
    expect(skipped / SEED_COUNT).toBeLessThan(SKIP_RATIO_LIMIT)
  })
})
