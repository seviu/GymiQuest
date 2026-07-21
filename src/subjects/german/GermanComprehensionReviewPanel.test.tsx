import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LocalizationProvider } from "../../i18n/localization"
import {
  createActiveGermanComprehensionSession,
  createGermanComprehensionReview,
  germanComprehensionPassage,
  resolveGermanComprehensionReview,
  submitGermanComprehensionSession,
  updateGermanComprehensionSession,
} from "./comprehension"
import { GermanComprehensionReviewPanel } from "./GermanComprehensionReviewPanel"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing textarea value setter")
  setter.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

function result() {
  const active = createActiveGermanComprehensionSession(
    "parent:comprehension",
    [],
    new Date("2026-07-17T12:00:00.000Z"),
  )
  const passage = germanComprehensionPassage(active.promptId)!
  return submitGermanComprehensionSession(updateGermanComprehensionSession(
    active,
    "Die Antwort nennt einen nachvollziehbaren Zusammenhang und eine passende Textstelle.",
    [passage.lines[0]!.number],
    new Date("2026-07-17T12:02:00.000Z"),
  ), new Date("2026-07-17T12:03:00.000Z"))
}

describe("German comprehension human review panel", () => {
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

  it("shows protected author guidance and saves one bounded human review", () => {
    const attempt = result()
    const onSave = vi.fn()
    act(() => root.render(
      <LocalizationProvider initialLocale="en">
        <GermanComprehensionReviewPanel results={[attempt]} reviews={[]} onSave={onSave} />
      </LocalizationProvider>,
    ))
    expect(container.textContent).toContain("Author guidance for review")
    expect(container.textContent).toContain("Possible supporting elements")
    expect(container.textContent).toContain(attempt.response)
    const textareas = container.querySelectorAll("textarea")
    act(() => {
      setTextareaValue(textareas[0]!, "The explanation identifies the central change.")
      setTextareaValue(textareas[1]!, "Connect the final sentence explicitly to the selected line.")
    })
    const status = Array.from(container.querySelectorAll('input[type="radio"]'))[0] as HTMLInputElement
    act(() => status.click())
    const save = Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Save feedback")!
    act(() => save.click())
    expect(onSave).toHaveBeenCalledWith(
      attempt.id,
      "well-supported",
      "The explanation identifies the central change.",
      "Connect the final sentence explicitly to the selected line.",
    )
    expect(container.textContent).toContain("no points, grade, XP, or automatic learning effect")
  })

  it("keeps resolved feedback read-only", () => {
    const attempt = result()
    const review = resolveGermanComprehensionReview(createGermanComprehensionReview(
      attempt,
      "well-supported",
      "A clear strength.",
      "A small next step.",
      new Date("2026-07-17T12:10:00.000Z"),
    )!, new Date("2026-07-17T12:11:00.000Z"))
    act(() => root.render(
      <LocalizationProvider initialLocale="en">
        <GermanComprehensionReviewPanel results={[attempt]} reviews={[review]} onSave={() => undefined} />
      </LocalizationProvider>,
    ))
    expect(container.textContent).toContain("Discussed")
    expect(Array.from(container.querySelectorAll("textarea")).every((textarea) => textarea.disabled)).toBe(true)
    expect(Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Save feedback")?.disabled).toBe(true)
  })
})
