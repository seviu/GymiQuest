export const officialArchiveYears = [
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
] as const

export type OfficialArchiveYear = (typeof officialArchiveYears)[number]
export type OfficialArchiveDocumentKind = "tasks" | "solutions"
export type OfficialArchiveReplayMode = "source-only" | "corrected-replay" | "graded-replay"
export type OfficialArchiveEditionId = `zap-zh-lg-${OfficialArchiveYear}`
export const OFFICIAL_2015_EDITION_ID = "zap-zh-lg-2015" as const satisfies OfficialArchiveEditionId
export const OFFICIAL_2023_EDITION_ID = "zap-zh-lg-2023" as const satisfies OfficialArchiveEditionId
export const OFFICIAL_2024_EDITION_ID = "zap-zh-lg-2024" as const satisfies OfficialArchiveEditionId
export const OFFICIAL_2025_EDITION_ID = "zap-zh-lg-2025" as const satisfies OfficialArchiveEditionId

export interface OfficialArchiveDocumentDefinition {
  kind: OfficialArchiveDocumentKind
  title: string
  expectedFilename: string
  pageCount: number
  sha256: string
}

export interface OfficialArchiveEditionDefinition {
  editionId: OfficialArchiveEditionId
  year: OfficialArchiveYear
  title: string
  durationSeconds: 3_600
  taskCount: 9
  maxPoints: 36
  replayMode: OfficialArchiveReplayMode
  documents: Record<OfficialArchiveDocumentKind, OfficialArchiveDocumentDefinition>
}

function document(
  kind: OfficialArchiveDocumentKind,
  year: OfficialArchiveYear,
  expectedFilename: string,
  pageCount: number,
  sha256: string,
  title?: string,
): OfficialArchiveDocumentDefinition {
  return {
    kind,
    title: title ?? `${kind === "tasks" ? "Aufgaben" : "Lösungen"} ${year}`,
    expectedFilename,
    pageCount,
    sha256,
  }
}

function edition(
  year: OfficialArchiveYear,
  tasks: OfficialArchiveDocumentDefinition,
  solutions: OfficialArchiveDocumentDefinition,
  replayMode: OfficialArchiveReplayMode = "source-only",
): OfficialArchiveEditionDefinition {
  return {
    editionId: `zap-zh-lg-${year}`,
    year,
    title: `ZAP 1 Mathematik ${year}`,
    durationSeconds: 3_600,
    taskCount: 9,
    maxPoints: 36,
    replayMode,
    documents: { tasks, solutions },
  }
}

