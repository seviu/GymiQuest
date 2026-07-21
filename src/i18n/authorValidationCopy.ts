import type { LearningLocale } from "../domain/model"

interface AuthorValidationCopy {
  learner: {
    navAria: string
    back: string
    eyebrow: string
    title: string
    body: string
    again: string
    authorView: string
  }
  navAria: string
  back: string
  lock: string
  eyebrow: string
  title: string
  body: string
  coverageAria: (checked: number, total: number) => string
  sessionCheck: string
  coverageBoundary: string
  packageEyebrow: string
  packageVersion: (version: string | number) => string
  packageValid: string
  packageInvalid: (count: number) => string
  topicsInPackage: string
  generatorCells: string
  structureComplete: string
  packageBlocked: string
  coverage: string
  coverageTitle: string
  topicPosition: (current: number, total: number) => string
  previousTopic: string
  nextTopic: string
  difficulty: string
  variant: string
  newVariant: string
  archiveTemplates: string
  archiveTemplateNone: string
  archiveTemplateChecked: string
  markArchiveTemplate: string
  learnerView: string
  learnerViewBody: string
  checked: string
  markChecked: string
  nextUnchecked: string
  productionGenerator: (version?: number) => string
  metadataAria: string
  candidates: (count?: number) => string
  structureScore: (score?: number) => string
  dynamicQuestion: string
  canonicalAnswer: string
  explanation: string
  firstHint: string
  easier: string
  fullSolution: string
  structuredSteps: string
  issueTitle: string
  issueBody: string
  report: string
}

