import { lessons, topics } from "./content"
import { getTopicGuidance } from "./answerDiagnosis"
import { topicIds, type TopicId } from "./model"
import type { ParentExplanationLanguage } from "./parentAccess"
import { spanishTopicCoaching } from "./parentCoaching.es"

export interface ParentTopicCoachingCopy {
  title: string
  description: string
  goal: string
  ideaTitle: string
  idea: string
  commonHurdle: string
  nextStep: string
  workedSteps: string[]
  takeaway: string
  teachBackPrompt: string
  prerequisiteTitles: string[]
}

export type TopicCoachingContent = Omit<ParentTopicCoachingCopy, "prerequisiteTitles" | "teachBackPrompt">

const englishTopicCoaching = {
  "arithmetic-equations": {
    title: "Find missing numbers by working backwards",
    description: "Undo multiplication and division in the reverse order.",
    goal: "You can solve a calculation chain backwards from its known result.",
    ideaTitle: "Undo each operation",
    idea: "Start at the result. Reverse the order of the operations and replace each one with its inverse: multiplication becomes division, and division becomes multiplication.",
    commonHurdle: "The operations are undone in their original order instead of from last to first.",
    nextStep: "Write the chain as arrows, begin at the result, and reverse one arrow at a time.",
    workedSteps: ["(□ × 6) ÷ 8 = 27", "27 × 8 = 216", "216 ÷ 6 = 36"],
    takeaway: "Start at the result: reverse the order and use inverse operations.",
  },
  "efficient-arithmetic": {
    title: "Recognise and use efficient calculation structures",
    description: "Spot common factors and round sums or differences before calculating.",
    goal: "You can factor out a shared number and calculate with a round total.",
    ideaTitle: "Look for the shared factor first",
    idea: "Two long multiplications may hide one short calculation. When the same factor appears twice, factor it out and combine the remaining numbers first.",
    commonHurdle: "Both products are calculated separately, so the useful shared structure is missed.",
    nextStep: "Circle the repeated factor and put the two remaining numbers in brackets.",
    workedSteps: ["18 × 47 + 18 × 53", "18 × (47 + 53)", "18 × 100 = 1800"],
    takeaway: "Simplify the structure before doing the arithmetic.",
  },
  "mass-units": {
    title: "Convert kilograms and grams confidently",
    description: "Convert masses between kilograms and grams.",
    goal: "You can convert kilograms and grams accurately without a calculator.",
    ideaTitle: "One kilogram is 1,000 grams",
    idea: "A value becomes 1,000 times larger when kilograms are written as grams, and 1,000 times smaller when grams are written as kilograms.",
    commonHurdle: "The correct factor is known, but multiplication and division are used in the wrong direction.",
    nextStep: "Say the target unit aloud and estimate whether the number itself should become larger or smaller.",
    workedSteps: ["kg → g: multiply by 1,000", "g → kg: divide by 1,000"],
    takeaway: "The target unit tells you which conversion direction to use.",
  },
  "fraction-of-quantity": {
    title: "Find a fraction of a quantity",
    description: "Calculate a fraction such as 3/4 of a given quantity.",
    goal: "You can find a fraction of a quantity and explain the calculation.",
    ideaTitle: "Divide first, then take the required parts",
    idea: "The denominator tells you how many equal parts make the whole. The numerator tells you how many of those parts you need.",
    commonHurdle: "The numerator and denominator are swapped, or both operations are attempted at once.",
    nextStep: "Find one part using the denominator, then multiply that one part by the numerator.",
    workedSteps: ["48 ÷ 4 = 12", "12 × 3 = 36", "Therefore 3/4 of 48 is 36."],
    takeaway: "Denominator: divide. Numerator: multiply.",
  },
  "time-fractions": {
    title: "Calculate fractions of time intervals",
    description: "Put hours and minutes into one unit before finding a fraction.",
    goal: "You can find fractions of a time interval without mixing hours and minutes.",
    ideaTitle: "Convert everything to minutes first",
    idea: "Fraction calculations are reliable only when the entire interval uses one unit. Convert back to hours only after the fraction has been found.",
    commonHurdle: "Hours and minutes are treated as if they were decimal parts of the same number.",
    nextStep: "Write the complete duration in minutes on a separate line before using the fraction.",
    workedSteps: ["2 h 20 min = 140 min", "1/7 of it: 140 ÷ 7 = 20 min", "3/7 of it: 20 × 3 = 60 min"],
    takeaway: "All times need the same unit before using a fraction.",
  },
  "speed-distance-time": {
    title: "Connect distance, time, and speed",
    description: "Calculate average speed and catch-up distances across several time periods.",
    goal: "You can reduce a motion problem to distance, time, and speed.",
    ideaTitle: "An average needs total distance and total time",
    idea: "Speeds cannot usually be averaged directly. Find each section's time, add all distances and times, and divide only at the end.",
    commonHurdle: "Two speeds are averaged even though the corresponding times or distances differ.",
    nextStep: "Create one row per section with distance, time, and speed, then total the first two columns.",
    workedSteps: ["Time = distance ÷ speed", "Add total distance and total time", "Average speed = total distance ÷ total time"],
    takeaway: "Average speed is total distance divided by total time.",
  },
  "data-tables": {
    title: "Connect data in tables accurately",
    description: "Read rows and columns deliberately and reconstruct missing values or averages.",
    goal: "You can connect the correct row and column without mixing unrelated values.",
    ideaTitle: "Label every number before calculating",
    idea: "A table gives meaning through its row and column headings. Select only the cells needed for the question and state whether you need a total, difference, remainder, or missing average.",
    commonHurdle: "A mathematically correct calculation uses a value from the wrong row or column.",
    nextStep: "Trace from the row label and column heading to each selected cell before writing the equation.",
    workedSteps: ["Mark the required row and column", "Write the relevant values with units", "Choose the relationship", "Check the result against the table"],
    takeaway: "Correct arithmetic with the wrong cell still gives a wrong answer.",
  },
  "money-calculations": {
    title: "Connect prices, quantities, and revenue",
    description: "Find group prices or quantities from prices and revenue.",
    goal: "You can move in either direction between price, quantity, and revenue.",
    ideaTitle: "Price × quantity = revenue",
    idea: "Every row in a price table uses the same relationship. If quantity is missing, divide revenue by the price.",
    commonHurdle: "The learner multiplies when the missing quantity requires division, or omits the currency unit.",
    nextStep: "Name the unknown first, then cover it in the relationship price × quantity = revenue.",
    workedSteps: ["Group revenue: multiply each quantity by its price", "Quantity: revenue ÷ unit price"],
    takeaway: "First identify which of the three quantities is missing.",
  },
  "proportional-revenue": {
    title: "Solve ratios in revenue tables",
    description: "Remove known revenue and bundle groups in a fixed ratio.",
    goal: "You can solve a revenue table when two groups occur in a fixed ratio.",
    ideaTitle: "Turn the ratio into one repeatable bundle",
    idea: "If there are twice as many children as adults, one bundle contains two child tickets and one adult ticket. The remaining revenue is made from whole bundles.",
    commonHurdle: "The ratio is treated as a difference, rather than as groups that repeat together.",
    nextStep: "Draw one complete ratio bundle and calculate its combined price before dividing the remaining revenue.",
    workedSteps: ["Subtract known revenue from the total", "Calculate one ratio bundle's price", "Divide the remainder by the bundle price", "Recover the requested group count"],
    takeaway: "A ratio is easier when it becomes a repeatable bundle.",
  },
  "integer-combinations": {
    title: "Find every integer combination systematically",
    description: "List all combinations without gaps or duplicate cases.",
    goal: "You can justify that a list of integer combinations is complete.",
    ideaTitle: "Fix one value and vary the next in order",
    idea: "Start with a fixed count of the largest item. Increase the middle count one step at a time and calculate the remaining count each time.",
    commonHurdle: "Plausible combinations are guessed, leaving gaps or counting the same case twice.",
    nextStep: "Use an ordered table and change only one column at a time until the remainder becomes negative.",
    workedSteps: ["Reserve at least one item of each type", "Fix the largest type", "Increase the middle type one at a time", "Move to the next largest count when the remainder is negative"],
    takeaway: "An ordered table prevents gaps and double-counting.",
  },
  "number-constraints": {
    title: "Find all numbers satisfying several constraints",
    description: "Combine digits, divisibility, and place-value conditions into a complete solution set.",
    goal: "You can find every number that satisfies several conditions simultaneously.",
    ideaTitle: "Use the strongest filter first",
    idea: "Begin with a divisibility rule or fixed ending. Arrange the remaining digits only afterwards, then check the place-value condition.",
    commonHurdle: "Candidates are checked against one condition but not against all of them, or valid arrangements are skipped.",
    nextStep: "Make one filter column per condition and retain a candidate only when it passes every column.",
    workedSteps: ["Apply divisibility to possible endings", "Arrange remaining digits systematically", "Check the place-value condition", "Remove duplicates and prove completeness"],
    takeaway: "Each condition is a filter; every final answer must pass them all.",
  },
  "area-fractions": {
    title: "Count and simplify fractions of area",
    description: "Translate differently sized tiles into equal units of area.",
    goal: "You can count different tiles using one common area unit.",
    ideaTitle: "Count area, not the number of tiles",
    idea: "One 2×2 tile covers the same area as four unit tiles. Convert everything to unit squares before forming and simplifying the fraction.",
    commonHurdle: "Large and small tiles are each counted as one object even though they cover different areas.",
    nextStep: "Draw or count unit squares underneath every tile before writing the numerator and denominator.",
    workedSteps: ["Count total area in unit squares", "Convert each large tile to four units", "Form white area ÷ total area", "Simplify fully"],
    takeaway: "The numerator and denominator must use the same area unit.",
  },
  "composite-areas": {
    title: "Decompose composite areas",
    description: "Calculate frames, cut-outs, and notches by adding or subtracting rectangles.",
    goal: "You can split a composite shape into familiar rectangles.",
    ideaTitle: "Begin with a simple outer rectangle",
    idea: "Frames and L-shapes often become simpler when you calculate the enclosing rectangle and subtract cut-outs. For perimeter, follow every exposed edge instead.",
    commonHurdle: "Area and perimeter methods are mixed, or an internal edge is counted as part of the outside boundary.",
    nextStep: "Mark the task as AREA or PERIMETER, then shade either the inside pieces or trace only the outer boundary.",
    workedSteps: ["Identify the outer rectangle", "Find missing internal lengths", "Add pieces or subtract the cut-out", "For perimeter, count each boundary segment once"],
    takeaway: "Area measures the inside; perimeter follows the boundary.",
  },
  "tiling-costs": {
    title: "Tile an area at minimum cost",
    description: "Consider geometric fit and cost per area together.",
    goal: "You can find the cheapest valid mixture of small and large tiles.",
    ideaTitle: "Compare the cost per covered area first",
    idea: "A large tile covers four unit squares. If it costs less than four small tiles, use as many large tiles as can actually fit in the rectangle.",
    commonHurdle: "The cheapest price per area is chosen without checking whether the large tiles fit the dimensions.",
    nextStep: "Compare prices, then draw the maximum valid 2×2 placement and count the leftover unit squares.",
    workedSteps: ["Compare one large tile with four small tiles", "Find how many 2×2 tiles fit", "Fill leftover area with small tiles", "Add both costs"],
    takeaway: "Cheaper per area is useful only when the large tiles also fit.",
  },
  "reverse-fractions": {
    title: "Work backwards from a known fraction",
    description: "Recover the original whole from a known fractional part.",
    goal: "You can find an original quantity from a known fraction of it.",
    ideaTitle: "Find one equal part first",
    idea: "If 3/4 of a mass is 18 kg, then 18 kg represents three equal parts. Divide to find one part, then multiply to rebuild all four parts.",
    commonHurdle: "The forward fraction method is repeated, producing a result smaller than the known remaining part.",
    nextStep: "Label how many equal parts the known amount represents, find one part, and then rebuild the whole.",
    workedSteps: ["3 parts are 18 kg", "1 part is 18 ÷ 3 = 6 kg", "4 parts are 6 × 4 = 24 kg", "Check: 3/4 of 24 kg is 18 kg"],
    takeaway: "Divide by the numerator, then multiply by the denominator.",
  },
  "reverse-chains": {
    title: "Solve multi-step processes backwards",
    description: "Undo several changes in the correct reverse order.",
    goal: "You can solve a word problem backwards from its final known quantity.",
    ideaTitle: "Start where the value is certain",
    idea: "The most reliable value is often at the end of the story. Undo each change in reverse order and keep one operation on each line.",
    commonHurdle: "The right inverse operations are used, but in the same order as the story rather than the reverse order.",
    nextStep: "Write the story as a forward arrow chain, then follow those arrows backwards one at a time.",
    workedSteps: ["Find the total content of all containers", "Undo the processing loss", "Restore the rejected material", "Add back the transport loss"],
    takeaway: "Write each backwards step on its own line.",
  },
  "inverse-proportion": {
    title: "Understand inverse proportion",
    description: "Recognise when fewer people can use the same resource for proportionally longer.",
    goal: "You can identify and use a constant total such as person-days.",
    ideaTitle: "People × days stays constant",
    idea: "When the same resource is shared by fewer people, it lasts longer. Person-days represent the entire fixed resource.",
    commonHurdle: "The number of days is changed in the same direction as the number of people, as if the relationship were direct.",
    nextStep: "Calculate the fixed person-day total first and divide it by the new number of people.",
    workedSteps: ["40 people × 24 days = 960 person-days", "960 ÷ 30 people = 32 days", "Extension: 32 − 24 = 8 days"],
    takeaway: "When one quantity decreases, the other increases in the matching ratio.",
  },
  "changing-rates": {
    title: "Calculate consumption across changing phases",
    description: "Find the remaining resource before calculating a new duration.",
    goal: "You can track a fixed resource through several consumption phases.",
    ideaTitle: "Subtract what has already been consumed",
    idea: "When the number of people changes, the original duration no longer applies. Keep the resource in person-days, remove the first phase, then calculate the second.",
    commonHurdle: "The new group is applied to the original full resource instead of to what remains.",
    nextStep: "Draw a clear phase boundary and write total, used, and remaining person-days before the final division.",
    workedSteps: ["Calculate total person-days", "Subtract consumption in the first phase", "Divide the remainder by the new number of people"],
    takeaway: "At every change point, recalculate from the remaining resource.",
  },
  "geometric-loci": {
    title: "Construct regions from geometric conditions",
    description: "Interpret distances, circles, and perpendicular bisectors as boundaries of a region.",
    goal: "You can translate verbal distance conditions into geometric boundaries.",
    ideaTitle: "Each condition creates a geometric boundary",
    idea: "Equal distance from two points gives a perpendicular bisector. Fixed distance from a point gives a circle; fixed distance from a line gives a parallel line.",
    commonHurdle: "A correct boundary is drawn, but the wrong side, scale, or intersection region is selected.",
    nextStep: "For each condition, name the boundary and test one point to decide which side is allowed.",
    workedSteps: ["Convert the scale to drawing units", "Construct one boundary per condition", "Mark the allowed side or inside/outside region", "Intersect all allowed regions"],
    takeaway: "The solution is the intersection of every allowed region.",
  },
  "coordinate-transformations": {
    title: "Reflect, rotate, and translate points",
    description: "Apply coordinate rules for reflections, quarter-turns, and translations.",
    goal: "You can transform a point using a precise coordinate rule.",
    ideaTitle: "Change x and y according to one fixed rule",
    idea: "A transformation is not freehand drawing. Its axis, angle, or vector determines which coordinate stays, changes sign, swaps position, or receives an offset.",
    commonHurdle: "Both signs are changed automatically, or x and y are swapped when the chosen transformation does not require it.",
    nextStep: "Write the symbolic rule first, apply it to x and y separately, and check the resulting quadrant.",
    workedSteps: ["Write the start point (x, y)", "Apply the rule to both coordinates", "Plot the image point (x′, y′)", "Check its quadrant and distance"],
    takeaway: "Write the symbolic rule before substituting the numbers.",
  },
  "cube-nets": {
    title: "Fold cube nets mentally",
    description: "Determine neighbouring and opposite faces by folding a net in space.",
    goal: "You can fold a cube net face by face and identify opposite faces reliably.",
    ideaTitle: "Fold across one edge at a time",
    idea: "Choose one face as the base. Direct neighbours fold up as sides; a later face may become the top. Track the spatial direction after every fold.",
    commonHurdle: "Two faces that touch in the flat net are incorrectly identified as opposite faces.",
    nextStep: "Fix one base face and assign each folded neighbour a direction: front, back, left, right, or top.",
    workedSteps: ["Fix a starting face", "Fold direct neighbours up as sides", "Continue across one edge at a time", "Pair faces that point in opposite directions"],
    takeaway: "Faces sharing an edge in the net can never be opposite on the cube.",
  },
  "spatial-rolling": {
    title: "Track a pyramid while it rolls",
    description: "Follow every face reliably as the solid tips across edges.",
    goal: "You can track each face of a triangular pyramid through a sequence of rolls.",
    ideaTitle: "The face beyond the tipping edge becomes the base",
    idea: "Before each roll, name the base and the three side faces. Update the complete orientation after one edge before attempting the next roll.",
    commonHurdle: "Several rolls are imagined at once, so the orientation from an earlier step is lost.",
    nextStep: "Use a four-position table and rewrite base, left, right, and rear after every single roll.",
    workedSteps: ["Mark the tipping edge", "Move the adjacent side face to the base", "Move the old base to the tipping side", "Update the remaining sides", "Label the complete new orientation"],
    takeaway: "Do not track the whole path at once—update after each edge.",
  },
  "cuboid-surface": {
    title: "Recover cuboid dimensions and surface area",
    description: "Derive block dimensions and calculate all six faces of a cuboid.",
    goal: "You can recover unknown block dimensions from volume and arrangements.",
    ideaTitle: "Find length, width, and height first",
    idea: "An arrangement of equal blocks may reveal one dimension. Then volume = length × width × height gives the missing edge before surface area is calculated.",
    commonHurdle: "Volume and surface area formulas are mixed, or one pair of faces is counted only once.",
    nextStep: "Record all three edge lengths with units, then list the three different face rectangles and double each one.",
    workedSteps: ["Divide a combined length when two equal edges touch", "Find one block's volume", "Calculate the missing height", "Surface area = 2 × (L×W + L×H + W×H)"],
    takeaway: "A cuboid has three different face rectangles, and each occurs twice.",
  },
} satisfies Record<TopicId, TopicCoachingContent>

