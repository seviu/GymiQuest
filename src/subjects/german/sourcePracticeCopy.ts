import type { AppLocale } from "../../i18n/localization"
import type {
  GermanSourceLanguageReviewStatus,
  GermanSourcePracticeMode,
  GermanSourceWritingReviewCheck,
} from "./sourcePractice"

export interface GermanSourcePracticeUiCopy {
  startLanguage: string
  startWriting: string
  resumeLanguage: string
  resumeWriting: string
  missingLanguage: string
  missingWriting: string
  blocked: string
  latest: (mode: GermanSourcePracticeMode, year: number) => string
  modeNames: Record<GermanSourcePracticeMode, string>
  back: string
  sourcePractice: string
  noScore: string
  workingBoundary: Record<GermanSourcePracticeMode, string>
  reviewBoundary: string
  remaining: string
  submit: string
  submitTitle: string
  submitBody: string
  cancel: string
  submitNow: string
  timeout: string
  documentTabs: string
  pageNavigation: string
  previousPage: string
  nextPage: string
  pageOf: (page: number, total: number) => string
  writingTitle: string
  writingTitlePlaceholder: string
  writingDraft: string
  writingDraftPlaceholder: string
  words: (count: number) => string
  writingPrivacy: string
  languageReviewTitle: string
  languageReviewBody: string
  languageReviewStatuses: Record<GermanSourceLanguageReviewStatus, string>
  writingReviewTitle: string
  writingReviewBody: string
  writingReviewChecks: Record<GermanSourceWritingReviewCheck, string>
  complete: string
  completeHint: string
  saved: string
  missingSource: string
}

const de: GermanSourcePracticeUiCopy = {
  startLanguage: "45-Min.-Sprachprüfung üben",
  startWriting: "60-Min.-Aufsatz üben",
  resumeLanguage: "Sprachprüfung fortsetzen",
  resumeWriting: "Aufsatz fortsetzen",
  missingLanguage: "Sprachprüfung, Textblatt und Lösungen importieren",
  missingWriting: "Aufsatzthemen importieren",
  blocked: "Zuerst die laufende Deutsch-Aktivität beenden",
  latest: (mode, year) => `Letzte Quellenübung: ${mode === "language-exam" ? "Sprachprüfung" : "Aufsatz"} ${year}`,
  modeNames: { "language-exam": "Sprachprüfung", writing: "Aufsatz" },
  back: "Zurück zum Lernplan",
  sourcePractice: "ORIGINALQUELLE · ZEITÜBUNG",
  noScore: "Keine Punkte, keine Note und kein XP",
  workingBoundary: {
    "language-exam": "Arbeite wie auf Papier. Die Lösungen bleiben bis zur Abgabe gesperrt.",
    writing: "Arbeite wie in der Prüfung. Titel und Aufsatz werden während der Schreibzeit lokal gespeichert.",
  },
  reviewBoundary: "Vergleiche nur so weit, wie die Quelle es erlaubt. GymiQuest bewertet weder Methode noch Sprache automatisch.",
  remaining: "Verbleibende Zeit",
  submit: "Abgeben",
  submitTitle: "Zeitübung jetzt abgeben?",
  submitBody: "Die Arbeitsphase endet. Danach läuft die Uhr nicht weiter und die Abgabe kann nicht zurückgenommen werden.",
  cancel: "Weiterarbeiten",
  submitNow: "Jetzt abgeben",
  timeout: "Die Arbeitszeit ist abgelaufen. Die Übung wurde automatisch abgegeben.",
  documentTabs: "Quelldokument wählen",
  pageNavigation: "PDF-Seitennavigation",
  previousPage: "Vorherige Seite",
  nextPage: "Nächste Seite",
  pageOf: (page, total) => `Seite ${page} von ${total}`,
  writingTitle: "Titel",
  writingTitlePlaceholder: "Dein Titel",
  writingDraft: "Dein Aufsatz",
  writingDraftPlaceholder: "Hier schreiben …",
  words: (count) => `${count} Wörter`,
  writingPrivacy: "Titel und Text werden lokal automatisch gespeichert und können in die verschlüsselte Lernstand-Sicherung aufgenommen werden. Der Original-PDF-Inhalt wird nie mitgesichert.",
  languageReviewTitle: "Ehrlicher Vergleich ohne Scheinpunkte",
  languageReviewBody: "Sieh die Lösungen durch und wähle eine einzige Aussage für die ganze Übung. Das ist eine Selbstreflexion, keine Korrektur und kein Lernsignal.",
  languageReviewStatuses: {
    "mostly-matches": "Die meisten Endergebnisse stimmen überein",
    "mixed-or-unclear": "Gemischt oder nicht eindeutig vergleichbar",
    "not-compared": "Noch nicht sinnvoll verglichen",
  },
  writingReviewTitle: "Kurzer Selbstcheck",
  writingReviewBody: "Markiere nur, was du tatsächlich geprüft hast. Die Haken erzeugen keine Bewertung.",
  writingReviewChecks: {
    "title-fit": "Der Titel passt zum gewählten Thema",
    "clear-structure": "Anfang, Hauptteil und Schluss sind erkennbar",
    "task-complete": "Alle Aufgabenteile sind bearbeitet",
    paragraphs: "Die Absätze helfen beim Lesen",
    language: "Zeitform und Perspektive bleiben stimmig",
    proofread: "Rechtschreibung und Satzzeichen wurden geprüft",
  },
  complete: "Quellenübung abschliessen",
  completeHint: "Der Abschluss speichert nur Zeit, Selbstcheck und bei Aufsätzen deinen Text – ohne Punkte oder Lernwirkung.",
  saved: "Lokal automatisch gespeichert",
  missingSource: "Ein benötigtes Quelldokument fehlt auf diesem Gerät.",
}

