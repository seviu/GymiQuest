import { describe, expect, it, vi } from "vitest"
import {
  GermanSourceArchiveImportError,
  germanSourceArchiveDocumentId,
  groupGermanSourceArchiveRecords,
  hasCompleteGermanSourceArchiveEdition,
  inspectGermanSourceArchivePdfForEdition,
  isGermanSourceArchiveDocumentRecord,
} from "./germanSourceArchive"
import { germanSourceArchiveCatalog } from "../subjects/german/sourceArchiveCatalog"
import type { GermanSourceArchiveDocumentKind } from "../subjects/german/sourceArchiveCatalog"

const now = new Date("2026-07-17T12:00:00.000Z")

describe("German source archive", () => {
  it("groups only registered German source identities and requires all four roles", () => {
    const editionId = "zap-zh-lg-german-2025" as const
    const records = Object.entries(germanSourceArchiveCatalog[editionId].documents).map(([rawKind, definition]) => {
      const kind = rawKind as GermanSourceArchiveDocumentKind
      return {
        id: germanSourceArchiveDocumentId(editionId, kind),
        subjectId: "german" as const,
        editionId,
        kind,
        filename: definition.expectedFilename,
        mimeType: "application/pdf" as const,
        size: 100,
        sha256: definition.sha256,
        importedAt: now.toISOString(),
        blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
      }
    })
    expect(records.every(isGermanSourceArchiveDocumentRecord)).toBe(true)
    const library = groupGermanSourceArchiveRecords([
      ...records,
      { ...records[0], sha256: "0".repeat(64) },
      { subjectId: "math" },
    ])
    expect(Object.keys(library[editionId] ?? {})).toHaveLength(4)
    expect(hasCompleteGermanSourceArchiveEdition(library[editionId]!, editionId)).toBe(true)
    expect(hasCompleteGermanSourceArchiveEdition({ solutions: records[1] }, editionId)).toBe(false)
  })

  it("rejects a non-PDF before trusting its filename", async () => {
    const file = new File(["plain text"], "2025_sprachpruefung.pdf", { type: "application/pdf" })
    await expect(inspectGermanSourceArchivePdfForEdition(
      file,
      "zap-zh-lg-german-2025",
      "language-exam",
      now,
    )).rejects.toEqual(expect.objectContaining<Partial<GermanSourceArchiveImportError>>({
      code: "not-a-pdf",
    }))
  })

  it("rejects a PDF whose content hash belongs to no requested role", async () => {
    const digest = vi.spyOn(globalThis.crypto.subtle, "digest").mockResolvedValue(
      Uint8Array.from({ length: 32 }, () => 1).buffer,
    )
    const file = new File(["%PDF-unregistered"], "renamed.pdf", { type: "application/pdf" })
    await expect(inspectGermanSourceArchivePdfForEdition(
      file,
      "zap-zh-lg-german-2025",
      "language-exam",
      now,
    )).rejects.toEqual(expect.objectContaining<Partial<GermanSourceArchiveImportError>>({
      code: "wrong-document",
    }))
    digest.mockRestore()
  })
})
