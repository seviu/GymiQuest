import { foldCubeNet, oppositeFaceIndex, type NetCell } from "./cubeNet"
import {
  buildNumberConstraintFilter,
  buildRepeatedDigitConstraintFilter,
  enumeratePositiveCoinCombinations,
  type DigitRelation,
  type NumberConstraintFilter,
  type RepeatedDigitConstraintFilter,
} from "./combinatorics"
import type { GeneratedQuestion } from "./model"

export type CoordinateTransformation =
  | "reflect-x"
  | "reflect-y"
  | "reflect-origin"
  | "rotate-cw"
  | "rotate-ccw"
  | "translate"

export interface CoordinatePoint {
  x: number
  y: number
}

export interface FractionQuantityModel {
  numerator: number
  denominator: number
  onePart: number
  whole: number
  knownPart: number
}

export interface MassConversionModel {
  kilograms: number
  grams: number
}

export interface OperationChainModel {
  multiplier: number
  divisor: number
  base: number
  unknown: number
  afterMultiplication: number
  result: number
}

export interface TimeFractionModel {
  numerator: number
  denominator: number
  onePartMinutes: number
  totalMinutes: number
  fractionMinutes: number
}

export interface AverageMotionModel {
  firstSpeed: number
  firstMinutes: number
  firstDistance: number
  secondSpeed: number
  secondMinutes: number
  secondDistance: number
  totalMinutes: number
  totalDistance: number
  averageSpeed: number
}

export interface CatchUpMotionModel {
  slowSpeed: number
  fastSpeed: number
  headStartMinutes: number
  headStartDistance: number
  relativeSpeed: number
  catchMinutes: number
  meetingDistance: number
}

export interface InverseSupplyModel {
  originalPeople: number
  originalDays: number
  newPeople: number
  totalPersonDays: number
  newDays: number
}

export interface ChangingSupplyModel extends InverseSupplyModel {
  elapsedDays: number
  usedPersonDays: number
  remainingPersonDays: number
}

export type EfficientArithmeticOperation = "sum" | "difference"

export interface EfficientArithmeticModel {
  factor: number
  left: number
  right: number
  operation: EfficientArithmeticOperation
  leftProduct: number
  rightProduct: number
  combined: number
  result: number
}

export interface DataTableComplementRow {
  hiking: number
  swimming: number
  neither: number
}

export interface DataTableComplementModel {
  totalPerRow: number
  rows: DataTableComplementRow[]
  totalDays: number
  hikingTotal: number
  swimmingTotal: number
  neitherTotal: number
}

export interface MissingAverageModel {
  average: number
  entryCount: number
  targetTotal: number
  knownValues: number[]
  knownTotal: number
  missingValue: number
}

export interface TableDifferenceModel {
  total: number
  known: number
  missing: number
}

export interface MoneyRelationshipModel {
  price: number
  count: number
  revenue: number
}

export interface RevenueBundleModel {
  childPrice: number
  adultPrice: number
  childRatio: number
  packages: number
  bundlePrice: number
  childCount: number
  adultCount: number
  revenue: number
}

export interface CoinCombinationModel {
  denominations: [number, number, number]
  total: number
  solutions: Array<[number, number, number]>
}

export interface NumberFilterModel extends NumberConstraintFilter {
  digits: [number, number, number, number]
  divisor: number
  relation: DigitRelation
}

export interface RepeatedDigitFilterModel extends RepeatedDigitConstraintFilter {
  digits: [number, number, number, number]
  divisor: number
  digitSum: number
  lowerBound: number
  relation: DigitRelation
}

export interface CubeNetPlaygroundFace extends NetCell {
  label: string
  position: number
}

export interface CubeNetPlaygroundModel {
  columns: number
  rows: number
  faces: CubeNetPlaygroundFace[]
  initialTargetLabel: string
}

export type CubeFaceRelation =
  | "same"
  | "net-neighbor"
  | "cube-neighbor"
  | "opposite"

export function transformCoordinatePoint(
  point: CoordinatePoint,
  transformation: CoordinateTransformation,
): CoordinatePoint {
  switch (transformation) {
    case "reflect-x":
      return { x: point.x, y: -point.y }
    case "reflect-y":
      return { x: -point.x, y: point.y }
    case "reflect-origin":
      return { x: -point.x, y: -point.y }
    case "rotate-cw":
      return { x: point.y, y: -point.x }
    case "rotate-ccw":
      return { x: -point.y, y: point.x }
    case "translate":
      return { x: point.x + 2, y: point.y - 1 }
  }
}

