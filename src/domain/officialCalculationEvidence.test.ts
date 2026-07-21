import { describe, expect, it } from "vitest"
import {
  bestOfficialCalculationPath,
  evaluateOfficialCalculationPath,
  normalizeMathFormulaSymbols,
  parseOfficialCalculationLines,
  type OfficialCalculationStep,
} from "./officialCalculationEvidence"

const canonicalPath: readonly OfficialCalculationStep[] = [
  { left: 671, operator: "multiply", right: 81 },
  { left: { resultOf: 0 }, operator: "divide", right: 11 },
]

const alternativePath: readonly OfficialCalculationStep[] = [
  { left: 671, operator: "divide", right: 11 },
  { left: { resultOf: 0 }, operator: "multiply", right: 81 },
]

describe("official structured calculation evidence", () => {
  it("parses only bounded numeric equations with Swiss decimals and common operators", () => {
    expect(parseOfficialCalculationLines("671 · 81 = 54'351\n54'351 : 11 = 4'941")).toEqual([
      { left: 671, operator: "multiply", right: 81, result: 54_351 },
      { left: 54_351, operator: "divide", right: 11, result: 4_941 },
    ])
    expect(parseOfficialCalculationLines("84 + 2,5 = 86,5; 86,5 - 2,5 = 84")).toEqual([
      { left: 84, operator: "add", right: 2.5, result: 86.5 },
      { left: 86.5, operator: "subtract", right: 2.5, result: 84 },
    ])
    expect(parseOfficialCalculationLines("12 x 5 = 60; 7*8 = 56")).toEqual([
      { left: 12, operator: "multiply", right: 5, result: 60 },
      { left: 7, operator: "multiply", right: 8, result: 56 },
    ])
    expect(parseOfficialCalculationLines("zuerst 671 · 81 = 54351")).toBeUndefined()
    expect(parseOfficialCalculationLines("671 · 81")).toBeUndefined()
  })

  it("normalizes keyboard multiplication characters without changing variables or prose", () => {
    expect(normalizeMathFormulaSymbols("12x5 = 60\n7 * 8 = 56")).toBe("12 × 5 = 60\n7 × 8 = 56")
    expect(normalizeMathFormulaSymbols("x = 5; explain the next step")).toBe("x = 5; explain the next step")
  })

  it("accepts a published path and its commutative operand order", () => {
    expect(evaluateOfficialCalculationPath(
      "81 · 671 = 54351\n54351 : 11 = 4941",
      canonicalPath,
      4_941,
    )).toMatchObject({ arithmeticErrors: 0 })

    expect(bestOfficialCalculationPath(
      "671 : 11 = 61\n81 · 61 = 4941",
      [canonicalPath, alternativePath],
      4_941,
    )).toMatchObject({ arithmeticErrors: 0 })
  })

  it("counts one propagated arithmetic error without treating a wrong operation as evidence", () => {
    expect(evaluateOfficialCalculationPath(
      "671 · 81 = 54340\n54340 : 11 = 4940",
      canonicalPath,
      4_940,
    )).toMatchObject({ arithmeticErrors: 1 })

    expect(evaluateOfficialCalculationPath(
      "671 + 81 = 752\n752 : 11 = 68",
      canonicalPath,
      68,
    )).toBeUndefined()
  })

  it("rejects broken chains, unmatched final answers, missing lines, and extra lines", () => {
    expect(evaluateOfficialCalculationPath(
      "671 · 81 = 54340\n54351 : 11 = 4941",
      canonicalPath,
      4_941,
    )).toBeUndefined()
    expect(evaluateOfficialCalculationPath(
      "671 · 81 = 54351\n54351 : 11 = 4941",
      canonicalPath,
      4_940,
    )).toBeUndefined()
    expect(evaluateOfficialCalculationPath("671 · 81 = 54351", canonicalPath, 4_941)).toBeUndefined()
    expect(evaluateOfficialCalculationPath(
      "671 · 81 = 54351\n54351 : 11 = 4941\n4941 + 0 = 4941",
      canonicalPath,
      4_941,
    )).toBeUndefined()
  })
})
