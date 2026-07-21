import type { LearningLocale } from "../domain/model"
import {
  buildReleaseReadinessMarkdown,
  isTraceableReleaseBuild,
  releaseReadinessProgress,
  releaseReadinessSections,
  type ReleaseReadinessRecord,
  type ReleaseRuntimeEvidence,
  type ReleaseReadinessCheckId,
  type ReleaseReadinessSectionId,
} from "../domain/releaseReadiness"

interface ReleaseSectionCopy {
  eyebrow: string
  title: string
  summary: string
  reviewer: string
}

const englishSections: Record<ReleaseReadinessSectionId, ReleaseSectionCopy> = {
  "physical-ipad": {
    eyebrow: "PRIMARY DEVICE",
    title: "Physical iPad verification",
    summary: "Safari installation, local durability, and offline work must be evidenced on the real device.",
    reviewer: "Device test by the responsible person",
  },
  "official-2015": {
    eyebrow: "INDEPENDENT MARKING",
    title: "Official 2015 replay",
    summary: "The deterministic Task 9 boundary and explicit no-grade-scale state require a second qualified person.",
    reviewer: "Independent maths teacher or experienced ZAP marker",
  },
  "official-2023": {
    eyebrow: "INDEPENDENT MARKING",
    title: "Official 2023 replay",
    summary: "Tasks 4 and 8 have narrow secure boundaries; all other points and the missing year-specific scale remain honestly manual.",
    reviewer: "Independent maths teacher or experienced ZAP marker",
  },
  "official-2024": {
    eyebrow: "INDEPENDENT MARKING",
    title: "Official 2024 replay",
    summary: "All 36 points remain manual; the separate official maths scale must be checked in full.",
    reviewer: "Independent maths teacher or experienced ZAP marker",
  },
  "official-2025": {
    eyebrow: "INDEPENDENT MARKING",
    title: "Official 2025 replay",
    summary: "The conservative secure lower bounds, addenda, and year-specific scale must be compared with the rendered originals.",
    reviewer: "Independent maths teacher or experienced ZAP marker",
  },
  "learner-pilot": {
    eyebrow: "PRODUCT EVIDENCE",
    title: "Three-week learner pilot",
    summary: "The app is a successful learning product only if the learner returns without developer help and becomes more independent on fresh questions.",
    reviewer: "Learner and accompanying adult",
  },
  "operator-legal": {
    eyebrow: "BEFORE PUBLIC RELEASE",
    title: "Operator, privacy, and content rights",
    summary: "Technical safety does not replace a responsible operator identity or jurisdiction-specific legal review.",
    reviewer: "Responsible operator with suitable external legal and privacy review",
  },
}

const italianSections: Record<ReleaseReadinessSectionId, ReleaseSectionCopy> = {
  "physical-ipad": {
    eyebrow: "DISPOSITIVO PRINCIPALE",
    title: "Verifica su iPad fisico",
    summary: "Installazione da Safari, persistenza locale e funzionamento offline devono essere documentati sul dispositivo reale.",
    reviewer: "Test del dispositivo da parte della persona responsabile",
  },
  "official-2015": {
    eyebrow: "CORREZIONE INDIPENDENTE",
    title: "Prova ufficiale 2015",
    summary: "Il limite deterministico dell'esercizio 9 e l'assenza esplicita di una scala delle note richiedono una seconda persona qualificata.",
    reviewer: "Insegnante di matematica indipendente o correttore ZAP esperto",
  },
  "official-2023": {
    eyebrow: "CORREZIONE INDIPENDENTE",
    title: "Prova ufficiale 2023",
    summary: "Gli esercizi 4 e 8 hanno limiti sicuri ristretti; tutti gli altri punti e la scala specifica per anno mancante restano correttamente manuali.",
    reviewer: "Insegnante di matematica indipendente o correttore ZAP esperto",
  },
  "official-2024": {
    eyebrow: "CORREZIONE INDIPENDENTE",
    title: "Prova ufficiale 2024",
    summary: "Tutti i 36 punti restano manuali; la scala ufficiale separata di matematica deve essere verificata integralmente.",
    reviewer: "Insegnante di matematica indipendente o correttore ZAP esperto",
  },
  "official-2025": {
    eyebrow: "CORREZIONE INDIPENDENTE",
    title: "Prova ufficiale 2025",
    summary: "I limiti inferiori sicuri e prudenti, le aggiunte e la scala specifica per anno devono essere confrontati con gli originali visualizzati.",
    reviewer: "Insegnante di matematica indipendente o correttore ZAP esperto",
  },
  "learner-pilot": {
    eyebrow: "PROVA DEL PRODOTTO",
    title: "Pilota di tre settimane con lo studente",
    summary: "L'app è un prodotto didattico riuscito soltanto se lo studente ritorna senza l'aiuto dello sviluppatore e diventa più autonomo con domande nuove.",
    reviewer: "Studente e adulto accompagnatore",
  },
  "operator-legal": {
    eyebrow: "PRIMA DEL RILASCIO PUBBLICO",
    title: "Gestore, privacy e diritti sui contenuti",
    summary: "La sicurezza tecnica non sostituisce l'identità di un gestore responsabile né una verifica giuridica specifica per la giurisdizione.",
    reviewer: "Gestore responsabile con adeguata consulenza esterna legale e sulla privacy",
  },
}

