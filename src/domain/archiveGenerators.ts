import type { GeneratedQuestion, LearningLocale, TopicId } from "./model"
import {
  filterNumberConstraintSolutions,
  type DigitRelation,
} from "./combinatorics"
import {
  buildCornerCutoutModel,
  buildFrameAreaModel,
  buildNotchPerimeterModel,
} from "./areaSpatial"
import {
  cubeNetCandidates,
  oppositeFaceIndex,
  transformCubeNet,
} from "./cubeNet"
import { createRandom, pick, pickIndex } from "./random"

type ArchiveTopicId = Extract<
  TopicId,
  | "efficient-arithmetic"
  | "speed-distance-time"
  | "data-tables"
  | "coordinate-transformations"
  | "cube-nets"
  | "number-constraints"
  | "composite-areas"
>

const round = (value: number, decimals = 6): number => {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const formatNumber = (value: number, locale: LearningLocale = "de"): string =>
  new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "it" ? "it-CH" : locale === "es" ? "es-ES" : "de-CH", { maximumFractionDigits: 1 }).format(value)

const localText = (
  locale: LearningLocale,
  german: string,
  english: string,
  italian: string,
  spanish: string,
): string => locale === "en" ? english : locale === "it" ? italian : locale === "es" ? spanish : german

const division = (locale: LearningLocale): string => locale === "de" ? ":" : "÷"

const isCleanTenth = (value: number): boolean =>
  Math.abs(value * 10 - Math.round(value * 10)) < 1e-8

const decimalPlaces = (value: number): number =>
  Number.isInteger(round(value, 6)) ? 0 : 1

function shuffle<T>(random: () => number, values: readonly T[]): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = pickIndex(random, index + 1)
    ;[result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!]
  }
  return result
}

function generateEfficientArithmetic(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const factor = pick(random, [12, 15, 18, 24, 25, 32, 36, 48, 75])

  if (random() < 0.58) {
    const pairTotal = pick(random, [50, 100, 200])
    const left = pick(
      random,
      pairTotal === 50
        ? [17, 19, 23, 27, 31, 33]
        : pairTotal === 100
          ? [37, 43, 47, 53, 57, 63]
          : [73, 87, 93, 107, 113, 127],
    )
    const right = pairTotal - left
    const answer = factor * pairTotal

    return {
      id,
      topicId: "efficient-arithmetic",
      prompt: localText(locale, `Berechne möglichst geschickt:\n${factor} · ${left} + ${factor} · ${right}`, `Calculate as efficiently as possible:\n${factor} · ${left} + ${factor} · ${right}`, `Calcola nel modo più efficiente possibile:\n${factor} · ${left} + ${factor} · ${right}`, `Calcula de la forma más eficiente posible:\n${factor} · ${left} + ${factor} · ${right}`),
      answerLabel: localText(locale, "Das Ergebnis ist", "The result is", "Il risultato è", "El resultado es"),
      response: { kind: "number", value: answer, decimals: 0 },
      hint: localText(locale, `In beiden Produkten steckt der gemeinsame Faktor ${factor}.`, `Both products have the common factor ${factor}.`, `Entrambi i prodotti hanno il fattore comune ${factor}.`, `Los dos productos tienen el factor común ${factor}.`),
      easierExplanation: localText(locale, `Klammere ${factor} aus. In der Klammer steht dann ${left} + ${right}.`, `Factor out ${factor}. The expression in brackets is then ${left} + ${right}.`, `Raccogli ${factor}. Tra parentesi rimane ${left} + ${right}.`, `Saca ${factor} como factor común. Dentro del paréntesis queda ${left} + ${right}.`),
      explanation: `${factor} · ${left} + ${factor} · ${right} = ${factor} · (${left} + ${right}) = ${factor} · ${pairTotal} = ${answer}.`,
      workedSteps: [
        `${factor} · ${left} + ${factor} · ${right} = ${factor} · (${left} + ${right})`,
        `${left} + ${right} = ${pairTotal}`,
        `${factor} · ${pairTotal} = ${answer}`,
      ],
      visual: {
        kind: "factor-pairs",
        variant: "sum",
        values: [factor, left, right, pairTotal],
        labels: locale === "en"
          ? ["common factor", "first part", "second part", "round total"]
          : locale === "it"
            ? ["fattore comune", "prima parte", "seconda parte", "somma tonda"]
            : locale === "es"
              ? ["factor común", "primera parte", "segunda parte", "suma redonda"]
            : ["gemeinsamer Faktor", "erster Teil", "zweiter Teil", "runde Summe"],
      },
    }
  }

  const difference = pick(random, [10, 20, 25, 50])
  const smaller = pick(random, [14, 23, 37, 48, 65, 72])
  const larger = smaller + difference
  const answer = factor * difference

  return {
    id,
    topicId: "efficient-arithmetic",
    prompt: localText(locale, `Berechne möglichst geschickt:\n${factor} · ${larger} − ${factor} · ${smaller}`, `Calculate as efficiently as possible:\n${factor} · ${larger} − ${factor} · ${smaller}`, `Calcola nel modo più efficiente possibile:\n${factor} · ${larger} − ${factor} · ${smaller}`, `Calcula de la forma más eficiente posible:\n${factor} · ${larger} − ${factor} · ${smaller}`),
    answerLabel: localText(locale, "Das Ergebnis ist", "The result is", "Il risultato è", "El resultado es"),
    response: { kind: "number", value: answer, decimals: 0 },
    hint: localText(locale, `Beide Produkte haben den gemeinsamen Faktor ${factor}.`, `Both products have the common factor ${factor}.`, `Entrambi i prodotti hanno il fattore comune ${factor}.`, `Los dos productos tienen el factor común ${factor}.`),
    easierExplanation: localText(locale, `Klammere ${factor} aus. Berechne zuerst ${larger} − ${smaller}.`, `Factor out ${factor}. Calculate ${larger} − ${smaller} first.`, `Raccogli ${factor}. Calcola prima ${larger} − ${smaller}.`, `Saca ${factor} como factor común. Calcula primero ${larger} − ${smaller}.`),
    explanation: `${factor} · ${larger} − ${factor} · ${smaller} = ${factor} · (${larger} − ${smaller}) = ${factor} · ${difference} = ${answer}.`,
    workedSteps: [
      `${factor} · ${larger} − ${factor} · ${smaller} = ${factor} · (${larger} − ${smaller})`,
      `${larger} − ${smaller} = ${difference}`,
      `${factor} · ${difference} = ${answer}`,
    ],
    visual: {
      kind: "factor-pairs",
      variant: "difference",
      values: [factor, larger, smaller, difference],
      labels: locale === "en"
        ? ["common factor", "minuend", "subtrahend", "round difference"]
        : locale === "it"
          ? ["fattore comune", "minuendo", "sottraendo", "differenza tonda"]
          : locale === "es"
            ? ["factor común", "minuendo", "sustraendo", "diferencia redonda"]
          : ["gemeinsamer Faktor", "Minuend", "Subtrahend", "runde Differenz"],
    },
  }
}

interface AverageSpeedCandidate {
  firstSpeed: number
  firstMinutes: number
  firstDistance: number
  secondSpeed: number
  secondMinutes: number
  secondDistance: number
  averageSpeed: number
}

function averageSpeedCandidates(): AverageSpeedCandidate[] {
  const results: AverageSpeedCandidate[] = []
  const speeds = [3, 4, 5, 6, 8, 10]
  const durations = [18, 20, 24, 30, 36, 40, 45, 48, 60]

  for (const firstSpeed of speeds) {
    for (const secondSpeed of speeds) {
      if (firstSpeed === secondSpeed) continue
      for (const firstMinutes of durations) {
        const firstDistance = firstSpeed * firstMinutes / 60
        if (!isCleanTenth(firstDistance)) continue
        for (const secondMinutes of durations) {
          const secondDistance = secondSpeed * secondMinutes / 60
          const averageSpeed = (firstDistance + secondDistance) * 60 /
            (firstMinutes + secondMinutes)
          if (!isCleanTenth(secondDistance) || !isCleanTenth(averageSpeed)) continue
          if (firstDistance === secondDistance && firstMinutes === secondMinutes) continue
          results.push({
            firstSpeed,
            firstMinutes,
            firstDistance: round(firstDistance, 1),
            secondSpeed,
            secondMinutes,
            secondDistance: round(secondDistance, 1),
            averageSpeed: round(averageSpeed, 1),
          })
        }
      }
    }
  }

  return results
}

interface CatchUpCandidate {
  slowSpeed: number
  fastSpeed: number
  headStartMinutes: number
  catchMinutes: number
  distance: number
}

