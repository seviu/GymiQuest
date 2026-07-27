import type { GermanLessonId, GermanTopicId } from "./package"

export interface GermanTopicDefinition {
  id: GermanTopicId
  title: string
  shortTitle: string
  description: string
  courseOrder: number
  availableInPilot: boolean
  prerequisiteIds: readonly GermanTopicId[]
}

export interface GermanLessonDefinition {
  id: GermanLessonId
  topicId: GermanTopicId
  title: string
  goal: string
  introduction: {
    eyebrow: string
    title: string
    body: string
    steps: readonly string[]
    takeaway: string
  }
}

export type GermanTopicTheory = GermanLessonDefinition["introduction"]

export interface GermanPassageLine {
  number: number
  text: string
}

export interface GermanMicrotext {
  id: string
  title: string
  lines: readonly GermanPassageLine[]
}

export const germanTopics: Record<GermanTopicId, GermanTopicDefinition> = {
  "reading-evidence": {
    id: "reading-evidence",
    title: "Aussagen mit Textstellen belegen",
    shortTitle: "Leseverständnis",
    description: "Eine Aussage prüfen und die genaue Textstelle finden, die sie trägt.",
    courseOrder: 1,
    availableInPilot: true,
    prerequisiteIds: [],
  },
  "vocabulary-context": {
    id: "vocabulary-context",
    title: "Wortbedeutungen aus dem Zusammenhang erschliessen",
    shortTitle: "Wortschatz im Kontext",
    description: "Die passende Bedeutung eines Wortes aus Satz und Text bestimmen.",
    courseOrder: 2,
    availableInPilot: true,
    prerequisiteIds: ["reading-evidence"],
  },
  "word-formation": {
    id: "word-formation",
    title: "Wortarten bestimmen und Wörter bilden",
    shortTitle: "Wortbildung",
    description: "Wortarten erkennen sowie Stamm, Vorsilbe und Endung gezielt verändern.",
    courseOrder: 3,
    availableInPilot: true,
    prerequisiteIds: ["vocabulary-context"],
  },
  "grammar-correction": {
    id: "grammar-correction",
    title: "Grammatikformen erkennen, korrigieren und umformen",
    shortTitle: "Grammatik und Orthografie",
    description: "Fehler präzise korrigieren sowie Zeitform und Perspektive konsequent anpassen.",
    courseOrder: 4,
    availableInPilot: true,
    prerequisiteIds: [],
  },
  "sentence-structure": {
    id: "sentence-structure",
    title: "Satzglieder, Verknüpfungen und Satzbau sicher ordnen",
    shortTitle: "Satzbau",
    description: "Satzteile erkennen, ihren Funktionen zuordnen, verschieben und mit passenden Konjunktionen verbinden.",
    courseOrder: 5,
    availableInPilot: true,
    prerequisiteIds: ["grammar-correction"],
  },
  writing: {
    id: "writing",
    title: "Texte planen, verfassen und überarbeiten",
    shortTitle: "Text verfassen",
    description: "Erzählperspektive, Zeitform und Aufbau bewusst einsetzen.",
    courseOrder: 6,
    availableInPilot: true,
    prerequisiteIds: ["reading-evidence", "vocabulary-context", "grammar-correction", "sentence-structure"],
  },
}

