import type { AppLocale } from "../../i18n/localization"
import type { GermanTopicId } from "./package"

export interface GermanCoachingCopy {
  title: string
  guidance: string
  commonHurdle: string
}

const fallback: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Schritt für Schritt", guidance: "Markiere zuerst Textsorte, Pflichtangaben und Reihenfolge. Schreibe erst danach den ersten Satz.", commonHurdle: "Oft beginnt das Schreiben sofort, bevor Textsorte, Pflichtangaben und Reihenfolge klar sind." },
  en: { title: "Step by step", guidance: "First mark the text type, required points, and order. Only then write the first sentence.", commonHurdle: "Writing often starts immediately, before the text type, required points, and order are clear." },
  it: { title: "Passo dopo passo", guidance: "Individua prima il tipo di testo, i punti obbligatori e l'ordine. Solo dopo scrivi la prima frase.", commonHurdle: "Spesso si comincia subito a scrivere, prima di chiarire il tipo di testo, i punti obbligatori e l'ordine." },
  es: { title: "Paso a paso", guidance: "Marca primero el tipo de texto, los puntos obligatorios y el orden. Solo después escribe la primera frase.", commonHurdle: "A menudo se empieza a escribir enseguida, antes de aclarar el tipo de texto, los puntos obligatorios y el orden." },
}

const reading: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Aussage und Zeile verbinden", guidance: "Unterstreiche das Schlüsselwort der Aussage und suche dieselbe Information im Text.", commonHurdle: "Eine Aussage klingt passend, wird aber gewählt, ohne die genaue Textstelle zu prüfen." },
  en: { title: "Connect claim and line", guidance: "Underline the key word in the claim, then find the same information in the German text.", commonHurdle: "A claim sounds plausible but is chosen without checking the exact supporting line." },
  it: { title: "Collega affermazione e riga", guidance: "Sottolinea la parola chiave e cerca la stessa informazione nel testo tedesco.", commonHurdle: "Un'affermazione sembra plausibile, ma viene scelta senza controllare la riga precisa che la sostiene." },
  es: { title: "Relaciona afirmación y línea", guidance: "Subraya la palabra clave y busca la misma información en el texto alemán.", commonHurdle: "Una afirmación parece plausible, pero se elige sin comprobar la línea exacta que la apoya." },
}

const grammar: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Formen konsequent anpassen", guidance: "Benenne zuerst Regel, Zeitform oder Perspektive und kontrolliere dann Verb, Person und Pronomen im ganzen Satz.", commonHurdle: "Eine Form wird richtig geändert, aber die dazugehörigen Verben oder Pronomen bleiben in der alten Form." },
  en: { title: "Adjust every linked form", guidance: "First name the rule, tense, or perspective, then check the German verb, person, and pronouns throughout the sentence.", commonHurdle: "One form is changed correctly, but linked verbs or pronouns are left in the old form." },
  it: { title: "Adatta tutte le forme collegate", guidance: "Individua prima regola, tempo o prospettiva, poi controlla verbo, persona e pronomi in tutta la frase tedesca.", commonHurdle: "Una forma viene modificata correttamente, ma i verbi o i pronomi collegati restano nella forma precedente." },
  es: { title: "Adapta todas las formas relacionadas", guidance: "Identifica primero la regla, el tiempo o la perspectiva y revisa el verbo, la persona y los pronombres de toda la frase alemana.", commonHurdle: "Una forma se cambia correctamente, pero los verbos o pronombres relacionados se quedan en la forma anterior." },
}

const vocabulary: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Den Kontext als Probe benutzen", guidance: "Setze jede Bedeutung in den ganzen Satz ein und streiche alles, was den Zusammenhang verändert.", commonHurdle: "Die bekannteste Bedeutung eines Wortes wird gewählt, obwohl sie im ganzen Satz nicht passt." },
  en: { title: "Use the context as a test", guidance: "Put each meaning into the full German sentence and reject anything that changes the context.", commonHurdle: "The most familiar meaning is chosen even though it does not fit the whole sentence." },
  it: { title: "Usa il contesto come prova", guidance: "Inserisci ogni significato nell'intera frase tedesca e scarta ciò che cambia il contesto.", commonHurdle: "Si sceglie il significato più familiare, anche se non si adatta all'intera frase." },
  es: { title: "Usa el contexto como prueba", guidance: "Coloca cada significado en la frase alemana completa y descarta lo que cambie el contexto.", commonHurdle: "Se elige el significado más conocido aunque no encaje en la frase completa." },
}

const wordFormation: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Wortart vor Wortbaustein", guidance: "Prüfe zuerst die Aufgabe des Wortes im Satz und markiere danach Stamm, Vor- oder Nachsilbe.", commonHurdle: "Ein verwandtes Wort wird gebildet, aber es hat nicht die verlangte Wortart." },
  en: { title: "Word class before word parts", guidance: "First identify the German word's job in the sentence, then inspect its stem, prefix, or suffix.", commonHurdle: "A related word is formed, but it is not the word class required by the sentence." },
  it: { title: "Prima la categoria, poi i componenti", guidance: "Individua prima la funzione della parola tedesca nella frase, poi osserva radice, prefisso o suffisso.", commonHurdle: "Si forma una parola collegata, ma non appartiene alla categoria richiesta dalla frase." },
  es: { title: "Primero la categoría, luego las partes", guidance: "Identifica primero la función de la palabra alemana en la frase y después su raíz, prefijo o sufijo.", commonHurdle: "Se forma una palabra relacionada, pero no pertenece a la categoría que exige la frase." },
}

const sentenceStructure: Record<AppLocale, GermanCoachingCopy> = {
  de: { title: "Satzteile mit Fragen prüfen", guidance: "Nutze für jedes Satzglied die passende Frageprobe und kontrolliere danach Beziehung, Verbposition und eindeutige Zuordnung.", commonHurdle: "Die Beziehung zwischen den Aussagen stimmt, aber die Verbposition nach der Verknüpfung bleibt ungeprüft." },
  en: { title: "Test each sentence part with a question", guidance: "Use the matching German question test for each constituent, then check the relation, verb position, and one-to-one assignment.", commonHurdle: "The relationship between the clauses is correct, but the German verb position after the connector is not checked." },
  it: { title: "Verifica ogni parte con una domanda", guidance: "Usa la domanda tedesca adatta per ogni costituente, poi controlla relazione, posizione del verbo e corrispondenza univoca.", commonHurdle: "Il rapporto tra le proposizioni è corretto, ma non viene controllata la posizione del verbo tedesco dopo il connettivo." },
  es: { title: "Comprueba cada parte con una pregunta", guidance: "Usa la pregunta alemana adecuada para cada constituyente y revisa después la relación, la posición verbal y la correspondencia única.", commonHurdle: "La relación entre las oraciones es correcta, pero no se comprueba la posición del verbo alemán después del conector." },
}

export function germanCoachingForTopic(topicId: GermanTopicId, locale: AppLocale): GermanCoachingCopy {
  if (topicId === "reading-evidence") return reading[locale]
  if (topicId === "vocabulary-context") return vocabulary[locale]
  if (topicId === "word-formation") return wordFormation[locale]
  if (topicId === "grammar-correction") return grammar[locale]
  if (topicId === "sentence-structure") return sentenceStructure[locale]
  return fallback[locale]
}
