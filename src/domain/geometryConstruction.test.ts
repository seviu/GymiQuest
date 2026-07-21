import { describe, expect, it } from "vitest"
import {
  decodeGeometryConstructionAnswer,
  encodeGeometryConstructionAnswer,
  gradeGeometryConstruction,
  shouldUseGeometryConstruction,
  snapGeometryParameter,
  type GeometryConstructionAnswer,
} from "./geometryConstruction"
import type {
  GeneratedQuestion,
  GeometryConstructionSpec,
  LearningTask,
} from "./model"

const spec: GeometryConstructionSpec = {
  expectedTool: "parallel",
  width: 640,
  height: 360,
  pixelsPerCentimeter: 24,
  targetParameter: 168,
  initialParameter: 192,
  minParameter: 48,
  maxParameter: 264,
  snap: 2.4,
  tolerance: 4.8,
  distanceCentimeters: 5,
  reference: {
    kind: "line",
    y: 288,
    label: "s",
    allowedSide: "north",
  },
}

const task: LearningTask = {
  id: "review:geometry:test",
  kind: "review",
  title: "Geometrie",
  description: "Konstruktion",
  topicIds: ["geometric-loci"],
  prerequisiteIds: [],
  maxXp: 6,
  questionCount: 1,
  seed: "review:geometry:test",
}

const question: GeneratedQuestion = {
  id: "geometry:test",
  topicId: "geometric-loci",
  prompt: "Konstruiere die Grenze.",
  answerLabel: "Konstruktion",
  response: { kind: "choice", value: "parallel", options: [] },
  hint: "Abstand",
  easierExplanation: "Gerade",
  explanation: "Parallele",
  workedSteps: [],
  geometryConstruction: spec,
}

describe("semantic geometry construction", () => {
  it("round-trips a versioned semantic answer", () => {
    const answer: GeometryConstructionAnswer = {
      version: 1,
      tool: "parallel",
      parameter: 168,
    }

    expect(decodeGeometryConstructionAnswer(
      encodeGeometryConstructionAnswer(answer),
    )).toEqual(answer)
    expect(decodeGeometryConstructionAnswer("not-json")).toBeUndefined()
    expect(decodeGeometryConstructionAnswer('{"version":1,"tool":"angle","parameter":168}')).toBeUndefined()
    expect(decodeGeometryConstructionAnswer('{"version":1,"tool":"parallel","parameter":"168"}')).toBeUndefined()
  })

  it("grades the method and placement independently with certain evidence", () => {
    expect(gradeGeometryConstruction(spec, {
      version: 1,
      tool: "parallel",
      parameter: spec.targetParameter,
    })).toEqual({
      correct: true,
      methodCorrect: true,
      placementCorrect: true,
      deviation: 0,
      confidence: "certain",
    })

    const wrongTool = gradeGeometryConstruction(spec, {
      version: 1,
      tool: "circle",
      parameter: spec.targetParameter,
    })
    expect(wrongTool).toMatchObject({
      correct: false,
      methodCorrect: false,
      placementCorrect: true,
      confidence: "certain",
    })
    expect(wrongTool.issue?.title).toContain("Art der Konstruktion")

    const wrongPlacement = gradeGeometryConstruction(spec, {
      version: 1,
      tool: "parallel",
      parameter: spec.targetParameter + spec.tolerance + spec.snap,
    })
    expect(wrongPlacement).toMatchObject({
      correct: false,
      methodCorrect: true,
      placementCorrect: false,
      confidence: "certain",
    })
    expect(wrongPlacement.issue?.title).toContain("Lage")
  })

  it("accepts the documented two-millimeter boundary but not more", () => {
    expect(gradeGeometryConstruction(spec, {
      version: 1,
      tool: "parallel",
      parameter: spec.targetParameter + spec.tolerance,
    }).correct).toBe(true)
    expect(gradeGeometryConstruction(spec, {
      version: 1,
      tool: "parallel",
      parameter: spec.targetParameter + spec.tolerance + 0.001,
    }).correct).toBe(false)
  })

  it("snaps pointer input to the plan grid and clamps it to the canvas controls", () => {
    expect(snapGeometryParameter(spec, 170.1)).toBe(170.4)
    expect(snapGeometryParameter(spec, -100)).toBe(spec.minParameter)
    expect(snapGeometryParameter(spec, 900)).toBe(spec.maxParameter)
  })

  it("uses construction in learning and review work while keeping placement brief", () => {
    expect(shouldUseGeometryConstruction(task, question)).toBe(true)
    expect(shouldUseGeometryConstruction({ ...task, kind: "lesson" }, question)).toBe(true)
    expect(shouldUseGeometryConstruction({ ...task, kind: "assessment" }, question)).toBe(true)
    expect(shouldUseGeometryConstruction({ ...task, kind: "placement" }, question)).toBe(false)
  })
})
