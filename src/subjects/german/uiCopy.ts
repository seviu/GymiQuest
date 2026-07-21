import type { AppLocale } from "../../i18n/localization"

export interface GermanCourseUiCopy {
  pilot: string
  welcomeTitle: (name: string) => string
  welcomeBody: string
  startCheckFacts: readonly string[]
  startCheckStart: string
  startCheckResume: string
  startCheckTitle: string
  startCheckProgress: (current: number, total: number) => string
  startCheckSubmit: string
  startCheckResult: (correct: number, total: number) => string
  homeEyebrow: string
  homeTitle: string
  homeBody: string
  xp: string
  learned: string
  nextReview: string
  assignments: string
  lesson: string
  review: string
  assessment: string
  recommended: string
  prerequisites: string
  start: string
  resume: string
  maxXp: (xp: number) => string
  comingSoon: string
  paused: string
  pausedBody: string
  editProfile: string
  openCompanion: string
  resetOpen: string
  resetTitle: string
  resetBody: string
  resetConfirm: string
  generatedNote: string
  lessonGoal: string
  lessonStart: string
  backHome: string
  questionProgress: (current: number, total: number) => string
  passage: string
  matchingSelect: string
  submitAnswer: string
  continue: string
  correct: string
  incorrect: string
  support: string
  supportConfirm: string
  completed: string
  earned: (xp: number) => string
  assessmentResult: (correct: number, total: number) => string
  assessmentAnswerSaved: string
  mistakeReviewEyebrow: string
  mistakeReviewTitle: string
  mistakeCount: (count: number) => string
  yourAnswer: string
  correctAnswer: string
  explanation: string
  noMistakes: string
  olderReviewUnavailable: string
}

const german: GermanCourseUiCopy = {
  pilot: "DEUTSCH · PRIVATE PILOTPHASE",
  welcomeTitle: (name) => `Willkommen im Deutschtraining, ${name}.`,
  welcomeBody: "Dein Mathematikstand bleibt unverändert. Dieser kurze Start-Check ordnet nur die ersten Deutschlektionen ein und gibt weder Note noch XP.",
  startCheckFacts: ["5 kurze Aufgaben", "keine Note", "keine XP", "Deutschtexte bleiben auf Deutsch"],
  startCheckStart: "Deutsch-Start-Check beginnen",
  startCheckResume: "Start-Check fortsetzen",
  startCheckTitle: "Dein Deutsch-Start-Check",
  startCheckProgress: (current, total) => `Aufgabe ${current} von ${total}`,
  startCheckSubmit: "Antwort speichern",
  startCheckResult: (correct, total) => `${correct} von ${total} Antworten waren bereits sicher.`,
  homeEyebrow: "DEUTSCH LERNEN",
  homeTitle: "Dein Deutsch-Lernplan",
  homeBody: "Lerne mit neuen Texten und Sätzen. Reviews kommen mit anderen Formulierungen zurück, damit du wirklich übertragen kannst.",
  xp: "Deutsch-XP",
  learned: "aktive Lernfelder abgeschlossen",
  nextReview: "Nächste Wiederholung",
  assignments: "Heute für dich",
  lesson: "Lektion",
  review: "Review",
  assessment: "Standortbestimmung",
  recommended: "Aus dem Start-Check empfohlen",
  prerequisites: "Grundlagen",
  start: "Starten",
  resume: "Fortsetzen",
  maxXp: (xp) => `bis ${xp} XP`,
  comingSoon: "Folgt in der nächsten Ausbaustufe",
  paused: "Pausiert – Erklärung offen",
  pausedBody: "Aus diesem Lernfeld erscheinen keine neuen Aufgaben, bis die Begleitperson es wieder öffnet.",
  editProfile: "Profil und Einstellungen",
  openCompanion: "Begleitansicht",
  resetOpen: "Deutsch-Lernstand zurücksetzen",
  resetTitle: "Nur Deutsch zurücksetzen?",
  resetBody: "Deutsch-XP, Lektionen, Reviews, Prüfungen, Schreibtexte, Überarbeitungen, Kurzantworten und menschliche Rückmeldungen werden gelöscht. Mathematik, Profil, Begleitpersonen-PIN, importierte PDFs und App-Einstellungen bleiben erhalten.",
  resetConfirm: "Deutsch zurücksetzen",
  generatedNote: "Alle Pilotaufgaben stammen aus versionierten, neu verfassten Texten und Vorlagen.",
  lessonGoal: "Lernziel",
  lessonStart: "Mit neuen Aufgaben üben",
  backHome: "Zum Deutsch-Lernplan",
  questionProgress: (current, total) => `Aufgabe ${current} von ${total}`,
  passage: "Text",
  matchingSelect: "Zuordnung wählen",
  submitAnswer: "Antwort prüfen",
  continue: "Weiter",
  correct: "Genau – dieser Beleg passt.",
  incorrect: "Noch nicht. Prüfe die entscheidende Stelle noch einmal.",
  support: "Ich verstehe dieses Thema noch nicht",
  supportConfirm: "Das Lernfeld wurde pausiert und erscheint in der Begleitpersonen-Liste.",
  completed: "Runde abgeschlossen",
  earned: (xp) => `${xp} Deutsch-XP gesammelt`,
  assessmentResult: (correct, total) => `${correct} von ${total} Aufgaben sicher · fehlende Lernfelder kommen als Review zurück`,
  assessmentAnswerSaved: "Antwort gespeichert. Die Auswertung erscheint nach der letzten Aufgabe.",
  mistakeReviewEyebrow: "FEHLER-RÜCKBLICK",
  mistakeReviewTitle: "Hier siehst du genau, wo die Fehler waren",
  mistakeCount: (count) => `${count} Fehler`,
  yourAnswer: "Deine Antwort",
  correctAnswer: "Richtige Antwort",
  explanation: "Warum",
  noMistakes: "Keine Fehler – alle Antworten waren sicher.",
  olderReviewUnavailable: "Für diese ältere Runde wurde noch kein Aufgaben-Rückblick gespeichert.",
}

