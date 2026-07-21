import { describe, expect, it } from "vitest"
import {
  buildReleaseReadinessMarkdown,
  createReleaseReadinessRecord,
  isTraceableReleaseBuild,
  normalizeReleaseReadinessRecord,
  releaseReadinessFilename,
  releaseReadinessProgress,
  releaseReadinessSections,
  setReleaseReadinessCheck,
} from "./releaseReadiness"

const now = new Date("2026-07-15T12:34:56.000Z")

describe("public-readiness evidence", () => {
  it("defines unique checks for every still-human release boundary", () => {
    const ids = releaseReadinessSections.flatMap((section) => (
      section.checks.map((check) => check.id)
    ))

    expect(new Set(ids).size).toBe(ids.length)
    expect(releaseReadinessSections.map((section) => section.id)).toEqual([
      "physical-ipad",
      "official-2015",
      "official-2023",
      "official-2024",
      "official-2025",
      "learner-pilot",
      "operator-legal",
    ])
    expect(ids.length).toBe(43)
  })

  it("records and removes only the chosen local attestation", () => {
    const empty = createReleaseReadinessRecord(now)
    const checked = setReleaseReadinessCheck(
      empty,
      "ipad-standalone",
      true,
      new Date("2026-07-15T13:00:00.000Z"),
    )

    expect(checked.completedAtByCheck).toEqual({
      "ipad-standalone": "2026-07-15T13:00:00.000Z",
    })
    expect(checked.buildIdByCheck).toEqual({})
    expect(releaseReadinessProgress(checked)).toEqual({
      completed: 1,
      total: 43,
      sectionsComplete: 0,
      sectionTotal: 7,
    })
    expect(setReleaseReadinessCheck(
      checked,
      "ipad-standalone",
      false,
      new Date("2026-07-15T13:01:00.000Z"),
    ).completedAtByCheck).toEqual({})
  })

  it("normalizes stale or malformed persisted evidence without trusting unknown checks", () => {
    expect(normalizeReleaseReadinessRecord({
      version: 1,
      completedAtByCheck: {
        "ipad-standalone": "2026-07-15T13:00:00.000Z",
        invented: "2026-07-15T13:00:00.000Z",
        "ipad-reset": "not-a-date",
      },
      buildIdByCheck: {
        "ipad-standalone": "abc123-release",
        invented: "invented-build",
        "ipad-reset": "orphan-build",
      },
      updatedAt: "not-a-date",
    }, now)).toEqual({
      version: 1,
      completedAtByCheck: {
        "ipad-standalone": "2026-07-15T13:00:00.000Z",
      },
      buildIdByCheck: {
        "ipad-standalone": "abc123-release",
      },
      updatedAt: now.toISOString(),
    })

    expect(normalizeReleaseReadinessRecord({ version: 99 }, now)).toEqual(
      createReleaseReadinessRecord(now),
    )

    expect(normalizeReleaseReadinessRecord({
      version: 1,
      completedAtByCheck: {
        "ipad-standalone": "2026-07-15T13:00:00.000Z",
      },
      updatedAt: "2026-07-15T13:00:00.000Z",
    }, now)).toEqual({
      version: 1,
      completedAtByCheck: {
        "ipad-standalone": "2026-07-15T13:00:00.000Z",
      },
      buildIdByCheck: {},
      updatedAt: "2026-07-15T13:00:00.000Z",
    })
  })

  it("exports a privacy-bounded protocol that does not pretend checkmarks prove independence", () => {
    const record = setReleaseReadinessCheck(
      createReleaseReadinessRecord(now),
      "official-2025-sources",
      true,
      now,
      "abc123-release",
    )
    const markdown = buildReleaseReadinessMarkdown(record, {
      capturedAt: now.toISOString(),
      buildId: "abc123-release",
      location: "https://gymiquest.pages.dev/",
      standalone: true,
      serviceWorkerControlled: true,
      online: false,
      viewport: "1180×820",
      userAgent: "iPad test agent",
    })

    expect(markdown).toContain("Lokale Haken dokumentieren eine Behauptung")
    expect(markdown).toContain("Build: abc123-release")
    expect(markdown).toContain("Getesteter Build: abc123-release")
    expect(markdown).toContain("Sauberer, nachvollziehbarer Build: ja")
    expect(markdown).toContain("- [x] Beide Quell-Hashes")
    expect(markdown).toContain("- [ ] Aus Safari zum Home-Bildschirm")
    expect(markdown).toContain("Eigenständiges App-Fenster erkannt: ja")
    expect(markdown).toContain("Browser meldet online: nein")
    expect(markdown).toContain("keinen Spitznamen, keine Antworten, keine XP")
    expect(markdown).not.toContain("learnerId")
    expect(releaseReadinessFilename(now)).toBe("gymiquest-freigabeprotokoll-2026-07-15.md")
  })

  it("rejects dirty and unversioned builds as release evidence", () => {
    expect(isTraceableReleaseBuild("abc123-release")).toBe(true)
    expect(isTraceableReleaseBuild("abc123-release-dirty")).toBe(false)
    expect(isTraceableReleaseBuild("unversioned-development-build")).toBe(false)
  })
})
