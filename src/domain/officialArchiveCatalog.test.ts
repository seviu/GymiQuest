import { describe, expect, it } from "vitest"
import {
  findOfficialArchiveDocumentByHash,
  officialArchiveCatalog,
  officialArchiveEditions,
  officialArchiveYears,
} from "./officialArchiveCatalog"

describe("official archive catalog", () => {
  it("registers the complete 2015-2025 source inventory without duplicate identities", () => {
    expect(officialArchiveYears).toHaveLength(11)
    expect(officialArchiveEditions).toHaveLength(11)
    expect(officialArchiveEditions.map(({ year }) => year)).toEqual([
      2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015,
    ])

    const documents = officialArchiveEditions.flatMap((edition) => (
      [edition.documents.tasks, edition.documents.solutions]
    ))
    expect(documents).toHaveLength(22)
    expect(new Set(documents.map(({ sha256 }) => sha256)).size).toBe(22)
    expect(documents.every(({ sha256 }) => /^[a-f0-9]{64}$/u.test(sha256))).toBe(true)
    expect(documents.every(({ pageCount }) => Number.isInteger(pageCount) && pageCount > 0)).toBe(true)
  })

  it("separates corrected replay from editions with a verified year scale", () => {
    expect(officialArchiveCatalog["zap-zh-lg-2015"].replayMode).toBe("corrected-replay")
    expect(officialArchiveCatalog["zap-zh-lg-2023"].replayMode).toBe("corrected-replay")
    expect(officialArchiveCatalog["zap-zh-lg-2024"].replayMode).toBe("graded-replay")
    expect(officialArchiveCatalog["zap-zh-lg-2025"].replayMode).toBe("graded-replay")
    expect(officialArchiveEditions.filter(({ replayMode }) => replayMode === "graded-replay")).toHaveLength(2)
    expect(officialArchiveEditions.filter(({ replayMode }) => replayMode === "corrected-replay")).toHaveLength(2)
    expect(officialArchiveEditions.filter(({ replayMode }) => replayMode === "source-only")).toHaveLength(7)
  })

  it("identifies an edition and document kind from its checksum", () => {
    const expected = officialArchiveCatalog["zap-zh-lg-2024"].documents.solutions
    expect(findOfficialArchiveDocumentByHash(expected.sha256)).toEqual({
      edition: officialArchiveCatalog["zap-zh-lg-2024"],
      document: expected,
    })
    expect(findOfficialArchiveDocumentByHash("0".repeat(64))).toBeUndefined()
  })
})
