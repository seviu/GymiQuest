import { describe, expect, it } from "vitest"
import { cubeNetCandidates } from "./cubeNet"
import {
  buildAverageMotionModel,
  buildCatchUpMotionModel,
  buildChangingSupplyModel,
  buildCoinCombinationModel,
  buildCubeNetPlaygroundModel,
  buildDataTableComplementModel,
  buildEfficientArithmeticModel,
  buildFractionQuantityModel,
  buildInverseSupplyModel,
  buildMassConversionModel,
  buildMissingAverageModel,
  buildMoneyRelationshipModel,
  buildNumberFilterModel,
  buildRepeatedDigitFilterModel,
  buildOperationChainModel,
  buildRevenueBundleModel,
  buildTableDifferenceModel,
  buildTimeFractionModel,
  cubeFaceRelation,
  cubeOppositeLabel,
  transformCoordinatePoint,
} from "./conceptPlayground"
import type { GeneratedQuestion } from "./model"

describe("concept playground mathematics", () => {
  it("applies every supported coordinate rule exactly", () => {
    const point = { x: 2, y: -3 }

    expect(transformCoordinatePoint(point, "reflect-x")).toEqual({ x: 2, y: 3 })
    expect(transformCoordinatePoint(point, "reflect-y")).toEqual({ x: -2, y: -3 })
    expect(transformCoordinatePoint(point, "reflect-origin")).toEqual({ x: -2, y: 3 })
    expect(transformCoordinatePoint(point, "rotate-cw")).toEqual({ x: -3, y: -2 })
    expect(transformCoordinatePoint(point, "rotate-ccw")).toEqual({ x: 3, y: 2 })
    expect(transformCoordinatePoint(point, "translate")).toEqual({ x: 4, y: -4 })
  })

  it("keeps forward and reverse fraction quantities on the same exact model", () => {
    expect(buildFractionQuantityModel(3, 5, 4)).toEqual({
      numerator: 3,
      denominator: 5,
      onePart: 4,
      whole: 20,
      knownPart: 12,
    })
    expect(() => buildFractionQuantityModel(6, 5)).toThrow(RangeError)
  })

  it("converts quarter-kilogram steps without floating-point drift", () => {
    expect(buildMassConversionModel(1)).toEqual({ kilograms: 0.25, grams: 250 })
    expect(buildMassConversionModel(7)).toEqual({ kilograms: 1.75, grams: 1750 })
  })

  it("builds an integral operation chain that reverses exactly", () => {
    expect(buildOperationChainModel(6, 8, 9)).toEqual({
      multiplier: 6,
      divisor: 8,
      base: 9,
      unknown: 72,
      afterMultiplication: 432,
      result: 54,
    })
    expect(() => buildOperationChainModel(6, 0, 9)).toThrow(RangeError)
  })

  it("keeps a time fraction in whole minute parts", () => {
    expect(buildTimeFractionModel(3, 7, 20)).toEqual({
      numerator: 3,
      denominator: 7,
      onePartMinutes: 20,
      totalMinutes: 140,
      fractionMinutes: 60,
    })
    expect(() => buildTimeFractionModel(8, 7, 20)).toThrow(RangeError)
  })

  it("derives average speed from total distance and total time", () => {
    const model = buildAverageMotionModel(40, 30, 80, 60)
    expect(model.firstDistance).toBe(20)
    expect(model.secondDistance).toBe(80)
    expect(model.totalDistance).toBe(100)
    expect(model.totalMinutes).toBe(90)
    expect(model.averageSpeed).toBeCloseTo(66.6666667)
  })

  it("derives a catch-up point from head start and relative speed", () => {
    expect(buildCatchUpMotionModel(10, 20, 30)).toEqual({
      slowSpeed: 10,
      fastSpeed: 20,
      headStartMinutes: 30,
      headStartDistance: 5,
      relativeSpeed: 10,
      catchMinutes: 30,
      meetingDistance: 10,
    })
    expect(() => buildCatchUpMotionModel(20, 20, 30)).toThrow(RangeError)
  })

  it("conserves person-days before and after a group changes", () => {
    expect(buildInverseSupplyModel(24, 30, 18)).toEqual({
      originalPeople: 24,
      originalDays: 30,
      newPeople: 18,
      totalPersonDays: 720,
      newDays: 40,
    })
    expect(buildChangingSupplyModel(24, 30, 6, 18)).toEqual({
      originalPeople: 24,
      originalDays: 30,
      newPeople: 18,
      totalPersonDays: 720,
      elapsedDays: 6,
      usedPersonDays: 144,
      remainingPersonDays: 576,
      newDays: 32,
    })
    expect(() => buildChangingSupplyModel(24, 30, 30, 18)).toThrow(RangeError)
  })

  it("keeps direct and factored arithmetic exactly equivalent", () => {
    expect(buildEfficientArithmeticModel(18, 47, 53, "sum")).toEqual({
      factor: 18,
      left: 47,
      right: 53,
      operation: "sum",
      leftProduct: 846,
      rightProduct: 954,
      combined: 100,
      result: 1800,
    })
    expect(buildEfficientArithmeticModel(25, 72, 47, "difference").result).toBe(625)
    expect(() => buildEfficientArithmeticModel(25, 47, 72, "difference")).toThrow(RangeError)
  })

  it("derives table complements, missing averages, and differences", () => {
    expect(buildDataTableComplementModel(14, [5, 6, 4], [3, 2, 5])).toEqual({
      totalPerRow: 14,
      rows: [
        { hiking: 5, swimming: 3, neither: 6 },
        { hiking: 6, swimming: 2, neither: 6 },
        { hiking: 4, swimming: 5, neither: 5 },
      ],
      totalDays: 42,
      hikingTotal: 15,
      swimmingTotal: 10,
      neitherTotal: 17,
    })
    expect(buildMissingAverageModel(24, [18, 29])).toEqual({
      average: 24,
      entryCount: 3,
      targetTotal: 72,
      knownValues: [18, 29],
      knownTotal: 47,
      missingValue: 25,
    })
    expect(buildTableDifferenceModel(16.5, 9)).toEqual({ total: 16.5, known: 9, missing: 7.5 })
  })

  it("keeps unit-price and ratio-bundle money models reversible", () => {
    expect(buildMoneyRelationshipModel(8, 36)).toEqual({ price: 8, count: 36, revenue: 288 })
    expect(buildRevenueBundleModel(8, 20, 3, 14)).toEqual({
      childPrice: 8,
      adultPrice: 20,
      childRatio: 3,
      packages: 14,
      bundlePrice: 44,
      childCount: 42,
      adultCount: 14,
      revenue: 616,
    })
  })

  it("enumerates every positive coin combination from one shared algorithm", () => {
    expect(buildCoinCombinationModel([5, 2, 1], 10)).toEqual({
      denominations: [5, 2, 1],
      total: 10,
      solutions: [[1, 1, 3], [1, 2, 1]],
    })
  })

  it("shows every stage of a complete digit filter", () => {
    const model = buildNumberFilterModel([1, 2, 3, 4], 4, "greater")
    expect(model.candidates).toHaveLength(24)
    expect(model.divisible).toHaveLength(6)
    expect(model.solutions).toEqual([3412, 4132, 4312])
  })

  it("keeps repeated digits while applying every complete-set filter", () => {
    const model = buildRepeatedDigitFilterModel([1, 3, 5, 7], 5, 16, 3_000, "greater")

    expect(model.candidates).toHaveLength(256)
    expect(model.candidates).toContain(3315)
    expect(model.divisibleAndAboveBound.every((value) => value > 3_000 && value % 5 === 0)).toBe(true)
    expect(model.matchingDigitSum.every((value) => (
      String(value).split("").reduce((sum, digit) => sum + Number(digit), 0) === 16
    ))).toBe(true)
    expect(model.solutions.every((value) => Math.floor(value / 1_000) > value % 10)).toBe(true)
  })

  it("derives opposite and neighboring faces by folding the actual net", () => {
    const cells = cubeNetCandidates()[0]!
    const columns = Math.max(...cells.map((cell) => cell.x)) + 1
    const rows = Math.max(...cells.map((cell) => cell.y)) + 1
    const labels = ["A", "B", "C", "D", "E", "F"]
    const question: GeneratedQuestion = {
      id: "cube-playground",
      topicId: "cube-nets",
      prompt: "Würfelnetz",
      answerLabel: "Gegenfläche",
      response: { kind: "choice", value: "A", options: [] },
      hint: "",
      easierExplanation: "",
      explanation: "",
      workedSteps: [],
      visual: {
        kind: "cube-net",
        labels,
        cells: cells.map((cell) => cell.y * columns + cell.x),
        columns,
        rows,
        unit: "C",
      },
    }

    const model = buildCubeNetPlaygroundModel(question)
    expect(model).toBeDefined()
    if (!model) return

    for (const target of labels) {
      const opposite = cubeOppositeLabel(model, target)
      expect(opposite).not.toBe(target)
      expect(cubeOppositeLabel(model, opposite)).toBe(target)
      expect(cubeFaceRelation(model, target, opposite)).toBe("opposite")

      for (const candidate of labels) {
        if (cubeFaceRelation(model, target, candidate) === "net-neighbor") {
          expect(candidate).not.toBe(opposite)
        }
      }
    }
  })
})
