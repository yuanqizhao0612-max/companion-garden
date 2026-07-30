<script setup lang="ts">
import { computed } from 'vue'
import { PhArrowRight, PhCalendarDots, PhFlowerLotus, PhHouseLine, PhPlay, PhSparkle } from '@phosphor-icons/vue'
import { garden } from '../composables/useGarden'
import { getBloomFlower, getBloomStage, publicAsset } from '../data'

defineEmits<{ start: []; garden: [] }>()

const heroImage = publicAsset('assets/scenes/home-art-garden-v4.webp')
const bloomStage = computed(() => getBloomStage(garden.currentLevel))
const bloomFlower = computed(() => getBloomFlower(garden.currentLevel))
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
        <p>完成一局，带回阳光和水滴，亲手照顾小院。</p>
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
