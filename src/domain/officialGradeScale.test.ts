import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
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

describe("published docs grade tables", () => {
  function readDoc(relativeDocPath: string): string {
    return readFileSync(new URL(relativeDocPath, import.meta.url), "utf8")
  }

  /** Parses the four-column `| points | grade | points | grade |` docs tables. */
  function docsGradeMap(relativeDocPath: string): Map<number, number> {
    const markdown = readDoc(relativeDocPath)
    const grades = new Map<number, number>()
    for (const line of markdown.split("\n")) {
      const cells = line.split("|").slice(1, -1).map((cell) => cell.trim())
      for (let index = 0; index + 1 < cells.length; index += 2) {
        const pointsCell = cells[index]!
        const gradeCell = cells[index + 1]!
        const range = pointsCell.match(/^(\d+)(?:–(\d+))?$/)
        if (!range || !/^\d+(\.\d+)?$/.test(gradeCell)) continue
        const from = Number(range[1])
        const to = Number(range[2] ?? range[1])
        for (let points = from; points <= to; points += 1) {
          grades.set(points, Number(gradeCell))
        }
      }
    }
    return grades
  }

  it("keeps the 2024 checklist table in sync with the code scale for all 37 totals", () => {
    const grades = docsGradeMap("../../docs/2024-author-validation-checklist.md")
    expect(grades.size).toBe(37)
    for (let points = 0; points <= 36; points += 1) {
      expect(grades.get(points), `points ${points}`).toBe(official2024MathematicsGrade(points))
    }
  })

  it("keeps the 2025 inventory table in sync with the code scale for all 37 totals", () => {
    const grades = docsGradeMap("../../docs/2025-curriculum-inventory.md")
    expect(grades.size).toBe(37)
    for (let points = 0; points <= 36; points += 1) {
      expect(grades.get(points), `points ${points}`).toBe(official2025MathematicsGrade(points))
    }
  })

  it("binds the 2024 code scale to the checklist source hash and URL", () => {
    const checklist = readDoc("../../docs/2024-author-validation-checklist.md")
    expect(checklist).toContain(official2024MathGradeScale.sourceSha256)
    expect(checklist).toContain("notenskala_zap_lg_2024.pdf")
    expect(official2024MathGradeScale.sourceUrl).toContain("notenskala_zap_lg_2024.pdf")
  })
})