export function buildFractionQuantityModel(
  numerator: number,
  denominator: number,
  onePart = 4,
): FractionQuantityModel {
  if (
    !Number.isInteger(numerator) ||
    !Number.isInteger(denominator) ||
    !Number.isInteger(onePart) ||
    denominator < 2 ||
    numerator < 1 ||
    numerator > denominator ||
    onePart < 1
  ) {
    throw new RangeError("A fraction playground needs a valid positive fraction and part size.")
  }

  return {
    numerator,
    denominator,
    onePart,
    whole: denominator * onePart,
    knownPart: numerator * onePart,
  }
}

export function buildMassConversionModel(quarterKilograms: number): MassConversionModel {
  if (!Number.isInteger(quarterKilograms) || quarterKilograms < 1) {
    throw new RangeError("Mass playground steps must be positive quarter-kilograms.")
  }

  return {
    kilograms: quarterKilograms / 4,
    grams: quarterKilograms * 250,
  }
}

/**
 * Keeps an arithmetic-equation playground integral by constructing both sides
 * from a shared base: (base · divisor · multiplier) : divisor = base · multiplier.
 */
export function buildOperationChainModel(
  multiplier: number,
  divisor: number,
  base: number,
): OperationChainModel {
  if (
    !Number.isInteger(multiplier) ||
    !Number.isInteger(divisor) ||
    !Number.isInteger(base) ||
    multiplier < 2 ||
    divisor < 2 ||
    base < 1
  ) {
    throw new RangeError("An operation chain needs positive integer factors and a positive base.")
  }

  const unknown = divisor * base
  const afterMultiplication = unknown * multiplier
  return {
    multiplier,
    divisor,
    base,
    unknown,
    afterMultiplication,
    result: afterMultiplication / divisor,
  }
}

