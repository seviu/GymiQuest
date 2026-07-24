import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { createSeededLearner } from "../src/domain/learningEngine"
import {
  germanSessionQuestions,
  type GermanCourseState,
} from "../src/subjects/german/courseState"
import { buildGermanExamBlueprint } from "../src/subjects/german/exam"
import { germanPilotTopicIds } from "../src/subjects/german/package"
import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  type GermanGeneratedQuestion,
} from "../src/subjects/german/generators"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

async function createFoundationsLearner(page: Page): Promise<void> {
  await page.goto("/")
  await page.getByLabel("Dein Spitzname").fill("Mia")
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
}

async function readGermanCourse(page: Page): Promise<GermanCourseState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const state = await new Promise<GermanCourseState>((resolve, reject) => {
      const request = database.transaction("learner", "readonly")
        .objectStore("learner")
        .get("zh-zap1-german@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return state
  })
}

async function answerGeneratedGermanQuestion(
  page: Page,
  question: GermanGeneratedQuestion,
  correct: boolean,
  lessonMode = false,
): Promise<void> {
  if (isGermanChoiceQuestion(question)) {
    const option = correct
      ? question.options.find((candidate) => candidate.id === question.correctOptionId)!
      : question.options.find((candidate) => candidate.id !== question.correctOptionId)!
    const optionIndex = question.options.findIndex((candidate) => candidate.id === option.id)
    await page.locator(".german-answer-options button").nth(optionIndex).click()
    return
  }

  if (isGermanTruthGridQuestion(question)) {
    for (const [index, selection] of question.correctSelections.entries()) {
      const status = correct || index > 0
        ? selection.status
        : selection.status === "true" ? "false" : "true"
      await page.locator(
        `input[name="${question.id}:${selection.rowId}"][value="${status}"]`,
      ).check()
    }
    return
  }

  if (isGermanBinaryGridQuestion(question)) {
    for (const [index, selection] of question.correctSelections.entries()) {
      const status = correct || index > 0
        ? selection.status
        : selection.status === "true" ? "false" : "true"
      await page.locator(
        `input[name="${question.id}:${selection.rowId}"][value="${status}"]`,
      ).check()
    }
    return
  }

  if (isGermanAcceptedTextQuestion(question)) {
    await page.locator(".german-accepted-text textarea").fill(
      correct ? question.acceptedAnswers[0]!.text : "Eine absichtlich falsche Korrektur.",
    )
    if (lessonMode) {
      await page.getByRole("button", { name: "Antwort prüfen" }).click()
    }
    return
  }

  if (isGermanMultiSelectQuestion(question)) {
    const selectedOptionIds = correct
      ? [...question.correctOptionIds]
      : [
          question.correctOptionIds[0]!,
          question.options.find((option) => !question.correctOptionIds.includes(option.id))!.id,
        ]
    for (const optionId of selectedOptionIds) {
      const optionIndex = question.options.findIndex((option) => option.id === optionId)
      await page.locator('.german-multi-select input[type="checkbox"]').nth(optionIndex).check()
    }
    if (lessonMode) {
      await page.getByRole("button", { name: "Antwort prüfen" }).click()
    }
    return
  }

  const targets = question.correctMatches.map((match) => match.targetId)
  for (const [index, match] of question.correctMatches.entries()) {
    const targetId = correct ? match.targetId : targets[(index + 1) % targets.length]!
    await page.locator(".german-matching select").nth(index).selectOption(targetId)
  }
  if (lessonMode) {
    await page.getByRole("button", { name: "Antwort prüfen" }).click()
  }
}

