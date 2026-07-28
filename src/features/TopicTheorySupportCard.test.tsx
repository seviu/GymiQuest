import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { theorySupportCopy } from "../i18n/theorySupportCopy"
import { TopicTheorySupportCard } from "./TopicTheorySupportCard"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe("TopicTheorySupportCard", () => {
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
  })

  it("offers a distinct explanation before an explicit support request", () => {
    const onUnderstood = vi.fn()
    const onRequestSupport = vi.fn()

    act(() => root.render(
      <TopicTheorySupportCard
        topicId="mass-units"
        topicTitle="kg und g"
        guidanceTitle="Die Richtung prüfen"
        commonHurdle="Multiplizieren und Dividieren werden vertauscht."
        nextStep="Sage zuerst die Zieleinheit laut."
        exampleTitle="Wandle 2.4 kg in Gramm um."
        workedSteps={["2.4 · 1000", "= 2400 g"]}
        takeaway="Bei Gramm wird die Zahl grösser."
        visual={<span data-support-visual>2.4 kg → 2400 g</span>}
        copy={theorySupportCopy.de}
        onUnderstood={onUnderstood}
        onRequestSupport={onRequestSupport}
      />,
    ))

    const card = container.querySelector('[data-topic-theory-support="mass-units"]')
    expect(card).not.toBeNull()
    expect(card?.textContent).toContain("Schauen wir kg und g anders an")
    expect(card?.textContent).toContain("Hier stockt es oft")
    expect(card?.textContent).toContain("Wandle 2.4 kg in Gramm um.")
    expect(card?.textContent).toContain("Mit eigenen Worten sagen")
    expect(card?.querySelector("[data-support-visual]")?.textContent).toBe("2.4 kg → 2400 g")

    const buttons = Array.from(container.querySelectorAll("button"))
    act(() => buttons.find((button) => button.textContent === "Jetzt ist es klarer")?.click())
    expect(onUnderstood).toHaveBeenCalledOnce()
    expect(onRequestSupport).not.toHaveBeenCalled()

    act(() => buttons.find((button) => button.textContent === "Ich brauche trotzdem Hilfe")?.click())
    expect(onRequestSupport).toHaveBeenCalledOnce()
  })
})
