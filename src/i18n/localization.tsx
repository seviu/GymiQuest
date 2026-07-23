import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type {
  GeometryControlSide,
  DifficultyBand,
  LearnerHelpStyle,
  LearnerReadingMode,
  LearnerVisualMode,
  PracticeDay,
  LearningLocale,
} from "../domain/model"
import {
  translateMessage,
  type MessageKey,
  type MessageValues,
} from "./messages"

export const appLocaleIds = ["en", "it", "es", "de"] as const satisfies readonly LearningLocale[]

export type AppLocale = LearningLocale

export interface AppLocaleOption {
  id: AppLocale
  nativeLabel: string
  shortLabel: string
  intlLocale: string
  htmlLanguage: string
}

export const appLocaleOptions: readonly AppLocaleOption[] = Object.freeze([
  {
    id: "en",
    nativeLabel: "English",
    shortLabel: "EN",
    intlLocale: "en-GB",
    htmlLanguage: "en",
  },
  {
    id: "it",
    nativeLabel: "Italiano",
    shortLabel: "IT",
    intlLocale: "it-CH",
    htmlLanguage: "it",
  },
  {
    id: "es",
    nativeLabel: "Español",
    shortLabel: "ES",
    intlLocale: "es-ES",
    htmlLanguage: "es",
  },
  {
    id: "de",
    nativeLabel: "Deutsch",
    shortLabel: "DE",
    intlLocale: "de-CH",
    htmlLanguage: "de-CH",
  },
])

const localeOptionById = new Map(appLocaleOptions.map((option) => [option.id, option]))
const localeStorageKey = "gymiquest.app-locale.v1"

export function normalizeAppLocale(value: unknown): AppLocale | undefined {
  return typeof value === "string" && (appLocaleIds as readonly string[]).includes(value)
    ? value as AppLocale
    : undefined
}

export function preferredAppLocale(
  storedValue?: unknown,
  browserLanguages: readonly string[] = [],
): AppLocale {
  const stored = normalizeAppLocale(storedValue)
  if (stored) return stored
  for (const language of browserLanguages) {
    const base = language.trim().toLowerCase().split("-", 1)[0]
    const locale = normalizeAppLocale(base)
    if (locale) return locale
  }
  return "en"
}

function readInitialLocale(): AppLocale {
  let stored: string | undefined
  try {
    stored = window.localStorage.getItem(localeStorageKey) ?? undefined
  } catch {
    // Local storage can be unavailable in hardened/private browser contexts.
  }
  const browserLanguages = typeof navigator === "undefined"
    ? []
    : navigator.languages?.length
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : []
  return preferredAppLocale(stored, browserLanguages)
}

interface ChoiceCopy {
  title: string
  description: string
}

interface AppCopy {
  language: {
    label: string
    hint: string
  }
  header: {
    home: string
    privacy: string
    privacyAria: string
    progressAria: string
    progressHint: string
    setupAria: string
    setupTitle: string
    setupHint: string
  }
  loading: string
  onboarding: {
    progress: (question: number, total: number, activeTime: string) => string
    eyebrow: string
    title: string
    intro: string
    noGradeTitle: string
    noGradeDetail: string
    reviewTitle: string
    reviewDetail: string
    noXpTitle: string
    noXpDetail: string
    resume: string
    start: string
    foundations: string
    duration: (questionCount: number) => string
    pathAria: string
    pathEyebrow: string
    pathTitle: string
    placementTitle: string
    placementDetail: string
    lessonsTitle: string
    lessonsDetail: string
    reviewsTitle: string
    reviewsDetail: string
    assessmentsTitle: string
    assessmentsDetail: string
    pathNote: string
  }
  player: {
    taskKinds: Record<"lesson" | "review" | "repair" | "assessment" | "placement", string>
    recovery: string
    takeaway: string
    back: string
    practiceNow: string
    continue: string
    assessmentReadyAria: string
    ready: string
    activeLearningTime: (time: string, paused: boolean) => string
    pause: string
    resume: string
    pausedEyebrow: string
    pausedTitle: string
    pausedBody: string
    activeTime: (time: string) => string
    resumeLearning: string
    pauseTopic: (topic: string) => string
    lessonPauseBody: string
    keepViewingLesson: string
    pauseAndReport: string
    notUnderstood: string
    learningPlan: string
    prerequisiteDetourEyebrow: string
    prerequisiteDetourTitle: (topic: string) => string
    prerequisiteDetourBody: string
    returnToQuestion: string
    prerequisiteReturnNotice: (xp: number) => string
    questionProgress: (current: number, total: number) => string
    difficultyBands: Record<DifficultyBand, string>
    notationTitle: string
    notationBody: (partCount: number) => string
    moreOptions: string
    reportIssue: string
    questionPauseBody: string
    keepTrying: string
    coordinateX: string
    coordinateY: string
    fractionPlaceholder: string
    integerSetPlaceholder: string
    integerSequencePlaceholder: string
    saveAnswer: string
    submitAnswer: string
    checkCalculation: string
    checkStep: (step: number) => string
    checkConstruction: string
    checkAnswer: string
    incorrect: string
    wrongAnswerTitle: string
    wrongAnswerMessage: string
    formatRetryNote: string
    nextStep: string
    correct: string
    finish: string
    assessmentAnswerRecorded: string
    assessmentModeNote: string
    placementModeNote: string
    helpTitle: string
    helpSubtitle: string
    helpOptionLabels: Record<"hint" | "easier" | "concept" | "solution" | "prerequisites", string>
    recommended: string
    recommendedTitle: (option: string) => string
    hintEyebrow: string
    easierEyebrow: string
    solutionEyebrow: string
    prerequisitesEyebrow: string
    solutionContinue: string
    noPrerequisites: string
    openPrerequisite: string
    assessmentEyebrow: (number: number | undefined, minimalFocus: boolean) => string
    assessmentTitle: string
    assessmentBody: string
    exercises: string
    topics: string
    minutes: string
    assessmentRouteAria: (minimalFocus: boolean) => string
    preparation: string
    checkpoint: string
    prepareCalmly: string
    mixedRound: string
    withoutHints: string
    reviewPlan: string
    returnRoute: string
    onlyWhereNeeded: string
    rulesTitle: string
    assessmentRules: readonly string[]
    mixedFrom: string
    startAssessment: string
    timeStartsAfterStart: string
    practicePathTitle: string
    practicePathDetail: string
    practicePathProgress: (completed: number, next: number) => string
    practicePathNote: string
    geometryLegend: string
    geometryDetail: string
    geometryToolsAria: string
    geometryTools: Record<"parallel" | "circle" | "bisector", ChoiceCopy>
    geometryCanvasAria: string
    geometryCanvasTitle: string
    geometryEmpty: string
    geometryFineTune: string
    geometryFineTuneAria: string
    geometryInteractionHint: string
    geometryPosition: string
    geometryDistance: (distance: string) => string
    geometryRadius: (radius: string) => string
    geometryPointDistances: (first: string, second: string) => string
    visual: {
      fractionParts: (numerator: number, denominator: number) => string
      equationAria: string
      factorAria: string
      factorQuestion: string
      totalTime: string
      unspecifiedTotal: string
      givenMinutes: string
      remainingTime: string
      timeFlowAria: (total: string, denominator: number, subtracted: string, remaining: string) => string
      splitInto: string
      equalParts: (count: number) => string
      wanted: string
      parts: string
      subtractAfter: string
      remaining: string
      timeCaption: string
      catchUpAria: string
      start: string
      meetingPoint: string
      headStart: (minutes: number) => string
      timeUsed: string
      delay: string
      tourAria: string
      section: (number: number) => string
      campsAria: string
      campsCaption: string
      daysPerCamp: string
      libraryAria: string
      libraryCaption: string
      loans: string
      booksPerWeek: (count: number) => string
      routeAria: string
      routeCaption: string
      route: string
      distance: string
      numberFilterAria: string
      allSolutions: string
      tileAria: string
      frameAria: string
      notchAria: string
      cornerAria: string
      widthHeight: (width: number, height: number) => string
      coordinateAria: (x: number, y: number, transformation: string) => string
      cubeNetAria: (face: string) => string
      pyramidAria: (path: string) => string
      left: string
      right: string
      bottom: string
      back: string
      tippingPath: string
      length: (value: number) => string
      width: (value: number) => string
    }
  }
  profile: {
    progressBack: string
    stepLabel: (step: number) => string
    goalEyebrow: string
    goalTitle: string
    goalIntro: string
    nicknameLabel: string
    nicknamePlaceholder: string
    nicknameHint: string
    examDateLabel: string
    examDateHint: string
    rhythmButton: string
    rhythmEyebrow: string
    rhythmTitle: string
    rhythmIntro: string
    practiceDaysLegend: string
    practiceDaysHint: string
    sessionLengthLegend: string
    minutes: string
    helpStyleLegend: string
    visualModeLegend: string
    readingModeLegend: string
    geometrySideLegend: string
    geometrySideHint: string
    back: string
    saving: string
    saveChanges: string
    saveAndStart: string
    previewEyebrow: string
    previewTitle: string
    lessonTitle: string
    lessonDescription: string
    reviewTitle: string
    reviewDescription: string
    assessmentTitle: string
    assessmentDescription: string
    privacyNote: string
    nicknameError: string
    examDateError: string
    practiceDaysError: string
    saveError: string
    practiceDayLabels: Record<PracticeDay, string>
    helpStyleLabels: Record<LearnerHelpStyle, ChoiceCopy>
    visualModeLabels: Record<LearnerVisualMode, ChoiceCopy>
    readingModeLabels: Record<LearnerReadingMode, ChoiceCopy>
    geometrySideLabels: Record<GeometryControlSide, ChoiceCopy>
  }
}

