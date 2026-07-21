import { describe, expect, it } from "vitest"
import {
  formatSwissGrade,
  officialMathematicsGradeForEdition,
  official2024MathematicsGrade,
  official2024MathGradeScale,
  official2025MathematicsGrade,
  official2025MathGradeScale,
} from "./officialGradeScale"

function coveredPoints(scale: { bands: readonly { fromPoints: number; toPoints: number }[] }): number[] {
  return scale.bands.flatMap((band) => (
    Array.from({ length: band.toPoints - band.fromPoints + 1 }, (_, index) => band.fromPoints + index)
  ))
}

describe("official 2024 mathematics grade scale", () => {
  it("covers every whole point total exactly once and matches the published boundaries", () => {
    const covered = coveredPoints(official2024MathGradeScale)
    expect(covered).toEqual(Array.from({ length: 37 }, (_, points) => points))
    expect(covered.map(official2024MathematicsGrade)).toEqual([
      1,
      1.25, 1.25,
      1.5, 1.5,
      1.75, 1.75,
      2, 2,
      2.25,
      2.5, 2.5,
      2.75, 2.75,
      3, 3,
      3.25, 3.25,
      3.5,
      3.75, 3.75,
      4, 4,
      4.25, 4.25,
      4.5, 4.5,
      4.75,
      5, 5,
      5.25, 5.25,
      5.5, 5.5,
      5.75, 5.75,
      6,
    ])
  })

  it("rejects impossible 2024 totals", () => {
    expect(() => official2024MathematicsGrade(-1)).toThrow()
    expect(() => official2024MathematicsGrade(20.5)).toThrow()
    expect(() => official2024MathematicsGrade(37)).toThrow()
  })

  it("resolves a grade only from the matching edition", () => {
    expect(officialMathematicsGradeForEdition("zap-zh-lg-2024", 20)).toEqual({
      gradeScaleId: "zap-lg-2024-math-2024-03-15",
      mathematicsGrade: 3.75,
    })
    expect(officialMathematicsGradeForEdition("zap-zh-lg-2025", 20)).toEqual({
      gradeScaleId: "zap-lg-2025-math-2025-03-14",
      mathematicsGrade: 4.25,
    })
    expect(officialMathematicsGradeForEdition("zap-zh-lg-2023", 20)).toBeUndefined()
  })
})

describe("official 2025 mathematics grade scale", () => {
  it("covers every whole point total exactly once and never decreases", () => {
    const covered = coveredPoints(official2025MathGradeScale)
    expect(covered).toEqual(Array.from({ length: 37 }, (_, points) => points))

    const grades = covered.map(official2025MathematicsGrade)
    expect(grades.every((grade, index) => index === 0 || grade >= grades[index - 1]!)).toBe(true)
  })

  it("matches the published 2025 boundary values", () => {
    expect(official2025MathematicsGrade(0)).toBe(1)
    expect(official2025MathematicsGrade(19)).toBe(4)
    expect(official2025MathematicsGrade(24)).toBe(4.75)
    expect(official2025MathematicsGrade(31)).toBe(5.75)
    expect(official2025MathematicsGrade(32)).toBe(6)
    expect(official2025MathematicsGrade(36)).toBe(6)
  })

  it("rejects totals that cannot occur and formats Swiss quarter grades", () => {
    expect(() => official2025MathematicsGrade(-1)).toThrow()
    expect(() => official2025MathematicsGrade(20.5)).toThrow()
    expect(() => official2025MathematicsGrade(37)).toThrow()
    expect(formatSwissGrade(6)).toBe("6.0")
    expect(formatSwissGrade(4.75)).toBe("4.75")
    expect(formatSwissGrade(5.5)).toBe("5.5")
  })
})