test("keeps Mathematics and German isolated and resumes the paused German subject", async ({ page, context }) => {
  await createFoundationsLearner(page)

  await page.getByRole("button", { name: "Deutsch", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Willkommen im Deutschtraining, Mia." })).toBeVisible()
  await expect(page.getByText("Dein Mathematikstand bleibt unverändert.", { exact: false })).toBeVisible()
  await page.getByRole("button", { name: "Deutsch-Start-Check beginnen" }).click()

  for (let question = 1; question <= 5; question += 1) {
    await expect(page.getByText(`Aufgabe ${question} von 5`)).toBeVisible()
    await page.locator(".german-answer-options button").first().click()
    await page.getByRole("button", { name: "Antwort speichern" }).click()
  }

  await expect(page.getByRole("heading", { name: "Dein Deutsch-Lernplan" })).toBeVisible()
  await expect(page.locator(".german-stat-card.primary")).toContainText("Deutsch-XP")
  await expect(page.locator(".german-stat-card.primary")).toContainText("0")
  await expect(page.getByText("5 von 5 Antworten waren bereits sicher.")).toBeVisible()

  await page.locator(".german-task-card").first().getByRole("button", { name: "Starten" }).click()
  await expect(page.getByRole("heading", { name: "Nicht raten: zur Aussage zurück in den Text" })).toBeVisible()
  await page.getByRole("button", { name: "Mit neuen Aufgaben üben" }).click()
  await expect(page.locator(".german-passage")).toBeVisible()
  await expect(page.getByText("Aufgabe 1 von 5")).toBeVisible()
  const reportPagePromise = context.waitForEvent("page")
  await page.getByRole("link", { name: /Fehler in dieser Aufgabe melden/u }).click()
  const reportPage = await reportPagePromise
  await expect(reportPage).toHaveURL(/\/exercise-report\?data=/u)
  await expect(reportPage.getByRole("heading", { name: "Was stimmt an dieser Aufgabe nicht?" })).toBeVisible()
  await expect(reportPage.getByText("zh-zap1-german@1")).toBeVisible()
  await expect(reportPage.getByText("keinen Namen, keine eingegebene Antwort und keinen Lernverlauf")).toBeVisible()
  await reportPage.close()
  await page.getByRole("button", { name: /Zum Deutsch-Lernplan/u }).click()

  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeVisible()
  await page.getByRole("button", { name: "Mathematik", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()

  await page.reload()
  await expect(page.getByRole("heading", { name: "Dein Deutsch-Lernplan" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Fortsetzen" })).toBeVisible()

  const stored = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction(["learner", "courseIndex"], "readonly")
    const read = (store: IDBObjectStore, key: string) => new Promise<unknown>((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learnerStore = transaction.objectStore("learner")
    const [math, german, index] = await Promise.all([
      read(learnerStore, "zh-zap1-math@1"),
      read(learnerStore, "zh-zap1-german@1"),
      read(transaction.objectStore("courseIndex"), "current"),
    ])
    database.close()
    return { math, german, index }
  })
  expect(stored.math).toBeTruthy()
  expect(stored.german).toMatchObject({ subjectId: "german", totalXp: 0, activeSession: expect.any(Object) })
  expect(stored.index).toMatchObject({ activeCourseKey: "zh-zap1-german@1" })

  expect(await page.locator(".german-home-shell").evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)
  const audit = await new AxeBuilder({ page })
    .include(".german-home-shell")
    .withTags(wcagTags)
    .analyze()
  expect(audit.violations, JSON.stringify(audit.violations, null, 2)).toEqual([])
})

test("completes the human-reviewed German short-response loop at iPad width", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "webkit-ipad", "This is the portrait iPad interaction check.")
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 1024, height: 1366 })
  await createFoundationsLearner(page)
  await page.getByRole("button", { name: "Deutsch", exact: true }).click()
  await page.getByRole("button", { name: "Deutsch-Start-Check beginnen" }).click()
  for (let question = 1; question <= 5; question += 1) {
    await page.locator(".german-answer-options button").first().click()
    await page.getByRole("button", { name: "Antwort speichern" }).click()
  }

  const initialCourse = await readGermanCourse(page)
  await page.getByRole("button", { name: "Kurzantwort beginnen" }).click()
  await expect(page.locator(".german-comprehension-topbar strong")).toHaveText("Erkläre den Zusammenhang mit einem Textbeleg")
  await expect(page.getByText("Keine Punkte, keine Note, kein XP und keine Lernstandsänderung").first()).toBeVisible()
  await page.locator('.german-comprehension-line-options input[type="checkbox"]').first().check()
  const response = "Die Antwort erklärt den Zusammenhang in einem vollständigen Satz und stützt ihn mit der markierten Textzeile."
  await page.locator("#german-comprehension-answer").fill(response)
  await expect.poll(async () => (await readGermanCourse(page)).activeComprehension?.response).toBe(response)

  const reportPagePromise = context.waitForEvent("page")
  await page.getByRole("link", { name: /Fehler in dieser Aufgabe melden/u }).click()
  const reportPage = await reportPagePromise
  await expect(reportPage).toHaveURL(/\/exercise-report\?data=/u)
  await expect(reportPage.getByText("Einen Textbeleg selbst formulieren")).toBeVisible()
  await expect(reportPage.getByText(response)).toHaveCount(0)
  await reportPage.close()

  await page.reload()
  await expect(page.locator("#german-comprehension-answer")).toHaveValue(response)
  expect(await page.locator(".german-comprehension-shell").evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  )).toBeLessThanOrEqual(0)
  const learnerAudit = await new AxeBuilder({ page })
    .include(".german-comprehension-shell")
    .withTags(wcagTags)
    .analyze()
  expect(learnerAudit.violations, JSON.stringify(learnerAudit.violations, null, 2)).toEqual([])

  await page.getByRole("button", { name: "Zur Rückmeldung abgeben" }).click()
  await expect(page.getByRole("heading", { name: "Deine Antwort wartet auf Rückmeldung" })).toBeVisible()
  const submittedCourse = await readGermanCourse(page)
  expect(submittedCourse.totalXp).toBe(initialCourse.totalXp)
  expect(submittedCourse.xpSinceAssessment).toBe(initialCourse.xpSinceAssessment)
  expect(submittedCourse.topicProgress).toEqual(initialCourse.topicProgress)
  expect(submittedCourse.comprehensionHistory).toHaveLength(1)
  expect(submittedCourse.activeComprehension).toBeUndefined()
  expect(JSON.stringify(submittedCourse.comprehensionHistory[0])).not.toContain('"points"')

  await page.getByRole("button", { name: "Begleitansicht", exact: true }).click()
  await page.locator("#parent-pin").fill("4826")
  await page.locator("#parent-pin-confirmation").fill("4826")
  await page.getByRole("button", { name: "PIN speichern und öffnen" }).click()
  const reviewCard = page.locator(".german-comprehension-review-item")
  await expect(reviewCard).toBeVisible()
  await expect(reviewCard).toHaveClass(/pending/u)
  await expect(reviewCard.getByText(response)).toBeVisible()
  await expect(reviewCard.getByText("Autorenhinweise für die Prüfung")).toBeVisible()
  await reviewCard.getByLabel("Gut mit dem Text belegt").check()
  await reviewCard.locator("textarea").nth(0).fill("Der Zusammenhang ist klar und mit einer passenden Textstelle verbunden.")
  await reviewCard.locator("textarea").nth(1).fill("Beim nächsten Mal die Belegzeile noch genauer im Satz nennen.")
  await reviewCard.getByRole("button", { name: "Rückmeldung speichern" }).click()
  await expect(reviewCard).toHaveClass(/reviewed/u)
  expect(await page.locator(".german-comprehension-review-panel").evaluate(
    (element) => element.scrollWidth - element.clientWidth,
  )).toBeLessThanOrEqual(0)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Rückmeldung zu deiner Kurzantwort" })).toBeVisible()
  await expect(page.getByText("Gut mit dem Text belegt")).toBeVisible()
  await page.getByRole("button", { name: "Rückmeldung besprochen" }).click()
  await expect(page.getByRole("heading", { name: "Rückmeldung zu deiner Kurzantwort" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Kurzantwort beginnen" })).toBeEnabled()

  const completedCourse = await readGermanCourse(page)
  expect(completedCourse.comprehensionReviews[0]?.resolvedAt).toBeTruthy()
  expect(completedCourse.totalXp).toBe(initialCourse.totalXp)
  expect(completedCourse.xpSinceAssessment).toBe(initialCourse.xpSinceAssessment)
  expect(completedCourse.topicProgress).toEqual(initialCourse.topicProgress)
})

test("resets only the selected subject while preserving profile and the other course", async ({ page }) => {
  await createFoundationsLearner(page)
  await page.getByRole("button", { name: "Deutsch", exact: true }).click()
  await page.getByRole("button", { name: "Deutsch-Start-Check beginnen" }).click()
  for (let question = 1; question <= 5; question += 1) {
    await page.locator(".german-answer-options button").first().click()
    await page.getByRole("button", { name: "Antwort speichern" }).click()
  }

  await page.getByRole("button", { name: "Profil und Einstellungen" }).click()
  await page.getByRole("button", { name: "Deutsch-Lernstand zurücksetzen" }).click()
  await expect(page.getByRole("alert")).toContainText("Mathematik, Profil, Begleitpersonen-PIN")
  await page.getByRole("button", { name: "Deutsch zurücksetzen" }).click()
  await expect(page.getByRole("heading", { name: "Willkommen im Deutschtraining, Mia." })).toBeVisible()

  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction("learner", "readwrite")
    const store = transaction.objectStore("learner")
    const german = await new Promise<GermanCourseState>((resolve, reject) => {
      const request = store.get("zh-zap1-german@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    german.totalXp = 42
    store.put(german, "zh-zap1-german@1")
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  })

  await page.getByRole("button", { name: "Mathematik", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await page.getByRole("button", { name: "Plan anpassen" }).click()
  await page.getByRole("button", { name: "Mathematik-Lernstand zurücksetzen" }).click()
  await expect(page.getByRole("alert")).toContainText("Deutsch-Lernstand, Profil, Begleitpersonen-PIN")
  await page.getByRole("button", { name: "Mathematik zurücksetzen" }).click()
  await expect(page.getByRole("heading", { name: "Wir finden deinen besten Startpunkt." })).toBeVisible()

  const records = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction(["learner", "courseIndex"], "readonly")
    const read = (store: IDBObjectStore, key: string) => new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learnerStore = transaction.objectStore("learner")
    const [math, german, index] = await Promise.all([
      read(learnerStore, "zh-zap1-math@1"),
      read(learnerStore, "zh-zap1-german@1"),
      read(transaction.objectStore("courseIndex"), "current"),
    ])
    database.close()
    return { math, german, index }
  })
  expect(records.math.profileCompletedAt).toBeTruthy()
  expect(records.math.placementCompletedAt).toBeUndefined()
  expect(records.german).toMatchObject({ subjectId: "german", totalXp: 42 })
  expect(records.index).toMatchObject({ activeCourseKey: "zh-zap1-math@1" })
})

test("copies a version-7 learner to the stable Mathematics key without deleting the legacy record", async ({ page }) => {
  const learner = createSeededLearner(new Date("2026-07-16T10:00:00.000Z"))
  learner.displayName = "Migrationstest"

  await page.goto("/datenschutz.html")
  await page.evaluate(async (legacyLearner) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("gymiquest")
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error("Legacy database deletion was blocked."))
    })
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 7)
      request.onupgradeneeded = () => {
        const database = request.result
        for (const storeName of [
          "learner",
          "session",
          "mockExam",
          "archivePractice",
          "parentAccess",
          "releaseReadiness",
          "archiveDocument",
        ]) {
          database.createObjectStore(storeName)
        }
        request.transaction!.objectStore("learner").put(legacyLearner, "current")
      }
      request.onsuccess = () => {
        request.result.close()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }, learner)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()

  const records = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction(["learner", "courseIndex"], "readonly")
    const read = (store: IDBObjectStore, key: string) => new Promise<unknown>((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learnerStore = transaction.objectStore("learner")
    const [legacy, stable, index] = await Promise.all([
      read(learnerStore, "current"),
      read(learnerStore, "zh-zap1-math@1"),
      read(transaction.objectStore("courseIndex"), "current"),
    ])
    database.close()
    return { legacy, stable, index }
  })

  expect(records.legacy).toEqual(learner)
  expect(records.stable).toEqual(learner)
  expect(records.index).toMatchObject({
    schemaVersion: 1,
    activeCourseKey: "zh-zap1-math@1",
    courseKeys: ["zh-zap1-math@1"],
  })
})

test("runs a mixed German assessment and schedules reviews only for missed German skills", async ({ page }) => {
  await createFoundationsLearner(page)
  await page.getByRole("button", { name: "Deutsch", exact: true }).click()
  await page.getByRole("button", { name: "Deutsch-Start-Check beginnen" }).click()
  for (let question = 1; question <= 5; question += 1) {
    await page.locator(".german-answer-options button").first().click()
    await page.getByRole("button", { name: "Antwort speichern" }).click()
  }

  await page.evaluate(async (topicIds) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const transaction = database.transaction("learner", "readwrite")
    const store = transaction.objectStore("learner")
    const state = await new Promise<GermanCourseState>((resolve, reject) => {
      const request = store.get("zh-zap1-german@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    for (const topicId of topicIds) {
      state.topicProgress[topicId] = {
        ...state.topicProgress[topicId],
        status: "mastered",
        completedAt: "2026-07-17T12:00:00.000Z",
        reviewDueAt: "2026-08-17T12:00:00.000Z",
      }
    }
    state.totalXp = 120
    state.xpSinceAssessment = 120
    state.activeSession = undefined
    store.put(state, "zh-zap1-german@1")
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  }, [...germanPilotTopicIds])

  await page.reload()
  await expect(page.getByRole("heading", { name: "Dein Deutsch-Lernplan" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Deutsch-Standortbestimmung 1" })).toBeVisible()
  await page.locator(".german-task-card").getByRole("button", { name: "Starten" }).click()

  for (let index = 0; index < 5; index += 1) {
    const state = await readGermanCourse(page)
    if (!state.activeSession) throw new Error("Missing persisted German assessment session")
    const question = germanSessionQuestions(state.activeSession)[state.activeSession.questionIndex]!
    await answerGeneratedGermanQuestion(page, question, index >= 2, true)
    await page.getByRole("button", { name: "Weiter" }).click()
  }

  await expect(page.getByText(/3 von 5 Aufgaben sicher/u)).toBeVisible()
  await expect(page.locator(".german-task-card")).toHaveCount(2)
  await expect(page.locator(".german-task-card").first()).toContainText("Review")
  const state = await readGermanCourse(page)
  expect(state).toMatchObject({ totalXp: 130, xpSinceAssessment: 0 })
  expect(state.assessmentHistory).toHaveLength(1)
  expect(state.assessmentHistory[0]).toMatchObject({ correct: 3, total: 5, assessmentNumber: 1 })
  expect(state.xpLedger.at(-1)).toMatchObject({ kind: "assessment", totalXp: 10, mistakes: 2 })
})

test("persists, reports, and grades a strict German language-exam simulation without XP", async ({ page, context }) => {
  await createFoundationsLearner(page)
  await page.getByRole("button", { name: "Deutsch", exact: true }).click()
  await page.getByRole("button", { name: "Deutsch-Start-Check beginnen" }).click()
  for (let question = 1; question <= 5; question += 1) {
    await page.locator(".german-answer-options button").first().click()
    await page.getByRole("button", { name: "Antwort speichern" }).click()
  }

  const xpBefore = (await readGermanCourse(page)).totalXp
  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  await expect(page.getByRole("heading", { name: "45 Minuten wie in der Sprachprüfung" })).toBeVisible()
  await expect(page.getByText("keine XP und keine offizielle Note", { exact: false })).toBeVisible()
  await page.getByRole("button", { name: "45-Minuten-Simulation starten" }).click()

  await expect(page.getByRole("heading", { name: "Aufgabe 1 von 15" })).toBeVisible()
  await expect(page.locator(".german-exam-passage")).toBeVisible()
  await expect(page.locator(".german-exam-navigation button")).toHaveCount(15)
  await expect(page.locator(".german-exam-timer")).toContainText(/44:5[0-9]|45:00/u)

  const active = await readGermanCourse(page)
  if (!active.activeExam) throw new Error("Missing active German language exam")
  const blueprint = buildGermanExamBlueprint(active.activeExam.seed)
  const firstQuestion = blueprint.questions[0]!
  if (!isGermanTruthGridQuestion(firstQuestion)) throw new Error("First passage question must be a truth grid")
  await expect(page.locator(".german-truth-grid-row")).toHaveCount(7)
  await expect(page.locator('.german-truth-grid input[type="radio"]')).toHaveCount(21)
  const truthGridAudit = await new AxeBuilder({ page })
    .include(".german-exam-question-card")
    .withTags(wcagTags)
    .analyze()
  expect(truthGridAudit.violations, JSON.stringify(truthGridAudit.violations, null, 2)).toEqual([])
  await answerGeneratedGermanQuestion(page, firstQuestion, false)
  await page.getByRole("button", { name: "Zum Prüfen markieren" }).click()

  const reportPagePromise = context.waitForEvent("page")
  await page.getByRole("link", { name: /Fehler in dieser Aufgabe melden/u }).click()
  const reportPage = await reportPagePromise
  await expect(reportPage).toHaveURL(/\/exercise-report\?data=/u)
  await expect(reportPage.getByText("Deutsch-Sprachprüfung trainieren")).toBeVisible()
  await expect(reportPage.getByText("zh-zap1-german@1")).toBeVisible()
  await reportPage.close()

  await page.getByRole("button", { name: "Weiter →", exact: true }).click()
  await page.getByRole("button", { name: "Pausieren und zum Lernplan" }).click()
  await expect(page.getByRole("button", { name: "Sprachprüfung fortsetzen" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("heading", { name: "Dein Deutsch-Lernplan" })).toBeVisible()
  await page.getByRole("button", { name: "Sprachprüfung fortsetzen" }).click()
  await expect(page.getByRole("heading", { name: "Aufgabe 2 von 15" })).toBeVisible()
  await expect(page.locator(".german-exam-navigation button").first()).toHaveClass(/answered/u)
  await expect(page.locator(".german-exam-navigation button").first()).toHaveClass(/flagged/u)

  let matchingAudited = false
  let sentenceAnalysisAudited = false
  let acceptedTextAudited = false
  let multiSelectAudited = false
  let binaryGridAudited = false
  for (let index = 1; index < blueprint.questions.length; index += 1) {
    const question = blueprint.questions[index]!
    if (
      isGermanMatchingQuestion(question) &&
      question.matchingScoring === undefined &&
      !matchingAudited
    ) {
      await expect(page.locator(".german-matching select")).toHaveCount(question.items.length)
      const matchingAudit = await new AxeBuilder({ page })
        .include(".german-exam-question-card")
        .withTags(wcagTags)
        .analyze()
      expect(matchingAudit.violations, JSON.stringify(matchingAudit.violations, null, 2)).toEqual([])
      matchingAudited = true
    }
    if (
      isGermanMatchingQuestion(question) &&
      question.matchingScoring === "sentence-analysis-deduction-2025" &&
      !sentenceAnalysisAudited
    ) {
      await expect(page.locator(".german-matching select")).toHaveCount(4)
      const sentenceAnalysisAudit = await new AxeBuilder({ page })
        .include(".german-exam-question-card")
        .withTags(wcagTags)
        .analyze()
      expect(
        sentenceAnalysisAudit.violations,
        JSON.stringify(sentenceAnalysisAudit.violations, null, 2),
      ).toEqual([])
      sentenceAnalysisAudited = true
    }
    if (isGermanAcceptedTextQuestion(question) && !acceptedTextAudited) {
      await expect(page.locator(".german-accepted-text textarea")).toHaveCount(1)
      const acceptedTextAudit = await new AxeBuilder({ page })
        .include(".german-exam-question-card")
        .withTags(wcagTags)
        .analyze()
      expect(acceptedTextAudit.violations, JSON.stringify(acceptedTextAudit.violations, null, 2)).toEqual([])
      acceptedTextAudited = true
    }
    if (isGermanMultiSelectQuestion(question) && !multiSelectAudited) {
      await expect(page.locator('.german-multi-select input[type="checkbox"]')).toHaveCount(4)
      const multiSelectAudit = await new AxeBuilder({ page })
        .include(".german-exam-question-card")
        .withTags(wcagTags)
        .analyze()
      expect(multiSelectAudit.violations, JSON.stringify(multiSelectAudit.violations, null, 2)).toEqual([])
      multiSelectAudited = true
    }
    if (isGermanBinaryGridQuestion(question) && !binaryGridAudited) {
      await expect(page.locator(".german-binary-grid .german-truth-grid-row")).toHaveCount(6)
      await expect(page.locator('.german-binary-grid input[type="radio"]')).toHaveCount(12)
      const binaryGridAudit = await new AxeBuilder({ page })
        .include(".german-exam-question-card")
        .withTags(wcagTags)
        .analyze()
      expect(binaryGridAudit.violations, JSON.stringify(binaryGridAudit.violations, null, 2)).toEqual([])
      binaryGridAudited = true
    }
    await answerGeneratedGermanQuestion(page, question, true)
    if (index < blueprint.questions.length - 1) {
      await page.getByRole("button", { name: "Weiter →", exact: true }).click()
    }
  }
  expect(matchingAudited).toBe(true)
  expect(sentenceAnalysisAudited).toBe(true)
  expect(acceptedTextAudited).toBe(true)
  expect(multiSelectAudited).toBe(true)
  expect(binaryGridAudited).toBe(true)
  await page.getByRole("button", { name: "Prüfung abgeben" }).click()
  await expect(page.getByRole("alert")).toContainText("Alle Aufgaben sind beantwortet")
  await page.getByRole("button", { name: "Endgültig abgeben" }).click()

  await expect(page.getByText("19 von 20 Punkten")).toBeVisible()
  await expect(page.locator(".german-exam-result-card")).toContainText("Prüfungspunkte sind keine XP")
  await expect(page.locator(".german-exam-review-list > article")).toHaveCount(1)
  await expect(page.locator(".german-review-answer-legend")).toContainText("Deine Antwort")
  await expect(page.locator(".german-review-answer-legend")).toContainText("Richtige Antwort")
  await expect(page.locator(".german-review-explanation")).toBeVisible()
  const completed = await readGermanCourse(page)
  expect(completed.activeExam).toBeUndefined()
  expect(completed.examHistory).toHaveLength(1)
  expect(completed.examHistory[0]).toMatchObject({
    correctPoints: 19,
    maxPoints: 20,
    submissionReason: "submitted",
  })
  expect(completed.totalXp).toBe(xpBefore)
  expect(completed.xpLedger).toEqual([])
  expect(completed.topicProgress[firstQuestion.topicId].reviewDueAt).toBeTruthy()

  const reviewAudit = await new AxeBuilder({ page })
    .include(".german-exam-review-shell")
    .withTags(wcagTags)
    .analyze()
  expect(reviewAudit.violations, JSON.stringify(reviewAudit.violations, null, 2)).toEqual([])

  await page.getByRole("button", { name: /Zurück/u }).click()
  await expect(page.locator(".german-home-shell")).toBeVisible()
  const homeAudit = await new AxeBuilder({ page })
    .include(".german-home-shell")
    .withTags(wcagTags)
    .analyze()
  expect(homeAudit.violations, JSON.stringify(homeAudit.violations, null, 2)).toEqual([])
})
