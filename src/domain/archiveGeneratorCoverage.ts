import type { GeneratedQuestion, LearningLocale, TopicId } from "./model"
import { createRandom, pickIndex } from "./random"

export const archiveCoverageTopicIds = [
  "arithmetic-equations",
  "cuboid-surface",
  "integer-combinations",
  "number-constraints",
  "fraction-of-quantity",
] as const satisfies readonly TopicId[]

export type ArchiveCoverageTopicId = (typeof archiveCoverageTopicIds)[number]

export const archiveCoverageFamilyCatalog = [
  {
    familyId: "archive-v6-relational-systems",
    topicId: "arithmetic-equations",
    templateIds: ["larger-from-total", "smaller-from-total"],
  },
  {
    familyId: "archive-v6-voxel-solids",
    topicId: "cuboid-surface",
    templateIds: ["count-stacked-cubes", "count-exposed-unit-faces"],
  },
  {
    familyId: "archive-v6-recurring-cycles",
    topicId: "integer-combinations",
    templateIds: ["two-cycles", "three-cycles"],
  },
  {
    familyId: "archive-v6-number-walls",
    topicId: "number-constraints",
    templateIds: ["missing-centre", "missing-edge"],
  },
  {
    familyId: "archive-v6-number-line",
    topicId: "fraction-of-quantity",
    templateIds: ["fraction-midpoint", "fraction-distance"],
  },
] as const satisfies readonly {
  familyId: string
  topicId: ArchiveCoverageTopicId
  templateIds: readonly string[]
}[]

const coverageTopics = new Set<TopicId>(archiveCoverageTopicIds)

const localText = (
  locale: LearningLocale,
  german: string,
  english: string,
  italian: string,
  spanish: string,
): string => locale === "en" ? english : locale === "it" ? italian : locale === "es" ? spanish : german

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }
  return a
}

function leastCommonMultiple(left: number, right: number): number {
  return Math.abs(left * right) / greatestCommonDivisor(left, right)
}

function simplifiedFraction(
  numerator: number,
  denominator: number,
): { numerator: number; denominator: number } {
  const divisor = greatestCommonDivisor(numerator, denominator)
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  }
}

interface RelationalSystemCandidate {
  smaller: number
  larger: number
  multiplier: number
  offset: number
  total: number
}

function buildRelationalSystemCandidates(): RelationalSystemCandidate[] {
  const candidates: RelationalSystemCandidate[] = []
  for (const smaller of [4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30]) {
    for (const multiplier of [2, 3, 4]) {
      for (const offset of [1, 2, 3, 4, 5, 6, 8, 10, 12]) {
        const larger = multiplier * smaller + offset
        const total = smaller + larger
        if (total > 240) continue
        candidates.push({ smaller, larger, multiplier, offset, total })
      }
    }
  }
  return candidates
}

const relationalSystemCandidates = buildRelationalSystemCandidates()

function generateRelationalSystemQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = relationalSystemCandidates[
    pickIndex(random, relationalSystemCandidates.length)
  ]!
  const asksForLarger = random() < 0.5
  const { smaller, larger, multiplier, offset, total } = candidate
  const answer = asksForLarger ? larger : smaller
  const askedGroup = asksForLarger
    ? localText(locale, "blauen Kiste", "blue box", "scatola blu", "caja azul")
    : localText(locale, "gelben Kiste", "yellow box", "scatola gialla", "caja amarilla")

  return {
    id,
    topicId: "arithmetic-equations",
    prompt: localText(
      locale,
      `In beiden Kisten zusammen liegen ${total} Bausteine.\nGelbe Kiste: eine unbekannte Anzahl.\nBlaue Kiste: ${multiplier}-mal so viele wie gelb + ${offset} zusätzliche Bausteine.\n\nWie viele Bausteine liegen in der ${askedGroup}?`,
      `Together, the two boxes contain ${total} building blocks.\nYellow box: an unknown number.\nBlue box: ${multiplier} times as many as yellow + ${offset} extra blocks.\n\nHow many blocks are in the ${askedGroup}?`,
      `Nelle due scatole ci sono insieme ${total} mattoncini.\nScatola gialla: un numero che non conosci ancora.\nScatola blu: ${multiplier} volte quanti nella gialla + ${offset} mattoncini in più.\n\nQuanti mattoncini ci sono nella ${askedGroup}?`,
      `Entre las dos cajas hay ${total} bloques.\nCaja amarilla: una cantidad que todavía no conocemos.\nCaja azul: ${multiplier} veces los de la amarilla + ${offset} bloques extra.\n\n¿Cuántos bloques hay en la ${askedGroup}?`,
    ),
    answerLabel: localText(
      locale,
      `Bausteine in der ${askedGroup}`,
      `Blocks in the ${askedGroup}`,
      `Mattoncini nella ${askedGroup}`,
      `Bloques en la ${askedGroup}`,
    ),
    response: { kind: "number", value: answer, decimals: 0 },
    hint: localText(
      locale,
      `Die ${offset} Extra-Bausteine liegen nur in Blau. Nimm sie zuerst von der Gesamtzahl weg. Danach bleiben ${multiplier + 1} gleich grosse Gruppen.`,
      `The ${offset} extra blocks belong only to blue. Take them away from the total first. Then ${multiplier + 1} equal groups remain.`,
      `I ${offset} mattoncini in più sono solo nella scatola blu. Toglili prima dal totale. Restano ${multiplier + 1} gruppi uguali.`,
      `Los ${offset} bloques extra están solo en la caja azul. Quítalos primero del total. Quedan ${multiplier + 1} grupos iguales.`,
    ),
    easierExplanation: localText(
      locale,
      `Stell die ${offset} Extra-Bausteine gedanklich neben die blaue Kiste. Von ${total} bleiben dann ${total - offset}. Diese ${total - offset} Bausteine sind ${multiplier + 1} gleiche Gruppen: eine gelbe Gruppe und ${multiplier} Gruppen für Blau.`,
      `Imagine putting the ${offset} extra blocks next to the blue box. ${total - offset} of the ${total} blocks remain. Those ${total - offset} blocks make ${multiplier + 1} equal groups: one yellow group and ${multiplier} groups for blue.`,
      `Immagina di mettere i ${offset} mattoncini in più accanto alla scatola blu. Di ${total} ne restano ${total - offset}. Questi ${total - offset} formano ${multiplier + 1} gruppi uguali: un gruppo giallo e ${multiplier} gruppi per il blu.`,
      `Imagina que apartas los ${offset} bloques extra junto a la caja azul. De los ${total} quedan ${total - offset}. Esos ${total - offset} forman ${multiplier + 1} grupos iguales: un grupo amarillo y ${multiplier} grupos para azul.`,
    ),
    explanation: localText(
      locale,
      `Ziehe die ${offset} Extra-Bausteine ab: ${total} − ${offset} = ${total - offset}. Jetzt sind ${multiplier + 1} gleiche Gruppen übrig. Eine Gruppe hat ${total - offset} : ${multiplier + 1} = ${smaller} Bausteine. Also liegen ${smaller} in Gelb und ${multiplier} · ${smaller} + ${offset} = ${larger} in Blau.`,
      `Take away the ${offset} extra blocks: ${total} − ${offset} = ${total - offset}. Now ${multiplier + 1} equal groups remain. One group has ${total - offset} : ${multiplier + 1} = ${smaller} blocks. So yellow has ${smaller}, and blue has ${multiplier} · ${smaller} + ${offset} = ${larger}.`,
      `Togli i ${offset} mattoncini in più: ${total} − ${offset} = ${total - offset}. Restano ${multiplier + 1} gruppi uguali. Un gruppo ha ${total - offset} : ${multiplier + 1} = ${smaller} mattoncini. Quindi nella gialla ce ne sono ${smaller} e nella blu ${multiplier} · ${smaller} + ${offset} = ${larger}.`,
      `Quita los ${offset} bloques extra: ${total} − ${offset} = ${total - offset}. Quedan ${multiplier + 1} grupos iguales. Un grupo tiene ${total - offset} : ${multiplier + 1} = ${smaller} bloques. Por tanto, en la amarilla hay ${smaller} y en la azul ${multiplier} · ${smaller} + ${offset} = ${larger}.`,
    ),
    workedSteps: [
      localText(
        locale,
        `${total} − ${offset} = ${total - offset} (die Extra-Bausteine aus Blau wegnehmen)`,
        `${total} − ${offset} = ${total - offset} (take away blue's extra blocks)`,
        `${total} − ${offset} = ${total - offset} (togli i mattoncini in più del blu)`,
        `${total} − ${offset} = ${total - offset} (quita los bloques extra de azul)`,
      ),
      localText(
        locale,
        `${total - offset} : ${multiplier + 1} = ${smaller} (eine gelbe Gruppe)`,
        `${total - offset} : ${multiplier + 1} = ${smaller} (one yellow group)`,
        `${total - offset} : ${multiplier + 1} = ${smaller} (un gruppo giallo)`,
        `${total - offset} : ${multiplier + 1} = ${smaller} (un grupo amarillo)`,
      ),
      localText(
        locale,
        `${multiplier} · ${smaller} + ${offset} = ${larger} (blaue Kiste)`,
        `${multiplier} · ${smaller} + ${offset} = ${larger} (blue box)`,
        `${multiplier} · ${smaller} + ${offset} = ${larger} (scatola blu)`,
        `${multiplier} · ${smaller} + ${offset} = ${larger} (caja azul)`,
      ),
    ],
    visual: {
      kind: "equation-balance",
      variant: "relation-total",
      values: [multiplier, offset, total, smaller, larger, asksForLarger ? 1 : 0],
      labels: localText(
        locale,
        ["gelbe Kiste", "blaue Kiste", "zusammen", "gesucht"].join("|"),
        ["yellow box", "blue box", "altogether", "wanted"].join("|"),
        ["scatola gialla", "scatola blu", "in tutto", "cercato"].join("|"),
        ["caja amarilla", "caja azul", "en total", "buscado"].join("|"),
      ).split("|"),
    },
  }
}

interface VoxelSolidCandidate {
  length: number
  width: number
  height: number
  topCubes: number
  totalCubes: number
  exposedFaces: number
}

function buildVoxelSolidCandidates(): VoxelSolidCandidate[] {
  const candidates: VoxelSolidCandidate[] = []
  for (const length of [3, 4, 5, 6]) {
    for (const width of [2, 3, 4, 5]) {
      for (const height of [1, 2, 3, 4]) {
        for (let topCubes = 1; topCubes <= Math.min(length, 4); topCubes += 1) {
          const totalCubes = length * width * height + topCubes
          const cuboidSurface = 2 * (length * width + length * height + width * height)
          // A 1 × topCubes × 1 row has 4n + 2 faces. Its contact hides
          // n faces on the row and n faces on the top of the cuboid.
          const exposedFaces = cuboidSurface + 2 * topCubes + 2
          candidates.push({
            length,
            width,
            height,
            topCubes,
            totalCubes,
            exposedFaces,
          })
        }
      }
    }
  }
  return candidates
}

const voxelSolidCandidates = buildVoxelSolidCandidates()

function generateVoxelSolidQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = voxelSolidCandidates[pickIndex(random, voxelSolidCandidates.length)]!
  const asksForSurface = random() >= 0.5
  const { length, width, height, topCubes, totalCubes, exposedFaces } = candidate
  const topRowPhrase = localText(
    locale,
    topCubes === 1
      ? "ein einzelner Einheitswürfel"
      : `eine gerade Reihe aus ${topCubes} aneinanderliegenden Einheitswürfeln`,
    topCubes === 1
      ? "one unit cube"
      : `a straight row of ${topCubes} touching unit cubes`,
    topCubes === 1
      ? "un solo cubetto unitario"
      : `una fila diritta di ${topCubes} cubetti unitari adiacenti`,
    topCubes === 1
      ? "un cubo unidad"
      : `una fila recta de ${topCubes} cubos unidad contiguos`,
  )

  return {
    id,
    topicId: "cuboid-surface",
    prompt: asksForSurface
      ? localText(
          locale,
          `Ein vollständiger Quader aus Einheitswürfeln ist ${length} Würfel lang, ${width} Würfel breit und ${height} Würfel hoch. Oben wird ${topRowPhrase} aufgelegt. Wie viele quadratische Einheitsflächen sind danach von aussen sichtbar?`,
          `A complete cuboid made of unit cubes is ${length} cubes long, ${width} cubes wide and ${height} cubes high. ${topRowPhrase} is placed on top. How many square unit faces are visible from outside afterwards?`,
          `Un parallelepipedo completo di cubetti unitari è lungo ${length} cubetti, largo ${width} e alto ${height}. Sopra si aggiunge ${topRowPhrase}. Quante facce quadrate unitarie sono visibili dall'esterno?`,
          `Un ortoedro completo de cubos unidad mide ${length} cubos de largo, ${width} de ancho y ${height} de alto. Encima se coloca ${topRowPhrase}. ¿Cuántas caras cuadradas unidad quedan visibles desde fuera?`,
        )
      : localText(
          locale,
          `Ein vollständiger Quader aus Einheitswürfeln ist ${length} Würfel lang, ${width} Würfel breit und ${height} Würfel hoch. Oben wird noch eine gerade Reihe aus ${topCubes} Einheitswürfeln aufgelegt. Aus wie vielen Einheitswürfeln besteht der ganze Körper?`,
          `A complete cuboid made of unit cubes is ${length} cubes long, ${width} cubes wide and ${height} cubes high. A straight row of ${topCubes} more unit cubes is placed on top. How many unit cubes make up the whole solid?`,
          `Un parallelepipedo completo di cubetti unitari è lungo ${length} cubetti, largo ${width} e alto ${height}. Sopra viene aggiunta una fila diritta di ${topCubes} cubetti. Da quanti cubetti unitari è formato l'intero solido?`,
          `Un ortoedro completo de cubos unidad mide ${length} cubos de largo, ${width} de ancho y ${height} de alto. Encima se añade una fila recta de ${topCubes} cubos. ¿Cuántos cubos unidad forman todo el sólido?`,
        ),
    answerLabel: asksForSurface
      ? localText(locale, "Sichtbare Einheitsflächen", "Visible unit faces", "Facce unitarie visibili", "Caras unidad visibles")
      : localText(locale, "Einheitswürfel insgesamt", "Unit cubes altogether", "Cubetti unitari in tutto", "Cubos unidad en total"),
    response: {
      kind: "number",
      value: asksForSurface ? exposedFaces : totalCubes,
      decimals: 0,
    },
    hint: asksForSurface
      ? localText(
          locale,
          "Berechne zuerst die Oberfläche des vollständigen Quaders. Die neue Reihe verdeckt unten Flächen, bringt aber oben und an ihren freien Seiten neue Flächen dazu.",
          "First calculate the surface area of the complete cuboid. The new row hides faces underneath but adds new top and free side faces.",
          "Calcola prima la superficie del parallelepipedo completo. La nuova fila nasconde le facce sottostanti, ma aggiunge facce superiori e laterali libere.",
          "Calcula primero la superficie del ortoedro completo. La nueva fila oculta caras debajo, pero añade caras superiores y laterales libres.",
        )
      : localText(
          locale,
          "Berechne zuerst die Würfel in einer Schicht, dann alle vollständigen Schichten und addiere die obere Reihe.",
          "First calculate the cubes in one layer, then all complete layers, and add the top row.",
          "Calcola prima i cubetti in uno strato, poi tutti gli strati completi e infine aggiungi la fila superiore.",
          "Calcula primero los cubos de una capa, después todas las capas completas y añade la fila superior.",
        ),
    easierExplanation: asksForSurface
      ? localText(
          locale,
          `Der Grundquader hat die Oberfläche 2 · (${length} · ${width} + ${length} · ${height} + ${width} · ${height}). Eine Reihe aus ${topCubes} Würfeln erhöht diese um ${2 * topCubes + 2} Flächen.`,
          `The base cuboid has surface area 2 · (${length} · ${width} + ${length} · ${height} + ${width} · ${height}). A row of ${topCubes} cubes increases it by ${2 * topCubes + 2} faces.`,
          `Il parallelepipedo di base ha superficie 2 · (${length} · ${width} + ${length} · ${height} + ${width} · ${height}). Una fila di ${topCubes} cubetti la aumenta di ${2 * topCubes + 2} facce.`,
          `El ortoedro base tiene superficie 2 · (${length} · ${width} + ${length} · ${height} + ${width} · ${height}). Una fila de ${topCubes} cubos la aumenta en ${2 * topCubes + 2} caras.`,
        )
      : localText(
          locale,
          `Eine vollständige Schicht enthält ${length} · ${width} Würfel. Es gibt ${height} solche Schichten und zusätzlich ${topCubes} Würfel.`,
          `One complete layer contains ${length} · ${width} cubes. There are ${height} such layers and ${topCubes} additional cubes.`,
          `Uno strato completo contiene ${length} · ${width} cubetti. Ci sono ${height} strati e altri ${topCubes} cubetti.`,
          `Una capa completa contiene ${length} · ${width} cubos. Hay ${height} capas y ${topCubes} cubos adicionales.`,
        ),
    explanation: asksForSurface
      ? `2 · (${length} · ${width} + ${length} · ${height} + ${width} · ${height}) + ${2 * topCubes + 2} = ${exposedFaces}.`
      : `${length} · ${width} · ${height} + ${topCubes} = ${totalCubes}.`,
    workedSteps: asksForSurface
      ? [
          `2 · (${length * width} + ${length * height} + ${width * height}) = ${exposedFaces - 2 * topCubes - 2}`,
          `${topCubes} ${localText(locale, "Kontaktflächen werden zweimal unsichtbar", "contact faces become hidden twice", "facce di contatto diventano invisibili due volte", "caras de contacto quedan ocultas dos veces")}`,
          `${exposedFaces - 2 * topCubes - 2} + ${2 * topCubes + 2} = ${exposedFaces}`,
        ]
      : [
          `${length} · ${width} = ${length * width}`,
          `${length * width} · ${height} = ${length * width * height}`,
          `${length * width * height} + ${topCubes} = ${totalCubes}`,
        ],
    visual: {
      kind: "cuboid",
      variant: asksForSurface ? "voxel-surface" : "voxel-count",
      values: [length, width, height, topCubes, totalCubes, exposedFaces, asksForSurface ? 1 : 0],
      labels: localText(
        locale,
        ["Länge", "Breite", "Höhe", "obere Reihe", "zusätzliche sichtbare Flächen", "zusätzliche Würfel"].join("|"),
        ["length", "width", "height", "top row", "additional visible faces", "additional cubes"].join("|"),
        ["lunghezza", "larghezza", "altezza", "fila superiore", "facce visibili aggiuntive", "cubetti aggiuntivi"].join("|"),
        ["largo", "ancho", "alto", "fila superior", "caras visibles adicionales", "cubos adicionales"].join("|"),
      ).split("|"),
    },
  }
}

