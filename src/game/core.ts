import { TILE_KINDS } from '../data'
import type { Tile, TileKind } from '../types'

export const BOARD_SIZE = 6
let nextId = 1

export const makeTile = (kind: TileKind = TILE_KINDS[Math.floor(Math.random() * TILE_KINDS.length)]): Tile => ({
  id: nextId++,
  kind,
})

function createsImmediateMatch(board: Tile[], index: number, kind: TileKind) {
  const row = Math.floor(index / BOARD_SIZE)
  const col = index % BOARD_SIZE
  return (
    (col >= 2 && !board[index - 1]?.obstacle && !board[index - 2]?.obstacle && board[index - 1]?.kind === kind && board[index - 2]?.kind === kind) ||
    (row >= 2 && !board[index - BOARD_SIZE]?.obstacle && !board[index - BOARD_SIZE * 2]?.obstacle && board[index - BOARD_SIZE]?.kind === kind && board[index - BOARD_SIZE * 2]?.kind === kind)
  )
}

export function createBoard(random: () => number = Math.random) {
  const board: Tile[] = []
  for (let index = 0; index < BOARD_SIZE * BOARD_SIZE; index += 1) {
    const choices = TILE_KINDS.filter((kind) => !createsImmediateMatch(board, index, kind))
    board.push(makeTile(choices[Math.floor(random() * choices.length)]))
  }
  return board
}

export function findMatchGroups(board: Tile[]) {
  const groups: number[][] = []
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let start = 0
    for (let col = 1; col <= BOARD_SIZE; col += 1) {
      const same =
        col < BOARD_SIZE &&
        !board[row * BOARD_SIZE + col]?.obstacle &&
        !board[row * BOARD_SIZE + start]?.obstacle &&
        board[row * BOARD_SIZE + col]?.kind === board[row * BOARD_SIZE + start]?.kind
      if (!same) {
        if (col - start >= 3) {
          groups.push(Array.from({ length: col - start }, (_, offset) => row * BOARD_SIZE + start + offset))
        }
        start = col
      }
    }
  }
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let start = 0
    for (let row = 1; row <= BOARD_SIZE; row += 1) {
      const same =
        row < BOARD_SIZE &&
        !board[row * BOARD_SIZE + col]?.obstacle &&
        !board[start * BOARD_SIZE + col]?.obstacle &&
        board[row * BOARD_SIZE + col]?.kind === board[start * BOARD_SIZE + col]?.kind
      if (!same) {
        if (row - start >= 3) {
          groups.push(Array.from({ length: row - start }, (_, offset) => (start + offset) * BOARD_SIZE + col))
        }
        start = row
      }
    }
  }
  return groups
}

export function findMatches(board: Tile[]) {
  return new Set(findMatchGroups(board).flat())
}

export function isAdjacent(a: number, b: number) {
  const ar = Math.floor(a / BOARD_SIZE)
  const ac = a % BOARD_SIZE
  const br = Math.floor(b / BOARD_SIZE)
  const bc = b % BOARD_SIZE
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1
}

export function swapTiles(board: Tile[], a: number, b: number) {
  const copy = [...board]
  ;[copy[a], copy[b]] = [copy[b], copy[a]]
  return copy
}

export function attemptSwap(board: Tile[], a: number, b: number) {
  if (!isAdjacent(a, b) || board[a]?.obstacle || board[b]?.obstacle) return { board, valid: false, activated: new Set<number>() }
  const swapped = swapTiles(board, a, b)
  const rainbow = [a, b].find((index) => swapped[index]?.special === 'rainbow')
  if (rainbow !== undefined) {
    const other = rainbow === a ? b : a
    const targetKind = swapped[other].kind
    return {
      board: swapped,
      valid: true,
      activated: new Set(swapped.flatMap((tile, index) => !tile.obstacle && tile.kind === targetKind ? [index] : [])),
    }
  }
  return findMatches(swapped).size
    ? { board: swapped, valid: true, activated: new Set<number>() }
    : { board, valid: false, activated: new Set<number>() }
}

export function hasAvailableMove(board: Tile[]) {
  for (let index = 0; index < board.length; index += 1) {
    const neighbors = [index + 1, index + BOARD_SIZE]
    for (const neighbor of neighbors) {
      if (neighbor >= board.length || (neighbor === index + 1 && index % BOARD_SIZE === BOARD_SIZE - 1)) continue
      if (findMatches(swapTiles(board, index, neighbor)).size) return true
    }
  }
  return false
}