const englishCopy: AppCopy = {
  language: {
    label: "Language",
    hint: "The language changes immediately and stays on this device.",
  },
  header: {
    home: "Go to learning plan",
    privacy: "Privacy",
    privacyAria: "Open privacy and local-data information",
    progressAria: "Open progress",
    progressHint: "View progress",
    setupAria: "Start profile is being set up",
    setupTitle: "Your start",
    setupHint: "without assumptions",
  },
  loading: "Preparing your learning plan …",
  onboarding: {
    progress: (question, total, activeTime) => `Question ${question} of ${total} · ${activeTime} active`,
    eyebrow: "WELCOME TO GYMIQUEST",
    title: "Let’s find your best starting point.",
    intro: "You do not need to repeat everything or know everything already. A short check shows which ideas are secure and which ones we should learn first.",
    noGradeTitle: "No grade",
    noGradeDetail: "The result only organises your learning plan.",
    reviewTitle: "Nothing is skipped",
    reviewDetail: "Confirmed topics return early as reviews.",
    noXpTitle: "No XP pressure",
    noXpDetail: "XP starts only with your actual training.",
    resume: "Continue start check",
    start: "Begin start check",
    foundations: "Start with the foundations",
    duration: (questionCount) => `${questionCount} questions · about 5 minutes · answers are stored on this device`,
    pathAria: "The learning path leads from a short start check to lessons, reviews, and assessments",
    pathEyebrow: "YOUR LEARNING PATH",
    pathTitle: "Adapts with every answer",
    placementTitle: "Start check",
    placementDetail: "What is secure already?",
    lessonsTitle: "Lessons",
    lessonsDetail: "Understand new ideas",
    reviewsTitle: "Reviews",
    reviewsDetail: "Keep knowledge ready",
    assessmentsTitle: "Assessments",
    assessmentsDetail: "Bring gaps back deliberately",
    pathNote: "Your learning plan begins only after you choose a starting point.",
  },
  player: {
    taskKinds: {
      lesson: "Lesson",
      review: "Review",
      repair: "Refresh",
      assessment: "Assessment",
      placement: "Start check",
    },
    recovery: "Consolidation round",
    takeaway: "Takeaway",
    back: "Back",
    practiceNow: "Practise now",
    continue: "Continue",
    assessmentReadyAria: "Learning time starts with the assessment",
    ready: "Ready",
    activeLearningTime: (time, paused) => `${time} active learning time${paused ? ", paused" : ""}`,
    pause: "Pause",
    resume: "Resume",
    pausedEyebrow: "LEARNING TIME PAUSED",
    pausedTitle: "Take a calm break.",
    pausedBody: "The exercise stays hidden. Your answer and active learning time so far are stored on this device.",
    activeTime: (time) => `${time} active learning time`,
    resumeLearning: "Resume learning",
    pauseTopic: (topic) => `Pause ${topic}?`,
    lessonPauseBody: "The lesson will end and wait in the companion view for an explanation together.",
    keepViewingLesson: "Keep viewing the lesson",
    pauseAndReport: "Pause and report",
    notUnderstood: "I do not understand this topic yet",
    learningPlan: "Learning plan",
    prerequisiteDetourEyebrow: "QUICK REFRESH",
    prerequisiteDetourTitle: (topic) => `First, a quick refresh: ${topic}`,
    prerequisiteDetourBody: "Your problem and your work are saved. You’ll continue from this exact spot afterwards.",
    returnToQuestion: "Back to my problem",
    prerequisiteReturnNotice: (xp) => `Refresh complete · +${xp} XP. Your work is still here.`,
    questionProgress: (current, total) => `Question ${current} of ${total}`,
    difficultyBands: {
      foundation: "Foundation",
      standard: "Standard",
      exam: "Exam-style",
    },
    notationTitle: "What does □ mean?",
    notationBody: (partCount) => `The box is the numerator: the number of ${partCount} equal time parts being asked for. Enter only that number below.`,
    moreOptions: "More options",
    reportIssue: "Report an error in this exercise",
    questionPauseBody: "The exercise will end. No more training exercises from this topic will appear until a companion has explained and reopened it.",
    keepTrying: "Keep trying",
    coordinateX: "x-coordinate",
    coordinateY: "y-coordinate",
    fractionPlaceholder: "e.g. 3/4",
    integerSetPlaceholder: "e.g. 1234, 1324, 2134",
    integerSequencePlaceholder: "e.g. 2, 3, 1, 4",
    saveAnswer: "Save answer",
    submitAnswer: "Submit answer",
    checkCalculation: "Check calculation",
    checkStep: (step) => `Check step ${step}`,
    checkConstruction: "Check construction",
    checkAnswer: "Check",
    incorrect: "Incorrect.",
    wrongAnswerTitle: "That answer is not correct yet.",
    wrongAnswerMessage: "Check your working or choose exactly as much help as you need.",
    formatRetryNote: "This does not count as a mistake.",
    nextStep: "Next step",
    correct: "Correct.",
    finish: "Finish",
    assessmentAnswerRecorded: "Answer saved. Your review follows after you finish.",
    assessmentModeNote: "Assessment mode: every submitted answer is final. You see whether it is correct right away. Anything that needs fixing is explained after you finish.",
    placementModeNote: "Start check: no grade and no intermediate results. Unclear topics will be explained later.",
    helpTitle: "I do not understand it yet",
    helpSubtitle: "Choose exactly the help you need.",
    helpOptionLabels: {
      hint: "A small hint",
      easier: "With easier numbers",
      concept: "Build the idea from the ground up",
      solution: "Step by step",
      prerequisites: "View prerequisites",
    },
    recommended: "Your starting point",
    recommendedTitle: (option) => `${option} – your preferred starting point`,
    hintEyebrow: "NEXT STEP",
    easierEyebrow: "THE SAME IDEA, SIMPLER",
    solutionEyebrow: "SOLUTION PATH",
    prerequisitesEyebrow: "PREREQUISITES",
    solutionContinue: "Understood, continue with the solution",
    noPrerequisites: "This topic needs no further prerequisite. Try the small hint.",
    openPrerequisite: "open ›",
    assessmentEyebrow: (number, minimalFocus) => minimalFocus
      ? `ASSESSMENT ${number ?? ""}`.trim()
      : `EXPEDITION CHECK ${number ?? ""} · ASSESSMENT`.replace("  ", " ").trim(),
    assessmentTitle: "Show what you can already recall without help.",
    assessmentBody: "This short mixed round is not a school report. It checks which ideas are available and which should return as targeted reviews.",
    exercises: "Questions",
    topics: "Topics",
    minutes: "Minutes",
    assessmentRouteAria: (minimalFocus) => minimalFocus ? "Assessment sequence" : "Expedition-check sequence",
    preparation: "Preparation",
    checkpoint: "Checkpoint",
    prepareCalmly: "prepare calmly",
    mixedRound: "Mixed round",
    withoutHints: "without hints",
    reviewPlan: "Review plan",
    returnRoute: "Return route",
    onlyWhereNeeded: "only where needed",
    rulesTitle: "How it works",
    assessmentRules: [
      "You submit exactly one answer per question.",
      "The questions are exam-style and use new values and variants every time.",
      "After submitting, you immediately see whether the answer was correct. Anything that needs fixing is explained after you finish.",
      "Incorrect topics are saved and return in future targeted reviews.",
    ],
    mixedFrom: "Mixed today from",
    startAssessment: "Start assessment",
    timeStartsAfterStart: "Active learning time starts only after you begin.",
    practicePathTitle: "Build the calculation path",
    practicePathDetail: "We check from top to bottom and show only the first mismatch.",
    practicePathProgress: (completed, next) => `Step ${completed} is correct. Continue with step ${next}.`,
    practicePathNote: "Correct the same calculation path as often as needed. It counts as no more than one uncertain question.",
    geometryLegend: "Construct on the plan",
    geometryDetail: "Choose the matching tool. Then tap or drag on the plan; use the control for fine adjustment.",
    geometryToolsAria: "Geometry tools",
    geometryTools: {
      parallel: { title: "Parallel line", description: "fixed distance from a line" },
      circle: { title: "Circle", description: "fixed distance from a point" },
      bisector: { title: "Perpendicular bisector", description: "equal distance from two points" },
    },
    geometryCanvasAria: "Interactive construction plan. A control below the plan provides precise keyboard adjustment.",
    geometryCanvasTitle: "Geometric plan with given objects and the learner's construction",
    geometryEmpty: "First choose the tool that matches the distance condition.",
    geometryFineTune: "Fine adjustment",
    geometryFineTuneAria: "Fine-tune construction",
    geometryInteractionHint: "Touch, Pencil, or mouse: tap the plan or drag the handle · Keyboard: arrow keys on the control",
    geometryPosition: "Position on the plan",
    geometryDistance: (distance) => `Distance from s: ${distance} cm`,
    geometryRadius: (radius) => `Radius: ${radius} cm`,
    geometryPointDistances: (first, second) => `to B₁: ${first} cm · to B₂: ${second} cm`,
    visual: {
      fractionParts: (numerator, denominator) => `${numerator} of ${denominator} parts`,
      equationAria: "Calculation chain with a missing number",
      factorAria: "Two products with a common factor",
      factorQuestion: "What can you factor out?",
      totalTime: "Total time",
      unspecifiedTotal: "Total time",
      givenMinutes: "given minutes",
      remainingTime: "remaining time",
      timeFlowAria: (total, denominator, subtracted, remaining) => `${total} total time is split into ${denominator} equal parts. An unknown number of those parts is taken. Then ${subtracted} is subtracted, leaving ${remaining}.`,
      splitInto: "split into",
      equalParts: (count) => `${count} equal parts`,
      wanted: "wanted",
      parts: "parts",
      subtractAfter: "then subtract",
      remaining: "remaining",
      timeCaption: "This overview only organises the given information—it does not show an intermediate result.",
      catchUpAria: "Two people moving along the same route",
      start: "Start",
      meetingPoint: "Meeting point ?",
      headStart: (minutes) => `${minutes} minutes' head start`,
      timeUsed: "Time already used",
      delay: "Delay",
      tourAria: "Journey with two speed sections",
      section: (number) => `Section ${number}`,
      campsAria: "Hiking and swimming days in three holiday camps",
      campsCaption: "Comparing three camps",
      daysPerCamp: "Days per camp",
      libraryAria: "Books lent over three weeks",
      libraryCaption: "School library",
      loans: "Loans",
      booksPerWeek: (count) => `${count} books per week`,
      routeAria: "Sections and total cycle route",
      routeCaption: "Cycle route via the market",
      route: "Route",
      distance: "Distance",
      numberFilterAria: "Digits filtered by several conditions",
      allSolutions: "all solutions",
      tileAria: "Tile plan in unit squares",
      frameAria: "Rectangular frame",
      notchAria: "Rectangle with a notch",
      cornerAria: "Rectangle with a corner cut-out",
      widthHeight: (width, height) => `${width} cm wide · ${height} cm high`,
      coordinateAria: (x, y, transformation) => `Coordinate plane with point P at ${x}, ${y}. ${transformation}`,
      cubeNetAria: (face) => `Cube net with marked face ${face}`,
      pyramidAria: (path) => `Labelled pyramid faces${path ? `; tipping path ${path}` : ""}`,
      left: "left",
      right: "right",
      bottom: "bottom",
      back: "back",
      tippingPath: "Tipping path",
      length: (value) => `${value} cm long`,
      width: (value) => `${value} cm wide`,
    },
  },
  profile: {
    progressBack: "Progress",
    stepLabel: (step) => `Step ${step} of 2`,
    goalEyebrow: "YOUR GOAL · STEP 1 OF 2",
    goalTitle: "Who are we planning for, and until when?",
    goalIntro: "A nickname and the exam date are enough. Both stay on this device and can be changed later.",
    nicknameLabel: "Your nickname",
    nicknamePlaceholder: "e.g. Mia",
    nicknameHint: "No full name needed.",
    examDateLabel: "Entrance-exam date",
    examDateHint: "This lets the learning plan show its pace.",
    rhythmButton: "Choose learning rhythm",
    rhythmEyebrow: "YOUR RHYTHM · STEP 2 OF 2",
    rhythmTitle: "How should GymiQuest support you?",
    rhythmIntro: "These choices change the daily portion and the first kind of help—never the grading.",
    practiceDaysLegend: "Which days usually work?",
    practiceDaysHint: "Choose at least one. Due reviews remain visible on every day.",
    sessionLengthLegend: "How long should a normal session be?",
    minutes: "minutes",
    helpStyleLegend: "What helps when something is not clear yet?",
    visualModeLegend: "Which presentation feels comfortable?",
    readingModeLegend: "How should longer explanations look?",
    geometrySideLegend: "Which hand do you usually draw with?",
    geometrySideHint: "On larger screens, the geometry tools appear on that side.",
    back: "Back",
    saving: "Saving …",
    saveChanges: "Save changes",
    saveAndStart: "Save profile and start",
    previewEyebrow: "WHAT ADAPTS",
    previewTitle: "A real training plan, not a one-off exam.",
    lessonTitle: "Lessons",
    lessonDescription: "build each topic with continually changing questions.",
    reviewTitle: "Reviews",
    reviewDescription: "return when needed and award their smaller fixed XP value.",
    assessmentTitle: "Assessments",
    assessmentDescription: "mix topics and bring gaps back into the plan.",
    privacyNote: "Stored only on this device · no date of birth · no full name",
    nicknameError: "The nickname needs 2 to 24 characters.",
    examDateError: "Choose today or a future exam date.",
    practiceDaysError: "Choose at least one calm learning day.",
    saveError: "The profile could not be saved.",
    practiceDayLabels: {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    },
    helpStyleLabels: {
      concise: { title: "Short and direct", description: "Start with only the next small hint." },
      visual: { title: "With a picture", description: "Start with the central idea and its visual model." },
      story: { title: "With an example", description: "Start with the same idea in an easier situation." },
      "step-by-step": { title: "Step by step", description: "Build one complete path visibly." },
    },
    visualModeLabels: {
      calm: { title: "Calm", description: "Warm surfaces and gentle orientation." },
      focus: {
        title: "Focus",
        description: "Keep the learning plan, XP, and reviews; hide quests, badges, and the collection.",
      },
      "high-contrast": { title: "High contrast", description: "Stronger edges and clearer text colours." },
    },
    readingModeLabels: {
      standard: { title: "Standard", description: "Familiar type and normal text spacing." },
      spacious: { title: "More reading space", description: "Clearer type, more spacing, and shorter lines." },
    },
    geometrySideLabels: {
      right: { title: "Tools on the right", description: "The plan stays visible to the left of your drawing hand." },
      left: { title: "Tools on the left", description: "The plan stays visible to the right of your drawing hand." },
    },
  },
}

