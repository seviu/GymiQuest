import { describe, expect, it } from "vitest"
import { subjectRegistry, subjectRuntimeFor } from "./subjectRegistry"
import { courseKeys } from "./subjectIdentity"
import { GERMAN_GENERATOR_VERSION } from "../subjects/german/package"

describe("subject registry", () => {
  it("registers isolated mathematics and German runtimes", () => {
    expect(Object.keys(subjectRegistry)).toEqual(["math", "german"])
    expect(subjectRuntimeFor("math").courseKey).toBe(courseKeys.math)
    expect(subjectRuntimeFor("german").courseKey).toBe(courseKeys.german)
    expect(subjectRuntimeFor("math").generator).toEqual({ id: "zh-zap1-math", version: 6 })
    expect(subjectRuntimeFor("german").generator).toEqual({
      id: "zh-zap1-german",
      version: GERMAN_GENERATOR_VERSION,
      corpusVersion: 1,
    })
  })

  it("wraps all existing math topics and exposes six German strands", () => {
    expect(subjectRuntimeFor("math").topics).toHaveLength(23)
    expect(subjectRuntimeFor("german").topics).toHaveLength(6)
    expect(subjectRuntimeFor("german").lessons.map((lesson) => lesson.topicId)).toEqual([
      "reading-evidence",
      "vocabulary-context",
      "word-formation",
      "grammar-correction",
      "sentence-structure",
    ])
  })
})
