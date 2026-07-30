<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  PhArrowRight, PhArrowUUpLeft, PhArrowsOutLineHorizontal, PhArrowsOutLineVertical,
  PhDrop, PhFlowerLotus, PhHouseLine, PhLightbulb, PhPersonSimpleWalk, PhPlant,
  PhShuffleAngular, PhSparkle, PhStar, PhTarget, PhTree,
} from '@phosphor-icons/vue'
import { getBloomFlower, getBloomStage, publicAsset, TILE_META, WARM_WORDS } from '../data'
import { garden, getDailyChallenge, recordAttempt, recordSuccess } from '../composables/useGarden'
import { useMatchGame } from '../composables/useMatchGame'
import type { Tile } from '../types'

const emit = defineEmits<{ home: []; garden: [] }>()
const playedLevel = ref(garden.currentLevel)
const game = useMatchGame(playedLevel.value)
const resultRecorded = ref(false)
const newHighest = ref(false)
const warmWord = ref(WARM_WORDS[Math.floor(Math.random() * WARM_WORDS.length)])
const goalLeft = computed(() => game.remainingGoals.value.reduce((sum, goal) => sum + Math.max(0, goal.amount - goal.current), 0))
const isDevPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')
const successFlower = computed(() => getBloomFlower(playedLevel.value))
const successBloomStage = computed(() => getBloomStage(playedLevel.value))
const retryFlower = TILE_META.berry.image
const bloomSpirit = publicAsset('assets/effects/bloom-spirit-v3.png')
const dailyChallenge = computed(() => getDailyChallenge(garden))
const specialMeta: Record<NonNullable<Tile['special']>, { name: string; icon: typeof PhSparkle }> = {
  'stripe-row': { name: '横向柔光花', icon: PhArrowsOutLineHorizontal },
  'stripe-column': { name: '纵向柔光花', icon: PhArrowsOutLineVertical },
  rainbow: { name: '彩虹花', icon: PhSparkle },
  bouquet: { name: '花束花', icon: PhFlowerLotus },
}
const missionMeta = {
  water: { icon: PhDrop, tone: 'blue' },
  bud: { icon: PhFlowerLotus, tone: 'pink' },
  vine: { icon: PhPlant, tone: 'green' },
  seed: { icon: PhTree, tone: 'earth' },
  special: { icon: PhSparkle, tone: 'gold' },
  combo: { icon: PhArrowsOutLineHorizontal, tone: 'purple' },
} as const
const taskFeatureMeta: Record<NonNullable<Tile['feature']>, { name: string; icon: typeof PhSparkle }> = {
  bud: { name: '等待开放的花苞', icon: PhFlowerLotus },
  vine: { name: '需要逐步松开的藤蔓', icon: PhPlant },
  seed: { name: '藏着树种的花', icon: PhTree },
}

watch(game.status, (status) => {
  if (status === 'playing' || resultRecorded.value) return
  newHighest.value = status === 'goalReached'
    ? recordSuccess(playedLevel.value, { treeSeeds: game.mission.value.kind === 'seed' ? 1 : 0 })
    : false
  if (status === 'journeyComplete') recordAttempt()
  resultRecorded.value = true
})

function startLevel(level: number) {
  playedLevel.value = level
  resultRecorded.value = false
  newHighest.value = false
  warmWord.value = WARM_WORDS[Math.floor(Math.random() * WARM_WORDS.length)]
  game.reset(level)
}

function previewWin() {
  game.remainingGoals.value.forEach(({ kind, amount }) => { game.collected.value[kind] = amount })
  game.missionProgress.value = game.mission.value.target
  game.status.value = 'goalReached'
}

function previewLoss() {
  game.moves.value = 0
  game.status.value = 'journeyComplete'
}

function previewSpecials() {
  game.board.value = game.board.value.map((tile, index) => {
    if (index === 14) return { ...tile, special: 'stripe-row' }
    if (index === 15) return { ...tile, special: 'stripe-column' }
    return tile
  })
  game.message.value = '特别花用方向图标提示效果，不再遮住花朵'
}