const spanishCopy: AppCopy = {
  language: {
    label: "Idioma",
    hint: "El idioma cambia inmediatamente y se guarda en este dispositivo.",
  },
  header: {
    home: "Ir al plan de estudio",
    privacy: "Privacidad",
    privacyAria: "Abrir información sobre privacidad y datos locales",
    progressAria: "Abrir progreso",
    progressHint: "Ver progreso",
    setupAria: "Se está configurando el perfil inicial",
    setupTitle: "Tu comienzo",
    setupHint: "sin suposiciones",
  },
  loading: "Preparando tu plan de estudio…",
  onboarding: {
    progress: (question, total, activeTime) => `Pregunta ${question} de ${total} · ${activeTime} de actividad`,
    eyebrow: "TE DAMOS LA BIENVENIDA A GYMIQUEST",
    title: "Encontremos el mejor punto de partida para ti.",
    intro: "No tienes que repetirlo todo ni saberlo todo de antemano. Una prueba breve muestra qué ideas ya dominas y cuáles conviene aprender primero.",
    noGradeTitle: "Sin nota",
    noGradeDetail: "El resultado solo organiza tu plan de estudio.",
    reviewTitle: "No se omite nada",
    reviewDetail: "Los temas confirmados vuelven pronto como repasos.",
    noXpTitle: "Sin presión por los XP",
    noXpDetail: "Los XP empiezan únicamente con el entrenamiento real.",
    resume: "Continuar la prueba inicial",
    start: "Empezar la prueba inicial",
    foundations: "Empezar por los fundamentos",
    duration: (questionCount) => `${questionCount} preguntas · unos 5 minutos · las respuestas se guardan en este dispositivo`,
    pathAria: "El itinerario de aprendizaje va de una breve prueba inicial a lecciones, repasos y evaluaciones",
    pathEyebrow: "TU ITINERARIO DE APRENDIZAJE",
    pathTitle: "Se adapta con cada respuesta",
    placementTitle: "Prueba inicial",
    placementDetail: "¿Qué dominas ya?",
    lessonsTitle: "Lecciones",
    lessonsDetail: "Comprende ideas nuevas",
    reviewsTitle: "Repasos",
    reviewsDetail: "Mantén disponibles tus conocimientos",
    assessmentsTitle: "Evaluaciones",
    assessmentsDetail: "Recupera las lagunas de forma deliberada",
    pathNote: "Tu plan de estudio empieza cuando eliges un punto de partida.",
  },
  player: {
    taskKinds: {
      lesson: "Lección",
      review: "Repaso",
      repair: "Refuerzo",
      assessment: "Evaluación",
      placement: "Prueba inicial",
    },
    recovery: "Ronda de consolidación",
    takeaway: "Idea clave",
    back: "Atrás",
    practiceNow: "Practicar ahora",
    continue: "Continuar",
    assessmentReadyAria: "El tiempo de aprendizaje comienza con la evaluación",
    ready: "Listo",
    activeLearningTime: (time, paused) => `${time} de aprendizaje activo${paused ? ", en pausa" : ""}`,
    pause: "Pausa",
    resume: "Reanudar",
    pausedEyebrow: "TIEMPO DE APRENDIZAJE EN PAUSA",
    pausedTitle: "Tómate un descanso tranquilo.",
    pausedBody: "El ejercicio queda oculto. Tu respuesta y el tiempo de aprendizaje activo se guardan en este dispositivo.",
    activeTime: (time) => `${time} de aprendizaje activo`,
    resumeLearning: "Reanudar el aprendizaje",
    pauseTopic: (topic) => `¿Poner en pausa ${topic}?`,
    lessonPauseBody: "La lección terminará y esperará en la vista del acompañante para que la expliquéis juntos.",
    keepViewingLesson: "Seguir viendo la lección",
    pauseAndReport: "Poner en pausa y avisar",
    notUnderstood: "Todavía no entiendo este tema",
    learningPlan: "Plan de estudio",
    prerequisiteDetourEyebrow: "REPASO RÁPIDO",
    prerequisiteDetourTitle: (topic) => `Primero un repaso breve: ${topic}`,
    prerequisiteDetourBody: "Tu ejercicio y tu trabajo quedan guardados. Después seguirás exactamente desde aquí.",
    returnToQuestion: "Volver a mi ejercicio",
    prerequisiteReturnNotice: (xp) => `Repaso completado · +${xp} XP. Tu trabajo sigue aquí.`,
    questionProgress: (current, total) => `Pregunta ${current} de ${total}`,
    difficultyBands: {
      foundation: "Fundamentos",
      standard: "Estándar",
      exam: "Tipo examen",
    },
    notationTitle: "¿Qué significa □?",
    notationBody: (partCount) => `La casilla es el numerador: indica cuántas de las ${partCount} partes iguales de tiempo se buscan. Escribe solo ese número abajo.`,
    moreOptions: "Más opciones",
    reportIssue: "Informar de un error en este ejercicio",
    questionPauseBody: "El ejercicio terminará. No aparecerán más ejercicios de este tema hasta que un acompañante lo haya explicado y reabierto.",
    keepTrying: "Seguir intentándolo",
    coordinateX: "coordenada x",
    coordinateY: "coordenada y",
    fractionPlaceholder: "p. ej., 3/4",
    integerSetPlaceholder: "p. ej., 1234, 1324, 2134",
    integerSequencePlaceholder: "p. ej., 2, 3, 1, 4",
    saveAnswer: "Guardar respuesta",
    submitAnswer: "Entregar respuesta",
    checkCalculation: "Comprobar cálculo",
    checkStep: (step) => `Comprobar paso ${step}`,
    checkConstruction: "Comprobar construcción",
    checkAnswer: "Comprobar",
    incorrect: "Incorrecta.",
    wrongAnswerTitle: "Esa respuesta aún no es correcta.",
    wrongAnswerMessage: "Revisa tus cálculos o elige exactamente la ayuda que necesitas.",
    formatRetryNote: "No cuenta como error.",
    nextStep: "Siguiente paso",
    correct: "Correcto.",
    finish: "Terminar",
    assessmentAnswerRecorded: "Respuesta guardada. El repaso aparecerá cuando termines.",
    assessmentModeNote: "Modo evaluación: cada respuesta entregada es definitiva. Ves inmediatamente si es correcta. Lo que haya que corregir se explicará cuando termines.",
    placementModeNote: "Prueba inicial: sin nota ni resultados intermedios. Los temas que no estén claros se explicarán más adelante.",
    helpTitle: "Todavía no lo entiendo",
    helpSubtitle: "Elige exactamente la ayuda que necesitas.",
    helpOptionLabels: {
      hint: "Una pequeña pista",
      easier: "Con números más sencillos",
      concept: "Construir la idea desde el principio",
      solution: "Paso a paso",
      prerequisites: "Ver requisitos previos",
    },
    recommended: "Tu punto de partida",
    recommendedTitle: (option) => `${option}: tu punto de partida preferido`,
    hintEyebrow: "SIGUIENTE PASO",
    easierEyebrow: "LA MISMA IDEA, MÁS SENCILLA",
    solutionEyebrow: "CAMINO DE SOLUCIÓN",
    prerequisitesEyebrow: "REQUISITOS PREVIOS",
    solutionContinue: "Entendido, continuar con la solución",
    noPrerequisites: "Este tema no necesita ningún requisito previo más. Prueba la pequeña pista.",
    openPrerequisite: "abrir ›",
    assessmentEyebrow: (number, minimalFocus) => minimalFocus
      ? `EVALUACIÓN ${number ?? ""}`.trim()
      : `CONTROL DE EXPEDICIÓN ${number ?? ""} · EVALUACIÓN`.replace("  ", " ").trim(),
    assessmentTitle: "Muestra lo que ya puedes recordar sin ayuda.",
    assessmentBody: "Esta breve ronda mixta no es un boletín escolar. Comprueba qué ideas tienes disponibles y cuáles deben volver como repasos específicos.",
    exercises: "Preguntas",
    topics: "Temas",
    minutes: "Minutos",
    assessmentRouteAria: (minimalFocus) => minimalFocus ? "Secuencia de evaluación" : "Secuencia del control de expedición",
    preparation: "Preparación",
    checkpoint: "Control",
    prepareCalmly: "prepárate con calma",
    mixedRound: "Ronda mixta",
    withoutHints: "sin pistas",
    reviewPlan: "Plan de repaso",
    returnRoute: "Camino de vuelta",
    onlyWhereNeeded: "solo donde haga falta",
    rulesTitle: "Cómo funciona",
    assessmentRules: [
      "Envías exactamente una respuesta por pregunta.",
      "Las preguntas son de tipo examen y utilizan valores y variantes nuevos cada vez.",
      "Después de entregarla, ves inmediatamente si la respuesta era correcta. Lo que haya que corregir se explicará cuando termines.",
      "Los temas incorrectos se guardan y vuelven en repasos específicos futuros.",
    ],
    mixedFrom: "Mezcla de hoy de",
    startAssessment: "Empezar evaluación",
    timeStartsAfterStart: "El tiempo de aprendizaje activo solo empieza cuando tú comienzas.",
    practicePathTitle: "Construye el camino de cálculo",
    practicePathDetail: "Comprobamos de arriba abajo y mostramos solo la primera diferencia.",
    practicePathProgress: (completed, next) => `El paso ${completed} es correcto. Continúa con el paso ${next}.`,
    practicePathNote: "Corrige el mismo camino de cálculo tantas veces como necesites. Cuenta como una sola pregunta dudosa como máximo.",
    geometryLegend: "Construye sobre el plano",
    geometryDetail: "Elige la herramienta adecuada. Después toca o arrastra sobre el plano; usa el control para ajustar con precisión.",
    geometryToolsAria: "Herramientas de geometría",
    geometryTools: {
      parallel: { title: "Recta paralela", description: "distancia fija de una recta" },
      circle: { title: "Círculo", description: "distancia fija de un punto" },
      bisector: { title: "Mediatriz", description: "misma distancia de dos puntos" },
    },
    geometryCanvasAria: "Plano de construcción interactivo. Debajo del plano hay un control para ajustarlo con precisión mediante el teclado.",
    geometryCanvasTitle: "Plano geométrico con los objetos dados y la construcción del estudiante",
    geometryEmpty: "Primero elige la herramienta que corresponde a la condición de distancia.",
    geometryFineTune: "Ajuste preciso",
    geometryFineTuneAria: "Ajustar la construcción con precisión",
    geometryInteractionHint: "Tacto, Pencil o ratón: toca el plano o arrastra el tirador · Teclado: flechas del control",
    geometryPosition: "Posición en el plano",
    geometryDistance: (distance) => `Distancia de s: ${distance} cm`,
    geometryRadius: (radius) => `Radio: ${radius} cm`,
    geometryPointDistances: (first, second) => `a B₁: ${first} cm · a B₂: ${second} cm`,
    visual: {
      fractionParts: (numerator, denominator) => `${numerator} de ${denominator} partes`,
      equationAria: "Cadena de cálculo con un número que falta",
      factorAria: "Dos productos con un factor común",
      factorQuestion: "¿Qué puedes sacar como factor común?",
      totalTime: "Tiempo total",
      unspecifiedTotal: "Tiempo total",
      givenMinutes: "minutos dados",
      remainingTime: "tiempo restante",
      timeFlowAria: (total, denominator, subtracted, remaining) => `${total} de tiempo total se divide en ${denominator} partes iguales. Se toma una cantidad desconocida de esas partes. Después se restan ${subtracted} y quedan ${remaining}.`,
      splitInto: "dividido en",
      equalParts: (count) => `${count} partes iguales`,
      wanted: "buscado",
      parts: "partes",
      subtractAfter: "después restar",
      remaining: "restante",
      timeCaption: "Este resumen solo organiza la información dada; no muestra ningún resultado intermedio.",
      catchUpAria: "Dos personas se desplazan por el mismo trayecto",
      start: "Inicio",
      meetingPoint: "Punto de encuentro ?",
      headStart: (minutes) => `${minutes} minutos de ventaja`,
      timeUsed: "Tiempo ya utilizado",
      delay: "Retraso",
      tourAria: "Recorrido con dos tramos de velocidad",
      section: (number) => `Tramo ${number}`,
      campsAria: "Días de senderismo y natación en tres campamentos de vacaciones",
      campsCaption: "Comparación de tres campamentos",
      daysPerCamp: "Días por campamento",
      libraryAria: "Libros prestados durante tres semanas",
      libraryCaption: "Biblioteca escolar",
      loans: "Préstamos",
      booksPerWeek: (count) => `${count} libros por semana`,
      routeAria: "Tramos y recorrido total en bicicleta",
      routeCaption: "Ruta en bicicleta por el mercado",
      route: "Ruta",
      distance: "Distancia",
      numberFilterAria: "Cifras filtradas según varias condiciones",
      allSolutions: "todas las soluciones",
      tileAria: "Plano de baldosas en cuadrados unidad",
      frameAria: "Marco rectangular",
      notchAria: "Rectángulo con una muesca",
      cornerAria: "Rectángulo con una esquina recortada",
      widthHeight: (width, height) => `${width} cm de ancho · ${height} cm de alto`,
      coordinateAria: (x, y, transformation) => `Sistema de coordenadas con el punto P en ${x}, ${y}. ${transformation}`,
      cubeNetAria: (face) => `Desarrollo de cubo con la cara ${face} marcada`,
      pyramidAria: (path) => `Caras de la pirámide etiquetadas${path ? `; recorrido de vuelco ${path}` : ""}`,
      left: "izquierda",
      right: "derecha",
      bottom: "abajo",
      back: "atrás",
      tippingPath: "Recorrido de vuelco",
      length: (value) => `${value} cm de largo`,
      width: (value) => `${value} cm de ancho`,
    },
  },
  profile: {
    progressBack: "Progreso",
    stepLabel: (step) => `Paso ${step} de 2`,
    goalEyebrow: "TU OBJETIVO · PASO 1 DE 2",
    goalTitle: "¿Para quién y hasta cuándo hacemos el plan?",
    goalIntro: "Basta con un apodo y la fecha del examen. Ambos se guardan en este dispositivo y se pueden cambiar más adelante.",
    nicknameLabel: "Tu apodo",
    nicknamePlaceholder: "p. ej., Mia",
    nicknameHint: "No hace falta tu nombre completo.",
    examDateLabel: "Fecha del examen de ingreso",
    examDateHint: "Así el plan de estudio puede mostrar su ritmo.",
    rhythmButton: "Elegir ritmo de estudio",
    rhythmEyebrow: "TU RITMO · PASO 2 DE 2",
    rhythmTitle: "¿Cómo debe ayudarte GymiQuest?",
    rhythmIntro: "Estas opciones cambian la cantidad diaria y el primer tipo de ayuda, nunca la corrección.",
    practiceDaysLegend: "¿Qué días suelen venirte bien?",
    practiceDaysHint: "Elige al menos uno. Los repasos pendientes permanecen visibles todos los días.",
    sessionLengthLegend: "¿Cuánto debería durar una sesión normal?",
    minutes: "minutos",
    helpStyleLegend: "¿Qué te ayuda cuando algo aún no está claro?",
    visualModeLegend: "¿Qué presentación te resulta cómoda?",
    readingModeLegend: "¿Cómo quieres ver las explicaciones más largas?",
    geometrySideLegend: "¿Con qué mano sueles dibujar?",
    geometrySideHint: "En pantallas grandes, las herramientas de geometría aparecen en ese lado.",
    back: "Atrás",
    saving: "Guardando…",
    saveChanges: "Guardar cambios",
    saveAndStart: "Guardar perfil y empezar",
    previewEyebrow: "LO QUE SE ADAPTA",
    previewTitle: "Un plan de entrenamiento real, no un examen único.",
    lessonTitle: "Lecciones",
    lessonDescription: "construyen cada tema con preguntas que cambian continuamente.",
    reviewTitle: "Repasos",
    reviewDescription: "vuelven cuando hacen falta y dan su valor fijo reducido de XP.",
    assessmentTitle: "Evaluaciones",
    assessmentDescription: "mezclan temas y devuelven las lagunas al plan.",
    privacyNote: "Solo se guarda en este dispositivo · sin fecha de nacimiento · sin nombre completo",
    nicknameError: "El apodo debe tener entre 2 y 24 caracteres.",
    examDateError: "Elige la fecha de hoy o una fecha futura para el examen.",
    practiceDaysError: "Elige al menos un día tranquilo para estudiar.",
    saveError: "No se ha podido guardar el perfil.",
    practiceDayLabels: {
      monday: "lun",
      tuesday: "mar",
      wednesday: "mié",
      thursday: "jue",
      friday: "vie",
      saturday: "sáb",
      sunday: "dom",
    },
    helpStyleLabels: {
      concise: { title: "Breve y directo", description: "Empieza solo con la siguiente pequeña pista." },
      visual: { title: "Con una imagen", description: "Empieza por la idea central y su modelo visual." },
      story: { title: "Con un ejemplo", description: "Empieza con la misma idea en una situación más sencilla." },
      "step-by-step": { title: "Paso a paso", description: "Construye de forma visible un camino completo." },
    },
    visualModeLabels: {
      calm: { title: "Tranquilo", description: "Superficies cálidas y orientación suave." },
      focus: {
        title: "Concentración",
        description: "Mantén el plan de estudio, los XP y los repasos; oculta misiones, insignias y la colección.",
      },
      "high-contrast": { title: "Alto contraste", description: "Bordes más marcados y colores de texto más claros." },
    },
    readingModeLabels: {
      standard: { title: "Estándar", description: "Tipografía familiar y espaciado normal." },
      spacious: { title: "Más espacio de lectura", description: "Tipografía más clara, más espacio y líneas más cortas." },
    },
    geometrySideLabels: {
      right: { title: "Herramientas a la derecha", description: "El plano queda visible a la izquierda de la mano con la que dibujas." },
      left: { title: "Herramientas a la izquierda", description: "El plano queda visible a la derecha de la mano con la que dibujas." },
    },
  },
}

