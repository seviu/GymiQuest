import { act, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildGermanWritingForm,
  chooseGermanWritingPrompt,
  createActiveGermanWritingSession,
  createGermanWritingHumanReview,
  submitGermanWritingSession,
  updateGermanWritingDraft,
  type GermanWritingHumanReview,
  type GermanWritingResult,
} from "./writing"
import { GermanWritingRevisionView } from "./GermanWritingRevisionView"
import {
  createActiveGermanWritingRevision,
  type ActiveGermanWritingRevision,
  type GermanWritingRevisionSnapshot,
} from "./writingRevision"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing textarea setter")
  setter.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

function RevisionHarness({
  result,
  review,
  initial,
  onChange,
  onComplete,
}: {
  result: GermanWritingResult
  review: GermanWritingHumanReview
  initial: ActiveGermanWritingRevision
  onChange: (revision: ActiveGermanWritingRevision) => void
  onComplete: (snapshot: GermanWritingRevisionSnapshot) => void
}) {
  const [revision, setRevision] = useState(initial)
  return (
    <GermanWritingRevisionView
      result={result}
      review={review}
      revision={revision}
      priorRevisions={[]}
      onChange={(next) => {
        setRevision(next)
        onChange(next)
      }}
      onComplete={onComplete}
      onExit={() => undefined}
    />
  )
}

describe("German writing revision learner view", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined)
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.restoreAllMocks()
    container.remove()
  })

  it("autosaves an editable copy and only seals a meaningfully changed version", () => {
    const startedAt = new Date("2026-07-17T12:00:00.000Z")
    let session = createActiveGermanWritingSession("revision-view", startedAt)
    session = chooseGermanWritingPrompt(session, buildGermanWritingForm(session.seed).prompts[0]!.id, startedAt)
    session = updateGermanWritingDraft(session, "Die ursprüngliche Fassung bleibt erhalten.", startedAt)
    const result = submitGermanWritingSession(session, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    const review = createGermanWritingHumanReview(
      result.id,
      "Der Einstieg ist klar.",
      "Zeige die Folge des Konflikts genauer.",
      new Date("2026-07-17T12:20:00.000Z"),
    )!
    const revision = createActiveGermanWritingRevision(
      result,
      [],
      new Date("2026-07-17T12:21:00.000Z"),
    )!
    const onChange = vi.fn()
    const onComplete = vi.fn()

    act(() => root.render(
      <RevisionHarness
        result={result}
        review={review}
        initial={revision}
        onChange={onChange}
        onComplete={onComplete}
      />,
    ))

    expect(container.textContent).toContain("Darauf konzentrierst du dich jetzt")
    expect(container.textContent).toContain(review.nextStep)
    expect(container.textContent).toContain("keine Punkte, Note, XP")
    const save = Array.from(container.querySelectorAll("button")).find((button) => (
      button.textContent?.includes("unveränderlich speichern")
    ))
    if (!(save instanceof HTMLButtonElement)) throw new Error("Missing immutable save button")
    expect(save.disabled).toBe(true)

    const draft = container.querySelector("textarea")
    if (!(draft instanceof HTMLTextAreaElement)) throw new Error("Missing revision editor")
    act(() => setTextareaValue(
      draft,
      `${result.draft} Danach wird die Folge des Konflikts sichtbar.`,
    ))

    expect(onChange).toHaveBeenCalled()
    expect(save.disabled).toBe(false)
    act(() => save.click())
    expect(onComplete).toHaveBeenCalledTimes(1)
    const snapshot = onComplete.mock.calls[0]![0] as GermanWritingRevisionSnapshot
    expect(snapshot.draft).toContain("Folge des Konflikts")
    expect(snapshot).not.toHaveProperty("score")
    expect(snapshot).not.toHaveProperty("xp")
  })
})