function tileAriaLabel(tile: Tile, index: number) {
  const position = `第 ${Math.floor(index / 6) + 1} 行第 ${(index % 6) + 1} 列`
  if (tile.obstacle) return `石块，${position}`
  const details = [
    TILE_META[tile.kind].name,
    tile.feature ? taskFeatureMeta[tile.feature].name : '',
    tile.special ? specialMeta[tile.special].name : '',
  ].filter(Boolean).join('，')
  return `${details}，${position}`
}
</script>

<template>
  <section class="game-view page-wrap" aria-labelledby="game-heading">
    <h2 id="game-heading" class="visually-hidden">第 {{ game.level.value }} 关花朵棋盘</h2>

    <div class="game-status-bar">
      <div><PhTarget weight="duotone" /><span>第 <strong>{{ game.level.value }}</strong> 关</span></div>
      <i></i>
      <div><PhPersonSimpleWalk weight="fill" /><span>剩余步数 <strong class="accent">{{ game.moves.value }}</strong></span></div>
      <i></i>
      <div><PhFlowerLotus weight="fill" /><span>任务 <strong class="accent">1</strong></span></div>
    </div>

    <section class="mission-card" :class="`mission-${missionMeta[game.mission.value.kind].tone}`" aria-labelledby="mission-title">
      <span class="mission-icon"><component :is="missionMeta[game.mission.value.kind].icon" weight="fill" /></span>
      <div>
        <small>今天帮小院完成</small>
        <h3 id="mission-title">{{ game.config.value.title }}</h3>
        <p>{{ game.config.value.description }}</p>
      </div>
      <span class="mission-count" :class="{ done: game.remainingMission.value.done }">
        {{ game.remainingMission.value.current }}/{{ game.remainingMission.value.target }}
      </span>
      <strong class="mission-label">{{ game.mission.value.label }} · {{ game.mission.value.description }}</strong>
    </section>

    <div class="goal-list" aria-label="本关收集目标">
      <div v-for="goal in game.remainingGoals.value" :key="goal.kind" class="goal-chip" :class="{ done: goal.current >= goal.amount }">
        <img :src="TILE_META[goal.kind].image" alt="" />
        <span><small>{{ goal.name }}</small><strong>{{ goal.current }}/{{ goal.amount }}</strong></span>
      </div>
    </div>

    <div class="progress-track" role="progressbar" :aria-valuenow="game.collectedTotal.value" aria-valuemin="0" :aria-valuemax="game.target.value">
      <div class="progress-fill" :style="{ width: `${game.progress.value}%` }"></div>
      <span>{{ game.remainingMission.value.done ? (goalLeft ? `花园任务完成，还差 ${goalLeft} 朵花` : '今天的小院任务完成啦') : `${game.mission.value.label} ${game.remainingMission.value.current}/${game.remainingMission.value.target}` }}</span>
    </div>

    <p class="game-message" aria-live="polite">{{ game.message.value }}</p>

    <div
      class="game-board-shell"
      :class="{
        completing: Boolean(game.completionMessage.value),
        'five-glow': game.feedback.value?.tier === 'five',
      }"
    >
      <Transition name="feedback-pop">
        <div
          v-if="game.feedback.value"
          :key="game.feedback.value.id"
          class="match-feedback"
          :class="`feedback-${game.feedback.value.tier}`"
          role="status"
        >
          <img class="feedback-spirit" :src="bloomSpirit" alt="" />
          <span>{{ game.feedback.value.text }}</span>
        </div>
      </Transition>

      <Transition name="completion">
        <div v-if="game.completionMessage.value" class="completion-message" role="status">
          <img :src="successFlower" alt="" />
          <span>小院今日札记</span>
          <strong>{{ game.completionMessage.value }}</strong>
        </div>
      </Transition>

      <div class="game-board" :class="{ busy: game.busy.value }" aria-label="六乘六花朵棋盘">
        <button
          v-for="(tile, index) in game.board.value"
          :key="tile.id"
          class="tile"
          :class="[
            `tile-${tile.kind}`, tile.special ? `special-${tile.special}` : '', tile.feature ? `task-${tile.feature}` : '',
            {
              selected: game.selected.value === index,
              removing: tile.removing,
              obstacle: tile.obstacle,
              'blocked-task': tile.feature === 'bud' || tile.feature === 'vine',
              invalid: game.invalidTiles.value.includes(index),
              swapping: game.swappingTiles.value.includes(index),
            }
          ]"
          :data-kind="tile.kind"
          :aria-label="tileAriaLabel(tile, index)"
          :aria-disabled="tile.obstacle || tile.feature === 'bud' || tile.feature === 'vine'"
          @click="game.choose(index)"
        >
          <span v-if="tile.obstacle" class="stone-piece" aria-hidden="true"></span>
          <img v-else :src="TILE_META[tile.kind].image" alt="" draggable="false" />
          <span v-if="tile.special" class="special-badge" aria-hidden="true">
            <component :is="specialMeta[tile.special].icon" weight="bold" />
          </span>
          <span v-if="tile.feature" class="task-marker" :class="`task-marker-${tile.feature}`" aria-hidden="true">
            <component :is="taskFeatureMeta[tile.feature].icon" weight="fill" />
            <small v-if="tile.feature === 'vine'">{{ tile.featureHits }}</small>
          </span>
        </button>
      </div>
    </div>

    <div class="game-actions">
      <button class="hint-action" @click="game.showHint"><PhLightbulb weight="duotone" /><span>提示</span></button>
      <button class="shuffle-action" @click="game.shuffle"><PhShuffleAngular weight="bold" /><span>重排</span></button>
      <button class="back-action" @click="emit('home')"><PhArrowUUpLeft weight="bold" /><span>返回</span></button>
    </div>

    <div v-if="isDevPreview" class="dev-level">
      <label>开发关卡
        <select :value="game.level.value" @change="startLevel(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="n in 30" :key="n" :value="n">第 {{ n }} 关</option>
        </select>
      </label>
      <button type="button" @click="previewSpecials">特别花预览</button>
      <button type="button" @click="previewWin">通关预览</button>
      <button type="button" @click="previewLoss">未通关预览</button>
    </div>

    <div v-if="game.status.value !== 'playing'" class="modal-backdrop">
      <section class="result-card" role="dialog" aria-modal="true" :aria-labelledby="game.status.value === 'goalReached' ? 'win-title' : 'complete-title'">
        <img class="result-flower" :src="game.status.value === 'goalReached' ? successFlower : retryFlower" alt="" />
        <template v-if="game.status.value === 'goalReached'">
          <p class="result-kicker">陪伴花 · 第 {{ successBloomStage }} 阶段</p>
          <h2 id="win-title">花瓣又打开了一点</h2>
          <p>{{ warmWord }}，第 {{ playedLevel }} 关的心意已经留下。</p>
          <p class="result-mission-done"><PhFlowerLotus weight="fill" />完成：{{ game.mission.value.label }}</p>
          <div class="result-resources" :class="{ 'has-seed': game.mission.value.kind === 'seed' }" aria-label="本关获得的成长资源">
            <span><PhStar weight="fill" /><b>+30</b><small>阳光</small></span>
            <span><PhDrop weight="fill" /><b>+1</b><small>水滴</small></span>
            <span v-if="game.mission.value.kind === 'seed'"><PhTree weight="fill" /><b>+1</b><small>树种</small></span>
          </div>
          <p class="result-resource-note">带回花园，亲手照顾正在长大的植物。</p>
          <p class="result-daily-note">今日轻任务 {{ dailyChallenge.progress }}/{{ dailyChallenge.target }} · {{ dailyChallenge.rewarded ? '纪念物已经收好' : '慢慢来就很好' }}</p>
          <span v-if="newHighest" class="new-record"><PhStar weight="fill" />新的最高纪录</span>
          <button class="primary-action compact" @click="startLevel(garden.currentLevel)">下一关<PhArrowRight /></button>
          <button class="secondary-result" @click="emit('garden')"><PhHouseLine weight="fill" />看看花园</button>
        </template>
        <template v-else>
          <p class="result-kicker">今天的小院还在等你</p>
          <h2 id="complete-title">还差一点点</h2>
          <p>还差 {{ goalLeft }} 朵花，换一种走法看看。</p>
          <button class="primary-action compact" @click="startLevel(playedLevel)">再试一次<PhArrowRight /></button>
        </template>
        <button class="text-button" @click="emit('home')">回到首页</button>
      </section>
    </div>
  </section>
</template>