const italianCopy: AppCopy = {
  language: {
    label: "Lingua",
    hint: "La lingua cambia subito e resta memorizzata su questo dispositivo.",
  },
  header: {
    home: "Vai al piano di studio",
    privacy: "Privacy",
    privacyAria: "Apri le informazioni sulla privacy e sui dati locali",
    progressAria: "Apri i progressi",
    progressHint: "Visualizza i progressi",
    setupAria: "Configurazione del profilo iniziale in corso",
    setupTitle: "Il tuo inizio",
    setupHint: "senza supposizioni",
  },
  loading: "Preparazione del tuo piano di studio …",
  onboarding: {
    progress: (question, total, activeTime) => `Domanda ${question} di ${total} · ${activeTime} di attività`,
    eyebrow: "BENVENUTO IN GYMIQUEST",
    title: "Troviamo il punto di partenza migliore per te.",
    intro: "Non devi ripetere tutto né sapere già tutto. Una breve verifica mostra quali idee sono solide e quali conviene imparare per prime.",
    noGradeTitle: "Nessun voto",
    noGradeDetail: "Il risultato serve soltanto a organizzare il tuo piano di studio.",
    reviewTitle: "Non saltiamo nulla",
    reviewDetail: "Gli argomenti confermati ritornano presto come ripassi.",
    noXpTitle: "Nessuna pressione per gli XP",
    noXpDetail: "Gli XP iniziano soltanto con l'allenamento vero e proprio.",
    resume: "Continua la verifica iniziale",
    start: "Inizia la verifica iniziale",
    foundations: "Parti dalle basi",
    duration: (questionCount) => `${questionCount} domande · circa 5 minuti · le risposte restano su questo dispositivo`,
    pathAria: "Il percorso di studio porta da una breve verifica iniziale a lezioni, ripassi e verifiche",
    pathEyebrow: "IL TUO PERCORSO DI STUDIO",
    pathTitle: "Si adatta a ogni risposta",
    placementTitle: "Verifica iniziale",
    placementDetail: "Che cosa sai già con sicurezza?",
    lessonsTitle: "Lezioni",
    lessonsDetail: "Comprendi idee nuove",
    reviewsTitle: "Ripassi",
    reviewsDetail: "Mantieni pronte le conoscenze",
    assessmentsTitle: "Verifiche",
    assessmentsDetail: "Riprendi in modo mirato ciò che manca",
    pathNote: "Il tuo piano di studio comincia soltanto dopo che hai scelto da dove partire.",
  },
  player: {
    taskKinds: {
      lesson: "Lezione",
      review: "Ripasso",
      repair: "Recupero",
      assessment: "Verifica",
      placement: "Verifica iniziale",
    },
    recovery: "Giro di consolidamento",
    takeaway: "Da ricordare",
    back: "Indietro",
    practiceNow: "Esercitati ora",
    continue: "Continua",
    assessmentReadyAria: "Il tempo di studio inizia con la verifica",
    ready: "Pronto",
    activeLearningTime: (time, paused) => `${time} di studio attivo${paused ? ", in pausa" : ""}`,
    pause: "Pausa",
    resume: "Riprendi",
    pausedEyebrow: "TEMPO DI STUDIO IN PAUSA",
    pausedTitle: "Prenditi una pausa con calma.",
    pausedBody: "L'esercizio resta nascosto. La tua risposta e il tempo di studio attivo trascorso finora restano su questo dispositivo.",
    activeTime: (time) => `${time} di studio attivo`,
    resumeLearning: "Riprendi lo studio",
    pauseTopic: (topic) => `Mettere in pausa ${topic}?`,
    lessonPauseBody: "La lezione termina e attende nella sezione di accompagnamento, così potrete chiarirla insieme.",
    keepViewingLesson: "Continua a vedere la lezione",
    pauseAndReport: "Metti in pausa e segnala",
    notUnderstood: "Non ho ancora capito questo argomento",
    learningPlan: "Piano di studio",
    prerequisiteDetourEyebrow: "RIPASSO RAPIDO",
    prerequisiteDetourTitle: (topic) => `Prima un breve ripasso: ${topic}`,
    prerequisiteDetourBody: "Il tuo esercizio e il tuo lavoro restano salvati. Poi riprenderai esattamente da qui.",
    returnToQuestion: "Torna al mio esercizio",
    prerequisiteReturnNotice: (xp) => `Ripasso completato · +${xp} XP. Il tuo lavoro è ancora qui.`,
    questionProgress: (current, total) => `Domanda ${current} di ${total}`,
    difficultyBands: {
      foundation: "Basi",
      standard: "Standard",
      exam: "Stile d'esame",
    },
    notationTitle: "Che cosa significa □?",
    notationBody: (partCount) => `La casella è il numeratore: indica quante delle ${partCount} parti di tempo uguali stiamo cercando. Inserisci sotto soltanto quel numero.`,
    moreOptions: "Altre opzioni",
    reportIssue: "Segnala un errore in questo esercizio",
    questionPauseBody: "L'esercizio termina. Non compariranno altri esercizi su questo argomento finché una persona adulta non lo avrà spiegato e riaperto.",
    keepTrying: "Continua a provare",
    coordinateX: "coordinata x",
    coordinateY: "coordinata y",
    fractionPlaceholder: "es. 3/4",
    integerSetPlaceholder: "es. 1234, 1324, 2134",
    integerSequencePlaceholder: "es. 2, 3, 1, 4",
    saveAnswer: "Salva la risposta",
    submitAnswer: "Invia la risposta",
    checkCalculation: "Controlla il calcolo",
    checkStep: (step) => `Controlla il passaggio ${step}`,
    checkConstruction: "Controlla la costruzione",
    checkAnswer: "Controlla",
    incorrect: "Risposta errata.",
    wrongAnswerTitle: "La risposta non è ancora corretta.",
    wrongAnswerMessage: "Controlla il procedimento oppure scegli esattamente l'aiuto che ti serve.",
    formatRetryNote: "Non conta come errore.",
    nextStep: "Passaggio successivo",
    correct: "Corretto.",
    finish: "Termina",
    assessmentAnswerRecorded: "Risposta salvata. Il riepilogo apparirà dopo la conclusione.",
    assessmentModeNote: "Modalità verifica: ogni risposta inviata è definitiva. Vedi subito se è corretta. Quello che va corretto verrà spiegato dopo la conclusione.",
    placementModeNote: "Verifica iniziale: nessun voto e nessun risultato intermedio. Gli argomenti poco chiari verranno spiegati più avanti.",
    helpTitle: "Non l'ho ancora capito",
    helpSubtitle: "Scegli esattamente l'aiuto che ti serve.",
    helpOptionLabels: {
      hint: "Un piccolo suggerimento",
      easier: "Con numeri più semplici",
      concept: "Costruisci l'idea dalle basi",
      solution: "Passaggio per passaggio",
      prerequisites: "Vedi i prerequisiti",
    },
    recommended: "Il tuo punto di partenza",
    recommendedTitle: (option) => `${option} – il punto di partenza che preferisci`,
    hintEyebrow: "PROSSIMO PASSAGGIO",
    easierEyebrow: "LA STESSA IDEA, PIÙ SEMPLICE",
    solutionEyebrow: "PROCEDIMENTO",
    prerequisitesEyebrow: "PREREQUISITI",
    solutionContinue: "Ho capito, continua con la soluzione",
    noPrerequisites: "Questo argomento non richiede altri prerequisiti. Prova il piccolo suggerimento.",
    openPrerequisite: "apri ›",
    assessmentEyebrow: (number, minimalFocus) => minimalFocus
      ? `VERIFICA ${number ?? ""}`.trim()
      : `CONTROLLO DELLA SPEDIZIONE ${number ?? ""} · VERIFICA`.replace("  ", " ").trim(),
    assessmentTitle: "Mostra che cosa riesci già a richiamare senza aiuto.",
    assessmentBody: "Questo breve giro misto non è una pagella. Controlla quali idee sono disponibili e quali devono tornare come ripassi mirati.",
    exercises: "Domande",
    topics: "Argomenti",
    minutes: "Minuti",
    assessmentRouteAria: (minimalFocus) => minimalFocus ? "Sequenza della verifica" : "Sequenza del controllo della spedizione",
    preparation: "Preparazione",
    checkpoint: "Controllo",
    prepareCalmly: "preparati con calma",
    mixedRound: "Giro misto",
    withoutHints: "senza suggerimenti",
    reviewPlan: "Piano dei ripassi",
    returnRoute: "Percorso di ritorno",
    onlyWhereNeeded: "soltanto dove serve",
    rulesTitle: "Come funziona",
    assessmentRules: [
      "Invii esattamente una risposta per ogni domanda.",
      "Le domande sono in stile d'esame e usano ogni volta valori e varianti nuovi.",
      "Dopo l'invio vedi subito se la risposta era corretta. Quello che va corretto verrà spiegato dopo la conclusione.",
      "Gli argomenti sbagliati vengono salvati e ritornano nei ripassi mirati futuri.",
    ],
    mixedFrom: "Oggi mescolato da",
    startAssessment: "Inizia la verifica",
    timeStartsAfterStart: "Il tempo di studio attivo inizia soltanto dopo l'avvio.",
    practicePathTitle: "Costruisci il procedimento",
    practicePathDetail: "Controlliamo dall'alto verso il basso e mostriamo soltanto il primo punto che non coincide.",
    practicePathProgress: (completed, next) => `Il passaggio ${completed} è corretto. Continua con il passaggio ${next}.`,
    practicePathNote: "Correggi lo stesso procedimento tutte le volte che serve. Conta al massimo come una domanda incerta.",
    geometryLegend: "Costruisci sul piano",
    geometryDetail: "Scegli lo strumento adatto. Poi tocca o trascina sul piano; usa il comando per una regolazione precisa.",
    geometryToolsAria: "Strumenti geometrici",
    geometryTools: {
      parallel: { title: "Retta parallela", description: "distanza fissa da una retta" },
      circle: { title: "Circonferenza", description: "distanza fissa da un punto" },
      bisector: { title: "Asse del segmento", description: "stessa distanza da due punti" },
    },
    geometryCanvasAria: "Piano di costruzione interattivo. Un comando sotto il piano permette una regolazione precisa anche con la tastiera.",
    geometryCanvasTitle: "Piano geometrico con gli oggetti dati e la costruzione dello studente",
    geometryEmpty: "Scegli prima lo strumento adatto alla condizione sulla distanza.",
    geometryFineTune: "Regolazione precisa",
    geometryFineTuneAria: "Regola con precisione la costruzione",
    geometryInteractionHint: "Touch, Pencil o mouse: tocca il piano o trascina la maniglia · Tastiera: frecce sul comando",
    geometryPosition: "Posizione sul piano",
    geometryDistance: (distance) => `Distanza da s: ${distance} cm`,
    geometryRadius: (radius) => `Raggio: ${radius} cm`,
    geometryPointDistances: (first, second) => `da B₁: ${first} cm · da B₂: ${second} cm`,
    visual: {
      fractionParts: (numerator, denominator) => `${numerator} di ${denominator} parti`,
      equationAria: "Catena di calcoli con un numero mancante",
      factorAria: "Due prodotti con un fattore comune",
      factorQuestion: "Che cosa puoi raccogliere?",
      totalTime: "Tempo totale",
      unspecifiedTotal: "Tempo totale",
      givenMinutes: "minuti dati",
      remainingTime: "tempo rimanente",
      timeFlowAria: (total, denominator, subtracted, remaining) => `${total} di tempo totale viene diviso in ${denominator} parti uguali. Si prendono alcune di queste parti. Poi si sottrae ${subtracted}, lasciando ${remaining}.`,
      splitInto: "diviso in",
      equalParts: (count) => `${count} parti uguali`,
      wanted: "cercate",
      parts: "parti",
      subtractAfter: "poi sottrai",
      remaining: "rimane",
      timeCaption: "Questa panoramica organizza soltanto i dati: non mostra un risultato intermedio.",
      catchUpAria: "Due persone si muovono lungo lo stesso percorso",
      start: "Partenza",
      meetingPoint: "Punto d'incontro ?",
      headStart: (minutes) => `${minutes} minuti di vantaggio`,
      timeUsed: "Tempo già utilizzato",
      delay: "Ritardo",
      tourAria: "Percorso con due tratti a velocità diverse",
      section: (number) => `Tratto ${number}`,
      campsAria: "Giorni di escursioni e nuoto in tre campi estivi",
      campsCaption: "Confronto tra tre campi",
      daysPerCamp: "Giorni per campo",
      libraryAria: "Libri prestati in tre settimane",
      libraryCaption: "Biblioteca scolastica",
      loans: "Prestiti",
      booksPerWeek: (count) => `${count} libri alla settimana`,
      routeAria: "Tratti e percorso ciclabile totale",
      routeCaption: "Percorso ciclabile passando dal mercato",
      route: "Percorso",
      distance: "Distanza",
      numberFilterAria: "Cifre filtrate da diverse condizioni",
      allSolutions: "tutte le soluzioni",
      tileAria: "Schema di piastrelle in quadrati unitari",
      frameAria: "Cornice rettangolare",
      notchAria: "Rettangolo con un'incavatura",
      cornerAria: "Rettangolo con un angolo ritagliato",
      widthHeight: (width, height) => `${width} cm di larghezza · ${height} cm di altezza`,
      coordinateAria: (x, y, transformation) => `Piano cartesiano con il punto P in ${x}, ${y}. ${transformation}`,
      cubeNetAria: (face) => `Sviluppo del cubo con la faccia ${face} contrassegnata`,
      pyramidAria: (path) => `Facce numerate della piramide${path ? `; percorso di ribaltamento ${path}` : ""}`,
      left: "sinistra",
      right: "destra",
      bottom: "base",
      back: "dietro",
      tippingPath: "Percorso di ribaltamento",
      length: (value) => `${value} cm di lunghezza`,
      width: (value) => `${value} cm di larghezza`,
    },
  },
  profile: {
    progressBack: "Progressi",
    stepLabel: (step) => `Passaggio ${step} di 2`,
    goalEyebrow: "IL TUO OBIETTIVO · PASSAGGIO 1 DI 2",
    goalTitle: "Per chi e fino a quando pianifichiamo?",
    goalIntro: "Bastano un soprannome e la data dell'esame. Entrambi restano su questo dispositivo e si possono cambiare in seguito.",
    nicknameLabel: "Il tuo soprannome",
    nicknamePlaceholder: "es. Mia",
    nicknameHint: "Non serve il nome completo.",
    examDateLabel: "Data dell'esame d'ammissione",
    examDateHint: "Serve al piano di studio per mostrare il ritmo.",
    rhythmButton: "Scegli il ritmo di studio",
    rhythmEyebrow: "IL TUO RITMO · PASSAGGIO 2 DI 2",
    rhythmTitle: "Come deve aiutarti GymiQuest?",
    rhythmIntro: "Queste scelte cambiano la porzione giornaliera e il primo tipo di aiuto, mai la valutazione.",
    practiceDaysLegend: "Quali giorni vanno bene di solito?",
    practiceDaysHint: "Scegline almeno uno. I ripassi in scadenza restano visibili ogni giorno.",
    sessionLengthLegend: "Quanto deve durare una sessione normale?",
    minutes: "minuti",
    helpStyleLegend: "Che cosa ti aiuta quando qualcosa non è ancora chiaro?",
    visualModeLegend: "Quale presentazione ti fa sentire a tuo agio?",
    readingModeLegend: "Come devono apparire le spiegazioni più lunghe?",
    geometrySideLegend: "Con quale mano disegni di solito?",
    geometrySideHint: "Sugli schermi più grandi, gli strumenti geometrici compaiono su quel lato.",
    back: "Indietro",
    saving: "Salvataggio …",
    saveChanges: "Salva le modifiche",
    saveAndStart: "Salva il profilo e inizia",
    previewEyebrow: "CHE COSA SI ADATTA",
    previewTitle: "Un vero piano di allenamento, non un singolo esame.",
    lessonTitle: "Lezioni",
    lessonDescription: "costruiscono ogni argomento con domande sempre diverse.",
    reviewTitle: "Ripassi",
    reviewDescription: "ritornano quando servono e assegnano il loro valore fisso ridotto di XP.",
    assessmentTitle: "Verifiche",
    assessmentDescription: "mescolano gli argomenti e riportano nel piano le lacune.",
    privacyNote: "Memorizzato soltanto su questo dispositivo · nessuna data di nascita · nessun nome completo",
    nicknameError: "Il soprannome deve contenere da 2 a 24 caratteri.",
    examDateError: "Scegli una data d'esame di oggi o futura.",
    practiceDaysError: "Scegli almeno un giorno tranquillo per studiare.",
    saveError: "Non è stato possibile salvare il profilo.",
    practiceDayLabels: {
      monday: "Lun",
      tuesday: "Mar",
      wednesday: "Mer",
      thursday: "Gio",
      friday: "Ven",
      saturday: "Sab",
      sunday: "Dom",
    },
    helpStyleLabels: {
      concise: { title: "Breve e diretto", description: "Inizia soltanto con il prossimo piccolo suggerimento." },
      visual: { title: "Con un'immagine", description: "Inizia dall'idea centrale e dal suo modello visivo." },
      story: { title: "Con un esempio", description: "Inizia dalla stessa idea in una situazione più semplice." },
      "step-by-step": { title: "Passaggio per passaggio", description: "Costruisci in modo visibile un procedimento completo." },
    },
    visualModeLabels: {
      calm: { title: "Calma", description: "Superfici calde e orientamento delicato." },
      focus: {
        title: "Concentrazione",
        description: "Mantieni piano di studio, XP e ripassi; nascondi missioni, distintivi e collezione.",
      },
      "high-contrast": { title: "Contrasto elevato", description: "Bordi più marcati e colori del testo più chiari." },
    },
    readingModeLabels: {
      standard: { title: "Standard", description: "Carattere familiare e spaziatura normale." },
      spacious: { title: "Più spazio per leggere", description: "Testo più chiaro, più spazio e righe più brevi." },
    },
    geometrySideLabels: {
      right: { title: "Strumenti a destra", description: "Il piano resta visibile a sinistra della mano con cui disegni." },
      left: { title: "Strumenti a sinistra", description: "Il piano resta visibile a destra della mano con cui disegni." },
    },
  },
}

