import { describe, expect, it } from "vitest"
import {
  archiveCoverageDiagnostics,
  archiveCoverageFamilyCatalog,
  archiveCoverageTopicIds,
  generateArchiveCoverageQuestion,
  supportsArchiveCoverageTopic,
  type ArchiveCoverageTopicId,
} from "./archiveGeneratorCoverage"
import {
  learningLocaleIds,
  topicIds,
  type GeneratedQuestion,
  type LearningLocale,
} from "./model"

function mathematicalSignature(question: GeneratedQuestion): unknown {
  return {
    topicId: question.topicId,
    response: question.response,
    visual: question.visual ? {
      kind: question.visual.kind,
      variant: question.visual.variant,
      values: question.visual.values,
      numerator: question.visual.numerator,
      denominator: question.visual.denominator,
      columns: question.visual.columns,
      rows: question.visual.rows,
      cells: question.visual.cells,
    } : undefined,
  }
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

function leastCommonMultiple(left: number, right: number): number {
  return Math.abs(left * right) / greatestCommonDivisor(left, right)
}

function requireNumberResponse(question: GeneratedQuestion): number {
  expect(question.response.kind).toBe("number")
  if (question.response.kind !== "number") throw new Error("Expected a number response")
  expect(Number.isFinite(question.response.value)).toBe(true)
  return question.response.value
}

function verifyQuestionInvariant(question: GeneratedQuestion): string {
  expect(question.prompt.length).toBeGreaterThan(55)
  expect(question.answerLabel.length).toBeGreaterThan(2)
  expect(question.hint.length).toBeGreaterThan(25)
  expect(question.easierExplanation.length).toBeGreaterThan(25)
  expect(question.explanation.length).toBeGreaterThan(8)
  expect(question.workedSteps.length).toBeGreaterThanOrEqual(2)

  const values = question.visual?.values ?? []
  switch (question.topicId) {
    case "arithmetic-equations": {
      const [multiplier, offset, total, smaller, larger, asksForLarger] = values
      expect(question.visual?.kind).toBe("equation-balance")
      expect(question.visual?.variant).toBe("relation-total")
      expect(larger).toBe(multiplier! * smaller! + offset!)
      expect(total).toBe(smaller! + larger!)
      expect(requireNumberResponse(question)).toBe(asksForLarger === 1 ? larger : smaller)
      return asksForLarger === 1 ? "relation:larger" : "relation:smaller"
    }
    case "cuboid-surface": {
      const [length, width, height, topCubes, totalCubes, exposedFaces] = values
      expect(question.visual?.kind).toBe("cuboid")
      expect(totalCubes).toBe(length! * width! * height! + topCubes!)
      const baseSurface = 2 * (length! * width! + length! * height! + width! * height!)
      expect(exposedFaces).toBe(baseSurface + 2 * topCubes! + 2)
      if (question.visual?.variant === "voxel-surface") {
        expect(requireNumberResponse(question)).toBe(exposedFaces)
        return "voxel:surface"
      }
      expect(question.visual?.variant).toBe("voxel-count")
      expect(requireNumberResponse(question)).toBe(totalCubes)
      return "voxel:cubes"
    }
    case "integer-combinations": {
      const [first, second, third, coincidence] = values
      expect(question.visual?.kind).toBe("clock")
      expect(question.visual?.variant).toBe("recurring-cycles")
      const expected = third! > 0
        ? leastCommonMultiple(leastCommonMultiple(first!, second!), third!)
        : leastCommonMultiple(first!, second!)
      expect(coincidence).toBe(expected)
      expect(requireNumberResponse(question)).toBe(expected)
      return third! > 0 ? "cycles:three" : "cycles:two"
    }
    case "number-constraints": {
      const [left, centre, right, middleLeft, middleRight, top] = values
      expect(question.visual?.kind).toBe("number-wall")
      expect(middleLeft).toBe(left! + centre!)
      expect(middleRight).toBe(centre! + right!)
      expect(top).toBe(middleLeft! + middleRight!)
      if (question.visual?.variant === "number-wall-centre") {
        expect(requireNumberResponse(question)).toBe((top! - left! - right!) / 2)
        return "wall:centre"
      }
      expect(question.visual?.variant).toBe("number-wall-edge")
      expect(requireNumberResponse(question)).toBe(top! - middleLeft! - centre!)
      return "wall:edge"
    }
    case "fraction-of-quantity": {
      const [
        leftNumerator,
        denominator,
        rightNumerator,
        repeatedDenominator,
        answerNumerator,
        answerDenominator,
      ] = values
      expect(question.visual?.kind).toBe("number-line")
      expect(repeatedDenominator).toBe(denominator)
      expect(question.response.kind).toBe("fraction")
      if (question.response.kind !== "fraction") throw new Error("Expected fraction response")
      const unsimplifiedNumerator = question.visual?.variant === "fraction-midpoint"
        ? (leftNumerator! + rightNumerator!) / 2
        : rightNumerator! - leftNumerator!
      const divisor = greatestCommonDivisor(unsimplifiedNumerator, denominator!)
      expect(question.response).toEqual({
        kind: "fraction",
        numerator: unsimplifiedNumerator / divisor,
        denominator: denominator! / divisor,
        requireSimplified: true,
      })
      expect(answerNumerator).toBe(question.response.numerator)
      expect(answerDenominator).toBe(question.response.denominator)
      return question.visual?.variant === "fraction-midpoint"
        ? "line:midpoint"
        : "line:distance"
    }
    default:
      throw new Error(`Unexpected coverage topic: ${question.topicId}`)
  }
}

describe("archive generator coverage wave", () => {
  it("publishes five stable families, ten templates and large solved spaces", () => {
    const diagnostics = archiveCoverageDiagnostics()

    expect(archiveCoverageFamilyCatalog.map((family) => family.familyId)).toEqual([
      "archive-v6-relational-systems",
      "archive-v6-voxel-solids",
      "archive-v6-recurring-cycles",
      "archive-v6-number-walls",
      "archive-v6-number-line",
    ])
    expect(new Set(archiveCoverageFamilyCatalog.flatMap((family) => family.templateIds)).size).toBe(10)
    expect(diagnostics.relationalSystemCandidates).toBeGreaterThan(300)
    expect(diagnostics.voxelSolidCandidates).toBeGreaterThan(150)
    expect(diagnostics.twoCycleCandidates).toBeGreaterThan(20)
    expect(diagnostics.threeCycleCandidates).toBeGreaterThan(20)
    expect(diagnostics.numberWallCandidates).toBeGreaterThan(1_000)
    expect(diagnostics.midpointCandidates).toBeGreaterThan(100)
    expect(diagnostics.distanceCandidates).toBeGreaterThan(200)
    expect(diagnostics.totalCandidates).toBe(
      diagnostics.families.reduce((sum, family) => sum + family.candidateCount, 0),
    )
    expect(diagnostics.families.every((family) => (
      family.candidateCount === family.templates.reduce(
        (sum, template) => sum + template.candidateCount,
        0,
      )
    ))).toBe(true)
  })

  it("advertises only its five coverage topics", () => {
    expect(new Set(topicIds.filter(supportsArchiveCoverageTopic))).toEqual(
      new Set(archiveCoverageTopicIds),
    )
    expect(archiveCoverageTopicIds.every(supportsArchiveCoverageTopic)).toBe(true)
    expect(supportsArchiveCoverageTopic("mass-units")).toBe(false)
  })

  it("is deterministic and independently exact across 1,000 seeds per family", () => {
    const observedForms = new Set<string>()

    for (const topicId of archiveCoverageTopicIds) {
      for (let index = 0; index < 1_000; index += 1) {
        const seed = `archive-coverage:${topicId}:${index}`
        const question = generateArchiveCoverageQuestion(topicId, seed, `question:${index}`)
        const replay = generateArchiveCoverageQuestion(topicId, seed, `question:${index}`)

        expect(replay).toEqual(question)
        expect(question.id).toBe(`question:${index}`)
        expect(question.topicId).toBe(topicId)
        expect(question.provenance?.kind).toBe("original-dynamic")
        expect(question.provenance?.familyId).toMatch(/^archive-v6-/u)
        expect(question.provenance?.templateVersion).toBe(1)
        observedForms.add(verifyQuestionInvariant(question))
      }
    }

    expect(observedForms).toEqual(new Set([
      "relation:larger",
      "relation:smaller",
      "voxel:surface",
      "voxel:cubes",
      "cycles:three",
      "cycles:two",
      "wall:centre",
      "wall:edge",
      "line:midpoint",
      "line:distance",
    ]))
  }, 30_000)

  it("keeps the mathematics identical in all four generated-content locales", () => {
    for (const topicId of archiveCoverageTopicIds) {
      for (let index = 0; index < 80; index += 1) {
        const seed = `archive-coverage-locales:${topicId}:${index}`
        const questions = Object.fromEntries(
          learningLocaleIds.map((locale) => [
            locale,
            generateArchiveCoverageQuestion(topicId, seed, seed, locale),
          ]),
        ) as Record<LearningLocale, GeneratedQuestion>
        const germanSignature = mathematicalSignature(questions.de)

        for (const locale of learningLocaleIds) {
          expect(mathematicalSignature(questions[locale]), `${topicId}/${locale}/${index}`)
            .toEqual(germanSignature)
          expect(questions[locale].provenance).toEqual(questions.de.provenance)
          expect(verifyQuestionInvariant(questions[locale])).toBeTruthy()
        }
        expect(new Set(learningLocaleIds.map((locale) => questions[locale].prompt)).size).toBe(4)
        expect(new Set(learningLocaleIds.map((locale) => questions[locale].hint)).size).toBe(4)
      }
    }
  }, 30_000)

  it("rejects no supported family at the dispatcher boundary", () => {
    const generated = archiveCoverageTopicIds.map((topicId: ArchiveCoverageTopicId) => (
      generateArchiveCoverageQuestion(topicId, "dispatch-smoke", `dispatch:${topicId}`, "en")
    ))
    expect(generated.map((question) => question.topicId)).toEqual(archiveCoverageTopicIds)
  })
})
