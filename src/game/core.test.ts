import { describe, expect, it } from 'vitest'
import { TILE_KINDS } from '../data'
import type { Tile, TileKind } from '../types'
import {
  attemptSwap,
  collapseMatches,
  createBoard,
  createPlayableBoard,
  createLevelBoard,
  expandSpecials,
  findMatches,
  hasAvailableMove,
  hitAdjacentObstacles,
  isAdjacent,
  makeTile,
  reshuffleIfNeeded,
  specialForGroup,
} from './core'

const kinds = TILE_KINDS

function baseBoard(): Tile[] {
  return Array.from({ length: 36 }, (_, index) => makeTile(kinds[(Math.floor(index / 6) + index % 6) % kinds.length]))
}

function withKinds(changes: Record<number, TileKind>) {
  const board = baseBoard()
  Object.entries(changes).forEach(([index, kind]) => {
    board[Number(index)] = makeTile(kind)
  })
  return board
}

describe('match detection', () => {
  it('finds a horizontal three', () => {
    expect(findMatches(withKinds({ 0: 'peach', 1: 'peach', 2: 'peach' }))).toEqual(new Set([0, 1, 2]))
  })

  it('finds a vertical three', () => {
    expect(findMatches(withKinds({ 0: 'leaf', 6: 'leaf', 12: 'leaf' }))).toEqual(new Set([0, 6, 12]))
  })

  it.each([4, 5, 6])('finds a horizontal run of %i', (length) => {
    const changes = Object.fromEntries(Array.from({ length }, (_, index) => [index, 'berry'])) as Record<number, TileKind>
    expect(findMatches(withKinds(changes)).size).toBe(length)
  })

  it('does not count a diagonal as a match', () => {
    expect(findMatches(withKinds({ 0: 'bell', 7: 'bell', 14: 'bell' })).size).toBe(0)
  })
})

describe('V0.2 strategy pieces and obstacles', () => {
  it('creates a row stripe from a horizontal four', () => {
    expect(specialForGroup([6, 7, 8, 9])).toBe('stripe-row')
  })

  it('creates a column stripe from a vertical four', () => {
    expect(specialForGroup([2, 8, 14, 20])).toBe('stripe-column')
  })

  it('creates a rainbow flower from five', () => {
    expect(specialForGroup([0, 1, 2, 3, 4])).toBe('rainbow')
  })

  it('expands a bouquet to the surrounding area', () => {
    const board = baseBoard()
    board[14] = { ...board[14], special: 'bouquet' }
    expect(expandSpecials(board, new Set([14]))).toEqual(new Set([14, 7, 8, 9, 13, 15, 19, 20, 21]))
  })

  it('clears a stone after an adjacent match', () => {
    const board = baseBoard()
    board[7] = { ...board[7], obstacle: 'stone', obstacleHits: 1 }
    expect(hitAdjacentObstacles(board, new Set([6]))[7].obstacle).toBeUndefined()
  })

  it('creates configured stones and covered flowers', () => {
    const board = createLevelBoard([7], [14])
    expect(board[7].obstacle).toBe('stone')
    expect(board[14].cover).toBe(2)
    expect(hasAvailableMove(board)).toBe(true)
  })
})

describe('moves and board flow', () => {
  it('rejects non-adjacent tiles', () => {
    expect(isAdjacent(0, 2)).toBe(false)
    expect(attemptSwap(baseBoard(), 0, 2).valid).toBe(false)
  })

  it('restores an invalid adjacent swap', () => {
    const board = baseBoard()
    const result = attemptSwap(board, 0, 1)
    expect(result.valid).toBe(false)
    expect(result.board).toBe(board)
  })

  it('accepts a valid swap', () => {
    const board = withKinds({ 0: 'peach', 1: 'daisy', 2: 'peach', 7: 'peach' })
    const result = attemptSwap(board, 1, 7)
    expect(result.valid).toBe(true)
    expect(findMatches(result.board)).toEqual(new Set([0, 1, 2]))
  })

  it('can form another match after tiles fall', () => {
    const board = withKinds({ 30: 'peach', 31: 'peach', 32: 'peach' })
    const next = collapseMatches(board, new Set([30, 31, 32]), () => makeTile('daisy'))
    expect(findMatches(next)).toEqual(new Set([0, 1, 2]))
  })

  it('creates an initial board without automatic matches', () => {
    expect(findMatches(createBoard(() => 0.42)).size).toBe(0)
  })

  it('creates a board with an available move', () => {
    expect(hasAvailableMove(createPlayableBoard())).toBe(true)
  })

  it('reshuffles a board without any available move', () => {
    expect(hasAvailableMove(reshuffleIfNeeded([]))).toBe(true)
  })
})
