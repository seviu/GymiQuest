import { describe, expect, it } from "vitest"
import {
  createInitialLearner,
  migrateLearnerState,
  recordMockExamResult,
  recordOfficialMockReview,
} from "./learningEngine"
import { isReplayableMockExam } from "./mockExam"
import {
  completeOfficialExam2025Review,
  createActiveOfficialExam2025,
  encodeOfficialFaceLabels,
  gradeOfficialExam2025,
  officialExam2025Blueprint,
  scoreOfficial2025CoinRows,
} from "./officialExam2025"

function fillCorrectStructuredAnswers(exam: ReturnType<typeof createActiveOfficialExam2025>): void {
  officialExam2025Blueprint.tasks.forEach((task, taskIndex) => {
    task.parts.forEach((part, partIndex) => {
      const draft = exam.progress[taskIndex]!.parts[partIndex]!
      switch (part.response.kind) {
        case "number":
          draft.answer = String(part.response.value)
          break
        case "fraction":
          draft.answer = `${part.response.numerator}/${part.response.denominator}`
          break
        case "tuple-set":
          draft.answer = part.response.expected.join("\n")
          break
        case "face-labels":
          draft.answer = encodeOfficialFaceLabels(part.response.expected.map(String))
          break
        case "paper":
          draft.answer = "completed-on-paper"
          break
      }
      if (part.methodRequired) draft.working = "Rechenweg auf dem Aufgabenblatt"
    })
  })
}

function gradeOnePart(
  taskIndex: number,
  partIndex: number,
  answer: string,
  milestoneAnswers: Record<string, string> = {},
) {
  const exam = createActiveOfficialExam2025(
    `golden:${taskIndex}:${partIndex}:${answer}`,
    new Date("2026-07-14T12:00:00.000Z"),
  )
  const draft = exam.progress[taskIndex]!.parts[partIndex]!
  draft.answer = answer
  draft.milestoneAnswers = milestoneAnswers
  return gradeOfficialExam2025(
    exam,
    "submitted",
    new Date("2026-07-14T12:45:00.000Z"),
  ).taskResults[taskIndex]!.parts[partIndex]!
}

