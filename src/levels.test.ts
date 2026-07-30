import { describe, expect, it } from 'vitest'
import { LEVELS, getLevelConfig } from './levels'

describe('V0.2 level configuration', () => {
  it('provides 30 independently tunable levels', () => {
    expect(LEVELS).toHaveLength(30)
    expect(getLevelConfig(10).goals).toEqual({ peach: 32, leaf: 32, berry: 24 })
  })

  it('keeps every V0.3 board free of unexplained immovable tiles', () => {
    expect(LEVELS.every((level) => level.obstacles.length === 0 && level.covers.length === 0)).toBe(true)
  })
})
