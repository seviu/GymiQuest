import { describe, expect, it } from "vitest"
import { buildPyramidRollPath, findMissingPyramidFace, type PyramidRollDirection } from "./areaSpatial"
import { generateQuestion, isCorrectAnswer } from "./generators"
import { gradeGeometryConstruction } from "./geometryConstruction"
import { generateZap2025Question } from "./zap2025Generators"

function expectNumberResponse(question: ReturnType<typeof generateQuestion>): number {
  expect(question.response.kind).toBe("number")
  if (question.response.kind !== "number") throw new Error("Expected number response")
  return question.response.value
}

describe("2025 generator invariants", () => {
  it("keeps missing-value equations algebraically valid", () => {
    for (let index = 0; index < 250; index += 1) {
      const question = generateQuestion("arithmetic-equations", `equation:${index}`)
      const [multiplier, divisor, result] = question.visual!.values!
      const answer = expectNumberResponse(question)
      expect((answer * multiplier!) / divisor!).toBe(result)
    }
  })

  it("keeps mixed-time fractions exact in minutes", () => {
    for (let index = 0; index < 250; index += 1) {
      const question = generateQuestion("time-fractions", `time:${index}`)
      const [total, subtract, remaining] = question.visual!.values!
      const denominator = question.visual!.denominator!
      const numerator = expectNumberResponse(question)
      expect(numerator * (total! / denominator) - subtract!).toBe(remaining)
    }
  })

  it("derives reduced area fractions from the rendered unit grid", () => {
    for (let index = 0; index < 250; index += 1) {
      const question = generateQuestion("area-fractions", `area:${index}`)
      expect(question.response.kind).toBe("fraction")
      if (question.response.kind !== "fraction") throw new Error("Expected fraction response")
      const total = question.visual!.columns! * question.visual!.rows!
      const white = total - new Set(question.visual!.cells).size
      expect(question.response.numerator * total).toBe(white * question.response.denominator)
    }
  })

  it("prices every optimized tiling from its rendered placement", () => {
    for (let index = 0; index < 250; index += 1) {
      const question = generateQuestion("tiling-costs", `tiling:${index}`)
      const [smallCost, largeCost] = question.visual!.values!
      const totalCells = question.visual!.columns! * question.visual!.rows!
      const coveredCells = new Set(question.visual!.cells).size
      const largeCount = coveredCells / 4
      const smallCount = totalCells - coveredCells
      expect(expectNumberResponse(question)).toBe(largeCount * largeCost! + smallCount * smallCost!)
    }
  })

  it("preserves person-days in inverse and changing-rate problems", () => {
    for (let index = 0; index < 250; index += 1) {
      const inverse = generateQuestion("inverse-proportion", `inverse:${index}`)
      const [oldPeople, oldDays, newPeople] = inverse.visual!.values!
      const newDays = oldPeople! * oldDays! / newPeople!
      expect(oldPeople! * oldDays!).toBe(newPeople! * newDays!)
      expect(expectNumberResponse(inverse)).toBe(newDays! - oldDays!)
      expect(inverse.visual!.values).toHaveLength(3)

      const changing = generateQuestion("changing-rates", `changing:${index}`)
      const [people, plannedDays, elapsedDays, newPeopleAfterChange] = changing.visual!.values!
      const remainingPersonDays = people! * (plannedDays! - elapsedDays!)
      expect(expectNumberResponse(changing)).toBe(remainingPersonDays / newPeopleAfterChange!)
      expect(changing.visual!.labels).toEqual([
        "Personen zuerst",
        "Tage geplant",
        "Tage vergangen",
        "Personen danach",
      ])
    }
  })

  it("keeps combination counts aligned with every enumerated worked row", () => {
    for (let index = 0; index < 250; index += 1) {
      const question = generateQuestion("integer-combinations", `combination:${index}`)
      expect(expectNumberResponse(question)).toBe(question.workedSteps.length - 1)
    }
  })

  it("tracks complete orientations and ordered support faces across 1,000 spatial variants", () => {
    const variants = new Set<string>()

    for (let index = 0; index < 1_000; index += 1) {
      const question = generateZap2025Question(
        "spatial-rolling",
        `spatial:${index}`,
        `spatial:${index}`,
      )
      const [bottom, left, right, back] = question.visual!.values!
      const orientation = { bottom: bottom!, left: left!, right: right!, back: back! }
      const directions = question.visual!.arrows! as PyramidRollDirection[]

      if (question.response.kind === "integer-sequence") {
        variants.add("path")
        const path = buildPyramidRollPath(orientation, directions)
        expect(directions.length === 3 || directions.length === 4).toBe(true)
        expect(question.response.values).toEqual(path.supportingFaces)
        expect(isCorrectAnswer(question, path.supportingFaces.join(", "))).toBe(true)
        expect(isCorrectAnswer(question, [...path.supportingFaces].reverse().join(", "))).toBe(false)
        if (directions.length === 4) {
          expect(new Set(path.supportingFaces)).toEqual(new Set([1, 2, 3, 4]))
        }
      } else {
        expect(question.response.kind).toBe("choice")
        if (question.response.kind !== "choice") throw new Error("Expected choice response")
        if (directions.length === 1) {
          variants.add("single")
          expect(question.response.value).toBe(String(
            buildPyramidRollPath(orientation, directions).supportingFaces[0],
          ))
        } else {
          variants.add("missing")
          expect(question.response.value).toBe(String(
            findMissingPyramidFace([orientation.bottom, orientation.right, orientation.back]),
          ))
        }
      }
    }

    expect(variants).toEqual(new Set(["missing", "single", "path"]))
  })

  it("reconstructs block height before calculating cuboid surface", () => {
    for (let index = 0; index < 250; index += 1) {
      const question = generateQuestion("cuboid-surface", `cuboid:${index}`)
      const [doubleLength, doubleWidth, compositeVolume] = question.visual!.values!
      const length = doubleLength! / 2
      const width = doubleWidth! / 2
      const height = (compositeVolume! / 2) / (length * width)
      const expectedSurface = 2 * (length * doubleWidth! + length * height + doubleWidth! * height)
      expect(expectNumberResponse(question)).toBe(expectedSurface)
    }
  })

  it("always exposes the correct construction choice as a visible option", () => {
    for (let index = 0; index < 250; index += 1) {
      const question = generateQuestion("geometric-loci", `locus:${index}`)
      expect(question.response.kind).toBe("choice")
      if (question.response.kind !== "choice") throw new Error("Expected choice response")
      const response = question.response
      expect(response.options.some((option) => option.id === response.value)).toBe(true)
    }
  })

  it("generates 1,000 bounded and exactly gradable construction canvases", () => {
    const seenTools = new Set<string>()

    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("geometric-loci", `construction:${index}`)
      const spec = question.geometryConstruction
      expect(spec).toBeDefined()
      if (!spec) throw new Error("Expected construction specification")
      seenTools.add(spec.expectedTool)

      expect(spec.targetParameter).toBeGreaterThanOrEqual(spec.minParameter)
      expect(spec.targetParameter).toBeLessThanOrEqual(spec.maxParameter)
      expect(spec.initialParameter).toBeGreaterThanOrEqual(spec.minParameter)
      expect(spec.initialParameter).toBeLessThanOrEqual(spec.maxParameter)
      expect(Math.abs(spec.initialParameter - spec.targetParameter)).toBeGreaterThan(spec.tolerance)
      expect(spec.tolerance).toBe(4.8)
      expect(spec.snap).toBe(2.4)

      expect(gradeGeometryConstruction(spec, {
        version: 1,
        tool: spec.expectedTool,
        parameter: spec.targetParameter,
      })).toMatchObject({
        correct: true,
        methodCorrect: true,
        placementCorrect: true,
        confidence: "certain",
      })

      if (spec.expectedTool === "parallel") {
        expect(spec.targetParameter).toBe(
          spec.reference.y - spec.distanceCentimeters * spec.pixelsPerCentimeter,
        )
      } else if (spec.expectedTool === "circle") {
        expect(spec.targetParameter).toBe(
          spec.distanceCentimeters * spec.pixelsPerCentimeter,
        )
      } else {
        expect(spec.targetParameter).toBe(
          (spec.reference.first.x + spec.reference.second.x) / 2,
        )
      }
    }

    expect(seenTools).toEqual(new Set(["parallel", "circle", "bisector"]))
  })
})