interface CycleCandidate {
  first: number
  second: number
  third: number
  coincidence: number
}

function buildTwoCycleCandidates(): CycleCandidate[] {
  const candidates: CycleCandidate[] = []
  const intervals = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 30]
  for (const first of intervals) {
    for (const second of intervals) {
      if (first >= second) continue
      const coincidence = leastCommonMultiple(first, second)
      if (coincidence < 20 || coincidence > 180 || coincidence === second) continue
      candidates.push({ first, second, third: 0, coincidence })
    }
  }
  return candidates
}

function buildThreeCycleCandidates(): CycleCandidate[] {
  const candidates: CycleCandidate[] = []
  const intervals = [4, 6, 8, 9, 10, 12, 14, 15, 18, 20]
  for (let firstIndex = 0; firstIndex < intervals.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < intervals.length; secondIndex += 1) {
      for (let thirdIndex = secondIndex + 1; thirdIndex < intervals.length; thirdIndex += 1) {
        const first = intervals[firstIndex]!
        const second = intervals[secondIndex]!
        const third = intervals[thirdIndex]!
        const coincidence = leastCommonMultiple(leastCommonMultiple(first, second), third)
        if (coincidence < 30 || coincidence > 240 || coincidence === third) continue
        candidates.push({ first, second, third, coincidence })
      }
    }
  }
  return candidates
}

const twoCycleCandidates = buildTwoCycleCandidates()
const threeCycleCandidates = buildThreeCycleCandidates()

function generateRecurringCycleQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const usesThreeCycles = random() < 0.38
  const candidates = usesThreeCycles ? threeCycleCandidates : twoCycleCandidates
  const { first, second, third, coincidence } = candidates[pickIndex(random, candidates.length)]!
  const intervalList = usesThreeCycles
    ? localText(
        locale,
        `${first}, ${second} und ${third} Minuten`,
        `${first}, ${second} and ${third} minutes`,
        `${first}, ${second} e ${third} minuti`,
        `${first}, ${second} y ${third} minutos`,
      )
    : localText(
        locale,
        `${first} und ${second} Minuten`,
        `${first} and ${second} minutes`,
        `${first} e ${second} minuti`,
        `${first} y ${second} minutos`,
      )

  return {
    id,
    topicId: "integer-combinations",
    prompt: localText(
      locale,
      `Bei einer Lichtinstallation starten ${usesThreeCycles ? "drei" : "zwei"} Signale gleichzeitig. Sie leuchten regelmässig alle ${intervalList}. Nach wie vielen Minuten leuchten alle zum ersten Mal wieder gleichzeitig?`,
      `At a light installation, ${usesThreeCycles ? "three" : "two"} signals start together. They flash regularly every ${intervalList}. After how many minutes will they all flash together for the first time?`,
      `In un'installazione luminosa, ${usesThreeCycles ? "tre" : "due"} segnali partono insieme. Lampeggiano regolarmente ogni ${intervalList}. Dopo quanti minuti lampeggeranno di nuovo tutti insieme per la prima volta?`,
      `En una instalación luminosa, ${usesThreeCycles ? "tres" : "dos"} señales empiezan juntas. Parpadean regularmente cada ${intervalList}. ¿Después de cuántos minutos volverán a parpadear todas juntas por primera vez?`,
    ),
    answerLabel: localText(locale, "Erstes gemeinsames Signal nach", "First shared signal after", "Primo segnale comune dopo", "Primera señal conjunta después"),
    response: { kind: "number", value: coincidence, decimals: 0, unit: "min" },
    hint: localText(
      locale,
      "Schreibe einige Vielfache jedes Zeitabstands auf. Gesucht ist das kleinste positive Vielfache, das in allen Listen vorkommt.",
      "List several multiples of each interval. Find the smallest positive multiple that appears in every list.",
      "Scrivi alcuni multipli di ogni intervallo. Cerca il più piccolo multiplo positivo presente in tutte le liste.",
      "Escribe varios múltiplos de cada intervalo. Busca el menor múltiplo positivo que aparece en todas las listas.",
    ),
    easierExplanation: localText(
      locale,
      "Ein gemeinsamer Zeitpunkt muss durch jeden Zeitabstand ohne Rest teilbar sein. Das kleinste solche Ergebnis ist das kleinste gemeinsame Vielfache.",
      "A shared time must be divisible by every interval without a remainder. The smallest such result is the least common multiple.",
      "Un istante comune deve essere divisibile senza resto per ogni intervallo. Il più piccolo è il minimo comune multiplo.",
      "Un momento común debe ser divisible sin resto entre cada intervalo. El menor es el mínimo común múltiplo.",
    ),
    explanation: localText(
      locale,
      `Das kleinste gemeinsame Vielfache von ${usesThreeCycles ? `${first}, ${second} und ${third}` : `${first} und ${second}`} ist ${coincidence}.`,
      `The least common multiple of ${usesThreeCycles ? `${first}, ${second} and ${third}` : `${first} and ${second}`} is ${coincidence}.`,
      `Il minimo comune multiplo di ${usesThreeCycles ? `${first}, ${second} e ${third}` : `${first} e ${second}`} è ${coincidence}.`,
      `El mínimo común múltiplo de ${usesThreeCycles ? `${first}, ${second} y ${third}` : `${first} y ${second}`} es ${coincidence}.`,
    ),
    workedSteps: [
      `${coincidence} : ${first} = ${coincidence / first}`,
      `${coincidence} : ${second} = ${coincidence / second}`,
      ...(usesThreeCycles ? [`${coincidence} : ${third} = ${coincidence / third}`] : []),
      localText(locale, `${coincidence} ist das erste gemeinsame Vielfache.`, `${coincidence} is the first shared multiple.`, `${coincidence} è il primo multiplo comune.`, `${coincidence} es el primer múltiplo común.`),
    ],
    visual: {
      kind: "clock",
      variant: "recurring-cycles",
      values: [first, second, third, coincidence],
      labels: localText(
        locale,
        ["Signal A", "Signal B", "Signal C", "gemeinsam"].join("|"),
        ["signal A", "signal B", "signal C", "together"].join("|"),
        ["segnale A", "segnale B", "segnale C", "insieme"].join("|"),
        ["señal A", "señal B", "señal C", "juntas"].join("|"),
      ).split("|"),
    },
  }
}