export const germanLessons: Record<GermanLessonId, GermanLessonDefinition> = {
  "german-reading-evidence-v1": {
    id: "german-reading-evidence-v1",
    topicId: "reading-evidence",
    title: "Die stärkste Textstelle finden",
    goal: "Du kannst eine Aussage mit der genau passenden Zeile belegen.",
    introduction: {
      eyebrow: "LESEN MIT BELEGEN",
      title: "Nicht raten: zur Aussage zurück in den Text",
      body: "Eine gute Antwort lässt sich am Text zeigen. Suche zuerst die Schlüsselwörter der Aussage und prüfe dann, welche Zeile genau dieselbe Information ausdrückt.",
      steps: [
        "Markiere das Schlüsselwort in der Aussage.",
        "Suche die Stelle, an der dieselbe Information steht.",
        "Wähle nur die Zeile, die den Beleg vollständig enthält.",
      ],
      takeaway: "Der beste Beleg ist genau genug und braucht keine Vermutung.",
    },
  },
  "german-vocabulary-context-v1": {
    id: "german-vocabulary-context-v1",
    topicId: "vocabulary-context",
    title: "Wortbedeutungen aus dem Text erschliessen",
    goal: "Du kannst Satz und Text nutzen, um die passende Bedeutung eines Wortes zu bestimmen.",
    introduction: {
      eyebrow: "WÖRTER IM ZUSAMMENHANG",
      title: "Der Kontext entscheidet, welche Bedeutung passt",
      body: "Ein unbekanntes Wort steht nie allein. Die Wörter davor und danach zeigen, welche Bedeutung an dieser Stelle sinnvoll ist.",
      steps: [
        "Lies den ganzen Satz mit dem Zielwort.",
        "Ersetze das Zielwort probeweise durch jede Bedeutung.",
        "Wähle nur die Bedeutung, die zum gesamten Text passt.",
      ],
      takeaway: "Eine passende Bedeutung erklärt den Satz, ohne neue Informationen zu erfinden.",
    },
  },
  "german-word-formation-v1": {
    id: "german-word-formation-v1",
    topicId: "word-formation",
    title: "Wortarten, Wortstämme und Bausteine sicher erkennen",
    goal: "Du kannst Wortarten bestimmen und gezielt ein verwandtes Nomen, Verb oder Adjektiv bilden.",
    introduction: {
      eyebrow: "WORTFAMILIEN BAUEN",
      title: "Stamm erkennen, Auftrag lesen, Form bilden",
      body: "Bestimme zuerst, ob ein Wort als Nomen, Verb, Adjektiv oder andere Wortart gebraucht wird. Wörter einer Familie teilen einen Stamm; Vor- und Nachsilben verändern Bedeutung oder Wortart.",
      steps: [
        "Bestimme die Wortart im Satz oder im Auftrag.",
        "Markiere danach den gemeinsamen Wortstamm.",
        "Kontrolliere Endung, Grossschreibung und mögliche Stammänderung.",
      ],
      takeaway: "Nicht irgendein verwandtes Wort passt, sondern genau die verlangte Wortart.",
    },
  },
  "german-grammar-correction-v1": {
    id: "german-grammar-correction-v1",
    topicId: "grammar-correction",
    title: "Fehler, Zeitform und Perspektive kontrollieren",
    goal: "Du kannst einen Fehler präzise korrigieren und Sätze sicher in eine verlangte Zeitform oder Perspektive übertragen.",
    introduction: {
      eyebrow: "GRAMMATIKFORMEN MIT SYSTEM",
      title: "Prüfe zuerst, welche Form verlangt ist",
      body: "Prüfe bei Korrekturen genau eine fehlerhafte Stelle. Bei Umformungen müssen Zeitform, Person, Verb und Pronomen konsequent zusammenpassen.",
      steps: [
        "Lies den ganzen Satz einmal laut oder langsam.",
        "Benenne die verlangte Regel, Zeitform oder Erzählperspektive.",
        "Kontrolliere Verbform, Person und Pronomen im ganzen Satz.",
      ],
      takeaway: "Eine sichere Lösung passt alle zusammengehörenden Formen an, aber verändert nichts Unnötiges.",
    },
  },
  "german-sentence-structure-v1": {
    id: "german-sentence-structure-v1",
    topicId: "sentence-structure",
    title: "Satzglieder zuordnen, Verknüpfungen wählen und Reihenfolge kontrollieren",
    goal: "Du kannst mehrere Satzteile ihren Funktionen zuordnen, passende Verknüpfungen wählen und die Verbposition kontrollieren.",
    introduction: {
      eyebrow: "SATZBAU MIT SYSTEM",
      title: "Erst die Satzteile, dann ihre Position prüfen",
      body: "Satzglieder können ihren Funktionen zugeordnet und als Einheit verschoben werden. Konjunktionen zeigen Ursache, Gegensatz, Zweck oder Zeit und bestimmen mit, wo das Verb steht.",
      steps: [
        "Suche zuerst das konjugierte Verb.",
        "Ordne Subjekt, Objekte und Angaben mit den passenden Frageproben zu oder bestimme die Beziehung zwischen zwei Aussagen.",
        "Wähle die passende Verknüpfung und prüfe danach die Verbposition.",
      ],
      takeaway: "Die Verknüpfung zeigt die Beziehung; die Satzart bestimmt die Position des konjugierten Verbs.",
    },
  },
}

export const germanTheoryByTopic: Readonly<Record<GermanTopicId, GermanTopicTheory>> = Object.freeze({
  "reading-evidence": germanLessons["german-reading-evidence-v1"].introduction,
  "vocabulary-context": germanLessons["german-vocabulary-context-v1"].introduction,
  "word-formation": germanLessons["german-word-formation-v1"].introduction,
  "grammar-correction": germanLessons["german-grammar-correction-v1"].introduction,
  "sentence-structure": germanLessons["german-sentence-structure-v1"].introduction,
  writing: {
    eyebrow: "TEXTE MIT PLAN",
    title: "Erst planen, dann schreiben, dann prüfen",
    body: "Ein guter Text entsteht in drei ruhigen Schritten. Lies zuerst den Auftrag genau, ordne deine Ideen und kontrolliere am Schluss nur die Punkte, die wirklich verlangt sind.",
    steps: [
      "Markiere Textsorte, Thema und Pflichtangaben im Auftrag.",
      "Plane Anfang, Hauptteil und Schluss oder notiere die wichtigen W-Fragen.",
      "Bleibe bei derselben Zeitform und Erzählperspektive.",
      "Prüfe Aufbau, Verständlichkeit, Grammatik und Rechtschreibung einzeln.",
    ],
    takeaway: "Ein kurzer Plan hält den roten Faden fest und macht die Schlusskontrolle leichter.",
  },
})

