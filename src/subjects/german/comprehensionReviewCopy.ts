import type { AppLocale } from "../../i18n/localization"
import type { GermanComprehensionEvidenceStatus } from "./comprehension"

export interface GermanComprehensionReviewUiCopy {
  eyebrow: string
  title: string
  body: string
  empty: string
  pending: string
  reviewed: string
  resolved: string
  prompt: string
  learnerResponse: string
  selectedEvidence: (lines: readonly number[]) => string
  reviewGuide: string
  expectedElements: string
  suggestedLines: (lines: readonly number[]) => string
  statusLegend: string
  statuses: Record<GermanComprehensionEvidenceStatus, string>
  strength: string
  strengthHint: string
  nextStep: string
  nextStepHint: string
  save: string
  saved: string
  boundary: string
}

const de: GermanComprehensionReviewUiCopy = {
  eyebrow: "KURZANTWORTEN · GEMEINSAME RÜCKMELDUNG",
  title: "Textbelege menschlich prüfen",
  body: "Prüfe, ob Erklärung und markierte Zeilen zusammenpassen. Die Rückmeldung erzeugt weder Punkte noch Lernstandsänderungen.",
  empty: "Noch keine Kurzantwort wartet auf Rückmeldung.",
  pending: "Offen",
  reviewed: "Rückmeldung bereit",
  resolved: "Besprochen",
  prompt: "Auftrag und Text",
  learnerResponse: "Antwort der lernenden Person",
  selectedEvidence: (lines) => `Markierte Zeilen: ${lines.join(", ")}`,
  reviewGuide: "Autorenhinweise für die Prüfung",
  expectedElements: "Mögliche tragende Elemente",
  suggestedLines: (lines) => `Naheliegende Belegzeilen: ${lines.join(", ")}`,
  statusLegend: "Wie gut trägt der Text die Antwort?",
  statuses: {
    "well-supported": "Gut mit dem Text belegt",
    "partly-supported": "Teilweise belegt",
    "not-yet-supported": "Noch nicht ausreichend belegt",
  },
  strength: "Eine konkrete Stärke",
  strengthHint: "Benenne genau, was die Antwort bereits trägt.",
  nextStep: "Ein nächster Schritt",
  nextStepHint: "Formuliere eine kleine, überprüfbare Verbesserung.",
  save: "Rückmeldung speichern",
  saved: "Lokal gespeichert",
  boundary: "Menschliche Rückmeldung · keine Punkte, Note, XP oder automatische Lernwirkung",
}

const en: GermanComprehensionReviewUiCopy = {
  ...de,
  eyebrow: "SHORT RESPONSES · SHARED FEEDBACK",
  title: "Review text evidence as a human",
  body: "Check whether the explanation and selected lines support each other. Feedback creates neither points nor mastery changes.",
  empty: "No short response is waiting for feedback yet.",
  pending: "Pending",
  reviewed: "Feedback ready",
  resolved: "Discussed",
  prompt: "Prompt and text",
  learnerResponse: "Learner response",
  selectedEvidence: (lines) => `Selected lines: ${lines.join(", ")}`,
  reviewGuide: "Author guidance for review",
  expectedElements: "Possible supporting elements",
  suggestedLines: (lines) => `Likely evidence lines: ${lines.join(", ")}`,
  statusLegend: "How well does the text support the response?",
  statuses: {
    "well-supported": "Well supported by the text",
    "partly-supported": "Partly supported",
    "not-yet-supported": "Not sufficiently supported yet",
  },
  strength: "One concrete strength",
  strengthHint: "Name exactly what the response already does well.",
  nextStep: "One next step",
  nextStepHint: "Give one small, checkable improvement.",
  save: "Save feedback",
  saved: "Saved locally",
  boundary: "Human feedback · no points, grade, XP, or automatic learning effect",
}

const it: GermanComprehensionReviewUiCopy = {
  ...en,
  eyebrow: "RISPOSTE BREVI · RISCONTRO CONDIVISO",
  title: "Controlla le prove nel testo",
  body: "Verifica se spiegazione e righe scelte si sostengono. Il riscontro non crea punti né modifica la padronanza.",
  empty: "Nessuna risposta breve attende ancora un riscontro.",
  pending: "Da rivedere",
  reviewed: "Riscontro pronto",
  resolved: "Discusso",
  prompt: "Consegna e testo",
  learnerResponse: "Risposta",
  selectedEvidence: (lines) => `Righe scelte: ${lines.join(", ")}`,
  reviewGuide: "Indicazioni dell'autore",
  expectedElements: "Possibili elementi portanti",
  suggestedLines: (lines) => `Righe probabili: ${lines.join(", ")}`,
  statusLegend: "Quanto è sostenuta dal testo?",
  statuses: {
    "well-supported": "Ben sostenuta dal testo",
    "partly-supported": "Sostenuta in parte",
    "not-yet-supported": "Non ancora sostenuta a sufficienza",
  },
  strength: "Un punto di forza concreto",
  strengthHint: "Indica esattamente ciò che funziona già.",
  nextStep: "Un prossimo passo",
  nextStepHint: "Proponi un piccolo miglioramento verificabile.",
  save: "Salva riscontro",
  saved: "Salvato in locale",
  boundary: "Riscontro umano · nessun punto, voto, XP o effetto automatico",
}

const es: GermanComprehensionReviewUiCopy = {
  ...en,
  eyebrow: "RESPUESTAS BREVES · DEVOLUCIÓN COMPARTIDA",
  title: "Revisar la evidencia del texto",
  body: "Comprueba si la explicación y las líneas elegidas se apoyan. La devolución no crea puntos ni cambia el dominio.",
  empty: "Todavía no hay respuestas breves pendientes.",
  pending: "Pendiente",
  reviewed: "Comentarios listos",
  resolved: "Comentado",
  prompt: "Consigna y texto",
  learnerResponse: "Respuesta",
  selectedEvidence: (lines) => `Líneas elegidas: ${lines.join(", ")}`,
  reviewGuide: "Guía de autor para revisar",
  expectedElements: "Posibles elementos de apoyo",
  suggestedLines: (lines) => `Líneas probables: ${lines.join(", ")}`,
  statusLegend: "¿Hasta qué punto respalda el texto la respuesta?",
  statuses: {
    "well-supported": "Bien respaldada por el texto",
    "partly-supported": "Respaldada en parte",
    "not-yet-supported": "Aún no suficientemente respaldada",
  },
  strength: "Un punto fuerte concreto",
  strengthHint: "Indica exactamente qué funciona ya.",
  nextStep: "Un siguiente paso",
  nextStepHint: "Propón una mejora pequeña y comprobable.",
  save: "Guardar comentarios",
  saved: "Guardado localmente",
  boundary: "Devolución humana · sin puntos, nota, XP ni efecto automático",
}

export const germanComprehensionReviewUiCopy: Record<AppLocale, GermanComprehensionReviewUiCopy> = {
  de,
  en,
  it,
  es,
}
