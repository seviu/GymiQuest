import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PdfPageCanvas } from "./PdfPageCanvas"

const pdfMocks = vi.hoisted(() => ({
  cancel: vi.fn(),
  destroyLoadingTask: vi.fn(async () => undefined),
  getDocument: vi.fn(),
}))

vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: pdfMocks.getDocument,
}))

vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({
  default: "mock-pdf-worker.js",
}))

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe("PDF page canvas", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as CanvasRenderingContext2D)
    pdfMocks.getDocument.mockImplementation(() => ({
      destroy: pdfMocks.destroyLoadingTask,
      promise: Promise.resolve({
        getPage: async () => ({
          getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
          render: () => ({ cancel: pdfMocks.cancel, promise: Promise.resolve() }),
        }),
      }),
    }))
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
    pdfMocks.cancel.mockClear()
    pdfMocks.destroyLoadingTask.mockClear()
    pdfMocks.getDocument.mockClear()
  })

  it("switches PDF blobs by destroying only the loading task", async () => {
    const first = new Blob(["%PDF-first"], { type: "application/pdf" })
    const second = new Blob(["%PDF-second"], { type: "application/pdf" })

    await act(async () => {
      root.render(<PdfPageCanvas blob={first} pageNumber={1} title="First source" />)
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    })
    await vi.waitFor(() => expect(container.querySelector(".official-pdf-page")?.className).toContain("ready"))

    await act(async () => {
      root.render(<PdfPageCanvas blob={second} pageNumber={1} title="Second source" />)
      await new Promise((resolve) => window.setTimeout(resolve, 0))
    })
    await vi.waitFor(() => expect(pdfMocks.getDocument).toHaveBeenCalledTimes(2))

    expect(pdfMocks.destroyLoadingTask).toHaveBeenCalledOnce()
    expect(container.querySelector("canvas")?.getAttribute("aria-label")).toBe("Second source, Seite 1")
  })
})
