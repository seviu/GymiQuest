import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { generateQuestionsForTask } from "../src/domain/generators"
import { buildAssignments, createSeededLearner } from "../src/domain/learningEngine"
import type { LearnerState, LearningTask } from "../src/domain/model"
import { createActiveLearningSession } from "../src/domain/session"

const lessonTask: LearningTask = {
  id: "lesson:mass-units:format-retry-e2e",
  kind: "lesson",
  title: "kg und g sicher umrechnen",
  description: "Eingabeformat und mathematische Idee getrennt behandeln.",
  topicIds: ["mass-units"],
  prerequisiteIds: [],
  maxXp: 25,
  questionCount: 1,
  seed: "lesson:mass-units:format-retry-e2e",
  contentLocale: "de",
  curriculum: {
    courseId: "zh-zap1-math",
    version: 1,
  },
}

const lessonQuestion = generateQuestionsForTask(lessonTask)[0]!
if (lessonQuestion.response.kind !== "number") {
  throw new Error("The format-retry regression requires a numeric question.")
}
const correctAnswer = String(lessonQuestion.response.value).replace(".", ",")
const formatAnswer = `${correctAnswer} ${lessonQuestion.response.unit ?? "kg"}`

async function openSeededLesson(page: Page): Promise<void> {
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

  const now = new Date("2026-07-23T19:00:00.000Z")
  const learner = createSeededLearner(now)
  learner.displayName = "Format"
  const session = createActiveLearningSession(lessonTask, now)
  session.phase = "questions"

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
  await expect(page.locator("#answer")).toBeVisible()
}

async function readActiveQuestion(page: Page): Promise<{
  answer: string
  submissions: number
  mistakes: number
  feedback: string | null
  firstDiagnostic?: unknown
}> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const session = await new Promise<{ question: {
      answer: string
      submissions: number
      mistakes: number
      feedback: string | null
      firstDiagnostic?: unknown
    } }>((resolve, reject) => {
      const request = database.transaction("session", "readonly").objectStore("session").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return session.question
  })
}

async function waitForCompletion(page: Page): Promise<void> {
  await page.waitForFunction(async (taskId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learner = await new Promise<{ completedTaskIds?: string[] } | undefined>((resolve, reject) => {
      const request = database.transaction("learner", "readonly").objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return learner?.completedTaskIds?.includes(taskId)
  }, lessonTask.id)
}

async function readLearner(page: Page): Promise<LearnerState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learner = await new Promise<LearnerState>((resolve, reject) => {
      const request = database.transaction("learner", "readonly").objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return learner
  })
}

test("keeps a corrected input-format slip out of lesson grading and recovery", async ({ page }) => {
  await openSeededLesson(page)

  const answer = page.locator("#answer")
  await answer.fill(formatAnswer)
  await page.getByRole("button", { name: "Prüfen" }).click()

  await expect(page.locator(".feedback.format")).toBeVisible()
  await expect(page.getByRole("button", { name: "Prüfen" })).toBeVisible()
  await expect(page.locator(".format-retry-note")).toHaveText("Das zählt nicht als Fehler.")
  await expect(answer).toHaveAttribute("aria-invalid", "true")
  await expect.poll(() => readActiveQuestion(page)).toMatchObject({
    answer: formatAnswer,
    submissions: 0,
    mistakes: 0,
    feedback: "wrong",
  })
  expect((await readActiveQuestion(page)).firstDiagnostic).toBeUndefined()
  expect((await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze()).violations).toEqual([])

  await page.reload()
  await expect(answer).toHaveValue(formatAnswer)
  await expect(page.locator(".feedback.format")).toBeVisible()
  await expect(page.getByRole("button", { name: "Prüfen" })).toBeVisible()

  await answer.fill(correctAnswer)
  await page.getByRole("button", { name: "Prüfen" }).click()
  await expect(page.getByText("Richtig.", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Prüfen" })).toHaveCount(0)
  await page.getByRole("button", { name: "Abschliessen" }).click()
  await waitForCompletion(page)

  await page.setViewportSize({ width: 320, height: 800 })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.locator(".completion-card h1")).toBeFocused()
  const backToPlan = page.getByRole("button", { name: "Zurück zum Lernplan" })
  await expect(backToPlan).toBeVisible()
  expect(await backToPlan.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(800)

  const evidenceDisclosure = page.locator(".completion-evidence-disclosure")
  await expect(evidenceDisclosure).not.toHaveAttribute("open", "")
  await evidenceDisclosure.locator(":scope > summary").focus()
  await page.keyboard.press("Enter")
  await expect(evidenceDisclosure).toHaveAttribute("open", "")
  await page.keyboard.press("Enter")
  await expect(evidenceDisclosure).not.toHaveAttribute("open", "")

  const feedbackDisclosure = page.locator(".completion-feedback-disclosure")
  await expect(feedbackDisclosure).not.toHaveAttribute("open", "")
  await feedbackDisclosure.locator(":scope > summary").focus()
  await page.keyboard.press("Enter")
  await expect(feedbackDisclosure).toHaveAttribute("open", "")
  await expect(page.getByRole("button", { name: /Die Idee ist klar/u })).toBeVisible()
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(0)
  expect((await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze()).violations).toEqual([])

  const learner = await readLearner(page)
  const event = learner.learningEvents.find((candidate) => candidate.taskId === lessonTask.id)
  const award = learner.xpLedger.find((candidate) => candidate.taskId === lessonTask.id)
  if (!event) throw new Error("Missing completed format-retry event.")
  expect(event).toMatchObject({
    mistakes: 0,
    independentlyCompleted: true,
    questionResults: [{
      attempts: 1,
      independentlySolved: true,
      solved: true,
    }],
  })
  expect(event?.questionResults[0]?.diagnostic).toBeUndefined()
  expect(award).toMatchObject({
    totalXp: 33,
    reason: "lesson-flawless",
  })
  expect(learner.mastery["mass-units"].status).toBe("mastered")
  expect(buildAssignments(learner, new Date(event.completedAt)).some(
    (assignment) => assignment.purpose === "lesson-recovery" &&
      assignment.topicIds.includes("mass-units"),
  )).toBe(false)
})