const english: GermanCourseUiCopy = {
  ...german,
  pilot: "GERMAN · PRIVATE PILOT",
  welcomeTitle: (name) => `Welcome to German practice, ${name}.`,
  welcomeBody: "Your mathematics progress stays unchanged. This short start check only places the first German lessons and awards neither a grade nor XP.",
  startCheckFacts: ["5 short questions", "no grade", "no XP", "German learning text stays in German"],
  startCheckStart: "Begin German start check",
  startCheckResume: "Continue start check",
  startCheckTitle: "Your German start check",
  startCheckProgress: (current, total) => `Question ${current} of ${total}`,
  startCheckSubmit: "Save answer",
  startCheckResult: (correct, total) => `${correct} of ${total} answers were already secure.`,
  homeEyebrow: "LEARN GERMAN",
  homeTitle: "Your German learning plan",
  homeBody: "Learn with fresh texts and sentences. Reviews return with different wording so that you practise transfer, not memory.",
  xp: "German XP",
  learned: "active skills completed",
  nextReview: "Next review",
  assignments: "For you today",
  lesson: "Lesson",
  review: "Review",
  assessment: "Assessment",
  recommended: "Recommended from your start check",
  prerequisites: "Prerequisites",
  start: "Start",
  resume: "Continue",
  maxXp: (xp) => `up to ${xp} XP`,
  comingSoon: "Coming in the next expansion",
  paused: "Paused – explanation requested",
  pausedBody: "No new tasks from this skill appear until the companion reopens it.",
  editProfile: "Profile and settings",
  openCompanion: "Companion view",
  resetOpen: "Reset German progress",
  resetTitle: "Reset German only?",
  resetBody: "German XP, lessons, reviews, exams, writing, revisions, short responses, and human feedback are removed. Mathematics, your profile, companion PIN, imported PDFs, and app settings remain.",
  resetConfirm: "Reset German",
  generatedNote: "Every pilot task comes from versioned, newly authored texts and templates.",
  lessonGoal: "Learning goal",
  lessonStart: "Practise with new questions",
  backHome: "Back to German plan",
  questionProgress: (current, total) => `Question ${current} of ${total}`,
  passage: "Text",
  matchingSelect: "Choose a match",
  submitAnswer: "Check answer",
  continue: "Continue",
  correct: "Exactly – this evidence fits.",
  incorrect: "Not yet. Check the deciding place once more.",
  support: "I do not understand this topic yet",
  supportConfirm: "The skill was paused and added to the companion list.",
  completed: "Round completed",
  earned: (xp) => `${xp} German XP earned`,
  assessmentResult: (correct, total) => `${correct} of ${total} secure · missed skills return as reviews`,
  assessmentAnswerSaved: "Answer saved. The review appears after the final question.",
  mistakeReviewEyebrow: "MISTAKE REVIEW",
  mistakeReviewTitle: "See exactly where the mistakes happened",
  mistakeCount: (count) => `${count} ${count === 1 ? "mistake" : "mistakes"}`,
  yourAnswer: "Your answer",
  correctAnswer: "Correct answer",
  explanation: "Why",
  noMistakes: "No mistakes – every answer was secure.",
  olderReviewUnavailable: "A question review was not yet stored for this older round.",
}

