import { describe, expect, it } from "vitest"
import { topicIds, type LearningTask } from "./model"
import {
  generateQuestion,
  generateDifficultyVariants,
  generateQuestionsForTask,
  generatorCandidateCount,
  isCorrectAnswer,
  isCorrectNumericInput,
  parseCoordinateAnswer,
  parseFractionAnswer,
  parseIntegerSequenceAnswer,
  parseIntegerSetAnswer,
  parseNumericAnswer,
} from "./generators"
import { archiveGeneratorDiagnostics } from "./archiveGenerators"
import { archiveExpansionTopicIds } from "./archiveGeneratorExpansion"
import { cubeNetDiagnostics } from "./cubeNet"
import { buildTaskGenerationProfile } from "./difficulty"
import { gradePracticeSteps } from "./practiceSteps"
import { zap2025GeneratorDiagnostics } from "./zap2025Generators"

function correctInput(question: ReturnType<typeof generateQuestion>): string {
  switch (question.response.kind) {
    case "number":
      return String(question.response.value).replace(".", ",")
    case "fraction":
      return `${question.response.numerator}/${question.response.denominator}`
    case "choice":
      return question.response.value
    case "integer-set":
      return [...question.response.values].reverse().join(", ")
    case "integer-sequence":
      return question.response.values.join(", ")
    case "coordinate":
      return `${question.response.x}|${question.response.y}`
  }
}

function permutations(values: readonly number[]): number[][] {
  if (values.length === 1) return [[values[0]!]]
  return values.flatMap((value, index) =>
    permutations(values.filter((_, candidateIndex) => candidateIndex !== index))
      .map((tail) => [value, ...tail]),
  )
}

type TestVector = [number, number, number]
interface TestFaceOrientation {
  right: TestVector
  down: TestVector
  normal: TestVector
}

function negateTestVector(vector: TestVector): TestVector {
  return [-vector[0], -vector[1], -vector[2]]
}

function independentlyFindOppositeCubeFace(
  positions: readonly number[],
  labels: readonly string[],
  columns: number,
  targetLabel: string,
): string {
  const coordinateKey = (x: number, y: number) => `${x},${y}`
  const coordinates = positions.map((position) => ({
    x: position % columns,
    y: Math.floor(position / columns),
  }))
  const indexByCoordinate = new Map(
    coordinates.map((cell, index) => [coordinateKey(cell.x, cell.y), index]),
  )
  const orientations = new Map<number, TestFaceOrientation>([[
    0,
    { right: [1, 0, 0], down: [0, 1, 0], normal: [0, 0, 1] },
  ]])
  const queue = [0]

  while (queue.length > 0) {
    const index = queue.shift()!
    const cell = coordinates[index]!
    const orientation = orientations.get(index)!
    const neighbors = [
      { x: cell.x + 1, y: cell.y, orientation: {
        right: negateTestVector(orientation.normal),
        down: orientation.down,
        normal: orientation.right,
      } },
      { x: cell.x - 1, y: cell.y, orientation: {
        right: orientation.normal,
        down: orientation.down,
        normal: negateTestVector(orientation.right),
      } },
      { x: cell.x, y: cell.y + 1, orientation: {
        right: orientation.right,
        down: negateTestVector(orientation.normal),
        normal: orientation.down,
      } },
      { x: cell.x, y: cell.y - 1, orientation: {
        right: orientation.right,
        down: orientation.normal,
        normal: negateTestVector(orientation.down),
      } },
    ] as const

    for (const neighbor of neighbors) {
      const neighborIndex = indexByCoordinate.get(coordinateKey(neighbor.x, neighbor.y))
      if (neighborIndex === undefined || orientations.has(neighborIndex)) continue
      orientations.set(neighborIndex, neighbor.orientation)
      queue.push(neighborIndex)
    }
  }

  const targetIndex = labels.indexOf(targetLabel)
  const targetNormal = orientations.get(targetIndex)?.normal
  if (!targetNormal) throw new Error("Target face was not connected in the rendered net")
  const oppositeNormal = negateTestVector(targetNormal)
  const oppositeIndex = [...orientations.entries()].find(([, orientation]) =>
    orientation.normal.every((value, coordinate) => value === oppositeNormal[coordinate])
  )?.[0]
  if (oppositeIndex === undefined) throw new Error("Rendered net has no opposite face")
  return labels[oppositeIndex]!
}

