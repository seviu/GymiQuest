export const germanSourceArchiveYears = [
  2015,
  2016,
  2017,
  2018,
  2019,
  2020,
  2021,
  2022,
  2023,
  2024,
  2025,
  2026,
] as const

export type GermanSourceArchiveYear = typeof germanSourceArchiveYears[number]
export type GermanSourceArchiveEditionId = `zap-zh-lg-german-${GermanSourceArchiveYear}`
export type GermanSourceArchiveCoreDocumentKind =
  | "language-exam"
  | "solutions"
  | "text-sheet"
  | "essay-prompts"
export type GermanSourceArchiveDocumentKind =
  | GermanSourceArchiveCoreDocumentKind
  | "essay-guidance"

export const germanSourceArchiveCoreDocumentKinds = [
  "language-exam",
  "solutions",
  "text-sheet",
  "essay-prompts",
] as const satisfies readonly GermanSourceArchiveCoreDocumentKind[]

export const germanSourceArchiveDocumentKinds = [
  ...germanSourceArchiveCoreDocumentKinds,
  "essay-guidance",
] as const satisfies readonly GermanSourceArchiveDocumentKind[]

export interface GermanSourceArchiveDocumentDefinition {
  kind: GermanSourceArchiveDocumentKind
  title: string
  expectedFilename: string
  pageCount: number
  sha256: string
}

export type GermanSourceArchiveDocumentDefinitions =
  Record<GermanSourceArchiveCoreDocumentKind, GermanSourceArchiveDocumentDefinition> &
  Partial<Record<"essay-guidance", GermanSourceArchiveDocumentDefinition>>

export interface GermanSourceArchiveEditionDefinition {
  editionId: GermanSourceArchiveEditionId
  year: GermanSourceArchiveYear
  title: string
  languageExamDurationSeconds: 2_700
  languageExamTaskCount: number
  languageExamMaxPoints: number
  writingDurationSeconds: 3_600
  mode: "source-only"
  documents: GermanSourceArchiveDocumentDefinitions
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
  languageExamTaskCount: number,
  languageExamMaxPoints: number,
  documents: GermanSourceArchiveDocumentDefinitions,
): GermanSourceArchiveEditionDefinition {
  return {
    editionId: `zap-zh-lg-german-${year}`,
    year,
    title: `ZAP 1 Deutsch ${year}`,
    languageExamDurationSeconds: 2_700,
    languageExamTaskCount,
    languageExamMaxPoints,
    writingDurationSeconds: 3_600,
    mode: "source-only",
    documents,
  }
}

export const germanSourceArchiveCatalog: Record<
  GermanSourceArchiveEditionId,
  GermanSourceArchiveEditionDefinition
