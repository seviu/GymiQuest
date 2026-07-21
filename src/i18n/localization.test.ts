import { describe, expect, it } from "vitest"
import {
  appCopy,
  appLocaleIds,
  appLocaleOptions,
  normalizeAppLocale,
  preferredAppLocale,
} from "./localization"
import { messageCatalog } from "./messages"

describe("localization", () => {
  it("keeps locale ids explicit and rejects unsupported persisted values", () => {
    expect(appLocaleIds).toEqual(["en", "it", "es", "de"])
    expect(normalizeAppLocale("en")).toBe("en")
    expect(normalizeAppLocale("it")).toBe("it")
    expect(normalizeAppLocale("es")).toBe("es")
    expect(normalizeAppLocale("de")).toBe("de")
    expect(normalizeAppLocale("fr")).toBeUndefined()
  })

  it("prefers an explicit device choice, then the browser language, then English", () => {
    expect(preferredAppLocale("de", ["en-US"])).toBe("de")
    expect(preferredAppLocale("it", ["de-CH"])).toBe("it")
    expect(preferredAppLocale("es", ["de-CH"])).toBe("es")
    expect(preferredAppLocale(undefined, ["it-CH", "de-CH"])).toBe("it")
    expect(preferredAppLocale(undefined, ["es-MX", "de-CH"])).toBe("es")
    expect(preferredAppLocale(undefined, ["de-CH", "en-GB"])).toBe("de")
    expect(preferredAppLocale(undefined, ["fr-CH"])).toBe("en")
  })

  it("provides complete English, Italian, Spanish, and German onboarding choice copy", () => {
    for (const locale of appLocaleIds) {
      const copy = appCopy(locale)
      expect(copy.language.label).not.toBe("")
      expect(Object.keys(copy.profile.practiceDayLabels)).toHaveLength(7)
      expect(Object.keys(copy.profile.helpStyleLabels)).toHaveLength(4)
      expect(Object.keys(copy.profile.visualModeLabels)).toHaveLength(3)
      expect(Object.keys(copy.profile.readingModeLabels)).toHaveLength(2)
      expect(Object.keys(copy.profile.geometrySideLabels)).toHaveLength(2)
    }
  })

  it("exposes native locale names and complete, distinct Italian and Spanish message catalogs", () => {
    expect(appLocaleOptions.map(({ id, nativeLabel }) => ({ id, nativeLabel }))).toEqual([
      { id: "en", nativeLabel: "English" },
      { id: "it", nativeLabel: "Italiano" },
      { id: "es", nativeLabel: "Español" },
      { id: "de", nativeLabel: "Deutsch" },
    ])

    const english = messageCatalog("en")
    const italian = messageCatalog("it")
    const spanish = messageCatalog("es")
    const german = messageCatalog("de")
    expect(Object.keys(italian)).toEqual(Object.keys(english))
    expect(Object.keys(spanish)).toEqual(Object.keys(english))
    expect(italian["home.plan.title"]).toBe("Il tuo piano di studio")
    expect(italian["home.plan.title"]).not.toBe(english["home.plan.title"])
    expect(italian["home.plan.title"]).not.toBe(german["home.plan.title"])
    expect(Object.values(italian).every((value) => value.trim().length > 0)).toBe(true)
    expect(spanish["home.plan.title"]).toBe("Tu plan de estudio")
    expect(spanish["home.plan.title"]).not.toBe(english["home.plan.title"])
    expect(spanish["home.plan.title"]).not.toBe(german["home.plan.title"])
    expect(Object.values(spanish).every((value) => value.trim().length > 0)).toBe(true)
  })

  it("keeps the exercise-report handoff provider-neutral in every locale", () => {
    const reportKeys = [
      "report.copyCodex",
      "report.copied",
      "report.downloaded",
      "report.stepsTitle",
      "report.stepCopy",
      "report.stepAttach",
    ] as const

    for (const locale of appLocaleIds) {
      const catalog = messageCatalog(locale)
      for (const key of reportKeys) {
        expect(catalog[key]).not.toMatch(/codex/iu)
      }
    }
  })
})
