export const RELEASE_READINESS_VERSION = 1 as const

export const releaseReadinessSections = [
  {
    id: "physical-ipad",
    eyebrow: "PRIMÄRGERÄT",
    title: "Physische iPad-Prüfung",
    summary: "Safari-Installation, lokale Haltbarkeit und Offline-Arbeit müssen auf dem echten Gerät belegt werden.",
    reviewer: "Gerätetest durch die verantwortliche Person",
    checks: [
      {
        id: "ipad-standalone",
        label: "Aus Safari zum Home-Bildschirm hinzugefügt und im eigenständigen App-Fenster gestartet.",
      },
      {
        id: "ipad-reading-geometry",
        label: "Mehr Leseruhe und Werkzeuge links gewählt, neu geladen und Geometrische Orte geöffnet; Lesemodus und Werkzeugseite blieben erhalten, ohne den Konstruktionsplan zu verdecken.",
      },
      {
        id: "ipad-pause-resume",
        label: "Lektion mit eingegebener Antwort eine Minute pausiert, Aufgabe verdeckt und Lernzeit stabil; nach erzwungenem Beenden exakt wiederhergestellt.",
      },
      {
        id: "ipad-offline-finish",
        label: "Ohne WLAN/Mobilfunk neu gestartet, Lektion beendet und danach XP, Review-Termin und Debrief unverändert wiedergefunden.",
      },
      {
        id: "ipad-report-handoff",
        label: "Aufgabenbericht in einer separaten Browseransicht geöffnet; weder Spitzname noch eingegebene Antwort waren enthalten.",
      },
      {
        id: "ipad-teacher-queue",
        label: "Thema pausiert, in der PIN-geschützten Begleitliste erklärt und wieder freigegeben, ohne bestehende XP zu verändern.",
      },
      {
        id: "ipad-reset",
        label: "Testprofil zurückgesetzt; Onboarding erschien leer und Lernstand, aktive Arbeit, private PDFs sowie Eltern-PIN waren entfernt.",
      },
      {
        id: "ipad-private-archive",
        label: "Alle 22 registrierten PDFs importiert, ein älteres Aufgaben-/Lösungspaar geöffnet und die Replay-Grenzen 2015/2023/2024/2025 geprüft.",
      },
      {
        id: "ipad-source-training",
        label: "Eine Quellenübung 2016–2022 gestartet: absolute 60-Minuten-Frist blieb nach Verlassen/Neuladen erhalten, Lösungen blieben gesperrt, jede Aufgabe verlangte die begrenzte Selbstkontrolle und der Abschluss erzeugte weder Punkte/Note noch XP/Mastery/Review.",
      },
      {
        id: "ipad-backup-boundary",
        label: "Bestätigt, dass private PDFs nur auf diesem iPad liegen und in der verschlüsselten Lernstandsicherung fehlen.",
      },
      {
        id: "ipad-manual-accessibility",
        label: "VoiceOver-Lesereihenfolge, 200%-Textzoom ohne horizontales Scrollen sowie Touch-/Pencil-Ziele und die Geometriekonstruktion auf dem physischen iPad manuell als benutzbar geprüft.",
      },
    ],
  },
  {
    id: "official-2015",
    eyebrow: "UNABHÄNGIGE KORREKTUR",
    title: "Offizielle Wiederholung 2015",
    summary: "Der deterministische Task-9-Rand und der ausdrückliche Zustand ohne Notenskala brauchen eine zweite fachkundige Person.",
    reviewer: "Unabhängige Mathematiklehrperson oder erfahrene ZAP-Korrekturperson",
    checks: [
      {
        id: "official-2015-sources",
        label: "Beide Quell-Hashes sowie alle neun Aufgaben-/Lösungsseiten und Antwortoberflächen mit den Originalen verglichen.",
      },
      {
        id: "official-2015-task9",
        label: "Alle fünf dokumentierten Task-9-Punktverläufe reproduziert und die feste Unter-/Obergrenze bestätigt.",
      },
      {
        id: "official-2015-manual",
        label: "Bestätigt, dass Tasks 1–8 vollständig menschlich korrigiert bleiben.",
      },
      {
        id: "official-2015-no-grade",
        label: "Korrigierte 0–36 Punkte, 2015-Kennzeichnung und fehlende Notenumrechnung in Resultat, Fortschritt und Begleitansicht bestätigt.",
      },
      {
        id: "official-2015-independent",
        label: "Name, Rolle/Erfahrung, Datum und Abweichungen der unabhängigen Korrekturperson im exportierten Protokoll dokumentiert.",
      },
    ],
  },
  {
    id: "official-2023",
    eyebrow: "UNABHÄNGIGE KORREKTUR",
    title: "Offizielle Wiederholung 2023",
    summary: "Task 4 und Task 8 haben enge sichere Grenzen; alle anderen Punkte und die fehlende Jahrgangsskala bleiben ehrlich manuell.",
    reviewer: "Unabhängige Mathematiklehrperson oder erfahrene ZAP-Korrekturperson",
    checks: [
      {
        id: "official-2023-sources",
        label: "Beide Quell-Hashes sowie alle neun Aufgaben-/Lösungszuordnungen und Antwortoberflächen mit den Originalen verglichen.",
      },
      {
        id: "official-2023-boundaries",
        label: "Task-4-Strafmatrix und die exakte Task-8-Antwort 156 reproduziert; feste Punktgrenzen bestätigt.",
      },
      {
        id: "official-2023-manual",
        label: "Bestätigt, dass alle übrigen Punkte menschlich korrigiert bleiben.",
      },
      {
        id: "official-2023-no-grade",
        label: "Korrigierte 0–36 Punkte, 2023-Kennzeichnung und fehlende Notenumrechnung in allen relevanten Ansichten bestätigt.",
      },
      {
        id: "official-2023-independent",
        label: "Name, Rolle/Erfahrung, Datum und Abweichungen der unabhängigen Korrekturperson im exportierten Protokoll dokumentiert.",
      },
    ],
  },
  {
    id: "official-2024",
    eyebrow: "UNABHÄNGIGE KORREKTUR",
    title: "Offizielle Wiederholung 2024",
    summary: "Alle 36 Punkte bleiben manuell; die separate offizielle Mathematikskala muss vollständig gegengeprüft werden.",
    reviewer: "Unabhängige Mathematiklehrperson oder erfahrene ZAP-Korrekturperson",
    checks: [
      {
        id: "official-2024-sources",
        label: "Aufgaben-, Lösungs- und Notenskala-Hash sowie alle neun Seiten-/Antwortzuordnungen mit den Originalen verglichen.",
      },
      {
        id: "official-2024-manual",
        label: "Leere und numerisch richtige Läufe geprüft; stets 0 sichere und 36 menschlich zu korrigierende Punkte bestätigt.",
      },
      {
        id: "official-2024-controls",
        label: "Antwortoberflächen, allgemeine Korrekturregeln und papiergebundene Task-7-Grenze bestätigt.",
      },
      {
        id: "official-2024-scale",
        label: "Alle 37 Ganzpunktwerte 0–36 gegen die offizielle Mathematikskala 2024 geprüft; Beschriftung ist nie Gesamtnote/bestanden.",
      },
      {
        id: "official-2024-independent",
        label: "Name, Rolle/Erfahrung, Datum und Abweichungen der unabhängigen Korrekturperson im exportierten Protokoll dokumentiert.",
      },
    ],
  },
  {
    id: "official-2025",
    eyebrow: "UNABHÄNGIGE KORREKTUR",
    title: "Offizielle Wiederholung 2025",
    summary: "Die konservativen sicheren Punktuntergrenzen, Addenda und Jahrgangsskala müssen mit den gerenderten Originalen verglichen werden.",
    reviewer: "Unabhängige Mathematiklehrperson oder erfahrene ZAP-Korrekturperson",
    checks: [
      {
        id: "official-2025-sources",
        label: "Beide Quell-Hashes sowie Aufgaben-, Lösungsseiten und Antwortoberflächen für Tasks 1–9 mit den Originalen verglichen.",
      },
      {
        id: "official-2025-golden",
        label: "Vollpunkte, alle expliziten Zwischenwert-Untergrenzen, Nullpunkte, Einzelfehler, Einheiten und plausible Nicht-Punkte je Task geprüft.",
      },
      {
        id: "official-2025-addenda",
        label: "3/7-Route, beide Task-6b-Fortschreibungen, Task-9-Flächenfamilien und alle v1.1-Zusätze reproduziert.",
      },
      {
        id: "official-2025-manual",
        label: "Task 7 und alle nur auf Papier sichtbaren oder nicht sicher strukturierten Rechenwege bleiben menschlich korrigiert.",
      },
      {
        id: "official-2025-scale",
        label: "0–36 Punkte gegen die Mathematikskala 2025 geprüft; keine Gesamtnote, Bestehens- oder Skalenübertragung auf generierte Prüfungen.",
      },
      {
        id: "official-2025-independent",
        label: "Name, Rolle/Erfahrung, Datum und Abweichungen der unabhängigen Korrekturperson im exportierten Protokoll dokumentiert.",
      },
    ],
  },
  {
    id: "learner-pilot",
    eyebrow: "PRODUKTEVIDENZ",
    title: "Dreiwöchiger Lernpilot",
    summary: "Die App ist erst ein gelungenes Lernprodukt, wenn die lernende Person ohne Entwicklerhilfe zurückkehrt und auf neuen Aufgaben selbständiger wird.",
    reviewer: "Lernende Person und begleitende erwachsene Person",
    checks: [
      {
        id: "pilot-three-weeks",
        label: "Mindestens drei verschiedene Kalenderwochen mit echten, nicht nur testweise erzeugten Lernrunden beobachtet.",
      },
      {
        id: "pilot-uncoached",
        label: "Mehrere Lektionen/Reviews ohne Bedien- oder Lösungscoaching durch die entwickelnde Person abgeschlossen.",
      },
      {
        id: "pilot-panel",
        label: "Geschützte Pilotübersicht gegen die beobachteten Kalenderwochen, aktiven Tage, abgeschlossenen Runden, unabhängigen Antworten und begrenzten Lernsignale geprüft.",
      },
      {
        id: "pilot-assessments",
        label: "Mindestens zwei periodische Standortbestimmungen abgeschlossen und erste/letzte unabhängige Antwortquote anhand der Aufgabenbelege verglichen, ohne eine Veränderung automatisch als Verbesserung oder Ursache zu bezeichnen.",
      },
      {
        id: "pilot-unseen-evidence",
        label: "Mindestens eine wirklich ungesehene papiernahe Aufgabe ausserhalb des wiederverwendeten Trainingspfads beobachtet und mit einem datensparsamen Ergebnis oder Reviewer-Hinweis dokumentiert.",
      },
      {
        id: "pilot-confusion-loop",
        label: "Gemeldete Unklarheiten gemeinsam angesehen, die wichtigsten ein bis zwei Produktpunkte geändert und mit frischen Aufgaben erneut beobachtet.",
      },
      {
        id: "pilot-return-decision",
        label: "Die lernende Person wollte freiwillig zurückkehren; Fortführung, Änderung oder Abbruch wurde ohne Druck besprochen und dokumentiert.",
      },
    ],
  },
  {
    id: "operator-legal",
    eyebrow: "VOR ÖFFENTLICHER FREIGABE",
    title: "Betreiber-, Datenschutz- und Inhaltsrechte",
    summary: "Technische Sicherheit ersetzt keine verantwortliche Betreiberangabe oder landesspezifische rechtliche Prüfung.",
    reviewer: "Verantwortliche Betreiberperson mit geeigneter externer Rechts-/Datenschutzprüfung",
    checks: [
      {
        id: "legal-operator-contact",
        label: "Verantwortliche Betreiberperson und funktionierender Kontaktweg festgelegt.",
      },
      {
        id: "legal-privacy-review",
        label: "Datenschutz, Minderjährige, lokale Datenhaltung, Hosting-Anfragen, Export/Löschung und optionale spätere Dienste fachkundig geprüft.",
      },
      {
        id: "legal-content-rights",
        label: "Rechte und zulässige Nutzung von Namen, Aufgabenformaten, Quellenhinweisen, privaten Original-PDFs und eigenen Varianten geklärt.",
      },
      {
        id: "legal-public-copy",
        label: "Datenschutz-/Betreibertexte aktualisiert; technische-Vorschau-Qualifikation und Suchmaschinen-Sperre erst nach Freigabe bewusst entfernt.",
      },
    ],
  },
] as const

