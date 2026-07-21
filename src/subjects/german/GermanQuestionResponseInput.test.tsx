import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { buildGermanExamBlueprint } from "./exam"
import {
  generateGermanQuestions,
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  isGermanSentenceAnalysisQuestion,
} from "./generators"
import type {
  GermanAcceptedTextResponse,
  GermanMatchingResponse,
  GermanMultiSelectResponse,
  GermanTruthGridResponse,
} from "./grading"
import { GermanQuestionResponseInput } from "./GermanQuestionResponseInput"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe("German structured response input", () => {
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

  it("renders seven accessible single-choice row groups and emits a partial autosave response", () => {
    const question = buildGermanExamBlueprint("truth-grid-ui")
      .questions.find(isGermanTruthGridQuestion)
    if (!question) throw new Error("Expected a truth-grid question")
    const onChange = vi.fn()

    act(() => {
      root.render(
        <GermanQuestionResponseInput
          question={question}
          matchingPlaceholder="Zuordnung wählen"
          onChange={onChange}
        />,
      )
    })

    const groups = container.querySelectorAll('[role="radiogroup"]')
    const radios = container.querySelectorAll('input[type="radio"]')
    expect(groups).toHaveLength(7)
    expect(radios).toHaveLength(21)
    expect(new Set(Array.from(radios).map((radio) => radio.getAttribute("name"))).size).toBe(7)

    act(() => (radios[0] as HTMLInputElement).click())
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0]![0]).toEqual({
      responseKind: "truth-grid",
      selections: [{ rowId: question.rows[0]!.id, status: "true" }],
    })
  })

  it("keeps prior row selections when another status changes", () => {
    const question = buildGermanExamBlueprint("truth-grid-ui:controlled")
      .questions.find(isGermanTruthGridQuestion)
    if (!question) throw new Error("Expected a truth-grid question")
    const response: GermanTruthGridResponse = {
      responseKind: "truth-grid",
      selections: [{ rowId: question.rows[0]!.id, status: "false" }],
    }
    const onChange = vi.fn()

    act(() => {
      root.render(
        <GermanQuestionResponseInput
          question={question}
          response={response}
          matchingPlaceholder="Zuordnung wählen"
          onChange={onChange}
        />,
      )
    })

    const secondRowTrue = container.querySelector(
      `input[name="${question.id}:${question.rows[1]!.id}"][value="true"]`,
    )
    if (!(secondRowTrue instanceof HTMLInputElement)) throw new Error("Missing second-row radio")
    act(() => secondRowTrue.click())

    expect(onChange.mock.calls[0]![0]).toEqual({
      responseKind: "truth-grid",
      selections: [
        { rowId: question.rows[0]!.id, status: "false" },
        { rowId: question.rows[1]!.id, status: "true" },
      ],
    })
  })

  it("renders six accessible binary rows and permits omitted answers", () => {
    const question = buildGermanExamBlueprint("binary-grid-ui")
      .questions.find(isGermanBinaryGridQuestion)
    if (!question) throw new Error("Expected a binary-grid question")
    const onChange = vi.fn()

    act(() => {
      root.render(
        <GermanQuestionResponseInput
          question={question}
          matchingPlaceholder="Zuordnung wählen"
          onChange={onChange}
        />,
      )
    })

    const groups = container.querySelectorAll('.german-binary-grid [role="radiogroup"]')
    const radios = container.querySelectorAll('.german-binary-grid input[type="radio"]')
    expect(groups).toHaveLength(6)
    expect(radios).toHaveLength(12)
    act(() => (radios[0] as HTMLInputElement).click())
    expect(onChange.mock.calls[0]![0]).toEqual({
      responseKind: "binary-grid",
      selections: [{ rowId: question.rows[0]!.id, status: "true" }],
    })
  })

  it("renders an accessible exact-two checkbox group and prevents a third selection", () => {
    const question = generateGermanQuestions({
      lessonId: "german-reading-evidence-v1",
      topicId: "reading-evidence",
      seed: "multi-select-ui",
      questionCount: 3,
    }).find(isGermanMultiSelectQuestion)
    if (!question) throw new Error("Expected a multi-select question")
    const response: GermanMultiSelectResponse = {
      responseKind: "multi-select",
      selectedOptionIds: question.options.slice(0, 2).map((option) => option.id),
    }
    const onChange = vi.fn()

    act(() => {
      root.render(
        <GermanQuestionResponseInput
          question={question}
          response={response}
          matchingPlaceholder="Zuordnung wählen"
          onChange={onChange}
        />,
      )
    })

    const fieldset = container.querySelector("fieldset.german-multi-select")
    const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[]
    expect(fieldset?.textContent).toContain("Wähle genau 2 Antworten")
    expect(checkboxes).toHaveLength(4)
    expect(checkboxes.filter((checkbox) => checkbox.checked)).toHaveLength(2)
    expect(checkboxes.filter((checkbox) => !checkbox.checked).every((checkbox) => checkbox.disabled)).toBe(true)

    act(() => checkboxes[0]!.click())
    expect(onChange).toHaveBeenCalledWith({
      responseKind: "multi-select",
      selectedOptionIds: [response.selectedOptionIds[1]],
    })
  })

  it("renders a labelled, bounded text field and emits an autosave-ready draft", () => {
    const question = generateGermanQuestions({
      lessonId: "german-grammar-correction-v1",
      topicId: "grammar-correction",
      seed: "accepted-text-ui",
      questionCount: 3,
    }).find(isGermanAcceptedTextQuestion)
    if (!question) throw new Error("Expected an accepted-text question")
    const onChange = vi.fn()

    act(() => {
      root.render(
        <GermanQuestionResponseInput
          question={question}
          matchingPlaceholder="Zuordnung wählen"
          onChange={onChange}
        />,
      )
    })

    const textarea = container.querySelector("textarea")
    const label = container.querySelector("label")
    if (!(textarea instanceof HTMLTextAreaElement)) throw new Error("Missing accepted-text field")
    expect(label?.textContent).toContain(question.inputLabel)
    expect(textarea.maxLength).toBe(question.maximumLength)
    expect(textarea.getAttribute("spellcheck")).toBe("false")

    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
    act(() => {
      setValue?.call(textarea, "Mein korrigierter Satz.")
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith({
      responseKind: "accepted-text",
      text: "Mein korrigierter Satz.",
    })
  })

  it("renders four independent sentence-analysis choices and permits a repeated wrong question", () => {
    const question = generateGermanQuestions({
      lessonId: "german-sentence-structure-v1",
      topicId: "sentence-structure",
      seed: "sentence-analysis-ui",
      questionCount: 8,
    }).find(isGermanSentenceAnalysisQuestion)
    if (!question) throw new Error("Expected a sentence-analysis question")
    const repeatedTargetId = question.targets[0]!.id
    const response: GermanMatchingResponse = {
      responseKind: "matching",
      matches: [{ itemId: question.items[0]!.id, targetId: repeatedTargetId }],
    }
    const onChange = vi.fn()

    act(() => {
      root.render(
        <GermanQuestionResponseInput
          question={question}
          response={response}
          matchingPlaceholder="Frage wählen"
          onChange={onChange}
        />,
      )
    })

    const selects = Array.from(container.querySelectorAll("select")) as HTMLSelectElement[]
    expect(selects).toHaveLength(4)
    const setValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set
    act(() => {
      setValue?.call(selects[1], repeatedTargetId)
      selects[1]!.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(onChange).toHaveBeenCalledWith({
      responseKind: "matching",
      matches: [
        { itemId: question.items[0]!.id, targetId: repeatedTargetId },
        { itemId: question.items[1]!.id, targetId: repeatedTargetId },
      ],
    })
  })

  it("reveals the canonical correction without treating arbitrary text as accepted", () => {
    const question = generateGermanQuestions({
      lessonId: "german-grammar-correction-v1",
      topicId: "grammar-correction",
      seed: "accepted-text-ui:reveal",
      questionCount: 3,
    }).find(isGermanAcceptedTextQuestion)
    if (!question) throw new Error("Expected an accepted-text question")
    const response: GermanAcceptedTextResponse = {
      responseKind: "accepted-text",
      text: "Eine nicht akzeptierte Korrektur.",
    }

    act(() => {
      root.render(
        <GermanQuestionResponseInput
          question={question}
          response={response}
          disabled
          reveal
          matchingPlaceholder="Zuordnung wählen"
          onChange={vi.fn()}
        />,
      )
    })

    const textarea = container.querySelector("textarea")
    expect(textarea?.getAttribute("aria-invalid")).toBe("true")
    expect(textarea?.disabled).toBe(true)
    expect(container.textContent).toContain(`Beispiellösung: ${question.acceptedAnswers[0]!.text}`)
  })
})
