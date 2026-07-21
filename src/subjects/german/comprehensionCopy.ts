import type { AppLocale } from "../../i18n/localization"
import type { GermanComprehensionEvidenceStatus } from "./comprehension"

export interface GermanComprehensionUiCopy {
  homeEyebrow: string
  homeTitle: string
  homeBody: string
  start: string
  resume: string
  waitingTitle: string
  waitingBody: string
  feedbackTitle: string
  resolvedTitle: string
  noScore: string
  back: string
  practiceEyebrow: string
  practiceTitle: string
  practiceBody: string
  passage: string
  question: string
  evidenceLegend: string
  evidenceHint: string
  evidenceLimit: string
  lineLabel: (line: number) => string
  answerLabel: string
  answerPlaceholder: string
  characters: (count: number, maximum: number) => string
  submit: string
  submitHint: string
  selectedLines: (lines: readonly number[]) => string
  status: Record<GermanComprehensionEvidenceStatus, string>
  strength: string
  nextStep: string
  acknowledge: string
  acknowledged: string
  blocked: string
}

const de: GermanComprehensionUiCopy = {
  homeEyebrow: "KURZANTWORT · MENSCHLICH GEPRÜFT",
  homeTitle: "Einen Textbeleg selbst formulieren",
  homeBody: "Schreibe eine kurze Erklärung und markiere höchstens zwei Belegzeilen. Eine erwachsene Person prüft den Zusammenhang; GymiQuest vergibt keine Scheinpunkte.",
  start: "Kurzantwort beginnen",
  resume: "Kurzantwort fortsetzen",
  waitingTitle: "Deine Antwort wartet auf Rückmeldung",
  waitingBody: "Du kannst normal weiterlernen. Eine neue Kurzantwort wird erst nach der gemeinsamen Rückmeldung geöffnet.",
  feedbackTitle: "Rückmeldung zu deiner Kurzantwort",
  resolvedTitle: "Rückmeldung besprochen",
  noScore: "Keine Punkte, keine Note, kein XP und keine Lernstandsänderung",
  back: "Zurück zum Lernplan",
  practiceEyebrow: "LESEVERSTÄNDNIS · KURZANTWORT",
  practiceTitle: "Erkläre den Zusammenhang mit einem Textbeleg",
  practiceBody: "Antworte in vollständigen Sätzen. Markiere danach die ein oder zwei Zeilen, auf die sich deine Erklärung stützt.",
  passage: "Text",
  question: "Auftrag",
  evidenceLegend: "Deine Belegzeilen",
  evidenceHint: "Wähle mindestens eine und höchstens zwei Zeilen.",
  evidenceLimit: "Mehr als zwei Zeilen sind hier nicht nötig.",
  lineLabel: (line) => `Zeile ${line}`,
  answerLabel: "Deine Erklärung",
  answerPlaceholder: "Schreibe hier mindestens einen vollständigen Satz …",
  characters: (count, maximum) => `${count}/${maximum} Zeichen`,
  submit: "Zur Rückmeldung abgeben",
  submitHint: "Die Antwort wird lokal gespeichert und nur in der geschützten Begleitansicht geprüft.",
  selectedLines: (lines) => lines.length ? `Gewählte Zeilen: ${lines.join(", ")}` : "Noch keine Belegzeile gewählt",
  status: {
    "well-supported": "Gut mit dem Text belegt",
    "partly-supported": "Teilweise belegt",
    "not-yet-supported": "Noch nicht ausreichend belegt",
  },
  strength: "Das trägt schon",
  nextStep: "Nächster Schritt",
  acknowledge: "Rückmeldung besprochen",
  acknowledged: "Diese Rückmeldung ist abgeschlossen. Eine neue Kurzantwort ist bereit.",
  blocked: "Beende zuerst die laufende Deutsch-Aktivität.",
}

const en: GermanComprehensionUiCopy = {
  ...de,
  homeEyebrow: "SHORT RESPONSE · HUMAN REVIEW",
  homeTitle: "Write your own text-based explanation",
  homeBody: "Write a short explanation and mark at most two evidence lines. An adult reviews the connection; GymiQuest invents no points.",
  start: "Begin short response",
  resume: "Resume short response",
  waitingTitle: "Your response is waiting for feedback",
  waitingBody: "You can keep learning normally. A new short response opens after you discuss this feedback together.",
  feedbackTitle: "Feedback on your short response",
  resolvedTitle: "Feedback discussed",
  noScore: "No points, grade, XP, or mastery change",
  back: "Back to learning plan",
  practiceEyebrow: "READING COMPREHENSION · SHORT RESPONSE",
  practiceTitle: "Explain the connection with text evidence",
  practiceBody: "Answer in complete sentences. Then mark the one or two lines that support your explanation.",
  passage: "Text",
  question: "Prompt",
  evidenceLegend: "Your evidence lines",
  evidenceHint: "Choose at least one and at most two lines.",
  evidenceLimit: "You do not need more than two lines here.",
  lineLabel: (line) => `Line ${line}`,
  answerLabel: "Your explanation",
  answerPlaceholder: "Write at least one complete sentence here …",
  characters: (count, maximum) => `${count}/${maximum} characters`,
  submit: "Send for feedback",
  submitHint: "The response stays local and is reviewed only in the protected companion view.",
  selectedLines: (lines) => lines.length ? `Selected lines: ${lines.join(", ")}` : "No evidence line selected yet",
  status: {
    "well-supported": "Well supported by the text",
    "partly-supported": "Partly supported",
    "not-yet-supported": "Not sufficiently supported yet",
  },
  strength: "What already works",
  nextStep: "Next step",
  acknowledge: "We discussed this feedback",
  acknowledged: "This feedback is complete. A new short response is ready.",
  blocked: "Finish the current German activity first.",
}