const germanCopy: AppCopy = {
  language: {
    label: "Sprache",
    hint: "Die Sprache wechselt sofort und bleibt auf diesem Gerät gespeichert.",
  },
  header: {
    home: "Zum Lernplan",
    privacy: "Datenschutz",
    privacyAria: "Datenschutz und lokale Daten öffnen",
    progressAria: "Fortschritt öffnen",
    progressHint: "Fortschritt ansehen",
    setupAria: "Startprofil wird eingerichtet",
    setupTitle: "Dein Start",
    setupHint: "noch ohne Annahmen",
  },
  loading: "Dein Lernplan wird vorbereitet …",
  onboarding: {
    progress: (question, total, activeTime) => `Aufgabe ${question} von ${total} · ${activeTime} aktiv`,
    eyebrow: "WILLKOMMEN BEI GYMIQUEST",
    title: "Wir finden deinen besten Startpunkt.",
    intro: "Du musst weder alles wiederholen noch schon alles können. Ein kurzer Check zeigt, welche Ideen bereits sitzen und welche wir zuerst gemeinsam lernen.",
    noGradeTitle: "Keine Note",
    noGradeDetail: "Das Ergebnis ordnet nur deinen Lernplan.",
    reviewTitle: "Nichts wird übersprungen",
    reviewDetail: "Bestätigte Themen kehren früh als Wiederholung zurück.",
    noXpTitle: "Kein XP-Druck",
    noXpDetail: "XP beginnt erst mit deinem eigentlichen Training.",
    resume: "Start-Check fortsetzen",
    start: "Start-Check beginnen",
    foundations: "Bei den Grundlagen starten",
    duration: (questionCount) => `${questionCount} Aufgaben · etwa 5 Minuten · Antworten werden lokal gespeichert`,
    pathAria: "Der Lernweg führt von einem kurzen Start-Check zu Lektionen, Wiederholungen und Standortbestimmungen",
    pathEyebrow: "DEIN LERNWEG",
    pathTitle: "Passt sich mit jeder Antwort an",
    placementTitle: "Start-Check",
    placementDetail: "Was sitzt schon?",
    lessonsTitle: "Lektionen",
    lessonsDetail: "Neue Ideen verstehen",
    reviewsTitle: "Wiederholungen",
    reviewsDetail: "Wissen abrufbar halten",
    assessmentsTitle: "Standortbestimmungen",
    assessmentsDetail: "Lücken gezielt zurückholen",
    pathNote: "Dein Lernplan beginnt erst, wenn du dich für einen Start entschieden hast.",
  },
  player: {
    taskKinds: {
      lesson: "Lektion",
      review: "Wiederholung",
      repair: "Auffrischung",
      assessment: "Standortbestimmung",
      placement: "Start-Check",
    },
    recovery: "Sicherungsrunde",
    takeaway: "Merksatz",
    back: "Zurück",
    practiceNow: "Jetzt üben",
    continue: "Weiter",
    assessmentReadyAria: "Die Lernzeit startet mit der Standortbestimmung",
    ready: "Bereit",
    activeLearningTime: (time, paused) => `${time} aktive Lernzeit${paused ? ", pausiert" : ""}`,
    pause: "Pause",
    resume: "Weiter",
    pausedEyebrow: "LERNZEIT PAUSIERT",
    pausedTitle: "Mach in Ruhe eine Pause.",
    pausedBody: "Die Aufgabe bleibt verdeckt. Deine Antwort und deine bisherige aktive Lernzeit sind lokal gespeichert.",
    activeTime: (time) => `${time} aktive Lernzeit`,
    resumeLearning: "Weiterlernen",
    pauseTopic: (topic) => `${topic} pausieren?`,
    lessonPauseBody: "Die Lektion wird beendet und wartet in der Begleitansicht auf eine gemeinsame Erklärung.",
    keepViewingLesson: "Lektionen weiter ansehen",
    pauseAndReport: "Pausieren und melden",
    notUnderstood: "Ich verstehe dieses Thema noch nicht",
    learningPlan: "Lernplan",
    prerequisiteDetourEyebrow: "KURZE AUFFRISCHUNG",
    prerequisiteDetourTitle: (topic) => `Zuerst kurz auffrischen: ${topic}`,
    prerequisiteDetourBody: "Deine Aufgabe und dein Stand bleiben gespeichert. Danach geht es genau hier weiter.",
    returnToQuestion: "Zurück zu meiner Aufgabe",
    prerequisiteReturnNotice: (xp) => `Auffrischung geschafft · +${xp} XP. Dein Stand ist noch da.`,
    questionProgress: (current, total) => `Aufgabe ${current} von ${total}`,
    difficultyBands: {
      foundation: "Aufbau",
      standard: "Standard",
      exam: "Prüfungsnah",
    },
    notationTitle: "Was bedeutet □?",
    notationBody: (partCount) => `Das Kästchen ist der Zähler: die gesuchte Anzahl der ${partCount} gleich grossen Zeitteile. Trage unten nur diese Zahl ein.`,
    moreOptions: "Weitere Optionen",
    reportIssue: "Fehler in dieser Aufgabe melden",
    questionPauseBody: "Die Aufgabe wird beendet. Bis eine Begleitperson das Thema erklärt und wieder freigibt, erscheint keine weitere Trainingsaufgabe dazu.",
    keepTrying: "Weiterprobieren",
    coordinateX: "x-Koordinate",
    coordinateY: "y-Koordinate",
    fractionPlaceholder: "z. B. 3/4",
    integerSetPlaceholder: "z. B. 1234, 1324, 2134",
    integerSequencePlaceholder: "z. B. 2, 3, 1, 4",
    saveAnswer: "Antwort speichern",
    submitAnswer: "Antwort abgeben",
    checkCalculation: "Rechenweg prüfen",
    checkStep: (step) => `Schritt ${step} prüfen`,
    checkConstruction: "Konstruktion prüfen",
    checkAnswer: "Prüfen",
    incorrect: "Falsch.",
    wrongAnswerTitle: "Die Antwort stimmt noch nicht.",
    wrongAnswerMessage: "Prüfe deinen Rechenweg oder nimm genau so viel Hilfe, wie du brauchst.",
    formatRetryNote: "Das zählt nicht als Fehler.",
    nextStep: "Als Nächstes",
    correct: "Richtig.",
    finish: "Abschliessen",
    assessmentAnswerRecorded: "Antwort gespeichert. Der Rückblick folgt nach dem Abschluss.",
    assessmentModeNote: "Prüfmodus: Jede abgegebene Antwort ist endgültig. Du siehst sofort, ob sie stimmt. Was noch nicht stimmt, wird nach dem Abschluss erklärt.",
    placementModeNote: "Start-Check: keine Note und keine Zwischenresultate. Unklare Themen werden später erklärt.",
    helpTitle: "Ich verstehe es noch nicht",
    helpSubtitle: "Wähle genau die Hilfe, die du brauchst.",
    helpOptionLabels: {
      hint: "Ein kleiner Hinweis",
      easier: "Mit leichteren Zahlen",
      concept: "Die Idee von Grund auf",
      solution: "Schritt für Schritt",
      prerequisites: "Voraussetzungen ansehen",
    },
    recommended: "Dein Einstieg",
    recommendedTitle: (option) => `${option} – dein bevorzugter Einstieg`,
    hintEyebrow: "NÄCHSTER SCHRITT",
    easierEyebrow: "DIESELBE IDEE, EINFACHER",
    solutionEyebrow: "LÖSUNGSWEG",
    prerequisitesEyebrow: "VORAUSSETZUNGEN",
    solutionContinue: "Verstanden, mit Lösung weiter",
    noPrerequisites: "Für dieses Thema brauchst du keine weitere Voraussetzung. Probiere den kleinen Hinweis.",
    openPrerequisite: "öffnen ›",
    assessmentEyebrow: (number, minimalFocus) => minimalFocus
      ? `STANDORTBESTIMMUNG ${number ?? ""}`.trim()
      : `EXPEDITIONS-CHECK ${number ?? ""} · STANDORTBESTIMMUNG`.replace("  ", " ").trim(),
    assessmentTitle: "Zeig, was schon ohne Hilfe sitzt.",
    assessmentBody: "Diese kurze gemischte Runde ist kein Schulzeugnis. Sie prüft, welche Ideen abrufbar sind und welche als gezielte Wiederholung zurückkehren sollen.",
    exercises: "Aufgaben",
    topics: "Themen",
    minutes: "Minuten",
    assessmentRouteAria: (minimalFocus) => minimalFocus ? "Ablauf der Standortbestimmung" : "Ablauf des Expeditions-Checks",
    preparation: "Vorbereitung",
    checkpoint: "Checkpoint",
    prepareCalmly: "ruhig vorbereiten",
    mixedRound: "Gemischte Runde",
    withoutHints: "ohne Hinweise",
    reviewPlan: "Wiederholungsplan",
    returnRoute: "Rückweg",
    onlyWhereNeeded: "nur wo er nötig ist",
    rulesTitle: "So funktioniert es",
    assessmentRules: [
      "Du gibst pro Aufgabe genau eine Antwort ab.",
      "Die Aufgaben sind prüfungsnah und verwenden jedes Mal neue Werte und Varianten.",
      "Nach der Abgabe siehst du sofort, ob die Antwort richtig war. Was noch nicht stimmt, wird nach dem Abschluss erklärt.",
      "Falsch gelöste Themen werden gespeichert und kehren in späteren gezielten Wiederholungen zurück.",
    ],
    mixedFrom: "Heute gemischt aus",
    startAssessment: "Standortbestimmung starten",
    timeStartsAfterStart: "Die aktive Lernzeit beginnt erst nach dem Start.",
    practicePathTitle: "Baue den Rechenweg auf",
    practicePathDetail: "Wir prüfen von oben nach unten und zeigen nur die erste Abweichung.",
    practicePathProgress: (completed, next) => `Schritt ${completed} stimmt. Weiter mit Schritt ${next}.`,
    practicePathNote: "Korrigiere denselben Rechenweg so oft wie nötig. Das zählt höchstens als eine unsichere Aufgabe.",
    geometryLegend: "Konstruiere im Plan",
    geometryDetail: "Wähle das passende Werkzeug. Tippe oder ziehe danach im Plan – für Feinarbeit gibt es den Regler.",
    geometryToolsAria: "Geometriewerkzeuge",
    geometryTools: {
      parallel: { title: "Parallele", description: "fester Abstand zu einer Geraden" },
      circle: { title: "Kreis", description: "fester Abstand zu einem Punkt" },
      bisector: { title: "Mittelsenkrechte", description: "gleicher Abstand zu zwei Punkten" },
    },
    geometryCanvasAria: "Interaktiver Konstruktionsplan. Für die genaue Tastatursteuerung steht unter dem Plan ein Regler bereit.",
    geometryCanvasTitle: "Geometrischer Plan mit gegebenen Objekten und eigener Konstruktion",
    geometryEmpty: "Wähle zuerst das Werkzeug, das zur Abstandsbedingung passt.",
    geometryFineTune: "Fein einstellen",
    geometryFineTuneAria: "Konstruktion fein einstellen",
    geometryInteractionHint: "Touch, Pencil oder Maus: in den Plan tippen oder Griff ziehen · Tastatur: Pfeiltasten am Regler",
    geometryPosition: "Position im Plan",
    geometryDistance: (distance) => `Abstand zu s: ${distance} cm`,
    geometryRadius: (radius) => `Radius: ${radius} cm`,
    geometryPointDistances: (first, second) => `zu B₁: ${first} cm · zu B₂: ${second} cm`,
    visual: {
      fractionParts: (numerator, denominator) => `${numerator} von ${denominator} Teilen`,
      equationAria: "Rechenkette mit fehlender Zahl",
      factorAria: "Zwei Produkte mit gemeinsamem Faktor",
      factorQuestion: "Was kannst du ausklammern?",
      totalTime: "Gesamtzeit",
      unspecifiedTotal: "Gesamtzeit",
      givenMinutes: "angegebene Minuten",
      remainingTime: "Restzeit",
      timeFlowAria: (total, denominator, subtracted, remaining) => `${total} Gesamtzeit wird in ${denominator} gleiche Teile aufgeteilt. Eine unbekannte Anzahl dieser Teile wird genommen. Danach werden ${subtracted} abgezogen, sodass ${remaining} übrig bleiben.`,
      splitInto: "aufteilen in",
      equalParts: (count) => `${count} gleiche Teile`,
      wanted: "gesucht",
      parts: "Teile",
      subtractAfter: "danach abziehen",
      remaining: "übrig",
      timeCaption: "Diese Übersicht ordnet nur die Angaben – sie zeigt keine Zwischenlösung.",
      catchUpAria: "Zwei Personen bewegen sich auf derselben Strecke",
      start: "Start",
      meetingPoint: "Treffpunkt ?",
      headStart: (minutes) => `${minutes} Minuten Vorsprung`,
      timeUsed: "Bereits verbrauchte Zeit",
      delay: "Verspätung",
      tourAria: "Tour mit zwei Geschwindigkeitsabschnitten",
      section: (number) => `Abschnitt ${number}`,
      campsAria: "Wander- und Badetage in drei Ferienlagern",
      campsCaption: "Drei Lager im Vergleich",
      daysPerCamp: "Tage je Lager",
      libraryAria: "Ausgeliehene Bücher in drei Wochen",
      libraryCaption: "Schülerbibliothek",
      loans: "Ausleihen",
      booksPerWeek: (count) => `${count} Bücher pro Woche`,
      routeAria: "Teilstrecken und gesamte Veloroute",
      routeCaption: "Veloroute über den Markt",
      route: "Strecke",
      distance: "Distanz",
      numberFilterAria: "Ziffern werden durch mehrere Bedingungen gefiltert",
      allSolutions: "alle Lösungen",
      tileAria: "Fliesenplan in Einheitsquadraten",
      frameAria: "Rechteckiger Rahmen",
      notchAria: "Rechteck mit Kerbe",
      cornerAria: "Rechteck mit Ausschnitt an der Ecke",
      widthHeight: (width, height) => `${width} cm breit · ${height} cm hoch`,
      coordinateAria: (x, y, transformation) => `Koordinatensystem mit Punkt P bei ${x}, ${y}. ${transformation}`,
      cubeNetAria: (face) => `Würfelnetz mit markierter Fläche ${face}`,
      pyramidAria: (path) => `Beschriftete Pyramidenflächen${path ? `; Kippweg ${path}` : ""}`,
      left: "links",
      right: "rechts",
      bottom: "unten",
      back: "hinten",
      tippingPath: "Kippweg",
      length: (value) => `${value} cm lang`,
      width: (value) => `${value} cm breit`,
    },
  },
  profile: {
    progressBack: "Fortschritt",
    stepLabel: (step) => `Schritt ${step} von 2`,
    goalEyebrow: "DEIN ZIEL · SCHRITT 1 VON 2",
    goalTitle: "Für wen und bis wann planen wir?",
    goalIntro: "Ein Spitzname und das Prüfungsdatum reichen. Beides bleibt lokal auf diesem Gerät und lässt sich später ändern.",
    nicknameLabel: "Dein Spitzname",
    nicknamePlaceholder: "z. B. Mia",
    nicknameHint: "Kein vollständiger Name nötig.",
    examDateLabel: "Datum der Aufnahmeprüfung",
    examDateHint: "Damit der Lernplan sein Tempo sichtbar machen kann.",
    rhythmButton: "Lernrhythmus wählen",
    rhythmEyebrow: "DEIN RHYTHMUS · SCHRITT 2 VON 2",
    rhythmTitle: "Wie soll GymiQuest dich begleiten?",
    rhythmIntro: "Diese Auswahl verändert die Tagesportion und den ersten Hilfe-Einstieg – niemals die Bewertung.",
    practiceDaysLegend: "Welche Tage passen meistens?",
    practiceDaysHint: "Wähle mindestens einen. Fällige Reviews bleiben trotzdem sichtbar.",
    sessionLengthLegend: "Wie lang soll eine normale Runde sein?",
    minutes: "Minuten",
    helpStyleLegend: "Was hilft dir, wenn etwas noch unklar ist?",
    visualModeLegend: "Welche Darstellung fühlt sich angenehm an?",
    readingModeLegend: "Wie soll längerer Erklärungstext aussehen?",
    geometrySideLegend: "Mit welcher Hand zeichnest du meistens?",
    geometrySideHint: "Auf grösseren Bildschirmen stehen die Geometriewerkzeuge auf dieser Seite.",
    back: "Zurück",
    saving: "Wird gespeichert …",
    saveChanges: "Änderungen speichern",
    saveAndStart: "Profil speichern und starten",
    previewEyebrow: "WAS SICH ANPASST",
    previewTitle: "Ein echter Trainingsplan, keine einmalige Prüfung.",
    lessonTitle: "Lektionen",
    lessonDescription: "bauen den Stoff mit immer neuen Aufgaben auf.",
    reviewTitle: "Reviews",
    reviewDescription: "kommen nach Bedarf zurück und geben ihren kleineren festen XP-Wert.",
    assessmentTitle: "Standortbestimmungen",
    assessmentDescription: "mischen Themen und holen Lücken wieder in den Plan.",
    privacyNote: "Nur lokal gespeichert · kein Geburtsdatum · kein vollständiger Name",
    nicknameError: "Der Spitzname braucht 2 bis 24 Zeichen.",
    examDateError: "Bitte ein heutiges oder zukünftiges Prüfungsdatum wählen.",
    practiceDaysError: "Bitte mindestens einen ruhigen Lerntag wählen.",
    saveError: "Das Profil konnte nicht gespeichert werden.",
    practiceDayLabels: {
      monday: "Mo",
      tuesday: "Di",
      wednesday: "Mi",
      thursday: "Do",
      friday: "Fr",
      saturday: "Sa",
      sunday: "So",
    },
    helpStyleLabels: {
      concise: { title: "Kurz und direkt", description: "Zuerst nur der nächste kleine Hinweis." },
      visual: { title: "Mit einem Bild", description: "Die Grundidee und ihre Darstellung zuerst." },
      story: { title: "Mit einem Beispiel", description: "Dieselbe Idee zunächst in einer einfacheren Situation." },
      "step-by-step": { title: "Schritt für Schritt", description: "Einen vollständigen Weg sichtbar aufbauen." },
    },
    visualModeLabels: {
      calm: { title: "Ruhig", description: "Warme Flächen und sanfte Orientierung." },
      focus: {
        title: "Fokus",
        description: "Lernplan, XP und Reviews bleiben; Quests, Abzeichen und Sammlung werden ausgeblendet.",
      },
      "high-contrast": { title: "Hoher Kontrast", description: "Stärkere Kanten und deutlichere Schriftfarben." },
    },
    readingModeLabels: {
      standard: { title: "Standard", description: "Vertraute Schrift und normale Textabstände." },
      spacious: { title: "Mehr Leseruhe", description: "Klarere Schrift, mehr Abstand und kürzere Textzeilen." },
    },
    geometrySideLabels: {
      right: { title: "Werkzeuge rechts", description: "Der Plan bleibt links von deiner Zeichenhand sichtbar." },
      left: { title: "Werkzeuge links", description: "Der Plan bleibt rechts von deiner Zeichenhand sichtbar." },
    },
  },
}

