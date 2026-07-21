import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LocalizationProvider } from "../../i18n/localization"
import {
  answerGermanStartCheck,
  createInitialGermanCourseState,
  startGermanStartCheck,
} from "./courseState"
import { germanStartCheckQuestions } from "./content"
import {
  answerGermanExamQuestion,
  buildGermanExamBlueprint,
  createActiveGermanExam,
  gradeGermanExam,
} from "./exam"
import { GermanCourseView } from "./GermanCourseView"
import { GermanExamResultView } from "./GermanExamResultView"
import { isGermanChoiceQuestion } from "./generators"
import { createGermanSourcePracticeState } from "./sourcePractice"

describe("German assessment mistake review", () => {
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

  it("shows the selected answer, correct answer, and explanation after the start check", () => {
    let state = createInitialGermanCourseState("mistake-review", new Date("2026-07-18T08:00:00.000Z"))
    state = startGermanStartCheck(state, new Date("2026-07-18T08:01:00.000Z"))
    germanStartCheckQuestions.forEach((question, index) => {
      state = answerGermanStartCheck(
        state,
        index === 0 ? 1 : question.correctIndex,
        new Date(`2026-07-18T08:0${index + 2}:00.000Z`),
      )
    })

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="de">
          <GermanCourseView
            state={state}
            displayName="Mia"
            sourcePracticeState={createGermanSourcePracticeState()}
            onChange={() => undefined}
            onSourcePracticeStateChange={() => undefined}
            onSubjectChange={() => undefined}
            onEditProfile={() => undefined}
            onOpenCompanion={() => undefined}
            onResetSubject={() => undefined}
          />
        </LocalizationProvider>,
      )
    })

    expect(container.textContent).toContain("FEHLER-RÜCKBLICK")
    expect(container.textContent).toContain("1 Fehler")
    expect(container.textContent).toContain("Lea hatte den Schirm gekauft.")
    expect(container.textContent).toContain("Draussen regnete es.")
    expect(container.textContent).toContain("Der nasse Schirm ist der sichere Textbeleg")
  })

  it("opens a strict-exam review with the wrong and correct options visibly distinguished", () => {
    const start = new Date("2026-07-18T09:00:00.000Z")
    let exam = createActiveGermanExam("exam-review-ui", start)
    const blueprint = buildGermanExamBlueprint(exam.seed, exam.blueprintVersion)
    const question = blueprint.questions.find(isGermanChoiceQuestion)
    if (!question) throw new Error("Expected a choice question")
    const wrongOption = question.options.find((option) => option.id !== question.correctOptionId)!
    exam = answerGermanExamQuestion(exam, question.id, wrongOption.id, start)
    const result = gradeGermanExam(exam, "submitted", new Date("2026-07-18T09:10:00.000Z"))
    const onExit = vi.fn()

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="de">
          <GermanExamResultView result={result} onExit={onExit} />
        </LocalizationProvider>,
      )
    })

    expect(container.textContent).toContain("PRÜFUNGS-RÜCKBLICK")
    expect(container.textContent).toContain("Deine Fehler mit den richtigen Lösungen")
    expect(container.textContent).toContain("Deine Antwort")
    expect(container.textContent).toContain("Richtige Antwort")
    expect(Array.from(container.querySelectorAll(".german-answer-options button.incorrect")).some((button) => (
      button.textContent?.includes(wrongOption.label)
    ))).toBe(true)
    expect(container.querySelectorAll(".german-answer-options button.correct").length).toBeGreaterThan(0)

    const back = Array.from(container.querySelectorAll("button")).find((button) => (
      button.textContent?.includes("Zurück zum Deutsch-Lernplan")
    ))
    if (!(back instanceof HTMLButtonElement)) throw new Error("Missing review exit")
    act(() => back.click())
    expect(onExit).toHaveBeenCalledOnce()
  })
})