function catchUpCandidates(): CatchUpCandidate[] {
  const results: CatchUpCandidate[] = []
  for (const slowSpeed of [6, 8, 10, 12]) {
    for (const fastSpeed of [12, 15, 16, 18, 20, 24]) {
      if (fastSpeed <= slowSpeed) continue
      for (const headStartMinutes of [10, 12, 15, 20, 24, 30, 36, 45]) {
        const catchMinutes = headStartMinutes * slowSpeed / (fastSpeed - slowSpeed)
        const distance = fastSpeed * catchMinutes / 60
        if (!Number.isInteger(catchMinutes) || catchMinutes < 5 || catchMinutes > 120) continue
        if (!isCleanTenth(distance) || distance <= 0 || distance > 40) continue
        results.push({
          slowSpeed,
          fastSpeed,
          headStartMinutes,
          catchMinutes,
          distance: round(distance, 1),
        })
      }
    }
  }
  return results
}

const averageCandidates = averageSpeedCandidates()
const catchCandidates = catchUpCandidates()

function generateSpeedDistanceTime(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  if (random() < 0.58) {
    const candidate = averageCandidates[pickIndex(random, averageCandidates.length)]!
    const {
      firstSpeed,
      firstMinutes,
      firstDistance,
      secondSpeed,
      secondMinutes,
      secondDistance,
      averageSpeed,
    } = candidate

    return {
      id,
      topicId: "speed-distance-time",
      prompt: localText(locale, `Auf einer Tour werden zuerst ${formatNumber(firstDistance)} km mit ${firstSpeed} km/h und danach ${formatNumber(secondDistance)} km mit ${secondSpeed} km/h zurückgelegt. Wie gross ist die Durchschnittsgeschwindigkeit der ganzen Tour?`, `On a journey, the first ${formatNumber(firstDistance, locale)} km is travelled at ${firstSpeed} km/h and the next ${formatNumber(secondDistance, locale)} km at ${secondSpeed} km/h. What is the average speed for the whole journey?`, `Durante un percorso si coprono prima ${formatNumber(firstDistance, locale)} km a ${firstSpeed} km/h e poi ${formatNumber(secondDistance, locale)} km a ${secondSpeed} km/h. Qual è la velocità media dell'intero percorso?`, `En un recorrido se hacen primero ${formatNumber(firstDistance, locale)} km a ${firstSpeed} km/h y después ${formatNumber(secondDistance, locale)} km a ${secondSpeed} km/h. ¿Cuál es la velocidad media de todo el recorrido?`),
      answerLabel: localText(locale, "Die Durchschnittsgeschwindigkeit beträgt", "The average speed is", "La velocità media è", "La velocidad media es"),
      response: {
        kind: "number",
        value: averageSpeed,
        decimals: decimalPlaces(averageSpeed),
        unit: "km/h",
      },
      hint: localText(locale, "Für den Durchschnitt brauchst du die gesamte Strecke und die gesamte Zeit.", "For the average, you need the total distance and the total time.", "Per calcolare la media servono la distanza totale e il tempo totale.", "Para calcular la media necesitas la distancia total y el tiempo total."),
      easierExplanation: localText(locale, `Der erste Abschnitt dauert ${formatNumber(firstDistance)} : ${firstSpeed} h, der zweite ${formatNumber(secondDistance)} : ${secondSpeed} h. Addiere diese Zeiten.`, `The first section takes ${formatNumber(firstDistance, locale)} ÷ ${firstSpeed} h and the second ${formatNumber(secondDistance, locale)} ÷ ${secondSpeed} h. Add those times.`, `Il primo tratto dura ${formatNumber(firstDistance, locale)} ÷ ${firstSpeed} h e il secondo ${formatNumber(secondDistance, locale)} ÷ ${secondSpeed} h. Somma questi tempi.`, `El primer tramo dura ${formatNumber(firstDistance, locale)} ÷ ${firstSpeed} h y el segundo ${formatNumber(secondDistance, locale)} ÷ ${secondSpeed} h. Suma esos tiempos.`),
      explanation: localText(locale, `Die Abschnitte dauern ${firstMinutes} min und ${secondMinutes} min. Insgesamt sind es ${formatNumber(firstDistance + secondDistance)} km in ${firstMinutes + secondMinutes} min, also ${formatNumber(averageSpeed)} km/h.`, `The sections take ${firstMinutes} min and ${secondMinutes} min. Altogether, ${formatNumber(firstDistance + secondDistance, locale)} km is travelled in ${firstMinutes + secondMinutes} min, giving ${formatNumber(averageSpeed, locale)} km/h.`, `I tratti durano ${firstMinutes} min e ${secondMinutes} min. In totale si percorrono ${formatNumber(firstDistance + secondDistance, locale)} km in ${firstMinutes + secondMinutes} min, quindi la velocità media è ${formatNumber(averageSpeed, locale)} km/h.`, `Los tramos duran ${firstMinutes} min y ${secondMinutes} min. En total se recorren ${formatNumber(firstDistance + secondDistance, locale)} km en ${firstMinutes + secondMinutes} min, lo que da ${formatNumber(averageSpeed, locale)} km/h.`),
      workedSteps: [
        `${formatNumber(firstDistance, locale)} km ${division(locale)} ${firstSpeed} km/h = ${firstMinutes} min`,
        `${formatNumber(secondDistance, locale)} km ${division(locale)} ${secondSpeed} km/h = ${secondMinutes} min`,
        localText(locale, `Gesamt: ${formatNumber(firstDistance + secondDistance)} km in ${firstMinutes + secondMinutes} min`, `Total: ${formatNumber(firstDistance + secondDistance, locale)} km in ${firstMinutes + secondMinutes} min`, `Totale: ${formatNumber(firstDistance + secondDistance, locale)} km in ${firstMinutes + secondMinutes} min`, `Total: ${formatNumber(firstDistance + secondDistance, locale)} km en ${firstMinutes + secondMinutes} min`),
        `${formatNumber(firstDistance + secondDistance, locale)} ${division(locale)} (${firstMinutes + secondMinutes}/60) = ${formatNumber(averageSpeed, locale)} km/h`,
      ],
      visual: {
        kind: "motion-model",
        variant: "average",
        values: [firstSpeed, firstMinutes, firstDistance, secondSpeed, secondMinutes, secondDistance, averageSpeed],
        labels: locale === "en" ? ["section 1", "section 2"] : locale === "it" ? ["tratto 1", "tratto 2"] : locale === "es" ? ["tramo 1", "tramo 2"] : ["Abschnitt 1", "Abschnitt 2"],
      },
    }
  }

  const candidate = catchCandidates[pickIndex(random, catchCandidates.length)]!
  const { slowSpeed, fastSpeed, headStartMinutes, catchMinutes, distance } = candidate
  const slowHeadStartDistance = round(slowSpeed * headStartMinutes / 60, 1)

  return {
    id,
    topicId: "speed-distance-time",
    prompt: localText(locale, `Noah fährt mit ${slowSpeed} km/h los. ${headStartMinutes} Minuten später folgt Mia auf derselben Strecke mit ${fastSpeed} km/h. Wie viele Kilometer vom Start entfernt holt Mia Noah ein?`, `Noah sets off at ${slowSpeed} km/h. ${headStartMinutes} minutes later, Mia follows along the same route at ${fastSpeed} km/h. How many kilometres from the start does Mia catch Noah?`, `Noah parte a ${slowSpeed} km/h. ${headStartMinutes} minuti dopo, Mia lo segue sullo stesso percorso a ${fastSpeed} km/h. A quanti chilometri dalla partenza Mia raggiunge Noah?`, `Noah sale a ${slowSpeed} km/h. ${headStartMinutes} minutos después, Mia lo sigue por la misma ruta a ${fastSpeed} km/h. ¿A cuántos kilómetros del inicio alcanza Mia a Noah?`),
    answerLabel: localText(locale, "Der Treffpunkt liegt", "The meeting point is", "Il punto d'incontro si trova", "El punto de encuentro está a"),
    response: {
      kind: "number",
      value: distance,
      decimals: decimalPlaces(distance),
      unit: localText(locale, "km vom Start", "km from the start", "km dalla partenza", "km del inicio"),
    },
    hint: localText(locale, "Berechne zuerst Noahs Vorsprung. Pro Stunde verkleinert sich der Abstand nur um die Geschwindigkeitsdifferenz.", "First calculate Noah's head start. Each hour, the gap closes only by the difference between their speeds.", "Calcola prima il vantaggio di Noah. Ogni ora la distanza diminuisce soltanto della differenza tra le velocità.", "Calcula primero la ventaja de Noah. Cada hora, la distancia solo se reduce en la diferencia de velocidades."),
    easierExplanation: localText(locale, `Noahs Vorsprung ist ${formatNumber(slowHeadStartDistance)} km. Mia gewinnt pro Stunde ${fastSpeed - slowSpeed} km auf.`, `Noah's head start is ${formatNumber(slowHeadStartDistance, locale)} km. Mia gains ${fastSpeed - slowSpeed} km on him each hour.`, `Il vantaggio di Noah è ${formatNumber(slowHeadStartDistance, locale)} km. Ogni ora Mia recupera ${fastSpeed - slowSpeed} km.`, `La ventaja de Noah es de ${formatNumber(slowHeadStartDistance, locale)} km. Mia recupera ${fastSpeed - slowSpeed} km cada hora.`),
    explanation: localText(locale, `Vorsprung: ${formatNumber(slowHeadStartDistance)} km. Aufholzeit: ${catchMinutes} min. Mia fährt in dieser Zeit ${formatNumber(distance)} km.`, `Head start: ${formatNumber(slowHeadStartDistance, locale)} km. Catch-up time: ${catchMinutes} min. Mia travels ${formatNumber(distance, locale)} km in that time.`, `Vantaggio: ${formatNumber(slowHeadStartDistance, locale)} km. Tempo per raggiungerlo: ${catchMinutes} min. In questo tempo Mia percorre ${formatNumber(distance, locale)} km.`, `Ventaja: ${formatNumber(slowHeadStartDistance, locale)} km. Tiempo para alcanzarlo: ${catchMinutes} min. Mia recorre ${formatNumber(distance, locale)} km en ese tiempo.`),
    workedSteps: [
      localText(locale, `${slowSpeed} · ${headStartMinutes}/60 = ${formatNumber(slowHeadStartDistance)} km Vorsprung`, `${slowSpeed} · ${headStartMinutes}/60 = ${formatNumber(slowHeadStartDistance, locale)} km head start`, `${slowSpeed} · ${headStartMinutes}/60 = ${formatNumber(slowHeadStartDistance, locale)} km di vantaggio`, `${slowSpeed} · ${headStartMinutes}/60 = ${formatNumber(slowHeadStartDistance, locale)} km de ventaja`),
      localText(locale, `Geschwindigkeitsdifferenz: ${fastSpeed} − ${slowSpeed} = ${fastSpeed - slowSpeed} km/h`, `Speed difference: ${fastSpeed} − ${slowSpeed} = ${fastSpeed - slowSpeed} km/h`, `Differenza di velocità: ${fastSpeed} − ${slowSpeed} = ${fastSpeed - slowSpeed} km/h`, `Diferencia de velocidades: ${fastSpeed} − ${slowSpeed} = ${fastSpeed - slowSpeed} km/h`),
      `${formatNumber(slowHeadStartDistance, locale)} ${division(locale)} ${fastSpeed - slowSpeed} h = ${catchMinutes} min`,
      `${fastSpeed} · ${catchMinutes}/60 = ${formatNumber(distance, locale)} km`,
    ],
    visual: {
      kind: "motion-model",
      variant: "catch-up",
      values: [slowSpeed, fastSpeed, headStartMinutes, catchMinutes, distance],
      labels: locale === "en" ? ["head start", "catch up"] : locale === "it" ? ["vantaggio", "recupero"] : locale === "es" ? ["ventaja", "alcance"] : ["Vorsprung", "Aufholen"],
    },
  }
}

