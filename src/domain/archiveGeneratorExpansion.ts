import { buildRepeatedDigitConstraintFilter, type DigitRelation } from "./combinatorics"
import type { GeneratedQuestion, LearningLocale, TopicId } from "./model"
import { createRandom, pickIndex } from "./random"

export const archiveExpansionTopicIds = [
  "efficient-arithmetic",
  "speed-distance-time",
  "data-tables",
  "number-constraints",
  "cuboid-surface",
] as const satisfies readonly TopicId[]

export type ArchiveExpansionTopicId = (typeof archiveExpansionTopicIds)[number]

export const archiveExpansionFamilyCatalog = [
  {
    familyId: "archive-v5-efficient-compensation",
    topicId: "efficient-arithmetic",
    templateIds: ["round-number-above", "round-number-below"],
  },
  {
    familyId: "archive-v5-travel-timing",
    topicId: "speed-distance-time",
    templateIds: ["return-home", "late-start"],
  },
  {
    familyId: "archive-v5-duration-price-table",
    topicId: "data-tables",
    templateIds: ["infer-base-and-hourly-rate"],
  },
  {
    familyId: "archive-v5-repeated-digit-filter",
    topicId: "number-constraints",
    templateIds: ["complete-set-with-repetition"],
  },
  {
    familyId: "archive-v5-cuboid-missing-edge",
    topicId: "cuboid-surface",
    templateIds: ["height-from-volume"],
  },
] as const satisfies readonly {
  familyId: string
  topicId: ArchiveExpansionTopicId
  templateIds: readonly string[]
}[]

const archiveExpansionTopics = new Set<TopicId>(archiveExpansionTopicIds)

const localText = (
  locale: LearningLocale,
  german: string,
  english: string,
  italian: string,
  spanish: string,
): string => locale === "en" ? english : locale === "it" ? italian : locale === "es" ? spanish : german

const division = (locale: LearningLocale): string => locale === "de" ? ":" : "÷"

const formatNumber = (value: number, locale: LearningLocale): string =>
  new Intl.NumberFormat(
    locale === "en" ? "en-GB" : locale === "it" ? "it-CH" : locale === "es" ? "es-ES" : "de-CH",
    { maximumFractionDigits: 1 },
  ).format(value)

const isCleanTenth = (value: number): boolean =>
  Math.abs(value * 10 - Math.round(value * 10)) < 1e-8

const decimalPlaces = (value: number): number => Number.isInteger(value) ? 0 : 1

const hourLabel = (locale: LearningLocale, hours: number): string => localText(
  locale,
  `${hours} ${hours === 1 ? "Stunde" : "Stunden"}`,
  `${hours} ${hours === 1 ? "hour" : "hours"}`,
  `${hours} ${hours === 1 ? "ora" : "ore"}`,
  `${hours} ${hours === 1 ? "hora" : "horas"}`,
)

const repetitionLabel = (locale: LearningLocale, count: number): string => localText(
  locale,
  count === 1 ? "einmal" : `${count}-mal`,
  count === 1 ? "once" : `${count} times`,
  count === 1 ? "una volta" : `${count} volte`,
  count === 1 ? "una vez" : `${count} veces`,
)

const rentalCostStatement = (
  locale: LearningLocale,
  hours: number,
  cost: number,
): string => localText(
  locale,
  `${hours} h ${hours === 1 ? "kostet" : "kosten"} ${cost} Fr.`,
  `a ${hours}-hour rental costs ${cost} Fr.`,
  `${hours} h ${hours === 1 ? "costa" : "costano"} ${cost} Fr.`,
  `${hours} h ${hours === 1 ? "cuesta" : "cuestan"} ${cost} Fr.`,
)

interface CompensationCandidate {
  factor: number
  roundBase: number
  offset: number
  operation: "sum" | "difference"
  nearbyFactor: number
  answer: number
}

function buildCompensationCandidates(): CompensationCandidate[] {
  const candidates: CompensationCandidate[] = []
  for (const factor of [12, 14, 18, 24, 25, 32, 36, 48, 75]) {
    for (const roundBase of [50, 100, 200, 500]) {
      for (const offset of [1, 2, 3, 4, 5]) {
        for (const operation of ["sum", "difference"] as const) {
          const nearbyFactor = operation === "sum" ? roundBase + offset : roundBase - offset
          candidates.push({
            factor,
            roundBase,
            offset,
            operation,
            nearbyFactor,
            answer: factor * nearbyFactor,
          })
        }
      }
    }
  }
  return candidates
}

const compensationCandidates = buildCompensationCandidates()

function generateCompensationQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = compensationCandidates[pickIndex(random, compensationCandidates.length)]!
  const { factor, roundBase, offset, operation, nearbyFactor, answer } = candidate
  const sign = operation === "sum" ? "+" : "−"

  return {
    id,
    topicId: "efficient-arithmetic",
    prompt: localText(
      locale,
      `Berechne geschickt, indem du mit ${roundBase} ausgleichst: ${factor} · ${nearbyFactor}`,
      `Calculate efficiently by compensating with ${roundBase}: ${factor} · ${nearbyFactor}`,
      `Calcola in modo efficiente compensando con ${roundBase}: ${factor} · ${nearbyFactor}`,
      `Calcula de forma eficiente compensando con ${roundBase}: ${factor} · ${nearbyFactor}`,
    ),
    answerLabel: localText(locale, "Das Ergebnis ist", "The result is", "Il risultato è", "El resultado es"),
    response: { kind: "number", value: answer, decimals: 0 },
    hint: localText(
      locale,
      `${nearbyFactor} ist nur ${offset} von der runden Zahl ${roundBase} entfernt.`,
      `${nearbyFactor} is only ${offset} away from the round number ${roundBase}.`,
      `${nearbyFactor} dista solo ${offset} dal numero tondo ${roundBase}.`,
      `${nearbyFactor} está a solo ${offset} del número redondo ${roundBase}.`,
    ),
    easierExplanation: localText(
      locale,
      `Schreibe ${nearbyFactor} als ${roundBase} ${sign} ${offset} und verteile den Faktor ${factor} auf beide Teile.`,
      `Write ${nearbyFactor} as ${roundBase} ${sign} ${offset}, then distribute the factor ${factor} across both parts.`,
      `Scrivi ${nearbyFactor} come ${roundBase} ${sign} ${offset}, poi distribuisci il fattore ${factor} su entrambe le parti.`,
      `Escribe ${nearbyFactor} como ${roundBase} ${sign} ${offset} y distribuye el factor ${factor} entre las dos partes.`,
    ),
    explanation: `${factor} · ${nearbyFactor} = ${factor} · (${roundBase} ${sign} ${offset}) = ${factor * roundBase} ${sign} ${factor * offset} = ${answer}.`,
    workedSteps: [
      `${nearbyFactor} = ${roundBase} ${sign} ${offset}`,
      `${factor} · ${nearbyFactor} = ${factor} · ${roundBase} ${sign} ${factor} · ${offset}`,
      `${factor * roundBase} ${sign} ${factor * offset} = ${answer}`,
    ],
    visual: {
      kind: "factor-pairs",
      variant: operation,
      values: [factor, roundBase, offset, nearbyFactor],
      labels: localText(
        locale,
        ["Faktor", "runde Zahl", "Ausgleich"].join("|"),
        ["factor", "round number", "compensation"].join("|"),
        ["fattore", "numero tondo", "compensazione"].join("|"),
        ["factor", "número redondo", "compensación"].join("|"),
      ).split("|"),
    },
  }
}

interface ReturnHomeCandidate {
  normalSpeed: number
  plannedMinutes: number
  outboundMinutes: number
  stopMinutes: number
  totalDistance: number
  remainingMinutes: number
  requiredSpeed: number
}

interface LateStartCandidate {
  normalSpeed: number
  plannedMinutes: number
  delayMinutes: number
  totalDistance: number
  remainingMinutes: number
  requiredSpeed: number
}

function buildReturnHomeCandidates(): ReturnHomeCandidate[] {
  const candidates: ReturnHomeCandidate[] = []
  for (const normalSpeed of [4, 5, 6, 8]) {
    for (const plannedMinutes of [24, 30, 36, 40, 45, 48, 50, 60]) {
      const totalDistance = normalSpeed * plannedMinutes / 60
      if (!isCleanTenth(totalDistance)) continue
      for (const outboundMinutes of [2, 3, 4, 5, 6, 8, 10]) {
        for (const stopMinutes of [0, 1, 2, 3]) {
          const remainingMinutes = plannedMinutes - 2 * outboundMinutes - stopMinutes
          if (remainingMinutes <= 5) continue
          const requiredSpeed = totalDistance * 60 / remainingMinutes
          if (requiredSpeed <= normalSpeed || requiredSpeed > 20 || !isCleanTenth(requiredSpeed)) continue
          candidates.push({
            normalSpeed,
            plannedMinutes,
            outboundMinutes,
            stopMinutes,
            totalDistance,
            remainingMinutes,
            requiredSpeed,
          })
        }
      }
    }
  }
  return candidates
}

function buildLateStartCandidates(): LateStartCandidate[] {
  const candidates: LateStartCandidate[] = []
  for (const normalSpeed of [4, 5, 6, 8, 10, 12]) {
    for (const plannedMinutes of [24, 30, 36, 40, 45, 48, 50, 60, 72]) {
      const totalDistance = normalSpeed * plannedMinutes / 60
      if (!isCleanTenth(totalDistance)) continue
      for (const delayMinutes of [3, 4, 5, 6, 8, 10, 12, 15]) {
        const remainingMinutes = plannedMinutes - delayMinutes
        if (remainingMinutes <= 10) continue
        const requiredSpeed = totalDistance * 60 / remainingMinutes
        if (requiredSpeed <= normalSpeed || requiredSpeed > 24 || !isCleanTenth(requiredSpeed)) continue
        candidates.push({
          normalSpeed,
          plannedMinutes,
          delayMinutes,
          totalDistance,
          remainingMinutes,
          requiredSpeed,
        })
      }
    }
  }
  return candidates
}

const returnHomeCandidates = buildReturnHomeCandidates()
const lateStartCandidates = buildLateStartCandidates()

