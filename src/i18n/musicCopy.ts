import type { AppLocale } from "./localization"

export interface MusicCopy {
  blocked: string
  error: string
  loading: string
  pause: string
  play: string
}

export const musicCopy: Readonly<Record<AppLocale, MusicCopy>> = Object.freeze({
  de: {
    blocked: "Musik ist während Standortbestimmungen und Prüfungen ausgeschaltet.",
    error: "Musik konnte nicht gestartet werden. Erneut versuchen.",
    loading: "The Golden Dragon wird geladen.",
    pause: "Musik pausieren: The Golden Dragon",
    play: "Musik abspielen: The Golden Dragon",
  },
  en: {
    blocked: "Music is off during assessments and exams.",
    error: "Music could not start. Try again.",
    loading: "Loading The Golden Dragon.",
    pause: "Pause music: The Golden Dragon",
    play: "Play music: The Golden Dragon",
  },
  it: {
    blocked: "La musica è disattivata durante valutazioni ed esami.",
    error: "Impossibile avviare la musica. Riprova.",
    loading: "Caricamento di The Golden Dragon.",
    pause: "Metti in pausa la musica: The Golden Dragon",
    play: "Riproduci musica: The Golden Dragon",
  },
  es: {
    blocked: "La música está desactivada durante evaluaciones y exámenes.",
    error: "No se pudo iniciar la música. Inténtalo de nuevo.",
    loading: "Cargando The Golden Dragon.",
    pause: "Pausar música: The Golden Dragon",
    play: "Reproducir música: The Golden Dragon",
  },
})
