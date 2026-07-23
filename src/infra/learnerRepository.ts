import { openDB, type DBSchema } from "idb"
import { isActiveArchivePractice, type ActiveArchivePractice } from "../domain/archivePractice"
import type { LearnerState } from "../domain/model"
import type { ActiveMockExam } from "../domain/mockExam"
import type { ParentAccessRecord } from "../domain/parentAccess"
import type { ReleaseReadinessRecord } from "../domain/releaseReadiness"
import type { ActiveLearningSession } from "../domain/session"
import {
  createLearnerCourseIndex,
  normalizeLearnerCourseIndex,
  type LearnerCourseIndex,
} from "../domain/courseIndex"
import { courseKeys } from "../domain/subjectIdentity"
import {
  isGermanCourseState,
  normalizeGermanCourseState,
  type GermanCourseState,
} from "../subjects/german/courseState"
import {
  createGermanSourcePracticeState,
  normalizeGermanSourcePracticeState,
  type GermanSourcePracticeState,
} from "../subjects/german/sourcePractice"
import type {
  OfficialArchiveDocumentRecord,
  OfficialArchiveDocuments,
  OfficialArchiveLibrary,
} from "./officialArchive"
import { groupOfficialArchiveRecords, officialArchiveDocumentId } from "./officialArchive"
import {
  groupGermanSourceArchiveRecords,
  type GermanSourceArchiveDocumentRecord,
  type GermanSourceArchiveLibrary,
} from "./germanSourceArchive"

interface GymiQuestDatabase extends DBSchema {
  learner: {
    key: string
    value: LearnerState | GermanCourseState
  }
  session: {
    key: string
    value: ActiveLearningSession
  }
  mockExam: {
    key: string
    value: ActiveMockExam
  }
  archivePractice: {
    key: string
    value: ActiveArchivePractice | GermanSourcePracticeState
  }
  parentAccess: {
    key: string
    value: ParentAccessRecord
  }
  releaseReadiness: {
    key: string
    value: ReleaseReadinessRecord
  }
  archiveDocument: {
    key: string
    value: OfficialArchiveDocumentRecord | GermanSourceArchiveDocumentRecord
  }
  courseIndex: {
    key: string
    value: LearnerCourseIndex
  }
}

const databasePromise = openDB<GymiQuestDatabase>("gymiquest", 8, {
  upgrade(database, oldVersion, _newVersion, transaction) {
    if (!database.objectStoreNames.contains("learner")) {
      database.createObjectStore("learner")
    }
    if (!database.objectStoreNames.contains("session")) {
      database.createObjectStore("session")
    }
    if (!database.objectStoreNames.contains("mockExam")) {
      database.createObjectStore("mockExam")
    }
    if (!database.objectStoreNames.contains("archivePractice")) {
      database.createObjectStore("archivePractice")
    }
    if (!database.objectStoreNames.contains("parentAccess")) {
      database.createObjectStore("parentAccess")
    }
    if (!database.objectStoreNames.contains("releaseReadiness")) {
      database.createObjectStore("releaseReadiness")
    }
    if (!database.objectStoreNames.contains("archiveDocument")) {
      database.createObjectStore("archiveDocument")
    }
    if (!database.objectStoreNames.contains("courseIndex")) {
      database.createObjectStore("courseIndex")
    }
    if (oldVersion < 8) {
      const learnerStore = transaction.objectStore("learner")
      const sessionStore = transaction.objectStore("session")
      const mockStore = transaction.objectStore("mockExam")
      const archivePracticeStore = transaction.objectStore("archivePractice")
      const courseIndexStore = transaction.objectStore("courseIndex")
      void learnerStore.get("current").then((legacy) => (
        legacy && !normalizeGermanCourseState(legacy)
          ? learnerStore.put(legacy, courseKeys.math)
          : undefined
      ))
      void sessionStore.get("current").then((legacy) => (
        legacy ? sessionStore.put(legacy, courseKeys.math) : undefined
      ))
      void mockStore.get("current").then((legacy) => (
        legacy ? mockStore.put(legacy, courseKeys.math) : undefined
      ))
      void archivePracticeStore.get("current").then((legacy) => (
        legacy ? archivePracticeStore.put(legacy, courseKeys.math) : undefined
      ))
      void courseIndexStore.get("current").then((existing) => (
        existing ? undefined : courseIndexStore.put(createLearnerCourseIndex(), "current")
      ))
    }
  },
})

let sessionMutation = Promise.resolve()

function enqueueSessionMutation(operation: () => Promise<void>): Promise<void> {
  const next = sessionMutation.then(operation)
  sessionMutation = next.catch(() => undefined)
  return next
}

