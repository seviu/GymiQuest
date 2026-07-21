export interface NetCell {
  x: number
  y: number
}

type Vector3 = [number, number, number]

export interface FaceOrientation {
  right: Vector3
  down: Vector3
  normal: Vector3
}

const gridDirections = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
] as const

function cellKey(cell: NetCell): string {
  return `${cell.x},${cell.y}`
}

function vectorKey(vector: Vector3): string {
  return vector.join(",")
}

function negate(vector: Vector3): Vector3 {
  return [-vector[0], -vector[1], -vector[2]]
}

function sameVector(left: Vector3, right: Vector3): boolean {
  return left.every((value, index) => value === right[index])
}

function sameOrientation(left: FaceOrientation, right: FaceOrientation): boolean {
  return (
    sameVector(left.right, right.right) &&
    sameVector(left.down, right.down) &&
    sameVector(left.normal, right.normal)
  )
}

export function normalizeNet(cells: readonly NetCell[]): NetCell[] {
  const minimumX = Math.min(...cells.map((cell) => cell.x))
  const minimumY = Math.min(...cells.map((cell) => cell.y))
  return cells
    .map((cell) => ({ x: cell.x - minimumX, y: cell.y - minimumY }))
    .sort((left, right) => left.y - right.y || left.x - right.x)
}

function netTransforms(cells: readonly NetCell[]): NetCell[][] {
  return [
    cells.map(({ x, y }) => ({ x, y })),
    cells.map(({ x, y }) => ({ x, y: -y })),
    cells.map(({ x, y }) => ({ x: -x, y })),
    cells.map(({ x, y }) => ({ x: -x, y: -y })),
    cells.map(({ x, y }) => ({ x: y, y: x })),
    cells.map(({ x, y }) => ({ x: y, y: -x })),
    cells.map(({ x, y }) => ({ x: -y, y: x })),
    cells.map(({ x, y }) => ({ x: -y, y: -x })),
  ]
}

function normalizedKey(cells: readonly NetCell[]): string {
  return normalizeNet(cells).map(cellKey).join(";")
}

function canonicalNetKey(cells: readonly NetCell[]): string {
  return netTransforms(cells).map(normalizedKey).sort()[0]!
}

function enumerateFreeHexominoes(): NetCell[][] {
  let shapes = new Map<string, NetCell[]>([["0,0", [{ x: 0, y: 0 }]]])

  for (let size = 2; size <= 6; size += 1) {
    const nextShapes = new Map<string, NetCell[]>()

    for (const cells of shapes.values()) {
      const occupied = new Set(cells.map(cellKey))
      for (const cell of cells) {
        for (const direction of gridDirections) {
          const neighbor = { x: cell.x + direction.x, y: cell.y + direction.y }
          if (occupied.has(cellKey(neighbor))) continue
          const expanded = [...cells, neighbor]
          const canonical = canonicalNetKey(expanded)
          if (!nextShapes.has(canonical)) nextShapes.set(canonical, normalizeNet(expanded))
        }
      }
    }

    shapes = nextShapes
  }

  return [...shapes.values()]
}

function foldedNeighbor(
  orientation: FaceOrientation,
  direction: (typeof gridDirections)[number],
): FaceOrientation {
  if (direction.x === 1) {
    return {
      right: negate(orientation.normal),
      down: orientation.down,
      normal: orientation.right,
    }
  }
  if (direction.x === -1) {
    return {
      right: orientation.normal,
      down: orientation.down,
      normal: negate(orientation.right),
    }
  }
  if (direction.y === 1) {
    return {
      right: orientation.right,
      down: negate(orientation.normal),
      normal: orientation.down,
    }
  }
  return {
    right: orientation.right,
    down: orientation.normal,
    normal: negate(orientation.down),
  }
}

/**
 * Folds a connected six-cell polyomino into cube-space. A valid cube net must
 * place exactly one face on each of the six axis-aligned cube normals.
 */
export function foldCubeNet(
  cells: readonly NetCell[],
): Map<string, FaceOrientation> | undefined {
  if (cells.length !== 6 || new Set(cells.map(cellKey)).size !== 6) return undefined

  const occupied = new Set(cells.map(cellKey))
  const first = cells[0]!
  const orientations = new Map<string, FaceOrientation>([[
    cellKey(first),
    { right: [1, 0, 0], down: [0, 1, 0], normal: [0, 0, 1] },
  ]])
  const queue = [first]

  while (queue.length > 0) {
    const cell = queue.shift()!
    const orientation = orientations.get(cellKey(cell))!

    for (const direction of gridDirections) {
      const neighbor = { x: cell.x + direction.x, y: cell.y + direction.y }
      const neighborKey = cellKey(neighbor)
      if (!occupied.has(neighborKey)) continue

      const folded = foldedNeighbor(orientation, direction)
      const existing = orientations.get(neighborKey)
      if (existing && !sameOrientation(existing, folded)) return undefined
      if (!existing) {
        orientations.set(neighborKey, folded)
        queue.push(neighbor)
      }
    }
  }

  if (orientations.size !== 6) return undefined
  const normals = new Set([...orientations.values()].map(({ normal }) => vectorKey(normal)))
  return normals.size === 6 ? orientations : undefined
}

const freeHexominoes = enumerateFreeHexominoes()
const validCubeNets = freeHexominoes.filter((cells) => foldCubeNet(cells) !== undefined)

export function cubeNetCandidates(): readonly NetCell[][] {
  return validCubeNets
}

export function cubeNetDiagnostics(): {
  freeHexominoes: number
  validCubeNets: number
} {
  return {
    freeHexominoes: freeHexominoes.length,
    validCubeNets: validCubeNets.length,
  }
}

export function transformCubeNet(cells: readonly NetCell[], transformIndex: number): NetCell[] {
  const transforms = netTransforms(cells)
  return normalizeNet(transforms[((transformIndex % transforms.length) + transforms.length) % transforms.length]!)
}

export function oppositeFaceIndex(cells: readonly NetCell[], targetIndex: number): number {
  const orientations = foldCubeNet(cells)
  if (!orientations) throw new Error("Cannot find an opposite face in an invalid cube net.")
  const target = cells[targetIndex]
  if (!target) throw new Error("Target face is outside the cube net.")
  const targetNormal = orientations.get(cellKey(target))!.normal
  const oppositeNormal = negate(targetNormal)
  const opposite = cells.findIndex((cell) =>
    sameVector(orientations.get(cellKey(cell))!.normal, oppositeNormal)
  )
  if (opposite < 0) throw new Error("A valid cube net must contain an opposite face.")
  return opposite
}
