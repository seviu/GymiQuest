import { act, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LocalizationProvider } from "../../i18n/localization"
import type {
  GermanSourceArchiveDocumentRecord,
  GermanSourceArchiveDocuments,
} from "../../infra/germanSourceArchive"
import { germanSourceArchiveCatalog, type GermanSourceArchiveDocumentKind } from "./sourceArchiveCatalog"
import {
  createActiveGermanSourcePractice,
  type ActiveGermanSourcePractice,
  type GermanSourcePracticeResult,
} from "./sourcePractice"
import { GermanSourcePracticeView } from "./GermanSourcePracticeView"

vi.mock("../../features/PdfPageCanvas", () => ({
  PdfPageCanvas: ({ title, pageNumber }: { title: string; pageNumber: number }) => (
    <div data-testid="source-pdf">{title} · {pageNumber}</div>
  ),
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function record(kind: GermanSourceArchiveDocumentKind): GermanSourceArchiveDocumentRecord {
  const editionId = "zap-zh-lg-german-2025" as const
  const definition = germanSourceArchiveCatalog[editionId].documents[kind]
  return {
    id: `german-source:${editionId}:${kind}`,
    subjectId: "german",
    editionId,
    kind,
    filename: definition.expectedFilename,
    mimeType: "application/pdf",
    size: 10,
    sha256: definition.sha256,
    importedAt: new Date().toISOString(),
    blob: new Blob([`%PDF-${kind}`], { type: "application/pdf" }),
  }
}

function documents(): GermanSourceArchiveDocuments {
  return {
    "language-exam": record("language-exam"),
    solutions: record("solutions"),
    "text-sheet": record("text-sheet"),
    "essay-prompts": record("essay-prompts"),
  }
}

function buttonWithText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find((candidate) => (
    candidate.textContent?.trim() === text
  ))
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${text}`)
  return button
}

function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = input instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
  if (!setter) throw new Error("Missing native value setter")
  setter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

function Harness({
  initial,
  onState,
  onComplete,
}: {
  initial: ActiveGermanSourcePractice
  onState: (practice: ActiveGermanSourcePractice) => void
  onComplete: (result: GermanSourcePracticeResult) => void
}) {
  const [practice, setPractice] = useState(initial)
  return (
    <LocalizationProvider initialLocale="en">
      <GermanSourcePracticeView
        practice={practice}
        documents={documents()}
        onChange={(next) => {
          setPractice(next)
          onState(next)
        }}
        onComplete={onComplete}
        onExit={() => undefined}
      />
    </LocalizationProvider>
  )
}

describe("German source practice view", () => {
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

  it("keeps language solutions out of the tabs until irreversible submission", () => {
    const initial = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2025",
      "language-exam",
      "ui:language",
      new Date(),
    )
    const onState = vi.fn()
    const onComplete = vi.fn()
    act(() => root.render(<Harness initial={initial} onState={onState} onComplete={onComplete} />))

    const workingTabs = container.querySelectorAll(".german-source-document-toolbar .official-library-reader-tabs button")
    expect(workingTabs).toHaveLength(2)
    expect(Array.from(workingTabs).map((button) => button.textContent?.trim())).toEqual([
      "Language exam",
      "Text sheet",
    ])
    expect(container.textContent).toContain("No points, grade, or XP")

    act(() => buttonWithText(container, "Submit").click())
    expect(container.textContent).toContain("Submit this timed practice now?")
    act(() => buttonWithText(container, "Submit now").click())

    const reviewTabs = container.querySelectorAll(".german-source-document-toolbar .official-library-reader-tabs button")
    expect(reviewTabs).toHaveLength(3)
    expect(Array.from(reviewTabs).map((button) => button.textContent?.trim())).toContain("Solutions")
    const radios = container.querySelectorAll('input[name="german-source-language-review"]')
    expect(radios).toHaveLength(3)
    act(() => (radios[1] as HTMLInputElement).click())
    act(() => buttonWithText(container, "Finish source practice").click())

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      mode: "language-exam",
      languageReviewStatus: "mixed-or-unclear",
    })
    expect(onComplete.mock.calls[0]![0]).not.toHaveProperty("points")
  })

  it("autosaves a source essay and finishes with a bounded self-check only", () => {
    const initial = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2025",
      "writing",
      "ui:writing",
      new Date(),
    )
    const onState = vi.fn()
    const onComplete = vi.fn()
    act(() => root.render(<Harness initial={initial} onState={onState} onComplete={onComplete} />))

    expect(container.textContent).toContain("Your title and essay autosave locally during writing time.")
    expect(container.textContent).not.toContain("Solutions stay locked")

    const title = container.querySelector("#german-source-writing-title") as HTMLInputElement
    const draft = container.querySelector("#german-source-writing-draft") as HTMLTextAreaElement
    act(() => setInputValue(title, "Ein Testtag"))
    act(() => setInputValue(draft, "Heute schreibe ich einen kurzen Text mit neun Wörtern."))
    expect(container.textContent).toContain("9 words")
    expect(onState.mock.calls.at(-1)?.[0]).toMatchObject({
      writingTitle: "Ein Testtag",
      writingDraft: "Heute schreibe ich einen kurzen Text mit neun Wörtern.",
    })

    act(() => buttonWithText(container, "Submit").click())
    act(() => buttonWithText(container, "Submit now").click())
    const checks = container.querySelectorAll('.german-source-writing-checks input[type="checkbox"]')
    expect(checks).toHaveLength(6)
    act(() => (checks[0] as HTMLInputElement).click())
    act(() => (checks[5] as HTMLInputElement).click())
    act(() => buttonWithText(container, "Finish source practice").click())

    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      mode: "writing",
      writingTitle: "Ein Testtag",
      writingDraft: "Heute schreibe ich einen kurzen Text mit neun Wörtern.",
      wordCount: 9,
      writingReviewChecks: ["title-fit", "proofread"],
    })
    expect(onComplete.mock.calls[0]![0]).not.toHaveProperty("grade")
    expect(onComplete.mock.calls[0]![0]).not.toHaveProperty("xp")
  })
})