export type ReleaseReadinessSectionId = (typeof releaseReadinessSections)[number]["id"]
export type ReleaseReadinessCheckId = (typeof releaseReadinessSections)[number]["checks"][number]["id"]

export interface ReleaseReadinessRecord {
  version: typeof RELEASE_READINESS_VERSION
  completedAtByCheck: Partial<Record<ReleaseReadinessCheckId, string>>
  buildIdByCheck: Partial<Record<ReleaseReadinessCheckId, string>>
  updatedAt: string
}

export interface ReleaseRuntimeEvidence {
  capturedAt: string
  buildId: string
  location: string
  standalone: boolean
  serviceWorkerControlled: boolean
  online: boolean
  viewport: string
  userAgent: string
}

const checkIds = new Set<ReleaseReadinessCheckId>(
  releaseReadinessSections.flatMap((section) => section.checks.map((check) => check.id)),
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}

function isBuildId(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 160 &&
    !/[\r\n]/u.test(value)
}

export function isTraceableReleaseBuild(buildId: string): boolean {
  return isBuildId(buildId) &&
    !buildId.endsWith("-dirty") &&
    !buildId.startsWith("unversioned-")
}

export function createReleaseReadinessRecord(
  now = new Date(),
): ReleaseReadinessRecord {
  return {
    version: RELEASE_READINESS_VERSION,
    completedAtByCheck: {},
    buildIdByCheck: {},
    updatedAt: now.toISOString(),
  }
}

