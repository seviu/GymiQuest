import type {
  DifficultyBand,
  GeneratedQuestion,
  LearningTask,
  TaskGenerationProfile,
  TopicMastery,
} from "./model"

export const difficultyBandLabels: Record<DifficultyBand, string> = {
  foundation: "Aufbau",
  standard: "Standard",
  exam: "Prüfungsnah",
}

export function buildTaskGenerationProfile(
  difficultyBands: readonly DifficultyBand[],
): TaskGenerationProfile {
  if (difficultyBands.length === 0) {
    throw new Error("A generation profile needs at least one difficulty band.")
  }
  return { version: 6, difficultyBands: [...difficultyBands] }
}

export function difficultyBandForTaskQuestion(
  task: LearningTask,
  questionIndex: number,
): DifficultyBand | undefined {
  if (!task.generation) return undefined
  return task.generation.difficultyBands[questionIndex % task.generation.difficultyBands.length]
}

export function taskDifficultySummary(task: LearningTask): string | undefined {
  if (!task.generation) return undefined
  const distinct = task.generation.difficultyBands.filter(
    (band, index, bands) => bands.indexOf(band) === index,
  )
  return distinct.map((band) => difficultyBandLabels[band]).join(" → ")
}

/**
 * Reviews are never assigned the Aufbau band. A fragile memory receives two
 * full standard questions; secure, later reviews become increasingly
 * exam-like. XP is deliberately absent from this decision.
 */
export function reviewDifficultyBands(
  mastery: Pick<TopicMastery, "retention" | "reviewStage" | "independentMastery">,
): [DifficultyBand, DifficultyBand] {
  if (
    mastery.reviewStage >= 2 &&
    mastery.retention >= 0.75 &&
    mastery.independentMastery >= 0.72
  ) {
    return ["exam", "exam"]
  }
  if (mastery.retention < 0.5 || mastery.independentMastery < 0.55) {
    return ["standard", "standard"]
  }
  return ["standard", "exam"]
}

function logarithmicMagnitude(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0
  return Math.log10(Math.abs(value) + 1)
}

function numericValues(question: GeneratedQuestion): readonly number[] {
  return question.visual?.values ?? []
}

function responseSignal(question: GeneratedQuestion): number {
  switch (question.response.kind) {
    case "number":
      return question.response.decimals * 1.5 + logarithmicMagnitude(question.response.value)
    case "fraction":
      return question.response.denominator * 0.4 + question.response.numerator * 0.15
    case "choice":
      return question.response.options.length * 0.15
    case "integer-set":
      return question.response.values.length * 0.8
    case "integer-sequence":
      return question.response.values.length * 1.2
    case "coordinate":
      return (Math.abs(question.response.x) + Math.abs(question.response.y)) * 0.12
  }
}

function promptInteger(question: GeneratedQuestion, pattern: RegExp): number {
  const match = question.prompt.match(pattern)
  return match ? Number(match[1]) : 0
}

function cubeNetPathSignal(question: GeneratedQuestion): number {
  const visual = question.visual
  if (
    visual?.kind !== "cube-net" ||
    !visual.cells ||
    !visual.labels ||
    !visual.columns ||
    !visual.unit ||
    question.response.kind !== "choice"
  ) {
    return 0
  }

  const targetIndex = visual.labels.indexOf(visual.unit)
  const oppositeIndex = visual.labels.indexOf(question.response.value)
  if (targetIndex < 0 || oppositeIndex < 0) return 0

  const coordinates = visual.cells.map((cell) => ({
    x: cell % visual.columns!,
    y: Math.floor(cell / visual.columns!),
  }))
  const target = coordinates[targetIndex]
  if (!target) return 0
  const targetDegree = coordinates.filter(
    (candidate, index) => index !== targetIndex &&
      Math.abs(candidate.x - target.x) + Math.abs(candidate.y - target.y) === 1,
  ).length

  const queue: Array<{ index: number; distance: number }> = [{ index: targetIndex, distance: 0 }]
  const visited = new Set([targetIndex])
  let pathDistance = 0
  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.index === oppositeIndex) {
      pathDistance = current.distance
      break
    }
    const cell = coordinates[current.index]!
    coordinates.forEach((candidate, index) => {
      if (
        !visited.has(index) &&
        Math.abs(candidate.x - cell.x) + Math.abs(candidate.y - cell.y) === 1
      ) {
        visited.add(index)
        queue.push({ index, distance: current.distance + 1 })
      }
    })
  }

  return pathDistance * 8 + Math.max(0, 3 - targetDegree) * 3 +
    (visual.columns * (visual.rows ?? 1)) * 0.25
}