const italianTopicCoaching = {
  "arithmetic-equations": {
    title: "Trovare i numeri mancanti lavorando a ritroso",
    description: "Annulla moltiplicazioni e divisioni nell'ordine inverso.",
    goal: "Sai risolvere a ritroso una catena di calcoli partendo dal risultato conosciuto.",
    ideaTitle: "Annulla ogni operazione",
    idea: "Parti dal risultato. Inverti l'ordine delle operazioni e sostituisci ciascuna con la sua inversa: la moltiplicazione diventa divisione e la divisione diventa moltiplicazione.",
    commonHurdle: "Le operazioni vengono annullate nell'ordine iniziale invece che dall'ultima alla prima.",
    nextStep: "Scrivi la catena con frecce, parti dal risultato e inverti una freccia alla volta.",
    workedSteps: ["(□ × 6) ÷ 8 = 27", "27 × 8 = 216", "216 ÷ 6 = 36"],
    takeaway: "Parti dal risultato: inverti l'ordine e usa le operazioni inverse.",
  },
  "efficient-arithmetic": {
    title: "Riconoscere e usare strutture di calcolo efficienti",
    description: "Individua fattori comuni e somme o differenze tonde prima di calcolare.",
    goal: "Sai raccogliere un fattore comune e calcolare usando un totale tondo.",
    ideaTitle: "Cerca prima il fattore comune",
    idea: "Due moltiplicazioni lunghe possono nascondere un calcolo breve. Quando lo stesso fattore compare due volte, raccoglilo e combina prima i numeri rimanenti.",
    commonHurdle: "I due prodotti vengono calcolati separatamente e la struttura comune utile non viene riconosciuta.",
    nextStep: "Cerchia il fattore ripetuto e metti tra parentesi gli altri due numeri.",
    workedSteps: ["18 × 47 + 18 × 53", "18 × (47 + 53)", "18 × 100 = 1800"],
    takeaway: "Semplifica la struttura prima di eseguire i calcoli.",
  },
  "mass-units": {
    title: "Convertire con sicurezza chilogrammi e grammi",
    description: "Converti le masse tra chilogrammi e grammi.",
    goal: "Sai convertire con precisione chilogrammi e grammi senza calcolatrice.",
    ideaTitle: "Un chilogrammo equivale a 1'000 grammi",
    idea: "Il valore numerico diventa 1'000 volte più grande quando i chilogrammi sono espressi in grammi e 1'000 volte più piccolo quando i grammi sono espressi in chilogrammi.",
    commonHurdle: "Il fattore corretto è noto, ma moltiplicazione e divisione vengono usate nella direzione sbagliata.",
    nextStep: "Pronuncia l'unità di arrivo e valuta se il numero deve diventare più grande o più piccolo.",
    workedSteps: ["kg → g: moltiplica per 1'000", "g → kg: dividi per 1'000"],
    takeaway: "L'unità di arrivo indica la direzione della conversione.",
  },
  "fraction-of-quantity": {
    title: "Calcolare una frazione di una quantità",
    description: "Calcola una frazione, per esempio 3/4, di una quantità data.",
    goal: "Sai trovare una frazione di una quantità e spiegare il calcolo.",
    ideaTitle: "Prima dividi, poi prendi le parti richieste",
    idea: "Il denominatore indica in quante parti uguali è diviso l'intero. Il numeratore indica quante di quelle parti servono.",
    commonHurdle: "Numeratore e denominatore vengono scambiati oppure si tenta di fare entrambe le operazioni insieme.",
    nextStep: "Trova una parte usando il denominatore, poi moltiplica quella parte per il numeratore.",
    workedSteps: ["48 ÷ 4 = 12", "12 × 3 = 36", "Quindi 3/4 di 48 è 36."],
    takeaway: "Denominatore: dividi. Numeratore: moltiplica.",
  },
  "time-fractions": {
    title: "Calcolare frazioni di intervalli di tempo",
    description: "Trasforma ore e minuti in una sola unità prima di calcolare la frazione.",
    goal: "Sai calcolare frazioni di un intervallo senza confondere ore e minuti.",
    ideaTitle: "Converti prima tutto in minuti",
    idea: "Il calcolo con le frazioni è affidabile soltanto se l'intero intervallo usa la stessa unità. Riconverti in ore solo dopo aver trovato la frazione.",
    commonHurdle: "Ore e minuti vengono trattati come se fossero parti decimali dello stesso numero.",
    nextStep: "Scrivi la durata completa in minuti su una riga separata prima di usare la frazione.",
    workedSteps: ["2 h 20 min = 140 min", "1/7: 140 ÷ 7 = 20 min", "3/7: 20 × 3 = 60 min"],
    takeaway: "Prima di usare una frazione, tutti i tempi devono avere la stessa unità.",
  },
  "speed-distance-time": {
    title: "Collegare distanza, tempo e velocità",
    description: "Calcola velocità medie e distanze di recupero in più intervalli di tempo.",
    goal: "Sai ridurre un problema di movimento a distanza, tempo e velocità.",
    ideaTitle: "Per la media servono distanza totale e tempo totale",
    idea: "Di solito non si possono mediare direttamente le velocità. Trova il tempo di ogni tratto, somma tutte le distanze e tutti i tempi e dividi soltanto alla fine.",
    commonHurdle: "Si fa la media di due velocità anche se i tempi o le distanze corrispondenti sono diversi.",
    nextStep: "Crea una riga per ogni tratto con distanza, tempo e velocità, poi somma le prime due colonne.",
    workedSteps: ["Tempo = distanza ÷ velocità", "Somma distanza totale e tempo totale", "Velocità media = distanza totale ÷ tempo totale"],
    takeaway: "La velocità media è la distanza totale divisa per il tempo totale.",
  },
  "data-tables": {
    title: "Collegare correttamente i dati nelle tabelle",
    description: "Leggi con attenzione righe e colonne e ricostruisci valori mancanti o medie.",
    goal: "Sai collegare la riga e la colonna corrette senza mescolare valori non collegati.",
    ideaTitle: "Dai un nome a ogni numero prima di calcolare",
    idea: "Una tabella dà significato ai dati attraverso le intestazioni di righe e colonne. Scegli soltanto le celle necessarie e stabilisci se cerchi un totale, una differenza, un resto o una media mancante.",
    commonHurdle: "Un calcolo matematicamente corretto usa un valore preso dalla riga o dalla colonna sbagliata.",
    nextStep: "Segui l'intestazione di riga e quella di colonna fino a ogni cella scelta prima di scrivere l'equazione.",
    workedSteps: ["Segna la riga e la colonna richieste", "Scrivi i valori utili con le unità", "Scegli la relazione", "Controlla il risultato nella tabella"],
    takeaway: "Un calcolo corretto con la cella sbagliata dà comunque una risposta sbagliata.",
  },
  "money-calculations": {
    title: "Collegare prezzi, quantità e ricavi",
    description: "Trova prezzi di gruppo o quantità a partire da prezzi e ricavi.",
    goal: "Sai passare in entrambe le direzioni tra prezzo, quantità e ricavo.",
    ideaTitle: "Prezzo × quantità = ricavo",
    idea: "Ogni riga di una tabella dei prezzi usa la stessa relazione. Se manca la quantità, dividi il ricavo per il prezzo.",
    commonHurdle: "Si moltiplica quando la quantità mancante richiede una divisione oppure si omette l'unità monetaria.",
    nextStep: "Nomina prima l'incognita, poi coprila nella relazione prezzo × quantità = ricavo.",
    workedSteps: ["Ricavo del gruppo: moltiplica ogni quantità per il suo prezzo", "Quantità: ricavo ÷ prezzo unitario"],
    takeaway: "Individua prima quale delle tre grandezze manca.",
  },
  "proportional-revenue": {
    title: "Risolvere rapporti nelle tabelle dei ricavi",
    description: "Sottrai il ricavo noto e raggruppa le categorie secondo un rapporto fisso.",
    goal: "Sai risolvere una tabella dei ricavi quando due gruppi compaiono in un rapporto fisso.",
    ideaTitle: "Trasforma il rapporto in un gruppo ripetibile",
    idea: "Se i bambini sono il doppio degli adulti, un gruppo contiene due biglietti per bambini e uno per adulto. Il ricavo rimanente è formato da gruppi completi.",
    commonHurdle: "Il rapporto viene trattato come una differenza invece che come gruppi che si ripetono insieme.",
    nextStep: "Disegna un gruppo completo del rapporto e calcolane il prezzo prima di dividere il ricavo rimanente.",
    workedSteps: ["Sottrai dal totale il ricavo noto", "Calcola il prezzo di un gruppo nel rapporto", "Dividi il resto per il prezzo del gruppo", "Ricava la quantità richiesta"],
    takeaway: "Un rapporto diventa più semplice quando lo trasformi in un gruppo ripetibile.",
  },
  "integer-combinations": {
    title: "Trovare sistematicamente tutte le combinazioni intere",
    description: "Elenca tutte le combinazioni senza lacune né doppioni.",
    goal: "Sai giustificare che un elenco di combinazioni intere è completo.",
    ideaTitle: "Fissa un valore e varia il successivo in ordine",
    idea: "Parti da una quantità fissa dell'oggetto più grande. Aumenta di uno alla volta la quantità intermedia e calcola ogni volta quella rimanente.",
    commonHurdle: "Si indovinano combinazioni plausibili, lasciando lacune o contando due volte lo stesso caso.",
    nextStep: "Usa una tabella ordinata e cambia una sola colonna alla volta finché il resto diventa negativo.",
    workedSteps: ["Riserva almeno un oggetto di ogni tipo", "Fissa il tipo più grande", "Aumenta il tipo intermedio uno alla volta", "Passa alla quantità grande successiva quando il resto è negativo"],
    takeaway: "Una tabella ordinata evita lacune e conteggi doppi.",
  },
  "number-constraints": {
    title: "Trovare tutti i numeri che rispettano più condizioni",
    description: "Combina cifre, divisibilità e valore posizionale in un insieme completo di soluzioni.",
    goal: "Sai trovare ogni numero che soddisfa contemporaneamente diverse condizioni.",
    ideaTitle: "Usa prima il filtro più forte",
    idea: "Inizia da una regola di divisibilità o da una parte finale fissa. Disponi soltanto dopo le cifre rimanenti, quindi controlla la condizione sul valore posizionale.",
    commonHurdle: "I candidati vengono controllati rispetto a una sola condizione oppure si saltano disposizioni valide.",
    nextStep: "Crea una colonna-filtro per ogni condizione e conserva un candidato soltanto se supera tutte le colonne.",
    workedSteps: ["Applica la divisibilità alle possibili parti finali", "Disponi sistematicamente le cifre rimanenti", "Controlla il valore posizionale", "Elimina i doppioni e dimostra la completezza"],
    takeaway: "Ogni condizione è un filtro; ogni risposta finale deve superarli tutti.",
  },
  "area-fractions": {
    title: "Contare e semplificare frazioni di area",
    description: "Trasforma piastrelle di dimensioni diverse nella stessa unità di area.",
    goal: "Sai contare piastrelle diverse usando un'unica unità di area.",
    ideaTitle: "Conta l'area, non il numero di piastrelle",
    idea: "Una piastrella 2×2 copre la stessa area di quattro quadrati unitari. Trasforma tutto in quadrati unitari prima di formare e semplificare la frazione.",
    commonHurdle: "Piastrelle grandi e piccole vengono contate entrambe come un oggetto, anche se coprono aree diverse.",
    nextStep: "Disegna o conta i quadrati unitari sotto ogni piastrella prima di scrivere numeratore e denominatore.",
    workedSteps: ["Conta l'area totale in quadrati unitari", "Trasforma ogni piastrella grande in quattro unità", "Forma area bianca ÷ area totale", "Riduci ai minimi termini"],
    takeaway: "Numeratore e denominatore devono usare la stessa unità di area.",
  },
  "composite-areas": {
    title: "Scomporre figure composte",
    description: "Calcola cornici, ritagli e incavature aggiungendo o sottraendo rettangoli.",
    goal: "Sai suddividere una figura composta in rettangoli familiari.",
    ideaTitle: "Parti da un semplice rettangolo esterno",
    idea: "Cornici e figure a L diventano spesso più semplici calcolando il rettangolo che le contiene e sottraendo i ritagli. Per il perimetro, segui invece ogni bordo esposto.",
    commonHurdle: "Si confondono i metodi per area e perimetro oppure si conta un bordo interno come parte del confine esterno.",
    nextStep: "Segna il problema come AREA o PERIMETRO, poi colora le parti interne oppure ripassa soltanto il confine esterno.",
    workedSteps: ["Individua il rettangolo esterno", "Trova le lunghezze interne mancanti", "Somma le parti o sottrai il ritaglio", "Per il perimetro, conta ogni tratto di confine una volta"],
    takeaway: "L'area misura l'interno; il perimetro segue il confine.",
  },
  "tiling-costs": {
    title: "Ricoprire un'area al costo minimo",
    description: "Considera insieme l'adattamento geometrico e il costo per area.",
    goal: "Sai trovare la combinazione valida più economica di piastrelle piccole e grandi.",
    ideaTitle: "Confronta prima il costo per area coperta",
    idea: "Una piastrella grande copre quattro quadrati unitari. Se costa meno di quattro piastrelle piccole, usa il maggior numero di piastrelle grandi che entra davvero nel rettangolo.",
    commonHurdle: "Si sceglie il prezzo per area più basso senza controllare se le piastrelle grandi entrano nelle dimensioni date.",
    nextStep: "Confronta i prezzi, poi disegna la massima disposizione valida di piastrelle 2×2 e conta i quadrati unitari rimanenti.",
    workedSteps: ["Confronta una piastrella grande con quattro piccole", "Trova quante piastrelle 2×2 entrano", "Riempi l'area rimanente con piastrelle piccole", "Somma i due costi"],
    takeaway: "Un costo per area minore è utile soltanto se le piastrelle grandi entrano davvero.",
  },
  "reverse-fractions": {
    title: "Lavorare a ritroso da una frazione nota",
    description: "Ricostruisci l'intero iniziale a partire da una sua parte frazionaria nota.",
    goal: "Sai trovare una quantità iniziale partendo da una sua frazione nota.",
    ideaTitle: "Trova prima una parte uguale",
    idea: "Se 3/4 di una massa sono 18 kg, allora 18 kg rappresentano tre parti uguali. Dividi per trovare una parte, poi moltiplica per ricostruire tutte e quattro le parti.",
    commonHurdle: "Si ripete il procedimento diretto della frazione, ottenendo un risultato più piccolo della parte rimanente nota.",
    nextStep: "Indica quante parti uguali rappresenta la quantità nota, trova una parte e poi ricostruisci l'intero.",
    workedSteps: ["3 parti sono 18 kg", "1 parte è 18 ÷ 3 = 6 kg", "4 parti sono 6 × 4 = 24 kg", "Controllo: 3/4 di 24 kg sono 18 kg"],
    takeaway: "Dividi per il numeratore, poi moltiplica per il denominatore.",
  },
  "reverse-chains": {
    title: "Risolvere a ritroso processi con più passaggi",
    description: "Annulla diversi cambiamenti nel corretto ordine inverso.",
    goal: "Sai risolvere a ritroso un problema testuale partendo dalla quantità finale nota.",
    ideaTitle: "Parti dal punto in cui il valore è certo",
    idea: "Il valore più affidabile si trova spesso alla fine della storia. Annulla ogni cambiamento in ordine inverso e scrivi un'operazione per riga.",
    commonHurdle: "Si usano le operazioni inverse corrette, ma nello stesso ordine della storia invece che nell'ordine inverso.",
    nextStep: "Scrivi la storia come una catena di frecce in avanti, poi segui le frecce a ritroso una alla volta.",
    workedSteps: ["Trova il contenuto totale di tutti i contenitori", "Annulla la perdita dovuta alla lavorazione", "Ripristina il materiale scartato", "Aggiungi la perdita durante il trasporto"],
    takeaway: "Scrivi ogni passaggio a ritroso su una riga separata.",
  },
  "inverse-proportion": {
    title: "Comprendere la proporzionalità inversa",
    description: "Riconosci quando meno persone possono usare la stessa risorsa per un tempo proporzionalmente maggiore.",
    goal: "Sai individuare e usare un totale costante, per esempio le giornate-persona.",
    ideaTitle: "Persone × giorni rimane costante",
    idea: "Quando la stessa risorsa è condivisa da meno persone, dura più a lungo. Le giornate-persona rappresentano l'intera risorsa fissa.",
    commonHurdle: "Il numero di giorni viene cambiato nella stessa direzione del numero di persone, come se la relazione fosse diretta.",
    nextStep: "Calcola prima il totale fisso delle giornate-persona e dividilo per il nuovo numero di persone.",
    workedSteps: ["40 persone × 24 giorni = 960 giornate-persona", "960 ÷ 30 persone = 32 giorni", "Aumento: 32 − 24 = 8 giorni"],
    takeaway: "Quando una quantità diminuisce, l'altra aumenta nello stesso rapporto.",
  },
  "changing-rates": {
    title: "Calcolare il consumo in fasi che cambiano",
    description: "Trova la risorsa rimanente prima di calcolare una nuova durata.",
    goal: "Sai seguire una risorsa fissa attraverso più fasi di consumo.",
    ideaTitle: "Sottrai ciò che è già stato consumato",
    idea: "Quando cambia il numero di persone, la durata iniziale non vale più. Mantieni la risorsa in giornate-persona, sottrai la prima fase e poi calcola la seconda.",
    commonHurdle: "Il nuovo gruppo viene applicato all'intera risorsa iniziale invece che alla parte rimanente.",
    nextStep: "Disegna un confine chiaro tra le fasi e scrivi giornate-persona totali, usate e rimanenti prima della divisione finale.",
    workedSteps: ["Calcola le giornate-persona totali", "Sottrai il consumo della prima fase", "Dividi il resto per il nuovo numero di persone"],
    takeaway: "A ogni cambiamento, ricalcola partendo dalla risorsa rimanente.",
  },
  "geometric-loci": {
    title: "Costruire regioni da condizioni geometriche",
    description: "Interpreta distanze, circonferenze e assi dei segmenti come confini di una regione.",
    goal: "Sai tradurre condizioni verbali sulla distanza in confini geometrici.",
    ideaTitle: "Ogni condizione crea un confine geometrico",
    idea: "La stessa distanza da due punti dà l'asse del segmento. Una distanza fissa da un punto dà una circonferenza; una distanza fissa da una retta dà una retta parallela.",
    commonHurdle: "Si disegna il confine corretto, ma si sceglie il lato, la scala o la regione di intersezione sbagliati.",
    nextStep: "Per ogni condizione, nomina il confine e prova un punto per decidere quale lato è consentito.",
    workedSteps: ["Converti la scala nelle unità del disegno", "Costruisci un confine per ogni condizione", "Segna il lato consentito o la regione interna/esterna", "Interseca tutte le regioni consentite"],
    takeaway: "La soluzione è l'intersezione di tutte le regioni consentite.",
  },
  "coordinate-transformations": {
    title: "Riflettere, ruotare e traslare punti",
    description: "Applica le regole delle coordinate per riflessioni, rotazioni di 90° e traslazioni.",
    goal: "Sai trasformare un punto usando una regola precisa sulle coordinate.",
    ideaTitle: "Cambia x e y secondo una regola fissa",
    idea: "Una trasformazione non è un disegno a mano libera. L'asse, l'angolo o il vettore stabilisce quale coordinata rimane, cambia segno, scambia posizione o riceve uno spostamento.",
    commonHurdle: "Si cambiano automaticamente entrambi i segni oppure si scambiano x e y quando la trasformazione scelta non lo richiede.",
    nextStep: "Scrivi prima la regola simbolica, applicala separatamente a x e y e controlla il quadrante ottenuto.",
    workedSteps: ["Scrivi il punto iniziale (x, y)", "Applica la regola a entrambe le coordinate", "Disegna il punto immagine (x′, y′)", "Controlla quadrante e distanza"],
    takeaway: "Scrivi la regola simbolica prima di sostituire i numeri.",
  },
  "cube-nets": {
    title: "Piegare mentalmente gli sviluppi del cubo",
    description: "Determina facce adiacenti e opposte piegando lo sviluppo nello spazio.",
    goal: "Sai piegare uno sviluppo faccia per faccia e riconoscere con sicurezza le facce opposte.",
    ideaTitle: "Piega lungo un bordo alla volta",
    idea: "Scegli una faccia come base. Le facce direttamente adiacenti si alzano come lati; una faccia successiva può diventare quella superiore. Segui la direzione nello spazio dopo ogni piega.",
    commonHurdle: "Due facce che si toccano nello sviluppo piano vengono considerate per errore facce opposte.",
    nextStep: "Fissa una faccia di base e assegna a ogni faccia piegata una direzione: davanti, dietro, sinistra, destra o sopra.",
    workedSteps: ["Fissa una faccia iniziale", "Piega verso l'alto le facce direttamente adiacenti", "Continua lungo un bordo alla volta", "Abbina le facce che puntano in direzioni opposte"],
    takeaway: "Le facce che condividono un bordo nello sviluppo non possono mai essere opposte nel cubo.",
  },
  "spatial-rolling": {
    title: "Seguire una piramide mentre si ribalta",
    description: "Segui con sicurezza ogni faccia mentre il solido si ribalta sui bordi.",
    goal: "Sai seguire ogni faccia di una piramide triangolare attraverso una sequenza di ribaltamenti.",
    ideaTitle: "La faccia oltre il bordo di ribaltamento diventa la base",
    idea: "Prima di ogni ribaltamento, nomina la base e le tre facce laterali. Aggiorna l'intero orientamento dopo un bordo prima di affrontare il ribaltamento successivo.",
    commonHurdle: "Si immaginano più ribaltamenti insieme e si perde l'orientamento di un passaggio precedente.",
    nextStep: "Usa una tabella con quattro posizioni e riscrivi base, sinistra, destra e dietro dopo ogni singolo ribaltamento.",
    workedSteps: ["Segna il bordo di ribaltamento", "Sposta la faccia laterale adiacente alla base", "Sposta la vecchia base sul lato di ribaltamento", "Aggiorna le altre facce", "Scrivi il nuovo orientamento completo"],
    takeaway: "Non seguire tutto il percorso in una volta: aggiorna dopo ogni bordo.",
  },
  "cuboid-surface": {
    title: "Ricostruire le dimensioni e l'area totale di un parallelepipedo",
    description: "Ricava le dimensioni dei blocchi e calcola tutte e sei le facce di un parallelepipedo.",
    goal: "Sai ricostruire dimensioni sconosciute da volume e disposizioni di blocchi.",
    ideaTitle: "Trova prima lunghezza, larghezza e altezza",
    idea: "Una disposizione di blocchi uguali può mostrare una dimensione. Poi volume = lunghezza × larghezza × altezza dà il bordo mancante prima di calcolare l'area totale.",
    commonHurdle: "Si confondono le formule di volume e area totale oppure si conta una coppia di facce una sola volta.",
    nextStep: "Scrivi le tre lunghezze con le unità, poi elenca i tre rettangoli diversi delle facce e raddoppia ciascuno.",
    workedSteps: ["Dividi una lunghezza complessiva quando si toccano due bordi uguali", "Trova il volume di un blocco", "Calcola l'altezza mancante", "Area totale = 2 × (L×W + L×H + W×H)"],
    takeaway: "Un parallelepipedo ha tre rettangoli di faccia diversi e ciascuno compare due volte.",
  },
} satisfies Record<TopicId, TopicCoachingContent>