export const germanMicrotexts: readonly GermanMicrotext[] = Object.freeze([
  {
    id: "lost-key",
    title: "Der Schlüssel im Kräutergarten",
    lines: [
      { number: 1, text: "Mara bemerkte den fehlenden Schlüssel erst vor der Haustür." },
      { number: 2, text: "Sie ging den Heimweg langsam zurück und sah unter jede Bank." },
      { number: 3, text: "Beim Kräutergarten glitzerte etwas zwischen den nassen Steinen." },
      { number: 4, text: "Erleichtert hob sie den Schlüssel auf und lief nach Hause." },
    ],
  },
  {
    id: "library-window",
    title: "Ein heller Platz",
    lines: [
      { number: 1, text: "Noah kam früher als sonst in die Quartierbibliothek." },
      { number: 2, text: "Der Tisch am Fenster war noch frei, obwohl dort meist jemand sass." },
      { number: 3, text: "Er legte sein Heft hin und öffnete das Buch über Zugvögel." },
      { number: 4, text: "Als seine Freundin eintraf, hatte er bereits zwei Seiten Notizen geschrieben." },
    ],
  },
  {
    id: "rain-rehearsal",
    title: "Die Probe im Regen",
    lines: [
      { number: 1, text: "Kurz vor der Theaterprobe begann es heftig zu regnen." },
      { number: 2, text: "Die Gruppe trug die Requisiten deshalb durch den Hintereingang." },
      { number: 3, text: "Im Saal fehlte zwar das Sonnenlicht, doch alle Kulissen blieben trocken." },
      { number: 4, text: "Die Probe startete zehn Minuten später und endete trotzdem pünktlich." },
    ],
  },
  {
    id: "bike-bell",
    title: "Die leise Klingel",
    lines: [
      { number: 1, text: "Vor der Ausfahrt prüfte Elin die Bremsen und den Luftdruck." },
      { number: 2, text: "Als sie die Klingel testete, war kaum ein Ton zu hören." },
      { number: 3, text: "Ihr Bruder zog eine lockere Schraube fest und versuchte es erneut." },
      { number: 4, text: "Nun klang die Klingel klar, und die beiden konnten losfahren." },
    ],
  },
])

export const germanStartCheckQuestions = Object.freeze([
  {
    id: "start-reading",
    topicId: "reading-evidence" as const,
    skill: "Leseverständnis",
    prompt: "Lea stellte den nassen Schirm vor die Tür. Welche Aussage ist sicher?",
    options: ["Draussen regnete es.", "Lea hatte den Schirm gekauft.", "Die Tür war verschlossen."],
    correctIndex: 0,
    explanation: "Der nasse Schirm ist der sichere Textbeleg für Regen. Über einen Kauf oder den Zustand der Tür steht nichts im Satz.",
  },
  {
    id: "start-vocabulary",
    topicId: "vocabulary-context" as const,
    skill: "Wortschatz",
    prompt: "Im Satz «Der Weg war beschwerlich» bedeutet «beschwerlich» am ehesten …",
    options: ["anstrengend", "unsichtbar", "kurz"],
    correctIndex: 0,
    explanation: "«Beschwerlich» beschreibt etwas Mühsames oder Anstrengendes. Die Bedeutung ergibt sich hier aus der Beschreibung des Weges.",
  },
  {
    id: "start-word-formation",
    topicId: "word-formation" as const,
    skill: "Wortbildung",
    prompt: "Welches Nomen gehört zum Verb «entscheiden»?",
    options: ["Entscheidung", "Entschied", "Entscheidbar"],
    correctIndex: 0,
    explanation: "Das Nomen zum Verb «entscheiden» lautet «die Entscheidung». «Entschied» ist eine Verbform, «entscheidbar» ein Adjektiv.",
  },
  {
    id: "start-grammar",
    topicId: "grammar-correction" as const,
    skill: "Grammatik",
    prompt: "Welcher Satz ist korrekt?",
    options: ["Ihr seid heute früh hier.", "Ihr seit heute früh hier.", "Ihr seidt heute früh hier."],
    correctIndex: 0,
    explanation: "«Seid» ist die Verbform von «sein» für «ihr». «Seit» bezeichnet einen Zeitpunkt oder Zeitraum; «seidt» gibt es nicht.",
  },
  {
    id: "start-sentence",
    topicId: "sentence-structure" as const,
    skill: "Satzbau",
    prompt: "Welche Fortsetzung passt? «Obwohl der Bus verspätet war, …»",
    options: ["kamen wir rechtzeitig an.", "wir kamen rechtzeitig an.", "aber kamen wir rechtzeitig an."],
    correctIndex: 0,
    explanation: "Nach dem vorangestellten Nebensatz folgt im Hauptsatz das konjugierte Verb zuerst: «…, kamen wir rechtzeitig an.»",
  },
])