function generateReturnHomeQuestion(
  random: () => number,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const candidate = returnHomeCandidates[pickIndex(random, returnHomeCandidates.length)]!
  const {
    normalSpeed,
    plannedMinutes,
    outboundMinutes,
    stopMinutes,
    totalDistance,
    remainingMinutes,
    requiredSpeed,
  } = candidate
  const stopClause = stopMinutes === 0
    ? localText(locale, "Sie nimmt es sofort und startet erneut.", "She picks it up immediately and sets off again.", "Lo prende subito e riparte.", "Lo recoge enseguida y vuelve a salir.")
    : localText(locale, `Zu Hause braucht sie ${stopMinutes} min, bevor sie erneut startet.`, `At home she needs ${stopMinutes} min before setting off again.`, `A casa impiega ${stopMinutes} min prima di ripartire.`, `En casa tarda ${stopMinutes} min antes de volver a salir.`)

  return {
    id,
    topicId: "speed-distance-time",
    prompt: localText(
      locale,
      `Lina braucht für ihren ${formatNumber(totalDistance, locale)} km langen Weg zur Musikschule normalerweise ${plannedMinutes} min bei ${normalSpeed} km/h. Heute dreht sie nach ${outboundMinutes} min Fahrt um und fährt im gleichen Tempo nach Hause zurück, weil sie ihre Noten vergessen hat. ${stopClause} Welche Durchschnittsgeschwindigkeit braucht sie nun, um zur ursprünglich geplanten Zeit anzukommen?`,
      `Lina normally takes ${plannedMinutes} min to travel ${formatNumber(totalDistance, locale)} km to music school at ${normalSpeed} km/h. Today, after travelling for ${outboundMinutes} min, she turns around and returns home at the same speed because she forgot her sheet music. ${stopClause} What average speed does she now need to arrive at the originally planned time?`,
      `Lina impiega normalmente ${plannedMinutes} min per percorrere ${formatNumber(totalDistance, locale)} km fino alla scuola di musica a ${normalSpeed} km/h. Oggi, dopo aver viaggiato per ${outboundMinutes} min, torna indietro e rientra a casa alla stessa velocità perché ha dimenticato gli spartiti. ${stopClause} Quale velocità media deve tenere ora per arrivare all'ora prevista?`,
      `Lina tarda normalmente ${plannedMinutes} min en recorrer ${formatNumber(totalDistance, locale)} km hasta la escuela de música a ${normalSpeed} km/h. Hoy, después de avanzar durante ${outboundMinutes} min, da la vuelta y regresa a casa a la misma velocidad porque ha olvidado las partituras. ${stopClause} ¿Qué velocidad media necesita ahora para llegar a la hora prevista?`,
    ),
    answerLabel: localText(locale, "Benötigte Geschwindigkeit", "Required speed", "Velocità necessaria", "Velocidad necesaria"),
    response: { kind: "number", value: requiredSpeed, decimals: decimalPlaces(requiredSpeed), unit: "km/h" },
    hint: localText(
      locale,
      "Hin- und Rückweg bis nach Hause verbrauchen gleich viel Zeit. Bestimme zuerst die verbleibenden Minuten.",
      "The outward and return legs take the same amount of time. First find the minutes that remain.",
      "L'andata e il ritorno fino a casa richiedono lo stesso tempo. Trova prima i minuti rimanenti.",
      "La ida y la vuelta a casa duran lo mismo. Halla primero los minutos restantes.",
    ),
    easierExplanation: localText(
      locale,
      `Vom Zeitbudget ${plannedMinutes} min sind ${outboundMinutes} + ${outboundMinutes} + ${stopMinutes} min bereits verbraucht.`,
      `Of the ${plannedMinutes}-minute time budget, a total of ${outboundMinutes} + ${outboundMinutes} + ${stopMinutes} min has already been used.`,
      `Del tempo disponibile di ${plannedMinutes} min sono già trascorsi ${outboundMinutes} + ${outboundMinutes} + ${stopMinutes} min.`,
      `Del tiempo disponible de ${plannedMinutes} min ya se han usado ${outboundMinutes} + ${outboundMinutes} + ${stopMinutes} min.`,
    ),
    explanation: localText(
      locale,
      `Es bleiben ${remainingMinutes} min für ${formatNumber(totalDistance, locale)} km. Das entspricht ${formatNumber(requiredSpeed, locale)} km/h.`,
      `There are ${remainingMinutes} min left for ${formatNumber(totalDistance, locale)} km. That is ${formatNumber(requiredSpeed, locale)} km/h.`,
      `Restano ${remainingMinutes} min per ${formatNumber(totalDistance, locale)} km. Ciò corrisponde a ${formatNumber(requiredSpeed, locale)} km/h.`,
      `Quedan ${remainingMinutes} min para ${formatNumber(totalDistance, locale)} km. Eso corresponde a ${formatNumber(requiredSpeed, locale)} km/h.`,
    ),
    workedSteps: [
      `${normalSpeed} · ${plannedMinutes}/60 = ${formatNumber(totalDistance, locale)} km`,
      `${plannedMinutes} − 2 · ${outboundMinutes} − ${stopMinutes} = ${remainingMinutes} min`,
      `${formatNumber(totalDistance, locale)} ${division(locale)} (${remainingMinutes}/60) = ${formatNumber(requiredSpeed, locale)} km/h`,
    ],
    visual: {
      kind: "motion-model",
      variant: "return-home",
      values: [normalSpeed, plannedMinutes, totalDistance, requiredSpeed, remainingMinutes, totalDistance, outboundMinutes, stopMinutes, 0],
      labels: localText(
        locale,
        ["normaler Weg", "nach der Rückkehr"].join("|"),
        ["normal journey", "after returning"].join("|"),
        ["percorso normale", "dopo il ritorno"].join("|"),
        ["trayecto normal", "después de volver"].join("|"),
      ).split("|"),
    },
  }
}