const copyByLocale: Record<AppLocale, AppCopy> = {
  en: englishCopy,
  it: italianCopy,
  es: spanishCopy,
  de: germanCopy,
}

interface LocalizationContextValue {
  locale: AppLocale
  intlLocale: string
  copy: AppCopy
  t: (key: MessageKey, values?: MessageValues) => string
  setLocale: (locale: AppLocale) => void
}

const defaultLocalization: LocalizationContextValue = {
  locale: "de",
  intlLocale: "de-CH",
  copy: germanCopy,
  t: (key, values) => translateMessage("de", key, values),
  setLocale: () => undefined,
}

const LocalizationContext = createContext<LocalizationContextValue>(defaultLocalization)

export function LocalizationProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: AppLocale
}) {
  const [locale, setLocaleState] = useState<AppLocale>(() => initialLocale ?? readInitialLocale())
  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(normalizeAppLocale(nextLocale) ?? "en")
  }, [])

  useEffect(() => {
    const option = localeOptionById.get(locale) ?? appLocaleOptions[0]!
    document.documentElement.lang = option.htmlLanguage
    try {
      window.localStorage.setItem(localeStorageKey, locale)
    } catch {
      // The current session still changes language when storage is unavailable.
    }
  }, [locale])

  const value = useMemo<LocalizationContextValue>(() => {
    const option = localeOptionById.get(locale) ?? appLocaleOptions[0]!
    return {
      locale,
      intlLocale: option.intlLocale,
      copy: copyByLocale[locale],
      t: (key, values) => translateMessage(locale, key, values),
      setLocale,
    }
  }, [locale, setLocale])

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization(): LocalizationContextValue {
  return useContext(LocalizationContext)
}

export function appCopy(locale: AppLocale): AppCopy {
  return copyByLocale[locale]
}