const en: GermanSourcePracticeUiCopy = {
  ...de,
  startLanguage: "Practise 45-min language exam",
  startWriting: "Practise 60-min essay",
  resumeLanguage: "Resume language exam",
  resumeWriting: "Resume essay",
  missingLanguage: "Import language exam, text sheet, and solutions",
  missingWriting: "Import essay prompts",
  blocked: "Finish the current German activity first",
  latest: (mode, year) => `Latest source practice: ${mode === "language-exam" ? "language exam" : "essay"} ${year}`,
  modeNames: { "language-exam": "Language exam", writing: "Essay" },
  back: "Back to learning plan",
  sourcePractice: "ORIGINAL SOURCE · TIMED PRACTICE",
  noScore: "No points, grade, or XP",
  workingBoundary: {
    "language-exam": "Work as you would on paper. Solutions stay locked until submission.",
    writing: "Work as you would in the exam. Your title and essay autosave locally during writing time.",
  },
  reviewBoundary: "Compare only what the source supports. GymiQuest does not automatically judge method or language.",
  remaining: "Time remaining",
  submit: "Submit",
  submitTitle: "Submit this timed practice now?",
  submitBody: "The working phase will end. The clock will stop and submission cannot be undone.",
  cancel: "Keep working",
  submitNow: "Submit now",
  timeout: "Working time has ended. The practice was submitted automatically.",
  documentTabs: "Choose source document",
  pageNavigation: "PDF page navigation",
  previousPage: "Previous page",
  nextPage: "Next page",
  pageOf: (page, total) => `Page ${page} of ${total}`,
  writingTitle: "Title",
  writingTitlePlaceholder: "Your title",
  writingDraft: "Your essay",
  writingDraftPlaceholder: "Write here …",
  words: (count) => `${count} words`,
  writingPrivacy: "Title and text autosave locally and can be included in the encrypted learning backup. Original PDF content is never backed up.",
  languageReviewTitle: "Honest comparison without invented points",
  languageReviewBody: "Review the solutions and choose one statement for the whole attempt. This is reflection, not correction or learning evidence.",
  languageReviewStatuses: {
    "mostly-matches": "Most final answers match",
    "mixed-or-unclear": "Mixed or not clearly comparable",
    "not-compared": "Not meaningfully compared yet",
  },
  writingReviewTitle: "Short self-check",
  writingReviewBody: "Mark only what you actually checked. These marks create no evaluation.",
  writingReviewChecks: {
    "title-fit": "The title fits the chosen prompt",
    "clear-structure": "Beginning, middle, and ending are clear",
    "task-complete": "Every part of the prompt is addressed",
    paragraphs: "Paragraphs support readability",
    language: "Tense and perspective remain consistent",
    proofread: "Spelling and punctuation were checked",
  },
  complete: "Finish source practice",
  completeHint: "Completion saves only time, self-check, and your essay text where relevant—without points or learning effects.",
  saved: "Autosaved locally",
  missingSource: "A required source document is missing on this device.",
}

