import {
  findOfficialArchiveDocumentByHash,
  OFFICIAL_2025_EDITION_ID,
  officialArchiveCatalog,
  type OfficialArchiveDocumentKind,
  type OfficialArchiveEditionId,
} from "../domain/officialArchiveCatalog"

export interface OfficialArchiveDocumentRecord {
  id: string
  editionId: OfficialArchiveEditionId
  kind: OfficialArchiveDocumentKind
  filename: string
  mimeType: "application/pdf"
  size: number
  sha256: string
  importedAt: string
  blob: Blob
}

export type OfficialArchiveDocuments = Partial<Record<OfficialArchiveDocumentKind, OfficialArchiveDocumentRecord>>
export type OfficialArchiveLibrary = Partial<Record<OfficialArchiveEditionId, OfficialArchiveDocuments>>

export type OfficialArchiveImportErrorCode =
  | "crypto-unavailable"
  | "not-a-pdf"
  | "wrong-document"

export class OfficialArchiveImportError extends Error {
  constructor(
    public readonly code: OfficialArchiveImportErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "OfficialArchiveImportError"
  }
}

export function archiveDocumentId(
  editionId: OfficialArchiveEditionId,
  kind: OfficialArchiveDocumentKind,
): string {
  return `${editionId}:${kind}`
}

export function officialArchiveDocumentId(kind: OfficialArchiveDocumentKind): string {
  return archiveDocumentId(OFFICIAL_2025_EDITION_ID, kind)
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("")
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new OfficialArchiveImportError(
      "crypto-unavailable",
      "Dieser Browser kann die offizielle PDF-Datei nicht sicher prüfen.",
    )
  }
  return bytesToHex(new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", data)))
}

export async function inspectOfficialArchivePdf(
  file: File,
  kind: OfficialArchiveDocumentKind,
  now = new Date(),
): Promise<OfficialArchiveDocumentRecord> {
  return inspectOfficialArchivePdfForEdition(file, OFFICIAL_2025_EDITION_ID, kind, now)
}

async function verifiedPdfDigest(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const header = new TextDecoder("ascii").decode(bytes.slice(0, 5))
  if (header !== "%PDF-") {
    throw new OfficialArchiveImportError("not-a-pdf", "Die gewählte Datei ist keine lesbare PDF-Datei.")
  }

  return sha256Hex(bytes)
}

function recordForDefinition(
  file: File,
  editionId: OfficialArchiveEditionId,
  kind: OfficialArchiveDocumentKind,
  digest: string,
  now: Date,
): OfficialArchiveDocumentRecord {
  return {
    id: archiveDocumentId(editionId, kind),
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

export async function inspectOfficialArchivePdfForEdition(
  file: File,
  editionId: OfficialArchiveEditionId,
  kind: OfficialArchiveDocumentKind,
  now = new Date(),
): Promise<OfficialArchiveDocumentRecord> {
  const definition = officialArchiveCatalog[editionId].documents[kind]
  const digest = await verifiedPdfDigest(file)

  if (digest !== definition.sha256) {
    throw new OfficialArchiveImportError(
      "wrong-document",
      `Diese Datei ist nicht ${kind === "tasks" ? "das registrierte Aufgabenblatt" : "die registrierte Lösung"} der ZAP Mathematik ${officialArchiveCatalog[editionId].year}.`,
    )
  }

  return recordForDefinition(file, editionId, kind, digest, now)
}

export async function identifyOfficialArchivePdf(
  file: File,
  now = new Date(),
): Promise<OfficialArchiveDocumentRecord> {
  const digest = await verifiedPdfDigest(file)
  const identity = findOfficialArchiveDocumentByHash(digest)
  if (!identity) {
    throw new OfficialArchiveImportError(
      "wrong-document",
      "Diese PDF gehört nicht zu den registrierten Mathematikprüfungen 2015–2025.",
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

export function hasOfficialArchiveEdition(
  documents: OfficialArchiveDocuments,
  editionId: OfficialArchiveEditionId,
): boolean {
  const definition = officialArchiveCatalog[editionId].documents
  return Boolean(
    documents.tasks?.editionId === editionId &&
    documents.tasks.sha256 === definition.tasks.sha256 &&
    documents.solutions?.editionId === editionId &&
    documents.solutions.sha256 === definition.solutions.sha256,
  )
}

export function groupOfficialArchiveRecords(
  records: readonly unknown[],
): OfficialArchiveLibrary {
  const library: OfficialArchiveLibrary = {}
  for (const value of records) {
    if (!value || typeof value !== "object") continue
    const record = value as Partial<OfficialArchiveDocumentRecord>
    if (
      typeof record.editionId !== "string" ||
      (record.kind !== "tasks" && record.kind !== "solutions") ||
      typeof record.sha256 !== "string"
    ) continue
    const definition = officialArchiveCatalog[record.editionId]?.documents[record.kind]
    if (!definition || definition.sha256 !== record.sha256) continue
    const documents = library[record.editionId] ?? {}
    library[record.editionId] = {
      ...documents,
      [record.kind]: record as OfficialArchiveDocumentRecord,
    }
  }
  return library
}

export function hasOfficial2025Archive(documents: OfficialArchiveDocuments): boolean {
  return hasOfficialArchiveEdition(documents, OFFICIAL_2025_EDITION_ID)
}
