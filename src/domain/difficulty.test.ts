import { describe, expect, it } from "vitest"
import {
  buildTaskGenerationProfile,
  difficultyBandForTaskQuestion,
  difficultyBandLabels,
  questionDifficultyScore,
  reviewDifficultyBands,
  taskDifficultySummary,
} from "./difficulty"
import type { GeneratedQuestion, LearningTask, TaskGenerationProfile } from "./model"

function makeTask(generation?: TaskGenerationProfile): LearningTask {
  return {
    id: "difficulty:test",
    kind: "lesson",
    title: "Test",
    description: "Test",
    topicIds: ["mass-units"],
    prerequisiteIds: [],
    maxXp: 25,
    questionCount: 3,
    seed: "difficulty:test",
    generation,
  }
}

function makeQuestion(
  topicId: string,
  overrides: Partial<GeneratedQuestion> = {},
): GeneratedQuestion {
  return {
    id: "difficulty:test:question",
    topicId: topicId as GeneratedQuestion["topicId"],
    prompt: "Wie viele Gramm sind 5 kg?",
    answerLabel: "Deine Antwort",
    response: { kind: "number", value: 5000, decimals: 0 },
    hint: "Hinweis",
    easierExplanation: "Einfacher",
    explanation: "Erklärung",
    workedSteps: ["Schritt 1", "Schritt 2"],
    visual: { kind: "mass-conversion", fromValue: 5, toValue: 5000, unit: "kg → g" },
    ...overrides,
  }
}

describe("difficulty bands policy", () => {
  it("labels the three bands with the learner-facing names", () => {
    expect(difficultyBandLabels).toEqual({
      foundation: "Aufbau",
      standard: "Standard",
      exam: "Prüfungsnah",
    })
  })

  it("builds a version-6 generation profile that copies its band list", () => {
    expect(buildTaskGenerationProfile(["foundation", "exam"])).toEqual({
      version: 6,
      difficultyBands: ["foundation", "exam"],
    })
    expect(() => buildTaskGenerationProfile([])).toThrow(
      "A generation profile needs at least one difficulty band.",
    )

    const source = ["standard"] as const
    const profile = buildTaskGenerationProfile(source)
    expect(profile.difficultyBands).toEqual(["standard"])
    expect(profile.difficultyBands).not.toBe(source)
  })

  it("assigns bands to task questions by cycling the profile", () => {
    expect(difficultyBandForTaskQuestion(makeTask(), 0)).toBeUndefined()

    const task = makeTask(buildTaskGenerationProfile(["foundation", "standard", "exam"]))
    expect([0, 1, 2, 3, 4].map((index) => (
      difficultyBandForTaskQuestion(task, index)
    ))).toEqual(["foundation", "standard", "exam", "foundation", "standard"])
  })

  it("summarizes the distinct bands in order as label names", () => {
    expect(taskDifficultySummary(makeTask())).toBeUndefined()
    expect(taskDifficultySummary(makeTask(
      buildTaskGenerationProfile(["foundation", "standard", "exam"]),
    ))).toBe("Aufbau → Standard → Prüfungsnah")
    expect(taskDifficultySummary(makeTask(
      buildTaskGenerationProfile(["standard", "exam", "standard"]),
    ))).toBe("Standard → Prüfungsnah")
  })

  it("keeps reviews out of Aufbau and scales only with secure memory", () => {
    expect(reviewDifficultyBands({
      retention: 0.9, reviewStage: 2, independentMastery: 0.9,
    })).toEqual(["exam", "exam"])
    // Stage 2 alone is not enough without secure retention and mastery.
    expect(reviewDifficultyBands({
      retention: 0.8, reviewStage: 2, independentMastery: 0.6,
    })).toEqual(["standard", "exam"])
    // Secure memory before stage 2 still stays mixed.
    expect(reviewDifficultyBands({
      retention: 0.9, reviewStage: 1, independentMastery: 0.9,
    })).toEqual(["standard", "exam"])
    // Fragile memory drops to two standard questions.
    expect(reviewDifficultyBands({
      retention: 0.4, reviewStage: 2, independentMastery: 0.9,
    })).toEqual(["standard", "standard"])
    expect(reviewDifficultyBands({
      retention: 0.9, reviewStage: 2, independentMastery: 0.5,
    })).toEqual(["standard", "standard"])
    // Boundary values: exactly 0.5 retention / 0.55 mastery stay mixed.
    expect(reviewDifficultyBands({
      retention: 0.5, reviewStage: 0, independentMastery: 0.6,
    })).toEqual(["standard", "exam"])
    expect(reviewDifficultyBands({
      retention: 0.9, reviewStage: 0, independentMastery: 0.55,
    })).toEqual(["standard", "exam"])
    expect(reviewDifficultyBands({
      retention: 0.49, reviewStage: 0, independentMastery: 0.6,
    })).toEqual(["standard", "standard"])
  })
})