const italian: GermanCourseUiCopy = {
  ...english,
  pilot: "TEDESCO · PILOTA PRIVATO",
  welcomeTitle: (name) => `Benvenuto nell'allenamento di tedesco, ${name}.`,
  welcomeBody: "I progressi di matematica restano invariati. Questo breve test iniziale colloca solo le prime lezioni di tedesco e non assegna né voto né XP.",
  startCheckFacts: ["5 domande brevi", "nessun voto", "nessun XP", "i testi didattici restano in tedesco"],
  startCheckStart: "Inizia il test di tedesco",
  startCheckResume: "Continua il test",
  startCheckTitle: "Il tuo test iniziale di tedesco",
  startCheckProgress: (current, total) => `Domanda ${current} di ${total}`,
  startCheckSubmit: "Salva risposta",
  startCheckResult: (correct, total) => `${correct} risposte su ${total} erano già sicure.`,
  homeEyebrow: "IMPARA IL TEDESCO",
  homeTitle: "Il tuo piano di tedesco",
  homeBody: "Impara con testi e frasi nuovi. I ripassi tornano con formulazioni diverse per allenare davvero il trasferimento.",
  xp: "XP di tedesco",
  learned: "abilità attive completate",
  nextReview: "Prossimo ripasso",
  assignments: "Per te oggi",
  lesson: "Lezione",
  review: "Ripasso",
  assessment: "Valutazione",
  recommended: "Consigliato dal test iniziale",
  prerequisites: "Prerequisiti",
  start: "Inizia",
  resume: "Continua",
  maxXp: (xp) => `fino a ${xp} XP`,
  comingSoon: "Disponibile nella prossima fase",
  paused: "In pausa – spiegazione richiesta",
  pausedBody: "Non appariranno nuovi esercizi finché l'accompagnatore non riapre l'abilità.",
  editProfile: "Profilo e impostazioni",
  openCompanion: "Vista accompagnatore",
  resetOpen: "Azzera i progressi di tedesco",
  resetTitle: "Azzerare solo tedesco?",
  resetBody: "XP, lezioni, ripassi, prove, testi, revisioni, risposte brevi e riscontri umani di tedesco vengono eliminati. Matematica, profilo, PIN accompagnatore, PDF importati e impostazioni restano invariati.",
  resetConfirm: "Azzera tedesco",
  generatedNote: "Tutte le attività pilota provengono da testi e modelli nuovi e versionati.",
  lessonGoal: "Obiettivo",
  lessonStart: "Esercitati con nuove domande",
  backHome: "Torna al piano di tedesco",
  questionProgress: (current, total) => `Domanda ${current} di ${total}`,
  passage: "Testo",
  matchingSelect: "Scegli un abbinamento",
  submitAnswer: "Controlla risposta",
  continue: "Continua",
  correct: "Esatto: questa prova è adatta.",
  incorrect: "Non ancora. Controlla di nuovo il punto decisivo.",
  support: "Non capisco ancora questo argomento",
  supportConfirm: "L'abilità è stata messa in pausa e aggiunta alla lista dell'accompagnatore.",
  completed: "Sessione completata",
  earned: (xp) => `${xp} XP di tedesco ottenuti`,
  assessmentResult: (correct, total) => `${correct} risposte sicure su ${total} · le abilità mancanti tornano come ripasso`,
  assessmentAnswerSaved: "Risposta salvata. Il riepilogo appare dopo l'ultima domanda.",
  mistakeReviewEyebrow: "RIEPILOGO DEGLI ERRORI",
  mistakeReviewTitle: "Vedi esattamente dove si trovavano gli errori",
  mistakeCount: (count) => `${count} ${count === 1 ? "errore" : "errori"}`,
  yourAnswer: "La tua risposta",
  correctAnswer: "Risposta corretta",
  explanation: "Perché",
  noMistakes: "Nessun errore: tutte le risposte erano sicure.",
  olderReviewUnavailable: "Per questa sessione precedente non era ancora stato salvato un riepilogo delle domande.",
}

