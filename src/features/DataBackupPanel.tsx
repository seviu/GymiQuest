import { useState, type FormEvent } from "react"
import type { ActiveArchivePractice } from "../domain/archivePractice"
import { resolveLearnerCurriculumPackage } from "../domain/curriculumPackage"
import type { LearnerState, LearningLocale } from "../domain/model"
import type { ActiveMockExam } from "../domain/mockExam"
import type { ActiveLearningSession } from "../domain/session"
import type { LearnerCourseIndex } from "../domain/courseIndex"
import { useLocalization } from "../i18n/localization"
import { translateMessage } from "../i18n/messages"
import {
  BackupError,
  backupFilename,
  createEncryptedBackup,
  openEncryptedBackup,
  type GymiQuestBackupPayload,
} from "../infra/backup"
import type { GermanCourseState } from "../subjects/german/courseState"
import type { GermanSourcePracticeState } from "../subjects/german/sourcePractice"
import { GERMAN_CURRICULUM_PACKAGE, germanTopicIds } from "../subjects/german/package"

interface PanelStatus {
  kind: "success" | "error"
  message: string
}

export type BackupDownload = (serialized: string, filename: string) => void

export function downloadBackupText(serialized: string, filename: string): void {
  const blob = new Blob([serialized], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.hidden = true
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function errorMessage(error: unknown, locale: LearningLocale): string {
  return error instanceof BackupError
    ? translateMessage(locale, `backup.error.${error.code}`)
    : translateMessage(locale, "backup.error.generic")
}

function formatBackupDate(value: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function DataBackupPanel({
  learner,
  activeSession,
  activeMock,
  activeArchivePractice,
  germanCourse,
  germanSourcePractice,
  courseIndex,
  onRestore,
  download = downloadBackupText,
  restoreOnly = false,
}: {
  learner: LearnerState
  activeSession?: ActiveLearningSession
  activeMock?: ActiveMockExam
  activeArchivePractice?: ActiveArchivePractice
  germanCourse?: GermanCourseState
  germanSourcePractice?: GermanSourcePracticeState
  courseIndex?: LearnerCourseIndex
  onRestore: (payload: GymiQuestBackupPayload) => Promise<void>
  download?: BackupDownload
  restoreOnly?: boolean
}) {
  const { locale, intlLocale, t } = useLocalization()
  const [exportPassphrase, setExportPassphrase] = useState("")
  const [exportConfirmation, setExportConfirmation] = useState("")
  const [exportStatus, setExportStatus] = useState<PanelStatus>()
  const [importPassphrase, setImportPassphrase] = useState("")
  const [selectedFile, setSelectedFile] = useState<File>()
  const [importStatus, setImportStatus] = useState<PanelStatus>()
  const [pendingRestore, setPendingRestore] = useState<GymiQuestBackupPayload>()
  const [busyAction, setBusyAction] = useState<"export" | "inspect" | "restore">()

  const createBackup = async (event: FormEvent) => {
    event.preventDefault()
    setExportStatus(undefined)
    if (exportPassphrase !== exportConfirmation) {
      setExportStatus({ kind: "error", message: t("backup.error.passwordMismatch") })
      return
    }
    setBusyAction("export")
    try {
      const serialized = await createEncryptedBackup(
        learner,
        activeSession,
        exportPassphrase,
        new Date(),
        activeMock,
        activeArchivePractice,
        germanCourse,
        courseIndex,
        germanSourcePractice,
      )
      download(serialized, backupFilename())
      setExportPassphrase("")
      setExportConfirmation("")
      setExportStatus({
        kind: "success",
        message: t("backup.created"),
      })
    } catch (error) {
      setExportStatus({ kind: "error", message: errorMessage(error, locale) })
    } finally {
      setBusyAction(undefined)
    }
  }

  const inspectBackup = async (event: FormEvent) => {
    event.preventDefault()
    setImportStatus(undefined)
    setPendingRestore(undefined)
    if (!selectedFile) {
      setImportStatus({ kind: "error", message: t("backup.error.chooseFile") })
      return
    }
    if (selectedFile.size > 10_000_000) {
      setImportStatus({ kind: "error", message: t("backup.error.too-large") })
      return
    }

    setBusyAction("inspect")
    try {
      const payload = await openEncryptedBackup(
        await selectedFile.text(),
        importPassphrase,
      )
      setPendingRestore(payload)
      setImportPassphrase("")
      setImportStatus({
        kind: "success",
        message: t("backup.inspected"),
      })
    } catch (error) {
      setImportStatus({ kind: "error", message: errorMessage(error, locale) })
    } finally {
      setBusyAction(undefined)
    }
  }

  const restore = async () => {
    if (!pendingRestore) return
    setBusyAction("restore")
    setImportStatus(undefined)
    try {
      await onRestore(pendingRestore)
      setPendingRestore(undefined)
      setSelectedFile(undefined)
      setImportStatus({ kind: "success", message: t("backup.restored") })
    } catch (error) {
      setImportStatus({ kind: "error", message: errorMessage(error, locale) })
    } finally {
      setBusyAction(undefined)
    }
  }

  const pendingCurriculumPackage = pendingRestore
    ? resolveLearnerCurriculumPackage(pendingRestore.learner)
    : undefined
  const pendingMastered = pendingRestore && pendingCurriculumPackage
    ? pendingCurriculumPackage.topicIds.filter(
        (topicId) => pendingRestore.learner.mastery[topicId]?.status === "mastered",
      ).length
    : 0
  const pendingGermanMastered = pendingRestore?.germanCourse
    ? germanTopicIds.filter((topicId) => Boolean(
        pendingRestore.germanCourse?.topicProgress[topicId].completedAt,
      )).length
    : 0

  return (
    <section className={`progress-panel data-backup-panel${restoreOnly ? " restore-only" : ""}`} aria-labelledby="data-backup-title">
      <div className="progress-panel-heading">
        <div>
          <span className="eyebrow">{restoreOnly ? t("backup.restoreOnlyEyebrow") : t("backup.eyebrow")}</span>
          <h2 id="data-backup-title">{restoreOnly ? t("backup.restoreOnlyTitle") : t("backup.title")}</h2>
        </div>
        <span>{t("backup.noAccount")}</span>
      </div>
      <p className="data-backup-intro">
        {restoreOnly
          ? t("backup.restoreOnlyIntro")
          : t("backup.intro")}
      </p>

      <div className="data-backup-grid">
        {!restoreOnly && (
          <form className="backup-form" onSubmit={createBackup}>
            <div className="backup-form-heading">
              <span aria-hidden="true">↓</span>
              <div><strong>{t("backup.create")}</strong><small>{t("backup.createDetail")}</small></div>
            </div>
            <label htmlFor="backup-password">{t("backup.password")}</label>
            <input
              id="backup-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="backup-password-warning"
              value={exportPassphrase}
              onChange={(event) => setExportPassphrase(event.target.value)}
              placeholder={t("backup.passwordPlaceholder")}
            />
            <label htmlFor="backup-password-confirmation">{t("backup.repeatPassword")}</label>
            <input
              id="backup-password-confirmation"
              type="password"
              autoComplete="new-password"
              aria-describedby="backup-password-warning"
              value={exportConfirmation}
              onChange={(event) => setExportConfirmation(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={busyAction !== undefined}>
              {busyAction === "export" ? t("backup.encrypting") : t("backup.createFile")}
            </button>
            {exportStatus && <p className={`backup-status ${exportStatus.kind}`} role="status">{exportStatus.message}</p>}
          </form>
        )}

        <form className="backup-form" onSubmit={inspectBackup}>
          <div className="backup-form-heading">
            <span aria-hidden="true">↑</span>
            <div><strong>{t("backup.restore")}</strong><small>{t("backup.restoreDetail")}</small></div>
          </div>
          <input
            id="backup-file"
            className="visually-hidden-file"
            type="file"
            accept=".gqbackup,application/json"
            onChange={(event) => {
              setSelectedFile(event.target.files?.[0])
              setPendingRestore(undefined)
              setImportStatus(undefined)
            }}
          />
          <label className="backup-file-label" htmlFor="backup-file">
            <span>{selectedFile?.name ?? t("backup.chooseFile")}</span>
          </label>
          <label htmlFor="restore-password">{t("backup.password")}</label>
          <input
            id="restore-password"
            type="password"
            autoComplete="current-password"
            aria-describedby="backup-password-warning"
            value={importPassphrase}
            onChange={(event) => setImportPassphrase(event.target.value)}
          />
          <button className="secondary-button" type="submit" disabled={busyAction !== undefined}>
            {busyAction === "inspect" ? t("backup.checking") : t("backup.check")}
          </button>
          {importStatus && <p className={`backup-status ${importStatus.kind}`} role="status">{importStatus.message}</p>}
        </form>
      </div>

      {pendingRestore && (
        <div className="restore-preview" aria-live="polite">
          <div className="restore-preview-copy">
            <span>{t("backup.previewEyebrow")}</span>
            <strong>{t("backup.previewTitle", { date: formatBackupDate(pendingRestore.createdAt, intlLocale) })}</strong>
            {pendingCurriculumPackage && (
              <p>
                <strong>{pendingCurriculumPackage.title} · Paket v{pendingCurriculumPackage.version}</strong><br />
                {pendingCurriculumPackage.scope.learnerLanguageLabel} · {pendingCurriculumPackage.scope.track}
              </p>
            )}
            {pendingRestore.germanCourse && (
              <p>
                <strong>{GERMAN_CURRICULUM_PACKAGE.title} · Paket v{GERMAN_CURRICULUM_PACKAGE.version}</strong><br />
                Deutsch · ZAP1 Langgymnasium
              </p>
            )}
            <p>{t("backup.previewWarning")}</p>
          </div>
          <div className="restore-preview-stats">
            <div><strong>{pendingMastered}/{pendingCurriculumPackage?.topicIds.length ?? 0}</strong><span>{t("backup.topicsLearned")}</span></div>
            <div><strong>{pendingRestore.learner.totalXp}</strong><span>XP</span></div>
            <div><strong>{pendingRestore.learner.learningEvents.length}</strong><span>{t("backup.rounds")}</span></div>
            <div><strong>{pendingRestore.learner.mockHistory.length}</strong><span>{t("backup.mocks")}</span></div>
            <div><strong>{pendingRestore.learner.archivePracticeHistory.length}</strong><span>{t("backup.archiveRuns")}</span></div>
            <div><strong>{pendingRestore.activeSession ? t("backup.yes") : t("backup.no")}</strong><span>{t("backup.pausedTask")}</span></div>
            <div><strong>{pendingRestore.activeMock ? t("backup.yes") : t("backup.no")}</strong><span>{t("backup.runningExam")}</span></div>
            <div><strong>{pendingRestore.activeArchivePractice ? t("backup.yes") : t("backup.no")}</strong><span>{t("backup.runningArchive")}</span></div>
            {pendingRestore.germanCourse && (
              <>
                <div><strong>{pendingGermanMastered}/{germanTopicIds.length}</strong><span>Deutsch · {t("backup.topicsLearned")}</span></div>
                <div><strong>{pendingRestore.germanCourse.totalXp}</strong><span>Deutsch · XP</span></div>
                <div><strong>{pendingRestore.germanCourse.activeSession || pendingRestore.germanCourse.activeExam ? t("backup.yes") : t("backup.no")}</strong><span>Deutsch · {t("backup.pausedTask")}</span></div>
                <div><strong>{pendingRestore.germanCourse.examHistory.length}</strong><span>Deutsch · {t("backup.mocks")}</span></div>
              </>
            )}
          </div>
          <div className="restore-preview-actions">
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setPendingRestore(undefined)
                setImportStatus(undefined)
              }}
            >
              {t("common.cancel")}
            </button>
            <button className="danger-button" type="button" disabled={busyAction !== undefined} onClick={restore}>
              {busyAction === "restore" ? t("backup.restoring") : t("backup.replace")}
            </button>
          </div>
        </div>
      )}

      <p className="backup-warning" id="backup-password-warning"><strong>{t("backup.important")}</strong> {t("backup.passwordWarning")}</p>
    </section>
  )
}
