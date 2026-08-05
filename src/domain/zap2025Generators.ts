import type { GeneratedQuestion, GeometryConstructionSpec, LearningLocale, TopicId } from "./model"
import { enumeratePositiveCoinCombinations } from "./combinatorics"
import {
  buildAreaFractionModel,
  buildCuboidSurfaceModel,
  buildPyramidRollPath,
  buildPyramidRollModel,
  buildTilingCostModel,
  findMissingPyramidFace,
} from "./areaSpatial"
import { createRandom, pick, pickIndex } from "./random"

const formatNumber = (value: number, locale: LearningLocale = "de"): string =>
  new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "it" ? "it-CH" : locale === "es" ? "es-ES" : "de-CH", { maximumFractionDigits: 2 }).format(value)

const localText = (
  locale: LearningLocale,
  german: string,
  english: string,
  italian: string,
  spanish: string,
): string => locale === "en" ? english : locale === "it" ? italian : locale === "es" ? spanish : german

const division = (locale: LearningLocale): string => locale === "de" ? ":" : "÷"

function generateArithmeticEquation(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const multiplier = pick(random, [3, 4, 6, 8, 9, 11])
  const divisor = pick(random, [2, 5, 7, 9])
  const base = pick(random, [7, 9, 12, 15, 18, 24])
  const answer = divisor * base
  const result = base * multiplier

  return {
    id,
    topicId: "arithmetic-equations",
    prompt: localText(locale, `Bestimme die fehlende Zahl: (□ · ${multiplier}) : ${divisor} = ${result}`, `Find the missing number: (□ · ${multiplier}) ÷ ${divisor} = ${result}`, `Trova il numero mancante: (□ · ${multiplier}) ÷ ${divisor} = ${result}`, `Halla el número que falta: (□ · ${multiplier}) ÷ ${divisor} = ${result}`),
    answerLabel: localText(locale, "In das Kästchen gehört", "The number in the box is", "Nella casella va il numero", "En la casilla va"),
    response: { kind: "number", value: answer, decimals: 0 },
    hint: localText(locale, `Mache zuerst die Division durch ${divisor} rückgängig.`, `Undo the division by ${divisor} first.`, `Annulla prima la divisione per ${divisor}.`, `Deshaz primero la división entre ${divisor}.`),
    easierExplanation: localText(locale, `Beginne bei ${result}. Multipliziere mit ${divisor} und teile danach durch ${multiplier}.`, `Start at ${result}. Multiply by ${divisor}, then divide by ${multiplier}.`, `Parti da ${result}. Moltiplica per ${divisor}, poi dividi per ${multiplier}.`, `Empieza por ${result}. Multiplica por ${divisor} y divide después entre ${multiplier}.`),
    explanation: `${result} · ${divisor} = ${result * divisor}; ${result * divisor} ${division(locale)} ${multiplier} = ${answer}.`,
    workedSteps: [
      `${result} · ${divisor} = ${result * divisor}`,
      `${result * divisor} ${division(locale)} ${multiplier} = ${answer}`,
      localText(locale, `Kontrolle: (${answer} · ${multiplier}) : ${divisor} = ${result}`, `Check: (${answer} · ${multiplier}) ÷ ${divisor} = ${result}`, `Controllo: (${answer} · ${multiplier}) ÷ ${divisor} = ${result}`, `Comprobación: (${answer} · ${multiplier}) ÷ ${divisor} = ${result}`),
    ],
    visual: {
      kind: "equation-balance",
      values: [multiplier, divisor, result],
      labels: locale === "en" ? ["multiply", "divide", "result"] : locale === "it" ? ["moltiplica", "dividi", "risultato"] : locale === "es" ? ["multiplica", "divide", "resultado"] : ["mal", "geteilt", "Ergebnis"],
    },
  }
}

interface TimeFractionCandidate {
  totalMinutes: number
  denominator: number
  numerator: number
  subtractMinutes: number
  remainingMinutes: number
}

function timeFractionCandidates(): TimeFractionCandidate[] {
  const results: TimeFractionCandidate[] = []
  for (const totalMinutes of [140, 175, 210, 240, 280, 315]) {
    for (const denominator of [5, 7]) {
      if (totalMinutes % denominator !== 0) continue
      const onePart = totalMinutes / denominator
      for (let numerator = 2; numerator < denominator; numerator += 1) {
        const fractionMinutes = onePart * numerator
        for (const subtractMinutes of [12, 20, 24, 30, 36, 40, 48, 60]) {
          const remainingMinutes = fractionMinutes - subtractMinutes
          if (remainingMinutes <= 0) continue
          results.push({ totalMinutes, denominator, numerator, subtractMinutes, remainingMinutes })
        }
      }
    }
  }
  return results
}

const timeCandidates = timeFractionCandidates()

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} h`
  return `${hours} h ${rest} min`
}

function generateTimeFraction(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = timeCandidates[pickIndex(random, timeCandidates.length)]!
  const { totalMinutes, denominator, numerator, subtractMinutes, remainingMinutes } = candidate
  const onePart = totalMinutes / denominator
  const fractionMinutes = remainingMinutes + subtractMinutes

  return {
    id,
    topicId: "time-fractions",
    prompt: localText(locale, `(□/${denominator} von ${durationLabel(totalMinutes)}) − ${subtractMinutes} min = ${remainingMinutes} min. Welche Zahl gehört in das Kästchen?`, `(□/${denominator} of ${durationLabel(totalMinutes)}) − ${subtractMinutes} min = ${remainingMinutes} min. Which number belongs in the box?`, `(□/${denominator} di ${durationLabel(totalMinutes)}) − ${subtractMinutes} min = ${remainingMinutes} min. Quale numero va nella casella?`, `(□/${denominator} de ${durationLabel(totalMinutes)}) − ${subtractMinutes} min = ${remainingMinutes} min. ¿Qué número va en la casilla?`),
    answerLabel: localText(locale, "Der fehlende Zähler ist", "The missing numerator is", "Il numeratore mancante è", "El numerador que falta es"),
    response: { kind: "number", value: numerator, decimals: 0 },
    hint: localText(locale, `Addiere zuerst die ${subtractMinutes} min wieder dazu.`, `Add the ${subtractMinutes} min back first.`, `Aggiungi prima di nuovo i ${subtractMinutes} min.`, `Vuelve a sumar primero los ${subtractMinutes} min.`),
    easierExplanation: localText(locale, `${durationLabel(totalMinutes)} sind ${totalMinutes} min. Ein ${denominator}tel sind deshalb ${onePart} min.`, `${durationLabel(totalMinutes)} is ${totalMinutes} min. One of the ${denominator} equal parts is therefore ${onePart} min.`, `${durationLabel(totalMinutes)} corrispondono a ${totalMinutes} min. Una delle ${denominator} parti uguali dura quindi ${onePart} min.`, `${durationLabel(totalMinutes)} son ${totalMinutes} min. Por tanto, una de las ${denominator} partes iguales dura ${onePart} min.`),
    explanation: localText(locale, `${remainingMinutes} + ${subtractMinutes} = ${fractionMinutes} min. Ein Teil sind ${onePart} min, also sind das ${fractionMinutes} : ${onePart} = ${numerator} Teile.`, `${remainingMinutes} + ${subtractMinutes} = ${fractionMinutes} min. One part is ${onePart} min, so this is ${fractionMinutes} ÷ ${onePart} = ${numerator} parts.`, `${remainingMinutes} + ${subtractMinutes} = ${fractionMinutes} min. Una parte dura ${onePart} min, quindi sono ${fractionMinutes} ÷ ${onePart} = ${numerator} parti.`, `${remainingMinutes} + ${subtractMinutes} = ${fractionMinutes} min. Una parte dura ${onePart} min, así que son ${fractionMinutes} ÷ ${onePart} = ${numerator} partes.`),
    workedSteps: [
      `${durationLabel(totalMinutes)} = ${totalMinutes} min`,
      `${remainingMinutes} + ${subtractMinutes} = ${fractionMinutes} min`,
      `${totalMinutes} ${division(locale)} ${denominator} = ${onePart} min ${localText(locale, "pro Teil", "per part", "per parte", "por parte")}`,
      `${fractionMinutes} ${division(locale)} ${onePart} = ${numerator}`,
    ],
    visual: {
      kind: "clock",
      numerator,
      denominator,
      values: [totalMinutes, subtractMinutes, remainingMinutes],
      labels: locale === "en" ? ["total", "subtract", "remaining"] : locale === "it" ? ["totale", "sottrai", "rimane"] : locale === "es" ? ["total", "restar", "restante"] : ["gesamt", "abziehen", "übrig"],
    },
  }
}

function generateMoneyCalculation(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const prices = [pick(random, [7, 8, 9, 10]), pick(random, [18, 20, 22, 24]), pick(random, [11, 12, 14, 15])]

  if (random() < 0.52) {
    const counts = [pick(random, [2, 3, 4, 5]), pick(random, [1, 2, 3]), pick(random, [1, 2, 3, 4])]
    const total = counts.reduce((sum, count, index) => sum + count * prices[index]!, 0)
    return {
      id,
      topicId: "money-calculations",
      prompt: localText(locale, `Ein Tierpark verlangt ${prices[0]} Fr. für Kinder, ${prices[1]} Fr. für Erwachsene und ${prices[2]} Fr. für Pensionierte. Was bezahlt eine Gruppe mit ${counts[0]} Kindern, ${counts[1]} Erwachsenen und ${counts[2]} Pensionierten?`, `A wildlife park charges ${prices[0]} Fr. for a child, ${prices[1]} Fr. for an adult and ${prices[2]} Fr. for a senior. How much does a group of ${counts[0]} children, ${counts[1]} adults and ${counts[2]} seniors pay?`, `Un parco faunistico chiede ${prices[0]} Fr. per un bambino, ${prices[1]} Fr. per un adulto e ${prices[2]} Fr. per una persona anziana. Quanto paga un gruppo formato da ${counts[0]} bambini, ${counts[1]} adulti e ${counts[2]} persone anziane?`, `Un parque de animales cobra ${prices[0]} Fr. por niño, ${prices[1]} Fr. por adulto y ${prices[2]} Fr. por jubilado. ¿Cuánto paga un grupo de ${counts[0]} niños, ${counts[1]} adultos y ${counts[2]} jubilados?`),
      answerLabel: localText(locale, "Die Gruppe bezahlt", "The group pays", "Il gruppo paga", "El grupo paga"),
      response: { kind: "number", value: total, decimals: 0, unit: "Fr." },
      hint: localText(locale, "Berechne den Preis jeder Gruppe getrennt und addiere danach.", "Calculate the price for each category separately, then add them.", "Calcola separatamente il prezzo di ogni categoria e poi somma.", "Calcula por separado el precio de cada categoría y súmalos después."),
      easierExplanation: localText(locale, `Kinder: ${counts[0]} · ${prices[0]} Fr. Beginne genauso für die beiden anderen Gruppen.`, `Children: ${counts[0]} · ${prices[0]} Fr. Do the same for the other two categories.`, `Bambini: ${counts[0]} · ${prices[0]} Fr. Procedi allo stesso modo per le altre due categorie.`, `Niños: ${counts[0]} · ${prices[0]} Fr. Haz lo mismo para las otras dos categorías.`),
      explanation: `${counts[0] * prices[0]!} + ${counts[1] * prices[1]!} + ${counts[2] * prices[2]!} = ${total} Fr.`,
      workedSteps: [
        `${counts[0]} · ${prices[0]} Fr. = ${counts[0] * prices[0]!} Fr.`,
        `${counts[1]} · ${prices[1]} Fr. = ${counts[1] * prices[1]!} Fr.`,
        `${counts[2]} · ${prices[2]} Fr. = ${counts[2] * prices[2]!} Fr.`,
        `Total: ${total} Fr.`,
      ],
      visual: {
        kind: "price-table",
        variant: "group-total",
        labels: locale === "en" ? ["Children", "Adults", "Seniors"] : locale === "it" ? ["Bambini", "Adulti", "Anziani"] : locale === "es" ? ["Niños", "Adultos", "Jubilados"] : ["Kinder", "Erwachsene", "Pensionierte"],
        values: [...prices, ...counts],
      },
    }
  }

  const categoryIndex = pickIndex(random, prices.length)
  const count = pick(random, [24, 36, 42, 48, 54, 72, 84, 96])
  const revenue = count * prices[categoryIndex]!
  const labels = locale === "en" ? ["Children", "Adults", "Seniors"] : locale === "it" ? ["Bambini", "Adulti", "Anziani"] : locale === "es" ? ["Niños", "Adultos", "Jubilados"] : ["Kinder", "Erwachsene", "Pensionierte"]
  return {
    id,
    topicId: "money-calculations",
    prompt: localText(locale, `${labels[categoryIndex]} bezahlen ${prices[categoryIndex]} Fr. Eintritt. An einem Tag stammen ${formatNumber(revenue)} Fr. Einnahmen aus dieser Kategorie. Wie viele Eintritte wurden verkauft?`, `${labels[categoryIndex]} pay ${prices[categoryIndex]} Fr. admission. On one day, this category generates ${formatNumber(revenue, locale)} Fr. in revenue. How many admissions were sold?`, `${labels[categoryIndex]} pagano ${prices[categoryIndex]} Fr. per l'ingresso. In un giorno questa categoria produce ${formatNumber(revenue, locale)} Fr. di ricavi. Quanti ingressi sono stati venduti?`, `${labels[categoryIndex]} pagan ${prices[categoryIndex]} Fr. de entrada. En un día, esta categoría genera ${formatNumber(revenue, locale)} Fr. de ingresos. ¿Cuántas entradas se vendieron?`),
    answerLabel: localText(locale, "Verkaufte Eintritte", "Admissions sold", "Ingressi venduti", "Entradas vendidas"),
    response: { kind: "number", value: count, decimals: 0 },
    hint: localText(locale, "Teile die gesamten Einnahmen durch den Preis eines Eintritts.", "Divide the total revenue by the price of one admission.", "Dividi il ricavo totale per il prezzo di un ingresso.", "Divide los ingresos totales entre el precio de una entrada."),
    easierExplanation: localText(locale, `Jede Person bringt ${prices[categoryIndex]} Fr. Einnahmen. Suche, wie oft dieser Betrag in ${revenue} Fr. enthalten ist.`, `Each person contributes ${prices[categoryIndex]} Fr. Find how many times that amount fits into ${revenue} Fr.`, `Ogni persona porta un ricavo di ${prices[categoryIndex]} Fr. Trova quante volte questo importo è contenuto in ${revenue} Fr.`, `Cada persona aporta ${prices[categoryIndex]} Fr. Halla cuántas veces cabe esa cantidad en ${revenue} Fr.`),
    explanation: `${revenue} Fr. ${division(locale)} ${prices[categoryIndex]} Fr. = ${count}.`,
    workedSteps: [`${revenue} ${division(locale)} ${prices[categoryIndex]} = ${count}`, localText(locale, `Es wurden ${count} Eintritte verkauft.`, `${count} admissions were sold.`, `Sono stati venduti ${count} ingressi.`, `Se vendieron ${count} entradas.`)],
    visual: {
      kind: "price-table",
      variant: "unit-count",
      labels,
      values: [...prices, categoryIndex, count, revenue],
    },
  }
}

