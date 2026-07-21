export interface LargeTilePlacement {
  row: number
  column: number
  cells: [number, number, number, number]
}

export interface AreaFractionModel {
  columns: number
  rows: number
  capacity: number
  largeCount: number
  totalCells: number
  coveredCells: number[]
  placements: LargeTilePlacement[]
  greyCells: number
  whiteCells: number
  numerator: number
  denominator: number
}

export type TilingCostStrategy = "large" | "small" | "equal"

export interface TilingCostModel {
  columns: number
  rows: number
  capacity: number
  smallCost: number
  largeCost: number
  fourSmallCost: number
  strategy: TilingCostStrategy
  largeCount: number
  smallCount: number
  totalCost: number
  placements: LargeTilePlacement[]
}

export interface FrameAreaModel {
  variant: "frame"
  width: number
  height: number
  border: number
  innerWidth: number
  innerHeight: number
  outerArea: number
  innerArea: number
  result: number
}

export interface CornerCutoutModel {
  variant: "corner"
  width: number
  height: number
  cutWidth: number
  cutHeight: number
  outerArea: number
  cutArea: number
  result: number
}

export interface NotchPerimeterModel {
  variant: "notch"
  width: number
  height: number
  notchWidth: number
  notchDepth: number
  originalPerimeter: number
  addedDepth: number
  result: number
}

export interface PyramidOrientation {
  bottom: number
  left: number
  right: number
  back: number
}

export type PyramidRollDirection = "left" | "right" | "back"

export interface PyramidRollModel extends PyramidOrientation {
  direction: PyramidRollDirection
  newBottom: number
  nextOrientation: PyramidOrientation
}

export interface PyramidRollPathModel {
  startOrientation: PyramidOrientation
  directions: PyramidRollDirection[]
  steps: PyramidRollModel[]
  supportingFaces: number[]
  finalOrientation: PyramidOrientation
}

export type CuboidArrangement = "side-by-side" | "end-to-end"

export interface CuboidModuleDimensions {
  length: number
  width: number
  height: number
  moduleVolume: number
  compositeVolume: number
}

