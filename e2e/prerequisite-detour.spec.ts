import { expect, test, type Page } from "@playwright/test"
import { createSeededLearner } from "../src/domain/learningEngine"
import type { LearningTask } from "../src/domain/model"
import { createActiveLearningSession } from "../src/domain/session"

const sourceTask: LearningTask = {
  id: "review:data-tables:prerequisite-detour-e2e",
  kind: "review",
  title: "Daten aus Tabellen sicher verbinden",
  description: "Eine gespeicherte Aufgabe mit Voraussetzung.",
  topicIds: ["data-tables"],
  prerequisiteIds: ["arithmetic-equations"],
  maxXp: 4,
  questionCount: 1,
  seed: "review:data-tables:prerequisite-detour-e2e",
  contentLocale: "de",
  curriculum: {
    courseId: "zh-zap1-math",
    version: 1,
  },
}

async function seedSourceSession(page: Page): Promise<void> {
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
  const now = new Date("2026-07-23T10:00:00.000Z")
  const learner = createSeededLearner(now)
  learner.displayName = "Detour"
  const session = createActiveLearningSession(sourceTask, now)
  session.activeSeconds = 41
  session.question.answer = "123"
  session.question.submissions = 1
  session.question.mistakes = 1
  session.question.questionStartedAt = 11

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
  await expect(page.locator("#answer")).toHaveValue("123")
}

async function readStoredMathState(page: Page): Promise<{
  learner: {
    learningEvents: unknown[]
    xpLedger: unknown[]
    completedTaskIds: string[]
    mastery: unknown
  }
  session: {
    id: string
    activeSeconds: number
    question: {
      answer: string
      submissions: number
      mistakes: number
      activeHelp: string[]
    }
    prerequisiteDetour?: {
      origin: {
        id: string
        activeSeconds: number
        question: {
          answer: string
          submissions: number
          mistakes: number
          activeHelp: string[]
        }
      }
    }
  }
}> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction(["learner", "session"], "readonly")
    const learnerRequest = transaction.objectStore("learner").get("zh-zap1-math@1")
    const sessionRequest = transaction.objectStore("session").get("zh-zap1-math@1")
    const [learner, session] = await Promise.all([
      new Promise<unknown>((resolve, reject) => {
        learnerRequest.onsuccess = () => resolve(learnerRequest.result)
        learnerRequest.onerror = () => reject(learnerRequest.error)
      }),
      new Promise<unknown>((resolve, reject) => {
        sessionRequest.onsuccess = () => resolve(sessionRequest.result)
        sessionRequest.onerror = () => reject(sessionRequest.error)
      }),
    ])
    database.close()
    return { learner, session }
  })
}

async function openPrerequisiteDetour(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Voraussetzungen ansehen" }).click()
  await page.getByRole("button", { name: /Rechenketten/u }).click()
  await expect(page.getByText("KURZE AUFFRISCHUNG")).toBeVisible()
  await expect(page.getByText(/Deine Aufgabe und dein Stand bleiben gespeichert/u)).toBeVisible()
}

async function finishCurrentQuestionWithSolution(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Schritt für Schritt" }).click()
  await page.getByRole("button", { name: "Verstanden, mit Lösung weiter" }).click()
}

test("preserves and returns to the exact question across prerequisite help", async ({ page }) => {
  await seedSourceSession(page)
  const before = await readStoredMathState(page)

  await openPrerequisiteDetour(page)
  const storedDetour = await readStoredMathState(page)
  expect(storedDetour.session.prerequisiteDetour?.origin).toMatchObject({
    id: before.session.id,
    activeSeconds: before.session.activeSeconds,
    question: {
      answer: "123",
      submissions: 1,
      mistakes: 1,
      activeHelp: ["prerequisites"],
    },
  })

  await page.reload()
  await expect(page.getByText("KURZE AUFFRISCHUNG")).toBeVisible()
  await page.getByRole("button", { name: /Zurück zu meiner Aufgabe/u }).click()
  await expect(page.locator("#answer")).toHaveValue("123")
  await expect(page.locator("#answer")).toBeFocused()

  const afterCancel = await readStoredMathState(page)
  expect(afterCancel.session).toMatchObject({
    id: before.session.id,
    activeSeconds: before.session.activeSeconds,
    question: {
      answer: "123",
      submissions: 1,
      mistakes: 1,
      activeHelp: ["prerequisites"],
    },
  })
  expect(afterCancel.learner.learningEvents).toHaveLength(before.learner.learningEvents.length)
  expect(afterCancel.learner.xpLedger).toHaveLength(before.learner.xpLedger.length)
  expect(afterCancel.learner.completedTaskIds).toEqual(before.learner.completedTaskIds)
  expect(afterCancel.learner.mastery).toEqual(before.learner.mastery)

  await page.getByRole("button", { name: /Rechenketten/u }).click()
  await expect(page.getByText("KURZE AUFFRISCHUNG")).toBeVisible()
  await finishCurrentQuestionWithSolution(page)
  await finishCurrentQuestionWithSolution(page)

  await expect(page.getByRole("status")).toContainText("Auffrischung geschafft")
  await expect(page.locator("#answer")).toHaveValue("123")
  await expect(page.locator("#answer")).toBeFocused()
  const afterCompletion = await readStoredMathState(page)
  expect(afterCompletion.session).toMatchObject({
    id: before.session.id,
    activeSeconds: before.session.activeSeconds,
    question: {
      answer: "123",
      submissions: 1,
      mistakes: 1,
      activeHelp: ["prerequisites"],
    },
  })
  expect(afterCompletion.session.prerequisiteDetour).toBeUndefined()
  expect(afterCompletion.learner.learningEvents).toHaveLength(before.learner.learningEvents.length + 1)
  expect(afterCompletion.learner.xpLedger).toHaveLength(before.learner.xpLedger.length + 1)
  expect(afterCompletion.learner.completedTaskIds).toContain("repair:arithmetic-equations:0")
})
