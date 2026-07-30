import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GARDEN_STATE,
  applyAttempt,
  applyPlantCare,
  applySuccess,
  getDailyChallenge,
  loadGardenState,
  normalizeGardenState,
  saveGardenState,
  STORAGE_KEY,
  type StorageLike,
} from './useGarden'

function freshState() {
  return structuredClone(DEFAULT_GARDEN_STATE)
}

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('garden progress', () => {
  it('advances to the next level after success', () => {
    const state = freshState()
    applySuccess(state, 1, new Date(2026, 6, 27))
    expect(state.currentLevel).toBe(2)
    expect(state.highestLevel).toBe(1)
    expect(state.completedRounds).toBe(1)
    expect(state.sunlight).toBe(30)
    expect(state.waterDrops).toBe(1)
    expect(state.pendingCare).toBe(1)
    expect(state.dailyChallenge.progress).toBe(1)
  })

  it('does not advance after an unfinished round', () => {
    const state = freshState()
    applyAttempt(state, new Date(2026, 6, 27))
    expect(state.currentLevel).toBe(1)
    expect(state.highestLevel).toBe(0)
    expect(state.attemptedRounds).toBe(1)
    expect(state.flowerCount).toBe(0)
  })

  it('counts consecutive calendar days', () => {
    const state = freshState()
    applyAttempt(state, new Date(2026, 6, 26))
    applyAttempt(state, new Date(2026, 6, 27))
    expect(state.streakDays).toBe(2)
  })

  it('persists and restores the highest record and garden data', () => {
    const storage = memoryStorage()
    const state = freshState()
    applySuccess(state, 3, new Date(2026, 6, 27))
    saveGardenState(state, storage)
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(loadGardenState(storage)).toEqual(state)
  })

  it('turns three care moments into one lasting flower', () => {
    const state = freshState()
    for (let level = 1; level <= 3; level += 1) {
      applySuccess(state, level, new Date(2026, 6, 27))
      expect(applyPlantCare(state, new Date(2026, 6, 27))).toBe(true)
    }
    expect(state.flowerItems).toHaveLength(1)
    expect(state.flowerItems.at(-1)?.earnedAt).toBe('2026-07-27')
    expect(state.activePlantStage).toBe(3)
  })

  it('starts with an empty garden and does not add flowers directly after success', () => {
    const state = freshState()
    expect(state.flowerItems).toHaveLength(0)
    applySuccess(state, 1, new Date(2026, 6, 27))
    applySuccess(state, 2, new Date(2026, 6, 27))
    expect(state.flowerItems).toHaveLength(0)
    expect(state.flowerCount).toBe(0)
    expect(state.pendingCare).toBe(2)
  })

  it('requires earned resources before a plant can grow', () => {
    const state = freshState()
    expect(applyPlantCare(state, new Date(2026, 6, 27))).toBe(false)
    expect(state.activePlantStage).toBe(0)
    applySuccess(state, 1, new Date(2026, 6, 27))
    expect(applyPlantCare(state, new Date(2026, 6, 27))).toBe(true)
    expect(state.activePlantStage).toBe(1)
    expect(state.sunlight).toBe(10)
    expect(state.waterDrops).toBe(0)
  })

  it('grows the house, trees and path gradually', () => {
    const state = freshState()
    for (let level = 1; level <= 8; level += 1) applySuccess(state, level, new Date(2026, 6, 27))
    expect(state.houseStage).toBe(3)
    expect(state.treeStages.memoryTree).toBe(3)
    expect(state.pathStage).toBe(3)
  })

  it('keeps V0.3 saves compatible with the new V0.4 fields', () => {
    const migrated = normalizeGardenState({
      currentLevel: 7,
      highestLevel: 6,
      completedRounds: 6,
      flowerItems: [],
      sunlight: 40,
      waterDrops: 2,
      pendingCare: 1,
      activePlantStage: 2,
    })
    expect(migrated.currentLevel).toBe(7)
    expect(migrated.activePlantStage).toBe(2)
    expect(migrated.treeSeeds).toBe(0)
    expect(migrated.keepsakes).toBe(0)
    expect(migrated.dailyChallenge).toEqual({ date: null, progress: 0, target: 2, rewarded: false })
  })

  it('turns two daily completions into one gentle keepsake', () => {
    const state = freshState()
    const dayOne = new Date(2026, 6, 27)
    applySuccess(state, 1, dayOne)
    expect(getDailyChallenge(state, dayOne).progress).toBe(1)
    expect(state.keepsakes).toBe(0)
    applySuccess(state, 2, dayOne)
    expect(state.dailyChallenge.rewarded).toBe(true)
    expect(state.keepsakes).toBe(1)
    applySuccess(state, 3, dayOne)
    expect(state.keepsakes).toBe(1)
  })

  it('brings a tree seed mission reward back to the existing garden', () => {
    const state = freshState()
    applySuccess(state, 3, new Date(2026, 6, 27), { treeSeeds: 1 })
    expect(state.treeSeeds).toBe(1)
    expect(state.sunlight).toBe(30)
    expect(state.pendingCare).toBe(1)
  })
})
