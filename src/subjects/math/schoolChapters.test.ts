import { describe, expect, it } from "vitest"
import { topicIds } from "../../domain/model"
import { schoolAreaTitles, schoolThemes, type SchoolAreaId } from "./schoolChapters"

describe("school catalog (Mathematik 6 Primarstufe, Kanton Zürich)", () => {
  it("lists all 36 canonical themes in Jahresplanung order", () => {
    expect(schoolThemes.map((theme) => theme.number)).toEqual(
      Array.from({ length: 36 }, (_, index) => index + 1),
    )
    expect(schoolThemes[0].title).toBe("Brüche")
    expect(schoolThemes.at(-1)!.title).toBe("Regeln und Strategien")
  })

  it("maps only valid topics, each at most once", () => {
    const valid = new Set<string>(topicIds)
    const placed = schoolThemes.flatMap((theme) => theme.topicIds)
    expect(placed.every((topicId) => valid.has(topicId))).toBe(true)
    expect(new Set(placed).size).toBe(placed.length)
  })

  it("exposes uncovered themes as gaps instead of dropping them", () => {
    const gaps = schoolThemes.filter((theme) => theme.topicIds.length === 0)
    expect(gaps.length).toBeGreaterThan(0)
    // Anchors: probability and percent have no generator today and must stay visible.
    expect(schoolThemes.find((theme) => theme.title === "Prozente")!.topicIds).toEqual([])
    expect(schoolThemes.find((theme) => theme.title === "Zufall und Wahrscheinlichkeit")!.topicIds).toEqual([])
  })

  it("anchors textbook alignment for covered themes", () => {
    const byTitle = new Map(schoolThemes.map((theme) => [theme.title, theme.topicIds]))
    expect(byTitle.get("Umgekehrte Proportionalität")).toEqual(["inverse-proportion"])
    expect(byTitle.get("Kombinatorik")).toEqual(["integer-combinations"])
    expect(byTitle.get("Flexibel rechnen")).toEqual(["efficient-arithmetic"])
  })

  it("keeps every theme in a known Bereich", () => {
    const areaIds = new Set<SchoolAreaId>(Object.keys(schoolAreaTitles) as SchoolAreaId[])
    expect(schoolThemes.every((theme) => areaIds.has(theme.area))).toBe(true)
  })
})