function generateProportionalRevenue(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const childPrice = pick(random, [7, 8, 9, 10])
  const adultPrice = pick(random, [18, 20, 22, 24])
  const seniorPrice = pick(random, [11, 12, 14, 15])
  const ratio = pick(random, [2, 3])
  const adultCount = pick(random, [28, 32, 36, 42, 48, 54, 60, 72])
  const childCount = adultCount * ratio
  const seniorCount = pick(random, [35, 42, 48, 56, 63, 72])
  const seniorRevenue = seniorCount * seniorPrice
  const ratioRevenue = childCount * childPrice + adultCount * adultPrice
  const totalRevenue = seniorRevenue + ratioRevenue
  const bundlePrice = ratio * childPrice + adultPrice

  return {
    id,
    topicId: "proportional-revenue",
    prompt: localText(locale, `Ein Ausflugsziel verlangt ${childPrice} Fr. pro Kind, ${adultPrice} Fr. pro erwachsene Person und ${seniorPrice} Fr. pro pensionierte Person. Die Pensionierten brachten ${seniorRevenue} Fr. ein, insgesamt waren es ${totalRevenue} Fr. Es kamen genau ${ratio}-mal so viele Kinder wie Erwachsene. Wie viele Kinder kamen?`, `A visitor attraction charges ${childPrice} Fr. per child, ${adultPrice} Fr. per adult and ${seniorPrice} Fr. per senior. Seniors generated ${seniorRevenue} Fr. and total revenue was ${totalRevenue} Fr. Exactly ${ratio} times as many children as adults visited. How many children visited?`, `Un'attrazione turistica chiede ${childPrice} Fr. per bambino, ${adultPrice} Fr. per adulto e ${seniorPrice} Fr. per persona anziana. Le persone anziane hanno generato ${seniorRevenue} Fr. e il ricavo totale è stato di ${totalRevenue} Fr. I bambini erano esattamente ${ratio} volte gli adulti. Quanti bambini sono venuti?`, `Una atracción cobra ${childPrice} Fr. por niño, ${adultPrice} Fr. por adulto y ${seniorPrice} Fr. por jubilado. Los jubilados generaron ${seniorRevenue} Fr. y los ingresos totales fueron ${totalRevenue} Fr. Acudieron exactamente ${ratio} veces más niños que adultos. ¿Cuántos niños fueron?`),
    answerLabel: localText(locale, "Anzahl Kinder", "Number of children", "Numero di bambini", "Número de niños"),
    response: { kind: "number", value: childCount, decimals: 0 },
    hint: localText(locale, `Bilde ein Paket aus ${ratio} Kindertickets und einem Erwachsenenticket.`, `Make one bundle from ${ratio} child tickets and one adult ticket.`, `Forma un gruppo con ${ratio} biglietti per bambini e un biglietto per adulto.`, `Forma un paquete con ${ratio} entradas infantiles y una entrada de adulto.`),
    easierExplanation: localText(locale, `Ziehe zuerst die ${seniorRevenue} Fr. ab. Jedes Verhältnis-Paket kostet ${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr.`, `Subtract the ${seniorRevenue} Fr. from seniors first. Each ratio bundle costs ${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr.`, `Sottrai prima i ${seniorRevenue} Fr. delle persone anziane. Ogni gruppo nel rapporto costa ${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr.`, `Resta primero los ${seniorRevenue} Fr. de los jubilados. Cada paquete de la proporción cuesta ${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr.`),
    explanation: localText(locale, `${totalRevenue} − ${seniorRevenue} = ${ratioRevenue} Fr.; ${ratioRevenue} : ${bundlePrice} = ${adultCount} Pakete; ${adultCount} · ${ratio} = ${childCount} Kinder.`, `${totalRevenue} − ${seniorRevenue} = ${ratioRevenue} Fr.; ${ratioRevenue} ÷ ${bundlePrice} = ${adultCount} bundles; ${adultCount} · ${ratio} = ${childCount} children.`, `${totalRevenue} − ${seniorRevenue} = ${ratioRevenue} Fr.; ${ratioRevenue} ÷ ${bundlePrice} = ${adultCount} gruppi; ${adultCount} · ${ratio} = ${childCount} bambini.`, `${totalRevenue} − ${seniorRevenue} = ${ratioRevenue} Fr.; ${ratioRevenue} ÷ ${bundlePrice} = ${adultCount} paquetes; ${adultCount} · ${ratio} = ${childCount} niños.`),
    workedSteps: [
      `${totalRevenue} − ${seniorRevenue} = ${ratioRevenue} Fr.`,
      localText(locale, `${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr. pro Paket`, `${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr. per bundle`, `${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr. per gruppo`, `${ratio} · ${childPrice} + ${adultPrice} = ${bundlePrice} Fr. por paquete`),
      localText(locale, `${ratioRevenue} : ${bundlePrice} = ${adultCount} Pakete`, `${ratioRevenue} ÷ ${bundlePrice} = ${adultCount} bundles`, `${ratioRevenue} ÷ ${bundlePrice} = ${adultCount} gruppi`, `${ratioRevenue} ÷ ${bundlePrice} = ${adultCount} paquetes`),
      localText(locale, `${adultCount} · ${ratio} = ${childCount} Kinder`, `${adultCount} · ${ratio} = ${childCount} children`, `${adultCount} · ${ratio} = ${childCount} bambini`, `${adultCount} · ${ratio} = ${childCount} niños`),
    ],
    visual: {
      kind: "price-table",
      variant: "ratio-bundle",
      labels: locale === "en" ? ["Children", "Adults", "Seniors", "Total"] : locale === "it" ? ["Bambini", "Adulti", "Anziani", "Totale"] : locale === "es" ? ["Niños", "Adultos", "Jubilados", "Total"] : ["Kinder", "Erwachsene", "Pensionierte", "Total"],
      values: [childPrice, adultPrice, seniorPrice, totalRevenue, ratio, seniorRevenue, adultCount],
    },
  }
}