const spanishSections: Record<ReleaseReadinessSectionId, ReleaseSectionCopy> = {
  "physical-ipad": {
    eyebrow: "DISPOSITIVO PRINCIPAL",
    title: "Verificación en un iPad físico",
    summary: "La instalación desde Safari, la persistencia local y el trabajo sin conexión deben demostrarse en el dispositivo real.",
    reviewer: "Prueba del dispositivo por la persona responsable",
  },
  "official-2015": {
    eyebrow: "CORRECCIÓN INDEPENDIENTE",
    title: "Simulación oficial de 2015",
    summary: "El límite determinista del ejercicio 9 y la ausencia explícita de una escala de notas requieren una segunda persona cualificada.",
    reviewer: "Docente de matemáticas independiente o corrector ZAP con experiencia",
  },
  "official-2023": {
    eyebrow: "CORRECCIÓN INDEPENDIENTE",
    title: "Simulación oficial de 2023",
    summary: "Los ejercicios 4 y 8 tienen límites seguros estrechos; todos los demás puntos y la escala específica de ese año que falta siguen siendo honestamente manuales.",
    reviewer: "Docente de matemáticas independiente o corrector ZAP con experiencia",
  },
  "official-2024": {
    eyebrow: "CORRECCIÓN INDEPENDIENTE",
    title: "Simulación oficial de 2024",
    summary: "Los 36 puntos siguen siendo manuales; la escala oficial independiente de matemáticas debe comprobarse por completo.",
    reviewer: "Docente de matemáticas independiente o corrector ZAP con experiencia",
  },
  "official-2025": {
    eyebrow: "CORRECCIÓN INDEPENDIENTE",
    title: "Simulación oficial de 2025",
    summary: "Los límites inferiores seguros y prudentes, las adiciones y la escala específica de ese año deben compararse con los originales renderizados.",
    reviewer: "Docente de matemáticas independiente o corrector ZAP con experiencia",
  },
  "learner-pilot": {
    eyebrow: "EVIDENCIA DEL PRODUCTO",
    title: "Prueba de tres semanas con el estudiante",
    summary: "La aplicación solo es un buen producto de aprendizaje si el estudiante vuelve sin ayuda del desarrollador y gana autonomía con preguntas nuevas.",
    reviewer: "Estudiante y persona adulta acompañante",
  },
  "operator-legal": {
    eyebrow: "ANTES DE LA PUBLICACIÓN",
    title: "Responsable, privacidad y derechos de contenido",
    summary: "La seguridad técnica no sustituye la identidad de una persona responsable ni la revisión jurídica específica de cada jurisdicción.",
    reviewer: "Responsable con revisión externa adecuada en materia jurídica y de privacidad",
  },
}

const englishChecks: Record<ReleaseReadinessCheckId, string> = {
  "ipad-standalone": "Added from Safari to the Home Screen and launched in the standalone app window.",
  "ipad-reading-geometry": "Selected calmer reading and left-side tools, reloaded, and opened Geometric loci; reading mode and tool side persisted without obscuring the construction plan.",
  "ipad-pause-resume": "Paused a lesson containing an entered answer for one minute; the question was hidden and learning time stable, then restored exactly after force-quitting.",
  "ipad-offline-finish": "Restarted without Wi-Fi or mobile data, finished a lesson, and then found XP, review date, and debrief unchanged.",
  "ipad-report-handoff": "Opened a question report in a separate browser view; neither nickname nor entered answer was included.",
  "ipad-teacher-queue": "Paused a topic, explained and reopened it in the PIN-protected companion queue, without changing existing XP.",
  "ipad-reset": "Reset the test profile; onboarding appeared empty and learning state, active work, private PDFs, and parent PIN were removed.",
  "ipad-private-archive": "Imported all 22 registered PDFs, opened an older task/solution pair, and checked the replay boundaries for 2015/2023/2024/2025.",
  "ipad-source-training": "Started a 2016–2022 source practice: the absolute 60-minute deadline survived leaving and reloading, solutions stayed locked, every question required bounded self-review, and completion created neither points/grade nor XP/mastery/review.",
  "ipad-backup-boundary": "Confirmed that private PDFs exist only on this iPad and are absent from the encrypted learning backup.",
  "ipad-manual-accessibility": "Manually verified VoiceOver reading order, 200% text zoom without horizontal scrolling, touch/Pencil targets, and geometry construction as usable on the physical iPad.",
  "official-2015-sources": "Compared both source hashes, all nine task/solution pages, and answer surfaces with the originals.",
  "official-2015-task9": "Reproduced all five documented Task 9 point paths and confirmed the fixed lower and upper bounds.",
  "official-2015-manual": "Confirmed that Tasks 1–8 remain fully human-marked.",
  "official-2015-no-grade": "Confirmed corrected 0–36 points, 2015 labelling, and missing grade conversion in results, progress, and companion view.",
  "official-2015-independent": "Documented the independent marker's name, role/experience, date, and discrepancies in the exported log.",
  "official-2023-sources": "Compared both source hashes, all nine task/solution mappings, and answer surfaces with the originals.",
  "official-2023-boundaries": "Reproduced the Task 4 penalty matrix and exact Task 8 answer 156; confirmed fixed point boundaries.",
  "official-2023-manual": "Confirmed that all remaining points stay human-marked.",
  "official-2023-no-grade": "Confirmed corrected 0–36 points, 2023 labelling, and missing grade conversion in every relevant view.",
  "official-2023-independent": "Documented the independent marker's name, role/experience, date, and discrepancies in the exported log.",
  "official-2024-sources": "Compared the task, solution, and grade-scale hashes plus all nine page/answer mappings with the originals.",
  "official-2024-manual": "Checked empty and numerically correct runs; consistently confirmed 0 secure and 36 human-review points.",
  "official-2024-controls": "Confirmed answer surfaces, general marking rules, and the paper-bound Task 7 boundary.",
  "official-2024-scale": "Checked all 37 integer point values from 0–36 against the official 2024 maths scale; labelling never implies overall grade or pass.",
  "official-2024-independent": "Documented the independent marker's name, role/experience, date, and discrepancies in the exported log.",
  "official-2025-sources": "Compared both source hashes plus task pages, solution pages, and answer surfaces for Tasks 1–9 with the originals.",
  "official-2025-golden": "Checked full marks, every explicit intermediate-value lower bound, zero points, single errors, units, and plausible non-points for each task.",
  "official-2025-addenda": "Reproduced the 3/7 route, both Task 6b continuations, Task 9 area families, and all v1.1 additions.",
  "official-2025-manual": "Confirmed Task 7 and all working visible only on paper or not safely structured remain human-marked.",
  "official-2025-scale": "Checked 0–36 points against the 2025 maths scale; no overall grade, pass claim, or transfer of the scale to generated exams.",
  "official-2025-independent": "Documented the independent marker's name, role/experience, date, and discrepancies in the exported log.",
  "pilot-three-weeks": "Observed at least three different calendar weeks containing real, not merely test-generated, learning rounds.",
  "pilot-uncoached": "Completed several lessons/reviews without interface or solution coaching by the developer.",
  "pilot-panel": "Checked the protected pilot overview against observed calendar weeks, active days, completed rounds, independent answers, and bounded learner signals.",
  "pilot-assessments": "Completed at least two periodic assessments and compared the first/latest independent answer share from question evidence, without automatically calling a change improvement or causation.",
  "pilot-unseen-evidence": "Observed at least one genuinely unseen paper-like question outside the reused training path and documented it with a data-minimising result or reviewer note.",
  "pilot-confusion-loop": "Reviewed reported confusion together, changed the most important one or two product issues, and observed again with fresh questions.",
  "pilot-return-decision": "The learner wanted to return voluntarily; continuation, change, or stopping was discussed and documented without pressure.",
  "legal-operator-contact": "Established a responsible operator and functioning contact route.",
  "legal-privacy-review": "Obtained qualified review of privacy, minors, local data storage, hosting requests, export/deletion, and optional later services.",
  "legal-content-rights": "Clarified rights and permitted use of names, question formats, source references, private original PDFs, and original variants.",
  "legal-public-copy": "Updated privacy/operator copy; removed technical-preview qualification and search-engine blocking deliberately only after release approval.",
}

