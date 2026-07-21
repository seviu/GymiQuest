import { describe, expect, it } from "vitest"
import {
  archiveExpansionDiagnostics,
  archiveExpansionFamilyCatalog,
  archiveExpansionTopicIds,
  generateArchiveExpansionQuestion,
  supportsArchiveExpansionTopic,
  type ArchiveExpansionTopicId,
} from "./archiveGeneratorExpansion"
import { learningLocaleIds, topicIds, type GeneratedQuestion, type LearningLocale } from "./model"

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
      fromValue: question.visual.fromValue,
      toValue: question.visual.toValue,
      columns: question.visual.columns,
      rows: question.visual.rows,
      cells: question.visual.cells,
    } : undefined,
  }
}

function independentlyEnumerateRepeatedDigits(
  digits: readonly number[],
  divisor: number,
  digitSum: number,
  lowerBound: number,
  relation: "greater" | "less",
): number[] {
  const solutions: number[] = []
  for (const thousands of digits) {
    for (const hundreds of digits) {
      for (const tens of digits) {
        for (const units of digits) {
          const value = thousands * 1000 + hundreds * 100 + tens * 10 + units
          if (value <= lowerBound || value % divisor !== 0) continue
          if (thousands + hundreds + tens + units !== digitSum) continue
          if (relation === "greater" ? thousands <= units : thousands >= units) continue
          solutions.push(value)
        }
      }
    }
  }
  return [...new Set(solutions)].sort((left, right) => left - right)
}

function requireNumberResponse(question: GeneratedQuestion): number {
  expect(question.response.kind).toBe("number")
  if (question.response.kind !== "number") throw new Error("Expected a number response")
  expect(Number.isFinite(question.response.value)).toBe(true)
  return question.response.value
}

function verifyQuestionInvariant(question: GeneratedQuestion): string {
  expect(question.prompt.length).toBeGreaterThan(40)
  expect(question.answerLabel.length).toBeGreaterThan(2)
  expect(question.hint.length).toBeGreaterThan(20)
  expect(question.easierExplanation.length).toBeGreaterThan(20)
  expect(question.explanation.length).toBeGreaterThan(15)
  expect(question.workedSteps.length).toBeGreaterThanOrEqual(2)
  expect(question.workedSteps.every((step) => step.length > 4)).toBe(true)

  const values = question.visual?.values ?? []
  switch (question.topicId) {
    case "efficient-arithmetic": {
      const [factor, roundBase, offset, nearbyFactor] = values
      expect(question.visual?.kind).toBe("factor-pairs")
      expect(nearbyFactor).toBe(
        question.visual?.variant === "sum" ? roundBase! + offset! : roundBase! - offset!,
      )
      expect(requireNumberResponse(question)).toBe(factor! * nearbyFactor!)
      return `efficient:${question.visual?.variant}`
    }
    case "speed-distance-time": {
      const [normalSpeed, plannedMinutes, distance, requiredSpeed, remainingMinutes, repeatedDistance, detailMinutes, stopMinutes, contextCode] = values
      expect(question.visual?.kind).toBe("motion-model")
      expect(repeatedDistance).toBe(distance)
      expect(distance).toBeCloseTo(normalSpeed! * plannedMinutes! / 60, 8)
      if (contextCode === 0) {
        expect(question.visual?.variant).toBe("return-home")
        expect(remainingMinutes).toBe(plannedMinutes! - 2 * detailMinutes! - stopMinutes!)
      } else {
        expect(contextCode).toBe(1)
        expect(question.visual?.variant).toBe("late-start")
        expect(stopMinutes).toBe(0)
        expect(remainingMinutes).toBe(plannedMinutes! - detailMinutes!)
      }
      expect(requiredSpeed).toBeCloseTo(distance! * 60 / remainingMinutes!, 8)
      expect(requireNumberResponse(question)).toBe(requiredSpeed)
      return contextCode === 0 ? "travel:return-home" : "travel:late-start"
    }
    case "data-tables": {
      const [firstCost, secondCost, firstHours, secondHours, targetHours, baseFee, hourlyRate, targetCost] = values
      expect(question.visual?.kind).toBe("price-table")
      expect(question.visual?.variant).toBe("duration-price")
      const independentRate = (secondCost! - firstCost!) / (secondHours! - firstHours!)
      const independentBase = firstCost! - firstHours! * independentRate
      expect(hourlyRate).toBe(independentRate)
      expect(baseFee).toBe(independentBase)
      expect(targetCost).toBe(independentBase + targetHours! * independentRate)
      expect(requireNumberResponse(question)).toBe(targetCost)
      return "table:duration-price"
    }
    case "number-constraints": {
      expect(question.response.kind).toBe("integer-set")
      if (question.response.kind !== "integer-set") throw new Error("Expected an integer-set response")
      const digits = values.slice(0, 4)
      const divisor = values[4]!
      const digitSum = values[5]!
      const lowerBound = values[6]!
      const relation = question.visual?.variant
      expect(relation === "greater" || relation === "less").toBe(true)
      if (relation !== "greater" && relation !== "less") throw new Error("Expected a place-value relation")
      const expected = independentlyEnumerateRepeatedDigits(
        digits,
        divisor,
        digitSum,
        lowerBound,
        relation,
      )
      expect(question.response.values).toEqual(expected)
      expect(new Set(question.response.values).size).toBe(question.response.values.length)
      expect(question.response.values).toHaveLength(values[8]!)
      return `digits:${relation}`
    }
    case "cuboid-surface": {
      const [length, width, volume, height] = values
      expect(question.visual?.kind).toBe("cuboid")
      expect(question.visual?.variant).toBe("missing-edge")
      expect(volume).toBe(length! * width! * height!)
      expect(requireNumberResponse(question)).toBe(volume! / (length! * width!))
      return "cuboid:missing-edge"
    }
    default:
      throw new Error(`Unexpected expansion topic: ${question.topicId}`)
  }
}

