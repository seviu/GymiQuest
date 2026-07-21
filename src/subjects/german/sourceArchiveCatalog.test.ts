import { describe, expect, it } from "vitest"
import {
  findGermanSourceArchiveDocumentByHash,
  germanSourceArchiveCatalog,
  germanSourceArchiveDocumentKinds,
  germanSourceArchiveEditions,
} from "./sourceArchiveCatalog"

describe("German source archive catalog", () => {
  it("registers four unique source-only documents for each supplied year", () => {
    expect(germanSourceArchiveEditions.map((edition) => edition.year)).toEqual([2025, 2024])
    const hashes = new Set<string>()
    for (const edition of germanSourceArchiveEditions) {
      expect(edition.mode).toBe("source-only")
      expect(edition.languageExamDurationSeconds).toBe(45 * 60)
      expect(edition.writingDurationSeconds).toBe(60 * 60)
      expect(Object.keys(edition.documents).sort()).toEqual([...germanSourceArchiveDocumentKinds].sort())
      for (const kind of germanSourceArchiveDocumentKinds) {
        const definition = edition.documents[kind]
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
    expect(hashes.size).toBe(8)
  })

  it("pins the observed page counts of all supplied PDFs", () => {
    expect(germanSourceArchiveCatalog["zap-zh-lg-german-2024"].documents).toMatchObject({
      "language-exam": { pageCount: 24 },
      solutions: { pageCount: 28 },
      "text-sheet": { pageCount: 1 },
      "essay-prompts": { pageCount: 1 },
    })
    expect(germanSourceArchiveCatalog["zap-zh-lg-german-2025"].documents).toMatchObject({
      "language-exam": { pageCount: 14 },
      solutions: { pageCount: 16 },
      "text-sheet": { pageCount: 1 },
      "essay-prompts": { pageCount: 2 },
    })
  })
})
