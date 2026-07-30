<script setup lang="ts">
import { computed } from 'vue'
import { PhArrowRight, PhCalendarDots, PhFlowerLotus, PhHouseLine, PhPlay, PhSparkle, PhTree } from '@phosphor-icons/vue'
import { garden, getDailyChallenge } from '../composables/useGarden'
import { getBloomFlower, getBloomStage, publicAsset } from '../data'

defineEmits<{ start: []; garden: [] }>()

const heroImage = publicAsset('assets/scenes/home-art-garden-v4.webp')
const bloomStage = computed(() => getBloomStage(garden.currentLevel))
const bloomFlower = computed(() => getBloomFlower(garden.currentLevel))
const dailyChallenge = computed(() => getDailyChallenge(garden))
const gardenHint = computed(() => garden.pendingCare
  ? `有 ${garden.pendingCare} 次照顾正在等你`
  : '完成一局，带回阳光和水滴')
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})
</script>

<template>
  <section class="home-view page-wrap" aria-labelledby="welcome-title">
    <div class="home-art-hero">
      <img :src="heroImage" alt="粉色晨光中的玉兰花与花朵伙伴" />
      <div class="welcome-copy">
        <p class="day-note"><PhSparkle weight="fill" />{{ greeting }}，花园一直在等你</p>
        <h2 id="welcome-title">今天，也来<br /><em>种一朵花</em>吧</h2>
        <p>完成一件小院任务，带回阳光、水滴和成长故事。</p>
      </div>
      <div class="companion-speech">
        <PhFlowerLotus weight="fill" />
        <p><small>花朵伙伴</small><strong>欢迎来到陪伴花园</strong></p>
      </div>
    </div>

    <button class="primary-action home-start" @click="$emit('start')">
      <span><PhPlay weight="fill" /></span>
      <div><small>继续第 {{ garden.currentLevel }} 关</small><strong>开始今天</strong></div>
      <PhArrowRight />
    </button>

    <section class="daily-mission-card" aria-labelledby="daily-mission-title">
      <span class="daily-mission-icon"><PhTree weight="fill" /></span>
      <div>
        <small>今日轻任务 · 不着急</small>
        <h3 id="daily-mission-title">完成 2 件小院任务</h3>
        <p>{{ dailyChallenge.rewarded ? '今天的纪念物已经收好，明天再来看看。' : '每完成一关，就向前走一步。' }}</p>
      </div>
      <strong>{{ dailyChallenge.progress }}/{{ dailyChallenge.target }}</strong>
      <div class="daily-progress" role="progressbar" :aria-valuenow="dailyChallenge.progress" aria-valuemin="0" :aria-valuemax="dailyChallenge.target">
        <i :style="{ width: `${dailyChallenge.progress / dailyChallenge.target * 100}%` }"></i>
      </div>
    </section>

    <div class="home-bloom-card">
      <span class="home-bloom-art"><img :src="bloomFlower" :alt="`陪伴花第 ${bloomStage} 阶段`" /></span>
      <div>
        <small>我的陪伴花 · 第 {{ bloomStage }} 阶段</small>
        <strong>{{ bloomStage === 5 ? '已经温柔盛开' : '每过几关，就会再开一点' }}</strong>
        <p>现在来到第 {{ garden.currentLevel }} 关</p>
      </div>
      <PhArrowRight />
    </div>

    <button class="secondary-action garden-entry" @click="$emit('garden')">
      <span class="round-icon"><PhHouseLine weight="fill" /></span>
      <span><strong>看看花园</strong><small>{{ gardenHint }}</small></span>
      <PhArrowRight />
    </button>

    <div class="home-companion-note">
      <PhCalendarDots weight="duotone" />
      <p><strong>连续相伴 {{ garden.streakDays }} 天</strong><span>不需要赶时间，每天一点点就很好。</span></p>
    </div>
  </section>
</template>
