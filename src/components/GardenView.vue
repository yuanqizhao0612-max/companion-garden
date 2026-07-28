<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PhArrowRight, PhFlower, PhHouseLine, PhPath, PhPlant, PhTree, PhUserCircle,
} from '@phosphor-icons/vue'
import { garden } from '../composables/useGarden'
import GardenScene from './GardenScene.vue'

defineEmits<{ play: []; home: [] }>()
const previewStage = ref<number | undefined>()
const isDevPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')
const nextGrowth = computed(() => {
  if (garden.completedRounds < 2) return `再完成 ${2 - garden.completedRounds} 局，小院会更茂盛`
  if (garden.houseStage < 3) return `再完成 ${4 - (garden.completedRounds % 4)} 局，小屋会升级`
  return '小院正在一天天留下生活的痕迹'
})

function chooseAvatar(styleId: string) {
  garden.playerAvatar = { ...garden.playerAvatar, styleId }
}
</script>

<template>
  <section class="garden-view page-wrap" aria-labelledby="garden-title">
    <div class="garden-heading">
      <p class="day-note"><PhPlant weight="fill" />每一次完成，都留在这里</p>
      <h2 id="garden-title">慢慢长大的<br /><em>家庭小院</em></h2>
    </div>

    <div class="garden-scene-card">
      <GardenScene :state="garden" :preview-stage="previewStage" />
      <div class="scene-badge"><PhPlant weight="fill" /><span>成长第 {{ garden.gardenLevel }} 阶段</span></div>
    </div>

    <div class="growth-card">
      <span><PhPlant weight="fill" /></span>
      <div><strong>今天的小院有了新变化</strong><p>{{ nextGrowth }}</p></div>
    </div>

    <div class="garden-stats">
      <div><span class="stat-icon flower"><PhFlower weight="fill" /></span><strong>{{ garden.flowerItems.length }}</strong><small>留下的花</small></div>
      <div><span class="stat-icon house"><PhHouseLine weight="fill" /></span><strong>{{ garden.houseStage }}</strong><small>小屋阶段</small></div>
      <div><span class="stat-icon tree"><PhTree weight="fill" /></span><strong>{{ garden.streakDays }}</strong><small>相伴天数</small></div>
    </div>

    <section class="avatar-picker" aria-labelledby="avatar-title">
      <div class="section-heading">
        <span><PhUserCircle weight="duotone" /></span>
        <div><small>我的数字化身</small><h3 id="avatar-title">选一个代表自己的人物</h3></div>
      </div>
      <div class="avatar-options">
        <button v-for="option in [{ id: 'coral', name: '珊瑚' }, { id: 'blue', name: '晴蓝' }, { id: 'leaf', name: '草绿' }]"
          :key="option.id" :class="{ active: garden.playerAvatar.styleId === option.id }"
          :aria-pressed="garden.playerAvatar.styleId === option.id" @click="chooseAvatar(option.id)">
          <span :class="`swatch swatch-${option.id}`"></span>{{ option.name }}
        </button>
      </div>
    </section>

    <div class="meaning-list" aria-label="花园元素的含义">
      <p><span><PhHouseLine weight="fill" /></span><b>房子代表家庭与归属</b></p>
      <p><span><PhTree weight="fill" /></span><b>树木记录陪伴的时间</b></p>
      <p><span><PhPath weight="fill" /></span><b>小路收藏每天的脚步</b></p>
    </div>

    <div v-if="isDevPreview" class="dev-preview">
      <span>成长预览</span>
      <button v-for="n in 5" :key="n" @click="previewStage = n">{{ n }}</button>
      <button @click="previewStage = undefined">实际</button>
    </div>

    <button class="primary-action garden-play" @click="$emit('play')">
      <span><PhFlower weight="fill" /></span><strong>完成一局，让小院再长一点</strong><PhArrowRight />
    </button>
    <button class="text-button" @click="$emit('home')">返回首页</button>
  </section>
</template>