const italianChecks: Record<ReleaseReadinessCheckId, string> = {
  "ipad-standalone": "Aggiunta da Safari alla schermata Home e avviata nella finestra autonoma dell'app.",
  "ipad-reading-geometry": "Selezionati lettura più tranquilla e strumenti a sinistra, ricaricata la pagina e aperti i luoghi geometrici; modalità di lettura e lato degli strumenti sono rimasti invariati senza coprire il piano di costruzione.",
  "ipad-pause-resume": "Messa in pausa per un minuto una lezione con una risposta inserita; la domanda è stata nascosta e il tempo di studio è rimasto fermo, poi tutto è stato ripristinato esattamente dopo la chiusura forzata.",
  "ipad-offline-finish": "Riavviata senza Wi-Fi o dati mobili, completata una lezione e verificati XP, data del ripasso e riepilogo invariati.",
  "ipad-report-handoff": "Aperta la segnalazione di una domanda in una vista separata del browser; non conteneva né soprannome né risposta inserita.",
  "ipad-teacher-queue": "Messo in pausa un argomento, spiegato e riaperto nella coda protetta da PIN, senza modificare gli XP esistenti.",
  "ipad-reset": "Azzerato il profilo di test; l'onboarding è apparso vuoto e stato di apprendimento, attività in corso, PDF privati e PIN genitore sono stati rimossi.",
  "ipad-private-archive": "Importati tutti i 22 PDF registrati, aperta una coppia domande/soluzioni precedente e controllati i limiti delle prove 2015/2023/2024/2025.",
  "ipad-source-training": "Avviato un allenamento da fonte 2016–2022: il limite assoluto di 60 minuti è sopravvissuto all'uscita e alla ricarica, le soluzioni sono rimaste bloccate, ogni domanda ha richiesto un'autoverifica limitata e il completamento non ha generato né punti/nota né XP/padronanza/ripasso.",
  "ipad-backup-boundary": "Confermato che i PDF privati esistono soltanto su questo iPad e sono assenti dal backup cifrato dell'apprendimento.",
  "ipad-manual-accessibility": "Verificati manualmente ordine di lettura VoiceOver, zoom del testo al 200% senza scorrimento orizzontale, bersagli touch/Pencil e costruzione geometrica utilizzabile sull'iPad fisico.",
  "official-2015-sources": "Confrontati entrambi gli hash delle fonti, tutte le nove pagine di esercizi/soluzioni e i campi di risposta con gli originali.",
  "official-2015-task9": "Riprodotti tutti i cinque percorsi documentati per i punti dell'esercizio 9 e confermati i limiti inferiore e superiore fissi.",
  "official-2015-manual": "Confermato che gli esercizi 1–8 restano interamente corretti da una persona.",
  "official-2015-no-grade": "Confermati 0–36 punti corretti, indicazione 2015 e conversione in nota assente in risultati, progressi e area accompagnatore.",
  "official-2015-independent": "Documentati nel registro esportato nome, ruolo/esperienza, data e discrepanze del correttore indipendente.",
  "official-2023-sources": "Confrontati entrambi gli hash delle fonti, tutte le nove corrispondenze esercizio/soluzione e i campi di risposta con gli originali.",
  "official-2023-boundaries": "Riprodotti la matrice delle penalità dell'esercizio 4 e il risultato esatto 156 dell'esercizio 8; confermati i limiti fissi dei punti.",
  "official-2023-manual": "Confermato che tutti i punti rimanenti restano corretti da una persona.",
  "official-2023-no-grade": "Confermati 0–36 punti corretti, indicazione 2023 e conversione in nota assente in ogni vista pertinente.",
  "official-2023-independent": "Documentati nel registro esportato nome, ruolo/esperienza, data e discrepanze del correttore indipendente.",
  "official-2024-sources": "Confrontati con gli originali gli hash di esercizi, soluzioni e scala delle note, oltre a tutte le nove corrispondenze pagina/risposta.",
  "official-2024-manual": "Controllate prove vuote e numericamente corrette; confermati in modo coerente 0 punti sicuri e 36 da verifica umana.",
  "official-2024-controls": "Confermati campi di risposta, regole generali di correzione e limite su carta dell'esercizio 7.",
  "official-2024-scale": "Controllati tutti i 37 valori interi da 0 a 36 con la scala ufficiale 2024 di matematica; l'etichetta non suggerisce mai nota complessiva o superamento.",
  "official-2024-independent": "Documentati nel registro esportato nome, ruolo/esperienza, data e discrepanze del correttore indipendente.",
  "official-2025-sources": "Confrontati con gli originali entrambi gli hash delle fonti, le pagine degli esercizi, le pagine delle soluzioni e i campi di risposta degli esercizi 1–9.",
  "official-2025-golden": "Controllati punteggio pieno, ogni limite inferiore esplicito basato su valori intermedi, zero punti, errori singoli, unità e non-punti plausibili per ogni esercizio.",
  "official-2025-addenda": "Riprodotti il percorso 3/7, entrambe le continuazioni dell'esercizio 6b, le famiglie di area dell'esercizio 9 e tutte le aggiunte v1.1.",
  "official-2025-manual": "Confermato che l'esercizio 7 e tutti i passaggi visibili soltanto su carta o non strutturabili in sicurezza restano corretti da una persona.",
  "official-2025-scale": "Controllati 0–36 punti con la scala 2025 di matematica; nessuna pretesa di nota complessiva o superamento e nessun trasferimento della scala agli esami generati.",
  "official-2025-independent": "Documentati nel registro esportato nome, ruolo/esperienza, data e discrepanze del correttore indipendente.",
  "pilot-three-weeks": "Osservate almeno tre settimane di calendario diverse con vere sessioni di studio, non soltanto generate per test.",
  "pilot-uncoached": "Completate varie lezioni/ripassi senza aiuto dello sviluppatore nell'interfaccia o nella soluzione.",
  "pilot-panel": "Confrontata la panoramica pilota protetta con settimane osservate, giorni attivi, sessioni completate, risposte autonome e segnali limitati dello studente.",
  "pilot-assessments": "Completate almeno due verifiche periodiche e confrontata la quota di risposte autonome della prima e dell'ultima in base alle domande, senza chiamare automaticamente il cambiamento miglioramento o causalità.",
  "pilot-unseen-evidence": "Osservata almeno una domanda realmente nuova e simile a quella su carta fuori dal percorso di allenamento riutilizzato, documentata con un risultato che minimizza i dati o una nota del revisore.",
  "pilot-confusion-loop": "Esaminate insieme le confusioni segnalate, modificati uno o due problemi principali del prodotto e osservato di nuovo con domande nuove.",
  "pilot-return-decision": "Lo studente desiderava tornare volontariamente; continuazione, cambiamento o interruzione sono stati discussi e documentati senza pressione.",
  "legal-operator-contact": "Stabiliti un gestore responsabile e un canale di contatto funzionante.",
  "legal-privacy-review": "Ottenuta una verifica qualificata su privacy, minori, archiviazione locale, richieste all'hosting, esportazione/eliminazione e possibili servizi futuri.",
  "legal-content-rights": "Chiariti diritti e uso consentito di nomi, formati delle domande, riferimenti alle fonti, PDF originali privati e varianti originali.",
  "legal-public-copy": "Aggiornati testi su privacy/gestore; qualificazione come anteprima tecnica e blocco dei motori di ricerca rimossi deliberatamente soltanto dopo l'approvazione del rilascio.",
}

