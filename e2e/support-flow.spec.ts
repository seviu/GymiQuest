import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

function futureZurichDate(): string {
  const future = new Date()
  future.setUTCFullYear(future.getUTCFullYear() + 1)
  return future.toISOString().slice(0, 10)
}

async function createFoundationsLearner(page: Page, name: string): Promise<void> {
  await page.goto("/")
  await page.getByLabel("Dein Spitzname").fill(name)
  await page.getByLabel("Datum der Aufnahmeprüfung").fill(futureZurichDate())
  await page.getByRole("button", { name: "Lernrhythmus wählen" }).click()
  await page.getByRole("button", { name: "Profil speichern und starten" }).click()
  await page.getByRole("button", { name: "Bei den Grundlagen starten" }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
}

async function readLearningPersistence(page: Page): Promise<{
  learner: string
  activeSessionCount: number
}> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learner = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction("learner", "readonly").objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const activeSessionCount = await new Promise<number>((resolve, reject) => {
      const request = database.transaction("session", "readonly").objectStore("session").count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return { learner: JSON.stringify(learner), activeSessionCount }
  })
}

async function seedComparableMockTrend(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learner = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const transaction = database.transaction("learner", "readonly")
      const request = transaction.objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result as Record<string, unknown>)
      request.onerror = () => reject(request.error)
    })
    const result = (
      id: string,
      submittedAt: string,
      certainPoints: number,
      reviewablePoints: number,
    ) => ({
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
    })
    learner.mockHistory = [
      result("browser:first", "2026-07-10T12:00:00.000Z", 12, 6),
      result("browser:latest", "2026-07-12T12:00:00.000Z", 22, 2),
    ]
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("learner", "readwrite")
      transaction.objectStore("learner").put(learner, "zh-zap1-math@1")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("archiveDocument", "readwrite")
      transaction.objectStore("archiveDocument").put({
        id: "zap-zh-lg-2024:tasks",
        editionId: "zap-zh-lg-2024",
        kind: "tasks",
        filename: "2024_mathematik_aufgaben_lg.pdf",
        mimeType: "application/pdf",
        size: 9,
        sha256: "fff33d36cacf17e207eb50d924fa6b01911ec504d28c266787f9fad6ebf73566",
        importedAt: "2026-07-15T12:00:00.000Z",
        blob: new TextEncoder().encode("%PDF-test"),
      }, "zap-zh-lg-2024:tasks")
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  })
  await page.reload()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
}

interface OfficialArchiveSeedRecord {
  id: string
  editionId: string
  kind: "tasks" | "solutions"
  filename: string
  sha256: string
}

async function seedOfficialArchive(
  page: Page,
  records: readonly OfficialArchiveSeedRecord[],
): Promise<void> {
  await page.evaluate(async (recordsToSeed) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("archiveDocument", "readwrite")
      for (const record of recordsToSeed) {
        transaction.objectStore("archiveDocument").put({
          ...record,
          mimeType: "application/pdf",
          size: 9,
          importedAt: "2026-07-15T12:00:00.000Z",
          blob: new TextEncoder().encode("%PDF-test"),
        }, record.id)
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
    database.close()
  }, records)
  await page.reload()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
}

async function seedOfficial2024Archive(page: Page): Promise<void> {
  await seedOfficialArchive(page, [
    {
      id: "zap-zh-lg-2024:tasks",
      editionId: "zap-zh-lg-2024",
      kind: "tasks",
      filename: "2024_mathematik_aufgaben_lg.pdf",
      sha256: "fff33d36cacf17e207eb50d924fa6b01911ec504d28c266787f9fad6ebf73566",
    },
    {
      id: "zap-zh-lg-2024:solutions",
      editionId: "zap-zh-lg-2024",
      kind: "solutions",
      filename: "2024_mathematik_loesungen_lg.pdf",
      sha256: "0c2008803530b6f39592a58b2e03d04d239654e44ea3a155c5cb8faeb6ed3c1d",
    },
  ])
}

async function seedOfficial2025Archive(page: Page): Promise<void> {
  await seedOfficialArchive(page, [
    {
      id: "zap-zh-lg-2025:tasks",
      editionId: "zap-zh-lg-2025",
      kind: "tasks",
      filename: "2025_mathematik_aufgaben.pdf",
      sha256: "ebbab8f760060113dee4372af3545d369bf05314abae3600b61d5d5164264ec6",
    },
    {
      id: "zap-zh-lg-2025:solutions",
      editionId: "zap-zh-lg-2025",
      kind: "solutions",
      filename: "2025_mathematik_loesungen.pdf",
      sha256: "d4b5f336318b7003dc5dbbfa38f87fabcef7e2a9ad0d24bf60161ffa2ec7bf75",
    },
  ])
}

