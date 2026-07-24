import { describe, expect, it } from "vitest"
import { encodeGeometryConstructionAnswer } from "./geometryConstruction"
import { createInitialLearner, recordMockExamResult } from "./learningEngine"
import {
  ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION,
  FULL_MOCK_DURATION_SECONDS,
  FIXED_BAND_MOCK_BLUEPRINT_VERSION,
  FULL_ORIENTATION_MOCK_BLUEPRINT_VERSION,
  LEGACY_MOCK_BLUEPRINT_VERSION,
  MOCK_BLUEPRINT_VERSION,
  VARIABLE_BAND_MOCK_BLUEPRINT_VERSION,
  MOCK_MAX_POINTS,
  MOCK_TASK_COUNT,
  buildGeneratedMockBlueprint,
  createActiveMockExam,
  generateMockPartQuestion,
  gradeMockExam,
  isMockExpired,
  isReplayableMockExam,
  mockPartRequiresMethod,
  remainingMockSeconds,
} from "./mockExam"
import type { GeneratedQuestion } from "./model"

function correctAnswer(question: GeneratedQuestion): string {
  if (question.geometryConstruction) {
    return encodeGeometryConstructionAnswer({
      version: 1,
      tool: question.geometryConstruction.expectedTool,
      parameter: question.geometryConstruction.targetParameter,
    })
  }
  switch (question.response.kind) {
    case "number":
      return String(question.response.value)
    case "fraction":
      return `${question.response.numerator}/${question.response.denominator}`
    case "choice":
      return question.response.value
    case "integer-set":
      return question.response.values.join(", ")
    case "integer-sequence":
      return question.response.values.join(", ")
    case "coordinate":
      return `${question.response.x}|${question.response.y}`
  }
}