function generateLateStartQuestion(
  random: () => number,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const candidate = lateStartCandidates[pickIndex(random, lateStartCandidates.length)]!
  const { normalSpeed, plannedMinutes, delayMinutes, totalDistance, remainingMinutes, requiredSpeed } = candidate

  return {
    id,
    topicId: "speed-distance-time",
    prompt: localText(
      locale,
      `Ein Kurier plant für eine ${formatNumber(totalDistance, locale)} km lange Strecke ${plannedMinutes} min bei ${normalSpeed} km/h ein. Er startet ${delayMinutes} min zu spät. Welche durchschnittliche Geschwindigkeit braucht er, um trotzdem zur geplanten Zeit anzukommen?`,
      `A courier allows ${plannedMinutes} min for a ${formatNumber(totalDistance, locale)} km route at ${normalSpeed} km/h. He starts ${delayMinutes} min late. What average speed does he need to arrive at the planned time?`,
      `Un corriere prevede ${plannedMinutes} min per un tragitto di ${formatNumber(totalDistance, locale)} km a ${normalSpeed} km/h. Parte con ${delayMinutes} min di ritardo. Quale velocità media deve tenere per arrivare comunque all'ora prevista?`,
      `Un mensajero prevé ${plannedMinutes} min para un trayecto de ${formatNumber(totalDistance, locale)} km a ${normalSpeed} km/h. Sale con ${delayMinutes} min de retraso. ¿Qué velocidad media necesita para llegar a la hora prevista?`,
    ),
    answerLabel: localText(locale, "Benötigte Geschwindigkeit", "Required speed", "Velocità necessaria", "Velocidad necesaria"),
    response: { kind: "number", value: requiredSpeed, decimals: decimalPlaces(requiredSpeed), unit: "km/h" },
    hint: localText(
      locale,
      "Die Strecke bleibt gleich, aber die verfügbare Zeit wird um die Verspätung kürzer.",
      "The distance stays the same, but the available time is shortened by the delay.",
      "La distanza rimane uguale, ma il tempo disponibile diminuisce del ritardo.",
      "La distancia no cambia, pero el tiempo disponible se reduce por el retraso.",
    ),
    easierExplanation: localText(
      locale,
      `Statt ${plannedMinutes} min bleiben nur ${plannedMinutes} − ${delayMinutes} = ${remainingMinutes} min.`,
      `Instead of ${plannedMinutes} min, there are only ${plannedMinutes} − ${delayMinutes} = ${remainingMinutes} min left.`,
      `Invece di ${plannedMinutes} min restano solo ${plannedMinutes} − ${delayMinutes} = ${remainingMinutes} min.`,
      `En vez de ${plannedMinutes} min, solo quedan ${plannedMinutes} − ${delayMinutes} = ${remainingMinutes} min.`,
    ),
    explanation: localText(
      locale,
      `${formatNumber(totalDistance, locale)} km in ${remainingMinutes} min entsprechen ${formatNumber(requiredSpeed, locale)} km/h.`,
      `${formatNumber(totalDistance, locale)} km in ${remainingMinutes} min is equivalent to ${formatNumber(requiredSpeed, locale)} km/h.`,
      `${formatNumber(totalDistance, locale)} km in ${remainingMinutes} min corrispondono a ${formatNumber(requiredSpeed, locale)} km/h.`,
      `${formatNumber(totalDistance, locale)} km en ${remainingMinutes} min equivalen a ${formatNumber(requiredSpeed, locale)} km/h.`,
    ),
    workedSteps: [
      `${normalSpeed} · ${plannedMinutes}/60 = ${formatNumber(totalDistance, locale)} km`,
      `${plannedMinutes} − ${delayMinutes} = ${remainingMinutes} min`,
      `${formatNumber(totalDistance, locale)} ${division(locale)} (${remainingMinutes}/60) = ${formatNumber(requiredSpeed, locale)} km/h`,
    ],
    visual: {
      kind: "motion-model",
      variant: "late-start",
      values: [normalSpeed, plannedMinutes, totalDistance, requiredSpeed, remainingMinutes, totalDistance, delayMinutes, 0, 1],
      labels: localText(
        locale,
        ["Plan", "nach Verspätung"].join("|"),
        ["plan", "after the delay"].join("|"),
        ["piano", "dopo il ritardo"].join("|"),
        ["plan", "después del retraso"].join("|"),
      ).split("|"),
    },
  }
}

function generateTravelTimingQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  return random() < 0.62
    ? generateReturnHomeQuestion(random, id, locale)
    : generateLateStartQuestion(random, id, locale)
}

interface RentalTableCandidate {
  baseFee: number
  hourlyRate: number
  firstHours: number
  secondHours: number
  targetHours: number
  firstCost: number
  secondCost: number
  targetCost: number
}

function buildRentalTableCandidates(): RentalTableCandidate[] {
  const candidates: RentalTableCandidate[] = []
  for (const baseFee of [4, 5, 6, 8, 10, 12]) {
    for (const hourlyRate of [4, 5, 6, 7, 8, 9, 10, 12]) {
      for (const firstHours of [1, 2]) {
        for (const secondHours of [3, 4, 5]) {
          for (const targetHours of [6, 7, 8, 9]) {
            candidates.push({
              baseFee,
              hourlyRate,
              firstHours,
              secondHours,
              targetHours,
              firstCost: baseFee + hourlyRate * firstHours,
              secondCost: baseFee + hourlyRate * secondHours,
              targetCost: baseFee + hourlyRate * targetHours,
            })
          }
        }
      }
    }
  }
  return candidates
}

const rentalTableCandidates = buildRentalTableCandidates()

function generateRentalTableQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = rentalTableCandidates[pickIndex(random, rentalTableCandidates.length)]!
  const {
    baseFee,
    hourlyRate,
    firstHours,
    secondHours,
    targetHours,
    firstCost,
    secondCost,
    targetCost,
  } = candidate
  const hourDifference = secondHours - firstHours
  const priceDifference = secondCost - firstCost

  return {
    id,
    topicId: "data-tables",
    prompt: localText(
      locale,
      `Ein Atelier vermietet Werkzeug. Der Preis besteht aus einer einmaligen Grundgebühr und demselben Betrag pro Stunde. Die Tabelle zeigt: ${rentalCostStatement(locale, firstHours, firstCost)}, ${rentalCostStatement(locale, secondHours, secondCost)} Wie viel kosten ${targetHours} h?`,
      `A workshop rents out tools. The price consists of a one-off base fee plus the same amount per hour. The table shows that ${rentalCostStatement(locale, firstHours, firstCost)} and ${rentalCostStatement(locale, secondHours, secondCost)} How much does a ${targetHours}-hour rental cost?`,
      `Un laboratorio noleggia utensili. Il prezzo è formato da una quota fissa più lo stesso importo per ogni ora. La tabella mostra: ${rentalCostStatement(locale, firstHours, firstCost)} e ${rentalCostStatement(locale, secondHours, secondCost)} Quanto costano ${targetHours} h?`,
      `Un taller alquila herramientas. El precio consta de una tarifa fija más la misma cantidad por hora. La tabla muestra: ${rentalCostStatement(locale, firstHours, firstCost)} y ${rentalCostStatement(locale, secondHours, secondCost)} ¿Cuánto cuestan ${targetHours} h?`,
    ),
    answerLabel: localText(locale, `Preis für ${targetHours} h`, `Price for ${targetHours} h`, `Prezzo per ${targetHours} h`, `Precio por ${targetHours} h`),
    response: { kind: "number", value: targetCost, decimals: 0, unit: "Fr." },
    hint: localText(
      locale,
      `Vergleiche zuerst die beiden Tabellenwerte: ${hourDifference} zusätzliche Stunden erhöhen den Preis um ${priceDifference} Fr.`,
      `First compare the two table values: ${hourDifference} extra hours increase the price by ${priceDifference} Fr.`,
      `Confronta prima i due valori della tabella: ${hourDifference} ore in più aumentano il prezzo di ${priceDifference} Fr.`,
      `Compara primero los dos valores de la tabla: ${hourDifference} horas más aumentan el precio en ${priceDifference} Fr.`,
    ),
    easierExplanation: localText(
      locale,
      `Der Stundenpreis ist ${priceDifference} ${division(locale)} ${hourDifference} = ${hourlyRate} Fr. Ziehe ihn ${repetitionLabel(locale, firstHours)} von ${firstCost} Fr. ab, um die Grundgebühr zu finden.`,
      `The hourly rate is ${priceDifference} ${division(locale)} ${hourDifference} = ${hourlyRate} Fr. Subtract it ${repetitionLabel(locale, firstHours)} from ${firstCost} Fr. to find the base fee.`,
      `La tariffa oraria è ${priceDifference} ${division(locale)} ${hourDifference} = ${hourlyRate} Fr. Sottraila ${repetitionLabel(locale, firstHours)} da ${firstCost} Fr. per trovare la quota fissa.`,
      `La tarifa por hora es ${priceDifference} ${division(locale)} ${hourDifference} = ${hourlyRate} Fr. Réstala ${repetitionLabel(locale, firstHours)} de ${firstCost} Fr. para hallar la tarifa fija.`,
    ),
    explanation: localText(
      locale,
      `Pro Stunde kommen ${hourlyRate} Fr. dazu; die Grundgebühr beträgt ${baseFee} Fr. Für ${targetHours} h sind es ${baseFee} + ${targetHours} · ${hourlyRate} = ${targetCost} Fr.`,
      `The hourly increase is ${hourlyRate} Fr. and the base fee is ${baseFee} Fr. For ${targetHours} h, the cost is ${baseFee} + ${targetHours} · ${hourlyRate} = ${targetCost} Fr.`,
      `Ogni ora aggiunge ${hourlyRate} Fr. e la quota fissa è ${baseFee} Fr. Per ${targetHours} h il costo è ${baseFee} + ${targetHours} · ${hourlyRate} = ${targetCost} Fr.`,
      `Cada hora añade ${hourlyRate} Fr. y la tarifa fija es de ${baseFee} Fr. Para ${targetHours} h, el coste es ${baseFee} + ${targetHours} · ${hourlyRate} = ${targetCost} Fr.`,
    ),
    workedSteps: [
      `${secondCost} − ${firstCost} = ${priceDifference} Fr.`,
      `${priceDifference} ${division(locale)} (${secondHours} − ${firstHours}) = ${hourlyRate} Fr./h`,
      `${firstCost} − ${firstHours} · ${hourlyRate} = ${baseFee} Fr.`,
      `${baseFee} + ${targetHours} · ${hourlyRate} = ${targetCost} Fr.`,
    ],
    visual: {
      kind: "price-table",
      variant: "duration-price",
      labels: [
        hourLabel(locale, firstHours),
        hourLabel(locale, secondHours),
      ],
      values: [firstCost, secondCost, firstHours, secondHours, targetHours, baseFee, hourlyRate, targetCost],
      unit: "Fr.",
    },
  }
}

interface RepeatedDigitCandidate {
  digits: [number, number, number, number]
  divisor: number
  digitSum: number
  lowerBound: number
  relation: DigitRelation
  solutions: number[]
}

function buildRepeatedDigitCandidates(): RepeatedDigitCandidate[] {
  const candidates: RepeatedDigitCandidate[] = []
  const allOddDigits = [1, 3, 5, 7, 9]
  for (let omittedIndex = 0; omittedIndex < allOddDigits.length; omittedIndex += 1) {
    const digits = allOddDigits.filter((_, index) => index !== omittedIndex) as [number, number, number, number]
    // These rules remain independent of the fixed digit-sum condition. Using
    // 3 or 9 here would make the divisibility filter redundant.
    for (const divisor of [5, 7, 11, 13]) {
      for (const digitSum of [12, 16, 18, 20, 22, 24, 26, 28]) {
        for (const lowerBound of [3000, 5000, 7000]) {
          for (const relation of ["greater", "less"] as const) {
            // Single implementation lives in combinatorics.ts (shared with
            // conceptPlayground); digits are odd so the leading-zero guard there
            // never triggers for this pool.
            const solutions = buildRepeatedDigitConstraintFilter(
              digits,
              divisor,
              digitSum,
              lowerBound,
              relation,
            ).solutions
            // The mathematical set remains complete, but the learner should
            // not have to transcribe a dozen four-digit values on an iPad.
            if (solutions.length < 2 || solutions.length > 8) continue
            candidates.push({ digits, divisor, digitSum, lowerBound, relation, solutions })
          }
        }
      }
    }
  }
  return candidates
}

