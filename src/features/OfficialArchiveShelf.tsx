import { useState } from "react"
import {
  archivePracticeStatusCounts,
  type ActiveArchivePractice,
  type ArchivePracticeResult,
} from "../domain/archivePractice"
import {
  officialArchiveCatalog,
  officialArchiveEditions,
  type OfficialArchiveDocumentKind,
  type OfficialArchiveEditionId,
} from "../domain/officialArchiveCatalog"
import type { OfficialArchiveLibrary } from "../infra/officialArchive"
import { archiveCopy, archiveDocumentKindLabels } from "../i18n/archiveCopy"
import { useLocalization } from "../i18n/localization"
import { PdfPageCanvas } from "./PdfPageCanvas"

export interface OfficialArchiveBulkImportResult {
  imported: number
  rejected: string[]
}

interface ArchiveReaderState {
  editionId: OfficialArchiveEditionId
  kind: OfficialArchiveDocumentKind
  pageNumber: number
}

export function OfficialArchiveShelf({
  library,
  onImport,
  archivePracticeHistory = [],
  activeArchivePractice,
  practiceBlocked = false,
  onStartPractice,
  onResumePractice,
}: {
  library: OfficialArchiveLibrary
  onImport?: (files: readonly File[]) => Promise<OfficialArchiveBulkImportResult>
  archivePracticeHistory?: readonly ArchivePracticeResult[]
  activeArchivePractice?: ActiveArchivePractice
  practiceBlocked?: boolean
  onStartPractice?: (editionId: OfficialArchiveEditionId) => void
  onResumePractice?: () => void
}) {
  const { locale } = useLocalization()
  const ui = archiveCopy(locale).shelf
  const documentKindLabels = archiveDocumentKindLabels(locale)
  const [reader, setReader] = useState<ArchiveReaderState>()
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string>()
  const [importError, setImportError] = useState<string>()

  const importedDocumentCount = officialArchiveEditions.reduce((total, edition) => {
    const documents = library[edition.editionId]
    return total + Number(Boolean(documents?.tasks)) + Number(Boolean(documents?.solutions))
  }, 0)
  const readerEdition = reader ? officialArchiveCatalog[reader.editionId] : undefined
  const readerDocuments = reader ? library[reader.editionId] : undefined
  const readerRecord = reader ? readerDocuments?.[reader.kind] : undefined
  const readerDefinition = reader && readerEdition ? readerEdition.documents[reader.kind] : undefined

  const importFiles = async (files: readonly File[]) => {
    if (!onImport || files.length === 0) return
    setImporting(true)
    setImportStatus(undefined)
    setImportError(undefined)
    try {
      const result = await onImport(files)
      const savedCopy = ui.importSaved(result.imported)
      setImportStatus(result.rejected.length > 0
        ? `${savedCopy} ${ui.importRejected(result.rejected.length)}`
        : savedCopy)
      if (result.rejected.length > 0) setImportError(result.rejected.join(" "))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : ui.importFailure)
    } finally {
      setImporting(false)
    }
  }

  const openDocument = (editionId: OfficialArchiveEditionId, kind: OfficialArchiveDocumentKind) => {
    setReader({ editionId, kind, pageNumber: 1 })
  }

  const switchReaderDocument = (kind: OfficialArchiveDocumentKind) => {
    if (!reader) return
    setReader({ ...reader, kind, pageNumber: 1 })
  }

  return (
    <section className="official-library" aria-labelledby="official-library-heading">
      <div className="official-library-heading">
        <div>
          <span className="eyebrow">{ui.eyebrow}</span>
          <h2 id="official-library-heading">{ui.title}</h2>
          <p>{ui.body}</p>
        </div>
        <div className="official-library-import">
          <strong>{ui.readyCount(importedDocumentCount)}</strong>
          <span>{ui.multiSelect}</span>
          <label className={importing ? "disabled" : ""}>
            <span>{importing ? ui.checking : ui.choose}</span>
            <input
              type="file"
              multiple
              accept="application/pdf,.pdf"
              disabled={!onImport || importing}
              aria-label={ui.importAria}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                event.target.value = ""
                void importFiles(files)
              }}
            />
          </label>
        </div>
      </div>

      {importStatus && <p className="official-library-status" role="status">{importStatus}</p>}
      {importError && <p className="official-import-error" role="alert">{importError}</p>}

      <div className="official-library-grid" aria-label={ui.yearsAria}>
        {officialArchiveEditions.map((edition) => {
          const documents = library[edition.editionId]
          const readyCount = Number(Boolean(documents?.tasks)) + Number(Boolean(documents?.solutions))
          const sourcePractice = edition.replayMode === "source-only"
          const activeThisEdition = activeArchivePractice?.editionId === edition.editionId
          const anotherArchivePractice = Boolean(activeArchivePractice && !activeThisEdition)
          const latestPractice = [...archivePracticeHistory]
            .reverse()
            .find((result) => result.editionId === edition.editionId)
          const latestCounts = latestPractice ? archivePracticeStatusCounts(latestPractice) : undefined
          return (
            <article className={readyCount === 2 ? "ready" : ""} data-archive-year={edition.year} key={edition.editionId}>
              <div className="official-library-year">
                <strong>{edition.year}</strong>
                <span>{ui.localCount(readyCount)}</span>
              </div>
              <p>{ui.editionFacts(edition.taskCount, edition.maxPoints)}</p>
              <div className="official-library-actions">
                {(["tasks", "solutions"] as const).map((kind) => documents?.[kind] ? (
                  <button
                    type="button"
                    key={kind}
                    onClick={() => openDocument(edition.editionId, kind)}
                    aria-label={ui.openDocument(documentKindLabels[kind], edition.year)}
                  >
                    <span aria-hidden="true">✓</span> {documentKindLabels[kind]}
                  </button>
                ) : (
                  <span className="missing" key={kind}>{ui.missing(documentKindLabels[kind])}</span>
                ))}
              </div>
              <small className={edition.replayMode === "graded-replay" ? "graded" : edition.replayMode === "corrected-replay" ? "corrected" : "source-only"}>
                {edition.replayMode === "graded-replay"
                  ? ui.gradedReplay
                  : edition.replayMode === "corrected-replay"
                    ? ui.correctedReplay
                    : ui.sourceOnly}
              </small>
              {sourcePractice && latestCounts && (
                <div className="official-library-latest-practice">
                  <span>{ui.latestComparison}</span>
                  <strong>{ui.comparisonCounts(latestCounts["answer-matches"], latestCounts["answer-differs-or-unclear"], latestCounts["not-attempted"])}</strong>
                </div>
              )}
              {sourcePractice && (activeThisEdition ? (
                <button
                  className="official-library-practice-button active"
                  type="button"
                  disabled={readyCount !== 2 || !onResumePractice}
                  onClick={onResumePractice}
                >
                  {readyCount === 2
                    ? activeArchivePractice.phase === "review" ? ui.resumeReview : ui.resumePractice
                    : ui.reimport}
                </button>
              ) : (
                <button
                  className="official-library-practice-button"
                  type="button"
                  disabled={readyCount !== 2 || !onStartPractice || practiceBlocked || anotherArchivePractice}
                  onClick={() => onStartPractice?.(edition.editionId)}
                >
                  {anotherArchivePractice
                    ? ui.anotherPractice
                    : practiceBlocked
                      ? ui.anotherRound
                      : ui.startPractice(edition.year)}
                </button>
              ))}
            </article>
          )
        })}
      </div>

      {reader && readerEdition && readerRecord && readerDefinition && (
        <div className="official-library-reader" role="region" aria-labelledby="official-library-reader-heading">
          <header>
            <div>
              <span className="eyebrow">{ui.readerEyebrow}</span>
              <h3 id="official-library-reader-heading">{readerEdition.title} · {documentKindLabels[reader.kind]}</h3>
              <p>
                {readerEdition.replayMode === "graded-replay"
                  ? ui.gradedReader(readerEdition.year)
                  : readerEdition.replayMode === "corrected-replay"
                    ? ui.correctedReader(readerEdition.year)
                    : ui.sourceReader}
              </p>
            </div>
            <button className="secondary-button" type="button" onClick={() => setReader(undefined)}>
              {ui.closeReader}
            </button>
          </header>
          <div className="official-library-reader-toolbar">
            <div className="official-library-reader-tabs" aria-label={ui.chooseDocumentAria}>
              {(["tasks", "solutions"] as const).map((kind) => readerDocuments?.[kind] && (
                <button
                  className={reader.kind === kind ? "active" : ""}
                  type="button"
                  aria-pressed={reader.kind === kind}
                  key={kind}
                  onClick={() => switchReaderDocument(kind)}
                >
                  {documentKindLabels[kind]}
                </button>
              ))}
            </div>
            <div className="official-library-page-controls" aria-label={ui.pageNavigationAria}>
              <button
                type="button"
                disabled={reader.pageNumber <= 1}
                onClick={() => setReader({ ...reader, pageNumber: reader.pageNumber - 1 })}
                aria-label={ui.previousPage}
              >
                ←
              </button>
              <strong>{ui.pageOf(reader.pageNumber, readerDefinition.pageCount)}</strong>
              <button
                type="button"
                disabled={reader.pageNumber >= readerDefinition.pageCount}
                onClick={() => setReader({ ...reader, pageNumber: reader.pageNumber + 1 })}
                aria-label={ui.nextPage}
              >
                →
              </button>
            </div>
          </div>
          <div className="official-library-pdf">
            <PdfPageCanvas
              blob={readerRecord.blob}
              pageNumber={reader.pageNumber}
              title={readerDefinition.title}
            />
          </div>
          <footer>
            <span>{readerRecord.filename}</span>
            <span>{ui.checksum}</span>
          </footer>
        </div>
      )}
    </section>
  )
}
