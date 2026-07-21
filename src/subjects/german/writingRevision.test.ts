import { describe, expect, it } from "vitest"
import {
  buildGermanWritingForm,
  chooseGermanWritingPrompt,
  createActiveGermanWritingSession,
  submitGermanWritingSession,
  updateGermanWritingDraft,
} from "./writing"
import {
  createActiveGermanWritingRevision,
  germanWritingRevisionCanSave,
  isActiveGermanWritingRevision,
  isGermanWritingRevisionSnapshot,
  saveGermanWritingRevisionSnapshot,
  updateActiveGermanWritingRevision,
} from "./writingRevision"

const startedAt = new Date("2026-07-17T12:00:00.000Z")

function writingResult() {
  let session = createActiveGermanWritingSession("revision-test", startedAt)
  session = chooseGermanWritingPrompt(session, buildGermanWritingForm(session.seed).prompts[0]!.id, startedAt)
  session = updateGermanWritingDraft(
    session,
    "Der ursprüngliche Text bleibt unverändert gespeichert.",
    new Date("2026-07-17T12:10:00.000Z"),
  )
  return submitGermanWritingSession(session, "submitted", new Date("2026-07-17T12:20:00.000Z"))
}

describe("German writing revisions", () => {
  it("creates a resumable revision from an immutable writing result", () => {
    const result = writingResult()
    const active = createActiveGermanWritingRevision(result, [], new Date("2026-07-17T13:00:00.000Z"))!
    expect(active).toMatchObject({
      resultId: result.id,
      revisionNumber: 1,
      title: result.title,
      draft: result.draft,
    })
    expect(isActiveGermanWritingRevision(active)).toBe(true)
    expect(active).not.toHaveProperty("points")
    expect(active).not.toHaveProperty("xp")
  })

  it("saves numbered immutable snapshots and starts the next revision from the latest text", () => {
    const result = writingResult()
    const active = createActiveGermanWritingRevision(result, [], new Date("2026-07-17T13:00:00.000Z"))!
    const updated = updateActiveGermanWritingRevision(
      active,
      { draft: `${active.draft} Nun ist der nächste Arbeitsschritt sichtbar umgesetzt.` },
      new Date("2026-07-17T13:05:00.000Z"),
    )
    expect(germanWritingRevisionCanSave(updated)).toBe(true)
    const snapshot = saveGermanWritingRevisionSnapshot(updated, new Date("2026-07-17T13:06:00.000Z"))
    expect(snapshot.revisionNumber).toBe(1)
    expect(snapshot.wordCount).toBeGreaterThan(0)
    expect(isGermanWritingRevisionSnapshot(snapshot)).toBe(true)
    expect(snapshot).not.toHaveProperty("grade")
    expect(snapshot).not.toHaveProperty("mastery")

    const next = createActiveGermanWritingRevision(result, [snapshot], new Date("2026-07-17T14:00:00.000Z"))!
    expect(next.revisionNumber).toBe(2)
    expect(next.draft).toBe(snapshot.draft)
  })

  it("rejects empty, malformed, scored, and more than five revisions", () => {
    const result = writingResult()
    const empty = updateActiveGermanWritingRevision(
      createActiveGermanWritingRevision(result, [], startedAt)!,
      { draft: "  " },
      startedAt,
    )
    expect(germanWritingRevisionCanSave(empty)).toBe(false)
    expect(() => saveGermanWritingRevisionSnapshot(empty)).toThrow(/non-empty draft/)
    expect(isActiveGermanWritingRevision({ ...empty, xp: 1 })).toBe(false)

    const snapshots = Array.from({ length: 5 }, (_, index) => {
      const active = createActiveGermanWritingRevision(result, [], new Date(startedAt.getTime() + index * 1_000))!
      const numbered = {
        ...active,
        id: `german-writing-revision:${result.id}:${index + 1}`,
        revisionNumber: index + 1,
      }
      return saveGermanWritingRevisionSnapshot(numbered, new Date(startedAt.getTime() + index * 1_000))
    })
    expect(createActiveGermanWritingRevision(result, snapshots, startedAt)).toBeUndefined()
    expect(isGermanWritingRevisionSnapshot({ ...snapshots[0], score: 100 })).toBe(false)
  })
})
