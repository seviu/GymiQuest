import { describe, expect, it } from "vitest"
import { generateQuestion } from "../domain/generators"
import { topicIds, type GeneratedQuestion } from "../domain/model"
import {
  diagnoseWrongAnswerForLocale,
  localizeSupportIssue,
  topicGuidanceForLocale,
} from "./questionFeedback"

describe("German question feedback", () => {
  it("keeps a guided-step format retry focused on fixing the input", () => {
    const question = generateQuestion("reverse-chains", "feedback-de-format")
    const support = localizeSupportIssue({
      title: "Schritt 1 braucht eine Zahl.",
      message: "Schreibe nur die Zahl.",
      nextStep: "Führe den nächsten Rechenschritt aus.",
      stepNumber: 1,
    }, question, "de", "practice-format")

    expect(support).toMatchObject({
      title: "Schritt 1 braucht eine Zahl.",
      message: "Schreibe nur die Zahl.",
      nextStep: "Entferne Wörter und Einheiten und prüfe den Schritt nochmals.",
    })
  })
})

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

    const formatSupport = localizeSupportIssue({
      title: "",
      message: "",
      nextStep: "",
      stepNumber: 2,
    }, question, "it", "practice-format")
    expect(formatSupport?.title).toBe("Controlla l'inserimento nel passaggio 2.")
    expect(formatSupport?.message).toContain("soltanto il numero")
  })

  it("treats a zero fraction denominator as a mathematical structure error", () => {
    const question = generateQuestion("area-fractions", "feedback-it-zero-denominator", undefined, undefined, "it")
    if (question.response.kind !== "fraction") throw new Error("Expected a fraction response")

    expect(diagnoseWrongAnswerForLocale(question, "3/0", "it")).toMatchObject({
      kind: "fraction-structure",
      title: "Il denominatore non può essere zero.",
    })
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

    const formatSupport = localizeSupportIssue({
      title: "",
      message: "",
      nextStep: "",
      stepNumber: 2,
    }, question, "es", "practice-format")
    expect(formatSupport?.title).toBe("Comprueba la entrada del paso 2.")
    expect(formatSupport?.message).toContain("solo el número")

    const setQuestion = generateQuestion("number-constraints", "feedback-es-set", undefined, undefined, "es")
    if (setQuestion.response.kind !== "integer-set") throw new Error("Expected integer-set response")
    expect(diagnoseWrongAnswerForLocale(
      setQuestion,
      `${setQuestion.response.values[0]}, ${setQuestion.response.values[0]}`,
      "es",
    )).toMatchObject({
      kind: "incomplete-enumeration",
      title: "Un número aparece dos veces en la lista.",
    })

    const sequenceValues = [2, 3, 1, 4]
    const sequenceQuestion: GeneratedQuestion = {
      id: "feedback-es-sequence",
      topicId: "spatial-rolling",
      prompt: "¿Qué caras quedan abajo después de cada giro?",
      answerLabel: "Secuencia de caras",
      response: {
        kind: "integer-sequence",
        values: sequenceValues,
      },
      hint: "Sigue cada giro.",
      easierExplanation: "Anota una cara después de cada flecha.",
      explanation: "2, 3, 1, 4",
      workedSteps: ["2", "3", "1", "4"],
    }
    expect(diagnoseWrongAnswerForLocale(
      sequenceQuestion,
      sequenceValues.slice(0, -1).join(", "),
      "es",
    )).toMatchObject({
      kind: "stopped-early",
      title: `El recorrido necesita exactamente ${sequenceValues.length} caras.`,
    })
  })
})