function topicStructuralScore(question: GeneratedQuestion): number {
  const values = numericValues(question)
  const variant = question.visual?.variant

  switch (question.topicId) {
    case "arithmetic-equations": {
      const [multiplier, divisor, result] = values
      if (variant === "relation-total") {
        return 38 + (multiplier ?? 0) * 5 + logarithmicMagnitude(result) * 4
      }
      return (divisor ?? 0) * 1.8 + (multiplier ?? 0) * 0.5 + logarithmicMagnitude(result) * 2
    }
    case "efficient-arithmetic":
      return (variant === "difference" ? 26 : 10) + logarithmicMagnitude(values[0]) * 3 +
        logarithmicMagnitude(values[3])
    case "mass-units":
      return (question.visual?.unit === "g → kg" ? 28 : 8) +
        logarithmicMagnitude(question.visual?.fromValue) * 2
    case "fraction-of-quantity":
      if (variant === "fraction-midpoint" || variant === "fraction-distance") {
        return (variant === "fraction-midpoint" ? 36 : 24) +
          (values[1] ?? 0) * 1.8 + logarithmicMagnitude(values[2]) * 2
      }
      return (question.visual?.denominator ?? 0) * 2.2 +
        (question.visual?.numerator ?? 0) * 1.3 +
        logarithmicMagnitude(question.visual?.toValue) * 2
    case "time-fractions":
      return (question.visual?.denominator ?? 0) * 2.5 +
        (question.visual?.numerator ?? 0) * 1.5 +
        logarithmicMagnitude(values[0]) * 2 + logarithmicMagnitude(values[1])
    case "speed-distance-time": {
      if (variant === "return-home" || variant === "late-start") {
        const contextWeight = variant === "return-home" ? 48 : 34
        return contextWeight + logarithmicMagnitude(values[3]) * 4 +
          logarithmicMagnitude(values[4]) * 2
      }
      return variant === "catch-up"
        ? 42 + logarithmicMagnitude(values[3]) * 4 + logarithmicMagnitude(values[4]) * 2
        : 16 + Math.abs((values[0] ?? 0) - (values[3] ?? 0)) * 0.8 +
          ((values[2] ?? 0) % 1 === 0 ? 0 : 5) + ((values[5] ?? 0) % 1 === 0 ? 0 : 5)
    }
    case "data-tables": {
      if (variant === "duration-price") {
        return 38 + logarithmicMagnitude(values[5]) * 2 + logarithmicMagnitude(values[7]) * 2
      }
      return variant === "complement"
        ? 45 + logarithmicMagnitude(values[0]) * 2
        : variant === "missing-average"
          ? 28 + logarithmicMagnitude(values[3]) * 2
          : 10 + ((values[0] ?? 0) % 1 === 0 ? 0 : 8) + ((values[1] ?? 0) % 1 === 0 ? 0 : 8)
    }
    case "money-calculations":
      return question.workedSteps.length * 7 + logarithmicMagnitude(
        question.response.kind === "number" ? question.response.value : 0,
      ) * 2
    case "proportional-revenue":
      return 32 + promptInteger(question, /genau (\d+)-mal/) * 5 +
        logarithmicMagnitude(values[3]) * 3
    case "integer-combinations":
      if (variant === "recurring-cycles") {
        return 34 + (values[2] ? 22 : 8) + logarithmicMagnitude(values[3]) * 5
      }
      return question.workedSteps.length * 4 +
        logarithmicMagnitude(promptInteger(question, /zusammen sind es (\d+) Fr/)) * 3
    case "number-constraints": {
      if (variant === "number-wall-centre" || variant === "number-wall-edge") {
        return 28 + (variant === "number-wall-edge" ? 10 : 4) +
          logarithmicMagnitude(values[5]) * 5
      }
      const divisor = values.length >= 9 ? values[4] ?? 0 : values.at(-2) ?? 0
      const solutionCount = values.at(-1) ?? 0
      const divisorWeight = new Map<number, number>([
        [4, 8], [5, 8], [6, 18], [7, 20], [8, 24], [11, 24], [12, 34], [13, 28],
      ])
      if (values.length >= 9) {
        const digitSum = values[5] ?? 0
        const lowerBound = values[6] ?? 0
        return 48 + (divisorWeight.get(divisor) ?? divisor) + solutionCount * 2.5 +
          digitSum * 0.15 + logarithmicMagnitude(lowerBound) * 2
      }
      return (divisorWeight.get(divisor) ?? divisor) + solutionCount * 2.5
    }
    case "area-fractions": {
      const cells = (question.visual?.columns ?? 0) * (question.visual?.rows ?? 0)
      const denominator = question.response.kind === "fraction" ? question.response.denominator : 0
      return cells * 0.8 + denominator * 2.5
    }
    case "composite-areas":
      return variant === "notch"
        ? 48 + logarithmicMagnitude(values[3]) * 3
        : variant === "frame"
          ? 30 + logarithmicMagnitude(values[2]) * 2
          : 13 + logarithmicMagnitude(values[2] * values[3]) * 2
    case "tiling-costs": {
      const columns = question.visual?.columns ?? 0
      const rows = question.visual?.rows ?? 0
      const covered = new Set(question.visual?.cells ?? []).size
      const smallCount = columns * rows - covered
      return smallCount * 4 + (columns % 2 + rows % 2) * 8 + columns * rows * 0.35
    }
    case "reverse-fractions":
      return (question.visual?.numerator === 1 ? 8 : 24) +
        (question.visual?.denominator ?? 0) * 2 +
        (question.visual?.numerator ?? 0) * 1.5
    case "reverse-chains": {
      const decimalSteps = question.practiceSteps?.filter((step) => step.decimals > 0).length ?? 0
      return 55 + decimalSteps * 5 + logarithmicMagnitude(question.visual?.toValue) * 3
    }
    case "inverse-proportion": {
      const [oldPeople, oldDays, newPeople] = values
      return 24 + ((oldPeople ?? 0) / Math.max(1, newPeople ?? 1)) * 6 +
        logarithmicMagnitude((oldPeople ?? 0) * (oldDays ?? 0)) * 2
    }
    case "changing-rates": {
      const [people, days, elapsed, newPeople] = values
      const directionSignal = (newPeople ?? 0) > (people ?? 0) ? 8 : 3
      return 36 + directionSignal + Math.abs((newPeople ?? 0) - (people ?? 0)) * 0.4 +
        ((elapsed ?? 0) / Math.max(1, days ?? 1)) * 8
    }
    case "geometric-loci": {
      const construction = question.geometryConstruction
      if (!construction) return 0
      if (construction.expectedTool === "bisector") return 52
      if (construction.expectedTool === "circle") {
        return 30 + construction.distanceCentimeters
      }
      return 14 + construction.distanceCentimeters
    }
    case "coordinate-transformations":
      return variant === "rotate-cw" || variant === "rotate-ccw"
        ? 48
        : variant === "translate"
          ? 40 + Math.abs(values[4] ?? 0) + Math.abs(values[5] ?? 0)
          : variant === "reflect-origin"
            ? 27
            : 12
    case "cube-nets":
      return 24 + cubeNetPathSignal(question)
    case "spatial-rolling":
      return (question.visual?.arrows?.length ?? 0) > 1
        ? 58 + (question.visual?.arrows?.length ?? 0) * 8
        : (question.visual?.arrows?.length ?? 0) === 1
          ? 40
          : 12
    case "cuboid-surface":
      if (variant === "voxel-count" || variant === "voxel-surface") {
        return (variant === "voxel-surface" ? 58 : 28) +
          (values[0] ?? 0) + (values[1] ?? 0) + (values[2] ?? 0) * 2 +
          (values[3] ?? 0) * 1.5
      }
      return (variant === "missing-edge" ? 18 : 40) +
        logarithmicMagnitude(values[2]) * 3 + logarithmicMagnitude(values[3]) * 2
  }
}

/**
 * A transparent ordering score for candidates from the same topic. Structural
 * signals dominate; response size and written-step count only break ties.
 */
export function questionDifficultyScore(question: GeneratedQuestion): number {
  const valueSignal = numericValues(question)
    .reduce((sum, value) => sum + logarithmicMagnitude(value), 0) * 0.08
  const score = topicStructuralScore(question) + responseSignal(question) +
    question.workedSteps.length * 0.18 + valueSignal
  return Math.round(score * 1_000) / 1_000
}
