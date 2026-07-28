<script setup lang="ts">
import { computed } from 'vue'
import { PhArrowRight, PhCalendarDots, PhHouseLine, PhPlay, PhSparkle } from '@phosphor-icons/vue'
import { garden } from '../composables/useGarden'
import GardenScene from './GardenScene.vue'

defineEmits<{ start: []; garden: [] }>()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})
</script>

<template>
  <section class="home-view page-wrap" aria-labelledby="welcome-title">
    <div class="welcome-copy">
      <p class="day-note"><PhSparkle weight="fill" />{{ greeting }}，花园一直在等你</p>
      <h2 id="welcome-title">今天，也来<br /><em>种一朵花</em>吧</h2>
      <p>完成一局，给家庭小院留下一点新的生机。</p>
    </div>

    <div class="home-garden-card">
      <GardenScene :state="garden" compact />
      <div class="garden-card-caption">
        <span><PhHouseLine weight="fill" /></span>
        <div><small>我的家庭小院</small><strong>已经留下 {{ garden.flowerItems.length }} 朵花</strong></div>
        <button aria-label="看看花园" @click="$emit('garden')"><PhArrowRight /></button>
      </div>
    </div>

    <button class="primary-action home-start" @click="$emit('start')">
      <span><PhPlay weight="fill" /></span>
      <div><small>继续第 {{ garden.currentLevel }} 关</small><strong>开始今天</strong></div>
      <PhArrowRight />
    </button>

    <button class="secondary-action garden-entry" @click="$emit('garden')">
      <span class="round-icon"><PhHouseLine weight="fill" /></span>
      <span><strong>看看花园</strong><small>房屋、树木和小路正在慢慢长大</small></span>
      <PhArrowRight />
    </button>

    <div class="home-companion-note">
      <PhCalendarDots weight="duotone" />
      <p><strong>连续相伴 {{ garden.streakDays }} 天</strong><span>不需要赶时间，每天一点点就很好。</span></p>
    </div>
  </section>
</template>
