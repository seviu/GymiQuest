import type {
  GeneratedQuestion,
  GeometryConstructionSpec,
  GeometryConstructionTool,
  LearningTask,
} from "./model"

export interface GeometryConstructionAnswer {
  version: 1
  tool: GeometryConstructionTool
  parameter: number
}

export interface GeometryConstructionIssue {
  title: string
  message: string
  nextStep: string
}

export interface GeometryConstructionGrade {
  correct: boolean
  methodCorrect: boolean
  placementCorrect: boolean
  deviation: number
  confidence: "certain"
  issue?: GeometryConstructionIssue
}

const tools = new Set<GeometryConstructionTool>([
  "parallel",
  "circle",
  "bisector",
])

export function encodeGeometryConstructionAnswer(
  answer: GeometryConstructionAnswer,
): string {
  return JSON.stringify(answer)
}

export function decodeGeometryConstructionAnswer(
  serialized: string,
): GeometryConstructionAnswer | undefined {
  if (!serialized.trim()) return undefined

  try {
    const parsed: unknown = JSON.parse(serialized)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined
    const candidate = parsed as Record<string, unknown>
    if (
      candidate.version !== 1 ||
      typeof candidate.tool !== "string" ||
      !tools.has(candidate.tool as GeometryConstructionTool) ||
      typeof candidate.parameter !== "number" ||
      !Number.isFinite(candidate.parameter)
    ) {
      return undefined
    }

    return {
      version: 1,
      tool: candidate.tool as GeometryConstructionTool,
      parameter: candidate.parameter,
    }
  } catch {
    return undefined
  }
}

export function shouldUseGeometryConstruction(
  task: LearningTask,
  question: GeneratedQuestion,
): question is GeneratedQuestion & { geometryConstruction: GeometryConstructionSpec } {
  return Boolean(question.geometryConstruction && task.kind !== "placement")
}

function placementNextStep(spec: GeometryConstructionSpec): string {
  switch (spec.expectedTool) {
    case "parallel":
      return "Verschiebe die Linie so, dass ihr senkrechter Abstand zu s mit der Angabe übereinstimmt."
    case "circle":
      return "Verändere den Radius; der Mittelpunkt F bleibt dabei unverändert."
    case "bisector":
      return "Verschiebe die Trennlinie, bis sie durch den Mittelpunkt von B₁B₂ läuft."
  }
}

export function gradeGeometryConstruction(
  spec: GeometryConstructionSpec,
  answer: GeometryConstructionAnswer | undefined,
): GeometryConstructionGrade {
  const finiteParameter = Boolean(answer && Number.isFinite(answer.parameter))
  const methodCorrect = Boolean(answer && answer.tool === spec.expectedTool)
  const deviation = finiteParameter
    ? Math.abs(answer!.parameter - spec.targetParameter)
    : Number.POSITIVE_INFINITY
  const placementCorrect = finiteParameter && deviation <= spec.tolerance + 1e-9
  const correct = methodCorrect && placementCorrect

  if (correct) {
    return {
      correct: true,
      methodCorrect: true,
      placementCorrect: true,
      deviation,
      confidence: "certain",
    }
  }

  if (!answer) {
    return {
      correct: false,
      methodCorrect: false,
      placementCorrect: false,
      deviation,
      confidence: "certain",
      issue: {
        title: "Die Konstruktion ist noch nicht vollständig.",
        message: "Wähle zuerst ein Werkzeug und platziere die Konstruktion im Plan.",
        nextStep: "Achte darauf, ob die Bedingung eine Gerade, einen Punkt oder zwei Punkte nennt.",
      },
    }
  }

  if (!methodCorrect) {
    return {
      correct: false,
      methodCorrect: false,
      placementCorrect,
      deviation,
      confidence: "certain",
      issue: {
        title: "Die Art der Konstruktion passt noch nicht.",
        message: "Die Lage prüfen wir erst, wenn das geometrische Werkzeug zur Bedingung passt.",
        nextStep: "Frage dich: Geht es um den Abstand von einer Geraden, von einem Punkt oder um den Vergleich zweier Punkte?",
      },
    }
  }

  return {
    correct: false,
    methodCorrect: true,
    placementCorrect: false,
    deviation,
    confidence: "certain",
    issue: {
      title: "Das Werkzeug passt, die Lage noch nicht.",
      message: "Die geometrische Idee stimmt. Richte die Konstruktion nun genauer an den gegebenen Objekten aus.",
      nextStep: placementNextStep(spec),
    },
  }
}

export function snapGeometryParameter(
  spec: GeometryConstructionSpec,
  value: number,
): number {
  const clamped = Math.min(spec.maxParameter, Math.max(spec.minParameter, value))
  const snapped = spec.minParameter + Math.round(
    (clamped - spec.minParameter) / spec.snap,
  ) * spec.snap
  return Number(snapped.toFixed(4))
}
