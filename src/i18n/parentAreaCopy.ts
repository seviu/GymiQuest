import type { LearningLocale } from "../domain/model"

interface ParentAreaCopy {
  gate: {
    back: string
    eyebrow: string
    unlockTitle: string
    setupTitle: string
    unlockBody: string
    setupBody: string
    benefits: readonly [string, string, string]
    accessEyebrow: string
    setupEyebrow: string
    pinTitle: string
    choosePinTitle: string
    pinBody: string
    repeatPin: string
    wait: string
    open: string
    save: string
    invalidPin: string
    mismatch: string
    saveError: string
    enterPin: string
    wrongPin: string
    unlockError: string
    resetTitle: string
    resetBody: string
    resetCancel: string
    resetDelete: string
    forgot: string
  }
  dashboard: {
    back: string
    heroEyebrow: string
    heroTitle: string
    heroBody: string
    meterAria: (completed: number, target: number) => string
    target: (target: number) => string
    headlineAria: string
    headlineEyebrow: string
    summaryAria: string
    activeTime: string
    activeTimeBody: string
    independentlySolved: string
    independentlySolvedBody: (independent: number, total: number) => string
    dueReviews: string
    dueReviewsBody: string
    nextCheck: string
    nextCheckBody: (current: number, target: number) => string
    pilotEyebrow: string
    pilotTitle: string
    calendarWeeks: string
    pilotIntro: string
    pilotProgressAria: (weeks: number) => string
    pilotFactsAria: string
    observedDaysNone: string
    observedDays: (days: number) => string
    activeDays: string
    sessionOne: string
    sessionMany: string
    independentAnswers: string
    questions: (independent: number, total: number) => string
    assessments: string
    assessmentsBody: string
    pilotEmptyTitle: string
    pilotEmptyBody: string
    pilotWeeksAria: string
    learningDayOne: string
    learningDayMany: string
    roundOne: string
    roundMany: string
    independentShort: string
    checks: string
    signals: string
    firstLatest: string
    onlyCheck: (rate: number) => string
    comparison: (first: number, latest: number) => string
    noComparison: string
    humanEyebrow: string
    humanTitle: string
    humanEvidence: readonly [string, string, string, string]
    openPilotEvidence: string
    pilotPrivacy: string
    patternsEyebrow: string
    patternsTitle: string
    noRanking: string
    supportEyebrow: string
    supportTitle: string
    questionsWithHint: string
    selfCorrected: string
    averageTime: string
    ownFeedback: string
    ownFeedbackTitle: string
    hurdlesTitle: string
    resolvedAfter: (resolved: number) => string
    supportNote: string
    planEyebrow: string
    planTitle: string
    planDuration: (minutes: number) => string
    minutesShort: string
    mocksEyebrow: string
    mocksTitle: string
    recent: (count: number) => string
    trendEyebrow: string
    examFormat: (version: number) => string
    runOne: string
    runMany: string
    trendListAria: string
    previousRun: string
    firstComparison: string
    latestComparison: string
    runNumber: (number: number) => string
    points: string
    certainAria: (points: number, max: number) => string
    rangeAria: (lower: number, upper: number) => string
    completeEvidence: string
    rangeEvidence: string
    certainLegend: string
    reviewableLegend: string
    trendBoundary: string
    noMockTitle: string
    noMockBody: string
    official: (year?: number) => string
    generated: string
    correctedPoints: string
    certainPoints: string
    correctionOpen: string
    mathsGrade: (grade: string) => string
    methodPoints: (points: number) => string
    noOpenPoints: string
    examTime: string
    authorEyebrow: string
    authorTitle: string
    authorBody: string
    authorOpen: string
    releaseEyebrow: string
    releaseTitle: string
    releaseBody: string
    releaseOpen: string
    privacyTitle: string
    privacyBody: string
  }
}

