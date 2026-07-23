import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { generateQuestionsForTask } from "../src/domain/generators"
import { createSeededLearner } from "../src/domain/learningEngine"
import type { LearningTask } from "../src/domain/model"
import { createActiveLearningSession } from "../src/domain/session"

const assessmentTask: LearningTask = {
  id: "assessment:feedback-deferral-e2e",
  kind: "assessment",
  title: "Standortbestimmung",
  description: "Eine gespeicherte Standortbestimmung.",
  topicIds: ["mass-units"],
  prerequisiteIds: [],
  maxXp: 10,
  questionCount: 1,
  seed: "assessment:feedback-deferral-e2e",
  assessmentNumber: 1,
  contentLocale: "de",
  curriculum: {
    courseId: "zh-zap1-math",
    version: 1,
  },
}

const assessmentQuestion = generateQuestionsForTask(assessmentTask)[0]!
if (assessmentQuestion.response.kind !== "number") {
  throw new Error("The assessment feedback regression requires a numeric question.")
}
const assessmentCases = [
  {
    label: "mathematical miss",
    answer: String(assessmentQuestion.response.value + 1_000),
  },
  {
    label: "malformed final submission",
    answer: "keine Zahl",
    diagnosticKind: "format",
  },
] as const

async function seedAssessment(page: Page): Promise<void> {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Für wen und bis wann planen wir?" })).toBeVisible()
  await page.waitForFunction(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const stored = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction("learner", "readonly").objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return Boolean(stored)
  })

  const now = new Date("2026-07-23T18:00:00.000Z")
  const learner = createSeededLearner(now)
  learner.displayName = "Assessment"
  learner.xpSinceAssessment = learner.assessmentThreshold
  const session = createActiveLearningSession(assessmentTask, now)

  await page.evaluate(async ({ learnerState, activeSession }) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(["learner", "session"], "readwrite")
      transaction.objectStore("learner").put(learnerState, "zh-zap1-math@1")
      transaction.objectStore("session").put(activeSession, "zh-zap1-math@1")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  }, { learnerState: learner, activeSession: session })

  await page.reload()
  await expect(page.getByRole("button", { name: "Standortbestimmung starten" })).toBeVisible()
}

async function waitForSubmittedAnswer(page: Page): Promise<void> {
  await page.waitForFunction(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const session = await new Promise<{ question?: { feedback?: string } } | undefined>((resolve, reject) => {
      const request = database.transaction("session", "readonly").objectStore("session").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return session?.question?.feedback === "wrong"
  })
}

async function waitForCompletion(page: Page): Promise<void> {
  await page.waitForFunction(async (taskId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction(["learner", "session"], "readonly")
    const learnerRequest = transaction.objectStore("learner").get("zh-zap1-math@1")
    const sessionRequest = transaction.objectStore("session").get("zh-zap1-math@1")
    const [learner, session] = await Promise.all([
      new Promise<{ completedTaskIds?: string[] } | undefined>((resolve, reject) => {
        learnerRequest.onsuccess = () => resolve(learnerRequest.result)
        learnerRequest.onerror = () => reject(learnerRequest.error)
      }),
      new Promise<unknown>((resolve, reject) => {
        sessionRequest.onsuccess = () => resolve(sessionRequest.result)
        sessionRequest.onerror = () => reject(sessionRequest.error)
      }),
    ])
    database.close()
    return !session && learner?.completedTaskIds?.includes(taskId)
  }, assessmentTask.id)
}

for (const assessmentCase of assessmentCases) {
test(`defers an assessment ${assessmentCase.label} until the final review, including after reload`, async ({ page }) => {
  await seedAssessment(page)
  await page.getByRole("button", { name: "Standortbestimmung starten" }).click()

  const answer = page.locator("#answer")
  await answer.fill(assessmentCase.answer)
  await page.getByRole("button", { name: "Antwort abgeben" }).click()

  await expect(answer).toBeDisabled()
  await expect(page.getByText("Falsch.", { exact: true })).toBeVisible()
  await expect(page.getByText(
    "Antwort gespeichert. Der Rückblick folgt nach dem Abschluss.",
    { exact: true },
  )).toBeVisible()
  await expect(page.getByRole("button", { name: "Antwort abgeben" })).toHaveCount(0)
  await expect(page.locator(".diagnostic-next-step")).toHaveCount(0)
  await expect(page.getByText("Richtige Antwort", { exact: true })).toHaveCount(0)
  await expect(page.getByText(assessmentQuestion.explanation, { exact: true })).toHaveCount(0)
  expect((await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze()).violations).toEqual([])

  await waitForSubmittedAnswer(page)
  await page.reload()

  await expect(page.locator("#answer")).toHaveValue(assessmentCase.answer)
  await expect(page.locator("#answer")).toBeDisabled()
  await expect(page.getByRole("button", { name: "Antwort abgeben" })).toHaveCount(0)
  await expect(page.getByText("Richtige Antwort", { exact: true })).toHaveCount(0)
  await expect(page.getByText(assessmentQuestion.explanation, { exact: true })).toHaveCount(0)

  await page.getByRole("button", { name: "Abschliessen" }).click()
  await expect(page.getByText("FEHLER-RÜCKBLICK", { exact: true })).toBeVisible()
  await expect(page.getByText("Richtige Antwort", { exact: true })).toBeVisible()
  await expect(page.getByText(assessmentQuestion.explanation, { exact: true })).toBeVisible()
  expect((await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze()).violations).toEqual([])
  await waitForCompletion(page)

  const outcome = await page.evaluate(async (taskId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learner = await new Promise<{
      learningEvents: Array<{
        taskId: string
        mistakes: number
        questionResults: Array<{
          attempts: number
          solved: boolean
          submittedAnswer?: string
          diagnostic?: {
            kind: string
            resolved: boolean
          }
        }>
      }>
      xpLedger: Array<{
        taskId: string
        taskKind: string
        reason: string
        totalXp: number
      }>
    }>((resolve, reject) => {
      const request = database.transaction("learner", "readonly").objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return {
      event: learner.learningEvents.find((candidate) => candidate.taskId === taskId),
      award: learner.xpLedger.find((candidate) => candidate.taskId === taskId),
    }
  }, assessmentTask.id)

  expect(outcome.event).toMatchObject({
    mistakes: 1,
    questionResults: [{
      attempts: 1,
      solved: false,
      submittedAnswer: assessmentCase.answer,
    }],
  })
  if ("diagnosticKind" in assessmentCase) {
    expect(outcome.event?.questionResults[0]?.diagnostic).toMatchObject({
      kind: assessmentCase.diagnosticKind,
      resolved: false,
    })
  }
  expect(outcome.award).toMatchObject({
    taskKind: "assessment",
    reason: "assessment-complete",
    totalXp: assessmentTask.maxXp,
  })
})
}