interface NumberWallCandidate {
  left: number
  centre: number
  right: number
  middleLeft: number
  middleRight: number
  top: number
}

function buildNumberWallCandidates(): NumberWallCandidate[] {
  const candidates: NumberWallCandidate[] = []
  const edgeValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15]
  const centreValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18]
  for (const left of edgeValues) {
    for (const centre of centreValues) {
      for (const right of edgeValues) {
        const middleLeft = left + centre
        const middleRight = centre + right
        const top = middleLeft + middleRight
        if (top > 80) continue
        candidates.push({ left, centre, right, middleLeft, middleRight, top })
      }
    }
  }
  return candidates
}

const numberWallCandidates = buildNumberWallCandidates()

function generateNumberWallQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const candidate = numberWallCandidates[pickIndex(random, numberWallCandidates.length)]!
  const asksForCentre = random() < 0.56
  const { left, centre, right, middleLeft, middleRight, top } = candidate
  const answer = asksForCentre ? centre : right
  const givenText = asksForCentre
    ? localText(
        locale,
        `Unten links steht ${left}, unten rechts ${right}, ganz oben ${top}.`,
        `The bottom left brick is ${left}, the bottom right brick is ${right}, and the top brick is ${top}.`,
        `In basso a sinistra c'è ${left}, in basso a destra ${right} e in cima ${top}.`,
        `Abajo a la izquierda está ${left}, abajo a la derecha ${right} y arriba del todo ${top}.`,
      )
    : localText(
        locale,
        `Unten links steht ${left}, unten in der Mitte ${centre}, ganz oben ${top}.`,
        `The bottom left brick is ${left}, the bottom centre brick is ${centre}, and the top brick is ${top}.`,
        `In basso a sinistra c'è ${left}, al centro ${centre} e in cima ${top}.`,
        `Abajo a la izquierda está ${left}, en el centro ${centre} y arriba del todo ${top}.`,
      )

  return {
    id,
    topicId: "number-constraints",
    prompt: localText(
      locale,
      `In einer Zahlenmauer ist jeder Stein die Summe der beiden Steine direkt darunter. ${givenText} Welche Zahl gehört ${asksForCentre ? "unten in die Mitte" : "unten rechts"}?`,
      `In a number wall, each brick is the sum of the two bricks directly below it. ${givenText} Which number belongs in the ${asksForCentre ? "bottom centre" : "bottom right"} brick?`,
      `In un muro di numeri, ogni mattone è la somma dei due mattoni direttamente sotto. ${givenText} Quale numero va ${asksForCentre ? "in basso al centro" : "in basso a destra"}?`,
      `En un muro de números, cada ladrillo es la suma de los dos ladrillos justo debajo. ${givenText} ¿Qué número va ${asksForCentre ? "abajo en el centro" : "abajo a la derecha"}?`,
    ),
    answerLabel: localText(locale, "Fehlender Grundstein", "Missing bottom brick", "Mattone inferiore mancante", "Ladrillo inferior que falta"),
    response: { kind: "number", value: answer, decimals: 0 },
    hint: asksForCentre
      ? localText(
          locale,
          `Der mittlere Grundstein wird oben zweimal mitgezählt: ${left} + 2 · ? + ${right} = ${top}.`,
          `The bottom centre brick is counted twice at the top: ${left} + 2 · ? + ${right} = ${top}.`,
          `Il mattone centrale in basso viene contato due volte in cima: ${left} + 2 · ? + ${right} = ${top}.`,
          `El ladrillo central inferior se cuenta dos veces arriba: ${left} + 2 · ? + ${right} = ${top}.`,
        )
      : localText(
          locale,
          `Mit den beiden bekannten Grundsteinen kannst du zuerst den linken Mittelstein ${middleLeft} bilden. Arbeite danach von oben rückwärts.`,
          `Use the two known bottom bricks to make the left middle brick ${middleLeft}. Then work backwards from the top.`,
          `Con i due mattoni noti in basso puoi formare prima il mattone centrale sinistro ${middleLeft}. Poi lavora all'indietro dalla cima.`,
          `Con los dos ladrillos inferiores conocidos puedes formar primero el ladrillo medio izquierdo ${middleLeft}. Después trabaja hacia atrás desde arriba.`,
        ),
    easierExplanation: asksForCentre
      ? localText(
          locale,
          `Ziehe zuerst die beiden Randzahlen ab: ${top} − ${left} − ${right}. Der Rest besteht aus zwei gleichen mittleren Grundsteinen.`,
          `First subtract the two edge numbers: ${top} − ${left} − ${right}. The remainder consists of two equal copies of the bottom centre brick.`,
          `Sottrai prima i due numeri esterni: ${top} − ${left} − ${right}. Il resto contiene due volte il mattone centrale inferiore.`,
          `Primero resta los dos números de los extremos: ${top} − ${left} − ${right}. El resto contiene dos veces el ladrillo central inferior.`,
        )
      : localText(
          locale,
          `Links in der Mitte steht ${left} + ${centre} = ${middleLeft}. Rechts in der Mitte muss deshalb ${top} − ${middleLeft} = ${middleRight} stehen. Ziehe dort ${centre} ab.`,
          `The left middle brick is ${left} + ${centre} = ${middleLeft}. So the right middle brick must be ${top} − ${middleLeft} = ${middleRight}. Subtract ${centre} there.`,
          `Il mattone centrale sinistro è ${left} + ${centre} = ${middleLeft}. Quello centrale destro deve quindi essere ${top} − ${middleLeft} = ${middleRight}. Sottrai ${centre}.`,
          `El ladrillo medio izquierdo es ${left} + ${centre} = ${middleLeft}. Por tanto, el medio derecho debe ser ${top} − ${middleLeft} = ${middleRight}. Resta ${centre}.`,
        ),
    explanation: asksForCentre
      ? `(${top} − ${left} − ${right}) : 2 = ${centre}.`
      : `${top} − (${left} + ${centre}) − ${centre} = ${right}.`,
    workedSteps: asksForCentre
      ? [
          `${top} − ${left} − ${right} = ${2 * centre}`,
          `${2 * centre} : 2 = ${centre}`,
          `${left} + ${centre} + ${centre} + ${right} = ${top}`,
        ]
      : [
          `${left} + ${centre} = ${middleLeft}`,
          `${top} − ${middleLeft} = ${middleRight}`,
          `${middleRight} − ${centre} = ${right}`,
        ],
    visual: {
      kind: "number-wall",
      variant: asksForCentre ? "number-wall-centre" : "number-wall-edge",
      values: [left, centre, right, middleLeft, middleRight, top, asksForCentre ? 1 : 2],
      labels: localText(
        locale,
        ["oben", "Mitte", "unten"].join("|"),
        ["top", "middle", "bottom"].join("|"),
        ["cima", "centro", "basso"].join("|"),
        ["arriba", "medio", "abajo"].join("|"),
      ).split("|"),
    },
  }
}