export interface CuboidSurfaceModel extends CuboidModuleDimensions {
  arrangement: CuboidArrangement
  arrangedLength: number
  arrangedWidth: number
  arrangedHeight: number
  topBottomArea: number
  frontBackArea: number
  sideArea: number
  surface: number
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`)
  }
}

function assertGrid(columns: number, rows: number): void {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1) {
    throw new RangeError("A tile grid needs positive whole dimensions.")
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

export function reduceFraction(numerator: number, denominator: number): [number, number] {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || numerator < 0 || denominator < 1) {
    throw new RangeError("A reduced fraction needs a non-negative whole numerator and positive denominator.")
  }
  const divisor = greatestCommonDivisor(numerator, denominator)
  return [numerator / divisor, denominator / divisor]
}

export function tileCapacity(columns: number, rows: number): number {
  assertGrid(columns, rows)
  return Math.floor(columns / 2) * Math.floor(rows / 2)
}

export function buildLargeTilePlacements(
  columns: number,
  rows: number,
  largeCount: number,
): LargeTilePlacement[] {
  const capacity = tileCapacity(columns, rows)
  if (!Number.isInteger(largeCount) || largeCount < 0 || largeCount > capacity) {
    throw new RangeError("The number of large tiles must fit inside the grid.")
  }

  const placements: LargeTilePlacement[] = []
  for (let row = 0; row + 1 < rows && placements.length < largeCount; row += 2) {
    for (let column = 0; column + 1 < columns && placements.length < largeCount; column += 2) {
      placements.push({
        row,
        column,
        cells: [
          row * columns + column,
          row * columns + column + 1,
          (row + 1) * columns + column,
          (row + 1) * columns + column + 1,
        ],
      })
    }
  }
  return placements
}

export function buildCoveredTileCells(columns: number, rows: number, largeCount: number): number[] {
  return buildLargeTilePlacements(columns, rows, largeCount).flatMap((placement) => placement.cells)
}

export function buildAreaFractionModel(
  columns: number,
  rows: number,
  largeCount: number,
): AreaFractionModel {
  const capacity = tileCapacity(columns, rows)
  const placements = buildLargeTilePlacements(columns, rows, largeCount)
  const coveredCells = placements.flatMap((placement) => placement.cells)
  const totalCells = columns * rows
  const greyCells = coveredCells.length
  const whiteCells = totalCells - greyCells
  const [numerator, denominator] = reduceFraction(whiteCells, totalCells)
  return {
    columns,
    rows,
    capacity,
    largeCount,
    totalCells,
    coveredCells,
    placements,
    greyCells,
    whiteCells,
    numerator,
    denominator,
  }
}

export function buildTilingCostModel(
  columns: number,
  rows: number,
  smallCost: number,
  largeCost: number,
): TilingCostModel {
  const capacity = tileCapacity(columns, rows)
  assertPositiveFinite(smallCost, "Small tile cost")
  assertPositiveFinite(largeCost, "Large tile cost")
  const fourSmallCost = 4 * smallCost
  const strategy: TilingCostStrategy = largeCost < fourSmallCost
    ? "large"
    : largeCost > fourSmallCost
      ? "small"
      : "equal"
  const largeCount = strategy === "small" ? 0 : capacity
  const smallCount = columns * rows - 4 * largeCount
  return {
    columns,
    rows,
    capacity,
    smallCost,
    largeCost,
    fourSmallCost,
    strategy,
    largeCount,
    smallCount,
    totalCost: largeCount * largeCost + smallCount * smallCost,
    placements: buildLargeTilePlacements(columns, rows, largeCount),
  }
}

export function buildFrameAreaModel(width: number, height: number, border: number): FrameAreaModel {
  assertPositiveFinite(width, "Frame width")
  assertPositiveFinite(height, "Frame height")
  assertPositiveFinite(border, "Frame border")
  if (2 * border >= Math.min(width, height)) {
    throw new RangeError("The frame border must leave a positive inner rectangle.")
  }
  const innerWidth = width - 2 * border
  const innerHeight = height - 2 * border
  const outerArea = width * height
  const innerArea = innerWidth * innerHeight
  return {
    variant: "frame",
    width,
    height,
    border,
    innerWidth,
    innerHeight,
    outerArea,
    innerArea,
    result: outerArea - innerArea,
  }
}

export function buildCornerCutoutModel(
  width: number,
  height: number,
  cutWidth: number,
  cutHeight: number,
): CornerCutoutModel {
  assertPositiveFinite(width, "Outer width")
  assertPositiveFinite(height, "Outer height")
  assertPositiveFinite(cutWidth, "Cutout width")
  assertPositiveFinite(cutHeight, "Cutout height")
  if (cutWidth >= width || cutHeight >= height) {
    throw new RangeError("A corner cutout must stay smaller than the outer rectangle.")
  }
  const outerArea = width * height
  const cutArea = cutWidth * cutHeight
  return {
    variant: "corner",
    width,
    height,
    cutWidth,
    cutHeight,
    outerArea,
    cutArea,
    result: outerArea - cutArea,
  }
}

export function buildNotchPerimeterModel(
  width: number,
  height: number,
  notchWidth: number,
  notchDepth: number,
): NotchPerimeterModel {
  assertPositiveFinite(width, "Outer width")
  assertPositiveFinite(height, "Outer height")
  assertPositiveFinite(notchWidth, "Notch width")
  assertPositiveFinite(notchDepth, "Notch depth")
  if (notchWidth >= width || notchDepth >= height) {
    throw new RangeError("A notch must stay inside the outer rectangle.")
  }
  const originalPerimeter = 2 * (width + height)
  const addedDepth = 2 * notchDepth
  return {
    variant: "notch",
    width,
    height,
    notchWidth,
    notchDepth,
    originalPerimeter,
    addedDepth,
    result: originalPerimeter + addedDepth,
  }
}

function assertPyramidOrientation(orientation: PyramidOrientation): void {
  const faces = [orientation.bottom, orientation.left, orientation.right, orientation.back]
  if (faces.some((face) => !Number.isInteger(face)) || new Set(faces).size !== 4) {
    throw new RangeError("A pyramid orientation needs four distinct whole-number faces.")
  }
}

export function buildPyramidRollModel(
  orientation: PyramidOrientation,
  direction: PyramidRollDirection,
): PyramidRollModel {
  assertPyramidOrientation(orientation)
  const nextOrientation: PyramidOrientation = direction === "left"
    ? {
        bottom: orientation.left,
        left: orientation.bottom,
        right: orientation.back,
        back: orientation.right,
      }
    : direction === "right"
      ? {
          bottom: orientation.right,
          left: orientation.back,
          right: orientation.bottom,
          back: orientation.left,
        }
      : {
          bottom: orientation.back,
          left: orientation.right,
          right: orientation.left,
          back: orientation.bottom,
        }
  return {
    ...orientation,
    direction,
    newBottom: nextOrientation.bottom,
    nextOrientation,
  }
}

export function buildPyramidRollPath(
  startOrientation: PyramidOrientation,
  directions: readonly PyramidRollDirection[],
): PyramidRollPathModel {
  assertPyramidOrientation(startOrientation)
  const steps: PyramidRollModel[] = []
  let orientation = { ...startOrientation }

  for (const direction of directions) {
    const step = buildPyramidRollModel(orientation, direction)
    steps.push(step)
    orientation = step.nextOrientation
  }

  return {
    startOrientation: { ...startOrientation },
    directions: [...directions],
    steps,
    supportingFaces: steps.map((step) => step.newBottom),
    finalOrientation: orientation,
  }
}

export function findMissingPyramidFace(
  knownFaces: readonly number[],
  allFaces: readonly number[] = [1, 2, 3, 4],
): number {
  const missing = allFaces.filter((face) => !knownFaces.includes(face))
  if (new Set(allFaces).size !== allFaces.length || missing.length !== 1) {
    throw new RangeError("Exactly one distinct pyramid face must be missing.")
  }
  return missing[0]!
}

export function recoverCuboidModuleDimensions(
  arrangementLength: number,
  arrangementWidth: number,
  compositeVolume: number,
): CuboidModuleDimensions {
  assertPositiveFinite(arrangementLength, "End-to-end length")
  assertPositiveFinite(arrangementWidth, "Side-by-side width")
  assertPositiveFinite(compositeVolume, "Composite volume")
  const length = arrangementLength / 2
  const width = arrangementWidth / 2
  const moduleVolume = compositeVolume / 2
  const height = moduleVolume / (length * width)
  assertPositiveFinite(height, "Recovered module height")
  return { length, width, height, moduleVolume, compositeVolume }
}

export function buildCuboidSurfaceModel(
  length: number,
  width: number,
  height: number,
  arrangement: CuboidArrangement,
): CuboidSurfaceModel {
  assertPositiveFinite(length, "Module length")
  assertPositiveFinite(width, "Module width")
  assertPositiveFinite(height, "Module height")
  const arrangedLength = arrangement === "side-by-side" ? length : 2 * length
  const arrangedWidth = arrangement === "side-by-side" ? 2 * width : width
  const arrangedHeight = height
  const topBottomArea = arrangedLength * arrangedWidth
  const frontBackArea = arrangedLength * arrangedHeight
  const sideArea = arrangedWidth * arrangedHeight
  return {
    arrangement,
    length,
    width,
    height,
    moduleVolume: length * width * height,
    compositeVolume: 2 * length * width * height,
    arrangedLength,
    arrangedWidth,
    arrangedHeight,
    topBottomArea,
    frontBackArea,
    sideArea,
    surface: 2 * (topBottomArea + frontBackArea + sideArea),
  }
}