export function normalizeReleaseReadinessRecord(
  value: unknown,
  now = new Date(),
): ReleaseReadinessRecord {
  if (
    !isRecord(value) ||
    value.version !== RELEASE_READINESS_VERSION ||
    !isRecord(value.completedAtByCheck)
  ) {
    return createReleaseReadinessRecord(now)
  }

  const completedAtByCheck: Partial<Record<ReleaseReadinessCheckId, string>> = {}
  for (const [id, completedAt] of Object.entries(value.completedAtByCheck)) {
    if (checkIds.has(id as ReleaseReadinessCheckId) && isDateString(completedAt)) {
      completedAtByCheck[id as ReleaseReadinessCheckId] = completedAt
    }
  }

  const buildIdByCheck: Partial<Record<ReleaseReadinessCheckId, string>> = {}
  if (isRecord(value.buildIdByCheck)) {
    for (const [id, buildId] of Object.entries(value.buildIdByCheck)) {
      if (
        completedAtByCheck[id as ReleaseReadinessCheckId] &&
        isBuildId(buildId)
      ) {
        buildIdByCheck[id as ReleaseReadinessCheckId] = buildId
      }
    }
  }

  return {
    version: RELEASE_READINESS_VERSION,
    completedAtByCheck,
    buildIdByCheck,
    updatedAt: isDateString(value.updatedAt) ? value.updatedAt : now.toISOString(),
  }
}

