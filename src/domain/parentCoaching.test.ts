import { describe, expect, it } from "vitest"
import { topicIds } from "./model"
import {
  buildParentTopicCoaching,
  hasCompleteEnglishParentCoaching,
  hasCompleteItalianParentCoaching,
  hasCompleteSpanishParentCoaching,
} from "./parentCoaching"

describe("parent coaching language", () => {
  it("provides authored English coaching for every dynamic topic", () => {
    expect(hasCompleteEnglishParentCoaching()).toBe(true)

    for (const topicId of topicIds) {
      const copy = buildParentTopicCoaching(topicId, "en")
      expect(copy.workedSteps.length).toBeGreaterThanOrEqual(2)
      expect(copy.teachBackPrompt).toContain("What would you do first")
    }
  })

  it("provides authored Italian coaching and translated prerequisites for every topic", () => {
    expect(hasCompleteItalianParentCoaching()).toBe(true)

    for (const topicId of topicIds) {
      const copy = buildParentTopicCoaching(topicId, "it")
      expect(copy.workedSteps.length).toBeGreaterThanOrEqual(2)
      expect(copy.teachBackPrompt).toContain("Che cosa faresti per prima cosa")
      expect(copy.title.trim()).not.toBe("")
    }

    expect(buildParentTopicCoaching("tiling-costs", "it").prerequisiteTitles).toEqual([
      "Contare e semplificare frazioni di area",
      "Collegare prezzi, quantità e ricavi",
    ])
  })

  it("provides authored Spanish coaching and translated prerequisites for every topic", () => {
    expect(hasCompleteSpanishParentCoaching()).toBe(true)

    for (const topicId of topicIds) {
      const copy = buildParentTopicCoaching(topicId, "es")
      expect(copy.workedSteps.length).toBeGreaterThanOrEqual(2)
      expect(copy.teachBackPrompt).toContain("¿Qué harías primero")
      expect(copy.title.trim()).not.toBe("")
    }

    expect(buildParentTopicCoaching("tiling-costs", "es").prerequisiteTitles).toEqual([
      "Contar y simplificar fracciones de área",
      "Relacionar precios, cantidades e ingresos",
    ])
  })

  it("keeps the existing German lesson and diagnosis content as the default", () => {
    const copy = buildParentTopicCoaching("reverse-fractions", "de")

    expect(copy.title).toBe("Anteile rückwärts berechnen")
    expect(copy.goal).toContain("ursprüngliche Gesamtmenge")
    expect(copy.workedSteps).toContain("1 Teil ist 18 : 3 = 6 kg.")
    expect(copy.teachBackPrompt).toContain("Was würdest du als Erstes tun")
  })

  it("translates prerequisite titles for the English guide", () => {
    const copy = buildParentTopicCoaching("tiling-costs", "en")

    expect(copy.prerequisiteTitles).toEqual([
      "Count and simplify fractions of area",
      "Connect prices, quantities, and revenue",
    ])
  })
})