const englishTeachBackPrompt = "What would you do first, and why? Explain the idea before calculating."
const italianTeachBackPrompt = "Che cosa faresti per prima cosa, e perché? Spiega l'idea prima di calcolare."
const spanishTeachBackPrompt = "¿Qué harías primero y por qué? Explica la idea antes de calcular."

function germanTopicCoaching(topicId: TopicId): ParentTopicCoachingCopy {
  const topic = topics[topicId]
  const lesson = lessons[topicId]
  const guidance = getTopicGuidance(topicId)
  const firstPage = lesson.pages[0]!
  return {
    title: topic.title,
    description: topic.description,
    goal: lesson.goal,
    ideaTitle: firstPage.title,
    idea: firstPage.body,
    commonHurdle: guidance.message,
    nextStep: guidance.nextStep,
    workedSteps: lesson.pages.flatMap((page) => page.steps),
    takeaway: lesson.pages.at(-1)!.takeaway,
    teachBackPrompt: "Was würdest du als Erstes tun – und warum? Erkläre es mit dem Merksatz, noch bevor du ausrechnest.",
    prerequisiteTitles: topic.prerequisites.map((prerequisiteId) => topics[prerequisiteId].title),
  }
}

export function buildParentTopicCoaching(
  topicId: TopicId,
  language: ParentExplanationLanguage,
): ParentTopicCoachingCopy {
  if (language === "de") return germanTopicCoaching(topicId)
  const catalogue = language === "it"
    ? italianTopicCoaching
    : language === "es"
      ? spanishTopicCoaching
      : englishTopicCoaching
  const copy = catalogue[topicId]
  return {
    ...copy,
    teachBackPrompt: language === "it"
      ? italianTeachBackPrompt
      : language === "es"
        ? spanishTeachBackPrompt
        : englishTeachBackPrompt,
    prerequisiteTitles: topics[topicId].prerequisites.map((prerequisiteId) => (
      catalogue[prerequisiteId].title
    )),
  }
}

