import { lessons as germanLessons, topics as germanTopics } from "../domain/content"
import {
  topicIds,
  type LearningTask,
  type LessonDefinition,
  type TopicDefinition,
  type TopicId,
} from "../domain/model"
import { buildParentTopicCoaching } from "../domain/parentCoaching"
import type { AppLocale } from "./localization"

const englishShortTitles: Record<TopicId, string> = {
  "arithmetic-equations": "Working backwards",
  "efficient-arithmetic": "Efficient arithmetic",
  "mass-units": "kg and g",
  "fraction-of-quantity": "Fraction of a quantity",
  "time-fractions": "Time fractions",
  "speed-distance-time": "Motion problems",
  "data-tables": "Reading tables",
  "money-calculations": "Money calculations",
  "proportional-revenue": "Revenue ratios",
  "integer-combinations": "All possibilities",
  "number-constraints": "Number filters",
  "area-fractions": "Area fractions",
  "composite-areas": "Composite areas",
  "tiling-costs": "Optimising tiles",
  "reverse-fractions": "Reverse fractions",
  "reverse-chains": "Reverse chains",
  "inverse-proportion": "Inverse proportion",
  "changing-rates": "Changing rates",
  "geometric-loci": "Geometric loci",
  "coordinate-transformations": "Coordinate transforms",
  "cube-nets": "Cube nets",
  "spatial-rolling": "Rolling a pyramid",
  "cuboid-surface": "Cuboid surface",
}

const italianShortTitles: Record<TopicId, string> = {
  "arithmetic-equations": "Lavorare a ritroso",
  "efficient-arithmetic": "Calcolo efficiente",
  "mass-units": "kg e g",
  "fraction-of-quantity": "Frazione di una quantità",
  "time-fractions": "Frazioni di tempo",
  "speed-distance-time": "Problemi di movimento",
  "data-tables": "Leggere le tabelle",
  "money-calculations": "Calcoli con denaro",
  "proportional-revenue": "Rapporti nei ricavi",
  "integer-combinations": "Tutte le possibilità",
  "number-constraints": "Filtri numerici",
  "area-fractions": "Frazioni di area",
  "composite-areas": "Figure composte",
  "tiling-costs": "Ottimizzare le piastrelle",
  "reverse-fractions": "Frazioni a ritroso",
  "reverse-chains": "Catene a ritroso",
  "inverse-proportion": "Proporzionalità inversa",
  "changing-rates": "Tassi variabili",
  "geometric-loci": "Luoghi geometrici",
  "coordinate-transformations": "Trasformazioni nel piano",
  "cube-nets": "Sviluppi del cubo",
  "spatial-rolling": "Ribaltare una piramide",
  "cuboid-surface": "Area del parallelepipedo",
}

const spanishShortTitles: Record<TopicId, string> = {
  "arithmetic-equations": "Trabajar hacia atrás",
  "efficient-arithmetic": "Cálculo eficiente",
  "mass-units": "kg y g",
  "fraction-of-quantity": "Fracción de una cantidad",
  "time-fractions": "Fracciones de tiempo",
  "speed-distance-time": "Problemas de movimiento",
  "data-tables": "Leer tablas",
  "money-calculations": "Cálculos con dinero",
  "proportional-revenue": "Proporciones de ingresos",
  "integer-combinations": "Todas las posibilidades",
  "number-constraints": "Filtros numéricos",
  "area-fractions": "Fracciones de área",
  "composite-areas": "Áreas compuestas",
  "tiling-costs": "Optimizar baldosas",
  "reverse-fractions": "Fracciones hacia atrás",
  "reverse-chains": "Cadenas hacia atrás",
  "inverse-proportion": "Proporcionalidad inversa",
  "changing-rates": "Ritmos cambiantes",
  "geometric-loci": "Lugares geométricos",
  "coordinate-transformations": "Transformaciones de coordenadas",
  "cube-nets": "Desarrollos de cubos",
  "spatial-rolling": "Rodar una pirámide",
  "cuboid-surface": "Área del ortoedro",
}

export function topicForLocale(topicId: TopicId, locale: AppLocale): TopicDefinition {
  const source = germanTopics[topicId]
  if (locale === "de") return source
  const copy = buildParentTopicCoaching(topicId, locale)
  return {
    ...source,
    title: copy.title,
    shortTitle: locale === "it"
      ? italianShortTitles[topicId]
      : locale === "es"
        ? spanishShortTitles[topicId]
        : englishShortTitles[topicId],
    description: copy.description,
  }
}

export function topicsForLocale(locale: AppLocale): Record<TopicId, TopicDefinition> {
  return Object.fromEntries(
    topicIds.map((topicId) => [topicId, topicForLocale(topicId, locale)]),
  ) as Record<TopicId, TopicDefinition>
}

