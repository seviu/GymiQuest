import { describe, expect, it } from "vitest"
import {
  buildCodexExerciseReport,
  buildExerciseReportUrl,
  createExerciseReportReference,
  createGermanExamExerciseReportReference,
  createGermanComprehensionExerciseReportReference,
  createGermanExerciseReportReference,
  createGermanWritingExerciseReportReference,
  decodeExerciseReport,
  encodeExerciseReport,
  exerciseReportFilename,
  isGermanExerciseReport,
  isMathematicsExerciseReport,
} from "./exerciseReport"
import { generateQuestionsForTask } from "./generators"
import { buildAuthorValidationSample } from "./authorValidation"
import { buildAssignments, createSeededLearner } from "./learningEngine"
import {
  buildGermanAssignments,
  createInitialGermanCourseState,
  currentGermanQuestion,
  germanSessionQuestions,
  startGermanSession,
} from "../subjects/german/courseState"
import {
  generateGermanQuestions,
  isGermanAcceptedTextQuestion,
  isGermanMultiSelectQuestion,
} from "../subjects/german/generators"
import { buildGermanExamBlueprint, createActiveGermanExam } from "../subjects/german/exam"
import {
  buildGermanWritingForm,
  createActiveGermanWritingSession,
  updateGermanWritingDraft,
} from "../subjects/german/writing"
import {
  createActiveGermanComprehensionSession,
  germanComprehensionPromptById,
  updateGermanComprehensionSession,
} from "../subjects/german/comprehension"

const now = new Date("2026-07-14T12:00:00.000Z")

function encodeArbitraryReport(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return globalThis.btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "")
}

