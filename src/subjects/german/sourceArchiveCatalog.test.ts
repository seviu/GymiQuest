import { describe, expect, it } from "vitest"
import {
  findGermanSourceArchiveDocumentByHash,
  germanSourceArchiveCoreDocumentKinds,
  germanSourceArchiveDocumentCount,
  germanSourceArchiveDocumentKinds,
  germanSourceArchiveDocumentKindsForEdition,
  germanSourceArchiveEditions,
} from "./sourceArchiveCatalog"

describe("German source archive catalog", () => {
  it("registers every supplied 2015–2026 source by a unique content identity", () => {
    expect(germanSourceArchiveEditions.map((edition) => edition.year)).toEqual([
      2026,
      2025,
      2024,
      2023,
      2022,
      2021,
      2020,
      2019,
      2018,
      2017,
      2016,
      2015,
    ])
    const hashes = new Set<string>()
    for (const edition of germanSourceArchiveEditions) {
      expect(edition.mode).toBe("source-only")
      expect(edition.languageExamDurationSeconds).toBe(45 * 60)
      expect(edition.writingDurationSeconds).toBe(60 * 60)
      const documentKinds = germanSourceArchiveDocumentKindsForEdition(edition.editionId)
      expect(documentKinds).toEqual(expect.arrayContaining([...germanSourceArchiveCoreDocumentKinds]))
      expect(documentKinds.every((kind) => germanSourceArchiveDocumentKinds.includes(kind))).toBe(true)
      for (const kind of documentKinds) {
        const definition = edition.documents[kind]
        expect(definition).toBeDefined()
        if (!definition) throw new Error(`Missing ${edition.editionId}/${kind}`)
        expect(definition.kind).toBe(kind)
        expect(definition.pageCount).toBeGreaterThan(0)
        expect(definition.sha256).toMatch(/^[a-f0-9]{64}$/u)
        expect(hashes.has(definition.sha256)).toBe(false)
        hashes.add(definition.sha256)
        expect(findGermanSourceArchiveDocumentByHash(definition.sha256)).toEqual({
          edition,
          document: definition,
        })
      }
    }
    expect(germanSourceArchiveDocumentKindsForEdition("zap-zh-lg-german-2015")).toContain("essay-guidance")
    expect(germanSourceArchiveDocumentKindsForEdition("zap-zh-lg-german-2016")).not.toContain("essay-guidance")
    expect(germanSourceArchiveDocumentCount).toBe(49)
    expect(hashes.size).toBe(germanSourceArchiveDocumentCount)
  })

  it("pins the observed page counts of all supplied PDFs", () => {
    const pageCounts = Object.fromEntries(germanSourceArchiveEditions.map((edition) => [
      edition.year,
      Object.fromEntries(germanSourceArchiveDocumentKindsForEdition(edition.editionId).map((kind) => [
        kind,
        edition.documents[kind]?.pageCount,
      ])),
    ]))
    expect(pageCounts).toEqual({
      2015: {
        "language-exam": 11,
        solutions: 15,
        "text-sheet": 1,
        "essay-prompts": 3,
        "essay-guidance": 1,
      },
      2016: { "language-exam": 12, solutions: 16, "text-sheet": 1, "essay-prompts": 1 },
      2017: { "language-exam": 12, solutions: 13, "text-sheet": 1, "essay-prompts": 1 },
      2018: { "language-exam": 12, solutions: 14, "text-sheet": 1, "essay-prompts": 1 },
      2019: { "language-exam": 11, solutions: 12, "text-sheet": 1, "essay-prompts": 8 },
      2020: { "language-exam": 18, solutions: 16, "text-sheet": 1, "essay-prompts": 4 },
      2021: { "language-exam": 13, solutions: 15, "text-sheet": 1, "essay-prompts": 3 },
      2022: { "language-exam": 14, solutions: 15, "text-sheet": 1, "essay-prompts": 8 },
      2023: { "language-exam": 14, solutions: 16, "text-sheet": 1, "essay-prompts": 8 },
      2024: { "language-exam": 24, solutions: 28, "text-sheet": 1, "essay-prompts": 1 },
      2025: { "language-exam": 14, solutions: 16, "text-sheet": 1, "essay-prompts": 2 },
      2026: { "language-exam": 14, solutions: 16, "text-sheet": 1, "essay-prompts": 9 },
    })
  })

  it("keeps each official paper's task and point totals separate", () => {
    expect(Object.fromEntries(germanSourceArchiveEditions.map((edition) => [
      edition.year,
      [edition.languageExamTaskCount, edition.languageExamMaxPoints],
    ]))).toEqual({
      2015: [16, 46],
      2016: [16, 48],
      2017: [17, 50],
      2018: [15, 56],
      2019: [15, 50],
      2020: [15, 51],
      2021: [15, 48],
      2022: [15, 47],
      2023: [15, 51],
      2024: [15, 46],
      2025: [14, 48],
      2026: [16, 51],
    })
    expect(new Set(germanSourceArchiveEditions.map((edition) => (
      edition.languageExamDurationSeconds
    )))).toEqual(new Set([45 * 60]))
  })
})
