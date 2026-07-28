import type { AppLocale } from "./localization"

export interface TheorySupportCopy {
  eyebrow: string
  title: (topic: string) => string
  intro: string
  commonHurdleLabel: string
  nextStepLabel: string
  exampleLabel: string
  rememberLabel: string
  teachBackLabel: string
  teachBackPrompt: string
  understood: string
  stillNeedSupport: string
}

const english: TheorySupportCopy = {
  eyebrow: "A DIFFERENT WAY IN",
  title: (topic) => `Let’s look at ${topic} another way`,
  intro: "You are not expected to understand an idea from one explanation. Start with the part that often causes confusion, then follow one fresh example calmly.",
  commonHurdleLabel: "Where it often gets stuck",
  nextStepLabel: "Try this first",
  exampleLabel: "A fresh worked example",
  rememberLabel: "Keep this sentence",
  teachBackLabel: "Say it in your own words",
  teachBackPrompt: "Before calculating, say what you would do first and why.",
  understood: "This makes more sense",
  stillNeedSupport: "I still need help",
}

const german: TheorySupportCopy = {
  eyebrow: "NOCH EIN ZUGANG",
  title: (topic) => `Schauen wir ${topic} anders an`,
  intro: "Du musst eine Idee nicht nach der ersten Erklärung verstehen. Beginne bei der typischen Stolperstelle und gehe dann ein neues Beispiel in Ruhe durch.",
  commonHurdleLabel: "Hier stockt es oft",
  nextStepLabel: "Probiere zuerst das",
  exampleLabel: "Ein neues Beispiel mit Lösungsweg",
  rememberLabel: "Diesen Satz merken",
  teachBackLabel: "Mit eigenen Worten sagen",
  teachBackPrompt: "Sage vor dem Rechnen, was du zuerst tun würdest – und warum.",
  understood: "Jetzt ist es klarer",
  stillNeedSupport: "Ich brauche trotzdem Hilfe",
}

const italian: TheorySupportCopy = {
  eyebrow: "UN ALTRO MODO PER CAPIRE",
  title: (topic) => `Guardiamo ${topic} in un altro modo`,
  intro: "Non devi capire un’idea dopo una sola spiegazione. Parti dal punto che crea spesso confusione e segui con calma un esempio nuovo.",
  commonHurdleLabel: "Dove ci si blocca spesso",
  nextStepLabel: "Prova prima così",
  exampleLabel: "Un nuovo esempio svolto",
  rememberLabel: "Ricorda questa frase",
  teachBackLabel: "Dillo con parole tue",
  teachBackPrompt: "Prima di calcolare, di’ che cosa faresti per prima cosa e perché.",
  understood: "Ora è più chiaro",
  stillNeedSupport: "Ho ancora bisogno di aiuto",
}

const spanish: TheorySupportCopy = {
  eyebrow: "OTRA FORMA DE ENTENDERLO",
  title: (topic) => `Veamos ${topic} de otra manera`,
  intro: "No tienes que entender una idea con una sola explicación. Empieza por la parte que suele causar confusión y sigue con calma un ejemplo nuevo.",
  commonHurdleLabel: "Dónde suele aparecer el bloqueo",
  nextStepLabel: "Prueba primero esto",
  exampleLabel: "Un ejemplo nuevo resuelto",
  rememberLabel: "Recuerda esta frase",
  teachBackLabel: "Dilo con tus propias palabras",
  teachBackPrompt: "Antes de calcular, di qué harías primero y por qué.",
  understood: "Ahora lo entiendo mejor",
  stillNeedSupport: "Todavía necesito ayuda",
}

export const theorySupportCopy: Readonly<Record<AppLocale, TheorySupportCopy>> = Object.freeze({
  de: german,
  en: english,
  it: italian,
  es: spanish,
})