function generateDataTables(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const variant = pick(random, ["complement", "missing-average", "difference"] as const)

  if (variant === "complement") {
    const totalDays = pick(random, [12, 14, 16, 18, 21])
    const hikingDays: number[] = []
    const swimmingDays: number[] = []

    for (let index = 0; index < 3; index += 1) {
      const hikingMaximum = Math.min(9, totalDays - 5)
      const hiking = pick(
        random,
        Array.from({ length: hikingMaximum - 2 }, (_, candidateIndex) => candidateIndex + 3),
      )
      const swimmingMaximum = Math.min(8, totalDays - hiking - 3)
      const swimming = pick(
        random,
        Array.from({ length: swimmingMaximum - 1 }, (_, candidateIndex) => candidateIndex + 2),
      )
      hikingDays.push(hiking)
      swimmingDays.push(swimming)
    }

    const hikingTotal = hikingDays.reduce((sum, value) => sum + value, 0)
    const swimmingTotal = swimmingDays.reduce((sum, value) => sum + value, 0)
    const answer = 3 * totalDays - hikingTotal - swimmingTotal

    return {
      id,
      topicId: "data-tables",
      prompt: localText(locale, `Drei Ferienlager dauern je ${totalDays} Tage. Die Tabelle zeigt Wander- und Badetage. In jedem Lager sind Wander- und Badetage verschiedene Tage. Wie viele Tage waren es in allen drei Lagern zusammen weder Wander- noch Badetage?`, `Three holiday camps each last ${totalDays} days. The table shows hiking days and swimming days. In each camp, these are different days. Across all three camps, how many days were neither hiking nor swimming days?`, `Tre campi estivi durano ${totalDays} giorni ciascuno. La tabella mostra i giorni di escursione e i giorni di nuoto, che in ogni campo sono giorni diversi. In tutti e tre i campi, quanti giorni non erano dedicati né alle escursioni né al nuoto?`, `Tres campamentos de vacaciones duran ${totalDays} días cada uno. La tabla muestra los días de senderismo y de natación, que son días distintos en cada campamento. ¿Cuántos días de los tres campamentos no fueron ni de senderismo ni de natación?`),
      answerLabel: localText(locale, "Insgesamt waren es", "The total was", "In totale erano", "En total fueron"),
      response: { kind: "number", value: answer, decimals: 0, unit: localText(locale, "Tage", "days", "giorni", "días") },
      hint: localText(locale, "Berechne für jedes Lager die übrigen Tage oder arbeite mit dem Total aller drei Lager.", "Find the remaining days for each camp, or work with the total for all three camps.", "Calcola i giorni rimanenti per ogni campo oppure usa il totale dei tre campi.", "Calcula los días restantes de cada campamento o trabaja con el total de los tres."),
      easierExplanation: localText(locale, `Alle drei Lager umfassen zusammen 3 · ${totalDays} = ${3 * totalDays} Tage. Ziehe danach alle Wander- und Badetage ab.`, `The three camps contain 3 · ${totalDays} = ${3 * totalDays} days altogether. Then subtract all hiking and swimming days.`, `I tre campi comprendono in tutto 3 · ${totalDays} = ${3 * totalDays} giorni. Sottrai poi tutti i giorni di escursione e di nuoto.`, `Los tres campamentos suman 3 · ${totalDays} = ${3 * totalDays} días. Resta después todos los días de senderismo y natación.`),
      explanation: localText(locale, `Zusammen gibt es ${3 * totalDays} Lagertage. Davon sind ${hikingTotal} Wandertage und ${swimmingTotal} Badetage. ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} Tage.`, `There are ${3 * totalDays} camp days altogether. ${hikingTotal} are hiking days and ${swimmingTotal} are swimming days. ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} days.`, `In totale ci sono ${3 * totalDays} giorni di campo. Di questi, ${hikingTotal} sono giorni di escursione e ${swimmingTotal} giorni di nuoto. ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} giorni.`, `En total hay ${3 * totalDays} días de campamento. ${hikingTotal} son de senderismo y ${swimmingTotal} de natación. ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} días.`),
      workedSteps: [
        localText(locale, `Alle Lagertage: 3 · ${totalDays} = ${3 * totalDays}`, `All camp days: 3 · ${totalDays} = ${3 * totalDays}`, `Tutti i giorni di campo: 3 · ${totalDays} = ${3 * totalDays}`, `Todos los días: 3 · ${totalDays} = ${3 * totalDays}`),
        localText(locale, `Wandertage: ${hikingDays.join(" + ")} = ${hikingTotal}`, `Hiking days: ${hikingDays.join(" + ")} = ${hikingTotal}`, `Giorni di escursione: ${hikingDays.join(" + ")} = ${hikingTotal}`, `Días de senderismo: ${hikingDays.join(" + ")} = ${hikingTotal}`),
        localText(locale, `Badetage: ${swimmingDays.join(" + ")} = ${swimmingTotal}`, `Swimming days: ${swimmingDays.join(" + ")} = ${swimmingTotal}`, `Giorni di nuoto: ${swimmingDays.join(" + ")} = ${swimmingTotal}`, `Días de natación: ${swimmingDays.join(" + ")} = ${swimmingTotal}`),
        localText(locale, `Weder noch: ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} Tage`, `Neither: ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} days`, `Né escursione né nuoto: ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} giorni`, `Ni senderismo ni natación: ${3 * totalDays} − ${hikingTotal} − ${swimmingTotal} = ${answer} días`),
      ],
      visual: {
        kind: "data-table",
        variant: "complement",
        labels: locale === "en"
          ? ["Mountain camp", "Lake camp", "Forest camp", "Hiking days", "Swimming days"]
          : locale === "it"
            ? ["Campo montagna", "Campo lago", "Campo bosco", "Giorni di escursione", "Giorni di nuoto"]
            : locale === "es"
              ? ["Campamento de montaña", "Campamento del lago", "Campamento del bosque", "Días de senderismo", "Días de natación"]
            : ["Lager Berg", "Lager See", "Lager Wald", "Wandertage", "Badetage"],
        values: [totalDays, ...hikingDays, ...swimmingDays],
      },
    }
  }

  if (variant === "missing-average") {
    const average = pick(random, [18, 21, 24, 27, 30, 33, 36])
    const [firstOffset, secondOffset] = pick(random, [
      [-6, 2],
      [-5, 8],
      [-4, -3],
      [-3, 7],
      [2, 5],
      [4, -7],
      [6, -2],
    ] as const)
    const firstWeek = average + firstOffset
    const secondWeek = average + secondOffset
    const thirdWeek = 3 * average - firstWeek - secondWeek
    const total = 3 * average

    return {
      id,
      topicId: "data-tables",
      prompt: localText(locale, `Die Tabelle zeigt, wie viele Bücher eine Schülerbibliothek in drei Wochen ausgeliehen hat. Der Mittelwert beträgt ${average} Bücher pro Woche. Der Wert der dritten Woche fehlt. Wie viele Bücher wurden in Woche 3 ausgeliehen?`, `The table shows how many books a school library lent over three weeks. The mean is ${average} books per week, but the third week's value is missing. How many books were lent in week 3?`, `La tabella mostra quanti libri ha prestato una biblioteca scolastica in tre settimane. La media è di ${average} libri alla settimana, ma manca il valore della terza settimana. Quanti libri sono stati prestati nella settimana 3?`, `La tabla muestra cuántos libros prestó una biblioteca escolar durante tres semanas. La media es de ${average} libros por semana, pero falta el valor de la tercera. ¿Cuántos libros se prestaron en la semana 3?`),
      answerLabel: localText(locale, "In Woche 3 waren es", "In week 3 there were", "Nella settimana 3 erano", "En la semana 3 fueron"),
      response: { kind: "number", value: thirdWeek, decimals: 0, unit: localText(locale, "Bücher", "books", "libri", "libros") },
      hint: localText(locale, "Ein Mittelwert von drei Wochen verrät dir zuerst die Summe aller drei Wochen.", "The mean over three weeks first tells you the total for all three weeks.", "La media di tre settimane permette prima di trovare il totale delle tre settimane.", "La media de tres semanas te permite hallar primero el total de las tres."),
      easierExplanation: localText(locale, `Insgesamt müssen es 3 · ${average} = ${total} Bücher sein. Ziehe die beiden bekannten Wochen ab.`, `The total must be 3 · ${average} = ${total} books. Subtract the two known weeks.`, `In totale devono essere 3 · ${average} = ${total} libri. Sottrai le due settimane conosciute.`, `El total debe ser 3 · ${average} = ${total} libros. Resta las dos semanas conocidas.`),
      explanation: localText(locale, `Drei Wochen ergeben zusammen ${total} Bücher. ${total} − ${firstWeek} − ${secondWeek} = ${thirdWeek} Bücher in Woche 3.`, `The three weeks total ${total} books. ${total} − ${firstWeek} − ${secondWeek} = ${thirdWeek} books in week 3.`, `Le tre settimane totalizzano ${total} libri. ${total} − ${firstWeek} − ${secondWeek} = ${thirdWeek} libri nella settimana 3.`, `Las tres semanas suman ${total} libros. ${total} − ${firstWeek} − ${secondWeek} = ${thirdWeek} libros en la semana 3.`),
      workedSteps: [
        localText(locale, `Gesamtsumme: 3 · ${average} = ${total} Bücher`, `Total: 3 · ${average} = ${total} books`, `Totale: 3 · ${average} = ${total} libri`, `Total: 3 · ${average} = ${total} libros`),
        localText(locale, `Bekannte Wochen: ${firstWeek} + ${secondWeek} = ${firstWeek + secondWeek} Bücher`, `Known weeks: ${firstWeek} + ${secondWeek} = ${firstWeek + secondWeek} books`, `Settimane conosciute: ${firstWeek} + ${secondWeek} = ${firstWeek + secondWeek} libri`, `Semanas conocidas: ${firstWeek} + ${secondWeek} = ${firstWeek + secondWeek} libros`),
        localText(locale, `Woche 3: ${total} − ${firstWeek + secondWeek} = ${thirdWeek} Bücher`, `Week 3: ${total} − ${firstWeek + secondWeek} = ${thirdWeek} books`, `Settimana 3: ${total} − ${firstWeek + secondWeek} = ${thirdWeek} libri`, `Semana 3: ${total} − ${firstWeek + secondWeek} = ${thirdWeek} libros`),
      ],
      visual: {
        kind: "data-table",
        variant: "missing-average",
        labels: locale === "en" ? ["Week 1", "Week 2", "Week 3", "Mean"] : locale === "it" ? ["Settimana 1", "Settimana 2", "Settimana 3", "Media"] : locale === "es" ? ["Semana 1", "Semana 2", "Semana 3", "Media"] : ["Woche 1", "Woche 2", "Woche 3", "Mittelwert"],
        values: [firstWeek, secondWeek, thirdWeek, average],
      },
    }
  }

  const firstSegment = pick(random, [6.5, 7.5, 9, 10.5, 12, 13.5, 15, 16.5])
  const secondSegment = pick(random, [5.5, 7, 8.5, 10, 11.5, 13, 14.5, 17])
  const totalDistance = round(firstSegment + secondSegment, 1)

  return {
    id,
    topicId: "data-tables",
    prompt: localText(locale, "Eine Veloroute vom Hafen zum Park führt über den Markt. Die Tabelle zeigt die bekannte Teilstrecke und die gesamte Route. Wie weit ist es vom Markt zum Park?", "A cycle route from the harbour to the park goes via the market. The table shows the known section and the total route. How far is it from the market to the park?", "Un percorso ciclabile dal porto al parco passa per il mercato. La tabella mostra il tratto conosciuto e l'intero percorso. Quanto dista il mercato dal parco?", "Una ruta en bicicleta del puerto al parque pasa por el mercado. La tabla muestra el tramo conocido y la ruta completa. ¿Qué distancia hay del mercado al parque?"),
    answerLabel: localText(locale, "Vom Markt zum Park sind es", "From the market to the park it is", "Dal mercato al parco ci sono", "Del mercado al parque hay"),
    response: {
      kind: "number",
      value: secondSegment,
      decimals: decimalPlaces(secondSegment),
      unit: "km",
    },
    hint: localText(locale, "Die ganze Route besteht aus den beiden Teilstrecken hintereinander.", "The complete route consists of the two consecutive sections.", "L'intero percorso è formato dai due tratti consecutivi.", "La ruta completa está formada por los dos tramos consecutivos."),
    easierExplanation: localText(locale, `Ziehe die bekannte Strecke Hafen–Markt von der Gesamtstrecke Hafen–Park ab.`, `Subtract the known harbour-to-market section from the total harbour-to-park route.`, `Sottrai il tratto conosciuto porto–mercato dal percorso totale porto–parco.`, `Resta el tramo conocido puerto–mercado de la ruta total puerto–parque.`),
    explanation: `${formatNumber(totalDistance, locale)} km − ${formatNumber(firstSegment, locale)} km = ${formatNumber(secondSegment, locale)} km.`,
    workedSteps: [
      localText(locale, `Gesamte Route: ${formatNumber(totalDistance)} km`, `Complete route: ${formatNumber(totalDistance, locale)} km`, `Percorso totale: ${formatNumber(totalDistance, locale)} km`, `Ruta completa: ${formatNumber(totalDistance, locale)} km`),
      localText(locale, `Bekannte Teilstrecke: ${formatNumber(firstSegment)} km`, `Known section: ${formatNumber(firstSegment, locale)} km`, `Tratto conosciuto: ${formatNumber(firstSegment, locale)} km`, `Tramo conocido: ${formatNumber(firstSegment, locale)} km`),
      localText(locale, `Fehlende Teilstrecke: ${formatNumber(totalDistance)} − ${formatNumber(firstSegment)} = ${formatNumber(secondSegment)} km`, `Missing section: ${formatNumber(totalDistance, locale)} − ${formatNumber(firstSegment, locale)} = ${formatNumber(secondSegment, locale)} km`, `Tratto mancante: ${formatNumber(totalDistance, locale)} − ${formatNumber(firstSegment, locale)} = ${formatNumber(secondSegment, locale)} km`, `Tramo que falta: ${formatNumber(totalDistance, locale)} − ${formatNumber(firstSegment, locale)} = ${formatNumber(secondSegment, locale)} km`),
    ],
    visual: {
      kind: "data-table",
      variant: "difference",
      labels: locale === "en"
        ? ["Harbour–market", "Market–park", "Harbour–park via market"]
        : locale === "it"
          ? ["Porto–mercato", "Mercato–parco", "Porto–parco via mercato"]
          : locale === "es"
            ? ["Puerto–mercado", "Mercado–parque", "Puerto–parque por el mercado"]
          : ["Hafen–Markt", "Markt–Park", "Hafen–Park über Markt"],
      values: [firstSegment, secondSegment, totalDistance],
    },
  }
}