interface NumberLineCandidate {
  leftNumerator: number
  denominator: number
  rightNumerator: number
  answerNumerator: number
  answerDenominator: number
}

function buildMidpointCandidates(): NumberLineCandidate[] {
  const candidates: NumberLineCandidate[] = []
  for (const denominator of [4, 5, 6, 8, 10, 12]) {
    for (let leftNumerator = 0; leftNumerator < denominator * 2 - 1; leftNumerator += 1) {
      for (let rightNumerator = leftNumerator + 2; rightNumerator <= denominator * 2; rightNumerator += 1) {
        if ((leftNumerator + rightNumerator) % 2 !== 0) continue
        const answer = simplifiedFraction((leftNumerator + rightNumerator) / 2, denominator)
        candidates.push({
          leftNumerator,
          denominator,
          rightNumerator,
          answerNumerator: answer.numerator,
          answerDenominator: answer.denominator,
        })
      }
    }
  }
  return candidates
}

function buildDistanceCandidates(): NumberLineCandidate[] {
  const candidates: NumberLineCandidate[] = []
  for (const denominator of [4, 5, 6, 8, 10, 12]) {
    for (let leftNumerator = 0; leftNumerator < denominator * 2 - 1; leftNumerator += 1) {
      for (let rightNumerator = leftNumerator + 1; rightNumerator <= denominator * 2; rightNumerator += 1) {
        const answer = simplifiedFraction(rightNumerator - leftNumerator, denominator)
        candidates.push({
          leftNumerator,
          denominator,
          rightNumerator,
          answerNumerator: answer.numerator,
          answerDenominator: answer.denominator,
        })
      }
    }
  }
  return candidates
}

const midpointCandidates = buildMidpointCandidates()
const distanceCandidates = buildDistanceCandidates()