const repeatedDigitCandidates = buildRepeatedDigitCandidates()

function generateRepeatedDigitQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = repeatedDigitCandidates[pickIndex(random, repeatedDigitCandidates.length)]!
  const { digits, divisor, digitSum, lowerBound, relation, solutions } = candidate
  const relationSign = relation === "greater" ? ">" : "<"
  const relationText = relation === "greater"
    ? localText(locale, "Die Tausenderziffer ist grösser als die Einerziffer.", "The thousands digit is greater than the units digit.", "La cifra delle migliaia è maggiore della cifra delle unità.", "La cifra de los millares es mayor que la de las unidades.")
    : localText(locale, "Die Tausenderziffer ist kleiner als die Einerziffer.", "The thousands digit is smaller than the units digit.", "La cifra delle migliaia è minore della cifra delle unità.", "La cifra de los millares es menor que la de las unidades.")
  const divisibilityStrategy = divisor === 5
    ? localText(locale, "Bei Teilbarkeit durch 5 muss die Einerziffer 5 sein.", "For divisibility by 5, the units digit must be 5.", "Per la divisibilità per 5, la cifra delle unità deve essere 5.", "Para que sea divisible entre 5, la cifra de las unidades debe ser 5.")
    : divisor === 7
      ? localText(locale, "Für 7: Trenne die Einerziffer ab und ziehe ihr Doppeltes von der übrigen Zahl ab; wiederhole den Test.", "For 7: remove the units digit and subtract twice that digit from the remaining number; repeat the test.", "Per 7: separa la cifra delle unità e sottrai il suo doppio dal numero rimanente; ripeti il controllo.", "Para 7: separa la cifra de las unidades y resta su doble del número restante; repite la prueba.")
      : divisor === 11
        ? localText(locale, "Für 11 muss die Differenz der alternierenden Ziffernsummen ein Vielfaches von 11 sein.", "For 11, the difference between the alternating digit sums must be a multiple of 11.", "Per 11, la differenza tra le somme delle cifre alternate deve essere un multiplo di 11.", "Para 11, la diferencia entre las sumas de cifras alternas debe ser un múltiplo de 11.")
        : localText(locale, "Für 13: Trenne die Einerziffer ab und addiere ihr Vierfaches zur übrigen Zahl; wiederhole den Test.", "For 13: remove the units digit and add four times that digit to the remaining number; repeat the test.", "Per 13: separa la cifra delle unità e aggiungi quattro volte quella cifra al numero rimanente; ripeti il controllo.", "Para 13: separa la cifra de las unidades y suma cuatro veces esa cifra al número restante; repite la prueba.")

  return {
    id,
    topicId: "number-constraints",
    prompt: localText(
      locale,
      `Finde alle vierstelligen Zahlen mit diesen Bedingungen:\n• Erlaubt sind nur die Ziffern ${digits.join(", ")}; Wiederholungen sind erlaubt.\n• Die Zahl ist grösser als ${lowerBound} und durch ${divisor} teilbar.\n• Die Quersumme ist ${digitSum}.\n• ${relationText}\n\nGib die vollständige Lösungsmenge mit Kommas getrennt an.`,
      `Find all four-digit numbers satisfying these conditions:\n• Only the digits ${digits.join(", ")} may be used; repetition is allowed.\n• The number is greater than ${lowerBound} and divisible by ${divisor}.\n• Its digit sum is ${digitSum}.\n• ${relationText}\n\nGive the complete solution set, separated by commas.`,
      `Trova tutti i numeri di quattro cifre che soddisfano queste condizioni:\n• Si possono usare solo le cifre ${digits.join(", ")}; le ripetizioni sono ammesse.\n• Il numero è maggiore di ${lowerBound} e divisibile per ${divisor}.\n• La somma delle cifre è ${digitSum}.\n• ${relationText}\n\nIndica l'insieme completo delle soluzioni, separato da virgole.`,
      `Halla todos los números de cuatro cifras que cumplen estas condiciones:\n• Solo se pueden usar las cifras ${digits.join(", ")}; se permiten repeticiones.\n• El número es mayor que ${lowerBound} y divisible entre ${divisor}.\n• La suma de sus cifras es ${digitSum}.\n• ${relationText}\n\nEscribe el conjunto completo de soluciones, separado por comas.`,
    ),
    answerLabel: localText(locale, "Alle passenden Zahlen", "All matching numbers", "Tutti i numeri validi", "Todos los números válidos"),
    response: { kind: "integer-set", values: solutions },
    hint: localText(
      locale,
      `${divisibilityStrategy} Prüfe danach Grenze, Quersumme und Stellenbedingung.`,
      `${divisibilityStrategy} Then check the bound, digit sum and place-value condition.`,
      `${divisibilityStrategy} Poi controlla il limite, la somma delle cifre e la condizione sulle posizioni.`,
      `${divisibilityStrategy} Después comprueba el límite, la suma de cifras y la condición de posición.`,
    ),
    easierExplanation: localText(
      locale,
      "Wiederholungen sind erlaubt: Jede der vier Stellen darf unabhängig eine der erlaubten Ziffern tragen. Wende dann jeden Filter genau einmal an.",
      "Repetition is allowed: each of the four places may independently contain any allowed digit. Then apply each filter once.",
      "Le ripetizioni sono ammesse: ognuna delle quattro posizioni può contenere indipendentemente una cifra consentita. Poi applica ogni filtro una volta.",
      "Se permiten repeticiones: cada una de las cuatro posiciones puede contener de forma independiente una cifra permitida. Después aplica cada filtro una vez.",
    ),
    explanation: localText(
      locale,
      `Nach allen vier Filtern bleiben genau ${solutions.length} Zahlen: ${solutions.join(", ")}.`,
      `After all four filters, exactly ${solutions.length} numbers remain: ${solutions.join(", ")}.`,
      `Dopo tutti e quattro i filtri rimangono esattamente ${solutions.length} numeri: ${solutions.join(", ")}.`,
      `Después de los cuatro filtros quedan exactamente ${solutions.length} números: ${solutions.join(", ")}.`,
    ),
    workedSteps: [
      divisibilityStrategy,
      localText(locale, `Zahlen über ${lowerBound} mit Quersumme ${digitSum} bilden.`, `Form numbers above ${lowerBound} with digit sum ${digitSum}.`, `Forma numeri maggiori di ${lowerBound} con somma delle cifre ${digitSum}.`, `Forma números mayores que ${lowerBound} cuya suma de cifras sea ${digitSum}.`),
      localText(locale, `Tausender ${relationSign} Einer prüfen.`, `Check thousands ${relationSign} units.`, `Controlla migliaia ${relationSign} unità.`, `Comprueba millares ${relationSign} unidades.`),
      localText(locale, `Vollständige Menge: ${solutions.join(", ")}`, `Complete set: ${solutions.join(", ")}`, `Insieme completo: ${solutions.join(", ")}`, `Conjunto completo: ${solutions.join(", ")}`),
    ],
    visual: {
      kind: "number-filter",
      variant: relation,
      values: [...digits, divisor, digitSum, lowerBound, relation === "greater" ? 1 : -1, solutions.length],
      labels: localText(
        locale,
        ["Ziffern wiederholen", `> ${lowerBound} und teilbar durch ${divisor}`, `Quersumme = ${digitSum}`, `Tausender ${relationSign} Einer`, `${solutions.length} Lösungen`].join("|"),
        ["repeat allowed digits", `> ${lowerBound} and divisible by ${divisor}`, `digit sum = ${digitSum}`, `thousands ${relationSign} units`, `${solutions.length} solutions`].join("|"),
        ["ripeti le cifre consentite", `> ${lowerBound} e divisibile per ${divisor}`, `somma delle cifre = ${digitSum}`, `migliaia ${relationSign} unità`, `${solutions.length} soluzioni`].join("|"),
        ["repite las cifras permitidas", `> ${lowerBound} y divisible entre ${divisor}`, `suma de cifras = ${digitSum}`, `millares ${relationSign} unidades`, `${solutions.length} soluciones`].join("|"),
      ).split("|"),
    },
  }
}