interface CombinationCandidate {
  denominations: [number, number, number]
  total: number
  solutions: Array<[number, number, number]>
}

function combinationCandidates(): CombinationCandidate[] {
  const results: CombinationCandidate[] = []
  for (const denominations of [[5, 2, 1], [6, 3, 1], [4, 3, 1]] as const) {
    for (let total = 13; total <= 30; total += 1) {
      const solutions = enumeratePositiveCoinCombinations(denominations, total)
      if (solutions.length >= 3 && solutions.length <= 12) {
        results.push({ denominations: [...denominations], total, solutions })
      }
    }
  }
  return results
}

const combinationCases = combinationCandidates()

function generateIntegerCombinations(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = combinationCases[pickIndex(random, combinationCases.length)]!
  const { denominations, total, solutions } = candidate
  const tupleText = solutions.map((solution) => `(${solution.join(", ")})`).join(", ")

  return {
    id,
    topicId: "integer-combinations",
    prompt: localText(locale, `Eine Kasse enthält nur ${denominations[0]}-Franken-, ${denominations[1]}-Franken- und ${denominations[2]}-Franken-Münzen. Von jeder Sorte ist mindestens eine vorhanden, zusammen sind es ${total} Fr. Wie viele verschiedene Kombinationen gibt es?`, `A till contains only ${denominations[0]}-franc, ${denominations[1]}-franc and ${denominations[2]}-franc coins. There is at least one of each type and their total value is ${total} Fr. How many different combinations are possible?`, `Una cassa contiene soltanto monete da ${denominations[0]}, ${denominations[1]} e ${denominations[2]} franchi. C'è almeno una moneta di ogni tipo e il valore totale è ${total} Fr. Quante combinazioni diverse sono possibili?`, `Una caja contiene solo monedas de ${denominations[0]}, ${denominations[1]} y ${denominations[2]} francos. Hay al menos una de cada tipo y su valor total es de ${total} Fr. ¿Cuántas combinaciones diferentes hay?`),
    answerLabel: localText(locale, "Anzahl Kombinationen", "Number of combinations", "Numero di combinazioni", "Número de combinaciones"),
    response: { kind: "number", value: solutions.length, decimals: 0 },
    hint: localText(locale, `Beginne mit einer ${denominations[0]}-Franken-Münze und erhöhe die Anzahl der ${denominations[1]}-Franken-Münzen schrittweise.`, `Start with one ${denominations[0]}-franc coin and increase the number of ${denominations[1]}-franc coins step by step.`, `Inizia con una moneta da ${denominations[0]} franchi e aumenta gradualmente il numero di monete da ${denominations[1]} franchi.`, `Empieza con una moneda de ${denominations[0]} francos y aumenta paso a paso el número de monedas de ${denominations[1]} francos.`),
    easierExplanation: localText(locale, `Reserviere zuerst je eine Münze. Halte danach die Anzahl der grössten Münze fest und berechne den Rest systematisch.`, `Reserve one coin of each type first. Then fix the number of the largest coin and calculate the remainder systematically.`, `Metti da parte prima una moneta di ogni tipo. Poi fissa il numero delle monete più grandi e calcola sistematicamente il resto.`, `Reserva primero una moneda de cada tipo. Después fija la cantidad de la moneda mayor y calcula el resto sistemáticamente.`),
    explanation: localText(locale, `Es gibt ${solutions.length} positive ganzzahlige Kombinationen: ${tupleText}.`, `There are ${solutions.length} positive-integer combinations: ${tupleText}.`, `Ci sono ${solutions.length} combinazioni di interi positivi: ${tupleText}.`, `Hay ${solutions.length} combinaciones de enteros positivos: ${tupleText}.`),
    workedSteps: [
      localText(locale, `Gleichung: ${denominations[0]}a + ${denominations[1]}b + ${denominations[2]}c = ${total}, mit a,b,c ≥ 1`, `Equation: ${denominations[0]}a + ${denominations[1]}b + ${denominations[2]}c = ${total}, with a,b,c ≥ 1`, `Equazione: ${denominations[0]}a + ${denominations[1]}b + ${denominations[2]}c = ${total}, con a,b,c ≥ 1`, `Ecuación: ${denominations[0]}a + ${denominations[1]}b + ${denominations[2]}c = ${total}, con a,b,c ≥ 1`),
      ...solutions.map((solution) => `${denominations[0]}·${solution[0]} + ${denominations[1]}·${solution[1]} + ${denominations[2]}·${solution[2]} = ${total}`),
    ],
    visual: {
      kind: "coin-combinations",
      values: [...denominations, total, solutions.length],
      labels: ["a", "b", "c"],
    },
  }
}

function generateAreaFraction(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const columns = pick(random, [6, 8, 10])
  const rows = pick(random, [4, 6])
  const capacity = Math.floor(columns / 2) * Math.floor(rows / 2)
  const largeCount = 1 + pickIndex(random, Math.max(1, capacity - 1))
  const model = buildAreaFractionModel(columns, rows, largeCount)
  const { totalCells, greyCells, whiteCells, numerator, denominator } = model

  return {
    id,
    topicId: "area-fractions",
    prompt: localText(locale, `Der Boden im Diagramm ist ${columns} kleine Quadrate breit und ${rows} hoch. Die grauen 2×2-Platten bedecken je vier kleine Quadrate. Welcher vollständig gekürzte Bruchteil der Fläche ist weiss?`, `The floor in the diagram is ${columns} small squares wide and ${rows} high. Each grey 2×2 tile covers four small squares. What fully simplified fraction of the area is white?`, `Il pavimento nel diagramma è largo ${columns} quadratini e alto ${rows}. Ogni piastrella grigia 2×2 copre quattro quadratini. Quale frazione, ridotta ai minimi termini, dell'area è bianca?`, `El suelo del diagrama mide ${columns} cuadrados pequeños de ancho y ${rows} de alto. Cada baldosa gris de 2×2 cubre cuatro cuadrados pequeños. ¿Qué fracción completamente simplificada del área es blanca?`),
    answerLabel: localText(locale, "Weisser Flächenanteil", "White fraction of the area", "Frazione bianca dell'area", "Fracción blanca del área"),
    response: { kind: "fraction", numerator, denominator, requireSimplified: true },
    hint: localText(locale, "Zähle zuerst die gesamte Fläche und die von den grossen Platten bedeckten Einheitsquadrate.", "First count the total area and the unit squares covered by the large tiles.", "Conta prima l'area totale e i quadrati unitari coperti dalle piastrelle grandi.", "Cuenta primero el área total y los cuadrados unidad cubiertos por las baldosas grandes."),
    easierExplanation: localText(locale, `Insgesamt gibt es ${totalCells} Einheitsquadrate. Die ${largeCount} grauen Platten bedecken ${largeCount} · 4 = ${greyCells} davon.`, `There are ${totalCells} unit squares altogether. The ${largeCount} grey tiles cover ${largeCount} · 4 = ${greyCells} of them.`, `In totale ci sono ${totalCells} quadrati unitari. Le ${largeCount} piastrelle grigie ne coprono ${largeCount} · 4 = ${greyCells}.`, `Hay ${totalCells} cuadrados unidad en total. Las ${largeCount} baldosas grises cubren ${largeCount} · 4 = ${greyCells} de ellos.`),
    explanation: localText(locale, `${totalCells} − ${greyCells} = ${whiteCells} weisse Einheiten; ${whiteCells}/${totalCells} = ${numerator}/${denominator}.`, `${totalCells} − ${greyCells} = ${whiteCells} white units; ${whiteCells}/${totalCells} = ${numerator}/${denominator}.`, `${totalCells} − ${greyCells} = ${whiteCells} unità bianche; ${whiteCells}/${totalCells} = ${numerator}/${denominator}.`, `${totalCells} − ${greyCells} = ${whiteCells} unidades blancas; ${whiteCells}/${totalCells} = ${numerator}/${denominator}.`),
    workedSteps: [
      localText(locale, `${columns} · ${rows} = ${totalCells} Einheitsquadrate`, `${columns} · ${rows} = ${totalCells} unit squares`, `${columns} · ${rows} = ${totalCells} quadrati unitari`, `${columns} · ${rows} = ${totalCells} cuadrados unidad`),
      localText(locale, `${largeCount} · 4 = ${greyCells} graue Einheiten`, `${largeCount} · 4 = ${greyCells} grey units`, `${largeCount} · 4 = ${greyCells} unità grigie`, `${largeCount} · 4 = ${greyCells} unidades grises`),
      localText(locale, `${totalCells} − ${greyCells} = ${whiteCells} weisse Einheiten`, `${totalCells} − ${greyCells} = ${whiteCells} white units`, `${totalCells} − ${greyCells} = ${whiteCells} unità bianche`, `${totalCells} − ${greyCells} = ${whiteCells} unidades blancas`),
      localText(locale, `${whiteCells}/${totalCells} vollständig gekürzt = ${numerator}/${denominator}`, `${whiteCells}/${totalCells} fully simplified = ${numerator}/${denominator}`, `${whiteCells}/${totalCells} ridotto ai minimi termini = ${numerator}/${denominator}`, `${whiteCells}/${totalCells} completamente simplificado = ${numerator}/${denominator}`),
    ],
    visual: { kind: "tile-grid", columns, rows, cells: model.coveredCells, values: [largeCount] },
  }
}

