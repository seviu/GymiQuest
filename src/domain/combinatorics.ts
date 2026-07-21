export type DigitRelation = "greater" | "less"

export interface NumberConstraintFilter {
  candidates: number[]
  divisible: number[]
  solutions: number[]
}

export interface RepeatedDigitConstraintFilter {
  candidates: number[]
  divisibleAndAboveBound: number[]
  matchingDigitSum: number[]
  solutions: number[]
}

export function permutations<T>(values: readonly T[]): T[][] {
  if (values.length === 0) return [[]]
  if (values.length === 1) return [[values[0]!]]
  return values.flatMap((value, index) =>
    permutations(values.filter((_, candidateIndex) => candidateIndex !== index))
      .map((tail) => [value, ...tail]),
  )
}

export function enumeratePositiveCoinCombinations(
  denominations: readonly [number, number, number],
  total: number,
): Array<[number, number, number]> {
  if (
    denominations.some((value) => !Number.isInteger(value) || value < 1) ||
    !Number.isInteger(total) ||
    total < denominations[0] + denominations[1] + denominations[2]
  ) {
    return []
  }

  const results: Array<[number, number, number]> = []
  for (let first = 1; first * denominations[0] < total; first += 1) {
    for (
      let second = 1;
      first * denominations[0] + second * denominations[1] < total;
      second += 1
    ) {
      const rest = total - first * denominations[0] - second * denominations[1]
      if (rest > 0 && rest % denominations[2] === 0) {
        results.push([first, second, rest / denominations[2]])
      }
    }
  }
  return results
}

export function buildNumberConstraintFilter(
  digits: readonly [number, number, number, number],
  divisor: number,
  relation: DigitRelation,
): NumberConstraintFilter {
  if (
    new Set(digits).size !== 4 ||
    digits.some((digit) => !Number.isInteger(digit) || digit < 0 || digit > 9) ||
    !Number.isInteger(divisor) ||
    divisor < 1
  ) {
    return { candidates: [], divisible: [], solutions: [] }
  }

  const candidates = permutations(digits)
    .filter((parts) => parts[0] !== 0)
    .map((parts) => Number(parts.join("")))
    .sort((left, right) => left - right)
  const divisible = candidates.filter((value) => value % divisor === 0)
  const solutions = divisible
    .filter((value) => {
      const thousands = Math.floor(value / 1000)
      const units = value % 10
      return relation === "greater" ? thousands > units : thousands < units
    })
    .sort((left, right) => left - right)
  return { candidates, divisible, solutions }
}

export function buildRepeatedDigitConstraintFilter(
  digits: readonly [number, number, number, number],
  divisor: number,
  digitSum: number,
  lowerBound: number,
  relation: DigitRelation,
): RepeatedDigitConstraintFilter {
  if (
    new Set(digits).size !== 4 ||
    digits.some((digit) => !Number.isInteger(digit) || digit < 0 || digit > 9) ||
    !Number.isInteger(divisor) ||
    divisor < 1 ||
    !Number.isInteger(digitSum) ||
    digitSum < 0 ||
    !Number.isInteger(lowerBound)
  ) {
    return {
      candidates: [],
      divisibleAndAboveBound: [],
      matchingDigitSum: [],
      solutions: [],
    }
  }

  const candidates: number[] = []
  for (const thousands of digits) {
    if (thousands === 0) continue
    for (const hundreds of digits) {
      for (const tens of digits) {
        for (const units of digits) {
          candidates.push(thousands * 1000 + hundreds * 100 + tens * 10 + units)
        }
      }
    }
  }
  candidates.sort((left, right) => left - right)
  const divisibleAndAboveBound = candidates.filter(
    (value) => value > lowerBound && value % divisor === 0,
  )
  const matchingDigitSum = divisibleAndAboveBound.filter((value) =>
    String(value).split("").reduce((sum, digit) => sum + Number(digit), 0) === digitSum
  )
  const solutions = matchingDigitSum.filter((value) => {
    const thousands = Math.floor(value / 1000)
    const units = value % 10
    return relation === "greater" ? thousands > units : thousands < units
  })

  return { candidates, divisibleAndAboveBound, matchingDigitSum, solutions }
}

export function filterNumberConstraintSolutions(
  digits: readonly [number, number, number, number],
  divisor: number,
  relation: DigitRelation,
): number[] {
  return buildNumberConstraintFilter(digits, divisor, relation).solutions
}