interface MissingEdgeCandidate {
  length: number
  width: number
  height: number
  volume: number
}

function buildMissingEdgeCandidates(): MissingEdgeCandidate[] {
  const candidates: MissingEdgeCandidate[] = []
  for (const length of [10, 12, 15, 18, 20, 24, 25, 30]) {
    for (const width of [4, 5, 6, 8, 10, 12, 15]) {
      for (const height of [2, 3, 4, 5, 6, 8, 10]) {
        if (width > length || height > width || height === width) continue
        const volume = length * width * height
        if (volume > 10_000) continue
        candidates.push({ length, width, height, volume })
      }
    }
  }
  return candidates
}

const missingEdgeCandidates = buildMissingEdgeCandidates()

function generateMissingEdgeQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = missingEdgeCandidates[pickIndex(random, missingEdgeCandidates.length)]!
  const { length, width, height, volume } = candidate
  const baseArea = length * width

  return {
    id,
    topicId: "cuboid-surface",
    prompt: localText(
      locale,
      `Eine quaderförmige Versandbox ist ${length} cm lang und ${width} cm breit. Ihr Volumen beträgt ${volume} cm³. Wie hoch ist die Box?`,
      `A cuboid shipping box is ${length} cm long and ${width} cm wide. Its volume is ${volume} cm³. How high is the box?`,
      `Una scatola da spedizione a forma di parallelepipedo è lunga ${length} cm e larga ${width} cm. Il suo volume è ${volume} cm³. Quanto è alta?`,
      `Una caja de envío con forma de ortoedro mide ${length} cm de largo y ${width} cm de ancho. Su volumen es de ${volume} cm³. ¿Cuánto mide de alto?`,
    ),
    answerLabel: localText(locale, "Höhe der Box", "Height of the box", "Altezza della scatola", "Altura de la caja"),
    response: { kind: "number", value: height, decimals: 0, unit: "cm" },
    hint: localText(
      locale,
      "Beim Quader gilt Volumen = Länge · Breite · Höhe. Teile das Volumen durch die bekannte Grundfläche.",
      "For a cuboid, volume = length · width · height. Divide the volume by the known base area.",
      "Per un parallelepipedo, volume = lunghezza · larghezza · altezza. Dividi il volume per l'area di base nota.",
      "En un ortoedro, volumen = largo · ancho · alto. Divide el volumen entre el área conocida de la base.",
    ),
    easierExplanation: localText(
      locale,
      `Die Grundfläche ist ${length} · ${width} = ${baseArea} cm². Suche, wie oft diese Fläche in ${volume} cm³ enthalten ist.`,
      `The base area is ${length} · ${width} = ${baseArea} cm². Find how many times that area fits into ${volume} cm³.`,
      `L'area di base è ${length} · ${width} = ${baseArea} cm². Trova quante volte quest'area è contenuta in ${volume} cm³.`,
      `El área de la base es ${length} · ${width} = ${baseArea} cm². Halla cuántas veces cabe esa área en ${volume} cm³.`,
    ),
    explanation: `${volume} cm³ ${division(locale)} (${length} cm · ${width} cm) = ${height} cm.`,
    workedSteps: [
      `${length} · ${width} = ${baseArea} cm²`,
      `${volume} ${division(locale)} ${baseArea} = ${height} cm`,
      `${length} · ${width} · ${height} = ${volume} cm³`,
    ],
    visual: {
      kind: "cuboid",
      variant: "missing-edge",
      values: [length, width, volume, height],
      labels: localText(
        locale,
        ["Länge", "Breite", "Volumen", "gesuchte Höhe"].join("|"),
        ["length", "width", "volume", "unknown height"].join("|"),
        ["lunghezza", "larghezza", "volume", "altezza cercata"].join("|"),
        ["largo", "ancho", "volumen", "altura buscada"].join("|"),
      ).split("|"),
    },
  }
}