const spanishChecks: Record<ReleaseReadinessCheckId, string> = {
  "ipad-standalone": "Añadida desde Safari a la pantalla de inicio e iniciada en la ventana independiente de la aplicación.",
  "ipad-reading-geometry": "Seleccionados el modo de lectura tranquila y las herramientas a la izquierda, recargada la página y abiertos los lugares geométricos; el modo y el lado persistieron sin tapar el plano de construcción.",
  "ipad-pause-resume": "Pausada durante un minuto una lección con una respuesta introducida; la pregunta quedó oculta y el tiempo estable, y todo se restauró exactamente tras forzar el cierre.",
  "ipad-offline-finish": "Reiniciada sin Wi-Fi ni datos móviles, completada una lección y comprobados sin cambios los XP, la fecha del repaso y el resumen.",
  "ipad-report-handoff": "Abierto un informe de pregunta en una vista separada del navegador; no incluía ni el apodo ni la respuesta introducida.",
  "ipad-teacher-queue": "Pausado un tema, explicado y reabierto en la cola protegida con PIN, sin cambiar los XP existentes.",
  "ipad-reset": "Restablecido el perfil de prueba; la bienvenida apareció vacía y se eliminaron el estado de aprendizaje, el trabajo activo, los PDF privados y el PIN familiar.",
  "ipad-private-archive": "Importados los 22 PDF registrados, abierta una pareja antigua de enunciados y soluciones y comprobados los límites de las simulaciones 2015/2023/2024/2025.",
  "ipad-source-training": "Iniciado un entrenamiento de fuente 2016–2022: el límite absoluto de 60 minutos sobrevivió a salir y recargar, las soluciones siguieron bloqueadas, cada pregunta exigió una autorrevisión limitada y terminar no creó puntos, nota, XP, dominio ni repaso.",
  "ipad-backup-boundary": "Confirmado que los PDF privados solo existen en este iPad y no aparecen en la copia de seguridad cifrada del aprendizaje.",
  "ipad-manual-accessibility": "Verificados manualmente el orden de lectura de VoiceOver, el zoom de texto al 200 % sin desplazamiento horizontal, los objetivos táctiles/Pencil y la construcción geométrica utilizable en el iPad físico.",
  "official-2015-sources": "Comparados con los originales ambos hashes de fuente, las nueve páginas de ejercicios/soluciones y las superficies de respuesta.",
  "official-2015-task9": "Reproducidas las cinco rutas documentadas de puntos del ejercicio 9 y confirmados los límites inferior y superior fijos.",
  "official-2015-manual": "Confirmado que los ejercicios 1–8 siguen corregidos completamente por una persona.",
  "official-2015-no-grade": "Confirmados 0–36 puntos corregidos, la etiqueta 2015 y la ausencia de conversión a nota en resultados, progreso y vista de acompañamiento.",
  "official-2015-independent": "Documentados en el registro exportado el nombre, función/experiencia, fecha y discrepancias del corrector independiente.",
  "official-2023-sources": "Comparados con los originales ambos hashes de fuente, las nueve correspondencias ejercicio/solución y las superficies de respuesta.",
  "official-2023-boundaries": "Reproducidas la matriz de penalización del ejercicio 4 y la respuesta exacta 156 del ejercicio 8; confirmados los límites fijos de puntos.",
  "official-2023-manual": "Confirmado que todos los puntos restantes siguen corregidos por una persona.",
  "official-2023-no-grade": "Confirmados 0–36 puntos corregidos, la etiqueta 2023 y la ausencia de conversión a nota en todas las vistas pertinentes.",
  "official-2023-independent": "Documentados en el registro exportado el nombre, función/experiencia, fecha y discrepancias del corrector independiente.",
  "official-2024-sources": "Comparados con los originales los hashes de enunciados, soluciones y escala de notas, además de las nueve correspondencias de página/respuesta.",
  "official-2024-manual": "Comprobados intentos vacíos y numéricamente correctos; confirmados de forma consistente 0 puntos seguros y 36 de revisión humana.",
  "official-2024-controls": "Confirmadas las superficies de respuesta, las reglas generales de corrección y el límite en papel del ejercicio 7.",
  "official-2024-scale": "Comprobados los 37 valores enteros de 0 a 36 con la escala oficial de matemáticas de 2024; la etiqueta nunca implica nota global ni aprobado.",
  "official-2024-independent": "Documentados en el registro exportado el nombre, función/experiencia, fecha y discrepancias del corrector independiente.",
  "official-2025-sources": "Comparados con los originales ambos hashes de fuente, las páginas de ejercicios y soluciones y las superficies de respuesta de los ejercicios 1–9.",
  "official-2025-golden": "Comprobados para cada ejercicio la puntuación completa, todos los límites inferiores explícitos de valores intermedios, cero puntos, errores únicos, unidades y no-puntos plausibles.",
  "official-2025-addenda": "Reproducidas la ruta 3/7, ambas continuaciones del ejercicio 6b, las familias de área del ejercicio 9 y todas las adiciones v1.1.",
  "official-2025-manual": "Confirmado que el ejercicio 7 y todo procedimiento visible solo en papel o que no pueda estructurarse con seguridad siguen siendo de corrección humana.",
  "official-2025-scale": "Comprobados 0–36 puntos con la escala de matemáticas de 2025; sin afirmación de nota global o aprobado ni transferencia de la escala a exámenes generados.",
  "official-2025-independent": "Documentados en el registro exportado el nombre, función/experiencia, fecha y discrepancias del corrector independiente.",
  "pilot-three-weeks": "Observadas al menos tres semanas naturales distintas con sesiones de aprendizaje reales y no solo generadas para pruebas.",
  "pilot-uncoached": "Completadas varias lecciones o repasos sin ayuda del desarrollador con la interfaz o las soluciones.",
  "pilot-panel": "Comparado el resumen protegido de la prueba con las semanas observadas, los días activos, las sesiones completadas, las respuestas autónomas y las señales limitadas del estudiante.",
  "pilot-assessments": "Completadas al menos dos evaluaciones periódicas y comparada la proporción de respuestas autónomas de la primera y la última a partir de las preguntas, sin llamar automáticamente mejora o causalidad al cambio.",
  "pilot-unseen-evidence": "Observada al menos una pregunta realmente nueva y parecida a las de papel fuera de la ruta de entrenamiento reutilizada, y documentada con un resultado que minimiza datos o una nota del revisor.",
  "pilot-confusion-loop": "Revisadas juntos las confusiones indicadas, cambiados uno o dos problemas principales del producto y observado de nuevo con preguntas nuevas.",
  "pilot-return-decision": "El estudiante quiso volver voluntariamente; se comentaron y documentaron sin presión la continuación, el cambio o la interrupción.",
  "legal-operator-contact": "Establecidos una persona responsable y un canal de contacto funcional.",
  "legal-privacy-review": "Obtenida una revisión cualificada sobre privacidad, menores, almacenamiento local, solicitudes al alojamiento, exportación/eliminación y posibles servicios posteriores.",
  "legal-content-rights": "Aclarados los derechos y usos permitidos de nombres, formatos de preguntas, referencias a fuentes, PDF originales privados y variantes originales.",
  "legal-public-copy": "Actualizados los textos de privacidad y responsable; la calificación de vista técnica y el bloqueo de buscadores solo se retiraron deliberadamente tras aprobar la publicación.",
}