describe("questionDifficultyScore heuristic ordering", () => {
  it("ranks gram-to-kilogram conversions above kilogram-to-gram ones", () => {
    const toKilograms = makeQuestion("mass-units", {
      visual: { kind: "mass-conversion", fromValue: 5000, toValue: 5, unit: "g → kg" },
      response: { kind: "number", value: 5, decimals: 3 },
    })
    const toGrams = makeQuestion("mass-units")
    expect(questionDifficultyScore(toGrams)).toBeLessThan(questionDifficultyScore(toKilograms))
  })

  it("ranks non-unit-fraction remnants above unit-fraction ones", () => {
    const unitFraction = makeQuestion("reverse-fractions", {
      visual: {
        kind: "fraction-bar",
        numerator: 1,
        denominator: 4,
        fromValue: 5,
        toValue: 20,
      },
      response: { kind: "number", value: 20, decimals: 0 },
    })
    const multiPartFraction = makeQuestion("reverse-fractions", {
      visual: {
        kind: "fraction-bar",
        numerator: 3,
        denominator: 4,
        fromValue: 15,
        toValue: 20,
      },
      response: { kind: "number", value: 20, decimals: 0 },
    })
    expect(questionDifficultyScore(unitFraction)).toBeLessThan(
      questionDifficultyScore(multiPartFraction),
    )
  })

  it("scores money calculations by written-step count", () => {
    const short = makeQuestion("money-calculations", {
      visual: { kind: "price-table", variant: "group-total", values: [7, 18, 11, 2, 1, 3] },
      response: { kind: "number", value: 65, decimals: 0 },
      workedSteps: ["a", "b"],
    })
    const long = makeQuestion("money-calculations", {
      visual: { kind: "price-table", variant: "group-total", values: [7, 18, 11, 2, 1, 3] },
      response: { kind: "number", value: 65, decimals: 0 },
      workedSteps: ["a", "b", "c", "d"],
    })
    expect(questionDifficultyScore(short)).toBeLessThan(questionDifficultyScore(long))
  })

  it("scores proportional-revenue by the announced child-to-adult ratio", () => {
    const ratioTwo = makeQuestion("proportional-revenue", {
      prompt: "Es kamen genau 2-mal so viele Kinder wie Erwachsene.",
      visual: {
        kind: "price-table",
        variant: "ratio-bundle",
        values: [8, 20, 12, 4000, 2, 1000, 100],
      },
      response: { kind: "number", value: 200, decimals: 0 },
    })
    const ratioThree = makeQuestion("proportional-revenue", {
      prompt: "Es kamen genau 3-mal so viele Kinder wie Erwachsene.",
      visual: {
        kind: "price-table",
        variant: "ratio-bundle",
        values: [8, 20, 12, 4000, 3, 1000, 100],
      },
      response: { kind: "number", value: 200, decimals: 0 },
    })
    const ratioTwoScore = questionDifficultyScore(ratioTwo)
    const ratioThreeScore = questionDifficultyScore(ratioThree)
    expect(ratioTwoScore).toBeLessThan(ratioThreeScore)
    // Five points per ratio step (plus a tiny value-signal delta from ratio 2 vs 3).
    expect(ratioThreeScore - ratioTwoScore).toBeGreaterThan(5)
    expect(ratioThreeScore - ratioTwoScore).toBeLessThan(6)
  })

  it("ranks response signal before response size for same-topic candidates", () => {
    // Same structural score: only the response differs.
    const base = {
      visual: { kind: "mass-conversion", fromValue: 1, toValue: 1000, unit: "kg → g" },
    } as const

    const plainInteger = makeQuestion("mass-units", {
      ...base,
      response: { kind: "number", value: 1000, decimals: 0 },
    })
    const decimalInteger = makeQuestion("mass-units", {
      ...base,
      response: { kind: "number", value: 1000, decimals: 3 },
    })
    expect(questionDifficultyScore(plainInteger)).toBeLessThan(
      questionDifficultyScore(decimalInteger),
    )

    const shortSet = makeQuestion("mass-units", {
      ...base,
      response: { kind: "integer-set", values: [1, 2] },
    })
    const longSet = makeQuestion("mass-units", {
      ...base,
      response: { kind: "integer-set", values: [1, 2, 3, 4] },
    })
    expect(questionDifficultyScore(shortSet)).toBeLessThan(questionDifficultyScore(longSet))

    const nearOrigin = makeQuestion("mass-units", {
      ...base,
      response: { kind: "coordinate", x: 1, y: 1 },
    })
    const farCoordinate = makeQuestion("mass-units", {
      ...base,
      response: { kind: "coordinate", x: 3, y: 4 },
    })
    expect(questionDifficultyScore(nearOrigin)).toBeLessThan(
      questionDifficultyScore(farCoordinate),
    )
  })

  it("breaks ties with the written-step count", () => {
    const oneStep = makeQuestion("mass-units", { workedSteps: ["a"] })
    const threeSteps = makeQuestion("mass-units", { workedSteps: ["a", "b", "c"] })
    expect(questionDifficultyScore(oneStep)).toBeLessThan(questionDifficultyScore(threeSteps))
  })
})