describe("exercise defect reports", () => {
  it("round-trips a deterministic, privacy-bounded question reference", () => {
    const learner = createSeededLearner(now)
    learner.displayName = "Private Learner Name"
    const task = buildAssignments(learner, now)[0]!
    const question = generateQuestionsForTask(task)[0]!
    const reference = createExerciseReportReference(task, question, 0)

    const encoded = encodeExerciseReport(reference)
    const decoded = decodeExerciseReport(encoded)

    expect(decoded).toEqual(reference)
    expect(encoded).not.toContain(learner.displayName)
    expect(JSON.stringify(reference)).not.toContain(learner.displayName)
    expect(reference.question).not.toHaveProperty("answer")
    expect(reference.task.curriculum).toEqual({
      courseId: "zh-zap1-math",
      version: 1,
    })
  })

  it("round-trips a paced lesson with its realized replay path", () => {
    const learner = createSeededLearner(now)
    const task = structuredClone(buildAssignments(learner, now)[0]!)
    if (!task.generation || !task.pacing) throw new Error("Expected a paced lesson")
    task.generation.difficultyBands = ["foundation", "foundation", "exam"]
    const questionIndex = 1
    const question = generateQuestionsForTask(task)[questionIndex]!
    const reference = createExerciseReportReference(task, question, questionIndex)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))

    expect(decoded && isMathematicsExerciseReport(decoded)).toBe(true)
    if (!decoded || !isMathematicsExerciseReport(decoded)) {
      throw new Error("Expected a Mathematics report")
    }
    expect(decoded.task.pacing).toEqual({
      version: 1,
      mode: "steady",
    })
    expect(decoded.task.generation?.difficultyBands).toEqual([
      "foundation",
      "foundation",
      "exam",
    ])
    expect(decoded.question.generation).toMatchObject({
      version: 5,
      difficultyBand: "foundation",
    })
    expect(generateQuestionsForTask(decoded.task)[questionIndex]).toEqual(question)
  })

  it("keeps pacing optional for a legacy lesson report", () => {
    const task = structuredClone(buildAssignments(createSeededLearner(now), now)[0]!)
    delete task.pacing
    const question = generateQuestionsForTask(task)[0]!
    const reference = createExerciseReportReference(task, question, 0)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))

    expect(decoded && isMathematicsExerciseReport(decoded)).toBe(true)
    if (!decoded || !isMathematicsExerciseReport(decoded)) {
      throw new Error("Expected a Mathematics report")
    }
    expect(decoded.task.pacing).toBeUndefined()
    expect(generateQuestionsForTask(decoded.task)[0]).toEqual(question)
  })

  it("round-trips an Italian question reference without falling back during reproduction", () => {
    const learner = createSeededLearner(now)
    const task = { ...buildAssignments(learner, now)[0]!, contentLocale: "it" as const }
    const question = generateQuestionsForTask(task)[0]!
    const reference = createExerciseReportReference(task, question, 0)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))

    expect(decoded && isMathematicsExerciseReport(decoded)).toBe(true)
    if (!decoded || !isMathematicsExerciseReport(decoded)) throw new Error("Expected Mathematics report")
    expect(decoded.task.contentLocale).toBe("it")
    expect(decoded?.question.prompt).toBe(question.prompt)
    expect(question.prompt).not.toMatch(/\b(?:Berechne|Bestimme|Welche)\b/u)
  })

  it("round-trips a Spanish question reference without falling back during reproduction", () => {
    const learner = createSeededLearner(now)
    const task = { ...buildAssignments(learner, now)[0]!, contentLocale: "es" as const }
    const question = generateQuestionsForTask(task)[0]!
    const reference = createExerciseReportReference(task, question, 0)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))

    expect(decoded && isMathematicsExerciseReport(decoded)).toBe(true)
    if (!decoded || !isMathematicsExerciseReport(decoded)) throw new Error("Expected Mathematics report")
    expect(decoded.task.contentLocale).toBe("es")
    expect(decoded?.question.prompt).toBe(question.prompt)
    expect(question.prompt).not.toMatch(/\b(?:Berechne|Bestimme|Welche|Calculate|Which|Calcola|Quale)\b/u)
  })

  it("builds a shareable route and a Codex-ready reproduction report", () => {
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now)[0]!
    const question = generateQuestionsForTask(task)[0]!
    const reference = createExerciseReportReference(task, question, 0)
    const reportUrl = buildExerciseReportUrl(reference, "https://gymiquest.pages.dev")
    const parsedUrl = new URL(reportUrl)

    expect(parsedUrl.pathname).toBe("/exercise-report")
    expect(decodeExerciseReport(parsedUrl.searchParams.get("data") ?? undefined)).toEqual(reference)

    const report = buildCodexExerciseReport(
      reference,
      "Die richtige Eingabe wird als falsch bewertet.",
      reportUrl,
    )
    expect(report).toContain("# GymiQuest exercise defect")
    expect(report).toContain(`Task seed: ${task.seed}`)
    expect(report).toContain("Curriculum package: zh-zap1-math@1")
    expect(report).toContain(`Question ID: ${question.id}`)
    expect(report).toContain("Generator family:")
    expect(report).toContain("Generator template:")
    expect(report).toContain(question.prompt)
    expect(report).toContain("generateQuestionsForTask(task)")
    expect(report).toContain("Die richtige Eingabe wird als falsch bewertet.")
    expect(report).toContain("no learner name, typed answer, or progress history")
    expect(exerciseReportFilename(reference)).toMatch(/^gymiquest-report-[a-z0-9-]+-1\.md$/u)
  })

  it("rejects malformed, oversized, and cross-topic report payloads", () => {
    expect(decodeExerciseReport("not-base64-json")).toBeUndefined()
    expect(decodeExerciseReport("a".repeat(100_001))).toBeUndefined()

    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now)[0]!
    const question = generateQuestionsForTask(task)[0]!
    const reference = createExerciseReportReference(task, question, 0)
    const questionGeneration = reference.question.generation
    if (!questionGeneration) {
      throw new Error("Expected versioned question generation metadata")
    }
    const invalid = {
      ...reference,
      question: { ...reference.question, topicId: "cube-nets" },
    }
    expect(decodeExerciseReport(encodeArbitraryReport(invalid))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      task: {
        ...reference.task,
        curriculum: { courseId: "zh-zap1-math", version: 99 },
      },
    }))).toBeUndefined()

    const invalidTasks = [
      {
        ...reference.task,
        pacing: { version: 1, mode: "invented" },
      },
      {
        ...reference.task,
        pacing: { version: 1, mode: "accelerated" },
      },
      {
        ...reference.task,
        kind: "review",
      },
      {
        ...reference.task,
        generation: {
          ...reference.task.generation,
          difficultyBands: ["foundation", "standard"],
        },
      },
      {
        ...reference.task,
        generation: {
          ...reference.task.generation,
          difficultyBands: ["foundation", "foundation", "exam"],
        },
      },
      {
        ...reference.task,
        generation: undefined,
      },
    ]
    for (const invalidTask of invalidTasks) {
      expect(decodeExerciseReport(encodeArbitraryReport({
        ...reference,
        task: invalidTask,
      }))).toBeUndefined()
    }
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: {
        ...reference.question,
        generation: {
          ...questionGeneration,
          difficultyBand: "exam",
        },
      },
    }))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: {
        ...reference.question,
        generation: {
          ...questionGeneration,
          candidateCount: 0,
        },
      },
    }))).toBeUndefined()
  })

  it("identifies author-lab reports while preserving exact task replay", () => {
    const sample = buildAuthorValidationSample("cube-nets", "exam", 7)
    const reference = createExerciseReportReference(sample.task, sample.question, 0)
    const report = buildCodexExerciseReport(
      reference,
      "Die Zeichnung wird auf dem iPad abgeschnitten.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )

    expect(report).toContain("Report context: author validation lab")
    expect(report).toContain(`Task seed: ${sample.task.seed}`)
    expect(generateQuestionsForTask(reference.task)[0]).toEqual(sample.question)
  })

  it("carries v5 family provenance into a reproducible Codex report", () => {
    const sample = Array.from({ length: 40 }, (_, index) =>
      buildAuthorValidationSample("number-constraints", "exam", index + 1)
    ).find((candidate) => candidate.question.provenance !== undefined)

    expect(sample).toBeDefined()
    if (!sample) throw new Error("Expected a v5 archive-expansion sample")
    const reference = createExerciseReportReference(sample.task, sample.question, 0)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))
    const report = buildCodexExerciseReport(
      reference,
      "The complete set looks wrong.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )

    expect(decoded && isMathematicsExerciseReport(decoded)).toBe(true)
    if (!decoded || !isMathematicsExerciseReport(decoded)) throw new Error("Expected Mathematics report")
    expect(decoded.question.provenance).toEqual(sample.question.provenance)
    expect(report).toContain(`Generator family: ${sample.question.provenance?.familyId}`)
    expect(report).toContain(`Generator template: ${sample.question.provenance?.templateId}@1`)
    expect(generateQuestionsForTask(reference.task)[0]).toEqual(sample.question)
  })

  it("round-trips an answer-free, reproducible German question reference", () => {
    let state = createInitialGermanCourseState("Private Learner Name", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    const assignment = buildGermanAssignments(state, now)[0]!
    state = startGermanSession(state, assignment, now)
    const session = state.activeSession!
    const question = currentGermanQuestion(state)!
    const reference = createGermanExerciseReportReference(session, question, session.questionIndex)
    const encoded = encodeExerciseReport(reference)
    const decoded = decodeExerciseReport(encoded)

    expect(decoded).toEqual(reference)
    expect(isGermanExerciseReport(decoded!)).toBe(true)
    expect(encoded).not.toContain("Private Learner Name")
    expect(JSON.stringify(reference)).not.toContain("selectedOptionId")
    expect(JSON.stringify(reference)).not.toContain("answers")
    expect(reference.course).toMatchObject({
      courseId: "zh-zap1-german",
      courseVersion: 1,
      generatorVersion: 7,
      corpusVersion: 1,
      scoringPolicyVersion: 1,
    })

    const reproduced = generateGermanQuestions({
      lessonId: session.lessonId as Exclude<typeof session.lessonId, "german-assessment-v1">,
      topicId: question.topicId,
      seed: session.seed,
      questionCount: session.questionCount,
      difficultyBand: question.difficultyBand,
      excludedTemplateIds: session.excludedTemplateIdsByTopic[question.topicId],
    })[session.questionIndex]
    expect(reproduced).toEqual(question)

    const reportUrl = buildExerciseReportUrl(reference, "https://gymiquest.pages.dev")
    const report = buildCodexExerciseReport(reference, "Eine Antwortoption ist missverständlich.", reportUrl)
    expect(report).toContain("Subject: German")
    expect(report).toContain("Curriculum package: zh-zap1-german@1")
    expect(report).toContain(`Generator family: ${question.familyId}`)
    expect(report).toContain(`Generator template: ${question.templateId}`)
    expect(report).toContain("Difficulty band: foundation")
    expect(report).toContain(`Scoring rule: ${reference.question.scoringRuleId}`)
    expect(report).toContain("no learner name, selected option, typed answer, or progress history")
    expect(exerciseReportFilename(reference)).toMatch(/^gymiquest-report-[a-z0-9-]+-1\.md$/u)
  })

  it("round-trips a German writing prompt without leaking the learner draft", () => {
    let session = createActiveGermanWritingSession("reportable-writing", now)
    const form = buildGermanWritingForm(session.seed)
    const promptIndex = 1
    const prompt = form.prompts[promptIndex]!
    const privateDraft = "Mein privater Entwurf darf den Browserbericht nie verlassen."
    session = updateGermanWritingDraft(session, privateDraft, now)
    const reference = createGermanWritingExerciseReportReference(session, prompt, promptIndex)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))

    expect(decoded).toEqual(reference)
    expect(reference.session).toEqual({
      kind: "writing",
      topicId: "writing",
      seed: session.seed,
      questionCount: 3,
      blueprintVersion: 1,
    })
    expect(reference.question).toMatchObject({
      index: promptIndex,
      topicId: "writing",
      familyId: "writing-prompt",
      templateId: prompt.id,
      prompt: prompt.prompt,
    })
    expect(JSON.stringify(reference)).not.toContain(privateDraft)
    expect(JSON.stringify(reference)).not.toContain("draft")
    expect(buildGermanWritingForm(reference.session.seed).prompts[promptIndex]).toEqual(prompt)

    const report = buildCodexExerciseReport(
      reference,
      "Eine Vorgabe ist unklar.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )
    expect(report).toContain("Session kind: writing")
    expect(report).toContain("Writing blueprint version: 1")
    expect(report).toContain("buildGermanWritingForm(seed)")
    expect(report).toContain("no learner name, title, plan, draft, checklist, or progress history")
    expect(report).not.toContain(privateDraft)

    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      session: { ...reference.session, draft: privateDraft },
    }))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: { ...reference.question, prompt: "Manipulierte Schreibaufgabe" },
    }))).toBeUndefined()
  })

  it("round-trips a German comprehension prompt without leaking the learner response or evidence", () => {
    const initial = createActiveGermanComprehensionSession(
      "reportable-comprehension",
      [],
      now,
    )
    const privateResponse = "Diese private Antwort und ihre Belegzeilen dürfen den Bericht nicht verlassen."
    const session = updateGermanComprehensionSession(initial, privateResponse, [1], now)
    const prompt = germanComprehensionPromptById(session.promptId)!
    const reference = createGermanComprehensionExerciseReportReference(session, prompt)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))

    expect(decoded).toEqual(reference)
    expect(reference.session).toEqual({
      kind: "comprehension",
      topicId: "reading-evidence",
      seed: session.seed,
      questionCount: 1,
      promptVersion: 1,
    })
    expect(reference.question).toMatchObject({
      index: 0,
      topicId: "reading-evidence",
      familyId: "comprehension-response",
      templateId: prompt.id,
      prompt: prompt.question,
    })
    expect(JSON.stringify(reference)).not.toContain(privateResponse)
    expect(JSON.stringify(reference)).not.toContain("evidenceLines")
    expect(JSON.stringify(reference)).not.toContain('"response":')

    const report = buildCodexExerciseReport(
      reference,
      "Die Aufgabenformulierung passt nicht zum Text.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )
    expect(report).toContain("Session kind: comprehension")
    expect(report).toContain("Comprehension prompt version: 1")
    expect(report).toContain("germanComprehensionPromptById(templateId)")
    expect(report).toContain("no learner name, response, selected evidence lines, reviewer feedback, or progress history")
    expect(report).not.toContain(privateResponse)

    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      session: { ...reference.session, response: privateResponse },
    }))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: { ...reference.question, prompt: "Manipulierte Kurzantwort" },
    }))).toBeUndefined()
  })

  it("reports a constrained German text field without accepted answers or learner text", () => {
    let state = createInitialGermanCourseState("Private Learner Name", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    const assignment = buildGermanAssignments(state, now)
      .find((candidate) => candidate.topicId === "grammar-correction")!
    state = startGermanSession(state, assignment, now)
    const session = state.activeSession!
    const questions = germanSessionQuestions(session)
    const questionIndex = questions.findIndex(isGermanAcceptedTextQuestion)
    const question = questions[questionIndex]
    if (!question || !isGermanAcceptedTextQuestion(question)) {
      throw new Error("Expected an accepted-text question")
    }
    const reference = createGermanExerciseReportReference(session, question, questionIndex)
    const report = buildCodexExerciseReport(
      reference,
      "Die freigegebene Korrektur wird abgelehnt.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )

    expect(reference.question.scoringRuleId).toBe("exact-accepted-text-v1")
    expect(decodeExerciseReport(encodeExerciseReport(reference))).toEqual(reference)
    expect(JSON.stringify(reference)).not.toContain("acceptedAnswers")
    expect(JSON.stringify(reference)).not.toContain(question.acceptedAnswers[0]!.text)
    expect(JSON.stringify(reference)).not.toContain("Private Learner Name")
    expect(report).toContain("Scoring rule: exact-accepted-text-v1")
    expect(report).toContain("no learner name, selected option, typed answer, or progress history")
  })

  it("reports German multi-select provenance without answer keys or learner selections", () => {
    let state = createInitialGermanCourseState("Private Learner Name", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    const assignment = buildGermanAssignments(state, now)
      .find((candidate) => candidate.topicId === "reading-evidence")!
    state = startGermanSession(state, assignment, now)
    const session = state.activeSession!
    const questions = germanSessionQuestions(session)
    const questionIndex = questions.findIndex(isGermanMultiSelectQuestion)
    const question = questions[questionIndex]
    if (!question || !isGermanMultiSelectQuestion(question)) throw new Error("Expected a multi-select question")
    const reference = createGermanExerciseReportReference(session, question, questionIndex)

    expect(reference.question.scoringRuleId).toBe("exact-multi-select-v1")
    expect(decodeExerciseReport(encodeExerciseReport(reference))).toEqual(reference)
    expect(JSON.stringify(reference)).not.toContain("correctOptionIds")
    expect(JSON.stringify(reference)).not.toContain("selectedOptionIds")
    expect(JSON.stringify(reference)).not.toContain("Private Learner Name")
  })

  it("round-trips and independently reproduces an answer-free German exam question", () => {
    const exam = createActiveGermanExam("reportable-exam", now)
    const blueprint = buildGermanExamBlueprint(exam.seed)
    const questionIndex = 8
    const question = blueprint.questions[questionIndex]!
    const reference = createGermanExamExerciseReportReference(exam, question, questionIndex)
    const decoded = decodeExerciseReport(encodeExerciseReport(reference))

    expect(decoded).toEqual(reference)
    expect(decoded && isGermanExerciseReport(decoded)).toBe(true)
    expect(JSON.stringify(reference)).not.toContain("answers")
    expect(JSON.stringify(reference)).not.toContain("correctOptionId")
    expect(reference.session).toMatchObject({
      kind: "exam",
      blueprintVersion: 9,
      passageId: blueprint.passage.id,
      questionCount: 15,
    })
    expect(buildGermanExamBlueprint(reference.session.seed).questions[questionIndex]).toEqual(question)

    const report = buildCodexExerciseReport(
      reference,
      "Die Aufgabenformulierung ist unklar.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )
    expect(report).toContain("Session kind: exam")
    expect(report).toContain("Exam blueprint version: 9")
    expect(report).toContain("Difficulty band: exam")
    expect(report).toContain(`Passage ID: ${blueprint.passage.id}`)
    expect(report).toContain("Scoring rule: exact-option-v1")
    expect(report).toContain("buildGermanExamBlueprint(seed)")

    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      session: { ...reference.session, answers: { [question.id]: "private-answer" } },
    }))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: { ...reference.question, prompt: "manipulated" },
    }))).toBeUndefined()
  })

  it("reports a truth-grid scoring rule without exposing any row selection", () => {
    const exam = createActiveGermanExam("reportable-truth-grid", now)
    const blueprint = buildGermanExamBlueprint(exam.seed)
    const questionIndex = blueprint.questions.findIndex((question) => (
      "responseKind" in question && question.responseKind === "truth-grid"
    ))
    const question = blueprint.questions[questionIndex]!
    const reference = createGermanExamExerciseReportReference(exam, question, questionIndex)

    expect(reference.question.scoringRuleId).toBe("truth-grid-threshold-2025-v1")
    expect(decodeExerciseReport(encodeExerciseReport(reference))).toEqual(reference)
    expect(JSON.stringify(reference)).not.toContain("correctSelections")
    expect(JSON.stringify(reference)).not.toContain("selectedSelections")
    expect(buildCodexExerciseReport(
      reference,
      "Eine Aussage ist unklar.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )).toContain(
      "Scoring rule: truth-grid-threshold-2025-v1",
    )
  })

  it("reports the binary penalty rule without exposing row answers", () => {
    const exam = createActiveGermanExam("reportable-binary-grid", now)
    const blueprint = buildGermanExamBlueprint(exam.seed)
    const questionIndex = blueprint.questions.findIndex((question) => (
      "responseKind" in question && question.responseKind === "binary-grid"
    ))
    const question = blueprint.questions[questionIndex]!
    const reference = createGermanExamExerciseReportReference(exam, question, questionIndex)

    expect(reference.question.scoringRuleId).toBe("binary-grid-penalty-2024-v1")
    expect(decodeExerciseReport(encodeExerciseReport(reference))).toEqual(reference)
    expect(JSON.stringify(reference)).not.toContain("correctSelections")
    expect(JSON.stringify(reference)).not.toContain("selectedSelections")
    expect(buildCodexExerciseReport(
      reference,
      "Die Zwischenpunkte wirken falsch.",
      buildExerciseReportUrl(reference, "https://gymiquest.pages.dev"),
    )).toContain("Scoring rule: binary-grid-penalty-2024-v1")
  })

  it("rejects tampered German curriculum and cross-topic report references", () => {
    let state = createInitialGermanCourseState("learner", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    state = startGermanSession(state, buildGermanAssignments(state, now)[0]!, now)
    const reference = createGermanExerciseReportReference(
      state.activeSession!,
      currentGermanQuestion(state)!,
      0,
    )

    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      course: { ...reference.course, scoringPolicyVersion: 99 },
    }))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: { ...reference.question, topicId: "sentence-structure" },
    }))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: { ...reference.question, prompt: "Manipulierte Aufgabenstellung" },
    }))).toBeUndefined()
    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      session: {
        ...reference.session,
        answers: [{ selectedOptionId: "private-answer" }],
      },
    }))).toBeUndefined()
  })

  it("keeps saved version-one German report links reproducible", () => {
    let state = createInitialGermanCourseState("learner", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    state = startGermanSession(state, buildGermanAssignments(state, now)[2]!, now)
    state.activeSession!.generatorVersion = 1
    const question = currentGermanQuestion(state)!
    const currentReference = createGermanExerciseReportReference(
      state.activeSession!,
      question,
      0,
    )
    const legacyReference = {
      ...currentReference,
      session: { ...currentReference.session },
    }
    if (legacyReference.session.kind === "exam" ||
      legacyReference.session.kind === "writing" ||
      legacyReference.session.kind === "comprehension") {
      throw new Error("Expected learning report")
    }
    delete legacyReference.session.generatorVersion
    delete legacyReference.question.difficultyBand
    delete legacyReference.question.scoringRuleId

    const decoded = decodeExerciseReport(encodeArbitraryReport(legacyReference))
    expect(decoded).toEqual(legacyReference)
    expect(decoded && isGermanExerciseReport(decoded)).toBe(true)
    expect(question.generatorVersion).toBe(1)
  })

  it("keeps saved version-two German report links reproducible after matching ships", () => {
    let state = createInitialGermanCourseState("learner", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    state = startGermanSession(state, buildGermanAssignments(state, now)[4]!, now)
    state.activeSession!.generatorVersion = 2
    const question = currentGermanQuestion(state)!
    const reference = createGermanExerciseReportReference(state.activeSession!, question, 0)

    expect(decodeExerciseReport(encodeArbitraryReport(reference))).toEqual(reference)
    expect(question.generatorVersion).toBe(2)
    expect("responseKind" in question).toBe(false)

    expect(decodeExerciseReport(encodeArbitraryReport({
      ...reference,
      question: { ...reference.question, scoringRuleId: "exact-matching-v1" },
    }))).toBeUndefined()
  })

  it("reports the matching scoring rule without including matching answers", () => {
    let state = createInitialGermanCourseState("learner", now)
    state.startCheck = {
      startedAt: now.toISOString(),
      currentIndex: 4,
      answers: {},
      completedAt: now.toISOString(),
      correctCount: 0,
    }
    state = startGermanSession(state, buildGermanAssignments(state, now)[4]!, now)
    const questions = germanSessionQuestions(state.activeSession!)
    const questionIndex = questions.findIndex((question) => "responseKind" in question)
    const question = questions[questionIndex]!
    const reference = createGermanExerciseReportReference(state.activeSession!, question, questionIndex)

    expect(reference.question.scoringRuleId).toBe("exact-matching-v1")
    expect(decodeExerciseReport(encodeExerciseReport(reference))).toEqual(reference)
    expect(JSON.stringify(reference)).not.toContain("correctMatches")
    expect(JSON.stringify(reference)).not.toContain("selectedMatches")
  })
})
