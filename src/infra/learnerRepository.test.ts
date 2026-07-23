import { beforeEach, describe, expect, it } from "vitest"
import {
  buildAssignments,
  buildPrerequisiteRefresh,
  createSeededLearner,
} from "../domain/learningEngine"
import { createActiveArchivePractice } from "../domain/archivePractice"
import {
  createActiveLearningSession,
  createPrerequisiteDetourSession,
} from "../domain/session"
import { createActiveMockExam } from "../domain/mockExam"
import { officialArchiveCatalog } from "../domain/officialArchiveCatalog"
import { germanSourceArchiveCatalog } from "../subjects/german/sourceArchiveCatalog"
import { createLearnerCourseIndex, touchCourse } from "../domain/courseIndex"
import { courseKeys } from "../domain/subjectIdentity"
import {
  answerGermanStartCheck,
  buildGermanAssignments,
  createInitialGermanCourseState,
  startGermanSession,
  startGermanStartCheck,
  type GermanCourseState,
} from "../subjects/german/courseState"
import { germanStartCheckQuestions } from "../subjects/german/content"
import {
  createActiveGermanSourcePractice,
  createGermanSourcePracticeState,
} from "../subjects/german/sourcePractice"
import { createParentAccess } from "../domain/parentAccess"
import {
  createReleaseReadinessRecord,
  setReleaseReadinessCheck,
} from "../domain/releaseReadiness"
import {
  clearActiveMockExam,
  clearActiveArchivePractice,
  clearActiveSession,
  clearLearnerState,
  clearCourseIndex,
  clearGermanCourseState,
  clearGermanSourcePracticeState,
  clearOfficialArchiveDocuments,
  clearParentAccess,
  clearReleaseReadiness,
  loadActiveSession,
  loadActiveMockExam,
  loadActiveArchivePractice,
  loadLearnerState,
  loadCourseIndex,
  loadGermanCourseState,
  loadGermanSourcePracticeState,
  loadGermanSourceArchiveLibrary,
  loadOfficialArchiveDocuments,
  loadOfficialArchiveLibrary,
  loadParentAccess,
  loadReleaseReadiness,
  replaceLocalLearningData,
  saveActiveSession,
  saveLearnerAndActiveSession,
  saveActiveMockExam,
  saveActiveArchivePractice,
  saveLearnerState,
  saveCourseIndex,
  saveGermanCourseState,
  saveGermanSourcePracticeState,
  saveGermanSourceArchiveDocument,
  saveOfficialArchiveDocument,
  saveParentAccess,
  saveReleaseReadiness,
} from "./learnerRepository"