function signed(value: number): string {
  return value >= 0 ? `+ ${value}` : `− ${Math.abs(value)}`
}

function generateCoordinateTransformations(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const variant = pick(random, [
    "reflect-x",
    "reflect-y",
    "reflect-origin",
    "rotate-cw",
    "rotate-ccw",
    "translate",
  ] as const)
  const nonZero = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]
  const compact = [-3, -2, -1, 0, 1, 2, 3]
  const x = pick(random, variant === "translate" ? compact : nonZero)
  const y = pick(random, variant === "translate" ? compact : nonZero)
  let targetX = x
  let targetY = y
  let deltaX = 0
  let deltaY = 0
  let transformation = ""
  let rule = ""

  switch (variant) {
    case "reflect-x":
      targetY = -y
      transformation = localText(locale, "Spiegelung an der x-Achse", "Reflection in the x-axis", "Riflessione rispetto all'asse x", "Simetría respecto del eje x")
      rule = localText(locale, "Die x-Koordinate bleibt; die y-Koordinate wechselt das Vorzeichen.", "The x-coordinate stays the same; the y-coordinate changes sign.", "La coordinata x rimane uguale; la coordinata y cambia segno.", "La coordenada x se mantiene y la coordenada y cambia de signo.")
      break
    case "reflect-y":
      targetX = -x
      transformation = localText(locale, "Spiegelung an der y-Achse", "Reflection in the y-axis", "Riflessione rispetto all'asse y", "Simetría respecto del eje y")
      rule = localText(locale, "Die y-Koordinate bleibt; die x-Koordinate wechselt das Vorzeichen.", "The y-coordinate stays the same; the x-coordinate changes sign.", "La coordinata y rimane uguale; la coordinata x cambia segno.", "La coordenada y se mantiene y la coordenada x cambia de signo.")
      break
    case "reflect-origin":
      targetX = -x
      targetY = -y
      transformation = localText(locale, "Punktspiegelung am Ursprung", "Reflection in the origin", "Simmetria rispetto all'origine", "Simetría respecto del origen")
      rule = localText(locale, "Beide Koordinaten wechseln das Vorzeichen.", "Both coordinates change sign.", "Entrambe le coordinate cambiano segno.", "Las dos coordenadas cambian de signo.")
      break
    case "rotate-cw":
      targetX = y
      targetY = -x
      transformation = localText(locale, "Drehung um 90° im Uhrzeigersinn", "Rotation 90° clockwise", "Rotazione di 90° in senso orario", "Giro de 90° en sentido horario")
      rule = localText(locale, "Aus (x | y) wird (y | −x).", "(x | y) becomes (y | −x).", "(x | y) diventa (y | −x).", "(x | y) se convierte en (y | −x).")
      break
    case "rotate-ccw":
      targetX = -y
      targetY = x
      transformation = localText(locale, "Drehung um 90° gegen den Uhrzeigersinn", "Rotation 90° anticlockwise", "Rotazione di 90° in senso antiorario", "Giro de 90° en sentido antihorario")
      rule = localText(locale, "Aus (x | y) wird (−y | x).", "(x | y) becomes (−y | x).", "(x | y) diventa (−y | x).", "(x | y) se convierte en (−y | x).")
      break
    case "translate":
      deltaX = pick(random, [-3, -2, -1, 1, 2, 3])
      deltaY = pick(random, [-3, -2, -1, 1, 2, 3])
      targetX = x + deltaX
      targetY = y + deltaY
      transformation = localText(locale, `Verschiebung um (${signed(deltaX)} | ${signed(deltaY)})`, `Translation by (${signed(deltaX)} | ${signed(deltaY)})`, `Traslazione di (${signed(deltaX)} | ${signed(deltaY)})`, `Traslación de (${signed(deltaX)} | ${signed(deltaY)})`)
      rule = localText(locale, "Addiere die Verschiebung getrennt zur x- und zur y-Koordinate.", "Add the translation separately to the x- and y-coordinates.", "Somma separatamente la traslazione alla coordinata x e alla coordinata y.", "Suma la traslación por separado a las coordenadas x e y.")
      break
  }

  return {
    id,
    topicId: "coordinate-transformations",
    prompt: localText(locale, `Der Punkt P(${x} | ${y}) wird abgebildet durch: ${transformation}. Welche Koordinaten hat der Bildpunkt P′?`, `Point P(${x} | ${y}) is transformed by: ${transformation}. What are the coordinates of image point P′?`, `Il punto P(${x} | ${y}) viene trasformato mediante: ${transformation}. Quali sono le coordinate del punto immagine P′?`, `El punto P(${x} | ${y}) se transforma mediante: ${transformation}. ¿Cuáles son las coordenadas del punto imagen P′?`),
    answerLabel: localText(locale, "Koordinaten von P′", "Coordinates of P′", "Coordinate di P′", "Coordenadas de P′"),
    response: { kind: "coordinate", x: targetX, y: targetY },
    hint: rule,
    easierExplanation: localText(locale, `Behandle x- und y-Koordinate getrennt. ${rule}`, `Treat the x- and y-coordinates separately. ${rule}`, `Considera separatamente le coordinate x e y. ${rule}`, `Trata por separado las coordenadas x e y. ${rule}`),
    explanation: localText(locale, `P(${x} | ${y}) wird zu P′(${targetX} | ${targetY}). ${rule}`, `P(${x} | ${y}) becomes P′(${targetX} | ${targetY}). ${rule}`, `P(${x} | ${y}) diventa P′(${targetX} | ${targetY}). ${rule}`, `P(${x} | ${y}) se convierte en P′(${targetX} | ${targetY}). ${rule}`),
    workedSteps: [
      localText(locale, `Startpunkt: P(${x} | ${y})`, `Starting point: P(${x} | ${y})`, `Punto iniziale: P(${x} | ${y})`, `Punto inicial: P(${x} | ${y})`),
      localText(locale, `Regel: ${rule}`, `Rule: ${rule}`, `Regola: ${rule}`, `Regla: ${rule}`),
      localText(locale, `Bildpunkt: P′(${targetX} | ${targetY})`, `Image point: P′(${targetX} | ${targetY})`, `Punto immagine: P′(${targetX} | ${targetY})`, `Punto imagen: P′(${targetX} | ${targetY})`),
    ],
    visual: {
      kind: "coordinate-plane",
      variant,
      labels: ["P", "P′", transformation],
      values: [x, y, targetX, targetY, deltaX, deltaY],
    },
  }
}

