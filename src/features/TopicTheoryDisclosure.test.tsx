import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TopicTheoryDisclosure } from "./TopicTheoryDisclosure"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe("TopicTheoryDisclosure", () => {
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

  it("offers a tappable, collapsed theory explanation for the named topic", () => {
    act(() => root.render(
      <TopicTheoryDisclosure
        topicId="mass-units"
        label="View key idea: kg and g"
        hint="Understand the rule before continuing."
        takeawayLabel="Takeaway"
        headingLevel={2}
        sections={[{
          eyebrow: "KEY IDEA",
          title: "One kilogram is 1,000 grams",
          body: "Use the unit to choose the direction.",
          steps: ["kg to g: multiply by 1,000"],
          takeaway: "Check the unit after calculating.",
          visual: <span data-theory-visual>1 kg = 1,000 g</span>,
        }]}
      />,
    ))

    const disclosure = container.querySelector('[data-topic-theory="mass-units"]')
    if (!(disclosure instanceof HTMLDetailsElement)) throw new Error("Missing theory disclosure")
    expect(disclosure.open).toBe(false)
    expect(disclosure.querySelector("summary")?.textContent).toContain("View key idea: kg and g")

    act(() => disclosure.querySelector("summary")?.click())

    expect(disclosure.open).toBe(true)
    expect(disclosure.textContent).toContain("One kilogram is 1,000 grams")
    expect(disclosure.querySelector("h2")?.textContent).toBe("One kilogram is 1,000 grams")
    expect(disclosure.querySelector("[data-theory-visual]")?.textContent).toBe("1 kg = 1,000 g")
    expect(disclosure.textContent).toContain("kg to g: multiply by 1,000")
    expect(disclosure.textContent).toContain("Takeaway")
    expect(disclosure.textContent).toContain("Check the unit after calculating.")
  })

  it("calls onOpen once for each open action and not when closing", async () => {
    const onOpen = vi.fn()
    act(() => root.render(
      <TopicTheoryDisclosure
        topicId="mass-units"
        label="View key idea: kg and g"
        hint="Understand the rule before continuing."
        takeawayLabel="Takeaway"
        onOpen={onOpen}
        sections={[{
          eyebrow: "KEY IDEA",
          title: "One kilogram is 1,000 grams",
          body: "Use the unit to choose the direction.",
          steps: ["kg to g: multiply by 1,000"],
          takeaway: "Check the unit after calculating.",
        }]}
      />,
    ))

    const summary = container.querySelector("summary")
    if (!(summary instanceof HTMLElement)) throw new Error("Missing theory summary")

    await act(async () => {
      summary.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(onOpen).toHaveBeenCalledTimes(1)

    await act(async () => {
      summary.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(onOpen).toHaveBeenCalledTimes(1)

    await act(async () => {
      summary.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(onOpen).toHaveBeenCalledTimes(2)
  })
})
