import { computed, ref } from 'vue'
import { getLevelConfig, TILE_META } from '../data'
import {
  attemptSwap,
  collapseMatches,
  countClearedFeatures,
  createLevelBoard,
  expandSpecials,
  findMatchGroups,
  findAvailableMove,
  findMatches,
  hasAvailableMove,
  hitAdjacentObstacles,
  hitAdjacentFeatures,
  isTaskBlocked,
  placeCreatedSpecials,
  specialForGroup,
  type SpecialCreation,
} from '../game/core'
import { classifyMatchFeedback, type MatchFeedback } from '../game/feedback'
import type { GardenMission, Tile, TileKind } from '../types'
import { useGameAudio } from './useGameAudio'

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function useMatchGame(initialLevel: number) {
  const audio = useGameAudio()
  const level = ref(initialLevel)
  const config = ref(getLevelConfig(initialLevel))
  const board = ref<Tile[]>(createLevelBoard(config.value.obstacles, config.value.covers, Math.random, config.value.mission))
  const selected = ref<number | null>(null)
  const moves = ref(config.value.moves)
  const collected = ref<Partial<Record<TileKind, number>>>({})
  const busy = ref(false)
  const message = ref(config.value.hint)
  const feedback = ref<MatchFeedback | null>(null)
  const invalidTiles = ref<number[]>([])
  const swappingTiles = ref<number[]>([])
  const completionMessage = ref('')
  const status = ref<'playing' | 'goalReached' | 'journeyComplete'>('playing')
  const missionProgress = ref(0)
  let feedbackId = 0
  const goals = computed(() => Object.entries(config.value.goals) as Array<[TileKind, number]>)
  const mission = computed(() => config.value.mission)
  const target = computed(() => goals.value.reduce((sum, [, amount]) => sum + amount, 0) + mission.value.target)
  const collectedTotal = computed(() =>
    goals.value.reduce((sum, [kind, amount]) => sum + Math.min(amount, collected.value[kind] ?? 0), 0) +
    Math.min(mission.value.target, missionProgress.value),
  )
  const progress = computed(() => Math.min(100, Math.round((collectedTotal.value / target.value) * 100)))
  const goalReached = computed(() =>
    goals.value.every(([kind, amount]) => (collected.value[kind] ?? 0) >= amount) &&
    missionProgress.value >= mission.value.target,
  )
  const remainingGoals = computed(() => goals.value.map(([kind, amount]) => ({
    kind,
    name: TILE_META[kind].name,
    amount,
    current: Math.min(amount, collected.value[kind] ?? 0),
  })))
  const remainingMission = computed(() => ({
    ...mission.value,
    current: Math.min(mission.value.target, missionProgress.value),
    done: missionProgress.value >= mission.value.target,
  }))

  const advanceMission = (amount = 1) => {
    missionProgress.value = Math.min(mission.value.target, missionProgress.value + amount)
  }

  const activeBoardMission = (): GardenMission => {
    const remaining = Math.max(0, mission.value.target - missionProgress.value)
    return {
      ...mission.value,
      target: remaining,
      positions: mission.value.positions?.slice(0, remaining),
    }
  }

  const settle = async (initial = new Set<number>()) => {
    let chain = 0
    let forced = initial
    let matches = forced.size ? forced : findMatches(board.value)
    while (matches.size) {
      chain += 1
      const groups = findMatchGroups(board.value)
      const expanded = expandSpecials(board.value, matches)
      const creation = new Map<number, SpecialCreation>()

      if (!forced.size) {
        const horizontal = groups.filter((group) => Math.floor(group[0] / 6) === Math.floor(group[1] / 6))
        const vertical = groups.filter((group) => group[1] - group[0] === 6)
        for (const h of horizontal) for (const v of vertical) {
          const intersection = h.find((index) => v.includes(index))
          if (intersection !== undefined) {
            creation.set(intersection, { kind: board.value[intersection].kind, special: 'bouquet' })
          }
        }
        for (const group of groups) {
          const special = specialForGroup(group)
          if (special && !creation.size) {
            const index = group[Math.floor(group.length / 2)]
            creation.set(index, { kind: board.value[index].kind, special })
          }
        }
      }

      const removable = new Set([...expanded].filter((index) => !isTaskBlocked(board.value[index])))
      const matchSize = groups.length
        ? Math.max(...groups.map((group) => group.length))
        : Math.min(5, Math.max(3, removable.size))
      const feedbackDetail = classifyMatchFeedback(matchSize, chain)
      feedback.value = { id: ++feedbackId, ...feedbackDetail }

      board.value = board.value.map((tile, index) => {
        return removable.has(index) ? { ...tile, removing: true } : tile
      })

      const seedProgress = mission.value.kind === 'seed'
        ? countClearedFeatures(board.value, removable, 'seed')
        : 0
      const featureResult = hitAdjacentFeatures(board.value, removable)
      board.value = featureResult.board

      for (const index of removable) {
        const kind = board.value[index]?.kind
        if (kind && config.value.goals[kind]) collected.value[kind] = (collected.value[kind] ?? 0) + 1
      }
      board.value = hitAdjacentObstacles(board.value, removable)
      if (mission.value.kind === 'water') advanceMission()
      if (mission.value.kind === 'special') advanceMission(creation.size)
      if (mission.value.kind === 'combo' && chain >= 2) advanceMission()
      if (mission.value.kind === 'seed') advanceMission(seedProgress)
      if (mission.value.kind === 'bud' || mission.value.kind === 'vine') advanceMission(featureResult.completed)
      audio.match(chain, matchSize)

      const specialName = [...creation.values()][0]?.special
      if (featureResult.completed && mission.value.kind === 'bud') message.value = '花苞打开了，这一步照顾得真好'
      else if (featureResult.completed && mission.value.kind === 'vine') message.value = '藤蔓松开了，小路又通了一点'
      else if (seedProgress) message.value = '找到树种了，它会回到小院继续长大'
      else if (specialName === 'rainbow') message.value = '彩虹花出现了，下一步由你决定'
      else if (specialName === 'bouquet') message.value = '花束开了，会清除周围一圈'
      else if (specialName) message.value = '条纹花出现了，可以清除一整线'
      else message.value = feedbackDetail.text

      await pause(matchSize >= 5 ? 620 : matchSize === 4 ? 520 : 430)
      board.value = collapseMatches(board.value, removable)
      board.value = placeCreatedSpecials(board.value, creation)
      await pause(280)
      forced = new Set()
      matches = findMatches(board.value)
    }
    await pause(120)
    feedback.value = null
    if (!hasAvailableMove(board.value)) {
      message.value = '暂时没有合适的路，花朵重新排一排'
      await pause(300)
      board.value = createLevelBoard(config.value.obstacles, config.value.covers, Math.random, activeBoardMission())
    }
  }

  const choose = async (index: number) => {
    if (busy.value || status.value !== 'playing' || isTaskBlocked(board.value[index])) return
    if (selected.value === null) {
      selected.value = index
      audio.select()
      message.value = '再点一朵相邻的花'
      return
    }
    if (selected.value === index) {
      selected.value = null
      message.value = config.value.hint
      return
    }

    const first = selected.value
    const result = attemptSwap(board.value, first, index)
    if (!result.valid) {
      busy.value = true
      selected.value = null
      invalidTiles.value = [first, index]
      audio.invalid()
      message.value = '还差一点点，再观察一下'
      await pause(360)
      invalidTiles.value = []
      busy.value = false
      return
    }

    busy.value = true
    selected.value = null
    swappingTiles.value = [first, index]
    audio.swap()
    board.value = result.board
    moves.value -= 1
    await pause(230)
    swappingTiles.value = []
    await settle(result.activated)
    if (goalReached.value) {
      completionMessage.value = '今天又照顾好了小院 🌸'
      audio.complete()
      await pause(1250)
      status.value = 'goalReached'
    } else if (moves.value <= 0) {
      completionMessage.value = '还差一点点，换一种走法看看'
      await pause(720)
      status.value = 'journeyComplete'
    }
    busy.value = false
  }

  const reset = (nextLevel = level.value) => {
    level.value = nextLevel
    config.value = getLevelConfig(nextLevel)
    moves.value = config.value.moves
    board.value = createLevelBoard(config.value.obstacles, config.value.covers, Math.random, config.value.mission)
    selected.value = null
    collected.value = {}
    busy.value = false
    message.value = config.value.hint
    feedback.value = null
    invalidTiles.value = []
    swappingTiles.value = []
    completionMessage.value = ''
    status.value = 'playing'
    missionProgress.value = 0
  }

  const showHint = () => {
    const move = findAvailableMove(board.value)
    if (!move) return
    selected.value = move[0]
    message.value = '这朵花旁边藏着一步好棋'
  }

  const shuffle = () => {
    if (busy.value || status.value !== 'playing') return
    board.value = createLevelBoard(config.value.obstacles, config.value.covers, Math.random, activeBoardMission())
    selected.value = null
    message.value = '花朵轻轻换了位置，步数不会减少'
  }

  return {
    board, selected, level, config, moves, collected, collectedTotal, busy, message, status,
    feedback, invalidTiles, swappingTiles, completionMessage,
    progress, target, goals, remainingGoals, mission, missionProgress, remainingMission,
    choose, reset, showHint, shuffle,
  }
}