function generateNumberLineQuestion(
  seed: string,
  id: string,
  locale: LearningLocale,
): GeneratedQuestion {
  const random = createRandom(seed)
  const asksForMidpoint = random() < 0.5
  const candidates = asksForMidpoint ? midpointCandidates : distanceCandidates
  const candidate = candidates[pickIndex(random, candidates.length)]!
  const {
    leftNumerator,
    denominator,
    rightNumerator,
    answerNumerator,
    answerDenominator,
  } = candidate
  const left = `${leftNumerator}/${denominator}`
  const right = `${rightNumerator}/${denominator}`
  const answer = `${answerNumerator}/${answerDenominator}`
  const unsimplifiedDistanceNumerator = rightNumerator - leftNumerator
  const unsimplifiedDistance = `${unsimplifiedDistanceNumerator}/${denominator}`
  const reductionFactor = denominator / answerDenominator
  const distanceNeedsReducing = reductionFactor > 1
  const distanceReductionExplanation = distanceNeedsReducing
    ? localText(
        locale,
        `${unsimplifiedDistance} ist nicht falsch: Es ist gleich viel wie ${answer}. Vollständig gekürzt bedeutet, dass Zähler und Nenner keinen gemeinsamen Teiler mehr ausser 1 haben.`,
        `${unsimplifiedDistance} is not wrong: it has the same value as ${answer}. Fully simplified means that the numerator and denominator have no common factor greater than 1.`,
        `${unsimplifiedDistance} non è sbagliato: ha lo stesso valore di ${answer}. Ridotta ai minimi termini significa che numeratore e denominatore non hanno più un divisore comune maggiore di 1.`,
        `${unsimplifiedDistance} no es incorrecta: tiene el mismo valor que ${answer}. Completamente simplificada significa que el numerador y el denominador ya no tienen un divisor común mayor que 1.`,
      )
    : localText(
        locale,
        `${unsimplifiedDistance} ist bereits vollständig gekürzt: Zähler und Nenner haben keinen gemeinsamen Teiler mehr ausser 1.`,
        `${unsimplifiedDistance} is already fully simplified: the numerator and denominator have no common factor greater than 1.`,
        `${unsimplifiedDistance} è già ridotta ai minimi termini: numeratore e denominatore non hanno un divisore comune maggiore di 1.`,
        `${unsimplifiedDistance} ya está completamente simplificada: el numerador y el denominador no tienen un divisor común mayor que 1.`,
      )

  return {
    id,
    topicId: "fraction-of-quantity",
    prompt: asksForMidpoint
      ? localText(
          locale,
          `Auf einer Zahlengeraden liegen die Punkte A = ${left} und B = ${right}. Welcher vollständig gekürzte Bruch liegt genau in der Mitte zwischen A und B?`,
          `On a number line, the points are A = ${left} and B = ${right}. Which fully simplified fraction lies exactly halfway between A and B?`,
          `Su una retta numerica si trovano i punti A = ${left} e B = ${right}. Quale frazione ridotta ai minimi termini si trova esattamente a metà tra A e B?`,
          `En una recta numérica están los puntos A = ${left} y B = ${right}. ¿Qué fracción completamente simplificada está exactamente a mitad de camino entre A y B?`,
        )
      : localText(
          locale,
          `Auf einer Zahlengeraden liegen die Punkte A = ${left} und B = ${right}. Wie gross ist ihr Abstand als vollständig gekürzter Bruch?`,
          `On a number line, the points are A = ${left} and B = ${right}. What is the distance between them as a fully simplified fraction?`,
          `Su una retta numerica si trovano i punti A = ${left} e B = ${right}. Qual è la loro distanza come frazione ridotta ai minimi termini?`,
          `En una recta numérica están los puntos A = ${left} y B = ${right}. ¿Cuál es la distancia entre ellos como fracción completamente simplificada?`,
        ),
    answerLabel: asksForMidpoint
      ? localText(locale, "Bruch in der Mitte", "Fraction halfway", "Frazione a metà", "Fracción intermedia")
      : localText(locale, "Abstand", "Distance", "Distanza", "Distancia"),
    response: {
      kind: "fraction",
      numerator: answerNumerator,
      denominator: answerDenominator,
      requireSimplified: true,
    },
    hint: asksForMidpoint
      ? localText(
          locale,
          "Bei gleichem Nenner kannst du die Zähler mitteln. Kürze das Ergebnis anschliessend vollständig.",
          "With equal denominators, average the numerators. Then simplify the result fully.",
          "Con denominatori uguali puoi calcolare la media dei numeratori. Poi riduci completamente il risultato.",
          "Con denominadores iguales puedes calcular la media de los numeradores. Después simplifica completamente el resultado.",
        )
      : localText(
          locale,
          `Gehe auf der Zahlengeraden von A zu B. Bei gleichem Nenner rechnest du den Zähler von B minus den Zähler von A: ${rightNumerator} − ${leftNumerator}.`,
          `Move along the number line from A to B. With equal denominators, subtract A's numerator from B's numerator: ${rightNumerator} − ${leftNumerator}.`,
          `Sulla retta numerica vai da A a B. Con denominatori uguali sottrai il numeratore di A da quello di B: ${rightNumerator} − ${leftNumerator}.`,
          `En la recta numérica ve de A a B. Con denominadores iguales, resta el numerador de A al de B: ${rightNumerator} − ${leftNumerator}.`,
        ),
    easierExplanation: asksForMidpoint
      ? localText(
          locale,
          `Die Mitte der Zähler ${leftNumerator} und ${rightNumerator} ist (${leftNumerator} + ${rightNumerator}) : 2 = ${(leftNumerator + rightNumerator) / 2}. Der Nenner bleibt zunächst ${denominator}.`,
          `The midpoint of the numerators ${leftNumerator} and ${rightNumerator} is (${leftNumerator} + ${rightNumerator}) ÷ 2 = ${(leftNumerator + rightNumerator) / 2}. The denominator initially stays ${denominator}.`,
          `La media dei numeratori ${leftNumerator} e ${rightNumerator} è (${leftNumerator} + ${rightNumerator}) ÷ 2 = ${(leftNumerator + rightNumerator) / 2}. Il denominatore resta inizialmente ${denominator}.`,
          `El punto medio de los numeradores ${leftNumerator} y ${rightNumerator} es (${leftNumerator} + ${rightNumerator}) ÷ 2 = ${(leftNumerator + rightNumerator) / 2}. El denominador sigue siendo ${denominator} al principio.`,
        )
      : localText(
          locale,
          `Von A = ${left} bis B = ${right} liegen ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator} gleich grosse Teilstrecken. Der Abstand ist zuerst ${unsimplifiedDistance}. ${distanceReductionExplanation}`,
          `From A = ${left} to B = ${right}, there are ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator} equal sections. The distance is first ${unsimplifiedDistance}. ${distanceReductionExplanation}`,
          `Da A = ${left} a B = ${right} ci sono ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator} intervalli uguali. La distanza è prima ${unsimplifiedDistance}. ${distanceReductionExplanation}`,
          `Desde A = ${left} hasta B = ${right} hay ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator} tramos iguales. La distancia es primero ${unsimplifiedDistance}. ${distanceReductionExplanation}`,
        ),
    explanation: asksForMidpoint
      ? `(${left} + ${right}) : 2 = ${answer}.`
      : distanceNeedsReducing
        ? localText(
            locale,
            `Der Abstand von A nach B ist ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} und ${answer} sind gleich viel: ${unsimplifiedDistanceNumerator} : ${reductionFactor} = ${answerNumerator} und ${denominator} : ${reductionFactor} = ${answerDenominator}. Deshalb lautet der vollständig gekürzte Bruch ${answer}.`,
            `The distance from A to B is ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} and ${answer} have the same value: ${unsimplifiedDistanceNumerator} ÷ ${reductionFactor} = ${answerNumerator} and ${denominator} ÷ ${reductionFactor} = ${answerDenominator}. So the fully simplified fraction is ${answer}.`,
            `La distanza da A a B è ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} e ${answer} hanno lo stesso valore: ${unsimplifiedDistanceNumerator} ÷ ${reductionFactor} = ${answerNumerator} e ${denominator} ÷ ${reductionFactor} = ${answerDenominator}. Quindi la frazione ridotta ai minimi termini è ${answer}.`,
            `La distancia de A a B es ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} y ${answer} tienen el mismo valor: ${unsimplifiedDistanceNumerator} ÷ ${reductionFactor} = ${answerNumerator} y ${denominator} ÷ ${reductionFactor} = ${answerDenominator}. Por eso, la fracción completamente simplificada es ${answer}.`,
          )
        : localText(
            locale,
            `Der Abstand von A nach B ist ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} ist bereits vollständig gekürzt.`,
            `The distance from A to B is ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} is already fully simplified.`,
            `La distanza da A a B è ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} è già ridotta ai minimi termini.`,
            `La distancia de A a B es ${right} − ${left} = ${unsimplifiedDistance}. ${unsimplifiedDistance} ya está completamente simplificada.`,
          ),
    workedSteps: asksForMidpoint
      ? [
          `(${leftNumerator} + ${rightNumerator}) : 2 = ${(leftNumerator + rightNumerator) / 2}`,
          `${(leftNumerator + rightNumerator) / 2}/${denominator} = ${answer}`,
        ]
      : [
          localText(
            locale,
            `Von A bis B: ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator}`,
            `From A to B: ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator}`,
            `Da A a B: ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator}`,
            `De A a B: ${rightNumerator} − ${leftNumerator} = ${unsimplifiedDistanceNumerator}`,
          ),
          `${right} − ${left} = ${unsimplifiedDistance}`,
          ...(distanceNeedsReducing
            ? [localText(
                locale,
                `${unsimplifiedDistance} = ${answer} (Zähler und Nenner durch ${reductionFactor} teilen)`,
                `${unsimplifiedDistance} = ${answer} (divide the numerator and denominator by ${reductionFactor})`,
                `${unsimplifiedDistance} = ${answer} (dividi numeratore e denominatore per ${reductionFactor})`,
                `${unsimplifiedDistance} = ${answer} (divide el numerador y el denominador entre ${reductionFactor})`,
              )]
            : []),
        ],
    visual: {
      kind: "number-line",
      variant: asksForMidpoint ? "fraction-midpoint" : "fraction-distance",
      values: [
        leftNumerator,
        denominator,
        rightNumerator,
        denominator,
        answerNumerator,
        answerDenominator,
      ],
      labels: ["A", "B", "?"],
    },
  }
}

