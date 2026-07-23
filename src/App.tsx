import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import { lessons, topics } from "./domain/content"
import {
  ACTIVE_CURRICULUM_PACKAGE,
  requireLearnerCurriculumPackage,
} from "./domain/curriculumPackage"
import { validateCurriculumPackageRuntime } from "./domain/curriculumPackageValidation"
import {
  createActiveArchivePractice,
  isActiveArchivePractice,
  remainingArchivePracticeSeconds,
  type ActiveArchivePractice,
  type ArchivePracticeResult,
} from "./domain/archivePractice"
import {
  authorValidationArchiveTemplates,
  authorValidationKey,
  authorValidationSelections,
  authorValidationTemplateKey,
  buildAuthorValidationSample,
  nextUncheckedAuthorValidationSelection,
  type AuthorValidationKey,
  type AuthorValidationSample,
  type AuthorValidationSelection,
  type AuthorValidationTemplateKey,
} from "./domain/authorValidation"
import { buildAssessmentReport, isSecureAssessmentResult } from "./domain/assessmentReport"
import { buildConceptRepairQuestions, type ConceptRepairQuestions } from "./domain/conceptRepair"
import { buildConceptLabRound } from "./domain/conceptLab"
import {
  buildAverageMotionModel,
  buildCatchUpMotionModel,
  buildChangingSupplyModel,
  buildCoinCombinationModel,
  buildCubeNetPlaygroundModel,
  buildDataTableComplementModel,
  buildEfficientArithmeticModel,
  buildFractionQuantityModel,
  buildInverseSupplyModel,
  buildMassConversionModel,
  buildMissingAverageModel,
  buildMoneyRelationshipModel,
  buildNumberFilterModel,
  buildRepeatedDigitFilterModel,
  buildOperationChainModel,
  buildRevenueBundleModel,
  buildTableDifferenceModel,
  buildTimeFractionModel,
  cubeFaceRelation,
  cubeOppositeLabel,
  transformCoordinatePoint,
  type CoordinateTransformation,
  type CubeNetPlaygroundModel,
} from "./domain/conceptPlayground"
import {
  buildAreaFractionModel,
  buildCornerCutoutModel,
  buildCuboidSurfaceModel,
  buildFrameAreaModel,
  buildNotchPerimeterModel,
  buildPyramidRollPath,
  buildTilingCostModel,
  findMissingPyramidFace,
  recoverCuboidModuleDimensions,
  type CuboidArrangement,
  type LargeTilePlacement,
  type PyramidRollDirection,
} from "./domain/areaSpatial"
import {
  achievementsUnlockedAt,
  buildAchievements,
  buildCheckpointTrail,
  buildDailyQuest,
  buildExpeditionCollection,
  type AchievementProgress,
  type CheckpointTrail,
  type DailyQuest,
  type DailyQuestGoal,
} from "./domain/engagement"
import { generateQuestionsForTask, isCorrectAnswer, parseNumericAnswer } from "./domain/generators"
import {
  buildExerciseReportUrl,
  createExerciseReportReference,
} from "./domain/exerciseReport"
import {
  buildErrorCompass,
  chooseQuestionDiagnostic,
  completeQuestionDiagnostic,
  isInputValidationDiagnostic,
  type ErrorCompass,
  type QuestionDiagnosticDraft,
} from "./domain/errorPatterns"
import {
  decodeGeometryConstructionAnswer,
  encodeGeometryConstructionAnswer,
  gradeGeometryConstruction,
  shouldUseGeometryConstruction,
  snapGeometryParameter,
  type GeometryConstructionAnswer,
} from "./domain/geometryConstruction"
import {
  buildAssignments,
  buildErrorRefresh,
  buildPlacementTask,
  buildPrerequisiteRefresh,
  buildTopicLesson,
  completePlacementWithoutCheck,
  courseProgress,
  createInitialLearner,
  isCurriculumMastered,
  migrateLearnerState,
  nextReviewAt,
  PLACEMENT_QUESTION_COUNT,
  recordArchivePracticeResult,
  recordCompletion,
  recordOfficialMockReview,
  recordMockExamResult,
  requestTeacherSupport,
  resolveTeacherSupport,
  topicNeedsTeacherSupport,
} from "./domain/learningEngine"
import {
  feedbackForEvent,
  recordLearnerFeedback,
} from "./domain/learnerFeedback"
import {
  buildGeneratedMockBlueprint,
  createActiveMockExam,
  generateMockPartQuestion,
  gradeStrictExam,
  isMockPartAnswered,
  isReplayableMockExam,
  isSupportedGeneratedMockBlueprintVersion,
  isStrictExamTaskAnswered,
  mockPartRequiresMethod,
  remainingMockSeconds,
  resolveStrictExamBlueprint,
  type ActiveMockExam,
  type MockExamPartBlueprint,
} from "./domain/mockExam"
import {
  decodeOfficialFaceLabels,
  decodeOfficialMatchingAnswers,
  decodeOfficialTrueFalseAnswers,
  encodeOfficialFaceLabels,
  encodeOfficialMatchingAnswers,
  encodeOfficialTrueFalseAnswers,
  isOfficialPartAnswered,
  type OfficialExamPartBlueprint,
  type OfficialTrueFalseValue,
} from "./domain/officialExam"
import { normalizeMathFormulaSymbols } from "./domain/officialCalculationEvidence"
import {
  completeSupportedOfficialExamReview,
  createActiveOfficialExamForEdition,
  officialExamDefinition,
  resolveOfficialExamBlueprint,
} from "./domain/officialExams"
import {
  OFFICIAL_2015_EDITION_ID,
  OFFICIAL_2023_EDITION_ID,
  OFFICIAL_2024_EDITION_ID,
  OFFICIAL_2025_EDITION_ID,
  officialArchiveCatalog,
  type OfficialArchiveDocumentKind,
  type OfficialArchiveEditionId,
} from "./domain/officialArchiveCatalog"
import { formatSwissGrade } from "./domain/officialGradeScale"
import {
  difficultyBandIds,
  learnerFeedbackKindIds,
  MAX_ASSESSMENT_SUBMITTED_ANSWER_LENGTH,
} from "./domain/model"
import type {
  DifficultyBand,
  GeneratedQuestion,
  GeometryControlSide,
  GeometryConstructionSpec,
  GeometryConstructionTool,
  LearnerHelpStyle,
  LearnerFeedbackKind,
  LearnerReadingMode,
  LearnerState,
  LearnerVisualMode,
  LearningEvent,
  LearningTask,
  MockExamResult,
  MockSubmissionReason,
  PracticeStep,
  PracticeDay,
  QuestionResult,
  SessionMinutes,
  TopicId,
  XPAward,
} from "./domain/model"
import {
  createActiveLearningSession,
  createPrerequisiteDetourSession,
  originatingSession,
  resolveResumableSession,
  type ActiveLearningSession,
  type ConceptRepairProgress,
  type HelpKind,
} from "./domain/session"
import {
  buildSessionReview,
  type SessionReviewEvidenceStatus,
  type SessionReviewItem,
  type SessionReviewTiming,
} from "./domain/sessionReview"
import { buildProgressAnalytics } from "./domain/progressAnalytics"
import { buildParentDashboard } from "./domain/parentDashboard"
import {
  buildStudySnapshot,
  geometryControlSideLabels,
  helpStyleLabels,
  practiceDayLabels,
  readingModeLabels,
  updateLearnerProfile,
  visualModeLabels,
  type LearnerProfileInput,
} from "./domain/studyPlan"
import {
  appCopy,
  appLocaleOptions,
  LocalizationProvider,
  useLocalization,
  type AppLocale,
} from "./i18n/localization"
import {
  lessonForLocale,
  taskPresentationForLocale,
  topicForLocale,
} from "./i18n/curriculumContent"
import { translateMessage } from "./i18n/messages"
import { learnerFeedbackCopyForLocale } from "./i18n/learnerFeedbackCopy"
import { authorValidationCopy } from "./i18n/authorValidationCopy"
import { conceptPlaygroundCopy } from "./i18n/conceptPlaygroundCopy"
import { examCopy, examWarning } from "./i18n/examCopy"
import { parentAreaCopy } from "./i18n/parentAreaCopy"
import {
  buildReleaseReadinessMarkdownForLocale,
  releaseReadinessCopy,
  releaseReadinessFilenameForLocale,
  releaseReadinessSectionsForLocale,
} from "./i18n/releaseReadinessCopy"
import {
  diagnosticKindCopyForLocale,
  diagnoseWrongAnswerForLocale,
  localizeSupportIssue,
  topicGuidanceForLocale,
} from "./i18n/questionFeedback"
import {
  createParentAccess,
  isValidParentPin,
  parentExplanationLanguage,
  setParentExplanationLanguage as updateParentExplanationLanguage,
  verifyParentPin,
  type ParentAccessRecord,
  type ParentExplanationLanguage,
} from "./domain/parentAccess"
import {
  createReleaseReadinessRecord,
  isTraceableReleaseBuild,
  normalizeReleaseReadinessRecord,
  releaseReadinessProgress,
  setReleaseReadinessCheck,
  type ReleaseReadinessRecord,
  type ReleaseRuntimeEvidence,
} from "./domain/releaseReadiness"
import {
  decodePracticeStepAnswers,
  encodePracticeStepAnswers,
  gradePracticeSteps,
  normalizeVerifiedPracticeSteps,
  shouldUsePracticeSteps,
  type PracticeStepAnswers,
  type PracticeStepStatus,
} from "./domain/practiceSteps"
import { DataBackupPanel } from "./features/DataBackupPanel"
import {
  ArchivePracticeResultsView,
  ArchiveSourcePracticePlayer,
} from "./features/ArchiveSourcePractice"
import { ExerciseReportView } from "./features/ExerciseReportView"
import {
  OfficialArchiveShelf,
  type OfficialArchiveBulkImportResult,
} from "./features/OfficialArchiveShelf"
import { PdfPageCanvas } from "./features/PdfPageCanvas"
import { SubjectSwitcher } from "./features/SubjectSwitcher"
import {
  createLearnerCourseIndex,
  markCourseCompleted,
  resolveResumeSubject,
  touchCourse,
  type LearnerCourseIndex,
} from "./domain/courseIndex"
import { subjectRuntimeFor } from "./domain/subjectRegistry"
import type { SubjectId } from "./domain/subjectIdentity"
import { GermanCourseView } from "./subjects/german/GermanCourseView"
import { GermanWritingReviewPanel } from "./subjects/german/GermanWritingReviewPanel"
import { GermanComprehensionReviewPanel } from "./subjects/german/GermanComprehensionReviewPanel"
import {
  createInitialGermanCourseState,
  resolveGermanTopicSupport,
  saveGermanComprehensionHumanReview,
  saveGermanWritingHumanReview,
  type GermanCourseState,
} from "./subjects/german/courseState"
import { germanCoachingForTopic } from "./subjects/german/coaching"
import { germanTopics } from "./subjects/german/content"
import { germanTopicIds, type GermanTopicId } from "./subjects/german/package"
import {
  createGermanSourcePracticeState,
  type GermanSourcePracticeState,
} from "./subjects/german/sourcePractice"
import type { GermanComprehensionEvidenceStatus } from "./subjects/german/comprehension"
import type { GymiQuestBackupPayload } from "./infra/backup"
import {
  identifyGermanSourceArchivePdf,
  type GermanSourceArchiveBulkImportResult,
  type GermanSourceArchiveDocumentRecord,
  type GermanSourceArchiveLibrary,
} from "./infra/germanSourceArchive"
import {
  hasOfficialArchiveEdition,
  identifyOfficialArchivePdf,
  inspectOfficialArchivePdfForEdition,
  type OfficialArchiveDocumentRecord,
  type OfficialArchiveDocuments,
  type OfficialArchiveLibrary,
} from "./infra/officialArchive"
import {
  clearActiveSession,
  clearActiveArchivePractice,
  clearActiveMockExam,
  clearLearnerState,
  clearCourseIndex,
  clearGermanCourseState,
  clearGermanSourcePracticeState,
  clearOfficialArchiveDocuments,
  clearParentAccess,
  loadActiveSession,
  loadActiveArchivePractice,
  loadActiveMockExam,
  loadLearnerState,
  loadCourseIndex,
  loadGermanCourseState,
  loadGermanSourcePracticeState,
  loadGermanSourceArchiveLibrary,
  loadOfficialArchiveLibrary,
  loadParentAccess,
  loadReleaseReadiness,
  replaceLocalLearningData,
  saveActiveSession,
  saveActiveArchivePractice,
  saveLearnerAndActiveSession,
  saveActiveMockExam,
  saveLearnerState,
  saveCourseIndex,
  saveGermanCourseState,
  saveGermanSourcePracticeState,
  saveGermanSourceArchiveDocument,
  saveOfficialArchiveDocument,
  saveParentAccess,
  saveReleaseReadiness,
} from "./infra/learnerRepository"

interface CompletionSummary {
  task: LearningTask
  event: LearningEvent
  award: XPAward
  learner: LearnerState
}

const kindIcons: Record<LearningTask["kind"], string> = {
  lesson: "✦",
  review: "↻",
  repair: "↗",
  assessment: "◆",
  placement: "◎",
}

function taskKindLabel(task: LearningTask, locale: AppLocale = "de"): string {
  const playerCopy = appCopy(locale).player
  return task.purpose === "lesson-recovery"
    ? playerCopy.recovery
    : playerCopy.taskKinds[task.kind]
}

function formatMinutes(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${String(remainder).padStart(2, "0")}`
}

function intlLocaleFor(locale: AppLocale): "en-GB" | "it-CH" | "es-ES" | "de-CH" {
  return locale === "en"
    ? "en-GB"
    : locale === "it"
      ? "it-CH"
      : locale === "es"
        ? "es-ES"
        : "de-CH"
}

function formatReviewDate(value?: string, locale: AppLocale = "de"): string {
  if (!value) return translateMessage(locale, "common.scheduled")
  const date = new Date(value)
  const now = new Date()
  if (date.getTime() <= now.getTime()) return translateMessage(locale, "common.dueNow")
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function officialExamYear(editionId: string | undefined): number | undefined {
  return officialExamDefinition(editionId)?.blueprint.year
}

function decodeCoordinateDraft(value: string): { x: string; y: string } {
  const [x = "", y = ""] = value.split("|", 2)
  return { x, y }
}

function encodeCoordinateDraft(x: string, y: string): string {
  return `${x}|${y}`
}

function Logo() {
  return (
    <div className="brand" aria-label="GymiQuest">
      <img src="/gymiquest-mark.svg" alt="" width="42" height="42" />
      <span>GymiQuest</span>
    </div>
  )
}

function AppLanguagePicker({
  id = "app-language",
  onChange,
}: {
  id?: string
  onChange?: () => void
}) {
  const { locale, setLocale, copy } = useLocalization()
  return (
    <label className="app-language-picker" htmlFor={id}>
      <span>{copy.language.label}</span>
      <select
        id={id}
        value={locale}
        onChange={(event) => {
          setLocale(event.target.value as AppLocale)
          onChange?.()
        }}
      >
        {appLocaleOptions.map((option) => (
          <option value={option.id} key={option.id}>{option.nativeLabel}</option>
        ))}
      </select>
      <small>{copy.language.hint}</small>
    </label>
  )
}

const activeCurriculumTopics = ACTIVE_CURRICULUM_PACKAGE.topicIds.map(
  (topicId) => topics[topicId],
)

function curriculumTopicsForLearner(learner: LearnerState) {
  return requireLearnerCurriculumPackage(learner).topicIds.map(
    (topicId) => topics[topicId],
  )
}

function AppHeader({
  onHome,
  onProgress,
  displayName,
  subjectId = "math",
}: {
  onHome: () => void
  onProgress?: () => void
  displayName?: string
  subjectId?: SubjectId
}) {
  const { copy, intlLocale } = useLocalization()
  const profileInitial = displayName?.trim().charAt(0).toLocaleUpperCase(intlLocale) || "?"
  const runtime = subjectRuntimeFor(subjectId)
  return (
    <header className="app-header">
      <button className="brand-button" type="button" onClick={onHome} aria-label={copy.header.home}>
        <Logo />
      </button>
      <div className="header-course">
        <span className="header-course-dot" />
        {runtime.shortTitle}
      </div>
      <div className="header-actions">
        <a
          className="header-data-link"
          href="/datenschutz.html"
          target="_blank"
          rel="noreferrer"
          aria-label={copy.header.privacyAria}
        >
          {copy.header.privacy}
        </a>
        {onProgress ? (
          <button
            className="profile-chip"
            type="button"
            onClick={onProgress}
            aria-label={copy.header.progressAria}
          >
            <span aria-hidden="true">{profileInitial}</span>
            <div>
              <strong>{displayName}</strong>
              <small>{copy.header.progressHint}</small>
            </div>
          </button>
        ) : (
          <div className="profile-chip profile-chip-static" aria-label={copy.header.setupAria}>
            <span aria-hidden="true">?</span>
            <div>
              <strong>{copy.header.setupTitle}</strong>
              <small>{copy.header.setupHint}</small>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function goalProgressLabel(goal: DailyQuestGoal, locale: AppLocale = "de"): string {
  if (goal.unit === "seconds") {
    const current = Math.ceil(Math.min(goal.current, goal.target) / 60)
    const target = Math.ceil(goal.target / 60)
    return `${current}/${target} ${translateMessage(locale, "common.minutesShort")}`
  }
  return `${Math.min(goal.current, goal.target)}/${goal.target}`
}

function DailyQuestCard({ quest }: { quest: DailyQuest }) {
  const { locale, t } = useLocalization()
  if (quest.isRestDay) {
    return (
      <section className="daily-quest-card rest" aria-labelledby="daily-quest-title">
        <div className="daily-quest-mark" aria-hidden="true">☼</div>
        <div>
          <span className="eyebrow">{t("home.daily.restEyebrow")}</span>
          <h2 id="daily-quest-title">{t("home.daily.restTitle")}</h2>
          <p>{t("home.daily.restBody")}</p>
        </div>
      </section>
    )
  }

  const complete = quest.completedGoals === quest.goals.length
  return (
    <section className={`daily-quest-card${complete ? " complete" : ""}`} aria-labelledby="daily-quest-title">
      <div className="daily-quest-heading">
        <div className="daily-quest-mark" aria-hidden="true">{complete ? "✓" : "⌁"}</div>
        <div>
          <span className="eyebrow">{t("home.daily.eyebrow")}</span>
          <h2 id="daily-quest-title">{complete ? t("home.daily.completeTitle") : t("home.daily.title")}</h2>
          <p>{complete ? t("home.daily.completeBody") : t("home.daily.body")}</p>
        </div>
        <strong>{quest.completedGoals}/{quest.goals.length}</strong>
      </div>
      <div className="daily-quest-goals">
        {quest.goals.map((goal) => (
          <div className={goal.complete ? "complete" : ""} key={goal.id}>
            <span aria-hidden="true">{goal.complete ? "✓" : "○"}</span>
            <p><strong>{goal.title}</strong><small>{goal.description}</small></p>
            <b>{goalProgressLabel(goal, locale)}</b>
          </div>
        ))}
      </div>
    </section>
  )
}

function CheckpointTrailCard({
  trail,
  nextTask,
  activeTask,
  onStart,
  onResume,
  minimalFocus = false,
}: {
  trail: CheckpointTrail
  nextTask?: LearningTask
  activeTask?: LearningTask
  onStart: (task: LearningTask) => void
  onResume: () => void
  minimalFocus?: boolean
}) {
  const { locale, t } = useLocalization()
  const actionable = trail.steps.filter((step) => step.status === "pending").length
  const onlyPaused = actionable === 0 && trail.pausedRecoveryTopics > 0
  const progress = trail.recoveryTopics === 0
    ? 100
    : Math.round((trail.completedRecoveryTopics / trail.recoveryTopics) * 100)

  return (
    <section className="checkpoint-trail-card" aria-labelledby="checkpoint-trail-title">
      <div className="checkpoint-trail-heading">
        <div className="checkpoint-trail-mark" aria-hidden="true">⌁</div>
        <div>
          <span className="eyebrow">
            {minimalFocus
              ? t("home.checkpoint.reviewEyebrow", { number: trail.assessmentNumber })
              : t("home.checkpoint.returnEyebrow", { number: trail.assessmentNumber })}
          </span>
          <h2 id="checkpoint-trail-title">
            {minimalFocus
              ? onlyPaused
                ? t("home.checkpoint.pausedReviewTitle")
                : t("home.checkpoint.reviewTitle")
              : onlyPaused
                ? t("home.checkpoint.pausedReturnTitle")
                : t("home.checkpoint.returnTitle")}
          </h2>
          <p>
            {onlyPaused
              ? t("home.checkpoint.pausedBody")
              : t("home.checkpoint.body")}
          </p>
        </div>
        <div className="checkpoint-trail-progress">
          <strong>{trail.completedRecoveryTopics}/{trail.recoveryTopics}</strong>
          <span>{minimalFocus ? t("home.checkpoint.reviewsComplete") : t("home.checkpoint.returnsComplete")}</span>
          <div
            className="meter"
            role="progressbar"
            aria-label={t("home.checkpoint.progressAria")}
            aria-valuemin={0}
            aria-valuemax={trail.recoveryTopics}
            aria-valuenow={trail.completedRecoveryTopics}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <ol className="checkpoint-trail-steps">
        {trail.steps.map((step, index) => (
          <li className={step.status} key={step.topicId}>
            <span aria-hidden="true">{step.status === "complete" ? "✓" : step.status === "paused" ? "‖" : index + 1}</span>
            <div>
              <strong>{topicForLocale(step.topicId, locale).shortTitle}</strong>
              <small>
                {step.status === "complete"
                  ? t("home.checkpoint.reviewDone", {
                      date: step.completedAt ? ` · ${formatSessionDate(step.completedAt, locale)}` : "",
                    })
                  : step.status === "paused"
                    ? t("home.checkpoint.paused")
                    : t("home.checkpoint.newQuestions", {
                        date: step.reviewDueAt
                          ? ` · ${formatReviewDate(step.reviewDueAt, locale)}`
                          : t("home.checkpoint.ready"),
                      })}
              </small>
            </div>
          </li>
        ))}
      </ol>

      <div className="checkpoint-trail-action">
        <p>
          <strong>{t("home.checkpoint.secureTopics", { secure: trail.secureTopics, total: trail.assessedTopics })}</strong>{" "}
          {t("home.checkpoint.secureBody")}
        </p>
        {activeTask ? (
          <button className="primary-button" type="button" onClick={onResume}>
            {minimalFocus ? t("home.checkpoint.resumeReview") : t("home.checkpoint.resumeReturn")}
          </button>
        ) : nextTask ? (
          <button className="primary-button" type="button" onClick={() => onStart(nextTask)}>
            {minimalFocus ? t("home.checkpoint.startReview") : t("home.checkpoint.startReturn")}
          </button>
        ) : onlyPaused ? (
          <small>{t("home.checkpoint.companionNote")}</small>
        ) : (
          <small>{minimalFocus ? t("home.checkpoint.nextReview") : t("home.checkpoint.nextReturn")}</small>
        )}
      </div>
    </section>
  )
}

function AchievementPreview({ achievements }: { achievements: AchievementProgress[] }) {
  const { t } = useLocalization()
  const unlocked = achievements.filter((item) => item.unlocked)
  const latest = [...unlocked]
    .sort((left, right) => (right.unlockedAt ?? "").localeCompare(left.unlockedAt ?? ""))
    .slice(0, 2)
  const locked = achievements.filter((item) => !item.unlocked)
  const preview = [...latest, ...locked].slice(0, 3)

  return (
    <section className="stat-card achievement-preview-card">
      <div className="achievement-preview-heading">
        <div><span className="eyebrow">{t("home.achievements.eyebrow")}</span><strong>{unlocked.length}/{achievements.length}</strong></div>
        <small>{t("home.achievements.hint")}</small>
      </div>
      <div className="achievement-preview-list">
        {preview.map((item) => (
          <div className={item.unlocked ? "unlocked" : "locked"} key={item.id}>
            <span aria-hidden="true">{item.unlocked ? item.icon : "·"}</span>
            <p><strong>{item.title}</strong><small>{item.unlocked ? t("common.unlocked") : `${item.current}/${item.target}`}</small></p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ExpeditionPreview({
  learner,
  onOpen,
}: {
  learner: LearnerState
  onOpen?: () => void
}) {
  const { locale, t } = useLocalization()
  const expedition = buildExpeditionCollection(learner, locale)
  const next = expedition.nextCollectible
  const progress = next
    ? Math.min(100, Math.round((expedition.totalXp / next.xpRequired) * 100))
    : 100

  return (
    <section className="stat-card expedition-preview-card" aria-labelledby="expedition-preview-title">
      <div className="expedition-preview-heading">
        <span aria-hidden="true">⌁</span>
        <div>
          <span className="eyebrow">{t("home.expedition.eyebrow")}</span>
          <h2 id="expedition-preview-title">
            {t("home.expedition.collected", {
              current: expedition.unlockedCollectibles,
              total: expedition.collectibles.length,
            })}
          </h2>
        </div>
      </div>
      {next ? (
        <>
          <div className="expedition-preview-next">
            <span aria-hidden="true">{next.icon}</span>
            <p><strong>{t("home.expedition.next", { title: next.title })}</strong><small>{t("home.expedition.xpRemaining", { xp: expedition.xpToNext })}</small></p>
          </div>
          <div
            className="meter"
            role="progressbar"
            aria-label={t("home.expedition.progressAria", { title: next.title })}
            aria-valuemin={0}
            aria-valuemax={next.xpRequired}
            aria-valuenow={expedition.totalXp}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <p className="expedition-preview-complete">{t("home.expedition.complete")}</p>
      )}
      {onOpen && (
        <button className="text-button" type="button" onClick={onOpen}>
          {t("home.expedition.open")} <span aria-hidden="true">›</span>
        </button>
      )}
    </section>
  )
}

function StatPanel({
  learner,
  onOpenCurriculum,
  onOpenCollection,
  now = new Date(),
}: {
  learner: LearnerState
  onOpenCurriculum: () => void
  onOpenCollection?: () => void
  now?: Date
}) {
  const { locale, intlLocale, t } = useLocalization()
  const minimalFocus = learner.preferences.visualMode === "focus"
  const progress = Math.round(courseProgress(learner) * 100)
  const curriculumMastered = isCurriculumMastered(learner)
  const allTopics = curriculumTopicsForLearner(learner)
  const frontierIndex = allTopics.findIndex(
    (topic) => learner.mastery[topic.id].status !== "mastered",
  )
  const mapStart = frontierIndex === -1
    ? Math.max(0, allTopics.length - 5)
    : Math.max(0, frontierIndex - 2)
  const visibleTopics = allTopics.slice(mapStart, mapStart + 5)
  const assessmentProgress = Math.min(
    100,
    Math.round((learner.xpSinceAssessment / learner.assessmentThreshold) * 100),
  )
  const remaining = Math.max(0, learner.assessmentThreshold - learner.xpSinceAssessment)
  const nextReview = nextReviewAt(learner)
  const achievements = minimalFocus ? [] : buildAchievements(learner, locale)
  const study = buildStudySnapshot(learner, now)
  const readinessLabel = study.readinessLabel === "Prüfungsnah"
    ? t("home.stats.readiness.examReady")
    : study.readinessLabel === "Am Festigen"
      ? t("home.stats.readiness.consolidating")
      : t("home.stats.readiness.building")
  const examDateLabel = study.examDate
    ? new Intl.DateTimeFormat(intlLocale, {
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${study.examDate}T12:00:00.000Z`))
    : t("home.stats.dateNotSet")
  const masteredCount = allTopics.filter((topic) => learner.mastery[topic.id].status === "mastered").length
  const countdown = study.daysUntilExam === undefined
    ? t("home.stats.dateOpen")
    : study.daysUntilExam <= 0
      ? t("home.stats.today")
      : `${study.daysUntilExam} ${study.daysUntilExam === 1 ? t("home.stats.day") : t("home.stats.days")}`

  return (
    <aside className="stats-column" aria-label={t("home.stats.aria")}>
      <section className={`stat-card course-card${curriculumMastered ? " consolidating" : ""}`}>
        <div className="stat-heading">
          <div>
            <span className="eyebrow">{curriculumMastered ? t("home.stats.consolidation") : t("home.stats.course")}</span>
            <h2>{curriculumMastered ? t("home.stats.consolidationTitle") : t("home.stats.courseTitle")}</h2>
          </div>
          <div
            className="progress-ring"
            style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}
            aria-label={t("home.stats.progressAria", { progress })}
          >
            <strong>{progress}%</strong>
          </div>
        </div>
        {curriculumMastered ? (
          <div className="course-consolidation" aria-label={t("home.stats.consolidationAria")}>
            <span className="course-consolidation-mark" aria-hidden="true">↻</span>
            <div>
              <strong>{t("home.stats.allLessons", { count: allTopics.length })}</strong>
              <p>{t("home.stats.consolidationBody")}</p>
            </div>
            <button type="button" onClick={onOpenCurriculum}>
              {t("home.stats.viewTopics")} <span aria-hidden="true">›</span>
            </button>
          </div>
        ) : (
          <div className="course-map-mini" aria-label={t("home.stats.topicProgress")}>
            {visibleTopics.map((topic) => {
              const status = learner.mastery[topic.id].status
              return (
                <div className={`mini-node ${status}`} key={topic.id}>
                  <span>{status === "mastered" ? "✓" : status === "locked" ? "·" : "→"}</span>
                  <small>{topicForLocale(topic.id, locale).shortTitle}</small>
                </div>
              )
            })}
            <button className="course-map-more" type="button" onClick={onOpenCurriculum}>
              <span>{t("home.stats.pathCount", { count: allTopics.length })}</span>
              <strong>{t("home.stats.viewAll")}</strong>
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}
      </section>

      <section className="stat-card study-goal-card">
        <div className="study-goal-heading">
          <div>
            <span className="eyebrow">{t("home.stats.examGoal")}</span>
            <strong>{countdown}</strong>
            <small>{examDateLabel}</small>
          </div>
          <span className={`readiness-pill ${readinessLabel.toLowerCase().replaceAll(" ", "-")}`}>
            {readinessLabel}
          </span>
        </div>
        <p>{t("home.stats.topicsLearned", { mastered: masteredCount, total: allTopics.length })}. {t("home.stats.orientationNote")}</p>
      </section>

      <section className="stat-card xp-card">
        <span className="eyebrow">{t("home.stats.totalXp")}</span>
        <div className="xp-total">
          <strong>{learner.totalXp}</strong>
          <span>XP</span>
        </div>
        <div className="assessment-meter-copy">
          <div>
            <strong>{t("home.stats.nextAssessment")}</strong>
            <span>
              {remaining === 0 ? t("home.stats.ready") : t("home.stats.xpRemaining", { xp: remaining })}
            </span>
          </div>
          <span>{learner.xpSinceAssessment}/{learner.assessmentThreshold}</span>
        </div>
        <div
          className="meter"
          role="progressbar"
          aria-label={t("home.stats.assessmentProgressAria")}
          aria-valuemin={0}
          aria-valuemax={learner.assessmentThreshold}
          aria-valuenow={learner.xpSinceAssessment}
        >
          <span style={{ width: `${assessmentProgress}%` }} />
        </div>
        <p className="xp-explainer">
          {curriculumMastered
            ? t("home.stats.xpConsolidation")
            : t("home.stats.xpBody")}
        </p>
      </section>

      <section className="stat-card next-review-card">
        <div className="calendar-icon" aria-hidden="true">{new Date().getDate()}</div>
        <div>
          <span className="eyebrow">{t("home.stats.nextReview")}</span>
          <strong>{formatReviewDate(nextReview, locale)}</strong>
        </div>
      </section>

      {!minimalFocus && <ExpeditionPreview learner={learner} onOpen={onOpenCollection} />}

      {!minimalFocus && <AchievementPreview achievements={achievements} />}
    </aside>
  )
}

function TaskCard({
  task,
  onStart,
  onPrerequisite,
  checkpointNumber,
  minimalFocus = false,
}: {
  task: LearningTask
  onStart: (task: LearningTask) => void
  onPrerequisite: (topicId: TopicId) => void
  checkpointNumber?: number
  minimalFocus?: boolean
}) {
  const { locale, copy, t } = useLocalization()
  const prerequisites = task.prerequisiteIds.map((topicId) => topicForLocale(topicId, locale))
  const presentation = taskPresentationForLocale(task, locale)
  const difficultySummary = task.generation
    ? task.generation.difficultyBands
        .filter((band, index, bands) => bands.indexOf(band) === index)
        .map((band) => copy.player.difficultyBands[band])
        .join(" → ")
    : undefined

  return (
    <article className={`task-card ${task.kind}${checkpointNumber ? " checkpoint-return" : ""}`}>
      <div className="task-kind-icon" aria-hidden="true">{kindIcons[task.kind]}</div>
      <div className="task-copy">
        <div className="task-meta">
          <span>{task.kind === "assessment"
            ? minimalFocus ? t("home.task.assessment") : t("home.task.expeditionAssessment")
            : taskKindLabel(task, locale)}</span>
          {task.dueAt && <small>{formatReviewDate(task.dueAt, locale)}</small>}
        </div>
        {checkpointNumber && (
          <span className="checkpoint-return-pill">
            {minimalFocus
              ? t("home.task.reviewAfter", { number: checkpointNumber })
              : t("home.task.returnAfter", { number: checkpointNumber })}
          </span>
        )}
        <h3>{presentation.title}</h3>
        <p>{presentation.description}</p>
        {difficultySummary && (
          <div className="difficulty-sequence" aria-label={t("home.task.difficultyAria", { difficulty: difficultySummary })}>
            <span>{t("home.task.difficulty")}</span>
            <strong>{difficultySummary}</strong>
          </div>
        )}

        {prerequisites.length > 0 && (
          <details className="prerequisite-disclosure">
            <summary>
              {prerequisites.length === 1
                ? t("home.task.whyNowOne")
                : t("home.task.whyNowMany", { count: prerequisites.length })}
            </summary>
            <div className="prerequisite-list">
              {prerequisites.map((topic) => (
                <button key={topic.id} type="button" onClick={() => onPrerequisite(topic.id)}>
                  <span className="prerequisite-check">✓</span>
                  <span>
                    <strong>{topic.shortTitle}</strong>
                    <small>{t("home.task.refresh")}</small>
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </details>
        )}
      </div>
      <div className="task-action">
        <span><strong>{task.maxXp}</strong> XP</span>
        <button className="primary-button compact" type="button" onClick={() => onStart(task)}>
          {t("common.start")}
        </button>
      </div>
    </article>
  )
}

function ResumeTaskCard({
  session,
  onResume,
  checkpointNumber,
  minimalFocus = false,
}: {
  session: ActiveLearningSession
  onResume: () => void
  checkpointNumber?: number
  minimalFocus?: boolean
}) {
  const { locale, t } = useLocalization()
  const { task } = session
  const presentation = taskPresentationForLocale(task, locale)
  const progressLabel = session.phase === "lesson"
    ? t("home.task.lessonPage", { page: session.pageIndex + 1 })
    : session.phase === "assessment-intro"
      ? t("home.task.ready")
      : t("home.task.questionProgress", {
          current: session.question.questionIndex + 1,
          total: task.questionCount,
        })

  return (
    <article className={`task-card resume${checkpointNumber ? " checkpoint-return" : ""}`}>
      <div className="task-kind-icon" aria-hidden="true">▶</div>
      <div className="task-copy">
        <div className="task-meta">
          <span>
            {t("home.task.started")} · {checkpointNumber
              ? minimalFocus
                ? `${t("home.task.reviewAfter", { number: checkpointNumber })} · `
                : `${t("home.task.returnAfter", { number: checkpointNumber })} · `
              : ""}{progressLabel}
          </span>
        </div>
        <h3>{presentation.title}</h3>
        <p>{t("home.task.saved", { time: formatMinutes(session.activeSeconds) })}</p>
      </div>
      <div className="task-action">
        <span>{taskKindLabel(task, locale)}</span>
        <button className="primary-button compact" type="button" onClick={onResume}>
          {t("home.task.resume")}
        </button>
      </div>
    </article>
  )
}

function MockModeCard({
  learner,
  activeMock,
  activeArchivePractice,
  onOpen,
}: {
  learner: LearnerState
  activeMock?: ActiveMockExam
  activeArchivePractice?: ActiveArchivePractice
  onOpen: () => void
}) {
  const { t } = useLocalization()
  const latest = learner.mockHistory.at(-1)
  const remaining = activeMock ? remainingMockSeconds(activeMock) : undefined
  const archiveRemaining = activeArchivePractice
    ? remainingArchivePracticeSeconds(activeArchivePractice)
    : undefined
  const activeExamMode = Boolean(activeMock || activeArchivePractice)
  const activeOfficial = activeMock?.source === "official-archive"
  const latestOfficial = latest?.source === "official-archive"
  const latestCorrected = latestOfficial && latest.officialReview?.status === "complete"
  const latestMathGrade = latestCorrected ? latest.officialReview?.mathematicsGrade : undefined
  const latestOfficialYear = latestOfficial
    ? officialExamDefinition(latest.editionId)?.blueprint.year
    : undefined

  return (
    <section className={`mock-mode-card${activeExamMode ? " running" : ""}`} aria-labelledby="mock-mode-title">
      <div className="mock-mode-mark" aria-hidden="true">◇</div>
      <div className="mock-mode-copy">
        <span className="eyebrow">{t("home.mock.eyebrow")}</span>
        <h2 id="mock-mode-title">
          {activeArchivePractice
            ? activeArchivePractice.phase === "review"
              ? t("home.mock.archiveReviewOpen", { year: activeArchivePractice.year })
              : t("home.mock.archiveRunning", { year: activeArchivePractice.year })
            : activeMock
            ? activeOfficial ? t("home.mock.officialRunning") : t("home.mock.running")
            : t("home.mock.ready")}
        </h2>
        <p>
          {activeArchivePractice
            ? activeArchivePractice.phase === "review"
              ? t("home.mock.archiveReviewSaved")
              : t("home.mock.archiveSaved", { time: formatMinutes(archiveRemaining ?? 0) })
            : activeMock
            ? t("home.mock.saved", { time: formatMinutes(remaining ?? 0) })
            : t("home.mock.rules")}
        </p>
        {latest && !activeExamMode && (
          <small>
            {latestOfficial
              ? t("home.mock.officialLast", { year: latestOfficialYear ? ` ${latestOfficialYear}` : "" })
              : t("home.mock.last")}: {latest.certainPoints} {latestCorrected ? t("home.mock.corrected") : t("home.mock.certain")} {t("home.mock.points")}
            {latestMathGrade !== undefined && ` · ${t("home.mock.grade", { grade: formatSwissGrade(latestMathGrade) })}`}
            {latest.officialReview?.status === "pending"
              ? ` · ${t("home.mock.correctionOpen")}`
              : latest.reviewablePoints > 0 && ` ${t("home.mock.methodPoints", { points: latest.reviewablePoints })}`}
          </small>
        )}
      </div>
      <button className={activeExamMode ? "primary-button" : "secondary-button"} type="button" onClick={onOpen}>
        {activeArchivePractice
          ? activeArchivePractice.phase === "review" ? t("home.mock.resumeSelfReview") : t("home.mock.resumeArchive")
          : activeMock ? t("home.mock.resumeExam") : t("home.mock.open")}
      </button>
    </section>
  )
}

function ConceptLabShortcut({ onOpen }: { onOpen: () => void }) {
  const { t } = useLocalization()
  return (
    <section className="concept-lab-shortcut" aria-labelledby="concept-lab-shortcut-title">
      <div className="concept-lab-shortcut-mark" aria-hidden="true">↻</div>
      <div>
        <span className="eyebrow">{t("home.concept.eyebrow")}</span>
        <h2 id="concept-lab-shortcut-title">{t("home.concept.title")}</h2>
        <p>{t("home.concept.body")}</p>
      </div>
      <button className="secondary-button" type="button" onClick={onOpen}>{t("home.concept.open")}</button>
    </section>
  )
}

export function Home({
  learner,
  resumeSession,
  activeMock,
  activeArchivePractice,
  onStart,
  onResume,
  onPrerequisite,
  onOpenCurriculum,
  onOpenCollection,
  onOpenConceptLab,
  onOpenMock,
  onReset,
  subjectSelector,
  now = new Date(),
}: {
  learner: LearnerState
  resumeSession?: ActiveLearningSession
  activeMock?: ActiveMockExam
  activeArchivePractice?: ActiveArchivePractice
  onStart: (task: LearningTask) => void
  onResume: () => void
  onPrerequisite: (topicId: TopicId) => void
  onOpenCurriculum: () => void
  onOpenCollection?: () => void
  onOpenConceptLab?: () => void
  onOpenMock: () => void
  onReset: () => void
  subjectSelector?: ReactNode
  now?: Date
}) {
  const { locale, intlLocale, t } = useLocalization()
  const [confirmReset, setConfirmReset] = useState(false)
  const minimalFocus = learner.preferences.visualMode === "focus"
  const allAssignments = buildAssignments(learner, now)
  const examModeActive = Boolean(activeMock || activeArchivePractice)
  const assignments = examModeActive
    ? []
    : allAssignments.filter((task) => task.id !== resumeSession?.task.id)
  const reviewCount = allAssignments.filter((task) => task.kind === "review").length
  const hasLesson = allAssignments.some((task) => task.kind === "lesson")
  const hasRecovery = allAssignments.some((task) => task.purpose === "lesson-recovery")
  const assessmentReady = allAssignments.some((task) => task.kind === "assessment")
  const curriculumMastered = isCurriculumMastered(learner)
  const scheduledReviewAt = nextReviewAt(learner)
  const dailyQuest = minimalFocus
    ? undefined
    : buildDailyQuest(learner, allAssignments, now, "Europe/Zurich", locale)
  const latestCheckpointTrail = buildCheckpointTrail(learner)
  const checkpointTrail = latestCheckpointTrail &&
    latestCheckpointTrail.recoveryTopics > 0 &&
    !latestCheckpointTrail.complete
    ? latestCheckpointTrail
    : undefined
  const pendingCheckpointTopicIds = new Set(
    checkpointTrail?.steps
      .filter((step) => step.status === "pending")
      .map((step) => step.topicId) ?? [],
  )
  const activeCheckpointTask = resumeSession?.task.kind === "review" &&
    resumeSession.task.topicIds.some((topicId) => pendingCheckpointTopicIds.has(topicId))
    ? resumeSession.task
    : undefined
  const nextCheckpointTask = assignments.find(
    (task) => task.kind === "review" && task.topicIds.some((topicId) => pendingCheckpointTopicIds.has(topicId)),
  )
  const todayLabel = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now).toLocaleUpperCase(intlLocale)

  return (
    <main className="home-shell">
      <StatPanel
        learner={learner}
        onOpenCurriculum={onOpenCurriculum}
        onOpenCollection={onOpenCollection}
        now={now}
      />
      <section className="plan-column">
        {subjectSelector}
        <div className="plan-intro">
          <div>
            <span className="eyebrow">{todayLabel}</span>
            <h1>{t("home.plan.title")}</h1>
            <p>
              {activeArchivePractice
                ? activeArchivePractice.phase === "review"
                  ? t("home.plan.archiveReview")
                  : t("home.plan.archiveRunning")
                : activeMock
                ? activeMock.source === "official-archive"
                  ? t("home.plan.officialRunning")
                  : t("home.plan.mockRunning")
                : resumeSession
                ? t("home.plan.sessionOpen")
                : assessmentReady
                ? t("home.plan.assessmentReady")
                : hasRecovery
                  ? t("home.plan.recovery")
                : curriculumMastered && reviewCount === 1
                  ? t("home.plan.consolidationOne")
                  : curriculumMastered && reviewCount > 1
                    ? t("home.plan.consolidationMany", { count: reviewCount })
                : hasLesson && reviewCount === 1
                  ? t("home.plan.lessonReviewOne")
                  : hasLesson && reviewCount > 1
                    ? t("home.plan.lessonReviewMany", { count: reviewCount })
                    : reviewCount === 1
                      ? t("home.plan.reviewOne")
                      : reviewCount > 1
                        ? t("home.plan.reviewMany", { count: reviewCount })
                        : hasLesson
                          ? t("home.plan.lesson")
                          : curriculumMastered
                            ? t("home.plan.mastered")
                            : t("home.plan.next")}
            </p>
          </div>
          <div className="today-goal">
            <span aria-hidden="true">◎</span>
            <div><strong>{learner.preferences.sessionMinutes} {t("common.minutesShort")}</strong><small>{t("home.plan.normalRound")}</small></div>
          </div>
        </div>

        {!examModeActive && dailyQuest && <DailyQuestCard quest={dailyQuest} />}

        {!examModeActive && checkpointTrail && (
          <CheckpointTrailCard
            trail={checkpointTrail}
            nextTask={nextCheckpointTask}
            activeTask={activeCheckpointTask}
            onStart={onStart}
            onResume={onResume}
            minimalFocus={minimalFocus}
          />
        )}

        {!examModeActive && onOpenConceptLab && <ConceptLabShortcut onOpen={onOpenConceptLab} />}

        <div className="task-list">
          {resumeSession && !examModeActive && (
            <ResumeTaskCard
              session={resumeSession}
              onResume={onResume}
              checkpointNumber={activeCheckpointTask ? checkpointTrail?.assessmentNumber : undefined}
              minimalFocus={minimalFocus}
            />
          )}
          {assignments.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={onStart}
              onPrerequisite={onPrerequisite}
              checkpointNumber={task.kind === "review" && task.topicIds.some(
                (topicId) => pendingCheckpointTopicIds.has(topicId),
              ) ? checkpointTrail?.assessmentNumber : undefined}
              minimalFocus={minimalFocus}
            />
          ))}
        </div>

        <MockModeCard
          learner={learner}
          activeMock={activeMock}
          activeArchivePractice={activeArchivePractice}
          onOpen={onOpenMock}
        />

        {assignments.length === 0 && !resumeSession && !examModeActive && (
          <div className="empty-plan">
            <span aria-hidden="true">✓</span>
            <h2>{curriculumMastered ? t("home.plan.emptyMastered") : t("home.plan.empty")}</h2>
            <p>
              {curriculumMastered
                ? scheduledReviewAt
                  ? t("home.plan.nextScheduled", { date: formatReviewDate(scheduledReviewAt, locale) })
                  : t("home.plan.nextAutomatic")
                : t("home.plan.nextReview")}
            </p>
          </div>
        )}

        <div className="plan-footer">
          <p>{t("home.plan.generated")}</p>
          {confirmReset ? (
            <div className="reset-confirmation" role="alert">
              <p><strong>{t("home.reset.title")}</strong><span>{t("home.reset.body")}</span></p>
              <div>
                <button className="text-button" type="button" onClick={() => setConfirmReset(false)}>{t("common.cancel")}</button>
                <button className="danger-button" type="button" onClick={onReset}>{t("home.reset.delete")}</button>
              </div>
            </div>
          ) : (
            <button className="text-button" type="button" onClick={() => setConfirmReset(true)}>{t("home.reset.open")}</button>
          )}
        </div>
      </section>
    </main>
  )
}

const profilePracticeDays = Object.keys(practiceDayLabels) as PracticeDay[]
const profileHelpStyles = Object.keys(helpStyleLabels) as LearnerHelpStyle[]
const profileVisualModes = Object.keys(visualModeLabels) as LearnerVisualMode[]
const profileReadingModes = Object.keys(readingModeLabels) as LearnerReadingMode[]
const profileGeometryControlSides = Object.keys(geometryControlSideLabels) as GeometryControlSide[]
const profileSessionMinutes: SessionMinutes[] = [10, 15, 20]
const defaultOnboardingExamDate = "2027-03-08"

function zurichDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ""
  return `${value("year")}-${value("month")}-${value("day")}`
}

export function ProfileSetupView({
  learner,
  onSave,
  onCancel,
  onRestore,
  mode = "setup",
  now = new Date(),
}: {
  learner: LearnerState
  onSave: (input: LearnerProfileInput) => Promise<void>
  onCancel?: () => void
  onRestore?: (payload: GymiQuestBackupPayload) => Promise<void>
  mode?: "setup" | "edit"
  now?: Date
}) {
  const isEdit = mode === "edit"
  const { copy } = useLocalization()
  const profileCopy = copy.profile
  const minimumDate = zurichDateKey(now)
  const [step, setStep] = useState<1 | 2>(1)
  const [displayName, setDisplayName] = useState(
    learner.displayName === "Lernende" ? "" : learner.displayName,
  )
  const [examDate, setExamDate] = useState(
    learner.preferences.examDate ??
      (!isEdit && defaultOnboardingExamDate >= minimumDate ? defaultOnboardingExamDate : ""),
  )
  const [practiceDays, setPracticeDays] = useState<PracticeDay[]>([
    ...learner.preferences.practiceDays,
  ])
  const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes>(
    learner.preferences.sessionMinutes,
  )
  const [helpStyle, setHelpStyle] = useState<LearnerHelpStyle>(learner.preferences.helpStyle)
  const [visualMode, setVisualMode] = useState<LearnerVisualMode>(learner.preferences.visualMode)
  const [readingMode, setReadingMode] = useState<LearnerReadingMode>(learner.preferences.readingMode)
  const [geometryControlSide, setGeometryControlSide] = useState<GeometryControlSide>(learner.preferences.geometryControlSide)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const continueToPreferences = () => {
    const name = displayName.trim().replace(/\s+/g, " ")
    if (name.length < 2 || name.length > 24) {
      setError(profileCopy.nicknameError)
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate) || examDate < minimumDate) {
      setError(profileCopy.examDateError)
      return
    }
    setError("")
    setStep(2)
  }

  const save = async () => {
    if (practiceDays.length === 0) {
      setError(profileCopy.practiceDaysError)
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSave({
        displayName,
        examDate,
        practiceDays,
        sessionMinutes,
        helpStyle,
        visualMode,
        readingMode,
        geometryControlSide,
      })
    } catch {
      setError(profileCopy.saveError)
      setSaving(false)
    }
  }

  const togglePracticeDay = (day: PracticeDay) => {
    setPracticeDays((current) => current.includes(day)
      ? current.filter((candidate) => candidate !== day)
      : profilePracticeDays.filter((candidate) => candidate === day || current.includes(candidate)))
    setError("")
  }

  return (
    <main className="profile-setup-shell">
      {isEdit && onCancel && (
        <button className="curriculum-back" type="button" onClick={onCancel}>
          <span aria-hidden="true">←</span> {profileCopy.progressBack}
        </button>
      )}
      <section className="profile-setup-card">
        <div className="profile-setup-copy">
          <AppLanguagePicker onChange={() => setError("")} />
          <div className="profile-step-indicator" aria-label={profileCopy.stepLabel(step)}>
            <span className={step >= 1 ? "active" : ""}>1</span>
            <i />
            <span className={step >= 2 ? "active" : ""}>2</span>
          </div>

          {step === 1 ? (
            <>
              <span className="eyebrow">{profileCopy.goalEyebrow}</span>
              <h1>{profileCopy.goalTitle}</h1>
              <p>{profileCopy.goalIntro}</p>
              <div className="profile-primary-fields">
                <label htmlFor="profile-display-name">
                  <span>{profileCopy.nicknameLabel}</span>
                  <input
                    id="profile-display-name"
                    type="text"
                    autoComplete="nickname"
                    maxLength={24}
                    value={displayName}
                    placeholder={profileCopy.nicknamePlaceholder}
                    onChange={(event) => { setDisplayName(event.target.value); setError("") }}
                  />
                  <small>{profileCopy.nicknameHint}</small>
                </label>
                <label htmlFor="profile-exam-date">
                  <span>{profileCopy.examDateLabel}</span>
                  <input
                    id="profile-exam-date"
                    type="date"
                    min={minimumDate}
                    value={examDate}
                    onChange={(event) => { setExamDate(event.target.value); setError("") }}
                  />
                  <small>{profileCopy.examDateHint}</small>
                </label>
              </div>
              {error && <p className="profile-form-error" role="alert">{error}</p>}
              <div className="profile-setup-actions">
                <button className="primary-button" type="button" onClick={continueToPreferences}>
                  {profileCopy.rhythmButton}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">{profileCopy.rhythmEyebrow}</span>
              <h1>{profileCopy.rhythmTitle}</h1>
              <p>{profileCopy.rhythmIntro}</p>

              <fieldset className="profile-choice-group practice-day-choice">
                <legend>{profileCopy.practiceDaysLegend}</legend>
                <p>{profileCopy.practiceDaysHint}</p>
                <div>
                  {profilePracticeDays.map((day) => (
                    <button
                      className={practiceDays.includes(day) ? "selected" : ""}
                      type="button"
                      key={day}
                      aria-pressed={practiceDays.includes(day)}
                      onClick={() => togglePracticeDay(day)}
                    >
                      {profileCopy.practiceDayLabels[day]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="profile-choice-group session-choice">
                <legend>{profileCopy.sessionLengthLegend}</legend>
                <div>
                  {profileSessionMinutes.map((minutes) => (
                    <button
                      className={sessionMinutes === minutes ? "selected" : ""}
                      type="button"
                      key={minutes}
                      aria-pressed={sessionMinutes === minutes}
                      onClick={() => setSessionMinutes(minutes)}
                    >
                      <strong>{minutes}</strong><span>{profileCopy.minutes}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="profile-choice-group preference-cards">
                <legend>{profileCopy.helpStyleLegend}</legend>
                <div>
                  {profileHelpStyles.map((style) => (
                    <button
                      className={helpStyle === style ? "selected" : ""}
                      type="button"
                      key={style}
                      aria-pressed={helpStyle === style}
                      onClick={() => setHelpStyle(style)}
                    >
                      <strong>{profileCopy.helpStyleLabels[style].title}</strong>
                      <span>{profileCopy.helpStyleLabels[style].description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="profile-choice-group preference-cards visual-choice">
                <legend>{profileCopy.visualModeLegend}</legend>
                <div>
                  {profileVisualModes.map((modeOption) => (
                    <button
                      className={visualMode === modeOption ? "selected" : ""}
                      type="button"
                      key={modeOption}
                      aria-pressed={visualMode === modeOption}
                      onClick={() => setVisualMode(modeOption)}
                    >
                      <strong>{profileCopy.visualModeLabels[modeOption].title}</strong>
                      <span>{profileCopy.visualModeLabels[modeOption].description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="profile-choice-group preference-cards reading-choice">
                <legend>{profileCopy.readingModeLegend}</legend>
                <div>
                  {profileReadingModes.map((modeOption) => (
                    <button
                      className={readingMode === modeOption ? "selected" : ""}
                      type="button"
                      key={modeOption}
                      aria-pressed={readingMode === modeOption}
                      onClick={() => setReadingMode(modeOption)}
                    >
                      <strong>{profileCopy.readingModeLabels[modeOption].title}</strong>
                      <span>{profileCopy.readingModeLabels[modeOption].description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="profile-choice-group preference-cards geometry-control-choice">
                <legend>{profileCopy.geometrySideLegend}</legend>
                <p>{profileCopy.geometrySideHint}</p>
                <div>
                  {profileGeometryControlSides.map((side) => (
                    <button
                      className={geometryControlSide === side ? "selected" : ""}
                      type="button"
                      key={side}
                      aria-pressed={geometryControlSide === side}
                      onClick={() => setGeometryControlSide(side)}
                    >
                      <strong>{profileCopy.geometrySideLabels[side].title}</strong>
                      <span>{profileCopy.geometrySideLabels[side].description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {error && <p className="profile-form-error" role="alert">{error}</p>}
              <div className="profile-setup-actions split">
                <button className="secondary-button" type="button" onClick={() => setStep(1)}>{profileCopy.back}</button>
                <button className="primary-button" type="button" disabled={saving} onClick={() => void save()}>
                  {saving ? profileCopy.saving : isEdit ? profileCopy.saveChanges : profileCopy.saveAndStart}
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="profile-setup-preview">
          <span className="eyebrow">{profileCopy.previewEyebrow}</span>
          <h2>{profileCopy.previewTitle}</h2>
          <div>
            <p><span aria-hidden="true">✦</span><strong>{profileCopy.lessonTitle}</strong><small>{profileCopy.lessonDescription}</small></p>
            <p><span aria-hidden="true">↻</span><strong>{profileCopy.reviewTitle}</strong><small>{profileCopy.reviewDescription}</small></p>
            <p><span aria-hidden="true">◆</span><strong>{profileCopy.assessmentTitle}</strong><small>{profileCopy.assessmentDescription}</small></p>
          </div>
          <p className="profile-privacy-note">{profileCopy.privacyNote}</p>
        </aside>
      </section>

      {!isEdit && onRestore && (
        <DataBackupPanel learner={learner} onRestore={onRestore} restoreOnly />
      )}
    </main>
  )
}

export function OnboardingView({
  onStartPlacement,
  onStartFoundations,
  resumeSession,
  onResume,
  learner,
  onRestore,
}: {
  onStartPlacement: () => void
  onStartFoundations: () => void
  resumeSession?: ActiveLearningSession
  onResume?: () => void
  learner?: LearnerState
  onRestore?: (payload: GymiQuestBackupPayload) => Promise<void>
}) {
  const { copy } = useLocalization()
  const onboardingCopy = copy.onboarding
  const placementProgress = resumeSession
    ? onboardingCopy.progress(
        resumeSession.question.questionIndex + 1,
        resumeSession.task.questionCount,
        formatMinutes(resumeSession.activeSeconds),
      )
    : undefined

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <div className="onboarding-copy">
          <span className="eyebrow">{onboardingCopy.eyebrow}</span>
          <h1>{onboardingCopy.title}</h1>
          <p>{onboardingCopy.intro}</p>

          <div className="onboarding-promises">
            <div><span aria-hidden="true">✓</span><p><strong>{onboardingCopy.noGradeTitle}</strong><small>{onboardingCopy.noGradeDetail}</small></p></div>
            <div><span aria-hidden="true">↻</span><p><strong>{onboardingCopy.reviewTitle}</strong><small>{onboardingCopy.reviewDetail}</small></p></div>
            <div><span aria-hidden="true">◎</span><p><strong>{onboardingCopy.noXpTitle}</strong><small>{onboardingCopy.noXpDetail}</small></p></div>
          </div>

          <div className="onboarding-actions">
            {resumeSession && onResume ? (
              <button className="primary-button" type="button" onClick={onResume}>
                {onboardingCopy.resume}
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={onStartPlacement}>
                {onboardingCopy.start}
              </button>
            )}
            <button className="secondary-button" type="button" onClick={onStartFoundations}>
              {onboardingCopy.foundations}
            </button>
          </div>
          <small className="onboarding-duration">
            {placementProgress ?? onboardingCopy.duration(PLACEMENT_QUESTION_COUNT)}
          </small>
        </div>

        <div className="onboarding-path" aria-label={onboardingCopy.pathAria}>
          <div className="onboarding-path-heading">
            <span>{onboardingCopy.pathEyebrow}</span>
            <strong>{onboardingCopy.pathTitle}</strong>
          </div>
          <div className="onboarding-path-list">
            <div className="current"><span>1</span><p><strong>{onboardingCopy.placementTitle}</strong><small>{onboardingCopy.placementDetail}</small></p></div>
            <div><span>2</span><p><strong>{onboardingCopy.lessonsTitle}</strong><small>{onboardingCopy.lessonsDetail}</small></p></div>
            <div><span>3</span><p><strong>{onboardingCopy.reviewsTitle}</strong><small>{onboardingCopy.reviewsDetail}</small></p></div>
            <div><span>4</span><p><strong>{onboardingCopy.assessmentsTitle}</strong><small>{onboardingCopy.assessmentsDetail}</small></p></div>
          </div>
          <p className="onboarding-path-note">{onboardingCopy.pathNote}</p>
        </div>
      </section>
      {learner && onRestore && (
        <DataBackupPanel
          learner={learner}
          onRestore={onRestore}
          restoreOnly
        />
      )}
    </main>
  )
}

const curriculumGroups = [
  {
    id: "foundation",
    topicIds: activeCurriculumTopics.slice(0, 7).map((topic) => topic.id),
  },
  {
    id: "apply",
    topicIds: activeCurriculumTopics.slice(7, 14).map((topic) => topic.id),
  },
  {
    id: "deepen",
    topicIds: activeCurriculumTopics.slice(14).map((topic) => topic.id),
  },
] as const

function curriculumGroupCopy(
  groupId: (typeof curriculumGroups)[number]["id"],
  locale: AppLocale,
): { title: string; description: string } {
  const prefix = `curriculum.${groupId}` as const
  return {
    title: translateMessage(locale, `${prefix}.title`),
    description: translateMessage(locale, `${prefix}.body`),
  }
}

function CurriculumView({
  learner,
  examRunning = false,
  onBack,
  onStartLesson,
  onRefresh,
  onOpenConcept,
}: {
  learner: LearnerState
  examRunning?: boolean
  onBack: () => void
  onStartLesson: (topicId: TopicId) => void
  onRefresh: (topicId: TopicId) => void
  onOpenConcept: (topicId: TopicId) => void
}) {
  const { locale, t } = useLocalization()
  const allTopics = curriculumTopicsForLearner(learner)
  const masteredCount = allTopics.filter(
    (topic) => learner.mastery[topic.id].status === "mastered",
  ).length
  const curriculumMastered = masteredCount === allTopics.length
  const assessmentPending = buildAssignments(learner).some(
    (task) => task.kind === "assessment",
  )
  const learningBlocked = assessmentPending || examRunning

  return (
    <main className="curriculum-shell">
      <button className="curriculum-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        {t("common.learningPlan")}
      </button>

      <section className="curriculum-hero">
        <div>
          <span className="eyebrow">{curriculumMastered ? t("curriculum.consolidation") : t("curriculum.path")}</span>
          <h1>{curriculumMastered ? t("curriculum.masteredTitle") : t("curriculum.title")}</h1>
          <p>
            {curriculumMastered
              ? t("curriculum.masteredBody")
              : t("curriculum.body")}
          </p>
        </div>
        <div className="curriculum-summary" aria-label={t("curriculum.summaryAria", { mastered: masteredCount, total: allTopics.length })}>
          <strong>{masteredCount}<span>/{allTopics.length}</span></strong>
          <small>{t("curriculum.topicsLearned")}</small>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${courseProgress(learner) * 100}%` }} />
          </div>
        </div>
      </section>

      {assessmentPending && (
        <div className="curriculum-assessment-gate" role="status">
          <span aria-hidden="true">◆</span>
          <div>
            <strong>{t("curriculum.assessmentGateTitle")}</strong>
            <p>{t("curriculum.assessmentGateBody")}</p>
          </div>
        </div>
      )}
      {examRunning && (
        <div className="curriculum-assessment-gate" role="status">
          <span aria-hidden="true">◇</span>
          <div>
            <strong>{t("curriculum.examGateTitle")}</strong>
            <p>{t("curriculum.examGateBody")}</p>
          </div>
        </div>
      )}

      <div className="curriculum-groups">
        {curriculumGroups.map((group) => {
          const groupCopy = curriculumGroupCopy(group.id, locale)
          return (
          <section className="curriculum-group" key={group.id}>
            <div className="curriculum-group-heading">
              <div>
                <h2>{groupCopy.title}</h2>
                <p>{groupCopy.description}</p>
              </div>
              <span>{t("curriculum.topicCount", { count: group.topicIds.length })}</span>
            </div>
            <div className="curriculum-topic-list">
              {group.topicIds.map((topicId) => {
                const topic = topicForLocale(topicId, locale)
                const mastery = learner.mastery[topicId]
                const status = mastery.status
                const teacherPaused = topicNeedsTeacherSupport(learner, topicId)
                const statusLabel = teacherPaused
                  ? t("curriculum.status.paused")
                  : status === "mastered"
                  ? t("curriculum.status.mastered")
                  : status === "available"
                    ? t("curriculum.status.available")
                    : status === "learning"
                      ? t("curriculum.status.learning")
                      : t("curriculum.status.locked")

                return (
                  <article className={`curriculum-topic-card ${status}${teacherPaused ? " teacher-paused" : ""}`} key={topic.id}>
                    <div className="curriculum-topic-order" aria-hidden="true">
                      {status === "mastered" ? "✓" : topic.courseOrder}
                    </div>
                    <div className="curriculum-topic-copy">
                      <div className="curriculum-topic-titleline">
                        <span className={`curriculum-status ${status}`}>{statusLabel}</span>
                        {status === "mastered" && mastery.dueAt && !teacherPaused && (
                          <small>{t("curriculum.nextReview", { date: formatReviewDate(mastery.dueAt, locale) })}</small>
                        )}
                        {teacherPaused && <small>{t("curriculum.pausedBody")}</small>}
                      </div>
                      <h3>{topic.title}</h3>
                      <p>{topic.description}</p>
                      <div className="curriculum-prerequisites" aria-label={t("curriculum.prerequisites")}>
                        {topic.prerequisites.length === 0 ? (
                          <span className="curriculum-prerequisite ready">{t("curriculum.startTopic")}</span>
                        ) : topic.prerequisites.map((prerequisiteId) => {
                          const prerequisite = topicForLocale(prerequisiteId, locale)
                          const ready = learner.mastery[prerequisiteId].status === "mastered"
                          return (
                            <span className={`curriculum-prerequisite ${ready ? "ready" : "missing"}`} key={prerequisiteId}>
                              <span aria-hidden="true">{ready ? "✓" : "○"}</span>
                              {prerequisite.shortTitle}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className="curriculum-topic-action">
                      <button
                        className="secondary-button compact"
                        type="button"
                        onClick={() => onOpenConcept(topicId)}
                      >
                        {t("curriculum.viewIdea")}
                      </button>
                      {status === "mastered" ? (
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={learningBlocked || teacherPaused}
                          onClick={() => onRefresh(topicId)}
                        >
                          {teacherPaused ? t("curriculum.pausedTraining") : t("curriculum.startRefresh")}
                        </button>
                      ) : status === "available" || status === "learning" ? (
                        <button
                          className="primary-button compact"
                          type="button"
                          disabled={learningBlocked || teacherPaused}
                          onClick={() => onStartLesson(topicId)}
                        >
                          {teacherPaused
                            ? t("curriculum.pausedTraining")
                            : status === "learning" ? t("curriculum.startRecovery") : t("curriculum.startLesson")}
                        </button>
                      ) : (
                        <span>{t("curriculum.learnPrerequisites")}</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )})}
      </div>
    </main>
  )
}

function formatSessionDate(value: string, locale: AppLocale = "de"): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function weeklyMinutes(seconds: number): string {
  if (seconds === 0) return "0"
  return String(Math.max(1, Math.round(seconds / 60)))
}

function ErrorCompassPanel({
  compass,
  blocked = false,
  onPractice,
}: {
  compass: ErrorCompass
  blocked?: boolean
  onPractice?: (topicId: TopicId) => void
}) {
  const { locale, t } = useLocalization()
  const visiblePatterns = compass.patterns.slice(0, 4)

  return (
    <section className="progress-panel error-compass-panel" aria-labelledby="error-compass-title">
      <div className="progress-panel-heading">
        <div>
          <span className="eyebrow">{t("compass.eyebrow", { days: compass.windowDays })}</span>
          <h2 id="error-compass-title">{t("compass.title")}</h2>
        </div>
        <span>
          {compass.totalOccurrences === 0
            ? t("compass.none")
            : t("compass.resolved", { resolved: compass.resolvedOccurrences, total: compass.totalOccurrences })}
        </span>
      </div>
      <p className="error-compass-explainer">
        {t("compass.body")}
      </p>

      {visiblePatterns.length === 0 ? (
        <div className="error-compass-empty">
          <span aria-hidden="true">⌁</span>
          <div>
            <strong>{t("compass.empty")}</strong>
            <p>{t("compass.emptyBody")}</p>
          </div>
        </div>
      ) : (
        <div className="error-pattern-grid">
          {visiblePatterns.map((pattern) => {
            const recoveryRate = Math.round((pattern.resolvedOccurrences / pattern.occurrences) * 100)
            const topicId = pattern.topicIds[0]
            const patternCopy = diagnosticKindCopyForLocale(pattern.kind, locale)
            const latestTitle = pattern.latestTitle
            return (
              <article key={pattern.kind}>
                <div className="error-pattern-heading">
                  <span aria-hidden="true">{pattern.openOccurrences === 0 ? "✓" : "↗"}</span>
                  <div>
                    <h3>{patternCopy.label}</h3>
                    <small>{t("compass.occurrences", { occurrences: pattern.occurrences, resolved: pattern.resolvedOccurrences })}</small>
                  </div>
                </div>
                <p>{patternCopy.description}</p>
                <div className="error-recovery-meter" aria-label={t("compass.recoveryAria", { label: patternCopy.label, rate: recoveryRate })}>
                  <span style={{ width: `${recoveryRate}%` }} />
                </div>
                <small className="error-latest-signal">{t("compass.latest", { title: latestTitle })}</small>
                <p className="error-next-move"><strong>{t("compass.next")}</strong>{patternCopy.nextMove}</p>
                <div className="error-pattern-footer">
                  <span>{pattern.topicIds.map((id) => topicForLocale(id, locale).shortTitle).join(" · ")}</span>
                  {onPractice && topicId && (
                    <button
                      className="secondary-button compact"
                      type="button"
                      disabled={blocked}
                      onClick={() => onPractice(topicId)}
                    >
                      {blocked ? t("compass.later") : t("compass.practice")}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function CollectionView({
  learner,
  onBack,
}: {
  learner: LearnerState
  onBack: () => void
}) {
  const { locale, t } = useLocalization()
  const expedition = buildExpeditionCollection(learner, locale)
  const next = expedition.nextCollectible
  const nextProgress = next
    ? Math.min(100, Math.round((expedition.totalXp / next.xpRequired) * 100))
    : 100

  return (
    <main className="collection-shell">
      <button className="curriculum-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        {t("common.learningPlan")}
      </button>

      <section className="collection-hero" aria-labelledby="collection-title">
        <div className="collection-hero-copy">
          <span className="eyebrow">{t("collection.eyebrow")}</span>
          <h1 id="collection-title">{t("collection.title")}</h1>
          <p>{t("collection.body")}</p>
          <div className="collection-hero-stats" aria-label={t("collection.statsAria")}>
            <div><strong>{expedition.totalXp}</strong><span>{t("collection.existingXp")}</span></div>
            <div><strong>{expedition.unlockedCollectibles}/{expedition.collectibles.length}</strong><span>{t("collection.equipment")}</span></div>
            <div><strong>{expedition.unlockedChapters}/{expedition.chapters.length}</strong><span>{t("collection.chapters")}</span></div>
          </div>
        </div>
        <div className="collection-next-card">
          <span className="collection-next-icon" aria-hidden="true">{next?.icon ?? "★"}</span>
          <span className="eyebrow">{next ? t("collection.next") : t("collection.complete")}</span>
          <h2>{next?.title ?? t("collection.starMap")}</h2>
          <p>
            {next
              ? t("collection.nextBody", { xp: expedition.xpToNext })
              : t("collection.completeBody")}
          </p>
          <div
            className="meter"
            role="progressbar"
            aria-label={next ? t("home.expedition.progressAria", { title: next.title }) : t("collection.completeAria")}
            aria-valuemin={0}
            aria-valuemax={next?.xpRequired ?? expedition.totalXp}
            aria-valuenow={expedition.totalXp}
          >
            <span style={{ width: `${nextProgress}%` }} />
          </div>
          <small>{next ? `${expedition.totalXp}/${next.xpRequired} XP` : t("collection.allCollected", { xp: expedition.totalXp })}</small>
        </div>
      </section>

      <section className="collection-section" aria-labelledby="equipment-title">
        <div className="collection-section-heading">
          <div>
            <span className="eyebrow">{t("collection.equipment").toLocaleUpperCase(intlLocaleFor(locale))}</span>
            <h2 id="equipment-title">{t("collection.equipmentTitle")}</h2>
          </div>
          <span>{t("collection.openCount", { current: expedition.unlockedCollectibles, total: expedition.collectibles.length })}</span>
        </div>
        <div className="collectible-grid">
          {expedition.collectibles.map((item) => {
            const progress = item.xpRequired === 0
              ? 100
              : Math.min(100, Math.round((item.currentXp / item.xpRequired) * 100))
            return (
              <article className={item.unlocked ? "unlocked" : "locked"} key={item.id}>
                <span className="collectible-icon" aria-hidden="true">{item.unlocked ? item.icon : "·"}</span>
                <div>
                  <span>{item.unlocked ? t("collection.collected") : t("collection.fromXp", { xp: item.xpRequired })}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                {item.unlocked ? (
                  <small>{item.xpRequired === 0 ? t("collection.starter") : t("collection.openedAt", { xp: item.xpRequired })}</small>
                ) : (
                  <div className="collectible-progress">
                    <div
                      className="meter"
                      role="progressbar"
                      aria-label={t("collection.progressAria", { title: item.title })}
                      aria-valuemin={0}
                      aria-valuemax={item.xpRequired}
                      aria-valuenow={item.currentXp}
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <small>{item.currentXp}/{item.xpRequired}</small>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="collection-section story-section" aria-labelledby="story-title">
        <div className="collection-section-heading">
          <div>
            <span className="eyebrow">{t("collection.pathEyebrow")}</span>
            <h2 id="story-title">{t("collection.pathTitle")}</h2>
          </div>
          <span>{t("collection.chapterCount", { current: expedition.unlockedChapters, total: expedition.chapters.length })}</span>
        </div>
        <ol className="expedition-story">
          {expedition.chapters.map((chapter) => (
            <li className={chapter.unlocked ? "unlocked" : "locked"} key={chapter.id}>
              <span className="story-index" aria-hidden="true">{chapter.unlocked ? "✓" : chapter.index}</span>
              <div>
                <span>{chapter.unlocked ? t("collection.chapterOpen") : t("collection.stillOpen")}</span>
                <h3>{chapter.title}</h3>
                <p>{chapter.description}</p>
                <small>
                  {chapter.unlocked
                    ? `${chapter.evidence}${chapter.unlockedAt ? ` · ${formatSessionDate(chapter.unlockedAt, locale)}` : ""}`
                    : `${chapter.evidence} · ${chapter.current}/${chapter.target}`}
                </small>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="collection-fairness" aria-labelledby="collection-fairness-title">
        <div aria-hidden="true">◎</div>
        <div>
          <span className="eyebrow">{t("collection.fairEyebrow")}</span>
          <h2 id="collection-fairness-title">{t("collection.fairTitle")}</h2>
          <p>{t("collection.fairBody")}</p>
        </div>
      </section>
    </main>
  )
}

export function ProgressView({
  learner,
  germanCourse,
  germanSourcePractice,
  courseIndex,
  onBack,
  onOpenParent,
  onOpenCollection,
  onEditProfile,
  onResetSubject,
  onReset,
  onPracticeError,
  activeSession,
  activeMock,
  activeArchivePractice,
  onRestore,
  now = new Date(),
}: {
  learner: LearnerState
  germanCourse?: GermanCourseState
  germanSourcePractice?: GermanSourcePracticeState
  courseIndex?: LearnerCourseIndex
  onBack: () => void
  onOpenParent?: () => void
  onOpenCollection?: () => void
  onEditProfile?: () => void
  onResetSubject?: () => void
  onReset?: () => void
  onPracticeError?: (topicId: TopicId) => void
  activeSession?: ActiveLearningSession
  activeMock?: ActiveMockExam
  activeArchivePractice?: ActiveArchivePractice
  onRestore?: (payload: GymiQuestBackupPayload) => Promise<void>
  now?: Date
}) {
  const { locale, intlLocale, copy, t } = useLocalization()
  const [confirmSubjectReset, setConfirmSubjectReset] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const minimalFocus = learner.preferences.visualMode === "focus"
  const curriculumPackage = requireLearnerCurriculumPackage(learner)
  const analytics = buildProgressAnalytics(learner, now, "Europe/Zurich", intlLocale)
  const allTopics = curriculumTopicsForLearner(learner).map((topic) => topicForLocale(topic.id, locale))
  const masteredCount = allTopics.filter(
    (topic) => learner.mastery[topic.id].status === "mastered",
  ).length
  const curriculumMastered = masteredCount === allTopics.length
  const maximumDaySeconds = Math.max(
    1,
    ...analytics.days.map((day) => day.activeSeconds),
  )
  const recentEvents = [...learner.learningEvents]
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
    .slice(0, 8)
  const recentMocks = [...learner.mockHistory]
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
    .slice(0, 5)
  const achievements = minimalFocus ? [] : buildAchievements(learner, locale)
  const unlockedAchievements = achievements.filter((item) => item.unlocked).length
  const study = buildStudySnapshot(learner, now)
  const readinessLabel = study.readinessLabel === "Prüfungsnah"
    ? t("home.stats.readiness.examReady")
    : study.readinessLabel === "Am Festigen"
      ? t("home.stats.readiness.consolidating")
      : t("home.stats.readiness.building")
  const examDateLabel = study.examDate
    ? new Intl.DateTimeFormat(intlLocale, {
        timeZone: "UTC",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${study.examDate}T12:00:00.000Z`))
    : t("home.stats.dateNotSet")
  const errorCompass = buildErrorCompass(learner, now, 45, locale)
  const errorPracticeBlocked = Boolean(
    activeSession ||
    activeMock ||
    activeArchivePractice ||
    buildAssignments(learner, now).some((task) => task.kind === "assessment"),
  )

  return (
    <main className="progress-shell">
      <button className="curriculum-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        {t("common.learningPlan")}
      </button>

      <section className="progress-hero">
        <div>
          <span className="eyebrow">{curriculumMastered ? t("progress.hero.consolidationEyebrow") : t("progress.hero.eyebrow")}</span>
          <h1>{curriculumMastered ? t("progress.hero.consolidationTitle") : t("progress.hero.title")}</h1>
          <p>
            {curriculumMastered
              ? t("progress.hero.consolidationBody")
              : t("progress.hero.body")}
          </p>
        </div>
        <div className="progress-course-total">
          <span>{t("progress.hero.learned")}</span>
          <strong>{masteredCount}<small>/{allTopics.length}</small></strong>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${courseProgress(learner) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="study-settings-card" aria-labelledby="study-settings-title">
        <div className="study-settings-heading">
          <div>
            <span className="eyebrow">{t("progress.settings.eyebrow")}</span>
            <h2 id="study-settings-title">{t("progress.settings.title", { name: learner.displayName })}</h2>
          </div>
          {onEditProfile && (
            <button className="secondary-button" type="button" onClick={onEditProfile}>
              {t("progress.settings.edit")}
            </button>
          )}
        </div>
        <div className="study-settings-grid">
          <div className="study-settings-language">
            <AppLanguagePicker id="settings-app-language" />
          </div>
          <div><span>{t("progress.settings.examGoal")}</span><strong>{examDateLabel}</strong><small>{readinessLabel} · {t("progress.settings.noPrediction")}</small></div>
          <div><span>{t("progress.settings.days")}</span><strong>{learner.preferences.practiceDays.map((day) => copy.profile.practiceDayLabels[day]).join(" · ")}</strong><small>{t("progress.settings.roundMinutes", { minutes: learner.preferences.sessionMinutes })}</small></div>
          <div><span>{t("progress.settings.help")}</span><strong>{copy.profile.helpStyleLabels[learner.preferences.helpStyle].title}</strong><small>{copy.profile.helpStyleLabels[learner.preferences.helpStyle].description}</small></div>
          <div><span>{t("progress.settings.presentation")}</span><strong>{copy.profile.visualModeLabels[learner.preferences.visualMode].title}</strong><small>{copy.profile.visualModeLabels[learner.preferences.visualMode].description}</small></div>
          <div><span>{t("progress.settings.reading")}</span><strong>{copy.profile.readingModeLabels[learner.preferences.readingMode].title}</strong><small>{copy.profile.readingModeLabels[learner.preferences.readingMode].description}</small></div>
          <div><span>{t("progress.settings.geometry")}</span><strong>{copy.profile.geometrySideLabels[learner.preferences.geometryControlSide].title}</strong><small>{copy.profile.geometrySideLabels[learner.preferences.geometryControlSide].description}</small></div>
          <div><span>{t("progress.settings.curriculum")}</span><strong>{curriculumPackage.title}</strong><small>{curriculumPackage.scope.learnerLanguageLabel} · {t("progress.settings.packageVersion", { version: curriculumPackage.version })}</small></div>
        </div>
        <p className="curriculum-package-scope">
          <strong>{t("progress.settings.scope")}</strong> {curriculumPackage.scope.jurisdiction} · {curriculumPackage.scope.track}. {t("progress.settings.scopeBody")}
        </p>
        {(onResetSubject || onReset) && (
          <div className="study-settings-reset">
            {onResetSubject && (
              confirmSubjectReset ? (
                <div className="reset-confirmation" role="alert">
                  <p>
                    <strong>{t("progress.subjectReset.title")}</strong>
                    <span>{t("progress.subjectReset.body")}</span>
                  </p>
                  <div>
                    <button className="text-button" type="button" onClick={() => setConfirmSubjectReset(false)}>{t("common.cancel")}</button>
                    <button className="danger-button" type="button" onClick={onResetSubject}>{t("progress.subjectReset.confirm")}</button>
                  </div>
                </div>
              ) : (
                <button className="text-button" type="button" onClick={() => setConfirmSubjectReset(true)}>
                  {t("progress.subjectReset.open")}
                </button>
              )
            )}
            {onReset && (
              <>
            {confirmReset ? (
              <div className="reset-confirmation" role="alert">
                <p>
                  <strong>{t("progress.reset.title")}</strong>
                  <span>{t("progress.reset.body")}</span>
                </p>
                <div>
                  <button className="text-button" type="button" onClick={() => setConfirmReset(false)}>{t("common.cancel")}</button>
                  <button className="danger-button" type="button" onClick={onReset}>{t("progress.reset.confirm")}</button>
                </div>
              </div>
            ) : (
              <button className="text-button" type="button" onClick={() => setConfirmReset(true)}>
                {t("progress.reset.open")}
              </button>
            )}
              </>
            )}
          </div>
        )}
      </section>

      {onOpenParent && (
        <section className="parent-entry-card" aria-labelledby="parent-entry-title">
          <div className="parent-entry-icon" aria-hidden="true">◉</div>
          <div>
            <span className="eyebrow">{t("progress.parent.eyebrow")}</span>
            <h2 id="parent-entry-title">{t("progress.parent.title")}</h2>
            <p>{t("progress.parent.body")}</p>
          </div>
          <button className="secondary-button" type="button" onClick={onOpenParent}>
            {t("progress.parent.open")}
          </button>
        </section>
      )}

      <section className="progress-summary" aria-label={t("progress.weekAria")}>
        <article>
          <span>{t("progress.activeTime")}</span>
          <strong>{weeklyMinutes(analytics.activeSeconds)} <small>{t("common.minutesShort")}</small></strong>
          <p>{t("progress.activeTimeBody")}</p>
        </article>
        <article>
          <span>{t("progress.rounds")}</span>
          <strong>{analytics.sessions}</strong>
          <p>
            {analytics.lessons} {analytics.lessons === 1 ? t("progress.lessonOne") : t("progress.lessonMany")} ·{" "}
            {analytics.reviews} {analytics.reviews === 1 ? t("progress.reviewOne") : t("progress.reviewMany")} ·{" "}
            {analytics.assessments} {analytics.assessments === 1 ? t("progress.assessmentOne") : t("progress.assessmentMany")}
            {analytics.placements > 0 && ` · ${analytics.placements} ${copy.player.taskKinds.placement}`}
          </p>
        </article>
        <article>
          <span>{t("progress.independent")}</span>
          <strong>{analytics.questions === 0 ? "–" : `${analytics.independentRate}%`}</strong>
          <p>{t("progress.independentBody", { independent: analytics.independentQuestions, total: analytics.questions })}</p>
        </article>
        <article>
          <span>{t("progress.collected")}</span>
          <strong>{learner.totalXp} <small>XP</small></strong>
          <p>{t("progress.collectedBody")}</p>
        </article>
      </section>

      <ErrorCompassPanel
        compass={errorCompass}
        blocked={errorPracticeBlocked}
        onPractice={onPracticeError}
      />

      {!minimalFocus && (
        <section className="progress-panel achievements-panel">
          <div className="progress-panel-heading">
            <div>
              <span className="eyebrow">{t("progress.badgesEyebrow")}</span>
              <h2>{t("progress.badgesTitle")}</h2>
            </div>
            <div className="achievement-heading-actions">
              <span>{t("progress.badgesCount", { current: unlockedAchievements, total: achievements.length })}</span>
              {onOpenCollection && (
                <button className="secondary-button compact" type="button" onClick={onOpenCollection}>
                  {t("progress.expeditionOpen")}
                </button>
              )}
            </div>
          </div>
          <p className="achievements-explainer">
            {t("progress.badgesBody")}
          </p>
          <div className="achievement-grid">
            {achievements.map((item) => (
              <article className={item.unlocked ? "unlocked" : "locked"} key={item.id}>
                <span className="achievement-icon" aria-hidden="true">{item.unlocked ? item.icon : "·"}</span>
                <div>
                  <span>{item.unlocked ? t("progress.badgeUnlocked") : t("progress.badgeOpen")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                {item.unlocked ? (
                  <small>{item.unlockedAt ? formatSessionDate(item.unlockedAt, locale) : t("progress.done")}</small>
                ) : (
                  <div className="achievement-progress">
                    <div className="meter" aria-hidden="true">
                      <span style={{ width: `${Math.round((item.current / item.target) * 100)}%` }} />
                    </div>
                    <small>{item.current}/{item.target}</small>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="progress-grid">
        <article className="progress-panel activity-panel">
          <div className="progress-panel-heading">
            <div>
              <span className="eyebrow">{t("progress.lastSeven")}</span>
              <h2>{t("progress.activeTime")}</h2>
            </div>
            <strong>{weeklyMinutes(analytics.activeSeconds)} {t("common.minutesShort")}</strong>
          </div>
          <div className="activity-chart">
            {analytics.days.map((day) => {
              const height = day.activeSeconds === 0
                ? 4
                : Math.max(12, Math.round((day.activeSeconds / maximumDaySeconds) * 100))
              return (
                <div
                  className="activity-day"
                  key={day.dateKey}
                  role="img"
                  aria-label={t("progress.activityAria", {
                    day: day.label,
                    minutes: weeklyMinutes(day.activeSeconds),
                    rounds: day.sessions,
                  })}
                >
                  <span className="activity-value" aria-hidden="true">
                    {day.activeSeconds > 0 ? `${weeklyMinutes(day.activeSeconds)}m` : ""}
                  </span>
                  <div className="activity-track" aria-hidden="true">
                    <span style={{ height: `${height}%` }} />
                  </div>
                  <strong>{day.label}</strong>
                </div>
              )
            })}
          </div>
          {analytics.sessions === 0 && (
            <p className="activity-empty">{t("progress.activityEmpty")}</p>
          )}
        </article>

        <article className="progress-panel rhythm-panel">
          <span className="eyebrow">{t("progress.rhythmEyebrow")}</span>
          <h2>{t("progress.rhythmTitle")}</h2>
          <div className="rhythm-list">
            <div>
              <span className="rhythm-mark lesson" aria-hidden="true">✦</span>
              <p><strong>{t("progress.rhythmLessons")}</strong><small>{t("progress.rhythmLessonsBody")}</small></p>
            </div>
            <div>
              <span className="rhythm-mark review" aria-hidden="true">↻</span>
              <p><strong>{t("progress.rhythmReviews")}</strong><small>{t("progress.rhythmReviewsBody")}</small></p>
            </div>
            <div>
              <span className="rhythm-mark assessment" aria-hidden="true">◆</span>
              <p><strong>{t("progress.rhythmAssessments")}</strong><small>{t("progress.rhythmAssessmentsBody")}</small></p>
            </div>
          </div>
        </article>
      </section>

      <section className="progress-panel mock-history-panel">
        <div className="progress-panel-heading">
          <div>
            <span className="eyebrow">{t("progress.mocksEyebrow")}</span>
            <h2>{t("progress.mocksTitle")}</h2>
          </div>
          <span>{t("progress.mocksSeparate")}</span>
        </div>
        {recentMocks.length === 0 ? (
          <div className="recent-empty">
            <span aria-hidden="true">◇</span>
            <div><strong>{t("progress.mocksEmpty")}</strong><p>{t("progress.mocksEmptyBody")}</p></div>
          </div>
        ) : (
          <div className="mock-history-list">
            {recentMocks.map((mock) => {
              const examYear = officialExamYear(mock.editionId)
              return (
                <article key={mock.id}>
                  <div>
                    <span>
                      {mock.source === "official-archive"
                        ? t("progress.mocks.official", { year: examYear ? ` ${examYear}` : "" })
                        : t("progress.mocks.generated")}
                      {formatSessionDate(mock.submittedAt, locale)} · {mock.submissionReason === "timeout" ? t("progress.mocks.timeout") : t("progress.mocks.submitted")}
                    </span>
                    <strong>
                      {mock.certainPoints}/{mock.maxPoints} {mock.officialReview?.status === "complete" ? t("home.mock.corrected") : t("home.mock.certain")} {t("home.mock.points")}
                    </strong>
                  </div>
                  <div>
                    <strong>
                      {mock.officialReview?.status === "pending"
                        ? t("common.open")
                        : mock.officialReview?.mathematicsGrade !== undefined
                          ? formatSwissGrade(mock.officialReview.mathematicsGrade)
                          : mock.reviewablePoints > 0 ? `+${mock.reviewablePoints}` : "0"}
                    </strong>
                    <span>
                      {mock.officialReview?.status === "pending"
                        ? t("progress.mocks.correction")
                        : mock.officialReview?.mathematicsGrade !== undefined ? t("progress.mocks.grade") : t("progress.mocks.review")}
                    </span>
                  </div>
                  <div>
                    <strong>{formatMinutes(mock.durationSeconds)}</strong>
                    <span>{t("progress.mocks.examTime")}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="progress-panel topic-progress-panel">
        <div className="progress-panel-heading">
          <div>
            <span className="eyebrow">{t("progress.topicsEyebrow")}</span>
            <h2>{t("progress.topicsTitle")}</h2>
          </div>
          <span>{t("progress.topicsCount", { mastered: masteredCount, total: allTopics.length })}</span>
        </div>
        <div className="topic-progress-list">
          {allTopics.map((topic) => {
            const mastery = learner.mastery[topic.id]
            const retention = Math.round(mastery.retention * 100)
            const supported = Math.round(mastery.supportedMastery * 100)
            const independent = Math.round(mastery.independentMastery * 100)
            const hasLearningEvidence = mastery.status === "mastered" || mastery.status === "learning"
            const statusLabel = mastery.status === "mastered"
              ? t("concept.status.mastered")
              : mastery.status === "locked"
                ? t("progress.status.locked")
                : mastery.status === "learning"
                  ? t("concept.status.learning")
                  : t("concept.status.available")
            return (
              <article className={`topic-progress-row ${mastery.status}`} key={topic.id}>
                <div className="topic-progress-number" aria-hidden="true">
                  {mastery.status === "mastered" ? "✓" : topic.courseOrder}
                </div>
                <div className="topic-progress-copy">
                  <div>
                    <h3>{topic.shortTitle}</h3>
                    <span className={`curriculum-status ${mastery.status}`}>{statusLabel}</span>
                  </div>
                  {hasLearningEvidence ? (
                    <>
                      <div className="mastery-evidence">
                        <div className="mastery-evidence-row supported">
                          <span>{t("progress.supported")}</span>
                          <div
                            className="retention-meter"
                            role="progressbar"
                            aria-label={t("progress.supportedAria", { topic: topic.shortTitle, value: supported })}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={supported}
                          >
                            <span style={{ width: `${supported}%` }} />
                          </div>
                          <strong>{supported}%</strong>
                        </div>
                        <div className="mastery-evidence-row independent">
                          <span>{t("progress.independentShort")}</span>
                          <div
                            className="retention-meter"
                            role="progressbar"
                            aria-label={t("progress.independentAria", { topic: topic.shortTitle, value: independent })}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={independent}
                          >
                            <span style={{ width: `${independent}%` }} />
                          </div>
                          <strong>{independent}%</strong>
                        </div>
                        {mastery.status === "mastered" && (
                          <div className="mastery-evidence-row retention">
                            <span>{t("progress.retained")}</span>
                            <div
                              className="retention-meter"
                              role="progressbar"
                              aria-label={t("progress.retainedAria", { topic: topic.shortTitle, value: retention })}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={retention}
                            >
                              <span style={{ width: `${retention}%` }} />
                            </div>
                            <strong>{retention}%</strong>
                          </div>
                        )}
                      </div>
                      <small>
                        {mastery.status === "mastered"
                          ? t("progress.confirmed", { count: mastery.independentSuccesses })
                          : t("progress.secureNext")}
                      </small>
                    </>
                  ) : (
                    <p>{mastery.status === "locked" ? t("progress.lockedBody") : t("progress.availableBody")}</p>
                  )}
                </div>
                <div className="topic-progress-next">
                  {mastery.status === "mastered" ? (
                    <><span>{t("progress.nextReview")}</span><strong>{formatReviewDate(mastery.dueAt, locale)}</strong></>
                  ) : mastery.status === "learning" ? (
                    <><span>{t("progress.nextStep")}</span><strong>{t("progress.recovery")}</strong></>
                  ) : mastery.status === "available" ? (
                    <><span>{t("progress.nextStep")}</span><strong>{t("progress.lesson")}</strong></>
                  ) : (
                    <><span>{t("progress.prerequisites")}</span><strong>{t("progress.stillLocked")}</strong></>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="progress-panel recent-panel">
        <div className="progress-panel-heading">
          <div>
            <span className="eyebrow">{t("progress.historyEyebrow")}</span>
            <h2>{t("progress.historyTitle")}</h2>
          </div>
          <span>{t("progress.historyTiming")}</span>
        </div>
        {recentEvents.length === 0 ? (
          <div className="recent-empty">
            <span aria-hidden="true">◎</span>
            <div><strong>{t("progress.historyEmpty")}</strong><p>{t("progress.historyEmptyBody")}</p></div>
          </div>
        ) : (
          <div className="recent-list">
            {recentEvents.map((event) => {
              const independent = event.questionResults.filter(
                (result) => result.independentlySolved,
              ).length
              return (
                <article key={event.id}>
                  <span className={`recent-kind ${event.taskKind}`} aria-hidden="true">{kindIcons[event.taskKind]}</span>
                  <div className="recent-copy">
                    <span>
                      {event.taskPurpose === "lesson-recovery" ? appCopy(locale).player.recovery : appCopy(locale).player.taskKinds[event.taskKind]} · {formatSessionDate(event.completedAt, locale)}
                    </span>
                    <strong>{event.topicIds.map((topicId) => topicForLocale(topicId, locale).shortTitle).join(" · ")}</strong>
                  </div>
                  <div className="recent-evidence">
                    <strong>{independent}/{event.questionResults.length}</strong>
                    <span>{t("progress.independentShort").toLocaleLowerCase(intlLocale)}</span>
                  </div>
                  <div className="recent-time">
                    <strong>{formatMinutes(event.activeSeconds)}</strong>
                    <span>{t("progress.active")}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {onRestore && (
        <DataBackupPanel
          learner={learner}
          activeSession={activeSession}
          activeMock={activeMock}
          activeArchivePractice={activeArchivePractice}
          germanCourse={germanCourse}
          germanSourcePractice={germanSourcePractice}
          courseIndex={courseIndex}
          onRestore={onRestore}
        />
      )}
    </main>
  )
}

function parentMockDate(value: string, locale = "de-CH"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

const parentCoachingPanelCopy = {
  de: {
    eyebrow: "VON DER LERNENDEN PERSON PAUSIERT",
    title: "Erst gemeinsam erklären, dann wieder freigeben.",
    singular: "Thema",
    plural: "Themen",
    intro: "Solange ein Thema hier steht, erzeugt der normale Lernplan dafür keine Lektion, Wiederholung, Auffrischung oder Standortbestimmungsfrage. XP und bisherige Lernbelege bleiben unverändert.",
    languageLabel: "Sprache der gemeinsamen Erklärung",
    languageHint: "Nur dieser Begleitfaden wechselt mit dieser Auswahl die Sprache. Die Sprache der Lernaufgaben wird separat in den Einstellungen gewählt.",
    requestedAt: "Gemeldet am",
    summaryTitle: "Erklärung gemeinsam vorbereiten",
    summarySubtitle: "Ziel, Beispiel und kurze Rückfrage",
    goalEyebrow: "LERNZIEL",
    goalTitle: "Worum es heute geht",
    ideaEyebrow: "IN EIGENEN WORTEN",
    stepsEyebrow: "GEMEINSAM DURCHGEHEN",
    stepsTitle: "Ein Schritt nach dem anderen",
    teachBackEyebrow: "TEACH-BACK",
    teachBackTitle: "Die lernende Person erklärt zurück",
    hurdleEyebrow: "WENN ES NOCH HAKT",
    takeawayEyebrow: "MERKSATZ",
    prerequisitesEyebrow: "VORAUSSETZUNGEN, FALLS EIN SCHRITT FEHLT",
    releaseNote: "Erst freigeben, wenn die Grundidee gemeinsam besprochen wurde. Danach nimmt der adaptive Lernplan das Thema wieder mit frischen Aufgaben auf.",
    releaseButton: "Erklärt – wieder freigeben",
  },
  en: {
    eyebrow: "PAUSED BY THE LEARNER",
    title: "Explain it together before reopening the topic.",
    singular: "topic",
    plural: "topics",
    intro: "While a topic is listed here, the normal learning plan will not generate a lesson, review, refresh, or assessment question for it. Existing XP and learning evidence remain unchanged.",
    languageLabel: "Shared explanation language",
    languageHint: "Only this coaching guide changes with this choice. The language of the learner's questions is selected separately in settings.",
    requestedAt: "Requested on",
    summaryTitle: "Prepare the explanation together",
    summarySubtitle: "Goal, example, and a short teach-back",
    goalEyebrow: "LEARNING GOAL",
    goalTitle: "What this conversation is about",
    ideaEyebrow: "IN PLAIN LANGUAGE",
    stepsEyebrow: "WORK THROUGH TOGETHER",
    stepsTitle: "One step at a time",
    teachBackEyebrow: "TEACH-BACK",
    teachBackTitle: "The learner explains the idea back",
    hurdleEyebrow: "IF IT STILL FEELS STUCK",
    takeawayEyebrow: "KEY IDEA",
    prerequisitesEyebrow: "PREREQUISITES IF A STEP IS MISSING",
    releaseNote: "Reopen the topic only after discussing the central idea together. The adaptive plan will then return to it with fresh questions.",
    releaseButton: "Explained – reopen topic",
  },
  it: {
    eyebrow: "MESSO IN PAUSA DALLO STUDENTE",
    title: "Spiegatelo insieme prima di riaprire l'argomento.",
    singular: "argomento",
    plural: "argomenti",
    intro: "Finché un argomento compare qui, il piano di studio normale non genera lezioni, ripassi, recuperi o domande di verifica su di esso. Gli XP e le prove di apprendimento già raccolte non cambiano.",
    languageLabel: "Lingua della spiegazione condivisa",
    languageHint: "Questa scelta cambia soltanto la guida di accompagnamento. La lingua delle domande dello studente si sceglie separatamente nelle impostazioni.",
    requestedAt: "Segnalato il",
    summaryTitle: "Preparate insieme la spiegazione",
    summarySubtitle: "Obiettivo, esempio e una breve restituzione",
    goalEyebrow: "OBIETTIVO DI APPRENDIMENTO",
    goalTitle: "Di che cosa parliamo oggi",
    ideaEyebrow: "IN PAROLE SEMPLICI",
    stepsEyebrow: "DA SVOLGERE INSIEME",
    stepsTitle: "Un passaggio alla volta",
    teachBackEyebrow: "RESTITUZIONE",
    teachBackTitle: "Lo studente rispiega l'idea",
    hurdleEyebrow: "SE È ANCORA POCO CHIARO",
    takeawayEyebrow: "IDEA CHIAVE",
    prerequisitesEyebrow: "PREREQUISITI SE MANCA UN PASSAGGIO",
    releaseNote: "Riapri l'argomento soltanto dopo aver discusso insieme l'idea centrale. Il piano adattivo tornerà poi sull'argomento con domande nuove.",
    releaseButton: "Spiegato – riapri l'argomento",
  },
  es: {
    eyebrow: "PAUSADO POR EL ESTUDIANTE",
    title: "Explíquenlo juntos antes de reabrir el tema.",
    singular: "tema",
    plural: "temas",
    intro: "Mientras un tema aparezca aquí, el plan de aprendizaje normal no generará lecciones, repasos, refuerzos ni preguntas de evaluación sobre él. Los XP y las evidencias de aprendizaje ya obtenidas no cambian.",
    languageLabel: "Idioma de la explicación compartida",
    languageHint: "Esta elección solo cambia la guía de acompañamiento. El idioma de las preguntas del estudiante se elige por separado en los ajustes.",
    requestedAt: "Marcado el",
    summaryTitle: "Preparen juntos la explicación",
    summarySubtitle: "Objetivo, ejemplo y una breve explicación de vuelta",
    goalEyebrow: "OBJETIVO DE APRENDIZAJE",
    goalTitle: "De qué trata la conversación de hoy",
    ideaEyebrow: "EN PALABRAS SENCILLAS",
    stepsEyebrow: "RESOLVER JUNTOS",
    stepsTitle: "Paso a paso",
    teachBackEyebrow: "EXPLICACIÓN DE VUELTA",
    teachBackTitle: "El estudiante vuelve a explicar la idea",
    hurdleEyebrow: "SI TODAVÍA NO ESTÁ CLARO",
    takeawayEyebrow: "IDEA CLAVE",
    prerequisitesEyebrow: "PRERREQUISITOS SI FALTA UN PASO",
    releaseNote: "Reabre el tema solo después de comentar juntos la idea central. El plan adaptativo volverá después con preguntas nuevas.",
    releaseButton: "Explicado – reabrir el tema",
  },
} satisfies Record<ParentExplanationLanguage, Record<string, string>>

function pilotWeekLabel(
  startDateKey: string,
  endDateKey: string,
  locale: AppLocale = "de",
): string {
  const formatter = new Intl.DateTimeFormat(intlLocaleFor(locale), {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
  return `${formatter.format(new Date(`${startDateKey}T12:00:00.000Z`))}–${formatter.format(new Date(`${endDateKey}T12:00:00.000Z`))}`
}

function pilotAssessmentComparisonCopy(
  status: "insufficient" | "higher" | "lower" | "same",
  changePoints?: number,
  locale: AppLocale = "de",
): string {
  if (locale === "en") {
    if (status === "insufficient") {
      return "An observed comparison needs two completed assessments."
    }
    if (status === "same") {
      return "The independent share is the same in the first and latest assessment. That is an observation, not evidence of impact."
    }
    const distance = Math.abs(changePoints ?? 0)
    return status === "higher"
      ? `The latest independent share is ${distance} percentage points higher. That is a comparison, not evidence of impact.`
      : `The latest independent share is ${distance} percentage points lower. The questions differed, so no cause is inferred.`
  }
  if (locale === "it") {
    if (status === "insufficient") {
      return "Per un confronto osservato servono due verifiche completate."
    }
    if (status === "same") {
      return "La quota autonoma è uguale nella prima e nell'ultima verifica. È un'osservazione, non una prova di efficacia."
    }
    const distance = Math.abs(changePoints ?? 0)
    return status === "higher"
      ? `La quota autonoma più recente è superiore di ${distance} punti percentuali. È un confronto, non una prova di efficacia.`
      : `La quota autonoma più recente è inferiore di ${distance} punti percentuali. Le domande erano diverse, quindi non viene dedotta alcuna causa.`
  }
  if (locale === "es") {
    if (status === "insufficient") {
      return "Para una comparación observada hacen falta dos evaluaciones completadas."
    }
    if (status === "same") {
      return "La proporción resuelta de forma autónoma es igual en la primera y en la última evaluación. Es una observación, no una prueba de eficacia."
    }
    const distance = Math.abs(changePoints ?? 0)
    return status === "higher"
      ? `La proporción autónoma más reciente es ${distance} puntos porcentuales mayor. Es una comparación, no una prueba de eficacia.`
      : `La proporción autónoma más reciente es ${distance} puntos porcentuales menor. Las preguntas eran distintas, así que no se deduce ninguna causa.`
  }
  if (status === "insufficient") {
    return "Für einen beobachteten Vergleich braucht es zwei abgeschlossene Standortbestimmungen."
  }
  if (status === "same") {
    return "Der selbständige Anteil ist im ersten und jüngsten Check gleich. Das ist eine Beobachtung, noch kein Wirksamkeitsnachweis."
  }
  const distance = Math.abs(changePoints ?? 0)
  return status === "higher"
    ? `Der jüngste selbständige Anteil liegt ${distance} Prozentpunkte höher. Das ist ein Vergleich, noch kein Wirksamkeitsnachweis.`
    : `Der jüngste selbständige Anteil liegt ${distance} Prozentpunkte tiefer. Die Aufgaben waren verschieden; daraus wird keine Ursache abgeleitet.`
}

function authorValidationSequenceLabel(
  sequence: number,
  locale: AppLocale = "de",
): string {
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    minimumIntegerDigits: 2,
  }).format(sequence)
}

function AuthorValidationLearnerPreview({
  sample,
  onBack,
  onSelectPrerequisite,
}: {
  sample: AuthorValidationSample
  onBack: () => void
  onSelectPrerequisite: (topicId: TopicId) => void
}) {
  const { locale } = useLocalization()
  const ui = authorValidationCopy(locale).learner
  const [completed, setCompleted] = useState(false)
  const initialSession = useMemo(
    () => createActiveLearningSession(sample.task),
    [sample.task],
  )

  if (completed) {
    return (
      <main className="author-validation-shell">
        <nav className="author-validation-nav" aria-label={ui.navAria}>
          <button className="curriculum-back" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span>
            {ui.back}
          </button>
        </nav>
        <section className="author-validation-interaction-complete" role="status">
          <span className="eyebrow">{ui.eyebrow}</span>
          <h1>{ui.title}</h1>
          <p>{ui.body}</p>
          <div>
            <button className="secondary-button" type="button" onClick={() => setCompleted(false)}>
              {ui.again}
            </button>
            <button className="primary-button" type="button" onClick={onBack}>
              {ui.authorView}
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <TaskPlayer
      key={sample.task.id}
      initialSession={initialSession}
      backLabel={ui.back}
      onBack={onBack}
      onFinish={() => setCompleted(true)}
      onPrerequisite={onSelectPrerequisite}
      onSessionChange={() => undefined}
      helpStyle="visual"
    />
  )
}

export function AuthorValidationView({
  onBack,
  onLock,
}: {
  onBack: () => void
  onLock: () => void
}) {
  const { intlLocale, locale } = useLocalization()
  const ui = authorValidationCopy(locale)
  const formatNumber = (value: number) => new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 2,
  }).format(value)
  const topicList = useMemo(() => activeCurriculumTopics, [])
  const selections = useMemo(() => authorValidationSelections(), [])
  const packageAudit = useMemo(() => validateCurriculumPackageRuntime(
    ACTIVE_CURRICULUM_PACKAGE,
    { includeGeneratorSamples: false },
  ), [])
  const [topicId, setTopicId] = useState<TopicId>(topicList[0]!.id)
  const [difficultyBand, setDifficultyBand] = useState<DifficultyBand>("standard")
  const [sequence, setSequence] = useState(1)
  const [checked, setChecked] = useState<Set<AuthorValidationKey>>(() => new Set())
  const [checkedTemplates, setCheckedTemplates] = useState<Set<AuthorValidationTemplateKey>>(() => new Set())
  const [previewMode, setPreviewMode] = useState<"author" | "learner">("author")
  const sample = useMemo(
    () => buildAuthorValidationSample(
      topicId,
      difficultyBand,
      sequence,
      ACTIVE_CURRICULUM_PACKAGE,
      locale,
    ),
    [difficultyBand, locale, sequence, topicId],
  )
  const reportUrl = useMemo(() => buildExerciseReportUrl(
    createExerciseReportReference(sample.task, sample.question, 0),
    window.location.origin,
  ), [sample])
  const currentTopicIndex = topicList.findIndex((topic) => topic.id === topicId)
  const currentKey = authorValidationKey(topicId, difficultyBand)
  const currentChecked = checked.has(currentKey)
  const currentTemplateKey = sample.question.provenance
    ? authorValidationTemplateKey(
        sample.question.provenance.familyId,
        sample.question.provenance.templateId,
      )
    : undefined
  const currentTemplateChecked = currentTemplateKey ? checkedTemplates.has(currentTemplateKey) : false
  const coverageChecked = checked.size + checkedTemplates.size
  const coverageTotal = selections.length + authorValidationArchiveTemplates.length
  const coveragePercent = Math.round((coverageChecked / coverageTotal) * 100)

  const select = (selection: AuthorValidationSelection) => {
    setTopicId(selection.topicId)
    setDifficultyBand(selection.difficultyBand)
    setSequence(1)
  }

  const selectTopic = (nextTopicId: TopicId) => {
    setTopicId(nextTopicId)
    setSequence(1)
  }

  const moveTopic = (offset: number) => {
    const nextIndex = (currentTopicIndex + offset + topicList.length) % topicList.length
    selectTopic(topicList[nextIndex]!.id)
  }

  const toggleChecked = () => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(currentKey)) next.delete(currentKey)
      else next.add(currentKey)
      return next
    })
  }

  const toggleTemplateChecked = () => {
    if (!currentTemplateKey) return
    setCheckedTemplates((current) => {
      const next = new Set(current)
      if (next.has(currentTemplateKey)) next.delete(currentTemplateKey)
      else next.add(currentTemplateKey)
      return next
    })
  }

  const openNextUnchecked = () => {
    select(nextUncheckedAuthorValidationSelection({ topicId, difficultyBand }, checked))
  }

  if (previewMode === "learner") {
    return (
      <AuthorValidationLearnerPreview
        sample={sample}
        onBack={() => setPreviewMode("author")}
        onSelectPrerequisite={(nextTopicId) => {
          selectTopic(nextTopicId)
          setPreviewMode("author")
        }}
      />
    )
  }

  return (
    <main className="author-validation-shell">
      <nav className="author-validation-nav" aria-label={ui.navAria}>
        <button className="curriculum-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          {ui.back}
        </button>
        <button className="text-button" type="button" onClick={onLock}>{ui.lock}</button>
      </nav>

      <section className="author-validation-hero">
        <div>
          <span className="eyebrow">{ui.eyebrow}</span>
          <h1>{ui.title}</h1>
          <p>{ui.body}</p>
        </div>
        <div className="author-validation-coverage" aria-label={ui.coverageAria(coverageChecked, coverageTotal)}>
          <span>{ui.sessionCheck}</span>
          <strong>{coverageChecked}<small> / {coverageTotal}</small></strong>
          <div className="meter" aria-hidden="true"><span style={{ width: `${coveragePercent}%` }} /></div>
          <small>{ui.coverageBoundary}</small>
        </div>
      </section>

      <section
        className={`author-package-contract ${packageAudit.valid ? "valid" : "invalid"}`}
        aria-labelledby="author-package-contract-title"
      >
        <div>
          <span className="eyebrow">{ui.packageEyebrow}</span>
          <h2 id="author-package-contract-title">
            {ACTIVE_CURRICULUM_PACKAGE.title} · {ui.packageVersion(ACTIVE_CURRICULUM_PACKAGE.version)}
          </h2>
          <p>
            {packageAudit.valid
              ? ui.packageValid
              : ui.packageInvalid(packageAudit.issues.length)}
          </p>
          {!packageAudit.valid && (
            <ul>
              {packageAudit.issues.slice(0, 4).map((issue) => (
                <li key={`${issue.area}:${issue.code}:${issue.topicId ?? "package"}`}>{issue.message}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="author-package-contract-facts">
          <div><strong>{packageAudit.topicCount}</strong><span>{ui.topicsInPackage}</span></div>
          <div><strong>{packageAudit.expectedGeneratorCells}</strong><span>{ui.generatorCells}</span></div>
          <div className="author-package-contract-status"><strong>{packageAudit.valid ? "✓" : "!"}</strong><span>{packageAudit.valid ? ui.structureComplete : ui.packageBlocked}</span></div>
        </div>
      </section>

      <div className="author-validation-layout">
        <aside className="author-validation-controls">
          <div className="author-validation-control-heading">
            <span aria-hidden="true">⌘</span>
            <div><small>{ui.coverage}</small><strong>{ui.coverageTitle}</strong></div>
          </div>

          <label htmlFor="author-validation-topic">
            {ui.topicPosition(currentTopicIndex + 1, topicList.length)}
            <select
              id="author-validation-topic"
              value={topicId}
              onChange={(event) => selectTopic(event.target.value as TopicId)}
            >
              {topicList.map((topic) => <option value={topic.id} key={topic.id}>{topic.courseOrder}. {topicForLocale(topic.id, locale).shortTitle}</option>)}
            </select>
          </label>

          <div className="author-validation-topic-nav">
            <button type="button" onClick={() => moveTopic(-1)} aria-label={ui.previousTopic}>←</button>
            <span>{topicForLocale(topicId, locale).shortTitle}</span>
            <button type="button" onClick={() => moveTopic(1)} aria-label={ui.nextTopic}>→</button>
          </div>

          <fieldset className="author-validation-bands">
            <legend>{ui.difficulty}</legend>
            {difficultyBandIds.map((band) => (
              <button
                className={difficultyBand === band ? `active ${band}` : band}
                type="button"
                aria-pressed={difficultyBand === band}
                onClick={() => {
                  setDifficultyBand(band)
                  setSequence(1)
                }}
                key={band}
              >
                {appCopy(locale).player.difficultyBands[band]}
              </button>
            ))}
          </fieldset>

          <section className="author-validation-seed">
            <div><small>{ui.variant}</small><strong>#{authorValidationSequenceLabel(sequence, locale)}</strong></div>
            <button className="secondary-button" type="button" onClick={() => setSequence((current) => current + 1)}>
              {ui.newVariant}
            </button>
            <code>{sample.task.seed}</code>
          </section>

          <section className="author-validation-template-coverage" aria-label={ui.archiveTemplates}>
            <header>
              <small>{ui.archiveTemplates}</small>
              <strong>{checkedTemplates.size} / {authorValidationArchiveTemplates.length}</strong>
            </header>
            <ul>
              {authorValidationArchiveTemplates.map((template) => {
                const isChecked = checkedTemplates.has(template.key)
                const isCurrent = currentTemplateKey === template.key
                return (
                  <li className={`${isChecked ? "checked" : ""}${isCurrent ? " current" : ""}`} key={template.key}>
                    <span aria-hidden="true">{isChecked ? "✓" : "○"}</span>
                    <code>{template.templateId}</code>
                  </li>
                )
              })}
            </ul>
            {currentTemplateKey
              ? (
                  <button className="secondary-button" type="button" aria-pressed={currentTemplateChecked} onClick={toggleTemplateChecked}>
                    {currentTemplateChecked ? ui.archiveTemplateChecked : ui.markArchiveTemplate}
                  </button>
                )
              : <p>{ui.archiveTemplateNone}</p>}
          </section>

          <button
            className="secondary-button author-validation-learner-open"
            type="button"
            onClick={() => setPreviewMode("learner")}
          >
            {ui.learnerView}
          </button>
          <p className="author-validation-learner-note">
            {ui.learnerViewBody}
          </p>

          <button
            className={currentChecked ? "author-validation-check checked" : "author-validation-check"}
            type="button"
            aria-pressed={currentChecked}
            onClick={toggleChecked}
          >
            <span aria-hidden="true">{currentChecked ? "✓" : "○"}</span>
            {currentChecked ? ui.checked : ui.markChecked}
          </button>
          <button className="text-button author-validation-next" type="button" onClick={openNextUnchecked} disabled={checked.size === selections.length}>
            {ui.nextUnchecked}
          </button>
        </aside>

        <article className="author-validation-preview">
          <header>
            <div>
              <span className="eyebrow">{ui.productionGenerator(sample.question.generation?.version)}</span>
              <h2>{topicForLocale(topicId, locale).title}</h2>
            </div>
            <div className="author-validation-meta" aria-label={ui.metadataAria}>
              <span className={`difficulty-pill ${difficultyBand}`}>{appCopy(locale).player.difficultyBands[difficultyBand]}</span>
              <span>{ui.candidates(sample.question.generation?.candidateCount)}</span>
              <span>{ui.structureScore(sample.question.generation?.difficultyScore)}</span>
            </div>
          </header>

          <section className="author-validation-question" aria-labelledby="author-validation-question-title">
            <small>{ui.dynamicQuestion}</small>
            <h3 id="author-validation-question-title">{sample.question.prompt}</h3>
            <QuestionVisual question={sample.question} />
          </section>

          <section className="author-validation-answer">
            <div>
              <small>{ui.canonicalAnswer}</small>
              <strong>{sample.expectedAnswer}</strong>
              <span>{sample.question.answerLabel}</span>
            </div>
            <div>
              <small>{ui.explanation}</small>
              <p>{sample.question.explanation}</p>
            </div>
          </section>

          <div className="author-validation-guidance">
            <section>
              <small>{ui.firstHint}</small>
              <p>{sample.question.hint}</p>
            </section>
            <section>
              <small>{ui.easier}</small>
              <p>{sample.question.easierExplanation}</p>
            </section>
          </div>

          <details className="author-validation-worked" open>
            <summary>{ui.fullSolution}</summary>
            <ol>{sample.question.workedSteps.map((step, index) => <li key={`${sample.question.id}:step:${index}`}>{step}</li>)}</ol>
            {sample.question.practiceSteps && (
              <div>
                <small>{ui.structuredSteps}</small>
                <ul>
                  {sample.question.practiceSteps.map((step) => (
                    <li key={step.id}><strong>{step.label}:</strong> {step.instruction} → {formatNumber(step.value)}{step.unit ? ` ${step.unit}` : ""}</li>
                  ))}
                </ul>
              </div>
            )}
          </details>

          <footer>
            <p>
              <strong>{ui.issueTitle}</strong>
              {ui.issueBody}
            </p>
            <a className="secondary-button" href={reportUrl} target="_blank" rel="noopener noreferrer">
              {ui.report} <span aria-hidden="true">↗</span>
            </a>
          </footer>
        </article>
      </div>
    </main>
  )
}

type ReleaseReadinessDownload = (markdown: string, filename: string) => void

function downloadReleaseReadiness(markdown: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.hidden = true
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function captureReleaseRuntimeEvidence(
  now = new Date(),
): ReleaseRuntimeEvidence {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean }
  const displayModeStandalone = typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches

  return {
    capturedAt: now.toISOString(),
    buildId: import.meta.env.VITE_GYMIQUEST_BUILD_ID?.trim() || "unversioned-development-build",
    location: window.location.href,
    standalone: displayModeStandalone || standaloneNavigator.standalone === true,
    serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller),
    online: navigator.onLine,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    userAgent: navigator.userAgent,
  }
}

function formatReadinessTimestamp(
  value: string,
  locale: AppLocale = "de",
): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function ReleaseReadinessView({
  record,
  onChange,
  onBack,
  onLock,
  now = new Date(),
  download = downloadReleaseReadiness,
}: {
  record: ReleaseReadinessRecord
  onChange: (record: ReleaseReadinessRecord) => void
  onBack: () => void
  onLock: () => void
  now?: Date
  download?: ReleaseReadinessDownload
}) {
  const { locale } = useLocalization()
  const ui = releaseReadinessCopy(locale)
  const localizedSections = releaseReadinessSectionsForLocale(locale)
  const [runtime, setRuntime] = useState<ReleaseRuntimeEvidence>(() => (
    captureReleaseRuntimeEvidence(now)
  ))
  const [status, setStatus] = useState<"downloaded">()
  const [confirmReset, setConfirmReset] = useState(false)
  const progress = releaseReadinessProgress(record)
  const percentage = Math.round((progress.completed / progress.total) * 100)
  const traceableBuild = isTraceableReleaseBuild(runtime.buildId)

  const exportProtocol = () => {
    download(
      buildReleaseReadinessMarkdownForLocale(record, runtime, locale),
      releaseReadinessFilenameForLocale(new Date(runtime.capturedAt), locale),
    )
    setStatus("downloaded")
  }

  return (
    <main className="release-readiness-shell">
      <nav className="author-validation-nav" aria-label={ui.navAria}>
        <button className="curriculum-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          {ui.back}
        </button>
        <button className="text-button" type="button" onClick={onLock}>{ui.lock}</button>
      </nav>

      <section className="release-readiness-hero">
        <div>
          <span className="eyebrow">{ui.eyebrow}</span>
          <h1>{ui.title}</h1>
          <p>{ui.body}</p>
        </div>
        <div
          className="release-readiness-meter"
          aria-label={ui.meterAria(progress.completed, progress.total)}
        >
          <span>{ui.recorded}</span>
          <strong>{progress.completed}<small> / {progress.total}</small></strong>
          <div className="meter" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
          <small>{ui.sectionsComplete(progress.sectionsComplete, progress.sectionTotal)}</small>
        </div>
      </section>

      <aside className="release-readiness-boundary" role="note">
        <span aria-hidden="true">!</span>
        <p>
          <strong>{ui.boundaryTitle}</strong>
          <small>{ui.boundaryBody}</small>
        </p>
      </aside>

      <section className="release-runtime-panel" aria-labelledby="release-runtime-title">
        <header>
          <div>
            <span className="eyebrow">{ui.runtimeEyebrow}</span>
            <h2 id="release-runtime-title">{ui.runtimeTitle}</h2>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setRuntime(captureReleaseRuntimeEvidence())
              setStatus(undefined)
            }}
          >
            {ui.recapture}
          </button>
        </header>
        <div className="release-runtime-grid">
          <div className={`release-runtime-build ${traceableBuild ? "confirmed" : "open"}`}>
            <span>Build</span>
            <strong title={runtime.buildId}>{runtime.buildId}</strong>
          </div>
          <div className={runtime.standalone ? "confirmed" : "open"}>
            <span>{ui.appWindow}</span>
            <strong>{runtime.standalone ? ui.standalone : ui.safariTab}</strong>
          </div>
          <div className={runtime.serviceWorkerControlled ? "confirmed" : "open"}>
            <span>{ui.offlineShell}</span>
            <strong>{runtime.serviceWorkerControlled ? ui.serviceWorkerActive : ui.notControlled}</strong>
          </div>
          <div className={runtime.online ? "open" : "confirmed"}>
            <span>{ui.network}</span>
            <strong>{runtime.online ? ui.online : ui.offline}</strong>
          </div>
          <div>
            <span>Viewport</span>
            <strong>{runtime.viewport}</strong>
          </div>
        </div>
        <small>
          {ui.capturedAt(formatReadinessTimestamp(runtime.capturedAt, locale))}{ui.runtimeBoundary}
          {!traceableBuild && ui.untraceable}
        </small>
      </section>

      <div className="release-readiness-sections">
        {localizedSections.map((section, sectionIndex) => {
          const completeCount = section.checks.filter((check) => (
            Boolean(record.completedAtByCheck[check.id])
          )).length
          const sectionComplete = completeCount === section.checks.length

          return (
            <details
              className={sectionComplete ? "release-gate-section complete" : "release-gate-section"}
              open={sectionIndex === 0}
              key={section.id}
            >
              <summary>
                <span className="release-gate-index" aria-hidden="true">{sectionComplete ? "✓" : sectionIndex + 1}</span>
                <span>
                  <small>{section.eyebrow}</small>
                  <strong>{section.title}</strong>
                </span>
                <span className="release-gate-count">{completeCount}/{section.checks.length}</span>
                <span className="release-gate-chevron" aria-hidden="true">⌄</span>
              </summary>
              <div className="release-gate-body">
                <p>{section.summary}</p>
                <aside><strong>{ui.role}</strong><span>{section.reviewer}</span></aside>
                <div className="release-check-list">
                  {section.checks.map((check) => {
                    const completedAt = record.completedAtByCheck[check.id]
                    return (
                      <label className={completedAt ? "release-check checked" : "release-check"} key={check.id}>
                        <input
                          type="checkbox"
                          checked={Boolean(completedAt)}
                          data-release-check={check.id}
                          onChange={(event) => {
                            onChange(setReleaseReadinessCheck(
                              record,
                              check.id,
                              event.currentTarget.checked,
                              new Date(),
                              runtime.buildId,
                            ))
                            setStatus(undefined)
                          }}
                        />
                        <span aria-hidden="true">{completedAt ? "✓" : ""}</span>
                        <p>
                          <strong>{check.label}</strong>
                          {completedAt && (
                            <small>
                              {ui.locallyRecorded}: {formatReadinessTimestamp(completedAt, locale)} · Build: {record.buildIdByCheck[check.id] ?? ui.notRecorded}
                            </small>
                          )}
                        </p>
                      </label>
                    )
                  })}
                </div>
              </div>
            </details>
          )
        })}
      </div>

      <section className="release-readiness-export" aria-labelledby="release-export-title">
        <div>
          <span className="eyebrow">{ui.exportEyebrow}</span>
          <h2 id="release-export-title">{ui.exportTitle}</h2>
          <p>{ui.exportBody}</p>
        </div>
        <button className="primary-button" type="button" onClick={exportProtocol}>
          {ui.download}
        </button>
        {status === "downloaded" && (
          <p className="release-export-status" role="status">{ui.downloaded}</p>
        )}
      </section>

      <section className="release-readiness-reset">
        {confirmReset ? (
          <div className="reset-confirmation" role="alert">
            <p>
              <strong>{ui.resetTitle}</strong>
              <span>{ui.resetBody}</span>
            </p>
            <div>
              <button className="text-button" type="button" onClick={() => setConfirmReset(false)}>{ui.cancel}</button>
              <button
                className="danger-button"
                type="button"
                onClick={() => {
                  onChange(createReleaseReadinessRecord())
                  setConfirmReset(false)
                  setStatus(undefined)
                }}
              >
                {ui.clear}
              </button>
            </div>
          </div>
        ) : (
          <button className="text-button" type="button" onClick={() => setConfirmReset(true)}>
            {ui.reset}
          </button>
        )}
      </section>
    </main>
  )
}

export function ParentDashboardView({
  learner,
  germanCourse,
  onLock,
  onResolveTeacherSupport,
  onResolveGermanTopicSupport,
  onSaveGermanComprehensionReview,
  onSaveGermanWritingReview,
  onOpenAuthorValidation,
  onOpenReleaseReadiness,
  explanationLanguage = "de",
  onExplanationLanguageChange,
  now = new Date(),
}: {
  learner: LearnerState
  germanCourse?: GermanCourseState
  onLock: () => void
  onResolveTeacherSupport?: (topicId: TopicId) => void
  onResolveGermanTopicSupport?: (topicId: GermanTopicId) => void
  onSaveGermanComprehensionReview?: (
    resultId: string,
    status: GermanComprehensionEvidenceStatus,
    strength: string,
    nextStep: string,
  ) => void
  onSaveGermanWritingReview?: (resultId: string, strength: string, nextStep: string) => void
  onOpenAuthorValidation?: () => void
  onOpenReleaseReadiness?: () => void
  explanationLanguage?: ParentExplanationLanguage
  onExplanationLanguageChange?: (language: ParentExplanationLanguage) => void | Promise<void>
  now?: Date
}) {
  const { locale, intlLocale } = useLocalization()
  const ui = parentAreaCopy(locale).dashboard
  const summary = buildParentDashboard(
    learner,
    now,
    "Europe/Zurich",
    explanationLanguage,
    locale,
  )
  const coachingCopy = parentCoachingPanelCopy[explanationLanguage]
  const germanHelpRequests = germanCourse
    ? germanTopicIds.filter((topicId) => Boolean(germanCourse.topicProgress[topicId].helpRequestedAt))
    : []
  const germanHelpUi = {
    de: {
      eyebrow: "DEUTSCH · ERKLÄRUNG GEWÜNSCHT",
      title: "Diese Deutschthemen warten auf euch.",
      intro: "Bis ihr das Thema gemeinsam erklärt und wieder öffnet, erzeugt der Deutsch-Lernplan daraus keine weiteren Aufgaben.",
      requested: "Gemeldet",
      open: "Erklärung vorbereiten",
      release: "Erklärt – wieder freigeben",
      goal: "Worum es geht",
      teachBack: "Zurückerklären",
      readingPrompt: "Die lernende Person zeigt im Text, welche Wörter den Beleg tragen.",
      vocabularyPrompt: "Die lernende Person ersetzt das Zielwort im ganzen Satz und begründet, warum nur diese Bedeutung passt.",
      wordFormationPrompt: "Die lernende Person markiert den Wortstamm und nennt die verlangte Wortart vor der Bildung.",
      grammarPrompt: "Die lernende Person nennt zuerst die Regel und verändert danach genau eine Stelle.",
      sentencePrompt: "Die lernende Person findet zuerst das konjugierte Verb und bestimmt danach die übrigen Satzglieder.",
    },
    en: {
      eyebrow: "GERMAN · EXPLANATION REQUESTED",
      title: "These German skills are waiting for you.",
      intro: "The German plan generates no more tasks from a paused skill until you explain and reopen it together.",
      requested: "Requested",
      open: "Prepare explanation",
      release: "Explained – reopen",
      goal: "What to focus on",
      teachBack: "Teach it back",
      readingPrompt: "The learner points to the exact words in the text that support the answer.",
      vocabularyPrompt: "The learner replaces the target word in the full German sentence and explains why only that meaning fits.",
      wordFormationPrompt: "The learner marks the word stem and names the required word class before forming the answer.",
      grammarPrompt: "The learner states the rule first, then changes exactly one part of the sentence.",
      sentencePrompt: "The learner finds the conjugated verb first, then identifies the remaining sentence constituents.",
    },
    it: {
      eyebrow: "TEDESCO · SPIEGAZIONE RICHIESTA",
      title: "Questi argomenti di tedesco vi aspettano.",
      intro: "Il piano non genera altri esercizi finché non spiegate e riaprite insieme l'argomento.",
      requested: "Segnalato",
      open: "Prepara la spiegazione",
      release: "Spiegato – riapri",
      goal: "Su cosa concentrarsi",
      teachBack: "Spiegalo a parole tue",
      readingPrompt: "Lo studente indica le parole esatte del testo che sostengono la risposta.",
      vocabularyPrompt: "Lo studente sostituisce la parola nell'intera frase tedesca e spiega perché quel significato è l'unico adatto.",
      wordFormationPrompt: "Lo studente segna la radice e indica la categoria grammaticale richiesta prima di formare la parola.",
      grammarPrompt: "Lo studente enuncia prima la regola, poi modifica un solo punto della frase.",
      sentencePrompt: "Lo studente trova prima il verbo coniugato e poi identifica gli altri costituenti della frase.",
    },
    es: {
      eyebrow: "ALEMÁN · EXPLICACIÓN SOLICITADA",
      title: "Estos temas de alemán os esperan.",
      intro: "El plan no genera más tareas hasta que expliquéis y reabráis juntos el tema.",
      requested: "Solicitado",
      open: "Preparar explicación",
      release: "Explicado – reabrir",
      goal: "En qué centrarse",
      teachBack: "Explícalo con tus palabras",
      readingPrompt: "El alumno señala las palabras exactas del texto que justifican la respuesta.",
      vocabularyPrompt: "El alumno sustituye la palabra en toda la frase alemana y explica por qué solo encaja ese significado.",
      wordFormationPrompt: "El alumno marca la raíz y nombra la categoría requerida antes de formar la palabra.",
      grammarPrompt: "El alumno dice primero la regla y después cambia una sola parte de la frase.",
      sentencePrompt: "El alumno encuentra primero el verbo conjugado y después identifica los demás constituyentes.",
    },
  }[locale]
  const germanTeachBackPrompt = (topicId: GermanTopicId): string => {
    if (topicId === "reading-evidence") return germanHelpUi.readingPrompt
    if (topicId === "vocabulary-context") return germanHelpUi.vocabularyPrompt
    if (topicId === "word-formation") return germanHelpUi.wordFormationPrompt
    if (topicId === "sentence-structure") return germanHelpUi.sentencePrompt
    return germanHelpUi.grammarPrompt
  }
  const completedForMeter = Math.min(
    summary.completedLearningSessions,
    summary.weeklyTarget,
  )
  const visiblePilotWeeks = summary.pilot.weeks.slice(-6)
  const firstPilotAssessment = summary.pilot.assessments[0]
  const latestPilotAssessment = summary.pilot.assessments.at(-1)

  return (
    <main className="parent-dashboard-shell">
      <button className="curriculum-back" type="button" onClick={onLock}>
        <span aria-hidden="true">←</span>
        {ui.back}
      </button>

      <section className="parent-dashboard-hero">
        <div>
          <span className="eyebrow">{ui.heroEyebrow}</span>
          <h1>{ui.heroTitle}</h1>
          <p>{ui.heroBody}</p>
        </div>
        <div className="parent-week-meter" aria-label={ui.meterAria(summary.completedLearningSessions, summary.weeklyTarget)}>
          <strong>{summary.completedLearningSessions}</strong>
          <span>{ui.target(summary.weeklyTarget)}</span>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${(completedForMeter / summary.weeklyTarget) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="parent-headline" aria-label={ui.headlineAria}>
        <span aria-hidden="true">◎</span>
        <div>
          <small>{ui.headlineEyebrow}</small>
          <strong>{summary.headline}</strong>
        </div>
      </section>

      {summary.topicHelpRequests.length > 0 && (
        <section className="parent-panel parent-topic-help-panel" aria-labelledby="parent-topic-help-title">
          <div className="parent-panel-heading">
            <div>
              <span className="eyebrow">{coachingCopy.eyebrow}</span>
              <h2 id="parent-topic-help-title">{coachingCopy.title}</h2>
            </div>
            <span>
              {summary.topicHelpRequests.length}{" "}
              {summary.topicHelpRequests.length === 1 ? coachingCopy.singular : coachingCopy.plural}
            </span>
          </div>
          <p className="parent-topic-help-intro">
            {coachingCopy.intro}
          </p>
          <div className="parent-coaching-language">
            <div>
              <strong>{coachingCopy.languageLabel}</strong>
              <div role="group" aria-label={coachingCopy.languageLabel}>
                {(["de", "en", "it", "es"] as const).map((language) => (
                  <button
                    className={explanationLanguage === language ? "selected" : ""}
                    type="button"
                    aria-pressed={explanationLanguage === language}
                    onClick={() => void onExplanationLanguageChange?.(language)}
                    key={language}
                  >
                    {language === "de" ? "Deutsch" : language === "it" ? "Italiano" : language === "es" ? "Español" : "English"}
                  </button>
                ))}
              </div>
            </div>
            <p>{coachingCopy.languageHint}</p>
          </div>
          <div className="parent-topic-help-list">
            {summary.topicHelpRequests.map((request) => {
              const guide = request.coachingGuide
              return (
                <article key={request.topicId}>
                  <div className="parent-topic-help-summary">
                    <small>
                      {coachingCopy.requestedAt}{" "}
                      {parentMockDate(request.requestedAt, explanationLanguage === "en" ? "en-GB" : explanationLanguage === "it" ? "it-CH" : explanationLanguage === "es" ? "es-ES" : "de-CH")}
                    </small>
                    <h3>{request.title}</h3>
                    <p>{request.description}</p>
                  </div>
                  <details className="parent-coaching-guide">
                    <summary>
                      <span>
                        <strong>{coachingCopy.summaryTitle}</strong>
                        <small>{coachingCopy.summarySubtitle}</small>
                      </span>
                      <span aria-hidden="true">⌄</span>
                    </summary>
                    <div className="parent-coaching-guide-body">
                      <div className="parent-coaching-guide-grid">
                        <section>
                          <span>1</span>
                          <div>
                            <small>{coachingCopy.goalEyebrow}</small>
                            <h4>{coachingCopy.goalTitle}</h4>
                            <p>{guide.goal}</p>
                          </div>
                        </section>
                        <section>
                          <span>2</span>
                          <div>
                            <small>{coachingCopy.ideaEyebrow}</small>
                            <h4>{guide.ideaTitle}</h4>
                            <p>{guide.idea}</p>
                          </div>
                        </section>
                        <section>
                          <span>3</span>
                          <div>
                            <small>{coachingCopy.stepsEyebrow}</small>
                            <h4>{coachingCopy.stepsTitle}</h4>
                            <ol>
                              {guide.workedSteps.map((step, index) => (
                                <li key={`${request.topicId}:coach-step:${index}`}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        </section>
                        <section>
                          <span>4</span>
                          <div>
                            <small>{coachingCopy.teachBackEyebrow}</small>
                            <h4>{coachingCopy.teachBackTitle}</h4>
                            <p>{guide.teachBackPrompt}</p>
                          </div>
                        </section>
                      </div>

                      <aside className="parent-coaching-hurdle">
                        <div>
                          <small>{coachingCopy.hurdleEyebrow}</small>
                          <strong>{guide.commonHurdle}</strong>
                          <p>{guide.nextStep}</p>
                        </div>
                        <div>
                          <small>{coachingCopy.takeawayEyebrow}</small>
                          <strong>{guide.takeaway}</strong>
                        </div>
                      </aside>

                      {guide.prerequisiteTitles.length > 0 && (
                        <div className="parent-coaching-prerequisites">
                          <small>{coachingCopy.prerequisitesEyebrow}</small>
                          <p>{guide.prerequisiteTitles.join(" · ")}</p>
                        </div>
                      )}

                      <div className="parent-coaching-release">
                        <p>{coachingCopy.releaseNote}</p>
                        {onResolveTeacherSupport && (
                          <button className="primary-button" type="button" onClick={() => onResolveTeacherSupport(request.topicId)}>
                            {coachingCopy.releaseButton}
                          </button>
                        )}
                      </div>
                    </div>
                  </details>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {germanHelpRequests.length > 0 && germanCourse && (
        <section className="parent-panel parent-topic-help-panel german-parent-help" aria-labelledby="parent-german-help-title">
          <div className="parent-panel-heading">
            <div>
              <span className="eyebrow">{germanHelpUi.eyebrow}</span>
              <h2 id="parent-german-help-title">{germanHelpUi.title}</h2>
            </div>
            <span>{germanHelpRequests.length}</span>
          </div>
          <p className="parent-topic-help-intro">{germanHelpUi.intro}</p>
          <div className="parent-topic-help-list">
            {germanHelpRequests.map((topicId) => {
              const topic = germanTopics[topicId]
              const progress = germanCourse.topicProgress[topicId]
              const guide = germanCoachingForTopic(topicId, explanationLanguage)
              return (
                <article key={`german-help:${topicId}`}>
                  <div className="parent-topic-help-summary">
                    <small>{germanHelpUi.requested} {progress.helpRequestedAt
                      ? parentMockDate(progress.helpRequestedAt, intlLocale)
                      : ""}</small>
                    <h3>{topic.title}</h3>
                    <p>{topic.description}</p>
                  </div>
                  <details className="parent-coaching-guide">
                    <summary>
                      <span><strong>{germanHelpUi.open}</strong><small>{guide.title}</small></span>
                      <span aria-hidden="true">⌄</span>
                    </summary>
                    <div className="parent-coaching-guide-body">
                      <div className="parent-coaching-guide-grid german-coaching-grid">
                        <section>
                          <span>1</span>
                          <div><small>{germanHelpUi.goal}</small><h4>{guide.title}</h4><p>{guide.guidance}</p></div>
                        </section>
                        <section>
                          <span>2</span>
                          <div>
                            <small>{germanHelpUi.teachBack}</small>
                            <h4>{topic.shortTitle}</h4>
                            <p>{germanTeachBackPrompt(topicId)}</p>
                          </div>
                        </section>
                      </div>
                      <div className="parent-coaching-release">
                        <p>{germanHelpUi.intro}</p>
                        {onResolveGermanTopicSupport && (
                          <button className="primary-button" type="button" onClick={() => onResolveGermanTopicSupport(topicId)}>
                            {germanHelpUi.release}
                          </button>
                        )}
                      </div>
                    </div>
                  </details>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {germanCourse && onSaveGermanWritingReview && (
        <GermanWritingReviewPanel
          results={germanCourse.writingHistory}
          reviews={germanCourse.writingReviews}
          revisions={germanCourse.writingRevisions}
          activeRevision={germanCourse.activeWritingRevision}
          onSave={onSaveGermanWritingReview}
        />
      )}

      {germanCourse && onSaveGermanComprehensionReview && (
        <GermanComprehensionReviewPanel
          results={germanCourse.comprehensionHistory}
          reviews={germanCourse.comprehensionReviews}
          onSave={onSaveGermanComprehensionReview}
        />
      )}

      <section className="parent-summary-grid" aria-label={ui.summaryAria}>
        <article>
          <span>{ui.activeTime}</span>
          <strong>{weeklyMinutes(summary.weekly.activeSeconds)} <small>{ui.minutesShort}</small></strong>
          <p>{ui.activeTimeBody}</p>
        </article>
        <article>
          <span>{ui.independentlySolved}</span>
          <strong>{summary.weekly.questions === 0 ? "–" : `${summary.weekly.independentRate}%`}</strong>
          <p>{ui.independentlySolvedBody(summary.weekly.independentQuestions, summary.weekly.questions)}</p>
        </article>
        <article>
          <span>{ui.dueReviews}</span>
          <strong>{summary.dueReviews}</strong>
          <p>{ui.dueReviewsBody}</p>
        </article>
        <article>
          <span>{ui.nextCheck}</span>
          <strong>{Math.min(100, Math.round((learner.xpSinceAssessment / learner.assessmentThreshold) * 100))}%</strong>
          <p>{ui.nextCheckBody(learner.xpSinceAssessment, learner.assessmentThreshold)}</p>
        </article>
      </section>

      <section className="parent-panel parent-pilot-panel" aria-labelledby="parent-pilot-title">
        <div className="parent-panel-heading">
          <div>
            <span className="eyebrow">{ui.pilotEyebrow}</span>
            <h2 id="parent-pilot-title">{ui.pilotTitle}</h2>
          </div>
          <span className={summary.pilot.calendarCoverageMet ? "complete" : "building"}>
            {Math.min(3, summary.pilot.calendarWeeks)}/3 {ui.calendarWeeks}
          </span>
        </div>

        <p className="parent-pilot-intro">{ui.pilotIntro}</p>

        <div
          className="parent-pilot-progress"
          role="img"
          aria-label={ui.pilotProgressAria(Math.min(3, summary.pilot.calendarWeeks))}
        >
          <span style={{ width: `${Math.min(100, summary.pilot.calendarWeeks / 3 * 100)}%` }} />
        </div>

        <div className="parent-pilot-facts" aria-label={ui.pilotFactsAria}>
          <article>
            <span>{ui.calendarWeeks}</span>
            <strong>{summary.pilot.calendarWeeks}</strong>
            <small>{summary.pilot.observedSpanDays === 0 ? ui.observedDaysNone : ui.observedDays(summary.pilot.observedSpanDays)}</small>
          </article>
          <article>
            <span>{ui.activeDays}</span>
            <strong>{summary.pilot.activeDays}</strong>
            <small>{summary.pilot.sessions} {summary.pilot.sessions === 1 ? ui.sessionOne : ui.sessionMany}</small>
          </article>
          <article>
            <span>{ui.independentAnswers}</span>
            <strong>{summary.pilot.questions === 0 ? "–" : `${summary.pilot.independentRate}%`}</strong>
            <small>{ui.questions(summary.pilot.independentQuestions, summary.pilot.questions)}</small>
          </article>
          <article>
            <span>{ui.assessments}</span>
            <strong>{summary.pilot.assessments.length}</strong>
            <small>{ui.assessmentsBody}</small>
          </article>
        </div>

        {visiblePilotWeeks.length === 0 ? (
          <div className="parent-pilot-empty">
            <span aria-hidden="true">○</span>
            <p><strong>{ui.pilotEmptyTitle}</strong><small>{ui.pilotEmptyBody}</small></p>
          </div>
        ) : (
          <div className="parent-pilot-weeks" role="list" aria-label={ui.pilotWeeksAria}>
            {visiblePilotWeeks.map((week) => (
              <article key={week.weekStartDateKey} role="listitem">
                <div>
                  <strong>{pilotWeekLabel(week.weekStartDateKey, week.weekEndDateKey, locale)}</strong>
                  <small>{week.activeDays} {week.activeDays === 1 ? ui.learningDayOne : ui.learningDayMany} · {week.sessions} {week.sessions === 1 ? ui.roundOne : ui.roundMany}</small>
                </div>
                <span>{week.questions === 0 ? "–" : `${week.independentRate}%`} <small>{ui.independentShort}</small></span>
                <span>{week.assessments} <small>{ui.checks}</small></span>
                <span>{week.learnerSignals} <small>{ui.signals}</small></span>
              </article>
            ))}
          </div>
        )}

        <div className="parent-pilot-assessment">
          <div>
            <small>{ui.firstLatest}</small>
            <strong>
              {firstPilotAssessment && latestPilotAssessment && firstPilotAssessment !== latestPilotAssessment
                ? ui.comparison(firstPilotAssessment.independentRate, latestPilotAssessment.independentRate)
                : firstPilotAssessment
                  ? ui.onlyCheck(firstPilotAssessment.independentRate)
                  : ui.noComparison}
            </strong>
          </div>
          <p>{pilotAssessmentComparisonCopy(summary.pilot.assessmentComparison, summary.pilot.assessmentChangePoints, locale)}</p>
        </div>

        <aside className="parent-pilot-human-boundary">
          <div>
            <span aria-hidden="true">◎</span>
            <div>
              <small>{ui.humanEyebrow}</small>
              <strong>{ui.humanTitle}</strong>
            </div>
          </div>
          <ul>
            {ui.humanEvidence.map((item) => <li key={item}>{item}</li>)}
          </ul>
          {onOpenReleaseReadiness && (
            <button className="secondary-button compact" type="button" onClick={onOpenReleaseReadiness}>
              {ui.openPilotEvidence}
            </button>
          )}
        </aside>

        <p className="parent-pilot-privacy">{ui.pilotPrivacy}</p>
      </section>

      <div className="parent-dashboard-columns">
        <section className="parent-panel parent-focus-panel">
          <div className="parent-panel-heading">
            <div>
              <span className="eyebrow">{ui.patternsEyebrow}</span>
              <h2>{ui.patternsTitle}</h2>
            </div>
            <span>{ui.noRanking}</span>
          </div>
          <div className="parent-focus-list">
            {summary.focusTopics.map((focus, index) => (
              <article key={focus.topicId}>
                <span aria-hidden="true">{index + 1}</span>
                <div>
                  <h3>{focus.title}</h3>
                  <p>{focus.reason}</p>
                  <small>{focus.nextAction}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="parent-panel parent-support-panel">
          <div className="parent-panel-heading">
            <div>
              <span className="eyebrow">{ui.supportEyebrow}</span>
              <h2>{ui.supportTitle}</h2>
            </div>
          </div>
          <dl className="parent-signal-list">
            <div>
              <dt>{ui.questionsWithHint}</dt>
              <dd>{summary.hintQuestions}</dd>
            </div>
            <div>
              <dt>{ui.selfCorrected}</dt>
              <dd>{summary.correctedQuestions}</dd>
            </div>
            <div>
              <dt>{ui.averageTime}</dt>
              <dd>{summary.averageQuestionSeconds === 0 ? "–" : formatMinutes(summary.averageQuestionSeconds)}</dd>
            </div>
            <div>
              <dt>{ui.ownFeedback}</dt>
              <dd>{summary.learnerFeedbackCount || "–"}</dd>
            </div>
          </dl>
          {summary.learnerFeedbackPatterns.length > 0 && (
            <div className="parent-learner-feedback">
              <strong>{ui.ownFeedbackTitle}</strong>
              {summary.learnerFeedbackPatterns.map((pattern) => (
                <div className={pattern.concern ? "concern" : "clear"} key={pattern.kind}>
                  <span>{pattern.label}</span>
                  <small>{pattern.occurrences}× · {pattern.nextAction}</small>
                </div>
              ))}
            </div>
          )}
          {summary.errorPatterns.length > 0 && (
            <div className="parent-error-patterns">
              <strong>{ui.hurdlesTitle}</strong>
              {summary.errorPatterns.map((pattern) => (
                <div key={pattern.kind}>
                  <span>{pattern.label}</span>
                  <small>{pattern.occurrences}× · {ui.resolvedAfter(pattern.resolvedOccurrences)}</small>
                </div>
              ))}
            </div>
          )}
          <p className="parent-signal-note">{ui.supportNote}</p>
        </section>
      </div>

      <section className="parent-panel parent-plan-panel">
        <div className="parent-panel-heading">
          <div>
            <span className="eyebrow">{ui.planEyebrow}</span>
            <h2>{ui.planTitle}</h2>
          </div>
          <span>{ui.planDuration(summary.sessionPlan.reduce((sum, item) => sum + item.durationMinutes, 0))}</span>
        </div>
        <div className="parent-plan-list">
          {summary.sessionPlan.map((item, index) => (
            <article key={item.id}>
              <span className="parent-plan-number">{index + 1}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.purpose}</p>
                {item.topicIds.length > 0 && (
                  <small>{item.topicIds.map((topicId) => topicForLocale(topicId, locale).shortTitle).join(" · ")}</small>
                )}
              </div>
              <strong>{item.durationMinutes} {ui.minutesShort}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="parent-panel parent-mock-panel">
        <div className="parent-panel-heading">
          <div>
            <span className="eyebrow">{ui.mocksEyebrow}</span>
            <h2>{ui.mocksTitle}</h2>
          </div>
          <span>{ui.recent(summary.recentMocks.length || 0)}</span>
        </div>
        {summary.generatedMockTrend && (
          <section
            className={`parent-mock-trend ${summary.generatedMockTrend.status}`}
            aria-labelledby="parent-mock-trend-title"
          >
            <div className="parent-mock-trend-heading">
              <div>
                <small>{ui.trendEyebrow}</small>
                <strong id="parent-mock-trend-title">{ui.examFormat(summary.generatedMockTrend.blueprintVersion)}</strong>
              </div>
              <span>{summary.generatedMockTrend.points.length} {summary.generatedMockTrend.points.length === 1 ? ui.runOne : ui.runMany}</span>
            </div>
            <p>{summary.generatedMockTrend.comparisonCopy}</p>
            <div className="parent-mock-trend-points" role="list" aria-label={ui.trendListAria}>
              {summary.generatedMockTrend.points.map((point, index, points) => {
                const openPercent = Math.max(0, point.upperPercent - point.lowerPercent)
                const exact = point.lowerPoints === point.upperPoints
                const position = points.length === 1
                  ? ui.previousRun
                  : index === 0
                    ? ui.firstComparison
                    : index === points.length - 1
                      ? ui.latestComparison
                      : ui.runNumber(index + 1)
                return (
                  <article key={point.id} role="listitem">
                    <div>
                      <span>{parentMockDate(point.submittedAt, intlLocale)}</span>
                      <small>{position}</small>
                    </div>
                    <strong>
                      {exact
                        ? `${point.lowerPoints}/${point.maxPoints}`
                        : `${point.lowerPoints}–${point.upperPoints}/${point.maxPoints}`}
                      <small> {ui.points}</small>
                    </strong>
                    <div
                      className="parent-mock-range"
                      role="img"
                      aria-label={exact
                        ? ui.certainAria(point.lowerPoints, point.maxPoints)
                        : ui.rangeAria(point.lowerPoints, point.upperPoints)}
                    >
                      <span className="parent-mock-range-track">
                        <span className="certain" style={{ width: `${point.lowerPercent}%` }} />
                        {!exact && (
                          <span
                            className="reviewable"
                            style={{ left: `${point.lowerPercent}%`, width: `${openPercent}%` }}
                          />
                        )}
                      </span>
                    </div>
                    <small>{exact ? ui.completeEvidence : ui.rangeEvidence}</small>
                  </article>
                )
              })}
            </div>
            <div className="parent-mock-trend-footer">
              <span><i className="certain" /> {ui.certainLegend}</span>
              <span><i className="reviewable" /> {ui.reviewableLegend}</span>
              <small>{ui.trendBoundary}</small>
            </div>
          </section>
        )}
        {summary.recentMocks.length === 0 ? (
          <div className="parent-empty-state">
            <span aria-hidden="true">◇</span>
            <p><strong>{ui.noMockTitle}</strong><small>{ui.noMockBody}</small></p>
          </div>
        ) : (
          <div className="parent-mock-list">
            {summary.recentMocks.map((mock) => {
              const examYear = officialExamYear(mock.editionId)
              return (
                <article key={mock.id}>
                  <span>
                    {mock.source === "official-archive" ? ui.official(examYear) : ui.generated}
                    {parentMockDate(mock.submittedAt, intlLocale)}
                  </span>
                  <strong>{mock.certainPoints}/{mock.maxPoints} {mock.officialReviewStatus === "complete" ? ui.correctedPoints : ui.certainPoints}</strong>
                  <small>
                    {mock.officialReviewStatus === "pending"
                      ? ui.correctionOpen
                      : mock.mathematicsGrade !== undefined
                        ? ui.mathsGrade(formatSwissGrade(mock.mathematicsGrade))
                        : mock.reviewablePoints > 0
                          ? ui.methodPoints(mock.reviewablePoints)
                          : ui.noOpenPoints}
                  </small>
                  <small>{formatMinutes(mock.durationSeconds)} {ui.examTime}</small>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {onOpenAuthorValidation && (
        <section className="parent-panel parent-author-validation-entry" aria-labelledby="parent-author-validation-title">
          <div>
            <span className="parent-author-validation-mark" aria-hidden="true">⌘</span>
            <div>
              <span className="eyebrow">{ui.authorEyebrow}</span>
              <h2 id="parent-author-validation-title">{ui.authorTitle}</h2>
              <p>{ui.authorBody}</p>
            </div>
          </div>
          <button className="secondary-button" type="button" onClick={onOpenAuthorValidation}>{ui.authorOpen}</button>
        </section>
      )}

      {onOpenReleaseReadiness && (
        <section className="parent-panel parent-release-readiness-entry" aria-labelledby="parent-release-readiness-title">
          <div>
            <span className="parent-release-readiness-mark" aria-hidden="true">✓</span>
            <div>
              <span className="eyebrow">{ui.releaseEyebrow}</span>
              <h2 id="parent-release-readiness-title">{ui.releaseTitle}</h2>
              <p>{ui.releaseBody}</p>
            </div>
          </div>
          <button className="secondary-button" type="button" onClick={onOpenReleaseReadiness}>{ui.releaseOpen}</button>
        </section>
      )}

      <aside className="parent-privacy-note">
        <span aria-hidden="true">⌁</span>
        <p>
          <strong>{ui.privacyTitle}</strong>
          <small>{ui.privacyBody}</small>
        </p>
      </aside>
    </main>
  )
}

export function ParentArea({
  learner,
  germanCourse,
  access,
  unlocked,
  releaseReadiness,
  onCreatePin,
  onUnlock,
  onResetPin,
  onExplanationLanguageChange = () => undefined,
  onReleaseReadinessChange,
  onResolveTeacherSupport,
  onResolveGermanTopicSupport,
  onSaveGermanComprehensionReview,
  onSaveGermanWritingReview,
  onBack,
  now = new Date(),
}: {
  learner: LearnerState
  germanCourse?: GermanCourseState
  access?: ParentAccessRecord
  unlocked: boolean
  releaseReadiness: ReleaseReadinessRecord
  onCreatePin: (pin: string) => Promise<void>
  onUnlock: (pin: string) => Promise<boolean>
  onResetPin: () => Promise<void>
  onExplanationLanguageChange?: (language: ParentExplanationLanguage) => void | Promise<void>
  onReleaseReadinessChange: (record: ReleaseReadinessRecord) => void
  onResolveTeacherSupport?: (topicId: TopicId) => void
  onResolveGermanTopicSupport?: (topicId: GermanTopicId) => void
  onSaveGermanComprehensionReview?: (
    resultId: string,
    status: GermanComprehensionEvidenceStatus,
    strength: string,
    nextStep: string,
  ) => void
  onSaveGermanWritingReview?: (resultId: string, strength: string, nextStep: string) => void
  onBack: () => void
  now?: Date
}) {
  const { locale } = useLocalization()
  const ui = parentAreaCopy(locale).gate
  const [pin, setPin] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [screen, setScreen] = useState<"dashboard" | "author-validation" | "release-readiness">("dashboard")

  if (unlocked && screen === "author-validation") {
    return (
      <AuthorValidationView
        onBack={() => setScreen("dashboard")}
        onLock={onBack}
      />
    )
  }

  if (unlocked && screen === "release-readiness") {
    return (
      <ReleaseReadinessView
        record={releaseReadiness}
        onChange={onReleaseReadinessChange}
        onBack={() => setScreen("dashboard")}
        onLock={onBack}
      />
    )
  }

  if (unlocked) {
    return (
      <ParentDashboardView
        learner={learner}
        germanCourse={germanCourse}
        onLock={onBack}
        onResolveTeacherSupport={onResolveTeacherSupport}
        onResolveGermanTopicSupport={onResolveGermanTopicSupport}
        onSaveGermanComprehensionReview={onSaveGermanComprehensionReview}
        onSaveGermanWritingReview={onSaveGermanWritingReview}
        onOpenAuthorValidation={() => setScreen("author-validation")}
        onOpenReleaseReadiness={() => setScreen("release-readiness")}
        explanationLanguage={parentExplanationLanguage(access)}
        onExplanationLanguageChange={onExplanationLanguageChange}
        now={now}
      />
    )
  }

  const submitSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)
    if (!isValidParentPin(pin)) {
      setError(ui.invalidPin)
      return
    }
    if (pin !== confirmation) {
      setError(ui.mismatch)
      return
    }
    setBusy(true)
    try {
      await onCreatePin(pin)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : ui.saveError)
    } finally {
      setBusy(false)
    }
  }

  const submitUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)
    if (!isValidParentPin(pin)) {
      setError(ui.enterPin)
      return
    }
    setBusy(true)
    try {
      if (!await onUnlock(pin)) {
        setError(ui.wrongPin)
        setPin("")
      }
    } catch {
      setError(ui.unlockError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="parent-gate-shell">
      <button className="curriculum-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span>
        {ui.back}
      </button>
      <section className="parent-gate-card">
        <div className="parent-gate-copy">
          <span className="parent-gate-mark" aria-hidden="true">◉</span>
          <span className="eyebrow">{ui.eyebrow}</span>
          <h1>{access ? ui.unlockTitle : ui.setupTitle}</h1>
          <p>{access ? ui.unlockBody : ui.setupBody}</p>
          <ul>
            {ui.benefits.map((benefit) => <li key={benefit}><span aria-hidden="true">✓</span> {benefit}</li>)}
          </ul>
        </div>

        <form className="parent-pin-form" onSubmit={access ? submitUnlock : submitSetup}>
          <div>
            <span className="eyebrow">{access ? ui.accessEyebrow : ui.setupEyebrow}</span>
            <h2>{access ? ui.pinTitle : ui.choosePinTitle}</h2>
            <p>{ui.pinBody}</p>
          </div>
          <label htmlFor="parent-pin">
            PIN
            <input
              id="parent-pin"
              type="password"
              inputMode="numeric"
              autoComplete={access ? "current-password" : "new-password"}
              pattern="[0-9]{4,8}"
              minLength={4}
              maxLength={8}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
              autoFocus
            />
          </label>
          {!access && (
            <label htmlFor="parent-pin-confirmation">
              {ui.repeatPin}
              <input
                id="parent-pin-confirmation"
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                pattern="[0-9]{4,8}"
                minLength={4}
                maxLength={8}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, "").slice(0, 8))}
              />
            </label>
          )}
          {error && <p className="parent-pin-error" role="alert">{error}</p>}
          <button className="primary-button wide" type="submit" disabled={busy}>
            {busy ? ui.wait : access ? ui.open : ui.save}
          </button>

          {access && (
            <div className="parent-pin-reset">
              {confirmReset ? (
                <div role="alert">
                  <p><strong>{ui.resetTitle}</strong><span>{ui.resetBody}</span></p>
                  <div>
                    <button className="text-button" type="button" onClick={() => setConfirmReset(false)}>{ui.resetCancel}</button>
                    <button className="danger-button" type="button" onClick={() => void onResetPin()}>{ui.resetDelete}</button>
                  </div>
                </div>
              ) : (
                <button className="text-button" type="button" onClick={() => setConfirmReset(true)}>{ui.forgot}</button>
              )}
            </div>
          )}
        </form>
      </section>
    </main>
  )
}

function ConceptVisual({
  visual,
  contentLocale,
}: {
  visual: (typeof lessons)[TopicId]["pages"][number]["visual"]
  contentLocale?: AppLocale
}) {
  const { locale: appLocale } = useLocalization()
  const locale = contentLocale ?? appLocale
  const c = conceptPlaygroundCopy(locale)
  if (visual === "factor-pairs") {
    return (
      <div className="concept-visual factor-concept" aria-label={c.visualFactorAria}>
        <div><span>18 · 47</span><strong>+</strong><span>18 · 53</span></div>
        <i>{c.visualFactorOut}</i>
        <div><span>18</span><strong>·</strong><span>(47 + 53)</span></div>
      </div>
    )
  }

  if (visual === "mass-scale") {
    return (
      <div className="concept-visual mass-visual" aria-label={c.visualMassAria}>
        <span>1 kg</span><strong>× 1000</strong><span>1000 g</span>
      </div>
    )
  }

  if (visual === "reverse-chain") {
    return (
      <div className="concept-visual chain-visual" aria-label={c.visualReverseAria}>
        <span>{c.visualEnd}</span><i>←</i><span>{c.visualStep3}</span><i>←</i><span>{c.visualStep2}</span><i>←</i><span>{c.visualStart}</span>
      </div>
    )
  }

  if (visual === "balance") {
    return (
      <div className="concept-visual balance-visual" aria-label={c.visualBalanceAria}>
        <span>□</span><i>× 6</i><span>216</span><i>÷ 8</i><span>27</span>
      </div>
    )
  }

  if (visual === "clock-fraction") {
    return (
      <div className="concept-visual clock-visual" aria-label={c.visualClockAria}>
        <div><strong>140</strong><small>{c.visualMinutes}</small></div>
        <span>÷ 7</span>
        <div><strong>20</strong><small>{c.visualPerPart}</small></div>
      </div>
    )
  }

  if (visual === "motion-model") {
    return (
      <div className="concept-visual motion-concept" aria-label={c.visualMotionAria}>
        <div className="motion-track"><span>{c.visualStart}</span><i /><span>{c.visualFinish}</span></div>
        <div className="motion-formula"><strong>{c.visualDistance}</strong><span>:</span><strong>{c.visualTime}</strong><span>=</span><strong>{c.visualSpeed}</strong></div>
      </div>
    )
  }

  if (visual === "data-table") {
    return (
      <div className="concept-visual data-table-concept" aria-label={c.visualDataAria}>
        <table>
          <thead><tr><th /><th>{c.visualWeek(1)}</th><th>{c.visualWeek(2)}</th><th>{c.visualWeek(3)}</th></tr></thead>
          <tbody><tr><th scope="row">{c.visualLoans}</th><td>22</td><td>31</td><td className="missing-cell">?</td></tr></tbody>
          <tfoot><tr><th scope="row">{c.visualMean}</th><td colSpan={3}>{c.visualPerWeek}</td></tr></tfoot>
        </table>
        <strong>{c.visualDataPath}</strong>
      </div>
    )
  }

  if (visual === "money-table") {
    return (
      <div className="concept-visual concept-table" aria-label={c.visualMoneyAria}>
        <span>{c.price}</span><strong>×</strong><span>{c.quantity}</span><strong>=</strong><span>{c.revenue}</span>
      </div>
    )
  }

  if (visual === "combination-grid") {
    return (
      <div className="concept-visual combination-visual" aria-label={c.visualCombinationAria}>
        <div><strong>5 Fr.</strong><strong>2 Fr.</strong><strong>1 Fr.</strong></div>
        <div><span>1</span><span>1</span><span>9</span></div>
        <div><span>1</span><span>2</span><span>7</span></div>
        <div><span>1</span><span>3</span><span>5</span></div>
      </div>
    )
  }

  if (visual === "number-filter") {
    return (
      <div className="concept-visual number-filter-concept" aria-label={c.visualNumberFilterAria}>
        <div className="digit-row"><span>1</span><span>3</span><span>6</span><span>8</span></div>
        <i>{c.visualDivisible4}</i>
        <i>{c.visualThousandsGreater}</i>
        <strong>{c.visualCompleteSet}</strong>
      </div>
    )
  }

  if (visual === "tile-grid") {
    return (
      <div className="concept-visual concept-tile-wrap" aria-label={c.visualTileAria}>
        <div className="concept-tile-grid">
          {Array.from({ length: 24 }, (_, index) => (
            <span className={[1, 2, 7, 8, 15, 16, 21, 22].includes(index) ? "large" : ""} key={index} />
          ))}
        </div>
        <strong>{c.visualOneLarge}</strong>
      </div>
    )
  }

  if (visual === "area-cutout") {
    return (
      <div className="concept-visual area-cutout-concept" aria-label={c.visualCutoutAria}>
        <svg viewBox="0 0 320 230" role="img" aria-label={c.visualCutoutAria}>
          <path d="M35 25 H285 V115 H225 V205 H35 Z" />
          <path className="cutout-guide" d="M225 25 V115 H285" />
          <text x="120" y="220">{c.visualOuterMinusCut}</text>
        </svg>
      </div>
    )
  }

  if (visual === "supply-model") {
    return (
      <div className="concept-visual supply-concept" aria-label={c.visualSupplyAria}>
        <div><strong>40</strong><small>{c.people}</small></div><span>×</span>
        <div><strong>24</strong><small>{c.days}</small></div><span>=</span>
        <div><strong>960</strong><small>{c.personDays}</small></div>
      </div>
    )
  }

  if (visual === "locus-map") {
    return (
      <div className="concept-visual locus-concept" aria-label={c.visualLocusAria}>
        <div className="locus-circle"><span>F</span></div>
        <div className="locus-line main" /><div className="locus-line parallel" />
        <span className="locus-point one">B₁</span><span className="locus-point two">B₂</span>
      </div>
    )
  }

  if (visual === "coordinate-plane") {
    const gridLines = Array.from({ length: 9 }, (_, index) => 40 + index * 35)
    return (
      <div className="concept-visual coordinate-plane-concept" aria-label={c.visualCoordinateAria}>
        <svg viewBox="0 0 360 360" aria-hidden="true">
          {gridLines.map((position) => <line className="coordinate-grid-line" x1={position} y1="40" x2={position} y2="320" key={`v-${position}`} />)}
          {gridLines.map((position) => <line className="coordinate-grid-line" x1="40" y1={position} x2="320" y2={position} key={`h-${position}`} />)}
          <line className="coordinate-axis" x1="40" y1="180" x2="320" y2="180" />
          <line className="coordinate-axis" x1="180" y1="40" x2="180" y2="320" />
          <path className="coordinate-transform-arrow" d="M 250 110 C 225 80, 135 80, 110 110" />
          <circle className="coordinate-point" cx="250" cy="110" r="9" />
          <circle className="coordinate-image-point" cx="110" cy="110" r="9" />
          <text x="260" y="102">P(2 | 2)</text>
          <text x="58" y="102">P′(−2 | 2)</text>
        </svg>
        <strong>{c.visualCoordinateRule}</strong>
      </div>
    )
  }

  if (visual === "cube-net") {
    const netFaces = new Map([
      [1, "A"],
      [4, "B"],
      [5, "C"],
      [6, "D"],
      [7, "E"],
      [9, "F"],
    ])
    return (
      <div className="concept-visual cube-net-concept" aria-label={c.visualCubeAria}>
        <div className="cube-net-grid" style={{ "--net-columns": "4", "--net-rows": "3" } as CSSProperties}>
          {Array.from({ length: 12 }, (_, position) => {
            const label = netFaces.get(position)
            return label
              ? <span className={label === "C" ? "target" : ""} key={position}>{label}</span>
              : <i aria-hidden="true" key={position} />
          })}
        </div>
        <strong>{c.visualCubeRule}</strong>
      </div>
    )
  }

  if (visual === "pyramid-roll") {
    return (
      <div className="concept-visual pyramid-concept" aria-label={c.visualPyramidAria}>
        <div className="pyramid-shape"><span>2</span><span>1</span><strong>4</strong></div>
        <i>→</i>
        <div className="pyramid-cell">1 {c.down}</div>
      </div>
    )
  }

  if (visual === "cuboid-net") {
    return (
      <div className="concept-visual cuboid-concept" aria-label={c.visualCuboidAria}>
        <div className="cuboid-box"><span>L · B</span><span>L · H</span><span>B · H</span></div>
        <strong>{c.visualEveryFace}</strong>
      </div>
    )
  }

  const reverse = visual === "fraction-backward"
  return (
    <div className="concept-visual fraction-concept" aria-label={reverse ? c.visualFractionReverseAria : c.visualFractionForwardAria}>
      <div className="fraction-blocks">
        {[0, 1, 2, 3].map((index) => <span className={index < 3 ? "filled" : ""} key={index} />)}
      </div>
      <strong>{reverse ? c.visualFractionReverse : c.visualFractionForward}</strong>
    </div>
  )
}

const coordinatePlaygroundRules: Array<{
  id: CoordinateTransformation
  notation: string
}> = [
  { id: "reflect-y", notation: "(−x | y)" },
  { id: "reflect-x", notation: "(x | −y)" },
  { id: "reflect-origin", notation: "(−x | −y)" },
  { id: "rotate-cw", notation: "(y | −x)" },
  { id: "rotate-ccw", notation: "(−y | x)" },
  { id: "translate", notation: "(x + 2 | y − 1)" },
]

function useConceptPlaygroundLocalization() {
  const { locale, intlLocale } = useLocalization()
  const c = conceptPlaygroundCopy(locale)
  const formatPlaygroundNumber = (value: number) => new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 2,
  }).format(value)
  const formatPlaygroundDuration = (minutes: number) => {
    const wholeHours = Math.floor(minutes / 60)
    const remainingMinutes = minutes - wholeHours * 60
    if (wholeHours === 0) return `${formatPlaygroundNumber(remainingMinutes)} min`
    if (remainingMinutes === 0) return `${wholeHours} h`
    return `${wholeHours} h ${formatPlaygroundNumber(remainingMinutes)} min`
  }
  return { c, formatPlaygroundDuration, formatPlaygroundNumber, locale }
}

function OperationChainPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const multiplier = Math.max(2, Math.round(values[0] ?? 6))
  const divisor = Math.max(2, Math.round(values[1] ?? 8))
  const initialResult = Math.max(multiplier, Math.round(values[2] ?? multiplier * 5))
  const [base, setBase] = useState(Math.max(1, Math.round(initialResult / multiplier)))
  const model = buildOperationChainModel(multiplier, divisor, base)

  return (
    <div className="concept-playground operation-chain-playground">
      <div className="concept-playground-prompt">
        <span>{c.operationPrompt}</span>
        <strong>{c.operationBody}</strong>
      </div>
      <div className="operation-chain-flow" aria-live="polite">
        <span><small>{c.wanted}</small><strong>{model.unknown}</strong></span>
        <i aria-hidden="true">× {model.multiplier}</i>
        <span><small>{c.intermediate}</small><strong>{model.afterMultiplication}</strong></span>
        <i aria-hidden="true">÷ {model.divisor}</i>
        <span><small>{c.result}</small><strong>{model.result}</strong></span>
      </div>
      <div className="operation-chain-reverse" aria-label={c.operationReverseAria(model.result, model.divisor, model.multiplier, model.unknown)}>
        <span>{c.backwards}</span>
        <strong>{model.result} × {model.divisor} = {model.afterMultiplication}</strong>
        <i aria-hidden="true">→</i>
        <strong>{model.afterMultiplication} ÷ {model.multiplier} = {model.unknown}</strong>
      </div>
      <label className="concept-playground-range" htmlFor="operation-chain-base">
        <span>{c.operationChange}</span>
        <input
          id="operation-chain-base"
          type="range"
          min={2}
          max={30}
          step={1}
          value={base}
          aria-valuetext={c.operationValue(model.result, model.unknown)}
          onChange={(event) => setBase(Number(event.target.value))}
        />
      </label>
      <p className="concept-playground-equation">(□ · {model.multiplier}) : {model.divisor} = {model.result}</p>
    </div>
  )
}

function TimeFractionPlayground({ question }: { question: GeneratedQuestion }) {
  const { c, formatPlaygroundDuration } = useConceptPlaygroundLocalization()
  const denominator = Math.max(2, Math.round(question.visual?.denominator ?? 7))
  const initialNumerator = Math.min(
    denominator,
    Math.max(1, Math.round(question.visual?.numerator ?? Math.min(3, denominator))),
  )
  const totalMinutes = question.visual?.values?.[0] ?? denominator * 20
  const initialOnePart = Math.max(1, Math.round(totalMinutes / denominator))
  const [numerator, setNumerator] = useState(initialNumerator)
  const [onePartMinutes, setOnePartMinutes] = useState(initialOnePart)
  const model = buildTimeFractionModel(numerator, denominator, onePartMinutes)

  return (
    <div className="concept-playground time-fraction-playground">
      <div className="concept-playground-prompt">
        <span>{c.timePrompt}</span>
        <strong>{c.timeBody}</strong>
      </div>
      <div className="time-fraction-stage">
        <div
          className="time-fraction-clock"
          style={{ "--time-angle": `${numerator / denominator * 360}deg` } as CSSProperties}
          role="img"
          aria-label={c.timeMarkedAria(numerator, denominator)}
        >
          <span><strong>{numerator}/{denominator}</strong><small>{formatPlaygroundDuration(model.fractionMinutes)}</small></span>
        </div>
        <div className="time-fraction-calculation" aria-live="polite">
          <span><small>{c.whole}</small><strong>{formatPlaygroundDuration(model.totalMinutes)}</strong></span>
          <i aria-hidden="true">÷ {denominator}</i>
          <span><small>{c.onePart}</small><strong>{formatPlaygroundDuration(model.onePartMinutes)}</strong></span>
          <i aria-hidden="true">× {numerator}</i>
          <span><small>{c.share}</small><strong>{formatPlaygroundDuration(model.fractionMinutes)}</strong></span>
        </div>
      </div>
      <div className="time-fraction-controls">
        <label htmlFor="time-fraction-numerator"><span>{c.timeNumerator}</span><strong>{numerator}</strong><input id="time-fraction-numerator" type="range" min={1} max={denominator} step={1} value={numerator} onChange={(event) => setNumerator(Number(event.target.value))} /></label>
        <label htmlFor="time-fraction-part"><span>{c.timeMinutesPerPart}</span><strong>{onePartMinutes}</strong><input id="time-fraction-part" type="range" min={5} max={70} step={1} value={onePartMinutes} onChange={(event) => setOnePartMinutes(Number(event.target.value))} /></label>
      </div>
      <p className="concept-playground-equation">{model.totalMinutes} min ÷ {denominator} × {numerator} = {model.fractionMinutes} min</p>
    </div>
  )
}

function AverageMotionPlayground({ values }: { values: number[] }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const firstSpeed = Math.max(1, values[0] ?? 40)
  const secondSpeed = Math.max(1, values[3] ?? 80)
  const [firstMinutes, setFirstMinutes] = useState(Math.max(5, Math.round(values[1] ?? 30)))
  const [secondMinutes, setSecondMinutes] = useState(Math.max(5, Math.round(values[4] ?? 45)))
  const model = buildAverageMotionModel(firstSpeed, firstMinutes, secondSpeed, secondMinutes)

  return (
    <div className="concept-playground motion-playground average-motion-playground">
      <div className="concept-playground-prompt">
        <span>{c.averagePrompt}</span>
        <strong>{c.averageBody}</strong>
      </div>
      <div className="motion-segment-grid" aria-live="polite">
        <span><small>{c.section(1)}</small><strong>{formatPlaygroundNumber(model.firstDistance)} km</strong><em>{firstSpeed} km/h · {firstMinutes} min</em></span>
        <span><small>{c.section(2)}</small><strong>{formatPlaygroundNumber(model.secondDistance)} km</strong><em>{secondSpeed} km/h · {secondMinutes} min</em></span>
        <span className="total"><small>{c.wholeTrip}</small><strong>{formatPlaygroundNumber(model.averageSpeed)} km/h</strong><em>{formatPlaygroundNumber(model.totalDistance)} km · {model.totalMinutes} min</em></span>
      </div>
      <div className="motion-playground-controls">
        <label htmlFor="motion-first-minutes"><span>{c.sectionTime(1)}</span><strong>{firstMinutes} min</strong><input id="motion-first-minutes" type="range" min={10} max={90} step={5} value={firstMinutes} onChange={(event) => setFirstMinutes(Number(event.target.value))} /></label>
        <label htmlFor="motion-second-minutes"><span>{c.sectionTime(2)}</span><strong>{secondMinutes} min</strong><input id="motion-second-minutes" type="range" min={10} max={90} step={5} value={secondMinutes} onChange={(event) => setSecondMinutes(Number(event.target.value))} /></label>
      </div>
      <p className="concept-playground-equation">{formatPlaygroundNumber(model.totalDistance)} km ÷ {formatPlaygroundNumber(model.totalMinutes / 60)} h = {formatPlaygroundNumber(model.averageSpeed)} km/h</p>
    </div>
  )
}

function CatchUpMotionPlayground({ values }: { values: number[] }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const slowSpeed = Math.max(1, values[0] ?? 8)
  const fastSpeed = Math.max(slowSpeed + 1, values[1] ?? 16)
  const [headStartMinutes, setHeadStartMinutes] = useState(Math.max(5, Math.round(values[2] ?? 30)))
  const model = buildCatchUpMotionModel(slowSpeed, fastSpeed, headStartMinutes)

  return (
    <div className="concept-playground motion-playground catch-up-motion-playground">
      <div className="concept-playground-prompt">
        <span>{c.catchPrompt}</span>
        <strong>{c.catchBody}</strong>
      </div>
      <div className="catch-up-model" aria-live="polite">
        <span><small>{c.headStart}</small><strong>{formatPlaygroundNumber(model.headStartDistance)} km</strong><em>{slowSpeed} km/h · {headStartMinutes} min</em></span>
        <i aria-hidden="true">÷</i>
        <span><small>{c.catchUpSpeed}</small><strong>{formatPlaygroundNumber(model.relativeSpeed)} km/h</strong><em>{fastSpeed} − {slowSpeed}</em></span>
        <i aria-hidden="true">=</i>
        <span><small>{c.catchUpTime}</small><strong>{formatPlaygroundNumber(model.catchMinutes)} min</strong><em>{c.meetingPoint}: {formatPlaygroundNumber(model.meetingDistance)} km</em></span>
      </div>
      <label className="concept-playground-range" htmlFor="motion-head-start">
        <span>{c.headStartMinutes}</span>
        <input id="motion-head-start" type="range" min={5} max={60} step={1} value={headStartMinutes} aria-valuetext={c.headStartValue(headStartMinutes, formatPlaygroundNumber(model.meetingDistance))} onChange={(event) => setHeadStartMinutes(Number(event.target.value))} />
      </label>
      <p className="concept-playground-equation">{formatPlaygroundNumber(model.headStartDistance)} km ÷ {formatPlaygroundNumber(model.relativeSpeed)} km/h = {formatPlaygroundNumber(model.catchMinutes)} min {c.catchUpTime}</p>
    </div>
  )
}

function MotionPlayground({ question }: { question: GeneratedQuestion }) {
  const values = question.visual?.values ?? []
  if (question.visual?.variant === "return-home" || question.visual?.variant === "late-start") {
    return <ScheduleRecoveryPlayground question={question} />
  }
  return question.visual?.variant === "catch-up"
    ? <CatchUpMotionPlayground values={values} />
    : <AverageMotionPlayground values={values} />
}

function ScheduleRecoveryPlayground({ question }: { question: GeneratedQuestion }) {
  const { formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const labels = question.visual?.labels ?? []
  const isReturnHome = question.visual?.variant === "return-home"
  const eventMinutes = isReturnHome
    ? 2 * (values[6] ?? 0) + (values[7] ?? 0)
    : values[6] ?? 0

  return (
    <div className="concept-playground schedule-recovery-playground">
      <div className="concept-playground-prompt">
        <span>{question.answerLabel}</span>
        <strong>{question.hint}</strong>
        <small>{question.easierExplanation}</small>
      </div>
      <div className="schedule-recovery-flow" aria-live="polite">
        <span><small>{labels[0]}</small><strong>{formatPlaygroundNumber(values[2] ?? 0)} km</strong><em>{values[1]} min · {values[0]} km/h</em></span>
        <i aria-hidden="true">− {eventMinutes} min</i>
        <span><small>{labels[1]}</small><strong>{values[4]} min</strong><em>{formatPlaygroundNumber(values[3] ?? 0)} km/h</em></span>
      </div>
      <p className="concept-playground-equation">{question.workedSteps.at(-1)}</p>
    </div>
  )
}

function ReverseChainPlayground({ steps }: { steps: PracticeStep[] }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const [revealedIndex, setRevealedIndex] = useState(0)
  const activeStep = steps[revealedIndex]!

  return (
    <div className="concept-playground reverse-process-playground">
      <div className="concept-playground-prompt">
        <span>{c.reversePrompt}</span>
        <strong>{c.reverseBody}</strong>
      </div>
      <div className="reverse-process-chain" aria-live="polite">
        {steps.map((step, index) => (
          <span className={index <= revealedIndex ? "revealed" : ""} key={step.id}>
            <small>{step.label}</small>
            <strong>{index <= revealedIndex ? `${formatPlaygroundNumber(step.value)} ${step.unit ?? ""}` : "?"}</strong>
            <em>{index <= revealedIndex ? step.instruction : c.notCalculated}</em>
          </span>
        ))}
      </div>
      <label className="concept-playground-range" htmlFor="reverse-process-step">
        <span>{c.reverseStep(revealedIndex + 1, steps.length)}</span>
        <input id="reverse-process-step" type="range" min={0} max={steps.length - 1} step={1} value={revealedIndex} aria-valuetext={`${activeStep.label}: ${formatPlaygroundNumber(activeStep.value)} ${activeStep.unit ?? ""}`} onChange={(event) => setRevealedIndex(Number(event.target.value))} />
      </label>
      <p className="concept-playground-feedback"><strong>{activeStep.label}</strong><span>{activeStep.nextStep}</span></p>
    </div>
  )
}

function InverseSupplyPlayground({ question }: { question: GeneratedQuestion }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const originalPeople = Math.max(2, Math.round(values[0] ?? 24))
  const originalDays = Math.max(2, Math.round(values[1] ?? 30))
  const [newPeople, setNewPeople] = useState(Math.max(1, Math.round(values[2] ?? 18)))
  const model = buildInverseSupplyModel(originalPeople, originalDays, newPeople)

  return (
    <div className="concept-playground supply-playground inverse-supply-playground">
      <div className="concept-playground-prompt">
        <span>{c.inversePrompt}</span>
        <strong>{c.inverseBody}</strong>
      </div>
      <div className="supply-equivalence" aria-live="polite">
        <span><small>{c.before}</small><strong>{originalPeople} × {originalDays}</strong><em>{model.totalPersonDays} {c.personDays}</em></span>
        <i aria-hidden="true">=</i>
        <span><small>{c.after}</small><strong>{newPeople} × {formatPlaygroundNumber(model.newDays)}</strong><em>{model.totalPersonDays} {c.personDays}</em></span>
      </div>
      <label className="concept-playground-range" htmlFor="inverse-supply-people">
        <span>{c.peopleAfter}</span>
        <input id="inverse-supply-people" type="range" min={1} max={originalPeople * 2} step={1} value={newPeople} aria-valuetext={c.inverseValue(newPeople, formatPlaygroundNumber(model.newDays))} onChange={(event) => setNewPeople(Number(event.target.value))} />
      </label>
      <p className="concept-playground-equation">{model.totalPersonDays} {c.personDays} ÷ {newPeople} {c.people} = {formatPlaygroundNumber(model.newDays)} {c.days}</p>
    </div>
  )
}

function ChangingSupplyPlayground({ question }: { question: GeneratedQuestion }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const originalPeople = Math.max(2, Math.round(values[0] ?? 24))
  const originalDays = Math.max(2, Math.round(values[1] ?? 30))
  const [elapsedDays, setElapsedDays] = useState(Math.min(originalDays - 1, Math.max(0, Math.round(values[2] ?? 6))))
  const [newPeople, setNewPeople] = useState(Math.max(1, Math.round(values[3] ?? 18)))
  const model = buildChangingSupplyModel(originalPeople, originalDays, elapsedDays, newPeople)
  const remainingPercent = model.remainingPersonDays / model.totalPersonDays * 100

  return (
    <div className="concept-playground supply-playground changing-supply-playground">
      <div className="concept-playground-prompt">
        <span>{c.changingPrompt}</span>
        <strong>{c.changingBody}</strong>
      </div>
      <div className="supply-meter" style={{ "--supply-remaining": `${remainingPercent}%` } as CSSProperties} role="img" aria-label={c.remainingPercent(formatPlaygroundNumber(remainingPercent))}>
        <span><strong>{formatPlaygroundNumber(model.remainingPersonDays)}</strong><small>{c.remainingOf(formatPlaygroundNumber(model.remainingPersonDays), model.totalPersonDays)}</small></span>
      </div>
      <div className="changing-supply-equation" aria-live="polite">
        <span><small>{c.total}</small><strong>{model.totalPersonDays}</strong></span>
        <i aria-hidden="true">−</i>
        <span><small>{c.used}</small><strong>{model.usedPersonDays}</strong></span>
        <i aria-hidden="true">=</i>
        <span><small>{c.remaining}</small><strong>{model.remainingPersonDays}</strong></span>
        <i aria-hidden="true">÷ {newPeople}</i>
        <span><small>{c.newDuration}</small><strong>{formatPlaygroundNumber(model.newDays)} {c.days}</strong></span>
      </div>
      <div className="supply-playground-controls">
        <label htmlFor="changing-supply-elapsed"><span>{c.daysElapsed}</span><strong>{elapsedDays}</strong><input id="changing-supply-elapsed" type="range" min={0} max={originalDays - 1} step={1} value={elapsedDays} onChange={(event) => setElapsedDays(Number(event.target.value))} /></label>
        <label htmlFor="changing-supply-people"><span>{c.peopleAfterwards}</span><strong>{newPeople}</strong><input id="changing-supply-people" type="range" min={1} max={originalPeople * 2} step={1} value={newPeople} onChange={(event) => setNewPeople(Number(event.target.value))} /></label>
      </div>
    </div>
  )
}

function EfficientArithmeticPlayground({ question }: { question: GeneratedQuestion }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const operation = question.visual?.variant === "difference" ? "difference" : "sum"
  const factor = Math.max(1, values[0] ?? 18)
  const combined = Math.max(2, values[3] ?? (operation === "sum" ? 100 : 25))
  const [movableTerm, setMovableTerm] = useState(
    Math.max(1, operation === "sum" ? values[1] ?? 47 : values[2] ?? 47),
  )
  const left = operation === "sum" ? movableTerm : movableTerm + combined
  const right = operation === "sum" ? combined - movableTerm : movableTerm
  const model = buildEfficientArithmeticModel(factor, left, right, operation)
  const sign = operation === "sum" ? "+" : "−"

  return (
    <div className="concept-playground efficient-arithmetic-playground">
      <div className="concept-playground-prompt">
        <span>{c.efficientPrompt}</span>
        <strong>{c.efficientBody}</strong>
      </div>
      <div className="factor-pair-products" aria-live="polite">
        <span><small>{c.firstProduct}</small><strong>{factor} × {left}</strong><em>{formatPlaygroundNumber(model.leftProduct)}</em></span>
        <i aria-hidden="true">{sign}</i>
        <span><small>{c.secondProduct}</small><strong>{factor} × {right}</strong><em>{formatPlaygroundNumber(model.rightProduct)}</em></span>
      </div>
      <div className="factor-grouped-equation">
        <span>{c.factorOut}</span>
        <strong>{factor} × ({left} {sign} {right})</strong>
        <i aria-hidden="true">=</i>
        <strong>{factor} × {model.combined} = {formatPlaygroundNumber(model.result)}</strong>
      </div>
      <label className="concept-playground-range" htmlFor="efficient-arithmetic-term">
        <span>{operation === "sum" ? c.moveFirst : c.moveSmaller}</span>
        <input id="efficient-arithmetic-term" type="range" min={1} max={operation === "sum" ? combined - 1 : 100} step={1} value={movableTerm} aria-valuetext={c.efficientValue(left, sign, right, model.combined, model.result)} onChange={(event) => setMovableTerm(Number(event.target.value))} />
      </label>
      <p className="concept-playground-equation">{factor} · {left} {sign} {factor} · {right} = {factor} · ({left} {sign} {right})</p>
    </div>
  )
}

function DataComplementPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const labels = question.visual?.labels?.slice(0, 3) ?? [1, 2, 3].map(c.camp)
  const totalPerRow = values[0] ?? 14
  const model = buildDataTableComplementModel(totalPerRow, values.slice(1, 4), values.slice(4, 7))
  const [selectedRow, setSelectedRow] = useState(0)
  const row = model.rows[selectedRow]!

  return (
    <div className="concept-playground data-table-playground">
      <div className="concept-playground-prompt">
        <span>{c.complementPrompt}</span>
        <strong>{c.complementBody}</strong>
      </div>
      <div className="table-row-picker" aria-label={c.rowPickerAria}>
        {model.rows.map((_, index) => <button type="button" className={selectedRow === index ? "selected" : ""} aria-pressed={selectedRow === index} onClick={() => setSelectedRow(index)} key={labels[index]}>{labels[index]}</button>)}
      </div>
      <div className="table-complement-row" aria-live="polite">
        <span><small>{c.allDays}</small><strong>{model.totalPerRow}</strong></span>
        <i aria-hidden="true">−</i>
        <span><small>{c.hiking}</small><strong>{row.hiking}</strong></span>
        <i aria-hidden="true">−</i>
        <span><small>{c.swimming}</small><strong>{row.swimming}</strong></span>
        <i aria-hidden="true">=</i>
        <span className="answer"><small>{c.neither}</small><strong>{row.neither}</strong></span>
      </div>
      <p className="concept-playground-equation">{c.allCamps}: {model.totalDays} − {model.hikingTotal} − {model.swimmingTotal} = {model.neitherTotal} {c.days}</p>
    </div>
  )
}

function MissingAveragePlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const average = values[3] ?? 24
  const [first, setFirst] = useState(values[0] ?? 18)
  const [second, setSecond] = useState(values[1] ?? 29)
  const model = buildMissingAverageModel(average, [first, second])

  return (
    <div className="concept-playground data-table-playground missing-average-playground">
      <div className="concept-playground-prompt"><span>{c.averageTablePrompt}</span><strong>{c.averageTableBody}</strong></div>
      <div className="average-total-strip" aria-live="polite">
        <span><small>{c.mean}</small><strong>{average}</strong></span><i aria-hidden="true">× 3 =</i><span><small>{c.targetTotal}</small><strong>{model.targetTotal}</strong></span>
      </div>
      <div className="data-playground-controls">
        <label htmlFor="average-first"><span>{c.week(1)}</span><strong>{first}</strong><input id="average-first" type="range" min={0} max={Math.max(0, model.targetTotal - second)} step={1} value={first} onChange={(event) => setFirst(Number(event.target.value))} /></label>
        <label htmlFor="average-second"><span>{c.week(2)}</span><strong>{second}</strong><input id="average-second" type="range" min={0} max={Math.max(0, model.targetTotal - first)} step={1} value={second} onChange={(event) => setSecond(Number(event.target.value))} /></label>
      </div>
      <p className="concept-playground-equation">{model.targetTotal} − {first} − {second} = {model.missingValue} {c.inWeek(3)}</p>
    </div>
  )
}

function TableDifferencePlayground({ question }: { question: GeneratedQuestion }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const total = values[2] ?? 16.5
  const [known, setKnown] = useState(values[0] ?? 9)
  const model = buildTableDifferenceModel(total, known)

  return (
    <div className="concept-playground data-table-playground table-difference-playground">
      <div className="concept-playground-prompt"><span>{c.differencePrompt}</span><strong>{c.differenceBody}</strong></div>
      <div className="route-segments" style={{ "--known-share": `${known / total * 100}%` } as CSSProperties} role="img" aria-label={c.distanceAria(formatPlaygroundNumber(known), formatPlaygroundNumber(model.missing))}><span>{c.known} · {formatPlaygroundNumber(known)} km</span><strong>{c.missing} · {formatPlaygroundNumber(model.missing)} km</strong></div>
      <label className="concept-playground-range" htmlFor="table-known-segment"><span>{c.knownDistance}</span><input id="table-known-segment" type="range" min={0} max={total} step={0.5} value={known} aria-valuetext={c.distanceValue(formatPlaygroundNumber(known), formatPlaygroundNumber(model.missing))} onChange={(event) => setKnown(Number(event.target.value))} /></label>
      <p className="concept-playground-equation">{formatPlaygroundNumber(total)} − {formatPlaygroundNumber(known)} = {formatPlaygroundNumber(model.missing)} km</p>
    </div>
  )
}

function DataTablePlayground({ question }: { question: GeneratedQuestion }) {
  if (question.visual?.variant === "complement") return <DataComplementPlayground question={question} />
  if (question.visual?.variant === "missing-average") return <MissingAveragePlayground question={question} />
  if (question.visual?.variant === "duration-price") return <DurationPricePlayground question={question} />
  return <TableDifferencePlayground question={question} />
}

function DurationPricePlayground({ question }: { question: GeneratedQuestion }) {
  const values = question.visual?.values ?? []
  const [firstCost, secondCost, firstHours, secondHours, targetHours, baseFee, hourlyRate, targetCost] = values

  return (
    <div className="concept-playground data-table-playground duration-price-playground">
      <div className="concept-playground-prompt">
        <span>{question.answerLabel}</span>
        <strong>{question.hint}</strong>
        <small>{question.easierExplanation}</small>
      </div>
      <div className="duration-price-known" role="table">
        {[[firstHours, firstCost], [secondHours, secondCost], [targetHours, undefined]].map(([hours, cost], index) => (
          <span role="row" className={cost === undefined ? "unknown" : ""} key={`${hours}-${index}`}>
            <small role="cell">{hours} h</small>
            <strong role="cell">{cost === undefined ? "?" : `${cost} Fr.`}</strong>
          </span>
        ))}
      </div>
      <div className="duration-price-steps" aria-live="polite">
        <span><small>Δ</small><strong>({secondCost} − {firstCost}) ÷ ({secondHours} − {firstHours}) = {hourlyRate} Fr./h</strong></span>
        <span><small>+</small><strong>{baseFee} + {targetHours} · {hourlyRate} = {targetCost} Fr.</strong></span>
      </div>
      <p className="concept-playground-equation">{question.explanation}</p>
    </div>
  )
}

function MoneyRelationshipPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const labels = question.visual?.labels ?? ["Kategorie 1", "Kategorie 2", "Kategorie 3"]
  const prices = values.slice(0, 3).map((value) => Math.max(1, value))
  const initialCategory = question.visual?.variant === "unit-count" ? Math.round(values[3] ?? 0) : 0
  const generatedCounts = question.visual?.variant === "group-total" ? values.slice(3, 6) : []
  const [category, setCategory] = useState(Math.min(2, Math.max(0, initialCategory)))
  const [count, setCount] = useState(Math.max(1, Math.round(question.visual?.variant === "unit-count" ? values[4] ?? 24 : generatedCounts[0] ?? 3)))
  const [direction, setDirection] = useState<"forward" | "reverse">("forward")
  const model = buildMoneyRelationshipModel(prices[category]!, count)
  const selectCategory = (index: number) => {
    setCategory(index)
    if (generatedCounts[index]) setCount(Math.round(generatedCounts[index]!))
  }

  return (
    <div className="concept-playground money-relationship-playground">
      <div className="concept-playground-prompt"><span>{c.moneyPrompt}</span><strong>{c.moneyBody}</strong></div>
      <div className="money-category-picker" aria-label={c.priceCategoryAria}>{prices.map((price, index) => <button type="button" className={category === index ? "selected" : ""} aria-pressed={category === index} onClick={() => selectCategory(index)} key={labels[index]}><strong>{labels[index]}</strong><small>{price} Fr.</small></button>)}</div>
      <div className="money-direction-picker"><button type="button" className={direction === "forward" ? "selected" : ""} aria-pressed={direction === "forward"} onClick={() => setDirection("forward")}>{c.priceTimesQuantity}</button><button type="button" className={direction === "reverse" ? "selected" : ""} aria-pressed={direction === "reverse"} onClick={() => setDirection("reverse")}>{c.revenueDividedPrice}</button></div>
      <div className="money-relationship" aria-live="polite">{direction === "forward" ? <><span><small>{c.price}</small><strong>{model.price} Fr.</strong></span><i>×</i><span><small>{c.quantity}</small><strong>{model.count}</strong></span><i>=</i><span><small>{c.revenue}</small><strong>{model.revenue} Fr.</strong></span></> : <><span><small>{c.revenue}</small><strong>{model.revenue} Fr.</strong></span><i>÷</i><span><small>{c.price}</small><strong>{model.price} Fr.</strong></span><i>=</i><span><small>{c.quantity}</small><strong>{model.count}</strong></span></>}</div>
      <label className="concept-playground-range" htmlFor="money-count"><span>{c.changeQuantity}</span><input id="money-count" type="range" min={1} max={100} step={1} value={count} aria-valuetext={c.admissionsValue(count, model.revenue)} onChange={(event) => setCount(Number(event.target.value))} /></label>
    </div>
  )
}

function RevenueBundlePlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const childPrice = values[0] ?? 8
  const adultPrice = values[1] ?? 20
  const [ratio, setRatio] = useState(Math.max(1, Math.round(values[4] ?? 2)))
  const [packages, setPackages] = useState(Math.max(1, Math.round(values[6] ?? 20)))
  const model = buildRevenueBundleModel(childPrice, adultPrice, ratio, packages)

  return (
    <div className="concept-playground revenue-bundle-playground">
      <div className="concept-playground-prompt"><span>{c.bundlePrompt}</span><strong>{c.bundleBody}</strong></div>
      <div className="bundle-tickets" aria-label={c.bundleAria(ratio)}>{Array.from({ length: ratio }, (_, index) => <span className="child" key={index}>{c.child}<br /><strong>{childPrice} Fr.</strong></span>)}<span className="adult">{c.adult}<br /><strong>{adultPrice} Fr.</strong></span></div>
      <div className="bundle-equation" aria-live="polite"><span><small>{c.oneBundle}</small><strong>{ratio} · {childPrice} + {adultPrice} = {model.bundlePrice} Fr.</strong></span><i>× {packages}</i><span><small>{c.allBundles}</small><strong>{model.revenue} Fr.</strong><em>{model.childCount} {c.children} · {model.adultCount} {c.adults}</em></span></div>
      <div className="bundle-playground-controls"><label htmlFor="bundle-ratio"><span>{c.childrenPerBundle}</span><strong>{ratio}</strong><input id="bundle-ratio" type="range" min={1} max={4} step={1} value={ratio} onChange={(event) => setRatio(Number(event.target.value))} /></label><label htmlFor="bundle-count"><span>{c.bundleCount}</span><strong>{packages}</strong><input id="bundle-count" type="range" min={1} max={60} step={1} value={packages} onChange={(event) => setPackages(Number(event.target.value))} /></label></div>
    </div>
  )
}

function CoinCombinationPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const denominations: [number, number, number] = [values[0] ?? 5, values[1] ?? 2, values[2] ?? 1]
  const [total, setTotal] = useState(Math.round(values[3] ?? 20))
  const model = buildCoinCombinationModel(denominations, total)

  return (
    <div className="concept-playground coin-combination-playground">
      <div className="concept-playground-prompt"><span>{c.coinPrompt}</span><strong>{c.coinBody}</strong></div>
      <div className="combination-summary"><span><small>{c.targetAmount}</small><strong>{total} Fr.</strong></span><i aria-hidden="true">→</i><span><small>{c.completeCount}</small><strong>{model.solutions.length}</strong></span></div>
      <div className="combination-table" role="table" aria-label={c.combinationsAria(model.solutions.length, total)}><div role="row"><strong role="columnheader">{denominations[0]} Fr.</strong><strong role="columnheader">{denominations[1]} Fr.</strong><strong role="columnheader">{denominations[2]} Fr.</strong></div>{model.solutions.map((solution) => <div role="row" key={solution.join("-")}><span role="cell">{solution[0]}</span><span role="cell">{solution[1]}</span><span role="cell">{solution[2]}</span></div>)}</div>
      <label className="concept-playground-range" htmlFor="combination-total"><span>{c.changeTarget}</span><input id="combination-total" type="range" min={denominations[0] + denominations[1] + denominations[2]} max={35} step={1} value={total} aria-valuetext={c.combinationsValue(total, model.solutions.length)} onChange={(event) => setTotal(Number(event.target.value))} /></label>
    </div>
  )
}

function NumberFilterPlayground({ question }: { question: GeneratedQuestion }) {
  if ((question.visual?.values?.length ?? 0) >= 9) {
    return <RepeatedDigitFilterPlayground question={question} />
  }
  return <UniqueDigitFilterPlayground question={question} />
}

function UniqueDigitFilterPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const digits: [number, number, number, number] = [values[0] ?? 1, values[1] ?? 2, values[2] ?? 3, values[3] ?? 4]
  const divisor = Math.max(1, Math.round(values[4] ?? 4))
  const relation = question.visual?.variant === "less" ? "less" : "greater"
  const model = buildNumberFilterModel(digits, divisor, relation)
  const [stage, setStage] = useState(0)
  const visible = stage === 0 ? model.candidates : stage === 1 ? model.divisible : model.solutions
  const relationSign = relation === "greater" ? ">" : "<"

  return (
    <div className="concept-playground number-filter-playground">
      <div className="concept-playground-prompt"><span>{c.filterPrompt}</span><strong>{c.filterBody}</strong></div>
      <div className="number-filter-stages" aria-label={c.filterStageAria}><button type="button" className={stage === 0 ? "selected" : ""} aria-pressed={stage === 0} onClick={() => setStage(0)}>1 · {model.candidates.length} {c.arrangements}</button><button type="button" className={stage === 1 ? "selected" : ""} aria-pressed={stage === 1} onClick={() => setStage(1)}>2 · {c.divisibleBy(divisor)}</button><button type="button" className={stage === 2 ? "selected" : ""} aria-pressed={stage === 2} onClick={() => setStage(2)}>3 · T {relationSign} E</button></div>
      <div className="number-candidate-cloud" aria-live="polite">{visible.map((value) => <span key={value}>{value}</span>)}</div>
      <p className="concept-playground-equation">{model.candidates.length} → {model.divisible.length} → {model.solutions.length} {c.completeSolutions}</p>
    </div>
  )
}

function RepeatedDigitFilterPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const digits: [number, number, number, number] = [values[0] ?? 1, values[1] ?? 3, values[2] ?? 5, values[3] ?? 7]
  const divisor = Math.max(1, Math.round(values[4] ?? 5))
  const digitSum = Math.round(values[5] ?? 16)
  const lowerBound = Math.round(values[6] ?? 3_000)
  const relation = question.visual?.variant === "less" ? "less" : "greater"
  const model = buildRepeatedDigitFilterModel(digits, divisor, digitSum, lowerBound, relation)
  const labels = question.visual?.labels ?? []
  const [stage, setStage] = useState(0)
  const stages = [
    model.candidates,
    model.divisibleAndAboveBound,
    model.matchingDigitSum,
    model.solutions,
  ]
  const visible = stages[stage]!
  const displayed = visible.slice(0, 60)

  return (
    <div className="concept-playground number-filter-playground repeated-digit-playground">
      <div className="concept-playground-prompt"><span>{question.answerLabel}</span><strong>{question.hint}</strong><small>{question.easierExplanation}</small></div>
      <div className="number-filter-stages" aria-label={c.filterStageAria}>
        {labels.slice(0, 4).map((label, index) => (
          <button type="button" className={stage === index ? "selected" : ""} aria-pressed={stage === index} onClick={() => setStage(index)} key={label}>{index + 1} · {label}</button>
        ))}
      </div>
      <div className="number-candidate-cloud" aria-live="polite">
        {displayed.map((value) => <span key={value}>{value}</span>)}
        {visible.length > displayed.length ? <strong>+ {visible.length - displayed.length}</strong> : null}
      </div>
      <p className="concept-playground-equation">{stages.map((valuesAtStage) => valuesAtStage.length).join(" → ")} {c.completeSolutions}</p>
    </div>
  )
}

function InteractiveTileBoard({
  columns,
  rows,
  placements,
  label,
}: {
  columns: number
  rows: number
  placements: readonly LargeTilePlacement[]
  label: string
}) {
  return (
    <div
      className="interactive-tile-board"
      style={{ "--tile-columns": columns, "--tile-rows": rows } as CSSProperties}
      role="img"
      aria-label={label}
    >
      {Array.from({ length: columns * rows }, (_, index) => (
        <span
          className="tile-unit"
          style={{
            gridColumn: index % columns + 1,
            gridRow: Math.floor(index / columns) + 1,
          }}
          aria-hidden="true"
          key={`unit-${index}`}
        />
      ))}
      {placements.map((placement, index) => (
        <strong
          className="tile-large"
          style={{
            gridColumn: `${placement.column + 1} / span 2`,
            gridRow: `${placement.row + 1} / span 2`,
          }}
          aria-hidden="true"
          key={`large-${placement.row}-${placement.column}`}
        >{index + 1}</strong>
      ))}
    </div>
  )
}

function AreaFractionPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const columns = question.visual?.columns ?? 6
  const rows = question.visual?.rows ?? 4
  const capacity = Math.floor(columns / 2) * Math.floor(rows / 2)
  const initialCount = Math.min(capacity, Math.max(0, Math.round(question.visual?.values?.[0] ?? 2)))
  const [largeCount, setLargeCount] = useState(initialCount)
  const model = buildAreaFractionModel(columns, rows, largeCount)

  return (
    <div className="concept-playground area-fraction-playground">
      <div className="concept-playground-prompt"><span>{c.areaPrompt}</span><strong>{c.areaBody}</strong></div>
      <InteractiveTileBoard columns={columns} rows={rows} placements={model.placements} label={c.largeTilesAria(model.largeCount, model.greyCells, model.totalCells)} />
      <div className="area-count-equation" aria-live="polite"><span><small>{c.total}</small><strong>{model.totalCells}</strong></span><i aria-hidden="true">−</i><span><small>{c.grey}</small><strong>{model.largeCount} · 4 = {model.greyCells}</strong></span><i aria-hidden="true">=</i><span><small>{c.white}</small><strong>{model.whiteCells}</strong></span></div>
      <div className="fraction-reduction" aria-live="polite"><span>{c.whiteShare}</span><strong>{model.whiteCells}/{model.totalCells}</strong><i aria-hidden="true">{c.fullyReduced}</i><strong>{model.numerator}/{model.denominator}</strong></div>
      <label className="concept-playground-range" htmlFor="area-large-count"><span>{c.changeLargeTiles}</span><input id="area-large-count" type="range" min={0} max={capacity} step={1} value={largeCount} aria-valuetext={c.largeTileValue(largeCount, model.numerator, model.denominator)} onChange={(event) => setLargeCount(Number(event.target.value))} /></label>
    </div>
  )
}

function TilingCostPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const columns = question.visual?.columns ?? 6
  const rows = question.visual?.rows ?? 4
  const values = question.visual?.values ?? []
  const [smallCost, setSmallCost] = useState(Math.max(1, Math.round(values[0] ?? 5)))
  const [largeCost, setLargeCost] = useState(Math.max(1, Math.round(values[1] ?? 15)))
  const model = buildTilingCostModel(columns, rows, smallCost, largeCost)
  const strategyText = model.strategy === "large"
    ? c.tilingLargeStrategy
    : model.strategy === "small"
      ? c.tilingSmallStrategy
      : c.tilingEqualStrategy

  return (
    <div className="concept-playground tiling-cost-playground">
      <div className="concept-playground-prompt"><span>{c.tilingPrompt}</span><strong>{c.tilingBody}</strong></div>
      <div className="tile-price-comparison" aria-live="polite"><span><small>{c.fourSmall}</small><strong>4 · {smallCost} = {model.fourSmallCost} Fr.</strong></span><i aria-hidden="true">{model.largeCost < model.fourSmallCost ? ">" : model.largeCost > model.fourSmallCost ? "<" : "="}</i><span><small>{c.oneLarge}</small><strong>{largeCost} Fr.</strong></span></div>
      <p className={`tiling-strategy ${model.strategy}`}>{strategyText}</p>
      <InteractiveTileBoard columns={columns} rows={rows} placements={model.placements} label={c.optimalTilingAria(model.largeCount, model.smallCount)} />
      <div className="tile-cost-controls">
        <label htmlFor="small-tile-cost"><span>{c.smallPrice}</span><strong>{smallCost} Fr.</strong><input id="small-tile-cost" type="range" min={1} max={10} step={1} value={smallCost} onChange={(event) => setSmallCost(Number(event.target.value))} /></label>
        <label htmlFor="large-tile-cost"><span>{c.largePrice}</span><strong>{largeCost} Fr.</strong><input id="large-tile-cost" type="range" min={1} max={40} step={1} value={largeCost} onChange={(event) => setLargeCost(Number(event.target.value))} /></label>
      </div>
      <p className="concept-playground-equation">{model.largeCount} · {largeCost} + {model.smallCount} · {smallCost} = {model.totalCost} Fr.</p>
    </div>
  )
}

type CompositePlaygroundModel =
  | ReturnType<typeof buildFrameAreaModel>
  | ReturnType<typeof buildCornerCutoutModel>
  | ReturnType<typeof buildNotchPerimeterModel>

function CompositeShapeDiagram({ model }: { model: CompositePlaygroundModel }) {
  const { c } = useConceptPlaygroundLocalization()
  const x = 30
  const y = 20
  const drawingWidth = 260
  const drawingHeight = 180
  const scaleX = drawingWidth / model.width
  const scaleY = drawingHeight / model.height

  if (model.variant === "frame") {
    return (
      <svg className="composite-shape-diagram" viewBox="0 0 320 220" role="img" aria-label={c.frameAria(model.width, model.height, model.border)}>
        <rect className="composite-outer" x={x} y={y} width={drawingWidth} height={drawingHeight} rx="4" />
        <rect className="composite-cutout" x={x + model.border * scaleX} y={y + model.border * scaleY} width={model.innerWidth * scaleX} height={model.innerHeight * scaleY} rx="3" />
      </svg>
    )
  }

  if (model.variant === "corner") {
    const cutX = x + (model.width - model.cutWidth) * scaleX
    const cutY = y + model.cutHeight * scaleY
    const path = `M ${x} ${y} H ${cutX} V ${cutY} H ${x + drawingWidth} V ${y + drawingHeight} H ${x} Z`
    return <svg className="composite-shape-diagram" viewBox="0 0 320 220" role="img" aria-label={c.cutoutAria(model.cutWidth, model.cutHeight)}><path className="composite-outer" d={path} /><path className="composite-cut-guide" d={`M ${cutX} ${y} V ${cutY} H ${x + drawingWidth}`} /></svg>
  }

  const notchLeft = x + (model.width - model.notchWidth) / 2 * scaleX
  const notchRight = notchLeft + model.notchWidth * scaleX
  const notchBottom = y + model.notchDepth * scaleY
  const path = `M ${x} ${y} H ${notchLeft} V ${notchBottom} H ${notchRight} V ${y} H ${x + drawingWidth} V ${y + drawingHeight} H ${x} Z`
  return <svg className="composite-shape-diagram" viewBox="0 0 320 220" role="img" aria-label={c.notchAria(model.notchWidth, model.notchDepth)}><path className="composite-outer" d={path} /><path className="composite-cut-guide" d={`M ${notchLeft} ${y} V ${notchBottom} H ${notchRight} V ${y}`} /></svg>
}

function CompositeAreaPlayground({ question }: { question: GeneratedQuestion }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const variant = question.visual?.variant === "frame" || question.visual?.variant === "notch"
    ? question.visual.variant
    : "corner"
  const width = values[0] ?? 16
  const height = values[1] ?? 12
  const [horizontal, setHorizontal] = useState(Math.max(1, values[2] ?? 3))
  const [vertical, setVertical] = useState(Math.max(1, values[3] ?? 3))
  const model: CompositePlaygroundModel = variant === "frame"
    ? buildFrameAreaModel(width, height, Math.min(horizontal, (Math.min(width, height) - 1) / 2))
    : variant === "notch"
      ? buildNotchPerimeterModel(width, height, Math.min(horizontal, width - 1), Math.min(vertical, height - 1))
      : buildCornerCutoutModel(width, height, Math.min(horizontal, width - 1), Math.min(vertical, height - 1))
  const equation = model.variant === "frame"
    ? `${model.outerArea} − ${model.innerArea} = ${model.result} cm²`
    : model.variant === "corner"
      ? `${model.outerArea} − ${model.cutArea} = ${model.result} cm²`
      : `${model.originalPerimeter} + 2 · ${model.notchDepth} = ${model.result} cm`

  return (
    <div className="concept-playground composite-area-playground">
      <div className="concept-playground-prompt"><span>{model.variant === "notch" ? c.perimeterPrompt : c.areaCutPrompt}</span><strong>{model.variant === "notch" ? c.perimeterBody : c.areaCutBody}</strong></div>
      <CompositeShapeDiagram model={model} />
      <div className="composite-controls">
        <label htmlFor="composite-horizontal"><span>{model.variant === "frame" ? c.borderWidth : model.variant === "corner" ? c.cutoutWidth : c.notchWidth}</span><strong>{formatPlaygroundNumber(horizontal)} cm</strong><input id="composite-horizontal" type="range" min={1} max={model.variant === "frame" ? Math.floor((Math.min(width, height) - 1) / 2) : width - 1} step={1} value={horizontal} onChange={(event) => setHorizontal(Number(event.target.value))} /></label>
        {model.variant !== "frame" && <label htmlFor="composite-vertical"><span>{model.variant === "corner" ? c.cutoutHeight : c.notchDepth}</span><strong>{formatPlaygroundNumber(vertical)} cm</strong><input id="composite-vertical" type="range" min={1} max={height - 1} step={1} value={vertical} onChange={(event) => setVertical(Number(event.target.value))} /></label>}
      </div>
      <p className="concept-playground-equation" aria-live="polite">{equation}</p>
    </div>
  )
}

function PyramidRollPlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const orientation = {
    bottom: Math.round(values[0] ?? 4),
    left: Math.round(values[1] ?? 2),
    right: Math.round(values[2] ?? 1),
    back: Math.round(values[3] ?? 3),
  }
  const normalizedDirection = (value: string): PyramidRollDirection | undefined => (
    value === "left" || value === "right" || value === "back"
      ? value
      : value === "links"
        ? "left"
        : value === "rechts"
          ? "right"
          : value === "hinten"
            ? "back"
            : undefined
  )
  const initialDirections = (question.visual?.arrows ?? []).flatMap((value) => {
    const direction = normalizedDirection(value)
    return direction ? [direction] : []
  })
  const [directions, setDirections] = useState<PyramidRollDirection[]>(initialDirections)
  const path = buildPyramidRollPath(orientation, directions)
  const current = path.finalOrientation
  const lastStep = path.steps.at(-1)
  const missingLeft = findMissingPyramidFace([orientation.bottom, orientation.right, orientation.back])
  const labels: Record<PyramidRollDirection, string> = { left: c.left, right: c.right, back: c.back }
  const edgeLabels: Record<PyramidRollDirection, string> = { left: c.edgeLeft, right: c.edgeRight, back: c.edgeBack }
  const appendDirection = (direction: PyramidRollDirection) => {
    setDirections((currentDirections) => currentDirections.length >= 6
      ? currentDirections
      : [...currentDirections, direction])
  }

  return (
    <div className="concept-playground pyramid-roll-playground">
      <div className="concept-playground-prompt"><span>{c.pyramidPrompt}</span><strong>{c.pyramidBody}</strong></div>
      <div className="pyramid-roll-stage" aria-live="polite">
        <div className="pyramid-orientation-map" role="img" aria-label={c.currentOrientation(current.bottom, current.left, current.right, current.back)}><span className="back"><small>{c.back}</small><strong>{current.back}</strong></span><span className="left"><small>{c.left}</small><strong>{current.left}</strong></span><span className="bottom"><small>{c.down}</small><strong>{current.bottom}</strong></span><span className="right"><small>{c.right}</small><strong>{current.right}</strong></span></div>
        <i aria-hidden="true">→</i>
        <div className="pyramid-new-base"><small>{lastStep ? c.stepDirection(directions.length, labels[lastStep.direction]) : c.startOrientation}</small><strong>{c.face} {current.bottom}</strong><span>{c.liesDown}</span></div>
      </div>
      <div className="pyramid-direction-picker" aria-label={c.nextEdgeAria}>{(["left", "right", "back"] as const).map((candidate) => <button type="button" className={lastStep?.direction === candidate ? "selected" : ""} disabled={directions.length >= 6} onClick={() => appendDirection(candidate)} key={candidate}>{c.acrossEdge(edgeLabels[candidate])}</button>)}</div>
      <div className="pyramid-path-history" aria-label={c.pathAria}>
        <span><small>{c.visualStart}</small><strong>{orientation.bottom}</strong></span>
        {path.steps.map((step, index) => <span key={`${step.direction}-${index}`}><small>{index + 1}. {labels[step.direction]}</small><strong>{step.newBottom}</strong></span>)}
      </div>
      <div className="pyramid-path-actions">
        <button type="button" disabled={directions.length === 0} onClick={() => setDirections((currentDirections) => currentDirections.slice(0, -1))}>{c.lastStepBack}</button>
        <button type="button" disabled={directions.length === 0} onClick={() => setDirections([])}>{c.toStart}</button>
      </div>
      {(question.visual?.labels?.[1] === "gesucht" || question.visual?.labels?.[1] === "unknown") && <p className="pyramid-missing-rule">{c.missingStartFace(orientation.bottom, orientation.right, orientation.back)} → <strong>{missingLeft}</strong></p>}
      <p className="concept-playground-equation">{directions.length === 0 ? c.startBase(orientation.bottom) : `${c.basesAfter}: ${path.supportingFaces.join(" → ")}`}</p>
    </div>
  )
}

function CuboidSurfacePlayground({ question }: { question: GeneratedQuestion }) {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const values = question.visual?.values ?? []
  const [arrangement, setArrangement] = useState<CuboidArrangement>("side-by-side")

  if (question.visual?.variant === "missing-edge") {
    const baseArea = (values[0] ?? 0) * (values[1] ?? 0)
    return (
      <div className="concept-playground cuboid-surface-playground missing-edge-playground">
        <div className="concept-playground-prompt"><span>{question.answerLabel}</span><strong>{question.hint}</strong><small>{question.easierExplanation}</small></div>
        <div className="module-dimensions">
          <span><small>{c.length}</small><strong>{formatPlaygroundNumber(values[0] ?? 0)} cm</strong></span>
          <span><small>{c.width}</small><strong>{formatPlaygroundNumber(values[1] ?? 0)} cm</strong></span>
          <span><small>{c.height}</small><strong>?</strong></span>
        </div>
        <div className="surface-face-pairs" aria-live="polite">
          <span><small>{c.topBottom}</small><strong>{formatPlaygroundNumber(values[0] ?? 0)} · {formatPlaygroundNumber(values[1] ?? 0)} = {formatPlaygroundNumber(baseArea)} cm²</strong></span>
          <span><small>cm³ ÷ cm²</small><strong>{formatPlaygroundNumber(values[2] ?? 0)} ÷ {formatPlaygroundNumber(baseArea)} = {formatPlaygroundNumber(values[3] ?? 0)} cm</strong></span>
        </div>
        <p className="concept-playground-equation">{question.explanation}</p>
      </div>
    )
  }

  const dimensions = recoverCuboidModuleDimensions(values[0] ?? 20, values[1] ?? 8, values[2] ?? 240)
  const model = buildCuboidSurfaceModel(dimensions.length, dimensions.width, dimensions.height, arrangement)
  const arrangementLabel = arrangement === "side-by-side" ? c.sideBySide : c.endToEnd

  return (
    <div className="concept-playground cuboid-surface-playground">
      <div className="concept-playground-prompt"><span>{c.cuboidPrompt}</span><strong>{c.cuboidBody}</strong></div>
      <div className="module-dimensions"><span><small>{c.length}</small><strong>{formatPlaygroundNumber(dimensions.length)} cm</strong></span><span><small>{c.width}</small><strong>{formatPlaygroundNumber(dimensions.width)} cm</strong></span><span><small>{c.height}</small><strong>{formatPlaygroundNumber(dimensions.height)} cm</strong></span></div>
      <div className="cuboid-arrangement-picker"><button type="button" className={arrangement === "side-by-side" ? "selected" : ""} aria-pressed={arrangement === "side-by-side"} onClick={() => setArrangement("side-by-side")}>{c.sideBySide}</button><button type="button" className={arrangement === "end-to-end" ? "selected" : ""} aria-pressed={arrangement === "end-to-end"} onClick={() => setArrangement("end-to-end")}>{c.endToEnd}</button></div>
      <div className={`cuboid-module-layout ${arrangement}`} role="img" aria-label={c.cuboidAria(arrangementLabel, model.arrangedLength, model.arrangedWidth, model.arrangedHeight)}><span>A</span><span>B</span></div>
      <div className="surface-face-pairs" aria-live="polite"><span><small>{c.topBottom}</small><strong>2 · {formatPlaygroundNumber(model.topBottomArea)}</strong></span><span><small>{c.frontBack}</small><strong>2 · {formatPlaygroundNumber(model.frontBackArea)}</strong></span><span><small>{c.leftRight}</small><strong>2 · {formatPlaygroundNumber(model.sideArea)}</strong></span></div>
      <p className="concept-playground-equation">2 · ({formatPlaygroundNumber(model.topBottomArea)} + {formatPlaygroundNumber(model.frontBackArea)} + {formatPlaygroundNumber(model.sideArea)}) = {formatPlaygroundNumber(model.surface)} cm²</p>
    </div>
  )
}

function MassConversionPlayground() {
  const { c, formatPlaygroundNumber } = useConceptPlaygroundLocalization()
  const [quarterKilograms, setQuarterKilograms] = useState(6)
  const model = buildMassConversionModel(quarterKilograms)

  return (
    <div className="concept-playground mass-conversion-playground">
      <div className="concept-playground-prompt">
        <span>{c.massPrompt}</span>
        <strong>{c.massBody}</strong>
      </div>
      <div className="mass-equivalence" aria-live="polite">
        <span><strong>{formatPlaygroundNumber(model.kilograms)}</strong><small>kg</small></span>
        <i aria-hidden="true">× 1000</i>
        <span><strong>{model.grams}</strong><small>g</small></span>
      </div>
      <label className="concept-playground-range" htmlFor="mass-playground-range">
        <span>{c.changeKilograms}</span>
        <input
          id="mass-playground-range"
          type="range"
          min={1}
          max={32}
          step={1}
          value={quarterKilograms}
          aria-label={c.changeKilograms}
          aria-valuetext={c.massValue(formatPlaygroundNumber(model.kilograms), model.grams)}
          onChange={(event) => setQuarterKilograms(Number(event.target.value))}
        />
      </label>
      <p className="concept-playground-equation">
        {formatPlaygroundNumber(model.kilograms)} · 1000 = {model.grams}
      </p>
    </div>
  )
}

function FractionQuantityPlayground({ reverse }: { reverse: boolean }) {
  const { c } = useConceptPlaygroundLocalization()
  const [denominator, setDenominator] = useState(4)
  const [numerator, setNumerator] = useState(3)
  const model = buildFractionQuantityModel(numerator, denominator)
  const changeDenominator = (next: number) => {
    setDenominator(next)
    setNumerator((current) => Math.min(current, next))
  }

  return (
    <div className="concept-playground fraction-quantity-playground">
      <div className="concept-playground-prompt">
        <span>{reverse ? c.fractionReversePrompt : c.fractionForwardPrompt}</span>
        <strong>{c.fractionBody}</strong>
      </div>
      <div
        className="fraction-playground-bar"
        style={{ "--fraction-denominator": denominator } as CSSProperties}
        aria-label={c.fractionMarked(numerator, denominator)}
      >
        {Array.from({ length: denominator }, (_, index) => (
          <span className={index < numerator ? "filled" : ""} key={index} />
        ))}
      </div>
      <div className="fraction-playground-controls">
        <label htmlFor="fraction-playground-numerator">
          <span>{c.numerator}</span>
          <strong>{numerator}</strong>
          <input
            id="fraction-playground-numerator"
            type="range"
            min={1}
            max={denominator}
            step={1}
            value={numerator}
            onChange={(event) => setNumerator(Number(event.target.value))}
          />
        </label>
        <label htmlFor="fraction-playground-denominator">
          <span>{c.denominator}</span>
          <strong>{denominator}</strong>
          <input
            id="fraction-playground-denominator"
            type="range"
            min={2}
            max={8}
            step={1}
            value={denominator}
            onChange={(event) => changeDenominator(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="fraction-playground-path" aria-live="polite">
        {reverse ? (
          <>
            <span><small>{c.known}</small><strong>{c.parts(numerator)} = {model.knownPart}</strong></span>
            <i aria-hidden="true">÷ {numerator}</i>
            <span><small>{c.onePart}</small><strong>{model.onePart}</strong></span>
            <i aria-hidden="true">× {denominator}</i>
            <span><small>{c.whole}</small><strong>{model.whole}</strong></span>
          </>
        ) : (
          <>
            <span><small>{c.whole}</small><strong>{model.whole}</strong></span>
            <i aria-hidden="true">÷ {denominator}</i>
            <span><small>{c.onePart}</small><strong>{model.onePart}</strong></span>
            <i aria-hidden="true">× {numerator}</i>
            <span><small>{c.parts(numerator)}</small><strong>{model.knownPart}</strong></span>
          </>
        )}
      </div>
    </div>
  )
}

function isCoordinateTransformation(value: string | undefined): value is CoordinateTransformation {
  return coordinatePlaygroundRules.some((rule) => rule.id === value)
}

function CoordinatePlayground({ question }: { question: GeneratedQuestion }) {
  const { c } = useConceptPlaygroundLocalization()
  const visualRule = question.visual?.variant
  const [transformation, setTransformation] = useState<CoordinateTransformation>(
    isCoordinateTransformation(visualRule) ? visualRule : "reflect-y",
  )
  const [x, setX] = useState(2)
  const [y, setY] = useState(2)
  const image = transformCoordinatePoint({ x, y }, transformation)
  const selectedRule = coordinatePlaygroundRules.find((rule) => rule.id === transformation)!
  const ruleLabels: Record<CoordinateTransformation, string> = {
    "reflect-y": c.reflectY,
    "reflect-x": c.reflectX,
    "reflect-origin": c.reflectOrigin,
    "rotate-cw": c.rotateCw,
    "rotate-ccw": c.rotateCcw,
    translate: c.translate,
  }
  const gridValues = Array.from({ length: 13 }, (_, index) => index - 6)
  const position = (value: number) => 180 + value * 24

  return (
    <div className="concept-playground coordinate-playground">
      <div className="concept-playground-prompt">
        <span>{c.coordinatePrompt}</span>
        <strong>{c.coordinateBody}</strong>
      </div>
      <div className="coordinate-playground-rules" aria-label={c.coordinateRuleAria}>
        {coordinatePlaygroundRules.map((rule) => (
          <button
            type="button"
            key={rule.id}
            className={transformation === rule.id ? "selected" : ""}
            aria-pressed={transformation === rule.id}
            onClick={() => setTransformation(rule.id)}
          >
            <strong>{ruleLabels[rule.id]}</strong><small>{rule.notation}</small>
          </button>
        ))}
      </div>
      <svg
        className="coordinate-playground-plane"
        viewBox="0 0 360 360"
        role="img"
        aria-label={c.coordinatePointAria(x, y, image.x, image.y)}
      >
        {gridValues.map((value) => <line className="coordinate-grid-line" x1={position(value)} y1="36" x2={position(value)} y2="324" key={`v-${value}`} />)}
        {gridValues.map((value) => <line className="coordinate-grid-line" x1="36" y1={position(value)} x2="324" y2={position(value)} key={`h-${value}`} />)}
        <line className="coordinate-axis" x1="36" y1="180" x2="324" y2="180" />
        <line className="coordinate-axis" x1="180" y1="36" x2="180" y2="324" />
        <line className="coordinate-transform-arrow" x1={position(x)} y1={position(-y)} x2={position(image.x)} y2={position(-image.y)} />
        <circle className="coordinate-point" cx={position(x)} cy={position(-y)} r="9" />
        <circle className="coordinate-image-point" cx={position(image.x)} cy={position(-image.y)} r="9" />
        <text x={Math.min(300, position(x) + 12)} y={Math.max(48, position(-y) - 12)}>P</text>
        <text x={Math.min(300, position(image.x) + 12)} y={Math.min(318, position(-image.y) + 22)}>P′</text>
      </svg>
      <div className="coordinate-playground-controls">
        <label htmlFor="coordinate-playground-x"><span>{c.xOfP}</span><strong>{x}</strong><input id="coordinate-playground-x" type="range" min={-4} max={4} step={1} value={x} onChange={(event) => setX(Number(event.target.value))} /></label>
        <label htmlFor="coordinate-playground-y"><span>{c.yOfP}</span><strong>{y}</strong><input id="coordinate-playground-y" type="range" min={-4} max={4} step={1} value={y} onChange={(event) => setY(Number(event.target.value))} /></label>
      </div>
      <p className="concept-playground-equation" aria-live="polite">
        P({x} | {y}) → {selectedRule.notation} → P′({image.x} | {image.y})
      </p>
    </div>
  )
}

function LociPlayground({ question }: { question: GeneratedQuestion & { geometryConstruction: GeometryConstructionSpec } }) {
  const { c, locale } = useConceptPlaygroundLocalization()
  const [answer, setAnswer] = useState<GeometryConstructionAnswer>()
  const grade = gradeGeometryConstruction(question.geometryConstruction, answer)
  const localizedIssue = grade.issue
    ? localizeSupportIssue(
      grade.issue,
      question,
      locale,
      grade.methodCorrect ? "construction-precision" : "construction-method",
    )
    : undefined

  return (
    <div className="concept-playground loci-playground">
      <div className="concept-playground-prompt">
        <span>{c.lociPrompt}</span>
        <strong>{question.prompt}</strong>
      </div>
      <GeometryConstructionWorkbench
        spec={question.geometryConstruction}
        answer={answer}
        disabled={false}
        attention={Boolean(answer && !grade.correct)}
        onChange={setAnswer}
      />
      <div className={`concept-playground-feedback${grade.correct ? " correct" : ""}`} role="status">
        {!answer ? (
          <><strong>{c.lociQuestion}</strong><span>{c.lociInstruction}</span></>
        ) : grade.correct ? (
          <><strong>{c.lociCorrect}</strong><span>{question.explanation}</span></>
        ) : (
          <><strong>{localizedIssue?.title}</strong><span>{localizedIssue?.nextStep}</span></>
        )}
      </div>
    </div>
  )
}

function cubeRelationMessage(
  relation: ReturnType<typeof cubeFaceRelation>,
  candidate: string,
  locale: AppLocale,
): string {
  const c = conceptPlaygroundCopy(locale)
  switch (relation) {
    case "opposite":
      return c.cubeOpposite(candidate)
    case "net-neighbor":
      return c.cubeNetNeighbour(candidate)
    case "cube-neighbor":
      return c.cubeNeighbour(candidate)
    case "same":
      return c.cubeSame
  }
}

function CubeNetPlayground({ model }: { model: CubeNetPlaygroundModel }) {
  const { c, locale } = useConceptPlaygroundLocalization()
  const [targetLabel, setTargetLabel] = useState(model.initialTargetLabel)
  const [candidateLabel, setCandidateLabel] = useState<string>()
  const [showNetNeighbors, setShowNetNeighbors] = useState(false)
  const oppositeLabel = cubeOppositeLabel(model, targetLabel)
  const candidateRelation = candidateLabel
    ? cubeFaceRelation(model, targetLabel, candidateLabel)
    : undefined
  const facesByPosition = new Map(model.faces.map((face) => [face.position, face]))

  const chooseTarget = (label: string) => {
    setTargetLabel(label)
    setCandidateLabel(undefined)
  }

  return (
    <div className="concept-playground cube-net-playground">
      <div className="concept-playground-prompt">
        <span>{c.cubePrompt}</span>
        <strong>{c.cubeBody}</strong>
      </div>
      <div className="cube-target-picker" aria-label={c.cubeTargetAria}>
        <span>{c.startFace}</span>
        {model.faces.map((face) => (
          <button type="button" key={face.label} className={targetLabel === face.label ? "selected" : ""} aria-pressed={targetLabel === face.label} onClick={() => chooseTarget(face.label)}>{face.label}</button>
        ))}
      </div>
      <div className="cube-net-grid interactive" style={{ "--net-columns": model.columns, "--net-rows": model.rows } as CSSProperties}>
        {Array.from({ length: model.columns * model.rows }, (_, position) => {
          const face = facesByPosition.get(position)
          if (!face) return <i aria-hidden="true" key={position} />
          const relation = cubeFaceRelation(model, targetLabel, face.label)
          const selected = face.label === candidateLabel
          const classNames = [
            face.label === targetLabel ? "target" : "",
            showNetNeighbors && relation === "net-neighbor" ? "net-neighbor" : "",
            selected ? "selected-candidate" : "",
            selected && relation === "opposite" ? "correct" : "",
            selected && relation !== "opposite" ? "wrong" : "",
          ].filter(Boolean).join(" ")
          return (
            <button
              type="button"
              key={position}
              className={classNames}
              disabled={face.label === targetLabel}
              aria-label={face.label === targetLabel ? c.faceStartAria(face.label) : c.faceCandidateAria(face.label)}
              aria-pressed={selected}
              onClick={() => setCandidateLabel(face.label)}
            >
              {face.label}
            </button>
          )
        })}
      </div>
      <div className="cube-net-guide-actions">
        <button className="secondary-button compact" type="button" onClick={() => setShowNetNeighbors((current) => !current)}>
          {showNetNeighbors ? c.edgeMarksOff : c.markEdgeNeighbours}
        </button>
        <button className="text-button" type="button" onClick={() => setCandidateLabel(oppositeLabel)}>{c.showOpposite}</button>
      </div>
      <p className={`concept-playground-feedback${candidateRelation === "opposite" ? " correct" : ""}`} role="status">
        {candidateRelation
          ? cubeRelationMessage(candidateRelation, candidateLabel!, locale)
          : showNetNeighbors
            ? c.cubeMarkedHint
            : c.cubeStartHint}
      </p>
    </div>
  )
}

export function ConceptPlayground({
  topicId,
  question,
  fallbackVisual,
}: {
  topicId: TopicId
  question: GeneratedQuestion
  fallbackVisual: (typeof lessons)[TopicId]["pages"][number]["visual"]
}) {
  if (topicId === "arithmetic-equations") return <OperationChainPlayground question={question} />
  if (topicId === "efficient-arithmetic") return <EfficientArithmeticPlayground question={question} />
  if (topicId === "mass-units") return <MassConversionPlayground />
  if (topicId === "fraction-of-quantity") return <FractionQuantityPlayground reverse={false} />
  if (topicId === "time-fractions") return <TimeFractionPlayground question={question} />
  if (topicId === "speed-distance-time") return <MotionPlayground question={question} />
  if (topicId === "data-tables") return <DataTablePlayground question={question} />
  if (topicId === "money-calculations") return <MoneyRelationshipPlayground question={question} />
  if (topicId === "proportional-revenue") return <RevenueBundlePlayground question={question} />
  if (topicId === "integer-combinations") return <CoinCombinationPlayground question={question} />
  if (topicId === "number-constraints") return <NumberFilterPlayground question={question} />
  if (topicId === "area-fractions") return <AreaFractionPlayground question={question} />
  if (topicId === "composite-areas") return <CompositeAreaPlayground question={question} />
  if (topicId === "tiling-costs") return <TilingCostPlayground question={question} />
  if (topicId === "reverse-fractions") return <FractionQuantityPlayground reverse />
  if (topicId === "reverse-chains" && question.practiceSteps?.length) {
    return <ReverseChainPlayground steps={question.practiceSteps} />
  }
  if (topicId === "inverse-proportion") return <InverseSupplyPlayground question={question} />
  if (topicId === "changing-rates") return <ChangingSupplyPlayground question={question} />
  if (topicId === "coordinate-transformations") return <CoordinatePlayground question={question} />
  if (topicId === "geometric-loci" && question.geometryConstruction) {
    return <LociPlayground question={question as GeneratedQuestion & { geometryConstruction: GeometryConstructionSpec }} />
  }
  if (topicId === "cube-nets") {
    const model = buildCubeNetPlaygroundModel(question)
    if (model) return <CubeNetPlayground model={model} />
  }
  if (topicId === "spatial-rolling") return <PyramidRollPlayground question={question} />
  if (topicId === "cuboid-surface") return <CuboidSurfacePlayground question={question} />
  return <ConceptVisual visual={fallbackVisual} />
}

function LessonStage({
  task,
  pageIndex,
  onContinue,
  onBack,
}: {
  task: LearningTask
  pageIndex: number
  onContinue: () => void
  onBack: () => void
}) {
  const { locale, copy } = useLocalization()
  const contentLocale = task.contentLocale ?? locale
  const lesson = lessonForLocale(task.topicIds[0]!, contentLocale)
  const page = lesson.pages[pageIndex]!
  const archiveLessonExample = useMemo(() => {
    const sourceQuestion = generateQuestionsForTask(task).find((question) => question.provenance)
    if (!sourceQuestion?.provenance) return undefined
    return buildConceptRepairQuestions(
      sourceQuestion.topicId,
      `${task.seed}:archive-lesson-example`,
      sourceQuestion.prompt,
      5,
      contentLocale,
      sourceQuestion.provenance,
    ).example
  }, [contentLocale, task])
  const lessonBody = archiveLessonExample?.easierExplanation ?? page.body
  const lessonSteps = archiveLessonExample?.workedSteps ?? page.steps
  const lessonTakeaway = archiveLessonExample?.hint ?? page.takeaway

  return (
    <div className="lesson-stage">
      <div className="lesson-card">
        <div className="lesson-copy">
          <span className="eyebrow">{page.eyebrow}</span>
          <h1>{page.title}</h1>
          {archiveLessonExample && <p className="lesson-source-prompt">{archiveLessonExample.prompt}</p>}
          <p>{lessonBody}</p>
          <ol className="worked-list">
            {lessonSteps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <div className="takeaway"><span>{copy.player.takeaway}</span><strong>{lessonTakeaway}</strong></div>
        </div>
        {archiveLessonExample
          ? <ConceptPlayground topicId={archiveLessonExample.topicId} question={archiveLessonExample} fallbackVisual={page.visual} />
          : <ConceptVisual visual={page.visual} contentLocale={contentLocale} />}
      </div>
      <div className="stage-actions">
        <button className="secondary-button" type="button" onClick={onBack}>{copy.player.back}</button>
        <button className="primary-button" type="button" onClick={onContinue}>
          {pageIndex === lesson.pages.length - 1 ? copy.player.practiceNow : copy.player.continue}
        </button>
      </div>
    </div>
  )
}

function LocusQuestionVisual({ spec }: { spec: GeometryConstructionSpec }) {
  const { c } = useConceptPlaygroundLocalization()
  const boundaryNote = c.locusBoundaryMissing

  if (spec.reference.kind === "line") {
    return (
      <figure className="question-visual locus-question" data-locus-reference="line">
        <svg
          viewBox="0 0 640 300"
          role="img"
          aria-label={c.locusLineAria(spec.reference.label, boundaryNote)}
        >
          <title>{c.locusLineTitle}</title>
          <rect width="640" height="300" className="locus-given-paper" />
          <line className="locus-given-line" x1="64" y1="218" x2="576" y2="218" />
          <text className="locus-given-label line-label" x="82" y="194">{spec.reference.label}</text>
          <g className="locus-given-north" transform="translate(520 45)">
            <path d="M 0 48 L 0 0 M -9 13 L 0 0 9 13" />
            <text x="0" y="72">{c.north}</text>
          </g>
        </svg>
        <figcaption>
          <strong>{c.given}</strong>
          <span>{c.line} {spec.reference.label} · {c.directionNorth}</span>
          <em>{boundaryNote}</em>
        </figcaption>
      </figure>
    )
  }

  if (spec.reference.kind === "point") {
    const label = spec.reference.point.label
    return (
      <figure className="question-visual locus-question" data-locus-reference="point">
        <svg
          viewBox="0 0 640 300"
          role="img"
          aria-label={c.locusPointAria(label, boundaryNote)}
        >
          <title>{c.locusPointTitle}</title>
          <rect width="640" height="300" className="locus-given-paper" />
          <circle className="locus-given-point" cx="320" cy="145" r="9" />
          <text className="locus-given-label" x="343" y="130">{label}</text>
        </svg>
        <figcaption>
          <strong>{c.given}</strong>
          <span>{c.point} {label}</span>
          <em>{boundaryNote}</em>
        </figcaption>
      </figure>
    )
  }

  const { first, second } = spec.reference
  return (
    <figure className="question-visual locus-question" data-locus-reference="point-pair">
      <svg
        viewBox="0 0 640 300"
        role="img"
        aria-label={c.locusPairAria(first.label, second.label, boundaryNote)}
      >
        <title>{c.locusPairTitle}</title>
        <rect width="640" height="300" className="locus-given-paper" />
        <line className="locus-given-segment" x1="210" y1="150" x2="430" y2="150" />
        <circle className="locus-given-point" cx="210" cy="150" r="9" />
        <circle className="locus-given-point" cx="430" cy="150" r="9" />
        <text className="locus-given-label point-pair-label" x="210" y="122" textAnchor="middle">{first.label}</text>
        <text className="locus-given-label point-pair-label" x="430" y="122" textAnchor="middle">{second.label}</text>
      </svg>
      <figcaption>
        <strong>{c.given}</strong>
        <span>{c.points} {first.label} {c.and} {second.label}</span>
        <em>{boundaryNote}</em>
      </figcaption>
    </figure>
  )
}

function QuestionVisual({ question }: { question: GeneratedQuestion }) {
  const { copy, intlLocale } = useLocalization()
  const visual = question.visual
  if (!visual) return null
  const formatNumber = (value: number) => new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: 2,
  }).format(value)
  const formatDuration = (minutes: number) => {
    const wholeHours = Math.floor(minutes / 60)
    const remainingMinutes = minutes - wholeHours * 60
    if (wholeHours === 0) return `${formatNumber(remainingMinutes)} min`
    if (remainingMinutes === 0) return `${wholeHours} h`
    return `${wholeHours} h ${formatNumber(remainingMinutes)} min`
  }

  if (visual.kind === "fraction-bar") {
    return (
      <div className="question-visual fraction-question" role="img" aria-label={copy.player.visual.fractionParts(visual.numerator ?? 0, visual.denominator ?? 1)}>
        {Array.from({ length: visual.denominator ?? 1 }, (_, index) => (
          <span className={index < (visual.numerator ?? 0) ? "filled" : ""} key={index} />
        ))}
      </div>
    )
  }

  if (visual.kind === "mass-conversion") {
    return (
      <div className="question-visual conversion-question">
        <span>{visual.fromValue}</span><strong>→</strong><span>?</span><small>{visual.unit}</small>
      </div>
    )
  }

  if (visual.kind === "reverse-chain") {
    return (
      <div className="question-visual chain-question">
        {visual.labels?.map((label, index) => (
          <div key={label}><span>{index + 1}</span><strong>{label}</strong></div>
        ))}
      </div>
    )
  }

  if (visual.kind === "equation-balance") {
    return (
      <div className="question-visual equation-question" role="img" aria-label={copy.player.visual.equationAria}>
        <span>□</span><i>× {visual.values?.[0]}</i><span>?</span><i>÷ {visual.values?.[1]}</i><strong>{visual.values?.[2]}</strong>
      </div>
    )
  }

  if (visual.kind === "factor-pairs") {
    const [factor, left, right] = visual.values ?? []
    const operator = visual.variant === "difference" ? "−" : "+"
    return (
      <div className="question-visual factor-question" role="img" aria-label={copy.player.visual.factorAria}>
        <div><strong>{factor}</strong><span>· {left}</span></div>
        <i>{operator}</i>
        <div><strong>{factor}</strong><span>· {right}</span></div>
        <small>{copy.player.visual.factorQuestion}</small>
      </div>
    )
  }

  if (visual.kind === "clock") {
    const [totalMinutes, subtractMinutes, remainingMinutes] = visual.values ?? []
    const denominator = visual.denominator ?? 1
    const totalLabel = typeof totalMinutes === "number"
      ? formatDuration(totalMinutes)
      : copy.player.visual.unspecifiedTotal
    const subtractLabel = typeof subtractMinutes === "number"
      ? `${formatNumber(subtractMinutes)} min`
      : copy.player.visual.givenMinutes
    const remainingLabel = typeof remainingMinutes === "number"
      ? `${formatNumber(remainingMinutes)} min`
      : copy.player.visual.remainingTime

    return (
      <figure className="question-visual time-fraction-question">
        <ol
          className="time-fraction-flow"
          aria-label={copy.player.visual.timeFlowAria(totalLabel, denominator, subtractLabel, remainingLabel)}
        >
          <li className="time-fraction-value">
            <small>{copy.player.visual.totalTime}</small>
            <strong>{totalLabel}</strong>
          </li>
          <li className="time-fraction-operation">
            <small>{copy.player.visual.splitInto}</small>
            <strong>{copy.player.visual.equalParts(denominator)}</strong>
          </li>
          <li className="time-fraction-value unknown">
            <small>{copy.player.visual.wanted}</small>
            <strong>? {copy.player.visual.parts}</strong>
          </li>
          <li className="time-fraction-operation">
            <small>{copy.player.visual.subtractAfter}</small>
            <strong>− {subtractLabel}</strong>
          </li>
          <li className="time-fraction-value result">
            <small>{copy.player.visual.remaining}</small>
            <strong>{remainingLabel}</strong>
          </li>
        </ol>
        <figcaption>{copy.player.visual.timeCaption}</figcaption>
      </figure>
    )
  }

  if (visual.kind === "motion-model") {
    if (visual.variant === "catch-up") {
      return (
        <div className="question-visual motion-question catch-up-visual" role="img" aria-label={copy.player.visual.catchUpAria}>
          <div className="motion-lane"><span>{copy.player.visual.start}</span><i className="rider slow">{visual.values?.[0]} km/h</i><i className="rider fast">{visual.values?.[1]} km/h</i><span>{copy.player.visual.meetingPoint}</span></div>
          <small>{copy.player.visual.headStart(visual.values?.[2] ?? 0)}</small>
        </div>
      )
    }

    if (visual.variant === "return-home" || visual.variant === "late-start") {
      const values = visual.values ?? []
      const labels = visual.labels ?? []
      const isReturnHome = visual.variant === "return-home"
      const eventMinutes = isReturnHome
        ? 2 * (values[6] ?? 0) + (values[7] ?? 0)
        : values[6] ?? 0
      const eventLabel = isReturnHome
        ? copy.player.visual.timeUsed
        : copy.player.visual.delay
      return (
        <div
          className="question-visual motion-question timing-visual"
          role="img"
          aria-label={`${labels[0] ?? ""}: ${formatNumber(values[2] ?? 0)} km, ${formatDuration(values[1] ?? 0)}, ${formatNumber(values[0] ?? 0)} km/h. ${eventLabel}: ${formatDuration(eventMinutes)}. ${labels[1] ?? ""}: ${formatDuration(values[4] ?? 0)}.`}
        >
          <div>
            <span>{labels[0]}</span>
            <strong>{formatNumber(values[2] ?? 0)} km</strong>
            <small>{formatDuration(values[1] ?? 0)} · {formatNumber(values[0] ?? 0)} km/h</small>
          </div>
          <i aria-hidden="true">→</i>
          <div className="timing-event">
            <span aria-hidden="true">{isReturnHome ? "↩" : "⏱"}</span>
            <small>{eventLabel}</small>
            <strong>{formatDuration(eventMinutes)}</strong>
          </div>
          <i aria-hidden="true">→</i>
          <div>
            <span>{labels[1]}</span>
            <strong>{formatDuration(values[4] ?? 0)}</strong>
            <small>? km/h</small>
          </div>
        </div>
      )
    }

    return (
      <div className="question-visual motion-question" role="img" aria-label={copy.player.visual.tourAria}>
        <div><span>{copy.player.visual.section(1)}</span><strong>{visual.values?.[2]} km</strong><small>{visual.values?.[0]} km/h</small></div>
        <i>→</i>
        <div><span>{copy.player.visual.section(2)}</span><strong>{visual.values?.[5]} km</strong><small>{visual.values?.[3]} km/h</small></div>
      </div>
    )
  }

  if (visual.kind === "data-table") {
    const labels = visual.labels ?? []
    const values = visual.values ?? []

    if (visual.variant === "complement") {
      return (
        <div className="question-visual data-table-question">
          <table aria-label={copy.player.visual.campsAria}>
            <caption>{copy.player.visual.campsCaption}</caption>
            <thead>
              <tr><th /><th>{labels[0]}</th><th>{labels[1]}</th><th>{labels[2]}</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">{labels[3]}</th><td>{values[1]}</td><td>{values[2]}</td><td>{values[3]}</td></tr>
              <tr><th scope="row">{labels[4]}</th><td>{values[4]}</td><td>{values[5]}</td><td>{values[6]}</td></tr>
              <tr className="table-total-row"><th scope="row">{copy.player.visual.daysPerCamp}</th><td>{values[0]}</td><td>{values[0]}</td><td>{values[0]}</td></tr>
            </tbody>
          </table>
        </div>
      )
    }

    if (visual.variant === "missing-average") {
      return (
        <div className="question-visual data-table-question">
          <table aria-label={copy.player.visual.libraryAria}>
            <caption>{copy.player.visual.libraryCaption}</caption>
            <thead>
              <tr><th /><th>{labels[0]}</th><th>{labels[1]}</th><th>{labels[2]}</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">{copy.player.visual.loans}</th><td>{values[0]}</td><td>{values[1]}</td><td className="missing-cell">?</td></tr>
            </tbody>
            <tfoot>
              <tr><th scope="row">{labels[3]}</th><td colSpan={3}>{copy.player.visual.booksPerWeek(values[3] ?? 0)}</td></tr>
            </tfoot>
          </table>
        </div>
      )
    }

    return (
      <div className="question-visual data-table-question route-table-question">
        <table aria-label={copy.player.visual.routeAria}>
          <caption>{copy.player.visual.routeCaption}</caption>
          <thead><tr><th>{copy.player.visual.route}</th><th>{copy.player.visual.distance}</th></tr></thead>
          <tbody>
            <tr><th scope="row">{labels[0]}</th><td>{formatNumber(values[0] ?? 0)} km</td></tr>
            <tr><th scope="row">{labels[1]}</th><td className="missing-cell">?</td></tr>
            <tr className="table-total-row"><th scope="row">{labels[2]}</th><td>{formatNumber(values[2] ?? 0)} km</td></tr>
          </tbody>
        </table>
      </div>
    )
  }

  if (visual.kind === "price-table") {
    if (visual.variant === "duration-price") {
      const values = visual.values ?? []
      return (
        <div className="question-visual price-question duration-price-question">
          {[
            [values[2], values[0]],
            [values[3], values[1]],
            [values[4], undefined],
          ].map(([hours, price], index) => (
            <div className={price === undefined ? "missing-price" : ""} key={`${hours}-${index}`}>
              <span>{formatNumber(hours ?? 0)} h</span>
              <strong>{price === undefined ? "?" : `${formatNumber(price)} ${visual.unit ?? ""}`}</strong>
            </div>
          ))}
        </div>
      )
    }
    return (
      <div className="question-visual price-question">
        {visual.labels?.map((label, index) => (
          <div key={`${label}-${index}`}><span>{label}</span><strong>{visual.values?.[index]}</strong></div>
        ))}
      </div>
    )
  }

  if (visual.kind === "coin-combinations") {
    return (
      <div className="question-visual coin-question">
        {visual.values?.map((value, index) => (
          <div key={`${value}-${index}`}><strong>{value}</strong><small>Fr.</small></div>
        ))}
      </div>
    )
  }

  if (visual.kind === "number-filter") {
    const digits = visual.values?.slice(0, 4) ?? []
    if ((visual.values?.length ?? 0) >= 9) {
      const labels = visual.labels ?? []
      return (
        <div className="question-visual number-filter-question repeated-digit-visual" role="img" aria-label={labels.join(", ")}>
          <div>{digits.map((digit) => <span key={digit}>{digit}</span>)}</div>
          {labels.slice(0, 4).map((label) => <strong className="number-filter-condition" key={label}>{label}</strong>)}
          <i>→</i>
          <span className="solution-count">{labels[4] ?? copy.player.visual.allSolutions}</span>
        </div>
      )
    }
    return (
      <div className="question-visual number-filter-question" role="img" aria-label={copy.player.visual.numberFilterAria}>
        <div>{digits.map((digit) => <span key={digit}>{digit}</span>)}</div>
        <i>→</i>
        <strong>÷ {visual.values?.[4]}</strong>
        <i>→</i>
        <strong>T {visual.variant === "greater" ? ">" : "<"} E</strong>
        <i>→</i>
        <span className="solution-count">{copy.player.visual.allSolutions}</span>
      </div>
    )
  }

  if (visual.kind === "tile-grid") {
    const covered = new Set(visual.cells ?? [])
    return (
      <div
        className="question-visual tile-question"
        style={{ "--tile-columns": String(visual.columns ?? 1) } as CSSProperties}
        role="img"
        aria-label={copy.player.visual.tileAria}
      >
        {Array.from({ length: (visual.columns ?? 1) * (visual.rows ?? 1) }, (_, index) => (
          <span className={covered.has(index) ? "covered" : ""} key={index} />
        ))}
      </div>
    )
  }

  if (visual.kind === "composite-area") {
    const values = visual.values ?? []
    const width = values[0] ?? 1
    const height = values[1] ?? 1
    const isFrame = visual.variant === "frame"
    const isNotch = visual.variant === "notch"
    const detailWidth = (isFrame ? values[3] : values[2]) ?? 1
    const detailHeight = (isFrame ? values[4] : values[3]) ?? 1
    const path = isNotch
      ? "M45 35 H155 V85 H245 V35 H355 V225 H45 Z"
      : "M45 35 H355 V225 H45 Z"
    return (
      <div className="question-visual composite-area-question">
        <svg viewBox="0 0 400 270" role="img" aria-label={isFrame ? copy.player.visual.frameAria : isNotch ? copy.player.visual.notchAria : copy.player.visual.cornerAria}>
          {isFrame ? (
            <>
              <rect x="45" y="35" width="310" height="190" rx="2" />
              <rect className="area-hole" x="95" y="80" width="210" height="100" rx="2" />
            </>
          ) : visual.variant === "corner" ? (
            <path d="M45 35 H265 V105 H355 V225 H45 Z" />
          ) : (
            <path d={path} />
          )}
          <text x="200" y="255" textAnchor="middle">{copy.player.visual.widthHeight(width, height)}</text>
          <text className="cutout-label" x="305" y="78" textAnchor="middle">{detailWidth} × {detailHeight}</text>
        </svg>
      </div>
    )
  }

  if (visual.kind === "supply") {
    return (
      <div className="question-visual supply-question">
        {visual.values?.map((value, index) => (
          <div key={`${value}-${index}`}><strong>{value}</strong><small>{visual.labels?.[index] ?? ""}</small></div>
        ))}
      </div>
    )
  }

  if (visual.kind === "locus") {
    return question.geometryConstruction
      ? <LocusQuestionVisual spec={question.geometryConstruction} />
      : null
  }

  if (visual.kind === "coordinate-plane") {
    const values = visual.values ?? []
    const x = values[0] ?? 0
    const y = values[1] ?? 0
    const origin = 180
    const scale = 25
    const gridPositions = Array.from({ length: 13 }, (_, index) => 30 + index * scale)
    return (
      <div
        className="question-visual coordinate-plane-question"
        role="img"
        aria-label={copy.player.visual.coordinateAria(x, y, visual.labels?.[2] ?? "")}
      >
        <svg viewBox="0 0 360 360" aria-hidden="true">
          {gridPositions.map((position) => <line className="coordinate-grid-line" x1={position} y1="30" x2={position} y2="330" key={`v-${position}`} />)}
          {gridPositions.map((position) => <line className="coordinate-grid-line" x1="30" y1={position} x2="330" y2={position} key={`h-${position}`} />)}
          <line className="coordinate-axis" x1="30" y1={origin} x2="330" y2={origin} />
          <line className="coordinate-axis" x1={origin} y1="30" x2={origin} y2="330" />
          <text className="coordinate-axis-label" x="334" y="174">x</text>
          <text className="coordinate-axis-label" x="187" y="26">y</text>
          <circle className="coordinate-point" cx={origin + x * scale} cy={origin - y * scale} r="9" />
          <text className="coordinate-point-label" x={origin + x * scale + 12} y={origin - y * scale - 12}>P</text>
        </svg>
        <strong>{visual.labels?.[2]}</strong>
      </div>
    )
  }

  if (visual.kind === "cube-net") {
    const occupied = new Map(
      (visual.cells ?? []).map((position, index) => [position, visual.labels?.[index] ?? ""]),
    )
    const columns = visual.columns ?? 1
    const rows = visual.rows ?? 1
    return (
      <div
        className="question-visual cube-net-question"
        role="img"
        aria-label={copy.player.visual.cubeNetAria(visual.unit ?? "")}
      >
        <div
          className="cube-net-grid"
          style={{ "--net-columns": String(columns), "--net-rows": String(rows) } as CSSProperties}
        >
          {Array.from({ length: columns * rows }, (_, position) => {
            const label = occupied.get(position)
            return label ? (
              <span
                className={label === visual.unit ? "target" : ""}
                data-face-label={label}
                data-net-position={position}
                key={position}
              >
                {label}
              </span>
            ) : <i aria-hidden="true" key={position} />
          })}
        </div>
      </div>
    )
  }

  if (visual.kind === "pyramid") {
    const leftIsUnknown = visual.labels?.[1] === "gesucht" || visual.labels?.[1] === "unknown"
    const directions = (visual.arrows ?? []).flatMap((direction): PyramidRollDirection[] => {
      if (direction === "left" || direction === "links") return ["left"]
      if (direction === "right" || direction === "rechts") return ["right"]
      if (direction === "back" || direction === "hinten") return ["back"]
      return []
    })
    const directionLabels: Record<PyramidRollDirection, string> = {
      left: copy.player.visual.left,
      right: copy.player.visual.right,
      back: copy.player.visual.back,
    }
    const pathLabel = directions.map((direction) => directionLabels[direction]).join(", ")
    return (
      <div className={`question-visual pyramid-question${directions.length > 1 ? " has-path" : ""}`} role="img" aria-label={copy.player.visual.pyramidAria(pathLabel)}>
        <div className="pyramid-face left"><small>{copy.player.visual.left}</small><strong>{leftIsUnknown ? "?" : visual.values?.[1]}</strong></div>
        <div className="pyramid-face right"><small>{copy.player.visual.right}</small><strong>{visual.values?.[2]}</strong></div>
        <div className="pyramid-base"><small>{copy.player.visual.bottom}</small><strong>{visual.values?.[0]}</strong></div>
        {directions.length === 1 ? <span className="pyramid-arrow">→</span> : null}
        {directions.length > 1 && <ol className="pyramid-question-path">{directions.map((direction, index) => <li key={`${direction}-${index}`}><small>{index + 1}</small><strong>{directionLabels[direction]}</strong></li>)}</ol>}
      </div>
    )
  }

  if (visual.kind === "cuboid") {
    if (visual.variant === "missing-edge") {
      return (
        <div className="question-visual cuboid-question missing-edge-cuboid" role="img" aria-label={visual.labels?.join(", ")}>
          <div className="module-box first"><strong>?</strong></div>
          <div className="cuboid-measures">
            <span>{copy.player.visual.length(visual.values?.[0] ?? 0)}</span>
            <span>{copy.player.visual.width(visual.values?.[1] ?? 0)}</span>
            <span>{visual.values?.[2]} cm³</span>
          </div>
        </div>
      )
    }
    return (
      <div className="question-visual cuboid-question">
        <div className="module-box first" /><div className="module-box second" />
        <div className="cuboid-measures">
          <span>{copy.player.visual.length(visual.values?.[0] ?? 0)}</span>
          <span>{copy.player.visual.width(visual.values?.[1] ?? 0)}</span>
          <span>{visual.values?.[2]} cm³</span>
        </div>
      </div>
    )
  }

  return null
}

function conceptRepairAnswerReady(question: GeneratedQuestion, answer: string): boolean {
  if (question.response.kind !== "coordinate") return Boolean(answer.trim())
  const draft = decodeCoordinateDraft(answer)
  return Boolean(draft.x.trim() && draft.y.trim())
}

function ConceptRepairAnswerControl({
  question,
  answer,
  disabled,
  onChange,
}: {
  question: GeneratedQuestion
  answer: string
  disabled: boolean
  onChange: (answer: string) => void
}) {
  const { copy, t } = useLocalization()
  const coordinate = question.response.kind === "coordinate"
    ? decodeCoordinateDraft(answer)
    : undefined

  if (question.response.kind === "coordinate") {
    return (
      <fieldset className="coordinate-answer concept-repair-coordinate">
        <legend>{question.answerLabel}</legend>
        <span aria-hidden="true">P′(</span>
        <label htmlFor="concept-check-x">
          <span>x</span>
          <input
            id="concept-check-x"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={coordinate?.x ?? ""}
            disabled={disabled}
            aria-label={t("concept.answer.coordinateX")}
            onChange={(event) => onChange(encodeCoordinateDraft(event.target.value, coordinate?.y ?? ""))}
          />
        </label>
        <i aria-hidden="true">|</i>
        <label htmlFor="concept-check-y">
          <span>y</span>
          <input
            id="concept-check-y"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={coordinate?.y ?? ""}
            disabled={disabled}
            aria-label={t("concept.answer.coordinateY")}
            onChange={(event) => onChange(encodeCoordinateDraft(coordinate?.x ?? "", event.target.value))}
          />
        </label>
        <span aria-hidden="true">)</span>
      </fieldset>
    )
  }

  if (question.response.kind === "choice") {
    return (
      <fieldset className="answer-options concept-repair-options">
        <legend>{question.answerLabel}</legend>
        {question.response.options.map((option) => (
          <button
            className={answer === option.id ? "selected" : ""}
            type="button"
            key={option.id}
            aria-pressed={answer === option.id}
            disabled={disabled}
            onClick={() => onChange(option.id)}
          >
            <span>{option.id.length === 1 ? option.id.toUpperCase() : "○"}</span>
            {option.label}
          </button>
        ))}
      </fieldset>
    )
  }

  const unit = question.response.kind === "number" ? question.response.unit : undefined
  return (
    <div className="concept-repair-answer-field">
      <label htmlFor="concept-check-answer">{question.answerLabel}</label>
      <div className="answer-input-wrap">
        <input
          id="concept-check-answer"
          type="text"
          inputMode={question.response.kind === "number" ? "decimal" : "text"}
          autoComplete="off"
          value={answer}
          disabled={disabled}
          placeholder={
            question.response.kind === "fraction"
              ? copy.player.fractionPlaceholder
              : question.response.kind === "integer-set"
                ? t("concept.answer.allSolutions")
                : question.response.kind === "integer-sequence"
                  ? copy.player.integerSequencePlaceholder
                : undefined
          }
          onChange={(event) => onChange(event.target.value)}
        />
        {unit && <span>{unit}</span>}
      </div>
    </div>
  )
}

function ConceptRepairStage({
  sourceQuestion,
  progress,
  questions,
  onProgressChange,
  onReturn,
  locale,
}: {
  sourceQuestion: GeneratedQuestion
  progress: ConceptRepairProgress
  questions: ConceptRepairQuestions
  onProgressChange: (progress: ConceptRepairProgress) => void
  onReturn: () => void
  locale: AppLocale
}) {
  const { t } = useLocalization()
  const lesson = lessonForLocale(sourceQuestion.topicId, locale)
  const topic = topicForLocale(sourceQuestion.topicId, locale)
  const page = lesson.pages[0]!
  const guidance = topicGuidanceForLocale(sourceQuestion.topicId, locale)
  const usesSourceAwareRepair = progress.version === 5 && Boolean(sourceQuestion.provenance)
  const repairGuidance = usesSourceAwareRepair
    ? {
        title: questions.example.answerLabel,
        message: questions.example.hint,
        nextStep: questions.check.hint,
      }
    : guidance
  const stageIndex = progress.stage === "concept" ? 0 : progress.stage === "example" ? 1 : 2
  const diagnosis = progress.feedback === "wrong" && !usesSourceAwareRepair
    ? diagnoseWrongAnswerForLocale(questions.check, progress.answer, locale)
    : undefined
  const checkReady = progress.teachBack.trim().length >= 6 &&
    conceptRepairAnswerReady(questions.check, progress.answer)

  const updateAnswer = (answer: string) => {
    onProgressChange({
      ...progress,
      answer,
      feedback: progress.feedback === "wrong" ? null : progress.feedback,
    })
  }

  const submitCheck = (event: FormEvent) => {
    event.preventDefault()
    if (!checkReady || progress.feedback === "correct") return
    onProgressChange({
      ...progress,
      attempts: progress.attempts + 1,
      feedback: isCorrectAnswer(questions.check, progress.answer) ? "correct" : "wrong",
    })
  }

  return (
    <section className="concept-repair-shell" aria-labelledby="concept-repair-title">
      <header className="concept-repair-header">
        <div>
          <span className="eyebrow">{t("concept.repair.eyebrow", { topic: topic.shortTitle })}</span>
          <h1 id="concept-repair-title">{t("concept.repair.title")}</h1>
          <p>{t("concept.repair.body")}</p>
        </div>
        <button className="secondary-button" type="button" onClick={onReturn}>{t("concept.repair.back")}</button>
      </header>

      <div className="concept-repair-progress" aria-label={t("concept.stepAria", { step: stageIndex + 1 })}>
        {[t("concept.repair.step.idea"), t("concept.repair.step.example"), t("concept.repair.step.self")].map((label, index) => (
          <span className={index <= stageIndex ? "active" : ""} key={label}>
            <i>{index < stageIndex ? "✓" : index + 1}</i>{label}
          </span>
        ))}
      </div>

      {progress.stage === "concept" && (
        <div className="concept-repair-card concept-step-card">
          <div className="concept-repair-copy">
            <span className="eyebrow">{page.eyebrow}</span>
            <h2 className={usesSourceAwareRepair ? "source-question-title" : undefined}>{usesSourceAwareRepair ? questions.example.prompt : page.title}</h2>
            <p>{usesSourceAwareRepair ? questions.example.easierExplanation : page.body}</p>
            <div className="concept-repair-takeaway"><span>{t("concept.takeaway")}</span><strong>{usesSourceAwareRepair ? questions.example.hint : page.takeaway}</strong></div>
            <aside className="concept-repair-trap">
              <span aria-hidden="true">!</span>
              <div><strong>{repairGuidance.title}</strong><p>{repairGuidance.message}</p></div>
            </aside>
          </div>
          {usesSourceAwareRepair
            ? <ConceptPlayground topicId={sourceQuestion.topicId} question={questions.example} fallbackVisual={page.visual} />
            : <ConceptVisual visual={page.visual} contentLocale={locale} />}
          <div className="concept-repair-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => onProgressChange({ ...progress, stage: "example" })}
            >
              {t("concept.repair.showExample")}
            </button>
          </div>
        </div>
      )}

      {progress.stage === "example" && (
        <div className="concept-repair-card example-step-card">
          <div className="concept-repair-example-copy">
            <span className="eyebrow">{t("concept.repair.exampleEyebrow")}</span>
            <h2>{questions.example.prompt}</h2>
            <p className="concept-repair-bridge">{questions.example.easierExplanation}</p>
            <ol className="worked-list">
              {questions.example.workedSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <div className="concept-repair-next-step"><span>{t("concept.repair.same")}</span><strong>{repairGuidance.nextStep}</strong></div>
          </div>
          <QuestionVisual question={questions.example} />
          <div className="concept-repair-actions split">
            <button className="secondary-button" type="button" onClick={() => onProgressChange({ ...progress, stage: "concept" })}>{t("concept.repair.ideaBack")}</button>
            <button className="primary-button" type="button" onClick={() => onProgressChange({ ...progress, stage: "check", feedback: null })}>{t("concept.repair.trySelf")}</button>
          </div>
        </div>
      )}

      {progress.stage === "check" && (
        <form className="concept-repair-card check-step-card" onSubmit={submitCheck}>
          <div className="concept-repair-check-heading">
            <span className="eyebrow">{t("concept.repair.checkEyebrow")}</span>
            <h2>{t("concept.repair.checkTitle")}</h2>
            <p>{t("concept.repair.checkBody")}</p>
          </div>

          <label className="teach-back-field" htmlFor="teach-back-plan">
            <span>{t("concept.repair.planLabel")}</span>
            <textarea
              id="teach-back-plan"
              rows={2}
              value={progress.teachBack}
              disabled={progress.feedback === "correct"}
              placeholder={t("concept.repair.planPlaceholder")}
              onChange={(event) => onProgressChange({
                ...progress,
                teachBack: event.target.value,
                feedback: progress.feedback === "wrong" ? null : progress.feedback,
              })}
            />
          </label>

          <div className="concept-repair-check-question">
            <span>{t("concept.repair.apply")}</span>
            <h3>{questions.check.prompt}</h3>
            <QuestionVisual question={questions.check} />
            <ConceptRepairAnswerControl
              question={questions.check}
              answer={progress.answer}
              disabled={progress.feedback === "correct"}
              onChange={updateAnswer}
            />
          </div>

          {progress.feedback === "wrong" && (
            <div className="feedback wrong diagnostic-feedback" aria-live="polite">
              <div>
                <span>{diagnosis?.title ?? t("concept.repair.wrongTitle")}</span>
                <p>{diagnosis?.message ?? t("concept.repair.wrongBody")}</p>
                <strong className="diagnostic-next-step"><span>{t("concept.next")}</span>{diagnosis?.nextStep ?? repairGuidance.nextStep}</strong>
              </div>
            </div>
          )}

          {progress.feedback === "correct" && (
            <div className="feedback correct concept-repair-success" aria-live="polite">
              <div><span>{t("concept.repair.correctTitle")}</span><p>{questions.check.explanation}</p></div>
              <button className="primary-button" type="button" onClick={onReturn}>{t("concept.repair.return")}</button>
            </div>
          )}

          {progress.feedback !== "correct" && (
            <div className="concept-repair-actions split">
              <button
                className="secondary-button"
                type="button"
                onClick={() => onProgressChange({ ...progress, stage: "example", feedback: null })}
              >
                {t("concept.repair.exampleAgain")}
              </button>
              <button className="primary-button" type="submit" disabled={!checkReady}>{t("concept.repair.checkPlan")}</button>
            </div>
          )}
        </form>
      )}
    </section>
  )
}

type ConceptLabPhase = "idea" | "example" | "check"

function conceptStatusLabel(
  status: LearnerState["mastery"][TopicId]["status"],
  locale: AppLocale = "de",
): string {
  switch (status) {
    case "mastered":
      return translateMessage(locale, "concept.status.mastered")
    case "learning":
      return translateMessage(locale, "concept.status.learning")
    case "available":
      return translateMessage(locale, "concept.status.available")
    case "locked":
      return translateMessage(locale, "concept.status.locked")
  }
}

function conceptPracticeLabel(
  status: LearnerState["mastery"][TopicId]["status"],
  locale: AppLocale = "de",
): string {
  switch (status) {
    case "mastered":
      return translateMessage(locale, "concept.practice.mastered")
    case "learning":
      return translateMessage(locale, "concept.practice.learning")
    case "available":
      return translateMessage(locale, "concept.practice.available")
    case "locked":
      return translateMessage(locale, "concept.practice.locked")
  }
}

function ConceptLabTopic({
  learner,
  topicId,
  practiceBlocked,
  onChooseTopic,
  onStartPractice,
  onShowLibrary,
  onBack,
}: {
  learner: LearnerState
  topicId: TopicId
  practiceBlocked: boolean
  onChooseTopic: (topicId: TopicId) => void
  onStartPractice: (topicId: TopicId) => void
  onShowLibrary: () => void
  onBack: () => void
}) {
  const { locale, t } = useLocalization()
  const lesson = lessonForLocale(topicId, locale)
  const page = lesson.pages[0]!
  const topic = topicForLocale(topicId, locale)
  const mastery = learner.mastery[topicId]
  const teacherPaused = topicNeedsTeacherSupport(learner, topicId)
  const guidance = topicGuidanceForLocale(topicId, locale)
  const [phase, setPhase] = useState<ConceptLabPhase>("idea")
  const [conceptStep, setConceptStep] = useState(0)
  const [revealedExampleSteps, setRevealedExampleSteps] = useState(0)
  const [teachBack, setTeachBack] = useState("")
  const [answer, setAnswer] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [roundIndex, setRoundIndex] = useState(0)
  const round = useMemo(
    () => buildConceptLabRound(
      topicId,
      `concept-lab:${learner.learnerId}:${topicId}:${learner.learningEvents.length}:${roundIndex}`,
      locale,
    ),
    [learner.learnerId, learner.learningEvents.length, locale, roundIndex, topicId],
  )
  const usesSourceAwareRound = Boolean(round.reference.provenance)
  const roundGuidance = usesSourceAwareRound
    ? {
        title: round.reference.answerLabel,
        message: round.reference.hint,
        nextStep: round.check.hint,
      }
    : guidance
  const ideaSteps = usesSourceAwareRound ? round.reference.workedSteps : page.steps
  const stageIndex = phase === "idea" ? 0 : phase === "example" ? 1 : 2
  const answerReady = teachBack.trim().length >= 6 &&
    conceptRepairAnswerReady(round.check, answer)
  const diagnosis = feedback === "wrong" && !usesSourceAwareRound
    ? diagnoseWrongAnswerForLocale(round.check, answer, locale)
    : undefined
  const prerequisites = topic.prerequisites.map((id) => ({
    topic: topicForLocale(id, locale),
    status: learner.mastery[id].status,
  }))

  const resetRound = () => {
    setRoundIndex((current) => current + 1)
    setPhase("example")
    setRevealedExampleSteps(0)
    setTeachBack("")
    setAnswer("")
    setAttempts(0)
    setFeedback(null)
  }

  const submitCheck = (event: FormEvent) => {
    event.preventDefault()
    if (!answerReady || feedback === "correct") return
    setAttempts((current) => current + 1)
    setFeedback(isCorrectAnswer(round.check, answer) ? "correct" : "wrong")
  }

  return (
    <main className="concept-library-shell concept-topic-shell">
      <nav className="concept-library-nav" aria-label={t("concept.navAria")}>
        <button className="curriculum-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> {t("common.learningPlan")}
        </button>
        <button className="text-button" type="button" onClick={onShowLibrary}>{t("concept.all")}</button>
      </nav>

      <header className="concept-library-hero topic-hero">
        <div>
          <span className="eyebrow">{t("concept.lab.eyebrow", { topic: topic.shortTitle })}</span>
          <h1>{lesson.goal}</h1>
          <p>{t("concept.lab.body")}</p>
        </div>
        <span className={`concept-library-status ${teacherPaused ? "teacher-paused" : mastery.status}`}>
          {teacherPaused ? t("concept.lab.paused") : conceptStatusLabel(mastery.status, locale)}
        </span>
      </header>

      {prerequisites.length > 0 && (
        <section className="concept-prerequisite-strip" aria-labelledby="concept-prerequisites-title">
          <div>
            <span className="eyebrow">{t("concept.prerequisites.eyebrow")}</span>
            <h2 id="concept-prerequisites-title">{t("concept.prerequisites.title")}</h2>
          </div>
          <div>
            {prerequisites.map(({ topic: prerequisite, status }) => (
              <button type="button" key={prerequisite.id} onClick={() => onChooseTopic(prerequisite.id)}>
                <span aria-hidden="true">{status === "mastered" ? "✓" : "↖"}</span>
                <span><strong>{prerequisite.shortTitle}</strong><small>{t("concept.prerequisites.open", { status: conceptStatusLabel(status, locale) })}</small></span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="concept-repair-progress concept-library-progress" aria-label={t("concept.stepAria", { step: stageIndex + 1 })}>
        {[t("concept.lab.step.idea"), t("concept.lab.step.example"), t("concept.lab.step.self")].map((label, index) => (
          <span className={index <= stageIndex ? "active" : ""} key={label}>
            <i>{index < stageIndex ? "✓" : index + 1}</i>{label}
          </span>
        ))}
      </div>

      {phase === "idea" && (
        <section className="concept-lab-card concept-lab-idea-card">
          <div className="concept-lab-copy">
            <span className="eyebrow">{page.eyebrow}</span>
            <h2 className={usesSourceAwareRound ? "source-question-title" : undefined}>{usesSourceAwareRound ? round.reference.prompt : page.title}</h2>
            <p>{usesSourceAwareRound ? round.reference.easierExplanation : page.body}</p>
            <div className="concept-repair-takeaway"><span>{t("concept.takeaway")}</span><strong>{usesSourceAwareRound ? round.reference.hint : page.takeaway}</strong></div>
            <aside className="concept-repair-trap">
              <span aria-hidden="true">!</span>
              <div><strong>{roundGuidance.title}</strong><p>{roundGuidance.message}</p></div>
            </aside>
          </div>
          <div className="concept-lab-manipulator">
            <ConceptPlayground
              key={`${topicId}:${round.reference.id}`}
              topicId={topicId}
              question={round.reference}
              fallbackVisual={page.visual}
            />
            <div className="concept-step-control">
              <div>
                <span>{t("concept.lab.thoughtPath", { step: conceptStep + 1, total: ideaSteps.length })}</span>
                <strong>{ideaSteps[conceptStep]}</strong>
              </div>
              <label htmlFor="concept-step-range">
                <span>{t("concept.lab.moveStep")}</span>
                <input
                  id="concept-step-range"
                  type="range"
                  min={0}
                  max={Math.max(0, ideaSteps.length - 1)}
                  step={1}
                  value={conceptStep}
                  aria-valuetext={t("concept.lab.stepValue", { step: conceptStep + 1, value: ideaSteps[conceptStep] ?? "" })}
                  onChange={(event) => setConceptStep(Number(event.target.value))}
                />
              </label>
              <div className="concept-step-buttons">
                <button className="secondary-button compact" type="button" disabled={conceptStep === 0} onClick={() => setConceptStep((current) => Math.max(0, current - 1))}>{t("concept.lab.back")}</button>
                {conceptStep < ideaSteps.length - 1 ? (
                  <button className="primary-button compact" type="button" onClick={() => setConceptStep((current) => Math.min(ideaSteps.length - 1, current + 1))}>{t("concept.lab.nextStep")}</button>
                ) : (
                  <button className="primary-button compact" type="button" onClick={() => setPhase("example")}>{t("concept.lab.newValues")}</button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {phase === "example" && (
        <section className="concept-lab-card concept-lab-example-card">
          <div className="concept-lab-example-visual">
            <span className="eyebrow">{t("concept.lab.exampleEyebrow")}</span>
            <h2>{round.example.prompt}</h2>
            <QuestionVisual question={round.example} />
          </div>
          <div className="concept-lab-example-work">
            <p>{round.example.easierExplanation}</p>
            <div className="fading-support" aria-live="polite">
              <span>{t("concept.lab.predict")}</span>
              {revealedExampleSteps === 0 ? (
                <strong>{t("concept.lab.noneVisible")}</strong>
              ) : (
                <ol className="worked-list">
                  {round.example.workedSteps.slice(0, revealedExampleSteps).map((step) => <li key={step}>{step}</li>)}
                </ol>
              )}
            </div>
            <div className="concept-lab-actions">
              <button className="secondary-button" type="button" onClick={() => setPhase("idea")}>{t("concept.repair.ideaBack")}</button>
              {revealedExampleSteps < round.example.workedSteps.length ? (
                <button className="primary-button" type="button" onClick={() => setRevealedExampleSteps((current) => current + 1)}>
                  {revealedExampleSteps === 0 ? t("concept.lab.revealFirst") : t("concept.lab.revealNext")}
                </button>
              ) : (
                <button className="primary-button" type="button" onClick={() => setPhase("check")}>{t("concept.lab.tryNoModel")}</button>
              )}
            </div>
          </div>
        </section>
      )}

      {phase === "check" && (
        <form className="concept-lab-card concept-lab-check-card" onSubmit={submitCheck}>
          <header>
            <span className="eyebrow">{t("concept.lab.checkEyebrow")}</span>
            <h2>{t("concept.lab.checkTitle")}</h2>
            <p>{t("concept.lab.checkBody")}</p>
          </header>
          <label className="teach-back-field" htmlFor="concept-library-teach-back">
            <span>{t("concept.lab.firstStep")}</span>
            <textarea
              id="concept-library-teach-back"
              rows={2}
              value={teachBack}
              disabled={feedback === "correct"}
              placeholder={t("concept.repair.planPlaceholder")}
              onChange={(event) => { setTeachBack(event.target.value); if (feedback === "wrong") setFeedback(null) }}
            />
          </label>
          <div className="concept-repair-check-question">
            <span>{t("concept.lab.freshValues")}</span>
            <h3>{round.check.prompt}</h3>
            <QuestionVisual question={round.check} />
            <ConceptRepairAnswerControl
              question={round.check}
              answer={answer}
              disabled={feedback === "correct"}
              onChange={(value) => { setAnswer(value); if (feedback === "wrong") setFeedback(null) }}
            />
          </div>

          {feedback === "wrong" && (
            <div className="feedback wrong diagnostic-feedback" aria-live="polite">
              <div>
                <span>{diagnosis?.title ?? t("concept.lab.wrongTitle")}</span>
                <p>{diagnosis?.message ?? roundGuidance.message}</p>
                <strong className="diagnostic-next-step"><span>{t("concept.next")}</span>{diagnosis?.nextStep ?? roundGuidance.nextStep}</strong>
              </div>
            </div>
          )}

          {feedback === "correct" && (
            <div className="concept-lab-success" aria-live="polite">
              <span aria-hidden="true">✓</span>
              <div><strong>{t("concept.lab.successTitle")}</strong><p>{round.check.explanation}</p><small>{attempts} {attempts === 1 ? t("concept.lab.attemptOne") : t("concept.lab.attemptMany")} · {t("concept.lab.noScore")}</small></div>
            </div>
          )}

          <div className="concept-lab-check-actions">
            {feedback === "correct" ? (
              <>
                <button className="secondary-button" type="button" onClick={resetRound}>{t("concept.lab.freshRound")}</button>
                {mastery.status !== "locked" && (
                  <button className="primary-button" type="button" disabled={practiceBlocked || teacherPaused} onClick={() => onStartPractice(topicId)}>
                    {teacherPaused ? t("concept.lab.waiting") : conceptPracticeLabel(mastery.status, locale)}
                  </button>
                )}
              </>
            ) : (
              <>
                <button className="secondary-button" type="button" onClick={() => setPhase("example")}>{t("concept.repair.exampleAgain")}</button>
                <button className="primary-button" type="submit" disabled={!answerReady}>{t("concept.repair.checkPlan")}</button>
              </>
            )}
          </div>
          {feedback === "correct" && mastery.status === "locked" && prerequisites.length > 0 && (
            <p className="concept-locked-next">{t("concept.lab.lockedNext", { prerequisites: prerequisites.map(({ topic: item }) => item.shortTitle).join(t("common.and")) })}</p>
          )}
        </form>
      )}
    </main>
  )
}

export function ConceptLibraryView({
  learner,
  initialTopicId,
  practiceBlocked = false,
  onBack,
  onStartPractice,
}: {
  learner: LearnerState
  initialTopicId?: TopicId
  practiceBlocked?: boolean
  onBack: () => void
  onStartPractice: (topicId: TopicId) => void
}) {
  const { locale, t } = useLocalization()
  const [selectedTopicId, setSelectedTopicId] = useState<TopicId | undefined>(initialTopicId)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedTopicId])

  if (selectedTopicId) {
    return (
      <ConceptLabTopic
        key={selectedTopicId}
        learner={learner}
        topicId={selectedTopicId}
        practiceBlocked={practiceBlocked}
        onChooseTopic={setSelectedTopicId}
        onStartPractice={onStartPractice}
        onShowLibrary={() => setSelectedTopicId(undefined)}
        onBack={onBack}
      />
    )
  }

  const allTopics = curriculumTopicsForLearner(learner).map((topic) => topicForLocale(topic.id, locale))
  const focusTopic = allTopics.find(({ id }) => learner.mastery[id].status === "learning" && !topicNeedsTeacherSupport(learner, id))
    ?? allTopics.find(({ id }) => learner.mastery[id].status === "available" && !topicNeedsTeacherSupport(learner, id))
    ?? allTopics.find(({ id }) => learner.mastery[id].status === "mastered" && !topicNeedsTeacherSupport(learner, id))

  return (
    <main className="concept-library-shell">
      <button className="curriculum-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> {t("common.learningPlan")}
      </button>
      <header className="concept-library-hero">
        <div>
          <span className="eyebrow">{t("concept.library.eyebrow")}</span>
          <h1>{t("concept.library.title")}</h1>
          <p>{t("concept.library.body")}</p>
        </div>
        {focusTopic && (
          <button className="primary-button" type="button" onClick={() => setSelectedTopicId(focusTopic.id)}>
            {t("concept.library.start", { topic: focusTopic.shortTitle })}
          </button>
        )}
      </header>

      <div className="concept-library-groups">
        {curriculumGroups.map((group) => {
          const groupCopy = curriculumGroupCopy(group.id, locale)
          return (
          <section key={group.id}>
            <div className="concept-library-group-heading">
              <div><h2>{groupCopy.title}</h2><p>{groupCopy.description}</p></div>
              <span>{t("concept.library.count", { count: group.topicIds.length })}</span>
            </div>
            <div className="concept-library-grid">
              {group.topicIds.map((topicId) => {
                const topic = topicForLocale(topicId, locale)
                const lesson = lessonForLocale(topicId, locale)
                const status = learner.mastery[topicId].status
                const teacherPaused = topicNeedsTeacherSupport(learner, topicId)
                return (
                  <article className="concept-library-card" key={topicId}>
                    <div className="concept-library-card-topline">
                      <span>{String(topic.courseOrder).padStart(2, "0")}</span>
                      <small className={teacherPaused ? "teacher-paused" : status}>
                        {teacherPaused ? t("concept.library.paused") : conceptStatusLabel(status, locale)}
                      </small>
                    </div>
                    <h3>{topic.shortTitle}</h3>
                    <p>{lesson.goal}</p>
                    <div>
                      <span>{topic.prerequisites.length === 0
                        ? t("concept.library.noPrerequisite")
                        : topic.prerequisites.length === 1
                          ? t("concept.library.onePrerequisite")
                          : t("concept.library.manyPrerequisites", { count: topic.prerequisites.length })}</span>
                      <button className="secondary-button compact" type="button" onClick={() => setSelectedTopicId(topicId)}>{t("concept.library.open")}</button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )})}
      </div>
    </main>
  )
}

function HelpPanel({
  question,
  activeHelp,
  prerequisites,
  helpStyle = "visual",
  onUseHelp,
  onConceptRepair,
  onPrerequisite,
  onContinueWithSolution,
}: {
  question: GeneratedQuestion
  activeHelp: HelpKind[]
  prerequisites: TopicId[]
  helpStyle?: LearnerHelpStyle
  onUseHelp: (kind: HelpKind) => void
  onConceptRepair: () => void
  onPrerequisite?: (topicId: TopicId) => void
  onContinueWithSolution: () => void
}) {
  const { locale, copy } = useLocalization()
  const visibleHelp = activeHelp[activeHelp.length - 1]
  const preferredKind: HelpKind = {
    concise: "hint",
    visual: "concept",
    story: "easier",
    "step-by-step": "solution",
  }[helpStyle] as HelpKind
  const helpOptions: { kind: HelpKind; label: string }[] = [
    { kind: "hint", label: copy.player.helpOptionLabels.hint },
    { kind: "easier", label: copy.player.helpOptionLabels.easier },
    { kind: "concept", label: copy.player.helpOptionLabels.concept },
    { kind: "solution", label: copy.player.helpOptionLabels.solution },
    ...(onPrerequisite
      ? [{ kind: "prerequisites" as const, label: copy.player.helpOptionLabels.prerequisites }]
      : []),
  ]
  const orderedHelpOptions = [
    ...helpOptions.filter((option) => option.kind === preferredKind),
    ...helpOptions.filter((option) => option.kind !== preferredKind),
  ]

  return (
    <aside className="help-panel">
      <div className="help-heading">
        <span aria-hidden="true">?</span>
        <div><strong>{copy.player.helpTitle}</strong><small>{copy.player.helpSubtitle}</small></div>
      </div>
      <div className="help-options">
        {orderedHelpOptions.map((option) => (
          <button
            type="button"
            key={option.kind}
            className={`${visibleHelp === option.kind ? "active " : ""}${option.kind === preferredKind ? "recommended" : ""}`.trim()}
            data-recommended={option.kind === preferredKind ? copy.player.recommended : undefined}
            title={option.kind === preferredKind ? copy.player.recommendedTitle(option.label) : undefined}
            onClick={() => option.kind === "concept" ? onConceptRepair() : onUseHelp(option.kind)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visibleHelp && (
        <div className="help-content" aria-live="polite">
          {visibleHelp === "hint" && <><span className="eyebrow">{copy.player.hintEyebrow}</span><p>{question.hint}</p></>}
          {visibleHelp === "easier" && <><span className="eyebrow">{copy.player.easierEyebrow}</span><p>{question.easierExplanation}</p></>}
          {visibleHelp === "solution" && (
            <>
              <span className="eyebrow">{copy.player.solutionEyebrow}</span>
              <ol>{question.workedSteps.map((step) => <li key={step}>{step}</li>)}</ol>
              <button className="secondary-button full" type="button" onClick={onContinueWithSolution}>{copy.player.solutionContinue}</button>
            </>
          )}
          {visibleHelp === "prerequisites" && onPrerequisite && (
            <>
              <span className="eyebrow">{copy.player.prerequisitesEyebrow}</span>
              {prerequisites.length === 0 ? (
                <p>{copy.player.noPrerequisites}</p>
              ) : prerequisites.map((topicId) => (
                <button className="prerequisite-help-button" type="button" key={topicId} onClick={() => onPrerequisite(topicId)}>
                  {topicForLocale(topicId, locale).shortTitle}<span>{copy.player.openPrerequisite}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </aside>
  )
}

function AssessmentIntro({
  task,
  onStart,
  minimalFocus = false,
}: {
  task: LearningTask
  onStart: () => void
  minimalFocus?: boolean
}) {
  const { locale, copy } = useLocalization()
  return (
    <section className="assessment-intro-card">
      <div className="assessment-intro-mark" aria-hidden="true">◆</div>
      <span className="eyebrow">
        {copy.player.assessmentEyebrow(task.assessmentNumber, minimalFocus)}
      </span>
      <h1>{copy.player.assessmentTitle}</h1>
      <p>{copy.player.assessmentBody}</p>

      <div className="assessment-intro-stats">
        <div><strong>{task.questionCount}</strong><span>{copy.player.exercises}</span></div>
        <div><strong>{task.topicIds.length}</strong><span>{copy.player.topics}</span></div>
        <div><strong>10–15</strong><span>{copy.player.minutes}</span></div>
      </div>

      <div className="checkpoint-brief-route" aria-label={copy.player.assessmentRouteAria(minimalFocus)}>
        <div className="current"><span>1</span><p><strong>{minimalFocus ? copy.player.preparation : copy.player.checkpoint}</strong><small>{copy.player.prepareCalmly}</small></p></div>
        <div><span>2</span><p><strong>{copy.player.mixedRound}</strong><small>{copy.player.withoutHints}</small></p></div>
        <div><span>3</span><p><strong>{minimalFocus ? copy.player.reviewPlan : copy.player.returnRoute}</strong><small>{copy.player.onlyWhereNeeded}</small></p></div>
      </div>

      <div className="assessment-rules">
        <h2>{copy.player.rulesTitle}</h2>
        <ul>
          {copy.player.assessmentRules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
      </div>

      <div className="assessment-topic-preview">
        <span>{copy.player.mixedFrom}</span>
        <div>
          {task.topicIds.map((topicId) => (
            <span key={topicId}>{topicForLocale(topicId, locale).shortTitle}</span>
          ))}
        </div>
      </div>

      <button className="primary-button wide" type="button" onClick={onStart}>
        {copy.player.startAssessment}
      </button>
      <small>{copy.player.timeStartsAfterStart}</small>
    </section>
  )
}

function PracticeStepWorkbench({
  steps,
  answers,
  statuses,
  activeStepIndex,
  disabled,
  formatFeedbackId,
  onChange,
}: {
  steps: PracticeStep[]
  answers: PracticeStepAnswers
  statuses?: Record<string, PracticeStepStatus>
  activeStepIndex: number
  disabled: boolean
  formatFeedbackId?: string
  onChange: (stepId: string, value: string) => void
}) {
  const { copy } = useLocalization()
  useEffect(() => {
    if (disabled) return
    document.getElementById(`answer-step-${steps[activeStepIndex]?.id}`)?.focus()
  }, [activeStepIndex, disabled, steps])

  return (
    <fieldset className="practice-step-workbench">
      <legend>
        <strong>{copy.player.practicePathTitle}</strong>
        <span>{copy.player.practicePathDetail}</span>
      </legend>
      <div className="practice-step-list">
        {steps.map((step, index) => {
          const status = statuses?.[step.id] ?? "pending"
          const inputId = `answer-step-${step.id}`
          const unitId = `${inputId}-unit`
          return (
            <div
              className={`practice-step ${status}${index > activeStepIndex ? " locked" : ""}`}
              key={step.id}
            >
              <span className="practice-step-number" aria-hidden="true">
                {status === "correct" ? "✓" : index + 1}
              </span>
              <div className="practice-step-copy">
                <label htmlFor={inputId}>
                  <strong>{step.label}</strong>
                  <span>{step.instruction}</span>
                </label>
                <div className="answer-input-wrap practice-step-input">
                  <input
                    id={inputId}
                    inputMode="decimal"
                    autoComplete="off"
                    value={answers[step.id] ?? ""}
                    disabled={disabled || index !== activeStepIndex}
                    aria-invalid={status === "attention" || status === "format"}
                    aria-describedby={[
                      step.unit ? unitId : undefined,
                      status === "format" ? formatFeedbackId : undefined,
                    ].filter(Boolean).join(" ") || undefined}
                    autoFocus={index === activeStepIndex}
                    onChange={(event) => onChange(step.id, event.target.value)}
                  />
                  {step.unit && <span id={unitId}>{step.unit}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {activeStepIndex > 0 && !disabled && (
        <p className="practice-step-progress" role="status">
          {copy.player.practicePathProgress(activeStepIndex, activeStepIndex + 1)}
        </p>
      )}
      <p className="practice-step-note">
        {copy.player.practicePathNote}
      </p>
    </fieldset>
  )
}

const geometryTools: Array<{
  id: GeometryConstructionTool
  icon: string
}> = [
  { id: "parallel", icon: "∥" },
  { id: "circle", icon: "○" },
  { id: "bisector", icon: "⊥" },
]

function constructionAnchor(spec: GeometryConstructionSpec): { x: number; y: number } {
  switch (spec.reference.kind) {
    case "point":
      return spec.reference.point
    case "point-pair":
      return {
        x: (spec.reference.first.x + spec.reference.second.x) / 2,
        y: (spec.reference.first.y + spec.reference.second.y) / 2,
      }
    case "line":
      return { x: spec.width / 2, y: Math.max(90, spec.reference.y - 100) }
  }
}

function initialParameterForTool(
  spec: GeometryConstructionSpec,
  tool: GeometryConstructionTool,
): number {
  if (tool === spec.expectedTool) return spec.initialParameter
  switch (tool) {
    case "parallel":
      return snapGeometryParameter(spec, spec.height / 2)
    case "circle":
      return snapGeometryParameter(spec, 80)
    case "bisector":
      return snapGeometryParameter(spec, spec.width / 2)
  }
}

function GeometryConstructionWorkbench({
  spec,
  answer,
  disabled,
  attention,
  onChange,
}: {
  spec: GeometryConstructionSpec
  answer: GeometryConstructionAnswer | undefined
  disabled: boolean
  attention: boolean
  onChange: (answer: GeometryConstructionAnswer) => void
}) {
  const { copy, intlLocale } = useLocalization()
  const [draggingPointer, setDraggingPointer] = useState<number | null>(null)
  const anchor = constructionAnchor(spec)
  const parameter = snapGeometryParameter(
    spec,
    answer?.parameter ?? spec.initialParameter,
  )
  const formatCentimeters = (value: number) => new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
  const measurement = (() => {
    if (!answer || answer.tool !== spec.expectedTool) return copy.player.geometryPosition
    switch (spec.reference.kind) {
      case "line":
        return copy.player.geometryDistance(formatCentimeters(
          Math.abs(spec.reference.y - parameter) / spec.pixelsPerCentimeter,
        ))
      case "point":
        return copy.player.geometryRadius(formatCentimeters(parameter / spec.pixelsPerCentimeter))
      case "point-pair":
        return copy.player.geometryPointDistances(
          formatCentimeters(Math.abs(parameter - spec.reference.first.x) / spec.pixelsPerCentimeter),
          formatCentimeters(Math.abs(spec.reference.second.x - parameter) / spec.pixelsPerCentimeter),
        )
    }
  })()

  const changeParameter = (nextParameter: number) => {
    if (!answer || disabled) return
    onChange({
      ...answer,
      parameter: snapGeometryParameter(spec, nextParameter),
    })
  }

  const parameterFromPointer = (event: ReactPointerEvent<SVGSVGElement>): number => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) * spec.width / bounds.width
    const y = (event.clientY - bounds.top) * spec.height / bounds.height
    switch (answer?.tool) {
      case "parallel":
        return y
      case "circle":
        return Math.hypot(x - anchor.x, y - anchor.y)
      case "bisector":
        return x
      default:
        return spec.initialParameter
    }
  }

  const startDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!answer || disabled) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    setDraggingPointer(event.pointerId)
    changeParameter(parameterFromPointer(event))
  }

  const moveDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (draggingPointer !== event.pointerId) return
    event.preventDefault()
    changeParameter(parameterFromPointer(event))
  }

  const endDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (draggingPointer !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDraggingPointer(null)
  }

  const selectTool = (tool: GeometryConstructionTool) => {
    if (disabled) return
    onChange({
      version: 1,
      tool,
      parameter: answer?.tool === tool
        ? parameter
        : initialParameterForTool(spec, tool),
    })
  }

  return (
    <fieldset className={`geometry-workbench${attention ? " attention" : ""}`}>
      <legend>
        <strong>{copy.player.geometryLegend}</strong>
        <span>{copy.player.geometryDetail}</span>
      </legend>

      <div className="geometry-workspace">
        <div className="geometry-tools" aria-label={copy.player.geometryToolsAria}>
          {geometryTools.map((tool) => (
            <button
              type="button"
              key={tool.id}
              className={answer?.tool === tool.id ? "selected" : ""}
              aria-pressed={answer?.tool === tool.id}
              disabled={disabled}
              onClick={() => selectTool(tool.id)}
            >
              <span aria-hidden="true">{tool.icon}</span>
              <strong>{copy.player.geometryTools[tool.id].title}</strong>
              <small>{copy.player.geometryTools[tool.id].description}</small>
            </button>
          ))}
        </div>

        <div className="geometry-canvas-wrap">
          <svg
            className="geometry-canvas"
            viewBox={`0 0 ${spec.width} ${spec.height}`}
            role="img"
            aria-label={copy.player.geometryCanvasAria}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
          <title>{copy.player.geometryCanvasTitle}</title>
          <defs>
            <pattern id="geometry-grid" width={spec.pixelsPerCentimeter} height={spec.pixelsPerCentimeter} patternUnits="userSpaceOnUse">
              <path d={`M ${spec.pixelsPerCentimeter} 0 L 0 0 0 ${spec.pixelsPerCentimeter}`} className="geometry-grid-line" />
            </pattern>
          </defs>
          <rect width={spec.width} height={spec.height} className="geometry-paper" />
          <rect width={spec.width} height={spec.height} fill="url(#geometry-grid)" />

          {spec.reference.kind === "line" && (
            <g className="geometry-reference">
              <rect x="26" y={spec.reference.y - 10} width={spec.width - 52} height="20" rx="10" className="geometry-road" />
              <line x1="28" y1={spec.reference.y} x2={spec.width - 28} y2={spec.reference.y} />
              <text x="38" y={spec.reference.y - 18}>{spec.reference.label}</text>
              <g className="geometry-north" transform="translate(590 48)">
                <path d="M 0 24 L 0 0 M -6 8 L 0 0 6 8" />
                <text x="0" y="40">N</text>
              </g>
            </g>
          )}

          {spec.reference.kind === "point" && (
            <g className="geometry-reference geometry-point-reference">
              <circle cx={spec.reference.point.x} cy={spec.reference.point.y} r="7" />
              <line x1={spec.reference.point.x - 13} y1={spec.reference.point.y} x2={spec.reference.point.x + 13} y2={spec.reference.point.y} />
              <line x1={spec.reference.point.x} y1={spec.reference.point.y - 13} x2={spec.reference.point.x} y2={spec.reference.point.y + 13} />
              <text x={spec.reference.point.x + 14} y={spec.reference.point.y - 14}>{spec.reference.point.label}</text>
            </g>
          )}

          {spec.reference.kind === "point-pair" && (
            <g className="geometry-reference geometry-point-reference">
              <line
                x1={spec.reference.first.x}
                y1={spec.reference.first.y}
                x2={spec.reference.second.x}
                y2={spec.reference.second.y}
                className="geometry-segment"
              />
              {[spec.reference.first, spec.reference.second].map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="7" />
                  <text x={point.x} y={point.y - 18} textAnchor="middle">{point.label}</text>
                </g>
              ))}
            </g>
          )}

          {answer?.tool === "parallel" && (
            <g className="geometry-construction">
              <line x1="28" y1={parameter} x2={spec.width - 28} y2={parameter} />
              <circle cx={spec.width - 52} cy={parameter} r="12" className="geometry-handle" />
            </g>
          )}
          {answer?.tool === "circle" && (
            <g className="geometry-construction">
              <circle cx={anchor.x} cy={anchor.y} r={parameter} />
              <line x1={anchor.x} y1={anchor.y} x2={anchor.x + parameter} y2={anchor.y} className="geometry-radius" />
              <circle cx={anchor.x + parameter} cy={anchor.y} r="12" className="geometry-handle" />
            </g>
          )}
          {answer?.tool === "bisector" && (
            <g className="geometry-construction">
              <line x1={parameter} y1="28" x2={parameter} y2={spec.height - 28} />
              <path d={`M ${parameter - 14} 48 L ${parameter - 14} 62 L ${parameter} 62`} className="geometry-right-angle" />
              <circle cx={parameter} cy="42" r="12" className="geometry-handle" />
            </g>
          )}
          </svg>

          {!answer && (
            <p className="geometry-empty-state">{copy.player.geometryEmpty}</p>
          )}
        </div>
      </div>

      {answer && (
        <div className="geometry-adjustment">
          <label htmlFor="geometry-parameter">
            <span>{copy.player.geometryFineTune}</span>
            <strong>{measurement}</strong>
          </label>
          <input
            id="geometry-parameter"
            type="range"
            min={spec.minParameter}
            max={spec.maxParameter}
            step={spec.snap}
            value={parameter}
            disabled={disabled}
            aria-label={copy.player.geometryFineTuneAria}
            onChange={(event) => changeParameter(Number(event.target.value))}
          />
          <small>{copy.player.geometryInteractionHint}</small>
        </div>
      )}
    </fieldset>
  )
}

export function QuestionStage({
  session,
  setSession,
  onFinish,
  onPrerequisite,
  onRequestTeacherSupport,
  helpStyle = "visual",
}: {
  session: ActiveLearningSession
  setSession: Dispatch<SetStateAction<ActiveLearningSession>>
  onFinish: (event: LearningEvent) => void
  onPrerequisite?: (topicId: TopicId) => void
  onRequestTeacherSupport?: (topicId: TopicId) => void
  helpStyle?: LearnerHelpStyle
}) {
  const { locale, copy } = useLocalization()
  const [confirmTeacherSupport, setConfirmTeacherSupport] = useState(false)
  const { task, activeSeconds } = session
  const contentLocale = task.contentLocale ?? "de"
  const {
    questionIndex,
    answer,
    submissions,
    mistakes,
    helpCount,
    activeHelp,
    feedback,
    results,
    questionStartedAt,
    firstDiagnostic,
    verifiedPracticeSteps = [],
    conceptRepair,
  } = session.question
  const questions = useMemo(() => generateQuestionsForTask(task), [task])
  const question = questions[questionIndex]!
  const localizedTopic = topicForLocale(question.topicId, locale)
  const exerciseReportUrl = useMemo(
    () => buildExerciseReportUrl(
      createExerciseReportReference(task, question, questionIndex),
      window.location.origin,
    ),
    [question, questionIndex, task],
  )
  const conceptRepairQuestions = useMemo(
    () => conceptRepair
      ? buildConceptRepairQuestions(
          question.topicId,
          conceptRepair.seed,
          question.prompt,
          conceptRepair.version,
          contentLocale,
          question.provenance,
        )
      : undefined,
    [conceptRepair?.seed, conceptRepair?.version, contentLocale, question.prompt, question.provenance, question.topicId],
  )
  const isAssessment = task.kind === "assessment"
  const isPlacement = task.kind === "placement"
  const isSilentCheck = isAssessment || isPlacement
  const assessmentAnswerSubmitted = isAssessment && feedback !== null
  const usesPracticeSteps = shouldUsePracticeSteps(task, question)
  const usesGeometryConstruction = shouldUseGeometryConstruction(task, question)
  const practiceSteps = usesPracticeSteps ? question.practiceSteps : []
  const practiceAnswers = usesPracticeSteps
    ? decodePracticeStepAnswers(answer, practiceSteps)
    : {}
  const verifiedPracticeStepIds = usesPracticeSteps
    ? normalizeVerifiedPracticeSteps(practiceSteps, verifiedPracticeSteps)
    : []
  const activePracticeStepIndex = usesPracticeSteps
    ? Math.min(verifiedPracticeStepIds.length, practiceSteps.length - 1)
    : 0
  const activePracticeStep = practiceSteps[activePracticeStepIndex]
  const isCountedLegacyFormatFeedback = submissions > 0 &&
    firstDiagnostic?.kind === "format"
  const hasPracticeFormatFeedback = Boolean(
    usesPracticeSteps &&
    feedback === "wrong" &&
    !isCountedLegacyFormatFeedback &&
    activePracticeStep &&
    parseNumericAnswer(practiceAnswers[activePracticeStep.id] ?? "") === undefined,
  )
  const practiceGrade = usesPracticeSteps && feedback === "wrong"
    ? gradePracticeSteps(
        practiceSteps.slice(0, activePracticeStepIndex + 1),
        practiceAnswers,
      )
    : undefined
  const practiceStatuses = usesPracticeSteps
    ? Object.fromEntries(practiceSteps.map((step, index) => [
        step.id,
        verifiedPracticeStepIds.includes(step.id)
          ? "correct"
          : feedback === "wrong" && index === activePracticeStepIndex
            ? hasPracticeFormatFeedback
              ? "format"
              : "attention"
            : "pending",
      ])) as Record<string, PracticeStepStatus>
    : undefined
  const constructionAnswer = usesGeometryConstruction
    ? decodeGeometryConstructionAnswer(answer)
    : undefined
  const constructionGrade = usesGeometryConstruction && feedback === "wrong"
    ? gradeGeometryConstruction(question.geometryConstruction, constructionAnswer)
    : undefined
  const isChoice = !usesPracticeSteps && !usesGeometryConstruction && question.response.kind === "choice"
  const coordinateDraft = question.response.kind === "coordinate"
    ? decodeCoordinateDraft(answer)
    : undefined
  const unit = question.response.kind === "number" ? question.response.unit : undefined
  const diagnosis = feedback === "wrong" && (!isSilentCheck || isAssessment)
    ? usesPracticeSteps
      ? localizeSupportIssue(
          practiceGrade?.issue,
          question,
          contentLocale,
          hasPracticeFormatFeedback ? "practice-format" : "practice",
        )
      : usesGeometryConstruction
        ? localizeSupportIssue(
            constructionGrade?.issue,
            question,
            contentLocale,
            constructionGrade?.methodCorrect ? "construction-precision" : "construction-method",
          )
        : diagnoseWrongAnswerForLocale(question, answer, contentLocale)
    : undefined
  const diagnosisIsInputValidation = diagnosis !== undefined &&
    "kind" in diagnosis &&
    isInputValidationDiagnostic(diagnosis)
  const hasFormatFeedback = !isSilentCheck && feedback === "wrong" && (
    hasPracticeFormatFeedback || diagnosisIsInputValidation
  ) && !isCountedLegacyFormatFeedback
  const coordinateXHasFormatFeedback = Boolean(
    hasFormatFeedback &&
    coordinateDraft &&
    parseNumericAnswer(coordinateDraft.x) === undefined,
  )
  const coordinateYHasFormatFeedback = Boolean(
    hasFormatFeedback &&
    coordinateDraft &&
    parseNumericAnswer(coordinateDraft.y) === undefined,
  )
  const answerReady = usesPracticeSteps
    ? Boolean(activePracticeStep && practiceAnswers[activePracticeStep.id]?.trim())
    : usesGeometryConstruction
      ? Boolean(constructionAnswer)
      : coordinateDraft
        ? Boolean(coordinateDraft.x.trim() && coordinateDraft.y.trim())
      : Boolean(answer.trim())

  const updateQuestion = (
    update: (current: ActiveLearningSession["question"]) => ActiveLearningSession["question"],
  ) => {
    setSession((current) => ({
      ...current,
      question: update(current.question),
      updatedAt: new Date().toISOString(),
    }))
  }

  const finishQuestion = (
    solved: boolean,
    overrides: {
      attempts?: number
      mistakeTotal?: number
      diagnostic?: QuestionDiagnosticDraft
    } = {},
  ) => {
    const attemptCount = overrides.attempts ?? Math.max(1, submissions)
    const mistakeTotal = overrides.mistakeTotal ?? mistakes
    const completedDiagnostic = completeQuestionDiagnostic(
      overrides.diagnostic ?? firstDiagnostic,
      solved,
    )
    const result: QuestionResult = {
      questionId: question.id,
      topicId: question.topicId,
      attempts: attemptCount,
      hintsUsed: activeHelp.length,
      activeSeconds: Math.max(1, activeSeconds - questionStartedAt),
      independentlySolved: solved && attemptCount === 1 && activeHelp.length === 0,
      solved,
      ...(isSilentCheck
        ? { submittedAnswer: answer.slice(0, MAX_ASSESSMENT_SUBMITTED_ANSWER_LENGTH) }
        : {}),
      ...(usesPracticeSteps
        ? { verifiedStepIds: verifiedPracticeStepIds }
        : {}),
      ...(question.generation
        ? { difficultyBand: question.generation.difficultyBand }
        : {}),
      ...(completedDiagnostic ? { diagnostic: completedDiagnostic } : {}),
    }
    const nextResults = [...results, result]
    const nextHelpCount = helpCount + activeHelp.length

    if (questionIndex === questions.length - 1) {
      const independentlyCompleted = nextResults.every((item) => item.independentlySolved)
      onFinish({
        id: `event:${task.id}:${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        taskId: task.id,
        taskKind: task.kind,
        ...(task.purpose ? { taskPurpose: task.purpose } : {}),
        topicIds: task.topicIds,
        completedAt: new Date().toISOString(),
        activeSeconds: Math.max(1, activeSeconds),
        mistakes: mistakeTotal,
        hintsUsed: nextHelpCount,
        independentlyCompleted,
        questionResults: nextResults,
      })
      return
    }

    setSession((current) => ({
      ...current,
      question: {
        questionIndex: current.question.questionIndex + 1,
        answer: "",
        submissions: 0,
        mistakes: mistakeTotal,
        helpCount: nextHelpCount,
        activeHelp: [],
        feedback: null,
        results: nextResults,
        questionStartedAt: current.activeSeconds,
        verifiedPracticeSteps: [],
      },
      updatedAt: new Date().toISOString(),
    }))
  }

  const submitAnswer = (event: FormEvent) => {
    event.preventDefault()
    if (assessmentAnswerSubmitted) return
    if (feedback === "correct") return
    if (!answerReady) return

    if (usesPracticeSteps && activePracticeStep) {
      const currentPath = practiceSteps.slice(0, activePracticeStepIndex + 1)
      const currentGrade = gradePracticeSteps(currentPath, practiceAnswers)
      const correct = currentGrade.correct

      if (correct && activePracticeStepIndex < practiceSteps.length - 1) {
        updateQuestion((current) => ({
          ...current,
          verifiedPracticeSteps: [...verifiedPracticeStepIds, activePracticeStep.id],
          feedback: null,
        }))
        return
      }

      const diagnostic = correct
        ? undefined
        : {
            kind: parseNumericAnswer(practiceAnswers[activePracticeStep.id] ?? "") === undefined
              ? "format" as const
              : "stopped-early" as const,
            title: localizeSupportIssue(currentGrade.issue, question, contentLocale, "practice")?.title ?? (
              contentLocale === "en"
                ? "The calculation needs one more intermediate step."
                : contentLocale === "it"
                  ? "Il calcolo richiede ancora un passaggio intermedio."
                  : contentLocale === "es"
                    ? "El cálculo necesita un paso intermedio más."
                    : "Der Rechenweg braucht noch einen Zwischenschritt."
            ),
          }
      const isInputValidation = !isSilentCheck && isInputValidationDiagnostic(diagnostic)
      updateQuestion((current) => ({
        ...current,
        submissions: current.submissions + (isInputValidation ? 0 : 1),
        mistakes: current.mistakes + (
          correct || isInputValidation || current.submissions > 0 ? 0 : 1
        ),
        verifiedPracticeSteps: correct
          ? [...verifiedPracticeStepIds, activePracticeStep.id]
          : verifiedPracticeStepIds,
        firstDiagnostic: correct || isInputValidation
          ? current.firstDiagnostic
          : chooseQuestionDiagnostic(current.firstDiagnostic, diagnostic),
        feedback: correct ? "correct" : "wrong",
      }))
      return
    }

    const attempt = submissions + 1
    const correct = usesGeometryConstruction
      ? gradeGeometryConstruction(question.geometryConstruction, constructionAnswer).correct
      : isCorrectAnswer(question, answer)
    const diagnostic = correct
      ? undefined
      : usesGeometryConstruction
        ? {
            kind: gradeGeometryConstruction(question.geometryConstruction, constructionAnswer).methodCorrect
              ? "construction-precision" as const
              : "construction-method" as const,
            title: localizeSupportIssue(
              gradeGeometryConstruction(question.geometryConstruction, constructionAnswer).issue,
              question,
              contentLocale,
              gradeGeometryConstruction(question.geometryConstruction, constructionAnswer).methodCorrect
                ? "construction-precision"
                : "construction-method",
            )?.title ?? (
              contentLocale === "en"
                ? "The construction needs one more correction."
                : contentLocale === "it"
                  ? "La costruzione richiede ancora una correzione."
                  : contentLocale === "es"
                    ? "La construcción necesita una corrección más."
                    : "Die Konstruktion braucht noch eine Korrektur."
            ),
          }
        : diagnoseWrongAnswerForLocale(question, answer, contentLocale)

    if (isAssessment) {
      updateQuestion((current) => ({
        ...current,
        submissions: attempt,
        mistakes: current.mistakes + (correct ? 0 : 1),
        firstDiagnostic: correct
          ? current.firstDiagnostic
          : chooseQuestionDiagnostic(current.firstDiagnostic, diagnostic),
        feedback: correct ? "correct" : "wrong",
      }))
      return
    }

    if (isPlacement) {
      const nextMistakes = mistakes + (correct ? 0 : 1)
      finishQuestion(correct, {
        attempts: attempt,
        mistakeTotal: nextMistakes,
        diagnostic,
      })
      return
    }

    if (!correct && !isSilentCheck && isInputValidationDiagnostic(diagnostic)) {
      updateQuestion((current) => ({
        ...current,
        feedback: "wrong",
      }))
      return
    }

    updateQuestion((current) => ({
      ...current,
      submissions: attempt,
      mistakes: current.mistakes + (correct ? 0 : 1),
      firstDiagnostic: correct
        ? current.firstDiagnostic
        : chooseQuestionDiagnostic(current.firstDiagnostic, diagnostic),
      feedback: correct ? "correct" : "wrong",
    }))
  }

  const useHelp = (kind: HelpKind) => {
    updateQuestion((current) => ({
      ...current,
      activeHelp: current.activeHelp.includes(kind)
        ? current.activeHelp
        : [...current.activeHelp, kind],
    }))
  }

  const startConceptRepair = () => {
    updateQuestion((current) => ({
      ...current,
      activeHelp: current.activeHelp.includes("concept")
        ? current.activeHelp
        : [...current.activeHelp, "concept"],
      conceptRepair: current.conceptRepair ?? {
        version: question.generation?.version === 5 && question.provenance ? 5 : 4,
        seed: `${task.seed}:question:${questionIndex}:concept-repair`,
        stage: "concept",
        teachBack: "",
        answer: "",
        attempts: 0,
        feedback: null,
      },
    }))
  }

  const updateConceptRepair = (next: ConceptRepairProgress) => {
    updateQuestion((current) => ({ ...current, conceptRepair: next }))
  }

  const returnFromConceptRepair = () => {
    updateQuestion((current) => ({ ...current, conceptRepair: undefined }))
  }

  const progress = ((questionIndex + 1) / questions.length) * 100

  useEffect(() => {
    window.scrollTo(0, 0)
    setConfirmTeacherSupport(false)
  }, [questionIndex])

  if (conceptRepair && conceptRepairQuestions) {
    return (
      <ConceptRepairStage
        sourceQuestion={question}
        progress={conceptRepair}
        questions={conceptRepairQuestions}
        onProgressChange={updateConceptRepair}
        onReturn={returnFromConceptRepair}
        locale={contentLocale}
      />
    )
  }

  return (
    <div className={`question-layout ${isSilentCheck ? "assessment-layout" : ""} ${isPlacement ? "placement-layout" : ""}`}>
      <section className="question-card">
        <div className="question-topline">
          <span>{copy.player.questionProgress(questionIndex + 1, questions.length)}</span>
          <span className="question-context">
            {question.generation && (
              <strong className={`difficulty-pill ${question.generation.difficultyBand}`}>
                {copy.player.difficultyBands[question.generation.difficultyBand]}
              </strong>
            )}
            <span>{localizedTopic.shortTitle}</span>
          </span>
        </div>
        <div className="thin-progress"><span style={{ width: `${progress}%` }} /></div>
        <h1>{question.prompt}</h1>
        {question.visual?.kind === "clock" && (
          <p className="question-notation-note">
            <strong>{copy.player.notationTitle}</strong>
            <span>{copy.player.notationBody(question.visual.denominator ?? 1)}</span>
          </p>
        )}
        <div className="question-meta-actions">
          <a href={exerciseReportUrl} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">⚑</span>
            {copy.player.reportIssue}
            <span aria-hidden="true">↗</span>
          </a>
          {!isPlacement && onRequestTeacherSupport && !confirmTeacherSupport && (
            <button className="text-button" type="button" onClick={() => setConfirmTeacherSupport(true)}>
              {copy.player.notUnderstood}
            </button>
          )}
        </div>
        {confirmTeacherSupport && onRequestTeacherSupport && (
          <div className="topic-help-confirmation" role="alert">
            <div>
              <strong>{copy.player.pauseTopic(localizedTopic.shortTitle)}</strong>
              <p>{copy.player.questionPauseBody}</p>
            </div>
            <div>
              <button className="text-button" type="button" onClick={() => setConfirmTeacherSupport(false)}>{copy.player.keepTrying}</button>
              <button className="danger-button" type="button" onClick={() => onRequestTeacherSupport(question.topicId)}>{copy.player.pauseAndReport}</button>
            </div>
          </div>
        )}
        {!usesGeometryConstruction && <QuestionVisual question={question} />}

        <form className={`answer-form ${isChoice ? "choice-form" : ""}${usesGeometryConstruction ? " geometry-form" : ""}${question.response.kind === "integer-set" || question.response.kind === "integer-sequence" ? " integer-set-form" : ""}${question.response.kind === "coordinate" ? " coordinate-form" : ""}`} onSubmit={submitAnswer}>
          {usesPracticeSteps ? (
            <PracticeStepWorkbench
              steps={practiceSteps}
              answers={practiceAnswers}
              statuses={practiceStatuses}
              activeStepIndex={activePracticeStepIndex}
              disabled={feedback === "correct" || assessmentAnswerSubmitted}
              formatFeedbackId={hasFormatFeedback ? "format-retry-feedback" : undefined}
              onChange={(stepId, value) => {
                updateQuestion((current) => ({
                  ...current,
                  answer: encodePracticeStepAnswers({
                    ...decodePracticeStepAnswers(current.answer, practiceSteps),
                    [stepId]: value,
                  }),
                  feedback: current.feedback === "wrong" ? null : current.feedback,
                }))
              }}
            />
          ) : usesGeometryConstruction ? (
            <GeometryConstructionWorkbench
              spec={question.geometryConstruction}
              answer={constructionAnswer}
              disabled={feedback === "correct" || assessmentAnswerSubmitted}
              attention={feedback === "wrong"}
              onChange={(nextAnswer) => {
                updateQuestion((current) => ({
                  ...current,
                  answer: encodeGeometryConstructionAnswer(nextAnswer),
                  feedback: current.feedback === "wrong" ? null : current.feedback,
                }))
              }}
            />
          ) : question.response.kind === "coordinate" ? (
            <fieldset className="coordinate-answer">
              <legend>{question.answerLabel}</legend>
              <span aria-hidden="true">P′(</span>
              <label htmlFor="coordinate-x">
                <span>x</span>
                <input
                  id="coordinate-x"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={coordinateDraft?.x ?? ""}
                  disabled={feedback === "correct" || assessmentAnswerSubmitted}
                  aria-label={copy.player.coordinateX}
                  aria-invalid={coordinateXHasFormatFeedback || undefined}
                  aria-describedby={coordinateXHasFormatFeedback ? "format-retry-feedback" : undefined}
                  onChange={(event) => {
                    const value = event.target.value
                    updateQuestion((current) => {
                      const draft = decodeCoordinateDraft(current.answer)
                      return {
                        ...current,
                        answer: encodeCoordinateDraft(value, draft.y),
                        feedback: current.feedback === "wrong" ? null : current.feedback,
                      }
                    })
                  }}
                />
              </label>
              <i aria-hidden="true">|</i>
              <label htmlFor="coordinate-y">
                <span>y</span>
                <input
                  id="coordinate-y"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={coordinateDraft?.y ?? ""}
                  disabled={feedback === "correct" || assessmentAnswerSubmitted}
                  aria-label={copy.player.coordinateY}
                  aria-invalid={coordinateYHasFormatFeedback || undefined}
                  aria-describedby={coordinateYHasFormatFeedback ? "format-retry-feedback" : undefined}
                  onChange={(event) => {
                    const value = event.target.value
                    updateQuestion((current) => {
                      const draft = decodeCoordinateDraft(current.answer)
                      return {
                        ...current,
                        answer: encodeCoordinateDraft(draft.x, value),
                        feedback: current.feedback === "wrong" ? null : current.feedback,
                      }
                    })
                  }}
                />
              </label>
              <span aria-hidden="true">)</span>
            </fieldset>
          ) : question.response.kind === "choice" ? (
            <fieldset className="answer-options">
              <legend>{question.answerLabel}</legend>
              {question.response.options.map((option) => (
                <button
                  className={answer === option.id ? "selected" : ""}
                  type="button"
                  key={option.id}
                  aria-pressed={answer === option.id}
                  disabled={feedback === "correct" || assessmentAnswerSubmitted}
                  onClick={() => {
                    updateQuestion((current) => ({
                      ...current,
                      answer: option.id,
                      feedback: current.feedback === "wrong" ? null : current.feedback,
                    }))
                  }}
                >
                  <span>{option.id.length === 1 ? option.id.toUpperCase() : "○"}</span>
                  {option.label}
                </button>
              ))}
            </fieldset>
          ) : (
            <>
              <label htmlFor="answer">{question.answerLabel}</label>
              <div className="answer-input-wrap">
                <input
                  id="answer"
                  inputMode={question.response.kind === "number" ? "decimal" : "text"}
                  autoComplete="off"
                  placeholder={
                    question.response.kind === "fraction"
                      ? copy.player.fractionPlaceholder
                      : question.response.kind === "integer-set"
                        ? copy.player.integerSetPlaceholder
                        : question.response.kind === "integer-sequence"
                          ? copy.player.integerSequencePlaceholder
                        : undefined
                  }
                  value={answer}
                  disabled={feedback === "correct" || assessmentAnswerSubmitted}
                  aria-invalid={hasFormatFeedback || undefined}
                  onChange={(event) => {
                    const value = event.target.value
                    updateQuestion((current) => ({
                      ...current,
                      answer: value,
                      feedback: current.feedback === "wrong" ? null : current.feedback,
                    }))
                  }}
                  aria-describedby={[
                    unit ? "answer-unit" : undefined,
                    hasFormatFeedback ? "format-retry-feedback" : undefined,
                  ].filter(Boolean).join(" ") || undefined}
                  autoFocus
                />
                {unit && <span id="answer-unit">{unit}</span>}
              </div>
            </>
          )}
          <div className="answer-submit-row">
            <button className="primary-button" type="submit" disabled={!answerReady || feedback === "correct" || assessmentAnswerSubmitted}>
              {isAssessment
                ? copy.player.submitAnswer
                : isPlacement
                  ? copy.player.saveAnswer
                  : usesPracticeSteps
                    ? activePracticeStepIndex === practiceSteps.length - 1
                      ? copy.player.checkCalculation
                      : copy.player.checkStep(activePracticeStepIndex + 1)
                    : usesGeometryConstruction
                      ? copy.player.checkConstruction
                      : copy.player.checkAnswer}
            </button>
          </div>
        </form>

        <div className="feedback-region" aria-live="polite">
          {feedback === "wrong" && (
            <div
              className={`feedback wrong diagnostic-feedback${hasFormatFeedback ? " format" : ""}`}
              id={hasFormatFeedback ? "format-retry-feedback" : undefined}
            >
              <div>
                <span>{isAssessment ? copy.player.incorrect : diagnosis?.title ?? copy.player.wrongAnswerTitle}</span>
                {isAssessment ? (
                  <p>{copy.player.assessmentAnswerRecorded}</p>
                ) : (
                  <>
                    <p>
                      {diagnosis?.message ?? copy.player.wrongAnswerMessage}
                      {hasFormatFeedback && (
                        <> <strong className="format-retry-note">{copy.player.formatRetryNote}</strong></>
                      )}
                    </p>
                    {diagnosis && !hasFormatFeedback && (
                      <strong className="diagnostic-next-step">
                        <span>{copy.player.nextStep}</span>
                        {diagnosis.nextStep}
                      </strong>
                    )}
                  </>
                )}
              </div>
              {isAssessment && (
                <button className="primary-button" type="button" onClick={() => finishQuestion(false)}>
                  {questionIndex === questions.length - 1 ? copy.player.finish : copy.player.continue}
                </button>
              )}
            </div>
          )}
          {feedback === "correct" && (
            <div className="feedback correct">
              <div>
                <span>{copy.player.correct}</span>
                <p>{isAssessment ? copy.player.assessmentAnswerRecorded : question.explanation}</p>
              </div>
              <button className="primary-button" type="button" onClick={() => finishQuestion(true)}>
                {questionIndex === questions.length - 1 ? copy.player.finish : copy.player.continue}
              </button>
            </div>
          )}
        </div>

        {isAssessment && (
          <p className="assessment-note"><span aria-hidden="true">◆</span> {copy.player.assessmentModeNote}</p>
        )}
        {isPlacement && (
          <p className="assessment-note placement-note"><span aria-hidden="true">◎</span> {copy.player.placementModeNote}</p>
        )}
      </section>

      {!isSilentCheck && (
        <HelpPanel
          question={question}
          activeHelp={activeHelp}
          prerequisites={topics[question.topicId].prerequisites}
          helpStyle={helpStyle}
          onUseHelp={useHelp}
          onConceptRepair={startConceptRepair}
          onPrerequisite={onPrerequisite}
          onContinueWithSolution={() => finishQuestion(false)}
        />
      )}
    </div>
  )
}

export function TaskPlayer({
  initialSession,
  backLabel,
  onBack,
  onFinish,
  onPrerequisite,
  onSessionChange,
  onRequestTeacherSupport,
  prerequisiteReturnXp,
  helpStyle = "visual",
  minimalFocus = false,
}: {
  initialSession: ActiveLearningSession
  backLabel?: string
  onBack: () => void
  onFinish: (event: LearningEvent) => void
  onPrerequisite: (topicId: TopicId, origin: ActiveLearningSession) => void
  onSessionChange: (session: ActiveLearningSession) => void
  onRequestTeacherSupport?: (topicId: TopicId) => void
  prerequisiteReturnXp?: number
  helpStyle?: LearnerHelpStyle
  minimalFocus?: boolean
}) {
  const { locale, copy } = useLocalization()
  const [session, setSession] = useState(initialSession)
  const [confirmTeacherSupport, setConfirmTeacherSupport] = useState(false)
  const { task, phase, pageIndex, activeSeconds } = session
  const isPrerequisiteDetour = Boolean(session.prerequisiteDetour)
  const canPauseTimer = phase !== "assessment-intro" && task.kind !== "assessment"
  const timerPaused = canPauseTimer && session.timerPaused === true

  useEffect(() => {
    onSessionChange(session)
  }, [session])

  useEffect(() => {
    if (phase === "assessment-intro" || timerPaused) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setSession((current) => ({
          ...current,
          activeSeconds: current.activeSeconds + 1,
          updatedAt: new Date().toISOString(),
        }))
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase, timerPaused])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pageIndex, phase])

  const lessonPageCount = task.kind === "lesson"
    ? lessonForLocale(task.topicIds[0]!, task.contentLocale ?? locale).pages.length
    : 0
  const localizedTopic = task.topicIds.length === 1
    ? topicForLocale(task.topicIds[0]!, locale)
    : undefined
  const localizedKind = task.purpose === "lesson-recovery"
    ? copy.player.recovery
    : copy.player.taskKinds[task.kind]
  const localizedTaskTitle = task.kind === "lesson" && localizedTopic
    ? lessonForLocale(localizedTopic.id, locale).title
    : task.kind === "assessment"
      ? copy.player.assessmentEyebrow(task.assessmentNumber, true)
      : task.kind === "placement"
        ? copy.player.taskKinds.placement
        : localizedTopic
          ? `${localizedKind}: ${localizedTopic.shortTitle}`
          : localizedKind
  const toggleTimerPause = () => {
    if (!canPauseTimer) return
    setSession((current) => ({
      ...current,
      timerPaused: current.timerPaused !== true,
      updatedAt: new Date().toISOString(),
    }))
  }

  return (
    <main className="player-shell">
      <div className="player-toolbar">
        <button className="back-button" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>{" "}
          {backLabel ?? (isPrerequisiteDetour ? copy.player.returnToQuestion : copy.player.learningPlan)}
        </button>
        <div className="player-title">
          <span>{localizedKind}</span>
          <strong>{localizedTaskTitle}</strong>
        </div>
        {phase === "assessment-intro" ? (
          <div className="timer-chip ready" aria-label={copy.player.assessmentReadyAria}><span aria-hidden="true">◆</span>{copy.player.ready}</div>
        ) : (
          <div className="player-timer-controls">
            <div
              className={`timer-chip${timerPaused ? " paused" : ""}`}
              aria-label={copy.player.activeLearningTime(formatMinutes(activeSeconds), timerPaused)}
            >
              <span aria-hidden="true">{timerPaused ? "Ⅱ" : "◷"}</span>
              {formatMinutes(activeSeconds)}
            </div>
            {canPauseTimer && (
              <button
                className="timer-pause-button"
                type="button"
                aria-pressed={timerPaused}
                onClick={toggleTimerPause}
              >
                {timerPaused ? copy.player.resume : copy.player.pause}
              </button>
            )}
          </div>
        )}
      </div>

      {isPrerequisiteDetour && (
        <section className="prerequisite-detour-note" aria-label={copy.player.prerequisiteDetourEyebrow}>
          <span className="eyebrow">{copy.player.prerequisiteDetourEyebrow}</span>
          <strong>{copy.player.prerequisiteDetourTitle(localizedTopic?.shortTitle ?? task.title)}</strong>
          <p>{copy.player.prerequisiteDetourBody}</p>
        </section>
      )}

      {prerequisiteReturnXp !== undefined && !isPrerequisiteDetour && (
        <p className="prerequisite-return-notice" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span>
          {copy.player.prerequisiteReturnNotice(prerequisiteReturnXp)}
        </p>
      )}

      {timerPaused ? (
        <section className="practice-pause-card" aria-labelledby="practice-pause-title" aria-live="polite">
          <div className="practice-pause-mark" aria-hidden="true">Ⅱ</div>
          <span className="eyebrow">{copy.player.pausedEyebrow}</span>
          <h1 id="practice-pause-title">{copy.player.pausedTitle}</h1>
          <p>{copy.player.pausedBody}</p>
          <strong>{copy.player.activeTime(formatMinutes(activeSeconds))}</strong>
          <button className="primary-button" type="button" onClick={toggleTimerPause}>
            {copy.player.resumeLearning}
          </button>
        </section>
      ) : (
        <>
          {phase === "lesson" && task.topicIds.length === 1 && onRequestTeacherSupport && (
            <div className="lesson-topic-help">
              {confirmTeacherSupport ? (
                <div className="topic-help-confirmation" role="alert">
                  <div>
                    <strong>{copy.player.pauseTopic(localizedTopic?.shortTitle ?? task.title)}</strong>
                    <p>{copy.player.lessonPauseBody}</p>
                  </div>
                  <div>
                    <button className="text-button" type="button" onClick={() => setConfirmTeacherSupport(false)}>{copy.player.keepViewingLesson}</button>
                    <button className="danger-button" type="button" onClick={() => onRequestTeacherSupport(task.topicIds[0]!)}>{copy.player.pauseAndReport}</button>
                  </div>
                </div>
              ) : (
                <button className="text-button" type="button" onClick={() => setConfirmTeacherSupport(true)}>
                  {copy.player.notUnderstood}
                </button>
              )}
            </div>
          )}

          {phase === "assessment-intro" ? (
            <AssessmentIntro
              task={task}
              minimalFocus={minimalFocus}
              onStart={() => setSession((current) => ({
                ...current,
                phase: "questions",
                question: {
                  ...current.question,
                  questionStartedAt: current.activeSeconds,
                },
                updatedAt: new Date().toISOString(),
              }))}
            />
          ) : phase === "lesson" ? (
            <LessonStage
              task={task}
              pageIndex={pageIndex}
              onBack={pageIndex === 0 ? onBack : () => setSession((current) => ({
                ...current,
                pageIndex: Math.max(0, current.pageIndex - 1),
                updatedAt: new Date().toISOString(),
              }))}
              onContinue={() => {
                setSession((current) => pageIndex === lessonPageCount - 1
                  ? {
                      ...current,
                      phase: "questions",
                      question: {
                        ...current.question,
                        questionStartedAt: current.activeSeconds,
                      },
                      updatedAt: new Date().toISOString(),
                    }
                  : {
                      ...current,
                      pageIndex: current.pageIndex + 1,
                      updatedAt: new Date().toISOString(),
                    })
              }}
            />
          ) : (
            <QuestionStage
              session={session}
              setSession={setSession}
              onFinish={onFinish}
              onPrerequisite={isPrerequisiteDetour
                ? undefined
                : (topicId) => onPrerequisite(topicId, session)}
              onRequestTeacherSupport={onRequestTeacherSupport}
              helpStyle={helpStyle}
            />
          )}
        </>
      )}
    </main>
  )
}

function sessionOutcomeLabel(item: SessionReviewItem, locale: AppLocale): string {
  if (item.outcome === "independent") return translateMessage(locale, "debrief.outcome.independent")
  if (item.outcome === "corrected") return translateMessage(locale, "debrief.outcome.corrected")
  if (item.outcome === "unresolved") return translateMessage(locale, "debrief.outcome.unresolved")
  if (item.outcome === "not-assessable") return translateMessage(locale, "debrief.outcome.notAssessable")
  return item.finalAnswerStatus === "earned"
    ? translateMessage(locale, "debrief.outcome.assistedSolved")
    : translateMessage(locale, "debrief.outcome.assistedFinished")
}

function evidenceStatusLabel(status: SessionReviewEvidenceStatus, locale: AppLocale): string {
  if (status === "earned") return translateMessage(locale, "debrief.evidence.earned")
  if (status === "missed") return translateMessage(locale, "debrief.evidence.missed")
  return translateMessage(locale, "debrief.evidence.notAssessable")
}

function sessionTimingLabel(
  timing: SessionReviewTiming,
  baselineSeconds?: number,
  locale: AppLocale = "de",
): string {
  const comparison = baselineSeconds === undefined
    ? ""
    : translateMessage(locale, "debrief.timing.usual", { time: formatMinutes(baselineSeconds) })
  switch (timing) {
    case "faster": return translateMessage(locale, "debrief.timing.faster", { comparison })
    case "typical": return translateMessage(locale, "debrief.timing.typical", { comparison })
    case "slower": return translateMessage(locale, "debrief.timing.slower", { comparison })
    case "no-baseline": return translateMessage(locale, "debrief.timing.none")
  }
}

function recommendedReviewCopy(item: SessionReviewItem, locale: AppLocale): string {
  switch (item.outcome) {
    case "unresolved":
      return translateMessage(locale, "debrief.recommend.unresolved")
    case "assisted":
      return translateMessage(locale, "debrief.recommend.assisted")
    case "corrected":
      return translateMessage(locale, "debrief.recommend.corrected")
    case "not-assessable":
      return translateMessage(locale, "debrief.recommend.notAssessable")
    case "independent":
      return translateMessage(locale, "debrief.recommend.independent")
  }
}

function formattedAssessmentNumber(value: number, decimals: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  }).format(value)
}

function correctAssessmentAnswerLabel(question: GeneratedQuestion, locale: AppLocale): string {
  if (question.geometryConstruction) {
    return question.response.kind === "choice"
      ? question.response.options.find((option) => (
          option.id === question.geometryConstruction!.expectedTool
        ))?.label ?? question.explanation
      : question.explanation
  }

  switch (question.response.kind) {
    case "number": {
      const value = formattedAssessmentNumber(
        question.response.value,
        question.response.decimals,
        locale,
      )
      return question.response.unit ? `${value} ${question.response.unit}` : value
    }
    case "fraction":
      return `${question.response.numerator}/${question.response.denominator}`
    case "choice": {
      const { options, value } = question.response
      return options.find((option) => option.id === value)?.label ?? value
    }
    case "integer-set":
      return `{${question.response.values.join("; ")}}`
    case "integer-sequence":
      return question.response.values.join(" → ")
    case "coordinate":
      return `(${formattedAssessmentNumber(question.response.x, 0, locale)} | ${formattedAssessmentNumber(question.response.y, 0, locale)})`
  }
}

function submittedAssessmentAnswerLabel(
  question: GeneratedQuestion,
  submittedAnswer: string | undefined,
  locale: AppLocale,
): string {
  const value = submittedAnswer?.trim() ?? ""
  if (!value) return translateMessage(locale, "debrief.assessment.noAnswer")

  if (question.geometryConstruction) {
    const construction = decodeGeometryConstructionAnswer(value)
    if (!construction || question.response.kind !== "choice") {
      return translateMessage(locale, "debrief.assessment.savedConstruction")
    }
    const tool = question.response.options.find((option) => option.id === construction.tool)?.label
    return tool
      ? `${tool} · ${translateMessage(locale, "debrief.assessment.savedConstruction")}`
      : translateMessage(locale, "debrief.assessment.savedConstruction")
  }

  if (question.response.kind === "choice") {
    return question.response.options.find((option) => option.id === value)?.label ?? value
  }
  if (question.response.kind === "coordinate") {
    const coordinate = decodeCoordinateDraft(value)
    return `(${coordinate.x || "–"} | ${coordinate.y || "–"})`
  }
  if (question.response.kind === "number" && question.response.unit) {
    return `${value} ${question.response.unit}`
  }
  return value
}

function SessionDebrief({
  review,
  learner,
  onRetryTopic,
  onOpenConcept,
  retryBlockedByAssessment = false,
  assessmentMode = false,
}: {
  review: ReturnType<typeof buildSessionReview>
  learner: LearnerState
  onRetryTopic?: (topicId: TopicId) => void
  onOpenConcept?: (topicId: TopicId) => void
  retryBlockedByAssessment?: boolean
  assessmentMode?: boolean
}) {
  const { locale, copy, t } = useLocalization()
  const mistakeItems = review.items.filter((item) => item.finalAnswerStatus === "missed")
  const visibleItems = assessmentMode ? mistakeItems : review.items
  const recommended = review.recommendedItemIndex === undefined
    ? undefined
    : review.items[review.recommendedItemIndex]
  const nextTopicId = recommended?.result.topicId ?? review.items[0]?.result.topicId
  const nextDueAt = nextTopicId ? learner.mastery[nextTopicId].dueAt : undefined

  return (
    <section className={`session-debrief${assessmentMode ? " assessment-debrief" : ""}`} aria-label={t(assessmentMode ? "debrief.assessment.aria" : "debrief.aria")}>
      <div className="session-debrief-heading">
        <div>
          <span className="eyebrow">{t(assessmentMode ? "debrief.assessment.eyebrow" : "debrief.eyebrow")}</span>
          <h2>{t(assessmentMode ? "debrief.assessment.title" : "debrief.title")}</h2>
        </div>
        <span>{assessmentMode
          ? visibleItems.length === 1
            ? t("debrief.assessment.oneMistake")
            : t("debrief.assessment.manyMistakes", { count: visibleItems.length })
          : review.items.length === 1
            ? t("debrief.oneQuestion")
            : t("debrief.manyQuestions", { count: review.items.length })}</span>
      </div>
      <p className="session-privacy-note">
        <span aria-hidden="true">⌁</span>
        {t(assessmentMode ? "debrief.assessment.privacy" : "debrief.privacy")}
      </p>

      {assessmentMode && visibleItems.length === 0 ? (
        <div className="assessment-review-all-correct" role="status">
          <span aria-hidden="true">✓</span>
          <div><strong>{t("debrief.assessment.allCorrectTitle")}</strong><p>{t("debrief.assessment.allCorrectBody")}</p></div>
        </div>
      ) : (
        <div className="session-review-list">
        {visibleItems.map((item) => (
          <article className={`session-review-item ${item.outcome}`} key={item.question.id}>
            <div className="session-review-topline">
              <span className={`session-outcome ${item.outcome}`}>
                {sessionOutcomeLabel(item, locale)}
              </span>
              <span className={`session-time ${item.timing}`}>
                <span aria-hidden="true">◷</span>
                {formatMinutes(item.result.activeSeconds)} · {sessionTimingLabel(item.timing, item.baselineSeconds, locale)}
              </span>
            </div>
            <div className="session-review-question">
              <small>
                {t("debrief.question", { number: item.index + 1 })} · {topicForLocale(item.result.topicId, locale).shortTitle}
                {item.result.difficultyBand ? ` · ${copy.player.difficultyBands[item.result.difficultyBand]}` : ""}
              </small>
              <h3>{item.question.prompt}</h3>
            </div>

            {assessmentMode && (
              <dl className="assessment-answer-comparison">
                <div className="submitted">
                  <dt>{t("debrief.assessment.yourAnswer")}</dt>
                  <dd>{item.result.submittedAnswer === undefined
                    ? t("debrief.assessment.answerUnavailable")
                    : submittedAssessmentAnswerLabel(item.question, item.result.submittedAnswer, locale)}</dd>
                </div>
                <div className="correct">
                  <dt>{t("debrief.assessment.correctAnswer")}</dt>
                  <dd>{correctAssessmentAnswerLabel(item.question, locale)}</dd>
                </div>
                <div className="explanation">
                  <dt>{t("debrief.assessment.explanation")}</dt>
                  <dd>{item.question.explanation}</dd>
                </div>
              </dl>
            )}

            {item.result.diagnostic && (
              <div className={`session-diagnostic ${item.result.diagnostic.resolved ? "resolved" : "open"}`}>
                <span aria-hidden="true">{item.result.diagnostic.resolved ? "✓" : "↻"}</span>
                <div>
                  <strong>{item.result.diagnostic.title}</strong>
                  <small>{item.result.diagnostic.resolved ? t("debrief.diagnosticResolved") : t("debrief.diagnosticOpen")}</small>
                </div>
              </div>
            )}

            <div className="session-evidence">
              <div>
                <strong>{t("debrief.evidenceTitle")}</strong>
                <small>{t("debrief.noPoints")}</small>
              </div>
              <ul>
                {item.milestones.map((milestone) => (
                  <li className={milestone.status} key={milestone.id}>
                    <span aria-hidden="true">
                      {milestone.status === "earned" ? "✓" : milestone.status === "missed" ? "○" : "–"}
                    </span>
                    <span>{milestone.label}</span>
                    <small>{evidenceStatusLabel(milestone.status, locale)}</small>
                  </li>
                ))}
              </ul>
            </div>

            <details className="session-solution-path">
              <summary>{t("debrief.viewPath")}</summary>
              <ol>{item.question.workedSteps.map((step) => <li key={step}>{step}</li>)}</ol>
            </details>
          </article>
        ))}
        </div>
      )}

      <div className={`session-next-action ${recommended ? "practice" : "secure"}`}>
        <div className="session-next-icon" aria-hidden="true">{recommended ? "↗" : "✓"}</div>
        <div>
          <span className="eyebrow">{t("debrief.nextEyebrow")}</span>
          <h3>
            {recommended
              ? t("debrief.newValues", { topic: topicForLocale(recommended.result.topicId, locale).shortTitle })
              : t("debrief.continuePlan")}
          </h3>
          <p>
            {recommended
              ? recommendedReviewCopy(recommended, locale)
              : t("debrief.allSecure")}
          </p>
          {nextTopicId && (
            <small>
              {nextDueAt
                ? t("debrief.savedReview", { date: formatReviewDate(nextDueAt, locale) })
                : t("debrief.savedRecovery")}
            </small>
          )}
          {recommended && (
            <div className="session-next-buttons">
              {onRetryTopic && !retryBlockedByAssessment && (
                <button className="primary-button" type="button" onClick={() => onRetryTopic(recommended.result.topicId)}>
                  {t("debrief.solveVariant")}
                </button>
              )}
              {onOpenConcept && (
                <button className="secondary-button" type="button" onClick={() => onOpenConcept(recommended.result.topicId)}>
                  {t("debrief.openIdea")}
                </button>
              )}
            </div>
          )}
          {recommended && retryBlockedByAssessment && (
            <small className="session-assessment-priority">{t("debrief.assessmentPriority")}</small>
          )}
        </div>
      </div>
    </section>
  )
}

function PlacementCompletionView({
  summary,
  onContinue,
}: {
  summary: CompletionSummary
  onContinue: () => void
}) {
  const { locale, copy, t } = useLocalization()
  const { event, learner } = summary
  const sessionReview = buildSessionReview(summary.task, event, learner)
  const secureTopicIds = event.questionResults
    .filter(isSecureAssessmentResult)
    .map((result) => result.topicId)
  const lessonTopicCount = event.topicIds.length - secureTopicIds.length
  const firstAssignment = buildAssignments(learner, new Date(event.completedAt))[0]
  const firstAssignmentPresentation = firstAssignment
    ? taskPresentationForLocale(firstAssignment, locale)
    : undefined
  const practiceRhythm = learner.preferences.practiceDays
    .map((day) => copy.profile.practiceDayLabels[day])
    .join(" · ")

  return (
    <main className="completion-shell placement-completion-shell">
      <section className="placement-completion-card">
        <div className="placement-completion-mark" aria-hidden="true">◎</div>
        <span className="eyebrow">{t("placement.eyebrow")}</span>
        <h1>{t("placement.title")}</h1>
        <p>
          {secureTopicIds.length === 0
            ? t("placement.noneSecure")
            : secureTopicIds.length === 1
              ? t("placement.secureOne")
              : t("placement.secureMany", { count: secureTopicIds.length })}
        </p>

        <div className="placement-completion-stats">
          <div><span>{t("placement.confirmed")}</span><strong>{secureTopicIds.length}/{event.topicIds.length}</strong></div>
          <div><span>{t("placement.firstLessons")}</span><strong>{lessonTopicCount}</strong></div>
          <div><span>{t("placement.activeTime")}</span><strong>{formatMinutes(event.activeSeconds)}</strong></div>
        </div>

        {secureTopicIds.length > 0 && (
          <div className="placement-confirmed-topics">
            <span>{t("placement.returns")}</span>
            <div>
              {secureTopicIds.map((topicId) => (
                <span key={topicId}>✓ {topicForLocale(topicId, locale).shortTitle}</span>
              ))}
            </div>
          </div>
        )}

        <section className="placement-week-plan" aria-labelledby="placement-week-title">
          <div className="placement-week-heading">
            <span className="eyebrow">{t("placement.weekEyebrow")}</span>
            <h2 id="placement-week-title">{t("placement.weekTitle")}</h2>
          </div>
          <div className="placement-week-rows">
            <div>
              <span>{t("placement.next")}</span>
              <strong>{firstAssignmentPresentation?.title ?? t("placement.foundations")}</strong>
            </div>
            <div>
              <span>{t("placement.tomorrow")}</span>
              <strong>
                {secureTopicIds.length > 0
                  ? secureTopicIds.length === 1
                    ? t("placement.reviewOne")
                    : t("placement.reviewMany", { count: secureTopicIds.length })
                  : t("placement.reviewsLater")}
              </strong>
            </div>
            <div>
              <span>{t("placement.rhythm")}</span>
              <strong>{practiceRhythm} · {learner.preferences.sessionMinutes} {t("common.minutesShort")}</strong>
            </div>
          </div>
          <small>{t("placement.weekNote")}</small>
        </section>

        <div className="placement-explainer">
          <span aria-hidden="true">↻</span>
          <p><strong>{t("placement.noSkipTitle")}</strong> {t("placement.noSkipBody")}</p>
        </div>

        <SessionDebrief
          review={sessionReview}
          learner={learner}
          assessmentMode
        />

        <button className="primary-button wide" type="button" onClick={onContinue}>
          {t("placement.openPlan")}
        </button>
        <small>{t("placement.noXp")}</small>
      </section>
    </main>
  )
}

const learnerFeedbackKinds = [...learnerFeedbackKindIds] as LearnerFeedbackKind[]

export function LearnerFeedbackPanel({
  learner,
  event,
  onSubmit,
  onRetryTopic,
  onOpenConcept,
  retryBlockedByAssessment = false,
}: {
  learner: LearnerState
  event: LearningEvent
  onSubmit: (kind: LearnerFeedbackKind) => void
  onRetryTopic?: (topicId: TopicId) => void
  onOpenConcept?: (topicId: TopicId) => void
  retryBlockedByAssessment?: boolean
}) {
  const { locale, t } = useLocalization()
  const feedbackCopy = learnerFeedbackCopyForLocale(locale)
  const submitted = feedbackForEvent(learner, event.id)
  const submittedCopy = submitted ? feedbackCopy[submitted.kind] : undefined
  const topicId = event.topicIds[0]
  const wantsFreshVariant = submitted?.kind === "more-practice"
  const wantsConcept = submitted?.kind === "explanation-unclear" || submitted?.kind === "question-unclear"

  return (
    <section className="learner-feedback-panel" aria-labelledby="learner-feedback-title">
      <div className="learner-feedback-heading">
        <div>
          <span className="eyebrow">{t("feedback.eyebrow")}</span>
          <h2 id="learner-feedback-title">{t("feedback.title")}</h2>
        </div>
        <span>{t("feedback.optional")}</span>
      </div>

      {submitted ? (
        <div className={`learner-feedback-saved ${submittedCopy!.concern ? "concern" : "clear"}`} role="status">
          <span aria-hidden="true">{submittedCopy!.concern ? "↻" : "✓"}</span>
          <div>
            <strong>{t("feedback.saved", { label: submittedCopy!.label })}</strong>
            <small>{submittedCopy!.detail}</small>
            <small className="learner-feedback-next">{submittedCopy!.learnerNextAction}</small>
            {wantsFreshVariant && topicId && onRetryTopic && !retryBlockedByAssessment && (
              <button className="secondary-button compact" type="button" onClick={() => onRetryTopic(topicId)}>
                {t("feedback.freshVariant")}
              </button>
            )}
            {wantsFreshVariant && retryBlockedByAssessment && (
              <small className="learner-feedback-priority">{t("feedback.assessmentPriority")}</small>
            )}
            {wantsConcept && topicId && onOpenConcept && (
              <button className="secondary-button compact" type="button" onClick={() => onOpenConcept(topicId)}>
                {t("feedback.openIdea")}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="learner-feedback-options">
          {learnerFeedbackKinds.map((kind) => {
            const copy = feedbackCopy[kind]
            return (
              <button key={kind} type="button" onClick={() => onSubmit(kind)}>
                <strong>{copy.label}</strong>
                <small>{copy.detail}</small>
              </button>
            )
          })}
        </div>
      )}

      <p>
        {t("feedback.policy")}
      </p>
    </section>
  )
}

export function CompletionView({
  summary,
  onContinue,
  onRetryTopic,
  onOpenConcept,
  onLearnerFeedback,
  retryBlockedByAssessment = false,
}: {
  summary: CompletionSummary
  onContinue: () => void
  onRetryTopic?: (topicId: TopicId) => void
  onOpenConcept?: (topicId: TopicId) => void
  onLearnerFeedback?: (kind: LearnerFeedbackKind) => void
  retryBlockedByAssessment?: boolean
}) {
  const { locale, t } = useLocalization()
  const { task, event, award, learner } = summary
  if (task.kind === "placement") {
    return <PlacementCompletionView summary={summary} onContinue={onContinue} />
  }
  const sessionReview = buildSessionReview(task, event, learner)
  const independent = event.questionResults.filter((result) => result.independentlySolved).length
  const isLessonRecovery = task.purpose === "lesson-recovery"
  const isReview = task.kind === "review" || (task.kind === "repair" && !isLessonRecovery)
  const isAssessment = task.kind === "assessment"
  const minimalFocus = learner.preferences.visualMode === "focus"
  const isLessonFlow = task.kind === "lesson" || isLessonRecovery
  const topic = topicForLocale(task.topicIds[0]!, locale)
  const topicMastery = learner.mastery[task.topicIds[0]!]
  const lessonSecured = isLessonFlow && topicMastery.status === "mastered"
  const assessmentReport = isAssessment
    ? buildAssessmentReport(task, event, learner)
    : undefined
  const lessonMistakePolicy = requireLearnerCurriculumPackage(learner).xp.lessonMistakePolicy
  const newAchievements = minimalFocus ? [] : achievementsUnlockedAt(learner, event.completedAt, locale)
  const completionHeading = isAssessment
    ? assessmentReport!.reviewTopicIds.length === 0
      ? t("completion.assessment.secureTitle")
      : t("completion.assessment.reviewTitle")
    : isLessonRecovery
      ? lessonSecured
        ? t("completion.recovery.secureTitle")
        : t("completion.recovery.buildingTitle")
      : isReview
        ? t("completion.reviewTitle")
        : lessonSecured
          ? t("completion.lesson.secureTitle")
          : t("completion.lesson.buildingTitle")
  const completionDescription = isAssessment
    ? assessmentReport!.reviewTopicIds.length === 0
      ? t("completion.assessment.secureBody")
      : assessmentReport!.reviewTopicIds.length === 1
        ? t("completion.assessment.reviewOne")
        : t("completion.assessment.reviewMany", { count: assessmentReport!.reviewTopicIds.length })
    : isLessonRecovery
      ? lessonSecured
        ? t("completion.recovery.secureBody", { topic: topic.shortTitle })
        : t("completion.recovery.buildingBody", { topic: topic.shortTitle })
      : isReview
        ? t("completion.reviewBody", { topic: topic.shortTitle })
        : lessonSecured
          ? t("completion.lesson.secureBody")
          : t("completion.lesson.buildingBody")

  return (
    <main className="completion-shell">
      <section className={`completion-card ${task.kind} with-debrief`}>
        <div className="completion-burst" aria-hidden="true"><span>{isAssessment ? "◆" : isLessonFlow && !lessonSecured ? "↻" : "✓"}</span></div>
        <span className="eyebrow">
          {isAssessment ? minimalFocus ? t("completion.assessmentEyebrow") : t("completion.checkEyebrow") : t("completion.done")}
        </span>
        <h1>{completionHeading}</h1>
        <p>{completionDescription}</p>

        {isAssessment ? (
          <div className="completion-stats assessment-stats">
            <div><span>{t("completion.secure")}</span><strong>{assessmentReport!.correct}/{assessmentReport!.total}</strong></div>
            <div><span>{t("completion.targetedReviews")}</span><strong>{assessmentReport!.reviewTopicIds.length}</strong></div>
            <div><span>{t("completion.activeTime")}</span><strong>{formatMinutes(event.activeSeconds)}</strong></div>
          </div>
        ) : (
          <div className="completion-stats">
            <div className="xp-earned"><span>+</span><strong>{award.totalXp}</strong><small>XP</small></div>
            <div><span>{t("completion.independent")}</span><strong>{independent}/{event.questionResults.length}</strong></div>
            <div><span>{t("completion.activeTime")}</span><strong>{formatMinutes(event.activeSeconds)}</strong></div>
          </div>
        )}

        {newAchievements.length > 0 && (
          <section className="new-achievements" aria-label={t("completion.newBadgesAria")}>
            <div className="new-achievements-heading">
              <span aria-hidden="true">✦</span>
              <div><small>{t("completion.newBadge")}</small><strong>{newAchievements.length === 1 ? t("completion.unlockedOne") : t("completion.unlockedMany", { count: newAchievements.length })}</strong></div>
            </div>
            <div>
              {newAchievements.map((item) => (
                <article key={item.id}>
                  <span aria-hidden="true">{item.icon}</span>
                  <p><strong>{item.title}</strong><small>{item.description}</small></p>
                </article>
              ))}
            </div>
          </section>
        )}

        {assessmentReport && (
          <section className="assessment-report" aria-label={t("completion.reportAria")}>
            <div className="assessment-report-heading">
              <div>
                <span className="eyebrow">{t("completion.reportEyebrow")}</span>
                <h2>{t("completion.reportSecure", { percentage: assessmentReport.percentage })}</h2>
              </div>
              <span>{t("completion.of", { correct: assessmentReport.correct, total: assessmentReport.total })}</span>
            </div>
            <div className="assessment-topic-results">
              {assessmentReport.topicOutcomes.map((outcome) => (
                <div className={`assessment-topic-result ${outcome.status}`} key={outcome.topicId}>
                  <span className="assessment-result-icon" aria-hidden="true">
                    {outcome.status === "secure" ? "✓" : "↻"}
                  </span>
                  <div>
                    <strong>{topicForLocale(outcome.topicId, locale).shortTitle}</strong>
                    <small>
                      {outcome.status === "secure"
                        ? t("completion.availableToday")
                        : t("completion.reviewDue", { date: formatReviewDate(outcome.reviewDueAt, locale) })}
                    </small>
                  </div>
                  <span>{outcome.correct}/{outcome.total}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {assessmentReport && assessmentReport.reviewTopicIds.length > 0 && (
          <section className="checkpoint-return-brief" aria-labelledby="checkpoint-return-brief-title">
            <div aria-hidden="true">⌁</div>
            <div>
              <span className="eyebrow">{minimalFocus ? t("completion.reviewsPlanned") : t("completion.returnPlanned")}</span>
              <h2 id="checkpoint-return-brief-title">
                {minimalFocus
                  ? assessmentReport.reviewTopicIds.length === 1
                    ? t("completion.reviewPlannedOne")
                    : t("completion.reviewPlannedMany", { count: assessmentReport.reviewTopicIds.length })
                  : assessmentReport.reviewTopicIds.length === 1
                    ? t("completion.returnPlannedOne")
                    : t("completion.returnPlannedMany", { count: assessmentReport.reviewTopicIds.length })}
              </h2>
              <p>
                {minimalFocus
                  ? t("completion.reviewPlanBody")
                  : t("completion.returnPlanBody")}
              </p>
            </div>
          </section>
        )}

        {task.kind === "lesson" && (
          <div className="xp-rule-note">
            <strong>{t("completion.lessonXpTitle")}</strong>
            <span>{t("completion.lessonXpRule", {
              bonus: Math.round(lessonMistakePolicy.perfectBonusRate * 100),
              fullMistakes: lessonMistakePolicy.fullXpMaxMistakes,
              deduction: Math.round(lessonMistakePolicy.deductionRatePerAdditionalMistake * 100),
              lastPaidMistakes: lessonMistakePolicy.noXpAfterMistakes,
            })}</span>
          </div>
        )}

        {isLessonFlow && (
          <div className={`mastery-outcome-note ${lessonSecured ? "secure" : "building"}`}>
            <strong>{lessonSecured ? t("completion.topicUnlocked") : t("completion.understandingBuilding")}</strong>
            <span>
              {t("completion.mastery", {
                supported: Math.round(topicMastery.supportedMastery * 100),
                independent: Math.round(topicMastery.independentMastery * 100),
              })}
            </span>
          </div>
        )}

        {isLessonRecovery && (
          <div className="xp-rule-note recovery-rule">
            <strong>{t("completion.recoveryXpTitle")}</strong>
            <span>{t("completion.recoveryXpBody", { xp: task.maxXp })}</span>
          </div>
        )}

        {isReview && (
          <div className="xp-rule-note review-rule">
            <strong>{t("completion.reviewXpTitle")}</strong>
            <span>{t("completion.reviewXpBody", { xp: task.maxXp })}</span>
          </div>
        )}

        {isAssessment && (
          <div className="assessment-xp-note">
            <span>+{award.totalXp} XP</span>
            <p>{t("completion.assessmentXpBody")}</p>
          </div>
        )}

        <SessionDebrief
          review={sessionReview}
          learner={learner}
          onRetryTopic={onRetryTopic}
          onOpenConcept={onOpenConcept}
          retryBlockedByAssessment={retryBlockedByAssessment}
          assessmentMode={isAssessment}
        />

        {onLearnerFeedback && (
          <LearnerFeedbackPanel
            learner={learner}
            event={event}
            onSubmit={onLearnerFeedback}
            onRetryTopic={onRetryTopic}
            onOpenConcept={onOpenConcept}
            retryBlockedByAssessment={retryBlockedByAssessment}
          />
        )}

        <div className="total-xp-line"><span>{t("completion.total")}</span><strong>{learner.totalXp} XP</strong></div>
        <button className="primary-button wide" type="button" onClick={onContinue}>{t("completion.back")}</button>
      </section>
    </main>
  )
}

export function MockExamSetupView({
  latestResult,
  officialDocuments = {},
  officialArchiveLibrary = {},
  activeOfficialEditionId,
  archivePracticeHistory = [],
  activeArchivePractice,
  archivePracticeBlocked = false,
  onBack,
  onStart,
  onStartOfficial,
  onResumeOfficial,
  onImportOfficial,
  onImportOfficialArchive,
  onReviewOfficial,
  onStartArchivePractice,
  onResumeArchivePractice,
}: {
  latestResult?: MockExamResult
  officialDocuments?: OfficialArchiveDocuments
  officialArchiveLibrary?: OfficialArchiveLibrary
  activeOfficialEditionId?: OfficialArchiveEditionId
  archivePracticeHistory?: readonly ArchivePracticeResult[]
  activeArchivePractice?: ActiveArchivePractice
  archivePracticeBlocked?: boolean
  onBack: () => void
  onStart: () => void
  onStartOfficial?: (editionId: OfficialArchiveEditionId) => void
  onResumeOfficial?: () => void
  onImportOfficial?: (
    editionId: OfficialArchiveEditionId,
    kind: OfficialArchiveDocumentKind,
    file: File,
  ) => Promise<void>
  onImportOfficialArchive?: (files: readonly File[]) => Promise<OfficialArchiveBulkImportResult>
  onReviewOfficial?: () => void
  onStartArchivePractice?: (editionId: OfficialArchiveEditionId) => void
  onResumeArchivePractice?: () => void
}) {
  const { locale } = useLocalization()
  const ui = examCopy(locale)
  const [importing, setImporting] = useState<string>()
  const [importError, setImportError] = useState<string>()
  const effectiveArchiveLibrary: OfficialArchiveLibrary = {
    ...officialArchiveLibrary,
    [OFFICIAL_2025_EDITION_ID]: {
      ...officialArchiveLibrary[OFFICIAL_2025_EDITION_ID],
      ...officialDocuments,
    },
  }
  const pendingOfficialReview = latestResult?.source === "official-archive" && latestResult.officialReview?.status === "pending"
  const latestOfficialBlueprint = officialExamDefinition(latestResult?.editionId)?.blueprint
  const latestOfficialYear = latestOfficialBlueprint?.year

  const importDocument = async (
    editionId: OfficialArchiveEditionId,
    kind: OfficialArchiveDocumentKind,
    file: File | undefined,
  ) => {
    if (!file || !onImportOfficial) return
    setImporting(`${editionId}:${kind}`)
    setImportError(undefined)
    try {
      await onImportOfficial(editionId, kind, file)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : ui.setup.importFailure)
    } finally {
      setImporting(undefined)
    }
  }

  return (
    <main className="mock-setup-shell">
      <button className="curriculum-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> {ui.common.learningPlan}
      </button>
      <section className="mock-setup-hero">
        <div className="mock-setup-copy">
          <span className="eyebrow">{ui.setup.generatedEyebrow}</span>
          <h1>{ui.setup.title}</h1>
          <p>{ui.setup.body}</p>
          <div className="mock-setup-stats" aria-label={ui.setup.scopeAria}>
            <div><strong>60:00</strong><span>{ui.common.minutes}</span></div>
            <div><strong>9</strong><span>{ui.common.task(9)}</span></div>
            <div><strong>36</strong><span>{ui.common.point(36)}</span></div>
          </div>
        </div>
        <div className="mock-rules-card">
          <span className="eyebrow">{ui.setup.rulesEyebrow}</span>
          <h2>{ui.setup.beforeStart}</h2>
          <ul>{ui.setup.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          <button className="primary-button wide" type="button" onClick={onStart}>
            {ui.setup.start}
          </button>
          <small>{ui.setup.deadlineNote}</small>
        </div>
      </section>
      {latestResult && (
        <section className="mock-latest-result">
          <span>{latestResult.source === "official-archive" ? ui.setup.latestOfficial : ui.setup.latestGenerated}</span>
          <strong>{pendingOfficialReview
            ? `${latestOfficialYear ?? ui.setup.officialEdition} · ${ui.setup.correctionOpen}`
            : `${latestResult.certainPoints} ${latestResult.officialReview?.status === "complete" ? ui.setup.correctedPoints : ui.setup.certainPoints}`}</strong>
          <p>
            {latestResult.officialReview?.status === "complete"
              ? latestResult.officialReview.mathematicsGrade !== undefined
                ? ui.setup.reviewedWithGrade(latestResult.certainPoints, latestResult.maxPoints, formatSwissGrade(latestResult.officialReview.mathematicsGrade))
                : latestOfficialBlueprint?.grade.status === "unavailable"
                  ? ui.setup.reviewedNoScale(latestResult.certainPoints, latestResult.maxPoints)
                  : ui.setup.reviewedNoConversion(latestResult.certainPoints, latestResult.maxPoints)
              : latestResult.reviewablePoints > 0
              ? ui.setup.reviewPending(latestResult.reviewablePoints)
              : ui.setup.allSecure}
          </p>
          {pendingOfficialReview && onReviewOfficial && (
            <button className="secondary-button" type="button" onClick={onReviewOfficial}>
              {ui.setup.continueCorrection}
            </button>
          )}
        </section>
      )}

      <section className="official-archive-setup" aria-labelledby="official-archive-heading">
        <div className="official-archive-copy">
          <span className="eyebrow">{ui.setup.officialEyebrow}</span>
          <h2 id="official-archive-heading">{ui.setup.officialTitle}</h2>
          <p>{ui.setup.officialBody}</p>
          <div className="official-privacy-note">
            <strong>{ui.setup.notInBackup}</strong>
            <span>{ui.setup.reimportAfterDeviceChange}</span>
          </div>
        </div>
        <div className="official-replay-grid">
          {([OFFICIAL_2025_EDITION_ID, OFFICIAL_2024_EDITION_ID, OFFICIAL_2023_EDITION_ID, OFFICIAL_2015_EDITION_ID] as const).map((editionId) => {
            const edition = officialArchiveCatalog[editionId]
            const blueprint = officialExamDefinition(editionId)!.blueprint
            const documents = effectiveArchiveLibrary[editionId] ?? {}
            const ready = hasOfficialArchiveEdition(documents, editionId)
            const activeThisEdition = activeOfficialEditionId === editionId
            const anotherExamActive = Boolean(activeOfficialEditionId && !activeThisEdition)
            return (
              <div className="official-import-card" key={editionId}>
                <span className="eyebrow">{ui.setup.edition(edition.year)}</span>
                <h3>{ready ? ui.setup.editionReady(edition.year) : ui.setup.importTwo}</h3>
                <div className="official-file-list">
                  {(["tasks", "solutions"] as const).map((kind) => {
                    const document = documents[kind]
                    const definition = edition.documents[kind]
                    const importKey = `${editionId}:${kind}`
                    return (
                      <label className={document ? "ready" : ""} key={kind}>
                        <span aria-hidden="true">{document ? "✓" : kind === "tasks" ? "1" : "2"}</span>
                        <div>
                          <strong>{definition.title}</strong>
                          <small>{document ? ui.setup.storedLocally(document.filename) : importing === importKey ? ui.setup.checkingFile : ui.setup.choosePdf}</small>
                        </div>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={!onImportOfficial || Boolean(importing)}
                          aria-label={ui.setup.importDocument(definition.title)}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            event.target.value = ""
                            void importDocument(editionId, kind, file)
                          }}
                        />
                      </label>
                    )
                  })}
                </div>
                {activeThisEdition ? (
                  <button
                    className="primary-button wide"
                    type="button"
                    disabled={!ready || !onResumeOfficial}
                    onClick={onResumeOfficial}
                  >
                    {ui.setup.resumeReplay(edition.year)}
                  </button>
                ) : (
                  <button
                    className="primary-button wide"
                    type="button"
                    disabled={!ready || !onStartOfficial || Boolean(importing) || anotherExamActive}
                    onClick={() => onStartOfficial?.(editionId)}
                  >
                    {anotherExamActive ? ui.setup.anotherExamRunning : ui.setup.startReplay(edition.year)}
                  </button>
                )}
                <small>
                  60 {ui.common.minutes} · 9 {ui.common.task(9)} · 36 {ui.common.point(36)} · {blueprint.review.rubricLabel} · {blueprint.grade.status === "verified" ? blueprint.grade.label : ui.setup.withoutGradeConversion}
                </small>
              </div>
            )
          })}
        </div>
      </section>
      {importError && <p className="official-import-error" role="alert">{importError}</p>}
      <OfficialArchiveShelf
        library={effectiveArchiveLibrary}
        onImport={onImportOfficialArchive}
        archivePracticeHistory={archivePracticeHistory}
        activeArchivePractice={activeArchivePractice}
        practiceBlocked={archivePracticeBlocked}
        onStartPractice={onStartArchivePractice}
        onResumePractice={onResumeArchivePractice}
      />
    </main>
  )
}

function MockAnswerControl({
  part,
  question,
  answer,
  onChange,
}: {
  part: MockExamPartBlueprint
  question: GeneratedQuestion
  answer: string
  onChange: (value: string) => void
}) {
  const { locale } = useLocalization()
  const ui = examCopy(locale)
  const safeId = part.id.replace(/[^A-Za-z0-9_-]/g, "-")
  const coordinate = question.response.kind === "coordinate"
    ? decodeCoordinateDraft(answer)
    : undefined

  if (question.geometryConstruction) {
    return (
      <GeometryConstructionWorkbench
        spec={question.geometryConstruction}
        answer={decodeGeometryConstructionAnswer(answer)}
        disabled={false}
        attention={false}
        onChange={(next) => onChange(encodeGeometryConstructionAnswer(next))}
      />
    )
  }

  if (question.response.kind === "coordinate") {
    return (
      <fieldset className="coordinate-answer mock-coordinate-answer">
        <legend>{question.answerLabel}</legend>
        <span aria-hidden="true">P′(</span>
        <label htmlFor={`${safeId}-x`}>
          <span>x</span>
          <input
            id={`${safeId}-x`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={coordinate?.x ?? ""}
            aria-label={ui.answer.coordinateX(part.label)}
            onChange={(event) => onChange(encodeCoordinateDraft(event.target.value, coordinate?.y ?? ""))}
          />
        </label>
        <i aria-hidden="true">|</i>
        <label htmlFor={`${safeId}-y`}>
          <span>y</span>
          <input
            id={`${safeId}-y`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={coordinate?.y ?? ""}
            aria-label={ui.answer.coordinateY(part.label)}
            onChange={(event) => onChange(encodeCoordinateDraft(coordinate?.x ?? "", event.target.value))}
          />
        </label>
        <span aria-hidden="true">)</span>
      </fieldset>
    )
  }

  if (question.response.kind === "choice") {
    return (
      <fieldset className="answer-options mock-answer-options">
        <legend>{question.answerLabel}</legend>
        {question.response.options.map((option) => (
          <button
            className={answer === option.id ? "selected" : ""}
            type="button"
            key={option.id}
            aria-pressed={answer === option.id}
            onClick={() => onChange(option.id)}
          >
            <span>{option.id.length === 1 ? option.id.toUpperCase() : "○"}</span>
            {option.label}
          </button>
        ))}
      </fieldset>
    )
  }

  const unit = question.response.kind === "number" ? question.response.unit : undefined
  return (
    <div className="mock-answer-field">
      <label htmlFor={`${safeId}-answer`}>{question.answerLabel}</label>
      <div className="answer-input-wrap">
        <input
          id={`${safeId}-answer`}
          type="text"
          inputMode={question.response.kind === "number" ? "decimal" : "text"}
          autoComplete="off"
          value={answer}
          placeholder={
            question.response.kind === "fraction"
              ? ui.answer.fractionExample
              : question.response.kind === "integer-set"
                ? ui.answer.integerSet
                : question.response.kind === "integer-sequence"
                  ? ui.answer.integerSequence
                : undefined
          }
          onChange={(event) => onChange(event.target.value)}
        />
        {unit && <span>{unit}</span>}
      </div>
    </div>
  )
}

function MockExamPart({
  part,
  answer,
  working,
  onAnswerChange,
  onWorkingChange,
}: {
  part: MockExamPartBlueprint
  answer: string
  working: string
  onAnswerChange: (value: string) => void
  onWorkingChange: (value: string) => void
}) {
  const { locale } = useLocalization()
  const ui = examCopy(locale)
  const question = useMemo(() => generateMockPartQuestion(part), [part])
  const methodRequired = mockPartRequiresMethod(question)
  const workingId = `${part.id.replace(/[^A-Za-z0-9_-]/g, "-")}-working`

  return (
    <article className="mock-part-card">
      <div className="mock-part-heading">
        <span>{part.label}</span>
        <div>
          <small>{topicForLocale(part.topicId, locale).shortTitle}</small>
          <strong>{part.maxPoints} {ui.common.point(part.maxPoints)}</strong>
        </div>
      </div>
      <h2>{question.prompt}</h2>
      {!question.geometryConstruction && <QuestionVisual question={question} />}
      <MockAnswerControl
        part={part}
        question={question}
        answer={answer}
        onChange={onAnswerChange}
      />
      {methodRequired && (
        <div className="mock-working-field">
          <label htmlFor={workingId}>{ui.answer.transparentWorking}</label>
          <textarea
            id={workingId}
            rows={4}
            maxLength={5_000}
            value={working}
            onChange={(event) => onWorkingChange(normalizeMathFormulaSymbols(event.target.value))}
            placeholder={ui.answer.workingPlaceholder}
          />
          <small>{ui.answer.workingRequiredNote}</small>
        </div>
      )}
    </article>
  )
}

function OfficialExamPart({
  part,
  answer,
  working,
  milestoneAnswers,
  onAnswerChange,
  onWorkingChange,
  onMilestoneChange,
}: {
  part: OfficialExamPartBlueprint
  answer: string
  working: string
  milestoneAnswers: Record<string, string>
  onAnswerChange: (value: string) => void
  onWorkingChange: (value: string) => void
  onMilestoneChange: (milestoneId: string, value: string) => void
}) {
  const { locale } = useLocalization()
  const ui = examCopy(locale)
  const safeId = part.id.replace(/[^A-Za-z0-9_-]/g, "-")
  const response = part.response
  const labels = response.kind === "face-labels"
    ? decodeOfficialFaceLabels(answer, response.fields.length)
    : []
  const truthValues = response.kind === "true-false-grid"
    ? decodeOfficialTrueFalseAnswers(answer, response.statements.length)
    : []
  const matchingValues = response.kind === "matching-grid"
    ? decodeOfficialMatchingAnswers(answer, response.fields.length)
    : []

  return (
    <article className="mock-part-card official-answer-card">
      <div className="mock-part-heading">
        <span>{part.label || "•"}</span>
        <div>
          <small>{topicForLocale(part.topicId, locale).shortTitle}</small>
          <strong>{part.maxPoints} {ui.common.point(part.maxPoints)}</strong>
        </div>
      </div>

      {response.kind === "paper" ? (
        <label className="official-paper-check" htmlFor={`${safeId}-paper`}>
          <input
            id={`${safeId}-paper`}
            type="checkbox"
            checked={answer === "completed-on-paper"}
            onChange={(event) => onAnswerChange(event.target.checked ? "completed-on-paper" : "")}
          />
          <span>
            <strong>{response.answerLabel}</strong>
            <small>{response.hint ?? ui.answer.paperDefaultHint}</small>
          </span>
        </label>
      ) : response.kind === "face-labels" ? (
        <fieldset className="official-face-fields">
          <legend>{response.answerLabel}</legend>
          <div>
            {response.fields.map((field, index) => (
              <label key={field} htmlFor={`${safeId}-${field}`}>
                <span>{field}</span>
                <input
                  id={`${safeId}-${field}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={labels[index] ?? ""}
                  onChange={(event) => {
                    const next = [...labels]
                    next[index] = event.target.value.replace(/[^1-4]/g, "").slice(0, 1)
                    onAnswerChange(encodeOfficialFaceLabels(next))
                  }}
                />
              </label>
            ))}
          </div>
        </fieldset>
      ) : response.kind === "true-false-grid" ? (
        <fieldset className="official-true-false-grid">
          <legend>{response.answerLabel}</legend>
          <div>
            {response.statements.map((statement, index) => (
              <fieldset key={statement}>
                <legend><span>{index + 1}</span>{statement}</legend>
                <div>
                  {(["true", "false"] as const).map((value) => (
                    <label className={truthValues[index] === value ? "selected" : ""} key={value}>
                      <input
                        type="radio"
                        name={`${safeId}-statement-${index}`}
                        value={value}
                        aria-label={`${statement}: ${value === "true" ? ui.answer.trueLabel : ui.answer.falseLabel}`}
                        checked={truthValues[index] === value}
                        onChange={() => {
                          const next: OfficialTrueFalseValue[] = [...truthValues]
                          next[index] = value
                          onAnswerChange(encodeOfficialTrueFalseAnswers(next))
                        }}
                      />
                      <span>{value === "true" ? ui.answer.trueLabel : ui.answer.falseLabel}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </fieldset>
      ) : response.kind === "matching-grid" ? (
        <fieldset className="official-matching-grid">
          <legend>{response.answerLabel}</legend>
          <div>
            {response.fields.map((field, index) => (
              <label key={field} htmlFor={`${safeId}-match-${index}`}>
                <span>{field}</span>
                <select
                  id={`${safeId}-match-${index}`}
                  aria-label={ui.answer.matchAria(field)}
                  value={matchingValues[index] ?? ""}
                  onChange={(event) => {
                    const next = [...matchingValues]
                    next[index] = event.target.value
                    onAnswerChange(encodeOfficialMatchingAnswers(next))
                  }}
                >
                  <option value="">{ui.answer.stillOpen}</option>
                  {response.options.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      ) : response.kind === "tuple-set" ? (
        <div className="mock-answer-field official-tuple-answer">
          <label htmlFor={`${safeId}-answer`}>{response.answerLabel}</label>
          <textarea
            id={`${safeId}-answer`}
            rows={8}
            value={answer}
            placeholder={"1, 1, 9\n1, 2, 7\n…"}
            onChange={(event) => onAnswerChange(event.target.value)}
          />
          <small>{ui.answer.tupleNote}</small>
        </div>
      ) : response.kind === "text" && response.multiline ? (
        <div className="mock-answer-field official-text-answer">
          <label htmlFor={`${safeId}-answer`}>{response.answerLabel}</label>
          <textarea
            id={`${safeId}-answer`}
            rows={5}
            maxLength={5_000}
            value={answer}
            placeholder={response.placeholder}
            onChange={(event) => onAnswerChange(event.target.value)}
          />
        </div>
      ) : (
        <div className="mock-answer-field">
          <label htmlFor={`${safeId}-answer`}>{response.answerLabel}</label>
          <div className="answer-input-wrap">
            <input
              id={`${safeId}-answer`}
              type="text"
              inputMode={response.kind === "text" ? response.inputMode ?? "text" : "decimal"}
              autoComplete="off"
              value={answer}
              placeholder={response.kind === "fraction" ? "z. B. 3/4" : response.kind === "text" ? response.placeholder : undefined}
              onChange={(event) => onAnswerChange(event.target.value)}
            />
            {response.kind === "number" && response.unit && <span>{response.unit}</span>}
          </div>
        </div>
      )}

      {part.milestones.length > 0 && (
        <fieldset className="official-milestone-fields">
          <legend>{ui.answer.evidenceLegend} <small>{ui.answer.optional}</small></legend>
          <p>{ui.answer.evidenceBody}</p>
          <div>
            {part.milestones.map((entry) => {
              const multilineCalculation = entry.kind === "calculation" && Boolean(entry.rows)
              return (
                <label
                  className={`official-milestone-field${multilineCalculation ? " calculation-evidence" : ""}`}
                  key={entry.id}
                  htmlFor={`${safeId}-milestone-${entry.id}`}
                >
                  <span>{entry.label}</span>
                  <span className="answer-input-wrap">
                    {multilineCalculation ? (
                      <textarea
                        id={`${safeId}-milestone-${entry.id}`}
                        rows={entry.rows}
                        maxLength={1_000}
                        spellCheck={false}
                        value={milestoneAnswers[entry.id] ?? ""}
                        placeholder={entry.placeholder}
                        onChange={(event) => onMilestoneChange(
                          entry.id,
                          normalizeMathFormulaSymbols(event.target.value),
                        )}
                      />
                    ) : (
                      <input
                        id={`${safeId}-milestone-${entry.id}`}
                        type="text"
                        inputMode={entry.kind === "fraction" || entry.kind === "calculation" ? "text" : "decimal"}
                        autoComplete="off"
                        value={milestoneAnswers[entry.id] ?? ""}
                        placeholder={entry.kind === "fraction"
                          ? ui.answer.fractionMilestoneExample
                          : entry.kind === "calculation"
                            ? entry.placeholder
                            : undefined}
                        onChange={(event) => onMilestoneChange(
                          entry.id,
                          entry.kind === "calculation"
                            ? normalizeMathFormulaSymbols(event.target.value)
                            : event.target.value,
                        )}
                      />
                    )}
                    {entry.unit && <span>{entry.unit}</span>}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      {part.methodRequired && response.kind !== "paper" && (
        <div className="mock-working-field">
          <label htmlFor={`${safeId}-working`}>{ui.answer.workingOrIntermediate}</label>
          <textarea
            id={`${safeId}-working`}
            rows={4}
            maxLength={5_000}
            value={working}
            onChange={(event) => onWorkingChange(normalizeMathFormulaSymbols(event.target.value))}
            placeholder={ui.answer.officialWorkingPlaceholder}
          />
          <small>{ui.answer.officialScoreNote}</small>
        </div>
      )}
    </article>
  )
}

export function MockExamPlayer({
  initialExam,
  officialDocuments = {},
  onChange,
  onFinish,
  onExit,
}: {
  initialExam: ActiveMockExam
  officialDocuments?: OfficialArchiveDocuments
  onChange: (exam: ActiveMockExam) => void
  onFinish: (result: MockExamResult) => void
  onExit: () => void
}) {
  const { locale } = useLocalization()
  const ui = examCopy(locale)
  const [exam, setExam] = useState(initialExam)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const examRef = useRef(exam)
  const finishedRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const onFinishRef = useRef(onFinish)
  const blueprint = useMemo(() => resolveStrictExamBlueprint(exam), [exam])
  const official = blueprint.kind === "official"
  const officialYear = blueprint.kind === "official" ? blueprint.year : undefined
  const currentTask = blueprint.tasks[exam.currentTaskIndex]!
  const currentProgress = exam.progress[exam.currentTaskIndex]!
  const remaining = Math.max(0, Math.ceil((Date.parse(exam.deadlineAt) - nowMs) / 1000))
  const warning = examWarning(locale, remaining)

  examRef.current = exam
  onChangeRef.current = onChange
  onFinishRef.current = onFinish

  useEffect(() => {
    onChangeRef.current(exam)
  }, [exam])

  useEffect(() => {
    const finish = (reason: MockSubmissionReason, at: Date) => {
      if (finishedRef.current) return
      finishedRef.current = true
      onFinishRef.current(gradeStrictExam(examRef.current, reason, at))
    }
    const tick = (countActive = true) => {
      const now = new Date()
      setNowMs(now.getTime())
      if (now.getTime() >= Date.parse(examRef.current.deadlineAt)) {
        finish("timeout", now)
        return
      }
      if (!countActive || document.visibilityState !== "visible") return
      setExam((current) => ({
        ...current,
        updatedAt: now.toISOString(),
        progress: current.progress.map((task, index) => index === current.currentTaskIndex
          ? { ...task, activeSeconds: task.activeSeconds + 1 }
          : task),
      }))
    }
    tick(false)
    const timer = window.setInterval(() => tick(true), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [exam.currentTaskIndex])

  const updateExam = (update: (current: ActiveMockExam) => ActiveMockExam) => {
    setExam((current) => ({
      ...update(current),
      updatedAt: new Date().toISOString(),
    }))
  }

  const navigate = (taskIndex: number) => {
    if (taskIndex === exam.currentTaskIndex) return
    updateExam((current) => ({
      ...current,
      currentTaskIndex: taskIndex,
      progress: current.progress.map((task, index) => index === taskIndex
        ? { ...task, visited: true, visitCount: task.visitCount + 1 }
        : task),
    }))
    setConfirmSubmit(false)
  }

  const updatePart = (
    partIndex: number,
    key: "answer" | "working",
    value: string,
  ) => {
    updateExam((current) => ({
      ...current,
      progress: current.progress.map((task, taskIndex) => taskIndex === current.currentTaskIndex
        ? {
            ...task,
            parts: task.parts.map((part, index) => index === partIndex
              ? { ...part, [key]: value }
              : part),
          }
        : task),
    }))
  }

  const updateMilestone = (
    partIndex: number,
    milestoneId: string,
    value: string,
  ) => {
    updateExam((current) => ({
      ...current,
      progress: current.progress.map((task, taskIndex) => taskIndex === current.currentTaskIndex
        ? {
            ...task,
            parts: task.parts.map((part, index) => index === partIndex
              ? {
                  ...part,
                  milestoneAnswers: {
                    ...(part.milestoneAnswers ?? {}),
                    [milestoneId]: value,
                  },
                }
              : part),
          }
        : task),
    }))
  }

  const unansweredParts = blueprint.tasks.reduce((count, task, taskIndex) => {
    const progress = exam.progress[taskIndex]!
    return count + task.parts.filter((part, partIndex) => {
      const answer = progress.parts[partIndex]?.answer ?? ""
      return part.kind === "official"
        ? !isOfficialPartAnswered(part, answer)
        : !isMockPartAnswered(generateMockPartQuestion(part), answer)
    }).length
  }, 0)

  const submit = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinish(gradeStrictExam(exam, "submitted", new Date()))
  }

  return (
    <main className="mock-exam-shell">
      <header className="mock-exam-toolbar">
        <div className="mock-exam-identity">
          <span>{official ? ui.player.officialEyebrow : ui.player.generatedEyebrow}</span>
          <strong>{officialYear ? ui.player.officialIdentity(officialYear) : ui.player.generatedIdentity}</strong>
        </div>
        <div className={`mock-exam-clock${remaining <= 5 * 60 ? " urgent" : ""}`} aria-label={ui.player.remainingTimeAria(formatMinutes(remaining))}>
          <span aria-hidden="true">◷</span>
          <strong>{formatMinutes(remaining)}</strong>
        </div>
        <button className="mock-exit-button" type="button" onClick={onExit}>
          {ui.player.overview} <small>{ui.player.timeContinues}</small>
        </button>
      </header>

      <div className="mock-exam-body">
        <aside className="mock-task-sidebar" aria-label={ui.player.navigationAria}>
          <div className="mock-task-grid">
            {blueprint.tasks.map((task, index) => {
              const progress = exam.progress[index]!
              const answered = isStrictExamTaskAnswered(task, progress)
              const state = progress.flagged ? "flagged" : answered ? "answered" : progress.visited ? "started" : "unseen"
              return (
                <button
                  className={`${state}${index === exam.currentTaskIndex ? " current" : ""}`}
                  type="button"
                  key={task.id}
                  aria-current={index === exam.currentTaskIndex ? "step" : undefined}
                  aria-label={ui.player.taskState(task.taskNumber, answered ? ui.player.answered : progress.visited ? ui.player.started : ui.player.unseen, progress.flagged)}
                  onClick={() => navigate(index)}
                >
                  <strong>{task.taskNumber}</strong>
                  <span aria-hidden="true">{progress.flagged ? "⚑" : answered ? "✓" : progress.visited ? "•" : ""}</span>
                </button>
              )
            })}
          </div>
          <div className="mock-nav-legend">
            <span><i className="answered" /> {ui.player.answered}</span>
            <span><i className="started" /> {ui.player.started}</span>
            <span><i className="flagged" /> {ui.player.flagged}</span>
          </div>
          <button
            className={`mock-flag-button${currentProgress.flagged ? " active" : ""}`}
            type="button"
            aria-pressed={currentProgress.flagged}
            onClick={() => updateExam((current) => ({
              ...current,
              progress: current.progress.map((task, index) => index === current.currentTaskIndex
                ? { ...task, flagged: !task.flagged }
                : task),
            }))}
          >
            <span aria-hidden="true">⚑</span>
            {currentProgress.flagged ? ui.player.removeFlag : ui.player.flagLater}
          </button>
          <button className="danger-button mock-submit-open" type="button" onClick={() => setConfirmSubmit(true)}>
            {ui.player.submitExam}
          </button>
        </aside>

        <section className="mock-task-workspace">
          <div className="mock-task-topline">
            <div>
              <span>{ui.player.taskProgress(currentTask.taskNumber, blueprint.tasks.length)}</span>
              <h1>{currentTask.title}</h1>
            </div>
            <strong>{currentTask.maxPoints} {ui.common.point(currentTask.maxPoints)}</strong>
          </div>
          {warning && <p className="mock-time-warning" role="status">{warning}</p>}
          {currentTask.kind === "official" && officialDocuments.tasks && (
            <section className="official-task-document" aria-label={ui.player.officialSheetAria(currentTask.taskNumber)}>
              <div>
                <strong>{ui.player.originalQuestionPaper}</strong>
                <span>{ui.player.localPageNoSolution(currentTask.taskPage)}</span>
              </div>
              <PdfPageCanvas
                blob={officialDocuments.tasks.blob}
                pageNumber={currentTask.taskPage}
                title={`ZAP Mathematik ${officialYear}, Aufgabe ${currentTask.taskNumber}`}
              />
            </section>
          )}
          <div className="mock-parts">
            {currentTask.parts.map((part, index) => {
              const draft = currentProgress.parts[index]!
              return part.kind === "official" ? (
                <OfficialExamPart
                  key={part.id}
                  part={part}
                  answer={draft.answer}
                  working={draft.working}
                  milestoneAnswers={draft.milestoneAnswers ?? {}}
                  onAnswerChange={(value) => updatePart(index, "answer", value)}
                  onWorkingChange={(value) => updatePart(index, "working", value)}
                  onMilestoneChange={(milestoneId, value) => updateMilestone(index, milestoneId, value)}
                />
              ) : (
                <MockExamPart
                  key={part.id}
                  part={part}
                  answer={draft.answer}
                  working={draft.working}
                  onAnswerChange={(value) => updatePart(index, "answer", value)}
                  onWorkingChange={(value) => updatePart(index, "working", value)}
                />
              )
            })}
          </div>
          <div className="mock-task-actions">
            <button className="secondary-button" type="button" disabled={exam.currentTaskIndex === 0} onClick={() => navigate(exam.currentTaskIndex - 1)}>
              {ui.player.previous}
            </button>
            {exam.currentTaskIndex < blueprint.tasks.length - 1 ? (
              <button className="primary-button" type="button" onClick={() => navigate(exam.currentTaskIndex + 1)}>
                {ui.player.next}
              </button>
            ) : (
              <button className="primary-button" type="button" onClick={() => setConfirmSubmit(true)}>
                {ui.player.reviewSubmission}
              </button>
            )}
          </div>
        </section>
      </div>

      {confirmSubmit && (
        <div className="mock-submit-layer" role="dialog" aria-modal="true" aria-labelledby="mock-submit-title">
          <section>
            <span className="eyebrow">{ui.player.finalEyebrow}</span>
            <h2 id="mock-submit-title">{ui.player.finalTitle}</h2>
            <p>
              {unansweredParts === 0
                ? ui.player.allAnswered
                : ui.player.unanswered(unansweredParts)}
            </p>
            <div>
              <button className="secondary-button" type="button" onClick={() => setConfirmSubmit(false)}>{ui.player.keepWorking}</button>
              <button className="danger-button" type="button" onClick={submit}>{ui.player.submitFinally}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function mockAnswerLabel(question: GeneratedQuestion, answer: string, locale: AppLocale): string {
  const ui = examCopy(locale)
  if (!answer.trim()) return ui.labels.noAnswer
  if (question.geometryConstruction) return ui.labels.constructionSaved
  if (question.response.kind === "choice") {
    return question.response.options.find((option) => option.id === answer)?.label ?? answer
  }
  return answer
}

function officialAnswerLabel(part: OfficialExamPartBlueprint, answer: string, locale: AppLocale): string {
  const ui = examCopy(locale)
  if (!answer.trim()) return ui.labels.noOfficialAnswer
  if (part.response.kind === "paper") {
    return answer === "completed-on-paper" ? ui.labels.completedOnPaper : ui.labels.notMarkedOnPaper
  }
  if (part.response.kind === "face-labels") {
    const values = decodeOfficialFaceLabels(answer, part.response.fields.length)
    return part.response.fields.map((field, index) => `${field}: ${values[index] || "–"}`).join(" · ")
  }
  if (part.response.kind === "true-false-grid") {
    const values = decodeOfficialTrueFalseAnswers(answer, part.response.statements.length)
    return part.response.statements
      .map((statement, index) => `${statement}: ${values[index] === "true" ? ui.answer.trueLabel : values[index] === "false" ? ui.answer.falseLabel : "–"}`)
      .join(" · ")
  }
  if (part.response.kind === "matching-grid") {
    const response = part.response
    const values = decodeOfficialMatchingAnswers(answer, response.fields.length)
    return response.fields
      .map((field, index) => {
        const selected = response.options.find(({ value }) => value === values[index])
        return `${field}: ${selected?.label ?? "–"}`
      })
      .join(" · ")
  }
  return answer
}

function OfficialExamResultsView({
  result,
  officialDocuments,
  onContinue,
  onResultChange,
}: {
  result: MockExamResult
  officialDocuments: OfficialArchiveDocuments
  onContinue: () => void
  onResultChange?: (result: MockExamResult) => void
}) {
  const { locale } = useLocalization()
  const ui = examCopy(locale)
  const blueprint = officialExamDefinition(result.editionId)?.blueprint
  if (!blueprint) throw new Error("This official result edition is not supported.")
  const completed = result.officialReview?.status === "complete"
  const mathematicsGrade = completed ? result.officialReview?.mathematicsGrade : undefined
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [solutionPageIndex, setSolutionPageIndex] = useState(0)
  const [scores, setScores] = useState<Array<number | null>>(() => {
    const savedScores = result.officialReview?.taskScores.length === blueprint.tasks.length
      ? [...result.officialReview.taskScores]
      : Array.from({ length: blueprint.tasks.length }, (): number | null => null)
    return savedScores.map((score, index) => (
      score ?? (result.taskResults[index]?.reviewablePoints === 0
        ? result.taskResults[index]!.certainPoints
        : null)
    ))
  })
  const task = blueprint.tasks[currentTaskIndex]!
  const taskResult = result.taskResults[currentTaskIndex]!
  const allScored = scores.every((score) => score !== null)
  const selectedPage = task.solutionPages[Math.min(solutionPageIndex, task.solutionPages.length - 1)]!
  const total = scores.reduce<number>((sum, score) => sum + (score ?? 0), 0)
  const taskMaximumScore = taskResult.certainPoints + taskResult.reviewablePoints

  const navigateReview = (taskIndex: number) => {
    setCurrentTaskIndex(taskIndex)
    setSolutionPageIndex(0)
    window.scrollTo(0, 0)
  }

  const completeReview = () => {
    if (!allScored || !onResultChange) return
    const completedResult = completeSupportedOfficialExamReview(result, scores as number[])
    onResultChange(completedResult)
  }

  return (
    <main className="mock-results-shell official-results-shell">
      <section className="mock-results-hero">
        <div>
          <span className="eyebrow">{completed ? ui.officialResults.correctionComplete : result.submissionReason === "timeout" ? ui.officialResults.timedOut : ui.officialResults.submitted}</span>
          <h1>{completed ? ui.officialResults.correctedTitle(blueprint.year) : ui.officialResults.honestResultTitle}</h1>
          <p>
            {completed
              ? ui.officialResults.completedBody(result.rubricVersion ?? (locale === "en" ? "imported" : locale === "it" ? "importata" : locale === "es" ? "importada" : "importierte"))
              : ui.officialResults.pendingBody}
          </p>
        </div>
        <div className="mock-score-card">
          <span>{completed ? ui.officialResults.correctedPoints : ui.officialResults.correctedSoFar}</span>
          <strong>{completed ? result.certainPoints : total}<small>/{result.maxPoints}</small></strong>
          <p>
            {mathematicsGrade !== undefined
              ? ui.officialResults.mathematicsGrade(formatSwissGrade(mathematicsGrade))
              : completed
                ? blueprint.grade.status === "unavailable"
                  ? blueprint.grade.label
                  : ui.officialResults.scaleCouldNotApply
                : ui.officialResults.tasksScored(scores.filter((score) => score !== null).length)}
          </p>
        </div>
      </section>

      <section className="mock-result-summary">
        <div><span>{ui.officialResults.workingTime}</span><strong>{formatMinutes(result.durationSeconds)}</strong></div>
        <div><span>{ui.officialResults.edition}</span><strong>{blueprint.year}</strong><small>{ui.officialResults.officialReplay}</small></div>
        <div><span>{ui.officialResults.markingScheme}</span><strong>{blueprint.review.rubricLabel}</strong><small>{blueprint.review.rubricDetail}</small></div>
        <div>
          <span>{blueprint.grade.status === "verified" ? `${ui.officialResults.mathematicsGrade(String(blueprint.year))}` : ui.officialResults.gradeConversion}</span>
          <strong>{mathematicsGrade === undefined ? "–" : formatSwissGrade(mathematicsGrade)}</strong>
          <small>
            {blueprint.grade.status === "unavailable"
              ? `${blueprint.grade.label} · ${blueprint.grade.detail}`
              : mathematicsGrade === undefined
                ? ui.officialResults.afterCorrection
                : blueprint.grade.detail}
          </small>
        </div>
      </section>

      <section className="official-correction-shell">
        <aside className="official-correction-nav" aria-label={ui.officialResults.correctionByTaskAria}>
          <span className="eyebrow">{ui.officialResults.tasksEyebrow}</span>
          <div>
            {blueprint.tasks.map((entry, index) => (
              <button
                className={index === currentTaskIndex ? "current" : scores[index] !== null ? "scored" : ""}
                type="button"
                key={entry.id}
                aria-current={index === currentTaskIndex ? "step" : undefined}
                onClick={() => navigateReview(index)}
              >
                <strong>{entry.taskNumber}</strong>
                <span>{scores[index] === null ? "–" : `${scores[index]}/4`}</span>
              </button>
            ))}
          </div>
          {!completed && (
            <button className="primary-button wide" type="button" disabled={!allScored || !onResultChange} onClick={completeReview}>
              {ui.officialResults.finishCorrection}
            </button>
          )}
        </aside>

        <article className="official-correction-task">
          <div className="official-correction-heading">
            <div>
              <span>{ui.officialResults.taskEyebrow(task.taskNumber)}</span>
              <h2>{task.title}</h2>
            </div>
            <strong>{ui.officialResults.maxFour}</strong>
          </div>

          {officialDocuments.solutions ? (
            <div className="official-solution-document">
              {task.solutionPages.length > 1 && (
                <div className="official-page-tabs" aria-label={ui.officialResults.schemePagesAria}>
                  {task.solutionPages.map((page, index) => (
                    <button
                      className={index === solutionPageIndex ? "active" : ""}
                      type="button"
                      key={page}
                      onClick={() => setSolutionPageIndex(index)}
                    >
                      {ui.common.page(page)}
                    </button>
                  ))}
                </div>
              )}
              <PdfPageCanvas
                blob={officialDocuments.solutions.blob}
                pageNumber={selectedPage}
                title={ui.officialResults.schemePdfTitle(blueprint.year, task.taskNumber)}
              />
            </div>
          ) : (
            <p className="official-missing-source" role="alert">{ui.officialResults.missingScheme}</p>
          )}

          <section className="official-rubric-guide">
            <span className="eyebrow">{ui.officialResults.rubricFocus}</span>
            <ul>
              {task.rubricSummary.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className="official-submission-review">
            <span className="eyebrow">{ui.officialResults.yourSubmission}</span>
            {taskResult.parts.map((partResult, partIndex) => {
              const blueprintPart = task.parts[partIndex]!
              const submittedMilestones = blueprintPart.milestones.flatMap((entry) => {
                const value = partResult.milestoneAnswers?.[entry.id]?.trim()
                return value ? [`${entry.label}: ${value}${entry.unit ? ` ${entry.unit}` : ""}`] : []
              })
              return (
                <div key={partResult.partId}>
                  <strong>{blueprintPart.label ? ui.officialResults.partLabel(blueprintPart.label) : ui.officialResults.answer}</strong>
                  <p>{officialAnswerLabel(blueprintPart, partResult.answer, locale)}</p>
                  {submittedMilestones.length > 0 && <small>{ui.officialResults.intermediateValues}: {submittedMilestones.join(" · ")}</small>}
                  {partResult.working && <small>{ui.officialResults.note}: {partResult.working}</small>}
                </div>
              )
            })}
            <p className="official-auto-note">
              {completed
                ? ui.officialResults.finalPointsSaved(taskResult.certainPoints)
                : blueprint.review.precheckMode === "manual-only"
                ? ui.officialResults.manualOnly
                : taskResult.reviewablePoints === 0
                  ? ui.officialResults.precheckComplete(taskResult.certainPoints)
                  : ui.officialResults.precheckMinimum(taskResult.parts.reduce((sum, entry) => sum + entry.certainPoints, 0))}
            </p>
          </section>

          <fieldset className="official-score-picker" disabled={completed}>
            <legend>{ui.officialResults.scoreLegend(task.taskNumber)}</legend>
            <div>
              {[0, 1, 2, 3, 4].map((score) => (
                <label
                  className={`${scores[currentTaskIndex] === score ? "selected" : ""}${score < taskResult.certainPoints || score > taskMaximumScore ? " unavailable" : ""}`}
                  key={score}
                >
                  <input
                    type="radio"
                    name={`official-score-${task.taskNumber}`}
                    value={score}
                    disabled={score < taskResult.certainPoints || score > taskMaximumScore}
                    checked={scores[currentTaskIndex] === score}
                    onChange={() => setScores((current) => current.map((value, index) => index === currentTaskIndex ? score : value))}
                  />
                  <strong>{score}</strong>
                  <span>{ui.common.point(score)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mock-task-actions">
            <button className="secondary-button" type="button" disabled={currentTaskIndex === 0} onClick={() => navigateReview(currentTaskIndex - 1)}>
              {ui.common.previousTask}
            </button>
            {currentTaskIndex < blueprint.tasks.length - 1 ? (
              <button className="primary-button" type="button" onClick={() => navigateReview(currentTaskIndex + 1)}>
                {ui.common.nextTask}
              </button>
            ) : !completed ? (
              <button className="primary-button" type="button" disabled={!allScored || !onResultChange} onClick={completeReview}>
                {ui.officialResults.finishCorrection}
              </button>
            ) : null}
          </div>
        </article>
      </section>

      {completed && (
        <section className="mock-recovery-card">
          <div>
            <span className="eyebrow">{ui.officialResults.trainingEyebrow}</span>
            <h2>{ui.officialResults.noXpTitle}</h2>
          </div>
          <p>{ui.officialResults.noXpBody}</p>
        </section>
      )}

      <button className="primary-button wide mock-results-continue" type="button" onClick={onContinue}>
        {ui.common.backToLearningPlan}
      </button>
    </main>
  )
}

function GeneratedMockExamResultsView({
  result,
  onContinue,
}: {
  result: MockExamResult
  onContinue: () => void
}) {
  const { locale } = useLocalization()
  const ui = examCopy(locale)
  const blueprintVersion = isSupportedGeneratedMockBlueprintVersion(result.blueprintVersion)
    ? result.blueprintVersion
    : undefined
  const blueprint = useMemo(
    () => buildGeneratedMockBlueprint(result.seed, blueprintVersion, result.contentLocale ?? "de"),
    [blueprintVersion, result.contentLocale, result.seed],
  )
  const possibleAfterReview = result.certainPoints + result.reviewablePoints

  return (
    <main className="mock-results-shell">
      <section className="mock-results-hero">
        <div>
          <span className="eyebrow">{result.submissionReason === "timeout" ? ui.generatedResults.timedOut : ui.generatedResults.submitted}</span>
          <h1>{ui.generatedResults.title}</h1>
          <p>{ui.generatedResults.body}</p>
        </div>
        <div className="mock-score-card">
          <span>{ui.generatedResults.certainPoints}</span>
          <strong>{result.certainPoints}<small>/{result.maxPoints}</small></strong>
          {result.reviewablePoints > 0 && (
            <p>{ui.generatedResults.possibleAfterReview(possibleAfterReview, result.maxPoints)}</p>
          )}
        </div>
      </section>

      <section className="mock-result-summary">
        <div><span>{ui.generatedResults.workingTime}</span><strong>{formatMinutes(result.durationSeconds)}</strong></div>
        <div><span>{ui.generatedResults.safelyScored}</span><strong>{result.certainPoints} P</strong></div>
        <div><span>{ui.generatedResults.manualReview}</span><strong>{result.reviewablePoints} P</strong></div>
        <div><span>{ui.generatedResults.officialGrade}</span><strong>–</strong><small>{ui.generatedResults.noScaleInvented}</small></div>
      </section>

      <section className="mock-recovery-card">
        <div>
          <span className="eyebrow">{ui.generatedResults.nextStepsEyebrow}</span>
          <h2>{ui.generatedResults.nextStepsTitle}</h2>
        </div>
        {result.recoveryTopicIds.length === 0 ? (
          <p>{ui.generatedResults.noGap}</p>
        ) : (
          <ol>
            {result.recoveryTopicIds.map((topicId) => (
              <li key={topicId}><span>↻</span><strong>{topicForLocale(topicId, locale).title}</strong></li>
            ))}
          </ol>
        )}
      </section>

      <section className="mock-task-results" aria-label={ui.generatedResults.resultsAria}>
        {result.taskResults.map((taskResult, taskIndex) => {
          const task = blueprint.tasks[taskIndex]!
          return (
            <details key={taskResult.taskId}>
              <summary>
                <span>{ui.generatedResults.taskLabel(taskResult.taskNumber)}</span>
                <strong>{taskResult.title}</strong>
                <small>
                  {ui.generatedResults.safePoints(taskResult.certainPoints)}
                  {taskResult.reviewablePoints > 0 && ` + ${ui.generatedResults.reviewPoints(taskResult.reviewablePoints)}`}
                </small>
              </summary>
              <div className="mock-task-result-meta">
                <span>{ui.generatedResults.active(formatMinutes(taskResult.activeSeconds))}</span>
                <span>{ui.generatedResults.opened(taskResult.visitCount)}</span>
                {taskResult.flagged && <span>{ui.generatedResults.flaggedAtSubmission}</span>}
              </div>
              <div className="mock-result-parts">
                {taskResult.parts.map((partResult, partIndex) => {
                  const part = task.parts[partIndex]!
                  const question = generateMockPartQuestion(part)
                  const status = !partResult.answerCorrect
                    ? "wrong"
                    : partResult.certainPoints > 0
                      ? "certain"
                      : partResult.reviewablePoints > 0
                        ? "manual"
                        : "missing-method"
                  const pointsLabel = status === "certain"
                    ? ui.generatedResults.safePoints(partResult.certainPoints)
                    : status === "manual"
                      ? ui.generatedResults.reviewPoints(partResult.reviewablePoints)
                      : status === "missing-method"
                        ? ui.generatedResults.missingWorking
                        : "0 P"
                  return (
                    <article className={status} key={partResult.partId}>
                      <div className="mock-result-part-heading">
                        <span>{part.label}</span>
                        <strong>{pointsLabel}</strong>
                      </div>
                      <p>{question.prompt}</p>
                      <dl>
                        <div><dt>{ui.generatedResults.yourAnswer}</dt><dd>{mockAnswerLabel(question, partResult.answer, locale)}</dd></div>
                        {!partResult.answerCorrect && (
                          <div><dt>{ui.generatedResults.correctAnswer}</dt><dd>{correctAssessmentAnswerLabel(question, locale)}</dd></div>
                        )}
                        {partResult.methodRequired && <div><dt>{ui.generatedResults.working}</dt><dd>{partResult.working || ui.common.noEntry}</dd></div>}
                        <div><dt>{ui.generatedResults.afterExam}</dt><dd>{question.explanation}</dd></div>
                      </dl>
                    </article>
                  )
                })}
              </div>
            </details>
          )
        })}
      </section>

      <button className="primary-button wide mock-results-continue" type="button" onClick={onContinue}>
        {ui.common.backToLearningPlan}
      </button>
    </main>
  )
}

export function MockExamResultsView({
  result,
  officialDocuments = {},
  onContinue,
  onResultChange,
}: {
  result: MockExamResult
  officialDocuments?: OfficialArchiveDocuments
  onContinue: () => void
  onResultChange?: (result: MockExamResult) => void
}) {
  return result.source === "official-archive" ? (
    <OfficialExamResultsView
      result={result}
      officialDocuments={officialDocuments}
      onContinue={onContinue}
      onResultChange={onResultChange}
    />
  ) : (
    <GeneratedMockExamResultsView result={result} onContinue={onContinue} />
  )
}

function documentsForOfficialEdition(
  library: OfficialArchiveLibrary,
  editionId: string | undefined,
): OfficialArchiveDocuments {
  const definition = officialExamDefinition(editionId)
  return definition ? library[definition.blueprint.editionId] ?? {} : {}
}

function hasOfficialExamSources(
  exam: ActiveMockExam,
  library: OfficialArchiveLibrary,
): boolean {
  const blueprint = resolveOfficialExamBlueprint(exam)
  return Boolean(
    blueprint && hasOfficialArchiveEdition(library[blueprint.editionId] ?? {}, blueprint.editionId),
  )
}

function LearningApp() {
  const { copy, locale } = useLocalization()
  const [learner, setLearner] = useState<LearnerState>()
  const [germanCourse, setGermanCourse] = useState<GermanCourseState>()
  const [germanSourcePracticeState, setGermanSourcePracticeState] = useState<GermanSourcePracticeState>(() => (
    createGermanSourcePracticeState()
  ))
  const [courseIndex, setCourseIndex] = useState<LearnerCourseIndex>()
  const [activeSubject, setActiveSubject] = useState<SubjectId>("math")
  const [activeSession, setActiveSession] = useState<ActiveLearningSession>()
  const [prerequisiteReturnXp, setPrerequisiteReturnXp] = useState<number>()
  const [playerOpen, setPlayerOpen] = useState(false)
  const [completion, setCompletion] = useState<CompletionSummary>()
  const [showCurriculum, setShowCurriculum] = useState(false)
  const [showConceptLibrary, setShowConceptLibrary] = useState(false)
  const [showCollection, setShowCollection] = useState(false)
  const [conceptTopicId, setConceptTopicId] = useState<TopicId>()
  const [showProgress, setShowProgress] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showParent, setShowParent] = useState(false)
  const [parentAccess, setParentAccess] = useState<ParentAccessRecord>()
  const [parentUnlocked, setParentUnlocked] = useState(false)
  const [releaseReadiness, setReleaseReadiness] = useState<ReleaseReadinessRecord>(() => (
    createReleaseReadinessRecord()
  ))
  const [activeMock, setActiveMock] = useState<ActiveMockExam>()
  const [mockPlayerOpen, setMockPlayerOpen] = useState(false)
  const [showMockSetup, setShowMockSetup] = useState(false)
  const [mockResult, setMockResult] = useState<MockExamResult>()
  const [activeArchivePractice, setActiveArchivePractice] = useState<ActiveArchivePractice>()
  const [archivePracticePlayerOpen, setArchivePracticePlayerOpen] = useState(false)
  const [archivePracticeResult, setArchivePracticeResult] = useState<ArchivePracticeResult>()
  const [officialArchiveLibrary, setOfficialArchiveLibrary] = useState<OfficialArchiveLibrary>({})
  const [germanSourceArchiveLibrary, setGermanSourceArchiveLibrary] = useState<GermanSourceArchiveLibrary>({})
  const activeOfficialDocuments = documentsForOfficialEdition(officialArchiveLibrary, activeMock?.editionId)
  const resultOfficialDocuments = documentsForOfficialEdition(officialArchiveLibrary, mockResult?.editionId)
  const activeArchivePracticeDocuments = activeArchivePractice
    ? officialArchiveLibrary[activeArchivePractice.editionId] ?? {}
    : {}

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      loadLearnerState(),
      loadGermanCourseState(),
      loadGermanSourcePracticeState(),
      loadCourseIndex(),
      loadActiveSession(),
      loadActiveMockExam(),
      loadActiveArchivePractice(),
      loadParentAccess(),
      loadReleaseReadiness(),
      loadOfficialArchiveLibrary(),
      loadGermanSourceArchiveLibrary(),
    ]).then(([
      saved,
      savedGermanCourse,
      savedGermanSourcePracticeState,
      savedCourseIndex,
      savedSession,
      savedMock,
      savedArchivePractice,
      savedParentAccess,
      savedReleaseReadiness,
      savedOfficialArchiveLibrary,
      savedGermanSourceArchiveLibrary,
    ]) => {
      if (cancelled) return
      const state = saved ? migrateLearnerState(saved) : createInitialLearner()
      const germanState = savedGermanCourse ?? createInitialGermanCourseState(state.learnerId)
      const resumableMathSession = resolveResumableSession(savedSession, state)
      const selectedSubject = state.profileCompletedAt && state.placementCompletedAt
        ? resolveResumeSubject(savedCourseIndex, [
          {
            subjectId: "math",
            paused: Boolean(resumableMathSession || savedMock || savedArchivePractice),
            pausedAt: resumableMathSession?.updatedAt ?? savedMock?.startedAt ?? savedArchivePractice?.startedAt,
          },
          {
            subjectId: "german",
            paused: Boolean(savedGermanSourcePracticeState.active || germanState.activeComprehension || germanState.activeWritingRevision || germanState.activeWriting || germanState.activeExam || germanState.activeSession || (germanState.startCheck && !germanState.startCheck.completedAt)),
            pausedAt: savedGermanSourcePracticeState.active?.updatedAt ?? germanState.activeComprehension?.updatedAt ?? germanState.activeWritingRevision?.updatedAt ?? germanState.activeWriting?.updatedAt ?? germanState.activeExam?.updatedAt ?? germanState.activeSession?.updatedAt ?? germanState.startCheck?.startedAt,
          },
        ])
        : "math"
      setLearner(state)
      setGermanCourse(germanState)
      setGermanSourcePracticeState(savedGermanSourcePracticeState)
      const resumedCourseIndex = touchCourse(savedCourseIndex, selectedSubject)
      setCourseIndex(resumedCourseIndex)
      setActiveSubject(selectedSubject)
      setOfficialArchiveLibrary(savedOfficialArchiveLibrary)
      setGermanSourceArchiveLibrary(savedGermanSourceArchiveLibrary)
      if (resumableMathSession) {
        setActiveSession(resumableMathSession)
        setPlayerOpen(selectedSubject === "math")
        if (resumableMathSession !== savedSession) {
          void saveActiveSession(resumableMathSession)
        }
      } else if (savedSession) {
        void clearActiveSession()
      }
      if (savedMock && isReplayableMockExam(savedMock)) {
        setActiveMock(savedMock)
        const sourceReady = savedMock.source !== "official-archive" || hasOfficialExamSources(
          savedMock,
          savedOfficialArchiveLibrary,
        )
        setMockPlayerOpen(sourceReady && selectedSubject === "math")
        setShowMockSetup(!sourceReady)
      } else if (savedMock) {
        void clearActiveMockExam()
      }
      if (savedArchivePractice && isActiveArchivePractice(savedArchivePractice)) {
        setActiveArchivePractice(savedArchivePractice)
        const sourceReady = hasOfficialArchiveEdition(
          savedOfficialArchiveLibrary[savedArchivePractice.editionId] ?? {},
          savedArchivePractice.editionId,
        )
        setArchivePracticePlayerOpen(sourceReady && selectedSubject === "math")
        if (sourceReady && selectedSubject === "math") setMockPlayerOpen(false)
        setShowMockSetup(!sourceReady)
      } else if (savedArchivePractice) {
        void clearActiveArchivePractice()
      }
      setParentAccess(savedParentAccess)
      setReleaseReadiness(normalizeReleaseReadinessRecord(savedReleaseReadiness))
      void saveLearnerState(state)
      if (!savedGermanCourse) void saveGermanCourseState(germanState)
      void saveCourseIndex(resumedCourseIndex)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!learner) return
    const { visualMode, readingMode, geometryControlSide } = learner.preferences
    document.documentElement.dataset.visualMode = visualMode
    document.documentElement.dataset.readingMode = readingMode
    document.documentElement.dataset.geometryControls = geometryControlSide
    return () => {
      if (document.documentElement.dataset.visualMode === visualMode) {
        delete document.documentElement.dataset.visualMode
      }
      if (document.documentElement.dataset.readingMode === readingMode) {
        delete document.documentElement.dataset.readingMode
      }
      if (document.documentElement.dataset.geometryControls === geometryControlSide) {
        delete document.documentElement.dataset.geometryControls
      }
    }
  }, [
    learner?.preferences.geometryControlSide,
    learner?.preferences.readingMode,
    learner?.preferences.visualMode,
  ])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [
    activeSession?.id,
    activeSubject,
    completion?.event.id,
    learner?.placementCompletedAt,
    playerOpen,
    showCollection,
    showConceptLibrary,
    showCurriculum,
    showMockSetup,
    showParent,
    showProfileSetup,
    showProgress,
    mockPlayerOpen,
    mockResult?.id,
    archivePracticePlayerOpen,
    archivePracticeResult?.id,
    germanCourse?.activeSession?.id,
  ])

  useEffect(() => {
    if (prerequisiteReturnXp === undefined) return
    const timeout = window.setTimeout(() => setPrerequisiteReturnXp(undefined), 8_000)
    return () => window.clearTimeout(timeout)
  }, [prerequisiteReturnXp])

  const goHome = () => {
    setPlayerOpen(false)
    setPrerequisiteReturnXp(undefined)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentUnlocked(false)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setArchivePracticePlayerOpen(false)
    setArchivePracticeResult(undefined)
  }

  const switchSubject = (subjectId: SubjectId) => {
    if (!courseIndex || subjectId === activeSubject) return
    goHome()
    const nextIndex = touchCourse(courseIndex, subjectId)
    setCourseIndex(nextIndex)
    setActiveSubject(subjectId)
    void saveCourseIndex(nextIndex)
  }

  const persistGermanCourse = (state: GermanCourseState, completed = false) => {
    setGermanCourse(state)
    void saveGermanCourseState(state)
    if (!courseIndex) return
    const nextIndex = completed
      ? markCourseCompleted(courseIndex, "german")
      : touchCourse(courseIndex, "german")
    setCourseIndex(nextIndex)
    void saveCourseIndex(nextIndex)
  }

  const persistGermanSourcePractice = (state: GermanSourcePracticeState) => {
    setGermanSourcePracticeState(state)
    void saveGermanSourcePracticeState(state)
    if (!courseIndex) return
    const nextIndex = state.active
      ? touchCourse(courseIndex, "german")
      : markCourseCompleted(courseIndex, "german")
    setCourseIndex(nextIndex)
    void saveCourseIndex(nextIndex)
  }

  const resolveGermanSupport = (topicId: GermanTopicId) => {
    if (!germanCourse) return
    const state = resolveGermanTopicSupport(germanCourse, topicId)
    if (state === germanCourse) return
    persistGermanCourse(state)
  }

  const saveGermanWritingReview = (
    resultId: string,
    strength: string,
    nextStep: string,
  ) => {
    if (!germanCourse) return
    const state = saveGermanWritingHumanReview(
      germanCourse,
      resultId,
      strength,
      nextStep,
    )
    if (state === germanCourse) return
    persistGermanCourse(state)
  }

  const saveGermanComprehensionReview = (
    resultId: string,
    status: GermanComprehensionEvidenceStatus,
    strength: string,
    nextStep: string,
  ) => {
    if (!germanCourse) return
    const state = saveGermanComprehensionHumanReview(
      germanCourse,
      resultId,
      status,
      strength,
      nextStep,
    )
    if (state === germanCourse) return
    persistGermanCourse(state)
  }

  const recordMathCompletion = () => {
    if (!courseIndex) return
    const nextIndex = markCourseCompleted(courseIndex, "math")
    setCourseIndex(nextIndex)
    void saveCourseIndex(nextIndex)
  }

  const openProgress = () => {
    setPlayerOpen(false)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentUnlocked(false)
    setShowProgress(true)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setArchivePracticePlayerOpen(false)
    setArchivePracticeResult(undefined)
  }

  const openProfileSetup = () => {
    setPlayerOpen(false)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(true)
    setShowParent(false)
    setParentUnlocked(false)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setArchivePracticePlayerOpen(false)
    setArchivePracticeResult(undefined)
  }

  const saveProfile = async (input: LearnerProfileInput) => {
    if (!learner) return
    const editing = Boolean(learner.profileCompletedAt)
    const state = updateLearnerProfile(learner, input)
    await saveLearnerState(state)
    setLearner(state)
    setShowProfileSetup(false)
    setShowProgress(editing && activeSubject === "math")
  }

  const openParent = () => {
    setPlayerOpen(false)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(true)
    setParentUnlocked(false)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setArchivePracticePlayerOpen(false)
    setArchivePracticeResult(undefined)
  }

  const closeParent = () => {
    setShowParent(false)
    setParentUnlocked(false)
    setShowProgress(true)
  }

  const openConceptLibrary = (topicId?: TopicId) => {
    setPlayerOpen(false)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(true)
    setShowCollection(false)
    setConceptTopicId(topicId)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentUnlocked(false)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setArchivePracticePlayerOpen(false)
    setArchivePracticeResult(undefined)
  }

  const openCollection = () => {
    setPlayerOpen(false)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(true)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentUnlocked(false)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setArchivePracticePlayerOpen(false)
    setArchivePracticeResult(undefined)
  }

  const startSession = (session: ActiveLearningSession) => {
    if (activeMock || activeArchivePractice) return
    setActiveSession(session)
    setPrerequisiteReturnXp(undefined)
    setPlayerOpen(true)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentUnlocked(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setArchivePracticeResult(undefined)
    void saveActiveSession(session)
  }

  const startTask = (task: LearningTask) => {
    if (activeSession) return
    startSession(createActiveLearningSession({ ...task, contentLocale: locale }))
  }

  const startPlacement = () => {
    if (!learner) return
    startTask(buildPlacementTask(learner))
  }

  const startFoundations = () => {
    if (!learner) return
    const state = completePlacementWithoutCheck(learner)
    setLearner(state)
    setActiveSession(undefined)
    setPlayerOpen(false)
    void clearActiveSession()
    void saveLearnerState(state)
  }

  const startPrerequisite = (topicId: TopicId) => {
    if (!learner || topicNeedsTeacherSupport(learner, topicId)) return
    startTask(buildPrerequisiteRefresh(learner, topicId))
  }

  const startPrerequisiteDetour = (
    topicId: TopicId,
    origin: ActiveLearningSession,
  ) => {
    if (!learner || topicNeedsTeacherSupport(learner, topicId)) return
    const task = {
      ...buildPrerequisiteRefresh(learner, topicId),
      contentLocale: origin.task.contentLocale ?? locale,
    }
    startSession(createPrerequisiteDetourSession(task, origin))
  }

  const returnFromPrerequisiteDetour = () => {
    if (!learner || !activeSession?.prerequisiteDetour) {
      goHome()
      return
    }
    const origin = resolveResumableSession(originatingSession(activeSession), learner)
    if (!origin) {
      setActiveSession(undefined)
      void clearActiveSession()
      goHome()
      return
    }
    startSession(origin)
  }

  const startErrorPractice = (topicId: TopicId) => {
    if (!learner || activeSession || activeMock || activeArchivePractice) return
    if (topicNeedsTeacherSupport(learner, topicId)) return
    if (buildAssignments(learner).some((task) => task.kind === "assessment")) return
    startTask(buildErrorRefresh(learner, topicId))
  }

  const startTopicLesson = (topicId: TopicId) => {
    if (!learner || topicNeedsTeacherSupport(learner, topicId)) return
    startTask(buildTopicLesson(learner, topicId))
  }

  const startConceptPractice = (topicId: TopicId) => {
    if (!learner || activeSession || activeMock || activeArchivePractice) return
    if (topicNeedsTeacherSupport(learner, topicId)) return
    if (buildAssignments(learner).some((task) => task.kind === "assessment")) return
    const status = learner.mastery[topicId].status
    if (status === "locked") return
    if (status === "mastered") {
      startPrerequisite(topicId)
      return
    }
    startTopicLesson(topicId)
  }

  const finishTask = (event: LearningEvent) => {
    if (!learner || !activeSession) return
    const task = activeSession.task
    const result = recordCompletion(learner, task, event)
    const origin = activeSession.prerequisiteDetour
      ? resolveResumableSession(originatingSession(activeSession), result.state)
      : undefined
    setLearner(result.state)
    recordMathCompletion()
    if (origin) {
      setActiveSession(origin)
      setPlayerOpen(true)
      setCompletion(undefined)
      setPrerequisiteReturnXp(result.award.totalXp)
      void saveLearnerAndActiveSession(result.state, origin)
      return
    }
    setActiveSession(undefined)
    setPlayerOpen(false)
    setCompletion({ task, event, award: result.award, learner: result.state })
    setPrerequisiteReturnXp(undefined)
    void clearActiveSession()
    void saveLearnerState(result.state)
  }

  const submitLearnerFeedback = (kind: LearnerFeedbackKind) => {
    if (!learner || !completion) return
    const state = recordLearnerFeedback(learner, completion.event.id, kind)
    if (state === learner) return
    setLearner(state)
    setCompletion({ ...completion, learner: state })
    void saveLearnerState(state)
  }

  const persistSession = (session: ActiveLearningSession) => {
    setActiveSession(session)
    void saveActiveSession(session)
  }

  const openMock = () => {
    setPlayerOpen(false)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentUnlocked(false)
    setMockResult(undefined)
    setArchivePracticeResult(undefined)
    if (activeArchivePractice) {
      const sourceReady = hasOfficialArchiveEdition(
        officialArchiveLibrary[activeArchivePractice.editionId] ?? {},
        activeArchivePractice.editionId,
      )
      setArchivePracticePlayerOpen(sourceReady)
      setMockPlayerOpen(false)
      setShowMockSetup(!sourceReady)
      return
    }
    if (activeMock) {
      const sourceReady = activeMock.source !== "official-archive" || hasOfficialExamSources(
        activeMock,
        officialArchiveLibrary,
      )
      setMockPlayerOpen(sourceReady)
      setShowMockSetup(!sourceReady)
    } else {
      setMockPlayerOpen(false)
      setShowMockSetup(true)
    }
  }

  const startMock = () => {
    if (!learner || activeMock || activeArchivePractice || activeSession) return
    const exam = createActiveMockExam(
      `${learner.learnerId}:full:${learner.mockHistory.length + 1}`,
      new Date(),
      undefined,
      undefined,
      locale,
    )
    setActiveMock(exam)
    setMockPlayerOpen(true)
    setShowMockSetup(false)
    setMockResult(undefined)
    void saveActiveMockExam(exam)
  }

  const importOfficialDocument = async (
    editionId: OfficialArchiveEditionId,
    kind: OfficialArchiveDocumentKind,
    file: File,
  ) => {
    const record = await inspectOfficialArchivePdfForEdition(file, editionId, kind)
    await saveOfficialArchiveDocument(record)
    setOfficialArchiveLibrary((current) => ({
      ...current,
      [record.editionId]: {
        ...current[record.editionId],
        [record.kind]: record,
      },
    }))
  }

  const importOfficialArchive = async (
    files: readonly File[],
  ): Promise<OfficialArchiveBulkImportResult> => {
    const imported = new Map<string, OfficialArchiveDocumentRecord>()
    const rejected: string[] = []
    for (const file of files) {
      try {
        const record = await identifyOfficialArchivePdf(file)
        await saveOfficialArchiveDocument(record)
        imported.set(record.id, record)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Datei nicht erkannt."
        rejected.push(`${file.name}: ${message}`)
      }
    }

    if (imported.size > 0) {
      setOfficialArchiveLibrary((current) => {
        const next = { ...current }
        for (const record of imported.values()) {
          next[record.editionId] = {
            ...next[record.editionId],
            [record.kind]: record,
          }
        }
        return next
      })
    }
    return { imported: imported.size, rejected }
  }

  const importGermanSourceArchive = async (
    files: readonly File[],
  ): Promise<GermanSourceArchiveBulkImportResult> => {
    const imported = new Map<string, GermanSourceArchiveDocumentRecord>()
    const rejected: string[] = []
    for (const file of files) {
      try {
        const record = await identifyGermanSourceArchivePdf(file)
        await saveGermanSourceArchiveDocument(record)
        imported.set(record.id, record)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Datei nicht erkannt."
        rejected.push(`${file.name}: ${message}`)
      }
    }

    if (imported.size > 0) {
      setGermanSourceArchiveLibrary((current) => {
        const next = { ...current }
        for (const record of imported.values()) {
          next[record.editionId] = {
            ...next[record.editionId],
            [record.kind]: record,
          }
        }
        return next
      })
    }
    return { imported: imported.size, rejected }
  }

  const startOfficialMock = (editionId: OfficialArchiveEditionId) => {
    const definition = officialExamDefinition(editionId)
    const documents = officialArchiveLibrary[editionId] ?? {}
    if (
      !learner ||
      activeMock ||
      activeArchivePractice ||
      activeSession ||
      !definition ||
      officialArchiveCatalog[editionId].replayMode === "source-only" ||
      !hasOfficialArchiveEdition(documents, editionId)
    ) return
    const previousOfficialRuns = learner.mockHistory.filter((entry) => entry.editionId === editionId).length
    const exam = createActiveOfficialExamForEdition(
      editionId,
      `${learner.learnerId}:official-${definition.blueprint.year}:${previousOfficialRuns + 1}`,
    )
    setActiveMock(exam)
    setMockPlayerOpen(true)
    setShowMockSetup(false)
    setMockResult(undefined)
    void saveActiveMockExam(exam)
  }

  const resumeOfficialMock = () => {
    if (
      !activeMock ||
      activeMock.source !== "official-archive" ||
      !hasOfficialExamSources(activeMock, officialArchiveLibrary)
    ) return
    setMockPlayerOpen(true)
    setShowMockSetup(false)
  }

  const startArchivePractice = (editionId: OfficialArchiveEditionId) => {
    const edition = officialArchiveCatalog[editionId]
    const documents = officialArchiveLibrary[editionId] ?? {}
    if (
      !learner ||
      activeSession ||
      activeMock ||
      activeArchivePractice ||
      edition.replayMode !== "source-only" ||
      !hasOfficialArchiveEdition(documents, editionId)
    ) return
    const previousRuns = learner.archivePracticeHistory.filter(
      (entry) => entry.editionId === editionId,
    ).length
    const practice = createActiveArchivePractice(
      editionId,
      `${learner.learnerId}:archive-${edition.year}:${previousRuns + 1}`,
    )
    setActiveArchivePractice(practice)
    setArchivePracticePlayerOpen(true)
    setArchivePracticeResult(undefined)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    void saveActiveArchivePractice(practice)
  }

  const resumeArchivePractice = () => {
    if (
      !activeArchivePractice ||
      !hasOfficialArchiveEdition(
        officialArchiveLibrary[activeArchivePractice.editionId] ?? {},
        activeArchivePractice.editionId,
      )
    ) return
    setArchivePracticePlayerOpen(true)
    setShowMockSetup(false)
  }

  const persistArchivePractice = (practice: ActiveArchivePractice) => {
    setActiveArchivePractice(practice)
    void saveActiveArchivePractice(practice)
  }

  const finishArchivePractice = (result: ArchivePracticeResult) => {
    if (!learner) return
    const state = recordArchivePracticeResult(learner, result)
    setLearner(state)
    setActiveArchivePractice(undefined)
    setArchivePracticePlayerOpen(false)
    setShowMockSetup(false)
    setArchivePracticeResult(result)
    recordMathCompletion()
    void clearActiveArchivePractice()
    void saveLearnerState(state)
  }

  const persistMock = (exam: ActiveMockExam) => {
    setActiveMock(exam)
    void saveActiveMockExam(exam)
  }

  const finishMock = (result: MockExamResult) => {
    if (!learner) return
    const state = recordMockExamResult(learner, result)
    setLearner(state)
    setActiveMock(undefined)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(result)
    recordMathCompletion()
    void clearActiveMockExam()
    void saveLearnerState(state)
  }

  const updateMockResult = (result: MockExamResult) => {
    if (!learner) return
    const state = recordOfficialMockReview(learner, result)
    setLearner(state)
    setMockResult(result)
    void saveLearnerState(state)
  }

  const restoreBackup = async (payload: GymiQuestBackupPayload) => {
    const state = migrateLearnerState(payload.learner)
    const restoredGermanCourse = payload.germanCourse ?? createInitialGermanCourseState(state.learnerId)
    const restoredGermanSourcePractice = payload.germanSourcePractice ?? createGermanSourcePracticeState()
    const restoredSession = resolveResumableSession(payload.activeSession, state)
    const restoredCourseIndex = payload.courseIndex ?? createLearnerCourseIndex(
      new Date(payload.createdAt),
    )
    const selectedSubject = resolveResumeSubject(restoredCourseIndex, [
      {
        subjectId: "math",
        paused: Boolean(restoredSession || payload.activeMock || payload.activeArchivePractice),
        pausedAt: restoredSession?.updatedAt ?? payload.activeMock?.startedAt ?? payload.activeArchivePractice?.startedAt,
      },
      {
        subjectId: "german",
        paused: Boolean(
          restoredGermanSourcePractice.active ||
          restoredGermanCourse.activeComprehension ||
          restoredGermanCourse.activeWritingRevision ||
          restoredGermanCourse.activeWriting ||
          restoredGermanCourse.activeExam ||
          restoredGermanCourse.activeSession ||
          (restoredGermanCourse.startCheck && !restoredGermanCourse.startCheck.completedAt)
        ),
        pausedAt: restoredGermanSourcePractice.active?.updatedAt ?? restoredGermanCourse.activeComprehension?.updatedAt ?? restoredGermanCourse.activeWritingRevision?.updatedAt ?? restoredGermanCourse.activeWriting?.updatedAt ?? restoredGermanCourse.activeExam?.updatedAt ?? restoredGermanCourse.activeSession?.updatedAt ?? restoredGermanCourse.startCheck?.startedAt,
      },
    ])
    const nextCourseIndex = touchCourse(restoredCourseIndex, selectedSubject)

    await replaceLocalLearningData(
      state,
      restoredSession,
      payload.activeMock,
      payload.activeArchivePractice,
      restoredGermanCourse,
      nextCourseIndex,
      restoredGermanSourcePractice,
    )
    setLearner(state)
    setGermanCourse(restoredGermanCourse)
    setGermanSourcePracticeState(restoredGermanSourcePractice)
    setCourseIndex(nextCourseIndex)
    setActiveSession(restoredSession)
    setPrerequisiteReturnXp(undefined)
    setPlayerOpen(false)
    setActiveMock(payload.activeMock)
    const restoredMockReady = Boolean(
      payload.activeMock &&
      (payload.activeMock.source !== "official-archive" || hasOfficialExamSources(
        payload.activeMock,
        officialArchiveLibrary,
      )),
    )
    const restoredArchiveReady = Boolean(
      payload.activeArchivePractice &&
      hasOfficialArchiveEdition(
        officialArchiveLibrary[payload.activeArchivePractice.editionId] ?? {},
        payload.activeArchivePractice.editionId,
      ),
    )
    setActiveArchivePractice(payload.activeArchivePractice)
    setArchivePracticePlayerOpen(selectedSubject === "math" && restoredArchiveReady)
    setMockPlayerOpen(selectedSubject === "math" && !payload.activeArchivePractice && restoredMockReady)
    setShowMockSetup(Boolean(
      (payload.activeArchivePractice && !restoredArchiveReady) ||
      (!payload.activeArchivePractice && payload.activeMock && !restoredMockReady),
    ))
    setMockResult(undefined)
    setArchivePracticeResult(undefined)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentUnlocked(false)
    setActiveSubject(selectedSubject)
  }

  const createParentPin = async (pin: string) => {
    const record = await createParentAccess(pin)
    await saveParentAccess(record)
    setParentAccess(record)
    setParentUnlocked(true)
  }

  const unlockParent = async (pin: string): Promise<boolean> => {
    if (!parentAccess) return false
    const verified = await verifyParentPin(parentAccess, pin)
    if (verified) setParentUnlocked(true)
    return verified
  }

  const resetParentPin = async () => {
    await clearParentAccess()
    setParentAccess(undefined)
    setParentUnlocked(false)
  }

  const changeParentExplanationLanguage = async (
    language: ParentExplanationLanguage,
  ) => {
    if (!parentAccess) return
    const record = updateParentExplanationLanguage(parentAccess, language)
    await saveParentAccess(record)
    setParentAccess(record)
  }

  const persistReleaseReadiness = (record: ReleaseReadinessRecord) => {
    setReleaseReadiness(record)
    void saveReleaseReadiness(record)
  }

  const requestTopicSupport = (topicId: TopicId) => {
    if (!learner) return
    const state = requestTeacherSupport(learner, topicId)
    if (state === learner) return
    const origin = activeSession?.prerequisiteDetour
      ? resolveResumableSession(originatingSession(activeSession), state)
      : undefined
    setLearner(state)
    setActiveSession(origin)
    setPlayerOpen(false)
    setPrerequisiteReturnXp(undefined)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    if (origin) {
      void saveLearnerAndActiveSession(state, origin)
    } else {
      void clearActiveSession()
      void saveLearnerState(state)
    }
  }

  const resolveTopicSupport = (topicId: TopicId) => {
    if (!learner) return
    const state = resolveTeacherSupport(learner, topicId)
    if (state === learner) return
    setLearner(state)
    void saveLearnerState(state)
  }

  const resetMathSubject = async () => {
    if (!learner || !courseIndex) return
    const now = new Date()
    const state = createInitialLearner(now)
    state.learnerId = learner.learnerId
    state.displayName = learner.displayName
    state.createdAt = learner.createdAt
    state.profileCompletedAt = learner.profileCompletedAt
    state.preferences = {
      ...learner.preferences,
      practiceDays: [...learner.preferences.practiceDays],
    }
    const nextCourseIndex = touchCourse(courseIndex, "math", now)

    await Promise.all([
      saveLearnerState(state),
      clearActiveSession(),
      clearActiveMockExam(),
      clearActiveArchivePractice(),
      saveCourseIndex(nextCourseIndex),
    ])
    setLearner(state)
    setCourseIndex(nextCourseIndex)
    setActiveSubject("math")
    setActiveSession(undefined)
    setActiveMock(undefined)
    setActiveArchivePractice(undefined)
    goHome()
  }

  const resetGermanSubject = async () => {
    if (!learner || !courseIndex) return
    const now = new Date()
    const state = createInitialGermanCourseState(learner.learnerId, now)
    const nextCourseIndex = touchCourse(courseIndex, "german", now)

    await Promise.all([
      saveGermanCourseState(state),
      clearGermanSourcePracticeState(),
      saveCourseIndex(nextCourseIndex),
    ])
    setGermanCourse(state)
    setGermanSourcePracticeState(createGermanSourcePracticeState())
    setCourseIndex(nextCourseIndex)
    setActiveSubject("german")
    goHome()
  }

  const reset = async () => {
    await clearLearnerState()
    await clearGermanCourseState()
    await clearGermanSourcePracticeState()
    await clearCourseIndex()
    await clearActiveSession()
    await clearActiveMockExam()
    await clearActiveArchivePractice()
    await clearOfficialArchiveDocuments()
    await clearParentAccess()
    const state = createInitialLearner()
    const nextGermanCourse = createInitialGermanCourseState(state.learnerId)
    const nextCourseIndex = createLearnerCourseIndex()
    setLearner(state)
    setGermanCourse(nextGermanCourse)
    setGermanSourcePracticeState(createGermanSourcePracticeState())
    setCourseIndex(nextCourseIndex)
    setActiveSubject("math")
    setActiveSession(undefined)
    setPlayerOpen(false)
    setCompletion(undefined)
    setShowCurriculum(false)
    setShowConceptLibrary(false)
    setShowCollection(false)
    setConceptTopicId(undefined)
    setShowProgress(false)
    setShowProfileSetup(false)
    setShowParent(false)
    setParentAccess(undefined)
    setParentUnlocked(false)
    setActiveMock(undefined)
    setMockPlayerOpen(false)
    setShowMockSetup(false)
    setMockResult(undefined)
    setActiveArchivePractice(undefined)
    setArchivePracticePlayerOpen(false)
    setArchivePracticeResult(undefined)
    setOfficialArchiveLibrary({})
    setGermanSourceArchiveLibrary({})
    await saveLearnerState(state)
    await saveGermanCourseState(nextGermanCourse)
    await saveCourseIndex(nextCourseIndex)
  }

  if (!learner || !germanCourse || !courseIndex) {
    return (
      <div className="loading-shell">
        <Logo />
        <div className="loading-bar"><span /></div>
        <p>{copy.loading}</p>
      </div>
    )
  }

  if (archivePracticePlayerOpen && activeArchivePractice) {
    return (
      <ArchiveSourcePracticePlayer
        key={activeArchivePractice.id}
        initialPractice={activeArchivePractice}
        documents={activeArchivePracticeDocuments}
        onChange={persistArchivePractice}
        onComplete={finishArchivePractice}
        onExit={goHome}
      />
    )
  }

  if (mockPlayerOpen && activeMock) {
    return (
      <MockExamPlayer
        key={activeMock.id}
        initialExam={activeMock}
        officialDocuments={activeOfficialDocuments}
        onChange={persistMock}
        onFinish={finishMock}
        onExit={goHome}
      />
    )
  }

  return (
    <div className="app-frame">
      <AppHeader
        onHome={goHome}
        onProgress={learner.placementCompletedAt
          ? activeSubject === "german" ? openProfileSetup : openProgress
          : undefined}
        displayName={learner.profileCompletedAt ? learner.displayName : undefined}
        subjectId={activeSubject}
      />
      {showProfileSetup || !learner.profileCompletedAt ? (
        <ProfileSetupView
          learner={learner}
          mode={learner.profileCompletedAt ? "edit" : "setup"}
          onSave={saveProfile}
          onCancel={learner.profileCompletedAt
            ? activeSubject === "german" ? goHome : openProgress
            : undefined}
          onRestore={learner.profileCompletedAt ? undefined : restoreBackup}
        />
      ) : showParent ? (
        <ParentArea
          learner={learner}
          germanCourse={germanCourse}
          access={parentAccess}
          unlocked={parentUnlocked}
          releaseReadiness={releaseReadiness}
          onCreatePin={createParentPin}
          onUnlock={unlockParent}
          onResetPin={resetParentPin}
          onExplanationLanguageChange={changeParentExplanationLanguage}
          onReleaseReadinessChange={persistReleaseReadiness}
          onResolveTeacherSupport={resolveTopicSupport}
          onResolveGermanTopicSupport={resolveGermanSupport}
          onSaveGermanComprehensionReview={saveGermanComprehensionReview}
          onSaveGermanWritingReview={saveGermanWritingReview}
          onBack={closeParent}
        />
      ) : activeSubject === "german" ? (
        <GermanCourseView
          state={germanCourse}
          displayName={learner.displayName}
          sourceArchiveLibrary={germanSourceArchiveLibrary}
          sourcePracticeState={germanSourcePracticeState}
          onChange={persistGermanCourse}
          onImportSourceArchive={importGermanSourceArchive}
          onSourcePracticeStateChange={persistGermanSourcePractice}
          onSubjectChange={() => switchSubject("math")}
          onEditProfile={openProfileSetup}
          onOpenCompanion={openParent}
          onResetSubject={resetGermanSubject}
        />
      ) : archivePracticeResult ? (
        <ArchivePracticeResultsView result={archivePracticeResult} onContinue={goHome} />
      ) : mockResult ? (
        <MockExamResultsView
          result={mockResult}
          officialDocuments={resultOfficialDocuments}
          onContinue={goHome}
          onResultChange={updateMockResult}
        />
      ) : showMockSetup ? (
        <MockExamSetupView
          latestResult={[
            ...learner.mockHistory,
          ].reverse().find((entry) => entry.source === "official-archive" && entry.officialReview?.status === "pending") ?? learner.mockHistory.at(-1)}
          officialArchiveLibrary={officialArchiveLibrary}
          activeOfficialEditionId={activeMock?.source === "official-archive"
            ? resolveOfficialExamBlueprint(activeMock)?.editionId
            : undefined}
          archivePracticeHistory={learner.archivePracticeHistory}
          activeArchivePractice={activeArchivePractice}
          archivePracticeBlocked={Boolean(activeSession || activeMock)}
          onBack={goHome}
          onStart={startMock}
          onStartOfficial={startOfficialMock}
          onResumeOfficial={resumeOfficialMock}
          onImportOfficial={importOfficialDocument}
          onImportOfficialArchive={importOfficialArchive}
          onStartArchivePractice={startArchivePractice}
          onResumeArchivePractice={resumeArchivePractice}
          onReviewOfficial={() => {
            const pending = [...learner.mockHistory]
              .reverse()
              .find((entry) => entry.source === "official-archive" && entry.officialReview?.status === "pending")
            if (pending) {
              setMockResult(pending)
              setShowMockSetup(false)
            }
          }}
        />
      ) : completion ? (
        <CompletionView
          summary={completion}
          onContinue={goHome}
          onRetryTopic={startErrorPractice}
          onOpenConcept={openConceptLibrary}
          onLearnerFeedback={submitLearnerFeedback}
          retryBlockedByAssessment={buildAssignments(learner).some((task) => task.kind === "assessment")}
        />
      ) : playerOpen && activeSession ? (
        <TaskPlayer
          key={activeSession.id}
          initialSession={activeSession}
          onBack={activeSession.prerequisiteDetour ? returnFromPrerequisiteDetour : goHome}
          onFinish={finishTask}
          onPrerequisite={startPrerequisiteDetour}
          onSessionChange={persistSession}
          onRequestTeacherSupport={requestTopicSupport}
          prerequisiteReturnXp={prerequisiteReturnXp}
          helpStyle={learner.preferences.helpStyle}
          minimalFocus={learner.preferences.visualMode === "focus"}
        />
      ) : !learner.placementCompletedAt ? (
        <OnboardingView
          onStartPlacement={startPlacement}
          onStartFoundations={startFoundations}
          resumeSession={activeSession?.task.kind === "placement" ? activeSession : undefined}
          onResume={() => setPlayerOpen(true)}
          learner={learner}
          onRestore={restoreBackup}
        />
      ) : showCurriculum ? (
        <CurriculumView
          learner={learner}
          examRunning={Boolean(activeMock || activeArchivePractice)}
          onBack={goHome}
          onStartLesson={startTopicLesson}
          onRefresh={startPrerequisite}
          onOpenConcept={openConceptLibrary}
        />
      ) : showCollection && learner.preferences.visualMode !== "focus" ? (
        <CollectionView learner={learner} onBack={goHome} />
      ) : showConceptLibrary ? (
        <ConceptLibraryView
          learner={learner}
          initialTopicId={conceptTopicId}
          practiceBlocked={Boolean(activeSession || activeMock || activeArchivePractice) || buildAssignments(learner).some((task) => task.kind === "assessment")}
          onBack={goHome}
          onStartPractice={startConceptPractice}
        />
      ) : showProgress ? (
        <ProgressView
          learner={learner}
          germanCourse={germanCourse}
          germanSourcePractice={germanSourcePracticeState}
          courseIndex={courseIndex}
          activeSession={activeSession}
          activeMock={activeMock}
          activeArchivePractice={activeArchivePractice}
          onBack={goHome}
          onOpenParent={openParent}
          onOpenCollection={learner.preferences.visualMode === "focus" ? undefined : openCollection}
          onEditProfile={openProfileSetup}
          onResetSubject={resetMathSubject}
          onReset={reset}
          onPracticeError={startErrorPractice}
          onRestore={restoreBackup}
        />
      ) : (
        <Home
          learner={learner}
          resumeSession={activeSession}
          activeMock={activeMock}
          activeArchivePractice={activeArchivePractice}
          onStart={startTask}
          onResume={() => setPlayerOpen(true)}
          onPrerequisite={startPrerequisite}
          onOpenCurriculum={() => {
            setShowProgress(false)
            setShowCollection(false)
            setShowCurriculum(true)
          }}
          onOpenCollection={learner.preferences.visualMode === "focus" ? undefined : openCollection}
          onOpenConceptLab={() => openConceptLibrary()}
          onOpenMock={openMock}
          onReset={reset}
          subjectSelector={<SubjectSwitcher value="math" onChange={switchSubject} />}
        />
      )}
    </div>
  )
}

export function App() {
  return (
    <LocalizationProvider>
      {window.location.pathname === "/exercise-report" ? (
        <ExerciseReportView encoded={new URLSearchParams(window.location.search).get("data") ?? undefined} />
      ) : (
        <LearningApp />
      )}
    </LocalizationProvider>
  )
}
