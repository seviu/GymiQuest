import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  AuthorValidationView,
  CollectionView,
  CompletionView,
  ConceptPlayground,
  ConceptLibraryView,
  CurriculumView,
  Home,
  MockExamPlayer,
  MockExamResultsView,
  MockExamSetupView,
  OnboardingView,
  ParentArea,
  ParentDashboardView,
  ProfileSetupView,
  ProgressView,
  ReleaseReadinessView,
  SubjectLabView,
  TaskPlayer,
} from "./App"
import { decodeExerciseReport, isMathematicsExerciseReport } from "./domain/exerciseReport"
import { generateArchiveQuestion } from "./domain/archiveGenerators"
import {
  createActiveArchivePractice,
  submitArchivePracticeForReview,
} from "./domain/archivePractice"
import {
  buildAreaFractionModel,
  buildCornerCutoutModel,
  buildCuboidSurfaceModel,
  buildFrameAreaModel,
  buildNotchPerimeterModel,
  buildPyramidRollPath,
  buildTilingCostModel,
  recoverCuboidModuleDimensions,
} from "./domain/areaSpatial"
import { buildConceptRepairQuestions } from "./domain/conceptRepair"
import { buildConceptLabRound } from "./domain/conceptLab"
import { topics } from "./domain/content"
import {
  createLearnerCourseIndex,
  markCourseCompleted,
} from "./domain/courseIndex"
import {
  buildAverageMotionModel,
  buildCatchUpMotionModel,
  buildChangingSupplyModel,
  buildCoinCombinationModel,
  buildCubeNetPlaygroundModel,
  buildDataTableComplementModel,
  buildEfficientArithmeticModel,
  buildInverseSupplyModel,
  buildMissingAverageModel,
  buildMoneyRelationshipModel,
  buildNumberFilterModel,
  buildOperationChainModel,
  buildRevenueBundleModel,
  buildTableDifferenceModel,
  buildTimeFractionModel,
  cubeFaceRelation,
  cubeOppositeLabel,
} from "./domain/conceptPlayground"
import { generateQuestionsForTask } from "./domain/generators"
import { generateZap2025Question } from "./domain/zap2025Generators"
import { encodeGeometryConstructionAnswer } from "./domain/geometryConstruction"
import {
  buildAssignments,
  buildPlacementTask,
  buildPrerequisiteRefresh,
  completePlacementWithoutCheck,
  createInitialLearner,
  createSeededLearner,
  DEEP_RECOVERY_BREAK_HOURS,
  recordCompletion,
  requestTeacherSupport,
} from "./domain/learningEngine"
import { recordLearnerFeedback } from "./domain/learnerFeedback"
import type {
  GeometryConstructionTool,
  LearnerState,
  LearningEvent,
  LearningTask,
  MockExamResult,
  TopicId,
} from "./domain/model"
import { encodePracticeStepAnswers } from "./domain/practiceSteps"
import {
  createReleaseReadinessRecord,
  setReleaseReadinessCheck,
} from "./domain/releaseReadiness"
import {
  createActiveLearningSession,
  createPrerequisiteDetourSession,
} from "./domain/session"
import { createActiveMockExam, gradeMockExam } from "./domain/mockExam"
import {
  completeOfficialExam2015Review,
  createActiveOfficialExam2015,
  gradeOfficialExam2015,
} from "./domain/officialExam2015"
import {
  completeOfficialExam2023Review,
  createActiveOfficialExam2023,
  gradeOfficialExam2023,
} from "./domain/officialExam2023"
import {
  createActiveOfficialExam2024,
  gradeOfficialExam2024,
} from "./domain/officialExam2024"
import {
  createActiveOfficialExam2025,
  gradeOfficialExam2025,
} from "./domain/officialExam2025"
import {
  officialArchiveCatalog,
  type OfficialArchiveEditionId,
} from "./domain/officialArchiveCatalog"
import type { ParentAccessRecord } from "./domain/parentAccess"
import {
  createInitialGermanCourseState,
  requestGermanTopicSupport,
} from "./subjects/german/courseState"
import type { OfficialArchiveDocuments, OfficialArchiveLibrary } from "./infra/officialArchive"
import { LocalizationProvider } from "./i18n/localization"

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const assessment: LearningTask = {
  id: "assessment:ui-test",
  kind: "assessment",
  title: "Standortbestimmung UI-Test",
  description: "Eine gemischte Runde",
  topicIds: ["mass-units"],
  prerequisiteIds: [],
  maxXp: 10,
  questionCount: 1,
  seed: "assessment:ui-test",
  assessmentNumber: 4,
}

function buttonWithText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === text,
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button: ${text}`)
  return button
}

function helpButtonWithLabel(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll(".help-options button")).find(
    (candidate) => candidate.querySelector(".help-option-label")?.textContent?.trim() === text,
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing help button: ${text}`)
  return button
}

function buttonWithStrongText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.querySelector("strong")?.textContent?.trim() === text,
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing button with heading: ${text}`)
  return button
}

function choiceButtonWithLabel(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll(".answer-options button")).find(
    (candidate) => candidate.textContent?.includes(label),
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing choice button: ${label}`)
  return button
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing native input setter")
  setter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing native textarea setter")
  setter.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}

function setSelectValue(select: HTMLSelectElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set
  if (!setter) throw new Error("Missing native select setter")
  setter.call(select, value)
  select.dispatchEvent(new Event("change", { bubbles: true }))
}