function generateTilingCosts(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const columns = pick(random, [5, 6, 7, 8, 9, 10])
  const rows = pick(random, [3, 4, 5, 6, 7])
  const smallCost = pick(random, [4, 5, 6])
  const largeCost = 4 * smallCost - pick(random, [3, 5, 7])
  const model = buildTilingCostModel(columns, rows, smallCost, largeCost)
  const { largeCount, smallCount, totalCost } = model

  return {
    id,
    topicId: "tiling-costs",
    prompt: localText(locale, `Ein rechteckiger Boden ist ${columns}×${rows} Einheitsquadrate gross. Eine 1×1-Platte kostet ${smallCost} Fr., eine 2×2-Platte ${largeCost} Fr. Wie viel kostet die günstigste vollständige Belegung?`, `A rectangular floor measures ${columns}×${rows} unit squares. A 1×1 tile costs ${smallCost} Fr. and a 2×2 tile costs ${largeCost} Fr. What is the lowest possible cost for covering the whole floor?`, `Un pavimento rettangolare misura ${columns}×${rows} quadrati unitari. Una piastrella 1×1 costa ${smallCost} Fr. e una piastrella 2×2 costa ${largeCost} Fr. Qual è il costo minimo per ricoprire completamente il pavimento?`, `Un suelo rectangular mide ${columns}×${rows} cuadrados unidad. Una baldosa de 1×1 cuesta ${smallCost} Fr. y una de 2×2 cuesta ${largeCost} Fr. ¿Cuál es el menor coste posible para cubrir todo el suelo?`),
    answerLabel: localText(locale, "Günstigster Preis", "Lowest price", "Prezzo minimo", "Precio mínimo"),
    response: { kind: "number", value: totalCost, decimals: 0, unit: "Fr." },
    hint: localText(locale, `Vier kleine Platten kosten ${4 * smallCost} Fr. Vergleiche das mit einer grossen Platte.`, `Four small tiles cost ${4 * smallCost} Fr. Compare that with one large tile.`, `Quattro piastrelle piccole costano ${4 * smallCost} Fr. Confronta questo prezzo con quello di una piastrella grande.`, `Cuatro baldosas pequeñas cuestan ${4 * smallCost} Fr. Compáralo con una baldosa grande.`),
    easierExplanation: localText(locale, `Es passen ${Math.floor(columns / 2)} grosse Platten nebeneinander und ${Math.floor(rows / 2)} Reihen davon hinein.`, `${Math.floor(columns / 2)} large tiles fit side by side, with ${Math.floor(rows / 2)} rows of them.`, `Entrano ${Math.floor(columns / 2)} piastrelle grandi affiancate e ${Math.floor(rows / 2)} file di queste piastrelle.`, `Caben ${Math.floor(columns / 2)} baldosas grandes una junto a otra y ${Math.floor(rows / 2)} filas de ellas.`),
    explanation: localText(locale, `${largeCount} grosse und ${smallCount} kleine Platten kosten ${largeCount} · ${largeCost} + ${smallCount} · ${smallCost} = ${totalCost} Fr.`, `${largeCount} large and ${smallCount} small tiles cost ${largeCount} · ${largeCost} + ${smallCount} · ${smallCost} = ${totalCost} Fr.`, `${largeCount} piastrelle grandi e ${smallCount} piccole costano ${largeCount} · ${largeCost} + ${smallCount} · ${smallCost} = ${totalCost} Fr.`, `${largeCount} baldosas grandes y ${smallCount} pequeñas cuestan ${largeCount} · ${largeCost} + ${smallCount} · ${smallCost} = ${totalCost} Fr.`),
    workedSteps: [
      localText(locale, `4 kleine Platten: 4 · ${smallCost} = ${4 * smallCost} Fr. > ${largeCost} Fr.`, `4 small tiles: 4 · ${smallCost} = ${4 * smallCost} Fr. > ${largeCost} Fr.`, `4 piastrelle piccole: 4 · ${smallCost} = ${4 * smallCost} Fr. > ${largeCost} Fr.`, `4 baldosas pequeñas: 4 · ${smallCost} = ${4 * smallCost} Fr. > ${largeCost} Fr.`),
      localText(locale, `${Math.floor(columns / 2)} · ${Math.floor(rows / 2)} = ${largeCount} grosse Platten`, `${Math.floor(columns / 2)} · ${Math.floor(rows / 2)} = ${largeCount} large tiles`, `${Math.floor(columns / 2)} · ${Math.floor(rows / 2)} = ${largeCount} piastrelle grandi`, `${Math.floor(columns / 2)} · ${Math.floor(rows / 2)} = ${largeCount} baldosas grandes`),
      localText(locale, `${columns * rows} − 4 · ${largeCount} = ${smallCount} kleine Platten`, `${columns * rows} − 4 · ${largeCount} = ${smallCount} small tiles`, `${columns * rows} − 4 · ${largeCount} = ${smallCount} piastrelle piccole`, `${columns * rows} − 4 · ${largeCount} = ${smallCount} baldosas pequeñas`),
      `${largeCount} · ${largeCost} + ${smallCount} · ${smallCost} = ${totalCost} Fr.`,
    ],
    visual: {
      kind: "tile-grid",
      columns,
      rows,
      cells: model.placements.flatMap((placement) => placement.cells),
      values: [smallCost, largeCost],
    },
  }
}

interface InverseCandidate {
  originalPersons: number
  originalDays: number
  newPersons: number
  newDays: number
}

function inverseCandidates(): InverseCandidate[] {
  const results: InverseCandidate[] = []
  for (const originalPersons of [24, 30, 36, 40, 48, 60]) {
    for (const originalDays of [18, 20, 24, 30, 36]) {
      const personDays = originalPersons * originalDays
      for (const newPersons of [12, 15, 18, 20, 24, 30, 32, 36, 40]) {
        if (newPersons >= originalPersons || personDays % newPersons !== 0) continue
        const newDays = personDays / newPersons
        if (newDays - originalDays > 4 && newDays <= 90) {
          results.push({ originalPersons, originalDays, newPersons, newDays })
        }
      }
    }
  }
  return results
}

const inverseCases = inverseCandidates()

function generateInverseProportion(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = inverseCases[pickIndex(random, inverseCases.length)]!
  const { originalPersons, originalDays, newPersons, newDays } = candidate
  const personDays = originalPersons * originalDays
  const longer = newDays - originalDays

  return {
    id,
    topicId: "inverse-proportion",
    prompt: localText(locale, `Ein Vorrat reicht für ${originalPersons} Personen ${originalDays} Tage. Wie viele Tage länger reicht derselbe Vorrat, wenn nur ${newPersons} Personen da sind?`, `A supply lasts ${originalPersons} people for ${originalDays} days. How many days longer will the same supply last if only ${newPersons} people are present?`, `Una scorta basta per ${originalPersons} persone per ${originalDays} giorni. Per quanti giorni in più basta la stessa scorta se sono presenti soltanto ${newPersons} persone?`, `Una provisión alcanza para ${originalPersons} personas durante ${originalDays} días. ¿Cuántos días más durará la misma provisión si solo hay ${newPersons} personas?`),
    answerLabel: localText(locale, "Der Vorrat reicht länger um", "The supply lasts longer by", "La scorta dura in più", "La provisión dura más"),
    response: { kind: "number", value: longer, decimals: 0, unit: localText(locale, "Tage", "days", "giorni", "días") },
    hint: localText(locale, "Berechne zuerst die gesamte Anzahl Personentage.", "First calculate the total number of person-days.", "Calcola prima il numero totale di giornate-persona.", "Calcula primero el número total de personas-día."),
    easierExplanation: localText(locale, `${originalPersons} · ${originalDays} beschreibt den ganzen Vorrat. Teile danach durch ${newPersons}.`, `${originalPersons} · ${originalDays} represents the entire supply. Then divide by ${newPersons}.`, `${originalPersons} · ${originalDays} rappresenta l'intera scorta. Dividi poi per ${newPersons}.`, `${originalPersons} · ${originalDays} representa toda la provisión. Divide después entre ${newPersons}.`),
    explanation: localText(locale, `${personDays} : ${newPersons} = ${newDays} Tage insgesamt; ${newDays} − ${originalDays} = ${longer} Tage länger.`, `${personDays} ÷ ${newPersons} = ${newDays} days in total; ${newDays} − ${originalDays} = ${longer} days longer.`, `${personDays} ÷ ${newPersons} = ${newDays} giorni in totale; ${newDays} − ${originalDays} = ${longer} giorni in più.`, `${personDays} ÷ ${newPersons} = ${newDays} días en total; ${newDays} − ${originalDays} = ${longer} días más.`),
    workedSteps: [
      localText(locale, `${originalPersons} · ${originalDays} = ${personDays} Personentage`, `${originalPersons} · ${originalDays} = ${personDays} person-days`, `${originalPersons} · ${originalDays} = ${personDays} giornate-persona`, `${originalPersons} · ${originalDays} = ${personDays} personas-día`),
      localText(locale, `${personDays} : ${newPersons} = ${newDays} Tage`, `${personDays} ÷ ${newPersons} = ${newDays} days`, `${personDays} ÷ ${newPersons} = ${newDays} giorni`, `${personDays} ÷ ${newPersons} = ${newDays} días`),
      localText(locale, `${newDays} − ${originalDays} = ${longer} Tage länger`, `${newDays} − ${originalDays} = ${longer} days longer`, `${newDays} − ${originalDays} = ${longer} giorni in più`, `${newDays} − ${originalDays} = ${longer} días más`),
    ],
    visual: {
      kind: "supply",
      values: [originalPersons, originalDays, newPersons],
      labels: locale === "en" ? ["people before", "days before", "people now"] : locale === "it" ? ["persone prima", "giorni prima", "persone ora"] : locale === "es" ? ["personas antes", "días antes", "personas ahora"] : ["Personen vorher", "Tage vorher", "Personen neu"],
    },
  }
}

interface ChangingRateCandidate {
  originalPersons: number
  originalDays: number
  phaseDays: number
  newPersons: number
  remainingDays: number
}

function changingRateCandidates(): ChangingRateCandidate[] {
  const results: ChangingRateCandidate[] = []
  for (const originalPersons of [20, 24, 30, 36, 40, 48]) {
    for (const originalDays of [24, 30, 36, 40, 48]) {
      for (const phaseDays of [6, 8, 10, 12, 15]) {
        if (phaseDays >= originalDays) continue
        const remainingPersonDays = originalPersons * (originalDays - phaseDays)
        for (const newPersons of [18, 20, 24, 30, 32, 36, 40, 45, 48]) {
          if (newPersons === originalPersons || remainingPersonDays % newPersons !== 0) continue
          const remainingDays = remainingPersonDays / newPersons
          if (remainingDays >= 6 && remainingDays <= 72) {
            results.push({ originalPersons, originalDays, phaseDays, newPersons, remainingDays })
          }
        }
      }
    }
  }
  return results
}

const changingCases = changingRateCandidates()