const cubeNets = cubeNetCandidates()

function generateCubeNets(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const baseNet = cubeNets[pickIndex(random, cubeNets.length)]!
  const cells = transformCubeNet(baseNet, pickIndex(random, 8))
  const labels = shuffle(random, ["A", "B", "C", "D", "E", "F"])
  const targetIndex = pickIndex(random, cells.length)
  const oppositeIndex = oppositeFaceIndex(cells, targetIndex)
  const targetLabel = labels[targetIndex]!
  const oppositeLabel = labels[oppositeIndex]!
  const options = shuffle(
    random,
    labels.filter((label) => label !== targetLabel),
  ).map((label) => ({ id: label, label: localText(locale, `Fläche ${label}`, `Face ${label}`, `Faccia ${label}`, `Cara ${label}`) }))
  const columns = Math.max(...cells.map((cell) => cell.x)) + 1
  const rows = Math.max(...cells.map((cell) => cell.y)) + 1
  const positions = cells.map((cell) => cell.y * columns + cell.x)

  return {
    id,
    topicId: "cube-nets",
    prompt: localText(locale, `Das Bild zeigt ein Würfelnetz. Welche Fläche liegt beim Falten gegenüber von Fläche ${targetLabel}?`, `The image shows a cube net. When it is folded, which face is opposite face ${targetLabel}?`, `L'immagine mostra lo sviluppo di un cubo. Quando viene piegato, quale faccia si trova di fronte alla faccia ${targetLabel}?`, `La imagen muestra el desarrollo de un cubo. Al plegarlo, ¿qué cara queda opuesta a la cara ${targetLabel}?`),
    answerLabel: localText(locale, "Wähle die gegenüberliegende Fläche", "Choose the opposite face", "Scegli la faccia opposta", "Elige la cara opuesta"),
    response: {
      kind: "choice",
      value: oppositeLabel,
      options,
    },
    hint: localText(locale, `Markiere Fläche ${targetLabel}. Verfolge beim Falten zuerst die direkt angrenzenden Flächen; diese können nicht gegenüberliegen.`, `Mark face ${targetLabel}. First follow the directly adjacent faces as the net folds; none of them can be opposite it.`, `Segna la faccia ${targetLabel}. Durante la piegatura segui prima le facce direttamente adiacenti: nessuna di queste può essere opposta.`, `Marca la cara ${targetLabel}. Al plegar, sigue primero las caras directamente adyacentes; ninguna puede ser la opuesta.`),
    easierExplanation: localText(locale, "Lege gedanklich eine Fläche als Boden fest. Klappe ihre Nachbarn nach oben und die nächste Fläche darüber wie einen Deckel.", "Imagine one face as the base. Fold its neighbours upwards, then fold the next face over like a lid.", "Immagina una faccia come base. Piega verso l'alto le facce vicine, poi chiudi la successiva come un coperchio.", "Imagina una cara como base. Pliega sus vecinas hacia arriba y la siguiente por encima como una tapa."),
    explanation: localText(locale, `Beim Falten zeigen die Flächen ${targetLabel} und ${oppositeLabel} in entgegengesetzte Richtungen. Deshalb liegt Fläche ${oppositeLabel} gegenüber von Fläche ${targetLabel}.`, `After folding, faces ${targetLabel} and ${oppositeLabel} point in opposite directions. Therefore face ${oppositeLabel} is opposite face ${targetLabel}.`, `Dopo la piegatura, le facce ${targetLabel} e ${oppositeLabel} puntano in direzioni opposte. Perciò la faccia ${oppositeLabel} è opposta alla faccia ${targetLabel}.`, `Después de plegar, las caras ${targetLabel} y ${oppositeLabel} apuntan en direcciones opuestas. Por tanto, la cara ${oppositeLabel} es opuesta a la cara ${targetLabel}.`),
    workedSteps: [
      localText(locale, `Fläche ${targetLabel} als feste Würfelfläche markieren.`, `Mark face ${targetLabel} as the fixed cube face.`, `Segna la faccia ${targetLabel} come faccia fissa del cubo.`, `Marca la cara ${targetLabel} como cara fija del cubo.`),
      localText(locale, "Direkt benachbarte Netzfelder um ihre gemeinsame Kante hochklappen.", "Fold directly adjacent net squares up around their shared edge.", "Piega verso l'alto i quadrati direttamente adiacenti lungo il bordo comune.", "Pliega hacia arriba los cuadrados adyacentes alrededor de su arista común."),
      localText(locale, "Die Raumrichtung jeder weiteren Fläche nach genau einer Kante aktualisieren.", "Update the spatial direction of each additional face one edge at a time.", "Aggiorna la direzione nello spazio di ogni faccia successiva, un bordo alla volta.", "Actualiza la dirección espacial de cada cara adicional una arista cada vez."),
      localText(locale, `Die entgegengesetzte Raumrichtung gehört zu Fläche ${oppositeLabel}.`, `The opposite spatial direction belongs to face ${oppositeLabel}.`, `La direzione spaziale opposta appartiene alla faccia ${oppositeLabel}.`, `La dirección espacial opuesta corresponde a la cara ${oppositeLabel}.`),
    ],
    visual: {
      kind: "cube-net",
      variant: "opposite-faces",
      labels,
      cells: positions,
      columns,
      rows,
      unit: targetLabel,
    },
  }
}

