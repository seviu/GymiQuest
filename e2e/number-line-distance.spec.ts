import { expect, test } from "@playwright/test"
import { createSeededLearner } from "../src/domain/learningEngine"
import type { LearningTask } from "../src/domain/model"
import { createActiveLearningSession } from "../src/domain/session"

const reportedTask: LearningTask = {
  id: "lesson:fraction-of-quantity",
  kind: "lesson",
  title: "Den Bruchteil einer Menge bestimmen",
  description: "Einen Bruch wie 3/4 von einer gegebenen Menge berechnen.",
  topicIds: ["fraction-of-quantity"],
  prerequisiteIds: [],
  maxXp: 25,
  questionCount: 3,
  seed: "lesson:local-learner:fraction-of-quantity",
  curriculum: { courseId: "zh-zap1-math", version: 1 },
  generation: {
    version: 6,
    difficultyBands: ["foundation", "foundation", "standard"],
  },
  contentLocale: "de",
}

test("pins the reported fraction-distance points to ruler notches and explains 4/8", async ({ page }) => {
  const learner = createSeededLearner(new Date("2026-08-02T10:00:00.000Z"))
  const session = createActiveLearningSession(reportedTask, new Date("2026-08-02T10:00:00.000Z"))
  session.phase = "questions"
  session.question.questionIndex = 2

  await page.goto("/")
  await expect(page.getByLabel("Dein Spitzname")).toBeVisible()
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

  const numberLine = page.locator(".fraction-number-line-question")
  await expect(numberLine).toBeVisible()
  await expect(page.getByRole("heading", { name: "Auf einer Zahlengeraden liegen die Punkte A = 7/8 und B = 11/8. Wie gross ist ihr Abstand als vollständig gekürzter Bruch?" })).toBeVisible()
  await expect(numberLine.locator(".fraction-number-line-track > i")).toHaveCount(17)
  await expect(numberLine.locator(".fraction-number-line-track > i.whole")).toHaveCount(3)
  await expect(numberLine.locator(".point-value.a")).toHaveText("7/8")
  await expect(numberLine.locator(".point-value.b")).toHaveText("11/8")
  await expect(numberLine).not.toContainText("A - B = ?")

  const alignment = await numberLine.locator(".fraction-number-line-track").evaluate((track) => {
    const centre = (selector: string) => {
      const box = track.querySelector(selector)?.getBoundingClientRect()
      if (!box) throw new Error(`Missing ${selector}`)
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    }
    return {
      a: centre('[data-number-line-point="A"]'),
      aTick: centre('[data-number-line-value="0.875"]'),
      b: centre('[data-number-line-point="B"]'),
      bTick: centre('[data-number-line-value="1.375"]'),
    }
  })
  expect(Math.abs(alignment.a.x - alignment.aTick.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(alignment.b.x - alignment.bTick.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(alignment.a.y - alignment.b.y)).toBeLessThanOrEqual(1)

  await page.getByLabel("Abstand").fill("4/8")
  await page.getByRole("button", { name: "Prüfen" }).click()
  await expect(page.getByText("4/8 ist genau der richtige Abstand zwischen A und B, aber noch nicht vollständig gekürzt. Vollständig gekürzt bedeutet: Zähler und Nenner haben keinen gemeinsamen Teiler mehr ausser 1.")).toBeVisible()
  await expect(page.getByText("Teile beide durch 4: 4 : 4 = 1 und 8 : 4 = 2. Schreibe 1/2.")).toBeVisible()
})