function generateChangingRates(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = changingCases[pickIndex(random, changingCases.length)]!
  const { originalPersons, originalDays, phaseDays, newPersons, remainingDays } = candidate
  const totalPersonDays = originalPersons * originalDays
  const usedPersonDays = originalPersons * phaseDays
  const remainingPersonDays = totalPersonDays - usedPersonDays
  const change = newPersons - originalPersons
  const changeClause = change > 0
    ? localText(locale, `kommen ${change} Personen hinzu`, `${change} more people arrive`, `arrivano altre ${change} persone`, `llegan ${change} personas más`)
    : localText(locale, `verlassen ${Math.abs(change)} Personen die Station`, `${Math.abs(change)} people leave the station`, `${Math.abs(change)} persone lasciano la stazione`, `${Math.abs(change)} personas abandonan la estación`)

  return {
    id,
    topicId: "changing-rates",
    prompt: localText(locale, `Ein voller Vorrat reicht für ${originalPersons} Personen ${originalDays} Tage. Nach ${phaseDays} Tagen ${changeClause}. Wie viele Tage reicht der verbleibende Vorrat ab diesem Zeitpunkt?`, `A full supply lasts ${originalPersons} people for ${originalDays} days. After ${phaseDays} days, ${changeClause}. How many days will the remaining supply last from that point?`, `Una scorta completa basta per ${originalPersons} persone per ${originalDays} giorni. Dopo ${phaseDays} giorni ${changeClause}. Per quanti giorni basterà da quel momento la scorta rimanente?`, `Una provisión completa alcanza para ${originalPersons} personas durante ${originalDays} días. Después de ${phaseDays} días, ${changeClause}. ¿Cuántos días durará la provisión restante a partir de ese momento?`),
    answerLabel: localText(locale, "Verbleibende Dauer", "Remaining duration", "Durata rimanente", "Duración restante"),
    response: { kind: "number", value: remainingDays, decimals: 0, unit: localText(locale, "Tage", "days", "giorni", "días") },
    hint: localText(locale, `Ziehe zuerst den Verbrauch der ersten ${phaseDays} Tage in Personentagen ab.`, `First subtract the first ${phaseDays} days of consumption in person-days.`, `Sottrai prima il consumo dei primi ${phaseDays} giorni espresso in giornate-persona.`, `Resta primero el consumo de los primeros ${phaseDays} días expresado en personas-día.`),
    easierExplanation: localText(locale, `Gesamt: ${totalPersonDays} Personentage. Verbraucht: ${originalPersons} · ${phaseDays} = ${usedPersonDays}.`, `Total: ${totalPersonDays} person-days. Used: ${originalPersons} · ${phaseDays} = ${usedPersonDays}.`, `Totale: ${totalPersonDays} giornate-persona. Consumate: ${originalPersons} · ${phaseDays} = ${usedPersonDays}.`, `Total: ${totalPersonDays} personas-día. Consumidas: ${originalPersons} · ${phaseDays} = ${usedPersonDays}.`),
    explanation: localText(locale, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} Personentage; ${remainingPersonDays} : ${newPersons} = ${remainingDays} Tage.`, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} person-days; ${remainingPersonDays} ÷ ${newPersons} = ${remainingDays} days.`, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} giornate-persona; ${remainingPersonDays} ÷ ${newPersons} = ${remainingDays} giorni.`, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} personas-día; ${remainingPersonDays} ÷ ${newPersons} = ${remainingDays} días.`),
    workedSteps: [
      localText(locale, `${originalPersons} · ${originalDays} = ${totalPersonDays} Personentage`, `${originalPersons} · ${originalDays} = ${totalPersonDays} person-days`, `${originalPersons} · ${originalDays} = ${totalPersonDays} giornate-persona`, `${originalPersons} · ${originalDays} = ${totalPersonDays} personas-día`),
      localText(locale, `${originalPersons} · ${phaseDays} = ${usedPersonDays} Personentage verbraucht`, `${originalPersons} · ${phaseDays} = ${usedPersonDays} person-days used`, `${originalPersons} · ${phaseDays} = ${usedPersonDays} giornate-persona consumate`, `${originalPersons} · ${phaseDays} = ${usedPersonDays} personas-día consumidas`),
      localText(locale, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} Personentage übrig`, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} person-days remaining`, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} giornate-persona rimanenti`, `${totalPersonDays} − ${usedPersonDays} = ${remainingPersonDays} personas-día restantes`),
      localText(locale, `${remainingPersonDays} : ${newPersons} = ${remainingDays} Tage`, `${remainingPersonDays} ÷ ${newPersons} = ${remainingDays} days`, `${remainingPersonDays} ÷ ${newPersons} = ${remainingDays} giorni`, `${remainingPersonDays} ÷ ${newPersons} = ${remainingDays} días`),
    ],
    visual: {
      kind: "supply",
      values: [originalPersons, originalDays, phaseDays, newPersons],
      labels: locale === "en"
        ? ["people first", "days planned", "days elapsed", "people afterwards"]
        : locale === "it"
          ? ["persone all'inizio", "giorni previsti", "giorni trascorsi", "persone dopo"]
          : locale === "es"
            ? ["personas al principio", "días previstos", "días transcurridos", "personas después"]
          : ["Personen zuerst", "Tage geplant", "Tage vergangen", "Personen danach"],
    },
  }
}

function generateGeometricLocus(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const distance = pick(random, [2, 3, 4, 5])
  const scenarioIndex = pickIndex(random, 3)
  const width = 640
  const height = 360
  const pixelsPerCentimeter = 24
  const tolerance = Number((pixelsPerCentimeter * 0.2).toFixed(4))
  const snap = Number((pixelsPerCentimeter * 0.1).toFixed(4))
  const initialDirection = random() > 0.5 ? 1 : -1
  let prompt: string
  let value: "parallel" | "circle" | "bisector"
  let explanation: string
  let hint: string
  let geometryConstruction: GeometryConstructionSpec

  if (scenarioIndex === 0) {
    const roadY = pick(random, [264, 288, 312])
    const targetParameter = roadY - distance * pixelsPerCentimeter
    const minParameter = 48
    const maxParameter = roadY - pixelsPerCentimeter
    const initialParameter = Math.min(
      maxParameter,
      Math.max(minParameter, targetParameter + initialDirection * pixelsPerCentimeter),
    )
    prompt = localText(locale, `Das erlaubte Gebiet liegt nördlich der Geraden s. Seine Grenze hat überall genau ${distance} cm Abstand zu s. Konstruiere diese Grenze.`, `The permitted region lies north of line s. Every point on its boundary is exactly ${distance} cm from s. Construct this boundary.`, `La regione consentita si trova a nord della retta s. Ogni punto del suo confine dista esattamente ${distance} cm da s. Costruisci questo confine.`, `La región permitida está al norte de la recta s. Todos los puntos de su frontera están exactamente a ${distance} cm de s. Construye esa frontera.`)
    value = "parallel"
    explanation = localText(locale, `Eine Parallele nördlich von s im senkrechten Abstand ${distance} cm bildet die Grenze.`, `The boundary is a line parallel to s, ${distance} cm north of it measured perpendicularly.`, `Il confine è una retta parallela a s, situata ${distance} cm a nord e misurata perpendicolarmente.`, `La frontera es una recta paralela a s, situada ${distance} cm al norte y medida perpendicularmente.`)
    hint = localText(locale, "Gesucht sind Punkte mit einem festen Abstand von einer Geraden.", "You are looking for points at a fixed distance from a line.", "Cerchi i punti che si trovano a una distanza fissa da una retta.", "Buscas los puntos que están a una distancia fija de una recta.")
    geometryConstruction = {
      expectedTool: "parallel",
      width,
      height,
      pixelsPerCentimeter,
      targetParameter,
      initialParameter,
      minParameter,
      maxParameter,
      snap,
      tolerance,
      distanceCentimeters: distance,
      reference: {
        kind: "line",
        y: roadY,
        label: "s",
        allowedSide: "north",
      },
    }
  } else if (scenarioIndex === 1) {
    const point = {
      x: pick(random, [250, 320, 390]),
      y: pick(random, [170, 190]),
      label: "F",
    }
    const targetParameter = distance * pixelsPerCentimeter
    const minParameter = pixelsPerCentimeter
    const maxParameter = 132
    const initialParameter = Math.min(
      maxParameter,
      Math.max(minParameter, targetParameter + initialDirection * pixelsPerCentimeter),
    )
    prompt = localText(locale, `Alle erlaubten Punkte liegen höchstens ${distance} cm vom Punkt F entfernt. Konstruiere die Grenze des Gebiets.`, `Every permitted point is at most ${distance} cm from point F. Construct the boundary of the region.`, `Tutti i punti consentiti distano al massimo ${distance} cm dal punto F. Costruisci il confine della regione.`, `Todos los puntos permitidos están como máximo a ${distance} cm del punto F. Construye la frontera de la región.`)
    value = "circle"
    explanation = localText(locale, `Ein Kreis um F mit Radius ${distance} cm ist die Grenze; erlaubt ist sein Inneres.`, `A circle centred at F with radius ${distance} cm is the boundary; its interior is permitted.`, `Una circonferenza con centro F e raggio ${distance} cm è il confine; la parte interna è consentita.`, `Un círculo con centro F y radio ${distance} cm es la frontera; su interior está permitido.`)
    hint = localText(locale, "Gesucht sind Punkte mit einem festen Abstand von einem Punkt.", "You are looking for points at a fixed distance from one point.", "Cerchi i punti che si trovano a una distanza fissa da un punto.", "Buscas los puntos que están a una distancia fija de un punto.")
    geometryConstruction = {
      expectedTool: "circle",
      width,
      height,
      pixelsPerCentimeter,
      targetParameter,
      initialParameter,
      minParameter,
      maxParameter,
      snap,
      tolerance,
      distanceCentimeters: distance,
      reference: { kind: "point", point },
    }
  } else {
    const midpointX = pick(random, [260, 320, 380])
    const pointY = pick(random, [180, 216])
    const pointDistance = pick(random, [4, 6, 8])
    const halfDistance = pointDistance * pixelsPerCentimeter / 2
    const minParameter = 80
    const maxParameter = 560
    const initialParameter = Math.min(
      maxParameter,
      Math.max(minParameter, midpointX + initialDirection * pixelsPerCentimeter * 2),
    )
    prompt = localText(locale, "Konstruiere die Grenze zwischen allen Punkten, die näher bei B₁ liegen, und allen Punkten, die näher bei B₂ liegen.", "Construct the boundary between all points closer to B₁ and all points closer to B₂.", "Costruisci il confine tra tutti i punti più vicini a B₁ e tutti i punti più vicini a B₂.", "Construye la frontera entre todos los puntos más cercanos a B₁ y todos los puntos más cercanos a B₂.")
    value = "bisector"
    explanation = localText(locale, "Die Mittelsenkrechte von B₁B₂ enthält alle gleich weit entfernten Punkte und trennt damit die beiden Seiten.", "The perpendicular bisector of B₁B₂ contains all points equidistant from B₁ and B₂, so it separates the two sides.", "L'asse del segmento B₁B₂ contiene tutti i punti equidistanti da B₁ e B₂ e separa quindi le due zone.", "La mediatriz de B₁B₂ contiene todos los puntos equidistantes de B₁ y B₂, por lo que separa los dos lados.")
    hint = localText(locale, "Suche zuerst die Punkte, die von B₁ und B₂ genau gleich weit entfernt sind.", "First find the points that are exactly the same distance from B₁ and B₂.", "Trova prima i punti che hanno esattamente la stessa distanza da B₁ e B₂.", "Halla primero los puntos que están exactamente a la misma distancia de B₁ y B₂.")
    geometryConstruction = {
      expectedTool: "bisector",
      width,
      height,
      pixelsPerCentimeter,
      targetParameter: midpointX,
      initialParameter,
      minParameter,
      maxParameter,
      snap,
      tolerance,
      reference: {
        kind: "point-pair",
        first: { x: midpointX - halfDistance, y: pointY, label: "B₁" },
        second: { x: midpointX + halfDistance, y: pointY, label: "B₂" },
      },
    }
  }
  const options = shuffle(random, locale === "en" ? [
    { id: "parallel", label: "A line parallel to the given line" },
    { id: "circle", label: "A circle centred at the point" },
    { id: "bisector", label: "The perpendicular bisector of the segment" },
    { id: "angle", label: "An angle bisector" },
  ] : locale === "it" ? [
    { id: "parallel", label: "Una retta parallela alla retta data" },
    { id: "circle", label: "Una circonferenza con centro nel punto" },
    { id: "bisector", label: "L'asse del segmento" },
    { id: "angle", label: "La bisettrice di un angolo" },
  ] : locale === "es" ? [
    { id: "parallel", label: "Una recta paralela a la recta dada" },
    { id: "circle", label: "Un círculo con centro en el punto" },
    { id: "bisector", label: "La mediatriz del segmento" },
    { id: "angle", label: "La bisectriz de un ángulo" },
  ] : [
    { id: "parallel", label: "Eine Parallele zur Geraden" },
    { id: "circle", label: "Ein Kreis um den Punkt" },
    { id: "bisector", label: "Die Mittelsenkrechte der Punktstrecke" },
    { id: "angle", label: "Eine Winkelhalbierende" },
  ])

  return {
    id,
    topicId: "geometric-loci",
    prompt,
    answerLabel: localText(locale, "Passende Konstruktion", "Matching construction", "Costruzione adatta", "Construcción adecuada"),
    response: { kind: "choice", value, options },
    hint,
    easierExplanation: localText(locale, "Übersetze die Bedingung in die Frage: Abstand von einer Geraden, von einem Punkt oder Vergleich zweier Punkte?", "Translate the condition into a question: distance from a line, distance from a point, or comparison of two points?", "Trasforma la condizione in una domanda: distanza da una retta, distanza da un punto oppure confronto tra due punti?", "Convierte la condición en una pregunta: ¿distancia a una recta, distancia a un punto o comparación de dos puntos?"),
    explanation,
    workedSteps: [hint, explanation],
    geometryConstruction,
    visual: { kind: "locus", values: [distance], labels: ["s", "F", "B₁", "B₂"] },
  }
}

function shuffle<T>(random: () => number, values: readonly T[]): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = pickIndex(random, index + 1)
    ;[result[index], result[target]] = [result[target]!, result[index]!]
  }
  return result
}

function shuffledFaces(random: () => number): number[] {
  const faces = [1, 2, 3, 4]
  for (let index = faces.length - 1; index > 0; index -= 1) {
    const target = pickIndex(random, index + 1)
    ;[faces[index], faces[target]] = [faces[target]!, faces[index]!]
  }
  return faces
}

function generateSpatialRolling(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const [bottom, left, right, back] = shuffledFaces(random)
  const orientation = { bottom: bottom!, left: left!, right: right!, back: back! }
  const directions = ["left", "right", "back"] as const
  const directionLabels = locale === "en"
    ? { left: "left", right: "right", back: "back" } as const
    : locale === "it"
      ? { left: "sinistra", right: "destra", back: "indietro" } as const
      : locale === "es"
        ? { left: "izquierda", right: "derecha", back: "atrás" } as const
      : { left: "links", right: "rechts", back: "hinten" } as const
  const edgeLabels = locale === "en"
    ? { left: "left", right: "right", back: "back" } as const
    : locale === "it"
      ? { left: "sinistro", right: "destro", back: "posteriore" } as const
      : locale === "es"
        ? { left: "izquierda", right: "derecha", back: "posterior" } as const
      : { left: "linke", right: "rechte", back: "hintere" } as const
  const variant = random()
  const options = [1, 2, 3, 4].map((face) => ({ id: String(face), label: localText(locale, `Fläche ${face}`, `Face ${face}`, `Faccia ${face}`, `Cara ${face}`) }))

  if (variant < 0.3) {
    const answer = findMissingPyramidFace([orientation.bottom, orientation.right, orientation.back])
    return {
      id,
      topicId: "spatial-rolling",
      prompt: localText(locale, `Eine Pyramide hat die Flächen 1, 2, 3 und 4. Sie steht auf ${bottom}; die hintere Fläche ist ${back} und rechts siehst du ${right}. Welche Zahl muss links stehen?`, `A pyramid has faces 1, 2, 3 and 4. It stands on ${bottom}; its back face is ${back}, and face ${right} is on the right. Which number must be on the left?`, `Una piramide ha le facce 1, 2, 3 e 4. Poggia sulla faccia ${bottom}; dietro c'è la faccia ${back} e a destra la faccia ${right}. Quale numero deve trovarsi a sinistra?`, `Una pirámide tiene las caras 1, 2, 3 y 4. Se apoya sobre ${bottom}; la cara posterior es ${back} y a la derecha ves ${right}. ¿Qué número debe estar a la izquierda?`),
      answerLabel: localText(locale, "Linke Fläche", "Left face", "Faccia sinistra", "Cara izquierda"),
      response: { kind: "choice", value: String(answer), options },
      hint: localText(locale, "Jede der vier Zahlen kommt genau einmal vor.", "Each of the four numbers appears exactly once.", "Ognuno dei quattro numeri compare esattamente una volta.", "Cada uno de los cuatro números aparece exactamente una vez."),
      easierExplanation: localText(locale, `Streiche ${bottom}, ${back} und ${right} aus der Liste 1, 2, 3, 4.`, `Cross out ${bottom}, ${back} and ${right} from the list 1, 2, 3, 4.`, `Elimina ${bottom}, ${back} e ${right} dall'elenco 1, 2, 3, 4.`, `Tacha ${bottom}, ${back} y ${right} de la lista 1, 2, 3, 4.`),
      explanation: localText(locale, `Die einzige noch nicht verwendete Fläche ist ${left}.`, `The only unused face is ${left}.`, `L'unica faccia non ancora usata è la ${left}.`, `La única cara que todavía no se ha usado es ${left}.`),
      workedSteps: [localText(locale, `verwendet: ${bottom}, ${back}, ${right}`, `used: ${bottom}, ${back}, ${right}`, `usate: ${bottom}, ${back}, ${right}`, `usadas: ${bottom}, ${back}, ${right}`), localText(locale, `übrig: ${left}`, `remaining: ${left}`, `rimane: ${left}`, `queda: ${left}`)],
      visual: {
        kind: "pyramid",
        values: [orientation.bottom, orientation.left, orientation.right, orientation.back],
        labels: locale === "en" ? ["bottom", "unknown", "right", "back"] : locale === "it" ? ["base", "incognita", "destra", "dietro"] : locale === "es" ? ["base", "desconocida", "derecha", "atrás"] : ["unten", "gesucht", "rechts", "hinten"],
        arrows: [],
      },
    }
  }

  if (variant < 0.62) {
    const direction = pick(random, directions)
    const model = buildPyramidRollModel(orientation, direction)
    const label = directionLabels[direction]
    return {
      id,
      topicId: "spatial-rolling",
      prompt: localText(locale, `Eine dreiseitige Pyramide steht auf Fläche ${bottom}. Links siehst du ${left}, rechts ${right}, hinten liegt ${back}. Sie kippt über die ${edgeLabels[direction]} Grundkante. Auf welcher Fläche steht sie danach?`, `A triangular pyramid stands on face ${bottom}. Face ${left} is on the left, ${right} on the right and ${back} at the back. It tips over its ${edgeLabels[direction]} base edge. Which face does it stand on afterwards?`, `Una piramide triangolare poggia sulla faccia ${bottom}. A sinistra vedi ${left}, a destra ${right} e dietro ${back}. Si ribalta oltre il bordo ${edgeLabels[direction]} della base. Su quale faccia poggia dopo il ribaltamento?`, `Una pirámide triangular se apoya sobre la cara ${bottom}. A la izquierda ves ${left}, a la derecha ${right} y atrás ${back}. Vuelca sobre la arista ${edgeLabels[direction]} de la base. ¿Sobre qué cara se apoya después?`),
      answerLabel: localText(locale, "Neue Grundfläche", "New base face", "Nuova faccia di base", "Nueva cara de base"),
      response: { kind: "choice", value: String(model.newBottom), options },
      hint: localText(locale, "Die Seitenfläche direkt hinter der Kippkante wird zur neuen Grundfläche.", "The side face directly beyond the tipping edge becomes the new base face.", "La faccia laterale subito oltre il bordo di ribaltamento diventa la nuova base.", "La cara lateral justo al otro lado de la arista de vuelco se convierte en la nueva base."),
      easierExplanation: localText(locale, `Die Pyramide kippt in Richtung der Fläche ${model.newBottom}. Diese Fläche landet unten.`, `The pyramid tips towards face ${model.newBottom}. That face lands on the bottom.`, `La piramide si ribalta verso la faccia ${model.newBottom}. Questa faccia finisce in basso.`, `La pirámide vuelca hacia la cara ${model.newBottom}. Esa cara queda abajo.`),
      explanation: localText(locale, `Beim Kippen über die ${edgeLabels[direction]} Kante wird Fläche ${model.newBottom} zur Grundfläche. Die alte Grundfläche kommt an diese Kante; die beiden übrigen Seiten tauschen ihre Positionen.`, `When the pyramid tips over its ${edgeLabels[direction]} edge, face ${model.newBottom} becomes the base. The old base moves to that edge, and the other two sides exchange positions.`, `Ribaltandosi oltre il bordo ${edgeLabels[direction]}, la faccia ${model.newBottom} diventa la base. La vecchia base si sposta su quel lato e le altre due facce si scambiano di posizione.`, `Al volcar sobre la arista ${edgeLabels[direction]}, la cara ${model.newBottom} se convierte en la base. La base anterior pasa a esa arista y las otras dos caras intercambian posiciones.`),
      workedSteps: [
        localText(locale, `Kippkante: ${label}`, `Tipping edge: ${label}`, `Bordo di ribaltamento: ${label}`, `Arista de vuelco: ${label}`),
        localText(locale, `neue Grundfläche: ${model.newBottom}`, `new base face: ${model.newBottom}`, `nuova faccia di base: ${model.newBottom}`, `nueva cara de base: ${model.newBottom}`),
        localText(locale, `neue Seiten: links ${model.nextOrientation.left}, rechts ${model.nextOrientation.right}, hinten ${model.nextOrientation.back}`, `new sides: left ${model.nextOrientation.left}, right ${model.nextOrientation.right}, back ${model.nextOrientation.back}`, `nuove facce: sinistra ${model.nextOrientation.left}, destra ${model.nextOrientation.right}, dietro ${model.nextOrientation.back}`, `caras nuevas: izquierda ${model.nextOrientation.left}, derecha ${model.nextOrientation.right}, atrás ${model.nextOrientation.back}`),
      ],
      visual: {
        kind: "pyramid",
        values: [orientation.bottom, orientation.left, orientation.right, orientation.back],
        labels: locale === "en" ? ["bottom", "left", "right", "back"] : locale === "it" ? ["base", "sinistra", "destra", "dietro"] : locale === "es" ? ["base", "izquierda", "derecha", "atrás"] : ["unten", "links", "rechts", "hinten"],
        arrows: [direction],
      },
    }
  }

  const firstDirection = pick(random, directions)
  const secondDirection = pick(random, directions.filter((direction) => direction !== firstDirection))
  const rollCount = random() > 0.5 ? 4 : 3
  const pathDirections = Array.from(
    { length: rollCount },
    (_, index) => index % 2 === 0 ? firstDirection : secondDirection,
  )
  const path = buildPyramidRollPath(orientation, pathDirections)
  const directionPath = pathDirections.map((direction) => directionLabels[direction]).join(" → ")
  const supportPath = path.supportingFaces.join(" → ")

  return {
    id,
    topicId: "spatial-rolling",
    prompt: localText(locale, `Eine dreiseitige Pyramide startet mit unten ${bottom}, links ${left}, rechts ${right} und hinten ${back}. Sie kippt nacheinander ${directionPath}. Notiere die Grundfläche nach jedem Kippen in dieser Reihenfolge.`, `A triangular pyramid starts with ${bottom} on the bottom, ${left} on the left, ${right} on the right and ${back} at the back. It tips in sequence ${directionPath}. Write the base face after each tip in that order.`, `Una piramide triangolare parte con ${bottom} alla base, ${left} a sinistra, ${right} a destra e ${back} dietro. Si ribalta nella sequenza ${directionPath}. Scrivi, nello stesso ordine, la faccia di base dopo ogni ribaltamento.`, `Una pirámide triangular empieza con ${bottom} abajo, ${left} a la izquierda, ${right} a la derecha y ${back} atrás. Vuelca siguiendo la secuencia ${directionPath}. Escribe la cara de base después de cada vuelco, en ese orden.`),
    answerLabel: localText(locale, `${rollCount} Grundflächen in Wegreihenfolge`, `${rollCount} base faces in path order`, `${rollCount} facce di base nell'ordine del percorso`, `${rollCount} caras de base en el orden del recorrido`),
    response: { kind: "integer-sequence", values: path.supportingFaces },
    hint: localText(locale, "Übertrage nach jedem Kippen alle vier Positionen, bevor du den nächsten Schritt machst.", "After each tip, update all four positions before taking the next step.", "Dopo ogni ribaltamento aggiorna tutte e quattro le posizioni prima di passare al passo successivo.", "Después de cada vuelco, actualiza las cuatro posiciones antes de dar el siguiente paso."),
    easierExplanation: localText(locale, `Beim ersten Kippen nach ${directionLabels[firstDirection]} wird Fläche ${orientation[firstDirection]} unten. Die alte Grundfläche kommt an diese Kante; die beiden übrigen Seiten tauschen ihre Positionen.`, `On the first tip to the ${directionLabels[firstDirection]}, face ${orientation[firstDirection]} moves to the bottom. The old base moves to that edge, and the other two sides exchange positions.`, `Al primo ribaltamento verso ${directionLabels[firstDirection]}, la faccia ${orientation[firstDirection]} finisce alla base. La vecchia base si sposta su quel lato e le altre due facce si scambiano di posizione.`, `En el primer vuelco hacia ${directionLabels[firstDirection]}, la cara ${orientation[firstDirection]} pasa abajo. La base anterior se mueve a esa arista y las otras dos caras intercambian posiciones.`),
    explanation: localText(locale, `Die vollständige Kippfolge ergibt die Grundflächen ${supportPath}.`, `The complete tipping sequence gives the base faces ${supportPath}.`, `La sequenza completa di ribaltamenti dà le facce di base ${supportPath}.`, `La secuencia completa de vuelcos da las caras de base ${supportPath}.`),
    workedSteps: path.steps.map((step, index) => (
      localText(locale, `${index + 1}. ${directionLabels[step.direction]}: unten ${step.newBottom}; links ${step.nextOrientation.left}, rechts ${step.nextOrientation.right}, hinten ${step.nextOrientation.back}`, `${index + 1}. ${directionLabels[step.direction]}: bottom ${step.newBottom}; left ${step.nextOrientation.left}, right ${step.nextOrientation.right}, back ${step.nextOrientation.back}`, `${index + 1}. ${directionLabels[step.direction]}: base ${step.newBottom}; sinistra ${step.nextOrientation.left}, destra ${step.nextOrientation.right}, dietro ${step.nextOrientation.back}`, `${index + 1}. ${directionLabels[step.direction]}: base ${step.newBottom}; izquierda ${step.nextOrientation.left}, derecha ${step.nextOrientation.right}, atrás ${step.nextOrientation.back}`)
    )),
    visual: {
      kind: "pyramid",
      values: [orientation.bottom, orientation.left, orientation.right, orientation.back],
      labels: locale === "en" ? ["bottom", "left", "right", "back"] : locale === "it" ? ["base", "sinistra", "destra", "dietro"] : locale === "es" ? ["base", "izquierda", "derecha", "atrás"] : ["unten", "links", "rechts", "hinten"],
      arrows: pathDirections,
    },
  }
}