interface NumberConstraintCandidate {
  digits: [number, number, number, number]
  divisor: number
  relation: DigitRelation
  solutions: number[]
}

function numberConstraintCandidates(): NumberConstraintCandidate[] {
  const results: NumberConstraintCandidate[] = []
  for (let first = 1; first <= 6; first += 1) {
    for (let second = first + 1; second <= 7; second += 1) {
      for (let third = second + 1; third <= 8; third += 1) {
        for (let fourth = third + 1; fourth <= 9; fourth += 1) {
          const digits: [number, number, number, number] = [first, second, third, fourth]
          for (const divisor of [4, 6, 8, 12]) {
            for (const relation of ["greater", "less"] as const) {
              const solutions = filterNumberConstraintSolutions(digits, divisor, relation)
              if (solutions.length < 2 || solutions.length > 8) continue
              results.push({ digits, divisor, relation, solutions })
            }
          }
        }
      }
    }
  }
  return results
}

const constraintCandidates = numberConstraintCandidates()

function generateNumberConstraints(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = constraintCandidates[pickIndex(random, constraintCandidates.length)]!
  const { digits, divisor, relation, solutions } = candidate
  const relationText = relation === "greater"
    ? localText(locale, "Die Tausenderziffer ist grösser als die Einerziffer.", "The thousands digit is greater than the units digit.", "La cifra delle migliaia è maggiore della cifra delle unità.", "La cifra de los millares es mayor que la de las unidades.")
    : localText(locale, "Die Tausenderziffer ist kleiner als die Einerziffer.", "The thousands digit is smaller than the units digit.", "La cifra delle migliaia è minore della cifra delle unità.", "La cifra de los millares es menor que la de las unidades.")
  const relationSign = relation === "greater" ? ">" : "<"

  return {
    id,
    topicId: "number-constraints",
    prompt: localText(locale, `Bilde alle vierstelligen Zahlen, in denen jede der Ziffern ${digits.join(", ")} genau einmal vorkommt. Jede Zahl ist durch ${divisor} teilbar. ${relationText}\n\nGib die vollständige Lösungsmenge an. Trenne die Zahlen mit Kommas.`, `Form all four-digit numbers in which each digit ${digits.join(", ")} occurs exactly once. Every number is divisible by ${divisor}. ${relationText}\n\nGive the complete set of solutions, separated by commas.`, `Forma tutti i numeri di quattro cifre in cui ciascuna delle cifre ${digits.join(", ")} compare esattamente una volta. Ogni numero è divisibile per ${divisor}. ${relationText}\n\nIndica l'insieme completo delle soluzioni, separando i numeri con virgole.`, `Forma todos los números de cuatro cifras en los que cada una de las cifras ${digits.join(", ")} aparezca exactamente una vez. Todos son divisibles entre ${divisor}. ${relationText}\n\nEscribe el conjunto completo de soluciones, separado por comas.`),
    answerLabel: localText(locale, "Alle passenden Zahlen", "All matching numbers", "Tutti i numeri validi", "Todos los números válidos"),
    response: { kind: "integer-set", values: solutions },
    hint: localText(locale, `Nutze zuerst die Teilbarkeitsregel für ${divisor}; prüfe die Tausender- und Einerziffer erst danach.`, `Use the divisibility rule for ${divisor} first; check the thousands and units digits afterwards.`, `Usa prima la regola di divisibilità per ${divisor}; controlla dopo le cifre delle migliaia e delle unità.`, `Usa primero la regla de divisibilidad entre ${divisor}; comprueba después las cifras de millares y unidades.`),
    easierExplanation: localText(locale, "Ordne nicht sofort alle vier Ziffern. Bestimme zuerst, welche Endziffern oder letzten zwei Ziffern überhaupt zur Teilbarkeit passen.", "Do not arrange all four digits immediately. First determine which final digit or final two digits can satisfy the divisibility rule.", "Non disporre subito tutte e quattro le cifre. Determina prima quali cifre finali, o quali ultime due cifre, possono soddisfare la regola di divisibilità.", "No ordenes enseguida las cuatro cifras. Determina primero qué cifra final o qué dos cifras finales pueden cumplir la divisibilidad."),
    explanation: localText(locale, `Nach Teilbarkeit und der Bedingung Tausender ${relationSign} Einer bleiben genau ${solutions.length} Zahlen: ${solutions.join(", ")}.`, `After applying divisibility and the condition thousands ${relationSign} units, exactly ${solutions.length} numbers remain: ${solutions.join(", ")}.`, `Dopo aver applicato la divisibilità e la condizione migliaia ${relationSign} unità, rimangono esattamente ${solutions.length} numeri: ${solutions.join(", ")}.`, `Tras aplicar la divisibilidad y la condición millares ${relationSign} unidades, quedan exactamente ${solutions.length} números: ${solutions.join(", ")}.`),
    workedSteps: [
      localText(locale, `Mögliche Enden mit der Teilbarkeitsregel für ${divisor} bestimmen.`, `Use the divisibility rule for ${divisor} to find possible endings.`, `Usa la regola di divisibilità per ${divisor} per trovare le possibili cifre finali.`, `Usa la regla de divisibilidad entre ${divisor} para hallar posibles terminaciones.`),
      localText(locale, `Die übrigen Ziffern systematisch auf die freien Stellen verteilen.`, `Place the remaining digits systematically in the open positions.`, `Disponi sistematicamente le cifre rimanenti nelle posizioni libere.`, `Coloca sistemáticamente las cifras restantes en las posiciones libres.`),
      localText(locale, `Tausender ${relationSign} Einer prüfen und Doppelungen streichen.`, `Check thousands ${relationSign} units and remove duplicates.`, `Controlla migliaia ${relationSign} unità ed elimina i doppioni.`, `Comprueba millares ${relationSign} unidades y elimina duplicados.`),
      localText(locale, `Vollständige Menge: ${solutions.join(", ")}`, `Complete set: ${solutions.join(", ")}`, `Insieme completo: ${solutions.join(", ")}`, `Conjunto completo: ${solutions.join(", ")}`),
    ],
    visual: {
      kind: "number-filter",
      variant: relation,
      values: [...digits, divisor, solutions.length],
      labels: locale === "en"
        ? ["digits", `divisible by ${divisor}`, `Th ${relationSign} U`, `${solutions.length} solutions`]
        : locale === "it"
          ? ["cifre", `divisibile per ${divisor}`, `M ${relationSign} U`, `${solutions.length} soluzioni`]
          : locale === "es"
            ? ["cifras", `divisible entre ${divisor}`, `M ${relationSign} U`, `${solutions.length} soluciones`]
          : ["Ziffern", `teilbar durch ${divisor}`, `T ${relationSign} E`, `${solutions.length} Lösungen`],
    },
  }
}

