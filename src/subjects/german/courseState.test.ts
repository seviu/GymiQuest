import { describe, expect, it } from "vitest"
import { germanStartCheckQuestions } from "./content"
import {
  advanceGermanSession,
  answerCurrentGermanQuestion,
  answerGermanStartCheck,
  buildGermanAssignments,
  completeGermanStrictExam,
  createInitialGermanCourseState,
  currentGermanQuestion,
  germanSessionQuestions,
  normalizeGermanCourseState,
  requestGermanTopicSupport,
  resolveGermanTopicSupport,
  completeGermanWritingPractice,
  completeGermanWritingRevision,
  completeGermanComprehensionPractice,
  resolveGermanComprehensionHumanReview,
  saveGermanComprehensionHumanReview,
  saveGermanWritingHumanReview,
  startGermanComprehensionPractice,
  startGermanWritingPractice,
  startGermanWritingRevision,
  startGermanSession,
  startGermanStrictExam,
  startGermanStartCheck,
  updateGermanWritingPractice,
  updateGermanWritingRevision,
  updateGermanComprehensionPractice,
  updateGermanStrictExam,
} from "./courseState"
import { GERMAN_GENERATOR_VERSION, germanPilotTopicIds } from "./package"
import {
  isGermanAcceptedTextQuestion,
  isGermanBinaryGridQuestion,
  isGermanChoiceQuestion,
  isGermanMatchingQuestion,
  isGermanMultiSelectQuestion,
  isGermanTruthGridQuestion,
  type GermanGeneratedQuestion,
} from "./generators"
import type { GermanObjectiveResponse } from "./grading"
import {
  answerGermanExamQuestion,
  buildGermanExamBlueprint,
  gradeGermanExam,
} from "./exam"
import {
  buildGermanWritingForm,
  chooseGermanWritingPrompt,
  submitGermanWritingSession,
  updateGermanWritingDraft,
} from "./writing"
import {
  germanComprehensionPassage,
  submitGermanComprehensionSession,
  updateGermanComprehensionSession,
} from "./comprehension"
import {
  saveGermanWritingRevisionSnapshot,
  updateActiveGermanWritingRevision,
} from "./writingRevision"

function completedStartCheck() {
  let state = startGermanStartCheck(createInitialGermanCourseState("learner", new Date("2026-07-17T10:00:00.000Z")))
  germanStartCheckQuestions.forEach((question, index) => {
    state = answerGermanStartCheck(state, question.correctIndex, new Date(`2026-07-17T10:0${index + 1}:00.000Z`))
  })
  return state
}

function correctResponse(question: GermanGeneratedQuestion): GermanObjectiveResponse {
  if (isGermanMatchingQuestion(question)) {
    return { responseKind: "matching", matches: question.correctMatches.map((match) => ({ ...match })) }
  }
  if (isGermanTruthGridQuestion(question)) {
    return { responseKind: "truth-grid", selections: question.correctSelections.map((selection) => ({ ...selection })) }
  }
  if (isGermanBinaryGridQuestion(question)) {
    return { responseKind: "binary-grid", selections: question.correctSelections.map((selection) => ({ ...selection })) }
  }
  if (isGermanAcceptedTextQuestion(question)) {
    return { responseKind: "accepted-text", text: question.acceptedAnswers[0]!.text }
  }
  if (isGermanMultiSelectQuestion(question)) {
    return { responseKind: "multi-select", selectedOptionIds: [...question.correctOptionIds] }
  }
  return question.correctOptionId
}

function incorrectResponse(question: GermanGeneratedQuestion): GermanObjectiveResponse {
  if (isGermanChoiceQuestion(question)) {
    return question.options.find((option) => option.id !== question.correctOptionId)!.id
  }
  if (isGermanTruthGridQuestion(question)) {
    return {
      responseKind: "truth-grid",
      selections: question.correctSelections.map((selection, index) => ({
        ...selection,
        status: index === 0 ? (selection.status === "true" ? "false" : "true") : selection.status,
      })),
    }
  }
  if (isGermanBinaryGridQuestion(question)) {
    return {
      responseKind: "binary-grid",
      selections: question.correctSelections.map((selection, index) => ({
        ...selection,
        status: index === 0 ? (selection.status === "true" ? "false" : "true") : selection.status,
      })),
    }
  }
  if (isGermanAcceptedTextQuestion(question)) {
    return { responseKind: "accepted-text", text: "Diese Antwort ist absichtlich falsch." }
  }
  if (isGermanMultiSelectQuestion(question)) {
    const distractorId = question.options.find((option) => !question.correctOptionIds.includes(option.id))!.id
    return {
      responseKind: "multi-select",
      selectedOptionIds: [question.correctOptionIds[0]!, distractorId],
    }
  }
  const targets = question.correctMatches.map((match) => match.targetId)
  return {
    responseKind: "matching",
    matches: question.correctMatches.map((match, index) => ({
      itemId: match.itemId,
      targetId: targets[(index + 1) % targets.length]!,
    })),
  }
}