function generateLegacySpatialRolling(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const [bottom, left, right, back] = shuffledFaces(random)
  const orientation = { bottom: bottom!, left: left!, right: right!, back: back! }
  const askAfterRoll = random() > 0.45
  const answer = askAfterRoll
    ? buildPyramidRollModel(orientation, "right").newBottom
    : findMissingPyramidFace([orientation.bottom, orientation.right, orientation.back])
  const options = [1, 2, 3, 4].map((face) => ({ id: String(face), label: localText(locale, `Fläche ${face}`, `Face ${face}`, `Faccia ${face}`, `Cara ${face}`) }))

  return {
    id,
    topicId: "spatial-rolling",
    prompt: askAfterRoll
      ? localText(locale, `Eine dreiseitige Pyramide steht auf Fläche ${bottom}. Links siehst du ${left}, rechts ${right}, hinten liegt ${back}. Sie kippt im Bild über die rechte Grundkante. Auf welcher Fläche steht sie danach?`, `A triangular pyramid stands on face ${bottom}. Face ${left} is on the left, ${right} on the right and ${back} at the back. In the image, it tips over its right base edge. Which face does it stand on afterwards?`, `Una piramide triangolare poggia sulla faccia ${bottom}. A sinistra vedi ${left}, a destra ${right} e dietro ${back}. Nell'immagine si ribalta oltre il bordo destro della base. Su quale faccia poggia dopo?`, `Una pirámide triangular se apoya sobre la cara ${bottom}. A la izquierda ves ${left}, a la derecha ${right} y atrás ${back}. En la imagen vuelca sobre la arista derecha de la base. ¿Sobre qué cara se apoya después?`)
      : localText(locale, `Eine Pyramide hat die Flächen 1, 2, 3 und 4. Sie steht auf ${bottom}; die hintere Fläche ist ${back} und rechts siehst du ${right}. Welche Zahl muss links stehen?`, `A pyramid has faces 1, 2, 3 and 4. It stands on ${bottom}; its back face is ${back}, and face ${right} is on the right. Which number must be on the left?`, `Una piramide ha le facce 1, 2, 3 e 4. Poggia sulla faccia ${bottom}; dietro c'è la faccia ${back} e a destra la faccia ${right}. Quale numero deve trovarsi a sinistra?`, `Una pirámide tiene las caras 1, 2, 3 y 4. Se apoya sobre ${bottom}; la cara posterior es ${back} y a la derecha ves ${right}. ¿Qué número debe estar a la izquierda?`),
    answerLabel: askAfterRoll ? localText(locale, "Neue Grundfläche", "New base face", "Nuova faccia di base", "Nueva cara de base") : localText(locale, "Linke Fläche", "Left face", "Faccia sinistra", "Cara izquierda"),
    response: { kind: "choice", value: String(answer), options },
    hint: askAfterRoll
      ? localText(locale, "Die Seitenfläche direkt hinter der Kippkante wird zur neuen Grundfläche.", "The side face directly beyond the tipping edge becomes the new base face.", "La faccia laterale subito oltre il bordo di ribaltamento diventa la nuova base.", "La cara lateral justo al otro lado de la arista de vuelco se convierte en la nueva base.")
      : localText(locale, "Jede der vier Zahlen kommt genau einmal vor.", "Each of the four numbers appears exactly once.", "Ognuno dei quattro numeri compare esattamente una volta.", "Cada uno de los cuatro números aparece exactamente una vez."),
    easierExplanation: askAfterRoll
      ? localText(locale, `Die Pyramide kippt in Richtung der rechten Fläche ${right}. Diese Fläche landet unten.`, `The pyramid tips towards the right face ${right}. That face lands on the bottom.`, `La piramide si ribalta verso la faccia destra ${right}. Questa faccia finisce in basso.`, `La pirámide vuelca hacia la cara derecha ${right}. Esa cara queda abajo.`)
      : localText(locale, `Streiche ${bottom}, ${back} und ${right} aus der Liste 1, 2, 3, 4.`, `Cross out ${bottom}, ${back} and ${right} from the list 1, 2, 3, 4.`, `Elimina ${bottom}, ${back} e ${right} dall'elenco 1, 2, 3, 4.`, `Tacha ${bottom}, ${back} y ${right} de la lista 1, 2, 3, 4.`),
    explanation: askAfterRoll
      ? localText(locale, `Beim Kippen über die rechte Kante wird die rechte Fläche ${right} zur Grundfläche.`, `When it tips over the right edge, the right face ${right} becomes the base face.`, `Quando si ribalta oltre il bordo destro, la faccia destra ${right} diventa la base.`, `Al volcar sobre la arista derecha, la cara derecha ${right} se convierte en la base.`)
      : localText(locale, `Die einzige noch nicht verwendete Fläche ist ${left}.`, `The only unused face is ${left}.`, `L'unica faccia non ancora usata è la ${left}.`, `La única cara que todavía no se ha usado es ${left}.`),
    workedSteps: askAfterRoll
      ? [localText(locale, "Kippkante: rechts", "Tipping edge: right", "Bordo di ribaltamento: destra", "Arista de vuelco: derecha"), localText(locale, `angrenzende Fläche: ${right}`, `adjacent face: ${right}`, `faccia adiacente: ${right}`, `cara adyacente: ${right}`), localText(locale, `neue Grundfläche: ${right}`, `new base face: ${right}`, `nuova faccia di base: ${right}`, `nueva cara de base: ${right}`)]
      : [localText(locale, `verwendet: ${bottom}, ${back}, ${right}`, `used: ${bottom}, ${back}, ${right}`, `usate: ${bottom}, ${back}, ${right}`, `usadas: ${bottom}, ${back}, ${right}`), localText(locale, `übrig: ${left}`, `remaining: ${left}`, `rimane: ${left}`, `queda: ${left}`)],
    visual: {
      kind: "pyramid",
      values: [orientation.bottom, orientation.left, orientation.right, orientation.back],
      labels: locale === "en"
        ? ["bottom", askAfterRoll ? "left" : "unknown", "right", "back"]
        : locale === "it"
          ? ["base", askAfterRoll ? "sinistra" : "incognita", "destra", "dietro"]
          : locale === "es"
            ? ["base", askAfterRoll ? "izquierda" : "desconocida", "derecha", "atrás"]
          : ["unten", askAfterRoll ? "links" : "gesucht", "rechts", "hinten"],
      arrows: askAfterRoll ? [locale === "en" ? "right" : locale === "it" ? "destra" : locale === "es" ? "derecha" : "rechts"] : [],
    },
  }
}