export function buildTimeFractionModel(
  numerator: number,
  denominator: number,
  onePartMinutes: number,
): TimeFractionModel {
  if (
    !Number.isInteger(numerator) ||
    !Number.isInteger(denominator) ||
    !Number.isInteger(onePartMinutes) ||
    denominator < 2 ||
    numerator < 1 ||
    numerator > denominator ||
    onePartMinutes < 1
  ) {
    throw new RangeError("A time-fraction playground needs whole positive minute parts.")
  }

  return {
    numerator,
    denominator,
    onePartMinutes,
    totalMinutes: denominator * onePartMinutes,
    fractionMinutes: numerator * onePartMinutes,
  }
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`)
  }
}

export function buildAverageMotionModel(
  firstSpeed: number,
  firstMinutes: number,
  secondSpeed: number,
  secondMinutes: number,
): AverageMotionModel {
  assertPositiveFinite(firstSpeed, "First speed")
  assertPositiveFinite(firstMinutes, "First duration")
  assertPositiveFinite(secondSpeed, "Second speed")
  assertPositiveFinite(secondMinutes, "Second duration")

  const firstDistance = firstSpeed * firstMinutes / 60
  const secondDistance = secondSpeed * secondMinutes / 60
  const totalMinutes = firstMinutes + secondMinutes
  const totalDistance = firstDistance + secondDistance
  return {
    firstSpeed,
    firstMinutes,
    firstDistance,
    secondSpeed,
    secondMinutes,
    secondDistance,
    totalMinutes,
    totalDistance,
    averageSpeed: totalDistance / (totalMinutes / 60),
  }
}

export function buildCatchUpMotionModel(
  slowSpeed: number,
  fastSpeed: number,
  headStartMinutes: number,
): CatchUpMotionModel {
  assertPositiveFinite(slowSpeed, "Slower speed")
  assertPositiveFinite(fastSpeed, "Faster speed")
  assertPositiveFinite(headStartMinutes, "Head-start duration")
  if (fastSpeed <= slowSpeed) {
    throw new RangeError("The catching speed must be greater than the leading speed.")
  }

  const headStartDistance = slowSpeed * headStartMinutes / 60
  const relativeSpeed = fastSpeed - slowSpeed
  const catchHours = headStartDistance / relativeSpeed
  return {
    slowSpeed,
    fastSpeed,
    headStartMinutes,
    headStartDistance,
    relativeSpeed,
    catchMinutes: catchHours * 60,
    meetingDistance: fastSpeed * catchHours,
  }
}

export function buildInverseSupplyModel(
  originalPeople: number,
  originalDays: number,
  newPeople: number,
): InverseSupplyModel {
  assertPositiveFinite(originalPeople, "Original people")
  assertPositiveFinite(originalDays, "Original duration")
  assertPositiveFinite(newPeople, "New people")
  const totalPersonDays = originalPeople * originalDays
  return {
    originalPeople,
    originalDays,
    newPeople,
    totalPersonDays,
    newDays: totalPersonDays / newPeople,
  }
}

export function buildChangingSupplyModel(
  originalPeople: number,
  originalDays: number,
  elapsedDays: number,
  newPeople: number,
): ChangingSupplyModel {
  const base = buildInverseSupplyModel(originalPeople, originalDays, newPeople)
  if (!Number.isFinite(elapsedDays) || elapsedDays < 0 || elapsedDays >= originalDays) {
    throw new RangeError("Elapsed days must stay inside the original supply period.")
  }
  const usedPersonDays = originalPeople * elapsedDays
  const remainingPersonDays = base.totalPersonDays - usedPersonDays
  return {
    ...base,
    elapsedDays,
    usedPersonDays,
    remainingPersonDays,
    newDays: remainingPersonDays / newPeople,
  }
}

export function buildEfficientArithmeticModel(
  factor: number,
  left: number,
  right: number,
  operation: EfficientArithmeticOperation,
): EfficientArithmeticModel {
  for (const [value, label] of [[factor, "Factor"], [left, "Left term"], [right, "Right term"]] as const) {
    assertPositiveFinite(value, label)
  }
  if (operation === "difference" && left < right) {
    throw new RangeError("A difference playground needs a left term at least as large as the right term.")
  }
  const combined = operation === "sum" ? left + right : left - right
  return {
    factor,
    left,
    right,
    operation,
    leftProduct: factor * left,
    rightProduct: factor * right,
    combined,
    result: factor * combined,
  }
}

export function buildDataTableComplementModel(
  totalPerRow: number,
  hiking: readonly number[],
  swimming: readonly number[],
): DataTableComplementModel {
  assertPositiveFinite(totalPerRow, "Row total")
  if (hiking.length === 0 || hiking.length !== swimming.length) {
    throw new RangeError("Complement rows need equally sized non-empty columns.")
  }
  const rows = hiking.map((hikingValue, index) => {
    const swimmingValue = swimming[index]!
    if (
      !Number.isFinite(hikingValue) || hikingValue < 0 ||
      !Number.isFinite(swimmingValue) || swimmingValue < 0 ||
      hikingValue + swimmingValue > totalPerRow
    ) {
      throw new RangeError("Every complement row must fit inside its row total.")
    }
    return {
      hiking: hikingValue,
      swimming: swimmingValue,
      neither: totalPerRow - hikingValue - swimmingValue,
    }
  })
  const hikingTotal = rows.reduce((sum, row) => sum + row.hiking, 0)
  const swimmingTotal = rows.reduce((sum, row) => sum + row.swimming, 0)
  const neitherTotal = rows.reduce((sum, row) => sum + row.neither, 0)
  return {
    totalPerRow,
    rows,
    totalDays: totalPerRow * rows.length,
    hikingTotal,
    swimmingTotal,
    neitherTotal,
  }
}

export function buildMissingAverageModel(
  average: number,
  knownValues: readonly number[],
): MissingAverageModel {
  assertPositiveFinite(average, "Average")
  if (knownValues.length === 0 || knownValues.some((value) => !Number.isFinite(value))) {
    throw new RangeError("A missing-average playground needs known finite entries.")
  }
  const entryCount = knownValues.length + 1
  const targetTotal = average * entryCount
  const knownTotal = knownValues.reduce((sum, value) => sum + value, 0)
  return {
    average,
    entryCount,
    targetTotal,
    knownValues: [...knownValues],
    knownTotal,
    missingValue: targetTotal - knownTotal,
  }
}

export function buildTableDifferenceModel(total: number, known: number): TableDifferenceModel {
  assertPositiveFinite(total, "Table total")
  if (!Number.isFinite(known) || known < 0 || known > total) {
    throw new RangeError("A known table segment must lie inside the total.")
  }
  return { total, known, missing: total - known }
}

export function buildMoneyRelationshipModel(price: number, count: number): MoneyRelationshipModel {
  assertPositiveFinite(price, "Unit price")
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError("A money playground needs a positive whole item count.")
  }
  return { price, count, revenue: price * count }
}

export function buildRevenueBundleModel(
  childPrice: number,
  adultPrice: number,
  childRatio: number,
  packages: number,
): RevenueBundleModel {
  assertPositiveFinite(childPrice, "Child price")
  assertPositiveFinite(adultPrice, "Adult price")
  if (!Number.isInteger(childRatio) || childRatio < 1 || !Number.isInteger(packages) || packages < 1) {
    throw new RangeError("A revenue bundle needs positive whole ratios and package counts.")
  }
  const bundlePrice = childRatio * childPrice + adultPrice
  return {
    childPrice,
    adultPrice,
    childRatio,
    packages,
    bundlePrice,
    childCount: childRatio * packages,
    adultCount: packages,
    revenue: bundlePrice * packages,
  }
}

export function buildCoinCombinationModel(
  denominations: readonly [number, number, number],
  total: number,
): CoinCombinationModel {
  return {
    denominations: [...denominations],
    total,
    solutions: enumeratePositiveCoinCombinations(denominations, total),
  }
}

export function buildNumberFilterModel(
  digits: readonly [number, number, number, number],
  divisor: number,
  relation: DigitRelation,
): NumberFilterModel {
  return {
    digits: [...digits],
    divisor,
    relation,
    ...buildNumberConstraintFilter(digits, divisor, relation),
  }
}

export function buildRepeatedDigitFilterModel(
  digits: readonly [number, number, number, number],
  divisor: number,
  digitSum: number,
  lowerBound: number,
  relation: DigitRelation,
): RepeatedDigitFilterModel {
  return {
    digits: [...digits],
    divisor,
    digitSum,
    lowerBound,
    relation,
    ...buildRepeatedDigitConstraintFilter(digits, divisor, digitSum, lowerBound, relation),
  }
}

/**
 * Restores the generator's ordered cube-net cells from its compact visual.
 * Labels stay aligned with cells, which is essential for semantic folding.
 */
export function buildCubeNetPlaygroundModel(
  question: GeneratedQuestion,
): CubeNetPlaygroundModel | undefined {
  const visual = question.visual
  if (
    visual?.kind !== "cube-net" ||
    !visual.cells ||
    !visual.labels ||
    !visual.columns ||
    visual.cells.length !== 6 ||
    visual.labels.length !== 6
  ) {
    return undefined
  }

  const faces = visual.cells.map((position, index) => ({
    x: position % visual.columns!,
    y: Math.floor(position / visual.columns!),
    position,
    label: visual.labels![index]!,
  }))
  if (!foldCubeNet(faces)) return undefined

  const initialTargetLabel = visual.unit && visual.labels.includes(visual.unit)
    ? visual.unit
    : visual.labels[0]!

  return {
    columns: visual.columns,
    rows: visual.rows ?? Math.max(...faces.map((face) => face.y)) + 1,
    faces,
    initialTargetLabel,
  }
}

export function cubeOppositeLabel(
  model: CubeNetPlaygroundModel,
  targetLabel: string,
): string {
  const targetIndex = model.faces.findIndex((face) => face.label === targetLabel)
  if (targetIndex < 0) throw new RangeError("The target face is not part of this cube net.")
  const oppositeIndex = oppositeFaceIndex(model.faces, targetIndex)
  return model.faces[oppositeIndex]!.label
}

export function cubeFaceRelation(
  model: CubeNetPlaygroundModel,
  targetLabel: string,
  candidateLabel: string,
): CubeFaceRelation {
  const targetIndex = model.faces.findIndex((face) => face.label === targetLabel)
  const candidateIndex = model.faces.findIndex((face) => face.label === candidateLabel)
  if (targetIndex < 0 || candidateIndex < 0) {
    throw new RangeError("Both faces must be part of this cube net.")
  }
  if (targetIndex === candidateIndex) return "same"

  const target = model.faces[targetIndex]!
  const candidate = model.faces[candidateIndex]!
  if (Math.abs(target.x - candidate.x) + Math.abs(target.y - candidate.y) === 1) {
    return "net-neighbor"
  }
  if (oppositeFaceIndex(model.faces, targetIndex) === candidateIndex) return "opposite"
  return "cube-neighbor"
}
