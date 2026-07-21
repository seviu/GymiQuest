import { useEffect, useRef, useState } from "react"

interface PdfPageCanvasProps {
  blob: Blob
  pageNumber: number
  title: string
}

type PdfRenderTask = { cancel: () => void; promise: Promise<unknown> }
type PdfLoadingTask = { destroy: () => Promise<void>; promise: Promise<{
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number }
    render: (options: {
      canvas: HTMLCanvasElement
      canvasContext: CanvasRenderingContext2D
      viewport: { width: number; height: number }
    }) => PdfRenderTask
  }>
}> }

export function PdfPageCanvas({ blob, pageNumber, title }: PdfPageCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    let cancelled = false
    let loadingTask: PdfLoadingTask | undefined
    let renderTask: PdfRenderTask | undefined

    const render = async () => {
      setStatus("loading")
      try {
        const [{ getDocument, GlobalWorkerOptions }, workerModule] = await Promise.all([
          import("pdfjs-dist"),
          import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ])
        GlobalWorkerOptions.workerSrc = workerModule.default
        const bytes = new Uint8Array(await blob.arrayBuffer())
        if (cancelled) return
        loadingTask = getDocument({ data: bytes }) as unknown as PdfLoadingTask
        const document = await loadingTask.promise
        const page = await document.getPage(pageNumber)
        if (cancelled) return

        const canvas = canvasRef.current
        const host = hostRef.current
        const context = canvas?.getContext("2d")
        if (!canvas || !host || !context) throw new Error("PDF canvas is unavailable.")
        const base = page.getViewport({ scale: 1 })
        const displayWidth = Math.max(280, Math.min(host.clientWidth || 900, 1_080))
        const outputScale = Math.min(globalThis.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({ scale: (displayWidth / base.width) * outputScale })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width = `${Math.floor(viewport.width / outputScale)}px`
        canvas.style.height = `${Math.floor(viewport.height / outputScale)}px`
        renderTask = page.render({ canvas, canvasContext: context, viewport })
        await renderTask.promise
        if (!cancelled) setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    }

    void render()
    return () => {
      cancelled = true
      renderTask?.cancel()
      void loadingTask?.destroy()
    }
  }, [blob, pageNumber])

  return (
    <div className={`official-pdf-page ${status}`} ref={hostRef}>
      {status === "loading" && <p role="status">PDF-Seite wird geladen …</p>}
      {status === "error" && <p role="alert">Die PDF-Seite konnte nicht angezeigt werden.</p>}
      <canvas ref={canvasRef} aria-label={`${title}, Seite ${pageNumber}`} />
    </div>
  )
}
