import { act, useState } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LocalizationProvider } from "../../i18n/localization"
import {
  createActiveGermanComprehensionSession,
  createGermanComprehensionReview,
  germanComprehensionPassage,
  submitGermanComprehensionSession,
  updateGermanComprehensionSession,
  type ActiveGermanComprehensionSession,
  type GermanComprehensionResult,
} from "./comprehension"
import { GermanComprehensionFeedbackCard } from "./GermanComprehensionFeedbackCard"
import { GermanComprehensionView } from "./GermanComprehensionView"
import { decodeExerciseReport, isGermanExerciseReport } from "../../domain/exerciseReport"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing textarea value setter")
  setter.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

function buttonWithText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find((candidate) => (
    candidate.textContent?.trim() === text
  ))
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${text}`)
  return button
}

function Harness({
  initial,
  onComplete,
}: {
  initial: ActiveGermanComprehensionSession
  onComplete: (result: GermanComprehensionResult) => void
}) {
  const [session, setSession] = useState(initial)
  return (
    <LocalizationProvider initialLocale="en">
      <GermanComprehensionView
        session={session}
        onChange={setSession}
        onComplete={onComplete}
        onExit={() => undefined}
      />
    </LocalizationProvider>
  )
}

describe("German comprehension learner views", () => {
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

  it("keeps the response while opening reading theory and submits it without a score", () => {
    const initial = createActiveGermanComprehensionSession(
      "ui:comprehension",
      [],
      new Date("2026-07-17T12:00:00.000Z"),
    )
    const onComplete = vi.fn()
    act(() => root.render(<Harness initial={initial} onComplete={onComplete} />))

    expect(container.textContent).toContain("No points, grade, XP, or mastery change")
    expect(container.textContent).toContain(germanComprehensionPassage(initial.promptId)?.title)
    const reportLink = container.querySelector("a.exercise-report-link")
    if (!(reportLink instanceof HTMLAnchorElement)) throw new Error("Missing report link")
    const reportReference = decodeExerciseReport(new URL(reportLink.href).searchParams.get("data") ?? undefined)
    expect(reportReference && isGermanExerciseReport(reportReference)).toBe(true)
    expect(JSON.stringify(reportReference)).not.toContain("evidenceLines")
    expect(JSON.stringify(reportReference)).not.toContain('"response":')
    expect(reportLink.target).toBe("")
    const submit = buttonWithText(container, "Send for feedback")
    expect(submit.disabled).toBe(true)
    const firstLine = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    const textarea = container.querySelector("#german-comprehension-answer") as HTMLTextAreaElement
    act(() => firstLine.click())
    const response = "The learner writes a complete German explanation that still needs a human evidence review."
    act(() => setTextareaValue(textarea, response))
    expect(submit.disabled).toBe(false)

    const theory = container.querySelector('[data-topic-theory="reading-evidence"]')
    if (!(theory instanceof HTMLDetailsElement)) throw new Error("Missing reading theory disclosure")
    expect(theory.open).toBe(false)
    const theorySummary = theory.querySelector("summary")
    if (!(theorySummary instanceof HTMLElement)) throw new Error("Missing reading theory summary")
    act(() => theorySummary.click())
    expect(theory.open).toBe(true)
    expect(theory.textContent).toContain("Nicht raten: zur Aussage zurück in den Text")
    expect(textarea.value).toBe(response)
    expect(firstLine.checked).toBe(true)

    act(() => submit.click())

    expect(onComplete).toHaveBeenCalledOnce()
    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      kind: "german-comprehension-result",
      evidenceLines: [1],
    })
    expect(onComplete.mock.calls[0]![0]).not.toHaveProperty("points")
    expect(onComplete.mock.calls[0]![0]).not.toHaveProperty("xp")
  })

  it("shows pending and reviewed feedback without turning it into grading", () => {
    const active = createActiveGermanComprehensionSession(
      "ui:feedback",
      [],
      new Date("2026-07-17T12:00:00.000Z"),
    )
    const passage = germanComprehensionPassage(active.promptId)!
    const result = submitGermanComprehensionSession(updateGermanComprehensionSession(
      active,
      "Eine vollständige Erklärung nennt den Zusammenhang und verweist auf den Text.",
      [passage.lines[0]!.number],
      new Date("2026-07-17T12:03:00.000Z"),
    ), new Date("2026-07-17T12:04:00.000Z"))
    const onResolve = vi.fn()
    act(() => root.render(
      <LocalizationProvider initialLocale="en">
        <GermanComprehensionFeedbackCard result={result} onResolve={onResolve} />
      </LocalizationProvider>,
    ))
    expect(container.textContent).toContain("waiting for feedback")

    const review = createGermanComprehensionReview(
      result,
      "partly-supported",
      "The central connection is clear.",
      "Tie the second sentence more closely to line 2.",
      new Date("2026-07-17T12:10:00.000Z"),
    )!
    act(() => root.render(
      <LocalizationProvider initialLocale="en">
        <GermanComprehensionFeedbackCard result={result} review={review} onResolve={onResolve} />
      </LocalizationProvider>,
    ))
    expect(container.textContent).toContain("Partly supported")
    expect(container.textContent).toContain("The central connection is clear.")
    act(() => buttonWithText(container, "We discussed this feedback").click())
    expect(onResolve).toHaveBeenCalledWith(result.id)
    expect(container.textContent).toContain("No points, grade, XP, or mastery change")
  })
})