function geometryToolButton(
  container: HTMLElement,
  tool: GeometryConstructionTool,
): HTMLButtonElement {
  const labels: Record<GeometryConstructionTool, string> = {
    parallel: "Parallele",
    circle: "Kreis",
    bisector: "Mittelsenkrechte",
  }
  const button = Array.from(container.querySelectorAll(".geometry-tools button")).find(
    (candidate) => candidate.querySelector("strong")?.textContent === labels[tool],
  )
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Missing geometry tool: ${tool}`)
  return button
}

function geometryTask(kind: LearningTask["kind"], suffix: string): LearningTask {
  return {
    id: `${kind}:geometric-loci:${suffix}`,
    kind,
    title: "Geometrische Orte",
    description: "Konstruktion im Plan",
    topicIds: ["geometric-loci"],
    prerequisiteIds: [],
    maxXp: kind === "lesson" ? 25 : 6,
    questionCount: 1,
    seed: `${kind}:geometric-loci:${suffix}`,
    ...(kind === "assessment" ? { assessmentNumber: 1 } : {}),
  }
}

function parentMockResult(
  id: string,
  submittedAt: string,
  certainPoints: number,
  reviewablePoints: number,
): MockExamResult {
  return {
    id,
    source: "generated",
    seed: id,
    blueprintVersion: 4,
    startedAt: submittedAt,
    submittedAt,
    submissionReason: "submitted",
    durationSeconds: 3_600,
    maxPoints: 36,
    certainPoints,
    reviewablePoints,
    taskResults: [],
    recoveryTopicIds: [],
  }
}

function parentPilotEvent(
  id: string,
  completedAt: string,
  kind: LearningEvent["taskKind"] = "review",
  independentQuestions = 2,
  questionCount = 2,
): LearningEvent {
  return {
    id,
    taskId: `${kind}:mass-units:${id}`,
    taskKind: kind,
    topicIds: ["mass-units"],
    completedAt,
    activeSeconds: questionCount * 90,
    mistakes: questionCount - independentQuestions,
    hintsUsed: 0,
    independentlyCompleted: independentQuestions === questionCount,
    questionResults: Array.from({ length: questionCount }, (_, index) => ({
      questionId: `${id}:question:${index}`,
      topicId: "mass-units" as const,
      attempts: index < independentQuestions ? 1 : 2,
      hintsUsed: 0,
      activeSeconds: 90,
      independentlySolved: index < independentQuestions,
      difficultyBand: kind === "assessment" ? "exam" as const : "standard" as const,
    })),
  }
}

function conceptRoundForLearner(learner: LearnerState, topicId: TopicId) {
  return buildConceptLabRound(
    topicId,
    `concept-lab:${learner.learnerId}:${topicId}:${learner.learningEvents.length}:0`,
  )
}

function archiveQuestionForVariant(
  topicId: "efficient-arithmetic" | "data-tables" | "composite-areas",
  variant: string,
) {
  for (let index = 0; index < 200; index += 1) {
    const question = generateArchiveQuestion(topicId, `ui-${topicId}-${index}`, `ui-${index}`)
    if (question.visual?.variant === variant) return question
  }
  throw new Error(`Missing archive ${topicId} variant: ${variant}`)
}

function readyArchiveDocuments(editionId: OfficialArchiveEditionId): OfficialArchiveDocuments {
  const importedAt = "2026-07-14T12:00:00.000Z"
  const definition = officialArchiveCatalog[editionId]
  return {
    tasks: {
      id: `${editionId}:tasks`,
      editionId,
      kind: "tasks",
      filename: definition.documents.tasks.expectedFilename,
      mimeType: "application/pdf",
      size: 10,
      sha256: definition.documents.tasks.sha256,
      importedAt,
      blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
    },
    solutions: {
      id: `${editionId}:solutions`,
      editionId,
      kind: "solutions",
      filename: definition.documents.solutions.expectedFilename,
      mimeType: "application/pdf",
      size: 10,
      sha256: definition.documents.solutions.sha256,
      importedAt,
      blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
    },
  }
}

function readyOfficialDocuments(): OfficialArchiveDocuments {
  return readyArchiveDocuments("zap-zh-lg-2025")
}

describe("assessment UI flow", () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined)
    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("offers an evidence-based start check or a foundations-first path", () => {
    const onStartPlacement = vi.fn()
    const onStartFoundations = vi.fn()
    act(() => {
      root.render(
        <OnboardingView
          onStartPlacement={onStartPlacement}
          onStartFoundations={onStartFoundations}
        />,
      )
    })

    expect(container.textContent).toContain("Wir finden deinen besten Startpunkt.")
    expect(container.textContent).toContain("Keine Note")
    expect(container.textContent).toContain("Kein XP-Druck")
    expect(container.textContent).toContain("9 Aufgaben")

    act(() => buttonWithText(container, "Start-Check beginnen").click())
    act(() => buttonWithText(container, "Bei den Grundlagen starten").click())
    expect(onStartPlacement).toHaveBeenCalledOnce()
    expect(onStartFoundations).toHaveBeenCalledOnce()
  })

  it("renders the complete start-choice screen in English", () => {
    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <OnboardingView
            onStartPlacement={() => undefined}
            onStartFoundations={() => undefined}
          />
        </LocalizationProvider>,
      )
    })

    expect(container.textContent).toContain("Let’s find your best starting point.")
    expect(container.textContent).toContain("No grade")
    expect(container.textContent).toContain("Begin start check")
    expect(container.textContent).toContain("9 questions")
    expect(container.textContent).toContain("YOUR LEARNING PATH")
  })

  it("offers to resume a paused placement instead of restarting it", () => {
    const learner = createInitialLearner(new Date("2026-07-14T12:00:00.000Z"))
    const session = createActiveLearningSession(buildPlacementTask(learner))
    session.question.questionIndex = 3
    session.activeSeconds = 72
    const onResume = vi.fn()

    act(() => {
      root.render(
        <OnboardingView
          onStartPlacement={() => undefined}
          onStartFoundations={() => undefined}
          resumeSession={session}
          onResume={onResume}
        />,
      )
    })

    expect(container.textContent).toContain("Aufgabe 4 von 9 · 1:12 aktiv")
    expect(container.textContent).not.toContain("Start-Check beginnen")
    act(() => buttonWithText(container, "Start-Check fortsetzen").click())
    expect(onResume).toHaveBeenCalledOnce()
  })

  it("keeps encrypted restore reachable before placement", () => {
    const learner = createInitialLearner(new Date("2026-07-14T12:00:00.000Z"))
    act(() => {
      root.render(
        <OnboardingView
          learner={learner}
          onStartPlacement={() => undefined}
          onStartFoundations={() => undefined}
          onRestore={async () => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Vorhandenen Lernstand übernehmen")
    expect(container.textContent).toContain("Sicherung prüfen")
  })

  it("creates a two-step local profile whose preferences shape the learning plan", async () => {
    const learner = createInitialLearner(new Date("2026-07-14T12:00:00.000Z"))
    const onSave = vi.fn(async () => undefined)
    act(() => {
      root.render(
        <ProfileSetupView
          learner={learner}
          onSave={onSave}
          onRestore={async () => undefined}
          now={new Date("2026-07-14T12:00:00.000Z")}
        />,
      )
    })

    expect(container.textContent).toContain("Für wen und bis wann planen wir?")
    expect(container.textContent).toContain("Kein vollständiger Name nötig.")
    expect(container.textContent).toContain("Vorhandenen Lernstand übernehmen")

    const nickname = container.querySelector("#profile-display-name")
    const examDate = container.querySelector("#profile-exam-date")
    if (!(nickname instanceof HTMLInputElement) || !(examDate instanceof HTMLInputElement)) {
      throw new Error("Missing profile goal fields")
    }
    expect(examDate.value).toBe("2027-03-08")
    act(() => setInputValue(nickname, "Lina"))
    act(() => buttonWithText(container, "Lernrhythmus wählen").click())

    expect(container.textContent).toContain("Wie soll GymiQuest dich begleiten?")
    const twentyMinutes = Array.from(container.querySelectorAll(".session-choice button")).find(
      (button) => button.querySelector("strong")?.textContent === "20",
    )
    if (!(twentyMinutes instanceof HTMLButtonElement)) throw new Error("Missing 20 minute option")
    act(() => twentyMinutes.click())
    const helpPreference = Array.from(container.querySelectorAll(".preference-cards button")).find(
      (button) => button.querySelector("strong")?.textContent === "Schritt für Schritt",
    )
    const focusMode = Array.from(container.querySelectorAll(".visual-choice button")).find(
      (button) => button.querySelector("strong")?.textContent === "Fokus",
    )
    const spaciousReading = Array.from(container.querySelectorAll(".reading-choice button")).find(
      (button) => button.querySelector("strong")?.textContent === "Mehr Leseruhe",
    )
    const leftControls = Array.from(container.querySelectorAll(".geometry-control-choice button")).find(
      (button) => button.querySelector("strong")?.textContent === "Werkzeuge links",
    )
    if (
      !(helpPreference instanceof HTMLButtonElement) ||
      !(focusMode instanceof HTMLButtonElement) ||
      !(spaciousReading instanceof HTMLButtonElement) ||
      !(leftControls instanceof HTMLButtonElement)
    ) {
      throw new Error("Missing profile preference cards")
    }
    act(() => helpPreference.click())
    act(() => focusMode.click())
    act(() => spaciousReading.click())
    act(() => leftControls.click())
    await act(async () => buttonWithText(container, "Profil speichern und starten").click())

    expect(onSave).toHaveBeenCalledWith({
      displayName: "Lina",
      examDate: "2027-03-08",
      practiceDays: ["tuesday", "thursday", "saturday"],
      sessionMinutes: 20,
      helpStyle: "step-by-step",
      visualMode: "focus",
      readingMode: "spacious",
      geometryControlSide: "left",
    })
  })

  it("switches the onboarding profile among complete English, Italian, Spanish, and German copy", () => {
    const learner = createInitialLearner(new Date("2026-07-14T12:00:00.000Z"))
    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <ProfileSetupView
            learner={learner}
            onSave={async () => undefined}
            now={new Date("2026-07-14T12:00:00.000Z")}
          />
        </LocalizationProvider>,
      )
    })

    expect(container.textContent).toContain("Who are we planning for, and until when?")
    expect(container.textContent).toContain("No full name needed.")
    const language = container.querySelector("#app-language")
    if (!(language instanceof HTMLSelectElement)) throw new Error("Missing app language selector")
    expect(language.value).toBe("en")

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set
      setter?.call(language, "de")
      language.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(container.textContent).toContain("Für wen und bis wann planen wir?")
    expect(container.textContent).toContain("Kein vollständiger Name nötig.")

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set
      setter?.call(language, "it")
      language.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(container.textContent).toContain("Per chi e fino a quando pianifichiamo?")
    expect(container.textContent).toContain("Non serve il nome completo.")

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set
      setter?.call(language, "es")
      language.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(container.textContent).toContain("¿Para quién y hasta cuándo hacemos el plan?")
    expect(container.textContent).toContain("No hace falta tu nombre completo.")
  })

  it("renders an authored English lesson and keeps the chosen language on its dynamic practice task", () => {
    const task: LearningTask = {
      id: "lesson:english-ui",
      kind: "lesson",
      title: "Kilogramm und Gramm sicher umrechnen",
      description: "German source metadata",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 1,
      seed: "lesson:english-ui",
      contentLocale: "en",
    }
    const onSessionChange = vi.fn()

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <TaskPlayer
            initialSession={createActiveLearningSession(task)}
            onBack={() => undefined}
            onFinish={() => undefined}
            onPrerequisite={() => undefined}
            onSessionChange={onSessionChange}
          />
        </LocalizationProvider>,
      )
    })

    expect(container.textContent).toContain("Convert kilograms and grams confidently")
    expect(container.textContent).toContain("One kilogram is 1,000 grams")
    expect(container.textContent).toContain("Takeaway")
    expect(container.textContent).toContain("Practise now")
    expect(container.textContent).not.toContain("Merksatz")

    act(() => buttonWithText(container, "Practise now").click())
    expect(onSessionChange.mock.calls.at(-1)?.[0].task.contentLocale).toBe("en")
    expect(container.textContent).toContain("Question 1 of 1")
    expect(container.textContent).toMatch(/How many (grams|kilograms)/u)
    expect(container.textContent).toContain("Report an error in this exercise")
    expect(container.textContent).toContain("I do not understand it yet")
  })

  it("keeps English hints and diagnostic feedback inside the localized question flow", () => {
    const task: LearningTask = {
      id: "review:english-feedback-ui",
      kind: "review",
      title: "Kilogramm und Gramm",
      description: "German source metadata",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:english-feedback-ui",
      contentLocale: "en",
    }

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <TaskPlayer
            initialSession={createActiveLearningSession(task)}
            onBack={() => undefined}
            onFinish={() => undefined}
            onPrerequisite={() => undefined}
            onSessionChange={() => undefined}
          />
        </LocalizationProvider>,
      )
    })

    act(() => buttonWithText(container, "A small hint").click())
    expect(container.textContent).toContain("NEXT STEP")
    expect(container.textContent).toMatch(/kilograms|grams/u)

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing English answer input")
    act(() => setInputValue(input, "not a number"))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("This entry is not a number yet.")
    expect(container.textContent).toContain("Enter only the number")
    expect(container.textContent).toContain("This does not count as a mistake.")
    expect(container.textContent).not.toContain("Remove words or units")
    expect(container.textContent).not.toContain("Diese Eingabe")
  })

  it("passes the latest local question snapshot into a prerequisite detour", () => {
    const task: LearningTask = {
      id: "review:detour-source",
      kind: "review",
      title: "Daten aus Tabellen sicher verbinden",
      description: "Eine laufende Aufgabe mit Voraussetzung.",
      topicIds: ["data-tables"],
      prerequisiteIds: ["arithmetic-equations"],
      maxXp: 4,
      questionCount: 1,
      seed: "review:detour-source",
      contentLocale: "de",
    }
    const source = createActiveLearningSession(task)
    source.activeSeconds = 41
    source.question.submissions = 1
    source.question.mistakes = 1
    const onPrerequisite = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={source}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={onPrerequisite}
          onSessionChange={() => undefined}
        />,
      )
    })

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing answer input")
    act(() => setInputValue(input, "123"))
    act(() => buttonWithText(container, "Voraussetzungen ansehen").click())
    const prerequisite = container.querySelector(".prerequisite-help-button")
    if (!(prerequisite instanceof HTMLButtonElement)) throw new Error("Missing prerequisite action")
    act(() => prerequisite.click())

    expect(onPrerequisite).toHaveBeenCalledOnce()
    const [topicId, snapshot] = onPrerequisite.mock.calls[0]!
    expect(topicId).toBe("arithmetic-equations")
    expect(snapshot).toMatchObject({
      id: source.id,
      activeSeconds: 41,
      question: {
        answer: "123",
        submissions: 1,
        mistakes: 1,
        activeHelp: ["prerequisites"],
      },
    })
  })

  it("marks a prerequisite refresh as temporary and removes deeper prerequisite jumps", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const source = createActiveLearningSession(buildAssignments(learner)[0]!)
    const detour = createPrerequisiteDetourSession(
      buildPrerequisiteRefresh(learner, "time-fractions"),
      source,
    )
    const onBack = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={detour}
          onBack={onBack}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("KURZE AUFFRISCHUNG")
    expect(container.textContent).toContain("Deine Aufgabe und dein Stand bleiben gespeichert")
    expect(container.textContent).not.toContain("Voraussetzungen ansehen")
    const back = container.querySelector(".back-button")
    if (!(back instanceof HTMLButtonElement)) throw new Error("Missing detour back button")
    expect(back.textContent).toContain("Zurück zu meiner Aufgabe")
    act(() => back.click())
    expect(onBack).toHaveBeenCalledOnce()
  })

  it("keeps a saved exam date in edit mode and never suggests a past cohort date", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    learner.preferences.examDate = "2027-04-12"
    act(() => {
      root.render(
        <ProfileSetupView
          key="edit-profile"
          learner={learner}
          mode="edit"
          onSave={async () => undefined}
          now={new Date("2026-07-14T12:00:00.000Z")}
        />,
      )
    })

    const savedDate = container.querySelector("#profile-exam-date")
    if (!(savedDate instanceof HTMLInputElement)) throw new Error("Missing saved exam date")
    expect(savedDate.value).toBe("2027-04-12")

    act(() => {
      root.render(
        <ProfileSetupView
          key="later-onboarding"
          learner={createInitialLearner(new Date("2027-03-09T12:00:00.000Z"))}
          onSave={async () => undefined}
          now={new Date("2027-03-09T12:00:00.000Z")}
        />,
      )
    })

    const expiredDefault = container.querySelector("#profile-exam-date")
    if (!(expiredDefault instanceof HTMLInputElement)) throw new Error("Missing later exam date")
    expect(expiredDefault.value).toBe("")
  })

  it("keeps profile validation local and requires at least one practice day", async () => {
    const learner = createInitialLearner(new Date("2026-07-14T12:00:00.000Z"))
    const onSave = vi.fn(async () => undefined)
    act(() => {
      root.render(
        <ProfileSetupView
          learner={learner}
          onSave={onSave}
          now={new Date("2026-07-14T12:00:00.000Z")}
        />,
      )
    })
    const nickname = container.querySelector("#profile-display-name")
    const examDate = container.querySelector("#profile-exam-date")
    if (!(nickname instanceof HTMLInputElement) || !(examDate instanceof HTMLInputElement)) {
      throw new Error("Missing profile goal fields")
    }
    expect(examDate.value).toBe("2027-03-08")
    act(() => setInputValue(nickname, "Lina"))
    act(() => buttonWithText(container, "Lernrhythmus wählen").click())
    for (const day of Array.from(container.querySelectorAll(".practice-day-choice button[aria-pressed='true']"))) {
      act(() => (day as HTMLButtonElement).click())
    }
    await act(async () => buttonWithText(container, "Profil speichern und starten").click())
    expect(container.textContent).toContain("mindestens einen ruhigen Lerntag")
    expect(onSave).not.toHaveBeenCalled()
  })

  it("keeps reset controls in profile settings and requires explicit confirmation", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const onResetMathematics = vi.fn()
    const onResetGerman = vi.fn()
    const onResetAll = vi.fn()
    act(() => {
      root.render(
        <ProfileSetupView
          learner={learner}
          mode="edit"
          onSave={async () => undefined}
          onResetMathematics={onResetMathematics}
          onResetGerman={onResetGerman}
          onResetAll={onResetAll}
          now={new Date("2026-07-14T12:00:00.000Z")}
        />,
      )
    })

    expect(container.textContent).toContain("PROFILEINSTELLUNGEN · LERNSTAND")
    expect(container.textContent).toContain("Mathematik-Lernstand zurücksetzen")
    expect(container.textContent).toContain("Deutsch-Lernstand zurücksetzen")
    expect(container.textContent).toContain("Testprofil zurücksetzen und Onboarding neu starten")

    act(() => buttonWithText(container, "Mathematik-Lernstand zurücksetzen").click())
    expect(onResetMathematics).not.toHaveBeenCalled()
    expect(container.textContent).toContain("Deutsch-Lernstand, Profil, Begleitpersonen-PIN")
    act(() => buttonWithText(container, "Abbrechen").click())
    expect(container.textContent).not.toContain("Nur Mathematik zurücksetzen?")

    act(() => buttonWithText(container, "Deutsch-Lernstand zurücksetzen").click())
    expect(onResetGerman).not.toHaveBeenCalled()
    expect(container.textContent).toContain("Mathematik, Profil, Begleitpersonen-PIN")
    act(() => buttonWithText(container, "Deutsch zurücksetzen").click())
    expect(onResetGerman).toHaveBeenCalledOnce()

    act(() => buttonWithText(container, "Testprofil zurücksetzen und Onboarding neu starten").click())
    expect(onResetAll).not.toHaveBeenCalled()
    expect(container.textContent).toContain("Das getrennte Freigabeprotokoll bleibt erhalten")
    act(() => buttonWithText(container, "Profil zurücksetzen").click())
    expect(onResetAll).toHaveBeenCalledOnce()
  })

  it("explains when a struggling idea is resting before a fresh recovery round", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const started = completePlacementWithoutCheck(createInitialLearner(now), now)
    const lesson = buildAssignments(started, now).find((task) => task.kind === "lesson")
    if (!lesson) throw new Error("Expected an initial lesson")
    const completed = recordCompletion(started, lesson, {
      id: "event:home-recovery-break",
      taskId: lesson.id,
      taskKind: lesson.kind,
      topicIds: lesson.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 120,
      mistakes: 2,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: Array.from({ length: lesson.questionCount }, (_, index) => ({
        questionId: `${lesson.id}:question:${index}`,
        topicId: lesson.topicIds[index % lesson.topicIds.length]!,
        attempts: index === 0 ? 3 : 1,
        hintsUsed: 0,
        activeSeconds: 30,
        independentlySolved: index !== 0,
      })),
    })
    let restingLearner = completed.state
    for (const mastery of Object.values(restingLearner.mastery)) {
      if (mastery.status === "available") {
        restingLearner = requestTeacherSupport(restingLearner, mastery.topicId, now)
      }
    }

    expect(buildAssignments(restingLearner, now)).toHaveLength(0)
    act(() => {
      root.render(
        <Home
          learner={restingLearner}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Eine Idee macht kurz Pause.")
    expect(container.textContent).toContain("Kurze Pause – dann frisch weiter.")
    expect(container.textContent).toContain("dieselbe Idee mit neuen Zahlen")
    expect(container.querySelector(".primary-plan-step .task-card")).toBeNull()
  })

  it("shows an adaptive daily quest and durable local badge progress", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const onOpenCollection = vi.fn()
    learner.learningEvents = [{
      id: "event:home-quest-review",
      taskId: "review:mass-units:home-quest",
      taskKind: "review",
      topicIds: ["mass-units"],
      completedAt: "2026-07-14T09:00:00.000Z",
      activeSeconds: 360,
      mistakes: 0,
      hintsUsed: 0,
      independentlyCompleted: true,
      questionResults: [0, 1].map((index) => ({
        questionId: `home-quest:${index}`,
        topicId: "mass-units" as const,
        attempts: 1,
        hintsUsed: 0,
        activeSeconds: 180,
        independentlySolved: true,
      })),
    }]

    act(() => {
      root.render(
        <Home
          learner={learner}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenCollection={onOpenCollection}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("HEUTIGE QUEST")
    expect(container.textContent).toContain("Drei ruhige Schritte für heute.")
    expect(container.textContent).toContain("Aufgaben wirklich bearbeiten")
    expect(container.textContent).toContain("Der erste Schritt")
    expect(container.textContent).toContain("Freigeschaltet")
    expect(container.textContent).toContain("MATHE-EXPEDITION")
    expect(container.querySelectorAll(".daily-quest-goals > div")).toHaveLength(3)
    act(() => buttonWithText(container, "Sammlung öffnen ›").click())
    expect(onOpenCollection).toHaveBeenCalledOnce()
  })

  it("keeps the learning engine visible while focus mode hides optional game surfaces", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.preferences.visualMode = "focus"
    learner.totalXp = 94
    learner.xpSinceAssessment = 44
    const assignments = buildAssignments(learner, now)
    const onStart = vi.fn()
    const onOpenCollection = vi.fn()

    act(() => {
      root.render(
        <Home
          learner={learner}
          now={now}
          onStart={onStart}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenCollection={onOpenCollection}
          onOpenConceptLab={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Dein Lernplan")
    expect(container.textContent).toContain("GESAMT GESAMMELT")
    expect(container.textContent).toContain("94XP")
    expect(container.textContent).toContain("Nächste Standortbestimmung")
    expect(container.querySelectorAll(".task-card")).toHaveLength(1)
    expect(container.querySelectorAll(".upcoming-task-row")).toHaveLength(assignments.length - 1)
    expect(container.querySelector(".home-shell")?.firstElementChild?.classList.contains("plan-column")).toBe(true)
    expect(container.querySelector(".home-progress-disclosure")?.hasAttribute("open")).toBe(false)
    expect(container.textContent).not.toContain("HEUTIGE QUEST")
    expect(container.textContent).not.toContain("MATHE-EXPEDITION")
    expect(container.textContent).not.toContain("ABZEICHEN")
    expect(container.textContent).not.toContain("Sammlung öffnen")
    act(() => buttonWithText(container, "Starten").click())
    expect(onStart).toHaveBeenCalledWith(assignments[0])
    expect(onOpenCollection).not.toHaveBeenCalled()

    act(() => {
      root.render(
        <ProgressView
          learner={learner}
          onBack={() => undefined}
          onOpenCollection={onOpenCollection}
          now={now}
        />,
      )
    })

    expect(container.textContent).toContain("Lernplan, XP und Reviews bleiben")
    expect(container.textContent).toContain("94 XP")
    expect(container.textContent).not.toContain("Belohnungen für echte Lernarbeit")
    expect(container.textContent).not.toContain("Expedition öffnen")
    expect(container.querySelector(".achievements-panel")).toBeNull()
  })

  it("makes a saved session the only actionable learning step on Home", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const assignments = buildAssignments(learner, now)
    const session = createActiveLearningSession(assignments[0]!)
    const onResume = vi.fn()

    act(() => {
      root.render(
        <Home
          learner={learner}
          resumeSession={session}
          now={now}
          onStart={() => undefined}
          onResume={onResume}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenConceptLab={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.querySelectorAll(".primary-plan-step .task-card")).toHaveLength(1)
    expect(container.querySelectorAll(".upcoming-task-row")).toHaveLength(assignments.length - 1)
    expect(container.querySelectorAll(".upcoming-tasks button")).toHaveLength(0)
    expect(Array.from(container.querySelectorAll("button")).some(
      (button) => button.textContent?.trim() === "Starten",
    )).toBe(false)
    expect(container.querySelector(".daily-quest-disclosure")).toBeNull()
    expect(container.querySelector(".home-shortcuts")).toBeNull()
    act(() => buttonWithText(container, "Fortsetzen").click())
    expect(onResume).toHaveBeenCalledOnce()
  })

  it("keeps every pending checkpoint review ahead of ordinary queued work", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.xpSinceAssessment = learner.assessmentThreshold
    const assessmentTask = buildAssignments(learner, now)[0]!
    const questions = generateQuestionsForTask(assessmentTask)
    const missedTopicIds = [...new Set(questions.map((question) => question.topicId))].slice(0, 2)
    expect(missedTopicIds).toHaveLength(2)
    const result = recordCompletion(learner, assessmentTask, {
      id: "event:assessment:multi-checkpoint-home",
      taskId: assessmentTask.id,
      taskKind: assessmentTask.kind,
      topicIds: assessmentTask.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 180,
      mistakes: 2,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: questions.map((question) => {
        const missed = missedTopicIds.includes(question.topicId)
        return {
          questionId: question.id,
          topicId: question.topicId,
          attempts: missed ? 2 : 1,
          hintsUsed: 0,
          activeSeconds: 30,
          independentlySolved: !missed,
        }
      }),
    })
    const nextAssignments = buildAssignments(result.state, now)
    const checkpointReviews = nextAssignments.filter((task) => (
      task.kind === "review" &&
      task.topicIds.some((topicId) => missedTopicIds.includes(topicId))
    ))
    expect(checkpointReviews).toHaveLength(2)

    act(() => {
      root.render(
        <Home
          learner={result.state}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.querySelector(".primary-plan-step")?.textContent).toContain(
      checkpointReviews[0]!.title,
    )
    expect(container.querySelector(".upcoming-task-row")?.textContent).toContain(
      checkpointReviews[1]!.title,
    )
  })

  it("keeps assessment misses visible as a checkpoint return trail until their reviews are completed", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.xpSinceAssessment = learner.assessmentThreshold
    const task = buildAssignments(learner, now)[0]!
    const questions = generateQuestionsForTask(task)
    const missedTopicId = questions[1]!.topicId
    const event: LearningEvent = {
      id: "event:assessment:checkpoint-home",
      taskId: task.id,
      taskKind: task.kind,
      topicIds: task.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 420,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: questions.map((question, index) => ({
        questionId: question.id,
        topicId: question.topicId,
        attempts: index === 1 ? 2 : 1,
        hintsUsed: 0,
        activeSeconds: 70,
        independentlySolved: index !== 1,
      })),
    }
    const result = recordCompletion(learner, task, event)
    const recoveryTask = buildAssignments(result.state, now).find(
      (candidate) => candidate.kind === "review" && candidate.topicIds.includes(missedTopicId),
    )!
    const onStart = vi.fn()

    act(() => {
      root.render(
        <Home
          learner={result.state}
          now={now}
          onStart={onStart}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("RÜCKWEG NACH EXPEDITIONS-CHECK 1")
    expect(container.textContent).toContain("Aus dem Check wird ein klarer Rückweg.")
    expect(container.textContent).toContain(topics[missedTopicId].shortTitle)
    expect(container.textContent).toContain("RÜCKWEG AUS CHECK 1")
    expect(container.querySelectorAll(".checkpoint-trail-steps li.pending")).toHaveLength(1)
    act(() => buttonWithText(container, "Nächsten Rückweg starten").click())
    expect(onStart).toHaveBeenCalledWith(recoveryTask)

    const focused = structuredClone(result.state)
    focused.preferences.visualMode = "focus"
    act(() => {
      root.render(
        <Home
          learner={focused}
          now={now}
          onStart={onStart}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })
    expect(container.textContent).toContain("WIEDERHOLUNGEN NACH STANDORTBESTIMMUNG 1")
    expect(container.textContent).toContain("Aus der Standortbestimmung wird ein klarer Plan.")
    expect(container.textContent).toContain("WIEDERHOLUNG NACH STANDORTBESTIMMUNG 1")
    expect(container.textContent).not.toContain("EXPEDITIONS-CHECK")
    expect(container.textContent).not.toContain("RÜCKWEG AUS CHECK")
    act(() => buttonWithText(container, "Nächste Wiederholung starten").click())
    expect(onStart).toHaveBeenLastCalledWith(recoveryTask)

    const onResume = vi.fn()
    act(() => {
      root.render(
        <Home
          learner={result.state}
          resumeSession={createActiveLearningSession(recoveryTask)}
          now={now}
          onStart={onStart}
          onResume={onResume}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })
    expect(container.textContent).toContain("ANGEFANGEN · RÜCKWEG AUS CHECK 1")
    act(() => buttonWithText(container, "Rückweg fortsetzen").click())
    expect(onResume).toHaveBeenCalledOnce()

    const recoveryQuestions = generateQuestionsForTask(recoveryTask)
    const recovered = recordCompletion(result.state, recoveryTask, {
      id: "event:review:checkpoint-home-complete",
      taskId: recoveryTask.id,
      taskKind: recoveryTask.kind,
      topicIds: recoveryTask.topicIds,
      completedAt: new Date(now.getTime() + 60_000).toISOString(),
      activeSeconds: 180,
      mistakes: 0,
      hintsUsed: 0,
      independentlyCompleted: true,
      questionResults: recoveryQuestions.map((question) => ({
        questionId: question.id,
        topicId: question.topicId,
        attempts: 1,
        hintsUsed: 0,
        activeSeconds: 90,
        independentlySolved: true,
      })),
    })
    act(() => {
      root.render(
        <Home
          learner={recovered.state}
          now={now}
          onStart={onStart}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })
    expect(container.textContent).not.toContain("RÜCKWEG NACH EXPEDITIONS-CHECK")
    expect(recovered.award.totalXp).toBe(recoveryTask.maxXp)

    const paused = requestTeacherSupport(result.state, missedTopicId, now)
    act(() => {
      root.render(
        <Home
          learner={paused}
          now={now}
          onStart={onStart}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Der Rückweg wartet auf eure Erklärung.")
    expect(container.textContent).toContain("Wartet in der Begleitansicht")
    expect(container.querySelectorAll(".checkpoint-trail-steps li.paused")).toHaveLength(1)
    expect(container.textContent).not.toContain("Nächsten Rückweg starten")
  })

  it("turns existing XP and learning evidence into a fair expedition collection", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.totalXp = 179
    learner.learningEvents = [{
      id: "event:collection-review",
      taskId: "review:mass-units:collection",
      taskKind: "review",
      topicIds: ["mass-units"],
      completedAt: "2026-07-14T09:00:00.000Z",
      activeSeconds: 300,
      mistakes: 0,
      hintsUsed: 0,
      independentlyCompleted: true,
      questionResults: [{
        questionId: "collection:question",
        topicId: "mass-units",
        attempts: 1,
        hintsUsed: 0,
        activeSeconds: 300,
        independentlySolved: true,
      }],
    }]
    const original = structuredClone(learner)
    const onBack = vi.fn()

    act(() => {
      root.render(<CollectionView learner={learner} onBack={onBack} />)
    })

    expect(container.textContent).toContain("Lernarbeit wird zu einer sichtbaren Reise.")
    expect(container.textContent).toContain("3/8")
    expect(container.textContent).toContain("NÄCHSTER FUND")
    expect(container.textContent).toContain("Denklaterne")
    expect(container.textContent).toContain("1 XP fehlen noch")
    expect(container.textContent).toContain("Jede regulär verdiente Review-XP zählt")
    expect(container.textContent).toContain("Die Sammlung schaut auf Arbeit, nicht auf Perfektion.")
    expect(container.querySelectorAll(".collectible-grid article.unlocked")).toHaveLength(3)
    expect(container.querySelectorAll(".collectible-grid article.locked")).toHaveLength(5)
    expect(container.querySelectorAll(".expedition-story li.unlocked")).toHaveLength(1)
    const nextMeter = container.querySelector('[aria-label="XP bis Denklaterne"]')
    expect(nextMeter?.getAttribute("aria-valuenow")).toBe("179")
    expect(nextMeter?.getAttribute("aria-valuemax")).toBe("180")
    const backButton = container.querySelector(".curriculum-back")
    if (!(backButton instanceof HTMLButtonElement)) throw new Error("Missing collection back button")
    act(() => backButton.click())
    expect(onBack).toHaveBeenCalledOnce()
    expect(learner).toEqual(original)
  })

  it("makes the all-subject lab and its Mathematics concept space reachable from Home", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const germanCourse = createInitialGermanCourseState(learner.learnerId, now)
    let courseIndex = createLearnerCourseIndex(now)
    courseIndex = markCourseCompleted(
      courseIndex,
      "math",
      new Date("2026-07-13T10:00:00.000Z"),
    )
    courseIndex = markCourseCompleted(
      courseIndex,
      "german",
      new Date("2026-07-12T09:00:00.000Z"),
    )
    const onOpenSubjectLab = vi.fn()
    const onOpenMathematics = vi.fn()
    const onOpenGerman = vi.fn()

    act(() => {
      root.render(
        <Home
          learner={learner}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenConceptLab={onOpenSubjectLab}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.querySelector(".home-shortcuts")).not.toBeNull()
    expect(container.textContent).toContain("Wähle deinen nächsten Weg.")
    expect(container.textContent).toContain("Ein beliebiges Mathematikthema üben")
    expect(container.textContent).toContain("Echte oder Probeprüfung versuchen")
    const labCard = container.querySelector(".home-shortcut-card.lab")
    if (!(labCard instanceof HTMLButtonElement)) throw new Error("Missing subject lab card")
    act(() => labCard.click())
    expect(onOpenSubjectLab).toHaveBeenCalledOnce()

    act(() => {
      root.render(
        <SubjectLabView
          learner={learner}
          germanCourse={germanCourse}
          courseIndex={courseIndex}
          now={now}
          onBack={() => undefined}
          onOpenMathematics={onOpenMathematics}
          onOpenGerman={onOpenGerman}
        />,
      )
    })

    expect(container.textContent).toContain("ÜBUNGSLABOR · ALLE FÄCHER")
    expect(container.textContent).toContain("Wähle zuerst ein Fach.")
    expect(container.textContent).toContain("Mathematik")
    expect(container.textContent).toContain("Deutsch")
    const mathematicsProgress = container.querySelector(
      ".subject-lab-card.math [role='progressbar']",
    )
    const germanProgress = container.querySelector(
      ".subject-lab-card.german [role='progressbar']",
    )
    expect(mathematicsProgress?.getAttribute("aria-valuenow")).toBe(
      String(Object.values(learner.mastery).filter((mastery) => mastery.status === "mastered").length),
    )
    expect(germanProgress?.getAttribute("aria-valuenow")).toBe("0")
    expect(container.textContent).toContain("Nächster Schritt")
    expect(container.textContent).toContain("Dein Deutsch-Start-Check")
    expect(container.textContent).toContain("Letzte Runde")
    act(() => buttonWithText(container, "Mathematik-Konzeptlabor öffnen").click())
    expect(onOpenMathematics).toHaveBeenCalledOnce()
    act(() => buttonWithText(container, "Deutsch-Übung öffnen").click())
    expect(onOpenGerman).toHaveBeenCalledOnce()
  })

  it("opens only the first incomplete curriculum group while keeping every group expandable", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const orderedTopics = Object.values(topics).sort(
      (left, right) => left.courseOrder - right.courseOrder,
    )
    for (const topic of orderedTopics.slice(0, 7)) {
      learner.mastery[topic.id].status = "mastered"
    }

    act(() => {
      root.render(
        <CurriculumView
          learner={learner}
          onBack={() => undefined}
          onStartLesson={() => undefined}
          onRefresh={() => undefined}
          onOpenConcept={() => undefined}
        />,
      )
    })

    const groups = Array.from(
      container.querySelectorAll<HTMLDetailsElement>(".curriculum-group"),
    )
    expect(groups).toHaveLength(3)
    expect(groups[0]?.open).toBe(false)
    expect(groups[1]?.open).toBe(true)
    expect(groups[2]?.open).toBe(false)
    expect(groups[0]?.querySelector("summary")?.textContent).toContain("7/7")
    expect(groups[1]?.querySelector("[role='progressbar']")?.getAttribute("aria-valuemax")).toBe("7")

    const firstSummary = groups[0]?.querySelector("summary")
    if (!(firstSummary instanceof HTMLElement)) throw new Error("Missing curriculum group summary")
    act(() => firstSummary.click())
    expect(groups[0]?.open).toBe(true)
    expect(groups[1]?.open).toBe(true)
  })

  it("moves from a concept trace through fading support to a fresh independent check", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    learner.mastery["mass-units"].status = "available"
    const startingXp = learner.totalXp
    const onStartPractice = vi.fn()
    const round = buildConceptLabRound(
      "mass-units",
      `concept-lab:${learner.learnerId}:mass-units:${learner.learningEvents.length}:0`,
    )
    if (round.check.response.kind !== "number") throw new Error("Expected numeric concept-lab check")
    const checkValue = round.check.response.value

    act(() => {
      root.render(
        <ConceptLibraryView
          learner={learner}
          initialTopicId="mass-units"
          onBack={() => undefined}
          onStartPractice={onStartPractice}
        />,
      )
    })

    expect(container.textContent).toContain("KONZEPT-LABOR · kg und g")
    expect(container.textContent).toContain("ohne XP- oder Notendruck")
    expect(container.textContent).toContain("Denkspur 1 von 2")
    const massRange = container.querySelector("#mass-playground-range")
    if (!(massRange instanceof HTMLInputElement)) throw new Error("Missing mass playground range")
    act(() => setInputValue(massRange, "7"))
    expect(container.textContent).toContain("1750")
    expect(massRange.getAttribute("aria-valuetext")).toContain("1750 Gramm")
    act(() => buttonWithText(container, "Nächster Schritt").click())
    act(() => buttonWithText(container, "Neue Zahlen ansehen").click())
    expect(container.textContent).toContain(round.example.prompt)
    expect(container.textContent).toContain("Noch kein Rechenschritt sichtbar")

    for (let index = 0; index < round.example.workedSteps.length; index += 1) {
      const label = index === 0 ? "Ersten Schritt aufdecken" : "Nächsten Schritt aufdecken"
      act(() => buttonWithText(container, label).click())
    }
    act(() => buttonWithText(container, "Ohne Vorlage probieren").click())
    expect(container.textContent).toContain(round.check.prompt)

    const teachBack = container.querySelector("#concept-library-teach-back")
    const checkInput = container.querySelector("#concept-check-answer")
    if (!(teachBack instanceof HTMLTextAreaElement)) throw new Error("Missing library teach-back field")
    if (!(checkInput instanceof HTMLInputElement)) throw new Error("Missing library answer field")
    act(() => setTextareaValue(teachBack, "Ich prüfe zuerst, in welche Einheit ich umwandle."))
    act(() => setInputValue(checkInput, String(checkValue)))
    act(() => buttonWithText(container, "Meinen Plan prüfen").click())

    expect(container.textContent).toContain("Die Idee trägt auch mit neuen Zahlen")
    expect(container.textContent).toContain("kein XP, keine versteckte Note")
    expect(learner.totalXp).toBe(startingXp)
    expect(onStartPractice).not.toHaveBeenCalled()

    act(() => buttonWithText(container, "Lektion starten").click())
    expect(onStartPractice).toHaveBeenCalledWith("mass-units")
  })

  it("reverses an arithmetic chain exactly without changing progress", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const startingMastery = structuredClone(learner.mastery["arithmetic-equations"])
    const round = buildConceptLabRound(
      "arithmetic-equations",
      `concept-lab:${learner.learnerId}:arithmetic-equations:${learner.learningEvents.length}:0`,
    )
    const values = round.reference.visual?.values ?? []
    const multiplier = values[0]!
    const divisor = values[1]!
    const expected = buildOperationChainModel(multiplier, divisor, 10)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="arithmetic-equations" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })

    const baseRange = container.querySelector("#operation-chain-base")
    if (!(baseRange instanceof HTMLInputElement)) throw new Error("Missing operation-chain control")
    act(() => setInputValue(baseRange, "10"))

    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `(□ · ${multiplier}) : ${divisor} = ${expected.result}`,
    )
    expect(baseRange.getAttribute("aria-valuetext")).toContain(`gesuchte Zahl ${expected.unknown}`)
    expect(learner.totalXp).toBe(startingXp)
    expect(learner.mastery["arithmetic-equations"]).toEqual(startingMastery)
  })

  it("moves whole-minute time fractions without awarding XP", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = buildConceptLabRound(
      "time-fractions",
      `concept-lab:${learner.learnerId}:time-fractions:${learner.learningEvents.length}:0`,
    )
    const denominator = round.reference.visual?.denominator ?? 7
    const expected = buildTimeFractionModel(2, denominator, 15)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="time-fractions" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })

    const numeratorRange = container.querySelector("#time-fraction-numerator")
    const partRange = container.querySelector("#time-fraction-part")
    if (!(numeratorRange instanceof HTMLInputElement) || !(partRange instanceof HTMLInputElement)) {
      throw new Error("Missing time-fraction controls")
    }
    act(() => setInputValue(numeratorRange, "2"))
    act(() => setInputValue(partRange, "15"))

    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `${expected.totalMinutes} min ÷ ${denominator} × 2 = ${expected.fractionMinutes} min`,
    )
    expect(learner.totalXp).toBe(startingXp)
  })

  it("recomputes a generated motion model from the mathematical relationship", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = buildConceptLabRound(
      "speed-distance-time",
      `concept-lab:${learner.learnerId}:speed-distance-time:${learner.learningEvents.length}:0`,
    )
    const values = round.reference.visual?.values ?? []
    const format = (value: number) => new Intl.NumberFormat("de-CH", { maximumFractionDigits: 2 }).format(value)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="speed-distance-time" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })

    if (round.reference.visual?.variant === "return-home" || round.reference.visual?.variant === "late-start") {
      const isReturnHome = round.reference.visual.variant === "return-home"
      const eventMinutes = isReturnHome
        ? 2 * (values[6] ?? 0) + (values[7] ?? 0)
        : values[6] ?? 0
      const flow = container.querySelector(".schedule-recovery-flow")
      expect(flow?.textContent).toContain(`${eventMinutes} min`)
      expect(flow?.textContent).toContain(`${format(values[3] ?? 0)} km/h`)
    } else if (round.reference.visual?.variant === "catch-up") {
      const range = container.querySelector("#motion-head-start")
      if (!(range instanceof HTMLInputElement)) throw new Error("Missing catch-up control")
      const expected = buildCatchUpMotionModel(values[0]!, values[1]!, 30)
      act(() => setInputValue(range, "30"))
      expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
        `${format(expected.catchMinutes)} min Aufholzeit`,
      )
    } else {
      const firstRange = container.querySelector("#motion-first-minutes")
      const secondRange = container.querySelector("#motion-second-minutes")
      if (!(firstRange instanceof HTMLInputElement) || !(secondRange instanceof HTMLInputElement)) {
        throw new Error("Missing average-motion controls")
      }
      const expected = buildAverageMotionModel(values[0]!, 30, values[3]!, 60)
      act(() => setInputValue(firstRange, "30"))
      act(() => setInputValue(secondRange, "60"))
      expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
        `${format(expected.averageSpeed)} km/h`,
      )
    }
    expect(learner.totalXp).toBe(startingXp)
  })

  it("walks backward through the generated multi-stage process", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = buildConceptLabRound(
      "reverse-chains",
      `concept-lab:${learner.learnerId}:reverse-chains:${learner.learningEvents.length}:0`,
    )
    const steps = round.reference.practiceSteps
    if (!steps?.length) throw new Error("Missing generated reverse-chain steps")
    const finalStep = steps.at(-1)!

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="reverse-chains" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })

    const stepRange = container.querySelector("#reverse-process-step")
    if (!(stepRange instanceof HTMLInputElement)) throw new Error("Missing reverse-process control")
    act(() => setInputValue(stepRange, String(steps.length - 1)))

    expect(container.textContent).toContain(finalStep.label)
    expect(container.textContent).toContain(finalStep.nextStep)
    expect(stepRange.getAttribute("aria-valuetext")).toContain(String(finalStep.value))
    expect(learner.totalXp).toBe(startingXp)
  })

  it("keeps person-days constant while the group size changes", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = buildConceptLabRound(
      "inverse-proportion",
      `concept-lab:${learner.learnerId}:inverse-proportion:${learner.learningEvents.length}:0`,
    )
    const values = round.reference.visual?.values ?? []
    const originalPeople = values[0]!
    const originalDays = values[1]!
    const newPeople = originalPeople * 2
    const expected = buildInverseSupplyModel(originalPeople, originalDays, newPeople)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="inverse-proportion" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })

    const peopleRange = container.querySelector("#inverse-supply-people")
    if (!(peopleRange instanceof HTMLInputElement)) throw new Error("Missing inverse-supply control")
    act(() => setInputValue(peopleRange, String(newPeople)))

    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `${expected.totalPersonDays} Personentage ÷ ${newPeople} Personen`,
    )
    expect(peopleRange.getAttribute("aria-valuetext")).toContain(`${expected.newDays} Tage`)
    expect(learner.totalXp).toBe(startingXp)
  })

  it("conserves supply while people and elapsed time change", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = buildConceptLabRound(
      "changing-rates",
      `concept-lab:${learner.learnerId}:changing-rates:${learner.learningEvents.length}:0`,
    )
    const values = round.reference.visual?.values ?? []
    const originalPeople = values[0]!
    const originalDays = values[1]!
    const expected = buildChangingSupplyModel(originalPeople, originalDays, 0, originalPeople)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="changing-rates" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })

    const elapsedRange = container.querySelector("#changing-supply-elapsed")
    const peopleRange = container.querySelector("#changing-supply-people")
    if (!(elapsedRange instanceof HTMLInputElement) || !(peopleRange instanceof HTMLInputElement)) {
      throw new Error("Missing changing-supply controls")
    }
    act(() => setInputValue(elapsedRange, "0"))
    act(() => setInputValue(peopleRange, String(originalPeople)))

    expect(container.querySelector(".changing-supply-equation")?.textContent).toContain(
      `${expected.newDays} Tage`,
    )
    expect(learner.totalXp).toBe(startingXp)
  })

  it("rearranges both generated factor-pair forms exactly", () => {
    for (const variant of ["sum", "difference"] as const) {
      const question = archiveQuestionForVariant("efficient-arithmetic", variant)
      const values = question.visual?.values ?? []
      const factor = values[0]!
      const combined = values[3]!
      const movable = variant === "sum" ? Math.min(10, combined - 1) : 12
      const left = variant === "sum" ? movable : movable + combined
      const right = variant === "sum" ? combined - movable : movable
      const expected = buildEfficientArithmeticModel(factor, left, right, variant)

      act(() => {
        root.render(
          <ConceptPlayground
            key={variant}
            topicId="efficient-arithmetic"
            question={question}
            fallbackVisual="factor-pairs"
          />,
        )
      })
      const range = container.querySelector("#efficient-arithmetic-term")
      if (!(range instanceof HTMLInputElement)) throw new Error("Missing factor-pair control")
      act(() => setInputValue(range, String(movable)))

      expect(container.querySelector(".factor-grouped-equation")?.textContent).toContain(
        `${factor} × ${combined} = ${new Intl.NumberFormat("de-CH").format(expected.result)}`,
      )
    }
  })

  it("maps every generated data-table structure to a live exact playground", () => {
    for (const variant of ["complement", "missing-average", "difference"] as const) {
      const question = archiveQuestionForVariant("data-tables", variant)
      const values = question.visual?.values ?? []

      act(() => {
        root.render(
          <ConceptPlayground
            key={variant}
            topicId="data-tables"
            question={question}
            fallbackVisual="data-table"
          />,
        )
      })

      if (variant === "complement") {
        const model = buildDataTableComplementModel(values[0]!, values.slice(1, 4), values.slice(4, 7))
        const rowButtons = container.querySelectorAll(".table-row-picker button")
        expect(rowButtons).toHaveLength(3)
        act(() => (rowButtons[2] as HTMLButtonElement).click())
        expect(container.querySelector(".table-complement-row .answer")?.textContent).toContain(
          String(model.rows[2]!.neither),
        )
      } else if (variant === "missing-average") {
        const firstRange = container.querySelector("#average-first")
        if (!(firstRange instanceof HTMLInputElement)) throw new Error("Missing average control")
        act(() => setInputValue(firstRange, "0"))
        const model = buildMissingAverageModel(values[3]!, [0, values[1]!])
        expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
          `= ${model.missingValue} in Woche 3`,
        )
      } else {
        const range = container.querySelector("#table-known-segment")
        if (!(range instanceof HTMLInputElement)) throw new Error("Missing route control")
        act(() => setInputValue(range, "0"))
        const model = buildTableDifferenceModel(values[2]!, 0)
        expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
          `= ${model.missing} km`,
        )
      }
    }
  })

  it("switches money calculations between multiplication and its inverse without XP", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const startingMastery = structuredClone(learner.mastery["money-calculations"])
    const round = conceptRoundForLearner(learner, "money-calculations")
    const values = round.reference.visual?.values ?? []
    const category = round.reference.visual?.variant === "unit-count" ? Math.round(values[3]!) : 0
    const expected = buildMoneyRelationshipModel(values[category]!, 7)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="money-calculations" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })
    const range = container.querySelector("#money-count")
    if (!(range instanceof HTMLInputElement)) throw new Error("Missing money count control")
    act(() => setInputValue(range, "7"))
    act(() => buttonWithText(container, "Einnahmen ÷ Preis").click())

    expect(container.querySelector(".money-relationship")?.textContent).toContain(`${expected.revenue} Fr.`)
    expect(container.querySelector(".money-relationship")?.textContent).toContain(String(expected.count))
    expect(learner.totalXp).toBe(startingXp)
    expect(learner.mastery["money-calculations"]).toEqual(startingMastery)
  })

  it("rebuilds a ratio bundle with new exact package counts", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = conceptRoundForLearner(learner, "proportional-revenue")
    const values = round.reference.visual?.values ?? []
    const expected = buildRevenueBundleModel(values[0]!, values[1]!, 4, 5)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="proportional-revenue" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })
    const ratioRange = container.querySelector("#bundle-ratio")
    const countRange = container.querySelector("#bundle-count")
    if (!(ratioRange instanceof HTMLInputElement) || !(countRange instanceof HTMLInputElement)) {
      throw new Error("Missing bundle controls")
    }
    act(() => setInputValue(ratioRange, "4"))
    act(() => setInputValue(countRange, "5"))

    expect(container.querySelector(".bundle-equation")?.textContent).toContain(`${expected.revenue} Fr.`)
    expect(container.querySelector(".bundle-equation")?.textContent).toContain(
      `${expected.childCount} Kinder · ${expected.adultCount} Erwachsene`,
    )
    expect(learner.totalXp).toBe(startingXp)
  })

  it("enumerates every positive coin combination as the target changes", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = conceptRoundForLearner(learner, "integer-combinations")
    const values = round.reference.visual?.values ?? []
    const denominations: [number, number, number] = [values[0]!, values[1]!, values[2]!]
    const total = denominations.reduce((sum, value) => sum + value, 0)
    const expected = buildCoinCombinationModel(denominations, total)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="integer-combinations" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })
    const range = container.querySelector("#combination-total")
    if (!(range instanceof HTMLInputElement)) throw new Error("Missing combination control")
    act(() => setInputValue(range, String(total)))

    expect(container.querySelectorAll(".combination-table [role='row']")).toHaveLength(
      expected.solutions.length + 1,
    )
    expect(range.getAttribute("aria-valuetext")).toContain(`${expected.solutions.length} Kombinationen`)
    expect(learner.totalXp).toBe(startingXp)
  })

  it("reveals a complete number-constraint solution set one filter at a time", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const startingMastery = structuredClone(learner.mastery["number-constraints"])
    const round = conceptRoundForLearner(learner, "number-constraints")
    const values = round.reference.visual?.values ?? []
    const digits: [number, number, number, number] = [values[0]!, values[1]!, values[2]!, values[3]!]
    const relation = round.reference.visual?.variant === "less" ? "less" : "greater"
    const expected = buildNumberFilterModel(digits, values[4]!, relation)

    act(() => {
      root.render(
        <ConceptLibraryView learner={learner} initialTopicId="number-constraints" onBack={() => undefined} onStartPractice={() => undefined} />,
      )
    })
    const finalStage = container.querySelectorAll(".number-filter-stages button")[2]
    if (!(finalStage instanceof HTMLButtonElement)) throw new Error("Missing final number filter")
    act(() => finalStage.click())

    const visible = Array.from(container.querySelectorAll(".number-candidate-cloud > span"), (item) => Number(item.textContent))
    expect(visible).toEqual(expected.solutions)
    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `${expected.solutions.length} vollständige Lösungen`,
    )
    expect(learner.totalXp).toBe(startingXp)
    expect(learner.mastery["number-constraints"]).toEqual(startingMastery)
  })

  it("turns every large tile into four units before reducing an area fraction", () => {
    const question = generateZap2025Question("area-fractions", "ui-area-fraction", "ui-area-fraction")
    const columns = question.visual?.columns ?? 6
    const rows = question.visual?.rows ?? 4
    const capacity = Math.floor(columns / 2) * Math.floor(rows / 2)

    act(() => {
      root.render(
        <ConceptPlayground topicId="area-fractions" question={question} fallbackVisual="tile-grid" />,
      )
    })
    const range = container.querySelector("#area-large-count")
    if (!(range instanceof HTMLInputElement)) throw new Error("Missing area-fraction control")
    act(() => setInputValue(range, String(capacity)))
    const expected = buildAreaFractionModel(columns, rows, capacity)

    expect(container.querySelectorAll(".interactive-tile-board .tile-large")).toHaveLength(capacity)
    expect(container.querySelector(".fraction-reduction")?.textContent).toContain(
      `${expected.numerator}/${expected.denominator}`,
    )
    expect(range.getAttribute("aria-valuetext")).toContain(
      `weisser Anteil ${expected.numerator} von ${expected.denominator}`,
    )
  })

  it("switches the optimal tiling globally when the price-per-area comparison flips", () => {
    const question = generateZap2025Question("tiling-costs", "ui-tiling-cost", "ui-tiling-cost")
    const columns = question.visual?.columns ?? 6
    const rows = question.visual?.rows ?? 4

    act(() => {
      root.render(
        <ConceptPlayground topicId="tiling-costs" question={question} fallbackVisual="tile-grid" />,
      )
    })
    const smallRange = container.querySelector("#small-tile-cost")
    const largeRange = container.querySelector("#large-tile-cost")
    if (!(smallRange instanceof HTMLInputElement) || !(largeRange instanceof HTMLInputElement)) {
      throw new Error("Missing tiling-cost controls")
    }
    act(() => setInputValue(smallRange, "4"))
    act(() => setInputValue(largeRange, "17"))
    const allSmall = buildTilingCostModel(columns, rows, 4, 17)
    expect(container.querySelector(".tiling-strategy")?.textContent).toContain("verwende keine grosse")
    expect(container.querySelectorAll(".interactive-tile-board .tile-large")).toHaveLength(0)
    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `= ${allSmall.totalCost} Fr.`,
    )

    act(() => setInputValue(largeRange, "13"))
    const largeFirst = buildTilingCostModel(columns, rows, 4, 13)
    expect(container.querySelector(".tiling-strategy")?.textContent).toContain("so viele wie möglich")
    expect(container.querySelectorAll(".interactive-tile-board .tile-large")).toHaveLength(
      largeFirst.largeCount,
    )
    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `= ${largeFirst.totalCost} Fr.`,
    )
  })

  it("renders all three composite-shape invariants from their generated variant", () => {
    for (const variant of ["frame", "corner", "notch"] as const) {
      const question = archiveQuestionForVariant("composite-areas", variant)
      const values = question.visual?.values ?? []
      const width = values[0]!
      const height = values[1]!
      act(() => {
        root.render(
          <ConceptPlayground key={variant} topicId="composite-areas" question={question} fallbackVisual="area-cutout" />,
        )
      })
      const horizontal = container.querySelector("#composite-horizontal")
      if (!(horizontal instanceof HTMLInputElement)) throw new Error("Missing composite horizontal control")

      if (variant === "frame") {
        act(() => setInputValue(horizontal, "1"))
        const expected = buildFrameAreaModel(width, height, 1)
        expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
          `= ${expected.result} cm²`,
        )
      } else {
        const vertical = container.querySelector("#composite-vertical")
        if (!(vertical instanceof HTMLInputElement)) throw new Error("Missing composite vertical control")
        act(() => setInputValue(horizontal, "2"))
        act(() => setInputValue(vertical, "2"))
        const expected = variant === "corner"
          ? buildCornerCutoutModel(width, height, 2, 2)
          : buildNotchPerimeterModel(width, height, 2, 2)
        expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
          `= ${expected.result} ${variant === "corner" ? "cm²" : "cm"}`,
        )
      }
    }
  })

  it("updates the full pyramid orientation over an editable multi-step path", () => {
    const question = generateZap2025Question("spatial-rolling", "ui-pyramid-roll", "ui-pyramid-roll")
    const values = question.visual?.values ?? []
    const orientation = { bottom: values[0]!, left: values[1]!, right: values[2]!, back: values[3]! }

    act(() => {
      root.render(
        <ConceptPlayground topicId="spatial-rolling" question={question} fallbackVisual="pyramid-roll" />,
      )
    })
    act(() => buttonWithText(container, "Zum Start").click())
    act(() => buttonWithText(container, "über die hintere Kante").click())

    const first = buildPyramidRollPath(orientation, ["back"])
    expect(container.querySelector(".pyramid-new-base")?.textContent).toContain(
      `Fläche ${first.finalOrientation.bottom}`,
    )
    expect(container.querySelector(".pyramid-orientation-map")?.textContent).toContain(
      `links${first.finalOrientation.left}`,
    )

    act(() => buttonWithText(container, "über die linke Kante").click())
    const expected = buildPyramidRollPath(orientation, ["back", "left"])
    expect(container.querySelector(".pyramid-new-base")?.textContent).toContain(
      `Fläche ${expected.finalOrientation.bottom}`,
    )
    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `Grundflächen nach jedem Kippen: ${expected.supportingFaces.join(" → ")}`,
    )
  })

  it("recovers one cuboid module and compares both exact arrangements", () => {
    const question = generateZap2025Question("cuboid-surface", "ui-cuboid", "ui-cuboid")
    const values = question.visual?.values ?? []
    const dimensions = recoverCuboidModuleDimensions(values[0]!, values[1]!, values[2]!)
    const sideBySide = buildCuboidSurfaceModel(dimensions.length, dimensions.width, dimensions.height, "side-by-side")
    const endToEnd = buildCuboidSurfaceModel(dimensions.length, dimensions.width, dimensions.height, "end-to-end")

    act(() => {
      root.render(
        <ConceptPlayground topicId="cuboid-surface" question={question} fallbackVisual="cuboid-net" />,
      )
    })
    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `= ${sideBySide.surface} cm²`,
    )
    expect(sideBySide.surface).toBe(values[3])
    act(() => buttonWithText(container, "hintereinander").click())
    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain(
      `= ${endToEnd.surface} cm²`,
    )
  })

  it("moves a coordinate point through exact transformation rules without changing progress", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const startingMastery = structuredClone(learner.mastery["coordinate-transformations"])

    act(() => {
      root.render(
        <ConceptLibraryView
          learner={learner}
          initialTopicId="coordinate-transformations"
          onBack={() => undefined}
          onStartPractice={() => undefined}
        />,
      )
    })

    act(() => buttonWithText(container, "90° rechts(y | −x)").click())
    const xRange = container.querySelector("#coordinate-playground-x")
    const yRange = container.querySelector("#coordinate-playground-y")
    if (!(xRange instanceof HTMLInputElement) || !(yRange instanceof HTMLInputElement)) {
      throw new Error("Missing coordinate playground controls")
    }
    act(() => setInputValue(xRange, "3"))
    act(() => setInputValue(yRange, "-2"))

    expect(container.querySelector(".concept-playground-equation")?.textContent).toContain("P′(-2 | -3)")
    expect(learner.totalXp).toBe(startingXp)
    expect(learner.mastery["coordinate-transformations"]).toEqual(startingMastery)
  })

  it("folds the generated cube net semantically and explains both wrong and right choices", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = buildConceptLabRound(
      "cube-nets",
      `concept-lab:${learner.learnerId}:cube-nets:${learner.learningEvents.length}:0`,
    )
    const model = buildCubeNetPlaygroundModel(round.reference)
    if (!model) throw new Error("Missing generated cube-net model")
    const target = model.initialTargetLabel
    const wrongNeighbor = model.faces.find(
      (face) => cubeFaceRelation(model, target, face.label) === "net-neighbor",
    )
    if (!wrongNeighbor) throw new Error("Missing direct net neighbor")
    const opposite = cubeOppositeLabel(model, target)

    act(() => {
      root.render(
        <ConceptLibraryView
          learner={learner}
          initialTopicId="cube-nets"
          onBack={() => undefined}
          onStartPractice={() => undefined}
        />,
      )
    })

    const wrongButton = container.querySelector(
      `[aria-label="Fläche ${wrongNeighbor.label} als mögliche Gegenfläche wählen"]`,
    )
    if (!(wrongButton instanceof HTMLButtonElement)) throw new Error("Missing wrong cube candidate")
    act(() => wrongButton.click())
    expect(container.textContent).toContain("teilt im Netz eine Kante")

    const correctButton = container.querySelector(
      `[aria-label="Fläche ${opposite} als mögliche Gegenfläche wählen"]`,
    )
    if (!(correctButton instanceof HTMLButtonElement)) throw new Error("Missing correct cube candidate")
    act(() => correctButton.click())
    expect(container.textContent).toContain("genau in die entgegengesetzte Raumrichtung")
    expect(learner.totalXp).toBe(startingXp)
  })

  it("lets the learner construct a geometric locus with live semantic feedback", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const startingXp = learner.totalXp
    const round = buildConceptLabRound(
      "geometric-loci",
      `concept-lab:${learner.learnerId}:geometric-loci:${learner.learningEvents.length}:0`,
    )
    const spec = round.reference.geometryConstruction
    if (!spec) throw new Error("Missing geometry construction")

    act(() => {
      root.render(
        <ConceptLibraryView
          learner={learner}
          initialTopicId="geometric-loci"
          onBack={() => undefined}
          onStartPractice={() => undefined}
        />,
      )
    })

    act(() => geometryToolButton(container, spec.expectedTool).click())
    const adjustment = container.querySelector("#geometry-parameter")
    if (!(adjustment instanceof HTMLInputElement)) throw new Error("Missing locus adjustment")
    act(() => setInputValue(adjustment, String(spec.targetParameter)))

    expect(container.textContent).toContain("Die Spur erfüllt die Bedingung")
    expect(learner.totalXp).toBe(startingXp)
  })

  it("lists every topic and lets a learner open prerequisite concepts without unlocking them", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    learner.mastery["reverse-chains"].status = "locked"
    learner.mastery["fraction-of-quantity"].status = "available"

    act(() => {
      root.render(
        <ConceptLibraryView
          learner={learner}
          onBack={() => undefined}
          onStartPractice={() => undefined}
        />,
      )
    })

    expect(container.querySelectorAll(".concept-library-card")).toHaveLength(23)
    const reverseCard = Array.from(container.querySelectorAll(".concept-library-card")).find(
      (card) => card.textContent?.includes("Rückwärtsketten"),
    )
    const openButton = reverseCard?.querySelector("button")
    if (!(openButton instanceof HTMLButtonElement)) throw new Error("Missing reverse-chain concept button")
    act(() => openButton.click())

    expect(container.textContent).toContain("Falls es hier hakt, geh einen Schritt zurück")
    expect(container.textContent).not.toContain("Lektion starten")
    const prerequisiteButton = container.querySelector(".concept-prerequisite-strip button")
    if (!(prerequisiteButton instanceof HTMLButtonElement)) throw new Error("Missing prerequisite concept link")
    const prerequisiteTitle = prerequisiteButton.querySelector("strong")?.textContent
    act(() => prerequisiteButton.click())
    expect(container.textContent).toContain(`KONZEPT-LABOR · ${prerequisiteTitle}`)
    expect(learner.mastery["reverse-chains"].status).toBe("locked")
  })

  it("shows the chosen session length and exam countdown without inventing a grade", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.preferences.sessionMinutes = 10
    learner.preferences.examDate = "2026-08-13"

    act(() => {
      root.render(
        <Home
          learner={learner}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("10 Min.")
    expect(container.textContent).toContain("30 Tage")
    expect(container.textContent).toContain("13. August 2026")
    expect(container.textContent).toContain("keine vorhergesagte Note")
    expect(container.querySelector(".task-card.lesson")).not.toBeNull()
    expect(
      container.querySelector(".task-card.lesson .difficulty-sequence"),
    ).toBeNull()
  })

  it("shows offered mathematics XP before a round and earned-versus-offered XP in history", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now).find(
      (assignment) => assignment.kind === "lesson",
    )
    if (!task) throw new Error("Missing lesson assignment")

    act(() => {
      root.render(
        <Home
          learner={learner}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
        />,
      )
    })
    expect(container.textContent).toContain(`bis zu ${task.maxXp} XP`)

    const questions = generateQuestionsForTask(task)
    const result = recordCompletion(learner, task, {
      id: "event:xp-history-ui",
      taskId: task.id,
      taskKind: task.kind,
      topicIds: task.topicIds,
      completedAt: new Date(now.getTime() + 60_000).toISOString(),
      activeSeconds: 240,
      mistakes: 0,
      hintsUsed: 0,
      independentlyCompleted: true,
      questionResults: questions.map((question) => ({
        questionId: question.id,
        topicId: question.topicId,
        attempts: 1,
        hintsUsed: 0,
        activeSeconds: Math.round(240 / questions.length),
        independentlySolved: true,
      })),
    })

    act(() => {
      root.render(
        <ProgressView
          learner={result.state}
          onBack={() => undefined}
          now={new Date(now.getTime() + 60_000)}
        />,
      )
    })
    const reward = container.querySelector(".recent-reward")
    expect(result.award.maxXp).toBe(task.maxXp)
    expect(reward?.textContent).toContain(`${result.award.totalXp}/${task.maxXp} XP`)
    expect(reward?.textContent).toContain("Fehlerfreie Runde")

    const legacyState = structuredClone(result.state)
    delete legacyState.xpLedger[0]!.maxXp
    act(() => {
      root.render(
        <ProgressView
          learner={legacyState}
          onBack={() => undefined}
          now={new Date(now.getTime() + 60_000)}
        />,
      )
    })
    expect(container.querySelector(".recent-reward")?.textContent).toContain(
      `+${result.award.totalXp} XP`,
    )
  })

  it("shows the mastered curriculum as an ongoing consolidation phase", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    for (const mastery of Object.values(learner.mastery)) {
      mastery.status = "mastered"
      mastery.dueAt = "2026-07-15T12:00:00.000Z"
    }

    act(() => {
      root.render(
        <Home
          learner={learner}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={() => undefined}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("FESTIGUNGSPHASE")
    expect(container.textContent).toContain("Reviews & Standortbestimmungen")
    expect(container.textContent).toContain("Alle 23 Lektionen sind gelernt.")
    expect(container.textContent).toContain("Alle Lektionen sind gelernt. Reviews und Standortbestimmungen")
    expect(container.textContent).toContain("Heute ist nichts fällig.")
    expect(container.textContent).toContain("Review-XP führen weiter zur Standortbestimmung")
    expect(container.querySelectorAll(".task-card.lesson")).toHaveLength(0)
  })

  it("keeps placement silent and advances without hints or correctness feedback", () => {
    const learner = createInitialLearner(new Date("2026-07-14T12:00:00.000Z"))
    const placement = buildPlacementTask(learner)
    const firstQuestion = generateQuestionsForTask(placement)[0]!
    if (firstQuestion.response.kind !== "number") throw new Error("Expected numeric placement question")
    const correctValue = firstQuestion.response.value

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(placement)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Start-Check: keine Note")
    expect(container.textContent).not.toContain("Ich verstehe es noch nicht")
    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing placement input")
    act(() => setInputValue(input, String(correctValue)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Aufgabe 2 von 9")
    expect(container.textContent).not.toContain("Richtig.")
    expect(container.textContent).not.toContain(firstQuestion.explanation)
    expect(container.textContent).not.toContain("Ein kleiner Hinweis")
  })

  it("keeps malformed placement input final, silent, and insecure", () => {
    const learner = createInitialLearner(new Date("2026-07-14T12:00:00.000Z"))
    const placement = buildPlacementTask(learner)
    const onSessionChange = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(placement)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing placement input")
    act(() => setInputValue(input, "keine Zahl"))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Aufgabe 2 von 9")
    expect(container.textContent).not.toContain("Falsch.")
    expect(container.querySelector(".feedback.format")).toBeNull()
    expect(onSessionChange.mock.calls.at(-1)?.[0].question).toMatchObject({
      mistakes: 1,
      results: [{
        attempts: 1,
        independentlySolved: false,
        solved: false,
        submittedAnswer: "keine Zahl",
        diagnostic: {
          kind: "format",
          resolved: false,
        },
      }],
    })
  })

  it("explains provisional placement without awarding XP", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createInitialLearner(now)
    const task = buildPlacementTask(learner)
    const questions = generateQuestionsForTask(task)
    const questionResults = questions.map((question, index) => ({
      questionId: question.id,
      topicId: question.topicId,
      attempts: 1,
      hintsUsed: 0,
      activeSeconds: 20,
      independentlySolved: index < 3,
      solved: index < 3,
      submittedAnswer: index < 3 ? "correct" : "999",
      difficultyBand: question.generation?.difficultyBand,
    }))
    const event: LearningEvent = {
      id: "event:placement:ui",
      taskId: task.id,
      taskKind: "placement",
      topicIds: task.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 160,
      mistakes: 5,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults,
    }
    const result = recordCompletion(learner, task, event)

    act(() => {
      root.render(
        <CompletionView
          summary={{ task, event, award: result.award, learner: result.state }}
          onContinue={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("STARTPUNKT GEFUNDEN")
    expect(container.textContent).toContain("3/9")
    expect(container.textContent).toContain("kehren morgen zur Wiederholung zurück")
    expect(container.textContent).toContain("DEINE ERSTEN 7 TAGE")
    expect(container.textContent).toContain("Ab morgen")
    expect(container.textContent).toContain("3 kurze Reviews werden fällig")
    expect(container.textContent).toContain("Di · Do · Sa · 15 Min.")
    expect(container.textContent).toContain("gibt keine XP")
    expect(container.textContent).toContain("FEHLER-RÜCKBLICK")
    expect(container.textContent).toContain("6 Fehler")
    expect(container.textContent).toContain("Deine Antwort")
    expect(container.textContent).toContain("Richtige Antwort")
    expect(container.textContent).toContain("Warum")
    expect(container.querySelectorAll(".session-next-action")).toHaveLength(1)
    expect(container.querySelector(".xp-earned")).toBeNull()
  })

  it("keeps earned lesson XP visible while explaining a required securing round", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now).find((candidate) => candidate.kind === "lesson")!
    const questions = generateQuestionsForTask(task)
    const event: LearningEvent = {
      id: "event:lesson:needs-securing:ui",
      taskId: task.id,
      taskKind: task.kind,
      topicIds: task.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 120,
      mistakes: 2,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: questions.map((question, index) => ({
        questionId: question.id,
        topicId: question.topicId,
        attempts: index === 0 ? 3 : 1,
        hintsUsed: 0,
        activeSeconds: 40,
        independentlySolved: index !== 0,
        difficultyBand: question.generation?.difficultyBand,
      })),
    }
    const result = recordCompletion(learner, task, event)

    act(() => {
      root.render(
        <CompletionView
          summary={{ task, event, award: result.award, learner: result.state }}
          onContinue={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Die Idee ist begonnen.")
    expect(container.textContent).toContain("Deine verdienten XP bleiben.")
    expect(container.textContent).toContain("Verständnis im Aufbau")
    expect(container.textContent).toContain("Mit Unterstützung")
    expect(container.textContent).toContain("selbständig")
    expect(container.textContent).toContain(`+${result.award.totalXp}`)
    expect(container.textContent).not.toContain("Diese Wiederholung zählt.")
    expect(container.querySelectorAll(".session-next-action")).toHaveLength(1)
    expect(document.activeElement).toBe(container.querySelector(".completion-card h1"))
    const lessonEvidence = container.querySelector(".completion-evidence-disclosure")
    if (!(lessonEvidence instanceof HTMLDetailsElement)) throw new Error("Missing lesson evidence disclosure")
    expect(lessonEvidence.open).toBe(false)
    const lessonBack = buttonWithText(container, "Zurück zum Lernplan")
    expect(lessonBack.nextElementSibling).toBe(lessonEvidence)
    const lessonEvidenceSummary = lessonEvidence.querySelector("summary")
    if (!(lessonEvidenceSummary instanceof HTMLElement)) throw new Error("Missing lesson evidence summary")
    act(() => lessonEvidenceSummary.click())
    expect(lessonEvidence.open).toBe(true)
    const pacedLessonReviewMeta = container.querySelector(
      ".session-review-question small",
    )
    expect(pacedLessonReviewMeta).not.toBeNull()
    expect(pacedLessonReviewMeta?.textContent).not.toContain("Aufbau")

    const recoveryAt = new Date(
      now.getTime() + DEEP_RECOVERY_BREAK_HOURS * 60 * 60 * 1_000,
    )
    expect(buildAssignments(result.state, now).some(
      (candidate) => candidate.purpose === "lesson-recovery",
    )).toBe(false)
    const recovery = buildAssignments(result.state, recoveryAt).find(
      (candidate) => candidate.purpose === "lesson-recovery",
    )!
    const recoveryQuestions = generateQuestionsForTask(recovery)
    const recoveryEvent: LearningEvent = {
      id: "event:lesson:securing:ui",
      taskId: recovery.id,
      taskKind: recovery.kind,
      taskPurpose: recovery.purpose,
      topicIds: recovery.topicIds,
      completedAt: recoveryAt.toISOString(),
      activeSeconds: 80,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: recoveryQuestions.map((question, index) => ({
        questionId: question.id,
        topicId: question.topicId,
        attempts: index === 0 ? 2 : 1,
        hintsUsed: 0,
        activeSeconds: 40,
        independentlySolved: index !== 0,
        difficultyBand: question.generation?.difficultyBand,
      })),
    }
    const recoveryResult = recordCompletion(result.state, recovery, recoveryEvent)

    act(() => {
      root.render(
        <CompletionView
          summary={{
            task: recovery,
            event: recoveryEvent,
            award: recoveryResult.award,
            learner: recoveryResult.state,
          }}
          onContinue={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Wir bleiben bei dieser Idee.")
    expect(container.textContent).toContain("Sicherungs-XP")
    expect(container.textContent).toContain(`vollen ${recovery.maxXp} XP`)
    expect(container.textContent).not.toContain("Wiederholungs-XP")
    expect(
      container.querySelector(".session-review-question small")?.textContent,
    ).toContain("Aufbau")
  })

  it("debriefs a difficult review without changing its fixed smaller XP", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const reviewTask: LearningTask = {
      id: "review:mass-units:debrief-ui",
      kind: "review",
      title: "kg und g wiederholen",
      description: "Schwierige Erinnerung mit neuen Zahlen",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 2,
      seed: "review:mass-units:debrief-ui",
      generation: { version: 2, difficultyBands: ["standard", "exam"] },
    }
    const questions = generateQuestionsForTask(reviewTask)
    const event: LearningEvent = {
      id: "event:review:debrief-ui",
      taskId: reviewTask.id,
      taskKind: reviewTask.kind,
      topicIds: reviewTask.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 105,
      mistakes: 2,
      hintsUsed: 1,
      independentlyCompleted: false,
      questionResults: questions.map((question, index) => ({
        questionId: question.id,
        topicId: question.topicId,
        attempts: index === 0 ? 2 : 1,
        hintsUsed: index === 0 ? 1 : 0,
        activeSeconds: index === 0 ? 70 : 35,
        independentlySolved: index === 1,
        solved: index === 1,
        difficultyBand: question.generation?.difficultyBand,
        ...(index === 0 ? {
          diagnostic: {
            kind: "unit-conversion" as const,
            title: "Die 1000er-Richtung braucht noch einen sicheren Anker.",
            resolved: false,
          },
        } : {}),
      })),
    }
    const result = recordCompletion(learner, reviewTask, event)
    const onRetryTopic = vi.fn()
    const onOpenConcept = vi.fn()
    const onLearnerFeedback = vi.fn()
    const discardedWrongEntry = "937-falsche-rohe-eingabe"

    act(() => {
      root.render(
        <CompletionView
          summary={{ task: reviewTask, event, award: result.award, learner: result.state }}
          onContinue={() => undefined}
          onRetryTopic={onRetryTopic}
          onOpenConcept={onOpenConcept}
          onLearnerFeedback={onLearnerFeedback}
        />,
      )
    })

    expect(result.award.totalXp).toBe(reviewTask.maxXp)
    expect(container.textContent).toContain("Diese Wiederholung zählt.")
    expect(container.textContent).toContain("vollen 4 XP")
    expect(container.textContent).toContain("RUNDEN-RÜCKBLICK")
    expect(container.textContent).toContain("Mit Lösung abgeschlossen")
    expect(container.textContent).toContain("Die 1000er-Richtung braucht noch einen sicheren Anker.")
    expect(container.textContent).toContain("Lernbelege")
    expect(container.textContent).toContain("keine Prüfungs-Punkte")
    expect(container.textContent).toContain("Falsche Eingaben werden nach dem Abschluss nicht gespeichert")
    expect(container.textContent).toContain("Mathematischen Weg ansehen")
    expect(container.textContent).not.toContain(discardedWrongEntry)
    expect(container.textContent).toContain("DEINE SICHT ZÄHLT")
    expect(container.textContent).toContain("verändert weder XP noch Behaltensstand")
    const reviewEvidence = container.querySelector(".completion-evidence-disclosure")
    const feedbackDisclosure = container.querySelector(".completion-feedback-disclosure")
    if (!(reviewEvidence instanceof HTMLDetailsElement) || !(feedbackDisclosure instanceof HTMLDetailsElement)) {
      throw new Error("Missing completion disclosures")
    }
    expect(reviewEvidence.open).toBe(false)
    expect(feedbackDisclosure.open).toBe(false)
    const recoveryActions = container.querySelector(".completion-recovery-actions")
    const retryVariant = buttonWithText(container, "Neue Variante lösen")
    const openIdea = buttonWithText(container, "Grundidee öffnen")
    expect(recoveryActions?.contains(retryVariant)).toBe(true)
    expect(recoveryActions?.contains(openIdea)).toBe(true)
    expect(reviewEvidence.contains(retryVariant)).toBe(false)
    expect(reviewEvidence.contains(openIdea)).toBe(false)
    const reviewEvidenceSummary = reviewEvidence.querySelector(":scope > summary")
    if (!(reviewEvidenceSummary instanceof HTMLElement)) throw new Error("Missing review evidence summary")
    act(() => reviewEvidenceSummary.click())
    expect(reviewEvidence.open).toBe(true)
    const feedbackSummary = feedbackDisclosure.querySelector("summary")
    if (!(feedbackSummary instanceof HTMLElement)) throw new Error("Missing feedback disclosure summary")
    act(() => feedbackSummary.click())
    expect(feedbackDisclosure.open).toBe(true)

    act(() => buttonWithStrongText(container, "Die Erklärung war noch unklar").click())
    expect(onLearnerFeedback).toHaveBeenCalledWith("explanation-unclear")

    const learnerWithFeedback = recordLearnerFeedback(
      result.state,
      event.id,
      "explanation-unclear",
      new Date("2026-07-14T12:01:00.000Z"),
    )
    act(() => {
      root.render(
        <CompletionView
          summary={{ task: reviewTask, event, award: result.award, learner: learnerWithFeedback }}
          onContinue={() => undefined}
          onRetryTopic={onRetryTopic}
          onOpenConcept={onOpenConcept}
          onLearnerFeedback={onLearnerFeedback}
        />,
      )
    })
    expect(container.textContent).toContain("Gespeichert: Die Erklärung war noch unklar")
    expect(container.textContent).toContain("Öffne die Grundidee im Konzept-Labor")
    expect((container.querySelector(".completion-feedback-disclosure") as HTMLDetailsElement).open).toBe(true)
    expect(learnerWithFeedback.totalXp).toBe(result.state.totalXp)
    act(() => buttonWithText(container, "Grundidee anders öffnen").click())
    expect(onOpenConcept).toHaveBeenCalledWith("mass-units")

    act(() => buttonWithText(container, "Neue Variante lösen").click())
    expect(onRetryTopic).toHaveBeenCalledWith("mass-units")
    act(() => buttonWithText(container, "Grundidee öffnen").click())
    expect(onOpenConcept).toHaveBeenCalledWith("mass-units")
  })

  it("waits for a deliberate start before timing or showing questions", () => {
    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(assessment)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    act(() => vi.advanceTimersByTime(3000))
    expect(container.textContent).toContain("Zeig, was schon ohne Hilfe sitzt.")
    expect(container.textContent).toContain("EXPEDITIONS-CHECK 4")
    expect(container.textContent).toContain("Gemischte Runde")
    expect(container.textContent).toContain("Rückweg")
    expect(container.textContent).toContain("Bereit")
    expect(container.textContent).toContain("Was noch nicht stimmt, wird nach dem Abschluss erklärt.")
    expect(container.querySelector(".question-card")).toBeNull()
    expect(Array.from(container.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Pause")).toBe(false)

    act(() => buttonWithText(container, "Standortbestimmung starten").click())
    expect(container.querySelector(".question-card")).not.toBeNull()
    expect(Array.from(container.querySelectorAll("button")).some((button) => button.textContent?.trim() === "Pause")).toBe(false)

    act(() => vi.advanceTimersByTime(1000))
    expect(container.textContent).toContain("0:01")
  })

  it("uses plain assessment language in focus mode without changing the assessment", () => {
    const onSessionChange = vi.fn()
    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(assessment)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
          minimalFocus
        />,
      )
    })

    expect(container.textContent).toContain("STANDORTBESTIMMUNG 4")
    expect(container.textContent).toContain("Vorbereitung")
    expect(container.textContent).toContain("Wiederholungsplan")
    expect(container.textContent).not.toContain("EXPEDITIONS-CHECK")
    expect(container.textContent).not.toContain("Checkpoint")
    expect(container.querySelector('[aria-label="Ablauf der Standortbestimmung"]')).not.toBeNull()

    act(() => buttonWithText(container, "Standortbestimmung starten").click())
    expect(container.querySelector(".question-card")).not.toBeNull()
    expect(onSessionChange).toHaveBeenLastCalledWith(expect.objectContaining({
      task: assessment,
      phase: "questions",
    }))
  })

  it("restores the saved answer, question position, and active timer", () => {
    const resumed = createActiveLearningSession(assessment)
    resumed.phase = "questions"
    resumed.activeSeconds = 47
    resumed.question.answer = "6,75"
    resumed.question.questionStartedAt = 31
    const onSessionChange = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={resumed}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing resumed input")
    expect(input.value).toBe("6,75")
    expect(container.textContent).toContain("0:47")

    act(() => vi.advanceTimersByTime(1000))
    expect(container.textContent).toContain("0:48")
    expect(onSessionChange.mock.calls.at(-1)?.[0].activeSeconds).toBe(48)
  })

  it("pauses only active practice time, hides the problem, and resumes the saved answer", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const review = buildAssignments(learner, now).find((task) => task.kind === "review")!
    const session = createActiveLearningSession(review, now)
    session.question.answer = "42"
    const onSessionChange = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    expect(container.querySelector(".question-card")).not.toBeNull()
    act(() => vi.advanceTimersByTime(2_000))
    expect(container.textContent).toContain("0:02")

    act(() => buttonWithText(container, "Pause").click())
    expect(container.textContent).toContain("LERNZEIT PAUSIERT")
    expect(container.querySelector(".question-card")).toBeNull()
    expect(buttonWithText(container, "Weiter").getAttribute("aria-pressed")).toBe("true")
    expect(onSessionChange.mock.calls.at(-1)?.[0]).toMatchObject({
      activeSeconds: 2,
      timerPaused: true,
      question: { answer: "42" },
    })

    act(() => vi.advanceTimersByTime(5_000))
    expect(container.textContent).toContain("0:02 aktive Lernzeit")
    expect(onSessionChange.mock.calls.at(-1)?.[0].activeSeconds).toBe(2)

    act(() => buttonWithText(container, "Weiterlernen").click())
    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing resumed practice input")
    expect(input.value).toBe("42")
    expect(container.querySelector(".question-card")).not.toBeNull()
    act(() => vi.advanceTimersByTime(1_000))
    expect(container.textContent).toContain("0:03")
    expect(onSessionChange.mock.calls.at(-1)?.[0]).toMatchObject({
      activeSeconds: 3,
      timerPaused: false,
    })
  })

  it("turns a practice mistake into concise concept-specific guidance", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now).find((candidate) => candidate.kind === "lesson")
    if (!task) throw new Error("Missing lesson task")
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "number") throw new Error("Expected numeric lesson question")
    const wrongAnswer = String(question.response.value + 12345)

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing practice input")
    act(() => setInputValue(input, wrongAnswer))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Prüfe die Rechenrichtung.")
    expect(container.textContent).toContain("Als Nächstes")
    expect(container.textContent).toContain("Gegenoperation")
    expect(container.textContent).toContain("Ein kleiner Hinweis")
    expect(container.textContent).not.toContain(question.explanation)
  })

  it("treats an input-format retry as validation rather than a learning mistake", () => {
    const task: LearningTask = {
      id: "review:mass-units:format-slip",
      kind: "review",
      title: "kg und g wiederholen",
      description: "Antwortformat und Rechenidee getrennt behandeln",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:mass-units:format-slip",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "number") throw new Error("Expected numeric review question")
    const answerUnit = question.response.unit
    const onSessionChange = vi.fn()
    const onFinish = vi.fn<(event: LearningEvent) => void>()
    const onRequestTeacherSupport = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task)}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
          onRequestTeacherSupport={onRequestTeacherSupport}
        />,
      )
    })

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing review input")
    const correctAnswer = String(question.response.value).replace(".", ",")
    act(() => setInputValue(input, `${correctAnswer} ${answerUnit ?? "kg"}`))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.querySelector(".feedback.format")).not.toBeNull()
    expect(container.textContent).toContain("Das zählt nicht als Fehler.")
    expect(buttonWithText(container, "Prüfen").disabled).toBe(false)
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(input.getAttribute("aria-describedby")).toContain("format-retry-feedback")
    expect(container.querySelector("#format-retry-feedback")).not.toBeNull()
    expect(onSessionChange.mock.calls.at(-1)?.[0].question).toMatchObject({
      submissions: 0,
      mistakes: 0,
      feedback: "wrong",
    })
    expect(onSessionChange.mock.calls.at(-1)?.[0].question.firstDiagnostic).toBeUndefined()

    act(() => setInputValue(input, correctAnswer))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.querySelector(".answer-submit-row")).toBeNull()
    expect(container.querySelector(".help-panel")).toBeNull()
    const secondaryActions = container.querySelector(".question-secondary-actions")
    const secondarySummary = secondaryActions?.querySelector("summary")
    if (!(secondaryActions instanceof HTMLDetailsElement) || !(secondarySummary instanceof HTMLElement)) {
      throw new Error("Missing final-response options")
    }
    act(() => secondarySummary.click())
    expect(secondaryActions.open).toBe(true)
    expect(secondaryActions.querySelector("a")?.textContent).toContain("Fehler in dieser Aufgabe melden")
    expect(secondaryActions.textContent).not.toContain("Ich verstehe dieses Thema noch nicht")
    expect(onRequestTeacherSupport).not.toHaveBeenCalled()
    act(() => buttonWithText(container, "Abschliessen").click())

    expect(onFinish).toHaveBeenCalledOnce()
    const event = onFinish.mock.calls[0]![0]
    expect(event).toMatchObject({
      mistakes: 0,
      independentlyCompleted: true,
    })
    expect(event.questionResults[0]).toMatchObject({
      attempts: 1,
      independentlySolved: true,
      solved: true,
    })
    expect(event.questionResults[0]?.diagnostic).toBeUndefined()
  })

  it("persists the adapted next question atomically and replays it after a reload", () => {
    const task: LearningTask = {
      id: "lesson:mass-units:adaptive-resume",
      kind: "lesson",
      title: "Adaptive Masseinheiten",
      description: "Die nächste Aufgabe passt sich im gespeicherten Lernstand an.",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 3,
      seed: "lesson:mass-units:adaptive-resume",
      generation: {
        version: 5,
        difficultyBands: ["foundation", "foundation", "standard"],
      },
      pacing: {
        version: 1,
        mode: "supported",
      },
    }
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    const firstQuestion = generateQuestionsForTask(task)[0]!
    if (firstQuestion.response.kind !== "number") {
      throw new Error("Expected numeric adaptive lesson question")
    }
    const onSessionChange = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    expect(container.querySelector(".difficulty-pill")).toBeNull()
    const firstProgress = container.querySelector(".thin-progress")
    expect(firstProgress?.getAttribute("role")).toBe("progressbar")
    expect(firstProgress?.getAttribute("aria-label")).toBe("Aufgabe 1 von 3")
    expect(firstProgress?.getAttribute("aria-valuemin")).toBe("1")
    expect(firstProgress?.getAttribute("aria-valuemax")).toBe("3")
    expect(firstProgress?.getAttribute("aria-valuenow")).toBe("1")
    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing adaptive lesson input")
    const correctAnswer = String(firstQuestion.response.value).replace(".", ",")
    const answerUnit = firstQuestion.response.unit
    act(() => setInputValue(
      input,
      `${correctAnswer} ${answerUnit ?? "kg"}`,
    ))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(onSessionChange.mock.calls.at(-1)?.[0]).toMatchObject({
      task: {
        generation: {
          difficultyBands: ["foundation", "foundation", "standard"],
        },
      },
      question: {
        submissions: 0,
        mistakes: 0,
        results: [],
      },
    })

    act(() => setInputValue(input, correctAnswer))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    act(() => buttonWithText(container, "Weiter").click())

    const savedSession = structuredClone(onSessionChange.mock.calls.at(-1)?.[0])
    expect(savedSession).toMatchObject({
      task: {
        generation: {
          difficultyBands: ["foundation", "standard", "standard"],
        },
        pacing: {
          version: 1,
          mode: "supported",
        },
      },
      question: {
        questionIndex: 1,
        submissions: 0,
        mistakes: 0,
        results: [{
          attempts: 1,
          independentlySolved: true,
          solved: true,
          difficultyBand: "foundation",
        }],
      },
    })
    const expectedNextQuestion = generateQuestionsForTask(savedSession.task)[1]!
    const nextPrompt = container.querySelector(".question-card h1")
    expect(nextPrompt?.textContent).toBe(expectedNextQuestion.prompt)
    expect(document.activeElement).toBe(nextPrompt)
    expect(container.querySelector(".thin-progress")?.getAttribute("aria-valuenow")).toBe("2")

    act(() => root.unmount())
    root = createRoot(container)
    act(() => {
      root.render(
        <TaskPlayer
          initialSession={savedSession}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.querySelector(".question-card h1")?.textContent).toBe(
      expectedNextQuestion.prompt,
    )
    expect(container.querySelector(".difficulty-pill")).toBeNull()
    expect(container.textContent).toContain("Aufgabe 2 von 3")
  })

  it("counts the first mathematical miss after a free format correction", () => {
    const task: LearningTask = {
      id: "review:mass-units:format-then-concept",
      kind: "review",
      title: "kg und g wiederholen",
      description: "Nur mathematische Fehler werten",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:mass-units:format-slip",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "number") throw new Error("Expected numeric review question")
    const correctAnswer = String(question.response.value).replace(".", ",")
    const answerUnit = question.response.unit
    const mathematicalWrongAnswer = String(question.response.value + 12_345)
    const onSessionChange = vi.fn()
    const onFinish = vi.fn<(event: LearningEvent) => void>()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task)}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing review input")
    act(() => setInputValue(input, `${correctAnswer} ${answerUnit ?? "kg"}`))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(onSessionChange.mock.calls.at(-1)?.[0].question).toMatchObject({
      submissions: 0,
      mistakes: 0,
    })

    act(() => setInputValue(input, mathematicalWrongAnswer))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(onSessionChange.mock.calls.at(-1)?.[0].question).toMatchObject({
      submissions: 1,
      mistakes: 1,
      firstDiagnostic: {
        kind: "concept",
      },
    })

    act(() => setInputValue(input, correctAnswer))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    act(() => buttonWithText(container, "Abschliessen").click())

    expect(onFinish.mock.calls[0]![0]).toMatchObject({
      mistakes: 1,
      independentlyCompleted: false,
      questionResults: [{
        attempts: 2,
        independentlySolved: false,
        diagnostic: {
          kind: "concept",
          resolved: true,
        },
      }],
    })
  })

  it("does not relabel a format mistake already counted by an older paused session", () => {
    const task: LearningTask = {
      id: "review:mass-units:legacy-format-slip",
      kind: "review",
      title: "kg und g wiederholen",
      description: "Historische Wertung unverändert fortsetzen",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:mass-units:format-slip",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "number") throw new Error("Expected numeric review question")
    const correctAnswer = String(question.response.value).replace(".", ",")
    const session = createActiveLearningSession(task)
    session.question.answer = `${correctAnswer} ${question.response.unit ?? "kg"}`
    session.question.submissions = 1
    session.question.mistakes = 1
    session.question.feedback = "wrong"
    session.question.firstDiagnostic = {
      kind: "format",
      title: "Diese Eingabe ist noch keine Zahl.",
    }
    const onFinish = vi.fn<(event: LearningEvent) => void>()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.querySelector(".feedback.wrong")).not.toBeNull()
    expect(container.querySelector(".feedback.format")).toBeNull()
    expect(container.textContent).not.toContain("Das zählt nicht als Fehler.")

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing review input")
    act(() => setInputValue(input, correctAnswer))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    act(() => buttonWithText(container, "Abschliessen").click())

    expect(onFinish.mock.calls[0]![0]).toMatchObject({
      mistakes: 1,
      independentlyCompleted: false,
      questionResults: [{
        attempts: 2,
        independentlySolved: false,
        diagnostic: {
          kind: "format",
          resolved: true,
        },
      }],
    })
  })

  it("keeps format validation outside guided-step scoring and flawless lesson XP", () => {
    const task: LearningTask = {
      id: "lesson:reverse-chains:format-slip",
      kind: "lesson",
      title: "Rückwärtsketten verstehen",
      description: "Schritt für Schritt",
      topicIds: ["reverse-chains"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 1,
      seed: "lesson:reverse-chains:format-slip",
    }
    const question = generateQuestionsForTask(task)[0]!
    const steps = question.practiceSteps ?? []
    expect(steps).toHaveLength(4)
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    const onSessionChange = vi.fn()
    const onFinish = vi.fn<(event: LearningEvent) => void>()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    const firstInput = container.querySelector(`#answer-step-${steps[0]!.id}`)
    if (!(firstInput instanceof HTMLInputElement)) throw new Error("Missing first guided step")
    act(() => setInputValue(firstInput, `${steps[0]!.value} kg`))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.querySelector(".practice-step.format")).not.toBeNull()
    expect(container.querySelector(".feedback.format")).not.toBeNull()
    expect(firstInput.getAttribute("aria-invalid")).toBe("true")
    expect(firstInput.getAttribute("aria-describedby")).toContain("format-retry-feedback")
    expect(onSessionChange.mock.calls.at(-1)?.[0].question).toMatchObject({
      submissions: 0,
      mistakes: 0,
      verifiedPracticeSteps: [],
    })
    expect(onSessionChange.mock.calls.at(-1)?.[0].question.firstDiagnostic).toBeUndefined()

    for (const step of steps) {
      const input = container.querySelector(`#answer-step-${step.id}`)
      if (!(input instanceof HTMLInputElement)) throw new Error(`Missing guided step ${step.id}`)
      act(() => setInputValue(input, String(step.value)))
      act(() => {
        container.querySelector("form")?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        )
      })
    }
    act(() => buttonWithText(container, "Abschliessen").click())

    expect(onFinish).toHaveBeenCalledOnce()
    const event = onFinish.mock.calls[0]![0]
    expect(event).toMatchObject({
      mistakes: 0,
      independentlyCompleted: true,
    })
    expect(event.questionResults[0]).toMatchObject({
      attempts: 1,
      independentlySolved: true,
      solved: true,
      verifiedStepIds: steps.map((step) => step.id),
    })
    expect(event.questionResults[0]?.diagnostic).toBeUndefined()

    const result = recordCompletion(
      createSeededLearner(new Date(event.completedAt)),
      task,
      event,
    )
    expect(result.award).toMatchObject({
      totalXp: 33,
      reason: "lesson-flawless",
    })
    expect(result.state.mastery["reverse-chains"].status).toBe("mastered")
    expect(buildAssignments(result.state, new Date(event.completedAt)).some(
      (assignment) => assignment.purpose === "lesson-recovery" &&
        assignment.topicIds.includes("reverse-chains"),
    )).toBe(false)
  })

  it("grades a complete constrained-number set in any order and preserves the typed set", () => {
    const task: LearningTask = {
      id: "lesson:number-constraints:set-ui",
      kind: "lesson",
      title: "Zahlen filtern",
      description: "Alle Lösungen finden",
      topicIds: ["number-constraints"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 1,
      seed: "lesson:number-constraints:set-ui",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "integer-set") throw new Error("Expected integer-set response")
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    const onSessionChange = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing set input")
    expect(input.placeholder).toContain("1234")

    const partial = question.response.values.slice(0, -1).join(", ")
    act(() => setInputValue(input, partial))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("die Liste ist noch nicht vollständig")
    expect(container.textContent).not.toContain(question.response.values.join(", "))

    const complete = [...question.response.values].reverse().join("; ")
    act(() => setInputValue(input, complete))
    expect(onSessionChange.mock.calls.at(-1)?.[0].question.answer).toBe(complete)
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Richtig.")
  })

  it("renders a semantic dynamic table and coaches a wrong table calculation", () => {
    const task: LearningTask = {
      id: "lesson:data-tables:table-ui",
      kind: "lesson",
      title: "Tabellen lesen",
      description: "Zeilen und Spalten verbinden",
      topicIds: ["data-tables"],
      prerequisiteIds: ["arithmetic-equations"],
      maxXp: 25,
      questionCount: 1,
      seed: "lesson:data-tables:table-ui",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "number") throw new Error("Expected numeric table response")
    const correctValue = question.response.value
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    const onFinish = vi.fn<(event: LearningEvent) => void>()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    const table = container.querySelector(".data-table-question table")
    expect(table).toBeInstanceOf(HTMLTableElement)
    expect(table?.querySelectorAll("th, td").length).toBeGreaterThan(4)

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing table answer input")
    act(() => setInputValue(input, String(correctValue + 123)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Prüfe Zeile und Spalte vor der Rechnung.")
    expect(container.textContent).not.toContain(question.explanation)

    act(() => setInputValue(input, String(correctValue).replace(".", ",")))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Richtig.")
    act(() => buttonWithText(container, "Abschliessen").click())
    expect(onFinish.mock.calls[0]?.[0].questionResults[0]?.diagnostic).toMatchObject({
      resolved: true,
    })
  })

  it("stores both coordinate fields and requires an ordered pair", () => {
    const task: LearningTask = {
      id: "lesson:coordinate-transformations:coordinate-ui",
      kind: "lesson",
      title: "Koordinaten abbilden",
      description: "Punkte transformieren",
      topicIds: ["coordinate-transformations"],
      prerequisiteIds: ["arithmetic-equations"],
      maxXp: 25,
      questionCount: 1,
      seed: "lesson:coordinate-transformations:coordinate-ui",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "coordinate") throw new Error("Expected coordinate response")
    const correctX = question.response.x
    const correctY = question.response.y
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    const onSessionChange = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    expect(container.querySelector(".coordinate-plane-question svg")).toBeInstanceOf(SVGElement)
    const xInput = container.querySelector("#coordinate-x")
    const yInput = container.querySelector("#coordinate-y")
    if (!(xInput instanceof HTMLInputElement) || !(yInput instanceof HTMLInputElement)) {
      throw new Error("Missing coordinate inputs")
    }

    act(() => setInputValue(xInput, "keine Zahl"))
    act(() => setInputValue(yInput, String(correctY)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.querySelector(".feedback.format")).not.toBeNull()
    expect(xInput.getAttribute("aria-invalid")).toBe("true")
    expect(yInput.getAttribute("aria-invalid")).toBeNull()
    expect(xInput.getAttribute("aria-describedby")).toBe("format-retry-feedback")
    expect(yInput.getAttribute("aria-describedby")).toBeNull()
    expect(onSessionChange.mock.calls.at(-1)?.[0].question).toMatchObject({
      submissions: 0,
      mistakes: 0,
    })

    act(() => setInputValue(yInput, ""))
    act(() => setInputValue(xInput, String(correctX + 10)))
    expect(buttonWithText(container, "Prüfen").disabled).toBe(true)
    act(() => setInputValue(yInput, String(correctY)))
    expect(buttonWithText(container, "Prüfen").disabled).toBe(false)
    expect(onSessionChange.mock.calls.at(-1)?.[0].question.answer).toBe(`${correctX + 10}|${correctY}`)

    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Wende die Regel getrennt auf x und y an.")
    expect(container.textContent).not.toContain(question.explanation)

    act(() => setInputValue(xInput, String(correctX)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Richtig.")
  })

  it("renders a folded cube net and gives spatial feedback before the answer", () => {
    const task: LearningTask = {
      id: "lesson:cube-nets:net-ui",
      kind: "lesson",
      title: "Würfelnetze",
      description: "Gegenflächen finden",
      topicIds: ["cube-nets"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 1,
      seed: "lesson:cube-nets:net-ui",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "choice") throw new Error("Expected cube-net choices")
    const correctChoiceId = question.response.value
    const correctOption = question.response.options.find(
      (option) => option.id === correctChoiceId,
    )!
    const wrongOption = question.response.options.find(
      (option) => option.id !== correctChoiceId,
    )!
    const session = createActiveLearningSession(task)
    session.phase = "questions"

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.querySelectorAll(".cube-net-question [data-face-label]")).toHaveLength(6)
    expect(container.querySelectorAll(".cube-net-question .target")).toHaveLength(1)

    act(() => choiceButtonWithLabel(container, wrongOption.label).click())
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Falte nur eine gemeinsame Kante auf einmal.")
    expect(container.textContent).not.toContain(question.explanation)

    act(() => choiceButtonWithLabel(container, correctOption.label).click())
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Richtig.")
  })

  it("checks a dynamic reverse chain from the first wrong intermediate step", () => {
    const task: LearningTask = {
      id: "lesson:reverse-chains:guided-ui",
      kind: "lesson",
      title: "Rückwärtsketten verstehen",
      description: "Schritt für Schritt",
      topicIds: ["reverse-chains"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 1,
      seed: "lesson:reverse-chains:guided-ui",
    }
    const question = generateQuestionsForTask(task)[0]!
    const steps = question.practiceSteps ?? []
    expect(steps).toHaveLength(4)
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    session.question.answer = encodePracticeStepAnswers({
      [steps[0]!.id]: String(steps[0]!.value),
      [steps[1]!.id]: String(steps[1]!.value + 10),
      [steps[2]!.id]: String(steps[2]!.value + 20),
      [steps[3]!.id]: String(steps[3]!.value),
    })
    session.question.verifiedPracticeSteps = [steps[0]!.id]
    const onFinish = vi.fn<(event: LearningEvent) => void>()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Baue den Rechenweg auf")
    expect(container.querySelectorAll(".practice-step-input input")).toHaveLength(4)
    expect((container.querySelector("#answer-step-jars") as HTMLInputElement).value).toBe(
      String(steps[0]!.value),
    )

    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Prüfe Schritt 2")
    expect(container.textContent).toContain("Der erste Schritt stimmt")
    expect(container.querySelectorAll(".practice-step.correct")).toHaveLength(1)
    expect(container.querySelectorAll(".practice-step.attention")).toHaveLength(1)
    expect(container.textContent).not.toContain(question.explanation)

    const secondInput = container.querySelector("#answer-step-before-cooking")
    if (!(secondInput instanceof HTMLInputElement)) throw new Error("Missing second step")
    act(() => setInputValue(secondInput, String(steps[1]!.value)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Schritt 2 stimmt. Weiter mit Schritt 3")
    expect(container.querySelectorAll(".practice-step.correct")).toHaveLength(2)

    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Prüfe Schritt 3")

    const thirdInput = container.querySelector("#answer-step-before-sorting")
    if (!(thirdInput instanceof HTMLInputElement)) throw new Error("Missing third step")
    act(() => setInputValue(thirdInput, String(steps[2]!.value)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Schritt 3 stimmt. Weiter mit Schritt 4")
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(container.textContent).toContain("Richtig.")
    act(() => buttonWithText(container, "Abschliessen").click())
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onFinish.mock.calls[0]![0]).toMatchObject({ mistakes: 1 })
    expect(onFinish.mock.calls[0]![0].questionResults[0]).toMatchObject({
      attempts: 3,
      independentlySolved: false,
      solved: true,
      verifiedStepIds: steps.map((step) => step.id),
    })
  })

  it("keeps reverse-chain reviews as independent final-answer work", () => {
    const review: LearningTask = {
      id: "review:reverse-chains:independent-ui",
      kind: "review",
      title: "Rückwärtsketten wiederholen",
      description: "Unabhängig lösen",
      topicIds: ["reverse-chains"],
      prerequisiteIds: [],
      maxXp: 8,
      questionCount: 1,
      seed: "review:reverse-chains:independent-ui",
    }

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(review)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(generateQuestionsForTask(review)[0]?.practiceSteps).toHaveLength(4)
    expect(container.querySelector(".practice-step-workbench")).toBeNull()
    expect(container.querySelectorAll(".answer-form input")).toHaveLength(1)
    expect(container.textContent).not.toContain("Baue den Rechenweg auf")
  })

  it("puts the learner's preferred help entry first without hiding any help", () => {
    const review: LearningTask = {
      id: "review:mass-units:preferred-help-ui",
      kind: "review",
      title: "kg und g wiederholen",
      description: "Dynamisch abrufen",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:mass-units:preferred-help-ui",
    }

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(review)}
          helpStyle="step-by-step"
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    const options = Array.from(container.querySelectorAll(".help-options button"))
    const helpPanel = container.querySelector(".help-panel")
    if (!(helpPanel instanceof HTMLDetailsElement)) throw new Error("Missing help disclosure")
    expect(options).toHaveLength(5)
    expect(helpPanel.open).toBe(false)
    expect(options[0]?.querySelector(".help-option-label")?.textContent).toBe("Schritt für Schritt")
    expect(options[0]?.classList.contains("recommended")).toBe(true)
    expect(options[0]?.getAttribute("aria-pressed")).toBe("false")
    expect(options[0]?.querySelector(".help-recommended-badge")?.textContent).toBe("Dein Einstieg")
    expect(options.map((option) => option.querySelector(".help-option-label")?.textContent)).toContain("Die Idee von Grund auf")
  })

  it("opens persisted help while a fresh question starts with help collapsed", () => {
    const review: LearningTask = {
      id: "review:mass-units:persisted-help-ui",
      kind: "review",
      title: "kg und g wiederholen",
      description: "Eine gespeicherte Hilfe bleibt auffindbar.",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:mass-units:persisted-help-ui",
    }
    const session = createActiveLearningSession(review)
    session.question.activeHelp = ["hint"]

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    const helpPanel = container.querySelector(".help-panel")
    if (!(helpPanel instanceof HTMLDetailsElement)) throw new Error("Missing persisted help disclosure")
    expect(helpPanel.open).toBe(true)
    expect(helpButtonWithLabel(container, "Ein kleiner Hinweis").getAttribute("aria-pressed")).toBe("true")
    expect(container.textContent).toContain("NÄCHSTER SCHRITT")
  })

  it("repairs a concept with a fresh teach-back check and preserves the original work", () => {
    const review: LearningTask = {
      id: "review:mass-units:concept-repair-ui",
      kind: "review",
      title: "kg und g wiederholen",
      description: "Abrufen und bei Bedarf neu aufbauen",
      topicIds: ["mass-units"],
      prerequisiteIds: [],
      maxXp: 4,
      questionCount: 1,
      seed: "review:mass-units:concept-repair-ui",
    }
    const sourceQuestion = generateQuestionsForTask(review)[0]!
    if (sourceQuestion.response.kind !== "number") throw new Error("Expected numeric source question")
    const sourceAnswer = sourceQuestion.response.value
    const repairSeed = `${review.seed}:question:0:concept-repair`
    const repairQuestions = buildConceptRepairQuestions(
      "mass-units",
      repairSeed,
      sourceQuestion.prompt,
      4,
    )
    if (repairQuestions.check.response.kind !== "number") throw new Error("Expected numeric concept check")
    const checkAnswer = repairQuestions.check.response.value
    const onSessionChange = vi.fn()
    const onFinish = vi.fn<(event: LearningEvent) => void>()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(review)}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={onSessionChange}
        />,
      )
    })

    const originalInput = container.querySelector("#answer")
    if (!(originalInput instanceof HTMLInputElement)) throw new Error("Missing original answer")
    act(() => setInputValue(originalInput, "mein gespeicherter Entwurf"))
    act(() => helpButtonWithLabel(container, "Die Idee von Grund auf").click())

    expect(container.textContent).toContain("Wir bauen die Idee gemeinsam neu auf.")
    expect(container.textContent).toContain("Deine ursprüngliche Antwort bleibt gespeichert")
    expect(onSessionChange.mock.calls.at(-1)?.[0].question).toMatchObject({
      answer: "mein gespeicherter Entwurf",
      activeHelp: ["concept"],
      conceptRepair: { version: 4, stage: "concept", seed: repairSeed },
    })

    act(() => buttonWithText(container, "Zeig mir ein Beispiel").click())
    expect(container.textContent).toContain(repairQuestions.example.prompt)
    expect(repairQuestions.example.prompt).not.toBe(sourceQuestion.prompt)

    act(() => buttonWithText(container, "Jetzt zeige ich es selbst").click())
    expect(container.textContent).toContain(repairQuestions.check.prompt)
    expect(repairQuestions.check.prompt).not.toBe(repairQuestions.example.prompt)

    const teachBack = container.querySelector("#teach-back-plan")
    const checkInput = container.querySelector("#concept-check-answer")
    if (!(teachBack instanceof HTMLTextAreaElement)) throw new Error("Missing teach-back field")
    if (!(checkInput instanceof HTMLInputElement)) throw new Error("Missing concept check answer")
    act(() => setTextareaValue(teachBack, "Ich bringe zuerst beide Angaben in dieselbe Einheit."))
    act(() => setInputValue(checkInput, String(checkAnswer)))
    act(() => buttonWithText(container, "Meinen Plan prüfen").click())

    expect(container.textContent).toContain("dein Plan hat funktioniert")
    act(() => buttonWithText(container, "Zurück zu meiner Aufgabe").click())

    const restoredInput = container.querySelector("#answer")
    if (!(restoredInput instanceof HTMLInputElement)) throw new Error("Missing restored answer")
    expect(restoredInput.value).toBe("mein gespeicherter Entwurf")
    expect(onSessionChange.mock.calls.at(-1)?.[0].question.conceptRepair).toBeUndefined()
    expect(onSessionChange.mock.calls.at(-1)?.[0].question.activeHelp).toEqual(["concept"])

    act(() => setInputValue(restoredInput, String(sourceAnswer)))
    act(() => buttonWithText(container, "Prüfen").click())
    act(() => buttonWithText(container, "Abschliessen").click())

    expect(onFinish).toHaveBeenCalledOnce()
    expect(onFinish.mock.calls[0]![0]).toMatchObject({ hintsUsed: 1, mistakes: 0 })
    expect(onFinish.mock.calls[0]![0].questionResults[0]).toMatchObject({
      attempts: 1,
      hintsUsed: 1,
      independentlySolved: false,
    })
  })

  it("grades a dynamic geometry construction by tool and placement without leaking the answer", () => {
    const task = geometryTask("lesson", "guided-ui")
    const question = generateQuestionsForTask(task)[0]!
    const spec = question.geometryConstruction
    if (!spec) throw new Error("Missing construction specification")
    const session = createActiveLearningSession(task)
    session.phase = "questions"
    const onFinish = vi.fn<(event: LearningEvent) => void>()
    const wrongTool: GeometryConstructionTool = spec.expectedTool === "circle" ? "parallel" : "circle"

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.querySelector(".geometry-workbench")).not.toBeNull()
    expect(container.querySelector(".answer-options")).toBeNull()
    expect(buttonWithText(container, "Konstruktion prüfen").disabled).toBe(true)

    act(() => geometryToolButton(container, wrongTool).click())
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Die Art der Konstruktion passt noch nicht")
    expect(container.textContent).toContain("Geraden, von einem Punkt oder")
    expect(container.textContent).not.toContain(question.explanation)

    act(() => geometryToolButton(container, spec.expectedTool).click())
    const range = container.querySelector('input[type="range"]')
    if (!(range instanceof HTMLInputElement)) throw new Error("Missing geometry range")
    act(() => setInputValue(range, String(spec.targetParameter + spec.tolerance + spec.snap)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Das Werkzeug passt, die Lage noch nicht")
    expect(container.textContent).not.toContain(question.explanation)

    act(() => setInputValue(range, String(spec.targetParameter)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Richtig.")
    expect(container.textContent).toContain(question.explanation)

    act(() => buttonWithText(container, "Abschliessen").click())
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onFinish.mock.calls[0]![0]).toMatchObject({ mistakes: 2 })
    expect(onFinish.mock.calls[0]![0].questionResults[0]).toMatchObject({
      attempts: 3,
      independentlySolved: false,
    })
  })

  it("uses the construction workspace for reviews and restores its semantic answer", () => {
    const task = geometryTask("review", "resume-ui")
    const question = generateQuestionsForTask(task)[0]!
    const spec = question.geometryConstruction
    if (!spec) throw new Error("Missing construction specification")
    const session = createActiveLearningSession(task)
    session.question.answer = encodeGeometryConstructionAnswer({
      version: 1,
      tool: spec.expectedTool,
      parameter: spec.targetParameter,
    })

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={session}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(container.querySelector(".geometry-workbench")).not.toBeNull()
    expect(container.querySelector(".answer-options")).toBeNull()
    expect(geometryToolButton(container, spec.expectedTool).getAttribute("aria-pressed")).toBe("true")
    expect((container.querySelector('input[type="range"]') as HTMLInputElement).value).toBe(
      String(spec.targetParameter),
    )
    expect(buttonWithText(container, "Konstruktion prüfen").disabled).toBe(false)
  })

  it("keeps geometric placement as a brief choice question", () => {
    const task = geometryTask("placement", "brief-ui")
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "choice") throw new Error("Expected placement choice")

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    expect(question.geometryConstruction).toBeDefined()
    expect(container.querySelector(".geometry-workbench")).toBeNull()
    expect(container.querySelector(".answer-options")).not.toBeNull()
    expect(container.querySelector(".locus-question")).not.toBeNull()
    expect(container.textContent).toContain("Start-Check: keine Note")
  })

  it("shows only the scenario givens in geometric-locus choice diagrams", () => {
    const examples = new Map<"line" | "point" | "point-pair", LearningTask>()

    for (let index = 0; index < 100 && examples.size < 3; index += 1) {
      const task = geometryTask("placement", `given-visual-${index}`)
      const question = generateQuestionsForTask(task)[0]!
      const referenceKind = question.geometryConstruction?.reference.kind
      if (referenceKind && !examples.has(referenceKind)) {
        examples.set(referenceKind, task)
      }
    }

    expect(examples.size).toBe(3)
    for (const [referenceKind, task] of examples) {
      act(() => {
        root.render(
          <TaskPlayer
            key={task.id}
            initialSession={createActiveLearningSession(task)}
            onBack={() => undefined}
            onFinish={() => undefined}
            onPrerequisite={() => undefined}
            onSessionChange={() => undefined}
          />,
        )
      })

      const visual = container.querySelector(`[data-locus-reference="${referenceKind}"]`)
      expect(visual).not.toBeNull()
      expect(visual?.textContent).toContain("Die gesuchte Grenze ist noch nicht eingezeichnet.")
      expect(visual?.textContent).not.toContain("Parallele")
      expect(visual?.textContent).not.toContain("Kreis")
      expect(visual?.textContent).not.toContain("Mittelsenkrechte")

      if (referenceKind === "line") {
        expect(visual?.textContent).toContain("Gerade s")
        expect(visual?.textContent).toContain("Richtung Norden")
        expect(visual?.textContent).not.toContain("Punkt F")
        expect(visual?.textContent).not.toContain("B₁")
        expect(visual?.querySelectorAll(".locus-given-line")).toHaveLength(1)
      } else if (referenceKind === "point") {
        expect(visual?.textContent).toContain("Punkt F")
        expect(visual?.textContent).not.toContain("Gerade s")
        expect(visual?.textContent).not.toContain("B₁")
        expect(visual?.querySelectorAll(".locus-given-point")).toHaveLength(1)
      } else {
        expect(visual?.textContent).toContain("Punkte B₁ und B₂")
        expect(visual?.textContent).not.toContain("Gerade s")
        expect(visual?.textContent).not.toContain("Punkt F")
        expect(visual?.querySelectorAll(".locus-given-point")).toHaveLength(2)
      }
    }
  })

  it("grades a submitted semantic construction once without revealing its explanation", () => {
    const task = geometryTask("assessment", "silent-ui")
    const question = generateQuestionsForTask(task)[0]!
    const spec = question.geometryConstruction
    if (!spec) throw new Error("Missing construction specification")
    const onFinish = vi.fn<(event: LearningEvent) => void>()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task)}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })
    act(() => buttonWithText(container, "Standortbestimmung starten").click())
    act(() => geometryToolButton(container, spec.expectedTool).click())
    const range = container.querySelector('input[type="range"]')
    if (!(range instanceof HTMLInputElement)) throw new Error("Missing geometry range")
    act(() => setInputValue(range, String(spec.targetParameter)))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(onFinish).not.toHaveBeenCalled()
    expect(container.textContent).toContain("Richtig.")
    expect(container.textContent).toContain("Antwort gespeichert. Der Rückblick folgt nach dem Abschluss.")
    expect(container.textContent).not.toContain(question.explanation)
    expect(range.disabled).toBe(true)

    act(() => buttonWithText(container, "Abschliessen").click())
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onFinish.mock.calls[0]![0].questionResults[0]).toMatchObject({
      attempts: 1,
      hintsUsed: 0,
      independentlySolved: true,
    })
  })

  it("uses a final submit action and defers the explanation for a correct assessment answer", () => {
    const onFinish = vi.fn<(event: LearningEvent) => void>()
    const onRequestTeacherSupport = vi.fn()
    const question = generateQuestionsForTask(assessment)[0]!
    if (question.response.kind !== "number") throw new Error("Expected a numeric test question")
    const correctValue = question.response.value

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(assessment)}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
          onRequestTeacherSupport={onRequestTeacherSupport}
        />,
      )
    })
    act(() => buttonWithText(container, "Standortbestimmung starten").click())

    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing assessment input")
    act(() => setInputValue(input, String(correctValue)))
    expect(buttonWithText(container, "Antwort abgeben").disabled).toBe(false)

    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(onFinish).not.toHaveBeenCalled()
    expect(input.disabled).toBe(true)
    expect(container.textContent).toContain("Richtig.")
    expect(container.textContent).toContain("Antwort gespeichert. Der Rückblick folgt nach dem Abschluss.")
    expect(container.textContent).not.toContain(question.explanation)
    expect(container.textContent).not.toContain("Ich verstehe es noch nicht")
    expect(container.querySelector(".answer-submit-row")).toBeNull()
    const secondaryActions = container.querySelector(".question-secondary-actions")
    const secondarySummary = secondaryActions?.querySelector("summary")
    if (!(secondaryActions instanceof HTMLDetailsElement) || !(secondarySummary instanceof HTMLElement)) {
      throw new Error("Missing final assessment options")
    }
    act(() => secondarySummary.click())
    expect(secondaryActions.open).toBe(true)
    expect(secondaryActions.querySelector("a")?.textContent).toContain("Fehler in dieser Aufgabe melden")
    expect(secondaryActions.textContent).not.toContain("Ich verstehe dieses Thema noch nicht")
    expect(onRequestTeacherSupport).not.toHaveBeenCalled()

    act(() => buttonWithText(container, "Abschliessen").click())
    expect(onFinish).toHaveBeenCalledOnce()
    const event = onFinish.mock.calls[0]![0]
    expect(event.questionResults[0]).toMatchObject({
      attempts: 1,
      hintsUsed: 0,
      independentlySolved: true,
      solved: true,
      submittedAnswer: String(correctValue),
    })
  })

  it("explains the time-fraction notation and maps only the given values around one unknown", () => {
    const task: LearningTask = {
      ...assessment,
      id: "assessment:time-visual",
      seed: "assessment:time-visual",
      topicIds: ["time-fractions"],
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "number" || question.visual?.kind !== "clock") {
      throw new Error("Expected a time-fraction question")
    }

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })
    act(() => buttonWithText(container, "Standortbestimmung starten").click())

    const [, subtractMinutes, remainingMinutes] = question.visual.values ?? []
    const visual = container.querySelector(".time-fraction-question")
    expect(container.textContent).toContain(`Das Kästchen ist der Zähler: die gesuchte Anzahl der ${question.visual.denominator} gleich grossen Zeitteile.`)
    expect(visual?.textContent).toContain(`${question.visual.denominator} gleiche Teile`)
    expect(visual?.textContent).toContain("? Teile")
    expect(visual?.textContent).toContain(`− ${subtractMinutes} min`)
    expect(visual?.textContent).toContain(`${remainingMinutes} min`)
    expect(visual?.textContent).toContain("zeigt keine Zwischenlösung")
    expect(visual?.textContent).not.toContain(`${question.response.value} Teile`)
    expect(visual?.textContent).not.toContain(`□/${question.visual.denominator}`)
  })

  it("turns the reported equation visual into one clear backwards path", () => {
    const task: LearningTask = {
      id: "lesson:arithmetic-equations",
      kind: "lesson",
      title: "Fehlende Zahlen durch Rückwärtsrechnen finden",
      description: "Multiplikation und Division in der umgekehrten Reihenfolge auflösen.",
      topicIds: ["arithmetic-equations"],
      prerequisiteIds: [],
      maxXp: 25,
      questionCount: 3,
      seed: "lesson:local-learner:arithmetic-equations",
      curriculum: { courseId: "zh-zap1-math", version: 1 },
      generation: {
        version: 5,
        difficultyBands: ["foundation", "standard", "exam"],
      },
      contentLocale: "en",
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.visual?.kind !== "equation-balance") throw new Error("Expected equation visual")
    const session = { ...createActiveLearningSession(task), phase: "questions" as const }

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <TaskPlayer
            initialSession={session}
            onBack={() => undefined}
            onFinish={() => undefined}
            onPrerequisite={() => undefined}
            onSessionChange={() => undefined}
          />
        </LocalizationProvider>,
      )
    })

    const visual = container.querySelector(".equation-question")
    expect(visual?.textContent?.replace(/\s/gu, "")).toBe("72×2÷4=□")
    expect(visual?.textContent).not.toContain("?")
    expect(visual?.textContent).not.toContain("144")
    expect(container.textContent).toContain("Find the missing number: (□ · 4) ÷ 2 = 72")
  })

  it("does not reveal how many solutions remain in a complete-set question", () => {
    const task: LearningTask = {
      ...assessment,
      id: "assessment:number-filter-visual",
      seed: "assessment:number-filter-visual",
      topicIds: ["number-constraints"],
    }
    const question = generateQuestionsForTask(task)[0]!
    if (question.response.kind !== "integer-set") throw new Error("Expected a complete-set question")

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })
    act(() => buttonWithText(container, "Standortbestimmung starten").click())

    const visual = container.querySelector(".number-filter-question")
    expect(visual?.textContent).toContain("alle Lösungen")
    expect(visual?.textContent).not.toContain(`${question.response.values.length} Lösungen`)
  })

  it("keeps the requested pyramid face hidden in the diagram", () => {
    let task: LearningTask | undefined
    let question: ReturnType<typeof generateQuestionsForTask>[number] | undefined
    for (let index = 0; index < 100; index += 1) {
      const candidate: LearningTask = {
        ...assessment,
        id: `assessment:spatial-hidden:${index}`,
        seed: `assessment:spatial-hidden:${index}`,
        topicIds: ["spatial-rolling"],
      }
      const generated = generateQuestionsForTask(candidate)[0]!
      if (generated.visual?.kind === "pyramid" && generated.visual.arrows?.length === 0) {
        task = candidate
        question = generated
        break
      }
    }
    if (!task || !question || question.response.kind !== "choice") {
      throw new Error("Missing the pyramid find-the-face variant")
    }

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task!)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })
    act(() => buttonWithText(container, "Standortbestimmung starten").click())

    const leftFace = container.querySelector(".pyramid-face.left strong")
    expect(leftFace?.textContent).toBe("?")
    expect(leftFace?.textContent).not.toBe(question.response.value)
  })

  it("requires an ordered face sequence for a multi-roll review", () => {
    let task: LearningTask | undefined
    let question: ReturnType<typeof generateQuestionsForTask>[number] | undefined
    for (let index = 0; index < 100; index += 1) {
      const candidate: LearningTask = {
        id: `review:spatial-path:${index}`,
        kind: "review",
        title: "Pyramidenweg wiederholen",
        description: "Alle Grundflächen der Reihe nach verfolgen",
        topicIds: ["spatial-rolling"],
        prerequisiteIds: [],
        maxXp: 4,
        questionCount: 1,
        seed: `review:spatial-path:${index}`,
        generation: { version: 4, difficultyBands: ["exam"] },
      }
      const generated = generateQuestionsForTask(candidate)[0]!
      if (generated.response.kind === "integer-sequence") {
        task = candidate
        question = generated
        break
      }
    }
    if (!task || !question || question.response.kind !== "integer-sequence") {
      throw new Error("Missing the pyramid path variant")
    }
    const expected = question.response.values

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task!)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })

    const input = container.querySelector("#answer")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing sequence input")
    expect(input.placeholder).toContain("2, 3, 1, 4")
    expect(container.querySelectorAll(".pyramid-question-path li")).toHaveLength(
      expected.length,
    )

    act(() => setInputValue(input, [...expected].reverse().join(", ")))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Kipp-Schritt")

    act(() => setInputValue(input, expected.join(", ")))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain("Richtig")
  })

  it("finalizes a wrong answer without revealing the solution and retains recovery evidence", () => {
    const onFinish = vi.fn<(event: LearningEvent) => void>()
    const versionedAssessment: LearningTask = {
      ...assessment,
      id: "assessment:ui-test:versioned",
      seed: "assessment:ui-test:versioned",
      generation: { version: 2, difficultyBands: ["exam"] },
    }
    const question = generateQuestionsForTask(versionedAssessment)[0]!
    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(versionedAssessment)}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })
    act(() => buttonWithText(container, "Standortbestimmung starten").click())

    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing assessment input")
    act(() => setInputValue(input, "0"))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(onFinish).not.toHaveBeenCalled()
    expect(input.disabled).toBe(true)
    expect(container.textContent).toContain("Falsch.")
    expect(container.textContent).toContain("Antwort gespeichert. Der Rückblick folgt nach dem Abschluss.")
    expect(container.querySelector(".feedback.wrong p")?.textContent).toBe(
      "Antwort gespeichert. Der Rückblick folgt nach dem Abschluss.",
    )
    expect(container.querySelector(".diagnostic-next-step")).toBeNull()
    expect(container.querySelector(".assessment-submission-comparison")).toBeNull()
    expect(container.textContent).not.toContain("Richtige Antwort")
    expect(container.textContent).not.toContain(question.explanation)
    expect(container.querySelector(".difficulty-pill")).toBeNull()
    expect(container.querySelector(".answer-submit-row")).toBeNull()

    act(() => buttonWithText(container, "Abschliessen").click())
    const event = onFinish.mock.calls[0]![0]
    expect(event.mistakes).toBe(1)
    expect(event.questionResults[0]?.independentlySolved).toBe(false)
    expect(event.questionResults[0]?.solved).toBe(false)
    expect(event.questionResults[0]?.difficultyBand).toBe("exam")
    expect(event.questionResults[0]?.submittedAnswer).toBe("0")
    expect(event.questionResults[0]?.diagnostic).toMatchObject({ resolved: false })
  })

  it("keeps a malformed assessment submission final and gradeable", () => {
    const task: LearningTask = {
      ...assessment,
      id: "assessment:ui-test:format-final",
      seed: "assessment:ui-test:format-final",
    }
    const question = generateQuestionsForTask(task)[0]!
    const onFinish = vi.fn<(event: LearningEvent) => void>()
    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(task)}
          onBack={() => undefined}
          onFinish={onFinish}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
        />,
      )
    })
    act(() => buttonWithText(container, "Standortbestimmung starten").click())

    const input = container.querySelector("input")
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing assessment input")
    act(() => setInputValue(input, "keine Zahl"))
    act(() => {
      container.querySelector("form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      )
    })

    expect(input.disabled).toBe(true)
    expect(container.textContent).toContain("Falsch.")
    expect(container.querySelector(".feedback.format")).toBeNull()
    expect(container.querySelector(".diagnostic-next-step")).toBeNull()
    expect(container.textContent).not.toContain(question.explanation)

    act(() => buttonWithText(container, "Abschliessen").click())
    expect(onFinish.mock.calls[0]![0]).toMatchObject({
      mistakes: 1,
      independentlyCompleted: false,
      questionResults: [{
        attempts: 1,
        independentlySolved: false,
        solved: false,
        submittedAnswer: "keine Zahl",
        diagnostic: {
          kind: "format",
          resolved: false,
        },
      }],
    })
  })

  it("shows topic evidence and the scheduled recovery only after completion", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.xpSinceAssessment = learner.assessmentThreshold
    const task = buildAssignments(learner, now)[0]!
    const questions = generateQuestionsForTask(task)
    const questionResults = questions.map((question, index) => ({
      questionId: question.id,
      topicId: question.topicId,
      attempts: 1,
      hintsUsed: 0,
      activeSeconds: 20,
      independentlySolved: index !== 1,
      solved: index !== 1,
      submittedAnswer: index === 1 ? "999" : "correct",
      difficultyBand: question.generation?.difficultyBand,
    }))
    const event: LearningEvent = {
      id: "event:assessment:completion-ui",
      taskId: task.id,
      taskKind: "assessment",
      topicIds: task.topicIds,
      completedAt: now.toISOString(),
      activeSeconds: 120,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults,
    }
    const result = recordCompletion(learner, task, event)

    act(() => {
      root.render(
        <CompletionView
          summary={{ task, event, award: result.award, learner: result.state }}
          onContinue={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("AUSWERTUNG NACH THEMEN")
    expect(container.textContent).toContain("CHECKPOINT AUSGEWERTET")
    expect(container.textContent).toContain("RÜCKWEG EINGEPLANT")
    expect(container.textContent).toContain("Rückweg wartet im Lernplan")
    expect(container.textContent).toContain("gezielte Wiederholung eingeplant")
    expect(container.textContent).toContain("Wiederholung")
    expect(container.textContent).toContain(`+${result.award.totalXp} XP`)
    expect(container.textContent).toContain("2 neue Abzeichen freigeschaltet")
    expect(container.textContent).toContain("Standortfinder")
    expect(container.textContent).toContain("FEHLER-RÜCKBLICK")
    expect(container.textContent).toContain("1 Fehler")
    expect(container.textContent).toContain("Deine Antwort")
    expect(container.textContent).toContain("Richtige Antwort")
    expect(container.textContent).toContain(questions[1]!.explanation)
    const assessmentEvidence = container.querySelector(".completion-evidence-disclosure")
    if (!(assessmentEvidence instanceof HTMLDetailsElement)) throw new Error("Missing assessment evidence disclosure")
    expect(assessmentEvidence.open).toBe(true)
    expect(container.querySelectorAll(".session-next-action")).toHaveLength(1)
    expect(container.querySelector(".assessment-stats .xp-earned")?.textContent).toContain(
      String(result.award.totalXp),
    )
    expect(buttonWithText(container, "Zurück zum Lernplan").nextElementSibling).toBe(assessmentEvidence)

    const focusedLearner = structuredClone(result.state)
    focusedLearner.preferences.visualMode = "focus"
    act(() => {
      root.render(
        <CompletionView
          summary={{ task, event, award: result.award, learner: focusedLearner }}
          onContinue={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("STANDORTBESTIMMUNG AUSGEWERTET")
    expect(container.textContent).toContain("WIEDERHOLUNGEN EINGEPLANT")
    expect(container.textContent).toContain("gezielte Wiederholung wartet im Lernplan")
    expect(container.textContent).not.toContain("CHECKPOINT AUSGEWERTET")
    expect(container.textContent).not.toContain("RÜCKWEG EINGEPLANT")
    expect(container.textContent).not.toContain("NEUES ABZEICHEN")
    expect(container.textContent).not.toContain("Standortfinder")
  })

  it("shows real practice evidence and the fixed review-XP rule in progress", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.totalXp = 64
    learner.mastery["mass-units"].retention = 0.82
    learner.mastery["mass-units"].independentSuccesses = 3
    learner.learningEvents = [{
      id: "event:progress-review",
      taskId: "review:mass-units:1",
      taskKind: "review",
      topicIds: ["mass-units"],
      completedAt: "2026-07-14T09:00:00.000Z",
      activeSeconds: 360,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: [
        {
          questionId: "progress:1",
          topicId: "mass-units",
          attempts: 1,
          hintsUsed: 0,
          activeSeconds: 120,
          independentlySolved: true,
        },
        {
          questionId: "progress:2",
          topicId: "mass-units",
          attempts: 2,
          hintsUsed: 0,
          activeSeconds: 140,
          independentlySolved: false,
          diagnostic: {
            kind: "unit-conversion",
            title: "Die 1000er-Richtung ist vertauscht.",
            resolved: true,
          },
        },
        {
          questionId: "progress:3",
          topicId: "mass-units",
          attempts: 1,
          hintsUsed: 0,
          activeSeconds: 100,
          independentlySolved: true,
        },
      ],
    }]
    const onBack = vi.fn()
    const onPracticeError = vi.fn()
    const onOpenCollection = vi.fn()

    act(() => {
      root.render(
        <ProgressView
          learner={learner}
          onBack={onBack}
          onOpenCollection={onOpenCollection}
          onPracticeError={onPracticeError}
          now={now}
        />,
      )
    })

    expect(container.textContent).toContain("Du baust Wissen auf, das bleibt.")
    expect(container.textContent).toContain("Wiederholungen zählen mit ihrem kleineren festen Wert.")
    expect(container.textContent).toContain("2 von 3 Aufgaben ohne Hilfe.")
    expect(container.textContent).toContain("Belohnungen für echte Lernarbeit")
    act(() => buttonWithText(container, "Expedition öffnen").click())
    expect(onOpenCollection).toHaveBeenCalledOnce()
    expect(container.textContent).toContain("Drangeblieben")
    expect(container.querySelectorAll(".achievement-grid article.unlocked")).toHaveLength(2)
    expect(container.textContent).toContain("Wiederholung ·")
    expect(container.textContent).toContain("DEIN FEHLERKOMPASS")
    expect(container.textContent).toContain("Einheitenrichtung")
    expect(container.textContent).toContain("1 von 1 danach gelöst")
    act(() => buttonWithText(container, "Mit neuen Zahlen üben").click())
    expect(onPracticeError).toHaveBeenCalledWith("mass-units")
    expect(container.querySelectorAll(".activity-day")).toHaveLength(7)
    expect(container.querySelectorAll(".recent-list article")).toHaveLength(1)
    expect(container.textContent).toContain("Mit Unterstützung")
    expect(container.querySelector('[aria-label="kg und g: 78 Prozent mit Unterstützung"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="kg und g: 64 Prozent selbständige Sicherheit"]')).not.toBeNull()
    expect(container.querySelector('[aria-label="kg und g: 82 Prozent Behaltensstand"]')).not.toBeNull()

    const backButton = container.querySelector(".curriculum-back")
    if (!(backButton instanceof HTMLButtonElement)) throw new Error("Missing progress back button")
    act(() => backButton.click())
    expect(onBack).toHaveBeenCalledOnce()
  })

  it("opens the protected parent entry from learner progress without changing evidence", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const onOpenParent = vi.fn()
    const original = structuredClone(learner)

    act(() => {
      root.render(
        <ProgressView
          learner={learner}
          onBack={() => undefined}
          onOpenParent={onOpenParent}
          now={now}
        />,
      )
    })

    expect(container.textContent).toContain("FÜR ELTERN UND BEGLEITPERSONEN")
    expect(container.textContent).toContain("Muster sehen, ohne jede Bewegung zu überwachen.")
    act(() => buttonWithText(container, "Begleitansicht öffnen").click())
    expect(onOpenParent).toHaveBeenCalledOnce()
    expect(learner).toEqual(original)
  })

  it("shows the saved training preferences and opens their edit flow", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.displayName = "Lina"
    learner.preferences = {
      examDate: "2027-03-08",
      practiceDays: ["monday", "wednesday", "saturday"],
      sessionMinutes: 20,
      helpStyle: "story",
      visualMode: "high-contrast",
      readingMode: "spacious",
      geometryControlSide: "left",
    }
    const onEditProfile = vi.fn()

    act(() => {
      root.render(
        <ProgressView
          learner={learner}
          onBack={() => undefined}
          onEditProfile={onEditProfile}
          now={now}
        />,
      )
    })

    expect(container.textContent).toContain("Lina, so begleitet dich GymiQuest.")
    expect(container.textContent).toContain("Mo · Mi · Sa")
    expect(container.textContent).toContain("20 Minuten pro normaler Runde")
    expect(container.textContent).toContain("Mit einem Beispiel")
    expect(container.textContent).toContain("Hoher Kontrast")
    expect(container.textContent).toContain("Mehr Leseruhe")
    expect(container.textContent).toContain("Werkzeuge links")
    expect(container.textContent).toContain("Zürich ZAP1 Mathematik")
    expect(container.textContent).toContain("Deutsch (Schweiz) · Paket v1")
    expect(container.textContent).toContain("Ein anderes Land oder eine andere Lernsprache")
    act(() => buttonWithText(container, "Plan anpassen").click())
    expect(onEditProfile).toHaveBeenCalledOnce()
  })

  it("requires a matching numeric PIN before creating parent access", async () => {
    const onCreatePin = vi.fn(async () => undefined)
    act(() => {
      root.render(
        <ParentArea
          learner={createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))}
          unlocked={false}
          releaseReadiness={createReleaseReadinessRecord()}
          onCreatePin={onCreatePin}
          onUnlock={async () => false}
          onResetPin={async () => undefined}
          onReleaseReadinessChange={() => undefined}
          onBack={() => undefined}
        />,
      )
    })

    const pin = container.querySelector("#parent-pin")
    const confirmation = container.querySelector("#parent-pin-confirmation")
    if (!(pin instanceof HTMLInputElement) || !(confirmation instanceof HTMLInputElement)) {
      throw new Error("Missing parent PIN setup fields")
    }
    act(() => setInputValue(pin, "4826"))
    act(() => setInputValue(confirmation, "4827"))
    await act(async () => buttonWithText(container, "PIN speichern und öffnen").click())
    expect(container.textContent).toContain("stimmen nicht überein")
    expect(onCreatePin).not.toHaveBeenCalled()

    act(() => setInputValue(confirmation, "4826"))
    await act(async () => buttonWithText(container, "PIN speichern und öffnen").click())
    expect(onCreatePin).toHaveBeenCalledWith("4826")
  })

  it("unlocks only through the parent verifier and shows aggregate coaching patterns", async () => {
    const access: ParentAccessRecord = {
      version: 1,
      algorithm: "PBKDF2-SHA-256",
      iterations: 150_000,
      salt: "AAAAAAAAAAAAAAAAAAAAAA==",
      verifier: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      createdAt: "2026-07-14T10:00:00.000Z",
    }
    const onUnlock = vi.fn(async (pin: string) => pin === "4826")
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    learner.learningEvents.push({
      id: "event:parent:own-voice",
      taskId: "lesson:arithmetic-equations:own-voice",
      taskKind: "lesson",
      topicIds: ["arithmetic-equations"],
      completedAt: "2026-07-14T09:00:00.000Z",
      activeSeconds: 120,
      mistakes: 1,
      hintsUsed: 0,
      independentlyCompleted: false,
      questionResults: [{
        questionId: "parent:own-voice:question",
        topicId: "arithmetic-equations",
        attempts: 2,
        hintsUsed: 0,
        activeSeconds: 120,
        independentlySolved: false,
      }],
    })
    learner.learnerFeedback.push({
      id: "feedback:event:parent:own-voice",
      learningEventId: "event:parent:own-voice",
      taskId: "lesson:arithmetic-equations:own-voice",
      taskKind: "lesson",
      topicIds: ["arithmetic-equations"],
      kind: "question-unclear",
      recordedAt: "2026-07-14T09:01:00.000Z",
    })

    act(() => {
      root.render(
        <ParentArea
          learner={learner}
          access={access}
          unlocked={false}
          releaseReadiness={createReleaseReadinessRecord()}
          onCreatePin={async () => undefined}
          onUnlock={onUnlock}
          onResetPin={async () => undefined}
          onReleaseReadinessChange={() => undefined}
          onBack={() => undefined}
        />,
      )
    })

    const pin = container.querySelector("#parent-pin")
    if (!(pin instanceof HTMLInputElement)) throw new Error("Missing parent PIN field")
    act(() => setInputValue(pin, "4827"))
    await act(async () => buttonWithText(container, "Begleitansicht öffnen").click())
    expect(container.textContent).toContain("Dieser PIN stimmt nicht.")

    act(() => setInputValue(pin, "4826"))
    await act(async () => buttonWithText(container, "Begleitansicht öffnen").click())
    expect(onUnlock).toHaveBeenLastCalledWith("4826")

    act(() => {
      root.render(
        <ParentDashboardView
          learner={learner}
          onLock={() => undefined}
          now={new Date("2026-07-14T12:00:00.000Z")}
        />,
      )
    })
    expect(container.textContent).toContain("Unterstützen, ohne Druck aufzubauen.")
    expect(container.textContent).toContain("Nur Muster, keine Einzelkontrolle")
    expect(container.textContent).toContain("Reviews bleiben kleinere, feste XP-Aufgaben.")
    expect(container.textContent).toContain("Was die lernende Person selbst gemeldet hat")
    expect(container.textContent).toContain("Die Aufgabe war unklar")
    expect(container.querySelectorAll(".parent-plan-list article")).toHaveLength(3)
    expect(container.textContent).toContain("Kein Konto, keine Werbung")
  })

  it("opens a read-only production-generator lab behind the parent gate", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const original = structuredClone(learner)
    const onLock = vi.fn()

    act(() => {
      root.render(
        <ParentArea
          learner={learner}
          unlocked
          releaseReadiness={createReleaseReadinessRecord()}
          onCreatePin={async () => undefined}
          onUnlock={async () => true}
          onResetPin={async () => undefined}
          onReleaseReadinessChange={() => undefined}
          onBack={onLock}
        />,
      )
    })

    expect(container.textContent).toContain("Dynamische Aufgaben im echten Generator ansehen.")
    act(() => buttonWithText(container, "Prüflabor öffnen").click())

    expect(container.textContent).toContain("PIN-GESCHÜTZTES PRÜFLABOR")
    expect(container.textContent).toContain("23 Themen × 3 Stufen")
    expect(container.textContent).toContain("Zürich ZAP1 Mathematik · Paket v1")
    expect(container.textContent).toContain("Struktur vollständig")
    expect(container.textContent).toContain("69Generatorfelder im Release-Gate")
    expect(container.querySelector('[aria-label="0 von 86 Prüffeldern in dieser Sitzung geprüft"]')).not.toBeNull()
    expect(container.textContent).toContain("Archiv-inspirierte Vorlagen")
    expect(container.textContent).toContain("KANONISCHE ANTWORT")
    expect(container.textContent).toContain("Vollständigen Lösungsweg prüfen")

    const firstReport = Array.from(container.querySelectorAll("a")).find((link) => (
      link.textContent?.includes("Fehler melden")
    ))
    if (!(firstReport instanceof HTMLAnchorElement)) throw new Error("Missing author report link")
    expect(firstReport.target).toBe("_blank")
    const firstUrl = new URL(firstReport.href)
    const firstReference = decodeExerciseReport(firstUrl.searchParams.get("data") ?? undefined)
    expect(firstReference && isMathematicsExerciseReport(firstReference)).toBe(true)
    if (!firstReference || !isMathematicsExerciseReport(firstReference)) {
      throw new Error("Expected a Mathematics exercise report")
    }
    expect(firstReference.task.maxXp).toBe(0)
    expect(firstReference.task.curriculum).toEqual({
      courseId: "zh-zap1-math",
      version: 1,
    })
    expect(firstReference.task.id).toContain("author-validation:")
    expect(firstReference.question.generation?.difficultyBand).toBe("standard")
    const firstReportHref = firstReport.href

    act(() => buttonWithText(container, "Neue Variante").click())
    const secondReport = Array.from(container.querySelectorAll("a")).find((link) => (
      link.textContent?.includes("Fehler melden")
    ))
    if (!(secondReport instanceof HTMLAnchorElement)) throw new Error("Missing updated author report link")
    expect(secondReport.href).not.toBe(firstReportHref)

    act(() => buttonWithText(container, "Prüfungsnah").click())
    expect(container.querySelector('.author-validation-bands button[aria-pressed="true"]')?.textContent).toContain("Prüfungsnah")

    const topicSelect = container.querySelector("#author-validation-topic")
    if (!(topicSelect instanceof HTMLSelectElement)) throw new Error("Missing author topic selector")
    act(() => setSelectValue(topicSelect, "geometric-loci"))
    expect(container.textContent).toContain("Gebiete aus geometrischen Bedingungen konstruieren")
    expect(container.textContent).toMatch(/Parallele|Kreis|Mittelsenkrechte/u)

    const validationCheck = container.querySelector(".author-validation-check")
    if (!(validationCheck instanceof HTMLButtonElement)) throw new Error("Missing author validation check button")
    act(() => validationCheck.click())
    expect(container.querySelector('[aria-label="1 von 86 Prüffeldern in dieser Sitzung geprüft"]')).not.toBeNull()
    act(() => buttonWithText(container, "Nächstes offenes Prüffeld").click())
    expect(container.textContent).toContain("Variante")

    const labBack = container.querySelector(".author-validation-nav .curriculum-back")
    if (!(labBack instanceof HTMLButtonElement)) throw new Error("Missing author lab back button")
    act(() => labBack.click())
    expect(container.textContent).toContain("Unterstützen, ohne Druck aufzubauen.")
    expect(learner).toEqual(original)

    const parentLock = container.querySelector(".parent-dashboard-shell > .curriculum-back")
    if (!(parentLock instanceof HTMLButtonElement)) throw new Error("Missing parent lock button")
    act(() => parentLock.click())
    expect(onLock).toHaveBeenCalledOnce()
  })

  it("shows three-week pilot evidence without claiming coaching, motivation, or causality", () => {
    const now = new Date("2026-07-20T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.learningEvents = [
      parentPilotEvent("pilot-first", "2026-06-29T09:00:00.000Z", "assessment", 2, 6),
      parentPilotEvent("pilot-middle", "2026-07-06T09:00:00.000Z", "review", 2, 2),
      parentPilotEvent("pilot-latest", "2026-07-13T09:00:00.000Z", "assessment", 4, 6),
    ]
    const original = structuredClone(learner)
    const onOpenReleaseReadiness = vi.fn()

    act(() => {
      root.render(
        <ParentDashboardView
          learner={learner}
          onLock={() => undefined}
          onOpenReleaseReadiness={onOpenReleaseReadiness}
          now={now}
        />,
      )
    })

    expect(container.textContent).toContain("DREI-WOCHEN-PILOT · SEIT DIESEM PROFIL")
    expect(container.textContent).toContain("Nutzung belegen, Wirkung nicht erfinden.")
    expect(container.textContent).toContain("3/3 Kalenderwochen")
    expect(container.querySelector('[aria-label="3 von 3 Kalenderwochen mit echten Lernrunden belegt"]')).not.toBeNull()
    expect(container.querySelectorAll(".parent-pilot-weeks article")).toHaveLength(3)
    expect(container.textContent).toContain("33% → 67% selbständig")
    expect(container.textContent).toContain("noch kein Wirksamkeitsnachweis")
    expect(container.textContent).toContain("Die lernende Person wollte freiwillig zurückkehren.")
    expect(container.textContent).toContain("Eine papiernahe Aufgabe war ihr wirklich noch unbekannt.")
    expect(container.querySelector(".parent-pilot-panel input, .parent-pilot-panel textarea")).toBeNull()

    act(() => buttonWithText(container, "Pilotbelege im Protokoll öffnen").click())
    expect(onOpenReleaseReadiness).toHaveBeenCalledOnce()
    expect(learner).toEqual(original)
  })

  it("locks directly from the author-validation lab", () => {
    const onLock = vi.fn()
    act(() => root.render(<AuthorValidationView onBack={() => undefined} onLock={onLock} />))
    act(() => buttonWithText(container, "Sperren").click())
    expect(onLock).toHaveBeenCalledOnce()
  })

  it("keeps public-readiness attestations honest, exportable, and outside learner data", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    const record = setReleaseReadinessCheck(
      createReleaseReadinessRecord(now),
      "official-2025-sources",
      true,
      now,
      "older-release-build",
    )
    const onChange = vi.fn()
    const download = vi.fn()
    const onLock = vi.fn()

    act(() => {
      root.render(
        <ReleaseReadinessView
          record={record}
          onChange={onChange}
          onBack={() => undefined}
          onLock={onLock}
          now={now}
          download={download}
        />,
      )
    })

    expect(container.textContent).toContain("Offene Belege sichtbar machen, ohne Freigabe zu spielen.")
    expect(container.textContent).toContain("Diese Ansicht ändert den Produktstatus nicht.")
    expect(container.querySelector('[aria-label="1 von 43 Freigabepunkten lokal erfasst"]')).not.toBeNull()
    expect(container.textContent).toContain("unversioned-development-build")
    expect(container.querySelectorAll(".release-gate-section")).toHaveLength(7)

    const standaloneCheck = container.querySelector('[data-release-check="ipad-standalone"]')
    if (!(standaloneCheck instanceof HTMLInputElement)) throw new Error("Missing iPad release check")
    act(() => standaloneCheck.click())
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0]?.[0].completedAtByCheck).toMatchObject({
      "ipad-standalone": expect.any(String),
      "official-2025-sources": now.toISOString(),
    })

    act(() => buttonWithText(container, "Freigabeprotokoll herunterladen").click())
    expect(download).toHaveBeenCalledOnce()
    expect(download.mock.calls[0]?.[0]).toContain("Lokale Haken dokumentieren eine Behauptung")
    expect(download.mock.calls[0]?.[0]).toContain("keinen Spitznamen, keine Antworten, keine XP")
    expect(download.mock.calls[0]?.[0]).toContain("Getesteter Build: older-release-build")
    expect(download.mock.calls[0]?.[1]).toBe("gymiquest-freigabeprotokoll-2026-07-15.md")
    expect(container.textContent).toContain("Protokoll erstellt – ohne Lernerdaten.")

    act(() => buttonWithText(container, "Sperren").click())
    expect(onLock).toHaveBeenCalledOnce()
  })

  it("opens the release protocol only from the unlocked companion area", () => {
    const onChange = vi.fn()
    act(() => {
      root.render(
        <ParentArea
          learner={createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))}
          unlocked
          releaseReadiness={createReleaseReadinessRecord()}
          onCreatePin={async () => undefined}
          onUnlock={async () => true}
          onResetPin={async () => undefined}
          onReleaseReadinessChange={onChange}
          onBack={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Echte Geräte-, Korrektur- und Pilotbelege sauber trennen.")
    act(() => buttonWithText(container, "Freigabeprotokoll öffnen").click())
    expect(container.textContent).toContain("PIN-GESCHÜTZTES FREIGABEPROTOKOLL")

    const protocolBack = container.querySelector(".release-readiness-shell .curriculum-back")
    if (!(protocolBack instanceof HTMLButtonElement)) throw new Error("Missing release protocol back button")
    act(() => protocolBack.click())
    expect(container.textContent).toContain("Unterstützen, ohne Druck aufzubauen.")
  })

  it("shows an evidence-bounded generated mock trend without inventing a grade", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.mockHistory = [
      parentMockResult("first", "2026-07-10T12:00:00.000Z", 12, 6),
      parentMockResult("latest", "2026-07-12T12:00:00.000Z", 22, 2),
    ]

    act(() => {
      root.render(
        <ParentDashboardView learner={learner} onLock={() => undefined} now={now} />,
      )
    })

    expect(container.textContent).toContain("VERGLEICHBARER GENERIERTER VERLAUF")
    expect(container.textContent).toContain("Prüfungsformat v4")
    expect(container.textContent).toContain("12–18/36 Punkte")
    expect(container.textContent).toContain("22–24/36 Punkte")
    expect(container.textContent).toContain("liegt vollständig über dem ersten Vergleichslauf")
    expect(container.textContent).toContain("Keine Schulnote")
    expect(container.textContent).not.toContain("Mathematiknote")
    expect(container.querySelectorAll(".parent-mock-trend-points article")).toHaveLength(2)
    expect(container.querySelector('[aria-label="12 Punkte sicher belegt; bis 18 Punkte nach Prüfung des Rechenwegs möglich"]')).not.toBeNull()
  })

  it("uses the actual official edition year in progress and companion history", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const pending = gradeOfficialExam2023(
      createActiveOfficialExam2023("ui:history-2023", now),
      "submitted",
      new Date("2026-07-15T12:50:00.000Z"),
    )
    learner.mockHistory = [completeOfficialExam2023Review(pending, [0, 0, 0, 0, 0, 0, 0, 0, 0])]

    act(() => {
      root.render(<ProgressView learner={learner} onBack={() => undefined} now={now} />)
    })
    expect(container.textContent).toContain("Offizielle Wiederholung 2023")
    expect(container.textContent).not.toContain("Offizielle Wiederholung 2025")

    act(() => {
      root.render(<ParentDashboardView learner={learner} onLock={() => undefined} now={now} />)
    })
    expect(container.textContent).toContain("Offiziell 2023")
    expect(container.textContent).not.toContain("Offiziell 2025")
  })

  it("uses a calm progress empty state before the first completed session", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    act(() => {
      root.render(
        <ProgressView
          learner={createSeededLearner(now)}
          onBack={() => undefined}
          now={now}
        />,
      )
    })

    expect(container.textContent).toContain("Noch keine abgeschlossene Lernrunde.")
    expect(container.textContent).toContain("Deine nächste abgeschlossene Lernrunde erscheint hier.")
    expect(container.textContent).toContain("0 von 0 Aufgaben ohne Hilfe.")
    expect(container.textContent).toContain("0 von 8 freigeschaltet")
  })

  it("keeps completed strict mocks visible in progress history", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    learner.mockHistory.push(gradeMockExam(
      createActiveMockExam("progress:mock-history", now),
      "timeout",
      new Date("2026-07-14T13:00:00.000Z"),
    ))

    act(() => {
      root.render(<ProgressView learner={learner} onBack={() => undefined} now={now} />)
    })

    expect(container.textContent).toContain("Strikte Prüfungsläufe")
    expect(container.textContent).toContain("0/36 sichere Punkte")
    expect(container.textContent).toContain("Zeit abgelaufen")
    expect(container.querySelectorAll(".mock-history-list article")).toHaveLength(1)
  })

  it("requires a deliberate start for a full generated mock and states the strict rules", () => {
    const onStart = vi.fn()
    act(() => {
      root.render(
        <MockExamSetupView
          onBack={() => undefined}
          onStart={onStart}
        />,
      )
    })

    expect(container.textContent).toContain("60:00")
    expect(container.textContent).toContain("9")
    expect(container.textContent).toContain("36")
    expect(container.textContent).toContain("Die Uhr läuft bei Reload")
    expect(container.textContent).toContain("keine Hinweise")
    expect(container.textContent).not.toContain("XP verdienen")
    expect(onStart).not.toHaveBeenCalled()

    act(() => buttonWithText(container, "Prüfung jetzt starten").click())
    expect(onStart).toHaveBeenCalledOnce()
  })

  it("pauses ordinary assignments while a mock deadline is running", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    vi.setSystemTime(now)
    const learner = createSeededLearner(now)
    const activeMock = createActiveMockExam("home:running-mock", now)
    const onOpenMock = vi.fn()

    act(() => {
      root.render(
        <Home
          learner={learner}
          activeMock={activeMock}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenMock={onOpenMock}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Solange die Uhr läuft, pausiert der normale Lernplan")
    expect(container.textContent).toContain("Prüfung fortsetzen")
    expect(container.textContent).not.toContain("HEUTIGE QUEST")
    expect(container.querySelectorAll(".task-card")).toHaveLength(0)
    act(() => buttonWithText(container, "Prüfung fortsetzen").click())
    expect(onOpenMock).toHaveBeenCalledOnce()
  })

  it("makes a running archive practice the only actionable Home step", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    vi.setSystemTime(now)
    const learner = createSeededLearner(now)
    const activeArchivePractice = createActiveArchivePractice(
      "zap-zh-lg-2022",
      "home:running-archive",
      now,
    )
    const onOpenMock = vi.fn()

    act(() => {
      root.render(
        <Home
          learner={learner}
          activeArchivePractice={activeArchivePractice}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenConceptLab={() => undefined}
          onOpenMock={onOpenMock}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain(
      "Dein Archivtraining läuft. Solange die Uhr läuft, pausiert der normale Lernplan.",
    )
    expect(container.textContent).toContain("Das Archivtraining 2022 läuft weiter.")
    expect(container.textContent).toContain("Noch 60:00")
    expect(container.querySelectorAll(".primary-plan-step .mock-mode-card.running")).toHaveLength(1)
    expect(container.querySelectorAll(".primary-plan-step button")).toHaveLength(1)
    expect(container.querySelectorAll(".task-card")).toHaveLength(0)
    expect(container.querySelector(".upcoming-tasks")).toBeNull()
    expect(container.querySelector(".daily-quest-disclosure, .daily-rest-summary")).toBeNull()
    expect(container.querySelector(".home-shortcuts")).toBeNull()

    act(() => buttonWithText(container, "Archivtraining fortsetzen").click())
    expect(onOpenMock).toHaveBeenCalledOnce()
  })

  it("makes an open archive self-review the only actionable Home step", () => {
    const startedAt = new Date("2026-07-14T12:00:00.000Z")
    const now = new Date("2026-07-14T12:40:00.000Z")
    vi.setSystemTime(now)
    const learner = createSeededLearner(now)
    const activeArchivePractice = submitArchivePracticeForReview(
      createActiveArchivePractice(
        "zap-zh-lg-2022",
        "home:archive-review",
        startedAt,
      ),
      "submitted",
      now,
    )
    const onOpenMock = vi.fn()

    act(() => {
      root.render(
        <Home
          learner={learner}
          activeArchivePractice={activeArchivePractice}
          now={now}
          onStart={() => undefined}
          onResume={() => undefined}
          onPrerequisite={() => undefined}
          onOpenCurriculum={() => undefined}
          onOpenConceptLab={() => undefined}
          onOpenMock={onOpenMock}
          onReset={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain(
      "Dein Archiv-Selbstreview ist offen. Der normale Lernplan wartet, bis du den Vergleich abgeschlossen hast.",
    )
    expect(container.textContent).toContain("Der Selbstvergleich 2022 ist noch offen.")
    expect(container.textContent).toContain(
      "Aufgaben, Lösungsblatt und bisherige Vergleiche sind lokal gespeichert.",
    )
    expect(container.querySelectorAll(".primary-plan-step .mock-mode-card.running")).toHaveLength(1)
    expect(container.querySelectorAll(".primary-plan-step button")).toHaveLength(1)
    expect(container.querySelectorAll(".task-card")).toHaveLength(0)
    expect(container.querySelector(".upcoming-tasks")).toBeNull()
    expect(container.querySelector(".daily-quest-disclosure, .daily-rest-summary")).toBeNull()
    expect(container.querySelector(".home-shortcuts")).toBeNull()

    act(() => buttonWithText(container, "Selbstreview fortsetzen").click())
    expect(onOpenMock).toHaveBeenCalledOnce()
  })

  it("supports free task navigation, flags, and autosaved answers without feedback", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    vi.setSystemTime(now)
    const exam = createActiveMockExam("ui:free-navigation", now)
    const onChange = vi.fn()

    act(() => {
      root.render(
        <MockExamPlayer
          initialExam={exam}
          onChange={onChange}
          onFinish={() => undefined}
          onExit={() => undefined}
        />,
      )
    })

    expect(container.querySelectorAll(".mock-task-grid button")).toHaveLength(9)
    const taskTwo = container.querySelector('button[aria-label^="Aufgabe 2:"]')
    if (!(taskTwo instanceof HTMLButtonElement)) throw new Error("Missing task two navigation")
    act(() => taskTwo.click())
    const flagButton = container.querySelector(".mock-flag-button")
    if (!(flagButton instanceof HTMLButtonElement)) throw new Error("Missing mock flag button")
    act(() => flagButton.click())

    const input = container.querySelector('.mock-part-card input[type="text"]')
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing mock answer input")
    act(() => setInputValue(input, "123"))

    const taskOne = container.querySelector('button[aria-label^="Aufgabe 1:"]')
    if (!(taskOne instanceof HTMLButtonElement)) throw new Error("Missing task one navigation")
    act(() => taskOne.click())
    act(() => taskTwo.click())

    const restoredInput = container.querySelector('.mock-part-card input[type="text"]')
    expect(restoredInput).toBeInstanceOf(HTMLInputElement)
    expect((restoredInput as HTMLInputElement).value).toBe("123")
    expect((container.querySelector(".mock-flag-button") as HTMLButtonElement).getAttribute("aria-pressed")).toBe("true")
    expect(container.textContent).not.toContain("Richtig.")
    expect(container.textContent).not.toContain("Ich verstehe es noch nicht")
    expect(container.textContent).not.toContain("XP")
    expect(onChange).toHaveBeenCalled()

    act(() => buttonWithText(container, "Prüfung abgeben").click())
    expect(container.textContent).toContain("17 Teilaufgaben sind noch ohne vollständige Antwort")
  })

  it("submits and freezes the mock automatically from its absolute deadline", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    vi.setSystemTime(now)
    const exam = createActiveMockExam("ui:timeout", now, 2)
    const onFinish = vi.fn()

    act(() => {
      root.render(
        <MockExamPlayer
          initialExam={exam}
          onChange={() => undefined}
          onFinish={onFinish}
          onExit={() => undefined}
        />,
      )
    })
    expect(container.textContent).toContain("0:02")

    act(() => vi.advanceTimersByTime(2_100))
    expect(onFinish).toHaveBeenCalledOnce()
    expect(onFinish.mock.calls[0]![0]).toMatchObject({
      submissionReason: "timeout",
      maxPoints: 36,
    })
  })

  it("shows only defensible score confidence and the post-exam recovery plan", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveMockExam("ui:results", now)
    const result = gradeMockExam(
      exam,
      "timeout",
      new Date("2026-07-14T13:00:00.000Z"),
    )

    act(() => {
      root.render(<MockExamResultsView result={result} onContinue={() => undefined} />)
    })

    expect(container.textContent).toContain("ZEIT ABGELAUFEN")
    expect(container.textContent).toContain("SICHERE PUNKTE")
    expect(container.textContent).toContain("Keine Skala erfunden")
    expect(container.querySelectorAll(".mock-task-results details")).toHaveLength(9)
    expect(container.querySelectorAll(".mock-recovery-card li")).toHaveLength(3)
    expect(container.textContent).toContain("Nach der Prüfung")
  })

  it("runs generated mock setup, questions, navigation, and results in English", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    vi.setSystemTime(now)
    const exam = createActiveMockExam(
      "ui:english-mock",
      now,
      3_600,
      undefined,
      "en",
    )

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <MockExamSetupView onBack={() => undefined} onStart={() => undefined} />
        </LocalizationProvider>,
      )
    })
    expect(container.textContent).toContain("GENERATED MOCK EXAM")
    expect(container.textContent).toContain("One real hour. New questions.")
    expect(container.textContent).toContain("PRIVATE EXAM ARCHIVE")
    expect(container.textContent).not.toContain("GENERIERTE PROBEPRÜFUNG")

    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <MockExamPlayer
            initialExam={exam}
            onChange={() => undefined}
            onFinish={() => undefined}
            onExit={() => undefined}
          />
        </LocalizationProvider>,
      )
    })
    expect(container.textContent).toContain("MOCK EXAM")
    expect(container.textContent).toContain("Calculations and units")
    expect(container.querySelector('button[aria-label^="Task 2:"]')).toBeInstanceOf(HTMLButtonElement)
    expect(container.textContent).toContain("Submit exam")
    expect(container.textContent).not.toContain("Prüfung abgeben")

    const result = gradeMockExam(exam, "timeout", new Date("2026-07-14T13:00:00.000Z"))
    act(() => {
      root.render(
        <LocalizationProvider initialLocale="en">
          <MockExamResultsView result={result} onContinue={() => undefined} />
        </LocalizationProvider>,
      )
    })
    expect(container.textContent).toContain("TIME EXPIRED")
    expect(container.textContent).toContain("CERTAIN POINTS")
    expect(container.textContent).toContain("After the exam")
    expect(container.textContent).not.toContain("Nach der Prüfung")
  })

  it("keeps the private official replay visibly separate and requires both verified PDFs", () => {
    const onStartOfficial = vi.fn()
    const documents = readyOfficialDocuments()
    act(() => {
      root.render(
        <MockExamSetupView
          officialDocuments={documents}
          onBack={() => undefined}
          onStart={() => undefined}
          onStartOfficial={onStartOfficial}
          onImportOfficial={async () => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("PRIVATE OFFIZIELLE WIEDERHOLUNG")
    expect(container.textContent).toContain("2015 sowie 2023 bis 2025")
    expect(container.textContent).toContain("Korrekturschema v1.1")
    expect(container.textContent).toContain("Nicht Teil der Sicherung")
    expect(container.querySelectorAll(".official-file-list label.ready")).toHaveLength(2)

    const start = buttonWithText(container, "Wiederholung 2025 starten")
    expect(start.disabled).toBe(false)
    act(() => start.click())
    expect(onStartOfficial).toHaveBeenCalledWith("zap-zh-lg-2025")
    expect(buttonWithText(container, "Wiederholung 2024 starten").disabled).toBe(true)
    expect(buttonWithText(container, "Wiederholung 2023 starten").disabled).toBe(true)
    expect(buttonWithText(container, "Wiederholung 2015 starten").disabled).toBe(true)
  })

  it("offers the full 2015 correction source as a replay without a grade promise", () => {
    const onStartOfficial = vi.fn()
    const archiveLibrary: OfficialArchiveLibrary = {
      "zap-zh-lg-2015": readyArchiveDocuments("zap-zh-lg-2015"),
    }
    act(() => {
      root.render(
        <MockExamSetupView
          officialArchiveLibrary={archiveLibrary}
          onBack={() => undefined}
          onStart={() => undefined}
          onStartOfficial={onStartOfficial}
        />,
      )
    })

    expect(container.textContent).toContain("2015 sowie 2023 bis 2025")
    expect(container.textContent).toContain("Korrekturschema 2015")
    expect(container.textContent).toContain("ohne Notenumrechnung")
    const start = buttonWithText(container, "Wiederholung 2015 starten")
    expect(start.disabled).toBe(false)
    act(() => start.click())
    expect(onStartOfficial).toHaveBeenCalledWith("zap-zh-lg-2015")
  })

  it("offers the verified 2023 pair as a corrected replay without a grade promise", () => {
    const onStartOfficial = vi.fn()
    const archiveLibrary: OfficialArchiveLibrary = {
      "zap-zh-lg-2023": readyArchiveDocuments("zap-zh-lg-2023"),
    }
    act(() => {
      root.render(
        <MockExamSetupView
          officialArchiveLibrary={archiveLibrary}
          onBack={() => undefined}
          onStart={() => undefined}
          onStartOfficial={onStartOfficial}
        />,
      )
    })

    expect(container.textContent).toContain("Korrekturschema 2023")
    expect(container.textContent).toContain("ohne Notenumrechnung")
    const start = buttonWithText(container, "Wiederholung 2023 starten")
    expect(start.disabled).toBe(false)
    act(() => start.click())
    expect(onStartOfficial).toHaveBeenCalledWith("zap-zh-lg-2023")
  })

  it("offers all archive years as local sources without claiming unverified grading", () => {
    const archiveLibrary: OfficialArchiveLibrary = {
      "zap-zh-lg-2024": readyArchiveDocuments("zap-zh-lg-2024"),
    }
    act(() => {
      root.render(
        <MockExamSetupView
          officialArchiveLibrary={archiveLibrary}
          onBack={() => undefined}
          onStart={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("PRIVATES PRÜFUNGSARCHIV")
    expect(container.textContent).toContain("2/22 PDFs bereit")
    expect(container.querySelectorAll("[data-archive-year]")).toHaveLength(11)
    expect(container.querySelector('[data-archive-year="2024"]')?.textContent).toContain("2/2 lokal")
    expect(container.querySelector('[data-archive-year="2023"]')?.textContent).toContain("0/2 lokal")
    expect(container.querySelector('[data-archive-year="2023"]')?.textContent).toContain("keine verifizierte Note")
    expect(container.querySelector('[data-archive-year="2015"]')?.textContent).toContain("keine verifizierte Note")
    expect(container.textContent).toContain("kein automatischer Punktestand")

    const openTasks = container.querySelector('[aria-label="Aufgaben 2024 öffnen"]')
    if (!(openTasks instanceof HTMLButtonElement)) throw new Error("Missing 2024 tasks source")
    act(() => openTasks.click())
    expect(container.textContent).toContain("ZAP 1 Mathematik 2024 · Aufgaben")
    expect(container.textContent).toContain("bewerteten Wiederholung 2024")
    expect(container.textContent).toContain("Seite 1 von 12")

    const nextPage = container.querySelector('[aria-label="Nächste Seite"]')
    if (!(nextPage instanceof HTMLButtonElement)) throw new Error("Missing archive page navigation")
    act(() => nextPage.click())
    expect(container.textContent).toContain("Seite 2 von 12")

    act(() => buttonWithText(container, "Lösungen").click())
    expect(container.textContent).toContain("ZAP 1 Mathematik 2024 · Lösungen")
    expect(container.textContent).toContain("Seite 1 von 11")
  })

  it("starts source-only archive years as non-scoring timed training when both PDFs are ready", () => {
    const onStartArchivePractice = vi.fn()
    const archiveLibrary: OfficialArchiveLibrary = {
      "zap-zh-lg-2022": readyArchiveDocuments("zap-zh-lg-2022"),
    }
    act(() => {
      root.render(
        <MockExamSetupView
          officialArchiveLibrary={archiveLibrary}
          onBack={() => undefined}
          onStart={() => undefined}
          onStartArchivePractice={onStartArchivePractice}
        />,
      )
    })

    const year2022 = container.querySelector('[data-archive-year="2022"]')
    const year2021 = container.querySelector('[data-archive-year="2021"]')
    expect(year2022?.textContent).toContain("60-Minuten-Quellentraining")
    expect(year2022?.textContent).toContain("kein automatischer Punktestand")
    expect(year2021?.textContent).toContain("Aufgaben fehlt")
    const start = buttonWithText(container, "Archivtraining 2022 starten")
    expect(start.disabled).toBe(false)
    act(() => start.click())
    expect(onStartArchivePractice).toHaveBeenCalledWith("zap-zh-lg-2022")
    expect(buttonWithText(container, "Archivtraining 2021 starten").disabled).toBe(true)
  })

  it("passes a multi-file archive selection to the verified bulk importer", async () => {
    const onImportOfficialArchive = vi.fn(async (files: readonly File[]) => ({
      imported: files.length,
      rejected: [],
    }))
    act(() => {
      root.render(
        <MockExamSetupView
          onBack={() => undefined}
          onStart={() => undefined}
          onImportOfficialArchive={onImportOfficialArchive}
        />,
      )
    })

    const input = container.querySelector('input[aria-label="Prüfungsarchiv PDFs importieren"]')
    if (!(input instanceof HTMLInputElement)) throw new Error("Missing archive bulk input")
    const files = [
      new File(["%PDF-one"], "one.pdf", { type: "application/pdf" }),
      new File(["%PDF-two"], "two.pdf", { type: "application/pdf" }),
    ]
    Object.defineProperty(input, "files", { configurable: true, value: files })
    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }))
      await Promise.resolve()
    })

    expect(onImportOfficialArchive).toHaveBeenCalledOnce()
    expect(onImportOfficialArchive.mock.calls[0]![0]).toEqual(files)
    expect(container.textContent).toContain("2 PDFs wurden lokal gespeichert.")
  })

  it("runs the official paper through the same strict timer, navigation, and autosave shell", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    vi.setSystemTime(now)
    const exam = createActiveOfficialExam2025("ui:official", now)
    const onChange = vi.fn()

    act(() => {
      root.render(
        <MockExamPlayer
          initialExam={exam}
          onChange={onChange}
          onFinish={() => undefined}
          onExit={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("OFFIZIELLE WIEDERHOLUNG")
    expect(container.textContent).toContain("ZAP Mathematik 2025 · lokal")
    expect(container.querySelectorAll(".mock-task-grid button")).toHaveLength(9)
    expect(container.querySelectorAll(".official-answer-card")).toHaveLength(2)

    const taskThree = container.querySelector('button[aria-label^="Aufgabe 3:"]')
    if (!(taskThree instanceof HTMLButtonElement)) throw new Error("Missing official task three")
    act(() => taskThree.click())
    const tupleAnswer = container.querySelector(".official-tuple-answer textarea")
    if (!(tupleAnswer instanceof HTMLTextAreaElement)) throw new Error("Missing tuple answer")
    act(() => setTextareaValue(tupleAnswer, "1, 1, 9"))
    expect(onChange).toHaveBeenCalled()

    const taskFive = container.querySelector('button[aria-label^="Aufgabe 5:"]')
    if (!(taskFive instanceof HTMLButtonElement)) throw new Error("Missing official task five")
    act(() => taskFive.click())
    expect(container.querySelectorAll(".official-milestone-field")).toHaveLength(4)
    const jarMass = container.querySelector('input[id$="milestone-jar-mass-54"]')
    if (!(jarMass instanceof HTMLInputElement)) throw new Error("Missing official milestone input")
    act(() => setInputValue(jarMass, "54"))
    expect(onChange.mock.calls.at(-1)?.[0].progress[4].parts[0].milestoneAnswers).toMatchObject({
      "jar-mass-54": "54",
    })

    act(() => buttonWithText(container, "Prüfung abgeben").click())
    expect(container.textContent).toContain("15 Teilaufgaben sind noch ohne vollständige Antwort")
    expect(container.textContent).not.toContain("Richtig.")
    expect(container.textContent).not.toContain("XP")
  })

  it("captures fraction, free calculation, and complete surface evidence for the 2025 rubric", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    vi.setSystemTime(now)
    const onChange = vi.fn()

    act(() => {
      root.render(
        <MockExamPlayer
          initialExam={createActiveOfficialExam2025("ui:official-structured-evidence", now)}
          onChange={onChange}
          onFinish={() => undefined}
          onExit={() => undefined}
        />,
      )
    })

    const taskOnePath = container.querySelector('textarea[id*="task-1-part-a"][id$="milestone-calculation-path"]')
    if (!(taskOnePath instanceof HTMLTextAreaElement)) throw new Error("Missing Task 1a calculation path")
    expect(taskOnePath.rows).toBe(3)
    expect(taskOnePath.maxLength).toBe(1_000)
    expect(taskOnePath.placeholder).toContain("Eine Rechnung pro Zeile")
    act(() => setTextareaValue(taskOnePath, "671 : 11 = 61\n61x81 = 4941"))
    expect(taskOnePath.value).toBe("671 : 11 = 61\n61 × 81 = 4941")
    expect(onChange.mock.calls.at(-1)?.[0].progress[0].parts[0].milestoneAnswers).toMatchObject({
      "calculation-path": "671 : 11 = 61\n61 × 81 = 4941",
    })
    const taskOneWorking = container.querySelector('textarea[id*="task-1-part-a"][id$="-working"]')
    if (!(taskOneWorking instanceof HTMLTextAreaElement)) throw new Error("Missing Task 1a working field")
    act(() => setTextareaValue(taskOneWorking, "671*81 = 54351"))
    expect(taskOneWorking.value).toBe("671 × 81 = 54351")

    const ratio = container.querySelector('input[id$="milestone-ratio-75-175"]')
    if (!(ratio instanceof HTMLInputElement)) throw new Error("Missing Task 1b ratio evidence")
    expect(ratio.inputMode).toBe("text")
    expect(ratio.placeholder).toBe("z. B. 75/175")
    act(() => setInputValue(ratio, "75/175"))
    expect(onChange.mock.calls.at(-1)?.[0].progress[0].parts[1].milestoneAnswers).toMatchObject({
      "ratio-75-175": "75/175",
    })

    const taskFour = container.querySelector('button[aria-label^="Aufgabe 4:"]')
    if (!(taskFour instanceof HTMLButtonElement)) throw new Error("Missing official task four")
    act(() => taskFour.click())
    const arrangementPath = container.querySelector('textarea[id*="task-4-part-b"][id$="milestone-calculation-path"]')
    const cheapestPath = container.querySelector('textarea[id*="task-4-part-c"][id$="milestone-calculation-path"]')
    if (!(arrangementPath instanceof HTMLTextAreaElement)) throw new Error("Missing Task 4b calculation path")
    if (!(cheapestPath instanceof HTMLTextAreaElement)) throw new Error("Missing Task 4c calculation path")
    expect(arrangementPath.rows).toBe(4)
    expect(cheapestPath.rows).toBe(4)
    act(() => setTextareaValue(cheapestPath, "15 * 12 = 170\n10 x 5 = 50\n170 + 50 = 220"))
    expect(cheapestPath.value).toBe("15 × 12 = 170\n10 × 5 = 50\n170 + 50 = 220")
    expect(onChange.mock.calls.at(-1)?.[0].progress[3].parts[2].milestoneAnswers).toMatchObject({
      "calculation-path": "15 × 12 = 170\n10 × 5 = 50\n170 + 50 = 220",
    })

    const taskSix = container.querySelector('button[aria-label^="Aufgabe 6:"]')
    if (!(taskSix instanceof HTMLButtonElement)) throw new Error("Missing official task six")
    act(() => taskSix.click())
    const division = container.querySelector('input[id$="milestone-follow-through-division"]')
    if (!(division instanceof HTMLInputElement)) throw new Error("Missing Task 6b calculation evidence")
    expect(division.placeholder).toContain("Zwischenwert : Personenzahl")
    act(() => setInputValue(division, "660 : 30 = 23"))
    expect(onChange.mock.calls.at(-1)?.[0].progress[5].parts[1].milestoneAnswers).toMatchObject({
      "follow-through-division": "660 : 30 = 23",
    })

    const taskNine = container.querySelector('button[aria-label^="Aufgabe 9:"]')
    if (!(taskNine instanceof HTMLButtonElement)) throw new Error("Missing official task nine")
    act(() => taskNine.click())
    expect(container.querySelector('input[id$="milestone-end-face"]')).toBeInstanceOf(HTMLInputElement)
    expect(container.querySelector('input[id$="milestone-side-face"]')).toBeInstanceOf(HTMLInputElement)
    expect(container.querySelector('input[id$="milestone-base-face"]')).toBeInstanceOf(HTMLInputElement)
    expect(container.querySelector('input[id$="milestone-alternative-side-face"]')).toBeInstanceOf(HTMLInputElement)
    expect(container.querySelector('input[id$="milestone-surface-pair"]')).toBeNull()
    const surfacePath = container.querySelector('textarea[id$="milestone-calculation-path"]')
    if (!(surfacePath instanceof HTMLTextAreaElement)) throw new Error("Missing Task 9 calculation path")
    expect(surfacePath.rows).toBe(9)
  })

  it("runs the 2024 paper with its own answer controls and year identity", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    vi.setSystemTime(now)
    const exam = createActiveOfficialExam2024("ui:official-2024", now)
    const onChange = vi.fn()

    act(() => {
      root.render(
        <MockExamPlayer
          initialExam={exam}
          officialDocuments={readyArchiveDocuments("zap-zh-lg-2024")}
          onChange={onChange}
          onFinish={() => undefined}
          onExit={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("ZAP Mathematik 2024 · lokal")
    expect(container.querySelectorAll(".mock-task-grid button")).toHaveLength(9)
    expect(container.querySelectorAll(".official-answer-card")).toHaveLength(1)
    expect(container.textContent).toContain("Geschickt rechnen")

    const taskTwo = container.querySelector('button[aria-label^="Aufgabe 2:"]')
    if (!(taskTwo instanceof HTMLButtonElement)) throw new Error("Missing 2024 task two")
    act(() => taskTwo.click())
    expect(container.querySelectorAll(".official-answer-card")).toHaveLength(2)
    expect(container.textContent).toContain("Eingetragene Punkte A, B und C")

    const taskSeven = container.querySelector('button[aria-label^="Aufgabe 7:"]')
    if (!(taskSeven instanceof HTMLButtonElement)) throw new Error("Missing 2024 task seven")
    act(() => taskSeven.click())
    expect(container.textContent).toContain("vier Zeichnungen werden nach der Abgabe direkt")
    const paper = container.querySelector('.official-paper-check input[type="checkbox"]')
    if (!(paper instanceof HTMLInputElement)) throw new Error("Missing 2024 paper completion control")
    act(() => paper.click())
    expect(onChange.mock.calls.at(-1)?.[0].progress[6].parts[0].answer).toBe("completed-on-paper")
  })

  it("captures the 2023 truth table as four explicit choices", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    vi.setSystemTime(now)
    const exam = createActiveOfficialExam2023("ui:official-2023", now)
    const onChange = vi.fn()

    act(() => {
      root.render(
        <MockExamPlayer
          initialExam={exam}
          officialDocuments={readyArchiveDocuments("zap-zh-lg-2023")}
          onChange={onChange}
          onFinish={() => undefined}
          onExit={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("ZAP Mathematik 2023 · lokal")
    const taskFour = container.querySelector('button[aria-label^="Aufgabe 4:"]')
    if (!(taskFour instanceof HTMLButtonElement)) throw new Error("Missing 2023 task four")
    act(() => taskFour.click())
    expect(container.querySelectorAll(".official-true-false-grid > div > fieldset")).toHaveLength(4)

    const choices = [
      ["Aussage 1: richtig", "true"],
      ["Aussage 2: falsch", "false"],
      ["Aussage 3: richtig", "true"],
      ["Aussage 4: falsch", "false"],
    ] as const
    choices.forEach(([label]) => {
      const input = container.querySelector(`input[aria-label="${label}"]`)
      if (!(input instanceof HTMLInputElement)) throw new Error(`Missing choice ${label}`)
      act(() => input.click())
    })
    expect(onChange.mock.calls.at(-1)?.[0].progress[3].parts[0].answer).toBe("true|false|true|false")
  })

  it("captures the 2015 cube pairing as four accessible selections", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    vi.setSystemTime(now)
    const exam = createActiveOfficialExam2015("ui:official-2015", now)
    const onChange = vi.fn()

    act(() => {
      root.render(
        <MockExamPlayer
          initialExam={exam}
          officialDocuments={readyArchiveDocuments("zap-zh-lg-2015")}
          onChange={onChange}
          onFinish={() => undefined}
          onExit={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("ZAP Mathematik 2015 · lokal")
    const taskNine = container.querySelector('button[aria-label^="Aufgabe 9:"]')
    if (!(taskNine instanceof HTMLButtonElement)) throw new Error("Missing 2015 task nine")
    act(() => taskNine.click())
    const selects = container.querySelectorAll<HTMLSelectElement>(".official-matching-grid select")
    expect(selects).toHaveLength(4)
    ;["D", "A", "none", "C"].forEach((value, index) => {
      const select = selects[index]
      if (!select) throw new Error(`Missing 2015 match field ${index + 1}`)
      act(() => setSelectValue(select, value))
    })
    expect(onChange.mock.calls.at(-1)?.[0].progress[8].parts[0].answer).toBe("D|A|none|C")
  })

  it("freezes the 2015 pairing score and completes with points but no invented grade", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    const exam = createActiveOfficialExam2015("ui:official-2015-results", now)
    exam.progress[8]!.parts[0]!.answer = "D|A|none|C"
    const result = gradeOfficialExam2015(exam, "submitted", new Date("2026-07-15T12:50:00.000Z"))

    act(() => {
      root.render(
        <MockExamResultsView
          result={result}
          onContinue={() => undefined}
          onResultChange={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Offizielle Notenskala nicht verifiziert")
    const taskNine = container.querySelectorAll<HTMLButtonElement>(".official-correction-nav > div button")[8]
    if (!taskNine) throw new Error("Missing 2015 correction navigation for task nine")
    act(() => taskNine.click())
    expect((container.querySelector('input[name="official-score-9"][value="4"]') as HTMLInputElement).checked).toBe(true)
    expect((container.querySelector('input[name="official-score-9"][value="3"]') as HTMLInputElement).disabled).toBe(true)
    expect(container.textContent).toContain("kann bei der Korrektur nicht überschrieben werden")

    const completed = completeOfficialExam2015Review(result, [0, 0, 0, 0, 0, 0, 0, 0, 4])
    act(() => {
      root.render(
        <MockExamResultsView
          result={completed}
          onContinue={() => undefined}
        />,
      )
    })
    expect(container.textContent).toContain("Die 2015er Prüfung ist korrigiert")
    expect(container.textContent).toContain("Korrigierter Punktestand ohne Notenumrechnung")
    expect(container.textContent).not.toContain("Mathematiknote 6.0")
    expect(completed.officialReview).not.toHaveProperty("mathematicsGrade")
  })

  it("freezes the 2023 deterministic tasks and completes with points but no invented grade", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    const exam = createActiveOfficialExam2023("ui:official-2023-results", now)
    exam.progress[3]!.parts[0]!.answer = "true|false|true|false"
    exam.progress[7]!.parts[0]!.answer = "156 Gabeln"
    const result = gradeOfficialExam2023(exam, "submitted", new Date("2026-07-15T12:50:00.000Z"))

    act(() => {
      root.render(
        <MockExamResultsView
          result={result}
          onContinue={() => undefined}
          onResultChange={() => undefined}
        />,
      )
    })

    expect(container.textContent).toContain("Offizielle Notenskala nicht verifiziert")
    const taskFour = container.querySelectorAll<HTMLButtonElement>(".official-correction-nav > div button")[3]
    if (!taskFour) throw new Error("Missing 2023 correction navigation for task four")
    act(() => taskFour.click())
    expect((container.querySelector('input[name="official-score-4"][value="4"]') as HTMLInputElement).checked).toBe(true)
    expect((container.querySelector('input[name="official-score-4"][value="3"]') as HTMLInputElement).disabled).toBe(true)
    expect(container.textContent).toContain("kann bei der Korrektur nicht überschrieben werden")

    const completed = completeOfficialExam2023Review(result, [0, 0, 0, 4, 0, 0, 0, 4, 0])
    act(() => {
      root.render(
        <MockExamResultsView
          result={completed}
          onContinue={() => undefined}
        />,
      )
    })
    expect(container.textContent).toContain("Die 2023er Prüfung ist korrigiert")
    expect(container.textContent).toContain("Korrigierter Punktestand ohne Notenumrechnung")
    expect(container.textContent).not.toContain("Mathematiknote 6.0")
    expect(completed.officialReview).not.toHaveProperty("mathematicsGrade")
  })

  it("keeps the 2024 score fully manual and applies the 2024 scale after correction", () => {
    const now = new Date("2026-07-15T12:00:00.000Z")
    const result = gradeOfficialExam2024(
      createActiveOfficialExam2024("ui:official-2024-results", now),
      "submitted",
      new Date("2026-07-15T12:50:00.000Z"),
    )
    const onResultChange = vi.fn()

    act(() => {
      root.render(
        <MockExamResultsView
          result={result}
          onContinue={() => undefined}
          onResultChange={onResultChange}
        />,
      )
    })

    expect(container.textContent).toContain("Mathematiknote 2024")
    expect(container.textContent).toContain("Korrekturschema 2024")
    expect(container.textContent).toContain("keine Punkte automatisch festgelegt")
    expect(container.textContent).not.toContain("sichere Teilpunkte")

    for (let taskIndex = 0; taskIndex < 9; taskIndex += 1) {
      const score = container.querySelector(`input[name="official-score-${taskIndex + 1}"][value="4"]`)
      if (!(score instanceof HTMLInputElement)) throw new Error(`Missing 2024 score for task ${taskIndex + 1}`)
      expect((container.querySelector(`input[name="official-score-${taskIndex + 1}"][value="0"]`) as HTMLInputElement).disabled).toBe(false)
      act(() => score.click())
      if (taskIndex < 8) act(() => buttonWithText(container, "Nächste Aufgabe").click())
    }

    act(() => buttonWithText(container, "Korrektur abschliessen").click())
    expect(onResultChange).toHaveBeenCalledOnce()
    expect(onResultChange.mock.calls[0]![0]).toMatchObject({
      certainPoints: 36,
      reviewablePoints: 0,
      officialReview: {
        status: "complete",
        gradeScaleId: "zap-lg-2024-math-2024-03-15",
        mathematicsGrade: 6,
      },
    })
  })

  it("requires task-by-task rubric correction before freezing official points", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const result = gradeOfficialExam2025(
      createActiveOfficialExam2025("ui:official-results", now),
      "timeout",
      new Date("2026-07-14T13:00:00.000Z"),
    )
    const onResultChange = vi.fn()

    act(() => {
      root.render(
        <MockExamResultsView
          result={result}
          onContinue={() => undefined}
          onResultChange={onResultChange}
        />,
      )
    })

    expect(container.textContent).toContain("Jetzt wird aus der Abgabe ein ehrliches Ergebnis")
    expect(container.textContent).toContain("Korrekturschema fehlt")
    expect(container.textContent).toContain("Mathematiknote 2025")
    expect(container.textContent).toContain("nach der Korrektur")
    expect((buttonWithText(container, "Korrektur abschliessen")).disabled).toBe(true)

    for (let taskIndex = 0; taskIndex < 9; taskIndex += 1) {
      const score = container.querySelector(`input[name="official-score-${taskIndex + 1}"][value="4"]`)
      if (!(score instanceof HTMLInputElement)) throw new Error(`Missing score for task ${taskIndex + 1}`)
      act(() => score.click())
      if (taskIndex < 8) {
        act(() => buttonWithText(container, "Nächste Aufgabe").click())
      }
    }

    const complete = buttonWithText(container, "Korrektur abschliessen")
    expect(complete.disabled).toBe(false)
    act(() => complete.click())
    expect(onResultChange).toHaveBeenCalledOnce()
    expect(onResultChange.mock.calls[0]![0]).toMatchObject({
      certainPoints: 36,
      reviewablePoints: 0,
      officialReview: {
        status: "complete",
        gradeScaleId: "zap-lg-2025-math-2025-03-14",
        mathematicsGrade: 6,
      },
    })
  })

  it("keeps deterministic milestone points as the minimum during correction", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const exam = createActiveOfficialExam2025("ui:official-floor", now)
    exam.progress[4]!.parts[0]!.answer = "86.5"
    exam.progress[4]!.parts[0]!.milestoneAnswers = {
      "jar-mass-54": "54",
      "before-cooking-72": "72",
      "before-sorting-84": "84",
    }
    const result = gradeOfficialExam2025(exam, "submitted", new Date("2026-07-14T12:45:00.000Z"))

    act(() => {
      root.render(
        <MockExamResultsView
          result={result}
          onContinue={() => undefined}
          onResultChange={() => undefined}
        />,
      )
    })

    const taskFive = container.querySelectorAll<HTMLButtonElement>(".official-correction-nav > div button")[4]
    if (!taskFive) throw new Error("Missing correction navigation for task five")
    act(() => taskFive.click())
    expect(container.textContent).toContain("4 Punkte nach der veröffentlichten Regel vollständig bestimmt")
    expect((container.querySelector('input[name="official-score-5"][value="0"]') as HTMLInputElement).disabled).toBe(true)
    expect((container.querySelector('input[name="official-score-5"][value="4"]') as HTMLInputElement).disabled).toBe(false)
  })

  it("opens a reproducible task report in a new tab and lets the learner pause the question topic", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const review = buildAssignments(learner, now).find((task) => task.kind === "review")!
    const onRequestTeacherSupport = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(review, now)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
          onRequestTeacherSupport={onRequestTeacherSupport}
        />,
      )
    })

    const reportLink = Array.from(container.querySelectorAll("a")).find((link) => (
      link.textContent?.includes("Fehler in dieser Aufgabe melden")
    ))
    if (!(reportLink instanceof HTMLAnchorElement)) throw new Error("Missing exercise report link")
    expect(reportLink.target).toBe("_blank")
    expect(reportLink.rel).toContain("noopener")
    expect(new URL(reportLink.href).pathname).toBe("/exercise-report")
    expect(new URL(reportLink.href).searchParams.get("data")).toBeTruthy()

    const secondaryActions = container.querySelector(".question-secondary-actions")
    const secondarySummary = secondaryActions?.querySelector("summary")
    if (!(secondaryActions instanceof HTMLDetailsElement) || !(secondarySummary instanceof HTMLElement)) {
      throw new Error("Missing secondary question actions")
    }
    expect(secondaryActions.open).toBe(false)
    act(() => secondarySummary.click())
    expect(secondaryActions.open).toBe(true)
    act(() => buttonWithText(container, "Ich verstehe dieses Thema noch nicht").click())
    expect(container.textContent).toContain("erscheint keine weitere Trainingsaufgabe dazu")
    act(() => buttonWithText(container, "Pausieren und melden").click())
    expect(onRequestTeacherSupport).toHaveBeenCalledOnce()
    expect(onRequestTeacherSupport).toHaveBeenCalledWith(review.topicIds[0])
  })

  it("also offers the topic pause before a lesson's questions begin", () => {
    const now = new Date("2026-07-14T12:00:00.000Z")
    const learner = createSeededLearner(now)
    const lesson = buildAssignments(learner, now).find((task) => task.kind === "lesson")!
    const onRequestTeacherSupport = vi.fn()

    act(() => {
      root.render(
        <TaskPlayer
          initialSession={createActiveLearningSession(lesson, now)}
          onBack={() => undefined}
          onFinish={() => undefined}
          onPrerequisite={() => undefined}
          onSessionChange={() => undefined}
          onRequestTeacherSupport={onRequestTeacherSupport}
        />,
      )
    })

    act(() => buttonWithText(container, "Ich verstehe dieses Thema noch nicht").click())
    expect(container.textContent).toContain("wartet in der Begleitansicht")
    act(() => buttonWithText(container, "Pausieren und melden").click())
    expect(onRequestTeacherSupport).toHaveBeenCalledWith(lesson.topicIds[0])
  })

  it("lets a companion reopen a paused topic from the protected dashboard", () => {
    const learner = requestTeacherSupport(
      createSeededLearner(new Date("2026-07-14T12:00:00.000Z")),
      "mass-units",
      new Date("2026-07-14T12:05:00.000Z"),
    )
    const onResolveTeacherSupport = vi.fn()

    act(() => {
      root.render(
        <ParentDashboardView
          learner={learner}
          onLock={() => undefined}
          onResolveTeacherSupport={onResolveTeacherSupport}
          now={new Date("2026-07-14T12:10:00.000Z")}
        />,
      )
    })

    expect(container.textContent).toContain("VON DER LERNENDEN PERSON PAUSIERT")
    expect(container.textContent).toContain("Kilogramm und Gramm sicher umrechnen")
    const guide = container.querySelector(".parent-coaching-guide")
    const guideSummary = guide?.querySelector("summary")
    if (!(guide instanceof HTMLDetailsElement) || !(guideSummary instanceof HTMLElement)) {
      throw new Error("Missing parent coaching guide")
    }
    expect(guide.open).toBe(false)
    act(() => guideSummary.click())
    expect(guide.open).toBe(true)
    expect(guide.textContent).toContain("Worum es heute geht")
    expect(guide.textContent).toContain("Ein Kilogramm besteht aus 1000 Gramm")
    expect(guide.textContent).toContain("kg → g: mit 1000 multiplizieren")
    expect(guide.textContent).toContain("Die lernende Person erklärt zurück")
    expect(guide.textContent).toContain("Die Einheit sagt dir, in welche Richtung du umrechnest.")
    act(() => buttonWithText(container, "Erklärt – wieder freigeben").click())
    expect(onResolveTeacherSupport).toHaveBeenCalledOnce()
    expect(onResolveTeacherSupport).toHaveBeenCalledWith("mass-units")
  })

  it("shows and reopens a paused German topic in the same companion dashboard", () => {
    const learner = createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))
    const germanCourse = requestGermanTopicSupport(
      createInitialGermanCourseState(learner.learnerId, new Date("2026-07-14T12:00:00.000Z")),
      "reading-evidence",
      new Date("2026-07-14T12:05:00.000Z"),
    )
    const onResolveGermanTopicSupport = vi.fn()

    act(() => {
      root.render(
        <ParentDashboardView
          learner={learner}
          germanCourse={germanCourse}
          onLock={() => undefined}
          onResolveGermanTopicSupport={onResolveGermanTopicSupport}
          now={new Date("2026-07-14T12:10:00.000Z")}
        />,
      )
    })

    expect(container.textContent).toContain("DEUTSCH · ERKLÄRUNG GEWÜNSCHT")
    expect(container.textContent).toContain("Aussagen mit Textstellen belegen")
    const guide = container.querySelector(".german-parent-help .parent-coaching-guide")
    const guideSummary = guide?.querySelector("summary")
    if (!(guide instanceof HTMLDetailsElement) || !(guideSummary instanceof HTMLElement)) {
      throw new Error("Missing German parent coaching guide")
    }
    act(() => guideSummary.click())
    expect(guide.textContent).toContain("welche Wörter den Beleg tragen")
    act(() => buttonWithText(container, "Erklärt – wieder freigeben").click())
    expect(onResolveGermanTopicSupport).toHaveBeenCalledOnce()
    expect(onResolveGermanTopicSupport).toHaveBeenCalledWith("reading-evidence")
  })

  it("switches the paused-topic coaching guide to authored English without translating learner tasks", () => {
    const learner = requestTeacherSupport(
      createSeededLearner(new Date("2026-07-14T12:00:00.000Z")),
      "time-fractions",
      new Date("2026-07-14T12:05:00.000Z"),
    )
    const onExplanationLanguageChange = vi.fn()
    const now = new Date("2026-07-14T12:10:00.000Z")

    act(() => {
      root.render(
        <ParentDashboardView
          learner={learner}
          onLock={() => undefined}
          explanationLanguage="de"
          onExplanationLanguageChange={onExplanationLanguageChange}
          now={now}
        />,
      )
    })

    const languageGroup = container.querySelector('[role="group"][aria-label="Sprache der gemeinsamen Erklärung"]')
    expect(languageGroup).not.toBeNull()
    act(() => buttonWithText(container, "English").click())
    expect(onExplanationLanguageChange).toHaveBeenCalledWith("en")

    act(() => {
      root.render(
        <ParentDashboardView
          learner={learner}
          onLock={() => undefined}
          explanationLanguage="en"
          onExplanationLanguageChange={onExplanationLanguageChange}
          now={now}
        />,
      )
    })

    expect(container.textContent).toContain("PAUSED BY THE LEARNER")
    expect(container.textContent).toContain("Calculate fractions of time intervals")
    expect(container.textContent).toContain("The language of the learner's questions is selected separately in settings")
    expect(container.querySelector('button[aria-pressed="true"]')?.textContent).toBe("English")

    const guide = container.querySelector(".parent-coaching-guide")
    const guideSummary = guide?.querySelector("summary")
    if (!(guide instanceof HTMLDetailsElement) || !(guideSummary instanceof HTMLElement)) {
      throw new Error("Missing English parent coaching guide")
    }
    act(() => guideSummary.click())
    expect(guide.textContent).toContain("Convert everything to minutes first")
    expect(guide.textContent).toContain("2 h 20 min = 140 min")
    expect(guide.textContent).toContain("What would you do first, and why?")
    expect(guide.textContent).toContain("Find a fraction of a quantity")
    expect(container.textContent).toContain("Unterstützen, ohne Druck aufzubauen.")
  })

  it("requires confirmation in profile settings before resetting to onboarding", () => {
    const onReset = vi.fn()
    act(() => {
      root.render(
        <ProfileSetupView
          learner={createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))}
          mode="edit"
          onSave={async () => undefined}
          onResetAll={onReset}
          now={new Date("2026-07-14T12:00:00.000Z")}
        />,
      )
    })

    act(() => buttonWithText(container, "Testprofil zurücksetzen und Onboarding neu starten").click())
    expect(container.textContent).toContain("Lernstand, XP, laufende Aufgaben")
    expect(container.textContent).toContain("Das getrennte Freigabeprotokoll bleibt erhalten")
    expect(onReset).not.toHaveBeenCalled()
    act(() => buttonWithText(container, "Profil zurücksetzen").click())
    expect(onReset).toHaveBeenCalledOnce()
  })

  it("keeps destructive reset controls out of the Progress overview", () => {
    const onResetSubject = vi.fn()
    const onReset = vi.fn()
    const onEditProfile = vi.fn()
    act(() => {
      root.render(
        <ProgressView
          learner={createSeededLearner(new Date("2026-07-14T12:00:00.000Z"))}
          onBack={() => undefined}
          onEditProfile={onEditProfile}
          onResetSubject={onResetSubject}
          onReset={onReset}
          now={new Date("2026-07-14T12:00:00.000Z")}
        />,
      )
    })

    expect(container.textContent).not.toContain("Mathematik-Lernstand zurücksetzen")
    expect(container.textContent).not.toContain("Testprofil zurücksetzen und Onboarding neu starten")
    expect(onResetSubject).not.toHaveBeenCalled()
    expect(onReset).not.toHaveBeenCalled()
    act(() => buttonWithText(container, "Plan anpassen").click())
    expect(onEditProfile).toHaveBeenCalledOnce()
  })
})