export function hasCompleteEnglishParentCoaching(): boolean {
  return topicIds.every((topicId) => {
    const copy = buildParentTopicCoaching(topicId, "en")
    return [
      copy.title,
      copy.description,
      copy.goal,
      copy.ideaTitle,
      copy.idea,
      copy.commonHurdle,
      copy.nextStep,
      copy.takeaway,
      copy.teachBackPrompt,
      ...copy.workedSteps,
      ...copy.prerequisiteTitles,
    ].every((value) => value.trim().length > 0)
  })
}

export function hasCompleteItalianParentCoaching(): boolean {
  return topicIds.every((topicId) => {
    const copy = buildParentTopicCoaching(topicId, "it")
    return [
      copy.title,
      copy.description,
      copy.goal,
      copy.ideaTitle,
      copy.idea,
      copy.commonHurdle,
      copy.nextStep,
      copy.takeaway,
      copy.teachBackPrompt,
      ...copy.workedSteps,
      ...copy.prerequisiteTitles,
    ].every((value) => value.trim().length > 0)
  })
}

export function hasCompleteSpanishParentCoaching(): boolean {
  return topicIds.every((topicId) => {
    const copy = buildParentTopicCoaching(topicId, "es")
    return [
      copy.title,
      copy.description,
      copy.goal,
      copy.ideaTitle,
      copy.idea,
      copy.commonHurdle,
      copy.nextStep,
      copy.takeaway,
      copy.teachBackPrompt,
      ...copy.workedSteps,
      ...copy.prerequisiteTitles,
    ].every((value) => value.trim().length > 0)
  })
}
