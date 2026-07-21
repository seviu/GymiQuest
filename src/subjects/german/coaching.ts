import type { AppLocale } from "../../i18n/localization"
import type { GermanTopicId } from "./package"

export interface GermanCoachingCopy {
  title: string
  guidance: string
}

const fallback: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Schritt für Schritt", guidance: "Suche zuerst die genaue Stelle, an der deine Entscheidung fällt." },
  en: { title: "Step by step", guidance: "First find the exact place where the evidence or rule decides the answer." },
  it: { title: "Passo dopo passo", guidance: "Trova prima il punto esatto in cui la prova o la regola decide la risposta." },
  es: { title: "Paso a paso", guidance: "Busca primero el punto exacto donde la prueba o la regla decide la respuesta." },
}

const reading: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Aussage und Zeile verbinden", guidance: "Unterstreiche das Schlüsselwort der Aussage und suche dieselbe Information im Text." },
  en: { title: "Connect claim and line", guidance: "Underline the key word in the claim, then find the same information in the German text." },
  it: { title: "Collega affermazione e riga", guidance: "Sottolinea la parola chiave e cerca la stessa informazione nel testo tedesco." },
  es: { title: "Relaciona afirmación y línea", guidance: "Subraya la palabra clave y busca la misma información en el texto alemán." },
}

const grammar: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Formen konsequent anpassen", guidance: "Benenne zuerst Regel, Zeitform oder Perspektive und kontrolliere dann Verb, Person und Pronomen im ganzen Satz." },
  en: { title: "Adjust every linked form", guidance: "First name the rule, tense, or perspective, then check the German verb, person, and pronouns throughout the sentence." },
  it: { title: "Adatta tutte le forme collegate", guidance: "Individua prima regola, tempo o prospettiva, poi controlla verbo, persona e pronomi in tutta la frase tedesca." },
  es: { title: "Adapta todas las formas relacionadas", guidance: "Identifica primero la regla, el tiempo o la perspectiva y revisa el verbo, la persona y los pronombres de toda la frase alemana." },
}

const vocabulary: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Den Kontext als Probe benutzen", guidance: "Setze jede Bedeutung in den ganzen Satz ein und streiche alles, was den Zusammenhang verändert." },
  en: { title: "Use the context as a test", guidance: "Put each meaning into the full German sentence and reject anything that changes the context." },
  it: { title: "Usa il contesto come prova", guidance: "Inserisci ogni significato nell'intera frase tedesca e scarta ciò che cambia il contesto." },
  es: { title: "Usa el contexto como prueba", guidance: "Coloca cada significado en la frase alemana completa y descarta lo que cambie el contexto." },
}

const wordFormation: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Wortart vor Wortbaustein", guidance: "Prüfe zuerst die Aufgabe des Wortes im Satz und markiere danach Stamm, Vor- oder Nachsilbe." },
  en: { title: "Word class before word parts", guidance: "First identify the German word's job in the sentence, then inspect its stem, prefix, or suffix." },
  it: { title: "Prima la categoria, poi i componenti", guidance: "Individua prima la funzione della parola tedesca nella frase, poi osserva radice, prefisso o suffisso." },
  es: { title: "Primero la categoría, luego las partes", guidance: "Identifica primero la función de la palabra alemana en la frase y después su raíz, prefijo o sufijo." },
}

const sentenceStructure: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Satzteile mit Fragen prüfen", guidance: "Nutze für jedes Satzglied die passende Frageprobe und kontrolliere danach Beziehung, Verbposition und eindeutige Zuordnung." },
  en: { title: "Test each sentence part with a question", guidance: "Use the matching German question test for each constituent, then check the relation, verb position, and one-to-one assignment." },
  it: { title: "Verifica ogni parte con una domanda", guidance: "Usa la domanda tedesca adatta per ogni costituente, poi controlla relazione, posizione del verbo e corrispondenza univoca." },
  es: { title: "Comprueba cada parte con una pregunta", guidance: "Usa la pregunta alemana adecuada para cada constituyente y revisa después la relación, la posición verbal y la correspondencia única." },
}

export function germanCoachingForTopic(topicId: GermanTopicId, locale: AppLocale): GermanCoachingCopy {
  if (topicId === "reading-evidence") return reading[locale]
  if (topicId === "vocabulary-context") return vocabulary[locale]
  if (topicId === "word-formation") return wordFormation[locale]
  if (topicId === "grammar-correction") return grammar[locale]
  if (topicId === "sentence-structure") return sentenceStructure[locale]
  return fallback[locale]
}
