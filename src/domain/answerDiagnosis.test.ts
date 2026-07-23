import { describe, expect, it } from "vitest"
import { diagnoseWrongAnswer } from "./answerDiagnosis"
import { generateQuestion, isCorrectAnswer } from "./generators"
import { topicIds, type GeneratedQuestion } from "./model"

describe("wrong-answer diagnosis", () => {
  it("does not diagnose a correct response", () => {
    const question = generateQuestion("mass-units", "diagnosis:correct")
    if (question.response.kind !== "number") throw new Error("Expected number response")
    expect(diagnoseWrongAnswer(question, String(question.response.value))).toBeUndefined()
  })

  it("recognizes a reversed kg/g conversion", () => {
    const question = generateQuestion("mass-units", "diagnosis:units")
    if (question.response.kind !== "number") throw new Error("Expected number response")
    const wrong = String(question.response.value * 1000)
    expect(isCorrectAnswer(question, wrong)).toBe(false)
    expect(diagnoseWrongAnswer(question, wrong)).toMatchObject({
      kind: "unit-conversion",
      title: "Die 1000er-Richtung ist vertauscht.",
    })
  })

  it("distinguishes an equivalent but unsimplified fraction", () => {
    const question: GeneratedQuestion = {
      id: "diagnosis:fraction",
      topicId: "area-fractions",
      prompt: "Welcher Anteil ist bedeckt?",
      answerLabel: "Anteil",
      response: {
        kind: "fraction",
        numerator: 3,
        denominator: 4,
        requireSimplified: true,
      },
      hint: "Zähle die Flächen.",
      easierExplanation: "Drei von vier.",
      explanation: "3/4",
      workedSteps: ["3/4"],
    }

    expect(diagnoseWrongAnswer(question, "6/8")).toMatchObject({
      kind: "fraction-structure",
      title: "Der Wert stimmt – kürze den Bruch noch.",
      nextStep: "Teile Zähler und Nenner durch 2.",
    })
    expect(diagnoseWrongAnswer(question, "4/3")).toMatchObject({
      kind: "fraction-structure",
      title: "Zähler und Nenner sind vertauscht.",
    })
    expect(diagnoseWrongAnswer(question, "3/0")).toMatchObject({
      kind: "fraction-structure",
      title: "Ein Nenner darf nicht null sein.",
    })
  })

  it("explains input format without treating it as a mathematical misconception", () => {
    const question = generateQuestion("fraction-of-quantity", "diagnosis:format")
    expect(diagnoseWrongAnswer(question, "zwölf kg")).toMatchObject({
      kind: "format",
      title: "Diese Eingabe ist noch keine Zahl.",
    })
  })

  it("keeps duplicate sets and incomplete paths as gradeable learning misses", () => {
    const setQuestion = generateQuestion("number-constraints", "format:integer-set")
    if (setQuestion.response.kind !== "integer-set") throw new Error("Expected integer-set response")
    const duplicated = [
      setQuestion.response.values[0],
      setQuestion.response.values[0],
    ].join(", ")
    expect(diagnoseWrongAnswer(setQuestion, duplicated)).toMatchObject({
      kind: "incomplete-enumeration",
      title: "Eine Zahl steht doppelt in der Liste.",
    })
    expect(diagnoseWrongAnswer(setQuestion, "1234 und 1324")).toMatchObject({
      kind: "format",
    })

    const sequenceValues = [2, 3, 1, 4]
    const sequenceQuestion: GeneratedQuestion = {
      id: "format:integer-sequence",
      topicId: "spatial-rolling",
      prompt: "Welche Flächen liegen nach jedem Kipp-Schritt unten?",
      answerLabel: "Flächenfolge",
      response: {
        kind: "integer-sequence",
        values: sequenceValues,
      },
      hint: "Verfolge jeden Kipp-Schritt.",
      easierExplanation: "Notiere nach jedem Pfeil eine Fläche.",
      explanation: "2, 3, 1, 4",
      workedSteps: ["2", "3", "1", "4"],
    }
    expect(diagnoseWrongAnswer(
      sequenceQuestion,
      sequenceValues.slice(0, -1).join(", "),
    )).toMatchObject({
      kind: "stopped-early",
    })
    expect(diagnoseWrongAnswer(sequenceQuestion, "1, zwei, 3")).toMatchObject({
      kind: "format",
    })
  })

  it("returns concise topic guidance for every 2025 family", () => {
    for (const topicId of topicIds) {
      const question = generateQuestion(topicId, `diagnosis:${topicId}`)
      let wrongAnswer: string
      if (question.response.kind === "number") {
        wrongAnswer = String(question.response.value + 12345)
      } else if (question.response.kind === "fraction") {
        wrongAnswer = "999/997"
      } else if (question.response.kind === "choice") {
        const correctChoice = question.response.value
        wrongAnswer = question.response.options.find(
          (option) => option.id !== correctChoice,
        )?.id ?? "not-an-option"
      } else if (question.response.kind === "integer-set") {
        wrongAnswer = question.response.values.slice(0, 1).join(",")
      } else if (question.response.kind === "integer-sequence") {
        wrongAnswer = [...question.response.values].reverse().join(",")
      } else {
        wrongAnswer = `${question.response.x + 99}|${question.response.y - 99}`
      }
      expect(isCorrectAnswer(question, wrongAnswer), topicId).toBe(false)
      const diagnosis = diagnoseWrongAnswer(question, wrongAnswer)
      expect(diagnosis?.title.length, topicId).toBeGreaterThan(10)
      expect(diagnosis?.message.length, topicId).toBeGreaterThan(20)
      expect(diagnosis?.nextStep.length, topicId).toBeGreaterThan(20)
    }
  })
})