describe("German course state", () => {
  it("completes the start check without awarding XP or a grade", () => {
    const state = completedStartCheck()
    expect(state.startCheck).toMatchObject({ completedAt: expect.any(String), correctCount: 5 })
    expect(state.totalXp).toBe(0)
    expect(state.xpLedger).toEqual([])
    expect(buildGermanAssignments(state)).toHaveLength(5)
  })

  it("uses start-check evidence to place an insecure strand first without granting mastery", () => {
    let state = startGermanStartCheck(createInitialGermanCourseState("learner"))
    germanStartCheckQuestions.forEach((question, index) => {
      const answer = index === germanStartCheckQuestions.length - 1
        ? (question.correctIndex + 1) % question.options.length
        : question.correctIndex
      state = answerGermanStartCheck(state, answer)
    })

    const assignments = buildGermanAssignments(state)
    expect(assignments[0]).toMatchObject({
      topicId: "sentence-structure",
      kind: "lesson",
      recommended: true,
    })
    expect(state.topicProgress["sentence-structure"].completedAt).toBeUndefined()
  })

  it("persists a deterministic lesson and applies the requested XP policy", () => {
    let state = completedStartCheck()
    const assignment = buildGermanAssignments(state)[0]!
    state = startGermanSession(state, assignment, new Date("2026-07-17T11:00:00.000Z"))
    expect(state.activeSession?.questionCount).toBe(5)
    expect(state.activeSession?.generatorVersion).toBe(GERMAN_GENERATOR_VERSION)
    expect(germanSessionQuestions(state.activeSession!).every(
      (question) => question.difficultyBand === "foundation",
    )).toBe(true)

    for (let index = 0; index < 5; index += 1) {
      const question = currentGermanQuestion(state)!
      state = answerCurrentGermanQuestion(state, correctResponse(question), new Date(`2026-07-17T11:0${index}:00.000Z`))
      const result = advanceGermanSession(state, new Date(`2026-07-17T11:1${index}:00.000Z`))
      state = result.state
      if (index < 4) expect(result.completed).toBe(false)
      else {
        expect(result.completed).toBe(true)
        expect(result.award).toMatchObject({ baseXp: 20, bonusXp: 5, totalXp: 25, mistakes: 0 })
      }
    }

    expect(state.activeSession).toBeUndefined()
    expect(state.totalXp).toBe(25)
    expect(state.topicProgress[assignment.topicId]).toMatchObject({
      status: "mastered",
      lessonAttempts: 1,
      bestCorrect: 5,
      reviewDueAt: expect.any(String),
    })
    const lessonTemplates = new Set(state.topicProgress[assignment.topicId].recentTemplateIds)
    const review = buildGermanAssignments(state, new Date("2026-07-19T11:30:00.000Z"))
      .find((candidate) => candidate.topicId === assignment.topicId)
    expect(review?.kind).toBe("review")
    state = startGermanSession(state, review!, new Date("2026-07-19T11:31:00.000Z"))
    expect(germanSessionQuestions(state.activeSession!).every(
      (question) => question.difficultyBand === "standard",
    )).toBe(true)
    expect(germanSessionQuestions(state.activeSession!).every(
      (question) => !lessonTemplates.has(question.templateId),
    )).toBe(true)
  })

  it("uses constrained text corrections inside the normal lesson and review engine", () => {
    let state = completedStartCheck()
    const assignment = buildGermanAssignments(state, new Date("2026-07-17T11:00:00.000Z"))
      .find((candidate) => candidate.topicId === "grammar-correction")!
    state = startGermanSession(state, assignment, new Date("2026-07-17T11:01:00.000Z"))

    while (true) {
      const question = currentGermanQuestion(state)!
      if (isGermanAcceptedTextQuestion(question)) {
        state = answerCurrentGermanQuestion(state, {
          responseKind: "accepted-text",
          text: question.acceptedAnswers[0]!.text,
        }, new Date("2026-07-17T11:02:00.000Z"))
        expect(state.activeSession?.answers.at(-1)).toMatchObject({
          questionId: question.id,
          responseKind: "accepted-text",
          selectedText: question.acceptedAnswers[0]!.text,
          acceptedAnswerId: question.acceptedAnswers[0]!.id,
          scoringRuleId: "exact-accepted-text-v1",
          correct: true,
        })
        expect(advanceGermanSession(state, new Date("2026-07-17T11:03:00.000Z")).state)
          .not.toBe(state)
        break
      }
      state = answerCurrentGermanQuestion(state, correctResponse(question), new Date("2026-07-17T11:02:00.000Z"))
      state = advanceGermanSession(state, new Date("2026-07-17T11:03:00.000Z")).state
    }
  })

  it("uses exact-set comprehension inside the normal lesson and review engine", () => {
    let state = completedStartCheck()
    const assignment = buildGermanAssignments(state, new Date("2026-07-17T11:00:00.000Z"))
      .find((candidate) => candidate.topicId === "reading-evidence")!
    state = startGermanSession(state, assignment, new Date("2026-07-17T11:01:00.000Z"))

    while (true) {
      const question = currentGermanQuestion(state)!
      if (isGermanMultiSelectQuestion(question)) {
        state = answerCurrentGermanQuestion(state, {
          responseKind: "multi-select",
          selectedOptionIds: [...question.correctOptionIds],
        }, new Date("2026-07-17T11:02:00.000Z"))
        expect(state.activeSession?.answers.at(-1)).toMatchObject({
          questionId: question.id,
          responseKind: "multi-select",
          selectedOptionIds: [...question.correctOptionIds].sort(),
          correctOptionIds: [...question.correctOptionIds].sort(),
          scoringRuleId: "exact-multi-select-v1",
          correctUnits: 4,
          correct: true,
        })
        break
      }
      state = answerCurrentGermanQuestion(state, correctResponse(question), new Date("2026-07-17T11:02:00.000Z"))
      state = advanceGermanSession(state, new Date("2026-07-17T11:03:00.000Z")).state
    }
  })

  it("gives one-mistake lessons full base XP but reserves bonus XP for flawless work", () => {
    let state = completedStartCheck()
    const assignment = buildGermanAssignments(state)[0]!
    state = startGermanSession(state, assignment)
    let finalAward
    for (let index = 0; index < 5; index += 1) {
      const question = currentGermanQuestion(state)!
      const answer = index === 0 ? incorrectResponse(question) : correctResponse(question)
      state = answerCurrentGermanQuestion(state, answer)
      const result = advanceGermanSession(state)
      state = result.state
      finalAward = result.award ?? finalAward
    }
    expect(finalAward).toMatchObject({ baseXp: 20, bonusXp: 0, totalXp: 20, mistakes: 1 })
  })

  it("pauses an unclear skill, removes its assignments, and restores it only explicitly", () => {
    let state = completedStartCheck()
    state = requestGermanTopicSupport(state, "reading-evidence", new Date("2026-07-17T12:00:00.000Z"))
    expect(state.topicProgress["reading-evidence"].status).toBe("paused")
    expect(buildGermanAssignments(state).some((task) => task.topicId === "reading-evidence")).toBe(false)

    state = resolveGermanTopicSupport(state, "reading-evidence", new Date("2026-07-17T13:00:00.000Z"))
    expect(state.topicProgress["reading-evidence"].status).toBe("available")
    expect(buildGermanAssignments(state).some((task) => task.topicId === "reading-evidence")).toBe(true)
  })

  it("schedules a mixed subject-specific assessment and turns misses into immediate reviews", () => {
    let state = completedStartCheck()
    for (const topicId of germanPilotTopicIds) {
      state.topicProgress[topicId] = {
        ...state.topicProgress[topicId],
        status: "mastered",
        completedAt: "2026-07-17T11:00:00.000Z",
        reviewDueAt: "2026-08-17T11:00:00.000Z",
      }
    }
    state.totalXp = 120
    state.xpSinceAssessment = 120

    const assignments = buildGermanAssignments(state, new Date("2026-07-17T12:00:00.000Z"))
    expect(assignments).toHaveLength(1)
    expect(assignments[0]).toMatchObject({
      kind: "assessment",
      assessmentNumber: 1,
      maxXp: 10,
    })
    expect(new Set(assignments[0]!.topicIds)).toEqual(new Set(germanPilotTopicIds))

    state = startGermanSession(state, assignments[0]!, new Date("2026-07-17T12:01:00.000Z"))
    expect(germanSessionQuestions(state.activeSession!).every(
      (question) => question.difficultyBand === "exam",
    )).toBe(true)
    const missedTopics = new Set<string>()
    let finalAward
    for (let index = 0; index < 5; index += 1) {
      const question = currentGermanQuestion(state)!
      const selectedOptionId = index < 2 ? incorrectResponse(question) : correctResponse(question)
      if (index < 2) missedTopics.add(question.topicId)
      state = answerCurrentGermanQuestion(state, selectedOptionId, new Date(`2026-07-17T12:0${index + 2}:00.000Z`))
      const result = advanceGermanSession(state, new Date(`2026-07-17T12:1${index}:00.000Z`))
      state = result.state
      finalAward = result.award ?? finalAward
    }

    expect(finalAward).toMatchObject({ kind: "assessment", totalXp: 10, mistakes: 2 })
    expect(state.totalXp).toBe(130)
    expect(state.xpSinceAssessment).toBe(0)
    expect(state.assessmentHistory).toHaveLength(1)
    expect(state.assessmentHistory[0]).toMatchObject({ correct: 3, total: 5, assessmentNumber: 1 })
    expect(state.assessmentHistory[0]!.reviewSession?.kind).toBe("assessment")
    expect(state.assessmentHistory[0]!.reviewSession?.answers).toHaveLength(5)
    expect(state.assessmentHistory[0]!.reviewSession?.answers.filter((answer) => !answer.correct)).toHaveLength(2)
    for (const topicId of germanPilotTopicIds) {
      expect(state.topicProgress[topicId].reviewDueAt).toBe(
        missedTopics.has(topicId)
          ? "2026-07-17T12:14:00.000Z"
          : "2026-07-24T12:14:00.000Z",
      )
    }
    const reviews = buildGermanAssignments(state, new Date("2026-07-17T12:15:00.000Z"))
    expect(new Set(reviews.map((assignment) => assignment.topicId))).toEqual(missedTopics)
    expect(reviews.every((assignment) => assignment.kind === "review")).toBe(true)
  })

  it("migrates the first German state shape and unlocks the newly available strands", () => {
    const current = createInitialGermanCourseState("legacy", new Date("2026-07-17T10:00:00.000Z"))
    const legacy = {
      ...current,
      schemaVersion: 1,
      assessmentHistory: undefined,
      writingRevisions: undefined,
      activeWritingRevision: undefined,
      comprehensionHistory: undefined,
      comprehensionReviews: undefined,
      activeComprehension: undefined,
      topicProgress: Object.fromEntries(Object.entries(current.topicProgress).map(([topicId, progress]) => [
        topicId,
        germanPilotTopicIds.includes(topicId as typeof germanPilotTopicIds[number]) && topicId !== "reading-evidence" && topicId !== "grammar-correction"
          ? { ...progress, status: "coming-soon" }
          : progress,
      ])),
    }

    const migrated = normalizeGermanCourseState(legacy)
    expect(migrated).toMatchObject({
      schemaVersion: 9,
      assessmentHistory: [],
      examHistory: [],
      writingHistory: [],
      writingReviews: [],
      writingRevisions: [],
      comprehensionHistory: [],
      comprehensionReviews: [],
    })
    expect(migrated?.topicProgress["vocabulary-context"].status).toBe("available")
    expect(migrated?.topicProgress["word-formation"].status).toBe("available")
    expect(migrated?.topicProgress["sentence-structure"].status).toBe("available")
    expect(migrated?.topicProgress.writing.status).toBe("available")
  })

  it("resumes and completes a writing practice without changing XP or objective mastery", () => {
    const startedAt = new Date("2026-07-17T14:00:00.000Z")
    const before = completedStartCheck()
    const initialProgress = structuredClone(before.topicProgress)
    let state = startGermanWritingPractice(before, startedAt)
    expect(state.activeWriting).toBeDefined()
    expect(buildGermanAssignments(state)).toEqual([])
    expect(startGermanStrictExam(state, startedAt)).toEqual(state)

    let writing = state.activeWriting!
    const prompt = buildGermanWritingForm(writing.seed).prompts[0]!
    writing = chooseGermanWritingPrompt(writing, prompt.id, startedAt)
    writing = updateGermanWritingDraft(writing, "Ein eigener Entwurf für die gemeinsame Rückmeldung.", startedAt)
    state = updateGermanWritingPractice(state, writing)

    const result = submitGermanWritingSession(
      writing,
      "submitted",
      new Date("2026-07-17T14:20:00.000Z"),
    )
    state = completeGermanWritingPractice(state, result)

    expect(state.activeWriting).toBeUndefined()
    expect(state.writingHistory).toEqual([result])
    expect(state.totalXp).toBe(before.totalXp)
    expect(state.xpSinceAssessment).toBe(before.xpSinceAssessment)
    expect(state.xpLedger).toEqual(before.xpLedger)
    expect(state.topicProgress).toEqual(initialProgress)
    expect(buildGermanAssignments(state).length).toBeGreaterThan(0)

    const reviewed = saveGermanWritingHumanReview(
      state,
      result.id,
      "Der Einstieg ist klar.",
      "Die Zeitform im Hauptteil prüfen.",
      new Date("2026-07-17T15:00:00.000Z"),
    )
    expect(reviewed.writingReviews).toEqual([{
      schemaVersion: 1,
      resultId: result.id,
      reviewedAt: "2026-07-17T15:00:00.000Z",
      strength: "Der Einstieg ist klar.",
      nextStep: "Die Zeitform im Hauptteil prüfen.",
    }])
    expect(reviewed.totalXp).toBe(state.totalXp)
    expect(reviewed.xpLedger).toEqual(state.xpLedger)
    expect(reviewed.topicProgress).toEqual(state.topicProgress)
    expect(saveGermanWritingHumanReview(reviewed, "unknown-result", "Stärke", "Nächster Schritt"))
      .toBe(reviewed)
    expect(saveGermanWritingHumanReview(
      state,
      result.id,
      "Stärke",
      "Nächster Schritt",
      new Date("2026-07-17T14:10:00.000Z"),
    )).toBe(state)
  })

  it("keeps a constrained comprehension response pending until human review is resolved", () => {
    const startedAt = new Date("2026-07-17T16:00:00.000Z")
    const before = completedStartCheck()
    const initialProgress = structuredClone(before.topicProgress)
    let state = startGermanComprehensionPractice(before, startedAt)
    expect(state.activeComprehension).toBeDefined()
    expect(buildGermanAssignments(state)).toEqual([])
    expect(startGermanWritingPractice(state, startedAt)).toEqual(state)

    const passage = germanComprehensionPassage(state.activeComprehension!.promptId)!
    const active = updateGermanComprehensionSession(
      state.activeComprehension!,
      "Die Antwort erklärt die Veränderung mit zwei genauen Informationen aus dem kurzen Text.",
      [passage.lines[0]!.number, passage.lines[1]!.number],
      new Date("2026-07-17T16:04:00.000Z"),
    )
    state = updateGermanComprehensionPractice(state, active)
    const result = submitGermanComprehensionSession(active, new Date("2026-07-17T16:05:00.000Z"))
    state = completeGermanComprehensionPractice(state, result)

    expect(state.activeComprehension).toBeUndefined()
    expect(state.comprehensionHistory).toEqual([result])
    expect(state.comprehensionReviews).toEqual([])
    expect(state.totalXp).toBe(before.totalXp)
    expect(state.xpLedger).toEqual(before.xpLedger)
    expect(state.topicProgress).toEqual(initialProgress)
    expect(startGermanComprehensionPractice(state, startedAt)).toBe(state)

    const reviewed = saveGermanComprehensionHumanReview(
      state,
      result.id,
      "partly-supported",
      "Der Zusammenhang ist klar benannt.",
      "Verbinde die zweite Aussage noch genauer mit deiner markierten Zeile.",
      new Date("2026-07-17T16:10:00.000Z"),
    )
    expect(reviewed.comprehensionReviews[0]).toMatchObject({
      resultId: result.id,
      evidenceStatus: "partly-supported",
    })
    expect(reviewed.comprehensionReviews[0]?.resolvedAt).toBeUndefined()
    expect(startGermanComprehensionPractice(reviewed, startedAt)).toBe(reviewed)
    const resolved = resolveGermanComprehensionHumanReview(
      reviewed,
      result.id,
      new Date("2026-07-17T16:11:00.000Z"),
    )
    expect(resolved.comprehensionReviews[0]?.resolvedAt).toBe("2026-07-17T16:11:00.000Z")
    expect(startGermanComprehensionPractice(resolved, new Date("2026-07-17T16:12:00.000Z")))
      .not.toBe(resolved)
    expect(resolved.totalXp).toBe(before.totalXp)
    expect(resolved.topicProgress).toEqual(initialProgress)
  })

  it("persists immutable writing revisions after human feedback without learning effects", () => {
    const before = completedStartCheck()
    const initialProgress = structuredClone(before.topicProgress)
    let state = startGermanWritingPractice(before, new Date("2026-07-17T14:00:00.000Z"))
    let writing = state.activeWriting!
    writing = chooseGermanWritingPrompt(
      writing,
      buildGermanWritingForm(writing.seed).prompts[0]!.id,
      new Date("2026-07-17T14:01:00.000Z"),
    )
    writing = updateGermanWritingDraft(
      writing,
      "Der unveränderliche erste Text enthält einen klaren Anfang.",
      new Date("2026-07-17T14:10:00.000Z"),
    )
    state = updateGermanWritingPractice(state, writing)
    const result = submitGermanWritingSession(writing, "submitted", new Date("2026-07-17T14:20:00.000Z"))
    state = completeGermanWritingPractice(state, result)
    expect(startGermanWritingRevision(state, result.id, new Date("2026-07-17T14:30:00.000Z"))).toBe(state)

    state = saveGermanWritingHumanReview(
      state,
      result.id,
      "Der Anfang ist klar.",
      "Verbinde den Hauptteil genauer mit dem Konflikt.",
      new Date("2026-07-17T15:00:00.000Z"),
    )
    state = startGermanWritingRevision(state, result.id, new Date("2026-07-17T15:01:00.000Z"))
    expect(state.activeWritingRevision).toMatchObject({
      resultId: result.id,
      revisionNumber: 1,
      draft: result.draft,
    })
    expect(buildGermanAssignments(state)).toEqual([])
    expect(startGermanComprehensionPractice(state)).toBe(state)
    expect(saveGermanWritingHumanReview(
      state,
      result.id,
      "Eine nachträglich ersetzte Stärke.",
      "Ein nachträglich ersetzter Schritt.",
      new Date("2026-07-17T15:02:00.000Z"),
    )).toBe(state)

    const revisedDraft = `${result.draft} Nun führt der Hauptteil sichtbar zum Konflikt.`
    const active = updateActiveGermanWritingRevision(
      state.activeWritingRevision!,
      { draft: revisedDraft },
      new Date("2026-07-17T15:05:00.000Z"),
    )
    state = updateGermanWritingRevision(state, active)
    const snapshot = saveGermanWritingRevisionSnapshot(active, new Date("2026-07-17T15:06:00.000Z"))
    state = completeGermanWritingRevision(state, snapshot)

    expect(state.activeWritingRevision).toBeUndefined()
    expect(state.writingHistory).toEqual([result])
    expect(state.writingRevisions).toEqual([snapshot])
    expect(state.totalXp).toBe(before.totalXp)
    expect(state.xpLedger).toEqual(before.xpLedger)
    expect(state.topicProgress).toEqual(initialProgress)
    expect(saveGermanWritingHumanReview(
      state,
      result.id,
      "Eine nachträglich ersetzte Stärke.",
      "Ein nachträglich ersetzter Schritt.",
      new Date("2026-07-17T15:07:00.000Z"),
    )).toBe(state)

    const next = startGermanWritingRevision(state, result.id, new Date("2026-07-17T15:10:00.000Z"))
    expect(next.activeWritingRevision).toMatchObject({ revisionNumber: 2, draft: revisedDraft })
    const unchangedSnapshot = saveGermanWritingRevisionSnapshot(
      next.activeWritingRevision!,
      new Date("2026-07-17T15:11:00.000Z"),
    )
    expect(completeGermanWritingRevision(next, unchangedSnapshot)).toBe(next)
  })

  it("resumes a pre-versioning German session with the original generator", () => {
    let current = completedStartCheck()
    current = startGermanSession(
      current,
      buildGermanAssignments(current)[2]!,
      new Date("2026-07-17T11:00:00.000Z"),
    )
    const legacy = structuredClone(current) as unknown as {
      schemaVersion: number
      activeSession: { generatorVersion?: number }
    }
    legacy.schemaVersion = 3
    delete legacy.activeSession.generatorVersion

    const migrated = normalizeGermanCourseState(legacy)
    expect(migrated?.activeSession?.generatorVersion).toBe(1)
    const questions = germanSessionQuestions(migrated!.activeSession!)
    expect(questions.every((question) => question.generatorVersion === 1)).toBe(true)
    expect(questions.every((question) => (
      question.familyId !== "connector-cloze" &&
      question.familyId !== "tense-perspective" &&
      question.familyId !== "word-class"
    ))).toBe(true)
  })

  it("migrates schema-six writing history into an empty human-review queue", () => {
    const current = createInitialGermanCourseState("schema-six", new Date("2026-07-17T10:00:00.000Z"))
    const legacy = {
      ...current,
      schemaVersion: 6,
      writingReviews: undefined,
      writingRevisions: undefined,
      activeWritingRevision: undefined,
      comprehensionHistory: undefined,
      comprehensionReviews: undefined,
      activeComprehension: undefined,
    }

    const migrated = normalizeGermanCourseState(legacy)
    expect(migrated).toMatchObject({
      schemaVersion: 9,
      writingHistory: [],
      writingReviews: [],
      writingRevisions: [],
      comprehensionHistory: [],
      comprehensionReviews: [],
    })
    expect(normalizeGermanCourseState({
      ...current,
      writingReviews: [{
        schemaVersion: 1,
        resultId: "missing-result",
        reviewedAt: "2026-07-17T11:00:00.000Z",
        strength: "Stärke",
        nextStep: "Nächster Schritt",
      }],
    })).toBeUndefined()
  })

  it("migrates the pre-revision schema without inventing revision activity", () => {
    const current = createInitialGermanCourseState("schema-eight", new Date("2026-07-17T10:00:00.000Z"))
    const legacy = {
      ...current,
      schemaVersion: 8,
      writingRevisions: undefined,
      activeWritingRevision: undefined,
    }

    expect(normalizeGermanCourseState(legacy)).toMatchObject({
      schemaVersion: 9,
      writingRevisions: [],
      activeWritingRevision: undefined,
    })
  })

  it("keeps strict-exam scoring separate from XP and schedules fresh reviews for missed skills", () => {
    let state = startGermanStrictExam(completedStartCheck(), new Date("2026-07-17T12:00:00.000Z"))
    expect(state.activeExam).toBeDefined()
    expect(buildGermanAssignments(state)).toEqual([])
    const blueprint = buildGermanExamBlueprint(state.activeExam!.seed)
    expect(blueprint.version).toBe(9)
    expect(blueprint.questions.every((question) => question.difficultyBand === "exam")).toBe(true)
    let exam = state.activeExam!
    blueprint.questions.forEach((question, index) => {
      const selected = index === 0 ? incorrectResponse(question) : correctResponse(question)
      exam = answerGermanExamQuestion(exam, question.id, selected, new Date("2026-07-17T12:10:00.000Z"))
    })
    state = updateGermanStrictExam(state, exam)
    const result = gradeGermanExam(exam, "submitted", new Date("2026-07-17T12:15:00.000Z"))
    state = completeGermanStrictExam(state, result, new Date("2026-07-17T12:15:00.000Z"))

    expect(state.activeExam).toBeUndefined()
    expect(state.examHistory).toHaveLength(1)
    expect(state.examHistory[0]).toMatchObject({ correctPoints: 19, maxPoints: 20 })
    expect(state.totalXp).toBe(0)
    expect(state.xpSinceAssessment).toBe(0)
    expect(state.xpLedger).toEqual([])
    expect(state.topicProgress[blueprint.questions[0]!.topicId].reviewDueAt).toBe(
      "2026-07-17T12:15:00.000Z",
    )
  })
})