export function setReleaseReadinessCheck(
  record: ReleaseReadinessRecord,
  checkId: ReleaseReadinessCheckId,
  complete: boolean,
  now = new Date(),
  buildId?: string,
): ReleaseReadinessRecord {
  const completedAtByCheck = { ...record.completedAtByCheck }
  const buildIdByCheck = { ...record.buildIdByCheck }
  if (complete) {
    completedAtByCheck[checkId] = now.toISOString()
    if (isBuildId(buildId)) buildIdByCheck[checkId] = buildId
    else delete buildIdByCheck[checkId]
  } else {
    delete completedAtByCheck[checkId]
    delete buildIdByCheck[checkId]
  }

  return {
    version: RELEASE_READINESS_VERSION,
    completedAtByCheck,
    buildIdByCheck,
    updatedAt: now.toISOString(),
  }
}

export function releaseReadinessProgress(record: ReleaseReadinessRecord): {
  completed: number
  total: number
  sectionsComplete: number
  sectionTotal: number
} {
  const completed = Object.keys(record.completedAtByCheck).filter((id) => (
    checkIds.has(id as ReleaseReadinessCheckId)
  )).length
  const sectionsComplete = releaseReadinessSections.filter((section) => (
    section.checks.every((check) => Boolean(record.completedAtByCheck[check.id]))
  )).length

  return {
    completed,
    total: checkIds.size,
    sectionsComplete,
    sectionTotal: releaseReadinessSections.length,
  }
}