export function releaseReadinessSectionsForLocale(locale: LearningLocale) {
  if (locale === "de") return releaseReadinessSections
  const sectionsCopy = locale === "it" ? italianSections : locale === "es" ? spanishSections : englishSections
  const checksCopy = locale === "it" ? italianChecks : locale === "es" ? spanishChecks : englishChecks
  return releaseReadinessSections.map((section) => ({
    ...section,
    ...sectionsCopy[section.id],
    checks: section.checks.map((check) => ({
      ...check,
      label: checksCopy[check.id],
    })),
  }))
}

interface ReleaseReadinessCopy {
  navAria: string
  back: string
  lock: string
  eyebrow: string
  title: string
  body: string
  meterAria: (completed: number, total: number) => string
  recorded: string
  sectionsComplete: (completed: number, total: number) => string
  boundaryTitle: string
  boundaryBody: string
  runtimeEyebrow: string
  runtimeTitle: string
  recapture: string
  appWindow: string
  standalone: string
  safariTab: string
  offlineShell: string
  serviceWorkerActive: string
  notControlled: string
  network: string
  online: string
  offline: string
  capturedAt: (date: string) => string
  runtimeBoundary: string
  untraceable: string
  role: string
  locallyRecorded: string
  notRecorded: string
  exportEyebrow: string
  exportTitle: string
  exportBody: string
  download: string
  downloaded: string
  resetTitle: string
  resetBody: string
  cancel: string
  clear: string
  reset: string
}

