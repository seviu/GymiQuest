export const OFFICIAL_2024_MATH_GRADE_SCALE_ID = "zap-lg-2024-math-2024-03-15" as const
export const OFFICIAL_2025_MATH_GRADE_SCALE_ID = "zap-lg-2025-math-2025-03-14" as const

export interface OfficialMathGradeBand {
  fromPoints: number
  toPoints: number
  grade: number
}

/** Mathematics column of “Notenskala ZAP · Langgymnasium 2024”, published 15 March 2024. */
export const official2024MathGradeScale = {
  id: OFFICIAL_2024_MATH_GRADE_SCALE_ID,
  editionId: "zap-zh-lg-2024",
  title: "Notenskala ZAP Langgymnasium 2024 · Mathematik",
  publishedAt: "2024-03-15",
  maxPoints: 36,
  bands: [
    { fromPoints: 0, toPoints: 0, grade: 1 },
    { fromPoints: 1, toPoints: 2, grade: 1.25 },
    { fromPoints: 3, toPoints: 4, grade: 1.5 },
    { fromPoints: 5, toPoints: 6, grade: 1.75 },
    { fromPoints: 7, toPoints: 8, grade: 2 },
    { fromPoints: 9, toPoints: 9, grade: 2.25 },
    { fromPoints: 10, toPoints: 11, grade: 2.5 },
    { fromPoints: 12, toPoints: 13, grade: 2.75 },
    { fromPoints: 14, toPoints: 15, grade: 3 },
    { fromPoints: 16, toPoints: 17, grade: 3.25 },
    { fromPoints: 18, toPoints: 18, grade: 3.5 },
    { fromPoints: 19, toPoints: 20, grade: 3.75 },
    { fromPoints: 21, toPoints: 22, grade: 4 },
    { fromPoints: 23, toPoints: 24, grade: 4.25 },
    { fromPoints: 25, toPoints: 26, grade: 4.5 },
    { fromPoints: 27, toPoints: 27, grade: 4.75 },
    { fromPoints: 28, toPoints: 29, grade: 5 },
    { fromPoints: 30, toPoints: 31, grade: 5.25 },
    { fromPoints: 32, toPoints: 33, grade: 5.5 },
    { fromPoints: 34, toPoints: 35, grade: 5.75 },
    { fromPoints: 36, toPoints: 36, grade: 6 },
  ] satisfies readonly OfficialMathGradeBand[],
} as const

/**
 * Mathematics column of “Notenskala ZAP · Langgymnasium 2025”, published by
 * the Zürcher Maturitätsschulen coordination on 14 March 2025.
 *
 * This is deliberately edition-specific. A generated mock or another archive
 * year must never silently reuse it just because its maximum is also 36.
 */
export const official2025MathGradeScale = {
  id: OFFICIAL_2025_MATH_GRADE_SCALE_ID,
  editionId: "zap-zh-lg-2025",
  title: "Notenskala ZAP Langgymnasium 2025 · Mathematik",
  publishedAt: "2025-03-14",
  maxPoints: 36,
  bands: [
    { fromPoints: 0, toPoints: 0, grade: 1 },
    { fromPoints: 1, toPoints: 2, grade: 1.25 },
    { fromPoints: 3, toPoints: 3, grade: 1.5 },
    { fromPoints: 4, toPoints: 5, grade: 1.75 },
    { fromPoints: 6, toPoints: 7, grade: 2 },
    { fromPoints: 8, toPoints: 8, grade: 2.25 },
    { fromPoints: 9, toPoints: 10, grade: 2.5 },
    { fromPoints: 11, toPoints: 11, grade: 2.75 },
    { fromPoints: 12, toPoints: 13, grade: 3 },
    { fromPoints: 14, toPoints: 15, grade: 3.25 },
    { fromPoints: 16, toPoints: 16, grade: 3.5 },
    { fromPoints: 17, toPoints: 18, grade: 3.75 },
    { fromPoints: 19, toPoints: 19, grade: 4 },
    { fromPoints: 20, toPoints: 21, grade: 4.25 },
    { fromPoints: 22, toPoints: 23, grade: 4.5 },
    { fromPoints: 24, toPoints: 24, grade: 4.75 },
    { fromPoints: 25, toPoints: 26, grade: 5 },
    { fromPoints: 27, toPoints: 27, grade: 5.25 },
    { fromPoints: 28, toPoints: 29, grade: 5.5 },
    { fromPoints: 30, toPoints: 31, grade: 5.75 },
    { fromPoints: 32, toPoints: 36, grade: 6 },
  ] satisfies readonly OfficialMathGradeBand[],
} as const

function mathematicsGrade(
  points: number,
  scale: { maxPoints: number; bands: readonly OfficialMathGradeBand[] },
  year: number,
): number {
  if (!Number.isInteger(points) || points < 0 || points > scale.maxPoints) {
    throw new Error(`The ${year} mathematics scale requires a whole point total from 0 to ${scale.maxPoints}.`)
  }
  const band = scale.bands.find(
    (entry) => points >= entry.fromPoints && points <= entry.toPoints,
  )
  if (!band) throw new Error(`The ${year} mathematics scale does not cover ${points} points.`)
  return band.grade
}

export function official2024MathematicsGrade(points: number): number {
  return mathematicsGrade(points, official2024MathGradeScale, 2024)
}

export function official2025MathematicsGrade(points: number): number {
  return mathematicsGrade(points, official2025MathGradeScale, 2025)
}

export function officialMathematicsGradeForEdition(
  editionId: string | undefined,
  points: number,
): { gradeScaleId: string; mathematicsGrade: number } | undefined {
  if (editionId === official2024MathGradeScale.editionId) {
    return {
      gradeScaleId: OFFICIAL_2024_MATH_GRADE_SCALE_ID,
      mathematicsGrade: official2024MathematicsGrade(points),
    }
  }
  if (editionId === official2025MathGradeScale.editionId) {
    return {
      gradeScaleId: OFFICIAL_2025_MATH_GRADE_SCALE_ID,
      mathematicsGrade: official2025MathematicsGrade(points),
    }
  }
  return undefined
}

export function formatSwissGrade(grade: number): string {
  if (!Number.isFinite(grade)) return "–"
  return new Intl.NumberFormat("de-CH", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(grade)
}
