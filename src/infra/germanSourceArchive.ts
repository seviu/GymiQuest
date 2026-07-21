import { sha256Hex } from "./officialArchive"
import {
  findGermanSourceArchiveDocumentByHash,
  germanSourceArchiveCatalog,
  germanSourceArchiveDocumentKinds,
  type GermanSourceArchiveDocumentKind,
  type GermanSourceArchiveEditionId,
} from "../subjects/german/sourceArchiveCatalog"

export interface GermanSourceArchiveDocumentRecord {
  id: string
  subjectId: "german"
  editionId: GermanSourceArchiveEditionId
  kind: GermanSourceArchiveDocumentKind
  filename: string
  mimeType: "application/pdf"
  size: number
  sha256: string
  importedAt: string
  blob: Blob
}

export type GermanSourceArchiveDocuments = Partial<Record<
  GermanSourceArchiveDocumentKind,
  GermanSourceArchiveDocumentRecord
>>
export type GermanSourceArchiveLibrary = Partial<Record<
  GermanSourceArchiveEditionId,
  GermanSourceArchiveDocuments
>>

export interface GermanSourceArchiveBulkImportResult {
  imported: number
  rejected: string[]
}

export type GermanSourceArchiveImportErrorCode =
  | "crypto-unavailable"
  | "not-a-pdf"
  | "wrong-document"

export class GermanSourceArchiveImportError extends Error {
  constructor(
    public readonly code: GermanSourceArchiveImportErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "GermanSourceArchiveImportError"
  }
}

export function germanSourceArchiveDocumentId(
  editionId: GermanSourceArchiveEditionId,
  kind: GermanSourceArchiveDocumentKind,
): string {
  return `german-source:${editionId}:${kind}`
}

async function verifiedGermanSourcePdfDigest(file: File): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new GermanSourceArchiveImportError(
      "crypto-unavailable",
      "Dieser Browser kann die Deutsch-PDF nicht sicher prüfen.",
    )
  }
  const bytes = await file.arrayBuffer()
  const header = new TextDecoder("ascii").decode(bytes.slice(0, 5))
  if (header !== "%PDF-") {
    throw new GermanSourceArchiveImportError(
      "not-a-pdf",
      "Die gewählte Datei ist keine lesbare PDF-Datei.",
    )
  }
  return sha256Hex(bytes)
}

function recordForDefinition(
  file: File,
  editionId: GermanSourceArchiveEditionId,
  kind: GermanSourceArchiveDocumentKind,
  digest: string,
  now: Date,
): GermanSourceArchiveDocumentRecord {
  return {
    id: germanSourceArchiveDocumentId(editionId, kind),
    subjectId: "german",
    editionId,
    kind,
    filename: file.name,
    mimeType: "application/pdf",
    size: file.size,
    sha256: digest,
    importedAt: now.toISOString(),
    blob: file.slice(0, file.size, "application/pdf"),
  }
}

export async function inspectGermanSourceArchivePdfForEdition(
  file: File,
  editionId: GermanSourceArchiveEditionId,
  kind: GermanSourceArchiveDocumentKind,
  now = new Date(),
): Promise<GermanSourceArchiveDocumentRecord> {
  const digest = await verifiedGermanSourcePdfDigest(file)
  const definition = germanSourceArchiveCatalog[editionId].documents[kind]
  if (digest !== definition.sha256) {
    throw new GermanSourceArchiveImportError(
      "wrong-document",
      `Diese Datei ist nicht «${definition.title}».`,
    )
  }
  return recordForDefinition(file, editionId, kind, digest, now)
}

export async function identifyGermanSourceArchivePdf(
  file: File,
  now = new Date(),
): Promise<GermanSourceArchiveDocumentRecord> {
  const digest = await verifiedGermanSourcePdfDigest(file)
  const identity = findGermanSourceArchiveDocumentByHash(digest)
  if (!identity) {
    throw new GermanSourceArchiveImportError(
      "wrong-document",
      "Diese PDF gehört nicht zu den registrierten Deutschprüfungen 2024–2025.",
    )
  }
  return recordForDefinition(
    file,
    identity.edition.editionId,
    identity.document.kind,
    digest,
    now,
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isGermanSourceArchiveDocumentRecord(
  value: unknown,
): value is GermanSourceArchiveDocumentRecord {
  if (!isRecord(value) ||
    value.subjectId !== "german" ||
    typeof value.editionId !== "string" ||
    typeof value.kind !== "string" ||
    !germanSourceArchiveDocumentKinds.includes(value.kind as GermanSourceArchiveDocumentKind)
  ) return false
  const edition = germanSourceArchiveCatalog[value.editionId as GermanSourceArchiveEditionId]
  if (!edition) return false
  const kind = value.kind as GermanSourceArchiveDocumentKind
  const definition = edition.documents[kind]
  return value.id === germanSourceArchiveDocumentId(edition.editionId, kind) &&
    value.mimeType === "application/pdf" &&
    typeof value.filename === "string" &&
    value.filename.length > 0 &&
    value.filename.length <= 1_000 &&
    typeof value.size === "number" &&
    Number.isInteger(value.size) &&
    value.size >= 0 &&
    value.sha256 === definition.sha256 &&
    typeof value.importedAt === "string" &&
    Number.isFinite(Date.parse(value.importedAt)) &&
    value.blob !== undefined &&
    value.blob !== null
}

export function groupGermanSourceArchiveRecords(
  records: readonly unknown[],
): GermanSourceArchiveLibrary {
  const library: GermanSourceArchiveLibrary = {}
  for (const value of records) {
    if (!isGermanSourceArchiveDocumentRecord(value)) continue
    const documents = library[value.editionId] ?? {}
    library[value.editionId] = { ...documents, [value.kind]: value }
  }
  return library
}

export function hasCompleteGermanSourceArchiveEdition(
  documents: GermanSourceArchiveDocuments,
  editionId: GermanSourceArchiveEditionId,
): boolean {
  const definitions = germanSourceArchiveCatalog[editionId].documents
  return germanSourceArchiveDocumentKinds.every((kind) => (
    documents[kind]?.editionId === editionId &&
    documents[kind]?.sha256 === definitions[kind].sha256
  ))
}
