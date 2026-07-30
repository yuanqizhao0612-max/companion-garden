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
  flowerCount: 0,
  streakDays: 0,
  lastPlayedDate: null,
  gardenLevel: 1,
  houseStage: 1,
  treeStages: { memoryTree: 1, familyTree: 1 },
  flowerItems: [],
  sunlight: 0,
  waterDrops: 0,
  pendingCare: 0,
  activePlantStage: 0,
  treeSeeds: 0,
  keepsakes: 0,
  dailyChallenge: { date: null, progress: 0, target: 2, rewarded: false },
  pathStage: 1,
  playerAvatar: { styleId: 'coral', position: 'door' },
  familyMembers: [],
}

export const dateKey = (date = new Date()) => {
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
  const savedFlowerItems = Array.isArray(value.flowerItems)
    ? (value.flowerItems as GardenState['flowerItems']).filter(({ id }) => !id.startsWith('welcome-'))
    : Array.from({ length: Math.max(0, Number(value.flowerCount ?? value.flowers ?? 0) - 2) }, (_, index) => ({
        id: `legacy-${index}`,
        type: (['peach', 'daisy', 'bell'] as const)[index % 3],
        earnedAt: '既有花朵',
      }))

  return {
    currentLevel: Number(value.currentLevel ?? value.level ?? 1),
    highestLevel: Number(value.highestLevel ?? Math.max(0, Number(value.level ?? 1) - 1)),
    completedRounds: Number(value.completedRounds ?? value.completed ?? 0),
    attemptedRounds: Number(value.attemptedRounds ?? value.completed ?? 0),
    flowerCount: savedFlowerItems.length,
    streakDays: Number(value.streakDays ?? value.streak ?? 0),
    lastPlayedDate: (value.lastPlayedDate ?? value.lastPlayed ?? null) as string | null,
    gardenLevel: Number(value.gardenLevel ?? 1),
    houseStage: Number(value.houseStage ?? 1),
    treeStages: typeof value.treeStages === 'object' && value.treeStages
      ? value.treeStages as Record<string, number>
      : { memoryTree: 1, familyTree: 1 },
    flowerItems: savedFlowerItems,
    sunlight: Math.max(0, Number(value.sunlight ?? 0)),
    waterDrops: Math.max(0, Number(value.waterDrops ?? 0)),
    pendingCare: Math.max(0, Number(value.pendingCare ?? 0)),
    activePlantStage: Math.max(0, Math.min(3, Number(value.activePlantStage ?? 0))) as GardenState['activePlantStage'],
    treeSeeds: Math.max(0, Number(value.treeSeeds ?? 0)),
    keepsakes: Math.max(0, Number(value.keepsakes ?? 0)),
    dailyChallenge: typeof value.dailyChallenge === 'object' && value.dailyChallenge
      ? {
          date: (value.dailyChallenge as GardenState['dailyChallenge']).date ?? null,
          progress: Math.max(0, Number((value.dailyChallenge as GardenState['dailyChallenge']).progress ?? 0)),
          target: Math.max(1, Number((value.dailyChallenge as GardenState['dailyChallenge']).target ?? 2)),
          rewarded: Boolean((value.dailyChallenge as GardenState['dailyChallenge']).rewarded),
        }
      : { date: null, progress: 0, target: 2, rewarded: false },
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

export type GameReward = { treeSeeds?: number }

export function getDailyChallenge(state: GardenState, now = new Date()) {
  return state.dailyChallenge.date === dateKey(now)
    ? state.dailyChallenge
    : { date: dateKey(now), progress: 0, target: 2, rewarded: false }
}

export function applySuccess(state: GardenState, completedLevel: number, now = new Date(), reward: GameReward = {}) {
  updateStreak(state, now)
  state.attemptedRounds += 1
  state.completedRounds += 1
  state.highestLevel = Math.max(state.highestLevel, completedLevel)
  state.currentLevel = Math.max(state.currentLevel, completedLevel + 1)
  state.sunlight += 30
  state.waterDrops += 1
  state.pendingCare += 1
  state.treeSeeds += reward.treeSeeds ?? 0
  const daily = getDailyChallenge(state, now)
  const nextProgress = Math.min(daily.target, daily.progress + 1)
  const completedToday = nextProgress >= daily.target
  const earnedKeepsake = completedToday && !daily.rewarded
  state.dailyChallenge = {
    ...daily,
    progress: nextProgress,
    rewarded: daily.rewarded || completedToday,
  }
  if (earnedKeepsake) state.keepsakes += 1
  state.gardenLevel = Math.min(5, 1 + Math.floor(state.flowerItems.length / 2))
  state.houseStage = Math.min(3, 1 + Math.floor(state.completedRounds / 4))
  state.treeStages = {
    memoryTree: Math.max(
      state.treeStages.memoryTree ?? 1,
      Math.min(3, 1 + Math.floor(Math.max(state.completedRounds, state.treeSeeds * 2) / 3)),
    ),
    familyTree: Math.max(state.treeStages.familyTree ?? 1, Math.min(3, 1 + Math.floor(state.streakDays / 3))),
  }
  state.pathStage = Math.min(3, 1 + Math.floor(state.highestLevel / 4))
}

export function applyPlantCare(state: GardenState, now = new Date()) {
  if (state.pendingCare < 1 || state.sunlight < 20 || state.waterDrops < 1) return false

  state.pendingCare -= 1
  state.sunlight -= 20
  state.waterDrops -= 1

  if (state.activePlantStage === 3) {
    state.activePlantStage = 1
  } else {
    state.activePlantStage = (state.activePlantStage + 1) as GardenState['activePlantStage']
  }

  if (state.activePlantStage === 3) {
    state.flowerItems = [...state.flowerItems, {
      id: `flower-${state.highestLevel}-${state.completedRounds}-${state.flowerItems.length + 1}`,
      type: (['peach', 'daisy', 'leaf', 'berry', 'bell'] as const)[state.flowerItems.length % 5],
      earnedAt: dateKey(now),
    }]
    state.flowerCount = state.flowerItems.length
  }

  state.gardenLevel = Math.min(5, 1 + Math.floor((state.flowerItems.length + state.activePlantStage) / 2))
  return true
}

export function applyAttempt(state: GardenState, now = new Date()) {
  updateStreak(state, now)
  state.attemptedRounds += 1
}

export const garden = reactive<GardenState>(loadGardenState())

watch(garden, (value) => saveGardenState(value), { deep: true })

export function recordSuccess(completedLevel: number, reward: GameReward = {}) {
  const previousHighest = garden.highestLevel
  applySuccess(garden, completedLevel, new Date(), reward)
  return garden.highestLevel > previousHighest
}

export function recordAttempt() {
  applyAttempt(garden)
}

export function careForGarden() {
  return applyPlantCare(garden)
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
