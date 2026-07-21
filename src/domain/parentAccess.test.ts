import { describe, expect, it } from "vitest"
import {
  createParentAccess,
  isValidParentPin,
  normalizeParentExplanationLanguage,
  parentExplanationLanguage,
  setParentExplanationLanguage,
  verifyParentPin,
} from "./parentAccess"

describe("device-local parent access", () => {
  it("accepts only a short numeric PIN intended to prevent casual access", () => {
    expect(isValidParentPin("4826")).toBe(true)
    expect(isValidParentPin("12345678")).toBe(true)
    expect(isValidParentPin("123")).toBe(false)
    expect(isValidParentPin("123456789")).toBe(false)
    expect(isValidParentPin("12a4")).toBe(false)
  })

  it("stores a salted verifier and checks the PIN without retaining it", async () => {
    const record = await createParentAccess(
      "4826",
      new Date("2026-07-14T12:00:00.000Z"),
    )

    expect(record).toMatchObject({
      version: 1,
      algorithm: "PBKDF2-SHA-256",
      createdAt: "2026-07-14T12:00:00.000Z",
      explanationLanguage: "de",
    })
    expect(JSON.stringify(record)).not.toContain("4826")
    expect(await verifyParentPin(record, "4826")).toBe(true)
    expect(await verifyParentPin(record, "4827")).toBe(false)
    expect(await verifyParentPin(record, "not-a-pin")).toBe(false)
  })

  it("uses a fresh salt for each setup", async () => {
    const first = await createParentAccess("4826")
    const second = await createParentAccess("4826")

    expect(first.salt).not.toBe(second.salt)
    expect(first.verifier).not.toBe(second.verifier)
  })

  it("keeps the optional explanation language beside the PIN record", async () => {
    const record = await createParentAccess(
      "4826",
      new Date("2026-07-14T12:00:00.000Z"),
      "en",
    )

    expect(parentExplanationLanguage(record)).toBe("en")
    expect(parentExplanationLanguage({ ...record, explanationLanguage: undefined })).toBe("de")
    expect(normalizeParentExplanationLanguage("it")).toBe("it")
    expect(normalizeParentExplanationLanguage("es")).toBe("es")
    expect(normalizeParentExplanationLanguage("fr")).toBe("de")

    const updated = setParentExplanationLanguage(record, "it")
    expect(updated.explanationLanguage).toBe("it")
    expect(updated.verifier).toBe(record.verifier)
    expect(await verifyParentPin(updated, "4826")).toBe(true)

    const spanish = setParentExplanationLanguage(updated, "es")
    expect(spanish.explanationLanguage).toBe("es")
    expect(spanish.verifier).toBe(record.verifier)
  })
})