describe("official 2025 replay", () => {
  it("registers the exact 9-task, 36-point, document-backed edition separately from generators", () => {
    expect(officialExam2025Blueprint).toMatchObject({
      kind: "official",
      editionId: "zap-zh-lg-2025",
      year: 2025,
      rubricVersion: "2025-v1.1",
      durationSeconds: 3_600,
      maxPoints: 36,
    })
    expect(officialExam2025Blueprint.tasks).toHaveLength(9)
    expect(officialExam2025Blueprint.tasks.map((task) => task.taskPage)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(officialExam2025Blueprint.tasks.reduce((sum, task) => sum + task.maxPoints, 0)).toBe(36)
    expect(officialExam2025Blueprint.tasks.flatMap((task) => task.parts).reduce((sum, part) => sum + part.maxPoints, 0)).toBe(36)
  })

  it("creates a replayable absolute-deadline session with the official source identity", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveOfficialExam2025("official-run:1", start)

    expect(exam).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2025",
      startedAt: start.toISOString(),
      deadlineAt: "2026-07-14T13:00:00.000Z",
    })
    expect(exam.progress).toHaveLength(9)
    expect(exam.progress.map((task) => task.parts.length)).toEqual([2, 3, 1, 3, 1, 2, 1, 2, 1])
    expect(isReplayableMockExam(exam)).toBe(true)

    exam.progress[2]!.parts[0]!.partId = "damaged"
    expect(isReplayableMockExam(exam)).toBe(false)
  })

  it("implements the task-3 matrix, addendum special case, and zero-row penalty", () => {
    const all = "1,1,9\n1,2,7\n1,3,5\n1,4,3\n1,5,1\n2,1,4\n2,2,2"
    expect(scoreOfficial2025CoinRows(all)).toMatchObject({ points: 4, correctRows: 7, falseRows: 0 })
    expect(scoreOfficial2025CoinRows(`${all}\n3,1,1`).points).toBe(3)
    expect(scoreOfficial2025CoinRows("1,1,9\n1,2,7\n1,3,5\n1,4,3\n1,5,1\n2,1,4").points).toBe(3)
    expect(scoreOfficial2025CoinRows("1,1,9\n1,2,7\n1,3,5\n1,4,3").points).toBe(1)

    const special = scoreOfficial2025CoinRows("1,1,9\n1,2,7\n1,3,5\n1,4,3\n1,5,1\n2,1,4\n2,2,3")
    expect(special).toMatchObject({ points: 3, correctRows: 6, falseRows: 1, specialCaseApplied: true })

    const zeroPenalty = scoreOfficial2025CoinRows(`${all}\n1,0,11`)
    expect(zeroPenalty).toMatchObject({ points: 2, zeroPenaltyApplied: true })
  })

  it("keeps golden lower-bound cases aligned with every machine-supported 2025 rubric family", () => {
    expect(gradeOnePart(0, 0, "0", { "product-54351": "54351" }).certainPoints).toBe(1)
    expect(gradeOnePart(0, 0, "4941", { "quotient-61": "61" }).certainPoints).toBe(2)
    expect(gradeOnePart(0, 1, "3/7").certainPoints).toBe(1)
    expect(gradeOnePart(0, 1, "3 min", { "seventh-minutes-25": "25" }).certainPoints).toBe(1)
    expect(gradeOnePart(0, 1, "3", { "seventh-minutes-25": "25" }).certainPoints).toBe(2)
    expect(gradeOnePart(0, 1, "3", { "ratio-75-175": "75/175" }).certainPoints).toBe(2)

    expect(gradeOnePart(1, 0, "73").certainPoints).toBe(1)
    expect(gradeOnePart(1, 1, "91").certainPoints).toBe(0)
    expect(gradeOnePart(1, 2, "0", { "bundle-price-40": "40" }).certainPoints).toBe(1)
    expect(gradeOnePart(1, 2, "148", { "bundle-price-40": "40" }).certainPoints).toBe(2)

    expect(gradeOnePart(3, 0, "46/70").certainPoints).toBe(0)
    expect(gradeOnePart(3, 0, "23/35").certainPoints).toBe(1)
    expect(gradeOnePart(3, 1, "302", { "small-tiles-46": "46", "large-tiles-6": "6" }).certainPoints).toBe(1)
    expect(gradeOnePart(3, 2, "0", { "optimal-large-tiles-15": "15" }).certainPoints).toBe(1)
    expect(gradeOnePart(3, 2, "230", { "optimal-large-tiles-15": "15" }).certainPoints).toBe(2)

    expect(gradeOnePart(4, 0, "0", { "jar-mass-54": "54" }).certainPoints).toBe(1)
    expect(gradeOnePart(4, 0, "0", { "before-cooking-72": "72" }).certainPoints).toBe(2)
    expect(gradeOnePart(4, 0, "0", { "before-sorting-84": "84" }).certainPoints).toBe(3)
    expect(gradeOnePart(4, 0, "86.5", {
      "jar-mass-54": "54",
      "before-cooking-72": "72",
      "before-sorting-84": "84",
    }).certainPoints).toBe(4)

    expect(gradeOnePart(5, 0, "0", { "total-rations-960": "960" }).certainPoints).toBe(1)
    expect(gradeOnePart(5, 0, "8", { "thirty-people-days-32": "32" }).certainPoints).toBe(2)
    expect(gradeOnePart(5, 1, "0", { "remaining-rations-720": "720" }).certainPoints).toBe(1)
    expect(gradeOnePart(5, 1, "24", { "twenty-people-days-36": "36" }).certainPoints).toBe(2)

    expect(gradeOnePart(6, 0, "completed-on-paper").certainPoints).toBe(0)
    expect(gradeOnePart(7, 0, encodeOfficialFaceLabels(["2", "4"])).certainPoints).toBe(1)
    expect(gradeOnePart(7, 1, encodeOfficialFaceLabels(["4", "3", "2", "9"])).certainPoints).toBe(1)

    const allTuples = "1,1,9\n1,2,7\n1,3,5\n1,4,3\n1,5,1\n2,1,4\n2,2,2"
    expect(gradeOnePart(2, 0, allTuples).certainPoints).toBe(4)
    expect(gradeOnePart(7, 0, encodeOfficialFaceLabels(["2", "1"])).certainPoints).toBe(2)
    expect(gradeOnePart(7, 1, encodeOfficialFaceLabels(["4", "3", "2", "1"])).certainPoints).toBe(2)

    expect(gradeOnePart(8, 0, "0", {
      "block-length-15": "15",
      "block-width-6": "6",
    }).certainPoints).toBe(1)
    expect(gradeOnePart(8, 0, "0", { "block-height-4": "4" }).certainPoints).toBe(2)
    expect(gradeOnePart(8, 0, "0", { "alternative-side-face": "240" }).certainPoints).toBe(2)
    expect(gradeOnePart(8, 0, "0", { "surface-pair": "180" }).certainPoints).toBe(2)
    expect(gradeOnePart(8, 0, "288").certainPoints).toBe(3)
    expect(gradeOnePart(8, 0, "576", {
      "block-length-15": "15",
      "block-width-6": "6",
      "block-height-4": "4",
      "end-face": "48",
      "side-face": "60",
      "base-face": "180",
    }).certainPoints).toBe(4)
    expect(gradeOnePart(8, 0, "576", {
      "block-length-15": "15",
      "block-width-6": "6",
      "block-height-4": "4",
      "base-face": "180",
    }).certainPoints).toBe(2)
  })

  it("lets a single tuple typo change the machine-certain task-3 score", () => {
    const all = "1,1,9\n1,2,7\n1,3,5\n1,4,3\n1,5,1\n2,1,4\n2,2,2"
    expect(scoreOfficial2025CoinRows(all)).toMatchObject({ points: 4, correctRows: 7, falseRows: 0 })
    // One tuple element flipped (1,1,9 → 1,6,9): the sole false row shares no
    // leading pair with a published combination, so no addendum special case.
    const typo = all.replace("1,1,9", "1,6,9")
    expect(scoreOfficial2025CoinRows(typo)).toMatchObject({
      points: 2,
      correctRows: 6,
      falseRows: 1,
      specialCaseApplied: false,
    })
    expect(gradeOnePart(2, 0, typo).certainPoints).toBe(2)
  })

  it("lets a single face-label typo change the machine-certain task-8 score", () => {
    expect(gradeOnePart(7, 0, encodeOfficialFaceLabels(["2", "1"])).certainPoints).toBe(2)
    expect(gradeOnePart(7, 0, encodeOfficialFaceLabels(["2", "9"])).certainPoints).toBe(1)

    expect(gradeOnePart(7, 1, encodeOfficialFaceLabels(["4", "3", "2", "1"])).certainPoints).toBe(2)
    expect(gradeOnePart(7, 1, encodeOfficialFaceLabels(["4", "3", "2", "9"])).certainPoints).toBe(1)
  })

  it("prechecks only structured evidence and leaves written or geometric points for correction", () => {
    const exam = createActiveOfficialExam2025("official-grading", new Date("2026-07-14T12:00:00.000Z"))
    fillCorrectStructuredAnswers(exam)

    const result = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:51:00.000Z"))
    expect(result).toMatchObject({
      source: "official-archive",
      editionId: "zap-zh-lg-2025",
      rubricVersion: "2025-v1.1",
      maxPoints: 36,
      certainPoints: 10,
      reviewablePoints: 26,
      durationSeconds: 51 * 60,
    })
    expect(result.officialReview).toMatchObject({ status: "pending" })
    expect(result.officialReview?.taskScores).toEqual(Array.from({ length: 9 }, () => null))
    expect(result.taskResults[2]!.certainPoints).toBe(4)
    expect(result.taskResults[6]!.certainPoints).toBe(0)
    expect(result.taskResults[7]!.certainPoints).toBe(4)
  })

  it("awards only documented safe milestone credit before the human correction", () => {
    const exam = createActiveOfficialExam2025("official-milestones", new Date("2026-07-14T12:00:00.000Z"))
    const setPart = (
      taskIndex: number,
      partIndex: number,
      answer: string,
      milestoneAnswers: Record<string, string>,
    ) => {
      const draft = exam.progress[taskIndex]!.parts[partIndex]!
      draft.answer = answer
      draft.milestoneAnswers = milestoneAnswers
    }

    setPart(0, 0, "4941", { "quotient-61": "61" })
    setPart(0, 1, "3", { "seventh-minutes-25": "25" })
    setPart(1, 2, "0", { "bundle-price-40": "40" })
    setPart(3, 2, "999", { "optimal-large-tiles-15": "15" })
    setPart(4, 0, "86.5", {
      "jar-mass-54": "54",
      "before-cooking-72": "72",
      "before-sorting-84": "84",
    })
    setPart(5, 0, "8", { "total-rations-960": "960" })
    setPart(5, 1, "0", { "remaining-rations-720": "720" })
    setPart(8, 0, "288", {})

    const result = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:50:00.000Z"))
    expect(result.taskResults.map((task) => task.certainPoints)).toEqual([4, 1, 0, 1, 4, 3, 0, 0, 3])
    expect(result.certainPoints).toBe(16)
    expect(result.taskResults[8]!.parts[0]).toMatchObject({
      answerCorrect: false,
      certainPoints: 3,
      confidence: "manual",
    })
    const belowSafeFloor = result.taskResults.map((task) => task.certainPoints)
    belowSafeFloor[0] = 3
    expect(() => completeOfficialExam2025Review(result, belowSafeFloor)).toThrow(
      "official review is incomplete or invalid",
    )

    setPart(0, 1, "3 min", { "seventh-minutes-25": "25" })
    const unitResult = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:51:00.000Z"))
    expect(unitResult.taskResults[0]!.parts[1]!.certainPoints).toBe(1)

    setPart(0, 1, "3/7", {})
    const fractionResult = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:52:00.000Z"))
    expect(fractionResult.taskResults[0]!.parts[1]).toMatchObject({
      answerCorrect: false,
      certainPoints: 1,
    })
  })

  it("implements the v1.1 follow-through floors for tasks 5 and 6b", () => {
    const exam = createActiveOfficialExam2025("official-follow-through", new Date("2026-07-14T12:00:00.000Z"))
    const draft = exam.progress[4]!.parts[0]!
    const beforeCooking = 80
    const beforeSorting = beforeCooking * 7 / 6
    draft.milestoneAnswers = {
      "jar-mass-54": "60",
      "before-cooking-72": String(beforeCooking),
      "before-sorting-84": String(beforeSorting),
    }
    draft.answer = String(beforeSorting + 2.5)

    const result = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:50:00.000Z"))
    expect(result.taskResults[4]!.parts[0]).toMatchObject({
      answerCorrect: false,
      certainPoints: 2,
      earnedMilestoneIds: ["follow-through-v1.1"],
    })

    const taskSix = exam.progress[5]!
    taskSix.parts[0]!.milestoneAnswers = { "total-rations-960": "900" }
    taskSix.parts[1]!.milestoneAnswers = { "remaining-rations-720": "660" }
    taskSix.parts[1]!.answer = "22"
    const taskSixResult = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:51:00.000Z"))
    expect(taskSixResult.taskResults[5]!.parts[1]).toMatchObject({
      answerCorrect: false,
      certainPoints: 2,
      earnedMilestoneIds: ["follow-through-from-6a-v1.1"],
    })

    taskSix.parts[1]!.milestoneAnswers = {
      "remaining-rations-720": "660",
      "follow-through-division": "660 : 30 = 23",
    }
    taskSix.parts[1]!.answer = "23"
    const oneErrorResult = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:52:00.000Z"))
    expect(oneErrorResult.taskResults[5]!.parts[1]).toMatchObject({
      answerCorrect: false,
      certainPoints: 1,
      earnedMilestoneIds: ["follow-through-one-error-v1.1"],
    })

    taskSix.parts[1]!.milestoneAnswers["follow-through-division"] = "660 : 20 = 23"
    const wrongMethodResult = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:53:00.000Z"))
    expect(wrongMethodResult.taskResults[5]!.parts[1]!.certainPoints).toBe(0)
  })

  it("proves published arithmetic paths and exactly one propagated calculation error without reading prose", () => {
    expect(gradeOnePart(0, 0, "4941", {
      "calculation-path": "671 : 11 = 61\n61 · 81 = 4941",
    })).toMatchObject({
      certainPoints: 2,
      earnedMilestoneIds: ["calculation-path-exact"],
    })
    expect(gradeOnePart(0, 0, "4940", {
      "calculation-path": "671 · 81 = 54340\n54340 : 11 = 4940",
    })).toMatchObject({
      certainPoints: 1,
      earnedMilestoneIds: ["calculation-path-one-error"],
    })

    expect(gradeOnePart(0, 1, "4", {
      "calculation-path": "7 · 75 = 700\n700 : 175 = 4",
    }).certainPoints).toBe(1)
    expect(gradeOnePart(0, 1, "3 min", {
      "calculation-path": "7 · 75 = 525\n525 : 175 = 3",
    })).toMatchObject({
      certainPoints: 1,
      earnedMilestoneIds: ["calculation-path-unit"],
    })

    expect(gradeOnePart(1, 1, "91", {
      "calculation-path": "1092 : 12 = 91",
    }).certainPoints).toBe(1)
    expect(gradeOnePart(1, 2, "148", {
      "calculation-path": "4052 - 1092 = 2960\n9 + 11 = 20\n2960 : 20 = 148",
    }).certainPoints).toBe(2)
    expect(gradeOnePart(1, 2, "150", {
      "calculation-path": "4052 - 1092 = 3000\n9 + 11 = 20\n3000 : 20 = 150",
    }).certainPoints).toBe(1)

    expect(gradeOnePart(3, 1, "302", {
      "calculation-path": "46 · 5 = 230\n6 · 12 = 72\n230 + 72 = 302",
    }).certainPoints).toBe(1)
    expect(gradeOnePart(3, 1, "292", {
      "calculation-path": "46 · 5 = 220\n6 · 12 = 72\n220 + 72 = 292",
    }).certainPoints).toBe(0)
    expect(gradeOnePart(3, 1, "302 kg", {
      "calculation-path": "46 · 5 = 230\n6 · 12 = 72\n230 + 72 = 302",
    }).certainPoints).toBe(0)
    expect(gradeOnePart(3, 2, "230", {
      "calculation-path": "15 · 12 = 180\n10 · 5 = 50\n180 + 50 = 230",
    }).certainPoints).toBe(2)
    expect(gradeOnePart(3, 2, "220", {
      "calculation-path": "15 · 12 = 170\n10 · 5 = 50\n170 + 50 = 220",
    })).toMatchObject({
      certainPoints: 1,
      earnedMilestoneIds: ["calculation-path-one-error"],
    })
    expect(gradeOnePart(3, 2, "230 kg", {
      "calculation-path": "15 · 12 = 180\n10 · 5 = 50\n180 + 50 = 230",
    })).toMatchObject({
      certainPoints: 1,
      earnedMilestoneIds: ["calculation-path-unit"],
    })

    expect(gradeOnePart(4, 0, "86.5", {
      "calculation-path": "108 · 0,5 = 54\n54 : 3 = 18\n18 · 4 = 72\n72 : 6 = 12\n12 · 7 = 84\n84 + 2,5 = 86,5",
    }).certainPoints).toBe(4)
    expect(gradeOnePart(4, 0, "100.5", {
      "calculation-path": "108 · 0,5 = 63\n63 : 3 = 21\n21 · 4 = 84\n84 : 6 = 14\n14 · 7 = 98\n98 + 2,5 = 100,5",
    })).toMatchObject({
      certainPoints: 3,
      earnedMilestoneIds: ["calculation-path-one-error"],
    })
    expect(gradeOnePart(4, 0, "86.5 g", {
      "calculation-path": "108 · 0,5 = 54\n54 : 3 = 18\n18 · 4 = 72\n72 : 6 = 12\n12 · 7 = 84\n84 + 2,5 = 86,5",
    })).toMatchObject({
      certainPoints: 3,
      earnedMilestoneIds: ["calculation-path-unit"],
    })

    expect(gradeOnePart(5, 0, "6", {
      "calculation-path": "40 · 24 = 900\n900 : 30 = 30\n30 - 24 = 6",
    }).certainPoints).toBe(1)
    expect(gradeOnePart(5, 0, "8", {
      "calculation-path": "40 · 24 = 960\n960 : 30 = 32\n32 - 24 = 8",
    }).certainPoints).toBe(2)
    expect(gradeOnePart(5, 1, "22", {
      "calculation-path": "20 · 48 = 900\n20 · 12 = 240\n900 - 240 = 660\n660 : 30 = 22",
    }).certainPoints).toBe(1)
    expect(gradeOnePart(5, 1, "24", {
      "calculation-path": "20 · 48 = 960\n48 - 12 = 36\n36 · 20 = 720\n720 : 30 = 24",
    }).certainPoints).toBe(2)

    const exactSurfacePath = "15 · 6 = 90\n360 : 90 = 4\n4 · 15 = 60\n4 · 12 = 48\n12 · 15 = 180\n60 + 48 = 108\n108 + 180 = 288\n2 · 288 = 576"
    expect(gradeOnePart(8, 0, "576", { "calculation-path": exactSurfacePath }).certainPoints).toBe(4)
    expect(gradeOnePart(8, 0, "576 kg", { "calculation-path": exactSurfacePath })).toMatchObject({
      certainPoints: 3,
      earnedMilestoneIds: ["calculation-path-unit"],
    })
    const oneErrorSurfacePath = "15 · 6 = 100\n360 : 100 = 3,6\n3,6 · 15 = 54\n3,6 · 12 = 43,2\n12 · 15 = 180\n54 + 43,2 = 97,2\n97,2 + 180 = 277,2\n2 · 277,2 = 554,4"
    expect(gradeOnePart(8, 0, "554.4", { "calculation-path": oneErrorSurfacePath }).certainPoints).toBe(3)
    expect(gradeOnePart(8, 0, "554.4 kg", { "calculation-path": oneErrorSurfacePath }).certainPoints).toBe(2)
  })

  it("does not accept an attached wrong unit for a final-only point", () => {
    expect(gradeOnePart(1, 0, "73").certainPoints).toBe(1)
    expect(gradeOnePart(1, 0, "73 Fr.").certainPoints).toBe(1)
    expect(gradeOnePart(1, 0, "73 kg")).toMatchObject({
      answerCorrect: false,
      certainPoints: 0,
    })
    expect(gradeOnePart(4, 0, "86.5 g", {
      "jar-mass-54": "54",
      "before-cooking-72": "72",
      "before-sorting-84": "84",
    }).certainPoints).toBe(3)
    expect(gradeOnePart(5, 0, "8 kg", { "total-rations-960": "960" }).certainPoints).toBe(1)
    expect(gradeOnePart(8, 0, "576 kg", {
      "block-length-15": "15",
      "block-width-6": "6",
      "block-height-4": "4",
      "end-face": "48",
      "side-face": "60",
      "base-face": "180",
    }).certainPoints).toBe(3)
  })

  it("keeps wrong operations and broken calculation chains in human review", () => {
    expect(gradeOnePart(0, 0, "4941", {
      "calculation-path": "671 + 81 = 752\n752 : 11 = 4941",
    }).certainPoints).toBe(0)
    expect(gradeOnePart(1, 2, "148", {
      "calculation-path": "4052 - 1092 = 2960\n9 + 11 = 20\n3000 : 20 = 148",
    }).certainPoints).toBe(0)
    expect(gradeOnePart(3, 2, "230", {
      "calculation-path": "15 + 12 = 27\n10 · 5 = 50\n27 + 50 = 230",
    }).certainPoints).toBe(0)
  })

  it("freezes the nine corrected task scores and schedules recovery without inventing a grade or XP", () => {
    const start = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveOfficialExam2025("official-review", start)
    fillCorrectStructuredAnswers(exam)
    const pending = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:50:00.000Z"))
    const completed = completeOfficialExam2025Review(
      pending,
      [4, 3, 4, 2, 3, 4, 2, 4, 3],
      new Date("2026-07-14T13:10:00.000Z"),
    )

    expect(completed.certainPoints).toBe(29)
    expect(completed.reviewablePoints).toBe(0)
    expect(completed.officialReview).toMatchObject({
      status: "complete",
      completedAt: "2026-07-14T13:10:00.000Z",
      gradeScaleId: "zap-lg-2025-math-2025-03-14",
      mathematicsGrade: 5.5,
    })
    expect(completed).not.toHaveProperty("grade")

    const learner = createInitialLearner(start)
    learner.totalXp = 88
    learner.xpSinceAssessment = 47
    const pendingState = recordMockExamResult(learner, pending)
    expect(pendingState.totalXp).toBe(88)
    expect(pendingState.mockHistory).toHaveLength(1)

    const recoveryTopic = completed.recoveryTopicIds[0]!
    pendingState.mastery[recoveryTopic] = {
      ...pendingState.mastery[recoveryTopic],
      status: "mastered",
      supportedMastery: 0.8,
      independentMastery: 0.7,
      retention: 0.8,
      reviewStage: 3,
      reviewIteration: 2,
      dueAt: "2026-08-01T00:00:00.000Z",
      masteredAt: start.toISOString(),
    }
    const reviewedState = recordOfficialMockReview(pendingState, completed)
    expect(reviewedState.totalXp).toBe(88)
    expect(reviewedState.xpSinceAssessment).toBe(47)
    expect(reviewedState.mockHistory[0]?.officialReview?.status).toBe("complete")
    expect(reviewedState.mastery[recoveryTopic]).toMatchObject({
      supportedMastery: 0.768,
      independentMastery: 0.588,
      retention: 0.65,
      reviewStage: 2,
      reviewIteration: 3,
      dueAt: "2026-07-14T13:10:00.000Z",
    })

    const legacyWithoutScale = structuredClone(reviewedState)
    delete legacyWithoutScale.mockHistory[0]!.officialReview!.gradeScaleId
    delete legacyWithoutScale.mockHistory[0]!.officialReview!.mathematicsGrade
    expect(migrateLearnerState(legacyWithoutScale).mockHistory[0]?.officialReview).toMatchObject({
      gradeScaleId: "zap-lg-2025-math-2025-03-14",
      mathematicsGrade: 5.5,
    })
  })
})