const baseUiCopy = {
  en: {
    navAria: "Release log navigation",
    back: "Companion view",
    lock: "Lock",
    eyebrow: "PIN-PROTECTED RELEASE LOG",
    title: "Make missing evidence visible without pretending to approve release.",
    body: "A responsible person can document real iPad, marking, pilot, and legal checks here. A local tick is only an attestation—never automatic proof or independent approval.",
    meterAria: (completed, total) => `${completed} of ${total} release checks recorded locally`,
    recorded: "RECORDED LOCALLY",
    sectionsComplete: (completed, total) => `${completed} of ${total} sections fully documented`,
    boundaryTitle: "This view does not change product status.",
    boundaryBody: "The technical preview remains a technical preview until real evidence has been reviewed by the appropriate people. The log contains no learner names, answers, XP, or learning history and is not included in the encrypted learning backup.",
    runtimeEyebrow: "RUNTIME CAPTURE",
    runtimeTitle: "What this browser window can evidence now.",
    recapture: "Capture again",
    appWindow: "App window",
    standalone: "Standalone detected",
    safariTab: "Safari tab detected",
    offlineShell: "Offline shell",
    serviceWorkerActive: "Service Worker active",
    notControlled: "Not controlled yet",
    network: "Network status",
    online: "Browser reports online",
    offline: "Browser reports offline",
    capturedAt: (date) => `Captured on ${date}.`,
    runtimeBoundary: " Runtime characteristics do not replace a manual step.",
    untraceable: " This development build is not cleanly traceable; its ticks must not be treated as release evidence.",
    role: "Required role",
    locallyRecorded: "Recorded locally",
    notRecorded: "not recorded",
    exportEyebrow: "HAND OFF EVIDENCE",
    exportTitle: "A readable log for the real review.",
    exportBody: "The Markdown file contains every open and recorded item, timestamps, runtime characteristics, and blank fields for reviewers, discrepancies, and the responsible release decision.",
    download: "Download release log",
    downloaded: "Log created—without learner data.",
    resetTitle: "Clear only the release log?",
    resetBody: "Learning state, XP, private PDFs, and parent PIN remain unchanged.",
    cancel: "Cancel",
    clear: "Clear log",
    reset: "Reset local release ticks",
  },
  it: {
    navAria: "Navigazione del registro di rilascio",
    back: "Area accompagnatore",
    lock: "Blocca",
    eyebrow: "REGISTRO DI RILASCIO PROTETTO DA PIN",
    title: "Rendi visibili le prove mancanti senza fingere di approvare il rilascio.",
    body: "Qui una persona responsabile può documentare i controlli reali su iPad, correzione, pilota e aspetti legali. Una spunta locale è soltanto un'attestazione, mai una prova automatica o un'approvazione indipendente.",
    meterAria: (completed, total) => `${completed} controlli di rilascio su ${total} registrati localmente`,
    recorded: "REGISTRATO LOCALMENTE",
    sectionsComplete: (completed, total) => `${completed} sezioni su ${total} interamente documentate`,
    boundaryTitle: "Questa vista non modifica lo stato del prodotto.",
    boundaryBody: "L'anteprima tecnica rimane tale finché le prove reali non vengono esaminate dalle persone adatte. Il registro non contiene nomi, risposte, XP o cronologia di apprendimento e non è incluso nel backup cifrato dell'apprendimento.",
    runtimeEyebrow: "ACQUISIZIONE DELL'AMBIENTE",
    runtimeTitle: "Che cosa può documentare ora questa finestra del browser.",
    recapture: "Acquisisci di nuovo",
    appWindow: "Finestra app",
    standalone: "Modalità autonoma rilevata",
    safariTab: "Scheda Safari rilevata",
    offlineShell: "Struttura offline",
    serviceWorkerActive: "Service Worker attivo",
    notControlled: "Non ancora controllata",
    network: "Stato della rete",
    online: "Il browser segnala online",
    offline: "Il browser segnala offline",
    capturedAt: (date) => `Acquisito il ${date}.`,
    runtimeBoundary: " Le caratteristiche dell'ambiente non sostituiscono un passaggio manuale.",
    untraceable: " Questa build di sviluppo non è tracciabile in modo pulito; le sue spunte non devono essere considerate prove di rilascio.",
    role: "Ruolo richiesto",
    locallyRecorded: "Registrato localmente",
    notRecorded: "non registrato",
    exportEyebrow: "TRASMETTI LE PROVE",
    exportTitle: "Un registro leggibile per la verifica reale.",
    exportBody: "Il file Markdown contiene ogni voce aperta e registrata, data e ora, caratteristiche dell'ambiente e campi vuoti per revisori, discrepanze e decisione responsabile sul rilascio.",
    download: "Scarica registro di rilascio",
    downloaded: "Registro creato, senza dati dello studente.",
    resetTitle: "Eliminare soltanto il registro di rilascio?",
    resetBody: "Stato di apprendimento, XP, PDF privati e PIN genitore restano invariati.",
    cancel: "Annulla",
    clear: "Svuota registro",
    reset: "Azzera spunte locali di rilascio",
  },
  es: {
    navAria: "Navegación del registro de publicación",
    back: "Vista de acompañamiento",
    lock: "Bloquear",
    eyebrow: "REGISTRO DE PUBLICACIÓN PROTEGIDO CON PIN",
    title: "Haz visible la evidencia que falta sin fingir que apruebas la publicación.",
    body: "Una persona responsable puede documentar aquí las comprobaciones reales de iPad, corrección, prueba y aspectos legales. Una marca local es solo una declaración, nunca una prueba automática ni una aprobación independiente.",
    meterAria: (completed, total) => `${completed} de ${total} comprobaciones de publicación registradas localmente`,
    recorded: "REGISTRADO LOCALMENTE",
    sectionsComplete: (completed, total) => `${completed} de ${total} secciones totalmente documentadas`,
    boundaryTitle: "Esta vista no cambia el estado del producto.",
    boundaryBody: "La vista técnica sigue siendo una vista técnica hasta que las personas adecuadas revisen evidencias reales. El registro no contiene nombres, respuestas, XP ni historial de aprendizaje y no se incluye en la copia de seguridad cifrada.",
    runtimeEyebrow: "CAPTURA DEL ENTORNO",
    runtimeTitle: "Lo que esta ventana del navegador puede demostrar ahora.",
    recapture: "Capturar de nuevo",
    appWindow: "Ventana de aplicación",
    standalone: "Modo independiente detectado",
    safariTab: "Pestaña de Safari detectada",
    offlineShell: "Estructura sin conexión",
    serviceWorkerActive: "Service Worker activo",
    notControlled: "Aún sin control",
    network: "Estado de la red",
    online: "El navegador indica conexión",
    offline: "El navegador indica sin conexión",
    capturedAt: (date) => `Capturado el ${date}.`,
    runtimeBoundary: " Las características del entorno no sustituyen un paso manual.",
    untraceable: " Esta compilación de desarrollo no es trazable de forma limpia; sus marcas no deben considerarse evidencia de publicación.",
    role: "Función necesaria",
    locallyRecorded: "Registrado localmente",
    notRecorded: "no registrado",
    exportEyebrow: "ENTREGAR EVIDENCIAS",
    exportTitle: "Un registro legible para la revisión real.",
    exportBody: "El archivo Markdown contiene cada elemento abierto y registrado, marcas de tiempo, características del entorno y campos vacíos para revisores, discrepancias y la decisión responsable de publicación.",
    download: "Descargar registro de publicación",
    downloaded: "Registro creado, sin datos del estudiante.",
    resetTitle: "¿Borrar solo el registro de publicación?",
    resetBody: "El estado de aprendizaje, los XP, los PDF privados y el PIN familiar no cambian.",
    cancel: "Cancelar",
    clear: "Borrar registro",
    reset: "Restablecer marcas locales de publicación",
  },
  de: {
    navAria: "Freigabeprotokoll Navigation",
    back: "Begleitansicht",
    lock: "Sperren",
    eyebrow: "PIN-GESCHÜTZTES FREIGABEPROTOKOLL",
    title: "Offene Belege sichtbar machen, ohne Freigabe zu spielen.",
    body: "Hier kann eine verantwortliche Person die echten iPad-, Korrektur-, Pilot- und Rechtsprüfungen dokumentieren. Ein lokaler Haken ist nur eine Attestation – nie ein automatischer Beweis oder eine unabhängige Freigabe.",
    meterAria: (completed, total) => `${completed} von ${total} Freigabepunkten lokal erfasst`,
    recorded: "LOKAL ERFASST",
    sectionsComplete: (completed, total) => `${completed} von ${total} Bereichen vollständig dokumentiert`,
    boundaryTitle: "Diese Ansicht ändert den Produktstatus nicht.",
    boundaryBody: "Die technische Vorschau bleibt eine technische Vorschau, bis echte Belege von den passenden Personen geprüft wurden. Das Protokoll enthält keine Lernernamen, Antworten, XP oder Lernverläufe und ist nicht Teil der verschlüsselten Lernstandsicherung.",
    runtimeEyebrow: "LAUFZEITAUFNAHME",
    runtimeTitle: "Was dieses Browserfenster gerade belegen kann.",
    recapture: "Neu erfassen",
    appWindow: "App-Fenster",
    standalone: "Standalone erkannt",
    safariTab: "Safari-Tab erkannt",
    offlineShell: "Offline-Shell",
    serviceWorkerActive: "Service Worker aktiv",
    notControlled: "Noch nicht kontrolliert",
    network: "Netzstatus",
    online: "Browser meldet online",
    offline: "Browser meldet offline",
    capturedAt: (date) => `Aufgenommen am ${date}.`,
    runtimeBoundary: " Laufzeitmerkmale ersetzen keinen manuellen Schritt.",
    untraceable: " Dieser Entwicklungsstand ist nicht sauber nachvollziehbar; seine Haken dürfen nicht als Freigabebeleg gelten.",
    role: "Erforderliche Rolle",
    locallyRecorded: "Lokal erfasst",
    notRecorded: "nicht erfasst",
    exportEyebrow: "BELEG WEITERGEBEN",
    exportTitle: "Ein lesbares Protokoll für die echte Prüfung.",
    exportBody: "Die Markdown-Datei enthält jeden offenen und erfassten Punkt, Zeitstempel, Laufzeitmerkmale sowie leere Felder für Reviewer, Abweichungen und die verantwortliche Freigabeentscheidung.",
    download: "Freigabeprotokoll herunterladen",
    downloaded: "Protokoll erstellt – ohne Lernerdaten.",
    resetTitle: "Nur das Freigabeprotokoll leeren?",
    resetBody: "Lernstand, XP, private PDFs und Eltern-PIN bleiben unangetastet.",
    cancel: "Abbrechen",
    clear: "Protokoll leeren",
    reset: "Lokale Freigabehaken zurücksetzen",
  },
} satisfies Record<LearningLocale, ReleaseReadinessCopy>

