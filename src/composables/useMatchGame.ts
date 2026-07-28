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
import type { Tile, TileKind } from '../types'

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

export function useMatchGame(initialLevel: number) {
  const level = ref(initialLevel)
  const config = ref(getLevelConfig(initialLevel))
  const board = ref<Tile[]>(createLevelBoard(config.value.obstacles, config.value.covers))
  const selected = ref<number | null>(null)
  const moves = ref(config.value.moves)
  const collected = ref<Partial<Record<TileKind, number>>>({})
  const busy = ref(false)
  const message = ref(config.value.hint)
  const status = ref<'playing' | 'goalReached' | 'journeyComplete'>('playing')
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

      const specialName = [...creation.values()][0]
      if (specialName === 'rainbow') message.value = '彩虹花出现了，下一步由你决定'
      else if (specialName === 'bouquet') message.value = '花束开了，会清除周围一圈'
      else if (specialName) message.value = '条纹花出现了，可以清除一整线'
      else if (chain > 1) message.value = `连锁 ${chain} 次，布局真漂亮`
      else message.value = `收集了 ${removable.size} 朵花`

      await pause(260)
      board.value = collapseMatches(board.value, removable)
      await pause(220)
      forced = new Set()
      matches = findMatches(board.value)
    }
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
      selected.value = index
      message.value = '这一步没有形成组合，再观察一下'
      return
    }

    busy.value = true
    selected.value = null
    board.value = result.board
    moves.value -= 1
    await pause(160)
    await settle(result.activated)
    if (goalReached.value) status.value = 'goalReached'
    else if (moves.value <= 0) status.value = 'journeyComplete'
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
    progress, target, goals, remainingGoals, choose, reset, showHint, shuffle,
  }
}
