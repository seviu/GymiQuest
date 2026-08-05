import { useMemo, useState } from "react"
import { isAuthorValidationTask } from "../domain/authorValidation"
import { resolveTaskCurriculumPackage } from "../domain/curriculumPackage"
import {
  buildCodexExerciseReport,
  decodeExerciseReport,
  exerciseReportFilename,
  isGermanExerciseReport,
} from "../domain/exerciseReport"
import { topicForLocale } from "../i18n/curriculumContent"
import { useLocalization } from "../i18n/localization"
import { germanTopics } from "../subjects/german/content"
import { germanExamUiCopy } from "../subjects/german/examCopy"
import { germanCourseUiCopy } from "../subjects/german/uiCopy"
import { germanWritingUiCopy } from "../subjects/german/writingCopy"
import { germanComprehensionUiCopy } from "../subjects/german/comprehensionCopy"

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }
  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  textarea.remove()
  if (!copied) throw new Error("Copy failed")
}

function returnFromReport(): void {
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  window.location.assign("/")
}

export function ExerciseReportView({ encoded }: { encoded?: string }) {
  const { copy, locale, t } = useLocalization()
  const reference = useMemo(() => decodeExerciseReport(encoded), [encoded])
  const [issue, setIssue] = useState("")
  const [status, setStatus] = useState<"copied" | "link-copied" | "downloaded" | "error">()

  if (!reference) {
    return (
      <main className="exercise-report-shell">
        <section className="exercise-report-card invalid">
          <span className="exercise-report-mark" aria-hidden="true">!</span>
          <span className="eyebrow">{t("report.invalidEyebrow")}</span>
          <h1>{t("report.invalidTitle")}</h1>
          <p>{t("report.invalidBody")}</p>
          <nav className="exercise-report-navigation" aria-label={t("report.openApp")}>
            <button className="text-button" type="button" onClick={returnFromReport}>
              ← {copy.player.back}
            </button>
            <a className="primary-button" href="/">{t("report.openApp")}</a>
          </nav>
        </section>
      </main>
    )
  }

  const reportUrl = window.location.href
  const codexReport = buildCodexExerciseReport(reference, issue, reportUrl)
  const germanReference = isGermanExerciseReport(reference)
  const taskLabel = germanReference
    ? reference.session.kind === "exam"
      ? germanExamUiCopy[locale].cardTitle
      : reference.session.kind === "writing"
        ? germanWritingUiCopy[locale].cardTitle
        : reference.session.kind === "comprehension"
          ? germanComprehensionUiCopy[locale].homeTitle
        : germanCourseUiCopy[locale][reference.session.kind]
    : isAuthorValidationTask(reference.task)
      ? t("report.authorLab")
      : copy.player.taskKinds[reference.task.kind]
  const topicTitle = germanReference
    ? germanTopics[reference.question.topicId].shortTitle
    : topicForLocale(
        reference.question.topicId,
        reference.task.contentLocale ?? "de",
      ).shortTitle
  const curriculumLabel = germanReference
    ? `${reference.course.courseId}@${reference.course.courseVersion}`
    : (() => {
        const curriculumPackage = resolveTaskCurriculumPackage(reference.task)
        return curriculumPackage
          ? `${curriculumPackage.courseId}@${curriculumPackage.version}`
          : t("report.unknown")
      })()
  const reportSeed = germanReference ? reference.session.seed : reference.task.seed
  const generatorVersion = germanReference
    ? reference.course.generatorVersion
    : reference.question.generation?.version ?? reference.task.generation?.version ?? "?"

  const copyReport = async () => {
    try {
      await copyText(codexReport)
      setStatus("copied")
    } catch {
      setStatus("error")
    }
  }

  const copyLink = async () => {
    try {
      await copyText(reportUrl)
      setStatus("link-copied")
    } catch {
      setStatus("error")
    }
  }

  const downloadReport = () => {
    const url = URL.createObjectURL(new Blob([codexReport], { type: "text/markdown;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = exerciseReportFilename(reference)
    link.click()
    URL.revokeObjectURL(url)
    setStatus("downloaded")
  }

  return (
    <main className="exercise-report-shell">
      <section className="exercise-report-card">
        <header>
          <div>
            <nav className="exercise-report-navigation" aria-label={t("report.openApp")}>
              <button className="text-button" type="button" onClick={returnFromReport}>
                ← {copy.player.back}
              </button>
              <a href="/">{t("report.openApp")}</a>
            </nav>
            <span className="eyebrow">{t("report.eyebrow")}</span>
            <h1>{t("report.title")}</h1>
            <p>{t("report.privacy")}</p>
          </div>
          <span className="exercise-report-mark" aria-hidden="true">⚑</span>
        </header>

        <section className="exercise-report-question" aria-labelledby="reported-question-title">
          <div>
            <span>{taskLabel}</span>
            <span>{topicTitle}</span>
            <span>{t("report.question", { number: reference.question.index + 1 })}</span>
          </div>
          <h2 id="reported-question-title">{reference.question.prompt}</h2>
          <dl>
            <div><dt>Question ID</dt><dd>{reference.question.id}</dd></div>
            <div><dt>Seed</dt><dd>{reportSeed}</dd></div>
            <div><dt>Generator</dt><dd>v{generatorVersion}</dd></div>
            <div><dt>{t("report.curriculum")}</dt><dd>{curriculumLabel}</dd></div>
          </dl>
        </section>

        <label className="exercise-report-description" htmlFor="exercise-report-issue">
          <span>{t("report.describe")}</span>
          <small>{t("report.describeHint")}</small>
          <textarea
            id="exercise-report-issue"
            value={issue}
            onChange={(event) => {
              setIssue(event.target.value.slice(0, 4_000))
              setStatus(undefined)
            }}
            rows={6}
            maxLength={4_000}
            autoFocus
          />
        </label>

        <div className="exercise-report-actions">
          <button className="primary-button" type="button" disabled={!issue.trim()} onClick={() => void copyReport()}>
            {t("report.copyCodex")}
          </button>
          <button className="secondary-button" type="button" disabled={!issue.trim()} onClick={downloadReport}>
            {t("report.save")}
          </button>
          <button className="text-button" type="button" onClick={() => void copyLink()}>
            {t("report.copyLink")}
          </button>
        </div>

        <div className="exercise-report-status" aria-live="polite">
          {status === "copied" && <p>{t("report.copied")}</p>}
          {status === "link-copied" && <p>{t("report.linkCopied")}</p>}
          {status === "downloaded" && <p>{t("report.downloaded")}</p>}
          {status === "error" && <p className="error">{t("report.error")}</p>}
        </div>

        <aside>
          <strong>{t("report.stepsTitle")}</strong>
          <ol>
            <li>{t("report.stepDescribe")}</li>
            <li>{t("report.stepCopy")}</li>
            <li>{t("report.stepAttach")}</li>
          </ol>
        </aside>
      </section>
    </main>
  )
}