describe("dynamic exercise generators", () => {
  it("is deterministic for a stored seed", () => {
    const first = generateQuestion("reverse-chains", "learner:task:42")
    const second = generateQuestion("reverse-chains", "learner:task:42")

    expect(first).toEqual(second)
  })

  it("puts the reported efficient-arithmetic formula on a new line", () => {
    const task: LearningTask = {
      id: "lesson:efficient-arithmetic",
      kind: "lesson",
      title: "Rechenvorteile erkennen und nutzen",
      description: "Gemeinsame Faktoren, runde Summen und Differenzen vor dem Ausrechnen erkennen.",
      topicIds: ["efficient-arithmetic"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 3,
      seed: "lesson:local-learner:efficient-arithmetic",
      curriculum: { courseId: "zh-zap1-math", version: 1 },
      generation: {
        version: 4,
        difficultyBands: ["foundation", "standard", "exam"],
      },
      contentLocale: "en",
    }

    const [question] = generateQuestionsForTask(task)

    expect(question?.id).toBe("lesson:efficient-arithmetic:question:0")
    expect(question?.prompt).toBe("Calculate as efficiently as possible:\n15 · 27 + 15 · 23")
  })

  it("reproduces the reported arithmetic-equation payload exactly", () => {
    const task: LearningTask = {
      id: "lesson:arithmetic-equations",
      kind: "lesson",
      title: "Fehlende Zahlen durch Rückwärtsrechnen finden",
      description: "Multiplikation und Division in der umgekehrten Reihenfolge auflösen.",
      topicIds: ["arithmetic-equations"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 3,
      seed: "lesson:local-learner:arithmetic-equations",
      curriculum: { courseId: "zh-zap1-math", version: 1 },
      generation: {
        version: 5,
        difficultyBands: ["foundation", "standard", "exam"],
      },
      contentLocale: "en",
    }

    const [question] = generateQuestionsForTask(task)

    expect(question?.id).toBe("lesson:arithmetic-equations:question:0")
    expect(question?.prompt).toBe("Find the missing number: (□ · 4) ÷ 2 = 72")
    expect(question?.answerLabel).toBe("The number in the box is")
    expect(question?.response).toEqual({ kind: "number", value: 36, decimals: 0 })
    expect(question?.visual).toEqual({
      kind: "equation-balance",
      values: [4, 2, 72],
      labels: ["multiply", "divide", "result"],
    })
    expect(question && isCorrectAnswer(question, "36")).toBe(true)
    expect(question && isCorrectAnswer(question, "72")).toBe(false)
  })

  it("renders the reported recovery boxes question in German with concrete groups", () => {
    const task: LearningTask = {
      id: "lesson-recovery:arithmetic-equations:1",
      kind: "repair",
      purpose: "lesson-recovery",
      title: "Sicherungsrunde: Rechenketten",
      description: "Nach einer kurzen Pause festigen zwei neue Aufgaben dieselbe Idee mit frischen Zahlen. Deine bisherigen XP bleiben erhalten.",
      topicIds: ["arithmetic-equations"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 2,
      seed: "lesson-recovery:local-learner:arithmetic-equations:1",
      curriculum: { courseId: "zh-zap1-math", version: 1 },
      generation: {
        version: 6,
        difficultyBands: ["standard", "exam"],
      },
      contentLocale: "de",
    }

    const [question] = generateQuestionsForTask(task)

    expect(question?.prompt).toBe(
      "In beiden Kisten zusammen liegen 28 Bausteine.\nGelbe Kiste: eine unbekannte Anzahl.\nBlaue Kiste: 3-mal so viele wie gelb + 12 zusätzliche Bausteine.\n\nWie viele Bausteine liegen in der blauen Kiste?",
    )
    expect(question?.response).toEqual({ kind: "number", value: 24, decimals: 0 })
    expect(question?.easierExplanation).toContain(
      "Diese 16 Bausteine sind 4 gleiche Gruppen: eine gelbe Gruppe und 3 Gruppen für Blau.",
    )
    expect(question?.workedSteps).toEqual([
      "28 − 12 = 16 (die Extra-Bausteine aus Blau wegnehmen)",
      "16 : 4 = 4 (eine gelbe Gruppe)",
      "3 · 4 + 12 = 24 (blaue Kiste)",
    ])
  })

  it("uses generation v6 for new task profiles while replaying v2-v5 requests", () => {
    expect(buildTaskGenerationProfile(["foundation", "exam"])).toEqual({
      version: 6,
      difficultyBands: ["foundation", "exam"],
    })

    for (const version of [2, 3, 4, 5] as const) {
      const generation = { version, difficultyBand: "standard" as const }
      const first = generateQuestion("mass-units", "legacy-generation-replay", "legacy", generation)
      const replay = generateQuestion("mass-units", "legacy-generation-replay", "legacy", generation)

      expect(replay).toEqual(first)
      expect(first.generation?.version).toBe(version)
    }
  })

  it("pins byte-level v2-v4 replay signatures for every v5-expanded topic", () => {
    const stableHash = (value: unknown): string => {
      let hash = 2_166_136_261
      for (const character of JSON.stringify(value)) {
        hash ^= character.charCodeAt(0)
        hash = Math.imul(hash, 16_777_619)
      }
      return (hash >>> 0).toString(16).padStart(8, "0")
    }
    const signatures = Object.fromEntries(archiveExpansionTopicIds.map((topicId) => [
      topicId,
      Object.fromEntries(([2, 3, 4] as const).map((version) => [
        `v${version}`,
        stableHash(generateQuestion(
          topicId,
          `legacy-golden:${topicId}`,
          "legacy-golden",
          { version, difficultyBand: "standard" },
          "de",
        )),
      ])),
    ]))

    expect(signatures).toMatchInlineSnapshot(`
      {
        "cuboid-surface": {
          "v2": "a6c2df23",
          "v3": "49fea194",
          "v4": "5e2826e1",
        },
        "data-tables": {
          "v2": "35f086d7",
          "v3": "036bc46d",
          "v4": "876a5486",
        },
        "efficient-arithmetic": {
          "v2": "065bb9cc",
          "v3": "738b4b0f",
          "v4": "80027bba",
        },
        "number-constraints": {
          "v2": "61766092",
          "v3": "7cd4ed3c",
          "v4": "23e0d919",
        },
        "speed-distance-time": {
          "v2": "6efb81ea",
          "v3": "2e972f4f",
          "v4": "d7955aa7",
        },
      }
    `)
  })

  it("pins byte-level v5 replay signatures across the complete Mathematics course", () => {
    const stableHash = (value: unknown): string => {
      let hash = 2_166_136_261
      for (const character of JSON.stringify(value)) {
        hash ^= character.charCodeAt(0)
        hash = Math.imul(hash, 16_777_619)
      }
      return (hash >>> 0).toString(16).padStart(8, "0")
    }
    const signatures = Object.fromEntries(topicIds.map((topicId) => [
      topicId,
      stableHash(generateQuestion(
        topicId,
        `v5-golden:${topicId}`,
        "v5-golden",
        { version: 5, difficultyBand: "standard" },
        "de",
      )),
    ]))

    expect(signatures).toEqual({
      "arithmetic-equations": "ec8cd75d",
      "efficient-arithmetic": "6d1dcb34",
      "mass-units": "3ff343f1",
      "fraction-of-quantity": "21129a67",
      "time-fractions": "c515485c",
      "speed-distance-time": "ac6677aa",
      "data-tables": "6c4fe3ed",
      "money-calculations": "5aaef0b6",
      "proportional-revenue": "98b5e9a6",
      "integer-combinations": "98850209",
      "number-constraints": "1de9f734",
      "area-fractions": "08b1bd9c",
      "composite-areas": "1d2ffc2c",
      "tiling-costs": "94d06a30",
      "reverse-fractions": "02d41129",
      "reverse-chains": "0373e98d",
      "inverse-proportion": "93b128de",
      "changing-rates": "41a90995",
      "geometric-loci": "e1e72283",
      "coordinate-transformations": "b5d9c5a4",
      "cube-nets": "bf04ec90",
      "spatial-rolling": "d403378f",
      "cuboid-surface": "2c5c339e",
    })
  })

  it("mixes expanded and existing families in v5 without leaking them into v4", () => {
    for (const topicId of archiveExpansionTopicIds) {
      const observed = new Set<"expanded" | "existing">()

      for (let index = 0; index < 40; index += 1) {
        const variants = generateDifficultyVariants(topicId, `v5-family-mix:${topicId}:${index}`, undefined, 5)
        for (const question of Object.values(variants)) {
          observed.add(question.provenance ? "expanded" : "existing")
        }
      }

      expect(observed, topicId).toEqual(new Set(["expanded", "existing"]))
      const legacyVariants = generateDifficultyVariants(topicId, `v4-family-boundary:${topicId}`, undefined, 4)
      expect(Object.values(legacyVariants).every((question) => question.provenance === undefined), topicId).toBe(true)
    }
  })

  it("scores the four-filter repeated-digit form above the simplest number filters", () => {
    const placements = { foundation: 0, standard: 0, exam: 0 }

    for (let index = 0; index < 200; index += 1) {
      const variants = generateDifficultyVariants("number-constraints", `v5-repeated-difficulty:${index}`, undefined, 5)
      for (const difficultyBand of ["foundation", "standard", "exam"] as const) {
        if (variants[difficultyBand].provenance?.familyId === "archive-v5-repeated-digit-filter") {
          placements[difficultyBand] += 1
        }
      }
    }

    expect(placements.exam).toBeGreaterThan(placements.foundation)
    expect(placements.exam + placements.standard).toBeGreaterThan(0)
  })

  it("orders 1,000 adaptive pools into reproducible, materially different bands", () => {
    const coveredTopics = new Set<string>()

    for (let index = 0; index < 1_000; index += 1) {
      const topicId = topicIds[index % topicIds.length]!
      const seed = `adaptive-invariant:${topicId}:${index}`
      const variants = generateDifficultyVariants(topicId, seed)
      const replay = generateDifficultyVariants(topicId, seed)
      const ordered = [variants.foundation, variants.standard, variants.exam]
      const scores = ordered.map((question) => question.generation!.difficultyScore)

      coveredTopics.add(topicId)
      expect(replay).toEqual(variants)
      expect(new Set(ordered.map((question) => question.prompt)).size, topicId).toBe(3)
      expect(scores[0], topicId).toBeLessThanOrEqual(scores[1]!)
      expect(scores[1], topicId).toBeLessThanOrEqual(scores[2]!)
      expect(scores[0], topicId).toBeLessThan(scores[2]!)
      expect(ordered.map((question) => question.generation?.difficultyBand)).toEqual([
        "foundation",
        "standard",
        "exam",
      ])
      expect(ordered.every((question) => (
        question.generation!.candidateCount >= 3 &&
        isCorrectAnswer(question, correctInput(question))
      )), topicId).toBe(true)
    }

    expect(coveredTopics).toEqual(new Set(topicIds))
  }, 30_000)

  it("keeps version-two replay stable while version three varies within a band", () => {
    const versionTwoPrompts = new Set(
      Array.from({ length: 20 }, (_, index) => generateQuestion(
        "mass-units",
        `generation-version:${index}`,
        `generation-version:${index}`,
        { version: 2, difficultyBand: "standard" },
      ).prompt),
    )
    const versionThreePrompts = new Set(
      Array.from({ length: 20 }, (_, index) => generateQuestion(
        "mass-units",
        `generation-version:${index}`,
        `generation-version:${index}`,
        { version: 3, difficultyBand: "standard" },
      ).prompt),
    )

    expect(versionTwoPrompts.size).toBe(1)
    expect(versionThreePrompts.size).toBeGreaterThan(1)
  })

  it("keeps v3 spatial tasks on their original template and gives v4 the full path engine", () => {
    const legacy = generateQuestion(
      "spatial-rolling",
      "spatial-template-replay",
      "spatial-template-replay",
      { version: 3, difficultyBand: "exam" },
    )
    const current = generateQuestion(
      "spatial-rolling",
      "spatial-template-replay",
      "spatial-template-replay",
      { version: 4, difficultyBand: "exam" },
    )

    expect(legacy.response.kind).toBe("choice")
    expect(legacy.visual?.arrows).toEqual(["rechts"])
    expect(current.response.kind).toBe("integer-sequence")
    expect(current.visual?.arrows?.length).toBeGreaterThan(1)
  })

  it("keeps full spatial orientation and all three difficulty forms in v4-v6", () => {
    for (const version of [4, 5, 6] as const) {
      const variants = generateDifficultyVariants(
        "spatial-rolling",
        "spatial-v5-band-coverage",
        "spatial-v5-band-coverage",
        version,
      )

      expect(variants.foundation.generation?.version).toBe(version)
      expect(variants.standard.generation?.version).toBe(version)
      expect(variants.exam.generation?.version).toBe(version)
      expect(variants.foundation.visual?.arrows).toHaveLength(0)
      expect(variants.standard.visual?.arrows).toHaveLength(1)
      expect(variants.exam.visual?.arrows?.length).toBeGreaterThan(1)
      expect(variants.exam.response.kind).toBe("integer-sequence")
    }

    expect(generateDifficultyVariants("mass-units", "current-default").standard.generation?.version)
      .toBe(6)
  })

  it("produces valid, exactly gradable instances across many seeds", () => {
    for (const topicId of topicIds) {
      for (let index = 0; index < 500; index += 1) {
        const question = generateQuestion(topicId, `${topicId}:${index}`)
        if (question.response.kind === "number") {
          expect(Number.isFinite(question.response.value)).toBe(true)
        }
        expect(question.prompt.length).toBeGreaterThan(20)
        expect(question.workedSteps.length).toBeGreaterThan(0)
        expect(isCorrectAnswer(question, correctInput(question))).toBe(true)
      }
    }
  })

  it("has a non-empty, constraint-checked reverse-chain space", () => {
    expect(generatorCandidateCount()).toBeGreaterThan(100)
  })

  it("keeps all guided reverse-chain milestones valid across 1,000 seeds", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("reverse-chains", `guided:${index}`)
      const steps = question.practiceSteps ?? []
      expect(steps).toHaveLength(4)
      expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length)
      expect(steps.at(-1)?.value).toBe(
        question.response.kind === "number" ? question.response.value : undefined,
      )
      expect(gradePracticeSteps(
        steps,
        Object.fromEntries(steps.map((step) => [step.id, String(step.value)])),
      ).correct).toBe(true)
    }
  })

  it("has substantial validated candidate spaces for constrained 2025 families", () => {
    const diagnostics = zap2025GeneratorDiagnostics()
    expect(diagnostics.timeFractionCandidates).toBeGreaterThan(100)
    expect(diagnostics.integerCombinationCandidates).toBeGreaterThan(20)
    expect(diagnostics.inverseProportionCandidates).toBeGreaterThan(50)
    expect(diagnostics.changingRateCandidates).toBeGreaterThan(100)
  })

  it("has substantial independently solved spaces for recurring archive families", () => {
    const diagnostics = archiveGeneratorDiagnostics()
    expect(diagnostics.averageSpeedCandidates).toBeGreaterThan(100)
    expect(diagnostics.catchUpCandidates).toBeGreaterThan(20)
    expect(diagnostics.numberConstraintCandidates).toBeGreaterThan(100)
    expect(cubeNetDiagnostics()).toEqual({ freeHexominoes: 35, validCubeNets: 11 })
  })

  it("keeps efficient-arithmetic identities valid across 1,000 seeds", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("efficient-arithmetic", `archive:efficient:${index}`)
      expect(question.response.kind).toBe("number")
      if (question.response.kind !== "number") throw new Error("Expected number response")
      const [factor, left, right] = question.visual?.values ?? []
      const expected = question.visual?.variant === "difference"
        ? factor! * (left! - right!)
        : factor! * (left! + right!)
      expect(question.response.value).toBe(expected)
    }
  })

  it("keeps motion models exact across 1,000 seeds", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("speed-distance-time", `archive:motion:${index}`)
      expect(question.response.kind).toBe("number")
      if (question.response.kind !== "number") throw new Error("Expected number response")
      const values = question.visual?.values ?? []
      if (question.visual?.variant === "average") {
        const [firstSpeed, firstMinutes, firstDistance, secondSpeed, secondMinutes, secondDistance] = values
        expect(firstDistance).toBeCloseTo(firstSpeed! * firstMinutes! / 60, 8)
        expect(secondDistance).toBeCloseTo(secondSpeed! * secondMinutes! / 60, 8)
        expect(question.response.value).toBeCloseTo(
          (firstDistance! + secondDistance!) * 60 / (firstMinutes! + secondMinutes!),
          8,
        )
      } else {
        const [slowSpeed, fastSpeed, headStartMinutes, catchMinutes, distance] = values
        expect(catchMinutes).toBeCloseTo(
          headStartMinutes! * slowSpeed! / (fastSpeed! - slowSpeed!),
          8,
        )
        expect(distance).toBeCloseTo(fastSpeed! * catchMinutes! / 60, 8)
        expect(question.response.value).toBe(distance)
      }
    }
  })

  it("derives every table answer from the visible cells across 1,000 seeds", () => {
    const seenVariants = new Set<string>()

    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("data-tables", `archive:tables:${index}`)
      expect(question.response.kind).toBe("number")
      if (question.response.kind !== "number") throw new Error("Expected number response")
      const values = question.visual?.values ?? []
      const variant = question.visual?.variant
      seenVariants.add(variant ?? "")

      if (variant === "complement") {
        const totalDays = values[0]!
        const classifiedDays = values.slice(1).reduce((sum, value) => sum + value, 0)
        expect(values.slice(1, 4).every((value, camp) =>
          value + values[4 + camp]! < totalDays
        )).toBe(true)
        expect(question.response.value).toBe(3 * totalDays - classifiedDays)
      } else if (variant === "missing-average") {
        expect((values[0]! + values[1]! + values[2]!) / 3).toBe(values[3])
        expect(question.response.value).toBe(values[2])
      } else {
        expect(variant).toBe("difference")
        expect(values[0]! + values[1]!).toBeCloseTo(values[2]!, 8)
        expect(question.response.value).toBe(values[1])
      }
    }

    expect([...seenVariants].sort()).toEqual(["complement", "difference", "missing-average"])
  })

  it("folds every rendered cube net independently across 1,000 seeds", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("cube-nets", `archive:cube-nets:${index}`)
      expect(question.response.kind).toBe("choice")
      if (question.response.kind !== "choice") throw new Error("Expected choice response")
      const visual = question.visual
      expect(visual?.kind).toBe("cube-net")
      const positions = visual?.cells ?? []
      const labels = visual?.labels ?? []
      const columns = visual?.columns ?? 0
      const rows = visual?.rows ?? 0
      const targetLabel = visual?.unit ?? ""

      expect(positions).toHaveLength(6)
      expect(new Set(positions).size).toBe(6)
      expect(labels).toHaveLength(6)
      expect(new Set(labels).size).toBe(6)
      expect(positions.every((position) => position >= 0 && position < columns * rows)).toBe(true)

      const independentlySolved = independentlyFindOppositeCubeFace(
        positions,
        labels,
        columns,
        targetLabel,
      )
      expect(question.response.value).toBe(independentlySolved)
      expect(question.response.options.map((option) => option.id).sort()).toEqual(
        labels.filter((label) => label !== targetLabel).sort(),
      )
    }
  })

  it("applies coordinate transformations algebraically across 1,000 seeds", () => {
    const seenVariants = new Set<string>()

    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion(
        "coordinate-transformations",
        `archive:coordinates:${index}`,
      )
      expect(question.response.kind).toBe("coordinate")
      if (question.response.kind !== "coordinate") throw new Error("Expected coordinate response")
      const [x, y, targetX, targetY, deltaX, deltaY] = question.visual?.values ?? []
      const variant = question.visual?.variant
      seenVariants.add(variant ?? "")

      switch (variant) {
        case "reflect-x":
          expect([targetX, targetY]).toEqual([x, -y!])
          break
        case "reflect-y":
          expect([targetX, targetY]).toEqual([-x!, y])
          break
        case "reflect-origin":
          expect([targetX, targetY]).toEqual([-x!, -y!])
          break
        case "rotate-cw":
          expect([targetX, targetY]).toEqual([y, -x!])
          break
        case "rotate-ccw":
          expect([targetX, targetY]).toEqual([-y!, x])
          break
        case "translate":
          expect([targetX, targetY]).toEqual([x! + deltaX!, y! + deltaY!])
          break
        default:
          throw new Error(`Unexpected coordinate variant: ${variant}`)
      }

      expect(question.response).toMatchObject({ x: targetX, y: targetY })
    }

    expect([...seenVariants].sort()).toEqual([
      "reflect-origin",
      "reflect-x",
      "reflect-y",
      "rotate-ccw",
      "rotate-cw",
      "translate",
    ])
  })

  it("returns every valid constrained number exactly once across 1,000 seeds", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("number-constraints", `archive:constraints:${index}`)
      expect(question.response.kind).toBe("integer-set")
      if (question.response.kind !== "integer-set") throw new Error("Expected integer-set response")
      const values = question.visual?.values ?? []
      const digits = values.slice(0, 4)
      const divisor = values[4]!
      const expected = permutations(digits)
        .map((parts) => Number(parts.join("")))
        .filter((value) => value % divisor === 0)
        .filter((value) => {
          const thousands = Math.floor(value / 1000)
          const units = value % 10
          return question.visual?.variant === "greater"
            ? thousands > units
            : thousands < units
        })
        .sort((left, right) => left - right)

      expect(question.response.values).toEqual(expected)
      expect(new Set(question.response.values).size).toBe(question.response.values.length)
    }
  })

  it("keeps composite area and perimeter geometry valid across 1,000 seeds", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const question = generateQuestion("composite-areas", `archive:areas:${index}`)
      expect(question.response.kind).toBe("number")
      if (question.response.kind !== "number") throw new Error("Expected number response")
      const [width, height, third, fourth, fifth] = question.visual?.values ?? []
      if (question.visual?.variant === "frame") {
        expect(fourth).toBe(width! - 2 * third!)
        expect(fifth).toBe(height! - 2 * third!)
        expect(question.response.value).toBe(width! * height! - fourth! * fifth!)
      } else if (question.visual?.variant === "corner") {
        expect(question.response.value).toBe(width! * height! - third! * fourth!)
      } else {
        expect(question.response.value).toBe(2 * (width! + height!) + 2 * fourth!)
      }
    }
  })

  it("generates a fresh deterministic set for each task seed", () => {
    const task: LearningTask = {
      id: "review:reverse-fractions:3",
      kind: "review",
      title: "Test",
      description: "Test",
      topicIds: ["reverse-fractions"],
      prerequisiteIds: [],
      maxXp: 6,
      questionCount: 3,
      seed: "review-seed-3",
    }

    const questions = generateQuestionsForTask(task)
    expect(questions).toHaveLength(3)
    expect(new Set(questions.map((question) => question.id)).size).toBe(3)
  })

  it("keeps legacy Zurich tasks replayable and rejects an unknown task package", () => {
    const legacy: LearningTask = {
      id: "review:mass-units:legacy",
      kind: "review",
      title: "Legacy",
      description: "Legacy task without persisted curriculum identity",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:mass-units:legacy",
    }
    const current: LearningTask = {
      ...legacy,
      curriculum: { courseId: "zh-zap1-math", version: 1 },
    }
    expect(generateQuestionsForTask(legacy)).toEqual(generateQuestionsForTask(current))

    const unsupported: LearningTask = {
      ...current,
      curriculum: { courseId: "zh-zap1-math", version: 99 },
    }
    expect(() => generateQuestionsForTask(unsupported)).toThrow("nicht unterstützt")
  })

  it("does not repeat a prompt inside a lesson when variants are available", () => {
    for (const topicId of topicIds) {
      for (let seedIndex = 0; seedIndex < 50; seedIndex += 1) {
        const task: LearningTask = {
          id: `lesson:${topicId}:${seedIndex}`,
          kind: "lesson",
          title: "Test",
          description: "Test",
          topicIds: [topicId],
          prerequisiteIds: [],
          maxXp: 25,
          questionCount: 3,
          seed: `lesson:${topicId}:${seedIndex}`,
        }
        const questions = generateQuestionsForTask(task)
        expect(new Set(questions.map((question) => question.prompt)).size).toBe(3)
      }
    }
  })

  it("does not repeat prompts inside adaptive reviews with the same difficulty band", () => {
    for (const topicId of topicIds) {
      for (let seedIndex = 0; seedIndex < 50; seedIndex += 1) {
        const task: LearningTask = {
          id: `review:${topicId}:adaptive:${seedIndex}`,
          kind: "review",
          title: "Test",
          description: "Test",
          topicIds: [topicId],
          prerequisiteIds: [],
          maxXp: 4,
          questionCount: 2,
          seed: `review:${topicId}:adaptive:${seedIndex}`,
          generation: { version: 3, difficultyBands: ["standard", "standard"] },
        }
        const questions = generateQuestionsForTask(task)
        expect(new Set(questions.map((question) => question.prompt)).size, topicId).toBe(2)
      }
    }
  }, 30_000)

  it("accepts Swiss decimal commas and rejects empty text", () => {
    expect(parseNumericAnswer(" 12,5 ")).toBe(12.5)
    expect(parseNumericAnswer(" ")).toBeUndefined()
  })

  it("parses Swiss apostrophe grouping and round-trips the de-CH display format", () => {
    expect(parseNumericAnswer("1'000")).toBe(1000)
    expect(parseNumericAnswer("1’234’567,5")).toBe(1234567.5)
    expect(parseNumericAnswer(new Intl.NumberFormat("de-CH").format(1234567.5))).toBe(1234567.5)
    expect(parseNumericAnswer("3'000")).toBe(3000)
  })

  it("rejects mixed-number fraction input instead of silently reading it as a single fraction", () => {
    expect(parseFractionAnswer("1 1/2")).toBeUndefined()
    expect(parseFractionAnswer("2  3/4")).toBeUndefined()
    expect(parseFractionAnswer("11/2")).toEqual({ numerator: 11, denominator: 2 })
    expect(parseFractionAnswer(" 3/4 ")).toEqual({ numerator: 3, denominator: 4 })
    expect(parseFractionAnswer("3 / 4")).toEqual({ numerator: 3, denominator: 4 })
  })

  it("grades 3-digit group separators by expected-aware interpretation without breaking decimal commas", () => {
    // de decimal-comma contract stays: "3,000" can still mean 3
    expect(isCorrectNumericInput("3,000", 3, 0)).toBe(true)
    expect(isCorrectNumericInput("12,5", 12.5, 1)).toBe(true)
    // en/it grouping interpretations now also match when the canonical parse cannot
    expect(isCorrectNumericInput("3,000", 3000, 0)).toBe(true)
    expect(isCorrectNumericInput("3.000", 3000, 0)).toBe(true)
    expect(isCorrectNumericInput("12'000", 12000, 0)).toBe(true)
    expect(isCorrectNumericInput("-3,000", -3000, 0)).toBe(true)
    // no false-correct: incomplete groups never become grouping separators
    expect(isCorrectNumericInput("12.5", 125, 0)).toBe(false)
    expect(isCorrectNumericInput("12,5", 125, 0)).toBe(false)
    expect(isCorrectNumericInput("30,00", 3000, 0)).toBe(false)
    expect(isCorrectNumericInput("3,000", 30, 0)).toBe(false)
    expect(isCorrectNumericInput("3,000", 300, 0)).toBe(false)
  })

  it("parses unordered integer sets and rejects duplicates or malformed separators", () => {
    expect(parseIntegerSetAnswer("4312, 1234; 2143")).toEqual([1234, 2143, 4312])
    expect(parseIntegerSetAnswer("1234 1234")).toBeUndefined()
    expect(parseIntegerSetAnswer("1234,,2143")).toBeUndefined()
    expect(parseIntegerSetAnswer("1234 und 2143")).toBeUndefined()
  })

  it("preserves order and repeated values in integer sequences", () => {
    expect(parseIntegerSequenceAnswer("2, 3; 1 4")).toEqual([2, 3, 1, 4])
    expect(parseIntegerSequenceAnswer("2, 3, 2")).toEqual([2, 3, 2])
    expect(parseIntegerSequenceAnswer("2,,3")).toBeUndefined()
    expect(parseIntegerSequenceAnswer("2 → 3")).toBeUndefined()
  })

  it("parses resumable ordered pairs without confusing decimal commas", () => {
    expect(parseCoordinateAnswer("(3|-2)")).toEqual({ x: 3, y: -2 })
    expect(parseCoordinateAnswer("1,5 ; -2,5")).toEqual({ x: 1.5, y: -2.5 })
    expect(parseCoordinateAnswer("3")).toBeUndefined()
    expect(parseCoordinateAnswer("3| ")).toBeUndefined()
  })

  it("requires the complete constrained-number set without order dependence", () => {
    const question = generateQuestion("number-constraints", "complete-set-grading")
    if (question.response.kind !== "integer-set") throw new Error("Expected integer-set response")
    const expected = question.response.values
    expect(isCorrectAnswer(question, [...expected].reverse().join("; "))).toBe(true)
    expect(isCorrectAnswer(question, expected.slice(0, -1).join(", "))).toBe(false)
    expect(isCorrectAnswer(question, `${expected.join(", ")}, 9999`)).toBe(false)
    expect(isCorrectAnswer(question, `${expected.join(", ")}, ${expected[0]}`)).toBe(false)
  })

  it("requires reduced form on exact fraction questions", () => {
    const question = generateQuestion("area-fractions", "fraction-reduction")
    expect(question.response.kind).toBe("fraction")
    if (question.response.kind !== "fraction") throw new Error("Expected a fraction response")

    expect(isCorrectAnswer(question, `${question.response.numerator}/${question.response.denominator}`)).toBe(true)
    expect(isCorrectAnswer(question, `${question.response.numerator * 2}/${question.response.denominator * 2}`)).toBe(false)
  })

  it("grades generated choice questions by stable option id", () => {
    for (const topicId of ["geometric-loci", "spatial-rolling"] as const) {
      const question = generateQuestion(topicId, `choice:${topicId}`)
      expect(question.response.kind).toBe("choice")
      if (question.response.kind !== "choice") throw new Error("Expected a choice response")
      const response = question.response

      expect(isCorrectAnswer(question, response.value)).toBe(true)
      const wrong = response.options.find((option) => option.id !== response.value)
      expect(wrong).toBeDefined()
      expect(isCorrectAnswer(question, wrong!.id)).toBe(false)
    }
  })
})
