import { describe, expect, it } from "vitest"
import {
  buildAreaFractionModel,
  buildCornerCutoutModel,
  buildCuboidSurfaceModel,
  buildFrameAreaModel,
  buildNotchPerimeterModel,
  buildPyramidRollPath,
  buildPyramidRollModel,
  buildTilingCostModel,
  findMissingPyramidFace,
  recoverCuboidModuleDimensions,
} from "./areaSpatial"

describe("area and spatial playground mathematics", () => {
  it("counts every 2x2 tile as four unit areas and reduces the white fraction", () => {
    expect(buildAreaFractionModel(6, 4, 2)).toEqual({
      columns: 6,
      rows: 4,
      capacity: 6,
      largeCount: 2,
      totalCells: 24,
      coveredCells: [0, 1, 6, 7, 2, 3, 8, 9],
      placements: [
        { row: 0, column: 0, cells: [0, 1, 6, 7] },
        { row: 0, column: 2, cells: [2, 3, 8, 9] },
      ],
      greyCells: 8,
      whiteCells: 16,
      numerator: 2,
      denominator: 3,
    })
  })

  it("chooses the globally cheaper tile type and accounts for edge leftovers", () => {
    expect(buildTilingCostModel(5, 3, 4, 13)).toMatchObject({
      capacity: 2,
      strategy: "large",
      largeCount: 2,
      smallCount: 7,
      totalCost: 54,
    })
    expect(buildTilingCostModel(5, 3, 4, 17)).toMatchObject({
      strategy: "small",
      largeCount: 0,
      smallCount: 15,
      totalCost: 60,
    })
    expect(buildTilingCostModel(5, 3, 4, 16)).toMatchObject({
      strategy: "equal",
      largeCount: 2,
      smallCount: 7,
      totalCost: 60,
    })
  })

  it("keeps each composite-area variant on its exact invariant", () => {
    expect(buildFrameAreaModel(20, 14, 2)).toEqual({
      variant: "frame",
      width: 20,
      height: 14,
      border: 2,
      innerWidth: 16,
      innerHeight: 10,
      outerArea: 280,
      innerArea: 160,
      result: 120,
    })
    expect(buildCornerCutoutModel(20, 14, 5, 4)).toMatchObject({
      outerArea: 280,
      cutArea: 20,
      result: 260,
    })
    expect(buildNotchPerimeterModel(20, 14, 5, 4)).toMatchObject({
      originalPerimeter: 68,
      addedDepth: 8,
      result: 76,
    })
    expect(buildNotchPerimeterModel(20, 14, 9, 4).result).toBe(76)
  })

  it("calibrates the full transition against the published 2025 Task 8a result", () => {
    const orientation = { bottom: 4, left: 1, right: 2, back: 3 }
    const rolled = buildPyramidRollModel(orientation, "back")
    expect(rolled.newBottom).toBe(3)
    expect(rolled.nextOrientation).toEqual({ bottom: 3, left: 2, right: 1, back: 4 })
    expect(findMissingPyramidFace([4, 2, 3])).toBe(1)
  })

  it("keeps every roll reversible and every alternating four-step tour complete", () => {
    const faces = [1, 2, 3, 4]
    const orientations = faces.flatMap((bottom) =>
      faces.filter((left) => left !== bottom).flatMap((left) =>
        faces.filter((right) => right !== bottom && right !== left).map((right) => ({
          bottom,
          left,
          right,
          back: faces.find((face) => ![bottom, left, right].includes(face))!,
        })),
      ),
    )
    const directions = ["left", "right", "back"] as const

    for (const orientation of orientations) {
      for (const direction of directions) {
        const first = buildPyramidRollModel(orientation, direction)
        expect(new Set(Object.values(first.nextOrientation))).toEqual(new Set(faces))
        expect(buildPyramidRollModel(first.nextOrientation, direction).nextOrientation).toEqual(orientation)
      }

      for (const firstDirection of directions) {
        for (const secondDirection of directions.filter((direction) => direction !== firstDirection)) {
          const tour = buildPyramidRollPath(
            orientation,
            [firstDirection, secondDirection, firstDirection, secondDirection],
          )
          expect(new Set(tour.supportingFaces)).toEqual(new Set(faces))
          expect(tour.finalOrientation).toEqual(orientation)
        }
      }
    }
  })

  it("recovers one module before comparing both two-module cuboids", () => {
    expect(recoverCuboidModuleDimensions(20, 8, 240)).toEqual({
      length: 10,
      width: 4,
      height: 3,
      moduleVolume: 120,
      compositeVolume: 240,
    })
    expect(buildCuboidSurfaceModel(10, 4, 3, "side-by-side")).toMatchObject({
      arrangedLength: 10,
      arrangedWidth: 8,
      arrangedHeight: 3,
      topBottomArea: 80,
      frontBackArea: 30,
      sideArea: 24,
      surface: 268,
    })
    expect(buildCuboidSurfaceModel(10, 4, 3, "end-to-end")).toMatchObject({
      arrangedLength: 20,
      arrangedWidth: 4,
      arrangedHeight: 3,
      surface: 304,
    })
  })

  it("rejects impossible geometry instead of rendering a misleading model", () => {
    expect(() => buildAreaFractionModel(4, 4, 5)).toThrow(RangeError)
    expect(() => buildFrameAreaModel(10, 8, 4)).toThrow(RangeError)
    expect(() => buildPyramidRollModel({ bottom: 1, left: 1, right: 2, back: 3 }, "left"))
      .toThrow(RangeError)
  })
})
