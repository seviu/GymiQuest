import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buildAssignments, createSeededLearner } from "../domain/learningEngine"
import { createActiveLearningSession } from "../domain/session"
import { createActiveMockExam } from "../domain/mockExam"
import { createLearnerCourseIndex, touchCourse } from "../domain/courseIndex"
import { createEncryptedBackup, openEncryptedBackup, type GymiQuestBackupPayload } from "../infra/backup"
import { createInitialGermanCourseState } from "../subjects/german/courseState"
import {
  createActiveGermanSourcePractice,
  createGermanSourcePracticeState,
} from "../subjects/german/sourcePractice"
import { DataBackupPanel } from "./DataBackupPanel"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const now = new Date("2026-07-14T12:00:00.000Z")
const password = "Lernen-bleibt-2026"

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing native input setter")
  setter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

function submit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
}

function buttonWithText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === text,
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${text}`)
  return button
}

function encryptedFile(serialized: string, name = "family.gqbackup"): File {
  const file = new File([serialized], name, { type: "application/json" })
  Object.defineProperty(file, "text", {
    configurable: true,
    value: async () => serialized,
  })
  return file
}

describe("encrypted data backup panel", () => {
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

  it("does not export when password confirmation differs", async () => {
    const download = vi.fn()
    act(() => {
      root.render(
        <DataBackupPanel
          learner={createSeededLearner(now)}
          onRestore={async () => undefined}
          download={download}
        />,
      )
    })

    act(() => {
      setInputValue(container.querySelector("#backup-password")!, password)
      setInputValue(container.querySelector("#backup-password-confirmation")!, "Anderes-Passwort")
    })
    await act(async () => submit(container.querySelectorAll("form")[0]!))

    expect(download).not.toHaveBeenCalled()
    expect(container.textContent).toContain("Die beiden Passwörter stimmen nicht überein.")
  })

  it("creates a backup without requiring a password", async () => {
    const learner = createSeededLearner(now)
    const download = vi.fn()
    act(() => {
      root.render(
        <DataBackupPanel
          learner={learner}
          onRestore={async () => undefined}
          download={download}
        />,
      )
    })

    const passwordInput = container.querySelector("#backup-password") as HTMLInputElement
    const confirmationInput = container.querySelector("#backup-password-confirmation") as HTMLInputElement
    const restorePasswordInput = container.querySelector("#restore-password") as HTMLInputElement
    expect(passwordInput.required).toBe(false)
    expect(confirmationInput.required).toBe(false)
    expect(restorePasswordInput.required).toBe(false)
    expect(passwordInput.hasAttribute("minlength")).toBe(false)
    expect(confirmationInput.hasAttribute("minlength")).toBe(false)
    expect(restorePasswordInput.hasAttribute("minlength")).toBe(false)

    await act(async () => {
      submit(container.querySelectorAll("form")[0]!)
      await vi.waitFor(() => expect(download).toHaveBeenCalledOnce())
    })

    const [serialized] = download.mock.calls[0] as [string, string]
    await expect(openEncryptedBackup(serialized, "")).resolves.toMatchObject({
      learner: { learnerId: learner.learnerId },
    })
    expect(container.textContent).toContain("Sicherung erstellt.")
  })

  it("offers restore without an export form on a fresh profile", () => {
    act(() => {
      root.render(
        <DataBackupPanel
          learner={createSeededLearner(now)}
          onRestore={async () => undefined}
          restoreOnly
        />,
      )
    })

    expect(container.textContent).toContain("Vorhandenen Lernstand übernehmen")
    expect(container.textContent).toContain("bevor du neu beginnst")
    expect(container.querySelectorAll("form")).toHaveLength(1)
    expect(container.textContent).not.toContain("Sicherungsdatei erstellen")
    expect(container.textContent).toContain("Sicherung prüfen")
  })

  it("downloads an encrypted, dated backup containing the paused task", async () => {
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now)[0]!
    const session = createActiveLearningSession(task, now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.totalXp = 25
    const germanSourcePractice = {
      ...createGermanSourcePracticeState(),
      active: createActiveGermanSourcePractice(
        "zap-zh-lg-german-2025",
        "writing",
        "panel:german-source",
        now,
      ),
    }
    const courseIndex = touchCourse(createLearnerCourseIndex(now), "german", now)
    const download = vi.fn()
    act(() => {
      root.render(
        <DataBackupPanel
          learner={learner}
          activeSession={session}
          germanCourse={germanCourse}
          germanSourcePractice={germanSourcePractice}
          courseIndex={courseIndex}
          onRestore={async () => undefined}
          download={download}
        />,
      )
    })

    act(() => {
      setInputValue(container.querySelector("#backup-password")!, password)
      setInputValue(container.querySelector("#backup-password-confirmation")!, password)
    })
    await act(async () => {
      submit(container.querySelectorAll("form")[0]!)
      await vi.waitFor(() => expect(download).toHaveBeenCalledOnce())
    })

    const [serialized, filename] = download.mock.calls[0] as [string, string]
    expect(filename).toMatch(/^gymiquest-backup-\d{4}-\d{2}-\d{2}\.gqbackup$/)
    expect(serialized).not.toContain(learner.learnerId)
    expect(serialized).not.toContain(task.title)
    const restored = await openEncryptedBackup(serialized, password)
    expect(restored.germanCourse?.totalXp).toBe(25)
    expect(restored.germanSourcePractice).toEqual(germanSourcePractice)
    expect(restored.courseIndex?.activeCourseKey).toBe("zh-zap1-german@1")
    expect(container.textContent).toContain("Sicherung erstellt.")
  })

  it("previews a valid backup and restores only after explicit replacement", async () => {
    const learner = createSeededLearner(now)
    learner.totalXp = 144
    const task = buildAssignments(learner, now)[0]!
    const session = createActiveLearningSession(task, now)
    const activeMock = createActiveMockExam("panel:active-mock", now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    germanCourse.totalXp = 31
    germanCourse.topicProgress["reading-evidence"] = {
      ...germanCourse.topicProgress["reading-evidence"],
      status: "mastered",
      completedAt: now.toISOString(),
    }
    const courseIndex = touchCourse(createLearnerCourseIndex(now), "german", now)
    const serialized = await createEncryptedBackup(
      learner,
      session,
      password,
      now,
      activeMock,
      undefined,
      germanCourse,
      courseIndex,
    )
    const onRestore = vi.fn<(payload: GymiQuestBackupPayload) => Promise<void>>(
      async () => undefined,
    )
    act(() => {
      root.render(
        <DataBackupPanel
          learner={createSeededLearner(now)}
          onRestore={onRestore}
          download={() => undefined}
        />,
      )
    })

    const input = container.querySelector("#backup-file") as HTMLInputElement
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [encryptedFile(serialized)],
    })
    act(() => {
      input.dispatchEvent(new Event("change", { bubbles: true }))
      setInputValue(container.querySelector("#restore-password")!, password)
    })
    await act(async () => {
      submit(container.querySelectorAll("form")[1]!)
      await new Promise((resolve) => window.setTimeout(resolve, 200))
    })

    expect(onRestore).not.toHaveBeenCalled()
    expect(container.textContent).toContain("SICHERUNGSVORSCHAU")
    expect(container.textContent).toContain("Zürich ZAP1 Mathematik · Paket v1")
    expect(container.textContent).toContain("Deutsch (Schweiz) · ZAP1 Langgymnasium")
    expect(container.textContent).toContain("Zürich ZAP1 Deutsch · Paket v1")
    expect(container.textContent).toContain("Deutsch · Themen gelernt")
    expect(container.textContent).toContain("31")
    expect(container.textContent).toContain("144")
    expect(container.textContent).toContain("Pausierte Aufgabe")
    expect(container.textContent).toContain("Laufende Prüfung")
    expect(container.textContent).toContain("Probeprüfungen")

    await act(async () => buttonWithText(container, "Lokale Daten ersetzen").click())
    expect(onRestore).toHaveBeenCalledOnce()
    expect(onRestore.mock.calls[0]![0].activeSession).toEqual(session)
    expect(onRestore.mock.calls[0]![0].activeMock).toEqual(activeMock)
    expect(onRestore.mock.calls[0]![0].germanCourse).toEqual(germanCourse)
    expect(onRestore.mock.calls[0]![0].courseIndex).toEqual(courseIndex)
  })

  it("reports a wrong password without exposing or restoring the payload", async () => {
    const serialized = await createEncryptedBackup(
      createSeededLearner(now),
      undefined,
      password,
      now,
    )
    const onRestore = vi.fn<(payload: GymiQuestBackupPayload) => Promise<void>>(
      async () => undefined,
    )
    act(() => {
      root.render(
        <DataBackupPanel
          learner={createSeededLearner(now)}
          onRestore={onRestore}
          download={() => undefined}
        />,
      )
    })

    const input = container.querySelector("#backup-file") as HTMLInputElement
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [encryptedFile(serialized)],
    })
    act(() => {
      input.dispatchEvent(new Event("change", { bubbles: true }))
      setInputValue(container.querySelector("#restore-password")!, "Falsches-Passwort")
    })
    await act(async () => {
      submit(container.querySelectorAll("form")[1]!)
      await new Promise((resolve) => window.setTimeout(resolve, 200))
    })

    expect(container.textContent).toContain(
      "Das Passwort stimmt nicht oder die Sicherungsdatei wurde beschädigt.",
    )
    expect(container.textContent).not.toContain("SICHERUNGSVORSCHAU")
    expect(onRestore).not.toHaveBeenCalled()
  })
})