export function supportsArchiveCoverageTopic(
  topicId: TopicId,
): topicId is ArchiveCoverageTopicId {
  return coverageTopics.has(topicId)
}

export function generateArchiveCoverageQuestion(
  topicId: ArchiveCoverageTopicId,
  seed: string,
  id: string,
  locale: LearningLocale = "de",
): GeneratedQuestion {
  let question: GeneratedQuestion
  let familyId: string
  let templateId: string

  switch (topicId) {
    case "arithmetic-equations":
      question = generateRelationalSystemQuestion(seed, id, locale)
      familyId = archiveCoverageFamilyCatalog[0].familyId
      templateId = question.visual?.values?.[5] === 1 ? "larger-from-total" : "smaller-from-total"
      break
    case "cuboid-surface":
      question = generateVoxelSolidQuestion(seed, id, locale)
      familyId = archiveCoverageFamilyCatalog[1].familyId
      templateId = question.visual?.variant === "voxel-surface"
        ? "count-exposed-unit-faces"
        : "count-stacked-cubes"
      break
    case "integer-combinations":
      question = generateRecurringCycleQuestion(seed, id, locale)
      familyId = archiveCoverageFamilyCatalog[2].familyId
      templateId = (question.visual?.values?.[2] ?? 0) > 0 ? "three-cycles" : "two-cycles"
      break
    case "number-constraints":
      question = generateNumberWallQuestion(seed, id, locale)
      familyId = archiveCoverageFamilyCatalog[3].familyId
      templateId = question.visual?.variant === "number-wall-centre"
        ? "missing-centre"
        : "missing-edge"
      break
    case "fraction-of-quantity":
      question = generateNumberLineQuestion(seed, id, locale)
      familyId = archiveCoverageFamilyCatalog[4].familyId
      templateId = question.visual?.variant === "fraction-midpoint"
        ? "fraction-midpoint"
        : "fraction-distance"
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

export function archiveCoverageDiagnostics(): {
  relationalSystemCandidates: number
  voxelSolidCandidates: number
  twoCycleCandidates: number
  threeCycleCandidates: number
  numberWallCandidates: number
  midpointCandidates: number
  distanceCandidates: number
  totalCandidates: number
  families: Array<{
    familyId: string
    topicId: ArchiveCoverageTopicId
    templates: Array<{ templateId: string; candidateCount: number }>
    candidateCount: number
  }>
} {
  const families = [
    {
      ...archiveCoverageFamilyCatalog[0],
      templates: [
        { templateId: "larger-from-total", candidateCount: relationalSystemCandidates.length },
        { templateId: "smaller-from-total", candidateCount: relationalSystemCandidates.length },
      ],
      candidateCount: relationalSystemCandidates.length * 2,
    },
    {
      ...archiveCoverageFamilyCatalog[1],
      templates: [
        { templateId: "count-stacked-cubes", candidateCount: voxelSolidCandidates.length },
        { templateId: "count-exposed-unit-faces", candidateCount: voxelSolidCandidates.length },
      ],
      candidateCount: voxelSolidCandidates.length * 2,
    },
    {
      ...archiveCoverageFamilyCatalog[2],
      templates: [
        { templateId: "two-cycles", candidateCount: twoCycleCandidates.length },
        { templateId: "three-cycles", candidateCount: threeCycleCandidates.length },
      ],
      candidateCount: twoCycleCandidates.length + threeCycleCandidates.length,
    },
    {
      ...archiveCoverageFamilyCatalog[3],
      templates: [
        { templateId: "missing-centre", candidateCount: numberWallCandidates.length },
        { templateId: "missing-edge", candidateCount: numberWallCandidates.length },
      ],
      candidateCount: numberWallCandidates.length * 2,
    },
    {
      ...archiveCoverageFamilyCatalog[4],
      templates: [
        { templateId: "fraction-midpoint", candidateCount: midpointCandidates.length },
        { templateId: "fraction-distance", candidateCount: distanceCandidates.length },
      ],
      candidateCount: midpointCandidates.length + distanceCandidates.length,
    },
  ]
  return {
    relationalSystemCandidates: relationalSystemCandidates.length,
    voxelSolidCandidates: voxelSolidCandidates.length,
    twoCycleCandidates: twoCycleCandidates.length,
    threeCycleCandidates: threeCycleCandidates.length,
    numberWallCandidates: numberWallCandidates.length,
    midpointCandidates: midpointCandidates.length,
    distanceCandidates: distanceCandidates.length,
    totalCandidates: families.reduce((sum, family) => sum + family.candidateCount, 0),
    families,
  }
}