export function lessonForLocale(topicId: TopicId, locale: AppLocale): LessonDefinition {
  const source = germanLessons[topicId]
  if (locale === "de") return source
  const copy = buildParentTopicCoaching(topicId, locale)
  if (topicId === "reverse-fractions") {
    return {
      ...source,
      title: copy.title,
      goal: copy.goal,
      pages: [
        {
          eyebrow: locale === "it" ? "Nuova idea" : locale === "es" ? "Idea nueva" : "New idea",
          title: copy.ideaTitle,
          body: copy.idea,
          visual: source.pages[0]!.visual,
          steps: copy.workedSteps.slice(0, 3),
          takeaway: copy.takeaway,
        },
        {
          eyebrow: locale === "it" ? "Controllo" : locale === "es" ? "Comprobación" : "Check",
          title: locale === "it"
            ? "Controlla la direzione"
            : locale === "es"
              ? "Comprueba la dirección"
              : "Check the direction",
          body: locale === "it"
            ? "La quantità iniziale deve essere maggiore della frazione rimanente conosciuta. Se il risultato è più piccolo, probabilmente hai lavorato in avanti invece che a ritroso."
            : locale === "es"
              ? "La cantidad original debe ser mayor que la fracción restante conocida. Si el resultado es menor, probablemente has trabajado hacia delante en vez de hacia atrás."
              : "The original quantity must be larger than the known remaining fraction. If your result is smaller, you probably worked forwards instead of backwards.",
          visual: source.pages[1]!.visual,
          steps: locale === "it"
            ? ["3/4 di 24 kg sono 18 kg", "18 kg < 24 kg: la direzione è corretta."]
            : locale === "es"
              ? ["3/4 de 24 kg son 18 kg", "18 kg < 24 kg: la dirección es correcta."]
              : ["3/4 of 24 kg is 18 kg", "18 kg < 24 kg—the direction is correct."],
          takeaway: locale === "it"
            ? "Un rapido controllo delle dimensioni evita molti errori."
            : locale === "es"
              ? "Una comprobación rápida del tamaño detecta muchos errores."
              : "A quick size check catches many mistakes.",
        },
      ],
    }
  }
  return {
    ...source,
    title: copy.title,
    goal: copy.goal,
    pages: [{
      eyebrow: locale === "it" ? "Idea chiave" : locale === "es" ? "Idea clave" : "Key idea",
      title: copy.ideaTitle,
      body: copy.idea,
      visual: source.pages[0]!.visual,
      steps: [...copy.workedSteps],
      takeaway: copy.takeaway,
    }],
  }
}

export function lessonsForLocale(locale: AppLocale): Record<TopicId, LessonDefinition> {
  return Object.fromEntries(
    topicIds.map((topicId) => [topicId, lessonForLocale(topicId, locale)]),
  ) as Record<TopicId, LessonDefinition>
}

export function taskPresentationForLocale(
  task: LearningTask,
  locale: AppLocale,
): Pick<LearningTask, "title" | "description"> {
  if (locale === "de") return task
  if (task.kind === "placement") {
    return locale === "it"
      ? {
          title: "La tua breve verifica iniziale",
          description: "Nove domande miste trovano un punto di partenza adatto, senza voto né XP.",
        }
      : locale === "es"
        ? {
            title: "Tu breve prueba inicial",
            description: "Nueve preguntas mixtas encuentran un punto de partida adecuado, sin nota ni XP.",
          }
        : {
          title: "Your short start check",
          description: "Nine mixed questions find a suitable starting point without a grade or XP.",
        }
  }
  if (task.kind === "assessment") {
    return locale === "it"
      ? {
          title: `Verifica ${task.assessmentNumber ?? ""}`.trim(),
          description: "Una verifica mista controlla aree nuove e argomenti fragili senza dimenticare il resto del percorso.",
        }
      : locale === "es"
        ? {
            title: `Evaluación ${task.assessmentNumber ?? ""}`.trim(),
            description: "Una evaluación mixta comprueba áreas nuevas y temas frágiles sin olvidar el resto del itinerario de aprendizaje.",
          }
        : {
          title: `Assessment ${task.assessmentNumber ?? ""}`.trim(),
          description: "A mixed assessment checks new areas and fragile topics without forgetting the rest of the learning path.",
        }
  }

  const topicId = task.topicIds[0]
  if (!topicId) return task
  const topic = topicForLocale(topicId, locale)
  if (task.purpose === "lesson-recovery") {
    return {
      title: locale === "it"
        ? `Giro di consolidamento: ${topic.shortTitle}`
        : locale === "es"
          ? `Ronda de consolidación: ${topic.shortTitle}`
          : `Consolidation round: ${topic.shortTitle}`,
      description: locale === "it"
        ? "Due domande nuove mostrano che l'idea è sicura anche senza aiuto. Gli XP già guadagnati restano tuoi."
        : locale === "es"
          ? "Dos preguntas nuevas muestran que dominas la idea de forma independiente. Los XP que ya has ganado siguen siendo tuyos."
          : "Two new questions show that the idea is secure independently. The XP you already earned remains yours.",
    }
  }
  if (task.purpose === "prerequisite-refresh") {
    return {
      title: locale === "it"
        ? `Ripasso: ${topic.shortTitle}`
        : locale === "es"
          ? `Refuerzo: ${topic.shortTitle}`
          : `Refresher: ${topic.shortTitle}`,
      description: locale === "it"
        ? "Riprendi il prerequisito con domande nuove prima di continuare."
        : locale === "es"
          ? "Repasa el requisito previo con preguntas nuevas antes de continuar."
          : "Revisit the prerequisite with new questions before continuing.",
    }
  }
  if (task.purpose === "error-refresh") {
    return {
      title: locale === "it"
        ? `Con valori nuovi: ${topic.shortTitle}`
        : locale === "es"
          ? `Con valores nuevos: ${topic.shortTitle}`
          : `With new values: ${topic.shortTitle}`,
      description: locale === "it"
        ? "Un ripasso mirato dalla tua bussola degli errori: la stessa idea in una domanda nuova."
        : locale === "es"
          ? "Un refuerzo específico de tu brújula de errores: la misma idea en una pregunta nueva."
          : "A targeted refresher from your error compass—the same idea in a new question.",
    }
  }
  if (task.kind === "review") {
    return {
      title: topic.title,
      description: locale === "it"
        ? "Un ripasso in scadenza con valori nuovi e la stessa idea matematica."
        : locale === "es"
          ? "Un repaso pendiente con valores nuevos y la misma idea matemática."
          : "A due review with new values and the same mathematical idea.",
    }
  }
  if (task.kind === "lesson") {
    return { title: topic.title, description: topic.description }
  }
  return task
}