const it: GermanComprehensionUiCopy = {
  ...en,
  homeEyebrow: "RISPOSTA BREVE · REVISIONE UMANA",
  homeTitle: "Formula una spiegazione basata sul testo",
  homeBody: "Scrivi una breve spiegazione e indica al massimo due righe come prova. Un adulto controlla il collegamento; GymiQuest non inventa punti.",
  start: "Inizia risposta breve",
  resume: "Continua risposta breve",
  waitingTitle: "La risposta attende un riscontro",
  waitingBody: "Puoi continuare normalmente. Una nuova risposta si apre dopo aver discusso insieme il riscontro.",
  feedbackTitle: "Riscontro sulla risposta breve",
  resolvedTitle: "Riscontro discusso",
  noScore: "Nessun punto, voto, XP o modifica della padronanza",
  back: "Torna al piano",
  practiceEyebrow: "COMPRENSIONE · RISPOSTA BREVE",
  practiceTitle: "Spiega il collegamento con prove dal testo",
  practiceBody: "Rispondi con frasi complete, poi indica una o due righe che sostengono la spiegazione.",
  passage: "Testo",
  question: "Consegna",
  evidenceLegend: "Righe scelte come prova",
  evidenceHint: "Scegli almeno una e al massimo due righe.",
  evidenceLimit: "Non servono più di due righe.",
  lineLabel: (line) => `Riga ${line}`,
  answerLabel: "La tua spiegazione",
  answerPlaceholder: "Scrivi qui almeno una frase completa …",
  characters: (count, maximum) => `${count}/${maximum} caratteri`,
  submit: "Invia per il riscontro",
  submitHint: "La risposta resta locale ed è visibile solo nell'area protetta.",
  selectedLines: (lines) => lines.length ? `Righe scelte: ${lines.join(", ")}` : "Nessuna riga ancora scelta",
  status: {
    "well-supported": "Ben sostenuta dal testo",
    "partly-supported": "Sostenuta in parte",
    "not-yet-supported": "Non ancora sostenuta a sufficienza",
  },
  strength: "Ciò che funziona già",
  nextStep: "Prossimo passo",
  acknowledge: "Abbiamo discusso il riscontro",
  acknowledged: "Questo riscontro è concluso. È pronta una nuova risposta breve.",
  blocked: "Concludi prima l'attività di tedesco in corso.",
}

const es: GermanComprehensionUiCopy = {
  ...en,
  homeEyebrow: "RESPUESTA BREVE · REVISIÓN HUMANA",
  homeTitle: "Formula una explicación basada en el texto",
  homeBody: "Escribe una explicación breve y marca como máximo dos líneas de evidencia. Un adulto revisa la relación; GymiQuest no inventa puntos.",
  start: "Empezar respuesta breve",
  resume: "Continuar respuesta breve",
  waitingTitle: "Tu respuesta espera comentarios",
  waitingBody: "Puedes seguir aprendiendo con normalidad. Se abre otra respuesta después de comentar juntos esta devolución.",
  feedbackTitle: "Comentarios sobre tu respuesta",
  resolvedTitle: "Comentarios tratados",
  noScore: "Sin puntos, nota, XP ni cambio de dominio",
  back: "Volver al plan",
  practiceEyebrow: "COMPRENSIÓN · RESPUESTA BREVE",
  practiceTitle: "Explica la relación con evidencia del texto",
  practiceBody: "Responde con oraciones completas y marca una o dos líneas que apoyen tu explicación.",
  passage: "Texto",
  question: "Consigna",
  evidenceLegend: "Líneas de evidencia",
  evidenceHint: "Elige al menos una y como máximo dos líneas.",
  evidenceLimit: "Aquí no necesitas más de dos líneas.",
  lineLabel: (line) => `Línea ${line}`,
  answerLabel: "Tu explicación",
  answerPlaceholder: "Escribe aquí al menos una oración completa …",
  characters: (count, maximum) => `${count}/${maximum} caracteres`,
  submit: "Enviar para revisión",
  submitHint: "La respuesta queda local y solo se revisa en la vista protegida.",
  selectedLines: (lines) => lines.length ? `Líneas elegidas: ${lines.join(", ")}` : "Aún no has elegido una línea",
  status: {
    "well-supported": "Bien respaldada por el texto",
    "partly-supported": "Respaldada en parte",
    "not-yet-supported": "Todavía no suficientemente respaldada",
  },
  strength: "Lo que ya funciona",
  nextStep: "Siguiente paso",
  acknowledge: "Hemos comentado esta devolución",
  acknowledged: "Esta devolución está cerrada. Ya puedes hacer otra respuesta breve.",
  blocked: "Termina primero la actividad de alemán en curso.",
}

export const germanComprehensionUiCopy: Record<AppLocale, GermanComprehensionUiCopy> = {
  de,
  en,
  it,
  es,
}
