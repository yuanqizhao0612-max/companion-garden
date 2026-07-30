<script setup lang="ts">
import { computed } from 'vue'
import { publicAsset } from '../data'
import type { GardenState } from '../types'

const props = defineProps<{ state: GardenState; compact?: boolean; previewStage?: number; growthKey?: number }>()
const stage = computed(() => props.previewStage ?? props.state.gardenLevel)
const scene = publicAsset('assets/garden-v5/garden-empty-v5.webp')
const growthAssets = [
  publicAsset('assets/growth-v03/seed-v03.png'),
  publicAsset('assets/growth-v03/sprout-v03.png'),
  publicAsset('assets/growth-v03/bud-v03.png'),
  publicAsset('assets/growth-v03/bloom-v03.png'),
]
const activePlantStage = computed(() => props.previewStage === undefined
  ? props.state.activePlantStage
  : Math.max(0, Math.min(3, props.previewStage - 1)) as GardenState['activePlantStage'])
const activePlantAsset = computed(() => growthAssets[activePlantStage.value])
const flowerAssets = [
  publicAsset('assets/garden-v5/tulips-coral-v5.png'),
  publicAsset('assets/garden-v5/tulips-sun-v5.png'),
  publicAsset('assets/garden-v5/tulips-mixed-v5.png'),
]
const placements = [
  { left: 44, top: 68, width: 15 }, { left: 65, top: 72, width: 13 },
  { left: 30, top: 76, width: 14 }, { left: 79, top: 80, width: 15 },
  { left: 53, top: 83, width: 16 }, { left: 18, top: 86, width: 15 },
  { left: 69, top: 89, width: 17 }, { left: 37, top: 92, width: 17 },
  { left: 87, top: 94, width: 18 }, { left: 10, top: 96, width: 17 },
  { left: 55, top: 98, width: 19 }, { left: 25, top: 63, width: 11 },
  { left: 74, top: 61, width: 10 }, { left: 37, top: 57, width: 10 },
  { left: 89, top: 69, width: 12 }, { left: 12, top: 71, width: 12 },
  { left: 59, top: 64, width: 11 }, { left: 47, top: 75, width: 12 },
  { left: 22, top: 91, width: 12 }, { left: 77, top: 97, width: 14 },
  { left: 44, top: 88, width: 13 }, { left: 62, top: 94, width: 14 },
  { left: 33, top: 98, width: 14 }, { left: 92, top: 86, width: 12 },
]
const previewFlowerCount = computed(() => props.previewStage === undefined
  ? props.state.flowerItems.length
  : [0, 3, 7, 12, 18][Math.max(0, Math.min(4, stage.value - 1))])
const visibleFlowers = computed(() => placements.slice(0, previewFlowerCount.value).map((placement, index) => ({
  ...placement,
  asset: flowerAssets[index % flowerAssets.length],
  flip: index % 4 === 1 || index % 5 === 3,
  delay: Math.min(index, 10) * 45,
})))
</script>

<template>
  <figure class="story-garden" :class="{ compact }" :data-stage="stage" aria-label="正在成长的家庭小院">
    <img class="garden-base" :src="scene" alt="等待花朵生长的空白家庭小院" />
    <div class="garden-flower-layer" aria-hidden="true">
      <img
        v-for="(flower, index) in visibleFlowers"
        :key="`${index}-${flower.asset}`"
        class="earned-flower"
        :class="{ flipped: flower.flip }"
        :src="flower.asset"
        alt=""
        :style="{
          left: `${flower.left}%`,
          top: `${flower.top}%`,
          width: `${flower.width}%`,
          zIndex: Math.round(flower.top),
          animationDelay: `${flower.delay}ms`,
        }"
      />
      <img
        :key="`${activePlantStage}-${growthKey ?? 0}`"
        class="active-growing-plant"
        :class="`plant-stage-${activePlantStage}`"
        :src="activePlantAsset"
        alt=""
      />
    </div>
  </figure>
</template>

<style scoped>
.story-garden { position: relative; width: 100%; aspect-ratio: 4 / 5; margin: 0; overflow: hidden; border-radius: 24px; background: #eef0e1; }
.garden-base { display: block; width: 100%; height: 100%; object-fit: cover; }
.garden-flower-layer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.earned-flower {
  position: absolute;
  height: auto;
  transform: translate(-50%, -100%);
  transform-origin: 50% 100%;
  filter: drop-shadow(0 4px 5px rgba(74, 95, 42, .18));
  animation: garden-grow-in .72s cubic-bezier(.16, .92, .26, 1.16) both;
}
.earned-flower.flipped { transform: translate(-50%, -100%) scaleX(-1); animation-name: garden-grow-in-flipped; }
.active-growing-plant {
  position: absolute;
  z-index: 120;
  left: 51%;
  top: 94%;
  width: 25%;
  height: auto;
  transform: translate(-50%, -100%);
  transform-origin: 50% 100%;
  filter: drop-shadow(0 5px 7px rgba(74, 77, 35, .2));
  animation: active-plant-grow .92s cubic-bezier(.14, .9, .22, 1.12) both;
}
.active-growing-plant.plant-stage-0 { width: 17%; }
.active-growing-plant.plant-stage-1 { width: 19%; }
.active-growing-plant.plant-stage-2 { width: 22%; }
.active-growing-plant.plant-stage-3 { width: 28%; }
.story-garden.compact { aspect-ratio: 355 / 265; }
.story-garden.compact .garden-base { object-position: center 56%; }

@keyframes garden-grow-in {
  0% { opacity: 0; transform: translate(-50%, -78%) scale(.36); }
  62% { opacity: 1; transform: translate(-50%, -103%) scale(1.08); }
  100% { transform: translate(-50%, -100%) scale(1); }
}
@keyframes garden-grow-in-flipped {
  0% { opacity: 0; transform: translate(-50%, -78%) scale(.36) scaleX(-1); }
  62% { opacity: 1; transform: translate(-50%, -103%) scale(1.08) scaleX(-1); }
  100% { transform: translate(-50%, -100%) scaleX(-1); }
}
@keyframes active-plant-grow {
  0% { opacity: .15; transform: translate(-50%, -72%) scale(.38); }
  58% { opacity: 1; transform: translate(-50%, -104%) scale(1.08); }
  100% { transform: translate(-50%, -100%) scale(1); }
}
</style>