export async function loadLearnerState(): Promise<LearnerState | undefined> {
  const database = await databasePromise
  const stable = await database.get("learner", courseKeys.math)
  if (stable && !normalizeGermanCourseState(stable)) return stable as LearnerState
  const legacy = await database.get("learner", "current")
  if (!legacy || normalizeGermanCourseState(legacy)) return undefined
  const learner = legacy as LearnerState
  await database.put("learner", learner, courseKeys.math)
  return learner
}

export async function saveLearnerState(state: LearnerState): Promise<void> {
  const database = await databasePromise
  await database.put("learner", state, courseKeys.math)
}

export async function clearLearnerState(): Promise<void> {
  const database = await databasePromise
  const transaction = database.transaction("learner", "readwrite")
  await Promise.all([
    transaction.store.delete(courseKeys.math),
    transaction.store.delete("current"),
    transaction.done,
  ])
}

export async function loadGermanCourseState(): Promise<GermanCourseState | undefined> {
  const database = await databasePromise
  const stored = await database.get("learner", courseKeys.german)
  const state = normalizeGermanCourseState(stored)
  if (state && !isGermanCourseState(stored)) {
    await database.put("learner", state, courseKeys.german)
  }
  return state
}

export async function saveGermanCourseState(state: GermanCourseState): Promise<void> {
  const database = await databasePromise
  await database.put("learner", state, courseKeys.german)
}

export async function clearGermanCourseState(): Promise<void> {
  const database = await databasePromise
  await database.delete("learner", courseKeys.german)
}

export async function loadCourseIndex(): Promise<LearnerCourseIndex> {
  const database = await databasePromise
  const existing = await database.get("courseIndex", "current")
  const index = normalizeLearnerCourseIndex(existing)
  if (!existing) await database.put("courseIndex", index, "current")
  return index
}

export async function saveCourseIndex(index: LearnerCourseIndex): Promise<void> {
  const database = await databasePromise
  await database.put("courseIndex", normalizeLearnerCourseIndex(index), "current")
}

export async function clearCourseIndex(): Promise<void> {
  const database = await databasePromise
  await database.delete("courseIndex", "current")
}

export async function loadActiveSession(): Promise<ActiveLearningSession | undefined> {
  await sessionMutation
  const database = await databasePromise
  const stable = await database.get("session", courseKeys.math)
  if (stable) return stable
  const legacy = await database.get("session", "current")
  if (legacy) await database.put("session", legacy, courseKeys.math)
  return legacy
}

export function saveActiveSession(session: ActiveLearningSession): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    await database.put("session", session, courseKeys.math)
  })
}

export function saveLearnerAndActiveSession(
  state: LearnerState,
  session: ActiveLearningSession,
): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    const transaction = database.transaction(["learner", "session"], "readwrite")
    await Promise.all([
      transaction.objectStore("learner").put(state, courseKeys.math),
      transaction.objectStore("session").put(session, courseKeys.math),
      transaction.done,
    ])
  })
}

export function clearActiveSession(): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    const transaction = database.transaction("session", "readwrite")
    await Promise.all([
      transaction.store.delete(courseKeys.math),
      transaction.store.delete("current"),
      transaction.done,
    ])
  })
}

export async function loadActiveMockExam(): Promise<ActiveMockExam | undefined> {
  await sessionMutation
  const database = await databasePromise
  const stable = await database.get("mockExam", courseKeys.math)
  if (stable) return stable
  const legacy = await database.get("mockExam", "current")
  if (legacy) await database.put("mockExam", legacy, courseKeys.math)
  return legacy
}

export function saveActiveMockExam(exam: ActiveMockExam): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    await database.put("mockExam", exam, courseKeys.math)
  })
}

export function clearActiveMockExam(): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    const transaction = database.transaction("mockExam", "readwrite")
    await Promise.all([
      transaction.store.delete(courseKeys.math),
      transaction.store.delete("current"),
      transaction.done,
    ])
  })
}

export async function loadActiveArchivePractice(): Promise<ActiveArchivePractice | undefined> {
  await sessionMutation
  const database = await databasePromise
  const stable = await database.get("archivePractice", courseKeys.math)
  if (stable && isActiveArchivePractice(stable)) return stable
  const legacy = await database.get("archivePractice", "current")
  if (legacy && isActiveArchivePractice(legacy)) {
    await database.put("archivePractice", legacy, courseKeys.math)
    return legacy
  }
  return undefined
}

export function saveActiveArchivePractice(practice: ActiveArchivePractice): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    await database.put("archivePractice", practice, courseKeys.math)
  })
}

export function clearActiveArchivePractice(): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    const transaction = database.transaction("archivePractice", "readwrite")
    await Promise.all([
      transaction.store.delete(courseKeys.math),
      transaction.store.delete("current"),
      transaction.done,
    ])
  })
}

export async function loadGermanSourcePracticeState(): Promise<GermanSourcePracticeState> {
  await sessionMutation
  const database = await databasePromise
  const value = await database.get("archivePractice", courseKeys.german)
  return value ? normalizeGermanSourcePracticeState(value) : createGermanSourcePracticeState()
}