export function findAvailableMove(board: Tile[]) {
  for (let index = 0; index < board.length; index += 1) {
    const neighbors = [index + 1, index + BOARD_SIZE]
    for (const neighbor of neighbors) {
      if (neighbor >= board.length || (neighbor === index + 1 && index % BOARD_SIZE === BOARD_SIZE - 1)) continue
      if (!board[index]?.obstacle && !board[neighbor]?.obstacle && findMatches(swapTiles(board, index, neighbor)).size) {
        return [index, neighbor] as const
      }
    }
  }
  return undefined
}

export function createPlayableBoard(random: () => number = Math.random) {
  let board = createBoard(random)
  while (!hasAvailableMove(board)) board = createBoard(random)
  return board
}

export function reshuffleIfNeeded(board: Tile[], random: () => number = Math.random) {
  return hasAvailableMove(board) ? board : createPlayableBoard(random)
}

export function collapseMatches(
  board: Tile[],
  matches: Set<number>,
  fill: () => Tile = () => makeTile(),
) {
  const next = [...board]
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let segmentBottom = BOARD_SIZE - 1
    for (let row = BOARD_SIZE - 1; row >= -1; row -= 1) {
      const index = row * BOARD_SIZE + col
      const boundary = row === -1 || board[index]?.obstacle
      if (!boundary) continue
      const segmentTop = row + 1
      const kept: Tile[] = []
      for (let sourceRow = segmentBottom; sourceRow >= segmentTop; sourceRow -= 1) {
        const source = sourceRow * BOARD_SIZE + col
        if (!matches.has(source)) kept.push({ ...board[source], removing: false })
      }
      for (let targetRow = segmentBottom; targetRow >= segmentTop; targetRow -= 1) {
        next[targetRow * BOARD_SIZE + col] = kept.shift() ?? fill()
      }
      if (row >= 0) next[index] = { ...board[index], removing: false }
      segmentBottom = row - 1
    }
  }
  return next
}

export function createLevelBoard(obstacles: number[] = [], covers: number[] = [], random: () => number = Math.random) {
  let board = createPlayableBoard(random)
  board = board.map((tile, index) => ({
    ...tile,
    ...(obstacles.includes(index) ? { obstacle: 'stone' as const, obstacleHits: 1 } : {}),
    ...(covers.includes(index) ? { cover: 2 } : {}),
  }))
  return hasAvailableMove(board) ? board : createLevelBoard(obstacles, covers, random)
}

export function specialForGroup(group: number[]) {
  if (group.length >= 5) return 'rainbow' as const
  if (group.length === 4) {
    return Math.floor(group[0] / BOARD_SIZE) === Math.floor(group[1] / BOARD_SIZE)
      ? 'stripe-row' as const
      : 'stripe-column' as const
  }
  return undefined
}

export function expandSpecials(board: Tile[], matches: Set<number>) {
  const expanded = new Set(matches)
  for (const index of matches) {
    const tile = board[index]
    if (tile?.special === 'stripe-row') {
      const row = Math.floor(index / BOARD_SIZE)
      for (let col = 0; col < BOARD_SIZE; col += 1) expanded.add(row * BOARD_SIZE + col)
    }
    if (tile?.special === 'stripe-column') {
      const col = index % BOARD_SIZE
      for (let row = 0; row < BOARD_SIZE; row += 1) expanded.add(row * BOARD_SIZE + col)
    }
    if (tile?.special === 'bouquet') {
      const row = Math.floor(index / BOARD_SIZE)
      const col = index % BOARD_SIZE
      for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
        const r = row + dr
        const c = col + dc
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) expanded.add(r * BOARD_SIZE + c)
      }
    }
  }
  return expanded
}

export function hitAdjacentObstacles(board: Tile[], cleared: Set<number>) {
  const hit = new Set<number>()
  for (const index of cleared) {
    for (const neighbor of [index - 1, index + 1, index - BOARD_SIZE, index + BOARD_SIZE]) {
      if (neighbor >= 0 && neighbor < board.length && isAdjacent(index, neighbor) && board[neighbor]?.obstacle) hit.add(neighbor)
    }
  }
  return board.map((tile, index) => hit.has(index) ? { ...tile, obstacle: undefined, obstacleHits: undefined } : tile)
}