async function seedOfficial2015Archive(page: Page): Promise<void> {
  await seedOfficialArchive(page, [
    {
      id: "zap-zh-lg-2015:tasks",
      editionId: "zap-zh-lg-2015",
      kind: "tasks",
      filename: "2015_mathematik_aufgaben_lg.pdf",
      sha256: "d3110bce35c63bb9ea9a92578d065b4d4b83b086a511a76f1c3bba8fee021dc3",
    },
    {
      id: "zap-zh-lg-2015:solutions",
      editionId: "zap-zh-lg-2015",
      kind: "solutions",
      filename: "2015_mathematik_loesung_lg.pdf",
      sha256: "2ae7bbf7d5418aac082d28fb1a802feed96e31440542937f3686a04c30d30eb9",
    },
  ])
}

async function seedOfficial2023Archive(page: Page): Promise<void> {
  await seedOfficialArchive(page, [
    {
      id: "zap-zh-lg-2023:tasks",
      editionId: "zap-zh-lg-2023",
      kind: "tasks",
      filename: "2023_mathematik_aufgaben_lg.pdf",
      sha256: "a4dcf9b354db4be9d9ae6b6b37577d8f0dda809b63b01f3cdffea819bf9a6403",
    },
    {
      id: "zap-zh-lg-2023:solutions",
      editionId: "zap-zh-lg-2023",
      kind: "solutions",
      filename: "2023_mathematik_loesungen_lg.pdf",
      sha256: "e140e436152944f942e66cf1616027aa5079412c6eba542b249b3310aff5fc4a",
    },
  ])
}

async function seedOfficial2022Archive(page: Page): Promise<void> {
  await seedOfficialArchive(page, [
    {
      id: "zap-zh-lg-2022:tasks",
      editionId: "zap-zh-lg-2022",
      kind: "tasks",
      filename: "2022_mathematik_aufgaben.pdf",
      sha256: "4affdc63b8cafb23b0c62d6a47e621e73b8ce3d9af6bb37ad5d6078ded624c62",
    },
    {
      id: "zap-zh-lg-2022:solutions",
      editionId: "zap-zh-lg-2022",
      kind: "solutions",
      filename: "2022_mathematik_loesungen.pdf",
      sha256: "37ba11d6ae9b386367d9cf34b6b91f96874878d5aef79aed5100892b55f0c969",
    },
  ])
}