export function supportsArchiveExpansionTopic(topicId: TopicId): topicId is ArchiveExpansionTopicId {
  return archiveExpansionTopics.has(topicId)
}

/**
 * Original, archive-informed generator families intended for version 5 and
 * later. Callers must keep versions 2-4 routed to their existing generators so
 * paused and resumed tasks retain byte-for-byte deterministic replay.
 */
export function generateArchiveExpansionQuestion(
  topicId: ArchiveExpansionTopicId,
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  let question: GeneratedQuestion
  let familyId: string
  let templateId: string

  switch (topicId) {
    case "efficient-arithmetic": {
      question = generateCompensationQuestion(seed, id, locale)
      familyId = archiveExpansionFamilyCatalog[0].familyId
      templateId = question.visual?.variant === "sum" ? "round-number-above" : "round-number-below"
      break
    }
    case "speed-distance-time": {
      question = generateTravelTimingQuestion(seed, id, locale)
      familyId = archiveExpansionFamilyCatalog[1].familyId
      templateId = question.visual?.variant === "return-home" ? "return-home" : "late-start"
      break
    }
    case "data-tables":
      question = generateRentalTableQuestion(seed, id, locale)
      familyId = archiveExpansionFamilyCatalog[2].familyId
      templateId = "infer-base-and-hourly-rate"
      break
    case "number-constraints":
      question = generateRepeatedDigitQuestion(seed, id, locale)
      familyId = archiveExpansionFamilyCatalog[3].familyId
      templateId = "complete-set-with-repetition"
      break
    case "cuboid-surface":
      question = generateMissingEdgeQuestion(seed, id, locale)
      familyId = archiveExpansionFamilyCatalog[4].familyId
      templateId = "height-from-volume"
      break
  }

  return {
    ...question,
    provenance: {
      kind: "original-dynamic",
      familyId,
      templateId,
      templateVersion: 1,
    },
  }
}

export function archiveExpansionDiagnostics(): {
  efficientArithmeticCandidates: number
  returnHomeCandidates: number
  lateStartCandidates: number
  rentalTableCandidates: number
  repeatedDigitCandidates: number
  missingEdgeCandidates: number
  totalCandidates: number
  families: Array<{
    familyId: string
    topicId: ArchiveExpansionTopicId
    templates: Array<{ templateId: string; candidateCount: number }>
    candidateCount: number
  }>
} {
  const counts = {
    efficientArithmeticCandidates: compensationCandidates.length,
    returnHomeCandidates: returnHomeCandidates.length,
    lateStartCandidates: lateStartCandidates.length,
    rentalTableCandidates: rentalTableCandidates.length,
    repeatedDigitCandidates: repeatedDigitCandidates.length,
    missingEdgeCandidates: missingEdgeCandidates.length,
  }
  return {
    ...counts,
    totalCandidates: Object.values(counts).reduce((sum, count) => sum + count, 0),
    families: [
      {
        ...archiveExpansionFamilyCatalog[0],
        templates: [
          { templateId: "round-number-above", candidateCount: compensationCandidates.filter((candidate) => candidate.operation === "sum").length },
          { templateId: "round-number-below", candidateCount: compensationCandidates.filter((candidate) => candidate.operation === "difference").length },
        ],
        candidateCount: compensationCandidates.length,
      },
      {
        ...archiveExpansionFamilyCatalog[1],
        templates: [
          { templateId: "return-home", candidateCount: returnHomeCandidates.length },
          { templateId: "late-start", candidateCount: lateStartCandidates.length },
        ],
        candidateCount: returnHomeCandidates.length + lateStartCandidates.length,
      },
      {
        ...archiveExpansionFamilyCatalog[2],
        templates: [{ templateId: "infer-base-and-hourly-rate", candidateCount: rentalTableCandidates.length }],
        candidateCount: rentalTableCandidates.length,
      },
      {
        ...archiveExpansionFamilyCatalog[3],
        templates: [{ templateId: "complete-set-with-repetition", candidateCount: repeatedDigitCandidates.length }],
        candidateCount: repeatedDigitCandidates.length,
      },
      {
        ...archiveExpansionFamilyCatalog[4],
        templates: [{ templateId: "height-from-volume", candidateCount: missingEdgeCandidates.length }],
        candidateCount: missingEdgeCandidates.length,
      },
    ],
  }
}