describe("generated strict mock exams", () => {
  it("builds the same recurrence-matched 9-task and 36-point paper from its seed", () => {
    const first = buildGeneratedMockBlueprint("learner:mock:1")
    const replay = buildGeneratedMockBlueprint("learner:mock:1")

    expect(replay).toEqual(first)
    expect(first.tasks).toHaveLength(MOCK_TASK_COUNT)
    expect(first.tasks.map((task) => task.taskNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(first.tasks.every((task) => task.maxPoints === 4 && task.parts.length === 2)).toBe(true)
    expect(first.tasks.flatMap((task) => task.parts).reduce((sum, part) => sum + part.maxPoints, 0)).toBe(MOCK_MAX_POINTS)
    expect(new Set(first.tasks.map((task) => task.family)).size).toBe(MOCK_TASK_COUNT)
    expect(first.durationSeconds).toBe(FULL_MOCK_DURATION_SECONDS)
  })

  it("pins an English paper and its generated questions through replay and grading", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveMockExam(
      "english-mock",
      start,
      FULL_MOCK_DURATION_SECONDS,
      MOCK_BLUEPRINT_VERSION,
      "en",
    )
    const english = buildGeneratedMockBlueprint(exam.seed, MOCK_BLUEPRINT_VERSION, "en")
    const german = buildGeneratedMockBlueprint(exam.seed, MOCK_BLUEPRINT_VERSION, "de")

    expect(exam.contentLocale).toBe("en")
    expect(english.title).toBe("Generated ZAP exam")
    expect(english.tasks[0]!.title).toBe("Calculations and units")
    expect(english.tasks[0]!.parts[0]!.contentLocale).toBe("en")
    expect(generateMockPartQuestion(english.tasks[0]!.parts[0]!).prompt).not.toBe(
      generateMockPartQuestion(german.tasks[0]!.parts[0]!).prompt,
    )
    expect(isReplayableMockExam(exam)).toBe(true)

    const result = gradeMockExam(exam, "submitted", new Date("2026-07-14T12:30:00.000Z"))
    expect(result.contentLocale).toBe("en")
    expect(result.title).toBe("Generated ZAP exam")
    expect(result.taskResults[0]!.title).toBe("Calculations and units")
  })

  it("pins an Italian paper and its generated questions through replay and grading", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveMockExam(
      "italian-mock",
      start,
      FULL_MOCK_DURATION_SECONDS,
      MOCK_BLUEPRINT_VERSION,
      "it",
    )
    const italian = buildGeneratedMockBlueprint(exam.seed, MOCK_BLUEPRINT_VERSION, "it")
    const german = buildGeneratedMockBlueprint(exam.seed, MOCK_BLUEPRINT_VERSION, "de")

    expect(exam.contentLocale).toBe("it")
    expect(italian.title).toBe("Esame ZAP generato")
    expect(italian.tasks[0]!.title).toBe("Calcoli e unità")
    expect(italian.tasks[0]!.parts[0]!.contentLocale).toBe("it")
    expect(generateMockPartQuestion(italian.tasks[0]!.parts[0]!).prompt).not.toBe(
      generateMockPartQuestion(german.tasks[0]!.parts[0]!).prompt,
    )
    expect(isReplayableMockExam(exam)).toBe(true)

    const result = gradeMockExam(exam, "submitted", new Date("2026-07-14T12:30:00.000Z"))
    expect(result.contentLocale).toBe("it")
    expect(result.title).toBe("Esame ZAP generato")
    expect(result.taskResults[0]!.title).toBe("Calcoli e unità")
  })

  it("pins a Spanish paper and its generated questions through replay and grading", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveMockExam(
      "spanish-mock",
      start,
      FULL_MOCK_DURATION_SECONDS,
      MOCK_BLUEPRINT_VERSION,
      "es",
    )
    const spanish = buildGeneratedMockBlueprint(exam.seed, MOCK_BLUEPRINT_VERSION, "es")
    const german = buildGeneratedMockBlueprint(exam.seed, MOCK_BLUEPRINT_VERSION, "de")

    expect(exam.contentLocale).toBe("es")
    expect(spanish.title).toBe("Examen ZAP generado")
    expect(spanish.tasks[0]!.title).toBe("Cálculos y unidades")
    expect(spanish.tasks[0]!.parts[0]!.contentLocale).toBe("es")
    expect(generateMockPartQuestion(spanish.tasks[0]!.parts[0]!).prompt).not.toBe(
      generateMockPartQuestion(german.tasks[0]!.parts[0]!).prompt,
    )
    expect(isReplayableMockExam(exam)).toBe(true)

    const result = gradeMockExam(exam, "submitted", new Date("2026-07-14T12:30:00.000Z"))
    expect(result.contentLocale).toBe("es")
    expect(result.title).toBe("Examen ZAP generado")
    expect(result.taskResults[0]!.title).toBe("Cálculos y unidades")
  })

  it("keeps all 1,000 blueprint seeds structurally valid and reproducible", () => {
    for (let index = 0; index < 1_000; index += 1) {
      const seed = `mock-invariant:${index}`
      const blueprint = buildGeneratedMockBlueprint(seed)
      expect(buildGeneratedMockBlueprint(seed)).toEqual(blueprint)
      expect(blueprint.tasks).toHaveLength(9)
      expect(new Set(blueprint.tasks.flatMap((task) => task.parts.map((part) => part.id))).size).toBe(18)
      expect(blueprint.tasks.every((task) => task.parts.every((part) => {
        const question = generateMockPartQuestion(part)
        return question.id === part.id && question.topicId === part.topicId && question.prompt.length > 0
      }))).toBe(true)
    }
  }, 30_000)

  it("replays legacy papers exactly while new papers persist exam-level generation", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const legacy = createActiveMockExam(
      "legacy-replay",
      start,
      FULL_MOCK_DURATION_SECONDS,
      LEGACY_MOCK_BLUEPRINT_VERSION,
    )
    const legacyBlueprint = buildGeneratedMockBlueprint(
      legacy.seed,
      LEGACY_MOCK_BLUEPRINT_VERSION,
    )
    const current = createActiveMockExam("current-replay", start)
    const currentBlueprint = buildGeneratedMockBlueprint(current.seed, MOCK_BLUEPRINT_VERSION)
    const fixedBand = createActiveMockExam(
      "fixed-band-replay",
      start,
      FULL_MOCK_DURATION_SECONDS,
      FIXED_BAND_MOCK_BLUEPRINT_VERSION,
    )
    const fixedBandBlueprint = buildGeneratedMockBlueprint(
      fixedBand.seed,
      FIXED_BAND_MOCK_BLUEPRINT_VERSION,
    )
    const variableBand = createActiveMockExam(
      "variable-band-replay",
      start,
      FULL_MOCK_DURATION_SECONDS,
      VARIABLE_BAND_MOCK_BLUEPRINT_VERSION,
    )
    const variableBandBlueprint = buildGeneratedMockBlueprint(
      variableBand.seed,
      VARIABLE_BAND_MOCK_BLUEPRINT_VERSION,
    )
    const fullOrientation = createActiveMockExam(
      "full-orientation-replay",
      start,
      FULL_MOCK_DURATION_SECONDS,
      FULL_ORIENTATION_MOCK_BLUEPRINT_VERSION,
    )
    const fullOrientationBlueprint = buildGeneratedMockBlueprint(
      fullOrientation.seed,
      FULL_ORIENTATION_MOCK_BLUEPRINT_VERSION,
    )
    const archiveExpansion = createActiveMockExam(
      "archive-expansion-replay",
      start,
      FULL_MOCK_DURATION_SECONDS,
      ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION,
    )
    const archiveExpansionBlueprint = buildGeneratedMockBlueprint(
      archiveExpansion.seed,
      ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION,
    )

    expect(isReplayableMockExam(legacy)).toBe(true)
    expect(legacy.blueprintVersion).toBe(1)
    expect(generateMockPartQuestion(legacyBlueprint.tasks[0]!.parts[0]!).generation).toBeUndefined()
    expect(isReplayableMockExam(fixedBand)).toBe(true)
    expect(fixedBand.blueprintVersion).toBe(2)
    expect(fixedBandBlueprint.tasks.every((task) => task.parts.every((part) => (
      part.generation?.version === 2
    )))).toBe(true)
    expect(isReplayableMockExam(variableBand)).toBe(true)
    expect(variableBand.blueprintVersion).toBe(3)
    expect(variableBandBlueprint.tasks.every((task) => task.parts.every((part) => (
      part.generation?.version === 3
    )))).toBe(true)
    expect(isReplayableMockExam(fullOrientation)).toBe(true)
    expect(fullOrientation.blueprintVersion).toBe(4)
    expect(fullOrientationBlueprint.tasks.every((task) => task.parts.every((part) => (
      part.generation?.version === 4
    )))).toBe(true)
    expect(isReplayableMockExam(archiveExpansion)).toBe(true)
    expect(archiveExpansion.blueprintVersion).toBe(5)
    expect(archiveExpansionBlueprint.tasks.every((task) => task.parts.every((part) => (
      part.generation?.version === 5
    )))).toBe(true)
    expect(current.blueprintVersion).toBe(6)
    expect(currentBlueprint.tasks.every((task) => task.parts.every((part) => (
      part.generation?.version === 6 &&
      part.generation?.difficultyBand === "exam" &&
      generateMockPartQuestion(part).generation?.difficultyBand === "exam"
    )))).toBe(true)
  })

  it("keeps v5 mock coverage replayable and brings every v6 gap into new mocks", () => {
    const v5Families = new Set<string>()
    const currentFamilies = new Set<string>()
    for (let index = 0; index < 120; index += 1) {
      const v5Blueprint = buildGeneratedMockBlueprint(
        `archive-expansion-mock:${index}`,
        ARCHIVE_EXPANSION_MOCK_BLUEPRINT_VERSION,
      )
      for (const part of v5Blueprint.tasks.flatMap((task) => task.parts)) {
        const provenance = generateMockPartQuestion(part).provenance
        if (provenance) v5Families.add(provenance.familyId)
      }
      const currentBlueprint = buildGeneratedMockBlueprint(`archive-coverage-mock:${index}`)
      for (const part of currentBlueprint.tasks.flatMap((task) => task.parts)) {
        const provenance = generateMockPartQuestion(part).provenance
        if (provenance) currentFamilies.add(provenance.familyId)
      }
    }

    expect(v5Families).toEqual(new Set([
      "archive-v5-efficient-compensation",
      "archive-v5-travel-timing",
      "archive-v5-duration-price-table",
      "archive-v5-repeated-digit-filter",
      "archive-v5-cuboid-missing-edge",
    ]))
    for (const familyId of [
      "archive-v6-relational-systems",
      "archive-v6-voxel-solids",
      "archive-v6-recurring-cycles",
      "archive-v6-number-walls",
      "archive-v6-number-line",
    ]) {
      expect(currentFamilies).toContain(familyId)
    }
  }, 30_000)

  it("uses an absolute deadline that survives reload and reaches zero", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveMockExam("deadline", start)

    expect(remainingMockSeconds(exam, start)).toBe(3_600)
    expect(remainingMockSeconds(exam, new Date("2026-07-14T12:59:59.200Z"))).toBe(1)
    expect(isMockExpired(exam, new Date("2026-07-14T13:00:00.000Z"))).toBe(true)
    expect(isReplayableMockExam(exam)).toBe(true)

    const damaged = structuredClone(exam)
    damaged.progress[0]!.parts[0]!.partId = "different-template-part"
    expect(isReplayableMockExam(damaged)).toBe(false)
  })

  it("separates certainly graded points from written methods awaiting review", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveMockExam("grading", start)
    const blueprint = buildGeneratedMockBlueprint(exam.seed)

    blueprint.tasks.forEach((task, taskIndex) => {
      task.parts.forEach((part, partIndex) => {
        const question = generateMockPartQuestion(part)
        const draft = exam.progress[taskIndex]!.parts[partIndex]!
        draft.answer = correctAnswer(question)
        draft.working = mockPartRequiresMethod(question) ? "Nachvollziehbarer Rechenweg" : ""
      })
    })

    const result = gradeMockExam(exam, "submitted", new Date("2026-07-14T12:45:00.000Z"))
    expect(result.taskResults.flatMap((task) => task.parts).filter((part) => !part.answerCorrect).map((part) => part.topicId)).toEqual([])
    expect(result.maxPoints).toBe(36)
    expect(result.certainPoints + result.reviewablePoints).toBe(36)
    expect(result.certainPoints).toBeGreaterThan(0)
    expect(result.reviewablePoints).toBeGreaterThan(0)
    expect(result.recoveryTopicIds).toEqual([])
    expect(result.durationSeconds).toBe(45 * 60)
  })

  it("does not silently award method points when only the final number is present", () => {
    const exam = createActiveMockExam("missing-method", new Date("2026-07-14T12:00:00.000Z"))
    const blueprint = buildGeneratedMockBlueprint(exam.seed)
    const target = blueprint.tasks
      .flatMap((task, taskIndex) => task.parts.map((part, partIndex) => ({ taskIndex, partIndex, part })))
      .find(({ part }) => mockPartRequiresMethod(generateMockPartQuestion(part)))!
    blueprint.tasks.forEach((task, taskIndex) => task.parts.forEach((part, partIndex) => {
      const question = generateMockPartQuestion(part)
      const draft = exam.progress[taskIndex]!.parts[partIndex]!
      draft.answer = correctAnswer(question)
      draft.working = mockPartRequiresMethod(question) ? "Nachvollziehbarer Rechenweg" : ""
    }))
    exam.progress[target.taskIndex]!.parts[target.partIndex]!.working = ""

    const result = gradeMockExam(exam, "submitted", new Date("2026-07-14T12:10:00.000Z"))
    const part = result.taskResults[target.taskIndex]!.parts[target.partIndex]!
    expect(part.answerCorrect).toBe(true)
    expect(part.certainPoints).toBe(0)
    expect(part.reviewablePoints).toBe(0)
    expect(result.recoveryTopicIds).toContain(target.part.topicId)
  })

  it("adds mock misses to adaptive review evidence without adding XP", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveMockExam("adaptation", start)
    const result = gradeMockExam(exam, "timeout", new Date("2026-07-14T13:00:00.000Z"))
    const learner = createInitialLearner(start)
    const missedTopic = result.taskResults[0]!.parts[0]!.topicId
    learner.mastery[missedTopic].status = "mastered"
    learner.mastery[missedTopic].supportedMastery = 0.8
    learner.mastery[missedTopic].independentMastery = 0.7
    learner.mastery[missedTopic].retention = 0.7
    learner.mastery[missedTopic].reviewStage = 2
    learner.totalXp = 80

    const next = recordMockExamResult(learner, result)
    expect(next.mockHistory).toHaveLength(1)
    expect(next.mastery[missedTopic].dueAt).toBe(result.submittedAt)
    expect(next.mastery[missedTopic].retention).toBeLessThan(0.7)
    expect(next.mastery[missedTopic].supportedMastery).toBeLessThan(0.8)
    expect(next.mastery[missedTopic].independentMastery).toBeLessThan(0.7)
    expect(next.totalXp).toBe(80)
    expect(recordMockExamResult(next, result)).toBe(next)
  })
})