function generateCompositeArea(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const variant = pick(random, ["frame", "corner", "notch"] as const)
  const width = pick(random, [12, 14, 16, 18, 20, 24])
  const height = pick(random, [8, 10, 12, 14, 16, 18])

  if (variant === "frame") {
    const maxBorder = Math.floor((Math.min(width, height) - 2) / 2)
    const border = pick(random, Array.from({ length: Math.max(1, maxBorder - 1) }, (_, index) => index + 1))
    const model = buildFrameAreaModel(width, height, border)
    const { innerWidth, innerHeight } = model
    const area = model.result

    return {
      id,
      topicId: "composite-areas",
      prompt: localText(locale, `Ein rechteckiger Bilderrahmen ist aussen ${width} cm breit und ${height} cm hoch. Der Rand ist überall ${border} cm breit. Wie gross ist die sichtbare Fläche des Rahmens?`, `A rectangular picture frame is ${width} cm wide and ${height} cm high on the outside. Its border is ${border} cm wide everywhere. What is the visible area of the frame?`, `Una cornice rettangolare misura all'esterno ${width} cm di larghezza e ${height} cm di altezza. Il bordo è largo ${border} cm su ogni lato. Qual è l'area visibile della cornice?`, `Un marco rectangular mide por fuera ${width} cm de ancho y ${height} cm de alto. El borde tiene ${border} cm de ancho por todos lados. ¿Cuál es el área visible del marco?`),
      answerLabel: localText(locale, "Die Rahmenfläche beträgt", "The area of the frame is", "L'area della cornice è", "El área del marco es"),
      response: { kind: "number", value: area, decimals: 0, unit: "cm²" },
      hint: localText(locale, "Ziehe die Fläche des inneren Rechtecks von der äusseren Fläche ab.", "Subtract the area of the inner rectangle from the outer area.", "Sottrai l'area del rettangolo interno dall'area esterna.", "Resta el área del rectángulo interior del área exterior."),
      easierExplanation: localText(locale, `Innen fehlen links und rechts je ${border} cm sowie oben und unten je ${border} cm.`, `The inner rectangle loses ${border} cm on both the left and right, and ${border} cm at both the top and bottom.`, `Il rettangolo interno perde ${border} cm sia a sinistra sia a destra e ${border} cm sia sopra sia sotto.`, `Al rectángulo interior le faltan ${border} cm a izquierda y derecha, y ${border} cm arriba y abajo.`),
      explanation: localText(locale, `Innen misst das Rechteck ${innerWidth} cm × ${innerHeight} cm. ${width} · ${height} − ${innerWidth} · ${innerHeight} = ${area} cm².`, `The inner rectangle measures ${innerWidth} cm × ${innerHeight} cm. ${width} · ${height} − ${innerWidth} · ${innerHeight} = ${area} cm².`, `Il rettangolo interno misura ${innerWidth} cm × ${innerHeight} cm. ${width} · ${height} − ${innerWidth} · ${innerHeight} = ${area} cm².`, `El rectángulo interior mide ${innerWidth} cm × ${innerHeight} cm. ${width} · ${height} − ${innerWidth} · ${innerHeight} = ${area} cm².`),
      workedSteps: [
        localText(locale, `Innenbreite: ${width} − 2 · ${border} = ${innerWidth} cm`, `Inner width: ${width} − 2 · ${border} = ${innerWidth} cm`, `Larghezza interna: ${width} − 2 · ${border} = ${innerWidth} cm`, `Ancho interior: ${width} − 2 · ${border} = ${innerWidth} cm`),
        localText(locale, `Innenhöhe: ${height} − 2 · ${border} = ${innerHeight} cm`, `Inner height: ${height} − 2 · ${border} = ${innerHeight} cm`, `Altezza interna: ${height} − 2 · ${border} = ${innerHeight} cm`, `Alto interior: ${height} − 2 · ${border} = ${innerHeight} cm`),
        localText(locale, `Aussenfläche: ${width} · ${height} = ${width * height} cm²`, `Outer area: ${width} · ${height} = ${width * height} cm²`, `Area esterna: ${width} · ${height} = ${width * height} cm²`, `Área exterior: ${width} · ${height} = ${width * height} cm²`),
        localText(locale, `Rahmen: ${width * height} − ${innerWidth * innerHeight} = ${area} cm²`, `Frame: ${width * height} − ${innerWidth * innerHeight} = ${area} cm²`, `Cornice: ${width * height} − ${innerWidth * innerHeight} = ${area} cm²`, `Marco: ${width * height} − ${innerWidth * innerHeight} = ${area} cm²`),
      ],
      visual: {
        kind: "composite-area",
        variant: "frame",
        values: [width, height, border, innerWidth, innerHeight],
        labels: locale === "en" ? ["width", "height", "border"] : locale === "it" ? ["larghezza", "altezza", "bordo"] : locale === "es" ? ["ancho", "alto", "borde"] : ["Breite", "Höhe", "Rand"],
      },
    }
  }

  const cutWidth = pick(random, Array.from({ length: Math.max(2, Math.floor(width / 2) - 2) }, (_, index) => index + 2))
  const cutHeight = pick(random, Array.from({ length: Math.max(2, Math.floor(height / 2) - 2) }, (_, index) => index + 2))

  if (variant === "corner") {
    const model = buildCornerCutoutModel(width, height, cutWidth, cutHeight)
    const area = model.result
    return {
      id,
      topicId: "composite-areas",
      prompt: localText(locale, `Aus der oberen rechten Ecke einer rechteckigen Platte von ${width} cm × ${height} cm wird ein Rechteck von ${cutWidth} cm × ${cutHeight} cm herausgeschnitten. Wie gross ist die verbleibende Fläche?`, `A ${cutWidth} cm × ${cutHeight} cm rectangle is cut from the top-right corner of a ${width} cm × ${height} cm rectangular plate. What area remains?`, `Dall'angolo superiore destro di una lastra rettangolare di ${width} cm × ${height} cm viene ritagliato un rettangolo di ${cutWidth} cm × ${cutHeight} cm. Qual è l'area rimanente?`, `De la esquina superior derecha de una placa rectangular de ${width} cm × ${height} cm se recorta un rectángulo de ${cutWidth} cm × ${cutHeight} cm. ¿Qué área queda?`),
      answerLabel: localText(locale, "Die verbleibende Fläche beträgt", "The remaining area is", "L'area rimanente è", "El área restante es"),
      response: { kind: "number", value: area, decimals: 0, unit: "cm²" },
      hint: localText(locale, "Betrachte zuerst das vollständige Aussenrechteck und ziehe den Ausschnitt ab.", "Start with the complete outer rectangle and subtract the cut-out.", "Parti dal rettangolo esterno completo e sottrai il ritaglio.", "Empieza por el rectángulo exterior completo y resta el recorte."),
      easierExplanation: localText(locale, `Die ganze Platte hat ${width} · ${height} cm². Der fehlende Teil hat ${cutWidth} · ${cutHeight} cm².`, `The whole plate has area ${width} · ${height} cm². The missing piece has area ${cutWidth} · ${cutHeight} cm².`, `La lastra intera ha area ${width} · ${height} cm². La parte mancante ha area ${cutWidth} · ${cutHeight} cm².`, `La placa completa tiene ${width} · ${height} cm². La parte que falta tiene ${cutWidth} · ${cutHeight} cm².`),
      explanation: `${width} · ${height} − ${cutWidth} · ${cutHeight} = ${area} cm².`,
      workedSteps: [
        localText(locale, `Gesamtes Rechteck: ${width} · ${height} = ${width * height} cm²`, `Whole rectangle: ${width} · ${height} = ${width * height} cm²`, `Rettangolo completo: ${width} · ${height} = ${width * height} cm²`, `Rectángulo completo: ${width} · ${height} = ${width * height} cm²`),
        localText(locale, `Ausschnitt: ${cutWidth} · ${cutHeight} = ${cutWidth * cutHeight} cm²`, `Cut-out: ${cutWidth} · ${cutHeight} = ${cutWidth * cutHeight} cm²`, `Ritaglio: ${cutWidth} · ${cutHeight} = ${cutWidth * cutHeight} cm²`, `Recorte: ${cutWidth} · ${cutHeight} = ${cutWidth * cutHeight} cm²`),
        localText(locale, `Restfläche: ${width * height} − ${cutWidth * cutHeight} = ${area} cm²`, `Remaining area: ${width * height} − ${cutWidth * cutHeight} = ${area} cm²`, `Area rimanente: ${width * height} − ${cutWidth * cutHeight} = ${area} cm²`, `Área restante: ${width * height} − ${cutWidth * cutHeight} = ${area} cm²`),
      ],
      visual: {
        kind: "composite-area",
        variant: "corner",
        values: [width, height, cutWidth, cutHeight],
        labels: locale === "en"
          ? ["outer width", "outer height", "cut-out width", "cut-out height"]
          : locale === "it"
            ? ["larghezza esterna", "altezza esterna", "larghezza del ritaglio", "altezza del ritaglio"]
            : locale === "es"
              ? ["ancho exterior", "alto exterior", "ancho del recorte", "alto del recorte"]
            : ["Aussenbreite", "Aussenhöhe", "Ausschnittbreite", "Ausschnitthöhe"],
      },
    }
  }

  const model = buildNotchPerimeterModel(width, height, cutWidth, cutHeight)
  const perimeter = model.result
  return {
    id,
    topicId: "composite-areas",
    prompt: localText(locale, `Aus der Mitte der oberen Seite eines Rechtecks von ${width} cm × ${height} cm wird eine ${cutWidth} cm breite und ${cutHeight} cm tiefe rechteckige Kerbe geschnitten. Wie gross ist der Umfang der entstandenen Figur?`, `A rectangular notch ${cutWidth} cm wide and ${cutHeight} cm deep is cut from the middle of the top edge of a ${width} cm × ${height} cm rectangle. What is the perimeter of the resulting shape?`, `Dal centro del lato superiore di un rettangolo di ${width} cm × ${height} cm viene ritagliata un'incavatura rettangolare larga ${cutWidth} cm e profonda ${cutHeight} cm. Qual è il perimetro della figura ottenuta?`, `En el centro del lado superior de un rectángulo de ${width} cm × ${height} cm se recorta una muesca rectangular de ${cutWidth} cm de ancho y ${cutHeight} cm de profundidad. ¿Cuál es el perímetro de la figura resultante?`),
    answerLabel: localText(locale, "Der Umfang beträgt", "The perimeter is", "Il perimetro è", "El perímetro es"),
    response: { kind: "number", value: perimeter, decimals: 0, unit: "cm" },
    hint: localText(locale, "Die Breite der Kerbe ersetzt gleich viel von der alten Oberkante. Neu dazu kommen nur die beiden Tiefen.", "The width of the notch replaces the same length of the old top edge. Only the two depths add new length.", "La larghezza dell'incavatura sostituisce la stessa lunghezza del vecchio lato superiore. Si aggiungono soltanto le due profondità.", "El ancho de la muesca sustituye la misma longitud del borde superior. Solo las dos profundidades añaden longitud."),
    easierExplanation: localText(locale, `Starte mit dem Umfang ${2 * (width + height)} cm des ganzen Rechtecks und ergänze zwei Strecken von je ${cutHeight} cm.`, `Start with the whole rectangle's perimeter of ${2 * (width + height)} cm and add two lengths of ${cutHeight} cm.`, `Parti dal perimetro di ${2 * (width + height)} cm del rettangolo intero e aggiungi due segmenti di ${cutHeight} cm ciascuno.`, `Empieza por el perímetro de ${2 * (width + height)} cm del rectángulo completo y añade dos tramos de ${cutHeight} cm.`),
    explanation: localText(locale, `Der ursprüngliche Umfang ist ${2 * (width + height)} cm. Die Kerbe verlängert ihn um 2 · ${cutHeight} cm. Das ergibt ${perimeter} cm.`, `The original perimeter is ${2 * (width + height)} cm. The notch increases it by 2 · ${cutHeight} cm, giving ${perimeter} cm.`, `Il perimetro iniziale è ${2 * (width + height)} cm. L'incavatura lo aumenta di 2 · ${cutHeight} cm, per un totale di ${perimeter} cm.`, `El perímetro original es de ${2 * (width + height)} cm. La muesca lo aumenta en 2 · ${cutHeight} cm, dando ${perimeter} cm.`),
    workedSteps: [
      localText(locale, `Rechteckumfang: 2 · (${width} + ${height}) = ${2 * (width + height)} cm`, `Rectangle perimeter: 2 · (${width} + ${height}) = ${2 * (width + height)} cm`, `Perimetro del rettangolo: 2 · (${width} + ${height}) = ${2 * (width + height)} cm`, `Perímetro del rectángulo: 2 · (${width} + ${height}) = ${2 * (width + height)} cm`),
      localText(locale, `Zusätzliche Kerbentiefe: 2 · ${cutHeight} = ${2 * cutHeight} cm`, `Added notch depths: 2 · ${cutHeight} = ${2 * cutHeight} cm`, `Profondità aggiunte: 2 · ${cutHeight} = ${2 * cutHeight} cm`, `Profundidades añadidas: 2 · ${cutHeight} = ${2 * cutHeight} cm`),
      localText(locale, `Neuer Umfang: ${2 * (width + height)} + ${2 * cutHeight} = ${perimeter} cm`, `New perimeter: ${2 * (width + height)} + ${2 * cutHeight} = ${perimeter} cm`, `Nuovo perimetro: ${2 * (width + height)} + ${2 * cutHeight} = ${perimeter} cm`, `Perímetro nuevo: ${2 * (width + height)} + ${2 * cutHeight} = ${perimeter} cm`),
    ],
    visual: {
      kind: "composite-area",
      variant: "notch",
      values: [width, height, cutWidth, cutHeight],
      labels: locale === "en"
        ? ["outer width", "outer height", "notch width", "notch depth"]
        : locale === "it"
          ? ["larghezza esterna", "altezza esterna", "larghezza dell'incavatura", "profondità dell'incavatura"]
          : locale === "es"
            ? ["ancho exterior", "alto exterior", "ancho de la muesca", "profundidad de la muesca"]
          : ["Aussenbreite", "Aussenhöhe", "Kerbenbreite", "Kerbentiefe"],
    },
  }
}

export function generateArchiveQuestion(
  topicId: ArchiveTopicId,
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  switch (topicId) {
    case "efficient-arithmetic":
      return generateEfficientArithmetic(seed, id, locale)
    case "speed-distance-time":
      return generateSpeedDistanceTime(seed, id, locale)
    case "data-tables":
      return generateDataTables(seed, id, locale)
    case "coordinate-transformations":
      return generateCoordinateTransformations(seed, id, locale)
    case "cube-nets":
      return generateCubeNets(seed, id, locale)
    case "number-constraints":
      return generateNumberConstraints(seed, id, locale)
    case "composite-areas":
      return generateCompositeArea(seed, id, locale)
  }
}

export function archiveGeneratorDiagnostics(): {
  averageSpeedCandidates: number
  catchUpCandidates: number
  numberConstraintCandidates: number
} {
  return {
    averageSpeedCandidates: averageCandidates.length,
    catchUpCandidates: catchCandidates.length,
    numberConstraintCandidates: constraintCandidates.length,
  }
}