const baseCopy = {
  en: {
    learner: {
      navAria: "Review lab learner-view navigation",
      back: "Review lab",
      eyebrow: "LOCAL LEARNER VIEW",
      title: "The real question round has been reviewed.",
      body: "This test round changed neither XP nor learning status, reviews, or assessments. The detailed author view still shows the canonical answer and complete working.",
      again: "Open the same variant again",
      authorView: "Back to author view",
    },
    navAria: "Review lab navigation",
    back: "Companion view",
    lock: "Lock",
    eyebrow: "PIN-PROTECTED REVIEW LAB",
    title: "Review fresh questions before they cost trust.",
    body: "This lab uses the real generator for all 23 topics and three mathematical difficulty levels. It awards no XP and changes neither learning status, reviews, nor assessments.",
    coverageAria: (checked, total) => `${checked} of ${total} review cells checked in this session`,
    sessionCheck: "SESSION CHECK",
    coverageBoundary: "A tick records one manual sample, not mathematical approval.",
    packageEyebrow: "VERSIONED PACKAGE CONTRACT",
    packageVersion: (version) => `Package v${version}`,
    packageValid: "The manifest, topic order, prerequisites, lessons, German, English, Italian, and Spanish guidance, and learning, XP, and exam rules are fully bound. The release gate additionally generates every generator cell deterministically.",
    packageInvalid: (count) => `${count} structural package problems must be fixed before release.`,
    topicsInPackage: "topics in the package",
    generatorCells: "generator cells in the release gate",
    structureComplete: "Structure complete",
    packageBlocked: "Package blocked",
    coverage: "COVERAGE",
    coverageTitle: "23 topics × 3 levels",
    topicPosition: (current, total) => `Topic ${current} of ${total}`,
    previousTopic: "Previous topic",
    nextTopic: "Next topic",
    difficulty: "Difficulty level",
    variant: "VARIANT",
    newVariant: "New variant",
    archiveTemplates: "V5 archive templates",
    archiveTemplateNone: "This variant uses an established generator family. Choose New variant until an unchecked archive template appears.",
    archiveTemplateChecked: "Template checked",
    markArchiveTemplate: "Mark current template as checked",
    learnerView: "Review learner view",
    learnerViewBody: "Opens exactly the same inputs, help, and diagrams as training—without storing learner data.",
    checked: "Sample checked",
    markChecked: "Mark as checked",
    nextUnchecked: "Next unchecked cell",
    productionGenerator: (version) => `PRODUCTION GENERATOR · V${version ?? "?"}`,
    metadataAria: "Generator metadata",
    candidates: (count) => `${count ?? "?"} candidates`,
    structureScore: (score) => `Structure score ${score?.toFixed(1) ?? "?"}`,
    dynamicQuestion: "DYNAMIC QUESTION",
    canonicalAnswer: "CANONICAL ANSWER",
    explanation: "EXPLANATION",
    firstHint: "FIRST HINT",
    easier: "EXPLAINED MORE SIMPLY",
    fullSolution: "Review complete working",
    structuredSteps: "STRUCTURED INTERMEDIATE STEPS",
    issueTitle: "Something is wrong?",
    issueBody: "The report opens separately and contains the seed, generator version, and question reference—no learner data.",
    report: "Report issue",
  },
  it: {
    learner: {
      navAria: "Navigazione della vista studente del laboratorio di controllo",
      back: "Laboratorio di controllo",
      eyebrow: "VISTA STUDENTE LOCALE",
      title: "La sessione reale di domande è stata controllata.",
      body: "Questa sessione di test non ha modificato XP, stato di apprendimento, ripassi o verifiche. La vista autore dettagliata continua a mostrare la risposta canonica e tutti i passaggi.",
      again: "Apri di nuovo la stessa variante",
      authorView: "Torna alla vista autore",
    },
    navAria: "Navigazione del laboratorio di controllo",
    back: "Area accompagnatore",
    lock: "Blocca",
    eyebrow: "LABORATORIO DI CONTROLLO PROTETTO DA PIN",
    title: "Controlla le domande nuove prima che facciano perdere fiducia.",
    body: "Questo laboratorio usa il generatore reale per tutti i 23 argomenti e i tre livelli di difficoltà matematica. Non assegna XP e non modifica stato di apprendimento, ripassi o verifiche.",
    coverageAria: (checked, total) => `${checked} celle su ${total} controllate in questa sessione`,
    sessionCheck: "CONTROLLO DELLA SESSIONE",
    coverageBoundary: "Una spunta documenta un campione manuale, non un'approvazione matematica.",
    packageEyebrow: "CONTRATTO DEL PACCHETTO VERSIONATO",
    packageVersion: (version) => `Pacchetto v${version}`,
    packageValid: "Manifesto, ordine degli argomenti, prerequisiti, lezioni, guide in tedesco, inglese, italiano e spagnolo e regole di apprendimento, XP ed esame sono interamente collegati. Il controllo di rilascio genera inoltre ogni cella del generatore in modo deterministico.",
    packageInvalid: (count) => `${count} problemi strutturali del pacchetto devono essere risolti prima del rilascio.`,
    topicsInPackage: "argomenti nel pacchetto",
    generatorCells: "celle del generatore nel controllo di rilascio",
    structureComplete: "Struttura completa",
    packageBlocked: "Pacchetto bloccato",
    coverage: "COPERTURA",
    coverageTitle: "23 argomenti × 3 livelli",
    topicPosition: (current, total) => `Argomento ${current} di ${total}`,
    previousTopic: "Argomento precedente",
    nextTopic: "Argomento successivo",
    difficulty: "Livello di difficoltà",
    variant: "VARIANTE",
    newVariant: "Nuova variante",
    archiveTemplates: "Modelli d'archivio V5",
    archiveTemplateNone: "Questa variante usa una famiglia di generatori già esistente. Scegli Nuova variante finché appare un modello d'archivio non controllato.",
    archiveTemplateChecked: "Modello controllato",
    markArchiveTemplate: "Segna il modello attuale come controllato",
    learnerView: "Controlla vista studente",
    learnerViewBody: "Apre esattamente gli stessi inserimenti, aiuti e diagrammi dell'allenamento, senza salvare dati dello studente.",
    checked: "Campione controllato",
    markChecked: "Segna come controllato",
    nextUnchecked: "Prossima cella non controllata",
    productionGenerator: (version) => `GENERATORE DI PRODUZIONE · V${version ?? "?"}`,
    metadataAria: "Metadati del generatore",
    candidates: (count) => `${count ?? "?"} candidati`,
    structureScore: (score) => `Punteggio struttura ${score?.toFixed(1) ?? "?"}`,
    dynamicQuestion: "DOMANDA DINAMICA",
    canonicalAnswer: "RISPOSTA CANONICA",
    explanation: "SPIEGAZIONE",
    firstHint: "PRIMO SUGGERIMENTO",
    easier: "SPIEGATO PIÙ SEMPLICEMENTE",
    fullSolution: "Controlla tutti i passaggi",
    structuredSteps: "PASSAGGI INTERMEDI STRUTTURATI",
    issueTitle: "Qualcosa non va?",
    issueBody: "La segnalazione si apre separatamente e contiene seed, versione del generatore e riferimento alla domanda, ma nessun dato dello studente.",
    report: "Segnala errore",
  },
  es: {
    learner: {
      navAria: "Navegación de la vista del estudiante del laboratorio de revisión",
      back: "Laboratorio de revisión",
      eyebrow: "VISTA LOCAL DEL ESTUDIANTE",
      title: "La ronda real de preguntas se ha revisado.",
      body: "Esta ronda de prueba no ha cambiado los XP, el estado de aprendizaje, los repasos ni las evaluaciones. La vista detallada de autor sigue mostrando la respuesta canónica y el procedimiento completo.",
      again: "Abrir de nuevo la misma variante",
      authorView: "Volver a la vista de autor",
    },
    navAria: "Navegación del laboratorio de revisión",
    back: "Vista de acompañamiento",
    lock: "Bloquear",
    eyebrow: "LABORATORIO DE REVISIÓN PROTEGIDO CON PIN",
    title: "Revisa las preguntas nuevas antes de que cuesten confianza.",
    body: "Este laboratorio usa el generador real para los 23 temas y tres niveles de dificultad matemática. No concede XP ni cambia el estado de aprendizaje, los repasos o las evaluaciones.",
    coverageAria: (checked, total) => `${checked} de ${total} celdas de revisión comprobadas en esta sesión`,
    sessionCheck: "COMPROBACIÓN DE LA SESIÓN",
    coverageBoundary: "Una marca documenta una muestra manual, no una aprobación matemática.",
    packageEyebrow: "CONTRATO DEL PAQUETE VERSIONADO",
    packageVersion: (version) => `Paquete v${version}`,
    packageValid: "El manifiesto, el orden de los temas, los prerrequisitos, las lecciones, las guías en alemán, inglés, italiano y español y las reglas de aprendizaje, XP y examen están completamente vinculados. La comprobación de publicación también genera cada celda del generador de forma determinista.",
    packageInvalid: (count) => `Hay que corregir ${count} problemas estructurales del paquete antes de publicar.`,
    topicsInPackage: "temas del paquete",
    generatorCells: "celdas del generador en la comprobación de publicación",
    structureComplete: "Estructura completa",
    packageBlocked: "Paquete bloqueado",
    coverage: "COBERTURA",
    coverageTitle: "23 temas × 3 niveles",
    topicPosition: (current, total) => `Tema ${current} de ${total}`,
    previousTopic: "Tema anterior",
    nextTopic: "Tema siguiente",
    difficulty: "Nivel de dificultad",
    variant: "VARIANTE",
    newVariant: "Nueva variante",
    archiveTemplates: "Plantillas de archivo V5",
    archiveTemplateNone: "Esta variante usa una familia de generadores ya establecida. Elige Nueva variante hasta que aparezca una plantilla de archivo sin revisar.",
    archiveTemplateChecked: "Plantilla comprobada",
    markArchiveTemplate: "Marcar la plantilla actual como comprobada",
    learnerView: "Revisar vista del estudiante",
    learnerViewBody: "Abre exactamente las mismas entradas, ayudas y diagramas que el entrenamiento, sin guardar datos del estudiante.",
    checked: "Muestra comprobada",
    markChecked: "Marcar como comprobada",
    nextUnchecked: "Siguiente celda sin comprobar",
    productionGenerator: (version) => `GENERADOR DE PRODUCCIÓN · V${version ?? "?"}`,
    metadataAria: "Metadatos del generador",
    candidates: (count) => `${count ?? "?"} candidatos`,
    structureScore: (score) => `Puntuación de estructura ${score?.toFixed(1) ?? "?"}`,
    dynamicQuestion: "PREGUNTA DINÁMICA",
    canonicalAnswer: "RESPUESTA CANÓNICA",
    explanation: "EXPLICACIÓN",
    firstHint: "PRIMERA PISTA",
    easier: "EXPLICADO DE FORMA MÁS SENCILLA",
    fullSolution: "Revisar el procedimiento completo",
    structuredSteps: "PASOS INTERMEDIOS ESTRUCTURADOS",
    issueTitle: "¿Algo no está bien?",
    issueBody: "El informe se abre por separado e incluye la semilla, la versión del generador y la referencia de la pregunta, sin datos del estudiante.",
    report: "Informar de un error",
  },
  de: {
    learner: {
      navAria: "Prüflabor Lernansicht Navigation",
      back: "Prüflabor",
      eyebrow: "LOKALE LERNANSICHT",
      title: "Die echte Aufgabenrunde ist geprüft.",
      body: "Diese Testrunde hat weder XP noch Lernstand, Reviews oder Standortbestimmungen verändert. Die ausführliche Autorenansicht zeigt weiterhin die kanonische Antwort und den vollständigen Lösungsweg.",
      again: "Gleiche Variante erneut öffnen",
      authorView: "Zur Autorenansicht",
    },
    navAria: "Prüflabor Navigation",
    back: "Begleitansicht",
    lock: "Sperren",
    eyebrow: "PIN-GESCHÜTZTES PRÜFLABOR",
    title: "Frische Aufgaben prüfen, bevor sie Vertrauen kosten.",
    body: "Dieses Labor verwendet den echten Generator für alle 23 Themen und drei mathematische Schwierigkeitsstufen. Es vergibt keine XP und verändert weder Lernstand noch Wiederholungen oder Standortbestimmungen.",
    coverageAria: (checked, total) => `${checked} von ${total} Prüffeldern in dieser Sitzung geprüft`,
    sessionCheck: "SITZUNGSCHECK",
    coverageBoundary: "Ein Haken dokumentiert eine manuelle Stichprobe, keine mathematische Freigabe.",
    packageEyebrow: "VERSIONIERTER PAKETVERTRAG",
    packageVersion: (version) => `Paket v${version}`,
    packageValid: "Manifest, Themenreihenfolge, Voraussetzungen, Lektionen, deutsche, englische, italienische und spanische Begleitung sowie Lern-, XP- und Prüfungsregeln sind vollständig gebunden. Der Release-Gate erzeugt zusätzlich jedes Generatorfeld deterministisch.",
    packageInvalid: (count) => `${count} strukturelle Paketprobleme müssen vor einer Freigabe behoben werden.`,
    topicsInPackage: "Themen im Paket",
    generatorCells: "Generatorfelder im Release-Gate",
    structureComplete: "Struktur vollständig",
    packageBlocked: "Paket blockiert",
    coverage: "ABDECKUNG",
    coverageTitle: "23 Themen × 3 Stufen",
    topicPosition: (current, total) => `Thema ${current} von ${total}`,
    previousTopic: "Vorheriges Thema",
    nextTopic: "Nächstes Thema",
    difficulty: "Schwierigkeitsstufe",
    variant: "VARIANTE",
    newVariant: "Neue Variante",
    archiveTemplates: "V5-Archivvorlagen",
    archiveTemplateNone: "Diese Variante verwendet eine bestehende Generatorfamilie. Wähle Neue Variante, bis eine noch offene Archivvorlage erscheint.",
    archiveTemplateChecked: "Vorlage geprüft",
    markArchiveTemplate: "Aktuelle Vorlage als geprüft markieren",
    learnerView: "Lernansicht prüfen",
    learnerViewBody: "Öffnet genau dieselben Eingaben, Hilfen und Diagramme wie im Training – ohne Lerndaten zu speichern.",
    checked: "Stichprobe geprüft",
    markChecked: "Als geprüft markieren",
    nextUnchecked: "Nächstes offenes Prüffeld",
    productionGenerator: (version) => `PRODUKTIONSGENERATOR · V${version ?? "?"}`,
    metadataAria: "Generatormetadaten",
    candidates: (count) => `${count ?? "?"} Kandidaten`,
    structureScore: (score) => `Strukturwert ${score?.toFixed(1) ?? "?"}`,
    dynamicQuestion: "DYNAMISCHE AUFGABE",
    canonicalAnswer: "KANONISCHE ANTWORT",
    explanation: "ERKLÄRUNG",
    firstHint: "ERSTER HINWEIS",
    easier: "EINFACHER ERKLÄRT",
    fullSolution: "Vollständigen Lösungsweg prüfen",
    structuredSteps: "STRUKTURIERTE ZWISCHENSCHRITTE",
    issueTitle: "Etwas stimmt nicht?",
    issueBody: "Der Bericht öffnet separat und enthält Seed, Generatorversion und Aufgabenreferenz – keine Lernerdaten.",
    report: "Fehler melden",
  },
} satisfies Record<LearningLocale, AuthorValidationCopy>

const copy: Record<LearningLocale, AuthorValidationCopy> = baseCopy

export function authorValidationCopy(locale: LearningLocale): AuthorValidationCopy {
  return copy[locale]
}