const spanish: GermanCourseUiCopy = {
  ...english,
  pilot: "ALEMÁN · PILOTO PRIVADO",
  welcomeTitle: (name) => `Te damos la bienvenida al entrenamiento de alemán, ${name}.`,
  welcomeBody: "Tu progreso de matemáticas no cambia. Esta breve prueba inicial solo sitúa las primeras lecciones de alemán y no concede ni nota ni XP.",
  startCheckFacts: ["5 preguntas breves", "sin nota", "sin XP", "los textos de aprendizaje siguen en alemán"],
  startCheckStart: "Iniciar prueba de alemán",
  startCheckResume: "Continuar prueba",
  startCheckTitle: "Tu prueba inicial de alemán",
  startCheckProgress: (current, total) => `Pregunta ${current} de ${total}`,
  startCheckSubmit: "Guardar respuesta",
  startCheckResult: (correct, total) => `${correct} de ${total} respuestas ya eran seguras.`,
  homeEyebrow: "APRENDE ALEMÁN",
  homeTitle: "Tu plan de alemán",
  homeBody: "Aprende con textos y frases nuevos. Los repasos vuelven con otras formulaciones para practicar la transferencia.",
  xp: "XP de alemán",
  learned: "habilidades activas completadas",
  nextReview: "Próximo repaso",
  assignments: "Para ti hoy",
  lesson: "Lección",
  review: "Repaso",
  assessment: "Evaluación",
  recommended: "Recomendado por la prueba inicial",
  prerequisites: "Requisitos previos",
  start: "Empezar",
  resume: "Continuar",
  maxXp: (xp) => `hasta ${xp} XP`,
  comingSoon: "Disponible en la próxima fase",
  paused: "En pausa – explicación solicitada",
  pausedBody: "No aparecerán nuevas tareas hasta que el acompañante vuelva a abrir la habilidad.",
  editProfile: "Perfil y ajustes",
  openCompanion: "Vista del acompañante",
  resetOpen: "Restablecer progreso de Alemán",
  resetTitle: "¿Restablecer solo Alemán?",
  resetBody: "Se eliminan los XP, las lecciones, los repasos, los exámenes, las redacciones, las revisiones, las respuestas breves y los comentarios humanos de Alemán. Se conservan Matemáticas, el perfil, el PIN del acompañante, los PDF importados y los ajustes.",
  resetConfirm: "Restablecer Alemán",
  generatedNote: "Todas las tareas piloto proceden de textos y plantillas nuevos y versionados.",
  lessonGoal: "Objetivo",
  lessonStart: "Practicar con preguntas nuevas",
  backHome: "Volver al plan de alemán",
  questionProgress: (current, total) => `Pregunta ${current} de ${total}`,
  passage: "Texto",
  matchingSelect: "Elige una correspondencia",
  submitAnswer: "Comprobar respuesta",
  continue: "Continuar",
  correct: "Exacto: esta prueba encaja.",
  incorrect: "Todavía no. Revisa de nuevo el punto decisivo.",
  support: "Todavía no entiendo este tema",
  supportConfirm: "La habilidad se pausó y se añadió a la lista del acompañante.",
  completed: "Ronda completada",
  earned: (xp) => `${xp} XP de alemán obtenidos`,
  assessmentResult: (correct, total) => `${correct} de ${total} respuestas seguras · las habilidades pendientes vuelven como repasos`,
  assessmentAnswerSaved: "Respuesta guardada. La revisión aparece después de la última pregunta.",
  mistakeReviewEyebrow: "REVISIÓN DE ERRORES",
  mistakeReviewTitle: "Mira exactamente dónde estuvieron los errores",
  mistakeCount: (count) => `${count} ${count === 1 ? "error" : "errores"}`,
  yourAnswer: "Tu respuesta",
  correctAnswer: "Respuesta correcta",
  explanation: "Por qué",
  noMistakes: "No hubo errores: todas las respuestas eran seguras.",
  olderReviewUnavailable: "Todavía no se guardaba una revisión de preguntas para esta sesión anterior.",
}

export const germanCourseUiCopy: Record<AppLocale, GermanCourseUiCopy> = {
  de: german,
  en: english,
  it: italian,
  es: spanish,
}