> = {
  "zap-zh-lg-german-2015": edition(2015, 16, 46, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2015",
      "2015_sprachpruefung_lg.pdf",
      11,
      "328416c27f097ffb26695c268490bbebe9e137f7a0613d5ab48a8657fc399a9d",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2015",
      "2015_sprachpruefung_loesung_lg.pdf",
      15,
      "b18b0be52bcb27e00951cbc93fb3409ec6289b944c7deb1e58d9d0158e7056e7",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2015",
      "2015_textblatt_lg.pdf",
      1,
      "a31dede5c698df37271f6e4eece91eae12e8c05916fa7d621666993913a0d0e0",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2015",
      "2015_aufsatzthemen_lg.pdf",
      3,
      "2d426a13630cf3ffeff057934c992354232c824693a7da488b565d4edbd45e3c",
    ),
    "essay-guidance": document(
      "essay-guidance",
      "Korrekturhinweise Aufsatz 2015",
      "2015_aufsatz_korrekturhinweise_lg.pdf",
      1,
      "85f75e787aba1022a638be63fab538274daa458fc8f525e27b43f9a3a8efba94",
    ),
  }),
  "zap-zh-lg-german-2016": edition(2016, 16, 48, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2016 · Aufgabenseiten ohne Deckblatt",
      "2016_textverstaendnis_teil_a.pdf",
      12,
      "632e4f9f653a06447a000c6d4770c3ed29de9c84d63852dbff5c14264d9e2b6a",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2016",
      "2016_sprachpruefung_loesung_lgpdf.pdf",
      16,
      "42a6ef939bcf21f694e733fc40bbc8d128255e2705ab21266598f4fa4aea016f",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2016",
      "2016_textblatt_lg.pdf",
      1,
      "4beeddad859e1599ea446a48e7882708a8b28551ac54c41838b9321c130ca048",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2016",
      "2016_aufsatzthemen_lg.pdf",
      1,
      "9a6dd4b91cedf2a2f56135d61cd421e1db08ad77acfe953ea5bfb097e1a16439",
    ),
  }),
  "zap-zh-lg-german-2017": edition(2017, 17, 50, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2017",
      "2017_sprachpruefung_lg.pdf",
      12,
      "e8de3d93854ed386fbffff18db641ddd0af160fd8736fe687baa5ec06049c047",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2017",
      "2017_sprachpruefung_loesung_lg.pdf",
      13,
      "026aa2c601715f1f8b3624021deb1c4f8a91b1bcfcefed1efecbfc09b03192a6",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2017",
      "2017_textblatt_lg.pdf",
      1,
      "a7f7a1a7e7d9594d1cf1b10e56662f8d56fa9100efbbb563fcf872fab33f0339",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2017",
      "2017_aufsatzthemen_lg.pdf",
      1,
      "e5202cf7485aa9abc264eddf24c99aff2e8d2b7582e8adfef656aa8fa13c320b",
    ),
  }),
  "zap-zh-lg-german-2018": edition(2018, 15, 56, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2018",
      "2018_sprachpruefung_lgpdf.pdf",
      12,
      "6131ef0d25a0d9bbc98a45ab0f08d3e2297ef2b394d9a43d0181f825a0c010f9",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2018",
      "2018_sprachpruefung_loesung_lg.pdf",
      14,
      "b903f8eb14d70d27d53554501727ad6ae073d58edecd5149fd5f7e96f703f13a",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2018",
      "2018_textblatt_lg.pdf",
      1,
      "c69c8380cc4aff1c83e63b60787f9d587515cf36a7551c5b788674f14e5dd79e",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2018",
      "2018_aufsatzthemen.pdf",
      1,
      "33e5b3de4d40c132e81ddd7ab4d54c56e62c9ab3eb01aa766b17e692bd1f659f",
    ),
  }),
  "zap-zh-lg-german-2019": edition(2019, 15, 50, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2019",
      "2019_sprachpruefung_aufgaben_lg.pdf",
      11,
      "1247e692b3d52903e694f0f8b9cc0d400497abe479353db8a39901fd8e57952c",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2019",
      "2019_sprachpruefung_loesung_lg.pdf",
      12,
      "a3598c2aff03b3ecb6649ce773f244ccda65a9260664e17a9f47edf8ba7a81a8",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2019",
      "2019_textblatt.pdf",
      1,
      "673301122f8b4331ac4598ec814e422f497ee6bf1d0538cab93d1f95a3ea8f37",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2019",
      "2019_aufsatzthemen_lg.pdf",
      8,
      "c91cd438f1dba3a81d66d7d3595acf4954d622d70e3b0eaf6afd373f75557bc1",
    ),
  }),
  "zap-zh-lg-german-2020": edition(2020, 15, 51, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2020",
      "2020_sprachpruefung.pdf",
      18,
      "bb909acdd05a6704a93f4cbbc597ce195e2bfd1b0f266fd356183b7afbdb9c5e",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2020",
      "2020_sprachpruefung_loesung_lg.pdf",
      16,
      "cb0adad177218090fec89f54cc863d90a56b34046d099e405c55adceedad3c4f",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2020",
      "2020_textblatt_lg.pdf",
      1,
      "585be1969672f42324f0e098f59ac4b41349300ba8d1de62e8f61d46adf3194f",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2020",
      "2020_aufsatzthemen_lg.pdf",
      4,
      "3a9cbd9be08371da80599ef573fb26c347856eccafdff68b89b0417f04da37f6",
    ),
  }),
  "zap-zh-lg-german-2021": edition(2021, 15, 48, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2021",
      "2021_sprachpruefung_aufgaben.pdf",
      13,
      "a6126d143527e9e732b9d784f15c0b502868aada6387e030f5d1f5e50b7ceed1",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2021",
      "2021_sprachpruefung_loesung.pdf",
      15,
      "78c6036e4c99808de5cf523002152b14a5b5cdd3f219502ed8e5dd5345397e4a",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2021",
      "2021_textblatt.pdf",
      1,
      "7a3ba6131e56944708ee96758e079c9975c86cf666216eb829fb5311aece6bb3",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2021",
      "2021_aufsatzthemen.pdf",
      3,
      "7c9ae4847cbfd333fafef21c7b917978c63b8eb99ef939f6adf71fc5657aa703",
    ),
  }),
  "zap-zh-lg-german-2022": edition(2022, 15, 47, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2022",
      "2022_sprachpruefung_lg.pdf",
      14,
      "ef91ce385b2b7a641f8fc5aedf252df7a8376fc04fbbe436f627e23b464b0dc1",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2022",
      "2022_sprachpruefung_loesung_lg.pdf",
      15,
      "dcd81243567dd096d1e9e270df64f0a10eb9cc872cd246ca11e7586bd34b7dfa",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2022",
      "2022_textblatt_lg.pdf",
      1,
      "39e440ecbdd03e503b0c42b2a04123a68cf0cd9d3ae6acf9eba3cc27775405ac",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2022",
      "2022_aufsatzthemen_lg.pdf",
      8,
      "b9a6ce0510fd0a7a36e2d82d0827548382ffc968985c3c8fa64622456363814d",
    ),
  }),
  "zap-zh-lg-german-2023": edition(2023, 15, 51, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2023",
      "2023_sprachpruefung_lg.pdf",
      14,
      "09e834689ba3270fa6224b7dfc9cc0a36fdd22d0c9cc59a15d5c645e4f5543f7",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2023",
      "2023_sprachpruefung_loesung_lg.pdf",
      16,
      "1369e0f32cf7aab8f6d70f56c0088823c02abcc8cbf4067d283d65ee0fdc572a",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2023",
      "2023_textblatt_lg.pdf",
      1,
      "83b2aa50a988f97faab56c267f605d9ec74a290ec043dfaf5a39b9697e278887",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2023",
      "2023_aufsatzthemen_lg.pdf",
      8,
      "156af61a43343f9802d46bc6582c03d7bff5c4f3b037b4aab1ae8e5d5bb36618",
    ),
  }),
  "zap-zh-lg-german-2024": edition(2024, 15, 46, {
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
  "zap-zh-lg-german-2025": edition(2025, 14, 48, {
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
  "zap-zh-lg-german-2026": edition(2026, 16, 51, {
    "language-exam": document(
      "language-exam",
      "Sprachprüfung 2026",
      "2026_sprachpruefung_lg.pdf",
      14,
      "ced80b53e7a381c42fd8fd47459016d0086b6036b5f9fa7a77f6fb887b018424",
    ),
    solutions: document(
      "solutions",
      "Lösungen Sprachprüfung 2026",
      "2026_sprachpruefung_loesung_lg.pdf",
      16,
      "07e7d7746b2d25f7299f761f288ec81664498e517e9f90fb75a7e472208cf352",
    ),
    "text-sheet": document(
      "text-sheet",
      "Textblatt 2026",
      "2026_textblatt_lg.pdf",
      1,
      "9b89ef310ee103d1f83024b65a0479344f058ca23f8a32e6e3478a2ba2950e1b",
    ),
    "essay-prompts": document(
      "essay-prompts",
      "Aufsatzthemen 2026",
      "2026_aufsatzthemen_lg.pdf",
      9,
      "df90c67e34df559ceaafec11d9dfdf53f5b3897c3a45cc42cc6f4ddb4fbd63ae",
    ),
  }),
}

export const germanSourceArchiveEditions = germanSourceArchiveYears
  .map((year) => germanSourceArchiveCatalog[`zap-zh-lg-german-${year}`])
  .reverse()

export function germanSourceArchiveDocumentKindsForEdition(
  editionId: GermanSourceArchiveEditionId,
): GermanSourceArchiveDocumentKind[] {
  const definitions = germanSourceArchiveCatalog[editionId].documents
  return germanSourceArchiveDocumentKinds.filter((kind) => definitions[kind] !== undefined)
}

export const germanSourceArchiveDocumentCount = germanSourceArchiveEditions
  .reduce((count, editionDefinition) => (
    count + germanSourceArchiveDocumentKindsForEdition(editionDefinition.editionId).length
  ), 0)

export function findGermanSourceArchiveDocumentByHash(
  sha256: string,
): {
  edition: GermanSourceArchiveEditionDefinition
  document: GermanSourceArchiveDocumentDefinition
} | undefined {
  for (const editionDefinition of germanSourceArchiveEditions) {
    for (const kind of germanSourceArchiveDocumentKindsForEdition(editionDefinition.editionId)) {
      const documentDefinition = editionDefinition.documents[kind]
      if (documentDefinition?.sha256 === sha256) {
        return { edition: editionDefinition, document: documentDefinition }
      }
    }
  }
  return undefined
}
