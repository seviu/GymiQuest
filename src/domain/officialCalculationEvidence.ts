export type OfficialCalculationOperator = "add" | "subtract" | "multiply" | "divide"

export interface OfficialCalculationLine {
  left: number
  operator: OfficialCalculationOperator
  right: number
  result: number
}

export type OfficialCalculationOperand =
  | number
  | { resultOf: number }

export interface OfficialCalculationStep {
  left: OfficialCalculationOperand
  operator: OfficialCalculationOperator
  right: OfficialCalculationOperand
}

export interface OfficialCalculationPathEvaluation {
  arithmeticErrors: number
  lines: readonly OfficialCalculationLine[]
}

const decimalPattern = "[-+]?(?:\\d{1,3}(?:[’']\\d{3})+|\\d+)(?:[.,]\\d+)?"
const calculationPattern = new RegExp(
  `^(${decimalPattern})\\s*([+\\-−–·×*xX:/÷])\\s*(${decimalPattern})\\s*=\\s*(${decimalPattern})$`,
  "u",
)

function parseDecimal(value: string): number | undefined {
  const parsed = Number(value.replace(/[’']/g, "").replace(",", "."))
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseOperator(value: string): OfficialCalculationOperator | undefined {
  if (value === "+") return "add"
  if (value === "-" || value === "−" || value === "–") return "subtract"
  if (value === "·" || value === "×" || value === "*" || value === "x" || value === "X") return "multiply"
  if (value === ":" || value === "/" || value === "÷") return "divide"
  return undefined
}

export function normalizeMathFormulaSymbols(value: string): string {
  return value.replace(/(\d)\s*(?:[xX]|\*)\s*(?=[+\-−–]?\s*\d)/gu, "$1 × ")
}

export function parseOfficialCalculationLines(value: string): OfficialCalculationLine[] | undefined {
  const rawLines = normalizeMathFormulaSymbols(value)
    .split(/[;\n]+/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (rawLines.length === 0) return undefined

  const lines: OfficialCalculationLine[] = []
  for (const rawLine of rawLines) {
    const match = rawLine.match(calculationPattern)
    if (!match) return undefined
    const left = parseDecimal(match[1]!)
    const operator = parseOperator(match[2]!)
    const right = parseDecimal(match[3]!)
    const result = parseDecimal(match[4]!)
    if (left === undefined || !operator || right === undefined || result === undefined) return undefined
    lines.push({ left, operator, right, result })
  }
  return lines
}

function almostEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9
}

function resolveOperand(
  operand: OfficialCalculationOperand,
  lines: readonly OfficialCalculationLine[],
  currentIndex: number,
): number | undefined {
  if (typeof operand === "number") return operand
  if (!Number.isInteger(operand.resultOf) || operand.resultOf < 0 || operand.resultOf >= currentIndex) {
    return undefined
  }
  return lines[operand.resultOf]?.result
}

function operandsMatch(
  line: OfficialCalculationLine,
  expectedLeft: number,
  expectedRight: number,
): boolean {
  if (
    almostEqual(line.left, expectedLeft) &&
    almostEqual(line.right, expectedRight)
  ) {
    return true
  }
  return (line.operator === "add" || line.operator === "multiply") &&
    almostEqual(line.left, expectedRight) &&
    almostEqual(line.right, expectedLeft)
}

function calculate(line: OfficialCalculationLine): number | undefined {
  switch (line.operator) {
    case "add":
      return line.left + line.right
    case "subtract":
      return line.left - line.right
    case "multiply":
      return line.left * line.right
    case "divide":
      return almostEqual(line.right, 0) ? undefined : line.left / line.right
  }
}

export function evaluateOfficialCalculationPath(
  value: string,
  path: readonly OfficialCalculationStep[],
  finalAnswer: number,
): OfficialCalculationPathEvaluation | undefined {
  const lines = parseOfficialCalculationLines(value)
  if (!lines || lines.length !== path.length || path.length === 0) return undefined

  let arithmeticErrors = 0
  for (const [index, step] of path.entries()) {
    const line = lines[index]!
    const expectedLeft = resolveOperand(step.left, lines, index)
    const expectedRight = resolveOperand(step.right, lines, index)
    if (
      expectedLeft === undefined ||
      expectedRight === undefined ||
      line.operator !== step.operator ||
      !operandsMatch(line, expectedLeft, expectedRight)
    ) {
      return undefined
    }
    const calculated = calculate(line)
    if (calculated === undefined) return undefined
    if (!almostEqual(calculated, line.result)) arithmeticErrors += 1
  }

  if (!almostEqual(lines.at(-1)!.result, finalAnswer)) return undefined
  return { arithmeticErrors, lines }
}

export function bestOfficialCalculationPath(
  value: string,
  paths: readonly (readonly OfficialCalculationStep[])[],
  finalAnswer: number,
): OfficialCalculationPathEvaluation | undefined {
  return paths
    .flatMap((path) => {
      const evaluation = evaluateOfficialCalculationPath(value, path, finalAnswer)
      return evaluation ? [evaluation] : []
    })
    .sort((left, right) => left.arithmeticErrors - right.arithmeticErrors)[0]
}
