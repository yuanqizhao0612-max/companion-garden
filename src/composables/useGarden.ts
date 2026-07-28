import { reactive, watch } from 'vue'
import type { GardenState } from '../types'

export const STORAGE_KEY = 'companion-garden-v02'
const V01_STORAGE_KEY = 'companion-garden-v01'
const LEGACY_STORAGE_KEY = 'companion-garden-v1'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const DEFAULT_GARDEN_STATE: GardenState = {
  currentLevel: 1,
  highestLevel: 0,
  completedRounds: 0,
  attemptedRounds: 0,
  flowerCount: 2,
  streakDays: 0,
  lastPlayedDate: null,
  gardenLevel: 1,
  houseStage: 1,
  treeStages: { memoryTree: 1, familyTree: 1 },
  flowerItems: [
    { id: 'welcome-peach', type: 'peach', earnedAt: '初见' },
    { id: 'welcome-daisy', type: 'daisy', earnedAt: '初见' },
  ],
  pathStage: 1,
  playerAvatar: { styleId: 'coral', position: 'door' },
  familyMembers: [],
}

const dateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const safeStorage = (): StorageLike | undefined => {
  try {
    return localStorage
  } catch {
    return undefined
  }
}

export function normalizeGardenState(value: Partial<GardenState> & Record<string, unknown> = {}): GardenState {
  return {
    currentLevel: Number(value.currentLevel ?? value.level ?? 1),
    highestLevel: Number(value.highestLevel ?? Math.max(0, Number(value.level ?? 1) - 1)),
    completedRounds: Number(value.completedRounds ?? value.completed ?? 0),
    attemptedRounds: Number(value.attemptedRounds ?? value.completed ?? 0),
    flowerCount: Number(value.flowerCount ?? value.flowers ?? 2),
    streakDays: Number(value.streakDays ?? value.streak ?? 0),
    lastPlayedDate: (value.lastPlayedDate ?? value.lastPlayed ?? null) as string | null,
    gardenLevel: Number(value.gardenLevel ?? 1),
    houseStage: Number(value.houseStage ?? 1),
    treeStages: typeof value.treeStages === 'object' && value.treeStages
      ? value.treeStages as Record<string, number>
      : { memoryTree: 1, familyTree: 1 },
    flowerItems: Array.isArray(value.flowerItems)
      ? value.flowerItems as GardenState['flowerItems']
      : Array.from({ length: Number(value.flowerCount ?? value.flowers ?? 2) }, (_, index) => ({
          id: `legacy-${index}`,
          type: (['peach', 'daisy', 'bell'] as const)[index % 3],
          earnedAt: '既有花朵',
        })),
    pathStage: Number(value.pathStage ?? 1),
    playerAvatar: typeof value.playerAvatar === 'object' && value.playerAvatar
      ? value.playerAvatar as GardenState['playerAvatar']
      : { styleId: 'coral', position: 'door' },
    familyMembers: Array.isArray(value.familyMembers)
      ? value.familyMembers as GardenState['familyMembers']
      : [],
  }
}

export function loadGardenState(storage: StorageLike | undefined = safeStorage()): GardenState {
  if (!storage) return { ...DEFAULT_GARDEN_STATE }
  try {
    const saved = storage.getItem(STORAGE_KEY) ?? storage.getItem(V01_STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY)
    return saved ? normalizeGardenState(JSON.parse(saved)) : structuredClone(DEFAULT_GARDEN_STATE)
  } catch {
    return structuredClone(DEFAULT_GARDEN_STATE)
  }
}

export function saveGardenState(state: GardenState, storage: StorageLike | undefined = safeStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Progress remains available for this session when persistence is unavailable.
  }
}

function updateStreak(state: GardenState, now = new Date()) {
  const current = dateKey(now)
  if (state.lastPlayedDate === current) return
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  state.streakDays = state.lastPlayedDate === dateKey(yesterday) ? state.streakDays + 1 : 1
  state.lastPlayedDate = current
}

export function applySuccess(state: GardenState, completedLevel: number, now = new Date()) {
  updateStreak(state, now)
  state.attemptedRounds += 1
  state.completedRounds += 1
  state.highestLevel = Math.max(state.highestLevel, completedLevel)
  state.currentLevel = Math.max(state.currentLevel, completedLevel + 1)
  state.flowerCount += 1
  state.flowerItems = [...state.flowerItems, {
    id: `flower-${completedLevel}-${state.completedRounds}`,
    type: (['peach', 'daisy', 'bell'] as const)[state.completedRounds % 3],
    earnedAt: dateKey(now),
  }]
  state.gardenLevel = Math.min(5, 1 + Math.floor(state.completedRounds / 2))
  state.houseStage = Math.min(3, 1 + Math.floor(state.completedRounds / 4))
  state.treeStages = {
    memoryTree: Math.min(3, 1 + Math.floor(state.completedRounds / 3)),
    familyTree: Math.min(3, 1 + Math.floor(state.streakDays / 3)),
  }
  state.pathStage = Math.min(3, 1 + Math.floor(state.highestLevel / 4))
}

export function applyAttempt(state: GardenState, now = new Date()) {
  updateStreak(state, now)
  state.attemptedRounds += 1
}

export const garden = reactive<GardenState>(loadGardenState())

watch(garden, (value) => saveGardenState(value), { deep: true })

export function recordSuccess(completedLevel: number) {
  const previousHighest = garden.highestLevel
  applySuccess(garden, completedLevel)
  return garden.highestLevel > previousHighest
}

export function recordAttempt() {
  applyAttempt(garden)
}

export function resetTrialData() {
  Object.assign(garden, structuredClone(DEFAULT_GARDEN_STATE))
  try {
    safeStorage()?.removeItem(LEGACY_STORAGE_KEY)
    safeStorage()?.removeItem(STORAGE_KEY)
    safeStorage()?.removeItem(V01_STORAGE_KEY)
  } catch {
    // Resetting in-memory state is still useful when storage is unavailable.
  }
  saveGardenState(garden)
}
