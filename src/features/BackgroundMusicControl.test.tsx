import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LocalizationProvider } from "../i18n/localization"
import { BackgroundMusicControl } from "./BackgroundMusicControl"

describe("BackgroundMusicControl", () => {
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

  it("starts and pauses the raw MIDI player only after an explicit button press", async () => {
    const player = {
      dispose: vi.fn(),
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(true),
    }
    await act(async () => {
      root.render(
        <LocalizationProvider>
          <BackgroundMusicControl createPlayer={() => player} />
        </LocalizationProvider>,
      )
    })

    const button = container.querySelector("button")!
    expect(button.getAttribute("aria-label")).toBe("Play music: The Golden Dragon")
    expect(button.getAttribute("aria-pressed")).toBe("false")
    expect(player.play).not.toHaveBeenCalled()

    await act(async () => button.click())
    expect(player.play).toHaveBeenCalledOnce()
    expect(button.getAttribute("aria-pressed")).toBe("true")
    expect(button.getAttribute("aria-label")).toBe("Pause music: The Golden Dragon")

    await act(async () => button.click())
    expect(player.pause).toHaveBeenCalledOnce()
    expect(button.getAttribute("aria-pressed")).toBe("false")
  })

  it("stops and disables music when an assessment begins", async () => {
    const player = {
      dispose: vi.fn(),
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(true),
    }
    const render = (blocked: boolean) => root.render(
      <LocalizationProvider>
        <BackgroundMusicControl blocked={blocked} createPlayer={() => player} />
      </LocalizationProvider>,
    )

    await act(async () => render(false))
    const button = container.querySelector("button")!
    await act(async () => button.click())
    expect(button.getAttribute("aria-pressed")).toBe("true")

    await act(async () => render(true))
    expect(player.pause).toHaveBeenCalledOnce()
    expect(button.disabled).toBe(true)
    expect(button.getAttribute("data-music-status")).toBe("blocked")
    expect(button.getAttribute("aria-label")).toBe("Music is off during assessments and exams.")
  })
})