export function saveGermanSourcePracticeState(state: GermanSourcePracticeState): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    await database.put("archivePractice", normalizeGermanSourcePracticeState(state), courseKeys.german)
  })
}

export function clearGermanSourcePracticeState(): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    await database.delete("archivePractice", courseKeys.german)
  })
}

export async function loadParentAccess(): Promise<ParentAccessRecord | undefined> {
  const database = await databasePromise
  return database.get("parentAccess", "current")
}

export async function saveParentAccess(record: ParentAccessRecord): Promise<void> {
  const database = await databasePromise
  await database.put("parentAccess", record, "current")
}

export async function clearParentAccess(): Promise<void> {
  const database = await databasePromise
  await database.delete("parentAccess", "current")
}

export async function loadReleaseReadiness(): Promise<ReleaseReadinessRecord | undefined> {
  const database = await databasePromise
  return database.get("releaseReadiness", "current")
}

export async function saveReleaseReadiness(record: ReleaseReadinessRecord): Promise<void> {
  const database = await databasePromise
  await database.put("releaseReadiness", record, "current")
}

export async function clearReleaseReadiness(): Promise<void> {
  const database = await databasePromise
  await database.delete("releaseReadiness", "current")
}

export async function loadOfficialArchiveDocuments(): Promise<OfficialArchiveDocuments> {
  const database = await databasePromise
  const [tasks, solutions] = await Promise.all([
    database.get("archiveDocument", officialArchiveDocumentId("tasks")),
    database.get("archiveDocument", officialArchiveDocumentId("solutions")),
  ])
  return {
    ...(tasks && !("subjectId" in tasks) && tasks.kind === "tasks" ? { tasks } : {}),
    ...(solutions && !("subjectId" in solutions) && solutions.kind === "solutions" ? { solutions } : {}),
  }
}

export async function loadOfficialArchiveLibrary(): Promise<OfficialArchiveLibrary> {
  const database = await databasePromise
  return groupOfficialArchiveRecords(await database.getAll("archiveDocument"))
}

export async function loadGermanSourceArchiveLibrary(): Promise<GermanSourceArchiveLibrary> {
  const database = await databasePromise
  return groupGermanSourceArchiveRecords(await database.getAll("archiveDocument"))
}

export async function saveOfficialArchiveDocument(record: OfficialArchiveDocumentRecord): Promise<void> {
  const database = await databasePromise
  await database.put("archiveDocument", record, record.id)
}

export async function saveGermanSourceArchiveDocument(
  record: GermanSourceArchiveDocumentRecord,
): Promise<void> {
  const database = await databasePromise
  await database.put("archiveDocument", record, record.id)
}

export async function clearOfficialArchiveDocuments(): Promise<void> {
  const database = await databasePromise
  await database.clear("archiveDocument")
}

export function replaceLocalLearningData(
  state: LearnerState,
  session?: ActiveLearningSession,
  activeMock?: ActiveMockExam,
  activeArchivePractice?: ActiveArchivePractice,
  germanCourse?: GermanCourseState,
  courseIndex?: LearnerCourseIndex,
  germanSourcePractice?: GermanSourcePracticeState,
): Promise<void> {
  return enqueueSessionMutation(async () => {
    const database = await databasePromise
    const transaction = database.transaction(
      ["learner", "session", "mockExam", "archivePractice", "courseIndex"],
      "readwrite",
    )
    const learnerStore = transaction.objectStore("learner")
    const sessionStore = transaction.objectStore("session")
    const mockStore = transaction.objectStore("mockExam")
    const archivePracticeStore = transaction.objectStore("archivePractice")
    const courseIndexStore = transaction.objectStore("courseIndex")

    await Promise.all([
      learnerStore.put(state, courseKeys.math),
      germanCourse
        ? learnerStore.put(germanCourse, courseKeys.german)
        : learnerStore.delete(courseKeys.german),
      session
        ? sessionStore.put(session, courseKeys.math)
        : sessionStore.delete(courseKeys.math),
      activeMock
        ? mockStore.put(activeMock, courseKeys.math)
        : mockStore.delete(courseKeys.math),
      activeArchivePractice
        ? archivePracticeStore.put(activeArchivePractice, courseKeys.math)
        : archivePracticeStore.delete(courseKeys.math),
      germanSourcePractice
        ? archivePracticeStore.put(normalizeGermanSourcePracticeState(germanSourcePractice), courseKeys.german)
        : archivePracticeStore.delete(courseKeys.german),
      sessionStore.delete("current"),
      mockStore.delete("current"),
      archivePracticeStore.delete("current"),
      courseIndexStore.put(
        normalizeLearnerCourseIndex(courseIndex ?? createLearnerCourseIndex()),
        "current",
      ),
      transaction.done,
    ])
  })
}
