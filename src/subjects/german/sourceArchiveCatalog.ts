export const germanSourceArchiveYears = [2024, 2025] as const

export type GermanSourceArchiveYear = typeof germanSourceArchiveYears[number]
export type GermanSourceArchiveEditionId = `zap-zh-lg-german-${GermanSourceArchiveYear}`
export type GermanSourceArchiveDocumentKind =
  | "language-exam"
  | "solutions"
  | "text-sheet"
  | "essay-prompts"

export const germanSourceArchiveDocumentKinds = [
  "language-exam",
  "solutions",
  "text-sheet",
  "essay-prompts",
] as const satisfies readonly GermanSourceArchiveDocumentKind[]

export interface GermanSourceArchiveDocumentDefinition {
  kind: GermanSourceArchiveDocumentKind
  title: string
  expectedFilename: string
  pageCount: number
  sha256: string
}

export interface GermanSourceArchiveEditionDefinition {
  editionId: GermanSourceArchiveEditionId
  year: GermanSourceArchiveYear
  title: string
  languageExamDurationSeconds: 2_700
  writingDurationSeconds: 3_600
  mode: "source-only"
  documents: Record<GermanSourceArchiveDocumentKind, GermanSourceArchiveDocumentDefinition>
}

function document(
  kind: GermanSourceArchiveDocumentKind,
  title: string,
  expectedFilename: string,
  pageCount: number,
  sha256: string,
): GermanSourceArchiveDocumentDefinition {
  return { kind, title, expectedFilename, pageCount, sha256 }
}

function edition(
  year: GermanSourceArchiveYear,
  documents: GermanSourceArchiveEditionDefinition["documents"],
): GermanSourceArchiveEditionDefinition {
  return {
    editionId: `zap-zh-lg-german-${year}`,
    year,
    title: `ZAP 1 Deutsch ${year}`,
    languageExamDurationSeconds: 2_700,
    writingDurationSeconds: 3_600,
    mode: "source-only",
    documents,
  }
}

export const germanSourceArchiveCatalog: Record<
  GermanSourceArchiveEditionId,
  GermanSourceArchiveEditionDefinition
> = {
  "zap-zh-lg-german-2024": edition(2024, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2024",
      "2024_sprachpruefung_lg.pdf",
      24,
      "d494fc2c11555e39668f0c7d5fbcf5af93d3591218a51481dcf42872127698e1",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2024",
      "2024_sprachpruefung_loesung_lg.pdf",
      28,
      "2e0005910139b7389838b5eea60b5e5bd49219c508c507372085c47f341bea5e",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2024",
      "2024_textblatt_lg.pdf",
      1,
      "c3d42e1b1cf152aa6f2b8962bcc0e18f3f937d47a7347d63206537c5eba5ff73",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2024",
      "2024_aufsatzthemen_lg.pdf",
      1,
      "9a87d70f52111860df4af2bed3c0dbc485e2e605c91a74b904a1d8af4a628dd4",
    ),
  }),
  "zap-zh-lg-german-2025": edition(2025, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2025",
      "2025_sprachpruefung.pdf",
      14,
      "73690b9cdc52866bdc11e15a3d65458630595cc8159264b019ec0235f35ffc05",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2025",
      "2025_sprachpruefung_loesungen.pdf",
      16,
      "5af1dc68505b4588fed4287e37fafeb545b2bd9082e95084a223ad1eaf9ee592",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2025",
      "2025_textblatt.pdf",
      1,
      "89c0a71fd4e65083a244560e6d495100a07e620c97ef56ca3c7f0a399cf6888b",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2025",
      "2025_aufsatzthemen.pdf",
      2,
      "3a6867c633b5dc3695570561de0b52a709f01da725fae3970877760db2fd9919",
    ),
  }),
}

export const germanSourceArchiveEditions = germanSourceArchiveYears
  .map((year) => germanSourceArchiveCatalog[`zap-zh-lg-german-${year}`])
  .reverse()

export function findGermanSourceArchiveDocumentByHash(
  sha256: string,
): {
  edition: GermanSourceArchiveEditionDefinition
  document: GermanSourceArchiveDocumentDefinition
} | undefined {
  for (const editionDefinition of germanSourceArchiveEditions) {
    for (const kind of germanSourceArchiveDocumentKinds) {
      const documentDefinition = editionDefinition.documents[kind]
      if (documentDefinition.sha256 === sha256) {
        return { edition: editionDefinition, document: documentDefinition }
      }
    }
  }
  return undefined
}
