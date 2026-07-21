import { useState } from "react"
import { PdfPageCanvas } from "../../features/PdfPageCanvas"
import { useLocalization } from "../../i18n/localization"
import type {
  GermanSourceArchiveBulkImportResult,
  GermanSourceArchiveLibrary,
} from "../../infra/germanSourceArchive"
import {
  germanSourceArchiveCatalog,
  germanSourceArchiveDocumentKinds,
  germanSourceArchiveEditions,
  type GermanSourceArchiveDocumentKind,
  type GermanSourceArchiveEditionId,
} from "./sourceArchiveCatalog"
import { germanSourceArchiveUiCopy } from "./sourceArchiveCopy"
import type {
  ActiveGermanSourcePractice,
  GermanSourcePracticeMode,
  GermanSourcePracticeResult,
} from "./sourcePractice"
import { germanSourcePracticeUiCopy } from "./sourcePracticeCopy"

interface ReaderState {
  editionId: GermanSourceArchiveEditionId
  kind: GermanSourceArchiveDocumentKind
  pageNumber: number
}

export function GermanSourceArchiveShelf({
  library,
  onImport,
  activePractice,
  latestResult,
  practiceBlocked = false,
  onStartPractice,
  onResumePractice,
}: {
  library: GermanSourceArchiveLibrary
  onImport?: (files: readonly File[]) => Promise<GermanSourceArchiveBulkImportResult>
  activePractice?: ActiveGermanSourcePractice
  latestResult?: GermanSourcePracticeResult
  practiceBlocked?: boolean
  onStartPractice?: (editionId: GermanSourceArchiveEditionId, mode: GermanSourcePracticeMode) => void
  onResumePractice?: () => void
}) {
  const { locale } = useLocalization()
  const copy = germanSourceArchiveUiCopy[locale]
  const practiceCopy = germanSourcePracticeUiCopy[locale]
  const [reader, setReader] = useState<ReaderState>()
  const [importing, setImporting] = useState(false)
  const [status, setStatus] = useState<string>()
  const [error, setError] = useState<string>()
  const importedCount = germanSourceArchiveEditions.reduce((total, edition) => (
    total + germanSourceArchiveDocumentKinds.filter((kind) => Boolean(
      library[edition.editionId]?.[kind],
    )).length
  ), 0)
  const readerEdition = reader ? germanSourceArchiveCatalog[reader.editionId] : undefined
  const readerRecord = reader ? library[reader.editionId]?.[reader.kind] : undefined
  const readerDefinition = readerEdition && reader ? readerEdition.documents[reader.kind] : undefined

  const importFiles = async (files: readonly File[]) => {
    if (!onImport || files.length === 0) return
    setImporting(true)
    setStatus(undefined)
    setError(undefined)
    try {
      const result = await onImport(files)
      setStatus(`${copy.imported(result.imported)}${result.rejected.length ? ` ${copy.rejected(result.rejected.length)}` : ""}`)
      if (result.rejected.length) setError(result.rejected.join(" "))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failure)
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className="official-library german-source-library" aria-labelledby="german-source-library-heading">
      <div className="official-library-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2 id="german-source-library-heading">{copy.title}</h2>
          <p>{copy.body}</p>
          <small className="german-source-privacy">{copy.privacy}</small>
        </div>
        <div className="official-library-import">
          <strong>{copy.readyCount(importedCount)}</strong>
          <label className={importing ? "disabled" : ""}>
            <span>{importing ? copy.checking : copy.choose}</span>
            <input
              type="file"
              multiple
              accept="application/pdf,.pdf"
              disabled={!onImport || importing}
              aria-label={copy.importAria}
              onChange={(event) => {
                const files = Array.from(event.currentTarget.files ?? [])
                event.currentTarget.value = ""
                void importFiles(files)
              }}
            />
          </label>
        </div>
      </div>

      {status && <p className="official-library-status" role="status">{status}</p>}
      {error && <p className="official-import-error" role="alert">{error}</p>}

      <div className="official-library-grid german-source-library-grid" aria-label={copy.yearsAria}>
        {germanSourceArchiveEditions.map((edition) => {
          const documents = library[edition.editionId]
          const readyCount = germanSourceArchiveDocumentKinds.filter((kind) => Boolean(documents?.[kind])).length
          const languageReady = Boolean(
            documents?.["language-exam"] && documents["text-sheet"] && documents.solutions,
          )
          const writingReady = Boolean(documents?.["essay-prompts"])
          const practiceAction = (mode: GermanSourcePracticeMode, ready: boolean) => {
            const isActive = activePractice?.editionId === edition.editionId && activePractice.mode === mode
            const disabled = isActive
              ? !onResumePractice
              : !ready || practiceBlocked || Boolean(activePractice) || !onStartPractice
            const label = isActive
              ? mode === "language-exam" ? practiceCopy.resumeLanguage : practiceCopy.resumeWriting
              : mode === "language-exam" ? practiceCopy.startLanguage : practiceCopy.startWriting
            const reason = !ready
              ? mode === "language-exam" ? practiceCopy.missingLanguage : practiceCopy.missingWriting
              : practiceBlocked || activePractice ? practiceCopy.blocked : undefined
            return (
              <button
                className={isActive ? "active" : ""}
                type="button"
                disabled={disabled}
                title={reason}
                onClick={() => isActive
                  ? onResumePractice?.()
                  : onStartPractice?.(edition.editionId, mode)}
              >{label}</button>
            )
          }
          return (
            <article className={readyCount === 4 ? "ready" : ""} key={edition.editionId}>
              <div className="official-library-year">
                <strong>{edition.year}</strong>
                <span>{copy.localCount(readyCount)}</span>
              </div>
              <p>{copy.facts}</p>
              <div className="official-library-actions german-source-library-actions">
                {germanSourceArchiveDocumentKinds.map((kind) => documents?.[kind] ? (
                  <button
                    type="button"
                    key={kind}
                    onClick={() => setReader({ editionId: edition.editionId, kind, pageNumber: 1 })}
                    aria-label={copy.openDocument(copy.documentLabels[kind], edition.year)}
                  >
                    <span aria-hidden="true">✓</span> {copy.documentLabels[kind]}
                  </button>
                ) : (
                  <span className="missing" key={kind}>{copy.missing(copy.documentLabels[kind])}</span>
                ))}
              </div>
              <small className="source-only">{copy.sourceOnly}</small>
              <div className="german-source-practice-actions">
                {practiceAction("language-exam", languageReady)}
                {practiceAction("writing", writingReady)}
              </div>
              {latestResult?.editionId === edition.editionId && (
                <small className="german-source-latest">
                  {practiceCopy.latest(latestResult.mode, edition.year)}
                </small>
              )}
            </article>
          )
        })}
      </div>

      {reader && readerEdition && readerRecord && readerDefinition && (
        <div className="official-library-reader" role="region" aria-labelledby="german-source-reader-heading">
          <header>
            <div>
              <span className="eyebrow">{copy.readerEyebrow}</span>
              <h3 id="german-source-reader-heading">{readerEdition.title} · {copy.documentLabels[reader.kind]}</h3>
              <p>{copy.readerBody}</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => setReader(undefined)}>{copy.close}</button>
          </header>
          <div className="official-library-reader-toolbar">
            <div className="official-library-reader-tabs" aria-label={copy.chooseDocumentAria}>
              {germanSourceArchiveDocumentKinds.map((kind) => library[reader.editionId]?.[kind] && (
                <button
                  className={reader.kind === kind ? "active" : ""}
                  type="button"
                  aria-pressed={reader.kind === kind}
                  key={kind}
                  onClick={() => setReader({ ...reader, kind, pageNumber: 1 })}
                >
                  {copy.documentLabels[kind]}
                </button>
              ))}
            </div>
            <div className="official-library-page-controls" aria-label={copy.pageNavigationAria}>
              <button
                type="button"
                disabled={reader.pageNumber <= 1}
                aria-label={copy.previousPage}
                onClick={() => setReader({ ...reader, pageNumber: reader.pageNumber - 1 })}
              >←</button>
              <strong>{copy.pageOf(reader.pageNumber, readerDefinition.pageCount)}</strong>
              <button
                type="button"
                disabled={reader.pageNumber >= readerDefinition.pageCount}
                aria-label={copy.nextPage}
                onClick={() => setReader({ ...reader, pageNumber: reader.pageNumber + 1 })}
              >→</button>
            </div>
          </div>
          <div className="official-library-pdf">
            <PdfPageCanvas
              blob={readerRecord.blob}
              pageNumber={reader.pageNumber}
              title={readerDefinition.title}
            />
          </div>
          <footer><span>{readerRecord.filename}</span><span>{copy.checksum}</span></footer>
        </div>
      )}
    </section>
  )
}
