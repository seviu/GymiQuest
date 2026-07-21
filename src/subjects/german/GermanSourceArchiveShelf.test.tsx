import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LocalizationProvider } from "../../i18n/localization"
import type { GermanSourceArchiveDocumentRecord } from "../../infra/germanSourceArchive"
import {
  germanSourceArchiveCatalog,
  germanSourceArchiveDocumentKinds,
  type GermanSourceArchiveDocumentKind,
} from "./sourceArchiveCatalog"
import { GermanSourceArchiveShelf } from "./GermanSourceArchiveShelf"

vi.mock("../../features/PdfPageCanvas", () => ({
  PdfPageCanvas: ({ title, pageNumber }: { title: string; pageNumber: number }) => (
    <div data-testid="pdf-page">{title} · {pageNumber}</div>
  ),
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function sourceRecord(kind: GermanSourceArchiveDocumentKind = "language-exam"): GermanSourceArchiveDocumentRecord {
  const editionId = "zap-zh-lg-german-2025" as const
  const definition = germanSourceArchiveCatalog[editionId].documents[kind]
  return {
    id: `german-source:${editionId}:${kind}`,
    subjectId: "german",
    editionId,
    kind,
    filename: definition.expectedFilename,
    mimeType: "application/pdf",
    size: 12,
    sha256: definition.sha256,
    importedAt: "2026-07-17T12:00:00.000Z",
    blob: new Blob(["%PDF-source"], { type: "application/pdf" }),
  }
}

describe("German source archive shelf", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it("shows both source-only years and the local privacy boundary", () => {
    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <GermanSourceArchiveShelf library={{}} />
        </LocalizationProvider>,
      )
    })

    expect(container.textContent).toContain("Original 2024 and 2025 materials")
    expect(container.textContent).toContain("0/8 documents local")
    expect(container.textContent).toContain("2025")
    expect(container.textContent).toContain("2024")
    expect(container.textContent).toContain("excluded from backups")
    expect(container.textContent).toContain("no automatic evaluation")
    expect(container.querySelectorAll(".official-library-actions .missing")).toHaveLength(8)
  })

  it("opens an imported document in the local reader", () => {
    const record = sourceRecord()
    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <GermanSourceArchiveShelf library={{
            [record.editionId]: { [record.kind]: record },
          }} />
        </LocalizationProvider>,
      )
    })

    const open = Array.from(container.querySelectorAll("button")).find((button) => (
      button.textContent?.includes("Language exam")
    ))
    if (!(open instanceof HTMLButtonElement)) throw new Error("Missing source reader button")
    act(() => open.click())

    expect(container.textContent).toContain("LOCAL PDF READER")
    expect(container.textContent).toContain("Sprachprüfung 2025 · 1")
    expect(container.textContent).toContain(record.filename)
  })

  it("passes a multi-file selection to the verified import boundary", async () => {
    const onImport = vi.fn(async () => ({ imported: 1, rejected: ["other.pdf: not recognised"] }))
    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <GermanSourceArchiveShelf library={{}} onImport={onImport} />
        </LocalizationProvider>,
      )
    })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const files = [
      new File(["%PDF-one"], "one.pdf", { type: "application/pdf" }),
      new File(["%PDF-two"], "other.pdf", { type: "application/pdf" }),
    ]
    Object.defineProperty(input, "files", { configurable: true, value: files })

    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }))
      await vi.waitFor(() => expect(onImport).toHaveBeenCalledWith(files))
    })

    expect(container.textContent).toContain("1 document saved")
    expect(container.textContent).toContain("1 file was not recognised")
    expect(container.textContent).toContain("other.pdf: not recognised")
  })

  it("starts either timed source mode only when its required documents are local", () => {
    const records = germanSourceArchiveDocumentKinds.map(sourceRecord)
    const library = {
      "zap-zh-lg-german-2025": Object.fromEntries(records.map((record) => [record.kind, record])),
    }
    const onStartPractice = vi.fn()
    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <GermanSourceArchiveShelf
            library={library}
            onStartPractice={onStartPractice}
            onResumePractice={() => undefined}
          />
        </LocalizationProvider>,
      )
    })

    const language = Array.from(container.querySelectorAll(".german-source-practice-actions button")).find(
      (button) => button.textContent?.includes("45-min language exam"),
    )
    const writing = Array.from(container.querySelectorAll(".german-source-practice-actions button")).find(
      (button) => button.textContent?.includes("60-min essay"),
    )
    if (!(language instanceof HTMLButtonElement) || !(writing instanceof HTMLButtonElement)) {
      throw new Error("Missing source practice controls")
    }
    expect(language.disabled).toBe(false)
    expect(writing.disabled).toBe(false)
    act(() => language.click())
    act(() => writing.click())
    expect(onStartPractice).toHaveBeenNthCalledWith(1, "zap-zh-lg-german-2025", "language-exam")
    expect(onStartPractice).toHaveBeenNthCalledWith(2, "zap-zh-lg-german-2025", "writing")
  })
})
