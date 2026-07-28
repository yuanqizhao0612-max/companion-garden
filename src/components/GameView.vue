<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  PhArrowRight, PhArrowUUpLeft, PhFlowerTulip, PhHouseLine, PhLightbulb,
  PhPersonSimpleWalk, PhShuffleAngular, PhStar, PhTarget,
} from '@phosphor-icons/vue'
import { TILE_META, WARM_WORDS } from '../data'
import { garden, recordAttempt, recordSuccess } from '../composables/useGarden'
import { useMatchGame } from '../composables/useMatchGame'

const emit = defineEmits<{ home: []; garden: [] }>()
const playedLevel = ref(garden.currentLevel)
const game = useMatchGame(playedLevel.value)
const resultRecorded = ref(false)
const newHighest = ref(false)
const warmWord = ref(WARM_WORDS[Math.floor(Math.random() * WARM_WORDS.length)])
const goalLeft = computed(() => Math.max(0, game.target.value - game.collectedTotal.value))
const isDevPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')

watch(game.status, (status) => {
  if (status === 'playing' || resultRecorded.value) return
  newHighest.value = status === 'goalReached' ? recordSuccess(playedLevel.value) : false
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
  game.status.value = 'goalReached'
}

function previewLoss() {
  game.moves.value = 0
  game.status.value = 'journeyComplete'
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
      <div><PhStar weight="fill" /><span>目标 <strong class="accent">{{ game.target.value }}</strong></span></div>
    </div>

    <div class="goal-list" aria-label="本关收集目标">
      <div v-for="goal in game.remainingGoals.value" :key="goal.kind" class="goal-chip" :class="{ done: goal.current >= goal.amount }">
        <img :src="TILE_META[goal.kind].image" alt="" />
        <span><small>{{ goal.name }}</small><strong>{{ goal.current }}/{{ goal.amount }}</strong></span>
      </div>
    </div>

    <div class="progress-track" role="progressbar" :aria-valuenow="game.collectedTotal.value" aria-valuemin="0" :aria-valuemax="game.target.value">
      <div class="progress-fill" :style="{ width: `${game.progress.value}%` }"></div>
      <span>{{ goalLeft ? `还差 ${goalLeft} 朵` : '完成啦' }}</span>
    </div>

    <p class="game-message" aria-live="polite">{{ game.message.value }}</p>

    <div class="game-board-shell">
      <div class="game-board" :class="{ busy: game.busy.value }" aria-label="六乘六花朵棋盘">
        <button
          v-for="(tile, index) in game.board.value"
          :key="tile.id"
          class="tile"
          :class="[
            `tile-${tile.kind}`, tile.special ? `special-${tile.special}` : '',
            { selected: game.selected.value === index, removing: tile.removing, obstacle: tile.obstacle, covered: tile.cover }
          ]"
          :aria-label="tile.obstacle ? `石块，第 ${Math.floor(index / 6) + 1} 行第 ${(index % 6) + 1} 列` : `${TILE_META[tile.kind].name}，第 ${Math.floor(index / 6) + 1} 行第 ${(index % 6) + 1} 列`"
          @click="game.choose(index)"
        >
          <span v-if="tile.obstacle" class="stone-piece" aria-hidden="true"><PhFlowerTulip weight="fill" /></span>
          <img v-else :src="TILE_META[tile.kind].image" alt="" draggable="false" />
          <i v-if="tile.special" class="special-mark" aria-hidden="true"></i>
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
      <button type="button" @click="previewWin">通关预览</button>
      <button type="button" @click="previewLoss">未通关预览</button>
    </div>

    <div v-if="game.status.value !== 'playing'" class="modal-backdrop">
      <section class="result-card" role="dialog" aria-modal="true" :aria-labelledby="game.status.value === 'goalReached' ? 'win-title' : 'complete-title'">
        <img class="result-flower" :src="game.status.value === 'goalReached' ? '/assets/flowers/cherry.png' : '/assets/flowers/daisy.png'" alt="" />
        <template v-if="game.status.value === 'goalReached'">
          <p class="result-kicker">花园里又添了一朵新花</p>
          <h2 id="win-title">完成第 {{ playedLevel }} 关</h2>
          <p>{{ warmWord }}</p>
          <span v-if="newHighest" class="new-record"><PhStar weight="fill" />新的最高纪录</span>
          <button class="primary-action compact" @click="startLevel(garden.currentLevel)">下一关<PhArrowRight /></button>
          <button class="secondary-result" @click="emit('garden')"><PhHouseLine weight="fill" />看看花园</button>
        </template>
        <template v-else>
          <p class="result-kicker">这一局走完了</p>
          <h2 id="complete-title">还差 {{ goalLeft }} 朵花</h2>
          <p>换一种走法，再试一次。</p>
          <button class="primary-action compact" @click="startLevel(playedLevel)">再试一次<PhArrowRight /></button>
        </template>
        <button class="text-button" @click="emit('home')">回到首页</button>
      </section>
    </div>
  </section>
</template>
