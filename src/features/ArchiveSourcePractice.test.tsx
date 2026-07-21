import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActiveArchivePractice, type ArchivePracticeResult } from "../domain/archivePractice"
import { officialArchiveCatalog } from "../domain/officialArchiveCatalog"
import type { OfficialArchiveDocuments } from "../infra/officialArchive"
import { LocalizationProvider } from "../i18n/localization"
import { ArchivePracticeResultsView, ArchiveSourcePracticePlayer } from "./ArchiveSourcePractice"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function documents2022(): OfficialArchiveDocuments {
  const editionId = "zap-zh-lg-2022" as const
  const definition = officialArchiveCatalog[editionId]
  const importedAt = "2026-07-15T10:00:00.000Z"
  return {
    tasks: {
      id: `${editionId}:tasks`,
      editionId,
      kind: "tasks",
      filename: definition.documents.tasks.expectedFilename,
      mimeType: "application/pdf",
      size: 9,
      sha256: definition.documents.tasks.sha256,
      importedAt,
      blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
    },
    solutions: {
      id: `${editionId}:solutions`,
      editionId,
      kind: "solutions",
      filename: definition.documents.solutions.expectedFilename,
      mimeType: "application/pdf",
      size: 9,
      sha256: definition.documents.solutions.sha256,
      importedAt,
      blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
    },
  }
}

function button(container: HTMLElement, label: string): HTMLButtonElement {
  const match = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
  )
  if (!(match instanceof HTMLButtonElement)) throw new Error(`Missing button: ${label}`)
  return match
}

describe("archive source practice UI", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-15T10:00:00.000Z"))
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined)
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("locks solutions during work, persists paper progress, and requires all nine bounded comparisons", () => {
    const practice = createActiveArchivePractice(
      "zap-zh-lg-2022",
      "ui:archive:2022",
      new Date("2026-07-15T10:00:00.000Z"),
    )
    const onChange = vi.fn()
    const onComplete = vi.fn()

    act(() => {
      root.render(
        <ArchiveSourcePracticePlayer
          initialPractice={practice}
          documents={documents2022()}
          onChange={onChange}
          onComplete={onComplete}
          onExit={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("60-MINUTEN-ARCHIVTRAINING")
    expect(container.textContent).toContain("Die Lösungsseite bleibt bis zur Abgabe gesperrt")
    expect(Array.from(container.querySelectorAll("button")).some((entry) => entry.textContent === "Lösungsblatt")).toBe(false)

    const paperToggle = container.querySelector(".archive-paper-toggle")
    if (!(paperToggle instanceof HTMLButtonElement)) throw new Error("Missing paper progress toggle")
    act(() => paperToggle.click())
    expect(onChange.mock.calls.at(-1)?.[0].progress[0].attemptedOnPaper).toBe(true)

    act(() => button(container, "Training abgeben").click())
    expect(container.textContent).toContain("8 Aufgaben sind nicht als bearbeitet markiert")
    act(() => button(container, "Abgeben und Lösungen öffnen").click())

    expect(container.textContent).toContain("SELBSTREVIEW")
    expect(button(container, "Lösungsblatt").getAttribute("aria-pressed")).toBe("true")
    expect(container.textContent).toContain("Ein übereinstimmendes Endergebnis beweist weder Lösungsweg noch Teilpunkte")
    expect(container.textContent).toContain("Noch 9 Aufgaben vergleichen")

    for (let taskIndex = 0; taskIndex < 9; taskIndex += 1) {
      const status = taskIndex === 0
        ? "answer-matches"
        : taskIndex === 1
          ? "answer-differs-or-unclear"
          : "not-attempted"
      const input = container.querySelector(`input[value="${status}"]`)
      if (!(input instanceof HTMLInputElement)) throw new Error(`Missing review choice ${status}`)
      if (taskIndex === 8) expect(button(container, "Selbstreview abschliessen").disabled).toBe(true)
      act(() => input.click())
      if (taskIndex < 8) act(() => button(container, "Nächste Aufgabe").click())
    }

    expect(button(container, "Selbstreview abschliessen").disabled).toBe(false)
    act(() => button(container, "Selbstreview abschliessen").click())
    expect(onComplete).toHaveBeenCalledOnce()
    const result = onComplete.mock.calls[0]![0] as ArchivePracticeResult
    expect(result.taskResults.map((task) => task.reviewStatus)).toEqual([
      "answer-matches",
      "answer-differs-or-unclear",
      "not-attempted",
      "not-attempted",
      "not-attempted",
      "not-attempted",
      "not-attempted",
      "not-attempted",
      "not-attempted",
    ])
    expect(result).not.toHaveProperty("maxPoints")
  })

  it("renders the private source-training boundary in English", () => {
    const practice = createActiveArchivePractice(
      "zap-zh-lg-2022",
      "ui:archive:english",
      new Date("2026-07-15T10:00:00.000Z"),
    )

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <ArchiveSourcePracticePlayer
            initialPractice={practice}
            documents={documents2022()}
            onChange={() => undefined}
            onComplete={() => undefined}
            onExit={() => undefined}
          />
        </LocalizationProvider>,
      )
    })

    expect(container.textContent).toContain("60-MINUTE ARCHIVE TRAINING")
    expect(container.textContent).toContain("The solution sheet remains locked until submission")
    expect(container.textContent).toContain("Submit training")
    expect(container.textContent).not.toContain("Training abgeben")
  })

  it("renders an explicitly non-scoring result summary", () => {
    const result: ArchivePracticeResult = {
      schemaVersion: 1,
      kind: "archive-source-practice-result",
      id: "result:ui",
      editionId: "zap-zh-lg-2020",
      year: 2020,
      startedAt: "2026-07-15T10:00:00.000Z",
      submittedAt: "2026-07-15T10:45:00.000Z",
      completedAt: "2026-07-15T10:50:00.000Z",
      submissionReason: "submitted",
      durationSeconds: 2_700,
      totalActiveSeconds: 2_100,
      taskResults: Array.from({ length: 9 }, (_, index) => ({
        taskNumber: index + 1,
        reviewStatus: index < 3 ? "answer-matches" : index < 5
          ? "answer-differs-or-unclear"
          : "not-attempted",
        attemptedOnPaper: index < 5,
        activeSeconds: index < 5 ? 420 : 0,
        visitCount: 1,
        flagged: false,
      })),
    }

    act(() => root.render(<ArchivePracticeResultsView result={result} onContinue={() => undefined} />))

    expect(container.textContent).toContain("Die Prüfung 2020 ist ehrlich verglichen")
    expect(container.textContent).toContain("Keine Punkte")
    expect(container.textContent).toContain("Keine Note. Keine XP. Keine Veränderung von Mastery oder Reviews.")
    expect(container.textContent).not.toContain("/36")
  })
})