describe("archive generator expansion", () => {
  it("publishes stable family and template metadata with substantial solved spaces", () => {
    const diagnostics = archiveExpansionDiagnostics()

    expect(archiveExpansionFamilyCatalog.map((family) => family.familyId)).toEqual([
      "archive-v5-efficient-compensation",
      "archive-v5-travel-timing",
      "archive-v5-duration-price-table",
      "archive-v5-repeated-digit-filter",
      "archive-v5-cuboid-missing-edge",
    ])
    expect(new Set(archiveExpansionFamilyCatalog.flatMap((family) => family.templateIds)).size).toBe(7)
    expect(diagnostics.efficientArithmeticCandidates).toBeGreaterThan(300)
    expect(diagnostics.returnHomeCandidates).toBeGreaterThan(150)
    expect(diagnostics.lateStartCandidates).toBeGreaterThan(90)
    expect(diagnostics.rentalTableCandidates).toBeGreaterThan(1_000)
    expect(diagnostics.repeatedDigitCandidates).toBeGreaterThan(150)
    expect(diagnostics.missingEdgeCandidates).toBeGreaterThan(100)
    expect(diagnostics.totalCandidates).toBe(
      diagnostics.families.reduce((sum, family) => sum + family.candidateCount, 0),
    )
    expect(diagnostics.families.map((family) => family.familyId)).toEqual(
      archiveExpansionFamilyCatalog.map((family) => family.familyId),
    )
    expect(diagnostics.families.every((family) => (
      family.candidateCount === family.templates.reduce((sum, template) => sum + template.candidateCount, 0)
    ))).toBe(true)
  })

  it("advertises only the five expansion topics", () => {
    expect(topicIds.filter(supportsArchiveExpansionTopic)).toEqual(archiveExpansionTopicIds)
    expect(archiveExpansionTopicIds.every((topicId) => supportsArchiveExpansionTopic(topicId))).toBe(true)
    expect(supportsArchiveExpansionTopic("mass-units")).toBe(false)
  })

  it("is deterministic and exact across 1,000 seeds per family", () => {
    const observedForms = new Set<string>()
    const repeatedDigitExamples = new Set<number>()

    for (const topicId of archiveExpansionTopicIds) {
      for (let index = 0; index < 1_000; index += 1) {
        const seed = `archive-expansion:${topicId}:${index}`
        const question = generateArchiveExpansionQuestion(topicId, seed, `question:${index}`)
        const replay = generateArchiveExpansionQuestion(topicId, seed, `question:${index}`)

        expect(replay).toEqual(question)
        expect(question.id).toBe(`question:${index}`)
        expect(question.topicId).toBe(topicId)
        expect(question.provenance?.kind).toBe("original-dynamic")
        expect(question.provenance?.familyId).toMatch(/^archive-v5-/u)
        expect(question.provenance?.templateVersion).toBe(1)
        observedForms.add(verifyQuestionInvariant(question))

        if (question.response.kind === "integer-set") {
          for (const value of question.response.values) {
            const digits = String(value).split("")
            if (new Set(digits).size < digits.length) repeatedDigitExamples.add(value)
          }
        }
      }
    }

    expect(observedForms).toEqual(new Set([
      "efficient:difference",
      "efficient:sum",
      "travel:return-home",
      "travel:late-start",
      "table:duration-price",
      "digits:greater",
      "digits:less",
      "cuboid:missing-edge",
    ]))
    // Even after capping each learner answer at eight values, many different
    // valid numbers must demonstrate that repetition is genuinely exercised.
    expect(repeatedDigitExamples.size).toBeGreaterThan(80)
  }, 30_000)

  it("keeps the mathematics identical in German, English, Italian and Spanish", () => {
    for (const topicId of archiveExpansionTopicIds) {
      for (let index = 0; index < 80; index += 1) {
        const seed = `archive-expansion-locales:${topicId}:${index}`
        const questions = Object.fromEntries(
          learningLocaleIds.map((locale) => [
            locale,
            generateArchiveExpansionQuestion(topicId, seed, seed, locale),
          ]),
        ) as Record<LearningLocale, GeneratedQuestion>
        const germanSignature = mathematicalSignature(questions.de)

        for (const locale of learningLocaleIds) {
          expect(mathematicalSignature(questions[locale]), `${topicId}/${locale}/${index}`).toEqual(germanSignature)
          expect(questions[locale].provenance, `${topicId}/${locale}/${index}`).toEqual(questions.de.provenance)
          expect(verifyQuestionInvariant(questions[locale]), `${topicId}/${locale}/${index}`).toBeTruthy()
        }
        expect(new Set(learningLocaleIds.map((locale) => questions[locale].prompt)).size).toBe(4)
        expect(new Set(learningLocaleIds.map((locale) => questions[locale].hint)).size).toBe(4)
      }
    }
  }, 30_000)

  it("rejects no supported family at the dispatch boundary", () => {
    const generated = archiveExpansionTopicIds.map((topicId: ArchiveExpansionTopicId) =>
      generateArchiveExpansionQuestion(topicId, "dispatch-smoke", `dispatch:${topicId}`, "en")
    )
    expect(generated.map((question) => question.topicId)).toEqual(archiveExpansionTopicIds)
  })
})