test("runs, resumes, and manually corrects the verified 2024 official replay", async ({ page }) => {
  await createFoundationsLearner(page, "ZAP-2024-Test")
  await seedOfficial2024Archive(page)

  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  await expect(page.getByRole("button", { name: "Wiederholung 2024 starten" })).toBeEnabled()
  await page.getByRole("button", { name: "Wiederholung 2024 starten" }).click()

  await expect(page.getByText("ZAP Mathematik 2024 · lokal")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Geschickt rechnen" })).toBeVisible()
  await page.getByLabel("Endresultat").fill("4649,4")
  await page.getByLabel("Rechenweg oder Zwischenresultate").fill("Die äusseren Produkte heben sich auf.")

  await page.getByRole("button", { name: "Zur Übersicht Zeit läuft weiter" }).click()
  await expect(page.getByRole("heading", { name: "Die offizielle Wiederholung läuft weiter." })).toBeVisible()
  await page.getByRole("button", { name: "Prüfung fortsetzen" }).click()
  await expect(page.getByLabel("Endresultat")).toHaveValue("4649,4")

  await page.getByRole("button", { name: /^Aufgabe 7:/u }).click()
  await page.getByLabel("Alle vier Würfelansichten auf dem Aufgabenblatt ergänzt").check()
  await page.getByRole("button", { name: "Prüfung abgeben" }).click()
  await page.getByRole("button", { name: "Endgültig abgeben" }).click()

  await expect(page.getByRole("heading", { name: "Jetzt wird aus der Abgabe ein ehrliches Ergebnis." })).toBeVisible()
  await expect(page.getByText("Mathematiknote 2024")).toBeVisible()
  await expect(page.getByText(/keine Punkte automatisch festgelegt/u)).toBeVisible()

  for (let task = 1; task <= 9; task += 1) {
    await page.locator(`input[name="official-score-${task}"][value="4"]`).check()
    if (task < 9) await page.getByRole("button", { name: "Nächste Aufgabe" }).click()
  }
  await page.getByRole("article").getByRole("button", { name: "Korrektur abschliessen" }).click()

  await expect(page.getByRole("heading", { name: "Die 2024er Prüfung ist korrigiert." })).toBeVisible()
  await expect(page.getByText("Mathematiknote 6.0")).toBeVisible()
  await expect(page.getByText("Offizielle Mathematikskala · nicht Gesamtnote")).toBeVisible()
})

test("locks only source-proven 2025 equation, fraction, follow-through, and surface points", async ({ page }) => {
  await createFoundationsLearner(page, "ZAP-2025-Rubrik-Test")
  await seedOfficial2025Archive(page)

  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  await expect(page.getByRole("button", { name: "Wiederholung 2025 starten" })).toBeEnabled()
  await page.getByRole("button", { name: "Wiederholung 2025 starten" }).click()

  await expect(page.getByText("ZAP Mathematik 2025 · lokal")).toBeVisible()
  await page.getByLabel("Zahl im Kästchen").nth(0).fill("4940")
  await page.locator('textarea[id*="task-1-part-a"][id$="milestone-calculation-path"]').fill(
    "671 · 81 = 54340\n54340 : 11 = 4940",
  )
  await page.getByLabel("Zahl im Kästchen").nth(1).fill("3")
  await page.getByLabel("Verhältnis 75 min zu 175 min").fill("75/175")

  await page.getByRole("button", { name: /^Aufgabe 4:/u }).click()
  await page.getByLabel("Tiefster Preis").fill("220")
  await page.getByLabel("Rechenweg für die Ein-Fehler-Regel").fill(
    "15 · 12 = 170\n10 · 5 = 50\n170 + 50 = 220",
  )

  await page.getByRole("button", { name: /^Aufgabe 5:/u }).click()
  await page.getByLabel("Geerntete Erdbeeren").fill("100.5")
  await page.getByLabel("Vollständiger Rechenweg für die Ein-Fehler-Regel").fill(
    "108 · 0,5 = 63\n63 : 3 = 21\n21 · 4 = 84\n84 : 6 = 14\n14 · 7 = 98\n98 + 2,5 = 100,5",
  )

  await page.getByRole("button", { name: /^Aufgabe 6:/u }).click()
  await page.getByLabel("Gesamte Tagesrationen").fill("900")
  await page.getByLabel("Weitere Tage").fill("23")
  await page.getByLabel("Tagesrationen nach 12 Tagen").fill("660")
  await page.getByLabel("Letzte Division aus deinem Rechenweg").fill("660 : 30 = 23")

  await page.getByRole("button", { name: /^Aufgabe 9:/u }).click()
  await page.getByLabel("Oberfläche").fill("576")
  await page.getByLabel("Länge eines Bausteins").fill("15")
  await page.getByLabel("Breite eines Bausteins").fill("6")
  await page.getByLabel("Höhe eines Bausteins").fill("4")
  await page.getByLabel("Stirnfläche (eine oder beide)").fill("48")
  await page.getByLabel("Linke/rechte Seitenfläche (eine oder beide)").fill("60")
  await page.getByLabel("Boden-/Deckfläche (eine oder beide)").fill("180")

  await page.getByRole("button", { name: "Prüfung abgeben" }).click()
  await page.getByRole("button", { name: "Endgültig abgeben" }).click()

  await expect(page.locator(".mock-score-card")).toContainText("4/36")
  await expect(page.locator(".mock-score-card")).toContainText("1 von 9 Aufgaben bewertet")
  const scores = [3, 0, 0, 1, 3, 1, 0, 0, 4]
  for (let task = 1; task <= 9; task += 1) {
    const score = scores[task - 1]!
    await page.locator(`input[name="official-score-${task}"][value="${score}"]`).check()
    if (task === 1) {
      await expect(page.locator('input[name="official-score-1"][value="2"]')).toBeDisabled()
    }
    if (task === 4) {
      await expect(page.locator('input[name="official-score-4"][value="0"]')).toBeDisabled()
    }
    if (task === 5) {
      await expect(page.locator('input[name="official-score-5"][value="2"]')).toBeDisabled()
    }
    if (task === 6) {
      await expect(page.locator('input[name="official-score-6"][value="0"]')).toBeDisabled()
    }
    if (task === 9) {
      await expect(page.locator('input[name="official-score-9"][value="3"]')).toBeDisabled()
    }
    if (task < 9) await page.getByRole("button", { name: "Nächste Aufgabe" }).click()
  }
  await page.getByRole("article").getByRole("button", { name: "Korrektur abschliessen" }).click()

  await expect(page.getByRole("heading", { name: "Die 2025er Prüfung ist korrigiert." })).toBeVisible()
  await expect(page.locator(".mock-score-card")).toContainText("12/36")
  await expect(page.getByText("Mathematiknote 3.0")).toBeVisible()
})

test("scores and corrects the 2015 cube matching replay without inventing a year grade", async ({ page }) => {
  await createFoundationsLearner(page, "ZAP-2015-Test")
  await seedOfficial2015Archive(page)

  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  await expect(page.getByRole("button", { name: "Wiederholung 2015 starten" })).toBeEnabled()
  await page.getByRole("button", { name: "Wiederholung 2015 starten" }).click()

  await expect(page.getByText("ZAP Mathematik 2015 · lokal")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Zeit und Masse umrechnen" })).toBeVisible()
  await page.getByRole("button", { name: /^Aufgabe 9:/u }).click()
  await page.getByLabel("Netz 1 zuordnen").selectOption("D")
  await page.getByLabel("Netz 2 zuordnen").selectOption("A")
  await page.getByLabel("Netz 3 zuordnen").selectOption("none")
  await page.getByLabel("Netz 4 zuordnen").selectOption("C")
  await page.getByRole("button", { name: "Prüfung abgeben" }).click()
  await page.getByRole("button", { name: "Endgültig abgeben" }).click()

  await expect(page.getByText("Offizielle Notenskala nicht verifiziert")).toBeVisible()
  await expect(page.locator(".mock-score-card")).toContainText("4/36")
  for (let task = 1; task <= 9; task += 1) {
    const fixed = task === 9
    const score = page.locator(`input[name="official-score-${task}"][value="${fixed ? 4 : 0}"]`)
    if (fixed) {
      await expect(score).toBeChecked()
      await expect(page.locator('input[name="official-score-9"][value="3"]')).toBeDisabled()
    } else {
      await score.check()
    }
    if (task < 9) await page.getByRole("button", { name: "Nächste Aufgabe" }).click()
  }
  await page.getByRole("article").getByRole("button", { name: "Korrektur abschliessen" }).click()

  await expect(page.getByRole("heading", { name: "Die 2015er Prüfung ist korrigiert." })).toBeVisible()
  await expect(page.locator(".mock-score-card")).toContainText("4/36")
  await expect(page.getByText(/Korrigierter Punktestand ohne Notenumrechnung/u)).toBeVisible()
  await expect(page.getByText(/Mathematiknote 6/u)).toHaveCount(0)
})

test("scores and corrects the 2023 replay without inventing a year grade", async ({ page }) => {
  await createFoundationsLearner(page, "ZAP-2023-Test")
  await seedOfficial2023Archive(page)

  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  await expect(page.getByRole("button", { name: "Wiederholung 2023 starten" })).toBeEnabled()
  await page.getByRole("button", { name: "Wiederholung 2023 starten" }).click()

  await expect(page.getByText("ZAP Mathematik 2023 · lokal")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Masse und Zeit ergänzen" })).toBeVisible()
  await page.getByRole("button", { name: /^Aufgabe 4:/u }).click()
  await page.getByLabel("Aussage 1: richtig").check()
  await page.getByLabel("Aussage 2: falsch").check()
  await page.getByLabel("Aussage 3: richtig").check()
  await page.getByLabel("Aussage 4: falsch").check()

  await page.getByRole("button", { name: /^Aufgabe 8:/u }).click()
  await page.getByLabel("Anzahl Gabeln").fill("156")
  await page.getByRole("button", { name: "Prüfung abgeben" }).click()
  await page.getByRole("button", { name: "Endgültig abgeben" }).click()

  await expect(page.getByText("Offizielle Notenskala nicht verifiziert")).toBeVisible()
  await expect(page.locator(".mock-score-card")).toContainText("8/36")
  for (let task = 1; task <= 9; task += 1) {
    const fixed = task === 4 || task === 8
    const score = page.locator(`input[name="official-score-${task}"][value="${fixed ? 4 : 0}"]`)
    if (fixed) {
      await expect(score).toBeChecked()
      await expect(page.locator(`input[name="official-score-${task}"][value="3"]`)).toBeDisabled()
    } else {
      await score.check()
    }
    if (task < 9) await page.getByRole("button", { name: "Nächste Aufgabe" }).click()
  }
  await page.getByRole("article").getByRole("button", { name: "Korrektur abschliessen" }).click()

  await expect(page.getByRole("heading", { name: "Die 2023er Prüfung ist korrigiert." })).toBeVisible()
  await expect(page.locator(".mock-score-card")).toContainText("8/36")
  await expect(page.getByText(/Korrigierter Punktestand ohne Notenumrechnung/u)).toBeVisible()
  await expect(page.getByText(/Mathematiknote 6/u)).toHaveCount(0)
})

test("runs a persisted 2022 source training and records only bounded self-review", async ({ page }) => {
  await createFoundationsLearner(page, "Archiv-2022-Test")
  await seedOfficial2022Archive(page)

  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  const yearCard = page.locator('[data-archive-year="2022"]')
  await expect(yearCard.getByRole("button", { name: "Archivtraining 2022 starten" })).toBeEnabled()
  await yearCard.getByRole("button", { name: "Archivtraining 2022 starten" }).click()

  await expect(page.getByText("60-MINUTEN-ARCHIVTRAINING")).toBeVisible()
  await expect(page.getByText(/Lösungsseite bleibt bis zur Abgabe gesperrt/u)).toBeVisible()
  await expect(page.getByRole("button", { name: "Lösungsblatt" })).toHaveCount(0)
  await page.locator(".archive-paper-toggle").click()
  await page.getByRole("button", { name: /^Aufgabe 2:/u }).click()

  await page.getByRole("button", { name: "Zur Übersicht Zeit läuft weiter" }).click()
  await expect(page.getByRole("heading", { name: "Das Archivtraining 2022 läuft weiter." })).toBeVisible()
  await page.getByRole("button", { name: "Archivtraining fortsetzen" }).click()
  await expect(page.getByRole("button", { name: /^Aufgabe 1: auf Papier bearbeitet/u })).toBeVisible()

  await page.getByRole("button", { name: "Training abgeben" }).click()
  await page.getByRole("button", { name: "Abgeben und Lösungen öffnen" }).click()
  await expect(page.getByText("SELBSTREVIEW")).toBeVisible()
  await expect(page.getByRole("button", { name: "Lösungsblatt" })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText(/erzeugt deshalb keine Punkte, Note, XP oder Änderung des Lernstands/u)).toBeVisible()
  await page.getByRole("button", { name: /^Aufgabe 1: noch offen/u }).click()

  for (let task = 1; task <= 9; task += 1) {
    const status = task === 1
      ? "answer-matches"
      : task === 2
        ? "answer-differs-or-unclear"
        : "not-attempted"
    await page.locator(`input[name="archive-review-${task}"][value="${status}"]`).check()
    if (task < 9) await page.getByRole("button", { name: "Nächste Aufgabe" }).click()
  }
  await page.getByRole("button", { name: "Selbstreview abschliessen" }).click()

  await expect(page.getByRole("heading", { name: "Die Prüfung 2022 ist ehrlich verglichen." })).toBeVisible()
  await expect(page.getByText("Keine Punkte")).toBeVisible()
  await expect(page.getByText("Keine Note. Keine XP. Keine Veränderung von Mastery oder Reviews.")).toBeVisible()
  expect(await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const learner = await new Promise<{ totalXp: number; archivePracticeHistory: unknown[] }>((resolve, reject) => {
      const request = database.transaction("learner", "readonly").objectStore("learner").get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const activeCount = await new Promise<number>((resolve, reject) => {
      const request = database.transaction("archivePractice", "readonly").objectStore("archivePractice").count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return { totalXp: learner.totalXp, historyCount: learner.archivePracticeHistory.length, activeCount }
  })).toEqual({ totalXp: 0, historyCount: 1, activeCount: 0 })
})

test("reports a generated task, pauses its topic, shows an honest mock trend, reopens it, and resets onboarding", async ({ page, context }) => {
  await createFoundationsLearner(page, "Support-Test")

  const lessonCard = page.locator(".task-card.lesson").first()
  await expect(lessonCard).toBeVisible()
  const lessonTitle = (await lessonCard.getByRole("heading").textContent())?.trim()
  if (!lessonTitle) throw new Error("Missing first lesson title")
  await lessonCard.getByRole("button", { name: "Starten" }).click()

  const reportLink = page.getByRole("link", { name: /Fehler in dieser Aufgabe melden/u })
  for (let pageIndex = 0; pageIndex < 8 && !await reportLink.isVisible(); pageIndex += 1) {
    const continueButton = page.getByRole("button", { name: /^(Weiter|Jetzt üben)$/u })
    await expect(continueButton).toBeVisible()
    await continueButton.click()
  }
  await expect(reportLink).toBeVisible()

  const reportPagePromise = context.waitForEvent("page")
  await reportLink.click()
  const reportPage = await reportPagePromise
  await expect(reportPage).toHaveURL(/\/exercise-report\?data=/u)
  await expect(reportPage.getByRole("heading", { name: "Was stimmt an dieser Aufgabe nicht?" })).toBeVisible()
  await expect(reportPage.getByText("keinen Namen, keine eingegebene Antwort und keinen Lernverlauf")).toBeVisible()
  await reportPage.locator("#exercise-report-issue").fill("Die Bewertung dieser Aufgabe ist nicht nachvollziehbar.")
  await expect(reportPage.getByRole("button", { name: "Kopieren", exact: true })).toBeEnabled()
  await reportPage.close()

  await page.getByRole("button", { name: "Ich verstehe dieses Thema noch nicht" }).click()
  await expect(page.getByRole("alert")).toContainText("keine weitere Trainingsaufgabe")
  await page.getByRole("button", { name: "Pausieren und melden" }).click()
  await expect(page.getByRole("heading", { name: "Dein Lernplan" })).toBeVisible()
  await expect(page.locator(".task-card").filter({ hasText: lessonTitle })).toHaveCount(0)

  await seedComparableMockTrend(page)

  await page.getByRole("button", { name: "Prüfungsmodus öffnen" }).click()
  const archiveShelf = page.getByRole("region", { name: "Elf echte Prüfungsjahre zum Nachschlagen und Üben." })
  await expect(archiveShelf).toBeVisible()
  await expect(archiveShelf.getByText("1/22 PDFs bereit")).toBeVisible()
  await expect(archiveShelf.locator("[data-archive-year]")).toHaveCount(11)
  await expect(archiveShelf.locator('[data-archive-year="2024"]')).toContainText("1/2 lokal")
  await expect(archiveShelf.getByText("Quellenansicht · kein automatischer Punktestand").first()).toBeVisible()
  expect(await archiveShelf.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)
  await page.getByRole("button", { name: "Lernplan", exact: true }).click()

  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await page.getByRole("button", { name: "Begleitansicht öffnen" }).click()
  await page.locator("#parent-pin").fill("4826")
  await page.locator("#parent-pin-confirmation").fill("4826")
  await page.getByRole("button", { name: "PIN speichern und öffnen" }).click()

  await expect(page.getByText("VON DER LERNENDEN PERSON PAUSIERT")).toBeVisible()
  await expect(page.getByRole("heading", { name: lessonTitle })).toBeVisible()
  await page.getByRole("button", { name: "English", exact: true }).click()
  await expect(page.getByText("PAUSED BY THE LEARNER")).toBeVisible()
  await expect(page.getByText("Only this coaching guide changes with this choice. The language of the learner's questions is selected separately in settings.")).toBeVisible()
  await expect(page.getByRole("button", { name: "English", exact: true })).toHaveAttribute("aria-pressed", "true")
  const englishCoachingAudit = await new AxeBuilder({ page })
    .include(".parent-topic-help-panel")
    .withTags(wcagTags)
    .analyze()
  expect(
    englishCoachingAudit.violations,
    JSON.stringify(englishCoachingAudit.violations, null, 2),
  ).toEqual([])
  const pilotPanel = page.locator(".parent-pilot-panel")
  await expect(pilotPanel).toBeVisible()
  await expect(pilotPanel).toContainText("0/3 Kalenderwochen")
  await expect(pilotPanel).toContainText("Die Runde lief ohne Bedien- oder Lösungscoaching.")
  await expect(pilotPanel).toContainText("keine Übertragung")
  expect(await pilotPanel.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)
  const mockTrend = page.locator(".parent-mock-trend")
  await expect(mockTrend).toBeVisible()
  await expect(mockTrend).toContainText("Prüfungsformat v4")
  await expect(mockTrend).toContainText("12–18/36 Punkte")
  await expect(mockTrend).toContainText("22–24/36 Punkte")
  await expect(mockTrend).toContainText("Keine Schulnote")
  expect(await mockTrend.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)

  await page.getByRole("button", { name: "Prüflabor öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Frische Aufgaben prüfen, bevor sie Vertrauen kosten." })).toBeVisible()
  await expect(page.getByText("23 Themen × 3 Stufen")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Zürich ZAP1 Mathematik · Paket v1" })).toBeVisible()
  await expect(page.getByText("Struktur vollständig")).toBeVisible()
  await expect(page.locator('[aria-label="0 von 76 Prüffeldern in dieser Sitzung geprüft"]')).toBeVisible()
  const firstSeed = await page.locator(".author-validation-seed code").textContent()
  await page.getByRole("button", { name: "Neue Variante" }).click()
  await expect(page.locator(".author-validation-seed code")).not.toHaveText(firstSeed ?? "")
  await page.getByRole("button", { name: "Prüfungsnah" }).click()
  await expect(page.getByRole("button", { name: "Prüfungsnah" })).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Als geprüft markieren" }).click()
  await expect(page.locator('[aria-label="1 von 76 Prüffeldern in dieser Sitzung geprüft"]')).toBeVisible()
  expect(await page.locator(".author-validation-shell").evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)

  const persistenceBeforeLearnerPreview = await readLearningPersistence(page)
  const canonicalAnswer = (await page.locator(".author-validation-answer strong").first().textContent())?.trim()
  if (!canonicalAnswer) throw new Error("Missing canonical author-validation answer")
  await page.getByRole("button", { name: "Lernansicht prüfen" }).click()
  await page.locator("#answer").fill(canonicalAnswer)
  await page.getByRole("button", { name: "Prüfen", exact: true }).click()
  await expect(page.getByText("Richtig.", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Abschliessen" }).click()
  await expect(page.getByRole("heading", { name: "Die echte Aufgabenrunde ist geprüft." })).toBeVisible()
  await page.getByRole("button", { name: "Zur Autorenansicht" }).click()
  await expect(page.getByRole("heading", { name: "Frische Aufgaben prüfen, bevor sie Vertrauen kosten." })).toBeVisible()
  expect(await readLearningPersistence(page)).toEqual(persistenceBeforeLearnerPreview)

  const authorReportPromise = context.waitForEvent("page")
  await page.getByRole("link", { name: /Fehler melden/u }).click()
  const authorReport = await authorReportPromise
  await expect(authorReport.getByText("Prüflabor", { exact: true })).toBeVisible()
  await expect(authorReport.getByText("zh-zap1-math@1", { exact: true })).toBeVisible()
  await expect(authorReport.getByText("keinen Namen, keine eingegebene Antwort und keinen Lernverlauf")).toBeVisible()
  await authorReport.close()
  await page.getByRole("button", { name: "Begleitansicht" }).click()

  await expect(page.getByText("PAUSED BY THE LEARNER")).toBeVisible()

  await page.getByRole("button", { name: "Pilotbelege im Protokoll öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Offene Belege sichtbar machen, ohne Freigabe zu spielen." })).toBeVisible()
  const testedBuild = (await page.locator(".release-runtime-build strong").textContent())?.trim()
  expect(testedBuild).toMatch(/^[0-9a-f]{40}(?:-dirty)?$/u)
  await page.locator('[data-release-check="ipad-standalone"]').check()
  await expect(page.locator('[aria-label="1 von 43 Freigabepunkten lokal erfasst"]')).toBeVisible()
  expect(await page.locator(".release-readiness-shell").evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)
  expect(await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const record = await new Promise<{
      completedAtByCheck?: Record<string, string>
      buildIdByCheck?: Record<string, string>
    } | undefined>((resolve, reject) => {
      const request = database.transaction("releaseReadiness", "readonly")
        .objectStore("releaseReadiness")
        .get("current")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return {
      completed: Boolean(record?.completedAtByCheck?.["ipad-standalone"]),
      buildId: record?.buildIdByCheck?.["ipad-standalone"],
    }
  })).toEqual({ completed: true, buildId: testedBuild })

  await page.reload()
  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await page.getByRole("button", { name: "Begleitansicht öffnen" }).click()
  await page.locator("#parent-pin").fill("4826")
  await page.getByRole("button", { name: "Begleitansicht öffnen" }).click()
  await page.getByRole("button", { name: "Freigabeprotokoll öffnen" }).click()
  await expect(page.locator('[data-release-check="ipad-standalone"]')).toBeChecked()
  await expect(page.locator('[aria-label="1 von 43 Freigabepunkten lokal erfasst"]')).toBeVisible()
  await expect(page.locator('[data-release-check="ipad-standalone"] + span + p small')).toContainText(`Build: ${testedBuild}`)
  await page.getByRole("button", { name: "Begleitansicht" }).click()

  await expect(page.getByText("PAUSED BY THE LEARNER")).toBeVisible()
  await expect(page.getByRole("button", { name: "English", exact: true })).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Deutsch", exact: true }).click()
  await expect(page.getByText("VON DER LERNENDEN PERSON PAUSIERT")).toBeVisible()

  await page.getByText("Erklärung gemeinsam vorbereiten").click()
  await expect(page.getByText("Worum es heute geht")).toBeVisible()
  await expect(page.getByText("Ein Schritt nach dem anderen")).toBeVisible()
  await expect(page.getByText("Die lernende Person erklärt zurück")).toBeVisible()
  await expect(page.getByText("Danach nimmt der adaptive Lernplan das Thema wieder mit frischen Aufgaben auf.")).toBeVisible()
  await page.getByRole("button", { name: "Erklärt – wieder freigeben" }).click()
  await expect(page.getByText("VON DER LERNENDEN PERSON PAUSIERT")).toHaveCount(0)

  await page.getByRole("button", { name: "Sperren und zurück" }).click()
  await page.getByRole("button", { name: "Testprofil zurücksetzen und Onboarding neu starten" }).click()
  await expect(page.getByRole("alert")).toContainText("private PDFs und Eltern-PIN")
  await expect(page.getByRole("alert")).toContainText("Das getrennte Freigabeprotokoll bleibt erhalten")
  await page.getByRole("button", { name: "Profil zurücksetzen" }).click()

  await expect(page.getByRole("heading", { name: "Für wen und bis wann planen wir?" })).toBeVisible()
  await expect(page.getByLabel("Dein Spitzname")).toHaveValue("")
  expect(await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("gymiquest", 8)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const archiveCount = await new Promise<number>((resolve, reject) => {
      const request = database.transaction("archiveDocument", "readonly")
        .objectStore("archiveDocument")
        .count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const releaseReadiness = await new Promise<{
      completedAtByCheck?: Record<string, string>
      buildIdByCheck?: Record<string, string>
    } | undefined>((resolve, reject) => {
      const request = database.transaction("releaseReadiness", "readonly")
        .objectStore("releaseReadiness")
        .get("current")
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const archivePracticeCount = await new Promise<number>((resolve, reject) => {
      const request = database.transaction("archivePractice", "readonly")
        .objectStore("archivePractice")
        .count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const archivePracticeHistoryCount = await new Promise<number>((resolve, reject) => {
      const request = database.transaction("learner", "readonly")
        .objectStore("learner")
        .get("zh-zap1-math@1")
      request.onsuccess = () => resolve(request.result?.archivePracticeHistory?.length ?? -1)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return {
      archiveCount,
      releaseReadinessCount: releaseReadiness ? 1 : 0,
      releaseCheckPreserved: Boolean(releaseReadiness?.completedAtByCheck?.["ipad-standalone"]),
      releaseBuildId: releaseReadiness?.buildIdByCheck?.["ipad-standalone"],
      archivePracticeCount,
      archivePracticeHistoryCount,
    }
  })).toEqual({
    archiveCount: 0,
    releaseReadinessCount: 1,
    releaseCheckPreserved: true,
    releaseBuildId: testedBuild,
    archivePracticeCount: 0,
    archivePracticeHistoryCount: 0,
  })

  await createFoundationsLearner(page, "Neustart-Test")
  await page.getByRole("button", { name: "Fortschritt öffnen" }).click()
  await page.getByRole("button", { name: "Begleitansicht öffnen" }).click()
  await expect(page.getByRole("heading", { name: "Ruhige Begleitung, getrennt vom Lernmodus." })).toBeVisible()
  await page.locator("#parent-pin").fill("8642")
  await page.locator("#parent-pin-confirmation").fill("8642")
  await page.getByRole("button", { name: "PIN speichern und öffnen" }).click()
  await page.getByRole("button", { name: "Freigabeprotokoll öffnen" }).click()
  await expect(page.locator('[data-release-check="ipad-standalone"]')).toBeChecked()
  await expect(page.locator('[aria-label="1 von 43 Freigabepunkten lokal erfasst"]')).toBeVisible()
  await expect(page.locator('[data-release-check="ipad-standalone"] + span + p small')).toContainText(`Build: ${testedBuild}`)
})
