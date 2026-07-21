import { describe, expect, it } from "vitest"
import { generateQuestion } from "../domain/generators"
import { topicIds } from "../domain/model"
import {
  diagnoseWrongAnswerForLocale,
  localizeSupportIssue,
  topicGuidanceForLocale,
} from "./questionFeedback"

describe("Italian question feedback", () => {
  it("provides Italian concept guidance for every dynamic topic", () => {
    for (const topicId of topicIds) {
      const guidance = topicGuidanceForLocale(topicId, "it")
      expect([guidance.title, guidance.message, guidance.nextStep].every((value) => value.trim().length > 0), topicId).toBe(true)
      expect(`${guidance.title} ${guidance.message} ${guidance.nextStep}`, topicId).not.toMatch(/\b(?:Check|The|Your|Berechne|Bestimme|Schritt)\b/u)
    }
  })

  it("localizes format, conversion, and worked-step feedback rather than using English fallback", () => {
    const question = generateQuestion("mass-units", "feedback-it", "feedback-it", undefined, "it")
    expect(question.response.kind).toBe("number")
    if (question.response.kind !== "number") throw new Error("Expected a number response")

    const format = diagnoseWrongAnswerForLocale(question, "non è un numero", "it")
    expect(format).toMatchObject({
      kind: "format",
      title: "Questo inserimento non è ancora un numero.",
    })

    const conversion = diagnoseWrongAnswerForLocale(
      question,
      String(question.response.value * 1_000),
      "it",
    )
    expect(conversion?.kind).toBe("unit-conversion")
    expect(conversion?.title).toContain("conversione")

    const support = localizeSupportIssue({
      title: "",
      message: "",
      nextStep: "",
      stepNumber: 2,
    }, question, "it", "practice")
    expect(support?.title).toBe("Controlla il passaggio 2.")
    expect(support?.message).toContain("percorso di calcolo")
  })
})

describe("Spanish question feedback", () => {
  it("provides Spanish concept guidance for every dynamic topic", () => {
    for (const topicId of topicIds) {
      const guidance = topicGuidanceForLocale(topicId, "es")
      expect([guidance.title, guidance.message, guidance.nextStep].every((value) => value.trim().length > 0), topicId).toBe(true)
      expect(`${guidance.title} ${guidance.message} ${guidance.nextStep}`, topicId).not.toMatch(/\b(?:Check|The|Your|Berechne|Bestimme|Schritt|Controlla|Risposta)\b/u)
    }
  })

  it("localizes format, conversion, and worked-step feedback without a fallback", () => {
    const question = generateQuestion("mass-units", "feedback-es", "feedback-es", undefined, "es")
    expect(question.response.kind).toBe("number")
    if (question.response.kind !== "number") throw new Error("Expected a number response")

    const format = diagnoseWrongAnswerForLocale(question, "no es un número", "es")
    expect(format).toMatchObject({
      kind: "format",
      title: "Esta entrada todavía no es un número.",
    })

    const conversion = diagnoseWrongAnswerForLocale(
      question,
      String(question.response.value * 1_000),
      "es",
    )
    expect(conversion?.kind).toBe("unit-conversion")
    expect(conversion?.title).toContain("conversión")

    const support = localizeSupportIssue({
      title: "",
      message: "",
      nextStep: "",
      stepNumber: 2,
    }, question, "es", "practice")
    expect(support?.title).toBe("Comprueba el paso 2.")
    expect(support?.message).toContain("procedimiento de cálculo")
  })
})