export const officialArchiveCatalog: Record<OfficialArchiveEditionId, OfficialArchiveEditionDefinition> = {
  "zap-zh-lg-2015": edition(
    2015,
    document("tasks", 2015, "2015_mathematik_aufgaben_lg.pdf", 8, "d3110bce35c63bb9ea9a92578d065b4d4b83b086a511a76f1c3bba8fee021dc3"),
    document("solutions", 2015, "2015_mathematik_loesung_lg.pdf", 11, "2ae7bbf7d5418aac082d28fb1a802feed96e31440542937f3686a04c30d30eb9"),
    "corrected-replay",
  ),
  "zap-zh-lg-2016": edition(
    2016,
    document("tasks", 2016, "2016_mathematik_aufgaben_lg.pdf", 8, "57ab709a8da6b16ed0935548726d74d58f0384df4000db7eff42cf400c16bcd7"),
    document("solutions", 2016, "2016_mathematik_loesung_lg.pdf", 1, "d598a8b7ebf3880adc242a120dac0d517c0de4704e3d4863a626c4305ec913df"),
  ),
  "zap-zh-lg-2017": edition(
    2017,
    document("tasks", 2017, "2017_mathematik_aufgaben_lg.pdf", 12, "f82688d2af46224ab8d1a441f224d9fd0240cfa689a1d5eb84a9622c603dbb3b"),
    document("solutions", 2017, "2017_mathematik_loesung_lg.pdf", 1, "3b33ed4ab48297745251d731c8e35086a9ab433b8ac25258dc3dbc64eca8342a"),
  ),
  "zap-zh-lg-2018": edition(
    2018,
    document("tasks", 2018, "2018_mathematik_aufgaben_lg.pdf", 12, "ddb683633133e7d125f9a626235e143d8e9dfb538a8420a77e5b6fe4d05f4aa3"),
    document("solutions", 2018, "2018_mathematik_loesung_lg.pdf", 1, "3e058d9eceb7ece6558edc7c440eb8781fa34e07567ea870a446e1fb91cb5fa6"),
  ),
  "zap-zh-lg-2019": edition(
    2019,
    document("tasks", 2019, "2019_mathematik_aufgaben_lg.pdf", 12, "156eea641d704add69e31f2af9a124e3a2fb17559b820788fa79d4c86500ae3d"),
    document("solutions", 2019, "2019_mathematik_loesung_lg.pdf", 1, "1d0e040d4fced1f4d338f3ae1ff5a0d475cc1b68e77cc2804eb5ec09f8394dca"),
  ),
  "zap-zh-lg-2020": edition(
    2020,
    document("tasks", 2020, "2020_mathematik_aufgaben_lg.pdf", 12, "2b7313d7fd206382f25325e76afb1fb8d14344fee4ae98d0cac1c257a40070e7"),
    document("solutions", 2020, "2020_mathematik_lg.pdf", 1, "e1904f8e9a00ae7d08aca9ce236c1b300aba8b31d18205259b632d3391136808"),
  ),
  "zap-zh-lg-2021": edition(
    2021,
    document("tasks", 2021, "2021_mathematik_aufgaben.pdf", 12, "cc76181e502276332b9fd6bc06db11a492883c6c6c042ef55bfc5bc1caf90f9f"),
    document("solutions", 2021, "2021_mathematik_loesungen.pdf", 1, "80dc61a825f9e1efecfd381e970be6d56a5489ce21eb8cbb25528cabece96c98"),
  ),
  "zap-zh-lg-2022": edition(
    2022,
    document("tasks", 2022, "2022_mathematik_aufgaben.pdf", 11, "4affdc63b8cafb23b0c62d6a47e621e73b8ce3d9af6bb37ad5d6078ded624c62"),
    document("solutions", 2022, "2022_mathematik_loesungen.pdf", 1, "37ba11d6ae9b386367d9cf34b6b91f96874878d5aef79aed5100892b55f0c969"),
  ),
  "zap-zh-lg-2023": edition(
    2023,
    document("tasks", 2023, "2023_mathematik_aufgaben_lg.pdf", 12, "a4dcf9b354db4be9d9ae6b6b37577d8f0dda809b63b01f3cdffea819bf9a6403"),
    document("solutions", 2023, "2023_mathematik_loesungen_lg.pdf", 12, "e140e436152944f942e66cf1616027aa5079412c6eba542b249b3310aff5fc4a"),
    "corrected-replay",
  ),
  "zap-zh-lg-2024": edition(
    2024,
    document("tasks", 2024, "2024_mathematik_aufgaben_lg.pdf", 12, "fff33d36cacf17e207eb50d924fa6b01911ec504d28c266787f9fad6ebf73566"),
    document("solutions", 2024, "2024_mathematik_loesungen_lg.pdf", 11, "0c2008803530b6f39592a58b2e03d04d239654e44ea3a155c5cb8faeb6ed3c1d"),
    "graded-replay",
  ),
  "zap-zh-lg-2025": edition(
    2025,
    document("tasks", 2025, "2025_mathematik_aufgaben.pdf", 12, "ebbab8f760060113dee4372af3545d369bf05314abae3600b61d5d5164264ec6"),
    document("solutions", 2025, "2025_mathematik_loesungen.pdf", 15, "d4b5f336318b7003dc5dbbfa38f87fabcef7e2a9ad0d24bf60161ffa2ec7bf75", "Lösungen 2025 mit Ergänzungen v1.1"),
    "graded-replay",
  ),
}

export const officialArchiveEditions = officialArchiveYears
  .map((year) => officialArchiveCatalog[`zap-zh-lg-${year}`])
  .reverse()

export function findOfficialArchiveDocumentByHash(
  sha256: string,
): { edition: OfficialArchiveEditionDefinition; document: OfficialArchiveDocumentDefinition } | undefined {
  for (const editionDefinition of officialArchiveEditions) {
    for (const kind of ["tasks", "solutions"] as const) {
      const documentDefinition = editionDefinition.documents[kind]
      if (documentDefinition.sha256 === sha256) {
        return { edition: editionDefinition, document: documentDefinition }
      }
    }
  }
  return undefined
}
