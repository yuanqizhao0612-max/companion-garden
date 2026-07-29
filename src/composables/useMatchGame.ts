import { computed, ref } from 'vue'
import { getLevelConfig, TILE_META } from '../data'
import {
  attemptSwap,
  collapseMatches,
  createLevelBoard,
  expandSpecials,
  findMatchGroups,
  findAvailableMove,
  findMatches,
  hasAvailableMove,
  hitAdjacentObstacles,
  specialForGroup,
} from '../game/core'
import { classifyMatchFeedback, type MatchFeedback } from '../game/feedback'
import type { Tile, TileKind } from '../types'
import { useGameAudio } from './useGameAudio'

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function useMatchGame(initialLevel: number) {
  const audio = useGameAudio()
  const level = ref(initialLevel)
  const config = ref(getLevelConfig(initialLevel))
  const board = ref<Tile[]>(createLevelBoard(config.value.obstacles, config.value.covers))
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
  let feedbackId = 0
  const goals = computed(() => Object.entries(config.value.goals) as Array<[TileKind, number]>)
  const target = computed(() => goals.value.reduce((sum, [, amount]) => sum + amount, 0))
  const collectedTotal = computed(() => goals.value.reduce((sum, [kind, amount]) => sum + Math.min(amount, collected.value[kind] ?? 0), 0))
  const progress = computed(() => Math.min(100, Math.round((collectedTotal.value / target.value) * 100)))
  const goalReached = computed(() => goals.value.every(([kind, amount]) => (collected.value[kind] ?? 0) >= amount))
  const remainingGoals = computed(() => goals.value.map(([kind, amount]) => ({
    kind,
    name: TILE_META[kind].name,
    amount,
    current: Math.min(amount, collected.value[kind] ?? 0),
  })))

  const settle = async (initial = new Set<number>()) => {
    let chain = 0
    let forced = initial
    let matches = forced.size ? forced : findMatches(board.value)
    while (matches.size) {
      chain += 1
      const groups = findMatchGroups(board.value)
      let expanded = expandSpecials(board.value, matches)
      const creation = new Map<number, Tile['special']>()

      if (!forced.size) {
        const horizontal = groups.filter((group) => Math.floor(group[0] / 6) === Math.floor(group[1] / 6))
        const vertical = groups.filter((group) => group[1] - group[0] === 6)
        for (const h of horizontal) for (const v of vertical) {
          const intersection = h.find((index) => v.includes(index))
          if (intersection !== undefined) creation.set(intersection, 'bouquet')
        }
        for (const group of groups) {
          const special = specialForGroup(group)
          if (special && !creation.size) creation.set(group[Math.floor(group.length / 2)], special)
        }
      }

      for (const index of creation.keys()) expanded.delete(index)
      const covered = new Set([...expanded].filter((index) => (board.value[index]?.cover ?? 0) > 1))
      const removable = new Set([...expanded].filter((index) => !board.value[index]?.obstacle && !covered.has(index)))
      const matchSize = groups.length
        ? Math.max(...groups.map((group) => group.length))
        : Math.min(5, Math.max(3, removable.size))
      const feedbackDetail = classifyMatchFeedback(matchSize, chain)
      feedback.value = { id: ++feedbackId, ...feedbackDetail }

      board.value = board.value.map((tile, index) => {
        if (covered.has(index)) return { ...tile, cover: 1 }
        if (creation.has(index)) return { ...tile, special: creation.get(index), cover: undefined }
        return removable.has(index) ? { ...tile, removing: true } : tile
      })

      for (const index of removable) {
        const kind = board.value[index]?.kind
        if (kind && config.value.goals[kind]) collected.value[kind] = (collected.value[kind] ?? 0) + 1
      }
      board.value = hitAdjacentObstacles(board.value, removable)
      audio.match(chain, matchSize)

      const specialName = [...creation.values()][0]
      if (specialName === 'rainbow') message.value = '彩虹花出现了，下一步由你决定'
      else if (specialName === 'bouquet') message.value = '花束开了，会清除周围一圈'
      else if (specialName) message.value = '条纹花出现了，可以清除一整线'
      else message.value = feedbackDetail.text

      await pause(matchSize >= 5 ? 620 : matchSize === 4 ? 520 : 430)
      board.value = collapseMatches(board.value, removable)
      await pause(280)
      forced = new Set()
      matches = findMatches(board.value)
    }
    await pause(120)
    feedback.value = null
    if (!hasAvailableMove(board.value)) {
      message.value = '暂时没有合适的路，花朵重新排一排'
      await pause(300)
      board.value = createLevelBoard(config.value.obstacles, config.value.covers)
    }
  }

  const choose = async (index: number) => {
    if (busy.value || status.value !== 'playing' || board.value[index]?.obstacle) return
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
    board.value = createLevelBoard(config.value.obstacles, config.value.covers)
    selected.value = null
    collected.value = {}
    busy.value = false
    message.value = config.value.hint
    feedback.value = null
    invalidTiles.value = []
    swappingTiles.value = []
    completionMessage.value = ''
    status.value = 'playing'
  }

  const showHint = () => {
    const move = findAvailableMove(board.value)
    if (!move) return
    selected.value = move[0]
    message.value = '这朵花旁边藏着一步好棋'
  }

  const shuffle = () => {
    if (busy.value || status.value !== 'playing') return
    board.value = createLevelBoard(config.value.obstacles, config.value.covers)
    selected.value = null
    message.value = '花朵轻轻换了位置，步数不会减少'
  }

  return {
    board, selected, level, config, moves, collected, collectedTotal, busy, message, status,
    feedback, invalidTiles, swappingTiles, completionMessage,
    progress, target, goals, remainingGoals, choose, reset, showHint, shuffle,
  }
}
