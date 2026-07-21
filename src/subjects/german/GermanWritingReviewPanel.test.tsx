import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GermanWritingResultView } from "./GermanWritingResultView"
import { GermanWritingReviewPanel } from "./GermanWritingReviewPanel"
import {
  buildGermanWritingForm,
  chooseGermanWritingPrompt,
  createActiveGermanWritingSession,
  createGermanWritingHumanReview,
  submitGermanWritingSession,
  updateGermanWritingDraft,
} from "./writing"
import {
  createActiveGermanWritingRevision,
  saveGermanWritingRevisionSnapshot,
  updateActiveGermanWritingRevision,
} from "./writingRevision"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing textarea setter")
  setter.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

describe("German human writing review", () => {
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

  it("lets the protected companion save one strength and one next step", () => {
    const startedAt = new Date("2026-07-17T12:00:00.000Z")
    let session = createActiveGermanWritingSession("human-review", startedAt)
    session = chooseGermanWritingPrompt(
      session,
      buildGermanWritingForm(session.seed).prompts[0]!.id,
      startedAt,
    )
    const privateDraft = "Der Regen begann, als Mia das vertauschte Paket öffnete."
    session = updateGermanWritingDraft(session, privateDraft, startedAt)
    const result = submitGermanWritingSession(
      session,
      "submitted",
      new Date("2026-07-17T12:30:00.000Z"),
    )
    const onSave = vi.fn()

    act(() => root.render(
      <GermanWritingReviewPanel results={[result]} reviews={[]} onSave={onSave} />,
    ))

    expect(container.textContent).toContain("1 Text wartet")
    expect(container.textContent).toContain(privateDraft)
    const textareas = container.querySelectorAll("textarea")
    expect(textareas).toHaveLength(2)
    const save = Array.from(container.querySelectorAll("button")).find((button) => (
      button.textContent?.includes("Menschliche Rückmeldung speichern")
    ))
    if (!(save instanceof HTMLButtonElement)) throw new Error("Missing review save button")
    expect(save.disabled).toBe(true)

    act(() => {
      setTextareaValue(textareas[0]!, "Der Einstieg weckt sofort Interesse.")
      setTextareaValue(textareas[1]!, "Die Zeitform im Hauptteil prüfen.")
    })
    expect(save.disabled).toBe(false)
    act(() => save.click())

    expect(onSave).toHaveBeenCalledWith(
      result.id,
      "Der Einstieg weckt sofort Interesse.",
      "Die Zeitform im Hauptteil prüfen.",
    )
    expect(container.textContent).toContain("Rückmeldung lokal gespeichert")
  })

  it("shows saved human feedback to the learner without presenting a score", () => {
    const startedAt = new Date("2026-07-17T12:00:00.000Z")
    let session = createActiveGermanWritingSession("learner-feedback", startedAt)
    session = chooseGermanWritingPrompt(
      session,
      buildGermanWritingForm(session.seed).prompts[1]!.id,
      startedAt,
    )
    session = updateGermanWritingDraft(session, "Ein kurzer eigener Text.", startedAt)
    const result = submitGermanWritingSession(session, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    const review = createGermanWritingHumanReview(
      result.id,
      "Die Handlung ist klar aufgebaut.",
      "Beim nächsten Text direkte Rede einsetzen.",
      new Date("2026-07-17T14:00:00.000Z"),
    )!
    const activeRevision = updateActiveGermanWritingRevision(
      createActiveGermanWritingRevision(result, [], new Date("2026-07-17T14:01:00.000Z"))!,
      { draft: `${result.draft} Die überarbeitete Fassung macht den Konflikt deutlicher.` },
      new Date("2026-07-17T14:02:00.000Z"),
    )
    const revision = saveGermanWritingRevisionSnapshot(
      activeRevision,
      new Date("2026-07-17T14:03:00.000Z"),
    )
    const onStartRevision = vi.fn()

    act(() => root.render(
      <GermanWritingResultView
        result={result}
        humanReview={review}
        revisions={[revision]}
        onStartRevision={onStartRevision}
        onExit={() => undefined}
      />,
    ))

    expect(container.textContent).toContain("Dein konkreter nächster Schritt")
    expect(container.textContent).toContain(review.strength)
    expect(container.textContent).toContain(review.nextStep)
    expect(container.textContent).toContain("weder Punkte")
    expect(container.textContent).toContain("ZAP-Note")
    expect(container.textContent).toContain("Gespeicherte Überarbeitungen")
    expect(container.textContent).toContain(revision.draft)
    const revise = Array.from(container.querySelectorAll("button")).find((button) => (
      button.textContent?.includes("Text gezielt überarbeiten")
    ))
    if (!(revise instanceof HTMLButtonElement)) throw new Error("Missing revision button")
    act(() => revise.click())
    expect(onStartRevision).toHaveBeenCalledWith(result.id)
  })

  it("shows immutable revisions read-only and freezes their originating feedback", () => {
    const startedAt = new Date("2026-07-17T12:00:00.000Z")
    let session = createActiveGermanWritingSession("companion-revision", startedAt)
    session = chooseGermanWritingPrompt(session, buildGermanWritingForm(session.seed).prompts[0]!.id, startedAt)
    session = updateGermanWritingDraft(session, "Die ursprüngliche Fassung.", startedAt)
    const result = submitGermanWritingSession(session, "submitted", new Date("2026-07-17T12:10:00.000Z"))
    const review = createGermanWritingHumanReview(
      result.id,
      "Der Einstieg ist verständlich.",
      "Den Konflikt im Hauptteil ausbauen.",
      new Date("2026-07-17T12:20:00.000Z"),
    )!
    const active = updateActiveGermanWritingRevision(
      createActiveGermanWritingRevision(result, [], new Date("2026-07-17T12:21:00.000Z"))!,
      { draft: "Die überarbeitete Fassung baut den Konflikt im Hauptteil aus." },
      new Date("2026-07-17T12:22:00.000Z"),
    )
    const revision = saveGermanWritingRevisionSnapshot(active, new Date("2026-07-17T12:23:00.000Z"))
    const onSave = vi.fn()

    act(() => root.render(
      <GermanWritingReviewPanel
        results={[result]}
        reviews={[review]}
        revisions={[revision]}
        onSave={onSave}
      />,
    ))

    expect(container.textContent).toContain("Gespeicherte Überarbeitungen")
    expect(container.textContent).toContain(revision.draft)
    expect(container.textContent).toContain("ursprüngliche Rückmeldung")
    expect(Array.from(container.querySelectorAll("textarea")).every((textarea) => textarea.disabled)).toBe(true)
    expect(Array.from(container.querySelectorAll("button")).some((button) => (
      button.textContent?.includes("Menschliche Rückmeldung speichern") && button.disabled
    ))).toBe(true)
    expect(onSave).not.toHaveBeenCalled()
  })
})