export function releaseReadinessFilename(now = new Date()): string {
  return `gymiquest-freigabeprotokoll-${now.toISOString().slice(0, 10)}.md`
}

export function buildReleaseReadinessMarkdown(
  record: ReleaseReadinessRecord,
  runtime: ReleaseRuntimeEvidence,
): string {
  const progress = releaseReadinessProgress(record)
  const sections = releaseReadinessSections.map((section) => {
    const checks = section.checks.map((check) => {
      const completedAt = record.completedAtByCheck[check.id]
      const buildId = record.buildIdByCheck[check.id]
      return `- [${completedAt ? "x" : " "}] ${check.label}${completedAt ? `\n  - Lokal erfasst: ${completedAt}\n  - Getesteter Build: ${buildId ?? "nicht erfasst (älterer Protokolleintrag)"}` : ""}`
    }).join("\n")

    return [
      `## ${section.title}`,
      "",
      section.summary,
      "",
      `Erforderliche Rolle: ${section.reviewer}`,
      "",
      checks,
      "",
      "Reviewer/Verantwortung: ",
      "Datum: ",
      "Abweichungen und Belege: ",
    ].join("\n")
  }).join("\n\n")

  return [
    "# GymiQuest Freigabeprotokoll",
    "",
    `Erzeugt: ${runtime.capturedAt}`,
    `Lokal erfasste Punkte: ${progress.completed}/${progress.total}`,
    `Vollständig erfasste Bereiche: ${progress.sectionsComplete}/${progress.sectionTotal}`,
    "",
    "> Wichtige Grenze: Lokale Haken dokumentieren eine Behauptung, nicht deren Wahrheit oder Unabhängigkeit. Dieses Protokoll ersetzt weder die Prüfung durch eine zweite fachkundige Person noch den echten iPad-Test, den Lernpilot oder Rechtsberatung.",
    "",
    "Das Protokoll enthält absichtlich keinen Spitznamen, keine Antworten, keine XP und keinen Lernverlauf.",
    "",
    "## Laufzeitaufnahme",
    "",
    `- Build: ${runtime.buildId}`,
    `- Sauberer, nachvollziehbarer Build: ${isTraceableReleaseBuild(runtime.buildId) ? "ja" : "nein – lokale Haken nicht als Freigabebeleg übernehmen"}`,
    `- URL: ${runtime.location}`,
    `- Eigenständiges App-Fenster erkannt: ${runtime.standalone ? "ja" : "nein"}`,
    `- Service Worker kontrolliert die Seite: ${runtime.serviceWorkerControlled ? "ja" : "nein"}`,
    `- Browser meldet online: ${runtime.online ? "ja" : "nein"}`,
    `- Viewport: ${runtime.viewport}`,
    `- User Agent: ${runtime.userAgent}`,
    "",
    sections,
    "",
    "## Freigabeentscheidung",
    "",
    "Entscheidung: technische Vorschau / Familienpilot / öffentliche Freigabe / nicht freigegeben",
    "Verantwortliche Person: ",
    "Datum: ",
    "Begründung und offene Punkte: ",
    "",
  ].join("\n")
}