const it: GermanSourcePracticeUiCopy = {
  ...en,
  startLanguage: "Esercita la prova linguistica (45 min)",
  startWriting: "Esercita il tema (60 min)",
  resumeLanguage: "Continua la prova linguistica",
  resumeWriting: "Continua il tema",
  missingLanguage: "Importa prova linguistica, testo e soluzioni",
  missingWriting: "Importa le tracce",
  blocked: "Concludi prima l'attività di tedesco in corso",
  latest: (mode, year) => `Ultima esercitazione su fonte: ${mode === "language-exam" ? "prova linguistica" : "tema"} ${year}`,
  modeNames: { "language-exam": "Prova linguistica", writing: "Tema" },
  back: "Torna al piano",
  sourcePractice: "FONTE ORIGINALE · PROVA A TEMPO",
  noScore: "Nessun punto, voto o XP",
  workingBoundary: {
    "language-exam": "Lavora come su carta. Le soluzioni restano bloccate fino alla consegna.",
    writing: "Lavora come all'esame. Titolo e tema vengono salvati localmente durante la prova.",
  },
  reviewBoundary: "Confronta solo ciò che la fonte permette. GymiQuest non valuta automaticamente metodo o lingua.",
  remaining: "Tempo restante",
  submit: "Consegna",
  submitTitle: "Consegnare ora?",
  submitBody: "La fase di lavoro terminerà. Il tempo si fermerà e non sarà possibile annullare la consegna.",
  cancel: "Continua",
  submitNow: "Consegna ora",
  timeout: "Il tempo è scaduto. L'esercitazione è stata consegnata automaticamente.",
  documentTabs: "Scegli documento",
  pageNavigation: "Navigazione pagine PDF",
  previousPage: "Pagina precedente",
  nextPage: "Pagina successiva",
  pageOf: (page, total) => `Pagina ${page} di ${total}`,
  writingTitle: "Titolo",
  writingTitlePlaceholder: "Il tuo titolo",
  writingDraft: "Il tuo tema",
  writingDraftPlaceholder: "Scrivi qui …",
  words: (count) => `${count} parole`,
  writingPrivacy: "Titolo e testo vengono salvati localmente e possono entrare nel backup cifrato. Il PDF originale non viene mai incluso.",
  languageReviewTitle: "Confronto onesto senza punti inventati",
  languageReviewBody: "Controlla le soluzioni e scegli una sola frase per l'intera prova. È riflessione, non correzione né prova di apprendimento.",
  languageReviewStatuses: {
    "mostly-matches": "La maggior parte dei risultati finali coincide",
    "mixed-or-unclear": "Risultato misto o non confrontabile chiaramente",
    "not-compared": "Non ancora confrontato in modo utile",
  },
  writingReviewTitle: "Breve autocontrollo",
  writingReviewBody: "Segna solo ciò che hai davvero controllato. I segni non producono valutazioni.",
  writingReviewChecks: {
    "title-fit": "Il titolo corrisponde alla traccia",
    "clear-structure": "Inizio, parte centrale e fine sono chiari",
    "task-complete": "Tutte le parti della traccia sono svolte",
    paragraphs: "I paragrafi facilitano la lettura",
    language: "Tempo verbale e prospettiva restano coerenti",
    proofread: "Ortografia e punteggiatura sono state controllate",
  },
  complete: "Concludi l'esercitazione",
  completeHint: "Vengono salvati solo tempo, autocontrollo e, per il tema, il testo: senza punti o effetti sull'apprendimento.",
  saved: "Salvato automaticamente in locale",
  missingSource: "Manca un documento necessario su questo dispositivo.",
}

