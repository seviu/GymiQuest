import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  createExerciseReportReference,
  createGermanExamExerciseReportReference,
  createGermanComprehensionExerciseReportReference,
  createGermanExerciseReportReference,
  createGermanWritingExerciseReportReference,
  encodeExerciseReport,
} from "../domain/exerciseReport"
import { generateQuestionsForTask } from "../domain/generators"
import { buildAuthorValidationSample } from "../domain/authorValidation"
import { buildAssignments, createSeededLearner } from "../domain/learningEngine"
import { ExerciseReportView } from "./ExerciseReportView"
import {
  buildGermanAssignments,
  createInitialGermanCourseState,
  currentGermanQuestion,
  startGermanSession,
} from "../subjects/german/courseState"
import { buildGermanExamBlueprint, createActiveGermanExam } from "../subjects/german/exam"
import {
  buildGermanWritingForm,
  createActiveGermanWritingSession,
} from "../subjects/german/writing"
import {
  createActiveGermanComprehensionSession,
  germanComprehensionPromptById,
} from "../subjects/german/comprehension"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing native textarea setter")
  setter.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

describe("exercise report view", () => {
  let container: HTMLDivElement
  let root: Root
  const writeText = vi.fn(async (_value: string): Promise<void> => undefined)

  beforeEach(() => {
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
    writeText.mockClear()
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    })
    window.history.replaceState({}, "", "/exercise-report?data=test")
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.restoreAllMocks()
    window.history.replaceState({}, "", "/")
  })

  it("copies a reusable report after the tester describes the defect", async () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const task = buildAssignments(learner, new Date("2026-07-14T12:00:00.000Z"))[0]!
    const question = generateQuestionsForTask(task)[0]!
    const encoded = encodeExerciseReport(createExerciseReportReference(task, question, 0))

    act(() => root.render(<ExerciseReportView encoded={encoded} />))

    expect(container.textContent).toContain(question.prompt)
    expect(container.textContent).toContain("keinen Namen")
    expect(container.textContent).toContain("zh-zap1-math@1")
    const textarea = container.querySelector("textarea")
    if (!(textarea instanceof HTMLTextAreaElement)) throw new Error("Missing report description")
    act(() => setTextareaValue(textarea, "Die Erklärung widerspricht der Lösung."))
    const copy = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Kopieren",
    )
    if (!(copy instanceof HTMLButtonElement)) throw new Error("Missing copy button")
    expect(copy.disabled).toBe(false)

    await act(async () => copy.click())

    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0]![0]).toContain(`Task seed: ${task.seed}`)
    expect(writeText.mock.calls[0]![0]).toContain("Curriculum package: zh-zap1-math@1")
    expect(writeText.mock.calls[0]![0]).toContain("Die Erklärung widerspricht der Lösung.")
    expect(container.textContent).toContain("Bericht kopiert")
  })

  it("does not render untrusted report data", () => {
    act(() => root.render(<ExerciseReportView encoded="invalid" />))
    expect(container.textContent).toContain("Dieser Bericht ist unvollständig.")
    expect(container.querySelector("textarea")).toBeNull()
    expect(Array.from(container.querySelectorAll("button")).some((button) => (
      button.textContent?.includes("Zurück")
    ))).toBe(true)
    expect(container.querySelector('a[href="/"]')?.textContent).toContain("GymiQuest öffnen")
  })

  it("labels a zero-XP author sample as Prüflabor instead of a learner review", () => {
    const sample = buildAuthorValidationSample("coordinate-transformations", "exam", 3)
    const encoded = encodeExerciseReport(
      createExerciseReportReference(sample.task, sample.question, 0),
    )

    act(() => root.render(<ExerciseReportView encoded={encoded} />))

    expect(container.textContent).toContain("Prüflabor")
    expect(container.textContent).not.toContain("Wiederholung")
    expect(container.textContent).toContain(sample.question.prompt)
  })

  it("renders and copies a German report without learner answer data", async () => {
    const now = new Date("2026-07-17T12:00:00.000Z")
    let state = createInitialGermanCourseState("private-learner", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    state = startGermanSession(state, buildGermanAssignments(state, now)[0]!, now)
    const question = currentGermanQuestion(state)!
    const encoded = encodeExerciseReport(createGermanExerciseReportReference(
      state.activeSession!,
      question,
      0,
    ))

    act(() => root.render(<ExerciseReportView encoded={encoded} />))

    expect(container.textContent).toContain(question.prompt)
    expect(container.textContent).toContain("zh-zap1-german@1")
    expect(container.textContent).toContain("Lektion")
    expect(container.textContent).toContain("keinen Namen")
    const textarea = container.querySelector("textarea")
    if (!(textarea instanceof HTMLTextAreaElement)) throw new Error("Missing report description")
    act(() => setTextareaValue(textarea, "Eine Antwortoption ist missverständlich."))
    const copyButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Kopieren",
    )
    if (!(copyButton instanceof HTMLButtonElement)) throw new Error("Missing copy button")
    await act(async () => copyButton.click())

    const copied = writeText.mock.calls[0]![0]
    expect(copied).toContain("Subject: German")
    expect(copied).toContain(`Generator template: ${question.templateId}`)
    expect(copied).not.toContain("private-learner")
    expect(copied).not.toContain("selectedOptionId")
  })

  it("renders a German writing report as a writing studio prompt", () => {
    const session = createActiveGermanWritingSession("view-writing", new Date("2026-07-17T12:00:00.000Z"))
    const prompt = buildGermanWritingForm(session.seed).prompts[2]!
    const encoded = encodeExerciseReport(createGermanWritingExerciseReportReference(
      session,
      prompt,
      2,
    ))

    act(() => root.render(<ExerciseReportView encoded={encoded} />))

    expect(container.textContent).toContain(prompt.prompt)
    expect(container.textContent).toContain("Text verfassen trainieren")
    expect(container.textContent).toContain("Text verfassen")
    expect(container.textContent).not.toContain("Lektion")
    expect(container.textContent).not.toContain("Prüfungssimulation")
  })

  it("renders a German comprehension report as a human-reviewed short response", () => {
    const session = createActiveGermanComprehensionSession(
      "view-comprehension",
      [],
      new Date("2026-07-17T12:00:00.000Z"),
    )
    const prompt = germanComprehensionPromptById(session.promptId)!
    const encoded = encodeExerciseReport(
      createGermanComprehensionExerciseReportReference(session, prompt),
    )

    act(() => root.render(<ExerciseReportView encoded={encoded} />))

    expect(container.textContent).toContain(prompt.question)
    expect(container.textContent).toContain("Einen Textbeleg selbst formulieren")
    expect(container.textContent).toContain("Leseverständnis")
    expect(container.textContent).not.toContain("Lektion")
    expect(container.textContent).not.toContain("Prüfungssimulation")
  })

  it("renders a German timed-exam report as an exam rather than a lesson", async () => {
    const exam = createActiveGermanExam("view-exam", new Date("2026-07-17T12:00:00.000Z"))
    const question = buildGermanExamBlueprint(exam.seed).questions[6]!
    const encoded = encodeExerciseReport(createGermanExamExerciseReportReference(
      exam,
      question,
      6,
    ))

    act(() => root.render(<ExerciseReportView encoded={encoded} />))

    expect(container.textContent).toContain("Deutsch-Sprachprüfung trainieren")
    expect(container.textContent).not.toContain("Lektion")
    expect(container.textContent).toContain(question.prompt)
    const textarea = container.querySelector("textarea")
    if (!(textarea instanceof HTMLTextAreaElement)) throw new Error("Missing report description")
    act(() => setTextareaValue(textarea, "Die Prüfungsfrage ist unklar."))
    const copyButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "Kopieren",
    )
    if (!(copyButton instanceof HTMLButtonElement)) throw new Error("Missing copy button")
    await act(async () => copyButton.click())

    const copied = writeText.mock.calls[0]![0]
    expect(copied).toContain("Session kind: exam")
    expect(copied).toContain("buildGermanExamBlueprint(seed)")
    expect(copied).not.toContain("correctOptionId")
  })
})
