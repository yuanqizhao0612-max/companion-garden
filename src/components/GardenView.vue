<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  PhArrowRight, PhDrop, PhFlower, PhHouseLine, PhPath, PhPlant, PhSparkle,
  PhSun, PhTree, PhUserCircle,
} from '@phosphor-icons/vue'
import { careForGarden, garden } from '../composables/useGarden'
import { getBloomFlower, getBloomStage, publicAsset, TILE_META } from '../data'
import GardenScene from './GardenScene.vue'

defineEmits<{ play: []; home: [] }>()
const previewStage = ref<number | undefined>()
const growthAnimationKey = ref(0)
const isDevPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')
const effectiveGardenStage = computed(() => previewStage.value ?? garden.gardenLevel)
const visibleFlowerCount = computed(() => previewStage.value === undefined
  ? garden.flowerItems.length
  : [0, 3, 7, 12, 18][Math.max(0, Math.min(4, effectiveGardenStage.value - 1))])
const bloomStage = computed(() => getBloomStage(garden.currentLevel))
const bloomFlower = computed(() => getBloomFlower(garden.currentLevel))
const plantStages = [
  { name: '种子', note: '一颗种子正在小院里安静等待', asset: publicAsset('assets/growth-v03/seed-v03.png') },
  { name: '发芽', note: '嫩芽已经探出头，今天照顾得很好', asset: publicAsset('assets/growth-v03/sprout-v03.png') },
  { name: '生长', note: '花苞正在长大，再照顾一次就会开放', asset: publicAsset('assets/growth-v03/bud-v03.png') },
  { name: '开花', note: '这株花已经盛开，并留进了你的收藏', asset: publicAsset('assets/growth-v03/bloom-v03.png') },
]
const activePlant = computed(() => plantStages[garden.activePlantStage])
const canCare = computed(() => garden.pendingCare > 0 && garden.sunlight >= 20 && garden.waterDrops >= 1)
const nextGrowth = computed(() => {
  if (bloomStage.value >= 5) return '谢谢你一直陪着它，花已经完全盛开'
  const nextLevel = bloomStage.value * 6 + 1
  return `再前进 ${Math.max(1, nextLevel - garden.currentLevel)} 关，花瓣会继续展开`
})

function chooseAvatar(styleId: string) {
  garden.playerAvatar = { ...garden.playerAvatar, styleId }
}

function careForPlant() {
  if (!careForGarden()) return
  growthAnimationKey.value += 1
}
</script>

<template>
  <section class="garden-view page-wrap" aria-labelledby="garden-title">
    <div class="garden-heading">
      <p class="day-note"><PhPlant weight="fill" />每一次完成，都留在这里</p>
      <h2 id="garden-title">慢慢长大的<br /><em>家庭小院</em></h2>
    </div>

    <div class="garden-scene-card">
      <GardenScene :state="garden" :preview-stage="previewStage" :growth-key="growthAnimationKey" />
      <div class="scene-badge"><PhPlant weight="fill" /><span>成长第 {{ effectiveGardenStage }} 阶段</span></div>
      <div class="scene-progress-note">
        <PhFlower weight="fill" />
        <span v-if="visibleFlowerCount">已经长出 {{ visibleFlowerCount }} 簇通关花</span>
        <span v-else-if="garden.pendingCare">阳光和水滴已经带回，照顾第一颗种子吧</span>
        <span v-else>完成第一关，这里会长出第一簇花</span>
      </div>
    </div>

    <section class="plant-care-card" aria-labelledby="plant-care-title">
      <div class="plant-care-main">
        <span class="plant-stage-art"><img :src="activePlant.asset" alt="" /></span>
        <div>
          <small>正在照顾 · {{ activePlant.name }}阶段</small>
          <h3 id="plant-care-title">{{ activePlant.note }}</h3>
        </div>
      </div>

      <div class="growth-steps" aria-label="种子成长阶段">
        <span v-for="(item, index) in plantStages" :key="item.name" :class="{ active: index <= garden.activePlantStage }">
          <i>{{ index + 1 }}</i><b>{{ item.name }}</b>
        </span>
      </div>

      <div class="garden-resources">
        <span><PhSun weight="fill" /><b>{{ garden.sunlight }}</b><small>阳光</small></span>
        <span><PhDrop weight="fill" /><b>{{ garden.waterDrops }}</b><small>水滴</small></span>
        <span><PhSparkle weight="fill" /><b>{{ garden.pendingCare }}</b><small>可照顾</small></span>
      </div>

      <button class="care-action" :disabled="!canCare" @click="careForPlant">
        <template v-if="canCare"><PhPlant weight="fill" /><span>用 20 阳光和 1 水滴照顾它</span></template>
        <template v-else-if="garden.pendingCare"><PhSun weight="fill" /><span>再收集一点成长资源</span></template>
        <template v-else><PhFlower weight="fill" /><span>完成一关，带回阳光和水滴</span></template>
      </button>
    </section>

    <div class="growth-card companion-growth-card bloom-growth-card">
      <span class="companion-medallion"><img :src="bloomFlower" :alt="`陪伴花第 ${bloomStage} 阶段`" /></span>
      <div><small>我的陪伴花 · 第 {{ bloomStage }} 阶段</small><strong>今天又舒展了一点</strong><p>{{ nextGrowth }}</p></div>
    </div>

    <div class="garden-stats">
      <div><span class="stat-icon flower"><PhFlower weight="fill" /></span><strong>{{ garden.flowerItems.length }}</strong><small>通关花簇</small></div>
      <div><span class="stat-icon house"><PhHouseLine weight="fill" /></span><strong>{{ garden.houseStage }}</strong><small>小屋阶段</small></div>
      <div><span class="stat-icon tree"><PhTree weight="fill" /></span><strong>{{ garden.streakDays }}</strong><small>相伴天数</small></div>
    </div>

    <section class="plant-collection" aria-labelledby="collection-title">
      <div class="section-heading">
        <span><PhFlower weight="duotone" /></span>
        <div><small>每一株都记得你的照顾</small><h3 id="collection-title">植物收藏 · {{ garden.flowerItems.length }}</h3></div>
      </div>
      <div v-if="garden.flowerItems.length" class="collection-row">
        <span v-for="flower in garden.flowerItems.slice(-6)" :key="flower.id">
          <img :src="TILE_META[flower.type].image" :alt="`${TILE_META[flower.type].name}，收藏于 ${flower.earnedAt}`" />
        </span>
      </div>
      <p v-else class="empty-collection">第一株花正在小院里慢慢长大。</p>
    </section>

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