const es: GermanSourcePracticeUiCopy = {
  ...en,
  startLanguage: "Practicar examen lingüístico (45 min)",
  startWriting: "Practicar redacción (60 min)",
  resumeLanguage: "Continuar examen lingüístico",
  resumeWriting: "Continuar redacción",
  missingLanguage: "Importa examen, texto y soluciones",
  missingWriting: "Importa los temas de redacción",
  blocked: "Termina primero la actividad de alemán en curso",
  latest: (mode, year) => `Última práctica con fuente: ${mode === "language-exam" ? "examen lingüístico" : "redacción"} ${year}`,
  modeNames: { "language-exam": "Examen lingüístico", writing: "Redacción" },
  back: "Volver al plan",
  sourcePractice: "FUENTE ORIGINAL · PRÁCTICA CON TIEMPO",
  noScore: "Sin puntos, nota ni XP",
  workingBoundary: {
    "language-exam": "Trabaja como en papel. Las soluciones quedan bloqueadas hasta entregar.",
    writing: "Trabaja como en el examen. El título y la redacción se guardan localmente mientras escribes.",
  },
  reviewBoundary: "Compara solo lo que permite la fuente. GymiQuest no evalúa automáticamente método ni lengua.",
  remaining: "Tiempo restante",
  submit: "Entregar",
  submitTitle: "¿Entregar ahora?",
  submitBody: "La fase de trabajo terminará. El reloj se detendrá y no se podrá deshacer la entrega.",
  cancel: "Seguir trabajando",
  submitNow: "Entregar ahora",
  timeout: "Se acabó el tiempo. La práctica se entregó automáticamente.",
  documentTabs: "Elegir documento",
  pageNavigation: "Navegación de páginas PDF",
  previousPage: "Página anterior",
  nextPage: "Página siguiente",
  pageOf: (page, total) => `Página ${page} de ${total}`,
  writingTitle: "Título",
  writingTitlePlaceholder: "Tu título",
  writingDraft: "Tu redacción",
  writingDraftPlaceholder: "Escribe aquí …",
  words: (count) => `${count} palabras`,
  writingPrivacy: "El título y el texto se guardan localmente y pueden incluirse en la copia cifrada. El PDF original nunca se incluye.",
  languageReviewTitle: "Comparación honesta sin puntos inventados",
  languageReviewBody: "Revisa las soluciones y elige una frase para todo el intento. Es reflexión, no corrección ni evidencia de aprendizaje.",
  languageReviewStatuses: {
    "mostly-matches": "La mayoría de los resultados finales coinciden",
    "mixed-or-unclear": "Resultado mixto o difícil de comparar",
    "not-compared": "Todavía no se ha comparado de forma útil",
  },
  writingReviewTitle: "Autorrevisión breve",
  writingReviewBody: "Marca solo lo que realmente revisaste. Las marcas no generan evaluación.",
  writingReviewChecks: {
    "title-fit": "El título encaja con el tema elegido",
    "clear-structure": "Inicio, desarrollo y final están claros",
    "task-complete": "Se han tratado todas las partes del tema",
    paragraphs: "Los párrafos facilitan la lectura",
    language: "El tiempo verbal y la perspectiva son coherentes",
    proofread: "Se revisaron ortografía y puntuación",
  },
  complete: "Finalizar práctica",
  completeHint: "Solo se guardan tiempo, autorrevisión y, en redacción, tu texto; sin puntos ni efectos de aprendizaje.",
  saved: "Guardado automáticamente en local",
  missingSource: "Falta un documento necesario en este dispositivo.",
}

export const germanSourcePracticeUiCopy: Record<AppLocale, GermanSourcePracticeUiCopy> = {
  de,
  en,
  it,
  es,
}