describe("learner repository", () => {
  beforeEach(async () => {
    await clearLearnerState()
    await clearGermanCourseState()
    await clearGermanSourcePracticeState()
    await clearCourseIndex()
    await clearActiveSession()
    await clearActiveMockExam()
    await clearActiveArchivePractice()
    await clearParentAccess()
    await clearReleaseReadiness()
    await clearOfficialArchiveDocuments()
  })

  it("round-trips the complete learning state locally", async () => {
    const state = createSeededLearner(new Date("2026-07-14T10:00:00.000Z"))
    state.totalXp = 73
    state.xpSinceAssessment = 73

    await saveLearnerState(state)

    expect(await loadLearnerState()).toEqual(state)
  })

  it("keeps mathematics and German course state under stable, isolated keys", async () => {
    const math = createSeededLearner(new Date("2026-07-14T10:00:00.000Z"))
    const german = createInitialGermanCourseState(math.learnerId, new Date("2026-07-14T10:00:00.000Z"))
    german.totalXp = 25
    const index = touchCourse(
      createLearnerCourseIndex(new Date("2026-07-14T10:00:00.000Z")),
      "german",
      new Date("2026-07-14T11:00:00.000Z"),
    )

    await saveLearnerState(math)
    await saveGermanCourseState(german)
    await saveCourseIndex(index)

    expect(await loadLearnerState()).toEqual(math)
    expect(await loadGermanCourseState()).toEqual(german)
    expect(await loadCourseIndex()).toMatchObject({
      activeCourseKey: courseKeys.german,
      courseKeys: [courseKeys.math, courseKeys.german],
    })

    await clearGermanCourseState()
    expect(await loadGermanCourseState()).toBeUndefined()
    expect(await loadLearnerState()).toEqual(math)
  })

  it("migrates a paused version-one German generator session in IndexedDB", async () => {
    const now = new Date("2026-07-14T10:00:00.000Z")
    let state = startGermanStartCheck(createInitialGermanCourseState("learner", now), now)
    for (const question of germanStartCheckQuestions) {
      state = answerGermanStartCheck(state, question.correctIndex, now)
    }
    state = startGermanSession(state, buildGermanAssignments(state, now)[2]!, now)
    const legacy = structuredClone(state) as unknown as {
      schemaVersion: number
      activeSession: { generatorVersion?: number }
    }
    legacy.schemaVersion = 3
    delete legacy.activeSession.generatorVersion

    await saveGermanCourseState(legacy as unknown as GermanCourseState)
    const migrated = await loadGermanCourseState()

    expect(migrated).toMatchObject({ schemaVersion: 9 })
    expect(migrated?.activeSession?.generatorVersion).toBe(1)
  })

  it("keeps a paused schema-four German session pinned to generator version two", async () => {
    const now = new Date("2026-07-14T10:00:00.000Z")
    let state = startGermanStartCheck(createInitialGermanCourseState("learner", now), now)
    for (const question of germanStartCheckQuestions) {
      state = answerGermanStartCheck(state, question.correctIndex, now)
    }
    state = startGermanSession(state, buildGermanAssignments(state, now)[4]!, now)
    const expanded = structuredClone(state) as unknown as {
      schemaVersion: number
      activeSession: { generatorVersion: number }
    }
    expanded.schemaVersion = 4
    expanded.activeSession.generatorVersion = 2

    await saveGermanCourseState(expanded as unknown as GermanCourseState)
    const migrated = await loadGermanCourseState()

    expect(migrated).toMatchObject({ schemaVersion: 9 })
    expect(migrated?.activeSession?.generatorVersion).toBe(2)
  })

  it("round-trips and clears an in-progress learning session", async () => {
    const now = new Date("2026-07-14T10:00:00.000Z")
    const learner = createSeededLearner(now)
    const task = buildAssignments(learner, now)[0]!
    const session = createActiveLearningSession(task, now)
    session.activeSeconds = 47
    session.question.answer = "12,5"

    await saveActiveSession(session)
    expect(await loadActiveSession()).toEqual(session)

    await clearActiveSession()
    expect(await loadActiveSession()).toBeUndefined()
  })

  it("atomically replaces a prerequisite detour with its source session and learner result", async () => {
    const now = new Date("2026-07-14T10:00:00.000Z")
    const learner = createSeededLearner(now)
    const source = createActiveLearningSession(buildAssignments(learner, now)[0]!, now)
    source.question.answer = "42"
    const detour = createPrerequisiteDetourSession(
      buildPrerequisiteRefresh(learner, "mass-units"),
      source,
      now,
    )
    await saveLearnerState(learner)
    await saveActiveSession(detour)

    const completed = structuredClone(learner)
    completed.totalXp += detour.task.maxXp
    completed.completedTaskIds.push(detour.task.id)
    await saveLearnerAndActiveSession(completed, source)

    expect(await loadLearnerState()).toEqual(completed)
    expect(await loadActiveSession()).toEqual(source)
  })

  it("round-trips and clears a running absolute-deadline mock exam", async () => {
    const exam = createActiveMockExam(
      "repository:mock:1",
      new Date("2026-07-14T10:00:00.000Z"),
    )
    exam.currentTaskIndex = 4
    exam.progress[4]!.visited = true
    exam.progress[4]!.visitCount = 1
    exam.progress[4]!.flagged = true
    exam.progress[4]!.parts[0]!.answer = "72"
    exam.progress[4]!.parts[0]!.working = "54 : 3 · 4 = 72"

    await saveActiveMockExam(exam)
    expect(await loadActiveMockExam()).toEqual(exam)

    await clearActiveMockExam()
    expect(await loadActiveMockExam()).toBeUndefined()
  })

  it("round-trips and clears a source-only archive practice independently", async () => {
    const practice = createActiveArchivePractice(
      "zap-zh-lg-2022",
      "repository:archive:1",
      new Date("2026-07-14T10:00:00.000Z"),
    )
    practice.currentTaskIndex = 3
    practice.taskPageNumber = 5
    practice.progress[3]!.visited = true
    practice.progress[3]!.visitCount = 1
    practice.progress[3]!.attemptedOnPaper = true

    await saveActiveArchivePractice(practice)
    expect(await loadActiveArchivePractice()).toEqual(practice)

    await clearActiveArchivePractice()
    expect(await loadActiveArchivePractice()).toBeUndefined()
  })

  it("round-trips German source practice under its course key without changing mathematics", async () => {
    const mathPractice = createActiveArchivePractice(
      "zap-zh-lg-2022",
      "repository:math-source",
      new Date("2026-07-17T10:00:00.000Z"),
    )
    const germanPractice = createActiveGermanSourcePractice(
      "zap-zh-lg-german-2025",
      "writing",
      "repository:german-source",
      new Date("2026-07-17T10:00:00.000Z"),
    )
    const germanState = {
      ...createGermanSourcePracticeState(),
      active: germanPractice,
    }

    await saveActiveArchivePractice(mathPractice)
    await saveGermanSourcePracticeState(germanState)
    expect(await loadActiveArchivePractice()).toEqual(mathPractice)
    expect(await loadGermanSourcePracticeState()).toEqual(germanState)

    await clearGermanSourcePracticeState()
    expect(await loadGermanSourcePracticeState()).toEqual(createGermanSourcePracticeState())
    expect(await loadActiveArchivePractice()).toEqual(mathPractice)
  })

  it("keeps the device-local parent PIN verifier separate from learner history", async () => {
    const access = await createParentAccess(
      "4826",
      new Date("2026-07-14T10:00:00.000Z"),
      "en",
    )

    await saveParentAccess(access)
    expect(await loadParentAccess()).toEqual(access)

    await clearLearnerState()
    expect(await loadParentAccess()).toEqual(access)
    expect((await loadParentAccess())?.explanationLanguage).toBe("en")

    await clearParentAccess()
    expect(await loadParentAccess()).toBeUndefined()
  })

  it("keeps public-readiness attestations local and separate from learner history", async () => {
    const record = setReleaseReadinessCheck(
      createReleaseReadinessRecord(new Date("2026-07-15T10:00:00.000Z")),
      "ipad-standalone",
      true,
      new Date("2026-07-15T10:01:00.000Z"),
    )

    await saveReleaseReadiness(record)
    expect(await loadReleaseReadiness()).toEqual(record)

    await clearLearnerState()
    expect(await loadReleaseReadiness()).toEqual(record)

    await clearReleaseReadiness()
    expect(await loadReleaseReadiness()).toBeUndefined()
  })

  it("stores imported official PDFs locally and outside learner state", async () => {
    const record = {
      id: "zap-zh-lg-2025:tasks",
      editionId: "zap-zh-lg-2025" as const,
      kind: "tasks" as const,
      filename: "2025_mathematik_aufgaben.pdf",
      mimeType: "application/pdf" as const,
      size: 9,
      sha256: "ebbab8f760060113dee4372af3545d369bf05314abae3600b61d5d5164264ec6",
      importedAt: "2026-07-14T10:00:00.000Z",
      blob: new Blob(["%PDF-test"], { type: "application/pdf" }),
    }

    await saveOfficialArchiveDocument(record)
    const archived2024Solution = {
      id: "zap-zh-lg-2024:solutions",
      editionId: "zap-zh-lg-2024" as const,
      kind: "solutions" as const,
      filename: officialArchiveCatalog["zap-zh-lg-2024"].documents.solutions.expectedFilename,
      mimeType: "application/pdf" as const,
      size: 12,
      sha256: officialArchiveCatalog["zap-zh-lg-2024"].documents.solutions.sha256,
      importedAt: "2026-07-14T10:00:00.000Z",
      blob: new Blob(["%PDF-2024-solution"], { type: "application/pdf" }),
    }
    await saveOfficialArchiveDocument(archived2024Solution)
    const loaded = await loadOfficialArchiveDocuments()
    expect(loaded.tasks).toMatchObject({
      filename: record.filename,
      sha256: record.sha256,
      kind: "tasks",
    })
    expect(loaded.tasks?.blob).toBeDefined()
    const library = await loadOfficialArchiveLibrary()
    expect(library["zap-zh-lg-2025"]?.tasks?.filename).toBe(record.filename)
    expect(library["zap-zh-lg-2024"]?.solutions?.filename).toBe(archived2024Solution.filename)
    expect(loaded.solutions).toBeUndefined()

    await clearLearnerState()
    expect((await loadOfficialArchiveLibrary())["zap-zh-lg-2024"]?.solutions).toBeDefined()
    await clearOfficialArchiveDocuments()
    expect(await loadOfficialArchiveDocuments()).toEqual({})
    expect(await loadOfficialArchiveLibrary()).toEqual({})
  })

  it("keeps German sources beside mathematics sources without mixing either catalog", async () => {
    const mathDefinition = officialArchiveCatalog["zap-zh-lg-2025"].documents.tasks
    const germanDefinition = germanSourceArchiveCatalog["zap-zh-lg-german-2025"].documents.solutions
    await saveOfficialArchiveDocument({
      id: "zap-zh-lg-2025:tasks",
      editionId: "zap-zh-lg-2025",
      kind: "tasks",
      filename: mathDefinition.expectedFilename,
      mimeType: "application/pdf",
      size: 10,
      sha256: mathDefinition.sha256,
      importedAt: "2026-07-17T12:00:00.000Z",
      blob: new Blob(["%PDF-math"], { type: "application/pdf" }),
    })
    await saveGermanSourceArchiveDocument({
      id: "german-source:zap-zh-lg-german-2025:solutions",
      subjectId: "german",
      editionId: "zap-zh-lg-german-2025",
      kind: "solutions",
      filename: germanDefinition.expectedFilename,
      mimeType: "application/pdf",
      size: 12,
      sha256: germanDefinition.sha256,
      importedAt: "2026-07-17T12:00:00.000Z",
      blob: new Blob(["%PDF-german"], { type: "application/pdf" }),
    })

    const mathLibrary = await loadOfficialArchiveLibrary()
    const germanLibrary = await loadGermanSourceArchiveLibrary()
    expect(mathLibrary["zap-zh-lg-2025"]?.tasks?.filename).toBe(mathDefinition.expectedFilename)
    expect(mathLibrary["zap-zh-lg-2025"]?.solutions).toBeUndefined()
    expect(germanLibrary["zap-zh-lg-german-2025"]?.solutions?.filename).toBe(germanDefinition.expectedFilename)
    expect(Object.keys(germanLibrary)).toEqual(["zap-zh-lg-german-2025"])

    await clearGermanCourseState()
    expect((await loadGermanSourceArchiveLibrary())["zap-zh-lg-german-2025"]?.solutions).toBeDefined()
    await clearOfficialArchiveDocuments()
    expect(await loadOfficialArchiveLibrary()).toEqual({})
    expect(await loadGermanSourceArchiveLibrary()).toEqual({})
  })

  it("replaces learner and paused-session data together", async () => {
    const now = new Date("2026-07-14T10:00:00.000Z")
    const original = createSeededLearner(now)
    const restored = createSeededLearner(new Date("2026-06-01T08:00:00.000Z"))
    restored.totalXp = 211
    const task = buildAssignments(restored, now)[0]!
    const session = createActiveLearningSession(task, now)
    session.activeSeconds = 88

    await saveLearnerState(original)
    const mock = createActiveMockExam("restored:mock", now)
    const archivePractice = createActiveArchivePractice("zap-zh-lg-2021", "restored:archive", now)
    const german = createInitialGermanCourseState(restored.learnerId, now)
    german.totalXp = 29
    const germanSourcePractice = {
      ...createGermanSourcePracticeState(),
      active: createActiveGermanSourcePractice(
        "zap-zh-lg-german-2025",
        "writing",
        "restored:german-source",
        now,
      ),
    }
    const index = touchCourse(createLearnerCourseIndex(now), "german", now)
    await replaceLocalLearningData(
      restored,
      session,
      mock,
      archivePractice,
      german,
      index,
      germanSourcePractice,
    )

    expect(await loadLearnerState()).toEqual(restored)
    expect(await loadGermanCourseState()).toEqual(german)
    expect(await loadCourseIndex()).toEqual(index)
    expect(await loadActiveSession()).toEqual(session)
    expect(await loadActiveMockExam()).toEqual(mock)
    expect(await loadActiveArchivePractice()).toEqual(archivePractice)
    expect(await loadGermanSourcePracticeState()).toEqual(germanSourcePractice)

    await replaceLocalLearningData(original)
    expect(await loadLearnerState()).toEqual(original)
    expect(await loadActiveSession()).toBeUndefined()
    expect(await loadActiveMockExam()).toBeUndefined()
    expect(await loadActiveArchivePractice()).toBeUndefined()
    expect(await loadGermanCourseState()).toBeUndefined()
    expect(await loadGermanSourcePracticeState()).toEqual(createGermanSourcePracticeState())
    expect(await loadCourseIndex()).toMatchObject({
      activeCourseKey: courseKeys.math,
      courseKeys: [courseKeys.math],
    })
  })
})