const baseCopy = {
  en: {
    gate: {
      back: "Progress",
      eyebrow: "FOR PARENTS AND COMPANIONS",
      unlockTitle: "Unlock companion view",
      setupTitle: "Calm support, separate from learning mode.",
      unlockBody: "The PIN keeps the summarised learning patterns private during normal practice.",
      setupBody: "Set up a local PIN. It protects weekly patterns, help use, and recommendations on a shared device.",
      benefits: [
        "Only summarised patterns, no click-by-click monitoring",
        "No way to change XP or results",
        "No transfer to a server",
      ],
      accessEyebrow: "LOCAL ACCESS",
      setupEyebrow: "SET UP PIN",
      pinTitle: "Parent PIN",
      choosePinTitle: "Choose 4 to 8 digits",
      pinBody: "The PIN protects against casual access on this device; it is not a user account.",
      repeatPin: "Repeat PIN",
      wait: "Please wait …",
      open: "Open companion view",
      save: "Save PIN and open",
      invalidPin: "The parent PIN must contain 4 to 8 digits.",
      mismatch: "The two PIN entries do not match.",
      saveError: "The parent PIN could not be saved.",
      enterPin: "Please enter 4 to 8 digits.",
      wrongPin: "That PIN is not correct.",
      unlockError: "The companion view could not be unlocked.",
      resetTitle: "Delete only the parent PIN?",
      resetBody: "The complete learning progress remains. A new PIN can then be created.",
      resetCancel: "Cancel",
      resetDelete: "Delete PIN",
      forgot: "Forgot PIN?",
    },
    dashboard: {
      back: "Lock and return",
      heroEyebrow: "PROTECTED COMPANION VIEW",
      heroTitle: "Support learning without adding pressure.",
      heroBody: "This view summarises learning patterns. It does not replay individual clicks and cannot change XP, retention, or exam points.",
      meterAria: (completed, target) => `${completed} learning rounds completed; ${target} are recommended`,
      target: (target) => `Goal: ${target} calm rounds`,
      headlineAria: "Recommendation for this week",
      headlineEyebrow: "WHAT WILL HELP MOST NOW",
      summaryAria: "Weekly overview",
      activeTime: "Active learning time",
      activeTimeBody: "Hidden and inactive time is excluded.",
      independentlySolved: "Solved independently",
      independentlySolvedBody: (independent, total) => `${independent} of ${total} questions.`,
      dueReviews: "Due reviews",
      dueReviewsBody: "Reviews remain smaller tasks with fixed XP.",
      nextCheck: "Next assessment",
      nextCheckBody: (current, target) => `${current} of ${target} XP since the last assessment.`,
      pilotEyebrow: "THREE-WEEK PILOT · SINCE THIS PROFILE",
      pilotTitle: "Evidence use without inventing impact.",
      calendarWeeks: "calendar weeks",
      pilotIntro: "These figures come only from stored learning rounds. They show rhythm and independent answers, but neither motivation nor missing coaching.",
      pilotProgressAria: (weeks) => `${weeks} of 3 calendar weeks supported by real learning rounds`,
      pilotFactsAria: "Pilot data in the current profile",
      observedDaysNone: "no round yet",
      observedDays: (days) => `${days} days between the first and latest evidence`,
      activeDays: "Active learning days",
      sessionOne: "completed round",
      sessionMany: "completed rounds",
      independentAnswers: "Independent answers",
      questions: (independent, total) => `${independent} of ${total} questions`,
      assessments: "Assessments",
      assessmentsBody: "exam-like variants without hints",
      pilotEmptyTitle: "No real learning round in this profile yet.",
      pilotEmptyBody: "The pilot begins with the first completed lesson or review—not with onboarding.",
      pilotWeeksAria: "Calendar weeks with learning evidence",
      learningDayOne: "learning day",
      learningDayMany: "learning days",
      roundOne: "round",
      roundMany: "rounds",
      independentShort: "independent",
      checks: "checks",
      signals: "learner signals",
      firstLatest: "FIRST AND LATEST ASSESSMENT",
      onlyCheck: (rate) => `${rate}% independent · only one assessment so far`,
      comparison: (first, latest) => `${first}% → ${latest}% independent`,
      noComparison: "No assessment comparison yet",
      humanEyebrow: "OBSERVABLE ONLY TOGETHER",
      humanTitle: "These four statements remain human evidence.",
      humanEvidence: [
        "The round ran without interface or solution coaching.",
        "The learner wanted to return voluntarily.",
        "A paper-like question was genuinely still unfamiliar.",
        "A higher value reflects stable independent performance, not only different questions.",
      ],
      openPilotEvidence: "Open pilot evidence in the log",
      pilotPrivacy: "No new input, free text, or transfer: this view only summarises the local learning history of this profile.",
      patternsEyebrow: "TOPIC PATTERNS",
      patternsTitle: "Three useful points to watch",
      noRanking: "not a ranking",
      supportEyebrow: "HELP AND PACE",
      supportTitle: "Patterns only, no individual surveillance",
      questionsWithHint: "Questions with a hint",
      selfCorrected: "Self-corrected",
      averageTime: "Average active time per question",
      ownFeedback: "Learner feedback",
      ownFeedbackTitle: "What the learner reported",
      hurdlesTitle: "Detected mathematical hurdles",
      resolvedAfter: (resolved) => `${resolved}× solved afterwards`,
      supportNote: "Help is not failure. It marks where an explanation or a later independent review may be useful.",
      planEyebrow: "NEXT THREE SESSIONS",
      planTitle: "A plan with room to breathe",
      planDuration: (minutes) => `about ${minutes} min in total`,
      minutesShort: "min",
      mocksEyebrow: "MOCK EXAMS",
      mocksTitle: "Development and evidenced results",
      recent: (count) => `latest ${count}`,
      trendEyebrow: "COMPARABLE GENERATED TREND",
      examFormat: (version) => `Exam format v${version}`,
      runOne: "run",
      runMany: "runs",
      trendListAria: "Comparable generated mock exams",
      previousRun: "only run so far",
      firstComparison: "first comparison",
      latestComparison: "latest comparison",
      runNumber: (number) => `run ${number}`,
      points: "points",
      certainAria: (points, max) => `${points} of ${max} points securely evidenced`,
      rangeAria: (lower, upper) => `${lower} points securely evidenced; up to ${upper} possible after reviewing the working`,
      completeEvidence: "fully evidenced",
      rangeEvidence: "secure to possible after method review",
      certainLegend: "securely evidenced",
      reviewableLegend: "open with working",
      trendBoundary: "Generated exams from the same format version only. No school grade and no comparison with official year-specific scales.",
      noMockTitle: "No mock exam submitted yet.",
      noMockBody: "The learning plan also works without immediate exam pressure.",
      official: (year) => `Official${year ? ` ${year}` : ""} · `,
      generated: "Generated · ",
      correctedPoints: "corrected points",
      certainPoints: "certain points",
      correctionOpen: "Review with the official marking scheme is still open",
      mathsGrade: (grade) => `Maths grade ${grade} · not the overall grade`,
      methodPoints: (points) => `+${points} points with working to review`,
      noOpenPoints: "No open manual points",
      examTime: "exam time",
      authorEyebrow: "REVIEW CONTENT",
      authorTitle: "Inspect dynamic questions in the real generator.",
      authorBody: "All 23 topics and three levels, with answers, explanations, and reproducible issue reports. Learner data remains unchanged.",
      authorOpen: "Open review lab",
      releaseEyebrow: "PREPARE RELEASE",
      releaseTitle: "Keep real device, marking, and pilot evidence separate.",
      releaseBody: "Guided local checklists and an exportable log—without learner data and without pretending that ticks are an independent release decision.",
      releaseOpen: "Open release log",
      privacyTitle: "Stays on this device.",
      privacyBody: "No account, advertising, or third-party behavioural analytics. The parent PIN is stored only as a salted verifier and is not included in backup files.",
    },
  },
  es: {
    gate: {
      back: "Progreso",
      eyebrow: "PARA FAMILIAS Y ACOMPAÑANTES",
      unlockTitle: "Desbloquear vista de acompañamiento",
      setupTitle: "Apoyo tranquilo, separado del modo de aprendizaje.",
      unlockBody: "El PIN mantiene privados los patrones de aprendizaje resumidos durante la práctica normal.",
      setupBody: "Configura un PIN local. Protege los patrones semanales, el uso de ayudas y las recomendaciones en un dispositivo compartido.",
      benefits: [
        "Solo patrones resumidos, sin seguimiento clic a clic",
        "No permite cambiar XP ni resultados",
        "No se transfieren datos a un servidor",
      ],
      accessEyebrow: "ACCESO LOCAL",
      setupEyebrow: "CONFIGURAR PIN",
      pinTitle: "PIN familiar",
      choosePinTitle: "Elige entre 4 y 8 dígitos",
      pinBody: "El PIN protege contra el acceso ocasional en este dispositivo; no es una cuenta de usuario.",
      repeatPin: "Repetir PIN",
      wait: "Espera…",
      open: "Abrir vista de acompañamiento",
      save: "Guardar PIN y abrir",
      invalidPin: "El PIN familiar debe tener entre 4 y 8 dígitos.",
      mismatch: "Los dos PIN no coinciden.",
      saveError: "No se ha podido guardar el PIN familiar.",
      enterPin: "Introduce entre 4 y 8 dígitos.",
      wrongPin: "Ese PIN no es correcto.",
      unlockError: "No se ha podido desbloquear la vista de acompañamiento.",
      resetTitle: "¿Eliminar solo el PIN familiar?",
      resetBody: "Todo el progreso de aprendizaje se conserva. Después se puede crear un PIN nuevo.",
      resetCancel: "Cancelar",
      resetDelete: "Eliminar PIN",
      forgot: "¿Has olvidado el PIN?",
    },
    dashboard: {
      back: "Bloquear y volver",
      heroEyebrow: "VISTA DE ACOMPAÑAMIENTO PROTEGIDA",
      heroTitle: "Apoya el aprendizaje sin añadir presión.",
      heroBody: "Esta vista resume patrones de aprendizaje. No reproduce cada clic y no puede cambiar los XP, la retención ni los puntos del examen.",
      meterAria: (completed, target) => `${completed} sesiones de aprendizaje completadas; se recomiendan ${target}`,
      target: (target) => `Objetivo: ${target} sesiones tranquilas`,
      headlineAria: "Recomendación para esta semana",
      headlineEyebrow: "LO QUE MÁS AYUDARÁ AHORA",
      summaryAria: "Resumen semanal",
      activeTime: "Tiempo activo de aprendizaje",
      activeTimeBody: "Se excluye el tiempo oculto e inactivo.",
      independentlySolved: "Resueltas de forma autónoma",
      independentlySolvedBody: (independent, total) => `${independent} de ${total} preguntas.`,
      dueReviews: "Repasos pendientes",
      dueReviewsBody: "Los repasos siguen siendo tareas más pequeñas con XP fijos.",
      nextCheck: "Próxima evaluación",
      nextCheckBody: (current, target) => `${current} de ${target} XP desde la última evaluación.`,
      pilotEyebrow: "PRUEBA DE TRES SEMANAS · DESDE ESTE PERFIL",
      pilotTitle: "Usar evidencias sin inventar efectos.",
      calendarWeeks: "semanas naturales",
      pilotIntro: "Estas cifras proceden únicamente de sesiones de aprendizaje guardadas. Muestran el ritmo y las respuestas autónomas, pero no la motivación ni la orientación que pudo faltar.",
      pilotProgressAria: (weeks) => `${weeks} de 3 semanas naturales respaldadas por sesiones de aprendizaje reales`,
      pilotFactsAria: "Datos de la prueba en el perfil actual",
      observedDaysNone: "todavía no hay sesiones",
      observedDays: (days) => `${days} días entre la primera y la última evidencia`,
      activeDays: "Días activos de aprendizaje",
      sessionOne: "sesión completada",
      sessionMany: "sesiones completadas",
      independentAnswers: "Respuestas autónomas",
      questions: (independent, total) => `${independent} de ${total} preguntas`,
      assessments: "Evaluaciones",
      assessmentsBody: "variantes parecidas al examen sin pistas",
      pilotEmptyTitle: "Todavía no hay ninguna sesión de aprendizaje real en este perfil.",
      pilotEmptyBody: "La prueba empieza con la primera lección o repaso completados, no con la bienvenida.",
      pilotWeeksAria: "Semanas naturales con evidencias de aprendizaje",
      learningDayOne: "día de aprendizaje",
      learningDayMany: "días de aprendizaje",
      roundOne: "sesión",
      roundMany: "sesiones",
      independentShort: "autónomas",
      checks: "evaluaciones",
      signals: "señales del estudiante",
      firstLatest: "PRIMERA Y ÚLTIMA EVALUACIÓN",
      onlyCheck: (rate) => `${rate}% autónomo · por ahora solo una evaluación`,
      comparison: (first, latest) => `${first}% → ${latest}% autónomo`,
      noComparison: "Aún no hay comparación entre evaluaciones",
      humanEyebrow: "SOLO OBSERVABLE EN CONJUNTO",
      humanTitle: "Estas cuatro afirmaciones siguen siendo evidencia humana.",
      humanEvidence: [
        "La sesión transcurrió sin ayuda con la interfaz ni con las soluciones.",
        "El estudiante quiso volver por iniciativa propia.",
        "Una pregunta parecida a las de papel todavía era realmente desconocida.",
        "Un valor más alto refleja un rendimiento autónomo estable y no solo preguntas diferentes.",
      ],
      openPilotEvidence: "Abrir evidencias de la prueba en el registro",
      pilotPrivacy: "Sin entradas nuevas, texto libre ni transferencias: esta vista solo resume el historial local de aprendizaje de este perfil.",
      patternsEyebrow: "PATRONES POR TEMA",
      patternsTitle: "Tres puntos útiles que observar",
      noRanking: "no es una clasificación",
      supportEyebrow: "AYUDA Y RITMO",
      supportTitle: "Solo patrones, sin vigilancia individual",
      questionsWithHint: "Preguntas con una pista",
      selfCorrected: "Autocorregidas",
      averageTime: "Tiempo activo medio por pregunta",
      ownFeedback: "Valoración del estudiante",
      ownFeedbackTitle: "Lo que indicó el estudiante",
      hurdlesTitle: "Dificultades matemáticas detectadas",
      resolvedAfter: (resolved) => `${resolved}× resueltas después`,
      supportNote: "Pedir ayuda no es fracasar. Indica dónde puede ser útil una explicación o un repaso autónomo posterior.",
      planEyebrow: "PRÓXIMAS TRES SESIONES",
      planTitle: "Un plan con espacio para respirar",
      planDuration: (minutes) => `unos ${minutes} min en total`,
      minutesShort: "min",
      mocksEyebrow: "SIMULACROS DE EXAMEN",
      mocksTitle: "Evolución y resultados respaldados",
      recent: (count) => `últimos ${count}`,
      trendEyebrow: "TENDENCIA GENERADA COMPARABLE",
      examFormat: (version) => `Formato de examen v${version}`,
      runOne: "intento",
      runMany: "intentos",
      trendListAria: "Simulacros generados comparables",
      previousRun: "único intento hasta ahora",
      firstComparison: "primera comparación",
      latestComparison: "última comparación",
      runNumber: (number) => `intento ${number}`,
      points: "puntos",
      certainAria: (points, max) => `${points} de ${max} puntos respaldados con seguridad`,
      rangeAria: (lower, upper) => `${lower} puntos respaldados con seguridad; hasta ${upper} posibles tras revisar el procedimiento`,
      completeEvidence: "completamente respaldado",
      rangeEvidence: "de seguro a posible tras revisar el procedimiento",
      certainLegend: "respaldado con seguridad",
      reviewableLegend: "abierto con procedimiento",
      trendBoundary: "Solo exámenes generados con la misma versión de formato. Sin nota escolar ni comparación con escalas oficiales específicas de cada año.",
      noMockTitle: "Todavía no se ha entregado ningún simulacro.",
      noMockBody: "El plan de aprendizaje también funciona sin presión inmediata de examen.",
      official: (year) => `Oficial${year ? ` ${year}` : ""} · `,
      generated: "Generado · ",
      correctedPoints: "puntos corregidos",
      certainPoints: "puntos seguros",
      correctionOpen: "La revisión con el baremo oficial sigue pendiente",
      mathsGrade: (grade) => `Nota de matemáticas ${grade} · no es la nota global`,
      methodPoints: (points) => `+${points} puntos con procedimiento por revisar`,
      noOpenPoints: "Sin puntos manuales pendientes",
      examTime: "tiempo de examen",
      authorEyebrow: "REVISAR CONTENIDO",
      authorTitle: "Examina preguntas dinámicas en el generador real.",
      authorBody: "Los 23 temas y tres niveles, con respuestas, explicaciones e informes de error reproducibles. Los datos del estudiante no cambian.",
      authorOpen: "Abrir laboratorio de revisión",
      releaseEyebrow: "PREPARAR PUBLICACIÓN",
      releaseTitle: "Mantén separadas las evidencias de dispositivos reales, corrección y prueba.",
      releaseBody: "Listas locales guiadas y un registro exportable, sin datos del estudiante y sin fingir que las marcas constituyen una decisión de publicación independiente.",
      releaseOpen: "Abrir registro de publicación",
      privacyTitle: "Se queda en este dispositivo.",
      privacyBody: "Sin cuenta, publicidad ni analítica de comportamiento de terceros. El PIN familiar solo se guarda como verificador con sal y no se incluye en las copias de seguridad.",
    },
  },
  it: {
    gate: {
      back: "Progressi",
      eyebrow: "PER GENITORI E ACCOMPAGNATORI",
      unlockTitle: "Sblocca area accompagnatore",
      setupTitle: "Un sostegno tranquillo, separato dalla modalità di studio.",
      unlockBody: "Il PIN mantiene privati i riepiloghi degli schemi di apprendimento durante il normale allenamento.",
      setupBody: "Imposta un PIN locale. Su un dispositivo condiviso protegge schemi settimanali, uso degli aiuti e consigli.",
      benefits: [
        "Solo schemi riassunti, nessun controllo clic per clic",
        "Nessuna possibilità di modificare XP o risultati",
        "Nessun trasferimento a un server",
      ],
      accessEyebrow: "ACCESSO LOCALE",
      setupEyebrow: "IMPOSTA PIN",
      pinTitle: "PIN genitore",
      choosePinTitle: "Scegli da 4 a 8 cifre",
      pinBody: "Il PIN protegge dall'accesso occasionale su questo dispositivo; non è un account utente.",
      repeatPin: "Ripeti PIN",
      wait: "Attendi…",
      open: "Apri area accompagnatore",
      save: "Salva PIN e apri",
      invalidPin: "Il PIN genitore deve contenere da 4 a 8 cifre.",
      mismatch: "I due PIN non coincidono.",
      saveError: "Non è stato possibile salvare il PIN genitore.",
      enterPin: "Inserisci da 4 a 8 cifre.",
      wrongPin: "Il PIN non è corretto.",
      unlockError: "Non è stato possibile sbloccare l'area accompagnatore.",
      resetTitle: "Eliminare soltanto il PIN genitore?",
      resetBody: "Tutti i progressi di apprendimento rimangono. In seguito potrai creare un nuovo PIN.",
      resetCancel: "Annulla",
      resetDelete: "Elimina PIN",
      forgot: "PIN dimenticato?",
    },
    dashboard: {
      back: "Blocca e torna indietro",
      heroEyebrow: "AREA ACCOMPAGNATORE PROTETTA",
      heroTitle: "Sostieni l'apprendimento senza aggiungere pressione.",
      heroBody: "Questa area riassume gli schemi di apprendimento. Non riproduce i singoli clic e non può modificare XP, ritenzione o punti d'esame.",
      meterAria: (completed, target) => `${completed} sessioni di studio completate; ne sono consigliate ${target}`,
      target: (target) => `Obiettivo: ${target} sessioni tranquille`,
      headlineAria: "Consiglio per questa settimana",
      headlineEyebrow: "CHE COSA AIUTA DI PIÙ ORA",
      summaryAria: "Panoramica settimanale",
      activeTime: "Tempo di studio attivo",
      activeTimeBody: "Il tempo nascosto e inattivo è escluso.",
      independentlySolved: "Risolto in autonomia",
      independentlySolvedBody: (independent, total) => `${independent} domande su ${total}.`,
      dueReviews: "Ripassi previsti",
      dueReviewsBody: "I ripassi restano attività brevi con XP fissi.",
      nextCheck: "Prossima verifica",
      nextCheckBody: (current, target) => `${current} XP su ${target} dall'ultima verifica.`,
      pilotEyebrow: "PILOTA DI TRE SETTIMANE · DA QUESTO PROFILO",
      pilotTitle: "Documentare l'uso senza inventare l'impatto.",
      calendarWeeks: "settimane di calendario",
      pilotIntro: "Questi dati provengono soltanto dalle sessioni di studio salvate. Mostrano ritmo e risposte autonome, ma non motivazione o eventuale aiuto mancante.",
      pilotProgressAria: (weeks) => `${weeks} settimane di calendario su 3 documentate da vere sessioni di studio`,
      pilotFactsAria: "Dati pilota nel profilo attuale",
      observedDaysNone: "ancora nessuna sessione",
      observedDays: (days) => `${days} giorni tra la prima e l'ultima prova`,
      activeDays: "Giorni di studio attivi",
      sessionOne: "sessione completata",
      sessionMany: "sessioni completate",
      independentAnswers: "Risposte autonome",
      questions: (independent, total) => `${independent} domande su ${total}`,
      assessments: "Verifiche",
      assessmentsBody: "varianti simili all'esame senza suggerimenti",
      pilotEmptyTitle: "In questo profilo non c'è ancora una vera sessione di studio.",
      pilotEmptyBody: "Il pilota inizia con la prima lezione o il primo ripasso completato, non con l'onboarding.",
      pilotWeeksAria: "Settimane di calendario con prove di apprendimento",
      learningDayOne: "giorno di studio",
      learningDayMany: "giorni di studio",
      roundOne: "sessione",
      roundMany: "sessioni",
      independentShort: "in autonomia",
      checks: "verifiche",
      signals: "segnali dello studente",
      firstLatest: "PRIMA E ULTIMA VERIFICA",
      onlyCheck: (rate) => `${rate}% in autonomia · per ora una sola verifica`,
      comparison: (first, latest) => `${first}% → ${latest}% in autonomia`,
      noComparison: "Nessun confronto tra verifiche disponibile",
      humanEyebrow: "OSSERVABILE SOLTANTO INSIEME",
      humanTitle: "Queste quattro affermazioni restano prove umane.",
      humanEvidence: [
        "La sessione si è svolta senza aiuto nell'uso dell'interfaccia o nella soluzione.",
        "Lo studente desiderava tornare volontariamente.",
        "Una domanda simile a quella su carta era davvero ancora sconosciuta.",
        "Un valore più alto riflette prestazioni autonome stabili, non soltanto domande diverse.",
      ],
      openPilotEvidence: "Apri prove del pilota nel registro",
      pilotPrivacy: "Nessun nuovo inserimento, testo libero o trasferimento: questa area riassume soltanto la cronologia di apprendimento locale del profilo.",
      patternsEyebrow: "SCHEMI DEGLI ARGOMENTI",
      patternsTitle: "Tre punti utili da osservare",
      noRanking: "non è una classifica",
      supportEyebrow: "AIUTO E RITMO",
      supportTitle: "Solo schemi, nessun controllo individuale",
      questionsWithHint: "Domande con suggerimento",
      selfCorrected: "Corrette in autonomia",
      averageTime: "Tempo attivo medio per domanda",
      ownFeedback: "Riscontro dello studente",
      ownFeedbackTitle: "Che cosa ha segnalato lo studente",
      hurdlesTitle: "Ostacoli matematici rilevati",
      resolvedAfter: (resolved) => `${resolved}× risolti in seguito`,
      supportNote: "L'aiuto non è un insuccesso. Indica dove può servire una spiegazione o un successivo ripasso in autonomia.",
      planEyebrow: "PROSSIME TRE SESSIONI",
      planTitle: "Un piano che lascia respirare",
      planDuration: (minutes) => `circa ${minutes} min in totale`,
      minutesShort: "min",
      mocksEyebrow: "SIMULAZIONI",
      mocksTitle: "Sviluppo e risultati documentati",
      recent: (count) => `ultime ${count}`,
      trendEyebrow: "ANDAMENTO COMPARABILE DEGLI ESAMI GENERATI",
      examFormat: (version) => `Formato d'esame v${version}`,
      runOne: "prova",
      runMany: "prove",
      trendListAria: "Simulazioni generate comparabili",
      previousRun: "unica prova finora",
      firstComparison: "primo confronto",
      latestComparison: "ultimo confronto",
      runNumber: (number) => `prova ${number}`,
      points: "punti",
      certainAria: (points, max) => `${points} punti su ${max} documentati con certezza`,
      rangeAria: (lower, upper) => `${lower} punti documentati con certezza; fino a ${upper} possibili dopo la verifica dei passaggi`,
      completeEvidence: "interamente documentato",
      rangeEvidence: "da certi a possibili dopo la verifica del metodo",
      certainLegend: "documentati con certezza",
      reviewableLegend: "aperti con passaggi",
      trendBoundary: "Soltanto esami generati con la stessa versione del formato. Nessuna nota scolastica e nessun confronto con scale ufficiali specifiche per anno.",
      noMockTitle: "Nessuna simulazione ancora consegnata.",
      noMockBody: "Il piano di studio funziona anche senza pressione immediata da esame.",
      official: (year) => `Ufficiale${year ? ` ${year}` : ""} · `,
      generated: "Generato · ",
      correctedPoints: "punti corretti",
      certainPoints: "punti certi",
      correctionOpen: "La verifica con lo schema di correzione ufficiale è ancora aperta",
      mathsGrade: (grade) => `Nota di matematica ${grade} · non la nota complessiva`,
      methodPoints: (points) => `+${points} punti con passaggi da verificare`,
      noOpenPoints: "Nessun punto manuale aperto",
      examTime: "tempo d'esame",
      authorEyebrow: "CONTROLLA CONTENUTI",
      authorTitle: "Esamina le domande dinamiche nel generatore reale.",
      authorBody: "Tutti i 23 argomenti e tre livelli, con risposte, spiegazioni e segnalazioni d'errore riproducibili. I dati dello studente restano invariati.",
      authorOpen: "Apri laboratorio di controllo",
      releaseEyebrow: "PREPARA IL RILASCIO",
      releaseTitle: "Tieni separate le prove reali su dispositivi, correzione e pilota.",
      releaseBody: "Liste di controllo locali guidate e un registro esportabile, senza dati dello studente e senza fingere che le spunte costituiscano una decisione di rilascio indipendente.",
      releaseOpen: "Apri registro di rilascio",
      privacyTitle: "Resta su questo dispositivo.",
      privacyBody: "Nessun account, pubblicità o analisi comportamentale di terzi. Il PIN genitore viene salvato soltanto come verificatore con salt e non è incluso nei file di backup.",
    },
  },
  de: {
    gate: {
      back: "Fortschritt",
      eyebrow: "FÜR ELTERN UND BEGLEITPERSONEN",
      unlockTitle: "Begleitansicht entsperren",
      setupTitle: "Ruhige Begleitung, getrennt vom Lernmodus.",
      unlockBody: "Der PIN verhindert, dass die verdichteten Lernmuster beim normalen Üben offen herumliegen.",
      setupBody: "Richten Sie einen lokalen PIN ein. Er schützt Wochenmuster, Hilfenutzung und Empfehlungen auf einem gemeinsam verwendeten Gerät.",
      benefits: [
        "Nur zusammengefasste Muster, keine Klick-für-Klick-Überwachung",
        "Keine Möglichkeit, XP oder Ergebnisse zu verändern",
        "Keine Übertragung an einen Server",
      ],
      accessEyebrow: "LOKALER ZUGANG",
      setupEyebrow: "PIN EINRICHTEN",
      pinTitle: "Eltern-PIN",
      choosePinTitle: "4 bis 8 Ziffern wählen",
      pinBody: "Der PIN schützt vor beiläufigem Zugriff auf diesem Gerät; er ersetzt kein Benutzerkonto.",
      repeatPin: "PIN wiederholen",
      wait: "Bitte warten …",
      open: "Begleitansicht öffnen",
      save: "PIN speichern und öffnen",
      invalidPin: "Der Eltern-PIN braucht 4 bis 8 Ziffern.",
      mismatch: "Die beiden PIN-Eingaben stimmen nicht überein.",
      saveError: "Der Eltern-PIN konnte nicht gespeichert werden.",
      enterPin: "Bitte 4 bis 8 Ziffern eingeben.",
      wrongPin: "Dieser PIN stimmt nicht.",
      unlockError: "Die Begleitansicht konnte nicht entsperrt werden.",
      resetTitle: "Nur den Eltern-PIN löschen?",
      resetBody: "Der Lernstand bleibt vollständig erhalten. Danach kann ein neuer PIN eingerichtet werden.",
      resetCancel: "Abbrechen",
      resetDelete: "PIN löschen",
      forgot: "PIN vergessen?",
    },
    dashboard: {
      back: "Sperren und zurück",
      heroEyebrow: "GESCHÜTZTE BEGLEITANSICHT",
      heroTitle: "Unterstützen, ohne Druck aufzubauen.",
      heroBody: "Diese Ansicht verdichtet Lernmuster. Sie zeigt keine Wiedergabe einzelner Klicks und bietet keine Möglichkeit, XP, Behaltensstand oder Prüfungspunkte zu verändern.",
      meterAria: (completed, target) => `${completed} Lernrunden abgeschlossen; empfohlen sind ${target}`,
      target: (target) => `Ziel: ${target} ruhige Runden`,
      headlineAria: "Empfehlung für diese Woche",
      headlineEyebrow: "WAS JETZT AM MEISTEN HILFT",
      summaryAria: "Wochenüberblick",
      activeTime: "Aktive Lernzeit",
      activeTimeBody: "Verdeckte und inaktive Zeit ist ausgeschlossen.",
      independentlySolved: "Selbständig gelöst",
      independentlySolvedBody: (independent, total) => `${independent} von ${total} Aufgaben.`,
      dueReviews: "Fällige Wiederholungen",
      dueReviewsBody: "Reviews bleiben kleinere, feste XP-Aufgaben.",
      nextCheck: "Nächster Check",
      nextCheckBody: (current, target) => `${current} von ${target} XP seit dem letzten Check.`,
      pilotEyebrow: "DREI-WOCHEN-PILOT · SEIT DIESEM PROFIL",
      pilotTitle: "Nutzung belegen, Wirkung nicht erfinden.",
      calendarWeeks: "Kalenderwochen",
      pilotIntro: "Diese Zahlen entstehen nur aus bereits gespeicherten Lernrunden. Sie zeigen Rhythmus und selbständige Antworten, aber weder Motivation noch fehlendes Coaching.",
      pilotProgressAria: (weeks) => `${weeks} von 3 Kalenderwochen mit echten Lernrunden belegt`,
      pilotFactsAria: "Pilotdaten im aktuellen Profil",
      observedDaysNone: "noch ohne Runde",
      observedDays: (days) => `${days} Tage zwischen erstem und jüngstem Beleg`,
      activeDays: "Aktive Lerntage",
      sessionOne: "abgeschlossene Runde",
      sessionMany: "abgeschlossene Runden",
      independentAnswers: "Selbständige Antworten",
      questions: (independent, total) => `${independent} von ${total} Aufgaben`,
      assessments: "Standortbestimmungen",
      assessmentsBody: "prüfungsnahe Varianten ohne Hinweise",
      pilotEmptyTitle: "Noch keine echte Lernrunde in diesem Profil.",
      pilotEmptyBody: "Der Pilot beginnt mit der ersten abgeschlossenen Lektion oder Wiederholung – nicht mit dem Onboarding.",
      pilotWeeksAria: "Kalenderwochen mit Lernbelegen",
      learningDayOne: "Lerntag",
      learningDayMany: "Lerntage",
      roundOne: "Runde",
      roundMany: "Runden",
      independentShort: "selbständig",
      checks: "Checks",
      signals: "eigene Signale",
      firstLatest: "ERSTER UND JÜNGSTER CHECK",
      onlyCheck: (rate) => `${rate}% selbständig · erst ein Check`,
      comparison: (first, latest) => `${first}% → ${latest}% selbständig`,
      noComparison: "Noch kein Check-Vergleich",
      humanEyebrow: "NUR GEMEINSAM BEOBACHTBAR",
      humanTitle: "Diese vier Aussagen bleiben menschliche Belege.",
      humanEvidence: [
        "Die Runde lief ohne Bedien- oder Lösungscoaching.",
        "Die lernende Person wollte freiwillig zurückkehren.",
        "Eine papiernahe Aufgabe war ihr wirklich noch unbekannt.",
        "Ein höherer Wert zeigt stabile selbständige Leistung und nicht nur andere Aufgaben.",
      ],
      openPilotEvidence: "Pilotbelege im Protokoll öffnen",
      pilotPrivacy: "Keine neue Eingabe, kein Freitext und keine Übertragung: Die Ansicht verdichtet nur den lokalen Lernverlauf dieses Profils.",
      patternsEyebrow: "THEMENMUSTER",
      patternsTitle: "Drei sinnvolle Blickpunkte",
      noRanking: "keine Rangliste",
      supportEyebrow: "HILFE UND TEMPO",
      supportTitle: "Nur Muster, keine Einzelkontrolle",
      questionsWithHint: "Aufgaben mit Hinweis",
      selfCorrected: "Selbst korrigiert",
      averageTime: "Ø aktive Zeit pro Aufgabe",
      ownFeedback: "Eigene Rückmeldungen",
      ownFeedbackTitle: "Was die lernende Person selbst gemeldet hat",
      hurdlesTitle: "Erkannte mathematische Hürden",
      resolvedAfter: (resolved) => `${resolved}× danach gelöst`,
      supportNote: "Hilfe ist kein Misserfolg. Sie markiert, wo eine Erklärung oder eine spätere selbständige Wiederholung sinnvoll ist.",
      planEyebrow: "NÄCHSTE DREI EINHEITEN",
      planTitle: "Ein Plan, der Luft lässt",
      planDuration: (minutes) => `zusammen etwa ${minutes} Min.`,
      minutesShort: "Min.",
      mocksEyebrow: "PROBEPRÜFUNGEN",
      mocksTitle: "Entwicklung und belegte Ergebnisse",
      recent: (count) => `letzte ${count}`,
      trendEyebrow: "VERGLEICHBARER GENERIERTER VERLAUF",
      examFormat: (version) => `Prüfungsformat v${version}`,
      runOne: "Lauf",
      runMany: "Läufe",
      trendListAria: "Vergleichbare generierte Probeprüfungen",
      previousRun: "bisheriger Lauf",
      firstComparison: "erster Vergleich",
      latestComparison: "neuester Vergleich",
      runNumber: (number) => `Lauf ${number}`,
      points: "Punkte",
      certainAria: (points, max) => `${points} von ${max} Punkten sicher belegt`,
      rangeAria: (lower, upper) => `${lower} Punkte sicher belegt; bis ${upper} Punkte nach Prüfung des Rechenwegs möglich`,
      completeEvidence: "vollständig belegt",
      rangeEvidence: "sicher bis nach Rechenwegprüfung möglich",
      certainLegend: "sicher belegt",
      reviewableLegend: "mit Rechenweg offen",
      trendBoundary: "Nur generierte Prüfungen derselben Formatversion. Keine Schulnote und kein Vergleich mit offiziellen Jahrgangsskalen.",
      noMockTitle: "Noch keine abgegebene Probeprüfung.",
      noMockBody: "Der Lernplan funktioniert auch ohne sofortigen Prüfungsdruck.",
      official: (year) => `Offiziell${year ? ` ${year}` : ""} · `,
      generated: "Generiert · ",
      correctedPoints: "korrigierte Punkte",
      certainPoints: "sichere Punkte",
      correctionOpen: "Die Korrektur mit dem offiziellen Schema ist noch offen",
      mathsGrade: (grade) => `Mathematiknote ${grade} · nicht die Gesamtnote`,
      methodPoints: (points) => `+${points} Punkte mit Rechenweg zu prüfen`,
      noOpenPoints: "Keine offenen manuellen Punkte",
      examTime: "Prüfungszeit",
      authorEyebrow: "INHALTE PRÜFEN",
      authorTitle: "Dynamische Aufgaben im echten Generator ansehen.",
      authorBody: "Alle 23 Themen und drei Stufen, mit Lösung, Erklärungen und reproduzierbarem Fehlerbericht. Lerndaten bleiben unangetastet.",
      authorOpen: "Prüflabor öffnen",
      releaseEyebrow: "FREIGABE VORBEREITEN",
      releaseTitle: "Echte Geräte-, Korrektur- und Pilotbelege sauber trennen.",
      releaseBody: "Geführte lokale Checklisten und ein exportierbares Protokoll – ohne Lernerdaten und ohne aus Haken eine unabhängige Freigabe zu erfinden.",
      releaseOpen: "Freigabeprotokoll öffnen",
      privacyTitle: "Bleibt auf diesem Gerät.",
      privacyBody: "Kein Konto, keine Werbung und keine Verhaltensanalyse durch Dritte. Der Eltern-PIN wird nur als gesalzener Prüfwiderstand gespeichert und ist nicht Teil der Sicherungsdatei.",
    },
  },
} satisfies Record<LearningLocale, ParentAreaCopy>

const copy: Record<LearningLocale, ParentAreaCopy> = baseCopy

export function parentAreaCopy(locale: LearningLocale): ParentAreaCopy {
  return copy[locale]
}