function generateCuboidSurface(
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  const random = createRandom(seed)
  const [length, width, height] = pick(random, [
    [10, 4, 3],
    [12, 5, 3],
    [14, 5, 4],
    [15, 6, 4],
    [16, 6, 5],
    [18, 7, 4],
  ] as const)
  const model = buildCuboidSurfaceModel(length, width, height, "side-by-side")
  const compositeVolume = model.compositeVolume
  const arrangementLength = 2 * length
  const arrangementWidth = 2 * width
  const surface = model.surface

  return {
    id,
    topicId: "cuboid-surface",
    prompt: localText(locale, `Zwei identische quaderförmige Module haben zusammen ein Volumen von ${compositeVolume} cm³. Hintereinander gelegt sind sie ${arrangementLength} cm lang; nebeneinander sind sie ${arrangementWidth} cm breit. Wie gross ist die Oberfläche des Quaders, der durch das Nebeneinanderlegen entsteht?`, `Two identical cuboid modules have a combined volume of ${compositeVolume} cm³. Placed end to end, they are ${arrangementLength} cm long; placed side by side, they are ${arrangementWidth} cm wide. What is the surface area of the cuboid formed by placing them side by side?`, `Due moduli identici a forma di parallelepipedo hanno insieme un volume di ${compositeVolume} cm³. Disposti uno dietro l'altro sono lunghi ${arrangementLength} cm; affiancati sono larghi ${arrangementWidth} cm. Qual è l'area totale del parallelepipedo ottenuto affiancandoli?`, `Dos módulos idénticos con forma de ortoedro tienen un volumen conjunto de ${compositeVolume} cm³. Colocados uno detrás de otro miden ${arrangementLength} cm de largo; colocados uno junto al otro miden ${arrangementWidth} cm de ancho. ¿Cuál es el área total del ortoedro que forman al colocarlos juntos?`),
    answerLabel: localText(locale, "Oberfläche", "Surface area", "Area totale", "Área total"),
    response: { kind: "number", value: surface, decimals: 0, unit: "cm²" },
    hint: localText(locale, "Halbiere zuerst die bekannten Gesamtmasse, um Länge und Breite eines Moduls zu erhalten.", "First halve the known combined dimensions to find the length and width of one module.", "Dimezza prima le dimensioni complessive conosciute per trovare lunghezza e larghezza di un modulo.", "Divide primero por dos las dimensiones conjuntas conocidas para hallar el largo y el ancho de un módulo."),
    easierExplanation: localText(locale, `Ein Modul ist ${length} cm lang und ${width} cm breit. Sein Volumen ist ${compositeVolume} : 2 = ${compositeVolume / 2} cm³.`, `One module is ${length} cm long and ${width} cm wide. Its volume is ${compositeVolume} ÷ 2 = ${compositeVolume / 2} cm³.`, `Un modulo è lungo ${length} cm e largo ${width} cm. Il suo volume è ${compositeVolume} ÷ 2 = ${compositeVolume / 2} cm³.`, `Un módulo mide ${length} cm de largo y ${width} cm de ancho. Su volumen es ${compositeVolume} ÷ 2 = ${compositeVolume / 2} cm³.`),
    explanation: localText(locale, `Ein Modul misst ${length}×${width}×${height} cm. Der Zielquader misst ${length}×${arrangementWidth}×${height} cm und hat die Oberfläche ${surface} cm².`, `One module measures ${length}×${width}×${height} cm. The target cuboid measures ${length}×${arrangementWidth}×${height} cm and has surface area ${surface} cm².`, `Un modulo misura ${length}×${width}×${height} cm. Il parallelepipedo finale misura ${length}×${arrangementWidth}×${height} cm e ha un'area totale di ${surface} cm².`, `Un módulo mide ${length}×${width}×${height} cm. El ortoedro final mide ${length}×${arrangementWidth}×${height} cm y tiene un área total de ${surface} cm².`),
    workedSteps: [
      localText(locale, `${arrangementLength} : 2 = ${length} cm Länge`, `${arrangementLength} ÷ 2 = ${length} cm length`, `${arrangementLength} ÷ 2 = ${length} cm di lunghezza`, `${arrangementLength} ÷ 2 = ${length} cm de largo`),
      localText(locale, `${arrangementWidth} : 2 = ${width} cm Breite`, `${arrangementWidth} ÷ 2 = ${width} cm width`, `${arrangementWidth} ÷ 2 = ${width} cm di larghezza`, `${arrangementWidth} ÷ 2 = ${width} cm de ancho`),
      localText(locale, `${compositeVolume} : 2 = ${compositeVolume / 2} cm³ pro Modul`, `${compositeVolume} ÷ 2 = ${compositeVolume / 2} cm³ per module`, `${compositeVolume} ÷ 2 = ${compositeVolume / 2} cm³ per modulo`, `${compositeVolume} ÷ 2 = ${compositeVolume / 2} cm³ por módulo`),
      localText(locale, `${compositeVolume / 2} : (${length} · ${width}) = ${height} cm Höhe`, `${compositeVolume / 2} ÷ (${length} · ${width}) = ${height} cm height`, `${compositeVolume / 2} ÷ (${length} · ${width}) = ${height} cm di altezza`, `${compositeVolume / 2} ÷ (${length} · ${width}) = ${height} cm de alto`),
      `2 · (${length}·${arrangementWidth} + ${length}·${height} + ${arrangementWidth}·${height}) = ${surface} cm²`,
    ],
    visual: {
      kind: "cuboid",
      values: [arrangementLength, arrangementWidth, compositeVolume, surface],
      labels: locale === "en" ? ["Arrangement A", "Arrangement B", "Volume", "Surface area"] : locale === "it" ? ["Disposizione A", "Disposizione B", "Volume", "Area totale"] : locale === "es" ? ["Disposición A", "Disposición B", "Volumen", "Área total"] : ["Anordnung A", "Anordnung B", "Volumen", "Oberfläche"],
    },
  }
}

