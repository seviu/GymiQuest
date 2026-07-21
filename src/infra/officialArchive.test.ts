import { afterEach, describe, expect, it, vi } from "vitest"
import { officialArchiveCatalog } from "../domain/officialArchiveCatalog"
import {
  archiveDocumentId,
  groupOfficialArchiveRecords,
  hasOfficialArchiveEdition,
  identifyOfficialArchivePdf,
  inspectOfficialArchivePdfForEdition,
  OfficialArchiveImportError,
} from "./officialArchive"

function pdfFile(name: string, body = "registered-pdf"): File {
  const bytes = new TextEncoder().encode(`%PDF-${body}`)
  const file = new File([bytes], name, { type: "application/pdf" })
  Object.defineProperty(file, "arrayBuffer", {
    configurable: true,
    value: async () => bytes.buffer,
  })
  return file
}

describe("private official archive", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("identifies a selected PDF by hash instead of trusting its filename", async () => {
    const file = pdfFile("renamed-private-copy.pdf")
    const digest = officialArchiveCatalog["zap-zh-lg-2019"].documents.tasks.sha256
    const digestSpy = vi.spyOn(globalThis.crypto.subtle, "digest").mockResolvedValue(
      Uint8Array.from(digest.match(/.{2}/gu)!.map((value) => Number.parseInt(value, 16))).buffer,
    )

    const record = await identifyOfficialArchivePdf(file, new Date("2026-07-15T14:00:00.000Z"))

    expect(record).toMatchObject({
      id: "zap-zh-lg-2019:tasks",
      editionId: "zap-zh-lg-2019",
      kind: "tasks",
      filename: "renamed-private-copy.pdf",
      sha256: digest,
    })
    expect(record.blob.type).toBe("application/pdf")
    expect(digestSpy).toHaveBeenCalledOnce()
  })

  it("rejects an unregistered archive PDF without accepting a plausible filename", async () => {
    const file = pdfFile("2024_mathematik_aufgaben_lg.pdf", "unknown")
    await expect(identifyOfficialArchivePdf(file)).rejects.toMatchObject({
      code: "wrong-document",
    })
  })

  it("keeps edition-specific inspection strict", async () => {
    const file = pdfFile("copy.pdf")
    const digest = officialArchiveCatalog["zap-zh-lg-2023"].documents.solutions.sha256
    vi.spyOn(globalThis.crypto.subtle, "digest").mockResolvedValue(
      Uint8Array.from(digest.match(/.{2}/gu)!.map((value) => Number.parseInt(value, 16))).buffer,
    )

    await expect(inspectOfficialArchivePdfForEdition(
      file,
      "zap-zh-lg-2024",
      "solutions",
    )).rejects.toBeInstanceOf(OfficialArchiveImportError)
  })

  it("groups only checksum-valid records and reports complete pairs", () => {
    const definition = officialArchiveCatalog["zap-zh-lg-2024"]
    const tasks = {
      id: archiveDocumentId(definition.editionId, "tasks"),
      editionId: definition.editionId,
      kind: "tasks" as const,
      filename: definition.documents.tasks.expectedFilename,
      mimeType: "application/pdf" as const,
      size: 10,
      sha256: definition.documents.tasks.sha256,
      importedAt: "2026-07-15T14:00:00.000Z",
      blob: new Blob(["%PDF-task"], { type: "application/pdf" }),
    }
    const solutions = {
      ...tasks,
      id: archiveDocumentId(definition.editionId, "solutions"),
      kind: "solutions" as const,
      filename: definition.documents.solutions.expectedFilename,
      sha256: definition.documents.solutions.sha256,
    }
    const invalid = { ...tasks, id: "bad", sha256: "0".repeat(64) }

    const library = groupOfficialArchiveRecords([tasks, solutions, invalid])
    expect(library[definition.editionId]).toEqual({ tasks, solutions })
    expect(hasOfficialArchiveEdition(library[definition.editionId]!, definition.editionId)).toBe(true)
  })
})
