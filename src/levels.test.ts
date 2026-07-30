import { describe, expect, it } from 'vitest'
import { LEVELS, getLevelConfig } from './levels'

describe('V0.4 level configuration', () => {
  it('provides 30 independently tunable levels', () => {
    expect(LEVELS).toHaveLength(30)
    expect(getLevelConfig(10).goals).toEqual({ peach: 30, leaf: 30, berry: 22 })
  })

  it('keeps every V0.3 board free of unexplained immovable tiles', () => {
    expect(LEVELS.every((level) => level.obstacles.length === 0 && level.covers.length === 0)).toBe(true)
  })

  it('gives every level one understandable garden mission', () => {
    expect(LEVELS.every((level) => level.mission.label && level.mission.description && level.mission.target > 0)).toBe(true)
    expect(getLevelConfig(2).mission).toMatchObject({ kind: 'bud', target: 2 })
    expect(getLevelConfig(4).mission).toMatchObject({ kind: 'vine', target: 2, hits: 2 })
    expect(getLevelConfig(10).mission).toMatchObject({ kind: 'seed', target: 3 })
  })
})