const uiCopy: Record<LearningLocale, ReleaseReadinessCopy> = baseUiCopy

export function releaseReadinessCopy(locale: LearningLocale): ReleaseReadinessCopy {
  return uiCopy[locale]
}

export function releaseReadinessFilenameForLocale(
  now: Date,
  locale: LearningLocale,
): string {
  if (locale === "en") return `gymiquest-release-log-${now.toISOString().slice(0, 10)}.md`
  if (locale === "it") return `gymiquest-registro-rilascio-${now.toISOString().slice(0, 10)}.md`
  if (locale === "es") return `gymiquest-registro-publicacion-${now.toISOString().slice(0, 10)}.md`
  return `gymiquest-freigabeprotokoll-${now.toISOString().slice(0, 10)}.md`
}

export function buildReleaseReadinessMarkdownForLocale(
  record: ReleaseReadinessRecord,
  runtime: ReleaseRuntimeEvidence,
  locale: LearningLocale,
): string {
  if (locale === "de") return buildReleaseReadinessMarkdown(record, runtime)

  const italian = locale === "it"
  const spanish = locale === "es"
  const progress = releaseReadinessProgress(record)
  const sections = releaseReadinessSectionsForLocale(locale).map((section) => {
    const checks = section.checks.map((check) => {
      const completedAt = record.completedAtByCheck[check.id]
      const buildId = record.buildIdByCheck[check.id]
      const recordedLabel = italian ? "Registrato localmente" : spanish ? "Registrado localmente" : "Recorded locally"
      const buildLabel = italian ? "Build testata" : spanish ? "Compilación probada" : "Tested build"
      const missingBuild = italian ? "non registrata (voce precedente)" : spanish ? "no registrada (entrada anterior)" : "not recorded (older log entry)"
      return `- [${completedAt ? "x" : " "}] ${check.label}${completedAt ? `\n  - ${recordedLabel}: ${completedAt}\n  - ${buildLabel}: ${buildId ?? missingBuild}` : ""}`
    }).join("\n")

    return [
      `## ${section.title}`,
      "",
      section.summary,
      "",
      `${italian ? "Ruolo richiesto" : spanish ? "Función necesaria" : "Required role"}: ${section.reviewer}`,
      "",
      checks,
      "",
      italian ? "Revisore/responsabilità: " : spanish ? "Revisor/responsabilidad: " : "Reviewer/responsibility: ",
      italian ? "Data: " : spanish ? "Fecha: " : "Date: ",
      italian ? "Discrepanze e prove: " : spanish ? "Discrepancias y evidencias: " : "Discrepancies and evidence: ",
    ].join("\n")
  }).join("\n\n")

  if (spanish) {
    return [
      "# Registro de publicación de GymiQuest",
      "",
      `Creado: ${runtime.capturedAt}`,
      `Comprobaciones registradas localmente: ${progress.completed}/${progress.total}`,
      `Secciones totalmente registradas: ${progress.sectionsComplete}/${progress.sectionTotal}`,
      "",
      "> Límite importante: las marcas locales documentan una afirmación, no su veracidad ni independencia. Este registro no sustituye la revisión de una segunda persona cualificada, la prueba real en iPad, la prueba con el estudiante ni el asesoramiento jurídico.",
      "",
      "El registro no contiene deliberadamente apodos, respuestas, XP ni historial de aprendizaje.",
      "",
      "## Captura del entorno",
      "",
      `- Compilación: ${runtime.buildId}`,
      `- Compilación limpia y trazable: ${isTraceableReleaseBuild(runtime.buildId) ? "sí" : "no: no conservar las marcas locales como evidencia de publicación"}`,
      `- URL: ${runtime.location}`,
      `- Ventana independiente detectada: ${runtime.standalone ? "sí" : "no"}`,
      `- Service Worker controla la página: ${runtime.serviceWorkerControlled ? "sí" : "no"}`,
      `- El navegador indica conexión: ${runtime.online ? "sí" : "no"}`,
      `- Área visible: ${runtime.viewport}`,
      `- User Agent: ${runtime.userAgent}`,
      "",
      sections,
      "",
      "## Decisión de publicación",
      "",
      "Decisión: vista técnica / prueba familiar / publicación / no publicado",
      "Persona responsable: ",
      "Fecha: ",
      "Motivación y cuestiones abiertas: ",
      "",
    ].join("\n")
  }

  if (italian) {
    return [
      "# Registro di rilascio GymiQuest",
      "",
      `Creato: ${runtime.capturedAt}`,
      `Controlli registrati localmente: ${progress.completed}/${progress.total}`,
      `Sezioni interamente registrate: ${progress.sectionsComplete}/${progress.sectionTotal}`,
      "",
      "> Limite importante: le spunte locali documentano un'affermazione, non la sua verità o indipendenza. Questo registro non sostituisce la verifica di una seconda persona qualificata, il test reale su iPad, il pilota con lo studente o la consulenza legale.",
      "",
      "Il registro non contiene volutamente soprannome, risposte, XP o cronologia di apprendimento.",
      "",
      "## Acquisizione dell'ambiente",
      "",
      `- Build: ${runtime.buildId}`,
      `- Build pulita e tracciabile: ${isTraceableReleaseBuild(runtime.buildId) ? "sì" : "no: non conservare le spunte locali come prove di rilascio"}`,
      `- URL: ${runtime.location}`,
      `- Finestra app autonoma rilevata: ${runtime.standalone ? "sì" : "no"}`,
      `- Service Worker controlla la pagina: ${runtime.serviceWorkerControlled ? "sì" : "no"}`,
      `- Il browser segnala online: ${runtime.online ? "sì" : "no"}`,
      `- Area visibile: ${runtime.viewport}`,
      `- User Agent: ${runtime.userAgent}`,
      "",
      sections,
      "",
      "## Decisione di rilascio",
      "",
      "Decisione: anteprima tecnica / pilota familiare / rilascio pubblico / non rilasciato",
      "Persona responsabile: ",
      "Data: ",
      "Motivazione e punti aperti: ",
      "",
    ].join("\n")
  }

  return [
    "# GymiQuest release log",
    "",
    `Created: ${runtime.capturedAt}`,
    `Locally recorded checks: ${progress.completed}/${progress.total}`,
    `Fully recorded sections: ${progress.sectionsComplete}/${progress.sectionTotal}`,
    "",
    "> Important boundary: local ticks document a claim, not its truth or independence. This log replaces neither review by a second qualified person nor the real iPad test, learner pilot, or legal advice.",
    "",
    "The log intentionally contains no nickname, answers, XP, or learning history.",
    "",
    "## Runtime capture",
    "",
    `- Build: ${runtime.buildId}`,
    `- Clean, traceable build: ${isTraceableReleaseBuild(runtime.buildId) ? "yes" : "no—do not carry local ticks forward as release evidence"}`,
    `- URL: ${runtime.location}`,
    `- Standalone app window detected: ${runtime.standalone ? "yes" : "no"}`,
    `- Service Worker controls the page: ${runtime.serviceWorkerControlled ? "yes" : "no"}`,
    `- Browser reports online: ${runtime.online ? "yes" : "no"}`,
    `- Viewport: ${runtime.viewport}`,
    `- User Agent: ${runtime.userAgent}`,
    "",
    sections,
    "",
    "## Release decision",
    "",
    "Decision: technical preview / family pilot / public release / not released",
    "Responsible person: ",
    "Date: ",
    "Reasoning and open items: ",
    "",
  ].join("\n")
}