export function generateZap2025Question(
  topicId: TopicId,
  seed: string,
  id: string,
  spatialVersion: "legacy-one-roll" | "full-orientation" = "full-orientation",
  locale: LearningLocale = "de",
): GeneratedQuestion {
  switch (topicId) {
    case "arithmetic-equations":
      return generateArithmeticEquation(seed, id, locale)
    case "time-fractions":
      return generateTimeFraction(seed, id, locale)
    case "money-calculations":
      return generateMoneyCalculation(seed, id, locale)
    case "proportional-revenue":
      return generateProportionalRevenue(seed, id, locale)
    case "integer-combinations":
      return generateIntegerCombinations(seed, id, locale)
    case "area-fractions":
      return generateAreaFraction(seed, id, locale)
    case "tiling-costs":
      return generateTilingCosts(seed, id, locale)
    case "inverse-proportion":
      return generateInverseProportion(seed, id, locale)
    case "changing-rates":
      return generateChangingRates(seed, id, locale)
    case "geometric-loci":
      return generateGeometricLocus(seed, id, locale)
    case "spatial-rolling":
      return spatialVersion === "full-orientation"
        ? generateSpatialRolling(seed, id, locale)
        : generateLegacySpatialRolling(seed, id, locale)
    case "cuboid-surface":
      return generateCuboidSurface(seed, id, locale)
    default:
      throw new Error(`No 2025 generator registered for ${topicId}.`)
  }
}

export function zap2025GeneratorDiagnostics(): Record<string, number> {
  return {
    timeFractionCandidates: timeCandidates.length,
    integerCombinationCandidates: combinationCases.length,
    inverseProportionCandidates: inverseCases.length,
    changingRateCandidates: changingCases.length,
  }
}
